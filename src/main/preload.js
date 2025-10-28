const { contextBridge, ipcRenderer } = require('electron');

console.debug('[preload] loaded');

contextBridge.exposeInMainWorld('dbms', {
    openSource: (opts) => ipcRenderer.invoke('dbms:openSource', opts),
    rowCount: () => ipcRenderer.invoke('dbms:rowCount'),
    columns: () => ipcRenderer.invoke('dbms:columns'),
    queryPage: (args) => ipcRenderer.invoke('dbms:queryPage', args),
    maybeSmall: (url, init) => ipcRenderer.invoke('dbms:maybeSmall', { url, init })
});

contextBridge.exposeInMainWorld('stream', {
    openJson: (filePath) => ipcRenderer.invoke('stream:openJson', filePath),
    onChunk: (callback) => ipcRenderer.on('stream:chunk', (_, chunk) => callback(chunk)),
    onEnd: (callback) => ipcRenderer.on('stream:end', () => callback()),
    onError: (callback) => ipcRenderer.on('stream:error', (_, err) => callback(err)),
});
