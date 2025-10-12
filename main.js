// main.js — streaming sandbox wired correctly (file + synthetic test)

const path = require('node:path');
const fs = require('node:fs');                  // sync + streams
const fsPromises = require('node:fs/promises'); // async helpers

const { app, BrowserWindow, ipcMain, dialog, shell, session } = require('electron');
const { pipeline } = require('node:stream');
const { parser } = require('stream-json');
const StreamArray = require('stream-json/streamers/StreamArray');
const split2 = require('split2');

const { initDb } = require('./src/main/db/sqlite.js');
require('./src/main/ipc/query.ipc');
require('./src/main/ipc/ingest.ipc');

// ---------- small file helpers ----------
async function readSmallJsonImpl(filePathOrUrl) {
    let p = String(filePathOrUrl || '').trim();
    if (!p) throw new Error('Invalid file path.');

    if (p.startsWith('file://')) {
        const u = new URL(p);
        p = decodeURIComponent(u.pathname);
        if (process.platform === 'win32' && p.startsWith('/')) p = p.slice(1);
    }

    const ext = path.extname(p).toLowerCase();
    if (!['.json', '.ndjson'].includes(ext)) {
        throw new Error(`Only .json/.ndjson allowed. Got: ${ext}`);
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB cap
    const stat = await fsPromises.stat(p);
    if (stat.size > MAX_SIZE) throw new Error(`Too big for readSmallJson: ${stat.size} > ${MAX_SIZE}`);

    return fsPromises.readFile(p, { encoding: 'utf8' });
}

ipcMain.handle('localfs:readSmallJson', async (_e, f) => readSmallJsonImpl(f));
ipcMain.handle('localfs:readText', async (_e, f) => readSmallJsonImpl(f));
ipcMain.handle('localfs:pickAndReadSmallJson', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json', 'ndjson'] }]
    });
    if (canceled || !filePaths?.length) return { canceled: true };
    const data = await readSmallJsonImpl(filePaths[0]);
    return { canceled: false, data };
});

// ---------- window ----------
let win;

function createWindow() {
    win = new BrowserWindow({
        show: false,
        maximizable: true,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true,
            devTools: true
        }
    });

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        const csp = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'";
        const headers = { ...details.responseHeaders, 'Content-Security-Policy': [csp] };
        callback({ responseHeaders: headers });
    });

    // stream sandbox page
    win.loadFile(path.join(__dirname, 'src', 'renderer', 'stream.html'));

    win.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    win.once('ready-to-show', () => {
        win.maximize();
        win.show();
    });
}

app.whenReady().then(() => {
    try { initDb(); } catch (e) { console.error('DB init failed:', e); }
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// ---------- streaming core ----------
let currentAbort = null;

function detectFormatSync(filePath) {
    const fd = fs.openSync(filePath, 'r');  // fs (not promises)
    const buf = Buffer.alloc(64);
    const bytes = fs.readSync(fd, buf, 0, 64, 0);
    fs.closeSync(fd);
    const s = buf.slice(0, bytes).toString().trimStart();
    if (s.startsWith('[')) return 'json-array';
    if (s.startsWith('{')) return 'json-objects-in-array-or-single';
    return 'ndjson';
}

const DEFAULT_BATCH = 500;
const DEFAULT_MAX_IN_FLIGHT = 8;

ipcMain.handle('stream:file:start', async (_e, filePath, opts = {}) => {
    if (currentAbort) currentAbort();
    let inflight = 0;

    const batchSize = Math.max(1, opts.batchSize ?? DEFAULT_BATCH);
    const maxInFlight = Math.max(1, opts.maxInFlight ?? DEFAULT_MAX_IN_FLIGHT);
    const format = opts.format ?? detectFormatSync(filePath);

    let aborted = false;
    currentAbort = () => { aborted = true; };

    const rows = [];
    const sendChunk = () => {
        if (rows.length === 0) return;
        if (inflight >= maxInFlight) return;
        const chunk = rows.splice(0, rows.length);
        inflight++;
        win.webContents.send('stream:chunk', chunk);
    };

    const onCredit = () => {
        if (inflight > 0) inflight--;
        sendChunk();
    };
    ipcMain.on('stream:credit', onCredit);

    const cleanup = () => {
        aborted = true;
        ipcMain.off('stream:credit', onCredit);
    };

    ipcMain.once('stream:stop', cleanup);
    ipcMain.once('stream:cancel', cleanup);

    const src = fs.createReadStream(filePath, { highWaterMark: 1 << 20 }); // 1MB

    if (format === 'ndjson') {
        const nd = pipeline(src, split2(), (err) => {
            if (err && !aborted) win.webContents.send('stream:error', String(err));
        });
        nd.on('data', line => {
            if (aborted) return;
            if (!line) return;
            try {
                rows.push(JSON.parse(line));
                if (rows.length >= batchSize && inflight < maxInFlight) sendChunk();
            } catch { /* skip bad line */ }
        });
        nd.on('end', () => {
            if (aborted) return;
            if (rows.length) win.webContents.send('stream:chunk', rows.splice(0));
            cleanup();
            win.webContents.send('stream:done');
        });
        return;
    }

    // JSON array [ {...}, {...}, ... ]
    pipeline(
        src,
        parser(),
        StreamArray.withParser(),
        (err) => {
            if (err && !aborted) win.webContents.send('stream:error', String(err));
        }
    )
        .on('data', ({ value }) => {
            if (aborted) return;
            rows.push(value);
            if (rows.length >= batchSize && inflight < maxInFlight) sendChunk();
        })
        .on('end', () => {
            if (aborted) return;
            if (rows.length) win.webContents.send('stream:chunk', rows.splice(0));
            cleanup();
            win.webContents.send('stream:done');
        });
});

// ---------- synthetic test (proves IPC + credits) ----------
ipcMain.handle('stream:test', async () => {
    if (!win) return;
    let aborted = false;
    let inflight = 0;
    const maxInFlight = 4;

    const onCredit = () => {
        if (aborted) return;
        if (inflight >= maxInFlight) return;
        inflight++;
        const chunk = Array.from({ length: 500 }, (_, i) => ({ id: i, ts: Date.now() }));
        win.webContents.send('stream:chunk', chunk);
    };

    ipcMain.on('stream:credit', onCredit);

    // show something immediately
    onCredit();

    const stop = () => {
        if (aborted) return;
        aborted = true;
        ipcMain.off('stream:credit', onCredit);
        win.webContents.send('stream:done', { rowsSent: 'synthetic' });
    };

    ipcMain.once('stream:stop', stop);
    ipcMain.once('stream:cancel', stop);
});

ipcMain.handle('stream:cancel', () => { if (currentAbort) currentAbort(); });
