// New York kit for Episode 2 (The Rotten Apple): streets with sidewalks and lane markings, buildings whose
// rooftops are real walkable floors (so the skyline steps up and down), storefronts, fire escapes, cars,
// street furniture, fires and park pieces. Built on the level kit (js/kit.js): N = nyc(K, { sky, f }).
export const NYC_STYLES = [ // light style slots shared by the E2 maps: 1 fire, 2 neon buzz, 3 siren red, 4 siren blue
  { color: [1, 0.55, 0.2], pattern: 'flicker' }, { color: [1, 0.3, 0.7], pattern: 'neon' },
  { color: [1, 0.1, 0.05], pattern: 'mamamamaaaaaaaaaaaaa' }, { color: [0.15, 0.3, 1], pattern: 'aaaaaaaaaamamamamaaa' }];

export function nyc(K, o = {}) {
  const { X, Z, C } = K; const SKY = o.sky || 1600; const T = s => K.type(s);
  const N = { SKY };
  const sky = (f, floor, side = 'curb', extra = {}) => ({ f, c: SKY, floor, ceil: 'sky', side, upper: side, sky: true, ...extra });
  N.sky = sky;
  N.ROAD = (f = 0) => sky(f, 'road', 'curb');
  N.WALK = (f = 0) => sky(f + 8, 'sidewalk', 'curb');
  N.road = (c0, r0, c1, r1, f = 0) => K.paint(c0, r0, c1, r1, T(N.ROAD(f)));
  N.walk = (c0, r0, c1, r1, f = 0) => K.paint(c0, r0, c1, r1, T(N.WALK(f)));
  N.plaza = (c0, r0, c1, r1, f = 0, floor = 'sidewalk', side = 'curb') => K.paint(c0, r0, c1, r1, T(sky(f, floor, side)));

  // ---- a street: road with a sidewalk strip on each long side, lane paint, crosswalks and street lamps ----
  // dir 'x': runs along X (rows r0..r1 across), 'z': runs along Z. o: {walk:3, f, lamps:true, lampEvery:8, cross:[a,...] (cell index along), noWalk:'n'|'s'|'e'|'w'}
  N.street = (c0, r0, c1, r1, dir, so = {}) => {
    const f = so.f || 0, w = so.walk ?? 3;
    N.road(c0, r0, c1, r1, f);
    if (dir === 'x') {
      if (!(so.noWalk || '').includes('n')) N.walk(c0, r0, c1, r0 + w - 1, f);
      if (!(so.noWalk || '').includes('s')) N.walk(c0, r1 - w + 1, c1, r1, f);
      const zc = (Z(r0 + w) + Z(r1 - w + 1)) / 2; const lanes = r1 - r0 + 1 - 2 * w;
      N.lanePaint(X(c0), X(c1 + 1), zc, 'x', lanes, so.cross || [], f, Z(r0 + w), Z(r1 - w + 1), so);
      if (so.lamps !== false) for (let c = c0 + 3; c <= c1 - 2; c += so.lampEvery || 9) { N.lamp(X(c), Z(r0 + w) - 10, f + 8, 'pz'); N.lamp(X(c + 4), Z(r1 - w + 1) + 10, f + 8, 'nz'); }
    } else {
      if (!(so.noWalk || '').includes('w')) N.walk(c0, r0, c0 + w - 1, r1, f);
      if (!(so.noWalk || '').includes('e')) N.walk(c1 - w + 1, r0, c1, r1, f);
      const xc = (X(c0 + w) + X(c1 - w + 1)) / 2; const lanes = c1 - c0 + 1 - 2 * w;
      N.lanePaint(Z(r0), Z(r1 + 1), xc, 'z', lanes, so.cross || [], f, X(c0 + w), X(c1 - w + 1), so);
      if (so.lamps !== false) for (let r = r0 + 3; r <= r1 - 2; r += so.lampEvery || 9) { N.lamp(X(c0 + w) - 10, Z(r), f + 8, 'px'); N.lamp(X(c1 - w + 1) + 10, Z(r + 4), f + 8, 'nx'); }
    }
  };
  // centre line (double yellow) + white lane dashes + crosswalk bands; a0..a1 along the street, m = centre across, e0/e1 = road edges
  N.lanePaint = (a0, a1, m, dir, lanes, cross, f, e0, e1, so = {}) => K.post(ctx => {
    const y = f + 0.4; const at = (a, b) => dir === 'x' ? [a, y, b] : [b, y, a];
    const inCross = a => cross.some(cc => Math.abs(a - (dir === 'x' ? X(cc) : Z(cc))) < 80);
    for (let a = a0; a < a1 - 1; a += 64) {
      if (inCross(a + 32)) continue;
      if (so.center !== false && lanes >= 3) ctx.decal({ at: at(a + 32, m), n: 'up', w: dir === 'x' ? 64 : 16, h: dir === 'x' ? 16 : 64, tex: dir === 'x' ? 'laneY' : 'laneYv', off: 0.4 });
      if (lanes >= 6) for (const q of [-1, 1]) ctx.decal({ at: at(a + 32, m + q * (e1 - e0) / 4), n: 'up', w: dir === 'x' ? 64 : 16, h: dir === 'x' ? 16 : 64, tex: dir === 'x' ? 'laneW' : 'laneWv', off: 0.4 });
    }
    for (const cc of cross) { const a = dir === 'x' ? X(cc) : Z(cc);
      for (let b = e0; b < e1 - 1; b += 64) { const wB = Math.min(64, e1 - b); ctx.decal({ at: at(a, b + wB / 2), n: 'up', w: dir === 'x' ? 96 : wB, h: dir === 'x' ? wB : 96, tex: dir === 'x' ? 'crosswalkH' : 'crosswalk', off: 0.4 }); } }
  });

  // ---- buildings: a block whose roof is a floor at height h (so the facade is the wall between street and roof) ----
  // o: {roof, parapet:'nsew'|false, tower:[x,z], bulk:[x,z], ac:n, upper, floor}
  N.building = (c0, r0, c1, r1, h, facade, bo = {}) => {
    K.paint(c0, r0, c1, r1, T(sky(h, bo.floor || 'roof', facade, { upper: bo.upper || facade, inner: bo.inner || 'plaster' })));
    const x0 = X(c0), x1 = X(c1 + 1), z0 = Z(r0), z1 = Z(r1 + 1), p = bo.parapet ?? 'nsew', ph = 18, pt = 8;
    K.post(ctx => {
      if (p) { const gaps = bo.gaps || [];
        const seg = (side, a0, a1, mk) => { let parts = [[a0, a1]]; for (const [s2, g0, g1] of gaps) if (s2 === side) parts = parts.flatMap(([u, v]) => (g1 <= u || g0 >= v) ? [[u, v]] : [[u, g0], [g1, v]].filter(([q, r]) => r - q > 1)); for (const [u, v] of parts) mk(u, v); };
        if (p.includes('n')) seg('n', x0, x1, (u, v) => ctx.brush([u, h, z0], [v, h + ph, z0 + pt], { tex: 'parapet', top: 'parapet' }));
        if (p.includes('s')) seg('s', x0, x1, (u, v) => ctx.brush([u, h, z1 - pt], [v, h + ph, z1], { tex: 'parapet', top: 'parapet' }));
        if (p.includes('w')) seg('w', z0 + pt, z1 - pt, (u, v) => ctx.brush([x0, h, u], [x0 + pt, h + ph, v], { tex: 'parapet', top: 'parapet' }));
        if (p.includes('e')) seg('e', z0 + pt, z1 - pt, (u, v) => ctx.brush([x1 - pt, h, u], [x1, h + ph, v], { tex: 'parapet', top: 'parapet' }));
      }
      // roof clutter so the skyline reads from the street and from other roofs
      let s = (c0 * 31 + r0 * 17 + h) % 97; const rnd = () => (s = (s * 73 + 41) % 997) / 997;
      const w = x1 - x0, d = z1 - z0;
      if (bo.tower !== false && (bo.tower || (w > 150 && d > 150 && rnd() < 0.6))) { const [tx, tz] = bo.tower || [x0 + w * (0.3 + rnd() * 0.4), z0 + d * (0.3 + rnd() * 0.4)]; N._waterTower(ctx, tx, tz, h); }
      if (bo.bulk !== false && w > 120 && d > 120) { const bx = bo.bulk ? bo.bulk[0] : x0 + 24 + rnd() * (w - 110), bz = bo.bulk ? bo.bulk[1] : z0 + 24 + rnd() * (d - 110); ctx.brush([bx, h, bz], [bx + 64, h + 88, bz + 56], { tex: bo.bulkTex || 'brickdark', top: 'roof' }); }
      for (let i = 0; i < (bo.ac ?? 2); i++) { const ax = x0 + 20 + rnd() * Math.max(1, w - 70), az = z0 + 20 + rnd() * Math.max(1, d - 70); ctx.brush([ax, h, az], [ax + 34, h + 26, az + 28], { tex: 'metal', top: 'grate2' }); }
    });
  };
  N._waterTower = (ctx, x, z, y) => {
    for (const [dx, dz] of [[-16, -16], [16, -16], [-16, 16], [16, 16]]) ctx.props.pipe(x + dx, y, z + dz, x + dx * 0.8, y + 60, z + dz * 0.8, 2.2, 'metal');
    ctx.brush([x - 26, y + 58, z - 26], [x + 26, y + 62, z + 26], { tex: 'metal', noshadow: true });
    ctx.props.cylinder(x, y + 62, z, 24, 54, 'boards', { segs: 14 }); ctx.props.cylinder(x, y + 116, z, 25, 18, 'boards', { rTop: 2, segs: 14 });
    for (const yy of [y + 72, y + 98]) ctx.props.cylinder(x, yy, z, 24.8, 2, 'metal', { segs: 14 });
    ctx.brush([x - 22, y, z - 22], [x + 22, y + 130, z + 22], { invisible: true, noshadow: true });
  };

  // ---- faces of a block, for anything mounted on a facade ----
  N.face = (c0, r0, c1, r1, side) => ({
    s: { n: 'pz', axis: 'x', plane: Z(r1 + 1), a0: X(c0), a1: X(c1 + 1), out: [0, 1] }, n: { n: 'nz', axis: 'x', plane: Z(r0), a0: X(c0), a1: X(c1 + 1), out: [0, -1] },
    e: { n: 'px', axis: 'z', plane: X(c1 + 1), a0: Z(r0), a1: Z(r1 + 1), out: [1, 0] }, w: { n: 'nx', axis: 'z', plane: X(c0), a0: Z(r0), a1: Z(r1 + 1), out: [-1, 0] } }[side]);
  const fp = (F, a, off) => F.axis === 'x' ? [a, F.plane + F.out[1] * off] : [F.plane + F.out[0] * off, a]; // [x, z]
  const fbox = (ctx, F, a0, a1, o0, o1, y0, y1, opts) => { const [xa, za] = fp(F, a0, o0), [xb, zb] = fp(F, a1, o1); return ctx.brush([Math.min(xa, xb), y0, Math.min(za, zb)], [Math.max(xa, xb), y1, Math.max(za, zb)], opts); };
  const floorOut = (ctx, F, a) => { const [x, z] = fp(F, a, 20); return ctx.floor(Math.floor(x / 32), Math.floor(z / 32)); };
  N.fp = fp;
  N.decalOn = (F, a, y, w, h, tex, fb = false, off = 0.7) => K.post(ctx => { const [x, z] = fp(F, a, 0); ctx.decal({ at: [x, y, z], n: F.n, w, h, tex, fullbright: fb, off }); });
  N.tag = (F, a, y, tex, w = 150) => N.decalOn(F, a, y, w, w * 0.375, tex, false, 0.8);

  // storefront: lit window (or a rolled-down shutter), glowing sign, striped awning and warm light spilling out
  N.shop = (F, a, name, so = {}) => K.post(ctx => {
    const y0 = so.y ?? floorOut(ctx, F, a), w = so.w || 128; const [x, z] = fp(F, a, 0);
    ctx.decal({ at: [x, y0 + 46, z], n: F.n, w, h: 72, tex: so.closed ? 'shutter' : 'shopwin', fullbright: !so.closed, off: 0.7 });
    ctx.decal({ at: [x, y0 + 116, z], n: F.n, w: w * 1.1, h: 34, tex: 'shop_' + name, fullbright: true, off: 0.9 });
    if (so.awning !== false) fbox(ctx, F, a - w * 0.55, a + w * 0.55, 0, 44, y0 + 92, y0 + 97, { tex: 'awning' + (so.awning || 'R'), noshadow: false });
    if (!so.closed) { const [lx, lz] = fp(F, a, 36); ctx.light(lx, y0 + 60, lz, so.light || 170, so.color || [1, 0.72, 0.45]); }
    if (so.neon) { const [nx, nz] = fp(F, a + w * 0.34, 0); ctx.decal({ at: [nx, y0 + 60, nz], n: F.n, w: 40, h: 16, tex: 'shop_open', fullbright: true, off: 1.2 }); ctx.light(...fp(F, a + w * 0.34, 30).flatMap((v, k) => k === 0 ? [v, y0 + 60] : [v]), 120, [1, 0.2, 0.25], 2); }
  });
  // fire escape climbing diagonally along a facade: stair flights of 6 steps (96 up) with grate landings between.
  // starts at a0 at street level, climbs toward +dir along the face; floors = number of flights. Returns nothing; top landing ends at y0 + floors*96
  N.fireEscape = (F, a0, floors, eo = {}) => K.post(ctx => {
    const dir = eo.dir || 1, y0 = eo.y ?? floorOut(ctx, F, a0), dep = 44, land = eo.land || 80; let a = a0, y = y0;
    const rail = (u0, u1, yy) => fbox(ctx, F, Math.min(u0, u1), Math.max(u0, u1), dep - 2, dep, yy, yy + 34, { tex: 'railing', fit: true, noshadow: true });
    for (let i = 0; i < floors; i++) {
      for (let k = 0; k < 6; k++) { const u = a + dir * k * 16; fbox(ctx, F, Math.min(u, u + dir * 16), Math.max(u, u + dir * 16), 4, dep, y + 16 * (k + 1) - 4, y + 16 * (k + 1), { tex: 'metal', top: 'grate', noshadow: true }); }
      const [sx0, sz0] = fp(F, a, dep - 1), [sx1, sz1] = fp(F, a + dir * 96, dep - 1); ctx.props.pipe(sx0, y + 34, sz0, sx1, y + 96 + 34, sz1, 1.4, 'metal'); ctx.props.pipe(sx0, y, sz0, sx1, y + 96, sz1, 2, 'metal');
      a += dir * 96; y += 96;
      fbox(ctx, F, Math.min(a, a + dir * land), Math.max(a, a + dir * land), 0, dep, y - 6, y, { tex: 'metal', top: 'grate', bottom: 'grate', noshadow: true });
      if (i < floors - 1 || !eo.openTop) rail(a, a + dir * land, y);
      const [bx, bz] = fp(F, a + dir * land / 2, dep - 4); ctx.props.pipe(bx, y - 6, bz, ...fp(F, a + dir * land / 2, 2).flatMap((v, k) => k === 0 ? [v, y - 40] : [v]), 1.6, 'metal');
      a += dir * land;
    }
  });
  // green plywood sidewalk shed (scaffolding) along a facade; the deck keeps the rain off and can be climbed onto
  N.scaffold = (F, a0, a1, so = {}) => K.post(ctx => {
    const y0 = so.y ?? floorOut(ctx, F, (a0 + a1) / 2), h = so.h || 120, dep = so.dep || 96;
    fbox(ctx, F, a0, a1, 0, dep, y0 + h - 8, y0 + h, { tex: 'scaffold', top: 'boards', bottom: 'boards' });
    fbox(ctx, F, a0, a1, dep - 3, dep, y0 + h, y0 + h + 28, { tex: 'scaffold', noshadow: true });
    for (let a = a0 + 8; a < a1; a += 96) for (const off of [6, dep - 6]) { const [x, z] = fp(F, a, off); ctx.props.cylinder(x, y0, z, 2.4, h - 8, 'metalgreen', { segs: 6 }); ctx.brush([x - 3, y0, z - 3], [x + 3, y0 + h - 8, z + 3], { invisible: true, noshadow: true }); }
    for (let a = a0 + 40; a < a1 - 20; a += 192) { const [x, z] = fp(F, a, dep / 2); ctx.light(x, y0 + h - 20, z, 150, [1, 0.85, 0.6]); ctx.props.cageLamp(x, y0 + h - 14, z); }
  });
  N.billboard = (F, a, y, tex, w = 256, h = 128, color = [1, 0.6, 0.4]) => K.post(ctx => {
    const [x, z] = fp(F, a, 0); fbox(ctx, F, a - w / 2 - 8, a + w / 2 + 8, 0, 6, y - h / 2 - 8, y + h / 2 + 8, { tex: 'metal', noshadow: true });
    ctx.decal({ at: [x + F.out[0] * 6, y, z + F.out[1] * 6], n: F.n, w, h, tex, fullbright: true, off: 0.6 });
    const [lx, lz] = fp(F, a, 90); ctx.light(lx, y - h / 2, lz, Math.min(520, w * 1.4), color);
  });

  // ---- street furniture (x, z in units; y = floor) ----
  N.lamp = (x, z, y, n = 'pz', color = [1, 0.62, 0.32], light = 290) => K.post(ctx => {
    const o = { px: [1, 0], nx: [-1, 0], pz: [0, 1], nz: [0, -1] }[n]; const hx = x + o[0] * 34, hz = z + o[1] * 34;
    ctx.props.cylinder(x, y, z, 3, 170, 'metalgreen', { segs: 8 }); ctx.props.cylinder(x, y, z, 5, 14, 'metalgreen', { segs: 8 });
    ctx.props.pipe(x, y + 166, z, hx, y + 172, hz, 2, 'metalgreen'); ctx.props.box(hx, y + 162, hz, 16, 10, 16, 'metalgreen'); ctx.props.box(hx, y + 159, hz, 12, 3, 12, 'glow', { fullbright: true });
    ctx.brush([x - 4, y, z - 4], [x + 4, y + 170, z + 4], { invisible: true, noshadow: true });
    ctx.light(hx, y + 140, hz, light, color);
  });
  N.trafficLight = (x, z, y, ry = 0, state = 'red') => K.post(ctx => {
    ctx.props.cylinder(x, y, z, 3, 150, 'carblack', { segs: 8 }); ctx.props.box(x, y + 150, z, 14, 42, 14, 'carblack', { ry });
    const s = Math.sin(ry), c = Math.cos(ry); const fx = x + s * 8, fz = z + c * 8;
    ctx.props.box(fx, y + 178, fz, 7, 7, 2, state === 'red' ? 'redlight' : 'carblack', { ry, fullbright: state === 'red' }); ctx.props.box(fx, y + 166, fz, 7, 7, 2, state === 'amber' ? 'lightamber' : 'carblack', { ry, fullbright: state === 'amber' }); ctx.props.box(fx, y + 154, fz, 7, 7, 2, state === 'green' ? 'greenlight' : 'carblack', { ry, fullbright: state === 'green' });
    ctx.light(fx + s * 20, y + 160, fz + c * 20, 110, state === 'red' ? [1, 0.1, 0.05] : state === 'green' ? [0.2, 1, 0.4] : [1, 0.6, 0.1]);
    ctx.brush([x - 4, y, z - 4], [x + 4, y + 150, z + 4], { invisible: true, noshadow: true });
  });
  N.hydrant = (x, z, y) => K.post(ctx => { ctx.props.cylinder(x, y, z, 6, 22, 'hydrant', { segs: 10 }); ctx.props.sphere(x, y + 22, z, 6, 'hydrant', { half: true, segs: 10, rings: 4 }); ctx.props.cylinder(x, y + 14, z, 2.5, 18, 'hydrant', { rz: Math.PI / 2, segs: 6 }); ctx.brush([x - 7, y, z - 7], [x + 7, y + 28, z + 7], { invisible: true, noshadow: true }); });
  N.trash = (x, z, y, n = 4) => K.post(ctx => { let s = Math.abs(Math.round(x * 3 + z)) % 97; const r = () => (s = (s * 37 + 11) % 101) / 101; for (let i = 0; i < n; i++) ctx.props.sphere(x + (r() - 0.5) * 40, y + 8, z + (r() - 0.5) * 30, 9 + r() * 5, 'trashbag', { sy: 0.8, segs: 9, rings: 6 }); });
  N.can = (x, z, y) => K.post(ctx => { ctx.props.cylinder(x, y, z, 11, 32, 'metalgreen', { segs: 10, rTop: 12 }); ctx.brush([x - 11, y, z - 11], [x + 11, y + 32, z + 11], { invisible: true, noshadow: true }); });
  N.newsbox = (x, z, y, ry = 0, tex = 'carred') => K.post(ctx => { ctx.props.box(x, y, z, 18, 40, 16, tex, { ry }); ctx.brush([x - 10, y, z - 10], [x + 10, y + 40, z + 10], { invisible: true, noshadow: true }); });
  N.mailbox = (x, z, y, ry = 0) => N.newsbox(x, z, y, ry, 'awningB');
  N.bench = (x, z, y, axis = 'x') => K.post(ctx => { const [w, d] = axis === 'x' ? [72, 18] : [18, 72]; ctx.props.box(x, y + 16, z, w, 3, d, 'boards'); ctx.props.box(x, y, z, w - 8, 16, d - 6, 'metalgreen'); ctx.brush([x - w / 2, y, z - d / 2], [x + w / 2, y + 19, z + d / 2], { invisible: true, noshadow: true }); });
  N.cone = (x, z, y) => K.post(ctx => { ctx.props.cylinder(x, y, z, 6, 22, 'lightamber', { rTop: 1, segs: 8 }); });
  N.barrier = (x, z, y, axis = 'x', len = 96) => K.post(ctx => { // police sawhorse with tape
    const [w, d] = axis === 'x' ? [len, 6] : [6, len]; ctx.brush([x - w / 2, y + 30, z - d / 2], [x + w / 2, y + 40, z + d / 2], { tex: 'hazard', noshadow: true });
    for (const q of [-1, 1]) { const lx = axis === 'x' ? x + q * (len / 2 - 6) : x, lz = axis === 'x' ? z : z + q * (len / 2 - 6); ctx.props.box(lx, y, lz, 4, 40, 4, 'carwhite'); }
    ctx.brush([x - w / 2, y, z - d / 2], [x + w / 2, y + 40, z + d / 2], { invisible: true, noshadow: true });
  });
  N.barrelFire = (x, z, y) => K.post(ctx => { ctx.props.barrel(x, z, y, 13, 34, 'rust'); N._fire(ctx, x, y + 34, z, 18); });
  // fire: flame billboards + flickering light + embers and smoke (style slot 1 = fire flicker)
  N._fire = (ctx, x, y, z, size = 30, fo = {}) => { ctx.ent({ type: 'fire', pos: [x, y, z], size, smoke: fo.smoke !== false }); ctx.light(x, y + size * 0.8, z, Math.min(520, 160 + size * 7), [1, 0.55, 0.2], 1); ctx.ambient({ pos: [x, y, z], type: 'fire', radius: 320, vol: 0.7 }); };
  N.fire = (x, z, y, size, fo) => K.post(ctx => N._fire(ctx, x, y ?? ctx.floor(Math.floor(x / 32), Math.floor(z / 32)), z, size, fo));
  N.steam = (x, z, y) => K.post(ctx => { ctx.decal({ at: [x, y + 0.3, z], n: 'up', w: 40, h: 40, tex: 'manhole', off: 0.3 }); ctx.emitter({ min: [x - 10, y, z - 10], max: [x + 10, y + 4, z + 10], type: 'steam', rate: 9 }); });
  N.manhole = (x, z, y) => K.post(ctx => ctx.decal({ at: [x, y + 0.3, z], n: 'up', w: 40, h: 40, tex: 'manhole', off: 0.3 }));
  // street-name sign: pole with two crossed green plates
  N.streetSign = (x, z, y, texA, texB) => K.post(ctx => {
    ctx.props.cylinder(x, y, z, 2.5, 150, 'metalgreen', { segs: 8 });
    ctx.brush([x - 40, y + 138, z - 1], [x + 40, y + 154, z + 1], { tex: 'metalgreen', pz: texA, nz: texA, fit: ['pz', 'nz'], noshadow: true, solid: false });
    if (texB) ctx.brush([x - 1, y + 156, z - 40], [x + 1, y + 172, z + 40], { tex: 'metalgreen', px: texB, nx: texB, fit: ['px', 'nx'], noshadow: true, solid: false });
    ctx.brush([x - 3, y, z - 3], [x + 3, y + 150, z + 3], { invisible: true, noshadow: true });
  });
  // cars (taxi, cop, sedan, burnt); ry in radians, 0 = facing +z. Collision is the rotated footprint's bounding box.
  N.car = (x, z, y, ry = 0, kind = 'taxi', co = {}) => K.post(ctx => {
    const body = { taxi: 'taxi', cop: 'carwhite', sedan: co.paint || 'carred', black: 'carblack', burnt: 'burnt' }[kind] || kind;
    const glass = kind === 'burnt' ? 'burnt' : 'carglass'; const c = Math.cos(ry), s = Math.sin(ry);
    const P = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
    ctx.props.box(x, y + 13, z, 72, 22, 156, [body, body, body, 'carblack', body, body], { ry });                       // body
    for (const q of [-1, 1]) { const [bx, bz] = P(0, q * 79); ctx.props.box(bx, y + 12, bz, 74, 9, 4, 'carblack', { ry }); }  // bumpers
    ctx.props.cabin(...P(0, 72 - 116).flatMap((v, k) => k === 0 ? [v, y + 35] : [v]), 70, 7, 64, 0, 0, [body, body, body, body, body, body], ry); // trunk lid
    ctx.props.cabin(...P(0, 46).flatMap((v, k) => k === 0 ? [v, y + 35] : [v]), 70, 4, 50, 0, 0, [body, body, body, body, body, body], ry);      // hood
    ctx.props.cabin(...P(0, -6).flatMap((v, k) => k === 0 ? [v, y + 35] : [v]), 64, 24, 78, 20, 14, [glass, glass, body, body, glass, glass], ry); // cabin with sloped screens
    for (const [wx, wz] of [[-34, 46], [34, 46], [-34, -50], [34, -50]]) { const [px, pz] = P(wx, wz); ctx.props.cylinder(px, y + 13, pz, 13, 9, 'tire', { rz: Math.PI / 2, ry, segs: 10 }); }
    const [hx, hz] = P(0, 79), [tx, tz] = P(0, -79);
    if (kind !== 'burnt') { for (const q of [-24, 24]) { const [lx, lz] = P(q, 78.5); ctx.props.box(lx, y + 28, lz, 12, 6, 2, 'glow', { ry, fullbright: true }); const [rx, rz] = P(q, -78.5); ctx.props.box(rx, y + 30, rz, 12, 5, 2, 'redlight', { ry, fullbright: true }); }
      if (co.lights !== false) ctx.light(...P(0, 140).flatMap((v, k) => k === 0 ? [v, y + 30] : [v]), 240, [1, 0.95, 0.8]); }
    if (kind === 'taxi') ctx.props.box(...P(0, -8).flatMap((v, k) => k === 0 ? [v, y + 68] : [v]), 26, 10, 10, ['taxisign', 'taxisign', 'taxi', 'taxi', 'taxisign', 'taxisign'], { ry, fullbright: true });
    if (kind === 'cop') { const [bx, bz] = P(0, -8); ctx.props.box(...P(-10, -8).flatMap((v, k) => k === 0 ? [v, y + 68] : [v]), 18, 6, 10, 'redlight', { ry, fullbright: true }); ctx.props.box(...P(10, -8).flatMap((v, k) => k === 0 ? [v, y + 68] : [v]), 18, 6, 10, 'glowblue', { ry, fullbright: true });
      ctx.light(bx, y + 90, bz, 300, [1, 0.1, 0.05], 3); ctx.light(bx, y + 92, bz, 300, [0.15, 0.3, 1], 4); }
    if (kind === 'burnt' && co.fire !== false) N._fire(ctx, x, y + 40, z, co.fireSize || 34);
    const ex = Math.abs(36 * c) + Math.abs(78 * s), ez = Math.abs(36 * s) + Math.abs(78 * c);
    ctx.brush([x - ex, y, z - ez], [x + ex, y + 42, z + ez], { invisible: true, noshadow: true });
    ctx.brush([x - ex * 0.7, y + 42, z - ez * 0.7], [x + ex * 0.7, y + 68, z + ez * 0.7], { invisible: true, noshadow: true });
    void hx; void hz; void tx; void tz;
  });
  // subway entrance deco around a stair opening (cells c0..c1 x r0..r1): railings, green globe lamps, SUBWAY sign on the closed end
  N.subwayRails = (c0, r0, c1, r1, openSide, y = 8) => K.post(ctx => {
    const x0 = X(c0), x1 = X(c1 + 1), z0 = Z(r0), z1 = Z(r1 + 1), h = 40;
    const R = (a, b, opts = {}) => ctx.brush(a, b, { tex: 'railing', fit: true, noshadow: true, ...opts });
    if (openSide !== 'n') R([x0, y, z0 - 3], [x1, y + h, z0]); if (openSide !== 's') R([x0, y, z1], [x1, y + h, z1 + 3]);
    if (openSide !== 'w') R([x0 - 3, y, z0], [x0, y + h, z1]); if (openSide !== 'e') R([x1, y, z0], [x1 + 3, y + h, z1]);
    const posts = openSide === 'n' || openSide === 's' ? [[x0 - 4, openSide === 'n' ? z0 : z1], [x1 + 4, openSide === 'n' ? z0 : z1]] : [[openSide === 'w' ? x0 : x1, z0 - 4], [openSide === 'w' ? x0 : x1, z1 + 4]];
    for (const [px, pz] of posts) { ctx.props.cylinder(px, y, pz, 2.4, 70, 'metalgreen', { segs: 8 }); ctx.props.sphere(px, y + 76, pz, 7, 'greenlight', { fullbright: true, segs: 10, rings: 7 }); ctx.light(px, y + 76, pz, 200, [0.3, 1, 0.45]); }
    const back = { n: [(x0 + x1) / 2, z1 + 3, 'pz'], s: [(x0 + x1) / 2, z0 - 3, 'nz'], w: [x1 + 3, (z0 + z1) / 2, 'px'], e: [x0 - 3, (z0 + z1) / 2, 'nx'] }[openSide];
    if (back) ctx.decal({ at: [back[0], y + 26, back[1]], n: back[2], w: 96, h: 24, tex: 'sign_subway', fullbright: true, off: 1 });
  });
  N.tree = (x, z, y0, sz = 1) => K.post(ctx => { const y = y0 ?? ctx.floor(Math.floor(x / 32), Math.floor(z / 32));
    ctx.props.cylinder(x, y, z, 6 * sz, 90 * sz, 'bark', { segs: 8, rTop: 4 * sz });
    let s = Math.abs(Math.round(x + z * 7)) % 89; const r = () => (s = (s * 29 + 7) % 97) / 97;
    for (let i = 0; i < 5; i++) ctx.props.sphere(x + (r() - 0.5) * 50 * sz, y + (88 + r() * 40) * sz, z + (r() - 0.5) * 50 * sz, (30 + r() * 18) * sz, 'leaves', { segs: 9, rings: 6, sy: 0.8 });
    ctx.brush([x - 6 * sz, y, z - 6 * sz], [x + 6 * sz, y + 90 * sz, z + 6 * sz], { invisible: true, noshadow: true });
  });
  // moonlight: a grid of big, dim blue-grey lights high above the streets so nothing is pitch black
  N.moon = (x0, z0, x1, z1, y = 900, step = 640, color = [0.22, 0.24, 0.36], light = 1000) => { for (let x = x0 + step / 2; x < x1; x += step) for (let z = z0 + step / 2; z < z1; z += step) K.light(x, y, z, light, color); };
  return N;
}
