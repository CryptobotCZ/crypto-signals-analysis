import {
parseOrder as baseParseOrder,
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
OrderDetail,
parseMessagePipeline,
PartialParser,
groupRelatedSignals,
getOrderSignals,
getOrderSignalInfoFull,
mapSLToOrder,
} from "./parser.ts";

export function parseOrder(messageDiv: HTMLElement): Partial<Order> | null {
    const pattern = /COIN: \$?(?<coin>.+)Direction: (?<direction>.+)Exchange: (?<exchange>.+)Leverage: (?<leverage>.+)ENTRY: (?<entry>.+)TARGETS: (?<targets>.+)STOP LOSS: (?<sl>.+)/g;
    return baseParseOrder(messageDiv, pattern);
}

export function parseOrder2(messageDiv: HTMLElement): Partial<Order> | null {
    const pattern = /COIN: \$?(?<coin>.+)\nDirection: (?<direction>.+)\nExchange: (?<exchange>.+)\nLeverage: (?<leverage>.+)\n\nENTRY: (?<entry>.+)\nOTE: (?<ote>.+)\n\nTARGETS\nShort Term: (?<shortTerm>.+)\nMid Term: (?<midTerm>.+)\n\nSTOP LOSS: (?<sl>.+)/g;

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
    const pattern = /COIN: \$?(?<coin>.*)Direction: (?<direction>.*)📈?(?:Exchange: )?(?<exchange>.*)ENTRY: (?<entry>.*)TARGETS: (?<targets>.*)STOP LOSS: (?<sl>.*)/gu;
//    const pattern = /COIN: \$?(.*)Direction: (.*)(?:Exchange: )?(.*)ENTRY: (.*)TARGETS: (.*)STOP LOSS: (.*)/g;
    return baseParseSpotOrder(messageDiv, pattern);
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

export function parseInBrowser() {
    const $$ = (selector: string) => Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    const messages = $$('.message.default').map(x => parseMessage(x));
    const savedMessages = localStorage.getItem('bk2') ?? '[]';
    const parsedSavedMessages = JSON.parse(savedMessages);
    const allMessages = [ ...parsedSavedMessages, ...messages ].sort((x, y) => x.date = y.date);
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
    const avgTpPcts =  sumTpPcts / binanceFuturesProfitable.length;

    const binanceFuturesSL = binanceFuturesSignals.filter(x => x.sl.length > 1);

    let interestingData = orderSignals.filter(x => x.order.exchange?.toLowerCase() === 'Binance Futures'.toLowerCase()); //.map(x => getSignalInfoFull(x));
    Object.keys(groupedSignals).map(x => groupedSignals[x]).filter(x => x.length == 1).map(x => x[0]).filter(x => x.type == 'TP' && x.exchange.match('Binance'))
}

// filter(x => x.type == 'entry')
// const mappedSignals = data.reduce((acc, x) => { acc[x.messageId] = [ x ]; return acc; }, {});
// const uniqueSignals = Object.keys(mappedSignals).map(x => mappedSignals[x][0]);
// // const rootSignalIds = new Set(uniqueSignals.filter(x => x.relatedTo != null).map(x => x.relatedTo));
// const rootSignalIds = new Set(uniqueSignals.filter(x => x.relatedTo == null).map(x => x.messageId));
// const rootSignals = Array.from(rootSignalIds).map(x => mappedSignals[x]).filter(x => x != null).map(x => x[0]);
//
// uniqueSignals.filter(x => x.relatedTo != null).forEach(x => {
//     const oldValues = mappedSignals.hasOwnProperty(x.relatedTo) ? mappedSignals[x.relatedTo] : [];
//     mappedSignals[x.relatedTo] = [ ...oldValues, x ];
// });





/**
 * Issues:
 *
 * 1) BK doesn't post SL for each exchange. They tend to post SL on SPOT or ByBit, where leverage is lower then on Binance
 *  and loss doesn't look so bad.

 * 2) PnL % is percentage of signal, doesn't say the actual amount you would gain, needs to be calculated based on entry
 *  points and can differ a lot based on the configuration.
 */
