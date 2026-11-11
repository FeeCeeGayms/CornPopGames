// The Peepo Beetle, modelled from the reference sheet: a yellow open-top beetle
// with a rounded hood and rear deck, bulging fenders with round headlights and
// tail lights, googly eyes on the hood, a hoop over the windscreen, chrome
// bumpers with overriders, side mirrors and gold hubcaps. Units are metres,
// forward is +Z.
import * as THREE from 'three';
import { cornkartBadgeTexture, plateTexture } from '../textures.js';
import { makeWheel, sweep } from './parts.js';

export function buildBeetleKart({ bodyColor = 0xf5c518, seatColor = 0x1c1c1c, plate = 'PEEPO', badge = true } = {}) {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  const paint = new THREE.MeshPhysicalMaterial({ color: bodyColor, roughness: 0.28, clearcoat: 0.7, clearcoatRoughness: 0.2 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.55 });
  const seatMat = new THREE.MeshStandardMaterial({ color: seatColor, roughness: 0.6 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.15, metalness: 1.0 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd9a933, roughness: 0.25, metalness: 1.0 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf7f7f2, roughness: 0.25 });
  const slatMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(bodyColor).multiplyScalar(0.45), roughness: 0.5 });

  // --- Body tub: the beetle's side profile swept front to back, with a
  // superellipse section. The hood and rear deck are quarter-ellipses, and the
  // middle is scooped out for the open cockpit.
  const L0 = -0.98, L1 = 0.98, bottom = 0.24, deck = 0.74;
  const zAt = (u) => L0 + (L1 - L0) * u;
  const dome = (t) => Math.sqrt(Math.max(0, 1 - t * t));
  const topAt = (u) => {
    const z = zAt(u);
    if (z > 0.3) return 0.42 + (deck - 0.42) * dome((z - 0.3) / 0.7);    // hood
    if (z < -0.4) return 0.42 + (deck - 0.42) * dome((-0.4 - z) / 0.62); // rear deck
    return deck;
  };
  const halfW = (u) => {
    const e = Math.abs(2 * u - 1);
    return 0.4 * Math.pow(Math.max(0, 1 - Math.pow(e, 5)), 0.3);
  };
  const cockpit = (u) => {
    const z = zAt(u), c = -0.08, w = 0.4;
    const x = Math.abs(z - c) / w;
    return x >= 1 ? 0 : Math.pow(1 - Math.pow(x, 4), 0.5);
  };
  const N = 64;
  const pts = [];
  for (let i = 0; i <= N; i++) { const u = i / N; pts.push(new THREE.Vector3(0, (bottom + topAt(u)) / 2, zAt(u))); }
  const se = (v, n) => Math.sign(v) * Math.pow(Math.abs(v), 2 / n);
  const tubGeo = sweep(new THREE.CatmullRomCurve3(pts), 96, 32, (u, a) => {
    const hh = (topAt(u) - bottom) / 2;
    let x = se(Math.cos(a), 3.0) * halfW(u);
    let y = se(Math.sin(a), 3.0) * hh;
    const k = cockpit(u), sill = hh * 0.1;
    if (k > 0 && y > sill) {
      const t = (y - sill) / (hh - sill);
      y = sill + (y - sill) * (1 - k * 0.95);
      x *= 1 - k * 0.12 * t;
    }
    return [x, y];
  });
  const tub = new THREE.Mesh(tubGeo, paint);
  tub.castShadow = true;
  body.add(tub);

  // --- Fenders: rounded domes over each wheel, a little fuller at the back.
  const fenders = [];
  for (const [z, sx, sy, sz] of [[0.64, 0.16, 0.3, 0.42], [-0.62, 0.18, 0.33, 0.46]]) {
    for (const side of [-1, 1]) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.56), paint);
      f.scale.set(sx, sy, sz);
      f.position.set(side * 0.43, 0.33, z);
      f.castShadow = true;
      body.add(f);
      fenders.push({ side, front: z > 0, c: f.position.clone(), s: new THREE.Vector3(sx, sy, sz) });
    }
  }
  // A point on a fender's surface in direction `d`, and the surface normal there.
  const onFender = (f, d) => {
    const dir = new THREE.Vector3(...d).normalize();
    const p = f.c.clone().add(dir.clone().multiply(f.s));
    const n = new THREE.Vector3(dir.x / f.s.x, dir.y / f.s.y, dir.z / f.s.z).normalize();
    return { p, n };
  };
  // running boards between the fenders
  for (const side of [-1, 1]) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.62), paint);
    board.position.set(side * 0.44, 0.33, 0.0);
    body.add(board);
  }

  // Headlights on the front fenders, tail lights on the rear ones.
  const lensMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4c8, emissiveIntensity: 0.6, roughness: 0.1 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xd01515, emissive: 0x700000, roughness: 0.2 });
  const tailLights = [];
  const z1 = new THREE.Vector3(0, 0, 1);
  for (const f of fenders) {
    if (f.front) {
      const { p, n } = onFender(f, [0, 0.35, 0.94]);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.016, 8, 20), chromeMat);
      ring.position.copy(p).addScaledVector(n, 0.01);
      ring.quaternion.setFromUnitVectors(z1, n);
      const lens = new THREE.Mesh(new THREE.SphereGeometry(0.068, 16, 10), lensMat);
      lens.scale.z = 0.4;
      lens.position.copy(ring.position);
      lens.quaternion.copy(ring.quaternion);
      body.add(ring, lens);
    } else {
      const { p, n } = onFender(f, [f.side * 0.25, 0.42, -0.88]);
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), lightMat);
      l.scale.set(0.85, 1.15, 0.45);
      l.position.copy(p).addScaledVector(n, 0.005);
      l.quaternion.setFromUnitVectors(z1, n);
      body.add(l);
      tailLights.push(l);
    }
  }

  // Cast rays at the tub to stick details onto its curved surface.
  tub.updateMatrixWorld(true);
  const ray = new THREE.Raycaster();
  const onBody = (origin, dir) => {
    dir = new THREE.Vector3(...dir).normalize();
    ray.set(new THREE.Vector3(...origin).addScaledVector(dir, -3), dir);
    const hit = ray.intersectObject(tub)[0];
    return hit ? { p: hit.point, n: hit.face.normal.clone() } : null;
  };

  // --- Googly eyes on the hood.
  for (const side of [-1, 1]) {
    const h = onBody([side * 0.135, 0.62, 0.8], [0, -0.45, -0.89]);
    if (!h) continue;
    const { p, n } = h;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.125, 20, 14), whiteMat);
    eye.scale.set(0.85, 1.12, 0.5);
    eye.position.copy(p).addScaledVector(n, 0.025);
    eye.quaternion.setFromUnitVectors(z1, n);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.058, 14, 10), blackMat);
    pupil.scale.set(0.9, 1.2, 0.5);
    pupil.position.copy(p).addScaledVector(n, 0.082).add(new THREE.Vector3(-side * 0.012, 0.01, 0));
    pupil.quaternion.copy(eye.quaternion);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), whiteMat);
    glint.position.copy(pupil.position).addScaledVector(n, 0.02).add(new THREE.Vector3(0.012, 0.022, 0));
    body.add(eye, pupil, glint);
  }

  // --- Engine-lid louvres on the rear deck.
  for (let k = 0; k < 6; k++) {
    const h = onBody([0, 0, -0.66 - k * 0.04], [0, -1, 0]);
    if (!h) continue;
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 0.016), slatMat);
    slat.position.copy(h.p).addScaledVector(h.n, 0.004);
    slat.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), h.n);
    body.add(slat);
  }

  // --- Cockpit: floor, black bucket seat, dash and steering wheel.
  const floor = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.04, 0.84), blackMat);
  floor.position.set(0, 0.29, -0.06);
  body.add(floor);
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.1, 0.38, 2, 1, 2), seatMat);
  cushion.position.set(0, 0.37, -0.24);
  const back = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.24, 6, 12), seatMat);
  back.scale.set(1.15, 1, 0.42);
  back.position.set(0, 0.62, -0.42);
  back.rotation.x = -0.22;
  body.add(cushion, back);
  const dash = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.1, 0.08), blackMat);
  dash.position.set(0, 0.66, 0.31);
  body.add(dash);

  const steering = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.022, 8, 28), blackMat);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 12), chromeMat);
  hub.rotation.x = Math.PI / 2;
  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.012), blackMat);
    spoke.position.x = 0.07;
    const holder = new THREE.Group();
    holder.rotation.z = Math.PI / 2 + i * (Math.PI * 2 / 3);
    holder.add(spoke);
    steering.add(holder);
  }
  steering.add(rim, hub);
  steering.position.set(0, 0.74, 0.12);
  body.add(steering);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 8), blackMat);
  body.add(column);
  const columnBase = new THREE.Vector3(0, 0.56, 0.42);
  const placeWheel = (p) => {
    steering.position.copy(p);
    const dir = new THREE.Vector3().subVectors(p, columnBase);
    column.scale.y = dir.length();
    column.position.copy(columnBase).addScaledVector(dir, 0.5);
    column.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    steering.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().negate());
  };
  placeWheel(steering.position.clone());

  // --- Windscreen hoop in body colour, and side mirrors on stalks.
  const hoopPts = [[-0.37, 0.66, 0.34], [-0.37, 0.92, 0.29], [-0.3, 1.03, 0.26], [0, 1.06, 0.25], [0.3, 1.03, 0.26], [0.37, 0.92, 0.29], [0.37, 0.66, 0.34]]
    .map((p) => new THREE.Vector3(...p));
  const hoop = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hoopPts), 40, 0.03, 10), paint);
  hoop.castShadow = true;
  body.add(hoop);
  for (const side of [-1, 1]) {
    const a = new THREE.Vector3(side * 0.36, 0.72, 0.36), b = new THREE.Vector3(side * 0.5, 0.86, 0.36);
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, a.distanceTo(b), 6), chromeMat);
    stalk.position.copy(a).add(b).multiplyScalar(0.5);
    stalk.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    const mirror = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 14), chromeMat);
    mirror.rotation.x = Math.PI / 2;
    mirror.position.copy(b).add(new THREE.Vector3(side * 0.02, 0.03, 0));
    body.add(stalk, mirror);
  }

  // --- Chrome bumpers with overriders, front and back.
  for (const end of [1, -1]) {
    const zb = end * 1.08;
    const bp = [[-0.56, 0.3, end * 0.9], [-0.5, 0.3, zb - end * 0.04], [0, 0.3, zb], [0.5, 0.3, zb - end * 0.04], [0.56, 0.3, end * 0.9]]
      .map((p) => new THREE.Vector3(...p));
    body.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bp), 30, 0.03, 8), chromeMat));
    for (const side of [-1, 1]) {
      const guard = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.14, 4, 8), chromeMat);
      guard.position.set(side * 0.24, 0.35, zb + end * 0.005);
      const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 6), chromeMat);
      mount.rotation.x = Math.PI / 2;
      mount.position.set(side * 0.3, 0.3, zb - end * 0.08);
      body.add(guard, mount);
    }
  }

  // --- Badges in place of the toy maker's logo, and a number plate.
  if (badge) {
    const badgeMat = new THREE.MeshStandardMaterial({ map: cornkartBadgeTexture(), roughness: 0.4, transparent: true, alphaTest: 0.1 });
    const stick = (h, w) => {
      if (!h) return;
      const b = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.75), badgeMat);
      b.position.copy(h.p).addScaledVector(h.n, 0.006);
      b.quaternion.setFromUnitVectors(z1, h.n);
      body.add(b);
    };
    stick(onBody([0, 0.42, 0], [0, -0.2, -1]), 0.2);              // nose
    stick(onBody([0, 0.6, 0], [0, -0.35, 1]), 0.24);              // rear deck
    for (const side of [-1, 1]) stick(onBody([0, 0.48, -0.1], [-side, 0, 0]), 0.2); // doors
  }
  const plateM = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.09), new THREE.MeshStandardMaterial({ map: plateTexture(plate), roughness: 0.5 }));
  plateM.position.set(0, 0.39, -1.09);
  plateM.rotation.y = Math.PI;
  body.add(plateM);

  // --- Go-kart frame under the floor: rails and exhausts.
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.9, 8), blackMat);
    rail.rotation.x = Math.PI / 2;
    rail.position.set(side * 0.3, 0.17, 0);
    body.add(rail);
  }
  const exhausts = [];
  for (const side of [-1, 1]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.3, 12, 1, true), chromeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(side * 0.16, 0.19, -1.0);
    body.add(pipe);
    exhausts.push(new THREE.Vector3(side * 0.16, 0.19, -1.17));
  }

  // --- Wheels: black tyres with gold hubcaps, a touch bigger at the back.
  const wheels = [];
  for (const [z, front, r, w] of [[0.64, true, 0.2, 0.17], [-0.62, false, 0.22, 0.19]]) {
    for (const side of [-1, 1]) {
      const wheel = makeWheel(r, w);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(r * 0.42, 16, 10), goldMat);
      cap.scale.x = 0.35;
      cap.position.x = w * 0.48;
      wheel.add(cap);
      wheel.position.set(side * 0.47, r, z);
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
    seat: { hip: new THREE.Vector3(0, 0.44, -0.22), wheel: new THREE.Vector3(0, 0.74, 0.12) },
    size: { length: 2.16, width: 1.2, height: 1.1 },
    collisionRadius: 0.9,
  };
}
