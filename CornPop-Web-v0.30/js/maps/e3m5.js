// E3M5 (the original v0.24 E1M5, now part of Episode 3: The Pidser Cave) — THE KITCHENS. Up the service tunnel into the arched Prep Hall (image 6), the great brick Oven Room
// (red key over the sauce), the sunken Dish Pit (blue key tower), the two-storey Mess Hall, the Freezer
// maze (gold key) and the Pantry, where the way out waits behind a final lunch rush.
import { makeLevel } from '../kit.js';

export default makeLevel({
  name: 'E3M5', title: 'E3M5: THE KITCHENS', ambience: 'kitchen', music: 'assets/music/e1m5.mp3', ambient: 42,
  fog: { color: [0.04, 0.03, 0.022], density: 0.00032 },
  styles: [{ color: [1, 0.5, 0.15], pattern: 'candle' }, { color: [1, 0.3, 0.08], pattern: 'flicker' }, { color: [1, 1, 0.95], pattern: 'fluoro' }, { color: [0.4, 0.6, 1], pattern: 'gentle' }],
  // the Pidser Cave bunker (v0.29): riveted plates, warm lamps, floors polished enough to mirror them
  lightTint: [1, 0.9, 0.74], gloss: 1, retex: {'concrete': 'bunkerplate', 'concretedark': 'bunkerdark', 'steel': 'bunkerbig', 'steeldark': 'bunkerceil', 'ceil': 'bunkerceil', 'trim': 'bunkertrim', 'stepside': 'bunkertrim', 'diamond': 'bunkerfloor', 'tile': 'bunkerfloor', 'tilebrown': 'bunkerfloor2', 'rustpanel': 'bunkerrust', 'jailfloor': 'bunkerfloor', 'jaildark': 'bunkerdark', 'jailmetal': 'bunkerplate', 'brickdark': 'bunkerplate'},
}, 112, 104, 'brick', K => {
  const { X, Z, C } = K; const T = s => K.type(s);
  const TUN = { f: 0, c: 160, floor: 'tilebrown', ceil: 'brickred', side: 'stepside', upper: 'brickred' };
  const PREP = { f: 0, c: 256, floor: 'tile', ceil: 'ceil', side: 'stepside', upper: 'brick' };
  const ALC = { f: 0, c: 128, floor: 'tilebrown', ceil: 'brick', side: 'stepside', upper: 'brick' };
  const OVEN = { f: 0, c: 320, floor: 'tilebrown', ceil: 'brickdark', side: 'stepside', upper: 'brickdark' };
  const LEDGE = { f: 0, c: 288, floor: 'diamond', ceil: 'ceil', side: 'stepside', upper: 'brick' };
  const PIT = { f: -64, c: 288, floor: 'jailfloor', ceil: 'ceil', side: 'concrete', upper: 'brick' };
  const MESS = { f: 0, c: 320, floor: 'tilebrown', ceil: 'ceil', side: 'stepside', upper: 'brick' };
  const GAL = { f: 160, c: 320, floor: 'diamond', ceil: 'ceil', side: 'stepside' };
  const FRZ = { f: 0, c: 160, floor: 'tile', ceil: 'steel', side: 'trim', upper: 'steel' };
  const PAN = { f: 0, c: 288, floor: 'tilebrown', ceil: 'ceil', side: 'stepside', upper: 'brickdark' };
  const PANL = { f: 160, c: 288, floor: 'diamond', ceil: 'ceil', side: 'stepside' };

  // ---------------- service tunnel (start) ----------------
  K.room(52, 91, 57, 101, TUN, 'brickred');
  K.start(54, 99, 0);
  K.arch(X(52), Z(91), X(58), Z(91) + 8, 64, 160, 'brickred', 'trim');
  for (const r of [93, 97, 100]) K.lamp(X(52) + 10, 120, Z(r), 170);
  K.juice(X(56), Z(95)); K.slice(X(53), Z(95)); K.health(X(56), Z(100));
  K.crates(X(53), Z(92) + 16, 0, 1, 36); K.barrel(X(57), Z(93), 12, 30);
  K.ambient(X(54), 60, Z(96), 'machine', 300, 0.5);

  // ---------------- PREP HALL (image 6: arched alcoves, big pizza tables) ----------------
  K.room(30, 62, 81, 90, PREP, 'brick');
  const westAlc = [64, 71, 85], eastAlc = [64, 78, 85];
  for (const r0 of westAlc) {
    K.room(24, r0, 29, r0 + 4, ALC, 'brick');
    K.arch(X(29), Z(r0), X(30), Z(r0 + 5), 48, 128, 'brick', 'concretedark');
    K.counter(X(24), Z(r0), X(24) + 30, Z(r0 + 5), 40, 'drawer', 'px', 'metal');
    K.pizzaBoxes(X(24) + 15, Z(r0) + 40, 40, 3); K.props(pr => pr.pizzaSquare(X(24) + 15, 40, Z(r0) + 112, 26, 60));
    K.fixture(X(26) + 16, Z(r0) + 80, 128, 96, 'z', 'lightamber', 200, [1, 0.75, 0.4]);
  }
  for (const r0 of eastAlc) {
    K.room(82, r0, 87, r0 + 4, ALC, 'brick');
    K.arch(X(82), Z(r0), X(83), Z(r0 + 5), 48, 128, 'brick', 'concretedark');
    // little brick pizza oven at the back of the alcove
    K.brush([X(86), 0, Z(r0)], [X(88), 96, Z(r0 + 5)], { tex: 'brickred', top: 'brick' });
    K.decal({ at: [X(86), 40, Z(r0) + 80], n: 'nx', w: 60, h: 36, tex: 'glowred', fullbright: true, off: 0.6 });
    K.light(X(85), 40, Z(r0) + 80, 220, [1, 0.45, 0.15], 1);
  }
  K.sign(X(55), 210, Z(62), 'pz', 'sign_kitchen', 220, 50);
  // giant prep tables
  for (const [c, r] of [[42, 70], [42, 82], [68, 70], [68, 82]]) {
    K.brush([X(c) - 80, 0, Z(r) - 48], [X(c) + 80, 36, Z(r) + 48], { tex: 'drawer', top: 'metal' });
    K.props(pr => pr.pizzaSquare(X(c), 36, Z(r), 140, 80));
  }
  K.brush([X(55) - 64, 0, Z(76) - 64], [X(55) + 64, 40, Z(76) + 64], { tex: 'concrete', top: 'concrete' }); K.props(pr => pr.pizza(X(55), 40, Z(76), 58));
  for (const [c, r] of [[36, 76], [74, 76]]) K.column(C(c), C(r), 32, 0, 256, 'brick');
  // north gallery (turret perch + secret ledge)
  K.catwalk(X(30), Z(62), X(81), Z(65), 144, { rails: 's', tex: 'grate', supports: [[X(38), Z(65) - 4], [X(55) - 80, Z(65) - 4], [X(55) + 80, Z(65) - 4], [X(72), Z(65) - 4]] });
  for (const c of [40, 70]) K.qoq(C(c), Z(63) + 16, 180, { turret: true, y: 144 });
  K.skylight(X(42), Z(76), 256, 0, 128, 96); K.skylight(X(68), Z(76), 256, 0, 128, 96);
  for (const c of [36, 55, 74]) K.fixture(X(c), Z(86), 256, 120, 'x', 'light', 300, [1, 0.95, 0.85], 2);
  K.qoqC(38, 68, 180); K.qoqC(48, 76, 180); K.qoqC(62, 76, 180); K.qoqC(72, 86, 180); K.qoqC(38, 88, 0); K.qoqC(60, 66, 180);
  K.slices([[X(34), Z(88)], [X(76), Z(88)], [X(55), Z(76), 40]]); K.juice(X(32), Z(66)); K.juice(X(79), Z(70)); K.health(X(79), Z(88));
  K.emitter([X(30), 0, Z(62)], [X(82), 240, Z(91)], 'dust', 10);
  K.ambient(X(55), 80, Z(76), 'hum', 700, 0.6);
  // secret: the first east oven alcove hides a teleporter — a teleporter up to the gallery
  K.tele([X(84), 0, Z(65)], [X(86), 90, Z(68)], [X(31) + 16, 144, Z(63) + 16], 0);
  K.secret([X(30), 144, Z(62)], [X(34), 220, Z(65)]); K.health(X(31) + 8, Z(64), 144); K.juice(X(33), Z(64), 144); K.slice(X(35), Z(64), 144);

  // ---------------- OVEN ROOM (red key over the sauce) ----------------
  K.paint(23, 76, 29, 77, T({ ...TUN, c: 128 }));
  K.room(4, 58, 22, 92, OVEN, 'brickdark');
  K.brush([X(4), 0, Z(64)], [X(7), 240, Z(86)], { tex: 'brickdark', top: 'brick' });
  K.decal({ at: [X(7), 36, Z(75)], n: 'px', w: 380, h: 60, tex: 'glowred', fullbright: true, off: 0.5 });
  K.props(pr => pr.ring(X(7) + 2, 0, Z(75), 260, 280, 10, 'x', 0, Math.PI, 'brickred', 32));
  for (const z of [Z(66), Z(75), Z(84)]) K.light(X(9), 60, z, 300, [1, 0.4, 0.1], 1);
  K.emitter([X(7), 0, Z(64)], [X(9), 140, Z(86)], 'sparks', 6); K.emitter([X(7), 120, Z(64)], [X(12), 300, Z(86)], 'steam', 5);
  K.pool(10, 67, 18, 83, OVEN, 'sauce', 32, 12);
  K.brush([X(13), -32, Z(73)], [X(16), 64, Z(77)], { tex: 'brickred', top: 'metal' });
  K.stairBrush(X(17), Z(60), X(21), Z(64), 0, 64, 'W');
  K.catwalk(X(13), Z(60), X(17), Z(64), 64, { rails: 'nw', tex: 'grate' });
  K.catwalk(X(13), Z(64), X(16), Z(73), 64, { rails: 'ew', tex: 'grate', supports: [[X(13) + 4, Z(66)], [X(16) - 4, Z(66)]] });
  K.key('red', X(14) + 16, Z(75), 64);
  for (const [x, z] of [[X(13), Z(59)], [X(13), Z(91)]]) K.fixture(x, z + 16, 320, 160, 'x', 'lightamber', 300, [1, 0.7, 0.4]);
  K.brush([X(18), 128, Z(58)], [X(22), 136, Z(60)], { tex: 'metal' }); K.brush([X(18), 128, Z(91)], [X(22), 136, Z(93)], { tex: 'metal' });
  K.qoq(X(20), Z(59) + 4, 180, { turret: true, y: 136 }); K.qoq(X(20), Z(92) - 4, 0, { turret: true, y: 136 });
  K.qoqC(20, 70, 90); K.qoqC(20, 84, 90); K.qoqC(9, 62, 90); K.qoqC(9, 89, 90);
  K.wave('redkey', { onKey: 'red', msg: 'The oven crew comes for its keycard!' });
  for (const [c, r] of [[21, 66], [21, 88], [9, 60], [9, 90], [19, 77]]) K.qoqC(c, r, 90, { wave: 'redkey' });
  K.slices([[X(20), Z(62)], [X(20), Z(90)], [X(14), Z(70), 64]]); K.juice(X(21), Z(75)); K.juice(X(9), Z(88)); K.health(X(21), Z(80));
  K.ambient(X(8), 60, Z(75), 'fire', 700, 1);
  // secret: boarded-up flue closet in the south wall
  K.paint(10, 93, 14, 97, T({ ...OVEN, c: 120 })); K.breakable([X(10), 0, Z(93)], [X(15), 120, Z(94)], { tex: 'boards', health: 20, secret: true });
  K.health(X(11), Z(96)); K.juice(X(13), Z(96)); K.slice(X(12), Z(95));

  // ---------------- DISH PIT (blue key) ----------------
  K.paint(82, 71, 89, 75, T({ ...TUN, c: 144 }));
  K.room(90, 56, 108, 92, LEDGE, 'brick');
  K.paint(93, 59, 105, 89, T(PIT));
  K.stairs(97, 85, 101, 89, 'S', -64, 0, { ...PIT, side: 'stepside' });
  for (const r of [59]) K.brush([X(93), -64, Z(r)], [X(106), -60, Z(r) + 2], { tex: 'hazard', solid: false });
  K.pool(94, 60, 104, 66, PIT, 'sludge', 16, 8);
  K.pool(94, 80, 103, 84, PIT, 'water', 12, 0);
  // bridge across the pit and the blue-key tower with its lift
  K.catwalk(X(93), Z(69), X(106), Z(72), 8, { rails: 'ns', tex: 'grate', supports: [[X(96), Z(70) + 16], [X(103), Z(70) + 16]] });
  K.brush([X(97), -64, Z(72)], [X(102), 96, Z(76)], { tex: 'steel', top: 'diamond' });
  K.lift([X(98), -64, Z(76)], [X(101), -56, Z(79)], 152, { wait: 2 });
  K.key('blue', X(99) + 16, Z(74), 96);
  // dish racks
  for (const [c, r] of [[95, 77], [104, 77], [104, 86], [95, 86]]) { K.brush([X(c) - 4, -64, Z(r) - 4], [X(c) + 36, 20, Z(r) + 20], { tex: 'chrome', top: 'metal' }); }
  K.light(X(99), 40, Z(70), 380, [0.7, 0.85, 1]); K.light(X(99), 180, Z(74), 300, [0.6, 0.8, 1], 3);
  for (const r of [60, 75, 90]) { K.fixture(X(91), Z(r), 288, 120, 'z', 'lightblue', 260, [0.6, 0.8, 1]); K.fixture(X(107), Z(r), 288, 120, 'z', 'lightblue', 260, [0.6, 0.8, 1]); }
  K.emitter([X(93), -64, Z(59)], [X(106), 100, Z(90)], 'steam', 6); K.ambient(X(99), 0, Z(74), 'drip', 600, 1);
  K.qoqC(92, 60, 180); K.qoqC(107, 66, -90); K.qoqC(107, 84, -90); K.qoqC(99, 68, 180, { y: -64 }); K.qoqC(96, 82, 0);
  K.qoqC(107, 78, -90);
  K.wave('bluekey', { onKey: 'blue', msg: 'The dishwashers swarm the pit!' });
  for (const [c, r] of [[92, 58], [107, 58], [92, 91], [107, 91], [100, 87], [93, 78]]) K.qoqC(c, r, 0, { wave: 'bluekey' });
  K.slices([[X(91) + 8, Z(80)], [X(106), Z(62)], [X(99) + 16, Z(82), -64]]); K.juice(X(91), Z(90)); K.juice(X(107), Z(58)); K.juice(X(102), Z(87)); K.health(X(93) + 8, Z(70) + 16, 0); K.health(X(91), Z(58));

  // ---------------- MESS HALL (behind the red door) ----------------
  K.paint(53, 57, 58, 60, T({ ...TUN, c: 176 }));
  K.door(53, 61, 58, 61, PREP, { key: 'red', top: 136, name: 'reddoor' });
  K.room(28, 20, 83, 56, MESS, 'brick');
  K.paint(28, 20, 83, 24, T(GAL)); K.paint(79, 25, 83, 56, T(GAL));
  K.stairs(33, 25, 34, 35, 'N', 16, 160, { ...MESS, side: 'stepside', floor: 'concrete' });
  K.stairs(77, 45, 78, 55, 'N', 16, 160, { ...MESS, side: 'stepside', floor: 'concrete' }); K.paint(77, 25, 78, 44, T(GAL));
  for (const [a, b] of [[28, 33], [35, 77]]) K.brush([X(a), 160, Z(25) - 2], [X(b), 194, Z(25)], { tex: 'railing', fit: true, noshadow: true });
  K.brush([X(77) - 2, 160, Z(25)], [X(77), 194, Z(45)], { tex: 'railing', fit: true, noshadow: true });
  K.brush([X(79) - 2, 160, Z(46)], [X(79), 194, Z(57)], { tex: 'railing', fit: true, noshadow: true });
  for (let c = 38; c <= 70; c += 8) for (const r of [30, 38, 46]) {
    K.table(C(c), C(r), 180, 40, 34, 'wood', 'metal');
    K.props(pr => { for (let k = -2; k <= 2; k++) pr.chair(C(c) + k * 34, C(r) - 34, 0, 0); for (let k = -2; k <= 2; k++) pr.chair(C(c) + k * 34, C(r) + 34, 0, Math.PI); });
  }
  K.props(pr => { for (const [c, r] of [[38, 30], [54, 38], [70, 46], [46, 46], [62, 30]]) pr.pizza(C(c), 34, C(r), 30); });
  K.colonnade([[X(44), Z(34)], [X(44), Z(42)], [X(66), Z(34)], [X(66), Z(42)]], 30, 0, 320, 'brick', 'trim');
  K.sign(X(55), 260, Z(20), 'pz', 'sign_mess', 220, 50); K.poster(X(28), 100, Z(40), 'px', 'pot_heroes', 60, 100); K.poster(X(28), 100, Z(48), 'px', 'pot_right', 60, 100);
  K.tv(X(45), 200, Z(57), 'nz', 'tv_pizza', 90, 64);
  K.skylight(X(48), Z(38), 320, 0, 128, 128, 440); K.skylight(X(62), Z(38), 320, 0, 128, 128, 440);
  for (const c of [32, 55, 76]) K.lamp(X(c), 280, Z(22), 220); K.lamp(X(81), 280, Z(40), 220); K.lamp(X(29), 140, Z(52), 200);
  K.light(X(40), 120, Z(52), 300, [1, 0.75, 0.45]); K.light(X(70), 120, Z(52), 300, [1, 0.75, 0.45]);
  for (const c of [44, 66]) K.qoq(C(c), C(22), 180, { turret: true, y: 160 });
  K.qoqC(81, 30, -90, { y: 160 }); K.qoqC(81, 50, -90, { y: 160 }); K.qoqC(40, 52, 0); K.qoqC(70, 52, 0);
  K.wave('lunch', { min: [X(46), 0, Z(34)], max: [X(64), 120, Z(44)], lock: ['reddoor'], msg: 'LUNCH RUSH! The mess hall doors slam shut!', doneMsg: 'The rush is over.' });
  for (const [c, r] of [[30, 28], [30, 54], [74, 28], [74, 54], [38, 22], [72, 22], [55, 26], [81, 38]]) K.qoqC(c, r, 0, { wave: 'lunch', y: (r === 22 || c === 81) ? 160 : undefined, delay: (c + r) % 3 * 0.6 });
  K.slices([[X(30), Z(34)], [X(76), Z(34)], [X(55), Z(54)], [X(50), Z(22), 160], [X(80), Z(54), 160]]);
  K.juice(X(30), Z(42)); K.juice(X(76), Z(48)); K.juice(X(60), Z(22), 160); K.juice(X(82), Z(26), 160); K.health(X(29), Z(55)); K.health(X(82), Z(44), 160);
  K.ambient(X(55), 100, Z(38), 'hum', 900, 0.6);
  // secret: shoot the hidden switch above the doorway to open the cook's closet behind the north gallery
  K.button({ min: [X(55) - 8, 296, Z(56) + 26], max: [X(55) + 8, 312, Z(57)], shoot: true, target: 'cookcloset', msg: 'A panel slides open on the gallery!' });
  K.door(53, 19, 56, 19, GAL, { targeted: true, name: 'cookcloset', wait: -1, tex: 'brick', top: 104 }); K.paint(52, 15, 57, 18, T({ ...GAL, c: 264 }));
  K.secret([X(52), 160, Z(15)], [X(58), 260, Z(19)]); K.health(X(53), Z(16), 160); K.juice(X(55), Z(16), 160); K.juice(X(57), Z(17), 160, 80); K.slice(X(54), Z(17), 160);

  // ---------------- FREEZER MAZE (blue door, gold key) ----------------
  K.door(27, 38, 27, 41, MESS, { key: 'blue', top: 128, name: 'bluedoor' });
  K.room(4, 4, 26, 50, FRZ, 'steel');
  K.wall(4, 44, 21, 44, 'steel'); K.wall(9, 36, 26, 36, 'steel'); K.wall(4, 28, 21, 28, 'steel'); K.wall(9, 20, 26, 20, 'steel'); K.wall(4, 12, 21, 12, 'steel');
  K.wall(12, 37, 12, 40, 'steel'); K.wall(18, 29, 18, 32, 'steel'); K.wall(10, 21, 10, 24, 'steel'); K.wall(16, 13, 16, 16, 'steel');
  for (const [c, r] of [[6, 47], [20, 40], [8, 32], [22, 24], [6, 16], [14, 8]]) K.crates(C(c), C(r), 0, 2, 40, 'crate');
  for (const [c, r] of [[16, 47], [5, 40], [24, 32], [13, 24], [20, 16]]) K.pizzaBoxes(C(c), C(r), 0, 5);
  for (const r of [8, 16, 24, 32, 40, 47]) for (const c of [8, 18]) K.fixture(X(c), Z(r), 160, 96, 'x', 'lightblue', 220, [0.6, 0.8, 1]);
  K.emitter([X(4), 0, Z(4)], [X(27), 150, Z(51)], 'dust', 12); K.sign(X(15), 120, Z(51), 'nz', 'sign_cold', 180, 40);
  K.ambient(X(15), 80, Z(28), 'wind', 900, 0.7);
  K.brush([X(5), 0, Z(5)], [X(8), 32, Z(8)], { tex: 'chrome', top: 'metal' }); K.key('gold', X(6) + 16, Z(6) + 16, 32);
  K.light(X(6) + 16, 90, Z(6) + 16, 220, [1, 0.85, 0.3], 3);
  K.qoqC(8, 46, 90); K.qoqC(22, 40, -90); K.qoqC(6, 32, 90); K.qoqC(20, 24, -90); K.qoqC(8, 16, 90); K.qoqC(20, 8, 180);
  K.wave('gold', { onKey: 'gold', lock: ['bluedoor'], msg: 'The freezer locks down! Something thaws out in the aisles...', doneMsg: 'The freezer door thaws open.' });
  for (const [c, r] of [[24, 6], [24, 14], [5, 22], [24, 30], [5, 38], [24, 46], [14, 18]]) K.qoqC(c, r, 0, { wave: 'gold', delay: (r % 4) * 0.5 });
  K.slices([[X(25), Z(48)], [X(5), Z(42)], [X(25), Z(26)], [X(5), Z(18)]]); K.juice(X(25), Z(38)); K.juice(X(5), Z(30)); K.juice(X(25), Z(10)); K.health(X(5), Z(46)); K.health(X(12), Z(6));
  // secret: crates hide a teleporter at the end of the second aisle, up to the mess hall gallery
  K.paint(2, 30, 3, 31, T(FRZ)); K.tele([X(2), 0, Z(30)], [X(3), 100, Z(32)], [X(81) + 16, 160, Z(30)], 180);
  K.light(X(3), 50, Z(31), 160, [1, 0.6, 0.2], 1); K.secret([X(2), 0, Z(30)], [X(4), 100, Z(32)]);

  // ---------------- PANTRY (gold door, final rush, exit) ----------------
  K.door(84, 38, 84, 41, GAL, { key: 'gold', tex: 'door_gold', top: 112, name: 'golddoor' });
  K.room(85, 20, 108, 50, PAN, 'brickdark');
  K.paint(85, 36, 90, 43, T(PANL));
  K.stairs(91, 36, 100, 43, 'W', 16, 160, { ...PAN, side: 'stepside', floor: 'concrete' });
  K.brush([X(85), 160, Z(36)], [X(91), 194, Z(36) + 2], { tex: 'railing', fit: true, noshadow: true }); K.brush([X(85), 160, Z(44) - 2], [X(91), 194, Z(44)], { tex: 'railing', fit: true, noshadow: true });
  for (const r of [22, 28]) for (const [c0, c1] of [[86, 98], [100, 107]]) { K.brush([X(c0), 0, Z(r)], [X(c1), 140, Z(r) + 40], { tex: 'wood', pz: 'cabinet', nz: 'cabinet', top: 'wood' }); for (let c = c0 + 1; c < c1; c += 3) K.pizzaBoxes(C(c), Z(r) + 20, 140, 3); }
  for (const r of [46]) for (const [c0, c1] of [[86, 96], [100, 107]]) { K.brush([X(c0), 0, Z(r)], [X(c1), 120, Z(r) + 40], { tex: 'wood', pz: 'books', nz: 'cabinet', top: 'wood' }); }
  for (const [c, r] of [[103, 38], [104, 41], [88, 33], [96, 33]]) K.crates(C(c), C(r), 0, 2, 40);
  K.potatoes([[X(97), Z(33) + 10], [X(97) + 12, Z(33) + 4], [X(89), Z(34)]], 80);
  K.decal({ at: [X(109), 100, Z(38)], n: 'nx', w: 90, h: 120, tex: 'safe' }); K.sign(X(109), 190, Z(38), 'nx', 'sign_vault', 160, 40);
  for (const z of [Z(26), Z(34), Z(44)]) K.fixture(X(97), z, 288, 160, 'x', 'light', 300, [1, 0.95, 0.85], 2);
  K.light(X(104), 120, Z(32), 300, [1, 0.75, 0.45]);
  K.wave('pantry', { min: [X(92), 0, Z(33)], max: [X(106), 120, Z(45)], lock: ['golddoor'], msg: 'The pantry guards spring their trap!', doneMsg: 'The pantry is clear. The exit is open!', opens: ['exitgate'], stagger: 0.5 });
  for (const [c, r] of [[86, 26], [107, 26], [86, 34], [107, 34], [98, 21], [107, 44], [86, 44], [102, 50]]) K.qoqC(c, r, -90, { wave: 'pantry' });
  K.qoqC(95, 38, 90); K.qoqC(104, 34, -90);
  K.slices([[X(87), Z(38), 160], [X(102), Z(36)], [X(102), Z(44)]]); K.juice(X(88), Z(42), 160); K.juice(X(106), Z(38)); K.juice(X(92), Z(34)); K.health(X(106), Z(42)); K.health(X(86), Z(38), 160);
  K.door(109, 24, 109, 27, PAN, { targeted: true, name: 'exitgate', wait: -1, tex: 'door_red', top: 128 });
  K.room(110, 23, 110, 28, PAN, 'brickdark');
  K.exit(X(111), 0, Z(25) + 16, 'nx');

  K.goal(X(14) + 16, Z(75), 64); K.goal(X(99) + 16, Z(74), 96); K.goal(X(55), Z(42), 0, { wait: 14 }); K.goal(X(6) + 16, Z(6) + 16, 32, { wait: 12 }); K.goal(X(99), Z(40), 0, { wait: 14 });

  K.ruins({'seed': 3205, 'mode': 'bunker', 'theme': 'bunker', 'big': 28, 'lights': 30});
});
