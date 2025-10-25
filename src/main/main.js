const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile('index.html');
}

app.whenReady().then(() => {
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
    if (!fp) throw new Error('Missing file path.');

    if (fp.startsWith('file://')) {
        const u = new URL(fp);
        fp = decodeURIComponent(u.pathname);
        if (process.platform === 'win32' && fp.startsWith('/')) fp = fp.slice(1);
    }

    const ext = path.extname(fp).toLowerCase();
    if (!['.json', '.ndjson'].includes(ext)) {
        throw new Error(`Only .json or .ndjson supported. Got: ${ext || '(none)'}`);
    }
    return { fp, ext };
}

ipcMain.handle('file:loadPath', async (_evt, filePath) => {
    const { fp, ext } = normalizePath(filePath);

    const raw = await fs.readFile(fp, 'utf8');

    let items = [];
    if (ext === '.json') {
        const parsed = JSON.parse(raw);
        items = Array.isArray(parsed) ? parsed : [parsed];
    } else {
        items = raw.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
    }

    const colPath = path.join(process.cwd(), 'collection.ndjson');
    const lines = items.map(o => JSON.stringify(o)).join('\n') + '\n';
    await fs.appendFile(colPath, lines, 'utf8');
    const page = items.slice(0, 200);
    return { count: items.length, page };
});
