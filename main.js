const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

const { ipcMain } = require('electron');
const fs = require('fs');

ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (result.canceled) return [];

  const folderPath = result.filePaths[0];
  const files = fs.readdirSync(folderPath);
  const audioFiles = files
    .filter(file => file.endsWith('.mp3') || file.endsWith('.wav'))
    .map(file => ({
      name: file,
      path: path.join(folderPath, file)
    }));

  return audioFiles;
});