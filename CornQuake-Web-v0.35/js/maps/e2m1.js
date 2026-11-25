// E2M1 — HELL'S KITCHEN. 42nd Street & 8th Avenue in a thunderstorm: burning cabs on 42nd St, a deli whose
// basement freezer holds the red key, a police checkpoint across 8th Avenue, a hotel lobby (blue key on the
// mezzanine), W 44th St with fire escapes and an alley gate that opens from that side, and the subway down to the exit.
import { makeLevel } from '../kit.js';
import { nyc, NYC_STYLES } from '../nyc.js';

export default makeLevel({
  name: 'E2M1', title: "E2M1: HELL'S KITCHEN", ambience: 'street', ambient: 22, ambientColor: [0.55, 0.62, 1.05], music: 'assets/music/e1m4.mp3', city: true,
  fog: { color: [0.03, 0.032, 0.045], density: 0.00055 }, skyTint: [0.32, 0.32, 0.5],
  // v0.31: night, rain and lightning
  sky: { hell: 1, silh: 'city', moon: 1, a: [0.012, 0.014, 0.03], b: [0.2, 0.22, 0.38], glow: [0.16, 0.1, 0.06] },
  rain: { density: 1200, wind: [-50, 30] }, storm: { every: [6, 14], power: 1 }, styles: NYC_STYLES,
}, 112, 108, 'tenementdark', K => {
  const { X, Z, C } = K; const T = s => K.type(s); const N = nyc(K, { sky: 1600 });
  const DELI = { f: 8, c: 136, floor: 'checker', ceil: 'ceil', side: 'shopwall', upper: 'tenement', roof: 256, roofSky: 1600 };
  const BACK = { f: 8, c: 120, floor: 'concretedark', ceil: 'ceil', side: 'trim', upper: 'tenement', roof: 256, roofSky: 1600 };
  const BASE = { f: -152, c: -24, floor: 'concretedark', ceil: 'ceil', side: 'stepside', upper: 'brickdark', roof: 288, roofSky: 1600 };
  const FREEZE = { f: -152, c: -40, floor: 'diamond', ceil: 'steeldark', side: 'trim', upper: 'chrome', roof: 288, roofSky: 1600 };
  const LOBBY = { f: 8, c: 232, floor: 'carpet', ceil: 'ceil', side: 'trim', upper: 'limestone', roof: 640, roofSky: 1600 };
  const STASH = { f: 8, c: 120, floor: 'tilebrown', ceil: 'ceil', side: 'trim', upper: 'brownstone', roof: 416, roofSky: 1600 };
  const STA = { f: -152, c: -24, floor: 'tile', ceil: 'ceil', side: 'stepside', upper: 'brownstone', roof: 384, roofSky: 1600 };
  const PLAT = { f: -152, c: 8, floor: 'tile', ceil: 'ceil', side: 'hazard', upper: 'subwaytile', roof: 384, roofSky: 1600 };
  const PIT = { f: -216, c: 8, floor: 'grate', ceil: 'ceil', side: 'concretedark', upper: 'subwaytile', roof: 384, roofSky: 1600 };

  // ======================= BLOCKS (rooftops are floors, so the skyline steps) =======================
  N.building(2, 94, 18, 106, 320, 'tenement');
  N.building(19, 94, 37, 106, 416, 'brownstone');
  N.building(38, 94, 60, 106, 256, 'tenement', { tower: [X(50), Z(103)], inner: 'shopwall' });
  N.building(61, 94, 79, 106, 288, 'office');
  N.building(80, 94, 96, 106, 384, 'limestone');
  N.building(97, 94, 109, 106, 224, 'tenementdark');
  N.building(2, 42, 17, 79, 352, 'tenement');
  N.building(18, 42, 29, 79, 288, 'brownstone', { parapet: 'nsw' });
  N.building(34, 42, 47, 79, 448, 'office');
  N.building(48, 42, 63, 79, 320, 'tenement');
  N.building(2, 6, 24, 29, 384, 'tenementdark');
  N.building(25, 6, 47, 29, 288, 'brownstone', { gaps: [['s', X(41), X(46)]], tower: [X(30), Z(14)] });
  N.building(48, 6, 63, 29, 640, 'limestone');
  N.building(78, 4, 109, 29, 384, 'brownstone', { inner: 'subwaytile', tower: false, bulk: false });
  N.building(78, 52, 92, 79, 544, 'glasstower', { tower: false });
  N.building(93, 52, 109, 79, 256, 'tenementdark', { tower: false });

  // ======================= STREETS =======================
  N.street(2, 80, 109, 93, 'x', { cross: [62, 81], lampEvery: 10 });          // W 42nd St
  N.street(64, 6, 77, 79, 'z', { cross: [77], lampEvery: 10 });               // 8th Avenue
  N.road(67, 80, 74, 82);                                                      // the avenue meets 42nd
  N.street(2, 30, 63, 41, 'x', { walk: 2, lampEvery: 11 });                    // W 44th St
  N.plaza(30, 42, 33, 79, 0, 'concretedark', 'brickdark');                     // the alley
  N.plaza(78, 30, 109, 51, 0, 'dirt', 'concrete');                             // construction lot
  K.ambient(X(40), 60, Z(86), 'wind', 2600, 0.6);
  N.streetSign(X(64) - 20, Z(80) + 20, 8, 'st_42st', 'st_8av'); N.streetSign(X(78) + 20, Z(80) + 20, 8, 'st_42st', 'st_8av');
  N.streetSign(X(64) - 20, Z(41) - 20, 8, 'st_w44st', 'st_8av');
  for (const [x, z, ry] of [[X(63) + 12, Z(80) - 6, Math.PI], [X(78) - 12, Z(94) + 6, 0]]) N.trafficLight(x, z, 8, ry, 'red');
  N.trafficLight(X(64) + 10, Z(77), 8, -Math.PI / 2, 'amber');

  // ======================= WEST 42nd STREET (start) =======================
  K.start(5, 86, -90);
  K.msg([X(2), 0, Z(83)], [X(9), 120, Z(91)], 'New York. The Qoqs followed you here... and they brought the storm.');
  N.car(X(13), Z(85), 0, 0.35, 'burnt', { fireSize: 38 }); N.car(X(24), Z(89) - 10, 0, Math.PI / 2 + 0.1, 'taxi'); N.car(X(40), Z(84), 0, -Math.PI / 2 - 0.2, 'taxi');
  N.car(X(52), Z(88), 0, Math.PI / 2 + 0.6, 'burnt', { fireSize: 30 }); N.car(X(90), Z(86), 0, 1.2, 'cop'); N.car(X(98), Z(88), 0, -0.4, 'cop'); N.car(X(104), Z(84), 0, 2.6, 'burnt');
  N.barrelFire(X(8), Z(81) + 16, 8); N.barrelFire(X(57), Z(92), 8); N.barrelFire(X(100), Z(81) + 16, 8);
  N.trash(X(20), Z(92) + 8, 8, 5); N.trash(X(35), Z(81) + 10, 8, 4); N.trash(X(86), Z(92) + 8, 8, 6); N.hydrant(X(31), Z(82) - 10, 8); N.hydrant(X(84), Z(91) + 10, 8);
  N.newsbox(X(16), Z(82) - 8, 8); N.mailbox(X(59), Z(82) - 8, 8); N.can(X(45), Z(91) + 12, 8); N.can(X(93), Z(82) - 12, 8);
  N.steam(X(28), Z(86), 0); N.steam(X(71), Z(87), 0); N.steam(X(95), Z(85), 0); N.manhole(X(46), Z(88), 0);
  N.barrier(X(108), Z(86), 0, 'z', 160); K.light(X(106), 60, Z(86), 260, [1, 0.25, 0.15], 3);
  // storefronts on the south side of 42nd
  const S1 = N.face(2, 94, 18, 106, 'n'), S2 = N.face(19, 94, 37, 106, 'n'), SD = N.face(38, 94, 60, 106, 'n'), S4 = N.face(61, 94, 79, 106, 'n'), S5 = N.face(80, 94, 96, 106, 'n'), S6 = N.face(97, 94, 109, 106, 'n');
  N.shop(S1, X(6), 'laundry', { awning: 'B' }); N.shop(S1, X(14), 'bodega', { awning: 'G', neon: true });
  N.shop(S2, X(23), 'liquor', { closed: true }); N.decalOn(S2, X(30), 120, 140, 34, 'shop_pawn', true); N.shop(S2, X(35), 'tattoo', { awning: 'B' });
  N.shop(SD, X(42) + 8, 'deli', { awning: 'R', w: 112 }); N.shop(SD, X(54), 'deli', { awning: 'R', w: 112, neon: true }); N.decalOn(SD, X(47), 128, 150, 36, 'shop_deli', true);
  N.shop(S4, X(65), 'pharmacy', { awning: 'G' }); N.shop(S4, X(75), 'diner', { closed: true });
  N.shop(S5, X(84), 'bar', { awning: 'B', neon: true }); N.shop(S5, X(92), 'hardware', { closed: true }); N.shop(S6, X(103), 'pizza', { awning: 'R' });
  N.billboard(S4, X(70) + 16, 210, 'bb_news', 256, 64, [1, 0.4, 0.3]);
  N.tag(S1, X(10), 40, 'tag_qoq'); N.tag(S6, X(99), 44, 'tag_nyc'); N.tag(S5, X(88), 46, 'tag_beans');
  // north side of 42nd
  const N7 = N.face(2, 42, 17, 79, 's'), N8 = N.face(18, 42, 29, 79, 's'), N9 = N.face(34, 42, 47, 79, 's'), N10 = N.face(48, 42, 63, 79, 's'), N11 = N.face(78, 52, 92, 79, 's'), N12 = N.face(93, 52, 109, 79, 's');
  N.shop(N7, X(6), 'chinese', { awning: 'R' }); N.shop(N7, X(13), 'hotel', { closed: true, awning: false }); N.shop(N8, X(23), 'cafe', { awning: 'G', neon: true });
  N.shop(N9, X(38), 'bank', { closed: true, awning: false }); N.shop(N9, X(44), 'pizza', { awning: 'R' }); N.shop(N10, X(52), 'theater', { awning: 'B' }); N.shop(N10, X(59), 'bodega', { awning: 'G' });
  N.shop(N11, X(83), 'pharmacy', { closed: true }); N.shop(N11, X(89), 'cafe', { awning: 'R', neon: true }); N.shop(N12, X(97), 'pawn', { closed: true }); N.shop(N12, X(105), 'liquor', { closed: true });
  N.billboard(N.face(48, 42, 63, 79, 'e'), Z(66), 230, 'bb_cola', 320, 160, [1, 0.4, 0.3]);
  N.tag(N9, X(41), 40, 'tag_pidser'); N.tag(N12, X(101), 40, 'tag_marv');
  N.scaffold(N11, X(79), X(92), { h: 120 });
  K.qoqC(18, 86, -90); K.qoqC(30, 88, -90); K.qoqC(44, 85, -90); K.qoq(X(40), Z(81), 180, { turret: true, y: 8 }); K.qoqC(56, 90, -90);
  K.qoqC(88, 84, 90); K.qoqC(96, 89, 90); K.qoqC(103, 86, 90); K.qoq(X(85), Z(81) + 10, 180, { turret: true, y: 128 }); K.marvC(92, 86, 90);
  K.juice(X(4), Z(92)); K.health(X(26), Z(81) + 12); K.juice(X(60), Z(81) + 12); K.health(X(106), Z(92)); K.juice(X(100), Z(92));
  K.slices([[X(12), Z(88)], [X(22), Z(84)], [X(36), Z(88)], [X(48), Z(85)], [X(84), Z(88)], [X(96), Z(84)], [X(107), Z(89)]]);

  // ======================= THE DELI (red key in the basement freezer) =======================
  K.paint(40, 95, 54, 99, T(DELI));
  K.door(45, 94, 48, 94, DELI, { top: 104 });
  K.wall(40, 100, 45, 100, 'shopwall'); K.wall(49, 100, 54, 100, 'shopwall');
  K.door(46, 100, 48, 100, BACK, { top: 96 });
  K.paint(40, 101, 54, 102, T(BACK));
  K.stairs(55, 101, 65, 102, 'E', 8, -152, { floor: 'stepside', ceil: 'ceil', side: 'stepside', upper: 'brickdark', c: -9999, head: 128, roof: 288, roofSky: 1600 });
  K.paint(66, 98, 76, 106, T(BASE));
  K.wall(70, 97, 71, 97, 'chrome'); K.wall(75, 97, 76, 97, 'chrome');
  K.door(72, 97, 74, 97, FREEZE, { top: 96, name: 'freezer' });
  K.paint(70, 95, 76, 96, T(FREEZE));
  // shop dressing: counter, shelves of goods, the glowing drinks fridge, lights
  K.counter(X(41), Z(97), X(44), Z(99) + 20, 42, 'drawer', 'px', 'wood');
  for (const r of [96, 98]) K.brush([X(47), 8, Z(r) + 6], [X(53), 70, Z(r) + 20], { tex: 'wood', pz: 'books', nz: 'books', top: 'wood' });
  K.decal({ at: [X(54) + 32, 56, Z(97)], n: 'nx', w: 120, h: 90, tex: 'shopwin', fullbright: true }); K.light(X(53), 60, Z(97), 220, [0.6, 0.85, 1]);
  K.fixture(X(47), Z(96), 136, 120, 'x', 'light', 300); K.fixture(X(47), Z(98) + 16, 136, 120, 'x', 'light', 260);
  K.props(pr => { pr.stool(X(42), Z(95) + 20, 8); pr.pizza(X(43), 50, Z(98), 14); });
  K.crates(X(41), Z(101) + 16, 8, 2, 34); K.crates(X(43) + 8, Z(102) + 8, 8, 1, 30); K.lamp(X(47), 90, Z(101) + 16, 170);
  K.qoqC(44, 97, 0); K.qoqC(51, 99, 0); K.marvC(52, 101, -90);
  K.juice(X(50), Z(95) + 16); K.slices([[X(41), Z(96)], [X(53), Z(99)]]);
  K.lamp(X(60), 0, Z(101) + 16, 180); K.lamp(X(65), -100, Z(101) + 16, 180);
  // basement stock room + ambush, freezer, secret behind the boards
  for (const [c, r, n] of [[68, 100, 2], [72, 103, 1], [75, 99, 3], [68, 105, 1], [74, 106, 2]]) K.crates(C(c), C(r), -152, n, 40);
  K.pizzaBoxes(C(70), C(101), -152, 4);
  K.fixture(X(71), Z(102), -24, 120, 'x', 'light', 300, [1, 0.95, 0.8]); K.light(X(68), -90, Z(105), 200, [1, 0.7, 0.4]);
  K.msg([X(66), -152, Z(98)], [X(70), -60, Z(103)], 'Smells like old cold cuts... and Qoqs.');
  K.wave('stock', { min: [X(67), -152, Z(99)], max: [X(75), -60, Z(105)], msg: 'Ambush in the stock room!' });
  for (const [c, r] of [[67, 104], [75, 104], [71, 99], [69, 106]]) K.qoqC(c, r, 0, { wave: 'stock' });
  K.qoqC(73, 101, 0); K.juice(X(67), Z(99)); K.health(X(76), Z(105));
  K.key('red', X(73) + 16, Z(95) + 16, -152); K.light(X(73), -80, Z(96), 240, [0.55, 0.8, 1]); K.emitter([X(70), -150, Z(95)], [X(76), -60, Z(96)], 'steam', 3);
  K.brush([X(70), -152, Z(95)], [X(71), -40, Z(97)], { tex: 'chrome', top: 'metal' }); K.brush([X(75), -152, Z(95)], [X(76), -40, Z(97)], { tex: 'chrome', top: 'metal' });
  K.wave('redkey', { onKey: 'red', msg: 'The deli door slams... Qoqs are pouring into the shop!' });
  for (const [c, r] of [[42, 96], [53, 96], [47, 99], [50, 102], [43, 101]]) K.qoqC(c, r, 180, { wave: 'redkey' });
  K.paint(77, 102, 79, 105, T(BASE)); K.breakable([X(77), -152, Z(102)], [X(77) + 10, -24, Z(106)], { tex: 'boards', health: 24, secret: true });
  K.item('sausages', X(78), Z(103), { amount: 12 }); K.health(X(78) + 16, Z(105)); K.slice(X(79), Z(102) + 16); K.light(X(78), -100, Z(104), 170, [1, 0.6, 0.3], 1);
  K.msg([X(74), -152, Z(102)], [X(77), -60, Z(106)], 'These boards are rotten through...');

  // ======================= PAWN SHOP SECRET (shoot the sign) =======================
  K.paint(28, 95, 31, 97, T(STASH));
  K.door(28, 94, 31, 94, STASH, { tex: 'rustpanel', targeted: true, name: 'pawn', wait: -1, top: 104 });
  K.button({ min: [X(28) + 12, 110, Z(94) - 6], max: [X(32) - 12, 136, Z(94)], shoot: true, target: 'pawn', msg: 'The pawn shop shutter rattles up...' });
  K.secret([X(28), 8, Z(95)], [X(32), 100, Z(98)]); K.item('candybag', X(29), Z(96), { amount: 50 }); K.health(X(31), Z(96)); K.slice(X(30), Z(97)); K.light(X(30), 80, Z(96), 160, [1, 0.8, 0.5]);

  // ======================= 8th AVENUE & THE CHECKPOINT (red key) =======================
  K.post(ctx => {
    for (const [a, b] of [[X(64), X(69)], [X(73), X(78)]]) { ctx.brush([a, 0, Z(56) + 4], [b, 52, Z(56) + 28], { tex: 'concrete', top: 'concrete' }); ctx.brush([a, 52, Z(56) + 12], [b, 132, Z(56) + 18], { tex: 'bars', fit: false, noshadow: true }); }
    ctx.mover({ type: 'door', min: [X(69), 0, Z(56) + 10], max: [X(73), 132, Z(56) + 20], key: 'red', tex: 'door_red', name: 'checkpoint', wait: -1, lip: 8, speed: 110 });
    ctx.decal({ at: [X(66) + 16, 34, Z(56) + 28], n: 'pz', w: 140, h: 16, tex: 'sign_police', off: 0.8 }); ctx.decal({ at: [X(75) + 16, 34, Z(56) + 28], n: 'pz', w: 140, h: 16, tex: 'sign_police', off: 0.8 });
  });
  K.msg([X(64), 0, Z(58)], [X(78), 120, Z(64)], 'NYPD CHECKPOINT. The gate needs a RED keycard.');
  N.car(X(70) + 16, Z(60), 0, Math.PI / 2, 'cop'); N.car(X(66), Z(62), 8, 0.1, 'burnt', { fire: false }); N.car(X(76), Z(53), 8, Math.PI - 0.3, 'cop');
  K.light(X(70), 120, Z(58), 320, [1, 0.15, 0.1], 3); K.light(X(72), 120, Z(58), 320, [0.2, 0.3, 1], 4);
  N.trash(X(65), Z(70), 8, 5); N.hydrant(X(77), Z(68), 8); N.steam(X(70), Z(68), 0);
  K.qoqC(70, 70, 0); K.qoqC(73, 66, 0); K.qoq(X(66), Z(64), 180, { turret: true, y: 8 });
  K.juice(X(76), Z(74)); K.slices([[X(68), Z(72)], [X(75), Z(64)]]);
  // north of the checkpoint
  N.car(X(68), Z(44), 0, 0.15, 'taxi'); N.car(X(73), Z(38), 0, Math.PI + 0.25, 'sedan'); N.car(X(70), Z(24), 0, 0.9, 'burnt', { fireSize: 44 }); N.car(X(72), Z(12), 0, Math.PI / 2 + 0.2, 'taxi');
  N.barrelFire(X(65), Z(46), 8); N.trash(X(76), Z(42), 8, 6); N.hydrant(X(65), Z(30) - 10, 8); N.steam(X(71), Z(32), 0); N.steam(X(69), Z(18), 0);
  K.brush([X(64), 0, Z(6)], [X(78), 64, Z(6) + 30], { tex: 'concrete', top: 'concrete' }); N.car(X(68), Z(8), 0, 1.4, 'burnt', { fireSize: 40 }); // the avenue's blocked north end
  K.qoqC(69, 48, 180); K.qoqC(74, 44, 180); K.marvC(70, 34, 180); K.qoqC(66, 26, 180); K.qoqC(73, 20, 180); K.qoq(X(76), Z(30) - 12, 180, { turret: true, y: 8 });
  K.juice(X(66), Z(50)); K.health(X(76), Z(36)); K.slices([[X(70), Z(50)], [X(72), Z(28)], [X(66), Z(16)]]);
  N.billboard(N.face(78, 4, 109, 29, 'w'), Z(18), 300, 'bb_pizza', 320, 160, [1, 0.55, 0.25]);

  // ======================= HOTEL (blue key on the mezzanine) =======================
  K.paint(52, 12, 62, 24, T(LOBBY));
  K.door(63, 16, 63, 19, LOBBY, { top: 112 });
  const HF = N.face(48, 6, 63, 29, 'e');
  N.decalOn(HF, Z(18), 150, 170, 44, 'shop_hotel', true); K.brush([X(64), 128, Z(15)], [X(64) + 36, 134, Z(21)], { tex: 'awningR', noshadow: false }); K.light(X(65), 100, Z(18), 260, [1, 0.3, 0.25]);
  for (const r of [14, 22]) K.column(X(57), Z(r), 24, 8, 232, 'limestone', 'trim');
  K.catwalk(X(52), Z(12), X(56), Z(25), 128, { rails: 'e', gaps: [['e', Z(21), Z(25)]], tex: 'wood', top: 'carpet' });
  K.stairBrush(X(56), Z(21), X(60), Z(25), 8, 128, 'W', 'stepside', 'carpet');
  K.counter(X(58), Z(12) + 8, X(62), Z(14), 44, 'drawer', 'pz', 'wood');
  K.couch(X(58), Z(19), X(62) - 8, Z(20) + 10, 'e'); K.props(pr => { pr.roundTable(X(59) + 16, Z(17), 8, 18, 30, 'wood'); });
  K.decal({ at: [X(52), 80, Z(18)], n: 'px', w: 90, h: 120, tex: 'poster' }); K.decal({ at: [X(62) + 31, 64, Z(23)], n: 'nx', w: 64, h: 90, tex: 'vaultdoor' });
  for (const [x, z] of [[X(57), Z(16)], [X(57), Z(21)]]) K.fixture(x, z, 232, 100, 'z', 'lightamber', 300, [1, 0.8, 0.55]);
  K.lamp(X(54), 200, Z(18), 220); K.light(X(54), 170, Z(14), 200, [1, 0.75, 0.5]);
  K.key('blue', X(53) + 16, Z(13) + 16, 128);
  K.qoqC(59, 15, 90); K.qoqC(60, 22, 90); K.qoq(X(54), Z(20), 90, { turret: true, y: 128 }); K.marvC(58, 23, 90);
  K.juice(X(61), Z(23)); K.health(X(53), Z(23), 128); K.slices([[X(55), Z(16), 128], [X(60), Z(13)]]);
  K.wave('bluekey', { onKey: 'blue', msg: 'Something is clawing up the avenue...' });
  for (const [c, r] of [[66, 14], [74, 22], [67, 30], [75, 10], [70, 40], [60, 18]]) K.qoqC(c, r, 90, { wave: 'bluekey' });

  // ======================= W 44th STREET, fire escape and the alley gate =======================
  const W15b = N.face(25, 6, 47, 29, 's');
  N.fireEscape(W15b, X(27), 3, { dir: 1 }); N.shop(N.face(2, 6, 24, 29, 's'), X(8), 'noodle', { awning: 'R' }); N.shop(N.face(2, 6, 24, 29, 's'), X(18), 'laundry', { closed: true });
  N.shop(W15b, X(32), 'bar', { closed: true, awning: false }); N.tag(W15b, X(45), 40, 'tag_cornpop'); N.tag(N.face(2, 42, 17, 79, 'n'), X(10), 44, 'tag_beans');
  N.car(X(10), Z(36), 0, Math.PI / 2 + 0.15, 'sedan', { paint: 'carblack' }); N.car(X(40), Z(34), 0, -Math.PI / 2, 'taxi'); N.car(X(54), Z(37), 0, Math.PI / 2 - 0.3, 'burnt');
  N.barrelFire(X(22), Z(40), 8); N.barrelFire(X(26), Z(31), 8); N.trash(X(14), Z(31), 8, 5); N.trash(X(46), Z(40), 8, 4); N.steam(X(30), Z(36), 0);
  K.qoqC(12, 35, -90); K.qoqC(24, 37, -90); K.qoqC(36, 33, -90); K.qoqC(50, 35, -90); K.qoq(X(31), Z(30) + 20, 180, { turret: true, y: 200 });
  K.juice(X(4), Z(40)); K.health(X(58), Z(31)); K.slices([[X(8), Z(36)], [X(20), Z(34)], [X(44), Z(36)]]);
  // rooftop stash at the top of the fire escape
  K.secret([X(38), 288, Z(8)], [X(47), 400, Z(29)]); K.item('sausages', X(44), Z(26), { amount: 12, y: 288 }); K.health(X(42), Z(22), 288); K.item('candybag', X(45), Z(20), { amount: 50, y: 288 }); K.slices([[X(40), Z(26)], [X(43), Z(18)]], 288);
  K.qoq(X(35), Z(20), 180, { turret: true, y: 288 });
  // alley: the gate at the W 44th end only opens from that side
  K.mover({ type: 'door', min: [X(30), 0, Z(42) + 6], max: [X(34), 128, Z(42) + 16], tex: 'bars', name: 'alleygate', targeted: true, wait: -1, lip: 8, speed: 140, message: 'This gate is opened from the other side.' });
  K.button({ min: [X(34), 52, Z(41) + 26], max: [X(34) + 8, 72, Z(41) + 32], target: 'alleygate', msg: 'The alley gate swings open. A shortcut back to 42nd St.' });
  K.decal({ at: [X(34) + 8, 62, Z(41) + 29], n: 'px', w: 10, h: 10, tex: 'button', fullbright: true });
  K.brush([X(30), 0, Z(60)], [X(31) + 20, 60, Z(63)], { tex: 'steeldark', top: 'metal' }); K.brush([X(32), 0, Z(70)], [X(34), 56, Z(73)], { tex: 'steeldark', top: 'metal' }); // dumpsters
  N.trash(X(32), Z(52), 0, 6); N.trash(X(31), Z(77), 0, 4); K.lamp(X(30) + 8, 120, Z(56), 190); K.lamp(X(33) + 24, 110, Z(68), 190);
  N.fireEscape(N.face(18, 42, 29, 79, 'e'), Z(78), 2, { dir: -1 }); // two flights up to a balcony stash
  K.qoqC(31, 66, 180); K.qoqC(32, 48, 180); K.juice(X(33), Z(58)); K.slices([[X(31), Z(74)], [X(32), Z(45)]]);
  K.secret([X(30), 180, Z(67)], [X(30) + 44, 280, Z(70)]); K.health(X(30) + 22, Z(68) + 4, 192); K.item('sausages', X(30) + 22, Z(69) + 8, { amount: 12, y: 192 });

  // ======================= CONSTRUCTION LOT =======================
  N.scaffold(N.face(78, 52, 92, 79, 'n'), X(79), X(92), { h: 128, dep: 80 });
  K.stairBrush(X(92), Z(50), X(100), Z(52), 0, 128, 'W', 'scaffold', 'boards');
  for (const [x, z, n] of [[X(84), Z(36), 2], [X(98), Z(34), 3], [X(104), Z(44), 1], [X(90), Z(42), 1], [X(101), Z(40), 2]]) K.crates(x, z, 0, n, 40);
  K.brush([X(100), 0, Z(31)], [X(108), 72, Z(36)], { tex: 'steeldark', top: 'metal', nz: 'hazard' }); // site office
  K.props(pr => { for (const [x, z] of [[X(86), Z(33)], [X(86), Z(33) + 56]]) pr.cylinder(x, 0, z, 6, 420, 'steelbeam', { segs: 6 }); pr.pipe(X(86), 420, Z(33), X(102), 420, Z(42), 4, 'steelbeam'); });
  N.barrelFire(X(95), Z(38), 0); K.lamp(X(88), 120, Z(48), 220); K.lamp(X(104), 110, Z(37), 220); K.emitter([X(91), 0, Z(44)], [X(92), 20, Z(45)], 'sparks', 2);
  K.qoqC(88, 40, -90); K.qoqC(100, 46, -90); K.qoq(X(84), Z(50), 0, { turret: true, y: 128 }); K.qoq(X(90), Z(50), 0, { turret: true, y: 128 }); K.marvC(104, 38, -90);
  K.juice(X(106), Z(48)); K.health(X(80), Z(32)); K.item('sausages', X(98), Z(37), { amount: 12 }); K.slices([[X(82), Z(46)], [X(96), Z(32)], [X(106), Z(42)]]);
  // ruin behind boards in the burnt-out tenement
  K.paint(98, 52, 103, 56, T({ f: 0, c: 200, floor: 'rubble', ceil: 'burnt', side: 'burnt', upper: 'tenementdark', roof: 256, roofSky: 1600 }));
  K.breakable([X(98), 0, Z(52) - 2], [X(104), 120, Z(52) + 8], { tex: 'boards', health: 24, secret: true });
  K.health(X(99), Z(55)); K.juice(X(102), Z(55)); K.slice(X(100), Z(54)); N.fire(X(102), Z(53), 0, 20);

  // ======================= SUBWAY (blue gate) & EXIT =======================
  K.stairs(75, 9, 77, 19, 'S', -152, 8, { floor: 'concrete', ceil: 'sky', side: 'stepside', upper: 'brownstone', sky: true, c: 1600 });
  K.paint(75, 6, 77, 8, T({ f: -152, c: 1600, floor: 'tile', ceil: 'sky', side: 'subwaytile', upper: 'brownstone', sky: true }));
  K.post(ctx => {
    ctx.brush([X(75) - 3, 8, Z(6)], [X(75), 52, Z(20)], { tex: 'railing', fit: true, noshadow: true }); ctx.brush([X(75) - 3, 0, Z(6)], [X(75), 160, Z(20)], { invisible: true, noshadow: true });
    ctx.mover({ type: 'door', min: [X(75), 8, Z(19) + 18], max: [X(78), 128, Z(19) + 28], key: 'blue', tex: 'door_blue', name: 'subwaygate', wait: -1, lip: 8, speed: 110 });
    for (const pz of [Z(20) + 4]) for (const px of [X(75) - 6, X(78) - 4]) { ctx.props.cylinder(px, 8, pz, 2.4, 70, 'metalgreen', { segs: 8 }); ctx.props.sphere(px, 84, pz, 7, 'greenlight', { fullbright: true, segs: 10, rings: 7 }); ctx.light(px, 84, pz + 10, 200, [0.3, 1, 0.45]); }
    ctx.decal({ at: [X(76) + 16, 150, Z(20) + 2], n: 'pz', w: 96, h: 24, tex: 'sign_subway', fullbright: true });
  });
  K.brush([X(75), 132, Z(19) + 14], [X(78), 168, Z(19) + 32], { tex: 'metalgreen', noshadow: true });
  K.msg([X(74), 0, Z(20)], [X(78), 120, Z(24)], 'The subway gate wants a BLUE keycard.');
  K.paint(79, 5, 96, 12, T(STA)); K.paint(78, 6, 78, 8, T(STA)); K.wall(78, 9, 78, 22, 'brownstone');
  K.paint(79, 13, 108, 17, T(PLAT)); K.paint(79, 18, 108, 22, T(PIT));
  for (const r of [5, 7, 9, 11]) K.brush([X(86), -152, Z(r)], [X(86) + 12, -116, Z(r) + 24], { tex: 'chrome', top: 'metal' }); // turnstiles
  K.brush([X(80), -152, Z(9)], [X(83), -96, Z(12)], { tex: 'glasstower', top: 'metal' }); K.light(X(81), -110, Z(10), 160, [1, 0.85, 0.5]); // token booth
  for (const [c, r] of [[82, 7], [91, 8], [94, 15], [102, 15], [86, 15]]) K.fixture(X(c), Z(r), r < 13 ? -24 : 8, 120, 'x', 'light', 300, [0.95, 1, 0.9]);
  K.decal({ at: [X(90), -100, Z(5)], n: 'pz', w: 200, h: 36, tex: 'sign_station', fullbright: true }); K.decal({ at: [X(96), -110, Z(13)], n: 'pz', w: 220, h: 40, tex: 'sign_station', fullbright: true });
  K.decal({ at: [X(100), -100, Z(23)], n: 'nz', w: 260, h: 48, tex: 'sign_station', fullbright: true });
  K.props(pr => { for (const z of [Z(19) + 16, Z(21) + 8]) pr.pipe(X(78), -212, z, X(109), -212, z, 2.5, 'chrome'); for (const x of [X(84), X(94), X(104)]) for (const z of [Z(13) + 6]) pr.cylinder(x, -152, z, 9, 160, 'subwaytile', { segs: 10 }); });
  K.emitter([X(78), -216, Z(18)], [X(108), -200, Z(22)], 'drip', 3);
  K.qoqC(90, 9, -90); K.qoqC(94, 6, -90); K.marvC(98, 15, -90); K.qoqC(106, 16, -90);
  K.wave('platform', { min: [X(96), -152, Z(13)], max: [X(108), -60, Z(17)], msg: 'Something is coming down the tunnel!' });
  for (const [c, r] of [[100, 20], [104, 21], [107, 19], [96, 20]]) K.qoqC(c, r, -90, { wave: 'platform' });
  K.juice(X(80), Z(6)); K.health(X(93), Z(11)); K.health(X(106), Z(14)); K.slices([[X(88), Z(11)], [X(100), Z(14)], [X(82), Z(15)]]);
  K.exit(X(109), -152, Z(15), 'nx');

  // bot route: red key (deli freezer), through the checkpoint, blue key (hotel mezzanine), subway
  K.goal(X(47), Z(97)); K.goal(X(60), Z(101) + 16); K.goal(X(73) + 16, Z(95) + 16, -152); K.goal(X(70), Z(64)); K.goal(X(70), Z(40));
  K.goal(X(60), Z(18)); K.goal(X(53) + 16, Z(13) + 16, 128); K.goal(X(70), Z(22)); K.goal(X(76) + 16, Z(14)); K.goal(X(90), Z(9), -152);
});
