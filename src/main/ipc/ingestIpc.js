import { ipcMain } from 'electron';
import { IngestService } from '../ingestion/ingestService.js';

export function registerIngestIpc(win) {
    let service = null;

    ipcMain.handle('ingest:start', async (_e, args) => {
        service = new IngestService(win, (p) => win.webContents.send('ingest:progress', p));
        try {
            return await service.start(args);
        } finally {
            service = null;
        }
    });

    ipcMain.handle('ingest:cancel', async () => { service?.cancel(); });
}
