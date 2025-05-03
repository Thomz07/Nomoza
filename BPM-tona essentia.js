const fs = require("fs");
const path = require("path");
const Essentia = require("essentia.js");

const essentia = new Essentia.Essentia(Essentia.EssentiaWASM);

function toCamelot(pitch, scale) {
  const map = {
    'C':   { major: '8B',  minor: '5A' },
    'C#':  { major: '3B',  minor: '12A' },
    'D':   { major: '10B', minor: '7A' },
    'D#':  { major: '5B',  minor: '2A' },
    'E':   { major: '12B', minor: '9A' },
    'F':   { major: '7B',  minor: '4A' },
    'F#':  { major: '2B',  minor: '11A' },
    'G':   { major: '9B',  minor: '6A' },
    'G#':  { major: '4B',  minor: '1A' },
    'A':   { major: '11B', minor: '8A' },
    'A#':  { major: '6B',  minor: '3A' },
    'B':   { major: '1B',  minor: '10A' }
  };
  return map[pitch]?.[scale.toLowerCase()] || null;
}

async function analyze(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error("Fichier introuvable.");
    return;
  }

  const audio = await essentia.audioLoader(filePath);
  const bpmRes = essentia.BeatTrackerMultiFeature(audio.audio);
  const keyRes = essentia.KeyExtractor(audio.audio, audio.samplerate);

  const bpm = bpmRes.bpm;
  const pitch = keyRes.key;
  const scale = keyRes.scale;
  const camelot = toCamelot(pitch, scale);

  console.log(`BPM: ${bpm.toFixed(2)}`);
  console.log(`KEY: ${camelot} (${pitch} ${scale})`);
}

const file = process.argv[2];
if (!file) {
  console.error("Usage: node analyzeAudio.js <chemin_fichier_audio>");
} else {
  analyze(file);
}