const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('@electron/remote/main').initialize();

app.disableHardwareAcceleration();

ipcMain.on('get-user-data-path', (event) => {
  event.returnValue = app.getPath('userData');
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  require('@electron/remote/main').enable(win.webContents); // ✅ NECESARIO

  win.loadFile('dist/index.html');
  //win.webContents.openDevTools(); // opcional
}

app.whenReady().then(createWindow);
