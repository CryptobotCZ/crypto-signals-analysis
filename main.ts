import { Message, OrderDetail, StopLoss, getAllMessages, getOrderKey, getOrderSignalInfoFull, getOrderSignals,
  getPotentialLoss, getTPPotentialProfit, groupRelatedOrders, groupRelatedSignals, mapSLToOrder, parseMessage, updateOrderDetailWithSL } from "./parse-bk-cornix.ts";
import { getAllMessages as getAltSignalsMessages, Entry as AltEntry } from "./src/altsignals.ts";

  // import { JSDOM } from "jsdom";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {

}

async function parseFile<T>(path: string, parser: () => T[]) {
  const fileContent = await Deno.readTextFile(path);

  const document = new DOMParser().parseFromString(fileContent, 'text/html');

  window.document = document as any;

  const messagesFromFile = parser();
  return messagesFromFile;
}

async function parseAll<T>(directory: string, parser: () => T[]) {
  let messages: T[] = [];

  for await (const dirEntry of Deno.readDir(directory)) {
    if (dirEntry.isFile && dirEntry.name.endsWith(".html")) {
      const messagesFromFile = await parseFile(`${directory}/${dirEntry.name}`, parser);
      messages = [ ...messages, ...messagesFromFile ];
    }
  }

  return messages;
}

const directory = './data/binance-killers-history';
const messages: Message[] = []; // await parseAll(directory, getAllMessages);

const messageStats = messages.reduce((agg: any, x) => {
  if (!Object.hasOwn(agg, x.type)) {
    agg[x.type] = 0;
  }

  agg[x.type]++;

  return agg;
}, {});

console.log({ messageStats });

async function parseAltSignals() {
  const dir = './data/altsignals-low-lev-history';
  const messages = await parseAll(dir, getAltSignalsMessages);

  messages.sort((a,b) => (a.date as any) - (b.date as any));

  const entryMessages = messages.filter(x => x.type == 'entry') as AltEntry[]; // || x.type == 'entryAll');

  const averages = entryMessages.reduce((sum: any, x) => {
    if (!Object.hasOwn(sum, x.entry)) {
      sum[x.entry] = 0;
    }

    sum[x.entry]++;

    return sum;
  }, {});
  console.log(averages);

  const stats = messages.reduce((sum: any, x) => {
    if (!Object.hasOwn(sum, x.type)) {
      sum[x.type] = 0;
    }

    sum[x.type]++;

    return sum;
  }, {});
  console.log(stats);


  const probablyBuy = messages.filter(x => x.type === 'unknown' && x.text?.match(/leverage/i) && x.text?.match(/stop/i));
  console.log(probablyBuy);

  const probBuyString = probablyBuy.map(x => x.type === 'unknown' ? x.text : '').join('\n');

  await Deno.writeTextFileSync('altsignals-buy.json', probBuyString); // JSON.stringify(probablyBuy));

  console.log(entryMessages);
}

await parseAltSignals();

Deno.exit();

async function parseBinanceKillers(messages: Message[]) {

  const unknownMessages = messages.filter(x => x.type === 'unknown');

  const groupedSignals = groupRelatedSignals(messages);
  const orderSignals = getOrderSignals(messages).map(x => getOrderSignalInfoFull(x, groupedSignals)) as OrderDetail[];

  const slSignals = messages.filter(x => x.type == 'SL') as StopLoss[];
  slSignals.forEach(x => mapSLToOrder(x, orderSignals, groupedSignals, messages));

  const binanceFuturesSignals = orderSignals.filter(x => x.order?.exchange == "Binance Futures");
  const binanceFuturesProfitable = binanceFuturesSignals.filter(x => x.tps.length > 1);

  const sumTpPcts = binanceFuturesProfitable.reduce((sum, x) => sum + x.tps[x.tps.length - 1].pct, 0);
  const avgTpPcts =  sumTpPcts / binanceFuturesProfitable.length;

  console.log( { sumTpPcts, avgTpPcts });

  const binanceFuturesSL = binanceFuturesSignals.filter(x => x.sl.length > 1);

  console.log(binanceFuturesSL.length);

  const signalsWithoutTpAndSl = orderSignals.filter(x => x.sl.length == 0 && x.tps.length == 0 && x.entries.length == 0);
  console.log({ signalsWithoutTpAndSl: signalsWithoutTpAndSl.length });

  const coins = new Set(orderSignals.map(x => x.order.coin));

  const coinsAndCountOrders = orderSignals.reduce((acc: Map<string, number>, x) => {
    const count = acc.has(x.order.coin) ? acc.get(x.order.coin)! : 0;
    acc.set(x.order.coin, count + 1);

    return acc;
  }, new Map());

  console.log(coinsAndCountOrders);


  const recentOrders = orderSignals.filter(x => x.order.date >= new Date(2022, 0, 1));
  const groupedOrders = groupRelatedOrders(recentOrders);

  const recentOrdersWithoutTpAndSl = recentOrders.filter(x => x.sl.length == 0 && x.tps.length == 0); // && x.entries.length == 0);

  recentOrdersWithoutTpAndSl.forEach(order => {
    const key = getOrderKey(order);
    const relatedOrders = groupedOrders[key];

    const anyRelatedOrderHasTp = relatedOrders.filter(x => x.order.maxReachedTp > 0);

    if (anyRelatedOrderHasTp.length > 0) {
      console.log('');
    }

    const anyRelatedOrderHasSL = relatedOrders.filter(x => x.order.sl.length > 0);
    if (anyRelatedOrderHasSL.length > 0) {
      updateOrderDetailWithSL(order, anyRelatedOrderHasSL[0].order.sl[0]);
    }
  });

  console.log(Object.keys(groupedOrders).length);

  const maxStats = recentOrders.reduce((stats: any, x) => {
    return {
      maxCountTP: Math.max(stats.maxCountTP, x.order.targets.length),
      maxCountEntry: Math.max(stats.maxCountEntry, x.order.entry.length)
    };
  }, {
    maxCountTP: 0,
    maxCountEntry: 0
  });

  const csvHeader = [
    'date',
    'coin',
    'exchange',
    'direction',
    'leverage',
    'avgEntryPrice',
    'avgTpValue',
    'maxReachedEntry',
    'maxReachedTp',
    'pnl',
    'status',
    ...[...Array(maxStats.maxCountEntry).keys()].map((x, idx) => `EP${idx + 1}`),
    ...[...Array(maxStats.maxCountTP).keys()].map((x, idx) => `TP${idx + 1}`),
    'stopLoss',
    ...[...Array(maxStats.maxCountTP).keys()].map((x, idx) => `TP Pot. Profit ${idx + 1}`),
    'potentialLoss'
  ];

  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };

  const csvRows = Object.keys(groupedOrders).flatMap(x => groupedOrders[x]).map(x => {
    const order = x.order.order;

    return [
      order.date.toLocaleDateString('cs-CZ', options as any),
      order.coin,
      order.exchange,
      order.direction,
      order.leverage,
      x.order.avgEntryPrice,
      x.order.avgTpValue,
      x.order.maxReachedEntry,
      x.order.maxReachedTp,
      x.order.pnl,
      x.order.closed ? 'closed' : 'open',
      ...order.entry.concat([...Array(maxStats.maxCountEntry - order.entry.length).map(_ => 0)]),
      ...order.targets.concat([...Array(maxStats.maxCountTP - order.targets.length).map(_ => 0)]),
      order.stopLoss,
      ...getTPPotentialProfit(x.order).concat([...Array(maxStats.maxCountTP - order.targets.length).map(_ => 0)]),
      getPotentialLoss(x.order),
    ].map((x, idx) => {
      if (idx > 0)
        return x?.toString()?.replace('.', ',');
      return x;
    });
  });

  const separator = ';';
  const data = [ csvHeader, ...csvRows ].map(row => row.join(separator)).join('\n');

  await Deno.writeTextFileSync('results.csv', data);
}
