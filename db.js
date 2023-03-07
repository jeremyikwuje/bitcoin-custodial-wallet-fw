import sqlite3 from "sqlite3";

const db = new sqlite3.Database('wallet.db');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS wallet (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            balance INTEGER DEFAULT 0,
            address TEXT UNIQUE,
            user_label TEXT UNIQUE
        )
    `);
});

db.close();