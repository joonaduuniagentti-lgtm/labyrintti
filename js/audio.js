// Äänet ja musiikki tehdään Web Audio -rajapinnalla, joten äänitiedostoja ei tarvita.
import { makeRng } from './rng.js';

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class AudioEngine {
  constructor(store) {
    this.store = store;
    this.ctx = null;
    this.theme = null;
    this.musicTimer = null;
  }

  soundOn() {
    return !!this.store.data.sound;
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        // iPhonessa äänet kuuluvat myös äänettömällä kytkimellä (Safari 16.4+)
        if (navigator.audioSession) navigator.audioSession.type = 'playback';
      } catch (e) { /* ei tukea */ }
      const c = (this.ctx = new AC());
      this.master = c.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(c.destination);
      this.sfx = c.createGain();
      this.sfx.gain.value = this.soundOn() ? 1 : 0;
      this.sfx.connect(this.master);
      this.mus = c.createGain();
      this.mus.gain.value = 0;
      this.mus.connect(this.master);
      const delay = c.createDelay();
      delay.delayTime.value = 0.3;
      const fb = c.createGain();
      fb.gain.value = 0.25;
      const wet = c.createGain();
      wet.gain.value = 0.35;
      this.mus.connect(delay);
      delay.connect(fb);
      fb.connect(delay);
      delay.connect(wet);
      wet.connect(this.master);
      if (this.theme && !this.musicTimer) this.startMusic(this.theme);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  onVisibility(hidden) {
    if (!this.ctx) return;
    if (hidden) this.ctx.suspend().catch(() => {});
    else this.ctx.resume().catch(() => {});
  }

  setSound(on) {
    this.store.data.sound = on;
    this.store.save();
    if (this.sfx) this.sfx.gain.value = on ? 1 : 0;
  }

  setMusic(on) {
    this.store.data.music = on;
    this.store.save();
    if (on && this.theme) this.startMusic(this.theme);
    else this.stopMusic();
  }

  // Yksi sävel. when = absoluuttinen aika, at = viive nyt-hetkestä.
  tone(freq, dur, o = {}) {
    const c = this.ctx;
    if (!c) return null;
    const t0 = o.when != null ? o.when : c.currentTime + (o.at || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    const vol = o.vol != null ? o.vol : 0.2;
    const attack = o.attack || 0.006;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(o.dest || this.sfx);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
    return osc;
  }

  vibrato(osc, rate, depth, t0, dur) {
    const c = this.ctx;
    const lfo = c.createOscillator();
    const lg = c.createGain();
    lfo.frequency.value = rate;
    lg.gain.value = depth;
    lfo.connect(lg);
    lg.connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(t0 + dur + 0.05);
  }

  ok() {
    return this.ctx && this.soundOn();
  }

  tap() {
    if (!this.ok()) return;
    this.tone(620, 0.1, { to: 900, vol: 0.14 });
  }
  hop() {
    if (!this.ok()) return;
    this.tone(520, 0.16, { to: 1040, vol: 0.13, type: 'triangle' });
  }
  coin() {
    if (!this.ok()) return;
    this.tone(988, 0.09, { type: 'triangle', vol: 0.22 });
    this.tone(1319, 0.32, { type: 'triangle', vol: 0.22, at: 0.075 });
  }
  key() {
    if (!this.ok()) return;
    [1047, 1319, 1568, 2093].forEach((f, i) => this.tone(f, 0.28, { type: 'triangle', vol: 0.17, at: i * 0.07 }));
    this.tone(2637, 0.6, { vol: 0.05, at: 0.3 });
  }
  keyIn() {
    if (!this.ok()) return;
    this.tone(200, 0.05, { type: 'square', vol: 0.06 });
    this.tone(1568, 0.45, { vol: 0.15, at: 0.05 });
    this.tone(2093, 0.55, { vol: 0.1, at: 0.13 });
  }
  doorOpen() {
    if (!this.ok()) return;
    this.tone(220, 0.7, { type: 'triangle', to: 660, vol: 0.14 });
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.4, { type: 'triangle', vol: 0.16, at: 0.25 + i * 0.08 }));
  }
  locked() {
    if (!this.ok()) return;
    this.tone(196, 0.12, { type: 'square', vol: 0.05 });
    this.tone(175, 0.16, { type: 'square', vol: 0.05, at: 0.14 });
  }
  bump() {
    if (!this.ok()) return;
    const c = this.ctx;
    const t0 = c.currentTime;
    const osc = this.tone(300, 0.28, { to: 140, vol: 0.16 });
    if (osc) this.vibrato(osc, 18, 30, t0, 0.28);
  }
  hint() {
    if (!this.ok()) return;
    [1568, 2093, 2637].forEach((f, i) => this.tone(f, 0.4, { vol: 0.08, at: i * 0.12 }));
  }
  levelStart() {
    if (!this.ok()) return;
    this.tone(784, 0.15, { type: 'triangle', vol: 0.14 });
    this.tone(1047, 0.35, { type: 'triangle', vol: 0.14, at: 0.12 });
  }
  diamond() {
    if (!this.ok()) return;
    [1047, 1175, 1319, 1568, 1760, 2093, 2349, 2637].forEach((f, i) => this.tone(f, 0.35, { vol: 0.13, at: i * 0.055 }));
    for (let i = 0; i < 8; i++) this.tone(2400 + Math.random() * 2200, 0.25, { vol: 0.035, at: 0.45 + i * 0.07 });
  }
  boo() {
    if (!this.ok()) return;
    const c = this.ctx;
    const t0 = c.currentTime;
    const osc = this.tone(380, 0.95, { to: 230, vol: 0.24, attack: 0.08 });
    if (osc) this.vibrato(osc, 6, 14, t0, 0.95);
    this.tone(760, 0.9, { to: 460, vol: 0.04, attack: 0.08 });
  }
  giggle() {
    if (!this.ok()) return;
    for (let i = 0; i < 6; i++) {
      const f = 880 - i * 50 + (i % 2) * 140;
      this.tone(f, 0.08, { to: f * 1.15, vol: 0.13, at: i * 0.1 });
    }
  }
  fanfare() {
    if (!this.ok()) return;
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, { type: 'triangle', vol: 0.18, at: i * 0.12 }));
    [523, 659, 784, 1047].forEach((f) => this.tone(f, 1.1, { type: 'triangle', vol: 0.08, at: 0.55 }));
  }

  // ------------------------------------------------------------ musiikki
  startMusic(theme) {
    this.theme = theme;
    if (!this.ctx) return;
    this.stopMusic();
    if (!this.store.data.music) return;
    const m = theme.music;
    const rng = makeRng(m.seed);
    const prog = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]]; // I V vi IV
    const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
    const melody = [];
    let idx = 4;
    for (let s = 0; s < 32; s++) {
      const bar = s >> 3;
      const play = s % 2 === 0 ? rng.chance(0.75) : rng.chance(0.3);
      if (!play) { melody.push(null); continue; }
      if (s % 4 === 0) {
        const n = rng.pick(prog[bar]) + 12;
        melody.push(n);
        idx = Math.max(0, scale.findIndex((v) => v >= n % 24));
      } else {
        idx = Math.max(0, Math.min(scale.length - 1, idx + rng.pick([-2, -1, 1, 1, 2])));
        melody.push(scale[idx] + 12);
      }
    }
    this.pattern = { melody, prog, root: m.root - 12, step: 60 / m.tempo / 2 };
    this.step = 0;
    const c = this.ctx;
    this.nextTime = c.currentTime + 0.2;
    this.mus.gain.cancelScheduledValues(c.currentTime);
    this.mus.gain.setValueAtTime(0.0001, c.currentTime);
    this.mus.gain.linearRampToValueAtTime(0.5, c.currentTime + 1.5);
    this.musicTimer = setInterval(() => this.scheduleMusic(), 60);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.ctx && this.mus) {
      const c = this.ctx;
      this.mus.gain.cancelScheduledValues(c.currentTime);
      this.mus.gain.setValueAtTime(this.mus.gain.value, c.currentTime);
      this.mus.gain.linearRampToValueAtTime(0.0001, c.currentTime + 0.3);
    }
  }

  scheduleMusic() {
    const c = this.ctx, P = this.pattern;
    if (!c || !P || c.state !== 'running') return;
    if (this.nextTime < c.currentTime) this.nextTime = c.currentTime + 0.05;
    while (this.nextTime < c.currentTime + 0.3) {
      const s = this.step % 32;
      const bar = s >> 3;
      if (s % 4 === 0) {
        const bass = P.root - 12 + P.prog[bar][s % 8 === 0 ? 0 : 2] - (s % 8 === 0 ? 0 : 12);
        this.tone(midi(bass), P.step * 3.6, { type: 'triangle', vol: 0.12, when: this.nextTime, dest: this.mus, attack: 0.02 });
      }
      const n = P.melody[s];
      if (n != null) {
        const f = midi(P.root + n);
        this.tone(f, 0.7, { vol: 0.07, when: this.nextTime, dest: this.mus });
        this.tone(f * 2, 0.35, { vol: 0.018, when: this.nextTime, dest: this.mus });
      }
      this.nextTime += P.step;
      this.step++;
    }
  }
}
