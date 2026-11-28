// Kaikki hahmot ja esineet piirretään koodilla, joten peli ei tarvitse kuvatiedostoja.

export function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function mix(hex, target, amt) {
  const a = hexToRgb(hex), b = hexToRgb(target);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * amt));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
export const lighten = (hex, amt) => mix(hex, '#ffffff', amt);
export const darken = (hex, amt) => mix(hex, '#000000', amt);
export function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, Math.PI * 2);
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.01, r), 0, Math.PI * 2);
}

export function starPath(ctx, x, y, R, r, n = 5, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 ? r : R;
    const a = rot + (i * Math.PI) / n;
    const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  }
  ctx.closePath();
}

export function drawSparkle(ctx, x, y, r, color = '#ffffff') {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.quadraticCurveTo(0, 0, 0, r);
  ctx.quadraticCurveTo(0, 0, -r, 0);
  ctx.quadraticCurveTo(0, 0, 0, -r);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export function drawHeart(ctx, x, y, s, color = '#ff4d8d') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 100, s / 100);
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.bezierCurveTo(-55, -5, -30, -50, 0, -20);
  ctx.bezierCurveTo(30, -50, 55, -5, 0, 30);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- Leia
const LEIA = {
  hair: '#f8d56b', hairShade: '#d9a43a', hairHi: '#fff4c4',
  skin: '#ffe2cf', blush: 'rgba(255,140,165,0.55)',
  dress: '#ff6fae', dressLight: '#ffc2dc',
  shoes: '#d81b60', ribbon: '#ff3d81', ribbonDark: '#c2185b',
  eye: '#3a2618', mouth: '#b5364f', line: '#9a5a3c',
};

function drawPigtails(ctx, u, fx, swing, t) {
  for (const s of [-1, 1]) {
    const px = s * 26 * u - fx * 3 * u;
    const py = -10 * u;
    const rot = s * 0.28 + swing * 0.14 + Math.sin(t * 2.1 + s) * 0.04;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);
    ellipse(ctx, s * 3 * u, 12 * u, 8.5 * u, 13.5 * u);
    ctx.fillStyle = LEIA.hair;
    ctx.fill();
    ctx.lineWidth = 2 * u;
    ctx.strokeStyle = LEIA.hairShade;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s * 2 * u, 12 * u, 5 * u, -0.6, 0.9);
    ctx.strokeStyle = LEIA.hairHi;
    ctx.lineWidth = 2.4 * u;
    ctx.stroke();
    // rusetti
    ctx.fillStyle = LEIA.ribbon;
    ctx.strokeStyle = LEIA.ribbonDark;
    ctx.lineWidth = 1.4 * u;
    ellipse(ctx, -5 * u, -1 * u, 5.5 * u, 3.6 * u, -0.35);
    ctx.fill(); ctx.stroke();
    ellipse(ctx, 5 * u, -1 * u, 5.5 * u, 3.6 * u, 0.35);
    ctx.fill(); ctx.stroke();
    circle(ctx, 0, -1 * u, 2.6 * u);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}

function drawArm(ctx, u, sx, sy, hx, hy, sleeve = LEIA.dress) {
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(hx, hy);
  ctx.strokeStyle = LEIA.line;
  ctx.lineWidth = 9.5 * u;
  ctx.stroke();
  ctx.strokeStyle = LEIA.skin;
  ctx.lineWidth = 6.5 * u;
  ctx.stroke();
  circle(ctx, sx, sy, 5.5 * u);
  ctx.fillStyle = sleeve;
  ctx.fill();
  ctx.lineWidth = 1.8 * u;
  ctx.strokeStyle = LEIA.line;
  ctx.stroke();
}


// ---------------------------------------------------------------- Leian mekot
export const DEFAULT_OUTFIT = { dress: '#ff6fae', light: '#ffc2dc', shoes: '#d81b60', collar: '#ffffff', shape: 'aline' };

function dressPath(ctx, u, shape) {
  ctx.beginPath();
  if (shape === 'gown') {
    ctx.moveTo(-11 * u, 9 * u);
    ctx.lineTo(11 * u, 9 * u);
    ctx.quadraticCurveTo(14 * u, 16 * u, 15 * u, 24 * u);
    ctx.quadraticCurveTo(21 * u, 35 * u, 27 * u, 45 * u);
    ctx.quadraticCurveTo(0, 50 * u, -27 * u, 45 * u);
    ctx.quadraticCurveTo(-21 * u, 35 * u, -15 * u, 24 * u);
    ctx.quadraticCurveTo(-14 * u, 16 * u, -11 * u, 9 * u);
  } else if (shape === 'tutu') {
    ctx.moveTo(-11 * u, 9 * u);
    ctx.lineTo(11 * u, 9 * u);
    ctx.quadraticCurveTo(14 * u, 18 * u, 13 * u, 27 * u);
    ctx.lineTo(-13 * u, 27 * u);
    ctx.quadraticCurveTo(-14 * u, 18 * u, -11 * u, 9 * u);
  } else if (shape === 'mermaid') {
    ctx.moveTo(-11 * u, 9 * u);
    ctx.lineTo(11 * u, 9 * u);
    ctx.quadraticCurveTo(16 * u, 21 * u, 12 * u, 32 * u);
    ctx.quadraticCurveTo(9 * u, 37 * u, 6 * u, 38 * u);
    ctx.lineTo(-6 * u, 38 * u);
    ctx.quadraticCurveTo(-9 * u, 37 * u, -12 * u, 32 * u);
    ctx.quadraticCurveTo(-16 * u, 21 * u, -11 * u, 9 * u);
  } else {
    ctx.moveTo(-11 * u, 9 * u);
    ctx.lineTo(11 * u, 9 * u);
    ctx.quadraticCurveTo(15 * u, 14 * u, 22 * u, 37 * u);
    ctx.quadraticCurveTo(0, 42 * u, -22 * u, 37 * u);
    ctx.quadraticCurveTo(-15 * u, 14 * u, -11 * u, 9 * u);
  }
  ctx.closePath();
}

function tutuPath(ctx, u) {
  ctx.beginPath();
  ctx.moveTo(-14 * u, 23 * u);
  ctx.quadraticCurveTo(0, 19 * u, 14 * u, 23 * u);
  ctx.quadraticCurveTo(29 * u, 26 * u, 31 * u, 32 * u);
  const n = 7, w = 62 / n;
  for (let i = 0; i < n; i++) {
    const x0 = 31 - i * w, x1 = x0 - w;
    ctx.quadraticCurveTo(((x0 + x1) / 2) * u, 38 * u, x1 * u, 32 * u);
  }
  ctx.quadraticCurveTo(-29 * u, 26 * u, -14 * u, 23 * u);
  ctx.closePath();
}

function finPath(ctx, u, wig) {
  ctx.beginPath();
  ctx.moveTo(-6 * u, 36 * u);
  ctx.quadraticCurveTo((-10 + wig) * u, 41 * u, (-21 + wig) * u, 46 * u);
  ctx.quadraticCurveTo((-8 + wig) * u, 48 * u, wig * u, 43 * u);
  ctx.quadraticCurveTo((8 + wig) * u, 48 * u, (21 + wig) * u, 46 * u);
  ctx.quadraticCurveTo((10 + wig) * u, 41 * u, 6 * u, 36 * u);
  ctx.closePath();
}

const SPARKLE_SPOTS = [[-10, 16], [8, 21], [-3, 29], [13, 33], [-15, 35], [3, 13], [17, 27], [-8, 41], [9, 43], [-19, 44], [20, 40], [0, 36]];
const RAINBOW = ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];

// Kuosi piirretään mekon sisälle (kutsuja on rajannut piirron mekon muotoon)
function drawPattern(ctx, u, of, t) {
  const pt = of.pattern;
  if (!pt) return;
  const c = pt.color || '#ffffff';
  const bottom = of.shape === 'gown' ? 50 : 44;
  const grid = (step, fn) => {
    let row = 0;
    for (let y = 8; y <= bottom; y += step, row++) {
      for (let x = -34 + (row % 2 ? step / 2 : 0); x <= 34; x += step) fn(x * u, y * u, row, x);
    }
  };
  ctx.save();
  switch (pt.type) {
    case 'dots': {
      const k = pt.size || 1;
      ctx.fillStyle = c;
      grid(9 * k, (x, y) => { circle(ctx, x, y, 2.8 * k * u); ctx.fill(); });
      break;
    }
    case 'hstripes':
      ctx.fillStyle = c;
      for (let y = 13; y < bottom; y += 8) ctx.fillRect(-36 * u, y * u, 72 * u, 4 * u);
      break;
    case 'diag':
      ctx.strokeStyle = c;
      ctx.lineWidth = 3.6 * u;
      ctx.beginPath();
      for (let k = -70; k < 60; k += 9) {
        ctx.moveTo(k * u, 0);
        ctx.lineTo((k + 50) * u, 50 * u);
      }
      ctx.stroke();
      break;
    case 'rainbow': {
      const h = (bottom - 6) / RAINBOW.length;
      RAINBOW.forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.fillRect(-36 * u, (8 + i * h) * u, 72 * u, (h + 0.5) * u);
      });
      break;
    }
    case 'hearts':
      grid(11, (x, y) => drawHeart(ctx, x, y + u, 7 * u, c));
      break;
    case 'stars':
      ctx.fillStyle = c;
      grid(11, (x, y) => { starPath(ctx, x, y, 3.6 * u, 1.5 * u); ctx.fill(); });
      break;
    case 'flowers': {
      const cols = pt.colors || ['#ffffff'];
      grid(11, (x, y, row, gx) => {
        ctx.fillStyle = cols[Math.abs(row + Math.round(gx / 11)) % cols.length];
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          circle(ctx, x + Math.cos(a) * 2 * u, y + Math.sin(a) * 2 * u, 1.7 * u);
          ctx.fill();
        }
        circle(ctx, x, y, 1.3 * u);
        ctx.fillStyle = '#ffb703';
        ctx.fill();
      });
      break;
    }
    case 'seeds':
      ctx.fillStyle = c;
      grid(7, (x, y) => { ellipse(ctx, x, y, 0.9 * u, 1.5 * u); ctx.fill(); });
      break;
    case 'clouds':
      ctx.fillStyle = c;
      for (const [cx, cy] of [[-9, 16], [9, 25], [-12, 33], [7, 38], [14, 14], [-3, 44]]) {
        for (const [dx, dy, r] of [[-3, 0, 2.8], [0, -1.8, 3.2], [3, 0, 2.8]]) {
          circle(ctx, (cx + dx) * u, (cy + dy) * u, r * u);
          ctx.fill();
        }
      }
      break;
    case 'snow':
      ctx.strokeStyle = c;
      ctx.lineWidth = 1.1 * u;
      grid(10, (x, y) => {
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI;
          ctx.moveTo(x - Math.cos(a) * 3 * u, y - Math.sin(a) * 3 * u);
          ctx.lineTo(x + Math.cos(a) * 3 * u, y + Math.sin(a) * 3 * u);
        }
        ctx.stroke();
      });
      break;
    case 'sparkles':
      SPARKLE_SPOTS.forEach(([sx, sy], i) => drawSparkle(ctx, sx * u, sy * u, (2.4 + 1.2 * Math.sin(t * 4 + i * 1.7)) * u, c));
      break;
    case 'scales':
      ctx.strokeStyle = c;
      ctx.lineWidth = 1.3 * u;
      for (let y = 12, row = 0; y < bottom; y += 4.5, row++) {
        for (let x = -30 + (row % 2) * 3; x <= 30; x += 6) {
          ctx.beginPath();
          ctx.arc(x * u, y * u, 3 * u, 0, Math.PI);
          ctx.stroke();
        }
      }
      break;
    case 'paws':
      ctx.fillStyle = c;
      grid(12, (x, y) => {
        ellipse(ctx, x, y + 1.2 * u, 2.1 * u, 1.7 * u);
        ctx.fill();
        for (const [dx, dy] of [[-2.2, -1.6], [0, -2.6], [2.2, -1.6]]) {
          circle(ctx, x + dx * u, y + dy * u, 0.95 * u);
          ctx.fill();
        }
      });
      break;
    case 'planets': {
      ctx.fillStyle = '#ffffff';
      for (const [sx, sy] of [[-14, 14], [12, 17], [-2, 24], [15, 40], [-16, 42], [4, 45], [-6, 33]]) {
        circle(ctx, sx * u, sy * u, 0.9 * u);
        ctx.fill();
      }
      const planet = (x, y, r, col, ring) => {
        circle(ctx, x * u, y * u, r * u);
        ctx.fillStyle = col;
        ctx.fill();
        if (ring) {
          ctx.beginPath();
          ctx.ellipse(x * u, y * u, r * 1.9 * u, r * 0.55 * u, -0.3, 0, Math.PI * 2);
          ctx.strokeStyle = ring;
          ctx.lineWidth = 1.2 * u;
          ctx.stroke();
        }
      };
      planet(-7, 19, 4, '#ffb703', '#ffe8a3');
      planet(9, 30, 3.2, '#4cc9f0', null);
      planet(-11, 37, 2.6, '#ff70a6', '#ffd1e3');
      break;
    }
    case 'emblem':
      circle(ctx, 0, 19 * u, 6.2 * u);
      ctx.fillStyle = of.light;
      ctx.fill();
      starPath(ctx, 0, 19.5 * u, 5 * u, 2.1 * u);
      ctx.fillStyle = c;
      ctx.fill();
      break;
    case 'pastelhem':
      ['#ffb3c6', '#fff1a8', '#bde0fe', '#caffbf'].forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.fillRect(-36 * u, (25 + i * 3.6) * u, 72 * u, 3.7 * u);
      });
      break;
    default:
      break;
  }
  ctx.restore();
}

function drawWings(ctx, u, kind, t, walking) {
  const flap = 0.82 + 0.18 * Math.sin(t * (walking ? 14 : 4));
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(s * 8 * u, 15 * u);
    ctx.scale(s * flap, 1);
    ctx.lineWidth = 1.6 * u;
    if (kind === 'bee') {
      ctx.fillStyle = 'rgba(228,244,255,0.9)';
      ctx.strokeStyle = '#8fbfe0';
      ellipse(ctx, 17 * u, -9 * u, 10 * u, 14 * u, -0.75);
      ctx.fill(); ctx.stroke();
      ellipse(ctx, 15 * u, 6 * u, 7 * u, 9 * u, 0.55);
      ctx.fill(); ctx.stroke();
    } else if (kind === 'fairy') {
      ctx.fillStyle = 'rgba(228,208,255,0.75)';
      ctx.strokeStyle = '#b79cff';
      ellipse(ctx, 16 * u, -11 * u, 12 * u, 19 * u, -0.7);
      ctx.fill(); ctx.stroke();
      ellipse(ctx, 13 * u, 8 * u, 8 * u, 11 * u, 0.6);
      ctx.fill(); ctx.stroke();
      drawSparkle(ctx, 21 * u, -18 * u, (2.5 + Math.sin(t * 5)) * u, '#ffffff');
    } else if (kind === 'butterfly') {
      ctx.strokeStyle = '#5a3a1a';
      ctx.lineWidth = 1.8 * u;
      ellipse(ctx, 16 * u, -9 * u, 13 * u, 16 * u, -0.8);
      ctx.fillStyle = '#ff9f1c';
      ctx.fill(); ctx.stroke();
      circle(ctx, 19 * u, -12 * u, 4 * u);
      ctx.fillStyle = '#ffd08a';
      ctx.fill();
      ellipse(ctx, 12 * u, 9 * u, 9 * u, 10 * u, 0.6);
      ctx.fillStyle = '#ff6fae';
      ctx.fill(); ctx.stroke();
      circle(ctx, 13 * u, 10 * u, 2.2 * u);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawCape(ctx, u, color, t, walking, back) {
  const wave = Math.sin(t * (walking ? 12 : 3)) * 2;
  ctx.beginPath();
  ctx.moveTo(-11 * u, 10 * u);
  ctx.lineTo(11 * u, 10 * u);
  ctx.quadraticCurveTo(20 * u, 26 * u, (25 + wave) * u, 42 * u);
  ctx.quadraticCurveTo(12 * u, (46 - wave * 0.5) * u, 0, 43 * u);
  ctx.quadraticCurveTo(-12 * u, (46 + wave * 0.5) * u, (-25 - wave) * u, 42 * u);
  ctx.quadraticCurveTo(-20 * u, 26 * u, -11 * u, 10 * u);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2 * u;
  ctx.strokeStyle = darken(color, 0.3);
  ctx.stroke();
  if (back) {
    starPath(ctx, 0, 27 * u, 7 * u, 3 * u);
    ctx.fillStyle = '#ffd23f';
    ctx.fill();
  }
}

function drawTail(ctx, u, color, t, walking) {
  const wag = Math.sin(t * (walking ? 10 : 2.5)) * 2;
  ctx.beginPath();
  ctx.moveTo(6 * u, 28 * u);
  ctx.quadraticCurveTo(22 * u, 30 * u, (33 + wag) * u, 43 * u);
  ctx.quadraticCurveTo(18 * u, 42 * u, 8 * u, 37 * u);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2 * u;
  ctx.strokeStyle = darken(color, 0.3);
  ctx.stroke();
}

function drawHeadExtra(ctx, u, of, t) {
  const kind = of.head;
  if (!kind) return;
  const hc = of.headColor || '#ffd23f';
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.6 * u;
  const flower = (x, y, r, col) => {
    ctx.fillStyle = col;
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      circle(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.85);
      ctx.fill();
    }
    circle(ctx, x, y, r * 0.7);
    ctx.fillStyle = '#ffb703';
    ctx.fill();
  };
  switch (kind) {
    case 'antennae':
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * 7 * u, -38 * u);
        ctx.quadraticCurveTo(s * 9 * u, -50 * u, s * 16 * u, -53 * u);
        ctx.strokeStyle = hc;
        ctx.lineWidth = 2.2 * u;
        ctx.stroke();
        circle(ctx, s * 16 * u, -53 * u, 3.3 * u);
        ctx.fillStyle = hc;
        ctx.fill();
      }
      break;
    case 'leaves':
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.translate(0, -39 * u);
        ctx.rotate((i - 2) * 0.55);
        ellipse(ctx, 0, -5 * u, 3 * u, 6.5 * u);
        ctx.fillStyle = '#3fae5a';
        ctx.fill();
        ctx.strokeStyle = '#2a7a3c';
        ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.moveTo(0, -45 * u);
      ctx.lineTo(2 * u, -51 * u);
      ctx.strokeStyle = '#2a7a3c';
      ctx.lineWidth = 2.2 * u;
      ctx.stroke();
      break;
    case 'bigbow':
      ctx.fillStyle = hc;
      ctx.strokeStyle = darken(hc, 0.3);
      ellipse(ctx, 7 * u, -38 * u, 7.5 * u, 4.6 * u, -0.45);
      ctx.fill(); ctx.stroke();
      ellipse(ctx, 19 * u, -32 * u, 7.5 * u, 4.6 * u, 0.25);
      ctx.fill(); ctx.stroke();
      circle(ctx, 13 * u, -35 * u, 3 * u);
      ctx.fill(); ctx.stroke();
      break;
    case 'catears':
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * 8 * u, -37 * u);
        ctx.lineTo(s * 19 * u, -52 * u);
        ctx.lineTo(s * 23 * u, -31 * u);
        ctx.closePath();
        ctx.fillStyle = hc;
        ctx.fill();
        ctx.strokeStyle = darken(hc, 0.35);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 12 * u, -37 * u);
        ctx.lineTo(s * 18.5 * u, -47 * u);
        ctx.lineTo(s * 20.5 * u, -34 * u);
        ctx.closePath();
        ctx.fillStyle = '#ffb3c6';
        ctx.fill();
      }
      break;
    case 'spikes':
      // dinon selkäpiikit kulkevat pään yli otsalta niskaan
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * (1.25 + i * 0.125);
        const x = Math.cos(a) * 26 * u, y = -15 * u + Math.sin(a) * 26 * u;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a + Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(-3.6 * u, 1.5 * u);
        ctx.quadraticCurveTo(-1 * u, -5 * u, 0, -7.5 * u);
        ctx.quadraticCurveTo(1 * u, -5 * u, 3.6 * u, 1.5 * u);
        ctx.closePath();
        ctx.restore();
        ctx.fillStyle = hc;
        ctx.fill();
        ctx.strokeStyle = darken(hc, 0.35);
        ctx.stroke();
      }
      break;
    case 'starclip':
      starPath(ctx, 14 * u, -32 * u, 6.5 * u, 2.8 * u);
      ctx.fillStyle = '#ffd60a';
      ctx.fill();
      ctx.strokeStyle = '#d49b00';
      ctx.stroke();
      break;
    case 'snowclip':
      for (const [col, lw] of [['#6a9fd4', 3.6], ['#ffffff', 2]]) {
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI;
          ctx.moveTo(14 * u - Math.cos(a) * 6 * u, -32 * u - Math.sin(a) * 6 * u);
          ctx.lineTo(14 * u + Math.cos(a) * 6 * u, -32 * u + Math.sin(a) * 6 * u);
        }
        ctx.strokeStyle = col;
        ctx.lineWidth = lw * u;
        ctx.stroke();
      }
      break;
    case 'shellclip':
      ctx.beginPath();
      ctx.moveTo(14 * u, -27 * u);
      ctx.arc(14 * u, -27 * u, 8 * u, Math.PI * 1.15, Math.PI * 1.85);
      ctx.closePath();
      ctx.fillStyle = '#ffb3c6';
      ctx.fill();
      ctx.strokeStyle = '#e0709a';
      ctx.stroke();
      ctx.beginPath();
      for (let i = 1; i < 4; i++) {
        const a = Math.PI * (1.15 + i * 0.175);
        ctx.moveTo(14 * u, -27 * u);
        ctx.lineTo(14 * u + Math.cos(a) * 7.5 * u, -27 * u + Math.sin(a) * 7.5 * u);
      }
      ctx.stroke();
      break;
    case 'flowercrown': {
      const cols = ['#ff7aa2', '#ffffff', '#ffd23f', '#b28dff', '#ff9f43'];
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * (1.2 + i * 0.15);
        flower(Math.cos(a) * 27 * u, -15 * u + Math.sin(a) * 27 * u, 2.6 * u, cols[i]);
      }
      break;
    }
    case 'horn':
      ctx.beginPath();
      ctx.moveTo(-4.5 * u, -38 * u);
      ctx.lineTo(0, -61 * u);
      ctx.lineTo(4.5 * u, -38 * u);
      ctx.closePath();
      ctx.fillStyle = '#ffd166';
      ctx.fill();
      ctx.strokeStyle = '#d49b00';
      ctx.stroke();
      ctx.beginPath();
      for (const y of [-43, -49, -55]) {
        const w = (y + 61) * 0.2;
        ctx.moveTo(-w * u, y * u);
        ctx.lineTo(w * u, (y - 3) * u);
      }
      ctx.stroke();
      flower(-9 * u, -38 * u, 2.4 * u, '#ff9ecf');
      flower(9 * u, -38 * u, 2.4 * u, '#b8e0ff');
      break;
    case 'tiara':
      ctx.beginPath();
      ctx.moveTo(-12 * u, -35 * u);
      ctx.lineTo(-9 * u, -43 * u);
      ctx.lineTo(-4.5 * u, -38 * u);
      ctx.lineTo(0, -48 * u);
      ctx.lineTo(4.5 * u, -38 * u);
      ctx.lineTo(9 * u, -43 * u);
      ctx.lineTo(12 * u, -35 * u);
      ctx.quadraticCurveTo(0, -38 * u, -12 * u, -35 * u);
      ctx.closePath();
      ctx.fillStyle = '#ffd60a';
      ctx.fill();
      ctx.strokeStyle = '#d49b00';
      ctx.stroke();
      circle(ctx, 0, -40 * u, 2.3 * u);
      ctx.fillStyle = '#ff4f8b';
      ctx.fill();
      break;
    case 'crown':
      ctx.beginPath();
      ctx.moveTo(-15 * u, -35 * u);
      ctx.lineTo(-17 * u, -54 * u);
      ctx.lineTo(-8 * u, -44 * u);
      ctx.lineTo(0, -58 * u);
      ctx.lineTo(8 * u, -44 * u);
      ctx.lineTo(17 * u, -54 * u);
      ctx.lineTo(15 * u, -35 * u);
      ctx.quadraticCurveTo(0, -39 * u, -15 * u, -35 * u);
      ctx.closePath();
      ctx.fillStyle = '#ffd60a';
      ctx.fill();
      ctx.strokeStyle = '#c98a00';
      ctx.stroke();
      for (const [jx, jy, col] of [[-17, -54, '#4cc9f0'], [0, -58, '#ff4f5e'], [17, -54, '#80ed99']]) {
        circle(ctx, jx * u, jy * u, 2.8 * u);
        ctx.fillStyle = col;
        ctx.fill();
      }
      break;
    default:
      break;
  }
  ctx.restore();
}

// Mekon runko kuoseineen, tutuhame, merenneidon pyrstö ja helman koriste
function drawDressBody(ctx, u, of, t, swing, back) {
  dressPath(ctx, u, of.shape);
  ctx.fillStyle = of.dress;
  ctx.fill();
  ctx.save();
  dressPath(ctx, u, of.shape);
  ctx.clip();
  drawPattern(ctx, u, of, t);
  ctx.restore();
  dressPath(ctx, u, of.shape);
  ctx.lineWidth = 2.2 * u;
  ctx.strokeStyle = LEIA.line;
  ctx.stroke();
  if (of.shape === 'tutu') {
    tutuPath(ctx, u);
    ctx.fillStyle = of.light;
    ctx.fill();
    ctx.save();
    tutuPath(ctx, u);
    ctx.clip();
    if (of.pattern && of.pattern.type === 'sparkles') drawPattern(ctx, u, of, t);
    ctx.beginPath();
    for (let x = -24; x <= 24; x += 8) {
      ctx.moveTo(x * u, 25 * u);
      ctx.lineTo(x * 1.25 * u, 35 * u);
    }
    ctx.strokeStyle = rgba('#ffffff', 0.6);
    ctx.lineWidth = 1.4 * u;
    ctx.stroke();
    ctx.restore();
    tutuPath(ctx, u);
    ctx.lineWidth = 2 * u;
    ctx.strokeStyle = of.dress;
    ctx.stroke();
  } else if (of.shape === 'mermaid') {
    finPath(ctx, u, swing * 2);
    ctx.fillStyle = of.light;
    ctx.fill();
    ctx.lineWidth = 2 * u;
    ctx.strokeStyle = darken(of.dress, 0.25);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-13 * u, 30 * u);
    ctx.quadraticCurveTo(0, 33 * u, 13 * u, 30 * u);
    ctx.strokeStyle = of.light;
    ctx.lineWidth = 2.6 * u;
    ctx.stroke();
  } else if (!of.pattern || !['rainbow', 'pastelhem'].includes(of.pattern.type)) {
    ctx.beginPath();
    if (of.shape === 'gown') {
      ctx.moveTo(-23 * u, 40 * u);
      ctx.quadraticCurveTo(0, 45 * u, 23 * u, 40 * u);
    } else {
      ctx.moveTo(-18 * u, 32 * u);
      ctx.quadraticCurveTo(0, 37 * u, 18 * u, 32 * u);
    }
    ctx.strokeStyle = of.light;
    ctx.lineWidth = 3 * u;
    ctx.stroke();
  }
  if (!back && of.collar) {
    ctx.beginPath();
    ctx.moveTo(-8 * u, 10 * u);
    ctx.quadraticCurveTo(-4 * u, 16 * u, 0, 11 * u);
    ctx.quadraticCurveTo(4 * u, 16 * u, 8 * u, 10 * u);
    ctx.closePath();
    ctx.fillStyle = of.collar;
    ctx.fill();
  }
}

// Pieni mekkokuvake (henkarissa) valikoihin
export function drawDressIcon(ctx, x, y, size, outfit = {}, t = 0) {
  const of = { ...DEFAULT_OUTFIT, ...outfit };
  const u = size / 58;
  ctx.save();
  ctx.translate(x, y - 26 * u);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 2 * u, 3.2 * u, Math.PI * 1.05, Math.PI * 0.2);
  ctx.moveTo(0, 5 * u);
  ctx.lineTo(-15 * u, 11 * u);
  ctx.lineTo(15 * u, 11 * u);
  ctx.closePath();
  ctx.strokeStyle = '#8d7a5c';
  ctx.lineWidth = 2.2 * u;
  ctx.stroke();
  if (of.cape) drawCape(ctx, u, of.cape, t, false, false);
  if (of.wings) drawWings(ctx, u, of.wings, t, false);
  drawDressBody(ctx, u, of, t, 0, false);
  for (const s of [-1, 1]) {
    circle(ctx, s * 11 * u, 13 * u, 5 * u);
    ctx.fillStyle = of.dress;
    ctx.fill();
    ctx.lineWidth = 1.8 * u;
    ctx.strokeStyle = LEIA.line;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Leia: vaaleatukkainen tyttö, jolla on saparot ja pinkki mekko.
 * o: { t, facing: 'down'|'up'|'left'|'right', walking, walkT, happy, jump, noShadow }
 */
export function drawLeia(ctx, x, y, size, o = {}) {
  const u = size / 100;
  const t = o.t || 0;
  const facing = o.facing || 'down';
  const walking = !!o.walking;
  const happy = !!o.happy;
  const back = facing === 'up';
  const fx = facing === 'left' ? -1 : facing === 'right' ? 1 : 0;
  const ph = (o.walkT != null ? o.walkT : t) * 13;
  const swing = walking ? Math.sin(ph) : 0;
  const bob = walking ? -Math.abs(Math.sin(ph)) * 3.5 * u : Math.sin(t * 2.2) * 0.8 * u;
  const lift = o.jump || 0;
  const of = { ...DEFAULT_OUTFIT, ...(o.outfit || {}) };

  ctx.save();
  ctx.translate(x, y);
  if (!o.noShadow) {
    const sh = Math.max(0.5, 1 - lift / (size * 0.6));
    ctx.fillStyle = 'rgba(0,0,0,0.17)';
    ellipse(ctx, 0, 45 * u, 24 * u * sh, 6 * u * sh);
    ctx.fill();
  }
  ctx.translate(0, bob - lift);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // viitta ja siivet selän takana (takaa päin katsottuna ne piirretään myöhemmin päälle)
  if (of.tail) drawTail(ctx, u, of.tail, t, walking);
  if (!back && of.cape) drawCape(ctx, u, of.cape, t, walking, false);
  if (!back && of.wings) drawWings(ctx, u, of.wings, t, walking);

  // jalat (tutu) ja kengät
  if (of.shape === 'tutu') {
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sx * 6 * u, 31 * u);
      ctx.lineTo(sx * 8 * u, (40 - Math.max(0, sx * swing) * 3) * u);
      ctx.strokeStyle = LEIA.line;
      ctx.lineWidth = 6.5 * u;
      ctx.stroke();
      ctx.strokeStyle = LEIA.skin;
      ctx.lineWidth = 4 * u;
      ctx.stroke();
    }
  }
  if (of.shape !== 'mermaid' && of.shoes) {
    ctx.fillStyle = of.shoes;
    ctx.strokeStyle = LEIA.line;
    ctx.lineWidth = 1.8 * u;
    ellipse(ctx, -9 * u, (42 - Math.max(0, swing) * 3) * u, 7 * u, 4.5 * u);
    ctx.fill(); ctx.stroke();
    ellipse(ctx, 9 * u, (42 - Math.max(0, -swing) * 3) * u, 7 * u, 4.5 * u);
    ctx.fill(); ctx.stroke();
  }

  if (!back) drawPigtails(ctx, u, fx, swing, t);

  // mekko
  drawDressBody(ctx, u, of, t, swing, back);
  if (back && of.wings) drawWings(ctx, u, of.wings, t, walking);

  // kädet
  for (const s of [-1, 1]) {
    let hx, hy;
    if (happy) {
      hx = s * 31 * u;
      hy = (1 + Math.sin(t * 10 + s) * 3) * u;
    } else {
      hx = s * 19 * u;
      hy = (25 + (walking ? s * swing * 4 : 0)) * u;
    }
    drawArm(ctx, u, s * 11 * u, 14 * u, hx, hy, of.dress);
    circle(ctx, hx, hy, 4.6 * u);
    ctx.fillStyle = LEIA.skin;
    ctx.fill();
    ctx.lineWidth = 1.8 * u;
    ctx.strokeStyle = LEIA.line;
    ctx.stroke();
  }

  if (back && of.cape) drawCape(ctx, u, of.cape, t, walking, true);

  // pää
  const hy = -13 * u, hr = 24 * u;
  ctx.lineWidth = 2.2 * u;
  ctx.strokeStyle = LEIA.hairShade;
  ctx.fillStyle = LEIA.hair;
  circle(ctx, 0, hy - 2 * u, hr + 4 * u);
  ctx.fill(); ctx.stroke();
  if (!back) {
    for (const s of [-1, 1]) {
      ellipse(ctx, s * 21 * u - fx * 2 * u, -2 * u, 8 * u, 13 * u);
      ctx.fill(); ctx.stroke();
    }
    circle(ctx, fx * 2 * u, hy + 1 * u, hr);
    ctx.fillStyle = LEIA.skin;
    ctx.fill();
    ctx.strokeStyle = LEIA.line;
    ctx.stroke();

    // otsatukka
    const bx = fx * 3 * u;
    ctx.beginPath();
    ctx.moveTo(bx - 26 * u, hy + 4 * u);
    ctx.bezierCurveTo(bx - 30 * u, hy - 34 * u, bx + 30 * u, hy - 34 * u, bx + 26 * u, hy + 4 * u);
    ctx.quadraticCurveTo(bx + 21 * u, hy - 10 * u, bx + 13 * u, hy - 6 * u);
    ctx.quadraticCurveTo(bx + 7 * u, hy - 15 * u, bx - 1 * u, hy - 7 * u);
    ctx.quadraticCurveTo(bx - 8 * u, hy - 16 * u, bx - 15 * u, hy - 6 * u);
    ctx.quadraticCurveTo(bx - 22 * u, hy - 11 * u, bx - 26 * u, hy + 4 * u);
    ctx.closePath();
    ctx.fillStyle = LEIA.hair;
    ctx.fill();
    ctx.strokeStyle = LEIA.hairShade;
    ctx.lineWidth = 2 * u;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(bx - 4 * u, hy - 12 * u, 13 * u, Math.PI * 1.15, Math.PI * 1.55);
    ctx.strokeStyle = LEIA.hairHi;
    ctx.lineWidth = 3 * u;
    ctx.stroke();

    // kasvot
    const ex = fx * 4.5 * u;
    const blink = !happy && t % 3.3 < 0.13;
    for (const s of [-1, 1]) {
      const cx = ex + s * 9 * u, cy = -5 * u;
      if (blink) {
        ctx.beginPath();
        ctx.moveTo(cx - 4 * u, cy);
        ctx.lineTo(cx + 4 * u, cy);
        ctx.strokeStyle = LEIA.eye;
        ctx.lineWidth = 2.2 * u;
        ctx.stroke();
      } else if (happy) {
        ctx.beginPath();
        ctx.arc(cx, cy + 2 * u, 4.5 * u, Math.PI * 1.1, Math.PI * 1.9);
        ctx.strokeStyle = LEIA.eye;
        ctx.lineWidth = 2.6 * u;
        ctx.stroke();
      } else {
        ellipse(ctx, cx, cy, 4 * u, 5.3 * u);
        ctx.fillStyle = LEIA.eye;
        ctx.fill();
        circle(ctx, cx - 1.3 * u, cy - 2 * u, 1.7 * u);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
      circle(ctx, ex + s * 15.5 * u, 3 * u, 4.3 * u);
      ctx.fillStyle = LEIA.blush;
      ctx.fill();
    }
    if (happy) {
      ctx.beginPath();
      ctx.arc(ex, 3 * u, 5.5 * u, 0, Math.PI);
      ctx.closePath();
      ctx.fillStyle = '#d94b63';
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(ex, 2 * u, 4.2 * u, Math.PI * 0.18, Math.PI * 0.82);
      ctx.strokeStyle = LEIA.mouth;
      ctx.lineWidth = 2.1 * u;
      ctx.stroke();
    }
  } else {
    // takaa päin: pelkkää tukkaa ja saparot
    circle(ctx, 0, hy, hr + 2 * u);
    ctx.fillStyle = LEIA.hair;
    ctx.fill();
    ctx.strokeStyle = LEIA.hairShade;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, hy - hr);
    ctx.quadraticCurveTo(2 * u, hy, 0, hy + hr * 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-6 * u, hy - 6 * u, 14 * u, Math.PI * 1.1, Math.PI * 1.5);
    ctx.strokeStyle = LEIA.hairHi;
    ctx.lineWidth = 3 * u;
    ctx.stroke();
    drawPigtails(ctx, u, 0, swing, t);
  }
  drawHeadExtra(ctx, u, of, t);
  ctx.restore();
}

// ---------------------------------------------------------------- Haamu
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function drawCostume(ctx, u, costume, t) {
  switch (costume) {
    case 'flowers': {
      const cols = ['#ff7aa2', '#ffd23f', '#ffffff', '#b28dff', '#ff9f43'];
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * (1.18 + i * 0.16);
        const x = Math.cos(a) * 31 * u, y = -8 * u + Math.sin(a) * 31 * u;
        ctx.fillStyle = cols[i];
        for (let p = 0; p < 5; p++) {
          const pa = (p / 5) * Math.PI * 2 + t * 0.5;
          circle(ctx, x + Math.cos(pa) * 3.6 * u, y + Math.sin(pa) * 3.6 * u, 3 * u);
          ctx.fill();
        }
        circle(ctx, x, y, 2.4 * u);
        ctx.fillStyle = '#ffb703';
        ctx.fill();
      }
      break;
    }
    case 'pirate': {
      ctx.beginPath();
      ctx.moveTo(-34 * u, -30 * u);
      ctx.quadraticCurveTo(0, -78 * u, 34 * u, -30 * u);
      ctx.quadraticCurveTo(0, -42 * u, -34 * u, -30 * u);
      ctx.closePath();
      ctx.fillStyle = '#2b2d42';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-30 * u, -33 * u);
      ctx.quadraticCurveTo(0, -44 * u, 30 * u, -33 * u);
      ctx.strokeStyle = '#ffd23f';
      ctx.lineWidth = 3 * u;
      ctx.stroke();
      starPath(ctx, 0, -52 * u, 7 * u, 3 * u);
      ctx.fillStyle = '#ffd23f';
      ctx.fill();
      break;
    }
    case 'cupcake': {
      ellipse(ctx, 0, -40 * u, 22 * u, 10 * u);
      ctx.fillStyle = '#ff8cc6';
      ctx.fill();
      ellipse(ctx, 0, -48 * u, 14 * u, 8 * u);
      ctx.fill();
      ctx.strokeStyle = '#e0609f';
      ctx.lineWidth = 1.6 * u;
      ctx.stroke();
      const sp = ['#ffd23f', '#4cc9f0', '#80ed99', '#ffffff'];
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        const x = -16 * u + i * 6.5 * u, y = -41 * u + (i % 2) * 3 * u;
        ctx.moveTo(x, y);
        ctx.lineTo(x + 2.5 * u, y - 1.5 * u);
        ctx.strokeStyle = sp[i % sp.length];
        ctx.lineWidth = 2 * u;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, -59 * u);
      ctx.quadraticCurveTo(4 * u, -66 * u, 8 * u, -68 * u);
      ctx.strokeStyle = '#2d6a4f';
      ctx.lineWidth = 1.8 * u;
      ctx.stroke();
      circle(ctx, 0, -58 * u, 5.5 * u);
      ctx.fillStyle = '#e63946';
      ctx.fill();
      circle(ctx, -1.8 * u, -60 * u, 1.6 * u);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fill();
      break;
    }
    case 'beanie': {
      // kaulahuivi
      roundRectPath(ctx, -33 * u, 11 * u, 66 * u, 10 * u, 5 * u);
      ctx.fillStyle = '#4dabf7';
      ctx.fill();
      roundRectPath(ctx, 12 * u, 15 * u, 10 * u, 22 * u, 4 * u);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 4; i++) ctx.fillRect((-26 + i * 15) * u, 11 * u, 4 * u, 10 * u);
      ctx.fillRect(12 * u, 28 * u, 10 * u, 3.5 * u);
      // pipo
      ctx.beginPath();
      ctx.arc(0, -28 * u, 27 * u, Math.PI, 0);
      ctx.closePath();
      ctx.fillStyle = '#e63946';
      ctx.fill();
      roundRectPath(ctx, -30 * u, -33 * u, 60 * u, 10 * u, 5 * u);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      circle(ctx, 0, -58 * u, 7.5 * u);
      ctx.fill();
      ctx.strokeStyle = '#dfe6f5';
      ctx.lineWidth = 1.5 * u;
      ctx.stroke();
      break;
    }
    case 'astronaut': {
      ctx.beginPath();
      ctx.moveTo(0, -54 * u);
      ctx.lineTo(0, -66 * u);
      ctx.strokeStyle = '#cfd8ff';
      ctx.lineWidth = 2.5 * u;
      ctx.stroke();
      circle(ctx, 0, -68 * u, 4.5 * u);
      ctx.fillStyle = (t % 1) < 0.5 ? '#ff5e5e' : '#ff9e9e';
      ctx.fill();
      circle(ctx, 0, -6 * u, 47 * u);
      ctx.fillStyle = 'rgba(190,225,255,0.22)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(220,238,255,0.95)';
      ctx.lineWidth = 3.2 * u;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -6 * u, 40 * u, Math.PI * 1.15, Math.PI * 1.45);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 4 * u;
      ctx.stroke();
      break;
    }
    case 'crown': {
      ctx.beginPath();
      ctx.moveTo(-19 * u, -36 * u);
      ctx.lineTo(-21 * u, -58 * u);
      ctx.lineTo(-10 * u, -46 * u);
      ctx.lineTo(0, -63 * u);
      ctx.lineTo(10 * u, -46 * u);
      ctx.lineTo(21 * u, -58 * u);
      ctx.lineTo(19 * u, -36 * u);
      ctx.closePath();
      ctx.fillStyle = '#ffd23f';
      ctx.fill();
      ctx.strokeStyle = '#d49b00';
      ctx.lineWidth = 2 * u;
      ctx.lineJoin = 'round';
      ctx.stroke();
      const jewels = [[-21, -58, '#4cc9f0'], [0, -63, '#ff4f5e'], [21, -58, '#80ed99']];
      for (const [jx, jy, c] of jewels) {
        circle(ctx, jx * u, jy * u, 3.6 * u);
        ctx.fillStyle = c;
        ctx.fill();
      }
      circle(ctx, 0, -42 * u, 3.6 * u);
      ctx.fillStyle = '#ff4f5e';
      ctx.fill();
      break;
    }
    default:
      break;
  }
}

/**
 * Kiltti haamu. o: { t, mood: 'idle'|'wave'|'happy'|'boo'|'party', lookX, lookY, costume }
 */
export function drawGhost(ctx, x, y, size, o = {}) {
  const u = size / 100;
  const t = o.t || 0;
  const mood = o.mood || 'idle';
  const lx = clamp(o.lookX || 0, -1, 1), ly = clamp(o.lookY || 0, -1, 1);
  ctx.save();
  ctx.translate(x, y);
  const tilt = mood === 'party' ? Math.sin(t * 8) * 0.2 : mood === 'happy' ? Math.sin(t * 6) * 0.1 : Math.sin(t * 1.6) * 0.04;
  ctx.rotate(tilt);

  // kädet
  const body = '#ffffff', edge = '#aab6e8';
  const armUp = mood === 'happy' || mood === 'party' || mood === 'boo';
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(s * 31 * u, 4 * u);
    let r = s * 0.5;
    if (armUp) r = s * (-0.9 + Math.sin(t * 10 + s) * 0.35);
    else if (mood === 'wave' && s === 1) r = -1.1 + Math.sin(t * 12) * 0.45;
    ctx.rotate(r);
    ellipse(ctx, s * 8 * u, 0, 9 * u, 6 * u);
    ctx.fillStyle = body;
    ctx.fill();
    ctx.lineWidth = 2.4 * u;
    ctx.strokeStyle = edge;
    ctx.stroke();
    ctx.restore();
  }

  // vartalo
  ctx.beginPath();
  ctx.moveTo(-34 * u, 22 * u);
  ctx.lineTo(-34 * u, -8 * u);
  ctx.arc(0, -8 * u, 34 * u, Math.PI, 0);
  ctx.lineTo(34 * u, 22 * u);
  const n = 4, wpx = (68 * u) / n;
  for (let i = 0; i < n; i++) {
    const x0 = 34 * u - i * wpx, x1 = x0 - wpx;
    const wob = Math.sin(t * 5 + i * 1.4) * 3 * u;
    ctx.quadraticCurveTo((x0 + x1) / 2, 38 * u + wob, x1, 22 * u);
  }
  ctx.closePath();
  const grd = ctx.createLinearGradient(0, -42 * u, 0, 36 * u);
  grd.addColorStop(0, body);
  grd.addColorStop(1, '#e4e9ff');
  ctx.fillStyle = grd;
  ctx.fill();
  ctx.lineWidth = 2.6 * u;
  ctx.strokeStyle = edge;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // kasvot
  const ex = lx * 3.5 * u, ey = ly * 2.5 * u;
  for (const s of [-1, 1]) {
    const cx = ex + s * 12 * u, cy = -10 * u + ey;
    if (mood === 'happy' || mood === 'party') {
      ctx.beginPath();
      ctx.arc(cx, cy + 3 * u, 6 * u, Math.PI * 1.1, Math.PI * 1.9);
      ctx.strokeStyle = '#2b2d42';
      ctx.lineWidth = 3.2 * u;
      ctx.lineCap = 'round';
      ctx.stroke();
    } else {
      const blink = t % 4.1 < 0.12;
      ellipse(ctx, cx, cy, 6.5 * u, blink ? 1.2 * u : 8.5 * u);
      ctx.fillStyle = '#2b2d42';
      ctx.fill();
      if (!blink) {
        circle(ctx, cx - 2 * u + lx * 1.5 * u, cy - 3 * u + ly * 1.5 * u, 2.5 * u);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        circle(ctx, cx + 2 * u, cy + 3 * u, 1.1 * u);
        ctx.fill();
      }
    }
    circle(ctx, ex + s * 22 * u, 2 * u + ey, 5.2 * u);
    ctx.fillStyle = 'rgba(255,150,180,0.6)';
    ctx.fill();
  }
  const mx = ex, my = 5 * u + ey;
  if (mood === 'boo') {
    ellipse(ctx, mx, my + 3 * u, 7 * u, 9 * u);
    ctx.fillStyle = '#2b2d42';
    ctx.fill();
    ellipse(ctx, mx, my + 8 * u, 4.5 * u, 3 * u);
    ctx.fillStyle = '#ff8fab';
    ctx.fill();
  } else if (mood === 'happy' || mood === 'party') {
    ctx.beginPath();
    ctx.arc(mx, my - 1 * u, 7 * u, 0, Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#2b2d42';
    ctx.fill();
    ellipse(ctx, mx, my + 3.5 * u, 3.5 * u, 2 * u);
    ctx.fillStyle = '#ff8fab';
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(mx, my - 2 * u, 5 * u, Math.PI * 0.2, Math.PI * 0.8);
    ctx.strokeStyle = '#2b2d42';
    ctx.lineWidth = 2.4 * u;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  drawCostume(ctx, u, o.costume, t);
  ctx.restore();
}

// ---------------------------------------------------------------- Esineet
export function drawKey(ctx, x, y, size, color, rot = -0.6) {
  const u = size / 100;
  const dark = darken(color, 0.35), light = lighten(color, 0.6);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.translate(-2 * u, 0);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-6 * u, -6 * u);
  ctx.lineTo(44 * u, -6 * u);
  ctx.lineTo(44 * u, 6 * u);
  ctx.lineTo(38 * u, 6 * u);
  ctx.lineTo(38 * u, 18 * u);
  ctx.lineTo(30 * u, 18 * u);
  ctx.lineTo(30 * u, 6 * u);
  ctx.lineTo(24 * u, 6 * u);
  ctx.lineTo(24 * u, 14 * u);
  ctx.lineTo(17 * u, 14 * u);
  ctx.lineTo(17 * u, 6 * u);
  ctx.lineTo(-6 * u, 6 * u);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 3 * u;
  ctx.strokeStyle = dark;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-22 * u, 0, 19 * u, 0, Math.PI * 2);
  ctx.arc(-22 * u, 0, 8 * u, 0, Math.PI * 2, true);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-22 * u, 0, 13.5 * u, Math.PI * 1.1, Math.PI * 1.6);
  ctx.strokeStyle = light;
  ctx.lineWidth = 3.5 * u;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2 * u, -2 * u);
  ctx.lineTo(38 * u, -2 * u);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2.5 * u;
  ctx.stroke();
  ctx.restore();
}

export function drawCoin(ctx, x, y, size, spin = 1) {
  const r = size / 2;
  const sx = Math.max(0.14, Math.abs(spin));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, 1);
  circle(ctx, 0, 0, r);
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
  g.addColorStop(0, '#fff6b0');
  g.addColorStop(0.5, '#ffd23f');
  g.addColorStop(1, '#f0a500');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = r * 0.15;
  ctx.strokeStyle = '#c98a00';
  ctx.stroke();
  circle(ctx, 0, 0, r * 0.66);
  ctx.lineWidth = r * 0.09;
  ctx.strokeStyle = 'rgba(201,138,0,0.55)';
  ctx.stroke();
  if (sx > 0.35) {
    starPath(ctx, 0, 0, r * 0.4, r * 0.18);
    ctx.fillStyle = '#f2a900';
    ctx.fill();
  }
  ctx.restore();
}

export function drawDiamond(ctx, x, y, size, color, t = 0) {
  const w = size, h = size * 0.86;
  const top = -h * 0.42, gird = -h * 0.1, bot = h * 0.5;
  const xo = w * 0.5, xi = w * 0.29, xm = w * 0.17;
  const L1 = lighten(color, 0.62), L2 = lighten(color, 0.32), D1 = darken(color, 0.15), D2 = darken(color, 0.35);
  const poly = (pts, fill) => {
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  ctx.save();
  ctx.translate(x, y);
  const TL = [-xi, top], TR = [xi, top], TM = [0, top], GL = [-xo, gird], GR = [xo, gird];
  const ML = [-xm, gird], MR = [xm, gird], B = [0, bot];
  poly([GL, TL, ML], L2);
  poly([TL, TM, ML], L1);
  poly([TM, MR, ML], lighten(color, 0.45));
  poly([TM, TR, MR], L1);
  poly([TR, GR, MR], L2);
  poly([GL, ML, B], D1);
  poly([ML, MR, B], color);
  poly([MR, GR, B], D2);
  ctx.beginPath();
  [TL, TR, GR, B, GL].forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1, w * 0.035);
  ctx.strokeStyle = D2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(GL[0], GL[1]); ctx.lineTo(GR[0], GR[1]);
  ctx.moveTo(ML[0], ML[1]); ctx.lineTo(TM[0], TM[1]); ctx.lineTo(MR[0], MR[1]);
  ctx.moveTo(ML[0], ML[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(MR[0], MR[1]);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = Math.max(0.6, w * 0.014);
  ctx.stroke();
  const tw = 0.55 + 0.45 * Math.sin(t * 3.1);
  drawSparkle(ctx, -xi * 0.55, top + h * 0.12, w * 0.15 * tw, 'rgba(255,255,255,0.95)');
  drawSparkle(ctx, xo * 0.55, gird + h * 0.18, w * 0.09 * (1 - tw * 0.6), 'rgba(255,255,255,0.8)');
  ctx.restore();
}
