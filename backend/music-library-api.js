const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TRACK_SELECT = 'id,title,genre,duration_sec,cover_url,audio_url,play_count,artists(name),track_features(bpm,energy,valence,psychological_effect)';
const HISTORY_SELECT = 'id,listened_sec,completed,skipped,played_at,tracks(' + TRACK_SELECT + ')';

function first(value) {
  return Array.isArray(value) ? value[0] || null : value;
}

function trackFromRow(row) {
  const artist = first(row.artists);
  const feature = first(row.track_features) || {};
  const duration = Number(row.duration_sec) || 0;
  return {
    id: row.id,
    title: row.title,
    artist: artist?.name || 'Chưa rõ nghệ sĩ',
    genre: row.genre || '',
    duration: `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`,
    cover: row.cover_url || '',
    audioUrl: row.audio_url || undefined,
    bpm: feature.bpm ?? undefined,
    energy: feature.energy ?? 50,
    valence: feature.valence ?? 50,
    psychologicalEffect: feature.psychological_effect || undefined,
  };
}

function createMusicLibraryHandlers({ databaseForUser, onDatabaseError = (entry) =>
  console.error('[LIBRARY_DB]', JSON.stringify(entry)) }) {
  async function database(req) {
    if (!req.actor?.user?.id) {
      const error = new Error('Vui lòng đăng nhập để truy cập thư viện.');
      error.status = 401;
      throw error;
    }
    return databaseForUser(req.actor.user);
  }

  function fail(res, error, operation) {
    if (error?.status === 401) {
      return res.status(401).json({ success: false, error: error.message });
    }
    const dbCode = /^[A-Z0-9_]{1,40}$/.test(error?.code || '') ? error.code : 'UNKNOWN';
    onDatabaseError({ operation, dbCode });
    return res.status(503).json({
      success: false,
      error: 'Không thể truy cập thư viện trên database. Vui lòng thử lại.',
    });
  }

  return {
    async summary(req, res) {
      const userId = req.actor.user.id;
      try {
        const db = await database(req);
        const { data, error } = await db.from('user_listening_summary')
          .select('*').eq('user_id', userId).maybeSingle();
        if (error) throw error;
        return res.json({ success: true, data: data || {
          user_id: userId,
          total_listening_seconds: 0,
          top_genre: null,
          top_artist: null,
          top_mood_id: null,
        } });
      } catch (error) {
        return fail(res, error, 'library_summary');
      }
    },

    async favorites(req, res) {
      const userId = req.actor.user.id;
      try {
        const db = await database(req);
        const { data, error } = await db.from('user_favorites')
          .select(`track_id,created_at,tracks!user_favorites_track_id_fkey(${TRACK_SELECT})`)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        const tracks = (data || [])
          .map((row) => first(row.tracks))
          .filter((track) => track && track.id)
          .map(trackFromRow);
        return res.json({ success: true, data: tracks, count: tracks.length });
      } catch (error) {
        return fail(res, error, 'library_favorites');
      }
    },

    async removeFavorite(req, res) {
      const userId = req.actor.user.id;
      const { trackId } = req.params;
      if (!UUID.test(trackId || '')) {
        return res.status(400).json({ success: false, error: 'ID bài hát không hợp lệ.' });
      }
      try {
        const db = await database(req);
        const { data, error } = await db.from('user_favorites').delete()
          .eq('user_id', userId).eq('track_id', trackId)
          .select('track_id').maybeSingle();
        if (error) throw error;
        if (!data) return res.status(404).json({ success: false, error: 'Bài hát không còn trong danh sách yêu thích.' });
        return res.json({ success: true, removed: true });
      } catch (error) {
        return fail(res, error, 'library_favorite_remove');
      }
    },

    async toggleFavorite(req, res) {
      const userId = req.actor.user.id;
      const trackId = req.body?.track?.id;
      if (!UUID.test(trackId || '')) {
        return res.status(400).json({ success: false, error: 'ID bài hát không hợp lệ.' });
      }
      try {
        const db = await database(req);
        const { data: existing, error: lookupError } = await db.from('user_favorites')
          .select('track_id').eq('user_id', userId).eq('track_id', trackId).maybeSingle();
        if (lookupError) throw lookupError;
        if (existing) {
          const { error } = await db.from('user_favorites').delete()
            .eq('user_id', userId).eq('track_id', trackId);
          if (error) throw error;
          return res.json({ success: true, liked: false });
        }

        const { data: track, error: trackError } = await db.from('tracks')
          .select('id').eq('id', trackId).is('deleted_at', null).maybeSingle();
        if (trackError) throw trackError;
        if (!track) return res.status(404).json({ success: false, error: 'Bài hát không còn khả dụng.' });
        const { error: insertError } = await db.from('user_favorites')
          .insert({ user_id: userId, track_id: trackId });
        if (insertError) throw insertError;
        return res.json({ success: true, liked: true });
      } catch (error) {
        return fail(res, error, 'library_favorite_toggle');
      }
    },

    async history(req, res) {
      const userId = req.actor.user.id;
      try {
        const db = await database(req);
        const { data, error } = await db.from('listening_history')
          .select(HISTORY_SELECT)
          .eq('user_id', userId)
          .order('played_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        const rows = (data || []).flatMap((row) => {
          const track = first(row.tracks);
          return track ? [{ ...trackFromRow(track), historyId: row.id,
            listenedSec: row.listened_sec, completed: row.completed === true,
            skipped: row.skipped === true, playedAt: row.played_at }] : [];
        });
        return res.json({ success: true, data: rows });
      } catch (error) {
        return fail(res, error, 'library_history');
      }
    },

    async clearHistory(req, res) {
      const userId = req.actor.user.id;
      try {
        const db = await database(req);
        const { error } = await db.from('listening_history').delete().eq('user_id', userId);
        if (error) throw error;
        return res.json({ success: true, cleared: true });
      } catch (error) {
        return fail(res, error, 'library_history_clear');
      }
    },
  };
}

module.exports = { createMusicLibraryHandlers };
