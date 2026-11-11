// The hotdog kart, modelled from the reference sheet: an orange sausage lying in a
// yellow bun chassis, single seat carved into the middle, rear-drive with chrome
// exhaust, tail lights and a "YUMMY" plate. Units are metres, forward is +Z.
import * as THREE from 'three';
import { cornkartBadgeTexture, plateTexture } from '../textures.js';
import { makeWheel, sweep } from './parts.js';

export function buildHotdogKart({ sausageColor = 0xe2581c, bunColor = 0xf3b21f, badge = true } = {}) {
  const group = new THREE.Group();
  const body = new THREE.Group(); // tilts and bounces; wheels stay on the ground
  group.add(body);

  const sausageMat = new THREE.MeshStandardMaterial({ color: sausageColor, roughness: 0.32, metalness: 0.05 });
  const bunMat = new THREE.MeshStandardMaterial({ color: bunColor, roughness: 0.38, metalness: 0.05 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.6 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.18, metalness: 1.0 });

  // --- Sausage: a curved tube whose middle is scooped out for the cockpit.
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.80, -1.12),
    new THREE.Vector3(0, 0.74, -0.75),
    new THREE.Vector3(0, 0.55, -0.30),
    new THREE.Vector3(0, 0.50, 0.15),
    new THREE.Vector3(0, 0.56, 0.60),
    new THREE.Vector3(0, 0.64, 0.95),
    new THREE.Vector3(0, 0.68, 1.12),
  ]);
  const cockpit = (u) => { // 0..1 along the sausage -> how much the top is carved away
    const c = 0.47, w = 0.17;
    const x = Math.abs(u - c) / w;
    return x >= 1 ? 0 : Math.pow(1 - x * x, 0.6);
  };
  const radius = (u) => {
    const base = u < 0.5 ? 0.36 : 0.31; // rear end is fatter, like the sheet
    const e = Math.abs(2 * u - 1);
    return base * Math.pow(Math.max(0, 1 - Math.pow(e, 7)), 0.5);
  };
  const sausageGeo = sweep(path, 120, 28, (u, ang) => {
    const r = radius(u);
    let x = Math.cos(ang) * r * 0.95;
    let y = Math.sin(ang) * r;
    const k = cockpit(u);
    if (k > 0 && y > -r * 0.2) y = -r * 0.2 + (y + r * 0.2) * (1 - k * 1.05); // carve a trough
    return [x, y];
  });
  const sausage = new THREE.Mesh(sausageGeo, sausageMat);
  sausage.castShadow = true;
  body.add(sausage);

  // Crimped ends: a small darker star where the casing ties off.
  const crimpMat = new THREE.MeshStandardMaterial({ color: 0xa83a10, roughness: 0.5 });
  for (const [z, y] of [[-1.13, 0.80], [1.13, 0.68]]) {
    const crimp = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.05, 6), crimpMat);
    crimp.position.set(0, y, z);
    crimp.rotation.x = z > 0 ? Math.PI / 2 : -Math.PI / 2;
    body.add(crimp);
  }

  // Yellow band behind the seat, carrying the badge.
  const bandGeo = sweep(path, 10, 28, (u, ang) => {
    const r = radius(u) + 0.018;
    return [Math.cos(ang) * r * 0.95, Math.sin(ang) * r];
  }, 0.255, 0.335);
  const band = new THREE.Mesh(bandGeo, bunMat);
  band.castShadow = true;
  body.add(band);
  if (badge) {
    const badgeMat = new THREE.MeshStandardMaterial({ map: cornkartBadgeTexture(), roughness: 0.4, transparent: true, alphaTest: 0.1 });
    const p = path.getPoint(0.295);
    for (const side of [-1, 1]) {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 0.225), badgeMat);
      b.position.set(side * (radius(0.295) * 0.95 + 0.03), p.y + 0.02, p.z);
      b.rotation.y = side * Math.PI / 2;
      body.add(b);
    }
  }

  // --- Bun chassis: side profile extruded across the width with soft bevels.
  const prof = new THREE.Shape();
  prof.moveTo(-1.08, 0.20);
  prof.bezierCurveTo(-1.22, 0.24, -1.24, 0.44, -1.10, 0.50);
  prof.bezierCurveTo(-0.80, 0.50, -0.55, 0.40, -0.20, 0.38);
  prof.bezierCurveTo(0.20, 0.36, 0.55, 0.40, 0.85, 0.46);
  prof.bezierCurveTo(1.12, 0.50, 1.20, 0.34, 1.05, 0.22);
  prof.bezierCurveTo(0.80, 0.14, -0.80, 0.14, -1.08, 0.20);
  const bunGeo = new THREE.ExtrudeGeometry(prof, { depth: 0.62, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.07, bevelSegments: 6, curveSegments: 24 });
  bunGeo.translate(0, 0, -0.31);
  bunGeo.rotateY(-Math.PI / 2); // shape X -> kart Z
  bunGeo.computeVertexNormals();
  const bun = new THREE.Mesh(bunGeo, bunMat);
  bun.castShadow = true;
  body.add(bun);

  // Wheel arches / side pods bulging over each wheel.
  for (const z of [-0.78, 0.78]) for (const side of [-1, 1]) {
    const pod = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 12), bunMat);
    pod.scale.set(0.55, 0.55, 1.15);
    pod.position.set(side * 0.40, 0.36, z);
    pod.castShadow = true;
    body.add(pod);
  }

  // Front grille slot.
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.04), blackMat);
  grille.position.set(0, 0.27, 1.17);
  body.add(grille);

  // --- Cockpit: floor, seat, steering wheel.
  const floor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.9), blackMat);
  floor.position.set(0, 0.36, 0.0);
  body.add(floor);

  const seat = new THREE.Group();
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.35, metalness: 0.1 });
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.10, 0.42, 2, 1, 2), seatMat);
  cushion.position.set(0, 0.42, -0.24);
  const back = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.30, 6, 12), seatMat);
  back.scale.set(1.15, 1, 0.38);
  back.position.set(0, 0.70, -0.46);
  back.rotation.x = -0.22;
  seat.add(cushion, back);
  for (const side of [-1, 1]) { // bolsters
    const bol = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.38, 4, 8), seatMat);
    bol.position.set(side * 0.22, 0.64, -0.42);
    bol.rotation.x = -0.25;
    seat.add(bol);
  }
  seat.traverse((o) => { o.castShadow = true; });
  body.add(seat);

  const steering = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.022, 8, 28), blackMat);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 12), chromeMat);
  hub.rotation.x = Math.PI / 2;
  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.018, 0.012), chromeMat);
    spoke.position.x = 0.075;
    const holder = new THREE.Group();
    holder.rotation.z = Math.PI / 2 + i * (Math.PI * 2 / 3);
    holder.add(spoke);
    steering.add(holder);
  }
  steering.add(rim, hub);
  steering.position.set(0, 0.80, 0.25);
  steering.rotation.x = -0.75;
  body.add(steering);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 8), chromeMat);
  body.add(column);
  const columnBase = new THREE.Vector3(0, 0.46, 0.62);
  // Drivers come in all sizes, so the wheel moves to where their hands are.
  const placeWheel = (p) => {
    steering.position.copy(p);
    const dir = new THREE.Vector3().subVectors(p, columnBase);
    column.scale.y = dir.length();
    column.position.copy(columnBase).addScaledVector(dir, 0.5);
    column.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    steering.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().negate());
  };
  placeWheel(steering.position.clone());

  // --- Rear end: bumper, exhausts, engine, lights, plate.
  const bumper = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 10), chromeMat);
  bumper.rotation.z = Math.PI / 2;
  bumper.position.set(0, 0.17, -1.24);
  body.add(bumper);
  for (const side of [-1, 1]) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.14, 8), chromeMat);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(side * 0.3, 0.17, -1.17);
    body.add(bar);
  }
  const exhausts = [];
  for (const side of [-1, 1]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.5, 12, 1, true), chromeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(side * 0.30, 0.12, -1.0);
    body.add(pipe);
    exhausts.push(new THREE.Vector3(side * 0.30, 0.12, -1.27));
  }
  // engine block poking out at the back right, as on the side views
  const engine = new THREE.Group();
  const block = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.16, 16), chromeMat);
  block.rotation.z = Math.PI / 2;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16), new THREE.MeshStandardMaterial({ color: 0xc01010, emissive: 0x400000, roughness: 0.3 }));
  cap.rotation.z = Math.PI / 2;
  cap.position.x = 0.09;
  engine.add(block, cap);
  engine.position.set(0.42, 0.34, -1.02);
  body.add(engine);

  const lightMat = new THREE.MeshStandardMaterial({ color: 0xd01515, emissive: 0x700000, roughness: 0.2 });
  const tailLights = [];
  for (const side of [-1, 1]) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), lightMat);
    l.scale.z = 0.5;
    l.position.set(side * 0.30, 0.38, -1.21);
    body.add(l);
    tailLights.push(l);
  }
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 0.11), new THREE.MeshStandardMaterial({ map: plateTexture('YUMMY'), roughness: 0.5 }));
  plate.position.set(0, 0.30, -1.255);
  plate.rotation.y = Math.PI;
  body.add(plate);

  // --- Wheels (rear-drive, chunkier rear tyres).
  const wheels = [];
  for (const [z, front, r, w] of [[0.80, true, 0.21, 0.22], [-0.80, false, 0.235, 0.27]]) {
    for (const side of [-1, 1]) {
      const wheel = makeWheel(r, w);
      wheel.position.set(side * 0.58, r, z);
      wheel.userData = { front, side, radius: r };
      if (side < 0) wheel.rotation.y = Math.PI;
      const pivot = new THREE.Group(); // steering pivot
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
    // Where the driver's hips sit, and how much room is above the seat.
    seat: { hip: new THREE.Vector3(0, 0.50, -0.26), wheel: new THREE.Vector3(0, 0.80, 0.25) },
    size: { length: 2.45, width: 1.35, height: 1.1 },
    collisionRadius: 1.0,
  };
}
