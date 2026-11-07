// E3M2 (the original v0.24 E1M2, now part of Episode 3: The Pidser Cave) — JUSTICE HALL. A grand hall with a pillared mezzanine ring (image 2), the Vehicle Bay with its
// gantry (blue key), the Training Range (shoot the targets for the red key) and the Justice Vault.
import { makeLevel } from '../kit.js';

export default makeLevel({
  name: 'E3M2', title: 'E3M2: JUSTICE HALL', music: 'assets/music/cornquake_e1m2.mp3', ambience: 'cave', ambient: 18,
  fog: { color: [0.03, 0.03, 0.035], density: 0.0004 },
  styles: [{ color: [1, 0.5, 0.15], pattern: 'candle' }, { color: [0.35, 0.6, 1], pattern: 'gentle' }, { color: [1, 1, 0.95], pattern: 'fluoro' }, { color: [1, 0.15, 0.08], pattern: 'pulse' }],
}, 110, 96, 'concretedark', K => {
  const { X, Z, C } = K; const T = s => K.type(s);
  const TUN = { f: 0, c: 176, floor: 'grate', ceil: 'steeldark', side: 'trim', upper: 'rustpanel' };
  const HALL = { f: 0, c: 320, floor: 'tile', ceil: 'ceil', side: 'concrete', upper: 'rustpanel' };
  const BAY = { f: 0, c: 256, floor: 'diamond', ceil: 'steeldark', side: 'trim', upper: 'steeldark' };
  const RANGE = { f: 0, c: 192, floor: 'tilebrown', ceil: 'ceil', side: 'trim', upper: 'concretedark' };
  const BOOTH = { f: 64, c: 192, floor: 'diamond', ceil: 'ceil', side: 'stepside' };
  const ANTE = { f: 0, c: 256, floor: 'tile', ceil: 'jaildark', side: 'stepside', upper: 'rustpanel' };
  const VAULT = { f: 0, c: 192, floor: 'diamond', ceil: 'ceil', side: 'trim', upper: 'steel' };

  // ---------------- arrival tunnel ----------------
  K.room(50, 72, 57, 92, TUN, 'rustpanel');
  K.start(53, 90, 0);
  K.item('shotgun', X(53) + 16, Z(87)); K.msg([X(50), 0, Z(85)], [X(58), 100, Z(92)], 'A double-barrel SAUSAGE SHOTGUN! Two sausages a shot, best up close.');
  K.props(pr => { for (const r of [76, 80, 84, 88]) pr.ring(X(54), 64, Z(r), 120, 136, 18, 'z', 0, Math.PI, 'rust', 18); });
  for (const r of [78, 86]) { K.lamp(X(50) + 6, 120, Z(r), 220); K.lamp(X(58) - 6, 120, Z(r) + 64, 200); }
  K.qoqC(52, 74, 180); K.qoqC(56, 76, 180);
  K.slices([[X(54), Z(86)], [X(54), Z(80)]]); K.juice(X(51), Z(91));
  // secret: a loose panel in the tunnel wall
  K.door(49, 82, 49, 84, TUN, { tex: 'rustpanel', wait: -1, top: 104 }); K.paint(45, 81, 48, 85, T({ ...TUN, c: 120 }));
  K.secret([X(45), 0, Z(81)], [X(49), 100, Z(86)]); K.health(X(46), Z(83)); K.juice(X(47), Z(84)); K.light(X(46), 70, Z(83), 160, [1, 0.6, 0.3], 1);

  // ---------------- JUSTICE HALL ----------------
  K.room(28, 30, 79, 71, HALL, 'concretedark');
  K.props(pr => pr.ring(X(54), 96, Z(72), 128, 156, 24, 'z', 0, Math.PI, 'rust', 18));
  // mezzanine ring at y=144 (4 cells deep, 5 on the north side)
  const MZ = 144;
  K.catwalk(X(28), Z(30), X(80), Z(35), MZ, { rails: 's', gaps: [['s', X(28), X(32)], ['s', X(76), X(80)]], tex: 'diamond', top: 'diamond' });
  K.catwalk(X(28), Z(35), X(32), Z(66), MZ, { rails: 'e', tex: 'diamond' });
  K.catwalk(X(76), Z(35), X(80), Z(66), MZ, { rails: 'w', tex: 'diamond' });
  K.catwalk(X(32), Z(66), X(76), Z(72), MZ, { rails: 'n', gaps: [['n', X(46), X(62)]], tex: 'diamond' });
  K.stairBrush(X(32), Z(57), X(36), Z(66), 0, MZ, 'S'); K.stairBrush(X(72), Z(57), X(76), Z(66), 0, MZ, 'S');
  for (let c = 38; c <= 70; c += 6) { K.column(X(c), Z(35) + 12, 20, 0, MZ - 8, 'concrete'); K.column(X(c), Z(66) - 12, 20, 0, MZ - 8, 'concrete'); }
  for (let r = 40; r <= 52; r += 6) { K.column(X(32) + 12, Z(r), 20, 0, MZ - 8, 'concrete'); K.column(X(76) - 12, Z(r), 20, 0, MZ - 8, 'concrete'); }
  K.trim(X(28), Z(30), X(80), Z(72), MZ + 40, 8, 'trim');
  // monitor wall & emblem (image 2)
  K.brush([X(44), MZ + 20, Z(30)], [X(64), 300, Z(30) + 6], { tex: 'metal' });
  K.decal({ at: [X(54), MZ + 86, Z(30) + 6], n: 'pz', w: 600, h: 130, tex: 'monwall', fullbright: true });
  K.decal({ at: [X(54), 40, Z(30)], n: 'pz', w: 220, h: 64, tex: 'sign_justice', fullbright: true, off: 0.6 });
  K.light(X(54), MZ + 60, Z(38), 420, [0.45, 0.7, 1]);
  K.decal({ at: [X(80), 230, Z(51)], n: 'nx', w: 120, h: 120, tex: 'emblem' }); K.decal({ at: [X(28), 230, Z(51)], n: 'px', w: 120, h: 120, tex: 'emblem' });
  // the pizza oven and counters under the east mezzanine
  K.props((pr, ctx) => { const x = X(47), z = Z(33); ctx.brush([x - 64, 0, z - 56], [x + 64, 22, z + 40], { tex: 'brick', top: 'concrete' }); pr.sphere(x, 22, z - 8, 50, 'brickred', { half: true, segs: 16, rings: 8 }); ctx.brush([x - 44, 22, z - 50], [x + 44, 66, z + 32], { invisible: true, noshadow: true }); ctx.decal({ at: [x, 36, z + 41], n: 'pz', w: 30, h: 16, tex: 'glowred', fullbright: true, off: 1.5 }); ctx.decal({ at: [x, 104, z + 41], n: 'pz', w: 100, h: 30, tex: 'sign_pizza', fullbright: true, off: 1.5 }); ctx.light(x, 44, z + 70, 260, [1, 1, 1], 1); });
  K.counter(X(58), Z(31), X(62), Z(34), 44, 'drawer', 'pz'); K.props(pr => { pr.pizzaStack(X(59), 44, Z(32) + 16, 26, 4); pr.pizza(X(61), 44, Z(32) + 16, 22); });
  // tables, pedestal, lights
  for (const [c, r] of [[44, 44], [64, 44], [44, 58], [64, 58]]) K.pizzaTable(C(c), C(r), 54);
  K.props(pr => { pr.pedestal(X(54), Z(51), 0, 80, 36); pr.pizza(X(54), 36, Z(51), 74); });
  for (const [x, z] of [[X(44), Z(44)], [X(64), Z(44)], [X(44), Z(58)], [X(64), Z(58)], [X(54), Z(51)]]) K.fixture(x, z, 320, 140, 'x', 'light', 420);
  for (let c = 36; c <= 72; c += 12) { K.lamp(X(c), MZ - 20, Z(33), 200); K.lamp(X(c), MZ - 20, Z(69), 200); }
  K.light(X(30), 80, Z(51), 260, [1, 0.8, 0.5]); K.light(X(78), 80, Z(51), 260, [1, 0.8, 0.5]);
  K.ambient(X(54), 100, Z(51), 'hum', 900, 0.6);
  K.qoqC(44, 50, 180); K.qoqC(64, 52, 180); K.qoqC(54, 40, 180); K.qoqC(38, 62, 90); K.qoqC(70, 38, -90); K.qoqC(54, 64, 0);
  for (const [c, r] of [[30, 40], [78, 44], [40, 32], [68, 32]]) K.qoq(C(c), C(r), 180, { turret: true, y: MZ });
  K.slices([[X(44), Z(51)], [X(64), Z(51)], [X(54), Z(44)], [X(30), Z(60), MZ], [X(78), Z(60), MZ], [X(54), Z(31), MZ]]);
  K.juice(X(30), Z(36), MZ); K.juice(X(78), Z(68)); K.health(X(30), Z(68)); K.health(X(78), Z(36), MZ); K.juice(X(50), Z(64));
  // secret alcove behind the west emblem: shoot it
  K.door(33, 29, 35, 29, { ...HALL, f: MZ }, { tex: 'concretedark', targeted: true, name: 'emblemsecret', wait: -1, top: 96 });
  K.paint(32, 25, 36, 28, T({ f: MZ, c: MZ + 96, floor: 'tile', ceil: 'ceil', side: 'trim' }));
  K.decal({ at: [X(34) + 16, 270, Z(30)], n: 'pz', w: 64, h: 64, tex: 'emblem_slice', off: 0.8 });
  K.button({ min: [X(34), 254, Z(30)], max: [X(35) + 16, 286, Z(30) + 4], shoot: true, target: 'emblemsecret', msg: 'A hidden alcove opens behind the mezzanine!' });
  K.secret([X(32), MZ, Z(25)], [X(37), MZ + 90, Z(29)]); K.health(X(33), Z(26), MZ); K.juice(X(35), Z(26), MZ); K.slice(X(34), Z(27), MZ); K.light(X(34), MZ + 50, Z(26), 160, [1, 0.6, 0.3], 1);

  // ---------------- VEHICLE BAY (blue key) ----------------
  K.room(4, 36, 26, 66, BAY, 'steeldark');
  K.paint(27, 46, 27, 55, T(BAY));                                   // big arch into the hall
  K.props(pr => pr.ring(X(27) + 16, 16, Z(51), 160, 186, 32, 'x', 0, Math.PI, 'rust', 20));
  K.sign(X(28) + 2, 220, Z(51), 'px', 'sign_bay', 170, 28);
  // the armoured van
  K.props((pr, ctx) => { const x = X(14), z = Z(40); ctx.brush([x, 14, z], [x + 180, 56, z + 120], { tex: 'steeldark', top: 'metal' }); ctx.brush([x + 40, 56, z + 12], [x + 142, 84, z + 108], { tex: 'metal', px: 'computer', nx: 'metal' }); ctx.brush([x + 180, 14, z + 16], [x + 206, 40, z + 104], { tex: 'steeldark' }); for (const [dx, dz] of [[30, -8], [150, -8], [30, 128], [150, 128]]) pr.cylinder(x + dx, 0, z + dz, 16, 14, 'leather', { rx: Math.PI / 2, segs: 12, capTex: 'metal' }); ctx.decal({ at: [x + 206, 30, z + 30], n: 'px', w: 10, h: 8, tex: 'glow', fullbright: true }); ctx.decal({ at: [x + 206, 30, z + 90], n: 'px', w: 10, h: 8, tex: 'glow', fullbright: true }); ctx.light(x + 230, 34, z + 60, 180, [1, 0.9, 0.7]); });
  K.pool(12, 50, 19, 57, BAY, 'sludge', 32, 6);                       // repair pit with oily sludge
  K.catwalk(X(15), Z(50), X(17), Z(58), 0, { tex: 'boards', top: 'boards' });
  // gantry along the west wall, a lift up to it, blue key at the north end
  K.catwalk(X(4), Z(37), X(8), Z(64), 160, { rails: 'e', gaps: [['e', Z(58), Z(62)]], tex: 'grate', supports: [[X(8) - 4, Z(44)], [X(8) - 4, Z(52)]] });
  K.lift([X(8), 0, Z(58)], [X(11), 16, Z(62)], 144, { wait: 3 }); K.sign(X(9) + 16, 60, Z(62) + 4, 'pz', 'sign_lift', 64, 18);
  K.key('blue', X(6), Z(39), 160); K.slices([[X(6), Z(46)], [X(6), Z(54)]], 160);
  K.crates(X(22), Z(62), 0, 2, 40); K.crates(X(24), Z(38), 0, 1, 40); K.pizzaBoxes(X(24), Z(38), 40, 3);
  K.table(X(20), Z(64), 96, 32, 36, 'wood', 'metal'); K.barrel(X(25), Z(46)); K.barrel(X(25), Z(48) + 8);
  for (const [x, z] of [[X(10), Z(44)], [X(20), Z(44)], [X(10), Z(60)], [X(20), Z(58)]]) K.fixture(x, z, 256, 120, 'x', 'light', 360);
  K.light(X(6), 220, Z(50), 260, [0.4, 0.6, 1]);
  K.qoqC(20, 52, 90); K.qoqC(10, 46, 90); K.qoqC(22, 40, 90); K.qoqC(10, 62, 0);
  K.catwalk(X(22), Z(41), X(26), Z(46), 160, { rails: 'nsw', tex: 'grate', supports: [[X(23), Z(42)], [X(25), Z(45)]] }); K.catwalk(X(22), Z(56), X(26), Z(61), 160, { rails: 'nsw', tex: 'grate', supports: [[X(23), Z(57)], [X(25), Z(60)]] });
  K.qoq(X(24), Z(43) + 16, 90, { turret: true, y: 160 }); K.qoq(X(24), Z(58) + 16, 90, { turret: true, y: 160 });
  K.wave('bluekey', { onKey: 'blue', msg: 'Qoq reinforcements roll into the bay!' });
  for (const [c, r] of [[14, 64], [20, 60], [24, 50], [12, 38], [18, 46]]) K.qoqC(c, r, 0, { wave: 'bluekey' });
  K.juice(X(24), Z(64)); K.health(X(5), Z(65)); K.slices([[X(20), Z(48)], [X(12), Z(64)]]);
  // secret: boards over a tool closet in the north wall
  K.paint(14, 32, 20, 35, T({ ...BAY, c: 128 }));
  K.breakable([X(14), 0, Z(35) + 20], [X(21), 128, Z(36)], { tex: 'boards', health: 24, secret: true });
  K.health(X(15), Z(33)); K.juice(X(18), Z(33)); K.slice(X(19), Z(34)); K.light(X(17), 70, Z(33), 160, [1, 0.6, 0.3], 1);

  // ---------------- TRAINING RANGE (red key) ----------------
  K.room(81, 36, 106, 66, RANGE, 'concretedark');
  K.door(80, 48, 80, 53, HALL, { top: 120 });
  K.paint(81, 37, 84, 44, T(BOOTH)); K.paint(81, 57, 84, 65, T(BOOTH));
  K.stairs(81, 45, 84, 47, 'N', 16, 48, { ...RANGE, side: 'stepside' }); K.stairs(81, 54, 84, 56, 'S', 16, 48, { ...RANGE, side: 'stepside' });
  for (const r of [43, 47, 55, 59]) K.brush([X(90), 0, Z(r)], [X(104), 44, Z(r) + 10], { tex: 'concrete', top: 'trim' }); // lane dividers
  for (const [r, n] of [[44, 0], [51, 1], [57, 2]]) { K.decal({ at: [X(107), 64, Z(r) + 16], n: 'nx', w: 64, h: 64, tex: 'emblem_slice', off: 0.8 }); K.button({ min: [X(107) - 6, 52, Z(r) + 4], max: [X(107), 76, Z(r) + 28], shoot: true, counter: 'targets', count: 3, target: 'cage', msg: 'The red keycard cage opens!' }); K.light(X(104), 90, Z(r) + 16, 140, [1, 0.8, 0.5]); }
  K.wall(99, 36, 99, 41, 'concretedark');
  K.gate(100, 41, 106, 41, RANGE, 'cage', { targeted: true, wait: -1 });
  K.key('red', X(103), Z(38) + 16); K.light(X(103), 100, Z(39), 200, [1, 0.3, 0.2]);
  K.msg([X(86), 0, Z(44)], [X(89), 100, Z(57)], 'Shoot all three targets to open the cage!');
  K.sign(X(95), 150, Z(36), 'pz', 'sign_armory', 160, 36);
  for (const r of [44, 51, 58]) K.fixture(X(96), Z(r), 192, 200, 'x', 'light', 300, [1, 1, 1], 2);
  K.qoq(C(83), C(42), -90, { turret: true }); K.qoq(C(83), C(60), -90, { turret: true });
  K.qoqC(95, 44, 90); K.qoqC(98, 51, 90); K.qoqC(95, 58, 90); K.qoqC(102, 63, 90);
  K.juice(X(84), Z(51)); K.juice(X(86), Z(49)); K.juice(X(86), Z(53)); K.health(X(105), Z(64)); K.slices([[X(96), Z(50)], [X(100), Z(57)], [X(92), Z(64)]]);
  K.paint(107, 62, 108, 64, T({ ...RANGE, c: 112 }));
  K.breakable([X(107), 0, Z(62)], [X(107) + 8, 112, Z(65)], { tex: 'boards', health: 20, secret: true });
  K.juice(X(108), Z(62) + 8); K.slice(X(108), Z(64));

  // ---------------- ANTECHAMBER (arena) & JUSTICE VAULT ----------------
  K.room(44, 14, 63, 28, ANTE, 'rustpanel');
  K.door(50, 29, 57, 29, HALL, { key: 'red', name: 'reddoor', top: 128 });
  for (const [c, r] of [[48, 18], [59, 18], [48, 25], [59, 25]]) K.column(C(c), C(r), 32, 0, 256, 'jailmetal');
  K.skylight(X(54), Z(21), 256, 0, 160, 128, 380);
  K.wave('ante', { min: [X(46), 0, Z(16)], max: [X(62), 120, Z(26)], lock: ['reddoor', 'bluedoor'], msg: 'IT\'S A TRAP! The doors slam shut!', doneMsg: 'The vault doors unlock.' });
  for (const [c, r] of [[45, 15], [62, 15], [45, 27], [62, 27], [53, 15], [50, 20], [58, 24]]) K.qoqC(c, r, 180, { wave: 'ante' });
  K.juice(X(45), Z(21)); K.juice(X(62), Z(21)); K.health(X(54), Z(27));
  for (const c of [46, 61]) K.lantern(X(c), 140, Z(14), 'pz');
  K.room(44, 2, 63, 12, VAULT, 'steel');
  K.door(50, 13, 57, 13, ANTE, { key: 'blue', name: 'bluedoor', top: 128 });
  for (const c of [46, 49, 58, 61]) K.pizzaBoxes(C(c), C(6), 0, 6);
  K.props(pr => { for (const c of [47, 60]) pr.pizzaStack(C(c), 0, C(10), 26, 6); });
  K.sign(X(54), 150, Z(13), 'nz', 'sign_vaults', 200, 40);
  K.qoqC(48, 10, 180); K.qoqC(60, 10, 180);
  K.light(X(54), 140, Z(7), 340, [1, 0.85, 0.5]); K.slices([[X(52), Z(8)], [X(56), Z(8)]]);
  K.exit(X(54), 0, Z(2), 'pz');

  K.goal(X(6), Z(39), 160);
  K.goal(X(96), Z(45), 0, { shoot: [X(107) - 3, 64, Z(44) + 16] });
  K.goal(X(96), Z(51), 0, { shoot: [X(107) - 3, 64, Z(51) + 16] });
  K.goal(X(96), Z(57), 0, { shoot: [X(107) - 3, 64, Z(57) + 16] });
  K.goal(X(103), Z(38) + 16);
  K.goal(X(54), Z(21), 0, { wait: 14 });
});
