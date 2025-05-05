import { getFileStats, getFolderStats } from '../api/electron-api.js'
import { formatBytes } from '../utils/format.js'
import { clearSelection } from './treeview.js'

let playButton, infoName, infoFormat, infoDuration, infoBitrate, infoSamplerate, infoMusicDetails, infoPath, infoSize, infoPanelTitle
let infoBpm, infoKey

export function initInfoPanel() {
	playButton = document.getElementById('play-button')
	infoName = document.getElementById('info-name')
	infoFormat = document.getElementById('info-format')
	infoDuration = document.getElementById('info-duration')
	infoBitrate = document.getElementById('info-bitrate')
	infoSamplerate = document.getElementById('info-samplerate')
	infoPath = document.getElementById('info-path')
	infoSize = document.getElementById('info-size')
	infoPanelTitle = document.getElementById('info-title')
	infoMusicDetails = document.getElementById('info-music-details')
	infoBpm = document.getElementById('info-bpm')
	infoKey = document.getElementById('info-key')

	const closePanelBtn = document.getElementById('close-panel')
	closePanelBtn.addEventListener('click', () => {
		document.getElementById('info-panel').classList.add('hidden')
		clearSelection()
	})
}

export async function updateInfoPanel(item) {
	if (!item) return

	document.getElementById('info-panel').classList.remove('hidden')
	infoName.textContent = await window.pathAPI.nameWithoutExt(item.path)
	infoFormat.textContent = await window.pathAPI.extname(item.path)
	infoPath.textContent = item.path

	if (item.isDirectory) {
		const stats = await getFolderStats(item.path)
		infoSize.textContent = `${formatBytes(stats.totalSize)} pour ${stats.fileCount} fichiers`
		infoPanelTitle.textContent = 'Détails du dossier'
		infoMusicDetails.style.display = 'none'
	} else if (item.isMp3) {
		const stats = await getFileStats(item.path)
		infoSize.textContent = formatBytes(stats.size)
		infoPanelTitle.textContent = 'Détails du fichier'
		infoMusicDetails.style.display = 'block'

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

		const metadata = await window.electronAPI.getAudioMetadata(item.path)
		if (metadata) {
			const duration = Math.round(metadata.duration)
			const mins = Math.floor(duration / 60)
			const secs = (duration % 60).toString().padStart(2, '0')
			infoDuration.textContent = `${mins}:${secs}`
			infoBitrate.textContent = `${Math.round(metadata.bitrate / 1000)} kbps`
			infoSamplerate.textContent = `${metadata.sampleRate} Hz`
			infoBpm.textContent = '—'
			infoKey.textContent = '—'
		}
	} else {
		const stats = await getFileStats(item.path)
		infoSize.textContent = formatBytes(stats.size)
		infoPanelTitle.textContent = 'Détails du fichier'
		infoMusicDetails.style.display = 'none'
	}
}