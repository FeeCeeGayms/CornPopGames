// Episode 1: THE PIDSER CAVE — an 8-map pack in the spirit of Arcane Dimensions: big, multi-level maps
// built with the level kit (js/kit.js) on a 32-unit grid plus free brushes, decals, props and lights.
// Episode 2: THE ROTTEN APPLE — eight storm-soaked New York street maps (js/maps/e2m*.js, built with js/nyc.js).
import M1 from './maps/m1.js';
import M2 from './maps/m2.js';
import M3 from './maps/m3.js';
import M4 from './maps/m4.js';
import M5 from './maps/m5.js';
import M6 from './maps/m6.js';
import M7 from './maps/m7.js';
import M8 from './maps/m8.js';
import E2M1 from './maps/e2m1.js';
import E2M2 from './maps/e2m2.js';
import E2M3 from './maps/e2m3.js';
import E2M4 from './maps/e2m4.js';
import E2M5 from './maps/e2m5.js';
import E2M6 from './maps/e2m6.js';
import E2M7 from './maps/e2m7.js';
import E2M8 from './maps/e2m8.js';

const E1 = [M1, M2, M3, M4, M5, M6, M7, M8];
const E2 = [E2M1, E2M2, E2M3, E2M4, E2M5, E2M6, E2M7, E2M8];

export const EPISODES = [
  { title: 'EPISODE 1: THE PIDSER CAVE', start: 0, count: E1.length, ending: 'CORNPOP CONQUERED THE PIDSER CAVE!\nBUT THE QOQS FLED TO NEW YORK...' },
  { title: 'EPISODE 2: THE ROTTEN APPLE', start: E1.length, count: E2.length, ending: 'THE STORM BREAKS OVER MANHATTAN.\nCORNPOP SAVED NEW YORK!' },
];
export const LEVELS = [...E1, ...E2];
// level index -> episode and map number inside it
export function episodeOf(i) { const ep = i >= E1.length ? 1 : 0; return { ep, mi: i - EPISODES[ep].start }; }
