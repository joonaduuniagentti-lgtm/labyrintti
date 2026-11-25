// Kosketus, hiiri ja näppäimistö.
// Leiaa ohjataan vetämällä sormella reittiä Leiasta eteenpäin: Leia kulkee samat
// ruudut kuin sormi. Kaukaa painaminen ei liikuta Leiaa. Napautus Leian päälle
// saa hänet hyppäämään. Tietokoneella nuolinäppäin = yksi askel.
import { N, E, S, W } from './maze.js';

export function attachInput(canvas, game) {
  let activeId = null;

  canvas.addEventListener('pointerdown', (e) => {
    if (activeId !== null) return;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
    activeId = e.pointerId;
    game.fingerDown(e.clientX, e.clientY);
  }, { passive: false });

  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId !== activeId) return;
    e.preventDefault();
    // Nopeissa vedoissa selain voi niputtaa liikkeitä: käydään kaikki läpi
    const list = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
    if (list.length) for (const ev of list) game.fingerMoveTo(ev.clientX, ev.clientY);
    else game.fingerMoveTo(e.clientX, e.clientY);
  }, { passive: false });

  const end = (e) => {
    if (e.pointerId !== activeId) return;
    activeId = null;
    game.fingerUp();
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

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
