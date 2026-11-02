import { Platform } from 'react-native';
import { SYNTH_PRESETS } from '@/services/audio-presets';
import type { SynthPresetId } from '@/services/audio-presets';

export type ReferenceTuning = 432 | 440;

const TUNING_STORAGE_KEY = 'moodflow_reference_tuning';
const MIN_VOLUME = 0;
const MAX_VOLUME = 1;
const FADE_IN_SECONDS = 2;
const FADE_OUT_SECONDS = 1;
const CHORD_CROSSFADE_SECONDS = 2;
const CHORD_SWAP_SECONDS = 8;
const BINAURAL_GAIN = 0.12;
const AMBIENT_GAIN = 0.03;

interface ToneVoice {
  oscillator: OscillatorNode;
  gain: GainNode;
  panner: StereoPannerNode;
  frequency: number;
}

type ChordProgression = readonly (readonly number[])[];

function readReferenceTuning(): ReferenceTuning {
  if (typeof window === 'undefined') return 440;
  try {
    return window.localStorage.getItem(TUNING_STORAGE_KEY) === '432' ? 432 : 440;
  } catch (error) {
    console.warn('Không đọc được cài đặt tần số tham chiếu.', error);
    return 440;
  }
}

function makeChordProgression(rootFrequency: number, mode: 'major' | 'minor') {
  const intervals = mode === 'major'
    ? [[0, 4, 7], [5, 9, 12], [7, 11, 14], [9, 12, 16]]
    : [[0, 3, 7], [5, 8, 12], [7, 10, 14], [8, 12, 15]];
  return intervals.map((chord) =>
    chord.map((semitones) => rootFrequency * 2 ** (semitones / 12)),
  );
}

class WebAudioSynth {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private binauralVoices: ToneVoice[] = [];
  private ambientVoices: ToneVoice[] = [];
  private voices = new Set<ToneVoice>();
  private presetId: SynthPresetId = 'deep-work';
  private volume = 0.55;
  private referenceTuning = readReferenceTuning();
  private binauralBaseFrequency = SYNTH_PRESETS[this.presetId].baseFrequency;
  private beatHz = SYNTH_PRESETS[this.presetId].beatDifference;
  private ambientProgression: ChordProgression =
    SYNTH_PRESETS[this.presetId].ambientChordProgression;
  private operationQueue: Promise<void> = Promise.resolve();
  private chordTimer: ReturnType<typeof setTimeout> | null = null;
  private ambientIndex = 0;

  get isSupported() {
    return Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      typeof window.AudioContext !== 'undefined';
  }

  get selectedPreset() {
    return this.presetId;
  }

  get selectedReferenceTuning() {
    return this.referenceTuning;
  }

  get isPlaying() {
    return this.context?.state === 'running';
  }

  async play(presetId: SynthPresetId = this.presetId) {
    return this.enqueue(async () => {
      this.assertSupported();
      if (!SYNTH_PRESETS[presetId]) {
        throw new Error(`Không tìm thấy preset âm thanh: ${presetId}`);
      }
      const presetChanged = this.configurePreset(presetId);
      this.ensureGraph();

      if (this.binauralVoices.length === 0) {
        this.createBinauralVoices(this.binauralBaseFrequency, this.beatHz);
      } else if (presetChanged) {
        this.updateBinauralFrequencies(CHORD_CROSSFADE_SECONDS);
      }
      if (this.ambientVoices.length === 0 || presetChanged) {
        this.crossfadeAmbientChord(CHORD_CROSSFADE_SECONDS);
      }

      await this.resumeAndFadeIn();
      this.startChordCycle();
    });
  }

  async playBinaural(baseFreq: number, beatHz: number) {
    this.validateFrequency(baseFreq, 'Tần số nền');
    this.validateFrequency(beatHz, 'Tần số nhịp');
    return this.enqueue(async () => {
      this.assertSupported();
      this.binauralBaseFrequency = baseFreq;
      this.beatHz = beatHz;
      this.ensureGraph();
      if (this.binauralVoices.length === 0) {
        this.createBinauralVoices(baseFreq, beatHz);
      } else {
        this.updateBinauralFrequencies(CHORD_CROSSFADE_SECONDS);
      }
      await this.resumeAndFadeIn();
    });
  }

  async playAmbientChords(rootFreq: number, mode: 'major' | 'minor') {
    this.validateFrequency(rootFreq, 'Tần số gốc hợp âm');
    return this.enqueue(async () => {
      this.assertSupported();
      this.ambientProgression = makeChordProgression(rootFreq, mode);
      this.ambientIndex = 0;
      this.ensureGraph();
      this.crossfadeAmbientChord(CHORD_CROSSFADE_SECONDS);
      await this.resumeAndFadeIn();
      this.startChordCycle();
    });
  }

  async pause() {
    return this.enqueue(async () => {
      if (this.context?.state === 'running') {
        this.applyMasterGain(0, FADE_OUT_SECONDS);
        await this.wait(FADE_OUT_SECONDS * 1000);
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
    return this.enqueue(() => {
      if (!this.configurePreset(presetId)) return;
      if (!this.context || this.context.state === 'closed') return;
      this.updateBinauralFrequencies(CHORD_CROSSFADE_SECONDS);
      this.crossfadeAmbientChord(CHORD_CROSSFADE_SECONDS);
      if (this.context.state === 'running') this.startChordCycle();
    });
  }

  async setReferenceTuning(tuning: ReferenceTuning) {
    if (tuning !== 432 && tuning !== 440) {
      throw new Error('Tần số tham chiếu chỉ được là 432 Hz hoặc 440 Hz.');
    }

    return this.enqueue(async () => {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(TUNING_STORAGE_KEY, String(tuning));
        }
      } catch (error) {
        console.error('Không lưu được cài đặt tần số tham chiếu.', error);
        throw new Error('Không lưu được cài đặt tần số tham chiếu.');
      }

      this.referenceTuning = tuning;
      this.updateBinauralFrequencies(CHORD_CROSSFADE_SECONDS);
      this.ambientVoices.forEach((voice) => {
        this.rampFrequency(voice, voice.frequency * this.tuningRatio());
      });
    });
  }

  setVolume(volume: number) {
    if (!Number.isFinite(volume)) return;
    this.volume = Math.max(MIN_VOLUME, Math.min(MAX_VOLUME, volume));
    this.applyVolume(this.volume);
  }

  private enqueue(operation: () => Promise<void> | void) {
    const result = this.operationQueue.then(operation, operation);
    this.operationQueue = result.catch(() => undefined);
    return result;
  }

  private setPresetConfiguration(presetId: SynthPresetId) {
    const preset = SYNTH_PRESETS[presetId];
    if (!preset) throw new Error(`Không tìm thấy preset âm thanh: ${presetId}`);
    this.presetId = presetId;
    this.binauralBaseFrequency = preset.baseFrequency;
    this.beatHz = preset.beatDifference;
    this.ambientProgression = preset.ambientChordProgression;
    this.ambientIndex = 0;
  }

  private configurePreset(presetId: SynthPresetId) {
    const preset = SYNTH_PRESETS[presetId];
    if (!preset) throw new Error(`Không tìm thấy preset âm thanh: ${presetId}`);
    const changed = this.presetId !== presetId ||
      this.binauralBaseFrequency !== preset.baseFrequency ||
      this.beatHz !== preset.beatDifference ||
      this.ambientProgression !== preset.ambientChordProgression;
    if (changed) this.setPresetConfiguration(presetId);
    return changed;
  }

  private async resumeAndFadeIn() {
    if (this.context?.state !== 'running') await this.context?.resume();
    this.applyVolume(this.volume, FADE_IN_SECONDS);
  }

  private async stopNow() {
    const context = this.context;
    this.stopChordCycle();
    if (!context) return;

    if (context.state === 'running') {
      this.applyMasterGain(0, FADE_OUT_SECONDS);
      await this.wait(FADE_OUT_SECONDS * 1000);
    }

    this.context = null;
    this.masterGain = null;
    this.binauralVoices = [];
    this.ambientVoices = [];

    [...this.voices].forEach(({ oscillator, gain, panner }) => {
      try {
        oscillator.stop();
      } catch {
        // The oscillator may already have stopped.
      }
      oscillator.disconnect();
      gain.disconnect();
      panner.disconnect();
    });
    this.voices.clear();
    await context.close();
  }

  private assertSupported() {
    if (!this.isSupported) {
      throw new Error('Web Audio Synth hiện chỉ hỗ trợ trên trình duyệt có Web Audio API.');
    }
  }

  private ensureGraph() {
    if (this.context?.state === 'closed') {
      this.context = null;
      this.masterGain = null;
      this.binauralVoices = [];
      this.ambientVoices = [];
      this.voices.clear();
    }
    if (this.context) return;

    const context = new window.AudioContext();
    const masterGain = context.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(context.destination);
    this.context = context;
    this.masterGain = masterGain;
  }

  private createBinauralVoices(baseFrequency: number, beatHz: number) {
    if (!this.context || !this.masterGain) return;
    this.binauralVoices = [
      this.createTone(
        this.context,
        this.masterGain,
        baseFrequency,
        -1,
        BINAURAL_GAIN,
      ),
      this.createTone(
        this.context,
        this.masterGain,
        baseFrequency + beatHz,
        1,
        BINAURAL_GAIN,
        baseFrequency * this.tuningRatio() + beatHz,
      ),
    ];
  }

  private createTone(
    context: AudioContext,
    destination: GainNode,
    frequency: number,
    pan: number,
    gainValue: number,
    actualFrequency = frequency * this.tuningRatio(),
  ): ToneVoice {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const panner = context.createStereoPanner();
    oscillator.type = 'sine';
    oscillator.frequency.value = actualFrequency;
    gain.gain.value = gainValue;
    panner.pan.value = pan;

    oscillator.connect(gain);
    gain.connect(panner);
    panner.connect(destination);
    const voice = { oscillator, gain, panner, frequency };
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

  private crossfadeAmbientChord(fadeSeconds: number) {
    if (!this.context || !this.masterGain || this.ambientProgression.length === 0) return;

    const chord = this.ambientProgression[
      this.ambientIndex % this.ambientProgression.length
    ];
    const previousVoices = this.ambientVoices;
    const nextVoices = chord.map((frequency) =>
      this.createTone(
        this.context!,
        this.masterGain!,
        frequency,
        0,
        0,
      ),
    );
    const now = this.context.currentTime;
    nextVoices.forEach(({ gain }) => {
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(AMBIENT_GAIN, now + fadeSeconds);
    });
    this.releaseVoices(previousVoices, fadeSeconds);
    this.ambientVoices = nextVoices;
    this.ambientIndex = (this.ambientIndex + 1) % this.ambientProgression.length;
  }

  private startChordCycle() {
    this.stopChordCycle();
    const context = this.context;
    if (!context || context.state !== 'running' || this.ambientProgression.length === 0) return;

    this.chordTimer = setTimeout(() => {
      this.chordTimer = null;
      if (this.context !== context || context.state !== 'running') return;
      this.crossfadeAmbientChord(CHORD_CROSSFADE_SECONDS);
      this.startChordCycle();
    }, CHORD_SWAP_SECONDS * 1000);
  }

  private stopChordCycle() {
    if (this.chordTimer !== null) {
      clearTimeout(this.chordTimer);
      this.chordTimer = null;
    }
  }

  private applyVolume(volume: number, duration = FADE_OUT_SECONDS / 3) {
    this.applyMasterGain(volume, duration);
  }

  private applyMasterGain(volume: number, duration: number) {
    if (!this.context || !this.masterGain) return;
    const now = this.context.currentTime;
    const gain = this.masterGain.gain;
    gain.cancelAndHoldAtTime(now);
    gain.linearRampToValueAtTime(volume, now + duration);
  }

  private updateBinauralFrequencies(duration: number) {
    const tunedBase = this.binauralBaseFrequency * this.tuningRatio();
    const frequencies = [tunedBase, tunedBase + this.beatHz];
    this.binauralVoices.forEach((voice, index) => {
      this.rampFrequency(voice, frequencies[index], duration);
    });
  }

  private rampFrequency(
    voice: ToneVoice,
    frequency: number,
    duration = CHORD_CROSSFADE_SECONDS,
  ) {
    if (!this.context) return;
    const parameter = voice.oscillator.frequency;
    const now = this.context.currentTime;
    parameter.cancelAndHoldAtTime(now);
    parameter.linearRampToValueAtTime(frequency, now + duration);
  }

  private releaseVoices(voices: ToneVoice[], fadeSeconds: number) {
    if (!this.context) return;
    const now = this.context.currentTime;
    const stopAt = now + fadeSeconds;
    voices.forEach(({ oscillator, gain }) => {
      gain.gain.cancelAndHoldAtTime(now);
      gain.gain.linearRampToValueAtTime(0, stopAt);
      try {
        oscillator.stop(stopAt);
      } catch {
        // The oscillator may already have a scheduled stop.
      }
    });
  }

  private tuningRatio() {
    return this.referenceTuning / 440;
  }

  private validateFrequency(value: number, label: string) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`${label} phải là số lớn hơn 0.`);
    }
  }

  private wait(milliseconds: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
  }
}

export const audioSynth = new WebAudioSynth();
