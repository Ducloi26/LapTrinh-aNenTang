import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Track } from '@/constants/moodflow';
import { PlayerService } from '@/services/player-service';
import { SynthPresetId } from '@/services/audio-presets';
import { PlaybackProgress } from '@/services/audio-engine.types';

export interface PlayerStageInfo {
  index: number;
  total: number;
  title: string;
}

export interface PlayerQueueEntry {
  track: Track;
  stageInfo: PlayerStageInfo | null;
}

interface PlayerContextValue {
  queue: PlayerQueueEntry[];
  currentIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  isBuffering: boolean;
  nowPlaying: Track | null;
  stageInfo: PlayerStageInfo | null;
  // Keep existing consumers compatible while using real playback status.
  playing: boolean;
  elapsedSeconds: number;
  durationSeconds: number;
  presetId: SynthPresetId;
  volume: number;
  error: string | null;
  play: () => Promise<void>;
  pause: () => void;
  togglePlay: () => void;
  stop: () => Promise<void>;
  setPreset: (presetId: SynthPresetId) => Promise<void>;
  setVolume: (volume: number) => void;
  seekTo: (seconds: number) => void;
  playTrack: (track: Track, stageInfo?: PlayerStageInfo | null, queue?: PlayerQueueEntry[], queueIndex?: number) => void;
  previousTrack: () => void;
  nextTrack: () => void;
  initializeLibrary: (tracks: Track[]) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [service] = useState(() => new PlayerService());
  const [queue, setQueue] = useState<PlayerQueueEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<PlaybackProgress>({ position: 0, duration: 0, isPlaying: false, isBuffering: false });
  const [presetId, setPresetId] = useState<SynthPresetId>('deep-work');
  const [volume, setVolumeState] = useState(0.55);
  const [error, setError] = useState<string | null>(null);
  const queueRef = useRef(queue);
  const indexRef = useRef(0);
  const wantsPlay = useRef(false);
  const request = useRef(0);
  const pendingLoad = useRef<Promise<void> | null>(null);
  const mounted = useRef(true);
  const wasPlaying = useRef(false);

  const reportError = useCallback((reason: unknown) => {
    if (reason instanceof Error && reason.name === 'AbortError') return;
    wantsPlay.current = false;
    service.pause();
    if (mounted.current) setError(reason instanceof Error ? reason.message : 'Không thể phát bài hát.');
  }, [service]);

  const loadEntry = useCallback(async (index: number, autoPlay: boolean) => {
    const entry = queueRef.current[index];
    if (!entry) return;
    const version = ++request.current;
    indexRef.current = index;
    wantsPlay.current = autoPlay;
    setCurrentIndex(index);
    setError(null);
    const loading = service.load(entry.track);
    pendingLoad.current = loading;
    try {
      await loading;
      if (version !== request.current || !mounted.current) return;
      if (wantsPlay.current) {
        await service.play();
        if (version === request.current && !wantsPlay.current) service.pause();
      }
    } catch (reason) {
      if (version === request.current) reportError(reason);
    } finally {
      if (pendingLoad.current === loading) pendingLoad.current = null;
    }
  }, [reportError, service]);

  useEffect(() => {
    mounted.current = true;
    const offProgress = service.onProgress((progress) => {
      if (wasPlaying.current && !progress.isPlaying && !progress.isBuffering) wantsPlay.current = false;
      wasPlaying.current = progress.isPlaying;
      setStatus(progress);
    });
    const offError = service.onError(reportError);
    const offEnd = service.onEnd(() => {
      const next = indexRef.current + 1;
      if (next < queueRef.current.length) void loadEntry(next, true);
      else {
        wantsPlay.current = false;
        service.pause();
      }
    });
    return () => {
      mounted.current = false;
      // Invalidate outstanding async playback operations; this ref is a version counter.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ++request.current;
      wantsPlay.current = false;
      pendingLoad.current = null;
      offProgress(); offError(); offEnd();
      service.dispose();
    };
  }, [loadEntry, reportError, service]);

  const play = useCallback(async () => {
    wantsPlay.current = true;
    setError(null);
    if (!service.hasTrack && !pendingLoad.current) {
      await loadEntry(indexRef.current, true);
      return;
    }
    const version = request.current;
    try {
      if (pendingLoad.current) {
        // The load operation already resumes according to wantsPlay when it finishes.
        await pendingLoad.current;
        return;
      }
      if (!wantsPlay.current || version !== request.current || !mounted.current) return;
      if (status.duration > 0 && status.position >= status.duration) await service.seek(0);
      await service.play();
      if (version === request.current && !wantsPlay.current) service.pause();
    } catch (reason) {
      if (version === request.current) reportError(reason);
    }
  }, [loadEntry, reportError, service, status.duration, status.position]);

  const pause = useCallback(() => {
    wantsPlay.current = false;
    service.pause();
  }, [service]);

  const togglePlay = useCallback(() => {
    if (wantsPlay.current || status.isPlaying) pause();
    else void play();
  }, [pause, play, status.isPlaying]);

  const stop = useCallback(async () => {
    ++request.current;
    wantsPlay.current = false;
    pendingLoad.current = null;
    service.stop();
    setError(null);
  }, [service]);

  const setPreset = useCallback(async (preset: SynthPresetId) => {
    setPresetId(preset);
    try { await service.setPreset(preset); }
    catch (reason) { if (!(reason instanceof Error && reason.name === 'AbortError')) reportError(reason); }
  }, [reportError, service]);

  const setVolume = useCallback((value: number) => {
    if (!Number.isFinite(value)) return;
    const bounded = Math.max(0, Math.min(1, value));
    setVolumeState(bounded);
    service.setVolume(bounded);
  }, [service]);

  const seekTo = useCallback((seconds: number) => {
    const version = request.current;
    void service.seek(seconds).catch((reason) => {
      if (version === request.current) reportError(reason);
    });
  }, [reportError, service]);

  const nextTrack = useCallback(() => {
    if (queueRef.current.length) void loadEntry((indexRef.current + 1) % queueRef.current.length, wantsPlay.current);
  }, [loadEntry]);

  const previousTrack = useCallback(() => {
    if (status.position > 3) { seekTo(0); return; }
    const length = queueRef.current.length;
    if (length) void loadEntry((indexRef.current - 1 + length) % length, wantsPlay.current);
  }, [loadEntry, seekTo, status.position]);

  const playTrack = useCallback((track: Track, stageInfo: PlayerStageInfo | null = null, entries?: PlayerQueueEntry[], index = 0) => {
    const nextQueue = entries?.length ? entries : [{ track, stageInfo }];
    queueRef.current = nextQueue;
    setQueue(nextQueue);
    void loadEntry(Math.max(0, Math.min(nextQueue.length - 1, index)), true);
  }, [loadEntry]);

  const initializeLibrary = useCallback((tracks: Track[]) => {
    if (!tracks.length || request.current > 0) return;
    const entries = tracks.map((track) => ({ track, stageInfo: { index: 0, total: 1, title: 'Thư viện' } }));
    queueRef.current = entries;
    indexRef.current = 0;
    setQueue(entries);
    setCurrentIndex(0);
  }, []);

  const value = useMemo<PlayerContextValue>(() => ({
    queue, currentIndex, ...status,
    nowPlaying: queue[currentIndex]?.track ?? null,
    stageInfo: queue[currentIndex]?.stageInfo ?? null,
    playing: status.isPlaying,
    elapsedSeconds: status.position,
    durationSeconds: status.duration,
    presetId, volume, error, play, pause, togglePlay, stop,
    setPreset, setVolume, seekTo, playTrack, previousTrack, nextTrack, initializeLibrary,
  }), [queue, currentIndex, status, presetId, volume, error, play, pause, togglePlay, stop, setPreset, setVolume, seekTo, playTrack, previousTrack, nextTrack, initializeLibrary]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within a PlayerProvider.');
  return context;
}
