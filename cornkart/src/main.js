// CornKart: boot, menus, camera, HUD and the main loop.
import * as THREE from 'three';
import { CHARACTERS, COMING_SOON } from './characters.js';
import { loadModel } from './assets.js';
import { buildKart, VEHICLES, combinedStats } from './karts/index.js';
import { Driver } from './driver.js';
import { Track } from './track.js';
import { PRIPYAT } from './tracks/pripyat.js';
import { SWEDEN } from './tracks/sweden.js';
import { SANFRANCISCO } from './tracks/sanfrancisco.js';
import { TRANSYLVANIA } from './tracks/transylvania.js';
import { SYDNEY } from './tracks/sydney.js';
import { Race, ordinal } from './race.js';
import { AIController } from './ai.js';
import { Particles, Ash, Rain } from './fx.js';
import { rollConditions, resolveConditions, Lightning } from './conditions.js';
import { Audio } from './audio.js';
import { Input } from './input.js';
import { createSky, setSky, bakeEnvironment, createComposer, FOG, WIND } from './graphics.js';
import { dressTrack } from './dressing.js';
import { Garage } from './garage.js';
import { Director } from './attract.js';

// To add a track, write a def like tracks/sweden.js and list it here.
const TRACKS = [PRIPYAT, SWEDEN, SANFRANCISCO, TRANSYLVANIA, SYDNEY];
const params = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);

const game = {
  mode: 'loading', // loading | menu | race | paused | results
  cc: 100,
  laps: 3,
  character: CHARACTERS[0],
  vehicle: CHARACTERS[0].vehicle,
  models: {},
  trackDef: TRACKS[0],
};
window.CORNKART = game;
if (params.has('test')) game.THREE = THREE; // test hook for in-page checks
game.log = [];
if (params.has('laps')) game.laps = +params.get('laps');
let savedTrack = null;
try { savedTrack = localStorage.getItem('cornkart.track'); } catch (e) {}
game.trackDef = TRACKS.find((t) => t.id === (params.get('track') || savedTrack)) || TRACKS[0];

// Graphics quality: High adds bloom, full shadows and grass. Phones default to Low.
const coarse = matchMedia('(pointer: coarse)').matches;
let savedQuality = null;
try { savedQuality = localStorage.getItem('cornkart.quality'); } catch (e) {}
game.quality = params.get('quality') || savedQuality || (coarse ? 'low' : 'high');
// Chase camera distance, chosen from the pause menu.
let savedCam = null;
try { savedCam = localStorage.getItem('cornkart.camera'); } catch (e) {}
game.camera = params.get('cam') || savedCam || 'normal';
if (params.has('char')) game.character = CHARACTERS.find((c) => c.id === params.get('char')) || game.character;
game.vehicle = params.get('vehicle') || game.character.vehicle;

// --- Renderer & world -------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: params.has('test') });
renderer.setPixelRatio(Math.min(devicePixelRatio, game.quality === 'low' ? 1 : 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.CustomToneMapping; // filmic curve plus a colour grade (graphics.js)
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('game').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 2500);
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  post?.composer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

// Pripyat's hazy daylight; a track def's `light` overrides any of these.
const LIGHT = { sun: 0xfff1d6, sunIntensity: 1.9, hemiSky: 0xd6dccb, hemiGround: 0x4a4436, hemiIntensity: 1.25, env: 0.55, exposure: 1.05, sunDir: [60, 110, 40], envGround: 0x4f4c3e };
let light = LIGHT;
const hemi = new THREE.HemisphereLight(0xd6dccb, 0x4a4436, 1.25);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1d6, 1.9);
sun.castShadow = true;
sun.shadow.mapSize.setScalar(game.quality === 'low' ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 260 });
sun.shadow.bias = -0.0005;
scene.add(sun, sun.target);

const SUN_DIR = new THREE.Vector3(60, 110, 40).normalize();
const sky = createSky(SUN_DIR);
scene.add(sky);
let post = null;
function applyQuality() {
  const high = game.quality === 'high';
  if (high && !post) post = createComposer(renderer, scene, camera);
  renderer.shadowMap.type = high ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
}
applyQuality();

const input = new Input();
input.bindTouch(document);
const audio = new Audio();
game.audio = audio; // test hook
let track, fx, smoke, ash, rain, race, garage, director;
const lightning = new Lightning();
let conditions = null;
const STEPS = ['racer', 'vehicle', 'track'];
game.step = STEPS.includes(params.get('step')) ? params.get('step') : 'racer';

function setMode(m) {
  game.mode = m;
  document.body.dataset.mode = m;
}

// --- Boot -------------------------------------------------------------------
async function boot() {
  setMode('loading');
  const status = (t) => { $('loading-text').textContent = t; };
  try {
    for (const c of CHARACTERS) {
      status(`Loading ${c.name}…`);
      game.models[c.model] = await loadModel(c.model);
    }
    status('Opening the garage…');
    await new Promise((r) => setTimeout(r, 30));
    ash = new Ash(scene);
    rain = new Rain(scene);
    fx = new Particles(scene, 1500, true);
    smoke = new Particles(scene, 600, false);
    garage = game.garage = new Garage(renderer, game.models);
    buildMenu();
    if (params.has('autostart')) { loadTrack(game.trackDef); startRace(); }
    else if (params.has('step')) { openMenu(game.step); garage.snap(); }
    else startTitle();
  } catch (e) {
    console.error(e);
    status('Could not load: ' + e.message);
    document.title = 'ERR ' + e.message;
  }
}

// Sky, sun, fog and weather for this race's time of day and weather.
function applyConditions(cond) {
  const def = track.def, r = resolveConditions(def, { light: LIGHT }, cond);
  conditions = game.conditions = { ...cond, ...r };
  scene.fog = new THREE.FogExp2(r.fog.color, r.fog.density);
  renderer.setClearColor(r.fog.color);
  light = r.light;
  SUN_DIR.set(...light.sunDir).normalize();
  setSky(sky, { ...r.sky, night: cond.time === 'night' ? 1 : 0, aurora: cond.time === 'night' && def.aurora && !r.weather.overcast ? 1 : 0 }, SUN_DIR);
  // fog glows towards the sun and thins with height
  FOG.fogSunDir.value.copy(SUN_DIR);
  FOG.fogSunColor.value.set(r.sky.sun).multiplyScalar(cond.time === 'night' ? 0.08 : (r.weather.overcast ? 0.12 : 0.35) * (r.sky.sunGlow ?? 1));
  FOG.fogBase.value = def.fogBase ?? 0;
  FOG.fogFalloff.value = def.fogFalloff ?? 0.02;
  sun.color.set(light.sun);
  hemi.color.set(light.hemiSky); hemi.groundColor.set(light.hemiGround);
  renderer.toneMappingExposure = light.exposure;
  scene.environment?.dispose();
  scene.environment = bakeEnvironment(renderer, sky, light.envGround);
  scene.environmentIntensity = light.env;
  sun.intensity = light.sunIntensity; hemi.intensity = light.hemiIntensity;
  const w = r.weather;
  ash.setStyle(w.particles);
  rain.setStyle(w.rain || null);
  lightning.set(w.lightning || null);
  if (track.roadMat) track.roadMat.roughness = w.wet ? 0.35 : 1; // wet tarmac picks up reflections
  $('track-region').textContent = `${def.region} · ${cond.label}`;
}

// Rain hiss plays only where the weather is, not in the garage.

function loadTrack(def) {
  if (track) { // swap tracks: drop the old world first
    track.dispose();
    if (track.scenery) { scene.remove(track.scenery); track.scenery.traverse((o) => o.geometry?.dispose()); }
  }
  track = game.track = new Track(def);
  track.build(scene, game.quality);
  track.scenery = def.buildScenery?.(scene, track);
  if (track.scenery) dressTrack(track.scenery, track, game.quality); // curbs, barriers, flags, start arch, crowds
  applyConditions(rollConditions(def, Math.random, { time: params.get('time'), weather: params.get('weather') }));
  const rad = def.theme?.radiation !== false;
  $('rad-meter').hidden = !rad;
  $('track-region').textContent = def.region;
  drawMinimapBase();
}

// --- The garage menu: pick a racer, then a kart, then a track -----------------
function selectTrack(def) {
  if (def === game.trackDef) return;
  game.trackDef = def;
  try { localStorage.setItem('cornkart.track', def.id); } catch (e) {}
  buildMenu();
}

function buildMenu() {
  const grid = $('roster');
  grid.innerHTML = '';
  CHARACTERS.forEach((c) => {
    const b = document.createElement('button');
    b.className = 'card' + (c === game.character ? ' selected' : '');
    b.innerHTML = `<span class="portrait">${c.icon}</span><span class="cname">${c.name}</span>`;
    b.onclick = () => {
      if (game.character === c) return;
      game.character = c; game.vehicle = c.vehicle;
      buildMenu();
    };
    grid.appendChild(b);
  });
  for (let i = 0; i < COMING_SOON; i++) {
    const b = document.createElement('button');
    b.className = 'card locked';
    b.disabled = true;
    b.innerHTML = '<span class="portrait">?</span><span class="cname">Coming soon</span>';
    grid.appendChild(b);
  }
  const cars = $('garage');
  cars.innerHTML = '';
  for (const [id, v] of Object.entries(VEHICLES)) {
    const b = document.createElement('button');
    b.className = 'card vcard' + (id === game.vehicle ? ' selected' : '');
    b.innerHTML = `<span class="portrait">${v.icon}</span><span class="cname">${v.name}</span>`;
    b.onclick = () => { if (game.vehicle === id) return; game.vehicle = id; buildMenu(); };
    cars.appendChild(b);
  }
  const tracks = $('tracks');
  tracks.innerHTML = '';
  for (const t of TRACKS) {
    const b = document.createElement('button');
    b.className = 'card tcard' + (t === game.trackDef ? ' selected' : '');
    b.innerHTML = `<span class="cname">${t.name}</span><span class="tregion">${t.region}</span>`;
    b.onclick = () => selectTrack(t);
    tracks.appendChild(b);
  }
  for (const btn of document.querySelectorAll('[data-cc]')) {
    btn.classList.toggle('selected', +btn.dataset.cc === game.cc);
    btn.onclick = () => { game.cc = +btn.dataset.cc; buildMenu(); };
  }
  for (const btn of document.querySelectorAll('[data-laps]')) {
    btn.classList.toggle('selected', +btn.dataset.laps === game.laps);
    btn.onclick = () => { game.laps = +btn.dataset.laps; buildMenu(); };
  }
  for (const btn of document.querySelectorAll('[data-quality]')) {
    btn.classList.toggle('selected', btn.dataset.quality === game.quality);
    btn.onclick = () => {
      if (btn.dataset.quality === game.quality) return;
      try { localStorage.setItem('cornkart.quality', btn.dataset.quality); } catch (e) {}
      // grass and texture detail are baked into the track, so reload to switch
      location.reload();
    };
  }
  $('track-region').textContent = game.trackDef.region;
  $('track-name').textContent = game.trackDef.name;
  $('track-blurb').textContent = game.trackDef.blurb;
  const c = game.character, v = VEHICLES[game.vehicle];
  $('char-name').textContent = c.name;
  $('char-tag').textContent = c.tagline;
  $('veh-name').textContent = v.name;
  $('veh-tag').textContent = `${v.tagline} With ${c.name} at the wheel:`;
  const bars = (stats) => Object.entries(stats).map(([k, n]) =>
    `<div class="stat"><span>${k}</span><div class="bar"><i style="width:${n * 20}%"></i></div></div>`).join('');
  $('char-stats').innerHTML = bars(c.stats);
  $('stats').innerHTML = bars(combinedStats(c, game.vehicle));
  if (garage) { garage.setRacer(c, game.vehicle); garage.setTrack(game.trackDef); }
}

function setStep(step) {
  game.step = step;
  document.body.dataset.step = step;
  garage.setStep(step);
}

function nextStep() {
  const i = STEPS.indexOf(game.step);
  if (i < STEPS.length - 1) setStep(STEPS[i + 1]);
  else beginRace();
}

function prevStep() {
  const i = STEPS.indexOf(game.step);
  if (i > 0) { setStep(STEPS[i - 1]); return true; }
  return false;
}

function openMenu(step = 'racer') {
  if (race) { race.dispose(); race = game.race = null; }
  fx.clear(); smoke.clear();
  buildMenu();
  setStep(step);
  setMode('menu');
}

// --- Title screen: the logo over an AI race filmed like an action replay -----
function startTitle() {
  const def = params.has('test') && params.has('track') ? game.trackDef : TRACKS[Math.floor(Math.random() * TRACKS.length)]; // test hook: pin the track
  $('loading-text').textContent = `Loading ${def.name}…`;
  loadTrack(def);
  const who = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  race = game.race = new Race({ scene, track, character: who, vehicle: who.vehicle, models: game.models, cc: 150, laps: 99, audio, fx, smoke });
  director = game.director = new Director(track, race);
  const title = $('title');
  title.classList.remove('play');
  void title.offsetWidth; // restart the intro animation
  title.classList.add('play');
  setMode('title');
}

let leavingTitle = false;
function leaveTitle() {
  if (game.mode !== 'title' || leavingTitle) return;
  leavingTitle = true;
  audio.unlock();
  fade(() => {
    race.dispose(); race = game.race = null; director = game.director = null;
    openMenu('racer'); garage.snap();
    leavingTitle = false;
  });
}

// Fade the whole screen to black, run `then`, and fade back in.
function fade(then) {
  const f = $('fader');
  f.classList.add('on');
  setTimeout(() => { then(); requestAnimationFrame(() => setTimeout(() => f.classList.remove('on'), 120)); }, 650);
}

// Leave the garage: build the chosen track if it isn't already, then line up on the grid.
function beginRace() {
  audio.unlock();
  setMode('loading');
  $('loading-text').textContent = `Loading ${game.trackDef.name}…`;
  setTimeout(() => {
    if (track?.def !== game.trackDef) loadTrack(game.trackDef);
    else applyConditions(rollConditions(track.def, Math.random, { time: params.get('time'), weather: params.get('weather') }));
    startRace();
  }, 40);
}

function startRace() {
  audio.unlock();
  if (race) race.dispose();
  fx.clear(); smoke.clear();
  race = game.race = new Race({ scene, track, character: game.character, vehicle: game.vehicle, models: game.models, cc: game.cc, laps: game.laps, audio, fx, smoke });
  if (params.has('autopilot')) race.autopilot = new AIController(race.player, track, { skill: 1.0, seed: 9,
    prefer: !params.has('prefer') ? {} : Object.fromEntries(track.paths.slice(1).map((p) => [p.id, (params.get('prefer') || '').split(',').includes(p.id)])) });
  camState.intro = 0;
  $('messages').innerHTML = '';
  setMode('race');
  if (conditions) { race.say(conditions.label.toUpperCase()); if (conditions.weather.call) setTimeout(() => race?.say(conditions.weather.call, 'bad'), 1500); }
  if (params.has('at')) { // test hook: drop the player at a track distance at speed
    race.state = 'racing';
    race.player.placeAt(+params.get('at'), +(params.get('d') || 0));
    race.player.speed = +(params.get('v') || 30);
  }
  if (params.has('sim')) { // test hook: fast-forward the race
    const steps = Math.round(+params.get('sim') * 60);
    for (let i = 0; i < steps; i++) race.update(1 / 60, input.poll());
    camState.intro = 99;
  }
}

$('start').onclick = beginRace;
$('title').onclick = leaveTitle;
for (const b of document.querySelectorAll('[data-next]')) b.onclick = nextStep;
for (const b of document.querySelectorAll('[data-back]')) b.onclick = prevStep;
$('resume').onclick = () => setMode('race');
function syncCamChips() {
  for (const btn of document.querySelectorAll('[data-cam]')) {
    btn.classList.toggle('selected', btn.dataset.cam === game.camera);
    btn.onclick = () => {
      game.camera = btn.dataset.cam;
      try { localStorage.setItem('cornkart.camera', game.camera); } catch (e) {}
      camState.init = false; // jump straight to the new distance
      syncCamChips();
    };
  }
}
syncCamChips();
$('restart').onclick = startRace;
$('again').onclick = startRace;
$('quit').onclick = () => openMenu();
$('menu').onclick = () => openMenu();
$('mute').onclick = () => { audio.setMuted(!audio.muted); $('mute').textContent = audio.muted ? '🔇' : '🔊'; };
addEventListener('pointerdown', () => audio.unlock(), { once: false });

// Hooks for the Android wrapper: the back button and app switching.
game.back = () => {
  if (game.mode === 'race') { setMode('paused'); return 'paused'; }
  if (game.mode === 'paused') { setMode('race'); return 'race'; }
  if (game.mode === 'results') { openMenu(); return 'menu'; }
  if (game.mode === 'menu') { if (!prevStep()) fade(startTitle); return 'menu'; }
  return 'exit';
};
game.suspend = () => {
  if (game.mode === 'race') setMode('paused');
  audio.ctx?.suspend();
};
game.resume = () => { if (audio.ctx && !audio.muted) audio.ctx.resume(); };
document.addEventListener('visibilitychange', () => { if (document.hidden) game.suspend(); else game.resume(); });
addEventListener('keydown', () => audio.unlock());

// --- Camera -----------------------------------------------------------------
const camState = { pos: new THREE.Vector3(), look: new THREE.Vector3(), intro: 0, init: false, shake: 0, wasGrounded: true, airVy: 0 };
const camLoc = {}, camQ = {};
let tunnelDim = 0;
const speedLines = $('speedlines');
const tmpV = new THREE.Vector3(), tmpL = new THREE.Vector3();

function updateCamera(dt, k, lookBack) {
  const fx_ = Math.sin(k.yaw), fz_ = Math.cos(k.yaw);
  const back = lookBack ? -1 : 1;
  const near = game.camera === 'close' ? 0.5 : 1; // "close" is 50% nearer
  const dist = (6.2 + Math.min(1.5, Math.max(0, k.speed) / 30)) * near, height = 2.5 * near + (near < 1 ? 0.35 : 0);
  tmpV.set(k.pos.x - fx_ * dist * back, k.pos.y + height, k.pos.z - fz_ * dist * back);
  tmpL.set(k.pos.x + fx_ * 3 * back, k.pos.y + 1.1, k.pos.z + fz_ * 3 * back);
  if (camState.intro < 1 && race && race.state === 'countdown') {
    // swoop from the front of the kart round to the chase position
    camState.intro = Math.min(1, camState.intro + dt / 3.4);
    const a = (1 - easeInOut(camState.intro)) * Math.PI;
    const r = dist + (1 - camState.intro) * 3;
    tmpV.set(k.pos.x - Math.sin(k.yaw + a) * r, k.pos.y + height + (1 - camState.intro) * 1.5, k.pos.z - Math.cos(k.yaw + a) * r);
    tmpL.set(k.pos.x, k.pos.y + 1, k.pos.z);
    camState.pos.copy(tmpV); camState.look.copy(tmpL);
  } else if (!camState.init || lookBack) {
    camState.pos.copy(tmpV); camState.look.copy(tmpL);
  } else {
    const f = 1 - Math.exp(-dt * 7 / near); // trail less in close-up too
    camState.pos.lerp(tmpV, f);
    camState.look.lerp(tmpL, 1 - Math.exp(-dt * 12));
  }
  camState.init = true;
  // keep the camera above the ground, and under the roof inside tunnels
  const q = track.locate(camState.pos.x, camState.pos.z, camState.pos.y, camLoc, camQ);
  const inTunnel = k.q.tunnel;
  if (inTunnel) {
    const kq = k.q;
    camState.pos.y = Math.min(camState.pos.y, kq.roadH + 5.2);
    // stay inside the tube sideways too
    const lim = kq.roadHalf + 0.6;
    const dx = camState.pos.x - kq.cx, dz = camState.pos.z - kq.cz;
    const d = dx * kq.rx + dz * kq.rz;
    if (Math.abs(d) > lim) { const c = Math.sign(d) * lim - d; camState.pos.x += kq.rx * c; camState.pos.z += kq.rz * c; }
  } else {
    const gy = track.ground(camState.pos.x, camState.pos.z, q).h;
    if (camState.pos.y < gy + 1.0) camState.pos.y = gy + 1.0;
  }
  // landing shake
  if (camState.shake > 0) {
    camState.shake = Math.max(0, camState.shake - dt * 2.5);
    const a = camState.shake * 0.25;
    camera.position.set((Math.random() - 0.5) * a, (Math.random() - 0.5) * a, (Math.random() - 0.5) * a).add(camState.pos);
  } else camera.position.copy(camState.pos);
  camera.lookAt(camState.look);
  // dim the daylight while underground
  tunnelDim += ((inTunnel ? 1 : 0) - tunnelDim) * Math.min(1, dt * 3);
  sun.intensity = light.sunIntensity * (1 - tunnelDim * 0.85);
  hemi.intensity = light.hemiIntensity * (1 - tunnelDim * 0.6);
  scene.environmentIntensity = light.env * (1 - tunnelDim * 0.7);
  if (post) {
    post.bloom.strength = 0.55 + tunnelDim * 0.35 + (k.boostTime > 0 ? 0.15 : 0);
    const u = post.grade.uniforms.uSpeed;
    u.value += ((k.boostTime > 0 ? 1 : 0) - u.value) * Math.min(1, dt * 6);
  }
  // speed lines while boosting
  speedLines.style.opacity = k.boostTime > 0 ? Math.min(1, k.boostTime * 2) * 0.85 : 0;
  // landing shake from big drops
  if (k.grounded && !camState.wasGrounded && camState.airVy < -9) camState.shake = Math.min(1.2, -camState.airVy / 22);
  camState.wasGrounded = k.grounded;
  camState.airVy = k.vy ?? 0;
  const targetFov = 70 + Math.min(1, Math.max(0, k.speed) / k.maxSpeed) * 6 + (k.boostTime > 0 ? 9 : 0);
  camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 4);
  camera.updateProjectionMatrix();
}
const easeInOut = (t) => t * t * (3 - 2 * t);

function followLight(p) {
  sun.position.set(p.x + SUN_DIR.x * 130, p.y + SUN_DIR.y * 130, p.z + SUN_DIR.z * 130);
  sun.target.position.copy(p);
}

// --- HUD --------------------------------------------------------------------
let mmBase, mmScale, mmOff;
function drawMinimapBase() {
  const c = document.createElement('canvas');
  c.width = c.height = 200;
  const g = c.getContext('2d');
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < track.N; i++) { minX = Math.min(minX, track.cx[i]); maxX = Math.max(maxX, track.cx[i]); minZ = Math.min(minZ, track.cz[i]); maxZ = Math.max(maxZ, track.cz[i]); }
  mmScale = 170 / Math.max(maxX - minX, maxZ - minZ);
  mmOff = { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 };
  const P = (i) => [100 + (track.cx[i] - mmOff.x) * mmScale, 100 + (track.cz[i] - mmOff.z) * mmScale];
  const PP = (p, i) => [100 + (p.cx[i] - mmOff.x) * mmScale, 100 + (p.cz[i] - mmOff.z) * mmScale];
  const branches = track.paths.filter((p) => p !== track.main);
  const accent = track.theme.mapAccent ?? '#7dff4a';
  g.lineJoin = 'round'; g.lineCap = 'round';
  for (const [w, col] of [[9, 'rgba(0,0,0,0.55)'], [5, '#d8d3bd']]) {
    g.lineWidth = w; g.strokeStyle = col;
    g.beginPath();
    for (let i = 0; i <= track.N; i++) { const [x, y] = P(i % track.N); i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  }
  for (const b of branches) { // shortcuts: tan; secret tunnel: dashed green
    for (const [w, col] of [[6, 'rgba(0,0,0,0.5)'], [3, b.secret ? '#7dff4a' : '#c9a86a']]) {
      g.lineWidth = w; g.strokeStyle = b.secret && w === 3 ? accent : col;
      g.setLineDash(b.secret && w === 3 ? [4, 4] : []);
      g.beginPath();
      for (let i = 0; i < b.N; i++) { const [x, y] = PP(b, i); i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
  }
  g.setLineDash([]);
  for (const r of track.ramps) if (r.pit) {
    const [x, y] = PP(r.path, Math.min(r.path.N - 1, Math.floor((r.s + r.len) / r.path.ds)));
    g.fillStyle = track.theme.mapPit ?? '#5dff2a'; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill();
  }
  const [sx, sy] = P(0);
  g.fillStyle = '#fff'; g.fillRect(sx - 4, sy - 4, 8, 8);
  mmBase = c;
}

function drawMinimap() {
  const c = $('minimap'), g = c.getContext('2d');
  g.clearRect(0, 0, 200, 200);
  g.drawImage(mmBase, 0, 0);
  for (const k of race.karts) {
    const x = 100 + (k.pos.x - mmOff.x) * mmScale, y = 100 + (k.pos.z - mmOff.z) * mmScale;
    g.fillStyle = k.color;
    g.strokeStyle = '#000'; g.lineWidth = 2;
    g.beginPath(); g.arc(x, y, k.isPlayer ? 7 : 5, 0, 7); g.fill(); g.stroke();
  }
}

const fmt = (t) => { const m = Math.floor(t / 60), s = t - m * 60; return `${m}:${s.toFixed(2).padStart(5, '0')}`; };
let hudTimer = 0;
function updateHud(dt) {
  const P = race.player;
  hudTimer += dt;
  for (const m of race.messages.splice(0)) {
    const el = document.createElement('div');
    el.className = 'msg ' + m.cls;
    el.textContent = m.text;
    $('messages').appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }
  if (hudTimer < 0.05) return;
  hudTimer = 0;
  const pos = race.positionOf(P);
  $('pos').innerHTML = `${pos}<sup>${ordinal(pos).slice(-2)}</sup>`;
  $('pos').dataset.place = pos;
  const lap = Math.min(race.laps, Math.max(1, Math.floor(P.total / track.length) + 1));
  $('lap').textContent = `LAP ${lap}/${race.laps}`;
  $('time').textContent = fmt(race.time);
  $('speed').textContent = Math.round(Math.abs(P.speed) * 3.6);
  const d = P.drift;
  $('drift').className = 'drift ' + (d.on ? 'on lvl' + d.level : '');
  $('boostbar').style.width = Math.min(100, P.boostTime / 1.8 * 100) + '%';
  $('rad').style.width = Math.round(race.radiationLevel() * 100) + '%';
  drawMinimap();
}

function showResults() {
  setMode('results');
  const rows = race.results();
  $('results-table').innerHTML = rows.map((r, i) =>
    `<tr class="${r.player ? 'me' : ''}"><td>${ordinal(i + 1)}</td><td>${r.name}</td><td>${fmt(r.time)}${r.estimated ? '*' : ''}</td></tr>`).join('');
  const place = rows.findIndex((r) => r.player) + 1;
  $('results-title').textContent = place === 1 ? 'Winner winner, corn dog dinner!' : place <= 3 ? `Podium! ${ordinal(place)} place` : `${ordinal(place)} place. ${track.theme.loseText ?? 'The zone was rough.'}`;
  // CornPop hops out and celebrates (or stomps) next to the kart
  const P = race.player, d = P.driver, cel = game.character.celebrate;
  race.parked = true;
  const clip = place === 1 ? cel.win : place <= 3 ? cel.podium : cel.lose;
  if (cel.seated) d.celebrateSeated(clip); // stays in the kart
  else { // hops out next to the kart
    P.model.group.add(d.root);
    d.root.position.set(0.9, 0, 2.0);
    d.root.rotation.y = 0.8;
    d.stand(clip);
  }
}

// Falling ash, snow and rain follow the camera; lightning flashes the exposure.
function weatherFrame(dt) {
  ash.update(dt, camera.position);
  rain.update(dt, camera.position);
  renderer.toneMappingExposure = light.exposure * (1 + 2.2 * lightning.update(dt, game.mode === 'paused' ? null : audio));
}

// --- Main loop ----------------------------------------------------------------
const clock = new THREE.Clock();
let frames = 0, elapsed = 0;
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(1 / 20, clock.getDelta());
  elapsed += dt;
  const inp = input.poll();
  if (track) track.update(elapsed, game.race);

  const inGarage = game.mode === 'menu' && garage;
  // music: the title song on the menus, the track's own song while racing
  const racing = (game.mode === 'race' || game.mode === 'results' || game.mode === 'paused') && race;
  audio.setSong(racing ? track.def.id : 'title');
  if (game.mode !== 'paused') audio.music();
  if (game.mode === 'title' && director) {
    followLight(director.update(dt, camera));
    fx.update(dt); smoke.update(dt); weatherFrame(dt);
    if (track.ferris) track.ferris.wheel.rotation.z += dt * 0.02;
    if (track.mineWheel) track.mineWheel.rotation.z += dt * 0.6;
    if (input.took('Enter') || input.took('Space')) leaveTitle();
  } else if (inGarage) {
    garage.update(dt, camera, innerWidth / innerHeight);
    if (input.took('Enter')) nextStep();
    if (input.took('Escape')) prevStep();
  } else if ((game.mode === 'race' || game.mode === 'results') && race) {
    if (camera.view?.enabled) camera.clearViewOffset();
    if (input.took('Escape') || input.took('KeyP')) { if (game.mode === 'race') setMode('paused'); }
    if (input.took('KeyR') && race.state === 'racing') race.player.respawn(race.player.q.mainS);
    if (input.took('KeyM')) audio.toggleMusic();
    race.update(dt, inp);
    if (race.state === 'finished' && game.mode === 'race') {
      race.finishWait -= dt;
      if (race.finishWait <= 0) showResults();
    }
    const P = race.player;
    if (game.mode === 'results') {
      const t = P.yaw + 0.9 + Math.sin(elapsed * 0.3) * 0.5;
      camera.position.set(P.pos.x + Math.sin(t) * 6.5, P.pos.y + 2.0, P.pos.z + Math.cos(t) * 6.5);
      const shift = innerWidth > 760 ? 2.0 : 0; // keep the racer clear of the results panel
      camera.lookAt(P.pos.x + Math.cos(t) * shift, P.pos.y + 0.9, P.pos.z - Math.sin(t) * shift);
      camera.fov = 50; camera.updateProjectionMatrix();
      P.driver.update(dt);
    } else updateCamera(dt, P, inp.look);
    followLight(P.pos);
    fx.update(dt); smoke.update(dt); weatherFrame(dt);
    if (track.ferris) track.ferris.wheel.rotation.z += dt * 0.02;
    if (track.mineWheel) track.mineWheel.rotation.z += dt * 0.6;
    audio.engine(P.speed, P.maxSpeed, inp.gas, P.boostTime > 0, game.mode === 'race');
    if (race.theme.radiation) audio.geiger(dt, race.radiationLevel());
    if (game.mode === 'race') updateHud(dt);
  } else if (game.mode === 'paused') {
    audio.engine(0, 1, 0, false, false);
    if (input.took('Escape') || input.took('KeyP')) setMode('race');
  }
  if (game.view) { // test hook: a free camera for screenshots, { pos: [x, y, z], look: [x, y, z] }
    camera.position.set(...game.view.pos); camera.lookAt(...game.view.look);
    camera.fov = game.view.fov ?? 60; camera.updateProjectionMatrix();
    followLight(new THREE.Vector3(...game.view.look));
  }
  sky.position.copy(camera.position);
  sky.material.uniforms.uTime.value = elapsed;
  WIND.time.value = elapsed;
  if (post) {
    const gu = post.grade.uniforms;
    gu.toneMappingExposure.value = renderer.toneMappingExposure;
    gu.uTime.value = elapsed; gu.uAspect.value = innerWidth / innerHeight;
    if (game.mode !== 'race') gu.uSpeed.value = 0;
  }
  const world = inGarage ? garage.scene : scene;
  if (post) { post.composer.passes[0].scene = world; post.composer.render(dt); } else renderer.render(world, camera);
  frames++;
  if (frames >= 3 && !window.READY && game.mode !== 'loading') window.READY = true;
}

boot().then(() => frame());
