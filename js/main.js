// Käynnistys, näytöt ja valikot.
import { Store } from './storage.js';
import { AudioEngine } from './audio.js';
import { Game } from './game.js';
import { attachInput } from './input.js';
import { THEMES, themeForLevel, themeIndexForLevel, themeById } from './themes.js';
import { drawLeia, drawGhost, drawDiamond, drawCoin, drawSparkle, drawDressIcon } from './sprites.js';
import { DRESSES, dressById } from './dresses.js';

const $ = (id) => document.getElementById(id);
const store = new Store();
// Joka käynnistyksellä aloitetaan kentästä 1. Aarteet, kolikot ja asetukset säilyvät.
// Pelin oma päivityslataus (alla) ei nollaa kenttää.
let keepLevel = false;
try {
  keepLevel = sessionStorage.getItem('labyrintti-reload') === '1';
  sessionStorage.removeItem('labyrintti-reload');
} catch (e) { /* ei sessionStoragea */ }
if (!keepLevel) {
  store.data.level = 1;
  store.save();
}
const audio = new AudioEngine(store);
const canvas = $('game');
const game = new Game(canvas, audio, { onLevelComplete });
const outfit = () => dressById(store.data.dress);
game.outfit = outfit();
attachInput(canvas, game);

let base = 'start'; // start | game | treasure | wardrobe | celebrate
let parentOpen = false;
let parentLevel = 1;

// ---------------------------------------------------------------- vaikein kenttä
// Kun vaikein kenttä on läpäisty, peli tekee uusia samantasoisia kenttiä.
// Maailma vaihtuu silti joka kerta, jotta kentät näyttävät erilaisilta.
const CAP_MAX = 20;
let capRepeat = 0;
const capOf = () => {
  const c = store.data.cap;
  return Number.isInteger(c) && c >= 1 ? Math.min(c, CAP_MAX) : null;
};
function themeFor(n) {
  const cap = capOf();
  if (cap && n === cap && capRepeat > 0) return THEMES[(themeIndexForLevel(n) + capRepeat) % THEMES.length];
  return themeForLevel(n);
}
function startLevel(n) {
  game.startLevel(n, themeFor(n));
}

// ---------------------------------------------------------------- näyttöjen vaihto
function refresh() {
  $('screen-start').classList.toggle('hidden', base !== 'start');
  $('screen-treasure').classList.toggle('hidden', base !== 'treasure');
  $('screen-wardrobe').classList.toggle('hidden', base !== 'wardrobe');
  $('screen-celebrate').classList.toggle('hidden', base !== 'celebrate');
  $('hud').classList.toggle('hidden', base !== 'game');
  $('screen-parent').classList.toggle('hidden', !parentOpen);
  game.active = base === 'game' && !parentOpen;
  applyThemeColors();
}

function reloadForUpdate() {
  try { sessionStorage.setItem('labyrintti-reload', '1'); } catch (e) { /* ok */ }
  location.reload();
}

function setBase(b) {
  if (b === 'start' && updateReady) {
    reloadForUpdate();
    return;
  }
  base = b;
  refresh();
  if (b === 'start') renderStart();
}

function applyThemeColors() {
  const T = base === 'game' || base === 'celebrate' ? game.theme || themeFor(store.data.level) : themeFor(store.data.level);
  document.documentElement.style.setProperty('--bg1', T.bg[0]);
  document.documentElement.style.setProperty('--bg2', T.bg[1]);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', T.bg[1]);
}

function renderStart() {
  const T = themeFor(store.data.level);
  $('start-level').textContent = `Kenttä ${store.data.level} · ${T.name}`;
  $('diamond-count').textContent = String(store.data.diamonds.length);
  const chip = $('chip-diamond');
  const cx = chip.getContext('2d');
  cx.clearRect(0, 0, 64, 64);
  drawDiamond(cx, 32, 34, 50, T.diamond, 0.6);
  const dc = $('chip-dress').getContext('2d');
  dc.clearRect(0, 0, 64, 64);
  drawDressIcon(dc, 32, 32, 56, outfit(), 0.6);
  $('coin-count').textContent = String(store.data.coins);
  drawCoinIcons();
}

function drawCoinIcons() {
  document.querySelectorAll('canvas.coin-icon').forEach((c) => {
    const x = c.getContext('2d');
    x.clearRect(0, 0, c.width, c.height);
    drawCoin(x, c.width / 2, c.height / 2, c.width * 0.8, 1);
  });
}

// ---------------------------------------------------------------- pelin kulku
function playCurrent() {
  const lvl = store.data.level;
  if (game.level && game.state === 'play' && game.levelNum === lvl) {
    audio.startMusic(game.theme);
  } else {
    startLevel(lvl);
  }
  setBase('game');
}

function onLevelComplete({ level, coins, theme }) {
  store.data.coins += coins;
  store.data.diamonds.push({ level, theme: theme.id });
  const cap = capOf();
  const atCap = cap && level >= cap;
  const next = atCap ? cap : level + 1;
  capRepeat = atCap ? capRepeat + 1 : 0;
  store.data.level = next;
  store.data.maxLevel = Math.max(store.data.maxLevel, next);
  store.save();
  const row = $('celebrate-coins');
  row.innerHTML = '';
  for (let i = 0; i < Math.min(coins, 16); i++) {
    const el = document.createElement('i');
    el.style.animationDelay = `${0.4 + i * 0.08}s`;
    row.appendChild(el);
  }
  celebrateT = 0;
  setBase('celebrate');
  audio.fanfare();
}

// ---------------------------------------------------------------- napit
$('btn-play').addEventListener('click', () => {
  audio.unlock();
  audio.tap();
  playCurrent();
});

$('btn-home').addEventListener('click', () => {
  if (game.state !== 'play') return;
  audio.tap();
  audio.stopMusic();
  setBase('start');
});

$('btn-next').addEventListener('click', () => {
  audio.tap();
  startLevel(store.data.level);
  setBase('game');
});

$('btn-treasure').addEventListener('click', () => {
  audio.unlock();
  audio.tap();
  renderTreasure();
  setBase('treasure');
});

$('btn-treasure-back').addEventListener('click', () => {
  audio.tap();
  setBase('start');
});

function renderTreasure() {
  const stats = $('treasure-stats');
  stats.innerHTML = '';
  const mk = (draw, value) => {
    const span = document.createElement('span');
    const c = document.createElement('canvas');
    c.width = 68;
    c.height = 68;
    draw(c.getContext('2d'));
    span.appendChild(c);
    span.appendChild(document.createTextNode(String(value)));
    stats.appendChild(span);
  };
  mk((x) => drawDiamond(x, 34, 36, 54, '#3fb8ff', 0.6), store.data.diamonds.length);
  mk((x) => drawCoin(x, 34, 34, 52, 1), store.data.coins);

  const grid = $('treasure-grid');
  grid.innerHTML = '';
  if (!store.data.diamonds.length) {
    const p = document.createElement('div');
    p.className = 'empty-note';
    p.textContent = 'Haamun timantit tulevat tänne!';
    grid.appendChild(p);
    return;
  }
  for (const d of store.data.diamonds.slice().reverse()) {
    const T = themeById(d.theme);
    const el = document.createElement('div');
    el.className = 'gem';
    const c = document.createElement('canvas');
    c.width = 112;
    c.height = 112;
    drawDiamond(c.getContext('2d'), 56, 60, 88, T.diamond, 0.6);
    el.appendChild(c);
    el.appendChild(document.createTextNode(String(d.level)));
    grid.appendChild(el);
  }
}

// ---------------------------------------------------------------- vaatekaappi
let wardrobeSel = store.data.dress;
let wardrobeT = 0;
let wardrobeJoy = 0;
let wardrobeParticles = [];

$('btn-wardrobe').addEventListener('click', () => {
  audio.unlock();
  audio.tap();
  wardrobeSel = store.data.dress;
  renderWardrobe(true);
  setBase('wardrobe');
});
$('btn-wardrobe-back').addEventListener('click', () => {
  audio.tap();
  setBase('start');
});

function renderWardrobe(scrollToSelected = false) {
  $('wallet-value').textContent = String(store.data.coins);
  drawCoinIcons();
  const grid = $('dress-grid');
  grid.innerHTML = '';
  for (const d of DRESSES) {
    const owned = store.data.owned.includes(d.id);
    const btn = document.createElement('button');
    btn.className = 'dress-card' + (owned ? ' owned' : '') + (d.id === wardrobeSel ? ' selected' : '') + (d.id === store.data.dress ? ' worn' : '');
    btn.setAttribute('aria-label', d.name);
    const c = document.createElement('canvas');
    c.className = 'leia';
    c.width = 140;
    c.height = 168;
    drawLeia(c.getContext('2d'), 70, 96, 128, { t: 0.4, outfit: d, noShadow: true });
    btn.appendChild(c);
    const price = document.createElement('span');
    price.className = 'price';
    if (owned) {
      price.textContent = d.id === store.data.dress ? '✓ päällä' : '✓';
    } else {
      const ci = document.createElement('canvas');
      ci.width = 36;
      ci.height = 36;
      drawCoin(ci.getContext('2d'), 18, 18, 30, 1);
      price.appendChild(ci);
      price.appendChild(document.createTextNode(String(d.price)));
    }
    btn.appendChild(price);
    btn.addEventListener('click', () => {
      audio.tap();
      wardrobeSel = d.id;
      wardrobeJoy = 0.6;
      renderWardrobe();
    });
    grid.appendChild(btn);
    if (scrollToSelected && d.id === wardrobeSel) requestAnimationFrame(() => btn.scrollIntoView({ block: 'nearest' }));
  }
  updateWardrobeAction();
}

function updateWardrobeAction() {
  const d = dressById(wardrobeSel);
  const owned = store.data.owned.includes(d.id);
  const worn = store.data.dress === d.id;
  const coins = store.data.coins;
  const btn = $('btn-dress-action');
  $('dress-name').textContent = d.name;
  btn.className = 'action-btn';
  btn.innerHTML = '';
  btn.classList.remove('hidden');
  $('dress-progress').classList.add('hidden');
  if (worn) {
    btn.classList.add('worn');
    btn.textContent = '✓ Päällä';
  } else if (owned) {
    btn.classList.add('wear');
    btn.textContent = 'Pue päälle';
  } else if (coins >= d.price) {
    const ci = document.createElement('canvas');
    ci.width = 64;
    ci.height = 64;
    drawCoin(ci.getContext('2d'), 32, 32, 54, 1);
    btn.appendChild(document.createTextNode('Osta'));
    btn.appendChild(ci);
    btn.appendChild(document.createTextNode(String(d.price)));
  } else {
    btn.classList.add('hidden');
    $('dress-progress').classList.remove('hidden');
    $('dress-progress-fill').style.width = `${Math.round((coins / d.price) * 100)}%`;
    $('dress-progress-text').textContent = `${coins} / ${d.price}`;
  }
}

$('btn-dress-action').addEventListener('click', () => {
  const d = dressById(wardrobeSel);
  const owned = store.data.owned.includes(d.id);
  if (store.data.dress === d.id) return;
  if (!owned) {
    if (store.data.coins < d.price) return;
    store.data.coins -= d.price;
    store.data.owned.push(d.id);
    audio.purchase();
    wardrobeJoy = 2.5;
    wardrobeConfetti();
  } else {
    audio.wear();
    wardrobeJoy = 1.2;
  }
  store.data.dress = d.id;
  store.save();
  game.outfit = outfit();
  renderWardrobe();
});

function wardrobeConfetti() {
  const cols = ['#ff4d6d', '#ffbe0b', '#3a86ff', '#2ec27e', '#ff5fa2', '#9b5de5', '#ffffff'];
  for (let i = 0; i < 60; i++) {
    const a = Math.random() * Math.PI * 2, sp = 80 + Math.random() * 180;
    wardrobeParticles.push({
      x: 0.5, y: 0.45, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, life: 1.6 + Math.random(),
      size: 5 + Math.random() * 6, color: cols[i % cols.length], rot: Math.random() * 6, spark: i % 4 === 0,
    });
  }
}

function drawWardrobePreview(dt) {
  wardrobeT += dt;
  if (wardrobeJoy > 0) wardrobeJoy -= dt;
  const { ctx, w, h } = fitCanvas($('wardrobe-preview'));
  if (!w) return;
  ctx.clearRect(0, 0, w, h);
  const d = dressById(wardrobeSel);
  const gr = ctx.createRadialGradient(w / 2, h * 0.55, 0, w / 2, h * 0.55, w * 0.5);
  gr.addColorStop(0, 'rgba(255,255,255,0.85)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, w, h);
  const joy = wardrobeJoy > 0;
  const jump = joy ? Math.abs(Math.sin(wardrobeT * 6)) * h * 0.06 : 0;
  // pyörähdys: välillä Leia kääntyy näyttämään mekon sivulta ja takaa
  const phase = (wardrobeT * 0.35) % 4;
  const facing = joy ? 'down' : phase < 2.6 ? 'down' : phase < 3 ? 'right' : phase < 3.6 ? 'up' : 'left';
  drawLeia(ctx, w / 2, h * 0.5, Math.min(w, h) * 0.78, { t: wardrobeT, outfit: d, happy: joy, jump, facing });
  for (let i = 0; i < 3; i++) {
    const a = wardrobeT * 1.2 + (i * Math.PI * 2) / 3;
    drawSparkle(ctx, w / 2 + Math.cos(a) * w * 0.38, h * 0.5 + Math.sin(a) * h * 0.3, w * 0.025 * (0.6 + 0.4 * Math.sin(wardrobeT * 5 + i)), '#ffffff');
  }
  for (const p of wardrobeParticles) {
    p.life -= dt;
    p.vy += 260 * dt;
    p.x += (p.vx * dt) / w;
    p.y += (p.vy * dt) / h;
    p.rot += dt * 6;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.translate(p.x * w, p.y * h);
    if (p.spark) drawSparkle(ctx, 0, 0, p.size, p.color);
    else {
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
    }
    ctx.restore();
  }
  wardrobeParticles = wardrobeParticles.filter((p) => p.life > 0);
}

// ---------------------------------------------------------------- vanhempien valikko
function setupLongPress(btn, ms, cb) {
  let timer = null;
  const cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    btn.classList.remove('holding');
  };
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    btn.classList.add('holding');
    timer = setTimeout(() => {
      timer = null;
      btn.classList.remove('holding');
      cb();
    }, ms);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, cancel));
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
}

function openParent() {
  audio.unlock();
  parentOpen = true;
  parentLevel = Math.min(store.data.level, maxSelectable());
  $('opt-sound').checked = !!store.data.sound;
  $('opt-music').checked = !!store.data.music;
  $('reset-confirm').classList.add('hidden');
  updateParentLevel();
  updateCap();
  refresh();
}

function closeParent() {
  parentOpen = false;
  refresh();
}

const maxSelectable = () => {
  const cap = capOf();
  return Math.max(1, cap ? Math.min(store.data.maxLevel, cap) : store.data.maxLevel);
};

function updateParentLevel() {
  parentLevel = Math.min(parentLevel, maxSelectable());
  $('lvl-value').textContent = String(parentLevel);
  $('lvl-world').textContent = `${themeForLevel(parentLevel).name} · avattuja kenttiä ${store.data.maxLevel}`;
  $('lvl-minus').disabled = parentLevel <= 1;
  $('lvl-plus').disabled = parentLevel >= maxSelectable();
}

function updateCap() {
  const cap = capOf();
  $('cap-value').textContent = cap ? String(cap) : 'Ei rajaa';
  $('cap-value').classList.toggle('wide', !cap);
  $('cap-minus').disabled = cap === 1;
  $('cap-plus').disabled = !cap;
  $('cap-info').textContent = cap
    ? `Kentän ${cap} jälkeen peli tekee uusia samantasoisia kenttiä eikä vaikeudu enempää.${cap >= 13 ? ' Kentästä 13 alkaen labyrintti on puhelimen ruutua isompi.' : ''}`
    : 'Peli vaikeutuu kentästä toiseen. Vaikeimmillaan se on kentästä 20 eteenpäin.';
}

function setCap(cap) {
  store.data.cap = cap;
  if (cap && store.data.level > cap) store.data.level = cap;
  capRepeat = 0;
  store.save();
  updateCap();
  updateParentLevel();
}

document.querySelectorAll('.parent-btn').forEach((b) => setupLongPress(b, 2000, openParent));
$('btn-parent-close').addEventListener('click', closeParent);
$('lvl-minus').addEventListener('click', () => { parentLevel = Math.max(1, parentLevel - 1); updateParentLevel(); });
$('lvl-plus').addEventListener('click', () => { parentLevel = Math.min(maxSelectable(), parentLevel + 1); updateParentLevel(); });
$('cap-minus').addEventListener('click', () => {
  const cap = capOf();
  setCap(cap ? Math.max(1, cap - 1) : CAP_MAX);
});
$('cap-plus').addEventListener('click', () => {
  const cap = capOf();
  if (!cap) return;
  setCap(cap >= CAP_MAX ? null : cap + 1);
});
$('btn-play-level').addEventListener('click', () => {
  store.data.level = parentLevel;
  store.save();
  parentOpen = false;
  capRepeat = 0;
  startLevel(parentLevel);
  setBase('game');
});
$('opt-sound').addEventListener('change', (e) => audio.setSound(e.target.checked));
$('opt-music').addEventListener('change', (e) => {
  audio.setMusic(e.target.checked);
  if (base !== 'game') audio.stopMusic();
});
$('btn-reset').addEventListener('click', () => $('reset-confirm').classList.remove('hidden'));
$('btn-reset-no').addEventListener('click', () => $('reset-confirm').classList.add('hidden'));
$('btn-reset-yes').addEventListener('click', () => {
  store.resetProgress();
  game.level = null;
  game.state = 'idle';
  audio.stopMusic();
  parentOpen = false;
  setBase('start');
});

// ---------------------------------------------------------------- piirrokset valikoissa
function fitCanvas(c) {
  const r = c.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: r.width, h: r.height };
}

let artT = 0;
function drawStartArt(dt) {
  artT += dt;
  const { ctx, w, h } = fitCanvas($('start-art'));
  if (!w) return;
  ctx.clearRect(0, 0, w, h);
  const T = themeFor(store.data.level);
  const s = Math.min(h * 0.82, w * 0.32);
  const gy = h * 0.55;
  ctx.save();
  const gr = ctx.createRadialGradient(w / 2, gy, 0, w / 2, gy, s * 0.8);
  gr.addColorStop(0, 'rgba(255,255,255,0.7)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  drawDiamond(ctx, w / 2, gy + Math.sin(artT * 2) * 4, s * 0.55, T.diamond, artT);
  for (let i = 0; i < 4; i++) {
    const a = artT * 1.3 + (i * Math.PI) / 2;
    drawSparkle(ctx, w / 2 + Math.cos(a) * s * 0.45, gy + Math.sin(a) * s * 0.3, s * 0.06 * (0.6 + 0.4 * Math.sin(artT * 5 + i)), '#ffffff');
  }
  drawLeia(ctx, w * 0.2, h * 0.5, s, { t: artT, facing: 'right', happy: Math.sin(artT * 0.8) > 0.6, outfit: outfit() });
  drawGhost(ctx, w * 0.8, h * 0.42 + Math.sin(artT * 2.2) * 6, s * 0.85, {
    t: artT, mood: Math.sin(artT * 0.7) > 0.7 ? 'wave' : 'idle', lookX: -1, lookY: 0.2, costume: T.costume,
  });
}

let celebrateT = 0;
function drawCelebrate(dt) {
  celebrateT += dt;
  const { ctx, w, h } = fitCanvas($('celebrate-art'));
  if (!w) return;
  ctx.clearRect(0, 0, w, h);
  const T = game.theme || themeForLevel(1);
  const cx = w / 2, cy = h * 0.4;
  const s = Math.min(w, h);
  // säteet
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(celebrateT * 0.4);
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-s * 0.08, -s);
    ctx.lineTo(s * 0.08, -s);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? 'rgba(255,214,10,0.18)' : 'rgba(255,255,255,0.25)';
    ctx.fill();
  }
  ctx.restore();
  const grow = Math.min(1, celebrateT / 0.5);
  const ds = s * 0.42 * (0.6 + 0.4 * grow) * (1 + Math.sin(celebrateT * 3) * 0.04);
  drawDiamond(ctx, cx, cy + Math.sin(celebrateT * 2) * 5, ds, T.diamond, celebrateT);
  for (let i = 0; i < 6; i++) {
    const a = celebrateT * 1.6 + (i * Math.PI) / 3;
    drawSparkle(ctx, cx + Math.cos(a) * ds * 0.75, cy + Math.sin(a) * ds * 0.6, ds * 0.08 * (0.6 + 0.4 * Math.sin(celebrateT * 6 + i)), '#ffffff');
  }
  const jump = Math.abs(Math.sin(celebrateT * 5)) * s * 0.06;
  drawLeia(ctx, w * 0.2, h * 0.72, s * 0.34, { t: celebrateT, happy: true, jump, outfit: outfit() });
  drawGhost(ctx, w * 0.8, h * 0.66 + Math.sin(celebrateT * 4) * 6, s * 0.3, {
    t: celebrateT, mood: 'party', costume: T.costume,
  });
}

// ---------------------------------------------------------------- pääsilmukka
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  if ((base === 'game' || base === 'celebrate') && !parentOpen) game.update(dt);
  if (base === 'game' || base === 'celebrate') game.render();
  if (base === 'start') drawStartArt(dt);
  if (base === 'celebrate') drawCelebrate(dt);
  if (base === 'wardrobe') drawWardrobePreview(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------------------------------------------------------------- selaimen kanssa toimeen tuleminen
const unlock = () => audio.unlock();
['pointerdown', 'touchend', 'keydown'].forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));
document.addEventListener('visibilitychange', () => audio.onVisibility(document.hidden));
['gesturestart', 'gesturechange', 'dblclick', 'contextmenu'].forEach((ev) =>
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false }));

let resizeTimer = null;
const onResize = () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => game.resize(), 60);
};
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);

// Uusi versio: ladataan sivu uudelleen, kun ollaan aloitusnäytöllä (ei kesken kentän)
let updateReady = false;
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || updateReady) return;
    updateReady = true;
    if (base === 'start') reloadForUpdate();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// Testausta varten
window.__labyrintti = { game, store, audio, setBase };

setBase('start');
