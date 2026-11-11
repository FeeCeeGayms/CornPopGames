// Combat: Qoq (grunt-type enemy that throws white chickens), the Super Soaker (yellow acid stream),
// projectiles, splashes, puddles and combat pickups.
import * as THREE from 'three';
import { Player, HULL_MIN, HULL_MAX } from './player.js';
import { MonsterMove } from './monster_move.js';
// lit (PBR) materials for weapons and pickups; they get the game's environment map so they are lit like the old flat materials and metal has something to reflect
export const LIT = { env: null, mats: [] };
function Std(o) { const m = new THREE.MeshStandardMaterial(o); LIT.mats.push(m); if (LIT.env) m.envMap = LIT.env; return m; }
// view-model depth: squeeze the weapon into the front 0.5% of the depth range instead of clearing the depth buffer,
// so the world depth survives for the wet-street reflections and the weapon still never clips into walls
function squashDepth(cam) { const e = cam.projectionMatrix.elements; for (const j of [0, 1, 2, 3]) e[j * 4 + 2] = 0.005 * e[j * 4 + 2] - 0.995 * e[j * 4 + 3]; cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert(); }
function vmKey(scene) { const d = new THREE.DirectionalLight(0xfff4e0, 0.9); d.position.set(-0.4, 1, 0.6); scene.add(d); }

export const QOQ_ANIMS = { idle: 'Idle_9', walk: 'Walking', run: 'Running', attack: 'Attack', death: 'Angry_To_Tantrum_Sit', pain: 'Angry_Ground_Stomp', taunt: 'Happy_jump_f' };
export const QOQ = { health: 50, speed: 210, sight: 1500, attackRange: 950, chickenDamage: 4, chickenSpeed: 520, chickenGravity: 260, height: 60,
  modelH: 2.03, attackScale: 1.7, release: 0.74, attackEnd: 1.45, painScale: 2.4, deathScale: 2.2, deathHold: 5.2, explodeAt: 2.4, pile: 'feathers', sfx: 'qoq' };
// Marv: a tougher grunt (1.5x Qoq health) who throws dirty tissues; a hit gloops white goo over CornPop and slows him for 3 s
export const MARV_ANIMS = { idle: 'Idle_9', walk: 'Walking', run: 'Running', attack: 'baseball_pitching', death: 'Cough_While_Sleeping', pain: 'Angry_Ground_Stomp_1', taunt: 'Confident_Strut' };
export const MARV = { health: 75, speed: 190, sight: 1500, attackRange: 850, tissueDamage: 3, tissueSpeed: 560, tissueGravity: 240, slowTime: 3, slowFactor: 0.45, height: 66,
  modelH: 1.87, attackScale: 2.3, release: 1.05, attackEnd: 1.6, painScale: 1.8, deathScale: 1.2, deathHold: 99, deathLift: 9, explodeAt: 1.5, pile: 'goo', sfx: 'marv' };
// Ballinki: fast and bouncy; runs right up to CornPop and farts a lingering green cloud that makes him throw up
export const BALLINKI_ANIMS = { idle: 'Alert', walk: 'Walking', run: 'Running', attack: 'air_squat', death: 'air_squat', pain: 'Backflip', taunt: 'Boom_Dance', jump: '360_Power_Spin_Jump' };
export const BALLINKI = { health: 60, speed: 300, sight: 1500, attackRange: 115, closeDist: 50, jumpVel: 400, maxClimb: 110, height: 58,
  modelH: 1.7, attackScale: 1.6, release: 0.55, attackEnd: 1.15, painScale: 2.6, deathScale: 1, deathHold: 0.4, tipDeath: true, explodeAt: 0.9, pile: 'pubes', sfx: 'ballinki',
  cloudTime: 2, cloudRadius: 95, sickDps: 6 };
// Beans: a little bean (2/3 of a Qoq) who behaves like a Qoq but throws potatoes; he bursts into a shower of potatoes when killed.
// His model only has Walking/Running, so idle/attack/pain clips are cut from those at load time (see Game.init).
export const BEANS_ANIMS = { idle: 'B_idle', walk: 'Walking', run: 'Running', attack: 'B_attack', death: 'B_pain', pain: 'B_pain', taunt: 'B_idle' };
export const BEANS = { health: 50, speed: 225, sight: 1500, attackRange: 900, height: 40, modelH: 3, potatoDamage: 4, potatoSpeed: 540, potatoGravity: 300,
  attackScale: 1.4, release: 0.42, attackEnd: 0.95, painScale: 1.5, deathScale: 1, deathHold: 99, explodeAt: 0.06, pile: 'potatoes', sfx: 'beans', throwHop: true };
// Frenta: a semi-transparent green-glowing ghost who flies around and spits slow fireballs from his mouth
export const FRENTA_ANIMS = { idle: 'Idle_02', walk: 'Idle_02', run: 'Run_02', attack: 'Idle_02', death: 'Shot_and_Fall_Backward', pain: 'BeHit_FlyUp', taunt: 'Idle_02' };
export const FRENTA = { health: 55, speed: 175, sight: 1800, attackRange: 1200, height: 74, modelH: 2.83, fly: true, hover: 80, keepDist: 330,
  fireSpeed: 250, fireDamage: 10, fireCd: [2.2, 3.4], painScale: 1.6, deathScale: 1.1, deathHold: 99, explodeAt: 2.3, pile: 'ecto', sfx: 'frenta', opacity: 0.58 };
// Boojo: a harmless bystander who turns up at random spots in every map. He just stands around until fighting starts nearby,
// then runs around flailing his arms in a panic. He has no attack; kill him and he bursts into tacos. Ballinkis go after him.
export const BOOJO_ANIMS = { idle: 'Idle_02', walk: 'Walking', run: 'Running', attack: 'Idle_02', death: 'Idle_02', pain: 'Running', taunt: 'Idle_02' };
export const BOOJO = { health: 30, speed: 215, sight: 1200, attackRange: 0, height: 60, modelH: 1.87, attackScale: 1, release: 99, attackEnd: 99, painScale: 1.4, deathScale: 1, deathHold: 0,
  explodeAt: 0, pile: 'tacos', sfx: 'boojo', panicRange: 900, noiseRange: 1100 };
// friendly fire (Doom-style infighting): enemy attacks that hit another enemy do this much more damage than they do to CornPop,
// so the grudge match is over in a few hits instead of dragging on
export const INFIGHT = { damage: 3, giveUp: 8, ballinkiBoojoRange: 650, fartHit: 14 };
// turd launcher: a rocket launcher for poo; splash damage and a coat of brown goo that slows enemies down
export const TURD = { cooldown: 0.85, speed: 880, gravity: 140, damage: 95, splash: 135, selfScale: 0.35, maxAmmo: 30, pickupAmmo: 8, boxAmmo: 4, gooTime: 3.5, slow: 0.45, knock: 420 };
// double-barrel sausage shotgun: two sausages per shot, hits hardest up close
// CC-9000 candy corn machine gun: spins up its gatling barrels, then sprays candy corn
export const CANDYGUN = { rate: 11, spinUp: 0.45, damage: 6, speed: 1700, gravity: 120, spread: 0.045, maxAmmo: 300, pickupAmmo: 120, bagAmmo: 50, knock: 40 };
export const SHOTGUN = { cooldown: 0.9, speed: 1500, gravity: 200, perShot: 2, damageNear: 26, damageFar: 7, near: 140, far: 700, spread: 0.035, maxAmmo: 60, pickupAmmo: 24, boxAmmo: 12, knock: 260 };
export const SOAKER = { rate: 14, damage: 3, acidDps: 8, acidTime: 3, speed: 950, gravity: 420, maxAmmo: 250, startAmmo: 150 };

const lit = (mat, L, k = 1) => mat.color.setRGB(Math.min(2, L[0] * k), Math.min(2, L[1] * k), Math.min(2, L[2] * k));

// ---------------------------------------------------------------- chicken model
export function makeChicken() {
  const g = new THREE.Group();
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff }), red = new THREE.MeshBasicMaterial({ color: 0xe02018 }), yel = new THREE.MeshBasicMaterial({ color: 0xffa020 }), blk = new THREE.MeshBasicMaterial({ color: 0x101010 });
  const add = (geo, mat, x, y, z, sx = 1, sy = 1, sz = 1, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.z = rz; g.add(m); return m; };
  add(new THREE.SphereGeometry(6, 10, 7), white, 0, 0, 0, 1.3, 1, 1);           // body
  add(new THREE.ConeGeometry(4, 7, 7), white, -8, 3, 0, 1, 1, 0.6, 1.1);         // tail
  add(new THREE.SphereGeometry(3.4, 8, 6), white, 7, 5.5, 0);                   // head
  add(new THREE.BoxGeometry(3.5, 2.6, 1), red, 7, 9.6, 0);                       // comb
  add(new THREE.BoxGeometry(1.6, 2.2, 1), red, 9, 9, 0);
  add(new THREE.ConeGeometry(1.3, 3.2, 6), yel, 10.8, 5.2, 0, 1, 1, 1, -Math.PI / 2); // beak
  add(new THREE.SphereGeometry(1.1, 6, 4), red, 9.6, 3.2, 0);                   // wattle
  add(new THREE.BoxGeometry(0.9, 0.9, 0.6), blk, 8.6, 6.4, 2.6); add(new THREE.BoxGeometry(0.9, 0.9, 0.6), blk, 8.6, 6.4, -2.6);
  const wl = add(new THREE.SphereGeometry(4, 8, 5), white, -0.5, 1, 5.6, 1.3, 0.7, 0.35);
  const wr = add(new THREE.SphereGeometry(4, 8, 5), white, -0.5, 1, -5.6, 1.3, 0.7, 0.35);
  for (const z of [-2, 2]) { add(new THREE.CylinderGeometry(0.5, 0.5, 6, 4), yel, 0, -7, z); add(new THREE.BoxGeometry(3, 0.6, 2), yel, 1, -10, z); }
  g.userData.wings = [wl, wr];
  g.userData.mats = [white, red, yel];
  return g;
}

// ---------------------------------------------------------------- a potato (Beans' projectile and death debris)
export function makePotato(s = 1) {
  const geo = new THREE.SphereGeometry(4.2 * s, 9, 7); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = 0.85 + Math.random() * 0.25; p.setXYZ(i, p.getX(i) * 1.35 * k, p.getY(i) * 0.9 * k, p.getZ(i) * k); }
  geo.computeVertexNormals();
  const skin = new THREE.MeshBasicMaterial({ color: 0x8c5e30 }), eye = new THREE.MeshBasicMaterial({ color: 0x4a2e14 });
  const g = new THREE.Group(); g.add(new THREE.Mesh(geo, skin));
  for (let i = 0; i < 4; i++) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.7 * s, 4, 3), eye); const a = Math.random() * 6.3, b = (Math.random() - 0.5) * 2; e.position.set(Math.cos(a) * 5.2 * s * Math.cos(b * 0.6), Math.sin(b) * 3 * s, Math.sin(a) * 3.8 * s * Math.cos(b * 0.6)); g.add(e); }
  g.userData.mats = [skin, eye]; g.userData.r = 3.8 * s; return g;
}
// a taco: a folded tortilla shell with mince, lettuce, tomato and cheese (Boojo's death debris)
export function makeTaco(s = 1) {
  const g = new THREE.Group();
  const shell = new THREE.MeshBasicMaterial({ color: 0xe8b24a, side: THREE.DoubleSide }), meat = new THREE.MeshBasicMaterial({ color: 0x6a3a1e }), lettuce = new THREE.MeshBasicMaterial({ color: 0x5cc23a }), tomato = new THREE.MeshBasicMaterial({ color: 0xd8301c }), cheese = new THREE.MeshBasicMaterial({ color: 0xffd23a });
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(5.5 * s, 5.5 * s, 3.2 * s, 14, 1, true, 0, Math.PI), shell); sh.rotation.set(Math.PI / 2, 0, Math.PI / 2); g.add(sh); // a half-pipe, opening up
  const fill = new THREE.Mesh(new THREE.BoxGeometry(2.6 * s, 2.2 * s, 9.5 * s), meat); fill.position.y = 1.4 * s; g.add(fill);
  for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1.4 * s, 1 * s, 1.4 * s), i % 3 === 0 ? tomato : i % 3 === 1 ? lettuce : cheese); m.position.set((Math.random() - 0.5) * 2 * s, 2.6 * s, (Math.random() - 0.5) * 8 * s); m.rotation.y = Math.random() * 3; g.add(m); }
  const l = new THREE.Mesh(new THREE.PlaneGeometry(3.4 * s, 9 * s), lettuce); l.material.side = THREE.DoubleSide; l.rotation.x = -Math.PI / 2; l.position.y = 2.9 * s; g.add(l);
  g.userData.mats = [shell, meat, lettuce, tomato, cheese]; g.userData.r = 3 * s; return g;
}
// ---------------------------------------------------------------- dirty tissue (Marv's projectile)
export function makeTissue() {
  const geo = new THREE.IcosahedronGeometry(5.5, 1); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = 0.7 + Math.random() * 0.55; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.85, p.getZ(i) * k); }
  geo.computeVertexNormals();
  const white = new THREE.MeshBasicMaterial({ color: 0xf2f0e6 }), stain = new THREE.MeshBasicMaterial({ color: 0xc8c290 });
  const g = new THREE.Group(); g.add(new THREE.Mesh(geo, white));
  for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(1.6 + Math.random(), 6, 4), stain); s.position.set((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 7); g.add(s); }
  const flap = new THREE.Mesh(new THREE.PlaneGeometry(7, 5), white); flap.position.set(3, 3, 0); flap.rotation.set(0.6, 0.3, 0.8); flap.material.side = THREE.DoubleSide; g.add(flap);
  g.userData.mats = [white, stain]; return g;
}
// a sausage (shotgun ammo / projectile / pickup)
export function makeSausage(len = 12, r = 2.6) {
  const g = new THREE.Group();
  const skin = new THREE.MeshBasicMaterial({ color: 0xb5562e }), tip = new THREE.MeshBasicMaterial({ color: 0x8a3a1c }), shine = new THREE.MeshBasicMaterial({ color: 0xe0906a });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), skin); body.rotation.x = Math.PI / 2; g.add(body);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 6), skin); e.position.z = s * len / 2; g.add(e); const t = new THREE.Mesh(new THREE.SphereGeometry(r * 0.35, 6, 4), tip); t.position.z = s * (len / 2 + r * 0.9); g.add(t); }
  const hl = new THREE.Mesh(new THREE.BoxGeometry(r * 0.5, 0.4, len * 0.8), shine); hl.position.set(r * 0.35, r * 0.8, 0); g.add(hl);
  g.userData.mats = [skin, tip, shine]; return g;
}
// ---------------------------------------------------------------- candy corn (projectile / ammo)
export function makeCandyCorn(s = 1) {
  const g = new THREE.Group();
  const yel = new THREE.MeshBasicMaterial({ color: 0xffc21a }), org = new THREE.MeshBasicMaterial({ color: 0xff7a12 }), wht = new THREE.MeshBasicMaterial({ color: 0xfff6e0 });
  const seg = (r0, r1, h, y, m) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r1 * s, r0 * s, h * s, 7), m); c.position.y = y * s; g.add(c); };
  seg(2.1, 1.75, 1.6, 0.8, yel); seg(1.75, 1.05, 1.9, 2.55, org); const tip = new THREE.Mesh(new THREE.ConeGeometry(1.05 * s, 1.7 * s, 7), wht); tip.position.y = 4.35 * s; g.add(tip);
  g.userData.mats = [yel, org, wht]; return g;
}
// ---------------------------------------------------------------- CC-9000 candy corn machine gun view model (after the blueprint)
export function makeCandyGun() {
  const g = new THREE.Group();
  const M = c => Std({ color: c, roughness: 0.45, metalness: 0.05 });
  const yellow = M(0xf5c518), yellowD = M(0xc89a10), orange = M(0xf07a1a), white = M(0xe8e8e0);
  const grey = Std({ color: 0x7a7e86, roughness: 0.2, metalness: 0.7 });
  const glass = Std({ color: 0xcfe6f0, transparent: true, opacity: 0.25, roughness: 0.1, metalness: 0.2, depthWrite: false });
  const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); g.add(m); return m; };
  const cylZ = (r, l, mat, x, y, z, parent = g, segs = 12) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, segs), mat); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); parent.add(m); return m; };
  box(7, 6.5, 16, yellow, 0, 0, 2);                     // receiver
  box(7.4, 1.2, 16.4, yellowD, 0, -3.4, 2);
  box(5, 6, 9, orange, 0, -1, 14); box(5.6, 7.5, 3, orange, 0, -1.5, 18.5);   // stock + butt pad
  const grip = box(3.4, 7, 3.6, orange, 0, -6.5, 6); grip.rotation.x = -0.3;
  box(4, 2, 6, orange, 0, -4.4, -8);                    // fore grip rail
  const handle = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.9, 6, 12, Math.PI), yellow); handle.rotation.y = Math.PI / 2; handle.position.set(0, 3.3, 1); g.add(handle);
  // hopper full of candy corn
  const hop = new THREE.Mesh(new THREE.SphereGeometry(4.6, 12, 8), glass); hop.position.set(0, 7.6, 8); hop.scale.set(1, 0.85, 1.1); g.add(hop);
  const kernels = []; for (let i = 0; i < 9; i++) { const c = makeCandyCorn(0.55); c.position.set((Math.random() - 0.5) * 5, 5.4 + Math.random() * 3.2, 8 + (Math.random() - 0.5) * 5); c.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); g.add(c); kernels.push(c); }
  // drum
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 3.4, 16), orange); drum.rotation.z = Math.PI / 2; drum.position.set(4.6, -3.5, 1); g.add(drum);
  const drumFace = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 3.6, 16), white); drumFace.rotation.z = Math.PI / 2; drumFace.position.copy(drum.position); g.add(drumFace);
  // rotating gatling barrels
  const spin = new THREE.Group(); spin.position.set(0, 0.6, -6); g.add(spin);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; cylZ(0.95, 20, white, Math.cos(a) * 2.2, Math.sin(a) * 2.2, -10, spin, 8); }
  for (const z of [-2, -12, -19]) cylZ(3.6, 1.6, orange, 0, 0, z, spin, 12);
  cylZ(1, 21, grey, 0, 0, -10, spin, 8);
  const muzzle = new THREE.Group(); muzzle.position.set(0, 0.6, -27); g.add(muzzle);
  for (let k = 0; k < 4; k++) cylZ(3.2 - (k % 2) * 0.5, 1, orange, 0, 0, -k * 1.1, muzzle, 12);
  g.userData = { spin, kernels, mats: [yellow, yellowD, orange, white, grey], base: [0xf5c518, 0xc89a10, 0xf07a1a, 0xe8e8e0, 0x7a7e86], muzzle: new THREE.Vector3(0, 0.6, -31) };
  return g;
}

// ---------------------------------------------------------------- a turd (projectile / ammo): a stacked brown swirl
export function makeTurd(s = 1) {
  const g = new THREE.Group();
  const br = new THREE.MeshBasicMaterial({ color: 0x6a3a18 }), hi = new THREE.MeshBasicMaterial({ color: 0x8e5426 }), dk = new THREE.MeshBasicMaterial({ color: 0x46240e });
  [[4.6, 1.9, 0], [3.5, 1.6, 2.6], [2.4, 1.3, 4.8]].forEach(([R, r, y], i) => { const t = new THREE.Mesh(new THREE.TorusGeometry(R * s, r * s, 8, 14), i === 1 ? hi : br); t.rotation.x = Math.PI / 2; t.position.y = y * s; g.add(t); });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(4.4 * s, 4.8 * s, 1.6 * s, 12), dk); base.position.y = -0.6 * s; g.add(base);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(1.6 * s, 3.2 * s, 8), br); tip.position.set(0.5 * s, 6.6 * s, 0); tip.rotation.z = -0.35; g.add(tip);
  g.userData.mats = [br, hi, dk]; return g;
}
// ---------------------------------------------------------------- the turd launcher view model: a toilet-green tube with a seat-ring muzzle
export function makeTurdLauncher() {
  const g = new THREE.Group();
  const M = c => Std({ color: c, roughness: 0.5, metalness: 0.05 });
  const tube = M(0x3f6a3a), tubeD = M(0x284a26), seat = Std({ color: 0xeeeeea, roughness: 0.3, metalness: 0.1 });
  const metal = Std({ color: 0x6e7278, roughness: 0.12, metalness: 0.85 });
  const grip = Std({ color: 0x5a3a22, roughness: 0.6, metalness: 0.0 });
  const warn = M(0xffc020);
  const cyl = (r, l, mat, x, y, z, segs = 16) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, segs), mat); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); g.add(m); return m; };
  const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); g.add(m); return m; };
  cyl(4.6, 34, tube, 0, 0, -8); cyl(4.9, 2, tubeD, 0, 0, -2); cyl(4.9, 2, tubeD, 0, 0, 7); cyl(5.4, 3, tubeD, 0, 0, 9.5);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(5.6, 1.6, 8, 20), seat); ring.position.set(0, 0, -25.4); g.add(ring);       // toilet-seat muzzle
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.2, 0.9, 20, 1, false, 0, Math.PI), seat); lid.rotation.set(Math.PI / 2 - 0.9, 0, 0); lid.position.set(0, 5.5, -27); g.add(lid);
  const loaded = makeTurd(0.62); loaded.rotation.x = -Math.PI / 2; loaded.position.set(0, 0, -23); g.add(loaded);
  box(2, 3, 9, metal, 0, 5.6, -6); box(1.2, 2, 1.2, warn, 0, 7.6, -1.5); box(1.2, 2, 1.2, warn, 0, 7.6, -10);                  // sight rail
  const gr = box(3.2, 7, 3.4, grip, 0, -6.5, 1); gr.rotation.x = -0.25; box(3, 6, 3, grip, 0, -6, -12);                     // grips
  box(0.9, 2.6, 1.4, metal, 0, -3.8, -1.6);                                                                                   // trigger
  for (let k = 0; k < 3; k++) box(0.6, 0.6, 3.6, warn, 3.6 * Math.cos(k * 2.1), 3.6 * Math.sin(k * 2.1), -16);
  g.userData = { loaded, mats: [tube, tubeD, seat, metal, grip, warn], base: [0x3f6a3a, 0x284a26, 0xeeeeea, 0x6e7278, 0x5a3a22, 0xffc020], muzzle: new THREE.Vector3(0, 0, -28) };
  return g;
}

// ---------------------------------------------------------------- double-barrel sausage shotgun view model
export function makeShotgun() {
  const g = new THREE.Group();
  const M = c => Std({ color: c, roughness: 0.4, metalness: 0.1 });
  const metal = Std({ color: 0x50545a, roughness: 0.15, metalness: 0.9 });
  const dark = Std({ color: 0x26282c, roughness: 0.2, metalness: 0.7 });
  const wood = Std({ color: 0x7a4a24, roughness: 0.6, metalness: 0.0 });
  const woodD = Std({ color: 0x4e2e16, roughness: 0.65, metalness: 0.0 });
  const brass = Std({ color: 0xd0a040, roughness: 0.1, metalness: 0.85 });
  const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); g.add(m); return m; };
  const cyl = (r, l, mat, x, y, z, segs = 12) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, segs), mat); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); g.add(m); return m; };
  const barrels = new THREE.Group(); g.add(barrels);
  for (const x of [-2.1, 2.1]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 24, 12), metal); b.rotation.x = Math.PI / 2; b.position.set(x, 1.5, -11); barrels.add(b);
    const mz = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.6, 10), dark); mz.rotation.x = Math.PI / 2; mz.position.set(x, 1.5, -23.2); barrels.add(mz); }
  const rib = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 22), dark); rib.position.set(0, 3.8, -11); barrels.add(rib);
  const loaded = []; for (const x of [-2.1, 2.1]) { const s = makeSausage(4, 1.35); s.position.set(x, 1.5, -22.6); barrels.add(s); loaded.push(s); }
  box(6.4, 3.4, 9, wood, 0, -1.4, -9);            // fore-end
  box(6.6, 5.4, 8, metal, 0, 0.6, 1);             // receiver
  box(1.4, 1.4, 3, brass, 0, 3.6, 2.5);           // hammer
  const stock = box(5.2, 6.5, 16, wood, 0, -3.8, 12); stock.rotation.x = 0.28;
  box(5.4, 2, 3, woodD, 0, -7.4, 19);
  box(1, 3, 1.6, dark, 0, -2.6, 3);               // trigger
  g.userData = { barrels, loaded, mats: [metal, dark, wood, woodD, brass], base: [0x50545a, 0x26282c, 0x7a4a24, 0x4e2e16, 0xd0a040], muzzle: [new THREE.Vector3(-2.1, 1.5, -24), new THREE.Vector3(2.1, 1.5, -24)] };
  return g;
}

// ---------------------------------------------------------------- super soaker view model
export function makeSoaker() {
  const g = new THREE.Group();
  const M = c => Std({ color: c, roughness: 0.4, metalness: 0.02 });
  const green = M(0x5ad020), dgreen = M(0x2a7a18), orange = M(0xff7a10), yellow = M(0xffd020);
  const clear = Std({ color: 0xffe9a0, transparent: true, opacity: 0.4, roughness: 0.05, metalness: 0.1, depthWrite: false });
  const liquid = Std({ color: 0xffe020, roughness: 0.1, metalness: 0.0, transparent: true, opacity: 0.8 });
  const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); g.add(m); return m; };
  const cyl = (r, l, mat, x, y, z, segs = 12) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, segs), mat); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); g.add(m); return m; };
  box(4.2, 4.4, 24, green, 0, 0, -6);              // barrel body
  box(3.2, 2, 20, dgreen, 0, 2.6, -7);             // top rail
  cyl(1.6, 6, orange, 0, 0.4, -20.5);               // nozzle
  cyl(0.9, 1.2, yellow, 0, 0.4, -24);               // tip
  const pump = cyl(2.2, 8, yellow, 0, -3.6, -12);   // pump handle
  box(3.4, 8, 3.6, dgreen, 0, -5.5, 4); g.children[g.children.length - 1].rotation.x = -0.35; // grip
  box(1, 3, 1.6, orange, 0, -3.2, 0.5);           // trigger
  const tankShell = cyl(4.2, 13, clear, 0, 6.6, -2, 14); // tank
  const tank = cyl(3.7, 12, liquid, 0, 6.6, -2, 14);
  cyl(4.6, 1.2, orange, 0, 6.6, 4.8); cyl(4.6, 1.2, orange, 0, 6.6, -8.8);
  box(1.2, 4, 1.2, dgreen, 0, 3.6, 2);
  g.userData = { pump, tank, tankShell, mats: [green, dgreen, orange, yellow, liquid], nozzle: new THREE.Vector3(0, 0.4, -25) };
  return g;
}

// juice jug (ammo) / soaker pickup / pizza box (health) world models
export function makePickupModel(kind, T) {
  const g = new THREE.Group();
  if (kind === 'soaker') { const s = makeSoaker(); s.scale.setScalar(1.1); s.rotation.y = Math.PI / 2; g.add(s); g.userData.mats = s.userData.mats; return g; }
  if (kind === 'turdgun') { const s = makeTurdLauncher(); s.scale.setScalar(0.7); s.rotation.y = Math.PI / 2; g.add(s); g.userData.mats = s.userData.mats; return g; }
  if (kind === 'turdbox') { // a little cardboard box of turds
    const card = new THREE.MeshBasicMaterial({ color: 0xb08850 }), flap = new THREE.MeshBasicMaterial({ color: 0x8a6838 });
    const bx = new THREE.Mesh(new THREE.BoxGeometry(16, 8, 12), card); g.add(bx);
    for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(16, 0.6, 5), flap); f.position.set(0, 5.5, s * 7.5); f.rotation.x = s * 0.7; g.add(f); }
    const mats = [card, flap]; for (const x of [-4, 3.5]) { const t = makeTurd(0.55); t.position.set(x, 4.5, 0); g.add(t); mats.push(...t.userData.mats); }
    g.userData.mats = mats; return g;
  }
  if (kind === 'candygun') { const s = makeCandyGun(); s.scale.setScalar(0.75); s.rotation.y = Math.PI / 2; g.add(s); g.userData.mats = s.userData.mats; return g; }
  if (kind === 'candybag') { // a striped bag of candy corn, tied at the top
    const w = new THREE.MeshBasicMaterial({ color: 0xfff2dc }), o = new THREE.MeshBasicMaterial({ color: 0xff8a1a }), y = new THREE.MeshBasicMaterial({ color: 0xffc21a });
    const bag = new THREE.Mesh(new THREE.SphereGeometry(7, 10, 8), w); bag.scale.set(1, 1.15, 0.8); bag.position.y = 2; g.add(bag);
    for (const [yy, m] of [[-1.5, o], [2.5, y], [6, o]]) { const band = new THREE.Mesh(new THREE.CylinderGeometry(7.05 * Math.cos(Math.asin(Math.min(0.95, (yy - 2) / 8))), 7.05 * Math.cos(Math.asin(Math.min(0.95, (yy - 2) / 8))), 1.8, 10), m); band.scale.set(1, 1, 0.8); band.position.y = yy; g.add(band); }
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.6, 3.4, 8), w); neck.position.y = 10.5; g.add(neck);
    const tie = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.5, 4, 8), o); tie.rotation.x = Math.PI / 2; tie.position.y = 10; g.add(tie);
    const mats = [w, o, y]; for (const [x, z, r] of [[-3, 5.6, 0.6], [2.5, 5.2, -0.5]]) { const c = makeCandyCorn(0.7); c.position.set(x, 1, z); c.rotation.z = r; g.add(c); mats.push(...c.userData.mats); }
    g.userData.mats = mats; return g;
  }
  if (kind === 'shotgun') { const s = makeShotgun(); s.scale.setScalar(0.85); s.rotation.y = Math.PI / 2; g.add(s); g.userData.mats = s.userData.mats; return g; }
  if (kind === 'sausagehp') { // health: one fat glistening sausage with a mustard squiggle (+10)
    const s = makeSausage(18, 4.2); s.rotation.y = Math.PI / 2; s.rotation.z = 0.25; g.add(s);
    const mustard = new THREE.MeshBasicMaterial({ color: 0xffd21a });
    for (let k = 0; k < 7; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.1, 1.4), mustard); b.position.set(k % 2 ? 1.1 : -1.1, 4.0, -7.5 + k * 2.5); b.rotation.y = k % 2 ? 0.7 : -0.7; s.add(b); }
    g.userData.mats = [...s.userData.mats, mustard]; return g;
  }
  if (kind === 'sausages') {
    const crate = new THREE.MeshBasicMaterial({ color: 0xc89a5a }), band = new THREE.MeshBasicMaterial({ color: 0x8a5a2a });
    const b = new THREE.Mesh(new THREE.BoxGeometry(16, 6, 11), crate); g.add(b); const bd = new THREE.Mesh(new THREE.BoxGeometry(16.4, 1.6, 11.4), band); bd.position.y = 1; g.add(bd);
    const mats = [crate, band];
    for (let i = 0; i < 4; i++) { const s = makeSausage(9, 2); s.rotation.y = Math.PI / 2; s.position.set(0, 4.5 + (i % 2) * 1.5, -3.6 + i * 2.4); g.add(s); mats.push(...s.userData.mats); }
    g.userData.mats = mats; return g;
  }
  if (kind === 'juice') {
    const body = new THREE.MeshBasicMaterial({ color: 0xffe030 }), cap = new THREE.MeshBasicMaterial({ color: 0xff6010 }), label = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const b = new THREE.Mesh(new THREE.BoxGeometry(10, 14, 8), body); g.add(b);
    const n = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3, 4, 8), body); n.position.y = 9; g.add(n);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 2, 8), cap); c.position.y = 11.8; g.add(c);
    const l = new THREE.Mesh(new THREE.BoxGeometry(10.4, 5, 8.4), label); l.position.y = -1; g.add(l);
    const h = new THREE.Mesh(new THREE.TorusGeometry(3, 0.8, 4, 8, Math.PI), cap); h.position.set(0, 6.6, 0); g.add(h);
    g.userData.mats = [body, cap, label]; return g;
  }
  if (kind === 'health') {
    const box = new THREE.MeshBasicMaterial({ map: T.pizzabox }), top = new THREE.MeshBasicMaterial({ map: T.pizza });
    const b = new THREE.Mesh(new THREE.BoxGeometry(24, 4, 24), [box, box, box, box, box, box]); g.add(b);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(24, 1, 24), box); lid.position.set(0, 13, -12); lid.rotation.x = -1.3; g.add(lid);
    const pz = new THREE.Mesh(new THREE.CylinderGeometry(10.5, 10.5, 1.2, 16), [box, top, box]); pz.position.y = 2.6; g.add(pz);
    const crossM = new THREE.MeshBasicMaterial({ color: 0xff2020 });
    g.userData.mats = [box, top]; return g;
  }
  return g;
}

// ---------------------------------------------------------------- particles (droplets, splashes, feathers, steam)
export class Particles {
  constructor(scene, max = 900) {
    this.max = max; this.n = 0; this.list = [];
    this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 3);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.points = new THREE.Points(g, new THREE.PointsMaterial({ size: 3.2, sizeAttenuation: true, vertexColors: true, fog: true }));
    this.points.frustumCulled = false; scene.add(this.points);
  }
  spawn(p, v, color, life, grav = 400, drag = 0) { if (this.list.length >= this.max) this.list.shift(); this.list.push({ p: p.slice(), v: v.slice(), c: color, life, t: 0, grav, drag }); }
  update(dt) {
    let i = 0; const keep = [];
    for (const q of this.list) {
      q.t += dt; if (q.t >= q.life) continue;
      q.v[1] -= q.grav * dt; if (q.drag) { const k = Math.exp(-q.drag * dt); q.v[0] *= k; q.v[1] *= k; q.v[2] *= k; }
      q.p[0] += q.v[0] * dt; q.p[1] += q.v[1] * dt; q.p[2] += q.v[2] * dt; keep.push(q);
      if (i < this.max) { this.pos.set(q.p, i * 3); const f = 1 - q.t / q.life * 0.5; this.col[i * 3] = q.c[0] * f; this.col[i * 3 + 1] = q.c[1] * f; this.col[i * 3 + 2] = q.c[2] * f; i++; }
    }
    this.list = keep; this.n = i;
    this.points.geometry.setDrawRange(0, i); this.points.geometry.attributes.position.needsUpdate = true; this.points.geometry.attributes.color.needsUpdate = true;
  }
}

// segment vs AABB, returns t in [0,1] or -1
function segAabb(p0, p1, mn, mx) {
  let t0 = 0, t1 = 1;
  for (let a = 0; a < 3; a++) {
    const d = p1[a] - p0[a];
    if (Math.abs(d) < 1e-9) { if (p0[a] < mn[a] || p0[a] > mx[a]) return -1; continue; }
    let ta = (mn[a] - p0[a]) / d, tb = (mx[a] - p0[a]) / d; if (ta > tb) { const t = ta; ta = tb; tb = t; }
    if (ta > t0) t0 = ta; if (tb < t1) t1 = tb; if (t0 > t1) return -1;
  }
  return t0;
}

// rotate `bone` so the direction bone -> child points along world direction `dir` (used for Boojo's flailing arms)
const _av1 = new THREE.Vector3(), _av2 = new THREE.Vector3(), _aq1 = new THREE.Quaternion(), _aq2 = new THREE.Quaternion(), _aq3 = new THREE.Quaternion();
function aimBone(bone, child, dir, w) {
  bone.updateMatrixWorld(true); const a = _av1.setFromMatrixPosition(bone.matrixWorld), b = _av2.setFromMatrixPosition(child.matrixWorld); const cur = b.sub(a).normalize();
  _aq1.setFromUnitVectors(cur, dir); bone.getWorldQuaternion(_aq2); _aq3.copy(_aq1).multiply(_aq2);
  bone.parent.getWorldQuaternion(_aq2); _aq2.invert().multiply(_aq3); bone.quaternion.slerp(_aq2, w); bone.updateMatrixWorld(true);
}
// ---------------------------------------------------------------- Qoq
let QID = 0;
export class Qoq {
  constructor(game, def) {
    this.game = game; this.id = QID++;
    this.kind = ['marv', 'ballinki', 'frenta', 'beans', 'boojo'].includes(def.type) ? def.type : 'qoq'; const K = this.K = { qoq: QOQ, marv: MARV, ballinki: BALLINKI, frenta: FRENTA, beans: BEANS, boojo: BOOJO }[this.kind];
    this.boojo = this.kind === 'boojo'; this.foe = null; this.foeLostT = 0;
    this.phys = new MonsterMove(game.world); this.phys.maxspeed = K.speed; if (K.jumpVel) this.phys.jumpVel = K.jumpVel;
    let lift = 0; if (K.fly) { const cl = game.world.cell(Math.floor(def.pos[0] / 32), Math.floor(def.pos[2] / 32)); lift = cl.solid ? 0 : Math.max(0, Math.min(56, cl.c - def.pos[1] - 24.1 - 34)); }
    this.phys.spawn([def.pos[0], def.pos[1] + 24.1 + lift, def.pos[2]], def.angle || 0);
    this.health = K.health; this.state = 'idle'; this.awake = false; this.alive = true;
    this.attackCd = 0.6 + Math.random(); this.sightT = Math.random() * 0.2; this.flashT = 0; this.acidT = 0; this.stuckT = 0; this.dodgeT = 0; this.trailIdx = -1;
    this.model = ({ marv: game.marvAsset, ballinki: game.ballinkiAsset, frenta: game.frentaAsset, beans: game.beansAsset, boojo: game.boojoAsset }[this.kind] || game.qoqAsset).instance(); this.model.root.scale.setScalar(K.height / K.modelH);
    for (const m of this.model.mats) { m.emissiveMap = m.map; m.emissive = new THREE.Color(0, 0, 0); if (K.fly) { m.transparent = true; m.opacity = K.opacity; m.depthWrite = false; } }
    if (K.fly) { // green ghost glow that follows him around
      this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: game.glowTex(), color: 0x50ff60, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, fog: true }));
      this.glow.scale.set(150, 170, 1); game.scene.add(this.glow); this.flyVel = [0, 0, 0]; this.fireCd = 1 + Math.random() * 2; this.bobPh = Math.random() * 6;
    }
    this.model.setState('idle', 0, true);
    if (this.boojo && game.boojoSkins) { const t = game.boojoSkins[game.boojoN = ((game.boojoN || 0) + 1 + Math.floor(Math.random() * 3)) % game.boojoSkins.length]; if (t) for (const m of this.model.mats) { m.map = t; if (m.emissiveMap) m.emissiveMap = t; } } // a different outfit each
    if (this.boojo) { // arm bones for the panic flail, and a random pose phase so a crowd of Boojos doesn't move in lockstep
      const B = {}; this.model.root.traverse(o => { if (o.isBone) B[o.name] = o; });
      this.arms = [['Left', -1], ['Right', 1]].map(([s, side]) => ({ up: B[s + 'UpperArm'], lo: B[s + 'LowerArm'], hand: B[s + 'Hand'], side })).filter(a => a.up && a.lo && a.hand);
      this.flailPh = Math.random() * 6; this.panicT = 0; this.yelpT = 1 + Math.random() * 2; this.idleTurnT = 2 + Math.random() * 4; this.idleYaw = def.angle || 0;
      for (const k of ['idle', 'run', 'walk']) { const a = this.model.actions[k]; if (a) a.time = Math.random() * a.getClip().duration; }
    }
    this.model.root.traverse(o => { if (o.isMesh) { o.frustumCulled = true; o.geometry.computeBoundingSphere(); o.geometry.boundingSphere.radius *= 1.4; } });
    game.scene.add(this.model.root);
    this.brush = { min: [0, 0, 0], max: [0, 0, 0], solid: true, shadow: false, enemy: this };
    this.phys.ignore = this.brush;
    this.turret = !!def.turret; this.waveId = def.wave; this.delay = def.delay || 0;
    this.dormant = !!def.wave;
    if (this.dormant) { this.model.root.visible = false; this.alive = true; if (this.glow) this.glow.visible = false; }
    else game.world.addDynamic(this.brush);
    this.syncBrush(); this.lastPos = this.phys.pos.slice(); this.lodT = 0;
  }
  get pos() { return this.phys.pos; }
  activate() { // a wave member teleports in, already hunting CornPop
    this.dormant = false; this.model.root.visible = true; if (this.glow) this.glow.visible = true; this.game.world.addDynamic(this.brush); this.syncBrush();
    this.awake = true; this.state = 'chase'; this.attackCd = 0.8 + Math.random(); this.model.setState('run', 0, true);
    this.trailIdx = this.game.trail.length - 1;
  }
  syncBrush() { const p = this.phys.pos; for (let a = 0; a < 3; a++) { this.brush.min[a] = p[a] + HULL_MIN[a]; this.brush.max[a] = p[a] + HULL_MAX[a]; } }
  eye() { return [this.pos[0], this.pos[1] + 22, this.pos[2]]; }
  canSee(p) { const g = this.game; return g.world.trace(this.eye(), p, [-1, -1, -1], [1, 1, 1], null, true).fraction >= 0.999; }
  wake(sound = true) {
    if (this.awake || !this.alive) return; this.awake = true; this.state = 'chase';
    if (this.boojo) { this.panicT = 0; if (sound) this.game.sfx.play('boojoSight'); return; } // panic! (Boojo never alerts anyone)
    if (sound) this.game.sfx.play(this.K.sfx + 'Sight');
    // group alert, like Quake monsters
    for (const o of this.game.enemies) if (o !== this && o.alive && !o.awake && Math.hypot(o.pos[0] - this.pos[0], o.pos[2] - this.pos[2]) < 420 && this.canSee(o.eye())) o.wake(false);
  }
  // the current infighting target, if it is still worth fighting
  foeOf() { const f = this.foe; if (f && (!f.alive || f.dormant || f.exploded)) { this.foe = null; if (this.foeOnly) { this.foeOnly = false; this.awake = false; this.state = 'idle'; this.model.emote = null; this.model.setState('idle', 0.3, true); } } return this.foe; }
  // friendly fire: hit by another monster's attack -> drop CornPop and fight that monster until one of them is dead (Doom infighting)
  grudge(attacker) {
    if (!(attacker instanceof Qoq) || attacker === this || !attacker.alive || attacker.boojo || this.boojo) return;
    if (this.foe === attacker) return;
    if (this.foe && this.foe.alive && !this.foe.boojo) return; // already settling another score
    this.foe = attacker; this.foeLostT = 0; this.foeOnly = false;
    if (!this.awake) { this.awake = true; this.state = 'chase'; } this.sightT = 0;
    if (this.state === 'attack' || this.state === 'taunt') { this.state = 'chase'; this.model.emote = null; this.model.setState('run', 0.15, true); this.attackCd = Math.min(this.attackCd, 0.4); }
    this.game.sfx.play(this.K.sfx + 'Sight');
  }
  hurt(n, acid, attacker) {
    if (!this.alive) return;
    this.health -= n; this.flashT = 0.12; this.wake();
    if (attacker) this.grudge(attacker);
    if (acid) this.acidT = SOAKER.acidTime;
    if (this.health <= 0) this.die();
    else if (Math.random() < 0.08 && this.state !== 'attack' && this.state !== 'pain') { this.state = 'pain'; this.stateT = 0; this.model.playEmote('pain'); this.model.actions.pain.timeScale = this.K.painScale; this.game.sfx.play(this.K.sfx + 'Pain'); }
  }
  die() {
    this.alive = false; this.state = 'dead'; this.stateT = 0;
    this.game.world.removeBrush(this.brush);
    const a = this.model.actions.death; this.model.mixer.stopAllAction(); this.model.emote = null;
    a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.timeScale = this.K.deathScale; a.play();
    this.game.sfx.play(this.K.sfx + 'Death');
    if (this.boojo) return; // not an enemy: no kill, no drops (he bursts into tacos in updateBoojo)
    this.game.kills++;
    const fy = this.K.fly ? this.game.world.floorAt(this.pos[0], this.pos[2]) : this.pos[1] - 24;
    this.game.dropPickup('juice', [this.pos[0], fy, this.pos[2]], 30);
    if (this.game.hasCandy && Math.random() < 0.4) this.game.dropPickup('candybag', [this.pos[0] - 12, fy, this.pos[2] - 6], 15);
    if (this.game.hasTurd && Math.random() < 0.25) this.game.dropPickup('turdbox', [this.pos[0] + 10, fy, this.pos[2] - 12], 2);
    if (this.game.arsenal) this.game.arsenal.enemyDrop([this.pos[0] + 8, fy, this.pos[2] + 12]);
    if (this.kind === 'marv') this.game.dropPickup('sausages', [this.pos[0] + 14, fy, this.pos[2] + 8], 8);
  }
  fart() { // a green cloud just in front of him, big enough to swallow CornPop standing there
    const f = [-Math.sin(this.phys.yaw), -Math.cos(this.phys.yaw)], foe = this.foeOf();
    if (foe && Math.hypot(foe.pos[0] - this.pos[0], foe.pos[2] - this.pos[2]) < 150) { this.game.spawnFart([foe.pos[0], foe.pos[1] - 4, foe.pos[2]], this); return; } // right on top of his victim
    this.game.spawnFart([this.pos[0] + f[0] * 25, this.pos[1] - 4, this.pos[2] + f[1] * 25], this);
  }
  // ---- Frenta: flying ghost movement, fireballs, falling death ----
  flyMove(v, dt) {
    const W = this.game.world, p = this.phys.pos, mn = [-18, -22, -18], mx = [18, 30, 18];
    // never move while embedded in something: pop back to the last free spot (stops him drifting through walls and doors)
    // (v0.32: one that spawns overlapping a pillar has no last free spot yet; it used to sink through the floor and die in the void, so look for the nearest free spot instead)
    if (W.testPosition(p, mn, mx, this.brush)) {
      if (this.lastFree) { p[0] = this.lastFree[0]; p[1] = this.lastFree[1]; p[2] = this.lastFree[2]; }
      else { let done = false; for (let r = 4; r <= 96 && !done; r += 4) for (let a = 0; a < 16 && !done; a++) { const q = [p[0] + Math.cos(a * Math.PI / 8) * r, p[1] + (a % 4 === 1 ? r * 0.5 : 0), p[2] + Math.sin(a * Math.PI / 8) * r]; if (!W.testPosition(q, mn, mx, this.brush)) { p[0] = q[0]; p[1] = q[1]; p[2] = q[2]; this.lastFree = q; done = true; } } if (!done) p[1] += 4; }
      v[0] = v[1] = v[2] = 0; return;
    }
    for (const axis of [[v[0] * dt, 0, 0], [0, 0, v[2] * dt], [0, v[1] * dt, 0]]) {
      const e = [p[0] + axis[0], p[1] + axis[1], p[2] + axis[2]];
      const tr = W.trace(p, e, mn, mx, this.brush, true);
      if (tr.fraction > 0.01) { p[0] += axis[0] * tr.fraction * 0.98; p[1] += axis[1] * tr.fraction * 0.98; p[2] += axis[2] * tr.fraction * 0.98; }
      if (tr.fraction < 1) { if (axis[0]) v[0] *= -0.3; if (axis[2]) v[2] *= -0.3; if (axis[1]) v[1] = 0; this.bumpT = 0.5; }
    }
    if (!W.testPosition(p, mn, mx, this.brush)) this.lastFree = p.slice();
  }
  updateFly(dt, far) {
    const g = this.game, pl = g.player, M = this.model, K = this.K, W = g.world, p = this.phys.pos;
    const cell = W.cell(Math.floor(p[0] / 32), Math.floor(p[2] / 32)), floor = cell.solid ? p[1] - 60 : cell.f;
    // ceiling: the lowest of here and just ahead, so he drops down to fit through doorways instead of bumping the wall above them
    let ceil = cell.solid ? p[1] + 60 : cell.c; const fv = this.flyVel, sp = Math.hypot(fv[0], fv[2]) || 1;
    for (const dd of [24, 48]) { const ah = W.cell(Math.floor((p[0] + fv[0] / sp * dd) / 32), Math.floor((p[2] + fv[2] / sp * dd) / 32)); if (!ah.solid) ceil = Math.min(ceil, ah.c); }
    if (this.alive) {
      const foe = this.foeOf(), tp = foe ? foe.pos : pl.pos;
      const toP = [tp[0] - p[0], tp[2] - p[2]]; const dist = Math.hypot(toP[0], toP[1]);
      this.sightT -= dt;
      if (this.sightT <= 0) { this.sightT = 0.2; this.sees = foe ? this.canSee(foe.eye()) : !g.playerDead && dist < K.sight && this.canSee(pl.eye()); if (!this.awake && (this.sees || (g.noiseT > 0 && dist < 650))) this.wake();
        if (foe) { this.foeLostT = this.sees ? 0 : this.foeLostT + 0.2; if (this.foeLostT > INFIGHT.giveUp) this.foe = null; } }
      const slow = this.pooT > 0 ? TURD.slow : this.sauceT > 0 ? 0.55 : 1, v = this.flyVel, want = [0, 0, 0];
      if (this.awake && (foe || !g.playerDead)) {
        let tgt = tp; if (!foe && !this.sees && this.trailIdx >= 0 && g.trail[this.trailIdx]) tgt = g.trail[this.trailIdx];
        if (foe) { /* straight at the foe */ } else if (this.sees) this.trailIdx = g.trail.length - 1; else if (this.trailIdx >= 0) { const t = g.trail[this.trailIdx]; if (t && Math.hypot(t[0] - p[0], t[2] - p[2]) < 60 && this.trailIdx < g.trail.length - 1) this.trailIdx++; }
        const dx = tgt[0] - p[0], dz = tgt[2] - p[2], d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
        const radial = this.sees ? (d > K.keepDist + 60 ? 1 : d < K.keepDist - 80 ? -0.8 : 0) : 1;
        const orbit = this.sees ? Math.sin(g.time * 0.6 + this.bobPh) * 0.9 : 0;
        want[0] = (ux * radial - uz * orbit) * K.speed * slow; want[2] = (uz * radial + ux * orbit) * K.speed * slow;
        const hy = Math.min(ceil - 36, Math.max(floor + 60, tgt[1] + K.hover)) + Math.sin(g.time * 1.8 + this.bobPh) * 10;
        want[1] = Math.max(-140, Math.min(140, (hy - p[1]) * 2.2));
        this.faceTowards(tp, dt, 5);
        // spit a slow fireball
        this.fireCd -= dt;
        if (this.sees && dist < K.attackRange && this.fireCd <= 0 && this.state !== 'pain') {
          this.fireCd = K.fireCd[0] + Math.random() * (K.fireCd[1] - K.fireCd[0]);
          const f = [-Math.sin(this.phys.yaw), -Math.cos(this.phys.yaw)], from = [p[0] + f[0] * 22, p[1] + 30, p[2] + f[1] * 22];
          const e = foe ? foe.eye() : pl.eye(), tx = e[0] - from[0], ty = e[1] - 6 - from[1], tz = e[2] - from[2], l = Math.hypot(tx, ty, tz) || 1;
          g.spawnFireball(from, [tx / l * K.fireSpeed, ty / l * K.fireSpeed, tz / l * K.fireSpeed], this); g.sfx.play('fireSpit');
          M.playEmote('pain', 0.1); M.actions.pain.timeScale = 2.5; this.emoteT = 0.35;
        }
      } else { want[1] = (Math.max(floor + 60, Math.min(ceil - 36, this.homeY || (this.homeY = p[1]))) + Math.sin(g.time * 1.5 + this.bobPh) * 8 - p[1]) * 1.5; }
      const k = Math.min(1, dt * 2.5); for (let a = 0; a < 3; a++) v[a] += (want[a] - v[a]) * k;
      this.flyMove(v, dt);
      if (this.emoteT > 0) { this.emoteT -= dt; if (this.emoteT <= 0) { M.emote = null; M.setState('run', 0.2, true); } }
      if (this.state === 'pain' && this.stateT > 0.6) { this.state = 'chase'; M.emote = null; M.setState('run', 0.2, true); }
      if (this.awake && !this.flyAnim && !M.emote) { this.flyAnim = true; M.setState('run', 0.2, true); }
      M.actions.run && (M.actions.run.timeScale = 0.6);
      if (Math.random() < dt * 8) g.particles.spawn([p[0] + (Math.random() - 0.5) * 30, p[1] - 10 + Math.random() * 50, p[2] + (Math.random() - 0.5) * 30], [0, -10, 0], [0.35, 1, 0.45], 0.9, -15, 1);
    } else { // falls out of the air when killed
      this.flyVel[1] -= 700 * dt; this.flyVel[0] *= 0.96; this.flyVel[2] *= 0.96; this.flyMove(this.flyVel, dt);
      if (!this.exploded && this.stateT > K.explodeAt) { this.exploded = true; M.root.visible = false; this.glow.visible = false; g.deathPile(this); return; }
    }
    this.syncBrush();
    if (this.inView) M.update(dt + (this.animSkip || 0)), this.animSkip = 0; else this.animSkip = Math.min(1, (this.animSkip || 0) + dt);
    M.root.position.set(p[0], p[1] - 38, p[2]); M.root.rotation.y = this.phys.yaw + Math.PI;
    this.glow.position.set(p[0], p[1] + 2, p[2]); this.glow.visible = !!this.inView; this.glow.material.opacity = (this.alive ? 0.45 : Math.max(0, 0.45 - this.stateT * 0.2)) + 0.1 * Math.sin(g.time * 4 + this.bobPh);
    let r = 0.18, gg = 0.75, b = 0.3;
    if (this.acidT > 0) { r += 0.4; gg += 0.3; }
    if (this.pooT > 0) { r = 0.45; gg = 0.28; b = 0.1; }
    if (this.sauceT > 0) { r = 0.9; gg = 0.12; b = 0.06; }
    if (this.flashT > 0) { r += 0.8; gg += 0.6; b += 0.4; }
    for (const m of M.mats) m.emissive.setRGB(r, gg, b);
  }
  aimAt() { const f = this.foeOf(); if (f) return { pos: f.pos, vel: f.phys.vel, eye: f.eye() }; const pl = this.game.player; return { pos: pl.pos, vel: pl.vel, eye: pl.eye() }; }
  throwPotato() {
    const g = this.game, pl = this.aimAt(); const from = [this.pos[0], this.pos[1] + 14, this.pos[2]];
    const target = [pl.pos[0] + pl.vel[0] * 0.25, pl.pos[1] + 8, pl.pos[2] + pl.vel[2] * 0.25];
    const dx = target[0] - from[0], dy = target[1] - from[1], dz = target[2] - from[2]; const dh = Math.hypot(dx, dz);
    const T = Math.max(0.25, dh / BEANS.potatoSpeed);
    const v = [dx / T + (Math.random() - 0.5) * dh * 0.05, dy / T + 0.5 * BEANS.potatoGravity * T, dz / T + (Math.random() - 0.5) * dh * 0.05];
    g.spawnPotato(from, v, this); g.sfx.play('potatoThrow');
  }
  throwTissue() {
    const g = this.game, pl = this.aimAt(); const from = [this.pos[0], this.pos[1] + 34, this.pos[2]];
    const target = [pl.pos[0] + pl.vel[0] * 0.3, pl.pos[1] + 10, pl.pos[2] + pl.vel[2] * 0.3];
    const dx = target[0] - from[0], dy = target[1] - from[1], dz = target[2] - from[2]; const dh = Math.hypot(dx, dz);
    const T = Math.max(0.25, dh / MARV.tissueSpeed);
    const v = [dx / T + (Math.random() - 0.5) * dh * 0.05, dy / T + 0.5 * MARV.tissueGravity * T, dz / T + (Math.random() - 0.5) * dh * 0.05];
    g.spawnTissue(from, v, this); g.sfx.play('sneeze');
  }
  throwChicken() {
    const g = this.game, pl = this.aimAt(); const from = [this.pos[0] + Math.sin(-this.phys.yaw) * 0 , this.pos[1] + 30, this.pos[2]];
    const target = [pl.pos[0] + pl.vel[0] * 0.25, pl.pos[1] + 8, pl.pos[2] + pl.vel[2] * 0.25];
    const dx = target[0] - from[0], dy = target[1] - from[1], dz = target[2] - from[2]; const dh = Math.hypot(dx, dz);
    const T = Math.max(0.25, dh / QOQ.chickenSpeed);
    const spread = 0.05;
    const v = [dx / T + (Math.random() - 0.5) * dh * spread, dy / T + 0.5 * QOQ.chickenGravity * T, dz / T + (Math.random() - 0.5) * dh * spread];
    g.spawnChicken(from, v, this);
    g.sfx.play('chickenThrow');
  }
  faceTowards(p, dt, rate = 7) {
    const want = Math.atan2(-(p[0] - this.pos[0]), -(p[2] - this.pos[2]));
    let d = want - this.phys.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    this.phys.yaw += Math.max(-rate * dt, Math.min(rate * dt, d)); return Math.abs(d);
  }
  // ---- Boojo: idles until fighting starts nearby, then runs around in a panic, flailing his arms ----
  updateBoojo(dt, far) {
    const g = this.game, pl = g.player, M = this.model, K = this.K;
    if (!this.alive) { this.exploded = true; M.root.visible = false; g.deathPile(this); return; } // pop! tacos everywhere
    const cmd = { forward: 0, side: 0, jump: false, walk: false };
    this.sightT -= dt;
    if (!this.awake && this.sightT <= 0) {
      this.sightT = 0.3;
      let fight = g.noiseT > 0 && Math.hypot(pl.pos[0] - this.pos[0], pl.pos[2] - this.pos[2]) < K.noiseRange;
      if (!fight) for (const o of g.enemies) { if (o === this || o.boojo || !o.alive || o.dormant || !o.awake) continue; if (Math.hypot(o.pos[0] - this.pos[0], o.pos[2] - this.pos[2]) < K.panicRange) { fight = true; break; } }
      if (!fight) for (const o of g.enemies) { if (o === this || !o.alive || o.dormant || o.foe !== this) continue; fight = true; break; } // something is coming for him
      if (fight) this.wake(far < 1400);
    }
    if (this.awake) {
      // run! pick a heading mostly away from the nearest threat, and a new one every second or so or when he runs into something
      this.panicT -= dt; const sp = Math.hypot(this.phys.vel[0], this.phys.vel[2]); this.blockedT = sp < 50 ? (this.blockedT || 0) + dt : 0;
      if (this.panicT <= 0 || this.blockedT > 0.3) {
        let th = pl.pos, td = g.playerDead ? 1e9 : Math.hypot(pl.pos[0] - this.pos[0], pl.pos[2] - this.pos[2]);
        for (const o of g.enemies) { if (o === this || o.boojo || !o.alive || o.dormant || !o.awake) continue; const d = Math.hypot(o.pos[0] - this.pos[0], o.pos[2] - this.pos[2]); if (d < td) { td = d; th = o.pos; } }
        const away = Math.atan2(-(this.pos[0] - th[0]), -(this.pos[2] - th[2]));
        this.panicYaw = this.blockedT > 0.3 || Math.random() < 0.3 ? this.phys.yaw + Math.PI * (0.5 + Math.random()) * (Math.random() < 0.5 ? -1 : 1) : away + (Math.random() - 0.5) * 2.2;
        this.panicT = 0.6 + Math.random() * 1.3; this.blockedT = 0;
      }
      let d = this.panicYaw - this.phys.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      this.phys.yaw += Math.max(-9 * dt, Math.min(9 * dt, d)); cmd.forward = Math.abs(d) < 1.6 ? 1 : 0.3;
      this.yelpT -= dt; if (this.yelpT <= 0) { this.yelpT = 1.4 + Math.random() * 2.2; if (far < 900) g.sfx.play('boojoPanic'); }
    } else if (!g.playerDead && Math.hypot(pl.pos[0] - this.pos[0], pl.pos[2] - this.pos[2]) < 64 && Math.abs(pl.pos[1] - this.pos[1]) < 40) { // CornPop bumps into him: shuffle out of the way
      const away = Math.atan2(-(this.pos[0] - pl.pos[0]), -(this.pos[2] - pl.pos[2])); let d = away + 0.5 - this.phys.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      this.phys.yaw += Math.max(-6 * dt, Math.min(6 * dt, d)); cmd.forward = 0.45; this.idleYaw = this.phys.yaw;
    } else { // just standing around, now and then looking about
      this.idleTurnT -= dt; if (this.idleTurnT <= 0) { this.idleTurnT = 3 + Math.random() * 5; this.idleYaw = this.phys.yaw + (Math.random() - 0.5) * 2.4; }
      let d = this.idleYaw - this.phys.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; this.phys.yaw += Math.max(-1.5 * dt, Math.min(1.5 * dt, d));
    }
    this.phys.maxspeed = K.speed * (this.pooT > 0 ? TURD.slow : this.sauceT > 0 ? 0.55 : 1);
    const pb = g.playerBrush; pb && (pb.solid = true);
    let left = dt; while (left > 0) { const s = Math.min(left, 1 / 60); this.phys.update(s, cmd); left -= s; }
    if (pb) pb.solid = false;
    this.phys.events.length = 0; this.syncBrush();
    M.setState(this.awake ? 'run' : cmd.forward ? 'walk' : 'idle', 0.2); if (M.actions.run) M.actions.run.timeScale = this.awake ? 1.25 : 1;
    M.root.position.set(this.pos[0], this.pos[1] - 24, this.pos[2]); M.root.rotation.y = this.phys.yaw + Math.PI;
    if (this.inView) {
      M.update(dt + (this.animSkip || 0)); this.animSkip = 0;
      if (this.awake && this.arms && far < 1600) { // arms up over his head, waving wildly
        M.root.updateMatrixWorld(true); const t = g.time * 15 + this.flailPh, y = this.phys.yaw, rx = Math.cos(y), rz = -Math.sin(y), fx = -Math.sin(y), fz = -Math.cos(y);
        for (const a of this.arms) {
          const ph = t + (a.side > 0 ? 0 : 1.9), sw = Math.sin(ph), sw2 = Math.sin(ph * 1.7 + 0.6), out = 0.55 + 0.35 * sw;
          aimBone(a.up, a.lo, _av1.set(rx * a.side * out + fx * 0.35 * sw2, 1, rz * a.side * out + fz * 0.35 * sw2).normalize().clone(), 0.85);
          aimBone(a.lo, a.hand, _av1.set(rx * a.side * (0.2 + 0.6 * Math.sin(ph * 1.3)) + fx * 0.4 * Math.cos(ph), 1, rz * a.side * (0.2 + 0.6 * Math.sin(ph * 1.3)) + fz * 0.4 * Math.cos(ph)).normalize().clone(), 0.85);
        }
      }
    } else this.animSkip = Math.min(1, (this.animSkip || 0) + dt);
    const L = g.pointLight([this.pos[0], this.pos[1] + 8, this.pos[2]]);
    let r = L[0] * 0.4, gg = L[1] * 0.4, b = L[2] * 0.4; // his texture is pale: a bit less light than the others
    if (this.acidT > 0) { const k = 0.35 + 0.25 * Math.sin(g.time * 18); r += k * 0.8; gg += k; b *= 0.6; }
    if (this.pooT > 0) { r = r * 0.55 + 0.18; gg = gg * 0.38 + 0.08; b *= 0.2; }
    if (this.sauceT > 0) { const k = 0.5 + 0.2 * Math.sin(g.time * 12); r = r * 0.6 + k; gg *= 0.3; b *= 0.25; }
    if (this.flashT > 0) { r += 0.8; gg += 0.6; b += 0.2; }
    for (const m of M.mats) m.emissive.setRGB(r, gg, b);
  }
  update(dt) {
    const g = this.game, pl = g.player, M = this.model;
    if (this.dormant || this.exploded) return;
    if (this.alive && this.pos[1] < -1000) { this.die(); this.exploded = true; this.model.root.visible = false; return; } // fell out of the world: remove it so its wave can finish
    // LOD: sleeping Qoqs far away only think a few times a second and skip animation
    const far = Math.hypot(this.pos[0] - pl.pos[0], this.pos[2] - pl.pos[2]);
    // cheap PVS: only draw Qoqs the camera could actually see (line of sight to head or feet)
    this.visT = (this.visT || 0) - dt;
    if (this.visT <= 0) {
      this.visT = 0.15 + Math.random() * 0.1;
      const cam = g.camera.position, e = [cam.x, cam.y, cam.z];
      this.inView = far < 2600 && (g.world.rayFrac(e, [this.pos[0], this.pos[1] + 30, this.pos[2]]) > 0.98 || g.world.rayFrac(e, [this.pos[0], this.pos[1] - 12, this.pos[2]]) > 0.98 || g.world.rayFrac(e, [this.pos[0] + 14, this.pos[1] + 10, this.pos[2] + 14]) > 0.98);
    }
    M.root.visible = !!this.inView;
    if (!this.awake && this.alive && far > 1500) { this.lodT -= dt; if (this.lodT > 0) return; this.lodT = 0.5; dt = 0.5; }
    if (!this.alive && far > 1800 && this.stateT > 4) return;
    // acid damage over time + effects
    if (this.acidT > 0 && this.alive) {
      this.acidT -= dt; this.health -= SOAKER.acidDps * dt;
      if (Math.random() < dt * 30) g.particles.spawn([this.pos[0] + (Math.random() - 0.5) * 24, this.pos[1] + Math.random() * 40 - 10, this.pos[2] + (Math.random() - 0.5) * 24], [0, 30 + Math.random() * 30, 0], [0.85, 0.95, 0.2], 0.7, -20, 1.5);
      if (Math.random() < dt * 3) g.sfx.play('sizzle');
      if (this.health <= 0) this.die();
    }
    this.flashT -= dt; this.stateT = (this.stateT || 0) + dt;
    if (this.pooT > 0) { this.pooT -= dt; if (Math.random() < dt * 14) g.particles.spawn([this.pos[0] + (Math.random() - 0.5) * 26, this.pos[1] + Math.random() * 40 - 6, this.pos[2] + (Math.random() - 0.5) * 26], [0, -30, 0], [0.42, 0.24, 0.1], 0.6, 400); }
    if (this.sauceT > 0) { this.sauceT -= dt; if (Math.random() < dt * 18) g.particles.spawn([this.pos[0] + (Math.random() - 0.5) * 24, this.pos[1] + Math.random() * 40 - 6, this.pos[2] + (Math.random() - 0.5) * 24], [0, -20, 0], [0.75, 0.08, 0.04], 0.6, 450); }
    if (this.K.fly) return this.updateFly(dt, far);
    if (this.boojo) return this.updateBoojo(dt, far);
    this.phys.maxspeed = this.K.speed * (this.pooT > 0 ? TURD.slow : this.sauceT > 0 ? 0.55 : 1);
    const cmd = { forward: 0, side: 0, jump: false, walk: false };
    if (this.alive) {
      let foe = this.foeOf(); const tp = foe ? foe.pos : pl.pos;
      const toP = [tp[0] - this.pos[0], tp[2] - this.pos[2]]; const dist = Math.hypot(toP[0], toP[1]);
      // sight
      this.sightT -= dt;
      if (this.sightT <= 0) {
        this.sightT = 0.2;
        // Ballinkis go after any Boojo they spot nearby
        if (this.kind === 'ballinki' && !foe) {
          let best = null, bd = this.awake ? INFIGHT.ballinkiBoojoRange * 0.75 : INFIGHT.ballinkiBoojoRange;
          for (const o of g.enemies) { if (!o.boojo || !o.alive || o.dormant) continue; const d = Math.hypot(o.pos[0] - this.pos[0], o.pos[1] - this.pos[1], o.pos[2] - this.pos[2]); if (d < bd && this.canSee(o.eye())) { bd = d; best = o; } }
          if (best) { this.foe = foe = best; this.foeLostT = 0; this.foeOnly = !this.awake; if (!this.awake) { this.awake = true; this.state = 'chase'; this.model.setState('run', 0.2, true); } this.attackCd = Math.min(this.attackCd, 0.5); }
        }
        if (foe) { this.sees = Math.hypot(foe.pos[0] - this.pos[0], foe.pos[2] - this.pos[2]) < this.K.sight && this.canSee(foe.eye()); this.foeLostT = this.sees ? 0 : this.foeLostT + 0.2; if (this.foeLostT > INFIGHT.giveUp) { this.foe = null; this.sees = false; } }
        else this.sees = !g.playerDead && dist < this.K.sight && this.canSee(pl.eye());
        if (!this.awake && this.sees) {
          const f = [-Math.sin(this.phys.yaw), -Math.cos(this.phys.yaw)]; const dotv = (f[0] * toP[0] + f[1] * toP[1]) / (dist || 1);
          if (dotv > -0.1 || dist < 220) this.wake();
        }
        if (!this.awake && g.noiseT > 0 && dist < 650 && (this.sees || dist < 300)) this.wake();
        // choose a chase target: the player if visible, else the newest point on the player's trail we can see
        if (this.awake && !this.sees && !this.foe) {
          let pick = -1; const trail = g.trail;
          for (let i = trail.length - 1; i >= Math.max(0, this.trailIdx); i--) if (this.canSee([trail[i][0], trail[i][1] + 22, trail[i][2]])) { pick = i; break; }
          if (pick >= 0) this.trailIdx = pick;
        }
      }
      foe = this.foe;
      if (this.awake && (foe || !g.playerDead)) {
        if (this.state === 'chase') {
          this.attackCd -= dt;
          let target = foe ? foe.pos : this.sees ? pl.pos : (this.trailIdx >= 0 && g.trail[this.trailIdx]) || pl.pos;
          if (!foe && !this.sees && this.trailIdx >= 0) { const t = g.trail[this.trailIdx]; if (t && Math.hypot(t[0] - this.pos[0], t[2] - this.pos[2]) < 40 && this.trailIdx < g.trail.length - 1) this.trailIdx++; }
          if (this.sees && !foe) this.trailIdx = g.trail.length - 1;
          this.faceTowards(target, dt);
          const close = this.sees && dist < (this.K.closeDist || 150);
          if (this.turret) { /* stays on its perch */ }
          else if (this.dodgeT > 0) { this.dodgeT -= dt; cmd.forward = 0.6; cmd.side = this.dodgeDir; }
          else if (!close) cmd.forward = 1;
          if (!this.turret && this.phys.onground && this.blockedT > 0.25 && target[1] - this.pos[1] > 12 && target[1] - this.pos[1] < (this.K.maxClimb || 60)) { cmd.jump = true; this.blockedT = 0; }
          if (this.kind === 'ballinki' && this.phys.onground && dist > 220 && Math.random() < dt * 0.7) { cmd.jump = true; this.hopT = 0.6; } // bouncy hops while chasing
          if (this.sees && dist < (this.turret ? this.K.attackRange * 1.3 : this.K.attackRange) && this.attackCd <= 0) { this.state = 'attack'; this.stateT = 0; this.thrown = false; M.playEmote('attack', 0.1); M.actions.attack.timeScale = this.K.attackScale; }
          // stuck? sidestep (Quake's movetogoal picks a new direction when blocked)
          this.stuckT += dt;
          const sp = Math.hypot(this.phys.vel[0], this.phys.vel[2]); this.blockedT = cmd.forward > 0 && sp < 40 ? (this.blockedT || 0) + dt : 0;
          if (!this.turret && this.stuckT > 0.45) { const moved = Math.hypot(this.pos[0] - this.lastPos[0], this.pos[2] - this.lastPos[2]); if (moved < 12 && cmd.forward > 0) { this.dodgeT = 0.5 + Math.random() * 0.4; this.dodgeDir = Math.random() < 0.5 ? -1 : 1; } this.lastPos = this.pos.slice(); this.stuckT = 0; }
        } else if (this.state === 'attack') {
          this.faceTowards(foe ? foe.pos : pl.pos, dt, 10);
          if (foe && this.kind === 'ballinki' && !this.thrown && dist > 45) cmd.forward = 1; // keeps after a fleeing victim while winding up
          if (!this.thrown && this.stateT > this.K.release) { this.thrown = true; if (this.kind === 'marv') this.throwTissue(); else if (this.kind === 'ballinki') this.fart(); else if (this.kind === 'beans') this.throwPotato(); else this.throwChicken(); }
          if (this.stateT > this.K.attackEnd) { this.state = 'chase'; this.attackCd = 1.0 + Math.random() * 1.6; M.emote = null; M.setState('run', 0.2, true); }
        } else if (this.state === 'pain') { if (this.stateT > 0.5) { this.state = 'chase'; M.emote = null; M.setState('run', 0.15, true); } }
      }
    }
    // physics + collision with the world (and the player, via the player's own hull brush)
    const pb = g.playerBrush; pb && (pb.solid = this.alive);
    let left = dt; while (left > 0) { const s = Math.min(left, 1 / 60); this.phys.update(s, cmd); left -= s; }
    if (pb) pb.solid = false;
    this.phys.events.length = 0; this.syncBrush();
    if (this.alive && this.state === 'chase') M.drive(this.phys.speed, this.phys.onground);
    if (this.alive && M.actions.run) M.actions.run.timeScale = Math.max(0.6, this.phys.speed / 260);
    if (!this.alive && this.stateT > 2.4) { const a = M.actions.death; if (a.time > this.K.deathHold) a.paused = true; }
    if (!this.alive && this.stateT > this.K.explodeAt) { this.exploded = true; M.root.visible = false; g.deathPile(this); return; } // pop!
    if (this.inView) M.update(dt + (this.animSkip || 0)), this.animSkip = 0; else this.animSkip = Math.min(1, (this.animSkip || 0) + dt);
    M.root.position.set(this.pos[0], this.pos[1] - 24 + (!this.alive && this.K.deathLift ? this.K.deathLift * Math.min(1, this.stateT / 0.5) : 0), this.pos[2]); M.root.rotation.y = this.phys.yaw + Math.PI;
    if (this.K.throwHop) { const k = this.alive && this.state === 'attack' ? Math.sin(Math.min(1, this.stateT / this.K.attackEnd) * Math.PI) : 0; M.root.position.y += k * 7; M.root.rotation.order = 'YXZ'; M.root.rotation.x = this.state === 'attack' ? (this.stateT < this.K.release ? -0.35 : 0.3) * k : 0; } // wind-up and throw
    if (this.K.tipDeath) { M.root.rotation.order = 'YXZ'; const k = this.alive ? 0 : Math.min(1, this.stateT / 0.45); M.root.rotation.x = -k * k * Math.PI / 2; M.root.position.y += k * 10; } // keels over backwards
    // per-model lighting sampled from the lightmap world, plus hurt / acid tints
    const L = g.pointLight([this.pos[0], this.pos[1] + 8, this.pos[2]]);
    let r = L[0] * 0.62, gg = L[1] * 0.62, b = L[2] * 0.62;
    if (this.acidT > 0) { const k = 0.35 + 0.25 * Math.sin(g.time * 18); r += k * 0.8; gg += k; b *= 0.6; }
    if (this.pooT > 0) { r = r * 0.55 + 0.18; gg = gg * 0.38 + 0.08; b *= 0.2; }
    if (this.sauceT > 0) { const k = 0.5 + 0.2 * Math.sin(g.time * 12); r = r * 0.6 + k; gg *= 0.3; b *= 0.25; }
    if (this.flashT > 0) { r += 0.8; gg += 0.6; b += 0.2; }
    for (const m of M.mats) m.emissive.setRGB(r, gg, b);
  }
}

// ---------------------------------------------------------------- the weapon (first-person)
export class Soaker {
  constructor(game) {
    this.game = game; this.model = makeSoaker();
    this.scene = new THREE.Scene(); vmKey(this.scene); this.cam = new THREE.PerspectiveCamera(60, 1, 0.5, 200);
    this.holder = new THREE.Group(); this.holder.add(this.model); this.scene.add(this.holder);
    this.model.scale.setScalar(0.38); this.model.position.set(8, -7, -15.5); this.model.rotation.set(0.06, 0.32, -0.04);
    this.cool = 0; this.kick = 0; this.raise = 1; this.pumpT = 0; this.firing = false; this.emptyT = 0;
  }
  nozzleWorld(camera) {
    const v = this.model.userData.nozzle.clone(); this.model.updateMatrixWorld(true); v.applyMatrix4(this.model.matrixWorld);
    // view-model space -> world: same orientation as the main camera, scaled down so the stream starts just in front of the eye
    v.multiplyScalar(1); v.applyQuaternion(camera.quaternion); return [camera.position.x + v.x, camera.position.y + v.y, camera.position.z + v.z];
  }
  update(dt, firing, camera, player) {
    const g = this.game; this.cool -= dt; this.emptyT -= dt; this.raise = Math.max(0, this.raise - dt * 5);
    this.firing = false;
    if (firing && this.raise < 0.3) {
      if (g.ammo <= 0) { if (this.emptyT <= 0) { g.sfx.play('empty'); g.hud.centerPrint('Out of juice! Find a yellow jug.', 1.5); this.emptyT = 1.2; } }
      else {
        this.firing = true;
        while (this.cool <= 0) {
          this.cool += 1 / SOAKER.rate; g.ammo--; this.kick = Math.min(1, this.kick + 0.35);
          const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
          dir.x += (Math.random() - 0.5) * 0.03; dir.y += (Math.random() - 0.5) * 0.03 + 0.02; dir.z += (Math.random() - 0.5) * 0.03; dir.normalize();
          const from = this.nozzleWorld(camera);
          const pv = player.vel; g.spawnDroplet(from, [dir.x * SOAKER.speed + pv[0] * 0.5, dir.y * SOAKER.speed + pv[1] * 0.3, dir.z * SOAKER.speed + pv[2] * 0.5]);
          g.noiseT = 0.5; if (g.ammo <= 0) break;
        }
      }
    }
    if (!this.firing) this.cool = Math.max(this.cool, 0);
    g.sfx.spray(this.firing);
    this.kick *= Math.exp(-dt * 10); this.pumpT += dt * (this.firing ? 14 : 0);
    // bob & sway with the player's movement (Quake's weapon bob)
    const bob = player.bob || 0, t = g.time;
    const sp = Math.min(1, player.speed / 320);
    this.holder.position.set(Math.sin(t * 5.2) * 0.5 * sp, bob * 0.1 - this.raise * 9 + Math.abs(Math.cos(t * 5.2)) * 0.3 * sp, this.kick * 0.9);
    this.holder.rotation.set(this.kick * 0.06, 0, (player.roll || 0) * 2);
    const u = this.model.userData; u.pump.position.z = -12 + Math.sin(this.pumpT) * 2.2 * (this.firing ? 1 : 0);
    const fill = Math.max(0.02, g.ammo / SOAKER.maxAmmo); u.tank.scale.set(1, fill, 1); u.tank.position.z = -2 + 6 * (1 - fill);
    const L = g.pointLight(player.eye());
    const k = [Math.min(1.6, 0.35 + L[0] * 0.8), Math.min(1.6, 0.35 + L[1] * 0.8), Math.min(1.6, 0.35 + L[2] * 0.8)];
    const base = [0x5ad020, 0x2a7a18, 0xff7a10, 0xffd020];
    u.mats.slice(0, 4).forEach((m, i) => { const c = new THREE.Color(base[i]); m.color.setRGB(c.r * k[0], c.g * k[1], c.b * k[2]); });
  }
  render(renderer, camera) {
    this.cam.fov = camera.fov; this.cam.aspect = camera.aspect; this.cam.updateProjectionMatrix(); squashDepth(this.cam);
    renderer.autoClear = false; renderer.render(this.scene, this.cam); renderer.autoClear = true;
  }
}

// ---------------------------------------------------------------- the turd launcher (first-person)
export class TurdLauncher {
  constructor(game) {
    this.game = game; this.model = makeTurdLauncher();
    this.scene = new THREE.Scene(); vmKey(this.scene); this.cam = new THREE.PerspectiveCamera(60, 1, 0.5, 200);
    this.holder = new THREE.Group(); this.holder.add(this.model); this.scene.add(this.holder);
    this.model.scale.setScalar(0.38); this.model.position.set(5.6, -5.2, -10); this.model.rotation.set(0.04, 0.07, -0.03);
    this.cool = 0; this.kick = 0; this.raise = 1; this.emptyT = 0;
  }
  muzzleWorld(camera) { const v = this.model.userData.muzzle.clone(); this.model.updateMatrixWorld(true); v.applyMatrix4(this.model.matrixWorld); v.applyQuaternion(camera.quaternion); return [camera.position.x + v.x, camera.position.y + v.y, camera.position.z + v.z]; }
  update(dt, firing, camera, player) {
    const g = this.game; this.cool -= dt; this.emptyT -= dt; this.raise = Math.max(0, this.raise - dt * 5);
    if (firing && this.raise < 0.3 && this.cool <= 0) {
      if (g.turds <= 0) { if (this.emptyT <= 0) { g.sfx.play('empty'); g.hud.centerPrint('Out of turds! Find a box.', 1.2); this.emptyT = 1.2; g.autoSwitch(); } }
      else {
        g.turds--; this.cool = TURD.cooldown; this.kick = 1; g.sfx.play('turdLaunch'); g.noiseT = 1.2; g.input.rumble(0.6, 0.7, 180);
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); dir.y += 0.02; dir.normalize();
        const from = this.muzzleWorld(camera);
        g.spawnTurd(from, [dir.x * TURD.speed, dir.y * TURD.speed, dir.z * TURD.speed]);
        for (let k = 0; k < 8; k++) g.particles.spawn(from, [dir.x * 120 + (Math.random() - 0.5) * 80, dir.y * 120 + Math.random() * 50, dir.z * 120 + (Math.random() - 0.5) * 80], [0.55, 0.35, 0.18], 0.5, -20, 2);
      }
    }
    this.kick *= Math.exp(-dt * 6);
    const u = this.model.userData; u.loaded.visible = this.cool < TURD.cooldown * 0.45 && g.turds > 0;
    const bob = player.bob || 0, t = g.time, sp = Math.min(1, player.speed / 320);
    this.holder.position.set(Math.sin(t * 5.2) * 0.5 * sp, bob * 0.1 - this.raise * 10 + Math.abs(Math.cos(t * 5.2)) * 0.3 * sp, this.kick * 3.5);
    this.holder.rotation.set(this.kick * 0.22, 0, (player.roll || 0) * 2);
    const L = g.pointLight(player.eye());
    const k = [Math.min(1.6, 0.35 + L[0] * 0.8), Math.min(1.6, 0.35 + L[1] * 0.8), Math.min(1.6, 0.35 + L[2] * 0.8)];
    u.mats.forEach((m, i) => { const c = new THREE.Color(u.base[i]); m.color.setRGB(c.r * k[0], c.g * k[1], c.b * k[2]); });
  }
  render(renderer, camera) {
    this.cam.fov = camera.fov; this.cam.aspect = camera.aspect; this.cam.updateProjectionMatrix(); squashDepth(this.cam);
    renderer.autoClear = false; renderer.render(this.scene, this.cam); renderer.autoClear = true;
  }
}

// ---------------------------------------------------------------- the CC-9000 candy corn machine gun (first-person)
export class CandyGun {
  constructor(game) {
    this.game = game; this.model = makeCandyGun();
    this.scene = new THREE.Scene(); vmKey(this.scene); this.cam = new THREE.PerspectiveCamera(60, 1, 0.5, 200);
    this.holder = new THREE.Group(); this.holder.add(this.model); this.scene.add(this.holder);
    this.model.scale.setScalar(0.4); this.model.position.set(4.4, -5.0, -10.5); this.model.rotation.set(0.05, 0.06, -0.02);
    this.cool = 0; this.kick = 0; this.raise = 1; this.emptyT = 0; this.spinV = 0; this.angle = 0; this.firing = false;
  }
  muzzleWorld(camera) { const v = this.model.userData.muzzle.clone(); this.model.updateMatrixWorld(true); v.applyMatrix4(this.model.matrixWorld); v.applyQuaternion(camera.quaternion); return [camera.position.x + v.x, camera.position.y + v.y, camera.position.z + v.z]; }
  update(dt, firing, camera, player) {
    const g = this.game; this.cool -= dt; this.emptyT -= dt; this.raise = Math.max(0, this.raise - dt * 5);
    const want = firing && this.raise < 0.3 && g.candy > 0;
    this.spinV += ((want ? 1 : 0) - this.spinV) * Math.min(1, dt / (want ? CANDYGUN.spinUp : 0.8));
    this.firing = false;
    if (firing && this.raise < 0.3 && g.candy <= 0) { if (this.emptyT <= 0) { g.sfx.play('empty'); g.hud.centerPrint('Out of candy corn! Find a bag.', 1.2); this.emptyT = 1.2; g.autoSwitch(); } }
    if (want && this.spinV > 0.75) {
      this.firing = true;
      while (this.cool <= 0 && g.candy > 0) {
        this.cool += 1 / CANDYGUN.rate; g.candy--; this.kick = Math.min(1, this.kick + 0.3); g.noiseT = 0.8; g.sfx.play('candyShot'); g.input.rumble(0.25, 0.1, 50);
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        dir.x += (Math.random() - 0.5) * CANDYGUN.spread; dir.y += (Math.random() - 0.5) * CANDYGUN.spread * 0.7 + 0.008; dir.z += (Math.random() - 0.5) * CANDYGUN.spread; dir.normalize();
        const from = this.muzzleWorld(camera);
        g.spawnCandy(from, [dir.x * CANDYGUN.speed, dir.y * CANDYGUN.speed, dir.z * CANDYGUN.speed]);
        for (let k = 0; k < 3; k++) g.particles.spawn(from, [dir.x * 150 + (Math.random() - 0.5) * 90, dir.y * 150 + Math.random() * 60, dir.z * 150 + (Math.random() - 0.5) * 90], [1, 0.8, 0.3], 0.18, 0, 3);
        // ejected wrappers
        const r = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion), e = player.eye();
        g.particles.spawn([e[0] + r.x * 10 + dir.x * 14, e[1] - 6, e[2] + r.z * 10 + dir.z * 14], [r.x * 110 + (Math.random() - 0.5) * 40, 60 + Math.random() * 50, r.z * 110 + (Math.random() - 0.5) * 40], Math.random() < 0.5 ? [1, 0.55, 0.1] : [1, 0.95, 0.85], 0.9, 500);
      }
    } else this.cool = Math.max(this.cool, 0);
    g.sfx.mg(this.firing);
    if (this.spinV > 0.05) g.sfx.spin(this.spinV); else g.sfx.spin(0);
    this.angle += this.spinV * dt * 24; const u = this.model.userData; u.spin.rotation.z = this.angle;
    u.kernels.forEach((c, i) => { c.visible = g.candy > i * 30; if (this.firing) c.position.y += Math.sin(g.time * 40 + i) * 0.05; });
    this.kick *= Math.exp(-dt * 14);
    const bob = player.bob || 0, t = g.time, sp = Math.min(1, player.speed / 320), shake = this.firing ? (Math.random() - 0.5) * 0.25 : 0;
    this.holder.position.set(Math.sin(t * 5.2) * 0.5 * sp + shake, bob * 0.1 - this.raise * 10 + Math.abs(Math.cos(t * 5.2)) * 0.3 * sp + shake, this.kick * 0.8);
    this.holder.rotation.set(this.kick * 0.04, 0, (player.roll || 0) * 2);
    const L = g.pointLight(player.eye());
    const k = [Math.min(1.6, 0.35 + L[0] * 0.8), Math.min(1.6, 0.35 + L[1] * 0.8), Math.min(1.6, 0.35 + L[2] * 0.8)];
    u.mats.forEach((m, i) => { const c = new THREE.Color(u.base[i]); m.color.setRGB(c.r * k[0], c.g * k[1], c.b * k[2]); });
  }
  render(renderer, camera) {
    this.cam.fov = camera.fov; this.cam.aspect = camera.aspect; this.cam.updateProjectionMatrix(); squashDepth(this.cam);
    renderer.autoClear = false; renderer.render(this.scene, this.cam); renderer.autoClear = true;
  }
}

// ---------------------------------------------------------------- the double-barrel sausage shotgun (first-person)
export class Shotgun {
  constructor(game) {
    this.game = game; this.model = makeShotgun();
    this.scene = new THREE.Scene(); vmKey(this.scene); this.cam = new THREE.PerspectiveCamera(60, 1, 0.5, 200);
    this.holder = new THREE.Group(); this.holder.add(this.model); this.scene.add(this.holder);
    this.model.scale.setScalar(0.42); this.model.position.set(3.6, -5.4, -9.5); this.model.rotation.set(0.07, 0.05, -0.02);
    this.cool = 0; this.kick = 0; this.raise = 1; this.emptyT = 0;
  }
  muzzleWorld(camera, i) {
    const v = this.model.userData.muzzle[i].clone(); this.model.updateMatrixWorld(true); v.applyMatrix4(this.model.matrixWorld);
    v.applyQuaternion(camera.quaternion); return [camera.position.x + v.x, camera.position.y + v.y, camera.position.z + v.z];
  }
  update(dt, firing, camera, player) {
    const g = this.game; this.cool -= dt; this.emptyT -= dt; this.raise = Math.max(0, this.raise - dt * 5);
    if (firing && this.raise < 0.3 && this.cool <= 0) {
      if (g.sausages < SHOTGUN.perShot) { if (this.emptyT <= 0) { g.sfx.play('empty'); g.hud.centerPrint('Out of sausages!', 1.2); this.emptyT = 1.2; g.autoSwitch(); } }
      else {
        g.sausages -= SHOTGUN.perShot; this.cool = SHOTGUN.cooldown; this.kick = 1; g.sfx.play('shotgun'); g.noiseT = 1.2; g.input.rumble(0.5, 0.9, 160);
        const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        for (let i = 0; i < 2; i++) {
          const dir = fwd.clone().addScaledVector(right, (i ? 1 : -1) * SHOTGUN.spread * 0.6);
          dir.x += (Math.random() - 0.5) * SHOTGUN.spread; dir.y += (Math.random() - 0.5) * SHOTGUN.spread * 0.6 + 0.012; dir.z += (Math.random() - 0.5) * SHOTGUN.spread; dir.normalize();
          const from = this.muzzleWorld(camera, i);
          g.spawnSausage(from, [dir.x * SHOTGUN.speed, dir.y * SHOTGUN.speed, dir.z * SHOTGUN.speed]);
          for (let k = 0; k < 6; k++) g.particles.spawn(from, [dir.x * 200 + (Math.random() - 0.5) * 120, dir.y * 200 + Math.random() * 80, dir.z * 200 + (Math.random() - 0.5) * 120], [1, 0.75, 0.35], 0.25, 0, 3);
        }
        player.landKick = Math.min(10, (player.landKick || 0) + 2.5);
      }
    }
    this.kick *= Math.exp(-dt * 7);
    const u = this.model.userData; const reload = this.cool > SHOTGUN.cooldown * 0.35;
    u.loaded.forEach(s => s.visible = !reload && g.sausages >= SHOTGUN.perShot);
    // break-open reload: the barrels tip down mid-cooldown
    const br = this.cool > 0 ? Math.sin(Math.min(1, Math.max(0, (SHOTGUN.cooldown - this.cool) / SHOTGUN.cooldown)) * Math.PI) : 0;
    u.barrels.rotation.x = -br * 0.45;
    const bob = player.bob || 0, t = g.time, sp = Math.min(1, player.speed / 320);
    this.holder.position.set(Math.sin(t * 5.2) * 0.5 * sp, bob * 0.1 - this.raise * 10 + Math.abs(Math.cos(t * 5.2)) * 0.3 * sp - br * 1.5, this.kick * 3);
    this.holder.rotation.set(this.kick * 0.35, 0, (player.roll || 0) * 2);
    const L = g.pointLight(player.eye());
    const k = [Math.min(1.6, 0.35 + L[0] * 0.8), Math.min(1.6, 0.35 + L[1] * 0.8), Math.min(1.6, 0.35 + L[2] * 0.8)];
    u.mats.forEach((m, i) => { const c = new THREE.Color(u.base[i]); m.color.setRGB(c.r * k[0], c.g * k[1], c.b * k[2]); });
  }
  render(renderer, camera) {
    this.cam.fov = camera.fov; this.cam.aspect = camera.aspect; this.cam.updateProjectionMatrix(); squashDepth(this.cam);
    renderer.autoClear = false; renderer.render(this.scene, this.cam); renderer.autoClear = true;
  }
}

export { segAabb, lit, Std, vmKey, squashDepth };
