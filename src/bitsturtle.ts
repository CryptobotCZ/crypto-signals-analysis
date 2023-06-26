import { Cancel, Close, Entry, EntryAll, Message, Opposite, Order, OrderDetail, PartialParser, SLAfterTP, SignalUpdate, StopLoss, TakeProfit, TakeProfitAll, getReferencedMessageId, parseDate } from "./parser.ts";
import { getAllMessages as parserGetAllMessages, parseMessagePipeline } from "./parser.ts";

export function parseOrder(messageDiv: HTMLElement): Partial<Order> | null {
    const text = messageDiv.innerText ?? '';
    return parseOrderString(text);
}

export function parseOrderString(message: string): Partial<Order> | null {
    return parseOrderString01(message);
}

export function parseOrderString01(message: string): Partial<Order> | null {
    const pattern = /(.+)\n?Exchange: (.+)\n?Leverage: Cross (\d+)X\n?Buy Zone: (.+)\n?Sell: (.+)/i
    const match = pattern.exec(message.trim());

    if (match) {
        const replaceNumberedList = (text: string) => {
            return text?.replaceAll(/\d\) /ug, ' ')
                ?.trim()
                ?.replaceAll(' - ', ' ')
                ?.split(' ')
                ?.map(x => parseFloat(x))

                ?? [0];
        };

        const coin = match[1];
        const exchange = match[2];
        const leverage = parseInt(match[3].replace('x', ''));
        const entry = replaceNumberedList(match[4]);
        const targets = replaceNumberedList(match[5]);

        const entryRange = entry[1] - entry[0];
        const threeEntries = [ entry[0], entry[0] + entryRange / 2, entry[1] ];

        const direction = targets[0] < entry[0] ? 'SHORT' : 'LONG';

        const parsedMessage = {
            type: 'order' as any,
            coin: coin,
            direction: direction,
            exchange: exchange,
            leverage: leverage,
            entry: threeEntries,
            targets: targets,
            stopLoss: null,
        };

        return parsedMessage;
    }

    return null;
}

export function parseEntryString(message: string): Partial<Entry> | null {
    const entryPattern = /(.+)\n?#(.+) Entered entry zone .\n?Period: (.+)/gm;

    const entryMatch = entryPattern.exec(message);
    if (entryMatch) {
        const coin = entryMatch[2];
        const exchange = entryMatch[1];

        const parsedEntry = {
            type: 'entry' as any,
            coin: coin,
            exchange
        };

        return parsedEntry;
    }

    return null;
}

export function parseEntry(messageDiv: HTMLElement): Partial<Entry> | null {
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();
    const result = parseEntryString(message);

    if (result != null) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        return { ...result, relatedTo: referencedMessageId };
    }

    return null;
}

export function parseEntryAll(messageDiv: HTMLElement): Partial<EntryAll> | null {
    const entryPattern = /(.*)\n?#(.*) All entry targets achieved\n?Average Entry Price: (\d*\.?\d*)/gm;
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();

    const entryMatch = entryPattern.exec(message);
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

export function parseClose(messageDiv: HTMLElement): Partial<Close> | null {
    const entryPattern = /CLOSE (.*)/;
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();

    const match = entryPattern.exec(message);
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

export function parseCancelled(messageDiv: HTMLElement): Partial<Cancel> | null {
    const entryPattern = /(.*)\n?#(.*) Cancelled ❌\n?Target achieved before entering the entry zone/;
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();

    const match = entryPattern.exec(message);
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

export function parseTPString(message: string): Partial<TakeProfit> | null {
    const pattern = /(.*)\n#(.*) All take-profit targets achieved 😎\nProfit: ([\d\.\%]+) 📈\n?Period: (.*) ⏰/gm;
    const match = pattern.exec(message);

    if (match) {
        const exchange = match[1];
        const coin = match[2];
        const pctStr = match[3];
        const pct = parseFloat(pctStr.replace("%", ""));
        const time = match[4];

        const parsedEntry = {
            type: 'TP' as any,
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

export function parseTP(messageDiv: HTMLElement): Partial<TakeProfit> | null {
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();
    const result = parseTPString(message);

    if (result != null) {
        const referencedMessageId = getReferencedMessageId(messageDiv);
        return { ...result, relatedTo: referencedMessageId };
    }

    return null;
}

export function parseTPWithoutProfit(messageDiv: HTMLElement): Partial<TakeProfit> | null {
    const pattern = /(.*)\n?#(.*) Take-Profit target (\d+) ✅\n?\n?Period: (.*) ⏰/gm;
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


export function parseTPAll(messageDiv: HTMLElement): Partial<TakeProfitAll> | null {
    const pattern = /(.*)\n?#(.*) All take-profit targets achieved 😎\n?Profit: ([\d\.\%]+) .*\n?Period: (.*) ⏰/gm;
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

    const order = relatedSignals.find(x => x.type == 'order') as Order;
    const entries = relatedSignals.filter(x => x.type === 'entry') as Entry[];
    const tps = relatedSignals.filter(x => x.type == 'TP') as TakeProfit[];
    const tpAll = relatedSignals.filter(x => x.type == 'TPAll') as TakeProfitAll[];
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
        order.entry.sort((a, b) => b - a);
    } else {
        order.entry.sort((a, b) => a - b);
    }

    // 14-28-58
    // const avgEntryPrice = entries.map((x, idx) => order.entry[idx])
    //     .reduce((sum, entry) => entry + sum, 0) / Math.max(entries.length, 1);

    const maxReachedEntry = Math.max(...entries.map(x => x.entry).concat([0]));
    const maxReachedTp = tpAll == null ? 0 : 1;

    const lev = order.leverage ?? 1;

    // const orderTps = order.targets.map(x => x);
    // const avgTpValue = orderTps.filter((x, idx) => idx + 1 <= maxReachedTp)
    //     .reduce((sum, x) => sum + x, 0) / Math.max(maxReachedTp, 1);

    // const sumProfitPct = orderTps.filter((x, idx) => idx + 1 <= maxReachedTp)
    //     .reduce((sum, x) => sum + Math.abs(x - avgEntryPrice), 0) / Math.max(maxReachedTp, 1) / avgEntryPrice * lev * 100;

//    const sumLossPct = Math.abs(order.stopLoss - avgEntryPrice) / avgEntryPrice * lev * 100;

    const pnl = tpAll.length > 0 ? tpAll[0].pct : 0;
    const closed = tpAll.length > 0;

    const data = {
        order,
        entries,
        tps,
        sl,
        other,
        maxReachedEntry,
        maxReachedTp,
        avgEntryPrice: 0,
        avgTpValue: 0,
        pnl,
        closed,
        lev
    };

    return data;
}

export function parseMessage(messageDiv: HTMLElement): Message {
    const pipeline: PartialParser[] = [
        parseOrder,
        parseEntry,
        parseEntryAll,
        parseClose,
        parseTP,
        parseTPAll,
        parseTPWithoutProfit,
        parseCancelled,
    ];

    return parseMessagePipeline(messageDiv, pipeline);
}

export function getAllMessages(): Message[] {
    const $$ = (selector: string) => Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    const messages = $$('.message.default').map(x => parseMessage(x));

    return messages;
}
