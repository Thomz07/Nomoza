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

ipcMain.handle('path:dirname', (_, p) => path.dirname(p))
ipcMain.handle('path:basename', (_, p) => path.basename(p))
ipcMain.handle('path:join', (_, ...args) => path.join(...args))

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

ipcMain.handle('watch-folder', (event, basePath) => { // Pour le rafraichissement en direct
	if (currentWatcher) {
		currentWatcher.close()
		currentWatcher = null
	}

	currentWatcher = fs.watch(basePath, { recursive: true }, () => {
		event.sender.send('folder-changed')
	})
})

ipcMain.handle('move-item', async (_, source, targetPath) => {
    console.log("move-item called")
	console.log("source:", source)
	console.log("target:", targetPath)
	try {
		if (fs.existsSync(targetPath)) {
			return { success: false, message: 'Un fichier du même nom existe déjà.' }
		}
		fs.renameSync(source, targetPath)
		return { success: true }
	} catch (err) {
		return { success: false, message: err.message }
	}
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