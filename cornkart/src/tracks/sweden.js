// "Swedish Winter": out of a snowy town, up through farm country to the ski jump,
// down past a frozen lake and over the mountain pass home. Four ways to cut
// through: the cobbled Gamla stan alley, a boarded-up tunnelbana tunnel under
// the ski hill, the ice road across the lake, and the old mine under the pass.
// Ice spots spin you out; grab a semla for a Semla sugar rush.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { townhouseTexture, faluTexture, signTexture, mooseSignTexture, swedishFlagTexture, glowSprite, rng } from '../textures.js';
import { snowmanGeometry } from '../props.js';
import { softFoliage, foliageMaterial } from '../graphics.js';
import { cornerSide } from '../dressing.js';

const LAKE = { x: -250, z: 30, rx: 45, rz: 118, level: 3.85 };
const TOWN = { minX: -110, maxX: 290, minZ: -70, maxZ: 250 };

export const SWEDEN = {
  id: 'sweden',
  name: 'Swedish Winter',
  short: 'Sweden',
  region: 'Sweden in winter',
  blurb: 'Snowy streets, a ski jump, a frozen lake and a mountain pass. Watch for ice spots, grab a semla for a sugar rush, and find all four ways through: the old-town alley, the ice road and two secret tunnels.',
  seed: 1523,
  roadHalf: 9,
  wallHalf: 16,
  points: [
    [0, 3, 0], [110, 3, 0], [190, 4, 35], [255, 5, 120], [215, 6, 215], [130, 9, 280], [30, 16, 315],
    [-70, 26, 322], [-130, 30, 305], [-175, 14, 285], [-230, 9, 250], [-295, 6, 175], [-325, 4, 70],
    [-320, 4, -45], [-275, 6, -120], [-200, 16, -105], [-130, 20, -100], [-75, 6, -165], [-40, 4, -105], [-75, 3, -45],
  ],
  features: [
    { type: 'pad', s: 520, d: 0 },
    { type: 'pad', s: 745, d: -3 }, { type: 'pad', s: 745, d: 3 },
    { type: 'ramp', s: 782, len: 14, h: 1.8, pit: 24, depth: 6 },        // the ski jump over the frozen ravine
    { type: 'pad', s: 1128, d: 0 },
    { type: 'ramp', s: 1150, len: 12, h: 1.8, pit: 14, depth: 4 },       // frozen creek
    { type: 'pad', s: 1440, d: -4 }, { type: 'pad', s: 1440, d: 4 },
    { type: 'ramp', s: 1466, len: 12, h: 1.4 },                          // over the top of the pass
    { type: 'pad', s: 1690, d: -4 }, { type: 'pad', s: 1690, d: 4 },
    { type: 'ramp', s: 1712, len: 10, h: 1.5 },                          // snowman jump
  ],
  branches: [
    { // cobbled alley through the old town
      id: 'gamla', name: 'Gamla stan', call: 'GAMLA STAN SHORTCUT!', from: 205, to: 395, dFrom: 5, dTo: 5, surface: 'cobble', roadHalf: 6, shoulder: 2,
      points: [[196, 4, 95], [200, 5, 150]],
      features: [{ type: 'pad', s: 35, d: 0 }, { type: 'pad', s: 115, d: 0 }],
    },
    { // old metro tunnel straight under the ski hill, boarded up
      id: 'tunnelbana', name: 'Tunnelbana', call: 'SECRET TUNNELBANA!', from: 560, to: 900, dFrom: 5, dTo: 5, roadHalf: 6.5, secret: true,
      points: [[20, 12, 265], [-80, 11, 255], [-170, 9, 240]],
      tunnel: [0.12, 0.88], wallColor: 0x6f8fb8, portalColor: 0xd9d4c8,
      features: [{ type: 'pad', s: 60, d: 0 }, { type: 'pad', s: 160, d: 0 }, { type: 'pad', s: 260, d: 0 }],
    },
    { // ploughed ice road across the lake, with a hole to jump
      id: 'lake', name: 'Ice road', call: 'ICE ROAD!', from: 960, to: 1330, dFrom: 5, dTo: 5, surface: 'ice', roadHalf: 9, shoulder: 6,
      points: [[-262, 4.2, 135], [-245, 4, 30], [-245, 4, -60]],
      features: [{ type: 'ramp', s: 150, len: 10, h: 1.4, pit: 14, depth: 1.5 }],
    },
    { // abandoned mine under the pass, boarded up
      id: 'gruvan', name: 'The mine', call: 'SECRET MINE!', from: 1325, to: 1600, dFrom: -5, dTo: -5, roadHalf: 6.5, secret: true,
      points: [[-222, 6.5, -150], [-150, 6, -163], [-105, 6, -182]],
      tunnel: [0.14, 0.72], wallColor: 0x6a5a4a, portalColor: 0x7a5534,
      features: [{ type: 'pad', s: 40, d: 0 }, { type: 'pad', s: 110, d: 0 }, { type: 'pad', s: 175, d: 0 }],
    },
  ],
  mounds: [
    { x: -80, z: 290, rx: 170, rz: 80, h: 26 },     // ski hill over the tunnelbana
    { x: -165, z: -150, rx: 120, rz: 50, h: 22 },   // the pass over the mine
    { x: -150, z: -330, rx: 300, rz: 120, h: 60 },  // mountains to the south
    { x: 60, z: 470, rx: 260, rz: 110, h: 45 },     // fells to the north
  ],
  lakes: [LAKE],
  pickups: [ // rows of semlor across the road
    { s: 90 }, { s: 450 }, { s: 700 }, { s: 930 }, { s: 1205 }, { s: 1460 }, { s: 1650 },
    { path: 'gamla', s: 75, spread: [-3, 3] },
    { path: 'tunnelbana', s: 110, spread: [-3, 3] }, { path: 'tunnelbana', s: 220, spread: [-3, 3] },
    { path: 'lake', s: 90, spread: [-5, 0, 5] }, { path: 'lake', s: 260, spread: [-5, 0, 5] },
    { path: 'gruvan', s: 80, spread: [-3, 3] }, { path: 'gruvan', s: 150, spread: [-3, 3] },
  ],
  barrels: [ // rows of snowmen; jump them or thread the gap
    { s: 1730, gapD: 3 }, { s: 1733.5, gapD: 3 },
  ],
  crates: [ // planks over the secret tunnel mouths
    { path: 'tunnelbana', s: 'portal' }, { path: 'gruvan', s: 'portal' },
  ],
  theme: {
    ground: 'snow', pit: 'water', pitWall: 0xc9d6e2, tunnelLamp: 0xffc070,
    pad: { bg: '#3a0f24', fg: '#ff7ab8', emissive: 0xff3d8f },
    pickup: 'semla', pickupText: 'SEMLA SUGAR RUSH!', pickupColor: [1, 0.75, 0.45], pickupGlow: '#ffd08a',
    puddle: 'ice', puddleText: 'Ice spot!',
    barrel: 'snowman', barrelText: 'Snowman!', barrelColor: [0.95, 0.97, 1],
    splashText: 'THROUGH THE ICE!', splashColor: [0.75, 0.9, 1],
    boostColor: [1, 0.55, 0.75], dustColor: [0.94, 0.96, 1],
    radiation: false, mapAccent: '#8fd3ff', mapPit: '#5bb8ff', loseText: 'Slippery out there.',
  },
  weathers: ['snow', 'blizzard', 'frost'],
  sky: { top: 0x3a74c4, horizon: 0xe8dcd0, ground: 0xc9d2dc, cloudDark: 0xaebbcc, cloudLight: 0xfbfcff, sun: 0xffc98a, cover: 0.55 },
  aurora: true, // northern lights on clear nights
  dressing: { // Swedish blue and yellow
    curb: ['#1d5fbf', '#f7c81e'], barrier: { type: 'tecpro', colors: [0x1d5fbf, 0xf7c81e] }, chevron: ['#f7c81e', '#123a78'],
    flags: [0x1d5fbf, 0xf7c81e, 0xffffff, 0xd8202a, 0x1d5fbf], arch: 0x1d5fbf, archTrim: 0xf7c81e, seats: 0xd8202a, roof: 0xd8202a,
    screen: ['#0b1d3c', '#ffffff', '#f7c81e'], blimpColors: ['#1d5fbf', '#f7c81e'],
  },
  light: { sun: 0xffe2bd, sunIntensity: 2.0, hemiSky: 0xd8e6f6, hemiGround: 0x8d96a6, hemiIntensity: 1.0, env: 0.5, exposure: 0.95, sunDir: [-70, 45, 60], envGround: 0xd6dde6 },
  fog: { color: 0xd3dce6, density: 0.0015 },
  buildScenery,
};

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
  if (track.lakeAt(x, z)) return false;
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

// Collects coloured geometry and merges it into one mesh per material.
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

// Gable roof as a triangular prism along x, eaves overhanging, snow on top.
function gableRoof(w, d, h) {
  const shape = new THREE.Shape();
  shape.moveTo(-d / 2 - 0.5, 0); shape.lineTo(d / 2 + 0.5, 0); shape.lineTo(0, h); shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: w + 0.8, bevelEnabled: false });
  g.translate(0, 0, -(w + 0.8) / 2);
  g.rotateY(Math.PI / 2);
  return g;
}

function buildScenery(scene, track) {
  const r = rng(7);
  const g = new THREE.Group();
  scene.add(g);
  const batch = new Batch();
  const vc = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
  const snowMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 });
  const walls = ['#d9a441', '#c2553a', '#e6d8b8', '#7fa0a8', '#d27a3b', '#b8c88a', '#e8c6a8', '#9c3a2e'];
  const facadeMats = walls.map((c, i) => new THREE.MeshStandardMaterial({ map: townhouseTexture(200 + i, c, 3 + (i % 2), 4), roughness: 0.9 }));

  // --- Townhouses: plastered fronts in old-town colours, snowy gable roofs.
  const house = (x, z, yaw, w, h, d, matIdx) => {
    const y = ground(track, x, z) - 0.5;
    const body = new THREE.BoxGeometry(w, h, d);
    const uv = body.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * Math.max(1, Math.round(w / 9))); // repeat the window bays
    facadeMats[matIdx].map.wrapS = THREE.RepeatWrapping;
    batch.add(facadeMats[matIdx], body, at(x, y + h / 2, z, yaw));
    const roof = gableRoof(w, d, 3 + d * 0.25);
    batch.add(snowMat, paint(roof, 0xf2f6fb), at(x, y + h, z, yaw));
    const eave = new THREE.BoxGeometry(w + 0.9, 0.3, d + 1.1);
    batch.add(vc, paint(eave, 0x3b2f2a), at(x, y + h - 0.05, z, yaw));
    if (r() < 0.6) { // chimney
      const ch = new THREE.BoxGeometry(0.9, 2.4, 0.9);
      batch.add(vc, paint(ch, 0x8a3b2a), at(x + Math.cos(yaw) * w * 0.25, y + h + 2.2, z - Math.sin(yaw) * w * 0.25, yaw));
    }
  };
  const inTown = (x, z) => x > TOWN.minX && x < TOWN.maxX && z > TOWN.minZ && z < TOWN.maxZ;
  for (let s = -260; s < 470; s += 13) for (const side of [-1, 1]) {
    const ss = (s + track.length) % track.length;
    const d = side * (track.wallHalf + 8 + r() * 4);
    const p = place(track, ss, d);
    if (!inTown(p.x, p.z) || !clear(track, p.x, p.z, 3)) continue;
    house(p.x, p.z, p.yaw + Math.PI / 2, 11 + r() * 3, 9 + r() * 6, 9, Math.floor(r() * walls.length));
  }
  // Gamla stan: tall narrow houses right up against the alley
  const gamla = track.path('gamla');
  for (let s = 20; s < gamla.length - 20; s += 8) for (const side of [-1, 1]) {
    const p = place(track, s, side * (gamla.wallHalf + 6), gamla);
    if (!clear(track, p.x, p.z, 1)) continue;
    house(p.x, p.z, p.yaw + Math.PI / 2, 7.5, 13 + r() * 6, 9, Math.floor(r() * walls.length));
  }

  // --- Church with a copper spire on the town square.
  {
    const p = place(track, 140, -42);
    const y = p.y - 0.5, yaw = p.yaw;
    const white = 0xf0ece2;
    batch.add(vc, paint(new THREE.BoxGeometry(14, 14, 26), white), at(p.x, y + 7, p.z, yaw));
    batch.add(snowMat, paint(gableRoof(26, 14, 7).rotateY(Math.PI / 2), 0xf2f6fb), at(p.x, y + 14, p.z, yaw));
    const tx = p.x + Math.sin(yaw) * 15, tz = p.z + Math.cos(yaw) * 15;
    batch.add(vc, paint(new THREE.BoxGeometry(7, 26, 7), white), at(tx, y + 13, tz, yaw));
    batch.add(vc, paint(new THREE.CylinderGeometry(0.1, 4.6, 22, 8), 0x4f9a83), at(tx, y + 37, tz, yaw + Math.PI / 8));
    batch.add(vc, paint(new THREE.SphereGeometry(0.8, 8, 6), 0xe0b84a), at(tx, y + 48.5, tz));
    const clock = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), new THREE.MeshStandardMaterial({ color: 0x1d2a3a, emissive: 0xffd27a, emissiveIntensity: 0.25 }));
    clock.position.set(tx - Math.sin(yaw) * 3.55, y + 21, tz - Math.cos(yaw) * 3.55);
    clock.rotation.y = yaw + Math.PI;
    g.add(clock);
  }

  // --- Big Christmas tree on the square, with lights and a star.
  {
    const p = place(track, 60, 34);
    const x = p.x, z = p.z, y = p.y;
    for (const [yy, rr, hh] of [[1.5, 5, 6], [5.5, 4, 5.5], [9, 3, 5], [12.3, 2, 4]]) batch.add(vc, paint(new THREE.ConeGeometry(rr, hh, 10), 0x1f4a2e), at(x, y + yy + hh / 2, z));
    batch.add(vc, paint(new THREE.CylinderGeometry(0.4, 0.5, 2, 8), 0x4a3424), at(x, y + 1, z));
    const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 6, 4), new THREE.MeshStandardMaterial({ color: 0xfff2c0, emissive: 0xffc860, emissiveIntensity: 3 }), 90);
    for (let i = 0; i < 90; i++) {
      const t = i / 90, a = t * Math.PI * 14, rad = 5 * (1 - t) + 0.4;
      bulbs.setMatrixAt(i, at(x + Math.cos(a) * rad, y + 2 + t * 14, z + Math.sin(a) * rad));
    }
    g.add(bulbs);
    const star = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#ffe9a0'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    star.scale.set(4, 4, 1); star.position.set(x, y + 17.2, z);
    g.add(star);
  }

  // --- Street lamps through town and the old-town alley (warm glow at dusk).
  {
    const posts = [], heads = [];
    for (const path of [track.main, gamla]) {
      for (let s = 0; s < path.length; s += 28) for (const side of [-1, 1]) {
        const p = place(track, s, side * (path.wallHalf + 0.8), path);
        if (!inTown(p.x, p.z) || track.inOtherCorridor(p.x, p.z, path, 0)) continue;
        posts.push(at(p.x, p.y + 3, p.z));
        heads.push(at(p.x + Math.sin(p.yaw + Math.PI / 2) * side * 0.9, p.y + 5.9, p.z + Math.cos(p.yaw + Math.PI / 2) * side * 0.9)); // lean over the road
      }
    }
    const post = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.14, 6, 6), new THREE.MeshStandardMaterial({ color: 0x23282c, roughness: 0.6, metalness: 0.5 }), posts.length);
    posts.forEach((m, i) => post.setMatrixAt(i, m));
    const head = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 0.35, 0.6), new THREE.MeshStandardMaterial({ color: 0xfff1c8, emissive: 0xffb35a, emissiveIntensity: 2.4 }), heads.length);
    heads.forEach((m, i) => head.setMatrixAt(i, m));
    g.add(post, head);
  }

  // --- Countryside: falu-red cottages and barns with white trim.
  {
    const falu = new THREE.MeshStandardMaterial({ map: faluTexture(), roughness: 0.95 });
    const spots = [[480, -36], [520, 40], [610, -40], [690, 42], [930, -40], [1020, 46], [1080, -44], [1250, -40], [1380, 40], [1560, 44], [440, 60], [980, 70]];
    for (const [s, d] of spots) {
      const p = place(track, s, d);
      if (!clear(track, p.x, p.z, 4) || inTown(p.x, p.z)) continue;
      const barn = r() < 0.4;
      const w = barn ? 16 : 9, h = barn ? 7 : 4.5, dd = barn ? 10 : 7;
      const y = p.y - 0.4, yaw = p.yaw + Math.PI / 2 + (r() - 0.5) * 0.3;
      batch.add(falu, new THREE.BoxGeometry(w, h, dd), at(p.x, y + h / 2, p.z, yaw));
      batch.add(snowMat, paint(gableRoof(w, dd, barn ? 5 : 3), 0xf2f6fb), at(p.x, y + h, p.z, yaw));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { // white corner boards
        const cx = p.x + Math.cos(yaw) * sx * w / 2 + Math.sin(yaw) * sz * dd / 2, cz = p.z - Math.sin(yaw) * sx * w / 2 + Math.cos(yaw) * sz * dd / 2;
        batch.add(vc, paint(new THREE.BoxGeometry(0.35, h, 0.35), 0xf4f1ea), at(cx, y + h / 2, cz, yaw));
      }
      if (!barn) { // lit windows
        const lit = new THREE.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xffb050, emissiveIntensity: 1.2 });
        for (const o of [-2.2, 2.2]) {
          const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), lit);
          win.position.set(p.x + Math.cos(yaw) * o + Math.sin(yaw) * (dd / 2 + 0.02), y + 2.4, p.z - Math.sin(yaw) * o + Math.cos(yaw) * (dd / 2 + 0.02));
          win.rotation.y = yaw;
          g.add(win);
        }
      }
    }
  }

  // --- A giant Dala horse by the road out of town.
  {
    const p = place(track, 455, 30);
    const red = 0xc8281e, s = 1.4;
    const parts = [
      [new THREE.BoxGeometry(5, 2.4, 1.4), 0, 4.2, 0], // body
      [new THREE.BoxGeometry(1.4, 3, 1.3), -2.4, 6.2, 0], // neck
      [new THREE.BoxGeometry(2.2, 1.2, 1.3), -3.2, 7.4, 0], // head
      [new THREE.BoxGeometry(0.5, 1.2, 1.5), 2.6, 4.6, 0], // tail
    ];
    for (const lx of [-1.8, 1.8]) parts.push([new THREE.BoxGeometry(1.1, 3.2, 1.3), lx, 1.6, 0]);
    const grp = new THREE.Group();
    for (const [geo, x, y, z] of parts) { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: red, roughness: 0.45 })); m.position.set(x, y, z); m.castShadow = true; grp.add(m); }
    const trim = new THREE.MeshStandardMaterial({ color: 0xf0d24a, roughness: 0.5 });
    for (const side of [-1, 1]) { // painted saddle and flourishes
      const sad = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.4), new THREE.MeshStandardMaterial({ color: 0x2a6fd6, roughness: 0.5 }));
      sad.position.set(0.2, 4.6, side * 0.71); sad.rotation.y = side > 0 ? 0 : Math.PI;
      const swirl = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.45, 16), trim);
      swirl.position.set(-1.4, 4.0, side * 0.72); swirl.rotation.y = side > 0 ? 0 : Math.PI;
      grp.add(sad, swirl);
    }
    grp.scale.setScalar(s);
    grp.position.set(p.x, p.y + 1.2, p.z);
    grp.rotation.y = p.yaw;
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(10, 1.4, 4), new THREE.MeshStandardMaterial({ color: 0x9aa2aa, roughness: 1 }));
    plinth.position.set(p.x, p.y + 0.5, p.z); plinth.rotation.y = p.yaw;
    g.add(grp, plinth);
  }

  // --- Ski jump: flags and a start tower on the crest.
  {
    const ramp = track.ramps.find((rr) => rr.path === track.main && rr.s === 782);
    const flagTex = swedishFlagTexture();
    const flagMat = new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: 0.8 });
    for (const side of [-1, 1]) for (const ds of [0, 8]) {
      const p = place(track, ramp.s + ds, side * (track.roadHalf + 2.5));
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 8, 6), new THREE.MeshStandardMaterial({ color: 0xeeeeee }));
      pole.position.set(p.x, p.y + 4, p.z);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), flagMat);
      flag.position.set(p.x + Math.cos(p.yaw) * 1.25 * side, p.y + 7.1, p.z - Math.sin(p.yaw) * 1.25 * side);
      flag.rotation.y = p.yaw + Math.PI / 2;
      g.add(pole, flag);
    }
    const e = track.pose(ramp.s + ramp.len, 0);
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(14, 2.2), new THREE.MeshStandardMaterial({ map: signTexture('HOPPBACKE', { bg: '#1d4fa0', fg: '#ffd21f' }), side: THREE.DoubleSide }));
    banner.position.set(e.x, e.y + 9.5, e.z);
    banner.rotation.y = e.yaw + Math.PI; // readable on the run-up
    for (const side of [-1, 1]) {
      const q = track.pose(ramp.s + ramp.len, side * (track.roadHalf + 1));
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 14, 0.5), new THREE.MeshStandardMaterial({ color: 0x3a3a3a }));
      post.position.set(q.x, e.y + 3.5, q.z);
      g.add(post);
    }
    g.add(banner);
  }

  // --- Frozen lake: ice-fishing huts, a jetty and a snow bank along the ice road.
  {
    const hutCols = [0xc8281e, 0x2a6fd6, 0xf0c22a, 0x3c8a4a];
    for (let i = 0; i < 9; i++) {
      const a = r() * Math.PI * 2, rr = 0.35 + r() * 0.5;
      const x = LAKE.x + Math.cos(a) * LAKE.rx * rr, z = LAKE.z + Math.sin(a) * LAKE.rz * rr;
      const lake = track.path('lake');
      const q = lake.query(x, z, -1, {});
      if (Math.abs(q.d) < lake.wallHalf + 3) continue;
      const yaw = r() * 6;
      batch.add(vc, paint(new THREE.BoxGeometry(2.2, 2, 2.2), hutCols[i % 4]), at(x, LAKE.level + 1, z, yaw));
      batch.add(snowMat, paint(gableRoof(2.2, 2.2, 1), 0xf2f6fb), at(x, LAKE.level + 2, z, yaw));
    }
    const lake = track.path('lake');
    for (let s = 6; s < lake.length - 6; s += 2.5) for (const side of [-1, 1]) {
      const p = lake.pose(s, side * (lake.wallHalf + 1));
      if (lake.pit[p.index] || !track.lakeAt(p.x, p.z)) continue;
      batch.add(snowMat, paint(new THREE.SphereGeometry(1.4, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2), 0xf4f8fd), at(p.x, LAKE.level - 0.1, p.z, p.yaw, 1.2, 0.7 + r() * 0.4, 1.6));
    }
  }

  // --- Tunnelbana: rails along the tunnel floor and the blue T sign at each mouth.
  {
    const tb = track.path('tunnelbana');
    const [s0, s1] = tb.tunnelRange;
    const rail = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.8, roughness: 0.35 });
    for (const d of [-2.2, -0.8, 0.8, 2.2]) {
      const pts = [];
      for (let s = s0 - 6; s <= s1 + 6; s += 3) { const p = tb.pose(s, d); pts.push(new THREE.Vector3(p.x, p.y + 0.06, p.z)); }
      const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 0.08, 4);
      g.add(new THREE.Mesh(tube, rail));
    }
    const tSign = new THREE.MeshStandardMaterial({ map: (() => {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const cg = c.getContext('2d');
      cg.fillStyle = '#1d6fd0'; cg.beginPath(); cg.arc(64, 64, 60, 0, 7); cg.fill();
      cg.strokeStyle = '#fff'; cg.lineWidth = 6; cg.stroke();
      cg.fillStyle = '#fff'; cg.font = 'bold 84px Arial, sans-serif'; cg.textAlign = 'center'; cg.textBaseline = 'middle'; cg.fillText('T', 64, 70);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    })(), emissive: 0xffffff, emissiveIntensity: 0.25, transparent: true, side: THREE.DoubleSide });
    for (const pt of tb.portals || []) {
      const sign = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), tSign);
      sign.position.set(pt.x, pt.y + 11.2, pt.z);
      sign.rotation.y = pt.yaw + (pt.dir < 0 ? Math.PI : 0);
      sign.translateZ(0.8);
      g.add(sign);
    }
  }

  // --- The mine: a falu-red headframe with its winding wheel above the pass.
  {
    const mine = track.path('gruvan');
    const pt = mine.portals?.[0];
    const p = place(track, mine.tunnelRange[0] + 30, 26, mine);
    const x = p.x, z = p.z, y = p.y - 0.5;
    const frame = new THREE.MeshStandardMaterial({ color: 0x8e2a1e, roughness: 0.9 });
    const grp = new THREE.Group();
    grp.position.set(x, y, z); grp.rotation.y = p.yaw;
    const house = new THREE.Mesh(new THREE.BoxGeometry(9, 22, 9), new THREE.MeshStandardMaterial({ map: faluTexture(), roughness: 0.95 }));
    house.position.y = 11; house.castShadow = true;
    const roof = new THREE.Mesh(gableRoof(9, 9, 4), new THREE.MeshStandardMaterial({ color: 0xf2f6fb, roughness: 0.7 }));
    roof.position.y = 22;
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(3, 0.25, 6, 24), frame);
    wheel.position.set(0, 29, 0);
    grp.add(house, roof, wheel);
    for (const lx of [-3, 3]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 9, 0.5), frame);
      leg.position.set(lx * 0.6, 26, 0); leg.rotation.z = lx * 0.04;
      grp.add(leg);
    }
    g.add(grp);
    track.mineWheel = wheel;
    if (pt) { // a lantern and a timber sign over the mine mouth
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.4), new THREE.MeshStandardMaterial({ map: signTexture('GRUVAN', { bg: '#5a3a1e', fg: '#f4e2b0' }), side: THREE.DoubleSide }));
      sign.position.set(pt.x, pt.y + 10.4, pt.z);
      sign.rotation.y = pt.yaw + Math.PI;
      sign.translateZ(0.8);
      g.add(sign);
    }
  }

  // --- Trees: snow-laden spruces and bare birches across the countryside.
  {
    const spruce = (() => {
      const trunk = new THREE.CylinderGeometry(0.1, 0.22, 0.4, 6); trunk.translate(0, 0.2, 0);
      const green = [], snow = [];
      for (const [y, w, h] of [[0.12, 1, 0.42], [0.36, 0.8, 0.38], [0.58, 0.58, 0.34], [0.76, 0.36, 0.26]]) {
        const c = new THREE.ConeGeometry(w * 0.5, h, 12, 2); c.translate(0, y + h / 2, 0); green.push(c.toNonIndexed());
        const sc = new THREE.ConeGeometry(w * 0.4, h * 0.5, 12); sc.translate(0, y + h * 0.78, 0); snow.push(sc.toNonIndexed());
      }
      return { trunk, crown: softFoliage(mergeGeometries(green), { blend: 0.45, dark: 0.45 }), snow: softFoliage(mergeGeometries(snow), { blend: 0.5, dark: 0.75 }) };
    })();
    const birch = (() => {
      const parts = [];
      const t = new THREE.CylinderGeometry(0.06, 0.12, 1, 6); t.translate(0, 0.5, 0); parts.push(t.toNonIndexed());
      for (let i = 0; i < 6; i++) {
        const b = new THREE.CylinderGeometry(0.015, 0.035, 0.45, 4); b.translate(0, 0.22, 0);
        b.rotateZ(0.6 + (i % 3) * 0.2); b.rotateY(i * 1.1); b.translate(0, 0.5 + i * 0.07, 0);
        parts.push(b.toNonIndexed());
      }
      return mergeGeometries(parts);
    })();
    const max = 1500;
    const bark = new THREE.MeshStandardMaterial({ color: 0x4e4036, roughness: 1 });
    const needles = foliageMaterial({ amp: 0.015 });
    const snowTop = foliageMaterial({ amp: 0.015, color: 0xf4f8fd, roughness: 0.6 });
    const birchMat = new THREE.MeshStandardMaterial({ color: 0xe4e1da, roughness: 0.9 });
    const tr = new THREE.InstancedMesh(spruce.trunk, bark, max), cr = new THREE.InstancedMesh(spruce.crown, needles, max), sn = new THREE.InstancedMesh(spruce.snow, snowTop, max);
    const bi = new THREE.InstancedMesh(birch, birchMat, 500);
    let n = 0, nb = 0;
    const col = new THREE.Color();
    const B = track.bounds;
    for (let tries = 0; tries < 30000 && n < max; tries++) {
      const x = B.minX + 100 + r() * (B.maxX - B.minX - 200), z = B.minZ + 100 + r() * (B.maxZ - B.minZ - 200);
      if (inTown(x, z) && r() < 0.9) continue;
      if (((x - LAKE.x) / (LAKE.rx + 12)) ** 2 + ((z - LAKE.z) / (LAKE.rz + 12)) ** 2 < 1) continue;
      if (!clear(track, x, z, 4)) continue;
      const y = ground(track, x, z);
      if (r() < 0.22 && nb < 500) {
        const h = 9 + r() * 5;
        bi.setMatrixAt(nb++, at(x, y - 0.2, z, r() * 6, h * 0.8, h, h * 0.8));
        continue;
      }
      const h = 9 + r() * 10, w = h * (0.34 + r() * 0.1);
      const m = at(x, y - 0.3, z, r() * 6.28, w, h, w);
      tr.setMatrixAt(n, m); cr.setMatrixAt(n, m); sn.setMatrixAt(n, m);
      cr.setColorAt(n, col.setHSL(0.37 + r() * 0.06, 0.45, 0.2 + r() * 0.07));
      n++;
    }
    for (const m of [tr, cr, sn]) { m.count = n; m.castShadow = true; m.receiveShadow = true; g.add(m); }
    bi.count = nb; bi.castShadow = true; g.add(bi);
  }

  // --- Roadside: snow banks from the plough, red-and-white snow poles, moose signs.
  {
    const bankGeo = new THREE.SphereGeometry(1, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2);
    const banks = new THREE.InstancedMesh(bankGeo, new THREE.MeshStandardMaterial({ color: 0xf2f6fb, roughness: 0.75 }), 3200);
    const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.2, 5); poleGeo.translate(0, 1.1, 0);
    const poles = new THREE.InstancedMesh(poleGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }), 800);
    const tip = new THREE.CylinderGeometry(0.055, 0.055, 0.5, 5); tip.translate(0, 1.95, 0);
    const tips = new THREE.InstancedMesh(tip, new THREE.MeshStandardMaterial({ color: 0xe0471c, emissive: 0x801000, emissiveIntensity: 0.4 }), 800);
    let nb = 0, np = 0;
    for (const path of track.paths) {
      if (path.id === 'lake') continue; // the ice road has its own banks
      for (let s = 0; s < path.length; s += 2.6) {
        if (path.tunnel[path.at(s)]) continue;
        for (const side of [-1, 1]) {
          const p = path.pose(s, side * (path.wallHalf + 0.8));
          if (path.pit[p.index] || track.inOtherCorridor(p.x, p.z, path, 1) || track.lakeAt(p.x, p.z)) continue;
          if (cornerSide(path, s) === side) continue; // padded barriers go round the corners
          if (nb < 3200) banks.setMatrixAt(nb++, at(p.x, ground(track, p.x, p.z) - 0.15, p.z, p.yaw, 1.1 + r() * 0.3, 0.8 + r() * 0.5, 1.8));
          if (Math.round(s / 2.6) % 6 === 0 && np < 800) {
            const pp = path.pose(s, side * (path.roadHalf + 1.2));
            const pm = at(pp.x, pp.y, pp.z);
            poles.setMatrixAt(np, pm); tips.setMatrixAt(np, pm); np++;
          }
        }
      }
    }
    banks.count = nb; poles.count = np; tips.count = np;
    banks.receiveShadow = true;
    banks.userData.soft = true; // trackside dressing may stand in the snow
    g.add(banks, poles, tips);

    const signMat = new THREE.MeshStandardMaterial({ map: mooseSignTexture(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
    for (let s = 420; s < 1680; s += 110) {
      const side = (Math.floor(s / 110) % 2) ? 1 : -1;
      const p = place(track, s, side * (track.wallHalf + 2));
      if (!clear(track, p.x, p.z, 1)) continue;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 6), new THREE.MeshStandardMaterial({ color: 0x8a9096, metalness: 0.5 }));
      post.position.set(p.x, p.y + 1.2, p.z);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), signMat);
      sign.position.set(p.x, p.y + 2.7, p.z);
      sign.rotation.y = p.yaw + Math.PI;
      g.add(post, sign);
    }
    // a few snowmen watching the race
    const sm = new THREE.InstancedMesh(snowmanGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }), 40);
    let ns = 0;
    for (let i = 0; i < 80 && ns < 40; i++) {
      const s = r() * track.length, side = r() < 0.5 ? -1 : 1;
      const p = place(track, s, side * (track.wallHalf + 4 + r() * 10));
      if (!clear(track, p.x, p.z, 2)) continue;
      sm.setMatrixAt(ns++, at(p.x, p.y - 0.1, p.z, p.yaw + Math.PI + (side * 0.8)));
    }
    sm.count = ns; sm.castShadow = true;
    g.add(sm);
  }

  // The start/finish arch, grandstands and trackside dressing come from dressing.js.

  batch.flush(g);
  return g;
}
