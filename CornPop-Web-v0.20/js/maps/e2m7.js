// E2M7 — BROOKLYN BRIDGE. The bridge in a gale, 500 units above a black river: two roadways and the raised wooden
// promenade between them, two granite towers with roads running through their arches, the cables and the stays.
// The red key is in the vaults of the Manhattan anchorage and opens the promenade gate in the first tower. Mid-span
// the roadways have fallen into the river; only the damaged walkway goes on. The blue key is on top of the second tower,
// up the cable catwalk in the storm; it opens the tower's passage to the Brooklyn side, DUMBO and the way out.
import { makeLevel } from '../kit.js';
import { nyc, NYC_STYLES } from '../nyc.js';

export default makeLevel({
  name: 'E2M7', title: 'E2M7: BROOKLYN BRIDGE', ambience: 'street', ambient: 22, ambientColor: [0.56, 0.64, 1.0], music: 'assets/music/rotted_circuitry.mp3', city: true,
  fog: { color: [0.035, 0.04, 0.05], density: 0.0006 }, skyTint: [0.32, 0.34, 0.5],
  rain: { density: 1500, wind: [140, 40], loud: 1.2 }, storm: { every: [3, 8], power: 1.2 }, styles: NYC_STYLES,
}, 128, 72, 'sky', K => {
  const { X, Z, C } = K; const T = s => K.type(s); const N = nyc(K, { sky: 1600 });
  const ROAD = N.ROAD(0), PROM = N.sky(64, 'boards', 'steelbeam'), RIVER = N.sky(-500, 'concretedark', 'granite');
  const ARCH = { f: 0, c: 300, floor: 'road', ceil: 'granite', side: 'curb', upper: 'granite', roof: 520, roofTex: 'jailfloor', roofSky: 1600 };
  const PASS = { f: 64, c: 240, floor: 'boards', ceil: 'granite', side: 'granite', upper: 'granite', roof: 520, roofTex: 'jailfloor', roofSky: 1600 };
  const VAULTS = { f: 8, c: 150, floor: 'jailfloor', ceil: 'granite', side: 'granite', upper: 'granite', roof: 220, roofTex: 'granite', roofSky: 1600 };
  const WARE = { f: 8, c: 200, floor: 'concretedark', ceil: 'steeldark', side: 'brickdark', upper: 'tenement', roof: 300, roofSky: 1600 };
  const T1 = 44, T2 = 88; // tower columns (each 9 wide)

  // ======================= THE RIVER AND THE DECK =======================
  K.pool(26, 2, 113, 19, RIVER, 'water', 100, 400); K.pool(26, 48, 113, 69, RIVER, 'water', 100, 400);
  K.paint(26, 20, 113, 29, T(ROAD)); K.paint(26, 38, 113, 47, T(ROAD)); K.paint(26, 30, 113, 37, T(PROM));
  K.pool(64, 20, 70, 29, RIVER, 'water', 100, 400); K.pool(64, 38, 70, 47, RIVER, 'water', 100, 400); K.pool(64, 30, 70, 37, RIVER, 'water', 100, 400); // the collapse
  for (const t of [T1, T2]) { // towers: piers in the river, arches over the roadways, a passage for the promenade
    N.building(t, 16, t + 8, 19, 520, 'granite', { parapet: 'nwe', tower: false, bulk: false, ac: 0 }); N.building(t, 48, t + 8, 51, 520, 'granite', { parapet: 'swe', tower: false, bulk: false, ac: 0 });
    N.building(t, 30, t + 8, 31, 520, 'granite', { parapet: false, tower: false, bulk: false, ac: 0 }); N.building(t, 36, t + 8, 37, 520, 'granite', { parapet: false, tower: false, bulk: false, ac: 0 });
    K.paint(t, 20, t + 8, 29, T(ARCH)); K.paint(t, 38, t + 8, 47, T(ARCH)); K.paint(t, 32, t + 8, 35, T(PASS));
    for (const [z0, z1] of [[Z(20), Z(30)], [Z(38), Z(48)]]) { K.arch(X(t), z0, X(t) + 16, z1, 190, 300, 'granite', 'granite'); K.arch(X(t + 9) - 16, z0, X(t + 9), z1, 190, 300, 'granite', 'granite'); }
    K.arch(X(t), Z(32), X(t) + 12, Z(36), 190, 240, 'granite', 'granite'); K.arch(X(t + 9) - 12, Z(32), X(t + 9), Z(36), 190, 240, 'granite', 'granite');
    K.post(ctx => { // crenellations and the gothic window slots on the tower faces
      for (let x = X(t); x < X(t + 9); x += 48) for (const z of [Z(16), Z(52) - 10]) ctx.brush([x, 520, z], [x + 24, 548, z + 10], { tex: 'granite' });
      for (const [fx, n] of [[X(t) - 0.5, 'nx'], [X(t + 9) + 0.5, 'px']]) for (const z of [Z(25), Z(43)]) ctx.decal({ at: [fx, 400, z], n, w: 60, h: 120, tex: 'carblack', off: 0.8 });
      for (const [fx, d] of [[X(t) - 60, -1], [X(t + 9) + 60, 1]]) for (const z of [Z(24), Z(44)]) ctx.light(fx, 60, z, 520, [1, 0.8, 0.55]); // floodlights on the stone
    });
  }
  // girders along the outer road edges, railings along the promenade
  K.post(ctx => {
    for (const [a, b] of [[X(26), X(T1)], [X(T1 + 9), X(64)], [X(71), X(T2)], [X(T2 + 9), X(114)]]) {
      ctx.brush([a, 0, Z(20)], [b, 76, Z(20) + 8], { tex: 'steelbeam' }); ctx.brush([a, 0, Z(48) - 8], [b, 76, Z(48)], { tex: 'steelbeam' });
      ctx.brush([a, 64, Z(30)], [b, 124, Z(30) + 3], { tex: 'railing', fit: true, noshadow: true }); ctx.brush([a, 64, Z(38) - 3], [b, 124, Z(38)], { tex: 'railing', fit: true, noshadow: true });
      for (let x = a + 40; x < b - 20; x += 192) for (const z of [Z(30) + 6, Z(38) - 6]) { ctx.props.cylinder(x, 64, z, 2.5, 120, 'metalgreen', { segs: 8 }); ctx.props.sphere(x, 190, z, 8, 'glow', { fullbright: true, segs: 8, rings: 6 }); ctx.light(x, 180, z, 300, [1, 0.7, 0.42]); }
    }
    // the broken ends of the roadways and the damaged walkway across the gap
    for (const x of [X(64), X(71) - 6]) for (const [z0, z1] of [[Z(20), Z(30)], [Z(38), Z(48)]]) ctx.brush([x, -60, z0], [x + 6, 0, z1], { tex: 'steelbeam' });
    ctx.brush([X(64), 56, Z(32)], [X(67), 64, Z(36)], { tex: 'boards', top: 'boards' }); ctx.brush([X(67) + 16, 50, Z(33)], [X(71), 58, Z(36)], { tex: 'boards', top: 'boards' }); ctx.brush([X(67), 52, Z(34)], [X(67) + 16, 60, Z(35)], { tex: 'boards', top: 'boards' });
    ctx.props.pipe(X(64), 60, Z(33), X(68), -200, Z(31), 4, 'steelbeam'); ctx.props.pipe(X(70), 0, Z(44), X(67), -300, Z(46), 5, 'steelbeam'); ctx.props.pipe(X(64), 0, Z(22), X(66), -260, Z(26), 5, 'steelbeam');
    // cables: towers to midspan and to the anchorages, vertical suspenders, the diagonal stays
    const cab = (x0, y0, x1, y1, sag, z) => { const n = 14; let px = x0, py = y0; for (let i = 1; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * sag; ctx.props.pipe(px, py, z, x, y, z, 4, 'carblack'); if (i < n && i % 2 === 0) ctx.props.pipe(x, y, z, x, 64, z, 0.8, 'metal'); px = x; py = y; } };
    for (const z of [Z(30) + 2, Z(38) - 2, Z(20) + 4, Z(48) - 4]) { cab(X(T1 + 4), 560, X(T2 + 4), 560, 470, z); cab(X(14), 120, X(T1 + 4), 560, 60, z); cab(X(T2 + 4), 560, X(120), 120, 60, z); }
    for (const t of [T1, T2]) for (const s of [-1, 1]) for (let k = 1; k <= 5; k++) for (const z of [Z(30) + 2, Z(38) - 2]) ctx.props.pipe(X(t + 4), 500, z, X(t + 4) + s * k * 96, 70, z, 1.2, 'metal');
  });

  // ======================= MANHATTAN: PARK ROW & THE ANCHORAGE (red key) =======================
  N.street(6, 2, 17, 69, 'z', { lampEvery: 9, cross: [19, 48] });         // Park Row
  K.paint(18, 20, 25, 29, T(ROAD)); K.paint(18, 38, 25, 47, T(ROAD));   // bridge approaches
  K.stairs(22, 30, 25, 37, 'E', 16, 64, { floor: 'boards', ceil: 'sky', side: 'steelbeam', upper: 'steelbeam', sky: true, c: 1600 });
  K.paint(18, 30, 21, 37, T(N.sky(8, 'sidewalk', 'curb')));
  N.building(2, 2, 5, 69, 600, 'limestone', { parapet: false, tower: false, bulk: false, ac: 0 });
  N.building(18, 2, 25, 19, 220, 'granite', { tower: false, bulk: false, ac: 0 }); N.building(18, 48, 25, 69, 220, 'granite', { tower: false, bulk: false, ac: 0 });
  N.streetSign(X(17) + 12, Z(30) - 12, 8, 'st_parkrow', 'sign_bridge'); K.sign(X(22), 220, Z(30), 'nz', 'sign_bridge', 220, 56);
  K.start(10, 34, -90);
  K.msg([X(6), 0, Z(28)], [X(18), 120, Z(40)], 'The Brooklyn Bridge. Hold onto your hat.');
  N.car(X(10), Z(12), 0, 0.1, 'taxi'); N.car(X(13), Z(56), 0, Math.PI + 0.2, 'burnt'); N.car(X(20), Z(24), 0, -Math.PI / 2 + 0.2, 'cop'); N.car(X(22), Z(43), 0, -Math.PI / 2, 'burnt', { fireSize: 38 });
  N.barrelFire(X(7), Z(40), 8); N.trash(X(16), Z(20), 8, 5); N.steam(X(11), Z(26), 0); N.steam(X(11), Z(60), 0);
  K.qoqC(12, 20, 90); K.qoqC(14, 46, 90); K.qoqC(10, 60, 0); K.qoqC(20, 33, -90); K.qoqC(23, 26, -90); K.qoqC(23, 44, -90);
  K.juice(X(7), Z(4)); K.health(X(16), Z(66)); K.slices([[X(10), Z(30)], [X(12), Z(40)], [X(8), Z(16)], [X(14), Z(52)]]);
  // the anchorage vaults (door on Park Row), red key in the back vault
  K.paint(19, 4, 24, 17, T(VAULTS)); K.door(18, 9, 18, 12, VAULTS, { top: 112, tex: 'wood' });
  K.wall(19, 10, 22, 10, 'granite'); K.wall(19, 13, 22, 13, 'granite');
  for (const [c, r] of [[20, 6], [23, 6], [20, 15], [23, 15]]) K.crates(C(c), C(r), 8, 2, 36);
  for (const [x, z] of [[X(21), Z(8)], [X(21), Z(15)], [X(23) + 16, Z(11)]]) K.lamp(x, 120, z, 200);
  K.key('red', X(23) + 16, Z(4) + 16); K.qoqC(20, 8, 90); K.qoqC(23, 14, 90); K.marvC(22, 5, 90);
  K.wave('redkey', { onKey: 'red', msg: 'Footsteps in the vaults... behind you!' });
  for (const [c, r] of [[20, 16], [23, 11], [19, 5], [24, 16]]) K.qoqC(c, r, 0, { wave: 'redkey' });
  K.juice(X(19), Z(16)); K.slice(X(24), Z(9));
  K.paint(19, 50, 24, 54, T(VAULTS)); K.breakable([X(19), 8, Z(48)], [X(23), 140, Z(50)], { tex: 'boards', health: 24, secret: true });
  K.paint(19, 48, 22, 49, T(VAULTS)); K.item('candybag', X(20), Z(52), { amount: 50 }); K.item('turdbox', X(23), Z(52), { amount: 4 }); K.health(X(21), Z(54)); K.light(X(21), 80, Z(52), 150, [1, 0.6, 0.3], 1);

  // ======================= WEST SPAN: ROADWAYS, PROMENADE, TOWER ONE (red gate) =======================
  for (const [x, z, ry, k] of [[X(30), Z(24), -Math.PI / 2 + 0.1, 'taxi'], [X(36), Z(27), -Math.PI / 2 - 0.2, 'burnt'], [X(40), Z(42), Math.PI / 2, 'sedan'], [X(56), Z(23), -1.4, 'taxi'], [X(60), Z(44), 1.8, 'burnt'], [X(33), Z(45), 1.5, 'cop']]) N.car(x, z, 0, ry, k, { paint: 'carblack' });
  K.brush([X(54), 0, Z(40) + 8], [X(58), 120, Z(46)], { tex: 'busside', top: 'metal', nx: 'carglass', px: 'carglass' }); N.fire(X(56), Z(43), 120, 44);
  K.qoqC(32, 26, -90); K.qoqC(38, 42, -90); K.qoqC(42, 24, -90); K.qoqC(58, 26, -90); K.qoqC(62, 42, -90); K.marvC(50, 44, -90);
  K.qoq(X(30), Z(34), -90, { y: 64 }); K.qoq(X(38), Z(32), -90, { y: 64 }); K.qoq(X(42), Z(36), -90, { y: 64, turret: true });
  K.juice(X(34), Z(22)); K.health(X(62), Z(46)); K.juice(X(28), Z(36), 64); K.slices([[X(30), Z(26)], [X(40), Z(26)], [X(46), Z(24)], [X(48), Z(42)], [X(34), Z(33), 64], [X(40), Z(35), 64]]);
  K.post(ctx => ctx.mover({ type: 'door', min: [X(T1) + 8, 64, Z(32)], max: [X(T1) + 20, 240, Z(36)], key: 'red', tex: 'door_red', name: 'promgate', wait: -1, lip: 8, speed: 110 }));
  K.msg([X(T1) - 120, 64, Z(31)], [X(T1), 200, Z(37)], 'The promenade gate in the tower is locked. RED keycard.');

  // ======================= MIDSPAN: THE COLLAPSE, THE CABLE CATWALK & TOWER TWO (blue key) =======================
  K.qoq(X(56), Z(34), -90, { y: 64 }); K.qoq(X(60), Z(36), -90, { y: 64 }); K.marv(X(74), Z(34), -90, { y: 64 }); K.qoq(X(80), Z(36), -90, { y: 64 }); K.qoq(X(84), Z(34), -90, { y: 64, turret: true });
  K.juice(X(58), Z(36), 64); K.health(X(76), Z(36), 64); K.slices([[X(56), Z(36)], [X(72), Z(35)], [X(80), Z(34)]], 64);
  K.stairBrush(X(58), Z(30), X(T2), Z(32), 64, 520, 'E', 'steelbeam', 'grate');
  K.msg([X(56), 64, Z(30)], [X(60), 160, Z(33)], 'The cable catwalk climbs to the top of the Brooklyn tower.');
  K.key('blue', X(T2 + 4) + 16, Z(33) + 16, 520);
  K.qoq(X(T2 + 6), Z(24), 180, { y: 520 }); K.qoq(X(T2 + 2), Z(42), 0, { y: 520 }); K.health(X(T2 + 7), Z(34), 520); K.slices([[X(T2 + 2), Z(28)], [X(T2 + 6), Z(40)]], 520);
  K.wave('bluekey', { onKey: 'blue', msg: 'Lightning cracks over the tower... and the storm brings ghosts!' });
  for (const [c, r, y] of [[T2 + 1, 22, 520], [T2 + 7, 46, 520], [80, 33, 64], [76, 36, 64], [T2 + 4, 26, 520]]) K.qoq(C(c), C(r), 0, { wave: 'bluekey', y });
  K.post(ctx => { // the roadways under tower two are blocked by a pile-up
    for (const [z0, z1] of [[Z(20) + 8, Z(30)], [Z(38), Z(48) - 8]]) ctx.brush([X(T2) - 64, 0, z0], [X(T2) + 16, 200, z1], { tex: 'rubble', top: 'rubble' });
    ctx.mover({ type: 'door', min: [X(T2) + 8, 64, Z(32)], max: [X(T2) + 20, 240, Z(36)], key: 'blue', tex: 'door_blue', name: 'brooklyngate', wait: -1, lip: 8, speed: 110 });
  });
  N.car(X(T2) - 100, Z(25), 200, 0.6, 'burnt', { fireSize: 40 }); N.car(X(T2) - 110, Z(43), 200, 2.1, 'burnt', { fireSize: 36 });
  K.qoqC(76, 24, -90); K.qoqC(80, 44, -90); K.juice(X(74), Z(26)); K.slice(X(82), Z(42));
  K.msg([X(T2) - 100, 64, Z(31)], [X(T2), 200, Z(37)], 'The Brooklyn tower gate needs the BLUE keycard.');

  // ======================= EAST SPAN & DUMBO (exit) =======================
  K.qoq(X(100), Z(34), 90, { y: 64 }); K.qoq(X(106), Z(36), 90, { y: 64 }); K.marvC(102, 25, 90); K.qoqC(108, 44, 90); K.qoqC(100, 42, 90);
  K.juice(X(104), Z(33), 64); K.health(X(110), Z(26)); K.slices([[X(100), Z(36)], [X(108), Z(34)]], 64);
  for (const [x, z, ry, k] of [[X(100), Z(22), 1.4, 'taxi'], [X(108), Z(45), -1.7, 'sedan'], [X(104), Z(40), 2.6, 'burnt']]) N.car(x, z, 0, ry, k);
  K.stairs(110, 30, 113, 37, 'W', 16, 64, { floor: 'boards', ceil: 'sky', side: 'steelbeam', upper: 'steelbeam', sky: true, c: 1600 });
  N.plaza(114, 2, 125, 69, 8, 'granite', 'curb');
  N.building(122, 2, 125, 69, 340, 'tenement', { parapet: false, tower: false, bulk: false, ac: 0 });
  N.building(114, 2, 121, 17, 300, 'brickdark', { tower: false }); N.building(114, 50, 121, 69, 300, 'tenementdark', { tower: false });
  const DB = N.face(114, 2, 121, 17, 's'), DS = N.face(114, 50, 121, 69, 'n');
  N.shop(DB, X(117), 'pizza', { awning: 'R', neon: true }); N.shop(DS, X(116), 'cafe', { awning: 'G' }); N.tag(DS, X(120), 40, 'tag_cornpop'); N.billboard(N.face(122, 2, 125, 69, 'w'), Z(34), 260, 'bb_pizza', 300, 150, [1, 0.6, 0.3]);
  N.barrelFire(X(116), Z(22), 8); N.trash(X(120), Z(46), 8, 5); for (const r of [24, 40]) N.lamp(X(120), Z(r), 8, 'nx');
  // the warehouse: in through the loading door, out through the portal
  K.paint(115, 51, 120, 66, T(WARE)); K.door(116, 50, 119, 50, WARE, { top: 120, tex: 'rustpanel' });
  for (const [c, r, n] of [[116, 56, 2], [119, 60, 1], [116, 64, 3]]) K.crates(C(c), C(r), 8, n, 40); K.fixture(X(118), Z(58), 200, 120, 'z', 'light', 300);
  K.wave('dumbo', { min: [X(114), 8, Z(44)], max: [X(122), 120, Z(50)], msg: 'Brooklyn! Almost there...' });
  for (const [c, r] of [[115, 60], [120, 54], [118, 64], [116, 42]]) K.qoqC(c, r, 0, { wave: 'dumbo' });
  K.juice(X(120), Z(52)); K.health(X(115), Z(64)); K.slices([[X(118), Z(53)], [X(117), Z(61)]]);
  K.exit(X(118), 8, Z(67), 'nz');

  // bot route: the anchorage (red), the promenade through tower one, the cable catwalk (blue), tower two's gate, DUMBO
  K.goal(X(16), Z(11)); K.goal(X(21), Z(11) + 16); K.goal(X(23) + 16, Z(4) + 16); K.goal(X(16), Z(11)); K.goal(X(20), Z(34)); K.goal(X(27), Z(34), 64);
  K.goal(X(T1 + 4), Z(34), 64); K.goal(X(58), Z(34), 64); K.goal(X(60), Z(31), 80); K.goal(X(T2 + 4) + 16, Z(33) + 16, 520);
  K.goal(X(60), Z(34), 64); K.goal(X(80), Z(34), 64); K.goal(X(T2 + 4), Z(34), 64); K.goal(X(112), Z(34), 30); K.goal(X(118), Z(46));
});
