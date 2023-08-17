import { Order as ParserOrder } from './parser.ts';

export interface Order {
    amount?: number;
    coin: string;
    leverage?: number;
    exchange?: string|null;
    date: Date;
    entries: number[];
    tps: number[];
    sl: number | null;
    direction?: 'SHORT' | 'LONG';
    config?: any;
}

export function validateOrder(order: ParserOrder) {
    const isArraySortedAsc = (arr: number[]) => arr.every((v, i, a) => !i || a[i-1] <= v);
    const isArraySortedDesc = (arr: number[]) => arr.every((v, i, a) => !i || a[i-1] >= v);
    const direction = order.direction ?? (order.targets[0] > order.entry[0] ? "LONG" : "SHORT");

    if (direction === 'SHORT') {
        if (!isArraySortedAsc(order.entry)) {
            console.log('For SHORT order, entries should be in ascending order');
            return false;
        }

        if (!isArraySortedDesc(order.targets)) {
            console.log('For SHORT order, TPs should be in descending order');
            return false;
        }

        if (order.targets[0] > order.entry[0]) {
            console.log('For SHORT trades, first TPs must be lower then entry price');
            return false;
        }
    } else if (direction === 'LONG') {
        if (!isArraySortedDesc(order.entry)) {
            console.log('For LONG order, entries should be in descending order');
            return false;
        }

        if (!isArraySortedAsc(order.targets)) {
            console.log('For LONG order, TPs should be in ascending order');
            return false;
        }

        if (order.targets[0] < order.entry[0]) {
            console.log('For LONG trades, first TPs must be higher then entry price');
            return false;
        }
    }

    return true;
}

export function getLeverage(orderLeverage: number|number[], leverage: string = 'max') {
    if (Array.isArray(orderLeverage)) {
        return leverage === 'max'
            ? orderLeverage[1]
            : orderLeverage[0];
    }

    return orderLeverage;
}
