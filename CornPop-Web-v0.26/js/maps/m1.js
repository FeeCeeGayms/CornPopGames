// E1M1 — DELIVERY ENTRANCE. A Doom II-style opener: a tan tech lobby, a computer hall with windows onto a walled
// outdoor courtyard (nukage pond, rampart with the blue key, lift), a crate store, a stair climb to the upper
// gallery and the exit yard. You start with only the pizza cutter; the soaker waits in the first hallway.
import { makeLevel } from '../kit.js';

export default makeLevel({
  name: 'E1M1', title: 'E1M1: DELIVERY ENTRANCE', ambience: 'street', ambient: 18, music: 'assets/music/rotted_circuitry.mp3',
  fog: { color: [0.05, 0.05, 0.07], density: 0.00028 }, skyTint: [0.8, 0.55, 0.45],
  styles: [{ color: [1, 1, 0.95], pattern: 'fluoro' }, { color: [0.3, 1, 0.4], pattern: 'pulse' }, { color: [1, 0.55, 0.2], pattern: 'candle' }, { color: [1, 0.2, 0.1], pattern: 'neon' }],
}, 82, 72, 'techtan', K => {
  const { X, Z, C } = K; const T = s => K.type(s);
  const LOBBY = { f: 0, c: 128, floor: 'techfloor', ceil: 'ceil', side: 'stepside', upper: 'techtan' };
  const HALLW = { f: 0, c: 128, floor: 'techfloor', ceil: 'ceil', side: 'stepside', upper: 'techtan' };
  const COMP = { f: -16, c: 176, floor: 'techfloor', ceil: 'ceil', side: 'stepside', upper: 'techgray' };
  const DAIS = { f: 0, c: 176, floor: 'metal', ceil: 'ceil', side: 'support', upper: 'techgray' };
  const STORE = { f: 0, c: 256, floor: 'concrete', ceil: 'steeldark', side: 'stepside', upper: 'rustpanel' };
  const GALL = { f: 112, c: 240, floor: 'techfloor', ceil: 'ceil', side: 'stepside', upper: 'techgray' };
  const YARD = K.skySpec(-32, 256, 'dirt', 'mossstone', 'mossstone');
  const RAMP = K.skySpec(96, 128, 'graystone', 'graystone', 'graystone');
  const EXITY = K.skySpec(112, 192, 'graystone', 'stepside', 'graystone');

  // ======================= START LOBBY =======================
  K.room(34, 60, 45, 68, LOBBY, 'techtan');
  K.start(40, 66, 0);
  K.paint(33, 62, 33, 66, T({ ...LOBBY, f: 16, c: 96, floor: 'metal' })); K.paint(46, 62, 46, 66, T({ ...LOBBY, f: 16, c: 96, floor: 'metal' })); // computer niches
  K.brush([X(33), 16, Z(62)], [X(33) + 12, 96, Z(67)], { tex: 'computer', solid: true }); K.brush([X(47) - 12, 16, Z(62)], [X(47), 96, Z(67)], { tex: 'computer', solid: true });
  K.fixture(X(40), Z(62), 128, 128, 'x', 'light', 230, [1, 1, 0.95], 1); K.fixture(X(40), Z(67), 128, 128, 'x', 'light', 200);
  K.light(X(34) + 20, 60, Z(64) + 16, 160, [0.4, 1, 0.5], 2); K.light(X(46) - 20, 60, Z(64) + 16, 160, [0.4, 1, 0.5], 2);
  K.health(X(35) + 8, Z(68)); K.slices([[X(44) + 16, Z(68)], [X(35) + 16, Z(60) + 8]]);
  K.msg([X(36), 0, Z(63)], [X(44), 100, Z(68)], 'Only your trusty PIZZA CUTTER...\nHold FIRE to slice. Find a real weapon!');
  K.door(38, 59, 41, 59, LOBBY, { top: 128 });

  // ======================= FIRST HALLWAY (soaker alcove) =======================
  K.paint(38, 48, 41, 58, T(HALLW));
  K.paint(35, 51, 37, 54, T({ ...HALLW, f: 8, c: 104, floor: 'metal', side: 'support' }));
  K.item('soaker', X(36), Z(52) + 16);
  K.light(X(36), 70, Z(53), 220, [1, 0.85, 0.4], 3); K.strip(X(40), Z(49), X(40), Z(57), 128, 260, [1, 0.95, 0.85], 220);
  K.paint(42, 49, 43, 50, T({ ...HALLW, c: 112 })); K.paint(42, 55, 43, 56, T({ ...HALLW, c: 112 })); // side nooks
  K.qoqC(43, 49, 90); K.qoqC(42, 56, 90);
  K.juice(X(42) + 16, Z(55) + 16); K.slice(X(40), Z(53));
  K.door(38, 47, 41, 47, HALLW, { top: 128 });

  // ======================= COMPUTER HALL =======================
  K.octo(30, 30, 50, 46, COMP, 3, 'techgray');
  K.paint(37, 35, 43, 41, T(DAIS));
  for (const [c, r] of [[38, 36], [42, 36], [38, 40], [42, 40]]) K.brush([X(c), 0, Z(r)], [X(c) + 32, 64, Z(r) + 32], { tex: 'computer', top: 'metal' });
  K.brush([X(39) + 16, 0, Z(37) + 16], [X(42) - 16, 40, Z(40) - 16], { tex: 'support', top: 'diamond' });
  K.props(pr => pr.pizza(X(40) + 16, 40, Z(38) + 16, 30));
  for (const [x, z] of [[X(34), Z(34)], [X(46) + 32, Z(34)], [X(34), Z(42) + 32], [X(46) + 32, Z(42) + 32]]) K.column(x, z, 32, -16, 176, 'support', 'trim');
  K.fixture(X(40) + 16, Z(33), 176, 200, 'x', 'light', 360); K.fixture(X(40) + 16, Z(44), 176, 200, 'x', 'light', 360);
  K.light(X(40) + 16, 120, Z(38) + 16, 260, [0.4, 1, 0.5], 2);
  K.qoqC(33, 38, -90); K.qoqC(47, 36, 90); K.qoqC(44, 44, 0); K.qoqC(36, 32, 180); K.qoq(X(40) + 16, Z(35) + 16, 180, { turret: true, y: 0 });
  K.slices([[X(32), Z(44)], [X(48), Z(44)], [X(48), Z(32)]]); K.juice(X(32) + 8, Z(32) + 8); K.health(X(48), Z(38));
  // windows onto the courtyard
  K.window(29, 33, 29, 37, 24, 112, 'stepside', 'techgray', 'metal', 'metal');
  K.door(29, 40, 29, 42, COMP, { top: 128 });

  // ======================= COURTYARD (outside) =======================
  K.room(4, 10, 27, 60, YARD, 'mossstone');
  K.paint(4, 10, 27, 15, T(RAMP));                                             // the rampart along the north wall
  K.paint(28, 40, 28, 42, T({ ...YARD, c: -32 + 160 }));                       // step out of the hall door
  K.liftCells(24, 16, 26, 18, -32, 96);
  K.brush([X(23) + 24, -32, Z(16)], [X(24), 96, Z(19)], { tex: 'support' }); K.brush([X(27), -32, Z(16)], [X(27) + 8, 96, Z(19)], { tex: 'support' });
  K.key('blue', X(6) + 16, Z(12) + 16, 96);
  K.qoq(X(12), Z(12) + 16, 180, { turret: true, y: 96 }); K.qoq(X(20), Z(13), 180, { turret: true, y: 96 });
  K.slices([[X(16), Z(12), 96], [X(10), Z(14), 96]]); K.health(X(26), Z(11) + 16, 96);
  // planter with a dead tree in the middle of the yard
  K.paint(15, 31, 19, 35, T({ ...YARD, f: -8, floor: 'grass' }));
  K.props(pr => { pr.cylinder(X(17) + 16, -8, Z(33) + 16, 9, 120, 'bark', { segs: 8, rTop: 5 }); pr.cylinder(X(17) + 16, 80, Z(33) + 16, 4, 60, 'bark', { rz: 0.8, segs: 6 }); pr.cylinder(X(17) + 16, 96, Z(33) + 16, 3, 50, 'bark', { rz: -0.9, segs: 6 }); });
  K.brush([X(17) + 6, -8, Z(33) + 6], [X(18) - 6, 110, Z(34) - 6], { invisible: true, noshadow: true });
  // nukage pond with an island
  K.nukage(7, 43, 16, 53, YARD); K.paint(11, 47, 12, 49, T(YARD));
  K.juice(X(11) + 16, Z(48)); K.slice(X(12), Z(49));
  K.qoqC(10, 30, 90); K.qoqC(22, 26, 180); K.qoqC(20, 50, 0); K.qoqC(6, 38, 90); K.qoqC(24, 56, 0);
  K.slices([[X(6), Z(58)], [X(26), Z(36)], [X(14), Z(24)]]); K.juice(X(26), Z(58)); K.health(X(5), Z(24));
  for (const [x, z] of [[X(10), Z(30)], [X(22), Z(46)], [X(10), Z(56)]]) K.light(x, 200, z, 760, [0.75, 0.72, 0.8]);
  K.light(X(15), 160, Z(12), 520, [0.75, 0.72, 0.8]);
  K.ambient(X(16), 60, Z(36), 'wind', 1200, 0.6);
  K.barrel(X(25), Z(28), 14, 34, 'hazard'); K.barrel(X(26), Z(29) + 8, 14, 34, 'hazard'); K.barrel(X(5) + 8, Z(52), 14, 34, 'hazard');
  // secret: a loose stone panel in the west wall
  const NOOK = { f: -32, c: 64, floor: 'graystone', ceil: 'graystone', side: 'graystone', upper: 'mossstone' };
  K.paint(1, 34, 2, 38, T(NOOK));
  K.door(3, 35, 3, 37, NOOK, { tex: 'mossstone', wait: -1 });
  K.secret([X(1), -32, Z(34)], [X(3), 64, Z(39)]); K.health(X(1) + 16, Z(35)); K.health(X(1) + 16, Z(37)); K.slice(X(2), Z(36));
  K.wave('bluekey', { onKey: 'blue', msg: 'Something stirs in the courtyard...' });
  for (const [c, r] of [[8, 22], [22, 22], [14, 40], [24, 34]]) K.qoqC(c, r, 0, { wave: 'bluekey' });

  // ======================= CRATE STORE (east) =======================
  K.paint(52, 37, 60, 39, T({ ...HALLW, c: 128 })); K.door(51, 37, 51, 39, COMP, { top: 120 });
  K.room(61, 26, 76, 48, STORE, 'rustpanel');
  for (const [c, r, n] of [[63, 29, 2], [66, 29, 1], [70, 28, 3], [74, 31, 2], [64, 35, 1], [68, 34, 2], [72, 38, 1], [63, 42, 3], [67, 44, 1], [71, 44, 2], [75, 45, 1], [65, 39, 2]]) K.crates(C(c), C(r), 0, n, 56);
  K.qoq(C(70), C(28), 180, { turret: true, y: 168 }); K.qoq(C(63), C(42), 0, { turret: true, y: 168 });
  K.qoqC(66, 32, 180); K.qoqC(73, 41, 90); K.qoqC(62, 47, 0); K.qoqC(69, 37, 0);
  K.fixture(X(68), Z(31), 192, 160, 'x', 'light', 380); K.fixture(X(68), Z(43), 192, 160, 'x', 'light', 380);
  K.slices([[X(65), Z(32), 56], [X(74), Z(27)], [X(62), Z(37)]]); K.juice(X(76), Z(47)); K.juice(X(68), Z(48)); K.health(X(76), Z(27));
  K.item('sausages', X(71) + 16, Z(32) + 16);
  // secret closet behind loose boards (the shotgun)
  K.paint(77, 30, 77, 32, T({ ...STORE, c: 112 })); K.paint(78, 29, 80, 33, T({ ...STORE, c: 112, floor: 'tilebrown' }));
  K.breakable([X(77), 0, Z(30)], [X(78), 112, Z(33)], { tex: 'boards', health: 24, secret: true });
  K.item('shotgun', X(79), Z(31) + 16); K.item('sausages', X(79), Z(30)); K.light(X(79), 70, Z(31) + 16, 200, [1, 0.6, 0.3], 3);
  K.msg([X(73), 0, Z(29)], [X(77), 100, Z(34)], 'These boards look loose... and it smells like sausages.');

  // ======================= STAIRS & UPPER GALLERY =======================
  K.door(38, 29, 41, 29, COMP, { top: 128 });
  K.stairs(38, 20, 41, 28, 'N', 0, 112, { floor: 'techfloor', ceil: 'ceil', side: 'stepside', upper: 'techgray', c: -9999, head: 144 });
  K.light(X(40), 120, Z(24), 260, [1, 0.95, 0.85]);
  K.room(30, 10, 50, 19, GALL, 'techgray');
  K.window(28, 11, 29, 14, 144, 208, 'graystone', 'graystone', 'graystone', 'graystone');   // looks down onto the rampart
  for (const c of [33, 40, 47]) K.fixture(X(c), Z(14) + 16, 240, 128, 'z', 'light', 340);
  for (const [c, r] of [[33, 12], [47, 12], [33, 18], [47, 18]]) K.crates(C(c), C(r), 112, 1, 44);
  K.qoqC(35, 15, 180); K.qoqC(45, 15, 180); K.qoqC(40, 11, 180);
  K.slices([[X(31), Z(11), 112], [X(49), Z(11), 112]]); K.juice(X(49), Z(18), 112); K.health(X(31), Z(18), 112);
  K.sign(X(40), 200, Z(10), 'pz', 'sign_exit', 96, 24);

  // ======================= EXIT YARD (blue door) =======================
  K.door(38, 9, 41, 9, GALL, { key: 'blue', top: 128 });
  K.room(32, 2, 48, 8, EXITY, 'graystone');
  K.wave('exityard', { min: [X(36), 100, Z(6)], max: [X(44), 220, Z(9)], msg: 'Ambush!' });
  for (const [c, r] of [[33, 4], [47, 4], [34, 7], [46, 7]]) K.qoqC(c, r, 0, { wave: 'exityard' });
  K.light(X(40), 260, Z(5), 600, [0.8, 0.75, 0.75]);
  K.exit(X(40), 112, Z(2), 'pz');

  K.goal(X(6) + 16, Z(12) + 16, 96);
});
