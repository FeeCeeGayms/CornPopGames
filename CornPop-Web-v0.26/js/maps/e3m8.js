// E3M8 (the original v0.24 E1M8, now part of Episode 3: The Pidser Cave) — HORNT JAIL BREAKOUT. The riot has torn the jail apart (image: Hornt Jail, broken). Break out of
// your cell into the wrecked Cell Block B, wade the sludge-flooded sewer (red key), fire up the boiler
// room (blue key), survive three riots in the Warden's Vault and climb to the rooftop to escape.
import { makeLevel } from '../kit.js';

export default makeLevel({
  name: 'E3M8', title: 'E3M8: HORNT JAIL BREAKOUT', ambience: 'cave', music: 'assets/music/e1m8.mp3', ambient: 15,
  fog: { color: [0.03, 0.032, 0.03], density: 0.00038 },
  rain: { min: [128, 0, 32], max: [1152, 600, 224] },
  styles: [{ color: [1, 0.5, 0.15], pattern: 'candle' }, { color: [1, 0.15, 0.08], pattern: 'pulse' }, { color: [1, 1, 0.95], pattern: 'fluoro' }, { color: [1, 0.55, 0.2], pattern: 'flicker' }],
}, 112, 104, 'jaildark', K => {
  const { X, Z, C } = K; const T = s => K.type(s);
  const CELL = { f: 0, c: 128, floor: 'jailfloor', ceil: 'jaildark', side: 'trim', upper: 'jailmetal' };
  const HALLB = { f: 0, c: 352, floor: 'rubble', ceil: 'jaildark', side: 'stepside', upper: 'jailmetal' };
  const SEW = { f: -96, c: 96, floor: 'grate', ceil: 'rust', side: 'rust', upper: 'rust' };
  const SEWP = { f: -96, c: 40, floor: 'grate', ceil: 'rust', side: 'rust', upper: 'rust' };
  const BOIL = { f: 0, c: 320, floor: 'grate', ceil: 'rust', side: 'stepside', upper: 'rustpanel' };
  const PASS = { f: 0, c: 160, floor: 'jailfloor', ceil: 'jaildark', side: 'trim', upper: 'jailmetal' };
  const ARENA = { f: 0, c: 384, floor: 'diamond', ceil: 'steeldark', side: 'stepside', upper: 'steel' };
  const PLAT = { f: 96, c: 384, floor: 'diamond', ceil: 'steeldark', side: 'stepside', upper: 'steel' };
  const ROOF = { f: 256, c: 640, floor: 'asphalt', ceil: 'sky', sky: true, side: 'stepside', upper: 'concretedark' };
  const NUMS = Array.from({ length: 40 }, (_, i) => ['cell101', 'cell102', 'cell103'][(i + 1) % 3]);
  const rubble = (x, z, w, d, h) => K.brush([x - w / 2, 0, z - d / 2], [x + w / 2, h, z + d / 2], { tex: 'rubble', top: 'rubble' });

  // ---------------- your cell (start) ----------------
  K.room(52, 92, 58, 99, CELL, 'jailmetal');
  K.start(55, 97, 0);
  K.brush([X(52), 0, Z(97)], [X(54), 16, Z(99) + 24], { tex: 'metal', top: 'blanket' });
  K.decal({ at: [X(55), 60, Z(100)], n: 'nz', w: 70, h: 70, tex: 'cracked', off: 0.8 }); K.decal({ at: [X(58) + 32, 64, Z(95)], n: 'nx', w: 40, h: 18, tex: 'cell103' });
  K.paint(54, 89, 56, 91, T({ ...CELL, c: 112, floor: 'rubble' }));
  rubble(X(55), Z(91), 60, 30, 10); rubble(X(57), Z(90), 30, 30, 18);
  K.decal({ at: [X(54), 60, Z(90)], n: 'px', w: 50, h: 60, tex: 'cracked' }); K.decal({ at: [X(57), 60, Z(90)], n: 'nx', w: 50, h: 60, tex: 'cracked' });
  K.lantern(X(52), 100, Z(94), 'px', 170, 3);
  K.msg([X(52), 0, Z(92)], [X(59), 100, Z(99)], 'The riot blew your cell wall open. Time to break out!');
  K.juice(X(57), Z(96)); K.slice(X(57), Z(98));

  // ---------------- CELL BLOCK B (wrecked) ----------------
  K.room(18, 56, 92, 88, HALLB, 'jailmetal');
  const lockW = [2, 5, 9, 12], lockE = [1, 4, 8, 10];
  K.cellBlock({ x0: X(20), zWall: Z(56), dir: 1, count: 7, numbers: NUMS, broken: [0, 3, 6, 8, 11], open: [1, 13], name: (t, i) => `W${t}_${i}`,
    loot: (tier, i, cx, cz, yb) => { const idx = tier * 7 + i; if (lockW.includes(idx)) K.qoq(cx, cz, 0, { wave: 'riot', y: yb }); else if (idx % 3 === 0) K.juice(cx, cz, yb); else if (idx % 4 === 1) K.health(cx, cz, yb); else K.slice(cx, cz, yb); } });
  K.cellBlock({ x0: X(51), zWall: Z(56), dir: 1, count: 6, numbers: NUMS.slice(7), broken: [0, 2, 5, 7, 9], open: [3, 11], name: (t, i) => `E${t}_${i}`,
    loot: (tier, i, cx, cz, yb) => { const idx = tier * 6 + i; if (lockE.includes(idx)) K.qoq(cx, cz, 0, { wave: 'riot', y: yb }); else if (idx % 3 === 1) K.juice(cx, cz, yb); else if (idx % 4 === 2) K.health(cx, cz, yb); } });
  K.catwalk(X(45), Z(60), X(51), Z(62), 136, { rails: 's', tex: 'grate' }); // bridge over the vault passage
  // debris ramps up to the upper tier, and the east stair
  K.stairBrush(X(32), Z(62), X(35), Z(72), 0, 136, 'N', 'rubble', 'rubble');
  K.stairBrush(X(78), Z(62), X(82), Z(71), 0, 136, 'N'); K.catwalk(X(72), Z(60), X(82), Z(62), 136, { rails: 's', gaps: [['s', X(78), X(82)]] });
  for (const [x, z, w, d, h] of [[X(26), Z(76), 90, 60, 20], [X(28), Z(78), 40, 40, 34], [X(46), Z(84), 120, 50, 16], [X(62), Z(70), 70, 70, 26], [X(70), Z(80), 100, 40, 14], [X(86), Z(86), 80, 60, 30], [X(40), Z(66), 50, 50, 12]]) rubble(x, z, w, d, h);
  K.props(pr => {
    for (const [x, z, a] of [[X(30), Z(70), 0.4], [X(58), Z(78), -0.8], [X(74), Z(68), 1.2], [X(50), Z(74), 2.2]]) pr.cylinder(x, 0, z, 1.6, 90, 'metal', { rz: 1.4, ry: a, segs: 6 });
    for (const [x, z] of [[X(66), Z(84)], [X(24), Z(84)]]) pr.barrel(x, z, 0, 13, 32, 'rust');
  });
  for (const c of [24, 40, 64, 84]) K.decal({ at: [X(c), 90, Z(89)], n: 'nz', w: 90, h: 100, tex: 'cracked', off: 0.8 });
  K.sign(X(92) + 32, 260, Z(72), 'nx', 'neon_hornt', 150, 112); K.light(X(90), 250, Z(72), 260, [1, 0.45, 0.15], 3);
  K.sign(X(92) + 32, 190, Z(72), 'nx', 'sign_nohope', 160, 34, false);
  K.desk(X(56), Z(76), X(63), Z(78), 'nz'); K.decal({ at: [X(60), 1, Z(74)], n: 'up', w: 120, h: 80, tex: 'cracked', off: 0.5 });
  K.pool(30, 80, 40, 86, HALLB, 'sludge', 16, 6);
  for (const [c, r] of [[28, 72], [48, 76], [64, 80], [84, 72], [56, 66]]) K.light(X(c), 140, Z(r), 300, [1, 0.72, 0.42], c === 48 ? 3 : 0);
  // secret: boarded hole in the south wall, east of your cell
  K.paint(70, 90, 74, 93, T({ ...CELL, c: 120, floor: 'rubble' })); K.paint(71, 89, 73, 89, T({ ...CELL, c: 120, floor: 'rubble' }));
  K.breakable([X(71), 0, Z(89)], [X(74), 120, Z(89) + 16], { tex: 'boards', health: 18, secret: true });
  K.health(X(71), Z(92)); K.juice(X(73), Z(92), undefined, 80); K.slice(X(72), Z(91));
  K.skylight(X(40), Z(72), 352, 0, 128, 128, 380); K.skylight(X(70), Z(74), 352, 0, 128, 128, 380);
  for (const c of [26, 46, 66, 86]) K.fixture(X(c), Z(80), 352, 120, 'x', 'light', 230, [1, 0.95, 0.85], c % 40 === 26 ? 2 : 3);
  for (const c of [22, 52, 80]) K.lamp(X(c), 160, Z(87), 220, [1, 0.72, 0.4], 3);
  K.emitter([X(26), 200, Z(78)], [X(27), 352, Z(82)], 'sparks', 5); K.emitter([X(66), 200, Z(78)], [X(67), 352, Z(82)], 'sparks', 4);
  K.emitter([X(18), 0, Z(56)], [X(93), 300, Z(89)], 'dust', 16); K.ambient(X(55), 80, Z(72), 'fire', 900, 0.5); K.ambient(X(30), 40, Z(83), 'drip', 400, 1);
  for (const [c, r] of [[24, 70], [44, 80], [64, 66], [76, 84], [88, 66], [50, 66]]) K.qoqC(c, r, 180);
  K.qoq(X(28), Z(61), 180, { turret: true, y: 136 }); K.qoq(X(60), Z(61), 180, { turret: true, y: 136 });
  K.wave('riot', { min: [X(44), 0, Z(70)], max: [X(70), 120, Z(84)], msg: 'RIOT! The surviving cells burst open!', release: [...lockW.map(i => `W${i >= 7 ? 1 : 0}_${i % 7}`), ...lockE.map(i => `E${i >= 6 ? 1 : 0}_${i % 6}`)], stagger: 0.3, doneMsg: 'The riot dies down.' });
  for (const [c, r] of [[20, 86], [90, 86], [90, 58]]) K.qoqC(c, r, 0, { wave: 'riot' });
  K.slices([[X(22), Z(80)], [X(86), Z(78)], [X(55), Z(86)], [X(40), Z(64), 12], [X(33) + 16, Z(64), 136]]); K.juice(X(19), Z(64)); K.juice(X(91), Z(88)); K.juice(X(72), Z(87)); K.juice(X(48), Z(70)); K.health(X(19), Z(87)); K.health(X(91), Z(62));

  // ---------------- FLOODED SEWER (red key) ----------------
  K.stairs(10, 70, 17, 74, 'E', -96, 0, { ...SEWP, c: 160, side: 'stepside', floor: 'grate' });
  K.room(2, 8, 30, 52, SEW, 'rust');
  K.paint(4, 53, 9, 74, T({ ...SEW, c: 64 }));
  for (const [c0, r0, c1, r1] of [[3, 10, 13, 26], [19, 10, 29, 26], [3, 32, 13, 50], [19, 32, 29, 50]]) K.pool(c0, r0, c1, r1, SEW, 'sludge', 16, 10);
  K.brush([X(23), -112, Z(15)], [X(27), -96, Z(19)], { tex: 'rust', top: 'grate' });
  K.catwalk(X(19), Z(16), X(23), Z(18), -96, { tex: 'grate', thick: 8 });
  K.key('red', X(25), Z(17), -96); K.light(X(25), -40, Z(17), 220, [1, 0.3, 0.2], 1);
  K.catwalk(X(3), Z(40), X(14), Z(42), -96, { tex: 'grate', thick: 8 }); K.catwalk(X(18), Z(22), X(29), Z(24), -96, { tex: 'grate', thick: 8 });
  K.props(pr => { for (const r of [12, 24, 36, 48]) pr.pipe(X(2), -40, Z(r), X(31), -40, Z(r), 6, 'rust'); for (const c of [6, 16, 26]) pr.pipe(X(c), -30, Z(8), X(c), -30, Z(53), 4, 'metal'); });
  for (const [c, r] of [[16, 12], [16, 46], [8, 29], [24, 29]]) K.lamp(X(c), -10, Z(r), 220, [1, 0.72, 0.4], 3);
  K.sign(X(16), -30, Z(53), 'nz', 'sign_drain', 160, 32);
  K.emitter([X(2), -96, Z(8)], [X(31), 0, Z(53)], 'drip', 14); K.ambient(X(16), -60, Z(30), 'drip', 900, 1);
  K.qoqC(16, 20, 180, { y: -96 }); K.qoqC(16, 38, 180, { y: -96 }); K.qoqC(8, 29, 90, { y: -96 }); K.qoqC(26, 29, -90, { y: -96 }); K.qoqC(16, 50, 0, { y: -96 });
  K.wave('redkey', { onKey: 'red', msg: 'Something rises out of the sludge!' });
  for (const [c, r] of [[15, 9], [17, 9], [3, 29], [29, 29], [15, 51], [6, 41]]) K.qoqC(c, r, 0, { wave: 'redkey', y: -96 });
  K.slices([[X(15), Z(29)], [X(17), Z(29)], [X(8), Z(41), -96], [X(24), Z(23), -96]]); K.juice(X(14) + 16, Z(10), -96); K.juice(X(17), Z(51), -96); K.juice(X(4), Z(30), -96); K.health(X(29), Z(30), -96); K.health(X(6), Z(60), -96);
  // secret: a dry maintenance nook at the end of the west catwalk
  K.paint(0, 39, 1, 43, T({ ...SEW, c: 32, floor: 'grate' }));
  K.secret([X(0), -96, Z(39)], [X(3), 0, Z(44)]); K.health(X(1), Z(40), -96); K.juice(X(1), Z(42), -96, 80); K.slice(X(1) + 16, Z(41), -96);

  // ---------------- BOILER ROOM (red door, blue key) ----------------
  K.paint(84, 51, 88, 54, T(PASS)); K.door(84, 55, 88, 55, HALLB, { key: 'red', top: 128, name: 'reddoor' });
  K.room(80, 8, 108, 50, BOIL, 'rustpanel');
  for (const [c, r] of [[87, 18], [99, 18], [87, 38], [99, 38]]) {
    K.brush([X(c) - 56, 0, Z(r) - 56], [X(c) + 56, 220, Z(r) + 56], { invisible: true });
    K.props(pr => { pr.cylinder(X(c), 0, Z(r), 60, 220, 'rustpanel', { segs: 18 }); pr.cylinder(X(c), 220, Z(r), 40, 30, 'metal', { segs: 14 }); pr.pipe(X(c), 250, Z(r), X(c), 320, Z(r), 10, 'rust'); });
    K.decal({ at: [X(c), 50, Z(r) + 60], n: 'pz', w: 44, h: 26, tex: 'glowred', fullbright: true, off: 1 }); K.light(X(c), 50, Z(r) + 80, 200, [1, 0.45, 0.15], 1);
    K.emitter([X(c) - 20, 230, Z(r) - 20], [X(c) + 20, 250, Z(r) + 20], 'steam', 4);
  }
  K.catwalk(X(80), Z(8), X(109), Z(12), 160, { rails: 's', tex: 'grate', supports: [[X(93), Z(12) - 4]] });
  K.catwalk(X(104), Z(12), X(109), Z(47), 160, { rails: 'w', tex: 'grate', supports: [[X(104) + 4, Z(30)]] });
  K.lift([X(104), 0, Z(47)], [X(108), 8, Z(50)], 152, { wait: 2 });
  K.key('blue', X(82), Z(10), 160); K.light(X(83), 200, Z(10), 220, [0.4, 0.6, 1], 3);
  K.sign(X(94), 200, Z(51), 'nz', 'sign_lift', 120, 30);
  K.props(pr => { for (const z of [Z(28), Z(30)]) pr.pipe(X(80), 120, z, X(109), 120, z, 7, 'rust'); });
  for (const c of [84, 94, 104]) K.fixture(X(c), Z(28), 320, 120, 'x', 'lightamber', 260, [1, 0.75, 0.45], 2);
  K.emitter([X(80), 0, Z(8)], [X(109), 200, Z(51)], 'sparks', 3); K.ambient(X(94), 100, Z(28), 'machine', 1000, 1);
  K.qoqC(93, 28, 180); K.qoqC(82, 28, 90); K.qoqC(106, 28, -90); K.qoqC(93, 46, 180); K.qoqC(93, 10, 180);
  K.qoq(X(108), Z(20), -90, { turret: true, y: 160 }); K.qoq(X(96), Z(8) + 18, 180, { turret: true, y: 160 });
  K.wave('bluekey', { onKey: 'blue', msg: 'The boiler crew wants its key back!' });
  for (const [c, r, y] of [[81, 46], [107, 40], [93, 22], [93, 34], [88, 10, 160], [100, 10, 160]]) K.qoqC(c, r, 0, { wave: 'bluekey', y });
  // secret: soak the pressure gauge on the south-west boiler to open a maintenance locker
  K.decal({ at: [X(87) - 60, 120, Z(38)], n: 'nx', w: 28, h: 28, tex: 'clock333', fullbright: true, off: 1 });
  K.button({ min: [X(87) - 66, 104, Z(38) - 14], max: [X(87) - 56, 136, Z(38) + 14], shoot: true, target: 'boilstash', msg: 'Hiss! A maintenance locker pops open in the west wall.' });
  K.door(79, 30, 79, 32, BOIL, { targeted: true, name: 'boilstash', wait: -1, tex: 'rustpanel', top: 104 }); K.room(76, 29, 78, 33, { ...BOIL, c: 112 }, 'rustpanel');
  K.secret([X(76), 0, Z(29)], [X(79), 100, Z(34)]); K.health(X(77), Z(30)); K.juice(X(77), Z(32), undefined, 80); K.health(X(76) + 16, Z(33));
  K.slices([[X(93), Z(16)], [X(93), Z(40)], [X(106), Z(36), 160]]); K.juice(X(81), Z(9)); K.juice(X(107), Z(9)); K.juice(X(81), Z(49)); K.health(X(94), Z(49)); K.health(X(90), Z(10), 160);

  // ---------------- THE WARDEN'S VAULT (blue door, three riots) ----------------
  K.paint(46, 51, 50, 54, T(PASS)); K.door(46, 55, 50, 55, HALLB, { key: 'blue', top: 120, name: 'bluedoor' });
  K.room(34, 8, 74, 50, ARENA, 'steel');
  K.paint(34, 8, 39, 50, T(PLAT)); K.paint(69, 8, 74, 50, T(PLAT));
  K.stairs(40, 40, 45, 45, 'W', 16, 96, { ...ARENA, side: 'stepside', floor: 'concrete' }); K.stairs(63, 40, 68, 45, 'E', 16, 96, { ...ARENA, side: 'stepside', floor: 'concrete' });
  K.stairs(40, 13, 45, 18, 'W', 16, 96, { ...ARENA, side: 'stepside', floor: 'concrete' }); K.stairs(63, 13, 68, 18, 'E', 16, 96, { ...ARENA, side: 'stepside', floor: 'concrete' });
  for (const [x, za, zb] of [[X(40), Z(8), Z(13)], [X(40), Z(19), Z(40)], [X(40), Z(46), Z(51)]]) K.brush([x, 96, za], [x + 2, 130, zb], { tex: 'railing', fit: true, noshadow: true });
  for (const [x, za, zb] of [[X(69) - 2, Z(8), Z(13)], [X(69) - 2, Z(19), Z(40)], [X(69) - 2, Z(46), Z(51)]]) K.brush([x, 96, za], [x + 2, 130, zb], { tex: 'railing', fit: true, noshadow: true });
  K.props(pr => { pr.pedestal(X(54) + 16, Z(29), 0, 120, 40, 'concrete'); pr.pizza(X(54) + 16, 40, Z(29), 90); });
  K.brush([X(54) + 16 - 90, 0, Z(29) - 90], [X(54) + 16 + 90, 40, Z(29) + 90], { invisible: true });
  for (const [c, r] of [[46, 22], [63, 22], [46, 36], [63, 36]]) K.column(C(c), C(r), 32, 0, 384, 'steel');
  for (const c of [44, 65]) K.decal({ at: [X(c), 90, Z(8)], n: 'pz', w: 130, h: 130, tex: 'vaultdoor', off: 0.8 }); K.sign(X(54) + 16, 200, Z(8), 'pz', 'sign_vault', 200, 46);
  for (const [c, r] of [[36, 12], [36, 46], [72, 12], [72, 46]]) K.pizzaBoxes(C(c), C(r), 96, 6);
  K.decal({ at: [X(34), 200, Z(29)], n: 'px', w: 90, h: 90, tex: 'badge_hornt' }); K.decal({ at: [X(75), 200, Z(29)], n: 'nx', w: 90, h: 90, tex: 'badge_hornt' });
  K.skylight(X(54) + 16, Z(29), 384, 0, 192, 192, 520);
  for (const r of [14, 29, 44]) { K.lamp(X(35), 220, Z(r), 260); K.lamp(X(74), 220, Z(r), 260); }
  K.light(X(54) + 16, 200, Z(12), 360, [1, 0.6, 0.3], 2); K.light(X(54) + 16, 120, Z(46), 360, [1, 0.75, 0.45]);
  K.ambient(X(54), 150, Z(29), 'hum', 1200, 0.6);
  K.wave('riot1', { min: [X(44), 0, Z(22)], max: [X(66), 120, Z(48)], lock: ['bluedoor'], msg: 'The Warden\'s guard holds the vault! (riot 1 of 3)', doneMsg: 'More are coming...', next: 'riot2', stagger: 0.35 });
  for (const [c, r] of [[42, 10], [66, 10], [42, 48], [66, 48], [54, 12], [54, 46], [48, 29], [62, 29]]) K.qoqC(c, r, 0, { wave: 'riot1' });
  K.wave('riot2', { msg: 'Riot 2 of 3! They come from the balconies!', doneMsg: 'One more push...', next: 'riot3', stagger: 0.3 });
  for (const [c, r] of [[36, 20], [36, 30], [36, 38], [72, 20], [72, 30], [72, 38], [37, 10], [71, 48]]) K.qoqC(c, r, 90, { wave: 'riot2', y: 96 });
  K.wave('riot3', { msg: 'RIOT 3 OF 3! The Warden throws everything at you!', doneMsg: 'The vault is yours! The roof hatch is open!', opens: ['roofdoor'], stagger: 0.25 });
  for (const [c, r, y] of [[44, 10], [64, 10], [44, 48], [64, 48], [50, 20], [60, 38], [36, 46, 96], [72, 12, 96], [54, 10], [54, 48]]) K.qoqC(c, r, 0, { wave: 'riot3', y });
  K.slices([[X(37), Z(29), 96], [X(72), Z(29), 96], [X(48), Z(44)], [X(62), Z(14)]]);
  for (const [c, r, y] of [[36, 24, 96], [72, 34, 96], [42, 29], [67, 29], [54, 49], [54, 9]]) K.juice(X(c), Z(r), y);
  K.health(X(36), Z(34), 96); K.health(X(72), Z(24), 96); K.health(X(44), Z(48)); K.health(X(64), Z(10)); K.juice(X(42), Z(49), 0, 80); K.juice(X(66), Z(9), 0, 80);

  // ---------------- ROOFTOP ESCAPE ----------------
  K.door(52, 7, 56, 7, ARENA, { targeted: true, name: 'roofdoor', wait: -1, tex: 'door_red', top: 128 });
  K.paint(52, 2, 56, 6, T({ ...PASS, c: 400 }));
  K.stairs(36, 2, 51, 6, 'W', 16, 256, { ...PASS, c: 400, side: 'stepside', floor: 'concrete' });
  K.room(4, 1, 35, 6, ROOF, 'concretedark');
  K.decal({ at: [X(12), 257, Z(4)], n: 'up', w: 140, h: 140, tex: 'hazard', off: 0.5 });
  for (const c of [8, 18, 28]) K.decal({ at: [X(c), 400, Z(1)], n: 'pz', w: 300, h: 140, tex: 'skyline', fullbright: true, off: 0.6 });
  K.light(X(20), 400, Z(4), 520, [0.55, 0.65, 0.95]); K.lamp(X(34), 340, Z(2), 260); K.lamp(X(20), 340, Z(2), 260);
  K.ambient(X(20), 300, Z(4), 'wind', 900, 1);
  K.msg([X(30), 256, Z(1)], [X(36), 360, Z(7)], 'Fresh air! The getaway is at the end of the roof!');
  K.qoqC(24, 3, 90, { y: 256 }); K.qoqC(14, 5, 90, { y: 256 });
  K.exit(X(4), 256, Z(3) + 16, 'px');

  K.goal(X(54), Z(78), 0, { wait: 12 }); K.goal(X(25), Z(17), -96, { wait: 10 }); K.goal(X(82), Z(10), 160, { wait: 10 }); K.goal(X(54), Z(34), 0, { wait: 40 }); K.goal(X(37), Z(30), 96, { wait: 20 }); K.goal(X(72), Z(30), 96, { wait: 20 }); K.goal(X(54), Z(46), 0, { wait: 40 }); K.goal(X(37), Z(20), 96, { wait: 15 }); K.goal(X(72), Z(40), 96, { wait: 15 });
});
