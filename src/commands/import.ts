import { db, createSignal, getChannelIdByName, createSignalConfigEntry, createSignalConfigTp, createSignalReachedEntry } from "../database.ts";
import { getMaxPotentialProfit, getPotentialLoss } from "../parser.ts";
import { parse } from "./parse.ts";



export async function importData(directory: string, channel: string) {
    const parsedData = await parse(directory, channel);

    const channelId = getChannelIdByName(db, channel);

    parsedData.orderSignals.forEach(order => {
        const signalId = createSignal(db, {
            signal_id: order.order.signalId ?? null,
            date: (order.order.date.getUTCMilliseconds() / 1000).toString(),
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
            createSignalReachedEntry(db, {
                signal_id: signalId,
                entry_id: entries[idx],
                value: entry.price,
                date: entry.date,
            });
        });
    });
}
