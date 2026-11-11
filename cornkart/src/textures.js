// Procedural canvas textures, so the game ships with no image files.
import * as THREE from 'three';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function tex(c, repeat = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

// Seeded random so the world looks the same every run.
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Height canvas -> tangent-space normal map (Sobel).
export function normalFromHeight(src, strength = 2) {
  const w = src.width, h = src.height;
  const data = src.getContext('2d').getImageData(0, 0, w, h).data;
  const [c, g] = canvas(w, h);
  const out = g.createImageData(w, h);
  const H = (x, y) => data[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1);
    const i = (y * w + x) * 4;
    out.data[i] = (-dx / l * 0.5 + 0.5) * 255; out.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; out.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; out.data[i + 3] = 255;
  }
  g.putImageData(out, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

export function asphaltTexture({ winter = false } = {}) {
  const W = 256, Hh = 512;
  const [c, g] = canvas(W, Hh);
  const [hc, hg] = canvas(W, Hh); // height for the normal map
  const [rc, rg] = canvas(W, Hh); // roughness
  const r = rng(7);
  g.fillStyle = '#4a4a47'; g.fillRect(0, 0, W, Hh);
  hg.fillStyle = '#808080'; hg.fillRect(0, 0, W, Hh);
  rg.fillStyle = '#e0e0e0'; rg.fillRect(0, 0, W, Hh);
  for (let i = 0; i < 14000; i++) {
    const v = 50 + r() * 50, x = r() * W, y = r() * Hh, s = 1 + r() * 2;
    g.fillStyle = `rgba(${v},${v},${v - 4},0.5)`; g.fillRect(x, y, s, s);
    const hv = 90 + r() * 120;
    hg.fillStyle = `rgb(${hv},${hv},${hv})`; hg.fillRect(x, y, s, s);
  }
  // patched repairs
  for (let i = 0; i < 6; i++) {
    const x = r() * W, y = r() * Hh, w = 20 + r() * 50, h = 20 + r() * 70;
    g.fillStyle = 'rgba(30,30,28,0.35)'; g.fillRect(x, y, w, h);
  }
  // cracks
  g.strokeStyle = 'rgba(25,25,22,0.8)'; hg.strokeStyle = '#202020';
  g.lineWidth = hg.lineWidth = 1.5;
  for (let i = 0; i < 16; i++) {
    let x = r() * W, y = r() * Hh;
    g.beginPath(); g.moveTo(x, y); hg.beginPath(); hg.moveTo(x, y);
    for (let k = 0; k < 8; k++) { x += (r() - 0.5) * 30; y += (r() - 0.5) * 30; g.lineTo(x, y); hg.lineTo(x, y); }
    g.stroke(); hg.stroke();
  }
  if (winter) { // frost speckle, slush banked along the kerbs, packed snow in the wheel tracks
    for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(225,235,245,${0.1 + r() * 0.25})`; g.fillRect(r() * W, r() * Hh, 1 + r() * 2, 1 + r() * 2); }
    for (const [x0, dir] of [[0, 1], [W, -1]]) for (let y = 0; y < Hh; y += 2) {
      const w = 18 + Math.sin(y * 0.05) * 6 + r() * 8;
      const grad = g.createLinearGradient(x0, 0, x0 + dir * w, 0);
      grad.addColorStop(0, 'rgba(238,243,250,0.95)'); grad.addColorStop(1, 'rgba(238,243,250,0)');
      g.fillStyle = grad; g.fillRect(dir > 0 ? x0 : x0 - w, y, w, 2);
      rg.fillStyle = '#a0a0a0'; rg.fillRect(dir > 0 ? x0 : x0 - w, y, w, 2);
    }
    for (const x of [72, 168]) { g.fillStyle = 'rgba(215,225,235,0.1)'; g.fillRect(x, 0, 18, Hh); }
  }
  // weeds pushing through
  for (let i = 0; i < (winter ? 0 : 50); i++) {
    g.fillStyle = `rgba(${70 + r() * 40},${90 + r() * 40},40,0.7)`;
    g.fillRect(r() * W, r() * Hh, 3 + r() * 4, 2 + r() * 3);
  }
  // faded edge lines and dashed centre line
  g.fillStyle = 'rgba(230,225,200,0.75)';
  g.fillRect(8, 0, 6, Hh); g.fillRect(242, 0, 6, Hh);
  g.fillStyle = 'rgba(235,200,60,0.7)';
  for (let y = 0; y < Hh; y += 128) g.fillRect(125, y, 6, 64);
  return { map: tex(c), normal: normalFromHeight(hc, 3), rough: tex(rc) };
}

export function gravelTexture() {
  const [c, g] = canvas(256, 256);
  const [hc, hg] = canvas(256, 256);
  const r = rng(21);
  g.fillStyle = '#6b5d49'; g.fillRect(0, 0, 256, 256);
  hg.fillStyle = '#404040'; hg.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    const x = r() * 256, y = r() * 256, s = 1.5 + r() * 4, v = 80 + r() * 90;
    g.fillStyle = `rgb(${v},${v * 0.9},${v * 0.75})`;
    g.beginPath(); g.arc(x, y, s, 0, 7); g.fill();
    hg.fillStyle = `rgb(${120 + r() * 135},0,0)`;
    hg.beginPath(); hg.arc(x, y, s, 0, 7); hg.fill();
  }
  // tyre ruts
  g.fillStyle = 'rgba(40,32,24,0.35)';
  g.fillRect(60, 0, 26, 256); g.fillRect(170, 0, 26, 256);
  return { map: tex(c), normal: normalFromHeight(hc, 4) };
}

export function concreteTexture() {
  const [c, g] = canvas(256, 256);
  const r = rng(31);
  g.fillStyle = '#9b978d'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) { const v = 120 + r() * 70; g.fillStyle = `rgba(${v},${v},${v - 6},0.35)`; g.fillRect(r() * 256, r() * 256, 2, 2); }
  for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(50,48,40,${0.05 + r() * 0.15})`; g.fillRect(r() * 256, r() * 256, 3 + r() * 10, 30 + r() * 120); }
  g.strokeStyle = 'rgba(60,58,52,0.6)'; g.lineWidth = 2;
  for (let y = 0; y <= 256; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  for (let x = 0; x <= 256; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  return tex(c);
}

export function hazardTexture() {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#f2c500';
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#151515';
  for (let i = -256; i < 512; i += 64) {
    g.beginPath();
    g.moveTo(i, 0); g.lineTo(i + 32, 0); g.lineTo(i + 32 + 256, 256); g.lineTo(i + 256, 256);
    g.fill();
  }
  return tex(c);
}

export function boostPadTexture(bg = '#0a2a12', fg = '#7dff3a') {
  const [c, g] = canvas(128, 256);
  g.fillStyle = bg;
  g.fillRect(0, 0, 128, 256);
  for (let y = 20; y < 256; y += 80) {
    g.fillStyle = fg;
    g.beginPath();
    g.moveTo(10, y + 50); g.lineTo(64, y); g.lineTo(118, y + 50); g.lineTo(118, y + 70); g.lineTo(64, y + 20); g.lineTo(10, y + 70);
    g.fill();
  }
  return tex(c);
}

let groundHeight = null;
export function groundTexture() {
  const [c, g] = canvas(256, 256);
  const [hc, hg] = canvas(256, 256);
  const r = rng(11);
  g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256);
  hg.fillStyle = '#606060'; hg.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 16000; i++) {
    const v = 100 + r() * 120, x = r() * 256, y = r() * 256, s = 1 + r() * 3;
    g.fillStyle = `rgba(${v},${v},${v},0.35)`; g.fillRect(x, y, s, s);
  }
  // grass blades
  for (let i = 0; i < 2500; i++) {
    const x = r() * 256, y = r() * 256, l = 3 + r() * 6, a = -Math.PI / 2 + (r() - 0.5) * 1.2;
    const v = 140 + r() * 100;
    g.strokeStyle = `rgba(${v},${v},${v * 0.8},0.45)`; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    hg.strokeStyle = `rgba(255,255,255,0.5)`;
    hg.beginPath(); hg.moveTo(x, y); hg.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); hg.stroke();
  }
  for (let i = 0; i < 120; i++) { // pebbles
    const x = r() * 256, y = r() * 256, s = 1 + r() * 2.5;
    hg.fillStyle = '#ffffff'; hg.beginPath(); hg.arc(x, y, s, 0, 7); hg.fill();
    g.fillStyle = 'rgba(190,185,170,0.5)'; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill();
  }
  groundHeight = hc;
  return tex(c);
}

export function groundNormalTexture() {
  if (!groundHeight) groundTexture();
  return normalFromHeight(groundHeight, 2.5);
}

export function checkerTexture() {
  const [c, g] = canvas(128, 32);
  for (let x = 0; x < 16; x++) for (let y = 0; y < 4; y++) {
    g.fillStyle = (x + y) % 2 ? '#111' : '#eee';
    g.fillRect(x * 8, y * 8, 8, 8);
  }
  const t = tex(c);
  t.magFilter = THREE.NearestFilter;
  return t;
}

export function apartmentTexture(seed, floors, cols) {
  const [c, g] = canvas(256, 512);
  const r = rng(seed);
  const base = 150 + r() * 40;
  g.fillStyle = `rgb(${base},${base - 4},${base - 12})`;
  g.fillRect(0, 0, 256, 512);
  // panel seams and water stains
  for (let i = 0; i < 30; i++) {
    g.fillStyle = `rgba(60,55,45,${0.05 + r() * 0.12})`;
    g.fillRect(r() * 256, r() * 512, 4 + r() * 20, 40 + r() * 200);
  }
  const fh = 512 / floors, cw = 256 / cols;
  for (let f = 0; f < floors; f++) for (let k = 0; k < cols; k++) {
    const x = k * cw + cw * 0.2, y = f * fh + fh * 0.25;
    const roll = r();
    g.fillStyle = roll < 0.25 ? '#0b0d0c' : roll < 0.5 ? '#2a3436' : roll < 0.9 ? '#4b5a5c' : '#6f7e64';
    g.fillRect(x, y, cw * 0.6, fh * 0.5);
    if (roll > 0.92) { // broken window glints green
      g.fillStyle = 'rgba(140,255,120,0.35)';
      g.fillRect(x + 2, y + 2, cw * 0.3, fh * 0.2);
    }
    g.fillStyle = 'rgba(90,85,75,0.9)';
    g.fillRect(x - 2, y + fh * 0.5, cw * 0.6 + 4, 3);
  }
  return tex(c, false);
}

export function signTexture(text, opts = {}) {
  const { w = 512, h = 128, bg = '#d8d2c0', fg = '#8a1b12', font = 'bold 76px Arial Black, Impact, sans-serif', border = null } = opts;
  const [c, g] = canvas(w, h);
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  if (border) { g.strokeStyle = border; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10); }
  g.fillStyle = fg;
  g.font = font;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 4);
  return tex(c, false);
}

export function trefoil(g, cx, cy, r, color) {
  g.fillStyle = color;
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + i * (Math.PI * 2 / 3);
    g.beginPath();
    g.moveTo(cx, cy);
    g.arc(cx, cy, r, a - Math.PI / 6, a + Math.PI / 6);
    g.closePath();
    g.fill();
  }
  g.beginPath(); g.arc(cx, cy, r * 0.32, 0, Math.PI * 2); g.fill();
  g.globalCompositeOperation = 'destination-out';
  g.beginPath(); g.arc(cx, cy, r * 0.2, 0, Math.PI * 2); g.fill();
  g.globalCompositeOperation = 'source-over';
  g.beginPath(); g.arc(cx, cy, r * 0.14, 0, Math.PI * 2); g.fill();
}

export function radiationSignTexture() {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#f5c400';
  g.beginPath(); g.moveTo(128, 12); g.lineTo(246, 236); g.lineTo(10, 236); g.closePath(); g.fill();
  g.strokeStyle = '#111'; g.lineWidth = 12; g.stroke();
  trefoil(g, 128, 160, 62, '#111');
  return tex(c, false);
}

export function barrelTexture() {
  const [c, g] = canvas(256, 128);
  const r = rng(5);
  g.fillStyle = '#d9b100';
  g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 300; i++) {
    g.fillStyle = `rgba(${110 + r() * 60},${50 + r() * 30},10,${0.2 + r() * 0.5})`;
    g.fillRect(r() * 256, r() * 128, 2 + r() * 10, 2 + r() * 8);
  }
  g.fillStyle = '#3b3000';
  g.fillRect(0, 20, 256, 6); g.fillRect(0, 102, 256, 6);
  for (let k = 0; k < 2; k++) {
    g.fillStyle = '#f7d800';
    g.beginPath(); g.arc(64 + k * 128, 64, 28, 0, Math.PI * 2); g.fill();
    trefoil(g, 64 + k * 128, 64, 24, '#111');
  }
  return tex(c, false);
}

// Generic badge used on karts in place of real brand logos.
export function cornkartBadgeTexture() {
  const [c, g] = canvas(256, 192);
  g.fillStyle = '#1f6b2a';
  g.beginPath(); g.ellipse(128, 96, 122, 88, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffe14d';
  g.beginPath(); g.ellipse(128, 96, 110, 76, 0, 0, Math.PI * 2); g.fill();
  // little corn cob
  g.fillStyle = '#f2a900';
  g.beginPath(); g.ellipse(128, 58, 16, 30, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffd23a';
  for (let y = 36; y < 82; y += 8) for (let x = 118; x <= 138; x += 8) { g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#3c9a2e';
  g.beginPath(); g.moveTo(108, 92); g.quadraticCurveTo(110, 60, 126, 40); g.quadraticCurveTo(116, 70, 128, 92); g.fill();
  g.beginPath(); g.moveTo(148, 92); g.quadraticCurveTo(146, 60, 130, 40); g.quadraticCurveTo(140, 70, 128, 92); g.fill();
  g.fillStyle = '#163d1b';
  g.font = 'bold 40px Arial Black, Impact, sans-serif';
  g.textAlign = 'center';
  g.fillText('CORNKART', 128, 136);
  return tex(c, false);
}

// Round "CLOWN KART" sticker for the clown car's sides.
export function clownBadgeTexture() {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#c8161d';
  g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fff8ec';
  g.beginPath(); g.arc(128, 128, 110, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#c8161d';
  g.font = 'bold 62px Arial Black, Impact, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('CLOWN', 128, 100, 200);
  g.fillText('KART', 128, 162, 200);
  return tex(c, false);
}

export function plateTexture(text) {
  return signTexture(text, { w: 256, h: 96, bg: '#f4f1e6', fg: '#a01818', font: 'bold 58px Arial, sans-serif', border: '#a01818' });
}

export function skyTexture() {
  const [c, g] = canvas(16, 256);
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#5d6670');
  grad.addColorStop(0.45, '#9aa39a');
  grad.addColorStop(0.5, '#b8bd9e');
  grad.addColorStop(1, '#8f9784');
  g.fillStyle = grad;
  g.fillRect(0, 0, 16, 256);
  const t = tex(c, false);
  return t;
}

export function glowSprite(color = '#8dff5a') {
  const [c, g] = canvas(64, 64);
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, color);
  grad.addColorStop(0.4, color + '88');
  grad.addColorStop(1, color + '00');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return tex(c, false);
}

export function sludgeTexture() {
  const [c, g] = canvas(256, 256);
  const r = rng(3);
  g.fillStyle = '#3cff2a';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 160; i++) {
    g.fillStyle = `rgba(${20 + r() * 60},${150 + r() * 105},${10 + r() * 40},0.6)`;
    g.beginPath(); g.arc(r() * 256, r() * 256, 4 + r() * 18, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 60; i++) {
    g.strokeStyle = 'rgba(220,255,160,0.7)';
    g.lineWidth = 2;
    g.beginPath(); g.arc(r() * 256, r() * 256, 3 + r() * 8, 0, Math.PI * 2); g.stroke();
  }
  return tex(c);
}

export function bloodTexture() {
  const [c, g] = canvas(256, 256);
  const r = rng(5);
  g.fillStyle = '#6a0006';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 160; i++) {
    g.fillStyle = `rgba(${90 + r() * 90},${r() * 12},${r() * 14},0.55)`;
    g.beginPath(); g.arc(r() * 256, r() * 256, 4 + r() * 18, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 50; i++) {
    g.strokeStyle = 'rgba(255,120,120,0.35)';
    g.lineWidth = 2;
    g.beginPath(); g.arc(r() * 256, r() * 256, 3 + r() * 8, 0, Math.PI * 2); g.stroke();
  }
  return tex(c);
}

// Baked bun crust with a dusting of icing sugar. The sugar is heaviest along the
// row of the texture that wraps the top of a swept body (u = 0.25).
export function bunCrustTexture(sugarRow = 0.25, spread = 5) {
  const W = 256, H = 256;
  const [c, g] = canvas(W, H);
  const [hc, hg] = canvas(W, H);
  const r = rng(31);
  g.fillStyle = '#b8682a'; g.fillRect(0, 0, W, H);
  hg.fillStyle = '#808080'; hg.fillRect(0, 0, W, H);
  for (let i = 0; i < 5000; i++) { // crust mottling and pores
    const x = r() * W, y = r() * H, s = 1 + r() * 4;
    const l = 30 + r() * 25;
    g.fillStyle = `hsla(${26 + r() * 10}, 60%, ${l}%, 0.35)`;
    g.beginPath(); g.arc(x, y, s, 0, 7); g.fill();
    const v = Math.round(90 + r() * 80);
    hg.fillStyle = `rgba(${v},${v},${v},0.5)`;
    hg.beginPath(); hg.arc(x, y, s, 0, 7); hg.fill();
  }
  for (let i = 0; i < 6000; i++) { // icing sugar
    const x = r() * W;
    const d = Math.abs(((x / W - sugarRow + 1.5) % 1) - 0.5); // distance from the top row
    if (r() > Math.max(0.01, 1 - d * spread)) continue;
    const y = r() * H;
    g.fillStyle = `rgba(255,253,245,${0.5 + r() * 0.5})`;
    g.fillRect(x, y, 1 + r() * 2, 1 + r() * 2);
  }
  const t = tex(c);
  return { map: t, normal: normalFromHeight(hc, 3) };
}

// Oval name plate in cream with a script word, as on the Semla Kart sheet.
export function ovalPlateTexture(text) {
  const [c, g] = canvas(256, 128);
  g.fillStyle = '#7a4a22';
  g.beginPath(); g.ellipse(128, 64, 124, 60, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#f3e6c8';
  g.beginPath(); g.ellipse(128, 64, 114, 51, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#5b3416';
  g.font = 'italic bold 54px "Brush Script MT", "Segoe Script", Georgia, serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 128, 68);
  return tex(c, false);
}

// The Swedish flag.
export function swedishFlagTexture() {
  const [c, g] = canvas(160, 100);
  g.fillStyle = '#006aa7'; g.fillRect(0, 0, 160, 100);
  g.fillStyle = '#fecc02'; g.fillRect(50, 0, 20, 100); g.fillRect(0, 40, 160, 20);
  return tex(c, false);
}

// --- Winter -------------------------------------------------------------------

// Fresh snow with wind ripples and sparkle; returns colour and normal maps.
export function snowTexture() {
  const [c, g] = canvas(256, 256);
  const [hc, hg] = canvas(256, 256);
  const r = rng(77);
  g.fillStyle = '#c4c4c4'; g.fillRect(0, 0, 256, 256);
  hg.fillStyle = '#808080'; hg.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 260; i++) { // soft drifts
    const x = r() * 256, y = r() * 256, rx = 10 + r() * 40, ry = 4 + r() * 10, v = 170 + r() * 60;
    for (const [ox, oy] of [[0, 0], [256, 0], [-256, 0], [0, 256], [0, -256]]) {
      g.fillStyle = `rgba(${v},${v},${v},0.25)`; g.beginPath(); g.ellipse(x + ox, y + oy, rx, ry, 0.2, 0, 7); g.fill();
      hg.fillStyle = `rgba(255,255,255,0.12)`; hg.beginPath(); hg.ellipse(x + ox, y + oy, rx, ry, 0.2, 0, 7); hg.fill();
    }
  }
  for (let i = 0; i < 9000; i++) { const v = 200 + r() * 55; g.fillStyle = `rgba(${v},${v},${v},0.5)`; g.fillRect(r() * 256, r() * 256, 1, 1); }
  for (let i = 0; i < 400; i++) { g.fillStyle = '#ffffff'; g.fillRect(r() * 256, r() * 256, 1.5, 1.5); } // glints
  return { map: tex(c), normal: normalFromHeight(hc, 1.5) };
}

// Clear blue lake ice with white cracks and skate scratches.
export function iceTexture() {
  const [c, g] = canvas(256, 256);
  const [hc, hg] = canvas(256, 256);
  const r = rng(91);
  const grad = g.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#9fc8e0'); grad.addColorStop(0.5, '#b9dcef'); grad.addColorStop(1, '#94bfd8');
  g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
  hg.fillStyle = '#808080'; hg.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${40 + r() * 40},${90 + r() * 50},${130 + r() * 50},0.15)`; g.beginPath(); g.arc(r() * 256, r() * 256, 10 + r() * 40, 0, 7); g.fill(); }
  g.lineWidth = 1.2; hg.lineWidth = 1.5;
  for (let i = 0; i < 26; i++) { // cracks
    let x = r() * 256, y = r() * 256;
    g.strokeStyle = `rgba(245,252,255,${0.4 + r() * 0.5})`; hg.strokeStyle = '#ffffff';
    g.beginPath(); g.moveTo(x, y); hg.beginPath(); hg.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 50; y += (r() - 0.5) * 50; g.lineTo(x, y); hg.lineTo(x, y); }
    g.stroke(); hg.stroke();
  }
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 0.8;
  for (let i = 0; i < 60; i++) { // skate scratches
    const x = r() * 256, y = r() * 256, a = r() * 6.28, l = 20 + r() * 60;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.4) * l * 0.5, y + Math.sin(a + 0.4) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(r() * 256, r() * 256, 4 + r() * 14, 2 + r() * 5, r() * 3, 0, 7); g.fill(); } // snow dust
  return { map: tex(c), normal: normalFromHeight(hc, 1.2) };
}

// Freezing black water with broken ice floes.
export function icyWaterTexture() {
  const [c, g] = canvas(256, 256);
  const r = rng(13);
  g.fillStyle = '#20384a'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(${30 + r() * 30},${70 + r() * 40},${100 + r() * 40},0.4)`; g.beginPath(); g.arc(r() * 256, r() * 256, 6 + r() * 20, 0, 7); g.fill(); }
  for (let i = 0; i < 22; i++) { // floes
    const x = r() * 256, y = r() * 256, n = 5 + Math.floor(r() * 3), rad = 6 + r() * 16;
    g.fillStyle = `rgba(${215 + r() * 40},${235 + r() * 20},255,0.9)`;
    g.beginPath();
    for (let k = 0; k < n; k++) { const a = (k / n) * 6.28 + r() * 0.5, rr = rad * (0.6 + r() * 0.5); k ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    g.closePath(); g.fill();
  }
  return tex(c);
}

// Old-town cobbles with snow packed into the joints.
export function cobbleTexture() {
  const [c, g] = canvas(256, 256);
  const [hc, hg] = canvas(256, 256);
  const r = rng(55);
  g.fillStyle = '#e4e9ef'; g.fillRect(0, 0, 256, 256);
  hg.fillStyle = '#000'; hg.fillRect(0, 0, 256, 256);
  const sz = 21.33;
  for (let row = 0; row < 12; row++) for (let col = -1; col < 13; col++) {
    const x = col * sz + (row % 2) * sz / 2 + 1.5, y = row * sz + 1.5, w = sz - 3, h = sz - 3;
    const v = 85 + r() * 50, warm = r() * 14;
    g.fillStyle = `rgb(${v + warm},${v + warm * 0.6},${v})`;
    g.beginPath(); g.roundRect(x, y, w, h, 5); g.fill();
    hg.fillStyle = `rgb(${150 + r() * 100},0,0)`; hg.beginPath(); hg.roundRect(x, y, w, h, 5); hg.fill();
    if (r() < 0.3) { g.fillStyle = 'rgba(240,245,250,0.65)'; g.beginPath(); g.ellipse(x + r() * w, y + r() * h, 3 + r() * 6, 2 + r() * 3, 0, 0, 7); g.fill(); }
  }
  return { map: tex(c), normal: normalFromHeight(hc, 3) };
}

// Plastered townhouse front with white-framed windows, some lit.
export function townhouseTexture(seed, wall, floors = 3, cols = 4) {
  const [c, g] = canvas(256, 256);
  const r = rng(seed);
  g.fillStyle = wall; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.05})`; g.fillRect(r() * 256, r() * 256, 2, 2); }
  g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, 0, 256, 8); // cornice
  const fh = 256 / floors, cw = 256 / cols;
  for (let f = 0; f < floors; f++) for (let k = 0; k < cols; k++) {
    const x = k * cw + cw * 0.25, y = f * fh + fh * 0.22, w = cw * 0.5, h = fh * 0.55;
    const lit = r() < 0.45;
    g.fillStyle = '#f3efe6'; g.fillRect(x - 3, y - 3, w + 6, h + 6);
    g.fillStyle = lit ? '#ffcf6a' : '#3a4656'; g.fillRect(x, y, w, h);
    if (lit) { g.fillStyle = 'rgba(255,240,190,0.7)'; g.fillRect(x + 2, y + 2, w - 4, h * 0.35); }
    g.fillStyle = '#f3efe6'; g.fillRect(x + w / 2 - 1.5, y, 3, h); g.fillRect(x, y + h * 0.45, w, 3);
    if (lit && f === floors - 1 && r() < 0.5) { // advent star in the window
      g.fillStyle = '#fff4c8'; g.beginPath();
      for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? 4 : 9; g.lineTo(x + w / 2 + Math.cos(a) * rr, y + h * 0.3 + Math.sin(a) * rr); }
      g.fill();
    }
  }
  return tex(c, false);
}

// Falu-red board cladding with white trim, for barns and cottages.
export function faluTexture() {
  const [c, g] = canvas(128, 128);
  const r = rng(8);
  g.fillStyle = '#8e2a1e'; g.fillRect(0, 0, 128, 128);
  for (let x = 0; x < 128; x += 8) {
    g.fillStyle = `rgba(0,0,0,${0.1 + r() * 0.15})`; g.fillRect(x, 0, 1.5, 128);
    g.fillStyle = `rgba(255,255,255,${r() * 0.05})`; g.fillRect(x + 2, 0, 4, 128);
  }
  return tex(c);
}

// Yellow Swedish moose-warning triangle.
export function mooseSignTexture() {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#f5c400';
  g.beginPath(); g.moveTo(128, 14); g.lineTo(246, 234); g.lineTo(10, 234); g.closePath(); g.fill();
  g.strokeStyle = '#d0201a'; g.lineWidth = 14; g.lineJoin = 'round'; g.stroke();
  g.fillStyle = '#111';
  g.save(); g.translate(128, 168); g.scale(1.05, 1.05);
  g.beginPath(); // body
  g.ellipse(4, 0, 46, 20, 0, 0, 7); g.fill();
  g.fillRect(-36, 8, 7, 40); g.fillRect(-20, 10, 7, 38); g.fillRect(22, 10, 7, 38); g.fillRect(38, 8, 7, 40); // legs
  g.beginPath(); g.moveTo(-34, -10); g.lineTo(-56, -26); g.lineTo(-74, -18); g.lineTo(-76, -8); g.lineTo(-58, -4); g.lineTo(-38, 8); g.fill(); // neck + head
  g.beginPath(); g.moveTo(-50, -26); g.lineTo(-62, -48); g.lineTo(-54, -40); g.lineTo(-50, -54); g.lineTo(-46, -38); g.lineTo(-38, -50); g.lineTo(-40, -30); g.fill(); // antlers
  g.restore();
  return tex(c, false);
}

// --- San Francisco -----------------------------------------------------------

// Choppy blue-green bay water with whitecap glints.
export function bayWaterTexture() {
  const [c, g] = canvas(256, 256);
  const r = rng(91);
  g.fillStyle = '#2f6577'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(${30 + r() * 40},${90 + r() * 50},${110 + r() * 40},0.35)`; g.beginPath(); g.ellipse(r() * 256, r() * 256, 8 + r() * 26, 3 + r() * 8, 0, 0, 7); g.fill(); }
  for (let i = 0; i < 260; i++) { // wave crests
    const x = r() * 256, y = r() * 256, w = 3 + r() * 10;
    g.strokeStyle = `rgba(220,240,245,${0.15 + r() * 0.35})`; g.lineWidth = 1 + r();
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 2, x + w, y); g.stroke();
  }
  return tex(c);
}

// Red paving bricks laid in a herringbone, for the crooked street.
export function brickRoadTexture() {
  const [c, g] = canvas(256, 256);
  const [hc, hg] = canvas(256, 256);
  const r = rng(77);
  g.fillStyle = '#6a3a2c'; g.fillRect(0, 0, 256, 256);
  hg.fillStyle = '#000'; hg.fillRect(0, 0, 256, 256);
  const u = 16;
  for (let i = -2; i < 18; i++) for (let j = -2; j < 18; j++) {
    const x = i * u + (j % 2) * u / 2, y = j * u;
    for (const [bx, by, bw, bh] of [[x, y, u * 2 - 2, u / 2 - 2], [x + u, y + u / 2, u / 2 - 2, u - 2]]) {
      const v = 120 + r() * 50;
      g.fillStyle = `rgb(${v + 40},${v * 0.45},${v * 0.35})`;
      g.fillRect(bx + 1, by + 1, bw, bh);
      hg.fillStyle = `rgb(${170 + r() * 80},0,0)`; hg.fillRect(bx + 1, by + 1, bw, bh);
    }
  }
  return { map: tex(c), normal: normalFromHeight(hc, 2.5) };
}

// A Victorian row-house front: pastel clapboard, tall bay windows, white trim.
export function victorianTexture(seed, wall, trim = '#f6f1e6') {
  const [c, g] = canvas(128, 256);
  const r = rng(seed);
  g.fillStyle = wall; g.fillRect(0, 0, 128, 256);
  for (let y = 0; y < 256; y += 6) { g.fillStyle = 'rgba(0,0,0,0.07)'; g.fillRect(0, y, 128, 1.5); } // clapboard
  g.fillStyle = trim;
  g.fillRect(0, 0, 128, 10); g.fillRect(0, 84, 128, 6); g.fillRect(0, 168, 128, 6); // cornice and floor bands
  g.fillRect(0, 0, 5, 256); g.fillRect(123, 0, 5, 256);
  for (let f = 0; f < 3; f++) {
    const y = 18 + f * 84;
    for (const x of f === 2 ? [14] : [14, 70]) {
      const w = f === 2 ? 46 : 44, h = 56;
      const lit = r() < 0.3;
      g.fillStyle = trim; g.fillRect(x - 4, y - 6, w + 8, h + 10);
      g.fillStyle = lit ? '#ffd88a' : '#2c3a4c'; g.fillRect(x, y, w, h);
      g.fillStyle = trim; g.fillRect(x + w / 2 - 2, y, 4, h); g.fillRect(x, y + h * 0.4, w, 3);
      g.beginPath(); g.moveTo(x - 6, y - 6); g.lineTo(x + w / 2, y - 14); g.lineTo(x + w + 6, y - 6); g.fill(); // pediment
    }
    if (f === 2) { // front door with steps
      g.fillStyle = '#7a3324'; g.fillRect(76, y + 6, 32, 64);
      g.fillStyle = trim; g.fillRect(72, y + 2, 40, 5);
    }
  }
  return tex(c, false);
}

// Office-tower curtain wall: a grid of glass panels, some catching the light.
export function officeTexture(seed, tint = [120, 150, 170]) {
  const [c, g] = canvas(128, 256);
  const r = rng(seed);
  g.fillStyle = '#d9dcdc'; g.fillRect(0, 0, 128, 256);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) {
    const k = 0.75 + r() * 0.35;
    g.fillStyle = `rgb(${tint[0] * k},${tint[1] * k},${tint[2] * k})`;
    g.fillRect(x * 16 + 2, y * 16 + 3, 12, 11);
    if (r() < 0.12) { g.fillStyle = 'rgba(255,240,200,0.6)'; g.fillRect(x * 16 + 2, y * 16 + 3, 12, 5); }
  }
  return tex(c);
}

// Rolling wave normals for open water: soft overlapping swells, tileable.
let waterNormal = null;
export function waterNormalTexture() {
  if (waterNormal) return waterNormal;
  const [c, g] = canvas(256, 256);
  const img = g.createImageData(256, 256), r = rng(404);
  const waves = Array.from({ length: 9 }, () => ({ kx: Math.round(1 + r() * 5) * (r() < 0.5 ? -1 : 1), ky: Math.round(1 + r() * 5), ph: r() * 6.28, a: 0.4 + r() * 0.6 }));
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    let h = 0;
    for (const w of waves) h += w.a * Math.sin(((w.kx * x + w.ky * y) / 256) * Math.PI * 2 + w.ph);
    const v = Math.max(0, Math.min(255, 128 + h * 32)), i = (y * 256 + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return (waterNormal = normalFromHeight(c, 3));
}

// The Qoq Mobile badge: red italic lettering on a white plate with a red rim.
export function qoqBadgeTexture() {
  const [c, g] = canvas(320, 112);
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  g.fillStyle = '#c8141c'; rr(4, 4, 312, 104, 28); g.fill();
  g.fillStyle = '#ffffff'; rr(14, 14, 292, 84, 20); g.fill();
  g.fillStyle = '#c8141c'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = 'italic 900 52px "Arial Black", Impact, sans-serif';
  let px = 52; while (g.measureText('Qoq Mobile').width > 270) g.font = `italic 900 ${px -= 2}px "Arial Black", Impact, sans-serif`;
  g.fillText('Qoq Mobile', 160, 60);
  return tex(c, false);
}
