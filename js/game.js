// Pelin logiikka: liikkuminen, keräily, ovi, haamu, timantti ja vinkit.
import {
  createLevel, passable, inRoom, findPath, bfs, isDoorEdge, dirBetween,
  DIRS, DX, DY, OPP, N, E, S, W,
} from './maze.js';
import { levelParams, fitDims, MIN_CELL, MIN_CELL_FIT_BIG } from './levels.js';
import { themeForLevel } from './themes.js';
import { buildStatic, renderGame, doorGeometry } from './render.js';
import { randomSeed } from './rng.js';

const SPEED = 5.2;          // ruutua sekunnissa
const HUD_H = 64;           // yläpalkin korkeus
const HINT_DELAY = 16;      // sekuntia ilman edistystä ennen vinkkiä
const HINT_REPEAT = 10;     // vinkki uudestaan, jos jumi jatkuu
const QUEUE_TTL = 1.0;      // kauanko etukäteen annettu suunta muistetaan

const FACING = { [N]: 'up', [S]: 'down', [E]: 'right', [W]: 'left' };
const CONFETTI = ['#ff4d6d', '#ffbe0b', '#3a86ff', '#2ec27e', '#ff5fa2', '#9b5de5', '#ffffff'];

export class Game {
  constructor(canvas, audio, hooks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audio = audio;
    this.hooks = hooks;
    this.time = 0;
    this.level = null;
    this.state = 'idle';
    this.active = false;
    this.particles = [];
    this.flyers = [];
    this.timers = [];
    this.hudCoinPulse = 0;
    this.resize();
  }

  // ------------------------------------------------------------ asettelu
  readSafe() {
    const el = document.getElementById('safe-probe');
    if (!el) return { top: 0, right: 0, bottom: 0, left: 0 };
    const cs = getComputedStyle(el);
    return {
      top: parseFloat(cs.paddingTop) || 0,
      right: parseFloat(cs.paddingRight) || 0,
      bottom: parseFloat(cs.paddingBottom) || 0,
      left: parseFloat(cs.paddingLeft) || 0,
    };
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const vw = window.innerWidth, vh = window.innerHeight;
    this.dpr = dpr;
    this.vw = vw;
    this.vh = vh;
    this.canvas.width = Math.round(vw * dpr);
    this.canvas.height = Math.round(vh * dpr);
    this.canvas.style.width = vw + 'px';
    this.canvas.style.height = vh + 'px';
    this.safe = this.readSafe();
    const pad = 10;
    const top = this.safe.top + HUD_H + 6;
    this.area = {
      x: this.safe.left + pad,
      y: top,
      w: Math.max(100, vw - this.safe.left - this.safe.right - pad * 2),
      h: Math.max(100, vh - top - this.safe.bottom - pad - 4),
    };
    if (this.level) this.layoutMaze();
  }

  layoutMaze() {
    const L = this.level, A = this.area;
    const fit = Math.min(A.w / L.cols, A.h / L.rows);
    // Isoissa kentissä kamera seuraa Leiaa, jos koko labyrintti ei mahdu ruudulle selvästi
    this.scrollMode = !!this.bigLevel && fit < MIN_CELL_FIT_BIG;
    this.fitCell = Math.max(8, Math.floor(fit));
    this.baseCell = this.scrollMode
      ? Math.round(Math.max(42, Math.min(60, Math.min(A.w, A.h) / 8)))
      : this.fitCell;
    this.wallW = Math.max(6, Math.round(this.baseCell * 0.2));
    if (!this.scrollMode) this.overview = null;
    this.layoutHud();
    buildStatic(this);
    this.updateCamera(0, true);
  }

  // Kamera: pienissä kentissä labyrintti on keskellä, isoissa se seuraa Leiaa.
  // Ison kentän alussa näytetään ensin koko labyrintti ja zoomataan sitten Leiaan.
  updateCamera(dt, snap = false) {
    const L = this.level, A = this.area, p = this.player;
    if (!this.cam) this.cam = { x: L.cols / 2, y: L.rows / 2 };
    let cell = this.baseCell;
    if (this.scrollMode && p) {
      let z = 1;
      const ov = this.overview;
      if (ov) {
        z = ov.t < ov.hold ? 0 : Math.min(1, (ov.t - ov.hold) / ov.zoom);
        z = z * z * (3 - 2 * z);
      }
      cell = this.fitCell + (this.baseCell - this.fitCell) * z;
      const hx = A.w / (2 * cell), hy = A.h / (2 * cell);
      const clampC = (v, n, h) => (n <= 2 * h ? n / 2 : Math.max(h, Math.min(n - h, v)));
      const fx = clampC(p.px + 0.5, L.cols, hx), fy = clampC(p.py + 0.5, L.rows, hy);
      if (ov || snap) {
        this.cam.x = L.cols / 2 + (fx - L.cols / 2) * z;
        this.cam.y = L.rows / 2 + (fy - L.rows / 2) * z;
      } else {
        const k = 1 - Math.exp(-dt * 6);
        this.cam.x += (fx - this.cam.x) * k;
        this.cam.y += (fy - this.cam.y) * k;
      }
    } else {
      this.cam.x = L.cols / 2;
      this.cam.y = L.rows / 2;
    }
    this.cell = cell;
    const r = (v) => Math.round(v * this.dpr) / this.dpr;
    this.ox = r(A.x + A.w / 2 - this.cam.x * cell);
    this.oy = r(A.y + A.h / 2 - this.cam.y * cell);
  }

  skipOverview() {
    const ov = this.overview;
    if (ov && ov.t < ov.hold) ov.t = ov.hold;
  }

  layoutHud() {
    const k = this.level.keys.length;
    const left = this.safe.left + 70, right = this.vw - this.safe.right - 70;
    const avail = right - left - 28; // 28 = palkin reunat
    let slot = 44, gap = 8, coinSize = 30, coinText = 40;
    const width = () => k * slot + (k - 1) * gap + 22 + coinSize + coinText;
    if (width() > avail) {
      const sc = avail / width();
      slot *= sc; gap *= sc; coinSize *= Math.max(0.8, sc); coinText *= sc;
    }
    const total = width();
    const x0 = this.vw / 2 - total / 2;
    const cy = this.safe.top + HUD_H / 2;
    this.hud = {
      slots: Array.from({ length: k }, (_, i) => ({ x: x0 + i * (slot + gap) + slot / 2, y: cy, r: slot / 2 })),
      coin: { x: x0 + k * slot + (k - 1) * gap + 22 + coinSize / 2, y: cy },
      coinSize,
      pill: { x: x0 - 14, y: cy - slot / 2 - 7, w: total + 28, h: slot + 14 },
    };
  }

  cellCenter(cx, cy) {
    return { x: this.ox + (cx + 0.5) * this.cell, y: this.oy + (cy + 0.5) * this.cell };
  }

  cellAt(px, py) {
    const x = Math.floor((px - this.ox) / this.cell), y = Math.floor((py - this.oy) / this.cell);
    if (!this.level || x < 0 || y < 0 || x >= this.level.cols || y >= this.level.rows) return null;
    return { x, y };
  }

  // ------------------------------------------------------------ kentän aloitus
  startLevel(n) {
    this.levelNum = n;
    this.theme = themeForLevel(n);
    const p = levelParams(n);
    this.bigLevel = !!p.scroll;
    this.cam = null;
    this.overview = null;
    this.player = null;
    const portrait = this.area.h >= this.area.w;
    const { cols, rows } = fitDims(p, portrait, this.area.w, this.area.h, MIN_CELL);
    this.level = createLevel({ cols, rows, keys: p.keys, braid: p.braid, coins: p.coins, seed: randomSeed() });
    const L = this.level;
    this.player = {
      x: L.start.x, y: L.start.y, px: L.start.x, py: L.start.y,
      from: null, to: null, t: 0, dir: null, moving: false,
      heading: null, queued: null, queuedAt: 0, facing: 'down',
      mode: 'slide', target: null, followMax: 6, auto: false, bump: null, walkT: 0, jump: 0, happy: false,
    };
    this.ghost = { x: L.ghost.x, y: L.ghost.y, mood: 'idle', moodUntil: 0, bubble: null, bubbleUntil: 0, bubbleAt: 0, bubbleColor: null };
    this.keyholes = L.keys.map((k) => ({ color: k.color, filled: false, filledAt: 0, flash: 0 }));
    this.keysInserted = 0;
    this.door = { openT: 0, opening: false, shake: 0 };
    this.coinsCollected = 0;
    this.particles = [];
    this.flyers = [];
    this.timers = [];
    this.hint = null;
    this.lastProgress = this.time;
    this.nextHintAt = this.time + HINT_DELAY;
    this.finger = null;
    this.fingerBlocked = null;
    this.state = 'play';
    this.finishT = 0;
    this.banner = { title: `Kenttä ${n}`, sub: this.theme.name, t: 0 };
    this.layoutMaze();
    if (this.scrollMode) {
      this.overview = { t: 0, hold: 1.8, zoom: 1.1 };
      this.updateCamera(0, true);
    }
    this.audio.startMusic(this.theme);
    this.audio.levelStart();
  }

  acceptsInput() {
    return this.active && this.state === 'play';
  }

  later(delay, fn) {
    this.timers.push({ at: this.time + delay, fn });
  }

  // ------------------------------------------------------------ syötteet
  inputDir(d) {
    if (!this.acceptsInput()) return;
    this.skipOverview();
    const p = this.player;
    p.mode = 'slide';
    p.target = null;
    if (p.moving) {
      if (d === OPP[p.dir]) {
        const f = p.from;
        p.from = p.to;
        p.to = f;
        p.t = 1 - p.t;
        p.x = p.from.x;
        p.y = p.from.y;
        p.dir = d;
        p.heading = d;
        p.facing = FACING[d];
        p.queued = null;
        return;
      }
      p.queued = d;
      p.queuedAt = this.time;
      return;
    }
    if (passable(this.level, p.x, p.y, d)) {
      p.heading = d;
      this.beginStep(d);
    } else {
      this.bumpInto(d);
    }
  }

  tapAt(px, py) {
    if (!this.acceptsInput()) return;
    this.skipOverview();
    const p = this.player;
    const c = this.cellAt(px, py);
    if (c && !(c.x === p.x && c.y === p.y)) {
      const from = p.moving ? p.to : p;
      const path = findPath(this.level, { x: from.x, y: from.y }, c, 4);
      if (path) {
        p.mode = 'follow';
        p.target = c;
        p.followMax = 5;
        p.queued = null;
        if (!p.moving) this.stepFollow();
        return;
      }
    }
    const pc = this.cellCenter(p.px, p.py);
    const dx = px - pc.x, dy = py - pc.y;
    if (Math.hypot(dx, dy) < this.cell * 0.45) {
      this.tapPlayer();
      return;
    }
    this.inputDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? E : W) : (dy > 0 ? S : N));
  }

  tapPlayer() {
    if (!this.acceptsInput()) return;
    const p = this.player;
    if (!p.moving && !p.hopT) {
      p.hopT = 0.0001;
      this.audio.hop();
    }
  }

  // Sormi pohjassa: Leia kävelee sormea kohti niin kauan kuin sormi on ruudulla.
  // Lähellä (muutaman askeleen päässä) hän osaa kiertää mutkat, kauempana hän
  // kulkee suoraan sormen suuntaan, kunnes seinä tulee vastaan.
  fingerHold(px, py) {
    if (!this.acceptsInput()) return;
    this.skipOverview();
    const p = this.player;
    this.finger = { x: px, y: py };
    this.fingerBlocked = null;
    if (p.auto) return;
    p.mode = 'finger';
    p.target = null;
    p.queued = null;
    if (!p.moving) this.stepFinger();
  }

  fingerMove(px, py) {
    if (!this.finger) return;
    this.finger.x = px;
    this.finger.y = py;
  }

  fingerRelease() {
    this.finger = null;
    this.fingerBlocked = null;
  }

  fingerCell() {
    const L = this.level, f = this.finger;
    const x = Math.floor((f.x - this.ox) / this.cell), y = Math.floor((f.y - this.oy) / this.cell);
    return { x: Math.max(0, Math.min(L.cols - 1, x)), y: Math.max(0, Math.min(L.rows - 1, y)) };
  }

  nextFingerDir() {
    const p = this.player, L = this.level;
    if (!this.finger) return null;
    const c = this.fingerCell();
    if (c.x === p.x && c.y === p.y) return null;
    const path = findPath(L, { x: p.x, y: p.y }, c, 6);
    if (path && path.length > 1) {
      this.fingerBlocked = null;
      return dirBetween(path[0], path[1]);
    }
    const pc = this.cellCenter(p.x, p.y);
    const dx = (this.finger.x - pc.x) / this.cell, dy = (this.finger.y - pc.y) / this.cell;
    const horiz = Math.abs(dx) > Math.abs(dy);
    const primary = horiz ? (dx > 0 ? E : W) : (dy > 0 ? S : N);
    const minor = horiz ? dy : dx;
    const secondary = Math.abs(minor) > 0.5 ? (horiz ? (dy > 0 ? S : N) : (dx > 0 ? E : W)) : null;
    if (passable(L, p.x, p.y, primary)) { this.fingerBlocked = null; return primary; }
    if (secondary != null && passable(L, p.x, p.y, secondary)) { this.fingerBlocked = null; return secondary; }
    // Seinä edessä: tönäistään kerran, ettei sama "boing" toistu koko ajan
    const key = `${p.x},${p.y},${primary}`;
    if (this.fingerBlocked !== key && !p.moving) {
      this.fingerBlocked = key;
      this.bumpInto(primary);
    }
    return null;
  }

  stepFinger() {
    const d = this.nextFingerDir();
    if (d != null) {
      this.player.heading = d;
      this.beginStep(d);
    }
  }

  // ------------------------------------------------------------ liike
  beginStep(d) {
    const p = this.player;
    p.from = { x: p.x, y: p.y };
    p.to = { x: p.x + DX[d], y: p.y + DY[d] };
    p.dir = d;
    p.t = 0;
    p.moving = true;
    p.facing = FACING[d];
  }

  bumpInto(d) {
    const p = this.player, L = this.level;
    if (p.bump) return;
    p.bump = { dir: d, t: 0 };
    p.facing = FACING[d];
    if (L.door.locked && isDoorEdge(L, p.x, p.y, d)) {
      this.audio.locked();
      this.door.shake = 0.6;
      for (const kh of this.keyholes) if (!kh.filled) kh.flash = 1;
      const next = L.keys.find((k) => !k.taken);
      this.ghostSay('key', 2, next ? next.color : null);
      this.ghostMood('wave', 2);
    } else {
      this.audio.bump();
    }
  }

  nextFollowDir() {
    const p = this.player;
    if (!p.target) return null;
    if (p.target.x === p.x && p.target.y === p.y) {
      p.target = null; p.mode = 'slide'; p.auto = false;
      return null;
    }
    const path = findPath(this.level, { x: p.x, y: p.y }, p.target, p.followMax);
    if (!path || path.length < 2) {
      p.target = null; p.mode = 'slide'; p.auto = false;
      return null;
    }
    return dirBetween(path[0], path[1]);
  }

  stepFollow() {
    const d = this.nextFollowDir();
    if (d != null) {
      this.player.heading = d;
      this.beginStep(d);
    }
  }

  // Mihin suuntaan jatketaan ruudun saavuttamisen jälkeen?
  chooseNext() {
    const p = this.player, L = this.level;
    if (p.mode === 'follow') return this.nextFollowDir();
    if (p.mode === 'finger') {
      if (this.finger) return this.nextFingerDir();
      p.mode = 'slide';
      p.heading = null;
      return null;
    }
    if (p.queued != null) {
      // Vanhentunut tai taaksepäin osoittava suunta unohdetaan (kääntyminen hoidetaan heti pyyhkäisyssä)
      if (this.time - p.queuedAt > QUEUE_TTL || p.queued === OPP[p.heading]) p.queued = null;
      else if (passable(L, p.x, p.y, p.queued)) {
        const d = p.queued;
        p.queued = null;
        p.heading = d;
        return d;
      }
    }
    if (p.heading == null) return null;
    const exits = DIRS.filter((d) => passable(L, p.x, p.y, d));
    const forward = exits.filter((d) => d !== OPP[p.heading]);
    if (forward.length === 1) {
      // käytävä tai mutka: jatketaan itsestään
      p.heading = forward[0];
      return forward[0];
    }
    // risteys tai umpikuja: pysähdytään ja annetaan Leian valita
    p.queued = null;
    p.heading = null;
    return null;
  }

  updatePlayer(dt) {
    const p = this.player;
    if (p.bump) {
      p.bump.t += dt / 0.28;
      if (p.bump.t >= 1) p.bump = null;
    }
    if (p.hopT) {
      p.hopT += dt / 0.35;
      p.jump = Math.sin(Math.min(1, p.hopT) * Math.PI) * this.cell * 0.18;
      if (p.hopT >= 1) { p.hopT = 0; p.jump = 0; }
    }
    if (this.state === 'play' && !p.moving && p.mode === 'follow' && p.target) this.stepFollow();
    if (this.state === 'play' && !p.moving && p.mode === 'finger' && this.finger && !p.bump) this.stepFinger();
    if (p.moving) {
      p.t += dt * SPEED;
      p.walkT += dt;
      while (p.moving && p.t >= 1) {
        const over = p.t - 1;
        p.x = p.to.x;
        p.y = p.to.y;
        p.moving = false;
        this.enterCell(p.x, p.y);
        if (this.state !== 'play') break;
        const d = this.chooseNext();
        if (d != null) {
          this.beginStep(d);
          p.t = over;
        }
      }
    }
    if (p.moving) {
      p.px = p.from.x + (p.to.x - p.from.x) * p.t;
      p.py = p.from.y + (p.to.y - p.from.y) * p.t;
    } else {
      p.px = p.x;
      p.py = p.y;
    }
    if (this.state === 'finishing') {
      p.jump = Math.abs(Math.sin(this.finishT * 6)) * this.cell * 0.16;
    }
  }

  // ------------------------------------------------------------ keräily
  enterCell(x, y) {
    const L = this.level, p = this.player;
    const pos = this.cellCenter(x, y);
    for (const coin of L.coins) {
      if (coin.taken || coin.x !== x || coin.y !== y) continue;
      coin.taken = true;
      this.coinsCollected++;
      this.audio.coin();
      this.burst(pos.x, pos.y, '#ffd23f', 7);
      this.flyers.push({
        kind: 'coin', from: { ...pos }, to: () => this.hud.coin, t: 0, dur: 0.55, arc: 40,
        onArrive: () => { this.hudCoinPulse = 1; },
      });
      this.vibrate(12);
    }
    L.keys.forEach((k, i) => {
      if (k.taken || k.x !== x || k.y !== y) return;
      k.taken = true;
      this.progress();
      this.audio.key();
      this.burst(pos.x, pos.y, k.color, 12);
      this.burst(pos.x, pos.y, '#ffffff', 6);
      this.vibrate(30);
      this.ghostMood('happy', 1.5);
      this.ghostSay('heart', 1.4);
      this.flyers.push({
        // Isossa kentässä ovi voi olla ruudun ulkopuolella: avain lentää silloin yläpalkkiin
        kind: 'key', color: k.color, from: { ...pos },
        to: () => (this.scrollMode ? this.hud.slots[i] : doorGeometry(this).holes[i]),
        t: 0, dur: 1.0, arc: this.cell * 1.2,
        onArrive: () => this.insertKey(i),
      });
    });
    if (inRoom(L, x, y) && !L.diamond.taken && !L.door.locked) {
      if (x === L.diamond.x && y === L.diamond.y) this.collectDiamond();
      else {
        p.mode = 'follow';
        p.target = { x: L.diamond.x, y: L.diamond.y };
        p.followMax = 12;
        p.auto = true;
        p.queued = null;
      }
    }
  }

  insertKey(i) {
    const kh = this.keyholes[i];
    if (kh.filled) return;
    kh.filled = true;
    kh.filledAt = this.time;
    this.keysInserted++;
    this.audio.keyIn();
    const h = doorGeometry(this).holes[i];
    this.burst(h.x, h.y, kh.color, 10);
    if (this.keysInserted === this.keyholes.length) this.later(0.35, () => this.openDoor());
  }

  openDoor() {
    const L = this.level;
    if (!L.door.locked) return;
    L.door.locked = false;
    this.door.opening = true;
    this.door.openT = 0;
    this.audio.doorOpen();
    this.vibrate([20, 40, 20]);
    const geo = doorGeometry(this);
    for (let i = 0; i < 3; i++) this.burst(geo.cx, geo.cy, i === 0 ? '#ffffff' : this.theme.diamond, 10);
    this.ghostMood('happy', 2.5);
    this.ghostSay('diamond', 2.5);
    this.progress();
  }

  collectDiamond() {
    const L = this.level, p = this.player;
    L.diamond.taken = true;
    this.state = 'finishing';
    this.finishT = 0;
    p.happy = true;
    p.mode = 'slide';
    p.target = null;
    p.facing = 'down';
    this.hint = null;
    this.audio.diamond();
    this.vibrate([30, 60, 30, 60, 60]);
    const pos = this.cellCenter(p.x, p.y);
    for (let i = 0; i < 3; i++) this.burst(pos.x, pos.y - this.cell * 0.6, i ? this.theme.diamond : '#ffffff', 14);
    this.later(0.7, () => {
      this.ghostMood('boo', 1.2);
      this.ghostSay('BUU!', 1.4);
      this.audio.boo();
    });
    this.later(1.9, () => {
      this.ghostMood('party', 10);
      this.ghostSay('heart', 1.5);
      this.audio.giggle();
      this.confetti();
    });
    this.later(3.0, () => {
      this.state = 'done';
      if (this.hooks.onLevelComplete) {
        this.hooks.onLevelComplete({ level: this.levelNum, coins: this.coinsCollected, theme: this.theme });
      }
    });
  }

  progress() {
    this.lastProgress = this.time;
    this.nextHintAt = this.time + HINT_DELAY;
    this.hint = null;
  }

  // ------------------------------------------------------------ haamu
  ghostMood(mood, dur) {
    this.ghost.mood = mood;
    this.ghost.moodUntil = this.time + dur;
  }

  ghostSay(kind, dur, color = null) {
    const g = this.ghost;
    g.bubble = kind;
    g.bubbleColor = color;
    g.bubbleAt = this.time;
    g.bubbleUntil = this.time + dur;
  }

  updateGhost(dt) {
    const g = this.ghost, L = this.level, p = this.player;
    if (g.moodUntil && this.time > g.moodUntil) {
      g.mood = 'idle';
      g.moodUntil = 0;
    }
    if (g.bubble && this.time > g.bubbleUntil) g.bubble = null;
    let tx = L.ghost.x, ty = L.ghost.y;
    if (this.state !== 'play' && this.finishT > 0.5) {
      const a = this.time * 2.2;
      tx = p.px + Math.cos(a) * 1.25;
      ty = p.py + Math.sin(a) * 0.55 - 0.1;
    }
    const k = 1 - Math.exp(-dt * 4);
    g.x += (tx - g.x) * k;
    g.y += (ty - g.y) * k;
  }

  // ------------------------------------------------------------ vinkit
  hintTarget() {
    const L = this.level, p = this.player;
    const remaining = L.keys.filter((k) => !k.taken);
    if (remaining.length) {
      const dist = bfs(L, p.x, p.y);
      remaining.sort((a, b) => dist[a.y * L.cols + a.x] - dist[b.y * L.cols + b.x]);
      return { x: remaining[0].x, y: remaining[0].y, kind: 'key', color: remaining[0].color };
    }
    if (L.door.locked) return null;
    return { x: L.diamond.x, y: L.diamond.y, kind: 'diamond' };
  }

  // Jos avaimia ei löydy hetkeen, haamu vilkuttaa ja näyttää kuplassa, mitä etsiä.
  // Isoissa kentissä myös reunan osoitin sykkii.
  updateHint(dt) {
    if (this.hint) {
      this.hint.t += dt;
      if (this.hint.t > this.hint.dur) this.hint = null;
    }
    if (this.state !== 'play' || this.hint || this.overview || this.time < this.nextHintAt) return;
    const target = this.hintTarget();
    if (!target) {
      this.nextHintAt = this.time + 3;
      return;
    }
    this.hint = { target, t: 0, dur: 3 };
    this.nextHintAt = this.time + 3 + HINT_REPEAT;
    this.audio.hint();
    this.ghostMood('wave', 2.5);
    this.ghostSay(target.kind, 2.5, target.color);
  }

  // ------------------------------------------------------------ efektit
  burst(x, y, color, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 140;
      this.particles.push({
        kind: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, g: 120, drag: 0.9,
        life: 0.6 + Math.random() * 0.4, max: 1, size: 5 + Math.random() * 6, color, rot: 0, vr: 0,
      });
    }
  }

  confetti() {
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        kind: Math.random() < 0.12 ? 'heart' : 'confetti',
        x: Math.random() * this.vw, y: -20 - Math.random() * this.vh * 0.4,
        vx: (Math.random() - 0.5) * 60, vy: 80 + Math.random() * 120, g: 60, drag: 0.99,
        life: 3 + Math.random() * 2, max: 5, size: 8 + Math.random() * 8,
        color: CONFETTI[i % CONFETTI.length], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 8,
      });
    }
  }

  vibrate(pattern) {
    try {
      if (navigator.vibrate && this.audio.soundOn()) navigator.vibrate(pattern);
    } catch (e) { /* ei tukea */ }
  }

  updateParticles(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      p.vy += p.g * dt;
      p.vx *= Math.pow(p.drag, dt * 60);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0 && p.y < this.vh + 40);
  }

  updateFlyers(dt) {
    const done = [];
    for (const f of this.flyers) {
      f.t += dt / f.dur;
      if (f.t >= 1) done.push(f);
    }
    if (done.length) {
      this.flyers = this.flyers.filter((f) => f.t < 1);
      for (const f of done) f.onArrive && f.onArrive();
    }
  }

  // ------------------------------------------------------------ pääsilmukka
  update(dt) {
    if (!this.level) return;
    dt = Math.min(dt, 0.05);
    this.time += dt;
    if (this.state === 'finishing' || this.state === 'done') this.finishT += dt;
    const due = this.timers.filter((t) => t.at <= this.time);
    if (due.length) {
      this.timers = this.timers.filter((t) => t.at > this.time);
      for (const t of due) t.fn();
    }
    if (this.overview) {
      this.overview.t += dt;
      if (this.overview.t >= this.overview.hold + this.overview.zoom) this.overview = null;
    }
    this.updatePlayer(dt);
    this.updateCamera(dt);
    this.updateGhost(dt);
    if (this.door.opening && this.door.openT < 1) this.door.openT = Math.min(1, this.door.openT + dt / 0.8);
    if (this.door.shake > 0) this.door.shake = Math.max(0, this.door.shake - dt);
    for (const kh of this.keyholes) if (kh.flash > 0) kh.flash = Math.max(0, kh.flash - dt * 0.8);
    if (this.hudCoinPulse > 0) this.hudCoinPulse = Math.max(0, this.hudCoinPulse - dt * 4);
    this.updateFlyers(dt);
    this.updateParticles(dt);
    this.updateHint(dt);
    if (this.banner) {
      this.banner.t += dt;
      if (this.banner.t > 2.3) this.banner = null;
    }
  }

  render() {
    if (!this.level) return;
    renderGame(this, this.ctx);
  }
}
