// Kosketus, hiiri ja näppäimistö.
// - Pyyhkäisy missä tahansa: Leia kulkee siihen suuntaan seuraavaan risteykseen asti.
//   Sormen voi pitää ruudulla ja "piirtää" uusia suuntia.
// - Leiasta kiinni tarttuminen: Leia seuraa sormea käytäviä pitkin.
// - Napautus: lähellä olevaan ruutuun kävellään, kauempana napautus kertoo suunnan.
import { N, E, S, W } from './maze.js';

const dirOf = (dx, dy) => (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? E : W) : (dy > 0 ? S : N));

export function attachInput(canvas, game) {
  let active = null;

  canvas.addEventListener('pointerdown', (e) => {
    if (active) return;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
    const x = e.clientX, y = e.clientY;
    active = {
      id: e.pointerId, sx: x, sy: y, ax: x, ay: y, moved: false, issued: false,
      mode: game.isNearPlayer(x, y) ? 'drag' : 'swipe',
    };
    if (active.mode === 'drag') game.dragStart(x, y);
  }, { passive: false });

  canvas.addEventListener('pointermove', (e) => {
    if (!active || e.pointerId !== active.id) return;
    e.preventDefault();
    const x = e.clientX, y = e.clientY;
    if (Math.hypot(x - active.sx, y - active.sy) > 10) active.moved = true;
    if (active.mode === 'drag') {
      game.dragMove(x, y);
      return;
    }
    const dx = x - active.ax, dy = y - active.ay;
    const th = Math.max(16, (game.cell || 40) * 0.28);
    if (Math.hypot(dx, dy) >= th) {
      // Sama suunta annetaan yhden pyyhkäisyn aikana vain kerran; uusi suunta heti.
      const dir = dirOf(dx, dy);
      if (dir !== active.lastDir) game.inputDir(dir);
      active.lastDir = dir;
      active.ax = x;
      active.ay = y;
      active.issued = true;
    }
  }, { passive: false });

  const end = (e) => {
    if (!active || e.pointerId !== active.id) return;
    const x = e.clientX, y = e.clientY;
    if (active.mode === 'drag') {
      game.dragEnd();
      if (!active.moved) game.tapPlayer();
    } else if (!active.issued) {
      const dx = x - active.sx, dy = y - active.sy;
      if (Math.hypot(dx, dy) >= 12) game.inputDir(dirOf(dx, dy));
      else game.tapAt(x, y);
    }
    active = null;
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', () => {
    if (active && active.mode === 'drag') game.dragEnd();
    active = null;
  });

  // iPhonen Safari: estetään sivun vieritys ja zoomaus pelialueella
  const stop = (e) => e.preventDefault();
  canvas.addEventListener('touchstart', stop, { passive: false });
  canvas.addEventListener('touchmove', stop, { passive: false });

  const KEYS = {
    ArrowUp: N, ArrowDown: S, ArrowLeft: W, ArrowRight: E,
    w: N, s: S, a: W, d: E, W: N, S: S, A: W, D: E,
  };
  window.addEventListener('keydown', (e) => {
    const d = KEYS[e.key];
    if (d == null || !game.acceptsInput()) return;
    e.preventDefault();
    game.inputDir(d);
  });
}
