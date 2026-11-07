const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const http = require('node:http');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createRequire } = require('node:module');

const filename = path.resolve(__dirname, '../index.js');
const realRequire = createRequire(filename);
const a = '11111111-1111-4111-8111-111111111111';
const b = '22222222-2222-4222-8222-222222222222';
const secret = 'privacy-http-fixture-key-not-used-on-real-data';

async function fixture(run) {
  const files = new Map();
  const user = (id) => ({ id, email: id + '@example.test', display_name: id === a ? 'A' : 'B', role: 'user' });
  const likedTrackId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const rows = {
    app_users: [user(a), user(b)], profiles: [], journeys: [], journey_tracks: [],
    tracks: [{ id: likedTrackId, title: 'Fixture', genre: 'Ambient', duration_sec: 180,
      cover_url: '', audio_url: '', deleted_at: null, artists: { name: 'Artist' }, track_features: {} }],
    user_favorites: [], listening_history: [],
    user_listening_summary: [
      { user_id: a, total_listening_seconds: 3600, top_genre: 'Ambient' },
      { user_id: b, total_listening_seconds: 0 },
    ],
  };
  const db = { from(table) {
    const filters = [];
    const query = {
      select() { return query; }, eq(key, value) { filters.push(row => row[key] === value); return query; },
      is(key, value) { filters.push(row => (row[key] ?? null) === value); return query; },
      in(key, values) { filters.push(row => values.includes(row[key])); return query; },
      delete() { query.operation = 'delete'; return query; },
      insert(value) { query.operation = 'insert'; query.value = value; return query; },
      order() { return query; }, limit() { return query; }, maybeSingle() { query.single = true; return query; },
      then(resolve) {
        const tableRows = rows[table] || [];
        const selected = tableRows.filter(row => filters.every(filter => filter(row)));
        let data;
        if (query.operation === 'insert') {
          tableRows.push(query.value);
          data = query.value;
        } else if (query.operation === 'delete') {
          rows[table] = tableRows.filter(row => !selected.includes(row));
          data = selected;
        } else {
          data = selected.map(row => table === 'user_favorites'
            ? { ...row, tracks: rows.tracks.find(track => track.id === row.track_id) }
            : { ...row });
        }
        return Promise.resolve({ data: query.single ? data[0] || null : data, error: null }).then(resolve);
      },
    };
    return query;
  } };
  let app;
  const fakeExpress = () => { app = express(); app.listen = () => {}; return app; };
  fakeExpress.json = express.json;
  const fakeFS = {
    existsSync: name => !name.endsWith('.env'), mkdirSync() {},
    readFileSync: name => files.get(name) || '[]',
    writeFileSync: (name, content) => files.set(name, content),
    renameSync: (from, to) => { files.set(to, files.get(from)); files.delete(from); },
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    __dirname: path.dirname(filename), console: { log() {}, error() {} },
    process: { env: { SUPABASE_URL: 'https://fixture.example.test', SUPABASE_ANON_KEY: 'fixture-anon',
      SUPABASE_SECRET_KEY: 'fixture-server', JWT_SECRET: secret, PORT: '0' } },
    require(name) {
      if (name === 'express') return fakeExpress;
      if (name === 'fs') return fakeFS;
      if (name === '@supabase/supabase-js') return { createClient: () => db };
      return realRequire(name);
    },
  }, { filename });
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const request = async (route, { method = 'GET', actor, body } = {}) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api${route}`, {
      method, headers: { 'Content-Type': 'application/json', ...(actor ? { Authorization: 'Bearer ' + jwt.sign({ id: actor, role: 'admin' }, secret) } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, headers: response.headers, body: await response.json() };
  };
  try { await run({ request, files, rows }); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test('HTTP boundary requires verified session before profiles, likes and feedback; body userId cannot bypass', () => fixture(async ({ request, files }) => {
  for (const [route, method] of [['/profiles', 'GET'], ['/tracks/liked?userId=' + a, 'GET'],
    ['/tracks/like', 'POST'], ['/feedback', 'POST']]) {
    const result = await request(route, { method, ...(method === 'POST' ? { body: { userId: a, role: 'admin' } } : {}) });
    assert.equal(result.status, 401); assert.equal(result.headers.get('cache-control'), 'private, no-store');
  }
  assert.equal(files.size, 0);
}));

test('HTTP profiles exposes only current account name and no emails or account directory', () => fixture(async ({ request }) => {
  const result = await request('/profiles?userId=' + b, { actor: a });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.data, [{ id: a, display_name: 'A' }]);
  assert.ok(!JSON.stringify(result.body).includes('email'));
}));

test('HTTP likes are stored in Supabase and cannot be assigned to another account', () => fixture(async ({ request }) => {
  const track = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Fixture', artist: 'Artist' };
  await request('/tracks/like', { method: 'POST', actor: b, body: { track, userId: a } });
  const own = await request('/tracks/liked?userId=' + b, { actor: a });
  assert.deepEqual(own.body.data, []);
  const other = await request('/tracks/liked', { actor: b });
  assert.equal(other.body.data.length, 1); assert.equal(other.body.data[0].id, track.id);
  await request('/tracks/like', { method: 'POST', actor: a, body: { track, userId: b } });
  assert.equal((await request('/tracks/liked', { actor: b })).body.count, 1);
}));

test('HTTP feedback ignores body actor; its JSON and statistics stay within the verified account', () => fixture(async ({ request, files }) => {
  const result = await request('/feedback', { method: 'POST', actor: b, body: {
    userId: a, moodBefore: 'deep_focus', moodAfter: 'calm_unwind', rating: 5, durationMinutes: 15,
  } });
  assert.equal(result.status, 200); assert.equal(result.body.evaluation.user_id, b);
  const saved = [...files].find(([name]) => name.endsWith('session_evaluations.json'));
  assert.equal(JSON.parse(saved[1])[0].user_id, b);
  const own = await request('/stats?userId=' + b, { actor: a });
  assert.deepEqual(own.body.data.recentEvaluations, []);
}));

test('HTTP settings, journey errors and public feed use private no-store headers', () => fixture(async ({ request }) => {
  for (const route of ['/settings', '/journeys/my', '/community/posts']) {
    const result = await request(route, { actor: a });
    assert.equal(result.status, 200); assert.equal(result.headers.get('cache-control'), 'private, no-store');
  }
}));

test('HTTP personal JSON corruption never changes Supabase-backed favorites', () => fixture(async ({ request, files }) => {
  files.set(path.resolve(__dirname, '../data/session_evaluations.json'), '{broken');
  assert.equal((await request('/stats', { actor: a })).status, 503);
  assert.equal((await request('/feedback', { method: 'POST', actor: a,
    body: { moodAfter: 'calm_unwind', rating: 5, durationMinutes: 15 } })).status, 503);
  assert.equal((await request('/tracks/liked', { actor: a })).status, 200);
  assert.equal((await request('/recommendations/dna', { actor: a })).status, 200);
}));

test('HTTP library endpoints require a token and scope every request to its verified account', () => fixture(async ({ request, rows }) => {
  for (const [route, method] of [
    ['/library/summary', 'GET'],
    ['/library/favorites', 'GET'],
    ['/library/history', 'GET'],
  ]) {
    assert.equal((await request(route, { method })).status, 401);
    const result = await request(route, { method, actor: a });
    assert.equal(result.status, 200);
    assert.equal(result.headers.get('cache-control'), 'private, no-store');
  }
  const summary = await request('/library/summary?userId=' + b, { actor: a });
  assert.equal(summary.body.data.user_id, a);
  assert.equal(rows.user_favorites.length, 0);
}));
