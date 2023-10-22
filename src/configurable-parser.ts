import { fs } from "../deps.ts";

import {
    cleanAndParseFloat, Close,
    getAllMessages as parserGetAllMessages,
    Message,
    Order,
    parseMessagePipeline, parseOrderText, parseClose,
    PartialParser,
} from "./parser.ts";
import {
    parseCancelled,
    parseEntry,
    parseEntryAll,
    parseOpposite,
    parseSL,
    parseSLAfterTP,
    parseTP,
    parseTPAll, parseTPWithoutProfit
} from "./generic.ts";
import {validateOrder} from "./order.ts";
import * as path from "https://deno.land/std@0.188.0/path/mod.ts";

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

interface MainPattern {
    order: RegexPattern[];
    close: RegexPattern[];
}

export type Preprocessor = {
    pattern: string;
    replacement: string;
};

interface ParserConfig {
    name: string;
    shortcut: string;
    preprocessing?: Preprocessor[];
    patterns: MainPattern;
    patternsToIgnore: BaseRegexPattern[];
}

export function getNumbers(message: string) {
    const numbers = [ ...message?.matchAll(/[\d.,]+/g) ];
    return numbers.map(x => parseFloat(x?.[0]?.trim() ?? '')); // EP, TP, SL
}

export function parseTargets(targetsStr: string) {
    const targetSubpattern = / (?<targetValue>[\d.]+)/g;
    const targetMatches = [ ...targetsStr.matchAll(targetSubpattern) ].map((x, idx) => ({
        tp: idx + 1,
        value: cleanAndParseFloat(x.groups?.targetValue ?? ""),
    }));

    return targetMatches.map((x) => x.value);
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
        let flags = undefined;

        const lastSlash = pattern.lastIndexOf('/');
        if (pattern[0] === '/' && lastSlash !== 0) {
            flags = pattern.substring(lastSlash + 1);
            pattern = pattern.substring(1, lastSlash);
        }

        return new RegExp(pattern, flags);
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
        const result = groups.reduce((result, key) => {
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

            return result as Record<string, any>;
        }, {} as Record<string, any>);

        result.exchange ??= null;
        result.leverage ??= 1;

        const targets = result?.targets ?? result?.takeProfits ?? [];
        const coin = result?.coin?.trim()?.toUpperCase();
        const entry = result?.entry ?? [];
        const stopLoss = result?.sl != null ? parseFloat(result?.sl) : null;

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

    return () => {
        const parserConfig: ParserConfig = getFileContent(config.parserConfigPath);
        const configurableParser = new ConfigurableParser(parserConfig);

        return configurableParser.getAllMessages();
    };
}

export const configurableParsers = new Map<string, ConfigurableParser>();

export async function loadConfigurableParsers(directory?: string) {
    const __dirname = path.dirname(path.fromFileUrl(import.meta.url));
    const allParsers: ConfigurableParser[] = [];
    const groupsPath = path.join(__dirname, '..', 'groups');
    const dir = directory ?? groupsPath;

    const isReadableDir = await fs.exists(dir, {
        isReadable: true,
        isDirectory: true
    });

    if (isReadableDir) {
        for await (const dirEntry of Deno.readDir(dir)) {
            if (dirEntry.isFile && dirEntry.name.endsWith(".json")) {
                const parserConfig: ParserConfig = getFileContent(`${dir}/${dirEntry.name}`);
                const configurableParser = new ConfigurableParser(parserConfig);
                allParsers.push(configurableParser);
            }
        }
    }

    return allParsers;
}

export class ConfigurableParser {
    private readonly parserConfig: ParserConfig;

    get name() {
        return this.parserConfig?.name;
    }

    get shortcut() {
        return this.parserConfig?.shortcut;
    }

    constructor(parserConfig: ParserConfig) {
        this.parserConfig = parserConfig;
    }

    looksLikeOrder(message: string): boolean {
        const patternsToIgnore = this.parserConfig?.patternsToIgnore ?? [];
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

    parseOrderString(message: string, config?: ParserConfig): Partial<Order> | null {
        config ??= this.parserConfig;

        if (!this.looksLikeOrder(message)) {
            return null;
        }

        const preprocessors = config.preprocessing ?? [];
        for (const preProcess of preprocessors) {
            message = message.replaceAll(new RegExp(preProcess.pattern, 'g'), preProcess.replacement);
        }

        const allPatterns = config.patterns?.order ?? [];
        const simplePatterns = allPatterns.filter(x => typeof x === 'string' || !Object.hasOwn(x, 'subpattern')) as BaseRegexPattern[]
        const complexPatterns = allPatterns.filter(x => typeof x === 'object' && Object.hasOwn(x, 'subpattern')) as RegexPatternWithSubpattern[];

        return parseOrderStringFromSimplePatterns(message, simplePatterns)
            ?? parseOrderStringFromPatternWithSubpatterns(message, complexPatterns)
            ?? { type: 'probablyOrder' as any, text: message } as any;
    }

    parseOrder(messageDiv: HTMLElement): Partial<Order> | null {
        const textDiv = messageDiv.getElementsByClassName('text')?.[0] as HTMLElement;

        if (textDiv == null) {
            return null;
        }

        textDiv.innerHTML = textDiv?.innerHTML?.replaceAll('<br>', "<br>\n");
        const text = textDiv?.innerText?.trim() ?? '';

        return this.parseOrderString(text);
    }

    parseClose(messageDiv: HTMLElement): Partial<Close> | null {
        const allPatterns = this.parserConfig.patterns?.close ?? [];
        const simplePatterns = allPatterns.filter(x => typeof x === 'string' || !Object.hasOwn(x, 'subpattern')) as BaseRegexPattern[]
        const complexPatterns = allPatterns.filter(x => typeof x === 'object' && Object.hasOwn(x, 'subpattern')) as RegexPatternWithSubpattern[];

        const regexPatterns = simplePatterns.map(x => getRegExpObject(x));

        for (const pattern of regexPatterns) {
            const result = parseClose(messageDiv, pattern);

            if (result != null) {
                return result;
            }
        }

        return null;
    }

    parseMessage(messageDiv: HTMLElement): Message {
        const pipeline: PartialParser[] = [
            this.parseOrder.bind(this),
            parseEntry,
            parseEntryAll,
            this.parseClose.bind(this),
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

    getAllMessages(): Message[] {
        return parserGetAllMessages(this.parseMessage.bind(this));
    }
}

export async function loadConfigurableParsersInline() {
    const signals = await loadConfigurableParsers();
    signals.forEach(x => configurableParsers.set(x.shortcut, x));
}

export function getAllMessagesFromParser(parser: ConfigurableParser) {
    return () => {
        return parser.getAllMessages();
    };
}
