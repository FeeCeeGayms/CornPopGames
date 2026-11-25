// Subway rats (v0.33). Small, fast, weak, and never alone: they live in the dark under New York, scatter about until
// they smell CornPop, then rush him in a zig-zag, leap for a bite and dart back out of reach.
// The model is built here (no file): a furred body with fake top-light baked into its vertex colours, pink ears, feet and a
// segmented tail that whips as it runs, red eyes that glow in the dark. They are vermin, not kills: the map's kill count ignores them.
import * as THREE from 'three';
import { MonsterMove } from './monster_move.js';

export const RAT = { health: 12, speed: 265, sight: 620, hear: 260, bite: 3, biteCd: 1.1, biteRange: 46, height: 42, hw: 13, vermin: true };
let RID = 0, GEO = null;

function shade(geo, top, bottom) { // vertex colours: lighter where the surface faces up, so the unlit body still reads as round
  geo.computeVertexNormals(); const n = geo.attributes.normal, c = new Float32Array(n.count * 3);
  for (let i = 0; i < n.count; i++) { const k = 0.5 + 0.5 * n.getY(i), f = 0.55 + 0.45 * k + 0.1 * n.getZ(i); c[i * 3] = (bottom[0] + (top[0] - bottom[0]) * k) * f; c[i * 3 + 1] = (bottom[1] + (top[1] - bottom[1]) * k) * f; c[i * 3 + 2] = (bottom[2] + (top[2] - bottom[2]) * k) * f; }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); return geo;
}
function geos() {
  if (GEO) return GEO;
  const fur = [0.34, 0.29, 0.25], belly = [0.17, 0.14, 0.13], pink = [0.9, 0.55, 0.55], pinkD = [0.5, 0.26, 0.28];
  // body: a lathe along Z (snout forward = -Z): haunches, shoulders, neck, pointed snout
  const prof = [[0.01, 0], [3.6, 1.2], [5.6, 4], [6.2, 8], [5.6, 12.5], [4.4, 16], [3.9, 18.5], [3.3, 21], [1.9, 24.5], [0.9, 26.4], [0.01, 27]];
  const body = new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 12); body.rotateX(-Math.PI / 2); body.translate(0, 6.4, 11); body.scale(1, 0.9, 1);
  const ear = new THREE.SphereGeometry(2.2, 8, 6); ear.scale(1, 1, 0.3);
  const leg = new THREE.CylinderGeometry(0.9, 0.7, 4.4, 5); leg.translate(0, -2.2, 0);
  const foot = new THREE.SphereGeometry(1.2, 6, 4); foot.scale(0.8, 0.45, 1.5); foot.translate(0, -4.2, -0.8);
  const tail = new THREE.CylinderGeometry(0.75, 0.5, 6.2, 5); tail.rotateX(Math.PI / 2); tail.translate(0, 0, 3.1);
  const eye = new THREE.SphereGeometry(0.75, 6, 4), nose = new THREE.SphereGeometry(0.8, 6, 4), tooth = new THREE.BoxGeometry(0.9, 1.3, 0.4);
  const wh = new THREE.BufferGeometry(); wh.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 5, 0.8, -1.5, 0, 0, 0, 5, -0.6, -0.5, 0, 0, 0, -5, 0.8, -1.5, 0, 0, 0, -5, -0.6, -0.5], 3));
  return GEO = { body: shade(body, fur, belly), ear: shade(ear, pink, pinkD), leg: shade(leg, fur, belly), foot: shade(foot, pink, pinkD), tail: shade(tail, pink, pinkD), eye, nose, tooth, wh };
}

export class Rat {
  constructor(game, def) {
    this.game = game; this.id = 'r' + RID++; this.kind = 'rat'; this.K = RAT; this.vermin = true;
    this.phys = new MonsterMove(game.world); this.phys.maxspeed = RAT.speed; this.phys.jumpVel = 230;
    this.phys.spawn([def.pos[0], def.pos[1] + 24.1, def.pos[2]], def.angle || Math.random() * 360);
    this.brush = { min: [0, 0, 0], max: [0, 0, 0], solid: false, shadow: false, enemy: this }; this.phys.ignore = this.brush;   // (never added to the world: nobody trips over a rat)
    this.health = RAT.health; this.alive = true; this.awake = false; this.dormant = false; this.turret = false; this.state = 'idle'; this.stateT = 0;
    this.flashT = 0; this.acidT = 0; this.pooT = 0; this.sauceT = 0; this.foe = null;
    this.biteCd = Math.random(); this.thinkT = Math.random() * 0.4; this.wander = [0, 1 + Math.random() * 3]; this.zig = Math.random() * 6; this.sees = false; this.fleeT = 0; this.squeakT = 2 + Math.random() * 6; this.runPh = Math.random() * 6; this.deadT = 0; this.size = 0.62 + Math.random() * 0.3; this.home = def.pos.slice();
    const G = geos(), root = new THREE.Group(), s = this.size;
    this.fur = new THREE.MeshBasicMaterial({ vertexColors: true, fog: true }); this.eyeM = new THREE.MeshBasicMaterial({ color: 0xff2a10, fog: false });
    const add = (g, m, x, y, z, p = root) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); p.add(o); return o; };
    const inner = this.inner = new THREE.Group(); root.add(inner); inner.scale.setScalar(s);
    add(G.body, this.fur, 0, 0, 0, inner);
    for (const sx of [-1, 1]) { const e = add(G.ear, this.fur, sx * 2.6, 9.6, -6.4, inner); e.rotation.set(-0.3, sx * 0.5, sx * 0.25); add(G.eye, this.eyeM, sx * 1.7, 7.4, -11.2, inner); }
    add(G.nose, this.fur, 0, 5.9, -15.9, inner).scale.setScalar(0.9); for (const sx of [-0.5, 0.5]) add(G.tooth, new THREE.MeshBasicMaterial({ color: 0xe8e0b8 }), sx, 4.4, -14.6, inner);
    inner.add(new THREE.LineSegments(G.wh, new THREE.LineBasicMaterial({ color: 0x8a8478 }))).position.set(0, 5.6, -14.6);
    this.legs = []; for (const [x, z, ph] of [[-3.4, -5, 0], [3.4, -5, Math.PI], [-3.8, 6.5, Math.PI], [3.8, 6.5, 0]]) { const l = new THREE.Group(); l.position.set(x, 4.6, z); inner.add(l); add(G.leg, this.fur, 0, 0, 0, l); add(G.foot, this.fur, 0, 0, 0, l); this.legs.push([l, ph]); }
    this.tail = []; let par = inner, tz = 10.4; for (let i = 0; i < 5; i++) { const t = new THREE.Group(); t.position.set(0, i ? 0 : 5.2, i ? 6 : tz); par.add(t); const m = add(G.tail, this.fur, 0, 0, 0, t); m.scale.set(1 - i * 0.15, 1 - i * 0.15, 1.04); this.tail.push(t); par = t; }
    this.model = { root, playEmote() { }, setState() { }, actions: {} };
    game.scene.add(root); this.place(0);
  }
  get pos() { return this.phys.pos; }
  eye() { return [this.pos[0], this.pos[1] - 14, this.pos[2]]; }
  canSee(p) { return this.game.world.trace(this.eye(), p, [-1, -1, -1], [1, 1, 1], null, true).fraction >= 0.999; }
  wake(sound = true) { if (this.awake || !this.alive) return; this.awake = true; this.state = 'chase'; if (sound) this.squeak(); }
  syncBrush() { }
  squeak(k = 1) { const g = this.game, d = Math.hypot(this.pos[0] - g.player.pos[0], this.pos[2] - g.player.pos[2]); if (d < 700) g.sfx.play('ratSqueak', Math.max(0.2, 1 - d / 700) * k); }
  hurt(n, acid, attacker) {
    if (!this.alive) return; this.health -= n; this.flashT = 0.1; if (acid) this.acidT = 2; this.wake(false);
    if (this.health <= 0) this.die();
  }
  die() {
    const g = this.game, p = this.pos; this.alive = false; this.state = 'dead'; this.deadT = 0; g.sfx.play('ratDie', Math.max(0.3, 1 - Math.hypot(p[0] - g.player.pos[0], p[2] - g.player.pos[2]) / 800));
    for (let i = 0; i < 9; i++) g.particles.spawn([p[0], p[1] - 16, p[2]], [(Math.random() - 0.5) * 160, 60 + Math.random() * 140, (Math.random() - 0.5) * 160], Math.random() < 0.6 ? [0.5, 0.04, 0.03] : [0.3, 0.26, 0.22], 0.5 + Math.random() * 0.5, 600);
    if (Math.random() < 0.18) g.dropPickup('health', [p[0], p[1] - 24, p[2]], 2);
  }
  update(dt) {
    const g = this.game, pl = g.player, p = this.pos; this.stateT += dt; this.flashT -= dt;
    if (!this.alive) { this.deadT += dt; if (this.deadT < 0.5) { this.phys.update(dt, { forward: 0, side: 0, jump: false }); } this.place(dt); return; }
    const dx = pl.pos[0] - p[0], dz = pl.pos[2] - p[2], dy = pl.pos[1] - p[1], dist = Math.hypot(dx, dz);
    if (dist > 1700 && !this.awake) { this.model.root.visible = false; return; } this.model.root.visible = true;
    if (this.acidT > 0) { this.acidT -= dt; this.health -= 6 * dt; if (this.health <= 0) { this.die(); return; } }
    this.thinkT -= dt; if (this.thinkT <= 0) { this.thinkT = 0.25 + Math.random() * 0.15; this.sees = !g.playerDead && dist < RAT.sight && Math.abs(dy) < 220 && this.canSee([pl.pos[0], pl.pos[1] + 10, pl.pos[2]]);
      if (!this.awake && (this.sees || (dist < RAT.hear && Math.abs(dy) < 90) || (g.noiseT > 0 && dist < 500))) { this.wake(); for (const o of g.enemies) if (o.kind === 'rat' && !o.awake && Math.hypot(o.pos[0] - p[0], o.pos[2] - p[2]) < 360) o.wake(false); } }   // one squeak and the whole pack comes
    const cmd = { forward: 0, side: 0, jump: false }; this.biteCd -= dt; this.fleeT -= dt; this.squeakT -= dt;
    if (!this.awake) { // pottering about near home: short scurries, long sniffs
      this.wander[1] -= dt; if (this.wander[1] <= 0) { const hx = this.home[0] - p[0], hz = this.home[2] - p[2], far = Math.hypot(hx, hz) > 150; this.wander = [Math.random() < 0.55 ? 1 : 0, 0.5 + Math.random() * 1.8]; if (this.wander[0]) this.phys.yaw = far ? Math.atan2(-hx, -hz) + (Math.random() - 0.5) : Math.random() * 6.283; }
      cmd.forward = this.wander[0] * 0.45; if (this.squeakT <= 0) { this.squeakT = 5 + Math.random() * 9; this.squeak(0.5); }
    } else if (g.playerDead) { cmd.forward = 0; }
    else {
      const want = Math.atan2(-dx, -dz); this.zig += dt * 7;
      if (this.fleeT > 0) { this.phys.yaw = want + Math.PI + Math.sin(this.zig) * 0.6; cmd.forward = 1; }                                   // dart away after a bite
      else { this.phys.yaw = want + Math.sin(this.zig) * (dist > 90 ? 0.55 : 0.12); cmd.forward = 1;
        if (this.phys.onground && ((dist < 120 && dist > 50 && dy > -30 && Math.random() < dt * 3.5) || (this.stuck > 0.35))) { cmd.jump = true; this.stuck = 0; }   // leap at him (or over whatever is in the way)
        if (dist < RAT.biteRange && Math.abs(dy) < 60 && this.biteCd <= 0) { this.biteCd = RAT.biteCd + Math.random() * 0.4; this.fleeT = 0.35 + Math.random() * 0.35; g.damagePlayer(RAT.bite); g.sfx.play('ratBite'); g.flash = { rgb: [0.8, 0.1, 0.05], a: 0.22 }; }
        if (this.squeakT <= 0) { this.squeakT = 1.5 + Math.random() * 3; this.squeak(0.8); } }
      const sp = Math.hypot(this.phys.vel[0], this.phys.vel[2]); this.stuck = sp < 40 ? (this.stuck || 0) + dt : 0;
    }
    this.phys.update(dt, cmd); this.phys.events.length = 0;
    if (p[1] < -3000) { this.alive = false; this.model.root.visible = false; return; }
    this.place(dt);
  }
  place(dt) {
    const g = this.game, p = this.pos, R = this.model.root, sp = Math.hypot(this.phys.vel[0], this.phys.vel[2]);
    R.position.set(p[0], p[1] - 24, p[2]); R.rotation.y = this.phys.yaw;
    if (!this.alive) { const k = Math.min(1, this.deadT / 0.3); this.inner.rotation.z = k * Math.PI; this.inner.position.y = k * 9 * this.size; this.inner.scale.set(this.size, this.size * (1 - 0.25 * k), this.size); for (const [l] of this.legs) l.rotation.x = 0.9; if (this.deadT > 14) { R.visible = false; } }
    else { this.runPh += dt * (4 + sp * 0.12); const k = Math.min(1, sp / 120);
      for (const [l, ph] of this.legs) l.rotation.x = Math.sin(this.runPh + ph) * 0.9 * k;
      this.inner.position.y = Math.abs(Math.sin(this.runPh)) * 1.3 * k; this.inner.rotation.x = this.phys.onground ? Math.sin(this.runPh * 2) * 0.05 * k : -0.35;
      this.tail.forEach((t, i) => { t.rotation.y = Math.sin(this.runPh * 0.9 - i * 0.8) * (0.16 + 0.22 * k); t.rotation.x = i ? -0.1 : 0.25; }); }
    this.lightT = (this.lightT || 0) - dt; if (this.lightT <= 0) { this.lightT = 0.2 + Math.random() * 0.1; const L = g.pointLight([p[0], p[1] - 14, p[2]]), f = this.flashT > 0 ? 2.2 : 1; this.fur.color.setRGB(Math.min(1.25, 0.2 + L[0]) * f, Math.min(1.25, 0.2 + L[1]) * (this.acidT > 0 ? 1.4 : 1) * f, Math.min(1.25, 0.2 + L[2]) * f); }
  }
}
