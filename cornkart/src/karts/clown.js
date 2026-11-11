// The Clown Car, modelled from the reference sheet: a long, low rainbow-striped
// tub that dips at the cockpit and rises to a rounded rear deck, with a white
// clown face on the nose (red ball nose, blue diamond eyes, big smile, orange
// hair puffs and a party hat), red ball lights on the rear corners, a HA-HA!
// plate, quad exhausts and a black bumper frame. Units are metres, forward is +Z.
import * as THREE from 'three';
import { clownBadgeTexture, plateTexture } from '../textures.js';
import { makeWheel, sweep } from './parts.js';

const RAINBOW = [0xf57a1f, 0xf7c51e, 0x4cb848, 0x1f7ad6, 0x7a3fc4, 0xe8262a];

export function buildClownKart({ stripes = RAINBOW, faceColor = 0xfaf6ee, hatColor = 0x3fae3a, hairColor = 0xf26a12, plate = 'HA-HA!' } = {}) {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  const paint = new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.2 });
  const faceMat = new THREE.MeshPhysicalMaterial({ color: faceColor, roughness: 0.3, clearcoat: 0.5 });
  const redMat = new THREE.MeshPhysicalMaterial({ color: 0xd8141c, roughness: 0.2, clearcoat: 0.8 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x2257c8, roughness: 0.35 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.5 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.15, metalness: 1.0 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.75 });
  const hatMat = new THREE.MeshStandardMaterial({ color: hatColor, roughness: 0.4 });
  const z1 = new THREE.Vector3(0, 0, 1);

  // --- Body tub, swept from the tail to just behind the face. The rear deck sits
  // higher than the nose, and the middle is scooped out for the cockpit.
  const L0 = -1.12, L1 = 0.86, bottom = 0.2;
  const zAt = (u) => L0 + (L1 - L0) * u;
  const dome = (t) => Math.sqrt(Math.max(0, 1 - t * t));
  const topAt = (u) => {
    const z = zAt(u);
    if (z > 0.45) return 0.36 + 0.3 * dome((z - 0.45) / 0.45);
    if (z < -0.45) return 0.36 + 0.4 * dome((-0.45 - z) / 0.7);
    return 0.66 + (0.45 - z) / 0.9 * 0.1;
  };
  const halfW = (u) => {
    const e = Math.abs(2 * u - 1);
    return 0.5 * Math.pow(Math.max(0, 1 - Math.pow(e, 5)), 0.28);
  };
  const cockpit = (u) => {
    const x = Math.abs(zAt(u) + 0.02) / 0.5;
    return x >= 1 ? 0 : Math.pow(1 - Math.pow(x, 4), 0.5);
  };
  const N = 64;
  const pts = [];
  for (let i = 0; i <= N; i++) { const u = i / N; pts.push(new THREE.Vector3(0, (bottom + topAt(u)) / 2, zAt(u))); }
  const se = (v, n) => Math.sign(v) * Math.pow(Math.abs(v), 2 / n);
  const inside = []; // per vertex, in sweep order: is it on the cockpit's inner surface?
  const tubGeo = sweep(new THREE.CatmullRomCurve3(pts), 180, 32, (u, a) => {
    const hh = (topAt(u) - bottom) / 2;
    let x = se(Math.cos(a), 3.0) * halfW(u);
    let y = se(Math.sin(a), 3.0) * hh;
    const k = cockpit(u), sill = hh * 0.05;
    inside.push(k > 0.5 && y > sill + (hh - sill) * 0.72);
    if (k > 0 && y > sill) {
      const t = (y - sill) / (hh - sill);
      y = sill + (y - sill) * (1 - k * 0.95);
      x *= 1 - k * 0.1 * t;
    }
    return [x, y];
  });
  // rainbow stripes across the body, front to back
  const pos = tubGeo.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    c.set(inside[i] ? 0x1c1c1c : stripes[Math.floor((1.0 - pos.getZ(i)) / 0.17) % stripes.length]);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  tubGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const tub = new THREE.Mesh(tubGeo, paint);
  tub.castShadow = true;
  body.add(tub);
  tub.updateMatrixWorld(true);
  const ray = new THREE.Raycaster();
  const onBody = (origin, dir) => {
    dir = new THREE.Vector3(...dir).normalize();
    ray.set(new THREE.Vector3(...origin).addScaledVector(dir, -3), dir);
    const hit = ray.intersectObject(tub)[0];
    return hit ? { p: hit.point, n: hit.face.normal.clone() } : null;
  };

  // --- Clown face: a white dome on the nose.
  const fc = new THREE.Vector3(0, 0.52, 0.9), fs = new THREE.Vector3(0.32, 0.3, 0.24);
  const face = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), faceMat);
  face.scale.copy(fs);
  face.position.copy(fc);
  face.castShadow = true;
  body.add(face);
  const onFace = (x, y) => { // the point on the face's front surface at (x, y), with its normal
    const dx = x / fs.x, dy = (y - fc.y) / fs.y;
    const dz = Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy));
    const p = new THREE.Vector3(x, y, fc.z + dz * fs.z);
    const n = new THREE.Vector3(dx / fs.x, dy / fs.y, dz / fs.z).normalize();
    return { p, n };
  };
  const nose = onFace(0, 0.5);
  const noseBall = new THREE.Mesh(new THREE.SphereGeometry(0.075, 18, 12), redMat);
  noseBall.position.copy(nose.p).addScaledVector(nose.n, 0.045);
  body.add(noseBall);
  // blue diamond eyes with a black pupil and a brow above
  const diamond = new THREE.Shape();
  diamond.moveTo(0, 0.085); diamond.lineTo(0.045, 0); diamond.lineTo(0, -0.085); diamond.lineTo(-0.045, 0); diamond.closePath();
  const diamondGeo = new THREE.ShapeGeometry(diamond);
  for (const side of [-1, 1]) {
    const e = onFace(side * 0.12, 0.6);
    const q = new THREE.Quaternion().setFromUnitVectors(z1, e.n);
    const d = new THREE.Mesh(diamondGeo, blueMat);
    d.position.copy(e.p).addScaledVector(e.n, 0.004);
    d.quaternion.copy(q);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), blackMat);
    pupil.scale.z = 0.4;
    pupil.position.copy(e.p).addScaledVector(e.n, 0.008);
    pupil.quaternion.copy(q);
    body.add(d, pupil);
    const brow = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8, b = onFace(side * (0.07 + t * 0.1), 0.7 + Math.sin(t * Math.PI) * 0.03);
      brow.push(b.p.addScaledVector(b.n, 0.006));
    }
    body.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(brow), 10, 0.009, 5), blackMat));
  }
  // big red smile
  const smilePts = [];
  for (let i = 0; i <= 18; i++) {
    const a = Math.PI * (1.08 + 0.84 * i / 18);
    const s = onFace(Math.cos(a) * 0.19, 0.47 + Math.sin(a) * 0.09);
    smilePts.push(s.p.addScaledVector(s.n, 0.012));
  }
  body.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(smilePts), 30, 0.022, 8), redMat));
  // curly orange hair puffs on both sides of the face
  const puff = new THREE.SphereGeometry(1, 12, 8);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2, rr = i === 0 ? 0 : 0.07;
      const b = new THREE.Mesh(puff, hairMat);
      b.scale.setScalar(i === 0 ? 0.08 : 0.055 + (i % 3) * 0.008);
      b.position.set(side * (0.33 + (i === 0 ? 0.02 : 0)), 0.62 + Math.sin(a) * rr, 0.84 + Math.cos(a) * rr);
      body.add(b);
    }
  }
  // party hat: striped cone, a brim and a red pompom
  const hatBase = new THREE.Vector3(0, fc.y + fs.y - 0.04, fc.z - 0.02);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 24), hatMat);
  cone.position.copy(hatBase).add(new THREE.Vector3(0, 0.14, 0));
  const brim = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 8, 24), hatMat);
  brim.rotation.x = Math.PI / 2;
  brim.position.copy(hatBase).add(new THREE.Vector3(0, 0.01, 0));
  for (const [h, r] of [[0.07, 0.092], [0.15, 0.058]]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(r, 0.014, 6, 24), blueMat);
    band.rotation.x = Math.PI / 2;
    band.position.copy(hatBase).add(new THREE.Vector3(0, h, 0));
    body.add(band);
  }
  const pom = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), redMat);
  pom.position.copy(hatBase).add(new THREE.Vector3(0, 0.3, 0));
  body.add(cone, brim, pom);

  // --- Rear: big red ball lights on the deck corners, small purple and orange
  // lamps, the plate and four chrome exhausts.
  const tailLights = [];
  for (const side of [-1, 1]) {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 12), redMat);
    const h = onBody([side * 0.3, 0, -0.88], [0, -1, 0]);
    ball.position.copy(h ? h.p : new THREE.Vector3(side * 0.3, 0.7, -0.88)).add(new THREE.Vector3(0, 0.05, 0));
    body.add(ball);
    for (const [x, color] of [[0.36, 0x8a2bd8], [0.24, 0xf08a1c]]) {
      const r = onBody([side * x, 0.44, 0], [0, 0, 1]);
      if (!r) continue;
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.2 }));
      lamp.scale.z = 0.5;
      lamp.position.copy(r.p).addScaledVector(r.n, 0.004);
      lamp.quaternion.setFromUnitVectors(z1, r.n);
      body.add(lamp);
      if (x > 0.3) tailLights.push(lamp);
    }
  }
  const pr = onBody([0, 0.33, 0], [0, 0, 1]);
  const plateM = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.1), new THREE.MeshStandardMaterial({ map: plateTexture(plate), roughness: 0.5 }));
  plateM.position.copy(pr ? pr.p : new THREE.Vector3(0, 0.33, L0)).addScaledVector(pr ? pr.n : new THREE.Vector3(0, 0, -1), 0.012);
  plateM.quaternion.setFromUnitVectors(z1, pr ? pr.n : new THREE.Vector3(0, 0, -1));
  body.add(plateM);
  const exhausts = [];
  for (const side of [-1, 1]) for (const dx of [-0.045, 0.045]) {
    const x = side * 0.3 + dx;
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.28, 10, 1, true), chromeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(x, 0.22, -1.08);
    body.add(pipe);
    if (dx > 0) exhausts.push(new THREE.Vector3(side * 0.3, 0.22, -1.24));
  }

  // --- "CLOWN KART" stickers on the rear flanks.
  const badgeMat = new THREE.MeshStandardMaterial({ map: clownBadgeTexture(), roughness: 0.4, transparent: true, alphaTest: 0.1 });
  for (const side of [-1, 1]) {
    const h = onBody([0, 0.47, -0.62], [-side, 0, 0]);
    if (!h) continue;
    const b = new THREE.Mesh(new THREE.CircleGeometry(0.12, 24), badgeMat);
    b.position.copy(h.p).addScaledVector(h.n, 0.006);
    b.quaternion.setFromUnitVectors(z1, h.n);
    body.add(b);
  }

  // --- Cockpit: black floor, tall bucket seat, steering wheel.
  const floor = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.04, 0.94), blackMat);
  floor.position.set(0, 0.26, -0.02);
  body.add(floor);
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.1, 0.4, 2, 1, 2), seatMat);
  cushion.position.set(0, 0.33, -0.24);
  const back = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.36, 6, 12), seatMat);
  back.scale.set(1.15, 1, 0.42);
  back.position.set(0, 0.64, -0.46);
  back.rotation.x = -0.3;
  for (const side of [-1, 1]) { // side bolsters
    const bol = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.3, 4, 8), seatMat);
    bol.position.set(side * 0.24, 0.42, -0.24);
    bol.rotation.x = Math.PI / 2;
    body.add(bol);
  }
  body.add(cushion, back);

  const steering = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.024, 8, 28), blackMat);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12), blackMat);
  hub.rotation.x = Math.PI / 2;
  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.022, 0.014), blackMat);
    spoke.position.x = 0.075;
    const holder = new THREE.Group();
    holder.rotation.z = Math.PI / 2 + i * (Math.PI * 2 / 3);
    holder.add(spoke);
    steering.add(holder);
  }
  steering.add(rim, hub);
  steering.position.set(0, 0.68, 0.2);
  body.add(steering);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1, 8), blackMat);
  body.add(column);
  const columnBase = new THREE.Vector3(0, 0.42, 0.55);
  const placeWheel = (p) => {
    steering.position.copy(p);
    const dir = new THREE.Vector3().subVectors(p, columnBase);
    column.scale.y = dir.length();
    column.position.copy(columnBase).addScaledVector(dir, 0.5);
    column.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    steering.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().negate());
  };
  placeWheel(steering.position.clone());

  // --- Black bumper frame: a hoop round the nose and the tail, joined by side rails.
  const tube = (p, r = 0.035) => body.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p.map((v) => new THREE.Vector3(...v))), 36, r, 8), blackMat));
  tube([[-0.56, 0.19, 0.98], [-0.5, 0.19, 1.14], [-0.28, 0.19, 1.24], [0, 0.19, 1.27], [0.28, 0.19, 1.24], [0.5, 0.19, 1.14], [0.56, 0.19, 0.98]]);
  tube([[-0.56, 0.21, -0.98], [-0.5, 0.21, -1.12], [-0.28, 0.21, -1.2], [0, 0.21, -1.22], [0.28, 0.21, -1.2], [0.5, 0.21, -1.12], [0.56, 0.21, -0.98]]);
  for (const side of [-1, 1]) tube([[side * 0.5, 0.17, 0.58], [side * 0.53, 0.16, 0], [side * 0.5, 0.17, -0.58]], 0.03);

  // --- Wheels: black tyres on grey rims, wheelbase 1.6 m.
  const wheels = [];
  for (const [z, front, r, w] of [[0.8, true, 0.19, 0.18], [-0.8, false, 0.21, 0.2]]) {
    for (const side of [-1, 1]) {
      const wheel = makeWheel(r, w);
      wheel.position.set(side * 0.53, r, z);
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
    seat: { hip: new THREE.Vector3(0, 0.4, -0.2), wheel: new THREE.Vector3(0, 0.68, 0.2) },
    size: { length: 2.5, width: 1.2, height: 0.9 },
    collisionRadius: 1.0,
  };
}
