const {app, BrowserWindow} = require('electron');
const path = require('node:path');

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
    // win.setMenu(null);
    win.loadFile('index.html');
    win.once('ready-to-show', () => {
        createDialog(win);
    });
}

function createDialog(parentWindow) {
    const dialogPath = path.resolve(
        __dirname,
        'src',
        'renderer',
        'components',
        'createEnvironmentDialog',
        'createEnvironmentDialog.html'
    );
    console.log('Dialog path:', dialogPath);
    const dialogWin = new BrowserWindow({
        width: 500,
        height: 300,
        parent: parentWindow,
        modal: true,
        show: false,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    // dialogWin.setMenu(null);

    dialogWin.loadFile(dialogPath);

    dialogWin.once('ready-to-show', () => {
        dialogWin.show();
    });

    dialogWin.webContents.openDevTools();

    dialogWin.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('Dialog failed to load:', errorDescription, validatedURL);
    });
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
