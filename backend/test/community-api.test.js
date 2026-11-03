const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createCommunityHandlers } = require('../community-api');

const a = '11111111-1111-4111-8111-111111111111';
const b = '22222222-2222-4222-8222-222222222222';
const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9';
function fixture() {
  const state = { posts: [], writes: 0, lookups: [], failDB: false, failWrite: false, afterWrite: null,
    source: { id, user_id: a, is_public: true, share_version: 0, title: 'Verified DB source',
      mood_from: 'deep_focus', mood_to: 'calm_unwind', activity: 'deep_work', duration_minutes: 45, stages: [] } };
  const api = createCommunityHandlers({ database: {},
    serverAuth: {
      async authenticate(token) {
        if (!['a', 'b', 'admin'].includes(token)) throw { code: 'INVALID_SESSION' };
        return { user: { id: token === 'a' ? a : b, displayName: token === 'a' ? 'Cloud A' : 'Cloud B',
          role: token === 'admin' ? 'admin' : 'user' } };
      },
      respondError(res) { return res.status(401).json({ success: false }); },
    },
    journeys: {
      async sources(db, ids) {
        state.lookups.push(ids);
        if (state.failDB) throw { code: '42501', message: 'secret row details' };
        return new Map(state.source ? [[id, structuredClone(state.source)]] : []);
      },
      async save(req, res, options) { state.copy = { req, options }; return res.status(201).json({ success: true }); },
    },
    readPosts: () => structuredClone(state.posts),
    writePosts(posts) {
      if (state.failWrite) throw new Error('secret path');
      state.posts = structuredClone(posts); state.writes++;
      state.afterWrite?.();
    }, onError() {},
  });
  const call = async (handler, body = {}, token = 'a', params = { id: 'post' }, query = {}) => {
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
    await api[handler]({ headers: { authorization: `Bearer ${token}` }, body, params, query }, res);
    return res;
  };
  const seed = () => { state.posts = [{ id: 'post', user_id: a, author_name: 'Cloud A', journey_id: id,
    source_share_version: 0, liked_by: [], comments: [], caption: 'Caption', created_at: '2026-11-03T00:00:00Z',
    journey: { title: 'UNTRUSTED SNAPSHOT' } }]; };
  return { state, call, seed };
}

test('publish trusts cloud owner, author and source version; rejects snapshots and claimed actors', async () => {
  const f = fixture();
  const body = { caption: 'Fresh post', journeyId: id };
  for (const extra of [{ userId: b }, { journey: {} }, { source_share_version: 999 }, { authorName: 'Spoof' }]) {
    assert.equal((await f.call('create', { ...body, ...extra })).statusCode, 400);
  }
  const response = await f.call('create', body);
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.post.author_name, 'Cloud A');
  assert.equal(response.body.post.journey.title, 'Verified DB source');
  assert.equal(f.state.posts[0].source_share_version, 0);
  assert.ok(!Object.hasOwn(f.state.posts[0], 'journey'));
});

test('own private source is 409, another owner or absent source is 404', async () => {
  const f = fixture(), body = { caption: 'Share', journeyId: id };
  f.state.source.is_public = false;
  assert.equal((await f.call('create', body)).statusCode, 409);
  assert.equal((await f.call('create', body, 'b')).statusCode, 404);
  f.state.source = null;
  assert.equal((await f.call('create', body)).statusCode, 404);
  assert.equal(f.state.writes, 0);
});

test('revoke then re-enable never revives old posts; explicit republish has a new ID', async () => {
  const f = fixture();
  const first = await f.call('create', { caption: 'Old post', journeyId: id });
  f.state.source.is_public = false; f.state.source.share_version++;
  assert.equal((await f.call('list')).body.count, 0);
  f.state.source.is_public = true;
  assert.equal((await f.call('list')).body.count, 0);
  assert.equal((await f.call('get', {}, 'a', { id: first.body.post.id })).statusCode, 404);
  const second = await f.call('create', { caption: 'New post', journeyId: id });
  assert.notEqual(second.body.post.id, first.body.post.id);
  assert.equal((await f.call('list')).body.count, 1);
});

test('feed hides missing source/version, mismatched owner and removed journeys without trusting snapshot', async () => {
  const f = fixture(); f.seed();
  const good = f.state.posts[0];
  f.state.posts.push({ ...good, id: 'missing-id', journey_id: undefined },
    { ...good, id: 'missing-version', source_share_version: undefined },
    { ...good, id: 'wrong-owner', user_id: b }, { ...good, id: 'wrong-version', source_share_version: '0' });
  const result = await f.call('list');
  assert.equal(result.body.count, 1);
  assert.equal(result.body.data[0].journey.title, 'Verified DB source');
  f.state.source = null;
  assert.equal((await f.call('list')).body.count, 0);
});

test('feed verifies shared sources in one batch rather than one query per post', async () => {
  const f = fixture(); f.seed();
  f.state.posts = Array.from({ length: 25 }, (_, i) => ({ ...f.state.posts[0], id: `post-${i}` }));
  assert.equal((await f.call('list')).body.count, 25);
  assert.deepEqual(f.state.lookups, [[id]]);
});

for (const handler of ['get', 'like', 'comment', 'save', 'edit', 'remove', 'removeComment']) {
  test(`${handler}: revoked source or previous version is inaccessible even with known post ID`, async () => {
    const f = fixture(); f.seed();
    for (const isPublic of [false, true]) {
      f.state.source.is_public = isPublic; f.state.source.share_version = 1;
      const result = await f.call(handler, handler === 'edit' ? { caption: 'Edit' } : { content: 'Comment' }, 'admin', { id: 'post', commentId: 'comment' });
      assert.equal(result.statusCode, 404);
      assert.ok(!JSON.stringify(result.body).includes('Verified DB source'));
    }
    assert.equal(f.state.writes, 0);
  });
}

for (const handler of ['create', 'like', 'comment', 'save', 'edit', 'remove', 'removeComment']) {
  test(`${handler}: missing or invalid session cannot mutate JSON or query private source`, async () => {
    const f = fixture(); f.seed();
    const result = await f.call(handler, { caption: 'X', journeyId: id, content: 'X', userId: a }, 'bad');
    assert.equal(result.statusCode, 401);
    assert.equal(f.state.writes, 0); assert.equal(f.state.lookups.length, 0);
  });
}

test('like/comment actor comes from verified account and comment deletion checks its author', async () => {
  const f = fixture(); f.seed();
  await f.call('like', { userId: a }, 'b');
  assert.deepEqual(f.state.posts[0].liked_by, [b]);
  const response = await f.call('comment', { content: 'Hi', userId: a, authorName: 'Spoof' }, 'b');
  assert.equal(response.body.comment.user_id, b);
  assert.equal(response.body.comment.author_name, 'Cloud B');
  const params = { id: 'post', commentId: response.body.comment.id };
  assert.equal((await f.call('removeComment', {}, 'a', params)).statusCode, 404);
  assert.equal((await f.call('removeComment', {}, 'b', params)).statusCode, 200);
});

test('post edit requires the author; delete accepts only author or verified admin', async () => {
  const f = fixture(); f.seed();
  assert.equal((await f.call('edit', { caption: 'Attack', userId: a }, 'b')).statusCode, 400);
  assert.equal((await f.call('edit', { caption: 'Attack' }, 'b')).statusCode, 404);
  assert.equal((await f.call('edit', { caption: 'Admin edit' }, 'admin')).statusCode, 404);
  assert.equal((await f.call('remove', { userId: a, role: 'admin' }, 'b')).statusCode, 404);
  assert.equal((await f.call('remove', {}, 'admin')).statusCode, 200);
});

test('copy uses verified DB content and forces private independently of account defaults', async () => {
  const f = fixture(); f.seed();
  assert.equal((await f.call('save', { journey: { title: 'Attacker' } }, 'b')).statusCode, 201);
  assert.equal(f.state.copy.options.forcePrivate, true);
  assert.equal(f.state.copy.req.body.title, '[Cộng đồng] Verified DB source');
  f.state.source.is_public = false; f.state.source.share_version++;
  assert.equal((await f.call('save', {}, 'b')).statusCode, 404);
  assert.equal(f.state.copy.req.body.title, '[Cộng đồng] Verified DB source');
});

test('database errors fail closed for feed and mutations; never return a snapshot', async () => {
  const f = fixture(); f.seed(); f.state.failDB = true;
  for (const handler of ['list', 'get', 'like', 'comment', 'save', 'edit', 'remove', 'removeComment']) {
    const result = await f.call(handler, handler === 'edit' ? { caption: 'X' } : { content: 'X' });
    assert.equal(result.statusCode, 503);
    assert.ok(!JSON.stringify(result.body).includes('secret'));
    assert.ok(!JSON.stringify(result.body).includes('SNAPSHOT'));
  }
  assert.equal(f.state.writes, 0);
});

test('JSON write failures do not report publish or like success', async () => {
  const f = fixture(); f.seed(); f.state.failWrite = true;
  assert.equal((await f.call('create', { caption: 'X', journeyId: id })).statusCode, 503);
  assert.equal((await f.call('like')).statusCode, 503);
  assert.equal(f.state.writes, 0);
});

test('publish racing with revocation may store an old version but cannot return or list its content', async () => {
  const f = fixture();
  f.state.afterWrite = () => { f.state.source.is_public = false; f.state.source.share_version++; };
  const response = await f.call('create', { caption: 'Race', journeyId: id });
  assert.equal(response.statusCode, 404);
  assert.equal((await f.call('list')).body.count, 0);
  f.state.source.is_public = true;
  assert.equal((await f.call('list')).body.count, 0);
});
