const { ipcMain } = require('electron');
const engine = require('../engine/engine');

ipcMain.handle('query:run', async (_e, req) => {
    // req: { collectionId, selectPaths, where, orderBy, pageSize, cursor }
    return engine.runQuery(req);
});
