// Shared building blocks for kart models.
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three';

// Sweep a cross-section along a curve. ring(u, angle) returns [x, y] in the
// curve's local frame (x = sideways, y = up). u runs from u0 to u1.
export function sweep(curve, segments, radial, ring, u0 = 0, u1 = 1) {
  const pos = [];
  const idx = [];
  const up = new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3();
  const upv = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const u = u0 + (u1 - u0) * (i / segments);
    const c = curve.getPointAt(u);
    const t = curve.getTangentAt(u);
    side.crossVectors(up, t).normalize();
    upv.crossVectors(t, side).normalize();
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const [x, y] = ring(u, a);
      pos.push(c.x + side.x * x + upv.x * y, c.y + side.y * x + upv.y * y, c.z + side.z * x + upv.z * y);
    }
  }
  const row = radial + 1;
  for (let i = 0; i < segments; i++) for (let j = 0; j < radial; j++) {
    const a = i * row + j, b = a + row;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

let tyreMat, rimMat, hubMat;
export function makeWheel(radius, width) {
  tyreMat ??= new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  rimMat ??= new THREE.MeshStandardMaterial({ color: 0xb9b9b9, roughness: 0.25, metalness: 1 });
  hubMat ??= new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.4, metalness: 0.8 });
  const g = new THREE.Group();
  // Rounded tyre from a lathe profile around the axle (X axis).
  const pts = [];
  const r0 = radius * 0.62, hw = width / 2;
  for (let i = 0; i <= 12; i++) {
    const a = -Math.PI / 2 + (i / 12) * Math.PI;
    pts.push(new THREE.Vector2(radius - 0.05 + Math.cos(a) * 0.05, Math.sin(a) * hw));
  }
  pts.unshift(new THREE.Vector2(r0, -hw));
  pts.push(new THREE.Vector2(r0, hw));
  const tyreGeo = new THREE.LatheGeometry(pts, 28);
  tyreGeo.rotateZ(Math.PI / 2);
  const tyre = new THREE.Mesh(tyreGeo, tyreMat);
  tyre.castShadow = true;
  g.add(tyre);
  // tread blocks
  const treadGeo = new THREE.BoxGeometry(width * 0.86, 0.016, 0.045);
  for (let i = 0; i < 20; i++) {
    const t = new THREE.Mesh(treadGeo, tyreMat);
    const a = (i / 20) * Math.PI * 2;
    t.position.set(0, Math.cos(a) * (radius - 0.004), Math.sin(a) * (radius - 0.004));
    t.rotation.x = -a;
    g.add(t);
  }
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(r0, r0, width * 0.7, 20), rimMat);
  rim.rotation.z = Math.PI / 2;
  rim.position.x = width * 0.08;
  g.add(rim);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(r0 * 0.35, r0 * 0.35, width * 0.75, 10), hubMat);
  hub.rotation.z = Math.PI / 2;
  hub.position.x = width * 0.12;
  g.add(hub);
  for (let i = 0; i < 6; i++) { // lug holes
    const a = (i / 6) * Math.PI * 2;
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, width * 0.72, 6), hubMat);
    h.rotation.z = Math.PI / 2;
    h.position.set(width * 0.1, Math.cos(a) * r0 * 0.65, Math.sin(a) * r0 * 0.65);
    g.add(h);
  }
  mergeStatic(g);
  return g;
}

// Merge every static mesh under `root` (except the `keep` subtrees) into one
// mesh per material. Karts are built from dozens of small parts; merging keeps
// six karts on screen cheap to draw.
export function mergeStatic(root, keep = []) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map();
  const victims = [];
  const skip = new Set();
  for (const k of keep) k.traverse((o) => skip.add(o));
  root.traverse((o) => {
    if (!o.isMesh || skip.has(o) || Array.isArray(o.material)) return;
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    const hasMap = !!o.material.map;
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'normal' && !(hasMap && name === 'uv') && !(o.material.vertexColors && name === 'color')) g.deleteAttribute(name);
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    const key = o.material.uuid;
    if (!buckets.has(key)) buckets.set(key, { mat: o.material, geos: [], shadow: false });
    const b = buckets.get(key);
    b.geos.push(g);
    b.shadow ||= o.castShadow;
    victims.push(o);
  });
  for (const o of victims) o.parent.remove(o);
  for (const { mat, geos, shadow } of buckets.values()) {
    const merged = mergeGeometries(geos, false);
    if (!merged) continue;
    const m = new THREE.Mesh(merged, mat);
    m.castShadow = shadow;
    root.add(m);
  }
}
