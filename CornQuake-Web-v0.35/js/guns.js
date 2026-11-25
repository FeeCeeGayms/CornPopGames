// Weapon models (v0.33). The view models used to be boxes and plain cylinders; these are built the way the real things are:
// turned (lathed) barrels and tanks, side profiles extruded with rounded edges for stocks, grips and receivers, hoses and
// guards bent from tube, and PBR materials with generated maps: brushed and blued steel, chrome, brass, varnished wood grain,
// moulded toy plastic with a clear coat, knurled rubber.
// Every maker returns the same userData the weapon classes animate (pump, tank, barrels, drum, spin ...), so nothing else changes.
import * as THREE from 'three';

export const LIT = { env: null, mats: [] };                       // everything lit by the studio environment map (game.js fills in env)
function reg(m) { LIT.mats.push(m); if (LIT.env) m.envMap = LIT.env; return m; }
const Phys = o => reg(new THREE.MeshPhysicalMaterial(o));
const Stdm = o => reg(new THREE.MeshStandardMaterial(o));

// ---------------------------------------------------------------- generated PBR maps
const N = 256, MAPS = {};
const hsh = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const vn = (x, y, px, py, s) => { const fx = x / N * px, fy = y / N * py, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty), g = (a, b) => hsh(((a % px) + px) % px, ((b % py) + py) % py, s);
  return (g(ix, iy) * (1 - sx) + g(ix + 1, iy) * sx) * (1 - sy) + (g(ix, iy + 1) * (1 - sx) + g(ix + 1, iy + 1) * sx) * sy; };
function build(hf, rf, af, strength) {
  const h = new Float32Array(N * N); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) h[y * N + x] = hf(x, y);
  const H = (x, y) => h[((y + N) % N) * N + ((x + N) % N)], nrm = new Uint8Array(N * N * 4), rgh = new Uint8Array(N * N * 4), alb = af ? new Uint8Array(N * N * 4) : null;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = (y * N + x) * 4, dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength, iv = 1 / Math.sqrt(dx * dx + dy * dy + 1);
    nrm[i] = (-dx * iv * 0.5 + 0.5) * 255; nrm[i + 1] = (-dy * iv * 0.5 + 0.5) * 255; nrm[i + 2] = (iv * 0.5 + 0.5) * 255; nrm[i + 3] = 255;
    const r = Math.max(0.04, Math.min(1, rf(x, y, h[y * N + x]))); rgh[i] = 255; rgh[i + 1] = r * 255; rgh[i + 2] = 255; rgh[i + 3] = 255;
    if (alb) { const c = af(x, y, h[y * N + x]); alb[i] = Math.min(255, c[0] * 255); alb[i + 1] = Math.min(255, c[1] * 255); alb[i + 2] = Math.min(255, c[2] * 255); alb[i + 3] = 255; } }
  const tx = d => { const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true; return t; };
  return { normalMap: tx(nrm), roughnessMap: tx(rgh), map: alb ? tx(alb) : null };
}
function maps(kind) {
  if (MAPS[kind]) return MAPS[kind];
  let m;
  if (kind === 'brushed') m = build((x, y) => vn(x, y, 128, 3, 1) * 0.6 + vn(x, y, 256, 6, 2) * 0.4, (x, y, h) => 0.62 + h * 0.38 - (vn(x, y, 90, 2, 3) > 0.9 ? 0.25 : 0), null, 1.6);       // fine machining lines along the part, the odd bright scratch
  else if (kind === 'wood') { const wob = (x, y) => vn(x, y, 2, 4, 11) * 22 + vn(x, y, 6, 2, 12) * 6, ring = (x, y) => { const t = ((y + wob(x, y)) * 0.11) % 1; return Math.pow(Math.abs(t - 0.5) * 2, 2.2); };   // walnut: fine dark pores between broad smooth bands, long figure
    m = build((x, y) => 0.5 + ring(x, y) * 0.25 + (vn(x, y, 8, 128, 13) - 0.5) * 0.5, (x, y, h) => 0.72 + h * 0.28,
      (x, y) => { const k = 0.7 + ring(x, y) * 0.2 + (vn(x, y, 6, 110, 14) - 0.5) * 0.3 + (vn(x, y, 2, 3, 16) - 0.5) * 0.18; return [k * 1.04, k * 0.93, k * 0.84]; }, 1.4); }
  else if (kind === 'pebble') m = build((x, y) => vn(x, y, 96, 96, 21) * 0.6 + hsh(x, y, 22) * 0.4, (x, y, h) => 0.8 + h * 0.2, null, 1.1);                                                 // the orange-peel skin of moulded plastic
  else if (kind === 'knurl') m = build((x, y) => { const a = ((x + y) % 16) / 16, b = (((x - y) % 16) + 16) % 16 / 16; return Math.min(Math.abs(a - 0.5), Math.abs(b - 0.5)) * 2; }, () => 0.95, null, 7);  // diamond chequering
  else if (kind === 'cast') m = build((x, y) => vn(x, y, 40, 40, 31) * 0.5 + vn(x, y, 120, 120, 32) * 0.3 + hsh(x, y, 33) * 0.2, (x, y, h) => 0.7 + h * 0.3, null, 2.4);                    // sand-cast / parkerised metal
  else m = build(() => 0.5, () => 1, null, 0);
  return MAPS[kind] = m;
}
const rep = (t, u, v) => { if (!t) return null; const c = t.clone(); c.repeat.set(u, v); c.needsUpdate = true; return c; };
function matOf(kind, color, o = {}) {
  const src = { steel: 'brushed', blued: 'brushed', chrome: null, brass: 'brushed', alu: 'brushed', wood: 'wood', plastic: 'pebble', rubber: 'knurl', cast: 'cast', paint: 'pebble' }[kind];
  const M = src ? maps(src) : {}, r = o.rep || [2, 2], base = { color, ...o }; delete base.rep;
  if (src) { base.normalMap = rep(M.normalMap, r[0], r[1]); base.roughnessMap = rep(M.roughnessMap, r[0], r[1]); if (M.map) base.map = rep(M.map, r[0], r[1]); }
  const P = { steel: { roughness: 0.42, metalness: 1, normalScale: new THREE.Vector2(0.35, 0.35) }, blued: { roughness: 0.3, metalness: 1, normalScale: new THREE.Vector2(0.25, 0.25) }, chrome: { roughness: 0.07, metalness: 1 },
    brass: { roughness: 0.32, metalness: 1, normalScale: new THREE.Vector2(0.3, 0.3) }, alu: { roughness: 0.46, metalness: 1, normalScale: new THREE.Vector2(0.4, 0.4) },
    wood: { roughness: 0.62, metalness: 0, normalScale: new THREE.Vector2(0.7, 0.7), clearcoat: 0.45, clearcoatRoughness: 0.3 }, plastic: { roughness: 0.4, metalness: 0, normalScale: new THREE.Vector2(0.22, 0.22), clearcoat: 0.7, clearcoatRoughness: 0.18 },
    rubber: { roughness: 0.95, metalness: 0, normalScale: new THREE.Vector2(0.9, 0.9) }, cast: { roughness: 0.6, metalness: 0.85, normalScale: new THREE.Vector2(0.5, 0.5) }, paint: { roughness: 0.3, metalness: 0.35, normalScale: new THREE.Vector2(0.15, 0.15), clearcoat: 0.8, clearcoatRoughness: 0.1 } }[kind];
  return Phys({ ...P, ...base });
}
// a printed label / decal
function labelTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; t.colorSpace = THREE.NoColorSpace; return t; }

// ---------------------------------------------------------------- shape kit. The gun points down -Z, +Y is up.
function K(g) {
  const add = (m, parent) => { (parent || g).add(m); return m; };
  const k = {};
  // straight round part along Z, centred on (x, y, z): rb = radius at the back, rf = at the front
  k.cyl = (rb, rf, len, mat, x, y, z, segs = 24, parent) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rf, rb, len, segs), mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); return add(m, parent); };
  // turned part: pts = [[radius, distance forward of z0], ...]
  k.lathe = (pts, mat, x, y, z0, segs = 28, parent) => { const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(Math.max(0.001, p[0]), p[1])), segs), mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z0); return add(m, parent); };
  // side silhouette pts = [[z, y], ...] extruded across X to `width`, edges rounded by `bevel`. o.smooth runs a spline through the points
  k.prof = (pts, width, mat, o = {}) => {
    let P2 = pts.map(p => new THREE.Vector2(p[0], p[1]));
    if (o.smooth) P2 = new THREE.SplineCurve([...P2, P2[0]]).getPoints(pts.length * 6).slice(0, -1);
    const b = Math.min(o.bevel ?? 0.6, width * 0.45), geo = new THREE.ExtrudeGeometry(new THREE.Shape(P2), { depth: Math.max(0.01, width - 2 * b), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: o.bs ?? 3, curveSegments: 6 });
    geo.translate(0, 0, -Math.max(0.01, width - 2 * b) / 2); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 14, uv.getY(i) / 14);
    const m = new THREE.Mesh(geo, mat); m.rotation.y = -Math.PI / 2; m.position.set(o.x || 0, o.y || 0, o.z || 0); return add(m, o.parent);
  };
  k.box = (w, h, d, mat, x, y, z, bevel = 0.4, parent) => k.prof([[-d / 2, -h / 2], [d / 2, -h / 2], [d / 2, h / 2], [-d / 2, h / 2]], w, mat, { bevel, x, y, z, parent, bs: 2 });
  k.tube = (pts, r, mat, parent, segs = 10) => add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2]))), pts.length * 8, r, segs), mat), parent);
  k.ball = (r, mat, x, y, z, s = [1, 1, 1], parent) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat); m.position.set(x, y, z); m.scale.set(s[0], s[1], s[2]); return add(m, parent); };
  // ring around the Z axis
  k.ring = (R, r, mat, x, y, z, parent, arc = Math.PI * 2) => { const m = new THREE.Mesh(new THREE.TorusGeometry(R, r, 10, 32, arc), mat); m.position.set(x, y, z); return add(m, parent); };
  // a loop in the YZ plane (trigger guards): centre (y, z), opening upward
  k.guard = (R, r, mat, y, z, parent) => { const m = new THREE.Mesh(new THREE.TorusGeometry(R, r, 8, 20, Math.PI), mat); m.rotation.set(0, Math.PI / 2, 0); m.rotation.z = Math.PI; m.position.set(0, y, z); return add(m, parent); };
  k.plate = (w, h, tex, x, y, z, ry, parent) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), reg(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.1, transparent: true, polygonOffset: true, polygonOffsetFactor: -2 }))); m.position.set(x, y, z); m.rotation.y = ry; return add(m, parent); };
  return k;
}

// ================================================================ PISS SUPER SOAKER
export function makeSoaker() {
  const g = new THREE.Group(), k = K(g);
  const green = matOf('plastic', 0x5ad020), dgreen = matOf('plastic', 0x2a7a18), orange = matOf('plastic', 0xff7a10), yellow = matOf('plastic', 0xffd020);
  const liquid = Phys({ color: 0xffe020, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.86, emissive: 0x4a3800 });
  const clear = Phys({ color: 0xfff6d0, transparent: true, opacity: 0.26, roughness: 0.02, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, depthWrite: false, side: THREE.DoubleSide });
  const chrome = matOf('chrome', 0xd0d4dc), black = matOf('rubber', 0x1c1c1e, { rep: [3, 3] });
  // moulded body shell, with the swooping lines of a 90s water blaster
  k.prof([[11.5, -1.5], [11.8, 1.6], [9.5, 3.3], [3, 3.7], [-4, 3.5], [-10, 2.7], [-15.5, 1.9], [-16.5, 0.4], [-15.5, -1.3], [-10, -2.5], [-3, -3.1], [4, -3.2], [9.5, -2.8]], 4.6, green, { bevel: 1.3, smooth: true, bs: 4 });
  k.prof([[8, 3.2], [8, 4.5], [5, 4.9], [-9, 4.5], [-11, 3.9], [-11, 2.9]], 3.0, dgreen, { bevel: 0.7 });                         // tank cradle
  for (const z of [-6, -2, 2]) k.box(4.9, 0.5, 1.5, dgreen, 0, -0.2, z, 0.2);                                                          // side vents
  k.box(4.9, 1.6, 5, orange, 0, 1.2, 7.4, 0.5);                                                                                        // rear accent panel
  // barrel and nozzle
  k.lathe([[2.0, 0], [2.0, 1], [1.75, 1.4], [1.75, 6.4], [2.15, 6.8], [2.15, 8.0], [1.75, 8.4], [1.7, 9.0]], yellow, 0, 0.4, -14.5);
  k.lathe([[1.9, 0], [2.05, 0.5], [1.9, 1.0], [1.25, 2.2], [0.8, 2.6], [0.45, 2.6], [0.4, 1.8]], orange, 0, 0.4, -22.9);
  // pump: a ribbed slide on a chrome rod under the barrel
  k.cyl(0.55, 0.55, 21, chrome, 0, -3.6, -11.5, 12); k.box(2.2, 4.4, 1.6, dgreen, 0, -1.7, -21.6, 0.4); k.box(2.6, 2.4, 3, dgreen, 0, -3.2, -1.2, 0.5);
  const pump = new THREE.Group(); pump.position.set(0, -3.6, -12); g.add(pump);
  { const pts = [[1.4, 0], [2.0, 0.3]]; for (let i = 0; i < 6; i++) pts.push([2.45, 0.7 + i * 1.2], [2.45, 1.3 + i * 1.2], [2.05, 1.5 + i * 1.2], [2.05, 1.75 + i * 1.2]); pts.push([2.0, 8.1], [1.4, 8.4]); k.lathe(pts, yellow, 0, 0, 4.2, 24, pump); }
  // pistol grip, guard and trigger
  k.prof([[2.2, -2.6], [6.8, -2.6], [9.6, -11.2], [8.6, -12.2], [5.2, -12.2], [4.4, -11], [2.6, -5.4]], 3.5, dgreen, { bevel: 1.0, smooth: true });
  k.prof([[6.9, -3.4], [8.2, -6.5], [9.0, -10.2], [8.3, -10.4], [6.4, -4.0]], 3.7, black, { bevel: 0.3 });                              // rubber back strap
  k.guard(2.5, 0.42, dgreen, -3.4, -0.4); k.prof([[0.6, -2.9], [1.5, -3.0], [1.0, -6.0], [0.2, -5.6]], 1.1, orange, { bevel: 0.25 });
  // the reservoir: clear shell with the yellow charge inside, orange collars, filler cap, feed hose
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(3.7, 3.7, 12, 24), liquid); tank.rotation.x = Math.PI / 2; tank.position.set(0, 6.9, -2); g.add(tank);
  const tankShell = new THREE.Mesh(new THREE.CapsuleGeometry(4.25, 6.4, 8, 24), clear); tankShell.rotation.x = Math.PI / 2; tankShell.position.set(0, 6.9, -2); tankShell.renderOrder = 2; g.add(tankShell);
  for (const z of [4.6, -8.6]) k.ring(4.3, 0.55, orange, 0, 6.9, z);
  k.lathe([[1.7, 0], [1.9, 0.2], [1.9, 1.2], [1.6, 1.5], [0.2, 1.5]], orange, 0, 0, 0).rotation.set(0, 0, 0); g.children[g.children.length - 1].position.set(0, 10.9, -2);       // screw cap on top
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, r = k.box(0.35, 1.0, 0.35, orange, Math.cos(a) * 1.95, 11.55, -2 + Math.sin(a) * 1.95, 0.08); r.rotation.y += -a; }
  k.tube([[0, 6.9, 8.6], [0, 6.4, 10.4], [0, 4.2, 11.2], [0, 2.4, 10.2]], 0.6, black); k.cyl(0.9, 0.9, 1.2, chrome, 0, 6.9, 8.2, 12);
  for (const z of [3.4, -7.4]) k.box(2.4, 2.2, 1.4, dgreen, 0, 3.9, z, 0.3);
  // pressure gauge and the maker's sticker (on the side you can see)
  const dial = labelTex(64, 64, (c) => { c.fillStyle = '#f4f0e0'; c.beginPath(); c.arc(32, 32, 30, 0, 7); c.fill(); c.strokeStyle = '#222'; c.lineWidth = 2; for (let i = 0; i < 9; i++) { const a = Math.PI * (0.75 + i * 0.1875); c.beginPath(); c.moveTo(32 + Math.cos(a) * 22, 32 + Math.sin(a) * 22); c.lineTo(32 + Math.cos(a) * 28, 32 + Math.sin(a) * 28); c.stroke(); } c.strokeStyle = '#d01010'; c.lineWidth = 3; c.beginPath(); c.moveTo(32, 32); c.lineTo(48, 18); c.stroke(); });
  { const b = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.7, 20), chrome); b.rotation.z = Math.PI / 2; b.position.set(-2.5, 0.6, 3.6); g.add(b); const f = new THREE.Mesh(new THREE.CircleGeometry(1.25, 20), Stdm({ map: dial, roughness: 0.2, metalness: 0 })); f.rotation.y = -Math.PI / 2; f.position.set(-2.87, 0.6, 3.6); g.add(f); }
  const sticker = labelTex(256, 64, (c, w, h) => { c.fillStyle = '#ff7a10'; c.beginPath(); c.roundRect(2, 2, w - 4, h - 4, 14); c.fill(); c.fillStyle = '#fff36a'; c.font = 'italic 900 34px Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('PISS-O-MATIC', w / 2, h / 2 - 6); c.font = '900 13px Arial'; c.fillStyle = '#2a1400'; c.fillText('X P 5 0 0 0   •   MAX PRESSURE', w / 2, h - 12); });
  k.plate(9.5, 2.4, sticker, -2.34, 0.9, -4.6, -Math.PI / 2);
  g.userData = { pump, tank, tankShell, mats: [green, dgreen, orange, yellow, liquid], nozzle: new THREE.Vector3(0, 0.4, -25) };
  return g;
}

// ================================================================ DOUBLE-BARREL SAUSAGE SHOTGUN
export function makeShotgun(makeSausage) {
  const g = new THREE.Group(), k = K(g);
  const metal = matOf('steel', 0x8a9098, { rep: [1, 3] }), dark = matOf('blued', 0x3c424c, { rep: [1, 4] });
  const wood = matOf('wood', 0x9a5a2a, { rep: [0.8, 1.6] }), woodD = matOf('rubber', 0x2a1a12, { rep: [4, 4] }), brass = matOf('brass', 0xd8aa48);
  const barrels = new THREE.Group(); g.add(barrels);                                                                                  // hinges at the receiver face (the group's origin)
  for (const x of [-2.15, 2.15]) {
    k.lathe([[2.3, 0], [2.3, 1.2], [2.12, 1.6], [2.02, 21.6], [2.22, 21.9], [2.22, 23.6], [2.0, 24], [1.55, 24], [1.55, 21]], dark, x, 1.5, 0.6, 24, barrels);
    k.cyl(1.55, 1.55, 0.2, Stdm({ color: 0x050505, roughness: 1 }), x, 1.5, -20.6, 16, barrels);
    k.ring(2.24, 0.16, brass, x, 1.5, -21.6, barrels);
  }
  k.prof([[0.6, 3.25], [0.6, 4.05], [-22.6, 3.72], [-22.6, 3.2]], 1.7, dark, { bevel: 0.2, parent: barrels });                         // sighting rib
  k.prof([[0.4, 0.2], [0.4, -0.2], [-22, -0.2], [-22, 0.2]], 1.2, dark, { bevel: 0.1, parent: barrels, y: -0.6 });
  k.ball(0.48, brass, 0, 4.2, -21.8, [1, 1, 1], barrels);
  k.prof([[0.2, -0.4], [-0.6, -2.5], [-3.5, -3.3], [-10, -3.5], [-13.2, -2.6], [-14, -0.9], [-13.6, -0.2]], 6.8, wood, { bevel: 1.5, smooth: true, parent: barrels });   // fore-end
  k.box(3.2, 1.2, 1.6, metal, 0, -2.2, -13.9, 0.3, barrels);
  const banger = Phys({ color: 0xb5562e, roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12 }), knot = Phys({ color: 0x7a3418, roughness: 0.5, metalness: 0 });
  const loaded = []; if (makeSausage) for (const x of [-2.15, 2.15]) { const s = makeSausage(4, 1.35); s.traverse(o => { if (o.isMesh) o.material = o.geometry.type === 'CapsuleGeometry' && o.geometry.parameters.radius > 1 ? banger : knot; }); s.position.set(x, 1.5, -22.6); barrels.add(s); loaded.push(s); }
  // receiver: a rounded steel action with side plates, twin hammers, top lever
  k.prof([[-0.4, -2.8], [-0.4, 4.1], [3.4, 4.25], [7, 3.5], [9.6, 2.0], [10.2, 0], [9.8, -2.4], [6.2, -3.6], [2, -3.6]], 7.0, metal, { bevel: 1.0, smooth: false, bs: 4 });
  for (const x of [-3.56, 3.56]) { k.prof([[0.8, -2.2], [0.8, 3.0], [5.4, 3.0], [8.4, 1.2], [8.6, -1.6], [5.6, -2.6]], 0.25, brass, { bevel: 0.1, x }); for (const [z, y] of [[2, 2], [6.6, -1.2]]) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12), dark); s.rotation.z = Math.PI / 2; s.position.set(x * 1.02, y, z); g.add(s); } }
  for (const x of [-1.9, 1.9]) k.prof([[4.6, 3.6], [4.9, 5.4], [6.0, 6.5], [7.6, 6.6], [7.9, 5.8], [6.9, 5.3], [6.6, 3.6]], 1.2, dark, { bevel: 0.3, x });
  k.prof([[2.6, 4.2], [8.6, 3.2], [9.1, 3.9], [3.0, 5.1]], 0.9, dark, { bevel: 0.3 });
  k.guard(2.7, 0.34, dark, -3.5, 5.6); for (const [z, x] of [[4.6, -0.6], [6.2, 0.6]]) k.prof([[z, -3.4], [z + 0.9, -3.4], [z + 0.2, -5.8], [z - 0.5, -5.5]], 0.6, dark, { bevel: 0.15, x });
  // walnut stock with a rubber recoil pad
  k.prof([[9.4, 2.0], [13.5, 1.3], [20, 1.2], [30.2, 0.4], [30.4, -9.8], [27.6, -10.2], [19.5, -6.6], [13.6, -4.6], [9.6, -3.0]], 5.4, wood, { bevel: 1.8, smooth: true, bs: 4 });
  k.prof([[30.3, 0.5], [31.8, 0.3], [31.9, -9.9], [30.3, -9.9]], 5.2, woodD, { bevel: 0.6 });
  g.userData = { barrels, loaded, mats: [metal, dark, wood, woodD, brass], base: [0x8a9098, 0x3c424c, 0x9a5a2a, 0x2a1a12, 0xd8aa48], muzzle: [new THREE.Vector3(-2.1, 1.5, -24), new THREE.Vector3(2.1, 1.5, -24)] };
  return g;
}

// ================================================================ COLA CAN LAUNCHER
const canLabel = () => MAPS.can || (MAPS.can = labelTex(256, 128, (c, w, h) => { c.fillStyle = '#d8141a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#fff'; c.lineWidth = 9; c.beginPath(); c.moveTo(0, 96); c.bezierCurveTo(60, 60, 110, 122, 170, 92); c.bezierCurveTo(210, 72, 235, 104, 256, 96); c.stroke();
  c.fillStyle = '#fff'; c.font = 'italic 900 46px Georgia, serif'; c.textAlign = 'center'; c.fillText('Fizz', 64, 62); c.fillText('Fizz', 192, 62); c.font = '700 11px Arial'; c.fillText('ORIGINAL COLA', 64, 78); c.fillText('ORIGINAL COLA', 192, 78); }));
export function makeColaCan(s = 1) {
  const g = new THREE.Group();
  const red = reg(new THREE.MeshStandardMaterial({ color: 0xffffff, map: canLabel(), roughness: 0.28, metalness: 0.75 })), silver = matOf('alu', 0xc8ccd4), white = reg(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.6 }));
  const prof = [[0.01, -4.1], [1.9, -4.1], [2.1, -4.3], [2.3, -4.2], [2.7, -3.6], [2.7, 3.3], [2.35, 4.0], [2.3, 4.3], [2.15, 4.3], [2.1, 4.05], [0.01, 4.05]].map(p => new THREE.Vector2(p[0] * s, p[1] * s));
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 20), red); g.add(body);
  for (const y of [4.06, -4.12]) { const e = new THREE.Mesh(new THREE.CircleGeometry(2.1 * s, 20), silver); e.rotation.x = y > 0 ? -Math.PI / 2 : Math.PI / 2; e.position.y = y * s; g.add(e); }
  const tab = new THREE.Mesh(new THREE.TorusGeometry(0.62 * s, 0.17 * s, 6, 14), silver); tab.rotation.x = Math.PI / 2; tab.scale.set(1, 1.35, 1); tab.position.set(0.5 * s, 4.16 * s, 0); g.add(tab);
  g.userData.mats = [red, silver, white]; return g;
}
const tubeLabel = () => MAPS.tube || (MAPS.tube = labelTex(512, 512, (c, w, h) => { c.fillStyle = '#d8141a'; c.fillRect(0, 0, w, h);                  // u runs round the tube (0 = top), v along it
  for (const u of [0.25, 0.75]) { c.save(); c.translate(u * w, h * 0.5); c.rotate(u < 0.5 ? -Math.PI / 2 : Math.PI / 2); c.strokeStyle = '#fff'; c.lineWidth = 12; c.beginPath(); c.moveTo(-230, 46); c.bezierCurveTo(-110, 10, -30, 78, 90, 44); c.bezierCurveTo(150, 26, 200, 54, 230, 46); c.stroke();
    c.fillStyle = '#fff'; c.font = 'italic 900 78px Georgia, serif'; c.textAlign = 'center'; c.fillText('Fizz Cola', 0, 14); c.font = '700 17px Arial'; c.fillText('CAN LAUNCHER  \u2022  SHAKE WELL BEFORE FIRING', 0, 84); c.restore(); } }));
export function makeFizzLauncher() {
  const g = new THREE.Group(), k = K(g);
  const red = matOf('paint', 0xc81820), redD = matOf('cast', 0x7a0c10), silver = matOf('alu', 0xa4a9b2, { rep: [1, 3] }), white = reg(new THREE.MeshStandardMaterial({ color: 0xf4f4f0, map: tubeLabel(), roughness: 0.3, metalness: 0.55 }));
  const grip = matOf('rubber', 0x2a2a2e, { rep: [3, 3] }), cap = matOf('brass', 0xe8b020), chrome = matOf('chrome', 0xb8bcc6);
  // launch tube: anodised sleeve in cola livery, clamped with steel bands, flared chrome muzzle
  k.lathe([[4.5, 0], [4.5, 22]], white, 0, 0, -3.5, 32); k.lathe([[4.5, 0], [4.3, 0.4], [4.3, 2.5], [3.9, 2.5], [3.9, -22]], silver, 0, 0, -25.5, 32);
  for (const z of [-4.4, -13, -22.6]) k.lathe([[4.7, 0], [4.85, 0.25], [4.85, 1.15], [4.7, 1.4]], silver, 0, 0, z, 32);
  k.lathe([[4.35, 0], [4.6, 0.4], [4.7, 2.2], [6.2, 4.6], [6.3, 5.2], [5.9, 5.3], [4.5, 3.0], [4.0, 2.6]], chrome, 0, 0, -25.2, 32);
  k.cyl(3.9, 3.9, 0.2, Stdm({ color: 0x040404, roughness: 1 }), 0, 0, -9, 24);
  // revolving six-can drum with fluted chambers
  const drum = new THREE.Group(); drum.position.set(0, -0.5, -1); g.add(drum);
  k.lathe([[1.0, 0], [6.4, 0], [6.7, 0.4], [6.7, 8.6], [6.4, 9], [1.0, 9]], silver, 0, 0, 4.5, 6, drum).rotation.y = Math.PI / 6;
  k.cyl(1.2, 1.2, 10.6, chrome, 0, 0, 0, 12, drum);
  const cans = []; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, c = makeColaCan(0.7); c.rotation.x = Math.PI / 2; c.position.set(Math.cos(a) * 4.5, Math.sin(a) * 4.5, 0); c.scale.set(1, 1.66, 1); drum.add(c); cans.push(c); }
  const loaded = makeColaCan(0.95); loaded.rotation.x = Math.PI / 2; loaded.position.set(0, 0, -25); g.add(loaded);
  // frame, CO2 bottle with its gauge and braided hose
  k.box(5.4, 11, 3.6, redD, 0, -0.2, 6.6, 1.0); k.box(3.4, 2.4, 12, redD, 0, 4.9, 1.2, 0.6); k.box(3.4, 3.0, 9, redD, 0, -5.6, 3.6, 0.8);
  k.lathe([[0.7, 0], [0.9, 0.6], [2.2, 1.6], [2.4, 2.4], [2.4, 12], [2.2, 13], [1.2, 14], [0.01, 14.2]], silver, 0, -6.6, -4.6, 24);
  k.lathe([[0.9, 0], [1.3, 0.3], [1.3, 1.4], [0.8, 1.7]], cap, 0, -6.6, -3.0, 12); k.tube([[0, -6.6, -2.6], [0, -5.6, -0.6], [0.6, -4.2, 1.2], [0, -2.4, 3]], 0.42, grip);
  // carry rail with the bottle-cap front sight
  k.prof([[2, 4.6], [2, 6.4], [-17, 6.2], [-18.4, 4.6]], 2.0, redD, { bevel: 0.5 }); for (let i = 0; i < 5; i++) k.box(2.2, 0.5, 1.2, grip, 0, 6.5, -1 - i * 3.2, 0.1);
  { const c = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.65, 0.7, 21), cap); c.position.set(0, 7.3, -16); g.add(c); for (let i = 0; i < 21; i++) { const a = i / 21 * Math.PI * 2, t = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.6, 0.24), cap); t.position.set(Math.cos(a) * 1.72, 7.1, -16 + Math.sin(a) * 1.72); t.rotation.y = -a; g.add(t); } }
  // grips, guard, trigger
  k.prof([[1.2, -4.6], [5.4, -4.4], [7.6, -12.6], [6.6, -13.4], [3.6, -13.4], [2.8, -12.2]], 3.4, grip, { bevel: 1.0, smooth: true });
  k.prof([[-13.6, -4.4], [-10.4, -4.4], [-10, -11.4], [-10.8, -12.2], [-13.2, -12.2], [-14, -11.4]], 3.2, grip, { bevel: 1.0, smooth: true }); k.box(3.2, 1.2, 5, redD, 0, -4.4, -12, 0.3);
  k.guard(2.4, 0.36, redD, -4.4, -1.2); k.prof([[-0.4, -4.2], [0.5, -4.2], [0.1, -6.6], [-0.9, -6.2]], 0.9, chrome, { bevel: 0.2 });
  g.userData = { drum, loaded, cans, mats: [red, redD, silver, white, grip, cap], base: [0xc81820, 0x7a0c10, 0xa4a9b2, 0xf4f4f0, 0x2a2a2e, 0xe8b020], muzzle: new THREE.Vector3(0, 0, -30) };
  return g;
}

// ================================================================ PIZZA CUTTER
export function makePizzaCutter() {
  const g = new THREE.Group(), k = K(g);
  const chrome = matOf('steel', 0xb4bac4, { roughness: 0.2, rep: [3, 1] }), edge = matOf('chrome', 0xdce0ea), red = matOf('plastic', 0xc8201c), redD = matOf('rubber', 0x7a0e0c, { rep: [4, 2] });
  const sauce = Phys({ color: 0xb01808, roughness: 0.18, metalness: 0, clearcoat: 1 }), cheese = Phys({ color: 0xffc640, roughness: 0.35, metalness: 0, clearcoat: 0.6 });
  // a turned handle with finger swells, a rubber grip band, a hanging ring at the butt
  k.lathe([[0.01, 0], [1.5, 0.2], [1.95, 1.2], [1.9, 3], [1.55, 5], [1.7, 7.5], [2.0, 10], [1.75, 13], [1.3, 14.6], [1.25, 15.4]], red, 0, 0, 15.2, 24);
  k.lathe([[1.62, 0], [1.78, 0.3], [1.8, 4.4], [1.66, 4.7]], redD, 0, 0, 10.2, 24);
  { const r = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.2, 8, 20), chrome); r.rotation.y = Math.PI / 2; r.position.set(0, 0, 16.2); g.add(r); }
  k.lathe([[1.3, 0], [1.6, 0.3], [1.5, 1.6], [1.0, 2.6], [0.9, 3.2]], chrome, 0, 0, -0.1, 20);                                         // ferrule
  // forged fork: a neck that splits into two cheeks carrying the axle
  k.prof([[-2.6, -0.5], [-2.6, 0.6], [-5.2, 1.7], [-5.6, 0.9]], 1.6, chrome, { bevel: 0.3 });
  for (const x of [-1.25, 1.25]) k.prof([[-4.6, 0.5], [-5.2, 1.9], [-9.0, 3.2], [-10.4, 2.9], [-10.6, 1.7], [-9.4, 1.2]], 0.55, chrome, { bevel: 0.2, x });
  // the wheel: a thin disc ground to an edge, a domed hub nut each side, lightening holes
  const wheel = new THREE.Group(); wheel.position.set(0, 2.2, -9.4); g.add(wheel);
  { const d = new THREE.Mesh(new THREE.LatheGeometry([[0.01, -0.22], [5.3, -0.22], [6.3, 0], [5.3, 0.22], [0.01, 0.22]].map(p => new THREE.Vector2(p[0], p[1])), 56), chrome); d.rotation.z = Math.PI / 2; wheel.add(d);
    const e = new THREE.Mesh(new THREE.TorusGeometry(6.28, 0.06, 4, 64), edge); e.rotation.y = Math.PI / 2; wheel.add(e);
    for (const sx of [-1, 1]) { const h = new THREE.Mesh(new THREE.SphereGeometry(1.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), edge); h.rotation.z = -sx * Math.PI / 2; h.position.x = sx * 0.95; h.scale.set(1, 0.7, 1); wheel.add(h); }
    const ax = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 3.4, 10), chrome); ax.rotation.z = Math.PI / 2; wheel.add(ax);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, h = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.5, 12), redD); h.rotation.z = Math.PI / 2; h.position.set(0, Math.cos(a) * 3.6, Math.sin(a) * 3.6); wheel.add(h); }
    const sm = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 8), sauce); sm.scale.set(0.28, 1.5, 0.8); sm.position.set(0.12, 4.6, -2); sm.rotation.x = 0.5; wheel.add(sm);
    const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 8), sauce); s2.scale.set(0.3, 1.0, 1.4); s2.position.set(-0.12, -1.8, 4.4); wheel.add(s2);
    const ch = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, -6.1, 1), new THREE.Vector3(0.1, -7.6, 1.8), new THREE.Vector3(-0.1, -8.4, 1.2), new THREE.Vector3(0, -9.6, 1.6)]), 12, 0.22, 6), cheese); wheel.add(ch); }
  g.userData = { wheel, mats: [chrome, edge, red, redD, sauce, cheese], base: [0xb4bac4, 0xdce0ea, 0xc8201c, 0x7a0e0c, 0xb01808, 0xffc640], tip: new THREE.Vector3(0, 2.2, -15.6) };
  return g;
}

// ================================================================ CC-9000 CANDY CORN MINIGUN
export function makeCandyGun(makeCandyCorn) {
  const g = new THREE.Group(), k = K(g);
  const yellow = matOf('paint', 0xf5c518), yellowD = matOf('cast', 0xc89a10), orange = matOf('plastic', 0xf07a1a), white = matOf('steel', 0xe8e8e0, { rep: [1, 3] }), grey = matOf('blued', 0x7a7e86);
  const glass = Phys({ color: 0xcfe6f0, transparent: true, opacity: 0.22, roughness: 0.03, metalness: 0, clearcoat: 1, depthWrite: false }), black = matOf('rubber', 0x1a1a1c, { rep: [3, 3] });
  // receiver and motor housing
  k.prof([[10.5, -3.4], [10.5, 3.0], [8, 3.9], [-4.5, 3.9], [-6.2, 2.6], [-6.2, -3.0], [-4.5, -4.0], [8, -4.0]], 7.4, yellow, { bevel: 1.2 });
  k.lathe([[3.9, 0], [4.3, 0.5], [4.3, 3.6], [3.7, 4.4], [2.9, 4.6]], yellowD, 0, 0.6, -6.2, 24);
  for (let i = 0; i < 4; i++) k.box(7.6, 0.45, 2.4, yellowD, 0, -1.6 + i * 1.3, 5.5, 0.1);                                             // cooling louvres
  k.box(5.2, 6.4, 6.5, orange, 0, -0.6, 14, 1.0); k.prof([[17.2, 3.4], [19.2, 3.0], [19.4, -4.6], [17.2, -4.4]], 5.8, black, { bevel: 0.7 });   // stock block + butt pad
  k.prof([[4.2, -3.8], [8.2, -3.8], [10.2, -11.4], [9.2, -12.2], [6.2, -12.2], [5.4, -11]], 3.6, black, { bevel: 1.0, smooth: true });
  k.guard(2.4, 0.36, yellowD, -4.2, 2.2); k.prof([[2.8, -4.0], [3.7, -4.0], [3.2, -6.4], [2.3, -6.0]], 0.9, orange, { bevel: 0.2 });
  k.tube([[0, 3.8, 7], [0, 6.6, 6], [0, 7.4, 1.5], [0, 6.6, -3], [0, 3.8, -4]], 0.75, yellowD);                                        // carry handle
  k.prof([[-4, -3.8], [-8, -3.8], [-8.6, -9.6], [-7.8, -10.4], [-5.2, -10.4], [-4.4, -9.6]], 3.0, black, { bevel: 0.9, smooth: true }); // fore grip
  // hopper of candy corn feeding through a ribbed chute
  const hop = k.ball(4.0, glass, 0, 7.6, 10.5, [1, 0.9, 1.1]); hop.renderOrder = 2; k.lathe([[3.4, 0], [3.6, 0.3], [3.6, 1.0], [3.2, 1.2]], orange, 0, 0, 0).rotation.set(0, 0, 0); g.children[g.children.length - 1].position.set(0, 3.9, 10.5);
  const kernels = []; if (makeCandyCorn) for (let i = 0; i < 9; i++) { const c = makeCandyCorn(0.55); c.position.set((Math.random() - 0.5) * 4.2, 5.4 + Math.random() * 3, 10.5 + (Math.random() - 0.5) * 4.4); c.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); g.add(c); kernels.push(c); }
  { const d = new THREE.Mesh(new THREE.CylinderGeometry(4.3, 4.3, 3.2, 28), orange); d.rotation.z = Math.PI / 2; d.position.set(4.9, -3.4, 1.5); g.add(d); const f = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 3.5, 28), white); f.rotation.z = Math.PI / 2; f.position.copy(d.position); g.add(f);
    const n = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 3.9, 6), grey); n.rotation.z = Math.PI / 2; n.position.copy(d.position); g.add(n); }
  // six rotating barrels held by three clamp discs
  const spin = new THREE.Group(); spin.position.set(0, 0.6, -6); g.add(spin);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; k.lathe([[1.05, 0], [1.05, 20.4], [0.95, 20.8], [0.62, 20.8], [0.62, 18]], white, Math.cos(a) * 2.35, Math.sin(a) * 2.35, 0, 12, spin); }
  for (const z of [-2.4, -11.5, -19]) { const d = k.lathe([[1.1, 0], [3.75, 0], [3.9, 0.25], [3.9, 1.35], [3.75, 1.6], [1.1, 1.6]], orange, 0, 0, z + 0.8, 6, spin); }
  k.cyl(1.05, 1.05, 21, grey, 0, 0, -10, 12, spin);
  k.lathe([[3.3, 0], [3.5, 0.4], [3.5, 1.4], [3.0, 1.8], [3.0, 2.6], [3.4, 3.0], [3.4, 4.0], [2.9, 4.4]], orange, 0, 0.6, -26.4, 24);  // flash hider
  g.userData = { spin, kernels, mats: [yellow, yellowD, orange, white, grey], base: [0xf5c518, 0xc89a10, 0xf07a1a, 0xe8e8e0, 0x7a7e86], muzzle: new THREE.Vector3(0, 0.6, -31) };
  return g;
}

// ================================================================ TURD LAUNCHER
export function makeTurdLauncher(makeTurd) {
  const g = new THREE.Group(), k = K(g);
  const tube = matOf('paint', 0x3f6a3a), tubeD = matOf('cast', 0x284a26), seat = Phys({ color: 0xeeeeea, roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 });   // glazed porcelain
  const metal = matOf('chrome', 0xc0c4cc), grip = matOf('wood', 0x7a4a26, { rep: [1, 1] }), warn = matOf('paint', 0xffc020);
  // the tube: thick walls, a venturi cone at the back like a recoilless launcher
  k.lathe([[5.6, 0], [4.2, 5], [4.5, 6], [4.5, 7.2], [4.7, 7.4], [4.7, 34], [4.4, 34.4], [3.8, 34.4], [3.8, 6]], tube, 0, 0, 13, 32);
  for (const z of [5.5, -2.5, -8.5]) k.lathe([[4.8, 0], [5.0, 0.3], [5.0, 1.7], [4.8, 2]], tubeD, 0, 0, z, 32);
  k.lathe([[4.75, 0], [4.9, 0.2], [4.9, 6.6], [4.75, 6.8]], grip, 0, 0, -10.5, 32);                                                   // wooden heat shield
  for (const z of [-19.2, -20.6]) k.lathe([[4.74, 0], [4.86, 0.15], [4.86, 0.75], [4.74, 0.9]], warn, 0, 0, z, 32);
  // toilet-seat muzzle with its lid tipped up, and the loaded round
  const ring = new THREE.Mesh(new THREE.TorusGeometry(5.5, 1.5, 12, 32), seat); ring.scale.set(1, 1, 0.55); ring.position.set(0, 0, -21.6); g.add(ring);
  { const lid = new THREE.Mesh(new THREE.CylinderGeometry(6.4, 6.4, 0.7, 32), seat); lid.rotation.x = Math.PI / 2 - 1.0; lid.position.set(0, 7.2, -19.2); g.add(lid); for (const x of [-2.4, 2.4]) k.cyl(0.6, 0.6, 1.8, metal, x, 5.6, -20.6, 10).rotation.z = Math.PI / 2; }
  const loaded = makeTurd ? makeTurd(0.62) : new THREE.Group(); loaded.rotation.x = -Math.PI / 2; loaded.position.set(0, 0, -23); g.add(loaded);
  // optical sight on a rail, flush-lever trigger, pistol grip and fore grip
  k.box(2.2, 1.2, 12, tubeD, 0, 5.3, -6, 0.3); k.lathe([[1.5, 0], [1.6, 0.4], [1.2, 1.2], [1.2, 6.5], [1.7, 7.2], [1.7, 8.6], [1.4, 8.6]], tubeD, 0, 7.4, -1.6, 20); for (const z of [-3, -8]) k.box(1.6, 1.6, 1.2, tubeD, 0, 6.2, z, 0.3);
  { const l = new THREE.Mesh(new THREE.CircleGeometry(1.35, 20), Phys({ color: 0x203a50, roughness: 0.02, metalness: 0.9, clearcoat: 1 })); l.position.set(0, 7.4, -1.55); g.add(l); }
  k.tube([[2.6, 3.8, 2], [4.6, 4.2, 1], [6.6, 3.6, -1], [7.2, 2.6, -3]], 0.35, metal); k.ball(0.8, metal, 7.2, 2.6, -3);              // the flush lever
  k.prof([[-0.6, -4.4], [3.8, -4.4], [5.8, -12], [4.8, -12.8], [1.8, -12.8], [1.0, -11.6]], 3.4, grip, { bevel: 1.0, smooth: true });
  k.prof([[-13.8, -4.4], [-10.4, -4.4], [-10, -11], [-10.8, -11.8], [-13.4, -11.8], [-14.2, -11]], 3.2, grip, { bevel: 1.0, smooth: true });
  k.guard(2.3, 0.34, tubeD, -4.5, -2.6); k.prof([[-2.2, -4.4], [-1.3, -4.4], [-1.7, -6.6], [-2.6, -6.2]], 0.9, metal, { bevel: 0.2 });
  g.userData = { loaded, mats: [tube, tubeD, seat, metal, grip, warn], base: [0x3f6a3a, 0x284a26, 0xeeeeea, 0xc0c4cc, 0x7a4a26, 0xffc020], muzzle: new THREE.Vector3(0, 0, -28) };
  return g;
}

// ================================================================ everything else: an upgrade pass over a primitive-built model.
// Boxes get rounded edges, cylinders get enough sides to be round, and every material gets PBR maps that suit what it is.
export function refine(g) {
  const seen = new Map();
  const up = m => { if (!m || !m.isMeshStandardMaterial || m.transparent || m.map || m.normalMap) return m; if (seen.has(m)) return m;
    const c = m.color, mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b), brown = c.r > c.g && c.g > c.b && mx - mn > 0.12 && mx < 0.6;
    const kind = m.metalness > 0.5 ? (m.roughness < 0.14 ? null : 'brushed') : brown ? 'wood' : 'pebble'; seen.set(m, 1);
    if (kind) { const M = maps(kind); m.normalMap = rep(M.normalMap, 2, 2); m.roughnessMap = rep(M.roughnessMap, 2, 2); m.roughness = Math.min(1, m.roughness * 1.5 + 0.15); m.normalScale.set(kind === 'wood' ? 0.7 : 0.3, kind === 'wood' ? 0.7 : 0.3); if (M.map) { m.map = rep(M.map, 1.5, 1.5); } m.needsUpdate = true; }
    return m; };
  g.traverse(o => { if (!o.isMesh) return; up(o.material); const p = o.geometry && o.geometry.parameters, t = o.geometry && o.geometry.type; if (!p) return;
    if (t === 'BoxGeometry' && Math.min(p.width, p.height, p.depth) > 0.7) { const b = Math.min(0.45, Math.min(p.width, p.height, p.depth) * 0.22), sh = new THREE.Shape([new THREE.Vector2(-p.width / 2, -p.height / 2), new THREE.Vector2(p.width / 2, -p.height / 2), new THREE.Vector2(p.width / 2, p.height / 2), new THREE.Vector2(-p.width / 2, p.height / 2)]);
      const geo = new THREE.ExtrudeGeometry(sh, { depth: p.depth - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: 2 }); geo.translate(0, 0, -(p.depth - 2 * b) / 2); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 12, uv.getY(i) / 12); o.geometry.dispose(); o.geometry = geo; }
    else if (t === 'CylinderGeometry' && p.radialSegments >= 8 && p.radialSegments < 24) { const geo = new THREE.CylinderGeometry(p.radiusTop, p.radiusBottom, p.height, 28, 1, p.openEnded, p.thetaStart, p.thetaLength); o.geometry.dispose(); o.geometry = geo; }
    else if (t === 'SphereGeometry' && p.widthSegments < 16 && !p.phiLength) { const geo = new THREE.SphereGeometry(p.radius, 22, 14); o.geometry.dispose(); o.geometry = geo; } });
  return g;
}
