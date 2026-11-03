const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadModule } = require('./test-support.cjs');

class AudioParamMock {
  constructor(value = 0) {
    this.value = value;
    this.ramps = [];
  }
  cancelAndHoldAtTime() {}
  linearRampToValueAtTime(value, time) {
    this.ramps.push({ value, time });
    this.value = value;
  }
  setValueAtTime(value, time) {
    this.value = value;
    this.ramps.push({ value, time });
  }
}

class AudioContextMock {
  constructor() {
    this.state = 'suspended';
    this.currentTime = 0;
    this.destination = {};
    this.oscillators = [];
    this.gains = [];
    this.panners = [];
    AudioContextMock.instances.push(this);
  }
  createGain() {
    const node = { gain: new AudioParamMock(), connect() {}, disconnect() {} };
    this.gains.push(node);
    return node;
  }
  createOscillator() {
    const oscillator = {
      frequency: new AudioParamMock(),
      listeners: {},
      connect() {},
      disconnect() {},
      start() {},
      stop() {},
      addEventListener(name, callback) { this.listeners[name] = callback; },
    };
    this.oscillators.push(oscillator);
    return oscillator;
  }
  createStereoPanner() {
    const node = { pan: new AudioParamMock(), connect() {}, disconnect() {} };
    this.panners.push(node);
    return node;
  }
  async resume() { this.state = 'running'; }
  async suspend() { this.state = 'suspended'; }
  async close() { this.state = 'closed'; }
}
AudioContextMock.instances = [];

test('Web Audio synth exposes binaural/chord APIs and applies tuning without changing beat Hz', async () => {
  const storage = new Map();
  const timerDelays = [];
  const timerCallbacks = [];
  const presets = loadModule('services/audio-presets.ts');
  const { audioSynth } = loadModule(
    'services/audio-service.ts',
    {
      'react-native': { Platform: { OS: 'web' } },
      '@/services/audio-presets': presets,
    },
    {
      window: {
        AudioContext: AudioContextMock,
        localStorage: {
          getItem: (key) => storage.get(key) ?? null,
          setItem: (key, value) => storage.set(key, value),
        },
      },
      setTimeout: (_callback, delay) => {
        timerDelays.push(delay);
        timerCallbacks.push(_callback);
        if (delay === 1000) _callback();
        return timerDelays.length;
      },
      clearTimeout: () => {},
    },
  );

  await audioSynth.playBinaural(220, 6);
  const context = AudioContextMock.instances[0];
  assert.equal(context.state, 'running');
  assert.equal(context.oscillators.length, 2);
  assert.equal(context.oscillators[0].frequency.value, 220);
  assert.equal(context.oscillators[1].frequency.value, 226);
  assert.equal(context.panners[0].pan.value, -1);
  assert.equal(context.panners[1].pan.value, 1);
  assert.equal(context.gains[0].gain.ramps.at(-1).time, 2);

  await audioSynth.playAmbientChords(220, 'minor');
  assert.equal(context.oscillators.length, 5);
  assert.equal(context.oscillators[2].frequency.value, 220);
  assert.ok(context.oscillators[3].frequency.value > 220);
  assert.ok(context.oscillators[4].frequency.value > context.oscillators[3].frequency.value);
  assert.deepEqual(timerDelays, [8000]);

  await audioSynth.setReferenceTuning(432);
  assert.equal(storage.get('moodflow_reference_tuning'), '432');
  assert.equal(context.oscillators[0].frequency.ramps.at(-1).value, 216);
  assert.equal(context.oscillators[1].frequency.ramps.at(-1).value, 222);
  assert.equal(context.oscillators[2].frequency.ramps.at(-1).value, 216);
  timerCallbacks[0]();
  assert.equal(context.oscillators.length, 8);
  assert.notEqual(context.oscillators[5].frequency.value, context.oscillators[2].frequency.value);
  assert.deepEqual(timerDelays, [8000, 8000]);
  await audioSynth.pause();
  assert.equal(context.state, 'suspended');
  assert.equal(context.gains[0].gain.ramps.at(-1).time, 1);
  await assert.rejects(audioSynth.playBinaural(0, 6), /Tần số nền/);
  await assert.rejects(audioSynth.setReferenceTuning(441), /chỉ được là 432 Hz hoặc 440 Hz/);
});
