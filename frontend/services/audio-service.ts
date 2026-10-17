import { Platform } from 'react-native';
import {
  SYNTH_PRESETS,
  SynthPresetId,
} from '@/services/audio-presets';

const MIN_VOLUME = 0;
const MAX_VOLUME = 1;
const MASTER_FADE_SECONDS = 0.18;
const VOICE_FADE_SECONDS = 1.4;
const PRESET_FADE_SECONDS = 1.8;
const CHORD_SWAP_SECONDS = 8;
const BINAURAL_GAIN = 0.12;
const AMBIENT_GAIN = 0.03;

interface ToneVoice {
  oscillator: OscillatorNode;
  gain: GainNode;
  panner: StereoPannerNode;
}

class WebAudioSynth {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private binauralVoices: ToneVoice[] = [];
  private ambientVoices: ToneVoice[] = [];
  private voices = new Set<ToneVoice>();
  private presetId: SynthPresetId = 'deep-work';
  private volume = 0.55;
  private operationQueue: Promise<void> = Promise.resolve();
  private chordTimer: ReturnType<typeof setTimeout> | null = null;
  private ambientIndex = 0;

  get isSupported() {
    return Platform.OS === 'web' && typeof window !== 'undefined' &&
      typeof window.AudioContext !== 'undefined';
  }

  get selectedPreset() {
    return this.presetId;
  }

  get isPlaying() {
    return this.context?.state === 'running';
  }

  async play(presetId: SynthPresetId = this.presetId) {
    return this.enqueue(async () => {
      this.assertSupported();
      if (presetId !== this.presetId) {
        await this.setPresetNow(presetId);
      }
      if (this.context?.state === 'closed') {
        this.context = null;
        this.masterGain = null;
        this.binauralVoices = [];
        this.ambientVoices = [];
        this.voices.clear();
      }
      if (!this.context) {
        this.createGraph();
      }
      if (this.context?.state !== 'running') {
        await this.context?.resume();
      }
      this.applyVolume(this.volume, true);
      this.startChordCycle();
    });
  }

  async pause() {
    return this.enqueue(async () => {
      if (this.context?.state === 'running') {
        this.applyMasterGain(0, MASTER_FADE_SECONDS);
        await this.wait(MASTER_FADE_SECONDS * 1000);
        if (this.context?.state === 'running') {
          await this.context.suspend();
        }
      }
      this.stopChordCycle();
    });
  }

  async stop() {
    return this.enqueue(() => this.stopNow());
  }

  async setPreset(presetId: SynthPresetId) {
    return this.enqueue(() => this.setPresetNow(presetId));
  }

  setVolume(volume: number) {
    if (!Number.isFinite(volume)) return;
    this.volume = Math.max(MIN_VOLUME, Math.min(MAX_VOLUME, volume));
    this.applyVolume(this.volume, false);
  }

  private enqueue(operation: () => Promise<void>) {
    const result = this.operationQueue.then(operation, operation);
    this.operationQueue = result.catch(() => undefined);
    return result;
  }

  private async stopNow() {
    const context = this.context;

    this.stopChordCycle();

    if (!context) return;

    if (context.state === 'running') {
      this.applyMasterGain(0, MASTER_FADE_SECONDS);
      await this.wait(MASTER_FADE_SECONDS * 1000);
    }

    this.context = null;
    this.masterGain = null;
    this.binauralVoices = [];
    this.ambientVoices = [];

    [...this.voices].forEach(({ oscillator, gain, panner }) => {
      try {
        oscillator.stop();
      } catch {
        // oscillator may already be stopped; this is safe to ignore
      }
      oscillator.disconnect();
      gain.disconnect();
      panner.disconnect();
    });
    this.voices.clear();

    await context.close();
  }

  private async setPresetNow(presetId: SynthPresetId) {
    if (this.presetId === presetId) return;

    this.presetId = presetId;
    const context = this.context;
    if (!context) return;
    if (context.state === 'closed') {
      this.context = null;
      this.masterGain = null;
      this.binauralVoices = [];
      this.ambientVoices = [];
      this.voices.clear();
      return;
    }

    const preset = SYNTH_PRESETS[presetId];
    const now = context.currentTime;
    this.ambientIndex = 0;

    const binauralFrequencies = [
      preset.baseFrequency,
      preset.baseFrequency + preset.beatDifference,
    ];
    this.binauralVoices.forEach(({ oscillator }, index) => {
      const frequency = oscillator.frequency;
      frequency.cancelAndHoldAtTime(now);
      frequency.setTargetAtTime(
        binauralFrequencies[index],
        now,
        PRESET_FADE_SECONDS / 3,
      );
    });
    this.crossfadeAmbientChord(context, preset, PRESET_FADE_SECONDS);

    if (context.state === 'running') {
      this.startChordCycle();
    }
  }

  private assertSupported() {
    if (Platform.OS !== 'web') {
      throw new Error('Web Audio Synth hiện chỉ hỗ trợ trên trình duyệt.');
    }
    if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
      throw new Error('Trình duyệt này không hỗ trợ Web Audio API.');
    }
  }

  private createGraph() {
    this.assertSupported();
    const context = new window.AudioContext();
    const preset = SYNTH_PRESETS[this.presetId];
    const masterGain = context.createGain();
    const binauralVoices: ToneVoice[] = [];
    const ambientVoices: ToneVoice[] = [];

    masterGain.gain.value = 0;
    masterGain.connect(context.destination);

    const leftTone = this.createTone(context, masterGain, preset.baseFrequency, -1, BINAURAL_GAIN);
    const rightTone = this.createTone(context, masterGain, preset.baseFrequency + preset.beatDifference, 1, BINAURAL_GAIN);

    binauralVoices.push(leftTone, rightTone);

    ambientVoices.push(...this.createAmbientChord(context, masterGain, preset, AMBIENT_GAIN));
    this.ambientIndex = 1 % preset.ambientChordProgression.length;

    this.context = context;
    this.masterGain = masterGain;
    this.binauralVoices = binauralVoices;
    this.ambientVoices = ambientVoices;
  }

  private createTone(
    context: AudioContext,
    destination: GainNode,
    frequency: number,
    pan: number,
    gainValue: number,
    initialGain = gainValue,
  ): ToneVoice {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const panner = context.createStereoPanner();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.value = initialGain;
    panner.pan.value = pan;

    oscillator.connect(gain);
    gain.connect(panner);
    panner.connect(destination);
    const voice = { oscillator, gain, panner };
    this.voices.add(voice);
    oscillator.addEventListener('ended', () => {
      oscillator.disconnect();
      gain.disconnect();
      panner.disconnect();
      this.voices.delete(voice);
    }, { once: true });
    oscillator.start();

    return voice;
  }

  private createAmbientChord(
    context: AudioContext,
    destination: GainNode,
    preset: (typeof SYNTH_PRESETS)[SynthPresetId],
    initialGain: number,
  ): ToneVoice[] {
    const chord = preset.ambientChordProgression[this.ambientIndex % preset.ambientChordProgression.length];
    return chord.map((frequency) =>
      this.createTone(context, destination, frequency, 0, AMBIENT_GAIN, initialGain),
    );
  }

  private crossfadeAmbientChord(
    context: AudioContext,
    preset: (typeof SYNTH_PRESETS)[SynthPresetId],
    fadeSeconds: number,
  ) {
    if (!this.masterGain) return;

    const now = context.currentTime;
    const previousVoices = this.ambientVoices;
    const nextVoices = this.createAmbientChord(context, this.masterGain, preset, 0);
    nextVoices.forEach(({ gain }) => {
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(AMBIENT_GAIN, now + fadeSeconds);
    });
    this.releaseVoices(previousVoices, fadeSeconds);
    this.ambientVoices = nextVoices;
    this.ambientIndex = (this.ambientIndex + 1) % preset.ambientChordProgression.length;
  }

  private startChordCycle() {
    this.stopChordCycle();
    const context = this.context;
    if (!context || !this.masterGain || context.state !== 'running') return;

    this.chordTimer = setTimeout(() => {
      this.chordTimer = null;
      if (this.context !== context || context.state !== 'running') return;
      this.crossfadeAmbientChord(
        context,
        SYNTH_PRESETS[this.presetId],
        VOICE_FADE_SECONDS,
      );
      this.startChordCycle();
    }, CHORD_SWAP_SECONDS * 1000);
  }

  private stopChordCycle() {
    if (this.chordTimer !== null) {
      clearTimeout(this.chordTimer);
      this.chordTimer = null;
    }
  }

  private applyVolume(volume: number, fadeIn: boolean) {
    if (!this.context || !this.masterGain) return;

    this.applyMasterGain(
      volume,
      fadeIn ? MASTER_FADE_SECONDS : MASTER_FADE_SECONDS / 3,
    );
  }

  private applyMasterGain(
    volume: number,
    duration: number,
  ) {
    if (!this.context || !this.masterGain) return;

    const now = this.context.currentTime;
    const gain = this.masterGain.gain;
    gain.cancelAndHoldAtTime(now);
    gain.linearRampToValueAtTime(volume, now + duration);
  }

  private releaseVoices(voices: ToneVoice[], fadeSeconds: number) {
    const context = this.context;
    if (!context) return;

    const now = context.currentTime;
    const stopAt = now + fadeSeconds;
    voices.forEach(({ oscillator, gain }) => {
      const gainParam = gain.gain;
      gainParam.cancelAndHoldAtTime(now);
      gainParam.linearRampToValueAtTime(0, stopAt);
      try {
        oscillator.stop(stopAt);
      } catch {
        // The oscillator may already have a scheduled stop.
      }
    });
  }

  private wait(milliseconds: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
  }
}

export const audioSynth = new WebAudioSynth();
