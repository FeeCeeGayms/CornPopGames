// The PIZZA CUTTER: CornPop's always-on melee weapon (Doom's fist / chainsaw slot). Every map starts with it in hand.
// A big chrome wheel on a red handle: hold FIRE to keep slicing. Each swing cuts everything in a short arc in front of you,
// and also chops breakable boards and presses shootable buttons.
import * as THREE from 'three';
import { Std, vmKey, squashDepth, segAabb } from './combat.js';

export const CUTTER = { cooldown: 0.42, hitAt: 0.11, range: 84, arc: 0.62, damage: [22, 30], knock: 230, breakDamage: 26 };

export function makePizzaCutter() {
  const g = new THREE.Group();
  const chrome = Std({ color: 0x9ca2ac, roughness: 0.18, metalness: 0.9 });
  const edge = Std({ color: 0xc8ccd8, roughness: 0.08, metalness: 1 });
  const red = Std({ color: 0xc8201c, roughness: 0.45, metalness: 0.05 });
  const redD = Std({ color: 0x7a0e0c, roughness: 0.5, metalness: 0.05 });
  const sauce = Std({ color: 0xb01808, roughness: 0.3, metalness: 0 });
  const cheese = Std({ color: 0xffc640, roughness: 0.5, metalness: 0 });
  // handle (points back toward the camera), with grip rings and a bolster
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 15, 14), red); handle.rotation.x = Math.PI / 2; handle.position.set(0, 0, 7); g.add(handle);
  for (const z of [3, 6.5, 10]) { const r = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.3, 6, 16), redD); r.position.set(0, 0, z); g.add(r); }
  const cap = new THREE.Mesh(new THREE.SphereGeometry(1.9, 12, 8), redD); cap.position.set(0, 0, 14.5); g.add(cap);
  const bol = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 2.4, 12), chrome); bol.rotation.x = Math.PI / 2; bol.position.set(0, 0, -1.2); g.add(bol);
  // fork: two chrome cheeks reaching forward to the axle
  for (const x of [-1.15, 1.15]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 7.5), chrome); f.position.set(x, 0.9, -5.4); f.rotation.x = -0.25; g.add(f); }
  // the wheel (spins on every swing)
  const wheel = new THREE.Group(); wheel.position.set(0, 2.2, -9.4); g.add(wheel);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.2, 0.45, 40), chrome); disc.rotation.z = Math.PI / 2; wheel.add(disc);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(6.2, 0.18, 4, 48), edge); rim.rotation.y = Math.PI / 2; wheel.add(rim);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 2.9, 14), chrome); hub.rotation.z = Math.PI / 2; wheel.add(hub);
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, h = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.6, 8), redD); h.rotation.z = Math.PI / 2; h.position.set(0, Math.cos(a) * 3.6, Math.sin(a) * 3.6); wheel.add(h); }
  // a smear of sauce and a string of cheese on the blade
  const sm = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.4, 1.4), sauce); sm.position.set(0.05, 5.1, -2); sm.rotation.x = 0.5; wheel.add(sm);
  const ch = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 2.6), cheese); ch.position.set(-0.05, -5.6, 1.6); ch.rotation.x = -0.4; wheel.add(ch);
  g.userData = { wheel, mats: [chrome, edge, red, redD, sauce, cheese], base: [0x9ca2ac, 0xc8ccd8, 0xc8201c, 0x7a0e0c, 0xb01808, 0xffc640], tip: new THREE.Vector3(0, 2.2, -15.6) };
  return g;
}

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
    const kk = [Math.min(1.6, 0.4 + L[0] * 0.8), Math.min(1.6, 0.4 + L[1] * 0.8), Math.min(1.6, 0.4 + L[2] * 0.8)];
    const u = this.model.userData; u.mats.forEach((m, i) => { const c = new THREE.Color(u.base[i]); m.color.setRGB(c.r * kk[0], c.g * kk[1], c.b * kk[2]); });
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
