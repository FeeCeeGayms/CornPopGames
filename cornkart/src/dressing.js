// Trackside dressing that gives every track the look of a modern kart racer:
// painted curbs and padded barriers on the corners, chevron boards, sponsor
// boards and bunting along the straights, an inflatable start arch with real
// start lights, grandstands full of fans, flags, a blimp overhead and drifting
// motes of light. Each track tunes the colours with a `dressing` block in its def.
//
// Nothing here changes the physics: it is all placed outside the driving line,
// and an occupancy map of the track's own scenery keeps it clear of buildings,
// trees and landmarks.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { rng, glowSprite } from './textures.js';
import { fogHook, WIND } from './graphics.js';

const DEFAULTS = {
  curb: ['#e3342b', '#f5f5f2'],
  barrier: { type: 'tecpro', colors: [0xe3342b, 0xf5f5f2] },
  chevron: ['#ffd21a', '#161616'],
  flags: [0xe3342b, 0xffd21a, 0x2a7de1, 0x3cc34a, 0xffffff],
  arch: 0xe3342b,
  archTrim: 0xffffff,
  seats: 0x2a7de1,
  roof: 0xd8d8d4,
  ads: [
    ['CORNKART', '#ffd21a', '#d4202a'], ['CORN COLA', '#ffffff', '#b8121b'], ['HUSK TYRES', '#ffd21a', '#161616'],
    ['KERNEL OIL', '#ffffff', '#1d4fa8'], ['POP! ENERGY', '#161616', '#7dff3a'], ['COB & SONS', '#ffffff', '#2c8a3c'],
    ['BUTTER BOOST', '#5a3200', '#ffcf3a'], ['FREN RACER', '#ffffff', '#7a2cc0'],
  ],
  crowd: true, blimp: true, balloons: false, motes: null, bunting: 8,
};

// --- Helpers ------------------------------------------------------------------

function canvas(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function tex(c, repeat = false) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const FONT = (px) => `italic 900 ${px}px "Russo One", "Arial Black", Impact, sans-serif`;

// Signed curvature per sample (1/m). Positive turns towards +d (the right).
function curvature(p) {
  if (p._curv) return p._curv;
  const N = p.N, k = new Float32Array(N), w = 4;
  const idx = (i) => p.closed ? (i + N) % N : Math.min(N - 1, Math.max(0, i));
  for (let i = 0; i < N; i++) {
    const a = idx(i - w), b = idx(i + w);
    const cr = p.tx[a] * p.tz[b] - p.tz[a] * p.tx[b], dt = p.tx[a] * p.tx[b] + p.tz[a] * p.tz[b];
    k[i] = Math.atan2(cr, dt) / ((p.closed ? 2 * w : Math.max(1, b - a)) * p.ds);
  }
  return (p._curv = k);
}

// Corner mask: samples on or near a bend tighter than `radius`, dilated a little.
function cornerMask(p, radius = 140, grow = 9) {
  const key = `_mask${radius}`;
  if (p[key]) return p[key];
  const k = curvature(p), N = p.N, m = new Int8Array(N);
  for (let i = 0; i < N; i++) {
    if (Math.abs(k[i]) < 1 / radius) continue;
    const side = k[i] > 0 ? -1 : 1; // outside of the bend
    for (let j = -grow; j <= grow; j++) {
      const t = p.closed ? (i + j + N) % N : i + j;
      if (t >= 0 && t < N) m[t] = side;
    }
  }
  return (p[key] = m);
}

// Which side of the road (if any) gets a corner barrier at distance s: -1, 1 or 0.
// Tracks call this to keep their own wall dressing out of the way.
export function cornerSide(path, s) {
  return path.secret || path.surface !== 'road' ? 0 : cornerMask(path)[path.at(s)];
}

const openAir = (p, i) => !p.tunnel[i] && !p.pit[i] && !p.bridge[i];

// Occupancy map of what the track's scenery already put on the ground, so the
// dressing never lands inside a house, a tree or a landmark.
function occupancy(root, track) {
  const cell = 3, grid = new Set();
  const key = (i, j) => i * 100003 + j;
  const mark = (minX, maxX, minZ, maxZ) => {
    for (let i = Math.floor(minX / cell); i <= Math.floor(maxX / cell); i++)
      for (let j = Math.floor(minZ / cell); j <= Math.floor(maxZ / cell); j++) grid.add(key(i, j));
  };
  root.updateMatrixWorld(true);
  const box = new THREE.Box3(), m = new THREE.Matrix4(), v = new THREE.Vector3(), sc = new THREE.Vector3(), q = new THREE.Quaternion();
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry || o.userData.dressing || o.userData.soft) return;
    const g = o.geometry;
    if (!g.boundingSphere) g.computeBoundingSphere();
    if (o.isInstancedMesh) {
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, m); m.premultiply(o.matrixWorld); m.decompose(v, q, sc);
        const r = g.boundingSphere.radius * Math.max(sc.x, sc.z) * 0.55;
        if (r < 0.9) continue; // grass, flowers and pebbles don't count
        const ry = v.y + g.boundingSphere.center.y * sc.y - g.boundingSphere.radius * sc.y;
        if (ry > track.terrainAt(v.x, v.z) + 4) continue; // overhead
        mark(v.x - r, v.x + r, v.z - r, v.z + r);
      }
    } else {
      box.setFromObject(o);
      if ((box.max.x - box.min.x) * (box.max.z - box.min.z) > 5000) return; // bridges, moons, skies
      const cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2;
      if (box.min.y > track.terrainAt(cx, cz) + 4) return; // signs over the road
      mark(box.min.x, box.max.x, box.min.z, box.max.z);
    }
  });
  return {
    free(x, z, r = 1) {
      for (let i = Math.floor((x - r) / cell); i <= Math.floor((x + r) / cell); i++)
        for (let j = Math.floor((z - r) / cell); j <= Math.floor((z + r) / cell); j++) if (grid.has(key(i, j))) return false;
      return true;
    },
    take(x, z, r) { mark(x - r, x + r, z - r, z + r); },
  };
}

// Shared cloth material: vertices carry a wave direction (aWave) and phase
// (aPhase); flags ripple and bunting flutters without any per-frame CPU work.
function clothMaterial(opts = {}) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.75, ...opts });
  mat.onBeforeCompile = (shader) => {
    fogHook(shader);
    shader.uniforms.uWindTime = WIND.time;
    shader.vertexShader = 'uniform float uWindTime;\nattribute vec3 aWave;\nattribute float aPhase;\n' + shader.vertexShader.replace('#include <begin_vertex>',
      `#include <begin_vertex>
      transformed += aWave * (sin(uWindTime * 5.0 + aPhase) * 0.75 + sin(uWindTime * 8.3 + aPhase * 1.6) * 0.25);`);
  };
  mat.customProgramCacheKey = () => 'cloth';
  return mat;
}

function paint(geo, color) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const c = new THREE.Color(color), a = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < a.length; i += 3) { a[i] = c.r; a[i + 1] = c.g; a[i + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}
function addWave(g, dir, amp, phase) { // constant wave for a whole piece, scaled per vertex by `amp(i)`
  const n = g.attributes.position.count, w = new Float32Array(n * 3), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) { const a = amp(i); w[i * 3] = dir.x * a; w[i * 3 + 1] = dir.y * a; w[i * 3 + 2] = dir.z * a; ph[i] = phase(i); }
  g.setAttribute('aWave', new THREE.BufferAttribute(w, 3));
  g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
  return g;
}
const strip = (g) => { for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color', 'aWave', 'aPhase'].includes(k)) g.deleteAttribute(k); return g; };

// --- The pieces -----------------------------------------------------------------

function curbTexture([a, b]) {
  const [c, g] = canvas(64, 128);
  g.fillStyle = a; g.fillRect(0, 0, 64, 64);
  g.fillStyle = b; g.fillRect(0, 64, 64, 64);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 62, 64, 3); g.fillRect(0, 126, 64, 2);
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 0, 64, 6); g.fillRect(0, 66, 64, 6);
  return tex(c, true);
}

// Raised curbs on both edges through every bend, on every open-air road.
function buildCurbs(group, track, D) {
  const pos = [], uv = [], idx = [];
  let base = 0;
  for (const p of track.paths) {
    if (p.secret || p.surface !== 'road') continue;
    const mask = cornerMask(p), lift = p === track.main ? 0 : 0.02;
    const N = p.N;
    for (const side of [-1, 1]) {
      let prev = false;
      for (let i = 0; i < (p.closed ? N + 1 : N); i++) {
        const ii = i % N;
        let ok = mask[ii] !== 0 && openAir(p, ii);
        const e = p.pose(ii * p.ds, side * (p.roadHalf + 0.2));
        if (ok && track.inOtherCorridor(e.x, e.z, p, -(p.wallHalf - p.roadHalf) + 0.8)) ok = false; // other road's tarmac
        if (!ok) { prev = false; continue; }
        const s = i * p.ds;
        for (const [d, h, u] of [[p.roadHalf - 0.85, 0.035, 0], [p.roadHalf - 0.15, 0.1, 0.7], [p.roadHalf + 0.35, -0.12, 1]]) {
          const q = p.pose(ii * p.ds, side * d);
          pos.push(q.x, q.y + h + lift, q.z);
          uv.push(u, s / 2.6);
        }
        if (prev) {
          const a = base - 3, b = base;
          const f = side > 0 ? [a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2] : [a, a + 1, b, a + 1, b + 1, b, a + 1, a + 2, b + 1, a + 2, b + 2, b + 1];
          idx.push(...f);
        }
        base += 3; prev = true;
      }
    }
  }
  if (!idx.length) return;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: curbTexture(D.curb), roughness: 0.55 }));
  m.receiveShadow = true;
  group.add(m);
}

// Padded barriers (or tyre stacks) round the outside of every bend.
function buildBarriers(group, track, D, occ) {
  const type = D.barrier?.type;
  if (!type || type === 'none') return;
  const [c0, c1] = D.barrier.colors.map((c) => new THREE.Color(c));
  let geo;
  if (type === 'tires') {
    const parts = [];
    for (const x of [-0.45, 0.45]) for (let k = 0; k < 3; k++) {
      const t = new THREE.TorusGeometry(0.33, 0.14, 6, 14); t.rotateX(Math.PI / 2); t.translate(x, 0.14 + k * 0.28, 0);
      parts.push(t);
    }
    geo = mergeGeometries(parts);
  } else {
    geo = new RoundedBoxGeometry(0.9, 1.0, 1.75, 2, 0.18); geo.translate(0, 0.5, 0);
  }
  const step = type === 'tires' ? 1.0 : 1.8;
  const list = [];
  for (const p of track.paths) {
    if (p.secret || p.surface !== 'road') continue;
    const mask = cornerMask(p);
    for (let s = 0; s < p.length; s += step) {
      const i = p.at(s), side = mask[i];
      if (!side || !openAir(p, i)) continue;
      const e = p.pose(s, side * (p.wallHalf + 0.55));
      if (track.inOtherCorridor(e.x, e.z, p, 1.5) || !occ.free(e.x, e.z, 0.8)) continue;
      list.push([e.x, track.terrainAt(e.x, e.z), e.z, e.yaw, s]);
    }
  }
  const inst = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: type === 'tires' ? 0.85 : 0.45 }), Math.max(1, list.length));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
  list.forEach(([x, y, z, yaw, s], n) => {
    q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);
    m4.compose(v.set(x, y - 0.05, z), q, one);
    inst.setMatrixAt(n, m4);
    inst.setColorAt(n, Math.floor(s / (step * (type === 'tires' ? 2 : 1))) % 2 ? c1 : c0);
  });
  inst.count = list.length;
  inst.castShadow = inst.receiveShadow = true;
  group.add(inst);
}

function chevronTexture([fg, bg], flip) {
  const [c, g] = canvas(128, 96);
  g.fillStyle = bg; g.fillRect(0, 0, 128, 96);
  g.fillStyle = fg;
  g.save();
  if (flip) { g.translate(128, 0); g.scale(-1, 1); }
  g.beginPath(); g.moveTo(30, 8); g.lineTo(70, 8); g.lineTo(108, 48); g.lineTo(70, 88); g.lineTo(30, 88); g.lineTo(68, 48); g.closePath(); g.fill();
  g.restore();
  g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(3, 3, 122, 90);
  return tex(c);
}

// Chevron boards on the outside of the tight bends, pointing the way.
function buildChevrons(group, track, D, occ) {
  const p = track.main, k = curvature(p), N = p.N;
  const mats = [false, true].map((flip) => {
    const t = chevronTexture(D.chevron, flip);
    return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.12, roughness: 0.5 });
  });
  const board = new THREE.PlaneGeometry(2.0, 1.5); board.translate(0, 1.55, 0);
  const back = new THREE.BoxGeometry(2.1, 1.6, 0.1); back.translate(0, 1.55, -0.07);
  const legs = [-0.7, 0.7].map((x) => new THREE.BoxGeometry(0.12, 1.0, 0.12).translate(x, 0.5, -0.07));
  const frame = mergeGeometries([back, ...legs]);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.6, metalness: 0.3 });
  const placed = [];
  for (let i = 0; i < N; i++) { // peaks of the tight bends
    const a = Math.abs(k[i]);
    if (a < 1 / 70) continue;
    let peak = true;
    for (let j = -12; j <= 12 && peak; j++) if (Math.abs(k[(i + j + N) % N]) > a) peak = false;
    if (!peak || !openAir(p, i)) continue;
    if (placed.some((s) => Math.abs(s - i * p.ds) < 60)) continue;
    placed.push(i * p.ds);
    const side = k[i] > 0 ? -1 : 1, right = k[i] > 0;
    for (let j = -2; j <= 2; j++) {
      const s = i * p.ds + j * 8;
      const e = p.pose(s, side * (p.wallHalf + 2.1));
      if (!openAir(p, p.at(s)) || track.inOtherCorridor(e.x, e.z, p, 1) || !occ.free(e.x, e.z, 1)) continue;
      const y = track.terrainAt(e.x, e.z);
      const yaw = Math.atan2(-(e.tx), -(e.tz)) + (side > 0 ? -0.35 : 0.35); // face the oncoming karts, angled in
      const b = new THREE.Mesh(board, mats[right ? 0 : 1]);
      const f = new THREE.Mesh(frame, frameMat);
      for (const o of [b, f]) { o.position.set(e.x, y, e.z); o.rotation.y = yaw; group.add(o); }
      f.castShadow = true;
      occ.take(e.x, e.z, 1.2);
    }
  }
}

function adAtlas(ads) {
  const W = 1024, H = 1024, cw = 512, ch = 128;
  const [c, g] = canvas(W, H);
  g.fillStyle = '#3a3d42'; g.fillRect(0, 0, W, H);
  ads.slice(0, 14).forEach(([text, fg, bg], i) => {
    const x = (i % 2) * cw, y = Math.floor(i / 2) * ch;
    g.fillStyle = bg; g.fillRect(x, y, cw, ch);
    g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(x, y, cw, ch * 0.45);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    let px = 84; g.font = FONT(px);
    while (g.measureText(text).width > cw - 50 && px > 30) g.font = FONT(px -= 4);
    g.fillText(text, x + cw / 2, y + ch / 2 + 4);
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 6; g.strokeRect(x + 3, y + 3, cw - 6, ch - 6);
  });
  return tex(c);
}

// Sponsor boards: a long run either side of the start, and short runs on the straights.
function buildAds(group, track, D, occ, r) {
  const p = track.main, mask = cornerMask(p), L = p.length;
  const atlas = adAtlas(D.ads), nAds = Math.min(14, D.ads.length);
  const parts = [];
  const cell = (i) => [(i % 2) * 0.5, 1 - (Math.floor(i / 2) + 1) / 8];
  const grey = [0.99, 0.01]; // a corner of the atlas painted plain grey
  const setUV = (g, [u0, v0], w = 0.5, h = 0.125) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * w, v0 + uv.getY(i) * h); return g; };
  const runs = [[-130, 130]];
  for (let k = 1; k < 5; k++) runs.push([L * k / 5 - 40, L * k / 5 + 40]);
  let n = 0;
  for (const [a, b] of runs) for (const side of [-1, 1]) {
    for (let s = a; s < b; s += 4.3) {
      const i = p.at(s);
      if (mask[i] || !openAir(p, i)) continue;
      const e = p.pose(s, side * (p.wallHalf + 1.7));
      if (track.inOtherCorridor(e.x, e.z, p, 1) || !occ.free(e.x, e.z, 1.2)) continue;
      const y = track.terrainAt(e.x, e.z);
      if (Math.abs(y - e.y) > 3) continue; // a cliff or a drop beside the road
      const yaw = e.yaw + (side > 0 ? Math.PI / 2 : -Math.PI / 2); // face the road
      const mtx = new THREE.Matrix4().compose(new THREE.Vector3(e.x, y, e.z), new THREE.Quaternion().setFromAxisAngle(THREE.Object3D.DEFAULT_UP, yaw), new THREE.Vector3(1, 1, 1));
      const front = setUV(new THREE.PlaneGeometry(4.2, 1.05), cell(n++ % nAds)); front.translate(0, 1.0, 0.07);
      const body = setUV(new THREE.BoxGeometry(4.3, 1.15, 0.08), grey, 0.005, 0.005); body.translate(0, 1.0, 0);
      const legs = [-1.6, 1.6].map((x) => setUV(new THREE.BoxGeometry(0.1, 0.5, 0.1), grey, 0.005, 0.005).translate(x, 0.25, -0.02));
      for (const g of [front, body, ...legs]) { g.applyMatrix4(mtx); parts.push(g.index ? g.toNonIndexed() : g); }
    }
  }
  if (!parts.length) return;
  const m = new THREE.Mesh(mergeGeometries(parts.map(strip)), new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 0.08, roughness: 0.5 }));
  m.castShadow = m.receiveShadow = true;
  group.add(m);
}

// Strings of pennants across the road between two poles.
function buildBunting(group, track, D, occ, r) {
  if (!D.bunting) return;
  const p = track.main, k = curvature(p), L = p.length, cols = D.flags.map((c) => new THREE.Color(c));
  const ramps = track.ramps.filter((x) => x.path === p);
  const nearRamp = (s) => ramps.some((x) => s > x.s - 25 && s < x.s + x.len + (x.pit || 0) + 25);
  const parts = [], poles = [];
  const chosen = [];
  for (let s = 110; s < L - 90 && chosen.length < D.bunting; s += 9) {
    if (chosen.some((c) => Math.abs(c - s) < L / (D.bunting + 2))) continue;
    let ok = true;
    for (let j = -12; j <= 12 && ok; j++) { const i = p.at(s + j * 1.5); if (Math.abs(k[i]) > 1 / 200 || !openAir(p, i)) ok = false; }
    if (!ok || nearRamp(s)) continue;
    const ends = [-1, 1].map((side) => p.pose(s, side * (p.wallHalf + 0.9)));
    if (ends.some((e) => track.inOtherCorridor(e.x, e.z, p, 0.5) || !occ.free(e.x, e.z, 0.8))) continue;
    const ys = ends.map((e) => track.terrainAt(e.x, e.z));
    const top = Math.max(p.pose(s).y + 7.5, ys[0] + 6, ys[1] + 6);
    if (top - Math.min(...ys) > 14) continue;
    chosen.push(s);
    const [A, B] = ends, dir = new THREE.Vector3(p.pose(s).tx, 0, p.pose(s).tz);
    for (let e = 0; e < 2; e++) {
      const pole = new THREE.CylinderGeometry(0.11, 0.14, top - ys[e] + 0.4, 8);
      pole.translate(ends[e].x, (top + ys[e]) / 2, ends[e].z);
      poles.push(pole);
      occ.take(ends[e].x, ends[e].z, 0.8);
    }
    const span = Math.hypot(B.x - A.x, B.z - A.z), nF = Math.floor(span / 0.9);
    const sag = 1.6;
    const at = (t) => new THREE.Vector3(A.x + (B.x - A.x) * t, top - 0.2 - sag * 4 * t * (1 - t), A.z + (B.z - A.z) * t);
    // the rope
    const rope = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => at(i / 8))), 16, 0.035, 4);
    parts.push(addWave(paint(rope, 0x222222), dir, () => 0, () => 0));
    for (let f = 0; f < nF; f++) {
      const t0 = (f + 0.1) / nF, t1 = (f + 0.9) / nF, P0 = at(t0), P1 = at(t1), M = P0.clone().lerp(P1, 0.5);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([P0.x, P0.y, P0.z, P1.x, P1.y, P1.z, M.x, M.y - 0.75, M.z], 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
      g.computeVertexNormals();
      const ph = s * 0.37 + f * 0.9;
      parts.push(addWave(paint(g, cols[f % cols.length]), dir, (i) => (i === 2 ? 0.28 : 0), () => ph));
    }
  }
  if (parts.length) {
    const m = new THREE.Mesh(mergeGeometries(parts.map(strip)), clothMaterial());
    group.add(m);
  }
  if (poles.length) {
    const m = new THREE.Mesh(mergeGeometries(poles), new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.4, metalness: 0.6 }));
    m.castShadow = true;
    group.add(m);
  }
}

function screenTexture(title, sub, [bg, fg, accent]) {
  const [c, g] = canvas(1024, 256);
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, bg); gr.addColorStop(1, '#05060a');
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 256);
  for (let x = 0; x < 1024; x += 6) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x, 0, 2, 256); } // LED pitch
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = fg; g.font = FONT(96);
  let px = 96; while (g.measureText(title).width > 960 && px > 40) g.font = FONT(px -= 4);
  g.shadowColor = accent; g.shadowBlur = 18;
  g.fillText(title, 512, 108);
  g.shadowBlur = 0; g.fillStyle = accent; g.font = FONT(44);
  g.fillText(sub, 512, 200);
  return tex(c);
}

// The inflatable start/finish arch with a big screen and real start lights.
function buildArch(group, track, D) {
  const p = track.main, e = p.pose(1.5, 0);
  const arch = new THREE.Group();
  arch.position.set(e.x, e.y, e.z);
  arch.rotation.y = e.yaw;
  const R = p.roadHalf + 1.9, tube = 1.35;
  const skin = new THREE.MeshPhysicalMaterial({ color: D.arch, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3, sheen: 0.4 });
  const trim = new THREE.MeshPhysicalMaterial({ color: D.archTrim, roughness: 0.35, clearcoat: 0.6 });
  const body = new THREE.Mesh(new THREE.TorusGeometry(R, tube, 18, 64, Math.PI), skin);
  body.position.y = 0.2;
  const bands = [];
  for (const a of [0.18, 0.5, 0.82]) { // white bands round the tube
    const b = new THREE.Mesh(new THREE.TorusGeometry(R, tube + 0.04, 14, 8, 0.07), trim);
    b.rotation.z = Math.PI * a - 0.035; b.position.y = 0.2;
    bands.push(b);
  }
  for (const x of [-R, R]) { // weighted feet
    const f = new THREE.Mesh(new THREE.CylinderGeometry(tube * 1.15, tube * 1.3, 1.0, 20), trim);
    f.position.set(x, 0.1, 0);
    arch.add(f);
  }
  arch.add(body, ...bands);
  // the screen on top
  const scr = screenTexture(track.def.name.toUpperCase(), 'CORNKART GRAND PRIX', D.screen || ['#101828', '#ffffff', '#ffd21a']);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(12, 2.6, 0.5), [trim, trim, trim, trim,
    new THREE.MeshStandardMaterial({ map: scr, emissiveMap: scr, emissive: 0xffffff, emissiveIntensity: 0.9 }),
    new THREE.MeshStandardMaterial({ map: scr, emissiveMap: scr, emissive: 0xffffff, emissiveIntensity: 0.9 })]);
  screen.position.y = R + tube + 1.6;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(12.5, 3.1, 0.4), new THREE.MeshStandardMaterial({ color: 0x1a1c22, metalness: 0.5, roughness: 0.4 }));
  frame.position.copy(screen.position); frame.position.z = 0;
  screen.position.z = 0;
  screen.scale.z = 1.3;
  arch.add(frame, screen);
  // start lights hanging under the top of the arch, facing the grid (behind, -Z)
  const lights = new THREE.Group();
  lights.position.set(0, R - tube - 0.9, -0.2);
  const box = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.4, 0.5), new THREE.MeshStandardMaterial({ color: 0x111215, roughness: 0.5 }));
  lights.add(box);
  const lamps = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.MeshStandardMaterial({ color: 0x220606, emissive: 0xff2a1a, emissiveIntensity: 0 });
    const l = new THREE.Mesh(new THREE.CircleGeometry(0.48, 20), m);
    l.position.set((i - 1) * 1.6, 0, -0.26); l.rotation.y = Math.PI;
    lights.add(l);
    lamps.push(m);
  }
  arch.add(lights);
  const hang = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), box.material);
  hang.position.set(0, R - tube - 0.1, -0.2);
  arch.add(hang);
  arch.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  group.add(arch);
  // countdown: one more red lamp each second, then all green
  let green = 0, was = null;
  const red = new THREE.Color(0xff2a1a), grn = new THREE.Color(0x3aff4a);
  track.extraUpdates.push((t, race) => {
    const st = race?.state;
    if (was === 'countdown' && st !== 'countdown') green = 2.5;
    was = st;
    green = Math.max(0, green - 1 / 60);
    const lit = st === 'countdown' ? Math.min(3, Math.max(0, Math.floor(4 - race.countdown + 0.6))) : 0;
    lamps.forEach((m, i) => {
      if (green > 0) { m.emissive.copy(grn); m.emissiveIntensity = 3.5; }
      else { m.emissive.copy(red); m.emissiveIntensity = i < lit ? 4 : 0.05; }
    });
  });
}

// Grandstands packed with cheering fans beside the start straight.
function buildGrandstands(group, track, D, occ, r, quality) {
  if (!D.crowd) return;
  const p = track.main;
  const seg = 4, tiers = 6, stepD = 1.0, stepH = 0.6;
  const d0 = p.wallHalf + 2.2, depth = tiers * stepD + 0.6;
  const standParts = [], roofParts = [];
  const fans = [];
  const seatCol = new THREE.Color(D.seats), concrete = new THREE.Color(0xb9b6ae), roofCol = new THREE.Color(D.roof);
  for (const side of [-1, 1]) {
    // longest clear run of segments within the start straight
    const ok = [];
    for (let s = -100; s <= 100; s += seg) {
      let free = openAir(p, p.at(s)) && Math.abs(curvature(p)[p.at(s)]) < 1 / 120;
      for (let dd = d0; dd <= d0 + depth && free; dd += 2) {
        const e = p.pose(s, side * dd);
        if (!occ.free(e.x, e.z, 1.8) || track.inOtherCorridor(e.x, e.z, p, 2)) free = false;
        const y = track.terrainAt(e.x, e.z);
        if (Math.abs(y - p.pose(s).y) > 4) free = false;
      }
      ok.push([s, free]);
    }
    let best = null, cur = null;
    for (const [s, free] of ok) {
      if (free) { if (!cur) cur = [s, s]; cur[1] = s; if (!best || cur[1] - cur[0] > best[1] - best[0]) best = [...cur]; }
      else cur = null;
    }
    if (!best || best[1] - best[0] < 24) continue;
    if (best[1] - best[0] > 80) { const m = (best[0] + best[1]) / 2; best = [m - 40, m + 40]; }
    for (let s = best[0]; s < best[1]; s += seg) {
      const a = p.pose(s, 0), yaw = a.yaw + (side > 0 ? Math.PI / 2 : -Math.PI / 2); // +Z of a tier faces the road
      const baseY = Math.min(a.y, track.terrainAt(p.pose(s, side * (d0 + depth)).x, p.pose(s, side * (d0 + depth)).z)) - 1.5;
      const q = new THREE.Quaternion().setFromAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);
      const put = (g, d, y, col, list = standParts) => {
        const e = p.pose(s + seg / 2, side * d);
        g.applyQuaternion(q); g.translate(e.x, y, e.z);
        list.push(paint(g, col));
      };
      for (let t = 0; t < tiers; t++) {
        const top = a.y + 0.6 + t * stepH;
        const h = top - baseY;
        const g = new THREE.BoxGeometry(seg + 0.05, h, stepD); g.translate(0, h / 2 - (top - baseY) + 0, 0);
        put(g, d0 + t * stepD + stepD / 2, top, t % 2 ? concrete : concrete.clone().multiplyScalar(0.92));
        const seat = new THREE.BoxGeometry(seg + 0.05, 0.12, stepD * 0.5); seat.translate(0, 0.06, -0.15);
        put(seat, d0 + t * stepD + stepD / 2, top, seatCol);
        for (let f = 0; f < seg; f += 0.8) {
          if (r() < 0.12) continue;
          const e = p.pose(s + f + 0.4 + (r() - 0.5) * 0.2, side * (d0 + t * stepD + stepD * 0.45));
          fans.push([e.x, top + 0.05, e.z, yaw + (r() - 0.5) * 0.6]);
        }
      }
      // back wall and roof on posts
      const backH = tiers * stepH + 4.2;
      const wall = new THREE.BoxGeometry(seg + 0.05, backH + (a.y - baseY), 0.3);
      put(wall, d0 + depth, baseY + (backH + (a.y - baseY)) / 2, concrete.clone().multiplyScalar(0.8));
      const roof = new THREE.BoxGeometry(seg + 0.1, 0.25, depth + 1.6); roof.rotateX(-0.12);
      put(roof, d0 + depth / 2 - 0.2, a.y + backH + 0.4, roofCol, roofParts);
      if (Math.round((s - best[0]) / seg) % 3 === 0) {
        const post = new THREE.CylinderGeometry(0.12, 0.12, backH - 0.2, 8); post.translate(0, -(backH - 0.2) / 2, 0);
        put(post, d0 + 0.3, a.y + backH + 0.2, 0xdddddd);
      }
      for (let dd = d0; dd <= d0 + depth; dd += 2) { const e = p.pose(s, side * dd); occ.take(e.x, e.z, 2.5); }
    }
  }
  if (!standParts.length) return;
  const stand = new THREE.Mesh(mergeGeometries(standParts.map(strip)), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }));
  stand.castShadow = stand.receiveShadow = true;
  const roof = new THREE.Mesh(mergeGeometries(roofParts.map(strip)), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.65 }));
  roof.castShadow = true;
  group.add(stand, roof);
  // the fans: a body and a head per person, bobbing and cheering in the shader
  const bodyG = new THREE.CapsuleGeometry(0.2, 0.42, 3, 8); bodyG.translate(0, 0.42, 0);
  const headG = new THREE.SphereGeometry(0.15, 10, 8); headG.translate(0, 0.98, 0);
  const armG = mergeGeometries([-1, 1].map((sd) => new THREE.CapsuleGeometry(0.06, 0.42, 2, 6).rotateZ(sd * 0.35).translate(sd * 0.3, 1.05, 0)));
  const cheer = (mat, arms) => {
    mat.onBeforeCompile = (shader) => {
      fogHook(shader);
      shader.uniforms.uWindTime = WIND.time;
      shader.vertexShader = 'uniform float uWindTime;\n' + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        float ckPh = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * 2.3;
        float ckJump = max(0.0, sin(uWindTime * 6.5 + ckPh));
        transformed.y += ckJump * 0.16;
        ${arms ? 'transformed.y += ckJump * 0.22 * step(0.9, position.y);' : ''}`);
    };
    mat.customProgramCacheKey = () => 'cheer' + arms;
    return mat;
  };
  const n = fans.length;
  const bodies = new THREE.InstancedMesh(bodyG, cheer(new THREE.MeshStandardMaterial({ roughness: 0.8 }), false), n);
  const heads = new THREE.InstancedMesh(headG, cheer(new THREE.MeshStandardMaterial({ roughness: 0.7 }), false), n);
  const arms = quality === 'low' ? null : new THREE.InstancedMesh(armG, cheer(new THREE.MeshStandardMaterial({ roughness: 0.8 }), true), n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  const shirts = [...D.flags, 0xffffff, 0x222222, 0xff7a1a, 0xe03a8a].map((c) => new THREE.Color(c));
  const skins = [0xf1c8a4, 0xd9a07a, 0xa86e4a, 0x6e4430, 0xffdcc0].map((c) => new THREE.Color(c));
  fans.forEach(([x, y, z, yaw], i) => {
    q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);
    m4.compose(v.set(x, y, z), q, one.setScalar(0.92 + r() * 0.16));
    bodies.setMatrixAt(i, m4); heads.setMatrixAt(i, m4);
    const shirt = shirts[Math.floor(r() * shirts.length)];
    bodies.setColorAt(i, shirt);
    heads.setColorAt(i, skins[Math.floor(r() * skins.length)]);
    if (arms) { arms.setMatrixAt(i, m4); arms.setColorAt(i, r() < 0.5 ? shirt : skins[i % skins.length]); }
  });
  for (const m of [bodies, heads, arms]) if (m) { m.castShadow = false; m.receiveShadow = true; group.add(m); }
}

// Tall flagpoles flying the track's colours along the start straight.
function buildFlags(group, track, D, occ, r) {
  const p = track.main, cols = D.flags;
  const parts = [], poles = [];
  let n = 0;
  for (let s = -70; s <= 70; s += 14) for (const side of [-1, 1]) {
    const e = p.pose(s + side * 3, side * (p.wallHalf + 0.95));
    if (!openAir(p, p.at(s)) || track.inOtherCorridor(e.x, e.z, p, 1) || !occ.free(e.x, e.z, 0.6)) continue;
    const y = track.terrainAt(e.x, e.z), H = 9;
    const pole = new THREE.CylinderGeometry(0.07, 0.1, H, 8); pole.translate(e.x, y + H / 2, e.z);
    poles.push(pole);
    const W = 2.6, Hf = 1.6;
    const g0 = new THREE.PlaneGeometry(W, Hf, 10, 3);
    g0.translate(W / 2, H - Hf / 2 - 0.2, 0);
    const yaw = Math.atan2(-e.tx, -e.tz) + Math.PI / 2; // flag streams back along the road
    g0.rotateY(yaw); g0.translate(e.x, y, e.z);
    const nrm = new THREE.Vector3(Math.cos(yaw + Math.PI / 2), 0, -Math.sin(yaw + Math.PI / 2));
    const g = paint(g0, cols[n++ % cols.length]), uv = g.attributes.uv, ph0 = r() * 6;
    addWave(g, nrm, (i) => uv.getX(i) * 0.32, (i) => ph0 - uv.getX(i) * 4.5);
    parts.push(g);
  }
  if (parts.length) group.add(new THREE.Mesh(mergeGeometries(parts.map(strip)), clothMaterial({ roughness: 0.6 })));
  if (poles.length) {
    const m = new THREE.Mesh(mergeGeometries(poles), new THREE.MeshStandardMaterial({ color: 0xe8e8e8, metalness: 0.7, roughness: 0.3 }));
    m.castShadow = true;
    group.add(m);
  }
}

function blimpTexture(text, [bg, fg]) {
  const [c, g] = canvas(1024, 256);
  g.fillStyle = bg; g.fillRect(0, 0, 1024, 256);
  g.fillStyle = fg; g.font = FONT(150); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 512, 136);
  return tex(c);
}

// A CornKart blimp lazily circling high over the track.
function buildBlimp(group, track, D) {
  if (!D.blimp) return;
  const B = track.bounds;
  const cx = (B.minX + B.maxX) / 2, cz = (B.minZ + B.maxZ) / 2;
  const rad = Math.min(B.maxX - B.minX, B.maxZ - B.minZ) * 0.22;
  let top = 0;
  for (let i = 0; i < track.main.N; i += 10) top = Math.max(top, track.main.H[i]);
  const blimp = new THREE.Group();
  const skin = new THREE.MeshPhysicalMaterial({ color: 0xf4f4f0, roughness: 0.35, clearcoat: 0.5 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), skin);
  body.scale.set(7, 7, 22);
  const stripe = new THREE.Mesh(new THREE.SphereGeometry(1.004, 32, 20, 0, Math.PI * 2, Math.PI * 0.47, Math.PI * 0.06), new THREE.MeshStandardMaterial({ color: D.arch, roughness: 0.4 }));
  stripe.scale.copy(body.scale);
  blimp.add(body, stripe);
  const t = blimpTexture('CORNKART', D.blimpColors || ['#d4202a', '#ffd21a']);
  const lm = new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.25, roughness: 0.5 });
  for (const side of [-1, 1]) {
    const label = new THREE.Mesh(new THREE.CylinderGeometry(7.08, 7.08, 22, 24, 1, true, side > 0 ? Math.PI * 0.35 : Math.PI * 1.35, Math.PI * 0.3), lm);
    label.rotation.x = Math.PI / 2; label.scale.set(1, 1.0, 1);
    label.scale.set(1, 0.62, 1);
    blimp.add(label);
  }
  const finMat = new THREE.MeshStandardMaterial({ color: D.arch, roughness: 0.4 });
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.4, 6, 5), finMat);
    f.position.set(0, 0, -18); f.rotation.z = (i * Math.PI) / 2;
    f.translateY(5.5);
    blimp.add(f);
  }
  const gond = new THREE.Mesh(new RoundedBoxGeometry(2.4, 1.6, 6, 2, 0.4), new THREE.MeshStandardMaterial({ color: 0x2a2c34, roughness: 0.4, metalness: 0.3 }));
  gond.position.set(0, -7.2, 2);
  blimp.add(gond);
  blimp.traverse((o) => { o.castShadow = false; });
  group.add(blimp);
  const y = top + 85;
  track.extraUpdates.push((time) => {
    const a = time * 0.025;
    blimp.position.set(cx + Math.cos(a) * rad, y + Math.sin(time * 0.3) * 1.5, cz + Math.sin(a) * rad);
    blimp.rotation.y = -a + Math.PI; // nose along the circle
  });
}

// Hot-air balloons drifting far off.
function buildBalloons(group, track, D, r) {
  if (!D.balloons) return;
  const B = track.bounds, parts = [];
  const pal = D.flags;
  const list = [];
  for (let i = 0; i < 6; i++) {
    const a = r() * Math.PI * 2, cx = (B.minX + B.maxX) / 2, cz = (B.minZ + B.maxZ) / 2;
    const R = Math.max(B.maxX - B.minX, B.maxZ - B.minZ) * (0.36 + r() * 0.12);
    const x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R;
    const y = track.terrainAt(x, z) + 70 + r() * 70;
    const sc = 7 + r() * 3;
    for (let k = 0; k < 8; k++) { // striped envelope
      const g = new THREE.SphereGeometry(1, 6, 14, (k / 8) * Math.PI * 2, Math.PI / 4);
      g.scale(1, 1.18, 1);
      g.scale(sc, sc, sc); g.translate(x, y, z);
      parts.push(paint(g, k % 2 ? 0xffffff : pal[(i + k) % pal.length]));
    }
    const bk = new THREE.BoxGeometry(1.2, 1, 1.2); bk.scale(sc / 8, sc / 8, sc / 8); bk.translate(x, y - sc * 1.45, z);
    parts.push(paint(bk, 0x6a4a2a));
    list.push(i);
  }
  const m = new THREE.Mesh(mergeGeometries(parts.map(strip)), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }));
  group.add(m);
  track.extraUpdates.push((t) => { m.position.y = Math.sin(t * 0.2) * 3; });
}

// Drifting motes of light near the road: radioactive specks, will-o'-wisps, sparkles.
function buildMotes(group, track, D, r) {
  if (!D.motes) return;
  const { color = '#9dff5a', count = 600, size = 0.45, height = 5 } = D.motes;
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const p = track.paths[r() < 0.85 ? 0 : Math.floor(r() * track.paths.length)];
    const s = r() * p.length, d = (r() - 0.5) * 2 * (p.wallHalf + 18);
    const e = p.pose(s, d);
    if (p.tunnel[e.index]) { i--; continue; }
    pos[i * 3] = e.x; pos[i * 3 + 1] = Math.max(e.y, track.terrainAt(e.x, e.z)) + 0.6 + r() * height; pos[i * 3 + 2] = e.z;
    seed[i] = r() * 100;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: glowSprite(color) }, uTime: WIND.time, uSize: { value: size } },
    vertexShader: `
      attribute float seed; uniform float uTime; uniform float uSize; varying float vA;
      void main() {
        vec3 p = position + vec3(sin(uTime * 0.4 + seed) * 1.6, sin(uTime * 0.7 + seed * 1.3) * 0.8, cos(uTime * 0.35 + seed * 0.7) * 1.6);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vA = (0.55 + 0.45 * sin(uTime * 2.2 + seed * 4.0)) * smoothstep(160.0, 40.0, -mv.z);
        gl_PointSize = uSize * (300.0 / -mv.z) * (0.7 + 0.3 * sin(seed));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D map; varying float vA;
      void main() { vec4 c = texture2D(map, gl_PointCoord); gl_FragColor = vec4(c.rgb * 1.6, c.a * vA); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  group.add(pts);
}

// --- Entry point ------------------------------------------------------------------
export function dressTrack(scenery, track, quality = 'high') {
  const D = { ...DEFAULTS, ...track.def.dressing };
  if (track.def.dressing?.barrier) D.barrier = { ...DEFAULTS.barrier, ...track.def.dressing.barrier };
  track.extraUpdates ??= [];
  const group = new THREE.Group();
  group.name = 'dressing';
  const occ = occupancy(scenery, track);
  scenery.add(group);
  const r = rng(track.def.seed ?? 7);
  buildArch(group, track, D);
  buildCurbs(group, track, D);
  buildGrandstands(group, track, D, occ, r, quality);
  buildFlags(group, track, D, occ, r);
  buildBarriers(group, track, D, occ);
  buildChevrons(group, track, D, occ);
  buildAds(group, track, D, occ, r);
  buildBunting(group, track, D, occ, r);
  buildBlimp(group, track, D);
  buildBalloons(group, track, D, r);
  if (quality !== 'low') buildMotes(group, track, D, r);
  group.traverse((o) => { o.userData.dressing = true; });
  return group;
}
