// Existing imports at top of your preload
const { contextBridge, ipcRenderer } = require('electron');

// --- Add new bridges below ---

contextBridge.exposeInMainWorld('ingest', {
    start: (args) => ipcRenderer.invoke('ingest:start', args),
    cancel: () => ipcRenderer.invoke('ingest:cancel'),
    onProgress: (cb) => ipcRenderer.on('ingest:progress', (_e, p) => cb(p)),
});

contextBridge.exposeInMainWorld('query', {
    page: (args) => ipcRenderer.invoke('query:page', args),
});
