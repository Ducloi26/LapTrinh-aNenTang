export interface PlaybackProgress {
  position: number;
  duration: number;
  isPlaying: boolean;
  isBuffering: boolean;
}

export interface EngineCallbacks {
  onProgress: (progress: PlaybackProgress) => void;
  onEnd: () => void;
  onError: (error: Error) => void;
}

export interface TrackMetadata {
  title: string;
  artist: string;
  artworkUrl?: string;
}

export interface AudioEngine {
  load: () => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  seek: (seconds: number) => Promise<void>;
  setVolume: (volume: number) => void;
  dispose: () => void;
}

export function cancelledLoad() {
  const error = new Error('Đã đổi hoặc dừng bài hát.');
  error.name = 'AbortError';
  return error;
}
