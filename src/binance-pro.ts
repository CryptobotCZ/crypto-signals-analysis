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
    return parseOrderString01(message)
        ?? parseOrderString02(message)
        ?? parseOrderString03(message);
}

export function parseOrderString01(message: string): Partial<Order> | null {
    const patterns = [
        /.*#(?<coin>\S+).*(?<direction>long|short)., x(?<leverage>\d+).*Entry Target = (?<entry>[\d*.]+)\s*SL - (?<sl>\d+-\d+)%\s*Take Profits =\s*(?<takeProfits>[^=]+)\s*[=-]*/gusi
    ];

    for (const pattern of patterns) {
        const match = pattern.exec(message);

        if (!match) {
            continue;
        }

        const targetsStr = match.groups?.takeProfits ?? "";
        const targetSubpattern = /(?<targetValue>[\d.]+) \| (?<totalPct>\d+%)/g;
        const targetMatches = [ ...targetsStr.matchAll(targetSubpattern) ].map((x, idx) => ({
            tp: idx + 1,
            value: cleanAndParseFloat(x.groups?.targetValue ?? ""),
        }));

        const targets = targetMatches.map((x) => x.value);
        const coin = match.groups?.coin?.trim()?.toUpperCase();
        const direction = match.groups?.direction?.toUpperCase();
        const exchange = null;
        const leverage = parseInt(match.groups?.leverage ?? '');
        const entry = match.groups?.entry?.trim()?.split(" - ")?.map((x) => cleanAndParseFloat(x));
        const stopLoss = null; // cleanAndParseFloat(match.groups?.sl ?? match[7]);

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

export function parseOrderString02(message: string): Partial<Order> | null {
    const pattern =
        /(?<exchange>.+)Pair: (?<coin>.+) (?<direction>.+)\n?Leverage: (?<leverage>.+)\n?Entry: (?<entry>[\d\.,]+)\n?Targets: (?<targets>.+)\n?SL: (?<sl>.+)/mg;

    return parseOrderText(message, pattern);
}

export function parseOrderString03(message: string): Partial<Order> | null {
    const pattern =
        /(?<coin>.+) (?<direction>.+)\n?Leverage: (?<leverage>.+)\n?Entry: (?<entry>[\d\.,]+)\n?Targets: (?<targets>.+)\n?SL: (?<sl>[\d\.,]+)/mg;

    return parseOrderText(message, pattern);
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
