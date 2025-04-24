export function getEl(id) {
	return document.getElementById(id)
}

export function clearElement(el) {
	while (el.firstChild) {
		el.removeChild(el.firstChild)
	}
}

export function createEl(tag, props = {}, children = []) {
	const el = document.createElement(tag)
	Object.entries(props).forEach(([key, value]) => {
		if (key === 'class') el.className = value
		else if (key === 'text') el.textContent = value
		else el.setAttribute(key, value)
	})
	children.forEach(child => el.appendChild(child))
	return el
}