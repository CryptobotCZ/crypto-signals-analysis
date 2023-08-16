import {
    Cancel,
    cleanAndParseFloat,
    Close,
    Entry,
    EntryAll,
    getAllMessages as parserGetAllMessages,
    Message,
    Opposite,
    Order,
    parseCancelled as baseParseCancelled,
    parseClose as baseParseClose,
    parseEntry as baseParseEntry,
    parseEntryAll as baseParseEntryAll,
    parseMessagePipeline,
    parseOpposite as baseParseOpposite,
    parseOrderText,
    parseSL as baseParseSL,
    parseSLAfterTP as baseParseSLAfterTP,
    parseTP as baseParseTP,
    parseTPAll as baseParseTPAll,
    parseTPWithoutProfit as baseParseTPWithoutProfit,
    PartialParser,
    SLAfterTP,
    StopLoss,
    TakeProfit,
    TakeProfitAll,
} from "./parser.ts";

export function parseOrderString(message: string): Partial<Order> | null {
    return parseOrderString01(message) ?? parseOrderString02(message);
}

export function parseOrderString02(message: string) {
    if (message.match(/NEW VIP SIGNAL/gusi)) {
        return { type: 'probablyOrder' as any, text: message } as any;
    }

    return null;
}

export function parseOrderString01(message: string): Partial<Order> | null {
    message = message?.replace(' /USDT', '/USDT') ?? '';

    const patterns = [
        /(?<direction>long|short)\s*:\s*(?<coin>\S+)\s*Leverage\s*(?<leverageType>isolated|cross|)\s*(?<leverage>[\d.]+)X.*Entry(?: Zone)?\s*(?<entry>[\d -.\n ]+)[\s\n\\n]*(?<takeProfits>(?:TP\d+\s*[\d.\n\\n ]+)+)\s*.*Stop\s*(?<sl>[\d.]+)/gusi,
        /(?<direction>long|short|sell|buy)\s*:\s*(?<coin>\S+)\s*Leverage\s*(?<leverageType>isolated|cross)\s*(?<leverage>[\d.]+)X.*Entry(?: Zone)?\s*(?<entry>[\d -.\n ]+)[\s\n\\n]*(?<takeProfits>(?:TP\d+\s*[\d.\n\\n ]+)+)\s*.*Stop\s*(?<sl>[\d.]+)/gusi,
    ];

    for (const pattern of patterns) {
        const match = pattern.exec(message);

        if (!match) {
            continue;
        }

        const getTargetWithPercentage = (target: string) => {
            const targetSubpattern = /\d+\) (?<targetValue>[\d.]+)\s*-\s*(?<totalPct>[\d.]+%)/g;
            const targetMatches = [ ...target.matchAll(targetSubpattern) ].map((x, idx) => ({
                tp: idx + 1,
                value: cleanAndParseFloat(x.groups?.targetValue ?? ""),
                percentage: cleanAndParseFloat(x.groups?.totalPct ?? ""),
            }));

            return targetMatches;
        }

        const getTargetValues = (target: string) => {
            const regex = /TP\d+\s(?<targetValue>[\d.]+)/gusi;
            const matches = [ ...target.matchAll(regex) ];

            return matches
                .map(x => x?.groups?.targetValue ?? '')
                .map(x => parseFloat(x));
        };

        const targets = getTargetValues(match.groups?.takeProfits ?? '');
        const coin = match.groups?.coin?.trim()?.toUpperCase();
        const direction = match.groups?.direction
            ?.replace(/sell/i, 'short')
            ?.replace(/buy/i, 'LONG')
            ?.toUpperCase();
        const exchange = match.groups?.exchange ?? null;
        const leverage = parseInt(match.groups?.leverage ?? '');
        const entry = match.groups?.entry?.trim()?.split(/-/)?.map(x => cleanAndParseFloat(x));
        const stopLoss = parseFloat(match.groups?.sl ?? '');

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

        return parsedMessage;
    }

    return null;
}

export function parseOrder(messageDiv: HTMLElement): Partial<Order> | null {
    const text = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim() ?? '';
    return parseOrderString(text);
}

export function parseEntry(messageDiv: HTMLElement): Partial<Entry> | null {
    const entryPattern =
        /(?<exchange>.*)\n?\#(?<coin>.*) Entry (?:target )?(?<entry>\d+).*\n?Average Entry Price: (?<price>\d*\.?\d*)/gm;
    return baseParseEntry(messageDiv, entryPattern);
}

export function parseEntryAll(messageDiv: HTMLElement): Partial<EntryAll> | null {
    const entryPattern =
        /(?<exchange>.*)\n?#(?<coin>.*) All entry targets achieved\n?Average Entry Price: (?<price>\d*\.?\d*)/gm;
    return baseParseEntryAll(messageDiv, entryPattern);
}

export function parseClose(messageDiv: HTMLElement): Partial<Close> | null {
    const entryPattern = /CLOSE (?<coin>.*)/;
    return baseParseClose(messageDiv, entryPattern);
}

export function parseCancelled(messageDiv: HTMLElement): Partial<Cancel> | null {
    const entryPattern =
        /(?<exchange>.*)\n?#(?<coin>.*) Cancelled ❌\n?Target achieved before entering the entry zone/;
    return baseParseCancelled(messageDiv, entryPattern);
}

export function parseOpposite(messageDiv: HTMLElement): Partial<Opposite> | null {
    const pattern =
        /(?<exchange>.*)\n?#(?<coin>.*) Closed due to opposite direction signal/gm;
    return baseParseOpposite(messageDiv, pattern);
}

export function parseSLAfterTP(messageDiv: HTMLElement): Partial<SLAfterTP> | null {
    const pattern =
        /(?<exchange>.*)\n?#(?<coin>.*) Closed at .*stoploss after reaching take profit/gm;
    return baseParseSLAfterTP(messageDiv, pattern);
}

export function parseSL(messageDiv: HTMLElement): Partial<StopLoss> | null {
    const pattern =
        /(?<exchange>.*)\n?#(?<coin>.*) Stoploss ⛔\n?Loss: (?<loss>[\d\.\%]+) 📉/gm;
    return baseParseSL(messageDiv, pattern);
}

export function parseTP(messageDiv: HTMLElement): Partial<TakeProfit> | null {
    if (messageDiv?.innerText?.match(/Mark price/i)) {
        return {
            type: 'infoTp',
        } as any;
    }

    const pattern =
        /(?<exchange>.*)\n?#(?<coin>.*) Take-Profit target (?<target>\d+) ✅\n?Profit: (?<profit>[\d\.\%]+) 📈\n?Period: (?<time>.*) ⏰/gm;
    return baseParseTP(messageDiv, pattern);
}

export function parseTPWithoutProfit(messageDiv: HTMLElement): Partial<TakeProfit> | null {
    const pattern =
        /(?<exchange>.*)\n?#(?<coin>.*) Take-Profit target (?<target>\d+) ✅\n?\n?Period: (?<time>.*) ⏰/gm;
    return baseParseTPWithoutProfit(messageDiv, pattern);
}

export function parseTPAll(messageDiv: HTMLElement): Partial<TakeProfitAll> | null {
    const pattern =
        /(?<exchange>.*)\n?#(?<coin>.*) All take-profit targets achieved 😎\n?Profit: (?<profit>[\d\.\%]+) .*\n?Period: (?<time>.*) ⏰/gm;
    return baseParseTPAll(messageDiv, pattern);
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
