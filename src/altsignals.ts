import { Cancel, Close, Entry, EntryAll, Message, Opposite, Order, OrderDetail, PartialParser, SLAfterTP, SignalUpdate, StopLoss, TakeProfit, TakeProfitAll, getReferencedMessageId, parseDate } from "./parser.ts";
import { parseMessagePipeline } from "./parser.ts";

export function parseOrderUpdate(messageDiv: HTMLElement): Partial<SignalUpdate> | null {
    const pattern = /⚡/g;
    const message = messageDiv.innerText ?? '';
    const match = pattern.exec(message.trim());

    if (!match) {
        return null;
    }

    return { type: 'update', text: message };
}

export function parseOrder(messageDiv: HTMLElement): Partial<Order> | null {
    const textDiv = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement);
    if (textDiv == null) { 
        return null;
    }

    textDiv.innerHTML = textDiv.innerHTML.replaceAll('<br>', "<br>\n");

    const text = cleanUpMessage(textDiv?.innerText ?? '');
    return parseOrderString(text);
}

export function parseOrderString(message: string): Partial<Order> | null {
  const parsers = [
    parseOrderString01,
    parseOrderString02,
    parseOrderString03,
    parseOrderString04GPT,
    parseOrderString05,
  ];

  for (const parser of parsers) {
    const result = parser(message);

    if (result != null && (result?.stopLoss ?? 0) > 0) {
      return result;
    }

    if (result != null && result?.stopLoss == 0) {
      return result;
    }
  }

  return null;
}

function cleanUpMessage(message: string) {
    return message
        .trim()
        .replaceAll(/(?:\r\n|\r|\n)+/g, "\n")
        .replaceAll(/\s+/g, " ")
        .replaceAll(/\s+:/g, ":")
        .replaceAll(/:\s+/g, ":")
        ?? "";
}

function replaceNumberedListDashSeparated(text: string) {
    const fixedText = text?.replaceAll(/\d\) ?/ug, " ")
        ?.replaceAll("\n", " ")
        ?.trim()
        ?.replaceAll(/\s*[-–]\s*/g, " ")
        ?.replaceAll(/ +/g, " ");

    const numbersArray = fixedText?.split(/\s+-\s+|\s+/)?.map((x) => parseFloat(x)) ?? [ 0 ];
    return numbersArray;
}

// no prefix, coin, direction leverage or no prefix coin leverage direction orders
export function parseOrderString05(message: string): Partial<Order> | null {
    const patterns = [
        /(?:Coin: )?(?<coin>[\w\/]+)\s*(?<direction>LONG|SHORT|Long)\s*(?:Leverage)\s*:?\s*(?<leverage>[\d.]+)[xX]\s*(?:Entry ?: ?|Entry Targets ?: ?)\s*(?<entries>[\d\.\- ]+)\s*(?:Take-Profit Targets:|Targets? ?: ?)\s*(?<takeProfits>[\d., -]+)\s*(?:SL|Stop Targets|Stoploss)\s*:?\s*(?<sl>[\d.]+)/sui,
        /(?:Coin: )?(?<coin>[\w]+) ?\(?(?<direction>LONG|SHORT|Long|)\)?\n?(?:Leverage ?:? ?) ?(?<leverage>[\d.]+)[xX][\n]*(?:Entry ?: ?|Entry Targets ?: ?)\n?(?<entries>[\)\d\.\n ]+)\n?(?:Take-Profit Targets:|Targets? ?: ?)\n?(?<takeProfits>[\)\d\n\., ]+)\n?(?:Stop Targets:|Stoploss ?: ?)\n?(?<sl>.+)/siu,
        /(?:Coin: )?(?<coin>\w+) ?(?<direction>LONG|SHORT|Long) ?(?:Leverage ?:?) ?(?<leverage>[\d.]+)[xX]\s*(?:Entry ?: ?|Entry Targets ?: ?)\s*(?<entries>[\d.\- ]+)\s*(?:Take-Profit Targets:|Targets? ?: ?)\s*(?<takeProfits>[\d., -]+)\s*(?:Stop Targets:|Stoploss ?: ?)\s*(?<sl>[\d.]+)/sui,
    ];

    for (const pattern of patterns) {
        const match = pattern.exec(message);

        if (!match) {
            continue;
        }

        const coin = match.groups?.coin;
        const direction = match.groups?.direction?.toUpperCase();
        const exchange = undefined;
        const leverage = parseInt(match.groups?.leverage?.replace(".0", "") ?? "");
        const entry = replaceNumberedListDashSeparated(match.groups?.entries ?? "");
        const targets = replaceNumberedListDashSeparated(match.groups?.takeProfits ?? "");
        const stopLoss = replaceNumberedListDashSeparated(match.groups?.sl ?? "")[0];

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

// coin prefix
export function parseOrderString04GPT(message: string): Partial<Order> | null {
  const regex =
    /Coin:?\s*([^\s]+)\s*(?:\(SHORT\)|SHORT)?\s*Leverage\s*:\s*([\w\s]+)\s*Entry\s*:\s*((?:\d+\.\d+\s*-\s*\d+\.\d+|\d+\.\d+))[^:]+:\s*((?:\d+\.\d+\s*-?\s*)+)\s*Stoploss\s*:\s*([\d.]+)/;
  const match = message.match(regex);

  if (!match) {
    return null;
  }

  const coin = match[1];
  const direction = match[2].trim();
  const entry = match[3].split("-").map(Number);
  const targets = match[4].trim().split("-").map(Number);
  const stoploss = Number(match[5]);

  return {
    coin,
    direction,
    entry,
    leverage: match[2],
    targets,
    sl: stoploss,
  } as any;
}

// pair prefix
export function parseOrderString03(message: string): Partial<Order> | null {
    const patterns = [
        /Pair: (?<coin>.+) (?<direction>.+)Leverage: (?:Cross |Isolated ?x?)?(?<leverage>.+)Entry: (?<entries>.+)Targets: (?<targets>.+)Stop loss: (?<sl>.+)/sui,
        /(?<coin>\w+)\s*(?<direction>short|long)\s*Leverage\s*:\s*(?<leverageMode>Cross|Isolated)?\s*(?<leverage>[\d.]+)x\s*Entry\s*:\s*(?<entries>[\d.\- ]+)\s*(?<targets>(?:Target\s*\d+\s*:\s*[\d.]+)+)\s*Stoploss\s*:\s*(?<sl>[\d.]+)/sui,
    ];

    for (const pattern of patterns) {
        const match = pattern.exec(message.trim());

        if (!match) continue;

        const coin = match?.groups?.coin?.trim()?.toUpperCase();
        const direction = match?.groups?.direction?.trim()?.toUpperCase();
        const exchange = null;
        const leverage = parseInt(match?.groups?.leverage?.replace('x', ''));
        const entry = replaceNumberedListDashSeparated(match?.groups?.entries ?? '');
        const targets = replaceNumberedListDashSeparated(match?.groups?.targets ?? '');
        const stopLoss = replaceNumberedListDashSeparated(match?.groups?.sl ?? '')[0];
    
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

// for entry and TP format with 1) 
export function parseOrderString01(message: string): Partial<Order> | null {
    const patterns = [
        /(?:Coin:\s*)?(?<coin>[\w\/]+)\s*(?<direction>LONG|SHORT)?\s*Leverage\s*:?\s*(?<leverage>[\d.]+)\s*x\s*(?:Entry|Entry Targets)\s*:\s*(?<entries>[\d.\- ]+)\$?\s*(?:Take-Profit Targets:|Targets? ?: ?)(?<takeProfits>.+)(?:Stop Targets:|Stoploss ?: ?)(?<sl>[\d.]+)/sui,
        /(?:Coin: ?)?(?<coin>.+)  ?\(?(?<direction>LONG|SHORT|Long|)\)?\n?(?:Leverage ?\:? ?) ?(?<leverage>[\d.]+)(?:x|X)(?:Entry ?: ?|Entry Targets ?: ?)(?<entries>[\d.)]+)(?:Take-Profit Targets:|Targets? ?: ?)(?<takeProfits>.+)(?:Stop Targets:|Stoploss ?: ?)(?<sl>.+)/si,
        /(?:Coin|Coin Name:\s*)?#?(?<coin>[\w\/]+)\s*\(?(?<direction>LONG|SHORT)?\)?\s*(?:Entry|Entry Targets)\s*:\s*(?<entries>[\d.\- ]+)\$?\s*Leverage\s*:?\s*(?:cross|isolated)?\s*(?<leverage>[\d.]+)\s*x\s*(?:Take-Profit Targets:|Targets? ?: ?)(?<takeProfits>.+)(?:Stop Targets:|Stoploss ?: ?)(?<sl>[\d.]+)/sui,
        /(?:Coin|Coin Name:\s*)?#?(?<coin>[\w\/]+)\s*Leverage\s*:?\s*(?:cross|isolated)?\s*(?<leverage>[\d.]+)\s*x\s*\(?(?<direction>LONG|SHORT)?\)?\s*(?:Entry|Entry Targets)\s*:\s*(?<entries>[\d.\- –]+)\$?\s*(?:Take-Profit Targets|Targets)\s*:\s*(?<takeProfits>[–\d.\- ]+)\s*(?:Stop Targets|Stoploss|SL)\s*:\s*(?<sl>[\d.]+)/sui,
        /(?:Coin|Coin Name:\s*)?#?(?<coin>[\w\/]+)\s*\(?(?<direction>LONG|SHORT)?\)?\s*Leverage\s*:?\s*(?:cross|isolated)?\s*(?<leverage>[\d.]+)\s*x\s*(?:Entry|Entry Targets)\s*:\s*(?<entries>[\d.\- –]+)\$?\s*(?:Take-Profit Targets|Targets)\s*:\s*(?<takeProfits>[–\d.\- ]+)\s*(?:Stop Targets|Stoploss|SL)\s*:\s*(?<sl>[\d.]+)/sui,
    ];

    for (const pattern of patterns) {
        const match = pattern.exec(message);
        if (!match || match.groups?.coin?.match(/short|long/i)) {
            continue;
        }

        const coin = match.groups?.coin;
        const direction = match.groups?.direction;
        const exchange = null;
        const leverage = parseInt(match.groups?.leverage?.replace("x", "") ?? "");
        const entry = replaceNumberedListDashSeparated(match.groups?.entries ?? "");
        const targets = replaceNumberedListDashSeparated(match.groups?.takeProfits ?? "");
        const stopLoss = replaceNumberedListDashSeparated(match.groups?.sl?.replace("$", "") ?? "")[0];

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

// also entry and TP with x)
export function parseOrderString02(message: string): Partial<Order> | null {
    const pattern = /(?<coin>[^\s(]+)\s*\(?(?<direction>LONG|SHORT|Long|Short)\)?\s*(?:Leverage\s*:)\s*(?<leverage>[\d.]+)(?:x|X)\s*(?:Entry Targets|Entry)\s*:\s*(?<entries>[\d). ]+)(?:Take-Profit Targets|Targets)\s*:\s*(?<takeProfits>.+)(?:Stop Targets|SL|stoploss)\s*:\s*(?<sl>.+)/gu;
    // const pattern = /(?<coin>.+)  ?\(?(?<direction>LONG|SHORT|Long|Short)\)?\n?(?:Leverage:) (?<leverage>[\d.]+)(?:x|X)(?:Entry Targets|Entry):\s*(?<entries>.+)(?:Take-Profit Targets|Targets):\s*(?<takeProfits>.+)(?:Stop Targets|SL):\s*(?<sl>.+)/gu;
    const match = pattern.exec(message.trim());

    if (match) {
      const replaceList = (text: string) => {
          return text?.trim()?.split(/\s*-\s*/)
              ?.map(x => x.trim().replace(/,\s*/, ""))
              ?.map(x => parseFloat(x));
      }

      const replaceListInMessage = (text: string) => {
          const listReplacer = text.indexOf(")") > -1
              ? replaceNumberedListDashSeparated
              : replaceList;

          return listReplacer(text);
      };

      const coin = match.groups?.coin?.toUpperCase()?.trim();
      const direction = match.groups?.direction?.toUpperCase()?.trim();
      const exchange = null;
      const leverage = parseInt(match.groups?.leverage?.replace('x', ''));
      const entry = replaceListInMessage(match.groups?.entries ?? '');
      const targets = replaceListInMessage(match.groups?.takeProfits ?? '');
      const stopLoss = replaceListInMessage(match.groups?.sl ?? '')[0];

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

export function parseSpotOrder(messageDiv: HTMLElement): Partial<Order> | null {
    const pattern = /COIN: \$?(.+)Direction: (.+)ENTRY: (.+)TARGETS: (.+)STOP LOSS: (.+)/g;

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

export function parseEntry(messageDiv: HTMLElement): Partial<Entry> | null {
    const entryPattern = /(.*)\n?\#(.*) Entry (?:target )?(\d+).*\n?Average (?:Entry|Buy) Price: (\d*\.?\d*)/gm;
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();

    const entryMatch = entryPattern.exec(message);
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

export function parseEntryAll(messageDiv: HTMLElement): Partial<EntryAll> | null {
    const entryPattern = /(.*)\n?#(.*) All entry targets achieved\n?Average Entry Price: (\d*\.?\d*)/gm;
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();
    const referencedMessageId = getReferencedMessageId(messageDiv);

    const entryMatch = entryPattern.exec(message);
    if (entryMatch) {
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

    if (messageDiv.innerText.match(/All entry targets achieved/)) {
        return {
            relatedTo: referencedMessageId,
            type: "entryAll" as any,
        };
    }

    return null;
}

export function parseClose(messageDiv: HTMLElement): Partial<Close> | null {
    const entryPattern = /CLOSE (.*)/;
    const message = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement)?.innerText?.trim();
    const referencedMessageId = getReferencedMessageId(messageDiv);

    const match = entryPattern.exec(message);
    if (match) {
        const coin = match[1];

        const parsedEntry = {
              relatedTo: referencedMessageId,
              type: 'close' as any,
              coin: coin
        };

        return parsedEntry;
    }

    if (message?.match(/Close|closing/i)) {
        return {
            type: "close",
            relatedTo: referencedMessageId,
        };
    }

    return null;
}

export function parseBreakeven(messageDiv: HTMLElement): Partial<Close> | null {
  if (messageDiv.innerText.match(/Closing at breakeven|Breakeven SL/)) {
    const referencedMessageId = getReferencedMessageId(messageDiv);

    return {
      type: "close",
      relatedTo: referencedMessageId,
    };
  }

  return null;
}

export function parseCancelled(messageDiv: HTMLElement): Partial<Cancel> | null {
    if (messageDiv.innerText.match(/Manually Cancelled/)) {
        const referencedMessageId = getReferencedMessageId(messageDiv);

        return {
            type: "cancelled",
            relatedTo: referencedMessageId,
        };
    }

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


export function parseOpposite(messageDiv: HTMLElement): Partial<Opposite> | null {
    const pattern = /(.*)\n?#(.*) Closed due to opposite direction signal/gm;
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


export function parseSLAfterTP(messageDiv: HTMLElement): Partial<SLAfterTP> | null {
    const pattern = /(.*)\n?#(.*) Closed at .*stoploss after reaching take profit/gm;
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

export function parseSL(messageDiv: HTMLElement): Partial<StopLoss> | null {
    const pattern = /(.*)\n?#(.*) Stoploss ⛔\n?Loss: ([\d\.\%]+) 📉/gm;
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

export function parseTP(messageDiv: HTMLElement): Partial<TakeProfit> | null {
    const pattern = /(.*)\n?#(.*) Take-Profit target (\d+) ✅\n?Profit: ([\d\.\%]+) 📈\n?Period: (.*) ⏰/gm;
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

    const order = relatedSignals.find(x => x.type == 'order' || x.type == 'spotOrder') as Order;
    const entries = relatedSignals.filter(x => x.type === 'entry') as Entry[];
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

    // if (order.direction === 'LONG') {
    //     order.entry.sort((a,b) => b - a);
    // } else {
    //     order.entry.sort((a,b) => a - b);
    // }

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

export function parseLink(messageDiv: HTMLElement): Partial<Message> | null {
  if (messageDiv.innerText.match(/https:\/\//)) {
    return {
      type: "info",
      text: messageDiv.innerText,
    };
  }

  return null;
}

export function parseInfoMessage(
  messageDiv: HTMLElement,
): Partial<Message> | null {
  if (
    messageDiv.innerText.match(
      /flat|scalp|correction|report|SEC|Sorry|Exactly|analysis|predicted|prediction|Morning|month|consolidating|broke|unknown|VIP|volatility|mentioned|DOMINANCE|making gains|suggested|Waited|Market|discount|pump/i,
    )
  ) {
    return { type: "info", text: messageDiv.innerText };
  }

  return null;
}

export function parseMessage(messageDiv: HTMLElement): Message {
    const pipeline: PartialParser[] = [
        parseOrderUpdate,
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
        parseLink,
        parseInfoMessage,
        parseBreakeven,
  ];

    return parseMessagePipeline(messageDiv, pipeline);
}

export function getAllMessages(): Message[] {
    const $$ = (selector: string) => Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    const messages = $$('.message.default').map(x => parseMessage(x));

    return messages;
}
