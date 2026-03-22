const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("api", {
  onPause: callback => ipcRenderer.on("pause-game", callback)
})
