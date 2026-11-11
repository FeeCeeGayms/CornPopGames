// One race: grid, countdown, karts, pickups and hazards, laps and results.
import * as THREE from 'three';
import { Kart } from './kart.js';
import { AIController } from './ai.js';
import { Driver } from './driver.js';
import { buildKart, VEHICLES, combinedStats } from './karts/index.js';
import { CHARACTERS } from './characters.js';
import { glowSprite, barrelTexture } from './textures.js';
import { semlaGeometry, snowmanGeometry, sourdoughGeometry, trafficConeGeometry, garlicGeometry, pumpkinGeometry, pieGeometry, makeBat, makeVampire } from './props.js';

// What a track's hazards and pickups look like and say. Pripyat is the default;
// a track def's `theme` overrides any of these.
const THEME = {
  pickup: 'crystal', pickupText: 'ATOMIC BOOST!', pickupColor: [0.6, 1, 0.3], pickupGlow: '#9dff5a',
  puddle: 'sludge', puddleText: 'Toxic puddle!',
  barrel: 'barrel', barrelText: 'Radioactive!', barrelColor: [0.5, 1, 0.2],
  splashText: 'SPLASHED IN SLUDGE', splashColor: [0.45, 1, 0.2],
  boostColor: [0.6, 1, 0.3], dustColor: [0.55, 0.55, 0.52],
  radiation: true,
};


export class Race {
  constructor({ scene, track, character, vehicle, models, cc, laps, audio, fx, smoke }) {
    this.scene = scene;
    this.group = new THREE.Group(); // everything this race adds, removed on dispose
    scene.add(this.group);
    this.track = track;
    this.audio = audio;
    this.fx = fx;
    this.smoke = smoke;
    this.laps = laps;
    this.theme = { ...THEME, ...track.def.theme };
    this.state = 'countdown';
    this.countdown = 3.6;
    this.time = 0;
    this.karts = [];
    this.ai = [];
    this.messages = [];
    this.lapShown = 1;
    const L = track.length;

    // Grid: two staggered columns behind the line; the player starts mid-pack.
    const playerSlot = 3;
    // Rivals mix the other racers and vehicles, in mutated paint jobs.
    const others = CHARACTERS.filter((c) => c !== character);
    const vehicleIds = Object.keys(VEHICLES);
    const otherVehicles = vehicleIds.filter((v) => v !== vehicle);
    const used = new Map();
    for (let i = 0; i < 6; i++) {
      const isPlayer = i === playerSlot;
      const ri = i < playerSlot ? i : i - 1;
      const who = isPlayer ? character : (ri % 2 === 0 && others.length ? others[(ri >> 1) % others.length] : character);
      const veh = isPlayer ? vehicle : [...otherVehicles, vehicle][ri % vehicleIds.length];
      const n = used.get(who) || 0;
      used.set(who, n + 1);
      // the first appearance of another racer keeps their real name and paint
      const real = !isPlayer && who !== character && n === 0;
      const paints = VEHICLES[veh].rivalPaints;
      const opts = isPlayer || real ? {} : paints[ri % paints.length];
      const name = isPlayer || real ? who.name : who.rivalNames[(n - (who === character ? 0 : 1) + who.rivalNames.length) % who.rivalNames.length];
      const model = buildKart(veh, opts);
      const driver = new Driver(models[who.model], who);
      driver.seatIn(model);
      this.group.add(model.group);
      const kart = new Kart({ character: who, stats: combinedStats(who, veh), model, driver, track, cc, isPlayer, name });
      kart.vehicle = veh;
      kart.placeAt(L - 8 - i * 5.5, i % 2 ? 4 : -4);
      kart.slot = i;
      kart.color = isPlayer ? '#ffe14d' : '#' + new THREE.Color(VEHICLES[veh].color(opts)).getHexString();
      this.karts.push(kart);
      if (isPlayer) this.player = kart;
      else this.ai.push(new AIController(kart, track, { skill: 0.94 + ri * 0.012, seed: ri + 1 }));
    }
    for (const k of this.karts) k.model.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });

    this._buildPickups();
    this._buildBarrels();
    this._buildPuddles();
    this._buildCrates();
    this._buildBats();
    this.routeShown = new Set();
    this.rocket = { firstGas: null };
  }

  _buildPickups() {
    const T = this.track;
    this.pickups = [];
    const semla = ['semla', 'sourdough', 'garlic', 'pie'].includes(this.theme.pickup); // food pickups
    const geo = this.theme.pickup === 'pie' ? pieGeometry() : this.theme.pickup === 'sourdough' ? sourdoughGeometry() : this.theme.pickup === 'garlic' ? garlicGeometry() : semla ? semlaGeometry() : new THREE.OctahedronGeometry(0.75, 0);
    const mat = semla
      ? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.65, emissive: 0x402010, emissiveIntensity: 0.6 })
      : new THREE.MeshStandardMaterial({ color: 0x8dff5a, emissive: 0x3bdc1c, emissiveIntensity: 0.9, roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.92 });
    const ringMat = new THREE.MeshBasicMaterial({ color: this.theme.ringColor ?? (semla ? 0xff8ac0 : 0xffe14d) });
    const halo = new THREE.SpriteMaterial({ map: glowSprite(this.theme.pickupGlow), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: semla ? 0.55 : 1 });
    for (const row of T.def.pickups || []) {
      for (const d of row.spread || [-6, -2, 2, 6]) {
        const p = T.path(row.path).pose(row.s, d);
        const g = new THREE.Group();
        const gem = new THREE.Mesh(geo, mat);
        if (semla) { gem.scale.setScalar(1.25); gem.rotation.x = 0.35; }
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.06, 6, 24), ringMat);
        const sp = new THREE.Sprite(halo);
        sp.scale.set(3.2, 3.2, 1);
        g.add(gem, ring, sp);
        g.position.set(p.x, p.y + 1.3, p.z);
        this.group.add(g);
        this.pickups.push({ g, gem, ring, x: p.x, y: p.y + 1.3, z: p.z, timer: 0 });
      }
    }
  }

  // Wooden planks boarding up a secret entrance. They smash when you drive through.
  _buildCrates() {
    const T = this.track;
    this.crates = [];
    const wood = new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.9 });
    const geo = new THREE.BoxGeometry(1.2, 0.25, 0.12);
    for (const c of T.def.crates || []) {
      const path = T.path(c.path);
      const p = path.pose(c.s === 'portal' ? path.tunnelRange[0] - 4 : c.s);
      for (let row = 0; row < 9; row++) for (let col = -5; col <= 5; col++) {
        if ((row + col) % 3 === 0) continue; // gaps between planks
        const m = new THREE.Mesh(geo, wood);
        const d = col * 1.2;
        const x = p.x - p.tz * d, z = p.z + p.tx * d;
        m.position.set(x, p.y + 0.3 + row * 0.42, z);
        m.rotation.set(0, p.yaw + Math.PI / 2, (Math.random() - 0.5) * 0.3);
        m.castShadow = true;
        this.group.add(m);
        this.crates.push({ m, home: m.position.clone(), rot: m.rotation.clone(), vel: new THREE.Vector3(), knocked: 0, path });
      }
    }
  }

  _buildBarrels() {
    const T = this.track;
    this.barrels = [];
    const cones = this.theme.barrel === 'cone', pumpkins = this.theme.barrel === 'pumpkin';
    const snowmen = this.theme.barrel === 'snowman' || cones || pumpkins; // props standing on their base
    const geo = cones ? trafficConeGeometry() : pumpkins ? pumpkinGeometry() : snowmen ? snowmanGeometry() : new THREE.CylinderGeometry(0.45, 0.45, 1.2, 14);
    const mat = snowmen
      ? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, ...(pumpkins ? { emissive: 0x3a1800, emissiveIntensity: 0.6 } : {}) })
      : new THREE.MeshStandardMaterial({ map: barrelTexture(), roughness: 0.55, metalness: 0.3, emissive: 0x224400, emissiveIntensity: 0.3 });
    const lift = snowmen ? 0 : 0.6;
    for (const row of T.def.barrels || []) {
      for (let d = -T.roadHalf + 0.8; d <= T.roadHalf - 0.8; d += 1.3) {
        if (Math.abs(d - row.gapD) < 2.2) continue;
        const p = T.pose(row.s, d);
        const m = new THREE.Mesh(geo, mat);
        m.castShadow = true;
        m.position.set(p.x, p.y + lift, p.z);
        if (snowmen) m.rotation.y = p.yaw + Math.PI + (Math.random() - 0.5) * 0.6; // face the oncoming karts
        this.group.add(m);
        this.barrels.push({ m, home: m.position.clone(), rot: m.rotation.clone(), base: p.y, vel: new THREE.Vector3(), spin: new THREE.Vector3(), knocked: 0 });
      }
    }
  }

  _buildPuddles() {
    const T = this.track;
    this.puddles = [];
    const ice = this.theme.puddle === 'ice', oil = this.theme.puddle === 'oil', blood = this.theme.puddle === 'blood';
    const mat = blood
      ? new THREE.MeshBasicMaterial({ map: glowSprite('#8a0008'), transparent: true, depthWrite: false, opacity: 0.55 })
      : ice
      ? new THREE.MeshBasicMaterial({ map: glowSprite('#bfe8ff'), transparent: true, depthWrite: false, opacity: 0.7 })
      : oil ? new THREE.MeshBasicMaterial({ map: glowSprite('#7a5cff'), transparent: true, depthWrite: false, opacity: 0.45 })
      : new THREE.MeshBasicMaterial({ map: glowSprite('#6dff2a'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const core = blood
      ? new THREE.MeshStandardMaterial({ color: 0x6a0006, emissive: 0x200000, roughness: 0.03, metalness: 0.3, envMapIntensity: 2.2 })
      : ice
      ? new THREE.MeshStandardMaterial({ color: 0xcdeeff, emissive: 0x5a8cb0, emissiveIntensity: 0.35, roughness: 0.04, metalness: 0.2, envMapIntensity: 2 })
      : oil ? new THREE.MeshStandardMaterial({ color: 0x0c0b12, emissive: 0x2a1a4a, emissiveIntensity: 0.4, roughness: 0.02, metalness: 0.6, envMapIntensity: 2.5 })
      : new THREE.MeshStandardMaterial({ color: 0x45d61a, emissive: 0x2a9a10, emissiveIntensity: 0.8, roughness: 0.1 });
    for (const pd of T.def.puddles || []) {
      const p = T.pose(pd.s, pd.d);
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(pd.r * 3.2, pd.r * 3.2), mat);
      glow.rotation.x = -Math.PI / 2;
      glow.position.set(p.x, p.y + 0.06, p.z);
      const blob = new THREE.Mesh(new THREE.CircleGeometry(pd.r, 20), core);
      blob.rotation.x = -Math.PI / 2;
      blob.scale.set(1, 0.75, 1);
      blob.position.set(p.x, p.y + 0.05, p.z);
      this.group.add(glow, blob);
      this.puddles.push({ x: p.x, z: p.z, y: p.y, r: pd.r, glow, ice: ice || oil || blood }); // only glowing puddles pulse
    }
  }

  // Swarms of bats circling over the road. As the player closes in, half the swarm
  // fluttering past the camera and the rest gather into a vampire standing in the
  // lane, who spins out anyone who drives into him. Once the player is gone he
  // turns back into bats.
  _buildBats() {
    const T = this.track;
    this.swarms = [];
    for (const b of T.def.bats || []) {
      const path = T.path(b.path);
      const p = path.pose(b.s, b.d || 0);
      const bats = [];
      for (let i = 0; i < 22; i++) {
        const m = makeBat();
        m.scale.setScalar(3.5 + Math.random() * 2);
        this.group.add(m);
        bats.push({ m, a: Math.random() * 6.28, r: 1 + Math.random() * (T.roadHalf + 1), h: 1.2 + Math.random() * 3.4, w: (0.8 + Math.random() * 0.8) * (i % 2 ? 1 : -1), flap: Math.random() * 6, scatter: i % 2 === 0, off: new THREE.Vector3() });
      }
      const vamp = makeVampire();
      vamp.position.set(p.x, p.y, p.z);
      vamp.rotation.y = p.yaw + Math.PI; // facing the oncoming karts
      vamp.visible = false;
      this.group.add(vamp);
      this.swarms.push({ x: p.x, y: p.y, z: p.z, s: b.s, d: b.d || 0, path, bats, vamp, t: 0, hit: 0, tx: p.tx, tz: p.tz });
    }
  }

  _bats(dt) {
    const P = this.player;
    for (const sw of this.swarms) {
      const dx = P.pos.x - sw.x, dz = P.pos.z - sw.z;
      const dist = Math.hypot(dx, dz);
      const ahead = dx * sw.tx + dz * sw.tz < 0; // the player hasn't passed it yet
      sw.hit = Math.max(0, sw.hit - dt);
      const want = ahead && dist < 32 && sw.hit <= 0 ? 1 : 0;
      const was = sw.t;
      sw.t += Math.sign(want - sw.t) * Math.min(Math.abs(want - sw.t), dt * 2.2);
      if (was < 0.5 && sw.t >= 0.5 || was >= 0.5 && sw.t < 0.5) { // poof
        for (let i = 0; i < 26; i++) this.smoke.emit(sw.x, sw.y + 1.2, sw.z, (Math.random() - 0.5) * 5, Math.random() * 3, (Math.random() - 0.5) * 5, { life: 0.8, size: 0.8, size1: 2.4, color: [0.25, 0.18, 0.28] });
        if (sw.t >= 0.5 && dist < 40) { this.audio.play('vampire'); this.say('VAMPIRE!', 'bad'); }
      }
      const vs = Math.max(0, (sw.t - 0.4) / 0.6);
      sw.vamp.visible = vs > 0.01;
      sw.vamp.scale.setScalar((0.2 + vs * 0.8) * 1.7); // a towering count
      sw.vamp.position.y = sw.y + Math.sin(this.time * 2.4 + sw.x) * 0.05;
      for (const b of sw.bats) {
        b.a += dt * b.w;
        b.flap += dt * 18;
        let x = sw.x + Math.cos(b.a) * b.r, y = sw.y + b.h + Math.sin(b.a * 2.3) * 0.6, z = sw.z + Math.sin(b.a) * b.r;
        if (b.scatter) { // fly at the oncoming kart, then up and away
          const k = Math.min(1, sw.t * 1.4);
          x += (P.pos.x - x) * k * 0.7; z += (P.pos.z - z) * k * 0.7; y += (P.pos.y + 2.2 - y) * k * 0.7 + k * k * 4;
          b.m.visible = sw.t < 0.98;
        } else { // gather into the vampire
          const k = Math.min(1, sw.t * 1.8);
          x += (sw.x - x) * k; z += (sw.z - z) * k; y += (sw.y + 2.6 - y) * k;
          b.m.visible = sw.t < 0.5;
        }
        const px = b.m.position.x, pz = b.m.position.z;
        b.m.position.set(x, y, z);
        b.m.rotation.y = Math.atan2(x - px, z - pz);
        const f = Math.sin(b.flap) * 0.9;
        b.m.userData.wings[0].rotation.z = f; b.m.userData.wings[1].rotation.z = -f;
      }
      if (sw.t < 0.6) continue;
      for (const k of this.karts) {
        const ex = k.pos.x - sw.x, ez = k.pos.z - sw.z;
        if (ex * ex + ez * ez < 2.2 * 2.2 && Math.abs(k.pos.y - sw.y) < 2) {
          if (k.spinOut(1.1) && k.isPlayer) { this.say(this.theme.vampireText || 'VAMPIRE BITE!', 'bad'); this.audio.play('barrel'); }
          sw.hit = 5; // burst back into bats and fly off
        }
      }
    }
  }

  say(text, cls = '') { this.messages.push({ text, cls }); }

  update(dt, playerInput) {
    const T = this.track, P = this.player;
    const frozen = this.state === 'countdown';
    if (this.state === 'countdown') {
      const before = Math.ceil(this.countdown);
      this.countdown -= dt;
      const after = Math.ceil(this.countdown);
      if (after !== before && after > 0 && after <= 3) { this.audio.play('beep'); this.say(String(after), 'count'); }
      if (playerInput.gas && this.rocket.firstGas === null) this.rocket.firstGas = this.countdown;
      if (!playerInput.gas) this.rocket.firstGas = null;
      if (this.countdown <= 0) {
        this.state = 'racing';
        this.audio.play('go');
        this.say('GO!', 'count go');
        const fg = this.rocket.firstGas;
        if (fg !== null && fg < 0.75) { P.boost(1.1, 1.35); this.say('ROCKET START!', 'good'); }
        else if (fg !== null && fg > 1.6) { P.stall = 1.0; this.say('Flooded the engine!', 'bad'); }
        for (const a of this.ai) if (Math.random() < 0.5) a.kart.boost(0.6, 1.2);
      }
    } else if (this.state === 'racing' || this.state === 'finished') {
      this.time += dt;
    }

    // Player
    let inp = playerInput;
    if (P.stall > 0) { P.stall -= dt; inp = { ...playerInput, gas: 0 }; if (Math.random() < 0.5) this._smokePuff(P); }
    if (this.autopilot) inp = this.autopilot.update(dt, P.total);
    if (this.parked) { P.speed = 0; P.update(dt, inp, true); } else P.update(dt, inp, frozen);
    for (const a of this.ai) a.kart.update(dt, a.update(dt, P.total), frozen);

    this._collideKarts();
    this._items(dt);
    if (this.swarms.length) this._bats(dt);
    this._laps();
    this._effects(dt);
  }

  _collideKarts() {
    const ks = this.karts;
    for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) {
      const a = ks[i], b = ks[j];
      if (a.sinkTime > 0 || b.sinkTime > 0) continue;
      const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, dy = b.pos.y - a.pos.y;
      const min = a.radius + b.radius;
      const d2 = dx * dx + dz * dz;
      if (d2 > min * min || Math.abs(dy) > 1.2) continue;
      const d = Math.sqrt(d2) || 0.01, push = (min - d);
      const wa = b.weight / (a.weight + b.weight), wb = 1 - wa;
      a.pos.x -= (dx / d) * push * wa; a.pos.z -= (dz / d) * push * wa;
      b.pos.x += (dx / d) * push * wb; b.pos.z += (dz / d) * push * wb;
      const rel = Math.abs(a.speed - b.speed);
      if (rel > 4) {
        const avg = (a.speed + b.speed) / 2;
        a.speed = a.speed * 0.7 + avg * 0.3; b.speed = b.speed * 0.7 + avg * 0.3;
      }
      if (a.isPlayer || b.isPlayer) this.audio.play('bump', 6);
    }
  }

  _items(dt) {
    const T = this.track;
    for (const p of this.pickups) {
      if (p.timer > 0) {
        p.timer -= dt;
        p.g.visible = p.timer <= 0;
        if (p.timer > 0) p.g.scale.setScalar(1 - Math.min(1, p.timer / 3.5));
        else p.g.scale.setScalar(1);
        continue;
      }
      p.gem.rotation.y += dt * 2;
      p.ring.rotation.x += dt * 1.5;
      p.g.position.y = p.y + Math.sin(this.time * 3 + p.x) * 0.2;
      for (const k of this.karts) {
        const dx = k.pos.x - p.x, dz = k.pos.z - p.z, dy = k.pos.y + 0.6 - p.g.position.y;
        if (dx * dx + dz * dz < 2.2 * 2.2 && Math.abs(dy) < 2.6 && k.sinkTime <= 0) {
          p.timer = 4;
          k.boost(1.8, 1.42);
          if (k.isPlayer) { this.audio.play('pickup'); this.say(this.theme.pickupText, 'good'); }
          for (let i = 0; i < 20; i++) this.fx.emit(p.x, p.g.position.y, p.z, (Math.random() - 0.5) * 10, Math.random() * 8, (Math.random() - 0.5) * 10, { life: 0.6, size: 0.8, color: i % 3 ? this.theme.pickupColor : [1, 1, 1], gravity: 12 });
          break;
        }
      }
    }
    // boost pads
    for (const k of this.karts) {
      if (!k.grounded) continue;
      for (const pad of T.pads) {
        const ds = k.q.s - pad.s;
        if (k.q.path === pad.path && ds >= 0 && ds <= 8 && Math.abs(k.q.d - pad.d) < 2.6 && k.boostTime < 0.8) {
          k.boost(1.0, 1.36);
          if (k.isPlayer) this.say('BOOST PAD!', 'good');
        }
      }
    }
    // barrels
    for (const b of this.barrels) {
      if (b.knocked > 0) {
        b.knocked -= dt;
        b.vel.y -= 20 * dt;
        b.m.position.addScaledVector(b.vel, dt);
        b.m.rotation.x += b.spin.x * dt; b.m.rotation.z += b.spin.z * dt;
        if (b.knocked <= 0) { b.m.position.copy(b.home); b.m.rotation.copy(b.rot); }
        continue;
      }
      for (const k of this.karts) {
        const dx = k.pos.x - b.home.x, dz = k.pos.z - b.home.z;
        if (dx * dx + dz * dz < 1.3 * 1.3 && k.pos.y < b.base + 1.1) {
          b.knocked = 6;
          const f = Math.max(8, k.speed);
          b.vel.set(Math.sin(k.yaw) * f * 0.8 + (Math.random() - 0.5) * 4, 7 + Math.random() * 4, Math.cos(k.yaw) * f * 0.8 + (Math.random() - 0.5) * 4);
          b.spin.set((Math.random() - 0.5) * 12, 0, (Math.random() - 0.5) * 12);
          if (k.spinOut(1.1) && k.isPlayer) this.say(this.theme.barrelText, 'bad');
          if (k.isPlayer) this.audio.play('barrel');
          for (let i = 0; i < 14; i++) this.fx.emit(b.home.x, b.home.y + 0.6, b.home.z, (Math.random() - 0.5) * 8, Math.random() * 6, (Math.random() - 0.5) * 8, { life: 0.8, size: 0.7, color: this.theme.barrelColor, gravity: 10 });
        }
      }
    }
    // planks
    for (const c of this.crates) {
      if (c.knocked > 0) {
        c.knocked -= dt;
        c.vel.y -= 20 * dt;
        c.m.position.addScaledVector(c.vel, dt);
        c.m.rotation.x += dt * 8; c.m.rotation.z += dt * 5;
        if (c.knocked <= 0) { c.m.position.copy(c.home); c.m.rotation.copy(c.rot); }
        continue;
      }
      for (const k of this.karts) {
        const dx = k.pos.x - c.home.x, dz = k.pos.z - c.home.z;
        if (dx * dx + dz * dz < 1.6 * 1.6 && Math.abs(k.pos.y + 0.8 - c.home.y) < 1.6) {
          c.knocked = 8;
          const f = Math.max(10, k.speed);
          c.vel.set(Math.sin(k.yaw) * f * 0.7 + (Math.random() - 0.5) * 6, 4 + Math.random() * 6, Math.cos(k.yaw) * f * 0.7 + (Math.random() - 0.5) * 6);
          if (k.isPlayer) this.audio.play('crate');
          k.speed *= 0.97;
        }
      }
    }
    // route announcements
    const P = this.player;
    if (P.q.path !== this.track.main && P.q.s > 25) { // committed to the branch, not just brushing its mouth
      const key = P.q.path.id + Math.floor(P.total / this.track.length);
      if (!this.routeShown.has(key)) {
        this.routeShown.add(key);
        this.say(P.q.path.def?.call ?? (P.q.path.secret ? 'SECRET TUNNEL!' : 'SHORTCUT!'), 'good');
        this.audio.play('secret');
      }
    }
    // puddles
    for (const pd of this.puddles) {
      if (!pd.ice) pd.glow.material.opacity = 0.6 + Math.sin(this.time * 4 + pd.x) * 0.25;
      for (const k of this.karts) {
        const dx = k.pos.x - pd.x, dz = k.pos.z - pd.z;
        if (k.grounded && dx * dx + dz * dz < pd.r * pd.r && k.spinOut(0.9)) {
          if (k.isPlayer) this.say(this.theme.puddleText, 'bad');
          if (pd.ice) for (let i = 0; i < 10; i++) this.smoke.emit(k.pos.x, k.pos.y + 0.2, k.pos.z, (Math.random() - 0.5) * 4, 1 + Math.random() * 2, (Math.random() - 0.5) * 4, { life: 0.7, size: 0.6, size1: 1.6, color: [0.92, 0.96, 1] });
        }
      }
    }
  }

  _laps() {
    const L = this.track.length;
    for (const k of this.karts) {
      if (k.finished) continue;
      const lap = Math.floor(k.total / L) + 1;
      if (k.isPlayer && lap > this.lapShown && lap <= this.laps) {
        this.lapShown = lap;
        this.audio.play('lap');
        this.say(lap === this.laps ? 'FINAL LAP!' : `LAP ${lap}`, 'count');
      }
      if (k.total >= this.laps * L) {
        k.finished = true;
        k.finishTime = this.time;
        if (k.isPlayer) {
          this.autopilot = new AIController(k, this.track, { skill: 0.75, seed: 7 }); // victory lap
          this.state = 'finished';
          this.finishWait = 3.5;
          this.audio.play('finish');
          this.say(`FINISH! ${ordinal(this.positionOf(k))}`, 'count go');
        }
      }
    }
  }

  standings() {
    return [...this.karts].sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished !== b.finished) return a.finished ? -1 : 1;
      return b.total - a.total;
    });
  }

  positionOf(k) { return this.standings().indexOf(k) + 1; }

  // Fill in times for rivals still racing when the player finishes.
  results() {
    const L = this.track.length;
    return this.standings().map((k) => {
      let t = k.finishTime;
      if (!k.finished) t = this.time + (this.laps * L - k.total) / Math.max(15, k.maxSpeed * 0.85);
      return { name: k.name, time: t, player: k.isPlayer, estimated: !k.finished };
    }).sort((a, b) => a.time - b.time);
  }

  radiationLevel() {
    if (!this.theme.radiation) return 0;
    const P = this.player.pos;
    let best = 1e9;
    for (const pd of this.puddles) best = Math.min(best, Math.hypot(P.x - pd.x, P.z - pd.z));
    for (const b of this.barrels) best = Math.min(best, Math.hypot(P.x - b.home.x, P.z - b.home.z));
    const T = this.track;
    for (const r of T.ramps) if (r.pit) {
      const p = r.path.pose(r.s + r.len + r.pit / 2);
      best = Math.min(best, Math.hypot(P.x - p.x, P.z - p.z) - 8);
    }
    return Math.max(0, 1 - best / 45);
  }

  _smokePuff(k) {
    const v = new THREE.Vector3();
    k.rearWheelWorld(Math.random() < 0.5 ? -1 : 1, v);
    this.smoke.emit(v.x, v.y + 0.2, v.z, (Math.random() - 0.5), 1 + Math.random(), (Math.random() - 0.5), { life: 0.9, size: 0.8, size1: 2.2, color: this.theme.dustColor });
  }

  _effects(dt) {
    const v = new THREE.Vector3();
    for (const k of this.karts) {
      const near = k.pos.distanceToSquared(this.player.pos) < 120 * 120;
      for (const e of k.events) {
        if (k.isPlayer) {
          if (e.type === 'boost') this.audio.play('boost');
          if (e.type === 'hop') this.audio.play('hop');
          if (e.type === 'land') { this.audio.play('land'); if (e.air > 1.0) this.say(`BIG AIR ${e.air.toFixed(1)}s`, 'good'); }
          if (e.type === 'bump') this.audio.play('bump', e.strength);
          if (e.type === 'spin') this.audio.play('spin');
          if (e.type === 'splash') { this.audio.play('splash'); this.say(this.theme.splashText, 'bad'); }
          if (e.type === 'driftLevel') this.audio.play(e.level === 2 ? 'drift2' : 'drift1');
          if (e.type === 'miniturbo') { this.audio.play('turbo'); this.say(e.level === 2 ? 'SUPER MINI-TURBO' : 'MINI-TURBO', 'good'); }
        }
        if (e.type === 'splash' && near) {
          for (let i = 0; i < 50; i++) this.fx.emit(k.pos.x, k.pos.y + 0.3, k.pos.z, (Math.random() - 0.5) * 9, 4 + Math.random() * 9, (Math.random() - 0.5) * 9, { life: 1.1, size: 1.0, color: this.theme.splashColor, gravity: 18 });
        }
        if (e.type === 'land' && near) for (let i = 0; i < 8; i++) this._smokePuff(k);
      }
      k.events.length = 0;
      if (!near) continue;
      // drift sparks
      if (k.drift.on && k.grounded) {
        const col = k.drift.level === 2 ? [1, 0.55, 0.1] : k.drift.level === 1 ? [0.3, 0.6, 1] : [1, 1, 0.8];
        for (const side of [-1, 1]) {
          k.rearWheelWorld(side, v);
          for (let i = 0; i < (k.drift.level ? 2 : 1); i++) this.fx.emit(v.x, v.y + 0.1, v.z, (Math.random() - 0.5) * 3, 1 + Math.random() * 3, (Math.random() - 0.5) * 3, { life: 0.25, size: k.drift.level ? 0.55 : 0.3, color: col, gravity: 10 });
        }
      }
      // dust off-road
      if (k.surface === 'dirt' && k.grounded && Math.abs(k.speed) > 6 && Math.random() < 0.6) this._smokePuff(k);
      // boost exhaust glow
      if (k.boostTime > 0) {
        for (const ex of k.model.exhausts) {
          v.copy(ex); k.model.body.localToWorld(v);
          this.fx.emit(v.x, v.y, v.z, (Math.random() - 0.5) * 2 - Math.sin(k.yaw) * 4, Math.random() * 2, (Math.random() - 0.5) * 2 - Math.cos(k.yaw) * 4, { life: 0.3, size: 0.6, size1: 0.1, color: this.theme.boostColor });
        }
      }
    }
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  }
}

export function ordinal(n) {
  return n + (['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : n % 10] || 'th');
}
