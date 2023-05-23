import { Message, OrderDetail, StopLoss, getAllMessages, getOrderSignalInfoFull, getOrderSignals, groupRelatedSignals, mapSLToOrder, parseMessage } from "./parse-bk-cornix.ts";
// import { JSDOM } from "jsdom";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {

}

const directory = './binance-killers-history';

async function parseAll() {
  let messages: Message[] = [];

  for await (const dirEntry of Deno.readDir(directory)) {
    if (dirEntry.isFile && dirEntry.name.endsWith(".html")) {
      const fileContent = await Deno.readTextFile(`${directory}/${dirEntry.name}`);

      const document = new DOMParser().parseFromString(fileContent, 'text/html');

      window.document = document as any;

      const messagesFromFile = getAllMessages();
      messages = [ ...messages, ...messagesFromFile ];
    }
  }

  return messages;
}

async function parseLatest() {
  const fileContent = await Deno.readTextFile(`${directory}/messages17.html`);

  const document = new DOMParser().parseFromString(fileContent, 'text/html');

  window.document = document as any;

  const messagesFromFile = getAllMessages();
  return messagesFromFile;
}

const messages = await parseLatest();

const groupedSignals = groupRelatedSignals(messages);
const orderSignals = getOrderSignals(messages).map(x => getOrderSignalInfoFull(x, groupedSignals)) as OrderDetail[];

const slSignals = messages.filter(x => x.type == 'SL') as StopLoss[];
slSignals.forEach(x => mapSLToOrder(x, orderSignals, groupedSignals, messages));
//
const binanceFuturesSignals = orderSignals.filter(x => x.order?.exchange == "Binance Futures");
const binanceFuturesProfitable = binanceFuturesSignals.filter(x => x.tps.length > 1);

const sumTpPcts = binanceFuturesProfitable.reduce((sum, x) => sum + x.tps[x.tps.length - 1].pct, 0);
const avgTpPcts =  sumTpPcts / binanceFuturesProfitable.length;

console.log( { sumTpPcts, avgTpPcts });

const binanceFuturesSL = binanceFuturesSignals.filter(x => x.sl.length > 1);

console.log(binanceFuturesSL.length);