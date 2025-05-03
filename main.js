const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const mm = require('music-metadata')
const { spawn } = require('child_process')
let pythonServerProcess = null
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

	const isPythonAvailable = () => {
		try {
			require('child_process').execSync('python3 --version')
			return true
		} catch {
			return false
		}
	}
	
	if (isPythonAvailable()) {
		pythonServerProcess = spawn('uvicorn', ['server:app'], {
			cwd: __dirname,
			shell: true,
			stdio: 'inherit'
		})		
	
		pythonServer.on('error', (err) => {
			console.error('Erreur au démarrage du serveur Python :', err)
		})
	} else {
		console.error('Python3 n’est pas disponible')
	}
}

function getFolderStats(folderPath) {
	let totalSize = 0
	let fileCount = 0

	function scan(dir) {
		const entries = fs.readdirSync(dir, { withFileTypes: true })
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name)
			if (entry.isDirectory()) {
				scan(fullPath)
			} else {
				const stats = fs.statSync(fullPath)
				totalSize += stats.size
				fileCount++
			}
		}
	}

	scan(folderPath)
	return { totalSize, fileCount }
}

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
			isMp3: ['.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a'].some(ext => fullPath.toLowerCase().endsWith(ext))
		}
	})
}

ipcMain.handle('get-localization', async (_, lang = 'en') => {
	const filePath = path.join(__dirname, 'locales', `${lang}.json`)
	return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
})

ipcMain.handle('path:dirname', (_, p) => path.dirname(p))
ipcMain.handle('path:basename', (_, p) => path.basename(p))
ipcMain.handle('path:join', (_, ...args) => path.join(...args))
ipcMain.handle('path:parse', (_, p) => {
	const parsed = path.parse(p)
	return parsed.name
})
ipcMain.handle('path:extname', (_, p) => path.extname(p).slice(1))

ipcMain.handle('audio:getMetadata', async (_, filePath) => {
	try {
		const metadata = await mm.parseFile(filePath)
		return {
			duration: metadata.format.duration,
			bitrate: metadata.format.bitrate,
			sampleRate: metadata.format.sampleRate
		}
	} catch (err) {
		console.error('Erreur extraction metadata audio :', err)
		return null
	}
})

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

ipcMain.handle('get-directory-structure', (_, basePath) => {
	if (!fs.existsSync(basePath)) return []
	return scanDirectoryRecursively(basePath)
})

ipcMain.handle('get-file-stats', async (_, filePath) => {
	try {
		return fs.statSync(filePath)
	} catch (e) {
		return { size: 0, mtime: null }
	}
})

ipcMain.handle('get-folder-stats', (_, folderPath) => {
	try {
		return getFolderStats(folderPath)
	} catch {
		return { totalSize: 0, fileCount: 0 }
	}
})

app.whenReady().then(createWindow)
app.on('before-quit', () => {
	if (pythonServerProcess) {
		try {
			process.kill(-pythonServerProcess.pid)
		} catch (e) {
			console.warn('Le processus Python était déjà mort.')
		}
	}
})