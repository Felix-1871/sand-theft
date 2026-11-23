import test from 'node:test';
import assert from 'node:assert/strict';
import { AREAS, EQUIPMENT, HELPERS, PROGRAMS, PLANET_UPGRADES, UNIVERSE_UPGRADES } from '../dist/campaign.js';
import { createLocale } from '../dist/i18n.js';
import { debugGrant, debugJump, DEBUG_GRANT_LIMIT } from '../dist/debug.js';
import {
  advance, areaLimit, availableHouses, canMakeUniverse, collect, initialState, planetReward,
  restoreState, settlementOpen, universeOpen,
} from '../dist/engine.js';

test('Polish covers the full campaign catalog and formats numbers and plurals', () => {
  const polish = createLocale('pl');
  const catalog = [
    ...AREAS, ...EQUIPMENT, ...HELPERS, ...PROGRAMS, ...PROGRAMS.flatMap(path => path.tiers),
    ...Object.values(PLANET_UPGRADES), ...Object.values(UNIVERSE_UPGRADES),
  ];

  for (const entry of catalog) {
    for (const key of ['name', 'caption', 'description']) {
      if (entry[key]) assert.notEqual(polish.text(entry[key]), entry[key]);
    }
  }
  assert.equal(polish.format(1.25), '1,25');
  assert.equal(polish.count(1, 'house'), '1 dom');
  assert.equal(polish.count(22, 'house'), '22 domy');
  assert.equal(polish.count(12, 'planet'), '12 planet');
  assert.equal(polish.text('Area {0} of {1}', 2, 8), 'Obszar 2 z 8');
  assert.equal(createLocale('unsupported').text('Extraction'), 'Extraction');
});

test('debug travel restocks the selected area and enables the usual bonus-area progression', () => {
  const state = initialState();
  assert.equal(debugJump(state, -1), false);
  assert.ok(debugJump(state, 5));
  assert.equal(areaLimit(state), 8);
  assert.equal(state.remaining, AREAS[5].supply);
  assert.equal(planetReward(state), 1);
  assert.equal(collect(state, state.remaining), AREAS[5].supply);
  assert.equal(planetReward(state), 2);
  assert.ok(advance(state));
  assert.equal(state.area, 6);
});

test('debug grants expose the relevant layer and preserve valid save counters', () => {
  const state = initialState();
  assert.equal(debugGrant(state, 'sand', 0), false);
  assert.equal(debugGrant(state, 'sand', 1.5), false);
  assert.equal(debugGrant(state, 'sand', DEBUG_GRANT_LIMIT + 1), false);
  assert.equal(debugGrant(state, 'constructor', 1), false);
  assert.ok(debugGrant(state, 'sand', 1200));
  assert.ok(debugGrant(state, 'houses', 4));
  assert.ok(settlementOpen(state));
  assert.equal(availableHouses(state), 5);
  assert.ok(debugGrant(state, 'universes', 2));
  assert.ok(universeOpen(state));
  assert.equal(state.universes, 2);
  assert.equal(canMakeUniverse(state), false);
  assert.ok(debugGrant(state, 'planets', 18));
  assert.equal(state.planets, 18);
  assert.equal(state.planetsEarned, 18);
  assert.equal(canMakeUniverse(state), true);
  assert.deepEqual(restoreState(JSON.parse(JSON.stringify(state))), state);
});
