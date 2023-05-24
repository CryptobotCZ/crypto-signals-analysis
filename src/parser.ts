export interface GenericMessage {
    relatedTo?: string | null;
    type: string;
    date: Date;
    messageId: string;
}

export interface Order extends GenericMessage {
    type: 'order' | 'spotOrder';
    coin: string;
    direction: string;
    exchange: string;
    leverage: number;
    entry: number[];
    ote?: number;
    targets: number[];
    shortTermTargets?: number[];
    midTermTargets?: number[];
    stopLoss: number;
}

export interface Entry extends GenericMessage {  type: 'entry'; coin: string; exchange: string; entry: number; price: number; }
export interface EntryAll extends GenericMessage  { type: 'entryAll'; coin: string; exchange: string; price: number; }
export interface Close extends GenericMessage { type: 'close'; coin: string; }
export interface Cancel extends GenericMessage { type: 'cancelled'; coin: string; exchange: string; }
export interface Opposite extends GenericMessage { type: 'opposite'; coin: string; exchange: string; }
export interface SLAfterTP extends GenericMessage { type: 'SLTP'; coin: string; exchange: string; }
export interface StopLoss extends GenericMessage { type: 'SL'; coin: string; exchange: string; pct: number; }
export interface TakeProfit extends GenericMessage { type: 'TP'; coin: string; exchange: string; tp: number; pctStr: string; pct: number; time: string; }
export interface TakeProfitAll extends GenericMessage {type: 'TPAll'; coin: string; exchange: string; pctStr: string; pct: number; time: string; }

export interface SignalUpdate extends GenericMessage { type: 'update', text: string }

export interface UnknownMessage extends GenericMessage { type: 'unknown', text: string }

export interface OrderDetail {
    order: Order; entries: Entry[]; tps: TakeProfit[]; sl: StopLoss[]; other: Message[]; maxReachedEntry: number; maxReachedTp: number;
    avgEntryPrice: number; avgTpValue: number;
    pnl: number;
    closed: boolean; lev: number;
}


export type Message = Order | Entry | EntryAll | Close | Cancel | Opposite | SLAfterTP | StopLoss | TakeProfit
    | TakeProfitAll | UnknownMessage | SignalUpdate;

export type PartialParser = (message: HTMLElement) => Partial<Message>|null;
export type Parser = (message: HTMLElement) => Message;

export type OrderGrouping = { order: OrderDetail, key: string };
export type GroupedSignals = {[key: string]: Message[] };

export function parseDate(dateString: string) {
    const parts = dateString.split(" ");
    const dateParts = parts[0].split(".");
    const timeParts = parts[1].split(":");
    const timezonePart = parts[2].substring(3); // Extract the timezone offset without "UTC" prefix

    const year = parseInt(dateParts[2], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Month is zero-based in JavaScript Date object
    const day = parseInt(dateParts[0], 10);
    const hour = parseInt(timeParts[0], 10);
    const minute = parseInt(timeParts[1], 10);
    const second = parseInt(timeParts[2], 10);

    // Construct the date object
    const date = new Date(Date.UTC(year, month, day, hour, minute, second));

    // Apply the timezone offset
    const timezoneOffset = parseInt(timezonePart, 10);
    date.setHours(date.getHours() - timezoneOffset);

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
 * @returns
 */
export function parseOrder(messageDiv: HTMLElement, pattern: RegExp): Partial<Order> | null {
    const message = messageDiv.innerText ?? '';
    const match = pattern.exec(message.trim());

    if (match) {
      const coin = match[1];
      const direction = match[2];
      const exchange = match[3];
      const leverage = parseInt(match[4].replace('x', ''));
      const entry = match[5].trim().split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
      const targets = match[6].trim().split(" - ").map(x => x.trim().replace(",", "")).map(x => parseFloat(x));
      const stopLoss = parseFloat(match[7].trim().replace(",", ""));

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
      const direction = match[2].trim();
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

export function parseEntry(messageDiv: HTMLElement, pattern: RegExp): Partial<Entry> | null {
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();
    const entryMatch = pattern.exec(message);

    if (entryMatch) {
        const coin = entryMatch[2];
        const exchange = entryMatch[1];
        const entry = parseInt(entryMatch[3].trim());
        const price = parseFloat(entryMatch[4].trim().replace(",", ""));

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

export function parseEntryAll(messageDiv: HTMLElement, pattern: RegExp): Partial<EntryAll> | null {
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();
    const entryMatch = pattern.exec(message);

    if (entryMatch) {
        const referencedMessageId = getReferencedMessageId(messageDiv);

        const coin = entryMatch[2];
        const exchange = entryMatch[1];
        const price = parseFloat(entryMatch[3].trim().replace(",", ""));

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


export function parseClose(messageDiv: HTMLElement, pattern: RegExp): Partial<Close> | null {
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();
    const match = pattern.exec(message);

    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const coin = match[1];

        const parsedEntry = {
              relatedTo: referencedMessageId,
              type: 'close' as any,
              coin: coin
        };

        return parsedEntry;
    }

    return null;
}

export function parseCancelled(messageDiv: HTMLElement, pattern: RegExp): Partial<Cancel> | null {
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();
    const match = pattern.exec(message);

    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const exchange = match[1];
        const coin = match[2];

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


export function parseOpposite(messageDiv: HTMLElement, pattern: RegExp): Partial<Opposite> | null {
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();

    const match = pattern.exec(message);
    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const exchange = match[1];
        const coin = match[2];

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


export function parseSLAfterTP(messageDiv: HTMLElement, pattern: RegExp): Partial<SLAfterTP> | null {
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();
    const match = pattern.exec(message);

    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const exchange = match[1];
        const coin = match[2];

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


export function parseSL(messageDiv: HTMLElement, pattern: RegExp): Partial<StopLoss> | null {
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();
    const match = pattern.exec(message);

    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const exchange = match[1];
        const coin = match[2];
        const pctStr = match[3];
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

export function parseTP(messageDiv: HTMLElement, pattern: RegExp): Partial<TakeProfit> | null {
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();

    const match = pattern.exec(message);

    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const exchange = match[1];
        const coin = match[2];
        const tp = parseInt(match[3]);
        const pctStr = match[4];
        const pct = parseFloat(pctStr.replace("%", ""));
        const time = match[5];

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

export function parseTPWithoutProfit(messageDiv: HTMLElement, pattern: RegExp): Partial<TakeProfit> | null {
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();
    const match = pattern.exec(message);

    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const exchange = match[1];
        const coin = match[2];
        const tp = parseInt(match[3]);
        const time = match[5];

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


export function parseTPAll(messageDiv: HTMLElement, pattern: RegExp): Partial<TakeProfitAll> | null {
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();
    const match = pattern.exec(message);

    if (match) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        const exchange = match[1];
        const coin = match[2];
        const pctStr = match[3];
        const pct = parseFloat(match[3].replace("%", ''));
        const time = match[4];

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

    const order = relatedSignals.find(x => x.type == 'order' || x.type == 'spotOrder') as Order; //  relatedSignals.find(x => x.type == 'order' && x.exchange == 'Binance Futures');
    const entries = relatedSignals.filter(x => x.type === 'entry') as Entry[]; // relatedSignals.filter(x => x.type === 'entry' && x.exchange == 'Binance Futures');
    const tps = relatedSignals.filter(x => x.type == 'TP') as TakeProfit[];
    const sl = relatedSignals.filter(x => x.type == 'SL') as StopLoss[];
    const other = relatedSignals.filter(x => x.type !== 'spotOrder' && x.type !== 'order' && x.type !== 'entry' && x.type !== 'TP' && x.type !== 'SL');

    if (order == null) {
        return {
            order,
            entries,
            tps,
            sl,
            other
        };
    }

    if (order.direction === 'LONG') {
        order.entry.sort((a,b) => b - a);
    } else {
        order.entry.sort((a,b) => a - b);
    }

    const avgEntryPrice = entries.map(x => x.price).reduce((sum, entry) => entry + sum, 0) / Math.max(entries.length, 1);

    const maxReachedEntry = Math.max(...entries.map(x => x.entry).concat([0]));
    const tpsAsInt = tps.map(x => x.tp);
    const maxReachedTp = Math.max(...tpsAsInt.concat([0]));

    const lev = order.leverage ?? 1;

    const orderTps = order.targets.map(x => x);
    const avgTpValue = orderTps.filter((x, idx) => idx + 1 <= maxReachedTp)
        .reduce((sum, x) => sum + x, 0) / Math.max(maxReachedTp, 1);

    const sumProfitPct = orderTps.filter((x, idx) => idx + 1 <= maxReachedTp)
        .reduce((sum, x) => sum + Math.abs(x - avgEntryPrice), 0) / Math.max(maxReachedTp, 1) / avgEntryPrice * lev * 100;

    const sumLossPct = Math.abs(order.stopLoss - avgEntryPrice) / avgEntryPrice * lev * 100;

    const pnl = tps.length === 0 && sl.length > 0
        ? -sumLossPct
        : sumProfitPct;

    const closed = tps.length === order.targets.length || sl.length > 0;

    const data = {
        order,
        entries,
        tps,
        sl,
        other,
        maxReachedEntry,
        maxReachedTp,
        avgEntryPrice,
        avgTpValue,
        pnl,
        closed,
        lev
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
    const avgEntryPrice = entries.reduce((sum, entry) => entry + sum, 0) / entries.length;
    const maxReachedEntry = entries.length;
    const lev = orderDetail.order.leverage ?? 1;

    const sumLossPct = Math.abs(orderDetail.order.stopLoss - avgEntryPrice) / avgEntryPrice * lev * 100;

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
    console.log(slSignal);

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
            const slCopy =  { ...slSignal, relatedTo: x.order.messageId, messageId: `${slSignal.messageId}-${index + 1}`, exchange: x.order.exchange };
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
        const lev = orderDetail.order.leverage ?? 1;

        return Math.abs(tpTarget - entryPrice) / entryPrice * lev * 100;
    });
}

export function getPotentialLoss(orderDetail: OrderDetail): number {
    const entryPrice = orderDetail.order.entry[0];
    const lev = orderDetail.order.leverage ?? 1;
    const sl = orderDetail.order.stopLoss;

    return Math.abs(entryPrice - sl) / entryPrice * lev * 100 * -1;
}

export function parseMessagePipeline(messageDiv: HTMLElement, pipeline: PartialParser[]): Message {
    const messageId = messageDiv.getAttribute('id')!;
    const date = parseDate((messageDiv.getElementsByClassName('date')?.[0] as HTMLElement)?.getAttribute('title') ?? '');
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();

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
