const path = require('node:path');
const fssync = require('node:fs');
const {chain} = require('stream-chain');
const {parser} = require('stream-json');
const {streamArray} = require('stream-json/streamers/StreamArray');

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

function registerStreamJsonHandler(ipcMain) {
    ipcMain.handle('stream:openJson', async (event, filePath) => {
        return new Promise((resolve, reject) => {
            try {
                const fp = normalizePath(filePath);
                console.log('[stream-json-dialog] stream:openJson →', fp);

                const pipeline = chain([
                    fssync.createReadStream(fp, {highWaterMark: 256 * 1024}),
                    parser(),
                    streamArray()
                ]);

                pipeline.on('data', ({value}) => {
                    event.sender.send('stream:chunk', value);
                });

                pipeline.on('end', () => {
                    console.log('[stream-json-dialog] stream:end');
                    event.sender.send('stream:end');
                    resolve('done');
                });

                pipeline.on('error', (err) => {
                    console.error('[stream-json-dialog] stream:error', err);
                    event.sender.send('stream:error', err.message);
                    reject(err);
                });
            } catch (err) {
                reject(err);
            }
        });
    });
}

module.exports = {registerStreamJsonHandler};
