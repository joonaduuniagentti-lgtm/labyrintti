// Edistys tallennetaan laitteelle (localStorage).
const KEY = 'labyrintti-save-v1';

const DEFAULTS = () => ({
  level: 1,        // seuraavaksi pelattava kenttä
  maxLevel: 1,     // pisin saavutettu kenttä
  coins: 0,        // kerätyt kolikot yhteensä
  diamonds: [],    // [{ level, theme }]
  sound: true,
  music: true,
  cap: null,       // vaikein kenttä (null = ei rajaa); säilyy myös uudelleenkäynnistyksessä
  dress: 'pinkki', // Leian päällä oleva mekko
  owned: ['pinkki'], // ostetut mekot
});

export class Store {
  constructor() {
    this.data = DEFAULTS();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) Object.assign(this.data, JSON.parse(raw));
    } catch (e) { /* yksityinen selaus tms. */ }
    if (!Array.isArray(this.data.diamonds)) this.data.diamonds = [];
    if (!Array.isArray(this.data.owned)) this.data.owned = ['pinkki'];
    if (!this.data.owned.includes('pinkki')) this.data.owned.unshift('pinkki');
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch (e) { /* ei tallennustilaa */ }
  }

  resetProgress() {
    // Ostetut mekot jäävät Leialle, vaikka kentät, timantit ja kolikot nollataan
    const { sound, music, cap, dress, owned } = this.data;
    this.data = { ...DEFAULTS(), sound, music, cap, dress, owned };
    this.save();
  }
}
