export async function analyzeAudioWithPython(path) {
	try {
		const response = await fetch('http://127.0.0.1:8000/analyze', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ path })
		})

		if (!response.ok) {
			throw new Error(`Erreur serveur Python : ${response.status}`)
		}

		const data = await response.json()

		if (data.error) {
			console.warn("Erreur analyse Python :", data.error)
			return null
		}

		return {
			bpm: data.bpm,
			key: data.key
		}
	} catch (err) {
		console.error("Impossible de joindre le serveur Python :", err)
		return null
	}
}