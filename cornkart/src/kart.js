// Arcade kart physics: grip driving, hop-drift with mini-turbos, boosts,
// ballistic jumps off ramps and hill crests, spin-outs and sludge respawns.
import * as THREE from 'three';

export const GRAVITY = 26;
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export const CC = { 50: 0.8, 100: 0.9, 150: 1.0 };

export class Kart {
  constructor({ character, stats, model, driver, track, cc = 100, isPlayer = false, name }) {
    this.character = character;
    this.name = name || character.name;
    this.model = model;
    this.driver = driver;
    this.track = track;
    this.isPlayer = isPlayer;
    const st = stats || character.stats;
    const k = CC[cc] ?? 0.9;
    this.maxSpeed = 32 * k * (0.94 + 0.02 * st.speed);
    this.accel = 15 * (0.82 + 0.06 * st.accel) * (0.9 + 0.1 * k);
    this.turnRate = 1.75 * (0.85 + 0.05 * st.handling);
    this.weight = st.weight;
    this.speedScale = 1; // AI rubber-banding

    this.pos = new THREE.Vector3();
    this.yaw = 0;
    this.speed = 0;
    this.vy = 0;
    this.grounded = true;
    this.airTime = 0;
    this.steer = 0;
    this.drift = { on: false, dir: 0, charge: 0, level: 0, pending: 0 };
    this.driftVisual = 0;
    this.boostTime = 0;
    this.boostMult = 1;
    this.spinTime = 0;
    this.spinAngle = 0;
    this.sinkTime = 0;
    this.invuln = 0;
    this.surface = 'road';
    this.q = {};
    this.loc = {}; // which road we're on, plus per-road search hints
    this.total = 0; // unwrapped distance along the track
    this.lastS = 0;
    this.finished = false;
    this.finishTime = 0;
    this.pitch = 0; this.roll = 0;
    this.susp = 0; this.suspV = 0;
    this.wheelSpin = 0;
    this.events = []; // fx/audio hooks drained by the game each frame
    this.radius = model.collisionRadius ?? 1.0;
    this._flames = this._makeFlames();
  }

  _makeFlames() {
    const flames = [];
    const mat = new THREE.MeshBasicMaterial({ color: 0x9dff5a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    const inner = new THREE.MeshBasicMaterial({ color: 0xffffcc, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    for (const p of this.model.exhausts) {
      const g = new THREE.Group();
      const outer = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.9, 10, 1, true), mat);
      outer.rotation.x = -Math.PI / 2;
      outer.position.z = -0.45;
      const core = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.5, 8, 1, true), inner);
      core.rotation.x = -Math.PI / 2;
      core.position.z = -0.25;
      g.add(outer, core);
      g.position.copy(p);
      g.visible = false;
      this.model.body.add(g);
      flames.push(g);
    }
    return flames;
  }

  placeAt(s, d) {
    const p = this.track.pose(s, d);
    this.pos.set(p.x, p.y, p.z);
    this.yaw = p.yaw;
    this.speed = 0; this.vy = 0;
    this.loc = { path: this.track.main, hints: { main: p.index } };
    this.track.locate(this.pos.x, this.pos.z, this.pos.y, this.loc, this.q);
    this.lastS = this.q.mainS;
    this.total = this.q.mainS > this.track.length / 2 ? this.q.mainS - this.track.length : this.q.mainS;
    this.drift.on = false; this.drift.charge = 0; this.drift.level = 0;
    this.spinTime = 0; this.sinkTime = 0; this.boostTime = 0;
    this.syncVisual(0);
  }

  boost(duration, mult) {
    this.boostTime = Math.max(this.boostTime, duration);
    this.boostMult = Math.max(this.boostTime > duration ? this.boostMult : 1, mult);
    this.events.push({ type: 'boost' });
  }

  spinOut(duration = 1.0) {
    if (this.invuln > 0 || this.spinTime > 0 || this.hazardImmune > 0 || this.boostTime > 0.3) return false;
    this.spinTime = duration;
    this.hazardImmune = duration + 1.2; // no chain spins while rolling out of a puddle
    this.speed *= 0.35;
    this.drift.on = false; this.drift.charge = 0; this.drift.level = 0;
    this.events.push({ type: 'spin' });
    return true;
  }

  respawn(s) {
    const L = this.track.length;
    const prevTotal = this.total, prevS = this.lastS;
    this.placeAt(s, 0);
    let delta = this.q.mainS - prevS;
    if (delta > L / 2) delta -= L;
    if (delta < -L / 2) delta += L;
    this.total = prevTotal + delta;
    this.lastS = this.q.mainS;
    this.speed = 10;
    this.invuln = 2.0;
  }

  update(dt, input, frozen = false) {
    const T = this.track;
    this.invuln = Math.max(0, this.invuln - dt);
    this.hazardImmune = Math.max(0, (this.hazardImmune || 0) - dt);

    // Sinking into sludge: wait, then respawn past the pit.
    if (this.sinkTime > 0) {
      this.sinkTime -= dt;
      this.pos.y -= dt * 1.5;
      if (this.sinkTime <= 0) {
        const r = T.ramps.find((rr) => rr.pit && rr.path === this.q.path && this.q.s > rr.s - 10 && this.q.s < rr.s + rr.len + rr.pit + 10);
        this.respawn(r ? r.path.mainS(r.s + r.len + r.pit + 8) : this.q.mainS + 10);
      }
      this.syncVisual(dt);
      return;
    }

    let steer = 0, gas = 0, brake = 0, drift = false, driftPressed = false;
    if (!frozen && this.spinTime <= 0) {
      steer = input.steer; gas = input.gas; brake = input.brake; drift = input.drift; driftPressed = input.driftPressed;
    }
    this.steer = steer;

    // --- Hop & drift.
    if (driftPressed && this.grounded && this.speed > 8) {
      this.vy = 4.2;
      this.grounded = false;
      this.drift.pending = Math.sign(steer);
      this.events.push({ type: 'hop' });
    }
    if (this.drift.on) {
      if (!drift || this.speed < 7) this._endDrift();
      else {
        const into = steer * this.drift.dir;
        this.drift.charge += dt * (0.9 + 0.6 * Math.max(0, into));
        const lvl = this.drift.charge > 2.3 ? 2 : this.drift.charge > 1.1 ? 1 : 0;
        if (lvl > this.drift.level) this.events.push({ type: 'driftLevel', level: lvl });
        this.drift.level = lvl;
      }
    }

    // --- Spin out.
    if (this.spinTime > 0) {
      this.spinTime -= dt;
      this.spinAngle += dt * 14;
      this.speed *= Math.pow(0.3, dt);
    } else this.spinAngle = 0;

    // --- Speed.
    const offroad = this.surface === 'dirt' || this.surface === 'gravel';
    const grip = this.surface === 'dirt' ? 0.55 : this.surface === 'gravel' ? 0.84 : 1;
    const ice = this.surface === 'ice' && this.grounded;
    if (this.boostTime > 0) {
      this.boostTime -= dt;
      const target = this.maxSpeed * this.boostMult;
      if (this.speed < target) this.speed += Math.min(target - this.speed, 45 * dt);
    } else if (this.grounded) {
      const top = this.maxSpeed * this.speedScale * grip;
      if (gas > 0 && this.speed >= -0.5) {
        const target = top * gas;
        if (this.speed < target) this.speed += this.accel * (1 - Math.pow(this.speed / target, 2) * 0.85) * dt;
        else this.speed -= Math.min(this.speed - target, (offroad ? 30 * (1 - grip) * 2 : 8) * dt);
      } else if (brake > 0) {
        if (this.speed > 0.5) this.speed -= 32 * brake * dt;
        else this.speed = Math.max(-9, this.speed - 12 * brake * dt);
      } else {
        const f = (this.surface === 'dirt' ? 14 : ice ? 1.5 : 5) * dt;
        this.speed = Math.abs(this.speed) < f ? 0 : this.speed - Math.sign(this.speed) * f;
      }
      if (gas > 0 && this.speed < 0) this.speed += 25 * dt;
    }
    if (this.boostTime <= 0 && this.speed > this.maxSpeed * 1.5) this.speed -= 10 * dt;

    // --- Steering.
    const sp = Math.abs(this.speed);
    const speedFactor = Math.min(1, sp / 7) * (1 - 0.3 * Math.min(1, sp / this.maxSpeed));
    let yawRate;
    if (this.drift.on) {
      const into = steer * this.drift.dir;
      yawRate = this.drift.dir * this.turnRate * (0.62 + 0.48 * into) * Math.min(1, sp / 7);
    } else {
      yawRate = steer * this.turnRate * speedFactor * Math.sign(this.speed || 1);
    }
    if (!this.grounded) yawRate *= 0.5;
    if (ice) yawRate *= 0.7; // the tyres barely bite on ice
    this.yaw -= yawRate * dt; // positive steer = turn right = clockwise from above
    if (this.spinTime > 0) this.yaw += Math.sin(this.spinAngle * 0.5) * dt * 0.5;

    // --- Move.
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    let slide = 0;
    if (this.drift.on) slide = -this.drift.dir * sp * 0.12; // drift out wide
    if (ice) slide += -steer * sp * 0.1 * (this.drift.on ? 0.5 : 1); // and slither on ice
    this.pos.x += fx * this.speed * dt - fz * slide * dt;
    this.pos.z += fz * this.speed * dt + fx * slide * dt;

    // --- Track query & walls.
    const q = T.locate(this.pos.x, this.pos.z, this.pos.y, this.loc, this.q);
    const wall = q.wallHalf - 0.9;
    if (Math.abs(q.d) > wall) {
      const side = Math.sign(q.d);
      const over = Math.abs(q.d) - wall;
      this.pos.x -= q.rx * over * side;
      this.pos.z -= q.rz * over * side;
      const outward = (fx * q.rx + fz * q.rz) * side;
      if (outward > 0) {
        const tangentYaw = Math.atan2(q.tx, q.tz);
        const fwd = Math.abs(wrapAngle(tangentYaw - this.yaw)) < Math.PI / 2 ? tangentYaw : tangentYaw + Math.PI;
        this.yaw += wrapAngle(fwd - this.yaw) * 0.35;
        const impact = outward * sp;
        this.speed *= 1 - Math.min(0.5, outward * 0.6);
        if (impact > 6) this.events.push({ type: 'bump', strength: impact });
      }
      T.locate(this.pos.x, this.pos.z, this.pos.y, this.loc, this.q);
    }

    // --- Vertical: ballistic with ground snapping, so ramps and crests launch you.
    const gnd = T.ground(this.pos.x, this.pos.z, this.q);
    this.surface = gnd.surface;
    const prevY = this.pos.y;
    this.vy -= GRAVITY * dt;
    this.pos.y += this.vy * dt;
    const wasGrounded = this.grounded;
    if (this.pos.y <= gnd.h) {
      if (!wasGrounded && gnd.h - this.pos.y > 1.0 && gnd.surface !== 'sludge') {
        // Smacked into the far wall of a pit: bounce back and drop in.
        this.pos.x -= fx * 1.5; this.pos.z -= fz * 1.5;
        this.speed = -2;
        this.events.push({ type: 'bump', strength: 12 });
      } else {
        this.pos.y = gnd.h;
        if (!wasGrounded) this._land();
        this.vy = Math.min(12, Math.max(-30, (gnd.h - prevY) / Math.max(dt, 1e-3)));
        this.grounded = true;
        this.airTime = 0;
      }
    } else if (this.pos.y > gnd.h + 0.12) {
      this.grounded = false;
      this.airTime += dt;
    }
    if (gnd.surface === 'sludge' && this.pos.y <= gnd.h + 0.05 && this.sinkTime <= 0) {
      this.sinkTime = 1.3;
      this.speed = 0;
      this._endDrift(false);
      this.events.push({ type: 'splash' });
    }

    // Slopes pull you back uphill / push you down.
    if (this.grounded) {
      const ahead = T.ground(this.pos.x + fx, this.pos.z + fz, this.q.path.query(this.pos.x + fx, this.pos.z + fz, this.q.index, {}));
      const slope = Math.max(-0.5, Math.min(0.5, ahead.h - gnd.h));
      if (gnd.surface !== 'sludge' && ahead.surface !== 'sludge') this.speed -= GRAVITY * slope * 0.35 * dt;
    }

    // --- Progress along the track.
    let delta = this.q.mainS - this.lastS;
    const L = T.length;
    if (delta > L / 2) delta -= L;
    if (delta < -L / 2) delta += L;
    this.total += delta;
    this.lastS = this.q.mainS;

    this.syncVisual(dt);
  }

  _land() {
    if (this.airTime > 0.35) this.events.push({ type: 'land', air: this.airTime });
    if (this.airTime > 0.25) this.suspV -= Math.min(4, this.airTime * 5);
    if (this.drift.pending && !this.drift.on && this.speed > 8) {
      this.drift.on = true;
      this.drift.dir = this.drift.pending;
      this.drift.charge = 0;
      this.drift.level = 0;
    }
    this.drift.pending = 0;
  }

  _endDrift(reward = true) {
    if (this.drift.on && reward && this.drift.level > 0) {
      this.boost(this.drift.level === 2 ? 1.25 : 0.65, this.drift.level === 2 ? 1.32 : 1.24);
      this.events.push({ type: 'miniturbo', level: this.drift.level });
    }
    this.drift.on = false; this.drift.charge = 0; this.drift.level = 0; this.drift.dir = 0;
  }

  // Visual pose: tilt to the ground, suspension bounce, wheels, driver.
  syncVisual(dt) {
    const T = this.track, g = this.model.group;
    g.position.copy(this.pos);
    if (this.grounded && dt > 0) {
      const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
      const rx = -fz, rz = fx;
      const h = (x, z) => T.ground(x, z, this.q.path.query(x, z, this.q.index, this._hq ??= {})).h;
      const hf = h(this.pos.x + fx * 0.9, this.pos.z + fz * 0.9), hb = h(this.pos.x - fx * 0.9, this.pos.z - fz * 0.9);
      const hr = h(this.pos.x + rx * 0.6, this.pos.z + rz * 0.6), hl = h(this.pos.x - rx * 0.6, this.pos.z - rz * 0.6);
      const tp = Math.atan2(hb - hf, 1.8), tr = Math.atan2(hr - hl, 1.2);
      this.pitch += (Math.max(-0.6, Math.min(0.6, tp)) - this.pitch) * Math.min(1, dt * 12);
      this.roll += (Math.max(-0.5, Math.min(0.5, tr)) - this.roll) * Math.min(1, dt * 12);
    } else if (dt > 0) {
      this.pitch += (Math.max(-0.35, Math.min(0.35, -this.vy * 0.03)) - this.pitch) * Math.min(1, dt * 3);
      this.roll *= Math.pow(0.2, dt);
    }
    const targetDrift = this.drift.on ? this.drift.dir * -0.38 : 0;
    this.driftVisual += (targetDrift - this.driftVisual) * Math.min(1, dt * 8);
    g.rotation.set(0, 0, 0);
    g.rotation.order = 'YXZ';
    g.rotation.y = this.yaw + this.driftVisual + this.spinAngle;
    g.rotation.x = this.pitch;
    g.rotation.z = this.roll;

    // suspension spring
    this.suspV += (-this.susp * 120 - this.suspV * 10) * dt;
    this.susp += this.suspV * dt;
    const body = this.model.body;
    const rattle = this.grounded ? (this.surface === 'dirt' ? 0.02 : this.surface === 'cobble' || this.surface === 'brick' ? 0.015 : 0) : 0;
    body.position.y = this.susp * 0.15 + Math.sin(performance.now() * 0.05) * rattle;
    body.rotation.z = -this.steer * Math.min(1, Math.abs(this.speed) / 20) * 0.05;

    this.wheelSpin += (this.speed * dt) / 0.22;
    for (const w of this.model.wheels) {
      w.wheel.rotation.x = this.wheelSpin;
      if (w.front) w.pivot.rotation.y = -this.steer * 0.4 - this.driftVisual * 0.8;
    }
    if (this.model.steering) {
      this.model.steering.userData.base ??= this.model.steering.quaternion.clone();
      this.model.steering.quaternion.copy(this.model.steering.userData.base).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), this.steer * 0.9));
    }
    const boosting = this.boostTime > 0;
    for (const f of this._flames) {
      f.visible = boosting;
      if (boosting) f.scale.set(1, 1, 0.8 + Math.random() * 0.6 * (this.boostMult > 1.3 ? 1.4 : 1));
    }
    if (this.driver) this.driver.update(dt, this.drift.on ? this.drift.dir * 0.8 : this.steer, this.susp);
    // blink while invulnerable after a respawn
    g.visible = this.invuln <= 0 || Math.floor(this.invuln * 12) % 2 === 0;
  }

  rearWheelWorld(side, out) {
    out.set(side * 0.58, 0.05, -0.85);
    return this.model.group.localToWorld(out);
  }
}
