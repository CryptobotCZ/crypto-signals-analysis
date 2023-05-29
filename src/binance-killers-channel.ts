import {
    parseOrder as baseParseOrder,
    parseOrderText as baseParseOrderText,
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

//    const pattern = /SIGNAL ID: #(\d+).* COIN: \$?(.+) (\(.*\))\n?Direction: (.+)\n.*ENTRY: (.+)\nOTE: (.+)\n\nTARGETS\nShort Term: (.+)\nMid Term: (.+)\n\nSTOP LOSS: (.+)/g;
    const pattern = /SIGNAL ID: #(\d+).*\nCOIN: \$?(.+) (\(.*\))\n?Direction: (\w+).*ENTRY: (.+)\nOTE: (.+)\n\nTARGETS\nShort Term: (.+)\nMid Term: (.+)\n\nSTOP LOSS: ([\d\.]+)\n/gs
    const match = pattern.exec(message);

    if (!match) {
        return parseOrderText2(message);
    }

    const signalId = match[1];
    const coin = match[2];
    const direction = match[4];
    const exchange = '';
    const leverage = match[3];
    const entry = match[5].trim().split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
    const ote = parseFloat(match[6].trim().replace(",", ""));
    const shortTermTargets = match[7].split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
    const midTermTargets = match[8].split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
    const targets = [ ...shortTermTargets, ...midTermTargets ];
    const stopLoss = parseFloat(match[9].trim().replace(",", ""));

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

export function parseOrderText2(message: string) {
    //    const pattern = /SIGNAL ID: #?(\d+).* ?COIN: \$?(.+) (\(.*\)).*ENTRY: (.+)\n?OTE: (.+)\n?TARGETS\n?Short Term: (.+)Mid Term: (.+)\n?STOP LOSS: \w+ ?([\d.]+)/;
        const pattern = /SIGNAL ID: #(\d+).*COIN: \$?(.+) (\(.*\))\n?Direction: (\w+).*ENTRY: (.+)\n?OTE: ([\d\.\,]+).*TARGETS\n?Short Term: (.+)\n?Mid Term: (.+)STOP LOSS: ([\d\.\,]+)/s;
//        const pattern = /SIGNAL ID: #?(\d+).* ?COIN: \$?(.+) (\(.*\)).*ENTRY: (.+)\n?OTE: (.+)\n*TARGETS.*Short Term: (.+)\n*Mid Term: (.+)\n?STOP LOSS: \w+ ?([\d.]+)/gms;
        const match = pattern.exec(message);

        if (!match) {
            return parseOrderText3(message);

            const signalPattern = /SIGNAL ID: #?(\d+)./
            const signalMatch = signalPattern.exec(message);
            return null;

            return signalMatch ? { type: 'unknown', message: message, signalId: signalMatch[1] } : null;
    //        return null;
        }

        const signalId = match[1];
        const coin = match[2];
        const direction = match[4];
        const exchange = '';
        const leverage = match[3];
        const entry = match[5].trim().split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
        const ote = parseFloat(match[6].trim().replace(",", ""));
        const shortTermTargets = match[7].split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
        const midTermTargets = match[8].split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
        const targets = [ ...shortTermTargets, ...midTermTargets ];
        const stopLoss = parseFloat(match[9].trim().replace(",", ""));

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

export function parseOrderText3(message: string) {
        const pattern = /SIGNAL ID: ?#?(\d+).* ?COIN: \$?(.+) (\(.*\)).*ENTRY: (.+)\n?OTE: (.+)\n*TARGETS.*Short Term: (.+)\n*Mid Term: (.+)\n?STOP LOSS: \w+ ?([\d.,]+)/gms;
        const match = pattern.exec(message);

        if (!match) {
            return null;
        }

        const signalId = match[1];
        const coin = match[2];
        const direction = '';
        const exchange = '';
        const leverage = match[3];
        const entry = match[4].trim().split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
        const ote = parseFloat(match[5].trim().replace(",", ""));
        const shortTermTargets = match[6].split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
        const midTermTargets = match[7].split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
        const targets = [ ...shortTermTargets, ...midTermTargets ];
        const stopLoss = parseFloat(match[8].trim().replace(",", ""));

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


export function parseOrder2(messageDiv: HTMLElement): Partial<Order> | null {
    const pattern2 = /SIGNAL ID: #(\d+).* COIN: \$?(.+) (\(.*\))\n?Direction: (.+)\n.*ENTRY: (.+)\nOTE: (.+)\n\nTARGETS\nShort Term: (.+)\nMid Term: (.+)\n\nSTOP LOSS: (.+)/g;
    const pattern = /COIN: \$?(.+)\nDirection: (.+)\nExchange: (.+)\nLeverage: (.+)\n\nENTRY: (.+)\nOTE: (.+)\n\nTARGETS\nShort Term: (.+)\nMid Term: (.+)\n\nSTOP LOSS: (.+)/g;

    const message = messageDiv.textContent ?? '';

    const match = pattern.exec(message);
    if (match) {
        const coin = match[1];
        const direction = match[2];
        const exchange = match[3];
        const leverage = parseInt(match[4].replace('x', ''));
        const entry = match[5].trim().split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
        const ote = parseFloat(match[6].trim().replace(",", ""));
        const shortTermTargets = match[7].split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
        const midTermTargets = match[8].split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
        const targets = [ ...shortTermTargets, ...midTermTargets ];
        const stopLoss = parseFloat(match[9].trim().replace(",", ""));

        const parsedMessage = {
        type: 'order' as any,
        coin: coin,
        direction: direction,
        exchange: exchange,
        leverage: leverage,
        entry: entry,
        ote,
        targets: targets,
        shortTermTargets,
        midTermTargets,
        stopLoss: stopLoss,
        };

    return parsedMessage;
    }

    return null;
}

export function parseSpotOrder(messageDiv: HTMLElement): Partial<Order> | null {
    const pattern = /COIN: \$?(.+)Direction: (.+)ENTRY: (.+)TARGETS: (.+)STOP LOSS: (.+)/g;
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
    const entryPattern = /CLOSE (.*)/;
    return baseParseClose(messageDiv, entryPattern);
}

export function parseCancelled(messageDiv: HTMLElement): Partial<Cancel> | null {
    const entryPattern = /(.*)\n?#(.*) Cancelled ❌\n?Target achieved before entering the entry zone/;
    return baseParseCancelled(messageDiv, entryPattern);
}

export function parseOpposite(messageDiv: HTMLElement): Partial<Opposite> | null {
    const pattern = /(.*)\n?#(.*) Closed due to opposite direction signal/gm;
    return baseParseOpposite(messageDiv, pattern);
}

export function parseSLAfterTP(messageDiv: HTMLElement): Partial<SLAfterTP> | null {
    const pattern = /(.*)\n?#(.*) Closed at .*stoploss after reaching take profit/gm;
    return baseParseSLAfterTP(messageDiv, pattern);
}

export function parseSL(messageDiv: HTMLElement): Partial<StopLoss> | null {
    const pattern = /(.*)\n?#(.*) Stoploss ⛔\n?Loss: ([\d\.\%]+) 📉/gm;
    return baseParseSL(messageDiv, pattern);
}

export function parseTP(messageDiv: HTMLElement): Partial<TakeProfit> | null {
    const pattern = /(.*)\n?#(.*) Take-Profit target (\d+) ✅\n?Profit: ([\d\.\%]+) 📈\n?Period: (.*) ⏰/gm;
    return baseParseTP(messageDiv, pattern);
}

export function parseTPWithoutProfit(messageDiv: HTMLElement): Partial<TakeProfit> | null {
    const pattern = /(.*)\n?#(.*) Take-Profit target (\d+) ✅\n?\n?Period: (.*) ⏰/gm;
    return baseParseTPWithoutProfit(messageDiv, pattern);
}

export function parseTPAll(messageDiv: HTMLElement): Partial<TakeProfitAll> | null {
    const pattern = /(.*)\n?#(.*) All take-profit targets achieved 😎\n?Profit: ([\d\.\%]+) .*\n?Period: (.*) ⏰/gm;
    return baseParseTPAll(messageDiv, pattern);
}

export function parseMessage(messageDiv: HTMLElement): Message {
    const pipeline: PartialParser[] = [
        parseOrder,
        parseOrder2,
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
