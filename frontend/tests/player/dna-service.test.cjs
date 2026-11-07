const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { loadModule } = require('./test-support.cjs');

test('Audius listening contributes to genres and rhythm without making up missing scores',()=>{
 const {aggregateDNA}=loadModule('services/dna-service.ts',{'@/lib/supabase':{}});
 const p=aggregateDNA([{listened_sec:20,completed:true,tracks:{genre:'R&B/Soul',track_features:{bpm:132,energy:null,valence:null,acousticness:null,instrumentalness:null}}}]);
 assert.equal(p.hasHistory,true);assert.equal(p.listeningSeconds,20);assert.equal(p.scores.rhythm,58);
 assert.equal(p.scores.energy,50);assert.equal(p.scoreCoverage.energy,0);assert.equal(p.scoreCoverage.rhythm,100);
 assert.equal(p.genreDistribution.find(g=>g.genre==='Khác').value,100);
});

test('DNA loads tracks without requiring primary_mood_id and retains feature scores', async () => {
  let selection;
  const records = [{ listened_sec: 60, completed: true, tracks: {
    genre: 'Ambient', track_features: {
      energy: 0.8, valence: 0.4, acousticness: 0.6,
      binaural: true, bpm: 120, instrumentalness: 0.9,
    },
  } }];
  const query = {
    select(value) { selection = value; return query; },
    eq() { return query; }, gte() { return query; }, gt() { return query; },
    order() { return query; }, async range() { return { data: records, error: null }; },
  };
  const { computeDNA } = loadModule('services/dna-service.ts', {
    '@/lib/supabase': { supabase: {
      auth: { getSession: async () => ({ data: { session: { user: { id: 'test-user' } } }, error: null }) },
      from: () => query,
    } },
  }, { localStorage: { getItem: () => null } });
  const result = await computeDNA('test-user');
  assert.ok(result.hasHistory);
  assert.deepEqual(JSON.parse(JSON.stringify(result.scores)), {
    energy: 80, depth: 60, frequency: 100, rhythm: 50, focus: 90,
  });
  assert.ok(!selection.includes('primary_mood_id'));
  // Both authentication paths must use the same schema-compatible projection.
  const backend = fs.readFileSync(path.resolve(__dirname, '../../../backend/index.js'), 'utf8');
  assert.ok(backend.includes(`.select('${selection}')`));
});
