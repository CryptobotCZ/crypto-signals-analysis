import { _ } from "https://deno.land/x/fuzzy_octo_guacamole@v3.0.0/patterns.ts";
import { match } from "https://deno.land/x/fuzzy_octo_guacamole@v3.0.0/mod.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

import { getAllMessages as getAltSignalsMessages } from "../altsignals.ts";
import { getAllMessages as getBKChannelMessages } from "../binance-killers-channel.ts";
import { getAllMessages as getBKCornixMessages } from "../binance-killers-cornix.ts";
import { OrderDetail, StopLoss, getOrderSignalInfoFull, getOrderSignals, groupRelatedSignals, mapSLToOrder } from "../parser.ts";

export async function parseFile<T>(path: string, parser: () => T[]) {
    const fileContent = await Deno.readTextFile(path);

    const document = new DOMParser().parseFromString(fileContent, 'text/html');

    window.document = document as any;

    const messagesFromFile = parser();
    return messagesFromFile;
  }

export async function parseAll<T>(directory: string, parser: () => T[]) {
    let messages: T[] = [];

    for await (const dirEntry of Deno.readDir(directory)) {
      if (dirEntry.isFile && dirEntry.name.endsWith(".html")) {
        const messagesFromFile = await parseFile(`${directory}/${dirEntry.name}`, parser);
        messages = [ ...messages, ...messagesFromFile ];
      }
    }

    return messages;
  }

export async function parse(directory: string, group: string) {
    console.log( { directory, group });

    const parser = match(group)
        .with('bk-group', () => getBKChannelMessages)
        .with('bk-cornix', () => getBKCornixMessages)
        .with('altsignals', () => getAltSignalsMessages)
        .with(_, () => { throw new Error('Invalid group'); })
        .exhaustive();

    const messages = await parseAll(directory, parser);
    messages.sort((a,b) => (a.date as any) - (b.date as any));

    const unknownMessages = messages.filter(x => x.type === 'unknown');
    const slSignals = messages.filter(x => x.type == 'SL') as StopLoss[];

    const groupedSignals = groupRelatedSignals(messages);
    const orderSignals = getOrderSignals(messages).map(x => getOrderSignalInfoFull(x, groupedSignals)) as OrderDetail[];

    slSignals.forEach(x => mapSLToOrder(x, orderSignals, groupedSignals, messages));

    const binanceFuturesSignals = orderSignals.filter(x => x.order?.exchange == "Binance Futures");
    const binanceFuturesProfitable = binanceFuturesSignals.filter(x => x.tps.length > 1);

    const sumTpPcts = binanceFuturesProfitable.reduce((sum, x) => sum + x.tps[x.tps.length - 1].pct, 0);
    const avgTpPcts =  sumTpPcts / binanceFuturesProfitable.length;

    console.log( { sumTpPcts, avgTpPcts });
    console.log(messages);

    return { messages, orderSignals, groupedSignals };
}
