const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');
const root = path.join(__dirname, '..');

function loadModule(file, mocks = {}, globals = {}, cache = new Map()) {
  file = path.resolve(root, file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const localRequire = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id.endsWith('.wav')) return id;
    if (id.startsWith('.')) return loadModule(path.resolve(path.dirname(file), `${id}.ts`), mocks, globals, cache);
    return require(id);
  };
  vm.runInNewContext(code, { module, exports: module.exports, require: localRequire, process, console, setTimeout, clearTimeout, URL, AbortController, ...globals }, { filename: file });
  return module.exports;
}

function fixture() {
  const engines = [];
  const { PlayerService, BINAURAL_MIX } = loadModule('services/player-service.ts', {
    './audio-engine': {
      configureAudioSession: async () => {},
      createAudioEngine(source, callbacks, options) {
        let reject;
        const engine = {
          source, callbacks, options, plays: 0, pauses: 0, disposed: false, volume: null, seeks: [],
          async load() {
            if (source.includes('slow')) return new Promise((_, fail) => { reject = fail; });
            if (source.includes('bad')) throw new Error('HTTP 404');
            callbacks.onProgress({ position: 0, duration: 12, isPlaying: false, isBuffering: false });
          },
          async play() { engine.plays++; callbacks.onProgress({ position: 0, duration: 12, isPlaying: true, isBuffering: false }); },
          pause() { engine.pauses++; },
          async seek(seconds) { engine.seeks.push(seconds); },
          setVolume(volume) { engine.volume = volume; },
          dispose() { engine.disposed = true; const error = new Error('cancelled'); error.name = 'AbortError'; reject?.(error); },
        };
        engines.push(engine);
        return engine;
      },
    },
  });
  return { service: new PlayerService(), engines, mix: BINAURAL_MIX };
}

const song = (name = 'song') => ({ title: name, artist: 'Test', cover: '', audioUrl: `https://example.test/${name}.mp3` });
const tick = () => new Promise((resolve) => setImmediate(resolve));

test('loads the actual URL and reports engine duration, position and playing state', async () => {
  const { service, engines } = fixture();
  const updates = [];
  service.onProgress((status) => updates.push(status));
  await service.load(song());
  assert.equal(engines[0].source, song().audioUrl);
  assert.equal(updates.at(-1).duration, 12);
  await service.play();
  assert.equal(updates.at(-1).isPlaying, true);
  engines[0].callbacks.onProgress({ position: 7.3, duration: 12, isPlaying: true, isBuffering: false });
  assert.equal(updates.at(-1).position, 7.3);
  service.dispose();
});

test('mixes looping binaural at 12% of music volume and pauses both layers', async () => {
  const { service, engines, mix } = fixture();
  await service.load(song());
  await service.play();
  await tick();
  assert.equal(engines[1].options.loop, true);
  service.setVolume(0.8);
  assert.equal(engines[0].volume, 0.8);
  assert.equal(engines[1].volume, 0.8 * mix);
  assert.equal(mix, 0.12);
  service.pause();
  assert.ok(engines[0].pauses > 0 && engines[1].pauses > 0);
  service.dispose();
});

test('seek clamps to real duration, ignores invalid values, volume clamps to 0..1', async () => {
  const { service, engines } = fixture();
  await service.load(song());
  await service.seek(-5); await service.seek(50); await service.seek(NaN);
  assert.deepEqual(engines[0].seeks, [0, 12]);
  service.setVolume(5); assert.equal(engines[0].volume, 1);
  service.setVolume(-1); assert.equal(engines[0].volume, 0);
  service.setVolume(NaN); assert.equal(engines[0].volume, 0);
  service.dispose();
});

test('switching tracks cancels a slow load and ignores old progress/end events', async () => {
  const { service, engines } = fixture();
  const slow = service.load(song('slow')).catch((error) => error.name);
  await tick();
  let ends = 0;
  service.onEnd(() => ends++);
  await service.load(song('next'));
  assert.equal(await slow, 'AbortError');
  assert.equal(engines[0].disposed, true);
  engines[0].callbacks.onEnd();
  assert.equal(ends, 0);
  engines[1].callbacks.onEnd();
  assert.equal(ends, 1);
  service.dispose();
});

test('end event can load and play the next song without a timer', async () => {
  const { service, engines } = fixture();
  await service.load(song('first'));
  let transition;
  service.onEnd(() => { transition = service.load(song('second')).then(() => service.play()); });
  engines[0].callbacks.onEnd();
  await transition;
  assert.equal(engines[1].source, song('second').audioUrl);
  assert.equal(engines[1].plays, 1);
  service.dispose();
});

test('stop during loading cancels it and releases all engines', async () => {
  const { service, engines } = fixture();
  const loading = service.load(song('slow')).catch((error) => error.name);
  await tick();
  service.stop();
  assert.equal(await loading, 'AbortError');
  assert.equal(service.hasTrack, false);
  assert.equal(engines[0].disposed, true);
});

test('failed MP3 leaves no loaded player and allows retry', async () => {
  const { service } = fixture();
  await assert.rejects(service.load(song('bad')), /404/);
  assert.equal(service.hasTrack, false);
  await service.load(song('retry'));
  assert.equal(service.hasTrack, true);
  service.dispose();
});

test('changing binaural preset releases old loop and does not reload music', async () => {
  const { service, engines } = fixture();
  await service.load(song()); await service.play(); await tick();
  await service.setPreset('sleep');
  assert.equal(engines[1].disposed, true);
  assert.match(engines[2].source, /sleep/);
  assert.equal(engines[0].disposed, false);
  service.dispose();
});

test('Storage paths are safely encoded, explicit URLs take priority, cloned tracks keep identity', () => {
  const { resolveTrackSource, trackKey } = loadModule('services/track-source.ts', {}, {
    process: { env: { EXPO_PUBLIC_SUPABASE_URL: 'https://project.supabase.co/', EXPO_PUBLIC_MUSIC_BUCKET: 'my music' } },
  });
  const track = { ...song(), audioUrl: undefined, storagePath: 'focus/bài #1.mp3' };
  assert.equal(resolveTrackSource(track), 'https://project.supabase.co/storage/v1/object/public/my%20music/focus/b%C3%A0i%20%231.mp3');
  assert.equal(resolveTrackSource(song()), song().audioUrl);
  assert.equal(trackKey(track), trackKey({ ...track, reason: 'Copy' }));
});

test('missing source is an actionable error', () => {
  const { resolveTrackSource } = loadModule('services/track-source.ts', {}, { process: { env: {} } });
  assert.throws(() => resolveTrackSource({ title: 'Missing' }), /chưa có nguồn MP3/);
  assert.throws(() => resolveTrackSource({ title: 'Demo', audioUrl: 'https://example.com/demo1.mp3' }), /link mẫu/);
});

test('database catalog maps audio_url and makes small libraries usable in every journey stage', () => {
  const { mapTrackCatalog } = loadModule('services/track-catalog.ts', { '../lib/supabase': {} });
  const catalog = mapTrackCatalog([
    { id: '1', title: 'First', artist: 'Artist', audio_url: 'https://project.supabase.co/song.mp3', duration: 65, energy: 0, pool_key: 'focus' },
    { id: '2', title: 'No audio' },
  ]);
  assert.equal(catalog.tracks.length, 1);
  assert.equal(catalog.tracks[0].audioUrl, 'https://project.supabase.co/song.mp3');
  assert.equal(catalog.tracks[0].duration, '1:05');
  assert.equal(catalog.tracks[0].energy, 0);
  assert.equal(catalog.pools.romantic[0].id, '1');
});

test('catalog validates placeholder config and distinguishes connection, permissions, auth and schema errors', () => {
  const { getSupabaseConfigurationError } = loadModule('lib/supabase-config.ts');
  assert.match(getSupabaseConfigurationError('https://your-project-id.supabase.co', 'test-key'), /giá trị mẫu/);
  assert.match(getSupabaseConfigurationError(undefined, undefined), /Thiếu cấu hình/);
  assert.match(getSupabaseConfigurationError('not-a-url', 'test-key'), /không phải URL/);
  assert.equal(getSupabaseConfigurationError('https://real-project.supabase.co', 'test-key'), null);
  const { describeCatalogError } = loadModule('services/track-catalog.ts', { '../lib/supabase': {} });
  assert.match(describeCatalogError({message:'Failed to fetch'}, 0), /Không kết nối/);
  assert.match(describeCatalogError({message:'Invalid API key'}, 401), /API key/);
  assert.match(describeCatalogError({message:'JWT expired'}, 401), /Đăng xuất/);
  assert.match(describeCatalogError({code:'42501'}, 403), /SELECT/);
  assert.match(describeCatalogError({code:'PGRST205'}, 404), /public.tracks/);
  assert.match(describeCatalogError({}, 0, true), /15 giây/);
});

test('catalog load uses configured Supabase project and preserves real failure details', async () => {
  let response = {data:[{id:'test',title:'Real source',audio_url:'https://project.supabase.co/song.mp3'}],error:null,status:200};
  let selectedTable;
  const query = {select() {return query;},limit() {return query;},async abortSignal() {return response;}};
  const { loadMusicCatalog } = loadModule('services/track-catalog.ts', {
    '../lib/supabase': {supabase: {from(table) {selectedTable=table;return query;}}},
  }, {process:{env:{EXPO_PUBLIC_SUPABASE_URL:'https://real-project.supabase.co',EXPO_PUBLIC_SUPABASE_ANON_KEY:'test-key'}}});
  assert.equal((await loadMusicCatalog()).tracks[0].id,'test');
  assert.equal(selectedTable,'tracks');
  response={data:null,error:{code:'42501',message:'permission denied'},status:403};
  await assert.rejects(loadMusicCatalog(), /SELECT/);
});

test('bundled binaural files are stereo PCM with correct 4 second duration', () => {
  for (const name of ['deep-work', 'relax', 'sleep']) {
    const wav = fs.readFileSync(path.join(root, 'assets/audio', `binaural-${name}.wav`));
    assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
    assert.equal(wav.readUInt16LE(22), 2);
    assert.equal(wav.readUInt32LE(24), 16000);
    assert.equal(wav.readUInt32LE(40) / wav.readUInt32LE(28), 4);
  }
});

test('web engine forwards real ended/error events and browser play rejection', async () => {
  let audio;
  class FakeAudio extends EventTarget {
    constructor() { super(); audio = this; this.duration = 11; this.currentTime = 0; this.paused = true; this.readyState = 4; }
    load() { if (this.src) this.dispatchEvent(new Event('loadedmetadata')); }
    async play() { if (this.blocked) throw new Error('NotAllowedError'); this.paused = false; this.dispatchEvent(new Event('playing')); }
    pause() { this.paused = true; this.dispatchEvent(new Event('pause')); }
    removeAttribute() { this.src = ''; }
  }
  const { createAudioEngine } = loadModule('services/audio-engine.web.ts', { 'expo-asset': {} }, { Audio: FakeAudio, navigator: {} });
  let ends = 0; let errors = 0; let latest;
  const engine = createAudioEngine('https://example.test/song.mp3', {
    onEnd: () => ends++, onError: () => errors++, onProgress: (status) => { latest = status; },
  });
  await engine.load();
  audio.blocked = true;
  await assert.rejects(engine.play(), /NotAllowedError/);
  audio.blocked = false;
  await engine.play();
  assert.equal(latest.isPlaying, true);
  audio.dispatchEvent(new Event('ended')); assert.equal(ends, 1);
  audio.dispatchEvent(new Event('error')); assert.equal(errors, 1);
  engine.dispose();
  audio.dispatchEvent(new Event('ended')); assert.equal(ends, 1);
});

test('native engine configures background audio, lockscreen metadata and de-duplicates finish events', async () => {
  let mode; let player; let options;
  const { configureAudioSession, createAudioEngine } = loadModule('services/audio-engine.ts', {
    'expo-audio': {
      async setAudioModeAsync(value) { mode = value; },
      createAudioPlayer(source, config) {
        options = config;
        player = {
          currentStatus: { isLoaded: true, duration: 17, currentTime: 0, playing: false },
          addListener(name, callback) { player.status = callback; return {remove() {player.unsubscribed = true;}}; },
          setActiveForLockScreen(active, metadata) {player.metadata = metadata;},
          clearLockScreenControls() {player.cleared = true;},
          play() {}, pause() {}, remove() {player.removed = true;},
          async seekTo(seconds) { player.seeked = seconds; },
        };
        return player;
      },
    },
  });
  await configureAudioSession();
  assert.equal(mode.shouldPlayInBackground, true);
  assert.equal(mode.playsInSilentMode, true);
  let ends = 0;
  const engine = createAudioEngine('https://example.test/song.mp3', {
    onProgress() {}, onError(error) {throw error;}, onEnd() {ends++;},
  }, {metadata: {title:'Song',artist:'Artist'}});
  await engine.load(); await engine.play();
  assert.equal(options.keepAudioSessionActive, true);
  assert.equal(player.metadata.title, 'Song');
  player.status({...player.currentStatus, didJustFinish:true});
  player.status({...player.currentStatus, didJustFinish:true});
  assert.equal(ends,1);
  await engine.seek(3); assert.equal(player.seeked,3);
  engine.dispose();
  assert.ok(player.removed && player.unsubscribed && player.cleared);
});
