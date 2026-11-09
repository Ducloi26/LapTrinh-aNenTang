const {test}=require('node:test');const assert=require('node:assert/strict');
const register=require('./audius-search-route');
function fixture(payload, status=200){
  let handler;const calls=[];register({get(p,h){assert.equal(p,'/api/audius/search');handler=h;}},{apiUrl:'https://discoveryprovider.audius.co/v1',siteUrl:'https://audius.co',apiKey:'test-private-key',fetchImpl:async(url,options)=>{
    calls.push({url:new URL(url),options});return {ok:status===200,status,json:async()=>payload};
  }});
  return {calls,async request(query){const r={code:200,status(n){this.code=n;return this;},json(b){this.body=b;return this;}};await handler({query},r);return r;}};
}
test('maps public streamable tracks and keeps credentials out of returned URLs',async()=>{
  const f=fixture({data:[{id:'abc12',title:'Nhạc Việt',user:{name:'Artist'},duration:120,is_streamable:true,permalink:'/artist/song',artwork:{'480x480':'https://img.test/a.jpg'}}]});
  const r=await f.request({q:'Sơn Tùng & piano',offset:'20'});
  assert.equal(r.code,200);assert.equal(f.calls[0].url.searchParams.get('query'),'Sơn Tùng & piano');
  assert.equal(f.calls[0].options.headers['x-api-key'],'test-private-key');
  assert.equal(r.body.data[0].audioUrl,'https://discoveryprovider.audius.co/v1/tracks/abc12/stream?app_name=MoodFlow');
  assert.ok(!JSON.stringify(r.body).includes('test-private-key'));assert.equal(r.body.data[0].shareUrl,'https://audius.co/artist/song');
});
test('does not offer gated, unavailable or malformed tracks for playback',async()=>{
  const f=fixture({data:[{id:'a',is_streamable:false},{id:'b',is_streamable:true,is_stream_gated:true},{id:'../bad',is_streamable:true}]});
  assert.deepEqual((await f.request({q:'test'})).body.data,[]);
});
test('rejects invalid searches and reports API rate limits',async()=>{
  const f=fixture({},429);assert.equal((await f.request({q:''})).code,400);assert.equal(f.calls.length,0);
  assert.equal((await f.request({q:'test',offset:'-1'})).code,400);
  const r=await f.request({q:'test'});assert.equal(r.code,429);assert.match(r.body.error,/giới hạn/);
});
