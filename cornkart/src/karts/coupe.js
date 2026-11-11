// The Cozy Coupe kart, modelled from the reference sheet: a rounded red tub with
// a smiling face and googly eyes, a yellow roof on two thin front posts and two
// wide rear pillars, open doorways, and a black go-kart frame with exhausts
// under the back. Units are metres, forward is +Z.
import * as THREE from 'three';
import { cornkartBadgeTexture, plateTexture } from '../textures.js';
import { makeWheel, sweep } from './parts.js';

export function buildCoupeKart({ bodyColor = 0xd42a1c, roofColor = 0xf5c21b, plate = 'COZY', badge = true } = {}) {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  const paint = new THREE.MeshPhysicalMaterial({ color: bodyColor, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const roofMat = new THREE.MeshPhysicalMaterial({ color: roofColor, roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  const darkPaint = new THREE.MeshStandardMaterial({ color: new THREE.Color(bodyColor).multiplyScalar(0.55), roughness: 0.5 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.55 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.18, metalness: 1.0 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf7f7f2, roughness: 0.25 });

  // --- Tub: a straight sweep front to back with a soft superellipse section.
  // The middle is scooped out for the cockpit, leaving low door sills.
  const L0 = -0.98, L1 = 1.0;
  const zAt = (u) => L0 + (L1 - L0) * u;
  const bottom = 0.2;
  const topAt = (u) => { // body top line along the length (side view)
    const z = zAt(u);
    if (z < -0.55) return 0.82 - Math.pow((-0.55 - z) / 0.43, 2) * 0.16; // rounded rear deck
    if (z > 0.45) return 0.76 - Math.pow((z - 0.45) / 0.55, 2) * 0.24;  // nose falls away
    return 0.82 - (z + 0.55) * 0.06;
  };
  const halfW = (u) => {
    const e = Math.abs(2 * u - 1);
    return 0.5 * Math.pow(Math.max(0, 1 - Math.pow(e, 6)), 0.32);
  };
  const cockpit = (u) => { // how much of the top is carved away
    const z = zAt(u), c = -0.08, w = 0.42;
    const x = Math.abs(z - c) / w;
    return x >= 1 ? 0 : Math.pow(1 - Math.pow(x, 4), 0.5);
  };
  const N = 60;
  const pts = [];
  for (let i = 0; i <= N; i++) { const u = i / N; pts.push(new THREE.Vector3(0, (bottom + topAt(u)) / 2, zAt(u))); }
  const line = new THREE.CatmullRomCurve3(pts);
  const se = (v, n) => Math.sign(v) * Math.pow(Math.abs(v), 2 / n);
  const tubGeo = sweep(line, 90, 32, (u, a) => {
    const hh = (topAt(u) - bottom) / 2;
    const w = halfW(u);
    let x = se(Math.cos(a), 3.2) * w;
    let y = se(Math.sin(a), 3.2) * hh;
    const k = cockpit(u);
    const sill = hh * 0.05; // door sill height above the centre line
    if (k > 0 && y > sill) {
      // inside the cockpit: fold the top surface down into a tub
      const t = (y - sill) / (hh - sill);
      y = sill + (y - sill) * (1 - k * 0.95);
      x *= 1 - k * 0.12 * t;
    }
    return [x, y];
  });
  const tub = new THREE.Mesh(tubGeo, paint);
  tub.castShadow = true;
  body.add(tub);

  // Wheel-arch bulges over each wheel, in the darker shade of the body.
  for (const z of [-0.62, 0.68]) for (const side of [-1, 1]) {
    const arch = new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), paint);
    arch.scale.set(0.45, 0.9, 1.05);
    arch.position.set(side * 0.43, 0.42, z);
    body.add(arch);
  }
  // Moulded door line on each side.
  for (const side of [-1, 1]) {
    const curve = new THREE.EllipseCurve(0, 0, 0.32, 0.17, Math.PI, Math.PI * 2, false);
    const p2 = curve.getPoints(20).map((p) => new THREE.Vector3(side * 0.505, 0.5 + p.y, -0.08 + p.x));
    const door = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p2), 20, 0.012, 6), darkPaint);
    body.add(door);
  }

  // --- Cockpit: floor, red seat, steering wheel.
  const floor = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.9), blackMat);
  floor.position.set(0, 0.3, -0.05);
  body.add(floor);
  const seatMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(bodyColor).multiplyScalar(0.8), roughness: 0.45 });
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.42, 2, 1, 2), seatMat);
  cushion.position.set(0, 0.4, -0.3);
  const back = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.26, 6, 12), seatMat);
  back.scale.set(1.15, 1, 0.4);
  back.position.set(0, 0.66, -0.5);
  back.rotation.x = -0.18;
  body.add(cushion, back);

  const steering = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.024, 8, 28), blackMat);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12), blackMat);
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

  // --- Yellow roof: thin front posts, wide rear pillars, a rounded roof ring.
  const roofY = 1.58;
  for (const side of [-1, 1]) {
    const a = new THREE.Vector3(side * 0.4, 0.74, 0.36), b = new THREE.Vector3(side * 0.36, roofY, 0.2);
    const post = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, a.distanceTo(b), 4, 10), roofMat);
    post.position.copy(a).add(b).multiplyScalar(0.5);
    post.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    post.castShadow = true;
    body.add(post);
    // rear pillar: a wide, rounded slab from the deck up to the roof
    const prof = new THREE.Shape();
    prof.moveTo(-0.78, 0.78);
    prof.lineTo(-0.5, 0.78);
    prof.bezierCurveTo(-0.46, 1.1, -0.42, 1.35, -0.36, roofY - 0.02);
    prof.lineTo(-0.66, roofY - 0.02);
    prof.bezierCurveTo(-0.72, 1.3, -0.76, 1.05, -0.78, 0.78);
    const pg = new THREE.ExtrudeGeometry(prof, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 4, curveSegments: 12 });
    pg.rotateY(-Math.PI / 2); // shape X -> kart Z
    pg.translate(side > 0 ? 0.42 : -0.32, 0, 0);
    pg.computeVertexNormals();
    const pillar = new THREE.Mesh(pg, roofMat);
    pillar.castShadow = true;
    body.add(pillar);
  }
  const roofShape = new THREE.Shape();
  const rr = (s, x0, z0, x1, z1, r) => {
    s.moveTo(x0 + r, z0); s.lineTo(x1 - r, z0); s.quadraticCurveTo(x1, z0, x1, z0 + r);
    s.lineTo(x1, z1 - r); s.quadraticCurveTo(x1, z1, x1 - r, z1); s.lineTo(x0 + r, z1);
    s.quadraticCurveTo(x0, z1, x0, z1 - r); s.lineTo(x0, z0 + r); s.quadraticCurveTo(x0, z0, x0 + r, z0);
  };
  rr(roofShape, -0.5, -0.74, 0.5, 0.3, 0.22);
  const hole = new THREE.Path();
  rr(hole, -0.3, -0.34, 0.3, 0.12, 0.12);
  roofShape.holes.push(hole);
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 4, curveSegments: 10 });
  roofGeo.rotateX(Math.PI / 2);
  roofGeo.translate(0, roofY + 0.06, 0);
  roofGeo.computeVertexNormals();
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.castShadow = true;
  body.add(roof);

  // --- Face: googly eyes, a big smile, round headlights, all stuck onto the
  // nose by casting rays at the tub.
  tub.updateMatrixWorld(true);
  const ray = new THREE.Raycaster();
  const onNose = (x, y, dir = new THREE.Vector3(0, 0, -1)) => {
    ray.set(new THREE.Vector3(x, y, 0).addScaledVector(dir, -3), dir);
    const hit = ray.intersectObject(tub)[0];
    return hit ? { p: hit.point, n: hit.face.normal.clone() } : { p: new THREE.Vector3(x, y, 0.9), n: new THREE.Vector3(0, 0, 1) };
  };
  for (const side of [-1, 1]) {
    const { p, n } = onNose(side * 0.12, 0.64);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 18, 12), whiteMat);
    eye.scale.set(0.9, 1.15, 0.7);
    eye.position.copy(p).addScaledVector(n, 0.03);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), blackMat);
    pupil.position.copy(p).addScaledVector(n, 0.095).add(new THREE.Vector3(-side * 0.012, -0.02, 0));
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.013, 6, 4), whiteMat);
    glint.position.copy(pupil.position).add(new THREE.Vector3(0.016, 0.02, 0.04));
    body.add(eye, pupil, glint);
    const h = onNose(side * 0.3, 0.5, new THREE.Vector3(-side * 0.6, 0, -0.8).normalize());
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4c8, emissiveIntensity: 0.6, roughness: 0.1 }));
    lamp.scale.z = 0.45;
    lamp.position.copy(h.p).addScaledVector(h.n, 0.005);
    lamp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), h.n);
    body.add(lamp);
  }
  const smilePts = [];
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI * (1.12 + 0.76 * i / 16);
    const { p, n } = onNose(Math.cos(a) * 0.15, 0.47 + Math.sin(a) * 0.06);
    smilePts.push(p.addScaledVector(n, 0.012));
  }
  const smile = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(smilePts), 24, 0.017, 6), blackMat);
  body.add(smile);
  const t = onNose(0, 0.395);
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 6), new THREE.MeshStandardMaterial({ color: 0xff7a8a, roughness: 0.5 }));
  tongue.scale.set(1.2, 0.5, 0.4);
  tongue.position.copy(t.p).addScaledVector(t.n, 0.004);
  body.add(tongue);

  // --- Badges in place of the toy maker's logo, tail lights and number plate.
  if (badge) {
    const badgeMat = new THREE.MeshStandardMaterial({ map: cornkartBadgeTexture(), roughness: 0.4, transparent: true, alphaTest: 0.1 });
    for (const side of [-1, 1]) {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.18), badgeMat);
      b.position.set(side * 0.47, 0.6, -0.62);
      b.rotation.y = side * Math.PI / 2;
      body.add(b);
    }
    const rearBadge = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.195), badgeMat);
    rearBadge.position.set(0, 0.6, L0 - 0.005);
    rearBadge.rotation.y = Math.PI;
    body.add(rearBadge);
  }
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xd01515, emissive: 0x700000, roughness: 0.2 });
  const tailLights = [];
  for (const side of [-1, 1]) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), lightMat);
    l.scale.z = 0.45;
    l.position.set(side * 0.3, 0.6, L0 + 0.03);
    body.add(l);
    tailLights.push(l);
  }
  const plateM = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.1), new THREE.MeshStandardMaterial({ map: plateTexture(plate), roughness: 0.5 }));
  plateM.position.set(0, 0.36, L0 + 0.02);
  plateM.rotation.y = Math.PI;
  body.add(plateM);

  // --- Go-kart frame under the back: rails, bumper bar, exhausts.
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.1, 8), blackMat);
    rail.rotation.x = Math.PI / 2;
    rail.position.set(side * 0.32, 0.16, -0.05);
    body.add(rail);
  }
  const bumper = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 10), blackMat);
  bumper.rotation.z = Math.PI / 2;
  bumper.position.set(0, 0.17, -1.1);
  body.add(bumper);
  const exhausts = [];
  for (const side of [-1, 1]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.36, 12, 1, true), chromeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(side * 0.2, 0.13, -1.0);
    body.add(pipe);
    exhausts.push(new THREE.Vector3(side * 0.2, 0.13, -1.2));
  }

  // --- Wheels: black tyres with silver hubcaps, rear-drive with bigger rears.
  const wheels = [];
  for (const [z, front, r, w] of [[0.68, true, 0.2, 0.2], [-0.62, false, 0.235, 0.25]]) {
    for (const side of [-1, 1]) {
      const wheel = makeWheel(r, w);
      wheel.position.set(side * 0.62, r, z);
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
    size: { length: 2.1, width: 1.4, height: roofY + 0.1 },
    collisionRadius: 0.95,
  };
}
