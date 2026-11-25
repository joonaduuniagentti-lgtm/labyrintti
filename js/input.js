// Kosketus, hiiri ja näppäimistö.
// - Sormi pohjassa missä tahansa: Leia kävelee sormea kohti niin kauan kuin sormi
//   on ruudulla. Sormea liikuttamalla Leiaa voi taluttaa labyrintissa.
// - Nopea pyyhkäisy: Leia kulkee siihen suuntaan seuraavaan risteykseen asti.
// - Napautus: lähellä olevaan ruutuun kävellään, kauempana napautus kertoo suunnan.
import { N, E, S, W } from './maze.js';

const dirOf = (dx, dy) => (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? E : W) : (dy > 0 ? S : N));

const HOLD_MS = 160;      // näin pian painalluksesta Leia lähtee seuraamaan sormea
const FLICK_MS = 380;     // nopea, pitkä liike tätä lyhyemmässä ajassa on pyyhkäisy
const FLICK_DIST = 40;    // pikseliä

export function attachInput(canvas, game) {
  let active = null;

  const engage = () => {
    if (!active || active.engaged) return;
    const dist = Math.hypot(active.x - active.sx, active.y - active.sy);
    const age = performance.now() - active.t0;
    // Nopea pitkä veto heti alussa näyttää pyyhkäisyltä: odotetaan vielä hetki
    if (dist > FLICK_DIST && age < FLICK_MS) {
      active.timer = setTimeout(engage, FLICK_MS - age + 10);
      return;
    }
    active.engaged = true;
    game.fingerHold(active.x, active.y);
  };

  canvas.addEventListener('pointerdown', (e) => {
    if (active) return;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
    const x = e.clientX, y = e.clientY;
    active = { id: e.pointerId, sx: x, sy: y, x, y, t0: performance.now(), engaged: false };
    active.timer = setTimeout(engage, HOLD_MS);
  }, { passive: false });

  canvas.addEventListener('pointermove', (e) => {
    if (!active || e.pointerId !== active.id) return;
    e.preventDefault();
    active.x = e.clientX;
    active.y = e.clientY;
    if (active.engaged) game.fingerMove(active.x, active.y);
  }, { passive: false });

  const end = (e) => {
    if (!active || e.pointerId !== active.id) return;
    clearTimeout(active.timer);
    const x = e.clientX, y = e.clientY;
    if (active.engaged) {
      game.fingerRelease();
    } else {
      const dx = x - active.sx, dy = y - active.sy;
      if (Math.hypot(dx, dy) >= 24) game.inputDir(dirOf(dx, dy));
      else game.tapAt(x, y);
    }
    active = null;
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', () => {
    if (!active) return;
    clearTimeout(active.timer);
    if (active.engaged) game.fingerRelease();
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
