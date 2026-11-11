// "San Francisco": off the Embarcadero, up and over the hills of Nob Hill and
// Russian Hill (every crest is a jump), down to the Marina and across the Golden
// Gate Bridge, round the Marin Headlands and back over the bay by leaping a
// raised drawbridge. Three ways to cut through: the crooked brick street, and
// two boarded-up tunnels, one under Nob Hill and one through the headlands.
// Oil slicks spin you out; grab a sourdough loaf for a boost.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { signTexture, glowSprite, victorianTexture, officeTexture, rng } from '../textures.js';
import { softFoliage, foliageMaterial } from '../graphics.js';

export const SANFRANCISCO = {
  id: 'sanfrancisco',
  name: 'San Francisco',
  short: 'San Francisco',
  region: 'San Francisco Bay',
  blurb: 'Steep city hills where every crest is a jump, the Golden Gate Bridge, the Marin Headlands and a leap over a raised drawbridge. Dodge the oil slicks, grab sourdough for a boost, and find the crooked street and two secret tunnels.',
  seed: 4157,
  roadHalf: 9,
  wallHalf: 16,
  points: [
    [0, 3, -123], [90, 3, -123], [156, 4, -90], [176, 6, -33], [176, 17, 16], [176, 19, 33], [176, 30, 82], [168, 31, 107],
    [123, 30, 131], [74, 16, 131], [49, 15, 131], [0, 26, 131], [-25, 27, 131], [-74, 12, 131], [-98, 11, 131], [-148, 23, 131],
    [-172, 24, 131], [-221, 8, 144], [-279, 5, 144], [-320, 4, 82], [-344, 5, 16], [-402, 16, -66], [-447, 26, -107],
    [-459, 28, -148], [-459, 28, -295], [-459, 28, -435], [-455, 34, -492], [-410, 46, -533], [-344, 50, -525], [-287, 38, -476],
    [-221, 24, -410], [-130, 17, -372], [-82, 14, -318], [-74, 15, -262], [-74, 8, -213], [-74, 4, -164], [-66, 3, -139], [-33, 3, -125],
  ],
  features: [
    { type: 'pad', s: 290, d: -4 }, { type: 'pad', s: 290, d: 4 },
    { type: 'ramp', s: 412, len: 12, h: 2.4 },                           // over the top of Nob Hill
    { type: 'ramp', s: 564, len: 12, h: 2.4 },                           // over the top of Russian Hill
    { type: 'pad', s: 640, d: 0 },
    { type: 'bridge', s: 1186, len: 292 },                               // the Golden Gate Bridge
    { type: 'pad', s: 1300, d: -4 }, { type: 'pad', s: 1300, d: 4 },
    { type: 'pad', s: 1672, d: -5 }, { type: 'pad', s: 1672, d: 0 }, { type: 'pad', s: 1672, d: 5 },
    { type: 'ramp', s: 1688, len: 14, h: 3, pit: 22, depth: 5 },       // headlands gully
    { type: 'bridge', s: 2072, len: 96 },                                // the drawbridge
    { type: 'pad', s: 2066, d: -5 }, { type: 'pad', s: 2066, d: 0 }, { type: 'pad', s: 2066, d: 5 },
    { type: 'ramp', s: 2082, len: 14, h: 3.2, pit: 26, depth: 7.4 },     // over the raised drawbridge
  ],
  branches: [
    { // a boarded-up tunnel under Nob Hill
      id: 'broadway', name: 'Nob Hill tunnel', call: 'SECRET TUNNEL!', from: 232, to: 512, dFrom: 5, dTo: 5, roadHalf: 6.5, secret: true,
      points: [[150, 7, 0], [110, 10, 50], [75, 13, 95]],
      tunnel: [0.15, 0.85], wallColor: 0x8a7f74, portalColor: 0xcfc6b4,
      features: [{ type: 'pad', s: 50, d: 0 }, { type: 'pad', s: 130, d: 0 }, { type: 'pad', s: 200, d: 0 }],
    },
    { // the crooked brick street, winding down past the flower beds
      id: 'lombard', name: 'The crooked street', call: 'CROOKED STREET!', from: 722, to: 990, dFrom: 5, dTo: 5, surface: 'brick', roadHalf: 6, shoulder: 3,
      points: [[-196, 20, 99], [-226, 17, 95], [-248, 14, 70], [-280, 11, 66], [-302, 8, 36]],
      features: [{ type: 'pad', s: 20, d: 0 }, { type: 'pad', s: 85, d: 0 }, { type: 'pad', s: 150, d: 0 }, { type: 'pad', s: 215, d: 0 }],
    },
    { // an old army tunnel straight through the headlands, boarded up
      id: 'headlands', name: 'Headlands tunnel', call: 'SECRET TUNNEL!', from: 1520, to: 1845, dFrom: 5, dTo: 5, roadHalf: 6.5, secret: true,
      points: [[-428, 32, -503], [-360, 30, -490], [-310, 26, -430]],
      tunnel: [0.2, 0.72], wallColor: 0x7a7468, portalColor: 0xb8b2a2,
      features: [{ type: 'pad', s: 15, d: 0 }, { type: 'pad', s: 60, d: 0 }, { type: 'pad', s: 105, d: 0 }, { type: 'pad', s: 150, d: 0 }, { type: 'pad', s: 195, d: 0 }],
    },
  ],
  mounds: [
    { x: 120, z: 40, rx: 110, rz: 90, h: 22 },       // Nob Hill over the tunnel
    { x: -360, z: -480, rx: 130, rz: 70, h: 28 },    // the headlands over the army tunnel
    { x: -420, z: -760, rx: 380, rz: 150, h: 70 },   // Marin hills to the north
    { x: 40, z: 380, rx: 420, rz: 150, h: 55 },      // Twin Peaks way to the south
  ],
  sea: { level: 0, bed: -9 },
  waters: [
    { x: -459, z: -292, rx: 175, rz: 122 },          // the Golden Gate strait
    { x: -300, z: -250, rx: 80, rz: 48 },
    { x: -80, z: -210, rx: 300, rz: 30 },            // the channel under the drawbridge
    { x: -900, z: -300, rx: 400, rz: 300 },          // the ocean beyond the bridge
    { x: 380, z: -330, rx: 400, rz: 110 },           // the bay to the east
  ],
  islands: [{ x: -250, z: -330, rx: 34, rz: 24, h: 9 }], // the island prison
  pickups: [ // rows of sourdough loaves across the road
    { s: 140 }, { s: 360 }, { s: 610 }, { s: 860 }, { s: 1100 }, { s: 1380 }, { s: 1620 }, { s: 1900 }, { s: 2170 },
    { path: 'broadway', s: 100, spread: [-3, 3] }, { path: 'broadway', s: 170, spread: [-3, 3] },
    { path: 'lombard', s: 80, spread: [-3, 3] }, { path: 'lombard', s: 160, spread: [-3, 3] },
    { path: 'headlands', s: 90, spread: [-3, 3] }, { path: 'headlands', s: 170, spread: [-3, 3] },
  ],
  barrels: [ // rows of traffic cones; jump them or thread the gap
    { s: 1050, gapD: -3 }, { s: 1053.5, gapD: -3 }, { s: 1856, gapD: 3 }, { s: 1859.5, gapD: 3 },
  ],
  crates: [ // planks over the secret tunnel mouths
    { path: 'broadway', s: 'portal' }, { path: 'headlands', s: 'portal' },
  ],
  theme: {
    pit: 'bay', pitWall: 0x8d9094, tunnelLamp: 0xffd890,
    pad: { bg: '#0d2a40', fg: '#4fd2ff', emissive: 0x24b8ff },
    pickup: 'sourdough', pickupText: 'SOURDOUGH RUSH!', pickupColor: [1, 0.8, 0.45], pickupGlow: '#ffd08a', ringColor: 0x4fd2ff,
    puddle: 'oil', puddleText: 'Oil slick!',
    barrel: 'cone', barrelText: 'Road works!', barrelColor: [1, 0.45, 0.1],
    splashText: 'SPLASH! INTO THE BAY', splashColor: [0.7, 0.88, 1],
    boostColor: [0.4, 0.85, 1], dustColor: [0.7, 0.66, 0.58],
    radiation: false, mapAccent: '#ffb347', mapPit: '#4fb8ff', loseText: 'Those hills are no joke.',
  },
  weathers: ['clear', 'rain', 'fog'],
  sky: { top: 0x3f7cc4, horizon: 0xe2e6ea, ground: 0x9aa4a8, cloudDark: 0xc4ccd4, cloudLight: 0xffffff, sun: 0xffd9a0, cover: 0.32 },
  light: { sun: 0xfff0d8, sunIntensity: 2.6, hemiSky: 0xcfe2f6, hemiGround: 0x8a8070, hemiIntensity: 0.9, env: 0.55, exposure: 1.0, sunDir: [80, 60, 40], envGround: 0x9a9488 },
  fog: { color: 0xd4dce4, density: 0.0016 },
  dressing: { // Golden Gate orange, and every colour of the city
    curb: ['#e0502a', '#f5f5f2'], barrier: { type: 'tecpro', colors: [0xe0502a, 0xf5f5f2] },
    flags: [0xe3342b, 0xff9a1a, 0xffd21a, 0x3cc34a, 0x2a7de1, 0x8a3cc8], arch: 0xe0502a, archTrim: 0xffffff, seats: 0x2a7de1,
    screen: ['#14243c', '#ffffff', '#ff9a1a'], blimpColors: ['#e0502a', '#ffffff'], balloons: true,
  },
  groundTint,
  buildScenery,
};

const CITY = (x, z) => z > -190 && x > -360 && x < 330 && z < 280;
const tmpC = new THREE.Color();
function groundTint(x, z, dist) {
  if (dist < 18) return null;
  if (CITY(x, z)) { tmpC.setRGB(0.55, 0.54, 0.5); tmpC.amount = 0.75; return tmpC; } // city blocks
  if (z < -330) { tmpC.setRGB(0.8, 0.64, 0.3); tmpC.amount = 0.8; return tmpC; } // golden Marin grass
  return null;
}

function ground(track, x, z) { return track.terrainAt(x, z); }

function place(track, s, d, path = track.main) {
  const p = path.pose(s, d);
  return { x: p.x, z: p.z, y: ground(track, p.x, p.z), yaw: p.yaw };
}

// Is a w-by-d footprint centred on (x, z) and turned by yaw dry land clear of every road corridor?
function clearBox(track, x, z, yaw, w, d, margin = 1) {
  const lx = Math.cos(yaw), lz = -Math.sin(yaw), fx = Math.sin(yaw), fz = Math.cos(yaw);
  for (const a of [-0.5, 0, 0.5]) for (const b of [-0.5, 0, 0.5]) {
    if (!clear(track, x + lx * a * w + fx * b * d, z + lz * a * w + fz * b * d, margin)) return false;
  }
  return true;
}

// Is (x, z) dry land clear of every road corridor (main loop and shortcuts)?
function clear(track, x, z, margin = 6) {
  for (const p of track.paths) {
    if (!p.inBox(x, z) && p !== track.main) continue;
    const q = p.query(x, z, -1, {});
    if (!q.beyond && Math.abs(q.d) < p.wallHalf + margin) return false;
  }
  return ground(track, x, z) > 1.5;
}

function paint(geo, color) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const c = new THREE.Color(color);
  const a = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < a.length; i += 3) { a[i] = c.r; a[i + 1] = c.g; a[i + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  return g;
}

// Collects geometry and merges it into one mesh per material.
class Batch {
  constructor() { this.lists = new Map(); }
  add(mat, geo, m4) { if (m4) geo.applyMatrix4(m4); if (!this.lists.has(mat)) this.lists.set(mat, []); this.lists.get(mat).push(geo); }
  flush(group, shadows = true) {
    for (const [mat, list] of this.lists) {
      const mesh = new THREE.Mesh(mergeGeometries(list), mat);
      mesh.castShadow = shadows; mesh.receiveShadow = true;
      group.add(mesh);
    }
    this.lists.clear();
  }
}

const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(1, 1, 1), tmpP = new THREE.Vector3();
const at = (x, y, z, yaw = 0, sx = 1, sy = 1, sz = 1) => tmpM.compose(tmpP.set(x, y, z), tmpQ.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, yaw), tmpS.set(sx, sy, sz)).clone();
const ORANGE = 0xc0362c; // International Orange

function buildScenery(scene, track) {
  const r = rng(11);
  const g = new THREE.Group();
  scene.add(g);
  const batch = new Batch();
  const vc = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
  const steel = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.35 });
  const main = track.main;

  // --- The Golden Gate Bridge: orange towers, main cables, suspenders and a stiffening truss.
  {
    const span = main.bridges[0], deck = main.pose(span.s + span.len / 2).y;
    const T1 = 1240, T2 = 1428, A1 = span.s - 14, A2 = span.s + span.len + 14, mid = (T1 + T2) / 2;
    const top = deck + 46, low = deck + 3.5, hw = track.roadHalf + 2.6;
    const cableY = (s) => {
      if (s <= T1) { const t = (s - A1) / (T1 - A1); return deck + 1 + (top - deck - 1) * t - 4 * t * (1 - t); }
      if (s >= T2) { const t = (A2 - s) / (A2 - T2); return deck + 1 + (top - deck - 1) * t - 4 * t * (1 - t); }
      const u = (s - mid) / (mid - T1); return low + (top - low) * u * u;
    };
    const towerMat = new THREE.MeshStandardMaterial({ color: ORANGE, roughness: 0.6, metalness: 0.2 });
    for (const ts of [T1, T2]) {
      const c = main.pose(ts);
      const grp = new THREE.Group();
      grp.position.set(c.x, 0, c.z); grp.rotation.y = c.yaw;
      for (const side of [-1, 1]) {
        // each leg narrows in steps as it rises
        for (const [y0, y1, w] of [[-9, deck + 14, 3.4], [deck + 14, deck + 30, 3.0], [deck + 30, top + 2, 2.6]]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(w, y1 - y0, w * 1.4), towerMat);
          leg.position.set(side * hw, (y0 + y1) / 2, 0);
          leg.castShadow = true;
          grp.add(leg);
        }
        const pier = new THREE.Mesh(new THREE.BoxGeometry(7, 6, 9), new THREE.MeshStandardMaterial({ color: 0x9a9690, roughness: 1 }));
        pier.position.set(side * hw, -1, 0);
        grp.add(pier);
        const lamp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#ff3020'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
        lamp.scale.set(3, 3, 1); lamp.position.set(side * hw, top + 3, 0);
        grp.add(lamp);
      }
      for (const [y, h] of [[deck - 2.5, 2.4], [deck + 18, 2.6], [deck + 32, 2.4], [top + 0.5, 3]]) { // portal struts
        const strut = new THREE.Mesh(new THREE.BoxGeometry(hw * 2, h, 2.2), towerMat);
        strut.position.set(0, y, 0);
        strut.castShadow = true;
        grp.add(strut);
      }
      g.add(grp);
    }
    // main cables, suspenders and anchor blocks
    const cableMat = new THREE.MeshStandardMaterial({ color: ORANGE, roughness: 0.5, metalness: 0.3 });
    const hangers = [];
    for (const side of [-1, 1]) {
      const pts = [];
      for (let s = A1; s <= A2; s += 3) { const p = main.pose(s, side * hw); pts.push(new THREE.Vector3(p.x, cableY(s), p.z)); }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 0.5, 6), cableMat));
      for (let s = A1 + 6; s < A2 - 4; s += 5) {
        if (Math.abs(s - T1) < 3 || Math.abs(s - T2) < 3) continue;
        const p = main.pose(s, side * (hw - 0.1)), y0 = main.pose(s).y + 0.6, y1 = cableY(s);
        if (y1 - y0 < 0.6) continue;
        hangers.push(at(p.x, (y0 + y1) / 2, p.z, 0, 1, y1 - y0, 1));
      }
      for (const s of [A1 - 4, A2 + 4]) {
        const p = main.pose(s, side * hw);
        batch.add(vc, paint(new THREE.BoxGeometry(3.4, 3, 7), 0xa29e96), at(p.x, main.pose(s).y + 0.2, p.z, p.yaw));
      }
    }
    const hm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 4), cableMat, hangers.length);
    hangers.forEach((m, i) => hm.setMatrixAt(i, m));
    g.add(hm);
    // stiffening truss under the deck edges, and a railing on top
    for (let s = span.s; s < span.s + span.len; s += 6) {
      const p = main.pose(s + 3);
      for (const side of [-1, 1]) {
        const q = main.pose(s + 3, side * (track.roadHalf + 1.25));
        batch.add(steel, paint(new THREE.BoxGeometry(0.5, 4.2, 6.05), ORANGE), at(q.x, p.y - 2.0, q.z, p.yaw));
        batch.add(steel, paint(new THREE.BoxGeometry(0.15, 0.15, 6.05), ORANGE), at(q.x, p.y + 1.15, q.z, p.yaw));
        for (const o of [-1.5, 1.5]) {
          const pp = main.pose(s + 3 + o, side * (track.roadHalf + 1.25));
          batch.add(steel, paint(new THREE.BoxGeometry(0.12, 1.15, 0.12), ORANGE), at(pp.x, p.y + 0.6, pp.z, p.yaw));
        }
      }
      batch.add(steel, paint(new THREE.BoxGeometry(track.roadHalf * 2 + 3, 0.5, 6.05), 0x6e2a22), at(p.x, p.y - 4.0, p.z, p.yaw)); // deck underside
    }
    // Karl the fog, curling round the towers
    const fogMat = new THREE.SpriteMaterial({ map: glowSprite('#ffffff'), depthWrite: false, transparent: true, opacity: 0.32 });
    for (let i = 0; i < 26; i++) {
      const s = A1 - 60 + r() * (A2 - A1 + 120), d = -200 - r() * 220;
      const p = main.pose(s, d);
      const f = new THREE.Sprite(fogMat);
      const sz = 70 + r() * 70;
      f.scale.set(sz, sz * 0.45, 1);
      f.position.set(p.x, 14 + r() * 30, p.z);
      g.add(f);
    }
  }

  // --- The drawbridge: steel trusses either side, control towers and flashing barriers.
  {
    const span = main.bridges[1], gap = track.ramps.find((rr) => rr.path === main && rr.pit && rr.s > span.s);
    const gs0 = gap.s + gap.len, gs1 = gs0 + gap.pit;
    for (let s = span.s; s < span.s + span.len; s += 4) {
      if (s + 4 > gs0 && s < gs1) continue;
      const p = main.pose(s + 2);
      for (const side of [-1, 1]) {
        const q = main.pose(s + 2, side * (track.roadHalf + 1.3));
        batch.add(steel, paint(new THREE.BoxGeometry(0.4, 3, 4.05), 0x4c5a66), at(q.x, p.y - 1.4, q.z, p.yaw));
        batch.add(steel, paint(new THREE.BoxGeometry(0.2, 0.2, 4.05), 0xd8dde2), at(q.x, p.y + 1.1, q.z, p.yaw));
        batch.add(steel, paint(new THREE.BoxGeometry(0.15, 1.1, 0.15), 0xd8dde2), at(q.x, p.y + 0.55, q.z, p.yaw));
      }
    }
    for (const [s, dir] of [[gs0, -1], [gs1, 1]]) {
      const p = main.pose(s + dir * 4);
      for (const side of [-1, 1]) { // the bascule towers on the pier at each side of the gap
        const q = main.pose(s + dir * 4, side * (track.roadHalf + 4));
        batch.add(vc, paint(new THREE.BoxGeometry(5, p.y + 14, 5), 0x8a9098), at(q.x, (p.y + 14) / 2 - 2, q.z, p.yaw));
        batch.add(vc, paint(new THREE.ConeGeometry(4.2, 4, 4), 0x3d5a70), at(q.x, p.y + 14, q.z, p.yaw + Math.PI / 4));
        batch.add(vc, paint(new THREE.BoxGeometry(5.1, 1.4, 5.1), 0xf4f0e6), at(q.x, p.y + 9, q.z, p.yaw));
      }
    }
    // flashing warning lights at the take-off
    const red = new THREE.SpriteMaterial({ map: glowSprite('#ff2a1a'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
    for (const side of [-1, 1]) {
      const q = main.pose(gap.s - 10, side * (track.roadHalf + 1.5));
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 0.3), new THREE.MeshStandardMaterial({ color: 0xf2f2f2 }));
      post.position.set(q.x, q.y + 1.5, q.z);
      const lamp = new THREE.Sprite(red);
      lamp.scale.set(2.2, 2.2, 1); lamp.position.set(q.x, q.y + 3.2, q.z);
      g.add(post, lamp);
    }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(14, 2), new THREE.MeshStandardMaterial({ map: signTexture('BRIDGE OPEN', { bg: '#f2c500', fg: '#141414' }), side: THREE.DoubleSide }));
    const sp = main.pose(gap.s - 10);
    sign.position.set(sp.x, sp.y + 7.5, sp.z); sign.rotation.y = sp.yaw + Math.PI;
    for (const side of [-1, 1]) {
      const q = main.pose(gap.s - 10, side * (track.roadHalf + 1.5));
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8.5, 0.4), new THREE.MeshStandardMaterial({ color: 0x3a3a3a }));
      post.position.set(q.x, sp.y + 4, q.z);
      g.add(post);
    }
    g.add(sign);
  }

  // --- Victorian row houses up and down the hills, stepping with the slope.
  {
    const pastel = ['#e9c3cf', '#b7d4e8', '#f1e1a6', '#c9e2c3', '#e8b48a', '#d6c4e6', '#f4efe4', '#9fc4c9', '#f0b9a0'];
    const mats = pastel.map((c, i) => new THREE.MeshStandardMaterial({ map: victorianTexture(300 + i, c), roughness: 0.85 }));
    const roofMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
    const row = (path, s0, s1, step, gapD, w, cityOnly) => {
      for (let s = s0; s < s1; s += step) for (const side of [-1, 1]) {
        const p = place(track, s, side * (path.wallHalf + gapD + 4.5), path);
        const yaw = p.yaw + (side > 0 ? -Math.PI / 2 : Math.PI / 2); // front faces the street
        if ((cityOnly && !CITY(p.x, p.z)) || !clearBox(track, p.x, p.z, yaw, w + 1, 11.5, 0)) continue;
        const fx = Math.sin(yaw), fz = Math.cos(yaw), lx = Math.cos(yaw), lz = -Math.sin(yaw);
        let lo = Infinity, hi = -Infinity;
        for (const a of [-1, 1]) for (const b of [-1, 1]) { const h = ground(track, p.x + lx * a * w / 2 + fx * b * 4.5, p.z + lz * a * w / 2 + fz * b * 4.5); lo = Math.min(lo, h); hi = Math.max(hi, h); }
        const front = ground(track, p.x + fx * 4.5, p.z + fz * 4.5);
        const top = front + 11 + r() * 3, base = lo - 1;
        const mi = Math.floor(r() * mats.length);
        const body = new THREE.BoxGeometry(w, top - base, 9);
        const uv = body.attributes.uv; // windows only on the part above the street
        for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * (top - base) / (top - front));
        batch.add(mats[mi], body, at(p.x, (top + base) / 2, p.z, yaw));
        const roof = new THREE.ConeGeometry(w * 0.72, 3.5, 4);
        batch.add(roofMat, paint(roof, r() < 0.5 ? 0x5a5f66 : 0x6b4a3a), at(p.x, top + 1.75, p.z, yaw + Math.PI / 4, 1, 1, 9 / w));
        const bay = new THREE.BoxGeometry(w * 0.45, 7, 1.4); // bay window bumping out over the street
        batch.add(mats[mi], bay, at(p.x + fx * 5.1 - lx * w * 0.2, front + 6.5, p.z + fz * 5.1 - lz * w * 0.2, yaw));
      }
    };
    row(main, 226, 1000, 7.2, 3.5, 6.6, true);
    row(track.path('lombard'), 10, track.path('lombard').length - 10, 8, 3, 6.6, true);
    row(main, 2160, 2260, 9, 4, 7.5, true);
    // more blocks filling the city between the streets
    for (let tries = 0, n = 0; tries < 2500 && n < 340; tries++) { // on a grid of blocks, as the city is
      const x = -320 + Math.floor(r() * 64) * 7.5, z = -95 + Math.floor(r() * 18) * 12.5;
      const yaw = (Math.floor(z / 12.5) % 2 ? 0 : Math.PI), w = 6.6, y = ground(track, x, z);
      if (!clearBox(track, x, z, yaw, w, 9, 1)) continue;
      const mi = Math.floor(r() * mats.length);
      batch.add(mats[mi], new THREE.BoxGeometry(w, 14, 9), at(x, y + 4, z, yaw));
      batch.add(roofMat, paint(new THREE.ConeGeometry(w * 0.72, 3.5, 4), 0x5a5f66), at(x, y + 12.75, z, yaw + Math.PI / 4, 1, 1, 9 / w));
      n++;
    }
  }

  // --- Lombard's flower beds: hedges lining the bends, bright with flowers.
  {
    const lb = track.path('lombard');
    const hedge = new THREE.MeshStandardMaterial({ color: 0x2f6b2a, roughness: 1 });
    const flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.28, 0), new THREE.MeshStandardMaterial({ vertexColors: false, roughness: 0.8 }), 900);
    const fc = [0xff4f8a, 0xffd23f, 0xff7a2a, 0xd94fff, 0xffffff], col = new THREE.Color();
    let nf = 0;
    for (let s = 6; s < lb.length - 6; s += 2) for (const side of [-1, 1]) {
      const p = lb.pose(s, side * (lb.roadHalf + 1.1));
      if (track.inOtherCorridor(p.x, p.z, lb, 0)) continue;
      batch.add(hedge, new THREE.BoxGeometry(1.4, 1.1, 2.1), at(p.x, p.y + 0.4, p.z, p.yaw));
      for (let k = 0; k < 2 && nf < 900; k++) {
        flowers.setMatrixAt(nf, at(p.x + (r() - 0.5) * 1.2, p.y + 1.0, p.z + (r() - 0.5) * 1.6));
        flowers.setColorAt(nf++, col.set(fc[Math.floor(r() * fc.length)]));
      }
    }
    flowers.count = nf;
    g.add(flowers);
  }

  // --- Cable car tracks down the middle of the hill streets, and a cable car waiting at the top.
  {
    const rail = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.8, roughness: 0.35 });
    for (const d of [-0.75, 0.75]) {
      const pts = [];
      for (let s = 232; s <= 720; s += 3) { const p = main.pose(s, d); pts.push(new THREE.Vector3(p.x, p.y + 0.04, p.z)); }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 0.06, 4), rail));
    }
    const p = place(track, 362, -(track.wallHalf - 2.6));
    const car = new THREE.Group();
    car.position.set(p.x, p.y, p.z); car.rotation.y = p.yaw;
    const red = new THREE.MeshStandardMaterial({ color: 0xa8231c, roughness: 0.5 });
    const cream = new THREE.MeshStandardMaterial({ color: 0xf1e3c2, roughness: 0.6 });
    const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; car.add(m); };
    add(new THREE.BoxGeometry(2.6, 0.8, 8.4), red, 0, 1.0, 0);
    add(new THREE.BoxGeometry(2.4, 1.6, 4.6), cream, 0, 2.2, 0);
    add(new THREE.BoxGeometry(2.7, 0.3, 8.8), red, 0, 3.2, 0);
    add(new THREE.BoxGeometry(2.2, 0.5, 7.6), cream, 0, 3.55, 0);
    for (const z of [-3.3, 3.3]) for (const x of [-1.15, 1.15]) add(new THREE.BoxGeometry(0.12, 1.8, 0.12), cream, x, 2.2, z);
    for (const z of [-2.8, 2.8]) for (const x of [-0.9, 0.9]) add(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 10).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x222222 }), x, 0.4, z);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), new THREE.MeshStandardMaterial({ map: signTexture('HYDE ST', { bg: '#f1e3c2', fg: '#a8231c' }) }));
    plate.position.set(0, 3.55, 3.81); car.add(plate);
    g.add(car);
  }

  // --- Downtown by the waterfront: office towers and the white pyramid.
  {
    const offMats = [0, 1, 2, 3].map((i) => new THREE.MeshStandardMaterial({ map: officeTexture(400 + i, i % 2 ? [110, 140, 160] : [150, 140, 120]), roughness: 0.4, metalness: 0.3 }));
    for (const m of offMats) m.map.repeat.set(2, 3);
    for (let tries = 0, n = 0; tries < 400 && n < 22; tries++) {
      const x = 20 + r() * 330, z = -100 + r() * 140;
      const w = 14 + r() * 12, h = 30 + r() * 60, y = ground(track, x, z), dd = w * (0.8 + r() * 0.5), yaw = Math.round(r()) * 0.3;
      if (!clearBox(track, x, z, yaw, w, dd, 3) || (x > 210 && z > 60)) continue;
      batch.add(offMats[n % 4], new THREE.BoxGeometry(w, h, dd), at(x, y + h / 2 - 1, z, yaw));
      n++;
    }
    for (const [x, z] of [[90, -40], [110, -60], [70, -70], [120, -20]]) { // the pyramid: first clear spot
      if (!clearBox(track, x, z, 0, 26, 26, 3)) continue;
      const y = ground(track, x, z);
      batch.add(vc, paint(new THREE.CylinderGeometry(0.4, 13, 110, 4), 0xf2efe8), at(x, y + 54, z, Math.PI / 4));
      for (const side of [-1, 1]) batch.add(vc, paint(new THREE.BoxGeometry(5, 14, 2), 0xf2efe8), at(x + side * 7, y + 66, z));
      break;
    }
  }

  // --- The Ferry Building and its clock tower at the start, palms along the Embarcadero.
  {
    const p = place(track, 46, -(track.wallHalf + 10)), yaw = p.yaw, y = 2.5; // runs along the waterfront
    const arcade = (() => { // cream stone with two rows of arched windows
      const c = document.createElement('canvas'); c.width = 512; c.height = 64;
      const cg = c.getContext('2d');
      cg.fillStyle = '#e9e0cc'; cg.fillRect(0, 0, 512, 64);
      for (let i = 0; i < 24; i++) {
        cg.fillStyle = '#4a5560';
        cg.beginPath(); cg.roundRect(i * 21.3 + 5, 30, 11, 26, [6, 6, 0, 0]); cg.fill();
        cg.fillRect(i * 21.3 + 7, 8, 7, 12);
      }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    })();
    const ferry = new THREE.Mesh(new THREE.BoxGeometry(14, 11, 84), [new THREE.MeshStandardMaterial({ map: arcade }), new THREE.MeshStandardMaterial({ map: arcade }), new THREE.MeshStandardMaterial({ color: 0xe9e0cc }), new THREE.MeshStandardMaterial({ color: 0xe9e0cc }), new THREE.MeshStandardMaterial({ color: 0xe9e0cc }), new THREE.MeshStandardMaterial({ color: 0xe9e0cc })]);
    ferry.position.set(p.x, y + 5.5, p.z); ferry.rotation.y = yaw; ferry.castShadow = ferry.receiveShadow = true;
    g.add(ferry);
    batch.add(vc, paint(new THREE.BoxGeometry(15, 1.2, 85), 0x8a8478), at(p.x, y + 11.4, p.z, yaw));
    for (const [h, w, y0] of [[22, 9, 12], [10, 7, 34], [7, 5.4, 44]]) batch.add(vc, paint(new THREE.BoxGeometry(w, h, w), 0xece4d2), at(p.x, y + y0 + h / 2, p.z, yaw));
    batch.add(vc, paint(new THREE.ConeGeometry(3.6, 6, 4), 0x6f7a74), at(p.x, y + 54, p.z, yaw + Math.PI / 4));
    const clockMat = new THREE.MeshStandardMaterial({ color: 0xfaf6ea, emissive: 0xfff2c0, emissiveIntensity: 0.3 });
    for (const k of [0, 1, 2, 3]) {
      const a = yaw + k * Math.PI / 2;
      const c = new THREE.Mesh(new THREE.CircleGeometry(2.6, 24), clockMat);
      c.position.set(p.x + Math.sin(a) * 4.55, y + 28, p.z + Math.cos(a) * 4.55);
      c.rotation.y = a;
      g.add(c);
    }
    const trunk = new THREE.CylinderGeometry(0.22, 0.32, 1, 6); trunk.translate(0, 0.5, 0);
    const frond = new THREE.ConeGeometry(0.9, 3.6, 4); frond.translate(0, 1.8, 0); frond.rotateX(1.9); frond.scale(1, 1, 1);
    const crownParts = [];
    for (let i = 0; i < 7; i++) crownParts.push(frond.clone().rotateY(i * 0.9).toNonIndexed());
    const crown = mergeGeometries(crownParts);
    const palms = [], crowns = [];
    for (const [s0, s1] of [[8, 200], [2175, 2255]]) for (let s = s0; s < s1; s += 16) {
      const pp = place(track, s, track.wallHalf - 1.5);
      if (!clear(track, pp.x, pp.z, -2.5)) continue;
      const h = 9 + r() * 4;
      palms.push(at(pp.x, pp.y, pp.z, r() * 6, 1, h, 1));
      crowns.push(at(pp.x, pp.y + h, pp.z, r() * 6));
    }
    const tm = new THREE.InstancedMesh(trunk, new THREE.MeshStandardMaterial({ color: 0x7a6248, roughness: 1 }), palms.length);
    const cm = new THREE.InstancedMesh(crown, new THREE.MeshStandardMaterial({ color: 0x3f7a33, roughness: 0.9, side: THREE.DoubleSide }), crowns.length);
    palms.forEach((m, i) => tm.setMatrixAt(i, m)); crowns.forEach((m, i) => cm.setMatrixAt(i, m));
    tm.castShadow = cm.castShadow = true;
    g.add(tm, cm);
  }

  // --- The tower on Telegraph Hill, and the domed palace by the Marina.
  {
    for (const [x, z] of [[260, -20], [250, 0], [270, -45]]) {
      if (!clearBox(track, x, z, 0, 18, 18, 2)) continue;
      const y = ground(track, x, z);
      batch.add(vc, paint(new THREE.CylinderGeometry(4.2, 4.6, 46, 16), 0xf1ece0), at(x, y + 22, z));
      batch.add(vc, paint(new THREE.CylinderGeometry(5.2, 5.2, 3, 16), 0xe8e2d4), at(x, y + 45, z));
      batch.add(vc, paint(new THREE.BoxGeometry(18, 5, 18), 0xe0d8c6), at(x, y + 2, z));
      break;
    }
    const p = place(track, 1030, 52);
    if (clearBox(track, p.x, p.z, 0, 22, 22, 2)) {
      const salmon = 0xd9a088;
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        batch.add(vc, paint(new THREE.CylinderGeometry(0.7, 0.8, 12, 8), salmon), at(p.x + Math.cos(a) * 9, p.y + 6, p.z + Math.sin(a) * 9));
      }
      batch.add(vc, paint(new THREE.CylinderGeometry(10, 10, 3, 16), salmon), at(p.x, p.y + 13.5, p.z));
      batch.add(vc, paint(new THREE.SphereGeometry(9.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xc78a6c), at(p.x, p.y + 15, p.z));
    }
  }

  // --- The island prison out in the bay, with its lighthouse.
  for (const I of SANFRANCISCO.islands) {
    const y = ground(track, I.x, I.z);
    batch.add(vc, paint(new THREE.BoxGeometry(34, 9, 12), 0xd8d2c4), at(I.x, y + 3, I.z, 0.4));
    batch.add(vc, paint(new THREE.BoxGeometry(35, 1, 13), 0x8a857a), at(I.x, y + 7.8, I.z, 0.4));
    batch.add(vc, paint(new THREE.CylinderGeometry(1.2, 1.8, 18, 8), 0xf2f0ea), at(I.x - 12, y + 9, I.z + 6));
    const beam = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#fff6c8'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    beam.scale.set(6, 6, 1); beam.position.set(I.x - 12, y + 19, I.z + 6);
    g.add(beam);
  }

  // --- Sailboats out on the bay.
  {
    const hull = new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.5 });
    const sail = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, side: THREE.DoubleSide });
    let n = 0;
    for (let tries = 0; tries < 300 && n < 14; tries++) {
      const W = SANFRANCISCO.waters[Math.floor(r() * SANFRANCISCO.waters.length)];
      const a = r() * Math.PI * 2, rr = r() * 0.75;
      const x = W.x + Math.cos(a) * W.rx * rr, z = W.z + Math.sin(a) * W.rz * rr;
      if (ground(track, x, z) > -2 || track.inOtherCorridor(x, z, null, 20)) continue;
      const yaw = r() * 6.28;
      batch.add(hull, new THREE.BoxGeometry(2.2, 1.2, 7), at(x, 0.4, z, yaw));
      const tri = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 1, -2.5), new THREE.Vector3(0, 10, 0.2), new THREE.Vector3(0, 1, 2.2)]);
      tri.computeVertexNormals();
      batch.add(sail, tri, at(x, 0, z, yaw));
      n++;
    }
  }

  // --- Trees: Monterey cypress on the headlands and the Presidio, a few street trees in town.
  {
    const crown = (() => {
      const parts = [];
      for (let i = 0; i < 5; i++) { const s = new THREE.SphereGeometry(0.5, 14, 9); s.scale(1, 0.45, 1); s.translate((i % 2 ? 0.35 : -0.3), 0.75 + i * 0.07, (i - 2) * 0.22); parts.push(s.toNonIndexed()); }
      return softFoliage(mergeGeometries(parts), { blend: 0.7, dark: 0.45 });
    })();
    const trunk = new THREE.CylinderGeometry(0.05, 0.1, 0.8, 5); trunk.translate(0, 0.4, 0);
    const max = 900;
    const tr = new THREE.InstancedMesh(trunk, new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 1 }), max);
    const cr = new THREE.InstancedMesh(crown, foliageMaterial(), max);
    const col = new THREE.Color();
    const B = track.bounds;
    let n = 0;
    for (let tries = 0; tries < 20000 && n < max; tries++) {
      const x = B.minX + 120 + r() * (B.maxX - B.minX - 240), z = B.minZ + 120 + r() * (B.maxZ - B.minZ - 240);
      if (CITY(x, z) && r() < 0.93) continue;
      if (!clear(track, x, z, 4)) continue;
      const y = ground(track, x, z), h = 7 + r() * 8;
      const m = at(x, y - 0.3, z, r() * 6.28, h * 0.9, h, h * 0.9);
      tr.setMatrixAt(n, m); cr.setMatrixAt(n, m);
      cr.setColorAt(n, col.setHSL(0.27 + r() * 0.08, 0.5, 0.25 + r() * 0.09));
      n++;
    }
    for (const m of [tr, cr]) { m.count = n; m.castShadow = true; m.receiveShadow = true; g.add(m); }
  }

  // --- Street furniture: green lamp posts through town, crosswalks at the flat intersections.
  {
    const posts = [], heads = [];
    for (const path of [main, track.path('lombard')]) {
      for (let s = 0; s < path.length; s += 24) for (const side of [-1, 1]) {
        const p = path.pose(s, side * (path.roadHalf + 1.2));
        if (!CITY(p.x, p.z) || path.bridge[p.index] || track.inOtherCorridor(p.x, p.z, path, 0)) continue;
        posts.push(at(p.x, p.y + 2.6, p.z));
        heads.push(at(p.x, p.y + 5.3, p.z));
      }
    }
    const post = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.14, 5.2, 6), new THREE.MeshStandardMaterial({ color: 0x2c4a3a, roughness: 0.6, metalness: 0.4 }), posts.length);
    posts.forEach((m, i) => post.setMatrixAt(i, m));
    const head = new THREE.InstancedMesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffd28a, emissiveIntensity: 1.2 }), heads.length);
    heads.forEach((m, i) => head.setMatrixAt(i, m));
    g.add(post, head);
    const white = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.7 });
    for (const s of [296, 500, 652, 1100]) for (const o of [-6, 6]) {
      for (let d = -track.roadHalf + 1; d < track.roadHalf; d += 1.6) {
        const p = main.pose(s + o, d);
        batch.add(white, new THREE.BoxGeometry(0.8, 0.04, 3), at(p.x, p.y + 0.03, p.z, p.yaw));
      }
    }
  }

  // --- Army bunker at the headlands tunnel, and a sign over each tunnel mouth.
  for (const [id, text, bg] of [['headlands', 'BATTERY TUNNEL', '#4a4f3a'], ['broadway', 'NOB HILL TUNNEL', '#3a3f48']]) {
    const pt = track.path(id).portals?.[0];
    if (!pt) continue;
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.5), new THREE.MeshStandardMaterial({ map: signTexture(text, { bg, fg: '#f4ecd2', font: 'bold 60px Arial Black, Impact, sans-serif' }), side: THREE.DoubleSide }));
    sign.position.set(pt.x, pt.y + 10.4, pt.z);
    sign.rotation.y = pt.yaw + Math.PI;
    sign.translateZ(0.8);
    g.add(sign);
  }

  // The start/finish arch, grandstands and trackside dressing come from dressing.js.

  batch.flush(g);
  return g;
}
