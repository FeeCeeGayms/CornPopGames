// The PIZZA CUTTER: CornPop's always-on melee weapon (Doom's fist / chainsaw slot). Every map starts with it in hand.
// A big chrome wheel on a red handle: hold FIRE to keep slicing. Each swing cuts everything in a short arc in front of you,
// and also chops breakable boards and presses shootable buttons.
import * as GUNS from './guns.js';
import * as THREE from 'three';
import { Std, vmKey, squashDepth, segAabb } from './combat.js';

export const CUTTER = { cooldown: 0.42, hitAt: 0.11, range: 84, arc: 0.62, damage: [22, 30], knock: 230, breakDamage: 26 };

export function makePizzaCutter() { return GUNS.makePizzaCutter(); }

// pickup-free: the cutter is always owned. This class follows the same update/render contract as the other view weapons.
export class PizzaCutter {
  constructor(game) {
    this.game = game; this.model = makePizzaCutter();
    this.scene = new THREE.Scene(); vmKey(this.scene); this.cam = new THREE.PerspectiveCamera(60, 1, 0.5, 200);
    this.holder = new THREE.Group(); this.holder.add(this.model); this.scene.add(this.holder);
    this.model.scale.setScalar(0.42); this.model.position.set(5.2, -4.3, -12.5); this.model.rotation.set(0.3, -0.9, -0.3);
    this.cool = 0; this.swingT = 9; this.raise = 1; this.hitDone = true; this.side = 1; this.spin = 0;
  }
  update(dt, firing, camera, player) {
    const g = this.game; this.cool -= dt; this.raise = Math.max(0, this.raise - dt * 5); this.swingT += dt;
    if (firing && this.raise < 0.3 && this.cool <= 0) {
      this.cool = CUTTER.cooldown; this.swingT = 0; this.hitDone = false; this.side = -this.side; this.spin += 9;
      g.sfx.play('cutSwing');
    }
    if (!this.hitDone && this.swingT >= CUTTER.hitAt) { this.hitDone = true; this.strike(camera); }
    // swing pose: a fast diagonal slash that alternates direction, then a lazy return
    const s = this.swingT, k = s < 0.16 ? Math.sin(s / 0.16 * Math.PI * 0.5) : Math.max(0, 1 - (s - 0.16) / 0.24);
    const sd = this.side;
    const bob = player.bob || 0, t = g.time, sp = Math.min(1, player.speed / 320);
    this.holder.position.set(Math.sin(t * 5.2) * 0.6 * sp - sd * k * 5.5, bob * 0.12 - this.raise * 10 + Math.abs(Math.cos(t * 5.2)) * 0.35 * sp - k * 1.5, -k * 4);
    this.holder.rotation.set(-k * 0.55, sd * k * 0.5, (player.roll || 0) * 2 + sd * k * 0.9);
    this.spin *= Math.exp(-dt * 3); this.model.userData.wheel.rotation.x -= this.spin * dt;
    const L = g.pointLight(player.eye());
    const kk = [Math.min(1.15, 0.3 + L[0] * 0.75), Math.min(1.15, 0.3 + L[1] * 0.75), Math.min(1.15, 0.3 + L[2] * 0.75)];
    const u = this.model.userData; u.mats.forEach((m, i) => { const c = new THREE.Color(u.base[i]); m.color.setRGB(c.r * kk[0], c.g * kk[1], c.b * kk[2]); m.envMapIntensity = 0.15 + 0.6 * (kk[0] + kk[1] + kk[2]) / 3; });
  }
  // one cut: everything whose box is within reach and inside the arc gets sliced
  strike(camera) {
    const g = this.game, eye = camera.position, R = CUTTER.range;
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const a = [eye.x, eye.y, eye.z], b = [eye.x + fwd.x * R, eye.y + fwd.y * R, eye.z + fwd.z * R];
    const wall = g.world.trace(a, b, [-1, -1, -1], [1, 1, 1], null, true);
    const reach = wall.fraction * R + 6;
    let hits = 0;
    for (const e of g.enemies) {
      if (!e.alive || e.dormant) continue;
      const w = e.K.hw || 18, lo = [e.pos[0] - w, e.pos[1] - 26, e.pos[2] - w], hi = [e.pos[0] + w, e.pos[1] + e.K.height - 22, e.pos[2] + w];
      // nearest point of the box to the eye
      const q = [Math.max(lo[0], Math.min(eye.x, hi[0])), Math.max(lo[1], Math.min(eye.y, hi[1])), Math.max(lo[2], Math.min(eye.z, hi[2]))];
      const d = [q[0] - eye.x, q[1] - eye.y, q[2] - eye.z], dl = Math.hypot(d[0], d[1], d[2]);
      let ok = dl < 1;
      if (!ok && dl <= Math.min(reach, R)) {
        const hd = Math.hypot(d[0], d[2]) || 1, hf = Math.hypot(fwd.x, fwd.z) || 1;
        const cosH = (d[0] * fwd.x + d[2] * fwd.z) / (hd * hf);
        ok = cosH > Math.cos(CUTTER.arc) || segAabb(a, b, lo, hi) >= 0;
        if (ok && dl > 10) { const s2 = (dl - 8) / dl, q2 = [eye.x + d[0] * s2, eye.y + d[1] * s2, eye.z + d[2] * s2]; if (g.world.trace(a, q2, [-1, -1, -1], [1, 1, 1], null, true).fraction < 1) ok = false; } // not through walls
      }
      if (!ok) continue;
      const dmg = CUTTER.damage[0] + Math.random() * (CUTTER.damage[1] - CUTTER.damage[0]);
      e.hurt(dmg, false); hits++;
      if (e.alive && !e.turret && !e.boss) { const l = Math.hypot(fwd.x, fwd.z) || 1; e.phys.vel[0] += fwd.x / l * CUTTER.knock; e.phys.vel[2] += fwd.z / l * CUTTER.knock; }
      const hp = [q[0], Math.min(hi[1] - 6, Math.max(lo[1] + 10, eye.y - 8)), q[2]];
      g.meatBurst(hp, 7);
    }
    if (hits) { g.sfx.play('cutHit'); g.noiseT = 0.6; g.input.rumble(0.4, 0.6, 90); this.spin += 14; return; }
    // shootable buttons in reach
    for (const bt of g.shootables) { if (bt.pressed) continue; if (segAabb(a, b, [bt.min[0] - 6, bt.min[1] - 6, bt.min[2] - 6], [bt.max[0] + 6, bt.max[1] + 6, bt.max[2] + 6]) >= 0) { g.pressButton(bt); g.sfx.play('cutWall'); return; } }
    if (wall.fraction < 1) {
      const mv = wall.brush && wall.brush.mover;
      if (mv && mv.type === 'breakable') { mv.health -= CUTTER.breakDamage; g.sfx.play('break'); if (mv.health <= 0) g.breakMover(mv); }
      else g.sfx.play('cutWall');
      for (let k = 0; k < 6; k++) g.particles.spawn(wall.end, [(Math.random() - 0.5) * 160, Math.random() * 120, (Math.random() - 0.5) * 160], [1, 0.95, 0.7], 0.2, 0, 2);
    }
  }
  render(renderer, camera) {
    this.cam.fov = camera.fov; this.cam.aspect = camera.aspect; this.cam.updateProjectionMatrix(); squashDepth(this.cam);
    renderer.autoClear = false; renderer.render(this.scene, this.cam); renderer.autoClear = true;
  }
}
