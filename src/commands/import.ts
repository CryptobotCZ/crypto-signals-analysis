import { DB } from 'https://deno.land/x/sqlite@v3.7.2/mod.ts';
import { TakeProfitAll } from '../parser.ts';
import { createSignal, getChannelIdByName, createSignalConfigEntry, createSignalConfigTp, createSignalReachedEntry, createSignalReachedTp } from "../database.ts";
import { getMaxPotentialProfit, getPotentialLoss } from "../parser.ts";
import { parse } from "./parse.ts";

export async function importData(inputFiles: string[], channel: string, db: DB) {
    const parsedData = await parse(inputFiles, channel);

    const channelId = getChannelIdByName(db, channel);

    const counters = { orders: 0, entryPoints: 0, takeProfits: 0 };

    db.transaction(() => {
        parsedData.orderSignals.forEach(order => {
            const signalIdentifier = order.order.signalId ?? order.order.messageId ?? null;

            const signalId = createSignal(db, {
                signal_id: signalIdentifier,
                date: order.order.date,
                coin: order.order.coin,
                direction: order.order.direction,
                exchange: order.order.exchange,
                leverage: order.order.leverage,
                leverage_type: null, // 'isolated',
                status: order.closed ? 'closed' : 'open',
                stoploss: order.order.stopLoss,
                max_loss: getPotentialLoss(order),
                max_profit: getMaxPotentialProfit(order),
                pnl: order.pnl,
                max_reached_entry: order.maxReachedEntry,
                max_reached_tp: order.maxReachedTp,
                channel_id: channelId
            });

            counters.orders++;

            const entries = order.order.entry.map((entryConfig, idx) => {
                return createSignalConfigEntry(db, {
                    name: idx.toString(),
                    signal_id: signalId,
                    value: entryConfig,
                    percentage: null,
                });
            });

            const targets = order.order.targets.map((targetConfig, idx) => {
                return createSignalConfigTp(db, {
                    name: idx.toString(),
                    signal_id: signalId,
                    value: targetConfig,
                    percentage: null,
                });
            });

            order.entries.forEach((entry, idx) => {
                counters.entryPoints++;

                createSignalReachedEntry(db, {
                    signal_id: signalId,
                    entry_id: entries[idx],
                    value: entry.price,
                    date: entry.date,
                });
            });

            order.other.filter(x => x.type === 'TPAll').forEach((tp, idx) => {
                counters.takeProfits++;

                createSignalReachedTp(db, {
                    tp_id: null,
                    value: order.order.targets[0],
                    // percentage: (tp as TakeProfitAll).pct,
                    signal_id: signalId,
                    date: tp.date,
                } as any);
            });
        });
    });

    console.log(counters);
}
