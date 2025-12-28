import { contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args) {
    const [channel, listener] = args
    return window.electron?.ipcRenderer?.on(channel, (event, ...args) =>
      listener(event, ...args)
    )
  },
  off(...args) {
    const [channel, ...omit] = args
    return window.electron?.ipcRenderer?.off(channel, ...omit)
  },
  send(...args) {
    return window.electron?.ipcRenderer?.send(...args)
  },
  invoke(...args) {
    return window.electron?.ipcRenderer?.invoke(...args)
  },
})


