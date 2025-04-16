const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
let currentWatcher = null

const CONFIG_PATH = path.join(__dirname, 'config.json')

function createWindow() {
	const win = new BrowserWindow({
		width: 1400,
		height: 800,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false
		}
	})
	win.loadFile('index.html')
}

ipcMain.handle('select-folder', async () => {
	const result = await dialog.showOpenDialog({
		properties: ['openDirectory']
	})
	if (result.canceled) return null

	const selectedPath = result.filePaths[0]
	fs.writeFileSync(CONFIG_PATH, JSON.stringify({ path: selectedPath }))
	return selectedPath
})

ipcMain.handle('get-folder', () => {
	if (!fs.existsSync(CONFIG_PATH)) return null
	const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
	if (!fs.existsSync(config.path)) return null
	return config.path
})

ipcMain.handle('watch-folder', (event, basePath) => {
	if (currentWatcher) {
		currentWatcher.close()
		currentWatcher = null
	}

	currentWatcher = fs.watch(basePath, { recursive: true }, () => {
		event.sender.send('folder-changed')
	})
})

function scanDirectoryRecursively(dirPath) {
	const items = fs.readdirSync(dirPath, { withFileTypes: true })
	return items.map((item) => {
		const fullPath = path.join(dirPath, item.name)
		const isDir = item.isDirectory()
		return {
			name: item.name,
			path: fullPath,
			isDirectory: isDir,
			children: isDir ? scanDirectoryRecursively(fullPath) : null,
			isMp3: fullPath.toLowerCase().endsWith('.mp3')
		}
	})
}

ipcMain.handle('get-directory-structure', (_, basePath) => {
	if (!fs.existsSync(basePath)) return []
	return scanDirectoryRecursively(basePath)
})

app.whenReady().then(createWindow)