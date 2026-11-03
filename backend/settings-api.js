const DEFAULTS = { moodFrom: 'deep_focus', moodTo: 'calm_unwind', activity: 'deep_work', duration: 30 };
const ACTIVITIES = new Set(['deep_work', 'meditation', 'workout', 'sleep']);
const DURATIONS = new Set([15, 30, 45, 60]);
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const exactKeys = (value, keys) => record(value) && Object.keys(value).length === keys.length
  && keys.every((key) => Object.hasOwn(value, key));

function createSettingsHandlers({ serverAuth, isMoodId,
  onError = (entry) => console.error('[SETTINGS_DB]', JSON.stringify(entry)) }) {
  async function session(req, res) {
    try {
      const token = /^Bearer (\S+)$/.exec(req.headers.authorization || '')?.[1];
      return await serverAuth.authenticate(token);
    } catch (error) {
      serverAuth.respondError(res, error, 'account_verify');
      return null;
    }
  }

  function fail(res, error, operation) {
    const dbCode = /^[A-Z0-9_]{1,40}$/.test(error?.code || '') ? error.code : 'UNKNOWN';
    onError({ operation, dbCode });
    return res.status(503).json({ success: false, code: 'SETTINGS_DB_UNAVAILABLE', operation, dbCode,
      error: 'Không thể lưu hoặc tải cài đặt từ database. Vui lòng kiểm tra quyền bảng và thử lại.' });
  }

  function conflict(res) {
    return res.status(409).json({ success: false, code: 'SETTINGS_CONFLICT',
      error: 'Cài đặt đã được thay đổi ở phiên khác. Tải lại trước khi lưu tiếp.' });
  }

  function validDefaults(value) {
    return exactKeys(value, ['moodFrom', 'moodTo', 'activity', 'duration'])
      && isMoodId(value.moodFrom) && isMoodId(value.moodTo)
      && ACTIVITIES.has(value.activity) && DURATIONS.has(value.duration);
  }

  function document(profile) {
    const stored = profile?.settings?.journey_defaults;
    const value = record(stored) ? { moodFrom: stored.mood_from, moodTo: stored.mood_to,
      activity: stored.activity, duration: stored.duration } : null;
    return { journeyDefaults: validDefaults(value) ? value : { ...DEFAULTS },
      privacy: { defaultJourneyVisibility: profile?.settings?.privacy?.default_journey_visibility === 'public' ? 'public' : 'private' },
      updatedAt: profile?.updated_at ?? null };
  }

  async function readProfile(database, userId) {
    const { data, error } = await database.from('profiles').select('settings,updated_at,deleted_at')
      .eq('id', userId).maybeSingle();
    if (error) throw error;
    if (data?.deleted_at || (data && !record(data.settings))) throw { code: 'PROFILE_UNAVAILABLE' };
    return data;
  }

  return {
    async me(req, res) {
      const auth = await session(req, res);
      if (auth) return res.json({ success: true, user: auth.user });
    },
    async rename(req, res) {
      const auth = await session(req, res);
      if (!auth) return;
      if (!exactKeys(req.body, ['displayName']) || typeof req.body.displayName !== 'string'
        || !req.body.displayName.trim() || req.body.displayName.trim().length > 100) {
        return res.status(400).json({ success: false, error: 'Tên hiển thị phải có từ 1 đến 100 ký tự.' });
      }
      try {
        const { data, error } = await auth.database.from('app_users').update({
          display_name: req.body.displayName.trim(), updated_at: new Date().toISOString(),
        }).eq('id', auth.user.id).select('id,email,display_name,role');
        if (error) throw error;
        if (data?.length !== 1) throw { code: 'ACCOUNT_UPDATE_NOT_CONFIRMED' };
        return res.json({ success: true, user: { id: data[0].id, email: data[0].email,
          displayName: data[0].display_name, role: data[0].role === 'admin' ? 'admin' : 'user' } });
      } catch (error) { return fail(res, error, 'account_rename'); }
    },
    async get(req, res) {
      const auth = await session(req, res);
      if (!auth) return;
      try {
        return res.json({ success: true, ...document(await readProfile(auth.database, auth.user.id)) });
      } catch (error) { return fail(res, error, 'settings_read'); }
    },
    async patch(req, res) {
      const auth = await session(req, res);
      if (!auth) return;
      const body = req.body;
      if (!record(body) || !Object.hasOwn(body, 'expectedUpdatedAt')
        || Object.keys(body).some((key) => !['journeyDefaults', 'privacy', 'expectedUpdatedAt'].includes(key))
        || (!Object.hasOwn(body, 'journeyDefaults') && !Object.hasOwn(body, 'privacy'))
        || (Object.hasOwn(body, 'journeyDefaults') && !validDefaults(body.journeyDefaults))
        || (Object.hasOwn(body, 'privacy') && (!exactKeys(body.privacy, ['defaultJourneyVisibility'])
          || !['private', 'public'].includes(body.privacy.defaultJourneyVisibility)))
        || !(body.expectedUpdatedAt === null || (typeof body.expectedUpdatedAt === 'string'
          && body.expectedUpdatedAt.length <= 50 && Number.isFinite(Date.parse(body.expectedUpdatedAt))))) {
        return res.status(400).json({ success: false, error: 'Cấu hình journey hoặc phiên bản cài đặt không hợp lệ.' });
      }
      try {
        const profile = await readProfile(auth.database, auth.user.id);
        if ((profile?.updated_at ?? null) !== body.expectedUpdatedAt) return conflict(res);
        const defaults = body.journeyDefaults;
        const settings = { ...(profile?.settings ?? { freq: 432, binaural: true, volume_binaural: 15 }) };
        if (defaults) settings.journey_defaults = { mood_from: defaults.moodFrom, mood_to: defaults.moodTo,
          activity: defaults.activity, duration: defaults.duration };
        if (body.privacy) settings.privacy = { ...(record(settings.privacy) ? settings.privacy : {}),
          default_journey_visibility: body.privacy.defaultJourneyVisibility };
        const updatedAt = new Date(Math.max(Date.now(), Date.parse(profile?.updated_at || '') + 1 || 0)).toISOString();
        let result;
        if (profile) {
          let query = auth.database.from('profiles').update({ settings, updated_at: updatedAt }).eq('id', auth.user.id);
          query = profile.updated_at === null ? query.is('updated_at', null) : query.eq('updated_at', profile.updated_at);
          result = await query.is('deleted_at', null).select('settings,updated_at');
        } else {
          result = await auth.database.from('profiles').insert({ id: auth.user.id,
            display_name: auth.user.displayName, settings, updated_at: updatedAt }).select('settings,updated_at');
        }
        if (result.error?.code === '23505') return conflict(res);
        if (result.error) throw result.error;
        if (result.data?.length !== 1) return conflict(res);
        return res.json({ success: true, ...document(result.data[0]) });
      } catch (error) { return fail(res, error, 'settings_write'); }
    },
  };
}

module.exports = { createSettingsHandlers };
