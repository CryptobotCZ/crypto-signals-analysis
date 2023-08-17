import * as fs from "https://deno.land/std@0.198.0/fs/mod.ts";

import {
    cleanAndParseFloat,
    getAllMessages as parserGetAllMessages,
    Message,
    Order,
    parseMessagePipeline, parseOrderText,
    PartialParser,
} from "./parser.ts";
import {
    parseCancelled,
    parseClose,
    parseEntry,
    parseEntryAll,
    parseOpposite,
    parseSL,
    parseSLAfterTP,
    parseTP,
    parseTPAll, parseTPWithoutProfit
} from "./generic.ts";
import {validateOrder} from "./order.ts";

const savedConfigurations = [];
let mode = 'number';

type BaseRegexPattern = string | { pattern: string } | { pattern: string, flags: string };
type RegexPatternWithSubpattern = BaseRegexPattern & { subpattern: Subpattern };
type RegexPattern = BaseRegexPattern | RegexPatternWithSubpattern;

interface Subpattern {
    tps?: BaseRegexPattern;
    entries?: BaseRegexPattern;
    coin?: BaseRegexPattern;
    direction?: BaseRegexPattern;
    leverage?: BaseRegexPattern;
    sl?: BaseRegexPattern;
}

export type Preprocessor = {
    pattern: string;
    replacement: string;
};

interface ParserConfig {
    preprocessing?: Preprocessor[];
    patterns: RegexPattern[];
    patternsToIgnore: BaseRegexPattern[];
}

let parserConfig: ParserConfig = {} as any;

export function getNumbers(message: string) {
    const numbers = [ ...message?.matchAll(/[\d.,]+/g) ];
    return numbers.map(x => parseFloat(x?.[0]?.trim() ?? '')); // EP, TP, SL
}

export function looksLikeOrder(message: string): boolean {
    const patternsToIgnore = parserConfig?.patternsToIgnore ?? [];
    for (const pattern of patternsToIgnore) {
        const regex = getRegExpObject(pattern);

        if (message?.match(regex)) {
            return false;
        }
    }

    const numbers = getNumbers(message);
    const enoughNumbers = numbers.length >= 3; // EP, TP, SL

    if ((message?.match(/entry|leverage|lev/gusi) && message?.match(/stoploss|stop|loss|sl/gusi))) {
         return enoughNumbers;
    }

    return false;
}

export function parseTargets(targetsStr: string) {
    const targetSubpattern = / (?<targetValue>[\d.]+)/g;
    const targetMatches = [ ...targetsStr.matchAll(targetSubpattern) ].map((x, idx) => ({
        tp: idx + 1,
        value: cleanAndParseFloat(x.groups?.targetValue ?? ""),
    }));

    return targetMatches.map((x) => x.value);
}


export function parseOrderString(message: string): Partial<Order> | null {
    if (!looksLikeOrder(message)) {
        return null;
    }

    const preprocessors = parserConfig.preprocessing ?? [];
    for (const preProcess of preprocessors) {
        message = message.replaceAll(new RegExp(preProcess.pattern, 'g'), preProcess.replacement);
    }

    const allPatterns = parserConfig.patterns ?? [];
    const simplePatterns = allPatterns.filter(x => typeof x === 'string' || !Object.hasOwn(x, 'subpattern')) as BaseRegexPattern[]
    const complexPatterns = allPatterns.filter(x => typeof x === 'object' && Object.hasOwn(x, 'subpattern')) as RegexPatternWithSubpattern[];

    return parseOrderStringFromSimplePatterns(message, simplePatterns)
        ?? parseOrderStringFromPatternWithSubpatterns(message, complexPatterns)
        ?? { type: 'probablyOrder' as any, text: message } as any;
}

export function parseOrderStringFromSimplePatterns(message: string, patterns: BaseRegexPattern[]) {
    const regexPatterns = patterns.map(x => getRegExpObject(x));

    for (const pattern of regexPatterns) {
        const result = parseOrderText(message, pattern);

        if (result != null && validateOrder(result as any)) {
            return result;
        }
    }

    return null;
}

export function getRegExpObject(pattern: BaseRegexPattern): RegExp {
    if (typeof pattern === 'string') {
        const parts = pattern.split('/');
        return new RegExp(parts[1], parts?.[2] ?? undefined);
    } else if (!Object.hasOwn(pattern, 'flags')) {
        return getRegExpObject(pattern.pattern);
    } else {
        // fck TypeScript, sometimes it can be pain in the ass..
        const flags = Object.hasOwn(pattern, 'flags') ? (pattern as any)?.['flags'] ?? undefined : undefined;
        return new RegExp(pattern.pattern, flags);
    }
}

export function parseOrderStringFromPatternWithSubpatterns(message: string, patterns: RegexPatternWithSubpattern[]) {
    for (const patternObject of patterns) {
        const pattern = getRegExpObject(patternObject);
        const match = pattern.exec(message);

        if (!match) {
            continue;
        }

        const groups = ['coin', 'entry', 'takeProfits', 'sl', 'leverage', 'exchange', 'direction', ];

        // fck TS, these dances around reduce to make it type-check are tedious...
        const result = groups.reduce((key: any, result: any) => {
            const strToMatch = match.groups?.[key];
            result[key] = strToMatch;

            const subpatternObj = patternObject.subpattern[key as keyof Subpattern];
            if (subpatternObj) {
                const subpattern = getRegExpObject(subpatternObj);
                const subpatternMatches = [ ...strToMatch?.matchAll(subpattern) ?? [] ];

                if (key === 'takeProfits' || key === 'entry') {
                    result[key] = subpatternMatches.map(x => cleanAndParseFloat(x?.[1] ?? ""));
                } else {
                    result[key] = subpatternMatches[0];
                }
            }

            return result as any;
        }, {} as Record<string, any>) as Record<string, any>;

        result.exchange ??= null;
        result.leverage ??= 1;

        const targets = result?.targets ?? [];
        const coin = result?.coin?.trim()?.toUpperCase();
        const entry = result?.entry ?? [];
        const stopLoss = result?.sl ?? null;

        const directionText = result?.direction
            ?.replace(/sell/i, 'short')
            ?.replace(/buy/i, 'LONG')
            ?.toUpperCase();
        const direction = directionText ?? (targets[0] < entry[0] ? 'SHORT' : 'LONG');

        const parsedMessage = {
            type: "order" as any,
            coin: coin,
            direction: direction,
            exchange: result?.exchange ?? null,
            leverage: result?.leverage ?? 1,
            entry: entry,
            targets: targets,
            stopLoss: stopLoss,
        };

        if (validateOrder(parsedMessage as any)) {
            return parsedMessage;
        }
    }

    return null;
}

export function parseOrderStringPositional(message: string) {
    const directionPattern = /buy|sell|short|long/gusi;
    const coinPattern = /(\w+\/?USDT)/gusi;
    const leveragePattern = /(lev|leverage)\D*([\d.]+)/ui;

    const directionMatch = directionPattern.exec(message);
    const coinMatch = coinPattern.exec(message);
    const leverageMatch = leveragePattern.exec(message);

    if (!directionMatch || !coinMatch || !leverageMatch) {
        return null;
    }

    const targetsStr = '';
    const numbers = getNumbers(message).toSorted();
    const targets = parseTargets(targetsStr);

    const coin = coinMatch.groups?.coin ?? coinMatch[1];
    const direction = directionMatch.groups?.direction.toUpperCase();
    const exchange = null;
    const leverage = 1;
    const entry = directionMatch.groups?.entry?.trim().replace("- ", "")?.split("-").map((x) =>
        cleanAndParseFloat(x.trim().replace('$', ''))
    );

    const stopLoss = parseTargets(directionMatch.groups?.sl ?? '')?.[0];

    const parsedMessage = {
        type: "order" as any,
        coin: coin,
        direction: direction,
        exchange: exchange,
        leverage: leverage,
        entry: entry,
        targets: targets,
        stopLoss: stopLoss,
    };
}

export function parseOrder(messageDiv: HTMLElement): Partial<Order> | null {
    const text = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim() ?? '';
    return parseOrderString(text);
}

export function parseMessage(messageDiv: HTMLElement): Message {
    const pipeline: PartialParser[] = [
        parseOrder,
        parseEntry,
        parseEntryAll,
        parseClose,
        parseOpposite,
        parseSLAfterTP,
        parseSL,
        parseTP,
        parseTPAll,
        parseCancelled,
        parseTPWithoutProfit,
    ];

    return parseMessagePipeline(messageDiv, pipeline);
}

export function getAllMessages(): Message[] {
    return parserGetAllMessages(parseMessage);
}

export function getFileContent<T>(path: string): T {
    const isReadableFile = fs.existsSync(path, {
        isReadable: true,
        isFile: true,
    });

    if (!isReadableFile) {
        throw new Error(`Invalid file ${path}`);
    }

    const fileContent = Deno.readTextFileSync(path);
    const fixedFileContent = fileContent
        ?.replace(/\n/g, " ")
        ?.replace(/\r/g, " ")
        ?.replace(/\t/g, " ") ?? "";

    return JSON.parse(fixedFileContent) as T;
}

export function getConfigurableParser(config?: any) {
    if (!config?.parserConfigPath) {
        console.error('Missing parseConfigPath');
    }

    parserConfig = getFileContent(config.parserConfigPath);

    return getAllMessages;
}
