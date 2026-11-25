// E2M4 — CHINATOWN. Fog and red lanterns over Canal and Mott Streets. The red key is in the Golden Dragon's kitchen and
// opens the ornamental gate on Pell St; from the courtyard a fire escape leads onto the rooftops, where plank bridges
// cross the alleys to a rooftop pagoda and the blue key. Down Doyers St to Bayard St, past the flooded park, into the fish market.
import { makeLevel } from '../kit.js';
import { nyc, NYC_STYLES } from '../nyc.js';

export default makeLevel({
  name: 'E2M4', title: 'E2M4: CHINATOWN', ambience: 'street', ambient: 34, ambientColor: [1.0, 0.62, 0.45], music: 'assets/music/e1m7.mp3', city: true,
  fog: { color: [0.12, 0.045, 0.025], density: 0.0007 }, skyTint: [0.35, 0.3, 0.42],
  // v0.31: sunset, and the city is burning: embers and ash under a blood-orange sky
  sky: { hell: 1, silh: 'city', a: [0.08, 0.02, 0.02], b: [1, 0.42, 0.1], glow: [0.9, 0.35, 0.08], orb: { kind: 'moon', az: 2.6, el: 0.28, color: [1, 0.3, 0.1] } },
  rain: [{ kind: 'embers', density: 420, wind: [14, 8] }, { kind: 'ash', density: 380, wind: [14, 8] }], outTint: [1, 0.72, 0.55], styles: NYC_STYLES,
}, 104, 104, 'tenementdark', K => {
  const { X, Z, C } = K; const T = s => K.type(s); const N = nyc(K, { sky: 1500 });
  const DINE = { f: 8, c: 180, floor: 'carpet', ceil: 'gold', side: 'curtain', upper: 'tenement', roof: 256, roofSky: 1500 };
  const KITCH = { f: 8, c: 150, floor: 'checker', ceil: 'ceil', side: 'chrome', upper: 'tenement', roof: 256, roofSky: 1500 };
  const OFFICE = { f: 8, c: 140, floor: 'tilebrown', ceil: 'ceil', side: 'wood', upper: 'tenement', roof: 256, roofSky: 1500 };
  const MARKET = { f: 8, c: 220, floor: 'tile', ceil: 'steeldark', side: 'subwaytile', upper: 'brickdark', roof: 260, roofSky: 1500 };
  const lanterns = (x0, z0, x1, z1, y, n = 6) => K.props((pr, ctx) => { pr.pipe(x0, y, z0, x1, y, z1, 0.8, 'carblack');
    for (let i = 1; i < n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, sag = Math.sin(t * Math.PI) * 18; pr.sphere(x, y - sag - 10, z, 7, 'redlight', { fullbright: true, segs: 8, rings: 6, sy: 1.25 }); if (i % 2) ctx.light(x, y - sag - 20, z, 200, [1, 0.2, 0.12]); } });

  // ======================= BLOCKS =======================
  N.building(2, 96, 20, 101, 260, 'tenement'); N.building(21, 96, 45, 101, 340, 'tenementdark'); N.building(46, 96, 70, 101, 280, 'brownstone'); N.building(71, 96, 101, 101, 380, 'tenement');
  N.building(2, 40, 29, 81, 320, 'tenementdark');
  N.building(38, 48, 56, 81, 256, 'tenement', { inner: 'curtain', tower: false });           // Golden Dragon
  N.building(57, 48, 65, 81, 300, 'brownstone'); N.building(66, 57, 81, 81, 224, 'tenement'); N.building(82, 36, 101, 81, 320, 'tenementdark');
  N.building(38, 16, 49, 39, 224, 'brownstone', { tower: false });
  N.building(50, 16, 58, 39, 352, 'tenement', { tower: false, bulk: false, ac: 0, parapet: 'nsw' });   // the pagoda roof
  N.building(59, 16, 71, 39, 288, 'tenementdark', { tower: false, bulk: false, parapet: 'n' });
  N.building(72, 31, 79, 35, 288, 'brickdark', { tower: false, bulk: false, ac: 0, parapet: 'en' });
  N.building(80, 16, 83, 35, 288, 'brownstone', { tower: false, bulk: false, ac: 0, parapet: 'en' });
  N.building(84, 16, 101, 35, 260, 'brickdark', { inner: 'subwaytile', tower: false });       // fish market
  N.building(2, 2, 101, 5, 360, 'tenement', { parapet: false, tower: false, bulk: false, ac: 0 });

  // ======================= STREETS =======================
  N.street(2, 82, 101, 95, 'x', { cross: [29, 38], lampEvery: 12 });     // Canal St
  N.street(30, 16, 37, 81, 'z', { walk: 2, lampEvery: 10, center: false });  // Mott St
  N.road(32, 82, 35, 84);
  N.street(38, 40, 65, 47, 'x', { walk: 2, lampEvery: 9, center: false });   // Pell St
  N.plaza(66, 36, 81, 56, 0, 'concretedark', 'brickdark');                  // the courtyard
  N.street(2, 6, 101, 15, 'x', { walk: 2, lampEvery: 12 });                 // Bayard St
  N.street(72, 16, 79, 30, 'z', { walk: 2, lamps: false, center: false });  // Doyers St
  N.plaza(2, 16, 29, 39, 8, 'grass', 'curb');                               // Columbus Park
  K.brush([X(30) - 4, 0, Z(16)], [X(30), 150, Z(40)], { tex: 'bars', noshadow: true }); // iron park fence along Mott St
  K.ambient(X(40), 60, Z(88), 'wind', 2400, 0.55);
  N.streetSign(X(30) - 14, Z(82) - 14, 8, 'st_canalst', 'st_mottst'); N.streetSign(X(38) + 14, Z(48) - 10, 8, 'st_mottst', 'st_bowery');

  // ======================= CANAL STREET (start) =======================
  K.start(5, 88, -90);
  K.msg([X(2), 0, Z(84)], [X(9), 120, Z(92)], 'Chinatown. The fog is thick... and full of Qoqs.');
  const CS = N.face(2, 96, 101, 101, 'n'), CN = N.face(2, 40, 29, 81, 's'), CE = N.face(38, 48, 101, 81, 's');
  for (const [F, a, n, o] of [[CS, X(6), 'jewelry', {}], [CS, X(14), 'fish', { awning: 'B' }], [CS, X(24), 'bakery', { awning: 'R' }], [CS, X(34), 'tea', { awning: 'G' }], [CS, X(44), 'chinese', { awning: 'R', neon: true }], [CS, X(56), 'pharmacy', {}], [CS, X(66), 'noodle', { awning: 'R' }], [CS, X(78), 'jewelry', { closed: true }], [CS, X(90), 'bakery', {}], [CS, X(98), 'liquor', { closed: true }],
    [CN, X(8), 'tea', { awning: 'G' }], [CN, X(20), 'noodle', { awning: 'R', neon: true }], [CE, X(44), 'dragon', { awning: 'R', w: 160 }], [CE, X(60), 'fish', { awning: 'B' }], [CE, X(72), 'jewelry', { closed: true }], [CE, X(86), 'bakery', { awning: 'R' }], [CE, X(96), 'chinese', {}]]) N.shop(F, a, n, o);
  N.tag(CS, X(72), 40, 'tag_qoq'); N.tag(CN, X(14), 40, 'tag_beans');
  for (const x of [X(10), X(26), X(46), X(66), X(86)]) lanterns(x, Z(82) + 8, x + 40, Z(96) - 8, 220, 7);
  // market stalls: tarp roofs on poles, crates of produce
  for (const [x, z] of [[X(12), Z(92)], [X(40), Z(92)], [X(62), Z(84) + 8], [X(84), Z(92)]]) K.props((pr, ctx) => { ctx.brush([x - 48, 96, z - 24], [x + 48, 100, z + 24], { tex: 'awningR', noshadow: false }); for (const [dx, dz] of [[-46, -22], [46, -22], [-46, 22], [46, 22]]) pr.cylinder(x + dx, 8, z + dz, 1.6, 88, 'metal', { segs: 6 });
    ctx.brush([x - 40, 8, z - 16], [x + 40, 40, z + 16], { tex: 'crate', top: 'crate' }); for (let i = 0; i < 9; i++) pr.sphere(x - 32 + (i % 5) * 16, 44, z - 8 + Math.floor(i / 5) * 16, 6, i % 2 ? 'hydrant' : 'lightamber', { segs: 7, rings: 5 }); });
  K.props(pr => { for (let i = 0; i < 9; i++) pr.cylinder(X(48) + i * 22, 0, Z(89) + Math.sin(i) * 14, 9, 10, i % 2 ? 'gold' : 'hydrant', { rz: Math.PI / 2, ry: 0.3 * Math.sin(i), segs: 10 }); pr.sphere(X(46), 12, Z(89), 16, 'hydrant', { segs: 10, rings: 7 }); }); // a dropped parade dragon
  N.car(X(20), Z(86), 0, Math.PI / 2 + 0.2, 'taxi'); N.car(X(56), Z(91), 0, -Math.PI / 2 - 0.3, 'burnt'); N.car(X(76), Z(86), 0, 1.3, 'sedan', { paint: 'carblack' }); N.car(X(94), Z(90), 0, -1.9, 'burnt', { fireSize: 40 });
  K.brush([X(98), 0, Z(82)], [X(101), 150, Z(96)], { tex: 'rubble', top: 'rubble' }); N.fire(X(99), Z(88), 150, 36); // Canal St is blocked to the east
  N.steam(X(30), Z(89), 0); N.steam(X(70), Z(87), 0); N.trash(X(36), Z(83), 8, 5); N.trash(X(80), Z(94), 8, 5); N.hydrant(X(52), Z(83) + 4, 8);
  K.qoqC(16, 88, -90); K.qoqC(26, 92, -90); K.qoqC(42, 86, -90); K.qoqC(58, 88, -90); K.qoqC(72, 90, -90); K.qoqC(86, 86, -90); K.marvC(92, 88, -90); K.qoq(X(44), Z(83) + 8, 180, { turret: true, y: 8 });
  K.juice(X(4), Z(94)); K.health(X(48), Z(94)); K.juice(X(80), Z(83)); K.slices([[X(10), Z(86)], [X(30), Z(90)], [X(52), Z(86)], [X(68), Z(92)], [X(88), Z(84)]]);

  // ======================= MOTT STREET =======================
  const ME = N.face(38, 48, 56, 81, 'w'), MW = N.face(2, 40, 29, 81, 'e'), MW2 = N.face(2, 16, 29, 39, 'e');
  N.decalOn(ME, Z(58), 150, 220, 50, 'shop_dragon', true); K.brush([X(38) - 44, 110, Z(55)], [X(38), 116, Z(62)], { tex: 'awningR' });
  N.shop(ME, Z(70), 'tea', { awning: 'G' }); N.shop(ME, Z(76), 'bakery', { closed: true }); N.shop(MW, Z(50), 'noodle', { awning: 'R' }); N.shop(MW, Z(62), 'fish', { awning: 'B' }); N.shop(MW, Z(74), 'jewelry', { neon: true });
  for (const z of [Z(52), Z(64), Z(76)]) lanterns(X(30) + 4, z, X(38) - 4, z + 20, 200, 5);
  N.car(X(33) + 16, Z(68), 0, 0.1, 'taxi'); N.car(X(34), Z(30), 0, Math.PI + 0.2, 'burnt'); N.barrelFire(X(31), Z(44), 8); N.trash(X(36), Z(38), 8, 5); N.steam(X(34), Z(56), 0);
  K.brush([X(30), 0, Z(16)], [X(38), 160, Z(18)], { tex: 'rubble', top: 'rubble' }); N.car(X(34), Z(20), 0, 1.4, 'burnt', { fireSize: 44 }); // Mott is blocked at Bayard
  K.qoqC(34, 74, 180); K.qoqC(33, 60, 180); K.qoqC(35, 48, 180); K.qoqC(33, 34, 180); K.qoqC(34, 24, 180); K.qoq(X(31), Z(54), 90, { turret: true, y: 8 });
  K.juice(X(36), Z(80)); K.health(X(31), Z(30)); K.slices([[X(34), Z(66)], [X(32), Z(42)], [X(36), Z(26)]]);

  // ======================= GOLDEN DRAGON RESTAURANT (red key) =======================
  K.paint(39, 50, 50, 66, T(DINE)); K.door(38, 56, 38, 59, DINE, { top: 104, tex: 'gold' });
  K.wall(51, 50, 51, 56, 'curtain'); K.wall(51, 60, 51, 66, 'curtain'); K.door(51, 57, 51, 59, KITCH, { top: 96 });
  K.paint(52, 50, 55, 66, T(KITCH));
  K.wall(39, 67, 44, 67, 'curtain'); K.wall(48, 67, 50, 67, 'curtain'); K.door(45, 67, 47, 67, OFFICE, { top: 96 });
  K.paint(39, 68, 50, 78, T(OFFICE));
  K.props(pr => { for (const [c, r] of [[42, 52], [47, 52], [42, 58], [47, 63], [42, 64]]) { pr.roundTable(C(c), C(r), 8, 30, 34, 'wood', { top: 'curtain' }); pr.cylinder(C(c), 42, C(r), 12, 3, 'gold', { segs: 16 }); } });
  for (const [c, r] of [[44, 55], [44, 61], [48, 58]]) K.props((pr, ctx) => { pr.sphere(C(c), 150, C(r), 10, 'redlight', { fullbright: true, segs: 10, rings: 8, sy: 1.3 }); pr.cylinder(C(c), 160, C(r), 1, 20, 'carblack', { segs: 4 }); ctx.light(C(c), 130, C(r), 240, [1, 0.3, 0.2]); });
  K.decal({ at: [X(39), 90, Z(60)], n: 'px', w: 120, h: 70, tex: 'water', fullbright: true }); K.light(X(40), 90, Z(60), 180, [0.3, 0.6, 1]); // fish tank
  K.decal({ at: [X(45), 100, Z(50)], n: 'pz', w: 200, h: 90, tex: 'shop_dragon', fullbright: true });
  K.qoqC(41, 54, 90); K.qoqC(48, 61, 90); K.marvC(45, 64, 90); K.juice(X(49), Z(51)); K.slices([[X(43), Z(52)], [X(46), Z(65)]]);
  // kitchen: stoves with wok fires, steam, the red key
  K.brush([X(54), 8, Z(51)], [X(56), 44, Z(65)], { tex: 'chrome', top: 'grate' }); for (const z of [Z(53), Z(57), Z(61)]) N.fire(X(55), z, 44, 12, { smoke: false });
  K.emitter([X(54), 50, Z(52)], [X(56), 60, Z(64)], 'steam', 5); K.counter(X(52), Z(50) + 8, X(53) + 16, Z(55), 40, 'drawer', 'px', 'chrome');
  K.fixture(X(53), Z(58), 150, 140, 'z', 'light', 300, [1, 0.95, 0.85]);
  K.key('red', X(52) + 16, Z(64) + 16); K.qoqC(53, 60, 0); K.qoqC(52, 54, 0);
  K.wave('redkey', { onKey: 'red', msg: 'The dining room fills with Qoqs!' });
  for (const [c, r] of [[40, 52], [49, 54], [44, 58], [40, 64], [49, 65]]) K.qoqC(c, r, 90, { wave: 'redkey' });
  // the owner's office: shoot the lucky cat for the hidden safe room
  K.desk(X(41), Z(75), X(47), Z(77), 'nz', 'tv_pizza'); K.bookshelf(X(49), Z(69), X(51), Z(72), 110, 'nx');
  K.fixture(X(44), Z(72), 140, 100, 'x', 'lightamber', 240, [1, 0.8, 0.5]); K.health(X(40), Z(70)); K.juice(X(46), Z(70));
  K.paint(39, 79, 44, 80, T(OFFICE)); K.door(39, 78, 44, 78, OFFICE, { targeted: true, name: 'safe', wait: -1, tex: 'wood', top: 104 });
  K.decal({ at: [X(51), 70, Z(73) + 16], n: 'nx', w: 26, h: 30, tex: 'emblem_slice', fullbright: true });
  K.button({ min: [X(51) - 6, 56, Z(73) + 4], max: [X(51), 84, Z(74) + 12], shoot: true, target: 'safe', msg: 'The lucky cat waves... a panel slides open.' });
  K.secret([X(39), 8, Z(79)], [X(45), 100, Z(81)]); K.item('candybag', X(40), Z(80), { amount: 50 }); K.item('turdbox', X(43), Z(80), { amount: 4 }); K.slice(X(42), Z(79) + 16); K.light(X(42), 80, Z(80), 150, [1, 0.7, 0.3], 1);

  // ======================= PELL STREET GATE (red key), THE COURTYARD & THE FIRE ESCAPE =======================
  K.post(ctx => {
    ctx.brush([X(38), 0, Z(40)], [X(38) + 10, 150, Z(42)], { tex: 'bars', noshadow: true }); ctx.brush([X(38), 0, Z(46)], [X(38) + 10, 150, Z(48)], { tex: 'bars', noshadow: true });
    ctx.mover({ type: 'door', min: [X(38), 0, Z(42)], max: [X(38) + 10, 150, Z(46)], key: 'red', tex: 'door_red', name: 'pellgate', wait: -1, lip: 8, speed: 110 });
    ctx.brush([X(38) - 6, 150, Z(39)], [X(38) + 16, 176, Z(49)], { tex: 'hydrant', top: 'gold' }); ctx.brush([X(38) - 10, 176, Z(38)], [X(38) + 20, 184, Z(50)], { tex: 'gold', top: 'awningR' });
    for (const z of [Z(39) + 4, Z(48) + 12]) ctx.props.cylinder(X(38) + 5, 0, z, 6, 150, 'hydrant', { segs: 8 });
  });
  K.msg([X(36), 0, Z(40)], [X(38), 120, Z(48)], 'The Pell St gate. It needs the RED keycard.');
  const PN = N.face(38, 16, 71, 39, 's'), PS = N.face(57, 48, 65, 81, 'n');
  N.shop(PN, X(42), 'noodle', { awning: 'R', neon: true }); N.shop(PN, X(54), 'tea', { awning: 'G' }); N.shop(PN, X(62), 'bar', { closed: true }); N.shop(PS, X(61), 'fish', { awning: 'B' });
  for (const x of [X(44), X(56)]) lanterns(x, Z(40) + 4, x + 24, Z(48) - 4, 190, 5);
  N.trash(X(50), Z(47), 8, 4); N.barrelFire(X(64), Z(41), 8); N.car(X(52), Z(43) + 16, 0, Math.PI / 2 + 0.1, 'sedan');
  K.qoqC(46, 44, -90); K.qoqC(58, 43, -90); K.qoq(X(62), Z(47), 0, { turret: true, y: 8 });
  K.juice(X(40), Z(47)); K.slices([[X(48), Z(43)], [X(60), Z(45)]]);
  // courtyard: laundry lines, crates, and the fire escape on the north wall up to the roofs
  K.stairBrush(X(66), Z(36), X(82), Z(38), 0, 288, 'W', 'steelbeam', 'grate'); // steel stairs up the courtyard wall to the roofs
  K.props(pr => { for (const z of [Z(42), Z(48)]) pr.pipe(X(66), 180, z, X(82), 190, z + 10, 0.6, 'metal'); });
  for (const [x, z, n] of [[X(68), Z(50), 2], [X(78), Z(54), 1], [X(80), Z(44), 3]]) K.crates(x, z, 0, n, 38);
  K.lamp(X(70), 120, Z(38), 200); K.lamp(X(80), 120, Z(52), 200); lanterns(X(66), Z(38), X(82), Z(54), 210, 7);
  K.qoqC(70, 46, 0); K.qoqC(76, 50, 0); K.marvC(74, 40, 0); K.qoq(X(80), Z(40), 180, { turret: true });
  K.juice(X(81), Z(55)); K.health(X(67), Z(55)); K.slices([[X(72), Z(44)], [X(78), Z(48)]]);

  // ======================= THE ROOFTOPS (blue key at the pagoda) =======================
  K.stairBrush(X(58), Z(26), X(61), Z(30), 288, 352, 'W', 'parapet', 'roof');
  K.post(ctx => { // the pagoda: red columns, two tiers of roofs
    const x = X(54), z = Z(27), y = 352;
    for (const [dx, dz] of [[-40, -40], [40, -40], [-40, 40], [40, 40]]) { ctx.props.cylinder(x + dx, y, z + dz, 5, 110, 'hydrant', { segs: 8 }); ctx.brush([x + dx - 5, y, z + dz - 5], [x + dx + 5, y + 110, z + dz + 5], { invisible: true, noshadow: true }); }
    ctx.props.cylinder(x, y + 110, z, 80, 30, 'awningG', { rTop: 30, segs: 4, ry: Math.PI / 4 }); ctx.props.cylinder(x, y + 140, z, 34, 24, 'gold', { segs: 4, ry: Math.PI / 4 });
    ctx.props.cylinder(x, y + 148, z, 52, 26, 'awningG', { rTop: 6, segs: 4, ry: Math.PI / 4 }); ctx.props.cylinder(x, y + 174, z, 2, 30, 'gold', { segs: 6 });
    ctx.brush([x - 56, y + 108, z - 56], [x + 56, y + 116, z + 56], { tex: 'gold', top: 'awningG', noshadow: false });
    for (const [dx, dz] of [[-56, -56], [56, -56], [-56, 56], [56, 56]]) { ctx.props.sphere(x + dx, y + 100, z + dz, 7, 'redlight', { fullbright: true, segs: 8, rings: 6, sy: 1.3 }); }
    ctx.light(x, y + 80, z, 300, [1, 0.3, 0.2]); ctx.props.box(x, y, z, 44, 20, 44, 'gold'); ctx.brush([x - 22, y, z - 22], [x + 22, y + 20, z + 22], { invisible: true, noshadow: true });
  });
  K.key('blue', X(54) + 16, Z(27) + 16, 372);
  K.post(ctx => { // plank bridge over Doyers St
    ctx.brush([X(70), 282, Z(23)], [X(81), 288, Z(27)], { tex: 'boards', top: 'boards' });
    ctx.brush([X(72), 288, Z(23) - 2], [X(80), 330, Z(23)], { tex: 'railing', fit: true, noshadow: true }); ctx.brush([X(72), 288, Z(27)], [X(80), 330, Z(27) + 2], { tex: 'railing', fit: true, noshadow: true });
  });
  for (const [x, z, y] of [[X(64), Z(22), 288], [X(66), Z(32), 288], [X(76), Z(33), 288], [X(52), Z(20), 352], [X(45), Z(30), 224], [X(82), Z(20), 288]]) K.qoq(x, z, 180, { y, turret: y === 352 });
  K.marv(X(62), Z(30), 90, { y: 288 }); K.juice(X(68), Z(18), 288); K.health(X(74), Z(34), 288); K.slices([[X(62), Z(20)], [X(70), Z(30)], [X(78), Z(32)]], 288); K.slices([[X(52), Z(32)], [X(56), Z(18)]], 352);
  K.wave('bluekey', { onKey: 'blue', msg: 'Ghosts rise out of the fog over the rooftops!' });
  for (const [x, z, y] of [[X(66), Z(20), 288], [X(70), Z(36), 288], [X(52), Z(36), 352], [X(62), Z(26), 288], [X(82), Z(30), 288]]) K.qoq(x, z, 90, { wave: 'bluekey', y });
  K.secret([X(38), 210, Z(28)], [X(46), 320, Z(38)]); // drop off the pagoda roof onto the lower roof
  K.health(X(40), Z(32), 224); K.item('sausages', X(42), Z(34), { amount: 12, y: 224 }); K.slice(X(41), Z(30), 224); K.item('candybag', X(43), Z(36), { amount: 50, y: 224 });
  K.msg([X(56), 340, Z(18)], [X(60), 420, Z(36)], 'The rooftops. Plank bridges cross the alleys.');
  // down the far fire escape into Doyers St
  N.fireEscape(N.face(80, 16, 83, 35, 'w'), Z(17), 3, { dir: 1, land: 48 });

  // ======================= DOYERS ST, BAYARD ST, COLUMBUS PARK =======================
  for (const z of [Z(18), Z(24)]) lanterns(X(72) + 4, z, X(80) - 4, z + 16, 180, 4);
  N.trash(X(73), Z(28), 8, 4); N.barrelFire(X(78), Z(18), 8);
  K.qoqC(75, 22, 0); K.qoqC(76, 18, 0); K.juice(X(73), Z(17)); K.slice(X(76), Z(26));
  const BN = N.face(2, 2, 101, 5, 's'), BS = N.face(38, 16, 71, 39, 'n');
  N.shop(BN, X(10), 'bakery', { awning: 'R' }); N.shop(BN, X(26), 'tea', { awning: 'G', neon: true }); N.shop(BN, X(46), 'noodle', {}); N.shop(BN, X(66), 'jewelry', { closed: true }); N.shop(BN, X(88), 'pharmacy', { awning: 'G' });
  N.shop(BS, X(44), 'chinese', { awning: 'R' }); N.shop(BS, X(64), 'fish', { closed: true });
  N.car(X(20), Z(10), 0, Math.PI / 2, 'taxi'); N.car(X(54), Z(12), 0, -Math.PI / 2 + 0.2, 'burnt'); N.car(X(86), Z(9), 0, 1.7, 'cop');
  for (const x of [X(16), X(48), X(80)]) lanterns(x, Z(6) + 4, x + 30, Z(16) - 4, 200, 5);
  K.qoqC(60, 10, 90); K.qoqC(44, 12, 90); K.qoqC(28, 9, 90); K.qoqC(90, 12, -90); K.marvC(70, 9, 90);
  K.juice(X(36), Z(14)); K.health(X(96), Z(14)); K.slices([[X(52), Z(8)], [X(32), Z(12)], [X(84), Z(13)]]);
  // the park: flooded by a burst water main, a gazebo, benches
  K.pool(6, 22, 24, 34, N.sky(8, 'grass', 'curb'), 'water', 16, 0);
  K.emitter([X(14), 0, Z(28)], [X(15), 10, Z(29)], 'steam', 6); K.props(pr => pr.pipe(X(14) + 16, -8, Z(28) + 16, X(14) + 30, 40, Z(28) + 8, 6, 'rust'));
  K.post(ctx => { const x = X(20), z = Z(19), y = 8; for (const [dx, dz] of [[-36, -36], [36, -36], [-36, 36], [36, 36]]) ctx.props.cylinder(x + dx, y, z + dz, 4, 100, 'hydrant', { segs: 8 });
    ctx.props.cylinder(x, y + 100, z, 64, 26, 'awningG', { rTop: 4, segs: 8 }); ctx.brush([x - 40, y + 98, z - 40], [x + 40, y + 102, z + 40], { tex: 'gold', top: 'awningG' }); ctx.light(x, y + 80, z, 220, [1, 0.6, 0.35]); });
  for (const [x, z] of [[X(4), Z(18)], [X(28), Z(36)], [X(6), Z(37)], [X(26), Z(17)]]) N.tree(x, z, 8, 1.1);
  for (const [x, z, a] of [[X(10), Z(18), 'x'], [X(26), Z(26), 'z'], [X(4), Z(28), 'z']]) N.bench(x, z, 8, a);
  N.decalOn(N.face(2, 2, 101, 5, 's'), X(16), 130, 160, 40, 'sign_park', true);
  K.qoqC(12, 20, 180); K.qoqC(22, 30, 180); K.qoqC(8, 36, 180); K.qoqC(26, 38, 180);
  K.juice(X(4), Z(36)); K.health(X(27), Z(20)); K.slices([[X(16), Z(24)], [X(10), Z(30)], [X(20), Z(36)]]);
  K.secret([X(18), 8, Z(17)], [X(22), 120, Z(21)]); K.item('sausages', X(20), Z(19), { amount: 12 }); K.health(X(20) + 16, Z(19) + 16);

  // ======================= FISH MARKET (blue door) & EXIT =======================
  K.paint(85, 17, 100, 34, T(MARKET)); K.door(90, 16, 94, 16, MARKET, { key: 'blue', top: 112 });
  N.decalOn(N.face(84, 16, 101, 35, 'n'), X(92) + 16, 150, 220, 50, 'shop_market', true);
  for (const r of [20, 25, 30]) K.brush([X(87), 8, Z(r)], [X(98), 40, Z(r) + 24], { tex: 'chrome', top: 'water' });
  K.props(pr => { for (const r of [20, 25, 30]) for (let i = 0; i < 10; i++) pr.sphere(X(87) + 16 + i * 32, 44, Z(r) + 12, 7, 'chrome', { sy: 0.4, segs: 8, rings: 4 }); });
  for (const [c, r] of [[89, 22], [96, 22], [89, 32], [96, 32]]) K.lamp(X(c), 180, Z(r), 220);
  K.decal({ at: [X(101), 100, Z(26)], n: 'nx', w: 200, h: 90, tex: 'water', fullbright: true });
  K.qoqC(88, 18, 180); K.qoqC(99, 24, 180); K.marvC(93, 28, 180);
  K.wave('market', { min: [X(86), 8, Z(27)], max: [X(100), 120, Z(34)], msg: 'The freezer doors burst open!' });
  for (const [c, r] of [[86, 33], [100, 33], [92, 33], [86, 26]]) K.qoqC(c, r, 0, { wave: 'market' });
  K.juice(X(86), Z(18)); K.health(X(100), Z(18)); K.slices([[X(92), Z(23)], [X(92), Z(28)]]);
  K.exit(X(93), 8, Z(35), 'nz');

  // bot route: Mott St, the kitchen (red), Pell St, the courtyard fire escape, rooftops, the pagoda (blue), Doyers, Bayard, the market
  K.goal(X(34), Z(70)); K.goal(X(40), Z(58)); K.goal(X(52) + 16, Z(64) + 16); K.goal(X(36), Z(44)); K.goal(X(52), Z(44)); K.goal(X(74), Z(40));
  K.goal(X(74), Z(37), 160); K.goal(X(67), Z(34), 288); K.goal(X(62), Z(28), 288); K.goal(X(54) + 16, Z(27) + 16, 372); K.goal(X(66), Z(25), 288);
  K.goal(X(76), Z(22)); K.goal(X(76), Z(10)); K.goal(X(92), Z(14));
});
