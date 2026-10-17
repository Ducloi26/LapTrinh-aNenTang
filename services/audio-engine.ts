import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer, AudioStatus } from 'expo-audio';
import { AudioEngine, cancelledLoad, EngineCallbacks, TrackMetadata } from './audio-engine.types';

export async function configureAudioSession() {
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: 'doNotMix',
    allowsRecording: false,
    shouldRouteThroughEarpiece: false,
  });
}

/** Native playback. Metro selects audio-engine.web.ts in browsers. */
export function createAudioEngine(
  source: string | number,
  callbacks: EngineCallbacks,
  options: { loop?: boolean; metadata?: TrackMetadata } = {},
): AudioEngine {
  let player: AudioPlayer | null = null;
  let subscription: { remove: () => void } | null = null;
  let disposed = false;
  let ended = false;
  let failed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rejectLoad: ((error: Error) => void) | undefined;
  let ready: Promise<void> | undefined;
  let volume = 0.55;

  const clearTimer = () => { if (timer) clearTimeout(timer); };
  const fail = (error: Error) => {
    if (disposed || failed) return;
    failed = true;
    clearTimer();
    rejectLoad?.(error);
    callbacks.onError(error);
  };

  return {
    load() {
      if (disposed) return Promise.reject(cancelledLoad());
      if (ready) return ready;
      ready = new Promise<void>((resolve, reject) => {
        rejectLoad = reject;
        player = createAudioPlayer(source, { updateInterval: 250, keepAudioSessionActive: true });
        player.loop = options.loop ?? false;
        player.volume = volume;
        const statusChanged = (status: AudioStatus) => {
          if (disposed) return;
          if (status.playbackState === 'error' || status.playbackState === 'failed') {
            fail(new Error('Không tải được nhạc. Kiểm tra file MP3 và quyền đọc Supabase Storage.'));
            return;
          }
          // Android can emit isLoaded during preparation; wait for actual duration too.
          if (status.isLoaded && Number.isFinite(status.duration) && status.duration > 0) {
            clearTimer();
            resolve();
          }
          callbacks.onProgress({
            position: Number.isFinite(status.currentTime) ? status.currentTime : 0,
            duration: Number.isFinite(status.duration) ? status.duration : 0,
            isPlaying: status.playing,
            isBuffering: status.isBuffering,
          });
          if (status.didJustFinish && !options.loop && !ended) {
            ended = true;
            callbacks.onEnd();
          }
        };
        subscription = player.addListener('playbackStatusUpdate', statusChanged);
        timer = setTimeout(() => fail(new Error('Tải nhạc quá lâu. Kiểm tra mạng và đường dẫn MP3.')), 20000);
        statusChanged(player.currentStatus);
      });
      return ready;
    },
    async play() {
      if (!player || disposed) throw cancelledLoad();
      if (options.metadata) player.setActiveForLockScreen(true, options.metadata);
      ended = false;
      player.play();
    },
    pause() { player?.pause(); },
    async seek(seconds) {
      if (!player || disposed) return;
      ended = false;
      await player.seekTo(seconds, 0, 0);
    },
    setVolume(value) {
      volume = value;
      if (player) player.volume = value;
    },
    dispose() {
      disposed = true;
      clearTimer();
      rejectLoad?.(cancelledLoad());
      subscription?.remove();
      if (player) {
        if (options.metadata) player.clearLockScreenControls();
        player.pause();
        player.remove();
        player = null;
      }
    },
  };
}
