// Rival drivers: follow the road with their own lane, slow for corners, line up
// with barrel gaps, sometimes take shortcuts, and rubber-band around the player.
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export class AIController {
  constructor(kart, track, { skill = 1, seed = 0, prefer = {} } = {}) {
    this.prefer = prefer; // test hook: force a route choice per branch id
    this.kart = kart;
    this.track = track;
    this.skill = skill;
    this.seed = seed;
    this.time = seed * 10;
    this.stuck = 0;
    this.turboTimer = 4 + seed * 1.7;
    this.choices = {};
    this.input = { steer: 0, gas: 0, brake: 0, drift: false, driftPressed: false };
  }

  // A point `ahead` metres further along this kart's route, at lateral offset `lane`.
  _ahead(ahead, lane) {
    const T = this.track, k = this.kart, q = k.q, path = q.path;
    if (path !== T.main) {
      const s = q.s + ahead;
      if (s < path.length - 1) return path.pose(s, Math.max(-path.roadHalf + 1.5, Math.min(path.roadHalf - 1.5, lane * 0.5)));
      return T.main.pose(path.to + (s - path.length), lane);
    }
    const s = q.s;
    const lap = Math.floor(k.total / T.length);
    for (const b of T.paths) {
      if (b === T.main) continue;
      let before = b.from - s;
      if (before < -T.length / 2) before += T.length;
      if (before > 100 || before < -40) continue;
      const key = `${b.id}:${lap}`;
      this.choices[key] ??= this.prefer[b.id] ?? Math.random() < (b.secret ? 0.3 : 0.45) * this.skill;
      if (!this.choices[key]) continue;
      if (ahead <= before) return T.main.pose(s + ahead, (b.def.dFrom ?? 0) * (1 - Math.max(0, before - ahead) / 100) * 1.4);
      // committed but not yet over on the branch road: aim along the branch
      return b.pose(Math.min(b.length - 1, ahead - before), 0);
    }
    return T.main.pose(s + ahead, lane);
  }

  update(dt, playerTotal) {
    const k = this.kart, T = this.track, inp = this.input;
    this.time += dt;
    const s = k.q.s;
    const onMain = k.q.path === T.main;
    const look = 9 + Math.max(0, k.speed) * 0.45;
    let lane = Math.sin(this.time * 0.23 + this.seed * 2.1) * (T.roadHalf - 3) * 0.6 + (this.seed % 3 - 1) * 2;
    if (onMain) {
      for (const b of T.def.barrels || []) { // aim for the gap in barrel rows
        const ahead = b.s - s;
        if (ahead > 0 && ahead < 60) lane = b.gapD;
      }
      for (const p of T.def.puddles || []) { // and steer around glowing puddles
        const ahead = p.s - s;
        if (ahead > 0 && ahead < 35 && Math.abs(lane - p.d) < p.r + 2) lane = p.d + (lane > p.d ? 1 : -1) * (p.r + 2.5);
      }
      for (const b of T.def.bats || []) { // and dodge the vampires
        if (b.path) continue;
        const ahead = b.s - s, d = b.d || 0;
        if (ahead > 0 && ahead < 30 && Math.abs(lane - d) < 3.5) lane = d + (lane > d ? 1 : -1) * 4;
      }
    }
    const target = this._ahead(look, lane);
    const want = Math.atan2(target.x - k.pos.x, target.z - k.pos.z);
    const diff = wrapAngle(want - k.yaw);
    inp.steer = Math.max(-1, Math.min(1, -diff * 2.4));

    // corner speed from the heading change over the next stretch
    const a = this._ahead(10, lane), b = this._ahead(35 + k.speed * 0.6, lane);
    const bend = Math.abs(wrapAngle(b.yaw - a.yaw));
    const factor = 1 - Math.min(0.4, Math.max(0, bend - 0.25) * 0.55);
    // rubber band
    const gap = k.total - playerTotal;
    let band = 1;
    if (gap > 50) band = 0.93;
    else if (gap < -60) band = 1.08;
    k.speedScale = this.skill * band;
    const want2 = k.maxSpeed * k.speedScale * factor;
    inp.gas = k.speed < want2 ? 1 : 0.2;
    inp.brake = k.speed > want2 * 1.18 ? 1 : 0;

    // pretend mini-turbos so rivals feel like they drift too
    this.turboTimer -= dt;
    if (this.turboTimer <= 0) {
      this.turboTimer = 5 + Math.random() * 6;
      if (k.grounded && bend > 0.3 && Math.random() < this.skill) k.boost(0.6, 1.22);
    }

    // stuck? hop back onto the road
    if (Math.abs(k.speed) < 2 && k.sinkTime <= 0 && k.spinTime <= 0) this.stuck += dt; else this.stuck = 0;
    if (this.stuck > 2.5) { this.stuck = 0; k.respawn(k.q.mainS + 5); }
    return inp;
  }
}
