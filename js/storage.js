// Edistys tallennetaan laitteelle (localStorage).
const KEY = 'labyrintti-save-v1';

const DEFAULTS = () => ({
  level: 1,        // seuraavaksi pelattava kenttä
  maxLevel: 1,     // pisin saavutettu kenttä
  coins: 0,        // kerätyt kolikot yhteensä
  diamonds: [],    // [{ level, theme }]
  sound: true,
  music: true,
});

export class Store {
  constructor() {
    this.data = DEFAULTS();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) Object.assign(this.data, JSON.parse(raw));
    } catch (e) { /* yksityinen selaus tms. */ }
    if (!Array.isArray(this.data.diamonds)) this.data.diamonds = [];
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch (e) { /* ei tallennustilaa */ }
  }

  resetProgress() {
    const { sound, music } = this.data;
    this.data = { ...DEFAULTS(), sound, music };
    this.save();
  }
}
