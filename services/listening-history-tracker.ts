import type { PlaybackProgress } from './audio-engine.types';

export interface ListeningContext {
  journeyId?: string | null;
  moodId?: string | null;
  stage?: string | null;
}

export type ListeningEndReason = 'ended' | 'changed' | 'stopped' | 'error' | 'signed_out';

export interface ListeningRecord extends ListeningContext {
  playbackId: string;
  userId: string;
  trackId: string;
  listenedSec: number;
  durationSec: number;
  playedAt: string;
  endReason: ListeningEndReason;
}

interface ActiveListen {
  userId: string | null;
  trackId: string;
  context: ListeningContext;
  playbackId: string;
  seconds: number;
  elapsedBudget: number;
  duration: number;
  playedAt: string | null;
  previous: { status: PlaybackProgress; at: number } | null;
}

let sequence = 0;
function newPlaybackId() {
  // Correlation ID, not an authentication token. Stable across retries of this listen.
  return `${Date.now().toString(36)}-${(++sequence).toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export class ListeningHistoryTracker {
  private userId: string | null = null;
  private current: ActiveListen | null = null;

  constructor(
    private readonly save: (record: ListeningRecord) => void,
    private readonly clock: () => number = () => performance.now(),
    private readonly playedAt: () => string = () => new Date().toISOString(),
  ) {}

  setUser(userId: string | null) {
    if (userId === this.userId) return;
    const trackId = this.current?.trackId;
    const context = this.current?.context;
    this.finish('signed_out');
    this.userId = userId;
    if (trackId) this.begin(trackId, context);
  }

  get active() { return this.current !== null; }

  begin(trackId?: string, context: ListeningContext = {}) {
    this.finish('changed');
    if (!trackId) return;
    this.current = {
      trackId, context: { ...context }, userId: this.userId,
      playbackId: newPlaybackId(), seconds: 0, elapsedBudget: 0, duration: 0, playedAt: null, previous: null,
    };
  }

  update(status: PlaybackProgress) {
    const listen = this.current;
    if (!listen) return;
    const now = this.clock();
    const previous = listen.previous;
    if (Number.isFinite(status.duration) && status.duration > 0) listen.duration = status.duration;
    if (status.isPlaying && !status.isBuffering && !listen.playedAt) listen.playedAt = this.playedAt();
    if (previous?.status.isPlaying && !previous.status.isBuffering) {
      const movement = status.position - previous.status.position;
      const elapsed = Math.max(0, (now - previous.at) / 1000);
      listen.elapsedBudget += elapsed;
      // Neither a seek jump nor time spent paused/buffering counts as listening.
      // Carry unused elapsed time across batched native events after backgrounding.
      // A 100ms budget tolerance absorbs status-delivery jitter, not seek distance.
      if (Number.isFinite(movement) && movement > 0) {
        const heard = Math.min(movement, Math.max(0, listen.elapsedBudget + 0.1));
        listen.seconds += heard;
        listen.elapsedBudget -= heard;
      }
    }
    if (!status.isPlaying || status.isBuffering) listen.elapsedBudget = 0;
    listen.previous = { status: { ...status }, at: now };
  }

  seeking() {
    if (this.current) {
      this.current.previous = null;
      this.current.elapsedBudget = 0;
    }
  }

  finish(endReason: ListeningEndReason) {
    const listen = this.current;
    // Detach before enqueueing: end + next-track + stop must not insert twice.
    this.current = null;
    if (!listen?.userId || !listen.playedAt || listen.seconds < 5 || listen.duration <= 0) return;
    this.save({
      ...listen.context,
      userId: listen.userId, trackId: listen.trackId, playbackId: listen.playbackId,
      listenedSec: Math.floor(listen.seconds + 1e-6), durationSec: listen.duration,
      playedAt: listen.playedAt, endReason,
    });
  }
}
