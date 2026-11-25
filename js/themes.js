// Maailmat. Maailma vaihtuu kolmen kentän välein, ja kuuden jälkeen kierros alkaa alusta.
export const THEMES = [
  {
    id: 'niitty', name: 'Kukkaniitty',
    bg: ['#c8f5b0', '#86d46f'],
    floorA: '#f2fbe4', floorB: '#e6f6d2',
    wall: '#3f9b4b', wallShadow: '#2a6b33', wallHi: '#7fd27a', wallStyle: 'hedge',
    roomFloor: '#ffe9bd', roomFloor2: '#ffd58a', roomWall: '#c2703d', door: '#b5652f',
    diamond: '#3fb8ff', floorDeco: 'flowers', bgDeco: 'flowers', costume: 'flowers',
    music: { root: 72, tempo: 104, seed: 11 },
  },
  {
    id: 'meri', name: 'Merenpohja',
    bg: ['#9fe6fa', '#2f8fd1'],
    floorA: '#fff3d6', floorB: '#fbe8bd',
    wall: '#ff7b8e', wallShadow: '#c94b66', wallHi: '#ffb8c2', wallStyle: 'coral',
    roomFloor: '#c6ecff', roomFloor2: '#9edcff', roomWall: '#3f73d1', door: '#2c5bb0',
    diamond: '#19d3b5', floorDeco: 'shells', bgDeco: 'bubbles', costume: 'pirate',
    music: { root: 70, tempo: 96, seed: 23 },
  },
  {
    id: 'karkki', name: 'Karkkimaa',
    bg: ['#ffe0f0', '#ffaed6'],
    floorA: '#fff7fb', floorB: '#ffecf6',
    wall: '#ff5fa2', wallShadow: '#c73a7a', wallHi: '#ffa3cf', wallStyle: 'candy',
    roomFloor: '#fff1c4', roomFloor2: '#ffe08a', roomWall: '#9b5de5', door: '#7a3fc6',
    diamond: '#ff3fc8', floorDeco: 'sprinkles', bgDeco: 'candy', costume: 'cupcake',
    music: { root: 74, tempo: 112, seed: 37 },
  },
  {
    id: 'talvi', name: 'Lumimaa',
    bg: ['#eaf5ff', '#a9cff2'],
    floorA: '#ffffff', floorB: '#eef6ff',
    wall: '#6fb8ec', wallShadow: '#4a8fc4', wallHi: '#d6f0ff', wallStyle: 'ice',
    roomFloor: '#ffe2c2', roomFloor2: '#f5c99a', roomWall: '#8a5a3b', door: '#a0522d',
    diamond: '#8f7bff', floorDeco: 'snow', bgDeco: 'snow', costume: 'beanie',
    music: { root: 69, tempo: 92, seed: 41 },
  },
  {
    id: 'avaruus', name: 'Avaruus',
    bg: ['#262b6b', '#0c0f2e'],
    floorA: '#323883', floorB: '#2c3277',
    wall: '#a283ff', wallShadow: '#5c3fc2', wallHi: '#e0d4ff', wallStyle: 'space', wallGlow: '#b79cff',
    roomFloor: '#4a50ad', roomFloor2: '#5f66c9', roomWall: '#ffb547', door: '#ff9a1f',
    diamond: '#ffd60a', floorDeco: 'stars', bgDeco: 'stars', costume: 'astronaut', dark: true,
    music: { root: 67, tempo: 84, seed: 53 },
  },
  {
    id: 'linna', name: 'Kuulinna',
    bg: ['#d8c9ff', '#9b8be6'],
    floorA: '#f3efff', floorB: '#e9e2ff',
    wall: '#8d92b8', wallShadow: '#5f6489', wallHi: '#c9cce3', wallStyle: 'brick',
    roomFloor: '#ffd6ea', roomFloor2: '#ffb3d6', roomWall: '#e05a9b', door: '#b93b7a',
    diamond: '#ff4f5e', floorDeco: 'tiles', bgDeco: 'moons', costume: 'crown',
    music: { root: 71, tempo: 100, seed: 67 },
  },
];

export const themeIndexForLevel = (n) => Math.floor((Math.max(1, n) - 1) / 3) % THEMES.length;
export const themeForLevel = (n) => THEMES[themeIndexForLevel(n)];
export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];
