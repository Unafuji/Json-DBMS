import { getDb } from '../db/sqlite.js';

export class SqliteSink {
    constructor(tableName, columns) {
        this.db = getDb();
        this.table = tableName;
        this.columns = columns; // array of {name, type}
        this._ensureTable();
        this.insertStmt = this._prepareInsert();
        this.txn = null;
        this.count = 0;
    }

    _ensureTable() {
        const cols = this.columns.map(c => `[${c.name}] ${c.type}`).join(', ');
        this.db.exec(`CREATE TABLE IF NOT EXISTS [${this.table}] (${cols});`);
    }

    _prepareInsert() {
        const names = this.columns.map(c => `[${c.name}]`).join(',');
        const qs = this.columns.map(() => '?').join(',');
        return this.db.prepare(`INSERT INTO [${this.table}] (${names}) VALUES (${qs})`);
    }

    begin() { this.txn = this.db.transaction((rows) => {
        for (const r of rows) this.insertStmt.run(this.columns.map(c => r[c.name]));
    }); }

    flush(rows) {
        if (!this.txn) this.begin();
        this.txn(rows);
        this.count += rows.length;
    }
}
