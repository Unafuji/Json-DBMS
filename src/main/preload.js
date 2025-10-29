const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    browseJsonFile: () => ipcRenderer.invoke('dialog:browse-json')
});
