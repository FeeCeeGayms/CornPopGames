// E3M7 (the original v0.24 E1M7, now part of Episode 3: The Pidser Cave) — HORNT JAIL. "No hope. No escape. Only time." Two-tier cell blocks face each other across Cell
// Block A (images: Hornt Jail, cells 101-103), with the guard desk and its monitors in the middle. Up to the
// Warden's office (red key, lockdown), down into Solitary (blue key), out across the rain-soaked Exercise
// Yard and its guard towers (gold key) and into the evidence Vault.
import { makeLevel } from '../kit.js';

export default makeLevel({
  name: 'E3M7', title: 'E3M7: HORNT JAIL', ambience: 'cave', music: 'assets/music/e1m7.mp3', ambient: 38,
  fog: { color: [0.03, 0.03, 0.035], density: 0.00034 },
  rain: { min: [640, 0, 128], max: [2912, 448, 1312] },
  styles: [{ color: [1, 0.5, 0.15], pattern: 'candle' }, { color: [1, 0.15, 0.08], pattern: 'pulse' }, { color: [1, 1, 0.95], pattern: 'fluoro' }, { color: [1, 0.55, 0.2], pattern: 'flicker' }],
  // the Pidser Cave bunker (v0.29): riveted plates, warm lamps, floors polished enough to mirror them
  lightTint: [1, 0.9, 0.74], gloss: 1, retex: {'concrete': 'bunkerplate', 'concretedark': 'bunkerdark', 'steel': 'bunkerbig', 'steeldark': 'bunkerceil', 'ceil': 'bunkerceil', 'trim': 'bunkertrim', 'stepside': 'bunkertrim', 'diamond': 'bunkerfloor', 'tile': 'bunkerfloor', 'tilebrown': 'bunkerfloor2', 'rustpanel': 'bunkerrust', 'jailfloor': 'bunkerfloor', 'jaildark': 'bunkerdark', 'jailmetal': 'bunkerplate', 'brickdark': 'bunkerplate'},
}, 112, 104, 'jailmetal', K => {
  const { X, Z, C } = K; const T = s => K.type(s);
  const INT = { f: 0, c: 192, floor: 'jailfloor', ceil: 'jaildark', side: 'trim', upper: 'jailmetal' };
  const HALL = { f: 0, c: 352, floor: 'jailfloor', ceil: 'jaildark', side: 'stepside', upper: 'jailmetal' };
  const SOL = { f: 0, c: 144, floor: 'jailfloor', ceil: 'jaildark', side: 'trim', upper: 'jailmetal' };
  const WARD = { f: 136, c: 288, floor: 'carpet', ceil: 'plaster', side: 'trim', upper: 'wood' };
  const YARD = { f: 0, c: 448, floor: 'asphalt', ceil: 'sky', sky: true, side: 'stepside', upper: 'concretedark' };
  const PASS = { f: 0, c: 160, floor: 'jailfloor', ceil: 'jaildark', side: 'trim', upper: 'jailmetal' };
  const VLT = { f: 0, c: 256, floor: 'diamond', ceil: 'steeldark', side: 'trim', upper: 'steel' };
  const NUMS = Array.from({ length: 40 }, (_, i) => ['cell101', 'cell102', 'cell103'][i % 3]);

  // ---------------- INTAKE (start) ----------------
  K.room(80, 88, 92, 100, INT, 'jaildark');
  K.start(86, 98, 0);
  K.desk(X(81), Z(92), X(84), Z(96), 'px'); K.props(pr => pr.stool(X(85), Z(94), 0));
  K.sign(X(86), 150, Z(101), 'nz', 'sign_psafe', 120, 40); K.decal({ at: [X(80), 100, Z(97)], n: 'px', w: 60, h: 60, tex: 'badge_hornt' });
  K.lantern(X(80), 130, Z(91), 'px'); K.lantern(X(93), 130, Z(91), 'nx'); K.lantern(X(93), 130, Z(98), 'nx');
  K.juice(X(91), Z(99)); K.health(X(91), Z(95)); K.slice(X(82), Z(99)); K.crates(C(91), C(90), 0, 1, 40);
  K.paint(84, 86, 87, 87, T(PASS));
  K.gate(84, 85, 87, 85, PASS, 'intake', { targeted: true, wait: -1 });
  K.button({ min: [X(88), 40, Z(88)], max: [X(88) + 8, 60, Z(88) + 24], target: 'intake', msg: 'Intake gate opening. Welcome to Hornt Jail.' });
  K.decal({ at: [X(88) + 8, 50, Z(88) + 12], n: 'px', w: 20, h: 20, tex: 'buttongreen' });
  K.brush([X(88), 0, Z(88)], [X(88) + 8, 40, Z(88) + 24], { tex: 'jaildark', top: 'metal' });
  K.ambient(X(86), 60, Z(94), 'hum', 400, 0.5);
  K.light(X(86), 150, Z(94), 340, [1, 0.8, 0.55]); K.fixture(X(86), Z(90), 192, 120, 'x', 'light', 260, [1, 0.95, 0.85], 2);

  // ---------------- CELL BLOCK A (the Hornt Jail images) ----------------
  K.room(20, 50, 90, 84, HALL, 'jailmetal');
  const lockN = [1, 4, 8, 12, 14, 18, 23, 27], lockS = [2, 6, 10, 17, 21, 25];
  K.cellBlock({ x0: X(22), zWall: Z(50), dir: 1, count: 16, y0: 0, numbers: NUMS, broken: [5, 19], open: [0, 9, 16, 30], name: (t, i) => `N${t}_${i}`,
    railGaps: [], loot: (tier, i, cx, cz, yb) => {
      const idx = tier * 16 + i;
      if (lockN.includes(idx)) K.qoq(cx, cz, 0, { wave: 'lockdown', y: yb });
      else if (idx % 4 === 0) K.juice(cx, cz, yb); else if (idx % 7 === 3) K.health(cx, cz, yb); else if (idx % 5 === 2) K.slice(cx, cz, yb);
    } });
  K.cellBlock({ x0: X(22), zWall: Z(85), dir: -1, count: 16, y0: 0, numbers: NUMS, broken: [3, 28], open: [8, 13, 20], name: (t, i) => `S${t}_${i}`,
    loot: (tier, i, cx, cz, yb) => {
      const idx = tier * 16 + i;
      if (lockS.includes(idx)) K.qoq(cx, cz, 180, { wave: 'lockdown', y: yb });
      else if (idx % 4 === 1) K.juice(cx, cz, yb); else if (idx % 6 === 4) K.health(cx, cz, yb); else if (idx % 5 === 0) K.slice(cx, cz, yb);
    } });
  // stairs and landings to the upper tiers
  K.stairBrush(X(20), Z(56), X(22), Z(65), 0, 136, 'N'); K.catwalk(X(20), Z(54), X(22), Z(56), 136, { rails: 'w' });
  K.stairBrush(X(20), Z(70), X(22), Z(79), 0, 136, 'S'); K.catwalk(X(20), Z(79), X(22), Z(81), 136, { rails: 'w' });
  K.stairBrush(X(81), Z(70), X(84), Z(79), 0, 136, 'S'); K.catwalk(X(78), Z(79), X(84), Z(81), 136, { rails: 'e' });
  K.stairBrush(X(87), Z(57), X(91), Z(66), 0, 136, 'N'); K.catwalk(X(78), Z(54), X(91), Z(57), 136, { rails: 's', gaps: [['s', X(87), X(91)]], supports: [[X(83), Z(57) - 4]] });
  // HORNT JAIL neon + slogan + badge on the west wall, monitors desk in the middle
  K.sign(X(20), 285, Z(67) + 16, 'px', 'neon_hornt', 150, 112); K.light(X(22), 275, Z(67) + 16, 300, [1, 0.45, 0.15], 2);
  K.sign(X(20), 212, Z(67) + 16, 'px', 'sign_nohope', 160, 34, false); K.decal({ at: [X(20), 158, Z(67) + 16], n: 'px', w: 56, h: 56, tex: 'badge_hornt' });
  K.desk(X(50), Z(65), X(60), Z(67), 'pz'); K.desk(X(50), Z(69), X(60), Z(71), 'nz');
  K.props(pr => { pr.chair(X(52), Z(68) - 10, 0, 0); pr.chair(X(58), Z(68) + 10, 0, Math.PI); pr.barrel(X(62), Z(68), 0, 12, 30, 'metal'); });
  K.skylight(X(36), Z(67) + 16, 352, 0, 160, 128, 400); K.skylight(X(68), Z(67) + 16, 352, 0, 160, 128, 400);
  for (const c of [28, 44, 60, 76]) K.fixture(X(c), Z(67) + 16, 352, 120, 'x', 'light', 260, [1, 0.95, 0.85], c === 44 ? 2 : 0);
  K.emitter([X(20), 0, Z(56)], [X(91), 300, Z(79)], 'dust', 14); K.ambient(X(55), 80, Z(67), 'drip', 1200, 1);
  for (const [c, r] of [[30, 62], [42, 74], [66, 62], [74, 74], [36, 68], [84, 66]]) K.qoqC(c, r, 90);
  for (const [x, z] of [[X(30), Z(55)], [X(70), Z(55)], [X(46), Z(80)], [X(62), Z(80)]]) K.qoq(x, z, z < Z(60) ? 0 : 180, { turret: true, y: 136 });
  K.slices([[X(26), Z(67)], [X(86), Z(60)], [X(55), Z(62)], [X(55), Z(74)]]); K.juice(X(24), Z(62)); K.juice(X(88), Z(76)); K.juice(X(40), Z(66)); K.health(X(70), Z(70)); K.health(X(24), Z(74));
  // secret: an open cell on the upper north tier still holds a prisoner's stash
  K.secret([X(22) + 16 + 14 * 112, 136, Z(50)], [X(22) + 16 + 14 * 112 + 96, 240, Z(54)]); K.juice(X(22) + 16 + 14 * 112 + 30, Z(51), 136, 80); K.health(X(22) + 16 + 14 * 112 + 70, Z(52), 136);
  K.wave('lockdown', { onKey: 'red', msg: 'LOCKDOWN! The cell doors grind open on every tier!', release: [...lockN.map(i => `N${i >= 16 ? 1 : 0}_${i % 16}`), ...lockS.map(i => `S${i >= 16 ? 1 : 0}_${i % 16}`)], stagger: 0.25 });

  // ---------------- WARDEN'S OFFICE (upper east, red key) ----------------
  K.door(91, 54, 91, 56, WARD, { top: 112, tex: 'door' });
  K.room(92, 44, 108, 64, WARD, 'wood');
  K.desk(X(98), Z(48), X(104), Z(51), 'pz', 'monitors');
  K.brush([X(99), 176, Z(51)], [X(103), 179, Z(52)], { tex: 'wood', solid: false });
  K.key('red', X(101), Z(53), 136);
  K.bookshelf(X(92), Z(44), X(93) + 8, Z(52), 120, 'px'); K.bookshelf(X(108) - 8, Z(44), X(109), Z(56), 120, 'nx');
  K.couch(X(94), Z(60), X(99), Z(63) + 16, 's'); K.rug(X(100), Z(56), 180, 120, 'carpet');
  K.decal({ at: [X(101), 220, Z(44)], n: 'pz', w: 80, h: 80, tex: 'badge_hornt' }); K.sign(X(101), 270, Z(44), 'pz', 'sign_warden', 160, 36);
  K.decal({ at: [X(109), 190, Z(60)], n: 'nx', w: 50, h: 50, tex: 'clock333' }); K.poster(X(92), 210, Z(60), 'px', 'pot_right', 50, 82);
  K.lamp(X(95), 250, Z(46), 200); K.lamp(X(107), 250, Z(46), 200); K.fixture(X(100), Z(56), 288, 120, 'x', 'lightamber', 300, [1, 0.8, 0.55]);
  K.qoqC(96, 52, 90, { y: 136 }); K.qoqC(106, 60, -90, { y: 136 }); K.qoqC(100, 62, 0, { y: 136 });
  K.slices([[X(94), Z(48), 136], [X(106), Z(48), 136]]); K.juice(X(107), Z(63), 136); K.health(X(93), Z(58), 136);
  // secret: soak the badge above the warden's desk -> his private stash behind the east shelves
  K.button({ min: [X(101) - 30, 190, Z(44)], max: [X(101) + 30, 250, Z(44) + 4], shoot: true, target: 'stash', msg: 'The bookshelf swings aside!' });
  K.door(109, 58, 109, 60, WARD, { targeted: true, name: 'stash', wait: -1, tex: 'wood', top: 104 }); K.room(110, 57, 110, 61, { ...WARD, c: 240 }, 'wood');
  K.secret([X(110), 136, Z(57)], [X(111), 240, Z(62)]); K.health(X(110) + 16, Z(58), 136); K.juice(X(110) + 16, Z(60), 136, 80); K.slice(X(110) + 16, Z(61) + 16, 136);

  // ---------------- SOLITARY (red door, blue key) ----------------
  K.paint(18, 64, 18, 69, T(SOL)); K.door(19, 66, 19, 69, HALL, { key: 'red', top: 120, name: 'reddoor' });
  K.room(2, 40, 17, 91, SOL, 'jaildark');
  K.wall(2, 43, 6, 43, 'jaildark'); K.wall(13, 43, 17, 43, 'jaildark');
  K.wall(6, 44, 6, 63, 'jailmetal'); K.wall(13, 44, 13, 63, 'jailmetal'); K.wall(6, 70, 6, 91, 'jailmetal'); K.wall(13, 70, 13, 91, 'jailmetal');
  const solCells = [44, 49, 54, 59, 71, 76, 81, 86]; const solRelease = [];
  solCells.forEach((r0, i) => {
    for (const [cw0, cw1, gc, side] of [[2, 5, 6, 'w'], [14, 17, 13, 'e']]) {
      if (r0 < 64) K.wall(cw0, r0 + 4, cw1, r0 + 4, 'jaildark'); else K.wall(cw0, r0 - 1, cw1, r0 - 1, 'jaildark');
      const name = `sol${side}${i}`; const rel = (i + (side === 'e' ? 1 : 0)) % 2 === 0; K.gate(gc, r0, gc, r0 + 3, SOL, name, rel ? { targeted: true, wait: -1 } : { wait: 2 });
      K.brush([X(cw0), 0, Z(r0) + 8], [X(cw0) + 60, 16, Z(r0) + 48], { tex: 'metal', top: 'blanket' });
      K.light(C((cw0 + cw1) / 2), 110, C(r0 + 1.5), 90, [1, 0.6, 0.3], 3);
      if (rel) { solRelease.push(name); K.qoqC(side === 'w' ? 4 : 15, r0 + 2, side === 'w' ? 90 : -90, { wave: 'solitary' }); }
      else if (i % 3 === 0) K.juice(C(side === 'w' ? 3 : 16), C(r0 + 2));
    }
  });
  K.wall(2, 90, 5, 91, 'jaildark'); K.wall(14, 90, 17, 91, 'jaildark');
  K.decal({ at: [X(9) + 16, 100, Z(92)], n: 'nz', w: 140, h: 36, tex: 'sign_solitary', fullbright: true });
  for (const r of [46, 53, 60, 74, 81, 88]) K.lantern(X(7), 110, C(r), 'px', 160, 3);
  for (const r of [45, 52, 59, 66, 73, 80, 87]) K.light(X(10), 120, C(r), 260, [1, 0.7, 0.4], r % 2 ? 3 : 0);
  for (const r of [48, 62, 76, 88]) K.fixture(X(10), C(r), 144, 96, 'x', 'lightamber', 200, [1, 0.75, 0.45], 2);
  K.gate(7, 43, 12, 43, SOL, 'solgate', { targeted: true, wait: -1 });
  K.decal({ at: [X(10), 0, Z(67)], n: 'up', w: 52, h: 52, tex: 'buttongreen', off: 0.5 }); K.button({ min: [X(9) + 8, 0, Z(66) + 8], max: [X(11) - 8, 4, Z(68) - 8], target: 'solgate', msg: 'Somewhere at the end of the block a gate rumbles open...' });
  K.brush([X(8), 0, Z(40)], [X(12), 32, Z(41)], { tex: 'jaildark', top: 'metal' }); K.key('blue', X(10), Z(42), 0); K.light(X(10), 80, Z(41), 200, [0.4, 0.6, 1], 3);
  K.wave('solitary', { onKey: 'blue', msg: 'The solitary cells open. Their tenants are hungry.', release: solRelease, stagger: 0.3 });
  K.qoqC(9, 50, 180); K.qoqC(10, 78, 180); K.qoqC(4, 66, 90); K.qoqC(15, 67, -90);
  K.slices([[X(9), Z(88)], [X(10), Z(56)], [X(3), Z(41)], [X(16), Z(41)]]); K.juice(X(8), Z(64)); K.juice(X(11), Z(90)); K.health(X(16), Z(65)); K.health(X(3), Z(68));
  K.ambient(X(9), 60, Z(66), 'drip', 800, 1);

  // ---------------- EXERCISE YARD (blue door, open sky, guard towers, gold key) ----------------
  K.paint(84, 41, 87, 48, T(PASS)); K.door(84, 49, 87, 49, HALL, { key: 'blue', top: 120, name: 'bluedoor' });
  K.room(20, 4, 90, 40, YARD, 'concretedark');
  K.sign(X(86), 120, Z(41), 'nz', 'sign_yard', 160, 36);
  // fences
  for (const [x0, z0, x1, z1] of [[X(20), Z(24), X(44), Z(24) + 4], [X(52), Z(24), X(76), Z(24) + 4], [X(56), Z(10), X(56) + 4, Z(24)]]) K.brush([x0, 0, z0], [x1, 120, z1], { tex: 'bars', fit: true, noshadow: true });
  // guard towers with lifts
  for (const [c, r, gold] of [[26, 8, false], [80, 8, true], [36, 32, false]]) {
    K.brush([X(c), 0, Z(r)], [X(c + 4), 168, Z(r + 4)], { tex: 'concretedark', top: 'grate' });
    K.brush([X(c), 168, Z(r)], [X(c + 4), 200, Z(r) + 2], { tex: 'railing', fit: true, noshadow: true }); K.brush([X(c), 168, Z(r + 4) - 2], [X(c + 4), 200, Z(r + 4)], { tex: 'railing', fit: true, noshadow: true });
    K.brush([X(c) + 8, 248, Z(r) + 8], [X(c + 4) - 8, 256, Z(r + 4) - 8], { tex: 'rust', bottom: 'metal', solid: false });
    for (const [px, pz] of [[X(c) + 6, Z(r) + 6], [X(c + 4) - 10, Z(r) + 6], [X(c) + 6, Z(r + 4) - 10], [X(c + 4) - 10, Z(r + 4) - 10]]) K.brush([px, 168, pz], [px + 4, 248, pz + 4], { tex: 'metal', solid: false });
    K.lift([X(c + 4), 0, Z(r + 1)], [X(c + 7), 8, Z(r + 4)], 160, { wait: 2 });
    K.light(X(c + 2), 230, Z(r + 2), 380, [1, 0.95, 0.8], 2);
    if (gold) K.key('gold', X(c + 2), Z(r + 2), 168); else K.qoq(X(c + 2), Z(r + 2), 180, { turret: true, y: 168 });
  }
  for (const [c, r] of [[46, 14], [66, 18], [30, 18], [72, 32], [48, 34], [60, 30]]) K.crates(C(c), C(r), 0, 1 + ((c + r) % 2), 40);
  K.props(pr => { for (const [c, r] of [[64, 34], [66, 34], [40, 14]]) pr.barrel(X(c), Z(r), 0, 14, 34, 'rust'); });
  K.decal({ at: [X(66), 0, Z(30)], n: 'up', w: 200, h: 160, tex: 'hazard', off: 0.4 });
  K.light(X(48), 300, Z(20), 460, [0.6, 0.7, 0.9]); K.light(X(70), 300, Z(28), 400, [0.6, 0.7, 0.9]); K.light(X(30), 300, Z(30), 380, [0.6, 0.7, 0.9]);
  K.ambient(X(55), 200, Z(22), 'wind', 1400, 1);
  for (const [c, r] of [[24, 6], [88, 4], [24, 38], [88, 38]]) { K.lamp(X(c), 160, Z(r), 360, [1, 0.85, 0.6]); }
  K.light(X(55), 360, Z(12), 520, [0.55, 0.65, 0.9]); K.light(X(55), 360, Z(34), 480, [0.55, 0.65, 0.9]);
  K.qoqC(46, 8, 180); K.qoqC(66, 8, 180); K.qoqC(30, 34, 90); K.qoqC(76, 20, -90); K.qoqC(54, 30, 0); K.qoqC(84, 36, 0);
  K.wave('gold', { onKey: 'gold', msg: 'Searchlights! The tower guards come running!' });
  for (const [c, r] of [[22, 6], [22, 38], [88, 38], [60, 6], [44, 38], [70, 14], [88, 20], [50, 20]]) K.qoqC(c, r, 0, { wave: 'gold', delay: (c % 4) * 0.4 });
  // secret: loose boards in the yard's north wall
  K.paint(60, 1, 64, 3, T({ ...PASS, c: 128 })); K.breakable([X(60), 0, Z(3)], [X(65), 128, Z(4)], { tex: 'boards', health: 18, secret: true });
  K.health(X(61), Z(2)); K.juice(X(63), Z(2), undefined, 80); K.slice(X(62), Z(1) + 16);
  K.slices([[X(24), Z(28)], [X(50), Z(6)], [X(88), Z(6)], [X(60), Z(38)], [X(28), Z(10), 168]]); K.juice(X(22), Z(20)); K.juice(X(88), Z(28)); K.juice(X(56), Z(26) + 16); K.juice(X(40), Z(6)); K.health(X(76), Z(38)); K.health(X(22), Z(32));

  // ---------------- EVIDENCE VAULT (gold door, final wave, exit) ----------------
  K.door(19, 16, 19, 19, YARD, { key: 'gold', tex: 'door_gold', top: 128, name: 'golddoor' });
  K.room(2, 4, 18, 36, VLT, 'steel');
  K.decal({ at: [X(20), 70, Z(13)], n: 'px', w: 90, h: 90, tex: 'vaultdoor', off: 0.8 }); K.sign(X(20), 170, Z(18), 'px', 'sign_vaults', 140, 32);
  for (const [c, r] of [[5, 8], [15, 8], [5, 30], [15, 30]]) K.column(C(c), C(r), 28, 0, 256, 'steel');
  for (const r of [12, 18, 24]) K.brush([X(3), 0, Z(r)], [X(4) + 16, 110, Z(r + 3)], { tex: 'drawer', top: 'metal' });
  for (const r of [9, 24]) K.brush([X(17), 0, Z(r)], [X(19), 110, Z(r + 3)], { tex: 'drawer', top: 'metal' });
  K.decal({ at: [X(5), 110, Z(4)], n: 'pz', w: 90, h: 120, tex: 'safe' });
  K.pizzaBoxes(C(9), C(14), 0, 6); K.pizzaBoxes(C(11), C(26), 0, 5);
  K.skylight(X(10), Z(20), 256, 0, 128, 192, 380);
  K.wave('vault', { min: [X(6), 0, Z(10)], max: [X(14), 120, Z(30)], lock: ['golddoor'], msg: 'The evidence locker was a trap! The guards pour in!', doneMsg: 'The vault is clear. The exit opens!', opens: ['exitgate'], stagger: 0.45 });
  for (const [c, r] of [[3, 6], [17, 6], [3, 34], [17, 34], [10, 34], [10, 6], [7, 20], [17, 20]]) K.qoqC(c, r, 0, { wave: 'vault' });
  K.slices([[X(6), Z(20)], [X(14), Z(20)]]); K.juice(X(8), Z(34)); K.juice(X(12), Z(6)); K.health(X(4), Z(28)); K.health(X(16), Z(10));
  K.door(9, 3, 11, 3, VLT, { targeted: true, name: 'exitgate', wait: -1, tex: 'door_red', top: 128 });
  K.room(9, 1, 11, 2, VLT, 'steel');
  K.exit(X(10) + 16, 0, Z(1), 'pz');

  K.goal(X(88) + 24, Z(88) + 12, 0); K.goal(X(101), Z(53), 136, { wait: 14 }); K.goal(X(12), Z(67), 0); K.goal(X(10), Z(42), 0, { wait: 10 }); K.goal(X(82), Z(10), 168, { wait: 12 }); K.goal(X(10), Z(20), 0, { wait: 12 });

  K.ruins({'seed': 3287, 'mode': 'bunker', 'theme': 'bunker', 'big': 22, 'lights': 30});
});
