const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { createServerAuth } = require('../server-auth');
const { createSettingsHandlers } = require('../settings-api');

const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const secret = 'settings-unit-test-secret-not-used-outside-tests';
const defaults = { moodFrom: 'deep_focus', moodTo: 'calm_unwind', activity: 'deep_work', duration: 30 };
const timestamp = '2026-11-03T00:00:00.000Z';
const clone = (value) => structuredClone(value);

function fixture(profile) {
  const db = {
    rows: { app_users: [
      { id: owner, email: 'owner@example.test', display_name: 'Owner', role: 'user', password_hash: 'not-for-response' },
      { id: other, email: 'other@example.test', display_name: 'Other', role: 'admin' },
    ], profiles: profile ? [clone(profile)] : [] },
    calls: [], faults: [],
    from(table) { return new Query(this, table); },
  };
  const auth = createServerAuth({ database: db, jwtSecret: secret,
    verifyJWT: (token, key) => jwt.verify(token, key), onError() {},
  });
  const api = createSettingsHandlers({ serverAuth: auth, isMoodId: (id) => [
    'deep_focus', 'calm_unwind', 'energy_boost', 'heartbreak_healing',
    'creative_spark', 'melancholy_chill', 'euphoric_bliss', 'night_serenade',
  ].includes(id), onError() {} });
  const token = jwt.sign({ id: owner, name: 'Stale name', role: 'admin' }, secret);
  return { db, api, token };
}

class Query {
  constructor(db, table) { this.db = db; this.table = table; this.action = 'select'; this.filters = []; }
  select() { return this; }
  eq(key, value) { this.filters.push((row) => row[key] === value); return this; }
  is(key, value) { this.filters.push((row) => (row[key] ?? null) === value); return this; }
  maybeSingle() { this.single = true; return this; }
  insert(value) { this.action = 'insert'; this.value = clone(value); return this; }
  update(value) { this.action = 'update'; this.value = clone(value); return this; }
  then(resolve, reject) { return Promise.resolve().then(() => this.execute()).then(resolve, reject); }
  execute() {
    this.db.calls.push({ table: this.table, action: this.action, value: this.value });
    const fault = this.db.faults.find((item) => item.table === this.table && item.action === this.action && !item.used);
    if (fault) {
      fault.used = true;
      if (fault.reject) throw new Error('Mock transport error');
      return fault.empty ? { data: [], error: null } : { data: null, error: { code: fault.code || '42501', message: 'private DB details' } };
    }
    const rows = this.db.rows[this.table];
    if (this.action === 'insert') {
      if (rows.some((row) => row.id === this.value.id)) return { error: { code: '23505' } };
      if (!this.db.rows.app_users.some((user) => user.id === this.value.id)) return { error: { code: '23503' } };
      rows.push({ deleted_at: null, ...this.value });
      return { data: [clone(this.value)], error: null };
    }
    const matches = rows.filter((row) => this.filters.every((filter) => filter(row)));
    if (this.action === 'update') matches.forEach((row) => Object.assign(row, this.value));
    return { data: this.single ? clone(matches[0] || null) : clone(matches), error: null };
  }
}

async function call(fixture, handler, body, token = fixture.token) {
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
  await fixture.api[handler]({ body, headers: token ? { authorization: `Bearer ${token}` } : {}, query: { userId: other } }, response);
  return response;
}
const profile = (settings = {}) => ({ id: owner, display_name: 'Legacy profile name', settings,
  updated_at: timestamp, deleted_at: null });
const patch = (journeyDefaults = defaults, expectedUpdatedAt = null) => ({ journeyDefaults, expectedUpdatedAt });

test('privacy defaults read private without writing for absent, invalid or unrelated legacy keys', async () => {
  for (const stored of [undefined, {}, { privacy: null }, { privacy: { default_journey_visibility: 'invalid' } },
    { journey_defaults: { is_public: true } }]) {
    const f = fixture(stored === undefined ? undefined : profile(stored));
    assert.deepEqual((await call(f, 'get')).body.privacy, { defaultJourneyVisibility: 'private' });
    assert.ok(f.db.calls.every((item) => item.action === 'select'));
  }
});

test('privacy-only PATCH preserves journey/audio/unknown JSON and updates one canonical namespace', async () => {
  const settings = { freq: 528, journey_defaults: { mood_from: 'energy_boost', custom: true },
    privacy: { future_key: 1 }, unrelated: { a: 1 } };
  const f = fixture(profile(settings));
  const response = await call(f, 'patch', { privacy: { defaultJourneyVisibility: 'public' }, expectedUpdatedAt: timestamp });
  assert.equal(response.statusCode, 200);
  const saved = f.db.rows.profiles[0].settings;
  assert.deepEqual(saved.journey_defaults, settings.journey_defaults);
  assert.equal(saved.freq, 528); assert.deepEqual(saved.unrelated, { a: 1 });
  assert.deepEqual(saved.privacy, { future_key: 1, default_journey_visibility: 'public' });
  assert.equal(response.body.privacy.defaultJourneyVisibility, 'public');
});

test('old journeyDefaults PATCH preserves privacy and combined PATCH updates both groups', async () => {
  const f = fixture(profile({ privacy: { default_journey_visibility: 'public' } }));
  const first = await call(f, 'patch', patch(defaults, timestamp));
  assert.equal(first.body.privacy.defaultJourneyVisibility, 'public');
  const second = await call(f, 'patch', { journeyDefaults: { ...defaults, duration: 45 },
    privacy: { defaultJourneyVisibility: 'private' }, expectedUpdatedAt: first.body.updatedAt });
  assert.equal(second.statusCode, 200);
  assert.equal(second.body.journeyDefaults.duration, 45);
  assert.equal(second.body.privacy.defaultJourneyVisibility, 'private');
});

test('privacy validation rejects unknown keys, wrong labels, empty groups and missing version', async () => {
  const f = fixture();
  for (const body of [
    { expectedUpdatedAt: null }, { privacy: {}, expectedUpdatedAt: null },
    { privacy: { defaultJourneyVisibility: 'Công khai' }, expectedUpdatedAt: null },
    { privacy: { defaultJourneyVisibility: 'public', is_public: true }, expectedUpdatedAt: null },
    { privacy: { defaultJourneyVisibility: 'public' } },
    { journeyDefaults: { ...defaults, is_public: true }, expectedUpdatedAt: null },
  ]) assert.equal((await call(f, 'patch', body)).statusCode, 400);
  assert.equal(f.db.rows.profiles.length, 0);
});

test('privacy writes retain CAS including raw microsecond timestamp and first insert race', async () => {
  const stored = profile({ privacy: { default_journey_visibility: 'private' } });
  stored.updated_at = '2026-11-03T00:00:00.123456+00:00';
  const f = fixture(stored);
  const body = { privacy: { defaultJourneyVisibility: 'public' }, expectedUpdatedAt: stored.updated_at };
  const responses = await Promise.all([call(f, 'patch', body), call(f, 'patch', body)]);
  assert.deepEqual(responses.map((item) => item.statusCode).sort(), [200, 409]);
  const first = fixture();
  const initial = { ...body, expectedUpdatedAt: null };
  assert.deepEqual((await Promise.all([call(first, 'patch', initial), call(first, 'patch', initial)]))
    .map((item) => item.statusCode).sort(), [200, 409]);
});

test('settings and profile endpoints reject missing, invalid and expired JWT', async () => {
  const f = fixture();
  const expired = jwt.sign({ id: owner }, secret, { expiresIn: -1 });
  for (const token of [null, 'bad-token', expired]) for (const handler of ['me', 'rename', 'get', 'patch']) {
    assert.equal((await call(f, handler, {}, token)).statusCode, 401);
  }
  assert.equal(f.db.calls.length, 0);
});

test('me returns current cloud name and role, without the password hash or stale claims', async () => {
  const f = fixture();
  const response = await call(f, 'me');
  assert.equal(response.body.user.displayName, 'Owner');
  assert.equal(response.body.user.role, 'user');
  assert.equal(response.body.user.id, owner);
  assert.ok(!JSON.stringify(response.body).includes('not-for-response'));
});

test('rename changes only the verified account and me sees the new name with the old token', async () => {
  const f = fixture(profile());
  const response = await call(f, 'rename', { displayName: '  New name  ' });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.user.displayName, 'New name');
  assert.equal(f.db.rows.app_users[1].display_name, 'Other');
  assert.equal(f.db.rows.profiles[0].display_name, 'Legacy profile name');
  assert.equal((await call(f, 'me')).body.user.displayName, 'New name');
});

test('rename rejects empty, long, non-string and privileged fields', async () => {
  const f = fixture();
  for (const body of [{ displayName: ' ' }, { displayName: 'x'.repeat(101) }, { displayName: 7 },
    { displayName: 'New', role: 'admin' }, { displayName: 'New', user_id: other },
    { displayName: 'New', email: 'other@example.test' }, null]) {
    assert.equal((await call(f, 'rename', body)).statusCode, 400);
  }
  assert.equal(f.db.rows.app_users[0].display_name, 'Owner');
});

test('rename does not report success if update fails or affects no rows', async () => {
  for (const fault of [{}, { empty: true }]) {
    const f = fixture();
    f.db.faults.push({ table: 'app_users', action: 'update', ...fault });
    assert.equal((await call(f, 'rename', { displayName: 'New' })).statusCode, 503);
    assert.equal(f.db.rows.app_users[0].display_name, 'Owner');
  }
});

test('missing profile returns defaults without inserting a row', async () => {
  const f = fixture();
  const response = await call(f, 'get');
  assert.deepEqual(response.body.journeyDefaults, defaults);
  assert.equal(response.body.updatedAt, null);
  assert.equal(f.db.rows.profiles.length, 0);
  assert.ok(f.db.calls.every((query) => query.action === 'select'));
});

test('first save creates the right profile and preserves default audio keys', async () => {
  const f = fixture();
  const choice = { ...defaults, activity: 'meditation', duration: 45 };
  const response = await call(f, 'patch', patch(choice));
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.journeyDefaults, choice);
  assert.equal(f.db.rows.profiles[0].id, owner);
  assert.equal(f.db.rows.profiles[0].display_name, 'Owner');
  assert.equal(f.db.rows.profiles[0].settings.freq, 432);
  assert.equal(f.db.rows.profiles[0].settings.binaural, true);
  assert.equal(f.db.rows.profiles[0].settings.volume_binaural, 15);
  assert.deepEqual((await call(f, 'get')).body.journeyDefaults, choice);
});

test('save and reset merge only journey_defaults and keep unknown JSON values', async () => {
  const preserved = { freq: 528, binaural: false, volume_binaural: 0, unknown: { nested: [1, 2] } };
  const f = fixture(profile(preserved));
  const saved = await call(f, 'patch', patch({ ...defaults, duration: 15 }, timestamp));
  const reset = await call(f, 'patch', patch(defaults, saved.body.updatedAt));
  assert.equal(reset.statusCode, 200);
  for (const key of Object.keys(preserved)) assert.deepEqual(f.db.rows.profiles[0].settings[key], preserved[key]);
  assert.deepEqual((await call(f, 'get')).body.journeyDefaults, defaults);
});

test('legacy invalid journey defaults read as canonical defaults without overwriting other JSON', async () => {
  const f = fixture(profile({ journey_defaults: { duration: 20 }, untouched: false }));
  const response = await call(f, 'get');
  assert.deepEqual(response.body.journeyDefaults, defaults);
  assert.equal(f.db.rows.profiles[0].settings.journey_defaults.duration, 20);
  assert.equal(f.db.rows.profiles[0].settings.untouched, false);
});

test('settings validation rejects bad selections, extra fields and wrong versions', async () => {
  const f = fixture();
  for (const body of [patch({ ...defaults, moodFrom: 'bad' }), patch({ ...defaults, moodTo: 'bad' }),
    patch({ ...defaults, duration: 20 }), patch({ ...defaults, activity: 'bad' }),
    patch({ ...defaults, injected: true }), { ...patch(), userId: other },
    patch(defaults, 'not-a-timestamp'), { journeyDefaults: defaults }, null]) {
    assert.equal((await call(f, 'patch', body)).statusCode, 400);
  }
  assert.equal(f.db.rows.profiles.length, 0);
});

test('stale settings version returns conflict without updating JSON', async () => {
  const f = fixture(profile({ keep: 1 }));
  const response = await call(f, 'patch', patch(defaults));
  assert.equal(response.statusCode, 409);
  assert.equal(response.body.code, 'SETTINGS_CONFLICT');
  assert.deepEqual(f.db.rows.profiles[0].settings, { keep: 1 });
});

test('two first saves cannot overwrite each other', async () => {
  const f = fixture();
  const responses = await Promise.all([call(f, 'patch', patch()), call(f, 'patch', patch({ ...defaults, duration: 45 }))]);
  assert.deepEqual(responses.map((result) => result.statusCode).sort(), [200, 409]);
  assert.equal(f.db.rows.profiles.length, 1);
});

test('concurrent updates with the same version allow exactly one writer', async () => {
  const f = fixture(profile({ keep: true }));
  const responses = await Promise.all([call(f, 'patch', patch({ ...defaults, duration: 15 }, timestamp)),
    call(f, 'patch', patch({ ...defaults, duration: 45 }, timestamp))]);
  assert.deepEqual(responses.map((result) => result.statusCode).sort(), [200, 409]);
  assert.equal(f.db.rows.profiles[0].settings.keep, true);
});

test('existing profile with null timestamp uses a null comparison', async () => {
  const f = fixture({ ...profile({ keep: true }), updated_at: null });
  const response = await call(f, 'patch', patch());
  assert.equal(response.statusCode, 200);
  assert.ok(response.body.updatedAt);
  assert.equal(f.db.rows.profiles[0].settings.keep, true);
});

test('settings endpoints cannot read or modify another account by query or body ID', async () => {
  const f = fixture({ ...profile({ private: 'other-only' }), id: other });
  const response = await call(f, 'get');
  assert.deepEqual(response.body.journeyDefaults, defaults);
  assert.ok(!JSON.stringify(response.body).includes('other-only'));
  assert.equal((await call(f, 'patch', { ...patch(), id: other })).statusCode, 400);
  assert.equal(f.db.rows.profiles[0].settings.private, 'other-only');
});

test('deleted accounts cannot use a valid old token to access settings', async () => {
  const f = fixture();
  f.db.rows.app_users = [];
  assert.equal((await call(f, 'get')).statusCode, 401);
  assert.equal(f.db.rows.profiles.length, 0);
});

test('read and write failures never claim settings were saved', async () => {
  for (const [action, handler, body] of [['select', 'get', undefined], ['insert', 'patch', patch()]]) {
    const f = fixture();
    f.db.faults.push({ table: 'profiles', action });
    const response = await call(f, handler, body);
    assert.equal(response.statusCode, 503);
    assert.equal(response.body.success, false);
    assert.ok(!JSON.stringify(response.body).includes('private DB details'));
  }
  const f = fixture(profile());
  f.db.faults.push({ table: 'profiles', action: 'update' });
  assert.equal((await call(f, 'patch', patch(defaults, timestamp))).statusCode, 503);
});

test('archived profiles and invalid JSON roots are not silently replaced', async () => {
  for (const value of [{ ...profile({ keep: true }), deleted_at: timestamp }, profile([])]) {
    const f = fixture(value);
    assert.equal((await call(f, 'patch', patch(defaults, timestamp))).statusCode, 503);
    assert.deepEqual(f.db.rows.profiles[0], value);
  }
});
