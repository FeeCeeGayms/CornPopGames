// "Sydney": a sunny lap of the harbour city. Off the grid on George Street,
// over the crests of Bridge Street and down Macquarie to Circular Quay, then into
// the old Wynyard subway, which climbs inside Observatory Hill and spits you out
// onto the Harbour Bridge. Off the far end, a leap over Lavender Bay at Luna Park,
// under the bridge's own approach along the Kirribilli shore, and back beneath the
// harbour through the Harbour Tunnel, launching out into the Domain.
// High and low roads: the Cahill Expressway runs over the top of the quay, and
// the BridgeClimb goes right up and over the arch. Other ways round: the Opera
// House forecourt, and a secret way in through Luna Park's grinning mouth.
// Oil slicks spin you out; grab a meat pie for a boost.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { signTexture, glowSprite, officeTexture, townhouseTexture, rng } from '../textures.js';
import { softFoliage, foliageMaterial } from '../graphics.js';

// Laid out at real-world-ish proportions, then shrunk so a lap is a good length.
const K = 0.82;
const sc = (pts) => pts.map(([x, y, z]) => [x * K, y, z * K]);
const ell = (e) => ({ ...e, x: e.x * K, z: e.z * K, rx: e.rx * K, rz: e.rz * K });

const POINTS = sc([
  [-40, 10, 130], [-41, 12, 95], [-40, 9, 65], [-25, 8, 45], [20, 10, 38], [70, 12, 38], [110, 10, 42], [130, 8, 20], // 0-7 George St, Bridge St
  [132, 6, -15], [126, 4, -42], [100, 3, -55], [60, 3, -55], [10, 3, -55], [-40, 3, -52], [-75, 4, -38], [-95, 6, -10], // 8-15 Macquarie, the quay, the Rocks
  [-110, 9, 25], [-150, 14, 45], [-190, 20, 25], [-205, 26, -25], [-200, 32, -80], [-195, 38, -140], [-195, 40, -205], // 16-22 the subway climbs to the bridge
  [-195, 40, -345], [-195, 40, -485], [-195, 37, -535], [-198, 30, -590], [-215, 22, -640], [-260, 14, -675], [-320, 8, -670], // 23-29 over the harbour
  [-355, 6, -625], [-340, 5, -575], [-290, 5, -548], [-200, 5, -545], [-100, 7, -552], [0, 8, -556], [100, 7, -556], // 30-36 Luna Park, Kirribilli
  [190, 5, -545], [240, 0, -505], [258, -14, -440], [262, -22, -340], [262, -22, -240], [258, -16, -150], [255, -4, -70], // 37-43 the Harbour Tunnel
  [253, 6, 0], [252, 8, 70], [245, 10, 140], [215, 12, 185], [150, 14, 200], [70, 15, 200], [0, 13, 198], [-30, 11, 188], // 44-51 the Domain, Park St
]);

// Distance along the loop at control point i (plus a few metres).
const curve = new THREE.CatmullRomCurve3(POINTS.map((p) => new THREE.Vector3(...p)), true, 'centripetal');
const lens = curve.getLengths(POINTS.length * 40);
const S = (i, add = 0) => lens[Math.round(i * 40)] + add;

// The bridge arch: its top chord at fraction u of the main span, crown 60 m up.
const ARCH = { e: 28, crown: 60, d: 14.5 };
const archY = (u) => ARCH.e + (ARCH.crown - ARCH.e) * 4 * u * (1 - u);
const SPAN = [POINTS[22][2], POINTS[24][2]]; // z of the two pylons
const climbPts = [];
for (let u = 0.15; u < 0.86; u += 0.05) climbPts.push([POINTS[22][0] + ARCH.d, archY(u) + 0.5, SPAN[0] + (SPAN[1] - SPAN[0]) * u]);

export const SYDNEY = {
  id: 'sydney',
  name: 'Sydney Harbour',
  short: 'Sydney',
  region: 'Sydney, Australia',
  blurb: 'City streets, a subway that climbs right up onto the Harbour Bridge, a leap over Lavender Bay and back under the harbour. Take the high road over Circular Quay or climb the bridge arch itself, sneak round the Opera House, and find the way in through Luna Park.',
  seed: 6120,
  roadHalf: 9,
  wallHalf: 16,
  points: POINTS,
  tunnels: [[S(15, 6), S(20, -16)], [S(37, 2), S(44, 4)]], // the Wynyard subway, the Harbour Tunnel
  wallColor: 0xd8cfae, portalColor: 0xc9a36a, // cream tiles and sandstone
  features: [
    { type: 'ramp', s: S(1, -9), len: 10, h: 2.2 },                       // George St crest
    { type: 'pad', s: S(2, 8), d: -3 }, { type: 'pad', s: S(2, 8), d: 3 },
    { type: 'ramp', s: S(5, -10), len: 10, h: 2.2 },                      // Bridge St crest
    { type: 'ramp', s: S(8, -6), len: 10, h: 2.6 },                       // down Macquarie
    { type: 'bridge', s: S(10, -4), len: S(13) - S(10) + 4 },             // the seawall at Circular Quay
    { type: 'pad', s: S(11, 10), d: 4 }, { type: 'pad', s: S(12, 10), d: 0 },
    { type: 'pad', s: S(17), d: 0 }, { type: 'pad', s: S(18, 10), d: 0 },   // in the subway
    { type: 'bridge', s: S(20, -14), len: S(22) - S(20) + 14, viaduct: true },            // southern approach
    { type: 'bridge', s: S(22), len: S(24) - S(22), viaduct: true, pillars: false, parapet: false }, // the main span
    { type: 'bridge', s: S(24), len: S(26, 12) - S(24), viaduct: true },                 // northern approach
    { type: 'pad', s: S(23, -30), d: -5 }, { type: 'pad', s: S(23, -30), d: 0 },
    { type: 'pad', s: S(28, 14), d: -5 }, { type: 'pad', s: S(28, 14), d: 0 }, { type: 'pad', s: S(28, 14), d: 5 },
    { type: 'ramp', s: S(28, 30), len: 13, h: 3, pit: 20, depth: 5 },     // over Lavender Bay
    { type: 'ramp', s: S(34, 10), len: 10, h: 2.2 },                      // Kirribilli
    { type: 'pad', s: S(36), d: -4 }, { type: 'pad', s: S(36), d: 4 },
    { type: 'pad', s: S(39, 20), d: 0 }, { type: 'pad', s: S(40, 30), d: -3 }, { type: 'pad', s: S(41, 30), d: 3 }, // under the harbour
    { type: 'pad', s: S(44, 2), d: -4 }, { type: 'pad', s: S(44, 2), d: 4 },
    { type: 'ramp', s: S(44, 12), len: 12, h: 3 },                        // launch out of the Harbour Tunnel
    { type: 'ramp', s: S(49, -10), len: 10, h: 2.4 },                     // Park St crest
  ],
  branches: [
    { // the Opera House forecourt: up the steps, round the sails and off the end
      id: 'opera', name: 'Opera House forecourt', call: 'OPERA HOUSE!', from: S(7, 12), to: S(10, 8), dFrom: 5, dTo: 5, surface: 'cobble', roadHalf: 6.5, shoulder: 3,
      points: sc([[150, 7, -40], [160, 9, -85], [178, 9, -130], [168, 9, -172], [130, 9, -182], [103, 8.5, -142], [97, 6.5, -100]]),
      features: [
        { type: 'bridge', s: 30, len: 280 },
        { type: 'pad', s: 40, d: 0 }, { type: 'pad', s: 120, d: 0 }, { type: 'pad', s: 190, d: 0 },
        { type: 'ramp', s: 262, len: 9, h: 2.4 },
      ],
    },
    { // the high road: the Cahill Expressway, right over the top of the quay
      id: 'cahill', name: 'Cahill Expressway', call: 'HIGH ROAD!', from: S(11, 4), to: S(14, 6), dFrom: -5, dTo: -5, roadHalf: 5.5, shoulder: 2,
      points: sc([[38, 9, -36], [5, 15, -29], [-22, 16, -29], [-46, 15, -31]]), // beside the quay road, not over it
      features: [
        { type: 'bridge', s: 22, len: 70, viaduct: true },
        { type: 'pad', s: 34, d: 0 }, { type: 'pad', s: 62, d: 0 },
        { type: 'ramp', s: 84, len: 8, h: 2 },
      ],
    },
    { // the BridgeClimb: straight up the arch and down the other side
      id: 'climb', name: 'BridgeClimb', call: 'BRIDGE CLIMB!', from: S(22, 10), to: S(24, -10), dFrom: 6, dTo: 6, roadHalf: 4.5, shoulder: 1,
      points: climbPts,
      features: [
        { type: 'bridge', s: 0, len: 9999, viaduct: true, pillars: false, parapet: false },
        { type: 'pad', s: 70, d: 0 }, { type: 'pad', s: 110, d: 0 }, { type: 'pad', s: 150, d: 0 },
      ],
    },
    { // Luna Park: in through the giant grinning mouth, round the rides
      id: 'luna', name: 'Luna Park', call: 'LUNA PARK!', from: S(27, 22), to: S(32, 4), dFrom: -5, dTo: -5, roadHalf: 6.5, secret: true,
      points: sc([[-262, 13, -642], [-287, 9, -615], [-283, 6, -585]]),
      tunnel: [0.12, 0.42], wallColor: 0x6a3a8a, portalColor: 0xffd23a,
      features: [{ type: 'pad', s: 30, d: 0 }, { type: 'pad', s: 60, d: 0 }, { type: 'pad', s: 90, d: 0 }],
    },
  ],
  mounds: [
    ell({ x: -160, z: 0, rx: 95, rz: 95, h: 38 }),     // Observatory Hill over the subway
    ell({ x: -60, z: -820, rx: 520, rz: 160, h: 40 }), // the North Shore
    ell({ x: 60, z: 420, rx: 520, rz: 160, h: 26 }),   // Surry Hills way to the south
  ],
  sea: { level: 0, bed: -9 },
  waters: [
    ell({ x: 0, z: -345, rx: 1200, rz: 140 }),         // Port Jackson, the harbour
    ell({ x: 40, z: -128, rx: 52, rz: 62 }),           // Sydney Cove, off Circular Quay
    ell({ x: 335, z: -150, rx: 55, rz: 65 }),          // Farm Cove
    ell({ x: -470, z: -560, rx: 70, rz: 80 }),         // Lavender Bay
    ell({ x: -380, z: -170, rx: 120, rz: 60 }),        // Darling Harbour way
  ],
  pickups: [ // rows of meat pies across the road
    { s: S(0, 20) }, { s: S(6) }, { s: S(12, -10) }, { s: S(17, 20) }, { s: S(23, 10) }, { s: S(27) }, { s: S(33) }, { s: S(36, 30) },
    { s: S(40) }, { s: S(46) }, { s: S(49, 20) },
    { path: 'opera', s: 160, spread: [-3, 3] }, { path: 'cahill', s: 48, spread: [-2.5, 2.5] },
    { path: 'climb', s: 130, spread: [-2, 2] }, { path: 'luna', s: 75, spread: [-3, 3] },
  ],
  barrels: [ // rows of traffic cones; jump them or thread the gap
    { s: S(3, 14), gapD: 3 }, { s: S(3, 17.5), gapD: 3 }, { s: S(46, 10), gapD: -3 }, { s: S(46, 13.5), gapD: -3 },
  ],
  crates: [{ path: 'luna', s: 'portal' }],
  theme: {
    pit: 'bay', pitWall: 0xb89a6a, tunnelLamp: 0xfff0c0,
    pad: { bg: '#0b2a1a', fg: '#ffcd00', emissive: 0xffb800 },
    pickup: 'pie', pickupText: 'MEAT PIE! BEAUTY!', pickupColor: [1, 0.78, 0.4], pickupGlow: '#ffc870', ringColor: 0x00b04f,
    puddle: 'oil', puddleText: 'Oil slick!',
    barrel: 'cone', barrelText: 'Road works!', barrelColor: [1, 0.45, 0.1],
    splashText: 'SPLASH! INTO THE HARBOUR', splashColor: [0.7, 0.9, 1],
    boostColor: [1, 0.85, 0.2], dustColor: [0.8, 0.7, 0.55],
    radiation: false, mapAccent: '#ffcd00', mapPit: '#3fb8ff', loseText: 'No worries, have another go.',
  },
  weathers: ['clear', 'clear', 'rain'],
  sky: { top: 0x2f78d8, horizon: 0xdbeaf4, ground: 0x9aa4a8, cloudDark: 0xc8d2dc, cloudLight: 0xffffff, sun: 0xffe2a8, cover: 0.22 },
  light: { sun: 0xfff2dc, sunIntensity: 2.9, hemiSky: 0xcfe6fa, hemiGround: 0x8a8070, hemiIntensity: 0.9, env: 0.6, exposure: 1.02, sunDir: [-60, 70, 50], envGround: 0x9a9488 },
  fog: { color: 0xd8e6f0, density: 0.0011 },
  terrainMargin: 460,
  viewSlope: 0.12, // keep banks low beside open road, so the track is always in view
  terrainReach: 14, // the land shapes itself to roads this far away, so there are no seams
  viaductColor: 0xc4beb0,
  dressing: { // green and gold
    curb: ['#00843d', '#ffcd00'], barrier: { type: 'tecpro', colors: [0x00843d, 0xffcd00] },
    flags: [0x00843d, 0xffcd00, 0x1f4fb8, 0xffffff, 0xe3342b], arch: 0x00843d, archTrim: 0xffcd00, seats: 0x1f4fb8,
    screen: ['#06281a', '#ffffff', '#ffcd00'], blimpColors: ['#00843d', '#ffcd00'],
    ads: [
      ['CORNKART', '#ffd21a', '#00843d'], ['FAIR DINKUM PIES', '#ffffff', '#b8121b'], ['HUSK TYRES', '#ffd21a', '#161616'],
      ['HARBOUR FERRIES', '#ffffff', '#1d6a3a'], ['SURF\'S UP', '#161616', '#ffcd00'], ['COB & SONS', '#ffffff', '#2c8a3c'],
      ['FLAT WHITE CO', '#3a2410', '#f4e6cc'], ['G\'DAY RACING', '#ffffff', '#1f4fb8'],
    ],
  },
  groundTint,
  buildScenery,
};

const CBD = (x, z) => x > -70 * K && x < 240 * K && z > 25 * K && z < 260 * K;   // the city blocks
const ROCKS = (x, z) => x > -230 * K && x < -40 * K && z > -150 * K && z < 60 * K;
const NORTH = (x, z) => z < -500 * K;
const GARDEN = (x, z) => x > 140 * K && x < 300 * K && z > -60 * K && z < 30 * K;
const tmpC = new THREE.Color();
function groundTint(x, z, dist) {
  if (dist < 18) return null;
  if (CBD(x, z)) { tmpC.setRGB(0.56, 0.55, 0.52); tmpC.amount = 0.8; return tmpC; }
  if (ROCKS(x, z)) { tmpC.setRGB(0.62, 0.52, 0.38); tmpC.amount = 0.55; return tmpC; } // sandstone
  return null;
}

// --- helpers -----------------------------------------------------------------

function ground(track, x, z) { return track.terrainAt(x, z); }

function place(track, s, d, path = track.main) {
  const p = path.pose(s, d);
  return { x: p.x, z: p.z, y: ground(track, p.x, p.z), yaw: p.yaw };
}

// Is (x, z) dry land clear of every road corridor (main loop and shortcuts)?
function clear(track, x, z, margin = 6) {
  for (const p of track.paths) {
    if (!p.inBox(x, z) && p !== track.main) continue;
    const q = p.query(x, z, -1, {});
    if (!q.beyond && Math.abs(q.d) < p.wallHalf + margin) return false;
  }
  return ground(track, x, z) > 1.2;
}

// Is a w-by-d footprint centred on (x, z) and turned by yaw dry land clear of every road?
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
const UP = new THREE.Vector3(0, 1, 0);
// A w-by-h box beam running from a to b (both THREE.Vector3), kept upright.
function beam(a, b, w, h) {
  const len = a.distanceTo(b);
  const geo = new THREE.BoxGeometry(w, h, len);
  const m = new THREE.Matrix4().lookAt(a, b, Math.abs(b.y - a.y) > len * 0.99 ? new THREE.Vector3(1, 0, 0) : UP);
  m.setPosition((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return geo.applyMatrix4(m);
}

function canvasTex(w, h, draw, repeat = false) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

// Sandstone terrace fronts for the Rocks: warm stone, sash windows, iron lace balconies.
function sandstoneTexture(seed, stone = '#d9b27a') {
  const r = rng(seed);
  return canvasTex(256, 256, (g) => {
    g.fillStyle = stone; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 10) for (let x = (y / 10) % 2 * 14; x < 256; x += 28) { // coursed blocks
      g.fillStyle = `rgba(${r() < 0.5 ? '90,60,30' : '255,235,200'},${0.05 + r() * 0.08})`; g.fillRect(x, y, 27, 9);
    }
    for (let f = 0; f < 3; f++) for (let k = 0; k < 3; k++) {
      const x = 22 + k * 80, y = 22 + f * 80;
      g.fillStyle = '#f2ead8'; g.fillRect(x - 4, y - 4, 44, 54);
      g.fillStyle = r() < 0.3 ? '#ffd27a' : '#2f3a48'; g.fillRect(x, y, 36, 46);
      g.fillStyle = '#f2ead8'; g.fillRect(x, y + 21, 36, 3);
    }
    g.strokeStyle = '#1e2a24'; g.lineWidth = 2; // iron lace balcony on the first floor
    g.strokeRect(10, 150, 236, 22);
    for (let x = 14; x < 246; x += 8) { g.beginPath(); g.arc(x, 161, 3, 0, 7); g.stroke(); }
  });
}

// The Opera House tiles: off-white chevrons, glossy in the sun.
function sailTexture() {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = '#f4f1e8'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = 'rgba(200,190,170,0.5)'; g.lineWidth = 2;
    for (let i = -256; i < 512; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 128, 128); g.lineTo(i, 256); g.stroke(); }
  }, true);
}

// The Australian flag, roughly: Southern Cross and the Commonwealth Star on blue.
function ausFlagTexture() {
  return canvasTex(256, 128, (g) => {
    g.fillStyle = '#012169'; g.fillRect(0, 0, 256, 128);
    g.strokeStyle = '#ffffff'; g.lineWidth = 12; g.beginPath(); g.moveTo(0, 0); g.lineTo(128, 64); g.moveTo(128, 0); g.lineTo(0, 64); g.stroke();
    g.strokeStyle = '#c8102e'; g.lineWidth = 5; g.stroke();
    g.fillStyle = '#ffffff'; g.fillRect(52, 0, 24, 64); g.fillRect(0, 22, 128, 20);
    g.fillStyle = '#c8102e'; g.fillRect(57, 0, 14, 64); g.fillRect(0, 26, 128, 12);
    const star = (x, y, r, n = 7) => { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); };
    g.fillStyle = '#ffffff';
    star(64, 96, 18); star(192, 104, 9); star(160, 64, 9); star(192, 20, 9); star(222, 52, 9); star(206, 72, 5, 5);
  });
}

// Luna Park's grinning face, with its mouth cut out as the way in.
function lunaFaceTexture() {
  return canvasTex(512, 512, (g) => {
    g.fillStyle = '#ffd23a'; g.beginPath(); g.arc(256, 256, 250, 0, 7); g.fill();
    g.fillStyle = '#ff8a1a'; g.beginPath(); g.arc(256, 256, 250, 0, 7); g.arc(256, 256, 232, 0, 7, true); g.fill();
    for (const x of [170, 342]) { // eyes
      g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x, 160, 46, 58, 0, 0, 7); g.fill();
      g.fillStyle = '#1a4fd8'; g.beginPath(); g.arc(x + 6, 172, 26, 0, 7); g.fill();
      g.fillStyle = '#111'; g.beginPath(); g.arc(x + 8, 174, 13, 0, 7); g.fill();
      g.strokeStyle = '#3a1a10'; g.lineWidth = 10; g.beginPath(); g.arc(x, 128, 60, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
    }
    g.fillStyle = '#e8402a'; g.beginPath(); g.ellipse(256, 236, 22, 30, 0, 0, 7); g.fill(); // nose
    g.fillStyle = '#d4102a'; g.beginPath(); g.ellipse(256, 420, 196, 110, 0, Math.PI, 0); g.lineTo(452, 512); g.lineTo(60, 512); g.fill(); // lips
    g.fillStyle = '#ffffff'; for (let i = 0; i < 8; i++) g.fillRect(118 + i * 35, 318, 30, 26); // teeth
    g.globalCompositeOperation = 'destination-out'; // the open mouth: the tunnel shows through
    g.beginPath(); g.ellipse(256, 512, 160, 170, 0, Math.PI, 0); g.fill();
  });
}

// The Harbour Bridge: grey steel arch, granite pylons, hangers, railings and the BridgeClimb rib.
function buildBridge(g, batch, track, r) {
  const main = track.main;
  const sA = S(22), sB = S(24), deck = 40;
  const steelMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.45 });
  const STEEL = 0x76808a, DARK = 0x5a636c;
  const P = (u, d, y) => { const p = main.pose(sA + (sB - sA) * u, d); return new THREE.Vector3(p.x, y, p.z); };
  const botY = (u) => 8 + 42 * 4 * u * (1 - u);
  const N = 44;
  for (const side of [-1, 1]) {
    const d = side * ARCH.d;
    for (let i = 0; i < N; i++) {
      const u0 = i / N, u1 = (i + 1) / N;
      batch.add(steelMat, paint(beam(P(u0, d, archY(u0) - 1.1), P(u1, d, archY(u1) - 1.1), 9, 2.2), STEEL)); // top chord
      batch.add(steelMat, paint(beam(P(u0, d, botY(u0)), P(u1, d, botY(u1)), 6, 2.6), STEEL));               // bottom chord
      for (const o of [-3.6, 3.6]) { // truss panels on both faces of the rib
        if (o * side < 0 && botY(u0) < deck + 8) continue; // but not the face beside the deck, so the road stays in view
        batch.add(steelMat, paint(beam(P(u0, d + o, botY(u0)), P(u0, d + o, archY(u0) - 2), 0.8, 0.8), DARK));
        batch.add(steelMat, paint(beam(P(i % 2 ? u0 : u1, d + o, botY(i % 2 ? u0 : u1)), P(i % 2 ? u1 : u0, d + o, archY(i % 2 ? u1 : u0) - 2), 0.6, 0.6), DARK));
      }
    }
  }
  for (let i = 1; i < N; i += 2) { // cross bracing between the ribs, high over the deck
    const u = i / N;
    if (botY(u) < deck + 9) continue;
    batch.add(steelMat, paint(beam(P(u, -ARCH.d, botY(u) + 1), P(u, ARCH.d, botY(u) + 1), 1.2, 1.6), DARK));
    batch.add(steelMat, paint(beam(P(u, -ARCH.d, archY(u) - 2), P(u, ARCH.d, archY(u) - 2), 0.9, 1.2), DARK));
  }
  // hangers from the bottom chord down to the deck
  const hangers = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, y1 = botY(u);
    if (y1 < deck + 1.5) continue;
    for (const side of [-1, 1]) { const p = P(u, side * 12.2, 0); hangers.push(at(p.x, (deck + y1) / 2, p.z, 0, 1, y1 - deck, 1)); }
  }
  const hm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 1, 0.9), new THREE.MeshStandardMaterial({ color: DARK, roughness: 0.6, metalness: 0.4 }), hangers.length);
  hangers.forEach((m, i) => hm.setMatrixAt(i, m));
  hm.castShadow = true;
  g.add(hm);
  // the deck's steel sides and railings (gaps where the BridgeClimb leaves and rejoins)
  const climb = track.path('climb');
  for (let s = sA - 6; s < sB + 6; s += 6) {
    const p = main.pose(s + 3);
    for (const side of [-1, 1]) {
      const q = main.pose(s + 3, side * (track.roadHalf + 0.9));
      batch.add(steelMat, paint(new THREE.BoxGeometry(0.6, 3.4, 6.05), DARK), at(q.x, deck - 1.9, q.z, p.yaw));
      const gap = side > 0 && ((s > climb.from - 4 && s < climb.from + 26) || (s > climb.to - 26 && s < climb.to + 4));
      if (gap) continue;
      batch.add(steelMat, paint(new THREE.BoxGeometry(0.15, 0.15, 6.05), 0xc9ced2), at(q.x, deck + 1.1, q.z, p.yaw));
      for (const o of [-1.5, 1.5]) {
        const pp = main.pose(s + 3 + o, side * (track.roadHalf + 0.9));
        batch.add(steelMat, paint(new THREE.BoxGeometry(0.12, 1.1, 0.12), 0xc9ced2), at(pp.x, deck + 0.55, pp.z, p.yaw));
      }
    }
  }
  // handrails along the climb, like the real walkway
  for (let s = 4; s < climb.length - 4; s += 3) {
    const p = climb.pose(s);
    for (const side of [-1, 1]) {
      const q = climb.pose(s, side * (climb.roadHalf + 0.3));
      batch.add(steelMat, paint(new THREE.BoxGeometry(0.1, 1.2, 0.1), 0xd8dde2), at(q.x, p.y + 0.6, q.z, p.yaw));
      batch.add(steelMat, paint(new THREE.BoxGeometry(0.08, 0.08, 3.05), 0xd8dde2), at(q.x, p.y + 1.15, q.z, p.yaw));
    }
  }
  // granite pylons at each end, with lookout windows
  const granite = new THREE.MeshStandardMaterial({ map: sandstoneTexture(71, '#c9b48e'), roughness: 0.9 });
  granite.map.wrapS = granite.map.wrapT = THREE.RepeatWrapping;
  const plain = new THREE.MeshStandardMaterial({ color: 0xc9b48e, roughness: 0.95 });
  for (const s of [sA - 11, sB + 11]) for (const side of [-1, 1]) {
    const c = main.pose(s, side * 17);
    const base = Math.min(ground(track, c.x, c.z), 0) - 4;
    const grp = new THREE.Group();
    grp.position.set(c.x, 0, c.z); grp.rotation.y = c.yaw;
    const add = (geo, mat, y) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; m.castShadow = m.receiveShadow = true; grp.add(m); };
    add(new THREE.BoxGeometry(14, 72 - base, 18), plain, (72 + base) / 2);
    add(new THREE.BoxGeometry(12.4, 18, 16.4), granite, 60);
    add(new THREE.BoxGeometry(15, 2, 19), plain, 72);
    add(new THREE.BoxGeometry(11, 4, 15), plain, 75);
    add(new THREE.BoxGeometry(15.4, 1.4, 19.4), plain, deck + 2);
    g.add(grp);
  }
  // Australian flags flying from the top of the arch
  const flagMat = new THREE.MeshStandardMaterial({ map: ausFlagTexture(), side: THREE.DoubleSide, roughness: 0.8 });
  for (const side of [-1, 1]) {
    const p = P(0.5, side * (ARCH.d + 3.4), 0);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 9, 6), new THREE.MeshStandardMaterial({ color: 0xeeeeee }));
    pole.position.set(p.x, ARCH.crown + 4.5, p.z);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.5, 8, 1), flagMat);
    flag.position.set(p.x, ARCH.crown + 7.6, p.z - 2.6);
    flag.rotation.y = Math.PI / 2;
    g.add(pole, flag);
    track.extraUpdates.push((t) => { // flutter
      const pos = flag.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) { const x = pos.getX(i) + 2.5; pos.setZ(i, Math.sin(t * 6 + x * 1.4 + side) * 0.18 * x); }
      pos.needsUpdate = true;
    });
  }
}

function buildScenery(scene, track) {
  const r = rng(61);
  const g = new THREE.Group();
  scene.add(g);
  track.extraUpdates ??= [];
  const batch = new Batch();
  const vc = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
  const main = track.main;

  buildBridge(g, batch, track, r);
  buildOperaHouse(g, batch, track);
  buildCity(g, batch, track, r);
  buildQuay(g, batch, track, r);
  buildLunaPark(g, batch, track, r);
  buildSuburbs(g, batch, track, r);
  buildTrees(g, track, r);
  buildSigns(g, track);
  batch.flush(g);
  return g;
}

// The Opera House: a granite podium at Bennelong Point, crowned by white sails.
function buildOperaHouse(g, batch, track) {
  const op = track.path('opera');
  // the podium fills the loop the forecourt road runs round
  let cx = 0, cz = 0, n = 0;
  for (let s = op.length * 0.3; s < op.length * 0.85; s += 6) { const q = op.pose(s); cx += q.x; cz += q.z; n++; }
  cx /= n; cz /= n;
  let top = Infinity; // just under the forecourt road wherever the podium meets it
  for (let s = op.length * 0.3; s < op.length * 0.86; s += 3) top = Math.min(top, op.pose(s).y - 0.35);
  const podium = new THREE.MeshStandardMaterial({ map: sandstoneTexture(91, '#c8a77e'), roughness: 0.9 });
  podium.map.wrapS = podium.map.wrapT = THREE.RepeatWrapping; podium.map.repeat.set(6, 1);
  const shape = new THREE.Shape();
  for (let s = op.length * 0.38, k = 0; s < op.length * 0.8; s += 4, k++) { // inside the forecourt loop, never over the road
    const q = op.pose(s, -(op.roadHalf - 0.5));
    const dx = q.x - cx, dz = q.z - cz, l = Math.hypot(dx, dz), e = 1 + (op.roadHalf + 2.5) / l * 0; // eslint-ish no-op
    k ? shape.lineTo(q.x, -q.z) : shape.moveTo(q.x, -q.z);
    void e;
  }
  shape.closePath();
  const pg = new THREE.ExtrudeGeometry(shape, { depth: top + 6, bevelEnabled: false });
  pg.rotateX(-Math.PI / 2); pg.translate(0, -6, 0);
  const pm = new THREE.Mesh(pg, podium);
  pm.receiveShadow = pm.castShadow = true;
  g.add(pm);
  // the sails: lunes cut from one sphere, leaning out over the harbour, two halls of
  // three and a little pair facing back to the city
  const sailMat = new THREE.MeshStandardMaterial({ map: sailTexture(), color: 0xf2eee4, roughness: 0.55, metalness: 0, side: THREE.DoubleSide, envMapIntensity: 0.7 });
  sailMat.map.repeat.set(3, 3);
  const glass = new THREE.MeshStandardMaterial({ color: 0x8aa2ae, roughness: 0.15, metalness: 0.4, side: THREE.DoubleSide, transparent: true, opacity: 0.55 });
  const ref = track.main.pose(S(9));
  const yaw = Math.atan2(cx - ref.x, cz - ref.z) + 0.25; // the front faces the water, away from the city
  const fx = Math.sin(yaw), fz = Math.cos(yaw), px = Math.cos(yaw), pz = -Math.sin(yaw);
  const shell = (R, x, z, y, face, tilt = 0.5, w = 0.62) => {
    const geo = new THREE.SphereGeometry(R, 22, 14, -Math.PI / 2 - w, w * 2, 0, Math.PI / 2); // pole to equator, bulging back
    const inner = new THREE.Mesh(geo, sailMat);
    inner.rotation.x = tilt; // lean the tip forward
    inner.position.y = -R * Math.sin(tilt) * 0.35;
    inner.castShadow = true;
    const o = new THREE.Group();
    o.add(inner);
    o.position.set(x, y, z); o.rotation.y = face;
    g.add(o);
    const pane = new THREE.Mesh(new THREE.CircleGeometry(R * 0.42, 18, 0, Math.PI), glass); // glass filling the mouth
    pane.position.set(0, -R * 0.05, R * 0.18);
    pane.rotation.x = -0.25;
    o.add(pane);
  };
  for (const [side, k] of [[-1, 1], [1, 0.86]]) {
    const ox = cx + px * side * 11, oz = cz + pz * side * 11;
    [[6, 23], [-4, 18.5], [-12, 14]].forEach(([fwd, R]) => shell(R * k, ox + fx * fwd * k, oz + fz * fwd * k, top, yaw));
  }
  shell(9, cx - fx * 22, cz - fz * 22, top, yaw + Math.PI, 0.45);
  shell(7, cx - fx * 27, cz - fz * 27, top, yaw + Math.PI, 0.45);
}
const main_pose_x = (track) => track.main.pose(S(9)).x;
const main_pose_z = (track) => track.main.pose(S(9)).z;

// The CBD: glass towers on the blocks between the streets, Sydney Tower over them all.
function buildCity(g, batch, track, r) {
  const tints = [[110, 150, 175], [150, 150, 140], [90, 130, 150], [160, 140, 110], [120, 160, 150]];
  const mats = tints.map((t, i) => { const m = new THREE.MeshStandardMaterial({ map: officeTexture(600 + i, t), roughness: 0.35, metalness: 0.35 }); m.map.repeat.set(2, 4); return m; });
  let n = 0;
  for (let tries = 0; tries < 3000 && n < 90; tries++) {
    const x = (-75 + r() * 330) * K, z = (20 + r() * 260) * K;
    if (!CBD(x, z) && r() < 0.8) continue;
    const w = 14 + r() * 14, dd = 14 + r() * 12, yaw = r() < 0.7 ? 0 : 0.12;
    // the taller the tower, the further back from the road it has to stand
    let h = 24 + Math.pow(r(), 1.6) * 110;
    if (!clearBox(track, x, z, yaw, w, dd, 8 + h * 0.3)) { h = 14 + r() * 8; if (!clearBox(track, x, z, yaw, w, dd, 10)) continue; }
    const y = ground(track, x, z);
    batch.add(mats[n % mats.length], new THREE.BoxGeometry(w, h, dd), at(x, y + h / 2 - 2, z, yaw));
    if (h > 70 && r() < 0.6) batch.add(mats[(n + 1) % mats.length], new THREE.BoxGeometry(w * 0.6, 10 + r() * 16, dd * 0.6), at(x, y + h + 4, z, yaw)); // crown
    n++;
  }
  // Sydney Tower: a slim shaft, the golden turret and a spire
  for (const [ux, uz] of [[55, 125], [40, 140], [75, 110], [25, 120]]) {
    const x = ux * K, z = uz * K;
    if (!clearBox(track, x, z, 0, 22, 22, 16)) continue;
    const y = ground(track, x, z);
    const gold = new THREE.MeshStandardMaterial({ color: 0xd9a531, roughness: 0.25, metalness: 0.8 });
    const shaft = new THREE.MeshStandardMaterial({ color: 0xd8dade, roughness: 0.4, metalness: 0.3 });
    batch.add(shaft, new THREE.CylinderGeometry(2.6, 3.2, 150, 16), at(x, y + 75, z));
    batch.add(gold, new THREE.CylinderGeometry(9, 8, 14, 24), at(x, y + 150, z));
    batch.add(shaft, new THREE.CylinderGeometry(9.6, 9.6, 1.2, 24), at(x, y + 157.5, z));
    batch.add(gold, new THREE.CylinderGeometry(8, 9, 6, 24), at(x, y + 161, z));
    batch.add(shaft, new THREE.CylinderGeometry(0.6, 1.4, 28, 8), at(x, y + 178, z));
    batch.add(new THREE.MeshStandardMaterial({ color: 0x9aa0a6 }), new THREE.BoxGeometry(22, 14, 22), at(x, y + 5, z)); // the podium shops
    const lamp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#ff3020'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    lamp.scale.set(5, 5, 1); lamp.position.set(x, y + 193, z);
    g.add(lamp);
    break;
  }
}

// Circular Quay and the Rocks: ferry wharves, Customs House, sandstone terraces,
// and the green-and-gold ferries crossing the harbour.
function buildQuay(g, batch, track, r) {
  const main = track.main;
  const vc = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
  // wharves reaching out into Sydney Cove from the quay
  for (let i = 0; i < 4; i++) {
    const q = main.pose(S(11, -20 + i * 26), track.roadHalf + 1.5);
    const fx = -q.tz, fz = q.tx; // out to the right, over the water
    batch.add(vc, paint(new THREE.BoxGeometry(7, 1.6, 30), 0x8a7a64), at(q.x + fx * 15, 1.2, q.z + fz * 15, q.yaw + Math.PI / 2));
    batch.add(vc, paint(new THREE.BoxGeometry(6, 4, 9), 0xe9e2cc), at(q.x + fx * 26, 3.5, q.z + fz * 26, q.yaw + Math.PI / 2));
    batch.add(vc, paint(new THREE.BoxGeometry(6.6, 0.6, 9.6), 0x1d6a3a), at(q.x + fx * 26, 5.8, q.z + fz * 26, q.yaw + Math.PI / 2));
    if (i % 2 === 0) addFerry(g, q.x + fx * 26 + q.tx * 9, q.z + fz * 26 + q.tz * 9, q.yaw + Math.PI / 2);
  }
  // Customs House, across the road from the wharves
  {
    const p = place(track, S(12, -18), -(track.roadHalf + 40));
    const stone = new THREE.MeshStandardMaterial({ map: sandstoneTexture(41, '#e2c48e'), roughness: 0.9 });
    stone.map.wrapS = THREE.RepeatWrapping; stone.map.repeat.set(3, 1);
    if (clearBox(track, p.x, p.z, p.yaw, 40, 16, 8)) {
      batch.add(stone, new THREE.BoxGeometry(40, 16, 16), at(p.x, p.y + 6, p.z, p.yaw));
      batch.add(vc, paint(new THREE.BoxGeometry(41, 1.2, 17), 0xb8925e), at(p.x, p.y + 14.4, p.z, p.yaw));
      const clock = new THREE.Mesh(new THREE.CircleGeometry(1.8, 20), new THREE.MeshStandardMaterial({ color: 0xfaf4e2, emissive: 0xfff0c0, emissiveIntensity: 0.3 }));
      clock.position.set(p.x + Math.sin(p.yaw + Math.PI / 2) * 8.1, p.y + 12, p.z + Math.cos(p.yaw + Math.PI / 2) * 8.1);
      clock.rotation.y = p.yaw + Math.PI / 2;
      g.add(clock);
    }
  }
  // sandstone terraces through the Rocks, stepping up the hill
  const fronts = ['#d9b27a', '#e2c08a', '#c99d68', '#e6cfa2'].map((c, i) => new THREE.MeshStandardMaterial({ map: sandstoneTexture(200 + i, c), roughness: 0.9 }));
  const roof = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
  for (const [s0, s1] of [[S(13, 6), S(16, 10)], [S(12), S(13, 10)]]) for (let s = s0; s < s1; s += 8.5) for (const side of [-1, 1]) {
    const p = place(track, s, side * (track.wallHalf + 16));
    const yaw = p.yaw + (side > 0 ? -Math.PI / 2 : Math.PI / 2);
    if (!ROCKS(p.x, p.z) || !clearBox(track, p.x, p.z, yaw, 8, 10, 8)) continue;
    const h = 6 + r() * 3;
    batch.add(fronts[Math.floor(r() * 4)], new THREE.BoxGeometry(8, h + 4, 10), at(p.x, p.y + h / 2 - 2, p.z, yaw));
    batch.add(roof, paint(new THREE.ConeGeometry(6.6, 3, 4), r() < 0.5 ? 0x5e6266 : 0x8a4a32), at(p.x, p.y + h + 1.5, p.z, yaw + Math.PI / 4, 1, 1, 1.25));
  }
  // the observatory on top of Observatory Hill, with its copper dome
  {
    let best = null;
    for (let i = 0; i < 300; i++) { const x = (-230 + r() * 160) * K, z = (-60 + r() * 120) * K, y = ground(track, x, z); if (clear(track, x, z, 6) && (!best || y > best.y)) best = { x, y, z }; }
    if (best) {
      const stone = fronts[0];
      batch.add(stone, new THREE.BoxGeometry(16, 8, 10), at(best.x, best.y + 3, best.z, 0.3));
      batch.add(stone, new THREE.CylinderGeometry(4, 4, 10, 16), at(best.x + 6, best.y + 4, best.z - 2));
      batch.add(new THREE.MeshStandardMaterial({ color: 0x5fa38a, roughness: 0.5, metalness: 0.4 }), new THREE.SphereGeometry(4.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), at(best.x + 6, best.y + 9, best.z - 2));
    }
  }
  // ferries plying the harbour
  const routes = [
    { x: -30, z: -330, rx: 260, rz: 70, speed: 0.025, ph: 0 },
    { x: 60, z: -300, rx: 160, rz: 55, speed: -0.03, ph: 2 },
    { x: -120, z: -380, rx: 200, rz: 45, speed: 0.02, ph: 4 },
  ];
  for (const R of routes) {
    const f = addFerry(g, 0, 0, 0);
    track.extraUpdates.push((t) => {
      const a = R.ph + t * R.speed;
      const x = (R.x + Math.cos(a) * R.rx) * K, z = (R.z + Math.sin(a) * R.rz) * K;
      const dx = -Math.sin(a) * R.rx * Math.sign(R.speed), dz = Math.cos(a) * R.rz * Math.sign(R.speed);
      f.position.set(x, 0.1 + Math.sin(t * 1.3 + R.ph) * 0.15, z);
      f.rotation.y = Math.atan2(dx, dz);
    });
  }
}

// A First Fleet-style harbour ferry: green hull, cream cabins, a yellow funnel band.
function addFerry(g, x, z, yaw) {
  const f = new THREE.Group();
  const hull = new THREE.MeshStandardMaterial({ color: 0x1d6a3a, roughness: 0.6 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xf2e6c4, roughness: 0.6 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.5 });
  const add = (geo, mat, px, py, pz) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.castShadow = true; f.add(m); };
  add(new THREE.BoxGeometry(5.6, 1.8, 18), hull, 0, 0.6, 0);
  add(new THREE.CylinderGeometry(2.8, 2.8, 1.8, 12, 1, false, 0, Math.PI).rotateY(-Math.PI / 2), hull, 0, 0.6, 9);
  add(new THREE.CylinderGeometry(2.8, 2.8, 1.8, 12, 1, false, 0, Math.PI).rotateY(Math.PI / 2), hull, 0, 0.6, -9);
  add(new THREE.BoxGeometry(5, 2.2, 14), cream, 0, 2.6, 0);
  add(new THREE.BoxGeometry(4.2, 1.8, 7), cream, 0, 4.6, 0);
  add(new THREE.BoxGeometry(5.4, 0.25, 14.4), hull, 0, 3.8, 0);
  add(new THREE.CylinderGeometry(0.6, 0.6, 2, 10), gold, 0, 6.2, 0);
  f.position.set(x, 0.1, z); f.rotation.y = yaw;
  g.add(f);
  return f;
}

// Luna Park: the grinning face over the secret way in, striped towers and a big wheel.
function buildLunaPark(g, batch, track, r) {
  const luna = track.path('luna');
  const pt = luna.portals?.[0];
  if (pt) {
    const W = luna.roadHalf + 1.5;
    const face = new THREE.Mesh(new THREE.CircleGeometry(W * 1.45, 40), new THREE.MeshStandardMaterial({ map: lunaFaceTexture(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 }));
    const fx = Math.sin(pt.yaw), fz = Math.cos(pt.yaw);
    face.position.set(pt.x - fx * 1.0, pt.y + W * 1.45 - 2.3, pt.z - fz * 1.0);
    face.rotation.y = pt.yaw + Math.PI;
    g.add(face);
    const stripes = canvasTex(64, 256, (c) => { for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#e8302a' : '#ffd23a'; c.fillRect(0, i * 16, 64, 16); } });
    const towerMat = new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.6 });
    for (const side of [-1, 1]) { // the two towers either side of the face
      const lx = Math.cos(pt.yaw) * side * (W * 1.45 + 5), lz = -Math.sin(pt.yaw) * side * (W * 1.45 + 5);
      const y = pt.y - 2;
      batch.add(towerMat, new THREE.CylinderGeometry(2.4, 2.8, 28, 12), at(pt.x + lx, y + 14, pt.z + lz));
      batch.add(new THREE.MeshStandardMaterial({ color: 0xe8302a, roughness: 0.6 }), new THREE.ConeGeometry(3.4, 6, 12), at(pt.x + lx, y + 31, pt.z + lz));
      const bulb = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#fff0a0'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      bulb.scale.set(4, 4, 1); bulb.position.set(pt.x + lx, y + 35, pt.z + lz);
      g.add(bulb);
    }
  }
  // the big wheel, turning, on the open ground inside the loop
  let spot = null;
  for (let i = 0; i < 400 && !spot; i++) {
    const x = (-330 + r() * 120) * K, z = (-700 + r() * 140) * K;
    if (clearBox(track, x, z, 0, 30, 10, 14)) spot = { x, z };
  }
  if (spot) {
    const y = ground(track, spot.x, spot.z);
    const fw = new THREE.Group();
    fw.position.set(spot.x, y, spot.z);
    fw.rotation.y = 0.6;
    const steel = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.4, metalness: 0.4 });
    const wheel = new THREE.Group();
    wheel.position.y = 20;
    const R = 16;
    for (const z of [-1.5, 1.5]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.35, 8, 48), steel); ring.position.z = z; wheel.add(ring); }
    const cars = [];
    const colors = [0xe8302a, 0xffd23a, 0x2a7de1, 0x3cc34a];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, R, 6), steel);
      spoke.position.set(Math.cos(a) * R / 2, Math.sin(a) * R / 2, 0); spoke.rotation.z = a - Math.PI / 2;
      wheel.add(spoke);
      const car = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 1.8, 10), new THREE.MeshStandardMaterial({ color: colors[i % 4], roughness: 0.5 }));
      car.position.set(Math.cos(a) * R, Math.sin(a) * R - 1.3, 0);
      wheel.add(car); cars.push(car);
    }
    fw.add(wheel);
    for (const side of [-1, 1]) for (const lean of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.55, 23, 8), steel);
      leg.position.set(lean * 5.5, 10, side * 2.8); leg.rotation.z = lean * 0.27;
      fw.add(leg);
    }
    g.add(fw);
    track.extraUpdates.push((t) => { wheel.rotation.z = t * 0.12; for (const c of cars) c.rotation.z = -wheel.rotation.z; });
  }
}

// Houses on the North Shore and round the edges: white walls and terracotta roofs.
function buildSuburbs(g, batch, track, r) {
  const walls = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
  const tones = [0xf2ede2, 0xe8dcc4, 0xf4f1ea, 0xdcc9a8, 0xcfd8d4];
  let n = 0;
  for (let tries = 0; tries < 6000 && n < 260; tries++) {
    const x = (-650 + r() * 1150) * K, z = (-900 + r() * 1350) * K;
    if (CBD(x, z) || ROCKS(x, z) || GARDEN(x, z) || track.path('opera').inBox(x, z)) continue;
    const w = 8 + r() * 5, d = 8 + r() * 4, yaw = r() * 6.28;
    if (!clearBox(track, x, z, yaw, w, d, 7)) continue;
    const y = ground(track, x, z), h = 5 + r() * 4;
    batch.add(walls, paint(new THREE.BoxGeometry(w, h + 3, d), tones[Math.floor(r() * tones.length)]), at(x, y + h / 2 - 1.5, z, yaw));
    batch.add(walls, paint(new THREE.ConeGeometry(Math.max(w, d) * 0.72, 3.2, 4), r() < 0.75 ? 0xb5532e : 0x5e6266), at(x, y + h + 1.6, z, yaw + Math.PI / 4, 1, 1, d / w));
    n++;
  }
}

// Gum trees everywhere, big figs and palms in the Botanic Garden, purple jacarandas in town.
function buildTrees(g, track, r) {
  const crown = (() => {
    const parts = [];
    for (let i = 0; i < 6; i++) { const s = new THREE.SphereGeometry(0.42, 12, 8); s.scale(1, 0.5, 1); s.translate(Math.cos(i * 2.1) * 0.32, 0.72 + (i % 3) * 0.1, Math.sin(i * 2.1) * 0.32); parts.push(s.toNonIndexed()); }
    return softFoliage(mergeGeometries(parts), { blend: 0.7, dark: 0.45 });
  })();
  const trunk = new THREE.CylinderGeometry(0.04, 0.08, 0.8, 5); trunk.translate(0, 0.4, 0);
  const max = 1100;
  const tr = new THREE.InstancedMesh(trunk, new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.9 }), max); // pale gum bark
  const cr = new THREE.InstancedMesh(crown, foliageMaterial(), max);
  const col = new THREE.Color(), B = track.bounds;
  let n = 0;
  for (let tries = 0; tries < 26000 && n < max; tries++) {
    const x = B.minX + 100 + r() * (B.maxX - B.minX - 200), z = B.minZ + 100 + r() * (B.maxZ - B.minZ - 200);
    const city = CBD(x, z), garden = GARDEN(x, z);
    if (city && r() < 0.85) continue;
    if (track.path('opera').inBox(x, z) || !clear(track, x, z, 10)) continue;
    const y = ground(track, x, z);
    let h = 7 + r() * 8, wide = 0.85;
    if (city) col.setHSL(0.76, 0.45, 0.55 + r() * 0.08);                       // jacaranda
    else if (garden) { col.setHSL(0.3, 0.55, 0.16 + r() * 0.05); h = 12 + r() * 6; wide = 1.5; } // Moreton Bay fig
    else col.setHSL(0.24 + r() * 0.06, 0.32, 0.3 + r() * 0.1);                  // grey-green gums
    const m = at(x, y - 0.3, z, r() * 6.28, h * wide, h, h * wide);
    tr.setMatrixAt(n, m); cr.setMatrixAt(n, m); cr.setColorAt(n, col);
    n++;
  }
  for (const m of [tr, cr]) { m.count = n; m.castShadow = true; m.receiveShadow = true; g.add(m); }
}

// Signs over the tunnel mouths.
function buildSigns(g, track) {
  const font = 'bold 64px Arial Black, Impact, sans-serif';
  const signs = [
    [track.main, 0, 'WYNYARD', '#1f4fb8'], [track.main, 2, 'HARBOUR TUNNEL', '#00843d'], [track.main, 3, 'HARBOUR TUNNEL', '#00843d'],
  ];
  for (const [path, i, text, bg] of signs) {
    const pt = path.portals?.[i];
    if (!pt) continue;
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(13, 1.8), new THREE.MeshStandardMaterial({ map: signTexture(text, { bg, fg: '#ffffff', font }), side: THREE.DoubleSide }));
    sign.position.set(pt.x, pt.y + 10.7, pt.z);
    sign.rotation.y = pt.yaw + (pt.dir < 0 ? Math.PI : 0);
    sign.translateZ(0.8);
    g.add(sign);
  }
}
