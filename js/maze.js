// Labyrintin generointi: käytävät, keskellä haamun huone, ovi, avaimet, kolikot ja timantti.
import { makeRng } from './rng.js';

export const N = 1, E = 2, S = 4, W = 8;
export const DIRS = [N, E, S, W];
export const DX = { 1: 0, 2: 1, 4: 0, 8: -1 };
export const DY = { 1: -1, 2: 0, 4: 1, 8: 0 };
export const OPP = { 1: 4, 2: 8, 4: 1, 8: 2 };

// Avainten värit: punainen, keltainen, sininen, vihreä, violetti
export const KEY_COLORS = ['#ff4d6d', '#ffbe0b', '#3a86ff', '#2ec27e', '#9b5de5'];

const bitCount = (v) => (v & 1) + ((v >> 1) & 1) + ((v >> 2) & 1) + ((v >> 3) & 1);

export function inRoom(level, x, y) {
  const r = level.room;
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

export function isDoorEdge(level, x, y, d) {
  const dr = level.door;
  return (x === dr.x && y === dr.y && d === dr.dir) || (x === dr.ox && y === dr.oy && d === OPP[dr.dir]);
}

export function passable(level, x, y, d) {
  if (x < 0 || y < 0 || x >= level.cols || y >= level.rows) return false;
  if (!(level.open[y * level.cols + x] & d)) return false;
  if (level.door.locked && isDoorEdge(level, x, y, d)) return false;
  return true;
}

export function dirBetween(a, b) {
  if (b.x > a.x) return E;
  if (b.x < a.x) return W;
  if (b.y > a.y) return S;
  return N;
}

// Etäisyydet annetusta ruudusta kaikkiin muihin (lukittu ovi huomioidaan).
export function bfs(level, sx, sy) {
  const { cols, rows } = level;
  const dist = new Int16Array(cols * rows).fill(-1);
  const q = [sx + sy * cols];
  dist[q[0]] = 0;
  for (let h = 0; h < q.length; h++) {
    const i = q[h];
    const x = i % cols, y = (i / cols) | 0;
    for (const d of DIRS) {
      if (!passable(level, x, y, d)) continue;
      const j = x + DX[d] + (y + DY[d]) * cols;
      if (dist[j] !== -1) continue;
      dist[j] = dist[i] + 1;
      q.push(j);
    }
  }
  return dist;
}

// Lyhin reitti ruudusta toiseen. Palauttaa listan ruutuja (alku mukana) tai null.
export function findPath(level, from, to, maxLen = Infinity) {
  const { cols, rows } = level;
  if (to.x < 0 || to.y < 0 || to.x >= cols || to.y >= rows) return null;
  const start = from.x + from.y * cols;
  const goal = to.x + to.y * cols;
  if (start === goal) return [{ x: from.x, y: from.y }];
  const prev = new Int32Array(cols * rows).fill(-1);
  const dist = new Int16Array(cols * rows).fill(-1);
  dist[start] = 0;
  const q = [start];
  for (let h = 0; h < q.length; h++) {
    const i = q[h];
    if (dist[i] >= maxLen) continue;
    const x = i % cols, y = (i / cols) | 0;
    for (const d of DIRS) {
      if (!passable(level, x, y, d)) continue;
      const j = x + DX[d] + (y + DY[d]) * cols;
      if (dist[j] !== -1) continue;
      dist[j] = dist[i] + 1;
      prev[j] = i;
      if (j === goal) {
        const path = [];
        for (let k = j; k !== -1; k = prev[k]) path.push({ x: k % cols, y: (k / cols) | 0 });
        return path.reverse();
      }
      q.push(j);
    }
  }
  return null;
}

export function createLevel({ cols, rows, keys, braid, coins, seed }) {
  const rng = makeRng(seed);
  const idx = (x, y) => y * cols + x;
  const inside = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows;
  const open = new Uint8Array(cols * rows);

  // Haamun huone keskelle
  const rw = 3;
  const rh = Math.min(cols, rows) >= 9 ? 3 : 1;
  const room = { x: (cols - rw) >> 1, y: (rows - rh) >> 1, w: rw, h: rh };
  const roomCell = (x, y) => x >= room.x && x < room.x + rw && y >= room.y && y < room.y + rh;

  // Aloituspaikka johonkin kulmaan
  const corners = [[0, rows - 1], [cols - 1, rows - 1], [0, 0], [cols - 1, 0]];
  const [sx, sy] = rng.pick(corners);

  // 1) Käytävät: "recursive backtracker" huoneen ulkopuolelle
  const visited = new Uint8Array(cols * rows);
  const stack = [[sx, sy]];
  visited[idx(sx, sy)] = 1;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const options = [];
    for (const d of DIRS) {
      const nx = x + DX[d], ny = y + DY[d];
      if (inside(nx, ny) && !roomCell(nx, ny) && !visited[idx(nx, ny)]) options.push(d);
    }
    if (!options.length) {
      stack.pop();
      continue;
    }
    const d = rng.pick(options);
    const nx = x + DX[d], ny = y + DY[d];
    open[idx(x, y)] |= d;
    open[idx(nx, ny)] |= OPP[d];
    visited[idx(nx, ny)] = 1;
    stack.push([nx, ny]);
  }

  // 2) Silmukoita: osa umpikujista avataan, jolloin perille pääsee monta reittiä
  const outside = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (!roomCell(x, y)) outside.push([x, y]);
  for (const [x, y] of rng.shuffle(outside.slice())) {
    if (bitCount(open[idx(x, y)]) !== 1 || !rng.chance(braid)) continue;
    let best = [], bestScore = -1;
    for (const d of DIRS) {
      if (open[idx(x, y)] & d) continue;
      const nx = x + DX[d], ny = y + DY[d];
      if (!inside(nx, ny) || roomCell(nx, ny)) continue;
      const score = bitCount(open[idx(nx, ny)]) === 1 ? 2 : 1;
      if (score > bestScore) { bestScore = score; best = [d]; } else if (score === bestScore) best.push(d);
    }
    if (!best.length) continue;
    const d = rng.pick(best);
    open[idx(x, y)] |= d;
    open[idx(x + DX[d], y + DY[d])] |= OPP[d];
  }

  // 3) Huoneen sisäosa auki
  for (let y = room.y; y < room.y + rh; y++) {
    for (let x = room.x; x < room.x + rw; x++) {
      if (x < room.x + rw - 1) { open[idx(x, y)] |= E; open[idx(x + 1, y)] |= W; }
      if (y < room.y + rh - 1) { open[idx(x, y)] |= S; open[idx(x, y + 1)] |= N; }
    }
  }

  // 4) Ovi huoneen jollekin sivulle
  const midX = room.x + 1, midY = room.y + ((rh - 1) >> 1);
  const doorChoice = rng.pick([
    { x: midX, y: room.y, dir: N },
    { x: midX, y: room.y + rh - 1, dir: S },
    { x: room.x, y: midY, dir: W },
    { x: room.x + rw - 1, y: midY, dir: E },
  ]);
  const door = { ...doorChoice, ox: doorChoice.x + DX[doorChoice.dir], oy: doorChoice.y + DY[doorChoice.dir], locked: true };
  open[idx(door.x, door.y)] |= door.dir;
  open[idx(door.ox, door.oy)] |= OPP[door.dir];

  const level = { cols, rows, open, room, door, seed, start: { x: sx, y: sy } };

  // 5) Timantti ja haamu huoneeseen
  const center = { x: midX, y: midY };
  let diamond = center;
  if (center.x === door.x && center.y === door.y) {
    diamond = rng.pick([{ x: room.x, y: midY }, { x: room.x + rw - 1, y: midY }]);
  }
  let ghost = null, ghostScore = -1;
  for (let y = room.y; y < room.y + rh; y++) {
    for (let x = room.x; x < room.x + rw; x++) {
      if ((x === door.x && y === door.y) || (x === diamond.x && y === diamond.y)) continue;
      const score = Math.abs(x - door.x) + Math.abs(y - door.y) - 0.5 * (Math.abs(x - diamond.x) + Math.abs(y - diamond.y)) + rng.next() * 0.1;
      if (score > ghostScore) { ghostScore = score; ghost = { x, y }; }
    }
  }
  level.diamond = { ...diamond, taken: false };
  level.ghost = ghost;

  // 6) Avaimet: kauas aloituksesta ja toisistaan, mieluiten umpikujiin
  const isDeadEnd = (x, y) => bitCount(open[idx(x, y)]) === 1;
  const candidates = outside.filter(([x, y]) => !(x === sx && y === sy) && !(x === door.ox && y === door.oy));
  const distMaps = [bfs(level, sx, sy)];
  const keyList = [];
  const used = new Set([idx(sx, sy)]);
  for (let k = 0; k < keys; k++) {
    let best = null, bestScore = -Infinity;
    for (const [x, y] of candidates) {
      const i = idx(x, y);
      if (used.has(i)) continue;
      let m = Infinity;
      for (const dm of distMaps) m = Math.min(m, dm[i]);
      const score = m + (isDeadEnd(x, y) ? 2.5 : 0) + rng.next() * 1.5;
      if (score > bestScore) { bestScore = score; best = { x, y }; }
    }
    if (!best) break;
    used.add(idx(best.x, best.y));
    keyList.push({ x: best.x, y: best.y, color: KEY_COLORS[k % KEY_COLORS.length], taken: false });
    distMaps.push(bfs(level, best.x, best.y));
  }
  level.keys = keyList;

  // 7) Kolikot: puolet "leivänmuruiksi" avainten suuntaan, loput sinne tänne
  const coinCells = new Set();
  const route = [];
  let cur = { x: sx, y: sy };
  const remaining = keyList.slice();
  while (remaining.length) {
    const dm = bfs(level, cur.x, cur.y);
    remaining.sort((a, b) => dm[idx(a.x, a.y)] - dm[idx(b.x, b.y)]);
    const next = remaining.shift();
    const p = findPath(level, cur, next) || [];
    route.push(...p.slice(1));
    cur = next;
  }
  const toDoor = findPath(level, cur, { x: door.ox, y: door.oy }) || [];
  route.push(...toDoor.slice(1));
  const routeCells = route.filter((c) => !used.has(idx(c.x, c.y)));
  const crumbs = Math.min(Math.ceil(coins / 2), routeCells.length);
  if (crumbs > 0) {
    const spacing = routeCells.length / crumbs;
    for (let i = 0; i < crumbs; i++) {
      const c = routeCells[Math.min(routeCells.length - 1, Math.floor(i * spacing + spacing / 2))];
      coinCells.add(idx(c.x, c.y));
    }
  }
  const free = rng.shuffle(candidates.filter(([x, y]) => !used.has(idx(x, y)) && !coinCells.has(idx(x, y))));
  for (const [x, y] of free) {
    if (coinCells.size >= coins) break;
    coinCells.add(idx(x, y));
  }
  level.coins = [...coinCells].map((i) => ({ x: i % cols, y: (i / cols) | 0, taken: false }));

  return level;
}
