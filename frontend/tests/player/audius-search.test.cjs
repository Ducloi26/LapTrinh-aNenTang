const {test}=require('node:test');const assert=require('node:assert/strict');
const {loadModule}=require('./test-support.cjs');
test('Audius search encodes Vietnamese terms and maps playable audio without invalid database IDs',async()=>{
  let url;const {searchAudius,audiusToTrack}=loadModule('services/audius-search-service.ts',{}, {
    fetch:async u=>{url=new URL(u);return {ok:true,json:async()=>({success:true,data:[],nextOffset:null})};},
  });
  await searchAudius('Sơn Tùng M-TP',20);assert.equal(url.searchParams.get('q'),'Sơn Tùng M-TP');assert.equal(url.searchParams.get('offset'),'20');
  const t=audiusToTrack({sourceId:'lvBQl',title:'Song',artist:'Artist',audioUrl:'https://api.audius.co/v1/tracks/lvBQl/stream',cover:'',durationSec:125,genre:'Electronic'});
  assert.equal(t.duration,'2:05');assert.equal(t.genre,'Electronic');assert.equal(t.id,undefined);
  const {resolveTrackSource}=loadModule('services/track-source.ts');assert.equal(resolveTrackSource(t),t.audioUrl);
});
test('Audius backend errors remain actionable',async()=>{
  const {searchAudius}=loadModule('services/audius-search-service.ts',{}, {
    fetch:async()=>({ok:false,json:async()=>({success:false,error:'Audius đang giới hạn lượt tìm kiếm'})}),
  });await assert.rejects(searchAudius('piano'),/giới hạn/);
});

test('Audius playback preparation receives an internal track UUID and sends the backend session',async()=>{
 let request;const {prepareAudiusTrack}=loadModule('services/audius-search-service.ts',{}, {
  localStorage:{getItem:k=>k==='moodflow_token'?'token':JSON.stringify({id:'user'})},
  fetch:async(url,options)=>{request={url,options};return {ok:true,json:async()=>({success:true,data:{id:'00000000-0000-4000-8000-000000000001',bpm:132}})};},
 });
 const t=await prepareAudiusTrack({audiusSourceId:'lvBQl',title:'Test'});
 assert.match(request.url,/lvBQl\/import$/);assert.equal(request.options.headers.Authorization,'Bearer token');assert.ok(t.id);assert.equal(t.bpm,132);
});
