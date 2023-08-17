import {
  Cancel,
  cleanAndParseFloat,
  Close,
  Entry,
  EntryAll,
  getOrderSignalInfoFull,
  getOrderSignals,
  groupRelatedSignals,
  mapSLToOrder,
  Message,
  Opposite,
  Order,
  OrderDetail,
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
  return parseOrderString01(message);
}

export function parseOrderString01(message: string): Partial<Order> | null {
  const pattern =
      /Pair #(?<coin>\S+).*Position:\s*(?<direction>long|short).*Entry zone:\s*(?<entry>[\d -.\n]+)[\s\n\\n]*Take Profits\s*(?<takeProfits>(?:- . TP #\d+: [\d.\n\\n ]+)+)\s*.*Stop loss\s*(?<sl>- . [\d.]+)/gusi
  const match = pattern.exec(message);


  if (!match) {
    return null;
  }

  const targetsStr = match.groups?.takeProfits ?? "";

  const parseTargets = (targetsStr: string) => {
    const targetSubpattern = / (?<targetValue>[\d.]+)/g;
    const targetMatches = [ ...targetsStr.matchAll(targetSubpattern) ].map((x, idx) => ({
      tp: idx + 1,
      value: cleanAndParseFloat(x.groups?.targetValue ?? ""),
    }));

    return targetMatches.map((x) => x.value);
  };

  const targets = parseTargets(targetsStr);

  const coin = match.groups?.coin ?? match[1];
  const direction = match.groups?.direction.toUpperCase();
  const exchange = null;
  const leverage = 1;
  const entry = match.groups?.entry?.trim().replace("- ", "")?.split("-").map((x) =>
    cleanAndParseFloat(x.trim().replace('$', ''))
  );

  const stopLoss = parseTargets(match.groups?.sl ?? '')?.[0];

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

export function parseOrder(messageDiv: HTMLElement): Partial<Order> | null {
  const text = messageDiv.innerText ?? "";
  return parseOrderString(text);
}

export function parseEntry(messageDiv: HTMLElement): Partial<Entry> | null {
  const entryPattern =
    /(?<exchange>.*)\n?\#(?<coin>.*) Entry (?:target )?(?<entry>\d+).*\n?Average Entry Price: (?<price>\d*\.?\d*)/gm;
  return baseParseEntry(messageDiv, entryPattern);
}

export function parseEntryAll(
  messageDiv: HTMLElement,
): Partial<EntryAll> | null {
  const entryPattern =
    /(?<exchange>.*)\n?#(?<coin>.*) All entry targets achieved\n?Average Entry Price: (?<price>\d*\.?\d*)/gm;
  return baseParseEntryAll(messageDiv, entryPattern);
}

export function parseClose(messageDiv: HTMLElement): Partial<Close> | null {
  const entryPattern = /CLOSE (?<coin>.*)/;
  return baseParseClose(messageDiv, entryPattern);
}

export function parseCancelled(
  messageDiv: HTMLElement,
): Partial<Cancel> | null {
  const entryPattern =
    /(?<exchange>.*)\n?#(?<coin>.*) Cancelled ❌\n?Target achieved before entering the entry zone/;
  return baseParseCancelled(messageDiv, entryPattern);
}

export function parseOpposite(
  messageDiv: HTMLElement,
): Partial<Opposite> | null {
  const pattern =
    /(?<exchange>.*)\n?#(?<coin>.*) Closed due to opposite direction signal/gm;
  return baseParseOpposite(messageDiv, pattern);
}

export function parseSLAfterTP(
  messageDiv: HTMLElement,
): Partial<SLAfterTP> | null {
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

export function parseTPWithoutProfit(
  messageDiv: HTMLElement,
): Partial<TakeProfit> | null {
  const pattern =
    /(?<exchange>.*)\n?#(?<coin>.*) Take-Profit target (?<target>\d+) ✅\n?\n?Period: (?<time>.*) ⏰/gm;
  return baseParseTPWithoutProfit(messageDiv, pattern);
}

export function parseTPAll(
  messageDiv: HTMLElement,
): Partial<TakeProfitAll> | null {
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
  const $$ = (selector: string) => Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  const messages = $$(".message.default").map((x) => parseMessage(x));

  return messages;
}

export function parseInBrowser() {
  const $$ = (selector: string) =>
    Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  const messages = $$(".message.default").map((x) => parseMessage(x));
  const savedMessages = localStorage.getItem("bk2") ?? "[]";
  const parsedSavedMessages = JSON.parse(savedMessages);
  const allMessages = [...parsedSavedMessages, ...messages].sort((x, y) =>
    x.date = y.date
  );
  localStorage.setItem("bk2", JSON.stringify(allMessages));

  const messagesWithFixedDate = allMessages.map((x) => {
    if (typeof x.date === "string") {
      return { ...x, date: new Date(x.date) };
    }

    return x;
  });
  const groupedSignals = groupRelatedSignals(messagesWithFixedDate);
  const orderSignals = getOrderSignals(messagesWithFixedDate).map((x) =>
    getOrderSignalInfoFull(x, groupedSignals)
  ) as OrderDetail[];

  const slSignals = messagesWithFixedDate.filter((x) => x.type == "SL");
  slSignals.forEach((x) =>
    mapSLToOrder(x, orderSignals, groupedSignals, messagesWithFixedDate)
  );

  const binanceFuturesSignals = orderSignals.filter((x) =>
    x.order?.exchange == "Binance Futures"
  );

  const binanceFuturesProfitable = binanceFuturesSignals.filter((x) =>
    x.tps.length > 1
  );

  const sumTpPcts = binanceFuturesProfitable.reduce(
    (sum, x) => sum + x.tps[x.tps.length - 1].pct,
    0,
  );
  const avgTpPcts = sumTpPcts / binanceFuturesProfitable.length;

  const binanceFuturesSL = binanceFuturesSignals.filter((x) => x.sl.length > 1);

  let interestingData = orderSignals.filter((x) =>
    x.order.exchange?.toLowerCase() === "Binance Futures".toLowerCase()
  ); //.map(x => getSignalInfoFull(x));
  Object.keys(groupedSignals).map((x) => groupedSignals[x]).filter((x) =>
    x.length == 1
  ).map((x) => x[0]).filter((x) =>
    x.type == "TP" && x.exchange?.match("Binance")
  );
}
