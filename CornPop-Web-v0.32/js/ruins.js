// Crypt of Hornt ruin generator (v0.28). Runs as the last build step of a map and fills it with crumbling, evil architecture:
// ruined houses, broken colonnades, arches, obelisks, demon statues, altars, graves, dead trees and gibbets in the open areas,
// and buttresses, pilasters, torches, demon reliefs, chains, ceiling beams, rubble and blood along the walls and floors.
//
// It only builds where it is safe: every solid piece sits inside a flat, empty rectangle with a two-cell clear ring around it
// (so there is always a way round), and nothing is placed near pickups, monsters, doors, lifts, crushers, teleporters, triggers,
// hazards, map brushes or the bot's goals. The layout is seeded per map, so a map always looks the same.
const S = 32;
function rng32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const THEMES = {
  ruin: { wall: 'ruinwall', wall2: 'ruinwall2', dark: 'ruindark', trim: 'ruintrim', accent: 'runewall', floor: 'flagstone' },
  bone: { wall: 'ruinwall2', wall2: 'bonewall', dark: 'ruindark', trim: 'skullfrieze', accent: 'bonewall', floor: 'flagdark' },
  blood: { wall: 'bloodwall', wall2: 'ruindark', dark: 'ruindark', trim: 'ruintrim', accent: 'runewall', floor: 'flagblood' },
  hell: { wall: 'hellrock', wall2: 'ruindark', dark: 'obsidian', trim: 'ruintrim', accent: 'obsidian', floor: 'flagdark' },
  iron: { wall: 'ruindark', wall2: 'ironrust', dark: 'obsidian', trim: 'skullfrieze', accent: 'runewall', floor: 'flagdark' },
  bunker: { wall: 'bunkerplate', wall2: 'bunkerrust', dark: 'bunkerdark', trim: 'bunkertrim', accent: 'bunkerrust', floor: 'bunkerfloor' },
};

export function ruinify(ctx, o = {}) {
  const W = ctx.W, P = ctx.props, R = rng32(o.seed || 1), TH = { ...THEMES[o.theme || 'ruin'], ...(o.tex || {}) };
  const rnd = (a, b) => a + R() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1)), pick = a => a[Math.floor(R() * a.length)], chance = p => R() < p;
  const GW = W.W, GH = W.H, cell = (c, r) => W.cell(c, r);
  const dens = o.density ?? 1; let lights = o.lights ?? 16;
  const stats = { big: 0, wall: 0, scatter: 0, beams: 0 };
  // mode 'bunker' (Episode 3, the Pidser Cave): the same placement rules, but the pieces are bunker fittings instead of ruins:
  // pizzas on stone slabs, kegs, crates and pizza boxes, steel pillars, pendant lamps, workbenches; cage lamps, ribs with brackets,
  // pipes and fuse boxes along the walls; I-beams and pipes under the ceilings. `wreck` adds riot rubble (the jail breakout).
  const bunker = o.mode === 'bunker';

  // ---------------- what is already there ----------------
  const occ = new Uint8Array(GW * GH);
  const mark = (x0, z0, x1, z1, grow = 0) => { for (let r = Math.max(0, Math.floor(z0 / S) - grow); r <= Math.min(GH - 1, Math.floor((z1 - 0.01) / S) + grow); r++) for (let c = Math.max(0, Math.floor(x0 / S) - grow); c <= Math.min(GW - 1, Math.floor((x1 - 0.01) / S) + grow); c++) occ[r * GW + c] = 1; };
  for (const e of ctx.ents()) {
    if (e.min && e.max) { if (e.type === 'message') continue; mark(e.min[0], e.min[2], e.max[0], e.max[2], e.type === 'secret' ? 0 : 1); }
    else if (e.pos) mark(e.pos[0], e.pos[2], e.pos[0], e.pos[2], e.type === 'start' ? 3 : ['qoq', 'marv', 'ballinki', 'frenta', 'beans'].includes(e.type) ? 2 : 1);
    if (e.dest) mark(e.dest[0], e.dest[2], e.dest[0], e.dest[2], 2);
  }
  for (let i = ctx.gridBrushes; i < W.brushes.length; i++) { const b = W.brushes[i]; if (b.max[0] - b.min[0] > 3000 || b.max[2] - b.min[2] > 3000) continue; mark(b.min[0], b.min[2], b.max[0], b.max[2], 1); }
  for (const m of W.movers) mark(m.min[0], m.min[2], m.max[0], m.max[2], 2);
  for (const g of ctx.goals || []) mark(g.x, g.z, g.x, g.z, 1);
  for (const [c0, r0, c1, r1] of o.keep || []) mark(c0 * S, r0 * S, (c1 + 1) * S, (r1 + 1) * S);            // areas the map wants left alone
  const free = (c, r) => c >= 0 && r >= 0 && c < GW && r < GH && !cell(c, r).solid && !occ[r * GW + c];
  // a flat, empty rectangle (same floor, same indoor/outdoor, enough headroom)?
  const flat = (c0, r0, w, d, head = 0) => { if (c0 < 0 || r0 < 0 || c0 + w > GW || r0 + d > GH) return null; const e0 = cell(c0, r0); if (e0.solid) return null;
    for (let r = r0; r < r0 + d; r++) for (let c = c0; c < c0 + w; c++) { if (!free(c, r)) return null; const e = cell(c, r); if (e.f !== e0.f || !!e.sky !== !!e0.sky || e.c - e.f < head || e.roof != null) return null; }
    return e0; };
  const take = (c0, r0, w, d) => { for (let r = r0; r < r0 + d; r++) for (let c = c0; c < c0 + w; c++) if (r >= 0 && c >= 0 && r < GH && c < GW) occ[r * GW + c] = 1; };

  // ---------------- building blocks ----------------
  // a box: centre x,z, bottom y. Tall boxes are stacked from chunks so the vertex lighting follows the light up the wall.
  const box = (x, y, z, w, h, d, tex, q = {}) => { if (q.ry || q.rx || q.rz || h <= 80) { P.box(x, y, z, w, h, d, Array.isArray(tex) ? tex : [tex, tex, q.top || tex, null, tex, tex], q); return; }
    const n = Math.ceil(h / 72); for (let i = 0; i < n; i++) P.box(x, y + h * i / n, z, w, h / n, d, Array.isArray(tex) ? tex : [tex, tex, i === n - 1 ? q.top || tex : null, null, tex, tex], q); };
  const solid = (x0, y0, z0, x1, y1, z1) => ctx.brush([x0, y0, z0], [x1, y1, z1], { invisible: true });
  const stick = (p, ry, tilt, len, r0, r1, tex, segs = 6) => { const dx = Math.sin(ry) * Math.sin(tilt), dy = Math.cos(tilt), dz = Math.cos(ry) * Math.sin(tilt); P.cylinder(p[0] + dx * len / 2, p[1] + dy * len / 2 - len / 2, p[2] + dz * len / 2, r0, len, tex, { rTop: r1, ry, rx: tilt, segs }); return [p[0] + dx * len, p[1] + dy * len, p[2] + dz * len]; };
  const light = (x, y, z, l, col, style = 0) => { if (lights <= 0) return false; lights--; ctx.light(x, y, z, l, col, style, { raw: true }); return true; };
  const fire = (x, y, z, size) => ctx.ent({ type: 'fire', pos: [x, y, z], size, smoke: false });
  const rubble = (x, z, y, rad, n, big = 1) => { for (let i = 0; i < n; i++) { const a = R() * 6.3, d = Math.sqrt(R()) * rad, s = rnd(5, 13) * big; P.box(x + Math.cos(a) * d, y - s * 0.3, z + Math.sin(a) * d, s * rnd(0.8, 1.6), s, s * rnd(0.7, 1.3), [pick([TH.wall, 'rubble', TH.wall2]), null, 'rubble', null, 'rubble', 'rubble'].map((t, k) => k === 0 ? t : t || (k === 3 ? null : 'rubble')), { ry: R() * 3.1, rx: rnd(-0.5, 0.5), rz: rnd(-0.5, 0.5) }); } };
  const skulls = (x, z, y, n, rad = 10) => { for (let i = 0; i < n; i++) { const a = R() * 6.3, d = Math.sqrt(R()) * rad; P.sphere(x + Math.cos(a) * d, y + 3 + (i % 3 === 2 ? 5 : 0), z + Math.sin(a) * d, 4, 'bonewall', { segs: 7, rings: 5, sy: 1.1, ry: R() * 6, uvScale: [0.3, 0.3] }); } };
  // a stretch of ruined wall between two points (axis-aligned, `th` thick): a ragged, crumbling top; returns its footprint
  const wallRun = (x0, z0, x1, z1, y, h, th = 16, tex = TH.wall, shape = 'broken') => {
    const alongX = Math.abs(x1 - x0) >= Math.abs(z1 - z0), len = alongX ? x1 - x0 : z1 - z0, n = Math.max(1, Math.round(Math.abs(len) / 20)); let cur = shape === 'low' ? rnd(0.2, 0.4) : rnd(0.6, 1);
    const hs = []; for (let i = 0; i < n; i++) { if (chance(0.45)) cur += rnd(-0.32, 0.2); cur = Math.max(shape === 'low' ? 0.12 : 0.22, Math.min(1, cur)); hs.push(Math.round(h * cur / 8) * 8); }
    for (let i = 0; i < n; i++) { const a = (i + 0.5) / n, cx = alongX ? x0 + len * a : x0 + th / 2, cz = alongX ? z0 + th / 2 : z0 + len * a, w = Math.abs(len) / n + 0.2;
      box(cx, y, cz, alongX ? w : th, hs[i], alongX ? th : w, tex, { top: 'rubble' });
      if (i % 2 === 1 || i === n - 1) { const hh = Math.max(hs[i], hs[i - 1] ?? 0), a0 = (i - (i % 2 === 1 ? 1 : 0)) / n, a1 = (i + 1) / n;
        if (alongX) solid(Math.min(x0 + len * a0, x0 + len * a1), y, z0 < z1 ? z0 : z1, Math.max(x0 + len * a0, x0 + len * a1), y + hh, Math.max(z0, z1) + (z0 === z1 ? th : 0));
        else solid(Math.min(x0, x1), y, Math.min(z0 + len * a0, z0 + len * a1), Math.max(x0, x1) + (x0 === x1 ? th : 0), y + hh, Math.max(z0 + len * a0, z0 + len * a1)); }
    }
    return hs;
  };
  const column = (x, z, y, h, r, intact, tex = TH.wall) => { // a round column on a square base; broken ones end in a jagged stump
    box(x, y, z, r * 2 + 12, 8, r * 2 + 12, TH.dark); P.cylinder(x, y + 8, z, r, h - 8, tex, { segs: 10, rTop: r * 0.9 });
    if (intact) { box(x, y + h, z, r * 2 + 6, 6, r * 2 + 6, TH.trim); box(x, y + h + 6, z, r * 2 + 16, 8, r * 2 + 16, TH.dark); }
    else P.cylinder(x + rnd(-2, 2), y + h, z + rnd(-2, 2), r * 0.85, rnd(6, 14), 'rubble', { segs: 5, rTop: r * 0.3, ry: R() * 3 });
    solid(x - r, y, z - r, x + r, y + h + (intact ? 14 : 8), z + r);
  };
  const tree = (x, z, y, h) => { const lean = rnd(0, 0.18), ry0 = R() * 6.3; let top = stick([x, y - 4, z], ry0, lean, h, 9, 5, 'deadbark', 7); solid(x - 8, y, z - 8, x + 8, y + h * 0.8, z + 8);
    for (let i = 0; i < ri(4, 6); i++) { const a = R() * 6.3, t = rnd(0.5, 1.0), base = [x + Math.sin(ry0) * Math.sin(lean) * h * t, y + h * t * rnd(0.55, 1), z + Math.cos(ry0) * Math.sin(lean) * h * t]; const e = stick(base, a, rnd(0.6, 1.15), rnd(26, 54), 3.4, 1.2, 'deadbark', 5); if (chance(0.7)) stick(e, a + rnd(-0.9, 0.9), rnd(0.3, 1.0), rnd(12, 26), 1.4, 0.4, 'deadbark', 4); }
    stick(top, ry0 + 1, 0.5, 20, 3, 0.6, 'deadbark', 5); };
  const obelisk = (x, z, y, h) => { box(x, y, z, 60, 10, 60, TH.dark); box(x, y + 10, z, 46, 10, 46, TH.wall);
    P.cylinder(x, y + 20, z, 21, h - 46, 'runewall', { segs: 4, rTop: 13, ry: Math.PI / 4, uvScale: [4, Math.max(1, (h - 46) / 64)] }); P.cylinder(x, y + h - 26, z, 13, 26, 'obsidian', { segs: 4, rTop: 0.5, ry: Math.PI / 4 });
    solid(x - 24, y, z - 24, x + 24, y + h, z + 24); if (light(x, y + h * 0.55, z + 34, 210, [1, 0.22, 0.08], 4)) { P.sphere(x, y + h + 3, z, 4, 'ember', { fullbright: true, segs: 6, rings: 5 }); } };
  const statue = (x, z, y, n) => { // a horned demon on a plinth, facing n (0..3 = +z, +x, -z, -x)
    const ry = n * Math.PI / 2, f = [Math.sin(ry), Math.cos(ry)], s = [Math.cos(ry), -Math.sin(ry)], at = (a, b) => [x + s[0] * a + f[0] * b, z + s[1] * a + f[1] * b]; const D = TH.dark;
    box(x, y, z, 56, 12, 56, TH.wall); box(x, y + 12, z, 44, 36, 44, [D, D, D, null, D, D].map((t, i) => t), {}); P.box(x, y + 20, z, 45, 14, 45, ['skullfrieze', 'skullfrieze', null, null, 'skullfrieze', 'skullfrieze'], { fit: true });
    const b = y + 48; for (const k of [-1, 1]) { const [lx, lz] = at(k * 9, 0); P.box(lx, b, lz, 12, 34, 14, D, { ry }); const [ax, az] = at(k * 21, 3); P.box(ax, b + 40, az, 9, 34, 11, D, { ry, rz: 0 }); const [wx, wz] = at(k * 27, -10); P.box(wx, b + 34, wz, 4, 62, 30, D, { ry: ry + k * 0.5, rz: -k * 0.28 }); }
    P.box(x, b + 34, z, 34, 40, 20, D, { ry }); const [hx, hz] = at(0, 2);
    const tx = ['ruindark', 'ruindark', 'ruindark', null, 'ruindark', 'ruindark']; tx[[4, 0, 5, 1][n]] = 'demonface'; P.box(hx, b + 74, hz, 28, 28, 26, tx, { fit: true });
    for (const k of [-1, 1]) { const [qx, qz] = at(k * 11, 0); stick([qx, b + 98, qz], ry + k * Math.PI / 2, 0.75, 22, 4, 0.5, 'obsidian', 5); }
    solid(x - 24, y, z - 24, x + 24, y + 150, z + 24); const [gx, gz] = at(0, 30); light(gx, b + 80, gz, 140, [1, 0.25, 0.08], 2); };
  const altar = (x, z, y, alongX) => { const w = alongX ? 76 : 44, d = alongX ? 44 : 76; for (const k of [-1, 1]) box(x + (alongX ? k * 24 : 0), y, z + (alongX ? 0 : k * 24), alongX ? 18 : 34, 28, alongX ? 34 : 18, TH.dark);
    box(x, y + 28, z, w, 9, d, [TH.wall, TH.wall, 'flagblood', null, TH.wall, TH.wall]); solid(x - w / 2, y, z - d / 2, x + w / 2, y + 37, z + d / 2);
    ctx.decal({ at: [x, y, z], n: 'up', w: 184, h: 184, tex: 'pentagram', fullbright: true, off: 0.5 }); skulls(x, z, y + 37, 3, 12);
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const cx = x + a * (w / 2 + 16), cz = z + b * (d / 2 + 16); P.cylinder(cx, y, cz, 2.2, 30, 'bonewall', { segs: 6 }); fire(cx, y + 30, cz, 7); }
    light(x, y + 70, z, 230, [1, 0.3, 0.12], 1); };
  const grave = (x, z, y) => { const ry = rnd(-0.15, 0.15), rz = rnd(-0.22, 0.22), h = rnd(26, 40); P.box(x, y - 3, z, 22, h, 7, TH.wall2, { ry, rz }); if (chance(0.5)) P.box(x, y + h - 6, z, 30, 7, 7, TH.wall2, { ry, rz }); solid(x - 11, y, z - 4, x + 11, y + h - 4, z + 4);
    P.box(x, y - 5, z + 26, 26, 9, 44, 'bloodsoil', { ry }); };
  const gibbet = (x, z, y, h, n) => { const ry = n * Math.PI / 2, f = [Math.sin(ry), Math.cos(ry)]; box(x, y, z, 9, h, 9, 'deadbark'); P.box(x + f[0] * 20, y + h - 9, z + f[1] * 20, f[0] ? 50 : 8, 8, f[1] ? 50 : 8, 'deadbark'); stick([x + f[0] * 4, y + h - 34, z + f[1] * 4], ry, 0.8, 34, 3, 3, 'deadbark', 4);
    const cx = x + f[0] * 38, cz = z + f[1] * 38, cl = rnd(18, 34), ct = y + h - 9 - cl; P.box(cx, ct, cz, 1.6, cl, 1.6, 'ironrust');
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P.box(cx + a * 9, ct - 44, cz + b * 9, 1.6, 44, 1.6, 'ironrust'); for (const yy of [ct - 44, ct - 22, ct - 2]) for (const [a, b, w, d] of [[0, -9, 20, 1.6], [0, 9, 20, 1.6], [-9, 0, 1.6, 20], [9, 0, 1.6, 20]]) P.box(cx + a, yy, cz + b, w, 1.6, d, 'ironrust');
    skulls(cx, cz, ct - 42, 2, 4); solid(x - 5, y, z - 5, x + 5, y + h, z + 5); };
  const sarcophagus = (x, z, y, alongX) => { const w = alongX ? 70 : 30, d = alongX ? 30 : 70; box(x, y, z, w + 8, 8, d + 8, TH.dark); box(x, y + 8, z, w, 24, d, TH.wall); P.box(x + rnd(-4, 4), y + 32, z + rnd(-4, 4), w + 4, 7, d + 4, [TH.dark, TH.dark, 'skullfrieze', null, TH.dark, TH.dark], { ry: rnd(-0.16, 0.16), rz: chance(0.3) ? 0.12 : 0 }); solid(x - w / 2, y, z - d / 2, x + w / 2, y + 38, z + d / 2); };
  const brazier = (x, z, y) => { P.cylinder(x, y, z, 4, 34, 'ironrust', { segs: 6 }); P.cylinder(x, y + 34, z, 6, 9, 'ironrust', { segs: 8, rTop: 13 }); P.cylinder(x, y, z, 11, 3, 'ironrust', { segs: 8 }); P.sphere(x, y + 42, z, 9, 'ember', { fullbright: true, segs: 8, rings: 4, sy: 0.4 }); fire(x, y + 42, z, 15); solid(x - 9, y, z - 9, x + 9, y + 44, z + 9); light(x, y + 70, z, 250, [1, 0.5, 0.18], 1); };

  // ---- bunker fittings ----
  const pizzaslab = (x, z, y) => { box(x, y, z, 80, 30, 80, TH.dark); box(x, y + 30, z, 94, 8, 94, TH.wall); P.pizza(x, y + 38, z, 42); solid(x - 47, y, z - 47, x + 47, y + 40, z + 47); };
  const keg = (x, z, y) => { P.cylinder(x, y, z, 11, 30, 'bunkerdark', { segs: 10, capTex: 'metal' }); for (const yy of [1, 13, 26]) P.cylinder(x, y + yy, z, 11.8, 2.5, 'metal', { segs: 10 }); P.cylinder(x + 4, y + 30, z, 2, 2, 'metal', { segs: 6 }); };
  const kegs = (x, z, y) => { const n = ri(2, 3); for (let i = 0; i < n; i++) keg(x + [-13, 13, 0][i], z + [-10, -6, 14][i], y); if (chance(0.4)) P.cylinder(x + 12, y - 0, z + 16, 11, 30, 'bunkerrust', { segs: 10, rz: Math.PI / 2, capTex: 'metal' }); solid(x - 26, y, z - 24, x + 26, y + 30, z + 27); };
  const cratestack = (x, z, y) => { const ry = rnd(-0.2, 0.2); P.box(x - 8, y, z, 38, 22, 28, ['bunkerrust', 'bunkerrust', 'bunkerdark', null, 'bunkerrust', 'bunkerrust'], { ry }); if (chance(0.6)) P.box(x - 6, y + 22, z + 2, 30, 18, 24, ['bunkerplate', 'bunkerplate', 'bunkerdark', null, 'bunkerplate', 'bunkerplate'], { ry: ry + rnd(-0.3, 0.3) });
    const n = ri(2, 5); for (let i = 0; i < n; i++) P.box(x + 18, y + i * 4, z + 14, 26, 4, 26, ['pizzabox', 'pizzabox', 'pizzabox', null, 'pizzabox', 'pizzabox'], { ry: rnd(-0.4, 0.4) }); solid(x - 28, y, z - 16, x + 30, y + 30, z + 28); };
  const steelpillar = (x, z, y, h) => { box(x, y, z, 22, h, 22, TH.wall); box(x, y, z, 32, 8, 32, TH.dark); P.box(x, y + h - 8, z, 34, 8, 34, TH.dark); P.box(x, y + h * 0.5, z, 24, 6, 24, TH.trim);
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) P.box(x + a * 19, y + h - 30, z + b * 19, 4, 34, 4, TH.dark, a ? { rz: -a * 0.75 } : { rx: b * 0.75 }); solid(x - 11, y, z - 11, x + 11, y + h, z + 11); };
  const hanglamp = (x, z, y, h) => { const ly = y + Math.max(100, h - 70), len = y + h - ly - 9; if (len < 4 || !light(x, ly - 12, z, 270, [1, 0.72, 0.4])) return false; P.box(x, ly + 9, z, 1.6, len, 1.6, 'metal'); P.cylinder(x, ly, z, 15, 9, 'bunkerdark', { segs: 10, rTop: 4 }); P.sphere(x, ly - 1, z, 4.5, 'glow', { fullbright: true, segs: 8, rings: 5 }); return true; };
  const bench = (x, z, y, alongX) => { const w = alongX ? 88 : 30, d = alongX ? 30 : 88; box(x, y + 32, z, w, 5, d, ['bunkerrust', 'bunkerrust', 'bunkerplate', null, 'bunkerrust', 'bunkerrust']); for (const k of [-1, 1]) box(x + (alongX ? k * 34 : 0), y, z + (alongX ? 0 : k * 34), alongX ? 18 : 26, 32, alongX ? 26 : 18, 'drawer');
    P.box(x + rnd(-20, 20) * (alongX ? 1 : 0.2), y + 37, z + rnd(-20, 20) * (alongX ? 0.2 : 1), 14, 7, 9, 'bunkerdark', { ry: R() * 3 }); P.cylinder(x + (alongX ? 26 : 4), y + 37, z + (alongX ? 4 : 26), 2.6, 5, 'metal', { segs: 8 }); P.box(x - (alongX ? 20 : 3), y + 37, z - (alongX ? 3 : 20), 12, 1.2, 9, 'pizzabox', { ry: R() * 3 });
    solid(x - w / 2, y, z - d / 2, x + w / 2, y + 37, z + d / 2); };
  const roofvent = (x, z, y) => { box(x, y, z, 44, 26, 40, ['bunkerplate', 'bunkerplate', 'grate', null, 'bunkerplate', 'bunkerplate']); P.box(x, y + 26, z, 30, 6, 26, 'bunkerdark'); solid(x - 22, y, z - 20, x + 22, y + 32, z + 20); };
  const dumpster = (x, z, y, alongX) => { const w = alongX ? 74 : 40, d = alongX ? 40 : 74; box(x, y, z, w, 42, d, ['bunkerdark', 'bunkerdark', 'metal', null, 'bunkerdark', 'bunkerdark']); P.box(x, y + 42, z, w + 3, 4, d + 3, 'bunkerrust', alongX ? { rx: 0.08 } : { rz: 0.08 }); solid(x - w / 2, y, z - d / 2, x + w / 2, y + 46, z + d / 2); };

  // ---------------- 1. set pieces in the open areas ----------------
  const cells = []; for (let r = 2; r < GH - 2; r++) for (let c = 2; c < GW - 2; c++) if (free(c, r)) cells.push([c, r]);
  for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
  const OUT = bunker ? [['kegs', 2, 2, 2], ['crates', 2, 2, 3], ['dumpster', 3, 2, 1.4], ['dumpster', 2, 3, 1.4], ['roofvent', 2, 2, o.roof ? 5 : 0.6]] : [['house', 6, 6, 3], ['house', 5, 7, 2], ['colonnade', 7, 1, 3], ['colonnade', 1, 7, 3], ['arch', 4, 1, 2], ['arch', 1, 4, 2], ['obelisk', 2, 2, 2], ['statue', 2, 2, 2], ['altar', 3, 3, 1.4], ['graves', 5, 4, 1.6], ['tree', 1, 1, 3.2], ['gibbet', 2, 2, 1.2], ['tower', 4, 4, 1.6], ['brazier', 1, 1, 1.4], ['wallbit', 4, 1, 3], ['wallbit', 1, 4, 3]];
  const IN = bunker ? [['pizzaslab', 3, 3, 1.6], ['kegs', 2, 2, 2.4], ['crates', 2, 2, 2.6], ['steelpillar', 1, 1, 2.6], ['hanglamp', 1, 1, 3.4], ['bench', 3, 1, 1.2], ['bench', 1, 3, 1.2]] : [['pillars', 5, 1, 2], ['pillars', 1, 5, 2], ['statue', 2, 2, 1.6], ['altar', 3, 3, 1], ['sarco', 3, 2, 2], ['sarco', 2, 3, 2], ['column', 1, 1, 3], ['gibbet', 2, 2, 0.8], ['brazier', 1, 1, 1.6], ['wallbit', 3, 1, 1.4], ['wallbit', 1, 3, 1.4]];
  const maxBig = Math.round((o.big ?? 26) * dens), counts = {}; const cap = { house: 3, tower: 2, altar: 3, statue: 5, obelisk: 4, graves: 3, gibbet: 4, brazier: 5, pizzaslab: 4, bench: 4, hanglamp: 9, ...(o.cap || {}) };
  const weighted = list => { let t = 0; for (const k of list) t += k[3]; let v = R() * t; for (const k of list) { v -= k[3]; if (v <= 0) return k; } return list[0]; };
  for (const [c, r] of cells) {
    if (stats.big >= maxBig) break; if (!free(c, r)) continue;
    const out = !!cell(c, r).sky; if (out ? o.outdoor === false : o.indoor === false) continue;
    // try a few kinds here. Small pieces need a one-cell clear ring around them, big ones two cells.
    let kind, w, d, e = null, ring = 2; for (let t = 0; t < 4 && !e; t++) { [kind, w, d] = weighted(out ? OUT : IN); if ((counts[kind] || 0) >= (cap[kind] ?? 99)) continue; ring = w * d <= 4 ? 1 : 2;
      e = flat(c - ring, r - ring, w + ring * 2, d + ring * 2, kind === 'tree' || kind === 'graves' || kind === 'sarco' ? 100 : 120); }
    if (!e) continue;
    const y = e.f, H = Math.min(e.c - e.f - (out ? 12 : 0), out ? 208 : 400), x0 = c * S, z0 = r * S, x1 = (c + w) * S, z1 = (r + d) * S, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
    if (kind === 'house') { // the shell of a building: four crumbling walls with doorways, something nasty inside
      const hh = Math.min(H, rnd(120, 190)), th = 18, gapSide = ri(0, 3);
      for (let side = 0; side < 4; side++) { const horiz = side < 2, a0 = horiz ? x0 : z0, a1 = horiz ? x1 : z1, fix = side === 0 ? z0 : side === 1 ? z1 - th : side === 2 ? x0 : x1 - th; const low = side === gapSide || chance(0.25);
        const gw = rnd(52, 76), g0 = a0 + 26 + R() * (a1 - a0 - 52 - gw), segs = [[a0, g0], [g0 + gw, a1]];
        for (const [u, v] of segs) { if (v - u < 12) continue; if (horiz) wallRun(u, fix, v, fix, y, hh, th, chance(0.3) ? TH.wall2 : TH.wall, low ? 'low' : 'broken'); else wallRun(fix, u, fix, v, y, hh, th, chance(0.3) ? TH.wall2 : TH.wall, low ? 'low' : 'broken'); }
        if (!low && chance(0.6)) { const lx = horiz ? g0 + gw / 2 : fix + th / 2, lz = horiz ? fix + th / 2 : g0 + gw / 2; P.box(lx, y + 92, lz, horiz ? gw + 30 : th + 4, 14, horiz ? th + 4 : gw + 30, TH.dark); } }
      for (const [cx, cz] of [[x0 + 9, z0 + 9], [x1 - 9, z0 + 9], [x0 + 9, z1 - 9], [x1 - 9, z1 - 9]]) { const ch = hh * rnd(0.5, 1.05); box(cx, y, cz, 26, Math.min(H, ch), 26, TH.dark, { top: 'rubble' }); solid(cx - 13, y, cz - 13, cx + 13, y + Math.min(H, ch), cz + 13); }
      const inside = pick(['altar', 'statue', 'sarco', 'brazier']); if (inside === 'altar' && (counts.altar || 0) < cap.altar) { altar(mx, mz, y, w >= d); counts.altar = (counts.altar || 0) + 1; } else if (inside === 'statue') statue(mx, mz, y, ri(0, 3)); else if (inside === 'sarco') sarcophagus(mx, mz, y, w >= d); else brazier(mx, mz, y);
      rubble(mx, mz, y, Math.min(w, d) * 12, 14); ctx.decal({ at: [mx + rnd(-30, 30), y, mz + rnd(-30, 30)], n: 'up', w: 70, h: 70, tex: 'bloodpool', off: 0.35 });
    } else if (kind === 'colonnade' || kind === 'pillars') { // a row of columns, most of them broken, with what is left of the lintel
      const alongX = w > d, n = Math.floor((alongX ? w : d) / 2) + 1, hh = kind === 'pillars' ? e.c - e.f - 14 : Math.min(H - 20, rnd(130, 176)), ok = [];
      for (let i = 0; i < n; i++) { const px = alongX ? x0 + 16 + i * 64 : mx, pz = alongX ? mz : z0 + 16 + i * 64; const intact = kind === 'pillars' ? chance(0.75) : chance(0.45); ok.push(intact); column(px, pz, y, intact ? hh : hh * rnd(0.2, 0.75), kind === 'pillars' ? 13 : 14, intact, chance(0.3) ? TH.wall2 : TH.wall);
        if (!intact) { rubble(px, pz, y, 30, 5); P.cylinder(px + rnd(-34, 34), y - 9, pz + rnd(-34, 34), 13, rnd(26, 44), TH.wall, { segs: 10, rz: Math.PI / 2, ry: R() * 3 }); }
        if (i > 0 && intact && ok[i - 1] && kind === 'colonnade') P.box(alongX ? px - 32 : px, y + hh + 14, alongX ? pz : pz - 32, alongX ? 104 : 30, 18, alongX ? 30 : 104, TH.dark); }
    } else if (kind === 'arch') { // a gateway standing alone: two piers and the arch between them
      const alongX = w > d, hh = Math.min(H - 8, rnd(140, 180)), span = 44, cx = mx, cz = mz;
      for (const k of [-1, 1]) { const px = alongX ? cx + k * (span + 14) : cx, pz = alongX ? cz : cz + k * (span + 14); box(px, y, pz, alongX ? 28 : 26, hh - 30, alongX ? 26 : 28, TH.wall); box(px, y, pz, alongX ? 36 : 34, 10, alongX ? 34 : 36, TH.dark); solid(px - 14, y, pz - 14, px + 14, y + hh, pz + 14); }
      const whole = chance(0.6); P.ring(cx, y + hh - 30 - span + 14, cz, span, span + 22, 26, alongX ? 'z' : 'x', whole ? 0 : rnd(1.4, 1.9), Math.PI, TH.dark, 14);
      if (whole) { P.box(cx, y + hh - 2, cz, alongX ? span * 2 + 60 : 30, 12, alongX ? 30 : span * 2 + 60, TH.trim); P.box(cx, y + hh - 26, cz + (alongX ? 13.5 : 0), alongX ? 24 : 1, 24, alongX ? 1 : 24, 'demonface', { fit: true }); } else rubble(cx + (alongX ? 30 : 0), cz + (alongX ? 0 : 30), y, 26, 9, 1.4);
    } else if (kind === 'obelisk') obelisk(mx, mz, y, Math.min(H, rnd(150, 200)));
    else if (kind === 'statue') statue(mx, mz, y, ri(0, 3));
    else if (kind === 'altar') { altar(mx, mz, y, chance(0.5)); if (out) for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const px = mx + a * 44, pz = mz + b * 44; P.cylinder(px, y, pz, 5, rnd(40, 90), TH.wall, { segs: 6, rTop: 4 }); } }
    else if (kind === 'graves') { for (let gz = 0; gz < d; gz += 2) for (let gx = 0; gx < w; gx++) if (chance(0.8)) grave(x0 + 16 + gx * 32 + rnd(-4, 4), z0 + 14 + gz * 32, y); tree(x1 - 14, z1 - 20, y, Math.min(H - 10, rnd(90, 130)));
      for (const [a, b, c2, d2] of [[x0 - 2, z0 - 6, x1 + 2, z0 - 4], [x0 - 4, z0 - 6, x0 - 2, z1 + 2]]) ctx.brush([a, y, b], [c2, y + 40, d2], { tex: 'spikefence', fit: true, noshadow: true }); }
    else if (kind === 'tree') tree(mx, mz, y, Math.min(H - 12, rnd(90, 150)));
    else if (kind === 'gibbet') gibbet(mx, mz, y, Math.min(H - 6, 150), ri(0, 3));
    else if (kind === 'tower') { // the stump of a round tower, broken open on one side
      const rad = 54, hh = Math.min(H, rnd(130, 200)), open = R() * 6.3; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, da = Math.abs(Math.atan2(Math.sin(a - open), Math.cos(a - open))); if (da < 0.6) continue; const ph = Math.max(24, Math.round(hh * Math.min(1, 0.25 + da / 3.14 * rnd(0.7, 1.1)) / 8) * 8), px = mx + Math.cos(a) * rad, pz = mz + Math.sin(a) * rad;
        box(px, y, pz, 30, ph, 30, i % 3 ? TH.wall : TH.wall2, { ry: -a, top: 'rubble' }); solid(px - 14, y, pz - 14, px + 14, y + ph, pz + 14); }
      rubble(mx + Math.cos(open) * 60, mz + Math.sin(open) * 60, y, 34, 12, 1.5); if (chance(0.5)) brazier(mx, mz, y); else skulls(mx, mz, y, 9, 22);
    } else if (kind === 'brazier') brazier(mx, mz, y);
    else if (kind === 'sarco') sarcophagus(mx, mz, y, w > d);
    else if (kind === 'column') { const intact = chance(0.5); column(mx, mz, y, intact ? e.c - e.f - 14 : (e.c - e.f) * rnd(0.2, 0.6), 14, intact); if (!intact) rubble(mx, mz, y, 34, 7); }
    else if (kind === 'wallbit') { const alongX = w > d; if (alongX) wallRun(x0 + 4, mz - 8, x1 - 4, mz - 8, y, Math.min(H, rnd(70, 150)), 16, TH.wall, chance(0.4) ? 'low' : 'broken'); else wallRun(mx - 8, z0 + 4, mx - 8, z1 - 4, y, Math.min(H, rnd(70, 150)), 16, TH.wall, chance(0.4) ? 'low' : 'broken'); rubble(mx, mz, y, 44, 8); }
    else if (kind === 'pizzaslab') pizzaslab(mx, mz, y);
    else if (kind === 'kegs') kegs(mx, mz, y);
    else if (kind === 'crates') cratestack(mx, mz, y);
    else if (kind === 'steelpillar') steelpillar(mx, mz, y, e.c - e.f);
    else if (kind === 'hanglamp') { if (!hanglamp(mx, mz, y, e.c - e.f)) continue; }
    else if (kind === 'bench') bench(mx, mz, y, w > d);
    else if (kind === 'roofvent') roofvent(mx, mz, y);
    else if (kind === 'dumpster') dumpster(mx, mz, y, w > d);
    counts[kind] = (counts[kind] || 0) + 1; stats.big++; take(c - ring - 1, r - ring - 1, w + ring * 2 + 2, d + ring * 2 + 2); // (and keep the next piece a cell further off)
  }

  // ---------------- 2. along the walls ----------------
  const DIRS = [[0, -1, 'pz'], [0, 1, 'nz'], [-1, 0, 'px'], [1, 0, 'nx']]; // wall on that side of the cell -> the wall face's normal
  const used = new Uint8Array(GW * GH); const near = (c, r, k, v) => { for (let dr = -k; dr <= k; dr++) for (let dc = -k; dc <= k; dc++) { const cc = c + dc, rr = r + dr; if (cc >= 0 && rr >= 0 && cc < GW && rr < GH && used[rr * GW + cc] === v) return true; } return false; };
  for (let r = 1; r < GH - 1; r++) for (let c = 1; c < GW - 1; c++) {
    const e = cell(c, r); if (e.solid || occ[r * GW + c] || e.roof != null) continue;
    for (const [dc, dr, n] of DIRS) {
      if (!cell(c + dc, r + dr).solid) continue;
      const out = !!e.sky, h = e.c - e.f, roll = R() / dens; const wx = (c + 0.5) * S + dc * 16, wz = (r + 0.5) * S + dr * 16, y = e.f, ax = dc !== 0; // (wx, wz) = the middle of that wall face
      // room in front of the wall? (three clear cells out, same floor)
      const room = [1, 2, 3].every(k => { const q = cell(c - dc * k, r - dr * k); return !q.solid && Math.abs(q.f - e.f) < 2; });
      const flatWall = cell(c + dc + (ax ? 0 : 1), r + dr + (ax ? 1 : 0)).solid && cell(c + dc - (ax ? 0 : 1), r + dr - (ax ? 1 : 0)).solid && !cell(c + (ax ? 0 : 1), r + (ax ? 1 : 0)).solid && !cell(c - (ax ? 0 : 1), r - (ax ? 1 : 0)).solid;
      if (!flatWall) continue;
      if (bunker) {
        if (roll < 0.1 && h >= 96 && lights > 1 && !near(c, r, 4, 3)) { // a caged lamp on a bracket: the warm glow of the place
          const ty = y + Math.min(92, h - 28), px = wx - dc * 8, pz = wz - dr * 8; P.box(wx - dc * 4, ty + 6, wz - dr * 4, ax ? 8 : 5, 3, ax ? 5 : 8, 'metal'); P.cageLamp(px, ty, pz);
          for (const [a, b] of [[-3.5, 0], [3.5, 0], [0, -3.5], [0, 3.5]]) P.box(px + a, ty - 6, pz + b, 0.7, 11, 0.7, 'metal'); P.cylinder(px, ty - 7, pz, 4.2, 1, 'metal', { segs: 8 });
          light(wx - dc * 24, ty, wz - dr * 24, 200, [1, 0.62, 0.3]); used[r * GW + c] = 3; stats.wall++;
        } else if (roll < 0.2 && h >= 96 && !near(c, r, 2, 2)) { // a riveted rib with a bracket up to the ceiling
          box(wx - dc * 4, y, wz - dr * 4, ax ? 8 : 20, h, ax ? 20 : 8, TH.dark); P.box(wx - dc * 5, y, wz - dr * 5, ax ? 10 : 26, 10, ax ? 26 : 10, TH.trim);
          P.box(wx - dc * 15, y + h - 20, wz - dr * 15, 5, 40, 5, TH.dark, ax ? { rz: dc * 0.72 } : { rx: -dr * 0.72 }); P.box(wx - dc * 14, y + h - 5, wz - dr * 14, ax ? 30 : 8, 5, ax ? 8 : 30, TH.dark); used[r * GW + c] = 2; stats.wall++;
        } else if (roll < 0.27 && !near(c, r, 3, 5)) { // pipes up the wall
          const px = wx - dc * 5, pz = wz - dr * 5, o2 = ax ? [0, 9] : [9, 0]; P.cylinder(px, y, pz, 3.2, h, 'metal', { segs: 8 }); for (const yy of [10, h * 0.55, h - 14]) P.cylinder(px, y + yy, pz, 4.6, 3, 'bunkerrust', { segs: 8 });
          if (chance(0.6)) P.cylinder(px + o2[0], y, pz + o2[1], 1.6, h, 'bunkerrust', { segs: 6 }); used[r * GW + c] = 5; stats.wall++;
        } else if (roll < 0.31 && h >= 100 && !near(c, r, 4, 4)) { // a fuse box with its conduit
          P.box(wx - dc * 4, y + 46, wz - dr * 4, ax ? 8 : 22, 30, ax ? 22 : 8, 'cabinet'); P.cylinder(wx - dc * 3, y + 76, wz - dr * 3, 1.2, h - 76, 'metal', { segs: 5 }); used[r * GW + c] = 4; stats.wall++;
        } else if (roll < 0.34 && !near(c, r, 4, 6)) { ctx.decal({ at: [wx, y + 22, wz], n, w: 44, h: 24, tex: 'grate', off: 0.6 }); used[r * GW + c] = 6; stats.wall++;
        } else if (o.posters && roll < 0.39 && h >= 110 && !near(c, r, 5, 8)) { ctx.decal({ at: [wx, y + 72, wz], n, w: 44, h: 60, tex: pick(o.posters), off: 0.6 }); used[r * GW + c] = 8; stats.wall++;
        } else if (o.wreck && roll < 0.5 && !near(c, r, 2, 7)) { rubble(wx - dc * 16, wz - dr * 16, y, 16, ri(4, 8)); if (h >= 96) ctx.decal({ at: [wx, y + rnd(40, Math.min(h - 30, 90)), wz], n, w: 70, h: 70, tex: 'cracked', off: 0.7 }); used[r * GW + c] = 7; stats.wall++; }
        break;
      }
      if (out && room && h >= 140 && roll < 0.1 && !near(c, r, 2, 1)) { // buttress: a sloping pier leaning on the wall
        const bh = Math.min(h - 16, rnd(110, 190)), dep = 22, px = wx - dc * dep / 2, pz = wz - dr * dep / 2; box(px, y, pz, ax ? dep : 36, bh * 0.6, ax ? 36 : dep, TH.wall); box(wx - dc * 7, y + bh * 0.6, wz - dr * 7, ax ? 14 : 30, bh * 0.4, ax ? 30 : 14, TH.wall2, { top: 'rubble' });
        P.box(px, y + bh * 0.6, pz, ax ? dep + 4 : 40, 6, ax ? 40 : dep + 4, TH.trim); solid(px - (ax ? dep / 2 : 18), y, pz - (ax ? 18 : dep / 2), px + (ax ? dep / 2 : 18), y + bh * 0.6, pz + (ax ? 18 : dep / 2)); used[r * GW + c] = 1; stats.wall++;
      } else if (!out && h >= 110 && roll < 0.13 && !near(c, r, 2, 2)) { // pilaster: half a column set against the wall
        const px = wx - dc * 5, pz = wz - dr * 5; box(px, y, pz, ax ? 10 : 26, h, ax ? 26 : 10, chance(0.25) ? TH.accent : TH.wall); P.box(wx - dc * 7, y, wz - dr * 7, ax ? 14 : 34, 12, ax ? 34 : 14, TH.dark); P.box(wx - dc * 7, y + h - 14, wz - dr * 7, ax ? 14 : 34, 14, ax ? 34 : 14, TH.trim); used[r * GW + c] = 2; stats.wall++;
      } else if (roll < 0.165 && h >= 110 && !near(c, r, 5, 3) && lights > 2) { // wall torch
        const ty = y + Math.min(84, h - 40), px = wx - dc * 9, pz = wz - dr * 9; P.box(wx - dc * 4, ty - 10, wz - dr * 4, ax ? 8 : 4, 4, ax ? 4 : 8, 'ironrust'); P.cylinder(px, ty - 8, pz, 2.5, 9, 'ironrust', { segs: 6, rTop: 5.5 }); fire(px, ty + 1, pz, 9); light(wx - dc * 26, ty + 8, wz - dr * 26, 200, [1, 0.5, 0.2], 1); used[r * GW + c] = 3; stats.wall++;
      } else if (roll < 0.2 && h >= 120 && !near(c, r, 4, 4)) { // a demon's face carved into the wall
        ctx.decal({ at: [wx, y + Math.min(h - 50, 84), wz], n, w: 64, h: 64, tex: 'demonface', off: 0.7 }); used[r * GW + c] = 4; stats.wall++;
      } else if (roll < 0.26 && !near(c, r, 2, 5)) { // rubble piled against the wall, the wall cracked above it
        rubble(wx - dc * 16, wz - dr * 16, y, 16, ri(4, 8)); if (h >= 96) ctx.decal({ at: [wx, y + rnd(40, Math.min(h - 30, 90)), wz], n, w: 70, h: 70, tex: 'cracked', off: 0.7 }); used[r * GW + c] = 5; stats.wall++;
      } else if (!out && roll < 0.3 && h >= 120 && !near(c, r, 3, 6)) { // chains hanging from the ceiling, sometimes with something on the end
        for (let k = 0; k < ri(1, 3); k++) { const cx = wx - dc * rnd(8, 22) + (ax ? 0 : rnd(-12, 12)), cz = wz - dr * rnd(8, 22) + (ax ? rnd(-12, 12) : 0), len = rnd(24, Math.min(h - 76, 90)); if (len < 12) continue; P.box(cx, e.c - len, cz, 1.5, len, 1.5, 'ironrust'); if (chance(0.4)) P.sphere(cx, e.c - len - 3, cz, 4, 'bonewall', { segs: 7, rings: 5, uvScale: [0.3, 0.3] }); else P.box(cx, e.c - len - 5, cz, 4, 6, 1.5, 'ironrust'); }
        used[r * GW + c] = 6; stats.wall++;
      } else if (roll < 0.33 && !near(c, r, 3, 7)) { skulls(wx - dc * 12, wz - dr * 12, y, ri(3, 7), 9); used[r * GW + c] = 7; stats.wall++; }
      break;
    }
  }

  // ---------------- 3. on the floor ----------------
  if (!bunker || o.wreck) for (let r = 1; r < GH - 1; r++) for (let c = 1; c < GW - 1; c++) {
    const e = cell(c, r); if (e.solid || e.roof != null) continue; const v = (bunker ? 0.034 : 0) + R() / dens, /* (a wrecked bunker gets stones, not blood) */ x = (c + R()) * S, z = (r + R()) * S, clear = !occ[r * GW + c];
    if (v < 0.022) { ctx.decal({ at: [(c + 0.5) * S, e.f, (r + 0.5) * S], n: 'up', w: rnd(40, 90), h: rnd(40, 90), tex: 'bloodpool', off: 0.3 + R() * 0.1 }); stats.scatter++; }
    else if (v < 0.034) { ctx.decal({ at: [(c + 0.5) * S, e.f, (r + 0.5) * S], n: 'up', w: 80, h: 80, tex: 'cracked', off: 0.3 + R() * 0.1 }); stats.scatter++; }
    else if (v < 0.07 && clear) { rubble(x, z, e.f, 10, ri(1, 3), 0.8); stats.scatter++; }      // small stones: too low to trip over
    else if (v < 0.082 && clear && !bunker) { skulls(x, z, e.f, ri(1, 2), 6); stats.scatter++; }
  }

  // ---------------- 4. under the ceilings: stone beams across the halls, some of them fallen ----------------
  if (o.beams !== false) for (let c = 3; c < GW - 1; c += 5) {
    let r = 1; while (r < GH - 1) { const e = cell(c, r); if (e.solid || e.sky || e.roof != null || e.c - e.f < 112) { r++; continue; }
      let r1 = r; while (r1 + 1 < GH - 1) { const q = cell(c, r1 + 1); if (q.solid || q.sky || q.c !== e.c || q.roof != null) break; r1++; }
      const len = r1 - r + 1; if (len >= 3 && len <= 22 && cell(c, r - 1).solid && cell(c, r1 + 1).solid && R() < 0.8 * dens) { const x = (c + 0.5) * S, z0 = r * S, z1 = (r1 + 1) * S;
        if (bunker) { box(x, e.c - 12, (z0 + z1) / 2, 14, 12, z1 - z0, TH.accent); P.box(x, e.c - 14, (z0 + z1) / 2, 22, 2.5, z1 - z0, TH.dark); if (chance(0.6)) P.pipe(x + 20, e.c - 7, z0, x + 20, e.c - 7, z1, 3, 'metal'); if (chance(0.3)) P.pipe(x - 18, e.c - 5, z0, x - 18, e.c - 5, z1, 1.8, 'bunkerrust'); }
        else if (chance(0.82)) { box(x, e.c - 14, (z0 + z1) / 2, 20, 14, z1 - z0, TH.dark); for (const zz of [z0 + 8, z1 - 8]) P.box(x, e.c - 30, zz, 22, 16, 16, TH.trim); }
        else { const l2 = (z1 - z0) * 0.45; P.box(x, e.c - 14 - l2 * 0.18, z0 + l2 / 2, 20, 14, l2, TH.dark, { rx: 0.36 }); P.box(x, e.c - 14, z1 - 20, 20, 14, 40, TH.dark); }
        stats.beams++; }
      r = r1 + 1; }
  }
  if (o.log || globalThis.RUINS_LOG) console.log('[ruins]', ctx.W.L.name, JSON.stringify(stats), 'lights left', lights);
  return stats;
}
