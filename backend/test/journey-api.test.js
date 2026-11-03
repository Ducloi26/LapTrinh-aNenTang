const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('../../frontend/node_modules/typescript');
const { createJourneyHandlers } = require('../journey-api');
const { createServerAuth } = require('../server-auth');
const jwt = require('jsonwebtoken');

const root = path.resolve(__dirname, '../..');
const schema = fs.readFileSync(path.join(root, 'DB_SCHEMA_THAT.md'), 'utf8');
const columns = {};
for (const match of schema.matchAll(/CREATE TABLE public\.(\w+) \(\r?\n([\s\S]*?)\r?\n\);/g)) {
  columns[match[1]] = new Set(match[2].split(/\r?\n/).map((line) => line.trim())
    .filter((line) => line && !line.startsWith('CONSTRAINT')).map((line) => line.split(/\s+/)[0]));
}
const modules = {};
function loadModule(relative, mocks = {}) {
  if (modules[relative] && !Object.keys(mocks).length) return modules[relative];
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, {
    exports, console, AbortController, setTimeout, clearTimeout,
    ...mocks.globals,
    require: (name) => {
      if (name in mocks) return mocks[name];
      if (name === '@/constants/moodflow') return loadModule('frontend/constants/moodflow.ts');
      if (name === './journey-generator') return loadModule('frontend/services/journey-generator.ts');
      if (name === './api-client') return loadModule('frontend/services/api-client.ts', mocks);
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  if (!Object.keys(mocks).length) modules[relative] = exports;
  return exports;
}
const constants = loadModule('frontend/constants/moodflow.ts');
const generator = loadModule('frontend/services/journey-generator.ts');
const parser = loadModule('frontend/services/ai-prompt-parser.ts');
const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const unlinked = '33333333-3333-4333-8333-333333333333';

function database() {
  const db = {
    rows: { profiles: [], journeys: [], journey_tracks: [], tracks: [0, 1, 2, 3].map((index) => ({
      id: `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa${index}`,
      title: `DB track ${index}`, genre: 'Ambient', duration_sec: 245,
      cover_url: 'https://example.test/cover', audio_url: 'https://example.test/audio',
      deleted_at: null, artists: { name: 'DB artist' },
      track_features: { bpm: 65 + index, energy: 20 + index * 20, valence: 55 },
    })) },
    calls: [], faults: [],
    from(table) { return new Query(this, table); },
  };
  return db;
}

class Query {
  constructor(db, table) { this.db = db; this.table = table; this.operation = 'select'; this.filters = []; }
  select(value) { this.fields = value; return this; }
  insert(rows) { this.operation = 'insert'; this.payload = rows; return this; }
  update(value) { this.operation = 'update'; this.payload = value; return this; }
  delete() { this.operation = 'delete'; return this; }
  eq(key, value) { this.filters.push((row) => row[key] === value); return this; }
  is(key, value) { this.filters.push((row) => (row[key] ?? null) === value); return this; }
  in(key, values) { this.filters.push((row) => values.includes(row[key])); return this; }
  order(key, options = {}) { this.sort = [key, options.ascending !== false]; return this; }
  limit(value) { this.max = value; return this; }
  single() { this.singleResult = true; return this; }
  maybeSingle() { this.singleResult = true; return this; }
  then(resolve, reject) { return Promise.resolve().then(() => this.execute()).then(resolve, reject); }
  execute() {
    const { db, table, operation } = this;
    db.calls.push({ table, operation, payload: this.payload });
    const fault = db.faults.find((item) => item.table === table && item.operation === operation && !item.used);
    if (fault) {
      fault.used = true;
      if (fault.reject) throw new Error('Mock network error');
      if (fault.empty) return { data: [], error: null };
      return { error: fault.error || { code: 'MOCK_FAILURE' }, data: null, status: fault.status };
    }
    const rows = db.rows[table];
    if (!rows) throw new Error(`Unexpected table ${table}`);
    if (operation === 'insert') {
      const additions = Array.isArray(this.payload) ? this.payload : [this.payload];
      for (const row of additions) {
        if (Object.keys(row).some((key) => !columns[table].has(key))) return { error: { code: 'UNKNOWN_COLUMN' } };
        if (table === 'journeys' && ![owner, other].includes(row.user_id)) return { error: { code: '23503', message: 'journeys_user_id_fkey' } };
        if (table === 'journey_tracks') {
          if (!db.rows.journeys.some((parent) => parent.id === row.journey_id)
            || !db.rows.tracks.some((track) => track.id === row.track_id)) return { error: { code: '23503' } };
        }
      }
      if (table === 'journey_tracks') {
        const keys = [...rows, ...additions].map((row) => `${row.journey_id}:${row.position}`);
        if (new Set(keys).size !== keys.length) return { error: { code: '23505' } };
      }
      rows.push(...additions.map((row) => ({ ...row, ...(table === 'journeys' ? { deleted_at: null, created_at: '2026-11-02T00:00:00Z' } : {}) })));
      return { error: null, data: this.singleResult ? { ...additions[0] } : null };
    }
    let selected = rows.filter((row) => this.filters.every((filter) => filter(row)));
    if (operation === 'delete') {
      if (table === 'journeys' && selected.some((row) => db.rows.journey_tracks.some((track) => track.journey_id === row.id))) return { error: { code: '23503' } };
      db.rows[table] = rows.filter((row) => !selected.includes(row));
    }
    if (operation === 'update') selected.forEach((row) => Object.assign(row, this.payload));
    if (this.sort) {
      const [key, ascending] = this.sort;
      selected.sort((a, b) => String(a[key]).localeCompare(String(b[key])) * (ascending ? 1 : -1));
    }
    if (this.max) selected = selected.slice(0, this.max);
    const data = selected.map((row) => ({ ...row, ...(table === 'journeys' && this.fields?.includes('journey_tracks(')
      ? { journey_tracks: db.rows.journey_tracks.filter((track) => track.journey_id === row.id) } : {}) }));
    return { data: this.singleResult ? data[0] || null : data, error: null };
  }
}

function setup(db = database()) {
  let scoped = false;
  const api = createJourneyHandlers({ database: db,
    verifyToken(token) {
      const id = { owner, other, unlinked }[token];
      if (!id) throw new Error('Invalid JWT');
      return { id };
    },
    async verifySupabaseToken(token) { if (token === 'supabase') return { id: owner }; throw new Error('Invalid Supabase token'); },
    databaseForToken() { scoped = true; return db; },
    isMoodId: constants.isMoodId,
    onDatabaseError() {},
  });
  return { db, api, scoped: () => scoped };
}
async function call(api, method, body, token = 'owner', params = {}) {
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
  await api[method]({ body, params, headers: token ? { authorization: `Bearer ${token}` } : {}, query: { userId: other } }, response);
  return response;
}
async function payload(api, duration = 15, activity = 'meditation') {
  const catalog = await call(api, 'tracks');
  const journey = generator.generateJourney({ moodFrom: constants.MOODS[0], moodTo: constants.MOODS[1], activity, duration, tracks: catalog.body.data });
  return { moodFrom: journey.moodFrom, moodTo: journey.moodTo, activity, duration, stages: journey.stages, userId: other };
}

test('new journey uses only privacy defaults; existing journeys are unaffected by later settings changes', async () => {
  const f = setup();
  f.db.rows.profiles = [{ id: owner, settings: { journey_defaults: { is_public: true } } }];
  const input = await payload(f.api);
  const first = await call(f.api, 'save', { ...input, is_public: true, share_version: 999 });
  assert.equal(first.body.journey.is_public, false); assert.equal(first.body.journey.share_version, 0);
  f.db.rows.profiles[0].settings.privacy = { default_journey_visibility: 'public' };
  assert.equal((await call(f.api, 'save', input)).body.journey.is_public, true);
  assert.equal(f.db.rows.journeys[0].is_public, false);
});

test('default lookup DB failure stops save; missing profile and invalid privacy default to private', async () => {
  const f = setup(); const input = await payload(f.api);
  f.db.faults.push({ table: 'profiles', operation: 'select', error: { code: '42501' } });
  const failed = await call(f.api, 'save', input);
  assert.equal(failed.statusCode, 503); assert.equal(failed.body.operation, 'privacy_default_read');
  assert.equal(f.db.rows.journeys.length, 0);
  assert.equal((await call(f.api, 'save', input)).body.journey.is_public, false);
  f.db.rows.profiles = [{ id: owner, settings: { privacy: { default_journey_visibility: 'typo' } } }];
  assert.equal((await call(f.api, 'save', input)).body.journey.is_public, false);
});

test('privacy RPC receives verified actor and exact CAS input; maps outcomes without leaking another owner', async () => {
  const f = setup();
  const params = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9' };
  const body = { visibility: 'private', expectedVisibility: 'public', expectedShareVersion: 4 };
  let result = { outcome: 'updated', is_public: false, share_version: 5, updated_at: '2026-11-03T00:00:00.123456+00:00' };
  let rpcCall;
  f.db.rpc = async (name, args) => { rpcCall = { name, args }; return { data: [result] }; };
  let response = await call(f.api, 'privacy', body, 'owner', params);
  assert.equal(response.statusCode, 200); assert.equal(response.body.privacy.share_version, 5);
  assert.equal(rpcCall.args.p_actor_id, owner); assert.equal(rpcCall.args.p_expected_share_version, 4);
  assert.equal(rpcCall.args.p_expected_visibility, true); assert.equal(rpcCall.args.p_visibility, false);
  for (const [outcome, status] of [['unchanged', 200], ['conflict', 409], ['not_found', 404], ['invalid_argument', 400]]) {
    result = { ...result, outcome };
    response = await call(f.api, 'privacy', body, 'owner', params);
    assert.equal(response.statusCode, status);
    if (status === 404) assert.ok(!Object.hasOwn(response.body, 'privacy'));
  }
  f.db.rpc = async () => ({ error: { code: '42501' } });
  assert.equal((await call(f.api, 'privacy', body, 'owner', params)).statusCode, 503);
});

test('privacy rejects unauthenticated, malformed or caller-selected actor/version before RPC', async () => {
  const f = setup(); let calls = 0;
  f.db.rpc = async () => { calls++; return {}; };
  const valid = { visibility: 'public', expectedVisibility: 'private', expectedShareVersion: 0 };
  assert.equal((await call(f.api, 'privacy', valid, 'bad', { id: owner })).statusCode, 401);
  for (const body of [{ ...valid, userId: other }, { ...valid, expectedShareVersion: -1 },
    { ...valid, expectedShareVersion: '0' }, { ...valid, expectedVisibility: null },
    { ...valid, visibility: true }, { visibility: 'public' }]) {
    assert.equal((await call(f.api, 'privacy', body, 'owner', { id: owner })).statusCode, 400);
  }
  assert.equal(calls, 0);
});

test('batch source reads omit deleted journeys and resolve tracks from DB', async () => {
  const f = setup();
  const saved = await call(f.api, 'save', await payload(f.api));
  const id = saved.body.journey.id;
  const sources = await f.api.sources(f.db, [id]);
  assert.equal(sources.get(id).user_id, owner); assert.equal(sources.get(id).share_version, 0);
  await call(f.api, 'remove', {}, 'owner', { id });
  assert.equal((await f.api.sources(f.db, [id])).size, 0);
});

for (const duration of [15, 30, 45, 60]) for (const activity of constants.ACTIVITIES) {
  test(`cloud roundtrip ${duration} minutes / ${activity.id}`, async () => {
    const { db, api } = setup();
    const input = await payload(api, duration, activity.id);
    input.stages[0].tracks[0].title = 'Untrusted client title';
    const saved = await call(api, 'save', input);
    assert.equal(saved.statusCode, 201);
    assert.equal(saved.body.storage, 'cloud');
    assert.equal(db.rows.journeys[0].duration_min, duration);
    assert.equal(db.rows.journeys[0].user_id, owner);
    assert.ok(!('duration_minutes' in db.rows.journeys[0]));
    assert.equal(new Set(db.rows.journey_tracks.map((row) => row.position)).size, db.rows.journey_tracks.length);
    assert.ok(db.rows.journey_tracks.every((row) => columns.journey_tracks.has('stage_key') && row.track_id));
    const listed = await call(api, 'list');
    assert.equal(listed.body.count, 1);
    const journey = listed.body.data[0];
    assert.equal(journey.duration_minutes, duration);
    assert.equal(journey.activity, activity.id);
    assert.equal(journey.stages[0].startMin, 0);
    assert.equal(journey.stages[3].endMin, duration);
    assert.equal(journey.stages[0].tracks[0].title.startsWith('DB track'), true);
    assert.equal(journey.stages[0].tracks[0].audioUrl, 'https://example.test/audio');
    const hydrated = loadModule('frontend/services/journey-service.ts', serviceMocks()).restoreJourney(journey);
    assert.equal(hydrated.totalMin, duration);
    assert.equal(hydrated.id, saved.body.journey.id);
    assert.equal(hydrated.saveStatus, 'saved');
    assert.equal(hydrated.stages[0].subtitle, constants.JOURNEY_4_STAGES[0].subtitle);
    assert.equal((await call(api, 'list', undefined, 'other')).body.count, 0);
    assert.equal((await call(api, 'remove', undefined, 'other', { id: journey.id })).statusCode, 404);
    assert.equal((await call(api, 'remove', undefined, 'owner', { id: journey.id })).statusCode, 200);
    assert.equal((await call(api, 'list')).body.count, 0);
    assert.ok(db.rows.journeys[0].deleted_at);
    assert.ok(db.rows.journey_tracks.length > 0);
  });
}

function serviceMocks(fetcher = async () => { throw new Error('Unexpected network'); }, platform = 'web', token = 'owner') {
  return {
    '@react-native-async-storage/async-storage': { default: { getItem: async () => token } },
    'react-native': { Platform: { OS: platform } },
    '@/lib/supabase': { supabase: { auth: { getSession: async () => ({ data: { session: token ? { access_token: token } : null } }) } } },
    globals: { fetch: fetcher, localStorage: { getItem: () => token } },
  };
}

test('validation rejects malformed tracks and demo IDs before DB calls', async () => {
  const { db, api } = setup();
  const input = await payload(api);
  for (const tracks of [{}, null, [], [null], [{ id: 'fake' }]]) {
    const response = await call(api, 'save', { ...input, stages: input.stages.map((stage, index) => index ? stage : { ...stage, tracks }) });
    assert.equal(response.statusCode, 400);
  }
  for (const bad of [{ duration: 20 }, { activity: 'bad' }, { moodFrom: { id: 'bad' } }, { stages: input.stages.slice(0, 3) }]) {
    assert.equal((await call(api, 'save', { ...input, ...bad })).statusCode, 400);
  }
  assert.equal(db.rows.journeys.length, 0);
});

test('missing, invalid or expired token cannot list/save/delete', async () => {
  const { db, api } = setup();
  const input = await payload(api);
  for (const token of [null, 'invalid', 'expired']) for (const method of ['save', 'list', 'remove']) {
    assert.equal((await call(api, method, input, token, { id: owner })).statusCode, 401);
  }
  assert.equal(db.rows.journeys.length, 0);
});

test('legacy Supabase session cannot use the privileged Express journey API', async () => {
  const fixture = setup();
  const response = await call(fixture.api, 'save', await payload(fixture.api), 'supabase');
  assert.equal(response.statusCode, 401);
  assert.equal(fixture.scoped(), false);
});

test('unlinked Express identity returns explicit 409; never saves anonymously', async () => {
  const { db, api } = setup();
  const response = await call(api, 'save', await payload(api), 'unlinked');
  assert.equal(response.statusCode, 409);
  assert.equal(response.body.code, 'AUTH_ID_NOT_LINKED');
  assert.equal(db.rows.journeys.length, 0);
  assert.equal(db.rows.journey_tracks.length, 0);
});

test('unknown or deleted track rejects save', async () => {
  const { db, api } = setup();
  const input = await payload(api);
  db.rows.tracks.forEach((track) => { track.deleted_at = '2026-11-02'; });
  assert.equal((await call(api, 'save', input)).statusCode, 400);
  assert.equal(db.rows.journeys.length, 0);
});

test('readback warns about deleted tracks instead of inventing replacements', async () => {
  const { db, api } = setup();
  const saved = await call(api, 'save', await payload(api));
  const removed = saved.body.journey.stages[0].tracks[0].id;
  db.rows.tracks.find((track) => track.id === removed).deleted_at = '2026-11-02';
  const listed = await call(api, 'list');
  const journey = listed.body.data[0];
  assert.ok(journey.unavailable_track_count > 0);
  assert.ok(journey.stages.every((stage) => stage.tracks.every((track) => track.id !== removed)));
  assert.match(loadModule('frontend/services/journey-service.ts', serviceMocks()).restoreJourney(journey).saveError, /không còn khả dụng/);
});

test('cloud configuration and catalog failures are explicit', async () => {
  const missing = setup(null).api;
  assert.equal((await call(missing, 'tracks')).statusCode, 503);
  assert.equal((await call(missing, 'list')).statusCode, 503);
  const { db, api } = setup();
  db.faults.push({ table: 'tracks', operation: 'select' });
  assert.equal((await call(api, 'tracks')).statusCode, 503);
});

test('readback restores stage order from shuffled database details', async () => {
  const { db, api } = setup();
  const saved = await call(api, 'save', await payload(api, 60));
  db.rows.journey_tracks.reverse();
  const listed = await call(api, 'list');
  assert.equal(JSON.stringify(listed.body.data[0].stages.map((stage) => stage.tracks.map((track) => track.id))),
    JSON.stringify(saved.body.journey.stages.map((stage) => stage.tracks.map((track) => track.id))));
});

test('cloud parent failure does not report success or insert children', async () => {
  const { db, api } = setup();
  const input = await payload(api);
  db.faults.push({ table: 'journeys', operation: 'insert' });
  const response = await call(api, 'save', input);
  assert.equal(response.statusCode, 503);
  assert.equal(response.body.success, false);
  assert.equal(db.rows.journey_tracks.length, 0);
});

test('server RLS denial returns service unavailable and identifies the failed operation', async () => {
  const { db, api } = setup();
  const input = await payload(api);
  db.faults.push({ table: 'journeys', operation: 'insert', error: { code: '42501', message: 'sensitive DB details' } });
  const response = await call(api, 'save', input);
  assert.equal(response.statusCode, 503);
  assert.equal(response.body.code, 'DB_PERMISSION_DENIED');
  assert.equal(response.body.operation, 'journey_insert');
  assert.equal(response.body.dbCode, '42501');
  assert.ok(!JSON.stringify(response.body).includes('sensitive DB details'));
});

test('live schema mismatch is distinguished from a connection failure', async () => {
  const { db, api } = setup();
  const input = await payload(api);
  db.faults.push({ table: 'journeys', operation: 'insert', error: { code: 'PGRST204' } });
  const response = await call(api, 'save', input);
  assert.equal(response.statusCode, 503);
  assert.equal(response.body.code, 'DB_SCHEMA_MISMATCH');
  assert.equal(response.body.operation, 'journey_insert');
});

test('track lookup failure is not mistaken for a journey insert failure', async () => {
  const { db, api } = setup();
  const input = await payload(api);
  db.faults.push({ table: 'tracks', operation: 'select', error: { code: '42501' } });
  const response = await call(api, 'save', input);
  assert.equal(response.body.operation, 'track_lookup');
  assert.equal(response.body.code, 'DB_PERMISSION_DENIED');
  assert.equal(db.rows.journeys.length, 0);
});

test('child insert failure rolls back the parent', async () => {
  const { db, api } = setup();
  const input = await payload(api);
  db.faults.push({ table: 'journey_tracks', operation: 'insert' });
  assert.equal((await call(api, 'save', input)).statusCode, 503);
  assert.equal(db.rows.journeys.length, 0);
  assert.equal(db.rows.journey_tracks.length, 0);
});

test('child network rejection also rolls back the parent', async () => {
  const { db, api } = setup();
  const input = await payload(api);
  db.faults.push({ table: 'journey_tracks', operation: 'insert', reject: true });
  assert.equal((await call(api, 'save', input)).statusCode, 503);
  assert.equal(db.rows.journeys.length, 0);
});

test('rollback failure is explicit and never reported as saved', async () => {
  const { db, api } = setup();
  const input = await payload(api);
  db.faults.push({ table: 'journey_tracks', operation: 'insert' }, { table: 'journeys', operation: 'delete' });
  const response = await call(api, 'save', input);
  assert.equal(response.statusCode, 503);
  assert.equal(response.body.code, 'JOURNEY_SAVE_INCOMPLETE');
});

test('rollback with no affected row is not considered successful', async () => {
  const { db, api } = setup();
  const input = await payload(api);
  db.faults.push({ table: 'journey_tracks', operation: 'insert' }, { table: 'journeys', operation: 'delete', empty: true });
  const response = await call(api, 'save', input);
  assert.equal(response.body.code, 'JOURNEY_SAVE_INCOMPLETE');
  assert.equal(db.rows.journeys.length, 1);
});

test('cloud list and delete failures return errors', async () => {
  const { db, api } = setup();
  db.faults.push({ table: 'journeys', operation: 'select' }, { table: 'journeys', operation: 'update' });
  assert.equal((await call(api, 'list')).statusCode, 503);
  assert.equal((await call(api, 'remove', undefined, 'owner', { id: owner })).statusCode, 503);
});

test('catalog uses real schema fields and omits deleted tracks', async () => {
  const { db, api } = setup();
  db.rows.tracks[0].deleted_at = '2026-11-02';
  const response = await call(api, 'tracks');
  assert.equal(response.body.count, 3);
  assert.equal(response.body.data[0].artist, 'DB artist');
  assert.equal(response.body.data[0].duration, '4:05');
});

test('frontend save uses token and cloud response; never trusts userId', async () => {
  const { api } = setup();
  const request = await payload(api);
  const calls = [];
  const service = loadModule('frontend/services/journey-service.ts', serviceMocks(async (url, options) => {
    calls.push({ url, options });
    const response = await call(api, 'save', JSON.parse(options.body));
    return { ok: response.statusCode === 201, json: async () => response.body };
  }));
  const j = generator.generateJourney({ moodFrom: request.moodFrom, moodTo: request.moodTo, activity: request.activity, duration: 15, tracks: (await call(api, 'tracks')).body.data });
  const saved = await service.saveJourney(j);
  assert.ok(saved.id);
  assert.equal(calls[0].options.headers.Authorization, 'Bearer owner');
  assert.ok(!('userId' in JSON.parse(calls[0].options.body)));
});

test('frontend rejects cloud errors, demo tracks and unauthenticated writes', async () => {
  const { api } = setup();
  const real = generator.generateJourney({ moodFrom: constants.MOODS[0], moodTo: constants.MOODS[1], activity: 'meditation', duration: 45, tracks: (await call(api, 'tracks')).body.data });
  const bad = loadModule('frontend/services/journey-service.ts', serviceMocks(async () => ({ ok: false, json: async () => ({ success: false, error: 'DB error' }) })));
  await assert.rejects(bad.saveJourney(real), /DB error/);
  await assert.rejects(bad.deleteJourney(owner), /DB error/);
  await assert.rejects(bad.saveJourney(generator.generateJourney({ moodFrom: constants.MOODS[0], moodTo: constants.MOODS[1], activity: 'sleep', duration: 45 })), /ID DB/);
  const anonymous = loadModule('frontend/services/journey-service.ts', serviceMocks(undefined, 'web', null));
  await assert.rejects(anonymous.saveJourney(real), /đăng nhập/);
});

test('native storage supports authenticated requests without localStorage', async () => {
  const mocks = serviceMocks(async (_, options) => {
    assert.equal(options.headers.Authorization, 'Bearer owner');
    return { ok: true, json: async () => ({ success: true, data: [] }) };
  }, 'android');
  delete mocks.globals.localStorage;
  const service = loadModule('frontend/services/journey-service.ts', mocks);
  assert.equal((await service.getSavedJourneys()).length, 0);
});

test('core parser and demo timing remain compatible', () => {
  for (const duration of [15, 30, 45, 60]) {
    assert.equal(parser.parsePrompt(`thiền ${duration} phút`).duration, duration);
    const j = generator.generateJourney({ moodFrom: constants.MOODS[0], moodTo: constants.MOODS[1], activity: 'meditation', duration });
    assert.equal(j.totalMin, duration);
    for (let index = 1; index < 4; index++) assert.equal(j.stages[index].startMin, j.stages[index - 1].endMin);
    assert.equal(j.stages[3].endMin, duration);
  }
});

const backendSource = fs.readFileSync(path.join(root, 'backend/index.js'), 'utf8');
const backendAst = ts.createSourceFile('index.js', backendSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
function routeHandler(method, route, mocks) {
  let callback;
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(backendAst) === `app.${method}`
      && node.arguments[0]?.text === route) callback = node.arguments[1];
    ts.forEachChild(node, visit);
  }
  visit(backendAst);
  assert.ok(callback);
  return vm.runInNewContext(`(${callback.getText(backendAst)})`, { asyncRoute: (handler) => handler, ...mocks });
}

test('community save delegates to the same cloud journey contract', async () => {
  const { api } = setup();
  const input = await payload(api, 45);
  const { createCommunityHandlers } = require('../community-api');
  const sourceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9';
  const source = { id: sourceId, user_id: other, is_public: true, share_version: 2, title: 'Shared journey',
    mood_from: input.moodFrom.id, mood_to: input.moodTo.id, activity: input.activity, duration_minutes: 45, stages: input.stages };
  const handlers = createCommunityHandlers({ database: {}, serverAuth: { authenticate: async () => ({ user: { id: owner } }) },
    readPosts: () => [{ id: 'post', user_id: other, journey_id: sourceId, source_share_version: 2 }], writePosts() {},
    journeys: { sources: async () => new Map([[sourceId, source]]), save: api.save } });
  const handler = routeHandler('post', '/api/community/posts/:id/save', { communityHandlers: handlers });
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
  await handler({ params: { id: 'post' }, headers: { authorization: 'Bearer owner' }, body: { userId: other } }, response);
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.journey.user_id, owner);
  assert.equal(response.body.journey.duration_minutes, 45);
  assert.equal(response.body.journey.is_public, false);
});

test('DNA and statistics read authenticated cloud journeys, not local journey files', async () => {
  const { api } = setup();
  await call(api, 'save', await payload(api, 45));
  for (const route of ['/api/recommendations/dna', '/api/stats']) {
    const handler = routeHandler('get', route, {
      journeyHandlers: api,
      getLocalLikedTracks: () => [], getLocalEvaluations: () => [], MOOD_LABELS: {},
    });
    const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
    await handler({ headers: { authorization: 'Bearer owner' }, query: { userId: other } }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.success, true);
    if (route.includes('/dna')) assert.equal(response.body.totalJourneys, 1);
    else assert.ok(response.body.data);
  }
});

test('cancellation reaches the frontend fetch signal', async () => {
  let signal;
  const service = loadModule('frontend/services/journey-service.ts', serviceMocks(async (_, options) => {
    signal = options.signal;
    return new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true });
    });
  }));
  const controller = new AbortController();
  const pending = service.getJourneyTracks(controller.signal);
  controller.abort();
  await assert.rejects(pending, /Aborted/);
  assert.equal(signal.aborted, true);
});

const testSecret = 'unit-test-only-secret-not-used-outside-mocks';
function serverFixture({ includeAccount = true, secret = testSecret, configured = true } = {}) {
  const publicDb = database();
  const privateDb = database();
  privateDb.rows.app_users = includeAccount ? [{ id: owner, email: 'fixture@example.test', password_hash: 'mock-hash', display_name: 'Fixture', role: 'user' }] : [];
  const auth = createServerAuth({ database: configured ? privateDb : null, jwtSecret: secret,
    verifyJWT: (token, key) => jwt.verify(token, key, { algorithms: ['HS256'] }),
    onError() {},
  });
  const api = createJourneyHandlers({ database: publicDb, verifyToken: auth.verifyToken,
    databaseForExpressUser: auth.databaseForUser,
    verifySupabaseToken: async () => { throw new Error('Not a Supabase session'); },
    databaseForToken: () => publicDb,
    isMoodId: constants.isMoodId, onDatabaseError() {},
  });
  const token = jwt.sign({ id: owner }, testSecret, { expiresIn: '1h' });
  return { publicDb, privateDb, auth, api, token };
}

test('Express journey uses the private DB only after JWT and cloud account verification', async () => {
  const { api, token, publicDb, privateDb } = serverFixture();
  const input = await payload(api);
  publicDb.faults.push({ table: 'journeys', operation: 'insert', error: { code: '42501' } });
  const response = await call(api, 'save', input, token);
  assert.equal(response.statusCode, 201);
  assert.equal(privateDb.rows.journeys[0].user_id, owner);
  assert.equal(publicDb.rows.journeys.length, 0);
  assert.equal(privateDb.calls[0].table, 'app_users');
  assert.equal((await call(api, 'list', undefined, token)).body.count, 1);
  assert.equal((await call(api, 'remove', undefined, token, { id: response.body.journey.id })).statusCode, 200);
});

test('invalid and expired Express JWT cannot access the privileged client', async () => {
  const { api, privateDb } = serverFixture();
  const input = await payload(api);
  const invalid = jwt.sign({ id: owner }, 'another-unit-test-only-secret', { expiresIn: '1h' });
  const expired = jwt.sign({ id: owner }, testSecret, { expiresIn: -1 });
  for (const token of [invalid, expired]) assert.equal((await call(api, 'save', input, token)).statusCode, 401);
  assert.equal(privateDb.calls.length, 0);
});

test('a local-only account cannot write through the privileged client', async () => {
  const { api, privateDb, token } = serverFixture({ includeAccount: false });
  const response = await call(api, 'save', await payload(api), token);
  assert.equal(response.statusCode, 401);
  assert.equal(response.body.code, 'ACCOUNT_NOT_IN_DATABASE');
  assert.equal(privateDb.rows.journeys.length, 0);
});

test('account database failure does not fall back to local or anonymous access', async () => {
  const { api, privateDb, token } = serverFixture();
  privateDb.faults.push({ table: 'app_users', operation: 'select' });
  const response = await call(api, 'save', await payload(api), token);
  assert.equal(response.statusCode, 503);
  assert.equal(response.body.code, 'ACCOUNT_DB_UNAVAILABLE');
  assert.equal(privateDb.rows.journeys.length, 0);
});

test('missing server key or weak JWT secret blocks Express Auth', () => {
  for (const options of [{ configured: false }, { secret: '' }, { secret: 'short' }]) {
    const { auth } = serverFixture(options);
    let nextCalled = false;
    const res = { status(code) { this.code = code; return this; }, json(data) { this.data = data; } };
    auth.middleware({}, res, () => { nextCalled = true; });
    assert.equal(nextCalled, false);
    assert.equal(res.code, 503);
    assert.equal(res.data.code, 'SERVER_AUTH_NOT_CONFIGURED');
  }
});

test('account store creates and finds cloud users without a local fallback', async () => {
  const { auth, privateDb } = serverFixture();
  const user = await auth.createUser({ email: ' NEW@EXAMPLE.TEST ', passwordHash: 'fixture-hash', displayName: 'New fixture' });
  assert.equal(user.email, 'new@example.test');
  assert.equal(user.role, 'user');
  assert.equal((await auth.findUserByEmail(' NEW@example.test ')).id, user.id);
  privateDb.faults.push({ table: 'app_users', operation: 'select' });
  await assert.rejects(auth.findUserByEmail('new@example.test'), /Không thể truy cập/);
});

function authLoginFixture(auth, overrides = {}) {
  return routeHandler('post', '/api/auth/login', {
    findUserByEmail: auth.findUserByEmail, serverAuth: auth,
    bcrypt: require('bcryptjs'), jwt, JWT_SECRET: testSecret,
    console: { log() {} }, ...overrides,
  });
}
async function login(handler, body = { email: 'fixture@example.test', password: 'fixture-password' }) {
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
  await handler({ body }, response);
  return response;
}

test('login identifies a rejected server key without exposing raw database errors', async () => {
  const { auth, privateDb } = serverFixture();
  privateDb.faults.push({ table: 'app_users', operation: 'select', status: 401,
    error: { message: 'sensitive key rejection details' } });
  const response = await login(authLoginFixture(auth));
  assert.equal(response.statusCode, 503);
  assert.equal(response.body.code, 'SERVER_DB_KEY_REJECTED');
  assert.equal(response.body.operation, 'account_lookup');
  assert.equal(response.body.dbCode, 'HTTP_401');
  assert.ok(!JSON.stringify(response.body).includes('sensitive key rejection details'));
});

test('login distinguishes schema, permission and network failures', async () => {
  for (const [fault, code] of [
    [{ error: { code: 'PGRST205' } }, 'ACCOUNT_DB_SCHEMA_MISMATCH'],
    [{ error: { code: '42501' } }, 'ACCOUNT_DB_PERMISSION_DENIED'],
    [{ reject: true }, 'ACCOUNT_DB_UNAVAILABLE'],
  ]) {
    const { auth, privateDb } = serverFixture();
    privateDb.faults.push({ table: 'app_users', operation: 'select', ...fault });
    const response = await login(authLoginFixture(auth));
    assert.equal(response.statusCode, 503);
    assert.equal(response.body.code, code);
  }
});

test('login rejects non-string credentials before any DB access', async () => {
  const { auth, privateDb } = serverFixture();
  for (const body of [{ email: {}, password: 'x' }, { email: 'fixture@example.test', password: {} }, undefined]) {
    const response = await login(authLoginFixture(auth), body === undefined ? null : body);
    assert.equal(response.statusCode, 400);
  }
  assert.equal(privateDb.calls.length, 0);
});

test('login diagnoses an unsupported password hash without exposing it', async () => {
  const { auth } = serverFixture();
  const response = await login(authLoginFixture(auth));
  assert.equal(response.statusCode, 500);
  assert.equal(response.body.code, 'ACCOUNT_PASSWORD_INVALID');
  assert.equal(response.body.operation, 'password_verify');
  assert.ok(!JSON.stringify(response.body).includes('mock-hash'));
});

test('login still signs a valid JWT for a cloud account with a valid password', async () => {
  const { auth, privateDb } = serverFixture();
  privateDb.rows.app_users[0].password_hash = require('bcryptjs').hashSync('fixture-password', 4);
  const response = await login(authLoginFixture(auth));
  assert.equal(response.statusCode, 200);
  assert.equal(jwt.verify(response.body.token, testSecret).id, owner);
  assert.equal(response.body.user.id, owner);
});

test('auth diagnostics log only safe codes and operation names', () => {
  const entries = [];
  const auth = createServerAuth({ database: null, jwtSecret: '', verifyJWT() {}, onError: (entry) => entries.push(entry) });
  const response = { status() { return this; }, json() {} };
  auth.respondError(response, { code: 'ACCOUNT_DB_UNAVAILABLE', message: 'secret-token-and-password', dbCode: 'FETCH_ERROR', operation: 'account_lookup' }, 'account_lookup');
  assert.equal(entries.length, 1);
  assert.ok(!JSON.stringify(entries).includes('secret-token-and-password'));
});

test('shared API client persists and clears native session without localStorage', async () => {
  const store = new Map();
  const mocks = serviceMocks(async () => ({ ok: true, status: 200, json: async () => ({ success: true }) }), 'android', null);
  delete mocks.globals.localStorage;
  mocks['@react-native-async-storage/async-storage'] = { default: {
    getItem: async (key) => store.get(key) ?? null,
    setItem: async (key, value) => { store.set(key, value); },
    removeItem: async (key) => { store.delete(key); },
  } };
  const service = loadModule('frontend/services/api-client.ts', mocks);
  await service.saveSession('fixture-token', { id: owner, email: 'native@example.test', displayName: 'Native', role: 'user' });
  assert.equal(store.get('moodflow_token'), 'fixture-token');
  assert.equal(JSON.parse(store.get('moodflow_user')).displayName, 'Native');
  await service.clearSession();
  assert.equal(store.size, 0);
  await assert.rejects(service.request('/auth/me'), /đăng nhập/);
});

test('settings service keeps conflict status and never adds a caller-supplied user ID', async () => {
  let sent;
  const mocks = serviceMocks(async (_, options) => {
    sent = JSON.parse(options.body);
    return { ok: false, status: 409, json: async () => ({ success: false, code: 'SETTINGS_CONFLICT', error: 'Conflict fixture' }) };
  });
  const service = loadModule('frontend/services/settings-service.ts', mocks);
  await assert.rejects(service.saveSettings({ moodFrom: 'deep_focus', moodTo: 'calm_unwind', activity: 'sleep', duration: 15 }, null),
    (error) => error.status === 409 && error.code === 'SETTINGS_CONFLICT');
  assert.ok(!('userId' in sent));
  assert.equal(sent.expectedUpdatedAt, null);
});

test('settings service rejects invalid server defaults and strips sensitive user fields', async () => {
  const mocks = serviceMocks(async (url) => ({ ok: true, status: 200, json: async () => url.endsWith('/auth/me')
    ? { success: true, user: { id: owner, email: 'fixture@example.test', displayName: 'Fixture', role: 'user', password_hash: 'not-for-client-cache' } }
    : { success: true, journeyDefaults: { moodFrom: 'bad', moodTo: 'calm_unwind', activity: 'sleep', duration: 20 }, updatedAt: null } }));
  const service = loadModule('frontend/services/settings-service.ts', mocks);
  await assert.rejects(service.getSettings(), /không đúng đặc tả/);
  assert.ok(!('password_hash' in await service.getCurrentUser()));
});
