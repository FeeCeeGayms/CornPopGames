// Rendering extras: cloudy sky shader, image-based lighting from that sky,
// and a bloom post-process so sludge, pickups and boost flames glow.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

const SKY_VERT = `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;
// Stylised sky: a deep gradient, puffy cumulus lit from the sun side with bright
// rims, a crisp sun disc, stars at night and (Sweden) the northern lights.
const SKY_FRAG = `
uniform float uTime; uniform vec3 uSun; uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uGround;
uniform vec3 uCloudDark; uniform vec3 uCloudLight; uniform vec3 uSunCol; uniform float uCover;
uniform float uNight; uniform float uAurora;
varying vec3 vDir;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 sunD = normalize(uSun);
  float s = max(dot(d, sunD), 0.0);
  // rich gradient with a bright band just over the horizon
  vec3 col = mix(uHorizon, uTop, pow(smoothstep(0.0, 0.62, h), 0.7));
  col += uHorizon * 0.12 * (1.0 - smoothstep(0.0, 0.12, abs(h))) * (1.0 - uNight);
  col = mix(uGround, col, smoothstep(-0.1, 0.015, h));
  // warm forward scatter round the sun
  col += uSunCol * pow(s, 6.0) * 0.18 * (1.0 - uNight * 0.7);
  if (h > 0.0) {
    // stars
    if (uNight > 0.0) {
      vec2 sp = d.xz / (h + 0.35) * 220.0;
      float st = hash(floor(sp));
      float tw = 0.6 + 0.4 * sin(uTime * 3.0 + st * 60.0);
      float star = step(0.985, st) * smoothstep(0.45, 0.0, length(fract(sp) - 0.5)) * tw;
      col += vec3(0.9, 0.95, 1.0) * star * uNight * smoothstep(0.02, 0.25, h) * (1.0 - uCover * 0.7);
    }
    // aurora: wavy green-violet curtains
    if (uAurora > 0.0) {
      vec2 ap = d.xz / (h + 0.25);
      float band = 0.0;
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float x = ap.x * (0.6 + fi * 0.25) + uTime * 0.03 * (fi + 1.0) + fi * 3.1;
        float y = ap.y + sin(x * 1.7) * 0.35 + noise(vec2(x * 2.0, fi)) * 0.4 - 0.2 + fi * 0.3;
        band += exp(-abs(y) * 9.0) * (0.55 + 0.45 * noise(vec2(x * 9.0, uTime * 0.2 + fi)));
      }
      vec3 aur = mix(vec3(0.15, 1.0, 0.5), vec3(0.55, 0.3, 1.0), smoothstep(0.35, 0.8, h) * 0.7);
      col += aur * band * uAurora * smoothstep(0.03, 0.2, h) * (1.0 - smoothstep(0.45, 0.95, h)) * 0.4;
    }
    // puffy cumulus projected onto a dome, lit from the sun side
    vec2 uv = d.xz / (h + 0.16) * 1.25 + vec2(uTime * 0.005, uTime * 0.0018);
    float base = fbm(uv) * 0.72 + fbm(uv * 2.6 + 7.0) * 0.38;
    float thr = mix(0.86, 0.36, uCover);
    float c = smoothstep(thr, thr + 0.16, base);
    vec2 toSun = normalize(sunD.xz + 1e-4) * 0.06;
    float lit = fbm(uv + toSun) * 0.72 + fbm((uv + toSun) * 2.6 + 7.0) * 0.38;
    float shade = clamp((base - lit) * 4.0 + 0.55, 0.0, 1.0); // denser towards the sun = shadowed
    vec3 cloud = mix(uCloudLight, uCloudDark, (1.0 - shade) * 0.75 + c * 0.15);
    float rim = (1.0 - smoothstep(0.0, 0.5, c)) * pow(s, 3.0);
    cloud += uSunCol * (rim * 0.9 + pow(s, 10.0) * 0.25) * (1.0 - uNight * 0.6);
    col = mix(col, cloud, c * smoothstep(0.0, 0.14, h) * 0.95);
  }
  // crisp sun disc and glow, hidden behind thick cloud cover
  float disc = smoothstep(0.9993, 0.9997, s);
  col += uSunCol * (pow(s, 64.0) * 0.5 + pow(s, 600.0) * 1.5 + disc * 6.0) * (1.0 - uCover * 0.55);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

// Pripyat's grey overcast; a track def's `sky` overrides any of these.
export const SKY = { top: 0x56606a, horizon: 0xb3b8a2, ground: 0x8a917c, cloudDark: 0xadb1ad, cloudLight: 0xe4e6df, sun: 0xfff6e0, cover: 1 };

export function createSky(sunDir) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSun: { value: sunDir.clone() },
      uTop: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uGround: { value: new THREE.Color() },
      uCloudDark: { value: new THREE.Color() },
      uCloudLight: { value: new THREE.Color() },
      uSunCol: { value: new THREE.Color() },
      uCover: { value: 1 },
      uNight: { value: 0 },
      uAurora: { value: 0 },
    },
    vertexShader: SKY_VERT, fragmentShader: SKY_FRAG,
    side: THREE.BackSide, depthWrite: false, fog: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), mat);
  mesh.scale.setScalar(1800);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  setSky(mesh, {}, sunDir);
  return mesh;
}

export function setSky(mesh, look = {}, sunDir) {
  const u = mesh.material.uniforms, k = { ...SKY, ...look };
  u.uTop.value.set(k.top); u.uHorizon.value.set(k.horizon); u.uGround.value.set(k.ground);
  u.uCloudDark.value.set(k.cloudDark); u.uCloudLight.value.set(k.cloudLight);
  u.uSunCol.value.set(k.sun).multiplyScalar(k.sunGlow ?? 1);
  u.uCover.value = k.cover;
  u.uNight.value = k.night ?? 0;
  u.uAurora.value = k.aurora ?? 0;
  if (sunDir) u.uSun.value.copy(sunDir);
}

// Reflections and soft ambient light baked from the sky.
export function bakeEnvironment(renderer, skyMesh, groundColor = 0x4f4c3e) {
  const envScene = new THREE.Scene();
  const s = new THREE.Mesh(skyMesh.geometry, skyMesh.material);
  s.scale.setScalar(50);
  envScene.add(s);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 24), new THREE.MeshBasicMaterial({ color: groundColor }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2;
  envScene.add(ground);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(envScene, 0.02, 0.1, 200);
  pmrem.dispose();
  return rt.texture;
}

// --- Sun-lit fog ------------------------------------------------------------
// Fog brightens and warms towards the sun (aerial perspective) and thins with
// height so far hills keep their silhouettes. Patched into three's fog chunks;
// every material picks up the shared uniforms through the default onBeforeCompile.
export const FOG = {
  fogSunColor: { value: new THREE.Color(0, 0, 0) },
  fogSunDir: { value: new THREE.Vector3(0, 1, 0) },
  fogBase: { value: 0 },
  fogFalloff: { value: 0 },
};
THREE.ShaderChunk.fog_pars_vertex = `
#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vFogDir;
#endif`;
THREE.ShaderChunk.fog_vertex = `
#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  vFogDir = (vec4(mvPosition.xyz, 0.0) * viewMatrix).xyz;
#endif`;
THREE.ShaderChunk.fog_pars_fragment = `
#ifdef USE_FOG
  uniform vec3 fogColor;
  varying float vFogDepth;
  varying vec3 vFogDir;
  uniform vec3 fogSunColor; uniform vec3 fogSunDir; uniform float fogBase; uniform float fogFalloff;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear;
    uniform float fogFar;
  #endif
#endif`;
THREE.ShaderChunk.fog_fragment = `
#ifdef USE_FOG
  float fogH = max(cameraPosition.y + vFogDir.y * 0.5 - fogBase, 0.0);
  float fogHF = mix(0.5, 1.0, exp(-fogH * fogFalloff));
  #ifdef FOG_EXP2
    float fogD = fogDensity * fogHF;
    float fogFactor = 1.0 - exp( - fogD * fogD * vFogDepth * vFogDepth );
  #else
    float fogFactor = smoothstep( fogNear, fogFar, vFogDepth ) * fogHF;
  #endif
  float fogSun = pow(max(dot(normalize(vFogDir), fogSunDir), 0.0), 6.0);
  gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor + fogSunColor * fogSun, fogFactor );
#endif`;
export function fogHook(shader) {
  if (shader.uniforms.fogColor) Object.assign(shader.uniforms, FOG);
}
THREE.Material.prototype.onBeforeCompile = fogHook;

// --- Foliage -------------------------------------------------------------------
// Shared clock for wind and other shader animation.
export const WIND = { time: { value: 0 } };

// Soft, rounded foliage: normals point out from the crown's middle so the canopy
// shades like one plump shape, and a vertex-colour gradient darkens the inside
// and underside (cheap ambient occlusion). Works on merged, non-indexed crowns.
export function softFoliage(geo, { blend = 0.75, dark = 0.5 } = {}) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.computeVertexNormals();
  g.computeBoundingBox();
  const bb = g.boundingBox, c = bb.getCenter(new THREE.Vector3()), size = bb.getSize(new THREE.Vector3());
  const pos = g.attributes.position, nor = g.attributes.normal;
  const col = new Float32Array(pos.count * 3), v = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(nor, i);
    const out = v.clone().sub(c).divide(size.clone().addScalar(1e-4)).normalize();
    n.lerp(out, blend).normalize();
    nor.setXYZ(i, n.x, n.y, n.z);
    const up = (v.y - bb.min.y) / (size.y || 1);
    const radial = Math.min(1, Math.hypot((v.x - c.x) / (size.x * 0.5 || 1), (v.z - c.z) / (size.z * 0.5 || 1)));
    const k = Math.min(1, dark + (1 - dark) * (0.55 * up + 0.45 * radial) * 1.15);
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

// Sway an instanced (or plain) mesh's material in the wind: vertices move more
// the higher they sit in the model. `amp` is in model units at height 1.
export function windSway(mat, amp = 0.04, { axis = 'y', speed = 1.6 } = {}) {
  mat.onBeforeCompile = (shader) => {
    fogHook(shader);
    shader.uniforms.uWindTime = WIND.time;
    shader.vertexShader = 'uniform float uWindTime;\n' + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      {
        vec3 wp = vec3(0.0);
        #ifdef USE_INSTANCING
          wp = instanceMatrix[3].xyz;
        #endif
        wp += modelMatrix[3].xyz;
        float ph = wp.x * 0.13 + wp.z * 0.11;
        float hgt = max(position.${axis}, 0.0);
        float sway = sin(uWindTime * ${speed.toFixed(2)} + ph) * 0.7 + sin(uWindTime * ${(speed * 2.7).toFixed(2)} + ph * 1.7) * 0.3;
        transformed.x += sway * ${amp.toFixed(4)} * hgt * hgt;
        transformed.z += cos(uWindTime * ${(speed * 0.8).toFixed(2)} + ph) * ${(amp * 0.6).toFixed(4)} * hgt * hgt;
      }`);
  };
  mat.customProgramCacheKey = () => `wind${amp}${axis}${speed}`;
  return mat;
}

// --- Post: bloom, then a colour grade (filmic tone curve, a saturation lift for
// that bright kart-racer look, a soft vignette and speed lines on boost). ------
const GRADE = `
vec3 ckGrade(vec3 color) {
  color = ACESFilmicToneMapping(color);
  float l = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = max(mix(vec3(l), color, 1.2), 0.0);
  return color;
}`;
// Without post-processing the same grade runs as the renderer's tone mapping.
THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace(
  'vec3 CustomToneMapping( vec3 color ) { return color; }',
  GRADE + '\nvec3 CustomToneMapping( vec3 color ) { return ckGrade( color ); }');

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, toneMappingExposure: { value: 1 }, uVignette: { value: 0.32 }, uSpeed: { value: 0 }, uTime: { value: 0 }, uAspect: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uVignette; uniform float uSpeed; uniform float uTime; uniform float uAspect;
    varying vec2 vUv;
    // three adds the tone-mapping (ckGrade) and colour-space functions to the prefix
    float h1(float x) { return fract(sin(x * 91.7) * 43758.5); }
    void main() {
      vec4 tex = texture2D(tDiffuse, vUv);
      vec3 c = ckGrade(tex.rgb);
      vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
      float r = length(p);
      c *= 1.0 - uVignette * smoothstep(0.35, 1.05, r);
      if (uSpeed > 0.0) { // radial streaks at the screen edges
        float a = atan(p.y, p.x) * 40.0;
        float id = floor(a);
        float streak = step(0.72, h1(id + floor(uTime * 14.0) * 7.0)) * smoothstep(0.42, 0.85, r) * (1.0 - abs(fract(a) - 0.5) * 2.0);
        c = mix(c, vec3(1.0), streak * uSpeed * 0.35);
      }
      gl_FragColor = vec4(c, 1.0);
      gl_FragColor = sRGBTransferOETF(gl_FragColor);
    }`,
};

export function createComposer(renderer, scene, camera) {
  const size = renderer.getSize(new THREE.Vector2());
  const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.55, 0.45, 0.9);
  composer.addPass(bloom);
  const grade = new ShaderPass(GradeShader);
  composer.addPass(grade);
  return { composer, bloom, grade };
}

// The standard canopy material: soft-shaded vertex colours (see softFoliage),
// tinted per instance, swaying in the wind.
export function foliageMaterial({ amp = 0.025, ...opts } = {}) {
  return windSway(new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.85, ...opts }), amp);
}

// Mirror-smooth surfaces (ice, wet tarmac, clearcoat) can reflect the sun brighter
// than a half-float target holds; one infinite pixel would smear across the whole
// screen through the bloom blur. Clamp every lit surface to a sane HDR range.
THREE.ShaderChunk.opaque_fragment = THREE.ShaderChunk.opaque_fragment.replace(
  'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
  'gl_FragColor = vec4( clamp( outgoingLight, 0.0, 48.0 ), diffuseColor.a );');
