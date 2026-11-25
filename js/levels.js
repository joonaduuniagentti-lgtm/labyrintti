// Vaikeuskäyrä: joka kentässä muuttuu vain yksi asia kerrallaan, ja kasvulla on katto.
// short/long = labyrintin lyhyt ja pitkä sivu ruutuina (pariton luku, jotta huone osuu keskelle).
// braid = kuinka suuri osa umpikujista avataan silmukoiksi (isompi = helpompi).
const STEPS = [
  { short: 5, long: 7, keys: 1, braid: 0.75, coins: 5 },  // 1
  { short: 5, long: 7, keys: 2, braid: 0.65, coins: 6 },  // 2
  { short: 5, long: 9, keys: 2, braid: 0.6, coins: 6 },   // 3
  { short: 7, long: 9, keys: 2, braid: 0.55, coins: 7 },  // 4
  { short: 7, long: 9, keys: 3, braid: 0.5, coins: 7 },   // 5
  { short: 7, long: 11, keys: 3, braid: 0.45, coins: 8 }, // 6
  { short: 7, long: 11, keys: 3, braid: 0.4, coins: 8 },  // 7
  { short: 9, long: 11, keys: 3, braid: 0.4, coins: 9 },  // 8
  { short: 9, long: 13, keys: 3, braid: 0.35, coins: 9 }, // 9
  { short: 9, long: 13, keys: 4, braid: 0.35, coins: 10 }, // 10
  { short: 9, long: 15, keys: 4, braid: 0.3, coins: 10 }, // 11
  { short: 11, long: 15, keys: 4, braid: 0.3, coins: 12 }, // 12+
];

// Pienin sallittu ruutu (CSS-pikseleinä), jotta kaikki näkyy selvästi puhelimellakin.
export const MIN_CELL = 38;

export function levelParams(n) {
  return { ...STEPS[Math.min(Math.max(1, n), STEPS.length) - 1] };
}

// Sovittaa labyrintin näytölle: pystyasennossa lyhyt sivu on leveys.
// Jos ruudut jäisivät liian pieniksi, labyrinttia pienennetään.
export function fitDims({ short, long }, portrait, availW, availH, minCell = MIN_CELL) {
  let s = short, l = long;
  const dims = () => (portrait ? { cols: s, rows: l } : { cols: l, rows: s });
  for (let guard = 0; guard < 20; guard++) {
    const { cols, rows } = dims();
    const cw = availW / cols, ch = availH / rows;
    if (Math.min(cw, ch) >= minCell) break;
    const widthLimited = cw < ch;
    const shrinkS = portrait ? widthLimited : !widthLimited;
    if (shrinkS && s > 5) s -= 2;
    else if (!shrinkS && l > 7) l -= 2;
    else if (s > 5) s -= 2;
    else if (l > 7) l -= 2;
    else break;
    if (s > l) l = s;
  }
  return dims();
}
