import { ipcMain } from 'electron';
import { getDb } from '../db/sqlite.js';

export function registerQueryIpc() {
    ipcMain.handle('query:page', (_e, { table, offset, limit }) => {
        const db = getDb();
        const rows = db.prepare(`SELECT * FROM [${table}] LIMIT ? OFFSET ?`).all(limit, offset);
        return { rows };
    });
}
