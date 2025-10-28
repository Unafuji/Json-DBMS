const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const fssync = require('node:fs'); // for createReadStream
const { chain } = require('stream-chain');
const { parser } = require('stream-json');
const { streamArray } = require('stream-json/streamers/StreamArray');

let _rows = [];
let _cols = [];

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    win.loadFile('index.html');
}

app.whenReady().then(() => {
    wireIpc();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

function normalizePath(p) {
    let fp = String(p || '').trim();
    if (!fp) throw new Error('Missing file path/url');

    if (fp.startsWith('file://')) {
        const u = new URL(fp);
        fp = decodeURIComponent(u.pathname);
        if (process.platform === 'win32' && fp.startsWith('/')) fp = fp.slice(1);
    }
    return fp;
}

function inferCols(rows) {
    const first = rows.find(r => r && typeof r === 'object' && !Array.isArray(r));
    if (!first) return [];
    return Object.keys(first).map(k => ({ name: k }));
}

async function parseJsonOrNdjson(text) {
    try {
        const v = JSON.parse(text);
        return Array.isArray(v) ? v : [v];
    } catch {
        const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        if (!lines.length) return [];
        return lines.map(l => JSON.parse(l));
    }
}

function wireIpc() {
    ipcMain.handle('dbms:openSource', async (_evt, { url, formatHint }) => {
        const isHttp = /^https?:\/\//i.test(url || '');
        if (isHttp) {
            throw new Error('HTTP not implemented in main yet. Use maybeSmall() path.');
        }

        const fp = normalizePath(url);
        const raw = await fs.readFile(fp, 'utf8');
        _rows = await parseJsonOrNdjson(raw);
        _cols = inferCols(_rows);
        return { source: fp, format: formatHint || 'auto' };
    });

    ipcMain.handle('dbms:rowCount', async () => _rows.length);
    ipcMain.handle('dbms:columns', async () => _cols);

    ipcMain.handle('dbms:queryPage', async (_evt, { offset = 0, limit = 100 } = {}) => {
        const start = Math.max(0, offset | 0);
        const end = Math.min(start + (limit | 0), _rows.length);
        return _rows.slice(start, end);
    });

    ipcMain.handle('dbms:maybeSmall', async (_evt, { url /*, init*/ }) => {
        const isHttp = /^https?:\/\//i.test(url || '');
        if (!isHttp) return { small: false, data: null, source: url };
        return { small: true, data: [], source: url };
    });

    ipcMain.handle('file:loadPath', async (_evt, filePath) => {
        const fp = normalizePath(filePath);
        const raw = await fs.readFile(fp, 'utf8');
        const items = await parseJsonOrNdjson(raw);
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
