import librosa
import sys
import os
import numpy as np
import scipy.signal

def lowpass_filter(y, sr, cutoff=150):
    sos = scipy.signal.butter(10, cutoff, 'low', fs=sr, output='sos')
    return scipy.signal.sosfilt(sos, y)

def detect_key(y, sr):
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    chroma_mean = np.mean(chroma, axis=1)
    pitch_classes = ['C', 'C#', 'D', 'D#', 'E', 'F', 
                     'F#', 'G', 'G#', 'A', 'A#', 'B']
    major_profile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09,
                     2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
    minor_profile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53,
                     2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
    scores_major = [np.correlate(chroma_mean, np.roll(major_profile, shift))[0] for shift in range(12)]
    scores_minor = [np.correlate(chroma_mean, np.roll(minor_profile, shift))[0] for shift in range(12)]
    if max(scores_major) > max(scores_minor):
        key_index = scores_major.index(max(scores_major))
        mode = 'major'
    else:
        key_index = scores_minor.index(max(scores_minor))
        mode = 'minor'
    note = pitch_classes[key_index]
    return note, mode

def to_camelot(note, mode):
    camelot_map = {
        'C':   {'major': '8B',  'minor': '5A'},
        'C#':  {'major': '3B',  'minor': '12A'},
        'D':   {'major': '10B', 'minor': '7A'},
        'D#':  {'major': '5B',  'minor': '2A'},
        'E':   {'major': '12B', 'minor': '9A'},
        'F':   {'major': '7B',  'minor': '4A'},
        'F#':  {'major': '2B',  'minor': '11A'},
        'G':   {'major': '9B',  'minor': '6A'},
        'G#':  {'major': '4B',  'minor': '1A'},
        'A':   {'major': '11B', 'minor': '8A'},
        'A#':  {'major': '6B',  'minor': '3A'},
        'B':   {'major': '1B',  'minor': '10A'}
    }
    return camelot_map[note][mode]

def analyze_audio(file_path):
    if not os.path.exists(file_path):
        print("Erreur : fichier introuvable.")
        return
    y, sr = librosa.load(file_path, sr=None)
    y_filtered = lowpass_filter(y, sr)
    onset_env = librosa.onset.onset_strength(y=y_filtered, sr=sr)
    from librosa.feature.rhythm import tempo
    tempo_values = tempo(onset_envelope=onset_env, sr=sr, aggregate=None)
    bpm = float(np.median(tempo_values))
    bpm = round(bpm * 2) / 2
    note, mode = detect_key(y, sr)
    camelot = to_camelot(note, mode)
    print(f"BPM: {bpm:.2f}")
    print(f"KEY: {camelot}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage : python analyze_audio.py <chemin_fichier_audio>")
    else:
        analyze_audio(sys.argv[1])