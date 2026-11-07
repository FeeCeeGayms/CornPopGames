// CornPop: the protagonist. Loads the rigged GLB, prepares in-place animations,
// drives a 3rd-person body and the live status-bar portrait (like Quake's face).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skelClone } from 'three/addons/utils/SkeletonUtils.js';

export const ANIM = {
  idle: 'Idle_9', idle2: 'Idle_10', walk: 'Walking', run: 'Running', jump: 'Run_and_Jump',
  happy: 'Arm_Circle_Shuffle', angry: 'Angry_Ground_Stomp_2', bow: 'Formal_Bow', funky: 'Funky_Walk', kick: 'Double_kick_forward',
};
const MODEL_HEIGHT = 1.94; // metres in the GLB
export const PLAYER_HEIGHT = 56; // quake units

// Models are web-optimised GLBs (quantised, WebP textures) shipped gzipped as .glb.gz and unpacked in the browser.
// A server that already sends them with Content-Encoding: gzip hands over plain GLB bytes, which is handled too.
// Fallbacks: the plain .glb, then a base64 module (.glb.js) for hosts that won't serve binary files.
async function gunzip(buf) {
  const u = new Uint8Array(buf);
  if (u[0] !== 0x1f || u[1] !== 0x8b) return buf; // not gzipped (already decoded by the server)
  if (typeof DecompressionStream === 'undefined') throw new Error('no DecompressionStream');
  return await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
}
async function fetchBytes(url, onProgress) {
  const r = await fetch(url); if (!r.ok) throw new Error(r.status + ' ' + url);
  const total = +r.headers.get('content-length') || 0;
  if (!r.body || !total || !onProgress) return await r.arrayBuffer();
  const rd = r.body.getReader(), parts = []; let got = 0;
  for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; onProgress(Math.min(1, got / total) * 0.9); }
  return await new Blob(parts).arrayBuffer();
}
export async function fetchModel(url, onProgress) {
  for (const u of [url + '.gz', url]) {
    try { const b = await gunzip(await fetchBytes(u, onProgress)); const h = new Uint8Array(b, 0, 4); if (h[0] === 0x67 && h[1] === 0x6c && h[2] === 0x54 && h[3] === 0x46) return b; } catch (e) { }
  }
  for (const u of [url + '.gz', url]) {
    try { const m = await import('../' + u + '.js'); const bin = Uint8Array.from(atob(m.default), ch => ch.charCodeAt(0)); return await gunzip(bin.buffer); } catch (e) { }
  }
  throw new Error('model failed to load: ' + url);
}

export class CornPopAsset {
  async load(url, onProgress) {
    const loader = new GLTFLoader(); let gltf;
    gltf = await loader.parseAsync(await fetchModel(url, onProgress), '');
    this.scene = gltf.scene;
    this.clips = {};
    for (const clip of gltf.animations) {
      // keep it in place: freeze horizontal root motion of the hips
      for (const tr of clip.tracks) {
        if (/Hips\.position$/.test(tr.name)) { const v = tr.values; const x0 = v[0], z0 = v[2]; for (let i = 0; i < v.length; i += 3) { v[i] = x0; v[i + 2] = z0; } }
      }
      this.clips[clip.name] = clip;
    }
    this.scene.traverse(o => {
      if (o.isMesh) {
        const map = o.material.map; if (map) { map.colorSpace = THREE.NoColorSpace; map.anisotropy = 1; }
        o.material = new THREE.MeshLambertMaterial({ map, color: 0xffffff });
        o.frustumCulled = false; o.castShadow = false;
      }
    });
    return this;
  }
  instance() { return new CornPop(this); }
}

export class CornPop {
  constructor(asset) {
    this.root = skelClone(asset.scene);
    this.mats = [];
    this.root.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); this.mats.push(o.material); } });
    this.mixer = new THREE.AnimationMixer(this.root);
    this.actions = {};
    for (const [k, name] of Object.entries(asset.animMap || ANIM)) { const clip = asset.clips[name]; if (clip) this.actions[k] = this.mixer.clipAction(clip); }
    this.head = null; this.root.traverse(o => { if (o.isBone && o.name === 'Head') this.head = o; });
    this.state = null; this.emote = null; this.emoteT = 0;
    this.lookYaw = 0; this.lookPitch = 0;
    this.mixer.addEventListener('finished', (e) => { if (this.emote && e.action === this.actions[this.emote]) { this.emote = null; this.setState(this.base || 'idle', 0.25, true); } });
    this.setState('idle', 0);
  }
  setState(name, fade = 0.2, force = false) {
    if (this.emote && !force) { this.base = name; return; }
    if (this.state === name && !force) return;
    const next = this.actions[name]; if (!next) return;
    const prev = this.state && this.actions[this.state];
    next.reset(); next.setLoop(THREE.LoopRepeat, Infinity); next.clampWhenFinished = false; next.enabled = true; next.setEffectiveWeight(1); next.play();
    if (prev && prev !== next) prev.crossFadeTo(next, fade, false);
    this.state = name; this.base = name;
  }
  playEmote(name, fade = 0.15) {
    const a = this.actions[name]; if (!a) return;
    const prev = this.state && this.actions[this.state];
    a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.enabled = true; a.setEffectiveWeight(1); a.play();
    if (prev && prev !== a) prev.crossFadeTo(a, fade, false);
    this.emote = name; this.state = name;
  }
  // locomotion from player speed / ground state
  drive(speed, onground) {
    if (this.emote) { this.base = !onground ? 'jump' : speed > 200 ? 'run' : speed > 30 ? 'walk' : 'idle'; return; }
    const want = !onground ? 'jump' : speed > 200 ? 'run' : speed > 30 ? 'walk' : 'idle';
    this.setState(want, want === 'jump' ? 0.1 : 0.25);
    const a = this.actions[this.state];
    if (a && (want === 'run' || want === 'walk')) a.timeScale = Math.max(0.6, Math.min(1.5, speed / (want === 'run' ? 320 : 150)));
    else if (a) a.timeScale = 1;
  }
  update(dt) {
    this.mixer.update(dt);
    if (this.head && (this.lookYaw || this.lookPitch)) {
      this.root.updateMatrixWorld(true);
      // rotate head in world space around world Y (turn) and camera-right (nod)
      const parent = this.head.parent; const pw = new THREE.Quaternion(); parent.getWorldQuaternion(pw);
      const hw = new THREE.Quaternion(); this.head.getWorldQuaternion(hw);
      const rootQ = new THREE.Quaternion(); this.root.getWorldQuaternion(rootQ);
      const yawQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.lookYaw);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(rootQ);
      const pitchQ = new THREE.Quaternion().setFromAxisAngle(right, this.lookPitch);
      const target = yawQ.multiply(pitchQ).multiply(hw);
      this.head.quaternion.copy(pw.invert().multiply(target));
    }
  }
}

// Renders CornPop's face into a small pixelated render target for the status bar.
export class Portrait {
  constructor(asset, size = 64) {
    this.cp = asset.instance();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a120c);
    this.scene.add(this.cp.root);
    this.amb = new THREE.AmbientLight(0xffffff, 1.4); this.scene.add(this.amb);
    this.key = new THREE.DirectionalLight(0xfff0dd, 1.6); this.key.position.set(0.6, 1.2, 1.5); this.scene.add(this.key);
    const rim = new THREE.DirectionalLight(0xffa060, 0.9); rim.position.set(-1.5, 0.6, -1); this.scene.add(rim);
    this.cam = new THREE.PerspectiveCamera(26, 1, 0.05, 20);
    this.rt = new THREE.WebGLRenderTarget(size, size, { magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter, depthBuffer: true });
    this.focus = new THREE.Vector3(0, 1.62, 0); this.tmp = new THREE.Vector3();
    this.flash = 0; this.lookTarget = 0; this.pitchTarget = 0;
  }
  update(dt, look = 0, pitch = 0) {
    this.cp.lookYaw += (look - this.cp.lookYaw) * Math.min(1, dt * 8);
    this.cp.lookPitch += (pitch - this.cp.lookPitch) * Math.min(1, dt * 8);
    this.cp.update(dt);
    if (this.cp.head) {
      this.cp.head.getWorldPosition(this.tmp);
      // frame on the face, smoothed so body motion still reads as head bobbing
      this.focus.lerp(this.tmp.add(new THREE.Vector3(0, 0.2, 0)), Math.min(1, dt * 6));
    }
    this.cam.position.set(this.focus.x, this.focus.y + 0.04, this.focus.z + 1.75);
    this.cam.lookAt(this.focus.x, this.focus.y, this.focus.z);
    this.flash = Math.max(0, this.flash - dt * 2);
    this.amb.intensity = 1.4 + this.flash * 2;
  }
  render(renderer) {
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(this.rt); renderer.render(this.scene, this.cam); renderer.setRenderTarget(prev);
  }
}
