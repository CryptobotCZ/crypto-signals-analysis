import {
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
    OrderDetail,
    parseMessagePipeline,
    PartialParser,
    groupRelatedSignals,
    getOrderSignals,
    getOrderSignalInfoFull,
    mapSLToOrder,
    parseOrderText,
    cleanAndParseFloat,
} from "./parser.ts";

export function parseOrderString(message: string): Partial<Order> | null {
    return parseOrderString01(message) ?? parseOrderString02(message) ?? parseOrderString03(message);
}

export function parseOrderString01(message: string): Partial<Order> | null {
    const pattern = /Coin: #?(?<coin>[^\n]+)\n*.*(?<direction>(?:Short|Long)) .*Set.*\n*(?:Lev|Leverage): (?<leverage>.+)x\n*.*\n*Entry: (?<entry>[^$]+).*\n*Targets?: (?<targets>[^$]+).*\n*Stop-?loss: (?<sl>[^$]+)/gu;
    const match = pattern.exec(message);

    console.log(JSON.stringify(match));
    console.log(match);

    if (!match) {
        return null;
    }

    const coin = match.groups?.coin ?? match[1];
    const direction = (match.groups?.direction ?? match[2]).toUpperCase();
    const exchange = (match.groups?.exchange ?? match[3]);
    const leverageStr = match.groups?.leverage ?? match[4];
    const leverage = parseInt(leverageStr?.split('-')?.[1]?.replace('x', ''));
    const entry = (match.groups?.entry ?? match[5]).trim().split(" - ").map(x => cleanAndParseFloat(x));
    const targets = match.groups?.targets.trim().split(" - ").map(x => cleanAndParseFloat(x));

    const stopLoss = cleanAndParseFloat(match.groups?.sl ?? match[7]);

    const parsedMessage = {
        type: 'order' as any,
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

export function parseOrderString02(message: string): Partial<Order> | null {
    const pattern = /(?<exchange>.+)Pair: (?<coin>.+) (?<direction>.+)\n?Leverage: (?<leverage>.+)\n?Entry: (?<entry>[\d\.,]+)\n?Targets: (?<targets>.+)\n?SL: (?<sl>.+)/mg;

    return parseOrderText(message, pattern);
}

export function parseOrderString03(message: string): Partial<Order> | null {
    const pattern = /(?<coin>.+) (?<direction>.+)\n?Leverage: (?<leverage>.+)\n?Entry: (?<entry>[\d\.,]+)\n?Targets: (?<targets>.+)\n?SL: (?<sl>[\d\.,]+)/mg;

    return parseOrderText(message, pattern);
}

export function parseOrder(messageDiv: HTMLElement): Partial<Order> | null {
    const text = messageDiv.innerText ?? '';
    return parseOrderString(text);
}

export function parseEntry(messageDiv: HTMLElement): Partial<Entry> | null {
    const entryPattern = /(?<exchange>.*)\n?\#(?<coin>.*) Entry (?:target )?(?<entry>\d+).*\n?Average Entry Price: (?<price>\d*\.?\d*)/gm;
    return baseParseEntry(messageDiv, entryPattern);
}

export function parseEntryAll(messageDiv: HTMLElement): Partial<EntryAll> | null {
    const entryPattern = /(?<exchange>.*)\n?#(?<coin>.*) All entry targets achieved\n?Average Entry Price: (?<price>\d*\.?\d*)/gm;
    return baseParseEntryAll(messageDiv, entryPattern);
}

export function parseClose(messageDiv: HTMLElement): Partial<Close> | null {
    const entryPattern = /CLOSE (?<coin>.*)/;
    return baseParseClose(messageDiv, entryPattern);
}

export function parseCancelled(messageDiv: HTMLElement): Partial<Cancel> | null {
    const entryPattern = /(?<exchange>.*)\n?#(?<coin>.*) Cancelled ❌\n?Target achieved before entering the entry zone/;
    return baseParseCancelled(messageDiv, entryPattern);
}

export function parseOpposite(messageDiv: HTMLElement): Partial<Opposite> | null {
    const pattern = /(?<exchange>.*)\n?#(?<coin>.*) Closed due to opposite direction signal/gm;
    return baseParseOpposite(messageDiv, pattern);
}

export function parseSLAfterTP(messageDiv: HTMLElement): Partial<SLAfterTP> | null {
    const pattern = /(?<exchange>.*)\n?#(?<coin>.*) Closed at .*stoploss after reaching take profit/gm;
    return baseParseSLAfterTP(messageDiv, pattern);
}

export function parseSL(messageDiv: HTMLElement): Partial<StopLoss> | null {
    const pattern = /(?<exchange>.*)\n?#(?<coin>.*) Stoploss ⛔\n?Loss: (?<loss>[\d\.\%]+) 📉/gm;
    return baseParseSL(messageDiv, pattern);
}

export function parseTP(messageDiv: HTMLElement): Partial<TakeProfit> | null {
    const pattern = /(?<exchange>.*)\n?#(?<coin>.*) Take-Profit target (?<target>\d+) ✅\n?Profit: (?<profit>[\d\.\%]+) 📈\n?Period: (?<time>.*) ⏰/gm;
    return baseParseTP(messageDiv, pattern);
}

export function parseTPWithoutProfit(messageDiv: HTMLElement): Partial<TakeProfit> | null {
    const pattern = /(?<exchange>.*)\n?#(?<coin>.*) Take-Profit target (?<target>\d+) ✅\n?\n?Period: (?<time>.*) ⏰/gm;
    return baseParseTPWithoutProfit(messageDiv, pattern);
}

export function parseTPAll(messageDiv: HTMLElement): Partial<TakeProfitAll> | null {
    const pattern = /(?<exchange>.*)\n?#(?<coin>.*) All take-profit targets achieved 😎\n?Profit: (?<profit>[\d\.\%]+) .*\n?Period: (?<time>.*) ⏰/gm;
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
    const $$ = (selector: string) => Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    const messages = $$('.message.default').map(x => parseMessage(x));

    return messages;
}

export function parseInBrowser() {
    const $$ = (selector: string) => Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    const messages = $$('.message.default').map(x => parseMessage(x));
    const savedMessages = localStorage.getItem('bk2') ?? '[]';
    const parsedSavedMessages = JSON.parse(savedMessages);
    const allMessages = [...parsedSavedMessages, ...messages].sort((x, y) => x.date = y.date);
    localStorage.setItem('bk2', JSON.stringify(allMessages));

    const messagesWithFixedDate = allMessages.map(x => {
        if (typeof x.date === 'string') {
            return { ...x, date: new Date(x.date) };
        }

        return x;
    });
    const groupedSignals = groupRelatedSignals(messagesWithFixedDate);
    const orderSignals = getOrderSignals(messagesWithFixedDate).map(x => getOrderSignalInfoFull(x, groupedSignals)) as OrderDetail[];

    const slSignals = messagesWithFixedDate.filter(x => x.type == 'SL');
    slSignals.forEach(x => mapSLToOrder(x, orderSignals, groupedSignals, messagesWithFixedDate));

    const binanceFuturesSignals = orderSignals.filter(x => x.order?.exchange == "Binance Futures");

    const binanceFuturesProfitable = binanceFuturesSignals.filter(x => x.tps.length > 1);

    const sumTpPcts = binanceFuturesProfitable.reduce((sum, x) => sum + x.tps[x.tps.length - 1].pct, 0);
    const avgTpPcts = sumTpPcts / binanceFuturesProfitable.length;

    const binanceFuturesSL = binanceFuturesSignals.filter(x => x.sl.length > 1);

    let interestingData = orderSignals.filter(x => x.order.exchange?.toLowerCase() === 'Binance Futures'.toLowerCase()); //.map(x => getSignalInfoFull(x));
    Object.keys(groupedSignals).map(x => groupedSignals[x]).filter(x => x.length == 1).map(x => x[0]).filter(x => x.type == 'TP' && x.exchange?.match('Binance'))
}
