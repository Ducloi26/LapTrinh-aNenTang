const {test}=require('node:test');const assert=require('node:assert/strict');const register=require('./audius-import-route');
function fixture(){
 let handler;const writes=[];let fetches=0;
 register({post(p,h){handler=h;}},{secret:'test',jwt:{verify(t){if(t!=='valid')throw Error('bad');return {id:'user'};}},
 admin:{from(table){return {async upsert(row,options){writes.push({table,row,options});return {error:null};}};}},
 fetchImpl:async()=>{fetches++;return {ok:true,json:async()=>({data:{id:'lvBQl',title:'Real title',user:{id:'artist',name:'Real artist'},genre:'R&B/Soul',duration:200,bpm:131.9,is_streamable:true}})};}});
 return {writes,get fetches(){return fetches;},async call(token='valid',sourceId='lvBQl'){
  const r={code:200,status(n){this.code=n;return this;},json(b){this.body=b;return this;}};
  await handler({headers:{authorization:token},params:{sourceId},body:{title:'Fake title'}},r);return r;
 }};
}
test('imports source metadata under stable UUIDs without inventing DNA or resetting play counts',async()=>{
 const f=fixture();const a=await f.call(),b=await f.call();assert.equal(a.code,200);assert.equal(a.body.data.id,b.body.data.id);
 assert.match(a.body.data.id,/^[a-f0-9-]{36}$/);assert.equal(a.body.data.title,'Real title');
 const track=f.writes.find(w=>w.table==='tracks');assert.equal(track.row.play_count,undefined);
 const feature=f.writes.find(w=>w.table==='track_features');assert.equal(feature.row.bpm,132);assert.equal(feature.row.energy,null);
 assert.equal(feature.row.valence,null);assert.equal(feature.row.instrumentalness,null);assert.equal(feature.options.ignoreDuplicates,true);
 assert.equal(track.row.cover_url,'');
});
test('rejects unauthenticated import and malformed source IDs before network or database access',async()=>{
 const f=fixture();assert.equal((await f.call('invalid')).code,401);assert.equal((await f.call('valid','../evil')).code,400);
 assert.equal(f.fetches,0);assert.equal(f.writes.length,0);
});
