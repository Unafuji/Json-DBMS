const { ipcMain } = require('electron');
const engine = require('../engine/engine');

ipcMain.handle('ingest:start', async (_e, req) => {
    // req = { datasetId, collectionName, sourcePath, format? }
    return engine.startIngest(req);
});
