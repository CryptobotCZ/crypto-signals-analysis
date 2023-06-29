import { _ } from "https://deno.land/x/fuzzy_octo_guacamole@v3.0.0/patterns.ts";
import { match } from "https://deno.land/x/fuzzy_octo_guacamole@v3.0.0/mod.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import * as fs from "https://deno.land/std@0.192.0/fs/mod.ts";

import { getAllMessages as getAltSignalsMessages } from "../altsignals.ts";
import { getAllMessages as getBKChannelMessages } from "../binance-killers-channel.ts";
import { getAllMessages as getBKCornixMessages } from "../binance-killers-cornix.ts";
import { getAllMessages as getBitsturtleMessages, getOrderSignalInfoFull as getBitsTurtleOrderSignalInfoFull } from "../bitsturtle.ts";
import { OrderDetail, StopLoss, getOrderSignalInfoFull, getOrderSignals, groupRelatedSignals, mapSLToOrder } from "../parser.ts";

export async function parseFile<T>(path: string, parser: () => T[]) {
    const fileContent = await Deno.readTextFile(path);

    const document = new DOMParser().parseFromString(fileContent, 'text/html');

    window.document = document as any;

    const messagesFromFile = parser();
    return messagesFromFile;
  }

export async function parseAll<T>(inputPaths: string[], parser: () => T[]) {
    let messages: T[] = [];

    for (const path of inputPaths) {

      const isReadableDir = await fs.exists(path, {
        isReadable: true,
        isDirectory: true
      });

      const isReadableFile = await fs.exists(path, {
        isReadable: true,
        isFile: true
      });

      if (isReadableDir) {
        const directory = path;
        for await (const dirEntry of Deno.readDir(directory)) {
          if (dirEntry.isFile && dirEntry.name.endsWith(".html")) {
            const messagesFromFile = await parseFile(`${directory}/${dirEntry.name}`, parser);
            messages = [ ...messages, ...messagesFromFile ];
          }
        }
      }

      if (isReadableFile) {
        const messagesFromFile = await parseFile(path, parser);
        messages = [ ...messages, ...messagesFromFile ];
      }
    }

    return messages;
  }

export async function parse(directory: string[], group: string) {
    const parser = match(group)
        .with('bk-group', () => getBKChannelMessages)
        .with('bk-cornix', () => getBKCornixMessages)
        .with('altsignals', () => getAltSignalsMessages)
        .with('bitsturtle', () => getBitsturtleMessages)
        .with(_, () => { throw new Error('Invalid group'); })
        .exhaustive();

    const messages = await parseAll(directory, parser);
    messages.sort((a,b) => (a.date as any) - (b.date as any));

    const unknownMessages = messages.filter(x => x.type === 'unknown');
    const slSignals = messages.filter(x => x.type == 'SL') as StopLoss[];

    const getOrderInfo = group === 'bitsturtle' ? getBitsTurtleOrderSignalInfoFull : getOrderSignalInfoFull;
    const groupedSignals = groupRelatedSignals(messages);
    const orderSignals = getOrderSignals(messages).map(x => getOrderInfo(x, groupedSignals)) as OrderDetail[];

    const ordersWithoutTp = orderSignals.filter(x => x.other.length == 0);

    // const recentMessages = messages.filter(x => x.date >= new Date(2023, 5, 10));
    // const groupedRecentSignals = groupRelatedSignals(recentMessages);
    // const recentOrderSignals = getOrderSignals(recentMessages).map(x => getOrderInfo(x, groupedRecentSignals)) as OrderDetail[];


    slSignals.forEach(x => mapSLToOrder(x, orderSignals, groupedSignals, messages));

    const binanceFuturesSignals = orderSignals.filter(x => x.order?.exchange == "Binance Futures");
    const binanceFuturesProfitable = binanceFuturesSignals.filter(x => x.tps.length > 1);

    const sumTpPcts = binanceFuturesProfitable.reduce((sum, x) => sum + x.tps[x.tps.length - 1].pct, 0);
    const avgTpPcts =  sumTpPcts / binanceFuturesProfitable.length;

    console.log( { sumTpPcts, avgTpPcts });
    console.log(messages);

   const messageStats = messages.reduce((agg: any, x) => {
        if (!Object.hasOwn(agg, x.type)) {
          agg[x.type] = 0;
        }

        agg[x.type]++;

        return agg;
      }, {});

    console.log({ messageStats });

    return { messages, orderSignals, groupedSignals };
}
