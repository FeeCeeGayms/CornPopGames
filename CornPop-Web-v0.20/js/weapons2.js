// The snack arsenal: five Quake III Arena weapons, made silly.
//   5  FIZZ LAUNCHER      (grenade launcher)  shaken cola cans bounce, fizz, and blow when anything gets close
//   6  SAUCE GUN          (lightning gun)     a continuous stream of hot marinara: slows and stains enemies red
//   7  SPAGHETTI RAILGUN  (railgun)           one noodle punches through every enemy in a line and droops in the air
//   8  JELLY BLASTER      (plasma gun)        rapid wobbly jelly blobs in four flavours, small splash (jelly-jump with it)
//   9  BIG FONDUE GUN     (BFG)               a molten cheese ball that zaps nearby enemies with cheese strings, then erupts
import * as THREE from 'three';
import { Std, vmKey, squashDepth, segAabb } from './combat.js';

export const W2 = {
  cola:   { slot: 5, gun: 'colagun',   ammoItem: 'colapack',  name: 'FIZZ LAUNCHER',     label: 'COLA',   max: 30,  pickup: 10,  box: 5,  low: 3,  col: '#ff6a50', dark: '#8a1a10', pip: '#ff4030',
            cooldown: 0.8, speed: 720, lift: 160, gravity: 800, fuse: 2.3, prox: 72, damage: 100, splash: 150, knock: 420, selfScale: 0.4,
            msg: 'You got the FIZZ LAUNCHER!\nShaken cola cans bounce, fizz up and BLOW\nThey pop early if anything gets close  -  weapon 5' },
  sauce:  { slot: 6, gun: 'saucegun',  ammoItem: 'saucejar',  name: 'SAUCE GUN',         label: 'SAUCE',  max: 200, pickup: 100, box: 50, low: 25, col: '#ff5a40', dark: '#901008', pip: '#e02010',
            rate: 20, damage: 4, range: 768, slowTime: 1.4, knock: 22,
            msg: 'You got the SAUCE GUN!\nHold FIRE for a hot stream of marinara\nSauced enemies are slowed down  -  weapon 6' },
  rail:   { slot: 7, gun: 'railgun',   ammoItem: 'noodlebox', name: 'SPAGHETTI RAILGUN', label: 'NOODLE', max: 20,  pickup: 10,  box: 5,  low: 3,  col: '#ffe08a', dark: '#9a7a20', pip: '#ffd860',
            cooldown: 1.5, damage: 100, range: 8192, knock: 260,
            msg: 'You got the SPAGHETTI RAILGUN!\nOne al dente noodle goes through EVERYTHING in a line\nSlow to reload, so make it count  -  weapon 7' },
  jelly:  { slot: 8, gun: 'jellygun',  ammoItem: 'jellycups', name: 'JELLY BLASTER',     label: 'JELLY',  max: 200, pickup: 60,  box: 40, low: 20, col: '#80ff90', dark: '#208a30', pip: '#50e070',
            rate: 8, speed: 1400, damage: 7, splash: 48, splashDamage: 5, selfScale: 0.3, push: 230,
            msg: 'You got the JELLY BLASTER!\nRapid-fire wobbly jelly in four flavours\nShoot the floor under you to jelly-jump  -  weapon 8' },
  fondue: { slot: 9, gun: 'fonduegun', ammoItem: 'cheese',    name: 'BIG FONDUE GUN',    label: 'CHEESE', max: 15,  pickup: 5,   box: 3,  low: 2,  col: '#ffd040', dark: '#a07010', pip: '#ffc020',
            cooldown: 1.3, charge: 0.32, speed: 760, damage: 180, splash: 230, knock: 520, selfScale: 0.35, zapRange: 280, zapDamage: 10, zapEvery: 0.22, strandRange: 520, strandDamage: 45,
            msg: 'You got the BIG FONDUE GUN!!\nA ball of molten cheese that zaps everything near it\nthen erupts in a cheesy blast  -  weapon 9' },
};
export const W2_KEYS = ['cola', 'sauce', 'rail', 'jelly', 'fondue'];
const ITEM_TO_W = {}; for (const k of W2_KEYS) { ITEM_TO_W[W2[k].gun] = [k, 'gun']; ITEM_TO_W[W2[k].ammoItem] = [k, 'ammo']; }
export const W2_ITEMS = Object.keys(ITEM_TO_W);
// first level each weapon turns up on: [episode 1 level index, episode 2 map index]
const START = { cola: [2, 0], sauce: [3, 1], jelly: [4, 2], rail: [5, 3], fondue: [6, 5] };
const JELLY_COLS = [0x40e050, 0xff3050, 0xff9a20, 0xa050ff];

// ---------------------------------------------------------------- shared bits
let GLOW = null;
function glowTex() {
  if (GLOW) return GLOW;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64); GLOW = new THREE.CanvasTexture(c); return GLOW;
}
function glowSprite(color, size, opacity = 1) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity })); s.scale.set(size, size, 1); return s; }
const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const eBox = e => [[e.pos[0] - 18, e.pos[1] - 26, e.pos[2] - 18], [e.pos[0] + 18, e.pos[1] + e.K.height - 22, e.pos[2] + 18]];
class Helix extends THREE.Curve { // a noodle wound round a straight line
  constructor(a, b, r, turns, phase = 0) { super(); this.a = a; this.b = b; this.r = r; this.turns = turns; this.phase = phase; const d = b.clone().sub(a).normalize(); this.u = new THREE.Vector3(0, 1, 0).cross(d); if (this.u.lengthSq() < 1e-4) this.u.set(1, 0, 0); this.u.normalize(); this.v = d.clone().cross(this.u).normalize(); }
  getPoint(t, out = new THREE.Vector3()) { const ang = this.phase + t * this.turns * Math.PI * 2, r = this.r * Math.min(1, t * 30); return out.copy(this.a).lerp(this.b, t).addScaledVector(this.u, Math.cos(ang) * r).addScaledVector(this.v, Math.sin(ang) * r); }
}
class Sag extends THREE.Curve { // a sagging string between two points (cheese strands)
  constructor(a, b, sag) { super(); this.a = a; this.b = b; this.sag = sag; }
  getPoint(t, out = new THREE.Vector3()) { out.copy(this.a).lerp(this.b, t); out.y -= Math.sin(t * Math.PI) * this.sag; return out; }
}

// ---------------------------------------------------------------- view models
function kit(g) {
  const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); g.add(m); return m; };
  const cyl = (r, l, mat, x, y, z, segs = 16, r2 = r) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r2, l, segs), mat); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); g.add(m); return m; };
  return { box, cyl };
}
export function makeColaCan(s = 1) {
  const g = new THREE.Group();
  const red = new THREE.MeshBasicMaterial({ color: 0xd8141a }), silver = new THREE.MeshBasicMaterial({ color: 0xc8ccd4 }), white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const b = new THREE.Mesh(new THREE.CylinderGeometry(2.7 * s, 2.7 * s, 8 * s, 12), red); g.add(b);
  for (const y of [-4.3, 4.3]) { const e = new THREE.Mesh(new THREE.CylinderGeometry(2.3 * s, 2.6 * s, 0.8 * s, 12), silver); e.position.y = y * s; if (y < 0) e.rotation.x = Math.PI; g.add(e); }
  const w = new THREE.Mesh(new THREE.TorusGeometry(2.75 * s, 0.35 * s, 4, 16), white); w.rotation.x = Math.PI / 2 + 0.25; w.position.y = 0.5 * s; g.add(w);
  const tab = new THREE.Mesh(new THREE.BoxGeometry(1.2 * s, 0.3 * s, 1.8 * s), silver); tab.position.set(0.5 * s, 4.8 * s, 0); g.add(tab);
  g.userData.mats = [red, silver, white]; return g;
}
export function makeFizzLauncher() {
  const g = new THREE.Group(), { box, cyl } = kit(g);
  const red = Std({ color: 0xc81820, roughness: 0.35, metalness: 0.15 }), redD = Std({ color: 0x7a0c10, roughness: 0.4, metalness: 0.1 });
  const silver = Std({ color: 0xc8ccd4, roughness: 0.15, metalness: 0.9 }), white = Std({ color: 0xf4f4f0, roughness: 0.4, metalness: 0 });
  const grip = Std({ color: 0x2a2a2e, roughness: 0.6, metalness: 0.1 }), cap = Std({ color: 0xe8b020, roughness: 0.25, metalness: 0.7 });
  cyl(4.4, 26, red, 0, 0, -13); cyl(4.6, 1.4, white, 0, 0, -9); cyl(4.6, 1.4, white, 0, 0, -18);
  const flare = cyl(4.6, 5, silver, 0, 0, -27.5, 16, 6.2); flare.rotation.x = -Math.PI / 2;          // flared muzzle
  const drum = new THREE.Group(); drum.position.set(0, -0.5, -1); g.add(drum);                              // revolving six-pack drum
  const dr = new THREE.Mesh(new THREE.CylinderGeometry(6.6, 6.6, 9, 18), silver); dr.rotation.x = Math.PI / 2; drum.add(dr);
  const cans = []; for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, c = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 9.4, 10), k % 2 ? red : redD); c.rotation.x = Math.PI / 2; c.position.set(Math.cos(a) * 4.6, Math.sin(a) * 4.6, 0); drum.add(c); cans.push(c); }
  const loaded = makeColaCan(0.95); loaded.rotation.x = Math.PI / 2; loaded.position.set(0, 0, -25); g.add(loaded);
  box(2, 2.4, 10, redD, 0, 5.2, -12); const bc = cyl(1.6, 1.6, cap, 0, 7.2, -16, 12); bc.rotation.x = 0;   // bottle-cap sight
  for (let k = 0; k < 8; k++) { const t = box(0.4, 1.7, 0.6, cap, 1.7 * Math.cos(k * 0.785), 7.2, -16 + 1.7 * Math.sin(k * 0.785)); t.rotation.y = -k * 0.785; }
  const gr = box(3.2, 7, 3.4, grip, 0, -6.5, 1); gr.rotation.x = -0.25; box(3, 6, 3, grip, 0, -6, -15);
  box(0.9, 2.6, 1.4, silver, 0, -3.8, -1.6);
  g.userData = { drum, loaded, cans, mats: [red, redD, silver, white, grip, cap], base: [0xc81820, 0x7a0c10, 0xc8ccd4, 0xf4f4f0, 0x2a2a2e, 0xe8b020], muzzle: new THREE.Vector3(0, 0, -30) };
  return g;
}
export function makeSauceGun() {
  const g = new THREE.Group(), { box, cyl } = kit(g);
  const steel = Std({ color: 0xb8bcc4, roughness: 0.18, metalness: 0.9 }), dark = Std({ color: 0x34363c, roughness: 0.3, metalness: 0.6 });
  const copper = Std({ color: 0xd07840, roughness: 0.2, metalness: 0.9 }), lid = Std({ color: 0xd4a020, roughness: 0.25, metalness: 0.8 });
  const wood = Std({ color: 0x6a4024, roughness: 0.6, metalness: 0 }), label = Std({ color: 0xf0ead0, roughness: 0.5, metalness: 0 });
  const glass = Std({ color: 0xffe8e0, transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0.1, depthWrite: false });
  const sauceM = new THREE.MeshBasicMaterial({ color: 0xb01808 }), tipM = new THREE.MeshBasicMaterial({ color: 0xff4020 });
  cyl(3.8, 22, steel, 0, 0, -8); cyl(4.2, 2, dark, 0, 0, 2.5); cyl(2.2, 6, dark, 0, 0, -21);
  const coil = new THREE.Group(); coil.position.set(0, 0, -21); g.add(coil);
  for (let k = 0; k < 4; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(3.4 - k * 0.35, 0.55, 6, 14), copper); r.position.z = 3 - k * 2.2; r.rotation.y = 0.25 * (k % 2 ? 1 : -1); coil.add(r); }
  const tip = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 8), tipM); tip.position.set(0, 0, -25.5); g.add(tip);
  // the jar of marinara on top (level shows the ammo)
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 7.5, 16), glass); jar.position.set(0, 7, -7); g.add(jar);
  const sauce = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 7, 16), sauceM); sauce.position.set(0, 7, -7); g.add(sauce);
  const lb = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 2.8, 16, 1, true, -0.9, 1.8), label); lb.position.set(0, 6.6, -7); g.add(lb);
  const cp = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 1.2, 16), lid); cp.position.set(0, 11.2, -7); g.add(cp);
  box(1.4, 2.4, 1.4, dark, 0, 3.8, -7);
  const gr = box(3.2, 7, 3.4, wood, 0, -6.5, 1); gr.rotation.x = -0.25; box(0.9, 2.6, 1.4, steel, 0, -3.8, -1.6);
  const h = box(2.6, 2.6, 8, wood, 0, -4.2, -13);
  g.userData = { coil, sauce, tip, mats: [steel, dark, copper, lid, wood, label], base: [0xb8bcc4, 0x34363c, 0xd07840, 0xd4a020, 0x6a4024, 0xf0ead0], muzzle: new THREE.Vector3(0, 0, -26) };
  return g;
}
export function makeRailgun() {
  const g = new THREE.Group(), { box, cyl } = kit(g);
  const navy = Std({ color: 0x24345a, roughness: 0.25, metalness: 0.7 }), dark = Std({ color: 0x15181f, roughness: 0.3, metalness: 0.6 });
  const silver = Std({ color: 0xd0d4dc, roughness: 0.12, metalness: 0.95 }), boxM = Std({ color: 0x1e50c8, roughness: 0.45, metalness: 0 });
  const yel = Std({ color: 0xffd040, roughness: 0.45, metalness: 0 });
  const noodleM = new THREE.MeshBasicMaterial({ color: 0xffe08a });
  cyl(1.9, 34, navy, 0, 0, -16, 12); box(1.1, 1.6, 30, dark, -2.8, 0, -15); box(1.1, 1.6, 30, dark, 2.8, 0, -15);
  const coil = new THREE.Mesh(new THREE.TubeGeometry(new Helix(new THREE.Vector3(0, 0, -2), new THREE.Vector3(0, 0, -30), 3.1, 9), 220, 0.62, 6), noodleM); g.add(coil);
  coil.geometry.translate(0, 0, 16); coil.position.z = -16;
  for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + Math.PI / 4; const p = box(0.55, 0.55, 7, silver, Math.cos(a) * 1.5, Math.sin(a) * 1.5, -35); p.rotation.set(Math.sin(a) * 0.1, -Math.cos(a) * 0.1, 0); } // fork tines
  cyl(2.3, 2, silver, 0, 0, -31.5, 12);
  box(5, 7, 7, boxM, 0, -1, -1); box(5.2, 3, 3.6, yel, 0, -0.4, -1); // the pasta box magazine
  const gr = box(3.2, 7, 3.4, dark, 0, -6.5, 4); gr.rotation.x = -0.25; box(0.9, 2.6, 1.4, silver, 0, -3.8, 1.6);
  box(3.4, 4, 5, navy, 0, -0.5, 5);
  box(1.4, 2.2, 6, dark, 0, 2.8, -6);
  g.userData = { coil, noodleM, mats: [navy, dark, silver, boxM, yel], base: [0x24345a, 0x15181f, 0xd0d4dc, 0x1e50c8, 0xffd040], muzzle: new THREE.Vector3(0, 0, -38) };
  return g;
}
export function makeJellyBlaster() {
  const g = new THREE.Group(), { box, cyl } = kit(g);
  const white = Std({ color: 0xf0f0ea, roughness: 0.3, metalness: 0.05 }), grey = Std({ color: 0x8a8c94, roughness: 0.25, metalness: 0.6 });
  const jellyM = new THREE.MeshStandardMaterial({ color: 0x40e050, transparent: true, opacity: 0.78, roughness: 0.05, metalness: 0, emissive: 0x40e050, emissiveIntensity: 0.35 });
  const core = new THREE.MeshBasicMaterial({ color: 0xc0ffc0 });
  const jelly = new THREE.Group(); jelly.position.set(0, 1.2, -11); jelly.scale.setScalar(1.3); g.add(jelly);
  [[5.6, 4.6, 5], [4.6, 3.8, 4], [3.8, 2.8, 4], [2.9, 2.2, 3]].reduce((z, [r1, r2, l]) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, l, 12), jellyM); m.rotation.x = -Math.PI / 2; m.position.z = z - l / 2; jelly.add(m); return z - l; }, 6);
  const cm = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 18, 8), core); cm.rotation.x = Math.PI / 2; cm.position.z = -1; jelly.add(cm);
  const bowl = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.8, 6, 16), white); bowl.position.z = -23; g.add(bowl);
  cyl(4.6, 2, white, 0, 0, -3.5, 16); cyl(3.6, 6, grey, 0, 0, 0.5, 14);
  box(1.6, 1.6, 22, grey, 0, 6, -10);
  const gr = box(3.2, 7, 3.4, white, 0, -6.5, 1); gr.rotation.x = -0.25; box(0.9, 2.6, 1.4, grey, 0, -3.8, -1.6);
  box(3, 5.5, 3, white, 0, -6, -10);
  g.userData = { jelly, jellyM, core, mats: [white, grey], base: [0xf0f0ea, 0x8a8c94], muzzle: new THREE.Vector3(0, 0, -25) };
  return g;
}
export function makeFondueGun() {
  const g = new THREE.Group(), { box, cyl } = kit(g);
  const enamel = Std({ color: 0xd85a18, roughness: 0.25, metalness: 0.2 }), enamelD = Std({ color: 0x8a3008, roughness: 0.3, metalness: 0.2 });
  const black = Std({ color: 0x1c1c20, roughness: 0.5, metalness: 0.3 }), steel = Std({ color: 0xc0c4cc, roughness: 0.15, metalness: 0.9 });
  const bread = Std({ color: 0xd8a860, roughness: 0.8, metalness: 0 }), wood = Std({ color: 0x5a3820, roughness: 0.6, metalness: 0 });
  const cheese = new THREE.MeshBasicMaterial({ color: 0xffd040 }), flame = new THREE.MeshBasicMaterial({ color: 0x4080ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const pot = cyl(8.2, 15, enamel, 0, 0, -7, 20, 7); pot.rotation.x = -Math.PI / 2;
  cyl(8.6, 1.4, enamelD, 0, 0, -14.5, 20); cyl(7.6, 1.4, enamelD, 0, 0, 0.4, 20);
  const ch = cyl(7.4, 0.6, cheese, 0, 0, -15, 20); // molten cheese face at the mouth
  const bubbles = []; for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 6), cheese); b.position.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, -15.3); g.add(b); bubbles.push(b); }
  for (const s of [-1, 1]) { const hd = box(1.6, 1.6, 9, black, s * 9.2, 0, -7); }
  for (const [x, a] of [[-2.5, -0.35], [2.5, 0.35], [0, 0]]) { const fk = new THREE.Group(); fk.position.set(x, 6, -9); fk.rotation.set(-0.9, 0, a); g.add(fk);
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 16, 6), steel); sh.position.y = 6; fk.add(sh);
    const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 4.5, 8), x ? wood : enamelD); hd.position.y = 15; fk.add(hd);
    const br = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 2.6), bread); br.position.y = 0; br.rotation.set(0.4, 0.5, 0.2); fk.add(br); }
  const burner = new THREE.Mesh(new THREE.ConeGeometry(2.4, 5, 10, 1, true), flame); burner.position.set(0, -10.5, -7); g.add(burner);
  box(9, 1.2, 9, black, 0, -8, -7); for (const s of [-1, 1]) box(1, 4, 1, black, s * 3.6, -6, -7 + s * 3.6);
  const gr = box(3.2, 7, 3.4, black, 0, -6.8, 2.5); gr.rotation.x = -0.25; box(0.9, 2.6, 1.4, steel, 0, -4.2, 0);
  box(4, 4, 5, black, 0, -1, 2.4);
  g.userData = { ch, bubbles, burner, cheese, mats: [enamel, enamelD, black, steel, bread, wood], base: [0xd85a18, 0x8a3008, 0x1c1c20, 0xc0c4cc, 0xd8a860, 0x5a3820], muzzle: new THREE.Vector3(0, 0, -17) };
  return g;
}
const GUN_MODELS = { colagun: makeFizzLauncher, saucegun: makeSauceGun, railgun: makeRailgun, jellygun: makeJellyBlaster, fonduegun: makeFondueGun };

// ---------------------------------------------------------------- pickups (weapon models + ammo)
export function makeW2Pickup(kind) {
  const g = new THREE.Group();
  if (GUN_MODELS[kind]) { const s = GUN_MODELS[kind](); s.scale.setScalar(kind === 'fonduegun' ? 0.62 : 0.72); s.rotation.y = Math.PI / 2; g.add(s); g.userData.mats = s.userData.mats; return g; }
  const B = c => new THREE.MeshBasicMaterial({ color: c });
  if (kind === 'colapack') { // a six-pack of cola in a plastic ring
    const mats = []; for (let k = 0; k < 6; k++) { const c = makeColaCan(0.9); c.position.set((k % 3 - 1) * 5.2, 0, (k < 3 ? -1 : 1) * 2.7); g.add(c); mats.push(...c.userData.mats); }
    const ring = B(0xe0f0ff); const r = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.5, 11), ring); r.position.y = 3.2; g.add(r); mats.push(ring); g.userData.mats = mats; return g;
  }
  if (kind === 'saucejar') { // a jar of marinara with a gold lid
    const glass = B(0xb01808), lid = B(0xd4a020), label = B(0xf0ead0), basil = B(0x30a030);
    const j = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 12, 14), glass); g.add(j);
    const l = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 2, 14), lid); l.position.y = 7; g.add(l);
    const lb = new THREE.Mesh(new THREE.CylinderGeometry(5.1, 5.1, 5, 14), label); lb.position.y = -0.5; g.add(lb);
    const lf = new THREE.Mesh(new THREE.SphereGeometry(1.6, 6, 4), basil); lf.scale.set(1, 0.5, 0.3); lf.position.set(0, -0.5, 5.1); g.add(lf);
    g.userData.mats = [glass, lid, label, basil]; return g;
  }
  if (kind === 'noodlebox') { // a blue box of spaghetti with the noodles poking out
    const blue = B(0x1e50c8), yel = B(0xffd040), noodle = B(0xffe08a);
    const b = new THREE.Mesh(new THREE.BoxGeometry(5, 18, 9), blue); g.add(b); const w = new THREE.Mesh(new THREE.BoxGeometry(5.2, 9, 5), yel); w.position.y = 1; g.add(w);
    for (let k = 0; k < 9; k++) { const n = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 8, 4), noodle); n.position.set((Math.random() - 0.5) * 3, 11, (Math.random() - 0.5) * 6); n.rotation.set((Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3); g.add(n); }
    g.userData.mats = [blue, yel, noodle]; return g;
  }
  if (kind === 'jellycups') { // three wobbly jelly cups
    const mats = []; JELLY_COLS.slice(0, 3).forEach((c, k) => { const m = B(c), cupM = B(0xf8f8f8);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 2.8, 5, 10), m); cup.position.set((k - 1) * 7.6, 0, 0); g.add(cup);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.5, 4, 12), cupM); rim.rotation.x = Math.PI / 2; rim.position.set((k - 1) * 7.6, 2.5, 0); g.add(rim); mats.push(m, cupM); });
    g.userData.mats = mats; return g;
  }
  if (kind === 'cheese') { // a wedge of holey cheese
    const y = B(0xffcf40), h = B(0xc89420);
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(16, 0); sh.lineTo(0, 9); sh.lineTo(0, 0);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 10, bevelEnabled: false }); geo.translate(-6, -4, -5);
    g.add(new THREE.Mesh(geo, y));
    for (const [x, yy, r] of [[-2, -1, 1.4], [3, -2.2, 1], [-4, 2, 0.9]]) { const d = new THREE.Mesh(new THREE.CircleGeometry(r, 10), h); d.position.set(x, yy, 5.05); g.add(d); const d2 = d.clone(); d2.position.z = -5.05; d2.rotation.y = Math.PI; g.add(d2); }
    g.userData.mats = [y, h]; return g;
  }
  return g;
}

// ---------------------------------------------------------------- first-person weapon base
class VWeapon {
  constructor(game, key, model, pos, scale, rot) {
    this.game = game; this.key = key; this.def = W2[key]; this.model = model;
    this.scene = new THREE.Scene(); vmKey(this.scene); this.cam = new THREE.PerspectiveCamera(60, 1, 0.5, 200);
    this.holder = new THREE.Group(); this.holder.add(this.model); this.scene.add(this.holder);
    this.model.scale.setScalar(scale); this.model.position.set(...pos); this.model.rotation.set(...rot);
    this.cool = 0; this.kick = 0; this.raise = 1; this.emptyT = 0; this.firing = false;
  }
  get ammo() { return this.game.arsenal.inv[this.key].ammo; }
  set ammo(v) { this.game.arsenal.inv[this.key].ammo = v; }
  muzzleWorld(camera) { const v = this.model.userData.muzzle.clone(); this.model.updateMatrixWorld(true); v.applyMatrix4(this.model.matrixWorld); v.applyQuaternion(camera.quaternion); return [camera.position.x + v.x, camera.position.y + v.y, camera.position.z + v.z]; }
  dir(camera, spread = 0) { const d = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); if (spread) { d.x += (Math.random() - 0.5) * spread; d.y += (Math.random() - 0.5) * spread; d.z += (Math.random() - 0.5) * spread; d.normalize(); } return d; }
  empty(msg) { const g = this.game; if (this.emptyT <= 0) { g.sfx.play('empty'); g.hud.centerPrint(msg, 1.2); this.emptyT = 1.2; g.autoSwitch(); } }
  pose(player, kz, kr, shake = 0) {
    const g = this.game, bob = player.bob || 0, t = g.time, sp = Math.min(1, player.speed / 320), sx = shake ? (Math.random() - 0.5) * shake : 0, sy = shake ? (Math.random() - 0.5) * shake : 0;
    this.holder.position.set(Math.sin(t * 5.2) * 0.5 * sp + sx, bob * 0.1 - this.raise * 10 + Math.abs(Math.cos(t * 5.2)) * 0.3 * sp + sy, this.kick * kz);
    this.holder.rotation.set(this.kick * kr, 0, (player.roll || 0) * 2);
    const L = g.pointLight(player.eye()), u = this.model.userData;
    const k = [Math.min(1.6, 0.35 + L[0] * 0.8), Math.min(1.6, 0.35 + L[1] * 0.8), Math.min(1.6, 0.35 + L[2] * 0.8)];
    u.mats.forEach((m, i) => { const c = new THREE.Color(u.base[i]); m.color.setRGB(c.r * k[0], c.g * k[1], c.b * k[2]); });
  }
  tick(dt) { this.cool -= dt; this.emptyT -= dt; this.raise = Math.max(0, this.raise - dt * 5); }
  render(renderer, camera) {
    this.cam.fov = camera.fov; this.cam.aspect = camera.aspect; this.cam.updateProjectionMatrix(); squashDepth(this.cam);
    renderer.autoClear = false; renderer.render(this.scene, this.cam); renderer.autoClear = true;
  }
}

class FizzLauncher extends VWeapon {
  constructor(game) { super(game, 'cola', makeFizzLauncher(), [5.4, -5.4, -10.5], 0.38, [0.05, 0.07, -0.03]); this.drumA = 0; this.drumT = 0; }
  update(dt, firing, cam, pl) {
    const g = this.game, D = this.def; this.tick(dt);
    if (firing && this.raise < 0.3 && this.cool <= 0) {
      if (this.ammo <= 0) this.empty('Out of cola! Find a six-pack.');
      else {
        this.ammo--; this.cool = D.cooldown; this.kick = 1; this.drumT += Math.PI / 3; g.sfx.play('colaLaunch'); g.noiseT = 1.2; g.input.rumble(0.5, 0.6, 140);
        const d = this.dir(cam), from = this.muzzleWorld(cam), pv = pl.vel;
        g.arsenal.spawnCan(from, [d.x * D.speed + pv[0] * 0.3, d.y * D.speed + D.lift, d.z * D.speed + pv[2] * 0.3]);
        for (let k = 0; k < 10; k++) g.particles.spawn(from, [d.x * 140 + (Math.random() - 0.5) * 90, d.y * 140 + Math.random() * 70, d.z * 140 + (Math.random() - 0.5) * 90], Math.random() < 0.5 ? [0.95, 0.9, 0.8] : [0.45, 0.2, 0.08], 0.5, -30, 2.5);
      }
    }
    this.kick *= Math.exp(-dt * 6); this.drumA += (this.drumT - this.drumA) * Math.min(1, dt * 12);
    const u = this.model.userData; u.drum.rotation.z = this.drumA; u.loaded.visible = this.cool < this.def.cooldown * 0.5 && this.ammo > 0;
    u.loaded.position.x = u.loaded.visible ? (Math.random() - 0.5) * 0.25 : 0; // the loaded can is shaking
    u.cans.forEach((c, i) => c.visible = this.ammo > i * 5);
    this.pose(pl, 3.2, 0.24);
  }
}
class SauceGun extends VWeapon {
  constructor(game) { super(game, 'sauce', makeSauceGun(), [4.6, -5.6, -10], 0.4, [0.05, 0.06, -0.02]); this.spin = 0; }
  update(dt, firing, cam, pl) {
    const g = this.game, D = this.def; this.tick(dt);
    this.firing = false;
    if (firing && this.raise < 0.3) {
      if (this.ammo <= 0) this.empty('Out of sauce! Find a jar of marinara.');
      else {
        this.firing = true;
        while (this.cool <= 0 && this.ammo > 0) { this.cool += 1 / D.rate; this.ammo--; g.arsenal.sauceTick(cam, pl); g.noiseT = 0.6; g.input.rumble(0.15, 0.25, 60); }
      }
    }
    if (!this.firing) this.cool = Math.max(this.cool, 0);
    g.sfx.sauce(this.firing);
    this.spin += dt * (this.firing ? 24 : 2); this.kick = this.firing ? 0.35 + Math.random() * 0.15 : this.kick * Math.exp(-dt * 10);
    const u = this.model.userData; u.coil.rotation.z = this.spin;
    const fill = Math.max(0.03, this.ammo / D.max); u.sauce.scale.set(1, fill, 1); u.sauce.position.y = 7 - 3.5 * (1 - fill) + (this.firing ? Math.sin(g.time * 30) * 0.15 : 0);
    u.tip.scale.setScalar(this.firing ? 1.2 + Math.random() * 0.5 : 1);
    this.pose(pl, 0.8, 0.03, this.firing ? 0.3 : 0);
  }
}
class SpaghettiRail extends VWeapon {
  constructor(game) { super(game, 'rail', makeRailgun(), [3.8, -5.2, -9.5], 0.38, [0.05, 0.05, -0.02]); }
  update(dt, firing, cam, pl) {
    const g = this.game, D = this.def; this.tick(dt);
    if (firing && this.raise < 0.3 && this.cool <= 0) {
      if (this.ammo <= 0) this.empty('Out of noodles! Find a box of spaghetti.');
      else {
        this.ammo--; this.cool = D.cooldown; this.kick = 1; g.sfx.play('railFire'); g.noiseT = 1.5; g.input.rumble(0.7, 0.8, 200);
        g.arsenal.railShot(cam, pl, this.muzzleWorld(cam)); pl.landKick = Math.min(10, (pl.landKick || 0) + 2);
      }
    }
    this.kick *= Math.exp(-dt * 4.5);
    const u = this.model.userData, ready = this.cool <= 0 ? 1 : 1 - this.cool / D.cooldown;
    u.coil.rotation.z += dt * (0.6 + 3 * (1 - ready)); const glow = this.ammo > 0 ? 0.35 + 0.65 * ready * ready + (ready >= 1 ? 0.12 * Math.sin(g.time * 6) : 0) : 0.2;
    u.noodleM.color.setRGB(1 * glow + 0.15, 0.88 * glow + 0.08, 0.54 * glow);
    this.pose(pl, 4, 0.3);
  }
}
class JellyBlaster extends VWeapon {
  constructor(game) { super(game, 'jelly', makeJellyBlaster(), [4.6, -5.4, -10], 0.4, [0.05, 0.06, -0.02]); this.ci = 0; this.wob = 0; }
  update(dt, firing, cam, pl) {
    const g = this.game, D = this.def; this.tick(dt);
    this.firing = false;
    if (firing && this.raise < 0.3) {
      if (this.ammo <= 0) this.empty('Out of jelly! Find some jelly cups.');
      else {
        this.firing = true;
        while (this.cool <= 0 && this.ammo > 0) {
          this.cool += 1 / D.rate; this.ammo--; this.kick = Math.min(1, this.kick + 0.4); this.wob = 1; g.noiseT = 0.8; g.sfx.play('jellyShot'); g.input.rumble(0.2, 0.15, 50);
          const d = this.dir(cam, 0.01), from = this.muzzleWorld(cam), col = JELLY_COLS[this.ci++ % JELLY_COLS.length];
          g.arsenal.spawnJelly(from, [d.x * D.speed, d.y * D.speed, d.z * D.speed], col);
        }
      }
    }
    if (!this.firing) this.cool = Math.max(this.cool, 0);
    this.kick *= Math.exp(-dt * 12); this.wob *= Math.exp(-dt * 5);
    const u = this.model.userData, c = new THREE.Color(JELLY_COLS[this.ci % JELLY_COLS.length]);
    u.jellyM.color.lerp(c, Math.min(1, dt * 10)); u.jellyM.emissive.copy(u.jellyM.color); u.core.color.copy(u.jellyM.color).lerp(new THREE.Color(1, 1, 1), 0.6);
    const w = Math.sin(g.time * 34) * 0.12 * this.wob + Math.sin(g.time * 3) * 0.02;
    u.jelly.scale.set(1.3 * (1 + w), 1.3 * (1 - w), 1.3 * (1 + w * 0.5));
    this.pose(pl, 1.2, 0.05);
  }
}
class FondueGun extends VWeapon {
  constructor(game) { super(game, 'fondue', makeFondueGun(), [5.2, -5.8, -12], 0.38, [0.05, 0.08, -0.03]); this.chargeT = -1; }
  update(dt, firing, cam, pl) {
    const g = this.game, D = this.def; this.tick(dt);
    if (this.chargeT >= 0) { // winding up: the pot rumbles, then fires
      this.chargeT += dt;
      if (this.chargeT >= D.charge) {
        this.chargeT = -1; this.kick = 1; g.sfx.play('fondueFire'); g.noiseT = 2; g.input.rumble(0.9, 1, 320); pl.landKick = Math.min(10, (pl.landKick || 0) + 4);
        const d = this.dir(cam), from = this.muzzleWorld(cam);
        g.arsenal.spawnFondue(from, [d.x * D.speed, d.y * D.speed, d.z * D.speed]);
        for (let k = 0; k < 18; k++) g.particles.spawn(from, [d.x * 200 + (Math.random() - 0.5) * 160, d.y * 200 + Math.random() * 100, d.z * 200 + (Math.random() - 0.5) * 160], [1, 0.82, 0.25], 0.6, 300, 2);
      }
    } else if (firing && this.raise < 0.3 && this.cool <= 0) {
      if (this.ammo <= 0) this.empty('Out of cheese! Find a cheese wedge.');
      else { this.ammo--; this.cool = D.cooldown; this.chargeT = 0; g.sfx.play('fondueCharge'); }
    }
    this.kick *= Math.exp(-dt * 4);
    const u = this.model.userData, ch = this.chargeT >= 0 ? this.chargeT / D.charge : 0, t = g.time;
    u.bubbles.forEach((b, i) => { const k = ((t * (0.8 + ch * 3) + i * 0.37) % 1); b.scale.setScalar(this.ammo > 0 ? Math.sin(k * Math.PI) * (1 + ch) : 0.01); });
    const hot = 0.75 + 0.25 * Math.sin(t * 5) + ch * 0.5; u.cheese.color.setRGB(Math.min(1.4, hot), Math.min(1.2, 0.8 * hot), 0.25 * hot);
    u.burner.scale.set(1 + Math.random() * 0.15, 0.8 + Math.random() * 0.4 + ch, 1 + Math.random() * 0.15);
    this.pose(pl, 4.5, 0.35, ch * 0.8);
  }
}

// ---------------------------------------------------------------- the arsenal: inventory, projectiles and effects in the world
export class Arsenal {
  constructor(game) {
    this.game = game; this.inv = {}; for (const k of W2_KEYS) this.inv[k] = { has: false, ammo: 0 };
    this.guns = { cola: new FizzLauncher(game), sauce: new SauceGun(game), rail: new SpaghettiRail(game), jelly: new JellyBlaster(game), fondue: new FondueGun(game) };
    this.cans = []; this.jellies = []; this.balls = []; this.fx = []; this.beam = null; this.reset();
    this.jellyGeo = new THREE.SphereGeometry(4.2, 10, 8); this.jellyMats = {};
  }
  // ---- inventory / carry between levels ----
  static freshInv(ep, mi) {
    const inv = {}; for (const k of W2_KEYS) { const has = ep === 1 && mi > START[k][1]; inv[k] = { has, ammo: has ? W2[k].pickup : 0 }; } return inv;
  }
  load(inv) { for (const k of W2_KEYS) { const s = inv && inv[k]; this.inv[k] = { has: !!(s && s.has), ammo: s ? s.ammo | 0 : 0 }; } }
  save() { const o = {}; for (const k of W2_KEYS) o[k] = { ...this.inv[k] }; return o; }
  has(k) { return !!(this.inv[k] && this.inv[k].has); }
  ammo(k) { return this.inv[k] ? this.inv[k].ammo : 0; }
  owned() { return W2_KEYS.filter(k => this.inv[k].has); }
  reset() {
    const sc = this.game.scene;
    if (sc) { for (const l of [this.cans, this.jellies, this.balls]) for (const s of l) sc.remove(s.mesh); for (const f of this.fx) { sc.remove(f.mesh); f.mesh.geometry && f.mesh.geometry.dispose(); } if (this.beam) { sc.remove(this.beam.grp); } }
    this.cans = []; this.jellies = []; this.balls = []; this.fx = []; this.beam = null;
    this.game.sfx && this.game.sfx.sauce && this.game.sfx.sauce(false);
  }
  // which levels hand out what
  placeAll(drop, ep, mi, i) {
    const lv = ep === 1 ? mi : i, idx = ep === 1 ? 1 : 0;
    for (const k of W2_KEYS) if (lv >= START[k][idx]) { drop(W2[k].gun); drop(W2[k].ammoItem); if (lv > START[k][idx]) drop(W2[k].ammoItem); }
  }
  enemyDrop(pos) { // enemies sometimes drop ammo for something you're carrying
    const own = this.owned(); if (!own.length || Math.random() > 0.22) return;
    const k = own[Math.floor(Math.random() * own.length)]; this.game.dropPickup(W2[k].ammoItem, pos, W2[k].box);
  }
  isItem(type) { return !!ITEM_TO_W[type]; }
  pickup(e) { // returns false to leave the item lying there
    const g = this.game, [k, what] = ITEM_TO_W[e.type], D = W2[k], s = this.inv[k], c = new THREE.Color(D.pip);
    if (what === 'gun') {
      const had = s.has; s.has = true; s.ammo = Math.min(D.max, s.ammo + D.pickup); g.setWeapon(k, true);
      g.message(had ? `More ${D.label.toLowerCase()} for the ${D.name.toLowerCase()}!` : D.msg); g.sfx.play('weapon'); g.bonusFlash([c.r, c.g, c.b], 0.4); g.emote('funky');
      return true;
    }
    if (s.ammo >= D.max) return false;
    const n = e.amount || D.box; s.ammo = Math.min(D.max, s.ammo + n);
    const names = { cola: 'a six-pack of cola', sauce: 'a jar of marinara', rail: 'a box of spaghetti', jelly: 'some jelly cups', fondue: 'a wedge of cheese' };
    g.hud.print(`You got ${names[k]} (+${n})`); g.sfx.play('ammo'); g.bonusFlash([c.r, c.g, c.b], 0.2);
    return true;
  }
  // ---- per frame ----
  update(dt, key, firing, cam, pl) { // the weapon in hand
    for (const k of W2_KEYS) if (k !== key && this.guns[k].chargeT >= 0) this.guns[k].chargeT = -1;
    if (key !== 'sauce') this.game.sfx.sauce(false);
    if (key && this.guns[key]) this.guns[key].update(dt, firing, cam, pl);
  }
  render(key, R, cam) { this.guns[key].render(R, cam); }
  // generic splash damage
  blast(p, R, dmg, knock, selfScale, onEnemy, minK = 0.25) {
    const g = this.game;
    for (const e of g.enemies) {
      if (!e.alive || e.dormant) continue; const c = [e.pos[0], e.pos[1] + 10, e.pos[2]], d = Math.hypot(c[0] - p[0], c[1] - p[1], c[2] - p[2]);
      if (d > R + 20 || g.world.rayFrac(p, c) < 0.98) continue;
      const k = Math.max(minK, 1 - d / (R + 20)); e.hurt(dmg * k, false); onEnemy && onEnemy(e, k);
      if (e.alive && !e.turret && knock) { const l = d || 1, kb = knock * k; e.phys.vel[0] += (c[0] - p[0]) / l * kb; e.phys.vel[2] += (c[2] - p[2]) / l * kb; if (e.flyVel) { e.flyVel[0] += (c[0] - p[0]) / l * kb; e.flyVel[2] += (c[2] - p[2]) / l * kb; } else e.phys.vel[1] += 140 * k; }
    }
    const pl = g.player, pc = [pl.pos[0], pl.pos[1], pl.pos[2]], dp = Math.hypot(pc[0] - p[0], pc[1] - p[1], pc[2] - p[2]);
    let selfHit = 0;
    if (!g.playerDead && dp < R && g.world.rayFrac(p, pc) > 0.98) { const k = 1 - dp / R, l = dp || 1; selfHit = k; if (selfScale) g.damagePlayer(dmg * selfScale * k); pl.vel[0] += (pc[0] - p[0]) / l * knock * 0.75 * k; pl.vel[1] += knock * 0.62 * k; pl.vel[2] += (pc[2] - p[2]) / l * knock * 0.75 * k; }
    for (const m of g.world.movers) if (m.type === 'breakable' && !m.broken) { const c = [(m.min[0] + m.max[0]) / 2, (m.min[1] + m.max[1]) / 2, (m.min[2] + m.max[2]) / 2]; if (Math.hypot(c[0] - p[0], c[1] - p[1], c[2] - p[2]) < R + 40) { m.health -= dmg; if (m.health <= 0) g.breakMover(m); } }
    return selfHit;
  }
  // instant-hit trace from the eye: enemies (sorted), the wall it stops at, and any shootable button on the way
  hitscan(from, d, range, pierce) {
    const g = this.game, end = [from[0] + d.x * range, from[1] + d.y * range, from[2] + d.z * range];
    const tr = g.world.trace(from, end, [-1, -1, -1], [1, 1, 1], null, true); const f = tr.fraction;
    const hits = [];
    for (const e of g.enemies) { if (!e.alive || e.dormant) continue; const [mn, mx] = eBox(e); const t = segAabb(from, end, mn, mx); if (t >= 0 && t <= f) hits.push({ e, t }); }
    hits.sort((a, b) => a.t - b.t); if (!pierce && hits.length > 1) hits.length = 1;
    const at = t => [from[0] + (end[0] - from[0]) * t, from[1] + (end[1] - from[1]) * t, from[2] + (end[2] - from[2]) * t];
    for (const h of hits) h.p = at(h.t);
    const stopT = !pierce && hits.length ? hits[0].t : f;
    let button = null, bt = 2; for (const b of g.shootables) { if (b.pressed) continue; const t = segAabb(from, end, [b.min[0] - 3, b.min[1] - 3, b.min[2] - 3], [b.max[0] + 3, b.max[1] + 3, b.max[2] + 3]); if (t >= 0 && t <= stopT + 0.01 && t < bt) { bt = t; button = b; } }
    return { hits, end: at(stopT), wall: (pierce || !hits.length) && f < 1 ? tr : null, button };
  }
  // ---- sauce gun ----
  sauceTick(cam, pl) {
    const g = this.game, D = W2.sauce, d = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion), eye = pl.eye();
    const r = this.hitscan(eye, d, D.range, false); this.sauceN = (this.sauceN || 0) + 1;
    if (r.button) g.pressButton(r.button);
    for (const h of r.hits) {
      const e = h.e; e.hurt(D.damage, false); e.sauceT = D.slowTime;
      if (e.alive && !e.turret) { e.phys.vel[0] += d.x * D.knock; e.phys.vel[2] += d.z * D.knock; }
      for (let k = 0; k < 3; k++) g.particles.spawn(h.p, [(Math.random() - 0.5) * 160 - d.x * 60, Math.random() * 110, (Math.random() - 0.5) * 160 - d.z * 60], Math.random() < 0.6 ? [0.8, 0.08, 0.04] : [1, 0.3, 0.12], 0.5, 500);
      if (this.sauceN % 6 === 0) g.sfx.play('splash');
    }
    if (r.wall) {
      const mv = r.wall.brush && r.wall.brush.mover; if (mv && mv.type === 'breakable') { mv.health -= D.damage; if (mv.health <= 0) g.breakMover(mv); }
      const n = r.wall.normal || [0, 1, 0];
      for (let k = 0; k < 2; k++) g.particles.spawn(r.end, [n[0] * 90 + (Math.random() - 0.5) * 120, n[1] * 90 + Math.random() * 80, n[2] * 90 + (Math.random() - 0.5) * 120], Math.random() < 0.6 ? [0.75, 0.06, 0.03] : [1, 0.28, 0.1], 0.6, 500);
      if (n[1] > 0.7 && this.sauceN % 5 === 0) g.addPuddle(r.end, 0x9a1008);
      else if (n[1] < 0.7 && this.sauceN % 5 === 0) { const fl = g.world.floorAt(r.end[0] + n[0] * 8, r.end[2] + n[2] * 8); if (r.end[1] - fl < 120) g.addPuddle([r.end[0] + n[0] * 8, fl, r.end[2] + n[2] * 8], 0x9a1008); }
    }
  }
  drawBeam(dt) { // the wobbling marinara stream, rebuilt every frame from the muzzle to whatever it hits
    const g = this.game, gun = this.guns.sauce;
    const on = gun.firing && g.weapon === 'sauce' && !g.playerDead && g.state === 'play';
    if (!this.beam) {
      const grp = new THREE.Group(); grp.frustumCulled = false;
      const outer = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0xa81006 })), inner = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0xff5a2a }));
      outer.frustumCulled = inner.frustumCulled = false; grp.add(outer, inner); const tip = glowSprite(0xff3018, 26, 0.8); grp.add(tip);
      this.beam = { grp, outer, inner, tip }; g.scene.add(grp);
    }
    const B = this.beam; B.grp.visible = on; if (!on) return;
    const pl = g.player, cam = g.aim, d = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    const r = this.hitscan(pl.eye(), d, W2.sauce.range, false), a = V3(gun.muzzleWorld(cam)), b = V3(r.end);
    const len = a.distanceTo(b), right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion), up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
    const pts = [], N = 18, t = g.time;
    for (let i = 0; i <= N; i++) { const s = i / N, env = Math.sin(s * Math.PI) * (2 + len * 0.012); const p = a.clone().lerp(b, s); p.addScaledVector(right, Math.sin(t * 23 + i * 1.1) * env).addScaledVector(up, Math.cos(t * 19 + i * 1.7) * env - s * s * len * 0.02); pts.push(p); }
    pts[N].copy(b);
    const curve = new THREE.CatmullRomCurve3(pts);
    B.outer.geometry.dispose(); B.outer.geometry = new THREE.TubeGeometry(curve, 40, 1.5 + Math.sin(t * 40) * 0.2, 6);
    B.inner.geometry.dispose(); B.inner.geometry = new THREE.TubeGeometry(curve, 40, 0.6, 5);
    B.tip.position.copy(b); const s = 20 + Math.random() * 12; B.tip.scale.set(s, s, 1);
    if (Math.random() < dt * 30) { const p = a.clone().lerp(b, 0.15 + Math.random() * 0.8); g.particles.spawn([p.x, p.y, p.z], [(Math.random() - 0.5) * 30, -20, (Math.random() - 0.5) * 30], [0.7, 0.06, 0.03], 0.8, 600); } // drips
  }
  // ---- spaghetti railgun ----
  railShot(cam, pl, muzzle) {
    const g = this.game, D = W2.rail, d = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion), eye = pl.eye();
    const r = this.hitscan(eye, d, D.range, true);
    if (r.button) g.pressButton(r.button);
    for (const h of r.hits) {
      const e = h.e; e.hurt(D.damage, false);
      if (e.alive && !e.turret) { e.phys.vel[0] += d.x * D.knock; e.phys.vel[2] += d.z * D.knock; e.phys.vel[1] += 80; }
      for (let k = 0; k < 14; k++) g.particles.spawn(h.p, [d.x * 160 + (Math.random() - 0.5) * 220, Math.random() * 160, d.z * 160 + (Math.random() - 0.5) * 220], Math.random() < 0.5 ? [1, 0.88, 0.55] : [0.85, 0.15, 0.08], 0.7, 500);
    }
    if (r.hits.length) g.sfx.play('railHit');
    if (r.hits.length >= 2) g.hud.print(r.hits.length >= 3 ? `NOODLE KEBAB x${r.hits.length}!` : 'DOUBLE SKEWER!');
    if (r.wall) {
      const mv = r.wall.brush && r.wall.brush.mover; if (mv && mv.type === 'breakable') { mv.health -= D.damage; if (mv.health <= 0) g.breakMover(mv); }
      const n = r.wall.normal || [0, 1, 0];
      for (let k = 0; k < 16; k++) g.particles.spawn(r.end, [n[0] * 160 + (Math.random() - 0.5) * 200, n[1] * 160 + Math.random() * 120, n[2] * 160 + (Math.random() - 0.5) * 200], [1, 0.88, 0.55], 0.8, 500);
      if (n[1] > 0.7) g.addPuddle(r.end, 0xd8b850);
    }
    // the noodle trail: a spiralling spaghetti strand round a thin tomato-red core; it droops and fades
    const a = V3(muzzle), b = V3(r.end), len = a.distanceTo(b);
    if (len > 4) {
      const helix = new Helix(a, b, 3.2, len / 26, Math.random() * 6);
      const noodle = new THREE.Mesh(new THREE.TubeGeometry(helix, Math.min(900, Math.ceil(len / 2.2)), 0.85, 5), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 1, depthWrite: false }));
      const core = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 1, 0.45, 4), new THREE.MeshBasicMaterial({ color: 0xff3a20, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
      noodle.frustumCulled = core.frustumCulled = false;
      const grp = new THREE.Group(); grp.add(noodle, core); g.scene.add(grp);
      this.fx.push({ mesh: grp, t: 0, life: 1.8, kind: 'rail', mats: [noodle.material, core.material], geos: [noodle.geometry, core.geometry] });
    }
  }
  // ---- fizz launcher cans ----
  spawnCan(from, v) {
    const g = this.game, eye = g.player.eye(), tr = g.world.trace(eye, from, [-1, -1, -1], [1, 1, 1], null, true);
    const p = tr.fraction < 1 ? tr.end : from, m = makeColaCan(1); m.position.set(...p); g.scene.add(m);
    this.cans.push({ p: p.slice(), v: v.slice(), mesh: m, t: 0, spin: [(Math.random() - 0.5) * 18, (Math.random() - 0.5) * 6, 10 + Math.random() * 8], rest: false, hissT: 0.2 });
  }
  colaBoom(p) {
    const g = this.game, D = W2.cola; g.sfx.play('colaBoom'); g.input.rumble(0.8, 1, 260);
    for (let i = 0; i < 50; i++) g.particles.spawn(p, [(Math.random() - 0.5) * 120, 300 + Math.random() * 420, (Math.random() - 0.5) * 120], Math.random() < 0.55 ? [0.4, 0.17, 0.05] : [0.98, 0.94, 0.85], 1 + Math.random() * 0.6, 700, 0.5); // the geyser
    for (let i = 0; i < 40; i++) g.particles.spawn(p, [(Math.random() - 0.5) * 520, Math.random() * 260, (Math.random() - 0.5) * 520], Math.random() < 0.5 ? [0.35, 0.14, 0.04] : [1, 0.95, 0.88], 0.5 + Math.random() * 0.5, 500, 1.5);
    for (let i = 0; i < 10; i++) g.particles.spawn(p, [(Math.random() - 0.5) * 400, 100 + Math.random() * 200, (Math.random() - 0.5) * 400], [0.85, 0.08, 0.1], 1.2, 600); // shreds of can
    const fl = this.addFlash(p, 0xffe0b0, 110, 0.25);
    const self = this.blast(p, D.splash, D.damage, D.knock, D.selfScale);
    if (self > 0) g.flash = { rgb: [0.45, 0.2, 0.08], a: 0.35 * self + 0.1 };
    const f = g.world.floorAt(p[0], p[2]); if (Math.abs(p[1] - f) < 60) { g.addPuddle([p[0], f, p[2]], 0x3a1606); g.addPuddle([p[0] + 16, f, p[2] - 12], 0x4a2008); g.addPuddle([p[0] - 14, f, p[2] + 10], 0x3a1606); }
  }
  updateCans(dt) {
    const g = this.game, D = W2.cola, keep = [];
    for (const c of this.cans) {
      c.t += dt; let boom = false;
      if (!c.rest) {
        c.v[1] -= D.gravity * dt;
        const p1 = [c.p[0] + c.v[0] * dt, c.p[1] + c.v[1] * dt, c.p[2] + c.v[2] * dt];
        for (const e of g.enemies) { if (!e.alive || e.dormant) continue; const [mn, mx] = eBox(e); if (segAabb(c.p, p1, [mn[0] - 3, mn[1] - 3, mn[2] - 3], [mx[0] + 3, mx[1] + 3, mx[2] + 3]) >= 0) { boom = true; break; } }
        if (!boom) {
          const tr = g.world.trace(c.p, p1, [-3, -3, -3], [3, 3, 3], null, true);
          if (tr.fraction < 1 && tr.normal) {
            const n = tr.normal, vn = c.v[0] * n[0] + c.v[1] * n[1] + c.v[2] * n[2];
            c.p = [tr.end[0] + n[0] * 0.2, tr.end[1] + n[1] * 0.2, tr.end[2] + n[2] * 0.2];
            for (let a = 0; a < 3; a++) c.v[a] = (c.v[a] - 1.55 * vn * n[a]) * 0.72;
            if (Math.abs(vn) > 90) g.sfx.play('colaBounce');
            if (n[1] > 0.7 && Math.hypot(c.v[0], c.v[1], c.v[2]) < 60) { c.rest = true; c.v = [0, 0, 0]; }
          } else c.p = p1;
        }
        c.mesh.rotation.x += c.spin[0] * dt; c.mesh.rotation.y += c.spin[1] * dt; c.mesh.rotation.z += c.spin[2] * dt;
        if (c.rest) { c.mesh.rotation.set(0, Math.random() * 6, 0); c.p[1] += 1.6; }
      }
      // fizzing: shakes harder and sprays more foam as the fuse burns down
      const fz = Math.min(1, c.t / D.fuse);
      c.mesh.position.set(c.p[0] + (Math.random() - 0.5) * fz * 2.4, c.p[1] + (Math.random() - 0.5) * fz * 1.2, c.p[2] + (Math.random() - 0.5) * fz * 2.4);
      if (c.rest) c.mesh.rotation.z = (Math.random() - 0.5) * 0.3 * fz;
      if (Math.random() < dt * (10 + 60 * fz)) g.particles.spawn([c.p[0], c.p[1] + 4, c.p[2]], [(Math.random() - 0.5) * 70 * (0.3 + fz), 60 + Math.random() * 140 * fz, (Math.random() - 0.5) * 70 * (0.3 + fz)], Math.random() < 0.65 ? [0.98, 0.95, 0.88] : [0.5, 0.25, 0.1], 0.5 + fz * 0.4, 350, 1);
      c.hissT -= dt; if (c.hissT <= 0) { c.hissT = 0.55 - fz * 0.35; if (Math.hypot(c.p[0] - g.player.pos[0], c.p[2] - g.player.pos[2]) < 900) g.sfx.play('colaHiss'); }
      const L = g.pointLight(c.p); for (const m of c.mesh.userData.mats) { if (!m.userData.base) m.userData.base = m.color.clone(); m.color.copy(m.userData.base).multiply(new THREE.Color(Math.max(0.6, L[0]), Math.max(0.6, L[1]), Math.max(0.6, L[2]))); }
      // proximity: an armed can pops when an enemy gets close
      if (!boom && c.t > 0.2) for (const e of g.enemies) { if (!e.alive || e.dormant) continue; if (Math.hypot(e.pos[0] - c.p[0], e.pos[1] + 6 - c.p[1], e.pos[2] - c.p[2]) < D.prox) { boom = true; break; } }
      if (boom || c.t >= D.fuse) { g.scene.remove(c.mesh); this.colaBoom(c.p); continue; }
      keep.push(c);
    }
    this.cans = keep;
  }
  // ---- jelly blobs ----
  spawnJelly(from, v, col) {
    const g = this.game, eye = g.player.eye(), tr = g.world.trace(eye, from, [-1, -1, -1], [1, 1, 1], null, true);
    const p = tr.fraction < 1 ? tr.end : from;
    if (!this.jellyMats[col]) this.jellyMats[col] = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 });
    const grp = new THREE.Group(), m = new THREE.Mesh(this.jellyGeo, this.jellyMats[col]); grp.add(m); grp.add(glowSprite(col, 22, 0.55)); grp.position.set(...p); g.scene.add(grp);
    this.jellies.push({ p: p.slice(), v: v.slice(), mesh: grp, blob: m, t: 0, col, ph: Math.random() * 6 });
  }
  jellySplat(j, p, n) {
    const g = this.game, D = W2.jelly, c = new THREE.Color(j.col), rgb = [c.r, c.g, c.b];
    for (let i = 0; i < 12; i++) g.particles.spawn(p, [(n ? n[0] * 120 : 0) + (Math.random() - 0.5) * 200, (n ? n[1] * 120 : 0) + Math.random() * 140, (n ? n[2] * 120 : 0) + (Math.random() - 0.5) * 200], Math.random() < 0.7 ? rgb : [1, 1, 1], 0.45 + Math.random() * 0.3, 500, 1);
    this.addFlash(p, j.col, 40, 0.15);
    if (Math.random() < 0.5) g.sfx.play('jellyHit');
    // small splash; you can jelly-jump off it, like plasma climbing
    const pl = g.player, dp = Math.hypot(pl.pos[0] - p[0], pl.pos[1] - p[1], pl.pos[2] - p[2]);
    this.blast(p, D.splash, D.splashDamage, 0, 0);
    if (!g.playerDead && dp < D.splash + 12 && g.world.rayFrac(p, pl.pos) > 0.98) { const k = 1 - dp / (D.splash + 12), l = dp || 1; g.damagePlayer(D.splashDamage * D.selfScale * k); pl.vel[0] += (pl.pos[0] - p[0]) / l * D.push * k; pl.vel[1] += Math.max(0, (pl.pos[1] - p[1]) / l) * D.push * 1.2 * k + 40 * k; pl.vel[2] += (pl.pos[2] - p[2]) / l * D.push * k; }
  }
  updateJellies(dt) {
    const g = this.game, D = W2.jelly, keep = [];
    for (const j of this.jellies) {
      j.t += dt; const p1 = [j.p[0] + j.v[0] * dt, j.p[1] + j.v[1] * dt, j.p[2] + j.v[2] * dt];
      let best = 2, hitE = null;
      for (const e of g.enemies) { if (!e.alive || e.dormant) continue; const [mn, mx] = eBox(e); const t = segAabb(j.p, p1, mn, mx); if (t >= 0 && t < best) { best = t; hitE = e; } }
      const tr = g.world.trace(j.p, p1, [-2, -2, -2], [2, 2, 2], null, true);
      let gone = false;
      if (hitE && best <= tr.fraction) {
        const hp = [j.p[0] + (p1[0] - j.p[0]) * best, j.p[1] + (p1[1] - j.p[1]) * best, j.p[2] + (p1[2] - j.p[2]) * best];
        hitE.hurt(D.damage, false); if (hitE.alive && !hitE.turret) { const sp = Math.hypot(j.v[0], j.v[2]) || 1; hitE.phys.vel[0] += j.v[0] / sp * 40; hitE.phys.vel[2] += j.v[2] / sp * 40; }
        this.jellySplat(j, hp, null); gone = true;
      } else {
        let hitB = null, bt = 2; for (const b of g.shootables) { if (b.pressed) continue; const t = segAabb(j.p, p1, [b.min[0] - 3, b.min[1] - 3, b.min[2] - 3], [b.max[0] + 3, b.max[1] + 3, b.max[2] + 3]); if (t >= 0 && t < bt) { bt = t; hitB = b; } }
        if (hitB && bt <= tr.fraction + 0.05) { g.pressButton(hitB); this.jellySplat(j, j.p, null); gone = true; }
        else if (tr.fraction < 1) {
          const mv = tr.brush && tr.brush.mover; if (mv && mv.type === 'breakable') { mv.health -= D.damage; if (mv.health <= 0) g.breakMover(mv); }
          this.jellySplat(j, tr.end, tr.normal); gone = true;
        }
      }
      if (gone || j.t > 3) { g.scene.remove(j.mesh); continue; }
      j.p = p1; j.mesh.position.set(...p1);
      const w = Math.sin(j.t * 32 + j.ph) * 0.22; j.blob.scale.set(1 + w, 1 - w, 1 + w * 0.6); j.blob.rotation.y += dt * 8;
      keep.push(j);
    }
    this.jellies = keep;
  }
  // ---- big fondue gun ----
  spawnFondue(from, v) {
    const g = this.game, eye = g.player.eye(), tr = g.world.trace(eye, from, [-1, -1, -1], [1, 1, 1], null, true);
    const p = tr.fraction < 1 ? tr.end : from;
    const grp = new THREE.Group(), ball = new THREE.Mesh(new THREE.SphereGeometry(8, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffe060 }));
    const shell = new THREE.Mesh(new THREE.SphereGeometry(11, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffb020, transparent: true, opacity: 0.35, depthWrite: false }));
    const halo = glowSprite(0xffc030, 90, 0.9); grp.add(ball, shell, halo); grp.position.set(...p); g.scene.add(grp);
    this.balls.push({ p: p.slice(), v: v.slice(), mesh: grp, ball, shell, halo, t: 0, zapT: 0.1 });
  }
  strand(a, b, life = 0.45, width = 1) {
    const g = this.game, A = V3(a), B = V3(b), len = A.distanceTo(B);
    const m = new THREE.Mesh(new THREE.TubeGeometry(new Sag(A, B, Math.min(60, len * 0.15)), 16, 0.9 * width, 5), new THREE.MeshBasicMaterial({ color: 0xffd848, transparent: true, opacity: 1, depthWrite: false }));
    m.frustumCulled = false; g.scene.add(m); this.fx.push({ mesh: m, t: 0, life, kind: 'strand', mats: [m.material], geos: [m.geometry] });
  }
  fondueBoom(p, direct) {
    const g = this.game, D = W2.fondue; g.sfx.play('fondueBoom'); g.input.rumble(1, 1, 450);
    for (let i = 0; i < 90; i++) g.particles.spawn(p, [(Math.random() - 0.5) * 640, Math.random() * 420, (Math.random() - 0.5) * 640], Math.random() < 0.7 ? [1, 0.82, 0.25] : [1, 0.98, 0.7], 0.7 + Math.random() * 0.7, 500, 1);
    for (let i = 0; i < 24; i++) g.particles.spawn(p, [(Math.random() - 0.5) * 120, 40 + Math.random() * 80, (Math.random() - 0.5) * 120], [0.95, 0.7, 0.2], 1.6, -15, 1.6);
    this.addFlash(p, 0xffd040, 300, 0.45);
    if (direct && direct.alive) direct.hurt(D.damage * 0.35, false);
    const self = this.blast(p, D.splash, D.damage, D.knock, D.selfScale);
    // cheese strands lash out to every enemy in sight of the blast
    const near = g.enemies.filter(e => e.alive && !e.dormant && Math.hypot(e.pos[0] - p[0], e.pos[1] - p[1], e.pos[2] - p[2]) < D.strandRange && g.world.rayFrac(p, [e.pos[0], e.pos[1] + 10, e.pos[2]]) > 0.98);
    for (const e of near) { this.strand(p, [e.pos[0], e.pos[1] + 12, e.pos[2]], 0.8, 1.6); e.hurt(D.strandDamage, false); e.sauceT = Math.max(e.sauceT || 0, 0.8); }
    if (near.length >= 3) g.hud.print(`CHEESED ${near.length} AT ONCE!`);
    const pl = g.player, dp = Math.hypot(pl.pos[0] - p[0], pl.pos[1] - p[1], pl.pos[2] - p[2]);
    if (dp < 700) g.flash = { rgb: [1, 0.8, 0.25], a: Math.max(self * 0.5, 0.3 * (1 - dp / 700)) + 0.05 };
    const f = g.world.floorAt(p[0], p[2]); if (Math.abs(p[1] - f) < 80) for (let k = 0; k < 4; k++) g.addPuddle([p[0] + (Math.random() - 0.5) * 50, f, p[2] + (Math.random() - 0.5) * 50], 0xf0b828);
  }
  updateBalls(dt) {
    const g = this.game, D = W2.fondue, keep = [];
    for (const b of this.balls) {
      b.t += dt; const p1 = [b.p[0] + b.v[0] * dt, b.p[1] + b.v[1] * dt, b.p[2] + b.v[2] * dt];
      let hitE = null;
      for (const e of g.enemies) { if (!e.alive || e.dormant) continue; const [mn, mx] = eBox(e); if (segAabb(b.p, p1, [mn[0] - 6, mn[1] - 6, mn[2] - 6], [mx[0] + 6, mx[1] + 6, mx[2] + 6]) >= 0) { hitE = e; break; } }
      const tr = g.world.trace(b.p, p1, [-6, -6, -6], [6, 6, 6], null, true);
      if (hitE || tr.fraction < 1 || b.t > 6) { g.scene.remove(b.mesh); this.fondueBoom(hitE ? p1 : tr.fraction < 1 ? tr.end : p1, hitE); continue; }
      b.p = p1; b.mesh.position.set(...p1);
      // zap the nearest enemy in reach with a cheese string
      b.zapT -= dt;
      if (b.zapT <= 0) {
        b.zapT = D.zapEvery; let best = null, bd = D.zapRange;
        for (const e of g.enemies) { if (!e.alive || e.dormant) continue; const d = Math.hypot(e.pos[0] - p1[0], e.pos[1] - p1[1], e.pos[2] - p1[2]); if (d < bd && g.world.rayFrac(p1, [e.pos[0], e.pos[1] + 10, e.pos[2]]) > 0.98) { bd = d; best = e; } }
        if (best) { this.strand(p1, [best.pos[0], best.pos[1] + 12, best.pos[2]], 0.3); best.hurt(D.zapDamage, false); g.sfx.play('zap'); }
      }
      const s = 1 + Math.sin(b.t * 20) * 0.08; b.ball.scale.setScalar(s); b.shell.scale.setScalar(1.05 + Math.sin(b.t * 13) * 0.12); const h = 80 + Math.sin(b.t * 25) * 14; b.halo.scale.set(h, h, 1);
      if (Math.random() < dt * 60) g.particles.spawn([p1[0] + (Math.random() - 0.5) * 10, p1[1] - 4, p1[2] + (Math.random() - 0.5) * 10], [(Math.random() - 0.5) * 30, -40, (Math.random() - 0.5) * 30], [1, 0.8, 0.25], 0.8, 500);
      keep.push(b);
    }
    this.balls = keep;
  }
  addFlash(p, col, size, life) { const s = glowSprite(col, size, 1); s.position.set(...p); this.game.scene.add(s); this.fx.push({ mesh: s, t: 0, life, kind: 'flash', size, mats: [s.material], geos: [] }); return s; }
  updateFx(dt) {
    const g = this.game, keep = [];
    for (const f of this.fx) {
      f.t += dt; const k = f.t / f.life;
      if (k >= 1) { g.scene.remove(f.mesh); f.geos.forEach(x => x.dispose()); f.mats.forEach(m => m.dispose()); continue; }
      if (f.kind === 'rail') { f.mesh.position.y = -18 * f.t * f.t; f.mats[0].opacity = k < 0.45 ? 1 : 1 - (k - 0.45) / 0.55; f.mats[1].opacity = 0.9 * Math.max(0, 1 - k * 3); }
      else if (f.kind === 'strand') { f.mats[0].opacity = 1 - k; f.mesh.position.y = -10 * f.t; }
      else if (f.kind === 'flash') { f.mats[0].opacity = 1 - k; const s = f.size * (1 + k * 0.6); f.mesh.scale.set(s, s, 1); }
      keep.push(f);
    }
    this.fx = keep;
  }
  updateWorld(dt) {
    this.updateCans(dt); this.updateJellies(dt); this.updateBalls(dt); this.updateFx(dt); this.drawBeam(dt);
    if (this.game.playerDead) this.game.sfx.sauce(false);
  }
}
