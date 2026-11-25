// Monster movement: Quake's SV_WalkMove / SV_FlyMove (the original mover, kept for the AI: it is tuned for their path following).
// The player uses the Quake III port in player.js.
export const PM = {
  gravity: 800, maxspeed: 320, walkspeed: 160, accelerate: 10, airaccel: 10, aircap: 30,
  friction: 4, stopspeed: 100, jump: 270, stepsize: 18, eye: 22,
};
export const HULL_MIN = [-16, -24, -16], HULL_MAX = [16, 32, 16];

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function clipVelocity(v, n, overbounce = 1) {
  const backoff = dot(v, n) * overbounce; const o = [0, 0, 0];
  for (let i = 0; i < 3; i++) { o[i] = v[i] - n[i] * backoff; if (o[i] > -0.1 && o[i] < 0.1) o[i] = 0; }
  return o;
}

export class MonsterMove {
  constructor(world) {
    this.world = world; this.pos = [0, 0, 0]; this.vel = [0, 0, 0];
    this.yaw = 0; this.pitch = 0; this.onground = false; this.groundNormal = null;
    this.viewZOffset = 0; this.bobTime = 0; this.landKick = 0; this.jumpHeld = false;
    this.events = [];
  }
  spawn(pos, yawDeg) { this.pos = pos.slice(); this.vel = [0, 0, 0]; this.yaw = yawDeg * Math.PI / 180; this.pitch = 0; this.categorize(); }

  categorize() {
    const p = this.pos; const tr = this.world.trace(p, [p[0], p[1] - 2, p[2]], HULL_MIN, HULL_MAX, this.ignore);
    if (tr.normal && tr.normal[1] > 0.7 && this.vel[1] <= 180) { if (!this.onground && this.vel[1] < -300) this.events.push({ type: 'land', speed: -this.vel[1] }); this.onground = true; this.groundNormal = tr.normal; }
    else { this.onground = false; this.groundNormal = null; }
  }

  friction(dt) {
    const v = this.vel; const speed = Math.hypot(v[0], v[2]);
    if (speed < 1) { v[0] = 0; v[2] = 0; return; }
    const control = speed < PM.stopspeed ? PM.stopspeed : speed;
    let newspeed = speed - dt * control * PM.friction; if (newspeed < 0) newspeed = 0;
    newspeed /= speed; v[0] *= newspeed; v[2] *= newspeed;
  }
  accelerate(wishdir, wishspeed, accel, dt) {
    const cur = this.vel[0] * wishdir[0] + this.vel[2] * wishdir[2];
    const addspeed = wishspeed - cur; if (addspeed <= 0) return;
    let acc = accel * dt * wishspeed; if (acc > addspeed) acc = addspeed;
    this.vel[0] += acc * wishdir[0]; this.vel[2] += acc * wishdir[2];
  }
  airAccelerate(wishdir, wishspeed, dt) {
    const wishspd = Math.min(wishspeed, PM.aircap);
    const cur = this.vel[0] * wishdir[0] + this.vel[2] * wishdir[2];
    const addspeed = wishspd - cur; if (addspeed <= 0) return;
    let acc = PM.airaccel * wishspeed * dt; if (acc > addspeed) acc = addspeed;
    this.vel[0] += acc * wishdir[0]; this.vel[2] += acc * wishdir[2];
  }

  // SV_FlyMove: returns blocked flags (1 = floor, 2 = wall/step)
  flyMove(dt) {
    const W = this.world; let blocked = 0; const planes = []; const primal = this.vel.slice(); const original = this.vel.slice();
    let timeLeft = dt;
    for (let bump = 0; bump < 4; bump++) {
      if (!this.vel[0] && !this.vel[1] && !this.vel[2]) break;
      const end = [this.pos[0] + timeLeft * this.vel[0], this.pos[1] + timeLeft * this.vel[1], this.pos[2] + timeLeft * this.vel[2]];
      const tr = W.trace(this.pos, end, HULL_MIN, HULL_MAX, this.ignore);
      if (tr.fraction > 0) { this.pos = tr.end; for (let i = 0; i < 3; i++) original[i] = this.vel[i]; planes.length = 0; }
      if (tr.fraction === 1) break;
      const n = tr.normal;
      if (n[1] > 0.7) blocked |= 1; if (!n[1]) blocked |= 2;
      if (tr.brush && tr.brush.touch) tr.brush.touch(this);
      timeLeft -= timeLeft * tr.fraction;
      if (planes.length >= 5) { this.vel = [0, 0, 0]; break; }
      planes.push(n);
      let i, nv;
      for (i = 0; i < planes.length; i++) {
        nv = clipVelocity(original, planes[i]);
        let j; for (j = 0; j < planes.length; j++) if (j !== i && dot(nv, planes[j]) < 0) break;
        if (j === planes.length) break;
      }
      if (i !== planes.length) this.vel = nv;
      else {
        if (planes.length !== 2) { this.vel = [0, 0, 0]; break; }
        const a = planes[0], b = planes[1];
        const dir = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
        const d = dot(dir, this.vel); this.vel = [dir[0] * d, dir[1] * d, dir[2] * d];
      }
      if (dot(this.vel, primal) <= 0) { this.vel = [0, 0, 0]; break; }
    }
    return blocked;
  }

  walkMove(dt) {
    const oldonground = this.onground;
    const oldorg = this.pos.slice(), oldvel = this.vel.slice();
    const clip = this.flyMove(dt);
    if (!(clip & 2)) return;
    if (!oldonground) return;
    const nosteporg = this.pos.slice(), nostepvel = this.vel.slice();
    // try stepping up
    this.pos = oldorg.slice();
    let tr = this.world.trace(this.pos, [this.pos[0], this.pos[1] + PM.stepsize, this.pos[2]], HULL_MIN, HULL_MAX, this.ignore); this.pos = tr.end;
    this.vel = [oldvel[0], 0, oldvel[2]];
    this.flyMove(dt);
    // move down
    tr = this.world.trace(this.pos, [this.pos[0], this.pos[1] - PM.stepsize + oldvel[1] * dt - 1, this.pos[2]], HULL_MIN, HULL_MAX, this.ignore);
    const steppedDist = Math.hypot(tr.end[0] - oldorg[0], tr.end[2] - oldorg[2]), noStepDist = Math.hypot(nosteporg[0] - oldorg[0], nosteporg[2] - oldorg[2]);
    if (tr.normal && tr.normal[1] > 0.7 && steppedDist > noStepDist + 0.01) {
      const rise = tr.end[1] - nosteporg[1];
      this.pos = tr.end; this.vel[1] = 0;
      if (rise > 0.5) this.viewZOffset -= rise; // smooth the camera over steps (cl stair smoothing)
    } else { this.pos = nosteporg; this.vel = nostepvel; }
  }

  // cmd: {forward, side (-1..1), jump, walk}
  update(dt, cmd) {
    // wish direction from yaw only (Quake ground movement)
    const fy = [-Math.sin(this.yaw), -Math.cos(this.yaw)], ry = [Math.cos(this.yaw), -Math.sin(this.yaw)];
    let wx = fy[0] * cmd.forward + ry[0] * cmd.side, wz = fy[1] * cmd.forward + ry[1] * cmd.side;
    const mag = Math.min(1, Math.hypot(cmd.forward, cmd.side));
    const wl = Math.hypot(wx, wz); const wishdir = wl > 0 ? [wx / wl, 0, wz / wl] : [0, 0, 0];
    const wishspeed = mag * (this.maxspeed || (cmd.walk ? PM.walkspeed : PM.maxspeed));

    // jump
    if (cmd.jump && this.onground) { this.vel[1] = this.jumpVel || PM.jump; this.onground = false; this.events.push({ type: 'jump' }); }

    if (this.onground) { this.friction(dt); this.accelerate(wishdir, wishspeed, PM.accelerate, dt); }
    else this.airAccelerate(wishdir, wishspeed, dt);

    // gravity (half before, half after keeps jump height exact)
    this.vel[1] -= PM.gravity * dt * 0.5;
    if (this.onground && this.vel[1] < 0) this.vel[1] = 0;
    if (this.onground) this.walkMove(dt); else this.flyMove(dt);
    this.categorize();
    if (!this.onground) this.vel[1] -= PM.gravity * dt * 0.5; else if (this.vel[1] < 0) this.vel[1] = 0;

    // unstick if a door or something pushed us into a solid
    if (this.world.testPosition(this.pos, HULL_MIN, HULL_MAX, this.ignore)) {
      for (const dy of [1, 2, 4, 8, 16]) { const p = [this.pos[0], this.pos[1] + dy, this.pos[2]]; if (!this.world.testPosition(p, HULL_MIN, HULL_MAX, this.ignore)) { this.pos = p; break; } }
    }

    // view smoothing & bob (cl_bob 0.02, cl_bobcycle 0.6, cl_bobup 0.5)
    this.viewZOffset *= Math.exp(-dt * 14); if (Math.abs(this.viewZOffset) < 0.05) this.viewZOffset = 0;
    const hs = Math.hypot(this.vel[0], this.vel[2]);
    this.bobTime += dt;
    const cycleT = (this.bobTime % 0.6) / 0.6;
    const cyc = cycleT < 0.5 ? Math.PI * cycleT / 0.5 : Math.PI + Math.PI * (cycleT - 0.5) / 0.5;
    let bob = hs * 0.02; bob = bob * 0.3 + bob * 0.7 * Math.sin(cyc); bob = Math.max(-7, Math.min(4, bob));
    this.bob = this.onground ? bob : this.bob * 0.9;
    // roll on strafe (cl_rollangle 2, cl_rollspeed 200)
    const side = this.vel[0] * ry[0] + this.vel[2] * ry[1];
    const s = Math.min(Math.abs(side), 200) / 200 * 2; this.roll = (side < 0 ? 1 : -1) * s * Math.PI / 180;
    this.landKick *= Math.exp(-dt * 8);
    this.speed = hs;
  }
  eye() { return [this.pos[0], this.pos[1] + PM.eye + (this.bob || 0) + this.viewZOffset - this.landKick, this.pos[2]]; }
}
