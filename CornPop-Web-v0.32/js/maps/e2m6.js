// E2M6 — WALL STREET. Canyons of towers in the fog. North of Wall St: Broadway, Pine St and Federal Hall, where the red key
// sits at the feet of the Pizza King's statue. The red key opens the police line onto Wall St and Trinity Church, whose altar
// holds the blue key. The blue key opens the Pizza Exchange; the gold key on the trading floor balcony opens the bank vault.
import { makeLevel } from '../kit.js';
import { nyc, NYC_STYLES } from '../nyc.js';

export default makeLevel({
  name: 'E2M6', title: 'E2M6: WALL STREET', ambience: 'street', ambient: 34, ambientColor: [0.7, 0.8, 1.1], music: 'assets/music/cornquake_e1m2.mp3', city: true,
  fog: { color: [0.07, 0.085, 0.12], density: 0.0008 }, skyTint: [0.3, 0.32, 0.46],
  // v0.31: snow at blue hour in the canyons of the financial district
  sky: { hell: 1, silh: 'city', moon: 1, a: [0.03, 0.04, 0.08], b: [0.3, 0.38, 0.55], glow: [0.2, 0.22, 0.35] },
  rain: { kind: 'ash', color: [0.92, 0.94, 1], density: 1200, speed: [70, 150], wind: [30, 10] }, mist: { color: [0.12, 0.15, 0.22], density: 0.0012 }, outTint: [0.85, 0.92, 1.1], styles: NYC_STYLES,
}, 104, 104, 'office', K => {
  const { X, Z, C } = K; const T = s => K.type(s); const N = nyc(K, { sky: 1800 });
  const HALL = { f: 8, c: 300, floor: 'tilebrown', ceil: 'gold', side: 'limestone', upper: 'limestone', roof: 300, roofSky: 1800 };
  const SIDE = { f: 8, c: 150, floor: 'tilebrown', ceil: 'ceil', side: 'limestone', upper: 'limestone', roof: 300, roofSky: 1800 };
  const NAVE = { f: 8, c: 380, floor: 'jailfloor', ceil: 'wood', side: 'granite', upper: 'granite', roof: 420, roofSky: 1800 };
  const CRYPT = { f: 8, c: 90, floor: 'jailfloor', ceil: 'granite', side: 'granite', upper: 'granite', roof: 110, roofSky: 1800 };
  const FLOOR = { f: 8, c: 420, floor: 'carpet', ceil: 'gold', side: 'gold', upper: 'limestone', roof: 600, roofSky: 1800 };
  const VCOR = { f: 8, c: 160, floor: 'diamond', ceil: 'steeldark', side: 'steeldark', upper: 'granite', roof: 500, roofSky: 1800 };
  const VAULT = { f: 8, c: 240, floor: 'diamond', ceil: 'steeldark', side: 'gold', upper: 'granite', roof: 500, roofSky: 1800 };

  // ======================= TOWERS =======================
  N.building(2, 2, 5, 101, 700, 'office', { parapet: false, tower: false, bulk: false, ac: 0 });
  N.building(18, 2, 55, 19, 1100, 'glasstower', { tower: false }); N.building(56, 2, 101, 19, 900, 'office', { tower: false });
  N.building(18, 28, 55, 45, 1200, 'limestone', { tower: false }); N.building(56, 28, 65, 45, 300, 'limestone', { inner: 'limestone', tower: false, bulk: false });
  N.building(74, 28, 101, 45, 1000, 'office', { tower: false });
  N.building(37, 56, 45, 101, 850, 'glasstower', { tower: false }); N.building(18, 86, 36, 101, 900, 'limestone', { tower: false });
  N.building(56, 56, 80, 80, 600, 'limestone', { inner: 'gold', tower: false, bulk: false });
  N.building(81, 56, 101, 80, 500, 'granite', { inner: 'steeldark', tower: false, bulk: false });
  N.building(56, 81, 101, 101, 1000, 'glasstower', { tower: false });
  // ======================= STREETS =======================
  N.street(6, 2, 17, 101, 'z', { cross: [21, 50], lampEvery: 12 });          // Broadway
  N.street(18, 20, 101, 27, 'x', { walk: 2, lampEvery: 10, center: false });  // Pine St
  N.street(66, 28, 73, 45, 'z', { walk: 2, lamps: false, center: false });    // Nassau St
  N.street(18, 46, 101, 55, 'x', { walk: 2, lampEvery: 10, center: false });  // Wall St
  N.plaza(46, 56, 55, 101, 8, 'granite', 'curb');                            // Broad St (closed to traffic)
  N.plaza(18, 56, 36, 85, 8, 'grass', 'granite');                            // Trinity churchyard
  K.ambient(X(40), 60, Z(24), 'wind', 3000, 0.75);
  N.streetSign(X(18) + 12, Z(20) - 12, 8, 'st_broadway', 'st_wallst'); N.streetSign(X(46) - 12, Z(56) + 12, 8, 'st_wallst', 'st_broadst');
  N.streetSign(X(66) - 12, Z(28) + 12, 8, 'st_parkrow', 'st_fultonst');

  // ======================= BROADWAY & PINE STREET (start) =======================
  K.start(11, 5, 180);
  K.msg([X(6), 0, Z(2)], [X(18), 120, Z(10)], 'Wall Street. The towers vanish into the storm.');
  const BW = N.face(2, 2, 5, 101, 'e'), BE1 = N.face(18, 2, 55, 19, 'w'), BE2 = N.face(18, 28, 55, 45, 'w'), PN = N.face(18, 2, 101, 19, 's'), PS = N.face(18, 28, 55, 45, 'n'), PS2 = N.face(74, 28, 101, 45, 'n');
  for (const [F, a, n, o] of [[BW, Z(10), 'bank', { closed: true }], [BW, Z(30), 'cafe', { awning: 'G' }], [BW, Z(70), 'pharmacy', {}], [BW, Z(90), 'deli', { awning: 'R' }], [BE1, Z(8), 'bank', { closed: true }], [BE2, Z(36), 'cafe', { awning: 'B', neon: true }],
    [PN, X(26), 'deli', { awning: 'R' }], [PN, X(44), 'bank', { closed: true }], [PN, X(62), 'pizza', { awning: 'R', neon: true }], [PN, X(84), 'bar', { closed: true }], [PS, X(30), 'pharmacy', {}], [PS2, X(86), 'bodega', { awning: 'G' }]]) N.shop(F, a, n, o);
  N.scaffold(PS, X(36), X(54), { h: 120 }); N.scaffold(BE1, Z(2) + 8, Z(18), { h: 120 });
  N.tag(PN, X(52), 40, 'tag_marv'); N.tag(PS2, X(96), 40, 'tag_qoq');
  N.car(X(11), Z(14), 0, 0.2, 'taxi'); N.car(X(13), Z(32), 0, Math.PI - 0.3, 'burnt'); N.car(X(30), Z(23) + 16, 0, Math.PI / 2, 'cop'); N.car(X(56), Z(24), 0, -Math.PI / 2 + 0.4, 'burnt', { fireSize: 40 }); N.car(X(88), Z(24), 0, 1.4, 'black');
  K.brush([X(100), 0, Z(20)], [X(102), 150, Z(28)], { tex: 'rubble', top: 'rubble' });
  N.barrelFire(X(16), Z(22), 8); N.trash(X(40), Z(20) + 8, 8, 5); N.trash(X(78), Z(27), 8, 4); N.steam(X(11), Z(24), 0); N.steam(X(46), Z(24), 0); N.steam(X(80), Z(23), 0);
  K.qoqC(10, 14, 180); K.qoqC(14, 28, 180); K.qoqC(26, 24, -90); K.qoqC(40, 22, -90); K.qoqC(60, 25, -90); K.qoqC(84, 22, -90); K.marvC(94, 25, -90); K.qoq(X(46), Z(27) - 4, 180, { turret: true, y: 128 });
  K.juice(X(7), Z(4)); K.health(X(17), Z(38)); K.juice(X(98), Z(21)); K.slices([[X(10), Z(10)], [X(12), Z(36)], [X(34), Z(22)], [X(52), Z(25)], [X(70), Z(22)], [X(92), Z(26)]]);
  // Nassau Street north of Wall (rubble at its south end)
  K.brush([X(66), 0, Z(44)], [X(74), 150, Z(46)], { tex: 'rubble', top: 'rubble' }); N.car(X(70), Z(40), 0, 0.3, 'burnt', { fireSize: 36 });
  K.qoqC(69, 32, 180); K.qoqC(71, 38, 180); K.juice(X(72), Z(30)); K.slice(X(68), Z(36));

  // ======================= FEDERAL HALL (red key) =======================
  K.paint(57, 30, 64, 40, T(HALL)); K.door(59, 28, 62, 29, HALL, { top: 120, tex: 'gold' });
  K.paint(59, 42, 64, 44, T(SIDE)); K.wall(57, 41, 59, 41, 'limestone'); K.wall(62, 41, 64, 41, 'limestone'); K.door(60, 41, 61, 41, SIDE, { top: 96 });
  const FH = N.face(56, 28, 65, 45, 'n');
  K.post(ctx => { for (const x of [X(56) + 16, X(57) + 24, X(63) + 8, X(64) + 16]) { ctx.props.cylinder(x, 8, Z(28) - 20, 10, 160, 'limestone', { segs: 12 }); ctx.brush([x - 10, 8, Z(28) - 30], [x + 10, 168, Z(28) - 10], { invisible: true, noshadow: true }); }
    ctx.brush([X(56), 168, Z(28) - 36], [X(66), 190, Z(28)], { tex: 'limestone', top: 'roof' }); });
  N.decalOn(FH, X(61), 210, 240, 50, 'sign_lobby', true);
  K.post(ctx => { // the rotunda: a ring of columns and the Pizza King on his pedestal
    const cx = X(61), cz = Z(35) + 16; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, x = cx + Math.cos(a) * 92, z = cz + Math.sin(a) * 92; ctx.props.cylinder(x, 8, z, 9, 292, 'limestone', { segs: 10 }); ctx.brush([x - 8, 8, z - 8], [x + 8, 300, z + 8], { invisible: true, noshadow: true }); }
    ctx.props.pedestal(cx, cz, 8, 30, 40, 'granite'); ctx.brush([cx - 30, 8, cz - 30], [cx + 30, 260, cz + 30], { invisible: true, noshadow: true }); ctx.props.cylinder(cx, 48, cz, 16, 70, 'gold', { segs: 10, rTop: 12 }); ctx.props.sphere(cx, 128, cz, 12, 'gold', { segs: 10, rings: 8 }); ctx.props.pizza(cx + 18, 100, cz, 14);
    ctx.light(cx, 260, cz, 360, [1, 0.82, 0.55]); ctx.light(cx, 70, cz - 60, 200, [1, 0.8, 0.5]);
  });
  K.key('red', X(60) + 16, Z(39) + 16);
  K.qoqC(58, 32, 180); K.qoqC(63, 32, 180); K.qoqC(58, 39, 0); K.marvC(63, 38, 0);
  K.juice(X(57), Z(31)); K.health(X(64), Z(31)); K.slices([[X(58), Z(36)], [X(64), Z(36)]]);
  K.wave('redkey', { onKey: 'red', msg: 'The doors of Federal Hall slam shut behind you... and the Qoqs are already inside.' });
  for (const [c, r] of [[58, 31], [64, 33], [57, 38], [63, 40], [60, 31]]) K.qoqC(c, r, 0, { wave: 'redkey' });
  // side room secret behind the boards
  K.health(X(62), Z(43)); K.juice(X(63), Z(43));
  K.paint(57, 42, 58, 44, T(SIDE)); K.breakable([X(59), 8, Z(42)], [X(59) + 8, 150, Z(45)], { tex: 'boards', health: 24, secret: true });
  K.item('candybag', X(57) + 16, Z(43), { amount: 50 }); K.slice(X(58), Z(44) + 8); K.light(X(58), 80, Z(43), 120, [1, 0.6, 0.3], 1);

  // ======================= THE POLICE LINE ON BROADWAY (red key) =======================
  K.post(ctx => {
    for (const [a, b] of [[X(6), X(9)], [X(15), X(18)]]) { ctx.brush([a, 0, Z(44) + 4], [b, 52, Z(45) + 20], { tex: 'concrete', top: 'concrete' }); ctx.brush([a, 52, Z(44) + 12], [b, 132, Z(44) + 18], { tex: 'bars', noshadow: true }); }
    ctx.mover({ type: 'door', min: [X(9), 0, Z(44) + 10], max: [X(15), 132, Z(44) + 20], key: 'red', tex: 'door_red', name: 'wallline', wait: -1, lip: 8, speed: 110 });
  });
  K.light(X(12), 130, Z(44), 300, [1, 0.12, 0.05], 3); K.light(X(12), 132, Z(46), 300, [0.15, 0.3, 1], 4);
  K.msg([X(6), 0, Z(40)], [X(18), 120, Z(44)], 'POLICE LINE. Wall Street is sealed. RED keycard only.');

  // ======================= WALL STREET =======================
  const WN = N.face(18, 28, 101, 45, 's'), WS1 = N.face(37, 56, 45, 101, 'n'), WS2 = N.face(81, 56, 101, 80, 'n');
  N.shop(WN, X(26), 'bank', { closed: true }); N.shop(WN, X(44), 'cafe', { awning: 'G' }); N.shop(WN, X(90), 'diner', { awning: 'R', neon: true }); N.shop(WS2, X(88), 'bank', { closed: true, awning: false });
  N.scaffold(WN, X(76), X(100), { h: 120 }); N.billboard(N.face(37, 56, 45, 101, 'n'), X(41), 240, 'bb_news', 240, 60, [1, 0.35, 0.3]);
  N.car(X(24), Z(50), 0, Math.PI / 2, 'black'); N.car(X(60), Z(51), 0, -Math.PI / 2 + 0.2, 'burnt'); N.car(X(86), Z(50), 0, Math.PI / 2 + 0.5, 'cop'); N.car(X(96), Z(52), 0, 2.3, 'burnt', { fireSize: 42 });
  K.brush([X(100), 0, Z(46)], [X(102), 160, Z(56)], { tex: 'rubble', top: 'rubble' });
  N.barrelFire(X(34), Z(47), 8); N.trash(X(54), Z(55), 8, 5); N.steam(X(40), Z(51), 0); N.steam(X(78), Z(50), 0);
  K.qoqC(12, 54, 180); K.qoqC(22, 52, -90); K.qoqC(36, 50, -90); K.qoqC(52, 49, -90); K.qoqC(70, 52, -90); K.qoqC(84, 48, -90); K.marvC(92, 50, -90); K.qoq(X(80), Z(46) + 22, 180, { turret: true, y: 128 });
  K.qoqC(12, 70, 180); K.qoqC(14, 90, 180);
  K.juice(X(20), Z(47)); K.health(X(64), Z(54)); K.juice(X(98), Z(48)); K.slices([[X(28), Z(51)], [X(44), Z(50)], [X(62), Z(49)], [X(80), Z(53)], [X(11), Z(80)]]);

  // ======================= TRINITY CHURCH & THE CHURCHYARD (blue key) =======================
  K.brush([X(18) - 4, 8, Z(56)], [X(18), 130, Z(66)], { tex: 'bars', noshadow: true }); K.brush([X(18) - 4, 8, Z(70)], [X(18), 130, Z(86)], { tex: 'bars', noshadow: true });
  K.brush([X(18), 8, Z(56) - 4], [X(37), 130, Z(56)], { tex: 'bars', noshadow: true });
  N.building(24, 60, 34, 80, 420, 'granite', { inner: 'granite', tower: false, bulk: false, ac: 0, parapet: false });
  K.paint(25, 62, 33, 79, T(NAVE)); K.door(24, 68, 24, 71, NAVE, { top: 128, tex: 'wood' });
  K.post(ctx => { // the steeple, stained glass, pews, altar and candles
    ctx.brush([X(26), 420, Z(60)], [X(33), 700, Z(64)], { tex: 'granite', top: 'roof' }); ctx.props.cylinder(X(29) + 16, 700, Z(62), 80, 260, 'roof', { rTop: 2, segs: 4, ry: Math.PI / 4 });
    ctx.props.pipe(X(29) + 16, 960, Z(62), X(29) + 16, 1010, Z(62), 2, 'gold');
    for (const r of [64, 68, 72, 76]) { ctx.decal({ at: [X(25), 200, Z(r)], n: 'px', w: 40, h: 110, tex: 'stained', fullbright: true }); ctx.decal({ at: [X(34), 200, Z(r)], n: 'nx', w: 40, h: 110, tex: 'stained', fullbright: true }); }
    ctx.decal({ at: [X(24) - 1, 260, Z(70)], n: 'nx', w: 60, h: 120, tex: 'stained', fullbright: true });
    for (let r = 64; r <= 74; r += 2) for (const [a, b] of [[X(26), X(29)], [X(30), X(33)]]) ctx.brush([a, 8, Z(r) + 6], [b, 30, Z(r) + 20], { tex: 'wood', top: 'wood' });
    ctx.brush([X(26), 8, Z(77)], [X(33), 32, Z(80)], { tex: 'granite', top: 'carpet' }); ctx.brush([X(28), 32, Z(78)], [X(31), 66, Z(79)], { tex: 'gold', top: 'curtain' });
    for (const x of [X(27), X(32)]) { ctx.props.cylinder(x, 32, Z(78), 2, 40, 'carwhite', { segs: 6 }); ctx.ent({ type: 'fire', pos: [x, 72, Z(78)], size: 6, smoke: false }); ctx.light(x, 90, Z(78), 160, [1, 0.6, 0.3], 1); }
    for (let k = 0; k < 9; k++) ctx.props.cylinder(X(26) + 24 + k * 24, 32, Z(80) - 6, 6, 150 - Math.abs(4 - k) * 12, 'gold', { segs: 8 });
    ctx.light(X(29), 300, Z(70), 400, [0.9, 0.7, 1]); ctx.light(X(29), 120, Z(65), 240, [1, 0.75, 0.5]);
  });
  K.stairBrush(X(26), Z(76) + 8, X(33), Z(77), 8, 32, 'S', 'granite', 'carpet');
  K.key('blue', X(29) + 16, Z(77) + 16, 32);
  K.qoqC(27, 66, 180); K.qoqC(32, 70, 180); K.marvC(29, 74, 180);
  K.juice(X(25), Z(63)); K.health(X(33), Z(63)); K.slices([[X(29), Z(66)], [X(29), Z(72)]]);
  K.wave('bluekey', { onKey: 'blue', msg: 'The bells ring by themselves... the graves are opening!' });
  for (const [c, r] of [[20, 62], [22, 82], [35, 66], [20, 74], [35, 82], [29, 68]]) K.qoqC(c, r, 0, { wave: 'bluekey' });
  // churchyard: tombstones, trees, a mausoleum over the crypt (secret)
  K.post(ctx => { let s = 7; const r = () => (s = (s * 61 + 17) % 101) / 101; for (const [x0, z0, x1, z1] of [[X(19), Z(57), X(23), Z(85)], [X(35), Z(57), X(36) + 24, Z(85)], [X(24), Z(81), X(34), Z(85)]]) for (let i = 0; i < 8; i++) { const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0); ctx.brush([x - 8, 8, z - 3], [x + 8, 30 + r() * 16, z + 3], { tex: 'granite', top: 'granite' }); } });
  for (const [x, z] of [[X(20), Z(60)], [X(35), Z(58)], [X(21), Z(83)], [X(36), Z(78)]]) N.tree(x, z, 8, 1.2);
  N.building(18, 75, 23, 80, 110, 'granite', { tower: false, bulk: false, ac: 0, parapet: false, inner: 'granite' }); K.lamp(X(21), 120, Z(74), 150);   // the mausoleum
  K.paint(19, 76, 22, 79, T(CRYPT)); K.paint(20, 75, 21, 75, T(CRYPT)); K.breakable([X(20), 8, Z(75)], [X(22), 90, Z(75) + 8], { tex: 'wood', health: 24, secret: true });
  K.item('turdbox', X(20), Z(78), { amount: 4 }); K.item('sausages', X(21) + 16, Z(77) + 8, { amount: 12 }); K.health(X(19) + 16, Z(79)); K.light(X(21), 60, Z(78), 140, [1, 0.6, 0.3], 1);

  // ======================= BROAD STREET & THE PIZZA EXCHANGE (blue door, gold key) =======================
  K.post(ctx => { for (let z = Z(58); z < Z(79); z += 64) { ctx.props.cylinder(X(55) - 16, 8, z, 14, 300, 'limestone', { segs: 14 }); ctx.brush([X(55) - 30, 8, z - 14], [X(55) - 2, 308, z + 14], { invisible: true, noshadow: true }); }
    ctx.brush([X(54), 308, Z(56)], [X(56), 340, Z(80)], { tex: 'limestone', top: 'roof' }); ctx.props.box(X(55) - 8, 340, Z(68), 30, 60, 760, 'limestone'); });
  N.decalOn(N.face(56, 56, 80, 80, 'w'), Z(68), 380, 360, 70, 'sign_onlineexchange', true);
  K.paint(57, 57, 79, 79, T(FLOOR)); K.door(56, 64, 56, 71, FLOOR, { key: 'blue', top: 140, tex: 'gold' });
  K.msg([X(50), 8, Z(62)], [X(55), 120, Z(74)], 'THE PIZZA EXCHANGE. Members only: BLUE keycard.');
  K.post(ctx => { // trading posts with monitors, ticker boards, the balcony with the bell podium
    for (const [c, r] of [[62, 63], [70, 63], [62, 73], [70, 73], [66, 68]]) { const x = C(c), z = C(r); ctx.props.cylinder(x, 8, z, 46, 44, 'wood', { segs: 6 }); ctx.props.cylinder(x, 52, z, 10, 90, 'gold', { segs: 6 }); ctx.props.cylinder(x, 142, z, 40, 30, 'carblack', { segs: 6 });
      ctx.brush([x - 40, 8, z - 40], [x + 40, 52, z + 40], { invisible: true, noshadow: true }); for (const [n, dx, dz] of [['px', 40, 0], ['nx', -40, 0], ['pz', 0, 40], ['nz', 0, -40]]) ctx.decal({ at: [x + dx * 0.8, 157, z + dz * 0.8], n, w: 44, h: 22, tex: 'monitors', fullbright: true }); ctx.light(x, 170, z, 260, [0.45, 0.7, 1]); }
    for (const z of [Z(57) + 1]) ctx.decal({ at: [X(68), 300, z], n: 'pz', w: 700, h: 60, tex: 'monwall', fullbright: true });
    ctx.decal({ at: [X(80) - 1, 300, Z(68)], n: 'nx', w: 600, h: 60, tex: 'monwall', fullbright: true });
    for (const [x, z] of [[X(62), Z(60)], [X(74), Z(60)], [X(62), Z(76)], [X(74), Z(76)]]) ctx.props.sphere(x, 380, z, 16, 'glow', { fullbright: true, segs: 10, rings: 8 });
    for (const [x, z] of [[X(62), Z(60)], [X(74), Z(60)], [X(62), Z(76)], [X(74), Z(76)]]) ctx.light(x, 360, z, 420, [1, 0.85, 0.6]);
  });
  K.catwalk(X(57), Z(57), X(80), Z(60), 200, { rails: 's', gaps: [['s', X(76), X(80)]], tex: 'gold', top: 'carpet', supports: [[X(62), Z(60) - 4], [X(72), Z(60) - 4]] });
  K.stairBrush(X(76), Z(60), X(80), Z(70), 8, 200, 'N', 'gold', 'carpet');
  K.brush([X(66), 200, Z(57)], [X(70), 236, Z(58)], { tex: 'wood', top: 'gold' }); K.props(pr => pr.sphere(X(68), 252, Z(57) + 16, 12, 'gold', { segs: 10, rings: 7 }));
  K.key('gold', X(64) + 16, Z(58) + 16, 200);
  K.qoqC(60, 66, 90); K.qoqC(74, 66, 90); K.qoqC(66, 76, 90); K.marvC(68, 62, 90); K.qoq(X(60), Z(58) + 16, 180, { turret: true, y: 200 }); K.qoq(X(72), Z(58) + 16, 180, { turret: true, y: 200 });
  K.juice(X(58), Z(78)); K.health(X(78), Z(78)); K.juice(X(78), Z(59), 200); K.slices([[X(60), Z(70)], [X(66), Z(64)], [X(72), Z(76)], [X(58), Z(58), 200]]);
  K.wave('goldkey', { onKey: 'gold', msg: 'MARKET CRASH! Everybody sells... and everybody is armed!' });
  for (const [c, r] of [[58, 60], [78, 62], [58, 76], [66, 78], [74, 70], [62, 68]]) K.qoqC(c, r, 0, { wave: 'goldkey' });
  // hidden office behind the ticker board (shoot the bell)
  K.paint(57, 81, 62, 84, T({ f: 8, c: 150, floor: 'carpet', ceil: 'ceil', side: 'wood', upper: 'glasstower', roof: 1000, roofSky: 1800 }));
  K.door(58, 80, 61, 80, { f: 8, c: 150, floor: 'carpet', ceil: 'ceil', side: 'wood', upper: 'glasstower', roof: 600, roofSky: 1800 }, { targeted: true, name: 'office', wait: -1, tex: 'gold', top: 104 });
  K.button({ min: [X(67) + 20, 238, Z(57) + 4], max: [X(68) + 12, 266, Z(58)], shoot: true, target: 'office', msg: 'The bell rings... a panel opens in the south wall.' });
  K.secret([X(57), 8, Z(81)], [X(63), 100, Z(85)]); K.item('candybag', X(58), Z(82), { amount: 50 }); K.health(X(61), Z(82)); K.slice(X(59), Z(84)); K.light(X(60), 90, Z(83), 150, [1, 0.8, 0.5]);
  // Broad St: the bronze pizza statue
  K.post(ctx => { ctx.props.pedestal(X(51), Z(90), 8, 40, 30, 'granite'); ctx.props.pizzaSquare(X(51), 38, Z(90), 70, 70, 0.4); ctx.props.box(X(51), 38, Z(90), 60, 60, 8, 'gold', { ry: 0.4, rz: 0.5 }); ctx.light(X(51), 120, Z(90), 260, [1, 0.75, 0.4]); });
  N.barrelFire(X(48), Z(60), 8); N.trash(X(53), Z(98), 8, 5);
  K.qoqC(50, 62, 180); K.qoqC(52, 76, 180); K.qoqC(48, 96, 0); K.marvC(52, 86, 0);
  K.juice(X(47), Z(100)); K.health(X(54), Z(58)); K.slices([[X(50), Z(70)], [X(50), Z(82)], [X(52), Z(96)]]);

  // ======================= THE BANK VAULT (gold door) & EXIT =======================
  K.paint(81, 65, 87, 70, T(VCOR)); K.door(80, 66, 80, 69, VCOR, { key: 'gold', top: 128, tex: 'door_gold' });
  K.paint(88, 58, 100, 78, T(VAULT));
  K.decal({ at: [X(88), 110, Z(67) + 16], n: 'nx', w: 150, h: 150, tex: 'vaultdoor' });
  K.post(ctx => { for (let k = 0; k < 6; k++) { const x = X(90) + (k % 3) * 96, z = k < 3 ? Z(60) : Z(75); ctx.brush([x, 8, z], [x + 64, 40 + (k % 2) * 16, z + 48], { tex: 'gold', top: 'gold' }); ctx.light(x + 32, 90, z + 24, 220, [1, 0.8, 0.4]); } });
  K.fixture(X(94), Z(68), 240, 160, 'x', 'light', 360, [1, 0.95, 0.85]);
  K.qoqC(92, 64, -90); K.qoqC(96, 72, -90); K.marvC(94, 68, -90);
  K.wave('vault', { min: [X(89), 8, Z(59)], max: [X(99), 120, Z(77)], msg: 'The vault alarm! Guards in the deposit boxes!' });
  for (const [c, r] of [[89, 59], [99, 59], [89, 77], [99, 77]]) K.qoqC(c, r, 0, { wave: 'vault' });
  K.juice(X(90), Z(71)); K.health(X(98), Z(62)); K.slices([[X(93), Z(62)], [X(97), Z(75)]]);
  K.exit(X(101), 8, Z(68), 'nx');

  // bot route: Pine St, Federal Hall (red), the police line, Trinity (blue), the Exchange (gold), the vault
  K.goal(X(12), Z(22)); K.goal(X(60) + 16, Z(26)); K.goal(X(58) + 16, Z(31) + 16); K.goal(X(60) + 16, Z(39) + 16); K.goal(X(60) + 16, Z(26)); K.goal(X(12), Z(40));
  K.goal(X(12), Z(52)); K.goal(X(16), Z(69) + 16); K.goal(X(23), Z(69) + 16); K.goal(X(29) + 16, Z(75)); K.goal(X(29) + 16, Z(77) + 16, 32);
  K.goal(X(23), Z(69) + 16); K.goal(X(16), Z(69) + 16); K.goal(X(30), Z(50)); K.goal(X(50), Z(67) + 16); K.goal(X(58), Z(67) + 16); K.goal(X(78), Z(70)); K.goal(X(64) + 16, Z(58) + 16, 200);
  K.goal(X(84), Z(67) + 16); K.goal(X(94), Z(68));
});
