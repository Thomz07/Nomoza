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
let selectedPaths = []
let lastSelectedSpan = null
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
			let pathsToMove = selectedPaths.includes(item.path)
				? selectedPaths
				: [item.path]
		
			e.dataTransfer.setData('paths', JSON.stringify(pathsToMove))
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
		
			const raw = e.dataTransfer.getData('paths')
			if (!raw) return
		
			const paths = JSON.parse(raw)
		
			const destinationDir = item.isDirectory
				? item.path
				: await window.pathAPI.dirname(item.path)
		
			let movedSomething = false
		
			for (const sourcePath of paths) {
				const filename = await window.pathAPI.basename(sourcePath)
				const targetPath = await window.pathAPI.join(destinationDir, filename)
		
				if (sourcePath === targetPath) continue
		
				const result = await window.electronAPI.moveItem(sourcePath, targetPath)
		
				if (!result.success) {
					alert(`Erreur en déplaçant ${filename} : ${result.message}`)
				} else {
					movedSomething = true
				}
			}
		
			if (movedSomething) {
				// Met à jour les infos si le dossier affiché est concerné
				if (selectedPaths.length === 1) {
					const selectedPath = selectedPaths[0]
					if (selectedPath === item.path || paths.includes(selectedPath)) {
						const stats = await window.electronAPI.getFolderStats(selectedPath)
						infoPanelTitle.textContent = "Détails du dossier"
						infoSize.textContent = `${formatBytes(stats.totalSize)} pour ${stats.fileCount} fichiers`
						infoDate.textContent = '—'
					}
				}
		
				const savedPath = await window.electronAPI.getSavedFolder()
				if (savedPath) await loadAndRenderTree(savedPath)
			}
		})

		li.appendChild(span)

		span.addEventListener('click', async (e) => {
			const path = item.path
			const isSelected = selectedPaths.includes(path)

			if (e.ctrlKey || e.metaKey) {
				if (isSelected) {
					selectedPaths = selectedPaths.filter(p => p !== path)
					span.classList.remove('selected')
				} else {
					selectedPaths.push(path)
					span.classList.add('selected')
				}
				lastSelectedSpan = span
			} else if (e.shiftKey && lastSelectedSpan) {
				const allSpans = [...document.querySelectorAll('#tree span')]
				const currentIndex = allSpans.indexOf(span)
				const lastIndex = allSpans.indexOf(lastSelectedSpan)
				const [start, end] = [currentIndex, lastIndex].sort((a, b) => a - b)

				selectedPaths = []
				document.querySelectorAll('#tree span').forEach(s => s.classList.remove('selected'))

				for (let i = start; i <= end; i++) {
					const s = allSpans[i]
					selectedPaths.push(s.getAttribute('data-path'))
					s.classList.add('selected')
				}
			} else {
				selectedPaths = [path]
				document.querySelectorAll('#tree span').forEach(s => s.classList.remove('selected'))
				span.classList.add('selected')
				lastSelectedSpan = span
			}

			if (selectedPaths.length === 1) {
				const selectedPath = selectedPaths[0]
				const isDir = item.isDirectory

				if (isDir) {
					const stats = await window.electronAPI.getFolderStats(selectedPath)
					infoPanelTitle.textContent = "Détails du dossier"
					infoName.textContent = item.name
					infoPath.textContent = selectedPath
					infoSize.textContent = `${formatBytes(stats.totalSize)} pour ${stats.fileCount} fichiers`
					infoDate.textContent = '—'
				} else {
					const stats = await window.electronAPI.getFileStats(selectedPath)
					infoPanelTitle.textContent = "Détails du fichier"
					infoName.textContent = item.name
					infoPath.textContent = selectedPath
					infoSize.textContent = formatBytes(stats.size)
					infoDate.textContent = new Date(stats.mtime).toLocaleString()
				}
			} else if (selectedPaths.length > 1) {
				infoPanelTitle.textContent = "Éléments sélectionnés"

				let totalSize = 0
				for (const p of selectedPaths) {
					try {
						const stat = await window.electronAPI.getFileStats(p)
						totalSize += stat.size
					} catch { }
				}

				infoName.textContent = `${selectedPaths.length} fichiers`
				infoPath.textContent = '—'
				infoSize.textContent = formatBytes(totalSize)
				infoDate.textContent = '—'
			}

			infoPanel.classList.remove('hidden')
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

treeContainer.addEventListener('dragover', (e) => {
	e.preventDefault()
	if (e.target === treeContainer) {
		treeContainer.classList.add('drop-root')
	}
})

treeContainer.addEventListener('dragleave', (e) => {
	if (e.target === treeContainer) {
		treeContainer.classList.remove('drop-root')
	}
})

treeContainer.addEventListener('drop', async (e) => {
	treeContainer.classList.remove('drop-root')
	if (e.target !== treeContainer) return
	e.preventDefault()

	treeContainer.style.backgroundColor = ''

	const raw = e.dataTransfer.getData('paths')
	if (!raw) return

	const paths = JSON.parse(raw)
	const destinationDir = folderPathSpan.textContent

	let movedSomething = false

	for (const sourcePath of paths) {
		const filename = await window.pathAPI.basename(sourcePath)
		const targetPath = await window.pathAPI.join(destinationDir, filename)

		if (sourcePath === targetPath) continue

		const result = await window.electronAPI.moveItem(sourcePath, targetPath)

		if (!result.success) {
			alert(`Erreur en déplaçant ${filename} : ${result.message}`)
		} else {
			movedSomething = true
		}
	}

	if (movedSomething) {
		const savedPath = await window.electronAPI.getSavedFolder()
		if (savedPath) await loadAndRenderTree(savedPath)
	}
})