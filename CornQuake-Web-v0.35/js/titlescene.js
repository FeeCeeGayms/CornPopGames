// The CornQuake title screen (v0.34): a live scene behind the menu instead of a picture.
// CornPop stands on cracked, glowing ground with the sausage shotgun held across his chest; a wall of fire burns behind him,
// embers blow past, the spires of the Crypt of Hornt stand black against a boiling red sky with an eclipsed sun, and now and
// then a burning rock falls. The camera drifts slowly; his arms are placed on the gun every frame with a two-bone solve, so the
// breathing of his idle animation carries through to the weapon.
import * as THREE from 'three';
import { makeShotgun } from './combat.js';

const NOISE = `
float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h1(i), h1(i+vec2(1.0,0.0)), f.x), mix(h1(i+vec2(0.0,1.0)), h1(i+vec2(1.0,1.0)), f.x), f.y); }
float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * vn(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }`;

const SKY_V = 'varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0); gl_Position = p.xyww; }';
const SKY_F = `varying vec3 vDir; uniform float time; uniform vec3 sunDir; uniform float flash;
${NOISE}
float hs(float n){ return fract(sin(n) * 43758.5453); }
void main(){
  vec3 d = normalize(vDir); float el = asin(clamp(d.y, -1.0, 1.0)), az = atan(d.z, d.x);
  vec2 sp = d.xz / max(d.y + 0.1, 0.07) * 1.2;                                    // the cloud deck: black masses, fire in the cracks between them
  float n = fbm(sp * 0.9 + vec2(time * 0.035, time * 0.02)) * 0.75 + fbm(sp * 2.6 - vec2(time * 0.05, 0.0)) * 0.25;
  float k = smoothstep(0.34, 0.7, n);
  vec3 c = mix(vec3(0.045, 0.006, 0.012), vec3(0.8, 0.14, 0.035), k * k * 0.6) + vec3(1.0, 0.5, 0.12) * pow(k, 6.0) * 0.9;
  c = mix(c, vec3(0.02, 0.004, 0.008), smoothstep(0.42, 0.18, n) * 0.75);
  // the black sun: an eclipse with a burning corona, straight behind him
  vec3 u = normalize(cross(vec3(0.0, 1.0, 0.0), sunDir)), v = cross(sunDir, u); vec2 q = vec2(dot(d, u), dot(d, v)); float r = length(q) + step(dot(d, sunDir), 0.0) * 9.0;
  float ray = 0.55 + 0.45 * vn(vec2(atan(q.y, q.x) * 7.0, time * 0.4));
  c += vec3(1.0, 0.36, 0.08) * exp(-max(r - 0.16, 0.0) * (7.0 / ray)) * step(0.16, r) * 1.6; c = mix(c, vec3(0.0), smoothstep(0.168, 0.158, r)); c += vec3(1.0, 0.7, 0.3) * smoothstep(0.012, 0.0, abs(r - 0.164)) * 1.5;
  // burning rocks
  for (int m = 0; m < 3; m++) { float fm = float(m), T = time * (0.12 + 0.03 * fm) + fm * 3.7, id = floor(T), ph = fract(T) / 0.3;
    if (ph < 1.0) { float a0 = hs(id * 7.1 + fm) * 6.2832, e0 = 0.5 + 0.5 * hs(id * 3.3 + fm * 2.0), a1 = a0 + 0.7 * (hs(id * 1.9 + fm) - 0.5), e1 = e0 - 0.5;
      vec3 A = vec3(cos(a0) * cos(e0), sin(e0), sin(a0) * cos(e0)), B = vec3(cos(a1) * cos(e1), sin(e1), sin(a1) * cos(e1)); vec3 hd = normalize(mix(A, B, ph)), tl = normalize(mix(A, B, max(ph - 0.3, 0.0)));
      vec3 qa = d - tl, ba = hd - tl; float hh = clamp(dot(qa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
      c += (vec3(1.0, 0.5, 0.12) * exp(-length(qa - ba * hh) * 240.0) * hh * hh * 2.2 + vec3(1.0, 0.85, 0.5) * exp(-length(d - hd) * 110.0) * 2.0) * smoothstep(1.0, 0.8, ph); } }
  c += vec3(1.0, 0.36, 0.07) * exp(-max(el, 0.0) * 4.6) * (0.85 + 0.15 * sin(time * 0.7 + az * 5.0));     // the glow of everything burning under the clouds
  c += vec3(1.0, 0.5, 0.3) * flash * (0.2 + k);
  // the horizon: domed spires, broken towers and rubble, two layers deep
  for (int layer = 0; layer < 2; layer++) { float L = float(layer), cols = 40.0 + L * 34.0, uu = (az / 6.2832 + 0.5) * cols + L * 13.0, id = floor(uu), fu = fract(uu);
    float w = 0.35 + 0.6 * hs(id * 5.3 + L), x = abs(fu - 0.5) / (w * 0.5), kind = hs(id * 9.1 + L * 2.0), hg = 0.1 + pow(hs(id * 1.7 + 3.1 + L * 9.0), 2.0) * (0.5 - L * 0.2);
    if (x > 1.0) hg = 0.05 + 0.04 * hs(id * 2.9) + 0.03 * vn(vec2(fu * 7.0 + id, L));
    else if (kind < 0.5) { float Hs = hg + 0.05, dome = Hs * (0.8 + 0.2 * sqrt(max(1.0 - x * x / 0.5, 0.0))), orb = Hs * 0.04 + Hs * 0.2 * sqrt(max(1.0 - pow((x - 0.7) / 0.3, 2.0), 0.0)); hg = x < 0.4 ? dome : ((x < 0.7 && el > Hs * 0.72 && el < Hs * 0.86) ? dome : orb); }
    else if (kind < 0.8) hg -= 0.07 * step(0.5, hs(floor(fu * 6.0) + id * 3.0)) + 0.05 * vn(vec2(fu * 9.0 + id, 3.0));
    else hg *= 1.0 - 0.32 * step(0.55, x);
    if (el < hg) { vec3 b = mix(vec3(0.012, 0.006, 0.008), vec3(0.2, 0.05, 0.02), layer == 0 ? 0.6 : 0.0) + vec3(0.5, 0.14, 0.03) * (layer == 0 ? 0.5 : 0.2) * exp(-max(el, 0.0) * 9.0);
      vec2 wc = vec2(fu * 5.0, el * 34.0), wf = fract(wc); if (x < 0.36) b += vec3(1.0, 0.3, 0.08) * step(0.85, hs(dot(floor(wc) + id * 7.0, vec2(1.3, 7.1)) + L)) * step(0.3, wf.x) * step(wf.x, 0.6) * step(0.25, wf.y) * step(wf.y, 0.75) * (layer == 0 ? 0.3 : 0.7);
      c = b; break; } }
  if (el < 0.0) c = mix(vec3(0.5, 0.13, 0.03), vec3(0.02, 0.006, 0.006), smoothstep(0.0, -0.12, el));
  gl_FragColor = vec4(c, 1.0);
}`;
const GROUND_V = 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';
const GROUND_F = `varying vec3 vW; uniform float time; uniform float flick;
${NOISE}
void main(){
  vec2 p = vW.xz; float d = length(p - cameraPosition.xz);
  float rock = fbm(p * 0.035) * 0.6 + fbm(p * 0.14) * 0.4; vec3 c = vec3(0.075, 0.045, 0.04) * (0.45 + rock);
  float e = 2.0, hC = fbm(p * 0.035), hX = fbm((p + vec2(e, 0.0)) * 0.035), hZ = fbm((p + vec2(0.0, e)) * 0.035); vec3 nrm = normalize(vec3((hC - hX) * 9.0, 1.0, (hC - hZ) * 9.0));
  // the fire behind him lights the stones from the back; the sky adds a little red everywhere
  c *= vec3(1.0, 0.42, 0.16) * (0.35 + 2.4 * max(dot(nrm, normalize(vec3(0.0, 0.35, -1.0))), 0.0) * flick) * exp(-max(p.y + 330.0, 0.0) * 0.0022) + vec3(0.12, 0.03, 0.02);
  // lava in the cracks: the ridges of a slow noise field, breathing
  float r1 = abs(fbm(p * 0.011 + 3.0) - 0.5), r2 = abs(fbm(p * 0.03 - 5.0) - 0.5);
  float crack = smoothstep(0.022, 0.0, r1) + smoothstep(0.012, 0.0, r2) * 0.7; float pulse = 0.75 + 0.25 * sin(time * 1.3 + fbm(p * 0.02) * 9.0);
  c *= 1.0 - 0.6 * smoothstep(0.07, 0.02, r1);
  c += vec3(1.0, 0.36, 0.05) * crack * pulse * 1.5 + vec3(1.0, 0.75, 0.3) * pow(clamp(crack, 0.0, 1.0), 3.0) * pulse * 0.8 + vec3(0.6, 0.12, 0.02) * smoothstep(0.1, 0.0, r1) * 0.35;
  c *= 1.0 - 0.75 * smoothstep(34.0, 6.0, length(p - vec2(0.0, 4.0)));                    // his shadow
  c = mix(c, vec3(0.5, 0.13, 0.03), clamp(1.0 - exp(-d * d * 0.0000016), 0.0, 1.0));    // heat haze toward the horizon
  gl_FragColor = vec4(c, 1.0);
}`;
const FIRE_V = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const FIRE_F = `varying vec2 vUv; uniform float time; uniform float seed; uniform float heat;
${NOISE}
void main(){
  float x = vUv.x, y = vUv.y; float sway = (vn(vec2(y * 2.0 - time * 0.9, seed)) - 0.5) * 0.22 * y; x += sway;
  float n = fbm(vec2(x * 3.2 + seed * 3.1, y * 2.4 - time * 1.7)) * 0.65 + fbm(vec2(x * 8.0 - seed, y * 5.5 - time * 2.9)) * 0.35;
  float body = (1.0 - pow(abs(x - 0.5) * 2.0, 2.2)) * (1.0 - y);                          // tall in the middle, thinning as it climbs
  float f = clamp(body * 1.75 + (n - 0.5) * 1.25 - y * 0.42, 0.0, 1.0); f = smoothstep(0.1, 0.95, f);
  vec3 c = mix(vec3(0.55, 0.03, 0.0), vec3(1.0, 0.36, 0.03), smoothstep(0.0, 0.42, f)); c = mix(c, vec3(1.0, 0.8, 0.28), smoothstep(0.4, 0.75, f)); c = mix(c, vec3(1.0, 0.97, 0.82), smoothstep(0.78, 1.0, f));
  float a = smoothstep(0.02, 0.3, f) * smoothstep(0.0, 0.06, vUv.y + 0.03);
  gl_FragColor = vec4(c * a * heat, a);
}`;
const EMBER_V = `attribute vec4 seed; uniform float time; uniform float px; varying float vA;
void main(){ float t = fract(time * (0.05 + seed.w * 0.07) + seed.x); vec3 p = position; p.y += t * (220.0 + seed.y * 260.0);
  p.x += sin(time * (0.6 + seed.z) + seed.x * 30.0) * (14.0 + 30.0 * seed.y) + t * 120.0; p.z += cos(time * (0.5 + seed.y) + seed.z * 20.0) * 18.0 + t * 60.0;
  vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; vA = sin(t * 3.14159) * (0.5 + 0.5 * sin(time * 9.0 * seed.z + seed.x * 40.0)); gl_PointSize = px * (2.0 + 5.0 * seed.w) / max(-mv.z, 1.0); }`;
const EMBER_F = 'varying float vA; void main(){ vec2 q = gl_PointCoord - 0.5; float r = length(q); if (r > 0.5) discard; gl_FragColor = vec4(vec3(1.0, 0.55, 0.14) * vA * smoothstep(0.5, 0.0, r) * 1.6, 1.0); }';

export class TitleScene {
  constructor(game) {
    this.game = game; this.t = 0; const S = this.scene = new THREE.Scene(); this.cam = new THREE.PerspectiveCamera(38, 1, 2, 9000);
    const U = this.U = { time: { value: 0 }, flick: { value: 1 }, flash: { value: 0 }, sunDir: { value: new THREE.Vector3(0.1, 0.3, -1).normalize() } };
    // sky and ground
    const sky = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), new THREE.ShaderMaterial({ uniforms: U, vertexShader: SKY_V, fragmentShader: SKY_F, side: THREE.BackSide, depthWrite: false, depthTest: false })); sky.frustumCulled = false; sky.renderOrder = -10; S.add(sky);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.ShaderMaterial({ uniforms: U, vertexShader: GROUND_V, fragmentShader: GROUND_F })); ground.rotation.x = -Math.PI / 2; S.add(ground);
    // the spires of the crypt, black against the fire, each with a flame in its tip
    this.fires = []; const fireGeo = new THREE.PlaneGeometry(1, 1); fireGeo.translate(0, 0.5, 0);
    const addFire = (x, y, z, w, h, heat = 1, order = 2) => { const m = new THREE.Mesh(fireGeo, new THREE.ShaderMaterial({ uniforms: { time: U.time, seed: { value: Math.random() * 10 }, heat: { value: heat } }, vertexShader: FIRE_V, fragmentShader: FIRE_F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); m.position.set(x, y, z); m.scale.set(w, h, 1); m.renderOrder = order; S.add(m); this.fires.push(m); return m; };
    const stone = new THREE.MeshLambertMaterial({ color: 0x2a1512 }), dark = new THREE.MeshLambertMaterial({ color: 0x120908 });
    const spire = (x, z, hh, r0) => { const g = new THREE.Group(), sh = hh - 20;
      const lathe = (pts, mat, segs = 14) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(Math.max(0.01, p[0]), p[1])), segs), mat);
      const shaft = lathe([[r0 * 2.0, 0], [r0 * 2.0, 12], [r0 * 1.5, 14], [r0 * 1.5, 22], [r0 * 1.2, 26], [r0, 34], [r0 * 0.92, sh * 0.3], [r0 * 0.9, sh * 0.62], [r0 * 0.96, sh * 0.66], [r0 * 1.3, sh * 0.7], [r0 * 1.4, sh * 0.74], [r0 * 1.38, sh * 0.86], [r0 * 1.16, sh * 0.94], [r0 * 0.7, sh * 0.985], [0.01, sh]], stone); g.add(shaft);
      for (const f of [0.2, 0.42, 0.6]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(r0 * 1.02, r0 * 1.02, sh * 0.02, 14), dark); b.position.y = sh * f; g.add(b); }
      for (const k of [-1, 1]) { const o = new THREE.Mesh(new THREE.SphereGeometry(r0 * 1.05, 14, 10), stone); o.position.set(k * r0 * 1.8, r0 * 1.0, 0); g.add(o); }
      for (let i = 0; i < 4; i++) for (const f of [0.26, 0.48]) { const w = new THREE.Mesh(new THREE.BoxGeometry(r0 * 0.22, sh * 0.09, r0 * 0.22), new THREE.MeshBasicMaterial({ color: 0xff5a18 })); const a = i / 4 * 6.283 + 0.4; w.position.set(Math.cos(a) * r0 * 0.88, sh * f, Math.sin(a) * r0 * 0.88); w.rotation.y = -a; g.add(w); }
      g.position.set(x, 0, z); g.rotation.y = Math.random() * 3; S.add(g); addFire(x, sh - 4, z, r0 * 2.6, r0 * 4.2, 0.8, 1); };
    spire(-330, -620, 520, 30); spire(250, -560, 430, 25); spire(560, -900, 640, 36); spire(-700, -980, 580, 34); spire(60, -1250, 760, 44);
    // broken walls and rubble between him and the fire
    let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 26; i++) { const a = rnd() * 6.283, d = 70 + rnd() * 420, r = 4 + rnd() * 16, m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), i % 3 ? dark : stone); m.position.set(Math.cos(a) * d, r * 0.35, -Math.abs(Math.sin(a)) * d * 0.9 + 40); m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); m.scale.y = 0.6 + rnd() * 0.5; S.add(m); }
    for (const [x, z, w, h, ry] of [[-190, -170, 120, 96, 0.3], [210, -230, 150, 130, -0.25], [-60, -300, 90, 60, 0.1], [330, -120, 70, 150, 0.6]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 22), stone); m.position.set(x, h / 2 - 6, z); m.rotation.set(0, ry, (rnd() - 0.5) * 0.12); S.add(m); const top = new THREE.Mesh(new THREE.BoxGeometry(w * 0.5, h * 0.3, 22), stone); top.position.set(x - w * 0.2, h + h * 0.1 - 8, z); top.rotation.set(0, ry, 0.2); S.add(top); }
    // the wall of fire behind him, and smaller fires near by
    for (let i = 0; i < 8; i++) addFire(-600 + i * 170 + (rnd() - 0.5) * 60, -8, -360 - rnd() * 90 - Math.abs(i - 3.5) * 16, 200 + rnd() * 110, 150 + rnd() * 190, 0.58, 2);
    for (let i = 0; i < 5; i++) addFire(-430 + i * 215 + (rnd() - 0.5) * 80, -6, -230 - rnd() * 60, 110 + rnd() * 60, 90 + rnd() * 90, 0.5, 3);
    for (const [x, z, w, h] of [[-70, -250, 150, 230], [60, -280, 170, 270], [170, -240, 120, 180]]) addFire(x, -6, z, w, h, 0.62, 3);   // straight behind him
    for (const [x, z, w, h] of [[-120, -70, 46, 70], [150, -40, 38, 56], [-230, 10, 34, 50], [96, -150, 60, 96], [-36, -180, 54, 84]]) addFire(x, -3, z, w, h, 0.75, 4);
    // embers on the wind
    { const N = 520, pos = new Float32Array(N * 3), sd = new Float32Array(N * 4); for (let i = 0; i < N; i++) { pos[i * 3] = (rnd() - 0.5) * 900; pos[i * 3 + 1] = -10 + rnd() * 30; pos[i * 3 + 2] = -360 + rnd() * 460; sd[i * 4] = rnd(); sd[i * 4 + 1] = rnd(); sd[i * 4 + 2] = rnd(); sd[i * 4 + 3] = rnd(); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.BufferAttribute(sd, 4));
      this.embers = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: { time: U.time, px: { value: 600 } }, vertexShader: EMBER_V, fragmentShader: EMBER_F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); this.embers.frustumCulled = false; this.embers.renderOrder = 6; S.add(this.embers); }
    // lights: the fire at his back (it flickers), a red wash from the sky, and just enough from the front to read his face
    this.back = new THREE.PointLight(0xff7a22, 3.4, 0, 0); this.back.position.set(-40, 90, -150); S.add(this.back);
    this.back2 = new THREE.PointLight(0xff4a14, 2.2, 0, 0); this.back2.position.set(140, 40, -110); S.add(this.back2);
    const key = new THREE.DirectionalLight(0xffd2a8, 1.9); key.position.set(-0.5, 0.8, 1); S.add(key);
    S.add(new THREE.HemisphereLight(0xa02818, 0x401008, 1.3));
    // CornPop and the sausage shotgun
    const CP = this.cp = game.cpAsset.instance(); CP.root.scale.setScalar(40); CP.root.rotation.y = 0.32; S.add(CP.root); CP.root.traverse(o => { o.frustumCulled = false; });
    CP.setState('idle', 0, true); if (CP.face) CP.face.set('evil', 3);
    const B = {}; CP.root.traverse(o => { if (o.isBone) B[o.name] = o; }); this.B = B;
    const gun = this.gun = makeShotgun(); gun.scale.setScalar(0.0235); CP.root.add(gun);
    for (const m of gun.userData.mats) m.envMapIntensity = 0.55;
    this.grinT = 5; this.boltT = 6 + Math.random() * 6; this.v = { a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), d: new THREE.Vector3(), q: new THREE.Quaternion(), q2: new THREE.Quaternion(), m: new THREE.Matrix4() };
  }

  // turn `bone` (world space) so that the line to `child` points along `dir`
  aim(bone, child, dir) {
    const V = this.v, p0 = bone.getWorldPosition(V.a), p1 = child.getWorldPosition(V.b), cur = p1.sub(p0).normalize();
    V.q.setFromUnitVectors(cur, dir); const wq = bone.getWorldQuaternion(V.q2); wq.premultiply(V.q);
    const pq = bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert(); bone.quaternion.copy(pq.multiply(wq)); bone.updateWorldMatrix(false, true);
  }
  // two-bone reach: shoulder -> elbow -> hand lands on `target`; the elbow swings out toward `pole`
  reach(up, lo, hand, target, pole) {
    const S = up.getWorldPosition(new THREE.Vector3()), E0 = lo.getWorldPosition(new THREE.Vector3()), H0 = hand.getWorldPosition(new THREE.Vector3());
    const a = S.distanceTo(E0), b = E0.distanceTo(H0), to = target.clone().sub(S), d = Math.min(to.length(), (a + b) * 0.995), dir = to.normalize();
    const ca = Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))), sa = Math.sqrt(1 - ca * ca), side = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
    const E = S.clone().add(dir.clone().multiplyScalar(a * ca)).add(side.multiplyScalar(a * sa)), T = S.clone().add(dir.multiplyScalar(d));
    this.aim(up, lo, E.clone().sub(S).normalize()); this.aim(lo, hand, T.sub(lo.getWorldPosition(new THREE.Vector3())).normalize());
  }

  render(dt) {
    const g = this.game, R = g.renderer, U = this.U, B = this.B, CP = this.cp, cam = this.cam; this.t += dt; U.time.value = this.t; const t = this.t;
    const fl = 0.82 + 0.1 * Math.sin(t * 9.1) + 0.08 * Math.sin(t * 23.7 + 1.3) + 0.06 * Math.sin(t * 5.3); U.flick.value = fl; this.back.intensity = 3.4 * fl; this.back2.intensity = 2.2 * (0.8 + 0.2 * Math.sin(t * 13 + 2));
    this.boltT -= dt; if (this.boltT <= 0) { this.boltT = 7 + Math.random() * 10; this.flashV = 1; } this.flashV = Math.max(0, (this.flashV || 0) - dt * 3.5); U.flash.value = this.flashV * (0.6 + 0.4 * Math.sin(t * 60));
    this.grinT -= dt; if (this.grinT <= 0 && CP.face) { this.grinT = 6 + Math.random() * 5; CP.face.set('evil', 3.2); }
    // camera: a slow drift low in front of him. On a wide screen he stands to the left and the menu takes the right.
    const size = R.getDrawingBufferSize(new THREE.Vector2()), asp = size.x / Math.max(1, size.y), wide = asp > 1.25;
    cam.aspect = asp; cam.fov = wide ? 36 : 50; cam.updateProjectionMatrix();
    const sway = Math.sin(t * 0.17) * 0.16, dist = wide ? 178 : 215, ex = Math.sin(0.12 + sway) * dist, ez = Math.cos(0.12 + sway) * dist;
    cam.position.set(ex, 30 + Math.sin(t * 0.23) * 3, ez); const tx = wide ? 34 * Math.min(1.6, asp / 1.78) : 0; cam.lookAt(tx * Math.cos(sway), wide ? 47 : 58, -tx * Math.sin(sway));
    this.embers.material.uniforms.px.value = size.y * 0.9;
    for (const f of this.fires) f.quaternion.copy(cam.quaternion);
    // CornPop: the idle animation plays, then both arms are put on the gun
    CP.update(dt); CP.root.updateWorldMatrix(true, true);
    const up = B.UpperChest || B.Chest, Rs = B.RightUpperArm, Ls = B.LeftUpperArm;
    if (up && Rs && Ls && B.RightHand && B.LeftHand) {
      const root = CP.root, loc = v => root.worldToLocal(v.clone()), wld = v => root.localToWorld(v.clone());
      const rs = loc(Rs.getWorldPosition(new THREE.Vector3())), ls = loc(Ls.getWorldPosition(new THREE.Vector3())), mid = rs.clone().add(ls).multiplyScalar(0.5), rgt = rs.clone().sub(ls).setY(0).normalize(), fwd = new THREE.Vector3(0, 0, 1);
      // the gun, raised in his right hand: muzzle to the sky and a little outward, side-on to the camera so it reads. His arms are
      // short, so the grip sits just below and in front of the shoulder (all in his own space: it moves with his breathing).
      const back = fwd.clone().negate(), dir = rgt.clone().multiplyScalar(0.36).add(new THREE.Vector3(0, 0.86, 0)).add(back.clone().multiplyScalar(0.26)).normalize();
      const grip = rs.clone().add(rgt.clone().multiplyScalar(0.13)).add(new THREE.Vector3(0, -0.2 + Math.sin(this.t * 1.1) * 0.006, 0)).add(fwd.clone().multiplyScalar(0.25));
      const zA = dir.clone().negate(), x0 = fwd.clone().multiplyScalar(0.9).add(rgt.clone().multiplyScalar(-0.35)), yA = zA.clone().cross(x0).normalize(), xA = yA.clone().cross(zA).normalize();
      this.gun.quaternion.setFromRotationMatrix(this.v.m.makeBasis(xA, yA, zA)); const sc = this.gun.scale.x;
      const P = (x, y, z) => grip.clone().add(xA.clone().multiplyScalar(x * sc)).add(yA.clone().multiplyScalar(y * sc)).add(zA.clone().multiplyScalar(z * sc));   // a point of the gun in his space, in gun units from the hand on the wrist of the stock
      this.gun.position.copy(P(0, 3.4, -9.5));                                      // (the model's origin is the hinge, ahead of and above that wrist)
      const pole = wld(rs.clone().add(rgt.clone().multiplyScalar(1)).add(new THREE.Vector3(0, -0.9, -0.3))).sub(wld(rs)).normalize();
      this.reach(Rs, B.RightLowerArm, B.RightHand, wld(P(0, -0.6, 0)), pole);
      if (B.RightHand_End) this.aim(B.RightHand, B.RightHand_End, dir.clone().multiplyScalar(0.55).add(fwd.clone().multiplyScalar(0.6)).add(rgt.clone().multiplyScalar(-0.5)).normalize().transformDirection(root.matrixWorld));
    }
    R.setRenderTarget(null); const ac = R.autoClear; R.autoClear = true; R.setViewport(0, 0, size.x / R.getPixelRatio(), size.y / R.getPixelRatio()); R.setScissorTest(false); R.setClearColor(0x000000); R.render(this.scene, cam); R.autoClear = ac;
  }
}
