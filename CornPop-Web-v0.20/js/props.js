// Static prop meshes (vertex-lit at load like Quake's lit models), merged per texture.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export class PropBuilder {
  constructor(world) { this.world = world; this.parts = new Map(); }

  // geom with groups -> split by group into texture buckets; m = Matrix4 world transform
  add(geom, texs, m, opts = {}) {
    geom = geom.index ? geom.toNonIndexed() : geom.clone();
    if (!geom.attributes.normal) geom.computeVertexNormals();
    geom.applyMatrix4(m);
    const groups = geom.groups.length ? geom.groups : [{ start: 0, count: geom.attributes.position.count, materialIndex: 0 }];
    for (const g of groups) {
      const tex = Array.isArray(texs) ? texs[g.materialIndex] ?? texs[0] : texs;
      if (!tex) continue;
      const part = new THREE.BufferGeometry();
      for (const name of ['position', 'normal', 'uv']) {
        const a = geom.attributes[name]; if (!a) continue;
        part.setAttribute(name, new THREE.BufferAttribute(a.array.slice(g.start * a.itemSize, (g.start + g.count) * a.itemSize), a.itemSize));
      }
      if (opts.uvScale) { const uv = part.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * opts.uvScale[0], uv.getY(i) * opts.uvScale[1]); }
      const key = tex + (opts.fullbright ? '|fb' : '');
      if (!this.parts.has(key)) this.parts.set(key, { tex, fullbright: !!opts.fullbright, list: [] });
      this.parts.get(key).list.push(part);
    }
  }
  static M(x, y, z, ry = 0, rx = 0, rz = 0, s = 1) {
    const m = new THREE.Matrix4(); m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(s, s, s)); return m;
  }

  // ---- primitives ----
  pizza(x, y, z, r, opts = {}) { // y = bottom
    const th = opts.thick || 3;
    const g = new THREE.CylinderGeometry(r, r * 0.98, th, Math.max(12, Math.round(r / 2.5)), 1);
    this.add(g, ['crust', 'pizza', 'crust'], PropBuilder.M(x, y + th / 2, z, opts.rot || 0));
  }
  pizzaStack(x, y, z, r, n) { for (let i = 0; i < n; i++) this.pizza(x + (i % 2) * 0.8, y + i * 4, z, r, { thick: 3.5, rot: i }); }
  pizzaSquare(x, y, z, w, d, ry = 0) {
    const g = new THREE.BoxGeometry(w, 3, d);
    // box groups: px,nx,py,ny,pz,nz
    this.add(g, ['crust', 'crust', 'pizzasq', 'crust', 'crust', 'crust'], PropBuilder.M(x, y + 1.5, z, ry), { uvScale: [w / 64, d / 64] });
  }
  cylinder(x, y, z, r, h, tex, opts = {}) { // y bottom
    const g = new THREE.CylinderGeometry(opts.rTop ?? r, r, h, opts.segs || 14, 1, !!opts.open);
    const t = Array.isArray(tex) ? tex : [tex, opts.capTex || tex, opts.capTex || tex];
    this.add(g, t, PropBuilder.M(x, y + h / 2, z, opts.ry || 0, opts.rx || 0, opts.rz || 0), { uvScale: opts.uvScale || [Math.max(1, Math.round(2 * Math.PI * r / 64)), Math.max(1, h / 64)], fullbright: opts.fullbright });
  }
  roundTable(x, z, y, r, h, tex = 'concrete', opts = {}) {
    this.cylinder(x, y, z, r * 0.45, h - 6, tex, { segs: 12 });
    this.cylinder(x, y + h - 6, z, r, 6, opts.top || tex, { segs: 20 });
    if (opts.solid !== false) this.world.addBrush({ min: [x - r * 0.8, y, z - r * 0.8], max: [x + r * 0.8, y + h, z + r * 0.8], invisible: true, noshadow: true });
  }
  pedestal(x, z, y, r, h, tex = 'concrete') { // stepped round pedestal
    this.cylinder(x, y, z, r + 10, h * 0.5, tex, { segs: 22 });
    this.cylinder(x, y + h * 0.5, z, r, h * 0.5, tex, { segs: 22 });
    this.world.addBrush({ min: [x - r - 8, y, z - r - 8], max: [x + r + 8, y + h * 0.5, z + r + 8], invisible: true, noshadow: true });
    this.world.addBrush({ min: [x - r * 0.85, y, z - r * 0.85], max: [x + r * 0.85, y + h, z + r * 0.85], invisible: true, noshadow: true });
  }
  barrel(x, z, y = 0, r = 12, h = 30, tex = 'chrome') {
    this.cylinder(x, y, z, r, h, tex, { segs: 12 });
    this.cylinder(x, y + h * 0.3, z, r + 0.8, 2, 'metal', { segs: 12 });
    this.cylinder(x, y + h * 0.7, z, r + 0.8, 2, 'metal', { segs: 12 });
    this.world.addBrush({ min: [x - r, y, z - r], max: [x + r, y + h, z + r], invisible: true, noshadow: true });
  }
  sphere(x, y, z, r, tex, opts = {}) {
    const g = new THREE.SphereGeometry(r, opts.segs || 12, opts.rings || 8, 0, Math.PI * 2, 0, opts.half ? Math.PI / 2 : Math.PI);
    if (opts.sy) g.scale(1, opts.sy, 1);
    this.add(g, tex, PropBuilder.M(x, y, z, opts.ry || 0), { fullbright: opts.fullbright, uvScale: opts.uvScale || [3, 1] });
  }
  // rectangular-section ring segment (arches / pipe rims). axis: 'x' => ring lies in the YZ plane, 'z' => XY plane
  ring(cx, cy, cz, rIn, rOut, depth, axis, a0 = 0, a1 = Math.PI, tex = 'rust', segs = 20) {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, rOut, a0, a1, false);
    shape.absarc(0, 0, rIn, a1, a0, true);
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: segs });
    g.translate(0, 0, -depth / 2);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 64, uv.getY(i) / 64);
    this.add(g, [tex, tex], PropBuilder.M(cx, cy, cz, axis === 'x' ? Math.PI / 2 : 0));
  }
  // inside of a big pipe (cylinder viewed from inside), axis along x or z, y = centre
  pipeInterior(cx, cy, cz, r, len, axis, tex = 'rust') {
    const g = new THREE.CylinderGeometry(r, r, len, 24, 1, true);
    // flip to face inward
    const idx = g.index.array; for (let i = 0; i < idx.length; i += 3) { const t = idx[i]; idx[i] = idx[i + 2]; idx[i + 2] = t; }
    const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
    const m = axis === 'x' ? PropBuilder.M(cx, cy, cz, 0, 0, Math.PI / 2) : PropBuilder.M(cx, cy, cz, 0, Math.PI / 2, 0);
    this.add(g, tex, m, { uvScale: [Math.round(2 * Math.PI * r / 64), len / 64] });
  }
  pipe(x0, y0, z0, x1, y1, z1, r = 3, tex = 'metal') {
    const a = new THREE.Vector3(x0, y0, z0), b = new THREE.Vector3(x1, y1, z1); const len = a.distanceTo(b);
    const g = new THREE.CylinderGeometry(r, r, len, 8, 1, true);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    const m = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1));
    this.add(g, tex, m, { uvScale: [1, len / 64] });
  }
  // box centred at (x, z) with bottom y, size w (x) by h by d (z), turned ry about Y. tex: one name or [px,nx,top,bottom,pz,nz]
  box(x, y, z, w, h, d, tex, opts = {}) {
    const g = new THREE.BoxGeometry(w, h, d); const t = Array.isArray(tex) ? tex : [tex, tex, tex, tex, tex, tex];
    const uv = g.attributes.uv; if (!opts.fit) for (let i = 0; i < uv.count; i++) { const f = Math.floor(i / 4); const [a, b] = f < 2 ? [d, h] : f < 4 ? [w, d] : [w, h]; uv.setXY(i, uv.getX(i) * Math.max(1, a / 64), uv.getY(i) * Math.max(1, b / 64)); }
    this.add(g, t, PropBuilder.M(x, y + h / 2, z, opts.ry || 0, opts.rx || 0, opts.rz || 0), { fullbright: opts.fullbright });
  }
  // a wedge-topped box (car cabins, awnings): like box but the top face is pulled in by inset at front/back along local z
  cabin(x, y, z, w, h, d, insetF, insetB, tex, ry = 0) {
    const g = new THREE.BoxGeometry(w, h, d); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setZ(i, p.getZ(i) > 0 ? p.getZ(i) - insetF : p.getZ(i) + insetB);
    g.computeVertexNormals(); const t = Array.isArray(tex) ? tex : [tex, tex, tex, tex, tex, tex];
    this.add(g, t, PropBuilder.M(x, y + h / 2, z, ry));
  }
  cageLamp(x, y, z) { this.sphere(x, y, z, 4, 'glow', { fullbright: true, segs: 8, rings: 6 }); this.cylinder(x, y + 3, z, 2, 4, 'metal', { segs: 6 }); }
  chair(x, z, y, ry = 0) { // folding chair, visual only
    const m = PropBuilder.M(x, y, z, ry);
    const parts = [[0, 17, 0, 18, 2, 16], [0, 30, -8, 18, 16, 2], [-8, 9, -7, 1.5, 18, 1.5], [8, 9, -7, 1.5, 18, 1.5], [-8, 9, 7, 1.5, 18, 1.5], [8, 9, 7, 1.5, 18, 1.5]];
    for (const [px, py, pz, w, h, d] of parts) { const g = new THREE.BoxGeometry(w, h, d); g.translate(px, py, pz); this.add(g, 'metal', m); }
  }
  stool(x, z, y = 0) { this.cylinder(x, y, z, 1.5, 22, 'chrome', { segs: 6 }); this.cylinder(x, y + 22, z, 8, 3, 'leather', { segs: 12 }); this.cylinder(x, y, z, 9, 1.5, 'chrome', { segs: 12 }); }
  helmet(x, y, z) { this.sphere(x, y, z, 5, 'metal', { half: true, segs: 10, rings: 5 }); }
  calzone(x, y, z, ry = 0) { const g = new THREE.SphereGeometry(5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1.2, 0.8, 0.8); this.add(g, 'crust', PropBuilder.M(x, y, z, ry), { uvScale: [1, 1] }); }

  // Build merged, vertex-lit meshes
  build(makeMat) {
    const group = new THREE.Group();
    for (const [key, p] of this.parts) {
      const g = mergeGeometries(p.list, false); if (!g) continue;
      if (p.fullbright) { const c = new Float32Array(g.attributes.position.count * 3).fill(1); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); }
      else this.world.bakeVertexColors(g);
      g.computeBoundingSphere();
      const mesh = new THREE.Mesh(g, makeMat(p.tex, p.fullbright)); mesh.matrixAutoUpdate = false; group.add(mesh);
    }
    return group;
  }
}
