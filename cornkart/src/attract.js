// Title-screen race: every kart on autopilot, filmed like an action replay. The
// director cuts between chase, trackside, head-on, helicopter, wheel-level and
// fly-over shots, picking a different kart each time.
import * as THREE from 'three';
import { AIController } from './ai.js';

const SHOTS = ['chase', 'trackside', 'front', 'heli', 'wheel', 'flyover', 'trackside', 'chase'];

export class Director {
  constructor(track, race) {
    this.track = track;
    this.race = race;
    race.laps = 99; // never finishes
    race.state = 'racing';
    race.autopilot = new AIController(race.player, track, { skill: 0.97, seed: 5 });
    // let the pack spread out before anyone sees it
    const idle = { steer: 0, gas: 0, brake: 0, drift: false, driftPressed: false, look: false };
    for (let i = 0; i < 60 * 6; i++) race.update(1 / 60, idle);
    this.idle = idle;
    this.pos = new THREE.Vector3();
    this.look = new THREE.Vector3();
    this.timer = 0;
    this.n = Math.floor(Math.random() * SHOTS.length);
    this._cut();
  }

  _cut() {
    const ks = this.race.karts;
    let k = ks[Math.floor(Math.random() * ks.length)];
    // prefer a kart with company, so most shots show more than one racer
    for (let tries = 0; tries < 4; tries++) {
      const c = ks[Math.floor(Math.random() * ks.length)];
      if (ks.some((o) => o !== c && o.pos.distanceTo(c.pos) < 25)) { k = c; break; }
    }
    this.kart = k;
    this.n = (this.n + 1 + Math.floor(Math.random() * 2)) % SHOTS.length;
    this.shot = k.q.tunnel ? 'chase' : SHOTS[this.n];
    this.timer = 0;
    this.length = 3.4 + Math.random() * 1.8;
    this.side = Math.random() < 0.5 ? -1 : 1;
    const T = this.track, L = T.length;
    const s = ((k.total % L) + L) % L;
    if (this.shot === 'trackside') { // a fixed camera by the road, ahead of the kart
      const p = T.pose(s + 38, this.side * (T.roadHalf + 3.5));
      this.fixed = new THREE.Vector3(p.x, Math.max(p.y, T.terrainAt(p.x, p.z)) + 1.6, p.z);
    }
    if (this.shot === 'flyover') this.flyS = s + 20;
    this.snap = true;
  }

  update(dt, camera) {
    this.race.update(dt, this.idle);
    this.race.messages.length = 0;
    this.timer += dt;
    const k = this.kart;
    if (this.timer > this.length || (k.q.tunnel && this.shot !== 'chase' && this.shot !== 'front')) this._cut();
    const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), rx = -fz, rz = fx;
    const P = k.pos, T = this.track;
    const want = new THREE.Vector3(), look = new THREE.Vector3();
    let fov = 60;
    switch (this.shot) {
      case 'chase':
        want.set(P.x - fx * 6.5, P.y + 2.3, P.z - fz * 6.5);
        look.set(P.x + fx * 4, P.y + 1, P.z + fz * 4);
        break;
      case 'front':
        want.set(P.x + fx * 7 + rx * this.side * 1.5, P.y + 1.1, P.z + fz * 7 + rz * this.side * 1.5);
        look.set(P.x, P.y + 0.8, P.z);
        fov = 50;
        break;
      case 'trackside':
        want.copy(this.fixed);
        look.set(P.x, P.y + 0.7, P.z);
        fov = 38; // long lens
        break;
      case 'heli': {
        const a = this.timer * 0.35 + this.side;
        want.set(P.x + Math.sin(a) * 20, P.y + 11, P.z + Math.cos(a) * 20);
        look.set(P.x + fx * 5, P.y, P.z + fz * 5);
        fov = 55;
        break;
      }
      case 'wheel':
        want.set(P.x + rx * this.side * 3.2 - fx * 1.2, P.y + 0.45, P.z + rz * this.side * 3.2 - fz * 1.2);
        look.set(P.x + fx * 3, P.y + 0.6, P.z + fz * 3);
        fov = 70;
        break;
      case 'flyover': { // sweep along the road, showing the place more than the racers
        const s = this.flyS + this.timer * 22;
        const p = T.pose(s, this.side * 32), q = T.pose(s + 45, 0);
        want.set(p.x, Math.max(p.y, T.terrainAt(p.x, p.z)) + 22, p.z);
        look.set(q.x, q.y, q.z);
        fov = 62;
        break;
      }
    }
    if (this.shot !== 'trackside' && this.shot !== 'flyover' && !k.q.tunnel) {
      want.y = Math.max(want.y, T.terrainAt(want.x, want.z) + 0.6);
    }
    if (this.snap) { this.pos.copy(want); this.look.copy(look); this.snap = false; }
    else {
      this.pos.lerp(want, 1 - Math.exp(-dt * (this.shot === 'trackside' ? 50 : 8)));
      this.look.lerp(look, 1 - Math.exp(-dt * 12));
    }
    camera.position.copy(this.pos);
    camera.lookAt(this.look);
    // the logo fills the middle of the screen, so frame the racers off to one side of it
    const w = innerWidth, h = innerHeight;
    if (this.shot === 'flyover') { if (camera.view?.enabled) camera.clearViewOffset(); }
    else camera.setViewOffset(w, h, this.side * 0.3 * w, 0, w, h);
    camera.fov = fov;
    camera.updateProjectionMatrix();
    return this.shot === 'flyover' ? look : P;
  }
}
