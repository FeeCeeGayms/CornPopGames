// Vehicle registry. To add a vehicle, write a builder that returns the same shape
// as buildHotdogKart (group, body, wheels, steering, exhausts, seat, ...) and
// add an entry here. Any character can drive any vehicle.
import { buildHotdogKart } from './hotdog.js';
import { buildCoupeKart } from './coupe.js';
import { buildSemlaKart } from './semla.js';
import { buildBeetleKart } from './beetle.js';
import { buildClownKart } from './clown.js';
import { buildQoqKart } from './qoq.js';
import { mergeStatic } from './parts.js';

export const VEHICLES = {
  hotdog: {
    name: 'Hotdog',
    tagline: 'Long, low and greasy fast.',
    icon: '🌭',
    build: buildHotdogKart,
    // added to the driver's stats (each clamped to 1..5)
    stats: { speed: 0, accel: 0, handling: 0, weight: 0 },
    color: (o) => o.sausageColor ?? 0xe2581c,
    rivalPaints: [
      { sausageColor: 0x52c23a, bunColor: 0xd9f25c },
      { sausageColor: 0x8a3fd1, bunColor: 0xf0c94a },
      { sausageColor: 0x2b7bd6, bunColor: 0xf5d36b },
      { sausageColor: 0xb3202a, bunColor: 0xf2a33a },
      { sausageColor: 0x3d3d3d, bunColor: 0xe8e050 },
    ],
  },
  coupe: {
    name: 'Cozy Coupe',
    tagline: 'Light, nippy, always smiling.',
    icon: '🚗',
    build: buildCoupeKart,
    stats: { speed: -1, accel: 1, handling: 1, weight: -1 },
    color: (o) => o.bodyColor ?? 0xd42a1c,
    rivalPaints: [
      { bodyColor: 0x2b7bd6, roofColor: 0xf2f2f2, plate: 'BLUE' },
      { bodyColor: 0x3aa83a, roofColor: 0xd9f25c, plate: 'GLOW' },
      { bodyColor: 0x8a3fd1, roofColor: 0xff9ad5, plate: 'MUTANT' },
      { bodyColor: 0x2d2d2d, roofColor: 0xff8a1c, plate: 'ASH' },
      { bodyColor: 0xf08a1c, roofColor: 0x2b7bd6, plate: 'RUST' },
    ],
  },
  semla: {
    name: 'Semla Kart',
    tagline: 'Soft, round and full of cream.',
    icon: '🧁',
    build: buildSemlaKart,
    stats: { speed: 0, accel: 1, handling: 0, weight: -1 },
    color: (o) => o.bunColor ?? 0xc07a35,
    rivalPaints: [
      { bunColor: 0x9fe08a, creamColor: 0xd9ffc4, plate: 'Glow' },
      { bunColor: 0xb89cff, creamColor: 0xf3d6ff, plate: 'Mutant' },
      { bunColor: 0x8a8a8a, creamColor: 0xd8d8d8, plate: 'Ash' },
      { bunColor: 0xff9a7a, creamColor: 0xffd8c8, plate: 'Rust' },
      { bunColor: 0x8ac4ff, creamColor: 0xd8ecff, plate: 'Frost' },
    ],
  },
  beetle: {
    name: 'Peepo Beetle',
    tagline: 'Round, retro and quick off the line.',
    icon: '🚙',
    build: buildBeetleKart,
    stats: { speed: 0, accel: 1, handling: 1, weight: -1 },
    color: (o) => o.bodyColor ?? 0xf5c518,
    rivalPaints: [
      { bodyColor: 0x7ed957, seatColor: 0x2a3a1c, plate: 'GLOW' },
      { bodyColor: 0x9b6bff, seatColor: 0x2a1c3a, plate: 'MUTANT' },
      { bodyColor: 0x5cb8ff, seatColor: 0x1c2a3a, plate: 'FROST' },
      { bodyColor: 0xe0402a, seatColor: 0x2a1414, plate: 'RUST' },
      { bodyColor: 0x8c8c8c, seatColor: 0x1c1c1c, plate: 'ASH' },
    ],
  },
  clown: {
    name: 'Clown Car',
    tagline: 'Long, loud and laughing all the way.',
    icon: '🎪',
    build: buildClownKart,
    stats: { speed: 1, accel: 0, handling: -1, weight: 0 },
    color: (o) => o.stripes?.[0] ?? 0xf57a1f,
    rivalPaints: [
      { stripes: [0x9fe08a, 0x4cb848, 0xd9f25c, 0x2e8a2a], hatColor: 0x8a3fd1, hairColor: 0x7ed957, plate: 'GLOW' },
      { stripes: [0x9b6bff, 0xff9ad5, 0x5a2ca0, 0xd96bff], hatColor: 0xf7c51e, hairColor: 0xb06bff, plate: 'MUTANT' },
      { stripes: [0x5cb8ff, 0xffffff, 0x1f7ad6, 0xa8dcff], hatColor: 0xe8262a, hairColor: 0x7ac8ff, plate: 'FROST' },
      { stripes: [0xe8262a, 0xffffff], hatColor: 0x1f7ad6, hairColor: 0xd8141c, plate: 'RUST' },
      { stripes: [0x3a3a3a, 0x8c8c8c, 0xd8d8d8], hatColor: 0xf57a1f, hairColor: 0x9a9a9a, faceColor: 0xd8d8d8, plate: 'ASH' },
    ],
  },
  qoq: {
    name: 'Qoq Mobile',
    tagline: 'Lightweight, rear-wheel drive and very proud of its comb.',
    icon: '🐔',
    build: buildQoqKart,
    stats: { speed: 1, accel: 0, handling: 1, weight: -1 },
    color: (o) => o.bodyColor ?? 0xdcd8cf,
    rivalPaints: [
      { bodyColor: 0xa8622c, combColor: 0xd8161c, },        // brown hen
      { bodyColor: 0x2c2c30, combColor: 0xe8262a, beakColor: 0xf0c040 }, // black rooster
      { bodyColor: 0xe8b84a, combColor: 0xd8161c },                       // golden
      { bodyColor: 0x8fd96a, combColor: 0x8a3fd1, beakColor: 0xffe14d }, // glowing mutant
      { bodyColor: 0x9aa8b8, combColor: 0x2b7bd6 },                       // frost
    ],
  },
};

// A driver's stats on a given vehicle.
export function combinedStats(character, vehicleId) {
  const v = VEHICLES[vehicleId]?.stats || {};
  const out = {};
  for (const [k, val] of Object.entries(character.stats)) out[k] = Math.max(1, Math.min(5, val + (v[k] || 0)));
  return out;
}

export function buildKart(type, options = {}) {
  const v = VEHICLES[type];
  if (!v) throw new Error(`Unknown vehicle "${type}"`);
  const kart = v.build(options);
  mergeStatic(kart.body, [kart.steering, kart.column].filter(Boolean));
  return kart;
}
