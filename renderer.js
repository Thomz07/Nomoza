const folderButton = document.getElementById('select-folder')
const treeContainer = document.getElementById('tree')
const folderPathSpan = document.getElementById('folder-path')

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

      const isTargetDir = item.isDirectory
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