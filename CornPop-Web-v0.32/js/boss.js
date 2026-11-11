// BCM: a huge cigar-chomping frog boss in a green suit with a meatball rocket launcher on each shoulder.
// He turns up now and then when CornPop walks into one of a map's big rooms; while he is around no other
// enemies spawn (waves wait until he is beaten or wanders off).
import * as THREE from 'three';
import { CELL } from './world.js';
import { segAabb } from './combat.js';
import { W2 } from './weapons2.js';

export const BCM_ANIMS = { idle: 'Idle_02', walk: 'Walking', run: 'Running', attack: 'Idle_02', death: 'Idle_02', pain: 'Idle_02', taunt: 'Idle_02' };
export const BCM = {
  tall: 296, modelH: 2.24, hw: 58,   // 296 units tall: 4x the tallest enemy (Frenta, 74), ~5x a Qoq (60); CornPop is 56
  height: 292, sfx: 'bcm', fly: false, // `height` follows the shared enemy hit-box convention (top = pos.y + height - 22, pos.y = feet + 26)
  walk: 125, run: 235, turn: 2.2,
  keepNear: 430, keepFar: 820,
  ballSpeed: 650, ballSpeedMad: 760, ballDamage: 15, ballR: 11, splash: 125, splashDamage: 10, knock: 300,
  volley: [1.8, 2.7], volleyMad: [1.0, 1.6],
  stompRange: 120, stompDamage: 8, stompCd: 0.9,
  clear: 310,                          // floor-to-ceiling room needed (he is 296 tall)
  leaveAfter: 14, rearm: 45, startAfter: 12,
};
// boss health per map: skipped on E1M1 (only the soaker by then); grows through each episode
export function bcmHealth(ep, mi) { return 600 + 220 * mi + (ep ? 300 : 0); }

// ------------------------------------------------------------------ big-room finder
// A cell is an arena cell when a square of radius >= 3 cells around it is open, flat (+-32 units) and at least
// BCM.clear tall, and BCM's hull fits there. Connected arena cells form a room; rooms whose widest spot reaches
// radius 7 (a 480-unit square) are big enough for him.
export function findArenas(W, minR = 7, moveR = 3) {
  const w = W.W, h = W.H, N = w * h, rad = new Int8Array(N), fl = new Float32Array(N), good = new Uint8Array(N);
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    const e = W.cells[r][c], i = r * w + c;
    if (e.solid || e.liquid || e.door || e.f == null) continue;
    fl[i] = e.f; good[i] = (e.c - e.f) >= BCM.clear ? 1 : 0;
  }
  for (const f of W.faces) if (f.liquid) { // nothing under water
    const c0 = Math.floor(f.p[0] / CELL), c1 = Math.ceil((f.p[0] + f.w) / CELL), r0 = Math.floor((f.p[2] - f.h) / CELL), r1 = Math.ceil(f.p[2] / CELL);
    for (let r = Math.max(0, r0); r < Math.min(h, r1); r++) for (let c = Math.max(0, c0); c < Math.min(w, c1); c++) if (fl[r * w + c] < f.p[1] + 8) good[r * w + c] = 0;
  }
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    const i = r * w + c; if (!good[i]) continue; const f0 = fl[i]; let R = 0;
    for (let k = 1; k <= 12; k++) { // grow the square ring by ring
      let ok = r - k >= 0 && r + k < h && c - k >= 0 && c + k < w;
      for (let d = -k; ok && d <= k; d++) for (const [rr, cc] of [[r - k, c + d], [r + k, c + d], [r + d, c - k], [r + d, c + k]]) { const j = rr * w + cc; if (!good[j] || Math.abs(fl[j] - f0) > 32) { ok = false; break; } }
      if (!ok) break; R = k;
    }
    rad[i] = R;
  }
  const hmin = [-BCM.hw - 4, 4, -BCM.hw - 4], hmax = [BCM.hw + 4, BCM.tall, BCM.hw + 4];
  const ok = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (rad[i] >= moveR) { const c = i % w, r = (i / w) | 0; if (!W.testPosition([(c + 0.5) * CELL, fl[i], (r + 0.5) * CELL], hmin, hmax)) ok[i] = 1; }
  const seen = new Uint8Array(N), arenas = [];
  for (let i = 0; i < N; i++) {
    if (!ok[i] || seen[i]) continue;
    const cells = new Set(), stack = [i]; seen[i] = 1; let best = i;
    while (stack.length) {
      const j = stack.pop(); cells.add(j); if (rad[j] > rad[best]) best = j;
      const c = j % w, r = (j / w) | 0;
      for (const [cc, rr] of [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]]) { if (cc < 0 || rr < 0 || cc >= w || rr >= h) continue; const k = rr * w + cc; if (ok[k] && !seen[k] && Math.abs(fl[k] - fl[j]) <= 24) { seen[k] = 1; stack.push(k); } }
    }
    if (rad[best] < minR || cells.size < 80) continue;
    const bc = best % w, br = (best / w) | 0;
    arenas.push({ cells, rad, fl, w, center: [(bc + 0.5) * CELL, fl[best], (br + 0.5) * CELL], maxR: rad[best], size: cells.size });
  }
  arenas.sort((a, b) => b.size - a.size);
  return arenas;
}
const cellOf = (A, x, z) => Math.floor(z / CELL) * A.w + Math.floor(x / CELL);

// ------------------------------------------------------------------ soft smoke puffs (one draw call)
const PUFF_VERT = `
attribute float size; attribute float alpha; attribute vec3 tint;
uniform float scale; varying float vA; varying vec3 vC; varying float vFog;
void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
  gl_PointSize = min(512.0, size * scale / max(1.0, -mv.z)); vA = alpha; vC = tint; vFog = -mv.z; }`;
const PUFF_FRAG = `
uniform vec3 fogColor; uniform float fogDensity; varying float vA; varying vec3 vC; varying float vFog;
void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0; if (r > 1.0) discard;
  float a = vA * (1.0 - r * r) * (0.85 + 0.15 * sin(d.x * 9.0 + d.y * 7.0));
  float f = 1.0 - exp(-fogDensity * fogDensity * vFog * vFog);
  gl_FragColor = vec4(mix(vC, fogColor, clamp(f, 0.0, 1.0)), a); }`;
export class Puffs {
  constructor(game, max = 260) {
    this.g = game; this.max = max; this.list = [];
    this.pos = new Float32Array(max * 3); this.size = new Float32Array(max); this.alpha = new Float32Array(max); this.tint = new Float32Array(max * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); geo.setAttribute('size', new THREE.BufferAttribute(this.size, 1));
    geo.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1)); geo.setAttribute('tint', new THREE.BufferAttribute(this.tint, 3));
    this.mat = new THREE.ShaderMaterial({ uniforms: { scale: { value: 400 }, fogColor: game.shared.fogColor, fogDensity: game.shared.fogDensity }, vertexShader: PUFF_VERT, fragmentShader: PUFF_FRAG, transparent: true, depthWrite: false });
    this.points = new THREE.Points(geo, this.mat); this.points.frustumCulled = false; this.points.renderOrder = 6;
    game.scene.add(this.points);
  }
  // p: position, v: velocity, s0 -> s1: size over life, a: peak opacity, grey: [r,g,b]
  spawn(p, v, life, s0, s1, a, col = [0.6, 0.6, 0.6], drag = 0.6) { if (this.list.length >= this.max) this.list.shift(); this.list.push({ p: p.slice(), v: v.slice(), t: 0, life, s0, s1, a, col, drag }); }
  update(dt) {
    const g = this.g, cam = g.camera, keep = []; let n = 0;
    const H = g.rt ? g.rt.height : innerHeight; this.mat.uniforms.scale.value = H * 0.5 / Math.tan(cam.fov * Math.PI / 360);
    for (const q of this.list) {
      q.t += dt; if (q.t >= q.life) continue; keep.push(q);
      const k = Math.exp(-q.drag * dt); q.v[0] *= k; q.v[2] *= k; q.v[1] = q.v[1] * k + 6 * dt;
      q.p[0] += q.v[0] * dt; q.p[1] += q.v[1] * dt; q.p[2] += q.v[2] * dt;
      const u = q.t / q.life; this.pos.set(q.p, n * 3); this.size[n] = q.s0 + (q.s1 - q.s0) * Math.sqrt(u);
      this.alpha[n] = q.a * Math.min(1, u * 6) * (1 - u) * (1 - u); this.tint.set(q.col, n * 3); n++;
    }
    this.list = keep; const geo = this.points.geometry; geo.setDrawRange(0, n);
    for (const k of ['position', 'size', 'alpha', 'tint']) geo.attributes[k].needsUpdate = true;
  }
  dispose() { this.g.scene.remove(this.points); this.points.geometry.dispose(); this.mat.dispose(); }
}

// ------------------------------------------------------------------ meshes: shoulder launchers and meatballs
let meatTex = null;
function meatTexture() {
  if (meatTex) return meatTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.fillStyle = '#6a3418'; x.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 160; i++) { const s = 1 + Math.random() * 3; x.fillStyle = ['#4a220e', '#8a4a24', '#5a2a12', '#9a5a30', '#3e1a0a'][i % 5]; x.fillRect(Math.random() * 64, Math.random() * 64, s, s); }
  for (let i = 0; i < 14; i++) { x.fillStyle = i % 3 ? '#b8200e' : '#d83a18'; x.beginPath(); x.arc(Math.random() * 64, Math.random() * 64, 2 + Math.random() * 4, 0, 7); x.fill(); } // sauce
  for (let i = 0; i < 10; i++) { x.fillStyle = '#3a6a1a'; x.fillRect(Math.random() * 64, Math.random() * 64, 2, 1); } // herbs
  meatTex = new THREE.CanvasTexture(c); meatTex.colorSpace = THREE.NoColorSpace; meatTex.magFilter = THREE.NearestFilter;
  return meatTex;
}
let meatGeo = null, meatMat = null;
// meatballs share one lumpy unit sphere and (unless `own`) one material, so a long fight allocates nothing on the GPU
export function makeMeatball(r = 9, own = false) {
  if (!meatGeo) {
    meatGeo = new THREE.IcosahedronGeometry(1, 1); const p = meatGeo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) * 9, y = p.getY(i) * 9, z = p.getZ(i) * 9, k = 1 + (Math.sin(x * 1.7) * Math.cos(y * 2.3 + z) * 0.09); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); }
    meatGeo.computeVertexNormals();
  }
  const mk = () => new THREE.MeshLambertMaterial({ map: meatTexture(), color: 0x000000, emissive: 0xffffff, emissiveMap: meatTexture() });
  const m = new THREE.Mesh(meatGeo, own ? mk() : (meatMat || (meatMat = mk()))); m.scale.setScalar(r); return m;
}
// one launcher in model metres, barrel along +z. Returns { group, pivot, muzzle, mats }
function makeLauncher(side) {
  const mats = [];
  const M = (hex) => { const m = new THREE.MeshLambertMaterial({ color: 0x000000, emissive: hex }); m.userData.base = new THREE.Color(hex); mats.push(m); return m; };
  const steel = M(0x5a625a), dark = M(0x262826), red = M(0xd02a14), brass = M(0xe0b040), olive = M(0x76864a);
  const group = new THREE.Group(), pivot = new THREE.Group(); group.add(pivot);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.82, 14, 1, true), olive); tube.rotation.x = Math.PI / 2; tube.position.z = 0.04; pivot.add(tube);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.8, 14, 1, true), dark); inner.material.side = THREE.BackSide; inner.rotation.x = Math.PI / 2; inner.position.z = 0.04; pivot.add(inner);
  for (const [z, r, m] of [[0.44, 0.1, steel], [0.35, 0.092, red], [-0.06, 0.092, red], [-0.34, 0.1, steel]]) { const ring = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.05, 14), m); ring.rotation.x = Math.PI / 2; ring.position.z = z; pivot.add(ring); }
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.125, 0.12, 14, 1, true), steel); bell.material.side = THREE.DoubleSide; bell.rotation.x = Math.PI / 2; bell.position.z = -0.41; pivot.add(bell); // exhaust
  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.07, 0.16), dark); sight.position.set(0, 0.11, 0.12); pivot.add(sight);
  const lens = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.03, 0.01), M(0xff3020)); lens.position.set(0, 0.125, 0.205); pivot.add(lens);
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.22), steel); box.position.set(-side * 0.1, -0.02, -0.08); pivot.add(box);
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.02), brass); lamp.position.set(-side * 0.165, 0.0, -0.02); pivot.add(lamp);
  const ball = makeMeatball(0.062, true); ball.position.z = 0.41; pivot.add(ball); // a meatball loaded in the muzzle
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.18), dark); bracket.position.set(-side * 0.06, -0.12, -0.05); bracket.rotation.z = side * 0.5; group.add(bracket);
  const muzzle = new THREE.Object3D(); muzzle.position.z = 0.5; pivot.add(muzzle);
  return { group, pivot, muzzle, mats, ball, exhaust: bell };
}

// ------------------------------------------------------------------ BCM himself
export class Bcm {
  constructor(game, arena, pos, hp) {
    this.game = game; this.arena = arena; this.kind = 'bcm'; this.boss = true; this.K = BCM;
    this.turret = true; // never knocked about by weapon impulses
    this.alive = true; this.awake = true; this.dormant = false; this.exploded = false; this.state = 'intro'; this.stateT = 0;
    this.health = this.maxHealth = hp; this.trailIdx = -1; this.flashT = 0; this.acidT = 0; this.pooT = 0; this.sauceT = 0;
    this.p = [pos[0], pos[1] + 26, pos[2]]; this.feet = pos[1]; this.yaw = 0; this.faceTowards(game.player.pos, 1, 99);
    this.vel = [0, 0]; this.strafe = Math.random() < 0.5 ? -1 : 1; this.strafeT = 2; this.volleyT = 1.6; this.burst = []; this.side = 0; this.stompCd = 0;
    this.painCd = 0; this.mad = false; this.stepT = 0; this.awayT = 0; this.balls = []; this.bits = [];
    this.puffs = new Puffs(game);
    // model
    const M = this.model = game.bcmAsset.instance(); M.root.scale.setScalar(BCM.tall / BCM.modelH);
    for (const m of M.mats) { m.emissiveMap = m.map; m.emissive = new THREE.Color(0, 0, 0); }
    M.root.traverse(o => { if (o.isSkinnedMesh) this.mesh = o; if (o.isMesh) o.frustumCulled = false; });
    const sk = this.mesh.skeleton, spine = sk.bones.findIndex(b => /Spine2$/.test(b.name));
    // launchers ride on the upper spine, sitting just outside the (very wide) head on top of each shoulder
    this.launchers = [];
    for (const side of [1, -1]) { // +x is his left (the model faces +z)
      const L = makeLauncher(side);
      const bind = new THREE.Matrix4().compose(new THREE.Vector3(side * 0.71, 1.64, 0.02), new THREE.Quaternion(), new THREE.Vector3(1.3, 1.3, 1.3));
      L.group.matrixAutoUpdate = false; L.group.matrix.multiplyMatrices(sk.boneInverses[spine], bind);
      sk.bones[spine].add(L.group); this.launchers.push(L);
    }
    // the cigar tip: the vertex furthest out to his right in the head band (found once, followed through the skin every frame)
    const P = this.mesh.geometry.attributes.position; let best = -1, bx = 1e9;
    for (let i = 0; i < P.count; i++) { const y = P.getY(i), x = P.getX(i); if (y > 1.55 && y < 1.95 && Math.abs(x) < 0.6 && P.getZ(i) > 0.3 && x < bx) { bx = x; best = i; } }
    this.cigarIdx = best; this.cigar = new THREE.Vector3(); this.smokeT = 0;
    this.ember = new THREE.Sprite(new THREE.SpriteMaterial({ map: game.glowTex(), color: 0xff6a20, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true })); this.ember.scale.set(14, 14, 1); game.scene.add(this.ember);
    M.setState('idle', 0, true); game.scene.add(M.root);
    this.brush = { min: [0, 0, 0], max: [0, 0, 0], solid: true, shadow: false, enemy: this };
    game.world.addDynamic(this.brush); this.syncBrush(); this.place(0);
  }
  get pos() { return this.p; }
  nearest(q) { const h = BCM.hw * 0.8, c = (v, a, b) => Math.max(a, Math.min(b, v)); return [c(q[0], this.p[0] - h, this.p[0] + h), c(q[1], this.feet + 30, this.feet + BCM.tall - 30), c(q[2], this.p[2] - h, this.p[2] + h)]; }
  eye() { return [this.p[0], this.feet + 250, this.p[2]]; }
  wake() { }
  syncBrush() { const b = this.brush; b.min[0] = this.p[0] - BCM.hw; b.max[0] = this.p[0] + BCM.hw; b.min[2] = this.p[2] - BCM.hw; b.max[2] = this.p[2] + BCM.hw; b.min[1] = this.feet; b.max[1] = this.feet + BCM.tall; }
  faceTowards(t, dt, rate = BCM.turn) {
    const want = Math.atan2(-(t[0] - this.p[0]), -(t[2] - this.p[2]));
    let d = want - this.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    this.yaw += Math.max(-rate * dt, Math.min(rate * dt, d)); return Math.abs(d);
  }
  hurt(n, acid) {
    if (!this.alive) return;
    this.health -= n; this.flashT = 0.1; if (acid) this.acidT = 3;
    if (this.health <= 0) { this.die(); return; }
    if (this.painCd <= 0 && n >= 15) { this.painCd = 1.3; this.game.sfx.play('bcmPain'); }
    if (!this.mad && this.health < this.maxHealth * 0.45) { this.mad = true; this.game.sfx.play('bcmSight'); this.game.hud.print('BCM is fuming!'); }
  }
  die() {
    const g = this.game; this.alive = false; this.state = 'dead'; this.stateT = 0; this.burst.length = 0;
    g.world.removeBrush(this.brush); g.sfx.play('bcmDeath'); g.input.rumble(0.6, 1, 500);
    this.model.setState('idle', 0.3, true); this.model.actions.idle.timeScale = 0.4;
  }
  // ---------------- movement: slide his big hull along the walls, stay inside his room, keep feet on the floor
  tryMove(dx, dz) {
    const g = this.game, W = g.world, A = this.arena;
    const hmin = [-BCM.hw, 40 - 26, -BCM.hw], hmax = [BCM.hw, BCM.tall - 30, BCM.hw];
    const pb = g.playerBrush; if (pb) pb.solid = !g.playerDead;
    for (const ax of [[dx, 0], [0, dz]]) {
      if (!ax[0] && !ax[1]) continue;
      const e = [this.p[0] + ax[0], this.p[1], this.p[2] + ax[1]];
      const ci = cellOf(A, e[0], e[2]); if (!A.cells.has(ci)) { this.bumped = true; continue; } // leash: never leaves his room
      const tr = W.trace(this.p, e, hmin, hmax, this.brush, true);
      if (tr.fraction < 1) this.bumped = true;
      if (tr.fraction > 0.02 && !tr.startsolid) { this.p[0] = tr.end[0]; this.p[2] = tr.end[2]; }
    }
    if (pb) pb.solid = false;
    const f = A.fl[cellOf(A, this.p[0], this.p[2])]; if (f != null) this.feet += (f - this.feet) * 0.3; this.p[1] = this.feet + 26;
  }
  place(dt) {
    const M = this.model; let y = this.feet, tilt = 0;
    if (this.state === 'intro') { const k = Math.min(1, this.stateT / 0.9); y = this.feet - (1 - k) * (1 - k) * 60; }
    if (this.state === 'dead') { const k = Math.min(1, this.stateT / 1.3); tilt = -k * k * 1.45; y = this.feet + Math.sin(k * Math.PI) * 20 - k * 18; }
    M.root.position.set(this.p[0], y, this.p[2]); M.root.rotation.order = 'YXZ'; M.root.rotation.set(tilt, this.yaw + Math.PI, 0);
  }
  // ---------------- meatball rockets
  fire() {
    const g = this.game, pl = g.player, L = this.launchers[this.side]; this.side ^= 1;
    this.model.root.updateMatrixWorld(true);
    const m = new THREE.Vector3(); L.muzzle.getWorldPosition(m); const from = [m.x, m.y, m.z];
    const sp = this.mad ? BCM.ballSpeedMad : BCM.ballSpeed;
    const tgt = [pl.pos[0], pl.pos[1] + 2, pl.pos[2]], d = Math.hypot(tgt[0] - from[0], tgt[1] - from[1], tgt[2] - from[2]);
    const lead = Math.random() < 0.6 ? d / sp * 0.75 : 0; // most shots lead the target; some fly straight at you
    tgt[0] += pl.vel[0] * lead; tgt[2] += pl.vel[2] * lead; if (!pl.onground) tgt[1] += Math.max(-80, Math.min(80, pl.vel[1] * lead * 0.5));
    const dx = tgt[0] - from[0], dy = tgt[1] - from[1], dz = tgt[2] - from[2], l = Math.hypot(dx, dy, dz) || 1;
    if (g.world.rayFrac(this.eye(), from) < 0.98) return; // muzzle poked into a wall: skip this one
    const mesh = makeMeatball(BCM.ballR); mesh.position.set(...from); g.scene.add(mesh);
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: g.glowTex(), color: 0xff7a20, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true })); flame.scale.set(34, 34, 1); g.scene.add(flame);
    this.balls.push({ p: from, v: [dx / l * sp, dy / l * sp, dz / l * sp], mesh, flame, t: 0, spin: [Math.random() * 8 - 4, Math.random() * 8 - 4] });
    g.sfx.play('meatLaunch', this.vol(1));
    // muzzle and exhaust smoke, launcher kick
    const back = new THREE.Vector3(); L.exhaust.getWorldPosition(back);
    for (let i = 0; i < 6; i++) { this.puffs.spawn(from, [dx / l * 60 + (Math.random() - 0.5) * 40, 20 + Math.random() * 20, dz / l * 60 + (Math.random() - 0.5) * 40], 1.1, 16, 60, 0.5, [0.72, 0.7, 0.66], 2); this.puffs.spawn([back.x, back.y, back.z], [-dx / l * 120 + (Math.random() - 0.5) * 50, 10 + Math.random() * 30, -dz / l * 120 + (Math.random() - 0.5) * 50], 1.3, 18, 70, 0.55, [0.62, 0.6, 0.57], 2); }
    for (let i = 0; i < 10; i++) g.particles.spawn(from, [dx / l * 200 + (Math.random() - 0.5) * 120, dy / l * 200 + Math.random() * 60, dz / l * 200 + (Math.random() - 0.5) * 120], [1, 0.6 + Math.random() * 0.3, 0.15], 0.25, 0, 3);
    L.kick = 1; L.ball.visible = false; L.reload = 0.5;
  }
  boom(p, direct) {
    const g = this.game, pl = g.player; g.sfx.play('meatBoom', this.vol(0.6, p)); g.meatBurst(p, 30);
    for (let i = 0; i < 18; i++) g.particles.spawn(p, [(Math.random() - 0.5) * 260, Math.random() * 200, (Math.random() - 0.5) * 260], Math.random() < 0.5 ? [0.85, 0.15, 0.05] : [1, 0.62, 0.2], 0.5 + Math.random() * 0.5, 500, 1);
    for (let i = 0; i < 5; i++) this.puffs.spawn(p, [(Math.random() - 0.5) * 90, 30 + Math.random() * 40, (Math.random() - 0.5) * 90], 1.4, 20, 80, 0.5, [0.45, 0.4, 0.36], 1.5);
    for (let i = 0; i < 5; i++) this.addBit(p, [(Math.random() - 0.5) * 300, 120 + Math.random() * 200, (Math.random() - 0.5) * 300], 0.35 + Math.random() * 0.25);
    const fl = g.world.floorAt(p[0], p[2]); if (Math.abs(p[1] - fl) < 60) g.addPuddle([p[0], fl, p[2]], 0xa01c0c);
    if (g.playerDead) return;
    const pc = pl.pos, dp = Math.hypot(pc[0] - p[0], pc[1] - p[1], pc[2] - p[2]);
    if (direct) { g.damagePlayer(BCM.ballDamage); g.flash = { rgb: [0.85, 0.2, 0.05], a: 0.5 }; g.input.rumble(0.8, 1, 300); }
    else if (dp < BCM.splash && g.world.rayFrac(p, pc) > 0.98) g.damagePlayer(Math.max(2, Math.round(BCM.splashDamage * (1 - dp / BCM.splash))));
    if (dp < BCM.splash * 1.2) { const k = 1 - dp / (BCM.splash * 1.2), l = dp || 1; pl.vel[0] += (pc[0] - p[0]) / l * BCM.knock * k; pl.vel[2] += (pc[2] - p[2]) / l * BCM.knock * k; pl.vel[1] += BCM.knock * 0.55 * k; }
  }
  addBit(p, v, s) { const m = makeMeatball(BCM.ballR * s); m.position.set(...p); this.game.scene.add(m); this.bits.push({ p: p.slice(), v, m, t: 0, r: BCM.ballR * s }); }
  updateBalls(dt) {
    const g = this.game, pl = g.player, keep = [], L = g.pointLight(g.player.pos), lc = [Math.min(1.6, L[0] * 0.9 + 0.25), Math.min(1.6, L[1] * 0.9 + 0.2), Math.min(1.6, L[2] * 0.9 + 0.18)];
    for (const b of this.balls) {
      b.t += dt; const p1 = [b.p[0] + b.v[0] * dt, b.p[1] + b.v[1] * dt, b.p[2] + b.v[2] * dt]; let hit = null, direct = false;
      const r = BCM.ballR - 2;
      if (!g.playerDead && segAabb(b.p, p1, [pl.pos[0] - 16 - r, pl.pos[1] - 24 - r, pl.pos[2] - 16 - r], [pl.pos[0] + 16 + r, pl.pos[1] + 32 + r, pl.pos[2] + 16 + r]) >= 0) { hit = b.p; direct = true; }
      else { const tr = g.world.trace(b.p, p1, [-r, -r, -r], [r, r, r], this.brush, true); if (tr.fraction < 1) hit = tr.end; }
      if (hit || b.t > 6) { g.scene.remove(b.mesh); g.scene.remove(b.flame); b.flame.material.dispose(); if (hit) this.boom(hit, direct); continue; }
      b.p = p1; b.mesh.position.set(...p1); b.mesh.rotation.x += b.spin[0] * dt; b.mesh.rotation.y += b.spin[1] * dt; b.mesh.material.emissive.setRGB(...lc);
      const sp = Math.hypot(b.v[0], b.v[1], b.v[2]) || 1; b.flame.position.set(p1[0] - b.v[0] / sp * 12, p1[1] - b.v[1] / sp * 12, p1[2] - b.v[2] / sp * 12); const fs = 30 + Math.sin(b.t * 50) * 8; b.flame.scale.set(fs, fs, 1);
      b.trail = (b.trail || 0) + dt * 28; while (b.trail > 1) { b.trail -= 1; this.puffs.spawn([p1[0] - b.v[0] / sp * 16, p1[1] - b.v[1] / sp * 16, p1[2] - b.v[2] / sp * 16], [(Math.random() - 0.5) * 14, 8, (Math.random() - 0.5) * 14], 0.9, 8, 34, 0.4, [0.7, 0.68, 0.64], 1); }
      keep.push(b);
    }
    this.balls = keep;
    const kb = [];
    for (const q of this.bits) { // meatball chunks bouncing about
      q.t += dt; q.v[1] -= 700 * dt; const np = [q.p[0] + q.v[0] * dt, q.p[1] + q.v[1] * dt, q.p[2] + q.v[2] * dt];
      const fl = g.world.floorAt(np[0], np[2]) + q.r; if (np[1] < fl) { np[1] = fl; q.v[1] = Math.abs(q.v[1]) * 0.35; q.v[0] *= 0.6; q.v[2] *= 0.6; }
      if (g.world.testPosition(np, [-2, -2, -2], [2, 2, 2])) { q.v[0] *= -0.4; q.v[2] *= -0.4; np[0] = q.p[0]; np[2] = q.p[2]; }
      q.p = np; q.m.position.set(...np); q.m.rotation.x += q.v[2] * dt * 0.05; q.m.rotation.z -= q.v[0] * dt * 0.05; q.m.material.emissive.setRGB(...lc);
      if (q.t > 9) { q.m.scale.multiplyScalar(Math.max(0, 1 - dt * 3)); if (q.t > 10) { g.scene.remove(q.m); continue; } }
      kb.push(q);
    }
    this.bits = kb;
  }
  vol(base, at) { const pl = this.game.player.pos, p = at || this.p, d = Math.hypot(pl[0] - p[0], pl[2] - p[2]); return base * Math.max(0.25, Math.min(1, 900 / Math.max(1, d))); }
  // ---------------- per frame
  update(dt) {
    const g = this.game, pl = g.player, M = this.model;
    this.updateBalls(dt); this.puffs.update(dt);
    if (this.exploded) return;
    this.stateT += dt; this.flashT -= dt; this.painCd -= dt; this.stompCd -= dt;
    if (this.acidT > 0 && this.alive) { this.acidT -= dt; this.hurt(8 * dt); }
    if (this.pooT > 0) this.pooT -= dt; if (this.sauceT > 0) this.sauceT -= dt;
    const dist = Math.hypot(pl.pos[0] - this.p[0], pl.pos[2] - this.p[2]);
    if (this.alive && this.state === 'intro') {
      this.faceTowards(pl.pos, dt, 3);
      if (this.stateT > 1.6) { this.state = 'fight'; this.stateT = 0; }
    } else if (this.alive && !g.playerDead) {
      const slow = this.pooT > 0 ? 0.55 : this.sauceT > 0 ? 0.7 : 1;
      this.sees = g.world.rayFrac(this.eye(), pl.eye()) > 0.98;
      this.faceTowards(pl.pos, dt, BCM.turn * (this.mad ? 1.3 : 1));
      // keep a comfortable range, strafe sideways, close in when he lost sight of you
      const ux = (pl.pos[0] - this.p[0]) / (dist || 1), uz = (pl.pos[2] - this.p[2]) / (dist || 1);
      this.strafeT -= dt; if (this.strafeT <= 0 || this.bumped) { this.strafeT = 1.5 + Math.random() * 2.2; this.strafe = this.bumped ? -this.strafe : Math.random() < 0.3 ? 0 : (Math.random() < 0.5 ? -1 : 1); this.bumped = false; }
      let fwd = !this.sees ? 1 : dist > BCM.keepFar ? 1 : dist < BCM.keepNear ? -0.6 : 0;
      const run = (!this.sees && dist > 500) || dist > BCM.keepFar + 300;
      const sp = (run ? BCM.run : BCM.walk) * (this.mad ? 1.2 : 1) * slow;
      let mx = (ux * fwd - uz * this.strafe * 0.8), mz = (uz * fwd + ux * this.strafe * 0.8); const ml = Math.hypot(mx, mz);
      if (ml > 0.01) { mx /= ml; mz /= ml; }
      const k = Math.min(1, dt * 3); this.vel[0] += (mx * sp * (ml > 0.01 ? 1 : 0) - this.vel[0]) * k; this.vel[1] += (mz * sp * (ml > 0.01 ? 1 : 0) - this.vel[1]) * k;
      this.tryMove(this.vel[0] * dt, this.vel[1] * dt);
      // volleys from alternating shoulders
      this.volleyT -= dt;
      if (this.volleyT <= 0 && this.sees && dist < 2400) {
        const V = this.mad ? BCM.volleyMad : BCM.volley; this.volleyT = V[0] + Math.random() * (V[1] - V[0]);
        const n = this.mad ? 3 : Math.random() < 0.35 ? 1 : 2; for (let i = 0; i < n; i++) this.burst.push(this.stateT + i * 0.32);
      }
      if (this.burst.length && this.stateT >= this.burst[0]) { this.burst.shift(); this.fire(); }
      // too close: a stomp that shoves CornPop away
      if (dist < BCM.stompRange + 20 && Math.abs(pl.pos[1] - 24 - this.feet) < 90 && this.stompCd <= 0) {
        this.stompCd = BCM.stompCd; g.damagePlayer(BCM.stompDamage); g.sfx.play('bcmStep', 1); g.input.rumble(0.7, 1, 250);
        pl.vel[0] += ux * 520; pl.vel[2] += uz * 520; pl.vel[1] += 260; pl.landKick = Math.min(10, (pl.landKick || 0) + 6);
      }
    } else if (this.alive) { this.vel[0] *= 0.9; this.vel[1] *= 0.9; }
    // launchers: aim the barrels, recoil, reload
    const tgtY = pl.pos[1] + 4;
    for (const L of this.launchers) {
      const want = Math.max(-0.5, Math.min(0.9, Math.atan2(this.feet + 220 - tgtY, Math.max(60, dist))));
      L.pivot.rotation.x += (want - L.pivot.rotation.x) * Math.min(1, dt * 6);
      L.kick = Math.max(0, (L.kick || 0) - dt * 5); L.pivot.position.z = -L.kick * 0.09;
      if (L.reload > 0) { L.reload -= dt; if (L.reload <= 0) L.ball.visible = true; }
    }
    // animation + footsteps
    const spd = Math.hypot(this.vel[0], this.vel[1]);
    if (this.alive && this.state === 'fight') {
      const want = spd > 170 ? 'run' : spd > 25 ? 'walk' : 'idle'; M.setState(want, 0.3);
      if (M.actions[want]) M.actions[want].timeScale = want === 'run' ? Math.max(0.6, spd / 260) : want === 'walk' ? Math.max(0.5, spd / 150) : 1;
      if (want !== 'idle') { this.stepT -= dt * (want === 'run' ? 2.4 : 1.6) * Math.max(0.6, spd / (want === 'run' ? 260 : 150)); if (this.stepT <= 0) { this.stepT = 1; g.sfx.play('bcmStep', this.vol(0.8)); if (dist < 900) pl.landKick = Math.min(10, (pl.landKick || 0) + 2.5 * (1 - dist / 900)); } }
    }
    M.update(dt); this.place(dt); M.root.updateMatrixWorld(true);
    // cigar smoke + glowing ember
    if (this.cigarIdx >= 0 && (this.alive || this.stateT < 1.2)) {
      this.mesh.getVertexPosition(this.cigarIdx, this.cigar); this.cigar.applyMatrix4(this.mesh.matrixWorld);
      const c = this.cigar; this.ember.position.copy(c); this.ember.visible = true; const es = 10 + Math.sin(g.time * 3) * 2 + (Math.random() < 0.05 ? 4 : 0); this.ember.scale.set(es, es, 1);
      this.smokeT += dt * (this.mad ? 14 : 9);
      while (this.smokeT > 1) { this.smokeT -= 1; this.puffs.spawn([c.x, c.y + 2, c.z], [(Math.random() - 0.5) * 10 - this.vel[0] * 0.3, 26 + Math.random() * 14, (Math.random() - 0.5) * 10 - this.vel[1] * 0.3], 2.4 + Math.random(), 5, 50, 0.55, [0.78, 0.78, 0.8], 0.8); }
    } else this.ember.visible = false;
    // lighting from the lightmapped world + hurt / goo tints
    const Lt = g.pointLight([this.p[0], this.feet + 150, this.p[2]]);
    let r = Lt[0] * 0.62, gg = Lt[1] * 0.62, b = Lt[2] * 0.62;
    if (this.acidT > 0) { const k = 0.3 + 0.2 * Math.sin(g.time * 18); r += k * 0.8; gg += k; b *= 0.6; }
    if (this.pooT > 0) { r = r * 0.55 + 0.18; gg = gg * 0.38 + 0.08; b *= 0.2; }
    if (this.sauceT > 0) { const k = 0.45 + 0.2 * Math.sin(g.time * 12); r = r * 0.6 + k; gg *= 0.35; b *= 0.3; }
    if (this.flashT > 0) { r += 0.7; gg += 0.5; b += 0.2; }
    if (this.mad) { const k = 0.12 + 0.08 * Math.sin(g.time * 6); r += k; }
    for (const m of M.mats) m.emissive.setRGB(r, gg, b);
    const lk = Math.min(1.5, Lt[0] * 0.75 + 0.15);
    for (const L of this.launchers) for (const m of L.mats) m.emissive.copy(m.userData.base).multiplyScalar(lk + (this.flashT > 0 ? 0.4 : 0));
    if (this.alive) this.syncBrush();
    if (!this.alive && this.stateT > 1.5 && !this.exploded) this.burstApart();
  }
  burstApart() {
    const g = this.game, p = [this.p[0], this.feet + 60, this.p[2]]; this.exploded = true;
    g.sfx.play('meatBoom', 1); g.sfx.play('turdBoom'); g.input.rumble(1, 1, 600);
    g.meatBurst(p, 60); for (let i = 0; i < 26; i++) this.addBit([p[0] + (Math.random() - 0.5) * 80, p[1] + Math.random() * 80, p[2] + (Math.random() - 0.5) * 80], [(Math.random() - 0.5) * 520, 200 + Math.random() * 360, (Math.random() - 0.5) * 520], 0.6 + Math.random() * 0.9);
    for (let i = 0; i < 14; i++) this.puffs.spawn([p[0] + (Math.random() - 0.5) * 120, p[1] + Math.random() * 100, p[2] + (Math.random() - 0.5) * 120], [(Math.random() - 0.5) * 60, 30 + Math.random() * 30, (Math.random() - 0.5) * 60], 2.5, 40, 140, 0.5, [0.4, 0.36, 0.33], 0.8);
    g.scene.remove(this.model.root); this.ember.visible = false;
    g.bossDefeated(this);
  }
  // removed without a fight (CornPop left the area, or the level ended)
  vanish(fx = true) {
    const g = this.game; this.exploded = true; this.alive = false; g.world.removeBrush(this.brush); g.scene.remove(this.model.root); this.ember.visible = false;
    if (fx) { g.teleportFx([this.p[0], this.feet + 40, this.p[2]]); g.teleportFx([this.p[0], this.feet + 160, this.p[2]]); g.sfx.play('teleport'); }
  }
}

// ------------------------------------------------------------------ when and where he shows up
export class BossDirector {
  constructor(game) {
    this.game = game; this.boss = null; this.lairs = []; this.cool = 0;
    const { ep, mi } = game; if (!game.bcmAsset || (ep !== 1 && mi === 0)) return; // no boss on the first map of Episodes 1 and 3
    let arenas = findArenas(game.world); const st = game.ents.find(e => e.type === 'start').pos;
    arenas = arenas.filter(a => !a.cells.has(cellOf(a, st[0], st[2])) && Math.hypot(a.center[0] - st[0], a.center[2] - st[2]) > 700);
    for (let i = arenas.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arenas[i], arenas[j]] = [arenas[j], arenas[i]]; }
    const n = Math.min(arenas.length, arenas.length >= 3 && mi >= 3 ? 2 : 1); // now and then: one or two of the map's big rooms
    this.lairs = arenas.slice(0, n).map(a => ({ a, armed: true, hp: bcmHealth(ep, mi) }));
    this.arenas = arenas;
  }
  get active() { return !!(this.boss && this.boss.alive); }
  waveBusy() { for (const w of this.game.waves.values()) if (w.state === 'active' && w.members.some(q => q.alive && !q.dormant)) return true; return false; }
  update(dt) {
    const g = this.game, pl = g.player; this.cool -= dt;
    const B = this.boss;
    if (B && B.alive) { // wandered off? he stomps away and waits for you to come back
      const inRoom = B.arena.cells.has(cellOf(B.arena, pl.pos[0], pl.pos[2])), d = Math.hypot(pl.pos[0] - B.p[0], pl.pos[2] - B.p[2]);
      B.awayT = !inRoom && d > 1500 && !B.sees ? B.awayT + dt : 0;
      if (B.awayT > BCM.leaveAfter) { const lair = this.lairs.find(l => l.a === B.arena); if (lair) { lair.armed = true; lair.hp = B.health; } B.vanish(); g.hud.print('BCM stomped off...'); this.cool = BCM.rearm; this.boss = B; }
      return;
    }
    if (g.playerDead || g.time < BCM.startAfter || this.cool > 0 || this.waveBusy()) return;
    for (const L of this.lairs) {
      if (!L.armed || !L.a.cells.has(cellOf(L.a, pl.pos[0], pl.pos[2]))) continue;
      const at = this.spawnSpot(L.a); if (!at) continue;
      L.armed = false; this.spawn(L, at); return;
    }
  }
  spawnSpot(A) { // far enough from CornPop to see him coming, close enough to fight, in plain view
    const g = this.game, pl = g.player.pos; let best = null, bs = -1;
    for (const i of A.cells) {
      if (A.rad[i] < 4) continue; const x = (i % A.w + 0.5) * CELL, z = ((i / A.w | 0) + 0.5) * CELL, f = A.fl[i];
      const d = Math.hypot(x - pl[0], z - pl[2]); if (d < 380) continue;
      const s = Math.min(d, 760) - Math.max(0, d - 760) * 0.5 + A.rad[i] * 6 + Math.random() * 30; if (s <= bs) continue;
      if (g.world.rayFrac([x, f + 250, z], g.player.eye()) < 0.98) continue;
      best = [x, f, z]; bs = s;
    }
    return best;
  }
  spawn(L, at) {
    const g = this.game; if (this.boss) { const o = this.boss; o.puffs.dispose(); for (const b of o.balls) { g.scene.remove(b.mesh); g.scene.remove(b.flame); } for (const q of o.bits) g.scene.remove(q.m); g.enemies = g.enemies.filter(e => e !== o); }
    const B = this.boss = new Bcm(g, L.a, at, L.hp); g.enemies.push(B);
    for (let k = 0; k < 4; k++) g.teleportFx([at[0] + (Math.random() - 0.5) * 60, at[1] + 30 + k * 70, at[2] + (Math.random() - 0.5) * 60]);
    g.sfx.play('spawn'); g.sfx.play('bcmSight'); g.input.rumble(0.6, 0.8, 400);
    g.hud.centerPrint('BCM HAS ENTERED THE ROOM!\nWATCH OUT FOR THE MEATBALLS', 3);
    // a little supply drop near CornPop: ammo for what you carry, and a health pack
    const pl = g.player.pos, spots = [...L.a.cells].filter(i => { const x = (i % L.a.w + 0.5) * CELL, z = ((i / L.a.w | 0) + 0.5) * CELL, d = Math.hypot(x - pl[0], z - pl[2]); return d > 120 && d < 500; });
    const drop = (type, amount) => { if (!spots.length) return; const i = spots.splice(Math.floor(Math.random() * spots.length), 1)[0]; g.dropPickup(type, [(i % L.a.w + 0.5) * CELL, L.a.fl[i], ((i / L.a.w | 0) + 0.5) * CELL], amount); };
    const own = g.arsenal.owned();
    if (own.length) { const k = own[Math.floor(Math.random() * own.length)]; drop(W2[k].ammoItem, W2[k].box); }
    if (g.hasTurd) drop('turdbox', 4); else if (g.hasShotgun) drop('sausages', 12); else drop('juice', 50);
    drop('health', 25);
  }
  clear() { if (this.boss && !this.boss.exploded) this.boss.vanish(false); if (this.boss) this.boss.puffs.dispose(); this.boss = null; }
}
