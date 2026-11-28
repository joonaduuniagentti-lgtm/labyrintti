// Leian mekot. Ensimmäinen on ilmainen ja aina omistettu, muut ostetaan kolikoilla.
// shape: 'aline' (tavallinen), 'tutu', 'gown' (pitkä juhlamekko), 'mermaid' (merenneito)
// pattern.type: dots, hstripes, diag, rainbow, hearts, stars, flowers, seeds, clouds,
//               snow, sparkles, scales, paws, planets, emblem, pastelhem
// head: antennae, leaves, bigbow, catears, spikes, starclip, snowclip, shellclip,
//       flowercrown, horn, tiara, crown
// wings: bee, fairy, butterfly · cape: viitan väri
export const DRESSES = [
  {
    id: 'pinkki', name: 'Pinkki mekko', price: 0,
    dress: '#ff6fae', light: '#ffc2dc', shoes: '#d81b60', collar: '#ffffff',
  },
  {
    id: 'pilvi', name: 'Pilvimekko', price: 150,
    dress: '#7cc8ff', light: '#d6efff', shoes: '#3a86ff', collar: '#ffffff',
    pattern: { type: 'clouds', color: '#ffffff' },
  },
  {
    id: 'leppakerttu', name: 'Leppäkerttu', price: 150,
    dress: '#e63946', light: '#ff8a94', shoes: '#2b2d42', collar: '#2b2d42',
    pattern: { type: 'dots', color: '#2b2d42', size: 1.25 }, head: 'antennae', headColor: '#2b2d42',
  },
  {
    id: 'mansikka', name: 'Mansikka', price: 160,
    dress: '#ff3b5c', light: '#ff9aab', shoes: '#3fae5a', collar: '#3fae5a',
    pattern: { type: 'seeds', color: '#ffe066' }, head: 'leaves',
  },
  {
    id: 'sydan', name: 'Sydänmekko', price: 170,
    dress: '#ffffff', light: '#ffd6e4', shoes: '#ff4d6d', collar: '#ffd6e4',
    pattern: { type: 'hearts', color: '#ff4d6d' }, head: 'bigbow', headColor: '#ff4d6d',
  },
  {
    id: 'kukka', name: 'Kukkamekko', price: 180,
    dress: '#7ed957', light: '#c9f2b0', shoes: '#ff7aa2', collar: '#ffffff',
    pattern: { type: 'flowers', colors: ['#ffffff', '#ffd23f', '#ff7aa2'] }, head: 'flowercrown',
  },
  {
    id: 'karkki', name: 'Karkkimekko', price: 190,
    dress: '#ff8cc6', light: '#ffffff', shoes: '#9b5de5', collar: '#ffffff',
    pattern: { type: 'diag', color: '#ffffff' }, head: 'bigbow', headColor: '#9b5de5',
  },
  {
    id: 'sateenkaari', name: 'Sateenkaari', price: 200,
    dress: '#ff595e', light: '#ffffff', shoes: '#6a4c93', collar: '#ffffff',
    pattern: { type: 'rainbow' },
  },
  {
    id: 'mehilainen', name: 'Mehiläinen', price: 210,
    dress: '#ffd23f', light: '#fff1a8', shoes: '#2b2d42', collar: '#2b2d42',
    pattern: { type: 'hstripes', color: '#2b2d42' }, wings: 'bee', head: 'antennae', headColor: '#2b2d42',
  },
  {
    id: 'kissa', name: 'Kissamekko', price: 220,
    dress: '#9aa0b5', light: '#d5d8e3', shoes: '#5f6489', collar: '#ffb3c6',
    pattern: { type: 'paws', color: '#ffffff' }, head: 'catears', headColor: '#9aa0b5',
  },
  {
    id: 'lumi', name: 'Lumihiutale', price: 230,
    dress: '#9fd8ff', light: '#e8f6ff', shoes: '#4a8fc4', collar: '#ffffff', shape: 'gown',
    pattern: { type: 'snow', color: '#ffffff' }, head: 'snowclip',
  },
  {
    id: 'tahti', name: 'Tähtiyö', price: 240,
    dress: '#2b2f77', light: '#5a60c0', shoes: '#ffd60a', collar: '#ffd60a',
    pattern: { type: 'stars', color: '#ffd60a' }, head: 'starclip',
  },
  {
    id: 'dino', name: 'Dinosaurus', price: 250,
    dress: '#3fae5a', light: '#a6e3a1', shoes: '#2a7a3c', collar: '#a6e3a1',
    pattern: { type: 'dots', color: '#2f8f47', size: 0.8 }, head: 'spikes', headColor: '#2a8a44', tail: '#3fae5a',
  },
  {
    id: 'ballerina', name: 'Ballerina', price: 260,
    dress: '#ff9cc9', light: '#ffe0ee', shoes: '#ff6fae', collar: null, shape: 'tutu',
    pattern: { type: 'sparkles', color: '#ffffff' }, head: 'bigbow', headColor: '#ffb3d6',
  },
  {
    id: 'perhonen', name: 'Perhonen', price: 280,
    dress: '#ff9f1c', light: '#ffd08a', shoes: '#e85d04', collar: '#ffffff',
    pattern: { type: 'dots', color: '#ffffff', size: 0.75 }, wings: 'butterfly', head: 'antennae', headColor: '#5a3a1a',
  },
  {
    id: 'avaruus', name: 'Avaruusmekko', price: 300,
    dress: '#4b3f8f', light: '#b8a6d9', shoes: '#2b2d42', collar: '#b8a6d9',
    pattern: { type: 'planets' }, head: 'starclip',
  },
  {
    id: 'merenneito', name: 'Merenneito', price: 320,
    dress: '#19b5a5', light: '#7fe3d6', shoes: null, collar: null, shape: 'mermaid',
    pattern: { type: 'scales', color: '#7fe3d6' }, head: 'shellclip',
  },
  {
    id: 'sankari', name: 'Supersankari', price: 340,
    dress: '#3a86ff', light: '#9cc3ff', shoes: '#e63946', collar: null,
    pattern: { type: 'emblem', color: '#ffd23f' }, cape: '#e63946',
  },
  {
    id: 'keiju', name: 'Keiju', price: 360,
    dress: '#c3a6ff', light: '#eadcff', shoes: '#9b5de5', collar: null, shape: 'tutu',
    pattern: { type: 'sparkles', color: '#ffffff' }, wings: 'fairy', head: 'flowercrown',
  },
  {
    id: 'yksisarvinen', name: 'Yksisarvinen', price: 400,
    dress: '#ffffff', light: '#ffd6f0', shoes: '#c3a6ff', collar: '#ffd6f0',
    pattern: { type: 'pastelhem' }, head: 'horn',
  },
  {
    id: 'prinsessa', name: 'Prinsessa', price: 450,
    dress: '#ff8fc8', light: '#ffd1e8', shoes: '#ff4f8b', collar: '#ffd60a', shape: 'gown',
    pattern: { type: 'sparkles', color: '#fff3b0' }, head: 'tiara',
  },
  {
    id: 'kulta', name: 'Kultainen juhlamekko', price: 500,
    dress: '#f4c430', light: '#fff1a8', shoes: '#d49b00', collar: '#ffffff', shape: 'gown',
    pattern: { type: 'sparkles', color: '#ffffff' }, head: 'crown',
  },
];

export const DEFAULT_DRESS = DRESSES[0].id;
export const dressById = (id) => DRESSES.find((d) => d.id === id) || DRESSES[0];
