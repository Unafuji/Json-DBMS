// src/main/ipc/query.ipc.js (CommonJS)
const { ipcMain } = require('electron');
const { getDb } = require('../db/sqlite');

ipcMain.handle('query:page', (_evt, { table, offset = 0, limit = 200 }) => {
    const db = getDb();
    const stmt = db.prepare(`SELECT * FROM [${table}] LIMIT ? OFFSET ?`);
    const rows = stmt.all(limit, offset);
    return { rows };
});
