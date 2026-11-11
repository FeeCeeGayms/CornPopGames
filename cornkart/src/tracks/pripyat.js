// "Pripyat Run": a lap through the abandoned town, up onto the Ridge, off the
// Ridge Drop into the Red Forest, across the sludge pit, past the reactor arch
// and the cooling pond. Two ways to cheat: a gravel shortcut through the
// amusement park and a secret tunnel through the ridge.
import * as THREE from 'three';
import { apartmentTexture, signTexture, radiationSignTexture, barrelTexture, glowSprite, rng } from '../textures.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { softFoliage, foliageMaterial, windSway } from '../graphics.js';
import { cornerSide } from '../dressing.js';

const RED_FOREST = { x: -200, z: -250, r: 170 };

export const PRIPYAT = {
  id: 'pripyat',
  name: 'Pripyat Run',
  short: 'Pripyat',
  region: 'Chernobyl Exclusion Zone',
  weathers: ['ash', 'storm'],
  blurb: 'Abandoned town, a 20 m Ridge Drop, the Red Forest and a sludge pit. Find the park shortcut and the secret tunnel.',
  seed: 1986,
  roadHalf: 9,
  wallHalf: 16,
  // [x, height, z] control points of the closed main loop (metres)
  points: [
    [0, 4, 0], [140, 4, 0], [250, 5, -30], [320, 7, -110], [335, 10, -220], [275, 16, -310],
    [165, 26, -355], [60, 34, -350], [-10, 34, -340], [-46, 18, -332], [-90, 12, -320],
    [-130, 10, -308], [-190, 8, -285], [-265, 9, -220], [-310, 12, -110], [-320, 12, 0],
    [-280, 8, 100], [-200, 4, 160], [-110, 6, 130], [-70, 4, 50],
  ],
  features: [
    { type: 'ramp', s: 515, len: 12, h: 1.2 },                         // kicker on the climb
    { type: 'pad', s: 836, d: -3 }, { type: 'pad', s: 836, d: 3 },
    { type: 'ramp', s: 866, len: 14, h: 1.4, pit: 22, depth: 5 },       // the Ridge Drop
    { type: 'pad', s: 1180, d: 0 },
    { type: 'ramp', s: 1212, len: 14, h: 2.2, pit: 20 },                // sludge pit jump
    { type: 'pad', s: 1628, d: -4 }, { type: 'pad', s: 1628, d: 4 },
    { type: 'ramp', s: 1650, len: 12, h: 1.6 },                         // barrel jump
  ],
  branches: [
    { // gravel cut through the amusement park, under the bumper-car roof
      id: 'park', name: 'Park shortcut', from: 228, to: 486, dFrom: -5, dTo: -5, surface: 'gravel', roadHalf: 6.5,
      points: [[258, 6, -95], [282, 7, -160], [312, 9, -205]],
      features: [{ type: 'ramp', s: 120, len: 10, h: 1.4 }],
    },
    { // boarded-up service tunnel straight through the ridge
      id: 'tunnel', name: 'Secret tunnel', from: 598, to: 1002, dFrom: -5, dTo: -5, roadHalf: 6.5, secret: true,
      points: [[205, 15, -284], [100, 14, -278], [0, 13, -282], [-62, 11, -296]],
      tunnel: [0.12, 0.86],
    },
  ],
  mounds: [{ x: 70, z: -300, rx: 230, rz: 75, h: 22 }],
  pickups: [ // rows of boost pickups across the road
    { s: 110 }, { s: 450 }, { s: 760 }, { s: 1000 }, { s: 1150 }, { s: 1350 }, { s: 1560 }, { s: 1780 },
    { path: 'park', s: 30, spread: [-3, 3] }, { path: 'tunnel', s: 200, spread: [-3, 3] },
  ],
  barrels: [ // rows of radioactive barrels; jump them or thread the gap
    { s: 1669, gapD: 3 }, { s: 1672.5, gapD: 3 },
  ],
  crates: [ // breakable planks hiding the tunnel mouth
    { path: 'tunnel', s: 'portal' },
  ],
  fog: { color: 0xb4beb6, density: 0.0023 },
  // broken cloud over the zone, with sun breaking through
  sky: { top: 0x3d6ea8, horizon: 0xd6ddd2, ground: 0x8a917c, cloudDark: 0x98a1aa, cloudLight: 0xf7f7f1, sun: 0xfff0d0, cover: 0.6 },
  light: { sunIntensity: 2.5, hemiSky: 0xd6e2e6, hemiIntensity: 1.1, exposure: 1.05 },
  dressing: { // hazard yellow and radioactive green
    curb: ['#f2c418', '#1c1c1c'], barrier: { type: 'tires', colors: [0xf2c418, 0x1f1f1f] },
    flags: [0x7dff3a, 0xf2c418, 0x1c1c1c, 0xffffff, 0x2f8a3a], arch: 0x35b52a, archTrim: 0xf2c418, seats: 0xf2c418, roof: 0x2f8a3a,
    screen: ['#0d2410', '#ffffff', '#7dff3a'], blimpColors: ['#2f8a3a', '#f2c418'],
    motes: { color: '#9dff5a', count: 500, size: 0.35, height: 5 },
  },
  groundTint(x, z) {
    const d = Math.hypot(x - RED_FOREST.x, z - RED_FOREST.z);
    if (d < RED_FOREST.r) {
      const c = new THREE.Color(0.55, 0.26, 0.14);
      c.amount = 0.75 * (1 - d / RED_FOREST.r) ** 0.5;
      return c;
    }
    return null;
  },
  buildScenery,
};

function ground(track, x, z) { return track.terrainAt(x, z); }

function place(track, s, d) {
  const p = track.pose(s, d);
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

function buildScenery(scene, track) {
  const r = rng(42);
  const g = new THREE.Group();
  scene.add(g);
  const concrete = new THREE.MeshStandardMaterial({ color: 0x8d8a80, roughness: 1 });
  const rust = new THREE.MeshStandardMaterial({ color: 0x7a4a2a, roughness: 0.9, metalness: 0.3 });
  const yellowPaint = new THREE.MeshStandardMaterial({ color: 0xd8b12a, roughness: 0.7, metalness: 0.2 });

  // --- Apartment blocks in town (start straight and the final approach).
  const aptTex = [0, 1, 2, 3].map((i) => apartmentTexture(100 + i, 12 + i, 8));
  const aptMats = aptTex.map((t) => new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }));
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x55534d, roughness: 1 });
  const blocks = [];
  for (let s = -60; s < 330; s += 42) for (const side of [-1, 1]) blocks.push([s + r() * 10, side * (34 + r() * 18)]);
  for (let s = 1730; s < 1892; s += 45) for (const side of [-1, 1]) blocks.push([s, side * (36 + r() * 16)]);
  for (const [s, d] of blocks) {
    const p = place(track, s, d);
    if (!clear(track, p.x, p.z, 8)) continue;
    const h = 22 + r() * 22, w = 26 + r() * 14, dpt = 12;
    const geo = new THREE.BoxGeometry(w, h, dpt);
    const mats = [aptMats[0], aptMats[1], roofMat, roofMat, aptMats[2], aptMats[3]];
    const m = new THREE.Mesh(geo, mats);
    m.position.set(p.x, p.y + h / 2 - 1, p.z);
    m.rotation.y = p.yaw + Math.PI / 2;
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }

  // --- Ferris wheel + bumper cars: the amusement park that never opened.
  {
    const x = 205, z = -150, y = ground(track, x, z);
    const fw = new THREE.Group();
    fw.position.set(x, y, z);
    fw.rotation.y = 0.6;
    const wheel = new THREE.Group();
    wheel.position.y = 30;
    const R = 24;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.45, 8, 64), yellowPaint);
    const ring2 = ring.clone(); ring2.position.z = 2; ring.position.z = -2;
    wheel.add(ring, ring2);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, R, 6), rust);
      spoke.position.set(Math.cos(a) * R / 2, Math.sin(a) * R / 2, 0);
      spoke.rotation.z = a - Math.PI / 2;
      wheel.add(spoke);
    }
    const gondolas = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const gon = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 2.2, 10), yellowPaint);
      gon.position.set(Math.cos(a) * R, Math.sin(a) * R - 1.6, 0);
      gon.castShadow = true;
      wheel.add(gon);
      gondolas.push(gon);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 5, 12), rust);
    hub.rotation.x = Math.PI / 2;
    wheel.add(hub);
    fw.add(wheel);
    for (const side of [-1, 1]) for (const lean of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 34, 8), rust);
      leg.position.set(lean * 8, 15, side * 3.5);
      leg.rotation.z = lean * 0.27;
      fw.add(leg);
    }
    g.add(fw);
    track.ferris = { wheel, gondolas };

    const park = track.path('park');
    const bp = park.pose(park.length * 0.62);
    const pav = new THREE.Group();
    pav.position.set(bp.x, bp.y, bp.z);
    pav.rotation.y = bp.yaw;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(30, 0.8, 26), new THREE.MeshStandardMaterial({ color: 0x6b7c5a, roughness: 1 }));
    roof.position.y = 6.5;
    roof.castShadow = true;
    pav.add(roof);
    for (let i = -1; i <= 1; i += 2) for (let j = -1; j <= 1; j += 2) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6.5, 0.8), concrete);
      pillar.position.set(i * 13, 3.25, j * 12);
      pav.add(pillar);
    }
    const carColors = [0x2b6cb0, 0xc53030, 0xd69e2e, 0x38a169];
    for (let i = 0; i < 9; i++) { // bumper cars shoved to the sides
      const car = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1, 1.8), new THREE.MeshStandardMaterial({ color: carColors[i % 4], roughness: 0.6 }));
      const side = i % 2 ? 1 : -1;
      car.position.set(side * (9 + r() * 3), 0.5, -10 + r() * 20);
      car.rotation.y = r() * 6;
      car.castShadow = true;
      pav.add(car);
    }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(12, 2), new THREE.MeshStandardMaterial({ map: signTexture('АВТОДРОМ', { bg: '#c33', fg: '#ffe9a8' }), side: THREE.DoubleSide }));
    sign.position.set(0, 7.9, -13.1);
    pav.add(sign);
    g.add(pav);
  }

  // --- Town entrance sign.
  {
    const p = place(track, 548, -22);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(18, 3.2, 0.6), [concrete, concrete, concrete, concrete,
      new THREE.MeshStandardMaterial({ map: signTexture('ПРИПЯТЬ', { bg: '#cfc9b6', fg: '#3c3b38' }) }), concrete]);
    sign.position.set(p.x, p.y + 4, p.z);
    sign.rotation.y = p.yaw - Math.PI / 2;
    g.add(sign);
    for (const o of [-6, 6]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3, 0.8), concrete);
      post.position.set(p.x + Math.sin(p.yaw) * o, p.y + 1.5, p.z + Math.cos(p.yaw) * o);
      g.add(post);
    }
  }

  // --- Duga radar on the horizon beyond Hill 25.
  {
    const duga = new THREE.Group();
    const x0 = -40, z0 = -620, y0 = ground(track, x0, z0) - 4;
    const mastGeo = new THREE.BoxGeometry(1.2, 130, 1.2);
    const barGeo = new THREE.BoxGeometry(320, 0.6, 0.6);
    const steel = new THREE.MeshStandardMaterial({ color: 0x5a5f5c, roughness: 0.8, metalness: 0.5 });
    const masts = new THREE.InstancedMesh(mastGeo, steel, 34);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 34; i++) { m4.makeTranslation(-160 + i * (320 / 33), 65, 0); masts.setMatrixAt(i, m4); }
    duga.add(masts);
    const bars = new THREE.InstancedMesh(barGeo, steel, 26);
    for (let i = 0; i < 26; i++) { m4.makeTranslation(0, 8 + i * 4.8, (i % 2) * 2); bars.setMatrixAt(i, m4); }
    duga.add(bars);
    duga.position.set(x0, y0, z0);
    duga.rotation.y = 0.08;
    g.add(duga);
  }

  // --- Reactor 4 under its arch, the vent stack, cooling towers, cooling pond.
  {
    const x = -500, z = 60, y = ground(track, x, z) - 2;
    const arch = new THREE.Mesh(new THREE.CylinderGeometry(70, 70, 110, 48, 1, true, -Math.PI / 2, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xc9ced3, roughness: 0.35, metalness: 0.7, side: THREE.DoubleSide }));
    arch.rotation.z = Math.PI / 2;
    arch.rotation.y = 0.3;
    arch.scale.set(1, 1, 0.92);
    arch.position.set(x, y, z);
    g.add(arch);
    const ribMat = new THREE.MeshStandardMaterial({ color: 0x9aa1a8, metalness: 0.6, roughness: 0.4 });
    for (let i = -2; i <= 2; i++) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(70.5, 0.8, 6, 48, Math.PI), ribMat);
      rib.position.set(x + Math.cos(0.3) * i * 26, y, z - Math.sin(0.3) * i * 26);
      rib.rotation.y = 0.3 + Math.PI / 2;
      g.add(rib);
    }
    const hall = new THREE.Mesh(new THREE.BoxGeometry(160, 28, 50), new THREE.MeshStandardMaterial({ color: 0xb7b2a6, roughness: 1 }));
    hall.position.set(x + 70, y + 14, z - 70); // its far end stops short of the road
    hall.rotation.y = 0.3;
    g.add(hall);
    // red and white vent stack
    const stackGrp = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(4 - i * 0.2, 4.2 - i * 0.2, 12, 16), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xeeeeee : 0xc0262b, roughness: 0.8 }));
      seg.position.y = 6 + i * 12;
      stackGrp.add(seg);
    }
    stackGrp.position.set(x + 60, y, z - 110);
    g.add(stackGrp);
    // unfinished cooling towers
    const towerPts = [];
    for (let i = 0; i <= 20; i++) { const t = i / 20; towerPts.push(new THREE.Vector2(30 - Math.sin(t * Math.PI) * 9 - t * 6, t * 75)); }
    const towerGeo = new THREE.LatheGeometry(towerPts, 40);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x9c978c, roughness: 1, side: THREE.DoubleSide });
    for (const [tx, tz] of [[-430, 300], [-520, 240]]) {
      const t = new THREE.Mesh(towerGeo, towerMat);
      t.position.set(tx, ground(track, tx, tz) - 2, tz);
      g.add(t);
    }
    // cooling pond
    const pond = new THREE.Mesh(new THREE.CircleGeometry(95, 40), new THREE.MeshStandardMaterial({ color: 0x3f5a4a, roughness: 0.15, metalness: 0.4 }));
    pond.rotation.x = -Math.PI / 2;
    pond.scale.set(1.4, 0.7, 1);
    pond.position.set(-200, ground(track, -200, 260) + 0.6, 260);
    g.add(pond);
  }

  // --- Trees: layered pines (rust-red in the Red Forest), pale dead birches.
  {
    const pineGeo = (() => {
      const parts = [];
      const trunk = new THREE.CylinderGeometry(0.12, 0.25, 0.5, 6); trunk.translate(0, 0.25, 0);
      for (const [y, w, h] of [[0.16, 1, 0.42], [0.36, 0.84, 0.38], [0.54, 0.64, 0.34], [0.72, 0.4, 0.3]]) {
        const c = new THREE.ConeGeometry(w * 0.5, h, 12, 2); c.translate(0, y + h / 2, 0); parts.push(c);
      }
      const crown = softFoliage(mergeGeometries(parts.map((g) => g.toNonIndexed())), { blend: 0.45, dark: 0.45 });
      return { trunk, crown };
    })();
    const birchGeo = (() => {
      const trunk = new THREE.CylinderGeometry(0.08, 0.14, 1, 6); trunk.translate(0, 0.5, 0);
      const blobs = [];
      for (const [x, y, z, s2] of [[0, 0.75, 0, 0.32], [0.18, 0.62, 0.1, 0.24], [-0.16, 0.66, -0.08, 0.26], [0.05, 0.9, -0.1, 0.22]]) {
        const b2 = new THREE.IcosahedronGeometry(s2, 2); b2.translate(x, y, z); blobs.push(b2);
      }
      return { trunk, crown: softFoliage(mergeGeometries(blobs.map((g) => (g.index ? g.toNonIndexed() : g)))) };
    })();
    const barkMat = new THREE.MeshStandardMaterial({ color: 0x5e5246, roughness: 1 });
    const birchBark = new THREE.MeshStandardMaterial({ color: 0xd9d6cc, roughness: 0.9 });
    const leafMat = foliageMaterial();
    const max = 1800;
    const sets = {
      pine: [new THREE.InstancedMesh(pineGeo.trunk, barkMat, max), new THREE.InstancedMesh(pineGeo.crown, leafMat, max)],
      birch: [new THREE.InstancedMesh(birchGeo.trunk, birchBark, max), new THREE.InstancedMesh(birchGeo.crown, leafMat, max)],
    };
    const counts = { pine: 0, birch: 0 };
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
    const col = new THREE.Color();
    const B = track.bounds;
    for (let tries = 0; tries < 40000 && counts.pine + counts.birch < max * 2 - 2; tries++) {
      const x = B.minX + 120 + r() * (B.maxX - B.minX - 240), z = B.minZ + 120 + r() * (B.maxZ - B.minZ - 240);
      const rf = Math.hypot(x - RED_FOREST.x, z - RED_FOREST.z) < RED_FOREST.r;
      if (!rf && r() < 0.45) continue;
      if (x > -120 && x < 330 && z > -80 && z < 80) continue; // town
      if (Math.hypot(x + 200, (z - 260) / 0.7) < 140) continue; // pond
      if (Math.hypot(x + 500, z - 60) < 120) continue; // reactor site
      if (Math.hypot(x - 205, z + 150) < 35) continue; // ferris wheel
      if (!clear(track, x, z, 4)) continue;
      const kind = rf || r() < 0.55 ? 'pine' : 'birch';
      if (counts[kind] >= max) continue;
      const y = ground(track, x, z);
      const h = kind === 'pine' ? 10 + r() * 9 : 8 + r() * 6;
      const w = kind === 'pine' ? h * (0.32 + r() * 0.12) : h * (0.5 + r() * 0.2);
      q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, r() * 6.28);
      ps.set(x, y - 0.3, z);
      sc.set(w, h, w);
      m4.compose(ps, q, sc);
      const [tr, cr] = sets[kind];
      tr.setMatrixAt(counts[kind], m4);
      cr.setMatrixAt(counts[kind], m4);
      if (rf) col.setHSL(0.02 + r() * 0.05, 0.72, 0.36 + r() * 0.12);
      else if (kind === 'pine') col.setHSL(0.27 + r() * 0.07, 0.5, 0.27 + r() * 0.08);
      else col.setHSL(0.17 + r() * 0.07, 0.55, 0.4 + r() * 0.1);
      cr.setColorAt(counts[kind], col);
      counts[kind]++;
    }
    for (const k of Object.keys(sets)) for (const m of sets[k]) { m.count = counts[k]; m.castShadow = true; m.receiveShadow = true; g.add(m); }
  }

  // --- Grass and weed tufts along the roads (crossed alpha cards).
  if (track.quality !== 'low') {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
    const cg = cv.getContext('2d');
    for (let i = 0; i < 40; i++) {
      const x = 4 + r() * 56, l = 20 + r() * 40, bend = (r() - 0.5) * 16;
      cg.strokeStyle = `hsl(${68 + r() * 34}, 52%, ${34 + r() * 26}%)`; cg.lineWidth = 2;
      cg.beginPath(); cg.moveTo(x, 64); cg.quadraticCurveTo(x + bend * 0.3, 64 - l * 0.6, x + bend, 64 - l); cg.stroke();
    }
    const gt = new THREE.CanvasTexture(cv); gt.colorSpace = THREE.SRGBColorSpace;
    const p1 = new THREE.PlaneGeometry(1, 1); p1.translate(0, 0.5, 0);
    const p2 = p1.clone().rotateY(Math.PI / 2);
    const tuft = mergeGeometries([p1, p2]);
    const tm = windSway(new THREE.MeshStandardMaterial({ map: gt, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 1 }), 0.12);
    const N = 6000;
    const tufts = new THREE.InstancedMesh(tuft, tm, N);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
    let n = 0;
    for (let tries = 0; tries < N * 3 && n < N; tries++) {
      const path = track.paths[r() < 0.8 ? 0 : 1 + Math.floor(r() * (track.paths.length - 1))];
      const s2 = r() * path.length, side = r() < 0.5 ? -1 : 1;
      const d = side * (path.roadHalf + 0.6 + r() * (path.wallHalf - path.roadHalf + 14));
      const p = path.pose(s2, d);
      if (path.pit[p.index] || path.tunnel[p.index]) continue;
      if (track.paths.some((o) => (o === track.main || o.inBox(p.x, p.z)) && (({ d, beyond }) => !beyond && Math.abs(d) < o.roadHalf + 0.6)(o.query(p.x, p.z, -1, {})))) continue; // not on any road
      const y = ground(track, p.x, p.z);
      const sz = 0.6 + r() * 1.1;
      q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, r() * 6.28);
      ps.set(p.x, y - 0.05, p.z); sc.set(sz * 1.4, sz, sz * 1.4);
      m4.compose(ps, q, sc);
      tufts.setMatrixAt(n++, m4);
    }
    tufts.count = n;
    g.add(tufts);
  }

  // --- Corridor edge: concrete barriers with radiation signs, scattered junk.
  {
    const barrierGeo = new THREE.BoxGeometry(0.6, 0.9, 2.6);
    const inst = new THREE.InstancedMesh(barrierGeo, new THREE.MeshStandardMaterial({ color: 0xa29d90, roughness: 1 }), 3000);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1), ps = new THREE.Vector3();
    let n = 0;
    for (const path of track.paths) {
      for (let s = 0; s < path.length && n < 2998; s += 3.2) {
        if (path.tunnel[path.at(s)]) continue;
        for (const side of [-1, 1]) {
          const p = path.pose(s, side * (path.wallHalf + 0.6));
          if (path.pit[p.index] || track.inOtherCorridor(p.x, p.z, path, 1)) continue;
          if (cornerSide(path, s) === side) continue; // padded barriers go round the corners
          q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, p.yaw);
          ps.set(p.x, ground(track, p.x, p.z) + 0.45, p.z);
          m4.compose(ps, q, sc);
          inst.setMatrixAt(n++, m4);
        }
      }
    }
    inst.count = n;
    inst.receiveShadow = true;
    g.add(inst);

    const signMat = new THREE.MeshStandardMaterial({ map: radiationSignTexture(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
    for (let s = 40; s < track.length; s += 70) {
      const side = (Math.floor(s / 70) % 2) ? 1 : -1;
      const p = place(track, s, side * (track.wallHalf + 2));
      if (!clear(track, p.x, p.z, 1)) continue;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 6), rust);
      post.position.set(p.x, p.y + 1.2, p.z);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), signMat);
      sign.position.set(p.x, p.y + 2.6, p.z);
      sign.rotation.y = p.yaw + Math.PI;
      g.add(post, sign);
    }

    // rusting Soviet cars
    const bodyGeo = new THREE.BoxGeometry(1.8, 0.8, 4.2), cabGeo = new THREE.BoxGeometry(1.6, 0.6, 2);
    for (let i = 0; i < 26; i++) {
      const s = r() * track.length, side = r() < 0.5 ? -1 : 1;
      const p = place(track, s, side * (track.wallHalf + 5 + r() * 15));
      if (!clear(track, p.x, p.z, 3)) continue;
      const car = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(r(), 0.25, 0.3), roughness: 0.9, metalness: 0.3 });
      const b = new THREE.Mesh(bodyGeo, mat); b.position.y = 0.6;
      const c = new THREE.Mesh(cabGeo, mat); c.position.set(0, 1.25, -0.2);
      car.add(b, c);
      car.position.set(p.x, p.y, p.z);
      car.rotation.set((r() - 0.5) * 0.15, r() * 6, (r() - 0.5) * 0.15);
      car.traverse((o) => { o.castShadow = true; });
      g.add(car);
    }

    // glowing barrel clusters off the road
    const barrelMat = new THREE.MeshStandardMaterial({ map: barrelTexture(), roughness: 0.6, metalness: 0.3 });
    const barrelGeo = new THREE.CylinderGeometry(0.45, 0.45, 1.2, 14);
    const glowMat = new THREE.SpriteMaterial({ map: glowSprite('#7dff3a'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.6 });
    const barrels = new THREE.InstancedMesh(barrelGeo, barrelMat, 30 * 7);
    barrels.castShadow = true;
    const bm = new THREE.Matrix4(), be = new THREE.Euler(), bq = new THREE.Quaternion(), bp = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    let nb = 0;
    for (let i = 0; i < 30; i++) {
      const s = r() * track.length, side = r() < 0.5 ? -1 : 1;
      const p = place(track, s, side * (track.wallHalf + 3 + r() * 8));
      if (!clear(track, p.x, p.z, 2)) continue;
      for (let k = 0; k < 3 + r() * 4; k++) {
        const tipped = r() < 0.3;
        bp.set(p.x + (r() - 0.5) * 4, p.y + (tipped ? 0.45 : 0.6), p.z + (r() - 0.5) * 4);
        be.set(0, r() * 6, tipped ? Math.PI / 2 : 0, 'YXZ');
        bm.compose(bp, bq.setFromEuler(be), one);
        barrels.setMatrixAt(nb++, bm);
      }
      const glow = new THREE.Sprite(glowMat);
      glow.scale.set(7, 3, 1);
      glow.position.set(p.x, p.y + 0.3, p.z);
      g.add(glow);
    }
    barrels.count = nb;
    g.add(barrels);
  }

  // The start/finish arch, grandstands and trackside dressing come from dressing.js.

  return g;
}
