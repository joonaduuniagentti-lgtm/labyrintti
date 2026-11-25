// Vaikeuskäyrä: joka kentässä muuttuu vain yksi tai kaksi asiaa kerrallaan.
// short/long = labyrintin lyhyt ja pitkä sivu ruutuina (pariton luku, jotta huone osuu keskelle).
// braid = kuinka suuri osa umpikujista avataan silmukoiksi (isompi = helpompi).
// scroll = labyrintti saa olla ruutua isompi; silloin kamera seuraa Leiaa.
const STEPS = [
  { short: 5, long: 7, keys: 1, braid: 0.75, coins: 5 },   // 1
  { short: 5, long: 7, keys: 2, braid: 0.65, coins: 6 },   // 2
  { short: 5, long: 9, keys: 2, braid: 0.6, coins: 6 },    // 3
  { short: 7, long: 9, keys: 2, braid: 0.55, coins: 7 },   // 4
  { short: 7, long: 9, keys: 3, braid: 0.5, coins: 7 },    // 5
  { short: 7, long: 11, keys: 3, braid: 0.45, coins: 8 },  // 6
  { short: 7, long: 11, keys: 3, braid: 0.4, coins: 8 },   // 7
  { short: 9, long: 11, keys: 3, braid: 0.4, coins: 9 },   // 8
  { short: 9, long: 13, keys: 3, braid: 0.35, coins: 9 },  // 9
  { short: 9, long: 13, keys: 4, braid: 0.35, coins: 10 }, // 10
  { short: 9, long: 15, keys: 4, braid: 0.3, coins: 10 },  // 11
  { short: 11, long: 15, keys: 4, braid: 0.3, coins: 12 }, // 12
  // Kentästä 13 alkaen labyrintti kasvaa ruutua isommaksi
  { short: 11, long: 17, keys: 4, braid: 0.28, coins: 12, scroll: true }, // 13
  { short: 11, long: 19, keys: 4, braid: 0.27, coins: 13, scroll: true }, // 14
  { short: 13, long: 19, keys: 5, braid: 0.26, coins: 14, scroll: true }, // 15
  { short: 13, long: 21, keys: 5, braid: 0.25, coins: 14, scroll: true }, // 16
  { short: 13, long: 23, keys: 5, braid: 0.24, coins: 15, scroll: true }, // 17
  { short: 15, long: 23, keys: 5, braid: 0.23, coins: 16, scroll: true }, // 18
  { short: 15, long: 25, keys: 5, braid: 0.22, coins: 16, scroll: true }, // 19
  { short: 17, long: 27, keys: 5, braid: 0.2, coins: 18, scroll: true },  // 20+
];

// Pienin sallittu ruutu (CSS-pikseleinä), kun koko labyrintti näytetään kerralla.
export const MIN_CELL = 38;
// Isoissa kentissä: jos labyrintti mahtuu tällä ruutukoolla, näytetään se kokonaan (tabletti).
export const MIN_CELL_FIT_BIG = 34;

export function levelParams(n) {
  return { ...STEPS[Math.min(Math.max(1, n), STEPS.length) - 1] };
}

// Sovittaa labyrintin näytölle: pystyasennossa lyhyt sivu on leveys.
// Jos ruudut jäisivät liian pieniksi, labyrinttia pienennetään (paitsi isoissa
// kentissä, joissa kamera seuraa Leiaa).
export function fitDims({ short, long, scroll }, portrait, availW, availH, minCell = MIN_CELL) {
  let s = short, l = long;
  const dims = () => (portrait ? { cols: s, rows: l } : { cols: l, rows: s });
  if (scroll) return dims();
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
