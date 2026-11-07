const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createMusicLibraryHandlers } = require('../music-library-api');

const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const trackId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function createDatabase() {
  const db = {
    rows: {
      user_listening_summary: [{ user_id: owner, total_listening_seconds: 3600, top_genre: 'Ambient' }],
      user_favorites: [{ user_id: owner, track_id: trackId, created_at: '2026-11-08T00:00:00Z' }],
      listening_history: [{ id: 1, user_id: owner, track_id: trackId, listened_sec: 60, played_at: '2026-11-08T00:00:00Z' }],
      tracks: [{ id: trackId, deleted_at: null }],
    },
    calls: [],
    from(table) { return new Query(this, table); },
  };
  return db;
}

class Query {
  constructor(db, table) {
    this.db = db;
    this.table = table;
    this.filters = [];
    this.operation = 'select';
  }
  select(fields) { this.fields = fields; return this; }
  eq(key, value) { this.filters.push([key, value]); return this; }
  is(key, value) { this.filters.push([key, value]); return this; }
  order() { return this; }
  limit() { return this; }
  maybeSingle() { this.single = true; return this; }
  delete() { this.operation = 'delete'; return this; }
  insert(value) { this.operation = 'insert'; this.value = value; return this; }
  then(resolve, reject) { return Promise.resolve().then(() => this.execute()).then(resolve, reject); }
  execute() {
    this.db.calls.push({ table: this.table, operation: this.operation, filters: this.filters });
    const rows = this.db.rows[this.table];
    const matches = rows.filter((row) => this.filters.every(([key, value]) => (row[key] ?? null) === value));
    if (this.operation === 'delete') {
      this.db.rows[this.table] = rows.filter((row) => !matches.includes(row));
      return { data: matches, error: null };
    }
    if (this.operation === 'insert') {
      rows.push(this.value);
      return { data: this.value, error: null };
    }
    const data = matches.map((row) => {
      if (this.table === 'user_favorites') return { ...row, tracks: { ...trackFixture } };
      if (this.table === 'listening_history') return { ...row, tracks: { ...trackFixture } };
      return { ...row };
    });
    return { data: this.single ? data[0] || null : data, error: null };
  }
}

const trackFixture = {
  id: trackId,
  title: 'Test Song',
  genre: 'Ambient',
  duration_sec: 180,
  cover_url: 'https://example.test/cover.jpg',
  audio_url: 'https://example.test/song.mp3',
  artists: { name: 'Test Artist' },
  track_features: { bpm: 80, energy: 40, valence: 55 },
};

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

function setup() {
  const db = createDatabase();
  const handlers = createMusicLibraryHandlers({
    databaseForUser: async (user) => {
      assert.equal(user.id, owner);
      return db;
    },
    onDatabaseError: (event) => { throw new Error(JSON.stringify(event)); },
  });
  return { db, handlers };
}

test('summary, favorites and listening history are filtered by the actor account', async () => {
  const { db, handlers } = setup();
  for (const [handler, url] of [
    [handlers.summary, '/summary'],
    [handlers.favorites, '/favorites'],
    [handlers.history, '/history'],
  ]) {
    const res = response();
    await handler({ actor: { user: { id: owner } }, params: {}, body: {} }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.ok(db.calls.some((call) => call.filters.includes(['user_id', owner])
      || call.filters.some(([key, value]) => key === 'user_id' && value === owner)), url);
  }
  assert.equal(db.calls.some((call) => call.filters.some(([key, value]) => key === 'user_id' && value === other)), false);
});

test('removing a favorite deletes only the authenticated user row', async () => {
  const { db, handlers } = setup();
  const res = response();
  await handlers.removeFavorite({ actor: { user: { id: owner } }, params: { trackId }, body: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(db.rows.user_favorites, []);
  const deletion = db.calls.find((call) => call.table === 'user_favorites' && call.operation === 'delete');
  assert.deepEqual(deletion.filters, [['user_id', owner], ['track_id', trackId]]);
});

test('clearing listening history scopes deletion to authenticated user', async () => {
  const { db, handlers } = setup();
  db.rows.listening_history.push({ id: 2, user_id: other, track_id: trackId });
  const res = response();
  await handlers.clearHistory({ actor: { user: { id: owner } }, params: {}, body: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(db.rows.listening_history.map((row) => row.user_id), [other]);
});

test('favorite toggle validates catalog tracks and records the actor as owner', async () => {
  const { db, handlers } = setup();
  const res = response();
  await handlers.toggleFavorite({
    actor: { user: { id: owner } }, params: {},
    body: { track: { id: trackId }, user_id: other },
  }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.liked, false);
  assert.deepEqual(db.rows.user_favorites, []);

  await handlers.toggleFavorite({
    actor: { user: { id: owner } }, params: {},
    body: { track: { id: trackId }, user_id: other },
  }, response());
  assert.deepEqual(db.rows.user_favorites[0], { user_id: owner, track_id: trackId });
});
