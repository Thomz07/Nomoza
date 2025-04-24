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

async function loadAndRenderTree(basePath) {
	const structure = await window.electronAPI.getDirectoryStructure(basePath)
	treeContainer.innerHTML = ''
	treeContainer.appendChild(renderTree(structure, filterCheckbox.checked))
	await window.electronAPI.watchFolder(basePath)
	folderPathSpan.textContent = basePath
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

			console.log("sourcePath:", sourcePath)
			console.log("destinationDir:", destinationDir)
			console.log("targetPath:", targetPath)

			if (!result.success) {
				alert('Erreur : ' + result.message)
			}
		})

		li.appendChild(span)
		li.addEventListener('dblclick', async () => {
			if (!item.isDirectory && item.isMp3) {
				const stats = await window.electronAPI.getFileStats(item.path)
				infoPanelTitle.textContent = "Détails du fichier"
				infoName.textContent = item.name
				infoPath.textContent = item.path
				infoSize.textContent = `${(stats.size / 1024).toFixed(1)} Ko`
				infoDate.textContent = new Date(stats.mtime).toLocaleString()
				infoPanel.classList.remove('hidden')
			} else if (item.isDirectory) {
				const folderStats = await window.electronAPI.getFolderStats(item.path)
				infoPanelTitle.textContent  = "Détails du dossier"
				infoName.textContent = item.name
				infoPath.textContent = item.path
				infoSize.textContent = `${(folderStats.totalSize / 1024).toFixed(1)} Ko pour ${folderStats.fileCount} fichiers`
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