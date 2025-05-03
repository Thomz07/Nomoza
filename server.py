from fastapi import FastAPI, Request
from pydantic import BaseModel
import librosa
import numpy as np
import json

app = FastAPI()

class AudioRequest(BaseModel):
    path: str

@app.post("/analyze")
async def analyze_audio(request: AudioRequest):
    try:
        y, sr = librosa.load(request.path)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)

        tempo = format(tempo)

        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        avg_chroma = chroma.mean(axis=1)
        key_index = int(np.argmax(avg_chroma)) 
        keys = ['C', 'C#', 'D', 'D#', 'E', 'F',
                'F#', 'G', 'G#', 'A', 'A#', 'B']
        key = keys[key_index]

        return {
            "bpm": tempo,
            "key": key
        }
    except Exception as e:
        return {"error": str(e)}
