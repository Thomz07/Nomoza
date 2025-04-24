import { updateInfoPanel } from './infopanel.js'
import {
	getSavedFolder,
	moveItem,
	getDirectoryStructure,
    selectFolder
} from '../api/electron-api.js'
import { formatBytes } from '../utils/format.js'

let selectedPaths = []
let lastSelectedSpan = null

export async function initTreeView() {
	const treeContainer = document.getElementById('tree')
	const folderPathSpan = document.getElementById('folder-path')
	const filterCheckbox = document.getElementById('filter-mp3')
    const folderButton = document.getElementById('select-folder')

    folderButton.addEventListener('click', async () => {
        const path = await selectFolder()
        if (path) {
            folderPathSpan.textContent = path
            await loadTree(path)
        }
    })    

	const path = await getSavedFolder()
	if (path) {
		folderPathSpan.textContent = path
		await loadTree(path)
	}

	filterCheckbox.addEventListener('change', async () => {
		const path = await getSavedFolder()
		if (path) await loadTree(path)
	})

	async function loadTree(basePath) {
		const structure = await getDirectoryStructure(basePath)
		treeContainer.innerHTML = ''
		treeContainer.appendChild(renderTree(structure, filterCheckbox.checked))
        await window.electronAPI.watchFolder(basePath)
	}

	function renderTree(items, filterMp3 = false) {
		const ul = document.createElement('ul')

		for (const item of items) {
			if (!item.isDirectory && filterMp3 && !item.isMp3) continue

			const li = document.createElement('li')
			const icon = item.isDirectory ? '📁' : (item.isMp3 ? '🎵' : '📄')
			const span = document.createElement('span')
			span.textContent = `${icon} ${item.name}`
			span.setAttribute('data-path', item.path)
			span.draggable = true

			// sélection (simple, ctrl, shift)
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
					updateInfoPanel(item)
				} else {
					document.getElementById('info-panel').classList.remove('hidden')
					document.getElementById('info-title').textContent = "Éléments sélectionnés"
					document.getElementById('info-name').textContent = `${selectedPaths.length} fichiers`
					document.getElementById('info-path').textContent = '—'
					let totalSize = 0
                    for (const p of selectedPaths) {
                        try {
                            const stats = await window.electronAPI.getFileStats(p)
                            totalSize += stats.size
                        } catch { }
                    }
                    document.getElementById('info-size').textContent = `${formatBytes(totalSize)} pour ${selectedPaths.length} fichiers`
					document.getElementById('info-date').textContent = '—'
					document.getElementById('play-button').style.display = 'none'
				}
			})

			span.addEventListener('dragstart', (e) => {
				const pathsToMove = selectedPaths.includes(item.path)
					? selectedPaths
					: [item.path]

				e.dataTransfer.setData('paths', JSON.stringify(pathsToMove))
			})

			span.addEventListener('drop', async (e) => {
				e.preventDefault()
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

					const result = await moveItem(sourcePath, targetPath)
					if (result.success) movedSomething = true
				}

				if (movedSomething) {
					const savedPath = await getSavedFolder()
					if (savedPath) await loadTree(savedPath)
				}
			})

			li.appendChild(span)
			if (item.isDirectory && item.children) {
				const childTree = renderTree(item.children, filterMp3)
				li.appendChild(childTree)
			}
			ul.appendChild(li)
		}

		return ul
	}
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
    
        const raw = e.dataTransfer.getData('paths')
        if (!raw) return
    
        const paths = JSON.parse(raw)
        const destinationDir = folderPathSpan.textContent
        let movedSomething = false
    
        for (const sourcePath of paths) {
            const filename = await window.pathAPI.basename(sourcePath)
            const targetPath = await window.pathAPI.join(destinationDir, filename)
            if (sourcePath === targetPath) continue
    
            const result = await moveItem(sourcePath, targetPath)
            if (result.success) movedSomething = true
        }
    
        if (movedSomething) {
            const savedPath = await getSavedFolder()
            if (savedPath) await loadTree(savedPath)
        }
    })   
    
    window.electronAPI.onFolderChanged(async () => {
        const path = await getSavedFolder()
        if (path) await loadTree(path)
    })    
}

export function clearSelection() {
	selectedPaths = []
	lastSelectedSpan = null
	document.querySelectorAll('#tree span').forEach(el => el.classList.remove('selected'))
}