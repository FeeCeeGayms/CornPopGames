// E2M5 — CENTRAL PARK. A storm over the park: in from 59th Street past the pond and the stone bridge, up the Mall's
// lamp-lit avenue of trees to Bethesda Terrace and the fountain. The lake is deep and freezing; the red key in the
// boathouse opens the gate on Bow Bridge to the Ramble, where Belvedere Castle holds the blue key on its roof.
// The blue key opens the park gate onto 5th Avenue; the museum's doors are the way out.
import { makeLevel } from '../kit.js';
import { nyc, NYC_STYLES } from '../nyc.js';

export default makeLevel({
  name: 'E2M5', title: 'E2M5: CENTRAL PARK', ambience: 'street', ambient: 20, ambientColor: [0.55, 0.65, 1.0], music: 'assets/music/e1m5.mp3', city: true,
  fog: { color: [0.04, 0.045, 0.05], density: 0.00095 }, skyTint: [0.32, 0.34, 0.45],
  rain: { density: 1400, wind: [-30, 60] }, storm: { every: [4, 10], power: 1.15 }, styles: NYC_STYLES,
}, 116, 116, 'office', K => {
  const { X, Z, C } = K; const T = s => K.type(s); const N = nyc(K, { sky: 1600 });
  const GRASS = N.sky(8, 'grass', 'granite'), PATH = N.sky(8, 'dirt', 'granite'), PAVE = N.sky(8, 'sidewalk', 'granite');
  const TERR = N.sky(72, 'granite', 'granite'), ROCK = h => N.sky(h, 'granite', 'granite');
  const BOAT = { f: 8, c: 140, floor: 'boards', ceil: 'wood', side: 'wood', upper: 'brickdark', roof: 170, roofSky: 1600 };

  // ======================= THE CITY AROUND THE PARK =======================
  N.building(2, 112, 40, 115, 560, 'limestone', { parapet: false, tower: false, bulk: false, ac: 0 }); N.building(41, 112, 80, 115, 720, 'office', { parapet: false, tower: false, bulk: false, ac: 0 }); N.building(81, 112, 113, 115, 500, 'brownstone', { parapet: false, tower: false, bulk: false, ac: 0 });
  N.building(110, 2, 115, 19, 520, 'brownstone', { tower: false }); N.building(110, 20, 115, 50, 220, 'limestone', { tower: false, bulk: false, ac: 0 }); N.building(110, 51, 115, 99, 480, 'office', { tower: false });
  N.street(2, 100, 113, 111, 'x', { cross: [46, 97], lampEvery: 11 });          // Central Park South (59th St)
  N.street(98, 2, 109, 99, 'z', { cross: [97], lampEvery: 11 });                // 5th Avenue
  N.road(101, 100, 106, 102);
  N.streetSign(X(98) - 14, Z(100) - 14, 8, 'st_59st', 'st_5av'); N.streetSign(X(98) - 14, Z(29), 8, 'st_5av', 'st_centralparkw');

  // ======================= THE PARK =======================
  K.paint(2, 2, 97, 99, T(GRASS));
  K.paint(40, 42, 46, 99, T(PATH));                     // the Mall
  K.paint(2, 70, 39, 74, T(PATH)); K.paint(47, 60, 97, 63, T(PATH)); K.paint(60, 27, 64, 59, T(PATH)); K.paint(26, 27, 58, 31, T(PAVE));
  K.paint(71, 2, 95, 13, T(ROCK(200)));                 // cliffs north of the boathouse (the Ramble is only reached by the bridge)
  K.pool(2, 14, 70, 26, GRASS, 'water', 120, 30);        // the lake: deep and freezing
  K.pool(54, 72, 92, 90, GRASS, 'water', 32, 0);         // the pond (shallow)
  for (const [c0, r0, c1, r1, h] of [[6, 30, 10, 35, 40], [14, 44, 19, 49, 56], [28, 84, 33, 89, 48], [86, 40, 92, 46, 64], [20, 56, 24, 60, 32], [70, 92, 76, 96, 40]]) K.paint(c0, r0, c1, r1, T(ROCK(h)));
  K.ambient(X(40), 60, Z(60), 'wind', 3200, 0.8);
  // the stone park wall along 59th St (gap at the Mall) and along 5th Ave (the blue gate)
  K.post(ctx => {
    ctx.brush([X(2), 8, Z(99) + 8], [X(40), 90, Z(100)], { tex: 'granite', top: 'parapet' }); ctx.brush([X(47), 8, Z(99) + 8], [X(98), 90, Z(100)], { tex: 'granite', top: 'parapet' });
    ctx.brush([X(97) + 8, 8, Z(2)], [X(98), 90, Z(30)], { tex: 'granite', top: 'parapet' }); ctx.brush([X(97) + 8, 8, Z(35)], [X(98), 90, Z(100)], { tex: 'granite', top: 'parapet' });
    ctx.mover({ type: 'door', min: [X(97) + 8, 8, Z(30)], max: [X(98), 140, Z(35)], key: 'blue', tex: 'door_blue', name: 'parkgate', wait: -1, lip: 8, speed: 110 });
    for (const z of [Z(30) - 6, Z(35) + 6]) { ctx.props.cylinder(X(97) + 16, 8, z, 10, 120, 'granite', { segs: 8 }); ctx.props.sphere(X(97) + 16, 136, z, 8, 'glow', { fullbright: true, segs: 8, rings: 6 }); ctx.light(X(97), 130, z, 200, [1, 0.75, 0.45]); }
  });
  N.decalOn(N.face(2, 112, 40, 115, 'n'), X(43), 160, 200, 50, 'sign_park', true);
  K.msg([X(97) - 60, 8, Z(30)], [X(97), 120, Z(35)], 'The gate onto 5th Avenue needs the BLUE keycard.');
  // trees, lamps, benches
  const trees = [[6, 40], [10, 52], [4, 62], [12, 66], [22, 40], [30, 48], [34, 58], [28, 64], [8, 80], [18, 78], [24, 92], [12, 94], [36, 78], [50, 48], [54, 56], [66, 50], [72, 44], [78, 56], [84, 52], [90, 58], [52, 66], [68, 66], [80, 68], [94, 66], [50, 94], [60, 96], [84, 94], [92, 88], [94, 76], [36, 92],
    [6, 4], [12, 11], [30, 4], [36, 10], [44, 6], [52, 11], [58, 4], [64, 9], [68, 3], [28, 11]];
  for (const [c, r] of trees) N.tree(C(c), C(r), undefined, 1 + ((c * 7 + r) % 5) * 0.12);
  for (let r = 48; r <= 96; r += 6) { N.lamp(X(40) - 6, C(r), 8, 'px', [1, 0.72, 0.45], 300); N.lamp(X(47) + 6, C(r + 3), 8, 'nx', [1, 0.72, 0.45], 300); }
  for (let r = 50; r <= 94; r += 8) { N.bench(X(39) - 12, C(r), 8, 'z'); N.bench(X(47) + 12, C(r + 4), 8, 'z'); }
  for (const [x, z] of [[X(20), Z(72)], [X(30), Z(72)], [X(70), Z(61)], [X(85), Z(61)], [X(62), Z(36)], [X(62), Z(50)]]) N.lamp(x, z, 8, 'pz', [1, 0.72, 0.45], 280);

  // ======================= 59th STREET (start) & THE POND =======================
  K.start(20, 106, -90);
  K.msg([X(14), 0, Z(102)], [X(26), 120, Z(110)], 'Central Park. In this storm, under the trees...\nanything could be out there.');
  const S59 = N.face(2, 112, 113, 115, 'n');
  for (const [a, n, o] of [[X(8), 'hotel', { awning: 'R' }], [X(20), 'cafe', { awning: 'G', neon: true }], [X(56), 'hotel', { awning: 'B' }], [X(70), 'bar', { closed: true }], [X(90), 'diner', { awning: 'R' }], [X(104), 'pharmacy', {}]]) N.shop(S59, a, n, o);
  N.car(X(12), Z(105), 0, Math.PI / 2, 'taxi'); N.car(X(30), Z(107), 0, -Math.PI / 2 + 0.3, 'burnt'); N.car(X(64), Z(104), 0, 1.4, 'cop'); N.car(X(84), Z(106), 0, -1.9, 'burnt', { fireSize: 40 });
  K.props(pr => { for (const [x, z] of [[X(56), Z(104)], [X(60), Z(106)]]) { pr.box(x, 30, z, 30, 40, 70, 'carblack'); pr.cylinder(x, 0, z + 30, 18, 6, 'tire', { rz: Math.PI / 2, segs: 10 }); pr.cylinder(x, 0, z - 30, 18, 6, 'tire', { rz: Math.PI / 2, segs: 10 }); } }); // abandoned horse carriages
  K.brush([X(98), 0, Z(88)], [X(110), 170, Z(90)], { tex: 'rubble', top: 'rubble' }); N.car(X(104), Z(92), 0, 0.4, 'burnt', { fireSize: 44 }); // 5th Ave is blocked north of 59th
  N.barrelFire(X(36), Z(101), 8); N.trash(X(50), Z(110), 8, 5); N.steam(X(40), Z(106), 0); N.steam(X(76), Z(105), 0);
  K.qoqC(32, 105, -90); K.qoqC(52, 107, -90); K.qoqC(70, 104, -90); K.qoqC(90, 108, -90); K.marvC(100, 104, 0); K.qoqC(104, 96, 0);
  K.juice(X(4), Z(110)); K.health(X(60), Z(110)); K.juice(X(108), Z(96)); K.slices([[X(16), Z(104)], [X(38), Z(108)], [X(76), Z(108)], [X(96), Z(104)]]);
  // Gapstow bridge over the pond
  K.post(ctx => { ctx.brush([X(70), 32, Z(72)], [X(74), 40, Z(91)], { tex: 'granite', top: 'sidewalk' }); for (const z of [Z(80)]) ctx.props.ring(X(72), 8, z, 70, 86, 128, 'x', 0, Math.PI, 'granite', 18);
    ctx.brush([X(70), 40, Z(72)], [X(70) + 6, 74, Z(91)], { tex: 'granite', top: 'parapet' }); ctx.brush([X(74) - 6, 40, Z(72)], [X(74), 74, Z(91)], { tex: 'granite', top: 'parapet' }); });
  K.stairBrush(X(70), Z(91), X(74), Z(94), 8, 40, 'N', 'granite', 'sidewalk'); K.stairBrush(X(70), Z(69), X(74), Z(72), 8, 40, 'S', 'granite', 'sidewalk');
  K.secret([X(70), -40, Z(78)], [X(74), 30, Z(83)]); K.item('sausages', X(72), Z(80), { amount: 12, y: -24 }); K.health(X(72), Z(82), -24); // under the bridge arch
  K.qoqC(60, 80, 0); K.qoqC(84, 76, 0); K.qoq(X(72), Z(76), 180, { turret: true, y: 40 }); K.qoqC(64, 92, 0); K.qoqC(88, 86, -90);
  K.juice(X(94), Z(92)); K.health(X(52), Z(86)); K.slices([[X(58), Z(76)], [X(80), Z(82)], [X(90), Z(74)], [X(72), Z(86), 40]]);

  // ======================= THE MALL & BETHESDA TERRACE =======================
  K.qoqC(43, 90, 180); K.qoqC(42, 78, 180); K.qoqC(45, 66, 180); K.qoqC(43, 54, 180); K.marvC(41, 60, 180); K.qoqC(30, 72, 90); K.qoqC(12, 72, 90); K.qoqC(80, 62, -90);
  K.juice(X(38), Z(84)); K.health(X(48), Z(72)); K.juice(X(6), Z(72)); K.slices([[X(43), Z(94)], [X(43), Z(84)], [X(43), Z(74)], [X(43), Z(64)], [X(43), Z(50)], [X(24), Z(72)], [X(92), Z(62)]]);
  K.paint(26, 32, 58, 41, T(TERR));
  K.stairs(34, 32, 46, 35, 'S', 24, 72, { floor: 'granite', ceil: 'sky', side: 'granite', upper: 'granite', sky: true, c: 1600 });
  K.stairs(38, 42, 46, 45, 'N', 24, 72, { floor: 'granite', ceil: 'sky', side: 'granite', upper: 'granite', sky: true, c: 1600 });
  K.post(ctx => { // balustrades and lamps on the terrace
    for (const [a, b] of [[X(26), X(34)], [X(47), X(59)]]) ctx.brush([a, 72, Z(32)], [b, 100, Z(32) + 6], { tex: 'parapet', top: 'parapet' });
    for (const [a, b] of [[Z(32), Z(42)]]) { ctx.brush([X(26), 72, a], [X(26) + 6, 100, b], { tex: 'parapet', top: 'parapet' }); ctx.brush([X(59) - 6, 72, a], [X(59), 100, b], { tex: 'parapet', top: 'parapet' }); }
    for (const [a, b] of [[X(26), X(38)], [X(47), X(59)]]) ctx.brush([a, 72, Z(42) - 6], [b, 100, Z(42)], { tex: 'parapet', top: 'parapet' });
    for (const x of [X(30), X(54)]) { ctx.props.cylinder(x, 72, Z(37), 3, 110, 'metalgreen', { segs: 8 }); ctx.props.sphere(x, 188, Z(37), 9, 'glow', { fullbright: true, segs: 10, rings: 7 }); ctx.light(x, 176, Z(37), 320, [1, 0.75, 0.5]); }
    // the fountain: basin, pedestal and the angel
    const fx = X(42), fz = Z(29); ctx.props.cylinder(fx, 8, fz, 56, 20, 'granite', { segs: 24 }); ctx.brush([fx - 48, 8, fz - 48], [fx + 48, 28, fz + 48], { invisible: true, noshadow: true });
    ctx.W.addLiquid(fx - 48, fz - 48, fx + 48, fz + 48, 24, 'water'); ctx.props.cylinder(fx, 8, fz, 14, 70, 'granite', { segs: 12 }); ctx.props.cylinder(fx, 78, fz, 28, 6, 'granite', { segs: 16 });
    ctx.props.cylinder(fx, 84, fz, 8, 40, 'gold', { segs: 10 }); ctx.props.sphere(fx, 132, fz, 8, 'gold', { segs: 10, rings: 7 }); ctx.props.box(fx, 110, fz, 70, 6, 10, 'gold', { ry: 0.3 });
    ctx.emitter({ min: [fx - 20, 84, fz - 20], max: [fx + 20, 90, fz + 20], type: 'drip', rate: 10 }); ctx.light(fx, 60, fz, 280, [0.6, 0.75, 1]);
  });
  K.qoqC(32, 29, 0); K.qoqC(52, 28, 0); K.qoqC(36, 38, 0); K.qoqC(50, 38, 0); K.qoq(X(28), Z(40), 0, { turret: true, y: 72 }); K.qoq(X(56), Z(40), 0, { turret: true, y: 72 }); K.marvC(44, 27, 0);
  K.juice(X(28), Z(28)); K.health(X(56), Z(28)); K.slices([[X(36), Z(28)], [X(48), Z(28)], [X(30), Z(36)], [X(54), Z(36)]]);

  // ======================= THE BOATHOUSE (red key) =======================
  N.building(74, 15, 88, 25, 170, 'brickdark', { inner: 'wood', tower: false, bulk: false, parapet: 'ns' });
  K.paint(75, 16, 87, 24, T(BOAT)); K.door(79, 25, 82, 25, BOAT, { top: 104, tex: 'wood' });
  N.decalOn(N.face(74, 15, 88, 25, 's'), X(80) + 16, 140, 200, 40, 'shop_cafe', true);
  K.brush([X(71), 8, Z(15)], [X(74), 24, Z(24)], { tex: 'wood', top: 'boards' }); // the dock along the lake
  K.props(pr => { for (const z of [Z(17), Z(21)]) { pr.box(X(80), 8, z, 120, 16, 34, 'boards'); pr.box(X(80), 24, z, 108, 4, 26, 'wood'); } });
  K.counter(X(84), Z(16) + 8, X(87), Z(20), 40, 'drawer', 'nx', 'wood'); K.fixture(X(81), Z(20), 140, 140, 'x', 'lightamber', 280, [1, 0.8, 0.5]); K.lamp(X(76), 120, Z(23), 160);
  K.key('red', X(85) + 16, Z(22) + 16); K.qoqC(77, 18, 0); K.qoqC(84, 23, 0);
  K.wave('redkey', { onKey: 'red', msg: 'Something climbs out of the lake...' });
  for (const [c, r] of [[72, 27], [66, 29], [80, 28], [88, 27], [60, 30]]) K.qoqC(c, r, 0, { wave: 'redkey' });
  K.juice(X(76), Z(16)); K.slice(X(86), Z(17));
  K.stairBrush(X(64), Z(19), X(68), Z(27), -112, 8, 'S', 'granite', 'granite'); // a way out of the water near the boathouse
  K.post(ctx => { // stone balustrades along the lake shores (gaps for Bow Bridge and the steps out of the water)
    for (const [a, b] of [[X(2), X(52)], [X(56), X(71)]]) ctx.brush([a, 8, Z(14) - 6], [b, 48, Z(14)], { tex: 'parapet', top: 'parapet' });
    for (const [a, b] of [[X(2), X(52)], [X(56), X(64)], [X(68), X(71)]]) ctx.brush([a, 8, Z(27)], [b, 48, Z(27) + 6], { tex: 'parapet', top: 'parapet' });
    ctx.brush([X(71), 8, Z(14)], [X(71) + 6, 48, Z(27)], { tex: 'parapet', top: 'parapet' });
  });

  // ======================= BOW BRIDGE (red gate) & THE RAMBLE =======================
  K.post(ctx => {
    ctx.brush([X(52), 16, Z(13)], [X(56), 24, Z(27)], { tex: 'wood', top: 'boards' });
    ctx.brush([X(52), 24, Z(13)], [X(52) + 4, 58, Z(27)], { tex: 'railing', fit: true, noshadow: true }); ctx.brush([X(56) - 4, 24, Z(13)], [X(56), 58, Z(27)], { tex: 'railing', fit: true, noshadow: true });
    ctx.props.ring(X(54), -70, Z(20), 120, 132, 128, 'z', 0, Math.PI, 'carwhite', 24);
    ctx.mover({ type: 'door', min: [X(52), 8, Z(27)], max: [X(56), 140, Z(27) + 10], key: 'red', tex: 'door_red', name: 'bowgate', wait: -1, lip: 8, speed: 110 });
    for (const x of [X(52) - 8, X(56) + 8]) { ctx.props.cylinder(x, 8, Z(27) + 5, 7, 120, 'carwhite', { segs: 8 }); ctx.props.sphere(x, 138, Z(27) + 5, 8, 'glow', { fullbright: true, segs: 8, rings: 6 }); ctx.light(x, 130, Z(28), 220, [1, 0.75, 0.45]); }
  });
  K.msg([X(50), 8, Z(27)], [X(58), 120, Z(31)], 'Bow Bridge is chained shut. The RED keycard opens it.');
  for (const [c, r] of [[40, 8], [60, 6], [32, 6], [48, 11], [66, 11]]) K.qoqC(c, r, 180);
  K.marvC(56, 8, 180); K.qoq(X(44), Z(4), 180, { turret: true, y: 8 });
  K.juice(X(62), Z(12)); K.health(X(36), Z(12)); K.slices([[X(54), Z(10)], [X(44), Z(9)], [X(34), Z(8)], [X(64), Z(5)]]);
  // the Ramble cave: behind the boards in the rock
  K.paint(2, 2, 8, 9, T(ROCK(160))); K.paint(3, 10, 6, 12, T(N.sky(8, 'dirt', 'granite')));
  K.paint(3, 3, 6, 7, T({ f: 8, c: 96, floor: 'dirt', ceil: 'granite', side: 'granite', upper: 'granite', roof: 160, roofTex: 'granite', roofSky: 1600 })); K.paint(4, 8, 5, 9, T({ f: 8, c: 96, floor: 'dirt', ceil: 'granite', side: 'granite', upper: 'granite', roof: 160, roofTex: 'granite', roofSky: 1600 }));
  K.breakable([X(4), 8, Z(10) - 8], [X(6), 96, Z(10)], { tex: 'boards', health: 24, secret: true });
  K.item('candybag', X(4), Z(4), { amount: 50 }); K.item('turdbox', X(5), Z(5), { amount: 4 }); K.health(X(4) + 16, Z(6) + 16); K.light(X(5), 60, Z(5), 140, [1, 0.6, 0.3], 1);

  // ======================= BELVEDERE CASTLE (blue key on the roof) =======================
  K.paint(10, 3, 23, 11, T(ROCK(136)));
  K.stairs(24, 4, 26, 12, 'N', 8, 136, { floor: 'granite', ceil: 'sky', side: 'granite', upper: 'granite', sky: true, c: 1600 });
  K.post(ctx => {
    ctx.brush([X(12), 136, Z(3)], [X(22), 296, Z(8)], { tex: 'granite', top: 'jailfloor' });
    for (let x = X(12); x < X(22); x += 32) { ctx.brush([x, 296, Z(3)], [x + 16, 320, Z(3) + 10], { tex: 'granite' }); }
    for (let z = Z(3); z < Z(8); z += 32) ctx.brush([X(22) - 10, 296, z], [X(22), 320, z + 16], { tex: 'granite' });
    ctx.brush([X(12), 296, Z(3)], [X(15), 440, Z(6)], { tex: 'granite', top: 'roof' }); ctx.props.cylinder(X(13) + 16, 440, Z(4) + 16, 34, 60, 'roof', { rTop: 2, segs: 8 });
    ctx.props.pipe(X(13) + 16, 500, Z(4) + 16, X(13) + 16, 560, Z(4) + 16, 1.5, 'metal'); ctx.props.box(X(14), 548, Z(4) + 16, 30, 16, 2, 'carred');
    for (const [x, y, z] of [[X(17), 220, Z(8)], [X(20), 220, Z(8)], [X(13) + 16, 380, Z(6)]]) ctx.decal({ at: [x, y, z], n: 'pz', w: 20, h: 40, tex: 'glow', fullbright: true });
    ctx.light(X(17), 340, Z(6), 300, [1, 0.7, 0.45]); ctx.light(X(18), 200, Z(10), 260, [1, 0.7, 0.45]);
  });
  K.stairBrush(X(12), Z(8), X(23), Z(10), 136, 296, 'W', 'granite', 'jailfloor');
  K.key('blue', X(18) + 16, Z(5) + 16, 296);
  K.qoq(X(20), Z(10), 180, { y: 136 }); K.qoq(X(16), Z(4), 90, { y: 296, turret: true }); K.qoq(X(11), Z(10), 90, { y: 136 });
  K.health(X(21), Z(6), 296); K.slices([[X(14), Z(10)], [X(22), Z(10)]], 136);
  K.wave('bluekey', { onKey: 'blue', msg: 'Lightning strikes the castle... ghosts pour out of the Ramble!' });
  for (const [c, r, y] of [[30, 8, 8], [44, 6, 8], [20, 10, 136], [58, 10, 8], [14, 4, 296]]) K.qoq(C(c), C(r), 0, { wave: 'bluekey', y });

  // ======================= 5th AVENUE & THE MUSEUM (exit) =======================
  const M = N.face(110, 20, 115, 50, 'w');
  K.stairBrush(X(105), Z(24), X(110), Z(46), 0, 72, 'E', 'granite', 'granite');
  K.post(ctx => { for (let z = Z(25); z < Z(46); z += 96) { ctx.props.cylinder(X(109), 72, z, 12, 150, 'limestone', { segs: 12 }); ctx.brush([X(109) - 12, 72, z - 12], [X(109) + 12, 222, z + 12], { invisible: true, noshadow: true }); }
    ctx.brush([X(107), 222, Z(24)], [X(110), 240, Z(46)], { tex: 'limestone', top: 'roof' }); });
  N.decalOn(M, Z(35), 280, 360, 70, 'sign_onlineexchange', true);
  K.light(X(106), 160, Z(35), 360, [1, 0.8, 0.55]);
  const E5 = N.face(110, 51, 115, 99, 'w'), E5n = N.face(110, 2, 115, 19, 'w');
  N.shop(E5, Z(60), 'hotel', { awning: 'R' }); N.shop(E5, Z(76), 'bank', { closed: true }); N.shop(E5n, Z(10), 'cafe', { awning: 'G' });
  N.car(X(104), Z(70), 0, 0.2, 'taxi'); N.car(X(102), Z(50), 0, Math.PI - 0.3, 'burnt'); N.car(X(104), Z(14), 0, 0.9, 'cop'); N.barrelFire(X(99), Z(60), 8); N.trash(X(108), Z(54), 8, 5);
  K.qoqC(104, 40, 90); K.qoqC(102, 58, 90); K.qoqC(104, 24, 90); K.marvC(103, 78, 0); K.qoqC(101, 10, 180);
  K.juice(X(108), Z(84)); K.health(X(99), Z(20)); K.slices([[X(104), Z(30)], [X(103), Z(64)], [X(104), Z(6)]]);
  K.wave('museum', { min: [X(100), 8, Z(28)], max: [X(108), 120, Z(42)], msg: 'The museum doors are open... and so is the gift shop.' });
  for (const [c, r] of [[104, 18], [104, 52], [100, 34], [108, 48]]) K.qoqC(c, r, 90, { wave: 'museum' });
  K.exit(X(110), 72, Z(35), 'nx');

  // bot route: the Mall, the terrace, the boathouse (red), Bow Bridge, the castle (blue), back to the 5th Ave gate, the museum
  K.goal(X(43), Z(98)); K.goal(X(43), Z(60)); K.goal(X(42), Z(44)); K.goal(X(42), Z(38), 72); K.goal(X(40), Z(33)); K.goal(X(62), Z(30));
  K.goal(X(80) + 16, Z(26)); K.goal(X(85) + 16, Z(22) + 16); K.goal(X(54), Z(29)); K.goal(X(54), Z(12)); K.goal(X(25), Z(12)); K.goal(X(23) + 16, Z(4) + 16, 136);
  K.goal(X(22), Z(11), 136); K.goal(X(18) + 16, Z(5) + 16, 296); K.goal(X(25), Z(12)); K.goal(X(54), Z(12)); K.goal(X(54), Z(30)); K.goal(X(90), Z(32)); K.goal(X(102), Z(33));
});
