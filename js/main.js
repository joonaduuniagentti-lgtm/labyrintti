// Käynnistys, näytöt ja valikot.
import { Store } from './storage.js';
import { AudioEngine } from './audio.js';
import { Game } from './game.js';
import { attachInput } from './input.js';
import { themeForLevel, themeById } from './themes.js';
import { drawLeia, drawGhost, drawDiamond, drawCoin, drawSparkle } from './sprites.js';

const $ = (id) => document.getElementById(id);
const store = new Store();
const audio = new AudioEngine(store);
const canvas = $('game');
const game = new Game(canvas, audio, { onLevelComplete });
attachInput(canvas, game);

let base = 'start'; // start | game | treasure | celebrate
let parentOpen = false;
let parentLevel = 1;

// ---------------------------------------------------------------- näyttöjen vaihto
function refresh() {
  $('screen-start').classList.toggle('hidden', base !== 'start');
  $('screen-treasure').classList.toggle('hidden', base !== 'treasure');
  $('screen-celebrate').classList.toggle('hidden', base !== 'celebrate');
  $('hud').classList.toggle('hidden', base !== 'game');
  $('screen-parent').classList.toggle('hidden', !parentOpen);
  game.active = base === 'game' && !parentOpen;
  applyThemeColors();
}

function setBase(b) {
  base = b;
  refresh();
  if (b === 'start') renderStart();
}

function applyThemeColors() {
  const T = base === 'game' || base === 'celebrate' ? game.theme || themeForLevel(store.data.level) : themeForLevel(store.data.level);
  document.documentElement.style.setProperty('--bg1', T.bg[0]);
  document.documentElement.style.setProperty('--bg2', T.bg[1]);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', T.bg[1]);
}

function renderStart() {
  const T = themeForLevel(store.data.level);
  $('start-level').textContent = `Kenttä ${store.data.level} · ${T.name}`;
  $('diamond-count').textContent = String(store.data.diamonds.length);
  const chip = $('chip-diamond');
  const cx = chip.getContext('2d');
  cx.clearRect(0, 0, 64, 64);
  drawDiamond(cx, 32, 34, 50, T.diamond, 0.6);
}

// ---------------------------------------------------------------- pelin kulku
function playCurrent() {
  const lvl = store.data.level;
  if (game.level && game.state === 'play' && game.levelNum === lvl) {
    audio.startMusic(game.theme);
  } else {
    game.startLevel(lvl);
  }
  setBase('game');
}

function onLevelComplete({ level, coins, theme }) {
  store.data.coins += coins;
  store.data.diamonds.push({ level, theme: theme.id });
  store.data.level = level + 1;
  store.data.maxLevel = Math.max(store.data.maxLevel, level + 1);
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
  game.startLevel(store.data.level);
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
  parentLevel = Math.min(store.data.level, store.data.maxLevel);
  $('opt-sound').checked = !!store.data.sound;
  $('opt-music').checked = !!store.data.music;
  $('reset-confirm').classList.add('hidden');
  updateParentLevel();
  refresh();
}

function closeParent() {
  parentOpen = false;
  refresh();
}

function updateParentLevel() {
  $('lvl-value').textContent = String(parentLevel);
  $('lvl-world').textContent = `${themeForLevel(parentLevel).name} · avattuja kenttiä ${store.data.maxLevel}`;
  $('lvl-minus').disabled = parentLevel <= 1;
  $('lvl-plus').disabled = parentLevel >= store.data.maxLevel;
}

document.querySelectorAll('.parent-btn').forEach((b) => setupLongPress(b, 2000, openParent));
$('btn-parent-close').addEventListener('click', closeParent);
$('lvl-minus').addEventListener('click', () => { parentLevel = Math.max(1, parentLevel - 1); updateParentLevel(); });
$('lvl-plus').addEventListener('click', () => { parentLevel = Math.min(store.data.maxLevel, parentLevel + 1); updateParentLevel(); });
$('btn-play-level').addEventListener('click', () => {
  store.data.level = parentLevel;
  store.save();
  parentOpen = false;
  game.startLevel(parentLevel);
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
  const T = themeForLevel(store.data.level);
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
  drawLeia(ctx, w * 0.2, h * 0.5, s, { t: artT, facing: 'right', happy: Math.sin(artT * 0.8) > 0.6 });
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
  drawLeia(ctx, w * 0.2, h * 0.72, s * 0.34, { t: celebrateT, happy: true, jump });
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

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// Testausta varten
window.__labyrintti = { game, store, audio, setBase };

setBase('start');
