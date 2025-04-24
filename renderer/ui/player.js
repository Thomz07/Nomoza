import { formatTime } from '../utils/format.js'

export function initPlayer() {
	const audio = document.getElementById('audio')
	const playToggle = document.getElementById('play-toggle')
	const progressBar = document.getElementById('progress-bar')
	const timeDisplay = document.getElementById('time-display')

	playToggle.addEventListener('click', () => {
		if (!audio.src) return
		if (audio.paused) {
			audio.play()
			playToggle.textContent = '⏸️'
		} else {
			audio.pause()
			playToggle.textContent = '▶️'
		}
	})

	audio.addEventListener('timeupdate', () => {
		if (!audio.duration) return
		const progress = (audio.currentTime / audio.duration) * 100
		progressBar.value = progress
		timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`
	})

	progressBar.addEventListener('input', () => {
		const seekTime = (progressBar.value / 100) * audio.duration
		audio.currentTime = seekTime
	})
}