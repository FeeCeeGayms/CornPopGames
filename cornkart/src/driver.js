// Turns a standing, rigged humanoid (glTF) into a kart driver: bends it into a
// seated pose, fits it to the kart's seat and blends the arms as it steers.
// Works with any humanoid whose bones use common names (Mixamo, Meshy, VRM-ish).
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

const ALIASES = {
  hips: ['hips', 'pelvis'],
  chest: ['chest', 'spine1', 'spine_02', 'spine'],
  upperChest: ['upperchest', 'spine2', 'spine_03'],
  neck: ['neck'],
  head: ['head'],
  lUpperArm: ['leftupperarm', 'leftarm', 'upperarm_l'],
  lLowerArm: ['leftlowerarm', 'leftforearm', 'lowerarm_l'],
  lHand: ['lefthand', 'hand_l'],
  rUpperArm: ['rightupperarm', 'rightarm', 'upperarm_r'],
  rLowerArm: ['rightlowerarm', 'rightforearm', 'lowerarm_r'],
  rHand: ['righthand', 'hand_r'],
  lUpperLeg: ['leftupperleg', 'leftupleg', 'thigh_l'],
  lLowerLeg: ['leftlowerleg', 'leftleg', 'calf_l'],
  lFoot: ['leftfoot', 'foot_l'],
  lToes: ['lefttoes', 'lefttoebase', 'ball_l'],
  rUpperLeg: ['rightupperleg', 'rightupleg', 'thigh_r'],
  rLowerLeg: ['rightlowerleg', 'rightleg', 'calf_r'],
  rFoot: ['rightfoot', 'foot_r'],
  rToes: ['righttoes', 'righttoebase', 'ball_r'],
};

function findBones(root) {
  const byName = new Map();
  root.traverse((o) => {
    if (o.isBone || o.type === 'Object3D' || o.isObject3D) {
      const n = o.name.toLowerCase().replace(/^mixamorig[:_]?/, '').replace(/[^a-z0-9_]/g, '');
      if (!byName.has(n)) byName.set(n, o);
    }
  });
  const bones = {};
  for (const [key, names] of Object.entries(ALIASES)) {
    for (const n of names) if (byName.has(n)) { bones[key] = byName.get(n); break; }
  }
  return bones;
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3();
const _q = new THREE.Quaternion(), _qp = new THREE.Quaternion(), _qw = new THREE.Quaternion();

// Rotate `bone` (in world space) so that the direction towards `child` matches `dir`.
function aim(root, bone, child, dir) {
  if (!bone || !child) return;
  root.updateMatrixWorld(true);
  bone.getWorldPosition(_a);
  child.getWorldPosition(_b);
  const cur = _b.sub(_a).normalize();
  _q.setFromUnitVectors(cur, dir.clone().normalize());
  bone.getWorldQuaternion(_qw);
  bone.parent.getWorldQuaternion(_qp);
  bone.quaternion.copy(_qp.invert().multiply(_q.multiply(_qw)));
  root.updateMatrixWorld(true);
}

function snapshot(bones) {
  const s = {};
  for (const [k, b] of Object.entries(bones)) s[k] = b.quaternion.clone();
  return s;
}
function restore(bones, snap) {
  for (const [k, b] of Object.entries(bones)) b.quaternion.copy(snap[k]);
}

const V = (x, y, z) => new THREE.Vector3(x, y, z);

function seatPose(root, bones, steer) {
  // Lean the torso back slightly and into the turn.
  aim(root, bones.chest, bones.upperChest || bones.neck, V(-steer * 0.12, 1, -0.18));
  aim(root, bones.upperChest, bones.neck, V(-steer * 0.10, 1, -0.05));
  aim(root, bones.neck, bones.head, V(steer * 0.05, 1, 0.12));
  // Legs stretched forward into the nose of the kart.
  aim(root, bones.lUpperLeg, bones.lLowerLeg, V(0.16, 0.05, 1));
  aim(root, bones.rUpperLeg, bones.rLowerLeg, V(-0.16, 0.05, 1));
  aim(root, bones.lLowerLeg, bones.lFoot, V(0.04, -0.45, 1));
  aim(root, bones.rLowerLeg, bones.rFoot, V(-0.04, -0.45, 1));
  aim(root, bones.lFoot, bones.lToes, V(0, 0.5, 1));
  aim(root, bones.rFoot, bones.rToes, V(0, 0.5, 1));
  // Hands on the wheel; steering pushes one hand up and the other down.
  aim(root, bones.lUpperArm, bones.lLowerArm, V(0.35, -0.75 - steer * 0.35, 0.65));
  aim(root, bones.rUpperArm, bones.rLowerArm, V(-0.35, -0.75 + steer * 0.35, 0.65));
  aim(root, bones.lLowerArm, bones.lHand, V(-0.35, 0.10 - steer * 0.45, 1));
  aim(root, bones.rLowerArm, bones.rHand, V(0.35, 0.10 + steer * 0.45, 1));
}

export class Driver {
  constructor(gltf, character) {
    this.root = new THREE.Group();
    this.model = cloneSkinned(gltf.scene);
    this.model.traverse((o) => {
      if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; }
    });
    this.root.add(this.model);
    this.bones = findBones(this.model);
    this.animations = gltf.animations;
    this.mixer = new THREE.AnimationMixer(this.model);
    this.rest = snapshot(this.bones);

    // Scale to the character's height from the bind-pose bounds.
    this.model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.model);
    this.baseScale = character.height / Math.max(0.01, box.max.y - box.min.y);
    this.model.scale.setScalar(this.baseScale);

    // Pre-compute three seated poses (steer left, centre, right) to blend between.
    this.poses = [-1, 0, 1].map((s) => {
      restore(this.bones, this.rest);
      seatPose(this.model, this.bones, s);
      return snapshot(this.bones);
    });
    restore(this.bones, this.poses[1]);
    this.model.updateMatrixWorld(true);
    this.hipLocal = new THREE.Vector3();
    if (this.bones.hips) {
      this.bones.hips.getWorldPosition(this.hipLocal);
    }
    this.mode = 'seated';
    this.steer = 0;
  }

  // Put the driver into a kart model so the hips land on the seat.
  seatIn(kart) {
    this.mode = 'seated';
    this.mixer.stopAllAction();
    restore(this.bones, this.poses[1]);
    this.model.position.set(0, 0, 0);
    this.model.position.copy(kart.seat.hip).sub(this.hipLocal);
    this.seatHip = kart.seat.hip.clone();
    kart.body.add(this.root);
    if (kart.placeWheel && this.bones.lHand && this.bones.rHand) {
      kart.body.updateMatrixWorld(true);
      const inv = new THREE.Matrix4().copy(kart.body.matrixWorld).invert();
      const l = this.bones.lHand.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
      const r = this.bones.rHand.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
      const mid = l.add(r).multiplyScalar(0.5);
      mid.x = 0;
      mid.z += 0.04;
      kart.placeWheel(mid);
    }
  }

  stand(clipName) {
    this.mode = 'standing';
    restore(this.bones, this.rest);
    this.model.position.set(0, 0, 0);
    this.mixer.stopAllAction();
    const clip = this.animations.find((a) => a.name === clipName) || this.animations[0];
    if (clip) this.mixer.clipAction(clip).reset().play();
  }

  // Play a sitting clip (cheer, clap...) without leaving the seat.
  celebrateSeated(clipName) {
    const clip = this.animations.find((a) => a.name === clipName);
    if (!clip || !this.bones.hips || !this.seatHip) return;
    this.mode = 'standing';
    restore(this.bones, this.rest);
    this.mixer.stopAllAction();
    this.mixer.clipAction(clip).reset().play();
    this.mixer.update(0);
    // shift the model so the animated hips land on the seat
    this.root.updateMatrixWorld(true);
    const hip = this.root.worldToLocal(this.bones.hips.getWorldPosition(new THREE.Vector3()));
    this.model.position.add(this.seatHip.clone().sub(hip));
  }

  update(dt, steer = 0, bounce = 0) {
    if (this.mode === 'standing') { this.mixer.update(dt); return; }
    this.steer += (steer - this.steer) * Math.min(1, dt * 10);
    const s = this.steer;
    const [a, b] = s < 0 ? [this.poses[1], this.poses[0]] : [this.poses[1], this.poses[2]];
    const t = Math.abs(s);
    for (const k of Object.keys(this.bones)) this.bones[k].quaternion.copy(a[k]).slerp(b[k], t);
    if (this.bones.head) this.bones.head.rotation.z += bounce * 0.2;
  }
}
