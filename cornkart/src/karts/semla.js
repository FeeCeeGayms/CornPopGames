// The Semla Kart, modelled from the reference sheet: a round, sugar-dusted bun
// body with a rope of whipped cream round its waist and heaped at the back, the
// bun's lid as a domed roof on cream-coloured posts with a cream rosette, an
// almond and a Swedish flag on top, brown leather seat, chrome bumpers, round
// headlamps and "Semla" name plates. Units are metres, forward is +Z.
import * as THREE from 'three';
import { bunCrustTexture, ovalPlateTexture, swedishFlagTexture } from '../textures.js';
import { makeWheel, sweep } from './parts.js';

// sweep() has no texture coordinates; add them from its grid (u along, v around).
function addGridUV(geo, segments, radial, repeatU = 1, repeatV = 1) {
  const uv = [];
  for (let i = 0; i <= segments; i++) for (let j = 0; j <= radial; j++) uv.push((j / radial) * repeatU, (i / segments) * repeatV);
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return geo;
}

// A twisted piping of cream: a lobed cross-section that turns along the curve.
function creamRope(curve, segments, radius, twists, closed) {
  const geo = sweep(curve, segments, 16, (u, a) => {
    const lobe = 1 + 0.28 * Math.cos(4 * a + u * twists * Math.PI * 2);
    const taper = closed ? 1 : Math.min(1, Math.sin(Math.PI * u) * 1.6 + 0.15);
    return [Math.cos(a) * radius * lobe * taper, Math.sin(a) * radius * lobe * taper];
  });
  return geo;
}

// A soft-serve style swirl of stacked, shrinking cream rings.
function creamHeap(mat, r0, h, turns = 4) {
  const pts = [];
  const n = turns * 24;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = t * turns * Math.PI * 2;
    const r = r0 * (1 - t * 0.85);
    pts.push(new THREE.Vector3(Math.cos(a) * r, t * h, Math.sin(a) * r));
  }
  const g = new THREE.Group();
  const rope = new THREE.Mesh(creamRope(new THREE.CatmullRomCurve3(pts), n * 2, r0 * 0.42, turns * 3, false), mat);
  g.add(rope);
  return g;
}

export function buildSemlaKart({ bunColor = 0xffffff, creamColor = 0xf8f2e2, frameColor = 0xe9dcbc, seatColor = 0x8a4a22, plate = 'Semla', flag = true } = {}) {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  const crust = bunCrustTexture(0.25);
  const bunMat = new THREE.MeshStandardMaterial({ map: crust.map, normalMap: crust.normal, color: bunColor, roughness: 0.85 });
  const creamMat = new THREE.MeshPhysicalMaterial({ color: creamColor, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffffff) });
  const frameMat = new THREE.MeshPhysicalMaterial({ color: frameColor, roughness: 0.35, clearcoat: 0.4 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.55 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.15, metalness: 1.0 });
  const leatherMat = new THREE.MeshStandardMaterial({ color: seatColor, roughness: 0.45 });

  // --- Bun body: a plump, rounded sweep with the cockpit scooped out.
  const L0 = -1.0, L1 = 1.0;
  const zAt = (u) => L0 + (L1 - L0) * u;
  const bottom = 0.2;
  const topAt = (u) => 0.74 - Math.pow(Math.abs(zAt(u) + 0.05) / 1.05, 2.4) * 0.22;
  const halfW = (u) => {
    const e = Math.abs(2 * u - 1);
    return 0.53 * Math.pow(Math.max(0, 1 - Math.pow(e, 3.2)), 0.42);
  };
  const cockpit = (u) => {
    const x = Math.abs(zAt(u) - 0.02) / 0.4;
    return x >= 1 ? 0 : Math.pow(1 - Math.pow(x, 4), 0.5);
  };
  const pts = [];
  for (let i = 0; i <= 60; i++) { const u = i / 60; pts.push(new THREE.Vector3(0, (bottom + topAt(u)) / 2, zAt(u))); }
  const line = new THREE.CatmullRomCurve3(pts);
  const se = (v, n) => Math.sign(v) * Math.pow(Math.abs(v), 2 / n);
  const SEG = 90, RAD = 36;
  const tubGeo = sweep(line, SEG, RAD, (u, a) => {
    const hh = (topAt(u) - bottom) / 2, w = halfW(u);
    let x = se(Math.cos(a), 2.4) * w;
    let y = se(Math.sin(a), 2.4) * hh;
    const k = cockpit(u), sill = hh * 0.15;
    if (k > 0 && y > sill) y = sill + (y - sill) * (1 - k * 0.95);
    return [x, y];
  });
  addGridUV(tubGeo, SEG, RAD, 1, 3);
  const tub = new THREE.Mesh(tubGeo, bunMat);
  tub.castShadow = true;
  body.add(tub);
  tub.updateMatrixWorld(true);

  // --- Cream rope round the waist, just above the widest part of the bun.
  const ropePts = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    ropePts.push(new THREE.Vector3(Math.sin(a) * 0.5, 0.62 + (Math.cos(a) > 0 ? 0.02 : 0.05), -0.05 + Math.cos(a) * 0.9));
  }
  const ropeCurve = new THREE.CatmullRomCurve3(ropePts, true);
  const rope = new THREE.Mesh(creamRope(ropeCurve, 220, 0.075, 30, true), creamMat);
  rope.castShadow = true;
  body.add(rope);
  // heaped swirls on the rear quarters, as on the side views
  for (const side of [-1, 1]) {
    const heap = creamHeap(creamMat, 0.2, 0.32, 3);
    heap.position.set(side * 0.3, 0.62, -0.52);
    heap.scale.set(1, 1, 1.5);
    body.add(heap);
  }

  // --- Cockpit: floor, brown leather bucket seat, steering wheel.
  const floor = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.9), blackMat);
  floor.position.set(0, 0.3, -0.05);
  body.add(floor);
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.42, 2, 1, 2), leatherMat);
  cushion.position.set(0, 0.4, -0.3);
  const back = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.26, 6, 12), leatherMat);
  back.scale.set(1.15, 1, 0.42);
  back.position.set(0, 0.66, -0.5);
  back.rotation.x = -0.18;
  body.add(cushion, back);
  for (const side of [-1, 1]) {
    const bol = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.34, 4, 8), leatherMat);
    bol.position.set(side * 0.24, 0.6, -0.42);
    bol.rotation.x = -0.25;
    body.add(bol);
  }

  const steering = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.024, 8, 28), blackMat);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12), chromeMat);
  hub.rotation.x = Math.PI / 2;
  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.014), blackMat);
    spoke.position.x = 0.075;
    const holder = new THREE.Group();
    holder.rotation.z = Math.PI / 2 + i * (Math.PI * 2 / 3);
    holder.add(spoke);
    steering.add(holder);
  }
  steering.add(rim, hub);
  steering.position.set(0, 0.8, 0.28);
  body.add(steering);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1, 8), blackMat);
  body.add(column);
  const columnBase = new THREE.Vector3(0, 0.5, 0.62);
  const placeWheel = (p) => {
    steering.position.copy(p);
    const dir = new THREE.Vector3().subVectors(p, columnBase);
    column.scale.y = dir.length();
    column.position.copy(columnBase).addScaledVector(dir, 0.5);
    column.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    steering.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().negate());
  };
  placeWheel(steering.position.clone());

  // --- Lid roof: cream-coloured posts holding the bun's domed top.
  const roofY = 1.55;
  const post = (a, b, r) => {
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, a.distanceTo(b), 4, 10), frameMat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    m.castShadow = true;
    body.add(m);
  };
  for (const side of [-1, 1]) {
    post(new THREE.Vector3(side * 0.4, 0.66, 0.36), new THREE.Vector3(side * 0.36, roofY, 0.14), 0.06);
    post(new THREE.Vector3(side * 0.42, 0.7, -0.62), new THREE.Vector3(side * 0.38, roofY, -0.48), 0.085);
  }
  // a rim ring the lid sits on
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.04, 8, 40), frameMat);
  ring.rotation.x = Math.PI / 2;
  ring.scale.set(0.44, 0.4, 1);
  ring.position.set(0, roofY, -0.17);
  body.add(ring);
  const lidCrust = bunCrustTexture(0.5, 0.9); // sugar all over the lid
  const lidMat = new THREE.MeshStandardMaterial({ map: lidCrust.map, normalMap: lidCrust.normal, color: bunColor, roughness: 0.85 });
  const lidGeo = new THREE.SphereGeometry(0.6, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const lid = new THREE.Mesh(lidGeo, lidMat);
  lid.scale.set(1, 0.55, 0.95);
  lid.position.set(0, roofY + 0.02, -0.17);
  lid.castShadow = true;
  body.add(lid);
  const under = new THREE.Mesh(new THREE.CircleGeometry(0.6, 32), new THREE.MeshStandardMaterial({ color: 0xe8d2a0, roughness: 0.9 }));
  under.rotation.x = Math.PI / 2;
  under.scale.set(1, 0.95, 1);
  under.position.set(0, roofY + 0.02, -0.17);
  body.add(under);
  // cream rosette and almond on the crown
  const rosette = creamHeap(creamMat, 0.1, 0.12, 2);
  rosette.position.set(0, roofY + 0.33, -0.17);
  body.add(rosette);
  const almond = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshStandardMaterial({ color: 0xc08a52, roughness: 0.6 }));
  almond.scale.set(0.7, 0.5, 1.4);
  almond.position.set(0, roofY + 0.47, -0.17);
  body.add(almond);
  if (flag) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.36, 6), chromeMat);
    pole.position.set(0.14, roofY + 0.48, -0.3);
    body.add(pole);
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.125), new THREE.MeshStandardMaterial({ map: swedishFlagTexture(), side: THREE.DoubleSide, roughness: 0.8 }));
    cloth.position.set(0.14, roofY + 0.59, -0.4);
    cloth.rotation.y = Math.PI / 2;
    body.add(cloth);
  }

  // --- Lamps, plates and bumpers, stuck onto the bun by casting rays at it.
  const ray = new THREE.Raycaster();
  const onBody = (x, y, z, dir) => {
    dir.normalize();
    ray.set(new THREE.Vector3(x, y, z).addScaledVector(dir, -3), dir);
    const hit = ray.intersectObject(tub)[0];
    return hit ? { p: hit.point, n: hit.face.normal.clone() } : { p: new THREE.Vector3(x, y, z), n: dir.clone().negate() };
  };
  const stick = (mesh, hit, out = 0.004) => {
    mesh.position.copy(hit.p).addScaledVector(hit.n, out);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), hit.n);
    body.add(mesh);
  };
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4c8, emissiveIntensity: 0.6, roughness: 0.1 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xd01515, emissive: 0x700000, roughness: 0.2 });
  const tailLights = [];
  for (const side of [-1, 1]) {
    const lamp = new THREE.Group();
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.016, 8, 20), chromeMat);
    const glass = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 10), lampMat);
    glass.scale.z = 0.4;
    lamp.add(bezel, glass);
    stick(lamp, onBody(side * 0.27, 0.5, 0, new THREE.Vector3(0, 0, -1)), 0.01);
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), lightMat);
    tail.scale.z = 0.45;
    stick(tail, onBody(side * 0.28, 0.5, 0, new THREE.Vector3(0, 0, 1)), 0.005);
    tailLights.push(tail);
  }
  const plateMat = new THREE.MeshStandardMaterial({ map: ovalPlateTexture(plate), roughness: 0.4, transparent: true, alphaTest: 0.1 });
  const plateAt = (hit, w) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 2), plateMat);
    stick(m, hit, 0.006);
  };
  plateAt(onBody(0, 0.42, 0, new THREE.Vector3(0, 0, -1)), 0.32); // front
  plateAt(onBody(0, 0.45, 0, new THREE.Vector3(0, 0, 1)), 0.3);   // back
  for (const side of [-1, 1]) plateAt(onBody(0, 0.42, -0.05, new THREE.Vector3(-side, 0, 0)), 0.36);
  for (const z of [1.04, -1.04]) { // curved chrome bumpers
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 8, 24, Math.PI * 0.7), chromeMat);
    arc.rotation.x = Math.PI / 2;
    arc.rotation.z = z > 0 ? Math.PI * 0.15 : Math.PI * 1.15;
    arc.scale.set(1, 0.35, 1);
    arc.position.set(0, 0.24, z * 0.84);
    body.add(arc);
  }
  const exhausts = [];
  for (const side of [-1, 1]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.3, 12, 1, true), chromeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(side * 0.18, 0.15, -0.98);
    body.add(pipe);
    exhausts.push(new THREE.Vector3(side * 0.18, 0.15, -1.15));
  }

  // --- Wheels: black tyres with chrome rims, rear-drive with bigger rears.
  const wheels = [];
  for (const [z, front, r, w] of [[0.66, true, 0.21, 0.2], [-0.64, false, 0.24, 0.25]]) {
    for (const side of [-1, 1]) {
      const wheel = makeWheel(r, w);
      wheel.position.set(side * 0.64, r, z);
      wheel.userData = { front, side, radius: r };
      if (side < 0) wheel.rotation.y = Math.PI;
      const pivot = new THREE.Group();
      pivot.position.copy(wheel.position);
      wheel.position.set(0, 0, 0);
      pivot.add(wheel);
      group.add(pivot);
      wheels.push({ pivot, wheel, front, side, radius: r });
    }
  }

  return {
    group,
    body,
    wheels,
    steering,
    placeWheel,
    column,
    exhausts,
    tailLights,
    seat: { hip: new THREE.Vector3(0, 0.5, -0.28), wheel: new THREE.Vector3(0, 0.8, 0.28) },
    size: { length: 2.1, width: 1.45, height: roofY + 0.5 },
    collisionRadius: 0.95,
  };
}
