import { OrderDetail, getPotentialLoss, getTPPotentialProfit, groupRelatedOrders } from "../parser.ts";
import { parse } from "./parse.ts";

export interface ExportConfig {
  locale: string;
  delimiter: string;
  decimalSeparator: string;
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

export async function exportFromSource(directory: string, channel: string, destination: string, anonymize: boolean = false, config: ExportConfig = defaultConfig) {
  const parsedData = await parse(directory, channel);

  await doExport(parsedData.orderSignals, destination, anonymize, config);
}

export async function doExport(orderDetails: OrderDetail[], path: string, anonymize: boolean = false, config: ExportConfig = defaultConfig) {
    const intl = new Intl.NumberFormat(config.locale);
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
          ...fillMissingValuesWithDefault(getTPPotentialProfit(x.order), maxStats.maxCountTP),
          getPotentialLoss(x.order),
        ].map((x, idx) => {
          if (idx > 0 && typeof x === 'number') {
            const formattedNumber = intl.format(x);

            if (config.delimiter === decimalSeparator) {
              return `"${formattedNumber}"`;
            } else {
              return formattedNumber;
            }
          }

          if (x?.toString()?.includes(config.delimiter)) {
            return `"${x}"`;
          }

            return x;
        });
      });

      const separator = config.delimiter;
      const data = [ csvHeader, ...csvRows ].map(row => row.join(separator)).join('\n');

      await Deno.writeTextFileSync(path, data);
}
