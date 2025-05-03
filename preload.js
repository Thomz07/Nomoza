const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
	getLocalization: (lang) => ipcRenderer.invoke('get-localization', lang),
	selectFolder: () => ipcRenderer.invoke('select-folder'),
	getSavedFolder: () => ipcRenderer.invoke('get-folder'),
	getDirectoryStructure: (path) => ipcRenderer.invoke('get-directory-structure', path),
	watchFolder: (path) => ipcRenderer.invoke('watch-folder', path),
	onFolderChanged: (callback) => ipcRenderer.on('folder-changed', callback),
	moveItem: (source, destination) => ipcRenderer.invoke('move-item', source, destination),
	getFileStats: (filePath) => ipcRenderer.invoke('get-file-stats', filePath),
	getFolderStats: (path) => ipcRenderer.invoke('get-folder-stats', path),
	getAudioMetadata: (path) => ipcRenderer.invoke('audio:getMetadata', path)
})

contextBridge.exposeInMainWorld('pathAPI', {
	dirname: (p) => ipcRenderer.invoke('path:dirname', p),
	basename: (p) => ipcRenderer.invoke('path:basename', p),
	join: (...args) => ipcRenderer.invoke('path:join', ...args),
	nameWithoutExt: (p) => ipcRenderer.invoke('path:parse', p),
	extname: (p) => ipcRenderer.invoke('path:extname', p)
})