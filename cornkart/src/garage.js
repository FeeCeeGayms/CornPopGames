// The garage the game opens in. Step 1 shows the racer standing on the turntable,
// step 2 rolls the chosen kart in behind them, and step 3 turns to the map board
// on the back wall to show the chosen track.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { concreteTexture, signTexture, cornkartBadgeTexture, rng } from './textures.js';
import { buildKart } from './karts/index.js';
import { Driver } from './driver.js';
import { Track } from './track.js';

function canvasTex(w, h, draw, repeat = false) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function brickTexture() {
  const r = rng(4);
  return canvasTex(256, 256, (g) => {
    g.fillStyle = '#8f8a80'; g.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 16; row++) for (let col = -1; col < 5; col++) {
      const x = col * 64 + (row % 2) * 32 + 2, y = row * 16 + 2;
      const v = 120 + r() * 40;
      g.fillStyle = `rgb(${v + 40},${v - 10},${v - 30})`;
      g.fillRect(x, y, 60, 12);
    }
    g.fillStyle = 'rgba(230,226,215,0.55)'; g.fillRect(0, 150, 256, 106); // painted lower half
    g.fillStyle = 'rgba(40,120,60,0.85)'; g.fillRect(0, 236, 256, 20);
  }, true);
}

function floorTexture() {
  const r = rng(9);
  return canvasTex(512, 512, (g) => {
    g.fillStyle = '#7c7b76'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 20000; i++) { const v = 90 + r() * 70; g.fillStyle = `rgba(${v},${v},${v - 4},0.35)`; g.fillRect(r() * 512, r() * 512, 2, 2); }
    for (let i = 0; i < 14; i++) { // oil stains
      const x = r() * 512, y = r() * 512, rad = 10 + r() * 40;
      const grad = g.createRadialGradient(x, y, 0, x, y, rad);
      grad.addColorStop(0, 'rgba(20,20,18,0.45)'); grad.addColorStop(1, 'rgba(20,20,18,0)');
      g.fillStyle = grad; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    g.strokeStyle = 'rgba(40,40,36,0.6)'; g.lineWidth = 2;
    for (let x = 0; x <= 512; x += 256) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); g.beginPath(); g.moveTo(0, x); g.lineTo(512, x); g.stroke(); }
  }, true);
}

function pegboardTexture() {
  return canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#b08455'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(60,40,20,0.7)';
    for (let x = 8; x < w; x += 16) for (let y = 8; y < h; y += 16) { g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); }
    // painted tool outlines with the tools hanging in them
    const tools = [
      (x) => { g.fillRect(x - 6, 40, 12, 140); g.beginPath(); g.arc(x, 40, 22, 0, 7); g.fill(); }, // wrench
      (x) => { g.fillRect(x - 5, 60, 10, 110); g.fillRect(x - 22, 40, 44, 26); }, // hammer
      (x) => { g.fillRect(x - 4, 50, 8, 90); g.fillRect(x - 10, 140, 20, 50); }, // screwdriver
      (x) => { g.beginPath(); g.moveTo(x - 20, 180); g.lineTo(x, 50); g.lineTo(x + 20, 180); g.lineWidth = 10; g.stroke(); }, // pliers
    ];
    const cols = ['#c8281e', '#2a6fd6', '#2d2d2d', '#f0c22a'];
    for (let i = 0; i < 9; i++) {
      g.fillStyle = cols[i % 4]; g.strokeStyle = cols[i % 4];
      tools[i % 4](40 + i * 54);
    }
  });
}

// Map of a track for the board on the back wall: main loop, shortcuts dashed.
const previewTracks = new Map();
function trackMapTexture(def) {
  if (!previewTracks.has(def.id)) previewTracks.set(def.id, new Track(def));
  const T = previewTracks.get(def.id);
  return canvasTex(1024, 768, (g, w, h) => {
    g.fillStyle = '#1d3a2a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.06)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const p of T.paths) for (let i = 0; i < p.N; i++) { minX = Math.min(minX, p.cx[i]); maxX = Math.max(maxX, p.cx[i]); minZ = Math.min(minZ, p.cz[i]); maxZ = Math.max(maxZ, p.cz[i]); }
    const sc = Math.min((w - 160) / (maxX - minX), (h - 230) / (maxZ - minZ));
    const P = (p, i) => [w / 2 + (p.cx[i] - (minX + maxX) / 2) * sc, 150 + (h - 210) / 2 + (p.cz[i] - (minZ + maxZ) / 2) * sc];
    const path = (p, closed) => { g.beginPath(); for (let i = 0; i < p.N; i++) { const [x, y] = P(p, i); i ? g.lineTo(x, y) : g.moveTo(x, y); } if (closed) g.closePath(); g.stroke(); };
    g.lineJoin = g.lineCap = 'round';
    g.strokeStyle = '#0b1a12'; g.lineWidth = 26; path(T.main, true);
    g.strokeStyle = '#f4efd8'; g.lineWidth = 14; path(T.main, true);
    for (const b of T.paths.slice(1)) {
      g.setLineDash(b.secret ? [14, 12] : []);
      g.strokeStyle = b.secret ? '#ff7ab8' : '#f2c500'; g.lineWidth = 8; path(b, false);
    }
    g.setLineDash([]);
    for (const r of T.ramps) if (r.pit) {
      const [x, y] = P(r.path, Math.min(r.path.N - 1, Math.floor((r.s + r.len) / r.path.ds)));
      g.fillStyle = '#5bb8ff'; g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill();
    }
    const [sx, sy] = P(T.main, 0);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#111' : '#fff'; g.fillRect(sx - 16 + i * 8, sy - 8 + j * 8, 8, 8); }
    g.fillStyle = '#f2c500'; g.font = 'bold 64px Arial Black, Impact, sans-serif'; g.textAlign = 'left';
    g.fillText(def.name.toUpperCase(), 40, 84);
    g.fillStyle = 'rgba(244,239,216,0.75)'; g.font = 'bold 30px Arial, sans-serif';
    g.fillText(def.region, 42, 126);
    g.font = 'bold 26px Arial, sans-serif'; g.textAlign = 'right';
    g.fillStyle = '#f2c500'; g.fillText('━ shortcut', w - 40, h - 28);
    g.fillStyle = '#ff7ab8'; g.fillText('╍ secret tunnel', w - 230, h - 28);
  });
}

// Camera framing for each step: [position, look-at].
const VIEWS = {
  racer: [[0.2, 1.25, 6.2], [0, 0.95, 2.4]],
  vehicle: [[-1.6, 2.0, 7.6], [0.2, 0.8, 1.0]],
  track: [[5.2, 3.1, 4.2], [4.9, 3.0, -6.9]],
};

export class Garage {
  constructor(renderer, models) {
    this.models = models;
    const scene = (this.scene = new THREE.Scene());
    scene.background = new THREE.Color(0x0f1110);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.35;
    pmrem.dispose();
    scene.fog = new THREE.Fog(0x0f1110, 18, 40);
    this._buildRoom();
    this.step = 'racer';
    this.cam = { pos: new THREE.Vector3(...VIEWS.racer[0]), look: new THREE.Vector3(...VIEWS.racer[1]) };
    this.t = 0;
    this.kartIn = 0; // 0 = parked off to the side, 1 = on the turntable
  }

  _buildRoom() {
    const s = this.scene;
    const W = 9, D0 = -7, D1 = 8, H = 6;
    const ft = floorTexture(); ft.repeat.set(3, 3);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, D1 - D0), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.55, metalness: 0.05 }));
    floor.rotation.x = -Math.PI / 2; floor.position.z = (D0 + D1) / 2;
    floor.receiveShadow = true;
    s.add(floor);
    const bt = brickTexture(); bt.repeat.set(4, 1.5);
    const wallMat = new THREE.MeshStandardMaterial({ map: bt, roughness: 0.95 });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, H), wallMat);
    back.position.set(0, H / 2, D0); back.receiveShadow = true;
    const bt2 = bt.clone(); bt2.repeat.set(3.5, 1.5); bt2.needsUpdate = true;
    const sideMat = new THREE.MeshStandardMaterial({ map: bt2, roughness: 0.95 });
    for (const side of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(D1 - D0, H), sideMat);
      wall.position.set(side * W, H / 2, (D0 + D1) / 2); wall.rotation.y = -side * Math.PI / 2; wall.receiveShadow = true;
      s.add(wall);
    }
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, D1 - D0), new THREE.MeshStandardMaterial({ color: 0x3a3b38, roughness: 1 }));
    ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, (D0 + D1) / 2);
    s.add(back, ceil);
    // roller door rolled up over the open front
    const door = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, W * 2, 16), new THREE.MeshStandardMaterial({ color: 0x9aa0a4, metalness: 0.6, roughness: 0.4 }));
    door.rotation.z = Math.PI / 2; door.position.set(0, H - 0.45, D1 - 0.4);
    s.add(door);

    // lights: three fluorescent tubes and a spot on the turntable
    s.add(new THREE.HemisphereLight(0xfff4e0, 0x403a30, 0.7));
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6e2, emissiveIntensity: 2.5 });
    for (const z of [-4, 0, 4]) {
      const tube = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 0.25), tubeMat);
      tube.position.set(0, H - 0.25, z);
      const light = new THREE.PointLight(0xfff2dc, 9, 14, 1.4);
      light.position.set(0, H - 0.6, z);
      s.add(tube, light);
    }
    const spot = new THREE.SpotLight(0xffe7c2, 30, 20, 0.6, 0.5, 1.2);
    spot.position.set(-1.5, H - 0.3, 5.5);
    spot.target.position.set(0, 0, 1);
    spot.castShadow = true;
    spot.shadow.mapSize.setScalar(1024);
    spot.shadow.bias = -0.0005;
    s.add(spot, spot.target);

    // turntable with a hazard-striped rim and painted bay lines
    const tt = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.1, 48), new THREE.MeshStandardMaterial({ color: 0x2d2f2e, metalness: 0.7, roughness: 0.35 }));
    disc.position.y = 0.05; disc.receiveShadow = true;
    const rimTex = canvasTex(512, 32, (g, w, h) => { for (let x = -32; x < w; x += 32) { g.fillStyle = '#f2c500'; g.fillRect(0, 0, 0, 0); g.beginPath(); g.moveTo(x, h); g.lineTo(x + 16, 0); g.lineTo(x + 32, 0); g.lineTo(x + 16, h); g.fill(); } }, true);
    rimTex.repeat.set(4, 1);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(2.85, 2.85, 0.1, 48, 1, true), new THREE.MeshStandardMaterial({ map: rimTex, color: 0xffffff, roughness: 0.6 }));
    rim.position.y = 0.05;
    tt.add(disc, rim);
    tt.position.z = 0.6;
    s.add(tt);
    this.turntable = tt;
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xf2c500, roughness: 0.8 });
    for (const x of [-4.2, 4.2]) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 9), lineMat);
      line.rotation.x = -Math.PI / 2; line.position.set(x, 0.01, 1.5);
      s.add(line);
    }

    // back wall: banner and badge, and the track map board
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.2), new THREE.MeshStandardMaterial({ map: signTexture('CORNKART GARAGE', { w: 1024, h: 136, bg: '#1f6b2a', fg: '#ffe14d', font: 'bold 92px Arial Black, Impact, sans-serif' }), roughness: 0.7 }));
    banner.position.set(-3.6, 4.9, D0 + 0.03);
    const badge = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.95), new THREE.MeshStandardMaterial({ map: cornkartBadgeTexture(), transparent: true, roughness: 0.6 }));
    badge.position.set(-3.6, 3.1, D0 + 0.03);
    s.add(banner, badge);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(5.6, 4.3, 0.12), new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.8 }));
    frame.position.set(3.6, 3.0, D0 + 0.06);
    this.board = new THREE.Mesh(new THREE.PlaneGeometry(5.3, 3.975), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75, emissive: 0xffffff, emissiveIntensity: 0.18 }));
    this.board.position.set(3.6, 3.0, D0 + 0.13);
    s.add(frame, this.board);

    // left wall: pegboard with tools over a workbench and a red tool chest
    const peg = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.5), new THREE.MeshStandardMaterial({ map: pegboardTexture(), roughness: 0.9 }));
    peg.position.set(-W + 0.03, 2.9, -1.5); peg.rotation.y = Math.PI / 2;
    s.add(peg);
    const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a32, roughness: 0.8 });
    const steel = new THREE.MeshStandardMaterial({ color: 0x55595c, metalness: 0.6, roughness: 0.45 });
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 6.5), wood);
    bench.position.set(-W + 0.7, 1.0, -1.5); bench.castShadow = bench.receiveShadow = true;
    s.add(bench);
    for (const z of [-4.5, 1.5]) for (const x of [-W + 0.2, -W + 1.2]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 0.1), steel); leg.position.set(x, 0.5, z); s.add(leg); }
    const chestTex = canvasTex(128, 256, (g) => { g.fillStyle = '#c8281e'; g.fillRect(0, 0, 128, 256); g.fillStyle = '#7a120c'; for (let y = 24; y < 256; y += 38) g.fillRect(4, y, 120, 3); g.fillStyle = '#d8d8d8'; for (let y = 8; y < 256; y += 38) g.fillRect(44, y, 40, 6); });
    const chest = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.7, 1.6), new THREE.MeshStandardMaterial({ map: chestTex, roughness: 0.4, metalness: 0.3 }));
    chest.position.set(-W + 0.6, 0.85, 3.1); chest.rotation.y = Math.PI / 2; chest.castShadow = true;
    s.add(chest);

    // right wall: shelves of paint cans, a trophy shelf, stacked tyres and oil drums
    for (const y of [1.2, 2.3, 3.4]) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 5), steel);
      shelf.position.set(W - 0.45, y, -3.2); s.add(shelf);
      const r = rng(Math.round(y * 10));
      for (let i = 0; i < 7; i++) {
        const can = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.36, 12), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(r(), 0.6, 0.5), roughness: 0.5, metalness: 0.3 }));
        can.position.set(W - 0.45, y + 0.22, -5.3 + i * 0.65 + r() * 0.1); s.add(can);
      }
    }
    for (const x of [-0.6, 0.6]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.5, 0.06), steel); post.position.set(W - 0.45 + x * 0.6, 1.75, -0.7); s.add(post); }
    const gold = new THREE.MeshStandardMaterial({ color: 0xe0b23a, metalness: 0.9, roughness: 0.25 });
    const cupPts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; cupPts.push(new THREE.Vector2(t < 0.15 ? 0.22 : t < 0.45 ? 0.05 : 0.08 + Math.sin((t - 0.45) / 0.55 * Math.PI * 0.5) * 0.2, t * 0.7)); }
    const cupGeo = new THREE.LatheGeometry(cupPts, 16);
    const trophyShelf = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 2.6), wood);
    trophyShelf.position.set(W - 0.4, 4.4, 2.5); s.add(trophyShelf);
    for (let i = 0; i < 3; i++) { const cup = new THREE.Mesh(cupGeo, gold); cup.scale.setScalar(1 - i * 0.12); cup.position.set(W - 0.4, 4.44, 1.6 + i * 0.9); s.add(cup); }
    const rubber = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.9 });
    const tyre = new THREE.TorusGeometry(0.42, 0.18, 10, 24);
    for (const [x, z, n] of [[W - 1.0, 3.6, 4], [-W + 1.0, -5.6, 3], [W - 1.0, 5.0, 2]]) {
      for (let i = 0; i < n; i++) { const t = new THREE.Mesh(tyre, rubber); t.rotation.x = Math.PI / 2; t.position.set(x, 0.18 + i * 0.36, z); t.castShadow = true; s.add(t); }
    }
    for (const [x, z, c] of [[-W + 0.8, 5.6, 0x2a6fd6], [-W + 1.7, 6.0, 0xc8281e], [W - 1.6, -6.2, 0x3c8a4a]]) {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.25, 18), new THREE.MeshStandardMaterial({ color: c, metalness: 0.4, roughness: 0.5 }));
      drum.position.set(x, 0.625, z); drum.castShadow = true; s.add(drum);
    }
  }

  // Put the chosen racer on the turntable, and the chosen kart behind them.
  setRacer(character, vehicle) {
    if (this.racerKey !== character.id) {
      if (this.driver) this.turntable.remove(this.driver.root);
      this.driver = new Driver(this.models[character.model], character);
      this.driver.stand(character.idleClip);
      this.driver.root.position.set(0, 0.1, 1.8);
      this.driver.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      this.turntable.add(this.driver.root);
      this.racerKey = character.id;
    }
    if (this.kartKey !== vehicle) {
      if (this.kart) this.scene.remove(this.kart.group);
      this.kart = buildKart(vehicle);
      this.kart.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      this.scene.add(this.kart.group);
      this.kartKey = vehicle;
      this.kartIn = 0; // roll the new kart in
    }
  }

  setTrack(def) {
    if (this.trackKey === def.id) return;
    this.board.material.map?.dispose();
    this.board.material.map = trackMapTexture(def);
    this.board.material.emissiveMap = this.board.material.map;
    this.board.material.needsUpdate = true;
    this.trackKey = def.id;
  }

  setStep(step) { this.step = step; }

  update(dt, camera, aspect) {
    this.t += dt;
    this.driver?.update(dt);
    // the kart rolls in from the side once you reach the kart step
    const showKart = this.step !== 'racer';
    this.kartIn = showKart ? Math.min(1, this.kartIn + dt * 1.2) : 0;
    if (this.kart) {
      const e = 1 - (1 - this.kartIn) ** 3;
      this.kart.group.visible = showKart;
      this.kart.group.position.set(-7 * (1 - e), 0.1, 0.1);
      this.kart.group.rotation.y = 0.55 - (1 - e) * 1.2;
      for (const w of this.kart.wheels || []) w.wheel.rotation.x -= dt * (1 - e) * 18;
    }
    // turn the racer to face the camera, and swing gently
    if (this.driver) this.driver.root.rotation.y = -0.08 + Math.sin(this.t * 0.5) * 0.18;
    // ease the camera to this step's framing; on narrow screens step back a little
    const [p, l] = VIEWS[this.step];
    const back = aspect < 1.2 ? 1.35 : 1;
    const target = new THREE.Vector3(...p);
    const look = new THREE.Vector3(...l);
    target.sub(look).multiplyScalar(back).add(look);
    target.x += Math.sin(this.t * 0.3) * 0.25;
    const f = 1 - Math.exp(-dt * 3.5);
    this.cam.pos.lerp(target, f);
    this.cam.look.lerp(look, f);
    camera.position.copy(this.cam.pos);
    camera.lookAt(this.cam.look);
    camera.fov = 50;
    // nudge the picture left, clear of the menu panel on the right (more on phones)
    const w = innerWidth, h = innerHeight, shift = h < 520 ? 0.2 : 0.1;
    camera.setViewOffset(w, h, w * shift, 0, w, h);
    camera.updateProjectionMatrix();
  }

  // Skip the camera ease (first frame, or a screenshot hook).
  snap() {
    const [p, l] = VIEWS[this.step];
    this.cam.pos.set(...p); this.cam.look.set(...l);
    this.kartIn = this.step === 'racer' ? 0 : 1;
  }
}
