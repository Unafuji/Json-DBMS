// const fs = require("node:fs/promises");
// const path = require("node:path");
// const {app, BrowserWindow, ipcMain} = require('electron');
// const {initDb} = require('./src/main/db/sqlite');
// const {registerDbIpc} = require('./src/main/ipc/dbIpc');
// const {registerDriverCompleteImporter} = require('./src/main/importers/driverCompleteImporter.js');
// require('./src/main/ipc/query.ipc');
// require('./src/main/ipc/edits.ipc');
// require('./src/main/ipc/ingest.ipc');
// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
// app.commandLine.appendSwitch('ignore-certificate-errors');
//
// ipcMain.handle('localfs:readSmallJson', async (_evt, filePathOrUrl) => {
//     // For tiny configs only (<10 MB). Never for ingestion of big datasets.
//     let normalized = String(filePathOrUrl || '').trim();
//     if (!normalized) throw new Error('Invalid file path.');
//
//     if (normalized.startsWith('file://')) {
//         const url = new URL(normalized);
//         normalized = decodeURIComponent(url.pathname);
//         if (process.platform === 'win32' && normalized.startsWith('/')) normalized = normalized.slice(1);
//     }
//
//     const ext = nodePath.extname(normalized).toLowerCase();
//     const allowed = new Set(['.json', '.ndjson']);
//     if (!allowed.has(ext)) throw new Error(`Only .json or .ndjson allowed. Got: ${ext}`);
//
//     // Enforce a real 10 MB cap
//     const MAX_SIZE = 10 * 1024 * 1024;
//     const stat = await require('node:fs/promises').stat(normalized);
//     if (stat.size > MAX_SIZE) throw new Error(`Too big for readSmallJson: ${stat.size} > ${MAX_SIZE}`);
//
//     return fs.readFile(normalized, { encoding: 'utf8' });
// });
// ipcMain.handle('localfs:pickAndReadSmallJson', async () => {
//     const { canceled, filePaths } = await dialog.showOpenDialog({
//         properties: ['openFile'],
//         filters: [{ name: 'JSON', extensions: ['json', 'ndjson'] }],
//     });
//     if (canceled || !filePaths?.length) return { canceled: true };
//     const data = await ipcMain.emit('localfs:readSmallJson', null, filePaths[0]);
//     return { canceled: false, data };
// });
// function createWindow() {
//     const win = new BrowserWindow({
//         width: 1200,
//         height: 800,
//         webPreferences: {
//             preload: path.join(__dirname, "preload.js"),
//             contextIsolation: true,
//             nodeIntegration: false
//         }
//     });
//     win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
//         const csp = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'";
//         const headers = { ...details.responseHeaders, 'Content-Security-Policy': [csp] };
//         callback({ responseHeaders: headers });
//     });
//
//     win.loadFile('index.html');
//
//     // Optional: open external links in default browser
//     win.webContents.setWindowOpenHandler(({ url }) => {
//         shell.openExternal(url);
//         return { action: 'deny' };
//     });
// }
//
//
// app.whenReady().then(() => {
//     try {
//         initDb();
//         registerDbIpc();
//         registerDriverCompleteImporter();
//     } catch (e) {
//         console.error('Startup failure:', e);
//     }
//     createWindow();
//
//     app.on("activate", () => {
//         if (BrowserWindow.getAllWindows().length === 0) createWindow();
//     });
// });
// // app.whenReady().then(createWindow);
// app.on("window-all-closed", () => {
//     if (process.platform !== "darwin") {
//         app.quit();
//     }
// });
//
// app.on("activate", () => {
//     if (BrowserWindow.getAllWindows().length === 0) {
//         createWindow();
//     }
// });
// E:\Electron Project\Json DBMS\main.js
const path = require('node:path');
const fs = require('node:fs/promises');
const { app, BrowserWindow, ipcMain, dialog, shell, session } = require('electron');

const { initDb } = require('./src/main/db/sqlite');
require('./src/main/ipc/query.ipc');
require('./src/main/ipc/edits.ipc');
require('./src/main/ipc/ingest.ipc');

// ---- DO NOT ship with TLS bypass. Remove these lines. ----
// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
// app.commandLine.appendSwitch('ignore-certificate-errors');

// ---------- small-file reader (configs only, <10MB) ----------
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

    const MAX_SIZE = 10 * 1024 * 1024; // real 10 MB cap
    const stat = await fs.stat(p);
    if (stat.size > MAX_SIZE) throw new Error(`Too big for readSmallJson: ${stat.size} > ${MAX_SIZE}`);

    return fs.readFile(p, { encoding: 'utf8' });
}

// Preferred small-file API
ipcMain.handle('localfs:readSmallJson', async (_e, filePathOrUrl) => readSmallJsonImpl(filePathOrUrl));

// Back-compat shim for any old calls still using readText
ipcMain.handle('localfs:readText', async (_e, filePathOrUrl) => readSmallJsonImpl(filePathOrUrl));

// Optional picker for small JSONs (returns { canceled, data? })
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
function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webSecurity: true,
            enableRemoteModule: false
        }
    });

    // Tight CSP
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        const csp = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'";
        const headers = { ...details.responseHeaders, 'Content-Security-Policy': [csp] };
        callback({ responseHeaders: headers });
    });

    win.loadFile('index.html');

    // Open external links in default browser
    win.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

// ---------- lifecycle ----------
app.whenReady().then(() => {
    try { initDb(); } catch (e) { console.error('DB init failed:', e); }
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
