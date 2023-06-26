import { Schema } from "https://deno.land/x/cotton/mod.ts";
import { DB } from "https://deno.land/x/sqlite@v3.7.2/mod.ts";

export async function up(schema: Schema) {
    await schema.createTable("users", (table) => {
      table.id();
      table.varchar("name");
    });
  }

export async function down(schema: Schema) {
    await schema.dropTable("users");
}

export const db = new DB("test.db");


export interface DbSignal {
  id?: number;
  channel_id: number;
  date: Date;
  signal_id: string | null;
  coin: string;
  direction: string;
  leverage: number;
  leverage_type: string | null;
  stoploss: number | null;
  exchange: string;
  status: string;
  pnl: number;
  max_loss: number;
  max_profit: number;
  max_reached_entry: number;
  max_reached_tp: number;
}

function dateToUnixTimestamp(date: Date) {
  if (date == null) return null;

  return date.getTime() / 1000;
}

export function createSignal(db: DB, signal: DbSignal) {
  const cmd = db.prepareQuery<any, any, any>(`INSERT INTO signals(channel_id, timestamp, signal_id, coin, direction, leverage, leverage_type, stoploss, exchange, status, pnl, max_loss, max_profit, max_reached_entry, max_reached_tp)
    VALUES (:channel_id, :date, :signal_id, :coin, :direction, :leverage, :leverage_type, :stoploss, :exchange, :status, :pnl, :max_loss, :max_profit, :max_reached_entry, :max_reached_tp)`);

    const signalWithDate = { ...signal, date: dateToUnixTimestamp(signal.date)?.toString() };

    cmd.execute(signalWithDate);
    cmd.finalize();

    return db.lastInsertRowId;
}

export interface DbSignalConfigEntry {
  id?: number;
  signal_id: number;
  name: string;
  percentage: number | null;
  value: number;
}

export function createSignalConfigEntry(db: DB, entry: DbSignalConfigEntry) {
  const cmd = db.prepareQuery<any, any, any>(`INSERT INTO signal_config_entries(signal_id, name, percentage, value)
    VALUES (:signal_id, :name, :percentage, :value)`);

    cmd.execute(entry);
    cmd.finalize();

    return db.lastInsertRowId;
}

export interface DbSignalConfigTp extends DbSignalConfigEntry {
}


export function createSignalConfigTp(db: DB, entry: DbSignalConfigTp) {
  const cmd = db.prepareQuery<any, any, any>(`INSERT INTO signal_config_tps(signal_id, name, percentage, value)
    VALUES (:signal_id, :name, :percentage, :value)`);

    cmd.execute(entry);
    cmd.finalize();

    return db.lastInsertRowId;
}

export interface DbSignalReachedEntry extends DbSignalConfigEntry {
  date: Date;
  entry_id: number;
}

export function createSignalReachedEntry(db: DB, entry: Partial<DbSignalReachedEntry>) {
  const cmd = db.prepareQuery<any, any, any>(`INSERT INTO signal_reached_entry(signal_id, entry_id, value, timestamp)
    VALUES (:signal_id, :entry_id, :value, :date)`);

    const entryWithDate = { ...entry, date: dateToUnixTimestamp(entry.date!)?.toString() };

    cmd.execute(entryWithDate);
    cmd.finalize();

    return db.lastInsertRowId;
}

export interface DbSignalReachedTp {
  id?: number;
  date: Date;
  tp_id: number | null;
  signal_id: number;
  percentage: number | null;
  value: number;
}

export function createSignalReachedTp(db: DB, entry: DbSignalReachedTp) {
  const cmd = db.prepareQuery<any, any, any>(`INSERT INTO signal_reached_tp(signal_id, tp_id, value, timestamp)
    VALUES (:signal_id, :tp_id, :value, :date)`);

    const entryWithDate = { ...entry, date: dateToUnixTimestamp(entry.date!)?.toString() };

    cmd.execute(entryWithDate);
    cmd.finalize();

    return db.lastInsertRowId;
}

export interface DbRawSignal {
  date: Date;
  signalId: string;
  type: string;
  text: string;
}

export function createRawSignal(db: DB, entry: DbSignalConfigTp) {
  const cmd = db.prepareQuery<any, any, any>(`INSERT INTO raw_signal(signal_id, timestamp, text, type)
                                              VALUES (:signal_id, :date, :text, :type)`);

  cmd.execute(entry);
  cmd.finalize();

  return db.lastInsertRowId;
}

export function getChannelIdByName(db: DB, name: string): number {
  const query = db.prepareQuery(`SELECT * FROM channels WHERE name LIKE :name `);
  const result = query.all({ name: `%${name}%` });
  query.finalize();

  return (result?.[0]?.[0] as any) ?? 0;
}
