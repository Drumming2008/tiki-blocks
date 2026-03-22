const { app, BrowserWindow } = require("electron")
const path = require("path")

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true
    }
  })

  win.loadFile("content/index.html")

  win.webContents.on("before-input-event", (e, input) => {
    if (input.key == "Escape" && input.type == "keyDown") {
      e.preventDefault()
      win.webContents.send("pause-game")
    }
  })
}

app.whenReady().then(createWindow)
