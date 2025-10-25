
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('stream', {

});

