// PBR surfaces (v0.33). Every world texture gets a generated material set:
//   * a normal map (4x the albedo's resolution, from a smoothed height field read off the texture's luminance),
//   * a roughness map and a cavity (ambient occlusion) map, packed into the same texture: RG = normal.xy, B = roughness, A = cavity,
//   * material parameters picked from what the surface is (metal plate, glazed tile, brick, asphalt, wood ...).
// The world shader (game.js) lights them with the nearest lamps: bump-mapped diffuse, GGX-style highlights, a sky/room
// reflection for metals and glossy floors, and a shared detail map that breaks up tiling and keeps close-ups from going soft.
import * as THREE from 'three';

// what a surface is made of -> [roughness, metalness, bump strength, detail strength]. First match wins.
const KINDS = [
  [/^(sign_|bb_|tag_|sky$|light|glow|neon|redlight|greenlight|runelight|lavalamp|computer|crt|ember|skylite|button)/, [0.55, 0, 0, 0]],
  [/chrome|hubcap|chromebar/, [0.14, 1, 0.5, 0.25]],
  [/gold/, [0.25, 1, 0.8, 0.3]],
  [/^car|taxi|busside/, [0.22, 0.55, 0.35, 0.15]],
  [/glass|shopwin|carglass|stained/, [0.08, 0.1, 0.25, 0.05]],
  [/rust|burnt|ironrust|bunkerrust|scaffold/, [0.78, 0.45, 1.25, 0.9]],
  [/bunkerfloor|techfloor|diamond|jailfloor/, [0.3, 0.75, 1.0, 0.5]],
  [/bunker|steel|metal|grate|jail|support|lift|pipes|tech|shutter|hydrant|chain|spikefence|bars|railing|manhole|door/, [0.42, 0.8, 1.1, 0.6]],
  [/subwaytile|^tile|checker|obsidian|granite|wetblack|limestone/, [0.2, 0.04, 0.9, 0.3]],
  [/flagblood|bloodwall|bloodpool|bloodsoil|sauce|pepperoni|cheese|pizza|crust/, [0.42, 0, 1.0, 0.6]],
  [/wood|boards|crate|bark|drawer|cabinet|books|cryptdoor/, [0.62, 0, 1.1, 0.7]],
  [/carpet|curtain|blanket|leather|awning|grass|leaves|trashbag|bedspread/, [0.95, 0, 0.5, 0.8]],
  [/asphalt|road|sidewalk|curb|dirt|ashground|snowground|deadgrass|rubble/, [0.82, 0, 1.2, 1.0]],
  [/.*/, [0.86, 0, 1.35, 0.9]],                                     // brick, stone, concrete, plaster: rough and deeply cut
];
export function pbrKind(name) { for (const [re, v] of KINDS) if (re.test(name)) return v; return KINDS[KINDS.length - 1][1]; }

const cache = new WeakMap();
let flat = null, detail = null;
function flatTex() { if (!flat) { flat = new THREE.DataTexture(new Uint8Array([128, 128, 200, 255]), 1, 1, THREE.RGBAFormat); flat.needsUpdate = true; } return flat; }

function pixels(tex) {
  const im = tex && tex.image; if (!im) return null;
  if (im.data && im.width) return { d: im.data, w: im.width, h: im.height };
  try { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0); return { d: g.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height }; } catch (e) { return null; }
}

// ---- micro surfaces: tileable 256x256 height fields (0..1, mean about 0.5), one per family of material ----
const MS = 256, micro = {};
const hsh = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const vnz = (x, y, px, py, s) => { const fx = x / MS * px, fy = y / MS * py, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty), g = (a, b) => hsh(((a % px) + px) % px, ((b % py) + py) % py, s);
  return (g(ix, iy) * (1 - sx) + g(ix + 1, iy) * sx) * (1 - sy) + (g(ix, iy + 1) * (1 - sx) + g(ix + 1, iy + 1) * sx) * sy; };
function microField(fam) {
  if (micro[fam]) return micro[fam];
  const f = new Float32Array(MS * MS);
  for (let y = 0; y < MS; y++) for (let x = 0; x < MS; x++) { let v = 0.5;
    if (fam === 'grit') { v = vnz(x, y, 32, 32, 11) * 0.34 + vnz(x, y, 64, 64, 12) * 0.3 + vnz(x, y, 128, 128, 13) * 0.2 + hsh(x, y, 14) * 0.16; const pit = vnz(x, y, 48, 48, 15); if (pit < 0.2) v -= (0.2 - pit) * 2.2; }
    else if (fam === 'coarse') { v = vnz(x, y, 64, 64, 21) * 0.3 + vnz(x, y, 128, 128, 22) * 0.3 + hsh(x, y, 23) * 0.4; const st = hsh(x >> 1, y >> 1, 24); if (st > 0.93) v += 0.35; else if (st < 0.06) v -= 0.3; }
    else if (fam === 'streak') { v = vnz(x, y, 6, 128, 31) * 0.4 + vnz(x, y, 12, 256, 32) * 0.3 + vnz(x, y, 16, 16, 33) * 0.3; const sc = vnz(x, y, 4, 200, 34); if (sc > 0.86) v += 0.25; const dn = vnz(x, y, 24, 24, 35); if (dn < 0.14) v -= (0.14 - dn) * 2.5; }
    else if (fam === 'grain') { const wob = vnz(x, y, 4, 6, 41) * 26; v = 0.5 + 0.3 * Math.sin((x + wob) * 0.38 + vnz(x, y, 3, 20, 42) * 9) + (vnz(x, y, 128, 8, 43) - 0.5) * 0.3 + (hsh(x, y, 44) - 0.5) * 0.1; }
    else if (fam === 'weave') { v = 0.5 + 0.22 * Math.sin(x * Math.PI / 2) * Math.sin(y * Math.PI / 2) + (vnz(x, y, 64, 64, 51) - 0.5) * 0.4 + (hsh(x, y, 52) - 0.5) * 0.2; }
    else v = 0.5 + (vnz(x, y, 32, 32, 61) - 0.5) * 0.3;
    f[y * MS + x] = Math.max(0, Math.min(1, v)); }
  return micro[fam] = f;
}
// family and how strongly it shows in the colour and in the relief
const FAM = [
  [/^(sign_|bb_|tag_|light|glow|neon|redlight|greenlight|runelight|lavalamp|computer|crt|skylite|button|emblem|badge|poster|bulletin|clock|demonface|pentagram)/, ['smooth', 0.03, 0.0]],
  [/glass|shopwin|carglass|stained|chrome|hubcap|^car|taxi|busside|gold|subwaytile|^tile|checker|obsidian/, ['smooth', 0.05, 0.15]],
  [/wood|boards|crate|bark|drawer|cabinet|books|cryptdoor|door/, ['grain', 0.2, 0.55]],
  [/carpet|curtain|blanket|leather|awning|bedspread|rug/, ['weave', 0.16, 0.5]],
  [/asphalt|road|dirt|ashground|snowground|deadgrass|rubble|grass|roof|bloodsoil/, ['coarse', 0.26, 0.85]],
  [/rust|burnt|iron|bunker|steel|metal|grate|jail|support|lift|pipes|tech|shutter|hydrant|scaffold|diamond|manhole/, ['streak', 0.14, 0.4]],
  [/.*/, ['grit', 0.2, 0.7]],
];
function famOf(name) { for (const [re, v] of FAM) if (re.test(name)) return v; return FAM[FAM.length - 1][1]; }

const hsh2 = str => { let v = 7; for (let i = 0; i < str.length; i++) v = (v * 31 + str.charCodeAt(i)) | 0; return v & 0xffff; };
const mAtF = (mf, X, Y, W) => mf[((Y * (MS / Math.min(MS, W)) | 0) % MS) * MS + ((X * (MS / Math.min(MS, W)) | 0) % MS)];
// courses (rows of blocks) and the joints inside each: lines that are clearly darker than the rest. Returns null when the
// texture is not built that way (rock, plaster, pictures, signs).
function findBlocks(den, w, h) {
  if (w < 16 || h < 16 || w > 128 || h > 128) return null;
  const L = new Float32Array(w * h); for (let i = 0; i < w * h; i++) L[i] = den[0][i] * 0.299 + den[1][i] * 0.587 + den[2][i] * 0.114;
  const med = a => { const b = Array.from(a).sort((p, q) => p - q); return b[b.length >> 1]; };
  const lines = (prof, t) => { const m = med(prof), n = prof.length, out = []; if (m < 0.02) return out; for (let i = 0; i < n; i++) { const v = prof[i]; if (v < m * (1 - t) && v <= prof[(i + n - 1) % n] && v <= prof[(i + 1) % n]) { if (out.length && i - out[out.length - 1] < 3) continue; out.push(i); } } if (out.length > 1 && out[0] + n - out[out.length - 1] < 3) out.pop(); return out; };
  const rowP = new Float32Array(h); for (let y = 0; y < h; y++) { let s = 0; for (let x = 0; x < w; x++) s += L[y * w + x]; rowP[y] = s / w; }
  const rows = lines(rowP, 0.13); if (rows.length < 1 || rows.length > h / 4) return null;
  const list = [], mort = [0, 0, 0]; let mn = 0, joints = 0;
  for (const y of rows) for (let x = 0; x < w; x++) { const i = y * w + x; mort[0] += den[0][i]; mort[1] += den[1][i]; mort[2] += den[2][i]; mn++; }
  for (let ri = 0; ri < rows.length; ri++) { const y0 = rows[ri] + 1, y1 = ri + 1 < rows.length ? rows[ri + 1] : rows[0] + h; if (y1 - y0 < 3) return null;
    const colP = new Float32Array(w); for (let x = 0; x < w; x++) { let s = 0; for (let y = y0; y < y1; y++) s += L[(y % h) * w + x]; colP[x] = s / (y1 - y0); }
    const cols = lines(colP, 0.13); if (cols.length > w / 4) return null; joints += cols.length;
    const cs = cols.length ? cols : [-1];
    for (let ci = 0; ci < cs.length; ci++) { const x0 = cs[ci] + 1, x1 = cols.length ? (ci + 1 < cs.length ? cs[ci + 1] : cs[0] + w) : w; if (x1 - x0 < 3) return null;
      const col = [0, 0, 0]; let n = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y % h) * w + (x % w); col[0] += den[0][i]; col[1] += den[1][i]; col[2] += den[2][i]; n++; }
      list.push({ x0, x1, y0, y1, col: col.map(v => v / n) }); } }
  if (list.length < 2 || joints < 1) return null;
  return { list, mortar: mort.map(v => v / mn * 0.8) };
}

// ---- the HD material set for an albedo texture: { map, nm }. The 64-pixel original is cleaned of its per-pixel noise, enlarged
// four times with its edges kept crisp, and given a real micro surface (grit, brushed streaks, wood grain ...) in colour and relief.
export function hdSet(tex, name, o = {}) {
  if (!tex) return { map: tex, nm: flatTex() };
  if (cache.has(tex)) return cache.get(tex);
  const kind = pbrKind(name), fam = famOf(name), px = pixels(tex);
  const keep = v => { cache.set(tex, v); return v; };
  if (!px || tex.userData.noFilter || tex.userData.noHD || px.w * px.h > 300 * 300) return keep({ map: tex, nm: flatTex() });
  const { d, w, h } = px, big = Math.max(w, h), k = Math.min(o.scale || 4, big <= 64 ? 4 : big <= 128 ? 2 : 1), W = w * k, H = h * k, n = w * h;
  // key colours (magenta holes) can't be filtered: leave those textures alone
  for (let i = 0; i < n; i++) if (d[i * 4] > 240 && d[i * 4 + 1] < 20 && d[i * 4 + 2] > 240) return keep({ map: tex, nm: flatTex() });
  const src = [new Float32Array(n), new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  for (let i = 0; i < n; i++) { src[0][i] = d[i * 4] / 255; src[1][i] = d[i * 4 + 1] / 255; src[2][i] = d[i * 4 + 2] / 255; src[3][i] = d[i * 4 + 3] / 255; }
  const wi = (x, y) => ((y % h + h) % h) * w + ((x % w + w) % w);
  // 1. edge-keeping denoise (bilateral 3x3): the speckle goes, mortar lines and lettering stay
  const den = [new Float32Array(n), new Float32Array(n), new Float32Array(n)], sig = fam[0] === 'smooth' ? 0.04 : 0.11, inv = 1 / (2 * sig * sig);
  if (k > 1) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x, r0 = src[0][i], g0 = src[1][i], b0 = src[2][i]; let sr = 0, sg = 0, sb = 0, sw = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const j = wi(x + dx, y + dy), dr = src[0][j] - r0, dg = src[1][j] - g0, db = src[2][j] - b0, wgt = Math.exp(-(dr * dr + dg * dg + db * db) * inv) * (dx || dy ? 0.7 : 1); sr += src[0][j] * wgt; sg += src[1][j] * wgt; sb += src[2][j] * wgt; sw += wgt; }
    den[0][i] = sr / sw; den[1][i] = sg / sw; den[2][i] = sb / sw; }
  else for (let c = 0; c < 3; c++) den[c].set(src[c]);
  // 2. enlargement. Pixel art first goes through Scale2x (twice for 4x) with a colour tolerance, which turns stair-stepped
  //    diagonals into clean slopes; a light blur then takes the last jaggies off before the sharpening pass.
  let cur = den, cw = w, ch = h;
  const near = (a, i, j) => { const dr = a[0][i] - a[0][j], dg = a[1][i] - a[1][j], db = a[2][i] - a[2][j]; return dr * dr + dg * dg + db * db < 0.0052; };
  for (let pass = k; pass > 1; pass >>= 1) { const nw = cw * 2, nh = ch * 2, nx = [new Float32Array(nw * nh), new Float32Array(nw * nh), new Float32Array(nw * nh)], ci = (x, y) => ((y % ch + ch) % ch) * cw + ((x % cw + cw) % cw);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const E = y * cw + x, B = ci(x, y - 1), D = ci(x - 1, y), F = ci(x + 1, y), Hh = ci(x, y + 1);
      const bd = near(cur, B, D), bf = near(cur, B, F), dh = near(cur, D, Hh), hf = near(cur, Hh, F);
      const e0 = bd && !bf && !dh ? D : E, e1 = bf && !bd && !hf ? F : E, e2 = dh && !bd && !hf ? D : E, e3 = hf && !dh && !bf ? F : E, o2 = (y * 2) * nw + x * 2;
      for (let c = 0; c < 3; c++) { const a = cur[c], t = nx[c]; t[o2] = a[e0]; t[o2 + 1] = a[e1]; t[o2 + nw] = a[e2]; t[o2 + nw + 1] = a[e3]; } }
    cur = nx; cw = nw; ch = nh; }
  const up = [new Float32Array(W * H), new Float32Array(W * H), new Float32Array(W * H)], glow = new Float32Array(W * H);
  { const ci = (x, y) => ((y % H + H) % H) * W + ((x % W + W) % W);
    for (let c = 0; c < 3; c++) { const a = cur[c], t = up[c]; if (k === 1) { t.set(a); continue; } for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) t[Y * W + X] = (a[Y * W + X] * 4 + (a[ci(X - 1, Y)] + a[ci(X + 1, Y)] + a[ci(X, Y - 1)] + a[ci(X, Y + 1)]) * 2 + a[ci(X - 1, Y - 1)] + a[ci(X + 1, Y - 1)] + a[ci(X - 1, Y + 1)] + a[ci(X + 1, Y + 1)]) / 16; }
    for (let Y = 0; Y < H; Y++) { const fy = (Y + 0.5) / k - 0.5, iy = Math.floor(fy), ty = fy - iy; for (let X = 0; X < W; X++) { const fx = (X + 0.5) / k - 0.5, ix = Math.floor(fx), tx = fx - ix;   // the glow mask, enlarged smoothly and re-thresholded: round lamps and lava cracks instead of square ones
      const v = (src[3][wi(ix, iy)] * (1 - tx) + src[3][wi(ix + 1, iy)] * tx) * (1 - ty) + (src[3][wi(ix, iy + 1)] * (1 - tx) + src[3][wi(ix + 1, iy + 1)] * tx) * ty; const e = Math.max(0, Math.min(1, (v - 0.3) / 0.4)); glow[Y * W + X] = k > 1 ? e * e * (3 - 2 * e) : src[3][Y * w + X]; } } }
  // 2b. masonry, tiles, planks and plates: find the courses and joints in the original and rebuild every block at full
  //     resolution (its own colour, bevelled and chipped edges, a recessed joint), instead of enlarging 1-pixel mortar lines
  const blk = k > 1 && fam[0] !== 'smooth' ? findBlocks(den, w, h) : null; let bh = null;
  if (blk) { bh = new Float32Array(W * H); const mc = blk.mortar, rr = hsh2(name);
    for (const b of blk.list) { const x0 = b.x0 * k, x1 = b.x1 * k, y0 = b.y0 * k, y1 = b.y1 * k, bw = x1 - x0, bhh = y1 - y0, edge = Math.max(2, Math.min(k * 1.5, Math.min(bw, bhh) * 0.22)), seed = (b.x0 * 31 + b.y0 * 57 + rr) | 0;
      const lift = 0.78 + hsh(b.x0, b.y0, rr) * 0.22, tx = (hsh(b.x0, b.y0, rr + 1) - 0.5) * 0.12, ty = (hsh(b.x0, b.y0, rr + 2) - 0.5) * 0.12;
      for (let Y = y0; Y < y1; Y++) for (let X = x0; X < x1; X++) { const xx = ((X % W) + W) % W, yy = ((Y % H) + H) % H, i = yy * W + xx; if (glow[i] < 0.8) { bh[i] = 0.6; continue; }
        const chip = (vnz(xx, yy, 40, 40, 71 + (seed & 7)) - 0.5) * edge * 1.5, de = Math.min(X - x0, x1 - 1 - X, Y - y0, y1 - 1 - Y) + chip, e = Math.max(0, Math.min(1, de / edge)), prof = e * e * (3 - 2 * e);
        const u = (X - x0) / bw - 0.5, v = (Y - y0) / bhh - 0.5; bh[i] = prof * (lift + u * tx + v * ty);
        const cm = 0.55 + 0.45 * prof; for (let c = 0; c < 3; c++) up[c][i] = (b.col[c] * 0.55 + up[c][i] * 0.45) * cm + mc[c] * (1 - cm) * 0.55; } }
    for (let i = 0; i < W * H; i++) if (bh[i] === 0 && glow[i] > 0.8) { const X = i % W, Y = (i / W) | 0, g = 0.75 + mAtF(microField('coarse'), X, Y, W) * 0.5; for (let c = 0; c < 3; c++) up[c][i] = mc[c] * g; } }
  // 3. sharpen the enlarged picture (unsharp mask), so the edges that were one soft pixel wide come out crisp
  const lum = new Float32Array(W * H), blur = new Float32Array(W * H), tmp = new Float32Array(W * H), hw = (x, y) => ((y % H + H) % H) * W + ((x % W + W) % W);
  for (let i = 0; i < W * H; i++) lum[i] = up[0][i] * 0.299 + up[1][i] * 0.587 + up[2][i] * 0.114;
  const boxBlur = (a, out, R) => { for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) { let s2 = 0; for (let i = -R; i <= R; i++) s2 += a[hw(X + i, Y)]; tmp[Y * W + X] = s2 / (2 * R + 1); }
    for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) { let s2 = 0; for (let i = -R; i <= R; i++) s2 += tmp[hw(X, Y + i)]; out[Y * W + X] = s2 / (2 * R + 1); } };
  if (k > 1) { boxBlur(lum, blur, k > 2 ? 2 : 1); const amt = blk ? 0.5 : 1.1; for (let i = 0; i < W * H; i++) { const l = lum[i], sh = Math.max(0, l + (l - blur[i]) * amt), g = l > 0.004 ? sh / l : 1; up[0][i] *= g; up[1][i] *= g; up[2][i] *= g; lum[i] = sh; } }
  // 4. micro surface in colour and height
  const mf = microField(fam[0]), sx = MS / Math.min(MS, W), hgt = new Float32Array(W * H); let mean = 0;
  let turn = false; if (blk && fam[0] === 'grain') { let ww = 0, hh2 = 0; for (const q of blk.list) { ww += q.x1 - q.x0; hh2 += q.y1 - q.y0; } turn = ww > hh2 * 1.3; }   // wood grain runs along the planks
  const mAt = turn ? (X, Y) => mf[((Math.floor(X * sx) % MS) * MS) + (Math.floor(Y * sx) % MS)] : (X, Y) => mf[((Math.floor(Y * sx) % MS) * MS) + (Math.floor(X * sx) % MS)];
  for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) { const i = Y * W + X, lit = glow[i] > 0.8, m = lit ? mAt(X, Y) : 0.5, g = 1 + (m - 0.5) * 2 * fam[1] * (k > 1 ? 1 : 0.5);
    up[0][i] *= g; up[1][i] *= g; up[2][i] *= g; hgt[i] = (lit ? lum[i] : -1); mean += lum[i]; }
  mean /= W * H; for (let i = 0; i < W * H; i++) { const X = i % W, Y = (i / W) | 0; hgt[i] = (hgt[i] < 0 ? mean : hgt[i]) + (mAt(X, Y) - 0.5) * 0.22 * fam[2] * (glow[i] > 0.8 ? 1 : 0); if (bh) hgt[i] = hgt[i] * 0.45 + (bh[i] - 0.6) * 0.5 + mean * 0.55; }
  const out = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) { out[i * 4] = Math.max(0, Math.min(255, up[0][i] * 255 + 0.5)); out[i * 4 + 1] = Math.max(0, Math.min(255, up[1][i] * 255 + 0.5)); out[i * 4 + 2] = Math.max(0, Math.min(255, up[2][i] * 255 + 0.5)); out[i * 4 + 3] = Math.round(glow[i] * 255); }
  const aniso = o.aniso || 4;
  const map = new THREE.DataTexture(out, W, H, THREE.RGBAFormat);
  map.wrapS = tex.wrapS; map.wrapT = tex.wrapT; map.magFilter = THREE.LinearFilter; map.minFilter = THREE.LinearMipmapLinearFilter; map.generateMipmaps = true; map.anisotropy = aniso; map.colorSpace = THREE.NoColorSpace; map.userData = { ...tex.userData, hd: true }; map.needsUpdate = true;
  // 5. normal + roughness + cavity from the height
  let nm = flatTex();
  if (kind[2] > 0) {
    const sm = new Float32Array(W * H), wide = new Float32Array(W * H); boxBlur(hgt, sm, 1); for (let i = 0; i < W * H; i++) sm[i] = sm[i] * 0.6 + hgt[i] * 0.4; boxBlur(sm, wide, Math.max(3, k * 2));
    const o3 = new Uint8Array(W * H * 4), str = 1.5 * k * kind[2], rough = kind[0], metal = kind[1];
    for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) { const i = Y * W + X, dx = (sm[hw(X + 1, Y)] - sm[hw(X - 1, Y)]) * str, dy = (sm[hw(X, Y + 1)] - sm[hw(X, Y - 1)]) * str, iv = 1 / Math.sqrt(dx * dx + dy * dy + 1), hv = sm[i];
      o3[i * 4] = Math.round((-dx * iv * 0.5 + 0.5) * 255); o3[i * 4 + 1] = Math.round((-dy * iv * 0.5 + 0.5) * 255);
      const rv = metal > 0.4 ? rough + (mean - hv) * 0.9 : rough + (mean - hv) * 0.35;   // metals shine where they are worn bright; everything else is rougher down in the cracks
      o3[i * 4 + 2] = Math.max(10, Math.min(255, Math.round(rv * 255))); o3[i * 4 + 3] = Math.max(60, Math.min(255, Math.round((1 - Math.max(0, wide[i] - hv) * 3.4) * 255))); }
    nm = new THREE.DataTexture(o3, W, H, THREE.RGBAFormat);
    nm.wrapS = nm.wrapT = THREE.RepeatWrapping; nm.magFilter = THREE.LinearFilter; nm.minFilter = THREE.LinearMipmapLinearFilter; nm.generateMipmaps = true; nm.anisotropy = aniso; nm.colorSpace = THREE.NoColorSpace; nm.needsUpdate = true;
  }
  return keep({ map, nm });
}
export function hdDispose(T) { for (const t of Object.values(T)) { const v = t && cache.get(t); if (v) { if (v.map !== t) v.map.dispose(); if (v.nm !== flat) v.nm.dispose(); cache.delete(t); } } }

// shared detail map: RG = fine normal, B = grain (albedo), A = slow blotches (breaks up tiling over large surfaces)
export function detailTex() {
  if (detail) return detail;
  const N = 256;
  const vn = (x, y, per, s) => { const fx = x / N * per, fy = y / N * per, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty), g = (a, b) => hsh(((a % per) + per) % per, ((b % per) + per) % per, s);
    return (g(ix, iy) * (1 - sx) + g(ix + 1, iy) * sx) * (1 - sy) + (g(ix, iy + 1) * (1 - sx) + g(ix + 1, iy + 1) * sx) * sy; };
  const hgt = new Float32Array(N * N), grain = new Float32Array(N * N), blot = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x;
    hgt[i] = vn(x, y, 16, 1) * 0.5 + vn(x, y, 32, 2) * 0.3 + vn(x, y, 64, 3) * 0.2 + (vn(x, y, 128, 4) - 0.5) * 0.12;
    grain[i] = vn(x, y, 64, 5) * 0.45 + vn(x, y, 128, 6) * 0.35 + hsh(x, y, 7) * 0.2;
    blot[i] = vn(x, y, 4, 8) * 0.6 + vn(x, y, 8, 9) * 0.4; }
  const out = new Uint8Array(N * N * 4), H = (x, y) => hgt[((y + N) % N) * N + ((x + N) % N)];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = (y * N + x) * 4, dx = (H(x + 1, y) - H(x - 1, y)) * 9, dy = (H(x, y + 1) - H(x, y - 1)) * 9, inv = 1 / Math.sqrt(dx * dx + dy * dy + 1);
    out[i] = Math.round((-dx * inv * 0.5 + 0.5) * 255); out[i + 1] = Math.round((-dy * inv * 0.5 + 0.5) * 255); out[i + 2] = Math.round(grain[y * N + x] * 255); out[i + 3] = Math.round(blot[y * N + x] * 255); }
  detail = new THREE.DataTexture(out, N, N, THREE.RGBAFormat);
  detail.wrapS = detail.wrapT = THREE.RepeatWrapping; detail.magFilter = THREE.LinearFilter; detail.minFilter = THREE.LinearMipmapLinearFilter; detail.generateMipmaps = true; detail.anisotropy = 4; detail.needsUpdate = true;
  return detail;
}

// ---- which lamps light the highlights: the nearest few to the camera, faded in and out by distance so none of them pop ----
export const NL = 6;
export function pbrUniforms() {
  return { plPos: { value: Array.from({ length: NL }, () => new THREE.Vector4(0, -99999, 0, 1)) }, plCol: { value: Array.from({ length: NL }, () => new THREE.Vector3()) }, pbrOn: { value: 1 }, detailMap: { value: detailTex() },
    envUp: { value: new THREE.Vector3(0.2, 0.2, 0.25) }, envDn: { value: new THREE.Vector3(0.05, 0.05, 0.05) }, dynPos: { value: new THREE.Vector4(0, -99999, 0, 1) }, dynCol: { value: new THREE.Vector3() } };
}
const scored = [];
export function pickLights(U, lights, cam, fwd, styles) {
  const px = cam.x + fwd.x * 120, py = cam.y, pz = cam.z + fwd.z * 120; scored.length = 0;
  for (const l of lights) { if (l.light < 60) continue; const dx = l.pos[0] - px, dy = l.pos[1] - py, dz = l.pos[2] - pz; const d = Math.sqrt(dx * dx + dy * dy + dz * dz) - l.light * 0.6; if (d < 900) scored.push([d, l]); }
  scored.sort((a, b) => a[0] - b[0]);
  const edge = scored.length > NL ? scored[NL][0] : 900;
  for (let i = 0; i < NL; i++) {
    const P = U.plPos.value[i], C = U.plCol.value[i];
    if (i >= scored.length) { P.set(0, -99999, 0, 1); C.set(0, 0, 0); continue; }
    const [d, l] = scored[i], fade = Math.max(0, Math.min(1, (edge - d) / 140)), k = fade * Math.min(2.2, l.light / 190);
    P.set(l.pos[0], l.pos[1], l.pos[2], l.light * 1.15);
    if (l.style && styles[l.style - 1]) { const s = styles[l.style - 1]; C.set(s.x * k, s.y * k, s.z * k); } else C.set(l.color[0] * k, l.color[1] * k, l.color[2] * k);
  }
}

// GLSL for the world shader
export const PBR_PARS = `
uniform sampler2D nm; uniform sampler2D detailMap; uniform vec4 pbr; uniform float pbrOn; uniform float pbrMat;
uniform vec4 plPos[${NL}]; uniform vec3 plCol[${NL}]; uniform vec3 camPos; uniform vec3 envUp; uniform vec3 envDn; uniform vec4 dynPos; uniform vec3 dynCol;
`;
// in: uv, t (albedo, modified), light (lightmap irradiance, modified), wet, vWorld. out: spec (added after fog-less lighting), gloss (for the screen-space reflection)
export const PBR_MAIN = `
  vec3 specAdd = vec3(0.0); float gloss = 0.0;
  if (pbrOn > 0.5 && pbrMat > 0.5) {
    vec3 dp1 = dFdx(vWorld), dp2 = dFdy(vWorld); vec3 Ng = normalize(cross(dp1, dp2));
    vec3 V = camPos - vWorld; float vd = length(V); V /= max(vd, 0.001); if (dot(Ng, V) < 0.0) Ng = -Ng;
    vec2 du1 = dFdx(uv), du2 = dFdy(uv);
    vec3 dp2p = cross(dp2, Ng), dp1p = cross(Ng, dp1); vec3 Tn = dp2p * du1.x + dp1p * du2.x, Bn = dp2p * du1.y + dp1p * du2.y;
    float im = inversesqrt(max(max(dot(Tn, Tn), dot(Bn, Bn)), 1e-12));
    vec4 M = texture2D(nm, uv);
    vec2 duv = abs(Ng.y) > 0.5 ? vWorld.xz : vec2(vWorld.x + vWorld.z, vWorld.y);
    vec4 D1 = texture2D(detailMap, duv * 0.021), D2 = texture2D(detailMap, duv * 0.0037 + 0.37);
    float near = clamp(1.0 - vd / 700.0, 0.0, 1.0);
    vec2 nxy = (M.xy * 2.0 - 1.0) + (D1.xy * 2.0 - 1.0) * 0.35 * pbr.w * near;
    vec3 Nb = normalize(Tn * im * nxy.x + Bn * im * nxy.y + Ng * sqrt(max(1.0 - dot(nxy, nxy) * 0.6, 0.2)));
    float metal = pbr.y; float rough = clamp(M.b + (D1.b - 0.5) * 0.25 * pbr.w, 0.06, 1.0);
    rough = mix(rough, min(rough, 0.16), wet);                                   // rain fills the pores: a wet street is a mirror
    t.rgb *= (0.86 + 0.28 * D2.a) * mix(1.0, 0.8 + 0.4 * D1.b, pbr.w * near);   // slow blotches against tiling, fine grain up close
    t.rgb *= mix(1.0, M.a, 0.75);                                               // cavities
    float lumL = dot(light, vec3(0.333));
    // bump-mapped diffuse: how much more or less the bumped normal faces the lamps than the flat wall does (the lightmap already has the flat answer)
    vec3 up2 = normalize(Ng * 0.55 + vec3(0.22, 0.74, 0.3)); float bs = 0.16 * (0.5 + 0.5 * dot(Nb, up2)), fs = 0.16 * (0.5 + 0.5 * dot(Ng, up2));
    float a2 = rough * rough; a2 *= a2; vec3 F0 = mix(vec3(0.04), t.rgb, metal);
    for (int i = 0; i < ${NL}; i++) {
      vec3 Lv = plPos[i].xyz - vWorld; float d = length(Lv); float att = max(1.0 - d / plPos[i].w, 0.0); if (att <= 0.0) continue;
      vec3 L = Lv / max(d, 0.001); float w = att * dot(plCol[i], vec3(0.333)); float nl = max(dot(Nb, L), 0.0), gl = max(dot(Ng, L), 0.0);
      bs += w * nl; fs += w * gl;
      vec3 Hh = normalize(L + V); float nh = max(dot(Nb, Hh), 0.0); float dn = nh * nh * (a2 - 1.0) + 1.0; float Dg = a2 / (3.14159 * dn * dn + 1e-5);
      specAdd += plCol[i] * (att * att) * min(Dg, 40.0) * nl * step(0.02, gl) * 0.25;
    }
    light *= mix(1.0, clamp(bs / max(fs, 0.02), 0.3, 2.0), 0.85);
    if (dynPos.w > 1.0) {                                                        // muzzle flashes and explosions light the room for real
      vec3 Lv = dynPos.xyz - vWorld; float d = length(Lv); float att = max(1.0 - d / dynPos.w, 0.0); att *= att; vec3 L = Lv / max(d, 0.001); float nl = max(dot(Nb, L), 0.0);
      light += dynCol * att * nl * 1.6; vec3 Hh = normalize(L + V); float nh = max(dot(Nb, Hh), 0.0); float dn = nh * nh * (a2 - 1.0) + 1.0;
      specAdd += dynCol * att * min(a2 / (3.14159 * dn * dn + 1e-5), 40.0) * nl * 0.3;
    }
    float nv = max(dot(Nb, V), 0.0); vec3 Fr = F0 + (max(vec3(1.0 - rough), F0) - F0) * pow(1.0 - nv, 5.0);
    vec3 Rr = reflect(-V, Nb); vec3 env = mix(envDn, envUp, smoothstep(-0.35, 0.55, Rr.y)) * (0.35 + lumL * 0.9);
    specAdd = specAdd * Fr * clamp(lumL * 1.6 + 0.05, 0.0, 1.0) * mix(1.0, 3.0, metal) + env * Fr * (1.0 - rough) * (1.0 - rough) * mix(0.5, 1.6, metal);
    t.rgb *= 1.0 - 0.45 * metal;                                                // metals have little diffuse colour of their own
    gloss = (1.0 - rough) * (1.0 - rough) * step(0.5, Ng.y) * mix(0.55, 0.8, metal);
  }
`;
