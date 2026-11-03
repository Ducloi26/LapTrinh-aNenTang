/** Cached identity is for routing only; the server verifies the token on every write. */
export function getBackendSession(): { token: string; userId: string } | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const token = localStorage.getItem('moodflow_token');
    const user = JSON.parse(localStorage.getItem('moodflow_user') || 'null');
    return token && typeof user?.id === 'string' ? { token, userId: user.id } : null;
  } catch { return null; }
}
