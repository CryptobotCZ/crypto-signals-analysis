import { Schema } from "https://deno.land/x/cotton@v0.7.5/mod.ts";
import { DB } from "https://deno.land/x/sqlite@v3.7.2/mod.ts";

export async function up(db: DB) {
    db.execute(`
        CREATE TABLE IF NOT EXISTS db_version (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT
        );
    `);

    db.execute(`
        CREATE TABLE IF NOT EXISTS channels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(2555)
        )
    `);

    db.execute(`
        CREATE TABLE IF NOT EXISTS signals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            channel_id INTEGER,
            date TEXT,
            signal_id VARCHAR(255),
            coin VARCHAR(255),
            direction VARCHAR(255),
            leverage INTEGER,
            leverage_type VARCHAR(255),
            stoploss REAL,
            pnl REAL,
            max_loss REAL,
            max_profit REAL,
            max_reached_entry INTEGER,
            max_reached_tp INTEGER,
            exchange VARCHAR(255),
            status VARCHAR(255),
            FOREIGN KEY(channel_id) REFERENCES channels(id)
        )
    `);

    db.execute(`
        CREATE TABLE IF NOT EXISTS signal_config_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            signal_id INTEGER,
            name VARCHAR(255),
            percentage REAL,
            value REAL,
            FOREIGN KEY(signal_id) REFERENCES signals(id)
        )
    `);

    db.execute(`
        CREATE TABLE IF NOT EXISTS signal_config_tps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            signal_id INTEGER,
            name VARCHAR(255),
            percentage REAL,
            value REAL,
            FOREIGN KEY(signal_id) REFERENCES signals(id)
        )
    `);

    db.execute(`
        CREATE TABLE IF NOT EXISTS signal_reached_entry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            signal_id INTEGER,
            entry_id INTEGER,
            value REAL,
            date TEXT,
            FOREIGN KEY(signal_id) REFERENCES signals(id),
            FOREIGN KEY(entry_id) REFERENCES signal_config_entries(id)
        )
    `);

    db.execute(`
        CREATE TABLE IF NOT EXISTS signal_reached_tp (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            signal_id INTEGER,
            tp_id INTEGER,
            value REAL,
            date TEXT,
            FOREIGN KEY(signal_id) REFERENCES signals(id),
            FOREIGN KEY(tp_id) REFERENCES signal_config_tps(id)
        )
    `);

    db.execute(`
        CREATE TABLE raw_signal (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            signal_id INTEGER,
            date TEXT,
            text TEXT,
            type  TEXT,
            FOREIGN KEY(signal_id) REFERENCES signals(id)
        )
    `);

    try {
    const query = db.prepareQuery('INSERT INTO db_version(id, date) VALUES (:id, :date)');
    query.execute({ id: 1, date: Math.floor(Date.now() / 1000) });
    query.finalize();
    }
    catch (err) { console.error(err); }
}

export async function down(db: DB) {
    db.execute('DROP TABLE channels');
    db.execute('DROP TABLE signals');
    db.execute('DROP TABLE signal_config_entries');
    db.execute('DROP TABLE signal_config_tps');
    db.execute('DROP TABLE signal_reached_entry');
    db.execute('DROP TABLE signal_reached_tp');
    db.execute('DROP TABLE raw_signal');
}
