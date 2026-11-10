// Textures for the Pidser Cave bunker (Episode 3 since v0.29): hammered, riveted dark metal plates, rust-stained ceiling panels,
// glossy stamped floor plates, riveted trim, and the pizza the whole base is shaped like (crust, cheese, pepperoni roof).
import { Pix, hex, srand, rnd } from './textures.js';

// hammered metal plates: `n` plates across and down, rivets round every plate, a mottled, beaten surface
function plates(base, s, o = {}) {
  srand(s); const p = new Pix(64, 64), n = o.n || 2, sz = 64 / n; p.fill(base, 0.06);
  // the hammered look: lots of soft dents, each a little lighter on one side and darker on the other
  for (let i = 0; i < (o.dents ?? 150); i++) { const x = rnd() * 64, y = rnd() * 64, r = 1 + rnd() * 2.2, k = 0.82 + rnd() * 0.42; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) p.mul(x + dx, y + dy, dx + dy < 0 ? k : 2 - k); }
  p.cloudy(1, o.cloud ?? 0.5); p.cloudy(3, 0.25);
  if (o.rust) for (let i = 0; i < o.rust; i++) { const cx = rnd() * 64, cy = rnd() * 64, r = 4 + rnd() * 9; for (let k = 0; k < r * r * 2.2; k++) { const a = rnd() * 6.3, d = Math.sqrt(rnd()) * r; const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.8; p.mul(x, y, 0.8); p.add(x, y, [0.085 + rnd() * 0.05, 0.03 + rnd() * 0.015, 0.006]); } }
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x0 = i * sz, y0 = j * sz; p.bevel(x0, y0, sz, sz, 1.45, 0.42); const step = sz >= 32 ? 9 : 7;
    for (let x = x0 + 4; x < x0 + sz - 2; x += step) { p.rivet(x, y0 + 3); p.rivet(x, y0 + sz - 4); } for (let y = y0 + 4 + step; y < y0 + sz - 5; y += step) { p.rivet(x0 + 3, y); p.rivet(x0 + sz - 4, y); } }
  if (o.drips) p.drips(o.drips, 0.72);
  return p;
}

export function addBunkerTextures(T) {
  const tx = p => p.toTexture();
  T.bunkerplate = tx(plates(hex(0x3d362e), 601, { drips: 8 }));                    // the walls: warm gunmetal
  T.bunkerdark = tx(plates(hex(0x282624), 602, { drips: 6 }));
  T.bunkerbig = tx(plates(hex(0x34302b), 603, { n: 1, dents: 220, drips: 6 }));     // one big plate per tile
  T.bunkerrust = tx(plates(hex(0x3a2a20), 604, { rust: 9, drips: 12 }));            // rust-bloomed plates
  T.bunkerceil = tx(plates(hex(0x2a2520), 605, { rust: 3, cloud: 0.6 }));
  // floors: stamped plates, dark and glossy (the shine flag makes the level's floors mirror the lamps)
  const floor = (base, s) => { srand(s); const p = new Pix(64, 64); p.fill(base, 0.05); for (let i = 0; i < 260; i++) { const x = rnd() * 64, y = rnd() * 64, k = 0.8 + rnd() * 0.45; p.mul(x, y, k); p.mul(x + 1, y, k); p.mul(x, y + 1, 2 - k); }
    p.cloudy(1, 0.55); p.cloudy(2, 0.3); for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) p.bevel(i * 32, j * 32, 32, 32, 1.3, 0.5); const t = p.toTexture(); t.userData.shine = 0.62; return t; };
  T.bunkerfloor = floor(hex(0x2a2826), 606); T.bunkerfloor2 = floor(hex(0x35291f), 607);
  T.bunkertrim = tx((() => { srand(608); const p = new Pix(64, 16); p.fill(hex(0x2c2824), 0.08); p.cloudy(2, 0.4); p.bevel(0, 0, 64, 16, 1.5, 0.45); for (let x = 4; x < 64; x += 8) { p.rivet(x, 3); p.rivet(x, 12); } return p; })());
  // ---- the pizza ----
  T.crust = tx((() => { srand(609); const p = new Pix(64, 64); p.fill(hex(0xb8742e), 0.08); p.cloudy(1, 0.6); p.cloudy(3, 0.35);
    for (let i = 0; i < 90; i++) { const x = rnd() * 64, y = rnd() * 64, r = 1 + rnd() * 3, dark = rnd() < 0.6; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) p.mul(x + dx, y + dy, dark ? 0.72 : 1.22); }
    p.speckle(160, 0.7, 1.25); return p; })());
  T.cheese = tx((() => { srand(610); const p = new Pix(64, 64); p.fill(hex(0xe8a82c), 0.06); p.cloudy(1, 0.45); p.cloudy(3, 0.3);
    for (let i = 0; i < 46; i++) { const x = rnd() * 64, y = rnd() * 64, r = 1.5 + rnd() * 3.5; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) { p.mul(x + dx, y + dy, 0.86); p.add(x + dx, y + dy, [0.1, 0.01, 0]); } } p.speckle(120, 0.8, 1.2); return p; })());
  T.pepperoni = tx((() => { srand(611); const p = new Pix(32, 32); p.fill(hex(0xa42418), 0.08); p.cloudy(2, 0.5); for (let i = 0; i < 40; i++) { const x = rnd() * 32, y = rnd() * 32; p.mul(x, y, rnd() < 0.5 ? 0.6 : 1.5); } return p; })());
  // the roof of the base: cheese and pepperoni as far as you can see
  T.pizzaroof = tx((() => { srand(612); const N = 256, p = new Pix(N, N); p.fill(hex(0xe2a22a), 0.05); p.cloudy(2, 0.4); p.cloudy(5, 0.3);
    for (let i = 0; i < 220; i++) { const x = rnd() * N, y = rnd() * N, r = 3 + rnd() * 9; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) { p.mul(x + dx, y + dy, 0.9); p.add(x + dx, y + dy, [0.07, 0.0, 0]); } }
    const done = []; let tries = 0; while (done.length < 9 && tries++ < 400) { const x = rnd() * N, y = rnd() * N, r = 30 + rnd() * 9; if (done.some(q => { let dx = Math.abs(q[0] - x), dy = Math.abs(q[1] - y); dx = Math.min(dx, N - dx); dy = Math.min(dy, N - dy); return Math.hypot(dx, dy) < q[2] + r + 10; })) continue; done.push([x, y, r]);
      for (let dy = -r - 2; dy <= r + 2; dy++) for (let dx = -r - 2; dx <= r + 2; dx++) { const d = Math.hypot(dx, dy) + Math.sin(Math.atan2(dy, dx) * 5 + x) * 1.2; if (d > r + 2) continue; const px = x + dx, py = y + dy;
        if (d > r) { p.mul(px, py, 0.7); continue; } const k = (d > r - 3 ? 0.72 : 1) * (0.88 + rnd() * 0.24); p.set(px, py, [0.66 * k, 0.13 * k, 0.08 * k]); }
      for (let k = 0; k < 26; k++) { const a = rnd() * 6.3, d = Math.sqrt(rnd()) * (r - 4); p.mul(x + Math.cos(a) * d, y + Math.sin(a) * d, rnd() < 0.5 ? 0.6 : 1.45); } }
    p.speckle(900, 0.85, 1.15); return p; })());
  // see-through textures: no mipmaps at all (a blurred magenta key turns pink at a distance)
  // (the old bars and railing textures have speckle noise in their magenta key, which showed up as purple dots: snap it back)
  for (const k of ['bars', 'railing']) { const t = T[k], d = t && t.image && t.image.data; if (!d) continue; for (let i = 0; i < d.length; i += 4) if (d[i + 1] < 12 && d[i] > 90 && Math.abs(d[i] - d[i + 2]) < 8) { d[i] = 255; d[i + 1] = 0; d[i + 2] = 255; } t.needsUpdate = true; }
  for (const k in T) { const t = T[k], d = t && t.image && t.image.data; if (d && t.userData && !t.userData.noFilter) for (let i = 0; i < d.length; i += 4) if (d[i] === 255 && d[i + 1] === 0 && d[i + 2] === 255) { t.userData.noFilter = true; break; } }
  for (const k in T) { const t = T[k]; if (t && t.userData && t.userData.noFilter) { t.generateMipmaps = false; t.minFilter = t.magFilter = 1003 /* THREE.NearestFilter */; t.needsUpdate = true; } }
  return T;
}
