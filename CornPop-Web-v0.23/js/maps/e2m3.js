// E2M3 — THE EL. An elevated train line on steel legs over a long Queens avenue. Up the station stairs to the platforms,
// east through a stalled train to the signal tower (red key), down into the junkyard through its red gate, up the car
// lift in the auto shop (blue key), then the emergency stairs to the cut-off west end of the el and its blue signal gate.
import { makeLevel } from '../kit.js';
import { nyc, NYC_STYLES } from '../nyc.js';

export default makeLevel({
  name: 'E2M3', title: 'E2M3: THE EL', ambience: 'street', ambient: 22, ambientColor: [0.58, 0.64, 1.0], music: 'assets/music/e1m3.mp3', city: true,
  fog: { color: [0.035, 0.034, 0.045], density: 0.0005 }, skyTint: [0.3, 0.32, 0.48],
  rain: { density: 1300, wind: [70, 10] }, storm: { every: [5, 12], power: 1 }, styles: NYC_STYLES,
}, 120, 96, 'tenementdark', K => {
  const { X, Z, C } = K; const T = s => K.type(s); const N = nyc(K, { sky: 1600 });
  const SHOP = { f: 0, c: 200, floor: 'concretedark', ceil: 'ceil', side: 'concrete', upper: 'brickdark', roof: 220, roofSky: 1600 };
  const ROOM = { f: 8, c: 120, floor: 'tilebrown', ceil: 'ceil', side: 'trim', upper: 'limestone', roof: 240, roofSky: 1600 };
  const DY = 296; // top of the el deck

  // ======================= BLOCKS & STREET =======================
  N.building(2, 4, 9, 35, 320, 'tenement'); N.building(43, 4, 60, 35, 256, 'brownstone'); N.building(61, 4, 84, 35, 352, 'tenementdark');
  N.building(85, 4, 106, 35, 224, 'brickdark'); N.building(107, 4, 117, 35, 400, 'office'); N.building(10, 4, 42, 7, 300, 'brickdark', { parapet: false, tower: false, bulk: false, ac: 0 });
  N.building(2, 56, 30, 92, 288, 'tenement'); N.building(31, 56, 54, 92, 352, 'brownstone'); N.building(55, 56, 72, 92, 240, 'limestone', { tower: false });
  N.building(73, 56, 100, 92, 320, 'tenementdark'); N.building(101, 56, 117, 92, 256, 'brickdark');
  N.street(2, 36, 117, 55, 'x', { cross: [34, 96], lampEvery: 12, center: false });
  N.plaza(10, 8, 42, 35, 0, 'dirt', 'concrete');                                    // the junkyard
  N.building(11, 9, 25, 19, 220, 'brickdark', { inner: 'concrete', tower: false, bulk: false });
  K.paint(12, 10, 24, 18, T(SHOP));                                                    // auto shop
  K.ambient(X(60), 100, Z(46), 'wind', 3000, 0.55);
  N.streetSign(X(34) - 16, Z(39) - 12, 8, 'st_125st', 'st_lexingtonav'); N.streetSign(X(96) + 16, Z(53) + 12, 8, 'st_125st', 'st_broadway');

  // ======================= THE EL: deck, legs, rails, the collapsed span =======================
  K.post(ctx => {
    const za = Z(42), zb = Z(50);
    const spans = [[X(2), X(40)], [X(45), X(118)]];
    for (const [a, b] of spans) ctx.brush([a, DY - 16, za], [b, DY, zb], { tex: 'steelbeam', top: 'grate', bottom: 'steelbeam' });
    ctx.brush([X(50), DY - 16, Z(38)], [X(70), DY, za], { tex: 'steelbeam', top: 'concrete', bottom: 'steelbeam' }); ctx.brush([X(50), DY - 16, zb], [X(70), DY, Z(54)], { tex: 'steelbeam', top: 'concrete', bottom: 'steelbeam' });
    ctx.brush([X(50), DY, Z(38)], [X(70), DY + 16, Z(42) - 8], { tex: 'hazard', top: 'concrete' }); ctx.brush([X(50), DY, Z(50) + 8], [X(70), DY + 16, Z(54)], { tex: 'hazard', top: 'concrete' }); // platforms
    ctx.brush([X(108), DY - 16, zb], [X(118), DY, Z(56)], { tex: 'steelbeam', top: 'grate', bottom: 'steelbeam' }); // signal tower base
    for (let c = 4; c < 118; c += 6) { if (c > 38 && c < 47) continue; for (const z of [za + 16, zb - 16]) ctx.brush([X(c) - 8, 0, z - 8], [X(c) + 8, DY - 16, z + 8], { tex: 'steelbeam' }); }
    for (let c = 4; c < 118; c += 6) { if (c > 38 && c < 47) continue; ctx.props.pipe(X(c), DY - 40, za + 16, X(c), DY - 40, zb - 16, 5, 'steelbeam'); }
    for (const z of [Z(43) + 8, Z(45) + 8, Z(47) + 8, Z(49) - 8]) for (const [a, b] of spans) ctx.props.pipe(a, DY + 3, z, b, DY + 3, z, 2.5, 'chrome');
    const rail = (a, b, z) => ctx.brush([a, DY, z], [b, DY + 36, z + 2], { tex: 'railing', fit: true, noshadow: true });
    for (const [a, b] of [[X(2), X(13)], [X(17), X(40)], [X(45), X(50)], [X(70), X(118)]]) rail(a, b, za);              // north edge (gap for the emergency stairs)
    for (const [a, b] of [[X(2), X(40)], [X(45), X(50)], [X(70), X(108)]]) rail(a, b, zb - 2);                          // south edge (stops at the tower)
    // broken ends of the collapsed span, debris below
    ctx.brush([X(40), DY - 60, za], [X(41), DY - 8, zb], { tex: 'steelbeam' }); ctx.brush([X(44), DY - 60, za], [X(45), DY - 8, zb], { tex: 'steelbeam' });
    ctx.brush([X(40), 0, Z(43)], [X(45), 80, Z(49)], { tex: 'rubble', top: 'rubble' }); ctx.props.pipe(X(40), DY - 16, Z(44), X(43), 70, Z(46), 6, 'steelbeam'); ctx.props.pipe(X(45), DY - 16, Z(48), X(42), 60, Z(47), 6, 'steelbeam');
    // platform canopies
    for (const [a, b] of [[Z(38), Z(42) - 8], [Z(50) + 8, Z(54)]]) { ctx.brush([X(51), 420, a], [X(69), 428, b], { tex: 'metal', top: 'roof', bottom: 'metal' }); for (const x of [X(53), X(60), X(67)]) ctx.brush([x - 4, DY + 16, (a + b) / 2 - 4], [x + 4, 420, (a + b) / 2 + 4], { tex: 'metalgreen' }); }
    ctx.decal({ at: [X(60), 380, Z(38)], n: 'pz', w: 220, h: 40, tex: 'sign_el', fullbright: true }); ctx.decal({ at: [X(60), 380, Z(54)], n: 'nz', w: 220, h: 40, tex: 'sign_el', fullbright: true });
    for (const x of [X(54), X(60), X(66)]) for (const z of [Z(40), Z(52)]) { ctx.props.cageLamp(x, 410, z); ctx.light(x, 395, z, 260, [0.9, 1, 0.85]); }
    for (let c = 7; c < 118; c += 12) { if (c > 36 && c < 48) continue; ctx.props.cageLamp(X(c), DY - 24, Z(46)); ctx.light(X(c), DY - 40, Z(46), 340, [1, 0.62, 0.32]); } // lamps under the el
  });
  for (const [a, b] of [[X(2), X(12)], [X(18), X(40)], [X(45), X(50)], [X(70), X(106)]]) { K.hurt([a, DY, Z(42) + 2], [b, DY + 6, Z(42) + 10], 18); K.hurt([a, DY, Z(50) - 10], [b, DY + 6, Z(50) - 2], 18); } // third rails
  K.props(pr => { for (const z of [Z(42) + 6, Z(50) - 6]) for (const [a, b] of [[X(2), X(40)], [X(45), X(118)]]) pr.box((a + b) / 2, DY, z, b - a, 5, 5, 'lightamber'); });
  // station stairs from both sidewalks
  K.stairBrush(X(52), Z(54), X(72), Z(56), 8, DY + 16, 'W', 'steelbeam', 'stepside'); K.stairBrush(X(48), Z(36), X(68), Z(38), 8, DY + 16, 'E', 'steelbeam', 'stepside');
  K.post(ctx => { ctx.brush([X(52), 8, Z(56) - 2], [X(72), 340, Z(56)], { invisible: true, noshadow: true }); ctx.brush([X(48), 8, Z(36)], [X(68), 340, Z(36) + 2], { invisible: true, noshadow: true }); });
  K.msg([X(68), 0, Z(53)], [X(76), 120, Z(56)], 'The el is dead. Signals out, trains stopped.\nThe signal tower is at the east end of the line.');

  // ======================= STREET LEVEL =======================
  K.start(114, 46, 90);
  K.msg([X(108), 0, Z(40)], [X(118), 100, Z(52)], 'Under the el. Watch for Qoqs on the tracks above.');
  const NF = [N.face(43, 4, 60, 35, 's'), N.face(61, 4, 84, 35, 's'), N.face(85, 4, 106, 35, 's'), N.face(107, 4, 117, 35, 's'), N.face(2, 4, 9, 35, 's')];
  const SF = [N.face(2, 56, 30, 92, 'n'), N.face(31, 56, 54, 92, 'n'), N.face(55, 56, 72, 92, 'n'), N.face(73, 56, 100, 92, 'n'), N.face(101, 56, 117, 92, 'n')];
  N.shop(NF[0], X(47), 'pizza', { awning: 'R' }); N.shop(NF[0], X(56), 'laundry', { closed: true }); N.shop(NF[1], X(66), 'bodega', { awning: 'G', neon: true }); N.shop(NF[1], X(78), 'pawn', { closed: true });
  N.shop(NF[2], X(90), 'liquor', { neon: true }); N.shop(NF[2], X(100), 'chinese', { awning: 'R' }); N.shop(NF[3], X(112), 'pharmacy', { awning: 'G' });
  N.shop(SF[0], X(8), 'diner', { awning: 'R', neon: true }); N.shop(SF[0], X(20), 'hardware', { closed: true }); N.shop(SF[1], X(36), 'tattoo', {}); N.shop(SF[1], X(48), 'bar', { closed: true });
  N.shop(SF[3], X(78), 'deli', { awning: 'G' }); N.shop(SF[3], X(92), 'cafe', { awning: 'B', neon: true }); N.shop(SF[4], X(106), 'noodle', { awning: 'R' }); N.shop(SF[4], X(114), 'bodega', { closed: true });
  N.decalOn(SF[2], X(63) + 16, 150, 260, 48, 'sign_el', true); N.tag(SF[2], X(58), 44, 'tag_qoq'); N.tag(SF[0], X(26), 40, 'tag_nyc'); N.tag(NF[1], X(72), 44, 'tag_beans'); N.tag(NF[2], X(95), 44, 'tag_pidser');
  for (const [x, z, ry, k] of [[X(110), Z(40), 0.4, 'burnt'], [X(100), Z(51), Math.PI / 2, 'taxi'], [X(86), Z(41), -Math.PI / 2 + 0.2, 'sedan'], [X(76), Z(50), 2.4, 'burnt'], [X(62), Z(40), 1.6, 'cop'], [X(48), Z(51), -1.4, 'taxi'], [X(28), Z(40), 0.7, 'burnt'], [X(8), Z(50), 1.5, 'sedan']]) N.car(x, z, 0, ry, k, { paint: 'carblack' });
  K.brush([X(88), 0, Z(44)], [X(102), 120, Z(47) + 8], { tex: 'busside', top: 'metal', nx: 'carglass', px: 'carglass' }); N.fire(X(95), Z(45) + 16, 120, 40);
  for (const [x, z] of [[X(116), Z(54)], [X(80), Z(37)], [X(54), Z(37)], [X(20), Z(54)], [X(4), Z(37)]]) N.barrelFire(x, z, 8);
  for (const [x, z] of [[X(104), Z(37) + 8], [X(70), Z(54)], [X(40), Z(37) + 8], [X(12), Z(54)]]) N.trash(x, z, 8, 5);
  for (const x of [X(20), X(58), X(84), X(108)]) N.steam(x, Z(41), 0); N.hydrant(X(92), Z(54) + 8, 8); N.hydrant(X(30), Z(37) + 4, 8);
  K.qoqC(104, 44, 90); K.qoqC(96, 50, 90); K.qoqC(86, 46, 90); K.qoqC(74, 42, 90); K.qoqC(66, 49, 90); K.marvC(80, 52, 90);
  K.qoq(X(100), Z(46), 90, { turret: true, y: DY }); K.qoq(X(82), Z(44), 90, { turret: true, y: DY }); K.qoqC(36, 45, 90); K.qoqC(24, 50, 90); K.qoqC(14, 42, 90);
  K.juice(X(117), Z(38)); K.health(X(90), Z(37)); K.juice(X(70), Z(38)); K.health(X(46), Z(54)); K.juice(X(22), Z(37));
  K.slices([[X(110), Z(48)], [X(98), Z(38)], [X(84), Z(53)], [X(72), Z(46)], [X(56), Z(45)], [X(38), Z(50)], [X(18), Z(46)]]);
  // stash behind boards in the station building
  K.paint(57, 56, 60, 58, T(ROOM)); K.breakable([X(57), 8, Z(56) - 2], [X(61), 112, Z(56) + 8], { tex: 'boards', health: 24, secret: true });
  K.item('candybag', X(58), Z(57), { amount: 50 }); K.health(X(60), Z(57)); K.slice(X(59), Z(58)); K.light(X(59), 80, Z(57), 150, [1, 0.6, 0.3], 1);

  // ======================= PLATFORMS, THE STALLED TRAIN, THE SIGNAL TOWER =======================
  K.qoq(X(56), Z(40), 90, { y: DY + 16 }); K.qoq(X(64), Z(52), 90, { y: DY + 16 }); K.qoq(X(60), Z(46), -90, { y: DY }); K.marv(X(68), Z(40), -90, { y: DY + 16 });
  K.juice(X(52), Z(40), DY + 16); K.health(X(69), Z(52), DY + 16); K.slices([[X(58), Z(40)], [X(62), Z(52)], [X(66), Z(40)]], DY + 16);
  K.crates(X(69), Z(39) + 8, DY + 16, 2, 40); K.crates(X(67) + 8, Z(39) + 8, DY + 16, 1, 40); // climb to the canopy
  K.post(ctx => { // three stalled cars on the south track: walk through them
    const za = Z(46) + 2, zb = Z(50) - 14, y0 = DY + 4, y1 = DY + 120;
    for (let k = 0; k < 3; k++) {
      const x0 = X(76) + k * 320, x1 = x0 + 296;
      ctx.brush([x0, DY, za], [x1, y0, zb], { tex: 'metal', top: 'grate' }); ctx.brush([x0, y1, za], [x1, y1 + 8, zb], { tex: 'chrome', top: 'chrome', bottom: 'metal' });
      for (const [g0, g1] of [[x0, x0 + 40], [x0 + 88, x0 + 208], [x0 + 256, x1]]) { ctx.brush([g0, y0, zb - 4], [g1, y1, zb], { tex: 'chrome' }); }
      for (const [g0, g1] of [[x0, x0 + 120], [x0 + 176, x1]]) ctx.brush([g0, y0, za], [g1, y1, za + 4], { tex: 'chrome' });
      for (const xe of [x0, x1 - 4]) { ctx.brush([xe, y0, za], [xe + 4, y1, za + 22], { tex: 'chrome' }); ctx.brush([xe, y0, zb - 22], [xe + 4, y1, zb], { tex: 'chrome' }); ctx.brush([xe, y0 + 90, za], [xe + 4, y1, zb], { tex: 'chrome' }); }
      for (const g of [[x0 + 40, x0 + 88], [x0 + 208, x0 + 256]]) ctx.decal({ at: [(g[0] + g[1]) / 2, y0 + 60, zb], n: 'pz', w: 44, h: 36, tex: 'carglass', off: 0.6 });
      ctx.brush([x0 + 8, y0, za + 4], [x0 + 120, y0 + 18, za + 18], { tex: 'leather' }); ctx.brush([x0 + 176, y0, za + 4], [x1 - 8, y0 + 18, za + 18], { tex: 'leather' });
      ctx.light((x0 + x1) / 2, y1 - 16, (za + zb) / 2, 200, [0.95, 1, 0.85], k === 1 ? 2 : 0); ctx.props.box((x0 + x1) / 2, y1 - 3, (za + zb) / 2, 200, 3, 6, 'glow', { fullbright: true });
    }
    ctx.decal({ at: [X(76) + 20, DY + 100, Z(48) - 6], n: 'nx', w: 40, h: 24, tex: 'taxisign', fullbright: true, off: 4 });
  });
  K.qoq(X(80), Z(48), 90, { y: DY + 4 }); K.qoq(X(90), Z(48), 90, { y: DY + 4 }); K.marv(X(100), Z(48), 90, { y: DY + 4 }); K.qoq(X(84), Z(44), 90, { y: DY });
  K.juice(X(88), Z(48), DY + 4); K.slices([[X(82), Z(48)], [X(96), Z(48)], [X(104), Z(48)]], DY + 4);
  // the train roof stash (from the canopy)
  K.secret([X(98), DY + 120, Z(46)], [X(104), DY + 220, Z(50)]); K.health(X(100), Z(48) - 10, DY + 128); K.item('sausages', X(102), Z(48) - 10, { amount: 12, y: DY + 128 });
  // signal tower: brick hut on the deck at the east end
  K.post(ctx => {
    const x0 = X(108), x1 = X(118), z0 = Z(50), z1 = Z(56), y0 = DY, y1 = DY + 150;
    ctx.brush([x0, y0, z1 - 8], [x1, y1, z1], { tex: 'brickdark' }); ctx.brush([x1 - 8, y0, z0], [x1, y1, z1], { tex: 'brickdark' });
    ctx.brush([x0, y0, z0], [x0 + 8, y1, z0 + 40], { tex: 'brickdark' }); ctx.brush([x0, y0, z0 + 104], [x0 + 8, y1, z1], { tex: 'brickdark' }); ctx.brush([x0, y0 + 110, z0], [x0 + 8, y1, z1], { tex: 'brickdark' });
    ctx.brush([x0, y0, z0], [X(111), y1, z0 + 4], { tex: 'brickdark' }); ctx.brush([X(114), y0, z0], [x1, y1, z0 + 4], { tex: 'brickdark' }); ctx.brush([X(111), y0 + 110, z0], [X(114), y1, z0 + 4], { tex: 'brickdark' });
    ctx.brush([x0, y1, z0], [x1, y1 + 10, z1], { tex: 'roof', top: 'roof', bottom: 'ceil' });
    ctx.decal({ at: [x0 - 1, y0 + 130, (z0 + z1) / 2], n: 'nx', w: 120, h: 18, tex: 'sign_el', fullbright: true, off: 1 });
  });
  K.brush([X(113), DY, Z(54)], [X(117) - 8, DY + 40, Z(55) + 16], { tex: 'jaildark', nz: 'drawer', top: 'metal' }); K.decal({ at: [X(115), DY + 64, Z(55) + 10], n: 'nz', w: 90, h: 30, tex: 'monitors', fullbright: true });
  K.key('red', X(110) + 16, Z(53) + 16, DY); K.light(X(112), DY + 110, Z(53), 240, [1, 0.3, 0.25], 3); K.light(X(112), DY + 100, Z(52), 200, [1, 0.8, 0.5]);
  K.qoq(X(112), Z(54), 0, { y: DY }); K.juice(X(116), Z(51), DY); K.slice(X(110), Z(55), DY);
  K.wave('redkey', { onKey: 'red', msg: 'The signals flicker... and the Qoqs swarm up the tracks!' });
  for (const [x, z] of [[X(96), Z(44)], [X(88), Z(44)], [X(106), Z(46)], [X(74), Z(44)], [X(72), Z(48)]]) K.qoq(x, z, -90, { wave: 'redkey', y: DY });

  // ======================= JUNKYARD (red gate) & AUTO SHOP (blue key) =======================
  K.post(ctx => {
    ctx.brush([X(10), 0, Z(36) - 6], [X(24), 150, Z(36)], { tex: 'bars', noshadow: true }); ctx.brush([X(29), 0, Z(36) - 6], [X(43), 150, Z(36)], { tex: 'bars', noshadow: true });
    ctx.mover({ type: 'door', min: [X(24), 0, Z(36) - 6], max: [X(29), 150, Z(36)], key: 'red', tex: 'door_red', name: 'junkgate', wait: -1, lip: 8, speed: 110 });
    ctx.decal({ at: [X(26) + 16, 170, Z(36)], n: 'pz', w: 200, h: 36, tex: 'shop_hardware', fullbright: true, off: 1 });
  });
  K.msg([X(20), 0, Z(36)], [X(34), 120, Z(40)], "VINNY'S SALVAGE. Locked. The RED keycard opens the gate.");
  for (const [x, z, y, ry, k] of [[X(30), Z(24), 0, 0.3, 'burnt'], [X(30), Z(24), 42, 0.1, 'sedan'], [X(38), Z(20), 0, 1.4, 'burnt'], [X(36), Z(30), 0, 2.7, 'taxi'], [X(36), Z(30), 42, 2.9, 'burnt'], [X(28), Z(13), 0, 1.6, 'cop']]) N.car(x, z, y, ry, k, { lights: false, fire: y === 0 && k === 'burnt' });
  for (const [x, z] of [[X(40), Z(11)], [X(26), Z(32)], [X(14), Z(30)]]) K.props((pr, ctx) => { for (let i = 0; i < 5; i++) pr.cylinder(x, i * 9, z, 16, 9, 'tire', { segs: 12 }); ctx.brush([x - 16, 0, z - 16], [x + 16, 45, z + 16], { invisible: true, noshadow: true }); });
  K.brush([X(12), 0, Z(22)], [X(20), 100, Z(26)], { tex: 'rustpanel', top: 'rust' }); K.brush([X(12), 0, Z(28)], [X(20), 100, Z(32)], { tex: 'rustpanel', top: 'rust' }); // containers
  K.paint(12, 26, 19, 27, T(N.sky(0, 'dirt', 'concrete')));
  K.props(pr => { pr.cylinder(X(40), 0, Z(30), 10, 380, 'steelbeam', { segs: 6 }); pr.pipe(X(40), 380, Z(30), X(30), 360, Z(22), 4, 'steelbeam'); pr.cylinder(X(30), 300, Z(22), 22, 14, 'metal', { segs: 12 }); });
  K.lamp(X(22), 140, Z(20), 240); K.lamp(X(38), 140, Z(26), 240); N.barrelFire(X(26), Z(18), 0);
  K.qoqC(22, 24, 180); K.qoqC(34, 16, 180); K.qoqC(40, 34, 180); K.marvC(16, 34, 180); K.qoq(X(16), Z(24), 180, { turret: true, y: 100 });
  K.juice(X(41), Z(9)); K.health(X(11), Z(34)); K.slices([[X(24), Z(28)], [X(34), Z(22)], [X(40), Z(16)]]);
  // container secret: the boards on the middle container
  K.breakable([X(12), 0, Z(26)], [X(14), 100, Z(28)], { tex: 'boards', health: 24, secret: true });
  K.health(X(16), Z(26) + 16); K.item('turdbox', X(18), Z(26) + 16, { amount: 4 }); K.slice(X(15), Z(27)); K.light(X(16), 60, Z(27), 120, [1, 0.6, 0.3], 1);
  K.brush([X(20), 0, Z(26)], [X(20) + 8, 100, Z(28)], { tex: 'rustpanel', top: 'rust' });
  // auto shop: roll-up door, a car lift up to the parts mezzanine
  K.door(16, 19, 20, 19, SHOP, { top: 120, tex: 'rustpanel' });
  N.decalOn(N.face(12, 10, 24, 18, 's'), X(18) + 16, 150, 200, 40, 'shop_hardware', true);
  K.catwalk(X(12), Z(10), X(25), Z(12) + 16, 128, { rails: 's', gaps: [['s', X(20), X(23)], ['s', X(12), X(14)]], tex: 'grate' });
  K.stairBrush(X(12), Z(12) + 16, X(14), Z(18), 0, 128, 'N', 'steelbeam', 'grate');
  K.lift([X(20), 0, Z(12) + 16], [X(23), 16, Z(15) + 16], 112, { wait: 3 });
  N.car(X(17), Z(15) + 8, 0, 0, 'sedan', { lights: false });
  K.fixture(X(18), Z(14), 200, 140, 'x', 'light', 300); K.lamp(X(14), 180, Z(11), 160);
  K.key('blue', X(13) + 16, Z(11) + 16, 128); K.qoqC(22, 16, 0); K.qoq(X(16), Z(11), 0, { turret: true, y: 128 });
  K.juice(X(24) - 8, Z(17)); K.slice(X(14), Z(17));
  K.wave('bluekey', { onKey: 'blue', msg: 'Engines roar in the yard... the Qoqs are coming in!' });
  for (const [c, r] of [[26, 22], [34, 26], [24, 32], [38, 14]]) K.qoqC(c, r, 0, { wave: 'bluekey' });

  // ======================= EMERGENCY STAIRS, THE WEST END & THE BLUE SIGNAL GATE =======================
  K.stairBrush(X(14), Z(39), X(33), Z(42), 0, DY, 'W', 'steelbeam', 'grate');
  K.post(ctx => {
    ctx.mover({ type: 'door', min: [X(12), DY, Z(42) + 2], max: [X(12) + 12, DY + 140, Z(50) - 2], key: 'blue', tex: 'door_blue', name: 'signalgate', wait: -1, lip: 8, speed: 110 });
    ctx.light(X(13), DY + 150, Z(46), 220, [0.3, 0.5, 1]);
  });
  K.msg([X(13), DY, Z(42)], [X(18), DY + 120, Z(50)], 'Signal gate. It needs the BLUE keycard.');
  K.qoq(X(24), Z(46), 90, { y: DY }); K.qoq(X(32), Z(44), 90, { y: DY }); K.marv(X(36), Z(48), 90, { y: DY });
  K.juice(X(20), Z(44), DY); K.health(X(28), Z(48), DY); K.slices([[X(22), Z(48)], [X(30), Z(44)]], DY);
  K.wave('westend', { min: [X(2), DY, Z(42)], max: [X(12), DY + 120, Z(50)], msg: 'The last train out... if you can reach it!' });
  for (const [x, z] of [[X(5), Z(44)], [X(8), Z(48)], [X(4), Z(48)]]) K.qoq(x, z, -90, { wave: 'westend', y: DY });
  K.exit(X(2), DY, Z(46), 'px');

  // bot route: up to the platform, through the train to the tower (red), back down, junkyard, lift (blue), the west end
  K.goal(X(80), Z(55) - 16); K.goal(X(60), Z(52), DY + 16); K.goal(X(72), Z(44), DY); K.goal(X(108), Z(44), DY); K.goal(X(110) + 16, Z(53) + 16, DY);
  K.goal(X(66), Z(52), DY + 16); K.goal(X(74), Z(55) - 8); K.goal(X(26) + 16, Z(38)); K.goal(X(18), Z(21) - 8); K.goal(X(21) + 16, Z(14), 16, { wait: 5 }); K.goal(X(13) + 16, Z(11) + 16, 128);
  K.goal(X(26) + 16, Z(37)); K.goal(X(12), Z(40)); K.goal(X(30), Z(44), DY); K.goal(X(16), Z(46), DY);
});
