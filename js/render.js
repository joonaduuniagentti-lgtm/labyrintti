// Piirtäminen: staattinen tausta (lattia ja seinät) piirretään kerran per kenttä,
// liikkuvat asiat joka ruudunpäivityksellä.
import { E, S, N, W, DX, DY, inRoom } from './maze.js';
import {
  drawLeia, drawGhost, drawKey, drawCoin, drawDiamond, drawSparkle, drawHeart,
  roundRectPath, lighten, darken, rgba, starPath,
} from './sprites.js';
import { makeRng } from './rng.js';

export const FONT = 'ui-rounded, "SF Pro Rounded", "Nunito", "Arial Rounded MT Bold", system-ui, sans-serif';

// ---------------------------------------------------------------- ovi
export function doorGeometry(g) {
  const L = g.level, d = L.door, c = g.cell;
  const zoom = c / (g.layerCell || c);
  const rc = g.cellCenter(d.x, d.y);
  let cx = rc.x, cy = rc.y;
  const horizontal = d.dir === N || d.dir === S;
  if (d.dir === N) cy -= c / 2;
  else if (d.dir === S) cy += c / 2;
  else if (d.dir === W) cx -= c / 2;
  else cx += c / 2;
  const k = Math.max(1, L.keys.length);
  const len = c * (k >= 4 ? 1.45 : 0.98);
  const thick = Math.max(12 * zoom, g.wallW * 1.9 * zoom);
  const span = len * 0.84;
  const holes = [];
  for (let i = 0; i < k; i++) {
    const off = ((i + 0.5) / k - 0.5) * span;
    holes.push(horizontal ? { x: cx + off, y: cy } : { x: cx, y: cy + off });
  }
  const holeR = Math.min(thick * 0.34, (span / k) * 0.4);
  return { cx, cy, horizontal, len, thick, holes, holeR, span };
}

// ---------------------------------------------------------------- staattinen kerros
function wallSegments(g, ox, oy, c) {
  const L = g.level;
  const segs = [];
  const add = (x1, y1, x2, y2, room) => segs.push({ x1: ox + x1 * c, y1: oy + y1 * c, x2: ox + x2 * c, y2: oy + y2 * c, room });
  for (let y = 0; y < L.rows; y++) {
    for (let x = 0; x < L.cols; x++) {
      const v = L.open[y * L.cols + x];
      const r = inRoom(L, x, y);
      if (y === 0) add(x, 0, x + 1, 0, false);
      if (x === 0) add(0, y, 0, y + 1, false);
      if (!(v & E)) add(x + 1, y, x + 1, y + 1, r || (x + 1 < L.cols && inRoom(L, x + 1, y)));
      if (!(v & S)) add(x, y + 1, x + 1, y + 1, r || (y + 1 < L.rows && inRoom(L, x, y + 1)));
    }
  }
  return segs;
}

function strokeSegs(w, segs, lw, color, dy = 0) {
  w.beginPath();
  for (const s of segs) {
    w.moveTo(s.x1, s.y1 + dy);
    w.lineTo(s.x2, s.y2 + dy);
  }
  w.lineWidth = lw;
  w.strokeStyle = color;
  w.stroke();
}

function wallTexture(w, style, segs, ww, T, rng, vw, vh) {
  switch (style) {
    case 'hedge':
      for (const s of segs) {
        const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
        const steps = Math.max(2, Math.round(len / (ww * 0.45)));
        for (let i = 0; i <= steps; i++) {
          const f = i / steps;
          const x = s.x1 + (s.x2 - s.x1) * f + rng.range(-0.3, 0.3) * ww;
          const y = s.y1 + (s.y2 - s.y1) * f + rng.range(-0.3, 0.3) * ww;
          w.beginPath();
          w.arc(x, y, ww * rng.range(0.16, 0.26), 0, Math.PI * 2);
          w.fillStyle = rng.chance(0.5) ? rgba(T.wallHi, 0.55) : rgba(T.wallShadow, 0.4);
          w.fill();
        }
      }
      break;
    case 'coral':
      for (const s of segs) {
        const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
        const steps = Math.max(2, Math.round(len / (ww * 0.5)));
        for (let i = 0; i <= steps; i++) {
          const f = i / steps;
          w.beginPath();
          w.arc(s.x1 + (s.x2 - s.x1) * f + rng.range(-0.25, 0.25) * ww, s.y1 + (s.y2 - s.y1) * f + rng.range(-0.25, 0.25) * ww, ww * 0.1, 0, Math.PI * 2);
          w.fillStyle = rgba(T.wallHi, 0.85);
          w.fill();
        }
      }
      break;
    case 'candy': {
      const sp = ww * 1.4;
      w.beginPath();
      for (let k = -vh; k < vw + vh; k += sp) {
        w.moveTo(k, 0);
        w.lineTo(k + vh, vh);
      }
      w.strokeStyle = 'rgba(255,255,255,0.92)';
      w.lineWidth = ww * 0.45;
      w.stroke();
      break;
    }
    case 'ice': {
      const sp = ww * 2.6;
      w.beginPath();
      for (let k = -vh; k < vw + vh; k += sp) {
        w.moveTo(k, 0);
        w.lineTo(k + vh * 0.6, vh);
      }
      w.strokeStyle = 'rgba(255,255,255,0.45)';
      w.lineWidth = ww * 0.18;
      w.stroke();
      break;
    }
    case 'space':
      for (const s of segs) {
        if (!rng.chance(0.6)) continue;
        const f = rng.next();
        w.beginPath();
        w.arc(s.x1 + (s.x2 - s.x1) * f, s.y1 + (s.y2 - s.y1) * f, ww * rng.range(0.05, 0.11), 0, Math.PI * 2);
        w.fillStyle = 'rgba(255,255,255,0.9)';
        w.fill();
      }
      break;
    case 'brick': {
      const bh = ww * 0.5, bw = ww * 1.1;
      w.beginPath();
      for (let y = 0, row = 0; y < vh; y += bh, row++) {
        w.moveTo(0, y);
        w.lineTo(vw, y);
        for (let x = (row % 2) * bw * 0.5; x < vw; x += bw) {
          w.moveTo(x, y);
          w.lineTo(x, y + bh);
        }
      }
      w.strokeStyle = rgba(T.wallShadow, 0.55);
      w.lineWidth = Math.max(1, ww * 0.07);
      w.stroke();
      break;
    }
    default:
      break;
  }
}

function drawWallLayer(w, segs, ww, colors, style, T, rng, vw, vh) {
  w.clearRect(0, 0, vw, vh);
  w.lineCap = 'round';
  w.lineJoin = 'round';
  strokeSegs(w, segs, ww, colors.shadow, ww * 0.3);
  if (style === 'space') {
    w.save();
    w.shadowColor = T.wallGlow || colors.main;
    w.shadowBlur = ww * 1.4;
    strokeSegs(w, segs, ww, colors.main);
    w.restore();
  } else {
    strokeSegs(w, segs, ww, colors.main);
  }
  w.save();
  w.globalCompositeOperation = 'source-atop';
  wallTexture(w, style, segs, ww, T, rng, vw, vh);
  w.restore();
  w.globalAlpha = 0.75;
  strokeSegs(w, segs, ww * 0.3, colors.hi, -ww * 0.16);
  w.globalAlpha = 1;
}

function floorDeco(s, kind, cx, cy, c, rng) {
  const corner = () => [cx + rng.pick([-1, 1]) * rng.range(0.22, 0.34) * c, cy + rng.pick([-1, 1]) * rng.range(0.22, 0.34) * c];
  switch (kind) {
    case 'flowers': {
      if (!rng.chance(0.45)) return;
      const [x, y] = corner();
      const col = rng.pick(['#ffffff', '#ffb3c6', '#fff3a0', '#d0bfff']);
      const r = c * 0.035;
      s.fillStyle = col;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        s.beginPath();
        s.arc(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3, r, 0, Math.PI * 2);
        s.fill();
      }
      s.beginPath();
      s.arc(x, y, r * 0.8, 0, Math.PI * 2);
      s.fillStyle = '#ffb703';
      s.fill();
      break;
    }
    case 'shells': {
      if (!rng.chance(0.35)) return;
      const [x, y] = corner();
      if (rng.chance(0.4)) {
        starPath(s, x, y, c * 0.07, c * 0.03, 5, rng.next());
        s.fillStyle = 'rgba(255,140,90,0.7)';
      } else {
        s.beginPath();
        s.ellipse(x, y, c * 0.05, c * 0.035, rng.next() * 3, 0, Math.PI * 2);
        s.fillStyle = 'rgba(200,170,120,0.45)';
      }
      s.fill();
      break;
    }
    case 'sprinkles': {
      const n = rng.int(3);
      for (let i = 0; i < n; i++) {
        const [x, y] = corner();
        const a = rng.next() * Math.PI;
        s.beginPath();
        s.moveTo(x - Math.cos(a) * c * 0.04, y - Math.sin(a) * c * 0.04);
        s.lineTo(x + Math.cos(a) * c * 0.04, y + Math.sin(a) * c * 0.04);
        s.strokeStyle = rng.pick(['#ff5fa2', '#4cc9f0', '#ffd23f', '#80ed99', '#b28dff']);
        s.lineWidth = c * 0.03;
        s.lineCap = 'round';
        s.stroke();
      }
      break;
    }
    case 'snow': {
      if (!rng.chance(0.35)) return;
      const [x, y] = corner();
      const r = c * 0.05;
      s.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI;
        s.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
        s.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      s.strokeStyle = 'rgba(120,170,220,0.5)';
      s.lineWidth = Math.max(1, c * 0.015);
      s.stroke();
      break;
    }
    case 'stars': {
      const n = rng.int(3);
      for (let i = 0; i < n; i++) {
        const [x, y] = corner();
        s.beginPath();
        s.arc(x, y, c * rng.range(0.008, 0.02), 0, Math.PI * 2);
        s.fillStyle = rng.chance(0.7) ? 'rgba(255,255,255,0.8)' : 'rgba(255,230,120,0.8)';
        s.fill();
      }
      break;
    }
    case 'tiles':
      s.strokeStyle = 'rgba(140,120,200,0.18)';
      s.lineWidth = 1;
      s.strokeRect(cx - c / 2 + 2, cy - c / 2 + 2, c - 4, c - 4);
      break;
    default:
      break;
  }
}

function bgDeco(s, kind, vw, vh, rng) {
  const n = Math.round((vw * vh) / 14000);
  for (let i = 0; i < n; i++) {
    const x = rng.next() * vw, y = rng.next() * vh, r = rng.range(6, 18);
    s.save();
    s.globalAlpha = rng.range(0.18, 0.38);
    switch (kind) {
      case 'flowers':
        s.fillStyle = '#ffffff';
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          s.beginPath();
          s.arc(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.45, 0, Math.PI * 2);
          s.fill();
        }
        break;
      case 'bubbles':
        s.beginPath();
        s.arc(x, y, r, 0, Math.PI * 2);
        s.strokeStyle = '#ffffff';
        s.lineWidth = 2;
        s.stroke();
        break;
      case 'candy':
        s.beginPath();
        s.arc(x, y, r * 0.8, 0, Math.PI * 2);
        s.fillStyle = rng.pick(['#ffffff', '#ff5fa2', '#9b5de5']);
        s.fill();
        break;
      case 'snow':
        drawSparkle(s, x, y, r * 0.8, '#ffffff');
        break;
      case 'stars':
        s.globalAlpha = rng.range(0.4, 0.9);
        if (rng.chance(0.25)) drawSparkle(s, x, y, r * 0.5, '#fff3b0');
        else {
          s.beginPath();
          s.arc(x, y, rng.range(0.8, 2), 0, Math.PI * 2);
          s.fillStyle = '#ffffff';
          s.fill();
        }
        break;
      case 'moons':
        if (rng.chance(0.2)) {
          s.beginPath();
          s.arc(x, y, r, 0, Math.PI * 2);
          s.arc(x + r * 0.45, y - r * 0.2, r * 0.85, 0, Math.PI * 2, true);
          s.fillStyle = '#fff7d6';
          s.fill();
        } else drawSparkle(s, x, y, r * 0.5, '#ffffff');
        break;
      default:
        break;
    }
    s.restore();
  }
}

// Kaksi kerrosta: ruudun kokoinen tausta ja labyrintin kokoinen lauta.
// Lauta piirretään ruutukoolla g.baseCell; kamera siirtää ja tarvittaessa skaalaa sitä.
export function buildStatic(g) {
  const { vw, vh, dpr } = g;
  const T = g.theme, L = g.level, c = g.baseCell, ww = g.wallW;
  const rng = makeRng((L.seed ^ 0x5bd1e995) >>> 0);

  // tausta
  const bg = g.bgLayer || document.createElement('canvas');
  bg.width = Math.round(vw * dpr);
  bg.height = Math.round(vh * dpr);
  const b = bg.getContext('2d');
  b.setTransform(dpr, 0, 0, dpr, 0, 0);
  const grad = b.createLinearGradient(0, 0, 0, vh);
  grad.addColorStop(0, T.bg[0]);
  grad.addColorStop(1, T.bg[1]);
  b.fillStyle = grad;
  b.fillRect(0, 0, vw, vh);
  bgDeco(b, T.bgDeco, vw, vh, rng);
  g.bgLayer = bg;

  // lauta
  const m = Math.ceil(ww * 0.5 + 28);
  const lw = L.cols * c + m * 2, lh = L.rows * c + m * 2;
  const ldpr = Math.min(dpr, g.scrollMode ? 2 : 3);
  const cv = g.mazeLayer || document.createElement('canvas');
  cv.width = Math.round(lw * ldpr);
  cv.height = Math.round(lh * ldpr);
  const s = cv.getContext('2d');
  s.setTransform(ldpr, 0, 0, ldpr, 0, 0);
  s.clearRect(0, 0, lw, lh);
  const ox = m, oy = m;
  const center = (x, y) => ({ x: ox + (x + 0.5) * c, y: oy + (y + 0.5) * c });

  const bx = ox - ww * 0.5, by = oy - ww * 0.5, bw = L.cols * c + ww, bh = L.rows * c + ww;
  s.save();
  s.shadowColor = 'rgba(0,0,0,0.28)';
  s.shadowBlur = 16;
  s.shadowOffsetY = 6;
  roundRectPath(s, bx, by, bw, bh, ww);
  s.fillStyle = T.floorA;
  s.fill();
  s.restore();
  s.fillStyle = T.floorB;
  for (let y = 0; y < L.rows; y++) {
    for (let x = 0; x < L.cols; x++) if ((x + y) % 2) s.fillRect(ox + x * c, oy + y * c, c, c);
  }
  for (let y = 0; y < L.rows; y++) {
    for (let x = 0; x < L.cols; x++) {
      if (inRoom(L, x, y)) continue;
      const p = center(x, y);
      floorDeco(s, T.floorDeco, p.x, p.y, c, rng);
    }
  }
  // aloituspaikka: pieni pehmeä matto
  const st = center(L.start.x, L.start.y);
  s.beginPath();
  s.ellipse(st.x, st.y + c * 0.18, c * 0.36, c * 0.2, 0, 0, Math.PI * 2);
  s.fillStyle = 'rgba(255,255,255,0.35)';
  s.fill();

  // haamun huone
  const r = L.room;
  const rx = ox + r.x * c, ry = oy + r.y * c, rw = r.w * c, rh = r.h * c;
  s.fillStyle = T.roomFloor;
  s.fillRect(rx, ry, rw, rh);
  roundRectPath(s, rx + c * 0.12, ry + c * 0.12, rw - c * 0.24, rh - c * 0.24, c * 0.18);
  s.fillStyle = T.roomFloor2;
  s.fill();
  roundRectPath(s, rx + c * 0.2, ry + c * 0.2, rw - c * 0.4, rh - c * 0.4, c * 0.12);
  s.fillStyle = T.roomFloor;
  s.fill();
  for (let i = 0; i < r.w * r.h * 2; i++) {
    drawHeart(s, rx + c * 0.3 + rng.next() * (rw - c * 0.6), ry + c * 0.3 + rng.next() * (rh - c * 0.6), c * 0.12, rgba(T.roomWall, 0.18));
  }

  // seinät erillisellä kerroksella, jotta pintakuvio osuu vain seiniin
  const segs = wallSegments(g, ox, oy, c);
  const wc = document.createElement('canvas');
  wc.width = cv.width;
  wc.height = cv.height;
  const w = wc.getContext('2d');
  w.setTransform(ldpr, 0, 0, ldpr, 0, 0);
  drawWallLayer(w, segs.filter((q) => !q.room), ww, { main: T.wall, shadow: T.wallShadow, hi: T.wallHi }, T.wallStyle, T, rng, lw, lh);
  s.setTransform(1, 0, 0, 1, 0, 0);
  s.drawImage(wc, 0, 0);
  drawWallLayer(w, segs.filter((q) => q.room), ww * 1.15,
    { main: T.roomWall, shadow: darken(T.roomWall, 0.3), hi: lighten(T.roomWall, 0.4) }, 'plain', T, rng, lw, lh);
  s.drawImage(wc, 0, 0);
  wc.width = 0;
  wc.height = 0;

  g.mazeLayer = cv;
  g.layerMargin = m;
  g.layerCell = c;
  g.layerSize = { w: lw, h: lh };
}

// ---------------------------------------------------------------- dynaaminen
function drawItems(g, ctx) {
  const L = g.level, c = g.cell, t = g.time;
  for (const coin of L.coins) {
    if (coin.taken) continue;
    const p = g.cellCenter(coin.x, coin.y);
    const ph = coin.x * 1.7 + coin.y * 2.3;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + c * 0.2, c * 0.13, c * 0.04, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fill();
    drawCoin(ctx, p.x, p.y + Math.sin(t * 3 + ph) * c * 0.03, c * 0.36, Math.cos(t * 2.4 + ph));
  }
  for (const k of L.keys) {
    if (k.taken) continue;
    const p = g.cellCenter(k.x, k.y);
    const pulse = 0.75 + 0.25 * Math.sin(t * 3 + k.x);
    const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, c * 0.48);
    gr.addColorStop(0, rgba(k.color, 0.45 * pulse));
    gr.addColorStop(1, rgba(k.color, 0));
    ctx.fillStyle = gr;
    ctx.fillRect(p.x - c / 2, p.y - c / 2, c, c);
    drawKey(ctx, p.x, p.y + Math.sin(t * 2.6 + k.y) * c * 0.04, c * 0.62, k.color, -0.55 + Math.sin(t * 2) * 0.12);
    const sa = t * 2 + k.x * 3;
    drawSparkle(ctx, p.x + Math.cos(sa) * c * 0.3, p.y + Math.sin(sa) * c * 0.24, c * 0.07 * (0.6 + 0.4 * Math.sin(t * 6)), '#ffffff');
  }
}

function drawDoor(g, ctx) {
  const geo = doorGeometry(g);
  const T = g.theme;
  const open = g.door.openT;
  if (open >= 1) return;
  const ease = open * open * (3 - 2 * open);
  const shake = g.door.shake > 0 ? Math.sin(g.time * 50) * g.door.shake * 4 : 0;
  ctx.save();
  ctx.translate(geo.cx, geo.cy);
  if (!geo.horizontal) ctx.rotate(Math.PI / 2);
  ctx.translate(shake, 0);
  const len = geo.len * (1 - ease);
  ctx.translate(-(geo.len - len) / 2, 0);
  ctx.globalAlpha = 1 - ease * 0.4;
  roundRectPath(ctx, -len / 2, -geo.thick / 2, len, geo.thick, geo.thick * 0.3);
  ctx.fillStyle = T.door;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = darken(T.door, 0.4);
  ctx.stroke();
  ctx.beginPath();
  for (let i = 1; i < 4; i++) {
    const x = -len / 2 + (len * i) / 4;
    ctx.moveTo(x, -geo.thick / 2 + 3);
    ctx.lineTo(x, geo.thick / 2 - 3);
  }
  ctx.strokeStyle = rgba('#000000', 0.15);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (open === 0) {
    const k = g.keyholes.length;
    g.keyholes.forEach((kh, i) => {
      const x = ((i + 0.5) / k - 0.5) * geo.span;
      const r = geo.holeR;
      if (kh.filled) {
        ctx.beginPath();
        ctx.arc(x, 0, r * 1.15, 0, Math.PI * 2);
        ctx.fillStyle = kh.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        drawSparkle(ctx, x - r * 0.3, -r * 0.3, r * 0.5, '#ffffff');
      } else {
        const fl = kh.flash > 0 ? 1 + Math.sin(g.time * 20) * 0.25 * kh.flash : 1;
        ctx.beginPath();
        ctx.arc(x, 0, r * fl, 0, Math.PI * 2);
        ctx.fillStyle = '#2b1d14';
        ctx.fill();
        ctx.lineWidth = Math.max(2, r * 0.42);
        ctx.strokeStyle = kh.color;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, -r * 0.2);
        ctx.lineTo(x, r * 0.45);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(1.5, r * 0.25);
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    });
  }
  ctx.restore();
}

function drawDiamondInRoom(g, ctx) {
  const L = g.level;
  if (L.diamond.taken) return;
  const c = g.cell, t = g.time;
  const p = g.cellCenter(L.diamond.x, L.diamond.y);
  const pulse = 0.7 + 0.3 * Math.sin(t * 2.5);
  const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, c * 0.62);
  gr.addColorStop(0, rgba(g.theme.diamond, 0.55 * pulse));
  gr.addColorStop(1, rgba(g.theme.diamond, 0));
  ctx.fillStyle = gr;
  ctx.fillRect(p.x - c, p.y - c, c * 2, c * 2);
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + c * 0.3, c * 0.22, c * 0.06, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fill();
  drawDiamond(ctx, p.x, p.y - c * 0.02 + Math.sin(t * 2) * c * 0.04, c * 0.66, g.theme.diamond, t);
}

function drawBubble(g, ctx, x, y, side = 0) {
  const gh = g.ghost;
  if (!gh.bubble) return;
  const c = g.cell;
  const s = Math.max(30, c * 0.62);
  const age = g.time - gh.bubbleAt;
  const pop = Math.min(1, age / 0.18);
  const bx = x + side * c * 0.5, by = y - c * 0.62 - s * 0.5;
  ctx.save();
  ctx.translate(bx, by);
  ctx.scale(pop, pop);
  const isText = gh.bubble === 'BUU!';
  const bw = isText ? s * 1.9 : s * 1.15, bh = s * 0.95;
  roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, bh * 0.4);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-s * 0.12, bh / 2 - 1);
  ctx.lineTo(0, bh / 2 + s * 0.22);
  ctx.lineTo(s * 0.14, bh / 2 - 1);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#aab6e8';
  roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, bh * 0.4);
  ctx.stroke();
  if (isText) {
    ctx.fillStyle = '#5a4bd1';
    ctx.font = `900 ${Math.round(s * 0.5)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BUU!', 0, s * 0.03);
  } else if (gh.bubble === 'key') {
    drawKey(ctx, 0, 0, s * 0.8, gh.bubbleColor || '#ffbe0b', -0.5);
  } else if (gh.bubble === 'diamond') {
    drawDiamond(ctx, 0, 0, s * 0.65, g.theme.diamond, g.time);
  } else if (gh.bubble === 'heart') {
    drawHeart(ctx, 0, s * 0.04, s * 0.7, '#ff4d8d');
  }
  ctx.restore();
}

function drawActors(g, ctx) {
  const c = g.cell, t = g.time;
  const pl = g.player, gh = g.ghost;
  const pp = g.cellCenter(pl.px, pl.py);
  if (pl.bump) {
    const k = Math.sin(pl.bump.t * Math.PI) * c * 0.15;
    pp.x += DX[pl.bump.dir] * k;
    pp.y += DY[pl.bump.dir] * k;
  }
  const gp = g.cellCenter(gh.x, gh.y);
  const hover = c * 0.16 + Math.sin(t * 2.2) * c * 0.05;
  const dx = pp.x - gp.x, dy = pp.y - gp.y, dl = Math.hypot(dx, dy) || 1;

  const drawG = () => {
    ctx.beginPath();
    ctx.ellipse(gp.x, gp.y + c * 0.32, c * 0.24 - hover * 0.3, c * 0.06, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.13)';
    ctx.fill();
    drawGhost(ctx, gp.x, gp.y - hover, c * 0.8, {
      t, mood: gh.mood, lookX: dx / dl, lookY: dy / dl, costume: g.theme.costume,
    });
  };
  const drawP = () => {
    // Sormi painettu kauas Leiasta: sykkivä rengas vinkkaa, että Leiasta pitää ottaa kiinni
    if (g.fingerActive && !g.fingerLinked && g.time - g.fingerDownAt > 0.4 && g.state === 'play') {
      const k = (g.time * 1.6) % 1;
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, c * (0.45 + k * 0.45), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - k)})`;
      ctx.lineWidth = Math.max(3, c * 0.08);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, c * 0.48, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,214,10,0.85)';
      ctx.lineWidth = Math.max(2, c * 0.05);
      ctx.stroke();
    }
    drawLeia(ctx, pp.x, pp.y - c * 0.03, c * 0.95, {
      t, facing: pl.facing, walking: pl.moving, walkT: pl.walkT, happy: pl.happy, jump: pl.jump, outfit: g.outfit,
    });
  };
  if (gp.y < pp.y) { drawG(); drawP(); } else { drawP(); drawG(); }
  // Puhekupla ja Leian nostama timantti piirretään päällimmäisiksi
  const finishing = g.level.diamond.taken;
  drawBubble(g, ctx, gp.x, gp.y - hover, finishing ? Math.sign(gp.x - pp.x) || 1 : 0);
  if (finishing) {
    const dy2 = pp.y - c * 0.03 - pl.jump - c * 0.78;
    const gr = ctx.createRadialGradient(pp.x, dy2, 0, pp.x, dy2, c * 0.7);
    gr.addColorStop(0, rgba(g.theme.diamond, 0.5));
    gr.addColorStop(1, rgba(g.theme.diamond, 0));
    ctx.fillStyle = gr;
    ctx.fillRect(pp.x - c, dy2 - c, c * 2, c * 2);
    drawDiamond(ctx, pp.x, dy2, c * 0.72, g.theme.diamond, t);
  }
}

function drawParticles(g, ctx) {
  for (const p of g.particles) {
    const a = Math.max(0, Math.min(1, p.life / p.max * 1.5));
    ctx.save();
    ctx.globalAlpha = a;
    if (p.kind === 'confetti') {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.abs(Math.cos(p.rot * 1.7)) * 0.8 + 0.2);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
    } else if (p.kind === 'heart') {
      drawHeart(ctx, p.x, p.y, p.size, p.color);
    } else {
      drawSparkle(ctx, p.x, p.y, p.size * (0.5 + 0.5 * a), p.color);
    }
    ctx.restore();
  }
}

function flyerPos(f) {
  const to = f.to();
  const k = f.t;
  const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const cx = (f.from.x + to.x) / 2;
  const cy = Math.min(f.from.y, to.y) - f.arc;
  const x = (1 - e) * (1 - e) * f.from.x + 2 * (1 - e) * e * cx + e * e * to.x;
  const y = (1 - e) * (1 - e) * f.from.y + 2 * (1 - e) * e * cy + e * e * to.y;
  return { x, y };
}

function drawFlyers(g, ctx) {
  for (const f of g.flyers) {
    const p = flyerPos(f);
    if (f.kind === 'key') {
      const s = g.cell * (0.62 + Math.sin(f.t * Math.PI) * 0.35);
      drawKey(ctx, p.x, p.y, s, f.color, -0.55 + f.t * Math.PI * 2);
    } else {
      drawCoin(ctx, p.x, p.y, Math.max(18, g.cell * 0.36) * (1 - f.t * 0.2), Math.cos(f.t * 12));
    }
  }
}

function drawHud(g, ctx) {
  const H = g.hud;
  if (!H) return;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.18)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  roundRectPath(ctx, H.pill.x, H.pill.y, H.pill.w, H.pill.h, H.pill.h / 2);
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.fill();
  ctx.restore();
  g.keyholes.forEach((kh, i) => {
    const s = H.slots[i];
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = kh.filled ? rgba(kh.color, 0.22) : 'rgba(0,0,0,0.07)';
    ctx.fill();
    ctx.setLineDash(kh.filled ? [] : [4, 4]);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = rgba(kh.color, kh.filled ? 1 : 0.7);
    ctx.stroke();
    ctx.setLineDash([]);
    if (kh.filled) {
      const pop = Math.min(1, (g.time - kh.filledAt) / 0.25);
      const sc = 1 + Math.sin(pop * Math.PI) * 0.3;
      drawKey(ctx, s.x, s.y, s.r * 1.7 * sc, kh.color, -0.6);
    } else {
      ctx.globalAlpha = 0.25;
      drawKey(ctx, s.x, s.y, s.r * 1.5, '#7a7a8c', -0.6);
      ctx.globalAlpha = 1;
    }
  });
  const pulse = g.hudCoinPulse > 0 ? 1 + g.hudCoinPulse * 0.18 : 1;
  drawCoin(ctx, H.coin.x, H.coin.y, H.coinSize * pulse, 1);
  ctx.fillStyle = '#8a5a00';
  ctx.font = `800 ${Math.round(H.coinSize * 0.85)}px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(g.coinsCollected), H.coin.x + H.coinSize * 0.75, H.coin.y + 1);
}

function drawBanner(g, ctx) {
  const b = g.banner;
  if (!b) return;
  const a = b.t < 0.25 ? b.t / 0.25 : b.t > 1.9 ? Math.max(0, (2.3 - b.t) / 0.4) : 1;
  const cx = g.vw / 2, cy = g.area.y + g.area.h * 0.5;
  ctx.save();
  ctx.globalAlpha = a;
  const sc = 0.85 + 0.15 * Math.min(1, b.t / 0.25);
  ctx.translate(cx, cy);
  ctx.scale(sc, sc);
  ctx.font = `900 34px ${FONT}`;
  const w = Math.max(ctx.measureText(b.title).width, 160) + 56;
  roundRectPath(ctx, -w / 2, -46, w, 92, 30);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fill();
  ctx.fillStyle = '#3d2f7a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(b.title, 0, -10);
  ctx.font = `700 19px ${FONT}`;
  ctx.fillStyle = '#7a6bb5';
  ctx.fillText(b.sub, 0, 24);
  ctx.restore();
}

// Isoissa kentissä: ruudun reunassa osoitin näkymättömissä oleville avaimille
// (ja lopuksi timantille), jotta tietää mihin suuntaan kannattaa lähteä.
function drawIndicators(g, ctx) {
  if (!g.scrollMode || g.overview || g.state !== 'play') return;
  const A = g.area, L = g.level;
  const targets = L.keys.filter((k) => !k.taken).map((k) => ({ x: k.x, y: k.y, kind: 'key', color: k.color }));
  if (!targets.length && !L.door.locked && !L.diamond.taken) targets.push({ x: L.diamond.x, y: L.diamond.y, kind: 'diamond' });
  const cx = A.x + A.w / 2, cy = A.y + A.h / 2;
  const R = 21, inset = R + 8;
  const placed = [];
  for (const t of targets) {
    const p = g.cellCenter(t.x, t.y);
    if (p.x > A.x && p.x < A.x + A.w && p.y > A.y && p.y < A.y + A.h) continue;
    const dx = p.x - cx, dy = p.y - cy;
    const kx = (A.w / 2 - inset) / Math.max(1e-6, Math.abs(dx)), ky = (A.h / 2 - inset) / Math.max(1e-6, Math.abs(dy));
    const k = Math.min(kx, ky);
    let ix = cx + dx * k, iy = cy + dy * k;
    // päällekkäiset osoittimet siirretään reunaa pitkin vierekkäin
    const vertEdge = kx < ky;
    for (let pass = 0; pass < 6; pass++) {
      const hit = placed.find((q) => Math.hypot(q.x - ix, q.y - iy) < R * 2.15);
      if (!hit) break;
      if (vertEdge) iy = Math.min(A.y + A.h - inset, Math.max(A.y + inset, iy + (iy >= hit.y ? 1 : -1) * R * 2.2));
      else ix = Math.min(A.x + A.w - inset, Math.max(A.x + inset, ix + (ix >= hit.x ? 1 : -1) * R * 2.2));
    }
    placed.push({ x: ix, y: iy });
    const ang = Math.atan2(p.y - iy, p.x - ix);
    const hinted = g.hint && g.hint.target && g.hint.target.x === t.x && g.hint.target.y === t.y;
    const sc = hinted ? 1 + 0.18 * Math.sin(g.time * 10) : 1 + 0.05 * Math.sin(g.time * 3);
    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(sc, sc);
    ctx.save();
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(R + 11, 0);
    ctx.lineTo(R - 3, -9);
    ctx.lineTo(R - 3, 9);
    ctx.closePath();
    ctx.fillStyle = t.kind === 'key' ? t.color : g.theme.diamond;
    ctx.fill();
    ctx.restore();
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3;
    ctx.strokeStyle = t.kind === 'key' ? t.color : g.theme.diamond;
    ctx.stroke();
    if (t.kind === 'key') drawKey(ctx, 0, 0, R * 1.5, t.color, -0.6);
    else drawDiamond(ctx, 0, 1, R * 1.25, g.theme.diamond, g.time);
    ctx.restore();
  }
}

export function renderGame(g, ctx) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (g.bgLayer) ctx.drawImage(g.bgLayer, 0, 0);
  ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
  ctx.save();
  if (g.scrollMode) {
    // labyrintti ei mene yläpalkin alle
    ctx.beginPath();
    ctx.rect(0, g.area.y - 6, g.vw, g.vh);
    ctx.clip();
  }
  if (g.mazeLayer) {
    const z = g.cell / g.layerCell, m = g.layerMargin;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(g.mazeLayer, g.ox - m * z, g.oy - m * z, g.layerSize.w * z, g.layerSize.h * z);
  }
  drawItems(g, ctx);
  drawDiamondInRoom(g, ctx);
  drawDoor(g, ctx);
  drawActors(g, ctx);
  ctx.restore();
  drawParticles(g, ctx);
  drawIndicators(g, ctx);
  drawFlyers(g, ctx);
  drawHud(g, ctx);
  drawBanner(g, ctx);
}

export { flyerPos };
