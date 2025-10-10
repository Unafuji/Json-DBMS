const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('localFs', {
    readSmallJson: (path) => ipcRenderer.invoke('localfs:readSmallJson', path)
    // optional deprecated alias:
    // readText: (path) => ipcRenderer.invoke('localfs:readSmallJson', path)
});

contextBridge.exposeInMainWorld('dbms', {
    ingest: { start: (args) => ipcRenderer.invoke('ingest:start', args) },
    query:  { run:   (args) => ipcRenderer.invoke('query:run',   args) },
    edits:  { apply: (args) => ipcRenderer.invoke('edit:apply',  args) }
});
