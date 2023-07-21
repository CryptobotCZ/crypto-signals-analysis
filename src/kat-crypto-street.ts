import {
  Cancel,
  cleanAndParseFloat,
  Close,
  Entry,
  EntryAll,
  Message,
  Opposite,
  Order,
  parseCancelled as baseParseCancelled,
  parseClose as baseParseClose,
  parseEntry as baseParseEntry,
  parseEntryAll as baseParseEntryAll,
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
  getAllMessages as parserGetAllMessages, InfoMessage, getReferencedMessageId, parseDate, parseMessagePipeline,
} from "./parser.ts";

export function parseOrderString(message: string): Partial<Order> | null {
  return parseOrderString01(message)
      ?? parseOrderString02(message)
      ?? parseOrderString03(message)
      ?? parseOrderString04(message)
      ?? parseOrderString05(message)
      ?? parseOrderString06(message);
}

export function parseOrderString05(message: string): Partial<Order> | null {
  const regex = /([\d.]+)/guim;
  const allMatches = [...message.matchAll(regex)];
  const matches = regex.exec(message);
  
  if (matches) {
    // this is just wild guess, parse all numbers and find out meaning
    console.log(matches);
  }
}

export function parseOrderString04(message: string): Partial<Order> | null {
  const patterns = [
    /(?<coin>[\w\/]+)[\n\s]*(?<direction>Long|Short)[\n\s]*Leverage[^\d]*(?<leverage>\d+)x[\n\s]*Entry[\w\- ]*:\s*(?<entry>[\d., -]+)[\n\s,]*Targets?: ?(?<targets>[\d+-. ,]+)[\n\s]*SL: ?(?<sl>[\d]+)/guim,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(message);

    if (!match) {
      continue;
    }

    const targetsStr = match.groups?.targets ?? "";
    const targetSubpattern = /Target (?<target>\d+) : (?<targetValue>[\d\.,]+)?/g;
    const targetMatches = [
      ...targetsStr.matchAll(targetSubpattern)
    ].map((x, idx) => ({
      tp: idx + 1, // parseInt(x.groups?.target ?? ''),
      value: cleanAndParseFloat(x.groups?.targetValue ?? ""),
    }));

    const targets = targetMatches.map((x) => x.value);

    const coin = match.groups?.coin ?? match[1];
    const direction = (match.groups?.direction ?? match[2]).toUpperCase();
    const exchange = null;
    const leverageStr = match.groups?.leverage ?? match[4];
    const leverage = parseInt(leverageStr);
    const entry = (match.groups?.entry ?? match[5]).trim().split(" - ").map((x) => cleanAndParseFloat(x));
    const stopLoss = cleanAndParseFloat(match.groups?.sl ?? match[7]);

    const parsedMessage = {
      type: "order" as any,
      coin: coin.trim(),
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

export function parseOrderString06(message: string): Partial<Order> | null {
  if (message.match(/leverage/i)) {
    return { type: 'probablyOrder' as any, text: message } as any;
//    return null;
  }
  
  return null;
}

export function parseOrderString01(message: string): Partial<Order> | null {
    const patterns = [
      /(?<coin>[\w\/]+)\n\n(?<direction>Long|Short)\n\nLeverage:(?<leverage>\d+)x\n\nEntry-above:(?<entry>[\d., -]+)\n\nTake-Profit-Targets:(?<targets>[\d+-. ]+)\n\nStopLoss:(?<sl>[\d]+).*/guim,
      /(?<coin>[\w\/]+)\n\n(?<direction>Long|Short)\n\nLeverage:(?<leverage>\d+)x\n\nEntry[\w\- ]+:(?<entry>[\d., -]+)\n\nTake-Profit-Targets?:(?<targets>[\d+-. ]+)\n\nStoploss:(?<sl>[\d]+).*/guim,
      /(?<coin>[\w\/]+)\n*(?<direction>Long|Short)\n*Leverage:(?<leverage>\d+)x\n*Entry[\w\- ]+:(?<entry>[\d., -]+)\n*Take-Profit-Targets?:(?<targets>[\d+-. ]+)\n*Stop ?loss ?: ?(?<sl>[\d]+)/guim,
      /(?<coin>[\w\/]+)[\n\s]*(?<direction>Long|Short)[\n\s]*Leverage:(?<leverage>\d+)x[\n\s]*Entry[\w\- ]+:(?<entry>[\d., -]+)[\n\s]*Take-Profit-Targets?:(?<targets>[\d+-. ]+)[\n\s]*Stop ?loss ?: ?(?<sl>[\d]+)/guim,
    ];

    for (const pattern of patterns) {
        const match = pattern.exec(message);

        if (!match) {
            continue;
        }

        const targetsStr = match.groups?.targets ?? "";
        const targetSubpattern = /Target (?<target>\d+) : (?<targetValue>[\d\.,]+)?/g;
        const targetMatches = [
          ...targetsStr.matchAll(targetSubpattern)
        ].map((x, idx) => ({
              tp: idx + 1, // parseInt(x.groups?.target ?? ''),
      value: cleanAndParseFloat(x.groups?.targetValue ?? ""),
    }));

    const targets = targetMatches.map((x) => x.value);

    const coin = match.groups?.coin ?? match[1];
    const direction = (match.groups?.direction ?? match[2]).toUpperCase();
    const exchange = null;
    const leverageStr = match.groups?.leverage ?? match[4];
    const leverage = parseInt(leverageStr);
    const entry = (match.groups?.entry ?? match[5]).trim().split(" - ").map((x) => cleanAndParseFloat(x));
    const stopLoss = cleanAndParseFloat(match.groups?.sl ?? match[7]);

    const parsedMessage = {
      type: "order" as any,
      coin: coin.trim(),
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
      /.*\\n\\n(?<coin>[^\n]+)\\n+(?<direction>Short|Long)\\n\\nLeverage:(?<leverage>\d+)x\\n\\nEntry:(?<entry>[\d., -]+)\\n\\nTake-Profit-Targets:(?<targets>[\d.+-]+(?:-[\d.]+)*)\\n\\n(?:StopLoss:(?<sl>[\d.]+))?/guim;
  const match = pattern.exec(message);

  if (!match) {
    return null;
  }

  const targetsStr = match.groups?.targets ?? "";
  const targetSubpattern =
      /Target (?<target>\d+):\s+(?<targetValue>[\d\.,]+)?/g;
  const targetMatches = [...targetsStr.matchAll(targetSubpattern)].map((
      x,
      idx,
  ) => ({
    tp: idx + 1, // parseInt(x.groups?.target ?? ''),
    value: cleanAndParseFloat(x.groups?.targetValue ?? ""),
  }));

  const targets = targetMatches.map((x) => x.value);

  const coin = match.groups?.coin ?? match[1];
  const direction = (match.groups?.direction ?? match[2]).toUpperCase();
  const exchange = null;
  const leverageStr = match.groups?.leverage ?? match[4];
  const leverage = parseInt(leverageStr);
  const entry = (match.groups?.entry ?? match[5]).trim().split(" - ").map((x) =>
      cleanAndParseFloat(x)
  );
  const stopLoss = cleanAndParseFloat(match.groups?.sl ?? match[7]);

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

export function parseOrderString03(message: string): Partial<Order> | null {
  const pattern =
      /(?<coin>[\w\/]+)\n*(?<direction>Long|Short)\n*Leverage:(?<leverage>\d+)X\n*Entry[\w\- ]*:(?<entry>[\d., -]+)\n*Take-Profit-Targets?:(?<targets>[\d+-. ]+)\n*Stop ?loss ?: ?(?<sl>[\d\.]+)/gium
//      /(?<coin>[\w\/]+)\n*(?<direction>Long|Short)\n*Leverage:(?<leverage>\d+)x\n*Entry:(?<entry>[\d., -]+)\n*Take-Profit-Targets?:(?<targets>[\d+-. ]+)\n*Stoploss:(?<sl>[\d]+)/guim;

  return parseOrderText(message, pattern);
}

export function parseOrder(messageDiv: HTMLElement): Partial<Order> | null {
  const textDiv = (messageDiv.getElementsByClassName('text')?.[0] as HTMLElement);

  if (messageDiv.innerText.match(/tradingview.com/) && messageDiv.innerText.match(/leverage/i)) {
    if (textDiv.innerHTML.match(/tel:/)) {
      textDiv.innerHTML = textDiv.innerHTML.replace(/<a href="tel:([^"]+)">([^<]+)<\/a>/, '$1');
    }

   // this is highly likely an order
    const children = Array.from(textDiv.childNodes)
        .filter((x: Element) => x.nodeName?.toLowerCase() != 'br' && (x.nodeName?.toLowerCase() != 'a' || x.nodeValue?.match(/tradingview.com/) == null));

    const order: Partial<Order> = {
      type: 'order',
    };

    const extractText = (node:Element) => {
      const text = [...node.childNodes].find(child => child.nodeType === 3);
      return text && text?.textContent?.trim();
    }

    for (let child of children) {
      const text = extractText(child) ?? child?.nodeValue ?? '';
      
      if (text.toUpperCase().indexOf('USDT') !== -1) {
        order.coin = text?.trim();
      } else if (text.match(/short|long/i)) {
        order.direction = text?.trim().toUpperCase();
      } else if (text.match(/leverage/i)) {
        const matches = /\d+/.exec(text);
        if (matches) {
          order.leverage = parseInt(matches[0]);
        }
      } else if (text.match(/entry/i)) {
        const matches = /.*:[^\d]*([\d.\- ]+)/.exec(text);
        if (matches) {
          const entries = matches[1]?.split(/ ?- ?/)?.map(x => parseFloat(x));
          order.entry = entries;
        }
      } else if (text.match(/target/i)) {
        const matches = /.*:([\d.\- ]+)/.exec(text);
        if (matches) {
          const targets = matches[1]?.split(/ ?- ?/)
              ?.filter(x => x !== '')
              ?.map(x => parseFloat(x));
          order.targets = targets;
        }
      } else if (text.match(/stop/i)) {
        const matches = /.*:([\d.\- ]+)/.exec(text);
        if (matches) {
          const sl = matches[1]?.split(/ ?- ?/)?.map(x => parseFloat(x)).at(0);
          order.stopLoss = sl;
        }
      }
    }

    if (order.entry == null || order.stopLoss == null) {
      const text = cleanUpHtml(textDiv);
      return parseOrderString(text);
    }
  }

  // todo: cleanup here makes it actually worse...
  const text = cleanUpHtml(textDiv); // messageDiv.innerText ?? "";
  return parseOrderString(text);
}

export function parseEntry(messageDiv: HTMLElement): Partial<Entry> | null {
  if (messageDiv.innerText.match(/Entered entry zone/)) {
    const referencedMessageId = getReferencedMessageId(messageDiv);
    return {
      type: 'entry',
      relatedTo: referencedMessageId,
    };
  }

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
  if (messageDiv.innerText.match(/Manually Cancelled|Cancel this trade/)) {
    const referencedMessageId = getReferencedMessageId(messageDiv);

    return {
      type: "cancelled",
      relatedTo: referencedMessageId,
    };
  }

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

function parseInfoMessage(messageDiv: HTMLElement): Partial<InfoMessage> | null {
  const text = messageDiv.innerText ?? '';
  
  const pattern = /test|unknown/g;
  const matches = pattern.exec(text);
  
  if (matches != null) {
    return {
      type: 'info',
      text: text 
    };
  }

  return null;
}

function cleanUpHtml(div: HTMLElement): string {
  const hrefs = div?.getElementsByTagName('a');
  hrefs?.filter((href: HTMLAnchorElement) => href.getAttribute('href').match(/tradingview.com/))
      ?.forEach((href: HTMLAnchorElement) => div?.removeChild(href));

  return div?.innerText?.trim() ?? '';
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
      parseInfoMessage,
  ];

  return parseMessagePipeline(messageDiv, pipeline);
}

export function getAllMessages(): Message[] {
  return parserGetAllMessages(parseMessage);
}
