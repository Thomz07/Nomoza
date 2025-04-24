export function formatBytes(bytes) {
	if (bytes === 0) return '0 Bytes'
	const k = 1024
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	const value = bytes / Math.pow(k, i)
	return `${value.toFixed(1)} ${sizes[i]}`
}

export function formatTime(seconds) {
	const m = Math.floor(seconds / 60)
	const s = Math.floor(seconds % 60).toString().padStart(2, '0')
	return `${m}:${s}`
}