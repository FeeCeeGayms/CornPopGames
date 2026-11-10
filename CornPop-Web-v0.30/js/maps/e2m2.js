// E2M2 — TIMES SQUARE. Up from 42nd Street into the square: a canyon of billboards, the red steps, Broadway and
// 7th Avenue. The red key is on the open top deck of the parking garage on W 45th St; it opens the police line on
// W 44th St. The theater's doors only open once the three dead neon switches high on the billboards are shot back on.
// The blue key waits on the stage ("Showtime!"), and opens Broadway's north gate to the tour bus on W 47th St.
import { makeLevel } from '../kit.js';
import { nyc, NYC_STYLES } from '../nyc.js';

export default makeLevel({
  name: 'E2M2', title: 'E2M2: TIMES SQUARE', ambience: 'street', ambient: 24, ambientColor: [0.72, 0.6, 1.0], music: 'assets/music/e1m6.mp3', city: true,
  fog: { color: [0.045, 0.03, 0.05], density: 0.0005 }, skyTint: [0.45, 0.3, 0.55],
  rain: { density: 1200, wind: [40, -20] }, storm: { every: [7, 15], power: 0.85 }, styles: NYC_STYLES,
}, 112, 112, 'office', K => {
  const { X, Z, C } = K; const T = s => K.type(s); const N = nyc(K, { sky: 1800 });
  const LOBBY = { f: 8, c: 200, floor: 'carpet', ceil: 'gold', side: 'gold', upper: 'limestone', roof: 360, roofSky: 1800 };
  const AUD = { floor: 'carpet', ceil: 'ceil', side: 'wood', upper: 'curtain', c: 360, head: 0, roof: 360, roofSky: 1800 };
  const PIT = { f: -168, c: 360, floor: 'wood', ceil: 'ceil', side: 'wood', upper: 'curtain', roof: 360, roofSky: 1800 };
  const STAGE = { f: -72, c: 360, floor: 'wood', ceil: 'ceil', side: 'wood', upper: 'curtain', roof: 360, roofSky: 1800 };
  const HIDE = { f: 152, c: 260, floor: 'boards', ceil: 'wood', side: 'wood', upper: 'curtain', roof: 360, roofSky: 1800 };

  // ======================= BLOCKS =======================
  N.building(2, 18, 37, 49, 520, 'office', { tower: false });
  N.building(2, 60, 37, 91, 360, 'limestone', { inner: 'curtain', tower: false, bulk: false });          // the theater
  N.building(52, 18, 57, 37, 700, 'glasstower', { tower: false, bulk: false });                          // north wedge
  N.building(52, 69, 57, 91, 1000, 'limestone', { tower: false, bulk: false });                          // One Times Square (stacked boards)
  N.building(72, 18, 77, 43, 620, 'office', { tower: false });
  N.building(106, 18, 109, 43, 300, 'tenement');
  N.building(72, 54, 109, 91, 460, 'glasstower', { tower: false });
  N.building(78, 18, 105, 19, 300, 'brickdark', { parapet: false, tower: false, bulk: false, ac: 0 });
  N.building(2, 106, 109, 108, 380, 'tenementdark', { parapet: false, tower: false, bulk: false, ac: 0 });
  N.building(2, 2, 109, 5, 420, 'tenement', { parapet: false, tower: false, bulk: false, ac: 0 });

  // ======================= STREETS =======================
  N.street(2, 92, 109, 105, 'x', { cross: [37, 52, 57, 72], lampEvery: 11 });   // W 42nd St
  N.street(2, 6, 109, 17, 'x', { walk: 2, lampEvery: 12 });                       // W 47th St
  N.street(38, 18, 51, 91, 'z', { cross: [20, 89], lampEvery: 12 });              // Broadway
  N.street(58, 18, 71, 91, 'z', { cross: [20, 89], lampEvery: 12 });              // 7th Avenue
  N.road(41, 92, 48, 94); N.road(61, 92, 68, 94); N.road(41, 15, 48, 17); N.road(61, 15, 68, 17);
  N.plaza(41, 38, 68, 68, 8, 'sidewalk');                                          // the pedestrian plaza
  N.street(2, 50, 37, 59, 'x', { walk: 2, lampEvery: 9 });                         // W 44th St
  N.street(72, 44, 109, 53, 'x', { walk: 2, lampEvery: 9 });                       // W 45th St
  K.paint(78, 20, 105, 43, T(N.sky(8, 'concretedark', 'concrete', { upper: 'concrete' })));   // parking garage footprint
  N.streetSign(X(38) - 12, Z(92) - 12, 8, 'st_42st', 'st_broadway'); N.streetSign(X(72) + 12, Z(92) - 12, 8, 'st_42st', 'st_7av');
  N.streetSign(X(52) - 12, Z(38) - 12, 8, 'st_timessq', 'st_broadway'); N.streetSign(X(38) - 12, Z(50) - 12, 8, 'st_w44st', 'st_broadway');
  K.ambient(X(55), 60, Z(55), 'wind', 2600, 0.5);

  // ======================= THE BILLBOARD CANYON =======================
  const WB = N.face(2, 18, 37, 49, 'e'), WT = N.face(2, 60, 37, 91, 'e'), NW = N.face(52, 18, 57, 37, 's'), OT = N.face(52, 69, 57, 91, 'n');
  const EB = N.face(72, 18, 77, 43, 'w'), ES = N.face(72, 54, 109, 91, 'w'), WTs = N.face(52, 69, 57, 91, 'w'), WTe = N.face(52, 69, 57, 91, 'e');
  N.billboard(WB, Z(26), 220, 'bb_cola', 300, 150, [1, 0.3, 0.25]); N.billboard(WB, Z(40), 420, 'bb_frenta', 300, 150, [0.4, 1, 0.5]); N.billboard(WB, Z(30), 640, 'bb_news', 360, 90, [1, 0.35, 0.3]);
  N.billboard(WT, Z(66), 230, 'bb_beans', 320, 160, [1, 0.4, 0.9]); N.billboard(WT, Z(82), 260, 'bb_cornpop', 260, 130, [1, 0.8, 0.5]);
  N.billboard(NW, X(55), 260, 'bb_pizza', 190, 96, [1, 0.6, 0.3]); N.billboard(NW, X(55), 470, 'bb_marv', 190, 96, [0.5, 0.8, 1]);
  N.billboard(OT, X(55), 220, 'bb_ballinki', 190, 96, [0.8, 1, 0.4]); N.billboard(OT, X(55), 360, 'bb_cola', 190, 96, [1, 0.3, 0.25]); N.billboard(OT, X(55), 640, 'bb_beans', 190, 96, [1, 0.4, 0.9]); N.billboard(OT, X(55), 800, 'bb_news', 190, 48, [1, 0.35, 0.3]);
  N.billboard(EB, Z(30), 300, 'bb_pizza', 360, 180, [1, 0.6, 0.3]); N.billboard(ES, Z(62), 240, 'bb_marv', 300, 150, [0.5, 0.8, 1]); N.billboard(ES, Z(78), 420, 'bb_frenta', 320, 160, [0.4, 1, 0.5]);
  N.billboard(WTs, Z(80), 300, 'bb_cornpop', 200, 100, [1, 0.8, 0.5]); N.billboard(WTe, Z(80), 300, 'bb_ballinki', 200, 100, [0.8, 1, 0.4]);
  K.props(pr => { // neon strips along the canyon walls
    for (const [x, z0, z1, y, t] of [[X(38) - 3, Z(19), Z(49), 150, 'neonpink'], [X(38) - 3, Z(61), Z(91), 150, 'neoncyan'], [X(72) + 3, Z(19), Z(43), 160, 'neoncyan'], [X(72) + 3, Z(55), Z(91), 160, 'neonpink']]) pr.box(x, y, (z0 + z1) / 2, 4, 5, z1 - z0, t, { fullbright: true });
    for (const [z, y, t] of [[Z(38) + 3, 140, 'neonpink'], [Z(69) - 3, 150, 'neoncyan']]) pr.box(X(55), y, z, 190, 5, 4, t, { fullbright: true });
  });
  for (const [x, z, col] of [[X(42), Z(44), [1, 0.3, 0.7]], [X(42), Z(62), [0.3, 0.9, 1]], [X(67), Z(44), [0.3, 0.9, 1]], [X(67), Z(62), [1, 0.3, 0.7]], [X(55), Z(66), [0.4, 1, 0.5]], [X(55), Z(41), [1, 0.6, 0.3]]]) K.light(x, 160, z, 480, col);
  // the red steps (TKTS) and the police booth
  K.stairBrush(X(52), Z(44), X(58), Z(53), 8, 152, 'N', 'curb', 'carred');
  K.props(pr => { for (let k = 0; k < 9; k++) pr.box(X(55), 8 + 16 * (k + 1) - 2, Z(53) - k * 32 - 31, 192, 3, 2, 'neonpink', { fullbright: true }); });
  K.brush([X(52), 8, Z(43)], [X(58), 152, Z(44)], { tex: 'glasstower', top: 'metal' });
  K.brush([X(59) + 16, 8, Z(58)], [X(62) + 16, 104, Z(61)], { tex: 'carwhite', top: 'metal', nz: 'awningB' }); K.decal({ at: [X(61), 84, Z(58)], n: 'nz', w: 90, h: 22, tex: 'sign_police', fullbright: true, off: 1 });
  K.light(X(61), 130, Z(58), 260, [1, 0.12, 0.05], 3); K.light(X(61), 132, Z(61), 260, [0.15, 0.3, 1], 4);
  for (const [x, z] of [[X(45), Z(48)], [X(64), Z(48)], [X(45), Z(60)], [X(64), Z(64)]]) N.bench(x, z, 8, 'z');
  N.car(X(44), Z(78), 0, 0.2, 'taxi'); N.car(X(47), Z(28), 0, Math.PI - 0.1, 'taxi'); N.car(X(64), Z(80), 0, Math.PI + 0.3, 'burnt'); N.car(X(65), Z(26), 0, 0.5, 'cop'); N.car(X(62), Z(72), 0, 2.2, 'taxi');
  N.barrelFire(X(50), Z(66), 8); N.barrelFire(X(60), Z(40), 8); N.trash(X(41), Z(66), 8, 5); N.trash(X(68), Z(40), 8, 4); N.steam(X(45), Z(84), 0); N.steam(X(64), Z(86), 0);
  // the three dead neon switches (shoot them): One Times Square, the 7th Avenue boards, the north wedge
  K.button({ min: [X(54) + 4, 290, Z(69) - 8], max: [X(56) - 4, 318, Z(69)], shoot: true, counter: 'neon', count: 3, target: 'theaterdoors', msg: 'A neon switch flickers back on!' });
  K.button({ min: [X(72) - 8, 330, Z(70) + 4], max: [X(72), 358, Z(71) - 4], shoot: true, counter: 'neon', count: 3, target: 'theaterdoors', msg: 'A neon switch flickers back on!' });
  K.button({ min: [X(54) + 4, 340, Z(38)], max: [X(56) - 4, 368, Z(38) + 8], shoot: true, counter: 'neon', count: 3, target: 'theaterdoors', msg: 'A neon switch flickers back on!' });
  K.decal({ at: [X(55), 304, Z(69) - 8], n: 'nz', w: 26, h: 26, tex: 'button', fullbright: true }); K.decal({ at: [X(72) - 8, 344, Z(70) + 16], n: 'nx', w: 26, h: 26, tex: 'button', fullbright: true }); K.decal({ at: [X(55), 354, Z(38) + 8], n: 'pz', w: 26, h: 26, tex: 'button', fullbright: true });
  for (const [x, y, z] of [[X(55), 304, Z(68)], [X(71), 344, Z(70) + 16], [X(55), 354, Z(39)]]) K.light(x, y, z, 160, [1, 0.15, 0.1]);
  K.msg([X(41), 8, Z(38)], [X(69), 120, Z(44)], 'The theater is dark. Three neon switches high on the billboards have blown... shoot them back on.');
  K.qoqC(44, 42, 180); K.qoqC(48, 56, 180); K.qoqC(63, 46, 180); K.qoqC(66, 58, 180); K.qoqC(55, 64, 180); K.marvC(58, 50, 180); K.qoq(X(55), Z(45), 180, { turret: true, y: 152 });
  K.qoqC(45, 74, 0); K.qoqC(65, 76, 0); K.qoqC(44, 30, 180); K.qoqC(64, 24, 180);
  K.juice(X(42), Z(40)); K.juice(X(67), Z(66)); K.health(X(53), Z(66)); K.health(X(66), Z(40)); K.juice(X(45), Z(86));
  K.slices([[X(46), Z(46)], [X(50), Z(60)], [X(60), Z(52)], [X(64), Z(60)], [X(55), Z(47), 120], [X(45), Z(70)], [X(64), Z(70)]]);

  // ======================= 42nd STREET (start) =======================
  K.start(8, 99, 0);
  K.item('candygun', X(10), Z(96)); K.msg([X(6), 0, Z(93)], [X(14), 120, Z(100)], 'A CANDY CORN MACHINE GUN! Hold FIRE to spin it up.');
  const S42 = N.face(2, 106, 109, 108, 'n');
  for (const [a, n, o] of [[X(8), 'theater', { awning: 'B' }], [X(18), 'pizza', {}], [X(27), 'liquor', { closed: true }], [X(34), 'cafe', { awning: 'G', neon: true }], [X(46), 'theater', { awning: 'R' }], [X(60), 'bodega', { awning: 'G' }], [X(76), 'pawn', { closed: true }], [X(84), 'diner', { awning: 'R', neon: true }], [X(94), 'tattoo', {}], [X(104), 'laundry', { closed: true }]]) N.shop(S42, a, n, o);
  N.tag(S42, X(30), 44, 'tag_qoq'); N.tag(S42, X(80), 44, 'tag_cornpop'); N.billboard(S42, X(52), 220, 'bb_news', 300, 72, [1, 0.35, 0.3]);
  N.car(X(22), Z(98), 0, Math.PI / 2 + 0.2, 'taxi'); N.car(X(31), Z(100), 0, -Math.PI / 2 + 0.1, 'burnt'); N.car(X(78), Z(97), 0, Math.PI / 2, 'cop'); N.car(X(92), Z(100), 0, 1.9, 'burnt', { fireSize: 44 }); N.car(X(101), Z(97), 0, -1.4, 'taxi');
  K.brush([X(88), 0, Z(95)], [X(91), 112, Z(101) + 20], { tex: 'busside', top: 'metal', nx: 'carglass', px: 'carglass' }); N.fire(X(89) + 16, Z(98), 112, 40); // burnt-out bus across the street
  N.barrelFire(X(14), Z(93) + 16, 8); N.trash(X(26), Z(93) + 10, 8, 5); N.trash(X(70), Z(104), 8, 6); N.hydrant(X(36), Z(93) + 8, 8); N.steam(X(16), Z(99), 0); N.steam(X(84), Z(98), 0);
  K.qoqC(20, 96, 0); K.qoqC(30, 102, 0); K.qoqC(44, 98, 0); K.qoqC(64, 101, 0); K.qoqC(82, 97, -90); K.qoqC(98, 101, -90); K.marvC(104, 97, -90);
  K.juice(X(28), Z(104)); K.health(X(70), Z(93) + 12); K.juice(X(106), Z(104)); K.slices([[X(16), Z(96)], [X(40), Z(100)], [X(58), Z(97)], [X(86), Z(103)], [X(100), Z(94)]]);
  // abandoned theater on 42nd: boards under the marquee hide a stash
  K.paint(44, 106, 48, 108, T({ f: 8, c: 120, floor: 'carpet', ceil: 'ceil', side: 'wood', upper: 'tenementdark', roof: 380, roofSky: 1800 }));
  K.breakable([X(44), 8, Z(106) - 2], [X(49), 112, Z(106) + 8], { tex: 'boards', health: 24, secret: true });
  K.item('candybag', X(45), Z(107), { amount: 50 }); K.health(X(47), Z(107)); K.slice(X(46), Z(108)); K.light(X(46), 80, Z(107), 150, [1, 0.6, 0.3], 1);

  // ======================= W 45th ST & THE PARKING GARAGE (red key on the top deck) =======================
  const G = N.face(78, 20, 105, 43, 's');
  K.post(ctx => {
    const x0 = X(78), x1 = X(106), z0 = Z(20), z1 = Z(44);
    // deck 1 (136) leaves the east ramp well open; deck 2 (264, open to the sky) leaves the west ramp well open
    ctx.brush([x0, 128, z0], [X(100), 136, z1], { tex: 'concrete', top: 'concretedark', bottom: 'concrete' }); ctx.brush([X(100), 128, z0], [x1, 136, Z(34)], { tex: 'concrete', top: 'concretedark', bottom: 'concrete' });
    ctx.brush([X(84), 256, z0], [x1, 264, z1], { tex: 'concrete', top: 'concretedark', bottom: 'concrete' }); ctx.brush([x0, 256, Z(30)], [X(84), 264, z1], { tex: 'concrete', top: 'concretedark', bottom: 'concrete' });
    for (const y of [136, 264]) { ctx.brush([x0, y, z1 - 6], [x1, y + 40, z1], { tex: 'concrete', top: 'parapet' }); ctx.brush([x0, y, z0], [x0 + 6, y + 40, z1], { tex: 'concrete', top: 'parapet' }); ctx.brush([x1 - 6, y, z0], [x1, y + 40, z1], { tex: 'concrete', top: 'parapet' }); }
    ctx.brush([x0, 8, z1 - 6], [X(86), 48, z1], { tex: 'concrete', top: 'parapet' }); ctx.brush([X(98), 8, z1 - 6], [x1, 48, z1], { tex: 'concrete', top: 'parapet' }); // street-level wall with the entrance gap
    for (const x of [X(84), X(92), X(100)]) for (const z of [Z(28), Z(36)]) if (!(x === X(100) && z === Z(36)) && !(x === X(84) && z === Z(28))) ctx.brush([x - 10, 8, z - 10], [x + 10, 256, z + 10], { tex: 'concrete' });
    ctx.decal({ at: [X(92), 110, z1 + 1], n: 'pz', w: 160, h: 36, tex: 'sign_p', fullbright: true });
  });
  K.stairBrush(X(100), Z(34), X(105), Z(43), 8, 136, 'N', 'concrete', 'concretedark');
  K.stairBrush(X(79), Z(21), X(84), Z(30), 136, 264, 'S', 'concrete', 'concretedark');
  for (const [x, z, y, ry, k] of [[X(81), Z(36), 8, 0, 'sedan'], [X(88), Z(24), 8, 0, 'black'], [X(96), Z(38), 8, Math.PI, 'taxi'], [X(88), Z(36), 136, 0, 'sedan'], [X(96), Z(24), 136, Math.PI, 'cop'], [X(81), Z(36) + 16, 136, 0.1, 'burnt'], [X(92), Z(36), 264, 0.2, 'taxi'], [X(100), Z(25), 264, 1.5, 'burnt']]) N.car(x, z, y, ry, k, { lights: false, fire: k === 'burnt' && y === 264 });
  for (const [x, z, y] of [[X(84), Z(32), 120], [X(96), Z(32), 120], [X(84), Z(32), 248], [X(100), Z(40), 248]]) K.lamp(x, y, z, 210);
  K.light(X(90), 40, Z(32), 260, [1, 0.85, 0.55]);
  K.key('red', X(92) + 16, Z(24) + 16, 264);
  K.qoqC(84, 32, 180); K.qoqC(94, 26, 180); K.qoq(X(90), Z(40), 0, { y: 136 }); K.qoq(X(82), Z(24), 90, { y: 136 }); K.qoq(X(98), Z(32), 90, { turret: true, y: 264 }); K.marv(X(88), Z(40), 0, { y: 264 });
  K.juice(X(80), Z(42)); K.health(X(102), Z(22), 136); K.juice(X(86), Z(26), 264); K.slices([[X(90), Z(30)], [X(104), Z(30), 136], [X(80), Z(40), 264]]);
  K.wave('redkey', { onKey: 'red', msg: 'Car alarms everywhere! The Qoqs are coming up the ramps!' });
  for (const [c, r, y] of [[103, 38, 8], [90, 30, 136], [82, 34, 264], [102, 28, 264], [95, 42, 136]]) K.qoq(C(c), C(r), 0, { wave: 'redkey', y });
  // secret cage behind the boards at the back of the ground floor
  K.paint(106, 22, 108, 26, T({ f: 8, c: 120, floor: 'grate', ceil: 'ceil', side: 'concrete', upper: 'tenement', roof: 300, roofSky: 1800 }));
  K.breakable([X(106) - 2, 8, Z(22)], [X(106) + 8, 120, Z(27)], { tex: 'boards', health: 24, secret: true });
  K.item('sausages', X(107), Z(23), { amount: 12 }); K.item('turdbox', X(107), Z(25), { amount: 4 }); K.slice(X(108), Z(24)); K.light(X(107), 80, Z(24), 150, [1, 0.6, 0.3], 1);
  // W 45th street dressing
  const E45 = N.face(72, 54, 109, 91, 'n');
  N.shop(E45, X(76), 'hotel', { awning: 'R' }); N.shop(E45, X(88), 'bar', { closed: true }); N.shop(E45, X(100), 'noodle', { awning: 'R', neon: true });
  N.car(X(80), Z(48), 0, Math.PI / 2 + 0.3, 'taxi'); N.car(X(104), Z(49), 0, -0.8, 'burnt'); N.barrelFire(X(94), Z(53), 8); N.trash(X(84), Z(53), 8, 5);
  K.qoqC(84, 48, 90); K.qoqC(98, 47, 90); K.qoqC(106, 50, 90); K.juice(X(108), Z(45)); K.slices([[X(90), Z(49)], [X(102), Z(46)]]);

  // ======================= W 44th ST: the police line (red key) and the theater =======================
  K.post(ctx => {
    for (const [a, b] of [[Z(50), Z(53)], [Z(57), Z(60)]]) { ctx.brush([X(35) + 4, 0, a], [X(35) + 28, 52, b], { tex: 'concrete', top: 'concrete' }); ctx.brush([X(35) + 12, 52, a], [X(35) + 18, 132, b], { tex: 'bars', noshadow: true }); }
    ctx.mover({ type: 'door', min: [X(35) + 10, 0, Z(53)], max: [X(35) + 20, 132, Z(57)], key: 'red', tex: 'door_red', name: 'police44', wait: -1, lip: 8, speed: 110 });
    ctx.decal({ at: [X(35) + 28, 34, Z(51) + 16], n: 'px', w: 90, h: 16, tex: 'sign_police', off: 0.8 }); ctx.decal({ at: [X(35) + 28, 34, Z(58) + 16], n: 'px', w: 90, h: 16, tex: 'sign_police', off: 0.8 });
  });
  K.light(X(36), 120, Z(55), 300, [1, 0.12, 0.05], 3); K.light(X(36), 122, Z(55), 300, [0.15, 0.3, 1], 4);
  K.msg([X(36), 0, Z(50)], [X(40), 120, Z(60)], 'POLICE LINE. The gate needs the RED keycard.');
  const TF = N.face(2, 60, 37, 91, 'n'), NF = N.face(2, 18, 37, 49, 's');
  N.decalOn(TF, X(20), 168, 300, 60, 'shop_theater', true); N.billboard(TF, X(20), 250, 'bb_beans', 300, 96, [1, 0.4, 0.9]);
  K.brush([X(14), 128, Z(60) - 52], [X(26), 140, Z(60)], { tex: 'gold', top: 'metal', bottom: 'glow' }); for (const x of [X(15), X(25)]) K.light(x, 120, Z(59), 220, [1, 0.8, 0.45]);
  N.shop(TF, X(8), 'bar', { closed: true }); N.shop(TF, X(32), 'cafe', { awning: 'R' }); N.shop(NF, X(10), 'deli', { awning: 'G' }); N.shop(NF, X(22), 'pawn', { closed: true }); N.shop(NF, X(31), 'liquor', { neon: true });
  N.fireEscape(NF, X(4), 3, { dir: 1 }); N.tag(NF, X(16), 40, 'tag_beans');
  N.car(X(10), Z(54), 0, -Math.PI / 2, 'sedan'); N.car(X(26), Z(55), 0, Math.PI / 2 + 0.4, 'burnt', { fireSize: 30 }); N.trash(X(6), Z(51), 8, 4); N.hydrant(X(30), Z(59), 8);
  K.qoqC(12, 56, 90); K.qoqC(22, 52, 90); K.qoqC(30, 57, 90); K.qoq(X(14), Z(50) + 22, 180, { turret: true, y: 200 });
  K.juice(X(4), Z(58)); K.health(X(33), Z(51)); K.slices([[X(16), Z(55)], [X(28), Z(52)]]);
  K.secret([X(18), 280, Z(50)], [X(20) + 16, 400, Z(50) + 44]); K.health(X(18) + 16, Z(50) + 22, 296); K.item('candybag', X(19) + 24, Z(50) + 22, { amount: 50, y: 296 });
  // theater lobby
  K.paint(14, 61, 25, 66, T(LOBBY));
  K.door(16, 60, 23, 60, LOBBY, { targeted: true, name: 'theaterdoors', wait: -1, top: 112, tex: 'gold', message: 'The doors are locked. The neon outside is dead...' });
  for (const x of [X(15), X(24) + 16]) K.column(x, Z(64), 20, 8, 200, 'gold', 'trim');
  K.fixture(X(20), Z(63), 200, 160, 'x', 'lightamber', 320, [1, 0.8, 0.5]); K.decal({ at: [X(14), 90, Z(63) + 16], n: 'px', w: 70, h: 110, tex: 'poster' }); K.decal({ at: [X(26), 90, Z(63) + 16], n: 'nx', w: 70, h: 110, tex: 'pot_heroes' });
  K.counter(X(18), Z(65), X(22), Z(66) + 20, 40, 'drawer', 'nz', 'gold');
  K.qoqC(16, 63, 0); K.qoqC(24, 64, 0); K.juice(X(15), Z(66)); K.slice(X(25), Z(62));
  // auditorium: raked floor down to the orchestra pit and the raised stage
  K.paint(17, 67, 22, 67, T({ f: 8, c: 200, floor: 'carpet', ceil: 'gold', side: 'gold', upper: 'curtain', roof: 360, roofSky: 1800 }));
  K.stairs(6, 68, 33, 84, 'N', -120, 0, AUD);
  K.paint(10, 85, 29, 86, T(PIT)); K.stairs(6, 85, 9, 86, 'S', -104, -88, { ...STAGE, f: undefined, c: 360, head: 0 }); K.stairs(30, 85, 33, 86, 'S', -104, -88, { ...STAGE, f: undefined, c: 360, head: 0 });
  K.paint(6, 87, 33, 90, T(STAGE));
  K.stairBrush(X(19), Z(85), X(21), Z(87), -168, -120, 'N', 'wood', 'wood'); // steps out of the orchestra pit
  K.post(ctx => { // seat rows with aisles at the sides and in the middle
    for (let r = 69; r <= 83; r += 2) { const y = ctx.floor(10, r); for (const [a, b] of [[X(8), X(18)], [X(22), X(32)]]) ctx.brush([a, y, Z(r) + 8], [b, y + 22, Z(r) + 24], { tex: 'leather', top: 'leather' }); }
    ctx.decal({ at: [X(20), 120, Z(91)], n: 'nz', w: 800, h: 220, tex: 'curtain', off: 0.6 });
  });
  K.arch(X(6), Z(86) + 16, X(34), Z(87), 200, 360, 'gold', 'gold');
  K.catwalk(X(6), Z(68), X(34), Z(72), 152, { rails: 's', tex: 'wood', top: 'carpet', supports: [[X(12), Z(72) - 4], [X(28), Z(72) - 4]] });
  K.stairBrush(X(6), Z(61), X(10), Z(68), 8, 152, 'S', 'stepside', 'carpet'); K.paint(6, 61, 10, 67, T({ f: 8, c: 360, floor: 'carpet', ceil: 'ceil', side: 'wood', upper: 'curtain', roof: 360, roofSky: 1800 }));
  K.door(11, 63, 13, 65, LOBBY, { top: 104 });
  for (const [x, col] of [[X(10), [1, 0.3, 0.4]], [X(20), [1, 0.85, 0.6]], [X(30), [0.4, 0.5, 1]]]) K.light(x, 280, Z(86), 420, col);
  for (const r of [72, 78]) { K.lantern(X(6), -20 + (r - 72) * -6, Z(r), 'px', 200); K.lantern(X(34), -20 + (r - 72) * -6, Z(r), 'nx', 200); }
  K.light(X(20), 100, Z(70), 300, [1, 0.75, 0.5]);
  K.key('blue', X(20) + 16, Z(88) + 16, -72); K.light(X(20), -20, Z(89), 260, [0.4, 0.6, 1]);
  K.qoqC(12, 74, 0); K.qoqC(27, 77, 0); K.qoqC(20, 80, 0); K.marvC(14, 88, 0); K.qoq(X(20), Z(70), 180, { turret: true, y: 152 }); K.qoq(X(30), Z(70), 180, { turret: true, y: 152 });
  K.juice(X(7), Z(80)); K.health(X(33), Z(80)); K.juice(X(26), Z(70), 152); K.slices([[X(20), Z(74)], [X(8), Z(70)], [X(32), Z(70)], [X(12), Z(88)], [X(28), Z(88)]]);
  K.wave('showtime', { onKey: 'blue', msg: 'SHOWTIME! The curtain rises... and the whole cast wants a piece of you!' });
  for (const [c, r, y] of [[8, 89, -72], [32, 89, -72], [10, 82], [30, 82], [14, 70, 152], [26, 70, 152], [20, 76], [20, 85, -168]]) K.qoq(C(c), C(r), 0, { wave: 'showtime', y });
  // projection booth secret off the balcony (boarded up)
  K.paint(27, 64, 31, 67, T(HIDE)); K.breakable([X(27), 152, Z(68) - 8], [X(32), 260, Z(68)], { tex: 'boards', health: 24, secret: true });
  K.item('turdgun', X(29), Z(65), { y: 152 }); K.health(X(28), Z(66), 152); K.slice(X(30), Z(66), 152); K.light(X(29), 220, Z(65), 170, [1, 0.6, 0.3], 1);
  K.decal({ at: [X(29), 210, Z(64)], n: 'pz', w: 60, h: 40, tex: 'crt', fullbright: true });

  // ======================= BROADWAY NORTH GATE (blue key) & W 47th ST =======================
  K.post(ctx => {
    ctx.brush([X(38), 0, Z(19)], [X(41), 140, Z(19) + 10], { tex: 'bars', noshadow: true }); ctx.brush([X(49), 0, Z(19)], [X(52), 140, Z(19) + 10], { tex: 'bars', noshadow: true });
    ctx.mover({ type: 'door', min: [X(41), 0, Z(19)], max: [X(49), 140, Z(19) + 10], key: 'blue', tex: 'door_blue', name: 'bwaygate', wait: -1, lip: 8, speed: 110 });
    ctx.brush([X(58), 0, Z(18)], [X(72), 150, Z(19) + 16], { tex: 'rubble', top: 'rubble' });
  });
  N.car(X(64), Z(21), 0, 1.3, 'burnt', { fireSize: 46 }); N.car(X(60), Z(22), 0, -0.6, 'burnt', { fire: false });
  K.msg([X(38), 0, Z(20)], [X(52), 120, Z(24)], 'The north gate on Broadway needs the BLUE keycard.');
  const N47 = N.face(2, 2, 109, 5, 's');
  for (const [a, n, o] of [[X(8), 'bodega', { awning: 'G' }], [X(20), 'pharmacy', {}], [X(32), 'pizza', { awning: 'R', neon: true }], [X(60), 'hardware', { closed: true }], [X(74), 'chinese', { awning: 'R' }], [X(86), 'deli', {}]]) N.shop(N47, a, n, o);
  N.tag(N47, X(46), 40, 'tag_marv'); N.billboard(N47, X(52), 260, 'bb_cola', 320, 120, [1, 0.3, 0.25]);
  N.car(X(16), Z(11), 0, Math.PI / 2, 'taxi'); N.car(X(40), Z(13), 0, -Math.PI / 2 + 0.3, 'cop'); N.car(X(72), Z(10), 0, Math.PI / 2 - 0.2, 'burnt'); N.barrelFire(X(28), Z(16), 8); N.trash(X(56), Z(7), 8, 5);
  // the tour bus is the way out
  K.brush([X(90), 0, Z(8)], [X(104), 140, Z(11)], { tex: 'busside', top: 'metal', nx: 'carglass', px: 'carglass' });
  K.sign(X(97), 152, Z(11), 'pz', 'sign_exit', 96, 34); K.decal({ at: [X(93), 96, Z(11)], n: 'pz', w: 140, h: 26, tex: 'sign_bridge', fullbright: true });
  K.exit(X(98), 0, Z(11), 'pz');
  K.qoqC(10, 12, 90); K.qoqC(24, 10, 90); K.qoqC(48, 12, -90); K.qoqC(66, 13, -90); K.marvC(80, 11, -90); K.qoqC(88, 14, -90);
  K.wave('bus', { min: [X(80), 0, Z(7)], max: [X(108), 120, Z(17)], msg: 'Last stop! Something is coming off the rooftops!' });
  for (const [c, r] of [[106, 8], [106, 15], [84, 7], [96, 15]]) K.qoqC(c, r, -90, { wave: 'bus' });
  K.juice(X(4), Z(14)); K.health(X(60), Z(14)); K.juice(X(84), Z(8)); K.health(X(106), Z(12)); K.slices([[X(12), Z(8)], [X(36), Z(10)], [X(58), Z(9)], [X(78), Z(15)]]);

  // bot route: garage top deck (red), the three neon switches, the stage (blue), the tour bus
  K.goal(X(60), Z(90)); K.goal(X(90), Z(48)); K.goal(X(102), Z(40)); K.goal(X(92) + 16, Z(24) + 16, 264);
  K.goal(X(55), Z(66), 8, { shoot: [X(55), 304, Z(69) - 4] }); K.goal(X(60), Z(70), 8, { shoot: [X(72) - 4, 344, Z(70) + 16] }); K.goal(X(55), Z(42) - 8, 8, { shoot: [X(55), 354, Z(38) + 4] });
  K.goal(X(36) + 24, Z(55)); K.goal(X(20), Z(58)); K.goal(X(20), Z(66)); K.goal(X(19), Z(84)); K.goal(X(20) + 16, Z(88) + 16, -72);
  K.goal(X(36) + 24, Z(55)); K.goal(X(45), Z(24)); K.goal(X(60), Z(12));
});
