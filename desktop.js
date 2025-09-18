import {app, BrowserWindow} from 'electron'
import path from 'path'

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })
  // mode dev : charger le serveur de Vue
  win.loadURL("https://app.bugreveal.com")
}

app.whenReady().then(createWindow)
