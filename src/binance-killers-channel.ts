import {
    parseSpotOrder as baseParseSpotOrder,
    parseEntry as baseParseEntry,
    parseEntryAll as baseParseEntryAll,
    parseClose as baseParseClose,
    parseCancelled as baseParseCancelled,
    parseOpposite as baseParseOpposite,
    parseSLAfterTP as baseParseSLAfterTP,
    parseSL as baseParseSL,
    parseTP as baseParseTP,
    parseTPWithoutProfit as baseParseTPWithoutProfit,
    parseTPAll as baseParseTPAll,
    Order,
    Entry,
    EntryAll,
    Close,
    Cancel,
    Opposite,
    SLAfterTP,
    StopLoss,
    TakeProfit,
    TakeProfitAll,
    Message,
    parseMessagePipeline,
    PartialParser,
} from "./parser.ts";

export interface BKOrder extends Order {
    signalId: string;
}

export function parseOrder(messageDiv: HTMLElement): Partial<Order> | null {
    const text = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim() ?? '';
    return parseOrderText(text);
}

export function parseOrderText(message: string): Partial<Order> | null {
    if (!message.match(/SIGNAL/)) {
        return null;
    }

    const patterns = [
        /SIGNAL ID: #(?<signalId>\d+).*COIN: \$?(?<coin>.+) (?<leverage>\(.*\))\n?Direction: (?<direction>\w+).*ENTRY: (?<entry>.+)\n?OTE: (?<ote>[\d\.\,]+).*TARGETS\n?Short Term: (?<shortTerm>.+)\n?Mid Term: (?<midTerm>.+)STOP LOSS: (?<sl>[\d\.\,]+)/s,
        /SIGNAL ID: #(?<signalId>\d+).*\nCOIN: \$?(?<coin>.+) (?<leverage>\(.*\))\n?Direction: (?<direction>\w+).*ENTRY: (?<entry>.+)\nOTE: (?<ote>.+)\n\nTARGETS\nShort Term: (?<shortTerm>.+)\nMid Term: (?<midTerm>.+)\n\nSTOP LOSS: (?<sl>[\d\.]+)\n/gs,
        /SIGNAL ID: ?#?(?<signalId>\d+).* ?COIN: \$?(?<coin>.+) (?<leverage>\(.*\)).*ENTRY: (?<entry>.+)\n?OTE: (?<ote>.+)\n*TARGETS.*Short Term: (?<shortTerm>.+)\n*Mid Term: (?<midTerm>.+)\n?STOP LOSS: \w+ ?(?<sl>[\d.,]+)/gms
    ];

    for (const pattern of patterns) {
        const match = pattern.exec(message);

        if (!match) {
            continue;
        }

        const signalId = match.groups?.signalId;
        const coin = match.groups?.coin;
        const direction = match.groups?.direction ?? "";
        const exchange = '';
        const leverage =  match.groups?.leverage;
        const entry = match.groups?.entry.trim().split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
        const ote = parseFloat(match.groups?.ote?.trim()?.replace(",", "") ?? "");
        const shortTermTargets = match.groups?.shortTerm.split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x)) ?? [];
        const midTermTargets = match.groups?.midTerm.split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x)) ?? [];
        const targets = [ ...shortTermTargets, ...midTermTargets ];
        const stopLoss = parseFloat(match.groups?.sl?.trim()?.replace(",", "") ?? "");

        const parsedMessage = {
            type: 'order' as any,
            signalId,
            coin,
            direction,
            exchange,
            leverage,
            entry,
            ote,
            targets,
            shortTermTargets,
            midTermTargets,
            stopLoss,
        };

        return parsedMessage as any;
    }

    return null;
}

export function parseSpotOrder(messageDiv: HTMLElement): Partial<Order> | null {
    const pattern = /COIN: \$?(?<coin>.+)Direction: (.+)ENTRY: (.+)TARGETS: (.+)STOP LOSS: (.+)/g;
    return baseParseSpotOrder(messageDiv, pattern);
}

export function parseEntry(messageDiv: HTMLElement): Partial<Entry> | null {
    const entryPattern = /(.*)\n?\#(.*) Entry (?:target )?(\d+).*\n?Average Entry Price: (\d*\.?\d*)/gm;
    return baseParseEntry(messageDiv, entryPattern);
}

export function parseEntryAll(messageDiv: HTMLElement): Partial<EntryAll> | null {
    const entryPattern = /(.*)\n?#(.*) All entry targets achieved\n?Average Entry Price: (\d*\.?\d*)/gm;
    return baseParseEntryAll(messageDiv, entryPattern);
}

export function parseClose(messageDiv: HTMLElement): Partial<Close> | null {
    const entryPattern = /CLOSE (?<coin>.*)/;
    return baseParseClose(messageDiv, entryPattern);
}

export function parseCancelled(messageDiv: HTMLElement): Partial<Cancel> | null {
    const entryPattern = /(.*)\n?#(?<coin>.*) Cancelled ❌\n?Target achieved before entering the entry zone/;
    return baseParseCancelled(messageDiv, entryPattern);
}

export function parseOpposite(messageDiv: HTMLElement): Partial<Opposite> | null {
    const pattern = /(.*)\n?#(?<coin>.*) Closed due to opposite direction signal/gm;
    return baseParseOpposite(messageDiv, pattern);
}

export function parseSLAfterTP(messageDiv: HTMLElement): Partial<SLAfterTP> | null {
    const pattern = /(.*)\n?#(?<coin>.*) Closed at .*stoploss after reaching take profit/gm;
    return baseParseSLAfterTP(messageDiv, pattern);
}

export function parseSL(messageDiv: HTMLElement): Partial<StopLoss> | null {
    const pattern = /(.*)\n?#(?<coin>.*) Stoploss ⛔\n?Loss: ([\d\.\%]+) 📉/gm;
    return baseParseSL(messageDiv, pattern);
}

export function parseTPString(message: string): Partial<TakeProfit> | null {
    if (!message.match(/SIGNAL/) && !message.match(/Target/)) {
        return null;
    }

    console.log( { message } );
    const pattern = /SIGNAL ID: #?(?<signalId>\d+).*COIN: \$?(?<coin>[^ ]+) \((?<leverageRange>[^\)]+x)\)\n?Direction: (?<direction>LONG|SHORT)[📉📈\n➖]*(?<targets>((?:(Short|Mid) Term )?Target \d+: ([\d,\.]+)?✅\n?)*)\n*🔥(?<profit>[\d,.%]+) Profit \((?<leverage>\d+)x(?: leverage)?\)/gum

    const matches = pattern.exec(message);

    console.log(matches);

    if (!matches) {
        return null;
    }

    const data = matches.groups;

    const targets = matches.groups?.targets ?? '';
    const targetSubpattern = /(?:(Short|Mid) Term )?Target (?<target>\d+): (?<targetValue>[\d\.,]+)?/g;
    const targetMatches = [ ... targets.matchAll(targetSubpattern) ].map((x, idx) => ({
        tp: idx + 1, // parseInt(x.groups?.target ?? ''),
        value: x.groups?.targetValue
    }));

    return {
        type: 'TP',
        coin: data?.coin,
        tp: targetMatches?.pop()?.tp,
        pctStr: data?.profit,
        pct: parseFloat(data?.profit?.replace('%', '') ?? '')
    };
}

export function parseTP(messageDiv: HTMLElement): Partial<TakeProfit> | null {
    const text = messageDiv.innerText ?? "";
    return parseTPString(text);
}

export function parseTPWithoutProfit(messageDiv: HTMLElement): Partial<TakeProfit> | null {
    const pattern = /(.*)\n?#(?<coin>.*) Take-Profit target (\d+) ✅\n?\n?Period: (.*) ⏰/gm;
    return baseParseTPWithoutProfit(messageDiv, pattern);
}

export function parseTPAll(messageDiv: HTMLElement): Partial<TakeProfitAll> | null {
    const pattern = /(.*)\n?#(?<coin>.*) All take-profit targets achieved 😎\n?Profit: ([\d\.\%]+) .*\n?Period: (.*) ⏰/gm;
    return baseParseTPAll(messageDiv, pattern);
}

export function parseMessage(messageDiv: HTMLElement): Message {
    const pipeline: PartialParser[] = [
        parseOrder,
        parseSpotOrder,
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
    const $$ = (selector: string) => Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    const messages = $$('.message.default').map(x => parseMessage(x));

    return messages;
}
