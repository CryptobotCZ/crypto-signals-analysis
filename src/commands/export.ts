import { writeJson } from "https://deno.land/x/jsonfile/mod.ts";

import { OrderDetail, getPotentialLoss, getTPPotentialProfit, groupRelatedOrders, getOrderKey } from "../parser.ts";
import { parse } from "./parse.ts";
import {getLeverage, Order as CornixOrder} from "../order.ts";

export interface ExportConfig {
  locale: string;
  delimiter: string;
  decimalSeparator?: string;
}

const defaultConfig: ExportConfig = {
  locale: 'en-UK',
  delimiter: ',',
  decimalSeparator: '.'
};

function fillMissingValuesWithDefault(array: number[], expectedLength: number, defaultValue: number = 0) {
  return array.concat([...Array(expectedLength - array.length).map(_ => defaultValue)]);
}

function getDecimalSeparator(locale: string) {
  const numberWithDecimalSeparator = 1.1;
  const intl = new Intl.NumberFormat(locale);

  return intl.formatToParts(numberWithDecimalSeparator)
    .find(part => part.type === 'decimal')
    ?.value;
}


export async function exportFromDb() {}

export interface ExportArguments {
  inputFiles: string[];
  signals: string;
  outputPath: string;
  anonymize: boolean;
  format?: 'csv' | 'order-json';
  leverage?: 'min' | 'max';
  parserConfigPath?: string;
}

export async function exportFromSource(argv: ExportArguments, config: ExportConfig = defaultConfig) {
  const { inputFiles, signals, outputPath, anonymize } = argv;
  const parsedData = await parse(inputFiles, signals, argv);

  await doExport(parsedData.orderSignals, outputPath, anonymize, argv.format, argv.leverage, config);

  if (argv.debug) {
    const probablyOrders = parsedData.messages.filter(x => x.type as any === 'probablyOrder');
    await writeJson('probablyOrders.json', probablyOrders, { spaces: 2 });

    const unknownMessages = parsedData.messages.filter(x => x.type === 'unknown');
    await writeJson('unknown-messages.json', unknownMessages, {spaces: 2});
  }
}

export async function doExport(
  orderDetails: OrderDetail[],
  path: string,
  anonymize: boolean = false,
  format: string = 'csv',
  leverage: string = 'max',
  config: ExportConfig = defaultConfig
) {
  if (format === 'csv') {
    return await exportCsv(orderDetails, path, anonymize, config);
  } else if (format === 'order-json') {
    return await exportJson(orderDetails, path, undefined, leverage);
  } else {
    throw new Error('Invalid export format');
  }
}

// amount?: number;
// coin: string;
// leverage?: number;
// exchange?: string;
// date: Date;
// timestamp: number;
// entries: number[];
// tps: number[];
// sl: number;
// direction?: 'SHORT' | 'LONG';

async function exportJson(orderDetails: OrderDetail[], path: string, withOrderConfig = false, leverage = 'max') {
  const mapToExportedEvent = (event) => {
    return {
      type: event.type,
      date: event.date,
    };
  };

  const ordersForExport: CornixOrder[] = orderDetails.map(order => {
    return {
      signalId: order.order.signalId ?? getOrderKey(order),
      coin: order.order.coin?.trim()?.toUpperCase(),
      direction: order.order.direction?.trim()?.toUpperCase() as any,
      date: order.order.date,
      leverage: getLeverage(order.order.leverage, leverage),
      exchange: order.order.exchange,
      entries: order.order.entry,
      tps: order.order.targets,
      sl: order.order.stopLoss,
      events: order.events.map(mapToExportedEvent),
      ...({ config: (withOrderConfig ? order.order.config : undefined) }),
    };
  });

  await writeJson(path, ordersForExport, { spaces: 2 });
}

async function exportCsv(orderDetails: OrderDetail[], path: string, anonymize: boolean = false, config: ExportConfig = defaultConfig) {
    const intl = new Intl.NumberFormat(config.locale, {
      useGrouping: false
    });
    const decimalSeparator = config.decimalSeparator ?? getDecimalSeparator(config.locale);

    const orderDetailsWithoutSpot = orderDetails.filter(x => x.order.type !== 'spotOrder');
    const groupedOrders = groupRelatedOrders(orderDetailsWithoutSpot);

    const maxStats = orderDetails.reduce((stats: any, x) => {
        return {
          maxCountTP: Math.max(stats.maxCountTP, x.order.targets.length),
          maxCountEntry: Math.max(stats.maxCountEntry, x.order.entry.length)
        };
      }, {
        maxCountTP: 0,
        maxCountEntry: 0
      });

      const sensitiveDataHeader = [
        ...[...Array(maxStats.maxCountEntry).keys()].map((x, idx) => `EP${idx + 1}`),
        ...[...Array(maxStats.maxCountTP).keys()].map((x, idx) => `TP${idx + 1}`),
        'stopLoss',
      ];

      const csvHeader = [
        'signalId',
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
        ...(anonymize ? [] : sensitiveDataHeader),
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

        const sensitiveData = [
          ...fillMissingValuesWithDefault(order.entry, maxStats.maxCountEntry),
          ...fillMissingValuesWithDefault(order.targets, maxStats.maxCountTP),
          order.stopLoss,
        ];

        const potentialProfitValues = fillMissingValuesWithDefault(getTPPotentialProfit(x.order), maxStats.maxCountTP);

        return [
          (order as any).signalId,
          order.date.toLocaleDateString(config.locale, options as any),
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
          ...(anonymize ? [] : sensitiveData),
          ...potentialProfitValues,
          getPotentialLoss(x.order),
        ].map((x, idx) => {
          const val = idx > 0 && typeof x === 'number'
            ? intl.format(x)
            : x;

          if (val?.toString()?.includes(config.delimiter)) {
            return `"${val}"`;
          }

            return val;
        });
      });

      const separator = config.delimiter;
      const data = [ csvHeader, ...csvRows ].map(row => row.join(separator)).join('\n');

      await Deno.writeTextFileSync(path, data);
}
