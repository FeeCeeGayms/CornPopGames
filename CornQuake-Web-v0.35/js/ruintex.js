// Textures for the Crypt of Hornt (Episode 1 since v0.28): weathered ruin blocks, bone walls, blood-stained stone, hell rock,
// glowing runes, flagstones, rusted iron and spikes. Same recipe as textures.js: 64x64 pixel art, alpha = fullbright mask,
// pure magenta = see-through.
import { Pix, hex, srand, rnd } from './textures.js';

const KEY = [1, 0, 1];
function line(p, x0, y0, x1, y1, c, glow, w = 1) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let a = 0; a < w; a++) for (let b = 0; b < w; b++) p.set(x + a, y + b, c, glow); } }
function disc(p, cx, cy, r, c, glow) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) p.set(cx + x, cy + y, c, glow); }
// a jagged crack: darkens along a wandering path
function crack(p, x, y, len, dx = 0.4, k = 0.45) { let a = Math.PI / 2 + (rnd() - 0.5) * dx * 4; for (let i = 0; i < len; i++) { p.mul(x, y, k); p.mul(x + 1, y, 0.8); x += Math.cos(a); y += Math.sin(a); a += (rnd() - 0.5) * 0.9; if (rnd() < 0.06) crack(p, x, y, len * 0.3, dx, k); } }
// irregular stone blocks: rows of different heights, blocks of different widths, chipped corners, some missing
function blocks(base, mortar, s, o = {}) {
  srand(s); const p = new Pix(64, 64); p.fill(mortar, 0.25);
  const rows = o.rows || [14, 18, 12, 20]; let y0 = 0, r = 0;
  while (y0 < 64) { const h = rows[r % rows.length]; let x0 = -Math.floor(rnd() * 12); r++;
    while (x0 < 64) { const w = (o.minW || 14) + Math.floor(rnd() * (o.varW || 16)); const k = 1 + (rnd() - 0.5) * (o.var ?? 0.45), tint = 0.94 + rnd() * 0.12; const gone = rnd() < (o.missing ?? 0.06);
      for (let y = y0 + 1; y < Math.min(64, y0 + h) - 0; y++) for (let x = Math.max(0, x0 + 1); x < Math.min(64, x0 + w); x++) {
        const chip = (x - x0 < 3 && y - y0 < 3 && rnd() < 0.6) || (x0 + w - x < 3 && y0 + h - y < 3 && rnd() < 0.6); if (chip) continue;
        const n = 1 + (rnd() - 0.5) * 0.12, g = gone ? 0.38 : 1; p.set(x, y, [base[0] * k * n * g, base[1] * k * n * tint * g, base[2] * k * n * g]); }
      for (let x = Math.max(0, x0 + 1); x < Math.min(64, x0 + w); x++) { p.mul(x, y0 + 1, 1.22); p.mul(x, Math.min(63, y0 + h - 1), 0.7); }
      x0 += w; }
    y0 += h; }
  p.cloudy(1, 0.5); p.speckle(110, 0.6, 1.15);
  for (let i = 0; i < (o.cracks ?? 5); i++) crack(p, rnd() * 64, rnd() * 30, 14 + rnd() * 26);
  return p;
}
const SKULL = ['..XXXXXX..', '.XXXXXXXX.', 'XXXXXXXXXX', 'XX..XX..XX', 'XX..XX..XX', 'XXXX..XXXX', '.XXXXXXXX.', '..X.XX.X..', '..XXXXXX..'];
function skull(p, x0, y0, c, k = 1, eye) { SKULL.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 'X') { const n = (0.82 + rnd() * 0.3) * k * (y < 2 ? 1.15 : y > 6 ? 0.8 : 1); p.set(x0 + x, y0 + y, [c[0] * n, c[1] * n, c[2] * n]); } else if (eye && y > 2 && y < 5 && ch === '.' && x > 0 && x < 9) p.set(x0 + x, y0 + y, eye, 0.9); else if (y > 2 && y < 8 && x > 0 && x < 9) p.set(x0 + x, y0 + y, [0.03, 0.02, 0.02]); })); }
const RUNES = [[[0, 0, 0, 8], [0, 0, 4, 3], [4, 3, 0, 5]], [[0, 0, 4, 8], [4, 0, 0, 8]], [[2, 0, 2, 8], [0, 2, 4, 4], [0, 5, 4, 7]], [[0, 8, 2, 0], [2, 0, 4, 8], [1, 5, 3, 5]], [[0, 0, 4, 0], [4, 0, 0, 8], [0, 8, 4, 8]], [[0, 0, 0, 8], [0, 4, 4, 0], [0, 4, 4, 8]], [[2, 0, 2, 8], [2, 0, 4, 3], [2, 8, 0, 5]], [[0, 0, 4, 4], [4, 4, 0, 8], [4, 0, 4, 8]]];
function rune(p, i, x, y, c, glow = 1, sc = 1) { for (const [a, b, d, e] of RUNES[i % RUNES.length]) line(p, x + a * sc, y + b * sc, x + d * sc, y + e * sc, c, glow, sc > 1 ? 2 : 1); }

export function addRuinTextures(T) {
  // see-through textures stay unfiltered: mipmaps or smoothing would blur the magenta key into a pink fringe
  const tx = p => p.toTexture(), txKey = p => { const t = p.toTexture({ noMip: true }); t.userData.noFilter = true; return t; };
  for (const k of ['railing', 'bars']) if (T[k]) T[k].userData.noFilter = true;
  // ---- walls ----
  T.ruinwall = tx((() => { const p = blocks(hex(0x74634c), hex(0x1c1610), 501); p.drips(12, 0.72); return p; })());
  T.ruinwall2 = tx((() => { const p = blocks(hex(0x48423c), hex(0x14110f), 502, { rows: [16, 12, 20, 16], missing: 0.04, var: 0.24 }); srand(503); for (let i = 0; i < 90; i++) { const x = rnd() * 64, y = 40 + rnd() * 24; p.set(x, y, [0.14 + rnd() * 0.08, 0.24 + rnd() * 0.12, 0.08]); } p.drips(16, 0.7); return p; })());
  T.ruindark = tx(blocks(hex(0x3c3836), hex(0x0c0a0a), 504, { rows: [21, 22, 21], minW: 20, varW: 14, cracks: 8 }));
  T.bloodwall = tx((() => { const p = blocks(hex(0x3c2e2a), hex(0x100a09), 505, { rows: [16, 16, 16, 16], minW: 16, varW: 10, missing: 0.03, var: 0.26 }); srand(506);
    for (let i = 0; i < 9; i++) { const x = rnd() * 64 | 0, y0 = rnd() * 64 | 0; const len = 8 + rnd() * 36; for (let j = 0; j < len; j++) { const w = j < 4 ? 3 : j < len * 0.6 ? 2 : 1; for (let k = 0; k < w; k++) p.set(x + k, y0 + j, [0.3 - j / len * 0.12, 0.012, 0.012]); } disc(p, x + 1, y0 + len, 1, [0.26, 0.012, 0.012]); }
    for (let i = 0; i < 5; i++) { const cx = rnd() * 64, cy = rnd() * 64; for (let k = 0; k < 26; k++) { const a = rnd() * 6.3, d = Math.sqrt(rnd()) * 5; p.set(cx + Math.cos(a) * d, cy + Math.sin(a) * d, [0.27, 0.012, 0.012]); } } return p; })());
  T.bonewall = tx((() => { srand(507); const p = new Pix(64, 64); p.fill(hex(0x2a2018), 0.3); p.cloudy(2, 0.6); const bone = hex(0xb8ac8c);
    for (let i = 0; i < 26; i++) { const x = rnd() * 64, y = rnd() * 64, a = rnd() * 3.1, l = 5 + rnd() * 9; const k = 0.45 + rnd() * 0.4; line(p, x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, [bone[0] * k, bone[1] * k, bone[2] * k], undefined, 2); disc(p, x, y, 1, bone); disc(p, x + Math.cos(a) * l, y + Math.sin(a) * l, 1, bone); }
    for (const [x, y] of [[3, 4], [19, 2], [36, 5], [51, 3], [10, 22], [27, 20], [44, 23], [58, 21], [2, 40], [18, 38], [35, 41], [50, 39], [11, 54], [28, 52], [43, 55]]) skull(p, x + (rnd() * 3 | 0), y + (rnd() * 3 | 0), bone, 0.7 + rnd() * 0.4);
    p.speckle(200, 0.5, 1.1); p.drips(8, 0.7); return p; })());
  T.hellrock = tx((() => { srand(508); const p = new Pix(64, 64); p.fill(hex(0x4a2018), 0.3); p.cloudy(1, 0.9); p.cloudy(2, 0.6); p.cloudy(4, 0.35); p.speckle(400, 0.5, 1.3);
    for (let i = 0; i < 16; i++) crack(p, rnd() * 64, rnd() * 64, 16 + rnd() * 30, 0.6, 0.35); for (let i = 0; i < 40; i++) { const x = rnd() * 64, y = rnd() * 64; p.mul(x, y, 1.7); p.mul(x + 1, y + 1, 0.45); } return p; })());
  T.obsidian = tx((() => { srand(509); const p = new Pix(64, 64); p.fill(hex(0x121016), 0.25); p.cloudy(1, 0.8); p.cloudy(3, 0.4);
    for (let i = 0; i < 7; i++) { let x = rnd() * 64, y = rnd() * 64, a = rnd() * 6.3; for (let j = 0; j < 30 + rnd() * 40; j++) { p.set(x, y, [0.95, 0.16 + rnd() * 0.12, 0.03], 0.85); p.add(x + 1, y, [0.2, 0.02, 0]); p.add(x, y + 1, [0.2, 0.02, 0]); x += Math.cos(a); y += Math.sin(a); a += (rnd() - 0.5) * 0.8; } }
    for (let i = 0; i < 60; i++) p.mul(rnd() * 64, rnd() * 64, 2.2); return p; })());
  T.runewall = tx((() => { const p = blocks(hex(0x3a3434), hex(0x0c0a0a), 510, { rows: [24, 16, 24], minW: 18, varW: 12, cracks: 3 }); p.rect(0, 24, 64, 16, [0.07, 0.05, 0.05], 0.2); p.bevel(0, 24, 64, 16, 0.6, 1.5); srand(511);
    for (let i = 0; i < 9; i++) rune(p, (rnd() * 8) | 0, 2 + i * 7, 28, [1, 0.2 + rnd() * 0.12, 0.05]); return p; })());
  T.runelight = tx((() => { srand(512); const p = new Pix(32, 32); p.fill([0.1, 0.04, 0.03], 0.2); for (let y = 2; y < 30; y++) for (let x = 2; x < 30; x++) { const d = Math.hypot(x - 15.5, y - 15.5) / 14; p.set(x, y, [1, 0.5 - d * 0.3, 0.12 - d * 0.08], 1 - d * 0.35); } p.bevel(0, 0, 32, 32, 0.5, 0.3);
    rune(p, 2, 9, 9, [1, 0.95, 0.7], 1, 2); rune(p, 5, 18, 9, [1, 0.95, 0.7], 1, 2); return p; })());
  T.demonface = tx((() => { const p = blocks(hex(0x4a4240), hex(0x100c0c), 513, { rows: [32, 32], minW: 30, varW: 4, cracks: 2, missing: 0 }); srand(514); const c = [0.34, 0.3, 0.29], d = [0.07, 0.05, 0.05];
    for (let y = 8; y < 58; y++) for (let x = 12; x < 52; x++) { const u = (x - 32) / 20, v = (y - 34) / 25; if (u * u + v * v * (v > 0 ? 1.5 : 0.9) < 1) { const sh = 1.15 - Math.abs(u) * 0.5 - Math.max(0, v) * 0.3 + (rnd() - 0.5) * 0.15; p.set(x, y, [c[0] * sh, c[1] * sh, c[2] * sh]); } }
    for (const s of [-1, 1]) { line(p, 32 + s * 13, 8, 32 + s * 21, -2, c, undefined, 3); line(p, 32 + s * 21, -2, 32 + s * 19, -7, c, undefined, 2);            // horns
      for (let k = 0; k < 6; k++) line(p, 32 + s * 5, 27 + k, 32 + s * 15, 22 + k * 0.9, k < 5 ? [1, 0.3 + k * 0.05, 0.04] : d, k < 5 ? 1 : undefined);                    // slanted burning eyes
      line(p, 32 + s * 4, 23, 32 + s * 17, 18, d, undefined, 2); }
    line(p, 30, 34, 29, 40, d); line(p, 34, 34, 35, 40, d);                                                                                       // nose
    p.rect(21, 45, 22, 8, d); for (let x = 22; x < 43; x += 4) { line(p, x, 45, x + 1, 48, [0.8, 0.78, 0.66]); line(p, x + 2, 52, x + 1, 49, [0.8, 0.78, 0.66]); } // fangs
    return p; })());
  T.skullfrieze = tx((() => { srand(515); const p = new Pix(64, 16); p.fill(hex(0x2c2624), 0.2); p.bevel(0, 0, 64, 16, 1.4, 0.5); for (let x = 3; x < 64; x += 16) skull(p, x, 3, hex(0xa89c80), 0.9); return p; })());
  T.ruintrim = tx((() => { srand(516); const p = new Pix(64, 16); p.fill(hex(0x4c4238), 0.25); p.cloudy(2, 0.5); p.bevel(0, 0, 64, 16, 1.4, 0.5); for (let x = 2; x < 64; x += 8) { p.shade(x, 4, 4, 8, 0.6); p.mul(x, 4, 1.5); } for (let i = 0; i < 3; i++) crack(p, rnd() * 64, 0, 12); return p; })());
  T.vaultceil = tx((() => { const p = blocks(hex(0x34302e), hex(0x0a0808), 517, { rows: [32, 32], minW: 30, varW: 4, cracks: 6, missing: 0.12 }); p.bevel(0, 0, 64, 64, 0.6, 0.5); return p; })());
  // doors: iron-bound black wood with a skull; key doors carry a glowing band in the key's colour
  const cdoor = (sd, band) => { srand(sd); const p = new Pix(64, 64); p.fill(hex(0x241a14), 0.2); for (let x = 0; x < 64; x++) { const k = 0.7 + rnd() * 0.6; for (let y = 0; y < 64; y++) p.mul(x, y, (x % 11 === 0 ? 0.45 : 1) * (0.92 + (k - 1) * 0.3)); }
    for (const y of [4, 28, 54]) { p.rect(0, y, 64, 7, hex(0x30241c), 0.25); p.bevel(0, y, 64, 7, 1.5, 0.5); for (let x = 3; x < 64; x += 8) p.rivet(x, y + 3); }
    p.bevel(0, 0, 64, 64, 1.3, 0.4); skull(p, 27, 14, hex(0xa89c80), 0.95, band ? band : [1, 0.25, 0.05]);
    if (band) { p.rect(0, 40, 64, 9, [band[0] * 0.25, band[1] * 0.25, band[2] * 0.25]); for (let i = 0; i < 8; i++) rune(p, i + sd, 3 + i * 8, 40, band, 0.95); }
    p.drips(8, 0.7); return p; };
  T.cryptdoor = tx(cdoor(530)); T.cryptdoor_red = tx(cdoor(531, [1, 0.12, 0.08])); T.cryptdoor_blue = tx(cdoor(532, [0.25, 0.5, 1])); T.cryptdoor_gold = tx(cdoor(533, [1, 0.8, 0.15]));
  // ---- floors ----
  const flags = (base, s, blood) => { srand(s); const p = new Pix(64, 64); p.fill([0.05, 0.04, 0.035], 0.3); const pts = []; for (let i = 0; i < 15; i++) pts.push([rnd() * 64, rnd() * 64, 0.75 + rnd() * 0.5]);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { let b = 1e9, b2 = 1e9, bi = 0; pts.forEach((q, i) => { let dx = Math.abs(x - q[0]), dy = Math.abs(y - q[1]); dx = Math.min(dx, 64 - dx); dy = Math.min(dy, 64 - dy); const d = dx * dx + dy * dy; if (d < b) { b2 = b; b = d; bi = i; } else if (d < b2) b2 = d; });
      if (Math.sqrt(b2) - Math.sqrt(b) > 1.4) { const k = pts[bi][2] * (0.9 + rnd() * 0.2); p.set(x, y, [base[0] * k, base[1] * k, base[2] * k]); } }
    p.cloudy(2, 0.5); p.speckle(260, 0.55, 1.25); for (let i = 0; i < 4; i++) crack(p, rnd() * 64, rnd() * 64, 20 + rnd() * 20, 0.8);
    if (blood) for (let i = 0; i < 5; i++) { const cx = rnd() * 64, cy = rnd() * 64, r = 3 + rnd() * 6; for (let k = 0; k < 60; k++) { const a = rnd() * 6.3, d = Math.sqrt(rnd()) * r; p.set(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, [0.3 + rnd() * 0.1, 0.02, 0.02]); } }
    return p; };
  T.flagstone = tx(flags(hex(0x5a5248), 518)); T.flagdark = tx(flags(hex(0x38343a), 519)); T.flagblood = tx(flags(hex(0x4a3c36), 520, true));
  T.ashground = tx((() => { srand(521); const p = new Pix(64, 64); p.fill(hex(0x2c2826), 0.3); p.cloudy(1, 0.7); p.cloudy(3, 0.4); p.speckle(500, 0.5, 1.5); for (let i = 0; i < 30; i++) { const x = rnd() * 64, y = rnd() * 64; p.set(x, y, [0.5, 0.47, 0.42]); p.set(x + 1, y, [0.4, 0.38, 0.34]); } for (let i = 0; i < 3; i++) crack(p, rnd() * 64, rnd() * 64, 20, 0.8); return p; })());
  T.bloodsoil = tx((() => { srand(522); const p = new Pix(64, 64); p.fill(hex(0x3a1c14), 0.3); p.cloudy(1, 0.8); p.cloudy(3, 0.4); p.speckle(500, 0.5, 1.5); for (let i = 0; i < 4; i++) crack(p, rnd() * 64, rnd() * 64, 24, 0.8); return p; })());
  T.deadgrass = tx((() => { srand(523); const p = new Pix(64, 64); p.fill(hex(0x2e2a18), 0.3); p.cloudy(1, 0.6); p.cloudy(2, 0.4); for (let i = 0; i < 500; i++) p.mul(rnd() * 64, rnd() * 64, 0.55 + rnd() * 1.0); for (let i = 0; i < 60; i++) { const x = rnd() * 64, y = rnd() * 64; line(p, x, y, x + (rnd() - 0.5) * 3, y - 3, [0.34, 0.3, 0.14]); } return p; })());
  // ---- iron ----
  T.ironrust = tx((() => { srand(524); const p = new Pix(64, 64); p.fill(hex(0x3a2a20), 0.2); p.cloudy(1, 0.7); p.cloudy(3, 0.4); for (const [x0, y0, w, h] of [[0, 0, 32, 32], [32, 0, 32, 32], [0, 32, 64, 32]]) { p.bevel(x0, y0, w, h, 1.4, 0.5); for (let x = x0 + 3; x < x0 + w - 2; x += 7) { p.rivet(x, y0 + 3); p.rivet(x, y0 + h - 4); } }
    for (let i = 0; i < 160; i++) { const x = rnd() * 64, y = rnd() * 64; p.set(x, y, [0.45 + rnd() * 0.2, 0.2 + rnd() * 0.08, 0.06]); } p.drips(20, 0.6); return p; })());
  T.spikefence = txKey((() => { srand(525); const p = new Pix(32, 64); p.fill(KEY, 0); const c = [0.16, 0.13, 0.12];
    for (const x of [3, 11, 19, 27]) { for (let y = 10; y < 64; y++) { p.set(x, y, [c[0] * 1.4, c[1] * 1.4, c[2] * 1.4]); p.set(x + 1, y, c); } for (let k = 0; k < 9; k++) { const w = k < 3 ? 0 : k < 6 ? 1 : 2; for (let a = -w; a <= w + 1; a++) p.set(x + a, 1 + k, k < 2 ? [0.5, 0.06, 0.04] : c); } }
    for (const y of [16, 50]) for (let x = 0; x < 32; x++) { p.set(x, y, [0.24, 0.2, 0.18]); p.set(x, y + 1, c); p.set(x, y + 2, [0.08, 0.06, 0.06]); } return p; })());
  T.chain = txKey((() => { const p = new Pix(8, 16); p.fill(KEY, 0); const c = [0.22, 0.2, 0.19]; for (let y = 0; y < 16; y++) { const even = y < 8; if (even) { if (y === 0 || y === 7) { p.set(3, y, c); p.set(4, y, c); } else { p.set(2, y, [c[0] * 1.5, c[1] * 1.5, c[2] * 1.5]); p.set(5, y, c); } } else { p.set(3, y, [c[0] * 1.3, c[1] * 1.3, c[2] * 1.3]); p.set(4, y, [c[0] * 0.7, c[1] * 0.7, c[2] * 0.7]); } } return p; })());
  // ---- decals (magenta = see-through) ----
  T.pentagram = txKey((() => { const p = new Pix(64, 64); p.fill(KEY, 0); const c = [1, 0.14, 0.05];
    for (let a = 0; a < 6.3; a += 0.008) { p.set(32 + Math.cos(a) * 29, 32 + Math.sin(a) * 29, c, 0.9); p.set(32 + Math.cos(a) * 28, 32 + Math.sin(a) * 28, c, 0.9); p.set(32 + Math.cos(a) * 24, 32 + Math.sin(a) * 24, [0.6, 0.06, 0.03], 0.7); }
    const pt = i => [32 + Math.sin(i * 2.5133) * 27, 32 + Math.cos(i * 2.5133) * 27]; for (let i = 0; i < 5; i++) { const a = pt(i), b = pt(i + 1); line(p, a[0], a[1], b[0], b[1], c, 0.9, 2); } return p; })());
  T.bloodpool = txKey((() => { srand(526); const p = new Pix(64, 64); p.fill(KEY, 0); for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const a = Math.atan2(y - 32, x - 32), d = Math.hypot(x - 32, y - 32); const r = 20 + Math.sin(a * 3 + 1) * 5 + Math.sin(a * 7) * 3 + Math.sin(a * 13 + 2) * 1.5; if (d < r) { const k = 0.7 + 0.3 * (d / r) + (rnd() - 0.5) * 0.1; p.set(x, y, [0.34 * k, 0.015, 0.015]); } }
    for (let i = 0; i < 14; i++) disc(p, 8 + rnd() * 48, 8 + rnd() * 48, rnd() * 2 | 0, [0.3, 0.015, 0.015]); return p; })());
  T.rubble = tx((() => { srand(527); const p = new Pix(64, 64); p.fill(hex(0x4a443c), 0.3); p.cloudy(2, 0.7); p.cloudy(4, 0.5); p.speckle(500, 0.4, 1.5); for (let i = 0; i < 14; i++) crack(p, rnd() * 64, rnd() * 64, 12, 0.9); return p; })());
  T.deadbark = tx((() => { srand(528); const p = new Pix(32, 64); p.fill(hex(0x1c1612), 0.3); for (let x = 0; x < 32; x++) { const k = 0.6 + rnd() * 0.8; for (let y = 0; y < 64; y++) p.mul(x + Math.sin(y * 0.2 + x) * 1.2, y, k); } p.speckle(120, 0.5, 1.4); return p; })());
  T.ember = tx((() => { srand(529); const p = new Pix(32, 32); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const n = rnd(); p.set(x, y, n > 0.7 ? [1, 0.45 + rnd() * 0.3, 0.08] : [0.12, 0.05, 0.04], n > 0.7 ? 1 : 0); } p.cloudy(2, 0.6); return p; })());
  return T;
}
