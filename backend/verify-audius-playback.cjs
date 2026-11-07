// Live browser integration probe: real media playback + production synth, muted output.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawn}=require('node:child_process');
const express=require('express');
const ts=require('../frontend/node_modules/typescript');
const root=path.resolve(__dirname,'../frontend/services');
const sources={};
for(const name of ['player-service','audio-service','audio-presets','audio-engine.types','track-source','audio-engine','audius-search-service','backend-session','listening-history-tracker']){
  sources[name]=ts.transpileModule(fs.readFileSync(path.join(root,name==='audio-engine'?'audio-engine.web.ts':`${name}.ts`),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
}
const html=`<body><pre id="result">pending</pre><script>
const sources=${JSON.stringify(sources)},cache={};
function load(id){if(id==='react-native')return {Platform:{OS:'web'}};if(id==='expo-asset')return {};const key=id.split('/').pop();if(cache[key])return cache[key].exports;const m={exports:{}};cache[key]=m;new Function('exports','require',sources[key])(m.exports,load);return m.exports;}
window.verification=(async()=>{
 const response=await fetch('/api/audius/search?q='+encodeURIComponent('Sơn Tùng M-TP'));const payload=await response.json();if(!response.ok||!payload.data?.length)throw Error(payload.error||'No tracks');
 const song=payload.data[0];const {PlayerService}=load('player-service');const {audioSynth}=load('audio-service');
 const records=[];const {ListeningHistoryTracker}=load('listening-history-tracker');
 const player=new PlayerService(new ListeningHistoryTracker(r=>records.push(r)));player.setHistoryUser('browser-probe-user');
 let progress;player.onProgress(p=>progress=p);const errors=[];player.onError(e=>errors.push(e.message));
 await player.load({id:'browser-probe-track',title:song.title,artist:song.artist,cover:song.cover,audioUrl:song.audioUrl});await player.play();
 const wait=ms=>new Promise(r=>setTimeout(r,ms));await wait(3500);
 const playing=progress?.isPlaying && progress.position>0 && progress.duration>0;
 await player.setPreset('energy');await wait(2500);
 const frequencies=audioSynth.binauralVoices.map(v=>Math.round(v.oscillator.frequency.value));
 const chordVoices=audioSynth.ambientVoices.length;
 await player.seek(10);await wait(700);const seekPosition=progress?.position;
 player.pause();await audioSynth.operationQueue;await wait(100);const paused=!progress?.isPlaying&&audioSynth.context.state==='suspended';
 player.dispose();await wait(100);
 const result={title:song.title,playing,frequencies,chordVoices,seekPosition,paused,errors,historyRecords:records.length,listenedSec:records[0]?.listenedSec};
 result.passed=!!playing&&frequencies[1]-frequencies[0]===35&&chordVoices===3&&seekPosition>=10&&paused&&errors.length===0&&records.length===1&&records[0].listenedSec>=5;
 document.getElementById('result').textContent=JSON.stringify(result);
})().catch(e=>document.getElementById('result').textContent=JSON.stringify({passed:false,error:e.message}));
</script>`;
const app=express(),config=require('./config').loadConfig();
require('./audius-search-route')(app,{apiKey:config.AUDIUS_API_KEY,apiUrl:config.AUDIUS_API_URL||undefined});
app.get('/',(_req,res)=>res.type('html').send(html));
const server=app.listen(0,'127.0.0.1',()=>void run());
async function run(){
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'moodflow-audius-browser-'));
 const child=spawn(process.env.SYNTH_TEST_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe',[
   '--headless','--disable-gpu','--mute-audio','--autoplay-policy=no-user-gesture-required','--no-first-run',`--user-data-dir=${profile}`,'--remote-debugging-pipe'],{stdio:['ignore','ignore','ignore','pipe','pipe']});
 let seq=0,pending='';const waiting=new Map();
 child.stdio[4].on('data',chunk=>{pending+=chunk;let end;while((end=pending.indexOf('\0'))>=0){const m=JSON.parse(pending.slice(0,end));pending=pending.slice(end+1);if(m.id){waiting.get(m.id)?.(m);waiting.delete(m.id);}}});
 const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++seq;waiting.set(id,m=>m.error?reject(m.error):resolve(m.result));child.stdio[3].write(JSON.stringify({id,method,params,sessionId})+'\0');});
 const timer=setTimeout(()=>{console.error('Browser playback probe timed out');child.kill();server.close();process.exitCode=1;},55000);
 try{
   const {targetId}=await send('Target.createTarget',{url:'about:blank'});const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
   await send('Runtime.enable',{},sessionId);await send('Page.enable',{},sessionId);
   await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`},sessionId);
   let value;
   for(let i=0;i<100;i++){const r=await send('Runtime.evaluate',{expression:'window.verification ? window.verification.then(()=>document.getElementById("result").textContent) : null',awaitPromise:true,returnByValue:true},sessionId);value=r.result?.value;if(value)break;await new Promise(r=>setTimeout(r,100));}
   console.log(value);if(!JSON.parse(value).passed)process.exitCode=1;
 }catch(e){console.error(e);process.exitCode=1;}finally{clearTimeout(timer);child.kill();server.close();}
}
