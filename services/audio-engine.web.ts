import { Asset } from 'expo-asset';
import { AudioEngine, cancelledLoad, EngineCallbacks, TrackMetadata } from './audio-engine.types';

export async function configureAudioSession() {}

/** Use media events directly: expo-audio 1.1.1 web does not forward error/ended reliably. */
export function createAudioEngine(
  source: string | number,
  callbacks: EngineCallbacks,
  options: { loop?: boolean; metadata?: TrackMetadata } = {},
): AudioEngine {
  const audio = new Audio();
  audio.preload = 'auto';
  audio.loop = options.loop ?? false;
  const uri = typeof source === 'number' ? Asset.fromModule(source).uri : source;
  let disposed = false;
  let ready: Promise<void> | undefined;
  let rejectLoad: ((error: Error) => void) | undefined;
  let resolveLoad: (() => void) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const clearTimer = () => { if (timer) clearTimeout(timer); };
  const progress = () => {
    if (disposed) return;
    callbacks.onProgress({
      position: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
      duration: Number.isFinite(audio.duration) ? audio.duration : 0,
      isPlaying: !audio.paused && !audio.ended && audio.readyState >= 3,
      isBuffering: audio.readyState < 3 && !audio.paused,
    });
  };
  const loaded = () => { clearTimer(); resolveLoad?.(); progress(); };
  const failed = () => {
    if (disposed) return;
    clearTimer();
    const error = new Error('Không tải được nhạc. Kiểm tra file MP3, mạng và quyền đọc Supabase Storage.');
    rejectLoad?.(error);
    callbacks.onError(error);
  };
  const ended = () => { progress(); if (!audio.loop) callbacks.onEnd(); };
  const events: [string, () => void][] = [
    ['loadedmetadata', loaded], ['timeupdate', progress], ['playing', progress],
    ['pause', progress], ['waiting', progress], ['seeked', progress],
    ['ended', ended], ['error', failed],
  ];
  events.forEach(([name, callback]) => audio.addEventListener(name, callback));

  return {
    load() {
      if (disposed) return Promise.reject(cancelledLoad());
      if (!ready) {
        ready = new Promise<void>((resolve, reject) => {
          resolveLoad = resolve;
          rejectLoad = reject;
          timer = setTimeout(failed, 20000);
          audio.src = uri;
          audio.load();
        });
      }
      return ready;
    },
    async play() {
      if (disposed) throw cancelledLoad();
      // Await browser rejection (e.g. autoplay policy) instead of showing a false playing state.
      await audio.play();
      if (disposed) { audio.pause(); throw cancelledLoad(); }
      if (options.metadata && 'mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: options.metadata.title,
          artist: options.metadata.artist,
          artwork: options.metadata.artworkUrl ? [{ src: options.metadata.artworkUrl }] : [],
        });
        navigator.mediaSession.setActionHandler('play', () => { void audio.play().catch(failed); });
        navigator.mediaSession.setActionHandler('pause', () => audio.pause());
      }
    },
    pause() { audio.pause(); },
    async seek(seconds) { audio.currentTime = seconds; progress(); },
    setVolume(volume) { audio.volume = volume; },
    dispose() {
      disposed = true;
      clearTimer();
      rejectLoad?.(cancelledLoad());
      events.forEach(([name, callback]) => audio.removeEventListener(name, callback));
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      if (options.metadata && 'mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
      }
    },
  };
}
