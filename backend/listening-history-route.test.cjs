const { test } = require('node:test');
const assert = require('node:assert/strict');
const register = require('./listening-history-route');

function fixture(result = { data: { recorded: true }, error: null }) {
  let handler; const calls = [];
  register({ post(_path, callback) { handler = callback; } }, {
    jwt: { verify(token) { if (token !== 'valid') throw Error('bad'); return { id: 'user-a' }; } }, secret: 'test',
    admin: { async rpc(name, args) { calls.push({ name, args }); return result; } },
  });
  return { calls, async request(body, token = 'valid') {
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    await handler({ body, headers: { authorization: `Bearer ${token}` } }, res); return res;
  } };
}
test('rejects invalid tokens and caller-selected identity before database access', async () => {
  const f = fixture();
  assert.equal((await f.request({userId:'user-a'}, 'invalid')).statusCode, 401);
  assert.equal((await f.request({userId:'user-b'})).statusCode, 403);
  assert.equal(f.calls.length, 0);
});
test('writes with verified actor and forwards the stable playback id for deduplication', async () => {
  const f = fixture();
  const res = await f.request({userId:'user-a',playbackId:'stable-id',trackId:'track-a',listenedSec:8,durationSec:10,endReason:'ended',playedAt:'2026-11-03T00:00:00Z'});
  assert.equal(res.body.success,true);
  assert.equal(f.calls[0].args.p_user_id,'user-a');
  assert.equal(f.calls[0].args.p_playback_id,'stable-id');
  assert.equal(f.calls[0].name,'record_backend_listening_history');
});
test('missing migration reports a setup error instead of silently dropping history', async () => {
  const f = fixture({data:null,error:{code:'PGRST202'}});
  const res=await f.request({userId:'user-a'});
  assert.equal(res.statusCode,503);assert.match(res.body.error,/SQL Editor/);
});
