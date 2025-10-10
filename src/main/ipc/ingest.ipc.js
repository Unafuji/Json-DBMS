// src/main/ipc/ingest.ipc.js (CommonJS)
const { ipcMain } = require('electron');
const { IngestService } = require('../ingestion/ingestService');

let service = null;

ipcMain.handle('ingest:start', async (evt, args) => {
    const win = evt.sender?.getOwnerBrowserWindow();
    service = new IngestService(win, (p) => {
        if (win && !win.isDestroyed()) win.webContents.send('ingest:progress', p);
    });

    try {
        return await service.start(args); // { filePath, format: 'ndjson'|'json', table, batchSize? }
    } finally {
        service = null;
    }
});

ipcMain.handle('ingest:cancel', async () => {
    if (service) service.cancel();
});
