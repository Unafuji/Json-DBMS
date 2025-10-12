// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('stream', {
    startFile: (filePath, opts) => ipcRenderer.invoke('stream:file:start', filePath, opts),
    startTest: () => ipcRenderer.invoke('stream:test'),
    cancel: () => ipcRenderer.invoke('stream:cancel'),
    onChunk: cb => ipcRenderer.on('stream:chunk', (_, c) => cb(c)),
    onDone: cb => ipcRenderer.on('stream:done',  (_, s) => cb(s)),
    onError: cb => ipcRenderer.on('stream:error', (_, e) => cb(e)),
    credit: () => ipcRenderer.send('stream:credit'),
    stop:   () => ipcRenderer.send('stream:stop'),
});

