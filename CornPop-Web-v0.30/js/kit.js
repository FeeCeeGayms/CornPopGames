// Level kit: high-level building blocks for big, Arcane-Dimensions-style maps on the 32-unit grid.
// A level is written as one function that paints the grid (floors/ceilings per cell) and queues
// decoration/entities ("post" steps) that run once the world exists.
import { ruinify } from './ruins.js';
const S = 32;
const POOL_START = 0x100;

export function makeLevel(meta, w, h, defaultSolidTex, fn) {
  const types = new Map(), legend = {}, doors = {};
  let nextChar = POOL_START;
  const alloc = () => String.fromCharCode(nextChar++);
  const g = Array.from({ length: h }, () => Array(w).fill(null));
  const posts = [];
  const post = f => posts.push(f);
  const goals = [];
  const K = { S, w, h, post, meta, goal: (x, z, y, o = {}) => goals.push({ x, z, y, ...o }) };

  // ---------- cell types ----------
  K.type = (spec) => {
    const key = JSON.stringify(spec);
    if (types.has(key)) return types.get(key);
    const ch = alloc(); types.set(key, ch);
    legend[ch] = spec.solid ? { solid: true, wall: spec.solid } : { f: spec.f, c: spec.c, floor: spec.floor, ceil: spec.ceil, side: spec.side, upper: spec.upper, sky: !!spec.sky, inner: spec.inner, roof: spec.roof, roofTex: spec.roofTex, roofSky: spec.roofSky };
    return ch;
  };
  K.solid = (tex) => K.type({ solid: tex });
  K.open = (f, c, floor, ceil, side, extra = {}) => K.type({ f, c, floor, ceil, side, ...extra });
  const SOLID = K.solid(defaultSolidTex);
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) g[r][c] = SOLID;
  K.isSolid = (c, r) => !!(legend[g[r]?.[c]] && legend[g[r][c]].solid);
  K.spec = (c, r) => legend[g[r][c]];
  K.paint = (c0, r0, c1, r1, ch) => { for (let r = Math.max(0, r0); r <= Math.min(h - 1, r1); r++) for (let c = Math.max(0, c0); c <= Math.min(w - 1, c1); c++) g[r][c] = ch; };
  // a room: retextures surrounding solid cells, then opens the interior. spec = {f,c,floor,ceil,side,upper,sky}
  K.room = (c0, r0, c1, r1, spec, wallTex) => {
    if (wallTex) { const wch = K.solid(wallTex); for (let r = r0 - 1; r <= r1 + 1; r++) for (let c = c0 - 1; c <= c1 + 1; c++) if (r >= 0 && c >= 0 && r < h && c < w && K.isSolid(c, r)) g[r][c] = wch; }
    const ch = K.type(spec); K.paint(c0, r0, c1, r1, ch); return ch;
  };
  K.wall = (c0, r0, c1, r1, tex) => K.paint(c0, r0, c1, r1, K.solid(tex));
  // stairs along a direction: 'N' climbs toward smaller rows, 'S' larger rows, 'E' larger cols, 'W' smaller cols
  K.stairs = (c0, r0, c1, r1, dir, f0, f1, spec) => {
    const alongRows = dir === 'N' || dir === 'S';
    const n = alongRows ? r1 - r0 + 1 : c1 - c0 + 1;
    const step = n > 1 ? (f1 - f0) / (n - 1) : 0;
    if (Math.abs(step) > 17) console.warn('stairs too steep', meta.name, c0, r0, step);
    for (let i = 0; i < n; i++) {
      const f = Math.round(f0 + step * i);
      const ch = K.type({ ...spec, f, c: Math.max(spec.c ?? 0, f + (spec.head || 128)), head: undefined });
      const k = (dir === 'N' || dir === 'W') ? n - 1 - i : i; // index from the low end
      const kk = (dir === 'N' || dir === 'W') ? i : i;
      if (alongRows) { const r = dir === 'S' ? r0 + i : r1 - i; K.paint(c0, r, c1, r, ch); }
      else { const c = dir === 'E' ? c0 + i : c1 - i; K.paint(c, r0, c1 === c0 ? c : c, r1, ch); }
      void k; void kk;
    }
  };
  // doors are painted cells with their own unique char; base = spec of the floor they sit on
  K.door = (c0, r0, c1, r1, base, o = {}) => {
    const baseCh = K.type(base); const ch = alloc();
    doors[ch] = { cell: baseCh, top: o.top || 112, key: o.key, tex: o.tex, name: o.name, thin: o.thin, wait: o.wait, targeted: o.targeted, speed: o.speed, message: o.message, upper: o.upper, dir: o.dir, secret: o.secret };
    K.paint(c0, r0, c1, r1, ch); return ch;
  };
  K.gate = (c0, r0, c1, r1, base, name, o = {}) => K.door(c0, r0, c1, r1, base, { tex: 'bars', thin: true, name, wait: o.wait ?? 2, top: o.top || 112, speed: 160, ...o });

  // ---------- deco / entities (run at build time) ----------
  const X = c => c * S, Z = r => r * S, C = c => c * S + S / 2;
  K.X = X; K.Z = Z; K.C = C;
  K.start = (c, r, angle) => post(ctx => ctx.ent({ type: 'start', pos: ctx.at(c, r), angle }));
  K.ent = (e) => post(ctx => ctx.ent(typeof e === 'function' ? e(ctx) : e));
  const atY = (ctx, x, z, y) => y ?? ctx.floor(Math.floor(x / S), Math.floor(z / S));
  K.qoq = (x, z, angle = 0, o = {}) => post(ctx => ctx.ent({ type: 'qoq', pos: [x, atY(ctx, x, z, o.y), z], angle, turret: o.turret, wave: o.wave, delay: o.delay }));
  K.qoqC = (c, r, angle, o) => K.qoq(C(c), C(r), angle, o);
  K.marv = (x, z, angle = 0, o = {}) => post(ctx => ctx.ent({ type: 'marv', pos: [x, atY(ctx, x, z, o.y), z], angle, turret: o.turret, wave: o.wave, delay: o.delay }));
  K.marvC = (c, r, angle, o) => K.marv(C(c), C(r), angle, o);
  K.item = (type, x, z, o = {}) => post(ctx => ctx.ent({ type, pos: [x, atY(ctx, x, z, o.y), z], amount: o.amount, color: o.color }));
  K.slice = (x, z, y) => K.item('slice', x, z, { y });
  K.slices = (pts, y) => pts.forEach(([x, z]) => K.slice(x, z, y));
  K.key = (color, x, z, y) => K.item('key', x, z, { y, color });
  K.juice = (x, z, y, amount) => K.item('juice', x, z, { y, amount });
  K.health = (x, z, y, amount) => K.item('health', x, z, { y, amount });
  K.msg = (min, max, msg) => K.ent({ type: 'message', min, max, msg });
  K.secret = (min, max) => K.ent({ type: 'secret', min, max });
  K.wave = (id, o) => K.ent({ type: 'wave', id, ...o });
  K.tele = (min, max, dest, angle) => K.ent({ type: 'teleport', min, max, dest, angle });
  K.hurt = (min, max, dps) => K.ent({ type: 'hurt', min, max, dps });
  K.button = (b) => post(ctx => ctx.button(b));
  K.brush = (min, max, o = {}) => post(ctx => ctx.brush(min, max, o));
  K.decal = (d) => post(ctx => ctx.decal(d));
  K.light = (x, y, z, light = 200, color = [1, 1, 1], style = 0) => post(ctx => ctx.light(x, y, z, light, color, style));
  K.props = (fn2) => post(ctx => fn2(ctx.props, ctx));
  K.ambient = (x, y, z, type, radius = 400, vol = 1) => post(ctx => ctx.ambient({ pos: [x, y, z], type, radius, vol }));
  K.emitter = (min, max, type, rate = 5, color) => post(ctx => ctx.emitter({ min, max, type, rate, color }));
  K.beam = (x, z, y0, y1, w = 48, d = 48, color, opacity) => post(ctx => ctx.beam({ x, z, y0, y1, w, d, color, opacity }));
  K.breakable = (min, max, o = {}) => post(ctx => ctx.breakable({ min, max, ...o }));
  K.lift = (min, max, travel, o = {}) => post(ctx => ctx.lift({ min, max, travel, ...o }));
  K.mover = (m) => post(ctx => ctx.mover(m));

  // ceiling light fixture (brush + light)
  K.fixture = (x, z, y, len = 96, axis = 'x', tex = 'light', light = 300, color = [1, 1, 0.95], style = 0) => post(ctx => {
    const hl = len / 2; const min = axis === 'x' ? [x - hl, y - 6, z - 6] : [x - 6, y - 6, z - hl]; const max = axis === 'x' ? [x + hl, y, z + 6] : [x + 6, y, z + hl];
    ctx.brush(min, max, { tex, noshadow: true, solid: false, fit: true }); ctx.light(x, y - 18, z, light, color, style);
  });
  K.lamp = (x, y, z, light = 200, color = [1, 0.75, 0.45], style = 0) => post(ctx => { ctx.props.cageLamp(x, y, z); ctx.light(x, y - 6, z, light, color, style); });
  // wall lantern (jail style): bracket + glowing cage, light pushed out from the wall
  K.lantern = (x, y, z, n, light = 190, style = 0) => post(ctx => {
    const o = { px: [1, 0], nx: [-1, 0], pz: [0, 1], nz: [0, -1] }[n];
    ctx.props.sphere(x + o[0] * 7, y, z + o[1] * 7, 4.5, 'glow', { fullbright: true, segs: 8, rings: 6, sy: 1.4 });
    ctx.props.cylinder(x + o[0] * 7, y + 6, z + o[1] * 7, 5, 2, 'metal', { segs: 8 }); ctx.props.cylinder(x + o[0] * 7, y - 8, z + o[1] * 7, 4, 2, 'metal', { segs: 8 });
    ctx.brush([x - 2 + Math.min(0, o[0] * 7), y + 6, z - 2 + Math.min(0, o[1] * 7)], [x + 2 + Math.max(0, o[0] * 7), y + 8, z + 2 + Math.max(0, o[1] * 7)], { tex: 'metal', solid: false, noshadow: true });
    ctx.light(x + o[0] * 18, y, z + o[1] * 18, light, [1, 0.72, 0.4], style);
  });
  // skylight: recessed glowing ceiling panel, cold light and a dusty light shaft
  K.skylight = (x, z, ceilY, floorY, w = 96, d = 96, light = 420) => post(ctx => {
    ctx.brush([x - w / 2 - 8, ceilY - 8, z - d / 2 - 8], [x + w / 2 + 8, ceilY, z + d / 2 + 8], { tex: 'metal', bottom: 'skylite', fit: ['bottom'], noshadow: true, solid: false });
    ctx.light(x, ceilY - 40, z, light, [0.75, 0.85, 1]);
    ctx.beam({ x, z, y0: floorY, y1: ceilY - 8, w: w * 0.9, d: d * 0.9, color: [0.55, 0.65, 0.8], opacity: 0.14 });
  });
  // square pillar with base & capital trim
  K.column = (x, z, s, y0, y1, tex = 'concrete', trim = 'trim') => post(ctx => {
    const h = s / 2; ctx.brush([x - h, y0, z - h], [x + h, y1, z + h], { tex });
    ctx.brush([x - h - 4, y0, z - h - 4], [x + h + 4, y0 + 10, z + h + 4], { tex: trim });
    ctx.brush([x - h - 4, y1 - 10, z - h - 4], [x + h + 4, y1, z + h + 4], { tex: trim });
  });
  K.colonnade = (pts, s, y0, y1, tex, trim) => pts.forEach(([x, z]) => K.column(x, z, s, y0, y1, tex, trim));
  // horizontal trim band around a rect of walls (visual only)
  K.trim = (x0, z0, x1, z1, y, h = 8, tex = 'trim', depth = 4) => post(ctx => {
    for (const [a, b] of [[[x0, y, z0], [x1, y + h, z0 + depth]], [[x0, y, z1 - depth], [x1, y + h, z1]], [[x0, y, z0], [x0 + depth, y + h, z1]], [[x1 - depth, y, z0], [x1, y + h, z1]]]) ctx.brush(a, b, { tex, solid: false, noshadow: true });
  });
  // catwalk / balcony slab with optional see-through railings. rails: string of sides 'nsew'; gaps: [[side, a0, a1]]
  K.catwalk = (x0, z0, x1, z1, y, o = {}) => post(ctx => {
    const th = o.thick ?? 8;
    ctx.brush([x0, y - th, z0], [x1, y, z1], { tex: o.tex || 'grate', top: o.top || o.tex || 'grate', bottom: 'metal' });
    const rails = o.rails ?? '', rh = 34, gaps = o.gaps || [];
    const seg = (side, a0, a1, mk) => { let pts = [[a0, a1]]; for (const [s2, g0, g1] of gaps) if (s2 === side) pts = pts.flatMap(([u, v]) => (g1 <= u || g0 >= v) ? [[u, v]] : [[u, g0], [g1, v]].filter(([p, q]) => q - p > 1)); for (const [u, v] of pts) mk(u, v); };
    if (rails.includes('n')) seg('n', x0, x1, (u, v) => ctx.brush([u, y, z0], [v, y + rh, z0 + 2], { tex: 'railing', fit: true, noshadow: true }));
    if (rails.includes('s')) seg('s', x0, x1, (u, v) => ctx.brush([u, y, z1 - 2], [v, y + rh, z1], { tex: 'railing', fit: true, noshadow: true }));
    if (rails.includes('w')) seg('w', z0, z1, (u, v) => ctx.brush([x0, y, u], [x0 + 2, y + rh, v], { tex: 'railing', fit: true, noshadow: true }));
    if (rails.includes('e')) seg('e', z0, z1, (u, v) => ctx.brush([x1 - 2, y, u], [x1, y + rh, v], { tex: 'railing', fit: true, noshadow: true }));
    if (o.supports) for (const [sx, sz] of o.supports) ctx.brush([sx - 4, atY(ctx, sx, sz), sz - 4], [sx + 4, y - th, sz + 4], { tex: 'metal' });
  });
  // round arch filling the top of a rectangular opening: stepped spandrel brushes + a smooth ring band.
  // The span runs along the longer horizontal side of [x0,z0]-[x1,z1]; spring = height where the curve starts.
  K.arch = (x0, z0, x1, z1, spring, top, tex = 'brick', band = 'trim') => post(ctx => {
    const alongZ = (z1 - z0) >= (x1 - x0); const a0 = alongZ ? z0 : x0, a1 = alongZ ? z1 : x1;
    const R = (a1 - a0) / 2, mid = (a0 + a1) / 2, n = 12;
    for (let i = 0; i < n; i++) {
      const u0 = a0 + (a1 - a0) * i / n, u1 = a0 + (a1 - a0) * (i + 1) / n, m = Math.abs((u0 + u1) / 2 - mid);
      const y = Math.min(top, spring + Math.sqrt(Math.max(0, R * R - m * m)));
      if (top - y < 1) continue;
      if (alongZ) ctx.brush([x0, y, u0], [x1, top, u1], { tex, noshadow: true }); else ctx.brush([u0, y, z0], [u1, top, z1], { tex, noshadow: true });
    }
    const t = alongZ ? x1 - x0 : z1 - z0;
    ctx.props.ring(alongZ ? (x0 + x1) / 2 : mid, spring, alongZ ? mid : (z0 + z1) / 2, R - 6, R + 4, t + 4, alongZ ? 'x' : 'z', 0, Math.PI, band, 24);
  });
  // free-standing staircase made of brushes (climbs from y0 to y1 along dir over the given footprint)
  K.stairBrush = (x0, z0, x1, z1, y0, y1, dir, tex = 'stepside', top = 'diamond') => post(ctx => {
    const n = Math.max(1, Math.ceil((y1 - y0) / 16)), rise = (y1 - y0) / n;
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n, yt = y0 + rise * (i + 1); let a, b;
      if (dir === 'E') { a = [x0 + (x1 - x0) * t0, y0, z0]; b = [x0 + (x1 - x0) * t1, yt, z1]; }
      if (dir === 'W') { a = [x1 - (x1 - x0) * t1, y0, z0]; b = [x1 - (x1 - x0) * t0, yt, z1]; }
      if (dir === 'S') { a = [x0, y0, z0 + (z1 - z0) * t0]; b = [x1, yt, z0 + (z1 - z0) * t1]; }
      if (dir === 'N') { a = [x0, y0, z1 - (z1 - z0) * t1]; b = [x1, yt, z1 - (z1 - z0) * t0]; }
      ctx.brush(a, b, { tex, top });
    }
  });
  // hazard pool: lowers the floor by depth, adds a warping liquid surface, damage, bubbles and glow
  K.pool = (c0, r0, c1, r1, spec, liquid = 'sauce', depth = 24, dps = 10) => {
    const f = spec.f - depth; K.paint(c0, r0, c1, r1, K.type({ ...spec, f, side: spec.side || 'concrete', floor: 'concretedark' }));
    post(ctx => {
      ctx.W.addLiquid(X(c0), Z(r0), X(c1 + 1), Z(r1 + 1), spec.f - 6, liquid);
      if (dps) ctx.ent({ type: 'hurt', min: [X(c0), f - 8, Z(r0)], max: [X(c1 + 1), spec.f - 6, Z(r1 + 1)], dps });
      const col = liquid === 'sauce' ? [1, 0.35, 0.15] : liquid === 'sludge' ? [0.6, 1, 0.3] : [0.5, 0.7, 0.8];
      ctx.emitter({ min: [X(c0), spec.f - 8, Z(r0)], max: [X(c1 + 1), spec.f - 6, Z(r1 + 1)], type: 'bubbles', rate: 3 + (c1 - c0 + 1) * (r1 - r0 + 1) * 0.08, color: col });
      if (liquid !== 'water') for (let c = c0 + 2; c <= c1; c += 6) for (let r = r0 + 2; r <= r1; r += 6) ctx.light(C(c), spec.f + 24, C(r), 150, col);
      if (liquid !== 'water') ctx.ambient({ pos: [C((c0 + c1) / 2), spec.f, C((r0 + r1) / 2)], type: 'fire', radius: 380, vol: 0.6 });
    });
  };
  // exit gate (portal in a ring on a wall) with sign, glow and trigger
  K.exit = (x, y, z, n, label = 'sign_exit', color = [1, 0.4, 0.1]) => post(ctx => {
    const o = { px: [1, 0], nx: [-1, 0], pz: [0, 1], nz: [0, -1] }[n]; const ry = n === 'px' || n === 'nx' ? -Math.PI / 2 : 0; const axis = n === 'px' || n === 'nx' ? 'x' : 'z';
    ctx.props.ring(x + o[0] * 2, y + 60, z + o[1] * 2, 46, 60, 14, axis, 0, Math.PI * 2, 'rust', 28);
    ctx.ent({ type: 'portal', pos: [x + o[0] * 4, y + 60, z + o[1] * 4], r: 46, ry, color });
    ctx.decal({ at: [x, y + 132, z], n, w: 84, h: 30, tex: label, fullbright: true });
    ctx.light(x + o[0] * 40, y + 60, z + o[1] * 40, 320, [color[0], color[1] * 1.2, color[2] * 2]);
    const a = [x + Math.min(0, o[0]) * 40 - (axis === 'z' ? 50 : 0), y, z + Math.min(0, o[1]) * 40 - (axis === 'x' ? 50 : 0)];
    const b = [x + Math.max(0, o[0]) * 40 + (axis === 'z' ? 50 : 0), y + 120, z + Math.max(0, o[1]) * 40 + (axis === 'x' ? 50 : 0)];
    ctx.ent({ type: 'exit', min: a, max: b });
  });

  // ---------- themed furniture ----------
  K.crates = (x, z, y, n = 1, size = 40, tex = 'crate') => post(ctx => { const y0 = atY(ctx, x, z, y); for (let i = 0; i < n; i++) ctx.brush([x - size / 2 + (i % 2) * 3, y0 + i * size, z - size / 2], [x + size / 2 + (i % 2) * 3, y0 + (i + 1) * size, z + size / 2], { tex, top: tex }); });
  K.pizzaBoxes = (x, z, y, n = 3) => post(ctx => { const y0 = atY(ctx, x, z, y); for (let i = 0; i < n; i++) ctx.brush([x - 28 + (i % 2) * 2, y0 + i * 5, z - 28], [x + 28 + (i % 2) * 2, y0 + (i + 1) * 5, z + 28], { tex: 'pizzabox', top: 'pizzabox', solid: i === 0 }); ctx.brush([x - 28, y0, z - 28], [x + 28, y0 + n * 5, z + 28], { invisible: true, noshadow: true }); });
  K.table = (x, z, w, d, h = 36, top = 'wood', side = 'metal', y) => post(ctx => { const y0 = atY(ctx, x, z, y); ctx.brush([x - w / 2, y0 + h - 4, z - d / 2], [x + w / 2, y0 + h, z + d / 2], { tex: side, top }); for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) ctx.brush([x + lx * (w / 2 - 4) - 2, y0, z + lz * (d / 2 - 4) - 2], [x + lx * (w / 2 - 4) + 2, y0 + h - 4, z + lz * (d / 2 - 4) + 2], { tex: side, noshadow: true, solid: false }); ctx.brush([x - w / 2, y0, z - d / 2], [x + w / 2, y0 + h, z + d / 2], { invisible: true, noshadow: true }); });
  K.pizzaTable = (x, z, r = 50) => post(ctx => { const y0 = atY(ctx, x, z); ctx.props.roundTable(x, z, y0, r, 40); ctx.props.pizza(x, y0 + 40, z, r * 0.8); });
  K.counter = (x0, z0, x1, z1, h = 40, front = 'drawer', facing = 'pz', top = 'metal') => post(ctx => { const y0 = atY(ctx, (x0 + x1) / 2, (z0 + z1) / 2); ctx.brush([x0, y0, z0], [x1, y0 + h, z1], { tex: 'cabinet', [facing]: front, top }); });
  K.bookshelf = (x0, z0, x1, z1, h = 120, face = 'pz') => post(ctx => { const y0 = atY(ctx, (x0 + x1) / 2, (z0 + z1) / 2); ctx.brush([x0, y0, z0], [x1, y0 + h, z1], { tex: 'wood', [face]: 'books', top: 'wood' }); });
  K.bed = (x, z, axis = 'z', y) => post(ctx => { // potato-quarters bed: metal frame, pizza bedspread, pillows
    const y0 = atY(ctx, x, z, y); const L = 84, W = 52; const [hx, hz] = axis === 'z' ? [W / 2, L / 2] : [L / 2, W / 2];
    ctx.brush([x - hx, y0 + 10, z - hz], [x + hx, y0 + 22, z + hz], { tex: 'metal', top: 'bedspread', fit: ['top'] });
    ctx.brush([x - hx, y0, z - hz], [x + hx, y0 + 22, z + hz], { invisible: true, noshadow: true });
    const hb = axis === 'z' ? [[x - hx, y0, z - hz - 3], [x + hx, y0 + 40, z - hz]] : [[x - hx - 3, y0, z - hz], [x - hx, y0 + 40, z + hz]];
    ctx.brush(hb[0], hb[1], { tex: 'railing', fit: true, noshadow: true, solid: false });
    const pl = axis === 'z' ? [[x - hx + 4, y0 + 22, z - hz + 2], [x + hx - 4, y0 + 28, z - hz + 16]] : [[x - hx + 2, y0 + 22, z - hz + 4], [x - hx + 16, y0 + 28, z + hz - 4]];
    ctx.brush(pl[0], pl[1], { tex: 'crust', solid: false, noshadow: true });
  });
  K.lavaLamp = (x, z, y) => post(ctx => { const y0 = atY(ctx, x, z, y); ctx.props.cylinder(x, y0, z, 3, 4, 'metal', { segs: 8 }); ctx.props.cylinder(x, y0 + 4, z, 2.4, 12, 'lavalamp', { segs: 8, rTop: 1.6, fullbright: true }); ctx.light(x, y0 + 14, z, 110, [0.4, 0.6, 1]); });
  K.potatoes = (pts, y) => post(ctx => { for (const [x, z] of pts) { const y0 = atY(ctx, x, z, y); ctx.props.sphere(x, y0 + 3, z, 4.5, 'potato', { sy: 0.7, segs: 8, rings: 6, uvScale: [1, 1] }); } });
  K.tv = (x, y, z, n, tex = 'tv_pizza', w = 40, h = 30) => post(ctx => { // a chunky CRT on a wall shelf
    const o = { px: [1, 0], nx: [-1, 0], pz: [0, 1], nz: [0, -1] }[n]; const dx = o[0] ? 28 : w / 2 + 4, dz = o[1] ? 28 : w / 2 + 4;
    const cx = x + o[0] * 14, cz = z + o[1] * 14;
    ctx.brush([cx - dx / 2, y - h / 2 - 4, cz - dz / 2], [cx + dx / 2, y + h / 2 + 4, cz + dz / 2], { tex: 'metal', solid: false });
    ctx.decal({ at: [x + o[0] * 28, y, z + o[1] * 28], n, w, h, tex, fullbright: true, off: 0.6 });
    ctx.light(x + o[0] * 50, y, z + o[1] * 50, 120, tex === 'tv_blue' || tex === 'monitors' ? [0.4, 0.6, 1] : [1, 0.6, 0.35]);
  });
  K.couch = (x0, z0, x1, z1, backSide = 'n') => post(ctx => { const y0 = atY(ctx, (x0 + x1) / 2, (z0 + z1) / 2);
    ctx.brush([x0, y0, z0], [x1, y0 + 18, z1], { tex: 'leather' });
    const b = { n: [[x0, y0, z0], [x1, y0 + 40, z0 + 12]], s: [[x0, y0, z1 - 12], [x1, y0 + 40, z1]], w: [[x0, y0, z0], [x0 + 12, y0 + 40, z1]], e: [[x1 - 12, y0, z0], [x1, y0 + 40, z1]] }[backSide];
    ctx.brush(b[0], b[1], { tex: 'leather' });
    ctx.brush([x0, y0, z0], [x1, y0 + 60, z1], { invisible: true, noshadow: true }); // clip: no couch-surfing
  });
  K.rug = (x, z, w, d, tex = 'carpet', y) => post(ctx => ctx.decal({ at: [x, atY(ctx, x, z, y), z], n: 'up', w, h: d, tex, off: 0.4 }));
  K.poster = (x, y, z, n, tex, w = 48, h = 80) => post(ctx => ctx.decal({ at: [x, y, z], n, w, h, tex }));
  K.sign = (x, y, z, n, tex, w = 128, h = 32, fullbright = true) => post(ctx => ctx.decal({ at: [x, y, z], n, w, h, tex, fullbright }));
  K.barrel = (x, z, r = 12, h = 30, tex = 'chrome', y) => post(ctx => ctx.props.barrel(x, z, atY(ctx, x, z, y), r, h, tex));
  K.desk = (x0, z0, x1, z1, facing = 'pz', monitorTex = 'monitors') => post(ctx => { // security desk with monitor bank
    const y0 = atY(ctx, (x0 + x1) / 2, (z0 + z1) / 2);
    ctx.brush([x0, y0, z0], [x1, y0 + 40, z1], { tex: 'jaildark', [facing]: 'drawer', top: 'metal' });
    const n = facing; const o = { px: [1, 0], nx: [-1, 0], pz: [0, 1], nz: [0, -1] }[n];
    const mx = (x0 + x1) / 2 - o[0] * ((x1 - x0) / 2 - 8), mz = (z0 + z1) / 2 - o[1] * ((z1 - z0) / 2 - 8);
    const span = o[0] ? (z1 - z0) * 0.7 : (x1 - x0) * 0.7;
    if (o[0]) ctx.brush([mx - 4, y0 + 40, mz - span / 2], [mx + 4, y0 + 76, mz + span / 2], { tex: 'metal', solid: false }); else ctx.brush([mx - span / 2, y0 + 40, mz - 4], [mx + span / 2, y0 + 76, mz + 4], { tex: 'metal', solid: false });
    ctx.decal({ at: [mx + o[0] * 4, y0 + 58, mz + o[1] * 4], n, w: span - 6, h: 30, tex: monitorTex, fullbright: true, off: 0.6 });
    ctx.light(mx + o[0] * 40, y0 + 60, mz + o[1] * 40, 150, [0.45, 0.65, 1]);
  });
  // A two-tier jail cell block built from brushes against a wall (like Hornt Jail): ground cells, a slab,
  // upper cells and a railed catwalk in front of the upper tier. dir = +1 if the cells open toward +Z.
  // o: {x0, zWall, dir, count, y0, numbers[], broken[], open[], loot(tier,i,cx,cz), name(tier,i), catStairs:'w'|'e'|null}
  K.cellBlock = (o) => post(ctx => {
    const cw = o.cw || 96, dep = o.depth || 128, wt = 16, th = o.tierH || 120, sl = 16, y0 = o.y0 ?? 0, dir = o.dir ?? 1, cat = o.catW || 64;
    const zb = o.zWall, zf = zb + dir * dep; const z0 = Math.min(zb, zf), z1 = Math.max(zb, zf);
    const xEnd = o.x0 + o.count * (cw + wt) + wt;
    const n = dir > 0 ? 'pz' : 'nz';
    for (let tier = 0; tier < (o.tiers || 2); tier++) {
      const yb = y0 + tier * (th + sl), yt = yb + th;
      for (let i = 0; i <= o.count; i++) { const x = o.x0 + i * (cw + wt); ctx.brush([x, yb, z0], [x + wt, yt, z1], { tex: o.wall || 'jailmetal', [dir > 0 ? 'nz' : 'pz']: o.wall || 'jailmetal' }); }
      ctx.brush([o.x0, yt, z0], [xEnd, yt + sl, z1], { tex: 'jaildark', bottom: 'plaster' }); // ceiling / next floor
      for (let i = 0; i < o.count; i++) {
        const cx0 = o.x0 + wt + i * (cw + wt), cx = cx0 + cw / 2, cz = (z0 + z1) / 2;
        ctx.decal({ at: [cx, yb + th * 0.55, zb], n, w: cw - 8, h: th * 0.8, tex: 'plaster', off: 0.5 });
        ctx.brush([cx0 + 6, yb, zb + dir * 6], [cx0 + 66, yb + 16, zb + dir * 40].map((v, k2) => v), { tex: 'metal', top: 'blanket' }); // bunk
        const idx = tier * o.count + i, broken = (o.broken || []).includes(idx), open = (o.open || []).includes(idx);
        if (!broken && !open) {
          const zz = zf - dir * 6; const mn = [cx0, yb, Math.min(zz, zz - dir * 10)], mx = [cx0 + cw, yt, Math.max(zz, zz - dir * 10)];
          ctx.mover({ type: 'door', min: mn, max: mx, tex: 'bars', name: o.name ? o.name(tier, i) : `cb_${o.x0}_${tier}_${i}`, targeted: true, wait: -1, lip: 8, speed: 140, skip: ['bottom'], dir: tier === 0 && (o.tiers || 2) > 1 ? -1 : 1 });   // ground-tier doors sink into the floor instead of rising through the cell above
        } else if (broken) {
          ctx.props.cylinder(cx - 22, yb, zf + dir * 18, 1.6, 70, 'metal', { rz: 1.25, segs: 6 }); ctx.props.cylinder(cx + 14, yb, zf + dir * 30, 1.6, 76, 'metal', { rx: 1.35, segs: 6 });
          ctx.decal({ at: [cx, yb + 60, zb], n, w: 70, h: 70, tex: 'cracked', off: 0.8 });
        }
        if (o.numbers && o.numbers[idx]) ctx.decal({ at: [cx, yt - 12, zf], n, w: 40, h: 18, tex: o.numbers[idx] });
        ctx.light(cx, yb + th - 30, cz, 120, [1, 0.8, 0.55]);
        ctx.props.cageLamp(cx0 - wt / 2, yb + th - 34, zf + dir * 8); ctx.light(cx0 - wt / 2, yb + th - 40, zf + dir * 26, 150, [1, 0.72, 0.4]);
        if (o.loot) o.loot(tier, i, cx, cz, yb);
      }
      if (tier > 0) { // catwalk in front of this tier, with railing
        const zc0 = Math.min(zf, zf + dir * cat), zc1 = Math.max(zf, zf + dir * cat);
        ctx.brush([o.x0, yb - sl, zc0], [xEnd, yb, zc1], { tex: 'grate', bottom: 'metal' });
        const zr = dir > 0 ? [zc1 - 2, zc1] : [zc0, zc0 + 2];
        const gaps = o.railGaps || [];
        let segs = [[o.x0, xEnd]]; for (const [g0, g1] of gaps) segs = segs.flatMap(([u, v]) => (g1 <= u || g0 >= v) ? [[u, v]] : [[u, g0], [g1, v]].filter(([p, q]) => q - p > 1));
        for (const [u, v] of segs) ctx.brush([u, yb, zr[0]], [v, yb + 34, zr[1]], { tex: 'railing', fit: true, noshadow: true });
        for (let x = o.x0 + 8; x < xEnd; x += cw + wt) ctx.brush([x, y0, zr[0] - (dir > 0 ? 6 : 0)], [x + 8, yb - sl, zr[1] + (dir > 0 ? 0 : 6)], { tex: 'metal' }); // supports
      }
    }
  });

  // ---------- Doom II-style building blocks (v0.25) ----------
  // outdoor yard: open sky at f + h, so its walls are h tall with sky above them (Doom's F_SKY1 courtyards)
  K.yard = (c0, r0, c1, r1, o) => { const ch = K.type({ f: o.f, c: o.f + (o.h || 256), floor: o.floor || 'dirt', ceil: 'sky', side: o.side || 'stepside', upper: o.upper, sky: true }); if (o.wall) K.room(c0, r0, c1, r1, { f: o.f, c: o.f + (o.h || 256), floor: o.floor || 'dirt', ceil: 'sky', side: o.side || 'stepside', upper: o.upper, sky: true }, o.wall); else K.paint(c0, r0, c1, r1, ch); return ch; };
  K.skySpec = (f, h, floor, side = 'stepside', upper) => ({ f, c: f + h, floor, ceil: 'sky', side, upper, sky: true });
  // room with chamfered (stepped) corners - the grid's answer to Doom's angled walls
  K.octo = (c0, r0, c1, r1, spec, ch = 2, wallTex) => {
    const t = K.room(c0, r0, c1, r1, spec, wallTex); const sol = K.solid(wallTex || defaultSolidTex);
    for (let i = 0; i < ch; i++) for (let j = 0; j < ch - i; j++) { K.paint(c0 + i, r0 + j, c0 + i, r0 + j, sol); K.paint(c1 - i, r0 + j, c1 - i, r0 + j, sol); K.paint(c0 + i, r1 - j, c0 + i, r1 - j, sol); K.paint(c1 - i, r1 - j, c1 - i, r1 - j, sol); }
    return t;
  };
  // nukage: green grease sludge, lowered floor, damage while you wade in it
  K.nukage = (c0, r0, c1, r1, spec, depth = 16, dps = 8) => K.pool(c0, r0, c1, r1, spec, 'sludge', depth, dps);
  // a window: raised sill + lowered lintel between two areas (shoot through, can't walk through)
  K.window = (c0, r0, c1, r1, f, c, side = 'trim', upper = 'trim', floor = 'metal', ceil = 'metal') => K.paint(c0, r0, c1, r1, K.type({ f, c, floor, ceil, side, upper }));
  // teleporter pad (glowing ring + light) that sends you to cell (dc, dr)
  K.teleporter = (c0, r0, c1, r1, dc, dr, angle = 0, o = {}) => {
    const x0 = X(c0), z0 = Z(r0), x1 = X(c1 + 1), z1 = Z(r1 + 1), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    post(ctx => {
      const y = o.y ?? ctx.floor(c0, r0), r = Math.min(x1 - x0, z1 - z0) / 2;
      ctx.ent({ type: 'teleport', min: [x0 + 4, y, z0 + 4], max: [x1 - 4, y + 96, z1 - 4], dest: [C(dc), (o.destY ?? ctx.floor(dc, dr)) + 24.1, C(dr)], angle });
      ctx.props.ring(cx, y + 2, cz, r - 12, r - 3, 4, 'x', 0, Math.PI * 2, 'chrome', 24);
      ctx.decal({ at: [cx, y, cz], n: 'up', w: (r - 12) * 2, h: (r - 12) * 2, tex: o.tex || 'glowgreen', fullbright: true, off: 0.6 });
      ctx.light(cx, y + 40, cz, 220, o.color || [0.4, 1, 0.5], 2);
      ctx.emitter({ min: [x0 + 10, y, z0 + 10], max: [x1 - 10, y + 30, z1 - 10], type: 'bubbles', rate: 6, color: o.color || [0.4, 1, 0.5] });
    });
  };
  // switch on a wall (a USE / shootable button) that targets a named mover
  K.switch = (x, y, z, n, target, msg, o = {}) => post(ctx => {
    const d = { px: [1, 0], nx: [-1, 0], pz: [0, 1], nz: [0, -1] }[n]; const ax = d[0] !== 0;
    const min = ax ? [x - (d[0] < 0 ? 6 : 0), y - 14, z - 14] : [x - 14, y - 14, z - (d[1] < 0 ? 6 : 0)];
    const max = ax ? [x + (d[0] > 0 ? 6 : 0), y + 14, z + 14] : [x + 14, y + 14, z + (d[1] > 0 ? 6 : 0)];
    ctx.brush(min, max, { tex: 'metal', solid: false, noshadow: true });
    ctx.decal({ at: [x + d[0] * 6.5, y, z + d[1] * 6.5], n, w: 22, h: 22, tex: o.green ? 'buttongreen' : 'button', off: 0.5, fullbright: true });
    ctx.light(x + d[0] * 30, y, z + d[1] * 30, 110, o.green ? [0.4, 1, 0.4] : [1, 0.4, 0.3]);
    ctx.button({ min: [min[0] - 2, min[1], min[2] - 2], max: [max[0] + 2, max[1], max[2] + 2], target, msg, shoot: true, wave: o.wave });
  });
  // a "Doom lift": plat over cells (c0,r0)-(c1,r1) from floor lowF up to highF
  K.liftCells = (c0, r0, c1, r1, lowF, highF, o = {}) => { K.lift([X(c0) + 2, lowF, Z(r0) + 2], [X(c1 + 1) - 2, lowF + 8, Z(r1 + 1) - 2], highF - lowF - 8, { wait: 3, ...o }); post(ctx => ctx.light(C((c0 + c1) / 2), lowF + 60, C((r0 + r1) / 2), 160, [1, 0.85, 0.5])); };
  // dough press (crusher): a block hanging under the ceiling at `top`, h thick, that slams down to floorY + 8 and back
  K.crusher = (c0, r0, c1, r1, top, floorY, o = {}) => post(ctx => {
    const h = o.h || 48; const m = ctx.mover({ type: 'crusher', min: [X(c0), top - h, Z(r0)], max: [X(c1 + 1), top, Z(r1 + 1)], tex: o.tex || 'support', topTex: 'metal', align: 'world', travel: top - h - floorY - 8, speed: o.speed || 200, wait: o.wait ?? 1.2, damage: o.damage || 10, skip: ['top'] });
    m.t = o.phase || 0;
    ctx.decal({ at: [(X(c0) + X(c1 + 1)) / 2, floorY, (Z(r0) + Z(r1 + 1)) / 2], n: 'up', w: X(c1 + 1) - X(c0) - 8, h: Z(r1 + 1) - Z(r0) - 8, tex: 'hazard', off: 0.3 });
  });
  // simple light strip down the middle of a hall (Doom LITE textures)
  K.strip = (x0, z0, x1, z1, y, step = 192, color = [1, 0.95, 0.85], light = 300) => { const alongX = Math.abs(x1 - x0) >= Math.abs(z1 - z0); const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / step)); for (let i = 0; i <= n; i++) { const t = n ? i / n : 0.5; K.fixture(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, y, 64, alongX ? 'x' : 'z', 'light', light, color); } };

  // Crypt of Hornt: fill the finished map with ruins and evil architecture (ruins.js). Call it last.
  K.ruins = (o = {}) => post(ctx => ruinify({ ...ctx, goals }, o));

  fn(K);
  const map = g.map(row => row.join(''));
  return {
    ...meta, map, legend, doors, defaultWall: defaultSolidTex, botGoals: goals,
    build(ctx) { for (const f of posts) f(ctx); },
  };
}
