// Deterministic, seamless stereo PCM loops. No downloaded audio or external tools.
const fs = require('node:fs');
const path = require('node:path');
const sampleRate = 16000;
const seconds = 4;
const frames = sampleRate * seconds;
const target = path.join(__dirname, '..', 'assets', 'audio');
fs.mkdirSync(target, { recursive: true });
for (const [name, difference] of [['deep-work', 10], ['relax', 6], ['sleep', 4]]) {
  const wav = Buffer.alloc(44 + frames * 4);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 4, 28);
  wav.writeUInt16LE(4, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(frames * 4, 40);
  for (let frame = 0; frame < frames; frame++) {
    for (let channel = 0; channel < 2; channel++) {
      const hz = 200 + (channel ? difference : 0);
      const sample = Math.round(32767 * Math.sin(2 * Math.PI * hz * frame / sampleRate));
      wav.writeInt16LE(sample, 44 + frame * 4 + channel * 2);
    }
  }
  fs.writeFileSync(path.join(target, `binaural-${name}.wav`), wav);
}
