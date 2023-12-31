import {getLeverage, getOrderSl} from "./order.ts";

export interface GenericMessage {
    relatedTo?: string | null;
    type: string;
    date: Date;
    messageId: string;
}

export type ExchangeType = string|null|undefined;

export interface Order extends GenericMessage {
    signalId?: string;
    type: 'order' | 'spotOrder';
    coin: string;
    direction: string;
    exchange?: string|null;
    leverage: number|number[];
    entry: number[];
    ote?: number;
    targets: number[];
    shortTermTargets?: number[];
    midTermTargets?: number[];
    stopLoss: number | string | null;
    config?: any;
}

export interface Entry extends GenericMessage {  type: 'entry'; coin: string; exchange: ExchangeType; entry: number; price: number; }
export interface EntryAll extends GenericMessage  { type: 'entryAll'; coin: string; exchange: ExchangeType; price: number; }
export interface Close extends GenericMessage { type: 'close'; coin: string; }
export interface Cancel extends GenericMessage { type: 'cancelled'; coin: string; exchange: ExchangeType; }
export interface Opposite extends GenericMessage { type: 'opposite'; coin: string; exchange: ExchangeType; }
export interface SLAfterTP extends GenericMessage { type: 'SLTP'; coin: string; exchange: ExchangeType; }
export interface StopLoss extends GenericMessage { type: 'SL'; coin: string; exchange: ExchangeType; pct: number; }
export interface TakeProfit extends GenericMessage { type: 'TP'; coin: string; exchange: ExchangeType; tp: number; pctStr: string; pct: number; time: string; }
export interface TakeProfitAll extends GenericMessage {type: 'TPAll'; coin: string; exchange: ExchangeType; pctStr: string; pct: number; time: string; }

export interface SignalUpdate extends GenericMessage { type: 'update', text: string }

export interface InfoMessage extends GenericMessage { type: 'info', text: string }
export interface UnknownMessage extends GenericMessage { type: 'unknown', text: string }

export interface OrderDetail {
    order: Order;
    entries: Entry[];
    tps: TakeProfit[];
    sl: StopLoss[];
    other: Message[];
    maxReachedEntry: number;
    maxReachedTp: number;
    avgEntryPrice: number;
    avgTpValue: number;
    pnl: number;
    closed: boolean;
    lev: number|number[];
    events: any[];
}


export type Message = Order | Entry | EntryAll | Close | Cancel | Opposite | SLAfterTP | StopLoss | TakeProfit
    | TakeProfitAll | UnknownMessage | InfoMessage | SignalUpdate;

export type PartialParser = (message: HTMLElement) => Partial<Message>|null;
export type Parser = (message: HTMLElement) => Message;

export type OrderGrouping = { order: OrderDetail, key: string };
export type GroupedSignals = {[key: string]: Message[] };

export function cleanAndParseFloat(text: string) {
    return parseFloat(text?.trim()?.replace(",", ""));
}

export function parseDate(dateString: string) {
    const parts = dateString.split(" ");
    const dateParts = parts[0].split(".");
    const timeParts = parts[1].split(":");
    const timezonePart = parts?.[2]?.substring(3) ?? ''; // Extract the timezone offset without "UTC" prefix

    const year = parseInt(dateParts[2], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Month is zero-based in JavaScript Date object
    const day = parseInt(dateParts[0], 10);
    const hour = parseInt(timeParts[0], 10);
    const minute = parseInt(timeParts[1], 10);
    const second = parseInt(timeParts[2], 10);

    // Apply the timezone offset
    const timezoneOffset = 0; // offset is incorrect
    // parseInt(timezonePart, 10);

    // Construct the date object
    const date = new Date(year, month, day, hour - timezoneOffset, minute, second);

    return date;
}

export function getReferencedMessageId(messageDiv: HTMLElement) {
    const replyTo = messageDiv.getElementsByClassName('reply_to');

    if (replyTo.length > 0) {
      const a = Array.from(Array.from(replyTo)[0].getElementsByTagName('a'));

      if (a.length > 0) {
          const link = a[0].getAttribute('href')?.split('go_to_') ?? [];

          if (link.length == 2) {
              return link[1];
          }
      }
    }

    return null;
}

export function parseOrder(messageDiv: HTMLElement, pattern: RegExp): Partial<Order> | null {
    const text = messageDiv.innerText ?? '';
    return parseOrderText(text, pattern);
}

/**
 *
 * @param messageDiv
 * @param pattern Pattern for parsing message. Needs to have following capture groups:
 *  1 - coin
 *  2 - direction
 *  3 - exchange
 *  4 - leverage
 *  5 - entry
 *  6 - targets
 *  7 - sl
 * @returns
 */
export function parseOrderText(message: string, pattern: RegExp): Partial<Order> | null {
    const match = pattern.exec(message.trim());

    if (match) {
      const coin = match.groups?.coin?.toUpperCase()?.trim() ?? match[1];
      const direction = (match.groups?.direction ?? match[2]).toUpperCase();
      const exchange = (match.groups?.exchange ?? match[3]);
      const leverage = parseInt((match.groups?.leverage ?? match[4]).replace('x', ''));
      const entry = (match.groups?.entry ?? match[5]).trim().split(/ ?[-] ?/).map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
      const targets = (match.groups?.targets ?? match[6])
          .trim()
          .split(/ ?[-] ?/)
          .map(x => x?.trim())
          .filter(x => x?.length > 0)
          .map(x => x.replace(",", ""))
          .map(x => parseFloat(x));
      const stopLoss = parseFloat((match.groups?.sl ?? match[7]).trim().replace(",", ""));

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

  return null;
}

export function parseSpotOrder(messageDiv: HTMLElement, pattern: RegExp): Partial<Order> | null {
    const message = messageDiv.textContent ?? '';
    const match = pattern.exec(message.trim());

    if (match) {
      const coin = match[1].trim();
      const direction = match[2].trim().toUpperCase();
      const entry = match[3].trim().split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
      const targets = match[4].trim().split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
      const stopLoss = parseFloat(match[5].trim().replace(",", ""));

      const parsedMessage = {
        type: 'spotOrder' as any,
        exchange: '',
        leverage: 1,
        coin: coin,
        direction: direction,
        entry: entry,
        targets: targets,
        stopLoss: stopLoss,
      };

    return parsedMessage;
  }

  return null;
}

/**
 *
 * @param messageDiv
 * @param pattern Pattern for parsing message. Needs to have following capture groups:
 *  1 - exchange
 *  2 - coin
 *  3 - price
 * @returns
 */
export function parseEntry(messageDiv: HTMLElement, pattern: RegExp): Partial<Entry> | null {
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();
    const entryMatch = pattern.exec(message);

    if (entryMatch) {
        const exchange = entryMatch.groups?.exchange ?? entryMatch[1];
        const coin = entryMatch.groups?.coin ?? entryMatch[2];
        const entryStr = entryMatch?.groups?.entry ?? entryMatch[3];
        const entry = parseInt(entryStr.trim());
        const priceStr = entryMatch.groups?.price ?? entryMatch[4];
        const price = parseFloat(priceStr.trim().replace(",", ""));

        const referencedMessageId = getReferencedMessageId(messageDiv);

        const parsedEntry = {
              relatedTo: referencedMessageId,
              type: 'entry' as any,
              coin: coin,
              exchange,
              entry,
              price
          };

        return parsedEntry;
    }

    return null;
}

/**
 *
 * @param messageDiv
 * @param pattern Pattern for parsing message. Needs to have following capture groups:
 *  1 - exchange
 *  2 - coin
 *  3 - price
 * @returns
 */
export function parseEntryAll(messageDiv: HTMLElement, pattern: RegExp): Partial<EntryAll> | null {
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();
    const entryMatch = pattern.exec(message);

    if (entryMatch) {
        const referencedMessageId = getReferencedMessageId(messageDiv);

        const exchange = entryMatch.groups?.exchange ?? entryMatch[1];
        const coin = entryMatch.groups?.coin ?? entryMatch[2];
        const priceStr = entryMatch.groups?.price ?? entryMatch[3];
        const price = parseFloat(priceStr.trim().replace(",", ""));

        const parsedEntry = {
            relatedTo: referencedMessageId,
            type: 'entryAll' as any,
            coin: coin,
            exchange,
            price
        };

        return parsedEntry;
    }

    return null;
}


/**
 *
 * @param messageDiv
 * @param pattern Pattern for parsing message. Needs to have following capture groups:
 *  1 - coin
 * @returns
 */
export function parseClose(messageDiv: HTMLElement, pattern: RegExp): Partial<Close> | null {
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();
    const match = pattern.exec(message);

    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const coin = match.groups?.coin ?? match[2];

        const parsedEntry = {
              relatedTo: referencedMessageId,
              type: 'close' as any,
              coin: coin
        };

        return parsedEntry;
    }

    return null;
}

/**
 *
 * @param messageDiv
 * @param pattern Pattern for parsing message. Needs to have following capture groups:
 *  1 - exchange
 *  2 - coin
 * @returns
 */
export function parseCancelled(messageDiv: HTMLElement, pattern: RegExp): Partial<Cancel> | null {
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();
    const match = pattern.exec(message);

    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const exchange = match.groups?.exchange ?? match[1];
        const coin = match.groups?.coin ?? match[2];

        const parsedEntry = {
            relatedTo: referencedMessageId,
            type: 'cancelled' as any,
            coin,
            exchange
        };

        return parsedEntry;
    }

    return null;
}


/**
 *
 * @param messageDiv
 * @param pattern Pattern for parsing message. Needs to have following capture groups:
 *  1 - exchange
 *  2 - coin
 * @returns
 */
export function parseOpposite(messageDiv: HTMLElement, pattern: RegExp): Partial<Opposite> | null {
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();

    const match = pattern.exec(message);
    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const exchange = match.groups?.exchange ?? match[1];
        const coin = match.groups?.coin ?? match[2];

        const parsedEntry = {
            relatedTo: referencedMessageId,
            type: 'close' as any,
            coin: coin,
            exchange
        };

        return parsedEntry;
    }

    return null;
}


/**
 *
 * @param messageDiv
 * @param pattern Pattern for parsing message. Needs to have following capture groups:
 *  1 - exchange
 *  2 - coin
 * @returns
 */
export function parseSLAfterTP(messageDiv: HTMLElement, pattern: RegExp): Partial<SLAfterTP> | null {
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();
    const match = pattern.exec(message);

    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const exchange = match.groups?.exchange ?? match[1];
        const coin = match.groups?.coin ?? match[2];

        const parsedEntry = {
              relatedTo: referencedMessageId,
              type: 'SLTP' as any,
              coin: coin,
              exchange
          };

        return parsedEntry;
    }

    return null;
}


/**
 *
 * @param messageDiv
 * @param pattern Pattern for parsing message. Needs to have following capture groups:
 *  1 - exchange
 *  2 - coin
 *  3 - loss
 * @returns
 */
export function parseSL(messageDiv: HTMLElement, pattern: RegExp): Partial<StopLoss> | null {
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();
    const match = pattern.exec(message);

    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const exchange = match.groups?.exchange ?? match[1];
        const coin = match.groups?.coin ?? match[2];
        const pctStr = match.groups?.loss ?? match[3];
        const pct = parseFloat(pctStr.replace("%", ""));

        const parsedEntry = {
              relatedTo: referencedMessageId,
              type: 'SL' as any,
              coin: coin,
              exchange,
              pct
          };

        return parsedEntry;
    }

    return null;
}

/**
 *
 * @param messageDiv
 * @param pattern Pattern for parsing message. Needs to have following capture groups:
 *  1 - exchange
 *  2 - coin
 *  3 - target
 *  4 - profit
 *  5 - time
 * @returns
 */
export function parseTP(messageDiv: HTMLElement, pattern: RegExp): Partial<TakeProfit> | null {
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();

    const match = pattern.exec(message);

    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const exchange = match.groups?.exchange ?? match[1];
        const coin = match.groups?.coin ?? match[2];
        const tp = parseInt(match.groups?.target ?? match[3]);
        const pctStr = match.groups?.profit ?? match[4];
        const pct = parseFloat(pctStr.replace("%", ""));
        const time = match.groups?.time ?? match[5];

        const parsedEntry = {
              relatedTo: referencedMessageId,
              type: 'TP' as any,
              coin: coin,
              exchange,
              tp,
              pctStr,
              pct,
              time
          };

        return parsedEntry;
    }

    return null;
}

/**
 *
 * @param messageDiv
 * @param pattern Pattern for parsing message. Needs to have following capture groups:
 *  1 - exchange
 *  2 - coin
 *  3 - target
 *  4 - time
 * @returns
 */
export function parseTPWithoutProfit(messageDiv: HTMLElement, pattern: RegExp): Partial<TakeProfit> | null {
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();
    const match = pattern.exec(message);

    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const exchange = match.groups?.exchange ?? match[1];
        const coin = match.groups?.coin ?? match[2];
        const tp = parseInt(match.groups?.target ?? match[3]);
        const time = match.groups?.time ?? match[4];

        const parsedEntry = {
              relatedTo: referencedMessageId,
              type: 'TP' as any,
              coin: coin,
              exchange,
              tp,
              pctStr: '0',
              pct: 0,
              time
          };

        return parsedEntry;
    }

    return null;
}


/**
 * Parse all take profits reached message
 * @param messageDiv
 * @param pattern Pattern for parsing message. Needs to have following capture groups:
 *  1 - exchange
 *  2 - coin
 *  3 - profit
 *  4 - time
 * @returns
 */
export function parseTPAll(messageDiv: HTMLElement, pattern: RegExp): Partial<TakeProfitAll> | null {
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();
    const match = pattern.exec(message);

    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const exchange = match.groups?.exchange ?? match[1];
        const coin = match.groups?.coin ?? match[2];
        const pctStr = match.groups?.profit ?? match[3];
        const pct = parseFloat(pctStr.replace("%", ''));
        const time = match.groups?.time ?? match[4];

        const parsedEntry = {
            relatedTo: referencedMessageId,
            type: 'TPAll' as any,
            coin: coin,
            exchange,
            pctStr,
            pct,
            time
        };

        return parsedEntry;
    }

    return null;
}

export function getOrderSignalInfoFull(signal: Message, groupedSignals: { [key: string]: Message[] }): Partial<OrderDetail> {
    const relatedSignals = groupedSignals[signal.messageId];

    const order = relatedSignals.find(x => x.type == 'order' || x.type == 'spotOrder') as Order;
    const entries = relatedSignals.filter(x => x.type === 'entry') as Entry[];
    const entryAll = relatedSignals.filter(x => x.type === 'entryAll') as EntryAll[];
    const tps = relatedSignals.filter(x => x.type == 'TP') as TakeProfit[];
    const tpAll = relatedSignals.filter(x => x.type === 'TPAll') as TakeProfitAll[];
    const sl = relatedSignals.filter(x => x.type == 'SL') as StopLoss[];
    const slTp = relatedSignals.filter(x => x.type === 'SLTP') as SLAfterTP[];
    const close = relatedSignals.filter(x => x.type === 'close') as Close[];
    const cancel = relatedSignals.filter(x => x.type === 'cancelled') as Cancel[];
    const opposite = relatedSignals.filter(x => x.type === 'opposite') as Opposite[];

    const other = relatedSignals.filter(x => (['spotOrder', 'order' , 'entry', 'entryAll', 'TP', 'TPAll', 'SL', 'SLTP' ] as typeof x.type[]).indexOf(x.type) === -1);

    if (order == null) {
        return {
            order,
            entries,
            tps,
            sl,
            other
        };
    }

    if (order?.direction?.toUpperCase() === 'LONG') {
        order.entry.sort((a,b) => b - a);
    } else {
        order.entry.sort((a,b) => a - b);
    }

    const avgEntryPrice = entryAll.length != 0
        ? entryAll[0].price
        : entries.map(x => x.price).reduce((sum, entry) => entry + sum, 0) / Math.max(entries.length, 1);

    const maxReachedEntry = entryAll.length != 0
        ? order.entry.length
        : Math.max(...entries.map(x => x.entry).concat([0]));

    const tpsAsInt = tps.map(x => x.tp);

    const maxReachedTp = tpAll.length != 0
        ? order.targets.length
        : Math.max(...tpsAsInt.concat([0]));

    const lev = getLeverage(order.leverage ?? 1);

    const orderTps = order.targets.map(x => x);
    const avgTpValue = orderTps.filter((x, idx) => idx + 1 <= maxReachedTp)
        .reduce((sum, x) => sum + x, 0) / Math.max(maxReachedTp, 1);

    const sumProfitPct = orderTps.filter((x, idx) => idx + 1 <= maxReachedTp)
        .reduce((sum, x) => sum + Math.abs(x - avgEntryPrice), 0) / Math.max(maxReachedTp, 1) / avgEntryPrice * lev * 100;

    const stopLossNumber = getOrderSl(order);
    const sumLossPct = Math.abs(stopLossNumber - avgEntryPrice) / avgEntryPrice * lev * 100;

    const pnl = maxReachedTp === 0 && sl.length > 0
        ? -sumLossPct
        : sumProfitPct;

    const closed = maxReachedTp === order.targets.length || sl.length > 0 || close.length > 0 || slTp.length > 0;

    const events = [
        ...cancel,
        ...close,
        ...opposite,
    ];

    const data = {
        order,
        entries,
        entryAll,
        tps,
        sl,
        slTp,
        close,
        other,
        maxReachedEntry,
        maxReachedTp,
        avgEntryPrice,
        avgTpValue,
        pnl,
        closed,
        lev,
        events,
    };

    return data;
}

export function getOrderKey(order: OrderDetail) {
    return [
        order.order.coin,
        order.order.direction,
        order.order.stopLoss
    ].join(':');
}

export function groupRelatedOrders(orders: OrderDetail[]): {[key: string]: OrderGrouping[]} {
    const orderId = 0;

    const ordersWithKey = orders.map(x => ({ order: x, key: getOrderKey(x) }));
    ordersWithKey.sort((x, y) => x.key.localeCompare(y.key));

    return ordersWithKey.reduce((acc: any, x) => {
        if (!Object.hasOwn(acc, x.key)) {
            acc[x.key] = [];
        }

        acc[x.key].push(x);

        return acc;
    }, {});
}

export function updateOrderDetailWithSL(orderDetail: OrderDetail, sl: StopLoss) {
    orderDetail.sl.push(sl);

    // it doesn't make any sense to reach full SL without reaching all entry points first, assume all entries were entered
    const entries = orderDetail.order.entry;
    const avgEntryPrice = entries.reduce((sum: any, entry: any) => entry + sum, 0) / entries.length;
    const maxReachedEntry = entries.length;
    const lev = getLeverage(orderDetail.order.leverage ?? 1);

    const stopLossNumber = getOrderSl(orderDetail.order);
    const sumLossPct = Math.abs(stopLossNumber - avgEntryPrice) / avgEntryPrice * lev * 100;

    const pnl = -sumLossPct;

    orderDetail.avgEntryPrice = avgEntryPrice;
    orderDetail.maxReachedEntry = maxReachedEntry;
    orderDetail.pnl = pnl;
    orderDetail.closed = true;
}


export function groupRelatedSignals(signals: Message[]) {
    const mappedSignals = signals.reduce((acc: GroupedSignals, x) => { acc[x.messageId] = [ x ]; return acc; }, {});

    signals.filter((x: any) => x.relatedTo != null).forEach((x: any) => {
        const oldValues = mappedSignals.hasOwnProperty(x.relatedTo) ? mappedSignals[x.relatedTo] : [];
        mappedSignals[x.relatedTo] = [ ...oldValues, x ];
    });

    return mappedSignals;
}

export function getRootSignals(groupedSignals: GroupedSignals) {
    const uniqueSignals = Object.keys(groupedSignals).map(x => groupedSignals[x][0]);
    const rootSignalIds = new Set(uniqueSignals.filter((x: any) => x.relatedTo == null).map(x => x.messageId));
    const rootSignals = Array.from(rootSignalIds).map(x => groupedSignals[x]).filter(x => x != null).map(x => x[0]);

    return rootSignals;
}

export function getOrderSignals(signals: Message[]): Order[] {
    return signals.filter(x => x.type == 'order' || x.type == 'spotOrder') as Order[];
}

export function mapSLToOrder(slSignal: StopLoss, orderSignals: OrderDetail[], groupedSignals: GroupedSignals, allSignals: Message[]) {
    const originallyMappedOrder = groupedSignals[slSignal.relatedTo!]?.[0] as Order;

    if (originallyMappedOrder == null) {
        // this is tricky, but probably rare, skip for now and check the impact later
    } else {
        const timeDiffMax2MinInMs = 2 * 60 * 1000;
        const ordersWithTheSameCoin = orderSignals.filter(x => x.order.coin === originallyMappedOrder.coin);
        const probablyRelatedOrders = orderSignals.filter(x => x.order.coin === originallyMappedOrder.coin &&
            ((x.order.date as any) - (originallyMappedOrder.date as any)) <= timeDiffMax2MinInMs && x.order.stopLoss === originallyMappedOrder.stopLoss)
            .filter(x => x.order.messageId !== originallyMappedOrder.messageId);

        probablyRelatedOrders.forEach((x, index) => {
            const slCopy =  { 
                ...slSignal,
                relatedTo: x.order.messageId,
                messageId: `${slSignal.messageId}-${index + 1}`,
                exchange: x.order.exchange
            };
            groupedSignals[slCopy.messageId] = [ slCopy ];
            groupedSignals[x.order.messageId].push(slCopy);

            updateOrderDetailWithSL(x, slCopy);

            allSignals.push(slCopy);
        });
    }
}

export function getTPPotentialProfit(orderDetail: OrderDetail): number[] {
    return orderDetail.order.targets.map((tpTarget: number) => {
        const entryPrice = orderDetail.order.entry[0];
        const lev = getLeverage(orderDetail.order.leverage ?? 1);

        return Math.abs(tpTarget - entryPrice) / entryPrice * lev * 100;
    });
}

export function getPotentialLoss(orderDetail: OrderDetail): number {
    const entryPrice = orderDetail.order.entry[0];
    const lev = getLeverage(orderDetail.order.leverage ?? 1);
    const sl = getOrderSl(orderDetail.order);

    return Math.abs(entryPrice - sl) / entryPrice * lev * 100 * -1;
}

export function getMaxPotentialProfit(orderDetail: OrderDetail): number {
    return getTPPotentialProfit(orderDetail)[orderDetail.order.targets.length];
}

export function parseMessagePipeline(messageDiv: HTMLElement, pipeline: PartialParser[]): Message {
    const messageId = messageDiv.getAttribute('id')!;
    const date = parseDate((messageDiv.getElementsByClassName('date')?.[0] as HTMLElement)?.getAttribute('title') ?? '');
    const textDiv = messageDiv.getElementsByClassName('text')?.[0] as HTMLElement;
    let message = textDiv?.innerText?.trim();

    if (textDiv != null) {
        textDiv.innerHTML = textDiv?.innerHTML?.replaceAll('<br>', "<br>\n");
        message = textDiv?.innerText?.trim();
    }

    const result = pipeline.reduce((previous: any, parser) => {
        return previous ?? parser(messageDiv);
    }, null) ?? { text: message, 'type': 'unknown' };

    return { ...result, messageId, date } as any;
}


export function getAllMessages(parseMessage: Parser): Message[] {
    const $$ = (selector: string) => Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    const messages = $$('.message.default').map(x => parseMessage(x));

    return messages;
}
