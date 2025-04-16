const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
	selectFolder: () => ipcRenderer.invoke('select-folder'),
	getSavedFolder: () => ipcRenderer.invoke('get-folder'),
	getDirectoryStructure: (path) => ipcRenderer.invoke('get-directory-structure', path),
  watchFolder: (path) => ipcRenderer.invoke('watch-folder', path),
	onFolderChanged: (callback) => ipcRenderer.on('folder-changed', callback)
})