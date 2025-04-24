import { initTreeView } from './ui/treeview.js'
import { initInfoPanel } from './ui/infopanel.js'
import { initPlayer } from './ui/player.js'

window.addEventListener('DOMContentLoaded', async () => {
	await initTreeView()
	initInfoPanel()
	initPlayer()
})