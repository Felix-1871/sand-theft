import test from 'node:test';
import assert from 'node:assert/strict';
import { AREAS, EQUIPMENT, HELPERS } from '../dist/campaign.js';
import {
  advance, areaLimit, assignFamilies, buildHouse, buyEquipment, buyPrestige, canAdvance, canMakeUniverse,
  collect, helperPrice, hireHelper, housePrice, initialState, isComplete, itemAvailable, makePlanet,
  makeUniverse, planetOpen, planetReward, production, restoreState, settlementOpen, totalHouses,
  availableHouses, assignedHouses, hasPlanetUpgrade, universeOpen,
} from '../dist/engine.js';

function clearThrough(state, target) {
  while (state.area <= target) {
    collect(state, AREAS[state.area].supply);
    if (state.area === target) return;
    assert.ok(advance(state), `area ${state.area + 1} can be entered`);
  }
}

function beginOffWorldRun() {
  const state = initialState();
  clearThrough(state, 4);
  assert.equal(makePlanet(state), 1);
  assert.ok(buyPrestige(state, 'planet', 'charter'));
  return state;
}

function unlockUniverse() {
  const state = beginOffWorldRun();
  clearThrough(state, 7);
  assert.equal(makePlanet(state), 8);
  assert.ok(buyPrestige(state, 'planet', 'census'));
  clearThrough(state, 7);
  assert.equal(makePlanet(state), 16);
  assert.ok(buyPrestige(state, 'planet', 'universe'));
  return state;
}

test('the playground starts with one grain per click and unlocks equipment by extraction rather than stash', () => {
  const state = initialState();
  assert.equal(production(state).click, 1);
  assert.equal(state.remaining, 100_000);
  assert.equal(settlementOpen(state), false);
  assert.equal(itemAvailable(state, EQUIPMENT[0]), true);
  assert.equal(itemAvailable(state, EQUIPMENT[1]), false);
  assert.equal(buyEquipment(state, 0), false);
  collect(state, 50);
  assert.ok(buyEquipment(state, 0));
  assert.equal(production(state).click, 2);
  assert.equal(state.sand, 0);
  assert.equal(state.remaining, 99_950);
  collect(state, 60);
  assert.equal(itemAvailable(state, EQUIPMENT[1]), true);
  assert.equal(buyEquipment(state, 1), false);
  collect(state, 35);
  assert.ok(buyEquipment(state, 1));
  assert.equal(buyEquipment(state, 1), false);
});

test('helpers can be hired repeatedly with exact price growth and bonuses apply to every hire', () => {
  const state = initialState();
  collect(state, 69);
  assert.equal(itemAvailable(state, HELPERS[0]), false);
  assert.equal(hireHelper(state, 0), false);
  collect(state, 4_000);
  for (const expected of [75, 102, 137, 185]) {
    assert.equal(helperPrice(state, 0), expected);
    assert.ok(hireHelper(state, 0));
  }
  assert.equal(production(state).perSecond, 4);
  assert.ok(buyEquipment(state, 3));
  assert.ok(buyEquipment(state, 6));
  assert.equal(production(state).perSecond, 8.64);
  assert.ok(hireHelper(state, 0));
  assert.equal(production(state).perSecond, 10.8);
});

test('fractional output carries forward, and extraction cannot overdraw or spill into the next area', () => {
  const state = initialState();
  assert.equal(collect(state, .75), 0);
  assert.equal(collect(state, .25), 1);
  assert.equal(collect(state, NaN), 0);
  assert.equal(collect(state, -4), 0);
  assert.equal(canAdvance(state), false);
  assert.equal(collect(state, 200_000), 99_999);
  assert.equal(collect(state, 5), 0);
  assert.equal(state.sand, 100_000);
  assert.equal(state.fraction, 0);
  assert.ok(advance(state));
  assert.equal(state.remaining, 14_000_000);
});

test('depletion alone opens the next area and preserves the whole run economy', () => {
  const state = initialState();
  collect(state, 100_000);
  assert.ok(buyEquipment(state, 0));
  assert.ok(hireHelper(state, 0));
  assert.ok(assignFamilies(state, 1, 0));
  assert.ok(buildHouse(state));
  const savedSand = state.sand;
  assert.ok(advance(state));
  assert.equal(state.sand, savedSand);
  assert.equal(production(state).click, 2);
  assert.equal(production(state).perSecond, 1.25);
  assert.equal(totalHouses(state), 2);
  assert.equal(assignedHouses(state), 1);
  assert.ok(buyEquipment(state, 1));
  assert.equal(itemAvailable(state, HELPERS[5]), false);
  collect(state, 560_000);
  assert.equal(itemAvailable(state, HELPERS[5]), true);
});

test('the original house can be assigned while new houses follow the rising price and permanent paths', () => {
  const state = initialState();
  assert.equal(buildHouse(state), false);
  assert.equal(assignFamilies(state, 2, 0), false);
  collect(state, 100_000);
  assert.equal(availableHouses(state), 1);
  assert.equal(housePrice(state), 1000);
  assert.ok(assignFamilies(state, 2, 0));
  assert.equal(totalHouses(state), 1);
  assert.equal(assignedHouses(state), 1);
  assert.equal(availableHouses(state), 0);
  assert.equal(assignFamilies(state, 2, 0), false);
  assert.equal(assignFamilies(state, 2, 2), false);
  for (const price of [900, 1125, 1350]) {
    assert.equal(housePrice(state), price);
    assert.ok(buildHouse(state));
  }
  assert.ok(assignFamilies(state, 2, 1));
  assert.ok(assignFamilies(state, 0, 0));
  assert.equal(availableHouses(state), 0);
  assert.equal(totalHouses(state), 4);
  assert.equal(housePrice(state), 1400);
  assert.equal(production(state).click, 3);
});

test('settlement, equipment, and Planet multipliers stack in their approved order', () => {
  const state = beginOffWorldRun();
  clearThrough(state, 4);
  for (const id of [0, 3, 6, 9]) assert.ok(buyEquipment(state, id));
  for (let i = 0; i < 44; i++) assert.ok(buildHouse(state));
  for (let path = 0; path < 3; path++) {
    for (let tier = 0; tier < 4; tier++) assert.ok(assignFamilies(state, path, tier));
  }
  assert.equal(totalHouses(state), 45);
  assert.equal(availableHouses(state), 0);
  assert.equal(housePrice(state), 6000);
  assert.equal(helperPrice(state, 0), 49);
  assert.ok(hireHelper(state, 0));
  assert.equal(helperPrice(state, 0), 66);
  const output = production(state);
  assert.equal(output.click, (1 + 1 + 2) * 3 * 4);
  assert.ok(Math.abs(output.perSecond - 2 * 1.17 * 1.7 * 4) < 1e-12);
});

test('desert depletion offers the first optional reset and spending the first planet preserves its boost', () => {
  const state = initialState();
  clearThrough(state, 3);
  assert.equal(planetOpen(state), false);
  assert.equal(makePlanet(state), 0);
  assert.ok(advance(state));
  collect(state, 1);
  assert.equal(planetOpen(state), false);
  collect(state, AREAS[4].supply);
  assert.equal(planetReward(state), 1);
  assert.equal(areaLimit(state), 5);
  assert.equal(canAdvance(state), false);
  assert.ok(buyEquipment(state, 0));
  assert.ok(hireHelper(state, 0));
  assert.ok(buildHouse(state));
  assert.ok(assignFamilies(state, 0, 0));
  assert.equal(makePlanet(state), 1);
  assert.equal(state.remaining, 100_000);
  assert.equal(state.sand, 0);
  assert.deepEqual(state.equipment, []);
  assert.ok(state.helpers.every(count => count === 0));
  assert.equal(settlementOpen(state), false);
  assert.equal(state.housesBuilt, 0);
  assert.equal(planetOpen(state), true);
  assert.ok(buyPrestige(state, 'planet', 'charter'));
  assert.equal(areaLimit(state), 8);
  assert.equal(state.planets, 0);
  assert.equal(production(state).click, 4);
});

test('a Planet payout comes from the deepest fully cleared area, with or without the Census', () => {
  const state = beginOffWorldRun();
  clearThrough(state, 6);
  assert.equal(planetReward(state), 4);
  assert.ok(advance(state));
  collect(state, 1000);
  assert.equal(planetReward(state), 4);
  assert.equal(makePlanet(state), 4);
  assert.ok(buyPrestige(state, 'planet', 'census'));
  clearThrough(state, 4);
  assert.equal(planetReward(state), 2);
  assert.ok(advance(state));
  assert.equal(planetReward(state), 2);
  clearThrough(state, 7);
  assert.equal(planetReward(state), 16);
});

test('the Universe permit keeps the current run active and the first reset clears ordinary Planet upgrades', () => {
  const state = unlockUniverse();
  assert.equal(state.planets, 2);
  assert.ok(buyPrestige(state, 'planet', 'gravity'));
  collect(state, 1000);
  assert.equal(state.remaining, 99_000);
  assert.equal(universeOpen(state), true);
  assert.ok(makeUniverse(state));
  assert.equal(state.remaining, 100_000);
  assert.equal(state.planets, 0);
  assert.equal(state.planetsThisUniverse, 0);
  assert.equal(state.planetsEarned, 25);
  assert.equal(state.universes, 1);
  assert.equal(production(state).click, 76);
  assert.equal(hasPlanetUpgrade(state, 'census'), false);
  assert.equal(hasPlanetUpgrade(state, 'gravity'), false);
  assert.equal(hasPlanetUpgrade(state, 'charter'), true);
  assert.equal(universeOpen(state), true);
  assert.equal(makeUniverse(state), false);
});

test('the Archive restores the Census, and the Office allows a single Saturn run every Universe', () => {
  const state = unlockUniverse();
  assert.ok(makeUniverse(state));
  assert.ok(buyPrestige(state, 'universe', 'archive'));
  assert.equal(hasPlanetUpgrade(state, 'census'), true);
  assert.equal(buyPrestige(state, 'planet', 'census'), false);
  clearThrough(state, 7);
  assert.equal(makePlanet(state), 16);
  assert.equal(canMakeUniverse(state), false);
  assert.ok(buyPrestige(state, 'planet', 'subsidy'));
  clearThrough(state, 4);
  assert.equal(makePlanet(state), 2);
  assert.equal(state.planets, 16);
  assert.ok(makeUniverse(state));
  assert.equal(hasPlanetUpgrade(state, 'census'), true);
  assert.equal(hasPlanetUpgrade(state, 'subsidy'), false);
  assert.ok(buyPrestige(state, 'universe', 'office'));
  const payouts = [];
  for (let area = 4; area < 8; area++) {
    clearThrough(state, area);
    payouts.push(planetReward(state));
  }
  assert.deepEqual(payouts, [4, 6, 10, 18]);
  assert.equal(makePlanet(state), 18);
  assert.ok(makeUniverse(state));
});

test('Portable Settlement retains assigned and empty homes through both kinds of reset without duplicating the original', () => {
  const state = unlockUniverse();
  assert.ok(makeUniverse(state));
  assert.equal(settlementOpen(state), false);
  assert.ok(buyPrestige(state, 'universe', 'original'));
  assert.equal(totalHouses(state), 1);
  assert.ok(assignFamilies(state, 2, 0));
  clearThrough(state, 7);
  assert.equal(makePlanet(state), 8);
  assert.equal(totalHouses(state), 1);
  assert.equal(assignedHouses(state), 0);
  assert.ok(buyPrestige(state, 'planet', 'census'));
  clearThrough(state, 7);
  assert.equal(makePlanet(state), 16);
  assert.ok(makeUniverse(state));
  assert.ok(buyPrestige(state, 'universe', 'portable'));
  clearThrough(state, 7);
  assert.ok(assignFamilies(state, 2, 0));
  assert.ok(buildHouse(state));
  assert.ok(buildHouse(state));
  assert.equal(housePrice(state), 1350);
  assert.equal(makePlanet(state), 8);
  assert.equal(availableHouses(state), 2);
  assert.equal(assignedHouses(state), 1);
  assert.ok(buyPrestige(state, 'planet', 'census'));
  clearThrough(state, 7);
  assert.equal(makePlanet(state), 16);
  assert.ok(makeUniverse(state));
  assert.equal(totalHouses(state), 3);
  assert.equal(availableHouses(state), 2);
  assert.equal(assignedHouses(state), 1);
  assert.equal(housePrice(state), 1350);
});

test('the complete campaign requires six Universes, and the final upgrade survives a reload', () => {
  const state = unlockUniverse();
  assert.ok(makeUniverse(state));
  assert.ok(buyPrestige(state, 'universe', 'archive'));
  for (let cycle = 1; cycle <= 5; cycle++) {
    clearThrough(state, 7);
    assert.equal(makePlanet(state), cycle < 3 ? 16 : 18);
    if (cycle < 3) {
      clearThrough(state, 4);
      assert.equal(makePlanet(state), 2);
    }

    assert.equal(buyPrestige(state, 'universe', 'roof'), false);
    assert.ok(makeUniverse(state));
    if (cycle === 1) assert.ok(buyPrestige(state, 'universe', 'original'));
    if (cycle === 2) assert.ok(buyPrestige(state, 'universe', 'office'));
    if (cycle === 3) assert.ok(buyPrestige(state, 'universe', 'portable'));
  }
  assert.equal(state.universesEarned, 6);
  assert.equal(state.universes, 2);
  assert.ok(buyPrestige(state, 'universe', 'roof'));
  const restored = restoreState(JSON.parse(JSON.stringify(state)));
  assert.equal(isComplete(restored), true);
  assert.equal(collect(restored, 500), 0);
  assert.equal(buildHouse(restored), false);
  assert.equal(makeUniverse(restored), false);
});

test('a valid partial run restores exactly without adding elapsed production', () => {
  const state = beginOffWorldRun();
  clearThrough(state, 0);
  assert.ok(advance(state));
  collect(state, 20.75);
  assert.deepEqual(restoreState(JSON.parse(JSON.stringify(state))), state);
  assert.deepEqual(restoreState({ version: 1, sand: null }), initialState());
});
