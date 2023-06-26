import { OrderDetail, getPotentialLoss, getTPPotentialProfit, groupRelatedOrders } from "../parser.ts";

export async function doExport(orderDetails: OrderDetail[], path: string) {
    const groupedOrders = groupRelatedOrders(orderDetails);

    const maxStats = orderDetails.reduce((stats: any, x) => {
        return {
          maxCountTP: Math.max(stats.maxCountTP, x.order.targets.length),
          maxCountEntry: Math.max(stats.maxCountEntry, x.order.entry.length)
        };
      }, {
        maxCountTP: 0,
        maxCountEntry: 0
      });

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
          (order as any).signalId,
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

      await Deno.writeTextFileSync(path, data);
}
