// E2M8 — EMPIRE PIDSER BUILDING. The finale: the storm at its worst over Midtown. In through the gold art-deco lobby and up the
// elevator to the first setback; from terrace to terrace the window-washer lifts are fenced off: the red key on the first terrace
// opens the second lift, the blue key on the second opens the third, the gold key on the third opens the lift to the observation
// deck. Win the battle on the deck and the lift up the mooring mast opens; ride the lightning out from the top.
import { makeLevel } from '../kit.js';
import { nyc, NYC_STYLES } from '../nyc.js';

export default makeLevel({
  name: 'E2M8', title: 'E2M8: EMPIRE PIDSER BUILDING', ambience: 'street', ambient: 22, ambientColor: [0.58, 0.64, 1.0], music: 'assets/music/e1m8.mp3', city: true,
  fog: { color: [0.035, 0.035, 0.05], density: 0.00042 }, skyTint: [0.3, 0.3, 0.5],
  rain: { density: 1600, wind: [100, 60], top: 2300, loud: 1.2 }, storm: { every: [2, 6], power: 1.3 }, styles: NYC_STYLES,
}, 96, 96, 'sky', K => {
  const { X, Z, C } = K; const T = s => K.type(s); const N = nyc(K, { sky: 2400 });
  const H1 = 320, H2 = 640, H3 = 960, H4 = 1280, HM = 1520;
  const lob = roof => ({ f: 8, c: 260, floor: 'checker', ceil: 'gold', side: 'gold', upper: 'limestone', roof, roofTex: 'roof', roofSky: 2400 });
  const SHAFT = N.sky(8, 'lift', 'steeldark', { upper: 'steeldark' });
  const fence = (x0, z0, x1, z1, y) => K.brush([x0, y, z0], [x1, y + 150, z1], { tex: 'bars', noshadow: true });

  // ======================= MIDTOWN AROUND THE TOWER =======================
  N.building(2, 2, 17, 17, 860, 'glasstower', { tower: false }); N.building(18, 2, 47, 17, 520, 'office'); N.building(48, 2, 77, 17, 700, 'limestone', { tower: false }); N.building(78, 2, 93, 17, 440, 'tenement');
  N.building(2, 18, 17, 47, 380, 'brownstone'); N.building(2, 48, 17, 77, 620, 'office', { tower: false }); N.building(78, 18, 93, 47, 560, 'tenementdark'); N.building(78, 48, 93, 77, 340, 'brickdark');
  N.building(2, 78, 17, 93, 480, 'tenement'); N.building(18, 78, 47, 93, 300, 'brownstone'); N.building(48, 78, 77, 93, 760, 'glasstower', { tower: false }); N.building(78, 78, 93, 93, 420, 'office');
  N.street(18, 18, 77, 29, 'x', { cross: [24, 71], lampEvery: 10 });   // W 34th St
  N.street(18, 66, 77, 77, 'x', { cross: [24, 71], lampEvery: 10 });   // W 33rd St
  N.street(18, 30, 29, 65, 'z', { lampEvery: 10 });                     // 6th Ave
  N.street(66, 30, 77, 65, 'z', { lampEvery: 10 });                     // 5th Ave
  for (const [x, z, a, b] of [[X(18) - 12, Z(18) - 12, 'st_34st', 'st_5av'], [X(78) + 12, Z(78) + 12, 'st_w33st', 'st_5av']]) N.streetSign(x, z, 8, a, b);
  K.ambient(X(48), 200, Z(48), 'wind', 3000, 0.9);

  // ======================= THE TOWER: setbacks, lobby, the mast =======================
  N.building(30, 30, 65, 65, H1, 'limestone', { tower: false, bulk: false, ac: 0, parapet: false });
  N.building(34, 34, 61, 61, H2, 'limestone', { tower: false, bulk: false, ac: 0, parapet: false });
  N.building(38, 38, 57, 57, H3, 'limestone', { tower: false, bulk: false, ac: 0, parapet: false });
  N.building(41, 41, 54, 54, H4, 'limestone', { tower: false, bulk: false, ac: 0, parapet: false });
  N.building(46, 46, 49, 49, HM, 'gold', { tower: false, bulk: false, ac: 0, parapet: false });
  K.post(ctx => { // parapets with gaps for the lifts, art deco trim lines, the antenna
    const ring = (x0, z0, x1, z1, y, gaps) => { const segs = [[x0, x1, z0, 'n'], [x0, x1, z1 - 8, 's']]; for (const [a, b, z, s] of segs) { let parts = [[a, b]]; for (const [s2, g0, g1] of gaps) if (s2 === s) parts = parts.flatMap(([u, v]) => (g1 <= u || g0 >= v) ? [[u, v]] : [[u, g0], [g1, v]].filter(([p, q]) => q - p > 1)); for (const [u, v] of parts) ctx.brush([u, y, z], [v, y + 48, z + 8], { tex: 'parapet', top: 'parapet' }); }
      for (const [x, s] of [[x0, 'w'], [x1 - 8, 'e']]) { let parts = [[z0 + 8, z1 - 8]]; for (const [s2, g0, g1] of gaps) if (s2 === s) parts = parts.flatMap(([u, v]) => (g1 <= u || g0 >= v) ? [[u, v]] : [[u, g0], [g1, v]].filter(([p, q]) => q - p > 1)); for (const [u, v] of parts) ctx.brush([x, y, u], [x + 8, y + 48, v], { tex: 'parapet', top: 'parapet' }); } };
    ring(X(30), Z(30), X(66), Z(66), H1, []); ring(X(34), Z(34), X(62), Z(62), H2, [['e', Z(39), Z(43)]]); ring(X(38), Z(38), X(58), Z(58), H3, [['w', Z(46), Z(50)]]); ring(X(41), Z(41), X(55), Z(55), H4, [['n', X(45), X(50)]]);
    for (const [y, a, b] of [[H1 - 20, 30, 66], [H2 - 20, 34, 62], [H3 - 20, 38, 58], [H4 - 20, 41, 55]]) ctx.props.box(X((a + b) / 2), y, Z(a) - 2, X(b) - X(a), 6, 4, 'gold');
    ctx.props.cylinder(X(48), HM, Z(48), 26, 120, 'gold', { rTop: 14, segs: 8 }); ctx.props.cylinder(X(48), HM + 120, Z(48), 8, 280, 'steelbeam', { rTop: 2, segs: 6 });
    ctx.props.sphere(X(48), HM + 410, Z(48), 6, 'redlight', { fullbright: true, segs: 8, rings: 6 }); ctx.light(X(48), HM + 380, Z(48), 400, [1, 0.15, 0.1], 3);
    ctx.brush([X(47) + 8, HM, Z(47) + 8], [X(49) - 8, HM + 120, Z(49) - 8], { tex: 'gold', top: 'gold' });
    for (const [x, z] of [[X(30) - 40, Z(48)], [X(66) + 40, Z(48)], [X(48), Z(30) - 40], [X(48), Z(66) + 40]]) ctx.light(x, 120, z, 620, [1, 0.85, 0.6]); // floodlights
    for (const [x, z] of [[X(40) - 30, Z(48)], [X(56) + 30, Z(48)], [X(48), Z(40) - 30], [X(48), Z(56) + 30]]) ctx.light(x, H3 + 140, z, 520, [0.6, 0.7, 1]);
  });
  N.decalOn(N.face(30, 30, 65, 65, 's'), X(48), 220, 420, 80, 'sign_lobby', true);
  // the lobby (its roof is whatever tier stands above each strip) and the elevator
  K.paint(38, 56, 57, 57, T(lob(H3))); K.paint(38, 58, 57, 61, T(lob(H2))); K.paint(38, 62, 57, 64, T(lob(H1)));
  K.door(44, 65, 51, 65, lob(H1), { top: 140, tex: 'gold' });
  K.paint(58, 57, 61, 60, T(lob(H2))); K.paint(62, 57, 63, 60, T(SHAFT));
  K.lift([X(62), 8, Z(57)], [X(64) - 6, 16, Z(61) - 6], H1 - 16, { wait: 3 });
  K.post(ctx => { ctx.brush([X(64) - 4, H1, Z(57)], [X(64), H1 + 44, Z(61)], { tex: 'railing', fit: true, noshadow: true }); ctx.brush([X(62), H1, Z(61) - 4], [X(64), H1 + 44, Z(61)], { tex: 'railing', fit: true, noshadow: true }); }); // rails round the elevator top (open to the north)
  K.post(ctx => { for (const x of [X(41), X(48), X(55)]) { ctx.props.cylinder(x, 8, Z(58), 14, 250, 'gold', { segs: 8 }); ctx.brush([x - 12, 8, Z(58) - 12], [x + 12, 258, Z(58) + 12], { invisible: true, noshadow: true }); }
    ctx.decal({ at: [X(48), 150, Z(56)], n: 'pz', w: 300, h: 160, tex: 'emblem' }); ctx.decal({ at: [X(61) + 31, 90, Z(58) + 16], n: 'nx', w: 60, h: 110, tex: 'vaultdoor' });
    for (const x of [X(42), X(48), X(54)]) ctx.light(x, 220, Z(61), 320, [1, 0.8, 0.5]); ctx.light(X(60), 160, Z(58), 220, [1, 0.8, 0.5]); });
  K.counter(X(46), Z(62), X(50), Z(63) + 8, 44, 'drawer', 'pz', 'gold');
  K.msg([X(44), 8, Z(63)], [X(52), 120, Z(65)], 'The Empire Pidser Building. The Qoqs have taken the top floors.\nTake the elevator.');

  // ======================= THE STREETS (start) =======================
  K.start(22, 72, -90);
  K.msg([X(18), 0, Z(68)], [X(26), 120, Z(76)], 'Midtown. Look up: the storm is centred on the tower.');
  for (const [F, a, n, o] of [[N.face(18, 78, 47, 93, 'n'), X(26), 'cafe', { awning: 'G' }], [N.face(18, 78, 47, 93, 'n'), X(40), 'pharmacy', {}], [N.face(48, 78, 77, 93, 'n'), X(56), 'hotel', { awning: 'R', neon: true }], [N.face(48, 78, 77, 93, 'n'), X(70), 'bank', { closed: true }],
    [N.face(18, 2, 47, 17, 's'), X(30), 'deli', { awning: 'R' }], [N.face(48, 2, 77, 17, 's'), X(62), 'diner', { neon: true }], [N.face(2, 18, 17, 47, 'e'), Z(36), 'bodega', { awning: 'G' }], [N.face(78, 48, 93, 77, 'w'), Z(60), 'bar', { closed: true }]]) N.shop(F, a, n, o);
  N.billboard(N.face(48, 78, 77, 93, 'n'), X(62), 300, 'bb_cornpop', 300, 150, [1, 0.8, 0.5]); N.billboard(N.face(18, 2, 47, 17, 's'), X(40), 260, 'bb_news', 300, 72, [1, 0.35, 0.3]);
  for (const [x, z, ry, k] of [[X(30), Z(71), Math.PI / 2, 'taxi'], [X(56), Z(73), -Math.PI / 2 + 0.2, 'burnt'], [X(70), Z(70), 0.4, 'cop'], [X(72), Z(40), 0.1, 'burnt'], [X(70), Z(24), 1.5, 'taxi'], [X(40), Z(22), -1.6, 'burnt'], [X(24), Z(50), 3.0, 'sedan'], [X(26), Z(34), 0.3, 'cop']]) N.car(x, z, 0, ry, k, { paint: 'carblack' });
  for (const [x, z] of [[X(34), Z(76)], [X(74), Z(56)], [X(22), Z(28)], [X(60), Z(19)]]) N.barrelFire(x, z, 8);
  N.trash(X(46), Z(77), 8, 5); N.trash(X(76), Z(30), 8, 5); N.steam(X(36), Z(71), 0); N.steam(X(71), Z(48), 0); N.steam(X(50), Z(23), 0); N.steam(X(23), Z(44), 0);
  K.qoqC(32, 72, -90); K.qoqC(44, 70, -90); K.qoqC(58, 72, -90); K.qoqC(70, 62, 0); K.qoqC(72, 44, 0); K.qoqC(70, 26, 90); K.qoqC(48, 24, 90); K.qoqC(26, 24, 180); K.qoqC(24, 44, 180); K.marvC(66, 72, -90); K.marvC(24, 60, 180);
  K.juice(X(20), Z(76)); K.health(X(76), Z(68)); K.juice(X(76), Z(20)); K.health(X(20), Z(20)); K.slices([[X(28), Z(70)], [X(40), Z(74)], [X(60), Z(70)], [X(72), Z(54)], [X(72), Z(34)], [X(56), Z(24)], [X(36), Z(26)], [X(24), Z(38)]]);
  K.qoqC(42, 60, 0); K.qoqC(54, 61, 0); K.qoqC(48, 57, 180); K.juice(X(39), Z(63)); K.health(X(56), Z(63));
  K.wave('lobby', { min: [X(38), 8, Z(56)], max: [X(58), 120, Z(60)], msg: 'The elevator is waiting... and so is the welcoming committee.' });
  for (const [c, r] of [[39, 57], [57, 57], [60, 58], [44, 62], [52, 62]]) K.qoqC(c, r, 0, { wave: 'lobby' });

  // ======================= FIRST SETBACK (320): red key; the lift to the second is fenced (red gate) =======================
  K.post(ctx => { fence(X(62), Z(38) - 6, X(66), Z(38), H1);
    ctx.mover({ type: 'door', min: [X(62), H1, Z(44)], max: [X(66), H1 + 150, Z(44) + 6], key: 'red', tex: 'door_red', name: 'lift2gate', wait: -1, lip: 8, speed: 110 }); });
  K.lift([X(62), H1, Z(39)], [X(64) + 16, H1 + 8, Z(43)], H2 - H1 - 8, { wait: 3 });
  K.key('red', X(31) + 16, Z(31) + 16, H1);
  K.qoq(X(64), Z(52), 0, { y: H1 }); K.qoq(X(56), Z(64), 90, { y: H1 }); K.qoq(X(40), Z(64), 90, { y: H1 }); K.qoq(X(31), Z(56), 0, { y: H1 }); K.marv(X(31), Z(40), 0, { y: H1 }); K.qoq(X(48), Z(31), 180, { y: H1 });
  K.qoq(X(40), Z(34), 180, { y: H2, turret: true }); K.qoq(X(60), Z(48), -90, { y: H2, turret: true });
  K.juice(X(64), Z(64), H1); K.health(X(31), Z(64) + 16, H1); K.slices([[X(64), Z(48)], [X(48), Z(64)], [X(31), Z(44)], [X(52), Z(31)]], H1);
  K.wave('redkey', { onKey: 'red', msg: 'They are climbing the walls!' });
  for (const [x, z] of [[X(40), Z(31)], [X(31), Z(36)], [X(56), Z(31)], [X(64), Z(36)]]) K.qoq(x, z, 0, { wave: 'redkey', y: H1 });
  K.msg([X(62), H1, Z(44)], [X(66), H1 + 120, Z(48)], 'The window-washer lift is fenced off. RED keycard.');

  // ======================= SECOND SETBACK (640): blue key in the sky lounge; lift three (blue gate) =======================
  K.post(ctx => { fence(X(34), Z(45) - 6, X(38), Z(45), H2);
    ctx.mover({ type: 'door', min: [X(34), H2, Z(50)], max: [X(38), H2 + 150, Z(50) + 6], key: 'blue', tex: 'door_blue', name: 'lift3gate', wait: -1, lip: 8, speed: 110 });
    ctx.brush([X(50), H2, Z(58) + 4], [X(57), H2 + 110, Z(58) + 8], { tex: 'glasstower' }); ctx.brush([X(50), H2 + 110, Z(58)], [X(57), H2 + 118, Z(62)], { tex: 'metal', top: 'roof' }); // the sky lounge
    ctx.light(X(54), H2 + 90, Z(60), 260, [1, 0.6, 0.8], 2); });
  K.lift([X(35) + 16, H2, Z(46)], [X(38), H2 + 8, Z(50)], H3 - H2 - 8, { wait: 3 });
  K.key('blue', X(54) + 16, Z(60) + 16, H2);
  K.qoq(X(58), Z(34), 180, { y: H2 }); K.qoq(X(61), Z(44), -90, { y: H2 }); K.qoq(X(50), Z(61), -90, { y: H2 }); K.marv(X(40), Z(61), 0, { y: H2 }); K.qoq(X(34), Z(38), 0, { y: H2 });
  K.qoq(X(48), Z(39), 180, { y: H3, turret: true }); K.qoq(X(39), Z(55), 90, { y: H3, turret: true });
  K.juice(X(34), Z(34), H2); K.health(X(61), Z(34), H2); K.slices([[X(61), Z(54)], [X(44), Z(61)], [X(34), Z(56)], [X(46), Z(34)]], H2);
  K.wave('bluekey', { onKey: 'blue', msg: 'The lounge lights die... ghosts on the terrace!' });
  for (const [x, z] of [[X(61), Z(40)], [X(50), Z(34)], [X(34), Z(60)], [X(44), Z(61)], [X(61), Z(58)]]) K.qoq(x, z, 0, { wave: 'bluekey', y: H2 });
  K.msg([X(34), H2, Z(50)], [X(38), H2 + 120, Z(54)], 'The next lift is behind the BLUE gate.');

  // ======================= THIRD SETBACK (960): gold key at the radio shack; lift four (gold gate) =======================
  K.post(ctx => { fence(X(45) - 6, Z(38), X(45), Z(41), H3);
    ctx.mover({ type: 'door', min: [X(50), H3, Z(38)], max: [X(50) + 6, H3 + 150, Z(41)], key: 'gold', tex: 'door_gold', name: 'lift4gate', wait: -1, lip: 8, speed: 110 });
    for (let k = 0; k < 3; k++) ctx.props.pipe(X(55) + 16 + k * 24, H3 + 48, Z(57) + 16, X(55) + 16 + k * 24, H3 + 240, Z(57) + 16, 1.4, 'metal'); // radio masts
    ctx.props.box(X(56) + 16, H3 + 48, Z(57) + 18, 70, 24, 8, 'computer', { fullbright: true }); ctx.light(X(56), H3 + 60, Z(56), 220, [0.4, 1, 0.6]); });
  K.lift([X(45), H3, Z(38) + 8], [X(50), H3 + 8, Z(41)], H4 - H3 - 8, { wait: 3 });
  K.key('gold', X(56) + 16, Z(56) + 16, H3);
  K.qoq(X(39), Z(40), 0, { y: H3 }); K.qoq(X(56), Z(44), -90, { y: H3 }); K.qoq(X(42), Z(56), -90, { y: H3 }); K.marv(X(56), Z(39), 180, { y: H3 });
  K.juice(X(39), Z(56), H3); K.health(X(39), Z(39), H3); K.slices([[X(56), Z(50)], [X(39), Z(48)], [X(52), Z(56)]], H3);
  K.wave('goldkey', { onKey: 'gold', msg: 'The radio crackles: "...the deck... they are all on the deck..."' });
  for (const [x, z] of [[X(56), Z(40)], [X(39), Z(56)], [X(48), Z(56)], [X(39), Z(44)]]) K.qoq(x, z, 0, { wave: 'goldkey', y: H3 });
  K.msg([X(45), H3, Z(38)], [X(50), H3 + 120, Z(41)], 'The last lift to the observation deck. GOLD keycard.');

  // ======================= OBSERVATION DECK (1280): the final battle; the mast lift opens when it is won =======================
  N.decalOn(N.face(46, 46, 49, 49, 'w'), Z(48), H4 + 80, 120, 30, 'sign_observatory', true);
  for (const [x, z] of [[X(42), Z(42)], [X(54), Z(42)], [X(42), Z(54)], [X(54), Z(54)]]) K.lamp(x, H4 + 120, z, 260);
  K.post(ctx => { for (const [x, z] of [[X(42), Z(42)], [X(54), Z(42)], [X(42), Z(54)], [X(54), Z(54)]]) { ctx.props.cylinder(x, H4, z, 3, 120, 'metalgreen', { segs: 8 }); ctx.brush([x - 4, H4, z - 4], [x + 4, H4 + 120, z + 4], { invisible: true, noshadow: true }); }
    for (const [x, z] of [[X(44), Z(44)], [X(52), Z(52)]]) { ctx.props.cylinder(x, H4, z, 4, 40, 'metal', { segs: 8 }); ctx.props.box(x, H4 + 40, z, 14, 10, 24, 'metal', { ry: 0.8 }); } // coin binoculars
    ctx.mover({ type: 'door', min: [X(50), H4, Z(46)], max: [X(52), H4 + 160, Z(46) + 6], tex: 'bars', name: 'mastgate', targeted: true, wait: -1, lip: 8, speed: 140, message: 'The mast lift is locked down. Clear the deck!' });
    ctx.mover({ type: 'door', min: [X(50), H4, Z(50) - 6], max: [X(52), H4 + 160, Z(50)], tex: 'bars', name: 'mastgate', targeted: true, wait: -1, lip: 8, speed: 140 });
    ctx.brush([X(52) - 4, H4, Z(46)], [X(52), H4 + 160, Z(50)], { tex: 'bars', noshadow: true }); });
  K.lift([X(50), H4, Z(46) + 8], [X(52) - 6, H4 + 8, Z(50) - 8], HM - H4 - 8, { wait: 3 });
  K.wave('deck', { min: [X(41), H4, Z(41)], max: [X(55), H4 + 140, Z(55)], lock: [], opens: ['mastgate'], msg: 'THE OBSERVATION DECK. This is their last stand... and yours!', doneMsg: 'The deck is clear! The mast lift is open.' });
  for (const [c, r] of [[42, 42], [53, 42], [42, 53], [53, 53], [48, 42], [48, 53], [42, 48], [53, 44], [44, 52], [52, 44], [44, 44], [52, 52]]) K.qoq(C(c), C(r), 0, { wave: 'deck', y: H4 });
  K.juice(X(42), Z(47), H4); K.health(X(53), Z(48) + 16, H4); K.item('turdbox', X(47), Z(42), { amount: 4, y: H4 }); K.item('candybag', X(47), Z(53), { amount: 50, y: H4 }); K.item('sausages', X(42), Z(52), { amount: 12, y: H4 });
  K.slices([[X(43), Z(42)], [X(53), Z(53)], [X(42), Z(43)], [X(53), Z(51)]], H4);
  K.secret([X(46), HM, Z(46)], [X(50), HM + 160, Z(50)]); K.health(X(46) + 16, Z(48), HM); K.slice(X(49), Z(46) + 16, HM);
  K.exit(X(47) + 8, HM, Z(48), 'nx');

  // bot route: the lobby and the elevator, red, lift two, blue, lift three, gold, lift four, the deck, the mast
  K.goal(X(48), Z(70)); K.goal(X(48), Z(62)); K.goal(X(60), Z(58)); K.goal(X(63), Z(59), 16, { wait: 5 }); K.goal(X(64) + 16, Z(52), H1);
  K.goal(X(31) + 16, Z(31) + 16, H1); K.goal(X(64), Z(48), H1); K.goal(X(63), Z(41), H1 + 8, { wait: 5 }); K.goal(X(60), Z(41), H2);
  K.goal(X(59) + 16, Z(60) + 16, H2); K.goal(X(54) + 16, Z(60) + 16, H2); K.goal(X(35) + 16, Z(53), H2); K.goal(X(37), Z(48), H2 + 8, { wait: 5 }); K.goal(X(39) + 16, Z(48), H3);
  K.goal(X(56) + 16, Z(56) + 16, H3); K.goal(X(52) + 16, Z(39) + 16, H3); K.goal(X(47) + 16, Z(39) + 16, H3 + 8, { wait: 5 }); K.goal(X(47) + 16, Z(43), H4, { wait: 15 }); K.goal(X(43) + 16, Z(44) + 16, H4, { wait: 10 }); K.goal(X(43) + 16, Z(52) + 16, H4, { wait: 10 }); K.goal(X(52) + 16, Z(52) + 16, H4, { wait: 10 }); K.goal(X(51), Z(44) + 16, H4, { wait: 8 });
  K.goal(X(51), Z(48), H4 + 8, { wait: 5 });
});
