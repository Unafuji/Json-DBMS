// src/main/ipc/dbIpc.js
const { ipcMain } = require('electron');
const { getDb } = require('../db/sqlite');
const { isDangerous } = require('../utils/sqlGuard');

function registerDbIpc() {
    const db = getDb();

    ipcMain.handle('db:query', (_e, { sql, params }) => {
        if (!sql || !/^SELECT\s/i.test(sql)) throw new Error('Use SELECT with db:query');
        if (isDangerous(sql)) throw new Error('Statement not allowed');
        const rows = db.prepare(sql).all(params || {});
        return { rows };
    });

    ipcMain.handle('db:exec', (_e, { sql, params }) => {
        if (!sql || /^SELECT\s/i.test(sql)) throw new Error('Use non-SELECT with db:exec');
        if (isDangerous(sql)) throw new Error('Statement not allowed');
        const info = db.prepare(sql).run(params || {});
        return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
    });
}

module.exports = { registerDbIpc };
