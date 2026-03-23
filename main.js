const { app, BrowserWindow } = require("electron")

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600
  })

  win.loadFile("content/index.html")

  app.commandLine.appendSwitch("disable-gesture-requirement-for-presentation", "true")
}

app.whenReady().then(createWindow)
