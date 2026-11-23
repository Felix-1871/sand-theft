import { AREAS, EQUIPMENT, HELPERS, PROGRAMS, PLANET_UPGRADES, UNIVERSE_UPGRADES } from './campaign.js';
import {
  initialState, restoreState, isComplete, collect, areaLimit, canAdvance, advance, itemAvailable,
  production, buyEquipment, helperPrice, hireHelper, settlementOpen, totalHouses, availableHouses,
  assignedHouses, housePrice, buildHouse, assignFamilies, planetOpen, universeOpen, planetReward,
  payoutForArea, extractionMultiplier, hasPlanetUpgrade, hasUniverseUpgrade, makePlanet, canMakeUniverse,
  makeUniverse, canBuyPrestige, buyPrestige, PLANETS_PER_UNIVERSE,
} from './engine.js';
import { sceneArt, houseArt } from './art.js';
import { createLocale } from './i18n.js';
import { debugGrant, debugJump, DEBUG_GRANT_LIMIT } from './debug.js';

const debugMode = new URLSearchParams(window.location.search).get('debug') === '1';
const SAVE_KEY = debugMode ? 'sand-theft-glass-housing-program-debug-v1' : 'sand-theft-glass-housing-program-v1';
const LANGUAGE_KEY = 'sand-theft-language';
const $ = id => document.getElementById(id);
let locale = createLocale(readStorage(LANGUAGE_KEY));
const fmt = value => locale.format(value);
const tr = (key, ...args) => locale.text(key, ...args);
const homes = value => locale.count(value, 'house');
const planetCount = value => locale.count(value, 'planet');
const universeCount = value => locale.count(value, 'universe');
const labels = [];
const langSelect = $('language');

for (const node of document.querySelectorAll('[data-i18n]')) labels.push([node, node.textContent.trim()]);
for (const [marker, attribute] of [['aria', 'aria-label'], ['title', 'title']]) {
  for (const node of document.querySelectorAll(`[data-i18n-${marker}]`)) {
    labels.push([node, node.getAttribute(attribute), attribute]);
  }
}

let state = load();
let activeTab = 'extraction';
let shop = 'equipment';
let sceneKey = '';
let last = performance.now();
let pendingReset = null;
let soundOn = true;
let audio;
let saveUnavailable = false;
let notice = null;
let debugNotice = null;

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function load() {
  try {
    return restoreState(JSON.parse(readStorage(SAVE_KEY)));
  } catch {
    return initialState();
  }
}

function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    if (!saveUnavailable) notify('Browser storage is unavailable. Keep this page open to retain your progress.');
    saveUnavailable = true;
  }
}

function playSound(kind) {
  if (!soundOn) return;
  try {
    audio ??= new AudioContext();
    const now = audio.currentTime;
    const note = audio.createOscillator();
    const volume = audio.createGain();
    note.type = 'triangle';
    note.frequency.value = kind === 'click' ? 310 : 590;
    note.frequency.exponentialRampToValueAtTime(kind === 'click' ? 220 : 790, now + 0.08);
    volume.gain.setValueAtTime(0.035, now);
    volume.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    note.connect(volume).connect(audio.destination);
    note.start(now);
    note.stop(now + 0.15);
  } catch {
    // Audio is optional, including when the browser restricts playback.
  }
}

function setText(node, value) {
  if (node.textContent !== value) node.textContent = value;
}

function noticeText() {
  return notice?.() ?? tr('Cezary’s crew is ready to start.');
}

function notify(message) {
  notice = typeof message === 'function' ? message : () => tr(message);
  setText($('field-note'), noticeText());
  setText($('status'), noticeText());
}

function localize(node, key) {
  labels.push([node, key]);
  setText(node, tr(key));
}

function renderLanguage() {
  document.documentElement.lang = locale.language;
  langSelect.value = locale.language;
  document.title = tr('Sand Theft · The Glass Housing Program');
  document.querySelector('meta[name="description"]').content =
    tr("Cezary Baryka's glass housing program starts with a shovel and a public playground.");
  for (const [node, key, attribute] of labels) {
    if (attribute) node.setAttribute(attribute, tr(key));
    else setText(node, tr(key));
  }
  setText($('field-note'), noticeText());
  setText($('status'), notice ? noticeText() : '');
  if (debugMode && debugNotice) setText($('debug-status'), debugNotice());
}

function offer(name, detail, action) {
  const button = document.createElement('button');
  button.className = 'offer';
  button.type = 'button';
  const copy = document.createElement('span');
  copy.className = 'offer-copy';
  const title = document.createElement('strong');
  localize(title, name);
  const description = document.createElement('small');
  description.textContent = tr(detail);
  const price = document.createElement('span');
  price.className = 'offer-price';
  copy.append(title, description);
  button.append(copy, price);
  button.addEventListener('click', action);
  return { button, description, price };
}

function updateOffer(card, { cost, owned = false, enabled = false, detail }) {
  card.button.disabled = owned || !enabled;
  card.button.classList.toggle('owned', owned);
  setText(card.price, cost);
  if (detail !== undefined) setText(card.description, detail);
}

function equipmentEffect(item) {
  if (item.effect === 'manual') {
    return tr(item.value === 1 ? '+{0} grain per click' : '+{0} grains per click', fmt(item.value));
  }
  if (item.effect === 'crew') return tr('+{0}% to all helper output', fmt(item.value));
  return tr('+{0} grains/sec per hire of {1}', fmt(item.value), tr(HELPERS[item.helper].name));
}

function programEffect(program) {
  if (program.manual) return tr('+{0} grains per click', fmt(program.manual));
  if (program.manualPercent) return tr('+{0}% sand per click', fmt(program.manualPercent));
  if (program.helperPercent) return tr('+{0}% helper output', fmt(program.helperPercent));
  if (program.hireDiscount) return tr('{0}% cheaper hires', fmt(program.hireDiscount));
  return tr('{0}% cheaper houses', fmt(program.houseDiscount));
}

function act(action, message) {
  tick();
  if (!action()) return false;
  if (message) notify(message);
  playSound('buy');
  render();
  save();
  return true;
}

function makeShop(list, data, helpers) {
  const cards = [];
  const groups = AREAS.map(area => {
    const group = document.createElement('div');
    group.className = 'shop-group';
    const title = document.createElement('h3');
    localize(title, area.name);
    group.append(title);
    return group;
  });
  data.forEach((item, id) => {
    const card = offer(item.name, '', () => act(
      () => helpers ? hireHelper(state, id) : buyEquipment(state, id),
      () => tr(helpers ? 'Hired: {0}.' : 'Bought: {0}.', tr(item.name)),
    ));
    cards.push(card);
    groups[item.area].append(card.button);
  });
  list.append(...groups.slice().reverse());
  return { cards, groups };
}

function makePrograms() {
  return PROGRAMS.map(({ name, tiers }, path) => {
    const section = document.createElement('section');
    section.className = 'card program';
    const heading = document.createElement('h2');
    localize(heading, name);
    section.append(heading);
    const cards = tiers.map((tier, id) => {
      const card = offer(tier.name, '', () => act(() => assignFamilies(state, path, id)));
      section.append(card.button);
      return card;
    });
    $('programs').append(section);
    return cards;
  });
}

function makeTree(layer, data) {
  return Object.entries(data).map(([id, upgrade]) => {
    const card = offer(upgrade.name, upgrade.description, () => act(
      () => buyPrestige(state, layer, id),
      () => tr('Purchased: {0}.', tr(upgrade.name)),
    ));
    $(`${layer}-tree`).append(card.button);
    return { id, upgrade, card };
  });
}

function makePayouts() {
  return AREAS.map((area, id) => {
    if (area.planetReward === 0) return null;
    const row = document.createElement('div');
    const title = document.createElement('dt');
    localize(title, area.name);
    const value = document.createElement('dd');
    row.append(title, value);
    $('payouts').append(row);
    return { row, value, id };
  }).filter(Boolean);
}

const tabs = {
  extraction: () => true,
  settlement: () => settlementOpen(state),
  planet: () => planetOpen(state),
  universe: () => universeOpen(state),
};
const shops = {
  equipment: makeShop($('equipment-list'), EQUIPMENT, false),
  helpers: makeShop($('helpers-list'), HELPERS, true),
};
const programCards = makePrograms();
const planetCards = makeTree('planet', PLANET_UPGRADES);
const universeCards = makeTree('universe', UNIVERSE_UPGRADES);
const payouts = makePayouts();

function updateTabs() {
  if (!tabs[activeTab]()) activeTab = 'extraction';
  for (const [id, available] of Object.entries(tabs)) {
    const selected = id === activeTab;
    const tab = $(`tab-${id}`);
    tab.hidden = !available();
    tab.tabIndex = selected ? 0 : -1;
    tab.setAttribute('aria-selected', String(selected));
    $(`panel-${id}`).hidden = !selected;
  }
}

function selectTab(id, focus = false) {
  if (isComplete(state) || !tabs[id]()) return;
  activeTab = id;
  render();
  if (focus) $(`tab-${id}`).focus();
}

function areaDepleted() {
  if (state.area === 0) return tr('Playground emptied. Visit Glass Settlement or continue to the beach.');
  if (state.area === 4) return tr('Desert emptied. Glass Planet prestige is available.');
  return tr('{0} emptied.', tr(AREAS[state.area].name));
}

function extract(amount) {
  const before = state.remaining;
  const taken = collect(state, amount);
  if (before > 0 && state.remaining === 0) {
    notify(areaDepleted);
    save();
  }
  return taken;
}

function tick() {
  const now = performance.now();
  const elapsed = Math.max(0, (now - last) / 1000);
  last = now;
  if (!document.hidden && state.remaining > 0 && !isComplete(state) && state.helpers.some(Boolean)) {
    extract(elapsed * production(state).perSecond);
  }
}

function renderShop(output) {
  const helpers = shop === 'helpers';
  const { cards, groups } = shops[shop];
  const data = helpers ? HELPERS : EQUIPMENT;
  const visibleGroups = new Set();
  let nextUnlock = Infinity;
  data.forEach((item, id) => {
    const card = cards[id];
    const show = itemAvailable(state, item);
    card.button.hidden = !show;
    if (!show) {
      if (item.area === state.area) nextUnlock = Math.min(nextUnlock, item.at);
      return;
    }
    visibleGroups.add(item.area);
    const cost = helpers ? helperPrice(state, id) : item.cost;
    const owned = !helpers && state.equipment.includes(id);
    updateOffer(card, {
      cost: owned ? tr('Owned') : tr('{0} sand', fmt(cost)),
      enabled: state.sand >= cost,
      owned,
      detail: helpers ? tr('{0} grains/sec each · {1} hired', fmt(output.helpers[id]), fmt(state.helpers[id])) :
        equipmentEffect(item),
    });
  });
  groups.forEach((group, id) => { group.hidden = !visibleGroups.has(id); });
  const hint = $('shop-hint');
  hint.hidden = nextUnlock === Infinity;
  if (!hint.hidden) setText(hint, tr('Next item at {0} grains extracted here.', fmt(nextUnlock)));
}

function renderExtraction(output) {
  const area = AREAS[state.area];
  setText($('area-name'), tr(area.name));
  setText($('area-count'), tr('Area {0} of {1}', fmt(state.area + 1), fmt(areaLimit(state))));
  setText($('caption'), tr(area.caption));
  setText($('remaining'), `${fmt(state.remaining)} / ${fmt(area.supply)}`);
  const bar = $('remaining-bar');
  bar.max = area.supply;
  bar.value = state.remaining;
  const level = state.remaining === 0 ? 2 : state.remaining <= area.supply / 2 ? 1 : 0;
  const key = `${state.area}-${level}-${locale.language}`;
  if (sceneKey !== key) {
    const art = $('scene-art');
    const existing = [0, 1, null, 3, 2][state.area];
    const custom = { 2: 'quarry', 5: 'moon', 6: 'mars', 7: 'saturn' };
    art.innerHTML = existing == null ? '' : sceneArt(existing, level, tr('DESERT'));
    art.className = custom[state.area] ? `scene-art scene-${custom[state.area]}` : 'scene-art';
    art.dataset.level = level;
    sceneKey = key;
  }
  setText($('click-output'), tr('+{0} per click', fmt(output.click)));
  $('gather').hidden = state.remaining === 0;
  $('advance').hidden = !canAdvance(state);
  if (canAdvance(state)) setText($('advance'), tr('Continue to {0}', tr(AREAS[state.area + 1].name)));
  $('go-planet').hidden = state.remaining !== 0 || canAdvance(state);
  renderShop(output);
}

function renderSettlement() {
  const available = availableHouses(state);
  setText($('total-homes'), fmt(totalHouses(state)));
  setText($('available-homes'), fmt(available));
  setText($('assigned-homes'), fmt(assignedHouses(state)));
  const cost = housePrice(state);
  setText($('house-cost'), tr('{0} sand', fmt(cost)));
  $('build-house').disabled = state.sand < cost;
  PROGRAMS.forEach(({ tiers }, path) => tiers.forEach((tier, id) => {
    const level = state.programs[path];
    const owned = level > id;
    const unlocked = level >= id;
    const detail = programEffect(tier) + (unlocked ? '' : ` · ${tr('Requires {0}', tr(tiers[id - 1].name))}`);
    updateOffer(programCards[path][id], {
      detail, owned, enabled: unlocked && available >= tier.homes,
      cost: owned ? tr('Assigned') : homes(tier.homes),
    });
  }));
}

function renderTree(layer, cards) {
  const tree = layer === 'planet' ? PLANET_UPGRADES : UNIVERSE_UPGRADES;
  const isOwned = layer === 'planet' ? hasPlanetUpgrade : hasUniverseUpgrade;
  for (const { id, upgrade, card } of cards) {
    const owned = isOwned(state, id);
    const unmet = (upgrade.requires ?? []).filter(key => !isOwned(state, key));
    const unit = layer === 'planet' ? planetCount(upgrade.cost) : universeCount(upgrade.cost);
    const description = tr(upgrade.description);
    const detail = unmet.length === 0 ? description :
      `${description} ${tr('Requires {0}', unmet.map(key => tr(tree[key].name)).join(', '))}.`;
    updateOffer(card, {
      detail, owned, enabled: canBuyPrestige(state, layer, id), cost: owned ? tr('Owned') : unit,
    });
  }
}

function renderPlanet() {
  setText($('planet-balance'), fmt(state.planets));
  setText($('lifetime-planets'), fmt(state.planetsEarned));
  setText($('planet-boost'), `${fmt(extractionMultiplier(state))}×`);
  const reward = planetReward(state);
  $('planet-reset').disabled = reward === 0;
  setText($('planet-hint'), reward ? tr('Reset this run for {0}.', planetCount(reward)) :
    tr('Empty the desert to earn a payout this run.'));
  if (pendingReset === 'planet') setText($('confirm-action'), tr('Reset for {0}', planetCount(reward)));
  payouts.forEach(({ row, value, id }) => {
    row.hidden = id >= areaLimit(state);
    setText(value, planetCount(payoutForArea(state, id)));
  });
  renderTree('planet', planetCards);
}

function renderUniverse() {
  setText($('universe-balance'), fmt(state.universes));
  setText($('lifetime-universes'), fmt(state.universesEarned));
  $('universe-meter').hidden = state.universesEarned === 0;
  setText($('universe-progress'), `${fmt(state.planetsThisUniverse)} / ${PLANETS_PER_UNIVERSE}`);
  $('universe-bar').value = Math.min(state.planetsThisUniverse, PLANETS_PER_UNIVERSE);
  $('universe-reset').disabled = !canMakeUniverse(state);
  setText($('universe-hint'), tr(state.universesEarned === 0 ? 'Your first Universe is ready.' :
    'Earn 18 planets between Universe resets. Spent planets count.'));
  renderTree('universe', universeCards);
}

function render() {
  const complete = isComplete(state);
  const revealEnding = complete && $('ending').hidden;
  $('campaign').hidden = complete;
  $('ending').hidden = !complete;
  if (debugMode) {
    $('debug-jump').querySelector('button').disabled = complete;
    $('debug-grant').querySelector('button').disabled = complete;
    $('debug-empty').disabled = complete || state.remaining === 0;
  }
  setText($('sand'), fmt(state.sand));
  if (complete) {
    setText($('rate'), '0');
    if (revealEnding) $('ending-title').focus();
    return;
  }

  const output = production(state);
  setText($('rate'), fmt(state.remaining === 0 ? 0 : output.perSecond));
  updateTabs();
  if (activeTab === 'extraction') renderExtraction(output);
  if (activeTab === 'settlement') renderSettlement();
  if (activeTab === 'planet') renderPlanet();
  if (activeTab === 'universe') renderUniverse();
}

function confirmReset(layer) {
  tick();
  const planet = layer === 'planet';
  const reward = planetReward(state);
  if (planet ? !reward : !canMakeUniverse(state)) return;
  pendingReset = layer;
  const dialog = $('confirm-dialog');
  const settlement = tr(hasUniverseUpgrade(state, 'portable') ? 'Your settlement carries over.' : 'Your settlement is reset.');
  let message = tr('Start over at the playground with your sand, equipment, and helpers reset.') + ' ' + settlement;
  if (!planet) message += ' ' + tr('Your spendable planets and ordinary Planet upgrades also reset.');
  setText($('confirm-title'), tr(planet ? 'Make a Glass Planet?' : 'Make a Glass Universe?'));
  setText($('confirm-copy'), message);
  setText($('confirm-action'), tr('Reset for {0}', planet ? planetCount(reward) : universeCount(1)));
  dialog.showModal();
}

function announceDebug(message) {
  debugNotice = message;
  setText($('debug-status'), message());
}

$('confirm-dialog').addEventListener('cancel', () => { pendingReset = null; });
$('confirm-dialog').querySelector('form').addEventListener('submit', event => {
  event.preventDefault();
  const layer = pendingReset;
  pendingReset = null;
  $('confirm-dialog').close();
  if (!layer || event.submitter?.value !== 'accept') return;
  if (layer === 'debug') {
    if (!debugMode) return;
    state = initialState();
    last = performance.now();
    activeTab = 'extraction';
    notice = null;
    $('debug-area').value = '0';
    renderLanguage();
    render();
    save();
    announceDebug(() => tr('Test run restarted.'));
    return;
  }
  act(() => {
    const reward = layer === 'planet' ? makePlanet(state) : makeUniverse(state);
    if (!reward) return false;
    activeTab = 'extraction';
    notify(() => layer === 'planet' ? tr('Earned {0}. The playground is full again.', planetCount(reward)) :
      tr('Earned 1 Glass Universe. The playground is full again.'));
    return true;
  });
  if (activeTab === 'extraction') $('gather').focus();
});

for (const id of Object.keys(tabs)) {
  $(`tab-${id}`).addEventListener('click', () => selectTab(id));
}

$('tabs').addEventListener('keydown', event => {
  const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
  if (!keys.includes(event.key)) return;
  const visible = Object.keys(tabs).filter(id => tabs[id]());
  const position = visible.indexOf(activeTab);
  const next = { ArrowLeft: (position + visible.length - 1) % visible.length,
    ArrowRight: (position + 1) % visible.length, Home: 0, End: visible.length - 1 };
  event.preventDefault();
  selectTab(visible[next[event.key]], true);
});

for (const category of Object.keys(shops)) {
  $(`show-${category}`).addEventListener('click', () => {
    shop = category;
    for (const item of Object.keys(shops)) {
      $(`${item}-list`).hidden = item !== shop;
      $(`show-${item}`).setAttribute('aria-pressed', String(item === shop));
    }
    render();
  });
}

$('gather').addEventListener('click', () => {
  tick();
  const before = state.remaining;
  extract(production(state).click);
  if (state.remaining < before) playSound('click');
  render();
  if (before > 0 && state.remaining === 0) {
    $(canAdvance(state) ? 'advance' : 'go-planet').focus();
  }
});

$('advance').addEventListener('click', () => {
  if (act(() => advance(state))) {
    const name = AREAS[state.area].name;
    notify(() => tr('Crew moved to {0}.', tr(name)));
    $('gather').focus();
  }
});

$('go-planet').addEventListener('click', () => selectTab('planet', true));
$('build-house').addEventListener('click', () => act(() => buildHouse(state)));
$('planet-reset').addEventListener('click', () => confirmReset('planet'));
$('universe-reset').addEventListener('click', () => confirmReset('universe'));
$('sound-toggle').addEventListener('click', event => {
  soundOn = !soundOn;
  event.currentTarget.setAttribute('aria-pressed', String(soundOn));
  setText(event.currentTarget, soundOn ? '♪' : '♩');
});

function setupDebugMenu() {
  if (!debugMode) return;
  $('debug-menu').hidden = false;
  const areaSelect = $('debug-area');
  AREAS.forEach((area, id) => {
    const option = document.createElement('option');
    option.value = id;
    localize(option, area.name);
    areaSelect.append(option);
  });
  areaSelect.value = state.area;
  $('debug-amount').max = DEBUG_GRANT_LIMIT;

  $('debug-jump').addEventListener('submit', event => {
    event.preventDefault();
    const id = Number(areaSelect.value);
    if (act(() => {
      if (!debugJump(state, id)) return false;
      activeTab = 'extraction';
      notice = null;
      setText($('field-note'), noticeText());
      setText($('status'), '');
      return true;
    })) announceDebug(() => tr('Area loaded: {0}.', tr(AREAS[id].name)));
  });
  $('debug-empty').addEventListener('click', () => {
    if (act(() => extract(state.remaining) > 0)) {
      announceDebug(() => tr('Current area emptied.'));
    }
  });
  $('debug-grant').addEventListener('submit', event => {
    event.preventDefault();
    const resource = $('debug-resource');
    const kind = resource.value;
    const label = labels.find(([node]) => node === resource.selectedOptions[0])[1];
    const amount = $('debug-amount').valueAsNumber;
    if (act(() => debugGrant(state, kind, amount))) {
      announceDebug(() => tr('Added {0} · {1}.', fmt(amount), tr(label)));
    } else {
      announceDebug(() => tr('Enter a positive whole number within the allowed range.'));
    }
  });
  $('debug-restart').addEventListener('click', () => {
    pendingReset = 'debug';
    const dialog = $('confirm-dialog');
    setText($('confirm-title'), tr('Restart test run'));
    setText($('confirm-copy'), tr('Restart the test run and clear its progress?'));
    setText($('confirm-action'), tr('Restart test run'));
    dialog.showModal();
  });
}

document.addEventListener('visibilitychange', () => {
  last = performance.now();
  if (document.hidden) save();
});
window.addEventListener('pagehide', save);
setInterval(() => {
  tick();
  if (!document.hidden && !isComplete(state)) render();
}, 150);
setInterval(save, 2000);

langSelect.addEventListener('change', () => {
  locale = createLocale(langSelect.value);
  try {
    localStorage.setItem(LANGUAGE_KEY, locale.language);
  } catch {
    // The language can still change when storage is blocked.
  }
  renderLanguage();
  render();
});

$('settlement-art').innerHTML = houseArt(0);
setupDebugMenu();
renderLanguage();
if (state.remaining === 0 && !isComplete(state)) notify(areaDepleted);
render();
