
const { ipcMain } = require('electron');
const fssync = require('node:fs');
const { chain } = require('stream-chain');
const { parser } = require('stream-json');
const { streamArray } = require('stream-json/streamers/StreamArray');
const { readJsonFile, normalizePath } = require('./fileUtils');
const dbStore = require('./dbStore');

function wireIpc() {
    ipcMain.handle('dbms:openSource', async (_evt, { url, formatHint }) => {
        const isHttp = /^https?:\/\//i.test(url || '');
        if (isHttp) throw new Error('HTTP not implemented in main yet.');

        const rows = await readJsonFile(url);
        dbStore.setRows(rows);
        return { source: url, format: formatHint || 'auto' };
    });

    ipcMain.handle('dbms:rowCount', () => dbStore.getRowCount());
    ipcMain.handle('dbms:columns', () => dbStore.getCols());

    ipcMain.handle('dbms:queryPage', (_evt, { offset = 0, limit = 100 } = {}) => {
        return dbStore.getRows(offset, limit);
    });

    ipcMain.handle('dbms:maybeSmall', async (_evt, { url }) => {
        const isHttp = /^https?:\/\//i.test(url || '');
        if (!isHttp) return { small: false, data: null, source: url };
        return { small: true, data: [], source: url };
    });

    ipcMain.handle('file:loadPath', async (_evt, filePath) => {
        const items = await readJsonFile(filePath);
        const page = items.slice(0, 200);
        return { count: items.length, page };
    });

    ipcMain.handle('stream:openJson', async (event, filePath) => {
        return new Promise((resolve, reject) => {
            try {
                const fp = normalizePath(filePath);
                console.log('[main] stream:openJson →', fp);

                const pipeline = chain([
                    fssync.createReadStream(fp),
                    parser(),
                    streamArray()
                ]);

                pipeline.on('data', ({ value }) => {
                    event.sender.send('stream:chunk', value);
                });

                pipeline.on('end', () => {
                    console.log('[main] stream:end');
                    event.sender.send('stream:end');
                    resolve('done');
                });

                pipeline.on('error', (err) => {
                    console.error('[main] stream:error', err);
                    event.sender.send('stream:error', err.message);
                    reject(err);
                });
            } catch (err) {
                reject(err);
            }
        });
    });
}

module.exports = { wireIpc };
