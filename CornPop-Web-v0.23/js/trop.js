// Trop: a frog in a red tailcoat and powdered wig who plays the trumpet. When he puts the trumpet to his lips and blows,
// out flies a pork chop. He moves exactly like CornPop (the Quake III player physics in player.js): he runs, jumps onto
// ledges and crates, rides lifts, takes teleporters, and follows CornPop's trail around the map until he is beaten.
// He is not placed in the maps: TropDirector sends him in, sparingly, when CornPop is having too easy a time.
import * as THREE from 'three';
import { Player, HULL_MIN, HULL_MAX } from './player.js';
import { segAabb } from './combat.js';

export const TROP_ANIMS = { idle: 'Running', run: 'Running' };
export const TROP = {
  health: 220, speed: 295, height: 64, modelH: 2.1, sfx: 'trop', fly: false,
  chopDamage: 12, chopSpeed: 640, chopGravity: 260, attackRange: 1100, minRange: 70, attackCd: [1.3, 2.3],
  raise: 0.32, blowAt: 0.5, lower: 1.1, // trumpet timing (s)
  jumpLook: 30, stuckJump: 0.22, warpAfter: 7, eatChop: 3,
};

// ------------------------------------------------------------------ shared meshes (built once)
let SH = null;
function shared(game) {
  if (SH) return SH;
  const brass = new THREE.MeshStandardMaterial({ color: 0xd8a431, metalness: 0.85, roughness: 0.28, envMap: game.envMap || null });
  brass.userData.base = brass.color.clone();
  // trumpet, built along +z with the mouthpiece at the origin (game units: about 28 long)
  const parts = [];
  const tube = (r, len, z, rx = 0, y = 0) => { const g = new THREE.CylinderGeometry(r, r, len, 10, 1, true); g.rotateX(Math.PI / 2); g.translate(0, y, z + len / 2); parts.push(g); };
  { const g = new THREE.CylinderGeometry(0.55, 1.1, 2.2, 10, 1); g.rotateX(-Math.PI / 2); g.translate(0, 0, 1.1); parts.push(g); } // mouthpiece cup
  tube(0.5, 10, 2);              // lead pipe
  tube(0.55, 12, 4, 0, -3.2);    // lower tube
  { const g = new THREE.TorusGeometry(1.6, 0.5, 6, 12, Math.PI); g.rotateZ(Math.PI / 2); g.rotateY(Math.PI / 2); g.translate(0, -1.6, 4); parts.push(g); } // back crook
  for (const z of [8.2, 10, 11.8]) { const g = new THREE.CylinderGeometry(0.75, 0.75, 4.4, 10); g.translate(0, -1.4, z); parts.push(g); const c = new THREE.CylinderGeometry(0.55, 0.55, 0.9, 8); c.translate(0, 1.2, z); parts.push(c); } // valves + caps
  { const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(0.55 + Math.pow(t, 3.2) * 4.6, t * 9)); } const g = new THREE.LatheGeometry(pts, 16); g.rotateX(Math.PI / 2); g.translate(0, 0, 12); parts.push(g); } // bell
  const merged = mergeGeos(parts);
  // pork chop: an extruded chop with a fat rim and grill marks, plus the bone
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.fillStyle = '#f2e6d0'; x.fillRect(0, 0, 64, 64);              // fat
  x.fillStyle = '#c87a62'; x.beginPath(); x.ellipse(32, 34, 24, 20, 0, 0, 7); x.fill(); // meat
  x.fillStyle = '#a85a46'; for (let i = 0; i < 40; i++) x.fillRect(12 + Math.random() * 40, 18 + Math.random() * 32, 2, 1);
  x.strokeStyle = '#4a2416'; x.lineWidth = 3; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(8 + i * 14, 12); x.lineTo(i * 14 - 6, 58); x.stroke(); } // grill marks
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.NoColorSpace;
  const s = new THREE.Shape(); s.moveTo(-7, 0); s.bezierCurveTo(-7.5, 6, -2, 8.5, 2.5, 7); s.bezierCurveTo(7, 5.5, 8, 1, 6.5, -2.5); s.bezierCurveTo(5, -6, 0, -7, -3, -5.5); s.bezierCurveTo(-5.5, -4.5, -6.5, -2.5, -7, 0);
  const chopGeo = new THREE.ExtrudeGeometry(s, { depth: 2.2, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.6, bevelSegments: 1, curveSegments: 8 });
  chopGeo.translate(0, 0, -1.1); { const p = chopGeo.attributes.position, uv = chopGeo.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + 8) / 16, (p.getY(i) + 8) / 16); }
  const chopMat = new THREE.MeshLambertMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: tex, map: tex });
  const boneGeo = mergeGeos([(() => { const g = new THREE.CylinderGeometry(0.8, 0.8, 7, 6); g.rotateZ(Math.PI / 2 - 0.4); g.translate(-9, -2.5, 0); return g; })(), (() => { const g = new THREE.SphereGeometry(1.4, 6, 4); g.translate(-12.2, -3.9, 0); return g; })()]);
  const boneMat = new THREE.MeshLambertMaterial({ color: 0x000000, emissive: 0xf4ecd8 }); boneMat.userData.base = new THREE.Color(0xf4ecd8);
  SH = { brass, trumpetGeo: merged, chopGeo, chopMat, boneGeo, boneMat };
  return SH;
}
function mergeGeos(list) { // tiny BufferGeometry merge (position/normal/uv), avoids pulling in BufferGeometryUtils
  const geos = list.map(g => g.index ? g.toNonIndexed() : g); let n = 0; for (const g of geos) n += g.attributes.position.count;
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2); let o = 0;
  for (const g of geos) { const c = g.attributes.position.count; P.set(g.attributes.position.array, o * 3); if (!g.attributes.normal) g.computeVertexNormals(); N.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) U.set(g.attributes.uv.array, o * 2); o += c; }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(P, 3)); m.setAttribute('normal', new THREE.BufferAttribute(N, 3)); m.setAttribute('uv', new THREE.BufferAttribute(U, 2)); return m;
}
function makeChop(game) { const S = shared(game), g = new THREE.Group(); g.add(new THREE.Mesh(S.chopGeo, S.chopMat)); g.add(new THREE.Mesh(S.boneGeo, S.boneMat)); g.scale.setScalar(1.15); return g; }

// ------------------------------------------------------------------ two-bone IK helpers
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion();
function wpos(o, v) { return v.setFromMatrixPosition(o.matrixWorld); }
// rotate bone so the direction (bone -> child) points at `dir` (world); blend weight w
function aimBone(bone, child, dir, w) {
  const a = wpos(bone, _v1), b = wpos(child, _v2); const cur = b.sub(a).normalize();
  _q1.setFromUnitVectors(cur, dir);                                  // world-space delta
  bone.getWorldQuaternion(_q2); _q3.copy(_q1).multiply(_q2);         // new world rotation
  bone.parent.getWorldQuaternion(_q2); _q2.invert().multiply(_q3);   // back to local
  bone.quaternion.slerp(_q2, w); bone.updateMatrixWorld(true);
}
function solveArm(up, lo, hand, target, pole, w) {
  const S = wpos(up, new THREE.Vector3()), E = wpos(lo, new THREE.Vector3()), H = wpos(hand, new THREE.Vector3());
  const L1 = S.distanceTo(E), L2 = E.distanceTo(H); const toT = target.clone().sub(S); let d = toT.length();
  d = Math.max(0.01, Math.min(L1 + L2 - 0.01, d)); const u = toT.normalize();
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const pv = pole.clone().sub(S); pv.sub(u.clone().multiplyScalar(pv.dot(u))); if (pv.lengthSq() < 1e-8) pv.set(0, -1, 0); pv.normalize();
  const elbow = S.clone().add(u.clone().multiplyScalar(a)).add(pv.multiplyScalar(h));
  aimBone(up, lo, elbow.clone().sub(S).normalize(), w);
  const E2 = wpos(lo, new THREE.Vector3()); aimBone(lo, hand, target.clone().sub(E2).normalize(), w);
}

// ------------------------------------------------------------------ Trop
let TID = 0;
export class Trop {
  constructor(game, pos, yaw = 0) {
    this.game = game; this.id = 't' + TID++; this.kind = 'trop'; this.K = TROP;
    this.pm = new Player(game.world); this.pm.maxspeed = TROP.speed; this.pm.autoHop = true;
    this.pm.spawn([pos[0], pos[1], pos[2]], yaw * 180 / Math.PI);
    this.brush = { min: [0, 0, 0], max: [0, 0, 0], solid: true, shadow: false, enemy: this }; this.pm.ignore = this.brush;
    this.health = TROP.health; this.alive = true; this.awake = true; this.dormant = false; this.turret = false; this.state = 'chase'; this.stateT = 0;
    this.flashT = 0; this.acidT = 0; this.pooT = 0; this.sauceT = 0; this.painCd = 0;
    this.attackCd = 1 + Math.random(); this.trailIdx = game.trail.length - 1; this.thinkT = 0; this.direct = false;
    this.stats = { warps: 0, jumps: 0, chops: 0 }; this.stuckT = 0; this.progressT = 0; this.bestDist = 1e9; this.jumpCd = 0; this.chops = []; this.blowK = 0; this.yaw = yaw; this.deadT = 0;
    // model
    const M = this.model = game.tropAsset.instance(); M.root.scale.setScalar(TROP.height / TROP.modelH);
    for (const m of M.mats) { m.emissiveMap = m.map; m.emissive = new THREE.Color(0, 0, 0); }
    M.root.traverse(o => { if (o.isSkinnedMesh) this.mesh = o; });
    this.run = M.actions.run; this.run.play();
    const B = n => M.root.getObjectByName(n);
    this.bones = { ru: B('RightUpperArm'), rl: B('RightLowerArm'), rh: B('RightHand'), lu: B('LeftUpperArm'), ll: B('LeftLowerArm'), lh: B('LeftHand'), head: B('Head') };
    // the middle of his lips: the front-most vertex in the mouth band (followed through the skin)
    const P = this.mesh.geometry.attributes.position; let best = -1, bz = -1e9;
    for (let i = 0; i < P.count; i++) { const y = P.getY(i), x = P.getX(i), z = P.getZ(i); if (y > 1.62 && y < 1.8 && Math.abs(x) < 0.08 && z > bz) { bz = z; best = i; } }
    this.mouthIdx = best; this.mouth = new THREE.Vector3();
    const S = shared(game); this.trumpet = new THREE.Mesh(S.trumpetGeo, S.brass.clone()); this.trumpet.material.userData.base = S.brass.userData.base; this.trumpet.scale.setScalar(1.6); game.scene.add(this.trumpet);
    game.scene.add(M.root); game.world.addDynamic(this.brush); this.syncBrush();
  }
  get pos() { return this.pm.pos; }
  set pos(v) { this.pm.pos = v; }
  get phys() { return this.pm; }
  eye() { return [this.pm.pos[0], this.pm.pos[1] + 26, this.pm.pos[2]]; }
  canSee(p) { return this.game.world.trace(this.eye(), p, [-1, -1, -1], [1, 1, 1], null, true).fraction >= 0.999; }
  wake() { }
  syncBrush() { const p = this.pm.pos; for (let a = 0; a < 3; a++) { this.brush.min[a] = p[a] + HULL_MIN[a]; this.brush.max[a] = p[a] + HULL_MAX[a]; } this.brush.max[1] = p[1] + TROP.height - 22; }
  hurt(n, acid) {
    if (!this.alive) return;
    this.health -= n; this.flashT = 0.12; if (acid) this.acidT = 3;
    if (this.health <= 0) { this.die(); return; }
    if (this.painCd <= 0 && n >= 8) { this.painCd = 0.9; this.game.sfx.play('tropPain'); }
  }
  die() {
    const g = this.game; this.alive = false; this.state = 'dead'; this.deadT = 0; g.world.removeBrush(this.brush);
    g.sfx.play('tropDeath'); g.kills++; this.run.timeScale = 0; this.blowK = 0;
    const p = this.pm.pos, fy = p[1] - 24;
    g.dropPickup('health', [p[0], fy, p[2]], 15); g.dropPickup('juice', [p[0] + 12, fy, p[2] - 8], 30);
    if (g.arsenal) g.arsenal.enemyDrop([p[0] - 10, fy, p[2] + 10]);
  }
  // ---------------- path finding: straight at CornPop when the way is clear, otherwise along his breadcrumb trail
  groundAt(x, z, y) { const W = this.game.world, tr = W.trace([x, y + 20, z], [x, y - 90, z], [-6, -1, -6], [6, 1, 6], this.brush, true); return tr.fraction < 1 ? tr.end[1] : null; }
  walkable(a, b) { // no gap wider than a jump between a and b (feet heights) and nothing big in the way
    const W = this.game.world, n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[2] - a[2]) / 48)); let gap = 0;
    for (let i = 1; i < n; i++) { const t = i / n, x = a[0] + (b[0] - a[0]) * t, z = a[2] + (b[2] - a[2]) * t, y = Math.max(a[1], b[1]) - 24;
      if (this.groundAt(x, z, y) === null) { if (++gap > 2) return false; } else gap = 0; }
    const tr = W.trace([a[0], a[1] + 20, a[2]], [b[0], b[1] + 20, b[2]], [-10, -4, -10], [10, 8, 10], this.brush, true);
    return tr.fraction > 0.98;
  }
  pickTarget() {
    const g = this.game, pl = g.player, T = g.trail, me = this.pm.pos;
    this.sees = !g.playerDead && this.canSee(pl.eye());
    this.direct = this.sees && Math.abs(pl.pos[1] - me[1]) < 60 && this.walkable(me, pl.pos);
    if (this.direct) { this.trailIdx = T.length - 1; return; }
    if (this.trailIdx < 0 || this.trailIdx >= T.length) this.trailIdx = Math.max(0, T.length - 40);
    // skip ahead to the newest crumb he can walk straight to
    for (let i = T.length - 1, k = 0; i > this.trailIdx && k < 24; i--, k++) {
      const q = T[i]; if (Math.abs(q[1] - me[1]) > 40 || Math.hypot(q[0] - me[0], q[2] - me[2]) > 700) continue;
      if (this.canSee([q[0], q[1] + 20, q[2]]) && this.walkable(me, q)) { this.trailIdx = i; break; }
    }
  }
  target() {
    const g = this.game, T = g.trail, me = this.pm.pos;
    if (this.direct || this.trailIdx >= T.length || this.trailIdx < 0) return g.player.pos;
    let q = T[this.trailIdx];
    // crumbs far apart = CornPop took a teleporter: walk into the teleporter that lands there
    const prev = T[this.trailIdx - 1];
    if (prev && Math.hypot(q[0] - prev[0], q[2] - prev[2]) > 260) {
      const tp = g.ents.find(e => e.type === 'teleport' && e.dest && Math.hypot(e.dest[0] - q[0], e.dest[2] - q[2]) < 120);
      if (tp) q = [(tp.min[0] + tp.max[0]) / 2, tp.min[1] + 24, (tp.min[2] + tp.max[2]) / 2];
    }
    if (Math.hypot(q[0] - me[0], q[2] - me[2]) < 26 && Math.abs(q[1] - me[1]) < 34) { this.trailIdx++; return this.target(); }
    return q;
  }
  warpNear() { // lost him for too long: pop out of thin air a little way back down CornPop's trail, out of sight
    const g = this.game, T = g.trail, pl = g.player;
    for (let back = 6; back < 30; back++) {
      const q = T[T.length - 1 - back]; if (!q) break; const p = [q[0], q[1] + 0.1, q[2]];
      if (Math.hypot(p[0] - pl.pos[0], p[2] - pl.pos[2]) < 300) continue;
      if (g.world.testPosition(p, HULL_MIN, HULL_MAX, this.brush)) continue;
      if (g.world.rayFrac(pl.eye(), [p[0], p[1] + 20, p[2]]) > 0.98) continue;
      g.teleportFx(this.pm.pos); this.pm.pos = p; this.pm.vel = [0, 0, 0]; g.teleportFx(p); g.sfx.play('teleport', 0.6);
      this.trailIdx = T.length - 1 - back; this.bestDist = 1e9; this.progressT = 0; this.stats.warps++; return true;
    }
    return false;
  }
  // ---------------- pork chops
  blow() {
    const g = this.game, pl = g.player; this.M_updateMouth();
    const from = [this.mouth.x, this.mouth.y, this.mouth.z]; const dir = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    from[0] += dir.x * 40; from[2] += dir.z * 40; // out of the bell
    if (g.world.rayFrac(this.eye(), from) < 0.98) { from[0] = this.eye()[0]; from[1] = this.eye()[1]; from[2] = this.eye()[2]; }
    const sp = TROP.chopSpeed, tgt = [pl.pos[0], pl.pos[1] + 4, pl.pos[2]];
    const d0 = Math.hypot(tgt[0] - from[0], tgt[2] - from[2]); const lead = Math.random() < 0.7 ? d0 / sp * 0.8 : 0;
    tgt[0] += pl.vel[0] * lead; tgt[2] += pl.vel[2] * lead;
    const dx = tgt[0] - from[0], dz = tgt[2] - from[2], dh = Math.hypot(dx, dz) || 1, t = dh / sp;
    const vy = (tgt[1] - from[1]) / t + 0.5 * TROP.chopGravity * t; // lob that lands on target
    const mesh = makeChop(g); mesh.position.set(...from); g.scene.add(mesh);
    this.chops.push({ p: from, v: [dx / dh * sp, Math.min(500, vy), dz / dh * sp], mesh, t: 0, spin: 6 + Math.random() * 6, landed: false });
    g.sfx.play('tropToot', this.vol(1)); this.stats.chops++;
    for (let i = 0; i < 8; i++) g.particles.spawn(from, [dx / dh * 120 + (Math.random() - 0.5) * 80, 40 + Math.random() * 60, dz / dh * 120 + (Math.random() - 0.5) * 80], Math.random() < 0.5 ? [1, 0.85, 0.3] : [1, 1, 0.8], 0.4, 100, 2.5);
  }
  updateChops(dt) {
    const g = this.game, pl = g.player, keep = [], L = g.pointLight(pl.pos), k = Math.min(1.5, L[0] * 0.9 + 0.2), S = shared(g);
    S.chopMat.emissive.setRGB(k, k * 0.97, k * 0.95); S.boneMat.emissive.copy(S.boneMat.userData.base).multiplyScalar(k);
    for (const c of this.chops) {
      c.t += dt;
      if (c.landed) { // a dropped pork chop: CornPop can eat it
        if (!g.playerDead && Math.hypot(pl.pos[0] - c.p[0], pl.pos[2] - c.p[2]) < 28 && Math.abs(pl.pos[1] - 24 - c.p[1]) < 40 && g.health < 100) {
          g.health = Math.min(100, g.health + TROP.eatChop); g.hud.print(`You ate a pork chop! +${TROP.eatChop} health`); g.sfx.play('health'); g.scene.remove(c.mesh); continue; }
        if (c.t > 8) { c.mesh.scale.multiplyScalar(Math.max(0, 1 - dt * 3)); if (c.t > 9) { g.scene.remove(c.mesh); continue; } }
        keep.push(c); continue;
      }
      c.v[1] -= TROP.chopGravity * dt; const p1 = [c.p[0] + c.v[0] * dt, c.p[1] + c.v[1] * dt, c.p[2] + c.v[2] * dt];
      if (!g.playerDead && segAabb(c.p, p1, [pl.pos[0] - 20, pl.pos[1] - 28, pl.pos[2] - 20], [pl.pos[0] + 20, pl.pos[1] + 36, pl.pos[2] + 20]) >= 0) {
        g.damagePlayer(TROP.chopDamage); g.sfx.play('chopHit'); g.meatBurst(c.p, 10); g.flash = { rgb: [0.8, 0.45, 0.35], a: 0.35 };
        const l = Math.hypot(c.v[0], c.v[2]) || 1; pl.vel[0] += c.v[0] / l * 140; pl.vel[2] += c.v[2] / l * 140; g.scene.remove(c.mesh); continue;
      }
      const tr = g.world.trace(c.p, p1, [-3, -3, -3], [3, 3, 3], this.brush, true);
      if (tr.fraction < 1) {
        g.sfx.play('chopHit', this.vol(0.5, tr.end)); g.meatBurst(tr.end, 5);
        if (tr.normal && tr.normal[1] > 0.7) { c.landed = true; c.t = 0; c.p = tr.end; c.mesh.position.set(c.p[0], c.p[1] - 1, c.p[2]); c.mesh.rotation.set(-Math.PI / 2, 0, Math.random() * 6); keep.push(c); continue; }
        // bounce off walls and drop
        const n = tr.normal || [0, 1, 0], dv = c.v[0] * n[0] + c.v[1] * n[1] + c.v[2] * n[2]; c.v = [(c.v[0] - 2 * dv * n[0]) * 0.35, (c.v[1] - 2 * dv * n[1]) * 0.35, (c.v[2] - 2 * dv * n[2]) * 0.35]; c.p = tr.end; keep.push(c); continue;
      }
      if (c.t > 6) { g.scene.remove(c.mesh); continue; }
      c.p = p1; c.mesh.position.set(...p1); c.mesh.rotation.x += c.spin * dt; c.mesh.rotation.y += c.spin * 0.6 * dt; keep.push(c);
    }
    this.chops = keep;
  }
  vol(base, at) { const pl = this.game.player.pos, p = at || this.pm.pos, d = Math.hypot(pl[0] - p[0], pl[2] - p[2]); return base * Math.max(0.2, Math.min(1, 700 / Math.max(1, d))); }
  M_updateMouth() { if (this.mouthIdx >= 0) { this.mesh.getVertexPosition(this.mouthIdx, this.mouth); this.mouth.applyMatrix4(this.mesh.matrixWorld); } else this.mouth.set(...this.eye()); }
  // ---------------- per frame
  update(dt) {
    const g = this.game, pl = g.player, pm = this.pm, M = this.model;
    this.updateChops(dt);
    if (this.gone) return;
    if (!this.alive) { // topples over backwards, lies there, then sinks away
      this.deadT += dt; const k = Math.min(1, this.deadT / 0.6);
      M.root.rotation.set(-k * k * 1.5, this.yaw + Math.PI, 0, 'YXZ'); M.root.position.set(pm.pos[0], pm.pos[1] - 24 + Math.sin(k * Math.PI) * 10 - Math.max(0, this.deadT - 5) * 30, pm.pos[2]);
      M.root.updateMatrixWorld(true); this.poseTrumpet(dt, true);
      if (this.deadT > 6) { this.gone = true; g.scene.remove(M.root); g.scene.remove(this.trumpet); }
      return;
    }
    this.stateT += dt; this.flashT -= dt; this.painCd -= dt; this.attackCd -= dt; this.jumpCd -= dt; this.thinkT -= dt;
    if (this.acidT > 0) { this.acidT -= dt; this.hurt(8 * dt); if (!this.alive) return; }
    if (this.pooT > 0) this.pooT -= dt; if (this.sauceT > 0) this.sauceT -= dt;
    if (g.playerDead) { this.run.timeScale = 0.4; this.place(dt); return; }
    // teleporters work for him too
    for (const e of g.ents) if (e.type === 'teleport' && g.overlap(pm.pos, e.min, e.max)) { g.teleportFx(pm.pos); pm.pos = [e.dest[0], e.dest[1] + 24.1, e.dest[2]]; pm.vel = [0, 0, 0]; g.teleportFx(pm.pos); g.sfx.play('teleport', this.vol(0.8)); this.trailIdx++; break; }
    if (pm.pos[1] < -1500) this.warpNear();
    if (this.thinkT <= 0) { this.thinkT = 0.2; this.pickTarget(); }
    const tgt = this.target(), dist = Math.hypot(pl.pos[0] - pm.pos[0], pl.pos[2] - pm.pos[2]);
    // keep track of progress; if he gets nowhere for a while he cheats and pops up behind CornPop
    if (dist < this.bestDist - 60) { this.bestDist = dist; this.progressT = 0; } else this.progressT += dt;
    if (this.sees) { this.progressT = 0; this.bestDist = Math.min(this.bestDist, dist); }
    if (this.progressT > TROP.warpAfter && dist > 400) { if (!this.warpNear()) this.progressT = 0; }
    // trumpet attack
    if (this.state === 'chase' && this.sees && this.attackCd <= 0 && dist < TROP.attackRange && dist > TROP.minRange && pm.onground) { this.state = 'blow'; this.stateT = 0; this.blew = false; }
    if (this.state === 'blow') {
      if (!this.blew && this.stateT >= TROP.blowAt) { this.blew = true; this.blow(); if (Math.random() < 0.3 && dist < 700) { this.stateT = TROP.blowAt - 0.22; this.blew = false; this.attackCd = -1; } }
      if (this.stateT >= TROP.lower) { this.state = 'chase'; this.attackCd = TROP.attackCd[0] + Math.random() * (TROP.attackCd[1] - TROP.attackCd[0]); }
    }
    const blowing = this.state === 'blow';
    this.blowK += ((blowing && this.stateT < TROP.lower - 0.15 ? 1 : 0) - this.blowK) * Math.min(1, dt * (blowing ? 9 : 6));
    // steering: face where he's going (or CornPop while playing), and run like the player does
    const face = blowing || (this.sees && dist < 260) ? pl.pos : tgt;
    const want = Math.atan2(-(face[0] - pm.pos[0]), -(face[2] - pm.pos[2])); let dy = want - this.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
    this.yaw += Math.max(-9 * dt, Math.min(9 * dt, dy));
    const mx = tgt[0] - pm.pos[0], mz = tgt[2] - pm.pos[2], ml = Math.hypot(mx, mz);
    let fwd = 0, side = 0, jump = false;
    const close = this.direct && dist < 120; // right next to CornPop: circle him instead of pushing into him
    if (ml > 8) {
      const ux = mx / ml, uz = mz / ml; pm.yaw = Math.atan2(-ux, -uz); fwd = 1; // pm.yaw is the movement direction, the model turns separately
      if (close) { fwd = 0.2; side = this.strafe || (this.strafe = Math.random() < 0.5 ? -1 : 1); }
      if (blowing) { fwd *= 0.25; side *= 0.25; }
      // jump: up onto something, across a gap, or over whatever is blocking him
      if (pm.onground && this.jumpCd <= 0) {
        const up = tgt[1] - pm.pos[1];
        const ahead = this.groundAt(pm.pos[0] + ux * TROP.jumpLook, pm.pos[2] + uz * TROP.jumpLook, pm.pos[1] - 24);
        const sp = Math.hypot(pm.vel[0], pm.vel[2]);
        if (up > 20 && ml < 130) jump = true;
        else if (ahead === null && up > -60 && ml > 50 && sp > 150) jump = true;             // edge of a gap he needs to cross
        if (sp < 40 && !blowing && !close && ml > 60) { this.stuckT += dt; if (this.stuckT > TROP.stuckJump) { jump = true; this.stuckT = 0; } } else this.stuckT = 0;
        if (jump) { this.stats.jumps++; this.jumpCd = 0.45; g.sfx.play('tropJump', this.vol(0.6)); }
      }
    } else if (this.direct) { side = this.strafe || 1; }
    const slow = this.pooT > 0 ? 0.55 : this.sauceT > 0 ? 0.7 : 1; pm.maxspeed = TROP.speed * slow;
    const pb = g.playerBrush; if (pb) pb.solid = true;
    let left = dt; const cmd = { forward: fwd, side, jump, walk: false, crouch: false };
    while (left > 0) { const s = Math.min(left, 1 / 60); pm.update(s, cmd); cmd.jump = false; left -= s; }
    if (pb) pb.solid = false;
    pm.events.length = 0;
    this.syncBrush();
    // animation: run cycle scaled to his speed, a frozen mid-stride in the air, standing still while he plays
    const hs = Math.hypot(pm.vel[0], pm.vel[2]);
    this.run.timeScale = !pm.onground ? 0 : hs > 30 ? Math.max(0.5, hs / 300) * 1.1 : 0;
    if (!pm.onground && this.run.time > 0.1) this.run.time = 0.16;
    if (hs < 30 && pm.onground) this.run.time += (0.31 - this.run.time) * Math.min(1, dt * 8); // settle into the "feet together" frame
    this.place(dt);
  }
  place(dt) {
    const M = this.model, pm = this.pm; M.update(dt);
    M.root.position.set(pm.pos[0], pm.pos[1] - 24, pm.pos[2]); M.root.rotation.set(0, this.yaw + Math.PI, 0);
    M.root.updateMatrixWorld(true); this.poseTrumpet(dt, false);
    // lighting
    const g = this.game, L = g.pointLight(pm.pos); let r = L[0] * 0.6, gg = L[1] * 0.6, b = L[2] * 0.6;
    if (this.acidT > 0) { const k = 0.3 + 0.2 * Math.sin(g.time * 18); r += k * 0.8; gg += k; b *= 0.6; }
    if (this.pooT > 0) { r = r * 0.55 + 0.18; gg = gg * 0.38 + 0.08; b *= 0.2; }
    if (this.sauceT > 0) { const k = 0.45 + 0.2 * Math.sin(g.time * 12); r = r * 0.6 + k; gg *= 0.35; b *= 0.3; }
    if (this.flashT > 0) { r += 0.7; gg += 0.5; b += 0.2; }
    for (const m of M.mats) m.emissive.setRGB(r, gg, b);
    const k = Math.min(1.6, L[0] * 0.85 + 0.25); this.trumpet.material.color.copy(this.trumpet.material.userData.base).multiplyScalar(k);
  }
  // arms: IK the hands onto the trumpet at his lips while he plays; otherwise the trumpet swings in his right hand
  poseTrumpet(dt, dead) {
    const B = this.bones, M = this.model, w = this.blowK;
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)), right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    this.M_updateMouth(); const mouth = this.mouth.clone();
    const pl = this.game.player.pos; const aim = new THREE.Vector3(pl[0] - mouth.x, pl[1] + 6 - mouth.y, pl[2] - mouth.z);
    const hd = Math.hypot(aim.x, aim.z) || 1; let pitch = Math.atan2(aim.y, hd); pitch = Math.max(-0.5, Math.min(0.5, pitch));
    const playDir = fwd.clone().multiplyScalar(Math.cos(pitch)); playDir.y = Math.sin(pitch); playDir.normalize();
    if (w > 0.02 && B.ru && B.lu) {
      const sc = TROP.height / TROP.modelH; // metres -> units
      const rTarget = mouth.clone().addScaledVector(playDir, 4).addScaledVector(right, 2.5).add(new THREE.Vector3(0, -2.5, 0));
      const lTarget = mouth.clone().addScaledVector(playDir, 11).add(new THREE.Vector3(0, -3.5, 0)).addScaledVector(right, -0.5);
      const down = new THREE.Vector3(0, -1, 0);
      solveArm(B.ru, B.rl, B.rh, rTarget, wpos(B.ru, new THREE.Vector3()).addScaledVector(right, 0.6 * sc).addScaledVector(down, 0.6 * sc).addScaledVector(fwd, -0.2 * sc), w);
      solveArm(B.lu, B.ll, B.lh, lTarget, wpos(B.lu, new THREE.Vector3()).addScaledVector(right, -0.6 * sc).addScaledVector(down, 0.6 * sc).addScaledVector(fwd, -0.2 * sc), w);
    }
    // trumpet transform: in the hand (pointing forward and down) blended into "at the lips, aimed at CornPop"
    const hand = wpos(B.rh, new THREE.Vector3()); const carryDir = fwd.clone().multiplyScalar(0.55).add(new THREE.Vector3(0, -0.83, 0)).normalize();
    const carryPos = hand.clone().addScaledVector(carryDir, -15).addScaledVector(fwd, 1); // held by the valves
    const playPos = mouth.clone().addScaledVector(playDir, 0.5);
    const pos = carryPos.lerp(playPos, w), dir = carryDir.lerp(playDir, w).normalize();
    this.trumpet.position.copy(pos); this.trumpet.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    this.trumpet.visible = !dead || this.deadT < 5;
  }
}

// ------------------------------------------------------------------ when Trop shows up
// Sparingly: none on the first two maps, one per map after that, two on the last four maps of Episode 2. He is sent in only
// when CornPop is cruising: healthy, not hurt for a while, a good share of the map cleared, and nothing big going on.
export class TropDirector {
  constructor(game) {
    this.game = game; const { ep, mi } = game;
    this.budget = !game.tropAsset ? 0 : ep === 0 ? (mi < 2 ? 0 : 1) : (mi < 4 ? 1 : 2);
    this.sent = 0; this.checkT = 5; this.lastSent = -1e9;
  }
  get alive() { return this.game.enemies.some(e => e.kind === 'trop' && e.alive); }
  cruising() {
    const g = this.game; const share = g.killsTotal ? g.kills / g.killsTotal : 1;
    const unhurt = g.time - (g.lastHurtT ?? -1e9);
    return g.health >= 70 && unhurt > 25 && share >= 0.25 && g.time > (g.ep ? 60 : 75);
  }
  update(dt) {
    const g = this.game; this.checkT -= dt; if (this.checkT > 0) return; this.checkT = 2;
    if (this.sent >= this.budget || g.playerDead || this.alive || g.time - this.lastSent < 120) return;
    if (g.director && g.director.active) return; // nothing new while BCM is around
    if (!this.cruising()) return;
    if (this.spawn()) { this.sent++; this.lastSent = g.time; }
  }
  spawn() {
    const g = this.game, T = g.trail, pl = g.player;
    for (let back = 8; back < Math.min(T.length, 40); back++) {
      const q = T[T.length - 1 - back], p = [q[0], q[1] + 0.1, q[2]];
      if (Math.hypot(p[0] - pl.pos[0], p[2] - pl.pos[2]) < 350) continue;
      if (g.world.testPosition(p, HULL_MIN, HULL_MAX)) continue;
      if (g.world.rayFrac(pl.eye(), [p[0], p[1] + 20, p[2]]) > 0.98) continue; // out of sight
      const yaw = Math.atan2(-(pl.pos[0] - p[0]), -(pl.pos[2] - p[2]));
      const t = new Trop(g, p, yaw); t.trailIdx = T.length - 1 - back; g.enemies.push(t); g.killsTotal++;
      g.teleportFx(p); g.sfx.play('tropSight'); g.hud.centerPrint('TROP IS ON YOUR TRAIL!', 2.5);
      return t;
    }
    return null;
  }
}
