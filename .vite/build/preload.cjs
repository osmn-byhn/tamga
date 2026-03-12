var { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("ipcRenderer", {
	on: (channel, listener) => ipcRenderer.on(channel, listener),
	off: (channel, listener) => ipcRenderer.off(channel, listener),
	send: (channel, ...args) => ipcRenderer.send(channel, ...args),
	invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
});
