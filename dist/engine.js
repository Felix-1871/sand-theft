import { AREAS, EQUIPMENT, HELPERS, PROGRAMS, PLANET_UPGRADES, UNIVERSE_UPGRADES } from './campaign.js';

const DESERT = 4;
const PLANETS_PER_UNIVERSE = 18;

function freshRun() {
  return {
    area: 0,
    remaining: AREAS[0].supply,
    sand: 0,
    fraction: 0,
    equipment: [],
    helpers: HELPERS.map(() => 0),
    housesBuilt: 0,
    programs: PROGRAMS.map(() => 0),
  };
}

export function initialState() {
  return {
    version: 1,
    ...freshRun(),
    planets: 0,
    planetsEarned: 0,
    planetsThisUniverse: 0,
    censusPurchased: false,
    planetUpgrades: [],
    universes: 0,
    universesEarned: 0,
    universeUpgrades: [],
  };
}

const isCount = value => Number.isSafeInteger(value) && value >= 0;

function validList(values, validItem) {
  return Array.isArray(values) && new Set(values).size === values.length && values.every(validItem);
}

export function restoreState(saved) {
  if (
    saved?.version !== 1 ||
    !isCount(saved.area) || !AREAS[saved.area] ||
    !isCount(saved.remaining) || saved.remaining > AREAS[saved.area].supply ||
    !Number.isFinite(saved.fraction) || saved.fraction < 0 || saved.fraction >= 1 ||
    !['sand', 'housesBuilt', 'planets', 'planetsEarned', 'planetsThisUniverse',
      'universes', 'universesEarned'].every(key => isCount(saved[key])) ||
    saved.planets > saved.planetsEarned || saved.planetsThisUniverse > saved.planetsEarned ||
    saved.universes > saved.universesEarned ||
    !validList(saved.equipment, id => isCount(id) && !!EQUIPMENT[id]) ||
    !Array.isArray(saved.helpers) || saved.helpers.length !== HELPERS.length ||
    !saved.helpers.every(value => isCount(value) && value <= 256) ||
    !Array.isArray(saved.programs) || saved.programs.length !== PROGRAMS.length ||
    !saved.programs.every((value, id) => isCount(value) && value <= PROGRAMS[id].tiers.length) ||
    !validList(saved.planetUpgrades, id => typeof id === 'string' && Object.hasOwn(PLANET_UPGRADES, id)) ||
    !validList(saved.universeUpgrades, id => typeof id === 'string' && Object.hasOwn(UNIVERSE_UPGRADES, id)) ||
    typeof saved.censusPurchased !== 'boolean' ||
    assignedHouses(saved) > totalHouses(saved)
  ) {
    return initialState();
  }

  return saved;
}

export const hasUniverseUpgrade = (state, id) => state.universeUpgrades.includes(id);

export function hasPlanetUpgrade(state, id) {
  return state.planetUpgrades.includes(id) ||
    (id === 'census' && hasUniverseUpgrade(state, 'archive') && state.censusPurchased);
}

export const isComplete = state => hasUniverseUpgrade(state, 'roof');
export const settlementOpen = state =>
  state.area > 0 || state.remaining === 0 || state.housesBuilt > 0 || hasUniverseUpgrade(state, 'original');
export const universeOpen = state => hasPlanetUpgrade(state, 'universe');

export function areaLimit(state) {
  return hasPlanetUpgrade(state, 'charter') ? AREAS.length : DESERT + 1;
}

export function canAdvance(state) {
  return !isComplete(state) && state.remaining === 0 && state.area + 1 < areaLimit(state);
}

export function advance(state) {
  if (!canAdvance(state)) return false;
  state.area++;
  state.remaining = AREAS[state.area].supply;
  state.fraction = 0;
  return true;
}

export function collect(state, amount) {
  if (isComplete(state) || state.remaining === 0 || !Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  const pending = amount + state.fraction;
  const whole = Math.floor(pending);
  const taken = Math.min(whole, state.remaining);
  state.remaining -= taken;
  state.sand += taken;
  state.fraction = state.remaining === 0 ? 0 : pending - whole;
  return taken;
}

export function itemAvailable(state, item) {
  return item.area < state.area ||
    (item.area === state.area && AREAS[state.area].supply - state.remaining >= item.at);
}

function activePrograms(state, path) {
  return PROGRAMS[path].tiers.slice(0, state.programs[path]);
}

function programBonus(state, path, property) {
  return activePrograms(state, path).reduce((sum, tier) => sum + (tier[property] ?? 0), 0);
}

export function extractionMultiplier(state) {
  return (1 + 3 * state.planetsEarned) * (hasPlanetUpgrade(state, 'gravity') ? 1.25 : 1);
}

export function production(state) {
  let manual = 1 + programBonus(state, 0, 'manual');
  let crewPercent = 0;
  const helperBase = HELPERS.map(helper => helper.output);
  for (const id of state.equipment) {
    const upgrade = EQUIPMENT[id];
    if (upgrade.effect === 'manual') manual += upgrade.value;
    if (upgrade.effect === 'crew') crewPercent += upgrade.value;
    if (upgrade.effect === 'helper') helperBase[upgrade.helper] += upgrade.value;
  }

  const boost = extractionMultiplier(state);
  const helperMultiplier = (1 + crewPercent / 100) *
    (1 + programBonus(state, 1, 'helperPercent') / 100) * boost;
  const helperRate = helperBase.map(base => base * helperMultiplier);

  return {
    click: manual * (1 + programBonus(state, 0, 'manualPercent') / 100) * boost,
    helpers: helperRate,
    perSecond: state.helpers.reduce((sum, count, id) => sum + count * helperRate[id], 0),
  };
}

export function buyEquipment(state, id) {
  const upgrade = EQUIPMENT[id];
  if (
    !upgrade || isComplete(state) || state.equipment.includes(id) ||
    !itemAvailable(state, upgrade) || state.sand < upgrade.cost
  ) return false;

  state.sand -= upgrade.cost;
  state.equipment.push(id);
  return true;
}

function roundedPrice(numerator, denominator) {
  const cost = (numerator + denominator - 1n) / denominator;
  return cost > BigInt(Number.MAX_SAFE_INTEGER) ? Infinity : Number(cost);
}

export function helperPrice(state, id) {
  const count = BigInt(state.helpers[id]);
  const discount = programBonus(state, 1, 'hireDiscount');
  return roundedPrice(BigInt(HELPERS[id].cost) * 135n ** count * BigInt(100 - discount), 100n ** (count + 1n));
}

export function hireHelper(state, id) {
  const helper = HELPERS[id];
  if (!helper || isComplete(state) || !itemAvailable(state, helper)) return false;
  const cost = helperPrice(state, id);
  if (state.sand < cost) return false;

  state.sand -= cost;
  state.helpers[id]++;
  return true;
}

export const totalHouses = state => settlementOpen(state) ? 1 + state.housesBuilt : 0;

export function assignedHouses(state) {
  return PROGRAMS.reduce((sum, _, path) =>
    sum + activePrograms(state, path).reduce((total, tier) => total + tier.homes, 0), 0);
}

export const availableHouses = state => totalHouses(state) - assignedHouses(state);

export function housePrice(state) {
  const base = 1000n + 250n * BigInt(state.housesBuilt);
  const discount = programBonus(state, 2, 'houseDiscount');
  const subsidy = hasPlanetUpgrade(state, 'subsidy') ? 80n : 100n;
  return roundedPrice(base * BigInt(100 - discount) * subsidy, 10000n);
}

export function buildHouse(state) {
  if (!settlementOpen(state) || isComplete(state)) return false;
  const cost = housePrice(state);
  if (state.sand < cost) return false;

  state.sand -= cost;
  state.housesBuilt++;
  return true;
}

export function assignFamilies(state, path, tier) {
  const program = PROGRAMS[path]?.tiers[tier];
  if (
    !program || !settlementOpen(state) || isComplete(state) ||
    state.programs[path] !== tier || availableHouses(state) < program.homes
  ) return false;

  state.programs[path]++;
  return true;
}

export function payoutForArea(state, area) {
  const base = AREAS[area]?.planetReward ?? 0;
  if (base === 0 || !hasPlanetUpgrade(state, 'census')) return base;
  return base * 2 + (hasUniverseUpgrade(state, 'office') ? 2 : 0);
}

export function planetReward(state) {
  const cleared = state.remaining > 0 ? state.area - 1 : state.area;
  return payoutForArea(state, cleared);
}

export const planetOpen = state => state.planetsEarned > 0 || planetReward(state) > 0;

function resetRun(state) {
  const next = freshRun();
  if (hasUniverseUpgrade(state, 'portable')) {
    next.housesBuilt = state.housesBuilt;
    next.programs = state.programs;
  }
  Object.assign(state, next);
}

export function makePlanet(state) {
  const reward = planetReward(state);
  if (reward === 0 || isComplete(state)) return 0;

  state.planets += reward;
  state.planetsEarned += reward;
  state.planetsThisUniverse += reward;
  resetRun(state);
  return reward;
}

export function canMakeUniverse(state) {
  return !isComplete(state) && universeOpen(state) &&
    (state.universesEarned === 0 || state.planetsThisUniverse >= PLANETS_PER_UNIVERSE);
}

export function makeUniverse(state) {
  if (!canMakeUniverse(state)) return false;

  state.universes++;
  state.universesEarned++;
  state.planets = 0;
  state.planetsThisUniverse = 0;
  state.planetUpgrades = state.planetUpgrades.filter(id => id === 'charter' || id === 'universe');
  resetRun(state);
  return true;
}

export function canBuyPrestige(state, layer, id) {
  if (isComplete(state) || (layer !== 'planet' && layer !== 'universe')) return false;
  const planet = layer === 'planet';
  if (!(planet ? planetOpen(state) : universeOpen(state))) return false;

  const tree = planet ? PLANET_UPGRADES : UNIVERSE_UPGRADES;
  if (!Object.hasOwn(tree, id)) return false;
  const owned = planet ? hasPlanetUpgrade : hasUniverseUpgrade;
  const { cost, requires = [] } = tree[id];
  const balance = planet ? state.planets : state.universes;
  return !owned(state, id) && balance >= cost && requires.every(other => owned(state, other));
}

export function buyPrestige(state, layer, id) {
  if (!canBuyPrestige(state, layer, id)) return false;

  if (layer === 'planet') {
    state.planets -= PLANET_UPGRADES[id].cost;
    state.planetUpgrades.push(id);
    if (id === 'census') state.censusPurchased = true;
  } else {
    state.universes -= UNIVERSE_UPGRADES[id].cost;
    state.universeUpgrades.push(id);
  }

  return true;
}

export { PLANETS_PER_UNIVERSE };
