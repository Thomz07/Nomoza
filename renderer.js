const folderButton = document.getElementById('select-folder')
const treeContainer = document.getElementById('tree')

async function loadAndRenderTree(basePath) {
	const structure = await window.electronAPI.getDirectoryStructure(basePath)
	treeContainer.innerHTML = ''
	treeContainer.appendChild(renderTree(structure))
	await window.electronAPI.watchFolder(basePath)
}

function renderTree(items) {
	const ul = document.createElement('ul')
	for (const item of items) {
		const li = document.createElement('li')
		const icon = item.isDirectory ? '📁' : (item.isMp3 ? '🎵' : '📄')
    li.textContent = `${icon} ${item.name}`
		if (item.isMp3) {
			li.style.color = 'green'
		}
		if (item.isDirectory && item.children) {
			const childTree = renderTree(item.children)
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