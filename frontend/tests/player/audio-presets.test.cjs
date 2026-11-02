const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadModule } = require('./test-support.cjs');

const { presetForMoodActivity, SYNTH_PRESETS } = loadModule('services/audio-presets.ts');

test('mood and activity map to all five supported brainwave ranges', () => {
  assert.equal(presetForMoodActivity('night_serenade', 'deep_work'), 'meditation');
  assert.equal(presetForMoodActivity('calm_unwind', 'deep_work'), 'relax');
  assert.equal(presetForMoodActivity('deep_focus', 'deep_work'), 'deep-work');
  assert.equal(presetForMoodActivity('deep_focus', 'sleep'), 'sleep');
  assert.equal(presetForMoodActivity('energy_boost', 'deep_work'), 'energy');
  assert.equal(presetForMoodActivity('deep_focus', 'meditation'), 'meditation');
  assert.equal(presetForMoodActivity('deep_focus', 'workout'), 'energy');

  assert.ok(SYNTH_PRESETS.sleep.deltaHz >= 1 && SYNTH_PRESETS.sleep.deltaHz <= 4);
  assert.ok(SYNTH_PRESETS.meditation.deltaHz >= 4 && SYNTH_PRESETS.meditation.deltaHz <= 8);
  assert.ok(SYNTH_PRESETS.relax.deltaHz >= 8 && SYNTH_PRESETS.relax.deltaHz <= 13);
  assert.ok(SYNTH_PRESETS['deep-work'].deltaHz >= 13 && SYNTH_PRESETS['deep-work'].deltaHz <= 30);
  assert.ok(SYNTH_PRESETS.energy.deltaHz >= 30 && SYNTH_PRESETS.energy.deltaHz <= 40);
});
