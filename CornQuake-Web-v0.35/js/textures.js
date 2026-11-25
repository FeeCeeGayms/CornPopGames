// Procedural "id-style" textures. Every texture is a small RGBA DataTexture.
// Alpha channel is used as a FULLBRIGHT mask (Quake style): alpha 255 = lit by lightmap,
// alpha 0 = glows at full brightness regardless of lighting.
import * as THREE from 'three';

let seed = 1337;
function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
function srand(s) { seed = (s >>> 0) % 2147483647 || 1; }

class Pix {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Float32Array(w * h * 4); for (let i = 3; i < this.d.length; i += 4) this.d[i] = 1; }
  idx(x, y) { x = ((x % this.w) + this.w) % this.w; y = ((y % this.h) + this.h) % this.h; return (y * this.w + x) * 4; }
  set(x, y, c, glow) { const i = this.idx(x | 0, y | 0); this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; if (glow !== undefined) this.d[i + 3] = 1 - glow; }
  get(x, y) { const i = this.idx(x | 0, y | 0); return [this.d[i], this.d[i + 1], this.d[i + 2]]; }
  mul(x, y, k) { const i = this.idx(x | 0, y | 0); this.d[i] *= k; this.d[i + 1] *= k; this.d[i + 2] *= k; }
  add(x, y, c) { const i = this.idx(x | 0, y | 0); this.d[i] += c[0]; this.d[i + 1] += c[1]; this.d[i + 2] += c[2]; }
  fill(c, n = 0) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const k = 1 + (rnd() - 0.5) * n; this.set(x, y, [c[0] * k, c[1] * k, c[2] * k]); } }
  rect(x0, y0, w, h, c, n = 0, glow) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const k = 1 + (rnd() - 0.5) * n; this.set(x, y, [c[0] * k, c[1] * k, c[2] * k], glow); } }
  shade(x0, y0, w, h, k) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.mul(x, y, k); }
  bevel(x0, y0, w, h, hi = 1.25, lo = 0.7) {
    for (let x = x0; x < x0 + w; x++) { this.mul(x, y0, hi); this.mul(x, y0 + h - 1, lo); }
    for (let y = y0 + 1; y < y0 + h - 1; y++) { this.mul(x0, y, hi); this.mul(x0 + w - 1, y, lo); }
  }
  speckle(count, k0, k1) { for (let i = 0; i < count; i++) this.mul(rnd() * this.w, rnd() * this.h, k0 + rnd() * (k1 - k0)); }
  // smooth value noise multiplied in
  cloudy(scale, amt) {
    const g = 8, grid = [];
    for (let i = 0; i < g * g; i++) grid.push(rnd());
    const s = (x, y) => grid[((y % g + g) % g) * g + ((x % g + g) % g)];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const fx = x / this.w * g * scale, fy = y / this.h * g * scale;
      const ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const v = (s(ix, iy) * (1 - sx) + s(ix + 1, iy) * sx) * (1 - sy) + (s(ix, iy + 1) * (1 - sx) + s(ix + 1, iy + 1) * sx) * sy;
      this.mul(x, y, 1 + (v - 0.5) * amt);
    }
  }
  drips(count, k) { for (let i = 0; i < count; i++) { const x = rnd() * this.w | 0; let y = rnd() * this.h | 0; const len = 4 + rnd() * this.h * 0.6; for (let j = 0; j < len; j++) this.mul(x, y + j, k + (j / len) * (1 - k)); } }
  rivet(x, y) { this.mul(x, y, 1.6); this.mul(x + 1, y + 1, 0.5); this.mul(x + 1, y, 0.9); this.mul(x, y + 1, 0.9); }
  toNormalMap(strength = 1.5) {
    const out = new Uint8Array(this.w * this.h * 4);
    const h = (x, y) => {
      const i = this.idx(x, y);
      return (this.d[i] + this.d[i+1] + this.d[i+2]) / 3;
    };
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const dx = (h(x+1, y) - h(x-1, y)) * strength;
      const dy = (h(x, y+1) - h(x, y-1)) * strength;
      const dz = 1.0 / Math.sqrt(dx*dx + dy*dy + 1);
      const nx = -dx * dz, ny = -dy * dz, nz = dz;
      const i = (y * this.w + x) * 4;
      out[i] = Math.round((nx * 0.5 + 0.5) * 255);
      out[i+1] = Math.round((ny * 0.5 + 0.5) * 255);
      out[i+2] = Math.round((nz * 0.5 + 0.5) * 255);
      out[i+3] = 255;
    }
    const t = new THREE.DataTexture(out, this.w, this.h, THREE.RGBAFormat);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestMipmapNearestFilter;
    t.generateMipmaps = true;
    t.needsUpdate = true;
    return t;
  }
  toTexture(opts = {}) {
    const out = new Uint8Array(this.w * this.h * 4);
    for (let i = 0; i < out.length; i++) out[i] = Math.max(0, Math.min(255, Math.round(this.d[i] * 255)));
    const t = new THREE.DataTexture(out, this.w, this.h, THREE.RGBAFormat);
    t.wrapS = t.wrapT = opts.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
    t.magFilter = THREE.NearestFilter;
    t.minFilter = opts.noMip ? THREE.NearestFilter : THREE.NearestMipmapNearestFilter;
    t.generateMipmaps = !opts.noMip;
    t.colorSpace = THREE.NoColorSpace;
    t.needsUpdate = true;
    t.userData = { w: this.w, h: this.h };
    return t;
  }
}

const hex = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];

function bricks(base, mortar, rowH, brickW, var_, s) {
  srand(s); const p = new Pix(64, 64); p.fill(mortar, 0.2);
  for (let r = 0; r < 64 / rowH; r++) {
    const off = (r % 2) * brickW / 2;
    for (let b = -1; b < 64 / brickW + 1; b++) {
      const k = 1 + (rnd() - 0.5) * var_;
      const c = [base[0] * k, base[1] * k * (0.95 + rnd() * 0.1), base[2] * k];
      const x0 = b * brickW + off + 1, y0 = r * rowH + 1;
      for (let y = y0; y < y0 + rowH - 1; y++) for (let x = x0; x < x0 + brickW - 1; x++) {
        if (x < 0 || x >= 64) continue; const n = 1 + (rnd() - 0.5) * 0.25; p.set(x, y, [c[0] * n, c[1] * n, c[2] * n]);
      }
      for (let x = x0; x < x0 + brickW - 1; x++) if (x >= 0 && x < 64) { p.mul(x, y0, 1.18); p.mul(x, y0 + rowH - 2, 0.75); }
    }
  }
  p.cloudy(1, 0.5); p.speckle(120, 0.5, 0.8);
  return p;
}

function steelPanels(base, s, rivets = true, drip = true) {
  srand(s); const p = new Pix(64, 64); p.fill(base, 0.12); p.cloudy(1, 0.45);
  for (const [x0, y0, w, h] of [[0, 0, 64, 32], [0, 32, 32, 32], [32, 32, 32, 32]]) {
    p.bevel(x0, y0, w, h, 1.35, 0.55);
    if (rivets) { for (let x = x0 + 3; x < x0 + w - 2; x += 6) { p.rivet(x, y0 + 3); p.rivet(x, y0 + h - 4); } for (let y = y0 + 9; y < y0 + h - 4; y += 6) { p.rivet(x0 + 3, y); p.rivet(x0 + w - 4, y); } }
  }
  if (drip) p.drips(18, 0.7);
  p.speckle(80, 0.6, 1.3);
  return p;
}

function makeAll() {
  const T = {};
  // ---- walls ----
  T.brick = bricks(hex(0x4a3a32), hex(0x1a1614), 8, 16, 0.4, 11).toTexture();
  T.brickdark = bricks(hex(0x3a322e), hex(0x141210), 8, 16, 0.35, 12).toTexture();
  T.brickred = bricks(hex(0x6a2a20), hex(0x201410), 8, 16, 0.35, 13).toTexture();
  T.steel = steelPanels(hex(0x2e3034), 21).toTexture();
  T.steelNormal = steelPanels(hex(0x2e3034), 21).toNormalMap(2.2);
  T.steeldark = steelPanels(hex(0x1e2024), 22).toTexture();
  T.steeldarkNormal = steelPanels(hex(0x1e2024), 22).toNormalMap(2.2);
  { srand(23); const p = steelPanels(hex(0x5a4a3a), 23, true, true); p.speckle(300, 0.6, 1.4); T.rustpanel = p.toTexture(); }
  { srand(31); const p = new Pix(64, 64); p.fill(hex(0x8a3418), 0.25); p.cloudy(1, 0.8); p.speckle(500, 0.5, 1.5);
    for (let i = 0; i < 40; i++) { const x = rnd() * 64, y = rnd() * 64, r = 1 + rnd() * 3; for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) if (a * a + b * b <= r * r) p.mul(x + a, y + b, 0.6); }
    for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x++) { p.mul(x, y, 0.55); p.mul(x, y + 1, 1.2); }
    T.rust = p.toTexture(); }
  { srand(41); const p = new Pix(64, 64); p.fill(hex(0x3c3a38), 0.22); p.cloudy(1, 0.6); p.speckle(300, 0.5, 1.3);
    // cracks and stains
    for (let c = 0; c < 6; c++) { let x = rnd() * 64, y = rnd() * 64; for (let i = 0; i < 40; i++) { p.mul(x, y, 0.45); x += (rnd() - 0.5) * 2.2; y += rnd() * 1.6; } }
    for (let x = 0; x < 64; x++) { p.mul(x, 0, 0.6); p.mul(x, 32, 0.6); } T.concrete = p.toTexture(); }
  { srand(42); const p = new Pix(64, 64); p.fill(hex(0x2e2c2a), 0.2); p.cloudy(1, 0.7); p.speckle(280, 0.5, 1.25); p.drips(30, 0.65); T.concretedark = p.toTexture(); }
  { srand(43); const p = new Pix(64, 64); p.fill(hex(0x6a6355), 0.15); p.cloudy(1, 0.4);
    for (let y = 0; y < 64; y += 16) p.bevel(0, y, 64, 16, 1.3, 0.6); p.speckle(150, 0.6, 1.2); T.stepside = p.toTexture(); }
  // ---- floors ----
  { srand(51); const p = new Pix(64, 64); p.fill(hex(0x2a2b2e), 0.15);
    for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) { const k = 0.8 + rnd() * 0.35; p.shade(tx * 32, ty * 32, 32, 32, k); p.bevel(tx * 32, ty * 32, 32, 32, 1.3, 0.45); }
    p.cloudy(1, 0.6); p.speckle(180, 0.6, 1.4); 
    // wet sheen
    for (let i = 0; i < 40; i++) { const x = rnd()*64, y = rnd()*64; p.mul(x, y, 1.4); } T.tile = p.toTexture(); }
  { srand(52); const p = new Pix(64, 64); p.fill(hex(0x4a3a2e), 0.12);
    for (let ty = 0; ty < 4; ty++) for (let tx = 0; tx < 4; tx++) { const k = 0.8 + rnd() * 0.35; p.shade(tx * 16, ty * 16, 16, 16, k); p.bevel(tx * 16, ty * 16, 16, 16, 1.2, 0.55); }
    p.cloudy(1, 0.6); p.speckle(250, 0.6, 1.4); T.tilebrown = p.toTexture(); }
  { srand(53); const p = new Pix(64, 64); p.fill(hex(0x232427), 0.3); p.cloudy(2, 0.7); p.speckle(600, 0.5, 1.6);
    for (let i = 0; i < 5; i++) { const x = rnd() * 64, y = rnd() * 64, rx = 4 + rnd() * 10, ry = 2 + rnd() * 5; for (let a = -rx; a <= rx; a++) for (let b = -ry; b <= ry; b++) if ((a / rx) ** 2 + (b / ry) ** 2 <= 1) p.set(x + a, y + b, [0.1 + rnd() * 0.03, 0.1, 0.13]); }
    T.asphalt = p.toTexture(); }
  { srand(54); const p = new Pix(64, 64); p.fill(hex(0x2d2e30), 0.1);
    for (let y = 0; y < 64; y += 4) for (let x = 0; x < 64; x++) { p.mul(x, y, 0.35); }
    for (let x = 0; x < 64; x += 4) for (let y = 0; y < 64; y++) { p.mul(x, y, 0.35); }
    p.bevel(0, 0, 64, 64, 1.4, 0.5); p.cloudy(1, 0.5); T.grate = p.toTexture(); }
  { srand(55); const p = new Pix(64, 64); p.fill(hex(0x4a4c50), 0.08);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (((x + (y >> 3) * 4) % 8 === 0) && (y % 8 < 4)) p.mul(x, y, 1.5);
    p.bevel(0, 0, 64, 64, 1.3, 0.6); p.cloudy(1, 0.4); p.speckle(80, 0.6, 1.2); T.diamond = p.toTexture(); }
  // ---- ceiling ----
  { srand(61); const p = new Pix(64, 64); p.fill(hex(0x2c2b2a), 0.12); p.cloudy(1, 0.5);
    p.bevel(0, 0, 64, 64, 1.3, 0.5); p.bevel(4, 4, 56, 56, 0.7, 1.2); p.speckle(100, 0.6, 1.3); T.ceil = p.toTexture(); }
  // ---- wood / furniture ----
  { srand(71); const p = new Pix(64, 64); p.fill(hex(0x5a3a22), 0.1);
    for (let x = 0; x < 64; x++) { const g = 0.85 + 0.3 * Math.sin(x * 0.9 + rnd()); for (let y = 0; y < 64; y++) p.mul(x, y, g * (1 + (rnd() - 0.5) * 0.15)); }
    for (let x = 0; x < 64; x += 16) for (let y = 0; y < 64; y++) p.mul(x, y, 0.5); T.wood = p.toTexture(); }
  { srand(72); const p = new Pix(64, 64); p.fill(hex(0x5e3e26), 0.12); p.cloudy(1, 0.4);
    for (const y0 of [0, 32]) { p.bevel(1, y0 + 1, 62, 30, 1.35, 0.5); p.rect(22, y0 + 13, 20, 3, hex(0x9a9a92), 0.1); p.bevel(22, y0 + 13, 20, 3, 1.4, 0.6); }
    p.speckle(120, 0.6, 1.3); T.drawer = p.toTexture(); }
  { srand(73); const p = new Pix(64, 64); p.fill(hex(0x55585a), 0.08); p.cloudy(1, 0.35);
    for (const y0 of [0, 32]) { p.bevel(1, y0 + 1, 62, 30, 1.35, 0.5); p.rect(18, y0 + 6, 28, 2, hex(0xb0b0aa), 0.1); }
    p.speckle(120, 0.6, 1.3); T.cabinet = p.toTexture(); }
  { srand(74); const p = new Pix(64, 64); p.fill(hex(0x141416), 0.15);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const v = Math.sin(x * 0.3) * Math.sin(y * 0.25); if (v > 0.8) p.mul(x, y, 2.2); }
    p.bevel(0, 0, 64, 32, 1.6, 0.5); p.bevel(0, 32, 64, 32, 1.6, 0.5); T.leather = p.toTexture(); }
  { srand(75); const p = new Pix(64, 64); p.fill(hex(0xa07a4a), 0.12); p.cloudy(1, 0.3);
    p.rect(0, 28, 64, 8, hex(0xc9b48a), 0.05); // tape
    // red "PIZZA" stamp blob
    p.rect(8, 8, 20, 10, hex(0xa02818), 0.2); p.rect(10, 10, 16, 6, hex(0xa07a4a), 0.1); p.rect(12, 12, 12, 2, hex(0xa02818), 0.1);
    p.bevel(0, 0, 64, 64, 1.2, 0.6); p.speckle(120, 0.7, 1.2); T.pizzabox = p.toTexture(); }
  { srand(76); const p = new Pix(64, 64); p.fill(hex(0x6a5a40), 0.12); p.cloudy(1, 0.4);
    for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x++) p.mul(x, y, 0.5);
    p.bevel(0, 0, 64, 64, 1.3, 0.5); for (let i = 0; i < 64; i++) { p.mul(i, i, 0.7); p.mul(63 - i, i, 0.7); } T.crate = p.toTexture(); }
  // ---- doors (metallic bunker style) ----
  const door = (stripe, s, sym) => {
    srand(s); const p = steelPanels(hex(0x2a2c30), s, true, false);
    // heavier frame
    p.rect(0, 0, 64, 4, hex(0x1a1c1e), 0.05); p.rect(0, 60, 64, 4, hex(0x1a1c1e), 0.05);
    p.rect(0, 0, 4, 64, hex(0x1a1c1e), 0.05); p.rect(60, 0, 4, 64, hex(0x1a1c1e), 0.05);
    // center panel with stripe
    p.rect(8, 20, 48, 24, stripe, 0.08); p.bevel(8, 20, 48, 24, 1.4, 0.5);
    // rivets around panel
    for (let x = 12; x < 52; x += 8) { p.rivet(x, 22); p.rivet(x, 40); }
    for (let y = 26; y < 40; y += 6) { p.rivet(10, y); p.rivet(52, y); }
    if (sym) { // glowing key indicator
      p.rect(24, 28, 16, 8, [stripe[0]*1.8, stripe[1]*1.8, stripe[2]*1.8], 0, 0.9);
      p.rect(28, 30, 8, 4, [0.05,0.05,0.05], 0, 0);
    }
    // handle
    p.rect(46, 30, 6, 4, hex(0x4a4e52), 0.1); p.bevel(46, 30, 6, 4, 1.3, 0.6);
    return p.toTexture();
  };
  T.door = door(hex(0x3a3c40), 81, false);
  T.door_red = door(hex(0xb01010), 82, true);
  T.door_blue = door(hex(0x1040c0), 83, true);
  T.door_gold = door(hex(0xc09010), 84, true);
  { srand(85); const p = new Pix(64, 64); p.fill(hex(0x6a6a6e), 0.08); p.cloudy(1, 0.3);
    for (let y = 0; y < 64; y += 8) { p.bevel(0, y, 64, 8, 1.3, 0.6); } p.speckle(80, 0.7, 1.3); T.trim = p.toTexture(); }
  // ---- light fixtures (fullbright) ----
  const lightTex = (c, s) => { srand(s); const p = new Pix(64, 16); p.fill(hex(0x3a3a3a), 0.1); p.rect(3, 4, 58, 8, c, 0.05, 1); p.bevel(0, 0, 64, 16, 1.3, 0.6); p.bevel(3, 4, 58, 8, 1.1, 0.9); return p.toTexture(); };
  T.light = lightTex([1, 1, 0.95], 91); T.lightred = lightTex([1, 0.15, 0.1], 92); T.lightamber = lightTex([1, 0.7, 0.3], 93); T.lightblue = lightTex([0.4, 0.75, 1], 94);
  { srand(95); const p = new Pix(16, 16); p.fill([1, 0.85, 0.55], 0.1); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p.set(x, y, p.get(x, y), 1); T.glow = p.toTexture(); }
  { srand(96); const p = new Pix(16, 16); p.fill([1, 0.1, 0.05], 0.1); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p.set(x, y, p.get(x, y), 1); T.glowred = p.toTexture(); }
  // ---- pizza ----
  { srand(101); const S = 128, p = new Pix(S, S); p.fill(hex(0x8a5a2a), 0.1); const c = S / 2;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const r = Math.hypot(x - c + 0.5, y - c + 0.5) / c;
      if (r > 0.86) p.set(x, y, [0.72 + rnd() * 0.08, 0.45 + rnd() * 0.06, 0.2]);
      else if (r > 0.8) p.set(x, y, [0.62, 0.3, 0.12]);
      else { const k = 0.85 + rnd() * 0.3; p.set(x, y, [0.95 * k, 0.68 * k, 0.22 * k]); } }
    p.cloudy(2, 0.35);
    for (let i = 0; i < 260; i++) { const x = rnd() * S, y = rnd() * S; if (Math.hypot(x - c, y - c) > c * 0.78) continue; p.set(x, y, [0.75, 0.25, 0.08]); }
    for (let i = 0; i < 34; i++) { let x, y; do { x = rnd() * S; y = rnd() * S; } while (Math.hypot(x - c, y - c) > c * 0.7);
      const r = 5 + rnd() * 2; for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) { const d = (a * a + b * b) / (r * r); if (d <= 1) p.set(x + a, y + b, [0.62 - d * 0.2 + rnd() * 0.05, 0.1, 0.06]); } }
    T.pizza = p.toTexture({ clamp: true }); }
  { srand(102); const p = new Pix(64, 64); for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const k = 0.85 + rnd() * 0.3; p.set(x, y, [0.95 * k, 0.66 * k, 0.24 * k]); }
    p.cloudy(1, 0.4);
    for (let i = 0; i < 6; i++) { const x = rnd() * 64, y = rnd() * 64, r = 5; for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) { const d = (a * a + b * b) / (r * r); if (d <= 1) p.set(x + a, y + b, [0.62 - d * 0.2, 0.1, 0.06]); } }
    for (let i = 0; i < 10; i++) { const x = rnd() * 64, y = rnd() * 64; p.rect(x, y, 4, 2, hex(0x2f7a22), 0.2); }
    for (let i = 0; i < 8; i++) { const x = rnd() * 64, y = rnd() * 64; p.rect(x, y, 3, 3, hex(0xc02a1a), 0.2); }
    T.pizzasq = p.toTexture(); }
  { srand(103); const p = new Pix(32, 32); p.fill(hex(0xb07a3a), 0.2); p.cloudy(1, 0.4); T.crust = p.toTexture(); }
  // ---- misc ----
  { srand(111); const p = new Pix(64, 64); p.fill(hex(0x2a2018), 0.2); p.cloudy(1, 0.6);
    for (let r = 0; r < 64; r += 16) for (let c = 0; c < 64; c += 16) { const lit = rnd() > 0.55; const col = lit ? [1, 0.78 + rnd() * 0.15, 0.42] : [0.07, 0.07, 0.1];
      p.rect(c + 3, r + 3, 10, 10, col, 0.15, lit ? 0.85 : 0); p.rect(c + 2, r + 13, 12, 2, [0.25, 0.22, 0.2], 0.1); p.rect(c + 7, r + 3, 1, 10, [0.15, 0.12, 0.1], 0, 0); }
    T.building = p.toTexture(); }
  { srand(112); const p = new Pix(64, 64); p.fill(hex(0x2a2235), 0.15);
    for (let r = 0; r < 64; r += 8) for (let c = 0; c < 64; c += 6) if (rnd() > 0.5) { const lit = rnd() > 0.4; p.rect(c + 1, r + 2, 3, 4, lit ? [0.85, 0.75, 1] : [0.05, 0.05, 0.08], 0.1, lit ? 1 : 0); }
    T.building2 = p.toTexture(); }
  { srand(113); const p = new Pix(64, 64); for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) p.set(x, y, [0.3, 0.12, 0.3]); p.cloudy(1, 1.6); p.cloudy(2, 0.8); for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) p.set(x, y, p.get(x, y), 1); T.sky = p.toTexture(); }
  { srand(114); const p = new Pix(64, 64); p.fill(hex(0x101418), 0.1);
    for (let y = 2; y < 62; y += 3) for (let x = 2; x < 62; x++) if (rnd() > 0.35) p.set(x, y, rnd() > 0.5 ? [0.2, 0.9, 0.6] : [0.3, 0.6, 1], 1);
    p.bevel(0, 0, 64, 64, 1.4, 0.5); T.computer = p.toTexture(); }
  { srand(115); const p = new Pix(32, 32); p.fill(hex(0x1a1a1c), 0.1); p.rect(4, 4, 24, 24, hex(0x5a0808), 0.1); for (let y = 8; y < 24; y++) for (let x = 8; x < 24; x++) if (Math.hypot(x - 15.5, y - 15.5) < 7) p.set(x, y, [1, 0.12 + 0.1 * (y < 13), 0.08], 1); p.bevel(0, 0, 32, 32, 1.4, 0.5); T.button = p.toTexture(); }
  { srand(116); const p = new Pix(32, 32); p.fill(hex(0x1a1a1c), 0.1); p.rect(4, 4, 24, 24, hex(0x0a3a0a), 0.1); for (let y = 8; y < 24; y++) for (let x = 8; x < 24; x++) if (Math.hypot(x - 15.5, y - 15.5) < 7) p.set(x, y, [0.2, 1, 0.3], 1); p.bevel(0, 0, 32, 32, 1.4, 0.5); T.buttongreen = p.toTexture(); }
  { srand(117); const p = new Pix(64, 64); p.fill(hex(0x202024), 0.1); for (let x = 0; x < 64; x += 8) p.bevel(x, 0, 8, 64, 1.3, 0.6); T.pipes = p.toTexture(); }
  { srand(118); const p = new Pix(64, 64); p.fill(hex(0x1c1c22), 0.2); p.cloudy(1, 0.6);
    for (let i = 0; i < 8; i++) { const x = 6 + i * 7; p.rect(x, 10, 5, 40, [0.12, 0.12, 0.14], 0.1); p.rect(x + 1, 6, 3, 4, [0.3, 0.3, 0.32], 0.1); }
    T.suits = p.toTexture(); }
  { srand(119); const p = new Pix(64, 64); p.fill(hex(0x262628), 0.08); p.bevel(0, 0, 64, 64, 1.5, 0.5); p.speckle(40, 0.6, 1.3); T.metal = p.toTexture(); }
  { srand(120); const p = new Pix(32, 32); p.fill(hex(0x8a8a8a), 0.06); p.cloudy(1, 0.3); p.bevel(0, 0, 32, 32, 1.3, 0.6); T.chrome = p.toTexture(); }

  // ---- v0.3: jail, quarters, liquids ----
  { srand(222); const p = new Pix(64, 64); p.fill([0.75, 0.85, 1], 0.06); for (let i = 0; i < 64; i += 16) for (let j = 0; j < 64; j++) { p.set(i, j, [0.2, 0.22, 0.26], 0); p.set(j, i, [0.2, 0.22, 0.26], 0); }
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (x % 16 && y % 16) p.set(x, y, p.get(x, y), 1); T.skylite = p.toTexture(); }
  const KEY = [1, 0, 1];
  { srand(220); const p = new Pix(64, 64); for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) p.set(x, y, KEY);
    for (let x = 3; x < 64; x += 8) { p.rect(x, 0, 3, 64, hex(0x3a3a3c), 0.15); for (let y = 0; y < 64; y++) { p.mul(x, y, 1.4); p.mul(x + 2, y, 0.6); } }
    for (const y of [4, 30, 58]) { p.rect(0, y, 64, 4, hex(0x2c2c2e), 0.1); p.bevel(0, y, 64, 4, 1.4, 0.6); }
    p.speckle(60, 0.6, 1.2); T.bars = p.toTexture({ noMip: true }); }
  { srand(221); const p = new Pix(64, 32); for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) p.set(x, y, KEY);
    p.rect(0, 0, 64, 3, hex(0x3a3a3c), 0.1); p.bevel(0, 0, 64, 3, 1.4, 0.6); p.rect(0, 16, 64, 2, hex(0x3a3a3c), 0.1);
    for (let x = 1; x < 64; x += 16) p.rect(x, 0, 2, 32, hex(0x343436), 0.1);
    T.railing = p.toTexture({ noMip: true }); }
  { srand(201); const p = steelPanels(hex(0x4a3e30), 201, true, true); p.speckle(400, 0.55, 1.4); p.cloudy(2, 0.4); T.jailmetal = p.toTexture(); }
  { srand(202); const p = steelPanels(hex(0x34302c), 202, true, true); p.speckle(300, 0.6, 1.3); T.jaildark = p.toTexture(); }
  { srand(203); const p = new Pix(64, 64); p.fill(hex(0xb8a888), 0.08); p.cloudy(1, 0.5); p.speckle(200, 0.8, 1.1);
    for (let c = 0; c < 5; c++) { let x = rnd() * 64, y = rnd() * 64; for (let i = 0; i < 40; i++) { p.mul(x, y, 0.45); p.mul(x + 1, y, 0.8); x += (rnd() - 0.5) * 3; y += rnd() * 1.6; } }
    p.drips(12, 0.8); T.plaster = p.toTexture(); }
  { srand(204); const p = new Pix(64, 64);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const u = Math.abs(((x + 0.5) % 32) - 16) / 16, v = Math.abs(((y + 0.5) % 32) - 16) / 16, d = Math.max(u, v), q = u + v;
      let c = hex(0x6a1810); if (d > 0.88) c = hex(0x2a1410); else if (q < 0.35) c = hex(0xc08a30); else if (Math.abs(q - 0.8) < 0.12) c = hex(0x1a3048); else if (d > 0.7 && (x + y) % 4 < 2) c = hex(0xb07a30);
      p.set(x, y, c); }
    p.speckle(300, 0.7, 1.2); p.cloudy(1, 0.3); T.carpet = p.toTexture(); }
  { srand(205); const p = new Pix(64, 64); p.fill(hex(0x2a1c12), 0.1);
    for (const y0 of [0, 32]) { let x = 2; while (x < 62) { const w = 2 + (rnd() * 4 | 0), h = 18 + (rnd() * 10 | 0); const cols = [0x7a1a12, 0x1a3a5a, 0x2a5a22, 0x8a6a2a, 0x4a2a5a, 0x6a4a2a]; const c = hex(cols[rnd() * cols.length | 0]);
        p.rect(x, y0 + 30 - h, w, h, c, 0.15); p.rect(x, y0 + 30 - h + 3, w, 1, [c[0] * 1.6, c[1] * 1.6, c[2] * 1.6], 0); x += w + (rnd() < 0.2 ? 1 : 0); }
      p.rect(0, y0 + 30, 64, 2, hex(0x4a3020), 0.1); }
    T.books = p.toTexture(); }
  { srand(206); const p = new Pix(64, 64); for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) p.set(x, y, ((x + y) >> 3) % 2 ? hex(0x1a1a1a) : hex(0xd8b018)); p.speckle(200, 0.6, 1.1); p.bevel(0, 0, 64, 64, 1.2, 0.6); T.hazard = p.toTexture(); }
  { srand(207); const p = new Pix(64, 64); p.fill(hex(0x4a4640), 0.2);
    for (let i = 0; i < 70; i++) { const x = rnd() * 64, y = rnd() * 64, r = 2 + rnd() * 5, k = 0.6 + rnd() * 0.7; for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) if (a * a + b * b <= r * r) { p.mul(x + a, y + b, k); if (b === -Math.round(r)) p.mul(x + a, y + b, 1.3); } }
    p.speckle(400, 0.5, 1.4); T.rubble = p.toTexture(); }
  { srand(208); const p = new Pix(64, 64); p.fill(hex(0x8a8a90), 0.06); for (let y = 0; y < 64; y += 8) for (let x = 0; x < 64; x++) p.mul(x, y, 0.7); T.blanket = p.toTexture(); }
  { srand(209); const p = steelPanels(hex(0x505458), 209, true, false); for (let i = 0; i < 64; i++) for (const y of [0, 1, 2, 3, 60, 61, 62, 63]) p.set(i, y, ((i >> 2) % 2) ? hex(0x111111) : hex(0xd8b018)); T.lift = p.toTexture(); }
  const liquid = (base, s, glow) => { srand(s); const p = new Pix(64, 64); p.fill(base, 0.15); p.cloudy(2, 0.9); p.cloudy(1, 0.5);
    for (let i = 0; i < 18; i++) { const x = rnd() * 64, y = rnd() * 64, r = 2 + rnd() * 3; for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) if (a * a + b * b <= r * r) p.mul(x + a, y + b, 1.35); }
    if (glow) for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) p.set(x, y, p.get(x, y), glow);
    return p.toTexture(); };
  T.sauce = liquid(hex(0xa02010), 210, 0.55); T.sludge = liquid(hex(0x5a8a18), 211, 0.6); T.water = liquid(hex(0x203a44), 212, 0.3);
  { srand(213); const p = new Pix(32, 32); p.fill(hex(0x9a7038), 0.15); p.cloudy(1, 0.4); for (let i = 0; i < 14; i++) p.mul(rnd() * 32, rnd() * 32, 0.55); T.potato = p.toTexture(); }
  { srand(214); const p = new Pix(16, 32); for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) p.set(x, y, [0.25 + 0.2 * Math.sin(y * 0.6 + x), 0.45, 1], 1); T.lavalamp = p.toTexture(); }
  { srand(215); const p = new Pix(64, 64); p.fill(hex(0x2e2a26), 0.15);
    for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 16) { p.bevel(x, y, 16, 16, 1.25, 0.6); }
    p.cloudy(1, 0.6); p.speckle(250, 0.5, 1.5); p.drips(10, 0.7); T.jailfloor = p.toTexture(); }
  { srand(216); const p = new Pix(16, 16); p.fill([0.5, 0.75, 1], 0.05); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p.set(x, y, p.get(x, y), 1); T.glowblue = p.toTexture(); }
  { srand(217); const p = new Pix(16, 16); p.fill([0.35, 1, 0.45], 0.05); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p.set(x, y, p.get(x, y), 1); T.glowgreen = p.toTexture(); }
  { srand(218); const p = new Pix(64, 64); p.fill(hex(0x6a4a2a), 0.1); for (let y = 0; y < 64; y += 8) { for (let x = 0; x < 64; x++) p.mul(x, y, 0.55); } for (let x = 0; x < 64; x += 32) for (let y = 0; y < 64; y++) p.mul(x, y, 0.6); p.speckle(150, 0.6, 1.3); p.cloudy(1, 0.4); T.boards = p.toTexture(); }

  // ---- v0.17: New York (Episode 2) ----
  // facades: one window bay per 64x64 tile (world-aligned, so windows line up floor after floor); lit windows glow
  const facade = (s, wall, opt = {}) => { srand(s); const p = new Pix(64, 64); p.fill(wall, opt.n ?? 0.12); p.cloudy(1, 0.45); p.speckle(160, 0.75, 1.2);
    if (opt.brick) for (let y = 0; y < 64; y += 4) for (let x = 0; x < 64; x++) { if (y % 4 === 0) p.mul(x, y, 0.72); if ((x + (y % 8 ? 4 : 0)) % 8 === 0) p.mul(x, y, 0.75); }
    const wx = opt.wx ?? 18, ww = opt.ww ?? 28, wy = opt.wy ?? 14, wh = opt.wh ?? 34;
    const lit = rnd() < (opt.lit ?? 0.35), warm = rnd() < 0.75, glass = lit ? (warm ? [1, 0.78, 0.42] : [0.65, 0.8, 1]) : [0.05, 0.06, 0.09];
    p.rect(wx - 3, wy - 3, ww + 6, wh + 7, opt.frame || [wall[0] * 0.6, wall[1] * 0.6, wall[2] * 0.6], 0.08); p.bevel(wx - 3, wy - 3, ww + 6, wh + 7, 1.3, 0.7);
    p.rect(wx, wy, ww, wh, glass, lit ? 0.12 : 0.3, lit ? 0.9 : 0);
    if (lit && rnd() < 0.5) p.rect(wx, wy, ww, wh * 0.45, [glass[0] * 0.55, glass[1] * 0.5, glass[2] * 0.5], 0.1, 0.9); // a blind half down
    p.rect(wx + ww / 2 - 1, wy, 2, wh, [0.12, 0.1, 0.09], 0.05, 0); p.rect(wx, wy + wh / 2 - 1, ww, 2, [0.12, 0.1, 0.09], 0.05, 0);
    if (opt.sill !== false) { p.rect(wx - 5, wy + wh + 3, ww + 10, 4, opt.stone || [0.55, 0.5, 0.44], 0.1); p.rect(wx - 5, wy - 6, ww + 10, 4, opt.stone || [0.55, 0.5, 0.44], 0.1); }
    p.drips(opt.drips ?? 8, 0.82); return p; };
  // each texture is a 2x2 block of bays so lit windows vary
  const facade4 = (s, wall, opt) => { const big = new Pix(128, 128); for (let k = 0; k < 4; k++) { const t = facade(s + k * 7, wall, opt); for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const i = t.idx(x, y), o = big.idx(x + (k % 2) * 64, y + (k >> 1) * 64); for (let q = 0; q < 4; q++) big.d[o + q] = t.d[i + q]; } } return big.toTexture(); };
  T.brownstone = facade4(300, hex(0x5a3626), { stone: [0.42, 0.3, 0.24], frame: [0.2, 0.13, 0.1], lit: 0.4 });
  T.tenement = facade4(310, hex(0x6e2e22), { brick: true, stone: [0.6, 0.56, 0.5], frame: [0.18, 0.16, 0.15], lit: 0.38 });
  T.tenementdark = facade4(320, hex(0x3e2a24), { brick: true, stone: [0.45, 0.42, 0.38], frame: [0.12, 0.11, 0.1], lit: 0.22, drips: 14 });
  T.office = facade4(330, hex(0x6a6660), { stone: [0.7, 0.68, 0.62], frame: [0.3, 0.3, 0.3], wx: 10, ww: 44, wy: 12, wh: 40, sill: false, lit: 0.45 });
  T.limestone = facade4(340, hex(0x8a8274), { stone: [0.78, 0.74, 0.66], frame: [0.42, 0.4, 0.36], wx: 20, ww: 24, wy: 10, wh: 40, lit: 0.3 });
  { srand(350); const p = new Pix(64, 64); p.fill(hex(0x0e1218), 0.05); // glass curtain wall
    for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 16) { const lit = rnd() < 0.3; p.rect(x + 1, y + 1, 14, 14, lit ? [0.55, 0.65, 0.75] : [0.08, 0.11, 0.16], 0.08, lit ? 0.8 : 0); for (let k = 0; k < 14; k++) p.mul(x + 1 + k, y + 1 + (k >> 1), 1.25); }
    for (let i = 0; i < 64; i += 16) for (let k = 0; k < 64; k++) { p.set(i, k, [0.22, 0.24, 0.26], 0); p.set(k, i, [0.22, 0.24, 0.26], 0); } T.glasstower = p.toTexture(); }
  // street level
  { srand(360); const p = new Pix(64, 64); p.fill(hex(0x6a6864), 0.1); p.cloudy(1, 0.35); p.speckle(300, 0.8, 1.15); // sidewalk slabs
    for (let k = 0; k < 64; k++) { p.mul(k, 0, 0.55); p.mul(0, k, 0.55); p.mul(k, 32, 0.7); }
    for (let i = 0; i < 12; i++) { const x = rnd() * 64, y = rnd() * 64; p.mul(x, y, 0.45); p.mul(x + 1, y, 0.6); } // gum
    for (let c = 0; c < 2; c++) { let x = rnd() * 64, y = rnd() * 64; for (let i = 0; i < 22; i++) { p.mul(x, y, 0.6); x += (rnd() - 0.5) * 3; y += rnd() * 1.5; } } T.sidewalk = p.toTexture(); }
  { srand(361); const p = new Pix(64, 32); p.fill(hex(0x7a7a78), 0.12); p.speckle(200, 0.7, 1.3); for (let x = 0; x < 64; x++) { p.mul(x, 0, 1.4); p.mul(x, 1, 1.2); p.mul(x, 31, 0.6); } for (let y = 0; y < 32; y++) p.mul(0, y, 0.6); T.curb = p.toTexture(); }
  { srand(362); const p = new Pix(64, 64); p.fill(hex(0x24262a), 0.18); p.cloudy(1, 0.5); p.speckle(500, 0.6, 1.5); // road
    for (let c = 0; c < 3; c++) { let x = rnd() * 64, y = rnd() * 64; for (let i = 0; i < 40; i++) { p.mul(x, y, 0.55); x += (rnd() - 0.5) * 2.6; y += (rnd() - 0.3) * 2; } }
    p.rect(rnd() * 30 | 0, rnd() * 30 | 0, 22, 14, hex(0x1a1c20), 0.1); T.road = p.toTexture(); }
  const decal = (w, h, fn, glow = 0) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); fn(g, w, h); return canvasToTex(c, typeof glow === 'function' ? glow : () => glow); };
  const KEYC = '#ff00ff';
  T.laneY = decal(64, 16, (g, w, h) => { g.fillStyle = KEYC; g.fillRect(0, 0, w, h); g.fillStyle = '#c8a020'; g.fillRect(0, 2, w, 4); g.fillRect(0, 10, w, 4); });
  T.laneW = decal(64, 16, (g, w, h) => { g.fillStyle = KEYC; g.fillRect(0, 0, w, h); g.fillStyle = '#c8c8c0'; g.fillRect(4, 5, 34, 6); });
  T.crosswalk = decal(64, 64, (g, w, h) => { g.fillStyle = KEYC; g.fillRect(0, 0, w, h); g.fillStyle = '#d0d0c8'; for (let x = 2; x < 64; x += 16) g.fillRect(x, 0, 9, 64); });
  T.laneYv = decal(16, 64, (g, w, h) => { g.fillStyle = KEYC; g.fillRect(0, 0, w, h); g.fillStyle = '#c8a020'; g.fillRect(2, 0, 4, h); g.fillRect(10, 0, 4, h); });
  T.laneWv = decal(16, 64, (g, w, h) => { g.fillStyle = KEYC; g.fillRect(0, 0, w, h); g.fillStyle = '#c8c8c0'; g.fillRect(5, 4, 6, 34); });
  T.crosswalkH = decal(64, 64, (g, w, h) => { g.fillStyle = KEYC; g.fillRect(0, 0, w, h); g.fillStyle = '#d0d0c8'; for (let y = 2; y < 64; y += 16) g.fillRect(0, y, 64, 9); });
  T.manhole = decal(64, 64, (g, w, h) => { g.fillStyle = KEYC; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2622'; g.beginPath(); g.arc(32, 32, 30, 0, 7); g.fill(); g.strokeStyle = '#4a4440'; g.lineWidth = 2; for (let r = 8; r < 30; r += 7) { g.beginPath(); g.arc(32, 32, r, 0, 7); g.stroke(); } g.fillStyle = '#5a5450'; g.font = 'bold 9px Arial'; g.textAlign = 'center'; g.fillText('NYC SEWER', 32, 35); });
  T.grate2 = decal(64, 32, (g, w, h) => { g.fillStyle = KEYC; g.fillRect(0, 0, w, h); g.fillStyle = '#18181a'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a3a3c'; for (let x = 0; x < 64; x += 6) g.fillRect(x, 0, 3, 32); });
  // storefront window: a lit shop interior behind glass; shutter: a rolled-down corrugated gate (with tags)
  T.shopwin = decal(128, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f8e0a0'); gr.addColorStop(1, '#a06a30'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) { g.fillStyle = ['#c03020', '#2050a0', '#30a040', '#e0c040', '#ffffff'][i % 5]; g.fillRect(6 + (i % 7) * 17, 14 + (i >> 3) * 22 + (i % 2) * 4, 10, 12); }
    g.fillStyle = '#3a2a1a'; g.fillRect(0, 36, w, 3); g.fillRect(0, 58, w, 6); g.strokeStyle = '#1a1410'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4); g.fillRect(62, 0, 4, h);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.moveTo(10, 2); g.lineTo(40, 2); g.lineTo(14, 62); g.lineTo(2, 62); g.fill(); }, (r, gg, b) => (r + gg + b > 200 ? 0.85 : 0));
  T.shutter = decal(128, 64, (g, w, h) => { g.fillStyle = '#5a5c60'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 4) { g.fillStyle = y % 8 ? '#6a6c70' : '#46484c'; g.fillRect(0, y, w, 2); }
    g.font = 'bold 22px Arial Black, Arial'; g.fillStyle = ['#e04080', '#40d0e0', '#f0d020'][Math.floor(Math.random() * 3)]; g.save(); g.translate(64, 38); g.rotate(-0.12); g.textAlign = 'center'; g.fillText(['QOQ!!', 'BEANS', 'PIDSER', 'MARV 4 EVA'][Math.floor(Math.random() * 4)], 0, 0); g.restore();
    g.fillStyle = '#2a2a2c'; g.fillRect(0, h - 5, w, 5); });
  T.awningR = decal(64, 64, (g, w, h) => { for (let x = 0; x < w; x += 16) { g.fillStyle = '#a01818'; g.fillRect(x, 0, 8, h); g.fillStyle = '#e8e0d0'; g.fillRect(x + 8, 0, 8, h); } });
  T.awningG = decal(64, 64, (g, w, h) => { g.fillStyle = '#1a5a2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#123e1e'; for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 2, h); });
  T.awningB = decal(64, 64, (g, w, h) => { g.fillStyle = '#1a2a6a'; g.fillRect(0, 0, w, h); g.fillStyle = '#e0c040'; g.fillRect(0, 54, w, 4); });
  T.checker = (() => { srand(391); const p = new Pix(64, 64); for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) p.set(x, y, ((x >> 4) + (y >> 4)) % 2 ? hex(0x1c1c1e) : hex(0xb8b4a8)); p.speckle(300, 0.8, 1.1); p.cloudy(1, 0.25); p.drips(6, 0.85); return p.toTexture(); })();
  T.shopwall = (() => { srand(392); const p = new Pix(64, 64); p.fill(hex(0x8a7a5a), 0.06); p.cloudy(1, 0.3); for (let y = 0; y < 22; y++) for (let x = 0; x < 64; x++) p.set(x, 63 - y, ((x >> 3) + (y >> 3)) % 2 ? hex(0x6a2a20) : hex(0xc8b898)); for (let x = 0; x < 64; x++) p.mul(x, 41, 0.5); p.drips(8, 0.8); return p.toTexture(); })();
  T.busside = (() => { srand(393); const p = new Pix(64, 64); p.fill(hex(0xa01814), 0.06); for (const y0 of [8, 38]) for (let x = 2; x < 64; x += 16) p.rect(x, y0, 12, 14, rnd() < 0.4 ? [0.95, 0.8, 0.5] : [0.06, 0.07, 0.1], 0.1, rnd() < 0.4 ? 0.8 : 0); for (let x = 0; x < 64; x++) { p.set(x, 30, hex(0xe0c040)); p.set(x, 31, hex(0xe0c040)); } return p.toTexture(); })();
  T.gold = (() => { srand(394); const p = new Pix(64, 64); p.fill(hex(0x9a7a30), 0.08); p.cloudy(1, 0.3); for (let x = 0; x < 64; x += 16) for (let y = 0; y < 64; y++) p.mul(x, y, 0.6); for (let y = 0; y < 64; y += 32) for (let x = 0; x < 64; x++) p.mul(x, y, 1.4); return p.toTexture(); })();
  T.curtain = (() => { srand(395); const p = new Pix(64, 64); for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const k = 0.6 + 0.4 * Math.sin(x * 0.5); p.set(x, y, [0.45 * k, 0.04 * k, 0.05 * k]); } p.speckle(80, 0.8, 1.2); return p.toTexture(); })();
  T.stained = decal(64, 128, (g, w, h) => { g.fillStyle = '#101010'; g.fillRect(0, 0, w, h); const cols = ['#c02020', '#2040c0', '#e0b020', '#20a040', '#8030b0'];
    g.beginPath(); g.moveTo(4, h - 4); g.lineTo(4, 30); g.arc(32, 30, 28, Math.PI, 0); g.lineTo(60, h - 4); g.closePath(); g.save(); g.clip();
    for (let y = 0; y < h; y += 12) for (let x = 0; x < w; x += 12) { g.fillStyle = cols[(x / 12 + y / 12 * 3) % 5 | 0]; g.fillRect(x + 1, y + 1, 10, 10); } g.restore();
    g.strokeStyle = '#000'; g.lineWidth = 3; g.beginPath(); g.moveTo(32, 2); g.lineTo(32, h); g.moveTo(4, 64); g.lineTo(60, 64); g.stroke(); }, (r, gg, b) => (r + gg + b > 120 ? 0.9 : 0));
  T.roof = (() => { srand(370); const p = new Pix(64, 64); p.fill(hex(0x2c2a28), 0.2); p.speckle(600, 0.5, 1.6); p.cloudy(1, 0.5); for (let x = 0; x < 64; x++) p.mul(x, 31, 0.7); return p.toTexture(); })();
  T.parapet = (() => { srand(371); const p = new Pix(64, 32); p.fill(hex(0x6a6058), 0.1); p.speckle(150, 0.7, 1.2); for (let x = 0; x < 64; x++) { p.mul(x, 0, 1.3); p.mul(x, 6, 0.65); } for (let y = 6; y < 32; y++) p.mul(0, y, 0.6); return p.toTexture(); })();
  T.subwaytile = (() => { srand(372); const p = new Pix(64, 64); p.fill(hex(0xcfcabc), 0.05); for (let y = 0; y < 64; y += 8) for (let x = 0; x < 64; x++) p.mul(x, y, 0.7); for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x += 16) p.mul(x + ((y >> 3) % 2) * 8, y, 0.7);
    for (let y = 40; y < 52; y++) for (let x = 0; x < 64; x++) p.set(x, y, ((x >> 2) + (y >> 2)) % 3 ? hex(0x2a6a4a) : hex(0xc8a040)); p.drips(16, 0.7); p.speckle(200, 0.8, 1.05); return p.toTexture(); })();
  T.scaffold = (() => { srand(373); const p = new Pix(64, 64); p.fill(hex(0x2a4a2e), 0.1); for (let x = 0; x < 64; x += 32) for (let y = 0; y < 64; y++) p.mul(x, y, 0.6); p.speckle(100, 0.7, 1.2); p.drips(10, 0.75); return p.toTexture(); })();
  T.grass = (() => { srand(374); const p = new Pix(64, 64); p.fill(hex(0x1e3214), 0.3); p.cloudy(1, 0.6); p.cloudy(2, 0.4); for (let i = 0; i < 500; i++) p.mul(rnd() * 64, rnd() * 64, 0.6 + rnd() * 0.9); return p.toTexture(); })();
  T.dirt = (() => { srand(375); const p = new Pix(64, 64); p.fill(hex(0x3a2c1e), 0.25); p.cloudy(1, 0.6); p.speckle(400, 0.6, 1.4); return p.toTexture(); })();
  T.bark = (() => { srand(376); const p = new Pix(32, 64); p.fill(hex(0x2e2218), 0.2); for (let x = 0; x < 32; x += 3) for (let y = 0; y < 64; y++) p.mul(x + ((y >> 3) % 2), y, 0.65); return p.toTexture(); })();
  T.leaves = (() => { srand(377); const p = new Pix(64, 64); p.fill(hex(0x1c3a16), 0.3); for (let i = 0; i < 260; i++) { const x = rnd() * 64, y = rnd() * 64, k = 0.55 + rnd(); p.mul(x, y, k); p.mul(x + 1, y, k); p.mul(x, y + 1, k * 0.9); } p.cloudy(1, 0.5); return p.toTexture(); })();
  T.granite = (() => { srand(378); const p = new Pix(64, 64); p.fill(hex(0x6a645a), 0.15); p.speckle(500, 0.7, 1.3); for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x++) p.mul(x, y, 0.6); for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x += 32) p.mul(x + ((y >> 4) % 2) * 16, y, 0.6); p.drips(12, 0.8); return p.toTexture(); })();
  T.steelbeam = (() => { srand(379); const p = steelPanels(hex(0x3a4a5a), 379, true, true); p.speckle(300, 0.6, 1.3); return p.toTexture(); })();
  T.taxi = (() => { srand(380); const p = new Pix(64, 64); p.fill(hex(0xe0b020), 0.05); p.cloudy(1, 0.2); for (let x = 0; x < 64; x++) for (let y = 28; y < 34; y++) p.set(x, y, ((x >> 2) + (y >> 2)) % 2 ? hex(0x111111) : hex(0xeeeeee)); return p.toTexture(); })();
  T.carblack = (() => { srand(381); const p = new Pix(32, 32); p.fill(hex(0x141618), 0.08); p.cloudy(1, 0.2); return p.toTexture(); })();
  T.carwhite = (() => { srand(382); const p = new Pix(64, 64); p.fill(hex(0xd8d8d4), 0.05); for (let x = 0; x < 64; x++) for (let y = 30; y < 38; y++) p.set(x, y, hex(0x1a3a8a)); return p.toTexture(); })();
  T.carred = (() => { srand(383); const p = new Pix(32, 32); p.fill(hex(0x7a1410), 0.08); p.cloudy(1, 0.25); return p.toTexture(); })();
  T.carglass = (() => { srand(384); const p = new Pix(32, 32); p.fill(hex(0x0c1218), 0.05); for (let k = 0; k < 32; k++) p.mul(k, k >> 1, 1.8); return p.toTexture(); })();
  T.burnt = (() => { srand(385); const p = new Pix(64, 64); p.fill(hex(0x1c1a18), 0.3); p.cloudy(1, 0.8); for (let i = 0; i < 200; i++) p.mul(rnd() * 64, rnd() * 64, 1.8); p.drips(10, 0.6); return p.toTexture(); })();
  T.tire = (() => { srand(386); const p = new Pix(32, 32); p.fill(hex(0x121212), 0.1); for (let x = 0; x < 32; x += 4) for (let y = 0; y < 32; y++) p.mul(x, y, 0.6); return p.toTexture(); })();
  T.hydrant = (() => { srand(387); const p = new Pix(32, 32); p.fill(hex(0x9a1a12), 0.12); p.speckle(60, 0.6, 1.3); return p.toTexture(); })();
  T.trashbag = (() => { srand(388); const p = new Pix(32, 32); p.fill(hex(0x16161a), 0.1); for (let i = 0; i < 40; i++) p.mul(rnd() * 32, rnd() * 32, 2.2); return p.toTexture(); })();
  T.wetblack = (() => { srand(389); const p = new Pix(32, 32); p.fill(hex(0x0a0a0c), 0.05); return p.toTexture(); })();
  T.metalgreen = (() => { srand(390); const p = new Pix(32, 32); p.fill(hex(0x1e3a28), 0.1); p.speckle(60, 0.7, 1.3); return p.toTexture(); })();
  T.neonpink = (() => { const p = new Pix(16, 16); p.fill([1, 0.3, 0.7], 0.05); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p.set(x, y, p.get(x, y), 1); return p.toTexture(); })();
  T.neoncyan = (() => { const p = new Pix(16, 16); p.fill([0.3, 0.95, 1], 0.05); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p.set(x, y, p.get(x, y), 1); return p.toTexture(); })();
  T.redlight = (() => { const p = new Pix(16, 16); p.fill([1, 0.12, 0.05], 0.05); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p.set(x, y, p.get(x, y), 1); return p.toTexture(); })();
  T.greenlight = (() => { const p = new Pix(16, 16); p.fill([0.2, 1, 0.45], 0.05); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p.set(x, y, p.get(x, y), 1); return p.toTexture(); })();
  // ---- v0.25 tech-base set for the Doom II-style Episode 1 ----
  const techPanel = (base, sd, band) => { srand(sd); const p = new Pix(64, 64); p.fill(base, 0.1); p.cloudy(1, 0.35);
    for (const [x0, y0, w, h] of [[0, 0, 32, 26], [32, 0, 32, 26], [0, 38, 64, 26]]) p.bevel(x0, y0, w, h, 1.3, 0.6);
    p.rect(0, 26, 64, 12, [base[0] * 0.35, base[1] * 0.35, base[2] * 0.35], 0.1); p.bevel(0, 26, 64, 12, 0.7, 1.3);
    for (let x = 4; x < 64; x += 10) p.rect(x, 30, 4, 3, band, 0.05, 0.9);
    for (const [x, y] of [[3, 3], [28, 3], [35, 3], [60, 3], [3, 41], [60, 41], [3, 60], [60, 60]]) p.rivet(x, y);
    p.speckle(120, 0.6, 1.3); p.drips(8, 0.8); return p; };
  T.techtan = techPanel(hex(0x8c7652), 401, [1, 0.75, 0.3]).toTexture();
  T.techgray = techPanel(hex(0x6c6c70), 402, [0.4, 0.8, 1]).toTexture();
  T.techgreen = techPanel(hex(0x4c5c48), 403, [0.4, 1, 0.4]).toTexture();
  T.bigbrown = bricks(hex(0x5c4630), hex(0x221810), 16, 32, 0.3, 404).toTexture();
  T.graystone = (() => { const p = bricks(hex(0x48484c), hex(0x1c1c20), 16, 21, 0.45, 405); p.cloudy(2, 0.4); p.speckle(300, 0.6, 1.3); return p.toTexture(); })();
  T.mossstone = (() => { const p = bricks(hex(0x4a5040), hex(0x1a2014), 16, 24, 0.45, 406); srand(407); for (let i = 0; i < 260; i++) { const x = rnd() * 64, y = rnd() * 64; p.set(x, y, [0.18 + rnd() * 0.1, 0.32 + rnd() * 0.15, 0.1]); } p.drips(14, 0.75); return p.toTexture(); })();
  T.slimewall = (() => { srand(408); const p = new Pix(64, 64); p.fill(hex(0x4a3c2c), 0.2); p.cloudy(1, 0.7); p.speckle(200, 0.5, 1.3);
    for (let i = 0; i < 14; i++) { const x = rnd() * 64 | 0; const len = 10 + rnd() * 40; for (let j = 0; j < len; j++) { const w = j < 4 ? 2 : 1; for (let k = 0; k < w; k++) p.set(x + k, j, [0.35, 0.85, 0.12], j < len * 0.5 ? 0.6 : 0.2); } }
    for (let x = 0; x < 64; x++) for (let y = 0; y < 3; y++) p.set(x, y, [0.3, 0.75, 0.1], 0.6); return p.toTexture(); })();
  T.techfloor = (() => { srand(409); const p = new Pix(64, 64); p.fill(hex(0x4a4a4e), 0.1); p.cloudy(1, 0.4);
    for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) { p.bevel(tx * 32, ty * 32, 32, 32, 1.3, 0.55); p.shade(tx * 32 + 8, ty * 32 + 8, 16, 16, 0.8); p.bevel(tx * 32 + 8, ty * 32 + 8, 16, 16, 0.7, 1.3); }
    p.speckle(160, 0.6, 1.3); return p.toTexture(); })();
  T.support = (() => { srand(410); const p = new Pix(32, 64); p.fill(hex(0x5a5048), 0.12); p.cloudy(1, 0.4);
    for (let y = 0; y < 64; y++) { p.mul(0, y, 1.4); p.mul(1, y, 1.2); p.mul(30, y, 0.7); p.mul(31, y, 0.5); p.mul(15, y, 0.8); p.mul(16, y, 1.2); }
    for (let y = 4; y < 64; y += 10) { p.rivet(5, y); p.rivet(25, y); } p.drips(6, 0.7); return p.toTexture(); })();
  return T;
}

// draws neon/screen text into a texture via canvas; whole texture glows where bright
export function textTexture(text, opts = {}) {
  const w = opts.w || 256, h = opts.h || 64;
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = opts.bg || '#1a1414'; g.fillRect(0, 0, w, h);
  if (opts.frame) { g.strokeStyle = opts.frame; g.lineWidth = 3; g.strokeRect(3, 3, w - 6, h - 6); }
  g.font = `bold ${opts.size || 40}px ${opts.font || 'Arial Black, Arial, sans-serif'}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const lines = text.split('\n'); const lh = (opts.size || 40) * 1.05;
  lines.forEach((ln, i) => {
    const y = h / 2 + (i - (lines.length - 1) / 2) * lh;
    g.shadowColor = opts.color || '#ff2a1a'; g.shadowBlur = opts.blur ?? 14; g.fillStyle = opts.color || '#ff2a1a';
    g.fillText(ln, w / 2, y); g.shadowBlur = 0; g.fillStyle = opts.core || '#ffd0c8'; g.fillText(ln, w / 2, y);
    if (opts.outline) { g.strokeStyle = opts.color; g.lineWidth = 1; g.strokeText(ln, w / 2, y); }
  });
  return canvasToTex(c, opts.glowAll ? () => 1 : (r, gg, b) => Math.min(1, Math.max(r, gg, b) / 255 * 1.6), opts.clamp !== false);
}

export function canvasToTex(c, glowFn, clamp = true) {
  const g = c.getContext('2d'); const id = g.getImageData(0, 0, c.width, c.height).data;
  const out = new Uint8Array(c.width * c.height * 4);
  // flip vertically into DataTexture convention used by world (row 0 = top -> v=0)
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
    const i = (y * c.width + x) * 4;
    out[i] = id[i]; out[i + 1] = id[i + 1]; out[i + 2] = id[i + 2];
    out[i + 3] = 255 - Math.round(255 * (glowFn ? glowFn(id[i], id[i + 1], id[i + 2]) : 0));
  }
  const t = new THREE.DataTexture(out, c.width, c.height, THREE.RGBAFormat);
  t.wrapS = t.wrapT = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true; t.userData = { w: c.width, h: c.height };
  return t;
}

export async function imageTexture(url, glow = 1) {
  const at = u => (window.CP_ASSET_URL ? window.CP_ASSET_URL(u) : u); // the single-file build serves images from inlined data
  let img = new Image(); img.src = at(url);
  try { await img.decode(); } catch (e) { img = new Image(); img.src = at(url.replace(/\.webp$/, '.png')); await img.decode(); } // WebP first, PNG if that's all there is
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  c.getContext('2d').drawImage(img, 0, 0);
  return canvasToTex(c, typeof glow === 'function' ? glow : () => glow);
}

export const DECALS = ['tv', 'skyline', 'poster', 'map', 'crt', 'emblem', 'monwall', 'neonorder', 'globe', 'bulletin', 'spices',
  'pot_fuel', 'pot_glorious', 'pot_heroes', 'pot_right', 'pot_soil', 'neon_potato', 'bedspread', 'rug_slice', 'tv_pizza', 'clock333', 'tv_blue',
  'porthole', 'emblem_slice', 'sign_psafe', 'safe', 'neon_hornt', 'sign_nohope', 'badge_hornt', 'monitors', 'vaultdoor', 'cell101', 'cell102', 'cell103', 'cellbox', 'cracked'];
const DECAL_GLOW = { tv: 1, skyline: 1, poster: 0, map: 0, crt: 1, emblem: 0, monwall: 1, neonorder: (r, g, b) => (r > 150 ? 1 : 0), globe: 1, bulletin: 0, spices: 0,
  neon_potato: (r, g, b) => (r > 170 ? 1 : 0), tv_pizza: 1, clock333: (r) => (r > 120 ? 1 : 0), tv_blue: 1, porthole: (r, g, b) => (r + g + b > 300 ? 1 : 0.35),
  neon_hornt: (r, g, b) => (r > 170 ? 1 : 0), monitors: 1 };

export async function loadTextures(base = 'assets/tex/') {
  const T = makeAll();
  await Promise.all(DECALS.map(async (k) => { T[k] = await imageTexture(base + k + '.webp', DECAL_GLOW[k] ?? 0); }));
  T.sign_pidser = textTexture('THE PIDSER CAVE', { w: 512, h: 96, size: 64, color: '#ff2414', core: '#ffb0a0', bg: '#2a2422', frame: '#55504a' });
  T.sign_exit = textTexture('EXIT', { w: 128, h: 48, size: 34, color: '#30ff40', core: '#d0ffd0', bg: '#101410' });
  T.sign_justice = textTexture('JUSTICE\nIS SERVED.', { w: 256, h: 128, size: 34, color: '#40c8ff', core: '#e0f6ff', bg: '#0a1420', frame: '#2a6aa0' });
  T.sign_order = textTexture('PIZZA\nJUSTICE\nORDER', { w: 128, h: 128, size: 28, color: '#ff8020', core: '#ffe0b0', bg: '#1a1410', frame: '#ff8020' });
  T.sign_kitchen = textTexture('KITCHEN', { w: 256, h: 64, size: 40, color: '#ffb030', core: '#fff0c0', bg: '#1a1410' });
  T.sign_vault = textTexture('VAULT', { w: 256, h: 64, size: 44, color: '#ffd030', core: '#fff4c0', bg: '#141210' });
  T.sign_p = textTexture('P', { w: 64, h: 64, size: 48, color: '#d8d0b0', core: '#ffffff', bg: '#202020', frame: '#a09880', blur: 0 });
  T.sign_bay = textTexture('VEHICLE BAY', { w: 256, h: 48, size: 30, color: '#ff3020', core: '#ffd0c0', bg: '#141010' });
  T.sign_pizza = textTexture('PIZZA', { w: 256, h: 80, size: 60, color: '#ffffff', core: '#ffffff', bg: '#b01810', blur: 0 });
  const plate = (txt, color = '#ffb040', core = '#fff0c8', bg = '#16120e') => textTexture(txt, { w: 256, h: 64, size: txt.length > 13 ? 24 : txt.length > 10 ? 28 : 38, color, core, bg, frame: '#5a4a38' });
  T.sign_cellA = plate('CELL BLOCK A'); T.sign_cellB = plate('CELL BLOCK B'); T.sign_solitary = plate('SOLITARY', '#ff5030', '#ffd0c0');
  T.sign_yard = plate('EXERCISE YARD'); T.sign_warden = plate('WARDEN', '#ffd040'); T.sign_quarters = plate('POTATO QUARTERS', '#ff9a30');
  T.sign_lounge = plate('LOUNGE', '#ff9a30'); T.sign_cold = plate('COLD STORAGE', '#60c8ff', '#e0f8ff'); T.sign_lift = plate('LIFT', '#30ff60', '#d0ffd8');
  T.sign_sewer = plate('SAUCE WORKS', '#ff5030', '#ffd0c0'); T.sign_vaults = plate('PIZZA VAULTS', '#ffd040'); T.sign_library = plate('LIBRARY', '#ffd040'); T.sign_drain = plate('SEWER', '#70ff50', '#e0ffd0');

  // ---- Episode 2: New York signage ----
  const shop = (txt, color, core, bg) => textTexture(txt, { w: 256, h: 64, size: txt.length > 10 ? 30 : 40, color, core, bg, frame: '#2a2420' });
  const SHOPS = { deli: ['DELI', '#ffd040', '#fff4c0', '#1a1208'], cafe: ['CAFE', '#ff8a40', '#ffe0c0', '#20120a'], pizza: ['PIZZA', '#ff3a20', '#ffd8c8', '#140c0a'], bodega: ['BODEGA', '#40e0ff', '#e0fcff', '#081418'],
    laundry: ['LAUNDROMAT', '#80ff60', '#e8ffe0', '#0a140a'], pawn: ['PAWN SHOP', '#ffd040', '#fff4c0', '#141008'], liquor: ['LIQUORS', '#ff40a0', '#ffd8ec', '#16080e'], diner: ['DINER', '#ff4040', '#ffe0e0', '#180a0a'],
    hotel: ['HOTEL', '#ff3030', '#ffd0d0', '#120808'], bar: ['BAR', '#ff60c0', '#ffe0f4', '#140812'], pharmacy: ['PHARMACY', '#40ff80', '#e0ffe8', '#08140c'], hardware: ['HARDWARE', '#ffa030', '#fff0d8', '#141008'],
    chinese: ['CHINESE FOOD', '#ff3a20', '#ffe0a0', '#180808'], fish: ['FISH MARKET', '#40c8ff', '#e0f6ff', '#08121a'], noodle: ['NOODLES', '#ffd040', '#fff4c0', '#1a0808'], bank: ['BANK', '#d8c890', '#fff8e0', '#141410'],
    pidser: ['PIDSER PIZZA', '#ff2414', '#ffb0a0', '#1a1414'],
    jewelry: ['JEWELRY', '#ffd040', '#fff4c0', '#1a1208'], bakery: ['BAKERY', '#ff9a50', '#ffe8d0', '#1a1008'], tea: ['TEA HOUSE', '#60ff90', '#e0ffe8', '#081408'], dragon: ['GOLDEN DRAGON', '#ffd040', '#fff4c0', '#3a0808'], market: ['FISH MARKET', '#40c8ff', '#e0f6ff', '#08121a'], tattoo: ['TATTOO', '#c060ff', '#f0e0ff', '#100818'], theater: ['THEATER', '#ffd040', '#fff4c0', '#1a1208'], open: ['OPEN', '#ff2a2a', '#ffd0d0', '#000000'] };
  for (const [k, v] of Object.entries(SHOPS)) T['shop_' + k] = shop(...v);
  const street = txt => textTexture(txt, { w: 256, h: 64, size: txt.length > 11 ? 26 : 36, color: '#ffffff', core: '#ffffff', bg: '#0d5a2c', frame: '#e8f0e8', blur: 0, glowAll: false });
  for (const n of ['42 ST', '8 AV', '7 AV', 'BROADWAY', 'TIMES SQ', '34 ST', '5 AV', 'CANAL ST', 'MOTT ST', 'BOWERY', 'W 44 ST', 'WALL ST', 'BROAD ST', 'PARK ROW', 'CENTRAL PARK W', '59 ST', 'FRANKLIN ST', 'W 33 ST', 'LEXINGTON AV', 'DELANCEY ST', 'FULTON ST', '125 ST', 'HOUSTON ST'])
    T['st_' + n.replace(/\s+/g, '').toLowerCase()] = street(n);
  T.taxisign = textTexture('TAXI', { w: 64, h: 32, size: 20, color: '#ffe040', core: '#fff8d0', bg: '#2a2410', blur: 4 });
  T.sign_subway = textTexture('SUBWAY', { w: 256, h: 64, size: 40, color: '#ffffff', core: '#ffffff', bg: '#101010', frame: '#ffffff', blur: 2 });
  T.sign_station = textTexture('42 ST - TIMES SQ', { w: 256, h: 48, size: 24, color: '#ffffff', core: '#ffffff', bg: '#141414', blur: 0 });
  T.sign_el = textTexture('125 ST STATION', { w: 256, h: 48, size: 24, color: '#ffffff', core: '#ffffff', bg: '#141414', blur: 0 });
  T.sign_bridge = textTexture('BROOKLYN BRIDGE', { w: 256, h: 64, size: 30, color: '#ffffff', core: '#ffffff', bg: '#0d5a2c', frame: '#e8f0e8', blur: 0 });
  T.sign_park = textTexture('CENTRAL PARK', { w: 256, h: 64, size: 32, color: '#e8d8a0', core: '#fff8e0', bg: '#1a2a14', frame: '#8a7a50', blur: 0 });
  T.sign_police = textTexture('POLICE LINE - DO NOT CROSS', { w: 256, h: 32, size: 15, color: '#101010', core: '#101010', bg: '#f0d020', blur: 0 });
  T.sign_onlineexchange = textTexture('PIZZA EXCHANGE', { w: 512, h: 96, size: 56, color: '#e8d8a0', core: '#fff8e0', bg: '#2a2620', frame: '#8a7a50', blur: 0 });
  T.sign_observatory = textTexture('OBSERVATION DECK', { w: 256, h: 64, size: 28, color: '#40c8ff', core: '#e0f6ff', bg: '#0a1420', frame: '#2a6aa0' });
  T.sign_lobby = textTexture('EMPIRE PIDSER BUILDING', { w: 512, h: 96, size: 44, color: '#ffd040', core: '#fff4c0', bg: '#14100a', frame: '#806020' });
  // billboards (Times Square)
  const board = (lines, bg1, bg2, color, w = 512, h = 256) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, bg1); gr.addColorStop(1, bg2); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(255,255,255,${0.04 + Math.random() * 0.06})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 20 + Math.random() * 60, 0, 7); g.fill(); }
    g.textAlign = 'center'; g.textBaseline = 'middle'; lines.forEach(([t, sz], i) => { g.font = `bold ${sz}px Arial Black, Arial`; g.shadowColor = color; g.shadowBlur = 16; g.fillStyle = color; g.fillText(t, w / 2, h * (i + 1) / (lines.length + 1)); g.shadowBlur = 0; g.fillStyle = '#ffffff'; g.fillText(t, w / 2, h * (i + 1) / (lines.length + 1)); });
    g.strokeStyle = '#000'; g.lineWidth = 8; g.strokeRect(0, 0, w, h); return canvasToTex(c, () => 1); };
  T.bb_cola = board([['QOQ COLA', 92], ['TASTES LIKE CHICKEN', 34]], '#b01010', '#400808', '#ffd040');
  T.bb_pizza = board([['PIDSER PIZZA', 76], ['NOW DELIVERING', 34], ['TO EVERY BOROUGH', 34]], '#ff6a10', '#801808', '#fff0a0');
  T.bb_beans = board([['BEANS', 110], ['THE MUSICAL', 44]], '#3a1a6a', '#100820', '#ff60c0');
  T.bb_marv = board([['VOTE MARV', 88], ['TISSUES FOR ALL', 36]], '#103a8a', '#081430', '#80d8ff');
  T.bb_frenta = board([['FRENTA', 96], ['GHOST TOURS NIGHTLY', 32]], '#0a3a1a', '#041008', '#60ff80');
  T.bb_ballinki = board([['BALLINKI', 92], ['FRESH AIR CO.', 38]], '#4a6a10', '#182808', '#e0ff60');
  T.bb_cornpop = board([['WANTED', 70], ['CORNPOP', 96]], '#6a5a3a', '#2a2014', '#ffe0a0');
  T.bb_news = board([['BREAKING: QOQS', 54], ['INVADE MANHATTAN', 48]], '#101418', '#202830', '#ff3030', 512, 128);
  // graffiti tags on a transparent background
  const tag = (txt, color, rot = -0.1) => { const c = document.createElement('canvas'); c.width = 256; c.height = 96; const g = c.getContext('2d'); g.fillStyle = '#ff00ff'; g.fillRect(0, 0, 256, 96);
    g.save(); g.translate(128, 52); g.rotate(rot); g.font = 'italic bold 52px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 9; g.strokeStyle = '#101010'; g.strokeText(txt, 0, 0); g.fillStyle = color; g.fillText(txt, 0, 0); g.restore();
    for (let i = 0; i < 10; i++) { g.fillStyle = color; g.fillRect(20 + Math.random() * 216, 70 + Math.random() * 20, 2, 6 + Math.random() * 14); } return canvasToTex(c, () => 0); };
  T.tag_qoq = tag('QOQ', '#ff4090'); T.tag_cornpop = tag('CORNPOP', '#40e0ff', 0.06); T.tag_pidser = tag('PIDSER', '#f0d020', -0.16); T.tag_beans = tag('BEANS!', '#80ff40', 0.1); T.tag_nyc = tag('NYC', '#ff8030'); T.tag_marv = tag('MARV', '#e0e0e0', -0.05);
  T.sign_mess = plate('MESS HALL', '#ffb040'); T.sign_armory = plate('ARMORY', '#ff5030', '#ffd0c0'); T.sign_roof = plate('ROOF ACCESS', '#30ff60', '#d0ffd8');
  return T;
}

export { Pix, hex, srand, rnd };
