const { app, BrowserWindow } = require("electron")

function createWindow() {
  app.commandLine.appendSwitch("disable-gesture-requirement-for-presentation", "true")

  const win = new BrowserWindow({
    width: 900,
    height: 600
  })

  win.loadFile("content/index.html")
}

app.whenReady().then(createWindow)
