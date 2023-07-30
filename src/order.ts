export interface Order {
    amount?: number;
    coin: string;
    leverage?: number;
    exchange?: string;
    date: Date;
    entries: number[];
    tps: number[];
    sl: number | null;
    direction?: 'SHORT' | 'LONG';
    config?: any;
}
