const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadModule } = require('./test-support.cjs');

const constants = loadModule('constants/moodflow.ts');
const { generateJourney } = loadModule('services/journey-generator.ts', {
  '@/constants/moodflow': constants,
});
const { normalizeSavedJourney } = loadModule('services/journey-library.ts');
const { mapTrackCatalog } = loadModule('services/track-catalog.ts', { '../lib/supabase': {} });
const { presetForMoodActivity } = loadModule('services/audio-presets.ts');

test('real catalog tracks fill all four journey stages introduced by main', () => {
  const catalog = mapTrackCatalog([
    { id: 'quiet', title: 'Quiet', audio_url: 'https://audio.test/quiet.mp3', energy: 20 },
    { id: 'lively', title: 'Lively', audio_url: 'https://audio.test/lively.mp3', energy: 80 },
  ]);
  const journey = generateJourney({
    moodFrom: constants.moodById('deep_focus'), moodTo: constants.moodById('calm_unwind'),
    activity: 'deep_work', duration: 30, trackPool: catalog.pools,
  });
  assert.equal(journey.stages.length, 4);
  assert.equal(journey.totalMin, 30);
  assert.equal(journey.moodFromId, 'deep_focus');
  assert.equal(journey.moodToId, 'calm_unwind');
  for (const stage of journey.stages) {
    assert.ok(stage.tracks.length > 0, stage.key);
    for (const track of stage.tracks) assert.ok(catalog.tracks.some((source) => source.id === track.id && source.audioUrl === track.audioUrl));
  }
});

test('empty catalog cannot generate tracks without an audio source', () => {
  const journey = generateJourney({
    moodFrom: constants.MOODS[0], moodTo: constants.MOODS[1],
    activity: 'deep_work', duration: 30, trackPool: {},
  });
  assert.ok(journey.stages.every((stage) => stage.tracks.length === 0));
});

test('saved journey keeps its selected songs and identity while restoring real audio', () => {
  const raw = {
    id: 'saved-journey', mood_from: 'deep_focus', mood_to: 'calm_unwind', duration_minutes: 30,
    stages: [{ key: 'custom', title: 'Saved stage', tracks: [
      { id: 'second', title: 'Second', artist: 'Artist', audioUrl: 'expired-url' },
      { title: 'Legacy', artist: 'Artist' },
    ] }],
  };
  const selected = normalizeSavedJourney(raw, [
    { id: 'first', title: 'First', artist: 'Artist', audioUrl: 'https://audio.test/first.mp3' },
    { id: 'second', title: 'Second', artist: 'Artist', audioUrl: 'https://audio.test/second.mp3' },
    { id: 'legacy', title: 'Legacy', artist: 'Artist', audioUrl: 'https://audio.test/legacy.mp3' },
  ]);
  assert.equal(selected.id, raw.id);
  assert.equal(selected.moodFromId, raw.mood_from);
  assert.equal(selected.stages.length, 1);
  assert.equal(selected.stages[0].title, 'Saved stage');
  assert.equal(selected.stages[0].key, 'custom');
  assert.equal(selected.stages[0].tracks[0].id, 'second');
  assert.equal(selected.stages[0].tracks[0].audioUrl, 'https://audio.test/second.mp3');
  assert.equal(selected.stages[0].tracks[1].id, 'legacy');
  assert.equal(raw.stages[0].tracks[0].audioUrl, 'expired-url');
});

test('new mood and activity IDs select the appropriate binaural layer', () => {
  assert.equal(presetForMoodActivity('deep_focus', 'deep_work'), 'deep-work');
  assert.equal(presetForMoodActivity('calm_unwind', 'deep_work'), 'relax');
  assert.equal(presetForMoodActivity('deep_focus', 'meditation'), 'meditation');
  assert.equal(presetForMoodActivity('deep_focus', 'sleep'), 'sleep');
});
