const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STAGES = [
  ['acknowledge', '🌊', 'Khởi đầu & Thấu cảm', 0.2],
  ['transition', '🍃', 'Chuyển tiếp', 0.3],
  ['elevate', '✨', 'Nâng đỡ', 0.3],
  ['transcendence', '🌟', 'Thăng hoa & An định', 0.2],
];
const TRACK_SELECT = 'id,title,genre,duration_sec,cover_url,audio_url,artists(name),track_features(bpm,energy,valence,psychological_effect)';
const JOURNEY_SELECT = 'id,user_id,title,mood_from,mood_to,activity,duration_min,created_at,is_public,share_version,updated_at,journey_tracks(track_id,stage_key,position)';
const first = (value) => Array.isArray(value) ? value[0] : value;

function trackFromRow(row) {
  const feature = first(row.track_features) || {};
  return {
    id: row.id, title: row.title, artist: first(row.artists)?.name || 'Chưa rõ nghệ sĩ',
    genre: row.genre, duration: `${Math.floor(row.duration_sec / 60)}:${String(row.duration_sec % 60).padStart(2, '0')}`,
    cover: row.cover_url, audioUrl: row.audio_url,
    energy: feature.energy ?? 50, valence: feature.valence ?? 50,
    bpm: feature.bpm ?? 80, psychologicalEffect: feature.psychological_effect || '',
  };
}

function formatMinutes(minutes) {
  const seconds = Math.round(minutes * 60);
  return [Math.floor(seconds / 60) && `${Math.floor(seconds / 60)} phút`, seconds % 60 && `${seconds % 60} giây`].filter(Boolean).join(' ') || '0 phút';
}

function journeyFromRow(row, tracks) {
  let seconds = 0;
  const stages = STAGES.map(([key, emoji, title, share], index) => {
    const start = seconds;
    seconds += index === 3 ? row.duration_min * 60 - seconds : Math.round(row.duration_min * 60 * share);
    return {
      key, emoji, title, subtitle: '', startMin: start / 60, endMin: seconds / 60,
      range: `${formatMinutes(start / 60)} – ${formatMinutes(seconds / 60)}`,
      tracks: (row.journey_tracks || []).filter((item) => item.stage_key === key)
        .sort((a, b) => a.position - b.position)
        .map((item) => tracks.get(item.track_id)).filter(Boolean),
    };
  });
  const allTracks = stages.flatMap((stage) => stage.tracks);
  return {
    id: row.id, title: row.title, user_id: row.user_id,
    mood_from: row.mood_from, mood_to: row.mood_to, activity: row.activity,
    duration_minutes: row.duration_min, created_at: row.created_at,
    is_public: row.is_public === true, share_version: row.share_version, updated_at: row.updated_at,
    avg_bpm: allTracks.length ? Math.round(allTracks.reduce((sum, track) => sum + track.bpm, 0) / allTracks.length) : 0,
    unavailable_track_count: (row.journey_tracks || []).length - allTracks.length,
    stages, storage: 'cloud',
  };
}

function createJourneyHandlers({ database, verifyToken, databaseForExpressUser, isMoodId,
  onDatabaseError = (entry) => console.error('[JOURNEY_DB]', JSON.stringify(entry)) }) {
  async function session(req, res) {
    if (!database) {
      res.status(503).json({ success: false, error: 'Chưa cấu hình kết nối database.' });
      return null;
    }
    const token = /^Bearer (\S+)$/.exec(req.headers.authorization || '')?.[1];
    let user;
    let db = database;
    if (token) {
      try { user = await verifyToken(token); } catch {}
    }
    if (!UUID.test(user?.id || '')) {
      res.status(401).json({ success: false, error: 'Vui lòng đăng nhập để quản lý hành trình.' });
      return null;
    }
    if (databaseForExpressUser) {
      try {
        db = await databaseForExpressUser(user);
      } catch (error) {
        const missing = error.code === 'ACCOUNT_NOT_IN_DATABASE';
        const config = error.code === 'SERVER_AUTH_NOT_CONFIGURED';
        res.status(missing ? 401 : 503).json({ success: false,
          code: missing || config ? error.code : 'ACCOUNT_DB_UNAVAILABLE',
          error: missing || config ? error.message : 'Không thể xác minh tài khoản trên database.',
        });
        return null;
      }
    }
    return { db, userId: user.id };
  }

  function fail(res, error, operation) {
    const dbCode = /^[A-Z0-9_]{1,40}$/.test(error?.code || '') ? error.code : 'UNKNOWN';
    let status = 503;
    let code = 'DB_UNAVAILABLE';
    let message = 'Không thể hoàn tất thao tác trên database. Vui lòng thử lại.';
    if (dbCode === '23503' && /journeys_user_id_fkey/.test(`${error.message || ''} ${error.details || ''}`)) {
      status = 409;
      code = 'AUTH_ID_NOT_LINKED';
      message = 'Liên kết tài khoản trên database chưa hợp lệ. Vui lòng kiểm tra app_users.';
    } else if (dbCode === '42501') {
      status = 503;
      code = 'DB_PERMISSION_DENIED';
      message = 'Database từ chối quyền truy cập của backend. Vui lòng kiểm tra quyền server.';
    } else if (['42703', '42P01', 'PGRST200', 'PGRST204', 'PGRST205'].includes(dbCode)) {
      code = 'DB_SCHEMA_MISMATCH';
      message = 'Schema trên database chưa khớp truy vấn bảng, cột hoặc quan hệ. Cần đối chiếu schema đang chạy.';
    } else if (dbCode === '23503') {
      status = 409;
      code = 'DB_REFERENCE_INVALID';
      message = 'Dữ liệu liên kết trong database không còn hợp lệ. Vui lòng tải lại catalog.';
    } else if (dbCode === '23505') {
      status = 409;
      code = 'DB_CONFLICT';
      message = 'Dữ liệu bị trùng trong database. Kiểm tra thư viện trước khi thử lại.';
    }
    onDatabaseError({ operation, dbCode, code });
    return res.status(status).json({ success: false, code, dbCode, operation, error: message });
  }

  async function loadTracks(db, ids) {
    if (!ids.length) return new Map();
    const tracks = new Map();
    for (let offset = 0; offset < ids.length; offset += 100) {
      const { data, error } = await db.from('tracks').select(TRACK_SELECT).in('id', ids.slice(offset, offset + 100)).is('deleted_at', null);
      if (error) throw error;
      for (const row of data || []) tracks.set(row.id, trackFromRow(row));
    }
    return tracks;
  }

  async function read(req, res) {
    const auth = await session(req, res);
    if (!auth) return null;
    let operation = 'journey_read';
    try {
      const { data, error } = await auth.db.from('journeys').select(JOURNEY_SELECT)
        .eq('user_id', auth.userId).is('deleted_at', null).order('created_at', { ascending: false });
      if (error) throw error;
      const rows = data || [];
      const ids = [...new Set(rows.flatMap((row) => (row.journey_tracks || []).map((item) => item.track_id).filter(Boolean)))];
      operation = 'track_lookup';
      const tracks = await loadTracks(auth.db, ids);
      return { userId: auth.userId, journeys: rows.map((row) => journeyFromRow(row, tracks)) };
    } catch (error) {
      fail(res, error, operation);
      return null;
    }
  }

  async function sources(db, ids) {
    if (!ids.length) return new Map();
    const rows = [];
    for (let offset = 0; offset < ids.length; offset += 100) {
      const { data, error } = await db.from('journeys').select(JOURNEY_SELECT)
        .in('id', ids.slice(offset, offset + 100)).is('deleted_at', null);
      if (error) throw error;
      rows.push(...(data || []));
    }
    const tracks = await loadTracks(db, [...new Set(rows.flatMap((row) => (row.journey_tracks || []).map((item) => item.track_id)))]);
    return new Map(rows.map((row) => [row.id, journeyFromRow(row, tracks)]));
  }

  return {
    read,
    sources,
    async privacy(req, res) {
      const auth = await session(req, res);
      if (!auth) return;
      const body = req.body || {};
      if (!UUID.test(req.params.id || '') || Object.keys(body).length !== 3
        || !['private', 'public'].includes(body.visibility) || !['private', 'public'].includes(body.expectedVisibility)
        || !Number.isSafeInteger(body.expectedShareVersion) || body.expectedShareVersion < 0) {
        return res.status(400).json({ success: false, error: 'Quyền hoặc phiên bản hành trình không hợp lệ.' });
      }
      try {
        const { data, error } = await auth.db.rpc('set_journey_privacy', {
          p_journey_id: req.params.id, p_actor_id: auth.userId,
          p_visibility: body.visibility === 'public', p_expected_visibility: body.expectedVisibility === 'public',
          p_expected_share_version: body.expectedShareVersion,
        });
        if (error) throw error;
        const result = data?.[0];
        if (result?.outcome === 'not_found') return res.status(404).json({ success: false, error: 'Không tìm thấy hành trình.' });
        if (result?.outcome === 'invalid_argument') return res.status(400).json({ success: false, error: 'Yêu cầu không hợp lệ.' });
        if (!['updated', 'unchanged', 'conflict'].includes(result?.outcome)
          || typeof result.is_public !== 'boolean' || !Number.isSafeInteger(result.share_version) || result.share_version < 0) throw { code: 'INVALID_RPC_RESULT' };
        const privacy = { is_public: result.is_public, share_version: result.share_version, updated_at: result.updated_at };
        if (result.outcome === 'conflict') return res.status(409).json({ success: false, code: 'JOURNEY_PRIVACY_CONFLICT',
          error: 'Quyền đã thay đổi ở phiên khác. Tải lại trước khi thử tiếp.', privacy });
        return res.json({ success: true, privacy });
      } catch (error) { return fail(res, error, 'journey_privacy'); }
    },
    async tracks(req, res) {
      if (!database) return res.status(503).json({ success: false, error: 'Chưa cấu hình kết nối database.' });
      try {
        const { data, error } = await database.from('tracks').select(TRACK_SELECT).is('deleted_at', null).order('id').limit(200);
        if (error) throw error;
        const tracks = (data || []).map(trackFromRow);
        return res.json({ success: true, data: tracks, count: tracks.length });
      } catch (error) { return fail(res, error, 'catalog_read'); }
    },

    async save(req, res, { forcePrivate = false } = {}) {
      const body = req.body || {};
      const { moodFrom, moodTo, activity, duration, stages } = body;
      if (!isMoodId(moodFrom?.id) || !isMoodId(moodTo?.id)
        || !['deep_work', 'meditation', 'workout', 'sleep'].includes(activity)
        || ![15, 30, 45, 60].includes(duration) || !Array.isArray(stages) || stages.length !== 4
        || stages.some((stage, index) => stage?.key !== STAGES[index][0]
          || !Array.isArray(stage.tracks) || stage.tracks.length < 1 || stage.tracks.length > 50
          || stage.tracks.some((track) => !UUID.test(track?.id || '')))
        || (body.title !== undefined && (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 200))) {
        return res.status(400).json({ success: false, error: 'Mood, hoạt động, thời lượng, giai đoạn hoặc ID bài hát không hợp lệ.' });
      }
      const auth = await session(req, res);
      if (!auth) return;
      let operation = 'track_lookup';
      try {
        const ids = [...new Set(stages.flatMap((stage) => stage.tracks.map((track) => track.id)))];
        const tracks = await loadTracks(auth.db, ids);
        if (ids.some((id) => !tracks.has(id))) {
          return res.status(400).json({ success: false, error: 'Bài hát không tồn tại hoặc đã bị xóa khỏi catalog.' });
        }
        operation = 'privacy_default_read';
        const profile = await auth.db.from('profiles').select('settings,deleted_at').eq('id', auth.userId).maybeSingle();
        if (profile.error) throw profile.error;
        if (profile.data?.deleted_at) throw { code: 'PROFILE_UNAVAILABLE' };
        const row = {
          id: require('crypto').randomUUID(), user_id: auth.userId,
          title: body.title?.trim() || `${moodFrom.label || moodFrom.id} ➔ ${moodTo.label || moodTo.id}`,
          mood_from: moodFrom.id, mood_to: moodTo.id, activity, duration_min: duration,
          is_public: !forcePrivate && profile.data?.settings?.privacy?.default_journey_visibility === 'public', share_version: 0,
        };
        operation = 'journey_insert';
        const { error } = await auth.db.from('journeys').insert(row);
        if (error) throw error;
        let position = 0;
        row.journey_tracks = stages.flatMap((stage) => stage.tracks.map((track) => ({
          journey_id: row.id, track_id: track.id, stage_key: stage.key, position: ++position,
        })));
        operation = 'journey_tracks_insert';
        try {
          const result = await auth.db.from('journey_tracks').insert(row.journey_tracks);
          if (result.error) throw result.error;
        } catch (childError) {
          let rolledBack = false;
          try {
            const rollback = await auth.db.from('journeys').delete().eq('id', row.id).eq('user_id', auth.userId).select('id');
            rolledBack = !rollback.error && rollback.data?.some((item) => item.id === row.id);
          } catch {}
          if (!rolledBack) {
            onDatabaseError({ operation: 'journey_rollback', dbCode: 'UNKNOWN', code: 'JOURNEY_SAVE_INCOMPLETE' });
            return res.status(503).json({ success: false, code: 'JOURNEY_SAVE_INCOMPLETE', error: 'Lưu chi tiết thất bại và chưa dọn được hành trình dở dang. Không tự gửi lại; cần kiểm tra dữ liệu.' });
          }
          throw childError;
        }
        return res.status(201).json({ success: true, storage: 'cloud', journey: journeyFromRow(row, tracks) });
      } catch (error) { return fail(res, error, operation); }
    },

    async list(req, res) {
      const result = await read(req, res);
      if (result) return res.json({ success: true, storage: 'cloud', data: result.journeys, count: result.journeys.length });
    },

    async remove(req, res) {
      if (!UUID.test(req.params.id)) return res.status(400).json({ success: false, error: 'ID hành trình không hợp lệ.' });
      const auth = await session(req, res);
      if (!auth) return;
      try {
        const { data, error } = await auth.db.from('journeys').update({ deleted_at: new Date().toISOString() })
          .eq('id', req.params.id).eq('user_id', auth.userId).is('deleted_at', null).select('id');
        if (error) throw error;
        if (!data?.length) return res.status(404).json({ success: false, error: 'Không tìm thấy hành trình thuộc tài khoản của bạn.' });
        return res.json({ success: true, storage: 'cloud' });
      } catch (error) { return fail(res, error, 'journey_remove'); }
    },
  };
}

module.exports = { createJourneyHandlers };
