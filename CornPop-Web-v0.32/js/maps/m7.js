// E1M7 — DEAD SIMPLE SLICE. Doom II "Dead Simple" style: one big walled courtyard under the sky. Clear the first
// wave and the inner walls sink into the ground; clear the second and the gate to the exit opens. Simple. Deadly.
import { makeLevel } from '../kit.js';

export default makeLevel({
  name: 'E1M7', title: 'E1M7: DEAD SIMPLE SLICE', ambience: 'street', ambient: 24, music: 'assets/music/e1m7.mp3',
  fog: { color: [0.1, 0.035, 0.03], density: 0.00022 }, skyTint: [1, 0.5, 0.3],
  styles: [{ color: [1, 0.78, 0.5], pattern: 'flicker2' }, { color: [0.4, 1, 0.5], pattern: 'pulse' }, { color: [1, 0.55, 0.2], pattern: 'candle' }, { color: [1, 0.2, 0.1], pattern: 'neon' }],
  // Crypt of Hornt (v0.28): the map is re-skinned as an ancient ruin, lit by fire, under a hellish sky
  lightTint: [1, 0.84, 0.7], outTint: [1, 0.5, 0.42], retex: {'door': 'cryptdoor', 'door_red': 'cryptdoor_red', 'door_blue': 'cryptdoor_blue', 'door_gold': 'cryptdoor_gold', 'techtan': 'ruinwall', 'techgray': 'ruindark', 'techgreen': 'ruinwall2', 'techfloor': 'flagstone', 'ceil': 'vaultceil', 'light': 'runelight', 'lightamber': 'runelight', 'computer': 'runewall', 'support': 'ironrust', 'steeldark': 'vaultceil', 'rustpanel': 'bloodwall', 'metal': 'ironrust', 'concrete': 'flagdark', 'concretedark': 'flagdark', 'diamond': 'flagstone', 'tilebrown': 'flagblood', 'tile': 'flagdark', 'stepside': 'ruindark', 'trim': 'ruintrim', 'grate': 'ironrust', 'crate': 'ruinwall2', 'bigbrown': 'bloodwall', 'graystone': 'ruindark', 'mossstone': 'ruinwall2', 'slimewall': 'ruinwall2', 'brickred': 'bloodwall', 'dirt': 'bloodsoil', 'grass': 'deadgrass', 'checker': 'flagdark', 'lift': 'ironrust', 'hazard': 'ironrust', 'monitors': 'runelight', 'drawer': 'ruinwall2', 'jaildark': 'ruindark', 'cabinet': 'ruindark', 'books': 'bonewall', 'carpet': 'flagblood', 'chrome': 'ironrust'},
  sky: {'hell': 1, 'a': [0.045, 0.0, 0.005], 'b': [0.8, 0.07, 0.04], 'glow': [0.6, 0.12, 0.04], 'orb': {'kind': 'sun', 'az': 0.5, 'el': 1.1, 'color': [1, 0.2, 0.08]}, 'silh': 'ruins'},
  rain: { blood: true, density: 900, wind: [26, 16] }, storm: { every: [9, 18], power: 0.9, color: [1, 0.2, 0.12] },
}, 72, 70, 'bigbrown', K => {
  const { X, Z, C } = K; const T = s => K.type(s);
  const START = { f: 0, c: 128, floor: 'tilebrown', ceil: 'ceil', side: 'stepside', upper: 'bigbrown' };
  const YARD = K.skySpec(0, 224, 'dirt', 'bigbrown', 'bigbrown');
  const BATT = K.skySpec(96, 128, 'graystone', 'bigbrown', 'bigbrown');
  const INNER = K.skySpec(0, 224, 'grass', 'bigbrown', 'bigbrown');
  const WALLC = K.skySpec(0, 160, 'bigbrown', 'bigbrown', 'bigbrown');
  const EXITR = { f: 0, c: 128, floor: 'diamond', ceil: 'ceil', side: 'stepside', upper: 'bigbrown' };

  // ======================= START ROOM =======================
  K.room(2, 30, 8, 38, START, 'bigbrown');
  K.start(4, 34, -90);
  K.health(X(3), Z(31)); K.health(X(3), Z(37)); K.juice(X(7), Z(31)); K.juice(X(7), Z(37)); K.item('sausages', X(5), Z(34));
  K.lantern(X(2), 70, Z(34), 'px'); K.light(X(6), 100, Z(34), 220, [1, 0.8, 0.55]);
  K.msg([X(3), 0, Z(32)], [X(8), 100, Z(37)], 'Dead simple: kill everything out there.');
  K.door(9, 32, 9, 36, START, { top: 128 });

  // ======================= THE COURTYARD =======================
  K.room(10, 6, 62, 62, YARD, 'bigbrown');
  K.paint(10, 6, 62, 7, T(BATT)); K.paint(10, 61, 62, 62, T(BATT));
  // corner bastions (solid blocks) and planters
  for (const [c, r] of [[14, 12], [54, 12], [14, 52], [54, 52]]) { K.wall(c, r, c + 3, r + 3, 'bigbrown'); K.light(C(c) + 48, 180, C(r) + 48, 300, [1, 0.6, 0.35], 1); }
  // the four sinking inner walls
  K.door(26, 22, 46, 23, WALLC, { tex: 'bigbrown', targeted: true, name: 'innerwall', dir: -1, wait: -1, speed: 60 });
  K.door(26, 45, 46, 46, WALLC, { tex: 'bigbrown', targeted: true, name: 'innerwall', dir: -1, wait: -1, speed: 60 });
  K.door(26, 24, 27, 44, WALLC, { tex: 'bigbrown', targeted: true, name: 'innerwall', dir: -1, wait: -1, speed: 60 });
  K.door(45, 24, 46, 44, WALLC, { tex: 'bigbrown', targeted: true, name: 'innerwall', dir: -1, wait: -1, speed: 60 });
  // inner yard: four pools and the gate house in the middle
  K.paint(28, 24, 44, 44, T(INNER));
  for (const [c, r] of [[29, 25], [40, 25], [29, 40], [40, 40]]) K.pool(c, r, c + 3, r + 3, INNER, 'sauce', 16, 6);
  K.wall(33, 31, 39, 37, 'bigbrown'); K.room(34, 32, 38, 36, EXITR);
  K.door(35, 37, 37, 37, EXITR, { tex: 'bars', thin: true, targeted: true, name: 'exitgate', wait: -1, speed: 120 });
  K.exit(X(36) + 16, 0, Z(32), 'pz');
  K.light(X(36) + 16, 100, Z(35), 260, [1, 0.6, 0.3]);
  // lights over the yard
  for (const [x, z] of [[X(20), Z(20)], [X(52), Z(20)], [X(20), Z(48)], [X(52), Z(48)], [X(36), Z(14)], [X(36), Z(54)], [X(36), Z(34)]]) K.light(x, 210, z, 900, [0.9, 0.75, 0.65]);
  K.ambient(X(36), 40, Z(34), 'wind', 2400, 0.8);
  // supplies
  K.slices([[X(12), Z(10)], [X(60), Z(10)], [X(12), Z(59)], [X(60), Z(59)], [X(36), Z(9)], [X(36), Z(59)], [X(20), Z(34)], [X(52), Z(34)]]);
  K.juice(X(22), Z(16)); K.juice(X(50), Z(16)); K.juice(X(22), Z(52)); K.juice(X(50), Z(52)); K.juice(X(60), Z(34));
  K.health(X(12), Z(20)); K.health(X(60), Z(20)); K.health(X(12), Z(48)); K.health(X(60), Z(48));
  K.item('sausages', X(19), Z(26)); K.item('sausages', X(53), Z(42)); K.item('candybag', X(36), Z(19), { amount: 40 }); K.item('candybag', X(36), Z(50), { amount: 40 });
  K.item('turdbox', X(24), Z(58)); K.item('turdbox', X(48), Z(10));
  K.health(X(30), Z(34)); K.health(X(42), Z(34)); K.juice(X(36), Z(28));

  // ======================= THE WAVES =======================
  K.wave('phase1', { min: [X(10), 0, Z(30)], max: [X(13), 100, Z(39)], msg: 'They are everywhere!', stagger: 0.25, opens: ['innerwall'], doneMsg: 'The inner walls are sinking...', next: 'phase2', nextDelay: 1.5 });
  for (const [c, r] of [[20, 10], [30, 10], [42, 10], [52, 10], [58, 24], [58, 44], [52, 58], [40, 58], [30, 58], [20, 58], [16, 40], [22, 30], [50, 30], [50, 40]]) K.qoqC(c, r, 90, { wave: 'phase1' });
  K.qoq(X(24), Z(6) + 16, 180, { turret: true, y: 96, wave: 'phase1' }); K.qoq(X(48), Z(6) + 16, 180, { turret: true, y: 96, wave: 'phase1' });
  K.qoq(X(24), Z(62), 0, { turret: true, y: 96, wave: 'phase1' }); K.qoq(X(48), Z(62), 0, { turret: true, y: 96, wave: 'phase1' });
  K.wave('phase2', { msg: 'Something was waiting inside!', stagger: 0.3, opens: ['exitgate'], doneMsg: 'The gate to the exit is open!' });
  for (const [c, r] of [[31, 29], [41, 29], [31, 39], [41, 39], [36, 26], [36, 42], [30, 34], [43, 34], [36, 39]]) K.qoqC(c, r, 0, { wave: 'phase2' });

  // secret: a hidden door in the north-east corner leads to a stash
  const STASH = { f: 0, c: 112, floor: 'tilebrown', ceil: 'concretedark', side: 'stepside', upper: 'bigbrown' };
  K.paint(64, 8, 67, 13, T(STASH)); K.door(63, 9, 63, 12, STASH, { tex: 'bigbrown', wait: -1 });
  K.secret([X(64), 0, Z(8)], [X(68), 100, Z(14)]); K.health(X(65), Z(9)); K.health(X(65), Z(12)); K.item('candybag', X(66) + 16, Z(10) + 16, { amount: 50 }); K.slice(X(67), Z(13)); K.light(X(65), 70, Z(10), 160, [1, 0.6, 0.3], 1);

  for (const [c, r] of [[14, 34], [20, 18], [36, 12], [52, 18], [58, 34], [52, 50], [36, 56], [20, 50], [14, 34], [36, 12], [36, 56]]) K.goal(X(c), Z(r), 0, { wait: 12 });
  K.goal(X(36), Z(26), 0, { wait: 25 }); K.goal(X(30), Z(42), 0, { wait: 15 });

  K.ruins({ seed: 1259, theme: 'blood', big: 12 });
});
