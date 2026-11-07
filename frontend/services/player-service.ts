import type { Track } from '../constants/moodflow';
import { SYNTH_PRESETS, SynthPresetId } from './audio-presets';
import { audioSynth } from './audio-service';
import { configureAudioSession, createAudioEngine } from './audio-engine';
import { AudioEngine, cancelledLoad, PlaybackProgress } from './audio-engine.types';
import { resolveTrackSource } from './track-source';
import { prepareAudiusTrack } from './audius-search-service';
import type { ListeningContext, ListeningEndReason, ListeningHistoryTracker } from './listening-history-tracker';

// Bundled stereo loops also work on native, where Web Audio oscillators are unavailable.
const BINAURAL_SOURCES: Partial<Record<SynthPresetId, number>> = {
  'deep-work': require('../assets/audio/binaural-deep-work.wav'),
  relax: require('../assets/audio/binaural-relax.wav'),
  sleep: require('../assets/audio/binaural-sleep.wav'),
};
export const BINAURAL_MIX = 0.12;

export class PlayerService {
  private music: AudioEngine | null = null;
  private binaural: AudioEngine | null = null;
  private generation = 0;
  private mixGeneration = 0;
  private volume = 0.55;
  private preset: SynthPresetId = 'deep-work';
  private playing = false;
  private progress: PlaybackProgress = { position: 0, duration: 0, isPlaying: false, isBuffering: false };
  private progressListeners = new Set<(progress: PlaybackProgress) => void>();
  private endListeners = new Set<() => void>();
  private errorListeners = new Set<(error: Error) => void>();
  private selectedTrack: Track | null = null;
  private listeningContext: ListeningContext = {};

  constructor(private readonly history?: ListeningHistoryTracker) {}

  setHistoryUser(userId: string | null) {
    this.captureHistory();
    this.history?.setUser(userId);
  }

  onProgress(listener: (progress: PlaybackProgress) => void) {
    this.progressListeners.add(listener);
    return () => { this.progressListeners.delete(listener); };
  }
  onEnd(listener: () => void) {
    this.endListeners.add(listener);
    return () => { this.endListeners.delete(listener); };
  }
  onError(listener: (error: Error) => void) {
    this.errorListeners.add(listener);
    return () => { this.errorListeners.delete(listener); };
  }
  get hasTrack() { return this.music !== null; }

  async load(track: Track, listeningContext: ListeningContext = {}) {
    this.finishHistory('changed');
    this.selectedTrack = track;
    this.listeningContext = listeningContext;
    const generation = ++this.generation;
    this.releaseMusic();
    this.publish({ position: 0, duration: 0, isPlaying: false, isBuffering: true });
    try {
      if (track.audiusSourceId) {
        track = await prepareAudiusTrack(track);
        if (generation !== this.generation) throw cancelledLoad();
        this.selectedTrack = track;
      }
      this.history?.begin(track.id, listeningContext);
      const source = resolveTrackSource(track);
      await configureAudioSession();
      if (generation !== this.generation) throw cancelledLoad();
      const music = createAudioEngine(source, {
        onProgress: (progress) => {
          if (generation !== this.generation) return;
          this.history?.update(progress);
          this.publish(progress);
          this.syncBinaural(progress.isPlaying);
        },
        onEnd: () => {
          if (generation !== this.generation) return;
          this.finishHistory('ended');
          this.syncBinaural(false);
          this.endListeners.forEach((listener) => listener());
        },
        onError: (error) => { if (generation === this.generation) this.fail(error); },
      }, { metadata: { title: track.title, artist: track.artist, artworkUrl: track.cover } });
      this.music = music;
      music.setVolume(this.volume);
      await music.load();
      if (generation !== this.generation) throw cancelledLoad();
    } catch (error) {
      if (generation === this.generation) {
        this.finishHistory('error');
        this.releaseMusic();
        this.publish({ ...this.progress, isPlaying: false, isBuffering: false });
      }
      throw error;
    }
  }

  async play() {
    const music = this.music;
    if (!music) throw new Error('Chưa chọn bài hát để phát.');
    if (!this.history?.active) this.history?.begin(this.selectedTrack?.id, this.listeningContext);
    await music.play();
    if (music !== this.music) throw cancelledLoad();
  }

  pause() {
    this.captureHistory();
    this.music?.pause();
    this.syncBinaural(false);
    this.publish({ ...this.progress, isPlaying: false, isBuffering: false });
  }

  async seek(seconds: number) {
    if (!Number.isFinite(seconds) || !this.music || this.progress.duration <= 0) return;
    this.captureHistory();
    this.history?.seeking();
    await this.music.seek(Math.max(0, Math.min(this.progress.duration, seconds)));
  }

  setVolume(value: number) {
    if (!Number.isFinite(value)) return;
    this.volume = Math.max(0, Math.min(1, value));
    this.music?.setVolume(this.volume);
    this.binaural?.setVolume(this.volume * BINAURAL_MIX);
    if (audioSynth.isSupported) audioSynth.setVolume(this.volume);
  }

  async setPreset(preset: SynthPresetId) {
    if (!SYNTH_PRESETS[preset] || this.preset === preset) return;
    this.preset = preset;
    ++this.mixGeneration;
    this.binaural?.dispose();
    this.binaural = null;
    if (audioSynth.isSupported) {
      await audioSynth.setPreset(preset);
    }
    if (this.playing) await this.startBinaural();
  }

  stop() {
    this.finishHistory('stopped');
    ++this.generation;
    this.releaseMusic();
    ++this.mixGeneration;
    this.binaural?.dispose();
    this.binaural = null;
    if (audioSynth.isSupported) {
      void audioSynth.stop().catch((error: unknown) => console.warn('Không dừng được synth', error));
    }
    this.selectedTrack = null;
    this.publish({ position: 0, duration: 0, isPlaying: false, isBuffering: false });
  }

  dispose() {
    this.stop();
    this.progressListeners.clear();
    this.endListeners.clear();
    this.errorListeners.clear();
  }

  private publish(progress: PlaybackProgress) {
    this.progress = progress;
    this.progressListeners.forEach((listener) => listener(progress));
  }

  private releaseMusic() {
    this.syncBinaural(false);
    this.music?.dispose();
    this.music = null;
  }

  private fail(error: Error) {
    this.finishHistory('error');
    ++this.generation;
    this.releaseMusic();
    this.publish({ ...this.progress, isPlaying: false, isBuffering: false });
    this.errorListeners.forEach((listener) => listener(error));
  }

  private syncBinaural(playing: boolean) {
    if (this.playing === playing) return;
    this.playing = playing;
    if (playing) void this.startBinaural().catch((error: unknown) => {
      // A failed optional layer must not stop the song.
      console.warn('Không phát được lớp Binaural', error);
    });
    else {
      this.binaural?.pause();
      if (audioSynth.isSupported) {
        void audioSynth.pause().catch((error: unknown) => console.warn('Không tạm dừng được synth', error));
      }
    }
  }

  private captureHistory() {
    const progress = this.music?.getProgress?.();
    if (progress) this.history?.update(progress);
  }

  private finishHistory(reason: ListeningEndReason) {
    this.captureHistory();
    this.history?.finish(reason);
  }

  private async startBinaural() {
    if (audioSynth.isSupported) {
      audioSynth.setVolume(this.volume);
      await audioSynth.play(this.preset);
      return;
    }
    const generation = this.mixGeneration;
    const source = BINAURAL_SOURCES[this.preset];
    if (!source) return;
    if (!this.binaural) {
      this.binaural = createAudioEngine(source, {
        onProgress: () => {}, onEnd: () => {},
        onError: (error) => console.warn('Không tải được lớp Binaural', error),
      }, { loop: true });
      this.binaural.setVolume(this.volume * BINAURAL_MIX);
    }
    const binaural = this.binaural;
    await binaural.load();
    if (generation === this.mixGeneration && this.playing && binaural === this.binaural) {
      await binaural.play();
    }
  }
}
