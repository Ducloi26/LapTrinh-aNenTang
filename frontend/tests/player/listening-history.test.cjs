const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadModule } = require('./test-support.cjs');

function trackerFixture() {
  const { ListeningHistoryTracker } = loadModule('services/listening-history-tracker.ts');
  let now = 0;
  const records = [];
  const tracker = new ListeningHistoryTracker((record) => records.push(record), () => now, () => '2026-10-17T00:00:00.000Z');
  tracker.setUser('user-a');
  const progress = (position, elapsed = position, isPlaying = true, isBuffering = false, duration = 100) => {
    now = elapsed * 1000;
    tracker.update({ position, duration, isPlaying, isBuffering });
  };
  return { tracker, records, progress, setClock: (seconds) => { now = seconds * 1000; } };
}

test('under 5 seconds is ignored; exactly 5 seconds records once on change', () => {
  const {tracker,records,progress}=trackerFixture();
  tracker.begin('track-a'); progress(0,0); progress(4.9,4.9); tracker.finish('changed');
  assert.equal(records.length,0);
  tracker.begin('track-b'); progress(0,5); progress(5,10); tracker.finish('changed'); tracker.finish('ended');
  assert.equal(records.length,1);
  assert.equal(records[0].trackId,'track-b'); assert.equal(records[0].listenedSec,5);
});

test('pause, buffering and seeks do not inflate listened seconds', () => {
  const {tracker,records,progress}=trackerFixture();
  tracker.begin('track-a'); progress(0,0); progress(3,3,false);
  progress(3,90,false); // 87 seconds paused
  progress(3,91); progress(5,93,false,true); // two more actual seconds
  progress(5,150,false,true); // buffering
  tracker.seeking(); progress(90,151); progress(92,153);
  tracker.seeking(); progress(0,154); progress(1,155);
  tracker.finish('changed');
  assert.equal(records[0].listenedSec,8);
});

test('large unexpected jumps are capped by actual elapsed time', () => {
  const {tracker,records,progress}=trackerFixture();
  tracker.begin('track-a'); progress(0,0); progress(90,1); progress(94,5); tracker.finish('changed');
  assert.equal(records[0].listenedSec,5);
});

test('queued native progress updates after backgrounding still count actual playback', () => {
  const {tracker,records,progress}=trackerFixture();
  tracker.begin('track-a');progress(0,0);
  for(let position=1;position<=30;position++) progress(position,30);
  tracker.finish('changed');
  assert.equal(records[0].listenedSec,30);
});

test('natural end and following switch record one row; replay creates a new playback id', () => {
  const {tracker,records,progress}=trackerFixture();
  tracker.begin('track-a',{journeyId:'journey',moodId:'focus',stage:'deepfocus'});
  progress(0,0); progress(80,80,false); tracker.finish('ended');
  tracker.begin('track-b'); progress(0,81); progress(5,86); tracker.finish('changed');
  tracker.begin('track-a'); progress(0,87); progress(6,93); tracker.finish('stopped');
  assert.equal(records.length,3);
  assert.equal(records[0].moodId,'focus'); assert.equal(records[0].stage,'deepfocus');
  assert.equal(records[0].endReason,'ended');
  assert.notEqual(records[0].playbackId,records[2].playbackId);
});

test('guest listening is ignored and switching accounts cannot attribute old listening to a new user', () => {
  const {tracker,records,progress}=trackerFixture();
  tracker.setUser(null); tracker.begin('track'); progress(0,0); progress(10,10);
  tracker.setUser('user-a'); progress(10,10); progress(16,16);
  tracker.setUser('user-b'); progress(16,16); progress(23,23); tracker.finish('ended');
  assert.equal(records.length,2);
  assert.equal(records[0].userId,'user-a'); assert.equal(records[0].listenedSec,6);
  assert.equal(records[1].userId,'user-b'); assert.equal(records[1].listenedSec,7);
});

function writerFixture() {
  let userId='user-a'; let failure=null;
  const calls=[];
  const client={
    auth:{async getSession(){return {data:{session:userId?{user:{id:userId}}:null},error:null};}},
    rpc(name,args){calls.push({name,args});return {async abortSignal(){return {error:failure};}};},
  };
  const {ListeningHistoryWriter}=loadModule('services/listening-history-service.ts',{'../lib/supabase':{supabase:client}});
  const writer=new ListeningHistoryWriter();
  return {writer,calls,setUser:(value)=>{userId=value;},setFailure:(value)=>{failure=value;}};
}
const record=(id='listen-1',userId='user-a')=>({playbackId:id,userId,trackId:'track-a',listenedSec:7,durationSec:100,endReason:'changed',playedAt:'2026-10-17T00:00:00.000Z'});

test('failed requests stay queued, retries reuse their id, successful writes are not resent', async()=>{
  const {writer,calls,setFailure}=writerFixture(); const errors=[];writer.onStatus((error)=>errors.push(error));
  setFailure({code:'PGRST202'});writer.enqueue(record());await writer.flush();
  assert.match(errors.at(-1),/máy chủ/);
  setFailure(null);await writer.flush();
  assert.equal(calls.at(-1).args.p_playback_id,'listen-1');
  const count=calls.length;await writer.flush();assert.equal(calls.length,count);
  assert.equal(errors.at(-1),null);
});

test('pending history is never sent as a different account', async()=>{
  const {writer,calls,setUser}=writerFixture();setUser('user-b');
  writer.enqueue(record());await writer.flush();assert.equal(calls.length,0);
  setUser('user-a');await writer.flush();assert.equal(calls.length,1);
  assert.equal(calls[0].args.p_user_id,'user-a');
});

test('player service captures final position and records before queue replacement, end and stop', async()=>{
  const {tracker,records,setClock}=trackerFixture();const engines=[];
  const {PlayerService}=loadModule('services/player-service.ts',{'./audio-service':{audioSynth:{isSupported:false}},'./audio-engine':{
    async configureAudioSession(){},
    createAudioEngine(source,callbacks,options){
      const state={position:0,duration:100,isPlaying:false,isBuffering:false};
      const engine={source,callbacks,options,state,getProgress:()=>({...state}),
        async load(){callbacks.onProgress({...state});},
        async play(){state.isPlaying=true;callbacks.onProgress({...state});},
        pause(){state.isPlaying=false;callbacks.onProgress({...state});},
        async seek(position){state.position=position;callbacks.onProgress({...state});},
        setVolume(){},dispose(){},
      };engines.push(engine);return engine;
    },
  }});
  const service=new PlayerService(tracker);
  const track=(id)=>({id,title:id,artist:'Test',cover:'',audioUrl:`https://example.test/${id}.mp3`});
  await service.load(track('first'),{moodId:'focus',stage:'focus'});await service.play();
  setClock(5.2);engines[0].state.position=5.2;
  await service.load(track('second')); // final 0.2 seconds captured without a periodic event
  assert.equal(records.length,1);assert.equal(records[0].trackId,'first');assert.equal(records[0].listenedSec,5);
  const second=engines.find(e=>e.source===track('second').audioUrl);
  await service.play();setClock(105.2);second.state.position=100;second.state.isPlaying=false;second.callbacks.onEnd();
  service.stop();assert.equal(records.length,2);assert.equal(records[1].endReason,'ended');
  service.dispose();
});
