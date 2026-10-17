import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

let pending: Promise<Session> | null = null;

/** Explicit guest action; reuses a saved account and coalesces double taps. */
export function ensureGuestSession(): Promise<Session> {
  if (pending) return pending;
  pending = (async () => {
    const { data: current, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (current.session) return current.session;
    const { data, error } = await supabase.auth.signInAnonymously({ options: { data: { display_name: 'Khách' } } });
    if (error) throw error;
    if (!data.session) throw new Error('No guest session returned');
    return data.session;
  })().finally(() => { pending = null; });
  return pending;
}

export function guestSessionErrorMessage(reason: unknown): string {
  const code = reason && typeof reason === 'object' && 'code' in reason ? reason.code : null;
  if (code === 'anonymous_provider_disabled') return 'Chế độ khách chưa được bật trên máy chủ.';
  return 'Chưa tạo được phiên khách. Kiểm tra kết nối rồi thử lại; bạn vẫn có thể nghe nhạc.';
}
