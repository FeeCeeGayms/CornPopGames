// Small particle engine on THREE.Points: sparks, smoke, sludge splashes, ash.
import * as THREE from 'three';
import { glowSprite } from './textures.js';

const VERT = `
attribute float size; attribute float alpha; attribute vec3 tint;
varying float vAlpha; varying vec3 vTint;
void main() {
  vAlpha = alpha; vTint = tint;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * (300.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = `
uniform sampler2D map; varying float vAlpha; varying vec3 vTint;
void main() {
  vec4 c = texture2D(map, gl_PointCoord);
  gl_FragColor = vec4(vTint * c.rgb, c.a * vAlpha);
  if (gl_FragColor.a < 0.01) discard;
}`;

export class Particles {
  constructor(scene, max = 1200, additive = true) {
    this.max = max;
    this.n = 0;
    this.p = new Float32Array(max * 3);
    this.v = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.size0 = new Float32Array(max);
    this.size1 = new Float32Array(max);
    this.grav = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.p, 3);
    this.sizeAttr = new THREE.BufferAttribute(new Float32Array(max), 1);
    this.alphaAttr = new THREE.BufferAttribute(new Float32Array(max), 1);
    this.tintAttr = new THREE.BufferAttribute(new Float32Array(max * 3), 3);
    for (const a of [this.posAttr, this.sizeAttr, this.alphaAttr, this.tintAttr]) a.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.posAttr);
    g.setAttribute('size', this.sizeAttr);
    g.setAttribute('alpha', this.alphaAttr);
    g.setAttribute('tint', this.tintAttr);
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: glowSprite('#ffffff') } },
      vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(g, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  emit(x, y, z, vx, vy, vz, { life = 0.6, size = 0.5, size1 = null, color = [1, 1, 1], gravity = 0 } = {}) {
    if (this.n >= this.max) return;
    const i = this.n++;
    this.p[i * 3] = x; this.p[i * 3 + 1] = y; this.p[i * 3 + 2] = z;
    this.v[i * 3] = vx; this.v[i * 3 + 1] = vy; this.v[i * 3 + 2] = vz;
    this.life[i] = this.maxLife[i] = life;
    this.size0[i] = size; this.size1[i] = size1 ?? size;
    this.grav[i] = gravity;
    const t = this.tintAttr.array;
    t[i * 3] = color[0]; t[i * 3 + 1] = color[1]; t[i * 3 + 2] = color[2];
  }

  update(dt) {
    const sz = this.sizeAttr.array, al = this.alphaAttr.array, t = this.tintAttr.array;
    let i = 0;
    while (i < this.n) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) { // swap-remove
        const j = --this.n;
        for (let k = 0; k < 3; k++) { this.p[i * 3 + k] = this.p[j * 3 + k]; this.v[i * 3 + k] = this.v[j * 3 + k]; t[i * 3 + k] = t[j * 3 + k]; }
        this.life[i] = this.life[j]; this.maxLife[i] = this.maxLife[j]; this.size0[i] = this.size0[j]; this.size1[i] = this.size1[j]; this.grav[i] = this.grav[j];
        continue;
      }
      this.v[i * 3 + 1] -= this.grav[i] * dt;
      this.p[i * 3] += this.v[i * 3] * dt; this.p[i * 3 + 1] += this.v[i * 3 + 1] * dt; this.p[i * 3 + 2] += this.v[i * 3 + 2] * dt;
      const f = this.life[i] / this.maxLife[i];
      sz[i] = this.size1[i] + (this.size0[i] - this.size1[i]) * f;
      al[i] = Math.min(1, f * 2);
      i++;
    }
    this.points.geometry.setDrawRange(0, this.n);
    this.posAttr.needsUpdate = this.sizeAttr.needsUpdate = this.alphaAttr.needsUpdate = this.tintAttr.needsUpdate = true;
  }

  clear() { this.n = 0; }
}

// Falling ash (or snow) that follows the camera. A track picks the style.
export const WEATHER = {
  ash: { color: 0xd8dccb, size: 0.12, count: 900, fall: 1.2, sway: 0.6, opacity: 0.75 },
  snow: { color: 0xffffff, size: 0.2, count: 1600, fall: 2.4, sway: 1.4, opacity: 0.9 },
  clear: { color: 0xffffff, size: 0.1, count: 0, fall: 0, sway: 0, opacity: 0 },
  blizzard: { color: 0xffffff, size: 0.24, count: 3200, fall: 5, sway: 3, wind: 9, opacity: 0.95 },
};

export class Ash {
  constructor(scene, max = 3200) {
    this.max = max;
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(max * 3);
    for (let i = 0; i < max; i++) {
      this.pos[i * 3] = (Math.random() - 0.5) * 80;
      this.pos[i * 3 + 1] = Math.random() * 30;
      this.pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.points = new THREE.Points(g, new THREE.PointsMaterial({ transparent: true, depthWrite: false }));
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.t = 0;
    this.setStyle('ash');
  }
  setStyle(name) {
    const w = (this.style = WEATHER[name] || WEATHER.ash);
    this.count = Math.min(this.max, w.count);
    Object.assign(this.points.material, { size: w.size, opacity: w.opacity });
    this.points.material.color.set(w.color);
    this.points.geometry.setDrawRange(0, this.count);
  }
  update(dt, center) {
    this.t += dt;
    const p = this.pos, w = this.style;
    for (let i = 0; i < this.count; i++) {
      p[i * 3 + 1] -= dt * (w.fall + (i % 5) * 0.2);
      p[i * 3] += Math.sin(this.t + i) * dt * w.sway + dt * (w.wind || 0);
      let x = p[i * 3] - center.x, y = p[i * 3 + 1] - center.y, z = p[i * 3 + 2] - center.z;
      if (y < -5) p[i * 3 + 1] = center.y + 25;
      if (x > 40) p[i * 3] -= 80; else if (x < -40) p[i * 3] += 80;
      if (z > 40) p[i * 3 + 2] -= 80; else if (z < -40) p[i * 3 + 2] += 80;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}

// Rain: streaks falling fast around the camera, slanted by the wind.
export class Rain {
  constructor(scene, max = 1600) {
    this.max = max;
    this.pos = new Float32Array(max * 6);
    this.seed = new Float32Array(max * 3);
    for (let i = 0; i < max; i++) { this.seed[i * 3] = (Math.random() - 0.5) * 60; this.seed[i * 3 + 1] = Math.random() * 30; this.seed[i * 3 + 2] = (Math.random() - 0.5) * 60; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ transparent: true, depthWrite: false }));
    this.lines.frustumCulled = false;
    this.lines.visible = false;
    scene.add(this.lines);
    this.style = null;
  }
  setStyle(style) { // { color, count, fall, wind, opacity } or null for none
    this.style = style;
    this.lines.visible = !!style;
    if (!style) return;
    this.count = Math.min(this.max, style.count);
    this.lines.material.color.set(style.color);
    this.lines.material.opacity = style.opacity;
    this.lines.geometry.setDrawRange(0, this.count * 2);
  }
  update(dt, center) {
    const w = this.style;
    if (!w) return;
    const s = this.seed, p = this.pos, len = 0.045;
    for (let i = 0; i < this.count; i++) {
      s[i * 3 + 1] -= dt * w.fall * (0.85 + (i % 7) * 0.05);
      s[i * 3] += dt * w.wind;
      if (s[i * 3 + 1] < -8) { s[i * 3 + 1] += 34; s[i * 3] = (Math.random() - 0.5) * 60; s[i * 3 + 2] = (Math.random() - 0.5) * 60; }
      let x = s[i * 3], z = s[i * 3 + 2];
      x = ((x - center.x + 30) % 60 + 60) % 60 - 30 + center.x; // keep the shower centred on the camera
      z = ((z - center.z + 30) % 60 + 60) % 60 - 30 + center.z;
      const y = center.y + s[i * 3 + 1];
      p[i * 6] = x; p[i * 6 + 1] = y; p[i * 6 + 2] = z;
      p[i * 6 + 3] = x - w.wind * len; p[i * 6 + 4] = y + w.fall * len; p[i * 6 + 5] = z;
    }
    this.lines.geometry.attributes.position.needsUpdate = true;
  }
}
