import { _ } from "../../deps.ts";
import { match } from "../../deps.ts";
import { DOMParser } from "../../deps.ts";
import { fs } from "../../deps.ts";

import { getAllMessages as getGenericMessages } from "../generic.ts";
import { getAllMessages as getAltSignalsMessages } from "../altsignals.ts";
import { getAllMessages as getBKChannelMessages } from "../binance-killers-channel.ts";
import { getAllMessages as getBKCornixMessages } from "../binance-killers-cornix.ts";
import { getAllMessages as getBitsturtleMessages, getOrderSignalInfoFull as getBitsTurtleOrderSignalInfoFull } from "../bitsturtle.ts";
import { getAllMessages as getWallstreetQueenMessages } from "../wallstreet_queen.ts";
import { getAllMessages as getCryptokeyMessages } from "../cryptokey.ts";
import { getAllMessages as getBinanceMasterMessages } from "../binance_master.ts";
import { getAllMessages as getBinanceProMessages } from "../binance-pro.ts";
import { getAllMessages as getRnmkrFreeMessages } from "../rnmkr-free.ts";
import { getAllMessages as get8BitAlgozMessages } from "../8bit-algoz.ts";
import { getAllMessages as getWallStreetCryptoTradingMessages } from "../wallstreet_crypto_trading.ts";
import { getAllMessages as getFutureBullsMessages } from "../future-bulls.ts";
import { getAllMessages as getAccountantMessages } from "../accountant.ts";
import { getAllMessages as getPlanktonMessages } from "../plankton.ts";
import { configurableParsers, getAllMessagesFromParser, getConfigurableParser } from "../configurable-parser.ts";

import { OrderDetail, StopLoss, getOrderSignalInfoFull, getOrderSignals, groupRelatedSignals, mapSLToOrder, TakeProfitAll } from "../parser.ts";

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

export async function parse(directory: string[], group: string, config?: any) {
    const parser = match(group)
        .with('bk-group', () => getBKChannelMessages)
        .with('bk-cornix', () => getBKCornixMessages)
        .with('altsignals', () => getAltSignalsMessages)
        .with('bitsturtle', () => getBitsturtleMessages)
        .with('wallstreet-queen', () => getWallstreetQueenMessages)
        .with('cryptokey', () => getCryptokeyMessages)
        .with('binance-master', () => getBinanceMasterMessages)
        .with('binance-pro', () => getBinanceProMessages)
        .with('rnmkr-free', () => getRnmkrFreeMessages)
        .with('8bit-algoz', () => get8BitAlgozMessages)
        .with('generic', () => getGenericMessages)
        .with('wallstreet-crypto-trading', () => getWallStreetCryptoTradingMessages)
        .with('future-bulls', () => getFutureBullsMessages)
        .with('accountant', () => getAccountantMessages)
        .with('plancton', () => getPlanktonMessages)
        .with('configurable', () => {
            const configurableParser = getConfigurableParser(config);
            return configurableParser;
        })
        .with(_, () => {
            if (!configurableParsers.has(group)) {
                throw new Error('Invalid group');
            }

            const parser = configurableParsers.get(group)!;
            const parserFromClass = getAllMessagesFromParser(parser);
            return parserFromClass;
        })
        .exhaustive();

    const messages = await parseAll(directory, parser);
    messages.sort((a,b) => (a.date as any) - (b.date as any));

    const messageStats = messages.reduce((agg: any, x) => {
      if (!Object.hasOwn(agg, x.type)) {
        agg[x.type] = 0;
      }

      agg[x.type]++;

      return agg;
    }, {});

    console.info('Parsed messages statistics: ');
    console.info(JSON.stringify({ messageStats }));

    const unknownMessages = messages.filter(x => x.type === 'unknown');
    const slSignals = messages.filter(x => x.type == 'SL') as StopLoss[];

    const getOrderInfo = group === 'bitsturtle' ? getBitsTurtleOrderSignalInfoFull : getOrderSignalInfoFull;
    const groupedSignals = groupRelatedSignals(messages);
    const orderSignals = getOrderSignals(messages).map(x => getOrderInfo(x, groupedSignals)) as OrderDetail[];

    const ordersWithoutTp = orderSignals.filter(x => x.other.length == 0);

    slSignals.forEach(x => mapSLToOrder(x, orderSignals, groupedSignals, messages));

    const sumTpAllPcts = messages.filter(x => x.type == 'TPAll').reduce((x, y) => (y as TakeProfitAll).pct + x, 0);
    const sumpSlPcts = slSignals.reduce((x, y) => Math.abs(y?.pct ?? 0) + x, 0);
    const totalPcts = sumTpAllPcts - sumpSlPcts;
    const averagePnlPerOrder = totalPcts / orderSignals.length;

    console.log({
      sumTpAllPcts: sumTpAllPcts.toFixed(2),
      sumpSlPcts: sumpSlPcts.toFixed(2),
      totalPcts: totalPcts.toFixed(2),
      averagePnlPerOrder: averagePnlPerOrder.toFixed(2)
    });

    return { messages, orderSignals, groupedSignals };
}
