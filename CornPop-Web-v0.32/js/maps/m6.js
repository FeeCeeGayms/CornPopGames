// E1M6 — THE DOUGH CRUSHER. Doom II "The Crusher" style: a big vertical tech base. Down a long stair into a forest of
// pillars, through a corridor of dough presses (crushers) to a lift tower (blue key), out over a deep outdoor gorge
// on a sky bridge to the rock tower (red key), and finally the crusher vault and the exit.
import { makeLevel } from '../kit.js';

export default makeLevel({
  name: 'E1M6', title: 'E1M6: THE DOUGH CRUSHER', ambience: 'cave', ambient: 13, music: 'assets/music/e1m6.mp3',
  fog: { color: [0.06, 0.03, 0.02], density: 0.00032 }, skyTint: [0.6, 0.5, 0.75],
  styles: [{ color: [1, 0.78, 0.5], pattern: 'flicker2' }, { color: [0.4, 1, 0.5], pattern: 'pulse' }, { color: [1, 0.55, 0.2], pattern: 'candle' }, { color: [1, 0.2, 0.1], pattern: 'neon' }],
  // Crypt of Hornt (v0.28): the map is re-skinned as an ancient ruin, lit by fire, under a hellish sky
  lightTint: [1, 0.84, 0.7], outTint: [1, 0.66, 0.42], retex: {'door': 'cryptdoor', 'door_red': 'cryptdoor_red', 'door_blue': 'cryptdoor_blue', 'door_gold': 'cryptdoor_gold', 'techtan': 'ruinwall', 'techgray': 'ruindark', 'techgreen': 'ruinwall2', 'techfloor': 'flagdark', 'ceil': 'vaultceil', 'light': 'runelight', 'lightamber': 'runelight', 'computer': 'runewall', 'support': 'ironrust', 'steeldark': 'vaultceil', 'rustpanel': 'bloodwall', 'metal': 'ironrust', 'concrete': 'flagdark', 'concretedark': 'flagdark', 'diamond': 'flagdark', 'tilebrown': 'flagblood', 'tile': 'flagdark', 'stepside': 'ruindark', 'trim': 'ruintrim', 'grate': 'ironrust', 'crate': 'ruinwall2', 'bigbrown': 'bloodwall', 'graystone': 'hellrock', 'mossstone': 'hellrock', 'slimewall': 'ruinwall2', 'brickred': 'bloodwall', 'dirt': 'ashground', 'grass': 'deadgrass', 'checker': 'flagdark', 'lift': 'ironrust', 'hazard': 'ironrust', 'monitors': 'runelight', 'drawer': 'ruinwall2', 'jaildark': 'ruindark', 'cabinet': 'ruindark', 'books': 'bonewall', 'carpet': 'flagblood', 'chrome': 'ironrust'},
  sky: {'hell': 1, 'a': [0.035, 0.012, 0.0], 'b': [0.95, 0.42, 0.06], 'glow': [0.8, 0.3, 0.05], 'orb': {'kind': 'eye', 'az': 1.6, 'el': 1.05, 'color': [1, 0.4, 0.08]}, 'silh': 'volcano'},
  rain: [{ kind: 'embers', density: 420, wind: [10, -6] }, { kind: 'ash', density: 300, wind: [10, -6] }], mist: { color: [0.3, 0.1, 0.03], density: 0.0012, top: -40, range: 260 },
}, 100, 96, 'techgray', K => {
  const { X, Z, C } = K; const T = s => K.type(s);
  const DECK = { f: 128, c: 256, floor: 'techfloor', ceil: 'ceil', side: 'stepside', upper: 'techgray' };
  const HALL = { f: -64, c: 192, floor: 'techfloor', ceil: 'steeldark', side: 'stepside', upper: 'techgray' };
  const CORR = { f: -64, c: 64, floor: 'grate', ceil: 'steeldark', side: 'stepside', upper: 'techgray' };
  const TOWER = { f: -64, c: 320, floor: 'techfloor', ceil: 'steeldark', side: 'stepside', upper: 'techgray' };
  const LEDGE = { f: 64, c: 320, floor: 'grate', ceil: 'steeldark', side: 'support', upper: 'techgray' };
  const BAL = { f: 192, c: 320, floor: 'diamond', ceil: 'steeldark', side: 'support', upper: 'techgray' };
  const GORGE = K.skySpec(-128, 576, 'dirt', 'graystone', 'graystone');
  const BRIDGE = K.skySpec(192, 256, 'diamond', 'support', 'graystone');
  const VAULT = { f: -64, c: 96, floor: 'concrete', ceil: 'steeldark', side: 'stepside', upper: 'rustpanel' };

  // ======================= UPPER DECK (start) =======================
  K.room(4, 4, 20, 16, DECK, 'techgray');
  K.start(10, 8, 180);
  K.window(21, 7, 23, 11, 168, 232, 'graystone', 'graystone');
  for (const c of [8, 16]) K.fixture(X(c), Z(10), 256, 128, 'z', 'light', 300);
  K.desk(X(5), Z(5), X(9), Z(7), 'pz'); K.crates(X(18), Z(5) + 16, 128, 2, 44); K.crates(X(19), Z(15), 128, 1, 44);
  K.health(X(5), Z(15)); K.juice(X(19), Z(10)); K.slices([[X(12), Z(5)], [X(5), Z(10)]]);
  K.qoqC(18, 12, 90);
  K.msg([X(20), 128, Z(6)], [X(21), 260, Z(12)], 'A sky bridge crosses the gorge out there...');
  // secret: a switch behind the desk opens a stash in the west wall
  const STASH = { f: 128, c: 224, floor: 'tilebrown', ceil: 'ceil', side: 'stepside', upper: 'techgray' };
  K.paint(1, 10, 2, 14, T(STASH)); K.door(3, 11, 3, 13, STASH, { tex: 'techgray', targeted: true, name: 'deckstash', wait: -1 });
  K.switch(X(7), 180, Z(4), 'pz', 'deckstash', 'A panel slides open...');
  K.secret([X(1), 128, Z(10)], [X(3), 220, Z(15)]); K.health(X(1) + 16, Z(11)); K.juice(X(1) + 16, Z(13)); K.slice(X(2), Z(14)); K.light(X(2), 180, Z(12), 160, [1, 0.6, 0.3], 3);

  // ======================= THE DESCENT =======================
  K.stairs(8, 17, 15, 28, 'N', -48, 112, { floor: 'techfloor', ceil: 'steeldark', side: 'stepside', upper: 'techgray', c: -9999, head: 160 });
  for (const r of [19, 23, 27]) K.light(X(12), 160 - (r - 17) * 15, Z(r), 260, [1, 0.95, 0.85]);
  K.qoqC(9, 24, 0); K.qoqC(14, 21, 0); K.slice(X(12), Z(22));

  // ======================= PILLAR HALL =======================
  K.room(4, 29, 40, 60, HALL, 'techgray');
  for (const c of [9, 15, 21, 27, 33]) for (const r of [35, 41, 47, 53]) K.wall(c, r, c + 1, r + 1, (c + r) % 2 ? 'support' : 'techgray');
  for (const c of [12, 24, 36]) for (const r of [32, 44, 56]) K.light(X(c), 150, Z(r), 280, [0.95, 0.95, 1], (c + r) % 3 ? 0 : 1);
  K.qoqC(6, 32, 180); K.qoqC(18, 38, 180); K.qoqC(30, 32, 180); K.qoqC(38, 40, -90); K.qoqC(12, 50, 0); K.qoqC(24, 56, 0); K.qoqC(36, 50, -90); K.qoqC(6, 58, 0); K.qoqC(30, 45, 180);
  K.slices([[X(5), Z(44)], [X(39), Z(30)], [X(39), Z(59)], [X(18), Z(59)], [X(24), Z(32)]]); K.juice(X(5), Z(30)); K.juice(X(18), Z(44)); K.juice(X(36), Z(57)); K.health(X(30), Z(59)); K.health(X(12), Z(44)); K.item('sausages', X(27), Z(38) + 16);
  // gorge passage (from the bottom of the gorge back up into the hall)
  K.stairs(30, 23, 33, 28, 'S', -112, -72, { ...HALL, floor: 'graystone', side: 'stepside', c: 128 });

  // ======================= CRUSHER CORRIDOR =======================
  K.door(41, 43, 41, 46, HALL, { top: 128 });
  K.paint(42, 43, 69, 46, T(CORR));
  [[45, 0], [51, 0.7], [57, 1.4], [63, 2.1]].forEach(([c, ph]) => K.crusher(c, 43, c + 2, 46, 64, -64, { h: 40, phase: ph, damage: 8 }));
  for (const c of [43, 49, 55, 61, 67]) K.light(X(c), 30, Z(45), 200, [1, 0.5, 0.25], 2);
  K.sign(X(43), 20, Z(43), 'pz', 'hazard', 48, 48, false);
  K.msg([X(42), -64, Z(43)], [X(44), 40, Z(47)], 'Dough presses ahead! Time your run.');
  K.slices([[X(48) + 16, Z(45)], [X(54) + 16, Z(45)], [X(60) + 16, Z(45)]]);

  // ======================= LIFT TOWER (blue key) =======================
  K.room(70, 34, 86, 56, TOWER, 'techgray');
  K.paint(70, 34, 83, 37, T(LEDGE)); K.paint(84, 34, 86, 56, T(BAL));
  K.liftCells(76, 38, 78, 40, -64, 64); K.liftCells(82, 34, 83, 35, 64, 192);
  K.brush([X(70), 64, Z(38) - 2], [X(76), 98, Z(38)], { tex: 'railing', fit: true, noshadow: true }); K.brush([X(79), 64, Z(38) - 2], [X(84), 98, Z(38)], { tex: 'railing', fit: true, noshadow: true });
  K.brush([X(84), 192, Z(38)], [X(84) + 2, 226, Z(57)], { tex: 'railing', fit: true, noshadow: true });
  K.key('blue', X(85) + 16, Z(55), 192); K.light(X(85), 260, Z(54), 260, [0.4, 0.6, 1]);
  for (const [x, z, y] of [[X(74), Z(48), 120], [X(80), Z(48), 120], [X(78), Z(35), 200], [X(85), Z(44), 280]]) K.light(x, y, z, 360, [0.95, 0.95, 1]);
  K.qoq(X(72), Z(35), 180, { turret: true, y: 64 }); K.qoq(X(85) + 16, Z(46), -90, { turret: true, y: 192 });
  K.qoqC(72, 54, 0); K.qoqC(82, 50, -90); K.qoqC(78, 44, 0); K.qoqC(71, 42, 90);
  K.slices([[X(71), Z(55)], [X(81), Z(35), 64], [X(85), Z(40), 192]]); K.juice(X(82), Z(55)); K.health(X(74), Z(35), 64); K.item('sausages', X(71), Z(48));
  K.wave('bluekey', { onKey: 'blue', msg: 'The tower comes alive!' });
  for (const [c, r] of [[72, 50], [80, 54], [74, 36], [85, 40], [78, 47]]) K.qoqC(c, r, 0, { wave: 'bluekey' });

  // ======================= THE GORGE & SKY BRIDGE (blue door, red key) =======================
  K.door(84, 33, 86, 33, BAL, { key: 'blue', top: 128 });
  K.paint(84, 23, 86, 32, T({ ...BAL, c: 320 }));
  K.room(24, 4, 96, 22, GORGE, 'graystone');
  K.paint(84, 15, 86, 22, T(BRIDGE)); K.paint(59, 12, 86, 14, T(BRIDGE));
  K.paint(50, 6, 58, 20, T(K.skySpec(192, 256, 'graystone', 'graystone', 'graystone')));     // the rock tower
  for (const [x0, z0, x1, z1] of [[X(59), Z(12) - 2, X(84), Z(12)], [X(59), Z(15), X(84), Z(15) + 2], [X(84) - 2, Z(15), X(84), Z(23)], [X(87), Z(12), X(87) + 2, Z(23)]])
    K.brush([x0, 192, z0], [x1, 226, z1], { tex: 'railing', fit: true, noshadow: true });
  for (const c of [64, 72, 80]) K.brush([X(c), -128, Z(13)], [X(c) + 24, 184, Z(14)], { tex: 'support' });
  K.key('red', X(51) + 16, Z(7) + 16, 192); K.light(X(52), 260, Z(8), 260, [1, 0.3, 0.2]);
  K.teleporter(56, 17, 57, 18, 24, 44, 0, { y: 192 });
  K.msg([X(50), 192, Z(15)], [X(59), 300, Z(21)], 'A teleporter - straight back down to the pillar hall.');
  K.qoq(X(54), Z(10), 90, { turret: true, y: 192 }); K.qoq(X(70), Z(13), 90, { turret: true, y: 192 });
  K.qoqC(30, 10, 0); K.qoqC(40, 18, 0); K.qoqC(66, 6, 180); K.qoqC(76, 20, 180); K.qoqC(90, 8, 180); K.qoqC(46, 8, 90);
  K.slices([[X(26), Z(20)], [X(94), Z(20)], [X(58), Z(7), 192], [X(75), Z(13), 192]]); K.juice(X(26), Z(6)); K.juice(X(94), Z(6)); K.health(X(57), Z(9), 192);
  K.nukage(36, 6, 44, 12, GORGE, 16, 8); K.nukage(64, 16, 74, 21, GORGE, 16, 8);
  for (const [x, z] of [[X(34), Z(14)], [X(54), Z(14)], [X(76), Z(10)], [X(92), Z(14)]]) K.light(x, 260, z, 1000, [0.75, 0.72, 0.85]);
  K.ambient(X(60), 100, Z(13), 'wind', 2400, 0.8);
  // secret: a cave behind a loose rock at the bottom of the gorge
  const CAVE = { f: -128, c: -32, floor: 'dirt', ceil: 'graystone', side: 'graystone', upper: 'graystone' };
  K.paint(20, 9, 22, 13, T(CAVE)); K.door(23, 10, 23, 12, CAVE, { tex: 'graystone', wait: -1 });
  K.secret([X(20), -128, Z(9)], [X(23), -40, Z(14)]); K.health(X(21), Z(10)); K.health(X(21), Z(12)); K.item('sausages', X(20) + 16, Z(13)); K.light(X(21), -80, Z(11), 160, [1, 0.6, 0.3], 3);

  // ======================= CRUSHER VAULT (red door, exit) =======================
  K.door(20, 61, 24, 61, HALL, { key: 'red', top: 128 });
  K.room(14, 62, 30, 90, VAULT, 'rustpanel');
  K.paint(8, 68, 13, 84, T({ ...VAULT, c: 128 })); K.paint(31, 68, 36, 84, T({ ...VAULT, c: 128 }));    // side galleries
  [[66, 0], [72, 0.9], [78, 1.8], [84, 0.45]].forEach(([r, ph]) => K.crusher(18, r, 26, r + 2, 96, -64, { h: 32, phase: ph, damage: 8, speed: 240 }));
  for (const r of [64, 70, 76, 82, 88]) K.light(X(22), 60, Z(r), 220, [1, 0.5, 0.25], r % 12 ? 2 : 0);
  K.exit(X(22), -64, Z(91), 'nz');
  K.qoqC(10, 70, 90); K.qoqC(34, 72, -90); K.qoqC(10, 82, 90); K.qoqC(34, 82, -90); K.qoqC(16, 88, 0); K.qoqC(28, 88, 0);
  K.slices([[X(9), Z(76)], [X(35), Z(76)]]); K.health(X(9), Z(69)); K.health(X(35), Z(83)); K.juice(X(35), Z(69)); K.juice(X(9), Z(83));
  K.wave('vault', { min: [X(14), -64, Z(62)], max: [X(31), 40, Z(65)], msg: 'The vault seals shut behind you!', lock: [] });
  for (const [c, r] of [[16, 76], [28, 76], [22, 70], [22, 88]]) K.qoqC(c, r, 0, { wave: 'vault' });

  K.goal(X(85) + 16, Z(55), 192); K.goal(X(51) + 16, Z(7) + 16, 192);

  K.ruins({ seed: 1222, theme: 'iron', big: 24 });
});
