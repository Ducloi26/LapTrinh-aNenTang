import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUserProfile } from '@/services/mood-service';

function cachedProfile() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const saved = JSON.parse(localStorage.getItem('moodflow_user') || 'null');
    if (saved?.id && localStorage.getItem('moodflow_token')) return {
      userId: String(saved.id), userName: String(saved.displayName || 'Người nghe'),
      userRole: saved.role === 'admin' ? 'admin' as const : 'user' as const,
    };
  } catch { /* Ignore invalid cached profile. */ }
  return null;
}

/** Preserve main's backend profile while also following Supabase/guest sessions. */
export function useListenerProfile() {
  const [profile, setProfile] = useState<{ userId: string; userName: string; userRole: 'user' | 'admin' }>({
    userId: 'guest', userName: 'Người nghe', userRole: 'user',
  });
  const refreshProfile = useCallback(() => {
    const cached = cachedProfile();
    if (cached) setProfile(cached);
  }, []);
  useEffect(() => {
    let active = true;
    const restore = () => {
      const cached = cachedProfile();
      setProfile(cached || { userId: 'guest', userName: 'Người nghe', userRole: 'user' });
    };
    restore();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const cached = cachedProfile();
      if (cached) { setProfile(cached); return; }
      if (session?.user) {
        setProfile({ userId: session.user.id, userName: session.user.user_metadata?.display_name || 'Người nghe', userRole: 'user' });
        setTimeout(() => {
          void getCurrentUserProfile().then((value) => {
            if (active && value) setProfile((current) => current.userId === session.user.id
              ? { ...current, userName: value.displayName } : current);
          });
        }, 0);
      } else restore();
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  return { ...profile, refreshProfile };
}
