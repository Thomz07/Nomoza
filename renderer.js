let t = {}
const folderButton = document.getElementById('select-folder')
const treeContainer = document.getElementById('tree')
const folderPathSpan = document.getElementById('folder-path')
const filterCheckbox = document.getElementById('filter-mp3')
const infoPanelTitle = document.getElementById('info-title')
const infoPanel = document.getElementById('info-panel')
const infoName = document.getElementById('info-name')
const infoPath = document.getElementById('info-path')
const infoSize = document.getElementById('info-size')
const infoDate = document.getElementById('info-date')
const closePanelBtn = document.getElementById('close-panel')
/*let selectedPath = null

window.addEventListener('DOMContentLoaded', async () => {
	t = await window.electronAPI.getLocalization('en')
	updateStaticText()
	const savedPath = await window.electronAPI.getSavedFolder()
	if (savedPath) await loadAndRenderTree(savedPath)
})

function updateStaticText() {
	document.getElementById('info-title').textContent = t.panel_file_title
	document.getElementById('select-folder').textContent = t.select_folder
	document.querySelector('label[for="filter-mp3"]').textContent = t.filter_mp3
}*/

function formatBytes(bytes) {
	if (bytes === 0) return '0 Bytes'
	const k = 1024
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	const value = bytes / Math.pow(k, i)
	return `${value.toFixed(1)} ${sizes[i]}`
}

async function loadAndRenderTree(basePath) {
	const structure = await window.electronAPI.getDirectoryStructure(basePath)
	treeContainer.innerHTML = ''
	treeContainer.appendChild(renderTree(structure, filterCheckbox.checked))
	await window.electronAPI.watchFolder(basePath)
	folderPathSpan.textContent = basePath
	if (selectedPath) {
		const selectedSpan = [...document.querySelectorAll('#tree span')]
			.find(span => span.getAttribute('data-path') === selectedPath)
	
		if (selectedSpan) {
			selectedSpan.classList.add('selected')
			
			const isDir = selectedSpan.textContent.startsWith('📁')
			if (isDir) {
				const folderStats = await window.electronAPI.getFolderStats(selectedPath)
				infoPanelTitle.textContent = "Détails du dossier"
				infoName.textContent = selectedPath.split(/[\\/]/).pop()
				infoPath.textContent = selectedPath
				infoSize.textContent = `${formatBytes(folderStats.totalSize)} for ${folderStats.fileCount} files`
				infoDate.textContent = '—'
			} else {
				const stats = await window.electronAPI.getFileStats(selectedPath)
				infoPanelTitle.textContent = "Détails du fichier"
				infoName.textContent = selectedPath.split(/[\\/]/).pop()
				infoPath.textContent = selectedPath
				infoSize.textContent = formatBytes(stats.size)
				infoDate.textContent = new Date(stats.mtime).toLocaleString()
			}
		}
	}	
}

function renderTree(items, filterMp3) {
	const ul = document.createElement('ul')

	for (const item of items) {
		if (!item.isDirectory && filterMp3 && !item.isMp3) continue

		const li = document.createElement('li')
		const icon = item.isDirectory ? '📁' : (item.isMp3 ? '🎵' : '📄')
		const span = document.createElement('span')
		span.textContent = `${icon} ${item.name}`			
		span.setAttribute('data-path', item.path)
		span.draggable = true

		span.addEventListener('dragstart', (e) => {
			e.dataTransfer.setData('sourcePath', item.path)
			e.stopPropagation()
		})

		span.addEventListener('dragover', (e) => {
			e.preventDefault()
			span.style.backgroundColor = '#ddeeff'
		})

		span.addEventListener('dragleave', () => {
			span.style.backgroundColor = ''
		})

		span.addEventListener('drop', async (e) => {
			e.preventDefault()
			span.style.backgroundColor = ''

			const sourcePath = e.dataTransfer.getData('sourcePath')
			if (!sourcePath) return

			const destinationDir = item.isDirectory
				? item.path
				: await window.pathAPI.dirname(item.path)

			const filename = await window.pathAPI.basename(sourcePath)
			const targetPath = await window.pathAPI.join(destinationDir, filename)

			if (sourcePath === targetPath) return

			const result = await window.electronAPI.moveItem(sourcePath, targetPath)
			const sourceDir = await window.pathAPI.dirname(sourcePath)

			if (selectedPath && selectedPath === sourceDir) {
				const folderStats = await window.electronAPI.getFolderStats(selectedPath)
				infoPanelTitle.textContent = "Détails du dossier"
				infoSize.textContent = `${(folderStats.totalSize / 1024).toFixed(1)} Ko pour ${folderStats.fileCount} fichiers`
				infoDate.textContent = '—'
			}

			console.log("sourcePath:", sourcePath)
			console.log("destinationDir:", destinationDir)
			console.log("targetPath:", targetPath)

			if (!result.success) {
				alert('Erreur : ' + result.message)
			}

			if (item.isDirectory && item.path === selectedPath) {
				const folderStats = await window.electronAPI.getFolderStats(item.path)
				infoPanelTitle.textContent = "Détails du dossier"
				infoSize.textContent = `${formatBytes(folderStats.totalSize)} for ${folderStats.fileCount} files`
				infoDate.textContent = '—'
			}			
		})

		li.appendChild(span)
		span.addEventListener('dblclick', async (e) => {
			e.stopPropagation()
		
			const isAlreadySelected = span.classList.contains('selected')
		
			if (isAlreadySelected) {
				infoPanel.classList.add('hidden')
				span.classList.remove('selected')
				selectedPath = null
				return
			}
		
			document.querySelectorAll('#tree span').forEach((el) => el.classList.remove('selected'))
			span.classList.add('selected')
			selectedPath = item.path
		
			if (!item.isDirectory && item.isMp3) {
				const stats = await window.electronAPI.getFileStats(item.path)
				infoPanelTitle.textContent = "Détails du fichier"
				infoName.textContent = item.name
				infoPath.textContent = item.path
				infoSize.textContent = formatBytes(stats.size)
				infoDate.textContent = new Date(stats.mtime).toLocaleString()
				infoPanel.classList.remove('hidden')
			} else if (item.isDirectory) {
				const folderStats = await window.electronAPI.getFolderStats(item.path)
				infoPanelTitle.textContent = "Détails du dossier"
				infoName.textContent = item.name
				infoPath.textContent = item.path
				infoSize.textContent = `${formatBytes(folderStats.totalSize)} pour ${folderStats.fileCount} fichiers`
				infoDate.textContent = '—'
				infoPanel.classList.remove('hidden')
			}
		})			

		if (item.isDirectory && item.children) {
			const childTree = renderTree(item.children, filterMp3)
			li.appendChild(childTree)
		}

		ul.appendChild(li)
	}

	return ul
}

folderButton.addEventListener('click', async () => {
	const path = await window.electronAPI.selectFolder()
	if (path) await loadAndRenderTree(path)
})

filterCheckbox.addEventListener('change', async () => {
	const savedPath = await window.electronAPI.getSavedFolder()
	if (savedPath) {
		await loadAndRenderTree(savedPath)
	}
})

window.addEventListener('DOMContentLoaded', async () => {
	const savedPath = await window.electronAPI.getSavedFolder()
	if (savedPath) {
		await loadAndRenderTree(savedPath)
	}
})

window.electronAPI.onFolderChanged(() => {
	window.electronAPI.getSavedFolder().then((path) => {
		if (path) loadAndRenderTree(path)
	})
})

closePanelBtn.addEventListener('click', () => {
	infoPanel.classList.add('hidden')
	document.querySelectorAll('#tree span').forEach(el => el.classList.remove('selected'))
	selectedPath = null
})