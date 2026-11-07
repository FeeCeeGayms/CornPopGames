// E1M3 — THE CRUST GAUNTLET. Doom II "Gantlet" style: a huge open-sky canyon split by a river of boiling sauce,
// rock pillars and a mesa, the brick Citadel on the east bank (blue key on its gallery), a watchtower behind
// the blue door (red key + teleporter) and the exit shrine behind the red door.
import { makeLevel } from '../kit.js';

export default makeLevel({
  name: 'E1M3', title: 'E1M3: THE CRUST GAUNTLET', ambience: 'street', ambient: 22, music: 'assets/music/e1m3.mp3',
  fog: { color: [0.08, 0.05, 0.05], density: 0.00022 }, skyTint: [1, 0.55, 0.35],
  styles: [{ color: [1, 1, 0.95], pattern: 'fluoro' }, { color: [0.4, 1, 0.5], pattern: 'pulse' }, { color: [1, 0.55, 0.2], pattern: 'candle' }, { color: [1, 0.2, 0.1], pattern: 'neon' }],
}, 112, 84, 'graystone', K => {
  const { X, Z, C } = K; const T = s => K.type(s);
  const GATE = { f: 0, c: 160, floor: 'techfloor', ceil: 'ceil', side: 'stepside', upper: 'techtan' };
  const CAN = K.skySpec(-64, 320, 'dirt', 'mossstone', 'mossstone');
  const MESA = K.skySpec(-16, 272, 'graystone', 'mossstone', 'mossstone');
  const HALL = { f: -32, c: 224, floor: 'tilebrown', ceil: 'ceil', side: 'stepside', upper: 'bigbrown' };
  const GALL = { f: 64, c: 224, floor: 'diamond', ceil: 'ceil', side: 'support', upper: 'bigbrown' };
  const TOWER = { f: -64, c: 224, floor: 'graystone', ceil: 'concretedark', side: 'stepside', upper: 'graystone' };
  const SHRINE = K.skySpec(-64, 256, 'graystone', 'bigbrown', 'bigbrown');

  // ======================= GATEHOUSE (start) =======================
  K.room(3, 40, 13, 52, GATE, 'techtan');
  K.start(6, 46, -90);
  K.item('candygun', X(9), Z(46) + 16); K.item('candybag', X(5), Z(41) + 16, { amount: 50 }); K.item('candybag', X(5), Z(51), { amount: 50 });
  K.msg([X(5), 0, Z(43)], [X(12), 100, Z(50)], 'A CANDY CORN MACHINE GUN! Hold FIRE to spin up the barrels.');
  K.fixture(X(8), Z(43), 160, 128, 'x', 'light', 280); K.fixture(X(8), Z(50), 160, 128, 'x', 'light', 280);
  K.crates(X(12), Z(41) + 8, 0, 2, 40); K.crates(X(12), Z(51) + 8, 0, 1, 40); K.health(X(4), Z(46));
  K.door(14, 45, 14, 47, GATE, { top: 128 });

  // ======================= THE CANYON =======================
  K.room(15, 20, 95, 76, CAN, 'mossstone');
  K.stairs(15, 45, 20, 47, 'W', -56, 0, { floor: 'graystone', ceil: 'sky', side: 'stepside', sky: true, c: 256 });
  K.wall(15, 20, 15, 44, 'mossstone'); K.wall(15, 48, 15, 76, 'mossstone');
  // the sauce river and its two bridges
  K.pool(46, 20, 53, 76, CAN, 'sauce', 32, 12);
  for (const r of [30, 58]) { K.paint(46, r, 53, r + 2, T({ ...CAN, f: -56, floor: 'bigbrown', side: 'bigbrown' })); K.brush([X(46), -56, Z(r)], [X(54), -22, Z(r) + 2], { tex: 'railing', fit: true, noshadow: true }); K.brush([X(46), -56, Z(r + 3) - 2], [X(54), -22, Z(r + 3)], { tex: 'railing', fit: true, noshadow: true }); }
  // the mesa (NW) with its stair
  K.paint(18, 22, 30, 30, T(MESA)); K.stairs(24, 31, 27, 33, 'N', -48, -32, { ...CAN, floor: 'graystone', side: 'stepside' });
  K.qoq(X(20), Z(24), 180, { turret: true, y: -16 }); K.qoq(X(29), Z(23), 180, { turret: true, y: -16 }); K.juice(X(19), Z(29), -16); K.slice(X(28), Z(28), -16); K.health(X(22), Z(23), -16);
  // rock pillars
  for (const [c, r, w, h] of [[34, 38, 3, 3], [40, 54, 2, 4], [26, 60, 4, 3], [58, 42, 3, 3], [60, 22, 2, 3], [30, 68, 3, 2], [63, 66, 3, 3], [38, 25, 2, 2]]) K.wall(c, r, c + w - 1, r + h - 1, 'mossstone');
  // south ledge with a sniper nest
  K.paint(16, 72, 32, 76, T({ ...CAN, f: 0, floor: 'graystone', c: 256 })); K.stairs(33, 72, 36, 76, 'W', -48, -16, { ...CAN, floor: 'graystone', side: 'stepside' });
  K.qoq(X(18), Z(74), 0, { turret: true, y: 0 }); K.slices([[X(17), Z(75)], [X(30), Z(73)]]); K.juice(X(24), Z(75));
  // monsters and items across the canyon floor
  K.qoqC(24, 40, -90); K.qoqC(30, 50, -90); K.qoqC(38, 46, -90); K.qoqC(22, 66, 0); K.qoqC(42, 32, 180); K.qoqC(36, 62, 0); K.qoqC(44, 70, 0);
  K.qoqC(57, 26, 90); K.qoqC(60, 36, 90); K.qoqC(56, 52, 90); K.qoqC(62, 72, 0); K.qoqC(74, 23, 180); K.qoqC(84, 24, 180); K.qoqC(76, 70, 0); K.qoqC(88, 72, 0); K.qoqC(94, 44, -90);
  K.slices([[X(20), Z(36)], [X(42), Z(40)], [X(36), Z(58)], [X(56), Z(64)], [X(66), Z(24)], [X(80), Z(74)], [X(94), Z(30)], [X(94), Z(60)]]);
  K.juice(X(32), Z(44)); K.juice(X(62), Z(46)); K.juice(X(70), Z(72)); K.health(X(44), Z(62)); K.health(X(58), Z(32)); K.item('candybag', X(92), Z(22), { amount: 40 }); K.item('sausages', X(26), Z(46));
  for (const [x, z] of [[X(28), Z(30)], [X(28), Z(58)], [X(50), Z(44)], [X(72), Z(24)], [X(72), Z(70)], [X(94), Z(46)]]) K.light(x, 180, z, 900, [0.85, 0.7, 0.6]);
  K.ambient(X(50), -40, Z(44), 'fire', 900, 0.6); K.ambient(X(30), 0, Z(44), 'wind', 2400, 0.7);
  // secret: loose rock in the north wall behind the mesa
  const CAVE = { f: -16, c: 80, floor: 'dirt', ceil: 'graystone', side: 'graystone', upper: 'mossstone' };
  K.paint(19, 15, 23, 18, T(CAVE)); K.door(20, 19, 22, 19, CAVE, { tex: 'mossstone', wait: -1 });
  K.secret([X(19), -16, Z(15)], [X(24), 70, Z(19)]); K.health(X(20), Z(16)); K.health(X(22), Z(16)); K.item('candybag', X(21), Z(17), { amount: 40 }); K.light(X(21), 50, Z(17), 160, [1, 0.6, 0.3], 3);

  // ======================= THE CITADEL =======================
  K.wall(67, 28, 92, 64, 'bigbrown');
  K.stairs(62, 44, 66, 48, 'E', -56, -32, { ...CAN, floor: 'bigbrown', side: 'stepside' });
  K.door(67, 44, 67, 48, HALL, { top: 144 });
  K.room(68, 36, 91, 56, HALL);
  K.paint(68, 36, 91, 39, T(GALL));
  K.liftCells(78, 40, 80, 42, -32, 64);
  K.brush([X(68), 64, Z(40) - 2], [X(78), 98, Z(40)], { tex: 'railing', fit: true, noshadow: true }); K.brush([X(81), 64, Z(40) - 2], [X(92), 98, Z(40)], { tex: 'railing', fit: true, noshadow: true });
  for (const [c, r] of [[72, 44], [86, 44], [72, 52], [86, 52]]) K.column(C(c), C(r), 40, -32, 224, 'bigbrown', 'trim');
  K.key('blue', X(90), Z(37) + 16, 64); K.light(X(90), 120, Z(38), 260, [0.4, 0.6, 1]);
  K.qoq(X(70), Z(37), 180, { turret: true, y: 64 }); K.qoq(X(85), Z(37), 180, { turret: true, y: 64 });
  K.qoqC(70, 46, -90); K.qoqC(89, 50, 90); K.qoqC(76, 54, 0); K.qoqC(84, 47, 180); K.qoqC(79, 44, 0);
  K.fixture(X(79) + 16, Z(46), 224, 160, 'x', 'light', 380); K.fixture(X(79) + 16, Z(53), 224, 160, 'x', 'light', 340);
  K.lantern(X(68), 40, Z(42), 'px'); K.lantern(X(92), 40, Z(42), 'nx'); K.lantern(X(68), 40, Z(52), 'px'); K.lantern(X(92), 40, Z(52), 'nx');
  K.slices([[X(69), Z(55)], [X(90), Z(55)], [X(74), Z(37), 64]]); K.juice(X(90), Z(41)); K.health(X(69), Z(41)); K.item('candybag', X(79), Z(55), { amount: 40 });
  // armory off the south wall
  K.room(70, 59, 80, 62, { ...HALL, c: 128 }); K.door(74, 57, 76, 58, HALL, { top: 120 });
  K.juice(X(71), Z(60)); K.juice(X(79), Z(60)); K.health(X(75), Z(61)); K.item('sausages', X(77), Z(61)); K.qoqC(72, 61, 0); K.light(X(75), 90, Z(60), 220, [1, 0.8, 0.5]);
  K.wave('bluekey', { onKey: 'blue', msg: 'The Citadel doors burst open!' });
  for (const [c, r] of [[70, 50], [89, 46], [74, 42], [84, 54], [60, 46]]) K.qoqC(c, r, 0, { wave: 'bluekey' });

  // ======================= WATCHTOWER (blue door, red key) =======================
  K.door(30, 19, 33, 19, CAN, { key: 'blue', top: 160 });
  K.room(26, 4, 42, 18, TOWER, 'graystone');
  K.paint(26, 4, 37, 8, T({ ...TOWER, f: 64, floor: 'diamond', side: 'support' }));
  K.stairs(38, 4, 41, 11, 'N', -48, 64, { ...TOWER, floor: 'stepside', side: 'stepside' });
  K.brush([X(26), 64, Z(9) - 2], [X(38), 98, Z(9)], { tex: 'railing', fit: true, noshadow: true });
  K.key('red', X(29), Z(5) + 16, 64); K.light(X(28), 120, Z(6), 240, [1, 0.3, 0.2]);
  K.teleporter(26, 7, 27, 8, 88, 70, 0, { y: 64 });
  K.msg([X(26), 64, Z(4)], [X(31), 160, Z(7)], 'A teleporter pad - back down to the canyon.');
  for (const [x, z] of [[X(30), Z(14)], [X(38), Z(15)]]) K.light(x, 120, z, 300, [1, 0.8, 0.55], 3);
  K.lamp(X(32), 180, Z(6), 260);
  K.qoqC(28, 15, 180); K.qoqC(35, 12, 180); K.qoqC(41, 16, 90); K.qoq(X(30), Z(6), 180, { turret: true, y: 64 }); K.qoq(X(36), Z(5), 180, { turret: true, y: 64 });
  K.slices([[X(27), Z(17)], [X(41), Z(5)]]); K.juice(X(27), Z(11)); K.health(X(36), Z(17));

  // ======================= EXIT SHRINE (red door) =======================
  K.door(96, 45, 96, 48, CAN, { key: 'red', top: 160 });
  K.room(97, 40, 108, 54, SHRINE, 'bigbrown');
  for (const [c, r] of [[99, 42], [106, 42], [99, 52], [106, 52]]) K.column(C(c), C(r), 32, -64, 64, 'bigbrown', 'trim');
  K.exit(X(109), -64, Z(47), 'nx');
  K.wave('shrine', { min: [X(97), -64, Z(44)], max: [X(100), 40, Z(50)], msg: 'The shrine guardians wake!' });
  for (const [c, r] of [[104, 41], [104, 53], [107, 44], [107, 50]]) K.qoqC(c, r, 90, { wave: 'shrine' });
  K.light(X(103), 120, Z(47), 600, [1, 0.6, 0.4]); K.slices([[X(98), Z(41)], [X(98), Z(53)]]);

  // secret: boards in the south cliff hide a teleporter up to the Citadel gallery
  K.paint(37, 78, 40, 80, T({ f: -64, c: 32, floor: 'dirt', ceil: 'graystone', side: 'graystone', upper: 'mossstone' })); K.paint(38, 77, 39, 77, T({ f: -64, c: 32, floor: 'dirt', ceil: 'graystone', side: 'graystone', upper: 'mossstone' }));
  K.breakable([X(38), -64, Z(77)], [X(40), 32, Z(78)], { tex: 'boards', health: 20, secret: true });
  K.teleporter(38, 79, 39, 80, 74, 38, 180, { destY: 64 });

  K.goal(X(90), Z(37) + 16, 64); K.goal(X(29), Z(5) + 16, 64);
});
