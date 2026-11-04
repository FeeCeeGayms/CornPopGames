// E1M1 — THE PIDSER CAVE. Rainy street & parking lot outside, a two-level Monitor Hall hub inside,
// a crate-maze storage wing (red key), the Sauce Works (blue key) and an office route back up to the exit.
import { makeLevel } from '../kit.js';

export default makeLevel({
  name: 'E1M1', title: 'E1M1: THE PIDSER CAVE', ambience: 'street', ambient: 14, music: 'assets/music/rotted_circuitry.mp3',
  fog: { color: [0.035, 0.025, 0.04], density: 0.00045 }, skyTint: [0.55, 0.4, 0.8],
  rain: { min: [64, 0, 1280], max: [3136, 560, 3008] },
  styles: [{ color: [1, 0.12, 0.08], pattern: 'neon' }, { color: [1, 1, 0.95], pattern: 'fluoro' }, { color: [1, 0.55, 0.2], pattern: 'candle' }, { color: [1, 0.2, 0.08], pattern: 'pulse' }],
}, 100, 96, 'brickdark', K => {
  const { X, Z, C } = K; const T = s => K.type(s);
  const sky = (f, floor, side = 'concrete') => ({ f, c: 576, floor, ceil: 'sky', side, sky: true });
  const STREET = sky(0, 'asphalt'), WALK = sky(8, 'concrete'), DOCK = sky(48, 'diamond', 'steel');
  const THR = { f: 16, c: 128, floor: 'diamond', ceil: 'steeldark', side: 'trim', upper: 'steel' };
  const VEST = { f: 16, c: 144, floor: 'diamond', ceil: 'ceil', side: 'rustpanel' };
  const HUB = { f: -176, c: 144, floor: 'tilebrown', ceil: 'ceil', side: 'trim' };
  const STORE = { f: -176, c: -16, floor: 'concretedark', ceil: 'ceil', side: 'trim' };
  const SAUCE = { f: -176, c: 96, floor: 'grate', ceil: 'steeldark', side: 'stepside' };
  const UPPER = { f: -48, c: 96, floor: 'diamond', ceil: 'steeldark', side: 'stepside', upper: 'rustpanel' };
  const OFFICE = { f: -48, c: 96, floor: 'tilebrown', ceil: 'ceil', side: 'trim' };
  const CORR = { f: 48, c: 176, floor: 'diamond', ceil: 'steeldark', side: 'stepside', upper: 'rustpanel' };

  // ======================= OUTSIDE =======================
  K.wall(0, 60, 99, 95, 'building'); K.wall(0, 64, 77, 67, 'steel');
  K.paint(2, 72, 97, 93, T(STREET)); K.paint(2, 68, 97, 71, T(WALK));
  K.paint(78, 40, 97, 71, T(STREET));                       // parking lot
  K.paint(86, 40, 97, 50, T(DOCK)); K.stairs(88, 51, 95, 53, 'N', 16, 48, DOCK);
  K.paint(2, 46, 10, 67, T(STREET));                        // back alley
  K.paint(3, 42, 9, 45, T({ f: 0, c: 112, floor: 'concrete', ceil: 'ceil', side: 'trim', upper: 'building' }));  // alley nook (secret)
  K.paint(46, 64, 50, 67, T(THR));                          // the entrance
  K.start(6, 84, -90);
  K.item('soaker', X(16), Z(82));
  K.msg([X(12), 0, Z(78)], [X(20), 100, Z(88)], 'A SUPER SOAKER full of yellow juice!');
  // facade, neon sign and street dressing
  K.sign(X(48) + 16, 200, Z(68), 'pz', 'sign_pidser', 300, 56);
  K.brush([X(43), 168, Z(68)], [X(54), 232, Z(68) + 2], { tex: 'metal', solid: false, noshadow: true });
  K.light(X(48) + 16, 200, Z(68) + 40, 320, [1, 1, 1], 1); K.light(X(48) + 16, 90, Z(67), 260, [1, 0.12, 0.08]);
  for (const c of [8, 24, 40, 60, 76, 92]) K.props((pr, ctx) => { const x = X(c), z = Z(71) + 8; pr.cylinder(x, 8, z, 3, 150, 'metal', { segs: 8 }); pr.sphere(x, 158, z, 7, 'glow', { fullbright: true, segs: 8, rings: 5 }); ctx.brush([x - 4, 8, z - 4], [x + 4, 150, z + 4], { invisible: true, noshadow: true }); ctx.light(x, 140, z + 16, 380, [1, 0.78, 0.45]); });
  for (const x of [800, 1600, 2400]) K.light(x, 440, Z(84), 640, [0.22, 0.2, 0.4]);
  K.light(X(88), 440, Z(56), 640, [0.22, 0.2, 0.4]); K.light(X(6), 440, Z(56), 500, [0.22, 0.2, 0.4]);
  K.props(pr => { pr.pipe(X(30), 0, Z(68) - 2, X(30), 576, Z(68) - 2, 4, 'metal'); pr.pipe(X(10), 240, Z(68) - 2, X(76), 240, Z(68) - 2, 3, 'metal'); pr.pipe(X(66), 0, Z(68) - 2, X(66), 240, Z(68) - 2, 3, 'metal'); });
  K.brush([X(36), 50, Z(68)], [X(38), 110, Z(68) + 12], { tex: 'metal', pz: 'cabinet' });
  K.crates(X(56), Z(69) + 4, 8, 1, 36); K.crates(X(58) + 8, Z(69) + 4, 8, 2, 30);
  K.brush([X(70), 8, Z(68)], [X(73), 60, Z(70)], { tex: 'steeldark', top: 'metal' });          // dumpster
  // parked delivery vans in the lot
  for (const [c, r] of [[81, 46], [81, 58]]) K.props((pr, ctx) => { const x = X(c), z = Z(r); ctx.brush([x, 14, z], [x + 70, 80, z + 150], { tex: 'steeldark', top: 'metal', px: 'sign_pizza', fit: ['px'] }); ctx.brush([x + 4, 80, z + 100], [x + 66, 104, z + 150], { tex: 'metal', pz: 'computer' }); for (const [dx, dz] of [[0, 20], [70, 20], [0, 126], [70, 126]]) pr.cylinder(x + dx, 0, z + dz, 14, 12, 'leather', { rz: Math.PI / 2, segs: 10, capTex: 'metal' }); });
  K.qoqC(84, 54, 90); K.qoqC(92, 62, 0); K.qoqC(90, 44, 180, { turret: true }); K.qoqC(60, 80, -90); K.qoqC(44, 76, 180);
  K.juice(X(94), Z(70)); K.health(X(4), Z(69)); K.slices([[X(30), Z(90)], [X(70), Z(90)], [X(96), Z(42)], [X(5), Z(52)]]);
  K.lamp(X(6), 100, Z(56)); K.qoq(X(6), Z(48) + 16, 180, { turret: true });
  // alley nook secret behind breakable boards
  K.breakable([X(3), 0, Z(45) + 6], [X(10), 112, Z(46)], { tex: 'boards', health: 24, secret: true });
  K.health(X(4), Z(43)); K.item('shotgun', X(6) + 16, Z(43) + 8); K.slice(X(8), Z(44)); K.light(X(6), 60, Z(43), 200, [1, 0.6, 0.3], 3);
  K.msg([X(2), 0, Z(46)], [X(11), 100, Z(52)], 'Those boards look loose... and something smells like sausages.');
  K.ambient(X(48), 60, Z(80), 'wind', 1800, 0.7);

  // ======================= VESTIBULE & STAIRS =======================
  K.room(42, 56, 54, 63, VEST, 'rustpanel');
  K.door(46, 55, 50, 55, VEST, { top: 112 });
  K.stairs(46, 43, 50, 54, 'N', 0, -176, { floor: 'concrete', ceil: 'concretedark', side: 'stepside', upper: 'concrete', c: -9999, head: 144 });
  K.wall(45, 43, 45, 54, 'concrete'); K.wall(51, 43, 51, 54, 'concrete');
  K.fixture(X(48) + 16, Z(60), 144, 120, 'x', 'lightred', 0); K.light(X(48), 110, Z(59), 260, [1, 0.12, 0.08]);
  K.qoqC(44, 57, 0); K.slice(X(53), Z(62));
  K.lamp(X(46) + 4, 40, Z(49)); K.lamp(X(51) - 4, -60, Z(46)); K.slices([[X(48) + 16, Z(52)], [X(48) + 16, Z(46)]]);

  // ======================= MONITOR HALL (hub) =======================
  K.room(32, 18, 68, 42, HUB, 'brickdark');
  K.trim(X(32), Z(18), X(69), Z(43), 100, 8, 'trim');
  // balcony ring
  K.catwalk(X(32), Z(18), X(69), Z(21), -48, { rails: 's', gaps: [['s', X(32), X(36)], ['s', X(65), X(69)]], tex: 'grate', supports: [[X(40), Z(21) - 4], [X(50), Z(21) - 4], [X(60), Z(21) - 4]] });
  K.catwalk(X(32), Z(21), X(36), Z(34), -48, { rails: 'e', supports: [[X(36) - 4, Z(28)]] });
  K.catwalk(X(65), Z(21), X(69), Z(34), -48, { rails: 'w', supports: [[X(65) + 4, Z(28)]] });
  K.stairBrush(X(32), Z(34), X(36), Z(41), -176, -48, 'N'); K.stairBrush(X(65), Z(34), X(69), Z(41), -176, -48, 'N');
  // TV wall + monitors on the north wall above the balcony (image: the monitor room)
  K.brush([X(38), -30, Z(18)], [X(47), 112, Z(18) + 6], { tex: 'metal' }); K.decal({ at: [X(42) + 16, 40, Z(18) + 6], n: 'pz', w: 270, h: 132, tex: 'tv', fullbright: true });
  K.brush([X(54), -20, Z(18)], [X(63), 100, Z(18) + 6], { tex: 'metal' }); K.decal({ at: [X(58) + 16, 40, Z(18) + 6], n: 'pz', w: 270, h: 110, tex: 'monwall', fullbright: true });
  K.light(X(42), 30, Z(24), 280, [0.9, 0.6, 0.4]); K.light(X(58), 30, Z(24), 280, [0.45, 0.7, 1]);
  // lower floor: the drawer console, crates of pizza, CRT, chair, neon tubes
  K.counter(X(40), Z(38), X(60), Z(40) + 16, 56, 'drawer', 'nz', 'wood');
  K.decal({ at: [X(42), -146, Z(38)], n: 'nz', w: 52, h: 34, tex: 'crt', fullbright: true });
  K.crates(X(38), Z(26), -176, 1, 44); K.pizzaBoxes(X(38), Z(26), -132, 2); K.props(pr => pr.pizza(X(38), -122, Z(26), 24));
  K.crates(X(62), Z(27), -176, 2, 40); K.props(pr => pr.chair(X(50), Z(34), -176, Math.PI));
  K.fixture(X(42), Z(29), 144, 140, 'x', 'lightred', 300, [1, 1, 1], 1); K.fixture(X(58), Z(29), 144, 140, 'x', 'light', 360, [1, 1, 1], 2);
  K.fixture(X(50), Z(36), 144, 120, 'x', 'light', 320);
  for (const [c, r] of [[40, 26], [60, 26], [40, 36], [60, 36], [50, 30]]) K.light(X(c), -90, Z(r), 300, [1, 0.8, 0.6]);
  for (const r of [23, 27]) { K.lantern(X(32), -100, Z(r), 'px', 220); K.lantern(X(69), -100, Z(r), 'nx', 220); }
  for (const [x, z] of [[X(34), Z(24)], [X(67), Z(24)], [X(50), Z(20)]]) K.lamp(x, -70, z, 170);
  K.decal({ at: [X(32), -110, Z(30)], n: 'px', w: 70, h: 124, tex: 'map' }); K.decal({ at: [X(69), -110, Z(38)], n: 'nx', w: 66, h: 124, tex: 'poster' });
  K.brush([X(32), -150, Z(36)], [X(32) + 8, -40, Z(39)], { tex: 'metal' }); K.decal({ at: [X(32) + 8, -95, Z(37) + 16], n: 'px', w: 86, h: 104, tex: 'skyline', fullbright: true }); K.light(X(34), -95, Z(37), 200, [0.85, 0.35, 0.6]);
  K.props(pr => { pr.pipe(X(32), 130, Z(25), X(69), 130, Z(25), 3, 'metal'); pr.pipe(X(32), 122, Z(26), X(69), 122, Z(26), 2.5, 'chrome'); });
  K.qoqC(44, 32, 180); K.qoqC(58, 24, 180); K.qoq(X(50), Z(19) + 16, 180, { turret: true, y: -48 }); K.qoq(X(66) + 16, Z(30), 90, { turret: true, y: -48 });
  K.slices([[X(50), Z(28)], [X(34), Z(26), -48], [X(67), Z(26)]]); K.juice(X(56), Z(40) + 28); K.health(X(44), Z(40) + 28);
  K.ambient(X(50), -100, Z(30), 'hum', 700, 0.8);
  // red key wave: Qoqs teleport into the hall when you grab the red keycard
  K.wave('redkey', { onKey: 'red', msg: 'The Qoqs heard you! They are swarming the Monitor Hall!' });
  for (const [c, r, y] of [[40, 30], [60, 32], [50, 40], [34, 20, -48], [67, 20, -48], [52, 26]]) K.qoq(C(c), C(r), 180, { wave: 'redkey', y });

  // ======================= STORAGE WING (red key) =======================
  K.room(6, 14, 28, 40, STORE, 'brick');
  K.paint(29, 28, 31, 31, T({ f: -176, c: -32, floor: 'tilebrown', ceil: 'ceil', side: 'trim', upper: 'brickdark' }));
  // crate aisles
  for (let r = 18; r <= 36; r += 6) for (let c = 13; c <= 25; c += 6) { const h = ((r + c) % 3) + 1; K.crates(C(c), C(r), -176, h, 44); if (h === 1) K.pizzaBoxes(C(c), C(r), -132, 2); }
  // mezzanine along the west wall, reached by a crate staircase
  K.catwalk(X(6), Z(15), X(10), Z(38), -112, { rails: 'e', gaps: [['e', Z(33), Z(38)]], tex: 'boards', top: 'boards' });
  K.crates(X(10) + 16, Z(35) + 16, -176, 1, 32); K.crates(X(10) + 16, Z(34) + 16, -176, 2, 32);
  K.key('red', X(8), Z(17), -112); K.slices([[X(8), Z(24)], [X(8), Z(30)]], -112);
  K.fixture(X(17), Z(20), -16, 120, 'x', 'light', 300); K.fixture(X(17), Z(34), -16, 120, 'x', 'light', 280, [1, 1, 1], 2); K.lamp(X(8), -40, Z(20), 180);
  K.msg([X(11), -176, Z(30)], [X(16), -80, Z(38)], 'Jump up the crates to the mezzanine!');
  K.qoqC(16, 24, 90); K.qoqC(22, 30, 0); K.qoqC(16, 38, 0); K.qoq(X(8), Z(28), 90, { turret: true, y: -112 });
  K.juice(X(26), Z(16)); K.slice(X(26), Z(38));
  // secret closet behind boards in the north wall
  K.paint(10, 8, 16, 10, T(STORE)); K.paint(12, 11, 14, 13, T(STORE));
  K.breakable([X(12), -176, Z(13)], [X(15), -16, Z(13) + 10], { tex: 'boards', health: 24, secret: true });
  K.health(X(11), Z(9)); K.juice(X(15), Z(9)); K.slices([[X(13), Z(9)]]); K.light(X(13), -100, Z(9), 170, [1, 0.6, 0.3], 3);

  // ======================= SAUCE WORKS (blue key) =======================
  K.room(70, 6, 84, 38, SAUCE, 'rustpanel');
  K.door(69, 30, 69, 33, HUB, { key: 'red', name: 'reddoor', top: 120 });
  K.paint(70, 6, 72, 24, T(UPPER)); K.paint(70, 6, 84, 8, T(UPPER)); K.paint(82, 9, 84, 12, T(UPPER));
  K.door(69, 20, 69, 22, UPPER, { top: 112, name: 'balconydoor' });
  K.pool(74, 10, 76, 36, SAUCE, 'sauce', 24, 10); K.pool(79, 10, 81, 36, SAUCE, 'sauce', 24, 10);
  for (const r of [14, 24, 32]) { K.catwalk(X(74), Z(r), X(77), Z(r + 2), -176, { tex: 'grate', rails: '' }); K.catwalk(X(79), Z(r), X(82), Z(r + 2), -176, { tex: 'grate' }); }
  K.lift([X(82), -176, Z(13)], [X(85), -160, Z(16)], 112, { wait: 3 });
  K.sign(X(83) + 16, 40, Z(39), 'nz', 'sign_lift', 80, 20);
  K.key('blue', X(83) + 16, Z(10), -48);
  for (const [c, r] of [[78, 20], [78, 30], [84, 26]]) K.props((pr, ctx) => { pr.cylinder(C(c), -176, C(r), 26, 90, 'chrome', { segs: 16 }); pr.cylinder(C(c), -86, C(r), 28, 4, 'metal', { segs: 16 }); ctx.brush([C(c) - 22, -176, C(r) - 22], [C(c) + 22, -86, C(r) + 22], { invisible: true, noshadow: true }); });
  K.props(pr => { for (const z of [Z(12), Z(22), Z(34)]) pr.pipe(X(70), 60, z, X(85), 60, z, 5, 'rust'); pr.pipe(X(77) + 16, 96, Z(6), X(77) + 16, 96, Z(39), 4, 'metal'); });
  K.emitter([X(76), -176, Z(18)], [X(77), -150, Z(19)], 'steam', 6); K.emitter([X(80), -176, Z(28)], [X(81), -150, Z(29)], 'steam', 6);
  for (const [x, z] of [[X(71), Z(30)], [X(84), Z(30)], [X(71), Z(12)], [X(78), Z(7)]]) K.lamp(x + 16, 60, z, 200);
  K.sign(X(77) + 16, 60, Z(39), 'nz', 'sign_sewer', 160, 36);
  K.ambient(X(77), -100, Z(22), 'machine', 600, 0.9);
  K.qoqC(73, 34, 0); K.marvC(83, 34, 0); K.qoqC(78, 18, 180); K.item('sausages', X(72), Z(36), { amount: 12 }); K.qoq(X(71), Z(10), 180, { turret: true, y: -48 });
  K.wave('works', { min: [X(73), -176, Z(26)], max: [X(84), -60, Z(30)], lock: ['reddoor'], msg: 'Locked in the Sauce Works!' });
  for (const [c, r] of [[73, 12], [84, 20], [77, 37], [82, 30]]) K.qoqC(c, r, 180, { wave: 'works' });
  K.wave('bluekey', { onKey: 'blue', msg: 'Alarms! Qoqs on the walkways!' });
  for (const [c, r] of [[71, 16], [71, 22], [76, 7], [80, 7]]) K.qoq(C(c), C(r), 90, { wave: 'bluekey', y: -48 });
  K.slices([[X(77) + 16, Z(15)], [X(80) + 16, Z(25)], [X(71), Z(18)], [X(84), Z(7)]]); K.juice(X(71), Z(36)); K.health(X(84), Z(36)); K.juice(X(71), Z(7), -48);

  // ======================= OFFICE (blue door) & EXIT CORRIDOR =======================
  K.room(40, 4, 60, 16, OFFICE, 'brickdark');
  K.door(48, 17, 52, 17, OFFICE, { key: 'blue', top: 112 });
  K.desk(X(42), Z(5), X(50), Z(7), 'pz'); K.desk(X(52), Z(5), X(58), Z(7), 'pz', 'monitors');
  K.poster(X(40), 20, Z(10), 'px', 'poster', 50, 90); K.decal({ at: [X(61), 10, Z(12)], n: 'nx', w: 70, h: 110, tex: 'skyline', fullbright: true });
  K.crates(X(58), Z(14), -48, 2, 36); K.pizzaBoxes(X(44), Z(14), -48, 3);
  K.fixture(X(50), Z(10), 96, 140, 'x', 'light', 330); K.lamp(X(42), 60, Z(14), 170);
  K.qoqC(46, 10, 180); K.marvC(56, 12, 180); K.item('sausages', X(42), Z(14), { amount: 12 });
  // shoot the red button above the door to open the stash
  K.door(39, 8, 39, 10, OFFICE, { tex: 'brickred', targeted: true, name: 'stash', wait: -1, top: 104 }); K.paint(36, 8, 38, 10, T(OFFICE));
  K.button({ min: [X(60) + 20, 40, Z(15)], max: [X(61), 56, Z(16)], shoot: true, target: 'stash', msg: 'A hidden panel slides open...' });
  K.secret([X(36), -48, Z(8)], [X(39), 60, Z(11)]); K.health(X(37), Z(9)); K.juice(X(37), Z(10)); K.slice(X(38), Z(9));
  K.paint(58, 1, 60, 3, T(OFFICE));
  K.stairs(61, 1, 85, 3, 'E', -44, 48, { floor: 'diamond', ceil: 'steeldark', side: 'stepside', c: -9999, head: 128 });
  K.room(86, 1, 90, 38, CORR, 'rustpanel');
  for (const r of [6, 14, 22, 30]) K.lamp(X(88) + 16, 150, Z(r), 210);
  K.qoqC(88, 12, 180); K.marvC(89, 24, 180); K.item('sausages', X(88), Z(32), { amount: 12 }); K.slices([[X(88), Z(8)], [X(88), Z(20)]]); K.juice(X(87), Z(30));
  K.exit(X(91), 48, Z(34), 'nx');
  K.door(87, 39, 90, 39, CORR, { targeted: true, name: 'dockdoor', top: 112 });
  K.button({ min: [X(86), 70, Z(37)], max: [X(86) + 8, 90, Z(38)], target: 'dockdoor', msg: 'The loading dock door rolls up.' });

  // bot route: soaker, red key, blue key, then the exit
  K.goal(X(16), Z(82)); K.goal(X(8), Z(17), -112); K.goal(X(83) + 16, Z(10), -48);
});
