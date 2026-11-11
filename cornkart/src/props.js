// Small themed props shared by races and scenery: the semla and sourdough
// pickups, snowmen and traffic cones.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

function painted(geo, color) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const c = new THREE.Color(color);
  const a = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < a.length; i += 3) { a[i] = c.r; a[i + 1] = c.g; a[i + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  g.deleteAttribute('uv');
  return g;
}

// A semla: cardamom bun, almond paste, a ring of whipped cream and a sugared lid.
// One vertex-coloured geometry, about 1.2 m across so it reads from the kart.
let semlaGeo = null;
export function semlaGeometry() {
  if (semlaGeo) return semlaGeo;
  const parts = [];
  const bun = new THREE.SphereGeometry(0.62, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  bun.scale(1, 0.62, 1); // lower half: the bowl
  parts.push(painted(bun, 0xb8682a));
  const rim = new THREE.CylinderGeometry(0.62, 0.62, 0.08, 20, 1, true);
  rim.translate(0, 0.02, 0);
  parts.push(painted(rim, 0xd8a060));
  const paste = new THREE.CylinderGeometry(0.42, 0.42, 0.06, 18);
  paste.translate(0, 0.07, 0);
  parts.push(painted(paste, 0xe8c27a));
  for (let i = 0; i < 12; i++) { // piped cream swirls
    const a = (i / 12) * Math.PI * 2;
    const b = new THREE.SphereGeometry(0.17, 8, 6);
    b.scale(1, 1.15, 1);
    b.translate(Math.cos(a) * 0.46, 0.2 + (i % 2) * 0.03, Math.sin(a) * 0.46);
    parts.push(painted(b, 0xfffbf2));
  }
  const heap = new THREE.SphereGeometry(0.4, 14, 8);
  heap.scale(1, 0.55, 1); heap.translate(0, 0.2, 0);
  parts.push(painted(heap, 0xfff7ea));
  const lid = new THREE.SphereGeometry(0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  lid.scale(1, 0.62, 1); lid.rotateX(-0.35); lid.translate(0, 0.38, -0.1);
  parts.push(painted(lid, 0xc77a36));
  const sugar = new THREE.SphereGeometry(0.405, 16, 6, 0, Math.PI * 2, 0, Math.PI / 4);
  sugar.scale(1, 0.62, 1); sugar.rotateX(-0.35); sugar.translate(0, 0.385, -0.1);
  parts.push(painted(sugar, 0xffffff));
  semlaGeo = mergeGeometries(parts);
  semlaGeo.translate(0, -0.1, 0);
  return semlaGeo;
}

// A snowman: three snowballs, coal eyes and buttons, a carrot nose and a red scarf.
// Origin at the base; about 1.7 m tall.
let snowmanGeo = null;
export function snowmanGeometry() {
  if (snowmanGeo) return snowmanGeo;
  const parts = [];
  const ball = (r, y) => { const b = new THREE.IcosahedronGeometry(r, 2); b.translate(0, y, 0); parts.push(painted(b, 0xf4f8ff)); };
  ball(0.55, 0.48); ball(0.4, 1.12); ball(0.28, 1.6);
  for (const x of [-0.1, 0.1]) { const e = new THREE.SphereGeometry(0.045, 6, 4); e.translate(x, 1.67, 0.25); parts.push(painted(e, 0x151515)); }
  for (const y of [0.98, 1.14, 1.3]) { const b = new THREE.SphereGeometry(0.05, 6, 4); b.translate(0, y, 0.39); parts.push(painted(b, 0x151515)); }
  const nose = new THREE.ConeGeometry(0.05, 0.3, 8);
  nose.rotateX(Math.PI / 2); nose.translate(0, 1.6, 0.4);
  parts.push(painted(nose, 0xf07a1c));
  const scarf = new THREE.TorusGeometry(0.27, 0.07, 6, 16);
  scarf.rotateX(Math.PI / 2); scarf.translate(0, 1.38, 0);
  parts.push(painted(scarf, 0xc8202a));
  const tail = new THREE.BoxGeometry(0.12, 0.35, 0.05);
  tail.translate(0.15, 1.2, 0.28);
  parts.push(painted(tail, 0xc8202a));
  snowmanGeo = mergeGeometries(parts);
  return snowmanGeo;
}

// A round sourdough loaf: a crusty boule with a floury cross scored on top.
// About 1.2 m across, origin at its middle.
let loafGeo = null;
export function sourdoughGeometry() {
  if (loafGeo) return loafGeo;
  const parts = [];
  const body = new THREE.SphereGeometry(0.6, 20, 12);
  body.scale(1, 0.62, 1);
  parts.push(painted(body, 0xb5732f));
  const base = new THREE.CylinderGeometry(0.56, 0.5, 0.12, 20);
  base.translate(0, -0.3, 0);
  parts.push(painted(base, 0x8a5222));
  for (const a of [0, Math.PI / 2]) { // the scored cross, opened up and floury
    const cut = new THREE.BoxGeometry(0.86, 0.05, 0.12);
    cut.rotateY(a); cut.translate(0, 0.37, 0);
    parts.push(painted(cut, 0xf1e2c2));
  }
  for (let i = 0; i < 10; i++) { // flour dust
    const f = new THREE.SphereGeometry(0.07, 5, 3);
    const a = i * 2.4, rr = 0.1 + (i % 4) * 0.08;
    f.scale(1, 0.3, 1); f.translate(Math.cos(a) * rr, 0.36, Math.sin(a) * rr);
    parts.push(painted(f, 0xf6efe0));
  }
  loafGeo = mergeGeometries(parts);
  return loafGeo;
}

// A traffic cone: orange with a reflective white band on a black square foot.
// Origin at the base; about 0.9 m tall.
let coneGeo = null;
export function trafficConeGeometry() {
  if (coneGeo) return coneGeo;
  const parts = [];
  const foot = new THREE.BoxGeometry(0.62, 0.06, 0.62);
  foot.translate(0, 0.03, 0);
  parts.push(painted(foot, 0x1a1a1a));
  const cone = new THREE.CylinderGeometry(0.05, 0.25, 0.84, 14);
  cone.translate(0, 0.48, 0);
  parts.push(painted(cone, 0xff5a12));
  const band = new THREE.CylinderGeometry(0.135, 0.17, 0.16, 14);
  band.translate(0, 0.52, 0);
  parts.push(painted(band, 0xf4f4f4));
  coneGeo = mergeGeometries(parts);
  return coneGeo;
}

// A garlic bulb: plump white cloves streaked with purple, a papery stalk and
// roots. About 1.2 m across, origin at its middle.
let garlicGeo = null;
export function garlicGeometry() {
  if (garlicGeo) return garlicGeo;
  const parts = [];
  for (let i = 0; i < 8; i++) { // cloves round a central bulb
    const a = (i / 8) * Math.PI * 2;
    const c = new THREE.SphereGeometry(0.3, 12, 10);
    c.scale(0.8, 1.15, 0.8); c.rotateZ(0.25); c.rotateY(-a);
    c.translate(Math.cos(a) * 0.27, 0, Math.sin(a) * 0.27);
    parts.push(painted(c, i % 3 ? 0xf6f0e4 : 0xe6cfe0));
  }
  const core = new THREE.SphereGeometry(0.42, 16, 12);
  core.scale(1, 0.95, 1);
  parts.push(painted(core, 0xfbf7ee));
  const neck = new THREE.ConeGeometry(0.16, 0.5, 10);
  neck.translate(0, 0.6, 0);
  parts.push(painted(neck, 0xeee2c8));
  for (let i = 0; i < 6; i++) { // purple streaks
    const s = new THREE.BoxGeometry(0.03, 0.55, 0.03);
    const a = (i / 6) * Math.PI * 2 + 0.3;
    s.translate(Math.cos(a) * 0.44, 0.02, Math.sin(a) * 0.44);
    parts.push(painted(s, 0xa04a9a));
  }
  for (let i = 0; i < 7; i++) { // roots
    const r = new THREE.CylinderGeometry(0.012, 0.012, 0.18, 4);
    r.rotateZ((i - 3) * 0.2); r.translate((i - 3) * 0.04, -0.5, 0);
    parts.push(painted(r, 0xd8c8a0));
  }
  garlicGeo = mergeGeometries(parts);
  return garlicGeo;
}

// A jack-o'-lantern: a ribbed orange pumpkin with a carved, glowing face and a
// green stalk. Origin at the base; about 1 m tall.
let pumpkinGeo = null;
export function pumpkinGeometry() {
  if (pumpkinGeo) return pumpkinGeo;
  const parts = [];
  for (let i = 0; i < 8; i++) { // ribs
    const a = (i / 8) * Math.PI * 2;
    const rib = new THREE.SphereGeometry(0.34, 12, 10);
    rib.scale(0.62, 1, 1); rib.rotateY(-a);
    rib.translate(Math.cos(a) * 0.24, 0.42, Math.sin(a) * 0.24);
    parts.push(painted(rib, i % 2 ? 0xf07a14 : 0xe06a0c));
  }
  const stalk = new THREE.CylinderGeometry(0.05, 0.08, 0.22, 6);
  stalk.rotateZ(0.2); stalk.translate(0.02, 0.86, 0);
  parts.push(painted(stalk, 0x4a6a1e));
  const glow = 0xffd23a, z = 0.53;
  for (const x of [-0.16, 0.16]) { // triangle eyes
    const e = new THREE.ConeGeometry(0.08, 0.12, 3);
    e.rotateX(Math.PI / 2); e.rotateZ(Math.PI); e.translate(x, 0.52, z);
    parts.push(painted(e, glow));
  }
  const nose = new THREE.ConeGeometry(0.05, 0.08, 3);
  nose.rotateX(Math.PI / 2); nose.translate(0, 0.41, z + 0.02);
  parts.push(painted(nose, glow));
  for (let i = 0; i < 5; i++) { // jagged grin
    const t = new THREE.BoxGeometry(0.09, i % 2 ? 0.05 : 0.09, 0.05);
    t.translate((i - 2) * 0.085, 0.28 + (Math.abs(i - 2) * 0.025), z - 0.04 + Math.abs(i - 2) * -0.02);
    parts.push(painted(t, glow));
  }
  pumpkinGeo = mergeGeometries(parts);
  return pumpkinGeo;
}

// A bat: a furry body with two scalloped wings that flap. Returns a group whose
// userData.wings are rotated by the caller.
let batParts = null;
export function makeBat() {
  if (!batParts) {
    const fur = new THREE.MeshStandardMaterial({ color: 0x2a2030, emissive: 0x140a18, roughness: 0.9 });
    const wing = new THREE.MeshStandardMaterial({ color: 0x3a2838, emissive: 0x1a0c1c, roughness: 0.8, side: THREE.DoubleSide });
    const eye = new THREE.MeshBasicMaterial({ color: 0xff3020 });
    const shape = new THREE.Shape(); // one wing, root at x = 0, spanning +x
    shape.moveTo(0, 0.08); shape.lineTo(0.35, 0.16); shape.lineTo(0.62, 0.05);
    shape.quadraticCurveTo(0.52, -0.02, 0.47, -0.1); shape.quadraticCurveTo(0.38, -0.02, 0.3, -0.1);
    shape.quadraticCurveTo(0.2, -0.02, 0.12, -0.08); shape.lineTo(0, -0.06); shape.closePath();
    const wingGeo = new THREE.ShapeGeometry(shape);
    wingGeo.rotateX(-Math.PI / 2);
    const body = new THREE.SphereGeometry(0.11, 10, 8); body.scale(0.8, 0.8, 1.3);
    const ear = new THREE.ConeGeometry(0.035, 0.09, 4);
    batParts = { fur, wing, eye, wingGeo, body, ear, eyeGeo: new THREE.SphereGeometry(0.03, 6, 4) };
  }
  const B = batParts;
  const g = new THREE.Group();
  g.add(new THREE.Mesh(B.body, B.fur));
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(B.ear, B.fur); ear.position.set(s * 0.045, 0.1, 0.09); g.add(ear);
    const eye = new THREE.Mesh(B.eyeGeo, B.eye); eye.position.set(s * 0.035, 0.03, 0.13); g.add(eye);
  }
  const wings = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    const w = new THREE.Mesh(B.wingGeo, B.wing);
    w.scale.x = s;
    pivot.add(w);
    pivot.userData.side = s;
    g.add(pivot);
    wings.push(pivot);
  }
  g.userData.wings = wings;
  return g;
}

// A vampire in evening dress: slicked black hair, pale face, red eyes, fangs and a
// high-collared cape spread wide like wings. Origin at the feet; about 2.3 m tall.
let vampMats = null;
export function makeVampire() {
  vampMats ??= {
    black: new THREE.MeshStandardMaterial({ color: 0x111014, roughness: 0.55 }),
    red: new THREE.MeshStandardMaterial({ color: 0x9a0a14, emissive: 0x3a0006, roughness: 0.45, side: THREE.DoubleSide }),
    cape: new THREE.MeshStandardMaterial({ color: 0x141018, roughness: 0.5, side: THREE.DoubleSide }),
    skin: new THREE.MeshStandardMaterial({ color: 0xd8e0d4, emissive: 0x3a4a3a, roughness: 0.6 }), // a ghostly pallor that shows at night
    white: new THREE.MeshStandardMaterial({ color: 0xf6f4ee, roughness: 0.4 }),
    eye: new THREE.MeshBasicMaterial({ color: 0xff1a10 }),
    medal: new THREE.MeshStandardMaterial({ color: 0xd8a830, metalness: 1, roughness: 0.3 }),
  };
  const M = vampMats;
  const g = new THREE.Group();
  const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; g.add(m); return m; };
  for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.1, 0.08, 0.95, 8), M.black, s * 0.13, 0.48, 0); // legs
  add(new THREE.CylinderGeometry(0.24, 0.2, 0.75, 12), M.black, 0, 1.3, 0);  // body
  add(new THREE.BoxGeometry(0.16, 0.42, 0.04), M.white, 0, 1.42, 0.2);       // shirt front
  add(new THREE.SphereGeometry(0.06, 8, 6), M.red, 0, 1.6, 0.23);            // bow
  add(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 12), M.medal, 0, 1.38, 0.235, Math.PI / 2);
  add(new THREE.CylinderGeometry(0.07, 0.09, 0.14, 8), M.skin, 0, 1.74, 0);  // neck
  const head = add(new THREE.SphereGeometry(0.2, 18, 14), M.skin, 0, 1.94, 0);
  head.scale.set(0.9, 1.12, 0.95);
  const hair = add(new THREE.SphereGeometry(0.205, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), M.black, 0, 1.97, -0.015);
  hair.scale.set(0.93, 1.1, 0.98);
  add(new THREE.ConeGeometry(0.05, 0.1, 3), M.black, 0, 2.11, 0.17, Math.PI); // widow's peak
  for (const s of [-1, 1]) {
    add(new THREE.SphereGeometry(0.03, 8, 6), M.eye, s * 0.07, 1.98, 0.17);
    add(new THREE.ConeGeometry(0.012, 0.05, 4), M.white, s * 0.035, 1.82, 0.17, Math.PI); // fangs
    add(new THREE.ConeGeometry(0.035, 0.12, 4), M.skin, s * 0.19, 2.0, 0, 0, 0, -s * 0.5); // pointed ears
    // arms held out holding the cape open
    add(new THREE.CylinderGeometry(0.06, 0.06, 0.75, 8), M.black, s * 0.5, 1.55, 0.02, 0, 0, s * 1.1);
    add(new THREE.SphereGeometry(0.06, 8, 6), M.skin, s * 0.84, 1.75, 0.04);
  }
  // high stand-up collar, red inside
  const collar = new THREE.CylinderGeometry(0.34, 0.2, 0.42, 16, 1, true, Math.PI * 0.6, Math.PI * 1.8);
  add(collar, M.red, 0, 1.92, -0.04);
  // the cape: a scalloped sheet from the hands down to the ground behind
  const shape = new THREE.Shape();
  shape.moveTo(-0.88, 1.75); shape.quadraticCurveTo(0, 1.95, 0.88, 1.75);
  shape.lineTo(0.95, 0.5);
  for (let i = 0; i < 4; i++) { const x0 = 0.95 - i * 0.475; shape.quadraticCurveTo(x0 - 0.24, 0.3, x0 - 0.475, 0.08 + (i % 2) * 0.1); }
  shape.closePath();
  const capeGeo = new THREE.ShapeGeometry(shape, 10);
  const pos = capeGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i); pos.setZ(i, -0.25 - Math.cos(x * 1.6) * 0.25); }
  capeGeo.computeVertexNormals();
  add(capeGeo, M.cape, 0, 0, 0);
  const lining = capeGeo.clone();
  lining.translate(0, 0, 0.015);
  add(lining, M.red, 0, 0, 0).scale.set(0.96, 0.98, 1);
  const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: auraTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.7 }));
  aura.scale.set(3.2, 3.6, 1); aura.position.set(0, 1.3, -0.4);
  g.add(aura);
  return g;
}

let aura = null;
function auraTexture() { // a soft red glow behind the vampire
  if (aura) return aura;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,40,30,0.8)'); gr.addColorStop(1, 'rgba(255,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  aura = new THREE.CanvasTexture(c);
  return aura;
}

// An Aussie meat pie: golden pastry with a crimped rim, a dollop of tomato sauce on top.
let pieGeo = null;
export function pieGeometry() {
  if (pieGeo) return pieGeo;
  const parts = [];
  const tin = new THREE.CylinderGeometry(0.62, 0.5, 0.34, 22);
  tin.translate(0, -0.12, 0);
  parts.push(painted(tin, 0xc98a3c));
  const lid = new THREE.SphereGeometry(0.6, 22, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  lid.scale(1, 0.32, 1); lid.translate(0, 0.04, 0);
  parts.push(painted(lid, 0xe0a24e));
  for (let i = 0; i < 18; i++) { // crimped edge
    const a = (i / 18) * Math.PI * 2;
    const c = new THREE.SphereGeometry(0.1, 6, 4);
    c.scale(1, 0.7, 1); c.translate(Math.cos(a) * 0.6, 0.05, Math.sin(a) * 0.6);
    parts.push(painted(c, i % 2 ? 0xc4802e : 0xe8b060));
  }
  const sauce = new THREE.SphereGeometry(0.26, 14, 8);
  sauce.scale(1, 0.45, 1); sauce.translate(0.05, 0.24, -0.04);
  parts.push(painted(sauce, 0xc8161a));
  pieGeo = mergeGeometries(parts);
  return pieGeo;
}
