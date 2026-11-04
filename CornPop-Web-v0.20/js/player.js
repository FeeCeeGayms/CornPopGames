// Player movement: a port of Quake III Arena's bg_pmove.c (PM_WalkMove, PM_AirMove, PM_StepSlideMove, PM_SlideMove,
// PM_Friction, PM_Accelerate, PM_CheckJump, PM_CheckDuck, PM_GroundTrace) with the VQ3 defaults:
// speed 320, accelerate 10, air accelerate 1 (no air cap: strafe jumping and circle jumps work), friction 6,
// stop speed 100, jump 270, gravity 800, step 18. Units are Quake units, Y is up.
export const PM = {
  gravity: 800, maxspeed: 320, walkspeed: 160, accelerate: 10, airaccel: 1,
  friction: 6, stopspeed: 100, jump: 270, stepsize: 18, eye: 22, duckEye: 2, duckScale: 0.25, overclip: 1.0,   // Quake III uses 1.001 to fight float plane drift; these traces already back off, and an exact clip keeps 32-unit lanes snag-free
};
export const HULL_MIN = [-16, -24, -16], HULL_MAX = [16, 32, 16];
export const DUCK_MAX = [16, 8, 16];
const MIN_WALK_NORMAL = 0.7;

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
function clip(v, n, overbounce) {
  let backoff = dot(v, n); backoff = backoff < 0 ? backoff * overbounce : backoff / overbounce;
  return [v[0] - n[0] * backoff, v[1] - n[1] * backoff, v[2] - n[2] * backoff];
}
const norm = v => { const l = Math.hypot(v[0], v[1], v[2]); return l > 1e-9 ? [v[0] / l, v[1] / l, v[2] / l] : [0, 0, 0]; };

export class Player {
  constructor(world) {
    this.world = world; this.pos = [0, 0, 0]; this.vel = [0, 0, 0];
    this.yaw = 0; this.pitch = 0; this.onground = false; this.groundNormal = null; this.groundPlane = false;
    this.viewZOffset = 0; this.bobTime = 0; this.landKick = 0; this.jumpHeld = false; this.ducked = false; this.duckT = 0;
    this.hmax = HULL_MAX; this.events = []; this.bob = 0; this.roll = 0; this.speed = 0;
    this.accel = PM.accelerate; this.airaccel = PM.airaccel; this.friction = PM.friction;
  }
  spawn(pos, yawDeg) { this.pos = pos.slice(); this.vel = [0, 0, 0]; this.yaw = yawDeg * Math.PI / 180; this.pitch = 0; this.ducked = false; this.hmax = HULL_MAX; this.groundTrace(); }

  trace(a, b) { return this.world.trace(a, b, HULL_MIN, this.hmax, this.ignore); }

  // ---- PM_CheckDuck ----
  checkDuck(cmd) {
    if (cmd.crouch) { if (!this.ducked) { this.ducked = true; this.hmax = DUCK_MAX; } }
    else if (this.ducked && !this.world.testPosition(this.pos, HULL_MIN, HULL_MAX, this.ignore)) { this.ducked = false; this.hmax = HULL_MAX; }
  }
  // ---- PM_GroundTrace ----
  groundTrace() {
    const p = this.pos, tr = this.trace(p, [p[0], p[1] - 0.25, p[2]]);
    if (tr.fraction === 1 || !tr.normal) { this.groundPlane = false; this.onground = false; this.groundNormal = null; return; }
    if (this.vel[1] > 0 && dot(this.vel, tr.normal) > 10) { this.groundPlane = false; this.onground = false; this.groundNormal = null; return; } // kicked off the ground
    this.groundNormal = tr.normal; this.groundPlane = true;
    if (tr.normal[1] < MIN_WALK_NORMAL) { this.onground = false; return; }   // too steep to walk on
    if (!this.onground && this.vel[1] < -300) this.events.push({ type: 'land', speed: -this.vel[1] });
    this.onground = true;
  }
  // ---- PM_CheckJump: Quake III needs the jump button released between jumps (unless auto-hop is on) ----
  checkJump(cmd) {
    if (!cmd.jump) { this.jumpHeld = false; return false; }
    if (this.jumpHeld && !this.autoHop) return false;
    this.groundPlane = false; this.onground = false; this.jumpHeld = true; this.groundNormal = null;
    this.vel[1] = this.jumpVel || PM.jump; this.events.push({ type: 'jump' });
    return true;
  }
  wish(cmd, flatten) {
    let fw = [-Math.sin(this.yaw), 0, -Math.cos(this.yaw)], rt = [Math.cos(this.yaw), 0, -Math.sin(this.yaw)];
    if (!flatten && this.groundPlane && this.groundNormal) { fw = norm(clip(fw, this.groundNormal, PM.overclip)); rt = norm(clip(rt, this.groundNormal, PM.overclip)); }
    const wv = [fw[0] * cmd.forward + rt[0] * cmd.side, fw[1] * cmd.forward + rt[1] * cmd.side, fw[2] * cmd.forward + rt[2] * cmd.side];
    const mag = Math.min(1, Math.max(Math.abs(cmd.forward), Math.abs(cmd.side), Math.hypot(cmd.forward, cmd.side) > 1 ? 1 : Math.hypot(cmd.forward, cmd.side)));
    const max = this.maxspeed || (cmd.walk ? PM.walkspeed : PM.maxspeed);
    let speed = mag * max; if (this.ducked) speed = Math.min(speed, max * PM.duckScale);
    return { dir: norm(wv), speed };
  }
  accelerate(dir, wishspeed, accel, dt) {
    const cur = dot(this.vel, dir), add = wishspeed - cur; if (add <= 0) return;
    let acc = accel * dt * wishspeed; if (acc > add) acc = add;
    this.vel[0] += acc * dir[0]; this.vel[1] += acc * dir[1]; this.vel[2] += acc * dir[2];
  }
  // ---- PM_Friction ----
  applyFriction(dt) {
    const v = this.vel; const sp = this.onground ? Math.hypot(v[0], v[2]) : Math.hypot(v[0], v[1], v[2]);
    if (sp < 1) { v[0] = 0; v[2] = 0; return; }
    let drop = 0; if (this.onground) { const control = sp < PM.stopspeed ? PM.stopspeed : sp; drop += control * this.friction * dt; }
    let ns = sp - drop; if (ns < 0) ns = 0; ns /= sp; v[0] *= ns; v[1] *= ns; v[2] *= ns;
  }
  // ---- PM_SlideMove ----
  slideMove(dt, gravity) {
    let endVel = [0, 0, 0];
    if (gravity) { endVel = this.vel.slice(); endVel[1] -= PM.gravity * dt; this.vel[1] = (this.vel[1] + endVel[1]) * 0.5; if (this.groundPlane && this.groundNormal) this.vel = clip(this.vel, this.groundNormal, PM.overclip); }
    let timeLeft = dt; const planes = [];
    if (this.groundPlane && this.groundNormal) planes.push(this.groundNormal);
    planes.push(norm(this.vel));
    let bump;
    for (bump = 0; bump < 4; bump++) {
      const end = [this.pos[0] + this.vel[0] * timeLeft, this.pos[1] + this.vel[1] * timeLeft, this.pos[2] + this.vel[2] * timeLeft];
      const tr = this.trace(this.pos, end);
      if (tr.fraction > 0) this.pos = tr.end;
      if (tr.fraction === 1) break;
      if (tr.brush && tr.brush.touch) tr.brush.touch(this);
      timeLeft -= timeLeft * tr.fraction;
      if (planes.length >= 5) { this.vel = [0, 0, 0]; return true; }
      const n = tr.normal; let i;
      for (i = 0; i < planes.length; i++) if (dot(n, planes[i]) > 0.99) { this.vel = [this.vel[0] + n[0], this.vel[1] + n[1], this.vel[2] + n[2]]; break; }
      if (i < planes.length) continue;
      if (planes.some(q => dot(n, q) < -0.99)) { // squeezed between two facing walls (a corridor exactly as wide as the hull): drop that axis
        const a1 = dot(this.vel, n), a2 = dot(endVel, n);
        this.vel = [this.vel[0] - n[0] * a1, this.vel[1] - n[1] * a1, this.vel[2] - n[2] * a1]; endVel = [endVel[0] - n[0] * a2, endVel[1] - n[1] * a2, endVel[2] - n[2] * a2]; continue;
      }
      planes.push(n);
      for (i = 0; i < planes.length; i++) {
        if (dot(this.vel, planes[i]) >= 0.1) continue;
        let cv = clip(this.vel, planes[i], PM.overclip), ce = clip(endVel, planes[i], PM.overclip);
        for (let j = 0; j < planes.length; j++) {
          if (j === i || dot(cv, planes[j]) >= 0.1) continue;
          if (dot(planes[i], planes[j]) < -0.99) { // squeezed between two facing walls (a corridor exactly as wide as the hull): just drop that axis
            const n = planes[i], a1 = dot(cv, n), a2 = dot(ce, n);
            cv = [cv[0] - n[0] * a1, cv[1] - n[1] * a1, cv[2] - n[2] * a1]; ce = [ce[0] - n[0] * a2, ce[1] - n[1] * a2, ce[2] - n[2] * a2]; continue;
          }
          cv = clip(cv, planes[j], PM.overclip); ce = clip(ce, planes[j], PM.overclip);
          if (dot(cv, planes[i]) >= 0) continue;
          const a = planes[i], b = planes[j];
          const dir = norm([a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]);
          let d = dot(dir, this.vel); cv = [dir[0] * d, dir[1] * d, dir[2] * d]; d = dot(dir, endVel); ce = [dir[0] * d, dir[1] * d, dir[2] * d];
          for (let k = 0; k < planes.length; k++) { if (k === i || k === j || dot(cv, planes[k]) >= 0.1) continue; this.vel = [0, 0, 0]; return true; }
        }
        this.vel = cv; endVel = ce; break;
      }
    }
    if (gravity) this.vel = endVel;
    return bump !== 0;
  }
  // ---- PM_StepSlideMove ----
  stepSlideMove(dt, gravity) {
    const startO = this.pos.slice(), startV = this.vel.slice();
    if (!this.slideMove(dt, gravity)) return;          // got where we wanted to go first try
    let tr = this.trace(startO, [startO[0], startO[1] - PM.stepsize, startO[2]]);
    if (this.vel[1] > 0 && (tr.fraction === 1 || !tr.normal || tr.normal[1] < 0.7)) return; // never step up with upward velocity
    const noStepPos = this.pos.slice(), noStepVel = this.vel.slice();
    tr = this.trace(startO, [startO[0], startO[1] + PM.stepsize, startO[2]]);
    if (tr.startsolid && tr.fraction === 0) return;
    const stepUp = tr.end[1] - startO[1];
    this.pos = tr.end; this.vel = startV.slice();
    this.slideMove(dt, gravity);
    tr = this.trace(this.pos, [this.pos[0], this.pos[1] - stepUp, this.pos[2]]);
    this.pos = tr.end; if (tr.fraction < 1 && tr.normal) this.vel = clip(this.vel, tr.normal, PM.overclip);
    const dS = Math.hypot(this.pos[0] - startO[0], this.pos[2] - startO[2]), dN = Math.hypot(noStepPos[0] - startO[0], noStepPos[2] - startO[2]);
    if (dS + 0.01 < dN) { this.pos = noStepPos; this.vel = noStepVel; return; }   // the step got us less far: keep sliding along the wall
    const rise = this.pos[1] - noStepPos[1];
    if (rise > 0.5 && this.onground) this.viewZOffset -= rise;                      // smooth the view up stairs (cg stepchange)
  }
  walkMove(dt, cmd) {
    if (this.checkJump(cmd)) { this.airMove(dt, cmd); return; }
    this.applyFriction(dt);
    const w = this.wish(cmd, false);
    this.accelerate(w.dir, w.speed, this.accel, dt);
    const vl = Math.hypot(this.vel[0], this.vel[1], this.vel[2]);
    if (this.groundNormal) this.vel = clip(this.vel, this.groundNormal, PM.overclip);
    const nl = Math.hypot(this.vel[0], this.vel[1], this.vel[2]); if (nl > 1e-6) { this.vel[0] *= vl / nl; this.vel[1] *= vl / nl; this.vel[2] *= vl / nl; } // don't lose speed on slopes
    if (!this.vel[0] && !this.vel[2]) return;
    this.stepSlideMove(dt, false);
  }
  airMove(dt, cmd) {
    if (!cmd.jump) this.jumpHeld = false;
    this.applyFriction(dt);
    const w = this.wish(cmd, true);
    this.accelerate(w.dir, w.speed, this.airaccel, dt);
    if (this.groundPlane && this.groundNormal) this.vel = clip(this.vel, this.groundNormal, PM.overclip);
    this.stepSlideMove(dt, true);
  }

  // doorway assist: the hull is exactly one 32-unit cell wide, so pushing into a doorway a unit or two off-centre snags the
  // frame. When forward motion stalls against an edge, ease sideways (up to 6 units) toward the free gap.
  cornerAssist(dt, cmd, before) {
    if (!cmd.forward && !cmd.side) return;
    const fw = [-Math.sin(this.yaw), -Math.cos(this.yaw)], rt = [Math.cos(this.yaw), -Math.sin(this.yaw)];
    let wx = fw[0] * cmd.forward + rt[0] * cmd.side, wz = fw[1] * cmd.forward + rt[1] * cmd.side; const wl = Math.hypot(wx, wz); if (wl < 0.3) return;
    wx /= wl; wz /= wl;
    const moved = (this.pos[0] - before[0]) * wx + (this.pos[2] - before[2]) * wz;
    if (moved > 320 * dt * 0.25) return;                        // moving fine
    // the world is axis-aligned boxes: ease along the cardinal axis across the motion, trying the nearest whole-unit line first
    const ax = Math.abs(wx) >= Math.abs(wz) ? 2 : 0, c = this.pos[ax];
    const cands = [Math.round(c) - c]; for (const off of [0.5, 1, 2, 3, 4, 5, 6]) cands.push(off, -off);
    for (const d of cands) {
      if (Math.abs(d) < 1e-4) continue;
      const p2 = this.pos.slice(); p2[ax] += d;
      if (this.world.testPosition(p2, HULL_MIN, this.hmax, this.ignore)) continue;
      if (this.onground && this.trace(p2, [p2[0], p2[1] - 20, p2[2]]).fraction === 1) continue;   // never ease off a ledge
      const tr = this.trace(p2, [p2[0] + wx * 12, p2[1], p2[2] + wz * 12]);
      if (tr.fraction < 0.99) { const tr2 = this.trace(p2, [p2[0] + (ax === 2 ? wx : 0) * 12, p2[1], p2[2] + (ax === 0 ? wz : 0) * 12]); if (tr2.fraction < 0.99) continue; }
      const step = Math.sign(d) * Math.min(Math.abs(d), 160 * dt * 4);   // slide over smoothly, not a teleport
      const np = this.pos.slice(); np[ax] += Math.abs(step) >= Math.abs(d) ? d : step;
      if (!this.world.testPosition(np, HULL_MIN, this.hmax, this.ignore)) this.pos = np;
      return;
    }
  }
  // cmd: {forward, side (-1..1), jump, walk, crouch}
  update(dt, cmd) {
    this.checkDuck(cmd);
    this.groundTrace();
    const before = this.pos.slice();
    if (this.onground) this.walkMove(dt, cmd); else this.airMove(dt, cmd);
    this.cornerAssist(dt, cmd, before);
    this.groundTrace();
    if (this.onground && this.vel[1] < 0) this.vel[1] = 0;
    // unstick if a door or a lift pushed us into a solid
    if (this.world.testPosition(this.pos, HULL_MIN, this.hmax, this.ignore)) {
      for (const dy of [1, 2, 4, 8, 16]) { const p = [this.pos[0], this.pos[1] + dy, this.pos[2]]; if (!this.world.testPosition(p, HULL_MIN, this.hmax, this.ignore)) { this.pos = p; break; } }
    }
    // view: Quake III's light bob (cg_bobup 0.005), run roll, step smoothing, crouch height
    this.viewZOffset *= Math.exp(-dt * 16); if (Math.abs(this.viewZOffset) < 0.05) this.viewZOffset = 0;
    const hs = Math.hypot(this.vel[0], this.vel[2]);
    this.bobTime += dt * (0.5 + hs / 320);
    const target = this.onground ? Math.abs(Math.sin(this.bobTime * Math.PI * 1.8)) * hs * 0.006 : 0;
    this.bob += (target - this.bob) * Math.min(1, dt * 12);
    const ry = [Math.cos(this.yaw), -Math.sin(this.yaw)], side = this.vel[0] * ry[0] + this.vel[2] * ry[1];
    this.roll = -Math.sign(side) * Math.min(Math.abs(side), 320) / 320 * 1.2 * Math.PI / 180;
    this.landKick *= Math.exp(-dt * 10);
    this.duckT += ((this.ducked ? PM.eye - PM.duckEye : 0) - this.duckT) * Math.min(1, dt * 18);
    this.speed = hs;
  }
  eye() { return [this.pos[0], this.pos[1] + PM.eye - this.duckT + (this.bob || 0) + this.viewZOffset - this.landKick, this.pos[2]]; }
}
