// Spline race track with branches: a closed main loop plus open shortcut paths
// that leave and rejoin it (any can run underground as a tunnel). Builds the
// road ribbons, ramps, pits, tunnels, frozen lakes and a height-field terrain,
// and answers physics queries ("which road am I on, how high is the ground?").
// A track def's `theme` swaps the look: snow instead of grass, icy water
// instead of sludge, and so on. Pripyat's look is the default. A def can also
// add open water (`sea` and `waters`, the bay under a bridge) and bridges, road
// stretches with railings where the ground below is left alone.
import * as THREE from 'three';
import { asphaltTexture, gravelTexture, hazardTexture, boostPadTexture, groundTexture, groundNormalTexture, sludgeTexture, bloodTexture, checkerTexture, concreteTexture, snowTexture, iceTexture, icyWaterTexture, bayWaterTexture, cobbleTexture, brickRoadTexture, waterNormalTexture, rng } from './textures.js';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Cheap value noise for the terrain.
function makeNoise(seed) {
  const r = rng(seed);
  const p = new Float32Array(512);
  for (let i = 0; i < 512; i++) p[i] = r();
  const h = (x, z) => p[(((x * 73856093) ^ (z * 19349663)) >>> 0) % 512];
  const n = (x, z) => {
    const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
    const a = h(xi, zi), b = h(xi + 1, zi), c = h(xi, zi + 1), d = h(xi + 1, zi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  return (x, z) => n(x / 90, z / 90) * 1.0 + n(x / 35, z / 35) * 0.35 + n(x / 12, z / 12) * 0.1;
}

// One road: sampled every ~1.5 m with heights, tangents, ramps, pits and tunnels.
class Path {
  constructor(id, points, opts) {
    this.id = id;
    this.closed = !!opts.closed;
    this.roadHalf = opts.roadHalf;
    this.wallHalf = opts.wallHalf;
    this.surface = opts.surface || 'road';
    this.from = opts.from; this.to = opts.to; // main-loop distances where a branch leaves / rejoins
    this.secret = !!opts.secret;
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])), this.closed, 'centripetal');
    this.length = curve.getLength();
    const N = (this.N = Math.round(this.length / 1.5));
    this.ds = this.length / (this.closed ? N : N - 1);
    this.cx = new Float32Array(N); this.cz = new Float32Array(N);
    this.base = new Float32Array(N); this.H = new Float32Array(N);
    this.tx = new Float32Array(N); this.tz = new Float32Array(N);
    this.pit = new Uint8Array(N); this.pitLevel = new Float32Array(N);
    this.tunnel = new Uint8Array(N);
    this.bridge = new Uint8Array(N);
    const pts = curve.getSpacedPoints(this.closed ? N : N - 1);
    for (let i = 0; i < N; i++) { this.cx[i] = pts[i].x; this.cz[i] = pts[i].z; this.base[i] = pts[i].y; }
    const idx = (i) => this.closed ? (i + N) % N : Math.min(N - 1, Math.max(0, i));
    const tmp = Float32Array.from(this.base);
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < N; i++) tmp[i] = (this.base[idx(i - 1)] + this.base[i] * 2 + this.base[idx(i + 1)]) / 4;
      if (!this.closed) { tmp[0] = this.base[0]; tmp[N - 1] = this.base[N - 1]; }
      this.base.set(tmp);
    }
    for (let i = 0; i < N; i++) {
      const a = idx(i - 1), b = idx(i + 1);
      const dx = this.cx[b] - this.cx[a], dz = this.cz[b] - this.cz[a];
      const l = Math.hypot(dx, dz) || 1;
      this.tx[i] = dx / l; this.tz[i] = dz / l;
    }
    this.ramps = (opts.features || []).filter((f) => f.type === 'ramp').map((r) => ({ ...r, path: this }));
    this.pads = (opts.features || []).filter((f) => f.type === 'pad').map((r) => ({ ...r, path: this }));
    this.bridges = (opts.features || []).filter((f) => f.type === 'bridge').map((r) => ({ ...r, path: this }));
    // a viaduct is a bridge standing over open ground: the land below is left to itself
    this.viaduct = new Uint8Array(N);
    for (const b of this.bridges) for (let s = b.s; s <= b.s + b.len; s += this.ds) { this.bridge[this.at(s)] = 1; if (b.viaduct) this.viaduct[this.at(s)] = 1; }
    for (let i = 0; i < N; i++) {
      const s = i * this.ds;
      let h = this.base[i];
      for (const r of this.ramps) {
        const x = s - r.s;
        if (x >= 0 && x < r.len) h += r.h * Math.pow(x / r.len, 1.4);
        if (r.pit && x >= r.len && x < r.len + r.pit) this.pit[i] = 1;
      }
      this.H[i] = h;
    }
    // Sludge sits a few metres below the lowest road edge of each pit.
    for (const r of this.ramps) if (r.pit) {
      let lo = Infinity;
      for (let s = r.s + r.len - 2; s <= r.s + r.len + r.pit + 2; s += this.ds) lo = Math.min(lo, this.base[this.at(s)]);
      r.level = lo - (r.depth ?? 2.6);
      for (let s = r.s + r.len - 3; s <= r.s + r.len + r.pit + 3; s += this.ds) this.pitLevel[this.at(s)] = r.level;
    }
    // tunnels: a branch's `tunnel` is [from, to] as fractions of its length;
    // `tunnels` (main loop or branch) is a list of [from, to] in metres
    this.tunnelRanges = [...(opts.tunnel ? [[opts.tunnel[0] * this.length, opts.tunnel[1] * this.length]] : []), ...(opts.tunnels || [])];
    for (const [a, b] of this.tunnelRanges) for (let i = 0; i < N; i++) { const s = i * this.ds; if (s >= a && s <= b) this.tunnel[i] = 1; }
    this.tunnelRange = this.tunnelRanges[0];
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < N; i++) { minX = Math.min(minX, this.cx[i]); maxX = Math.max(maxX, this.cx[i]); minZ = Math.min(minZ, this.cz[i]); maxZ = Math.max(maxZ, this.cz[i]); }
    const m = this.wallHalf + 6;
    this.box = { minX: minX - m, maxX: maxX + m, minZ: minZ - m, maxZ: maxZ + m };
  }

  at(s) { // sample index for a distance
    const f = Math.round(s / this.ds);
    return this.closed ? ((f % this.N) + this.N) % this.N : Math.min(this.N - 1, Math.max(0, f));
  }

  inBox(x, z) { const b = this.box; return x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ; }

  query(x, z, hint, out) {
    const N = this.N;
    let best = -1, bd = Infinity;
    if (hint >= 0) {
      for (let o = -30; o <= 30; o++) {
        let k = hint + o;
        if (this.closed) k = (k + N) % N; else if (k < 0 || k >= N) continue;
        const d = (this.cx[k] - x) ** 2 + (this.cz[k] - z) ** 2;
        if (d < bd) { bd = d; best = k; }
      }
      if (bd > 60 * 60) best = -1;
    }
    if (best < 0) {
      for (let k = 0; k < N; k += 2) {
        const d = (this.cx[k] - x) ** 2 + (this.cz[k] - z) ** 2;
        if (d < bd) { bd = d; best = k; }
      }
    }
    const i0 = best;
    const ip = this.closed ? (best - 1 + N) % N : Math.max(0, best - 1);
    const inx = this.closed ? (best + 1) % N : Math.min(N - 1, best + 1);
    const along = (x - this.cx[i0]) * this.tx[i0] + (z - this.cz[i0]) * this.tz[i0];
    let a = along >= 0 ? i0 : ip, b = along >= 0 ? inx : i0;
    if (a === b) { if (a > 0) a--; else b++; }
    const sx = this.cx[b] - this.cx[a], sz = this.cz[b] - this.cz[a];
    const sl2 = sx * sx + sz * sz || 1;
    let t = ((x - this.cx[a]) * sx + (z - this.cz[a]) * sz) / sl2;
    const tc = Math.min(1, Math.max(0, t));
    const cx = this.cx[a] + sx * tc, cz = this.cz[a] + sz * tc;
    const tx = this.tx[a] + (this.tx[b] - this.tx[a]) * tc, tz = this.tz[a] + (this.tz[b] - this.tz[a]) * tc;
    const tl = Math.hypot(tx, tz) || 1;
    out.path = this;
    out.index = a;
    out.t = tc;
    out.s = (a + tc) * this.ds;
    out.tx = tx / tl; out.tz = tz / tl;
    out.rx = -out.tz; out.rz = out.tx; // right-hand side of the road
    out.d = (x - cx) * out.rx + (z - cz) * out.rz;
    // past the open end of a branch: treat as outside so the main road takes over
    out.beyond = !this.closed && ((a === 0 && t < -0.2) || (b === N - 1 && t > 1.2));
    out.cx = cx; out.cz = cz;
    out.roadH = this.H[a] + (this.H[b] - this.H[a]) * tc;
    out.baseH = this.base[a] + (this.base[b] - this.base[a]) * tc;
    out.pit = this.pit[a] || this.pit[b];
    out.pitLevel = this.pitLevel[a] || this.pitLevel[b];
    out.tunnel = this.tunnel[a] && this.tunnel[b];
    out.bridge = this.bridge[a] || this.bridge[b];
    out.roadHalf = this.roadHalf; out.wallHalf = out.tunnel || out.bridge ? this.roadHalf + 1.2 : this.wallHalf;
    out.mainS = this.mainS(out.s);
    return out;
  }

  // Map a distance along this path to the equivalent distance on the main loop.
  mainS(s) {
    if (this.closed) return s;
    let span = this.to - this.from;
    return this.from + (s / this.length) * span;
  }

  pose(s, d = 0) {
    const L = this.length;
    if (this.closed) s = ((s % L) + L) % L; else s = Math.min(L - 1e-3, Math.max(0, s));
    const f = s / this.ds;
    const a = Math.min(this.N - 1, Math.floor(f)), b = this.closed ? (a + 1) % this.N : Math.min(this.N - 1, a + 1), t = f - Math.floor(f);
    const cx = this.cx[a] + (this.cx[b] - this.cx[a]) * t, cz = this.cz[a] + (this.cz[b] - this.cz[a]) * t;
    const tx = this.tx[a], tz = this.tz[a];
    const x = cx - tz * d, z = cz + tx * d;
    const h = this.H[a] + (this.H[b] - this.H[a]) * t;
    return { x, z, y: h, yaw: Math.atan2(tx, tz), tx, tz, index: a, path: this, baseY: this.base[a] + (this.base[b] - this.base[a]) * t };
  }
}

export class Track {
  constructor(def) {
    this.def = def;
    this.theme = def.theme || {};
    this.lakes = def.lakes || [];
    this.sea = def.sea || null; // { level, bed }: open water wherever the ground dips below level
    this.waters = def.waters || []; // ellipses carved down to the sea bed
    this.roadHalf = def.roadHalf ?? 9;
    this.wallHalf = def.wallHalf ?? 16;
    this.main = new Path('main', def.points, { closed: true, roadHalf: this.roadHalf, wallHalf: this.wallHalf, features: def.features, tunnels: def.tunnels });
    this.length = this.main.length;
    this.paths = [this.main];
    for (const b of def.branches || []) {
      const half = b.roadHalf ?? 6.5;
      const p0 = this.main.pose(b.from, b.dFrom ?? 0), p0b = this.main.pose(b.from + 14, (b.dFrom ?? 0) * 1.6);
      const p1 = this.main.pose(b.to, b.dTo ?? 0), p1a = this.main.pose(b.to - 14, (b.dTo ?? 0) * 1.6);
      const pts = [[p0.x, p0.y, p0.z], [p0b.x, p0b.y, p0b.z], ...b.points, [p1a.x, p1a.y, p1a.z], [p1.x, p1.y, p1.z]];
      const path = new Path(b.id, pts, { roadHalf: half, wallHalf: half + (b.shoulder ?? 4), surface: b.surface, from: b.from, to: b.to, tunnel: b.tunnel, tunnels: b.tunnels, features: b.features, secret: b.secret });
      path.def = b;
      this.paths.push(path);
    }
    // keep old single-path fields pointing at the main loop
    for (const k of ['N', 'ds', 'cx', 'cz', 'base', 'H', 'tx', 'tz', 'pit']) this[k] = this.main[k];
    this.ramps = this.paths.flatMap((p) => p.ramps);
    this.pads = this.paths.flatMap((p) => p.pads);
    this.noise = makeNoise(def.seed ?? 3);
    this._buildBuckets();
  }

  path(id) { return this.paths.find((p) => p.id === id) || this.main; }

  _buildBuckets() {
    this.bucket = 40;
    this.buckets = new Map();
    this.tunnelBuckets = new Map();
    this.viaductBuckets = new Map();
    this.paths.forEach((p, pi) => {
      for (let i = 0; i < p.N; i++) {
        const k = `${Math.floor(p.cx[i] / this.bucket)},${Math.floor(p.cz[i] / this.bucket)}`;
        const map = p.tunnel[i] ? this.tunnelBuckets : p.viaduct[i] ? this.viaductBuckets : this.buckets;
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(pi * 100000 + i);
      }
    });
  }

  // Nearest open-air road sample: { p, i, dist } or null.
  nearest(x, z, rings = 2, map = this.buckets) {
    const bx = Math.floor(x / this.bucket), bz = Math.floor(z / this.bucket);
    let best = -1, bd = Infinity;
    for (let r = 0; r <= rings; r++) {
      for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue;
        const list = map.get(`${bx + i},${bz + j}`);
        if (!list) continue;
        for (const code of list) {
          const p = this.paths[Math.floor(code / 100000)], k = code % 100000;
          const d = (p.cx[k] - x) ** 2 + (p.cz[k] - z) ** 2;
          if (d < bd) { bd = d; best = code; }
        }
      }
      if (best >= 0 && r >= 1) break;
    }
    if (best < 0) return null;
    return { p: this.paths[Math.floor(best / 100000)], i: best % 100000, dist: Math.sqrt(bd) };
  }

  nearestIndex(x, z, rings) { const n = this.nearest(x, z, rings); return n && n.p === this.main ? n.i : -1; }

  // Main-loop only query (scenery placement, camera fallbacks).
  query(x, z, hint = -1, out = {}) { return this.main.query(x, z, hint, out); }

  // Find which road a kart is on. `loc` keeps per-kart hints between frames.
  locate(x, z, y, loc, out) {
    loc.hints ??= {};
    let best = null, bestScore = Infinity;
    const tmp = this._tmpQ ??= {};
    for (const p of this.paths) {
      const cur = loc.path === p;
      if (!cur && p !== this.main && !p.inBox(x, z)) continue;
      const q = p.query(x, z, loc.hints[p.id] ?? -1, cur ? out : (tmp[p.id] ??= {}));
      loc.hints[p.id] = q.index;
      if (q.beyond) continue;
      const ad = Math.abs(q.d);
      // on the tarmac beats being on another road's shoulder, which beats being outside
      let score = ad <= q.roadHalf + 0.5 ? ad * 0.15 : ad <= q.wallHalf + 0.5 ? 2.5 + (ad - q.roadHalf) * 0.4 : 50 + ad;
      if (y !== undefined) score += Math.max(0, Math.abs(y - q.roadH) - 3) * 4;
      if (cur) score -= 1.2;
      if (score < bestScore) { bestScore = score; best = q; }
    }
    if (best !== out) Object.assign(out, best);
    loc.path = out.path;
    return out;
  }

  // Ground under a point for physics: { h, surface }. Pits are 'sludge' in
  // physics terms whatever they look like.
  ground(x, z, q) {
    const ad = Math.abs(q.d);
    if (q.pit && ad < q.wallHalf + 2) return { h: q.pitLevel, surface: 'sludge' };
    if (q.tunnel) return { h: q.roadH, surface: ad <= q.roadHalf ? q.path.surface : 'gravel' };
    if (ad <= q.roadHalf || q.bridge) return { h: q.roadH, surface: q.path.surface };
    const lake = this.lakeAt(x, z);
    if (lake) return { h: Math.max(lake.level, this.terrainAt(x, z)), surface: 'ice' };
    const h = this.terrainAt(x, z);
    if (this.sea && h < this.sea.level - 0.2) return { h: this.sea.level, surface: 'sludge' }; // into the bay
    return { h, surface: 'dirt' };
  }

  lakeAt(x, z) {
    for (const L of this.lakes) if (((x - L.x) / L.rx) ** 2 + ((z - L.z) / L.rz) ** 2 < 1) return L;
    return null;
  }

  _terrainFormula(x, z) {
    const n = this.noise(x, z);
    const near = this.nearest(x, z, this.def.terrainReach ?? 5);
    let h;
    if (!near) h = 6 + n * 22 + this._mounds(x, z);
    else {
      const { p, i, dist } = near;
      const level = p.base[i] - 0.12;
      if (p.pit[i] && dist < p.wallHalf + 3) h = p.pitLevel[i] - 3.5;
      else {
        const w = smooth(p.wallHalf - 1, p.wallHalf + 55, dist);
        const mid = p.base[i] * 0.75 + (n - 0.5) * 14 + 2 + this._mounds(x, z);
        h = level * (1 - w) + mid * w + (dist > p.wallHalf ? (n - 0.5) * 1.2 * w : 0);
      }
      // `viewSlope`: beside open road the land may only rise gently, so banks and
      // hills never hide the road ahead. Hills over tunnels (and round their
      // mouths) are left alone, fading in over 45 m past each portal.
      const vs = this.def.viewSlope;
      if (vs && !p.pit[i]) {
        const s = i * p.ds;
        let gap = Infinity;
        for (const [a, b] of p.tunnelRanges) gap = Math.min(gap, s < a ? a - s : s > b ? s - b : 0);
        const f = smooth(40, 85, gap);
        if (f > 0) {
          const x2 = Math.max(0, dist - p.roadHalf - 4);
          const cap = p.base[i] + 0.4 + x2 * vs + x2 * x2 * 0.004;
          if (h > cap) h += (cap - h) * f;
        }
      }
    }
    // frozen lakes: a flat bed under the ice sheet, shelving up to the shore
    for (const L of this.lakes) {
      const e = Math.hypot((x - L.x) / L.rx, (z - L.z) / L.rz);
      if (e < 1.35) h = h + (L.level - 1.2 - h) * (1 - smooth(0.92, 1.35, e));
    }
    // open water: carve the bay down to the sea bed, shelving up to the shore
    for (const W of this.waters) {
      const e = Math.hypot((x - W.x) / W.rx, (z - W.z) / W.rz);
      if (e < 1.35) h = h + (this.sea.bed - h) * (1 - smooth(0.92, 1.35, e));
    }
    for (const I of this.def.islands || []) { // rocky islands standing out of the bay
      const e = Math.hypot((x - I.x) / I.rx, (z - I.z) / I.rz);
      if (e < 1) h = Math.max(h, this.sea.level + I.h * (1 - smooth(0.55, 1, e)) + (n - 0.5) * 2);
    }
    // stay well clear under a viaduct
    const vn = this.nearest(x, z, 1, this.viaductBuckets);
    if (vn && vn.dist < vn.p.roadHalf + 5) h = Math.min(h, vn.p.base[vn.i] - 6);
    // keep hills over tunnels so the roof is always buried
    this._tunnelFlag = 0;
    const tn = this.nearest(x, z, 1, this.tunnelBuckets);
    if (tn && tn.dist < tn.p.roadHalf + 6) {
      // only between the portals, so the hill never spills over the tunnel mouths
      const { p, i } = tn;
      const s = i * p.ds + (x - p.cx[i]) * p.tx[i] + (z - p.cz[i]) * p.tz[i];
      if (p.tunnelRanges.some(([s0, s1]) => s > s0 - 1 && s < s1 + 1)) { h = Math.max(h, p.base[i] + 9.5); this._tunnelFlag = 1; }
      else this._tunnelFlag = 2; // just outside a tunnel mouth
    }
    return Math.min(h, this._roadCeiling(x, z)) + this._edgeRise(x, z);
  }

  // The ground may never rise over an open road: beside any stretch of open-air road
  // (shortcuts and forks included) it is capped just under that road's surface.
  _roadCeiling(x, z) {
    const bx = Math.floor(x / this.bucket), bz = Math.floor(z / this.bucket);
    let cap = Infinity;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const list = this.buckets.get(`${bx + i},${bz + j}`);
      if (!list) continue;
      for (const code of list) {
        const p = this.paths[Math.floor(code / 100000)], k = code % 100000;
        const dx = x - p.cx[k], dz = z - p.cz[k];
        const along = dx * p.tx[k] + dz * p.tz[k];
        if (Math.abs(along) > p.ds * 0.75) continue; // only the sample level with this point
        if (Math.abs(dx * -p.tz[k] + dz * p.tx[k]) > p.roadHalf + 2.5) continue;
        cap = Math.min(cap, p.base[k] - 0.15);
      }
    }
    return cap;
  }

  _mounds(x, z) {
    let h = 0;
    for (const m of this.def.mounds || []) {
      const d = Math.hypot((x - m.x) / m.rx, (z - m.z) / m.rz);
      if (d < 1) h += m.h * (1 - d * d) ** 2;
    }
    return h;
  }

  _edgeRise(x, z) {
    const b = this.bounds;
    if (!b) return 0;
    const e = Math.min(x - b.minX, b.maxX - x, z - b.minZ, b.maxZ - z);
    return (1 - smooth(0, 220, e)) * 70;
  }

  terrainAt(x, z) {
    const T = this.terrain;
    const fx = (x - T.minX) / T.cell, fz = (z - T.minZ) / T.cell;
    const ix = Math.min(T.nx - 1, Math.max(0, Math.floor(fx))), iz = Math.min(T.nz - 1, Math.max(0, Math.floor(fz)));
    const u = Math.min(1, Math.max(0, fx - ix)), v = Math.min(1, Math.max(0, fz - iz));
    const W = T.nx + 1;
    const h00 = T.h[iz * W + ix], h10 = T.h[iz * W + ix + 1], h01 = T.h[(iz + 1) * W + ix], h11 = T.h[(iz + 1) * W + ix + 1];
    if (u + v <= 1) return h00 + (h10 - h00) * u + (h01 - h00) * v;
    return h11 + (h01 - h11) * (1 - u) + (h10 - h11) * (1 - v);
  }

  pose(s, d = 0) { return this.main.pose(s, d); }

  // Is a point inside any road corridor other than `except`?
  inOtherCorridor(x, z, except, margin = 0) {
    for (const p of this.paths) {
      if (p === except || (!p.inBox(x, z))) continue;
      const q = p.query(x, z, -1, {});
      if (!q.beyond && Math.abs(q.d) < p.wallHalf + margin) return true;
    }
    return false;
  }

  build(scene, quality = 'high') {
    const group = new THREE.Group();
    scene.add(group);
    this.group = group;
    this.quality = quality;
    this._buildTerrain(group);
    this._buildRoads(group);
    this._buildRamps(group);
    this._buildPits(group);
    this._buildTunnels(group);
    this._buildViaducts(group);
    this._buildLakes(group);
    this._buildSea(group);
    return group;
  }

  // Ice sheets over frozen lakes, with holes cut where a pit breaks through.
  _buildLakes(group) {
    if (!this.lakes.length) return;
    const t = iceTexture();
    for (const m of [t.map, t.normal]) m.repeat.set(1 / 14, 1 / 14);
    const mat = new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normal, roughness: 0.06, metalness: 0.1, envMapIntensity: 1.5 });
    for (const L of this.lakes) {
      const shape = new THREE.Shape();
      shape.absellipse(L.x, -L.z, L.rx, L.rz, 0, Math.PI * 2, false);
      for (const r of this.ramps) {
        if (!r.pit) continue;
        const p = r.path, a = r.s + r.len - 1, b = r.s + r.len + r.pit + 1, w = p.wallHalf + 5;
        const mid = p.pose((a + b) / 2);
        if (!this.lakeAt(mid.x, mid.z)) continue;
        const hole = new THREE.Path();
        const corners = [p.pose(a, -w), p.pose(b, -w), p.pose(b, w), p.pose(a, w)];
        corners.forEach((c, i) => (i ? hole.lineTo(c.x, -c.z) : hole.moveTo(c.x, -c.z)));
        hole.closePath();
        shape.holes.push(hole);
      }
      const g = new THREE.ShapeGeometry(shape, 64);
      g.rotateX(-Math.PI / 2);
      const uv = g.attributes.uv, pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i));
      const m = new THREE.Mesh(g, mat);
      m.position.y = L.level;
      m.receiveShadow = true;
      group.add(m);
    }
  }

  // One sheet of water at sea level; the ground hides it everywhere but the bay.
  _buildSea(group) {
    if (!this.sea) return;
    const b = this.bounds, tex = bayWaterTexture();
    tex.repeat.set((b.maxX - b.minX) / 40, (b.maxZ - b.minZ) / 40);
    const wn = waterNormalTexture();
    wn.repeat.set((b.maxX - b.minX) / 60, (b.maxZ - b.minZ) / 60);
    this.seaMat = new THREE.MeshStandardMaterial({ map: tex, normalMap: wn, normalScale: new THREE.Vector2(0.45, 0.45), color: 0xffffff, roughness: 0.08, metalness: 0.2, envMapIntensity: 1.5 });
    const g = new THREE.PlaneGeometry(b.maxX - b.minX, b.maxZ - b.minZ);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, this.seaMat);
    m.position.set((b.minX + b.maxX) / 2, this.sea.level, (b.minZ + b.maxZ) / 2);
    m.receiveShadow = true;
    group.add(m);
  }

  dispose() {
    this.group?.parent?.remove(this.group);
    this.group?.traverse((o) => {
      o.geometry?.dispose();
      for (const m of [].concat(o.material || [])) { for (const k of ['map', 'normalMap', 'roughnessMap', 'emissiveMap']) m[k]?.dispose(); m.dispose(); }
    });
  }

  _buildTerrain(group) {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const p of this.paths) for (let i = 0; i < p.N; i++) {
      minX = Math.min(minX, p.cx[i]); maxX = Math.max(maxX, p.cx[i]);
      minZ = Math.min(minZ, p.cz[i]); maxZ = Math.max(maxZ, p.cz[i]);
    }
    const M = this.def.terrainMargin ?? 420;
    this.bounds = { minX: minX - M, maxX: maxX + M, minZ: minZ - M, maxZ: maxZ + M };
    const cell = 5;
    const nx = Math.ceil((this.bounds.maxX - this.bounds.minX) / cell), nz = Math.ceil((this.bounds.maxZ - this.bounds.minZ) / cell);
    const h = new Float32Array((nx + 1) * (nz + 1));
    const flags = new Uint8Array(h.length);
    const geo = new THREE.PlaneGeometry(nx * cell, nz * cell, nx, nz);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const tint = this.def.groundTint || (() => null);
    const snow = this.theme.ground === 'snow';
    const rockCol = new THREE.Color(0.4, 0.39, 0.4);
    const c = new THREE.Color();
    for (let iz = 0; iz <= nz; iz++) for (let ix = 0; ix <= nx; ix++) {
      const k = iz * (nx + 1) + ix;
      const x = this.bounds.minX + ix * cell, z = this.bounds.minZ + iz * cell;
      const y = this._terrainFormula(x, z);
      h[k] = y;
      flags[k] = this._tunnelFlag;
      pos.setXYZ(k, x, y, z);
      const near = this.nearest(x, z, 2);
      const dist = near ? near.dist : 999;
      const n = this.noise(x * 3, z * 3);
      const n2 = this.noise(x * 0.7 + 300, z * 0.7);
      if (snow) {
        if (near && near.p.pit[near.i] && dist < near.p.wallHalf + 3) c.setRGB(0.3, 0.42, 0.52);
        else if (dist < (near ? near.p.wallHalf : 16) + 1) c.setRGB(0.78 + n * 0.06, 0.8 + n * 0.06, 0.84 + n * 0.05); // ploughed verge
        else c.setRGB(0.88 + n2 * 0.06, 0.9 + n2 * 0.05, 0.95 + n2 * 0.03 - n * 0.04);
        // bare rock on steep slopes peeks through
        const slope = (ix ? Math.abs(h[k - 1] - y) : 0) + (iz ? Math.abs(h[k - nx - 1] - y) : 0);
        if (slope > 7 && dist > 30) c.lerp(rockCol, Math.min(0.7, (slope - 7) * 0.12));
      } else if (near && near.p.pit[near.i] && dist < near.p.wallHalf + 3) c.setRGB(0.16, 0.3, 0.08);
      else if (dist < (near ? near.p.wallHalf : 16) + 1) c.setRGB(0.42 + n * 0.08, 0.37 + n * 0.06, 0.29);
      else c.setRGB(0.27 + n * 0.12 + n2 * 0.06, 0.43 + n * 0.12 + n2 * 0.06, 0.13 + n2 * 0.05); // lush stylised grass
      const t = tint(x, z, dist);
      if (t) c.lerp(t, t.amount ?? 0.7);
      colors[k * 3] = c.r; colors[k * 3 + 1] = c.g; colors[k * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    // Where the hill over a tunnel meets the open road at its mouth, the ground
    // would slope down through the tube. Cut those few triangles out; the portal
    // facade hides the gap.
    const idx = geo.index.array, keep = [];
    for (let t = 0; t < idx.length; t += 3) {
      const f = flags[idx[t]] | flags[idx[t + 1]] | flags[idx[t + 2]];
      if (f !== 3) keep.push(idx[t], idx[t + 1], idx[t + 2]);
    }
    geo.setIndex(keep);
    geo.computeVertexNormals();
    let gt, gn;
    if (snow) ({ map: gt, normal: gn } = snowTexture());
    else { gt = groundTexture(); gn = groundNormalTexture(); }
    gt.repeat.set(nx / 3, nz / 3);
    gn.repeat.copy(gt.repeat);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, map: gt, normalMap: gn, normalScale: new THREE.Vector2(0.8, 0.8), roughness: snow ? 0.8 : 0.95 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    group.add(mesh);
    this.terrainMesh = mesh;
    this.terrain = { minX: this.bounds.minX, minZ: this.bounds.minZ, cell, nx, nz, h };
  }

  _ribbon(p, from, to, dl, dr, lift, uvScale, mat, skip = null, flat = null) {
    const pos = [], uv = [], idx = [];
    let n = 0, prevOk = false;
    const step = p.ds;
    for (let s = from; s <= to + 1e-6; s += step) {
      const q = p.pose(s);
      const ok = !(skip && skip(q.index));
      const hy = flat ?? q.y + lift;
      pos.push(q.x - q.tz * dl, hy, q.z + q.tx * dl, q.x - q.tz * dr, hy, q.z + q.tx * dr);
      uv.push(0, s / uvScale, 1, s / uvScale);
      if (n > 0 && ok && prevOk) { const a = (n - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      prevOk = ok; n++;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    m.receiveShadow = true;
    return m;
  }

  // A vertical strip following a road at offset d, from lo to hi above its surface.
  _wall(p, from, to, d, lo, hi, mat) {
    const pos = [], uv = [], idx = [];
    let n = 0;
    for (let s = from; s <= to + 1e-6; s += p.ds) {
      const q = p.pose(s), x = q.x - q.tz * d, z = q.z + q.tx * d;
      pos.push(x, q.y + lo, z, x, q.y + hi, z);
      uv.push(s / 4, 0, s / 4, (hi - lo) / 4);
      if (n > 0) { const a = (n - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      n++;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }

  _buildRoads(group) {
    const winter = this.theme.ground === 'snow';
    const asphalt = asphaltTexture({ winter });
    const roadMat = new THREE.MeshStandardMaterial({ map: asphalt.map, normalMap: asphalt.normal, roughnessMap: asphalt.rough, roughness: 1, metalness: 0.0 });
    const mats = { road: roadMat };
    this.roadMat = roadMat;
    const lazy = {
      cobble: () => { const t = cobbleTexture(); return new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normal, roughness: 0.9 }); },
      ice: () => { const t = iceTexture(); return new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normal, roughness: 0.08, metalness: 0.1, envMapIntensity: 1.4 }); },
      brick: () => { const t = brickRoadTexture(); return new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normal, roughness: 0.85 }); },
    };
    const uvScales = { gravel: 4, cobble: 6, ice: 14, brick: 6 };
    const gravel = gravelTexture();
    for (const t of [gravel.map, gravel.normal]) t.repeat.set(3, 1); // finer stones across the path
    const gravelMat = new THREE.MeshStandardMaterial({ map: gravel.map, normalMap: gravel.normal, roughness: 1 });
    mats.gravel = gravelMat;
    const skirtMat = new THREE.MeshStandardMaterial({ map: concreteTexture(), color: winter ? 0xc9ced6 : 0x9a968b, roughness: 1, side: THREE.DoubleSide });
    for (const p of this.paths) {
      const mat = mats[p.surface] ??= lazy[p.surface]?.() ?? roadMat;
      if (p.surface === 'cobble' || p.surface === 'brick') { mat.map.repeat.set(2, 1); mat.normalMap.repeat.set(2, 1); }
      group.add(this._ribbon(p, 0, p.closed ? p.length : p.length - 0.01, -p.roadHalf, p.roadHalf, p === this.main ? 0 : 0.02, uvScales[p.surface] ?? 18, mat, (i) => p.pit[i]));
      for (const side of [-1, 1]) {
        const pos = [], idx = [], uv = [];
        let n = 0, prevOk = false;
        for (let s = 0; s <= p.length + 1e-6; s += p.ds) {
          const q = p.pose(s);
          const ok = !p.pit[q.index];
          const d = side * p.roadHalf;
          const x = q.x - q.tz * d, z = q.z + q.tx * d;
          pos.push(x, q.y, z, x, Math.min(q.y, q.baseY) - 3.5, z);
          uv.push(s / 4, 0, s / 4, 1);
          if (n > 0 && ok && prevOk) { const a = (n - 1) * 2; idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
          prevOk = ok; n++;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        g.setIndex(idx);
        g.computeVertexNormals();
        group.add(new THREE.Mesh(g, skirtMat));
      }
    }
    const line = this._ribbon(this.main, 0, 3, -this.roadHalf, this.roadHalf, 0.03, 3, new THREE.MeshStandardMaterial({ map: checkerTexture(), roughness: 0.8 }));
    group.add(line);
  }

  _buildRamps(group) {
    const ht = hazardTexture();
    const mat = new THREE.MeshStandardMaterial({ map: ht, roughness: 0.6 });
    for (const r of this.ramps) {
      const p = r.path;
      group.add(this._ribbon(p, r.s, r.s + r.len, -p.roadHalf, p.roadHalf, 0.03, 6, mat));
      const e = p.pose(r.s + r.len);
      const drop = r.h + (r.pit ? Math.max(3, e.y - r.level) : 0);
      const lip = new THREE.Mesh(new THREE.PlaneGeometry(p.roadHalf * 2, drop), new THREE.MeshStandardMaterial({ map: ht, side: THREE.DoubleSide }));
      lip.position.set(e.x, e.y - drop / 2, e.z);
      lip.rotation.y = e.yaw;
      group.add(lip);
    }
    const pt = this.theme.pad || {};
    const padTex = boostPadTexture(pt.bg, pt.fg);
    const pad = new THREE.MeshStandardMaterial({ map: padTex, emissive: pt.emissive ?? 0x3dff20, emissiveIntensity: 1.2, emissiveMap: padTex, roughness: 0.5 });
    this.padMat = pad;
    for (const f of this.pads) group.add(this._ribbon(f.path, f.s, f.s + 8, f.d - 2.5, f.d + 2.5, 0.05, 8, pad));
  }

  _buildPits(group) {
    const icy = this.theme.pit === 'water' || this.theme.pit === 'bay';
    const blood = this.theme.pit === 'blood';
    const st = this.theme.pit === 'bay' ? bayWaterTexture() : icy ? icyWaterTexture() : blood ? bloodTexture() : sludgeTexture();
    st.repeat.set(3, 3);
    this.sludgeMats = [];
    for (const r of this.ramps) {
      if (!r.pit) continue;
      const p = r.path;
      const mat = icy
        ? new THREE.MeshStandardMaterial({ map: st, roughness: 0.05, metalness: 0.3 })
        : blood ? new THREE.MeshStandardMaterial({ map: st, emissive: 0x400000, emissiveIntensity: 0.6, emissiveMap: st, roughness: 0.06, metalness: 0.2 })
        : new THREE.MeshStandardMaterial({ map: st, emissive: 0x3dff20, emissiveIntensity: 0.9, emissiveMap: st, roughness: 0.2, metalness: 0.1 });
      if (!icy) this.sludgeMats.push(mat);
      else this.waterMats = [...(this.waterMats || []), mat];
      const s0 = r.s + r.len - 4, s1 = r.s + r.len + r.pit + 4;
      if (!(this.sea && r.level <= this.sea.level + 0.6)) // a gap over the bay shows the sea itself
        group.add(this._ribbon(p, s0, s1, -p.wallHalf - 5, p.wallHalf + 5, 0, 12, mat, null, r.level));
      // steep rock walls down to the sludge, so the gap reads as a real chasm
      const rock = new THREE.MeshStandardMaterial({ color: this.theme.pitWall ?? 0x4b463d, roughness: 1, side: THREE.DoubleSide });
      for (const s of [r.s + r.len, r.s + r.len + r.pit]) {
        const e = p.pose(s);
        const hgt = Math.min(e.y, e.baseY) - r.level + 1; // top just under the road edge; the hazard lip covers the ramp face
        const wall = new THREE.Mesh(new THREE.BoxGeometry(p.wallHalf * 2 + 10, hgt, 2), rock);
        wall.position.set(e.x - e.tx * (s === r.s + r.len ? -1 : 1), r.level + hgt / 2 - 1.2, e.z - e.tz * (s === r.s + r.len ? -1 : 1));
        wall.rotation.y = e.yaw;
        group.add(wall);
      }
    }
  }

  // Raised roads: a slab under the deck, a concrete parapet each side and
  // columns down to the ground (leave them out with pillars: false).
  _buildViaducts(group) {
    const mat = new THREE.MeshStandardMaterial({ map: concreteTexture(), color: this.def.viaductColor ?? 0xb4b0a6, roughness: 0.95, side: THREE.DoubleSide });
    const cols = [], m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), up = THREE.Object3D.DEFAULT_UP;
    for (const p of this.paths) for (const b of p.bridges) {
      if (!b.viaduct) continue;
      const s0 = Math.max(0, b.s), s1 = Math.min(p.closed ? b.s + b.len : p.length - 0.01, b.s + b.len);
      group.add(this._ribbon(p, s0, s1, -p.roadHalf, p.roadHalf, -3.5, 8, mat)); // underside
      if (b.parapet !== false) for (const side of [-1, 1]) {
        const d0 = side * (p.roadHalf + 0.15), d1 = side * (p.roadHalf + 0.6);
        group.add(this._ribbon(p, s0, s1, Math.min(d0, d1), Math.max(d0, d1), 0.9, 8, mat));
        for (const d of [d0, d1]) group.add(this._wall(p, s0, s1, d, -0.1, 0.9, mat));
      }
      if (b.pillars === false) continue;
      for (let s = s0 + 8; s < s1 - 4; s += b.pillarStep ?? 18) {
        const q = p.pose(s);
        const g = this.terrainAt(q.x, q.z), top = q.y - 3.4;
        if (top - g < 1.5) continue;
        for (const d of p.roadHalf > 7 ? [-p.roadHalf * 0.55, p.roadHalf * 0.55] : [0]) {
          qt.setFromAxisAngle(up, q.yaw);
          m4.compose(new THREE.Vector3(q.x - q.tz * d, (top + g) / 2 - 1, q.z + q.tx * d), qt, new THREE.Vector3(1, top - g + 2, 1));
          cols.push(m4.clone());
        }
      }
    }
    if (cols.length) {
      const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1.8, 1, 2.6), mat, cols.length);
      cols.forEach((m, i) => im.setMatrixAt(i, m));
      im.castShadow = true; im.receiveShadow = true;
      group.add(im);
    }
  }

  _buildTunnels(group) {
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x222211, emissive: this.theme.tunnelLamp ?? 0x8dff5a, emissiveIntensity: 2.2 });
    const wallTex = concreteTexture();
    this.tunnelLights = [];
    for (const p of this.paths) for (const [s0, s1] of p.tunnelRanges) {
      const look = p === this.main ? this.def : p.def;
      const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, color: look?.wallColor ?? 0x6d6a62, roughness: 0.95, side: THREE.DoubleSide });
      const W = p.roadHalf + 1.5, Hh = 7.5, seg = 14;
      const pos = [], uv = [], idx = [];
      let n = 0;
      for (let s = s0 - 2; s <= s1 + 2; s += p.ds) {
        const q = p.pose(s);
        for (let j = 0; j <= seg; j++) {
          const a = (j / seg) * Math.PI;
          const lx = Math.cos(a) * W, ly = Math.sin(a) * Hh;
          pos.push(q.x - q.tz * lx, q.y - 0.4 + ly, q.z + q.tx * lx);
          uv.push(j / seg * 4, s / 6);
        }
        if (n > 0) for (let j = 0; j < seg; j++) {
          const a = (n - 1) * (seg + 1) + j, b = a + seg + 1;
          idx.push(a, b, a + 1, a + 1, b, b + 1);
        }
        n++;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      g.computeVertexNormals();
      const tube = new THREE.Mesh(g, wallMat);
      tube.castShadow = true; tube.receiveShadow = true;
      group.add(tube);
      // ceiling lamps every 12 m
      const lampGeo = new THREE.BoxGeometry(0.5, 0.15, 2.4);
      const count = Math.floor((s1 - s0) / 12);
      const lamps = new THREE.InstancedMesh(lampGeo, lampMat, count);
      const m4 = new THREE.Matrix4(), qt = new THREE.Quaternion();
      for (let i = 0; i < count; i++) {
        const q = p.pose(s0 + 6 + i * 12);
        qt.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, q.yaw);
        m4.compose(new THREE.Vector3(q.x, q.y + Hh - 0.6, q.z), qt, new THREE.Vector3(1, 1, 1));
        lamps.setMatrixAt(i, m4);
      }
      group.add(lamps);
      // portal facades
      const portalMat = new THREE.MeshStandardMaterial({ map: wallTex, color: look?.portalColor ?? 0xb5b0a3, roughness: 1 });
      for (const [s, dir] of [[s0 - 2, -1], [s1 + 2, 1]]) {
        const q = p.pose(s);
        const shape = new THREE.Shape();
        shape.moveTo(-W - 4, -3); shape.lineTo(W + 4, -3); shape.lineTo(W + 4, Hh + 2.2); shape.lineTo(-W - 4, Hh + 2.2); shape.lineTo(-W - 4, -3);
        const hole = new THREE.Path();
        hole.moveTo(W, -0.4);
        hole.absellipse(0, -0.4, W, Hh, 0, Math.PI, false);
        hole.lineTo(-W, -0.4);
        hole.lineTo(W, -0.4);
        shape.holes.push(hole);
        const pg = new THREE.ExtrudeGeometry(shape, { depth: 1.5, bevelEnabled: false });
        pg.translate(0, 0, -0.75);
        const portal = new THREE.Mesh(pg, portalMat);
        portal.position.set(q.x, q.y, q.z);
        portal.rotation.y = q.yaw;
        portal.castShadow = true;
        group.add(portal);
        p.portals ??= [];
        p.portals.push({ x: q.x, y: q.y, z: q.z, yaw: q.yaw, dir });
      }
    }
  }

  update(t, race) {
    for (const f of this.extraUpdates || []) f(t, race); // trackside dressing: start lights, crowds, blimp
    for (const m of this.sludgeMats || []) { m.map.offset.set(Math.sin(t * 0.3) * 0.2, t * 0.05); m.emissiveIntensity = 0.8 + Math.sin(t * 3) * 0.2; }
    if (this.padMat) this.padMat.emissiveIntensity = 1.0 + Math.sin(t * 8) * 0.5;
    for (const m of this.waterMats || []) m.map.offset.set(Math.sin(t * 0.2) * 0.05, t * 0.01);
    if (this.seaMat) { this.seaMat.map.offset.set(Math.sin(t * 0.15) * 0.08, t * 0.006); this.seaMat.normalMap.offset.set(t * 0.004, -t * 0.003); }
  }
}
