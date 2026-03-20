const { app, BrowserWindow } = require("electron")

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600
  })

  win.loadFile("content/index.html")
}

app.whenReady().then(createWindow)

onkeydown = e => {
  if (e.code == "KeyC" && e.metaKey && e.shiftKey) {
    win.webContents.openDevTools()
  }
}
