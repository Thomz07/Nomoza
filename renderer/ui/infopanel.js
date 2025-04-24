import { getFileStats, getFolderStats } from '../api/electron-api.js'
import { formatBytes, formatTime } from '../utils/format.js'
import { clearSelection } from './treeview.js'

let playButton, infoName, infoPath, infoSize, infoDate, infoPanelTitle

export function initInfoPanel() {
	playButton = document.getElementById('play-button')
	infoName = document.getElementById('info-name')
	infoPath = document.getElementById('info-path')
	infoSize = document.getElementById('info-size')
	infoDate = document.getElementById('info-date')
	infoPanelTitle = document.getElementById('info-title')
    const closePanelBtn = document.getElementById('close-panel')

    closePanelBtn.addEventListener('click', () => {
        document.getElementById('info-panel').classList.add('hidden')
        clearSelection()
    })
}

export async function updateInfoPanel(item) {
	if (!item) return
    document.getElementById('info-panel').classList.remove('hidden')
	infoName.textContent = item.name
	infoPath.textContent = item.path

	if (item.isDirectory) {
		const stats = await getFolderStats(item.path)
		infoSize.textContent = `${formatBytes(stats.totalSize)} pour ${stats.fileCount} fichiers`
		infoDate.textContent = '—'
		infoPanelTitle.textContent = 'Détails du dossier'
		playButton.style.display = 'none'
	} else {
		const stats = await getFileStats(item.path)
		infoSize.textContent = formatBytes(stats.size)
		infoDate.textContent = new Date(stats.mtime).toLocaleString()
		infoPanelTitle.textContent = 'Détails du fichier'
		playButton.style.display = 'block'

		playButton.onclick = () => {
			const audio = document.getElementById('audio')
			const playToggle = document.getElementById('play-toggle')
			const currentTrack = document.getElementById('current-track')
			const fileUrl = `file://${item.path.replace(/\\\\/g, '/')}`
			audio.src = encodeURI(fileUrl)
			audio.play()
			currentTrack.textContent = item.name
			playToggle.textContent = '⏸️'
		}
	}
}