// "Transylvania": out of Bran village, up through the dark Carpathian forest to
// Bran Castle and through its gatehouse, then down past a blood ravine, the old
// graveyard and the moat back to the village. Sausages stand impaled on stakes
// along the forest road. Pools of blood spin you out, and swarms of bats circle
// over the road: get close and they turn into a vampire standing in your lane.
// Two ways through: the graveyard lane and a secret tunnel through the castle
// dungeons. Garlic gives you a boost.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { townhouseTexture, signTexture, glowSprite, rng } from '../textures.js';
import { pumpkinGeometry } from '../props.js';
import { softFoliage, foliageMaterial } from '../graphics.js';

const CASTLE = { x: 75, z: 318 };
const VILLAGE = (x, z) => x > -130 && x < 250 && z > -110 && z < 110;

export const TRANSYLVANIA = {
  id: 'transylvania',
  name: 'Transylvania',
  short: 'Transylvania',
  region: 'Bran, Transylvania',
  blurb: 'Through the haunted Carpathian forest and the gate of Bran Castle. Dodge pools of blood and the bats that turn into vampires, grab garlic for a boost, and find the graveyard lane and the secret dungeon tunnel.',
  seed: 1897,
  roadHalf: 9,
  wallHalf: 16,
  points: [
    [0, 3, 0], [130, 3, 0], [230, 5, 40], [290, 9, 130], [270, 16, 230], [200, 24, 280], [150, 32, 350], [70, 36, 375],
    [-10, 32, 340], [-50, 26, 280], [-130, 20, 300], [-220, 14, 260], [-270, 9, 170], [-260, 6, 70], [-300, 5, -30],
    [-250, 4, -130], [-140, 3, -140], [-70, 3, -70],
  ],
  features: [
    { type: 'pad', s: 170, d: 0 },
    { type: 'pad', s: 276, d: 0 },
    { type: 'ramp', s: 300, len: 12, h: 1.4 },                           // kicker on the climb out of the village
    { type: 'pad', s: 590, d: -3 }, { type: 'pad', s: 590, d: 3 },
    { type: 'pad', s: 752, d: -3 }, { type: 'pad', s: 752, d: 3 },
    { type: 'ramp', s: 776, len: 12, h: 1.8, pit: 18, depth: 5 },        // the blood ravine below the castle
    { type: 'pad', s: 1010, d: 0 },
    { type: 'pad', s: 1412, d: -4 }, { type: 'pad', s: 1412, d: 4 },
    { type: 'ramp', s: 1436, len: 12, h: 2.0, pit: 14, depth: 4.5 },     // over the castle moat
    { type: 'pad', s: 1556, d: 0 },
    { type: 'ramp', s: 1580, len: 10, h: 1.3 },                          // hop by the village gate
  ],
  branches: [
    { // boarded-up passage through the dungeons under the castle
      id: 'dungeon', name: 'The dungeons', call: 'SECRET DUNGEON!', from: 525, to: 885, dFrom: 5, dTo: 5, roadHalf: 6.5, secret: true,
      points: [[160, 25, 292], [75, 26, 300], [-10, 27, 292]],
      tunnel: [0.14, 0.78], wallColor: 0x6a6460, portalColor: 0x4a4440,
      features: [{ type: 'pad', s: 40, d: 0 }, { type: 'pad', s: 120, d: 0 }, { type: 'pad', s: 200, d: 0 }],
    },
    { // cobbled lane through the old graveyard
      id: 'graveyard', name: 'Graveyard lane', call: 'GRAVEYARD SHORTCUT!', from: 1075, to: 1285, dFrom: 5, dTo: 5, surface: 'cobble', roadHalf: 6, shoulder: 3,
      points: [[-230, 12, 225], [-232, 9, 150], [-245, 7, 95]],
      features: [{ type: 'pad', s: 25, d: 0 }, { type: 'pad', s: 105, d: 0 }, { type: 'pad', s: 175, d: 0 }],
    },
  ],
  mounds: [
    { x: CASTLE.x, z: CASTLE.z, rx: 55, rz: 40, h: 34 },  // the castle crag over the dungeons
    { x: 0, z: 620, rx: 520, rz: 160, h: 95 },             // the Carpathians to the north
    { x: -120, z: -360, rx: 420, rz: 120, h: 60 },         // hills to the south
    { x: 520, z: 160, rx: 150, rz: 320, h: 70 },           // and the east
    { x: -520, z: 120, rx: 150, rz: 320, h: 70 },          // and the west
  ],
  pickups: [ // rows of garlic across the road
    { s: 90 }, { s: 420 }, { s: 660 }, { s: 940 }, { s: 1240 }, { s: 1500 }, { s: 1680 },
    { path: 'dungeon', s: 80, spread: [-3, 3] }, { path: 'dungeon', s: 160, spread: [-3, 3] },
    { path: 'graveyard', s: 70, spread: [-3, 3] }, { path: 'graveyard', s: 145, spread: [-3, 3] },
  ],
  barrels: [ // rows of jack-o'-lanterns; jump them or thread the gap
    { s: 470, gapD: 3 }, { s: 473.5, gapD: 3 }, { s: 1180, gapD: -3 }, { s: 1183.5, gapD: -3 },
  ],
  crates: [{ path: 'dungeon', s: 'portal' }], // planks over the dungeon mouth
  bats: [ // swarms that turn into vampires as you get close
    { s: 380, d: 0 }, { s: 640, d: -2 }, { s: 860, d: 2 }, { s: 1050, d: -2 }, { s: 1340, d: 2 }, { s: 1650, d: 0 },
    { path: 'graveyard', s: 125 },
  ],
  theme: {
    pit: 'blood', pitWall: 0x3a3236, tunnelLamp: 0xff8a2a,
    pad: { bg: '#2a0610', fg: '#ff4a4a', emissive: 0xff1a1a },
    pickup: 'garlic', pickupText: 'GARLIC POWER!', pickupColor: [1, 0.96, 0.88], pickupGlow: '#fff2d0', ringColor: 0xb070ff,
    puddle: 'blood', puddleText: 'Slipped in blood!',
    barrel: 'pumpkin', barrelText: 'Pumpkin smash!', barrelColor: [1, 0.5, 0.1],
    splashText: 'SPLASHED IN BLOOD!', splashColor: [0.6, 0.02, 0.04], vampireText: 'VAMPIRE BITE!',
    boostColor: [0.75, 0.35, 1], dustColor: [0.4, 0.36, 0.32],
    radiation: false, mapAccent: '#c070ff', mapPit: '#d0101a', loseText: 'The night belongs to the vampires.',
  },
  weathers: ['fog', 'thunder', 'clear'],
  times: { day: 1, sunset: 2, night: 3 }, // usually after dark
  sky: { top: 0x343650, horizon: 0xb8a4a0, ground: 0x4a4a40, cloudDark: 0x5a5668, cloudLight: 0xbab4c0, sun: 0xffc890, cover: 0.75 },
  light: { sun: 0xf0d8c0, sunIntensity: 1.7, hemiSky: 0xa8a8c0, hemiGround: 0x3a3428, hemiIntensity: 0.95, env: 0.45, exposure: 0.95, sunDir: [-60, 50, -40], envGround: 0x3a3a30 },
  fog: { color: 0x8a8a98, density: 0.0032 },
  dressing: { // pumpkin orange and vampire purple
    curb: ['#6a2ca0', '#f07a1c'], barrier: { type: 'tires', colors: [0x6a2ca0, 0xf07a1c] }, chevron: ['#f07a1c', '#2a0f3a'],
    flags: [0xf07a1c, 0x6a2ca0, 0x161616, 0x7dff3a], arch: 0x6a2ca0, archTrim: 0xf07a1c, seats: 0x6a2ca0, roof: 0x2a1a30,
    screen: ['#1a0820', '#ffffff', '#f07a1c'], blimpColors: ['#6a2ca0', '#f07a1c'],
    ads: [['DRACULA DENTAL', '#ffffff', '#8a0f1a'], ['GARLIC-FREE', '#161616', '#f07a1c'], ['CORNKART', '#f07a1c', '#2a0f3a'], ['BAT WINGS', '#ffffff', '#6a2ca0'], ['COFFIN & CO', '#f0e0c0', '#2a2020'], ['MOONLIGHT FM', '#161616', '#e8e4d0']],
    motes: { color: '#ffb050', count: 450, size: 0.5, height: 4 },
  },
  nightLight: { sun: 0xa8b8f0, sunIntensity: 1.1, hemiSky: 0x8088b8, hemiIntensity: 1.5, exposure: 1.2 }, // a bright full moon
  groundTint,
  buildScenery,
};

const tmpC = new THREE.Color();
function groundTint(x, z, dist) {
  if (dist < 18) return null;
  if (VILLAGE(x, z)) return null; // village meadows
  tmpC.setRGB(0.17, 0.2, 0.11); tmpC.amount = 0.6; // dark forest floor
  return tmpC;
}

function ground(track, x, z) { return track.terrainAt(x, z); }

function place(track, s, d, path = track.main) {
  const p = path.pose(s, d);
  return { x: p.x, z: p.z, y: ground(track, p.x, p.z), yaw: p.yaw };
}

// Is (x, z) clear of every road corridor (main loop and shortcuts)?
function clear(track, x, z, margin = 6) {
  for (const p of track.paths) {
    if (!p.inBox(x, z) && p !== track.main) continue;
    const q = p.query(x, z, -1, {});
    if (!q.beyond && Math.abs(q.d) < p.wallHalf + margin) return false;
  }
  return true;
}

// Is a w-by-d footprint centred on (x, z) and turned by yaw clear of every road corridor?
function clearBox(track, x, z, yaw, w, d, margin = 1) {
  const lx = Math.cos(yaw), lz = -Math.sin(yaw), fx = Math.sin(yaw), fz = Math.cos(yaw);
  for (const a of [-0.5, 0, 0.5]) for (const b of [-0.5, 0, 0.5]) {
    if (!clear(track, x + lx * a * w + fx * b * d, z + lz * a * w + fz * b * d, margin)) return false;
  }
  return true;
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

// Gable roof as a triangular prism along x, eaves overhanging.
function gableRoof(w, d, h) {
  const shape = new THREE.Shape();
  shape.moveTo(-d / 2 - 0.5, 0); shape.lineTo(d / 2 + 0.5, 0); shape.lineTo(0, h); shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: w + 0.8, bevelEnabled: false });
  g.translate(0, 0, -(w + 0.8) / 2);
  g.rotateY(Math.PI / 2);
  return g;
}
// Four-sided pointed roof for a square tower.
function pyramidRoof(w, h) {
  const g = new THREE.ConeGeometry(w * 0.74, h, 4, 1);
  g.rotateY(Math.PI / 4);
  g.translate(0, h / 2, 0);
  return g;
}

const WHITE = 0xebe5d8, ROOF = 0x9a4426, ROOF_DARK = 0x7a3420, STONE = 0x6e6a66, WOOD = 0x3a2a20;

function buildScenery(scene, track) {
  const r = rng(13);
  const g = new THREE.Group();
  scene.add(g);
  const batch = new Batch();
  const vc = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
  const lit = new THREE.MeshStandardMaterial({ color: 0xffc070, emissive: 0xff9a30, emissiveIntensity: 1.6 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1614, roughness: 0.9 });

  // Small windows on one face of a box, some lit and some dark.
  const windows = (cx, cy, cz, yaw, w, h, faceD, rows, cols, litChance = 0.35) => {
    const fx = Math.sin(yaw), fz = Math.cos(yaw), lx = Math.cos(yaw), lz = -Math.sin(yaw);
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
      const ox = (j + 0.5) / cols - 0.5, oy = (i + 0.5) / rows - 0.5;
      const geo = new THREE.BoxGeometry(0.9, 1.3, 0.2);
      batch.add(r() < litChance ? lit : dark, geo, at(cx + lx * ox * w * 0.8 + fx * faceD, cy + oy * h * 0.75, cz + lz * ox * w * 0.8 + fz * faceD, yaw));
    }
  };

  // --- Bran Castle on its crag: white walls, terracotta roofs, towers.
  {
    const cx = CASTLE.x, cz = CASTLE.z, base = ground(track, cx, cz) - 1;
    const yaw = -0.35;
    const L = (x, z) => [cx + Math.cos(yaw) * x + Math.sin(yaw) * z, cz - Math.sin(yaw) * x + Math.cos(yaw) * z];
    const block = (x, z, w, d, h, roofH) => {
      const [px, pz] = L(x, z);
      const y0 = Math.min(base, ground(track, px, pz) - 1);
      const hh = h + (base - y0);
      batch.add(vc, paint(new THREE.BoxGeometry(w, hh, d), WHITE), at(px, y0 + hh / 2, pz, yaw));
      batch.add(vc, paint(gableRoof(w, d, roofH), ROOF), at(px, base + h, pz, yaw));
      for (const [face, ww] of [[d / 2 + 0.05, w], [-d / 2 - 0.05, w]]) windows(px, base + h * 0.6, pz, yaw, ww, h * 0.6, face, 3, Math.max(2, Math.round(w / 4)));
    };
    const tower = (x, z, w, h, roofH, round = false) => {
      const [px, pz] = L(x, z);
      const y0 = Math.min(base, ground(track, px, pz) - 1);
      const hh = h + (base - y0);
      const body = round ? new THREE.CylinderGeometry(w / 2, w / 2 + 0.6, hh, 18) : new THREE.BoxGeometry(w, hh, w);
      batch.add(vc, paint(body, WHITE), at(px, y0 + hh / 2, pz, yaw));
      const roof = round ? new THREE.ConeGeometry(w / 2 + 1, roofH, 18).translate(0, roofH / 2, 0) : pyramidRoof(w + 1.2, roofH);
      batch.add(vc, paint(roof, round ? ROOF_DARK : ROOF), at(px, base + h, pz, yaw));
      batch.add(vc, paint(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 5), 0x222222), at(px, base + h + roofH + 1, pz)); // finial
      windows(px, base + h * 0.65, pz, yaw, w, h * 0.5, w / 2 + 0.05, 3, 2, 0.5);
      windows(px, base + h * 0.65, pz, yaw + Math.PI, w, h * 0.5, w / 2 + 0.05, 3, 2, 0.5);
    };
    block(0, 0, 24, 14, 14, 7);           // main hall
    block(8, 12, 14, 10, 11, 5);          // north wing
    block(-6, -12, 16, 9, 10, 5);         // south wing
    tower(-15, 5, 10, 21, 10, true);      // great round tower
    tower(12, -6, 8, 25, 9);              // tall square keep
    tower(17, 10, 5, 18, 7, true);        // turret
    tower(-10, -15, 6, 16, 7);            // gate tower
    // the crag: grey rock tumbling down below the walls
    const rock = new THREE.MeshStandardMaterial({ color: STONE, roughness: 1, flatShading: true });
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2, rr = 17 + r() * 6;
      const [px, pz] = [cx + Math.cos(a) * rr, cz + Math.sin(a) * rr * 0.8];
      const s = 4 + r() * 4;
      batch.add(rock, new THREE.DodecahedronGeometry(1, 0), at(px, ground(track, px, pz) + s * 0.2, pz, r() * 6, s, s * (1.2 + r()), s));
    }
    // a glow in the top window of the keep
    const [kx, kz] = L(12, -6);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#ffb050'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    glow.scale.set(9, 9, 1); glow.position.set(kx, base + 22, kz);
    g.add(glow);
  }

  // --- The gatehouse: the road runs under an arch between two towers, with
  // curtain walls climbing the crag to the castle.
  {
    const s = 714, p = track.pose(s, 0);
    const lat = [-p.tz, p.tx];
    const toCastle = Math.sign((CASTLE.x - p.x) * lat[0] + (CASTLE.z - p.z) * lat[1]) || 1;
    const half = track.roadHalf + 4.5;
    for (const side of [-1, 1]) {
      const x = p.x + lat[0] * side * half, z = p.z + lat[1] * side * half;
      const y0 = Math.min(p.y, ground(track, x, z)) - 1;
      const h = 16 + (p.y - y0);
      batch.add(vc, paint(new THREE.BoxGeometry(7, h, 7), WHITE), at(x, y0 + h / 2, z, p.yaw));
      batch.add(vc, paint(pyramidRoof(8.2, 7), ROOF), at(x, p.y + 16 - 1, z, p.yaw));
      windows(x, p.y + 11, z, p.yaw, 7, 5, 3.55, 1, 1, 0.8);
      windows(x, p.y + 11, z, p.yaw + Math.PI, 7, 5, 3.55, 1, 1, 0.8);
    }
    // the arch over the road: 9.5 m clear underneath
    batch.add(vc, paint(new THREE.BoxGeometry(half * 2, 4.5, 6), WHITE), at(p.x, p.y + 11.75, p.z, p.yaw));
    batch.add(vc, paint(gableRoof(half * 2, 6, 3), ROOF), at(p.x, p.y + 14, p.z, p.yaw));
    for (const dir of [-1, 1]) { // name boards on both faces
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(14, 2), new THREE.MeshStandardMaterial({ map: signTexture('CASTELUL BRAN', { w: 1024, h: 146, bg: '#3a0a0e', fg: '#f2d9a0' }), side: THREE.DoubleSide }));
      sign.position.set(p.x + p.tx * dir * 3.1, p.y + 11.5, p.z + p.tz * dir * 3.1);
      sign.rotation.y = p.yaw + (dir > 0 ? 0 : Math.PI);
      g.add(sign);
    }
    // curtain wall up the crag towards the castle, following the ground
    const x0 = p.x + lat[0] * toCastle * (half + 3.5), z0 = p.z + lat[1] * toCastle * (half + 3.5);
    const dx = CASTLE.x - x0, dz = CASTLE.z - z0, n = Math.floor(Math.hypot(dx, dz) / 5);
    for (let i = 0; i < n - 3; i++) {
      const x = x0 + dx * (i + 0.5) / n, z = z0 + dz * (i + 0.5) / n;
      if (!clear(track, x, z, 0)) continue;
      const y = ground(track, x, z);
      batch.add(vc, paint(new THREE.BoxGeometry(2.2, 8, 5.4), WHITE), at(x, y + 3, z, Math.atan2(dx, dz)));
      if (i % 2 === 0) batch.add(vc, paint(new THREE.BoxGeometry(2.4, 1.4, 1.6), WHITE), at(x, y + 7.6, z, Math.atan2(dx, dz))); // merlons
    }
  }

  // --- Bran village: whitewashed houses with steep red roofs and dark timbers.
  {
    const walls = ['#ece4d2', '#e6d6b0', '#d8c8a8', '#efe8da', '#c9b896'];
    const mats = walls.map((c, i) => new THREE.MeshStandardMaterial({ map: townhouseTexture(400 + i, c, 2, 3), roughness: 0.9 }));
    for (let s = -190; s < 230; s += 15) for (const side of [-1, 1]) {
      const ss = (s + track.length) % track.length;
      const p = place(track, ss, side * (track.wallHalf + 8 + r() * 5));
      if (!VILLAGE(p.x, p.z)) continue;
      const w = 10 + r() * 3, h = 6 + r() * 3, d = 8, yaw = p.yaw + Math.PI / 2;
      if (!clearBox(track, p.x, p.z, yaw, w, d, 1)) continue;
      const body = new THREE.BoxGeometry(w, h, d);
      const m = mats[Math.floor(r() * mats.length)];
      m.map.wrapS = THREE.RepeatWrapping;
      batch.add(m, body, at(p.x, p.y - 0.5 + h / 2, p.z, yaw));
      batch.add(vc, paint(gableRoof(w, d, 5 + r() * 2), r() < 0.5 ? ROOF : 0x5a3a2c), at(p.x, p.y - 0.5 + h, p.z, yaw));
      for (const sx of [-1, 1]) batch.add(vc, paint(new THREE.BoxGeometry(0.3, h, d + 0.1), WOOD), at(p.x + Math.cos(yaw) * sx * w / 2, p.y - 0.5 + h / 2, p.z - Math.sin(yaw) * sx * w / 2, yaw));
    }
  }

  // --- Trees: a dark fir forest with bare, crooked dead trees between them.
  {
    const fir = (() => {
      const trunk = new THREE.CylinderGeometry(0.1, 0.2, 0.4, 6); trunk.translate(0, 0.2, 0);
      const green = [];
      for (const [y, w, h] of [[0.12, 1, 0.42], [0.34, 0.78, 0.4], [0.56, 0.56, 0.36], [0.76, 0.34, 0.28]]) {
        const c = new THREE.ConeGeometry(w * 0.5, h, 12, 2); c.translate(0, y + h / 2, 0); green.push(c.toNonIndexed());
      }
      return { trunk, crown: softFoliage(mergeGeometries(green), { blend: 0.45, dark: 0.4 }) };
    })();
    const deadTree = (() => {
      const parts = [];
      const t = new THREE.CylinderGeometry(0.05, 0.12, 1, 6); t.translate(0, 0.5, 0); parts.push(t.toNonIndexed());
      for (let i = 0; i < 7; i++) {
        const b = new THREE.CylinderGeometry(0.01, 0.035, 0.42 - i * 0.03, 4); b.translate(0, 0.2, 0);
        b.rotateZ(0.8 + (i % 3) * 0.25); b.rotateY(i * 2.2); b.translate(0, 0.42 + i * 0.075, 0);
        parts.push(b.toNonIndexed());
        const tw = new THREE.CylinderGeometry(0.005, 0.015, 0.16, 3); tw.translate(0, 0.08, 0);
        tw.rotateZ(-0.6); tw.rotateY(i * 2.2 + 0.5); tw.translate(Math.cos(i * 2.2) * 0.2, 0.55 + i * 0.075, -Math.sin(i * 2.2) * 0.2);
        parts.push(tw.toNonIndexed());
      }
      return mergeGeometries(parts);
    })();
    const max = 2600;
    const bark = new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 1 });
    const needles = foliageMaterial({ amp: 0.018 });
    const deadMat = new THREE.MeshStandardMaterial({ color: 0x3e3834, roughness: 1 });
    const tr = new THREE.InstancedMesh(fir.trunk, bark, max), cr = new THREE.InstancedMesh(fir.crown, needles, max);
    const de = new THREE.InstancedMesh(deadTree, deadMat, 600);
    let n = 0, nd = 0;
    const col = new THREE.Color();
    const B = track.bounds;
    for (let tries = 0; tries < 40000 && n < max; tries++) {
      let x, z;
      if (tries % 2) { // half of them crowd the roadside
        const p = track.main.pose(r() * track.length, (r() < 0.5 ? -1 : 1) * (track.wallHalf + 4 + r() * 40));
        x = p.x; z = p.z;
      } else { x = B.minX + 80 + r() * (B.maxX - B.minX - 160); z = B.minZ + 80 + r() * (B.maxZ - B.minZ - 160); }
      if (VILLAGE(x, z) && r() < 0.85) continue;
      if (Math.hypot(x - CASTLE.x, (z - CASTLE.z) * 1.3) < 42) continue;
      if (!clear(track, x, z, 3)) continue;
      const y = ground(track, x, z);
      if (r() < 0.25 && nd < 600) {
        const h = 8 + r() * 6;
        de.setMatrixAt(nd++, at(x, y - 0.2, z, r() * 6, h * 0.9, h, h * 0.9));
        continue;
      }
      const h = 10 + r() * 12, w = h * (0.3 + r() * 0.08);
      const m = at(x, y - 0.3, z, r() * 6.28, w, h, w);
      tr.setMatrixAt(n, m); cr.setMatrixAt(n, m);
      cr.setColorAt(n, col.setHSL(0.4 + r() * 0.07, 0.38, 0.13 + r() * 0.06));
      n++;
    }
    for (const m of [tr, cr]) { m.count = n; m.castShadow = true; m.receiveShadow = true; g.add(m); }
    de.count = nd; de.castShadow = true; g.add(de);
  }

  // --- Sausages impaled on sharpened stakes along the forest road.
  {
    const stakeGeo = new THREE.CylinderGeometry(0.11, 0.14, 4.4, 6); stakeGeo.translate(0, 2.2, 0);
    const tipGeo = new THREE.ConeGeometry(0.11, 0.55, 6); tipGeo.translate(0, 4.67, 0);
    const sausageGeo = new THREE.CapsuleGeometry(0.3, 1.4, 6, 12);
    const stakes = new THREE.InstancedMesh(mergeGeometries([stakeGeo, tipGeo]), new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.95 }), 400);
    const sausages = new THREE.InstancedMesh(sausageGeo, new THREE.MeshPhysicalMaterial({ color: 0x9a3e22, roughness: 0.35, clearcoat: 0.6 }), 400);
    const ends = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 6, 4), new THREE.MeshStandardMaterial({ color: 0xd8c8a0 }), 800);
    let n = 0, ne = 0;
    const q = new THREE.Quaternion(), e = new THREE.Euler(), m4 = new THREE.Matrix4(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    for (let s = 260; s < 1720 && n < 400; s += 16 + r() * 14) {
      const side = r() < 0.5 ? -1 : 1;
      const groupN = 2 + Math.floor(r() * 4);
      for (let k = 0; k < groupN && n < 400; k++) {
        const p = place(track, s + k * 2.6, side * (track.wallHalf + 1 + r() * 4));
        if (!clear(track, p.x, p.z, 0.5) || VILLAGE(p.x, p.z)) continue;
        const lean = (r() - 0.5) * 0.25;
        stakes.setMatrixAt(n, at(p.x, p.y - 0.3, p.z, r() * 6, 1, 0.9 + r() * 0.3, 1).multiply(new THREE.Matrix4().makeRotationZ(lean)));
        // the sausage skewered through its middle, at a jaunty angle
        const hgt = p.y - 0.3 + 2.6 + r() * 1.2;
        e.set(Math.PI / 2 + (r() - 0.5) * 0.9, r() * 6, (r() - 0.5) * 0.5);
        q.setFromEuler(e);
        v.set(p.x + Math.sin(lean) * -hgt * 0.05, hgt, p.z);
        sausages.setMatrixAt(n, m4.compose(v, q, one).clone());
        for (const sgn of [-1, 1]) { // tied ends
          const end = new THREE.Vector3(0, sgn * 1.0, 0).applyQuaternion(q).add(v);
          ends.setMatrixAt(ne++, at(end.x, end.y, end.z));
        }
        n++;
      }
    }
    stakes.count = n; sausages.count = n; ends.count = ne;
    for (const m of [stakes, sausages]) m.castShadow = true;
    g.add(stakes, sausages, ends);
  }

  // --- The graveyard: headstones, crosses, a chapel and an iron fence.
  {
    const yard = track.path('graveyard');
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a8884, roughness: 1 });
    const stoneGeo = mergeGeometries([new THREE.BoxGeometry(0.9, 1.0, 0.2).translate(0, 0.5, 0), new THREE.CylinderGeometry(0.45, 0.45, 0.2, 12, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).translate(0, 1.0, 0)]);
    const crossGeo = mergeGeometries([new THREE.BoxGeometry(0.16, 1.6, 0.16).translate(0, 0.8, 0), new THREE.BoxGeometry(0.8, 0.16, 0.16).translate(0, 1.15, 0)]);
    const stones = new THREE.InstancedMesh(stoneGeo, stoneMat, 300), crosses = new THREE.InstancedMesh(crossGeo, stoneMat, 200);
    let ns = 0, nc = 0;
    for (let s = 10; s < yard.length - 10; s += 3.2) for (const side of [-1, 1]) for (let row = 0; row < 4; row++) {
      const p = place(track, s + (row % 2) * 1.6, side * (yard.wallHalf + 2 + row * 2.8), yard);
      if (!clear(track, p.x, p.z, 0.5) || r() < 0.2) continue;
      const tilt = new THREE.Matrix4().makeRotationZ((r() - 0.5) * 0.3);
      if (r() < 0.6 && ns < 300) stones.setMatrixAt(ns++, at(p.x, p.y - 0.1, p.z, p.yaw + (r() - 0.5) * 0.4).multiply(tilt));
      else if (nc < 200) crosses.setMatrixAt(nc++, at(p.x, p.y - 0.1, p.z, p.yaw + (r() - 0.5) * 0.4).multiply(tilt));
    }
    stones.count = ns; crosses.count = nc;
    stones.castShadow = crosses.castShadow = true;
    g.add(stones, crosses);
    // iron fence along both sides of the lane
    const fence = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 4).translate(0, 0.8, 0), new THREE.MeshStandardMaterial({ color: 0x1a1a1c, metalness: 0.6, roughness: 0.5 }), 600);
    let nf = 0;
    for (let s = 4; s < yard.length - 4 && nf < 600; s += 0.7) for (const side of [-1, 1]) {
      const p = place(track, s, side * (yard.wallHalf + 0.6), yard);
      if (track.inOtherCorridor(p.x, p.z, yard, 0)) continue;
      fence.setMatrixAt(nf++, at(p.x, p.y - 0.1, p.z));
    }
    fence.count = nf; g.add(fence);
    // the chapel
    const p = place(track, yard.length * 0.5, -(yard.wallHalf + 18), yard);
    if (clearBox(track, p.x, p.z, p.yaw, 10, 14, 1)) {
      const y = p.y - 0.5;
      batch.add(vc, paint(new THREE.BoxGeometry(8, 7, 14), 0xd8d0c0), at(p.x, y + 3.5, p.z, p.yaw));
      batch.add(vc, paint(gableRoof(14, 8, 5).rotateY(Math.PI / 2), 0x3a3a40), at(p.x, y + 7, p.z, p.yaw));
      batch.add(vc, paint(new THREE.BoxGeometry(3.2, 6, 3.2), 0xd8d0c0), at(p.x + Math.sin(p.yaw) * 6, y + 10, p.z + Math.cos(p.yaw) * 6, p.yaw));
      batch.add(vc, paint(pyramidRoof(3.6, 6), 0x3a3a40), at(p.x + Math.sin(p.yaw) * 6, y + 13, p.z + Math.cos(p.yaw) * 6, p.yaw));
      batch.add(vc, paint(crossGeo.clone(), 0xc8a040), at(p.x + Math.sin(p.yaw) * 6, y + 19, p.z + Math.cos(p.yaw) * 6, p.yaw));
    }
  }

  // --- Lanterns on posts through the village and up to the castle gate.
  {
    const posts = [], heads = [];
    for (let s = -200; s < 760; s += 30) for (const side of [-1, 1]) {
      const ss = (s + track.length) % track.length;
      if (ss > 230 && ss < 560) continue; // dark forest in between
      const p = place(track, ss, side * (track.wallHalf + 0.8));
      if (track.inOtherCorridor(p.x, p.z, track.main, 0)) continue;
      posts.push(at(p.x, p.y + 2, p.z));
      heads.push(at(p.x, p.y + 4.2, p.z));
    }
    const post = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.14, 4, 6), new THREE.MeshStandardMaterial({ color: 0x1e1c1a, metalness: 0.4 }), posts.length);
    posts.forEach((m, i) => post.setMatrixAt(i, m));
    const head = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.6, 0.5), new THREE.MeshStandardMaterial({ color: 0xffd090, emissive: 0xff9030, emissiveIntensity: 2.2 }), heads.length);
    heads.forEach((m, i) => head.setMatrixAt(i, m));
    g.add(post, head);
  }

  // --- Jack-o'-lanterns grinning by the roadside, and low mist in the forest.
  {
    const pk = new THREE.InstancedMesh(pumpkinGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, emissive: 0x3a1800, emissiveIntensity: 0.6 }), 60);
    let n = 0;
    for (let i = 0; i < 140 && n < 60; i++) {
      const s = r() * track.length, side = r() < 0.5 ? -1 : 1;
      const p = place(track, s, side * (track.wallHalf + 1 + r() * 3));
      if (!clear(track, p.x, p.z, 0.3)) continue;
      pk.setMatrixAt(n++, at(p.x, p.y - 0.1, p.z, p.yaw + Math.PI + side * 0.9, 0.9 + r() * 0.5, 0.9 + r() * 0.5, 0.9 + r() * 0.5));
    }
    pk.count = n; pk.castShadow = true;
    g.add(pk);
    const mist = new THREE.SpriteMaterial({ map: glowSprite('#c8c8d8'), transparent: true, depthWrite: false, opacity: 0.22 });
    for (let i = 0; i < 70; i++) {
      const s = r() * track.length, side = r() < 0.5 ? -1 : 1;
      const p = place(track, s, side * (track.wallHalf + 4 + r() * 30));
      if (VILLAGE(p.x, p.z)) continue;
      const sp = new THREE.Sprite(mist);
      const k = 18 + r() * 16;
      sp.scale.set(k, k * 0.35, 1);
      sp.position.set(p.x, p.y + 1.5, p.z);
      g.add(sp);
    }
  }

  // --- A big full moon over the mountains.
  {
    const moon = new THREE.Mesh(new THREE.CircleGeometry(38, 40), new THREE.MeshBasicMaterial({ color: 0xf4eedc, fog: false }));
    const pos = new THREE.Vector3(-0.35, 0.32, 0.88).normalize().multiplyScalar(1500);
    moon.position.copy(pos);
    moon.lookAt(0, 0, 0);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#fff4d8'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.6, fog: false }));
    halo.scale.set(220, 220, 1); halo.position.copy(pos).multiplyScalar(1.01);
    g.add(halo, moon);
  }

  // --- A sign over the dungeon mouth.
  {
    const pt = track.path('dungeon').portals?.[0];
    if (pt) {
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.4), new THREE.MeshStandardMaterial({ map: signTexture('TEMNIȚA', { bg: '#2a1a14', fg: '#e8c070' }), side: THREE.DoubleSide }));
      sign.position.set(pt.x, pt.y + 10.4, pt.z);
      sign.rotation.y = pt.yaw + Math.PI;
      sign.translateZ(0.8);
      g.add(sign);
    }
  }

  // The start/finish arch, grandstands and trackside dressing come from dressing.js.

  batch.flush(g);
  return g;
}
