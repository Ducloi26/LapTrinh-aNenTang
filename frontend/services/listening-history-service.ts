import { supabase } from '../lib/supabase';
import { getBackendSession } from './backend-session';
import type { ListeningRecord } from './listening-history-tracker';

export function historyErrorMessage(error: { code?: string; message?: string; name?: string }): string {
  if (error.name === 'AbortError') return 'Lưu lịch sử quá thời gian chờ. Lượt nghe vẫn đang chờ; bấm Thử lưu lại.';
  if (/failed to fetch|fetch failed|network request failed/i.test(error.message || '')) return 'Không kết nối được backend để lưu lịch sử. Kiểm tra backend cổng 5000, rồi bấm Thử lưu lại trước khi tải lại trang.';
  if (error.code === 'PGRST202') return 'Tính năng lịch sử nghe chưa được cấu hình trên máy chủ.';
  if (error.code === '42501') return 'Tài khoản hiện tại chưa được phép lưu lịch sử nghe. Vui lòng kiểm tra đăng nhập.';
  if (error.code === 'BACKEND_HISTORY') return error.message || 'Không lưu được lịch sử qua backend.';
  return 'Chưa lưu được lịch sử nghe. Bạn có thể bấm Thử lưu lại; nhạc vẫn tiếp tục phát.';
}

/** Pending writes stay in memory until success; retries reuse playbackId. */
export class ListeningHistoryWriter {
  private pending = new Map<string, ListeningRecord>();
  private running: Promise<void> | null = null;
  private flushRequested = false;
  private listeners = new Set<(error: string | null) => void>();

  onStatus(listener: (error: string | null) => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  enqueue(record: ListeningRecord) {
    this.pending.set(record.playbackId, record);
    void this.flush();
  }

  flush(): Promise<void> {
    if (this.running) {
      this.flushRequested = true;
      return this.running;
    }
    this.running = this.drain().then(() => {
      this.running = null;
      if (this.flushRequested) {
        this.flushRequested = false;
        return this.flush();
      }
    });
    return this.running;
  }

  private async drain() {
    try {
      const backend = getBackendSession();
      const { data, error } = backend ? { data: { session: null }, error: null } : await supabase.auth.getSession();
      if (error) throw error;
      const userId = backend?.userId ?? data.session?.user.id;
      if (!userId) {
        if (this.pending.size) this.listeners.forEach((listener) => listener('Chưa lưu lịch sử: không có phiên đăng nhập Supabase. Đăng nhập backend chưa cấp phiên cho bộ ghi lịch sử.'));
        return;
      }
      let saved = false;
      for (const [id, record] of this.pending) {
        // Never replay one account's history with another account's session.
        if (record.userId !== userId) continue;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
          if (backend) {
            const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/listening-history`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${backend.token}` },
              signal: controller.signal, body: JSON.stringify(record),
            });
            let result;
            try { result = await response.json(); } catch {
              throw {code:'BACKEND_HISTORY',message:'Backend chưa có API lưu lịch sử hoặc trả dữ liệu không hợp lệ. Khởi động lại backend rồi bấm Thử lưu lại.'};
            }
            if (!response.ok || !result.success) throw { code: 'BACKEND_HISTORY', message: result.error || 'Backend từ chối lưu lịch sử.' };
          } else {
          const { error: writeError } = await supabase.rpc('record_listening_history', {
            p_playback_id: record.playbackId, p_user_id: record.userId,
            p_track_id: record.trackId, p_listened_sec: record.listenedSec,
            p_duration_sec: record.durationSec, p_end_reason: record.endReason,
            p_played_at: record.playedAt, p_journey_id: record.journeyId ?? null,
            p_mood_id: record.moodId ?? null, p_stage: record.stage ?? null,
          }).abortSignal(controller.signal);
          if (writeError) throw writeError;
          }
          this.pending.delete(id);
          saved = true;
        } finally {
          clearTimeout(timeout);
        }
      }
      if (saved) this.listeners.forEach((listener) => listener(null));
    } catch (error) {
      const message = historyErrorMessage(error && typeof error === 'object' ? error : {});
      this.listeners.forEach((listener) => listener(message));
    }
  }
}
