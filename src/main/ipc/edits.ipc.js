const { ipcMain } = require('electron');
const engine = require('../engine/engine');

ipcMain.handle('edit:apply', async (_e, req) => {
    // req: { collectionId, patches[] }
    return engine.applyEdits(req);
});
