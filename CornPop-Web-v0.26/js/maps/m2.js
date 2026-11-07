// E1M2 — SAUCE UNDERHALLS. Doom II "Underhalls" style: a sewer ring with a grease-sludge canal wrapped around a
// central pump block. Walkways on both banks, bridges across, an outdoor settling yard (blue key) up north,
// cramped filter rooms (red key) out east, and the pump hall with a lift to the exit control room.
import { makeLevel } from '../kit.js';

export default makeLevel({
  name: 'E1M2', title: 'E1M2: SAUCE UNDERHALLS', ambience: 'cave', ambient: 14, music: 'assets/music/cornquake_e1m2.mp3',
  fog: { color: [0.03, 0.045, 0.03], density: 0.0004 }, skyTint: [0.5, 0.65, 0.5],
  styles: [{ color: [1, 1, 0.95], pattern: 'fluoro' }, { color: [0.4, 1, 0.3], pattern: 'pulse' }, { color: [1, 0.55, 0.2], pattern: 'candle' }, { color: [1, 0.2, 0.1], pattern: 'neon' }],
}, 96, 90, 'slimewall', K => {
  const { X, Z, C } = K; const T = s => K.type(s);
  const SHAFT = { f: 0, c: 160, floor: 'grate', ceil: 'steeldark', side: 'stepside', upper: 'rustpanel' };
  const TUN = { f: 0, c: 128, floor: 'concretedark', ceil: 'concretedark', side: 'stepside', upper: 'slimewall' };
  const RING = { f: 0, c: 176, floor: 'grate', ceil: 'concretedark', side: 'stepside', upper: 'slimewall' };
  const HALL = { f: 16, c: 224, floor: 'techfloor', ceil: 'ceil', side: 'stepside', upper: 'techgray' };
  const CTRL = { f: 112, c: 224, floor: 'diamond', ceil: 'ceil', side: 'support', upper: 'techgray' };
  const FILT = { f: 0, c: 128, floor: 'tile', ceil: 'ceil', side: 'stepside', upper: 'techgreen' };
  const YARD = K.skySpec(0, 256, 'concrete', 'graystone', 'graystone');

  // ======================= MANHOLE SHAFT (start) =======================
  K.room(4, 72, 13, 81, SHAFT, 'rustpanel');
  K.start(8, 78, 0);
  K.item('shotgun', X(8) + 16, Z(75)); K.item('sausages', X(11), Z(80)); K.item('sausages', X(5), Z(80));
  K.msg([X(5), 0, Z(73)], [X(13), 100, Z(78)], 'The SAUSAGE SHOTGUN! Two barrels of hot meat.');
  K.props(pr => { pr.cylinder(X(5) + 16, 0, Z(73) + 16, 14, 160, 'rust', { segs: 12 }); pr.cylinder(X(12) + 16, 0, Z(73) + 16, 14, 160, 'rust', { segs: 12 }); });
  K.brush([X(5), 0, Z(73)], [X(6), 160, Z(74)], { invisible: true, noshadow: true }); K.brush([X(12), 0, Z(73)], [X(13), 160, Z(74)], { invisible: true, noshadow: true });
  K.fixture(X(9), Z(77), 160, 128, 'x', 'light', 300); K.health(X(5), Z(77)); K.slice(X(12), Z(77));
  K.door(7, 71, 10, 71, SHAFT, { top: 128 });

  // ======================= ACCESS TUNNEL =======================
  K.paint(7, 57, 10, 70, T(TUN)); K.paint(11, 57, 14, 59, T(TUN));
  K.paint(5, 62, 6, 65, T({ ...TUN, f: 8, c: 104 })); K.juice(X(5) + 16, Z(63) + 16);
  K.strip(X(9), Z(60), X(9), Z(69), 128, 240, [0.85, 1, 0.8], 240);
  K.qoqC(8, 64, 180); K.qoqC(10, 58, 90); K.slices([[X(9), Z(67)], [X(13), Z(58)]]);
  K.door(15, 57, 15, 59, TUN, { top: 120 });

  // ======================= THE SEWER RING =======================
  K.room(16, 18, 79, 70, RING, 'slimewall');
  K.wall(28, 30, 67, 58, 'techgray');                                           // the pump block
  K.nukage(18, 20, 25, 68, RING, 24, 7); K.nukage(70, 20, 77, 68, RING, 24, 7);  // west / east canals
  K.nukage(26, 20, 69, 27, RING, 24, 7); K.nukage(26, 61, 69, 68, RING, 24, 7);  // north / south canals
  // bridges (outer bank -> inner bank)
  K.paint(18, 43, 25, 45, T({ ...RING, floor: 'diamond' })); K.paint(56, 20, 58, 27, T({ ...RING, floor: 'diamond' }));
  K.paint(70, 34, 77, 36, T({ ...RING, floor: 'diamond' })); K.paint(38, 61, 40, 68, T({ ...RING, floor: 'diamond' }));
  for (const [x0, z0, x1, z1] of [[X(18), Z(43), X(26), Z(43) + 2], [X(18), Z(46) - 2, X(26), Z(46)], [X(70), Z(34), X(78), Z(34) + 2], [X(70), Z(37) - 2, X(78), Z(37)], [X(56), Z(20), X(56) + 2, Z(28)], [X(59) - 2, Z(20), X(59), Z(28)], [X(38), Z(61), X(38) + 2, Z(69)], [X(41) - 2, Z(61), X(41), Z(69)]])
    K.brush([x0, 0, z0], [x1, 34, z1], { tex: 'railing', fit: true, noshadow: true });
  // windows from the inner bank into the pump hall
  K.window(28, 44, 31, 46, 48, 120, 'techgray', 'techgray'); K.window(64, 38, 67, 40, 48, 120, 'techgray', 'techgray');
  // lights along the banks
  for (let c = 22; c <= 74; c += 13) { K.fixture(X(c), Z(19), 176, 96, 'x', 'lightamber', 220, [1, 0.75, 0.4]); K.fixture(X(c), Z(70) + 16, 176, 96, 'x', 'lightamber', 220, [1, 0.75, 0.4]); }
  for (let r = 24; r <= 66; r += 14) { K.fixture(X(16) + 16, Z(r), 176, 96, 'z', 'lightamber', 220, [1, 0.75, 0.4]); K.fixture(X(79) + 16, Z(r), 176, 96, 'z', 'lightamber', 220, [1, 0.75, 0.4]); }
  for (const [x, z] of [[X(27), Z(29)], [X(68), Z(29)], [X(27), Z(59)], [X(68), Z(59)]]) K.lamp(x, 120, z, 200, [0.5, 1, 0.4], 2);
  K.ambient(X(48), 20, Z(44), 'drip', 2400, 0.7);
  for (const [x, z] of [[X(22), Z(30)], [X(74), Z(56)], [X(40), Z(24)], [X(60), Z(64)]]) K.emitter([x - 40, 120, z - 40], [x + 40, 176, z + 40], 'drip', 2);
  // monsters on both banks
  K.qoqC(17, 30, 180); K.qoqC(17, 52, 0); K.qoqC(27, 40, 90); K.qoqC(30, 19, -90); K.qoqC(50, 18, -90); K.qoqC(64, 29, 90);
  K.qoqC(78, 26, 180); K.qoqC(78, 50, 0); K.qoqC(68, 48, -90); K.qoqC(60, 70, 90); K.qoqC(30, 70, -90); K.qoqC(45, 59, 0);
  K.qoq(X(79), Z(69), 0, { turret: true }); K.qoq(X(16) + 16, Z(18) + 16, 0, { turret: true });
  K.slices([[X(16) + 16, Z(40)], [X(27), Z(50)], [X(40), Z(18) + 16], [X(66), Z(28) + 16], [X(79), Z(40)], [X(52), Z(70)], [X(27), Z(33)]]);
  K.juice(X(17), Z(66)); K.juice(X(78), Z(20)); K.juice(X(48), Z(29)); K.health(X(68), Z(64)); K.health(X(16) + 16, Z(24)); K.item('sausages', X(69), Z(42));
  K.wave('redkey', { onKey: 'red', msg: 'The sewers gurgle... company is coming!' });
  for (const [c, r] of [[17, 46], [27, 36], [44, 29], [68, 52], [50, 59], [79, 30]]) K.qoqC(c, r, 0, { wave: 'redkey' });

  // ======================= SETTLING YARD (outdoor, blue key) =======================
  K.door(46, 17, 49, 17, RING, { top: 128 }); K.paint(46, 16, 49, 16, T({ ...RING, c: 128 }));
  K.room(36, 3, 60, 15, YARD, 'graystone');
  K.paint(36, 3, 60, 4, T(K.skySpec(64, 192, 'graystone', 'graystone', 'graystone')));           // north ledge
  K.nukage(39, 6, 45, 12, YARD, 24, 7); K.nukage(51, 6, 57, 12, YARD, 24, 7);
  K.paint(53, 8, 55, 10, T({ ...YARD, f: 8, floor: 'diamond', side: 'support' }));
  K.key('blue', X(54) + 16, Z(9) + 16, 8);
  K.qoq(X(40), Z(3) + 16, 180, { turret: true, y: 64 }); K.qoq(X(56), Z(3) + 16, 180, { turret: true, y: 64 });
  K.qoqC(48, 8, 180); K.qoqC(38, 14, 90); K.qoqC(59, 14, -90);
  K.slices([[X(42) + 16, Z(14)], [X(48), Z(5) + 16], [X(37), Z(6)]]); K.juice(X(59), Z(6)); K.health(X(48), Z(12));
  for (const x of [X(42), X(54)]) K.light(x, 200, Z(9), 720, [0.75, 0.85, 0.75]);
  K.ambient(X(48), 60, Z(9), 'wind', 900, 0.5);
  // secret nook behind boards
  K.paint(32, 8, 34, 12, T({ ...TUN, c: 112 })); K.paint(35, 9, 35, 11, T({ ...TUN, c: 112 }));
  K.breakable([X(35), 0, Z(9)], [X(36), 112, Z(12)], { tex: 'boards', health: 24, secret: true });
  K.health(X(33), Z(9)); K.health(X(33), Z(11)); K.item('sausages', X(32) + 16, Z(10) + 16); K.slice(X(34), Z(12));

  // ======================= FILTER ROOMS (east, blue door, red key) =======================
  K.door(80, 40, 81, 42, RING, { key: 'blue', top: 128 });
  K.paint(82, 30, 85, 52, T(FILT));
  K.room(87, 46, 93, 52, FILT, 'techgreen'); K.door(86, 48, 86, 50, FILT, { top: 112 });
  K.room(87, 37, 93, 43, FILT, 'techgreen'); K.door(86, 39, 86, 41, FILT, { top: 112 });
  K.room(87, 28, 93, 34, { ...FILT, c: 160 }, 'techgreen'); K.door(86, 30, 86, 32, FILT, { top: 112 });
  for (const [c, r] of [[89, 48], [91, 48], [89, 51], [91, 51]]) K.props((pr, ctx) => { pr.cylinder(C(c), 0, C(r), 13, 96, 'chrome', { segs: 12 }); ctx.brush([X(c) + 4, 0, Z(r) + 4], [X(c + 1) - 4, 96, Z(r + 1) - 4], { invisible: true, noshadow: true }); });
  K.nukage(88, 38, 92, 42, FILT, 16, 7);
  K.key('red', X(90) + 16, Z(30) + 16); K.light(X(90) + 16, 100, Z(31), 260, [1, 0.3, 0.2]);
  for (const r of [33, 41, 49]) K.fixture(X(83) + 16, Z(r), 128, 96, 'z', 'light', 240);
  K.light(X(90), 100, Z(49), 220, [0.4, 1, 0.5], 2); K.light(X(90), 100, Z(40), 220, [0.4, 1, 0.5], 2);
  K.qoqC(84, 45, 0); K.qoqC(83, 33, 180); K.qoqC(90, 46, 180); K.qoqC(92, 37, -90); K.qoqC(88, 29, 90); K.qoqC(92, 33, 0);
  K.slices([[X(84), Z(51)], [X(92), Z(43)], [X(88), Z(33)]]); K.juice(X(82) + 16, Z(30) + 16); K.health(X(92), Z(52)); K.item('sausages', X(88), Z(52));
  // secret door in the ring's east wall
  const CLOS = { f: 0, c: 112, floor: 'tilebrown', ceil: 'concretedark', side: 'stepside', upper: 'slimewall' };
  K.paint(81, 59, 84, 63, T(CLOS)); K.door(80, 60, 80, 62, CLOS, { tex: 'slimewall', wait: -1 });
  K.secret([X(81), 0, Z(59)], [X(85), 100, Z(64)]); K.health(X(83), Z(60)); K.juice(X(83), Z(62)); K.slices([[X(82), Z(63)], [X(84), Z(59) + 16]]);
  K.light(X(83), 70, Z(61), 160, [1, 0.6, 0.3], 3);

  // ======================= PUMP HALL (red door) & EXIT =======================
  K.door(46, 58, 49, 58, RING, { key: 'red', top: 128 });
  K.paint(46, 55, 49, 57, T({ ...HALL, c: 144 }));
  K.room(32, 34, 63, 54, HALL);
  K.paint(42, 34, 53, 37, T(CTRL));
  K.liftCells(46, 38, 49, 40, 16, 112);
  K.brush([X(42), 112, Z(38) - 2], [X(46), 146, Z(38)], { tex: 'railing', fit: true, noshadow: true }); K.brush([X(50), 112, Z(38) - 2], [X(54), 146, Z(38)], { tex: 'railing', fit: true, noshadow: true });
  K.brush([X(41) + 28, 16, Z(34)], [X(42), 112, Z(38)], { tex: 'support' }); K.brush([X(54), 16, Z(34)], [X(54) + 4, 112, Z(38)], { tex: 'support' });
  K.exit(X(48), 112, Z(34), 'pz');
  // the pumps
  for (const [c, r] of [[36, 40], [36, 48], [59, 40], [59, 48]]) K.props((pr, ctx) => { pr.cylinder(C(c), 16, C(r), 40, 150, 'rust', { segs: 16 }); pr.cylinder(C(c), 166, C(r), 22, 58, 'pipes', { segs: 12 }); ctx.brush([X(c) - 24, 16, Z(r) - 24], [X(c) + 56, 166, Z(r) + 56], { invisible: true, noshadow: true }); ctx.light(C(c), 120, C(r) + (r < 44 ? 60 : -60), 200, [0.5, 1, 0.4], 2); });
  K.props(pr => { pr.pipe(C(36), 200, C(40), C(59), 200, C(40), 6, 'rust'); pr.pipe(C(36), 200, C(48), C(59), 200, C(48), 6, 'rust'); });
  K.nukage(44, 43, 51, 50, HALL, 16, 7);
  K.fixture(X(40), Z(44), 224, 160, 'z', 'light', 360); K.fixture(X(56), Z(44), 224, 160, 'z', 'light', 360); K.light(X(48), 180, Z(36), 300, [1, 0.9, 0.8]);
  K.qoq(X(44), Z(35) + 16, 180, { turret: true, y: 112 }); K.qoq(X(52), Z(35) + 16, 180, { turret: true, y: 112 });
  K.qoqC(34, 36, 90); K.qoqC(62, 36, -90); K.qoqC(34, 52, 90); K.qoqC(62, 52, -90); K.qoqC(41, 44, 0); K.qoqC(55, 44, 0);
  K.slices([[X(33), Z(44)], [X(62), Z(44)], [X(48), Z(53)]]); K.juice(X(40), Z(53)); K.juice(X(56), Z(53)); K.health(X(33), Z(35)); K.health(X(62), Z(35));
  K.wave('pumps', { min: [X(44), 0, Z(52)], max: [X(52), 120, Z(55)], msg: 'The pumps shudder to life!' });
  for (const [c, r] of [[38, 44], [58, 44], [44, 36], [52, 36]]) K.qoqC(c, r, 180, { wave: 'pumps', delay: 0.5 });

  K.goal(X(54) + 16, Z(9) + 16, 8); K.goal(X(90) + 16, Z(30) + 16, 0);
});
