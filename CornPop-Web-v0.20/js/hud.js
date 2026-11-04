import { W2, W2_KEYS } from './weapons2.js';
// Quake-style status bar, notify lines and centerprint drawn with a 5x7 bitmap font
// into a low-res canvas (240 px tall virtual screen), upscaled with nearest filtering.
import * as THREE from 'three';

const G = {
  A: '01110,10001,10001,11111,10001,10001,10001', B: '11110,10001,10001,11110,10001,10001,11110', C: '01110,10001,10000,10000,10000,10001,01110',
  D: '11110,10001,10001,10001,10001,10001,11110', E: '11111,10000,10000,11110,10000,10000,11111', F: '11111,10000,10000,11110,10000,10000,10000',
  G: '01110,10001,10000,10111,10001,10001,01111', H: '10001,10001,10001,11111,10001,10001,10001', I: '01110,00100,00100,00100,00100,00100,01110',
  J: '00111,00010,00010,00010,00010,10010,01100', K: '10001,10010,10100,11000,10100,10010,10001', L: '10000,10000,10000,10000,10000,10000,11111',
  M: '10001,11011,10101,10101,10001,10001,10001', N: '10001,10001,11001,10101,10011,10001,10001', O: '01110,10001,10001,10001,10001,10001,01110',
  P: '11110,10001,10001,11110,10000,10000,10000', Q: '01110,10001,10001,10001,10101,10010,01101', R: '11110,10001,10001,11110,10100,10010,10001',
  S: '01111,10000,10000,01110,00001,00001,11110', T: '11111,00100,00100,00100,00100,00100,00100', U: '10001,10001,10001,10001,10001,10001,01110',
  V: '10001,10001,10001,10001,10001,01010,00100', W: '10001,10001,10001,10101,10101,10101,01010', X: '10001,10001,01010,00100,01010,10001,10001',
  Y: '10001,10001,10001,01010,00100,00100,00100', Z: '11111,00001,00010,00100,01000,10000,11111',
  0: '01110,10001,10011,10101,11001,10001,01110', 1: '00100,01100,00100,00100,00100,00100,01110', 2: '01110,10001,00001,00010,00100,01000,11111',
  3: '11111,00010,00100,00010,00001,10001,01110', 4: '00010,00110,01010,10010,11111,00010,00010', 5: '11111,10000,11110,00001,00001,10001,01110',
  6: '00110,01000,10000,11110,10001,10001,01110', 7: '11111,00001,00010,00100,01000,01000,01000', 8: '01110,10001,10001,01110,10001,10001,01110',
  9: '01110,10001,10001,01111,00001,00010,01100',
  '.': '00000,00000,00000,00000,00000,01100,01100', ',': '00000,00000,00000,00000,01100,00100,01000', '!': '00100,00100,00100,00100,00100,00000,00100',
  '?': '01110,10001,00001,00010,00100,00000,00100', ':': '00000,01100,01100,00000,01100,01100,00000', "'": '00100,00100,01000,00000,00000,00000,00000',
  '-': '00000,00000,00000,11111,00000,00000,00000', '/': '00001,00010,00010,00100,01000,01000,10000', '(': '00010,00100,01000,01000,01000,00100,00010',
  ')': '01000,00100,00010,00010,00010,00100,01000', '+': '00000,00100,00100,11111,00100,00100,00000', '%': '11000,11001,00010,00100,01000,10011,00011',
  '=': '00000,00000,11111,00000,11111,00000,00000', '>': '01000,00100,00010,00001,00010,00100,01000', '<': '00010,00100,01000,10000,01000,00100,00010',
  '"': '01010,01010,00000,00000,00000,00000,00000', '#': '01010,01010,11111,01010,11111,01010,01010', '&': '01100,10010,10100,01000,10101,10010,01101',
  '_': '00000,00000,00000,00000,00000,00000,11111', '*': '00000,00100,10101,01110,10101,00100,00000',
};
const GLYPH = {}; for (const [k, v] of Object.entries(G)) GLYPH[k] = v.split(',').map(r => [...r].map(Number));

export function textWidth(s, scale = 1) { return s.length * 6 * scale - scale; }
export function drawText(g, s, x, y, color = '#d8b070', scale = 1, shadow = '#000') {
  s = String(s).toUpperCase();
  const pass = (ox, oy, col) => {
    g.fillStyle = col; let cx = x;
    for (const ch of s) { const gl = GLYPH[ch]; if (gl) for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (gl[r][c]) g.fillRect(cx + c * scale + ox, y + r * scale + oy, scale, scale); cx += 6 * scale; }
  };
  if (shadow) pass(scale > 1 ? 2 : 1, scale > 1 ? 2 : 1, shadow);
  pass(0, 0, color);
}
function bigNum(g, s, x, y, col1, col2) { // chunky gradient digits like Quake's sbar numbers
  s = String(s); const sc = 3;
  drawText(g, s, x + 1, y + 1, '#000', sc, null);
  let cx = x;
  for (const ch of s) {
    const gl = GLYPH[ch]; if (gl) for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (gl[r][c]) {
      g.fillStyle = r < 3 ? col1 : col2; g.fillRect(cx + c * sc, y + r * sc, sc, sc);
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(cx + c * sc, y + r * sc, sc, 1);
    }
    cx += 6 * sc;
  }
}

export const KEY_COLORS = { red: ['#ff3a2a', '#901010'], blue: ['#4a8aff', '#1a2a90'], gold: ['#ffd040', '#a06a10'] };

export class HUD {
  constructor() {
    this.canvas = document.createElement('canvas'); this.g = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas); this.tex.magFilter = THREE.NearestFilter; this.tex.minFilter = THREE.NearestFilter; this.tex.generateMipmaps = false; this.tex.colorSpace = THREE.NoColorSpace;
    this.scene = new THREE.Scene(); this.cam = new THREE.OrthographicCamera(0, 1, 0, 1, -1, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide }));
    this.scene.add(this.quad);
    this.face = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ depthTest: false, depthWrite: false, side: THREE.DoubleSide, transparent: true }));
    this.face.renderOrder = 2; this.scene.add(this.face);
    this.quad.frustumCulled = false; this.face.frustumCulled = false;
    this.notify = []; this.center = null; this.dirty = true; this.state = {};
    this.sbarBg = this.makeSbarBg();
  }
  makeSbarBg() {
    const c = document.createElement('canvas'); c.width = 320; c.height = 44; const g = c.getContext('2d');
    // brown riveted metal like the original status bar
    let s = 77; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let y = 0; y < 44; y++) for (let x = 0; x < 320; x++) { const k = 0.75 + r() * 0.35; g.fillStyle = `rgb(${88 * k | 0},${62 * k | 0},${40 * k | 0})`; g.fillRect(x, y, 1, 1); }
    g.fillStyle = 'rgba(255,220,170,0.35)'; g.fillRect(0, 0, 320, 1); g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 43, 320, 1);
    const panel = (x, w) => { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x, 3, w, 38); g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x, 3, w, 1); g.fillRect(x, 3, 1, 38); g.fillStyle = 'rgba(255,220,170,0.25)'; g.fillRect(x, 40, w, 1); g.fillRect(x + w - 1, 3, 1, 38); };
    panel(4, 68); panel(76, 40); panel(120, 62); panel(186, 66); panel(256, 60);
    for (const x of [2, 74, 118, 184, 254, 318]) for (const y of [4, 39]) { g.fillStyle = '#c8a070'; g.fillRect(x, y, 1, 1); g.fillStyle = '#2a1a10'; g.fillRect(x + 1, y + 1, 1, 1); }
    return c;
  }
  resize(w, h) {
    this.H = 240; this.W = Math.max(320, Math.round(240 * w / h));
    this.canvas.width = this.W; this.canvas.height = this.H;
    this.cam.left = 0; this.cam.right = this.W; this.cam.top = 0; this.cam.bottom = this.H; this.cam.updateProjectionMatrix();
    this.quad.scale.set(this.W, -this.H, 1); this.quad.position.set(this.W / 2, this.H / 2, 0);
    this.dirty = true;
  }
  print(msg) { this.notify.push({ msg, t: 3.5 }); if (this.notify.length > 4) this.notify.shift(); this.dirty = true; }
  centerPrint(msg, t = 2.5, align = 'center') { // long lines wrap at ~40 characters so they fit a phone screen
    if (align === 'center') msg = String(msg).split('\n').map(line => { if (line.length <= 42) return line; const out = []; let cur = ''; for (const w of line.split(' ')) { if (cur && (cur + ' ' + w).length > 40) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; } if (cur) out.push(cur); return out.join('\n'); }).join('\n');
    this.center = { msg, t, align }; this.dirty = true; }
  update(dt) {
    for (const n of this.notify) n.t -= dt; const before = this.notify.length; this.notify = this.notify.filter(n => n.t > 0); if (this.notify.length !== before) this.dirty = true;
    if (this.center) { this.center.t -= dt; if (this.center.t <= 0) { this.center = null; this.dirty = true; } }
  }
  set(state) { // state: {health, keys:Set, slices, slicesTotal, secrets, secretsTotal, crosshair, visible}
    const k = JSON.stringify({ ...state, keys: [...(state.keys || [])] });
    if (k !== this.lastKey) { this.lastKey = k; this.state = state; this.dirty = true; }
  }
  redraw() {
    const g = this.g, W = this.W, H = this.H, st = this.state;
    g.clearRect(0, 0, W, H);
    // notify lines (top-left)
    this.notify.forEach((n, i) => drawText(g, n.msg, 4, 4 + i * 9, '#e8c890'));
    if (this.center) {
      const lines = this.center.msg.split('\n');
      const bw = Math.max(...lines.map(l => textWidth(l))) + 24;
      const cx = this.center.align === 'left' ? Math.round(Math.max(bw / 2 + 8, W * 0.22)) : Math.round(W / 2);
      const top = Math.round(H * (this.center.align === 'left' ? 0.12 : 0.3));
      if (lines.length > 3) { g.fillStyle = 'rgba(12,8,5,0.78)'; g.fillRect(cx - Math.round(bw / 2), top - 10, bw, lines.length * 10 + 16); g.strokeStyle = '#6a4428'; g.strokeRect(cx - Math.round(bw / 2) + 0.5, top - 9.5, bw - 1, lines.length * 10 + 15); }
      lines.forEach((ln, i) => drawText(g, ln, Math.round(cx - textWidth(ln) / 2), top + i * 10, '#ffe0a0'));
    }
    if (st.crosshair) { g.fillStyle = 'rgba(255,230,180,0.75)'; g.fillRect(W / 2 | 0, H / 2 - 2 | 0, 1, 5); g.fillRect(W / 2 - 2 | 0, H / 2 | 0, 5, 1); }
    if (st.visible === false) { this.tex.needsUpdate = true; this.face.visible = false; return; }
    this.face.visible = true;
    const x0 = Math.round(W / 2 - 160), y0 = H - 44;
    g.drawImage(this.sbarBg, x0, y0);
    // keycards
    const keys = st.keys || new Set();
    ['red', 'blue', 'gold'].forEach((c, i) => {
      const kx = x0 + 9 + i * 21, ky = y0 + 9;
      if (keys.has(c)) {
        const [a, b] = KEY_COLORS[c];
        g.fillStyle = '#000'; g.fillRect(kx + 1, ky + 1, 18, 14);
        g.fillStyle = b; g.fillRect(kx, ky, 18, 14); g.fillStyle = a; g.fillRect(kx + 1, ky + 1, 16, 6);
        g.fillStyle = '#f0f0e0'; g.fillRect(kx + 2, ky + 9, 7, 2); g.fillStyle = '#e0c060'; g.fillRect(kx + 12, ky + 8, 4, 4);
      } else { g.strokeStyle = 'rgba(0,0,0,0.6)'; g.strokeRect(kx + 0.5, ky + 0.5, 17, 13); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(kx + 1, ky + 1, 16, 12); }
      drawText(g, c[0], kx + 7, ky + 18, keys.has(c) ? KEY_COLORS[c][0] : '#5a4030', 1, keys.has(c) ? '#000' : null);
    });
    drawText(g, 'KEYS', x0 + 27, y0 + 33, '#a08060', 1, null);
    // face slot (filled by the 3D portrait quad)
    this.faceRect = [x0 + 77, y0 + 4, 38, 36];
    // health
    const hp = Math.max(0, Math.ceil(st.health ?? 100));
    bigNum(g, String(hp).padStart(3, ' '), x0 + 124, y0 + 8, hp > 25 ? '#ffd27a' : '#ff5a3a', hp > 25 ? '#c07a2a' : '#a02010');
    drawText(g, 'HEALTH', x0 + 134, y0 + 33, hp > 25 ? '#a08060' : '#ff6040', 1, null);
    // ammo (super soaker juice)
    if (st.weapon) {
      const am = Math.max(0, st.ammo | 0);
      const w2 = W2[st.weapon];
      if (w2) {
        bigNum(g, String(am).padStart(3, ' '), x0 + 192, y0 + 8, am > w2.low ? w2.col : '#ff6a3a', am > w2.low ? w2.dark : '#a03010');
        g.fillStyle = w2.pip; g.fillRect(x0 + 197, y0 + 32, 5, 5); g.fillStyle = '#fff'; g.fillRect(x0 + 198, y0 + 33, 1, 1);
        drawText(g, w2.label, x0 + 205, y0 + 33, w2.col, 1, null);
      } else if (st.weapon === 'turd') {
        bigNum(g, String(am).padStart(3, ' '), x0 + 192, y0 + 8, am > 3 ? '#d09a60' : '#ff6a3a', am > 3 ? '#7a4a20' : '#a03010');
        g.fillStyle = '#6a3a18'; g.fillRect(x0 + 197, y0 + 35, 7, 2); g.fillRect(x0 + 198, y0 + 33, 5, 2); g.fillRect(x0 + 199, y0 + 31, 3, 2);
        drawText(g, 'TURDS', x0 + 206, y0 + 33, '#a07850', 1, null);
      } else if (st.weapon === 'candygun') {
        bigNum(g, String(am).padStart(3, ' '), x0 + 192, y0 + 8, am > 30 ? '#ffd040' : '#ff7a2a', am > 30 ? '#c07010' : '#a03010');
        g.fillStyle = '#ffc21a'; g.fillRect(x0 + 199, y0 + 36, 5, 2); g.fillStyle = '#ff7a12'; g.fillRect(x0 + 200, y0 + 34, 3, 2); g.fillStyle = '#fff6e0'; g.fillRect(x0 + 201, y0 + 32, 1, 2);
        drawText(g, 'CANDY', x0 + 206, y0 + 33, '#c0a050', 1, null);
      } else if (st.weapon === 'shotgun') {
        bigNum(g, String(am).padStart(3, ' '), x0 + 192, y0 + 8, am > 6 ? '#ffb27a' : '#ff6a3a', am > 6 ? '#b05a2a' : '#a03010');
        g.fillStyle = '#b5562e'; g.fillRect(x0 + 194, y0 + 34, 7, 3); g.fillStyle = '#e0906a'; g.fillRect(x0 + 195, y0 + 34, 4, 1);
        drawText(g, 'SAUSAGE', x0 + 203, y0 + 33, '#c08060', 1, null);
      } else {
        bigNum(g, String(am).padStart(3, ' '), x0 + 192, y0 + 8, am > 20 ? '#fff060' : '#ff8a3a', am > 20 ? '#c0a010' : '#a03010');
        g.fillStyle = '#ffe030'; g.fillRect(x0 + 200, y0 + 34, 3, 4); g.fillRect(x0 + 201, y0 + 32, 1, 2);
        drawText(g, 'JUICE', x0 + 206, y0 + 33, '#b0a050', 1, null);
      }
      if (st.weapons > 1) ['soaker', 'shotgun', 'candygun', 'turd'].forEach((w, k) => { g.fillStyle = st.weapon === w ? ['#ffe030', '#ff9a5a', '#ffc21a', '#c08a50'][k] : '#5a3a24'; g.fillRect(x0 + 186, y0 + 5 + k * 4, 3, 3); });
      if (st.owned && st.owned.length) W2_KEYS.forEach((w, k) => { if (!st.owned.includes(w)) return; g.fillStyle = st.weapon === w ? W2[w].pip : '#5a3a24'; g.fillRect(x0 + 181, y0 + 5 + k * 4, 3, 3); });
    } else drawText(g, 'NO WEAPON', x0 + 192, y0 + 18, '#6a5040', 1, null);
    // slices + secrets
    const sx = x0 + 260, sy = y0 + 8;
    g.fillStyle = '#b06a2a'; g.fillRect(sx, sy, 12, 3);
    g.fillStyle = '#f0b040'; g.beginPath(); g.moveTo(sx, sy + 3); g.lineTo(sx + 12, sy + 3); g.lineTo(sx + 6, sy + 16); g.fill();
    g.fillStyle = '#b81e10'; g.fillRect(sx + 3, sy + 5, 2, 2); g.fillRect(sx + 7, sy + 6, 2, 2); g.fillRect(sx + 5, sy + 9, 2, 2);
    drawText(g, String(st.slices ?? 0), sx + 15, sy + 1, '#ffd27a', 2);
    drawText(g, `/${st.slicesTotal ?? 0}`, sx + 16 + textWidth(String(st.slices ?? 0), 2) + 2, sy + 8, '#c09060', 1, null);
    drawText(g, `SEC ${st.secrets ?? 0}/${st.secretsTotal ?? 0}`, x0 + 262, y0 + 33, '#a08060', 1, null);
    this.tex.needsUpdate = true;
  }
  render(renderer, portraitTex) {
    if (this.dirty) { this.redraw(); this.dirty = false; }
    if (this.faceRect) {
      const [x, y, w, h] = this.faceRect; this.face.material.map = portraitTex;
      this.face.scale.set(w, -h, 1); this.face.position.set(x + w / 2, y + h / 2, 0.5);
      // crop the square portrait to the slot aspect
      portraitTex.repeat.set(1, h / w); portraitTex.offset.set(0, (1 - h / w) / 2);
    }
    renderer.autoClear = false; renderer.render(this.scene, this.cam); renderer.autoClear = true;
  }
}
