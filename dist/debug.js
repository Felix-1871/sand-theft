import { AREAS } from './campaign.js';
import { areaLimit, hasPlanetUpgrade, isComplete } from './engine.js';

export const DEBUG_GRANT_LIMIT = 1_000_000_000_000_000;

export function debugJump(state, area) {
  if (!Number.isInteger(area) || !AREAS[area] || isComplete(state)) return false;
  if (area >= areaLimit(state)) state.planetUpgrades.push('charter');
  state.area = area;
  state.remaining = AREAS[area].supply;
  state.fraction = 0;
  return true;
}

const resourceFields = {
  sand: ['sand'],
  houses: ['housesBuilt'],
  planets: ['planets', 'planetsEarned', 'planetsThisUniverse'],
  universes: ['universes', 'universesEarned'],
};

export function debugGrant(state, resource, amount) {
  if (isComplete(state) || !Number.isSafeInteger(amount) || amount < 1 ||
      !Object.hasOwn(resourceFields, resource)) return false;

  const fields = resourceFields[resource];
  if (fields.some(key => state[key] + amount > DEBUG_GRANT_LIMIT)) return false;

  for (const key of fields) state[key] += amount;
  if (resource === 'universes' && !hasPlanetUpgrade(state, 'universe')) {
    state.planetUpgrades.push('universe');
  }
  return true;
}
