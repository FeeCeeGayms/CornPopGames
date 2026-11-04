// E1M6 — POTATO QUARTERS. The Order's living wing: a long dormitory corridor lined with potato-power
// bedrooms (image: bedroom), the Greenhouse (red key), the two-storey Lounge with its porthole skyline
// windows (image: lounge), the Library (blue key behind the book switches) and the rooftop Observation Deck.
import { makeLevel } from '../kit.js';

export default makeLevel({
  name: 'E1M6', title: 'E1M6: POTATO QUARTERS', ambience: 'kitchen', music: 'assets/music/e1m6.mp3', ambient: 18,
  fog: { color: [0.035, 0.028, 0.02], density: 0.0003 },
  styles: [{ color: [1, 0.5, 0.15], pattern: 'candle' }, { color: [1, 0.3, 0.1], pattern: 'neon' }, { color: [1, 1, 0.95], pattern: 'fluoro' }, { color: [0.4, 1, 0.45], pattern: 'gentle' }],
}, 112, 104, 'brickdark', K => {
  const { X, Z, C } = K; const T = s => K.type(s);
  const LOB = { f: 0, c: 192, floor: 'carpet', ceil: 'plaster', side: 'trim', upper: 'plaster' };
  const CORR = { f: 0, c: 176, floor: 'carpet', ceil: 'plaster', side: 'trim', upper: 'brickdark' };
  const BED = { f: 0, c: 160, floor: 'wood', ceil: 'plaster', side: 'trim', upper: 'plaster' };
  const LNG = { f: 0, c: 384, floor: 'wood', ceil: 'ceil', side: 'stepside', upper: 'brickdark' };
  const LGAL = { f: 176, c: 384, floor: 'wood', ceil: 'ceil', side: 'stepside' };
  const LIB = { f: 0, c: 320, floor: 'carpet', ceil: 'ceil', side: 'trim', upper: 'wood' };
  const GRN = { f: 0, c: 320, floor: 'tilebrown', ceil: 'steeldark', side: 'stepside', upper: 'concretedark' };
  const OBS = { f: 176, c: 512, floor: 'diamond', ceil: 'sky', side: 'stepside', sky: true };
  const POSTERS = ['pot_fuel', 'pot_glorious', 'pot_heroes', 'pot_right', 'pot_soil'];

  // a potato-power bedroom (image: bedroom). side 's' = room south of the corridor (door on its north edge)
  const bedroom = (c0, side, v, o = {}) => {
    const r0 = side === 's' ? 87 : 67, c1 = c0 + 9, r1 = r0 + 11, mid = (r0 + r1) / 2;
    K.room(c0, r0, c1, r1, BED, v % 2 ? 'brick' : 'brickdark');
    const dr = side === 's' ? r0 - 1 : r1 + 1, name = `bed${c0}${side}`;
    K.door(c0 + 4, dr, c0 + 5, dr, BED, { name, top: 112, tex: 'door' });
    const backZ = side === 's' ? Z(r1 + 1) : Z(r0), bn = side === 's' ? 'nz' : 'pz';
    K.bed(X(c0) + 46, C(mid), 'x');
    K.brush([X(c0), 0, C(mid) - 60], [X(c0) + 24, 30, C(mid) - 32], { tex: 'drawer', top: 'wood' }); K.lavaLamp(X(c0) + 12, C(mid) - 46, 30);
    K.poster(X(c0) + 64, 96, backZ, bn, POSTERS[v % 5], 48, 80); K.poster(X(c0) + 160, 96, backZ, bn, POSTERS[(v + 2) % 5], 48, 80);
    if (v % 3 === 0) K.sign(X(c0) + 250, 110, backZ, bn, 'neon_potato', 64, 48); else K.poster(X(c0) + 250, 96, backZ, bn, POSTERS[(v + 4) % 5], 48, 80);
    K.brush([X(c1) - 8, 0, C(mid) - 40], [X(c1 + 1), 40, C(mid) + 40], { tex: 'cabinet', top: 'wood' }); K.tv(X(c1 + 1), 58, C(mid), 'nx', v % 2 ? 'tv_pizza' : 'tv_blue', 40, 30);
    K.bookshelf(X(c1) - 8, side === 's' ? Z(r1) - 8 : Z(r0), X(c1 + 1), side === 's' ? Z(r1 + 1) : Z(r0) + 40, 100, 'nx');
    K.rug(C(c0 + 5), C(mid) + 8, 84, 84, 'rug_slice');
    K.potatoes([[X(c0) + 120, C(mid) + 70], [X(c0) + 132, C(mid) + 78], [X(c1) - 20, C(mid) + 50]]);
    if (v % 2) K.pizzaBoxes(X(c0) + 200, side === 's' ? Z(r1) - 20 : Z(r0) + 52, 0, 3);
    K.light(C(c0 + 5), 130, C(mid), 230, [1, 0.62, 0.32], v % 4 === 1 ? 1 : 0); K.lamp(X(c0) + 10, 70, C(mid) - 46, 90);
    if (o.loot) o.loot(c0, r0, c1, r1, mid);
    return name;
  };

  // ---------------- arrival lobby ----------------
  K.room(48, 88, 62, 100, LOB, 'plaster');
  K.paint(52, 86, 58, 87, T(LOB));
  K.start(55, 98, 0);
  K.sign(X(55), 150, Z(88), 'pz', 'sign_quarters', 200, 40);
  K.couch(X(49), Z(92), X(51), Z(97), 'w'); K.couch(X(60), Z(92), X(62) + 32, Z(97), 'e');
  K.rug(X(55), Z(94), 160, 120, 'carpet'); K.poster(X(48), 96, Z(94), 'px', 'pot_glorious', 50, 82); K.poster(X(63), 96, Z(94), 'nx', 'pot_heroes', 50, 82);
  K.fixture(X(55), Z(95), 192, 120, 'x', 'light', 280, [1, 0.95, 0.85]);
  K.juice(X(50), Z(99)); K.health(X(61), Z(99)); K.slice(X(55), Z(90));

  // ---------------- dormitory corridor ----------------
  K.room(6, 80, 106, 85, CORR, 'brickdark');
  for (let c = 10; c <= 102; c += 8) K.fixture(X(c), Z(82) + 16, 176, 96, 'x', 'light', 240, [1, 0.92, 0.8], c % 24 === 2 ? 2 : 0);
  for (const c of [16, 30, 46, 62, 76, 90, 102]) { K.column(X(c), Z(80) + 12, 24, 0, 176, 'brickdark'); K.column(X(c), Z(86) - 12, 24, 0, 176, 'brickdark'); }
  for (const [c, n] of [[17, 'pz'], [45, 'nz'], [63, 'pz'], [90, 'nz']]) K.poster(X(c), 96, n === 'pz' ? Z(80) : Z(86), n, POSTERS[c % 5], 48, 80);
  K.couch(X(46), Z(80), X(50), Z(81) + 8, 'n'); K.couch(X(77), Z(85) - 8, X(81), Z(86), 's');
  K.crates(C(27), C(82), 0, 1, 40); K.crates(C(88), C(83), 0, 2, 40); K.barrel(C(62), C(81), 12, 30);
  K.sign(X(6), 120, Z(83), 'px', 'neon_potato', 96, 72); K.light(X(7), 110, Z(83), 240, [1, 0.4, 0.15], 2);
  K.qoqC(14, 83, 90); K.qoqC(30, 81, 90); K.qoqC(70, 84, -90); K.qoqC(84, 82, -90); K.qoqC(98, 83, -90);
  K.slices([[X(24), Z(84)], [X(40), Z(81)], [X(72), Z(81)], [X(100), Z(84)]]); K.juice(X(7), Z(81)); K.juice(X(105), Z(85)); K.juice(X(60), Z(85)); K.health(X(36), Z(85));
  K.ambient(X(55), 80, Z(83), 'hum', 900, 0.5);

  // bedrooms — south side
  bedroom(6, 's', 0, { loot: (c0, r0, c1, r1, mid) => { K.juice(X(c0) + 200, C(mid)); K.qoqC(c0 + 7, r0 + 3, 0); } });
  bedroom(20, 's', 1, { loot: (c0, r0, c1, r1, mid) => { K.health(X(c0) + 180, C(mid) + 40); K.slice(X(c0) + 120, C(mid) - 30); } });
  bedroom(34, 's', 2, { loot: (c0, r0, c1, r1, mid) => { K.qoqC(c0 + 6, r0 + 8, 0); K.qoqC(c0 + 2, r0 + 10, 0); K.juice(X(c0) + 100, C(mid) + 60); } });
  bedroom(66, 's', 3, { loot: (c0, r0, c1, r1, mid) => { K.juice(X(c0) + 200, C(mid)); K.juice(X(c0) + 200, C(mid) + 50); } });
  const amb1 = bedroom(80, 's', 4, { loot: (c0, r0, c1, r1, mid) => { K.health(X(c0) + 160, C(mid)); K.slice(X(c0) + 200, C(mid) + 60); } });
  K.wave('amb1', { min: [X(82), 0, Z(90)], max: [X(88), 100, Z(96)], lock: [amb1], msg: 'It was a trap! The bedroom door slams!', doneMsg: 'The door clicks open.' });
  for (const [c, r] of [[81, 88], [88, 88], [81, 97], [87, 97]]) K.qoqC(c, r, 0, { wave: 'amb1' });
  bedroom(94, 's', 5, { loot: (c0, r0, c1, r1, mid) => { K.qoqC(c0 + 6, r0 + 6, 0); K.juice(X(c0) + 200, C(mid)); } });
  // bedrooms — north side
  bedroom(6, 'n', 6, { loot: (c0, r0, c1, r1, mid) => { K.health(X(c0) + 200, C(mid)); K.qoqC(c0 + 7, r0 + 8, 180); } });
  const amb2 = bedroom(20, 'n', 7, { loot: (c0, r0, c1, r1, mid) => { K.juice(X(c0) + 200, C(mid)); K.juice(X(c0) + 160, C(mid) + 60); } });
  K.wave('amb2', { min: [X(22), 0, Z(70)], max: [X(28), 100, Z(76)], lock: [amb2], msg: 'Qoqs under the beds!', doneMsg: 'The door clicks open.' });
  for (const [c, r] of [[21, 68], [28, 68], [21, 77], [28, 72]]) K.qoqC(c, r, 180, { wave: 'amb2' });
  bedroom(34, 'n', 8, { loot: (c0, r0, c1, r1, mid) => { K.qoqC(c0 + 7, r0 + 4, 180); K.slice(X(c0) + 120, C(mid) - 30); K.health(X(c0) + 200, C(mid) + 50); } });
  bedroom(66, 'n', 9, { loot: (c0, r0, c1, r1, mid) => { K.qoqC(c0 + 6, r0 + 3, 180); K.juice(X(c0) + 200, C(mid)); } });
  bedroom(80, 'n', 10, { loot: (c0, r0, c1, r1, mid) => { K.health(X(c0) + 200, C(mid)); K.juice(X(c0) + 120, C(mid) + 60); } });
  bedroom(94, 'n', 11, { loot: (c0, r0, c1, r1, mid) => { K.qoqC(c0 + 7, r0 + 4, 180); K.slice(X(c0) + 120, C(mid) - 30); } });
  // secret: the first north bedroom's bookshelf hides a boarded crawlspace with supplies
  K.paint(16, 75, 18, 77, T({ ...BED, c: 112 })); K.breakable([X(16), 0, Z(75)], [X(17), 112, Z(78)], { tex: 'boards', health: 16, secret: true });
  K.health(X(17) + 16, Z(75) + 16); K.juice(X(18) + 16, Z(77), undefined, 80); K.slice(X(18), Z(76));

  // ---------------- GREENHOUSE (red key) ----------------
  K.paint(104, 63, 106, 79, T({ ...CORR, c: 160 }));
  K.room(82, 16, 108, 62, GRN, 'concretedark');
  for (const r of [24, 33, 42, 51]) for (const [c0, c1] of [[86, 93], [97, 104]]) {
    K.brush([X(c0), 0, Z(r)], [X(c1), 24, Z(r) + 64], { tex: 'wood', top: 'rubble' });
    const pts = []; for (let c = c0; c < c1; c++) pts.push([C(c), Z(r) + 20 + (c % 2) * 22]);
    K.potatoes(pts, 24); K.fixture((X(c0) + X(c1)) / 2, Z(r) + 32, 320, (c1 - c0) * 32 - 20, 'x', 'glowgreen', 210, [0.45, 1, 0.5], 4);
  }
  K.pool(83, 22, 84, 58, GRN, 'sludge', 16, 6); K.pool(106, 22, 107, 58, GRN, 'sludge', 16, 6);
  K.brush([X(91), 0, Z(17)], [X(99), 64, Z(21)], { tex: 'wood', top: 'rubble' });
  K.stairBrush(X(94), Z(21), X(96), Z(24), 0, 64, 'N');
  K.props(pr => pr.sphere(X(92) + 24, 64 + 22, Z(19), 26, 'potato', { sy: 0.75, segs: 14, rings: 10, uvScale: [2, 1] }));
  K.key('red', X(96) + 16, Z(19), 64);
  K.poster(X(95), 150, Z(16), 'pz', 'pot_soil', 70, 120); K.sign(X(95), 240, Z(16), 'pz', 'neon_potato', 120, 90);
  K.light(X(95), 200, Z(20), 340, [1, 0.7, 0.4], 1);
  K.catwalk(X(105), Z(26), X(109), Z(56), 144, { rails: 'w', tex: 'grate' });
  K.qoq(C(107), C(30), -90, { turret: true, y: 144 }); K.qoq(C(107), C(50), -90, { turret: true, y: 144 });
  K.qoqC(95, 30, 180); K.qoqC(95, 48, 180); K.qoqC(88, 58, 0); K.qoqC(102, 58, 0); K.qoqC(88, 20, 90);
  K.wave('redkey', { onKey: 'red', msg: 'The gardeners rise from the soil!' });
  for (const [c, r] of [[85, 30], [105, 30], [85, 48], [105, 48], [95, 40], [95, 57]]) K.qoqC(c, r, 0, { wave: 'redkey', delay: (r % 3) * 0.5 });
  K.slices([[X(95), Z(38)], [X(95), Z(46)], [X(88), Z(18)], [X(102), Z(18)]]); K.juice(X(86), Z(61)); K.juice(X(104), Z(61)); K.juice(X(102), Z(20)); K.health(X(86), Z(18)); K.health(X(95), Z(61));
  for (const [c, r] of [[89, 29], [101, 29], [89, 47], [101, 47], [95, 56]]) K.light(X(c), 150, Z(r), 320, [0.7, 1, 0.6]);
  K.emitter([X(82), 0, Z(16)], [X(109), 220, Z(62)], 'dust', 10); K.ambient(X(95), 60, Z(40), 'drip', 900, 0.8);

  // ---------------- LOUNGE (image: lounge — porthole skyline windows, leather couches) ----------------
  K.paint(52, 63, 58, 78, T({ ...CORR, c: 192, floor: 'wood' }));
  K.door(52, 79, 58, 79, CORR, { key: 'red', top: 140, name: 'reddoor' });
  K.room(34, 16, 78, 62, LNG, 'brickdark');
  K.paint(34, 16, 78, 21, T(LGAL)); K.paint(34, 22, 39, 62, T(LGAL)); K.paint(73, 22, 78, 62, T(LGAL));
  K.paint(34, 40, 39, 43, T(LNG)); // notch under the west gallery bridge, toward the library
  K.catwalk(X(34), Z(40), X(40), Z(44), 176, { tex: 'wood', top: 'wood', thick: 8 });
  K.stairs(40, 52, 41, 62, 'N', 16, 176, { ...LNG, side: 'stepside', floor: 'concrete' });
  K.stairs(71, 52, 72, 62, 'N', 16, 176, { ...LNG, side: 'stepside', floor: 'concrete' });
  K.brush([X(40), 176, Z(22) - 2], [X(73), 210, Z(22)], { tex: 'railing', fit: true, noshadow: true });
  K.brush([X(40), 176, Z(22)], [X(40) + 2, 210, Z(40)], { tex: 'railing', fit: true, noshadow: true }); K.brush([X(40), 176, Z(44)], [X(40) + 2, 210, Z(52)], { tex: 'railing', fit: true, noshadow: true });
  K.brush([X(73) - 2, 176, Z(22)], [X(73), 210, Z(52)], { tex: 'railing', fit: true, noshadow: true });
  for (const c of [42, 48, 64, 70]) { K.decal({ at: [X(c), 280, Z(16)], n: 'pz', w: 140, h: 112, tex: 'porthole', fullbright: true }); K.light(X(c), 270, Z(19), 260, [0.5, 0.6, 0.9]); }
  K.decal({ at: [X(56), 90, Z(22)], n: 'pz', w: 300, h: 110, tex: 'skyline', fullbright: true, off: 0.6 }); K.light(X(56), 90, Z(25), 300, [0.5, 0.6, 0.9]);
  K.sign(X(56), 160, Z(22), 'pz', 'sign_lounge', 180, 36);
  for (const [cx, cz] of [[48, 32], [64, 32], [56, 46]]) {
    K.couch(X(cx) - 80, Z(cz) - 64, X(cx) + 80, Z(cz) - 40, 'n'); K.couch(X(cx) - 104, Z(cz) - 40, X(cx) - 80, Z(cz) + 40, 'w');
    K.brush([X(cx) - 48, 0, Z(cz) - 24], [X(cx) + 48, 22, Z(cz) + 24], { tex: 'wood', top: 'wood' }); K.props(pr => pr.pizza(X(cx), 22, Z(cz), 26));
    K.rug(X(cx), Z(cz), 200, 160, 'carpet');
  }
  K.rug(X(56), Z(56), 110, 110, 'rug_slice');
  K.bookshelf(X(34), Z(22), X(35), Z(40), 120, 'px'); K.tv(X(79), 80, Z(36), 'nx', 'tv_pizza', 80, 56); K.tv(X(79), 80, Z(46), 'nx', 'tv_blue', 80, 56);
  K.decal({ at: [X(73), 100, Z(30)], n: 'nx', w: 50, h: 50, tex: 'clock333' }); K.decal({ at: [X(40), 100, Z(48)], n: 'px', w: 56, h: 56, tex: 'emblem_slice' });
  for (const c of [44, 56, 68]) K.fixture(X(c), Z(38), 384, 160, 'x', 'light', 360, [1, 0.9, 0.75]);
  K.lamp(X(36), 260, Z(30), 220); K.lamp(X(76), 260, Z(30), 220); K.lamp(X(36), 260, Z(56), 220); K.lamp(X(76), 260, Z(56), 220);
  K.light(X(48), 80, Z(32), 220, [1, 0.6, 0.3], 1); K.light(X(64), 80, Z(32), 220, [1, 0.6, 0.3], 1);
  K.qoqC(46, 40, 180); K.qoqC(66, 40, 180); K.qoqC(56, 28, 180);
  K.qoq(C(44), C(18), 180, { turret: true, y: 176 }); K.qoq(C(68), C(18), 180, { turret: true, y: 176 });
  K.qoqC(76, 40, -90, { y: 176 }); K.qoqC(36, 52, 90, { y: 176 });
  K.wave('lounge', { min: [X(46), 0, Z(36)], max: [X(66), 120, Z(52)], lock: ['reddoor'], msg: 'Movie night is cancelled! Qoqs everywhere!', doneMsg: 'The lounge falls quiet.' });
  for (const [c, r, y] of [[42, 58], [70, 58], [42, 26], [70, 26], [36, 30, 176], [76, 56, 176], [50, 18, 176], [62, 18, 176]]) K.qoqC(c, r, 0, { wave: 'lounge', y, delay: (c % 3) * 0.6 });
  K.slices([[X(48), Z(32), 22], [X(64), Z(32), 22], [X(56), Z(18), 176], [X(37), Z(60), 176], [X(76), Z(24), 176]]);
  K.juice(X(42), Z(61)); K.juice(X(70), Z(61)); K.juice(X(36), Z(24), 176); K.juice(X(77), Z(60), 176); K.health(X(56), Z(58)); K.health(X(76), Z(18), 176);
  K.ambient(X(56), 120, Z(40), 'hum', 900, 0.5);

  // ---------------- LIBRARY (blue key behind three book switches) ----------------
  K.paint(31, 40, 32, 43, T({ ...LIB, c: 160 })); K.door(33, 40, 33, 43, LNG, { top: 128, tex: 'door' });
  K.room(4, 16, 30, 62, LIB, 'wood');
  for (const c of [13, 19, 25]) for (const [r0, r1] of [[24, 37], [44, 57]]) K.bookshelf(X(c), Z(r0), X(c) + 40, Z(r1), 130, c === 13 ? 'nx' : 'px');
  K.catwalk(X(4), Z(16), X(31), Z(21), 144, { rails: 's', tex: 'wood', top: 'wood', gaps: [['s', X(4), X(10)]] });
  K.catwalk(X(4), Z(21), X(10), Z(46), 144, { rails: 'e', tex: 'wood', top: 'wood', supports: [[X(10) - 4, Z(30)], [X(10) - 4, Z(40)]] });
  K.stairBrush(X(4), Z(46), X(10), Z(55), 0, 144, 'N', 'stepside', 'wood');
  for (const r of [16, 40]) K.bookshelf(X(4), Z(r), X(4) + 8, Z(r + 5), 100, 'px');
  K.gate(3, 30, 3, 33, LIB, 'bookcage', { targeted: true, wait: -1 }); K.paint(1, 30, 2, 33, T({ ...LIB, c: 128 }));
  K.key('blue', X(1) + 32, Z(31) + 16, 0); K.light(X(2), 90, Z(32), 200, [0.4, 0.6, 1], 3);
  for (const [x, y, z, n] of [[X(31), 220, Z(28), 'nx'], [X(4), 60, Z(60), 'px'], [X(22), 230, Z(16), 'pz']]) {
    const o = { px: [1, 0], nx: [-1, 0], pz: [0, 1], nz: [0, -1] }[n];
    K.decal({ at: [x, y, z], n, w: 40, h: 28, tex: 'books', fullbright: true, off: 0.8 }); K.light(x + o[0] * 30, y, z + o[1] * 30, 150, [1, 0.8, 0.4], 3);
    K.button({ min: [Math.min(x, x + o[0] * 6) - (o[0] ? 0 : 20), y - 14, Math.min(z, z + o[1] * 6) - (o[1] ? 0 : 20)], max: [Math.max(x, x + o[0] * 6) + (o[0] ? 0 : 20), y + 14, Math.max(z, z + o[1] * 6) + (o[1] ? 0 : 20)], shoot: true, counter: 'books', count: 3, target: 'bookcage', msg: 'Click! A cage behind the shelves swings open.' });
  }
  K.msg([X(4), 0, Z(24)], [X(31), 100, Z(62)], 'Three glowing books are hidden around the library... soak them!');
  K.sign(X(17), 200, Z(62) + 32, 'nz', 'sign_library', 180, 40);
  for (const c of [10, 22]) for (const r of [28, 50]) K.fixture(X(c), Z(r), 320, 120, 'z', 'lightamber', 260, [1, 0.8, 0.5]);
  K.lamp(X(6), 200, Z(18), 200); K.lamp(X(29), 200, Z(18), 200);
  for (const [c, r] of [[16, 30], [22, 30], [16, 50], [22, 50], [28, 40], [7, 58]]) K.light(X(c), 150, Z(r), 300, [1, 0.8, 0.5]);
  K.qoqC(8, 58, 90); K.qoqC(17, 40, 90); K.qoqC(28, 50, -90); K.qoqC(23, 30, -90); K.qoq(C(7), C(30), 90, { turret: true, y: 144 });
  K.wave('bluekey', { onKey: 'blue', msg: 'The librarians want their book back!' });
  for (const [c, r, y] of [[28, 24], [28, 60], [16, 60], [7, 18, 144], [20, 18, 144], [17, 41]]) K.qoqC(c, r, 90, { wave: 'bluekey', y });
  K.slices([[X(16), Z(40)], [X(22), Z(40)], [X(28), Z(40)], [X(7), Z(40), 144]]); K.juice(X(6), Z(61)); K.juice(X(29), Z(61)); K.juice(X(15), Z(18), 144); K.health(X(29), Z(24)); K.health(X(8), Z(24), 144);

  // ---------------- OBSERVATION DECK (blue door, rooftop, final wave, exit) ----------------
  K.door(54, 15, 58, 15, LGAL, { key: 'blue', top: 120, name: 'bluedoor' });
  K.room(34, 2, 78, 14, OBS, 'brickdark');
  for (const c of [38, 48, 58, 68]) K.decal({ at: [X(c), 330, Z(2)], n: 'pz', w: 300, h: 140, tex: 'skyline', fullbright: true, off: 0.6 });
  K.brush([X(34), 176, Z(2)], [X(79), 210, Z(2) + 2], { tex: 'railing', fit: true, noshadow: true });
  for (const [c, r] of [[40, 8], [50, 6], [62, 6], [72, 8]]) K.crates(C(c), C(r), 176, 2, 40);
  K.props(pr => { for (const c of [44, 56, 68]) pr.cylinder(X(c), 176, Z(10), 10, 110, 'metal', { segs: 10 }); });
  for (const c of [44, 56, 68]) K.lantern(X(c), 290, Z(10) - 12, 'nz', 260);
  K.light(X(56), 360, Z(8), 520, [0.55, 0.65, 0.95]); K.light(X(40), 260, Z(8), 300, [1, 0.7, 0.4]); K.light(X(72), 260, Z(8), 300, [1, 0.7, 0.4]);
  K.emitter([X(34), 176, Z(2)], [X(79), 400, Z(15)], 'dust', 6); K.ambient(X(56), 260, Z(8), 'wind', 1000, 1);
  K.wave('deck', { min: [X(48), 176, Z(4)], max: [X(64), 280, Z(12)], lock: ['bluedoor'], msg: 'The Order makes its last stand on the roof!', doneMsg: 'The roof is yours. Get to the exit!', opens: ['exitgate'], stagger: 0.45 });
  for (const [c, r] of [[35, 4], [35, 13], [77, 4], [77, 13], [45, 3], [67, 3], [56, 13], [40, 12], [72, 12]]) K.qoqC(c, r, 180, { wave: 'deck', y: 176 });
  K.slices([[X(36), Z(8), 176], [X(76), Z(8), 176]]); K.juice(X(36), Z(3), 176); K.juice(X(76), Z(3), 176); K.health(X(56), Z(3), 176); K.juice(X(56), Z(13), 176);
  K.door(79, 6, 79, 9, OBS, { targeted: true, name: 'exitgate', wait: -1, tex: 'door_red', top: 128 });
  K.room(80, 5, 81, 10, { ...OBS, sky: false, c: 320, ceil: 'ceil' }, 'brickdark');
  K.exit(X(82), 176, Z(7) + 16, 'nx');

  K.goal(X(96) + 16, Z(19), 64, { wait: 8 }); K.goal(X(56), Z(44), 0, { wait: 14 });
  K.goal(X(28), Z(30), 0, { shoot: [X(31) - 3, 220, Z(28)] }); K.goal(X(12), Z(60), 0, { shoot: [X(4) + 3, 60, Z(60)] }); K.goal(X(22), Z(30), 0, { shoot: [X(22), 230, Z(16) + 3] });
  K.goal(X(1) + 32, Z(31) + 16, 0, { wait: 10 }); K.goal(X(56), Z(8), 176, { wait: 14 });
});
