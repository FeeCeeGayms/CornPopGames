// World compiler: ASCII grid + free brushes -> lightmapped faces, collision hull brushes.
// Coordinates are Quake units, Y up. One grid cell = 32 units.
import * as THREE from 'three';

export const CELL = 32, BOTTOM = -1024, TOP = 4096;
const EPS = 0.03125;
const LUXEL = 16;

const V = (x, y, z) => [x, y, z];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// ---- face construction helpers (cross(u,v) == n for all) ----
export function faceUp(x0, x1, z0, z1, y) { return { p: V(x0, y, z1), u: V(1, 0, 0), w: x1 - x0, v: V(0, 0, -1), h: z1 - z0, n: V(0, 1, 0) }; }
export function faceDown(x0, x1, z0, z1, y) { return { p: V(x0, y, z0), u: V(1, 0, 0), w: x1 - x0, v: V(0, 0, 1), h: z1 - z0, n: V(0, -1, 0) }; }
export function faceX(sign, x, z0, z1, y0, y1) {
  return sign > 0 ? { p: V(x, y0, z1), u: V(0, 0, -1), w: z1 - z0, v: V(0, 1, 0), h: y1 - y0, n: V(1, 0, 0) }
    : { p: V(x, y0, z0), u: V(0, 0, 1), w: z1 - z0, v: V(0, 1, 0), h: y1 - y0, n: V(-1, 0, 0) };
}
export function faceZ(sign, z, x0, x1, y0, y1) {
  return sign > 0 ? { p: V(x0, y0, z), u: V(1, 0, 0), w: x1 - x0, v: V(0, 1, 0), h: y1 - y0, n: V(0, 0, 1) }
    : { p: V(x1, y0, z), u: V(-1, 0, 0), w: x1 - x0, v: V(0, 1, 0), h: y1 - y0, n: V(0, 0, -1) };
}
export function boxFaces(min, max) {
  return {
    top: faceUp(min[0], max[0], min[2], max[2], max[1]), bottom: faceDown(min[0], max[0], min[2], max[2], min[1]),
    px: faceX(1, max[0], min[2], max[2], min[1], max[1]), nx: faceX(-1, min[0], min[2], max[2], min[1], max[1]),
    pz: faceZ(1, max[2], min[0], max[0], min[1], max[1]), nz: faceZ(-1, min[2], min[0], max[0], min[1], max[1]),
  };
}

function segBox(p0, d, mn, mx) { // segment p0 + t*d, t in (0,1); does it pass through the box?
  let t0 = 0.002, t1 = 0.998;
  for (let a = 0; a < 3; a++) {
    if (Math.abs(d[a]) < 1e-9) { if (p0[a] <= mn[a] || p0[a] >= mx[a]) return false; continue; }
    let ta = (mn[a] - p0[a]) / d[a], tb = (mx[a] - p0[a]) / d[a];
    if (ta > tb) { const t = ta; ta = tb; tb = t; }
    if (ta > t0) t0 = ta; if (tb < t1) t1 = tb;
    if (t0 >= t1) return false;
  }
  return true;
}

export class World {
  constructor(level, textures) {
    this.L = level; this.T = textures;
    this.faces = []; this.brushes = []; this.lights = []; this.movers = [];
    this.styleDefs = level.styles || [];
  }

  // ---------- grid ----------
  resolve(ch) {
    const L = this.L;
    if (L.doors && L.doors[ch]) { const d = L.doors[ch]; const base = this.resolve(d.cell); return { ...base, c: base.f + (d.top || 112), door: ch, upper: d.upper || base.upper }; }
    if (L.marks && L.marks[ch]) return { ...this.resolve(L.marks[ch].cell), mark: ch };
    const d = L.legend[ch];
    if (!d) return { solid: true, wall: L.defaultWall || 'brick', ch };
    return d.solid ? { solid: true, wall: d.wall, ch } : { solid: false, f: d.f, c: d.c, floor: d.floor, ceil: d.ceil, side: d.side || d.wall || L.defaultWall, upper: d.upper || d.side || d.wall || L.defaultWall, sky: !!d.sky, inner: d.inner, roof: d.roof ?? null, roofTex: d.roofTex || 'roof', roofSky: d.roofSky || 1600, ch };
  }
  parseGrid() {
    const rows = this.L.map; this.H = rows.length; this.W = Math.max(...rows.map(r => r.length));
    this.cells = [];
    const cache = {};
    for (let r = 0; r < this.H; r++) { const row = []; for (let c = 0; c < this.W; c++) { const ch = rows[r][c] || ' '; if (!cache[ch]) cache[ch] = this.resolve(ch); row.push(cache[ch]); } this.cells.push(row); }
  }
  cell(c, r) { if (r < 0 || r >= this.H || c < 0 || c >= this.W) return { solid: true, wall: this.L.defaultWall || 'brick' }; return this.cells[r][c]; }
  floorAt(x, z) { const c = this.cell(Math.floor(x / CELL), Math.floor(z / CELL)); return c.solid ? 0 : c.f; }

  addFace(f, tex, opts = {}) { f.tex = tex; Object.assign(f, opts); if (f.w > 0.01 && f.h > 0.01) this.faces.push(f); return f; }

  genGridFaces() {
    const { W, H } = this;
    // floors & ceilings (greedy rect merge on (height, tex))
    const merge = (getKey, emit) => {
      const used = new Uint8Array(W * H);
      for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
        if (used[r * W + c]) continue; const k = getKey(c, r); if (k === null) continue;
        let w = 1; while (c + w < W && !used[r * W + c + w] && getKey(c + w, r) === k) w++;
        let h = 1; outer: while (r + h < H) { for (let i = 0; i < w; i++) if (used[(r + h) * W + c + i] || getKey(c + i, r + h) !== k) break outer; h++; }
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(r + j) * W + c + i] = 1;
        emit(c, r, w, h, this.cells[r][c]);
      }
    };
    merge((c, r) => { const e = this.cells[r][c]; return e.solid ? null : e.f + '|' + e.floor; },
      (c, r, w, h, e) => this.addFace(faceUp(c * CELL, (c + w) * CELL, r * CELL, (r + h) * CELL, e.f), e.floor));
    merge((c, r) => { const e = this.cells[r][c]; return e.solid ? null : e.c + '|' + e.ceil + '|' + e.sky; },
      (c, r, w, h, e) => this.addFace(faceDown(c * CELL, (c + w) * CELL, r * CELL, (r + h) * CELL, e.c), e.sky ? 'sky' : e.ceil, e.sky ? { sky: true } : {}));
    // roofed interiors: a roof surface at e.roof and open sky above it (so a room can sit inside a low building)
    merge((c, r) => { const e = this.cells[r][c]; return e.solid || e.roof == null ? null : e.roof + '|' + e.roofTex; },
      (c, r, w, h, e) => this.addFace(faceUp(c * CELL, (c + w) * CELL, r * CELL, (r + h) * CELL, e.roof), e.roofTex));
    merge((c, r) => { const e = this.cells[r][c]; return e.solid || e.roof == null ? null : 'R' + e.roofSky; },
      (c, r, w, h, e) => this.addFace(faceDown(c * CELL, (c + w) * CELL, r * CELL, (r + h) * CELL, e.roofSky), 'sky', { sky: true }));
    // walls: for every open cell and each neighbour, emit side segments, then merge along lines
    const segs = new Map();
    const push = (key, a0, a1, y0, y1, tex, mk) => { if (y1 - y0 < 0.01) return; const k = key + '|' + y0 + '|' + y1 + '|' + tex; if (!segs.has(k)) segs.set(k, { list: [], y0, y1, tex, mk }); segs.get(k).list.push([a0, a1]); };
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const layers = e => e.solid ? [] : e.roof == null ? [e] : [e, { f: e.roof, c: e.roofSky, floor: e.roofTex, side: e.upper, upper: e.upper, sky: true }];
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const cellA = this.cells[r][c]; if (cellA.solid) continue;
      for (const A of layers(cellA)) for (const [dc, dr] of dirs) {
        const B = this.cell(c + dc, r + dr);
        // boundary plane & facing (normal points into A, i.e. -d)
        let mk, key, a0, a1;
        if (dc !== 0) { const x = (dc > 0 ? c + 1 : c) * CELL; const sign = -dc; key = 'x' + x + 's' + sign; a0 = r * CELL; a1 = (r + 1) * CELL; mk = (s0, s1, y0, y1) => faceX(sign, x, s0, s1, y0, y1); }
        else { const z = (dr > 0 ? r + 1 : r) * CELL; const sign = -dr; key = 'z' + z + 's' + sign; a0 = c * CELL; a1 = (c + 1) * CELL; mk = (s0, s1, y0, y1) => faceZ(sign, z, s0, s1, y0, y1); }
        if (B.solid) { push(key, a0, a1, A.f, A.c, B.wall, mk); continue; }
        if (B.f > A.f) push(key, a0, a1, A.f, Math.min(B.f, A.c), !A.sky && B.inner ? B.inner : B.side, mk); // interiors see a building's inner wall, not its facade
        if (B.roof != null) { // B is a room with a roof: wall up to the roof, open air above it
          if (B.c < A.c && B.roof > Math.max(B.c, A.f)) push(key, a0, a1, Math.max(B.c, A.f), Math.min(B.roof, A.c), B.upper, mk);
          if (B.roofSky < A.c) push(key, a0, a1, Math.max(B.roofSky, A.f), A.c, A.sky ? 'sky' : B.upper, mk);
        } else if (B.c < A.c) push(key, a0, a1, Math.max(B.c, A.f), A.c, B.sky && A.sky ? 'sky' : B.upper, mk);
      }
    }
    for (const s of segs.values()) {
      s.list.sort((a, b) => a[0] - b[0]);
      let cur = null;
      for (const seg of s.list) {
        if (cur && Math.abs(cur[1] - seg[0]) < 0.01) cur[1] = seg[1];
        else { if (cur) this.addFace(s.mk(cur[0], cur[1], s.y0, s.y1), s.tex, s.tex === 'sky' ? { sky: true } : {}); cur = [seg[0], seg[1]]; }
      }
      if (cur) this.addFace(s.mk(cur[0], cur[1], s.y0, s.y1), s.tex, s.tex === 'sky' ? { sky: true } : {});
    }
  }

  genGridBrushes() {
    const { W, H } = this;
    const runs = (getY, mk) => {
      let prev = [];
      const out = [];
      for (let r = 0; r <= H; r++) {
        const cur = [];
        if (r < H) {
          let c = 0;
          while (c < W) { const y = getY(this.cells[r][c]); let e = c + 1; while (e < W && getY(this.cells[r][e]) === y) e++; if (y !== null) cur.push({ c0: c, c1: e, y, r0: r, r1: r + 1 }); c = e; }
        }
        // extend matching runs from previous row
        const next = [];
        for (const run of cur) { const p = prev.find(q => q.c0 === run.c0 && q.c1 === run.c1 && q.y === run.y); if (p) { p.r1 = r + 1; p.keep = true; next.push(p); } else next.push(run); }
        for (const p of prev) if (!next.includes(p)) out.push(p);
        prev = next;
      }
      for (const p of prev) out.push(p);
      for (const o of out) mk(o);
    };
    runs(e => e.solid ? 'S' : e.f, o => {
      const y1 = o.y === 'S' ? TOP : o.y;
      this.brushes.push({ min: [o.c0 * CELL, BOTTOM, o.r0 * CELL], max: [o.c1 * CELL, y1, o.r1 * CELL], solid: true, shadow: true });
    });
    runs(e => e.solid ? null : e.roof == null ? String(e.c) : e.c + ':' + e.roof + ':' + e.roofSky, o => { const [c, rf, rs] = String(o.y).split(':').map(Number);
      this.brushes.push({ min: [o.c0 * CELL, c, o.r0 * CELL], max: [o.c1 * CELL, rf ? rf : TOP, o.r1 * CELL], solid: true, shadow: true });
      if (rf) this.brushes.push({ min: [o.c0 * CELL, rs, o.r0 * CELL], max: [o.c1 * CELL, TOP, o.r1 * CELL], solid: true, shadow: true }); });
  }

  // free-standing brush: {min,max, tex, top, bottom, sides, px,nx,pz,nz, solid=true, shadow=true, fit, skip:[]}
  addBrush(b) {
    for (let k = 0; k < 3; k++) if (b.min[k] > b.max[k]) { const t = b.min[k]; b.min = b.min.slice(); b.max = b.max.slice(); b.min[k] = b.max[k]; b.max[k] = t; }
    const solid = b.solid !== false;
    const br = { min: b.min.slice(), max: b.max.slice(), solid, shadow: b.shadow !== false && !b.noshadow, name: b.name };
    this.brushes.push(br);
    if (b.invisible) return br;
    const F = boxFaces(b.min, b.max);
    const skip = new Set(b.skip || []);
    if (b.min[1] <= this.floorAt((b.min[0] + b.max[0]) / 2, (b.min[2] + b.max[2]) / 2) + 0.5) skip.add('bottom');
    for (const k of Object.keys(F)) {
      if (skip.has(k)) continue;
      const tex = b[k] || (k === 'top' ? b.top : k === 'bottom' ? b.bottom : b.sides) || b.tex;
      const fitK = b.fit === true || (Array.isArray(b.fit) && b.fit.includes(k));
      this.addFace(F[k], tex, { fit: fitK, align: b.align, mover: b.mover, brush: br });
    }
    return br;
  }

  // a flat textured quad on a wall: {at:[x,y,z] centre, n:'px'|'nx'|'pz'|'nz'|'up'|'down', w, h, tex}
  addDecal(d) {
    const [x, y, z] = d.at, hw = d.w / 2, hh = d.h / 2, o = d.off ?? 0.6;
    let f;
    switch (d.n) {
      case 'px': f = faceX(1, x + o, z - hw, z + hw, y - hh, y + hh); break;
      case 'nx': f = faceX(-1, x - o, z - hw, z + hw, y - hh, y + hh); break;
      case 'pz': f = faceZ(1, z + o, x - hw, x + hw, y - hh, y + hh); break;
      case 'nz': f = faceZ(-1, z - o, x - hw, x + hw, y - hh, y + hh); break;
      case 'up': f = faceUp(x - hw, x + hw, z - hh, z + hh, y + o); break;
      case 'down': f = faceDown(x - hw, x + hw, z - hh, z + hh, y - o); break;
    }
    return this.addFace(f, d.tex, { fit: true, decal: true, fullbright: !!d.fullbright, nolm: !!d.fullbright });
  }

  addLiquid(x0, z0, x1, z1, y, tex) { return this.addFace(faceUp(x0, x1, z0, z1, y), tex, { liquid: true, nolm: true }); }

  // ---------- doors ----------
  genDoors() {
    const L = this.L; if (!L.doors) return;
    const seen = new Uint8Array(this.W * this.H);
    for (let r = 0; r < this.H; r++) for (let c = 0; c < this.W; c++) {
      const e = this.cells[r][c]; if (!e.door || seen[r * this.W + c]) continue;
      // flood fill
      const stack = [[c, r]]; let c0 = c, c1 = c, r0 = r, r1 = r;
      while (stack.length) { const [cc, rr] = stack.pop(); if (cc < 0 || rr < 0 || cc >= this.W || rr >= this.H) continue; if (seen[rr * this.W + cc] || this.cells[rr][cc].door !== e.door) continue; seen[rr * this.W + cc] = 1; c0 = Math.min(c0, cc); c1 = Math.max(c1, cc); r0 = Math.min(r0, rr); r1 = Math.max(r1, rr); stack.push([cc + 1, rr], [cc - 1, rr], [cc, rr + 1], [cc, rr - 1]); }
      const def = L.doors[e.door];
      const horizontalRun = (c1 - c0) >= (r1 - r0); // door spans along X
      const inset = def.thin ? 10 : 0;
      const min = [c0 * CELL + (horizontalRun ? 0 : inset), e.f, r0 * CELL + (horizontalRun ? inset : 0)];
      const max = [(c1 + 1) * CELL - (horizontalRun ? 0 : inset), e.c, (r1 + 1) * CELL - (horizontalRun ? inset : 0)];
      this.addMover({ type: 'door', min, max, key: def.key, tex: def.tex || (def.key ? 'door_' + def.key : 'door'), name: def.name, targeted: def.targeted, wait: def.wait ?? (def.key ? -1 : 4), lip: 8, speed: def.speed || 110, message: def.message, dir: def.dir, secret: def.secret });
    }
  }
  addMover(m) {
    const id = this.movers.length;
    m.id = id; m.offset = 0; m.state = 'closed'; m.travel = m.travel ?? ((m.max[1] - m.min[1]) - (m.lip ?? 8));
    m.base = { min: m.min.slice(), max: m.max.slice() };
    m.brush = this.addBrush({ min: m.min, max: m.max, tex: 'trim', px: m.tex, nx: m.tex, pz: m.tex, nz: m.tex, top: m.topTex || 'trim', align: m.align || 'local', skip: m.skip, ...(m.brushOpts || {}), mover: id, noshadow: true });
    m.brush.mover = m;
    this.movers.push(m);
    return m;
  }

  // ---------- lights ----------
  addLight(l) { this.lights.push({ pos: l.pos, light: l.light || 200, color: l.color || [1, 1, 1], style: l.style || 0, noshadow: !!l.noshadow }); }

  // ---------- lightmap packing & baking ----------
  packLightmaps() {
    const lmFaces = this.faces.filter(f => !f.sky && !f.nolm);
    for (const f of lmFaces) { f.lnx = Math.max(2, Math.ceil(f.w / LUXEL) + 1); f.lny = Math.max(2, Math.ceil(f.h / LUXEL) + 1); }
    let area = 0; for (const f of lmFaces) area += (f.lnx + 1) * (f.lny + 1);
    let AW = 256; while (AW * AW < area * 1.4) AW *= 2;
    const sorted = lmFaces.slice().sort((a, b) => b.lny - a.lny);
    let x = 0, y = 0, rowH = 0;
    for (const f of sorted) {
      if (f.lnx + 1 > AW) throw new Error('face too large for lightmap');
      if (x + f.lnx + 1 > AW) { x = 0; y += rowH; rowH = 0; }
      f.lx = x; f.ly = y; x += f.lnx + 1; rowH = Math.max(rowH, f.lny + 1);
    }
    let AH = 64; while (AH < y + rowH) AH *= 2;
    this.AW = AW; this.AH = AH;
    this.lmData = new Uint8Array(AW * AH * 4); this.smData = new Uint8Array(AW * AH * 4);
    for (let i = 3; i < this.lmData.length; i += 4) this.lmData[i] = 255;
    this.lmFaces = lmFaces;
  }

  shadowBrushes() { return this.brushes.filter(b => b.shadow && !b.mover); }

  prepLights() {
    const sb = this.shadowBrushes();
    for (const l of this.lights) {
      const r = l.light;
      l.occ = l.noshadow ? [] : sb.filter(b => b.max[0] > l.pos[0] - r && b.min[0] < l.pos[0] + r && b.max[1] > l.pos[1] - r && b.min[1] < l.pos[1] + r && b.max[2] > l.pos[2] - r && b.min[2] < l.pos[2] + r);
    }
  }

  // light at a point with normal n (null = omni). returns [r,g,b, s0,s1,s2,s3] in quake units (128 = 1x)
  lightAt(pos, n, lights = this.lights, out = new Float32Array(7)) {
    const amb = this.L.ambient ?? 8, ac = this.L.ambientColor;
    if (ac) { out[0] = amb * ac[0]; out[1] = amb * ac[1]; out[2] = amb * ac[2]; } else out[0] = out[1] = out[2] = amb; out[3] = out[4] = out[5] = out[6] = 0;
    for (const l of lights) {
      const dx = l.pos[0] - pos[0], dy = l.pos[1] - pos[1], dz = l.pos[2] - pos[2];
      const d2 = dx * dx + dy * dy + dz * dz; if (d2 >= l.light * l.light) continue;
      const d = Math.sqrt(d2) || 0.001;
      let ang = 1;
      if (n) { const dd = (n[0] * dx + n[1] * dy + n[2] * dz) / d; if (dd <= 0) continue; ang = 0.5 + 0.5 * dd; }
      const addv = (l.light - d) * ang;
      // occlusion
      const dir = [dx, dy, dz]; let blocked = false;
      for (const b of l.occ) if (segBox(pos, dir, b.min, b.max)) { blocked = true; break; }
      if (blocked) continue;
      if (l.style) out[2 + l.style] += addv;
      else { out[0] += addv * l.color[0]; out[1] += addv * l.color[1]; out[2] += addv * l.color[2]; }
    }
    return out;
  }

  // ---- weather: which columns are open to the sky (rain falls there, lightning lights it, the ground gets wet) ----
  buildExposure() {
    const { W, H } = this; const cov = this.expCov = new Array(W * H);
    for (const b of this.brushes) {
      if (!b.shadow || b.mover || b.enemy) continue;
      const c0 = Math.max(0, Math.floor(b.min[0] / CELL)), c1 = Math.min(W - 1, Math.floor((b.max[0] - 0.01) / CELL)), r0 = Math.max(0, Math.floor(b.min[2] / CELL)), r1 = Math.min(H - 1, Math.floor((b.max[2] - 0.01) / CELL));
      if ((c1 - c0 + 1) * (r1 - r0 + 1) > 4000) continue; // grid floor/ceiling slabs
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) { const e = this.cells[r][c]; if (e.solid || !e.sky) continue; if (b.max[1] <= e.f + 0.5 || b.min[1] >= e.c - 0.5) continue; (cov[r * W + c] || (cov[r * W + c] = [])).push(b); }
    }
    // per-cell flag for the rain: open sky over the cell centre
    this.exposed = new Uint8Array(W * H);
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) { const e = this.cells[r][c]; this.exposed[r * W + c] = this.skyOpen((c + 0.5) * CELL, (e.roof ?? e.f) + 40, (r + 0.5) * CELL) ? 1 : 0; }
  }
  // straight up from p: does it reach the sky?
  skyOpen(x, y, z) {
    const c = Math.floor(x / CELL), r = Math.floor(z / CELL); if (c < 0 || r < 0 || c >= this.W || r >= this.H) return false;
    const e = this.cells[r][c]; if (e.solid) return false;
    if (e.roof != null) return y >= e.roof - 2 && y < e.roofSky;
    if (!e.sky || y >= e.c) return false;
    const l = this.expCov[r * this.W + c]; if (l) for (const b of l) if (x > b.min[0] && x < b.max[0] && z > b.min[2] && z < b.max[2] && b.max[1] > y + 0.5 && b.min[1] < e.c) return false;
    return true;
  }
  exposureAt(p) { let n = 0; for (const [dx, dz] of [[0, 0], [9, 5], [-7, 9], [5, -9], [-9, -5]]) if (this.skyOpen(p[0] + dx, p[1], p[2] + dz)) n++; return n / 5; }

  async bake(progress) {
    this.prepLights();
    const weather = !!(this.L.rain || this.L.storm || this.L.mist); if (weather) this.buildExposure();
    const AW = this.AW, lm = this.lmData, sm = this.smData;
    const tmp = new Float32Array(7);
    let t0 = performance.now(), done = 0;
    for (const f of this.lmFaces) {
      // lights that can reach this face
      const fmin = [Infinity, Infinity, Infinity], fmax = [-Infinity, -Infinity, -Infinity];
      for (const cn of [f.p, add(f.p, scl(f.u, f.w)), add(add(f.p, scl(f.u, f.w)), scl(f.v, f.h)), add(f.p, scl(f.v, f.h))]) for (let a = 0; a < 3; a++) { fmin[a] = Math.min(fmin[a], cn[a]); fmax[a] = Math.max(fmax[a], cn[a]); }
      const ls = this.lights.filter(l => {
        if (dot(sub(l.pos, f.p), f.n) <= 0) return false;
        let d2 = 0; for (let a = 0; a < 3; a++) { const v = Math.max(fmin[a] - l.pos[a], 0, l.pos[a] - fmax[a]); d2 += v * v; }
        return d2 < l.light * l.light;
      });
      for (let j = 0; j < f.lny; j++) for (let i = 0; i < f.lnx; i++) {
        const su = Math.min(Math.max(i / (f.lnx - 1) * f.w, 0.75), f.w - 0.75), sv = Math.min(Math.max(j / (f.lny - 1) * f.h, 0.75), f.h - 0.75);
        const pos = [f.p[0] + f.u[0] * su + f.v[0] * sv + f.n[0], f.p[1] + f.u[1] * su + f.v[1] * sv + f.n[1], f.p[2] + f.u[2] * su + f.v[2] * sv + f.n[2]];
        const o = this.lightAt(pos, f.n, ls, tmp);
        const idx = ((f.ly + j) * AW + f.lx + i) * 4;
        lm[idx] = Math.min(255, o[0]); lm[idx + 1] = Math.min(255, o[1]); lm[idx + 2] = Math.min(255, o[2]);
        if (weather) lm[idx + 3] = Math.round(255 * this.exposureAt(pos));
        sm[idx] = Math.min(255, o[3]); sm[idx + 1] = Math.min(255, o[4]); sm[idx + 2] = Math.min(255, o[5]); sm[idx + 3] = Math.min(255, o[6]);
      }
      done++;
      if (performance.now() - t0 > 40) { progress && progress(done / this.lmFaces.length); await new Promise(r => setTimeout(r, 0)); t0 = performance.now(); }
    }
  }

  // bake per-vertex light into a geometry (static props). returns colors attribute
  bakeVertexColors(geom) {
    const pos = geom.attributes.position, nor = geom.attributes.normal; const n = pos.count;
    const col = new Float32Array(n * 3); const tmp = new Float32Array(7);
    const st = this.styleDefs;
    for (let i = 0; i < n; i++) {
      const nn = [nor.getX(i), nor.getY(i), nor.getZ(i)];
      const p = [pos.getX(i) + nn[0] * 1.5, pos.getY(i) + nn[1] * 1.5, pos.getZ(i) + nn[2] * 1.5];
      const o = this.lightAt(p, nn, this.lights, tmp);
      let r = o[0], g = o[1], b = o[2];
      for (let s = 0; s < 4; s++) if (o[3 + s] && st[s]) { r += o[3 + s] * st[s].color[0]; g += o[3 + s] * st[s].color[1]; b += o[3 + s] * st[s].color[2]; }
      col[i * 3] = Math.min(2, r / 128); col[i * 3 + 1] = Math.min(2, g / 128); col[i * 3 + 2] = Math.min(2, b / 128);
    }
    geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }

  // ---------- render meshes ----------
  buildMeshes(makeMaterial) {
    const lmTex = new THREE.DataTexture(this.lmData, this.AW, this.AH, THREE.RGBAFormat);
    const smTex = new THREE.DataTexture(this.smData, this.AW, this.AH, THREE.RGBAFormat);
    for (const t of [lmTex, smTex]) { t.magFilter = t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true; }
    this.lmTex = lmTex; this.smTex = smTex;
    const groups = new Map();
    for (const f of this.faces) {
      const key = (f.mover !== undefined ? 'm' + f.mover : 'w') + '|' + f.tex + '|' + (f.sky ? 's' : '') + (f.fullbright ? 'f' : '') + (f.liquid ? 'l' : '');
      if (!groups.has(key)) groups.set(key, { faces: [], f });
      groups.get(key).faces.push(f);
    }
    const root = new THREE.Group(); const moverGroups = this.movers.map(() => new THREE.Group());
    for (const [key, g] of groups) {
      const tex = this.T[g.f.tex] || this.T.brick; if (!this.T[g.f.tex]) console.warn('missing texture', g.f.tex);
      const tw = tex.userData.w || 64, th = tex.userData.h || 64;
      const P = [], UV = [], UV1 = [], IDX = [], WET = [];
      for (const f of g.faces) {
        const base = P.length / 3;
        const corners = [[0, 0], [f.w, 0], [f.w, f.h], [0, f.h]];
        const mv = f.mover !== undefined ? this.movers[f.mover] : null;
        const origin = mv ? [(mv.min[0] + mv.max[0]) / 2, mv.min[1], (mv.min[2] + mv.max[2]) / 2] : [0, 0, 0];
        for (const [a, b] of corners) {
          const wp = [f.p[0] + f.u[0] * a + f.v[0] * b, f.p[1] + f.u[1] * a + f.v[1] * b, f.p[2] + f.u[2] * a + f.v[2] * b];
          P.push(wp[0] - origin[0], wp[1] - origin[1], wp[2] - origin[2]);
          let s, t;
          if (f.fit) { s = a / f.w; t = 1 - b / f.h; }
          else if (f.align === 'local') { s = a / tw; t = (f.h - b) / th; }
          else if (Math.abs(f.n[1]) > 0.5) { s = wp[0] / tw; t = wp[2] / th; }
          else if (Math.abs(f.n[0]) > 0.5) { s = wp[2] / tw; t = -wp[1] / th; }
          else { s = wp[0] / tw; t = -wp[1] / th; }
          UV.push(s, t);
          if (f.lnx) UV1.push((f.lx + 0.5 + (a / f.w) * (f.lnx - 1)) / this.AW, (f.ly + 0.5 + (b / f.h) * (f.lny - 1)) / this.AH);
          else UV1.push(0, 0);
        }
        IDX.push(base, base + 1, base + 2, base, base + 2, base + 3);
        const wt = f.n[1] > 0.5 && !f.decal ? 1 : 0; WET.push(wt, wt, wt, wt); // floors can shine with rain
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
      geo.setAttribute('uv1', new THREE.Float32BufferAttribute(UV1, 2));
      geo.setAttribute('aWet', new THREE.Float32BufferAttribute(WET, 1));
      geo.setIndex(IDX); geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, makeMaterial(g.f.tex, { sky: g.f.sky, fullbright: g.f.fullbright, nolm: !g.faces[0].lnx, liquid: g.f.liquid }));
      if (g.f.liquid) mesh.renderOrder = 3;
      mesh.matrixAutoUpdate = g.f.mover !== undefined;
      if (g.f.mover !== undefined) moverGroups[g.f.mover].add(mesh); else { mesh.updateMatrix(); root.add(mesh); }
    }
    this.movers.forEach((m, i) => { const grp = moverGroups[i]; grp.position.set((m.min[0] + m.max[0]) / 2, m.min[1], (m.min[2] + m.max[2]) / 2); m.group = grp; root.add(grp); });
    return root;
  }

  async compile(progress) {
    this.parseGrid();
    this.genGridFaces();
    this.genGridBrushes();
    this.genDoors();
    this.packLightmapsDeferred = true;
  }

  // ---------- collision (with a spatial hash once the static world is complete) ----------
  finalizeCollision() {
    this.HS = 256; this.hcells = new Map(); this.dyn = []; this.stampN = 1;
    for (const b of this.brushes) this.indexBrush(b);
  }
  indexBrush(b) {
    if (b.mover || b.enemy || b.dynamic) { this.dyn.push(b); return; }
    const H = this.HS, x0 = Math.floor(b.min[0] / H), x1 = Math.floor(b.max[0] / H), z0 = Math.floor(b.min[2] / H), z1 = Math.floor(b.max[2] / H);
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { const k = (x + 512) * 4096 + (z + 512); let l = this.hcells.get(k); if (!l) this.hcells.set(k, l = []); l.push(b); }
  }
  addDynamic(b) { b.dynamic = true; this.brushes.push(b); if (this.hcells) this.dyn.push(b); return b; }
  removeBrush(b) { let i = this.brushes.indexOf(b); if (i >= 0) this.brushes.splice(i, 1); if (this.dyn) { i = this.dyn.indexOf(b); if (i >= 0) this.dyn.splice(i, 1); } b.solid = false; }
  // brushes possibly overlapping the XZ box
  near(x0, z0, x1, z1) {
    if (!this.hcells) return this.brushes;
    const H = this.HS, out = this._near || (this._near = []); out.length = 0; const st = ++this.stampN;
    const cx0 = Math.floor((x0 - 1) / H), cx1 = Math.floor((x1 + 1) / H), cz0 = Math.floor((z0 - 1) / H), cz1 = Math.floor((z1 + 1) / H);
    for (let x = cx0; x <= cx1; x++) for (let z = cz0; z <= cz1; z++) { const l = this.hcells.get((x + 512) * 4096 + (z + 512)); if (l) for (const b of l) if (b._st !== st) { b._st = st; out.push(b); } }
    for (const b of this.dyn) out.push(b);
    return out;
  }

  // Sweep an AABB (hull mins/maxs relative to origin) from s to e. Returns {fraction,end,normal,startsolid,brush}
  trace(s, e, hmin, hmax, ignore, noEnemies) {
    const d = [e[0] - s[0], e[1] - s[1], e[2] - s[2]];
    const len = Math.hypot(d[0], d[1], d[2]);
    let best = 1, bn = null, bb = null, startsolid = false;
    const sw0 = [Math.min(s[0], e[0]) + hmin[0], Math.min(s[1], e[1]) + hmin[1], Math.min(s[2], e[2]) + hmin[2]];
    const sw1 = [Math.max(s[0], e[0]) + hmax[0], Math.max(s[1], e[1]) + hmax[1], Math.max(s[2], e[2]) + hmax[2]];
    for (const b of this.near(sw0[0], sw0[2], sw1[0], sw1[2])) {
      if (!b.solid || b === ignore || (noEnemies && b.enemy)) continue;
      if (b.max[0] < sw0[0] - 1 || b.min[0] > sw1[0] + 1 || b.max[1] < sw0[1] - 1 || b.min[1] > sw1[1] + 1 || b.max[2] < sw0[2] - 1 || b.min[2] > sw1[2] + 1) continue;
      let tEnter = -Infinity, tExit = Infinity, nAxis = -1, nSign = 0, miss = false;
      for (let a = 0; a < 3; a++) {
        const mn = b.min[a] - hmax[a], mx = b.max[a] - hmin[a];
        if (Math.abs(d[a]) < 1e-9) { if (s[a] <= mn || s[a] >= mx) { miss = true; break; } continue; }
        let t1 = (mn - s[a]) / d[a], t2 = (mx - s[a]) / d[a];
        let sign = d[a] > 0 ? -1 : 1;
        if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
        if (t1 > tEnter) { tEnter = t1; nAxis = a; nSign = sign; }
        if (t2 < tExit) tExit = t2;
        if (tEnter > tExit) { miss = true; break; }
      }
      if (miss || tExit <= 0) continue;
      if (nAxis < 0) { startsolid = true; continue; } // fully inside with zero motion on all axes
      if (tEnter < 0) {
        if (tEnter * len > -0.25) { tEnter = 0; } // touching surface, moving into it
        else { startsolid = true; continue; }
      }
      if (tEnter > 1) continue;
      if (tEnter < best) { best = tEnter; bn = [0, 0, 0]; bn[nAxis] = nSign; bb = b; }
    }
    let f = best;
    if (bn) f = Math.max(0, best - EPS / Math.max(len, 1e-6));
    return { fraction: bn ? f : 1, end: [s[0] + d[0] * (bn ? f : 1), s[1] + d[1] * (bn ? f : 1), s[2] + d[2] * (bn ? f : 1)], normal: bn, startsolid, brush: bb };
  }
  // is a hull at pos overlapping any solid?
  testPosition(pos, hmin, hmax, ignore) {
    for (const b of this.near(pos[0] + hmin[0], pos[2] + hmin[2], pos[0] + hmax[0], pos[2] + hmax[2])) {
      if (!b.solid || b === ignore || b.enemy) continue;
      if (pos[0] + hmin[0] < b.max[0] - 0.01 && pos[0] + hmax[0] > b.min[0] + 0.01 && pos[1] + hmin[1] < b.max[1] - 0.01 && pos[1] + hmax[1] > b.min[1] + 0.01 && pos[2] + hmin[2] < b.max[2] - 0.01 && pos[2] + hmax[2] > b.min[2] + 0.01) return b;
    }
    return null;
  }
  // ray for camera / line of sight (point trace)
  rayFrac(s, e) { const r = this.trace(s, e, [-2, -2, -2], [2, 2, 2], null, true); return r.fraction; }
}
