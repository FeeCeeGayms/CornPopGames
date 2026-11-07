// E1M5 — GREASE TUNNELS. Doom II "Waste Tunnels" style: walkways either side of grease-sludge channels, an open
// sludge basin under the sky with an island tower (lift up to the blue key), the pump machinery hall with a chain
// of lifts up to the red key, and the outflow yard with the exit.
import { makeLevel } from '../kit.js';

export default makeLevel({
  name: 'E1M5', title: 'E1M5: GREASE TUNNELS', ambience: 'cave', ambient: 16, music: 'assets/music/e1m5.mp3',
  fog: { color: [0.03, 0.05, 0.03], density: 0.00035 }, skyTint: [0.55, 0.75, 0.45],
  styles: [{ color: [1, 1, 0.95], pattern: 'fluoro' }, { color: [0.4, 1, 0.3], pattern: 'pulse' }, { color: [1, 0.55, 0.2], pattern: 'candle' }, { color: [1, 0.2, 0.1], pattern: 'neon' }],
}, 112, 86, 'slimewall', K => {
  const { X, Z, C } = K; const T = s => K.type(s);
  const STAT = { f: 0, c: 160, floor: 'techfloor', ceil: 'ceil', side: 'stepside', upper: 'techgreen' };
  const TUN = { f: 0, c: 144, floor: 'grate', ceil: 'concretedark', side: 'stepside', upper: 'slimewall' };
  const SHAFT = { f: 0, c: 256, floor: 'grate', ceil: 'steeldark', side: 'stepside', upper: 'rustpanel' };
  const BASIN = K.skySpec(0, 320, 'mossstone', 'mossstone', 'mossstone');
  const MACH = { f: 0, c: 320, floor: 'techfloor', ceil: 'steeldark', side: 'stepside', upper: 'techgray' };
  const MID = { f: 80, c: 320, floor: 'grate', ceil: 'steeldark', side: 'support', upper: 'techgray' };
  const BAL = { f: 160, c: 320, floor: 'diamond', ceil: 'steeldark', side: 'support', upper: 'techgray' };
  const OUT = K.skySpec(-32, 288, 'concrete', 'graystone', 'graystone');

  // ======================= PUMPING STATION (start) =======================
  K.room(4, 62, 15, 79, STAT, 'techgreen');
  K.start(8, 76, 0);
  for (const r of [64, 70, 76]) K.fixture(X(10), Z(r), 160, 128, 'x', 'light', 260);
  for (const [c, r] of [[5, 63], [14, 63]]) K.props((pr, ctx) => { pr.cylinder(C(c), 0, C(r), 14, 120, 'chrome', { segs: 12 }); ctx.brush([X(c) + 2, 0, Z(r) + 2], [X(c + 1) - 2, 120, Z(r + 1) - 2], { invisible: true, noshadow: true }); });
  K.desk(X(5), Z(70), X(7), Z(74), 'px'); K.health(X(14), Z(78)); K.juice(X(5), Z(78)); K.slice(X(10), Z(66));
  K.qoqC(13, 66, 180);
  K.door(16, 68, 16, 73, STAT, { top: 128 });

  // ======================= TUNNEL A (west-east) =======================
  K.paint(17, 68, 82, 73, T(TUN)); K.nukage(17, 70, 78, 71, TUN, 16, 7);
  for (const c of [30, 46]) { K.paint(c, 70, c + 1, 71, T({ ...TUN, floor: 'diamond' })); }
  for (let c = 22; c <= 78; c += 12) K.fixture(X(c), Z(68) + 8, 144, 96, 'x', 'lightamber', 200, [1, 0.8, 0.5]);
  K.qoqC(24, 68, -90); K.qoqC(38, 73, -90); K.qoqC(52, 68, -90); K.qoqC(72, 73, -90); K.qoqC(76, 68, -90);
  K.slices([[X(20), Z(73)], [X(36), Z(68)], [X(56), Z(73)]]); K.juice(X(44), Z(73)); K.health(X(28), Z(68));
  K.emitter([X(17), 100, Z(68)], [X(82), 144, Z(74)], 'drip', 4);
  // secret: a slime-wall door on the south side
  const NOOK = { f: 0, c: 96, floor: 'tilebrown', ceil: 'concretedark', side: 'stepside', upper: 'slimewall' };
  K.paint(40, 75, 44, 78, T(NOOK)); K.door(41, 74, 43, 74, NOOK, { tex: 'slimewall', wait: -1 });
  K.secret([X(40), 0, Z(75)], [X(45), 90, Z(79)]); K.health(X(41), Z(77)); K.health(X(43), Z(77)); K.juice(X(42), Z(76)); K.light(X(42), 60, Z(77), 160, [1, 0.6, 0.3], 3);

  // ======================= THE SHAFT & TUNNEL B (north to the basin) =======================
  K.room(61, 62, 66, 67, SHAFT); K.paint(61, 74, 66, 79, T(SHAFT));
  K.paint(62, 51, 65, 61, T(TUN));
  K.props(pr => { pr.pipe(C(61), 0, C(77), C(61), 256, C(77), 10, 'rust'); pr.pipe(C(66), 0, C(77), C(66), 256, C(77), 10, 'rust'); });
  K.light(X(64), 200, Z(65), 280, [0.6, 1, 0.5], 2); K.light(X(64), 120, Z(77), 240, [1, 0.8, 0.5]);
  K.qoqC(62, 77, 0); K.qoqC(64, 56, 180); K.juice(X(65), Z(78)); K.slice(X(62), Z(64)); K.slice(X(64), Z(53));
  K.strip(X(64), Z(52), X(64), Z(60), 144, 220, [0.8, 1, 0.75], 220);

  // ======================= THE BASIN (outdoor) =======================
  K.room(30, 8, 80, 50, BASIN, 'mossstone');
  K.nukage(33, 13, 77, 47, BASIN, 16, 8);
  K.paint(30, 8, 80, 9, T(K.skySpec(96, 224, 'mossstone', 'mossstone', 'mossstone')));   // sniper ledge
  for (const [c, r] of [[61, 44], [57, 40], [60, 35], [56, 31]]) K.paint(c, r, c + 1, r + 1, T({ ...BASIN, floor: 'graystone', side: 'graystone' }));  // stepping stones
  K.paint(48, 19, 61, 28, T({ ...BASIN, f: 16, floor: 'graystone', side: 'graystone' }));                       // island
  K.paint(55, 22, 58, 25, T({ ...BASIN, f: 144, floor: 'diamond', side: 'support' }));                         // tower
  K.liftCells(53, 22, 54, 25, 16, 144);
  K.key('blue', X(57), Z(23) + 16, 144); K.light(X(57), 200, Z(24), 260, [0.4, 0.6, 1]);
  K.qoq(X(40), Z(8) + 16, 180, { turret: true, y: 96 }); K.qoq(X(56), Z(8) + 16, 180, { turret: true, y: 96 }); K.qoq(X(72), Z(8) + 16, 180, { turret: true, y: 96 });
  K.qoqC(50, 20, 180); K.qoqC(60, 27, 0); K.qoqC(36, 30, -90); K.qoqC(74, 34, 90); K.qoqC(44, 44, 0); K.qoqC(70, 46, 0); K.qoqC(32, 12, 180); K.qoqC(78, 12, 180);
  K.slices([[X(31), Z(48)], [X(79), Z(48)], [X(50), Z(27)], [X(61), Z(20)], [X(31), Z(20)], [X(79), Z(24)]]); K.juice(X(31), Z(36)); K.juice(X(79), Z(40)); K.health(X(49), Z(20)); K.health(X(55), Z(11));
  for (const [x, z] of [[X(40), Z(20)], [X(70), Z(20)], [X(40), Z(40)], [X(70), Z(40)]]) K.light(x, 220, z, 900, [0.75, 0.85, 0.7]);
  K.ambient(X(55), 0, Z(30), 'drip', 1800, 0.6);
  K.wave('bluekey', { onKey: 'blue', msg: 'The sludge bubbles... more of them!' });
  for (const [c, r] of [[48, 26], [61, 21], [34, 46], [76, 16], [64, 49]]) K.qoqC(c, r, 0, { wave: 'bluekey' });
  // secret: loose boards in the west wall
  K.paint(26, 28, 28, 32, T({ ...TUN, c: 112, floor: 'tilebrown' })); K.paint(29, 29, 29, 31, T({ ...TUN, c: 112 }));
  K.breakable([X(29), 0, Z(29)], [X(30), 112, Z(32)], { tex: 'boards', health: 24, secret: true });
  K.health(X(27), Z(29)); K.juice(X(27), Z(31)); K.item('sausages', X(26) + 16, Z(30) + 16); K.light(X(27), 60, Z(30), 160, [1, 0.6, 0.3], 3);

  // ======================= PUMP MACHINERY (blue door, red key) =======================
  K.door(81, 26, 81, 29, BASIN, { key: 'blue', top: 160 });
  K.room(82, 10, 108, 50, MACH, 'techgray');
  K.paint(84, 40, 97, 46, T(MID)); K.paint(98, 40, 108, 50, T(BAL));
  K.liftCells(84, 37, 86, 39, 0, 80); K.liftCells(96, 41, 97, 43, 80, 160);
  K.brush([X(87), 80, Z(40)], [X(96), 114, Z(40) + 2], { tex: 'railing', fit: true, noshadow: true }); K.brush([X(84), 80, Z(46) + 30], [X(98), 114, Z(47)], { tex: 'railing', fit: true, noshadow: true });
  K.brush([X(98), 160, Z(40)], [X(108) + 32, 194, Z(40) + 2], { tex: 'railing', fit: true, noshadow: true });
  K.key('red', X(106), Z(48), 160); K.light(X(106), 220, Z(47), 260, [1, 0.3, 0.2]);
  for (const [c, r] of [[88, 16], [96, 16], [104, 16], [88, 26], [104, 28]]) K.props((pr, ctx) => { pr.cylinder(C(c), 0, C(r), 46, 220, 'rust', { segs: 16 }); pr.cylinder(C(c), 220, C(r), 20, 100, 'pipes', { segs: 12 }); ctx.brush([X(c) - 30, 0, Z(r) - 30], [X(c) + 62, 220, Z(r) + 62], { invisible: true, noshadow: true }); ctx.light(C(c), 60, C(r) + 70, 220, [0.5, 1, 0.4], 2); });
  K.nukage(92, 24, 100, 32, MACH, 16, 8);
  for (const [x, z] of [[X(90), Z(20)], [X(102), Z(22)], [X(95), Z(36)], [X(103), Z(45)]]) K.light(x, 260, z, 420, [1, 0.95, 0.85]);
  K.qoq(X(90), Z(44), 180, { turret: true, y: 80 }); K.qoq(X(102), Z(42), 180, { turret: true, y: 160 });
  K.qoqC(84, 12, 90); K.qoqC(106, 12, -90); K.qoqC(96, 20, 180); K.qoqC(84, 32, 90); K.qoqC(106, 34, -90); K.qoqC(90, 49, 0);
  K.slices([[X(83), Z(22)], [X(107), Z(22)], [X(92), Z(43)], [X(104), Z(49)]]); K.juice(X(83), Z(11)); K.juice(X(107), Z(38)); K.health(X(85), Z(45)); K.item('sausages', X(100), Z(49));
  K.ambient(X(95), 100, Z(30), 'hum', 1400, 0.8);
  K.wave('redkey', { onKey: 'red', msg: 'Alarm! Qoqs in the machinery!' });
  for (const [c, r] of [[86, 14], [104, 20], [94, 48], [84, 28], [100, 14]]) K.qoqC(c, r, 0, { wave: 'redkey' });

  // ======================= ANTECHAMBER & OUTFLOW (red door, exit) =======================
  K.door(86, 51, 89, 51, MACH, { top: 144 }); K.paint(86, 52, 89, 61, T(TUN));
  K.room(79, 62, 95, 66, TUN, 'slimewall'); K.paint(79, 67, 82, 67, T(TUN));
  K.fixture(X(87), Z(64), 144, 160, 'x', 'light', 300); K.qoqC(80, 63, 90); K.qoqC(94, 65, -90); K.slice(X(94), Z(62)); K.juice(X(80), Z(66));
  K.door(88, 67, 91, 67, TUN, { key: 'red', top: 128 });
  K.room(84, 68, 108, 82, OUT, 'graystone');
  K.stairs(88, 68, 91, 70, 'N', -24, -8, { ...OUT, floor: 'stepside' });
  K.nukage(97, 68, 100, 82, OUT, 16, 8); K.paint(97, 74, 100, 76, T({ ...OUT, floor: 'diamond' }));
  K.props(pr => { pr.cylinder(X(98) + 32, -32, Z(68) + 8, 40, 30, 'rust', { rx: Math.PI / 2, segs: 16 }); });
  K.exit(X(109), -32, Z(75), 'nx');
  K.wave('outflow', { min: [X(84), -32, Z(71)], max: [X(96), 80, Z(82)], msg: 'Ambush at the outflow!' });
  for (const [c, r] of [[104, 70], [104, 80], [86, 80], [92, 76], [106, 75]]) K.qoqC(c, r, 90, { wave: 'outflow' });
  K.light(X(96), 200, Z(75), 800, [0.75, 0.85, 0.7]); K.slices([[X(85), Z(81)], [X(107), Z(69)]]); K.health(X(85), Z(69));

  K.goal(X(57), Z(23) + 16, 144); K.goal(X(106), Z(48), 160);
});
