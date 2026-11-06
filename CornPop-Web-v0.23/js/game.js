import * as THREE from 'three';
import { loadTextures } from './textures.js';
import { World, CELL } from './world.js';
import { PropBuilder } from './props.js';
import { Player, HULL_MIN, HULL_MAX, PM } from './player.js';
import { CornPopAsset, Portrait, PLAYER_HEIGHT } from './cornpop.js';
import { HUD, KEY_COLORS } from './hud.js';
import { Sfx } from './audio.js';
import { Input } from './input.js';
import { LEVELS, EPISODES, episodeOf } from './levels.js';
import { Arsenal, W2, W2_KEYS, makeW2Pickup } from './weapons2.js';
import { BCM_ANIMS, BossDirector } from './boss.js';
import { TROP_ANIMS, TropDirector } from './trop.js';
import { Qoq, QOQ, QOQ_ANIMS, MARV, MARV_ANIMS, BALLINKI, BALLINKI_ANIMS, FRENTA, FRENTA_ANIMS, BEANS, BEANS_ANIMS, makePotato, TURD, SOAKER, SHOTGUN, CANDYGUN, Soaker, Shotgun, CandyGun, TurdLauncher, makeTurd, Particles, makeChicken, makeTissue, makeSausage, makeCandyCorn, makePickupModel, segAabb, LIT } from './combat.js';

THREE.ColorManagement.enabled = false;

const STYLE_PATTERNS = {
  normal: 'm', flicker: 'mmnmmommommnonmmonqnmmo', pulse: 'abcdefghijklmnopqrstuvwxyzyxwvutsrqponmlkjihgfedcba', candle: 'mmmmmaaaaammmmmaaaaaabcdefgabcdefg',
  strobe: 'mamamamamama', gentle: 'jklmnopqrstuvwxyzyxwvutsrqponmlkj', flicker2: 'nmonqnmomnmomomno', fluoro: 'mmamammmmammamamaaamammma', neon: 'mmmmmmmmmmmmmmmmmmmmmmmlmmmmmmmmmmmmmmmamm',
};

const OPTS_KEY = 'cornpop-pidser-opts', PROG_KEY = 'cornpop-pidser-progress';
function loadJSON(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ? { ...d, ...v } : d; } catch (e) { return d; } }
function saveJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }

const WORLD_VERT = `
attribute vec2 uv1; attribute float aWet; varying vec2 vUv; varying vec2 vLm; varying float vDepth; varying vec3 vWorld; varying float vWet;
void main(){ vUv=uv; vLm=uv1; vWet=aWet; vec4 wp=modelMatrix*vec4(position,1.0); vWorld=wp.xyz; vec4 mv=viewMatrix*wp; vDepth=-mv.z; gl_Position=projectionMatrix*mv; }`;
const WORLD_FRAG = `
uniform sampler2D map; uniform sampler2D lm; uniform sampler2D sm; uniform vec3 st[4];
uniform vec3 fogColor; uniform float fogDensity; uniform float fullbright; uniform float nolm; uniform float time; uniform vec2 scroll; uniform float warp; uniform float alpha;
uniform float lightning; uniform float wetOn;
varying vec2 vUv; varying vec2 vLm; varying float vDepth; varying vec3 vWorld; varying float vWet;
float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash2(i), hash2(i+vec2(1.0,0.0)), f.x), mix(hash2(i+vec2(0.0,1.0)), hash2(i+vec2(1.0,1.0)), f.x), f.y); }
void main(){
  vec2 uv = vUv + scroll*time;
  if (warp > 0.5) uv += vec2(sin(vUv.y*6.2832 + time*1.1), sin(vUv.x*6.2832 + time*1.3))*0.07;
  vec4 t=texture2D(map, uv);
  if (t.r > 0.97 && t.b > 0.97 && t.g < 0.03) discard;
  vec3 light = vec3(1.0);
  float wet = 0.0;
  if (nolm < 0.5) { vec4 L = texture2D(lm, vLm); light = L.rgb*2.0; vec4 s=texture2D(sm, vLm)*2.0; light += st[0]*s.r + st[1]*s.g + st[2]*s.b + st[3]*s.a;
    light += vec3(0.75, 0.8, 1.0) * lightning * L.a * 2.2;                 // lightning lights everything open to the sky
    if (wetOn > 0.5 && vWet > 0.5) {                                        // rain-soaked ground: puddles in the dips, a damp sheen elsewhere
      float pn = vnoise(vWorld.xz * 0.006) * 0.65 + vnoise(vWorld.xz * 0.021) * 0.35;
      wet = L.a * mix(0.5, 1.0, smoothstep(0.45, 0.62, pn)); } }
  float glow = max(1.0 - t.a, fullbright);
  vec3 c = t.rgb * mix(light, vec3(1.0), glow);
  c *= 1.0 - 0.38 * wet;                                                  // wet surfaces are darker (the reflection is added in the blit pass)
  float f = 1.0 - exp(-fogDensity*fogDensity*vDepth*vDepth);
  gl_FragColor = vec4(mix(c, fogColor, clamp(f,0.0,1.0)), alpha * (1.0 - 0.5 * wet * (1.0 - clamp(f, 0.0, 1.0))));
}`;
const SKY_FRAG = `
uniform sampler2D map; uniform float time; uniform vec3 camPos; uniform vec3 tint; uniform float city; uniform float storm; uniform float bolt; uniform float boltAz; uniform float boltSeed; uniform vec3 fogColor; varying vec3 vWorld;
float h1(float n){ return fract(sin(n) * 43758.5453); }
// New York at night: two layers of skyscraper silhouettes with lit windows, a tower with a spire, the moon behind the clouds
vec3 skyline(vec3 d, vec3 c, float cloud){
  float el = asin(clamp(d.y, -1.0, 1.0)); float az = atan(d.z, d.x);
  float md = dot(d, normalize(vec3(-0.35, 0.5, -0.78)));
  c += vec3(0.95, 0.95, 1.0) * smoothstep(0.99955, 0.9998, md) * (1.0 - cloud * 0.55) + vec3(0.18, 0.2, 0.28) * pow(max(md, 0.0), 90.0) * (1.0 - cloud * 0.4);
  vec3 farCol = mix(vec3(0.05, 0.05, 0.08), fogColor * 2.5 + 0.03, 0.55);
  for (int layer = 0; layer < 2; layer++) {
    float L = float(layer); float cols = 90.0 + L * 70.0; float u = (az / 6.2832 + 0.5) * cols + L * 17.0; float id = floor(u), fu = fract(u);
    float hg = (0.05 + pow(h1(id * 1.7 + 3.1 + L * 9.0), 2.6) * (0.26 - L * 0.1) + h1(id * 0.37 + L) * 0.025);
    float w = 0.55 + 0.45 * h1(id * 5.3 + L); if (abs(fu - 0.5) > w * 0.5) hg = 0.035 + h1(id * 2.9) * 0.02;
    float spireAz = 0.6 + L * 2.4; float sd = abs(az - spireAz);
    if (sd < 0.03) hg = max(hg, 0.30 - L * 0.06 - sd * 2.5); if (sd < 0.004) hg = max(hg, 0.40 - L * 0.08);      // a tall tower with a needle
    if (el < hg) {
      vec3 b = layer == 0 ? farCol : vec3(0.025, 0.022, 0.03);
      vec2 wc = vec2(fu * 6.0 * w, el * (layer == 0 ? 160.0 : 220.0)); vec2 wi = floor(wc), wf = fract(wc);
      float lit = step(0.72 - L * 0.08, h1(dot(wi + id * 13.0, vec2(1.3, 7.1)) + L * 3.0));
      if (wf.x > 0.25 && wf.x < 0.75 && wf.y > 0.3 && wf.y < 0.8 && abs(fu - 0.5) < w * 0.45) b += vec3(0.75, 0.6, 0.3) * lit * (layer == 0 ? 0.25 : 0.55);
      if (sd < 0.004 && el > hg - 0.01) b += vec3(1.0, 0.15, 0.1) * step(0.5, fract(time * 0.7));                     // blinking aircraft light
      c = b + vec3(0.6, 0.65, 0.8) * storm * (layer == 0 ? 0.35 : 0.12);
      return c;
    }
  }
  // lightning bolt: a jagged streak from the clouds down to the skyline
  if (bolt > 0.01) {
    float x = az - boltAz; float off = 0.0; float amp = 0.02;
    for (int k = 0; k < 5; k++) { float fk = float(k); off += (h1(floor(el * (8.0 + fk * 9.0)) + boltSeed + fk * 11.0) - 0.5) * amp; amp *= 0.55; }
    float wdt = 0.0025 + 0.002 * bolt; float core = smoothstep(wdt, 0.0, abs(x - off));
    float top = 0.75 + h1(boltSeed) * 0.3; core *= step(el, top);
    c += vec3(0.85, 0.9, 1.0) * core * bolt * 3.0 + vec3(0.4, 0.45, 0.7) * smoothstep(0.25, 0.0, abs(x - off)) * bolt * 0.35;
  }
  return c;
}
void main(){
  vec3 dir = vWorld - camPos; dir.y *= 3.0; dir = normalize(dir);
  vec2 base = dir.xz * (6.0*63.0/ (abs(dir.y)*378.0 + 0.0001)) ;
  vec2 st = dir.xz / max(dir.y, 0.08) * 0.35;
  vec3 back = texture2D(map, st*0.5 + vec2(time*0.012, time*0.006)).rgb;
  vec4 front = texture2D(map, st*0.9 + vec2(time*0.03, time*0.017) + 0.37);
  float a = smoothstep(0.35, 0.65, dot(front.rgb, vec3(0.333)));
  vec3 c = mix(back*0.55, front.rgb*1.2, a) * tint;
  if (city > 0.5) { c += vec3(0.7, 0.75, 0.95) * storm * (0.25 + a * 1.3); c = skyline(normalize(vWorld - camPos), c, a); }
  gl_FragColor = vec4(c, 1.0);
}`;
// flames: a camera-facing (around Y) quad with scrolling noise; additive, fades with fog
const FIRE_VERT = `
uniform float size; varying vec2 vUv; varying float vDepth;
void main(){ vUv = uv; vec3 c = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz; vec3 t = cameraPosition - c; t.y = 0.0; t = normalize(t + vec3(1e-4)); vec3 r = vec3(t.z, 0.0, -t.x);
  vec3 wp = c + r * position.x * size * 1.3 + vec3(0.0, (position.y + 0.5) * size * 2.3, 0.0); vec4 mv = viewMatrix * vec4(wp, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`;
const FIRE_FRAG = `
uniform float time; uniform float seed; uniform float fogDensity; varying vec2 vUv; varying float vDepth;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
void main(){
  vec2 p = vUv; float t = time * 2.2 + seed;
  float n = n2(vec2(p.x * 4.0, p.y * 3.0 - t * 1.6)) * 0.6 + n2(vec2(p.x * 9.0 + 3.0, p.y * 7.0 - t * 3.1)) * 0.4;
  float shape = (1.0 - p.y * 0.85) * (1.0 - smoothstep(0.0, 0.48 - p.y * 0.28, abs(p.x - 0.5)));
  float f = shape * (0.6 + 1.0 * n) - p.y * 0.18;
  float a = smoothstep(0.08, 0.36, f); if (a < 0.01) discard;
  vec3 col = mix(vec3(0.9, 0.18, 0.02), vec3(1.0, 0.8, 0.35), smoothstep(0.3, 0.85, f)); col = mix(col, vec3(1.0, 0.97, 0.8), smoothstep(0.75, 1.0, f));
  float fog = exp(-fogDensity * fogDensity * vDepth * vDepth);
  gl_FragColor = vec4(col * a * 2.2 * fog, a);
}`;
const BLIT_FRAG = `
uniform sampler2D tex; uniform sampler2D gooTex; uniform float goo; uniform float gooSlide; uniform float gamma; uniform float bright; uniform vec4 flash; uniform float levels; uniform vec2 res; varying vec2 vUv;
uniform sampler2D depthTex; uniform float ssr; uniform sampler2D bloomTex; uniform float bloomAmt; uniform mat4 proj; uniform mat4 invProj; uniform mat4 invView; uniform vec3 upV; uniform vec3 xV; uniform vec3 zV; uniform vec3 reflSky; uniform float time; uniform float rainAmt;
vec3 viewAt(vec2 uv){ float z = texture2D(depthTex, uv).x * 2.0 - 1.0; vec4 p = invProj * vec4(uv * 2.0 - 1.0, z, 1.0); return p.xyz / p.w; }
float hsh(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
// rain ripples: expanding rings on a 24-unit grid, each cell restarting at its own time
vec2 ripples(vec2 w){
  vec2 g = floor(w / 24.0), f = fract(w / 24.0) - 0.5; vec2 n = vec2(0.0);
  for (int k = 0; k < 2; k++) {
    vec2 o = vec2(hsh(g + float(k) * 7.3), hsh(g + 3.1 + float(k) * 5.7)) - 0.5; float ph = fract(time * (0.9 + 0.4 * float(k)) + hsh(g + 9.0 + float(k)));
    vec2 d = f - o * 0.6; float r = length(d); float ring = sin((r - ph * 0.5) * 50.0) * smoothstep(0.08, 0.0, abs(r - ph * 0.5)) * (1.0 - ph);
    n += d / max(r, 0.001) * ring;
  }
  return n * 0.22;
}
void main(){
  vec4 src = texture2D(tex, vUv);
  vec3 c = src.rgb * bright;
  float wet = ssr > 0.5 ? clamp((1.0 - src.a) * 2.0, 0.0, 1.0) : 0.0;
  if (wet > 0.03) { // wet street: screen-space reflection of everything above it, shimmering with rain ripples
    vec3 P = viewAt(vUv); vec3 Wp = (invView * vec4(P, 1.0)).xyz;
    vec2 rp = ripples(Wp.xz) * rainAmt;
    vec3 N = normalize(upV + xV * rp.x + zV * rp.y + (xV * (hsh(floor(Wp.xz * 0.25)) - 0.5) + zV * (hsh(floor(Wp.zx * 0.25) + 3.0) - 0.5)) * 0.03);
    vec3 V = normalize(P); vec3 R = reflect(V, N);
    vec3 refl = reflSky; float st = 6.0 + length(P) * 0.02; vec3 Q = P; float fade = 0.0;
    for (int i = 0; i < 18; i++) {
      Q += R * st; st *= 1.28;
      vec4 pr = proj * vec4(Q, 1.0); vec2 uv = pr.xy / pr.w * 0.5 + 0.5;
      if (pr.w <= 0.0 || uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) break;
      float dz = viewAt(uv).z - Q.z;
      if (dz > 0.0 && dz < st * 2.2 + 30.0) {
        vec3 A = Q - R * st / 1.28, B = Q; // refine
        for (int j = 0; j < 4; j++) { vec3 M = (A + B) * 0.5; vec4 pm = proj * vec4(M, 1.0); vec2 um = pm.xy / pm.w * 0.5 + 0.5; if (viewAt(um).z - M.z > 0.0) B = M; else A = M; }
        vec4 pb = proj * vec4(B, 1.0); uv = pb.xy / pb.w * 0.5 + 0.5;
        vec2 e = min(uv, 1.0 - uv); fade = smoothstep(0.0, 0.07, min(e.x, e.y)) * (1.0 - float(i) / 20.0);
        refl = mix(reflSky, texture2D(tex, uv).rgb * bright, fade); break;
      }
    }
    float fres = 0.3 + 0.7 * pow(1.0 - max(dot(-V, N), 0.0), 4.0);
    c = mix(c, refl, clamp(wet * fres * 0.85, 0.0, 0.85)) + refl * wet * 0.08;
  }
  if (bloomAmt > 0.0) c += texture2D(bloomTex, vUv).rgb * bloomAmt;
  c = pow(max(c, 0.0), vec3(1.0/gamma));
  if (levels > 0.0) { vec2 p = floor(vUv*res); float d = mod(p.x+p.y*2.0, 4.0)/4.0 - 0.375; c = floor(c*levels + d*0.6 + 0.5)/levels; }
  c = mix(c, flash.rgb, flash.a);
  if (goo > 0.0) { // Marv's tissue goo: white slime over the view that slowly slides down
    vec4 g = texture2D(gooTex, vec2(vUv.x, vUv.y + gooSlide));
    float a = g.a * goo; vec3 gc = vec3(0.93, 0.92, 0.86) * (0.7 + 0.45 * g.r) + vec3(0.25) * g.g;
    c = mix(c * (1.0 - 0.35 * a), gc, a * 0.88);
  }
  gl_FragColor = vec4(c, 1.0);
}`;
// ---- post: FXAA (after Lottes' FXAA 3.11 "quality" lite), bloom bright-pass + separable blur ----
const POST_VERT = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }';
const FXAA_FRAG = `
uniform sampler2D tex; uniform vec2 texel; varying vec2 vUv;
float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
void main(){
  vec4 cM = texture2D(tex, vUv);
  float lN = lum(texture2D(tex, vUv + vec2(0.0, texel.y)).rgb), lS = lum(texture2D(tex, vUv - vec2(0.0, texel.y)).rgb);
  float lE = lum(texture2D(tex, vUv + vec2(texel.x, 0.0)).rgb), lW = lum(texture2D(tex, vUv - vec2(texel.x, 0.0)).rgb), lM = lum(cM.rgb);
  float mn = min(lM, min(min(lN, lS), min(lE, lW))), mx = max(lM, max(max(lN, lS), max(lE, lW))), range = mx - mn;
  if (range < max(0.0312, mx * 0.125)) { gl_FragColor = cM; return; }
  float lNW = lum(texture2D(tex, vUv + vec2(-texel.x, texel.y)).rgb), lNE = lum(texture2D(tex, vUv + texel).rgb);
  float lSW = lum(texture2D(tex, vUv - texel).rgb), lSE = lum(texture2D(tex, vUv + vec2(texel.x, -texel.y)).rgb);
  vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE));
  float red = max((lNW + lNE + lSW + lSE) * 0.03125, 0.0078125);
  float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + red);
  dir = clamp(dir * rcp, -8.0, 8.0) * texel;
  vec3 a = 0.5 * (texture2D(tex, vUv + dir * (1.0/3.0 - 0.5)).rgb + texture2D(tex, vUv + dir * (2.0/3.0 - 0.5)).rgb);
  vec3 b = a * 0.5 + 0.25 * (texture2D(tex, vUv - dir * 0.5).rgb + texture2D(tex, vUv + dir * 0.5).rgb);
  float lb = lum(b);
  gl_FragColor = vec4((lb < mn || lb > mx) ? a : b, cM.a);
}`;
const BRIGHT_FRAG = `
uniform sampler2D tex; uniform vec2 texel; uniform float threshold; varying vec2 vUv;
void main(){ // 4-tap downsample + soft threshold: neon, fire, lamps and lightning glow
  vec3 c = (texture2D(tex, vUv + texel * vec2(-1.0, -1.0)).rgb + texture2D(tex, vUv + texel * vec2(1.0, -1.0)).rgb + texture2D(tex, vUv + texel * vec2(-1.0, 1.0)).rgb + texture2D(tex, vUv + texel).rgb) * 0.25;
  float l = max(c.r, max(c.g, c.b)); float k = clamp((l - threshold) / max(1.0 - threshold, 0.01), 0.0, 1.0);
  gl_FragColor = vec4(c * k * k, 1.0);
}`;
const BLUR_FRAG = `
uniform sampler2D tex; uniform vec2 dir; varying vec2 vUv;
void main(){
  vec3 c = texture2D(tex, vUv).rgb * 0.2270270;
  c += (texture2D(tex, vUv + dir * 1.3846154).rgb + texture2D(tex, vUv - dir * 1.3846154).rgb) * 0.3162162;
  c += (texture2D(tex, vUv + dir * 3.2307692).rgb + texture2D(tex, vUv - dir * 3.2307692).rgb) * 0.0702703;
  gl_FragColor = vec4(c, 1.0);
}`;
// graphics presets: render scale (x device pixels), anisotropic filtering, bloom, FXAA. Dynamic resolution keeps the frame rate up.
export const GFX = {
  ultra: { scale: 2, aniso: 8, bloom: true, fxaa: true, shadow: 2048, label: 'Ultra' },
  high: { scale: 1.5, aniso: 4, bloom: true, fxaa: true, shadow: 1024, label: 'High' },
  medium: { scale: 1, aniso: 2, bloom: false, fxaa: true, shadow: 512, label: 'Medium' },
  retro: { scale: 0, aniso: 1, bloom: false, fxaa: false, shadow: 512, retro: true, label: 'Retro (pixelated)' },
};
const PORTAL_FRAG = `
uniform float time; uniform vec3 color; varying vec2 vUv;
void main(){ vec2 p = vUv*2.0-1.0; float r = length(p); if (r>1.0) discard; float a = atan(p.y,p.x);
  float sw = sin(a*3.0 + r*10.0 - time*4.0)*0.5+0.5; float sw2 = sin(a*5.0 - r*14.0 + time*3.0)*0.5+0.5;
  vec3 c = mix(color*0.4, color*1.4, sw*0.7+sw2*0.3); c = mix(c, vec3(1.0,0.95,0.8), smoothstep(0.35,0.0,r)*0.8);
  c *= smoothstep(1.0,0.85,r)*0.6+0.4; gl_FragColor = vec4(floor(c*12.0)/12.0, 1.0); }`;

export class Game {
  constructor() {
    this.opts = loadJSON(OPTS_KEY, { sens: 1, touchSens: 1, invert: false, res: 240, fov: 100, vol: 0.7, music: 0.5, songVol: 0.7, third: false, gamma: 1.15, touchUI: 'auto', retro: false, reflect: true, gfx: 'ultra', autoHop: false, showFps: false, dynres: true });
    this.progress = loadJSON(PROG_KEY, { unlocked: 1, unlocked2: 1 });
    this.canvas = document.getElementById('game');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); this.ctxLost = true; console.warn('WebGL context lost'); });
    this.canvas.addEventListener('webglcontextrestored', () => { // the phone dropped the graphics context: rebuild the map from its start instead of showing a black screen
      this.ctxLost = false; this.resize(); if ((this.state === 'play' || this.state === 'paused') && this.onRestart) this.onRestart(this.levelIndex);
    });
    { // soft studio environment for the lit materials (weapons, pickups, props): bright top, dim floor, a couple of light panels for highlights
      const pm = new THREE.PMREMGenerator(this.renderer), es = new THREE.Scene();
      const geo = new THREE.SphereGeometry(10, 32, 16), pos = geo.attributes.position, col = [];
      for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / 10, k = y > 0 ? 0.8 + 0.45 * y : 0.8 + 0.5 * y; col.push(k, k * 0.97, k * 0.92); }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      es.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
      for (const [x, z] of [[-4, -3], [5, 2]]) { const pm2 = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }); pm2.color.setRGB(3, 3, 2.8); const pan = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.5), pm2); pan.position.set(x, 8, z); pan.rotation.x = Math.PI / 2; es.add(pan); }
      this.envMap = pm.fromScene(es, 0.02).texture; pm.dispose();
      LIT.env = this.envMap; for (const m of LIT.mats) { m.envMap = this.envMap; m.needsUpdate = true; }
    }
    this.camera = new THREE.PerspectiveCamera(70, 1, 2, 6000);
    this.blitScene = new THREE.Scene(); this.blitCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.blitMat = new THREE.ShaderMaterial({ uniforms: { depthTex: { value: null }, ssr: { value: 0 }, proj: { value: new THREE.Matrix4() }, invProj: { value: new THREE.Matrix4() }, invView: { value: new THREE.Matrix4() }, upV: { value: new THREE.Vector3() }, xV: { value: new THREE.Vector3() }, zV: { value: new THREE.Vector3() }, reflSky: { value: new THREE.Color() }, time: { value: 0 }, rainAmt: { value: 1 }, tex: { value: null }, bloomTex: { value: null }, bloomAmt: { value: 0 }, gamma: { value: 1 }, bright: { value: 1 }, flash: { value: new THREE.Vector4(0, 0, 0, 0) }, levels: { value: 0 }, res: { value: new THREE.Vector2(1, 1) }, goo: { value: 0 }, gooSlide: { value: 0 }, gooTex: { value: null } }, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }', fragmentShader: BLIT_FRAG, depthTest: false, depthWrite: false });
    this.blitScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.blitMat));
    const post = (frag, extra = {}) => new THREE.ShaderMaterial({ uniforms: { tex: { value: null }, texel: { value: new THREE.Vector2() }, ...extra }, vertexShader: POST_VERT, fragmentShader: frag, depthTest: false, depthWrite: false });
    this.fxaaMat = post(FXAA_FRAG); this.brightMat = post(BRIGHT_FRAG, { threshold: { value: 0.74 } }); this.blurMat = post(BLUR_FRAG, { dir: { value: new THREE.Vector2() } });
    this.postScene = new THREE.Scene(); this.postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.fxaaMat); this.postQuad.frustumCulled = false; this.postScene.add(this.postQuad);
    this.dynScale = 1; this.frameAvg = 1 / 60; this.dynT = 0;
    this.hud = new HUD(); this.sfx = new Sfx();
    this.ui = {
      stick: document.getElementById('stick'), knob: document.getElementById('knob'), jump: document.getElementById('bjump'), duck: document.getElementById('bduck'), use: document.getElementById('buse'),
      view: document.getElementById('bview'), menu: document.getElementById('bmenu'), fire: document.getElementById('bfire'), weap: document.getElementById('bweap'),
    };
    this.input = new Input(this.canvas, this.ui);
    this.shared = { lm: { value: null }, sm: { value: null }, st: { value: [0, 1, 2, 3].map(() => new THREE.Vector3()) }, fogColor: { value: new THREE.Color(0, 0, 0) }, fogDensity: { value: 0 }, time: { value: 0 }, camPos: { value: new THREE.Vector3() },
      lightning: { value: 0 }, wetOn: { value: 0 }, storm: { value: 0 }, bolt: { value: 0 }, boltAz: { value: 0 }, boltSeed: { value: 0 }, city: { value: 0 } };
    this.state = 'loading'; this.levelIndex = 0; this.paused = false; this.clock = new THREE.Clock();
    this.applyOpts();
    addEventListener('resize', () => this.resize()); this.resize();
    window.__back = () => { if (this.state === 'play') this.pause(true); else if (this.state === 'paused') this.pause(false); return true; };
  }

  freeGPU(root, textures = false) {
    root.traverse(n => {
      if (n.geometry && !n.isSprite) n.geometry.dispose();
      for (const m of [].concat(n.material || [])) { if (!m || !m.dispose) continue;
        if (textures) for (const v of Object.values(m)) if (v && v.isTexture && !v.isRenderTargetTexture && (v.isDataTexture || v.isCanvasTexture) && v !== this._glowTex) v.dispose();
        m.dispose(); }
    });
  }
  // one failing system must not freeze the rest of the game (or stop the frame from drawing): log it once and carry on
  safe(tag, f) { try { f(); } catch (e) { this.reportError(tag, e); } }
  reportError(tag, e) {
    const k = tag + ':' + (e && e.message); this._errs = this._errs || new Set(); if (this._errs.has(k)) return; this._errs.add(k);
    console.error('[' + tag + ']', e); try { this.hud && this.hud.print(('ERROR ' + tag + ': ' + (e && e.message || e)).slice(0, 70)); } catch (_) { }
  }
  applyOpts() {
    const o = this.opts; this.input.sens = o.sens; this.input.touchSens = o.touchSens; this.input.invert = o.invert;
    this.sfx.music = o.music; this.sfx.songVol = o.songVol ?? 0.7; this.sfx.setVolume(o.vol); this.blitMat.uniforms.gamma.value = o.gamma; this.blitMat.uniforms.levels.value = o.retro && this.gfx().retro ? 40 : 0; this.applyTexQuality();
    this.third = o.third;
    document.body.classList.toggle('force-touch', o.touchUI === 'on'); document.body.classList.toggle('no-touch', o.touchUI === 'off');
    this.resize();
  }
  // texture filtering for the preset: crisp pixels for Retro, trilinear + anisotropic for the HD presets
  applyTexQuality() {
    if (!this.T) return; const G = this.gfx(), max = this.renderer.capabilities.getMaxAnisotropy();
    for (const t of Object.values(this.T)) {
      if (!t || !t.isTexture || t.userData.noFilter) continue;
      const mip = t.generateMipmaps;
      t.magFilter = G.retro ? THREE.NearestFilter : THREE.LinearFilter;
      t.minFilter = mip ? (G.retro ? THREE.NearestMipmapNearestFilter : THREE.LinearMipmapLinearFilter) : (G.retro ? THREE.NearestFilter : THREE.LinearFilter);
      t.anisotropy = Math.min(max, G.aniso); t.needsUpdate = true;
    }
  }
  saveOpts() { saveJSON(OPTS_KEY, this.opts); this.applyOpts(); }

  gfx() { return GFX[this.opts.gfx] || GFX.high; }
  resize() {
    const w = innerWidth, h = innerHeight, G = this.gfx(); this.renderer.setPixelRatio(Math.min(devicePixelRatio, G.retro ? 1 : 2)); this.renderer.setSize(w, h, false);
    let rh;
    if (G.retro) rh = this.opts.res > 0 ? this.opts.res : 240;
    else rh = Math.max(240, Math.round(h * Math.min(devicePixelRatio, G.scale) * this.dynScale));
    const rw = Math.round(rh * w / h), filt = G.retro ? THREE.NearestFilter : THREE.LinearFilter;
    if (!this.rt || this.rtFilter !== filt) {
      if (this.rt) { this.rt.dispose(); this.rtAA.dispose(); this.bloomA.dispose(); this.bloomB.dispose(); }
      const mk = (x, y, depth) => { const t = new THREE.WebGLRenderTarget(x, y, { magFilter: filt, minFilter: filt, depthBuffer: depth }); return t; };
      this.rt = mk(rw, rh, true); this.rt.depthTexture = new THREE.DepthTexture(rw, rh);
      this.rtAA = mk(rw, rh, false);
      this.bloomA = new THREE.WebGLRenderTarget(Math.max(1, rw >> 2), Math.max(1, rh >> 2), { magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter, depthBuffer: false }); this.bloomB = this.bloomA.clone();
      this.rtFilter = filt;
    } else { this.rt.setSize(rw, rh); this.rtAA.setSize(rw, rh); this.bloomA.setSize(Math.max(1, rw >> 2), Math.max(1, rh >> 2)); this.bloomB.setSize(Math.max(1, rw >> 2), Math.max(1, rh >> 2)); }
    this.blitMat.uniforms.depthTex.value = this.rt.depthTexture; this.blitMat.uniforms.res.value.set(rw, rh);
    this.blitMat.uniforms.bloomTex.value = this.bloomA.texture;
    const aspect = w / h; this.camera.aspect = aspect;
    const hf = (this.opts.fov || 100) * Math.PI / 360; this.camera.fov = Math.max(56, Math.min(80, 2 * Math.atan(Math.tan(hf) / aspect) * 180 / Math.PI));
    this.camera.updateProjectionMatrix();
    if (this.flashlight) { const sm = G.shadow; if (this.flashlight.shadow.mapSize.width !== sm) { this.flashlight.shadow.mapSize.set(sm, sm); if (this.flashlight.shadow.map) { this.flashlight.shadow.map.dispose(); this.flashlight.shadow.map = null; } } }
    this.hud.resize(w, h);
  }

  async init(onProgress) {
    onProgress(0.05, 'Generating textures');
    this.T = await loadTextures(); this.applyTexQuality();
    onProgress(0.15, 'Loading CornPop');
    this.cpAsset = await new CornPopAsset().load('assets/models/cornpop.glb', p => onProgress(0.15 + p * 0.4, 'Loading CornPop'));
    onProgress(0.55, 'Loading Qoq');
    this.qoqAsset = await new CornPopAsset().load('assets/models/qoq.glb', p => onProgress(0.55 + p * 0.25, 'Loading Qoq'));
    this.qoqAsset.animMap = QOQ_ANIMS;
    onProgress(0.8, 'Loading Marv');
    this.marvAsset = await new CornPopAsset().load('assets/models/marv.glb', p => onProgress(0.8 + p * 0.1, 'Loading Marv'));
    this.marvAsset.animMap = MARV_ANIMS;
    this.ballinkiAsset = await new CornPopAsset().load('assets/models/ballinki.glb', p => onProgress(0.9 + p * 0.06, 'Loading Ballinki'));
    this.ballinkiAsset.animMap = BALLINKI_ANIMS;
    this.frentaAsset = await new CornPopAsset().load('assets/models/frenta.glb', p => onProgress(0.96 + p * 0.03, 'Loading Frenta'));
    this.frentaAsset.animMap = FRENTA_ANIMS;
    this.beansAsset = await new CornPopAsset().load('assets/models/beans.glb', p => onProgress(0.99, 'Loading Beans'));
    { const c = this.beansAsset.clips, sub = (src, name, a, b) => { c[name] = THREE.AnimationUtils.subclip(c[src], name, a, b, 30); }; // Beans ships with walk/run only
      sub('Walking', 'B_idle', 0, 2); sub('Running', 'B_attack', 0, 20); sub('Walking', 'B_pain', 6, 16); }
    this.beansAsset.animMap = BEANS_ANIMS;
    try { this.bcmAsset = await new CornPopAsset().load('assets/models/bcm.glb', p => onProgress(0.99, 'Loading BCM')); this.bcmAsset.animMap = BCM_ANIMS; } catch (e) { console.warn('BCM model missing', e); this.bcmAsset = null; }
    try { this.tropAsset = await new CornPopAsset().load('assets/models/trop.glb', p => onProgress(0.995, 'Loading Trop')); this.tropAsset.animMap = TROP_ANIMS; } catch (e) { console.warn('Trop model missing', e); this.tropAsset = null; }
    this.soaker = new Soaker(this); this.shotgun = new Shotgun(this); this.candygun = new CandyGun(this); this.turdgun = new TurdLauncher(this); this.arsenal = new Arsenal(this); this.aim = new THREE.Object3D();
    for (const w of Object.values(this.arsenal.guns)) try { this.renderer.compile(w.scene, w.cam); } catch (e) { } // no shader hitch on the first switch
    this.carry = this.freshCarry(0);
    this.gooCanvas = document.createElement('canvas'); this.gooCanvas.width = 160; this.gooCanvas.height = 96;
    this.gooTex = new THREE.CanvasTexture(this.gooCanvas); this.gooTex.magFilter = THREE.NearestFilter; this.gooTex.minFilter = THREE.NearestFilter; this.gooTex.generateMipmaps = false;
    this.blitMat.uniforms.gooTex.value = this.gooTex;
    this.portrait = new Portrait(this.cpAsset, 64);
    this.body = this.cpAsset.instance();
    const s = PLAYER_HEIGHT / 1.94; this.body.root.scale.setScalar(s);
    for (const m of this.body.mats) { m.emissiveMap = m.map; m.emissive = new THREE.Color(0, 0, 0); }
    this.bodyAmb = new THREE.AmbientLight(0xffffff, 0.15); this.bodySun = new THREE.DirectionalLight(0xffffff, 0.55); this.bodySun.position.set(0.3, 1, 0.4); this.bodySun.castShadow = true;
    onProgress(1, 'Ready');
    this.matCache = new Map();
    requestAnimationFrame(t => this.frame(t));
  }

  // ---- materials ----
  worldMat(tex, o = {}) {
    const key = tex + (o.sky ? 's' : '') + (o.fullbright ? 'f' : '') + (o.nolm ? 'n' : '') + (o.liquid ? 'l' : '');
    if (this.matCache.has(key)) return this.matCache.get(key);
    const map = this.T[tex] || this.T.brick;
    let m;
    const S = this.shared;
    if (o.sky) m = new THREE.ShaderMaterial({ uniforms: { map: { value: map }, time: S.time, camPos: S.camPos, tint: { value: new THREE.Color(...(this.level?.skyTint || [0.8, 0.6, 1.0])) }, city: S.city, storm: S.storm, bolt: S.bolt, boltAz: S.boltAz, boltSeed: S.boltSeed, fogColor: S.fogColor }, vertexShader: WORLD_VERT, fragmentShader: SKY_FRAG });
    else m = new THREE.ShaderMaterial({
      uniforms: { map: { value: map }, lm: this.shared.lm, sm: this.shared.sm, st: this.shared.st, fogColor: this.shared.fogColor, fogDensity: this.shared.fogDensity, time: this.shared.time, fullbright: { value: o.fullbright || o.liquid ? 1 : 0 }, nolm: { value: o.nolm || o.liquid ? 1 : 0 }, scroll: { value: new THREE.Vector2(...(this.scrollTex?.[tex] || (o.liquid ? [0.02, 0.01] : [0, 0]))) }, warp: { value: o.liquid ? 1 : 0 }, alpha: { value: o.liquid ? 0.82 : 1 }, lightning: S.lightning, wetOn: o.liquid ? { value: 0 } : S.wetOn },
      vertexShader: WORLD_VERT, fragmentShader: WORLD_FRAG, transparent: !!o.liquid, depthWrite: !o.liquid,
    });
    this.matCache.set(key, m); return m;
  }
  propMat(tex, fullbright) {
    const map = this.T[tex] || this.T.brick;
    if (fullbright) return new THREE.MeshBasicMaterial({ map, fog: true }); // lamps, neon, lit signs: unlit glow
    const mat = new THREE.MeshStandardMaterial({ map, roughness: tex.includes('steel') ? 0.25 : 0.7, metalness: tex.includes('steel') ? 0.8 : 0.1, vertexColors: true, envMap: this.envMap });
    if (this.T[tex + 'Normal']) mat.normalMap = this.T[tex + 'Normal'];
    return mat;
  }

  // starting kit when a map is entered fresh: from E1M2 on you have the soaker. The shotgun lies at the start of E1M2 and the
  // candy corn machine gun at the start of E1M3; in the maps after those each one turns up somewhere random
  // Episode 2 starts with the soaker and the shotgun; its later maps (picked from Select Level) also hand over the candy gun (E2M3+) and the turd launcher (E2M5+)
  freshCarry(i) {
    const { ep, mi } = episodeOf(i);
    if (ep === 1) return { health: 100, ammo: SOAKER.startAmmo + 50, hasSoaker: true, hasShotgun: true, sausages: 24, hasCandy: mi >= 2, candy: mi >= 2 ? 120 : 0, hasTurd: mi >= 4, turds: mi >= 4 ? 8 : 0, inv: Arsenal.freshInv(ep, mi), weapon: 'shotgun' };
    return { health: 100, ammo: i > 0 ? SOAKER.startAmmo : 0, hasSoaker: i > 0, hasShotgun: false, sausages: 0, hasCandy: false, candy: 0, hasTurd: false, turds: 0, inv: Arsenal.freshInv(ep, mi), weapon: 'soaker' };
  }
  // carry health / ammo / weapon between levels (mode: new | select | next | restart)
  prepareCarry(i, mode) {
    if (mode === 'new') this.carry = this.freshCarry(i);
    else if (mode === 'select') this.carry = this.freshCarry(i);
    else if (mode === 'restart') this.carry = { ...(this.levelStartCarry || this.freshCarry(i)) };
    if (this.carry.health <= 0) this.carry.health = 100;
  }

  // ---- level loading ----
  async loadLevel(i, onProgress = () => { }) {
    this.state = 'loading'; this.levelIndex = i;
    const def = LEVELS[i]; this.level = def; this.matCache.clear();
    this.scrollTex = def.scroll || {};
    if (this.world) { this.world.lmTex && this.world.lmTex.dispose(); this.world.smTex && this.world.smTex.dispose(); }
    // give the old map's GPU buffers, shaders and generated textures back (three re-uploads anything shared when it's next drawn).
    // Before v0.22 nothing was freed, so every map left its geometry behind and phones ran out of graphics memory after a few maps.
    for (const o of this.scene.children) this.freeGPU(o, true);
    while (this.scene.children.length) this.scene.remove(this.scene.children[0]);
    if (this.director) { this.director.clear(); this.director = null; }
    const W = new World(def, this.T); this.world = W;
    W.parseGrid(); W.genGridFaces(); W.genGridBrushes(); W.genDoors();
    const props = new PropBuilder(W);
    this.ents = []; this.buttons = []; this.beams = []; this.emitters = []; this.ambients = [];
    const ctx = this.makeCtx(W, props);
    def.build(ctx);
    W.packLightmaps();
    onProgress(0.05);
    await W.bake(p => onProgress(0.05 + p * 0.85));
    this.shared.lm.value = null; this.shared.sm.value = null;
    const root = W.buildMeshes((tex, o) => this.worldMat(tex, o));
    this.shared.lm.value = W.lmTex; this.shared.sm.value = W.smTex;
    this.scene.add(root);
    this.scene.add(props.build(t => this.propMat(t)));
    W.finalizeCollision();
    this.buildBeams();
    onProgress(0.95);
    // fog
    const fog = def.fog || { color: [0, 0, 0], density: 0.0008 };
    this.scene.fog = new THREE.FogExp2(new THREE.Color(...fog.color), fog.density);
    this.shared.fogColor.value.setRGB(...fog.color); this.shared.fogDensity.value = fog.density;
    this.scene.background = new THREE.Color(...fog.color);
    // entities
    this.keys = new Set(); this.slices = 0; this.secrets = 0; this.time = 0;
    this.slicesTotal = this.ents.filter(e => e.type === 'slice').length; this.secretsTotal = this.ents.filter(e => e.type === 'secret').length + this.world.movers.filter(m => m.secret).length;
    this.health = this.carry.health; this.ammo = this.carry.ammo; this.hasSoaker = this.carry.hasSoaker; this.levelStartCarry = { ...this.carry };
    this.hasShotgun = !!this.carry.hasShotgun; this.sausages = this.carry.sausages || 0; this.hasCandy = !!this.carry.hasCandy; this.candy = this.carry.candy || 0; this.hasTurd = !!this.carry.hasTurd; this.turds = this.carry.turds || 0;
    this.arsenal.load(this.carry.inv); this.arsenal.reset();
    this.weapon = this.hasWeapon(this.carry.weapon) ? this.carry.weapon : 'soaker'; this.candyShots = []; this.turdShots = []; this.fireballs = [];
    this.gooT = 0; this.blitMat.uniforms.goo.value = 0; this.tissues = []; this.sausageShots = []; this.farts = []; this.piles = []; this.potatoes = []; this.debris = []; this.sickT = 0; this.retchT = 0; this.retchCd = 0;
    this.fires = [];
    this.kills = 0; this.playerDead = false; this.noiseT = 0; this.trail = []; this.chickens = []; this.droplets = []; this.puddles = []; this.splashT = 0;
    this.particles = new Particles(this.scene); this.dropFx = new Particles(this.scene, 400); this.dropFx.points.material.size = 4.2;
    const { ep, mi } = episodeOf(i); this.ep = ep; this.mi = mi;
    if (ep === 1) { // Episode 2 (New York): the whole gang from the first street - Marvs, Ballinkis, a rising share of Frentas (1 in 9 ... 1 in 4), Beans
      let n = 0, j = 0;
      for (const e of this.ents) { if (e.type === 'qoq') { const k = n++; const fr = [9, 8, 7, 6, 6, 5, 5, 4][mi]; if (k % 4 === 2) e.type = 'marv'; else if (k % 5 === 4 && !e.turret) e.type = 'ballinki'; else if (k % fr === 1) e.type = 'frenta'; } else if (e.type === 'juice') { const q = j++ % 8; if (q === 1 || q === 5) { e.type = 'sausages'; e.amount = SHOTGUN.boxAmmo; } else if (q === 6) { e.type = 'candybag'; e.amount = CANDYGUN.bagAmmo; } else if (q === 2 && mi >= 2) { e.type = 'turdbox'; e.amount = TURD.boxAmmo; } } }
    } else if (i > 0) { // every 4th Qoq in E1M2+ is a Marv, from E1M4 every 5th a Ballinki, and a growing share are Frentas (1 in 14 in E1M2 ... 1 in 4 in E1M8); some juice jugs become sausage boxes / candy bags
      let n = 0, j = 0;
      for (const e of this.ents) { if (e.type === 'qoq') { const k = n++; const fr = [0, 14, 11, 9, 8, 6, 5, 4][i]; if (k % 4 === 2) e.type = 'marv'; else if (i >= 3 && k % 5 === 4 && !e.turret) e.type = 'ballinki'; else if (fr && k % fr === 1) e.type = 'frenta'; } else if (e.type === 'juice' && j++ % 4 === 1) { e.type = 'sausages'; e.amount = SHOTGUN.boxAmmo; } else if (i >= 2 && e.type === 'juice' && (j - 1) % 8 === 6) { e.type = 'candybag'; e.amount = CANDYGUN.bagAmmo; } else if (i >= 3 && e.type === 'juice' && (j - 1) % 8 === 2) { e.type = 'turdbox'; e.amount = TURD.boxAmmo; } }
    }
    { let b = 0; for (const e of this.ents) if (e.type === 'qoq' && b++ % 2 === 1) e.type = 'beans'; } // half of the remaining Qoqs are Beans
    this.placeExtras(i);
    for (const e of this.ents) this.spawnEnt(e);
    this.enemies = this.ents.filter(e => ['qoq', 'marv', 'ballinki', 'frenta', 'beans'].includes(e.type)).map(e => new Qoq(this, e));
    this.shootables = this.ents.filter(e => e.type === 'button' && e.shoot);
    this.killsTotal = this.enemies.length;
    this.playerBrush = W.addDynamic({ min: [0, 0, 0], max: [0, 0, 0], solid: false, shadow: false });
    this.waves = new Map();
    for (const e of this.ents) if (e.type === 'wave') this.waves.set(e.id, { def: e, members: [], state: 'idle' });
    for (const q of this.enemies) if (q.waveId) { const w = this.waves.get(q.waveId); if (w) w.members.push(q); else console.warn('qoq in unknown wave', q.waveId); }
    this.sfx.setAmbientEmitters(this.ambients);
    this.soaker.raise = 0;
    this.scene.add(this.body.root); this.scene.add(this.bodyAmb); this.scene.add(this.bodySun);
    this.setupRain(def.rain);
    // weather: wet reflective ground under the rain, New York sky, lightning storms
    this.shared.wetOn.value = def.rain || def.wet ? 1 : 0; this.shared.city.value = def.city ? 1 : 0;
    this.baseFog = (def.fog || { color: [0, 0, 0] }).color.slice();
    this.storm = def.storm ? { cfg: def.storm, next: 2 + Math.random() * 4, t: 99, pulses: [], power: 0 } : null;
    this.shared.lightning.value = this.shared.storm.value = this.shared.bolt.value = 0;
    // player
    this.player = new Player(W);
    const st = this.ents.find(e => e.type === 'start');
    this.player.spawn(st.pos, st.angle || 0);
    // dynamic flashlight for high-end devices
    this.flashlight = new THREE.SpotLight(0xffffff, 1.5, 800, Math.PI / 6, 0.3, 1);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.width = this.gfx().shadow;
    this.flashlight.shadow.mapSize.height = this.gfx().shadow;
    this.scene.add(this.flashlight);
    this.scene.add(this.flashlight.target);
    this.director = new BossDirector(this); // BCM, the boss who now and then turns up in a big room
    this.trops = new TropDirector(this);    // Trop, sent in when CornPop is having it too easy
    this.lastHurtT = -1e9;
    this.lockMsgT = 0; this.flash = null; this.intermission = null;
    this.sfx.startAmbient(def.ambience || 'cave');
    this.sfx.playSong(def.music || null);
    this.hud.notify = []; this.hud.centerPrint(def.title, 3.5);
    this.portrait.cp.setState('idle', 0, true);
    this.state = 'play'; this.input.enabled = true; this.clock.getDelta();
  }

  makeCtx(W, props) {
    const game = this;
    return {
      W, props, T: this.T, C: c => c * CELL,
      floor: (c, r) => W.cell(c, r).f ?? 0,
      brush: (min, max, o = {}) => W.addBrush({ min, max, ...o }),
      box: (c0, r0, c1, r1, y0, y1, o = {}) => W.addBrush({ min: [c0 * CELL, y0, r0 * CELL], max: [c1 * CELL, y1, r1 * CELL], ...o }),
      decal: d => W.addDecal(d),
      light: (x, y, z, light = 200, color = [1, 1, 1], style = 0, o = {}) => W.addLight({ pos: [x, y, z], light, color, style, ...o }),
      ent: e => { game.ents.push(e); if (e.type === 'teleport') (W.navLinks || (W.navLinks = [])).push({ kind: 'tele', from: [(e.min[0] + e.max[0]) / 2, e.min[1], (e.min[2] + e.max[2]) / 2], to: e.dest }); return e; },
      at: (c, r, dy = 0) => [c * CELL + CELL / 2, (W.cell(Math.floor(c), Math.floor(r)).f ?? 0) + dy, r * CELL + CELL / 2],
      mover: m => W.addMover(m),
      button: b => { W.addBrush({ min: b.min, max: b.max, invisible: true, noshadow: true }); return game.ents.push({ type: 'button', ...b }); },
      breakable: b => W.addMover({ type: 'breakable', min: b.min, max: b.max, tex: b.tex || 'boards', topTex: b.tex || 'boards', align: 'world', travel: 0, health: b.health || 30, name: b.name, secret: b.secret }),
      lift: b => { const m = W.addMover({ type: 'plat', min: b.min, max: b.max, tex: b.side || 'lift', topTex: b.top || 'lift', align: 'world', travel: b.travel, speed: b.speed || 150, wait: b.wait ?? 2, skip: ['bottom'] }); (W.navLinks || (W.navLinks = [])).push({ kind: 'lift', from: [(b.min[0] + b.max[0]) / 2, b.max[1], (b.min[2] + b.max[2]) / 2], to: [(b.min[0] + b.max[0]) / 2, b.max[1] + b.travel, (b.min[2] + b.max[2]) / 2], mover: m }); return m; },
      beam: b => game.beams.push(b),
      emitter: e => game.emitters.push({ t: 0, ...e }),
      ambient: a => game.ambients.push(a),
    };
  }

  spawnEnt(e) {
    const T = this.T;
    if (e.type === 'fire') {
      if (!this.fireGeo) this.fireGeo = new THREE.PlaneGeometry(1, 1);
      const grp = new THREE.Group(); grp.position.set(...e.pos);
      for (let k = 0; k < 2; k++) { const m = new THREE.Mesh(this.fireGeo, new THREE.ShaderMaterial({ uniforms: { time: this.shared.time, seed: { value: Math.random() * 50 }, size: { value: e.size * (k ? 0.7 : 1) }, fogDensity: this.shared.fogDensity }, vertexShader: FIRE_VERT, fragmentShader: FIRE_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
        m.position.set((k - 0.5) * e.size * 0.3, 0, (Math.random() - 0.5) * 6); m.frustumCulled = false; m.renderOrder = 5; grp.add(m); }
      this.scene.add(grp); e.mesh = grp; e.t = 0; (this.fires || (this.fires = [])).push(e); return;
    }
    if (e.type === 'start') { e.pos = [e.pos[0], e.pos[1] + 24.1, e.pos[2]]; return; }
    if (e.type === 'key') {
      const c = document.createElement('canvas'); c.width = 32; c.height = 48; const g = c.getContext('2d');
      const [a, b] = KEY_COLORS[e.color]; g.fillStyle = b; g.fillRect(0, 0, 32, 48); g.fillStyle = a; g.fillRect(2, 2, 28, 16);
      g.fillStyle = '#e8d070'; g.fillRect(6, 24, 10, 8); g.fillStyle = '#f0f0e0'; g.fillRect(6, 36, 20, 3); g.fillRect(6, 41, 14, 2); g.fillStyle = '#fff'; g.fillRect(4, 4, 6, 2);
      const tex = new THREE.CanvasTexture(c); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.NoColorSpace;
      const mat = new THREE.MeshBasicMaterial({ map: tex });
      const m = new THREE.Mesh(new THREE.BoxGeometry(14, 21, 1.6), [mat, mat, mat, mat, mat, mat]);
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(36, 36), new THREE.MeshBasicMaterial({ color: new THREE.Color(a), transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.renderOrder = 5; m.add(glow); e.glow = glow;
      e.mesh = m; e.base = e.pos[1] + 26; m.position.set(e.pos[0], e.base, e.pos[2]); this.scene.add(m); return;
    }
    if (e.type === 'slice') {
      const sh = new THREE.Shape(); sh.moveTo(-7, 6); sh.lineTo(7, 6); sh.lineTo(0, -10); sh.lineTo(-7, 6);
      const g = new THREE.ExtrudeGeometry(sh, { depth: 2.5, bevelEnabled: false }); g.translate(0, 0, -1.25);
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 20 + 0.5, uv.getY(i) / 20 + 0.5);
      const m = new THREE.Mesh(g, [new THREE.MeshBasicMaterial({ map: T.pizza }), new THREE.MeshBasicMaterial({ map: T.crust })]);
      const crust = new THREE.Mesh(new THREE.BoxGeometry(16, 3, 3.2), new THREE.MeshBasicMaterial({ map: T.crust })); crust.position.y = 6.5; m.add(crust);
      e.mesh = m; e.base = e.pos[1] + 18; m.position.set(e.pos[0], e.base, e.pos[2]); e.phase = Math.random() * 6; this.scene.add(m); return;
    }
    if (e.type === 'soaker' || e.type === 'juice' || e.type === 'health' || e.type === 'shotgun' || e.type === 'sausages' || e.type === 'sausagehp' || e.type === 'candygun' || e.type === 'candybag' || e.type === 'turdgun' || e.type === 'turdbox') {
      const m = makePickupModel(e.type, T); e.mesh = m; e.base = e.pos[1] + (e.type === 'health' ? 4 : 16); e.item = true; e.phase = Math.random() * 6;
      m.position.set(e.pos[0], e.base, e.pos[2]); this.scene.add(m); return;
    }
    if (this.arsenal.isItem(e.type)) {
      const m = makeW2Pickup(e.type); e.mesh = m; e.base = e.pos[1] + 16; e.item = true; e.phase = Math.random() * 6;
      m.position.set(e.pos[0], e.base, e.pos[2]); this.scene.add(m); return;
    }
    if (e.type === 'portal') {
      const m = new THREE.Mesh(new THREE.CircleGeometry(e.r || 40, 32), new THREE.ShaderMaterial({ uniforms: { time: this.shared.time, color: { value: new THREE.Color(...(e.color || [1, 0.35, 0.1])) } }, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }', fragmentShader: PORTAL_FRAG, side: THREE.DoubleSide }));
      m.position.set(...e.pos); m.rotation.y = e.ry || 0; this.scene.add(m); e.mesh = m; return;
    }
    if (e.type === 'button') {
      e.pressed = false; const w = e.max[0] - e.min[0], h = e.max[1] - e.min[1], d = e.max[2] - e.min[2];
      const L = this.world.lightAt([(e.min[0] + e.max[0]) / 2, e.max[1] + 8, (e.min[2] + e.max[2]) / 2], null);
      const base = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.5, d), new THREE.MeshBasicMaterial({ map: T.metal, color: new THREE.Color(L[0] / 128, L[1] / 128, L[2] / 128) }));
      base.position.set((e.min[0] + e.max[0]) / 2, e.min[1] + h * 0.25, (e.min[2] + e.max[2]) / 2);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(Math.min(w, d) * 0.32, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff2010 }));
      dome.position.y = h * 0.25; base.add(dome); e.dome = dome; e.mesh = base; this.scene.add(base); return;
    }
  }

  buildBeams() {
    for (const b of this.beams) {
      const h = b.y1 - b.y0, g = new THREE.BoxGeometry(b.w || 48, h, b.d || 48, 1, 1, 1);
      const col = new Float32Array(g.attributes.position.count * 3); const c = b.color || [0.9, 0.95, 1];
      for (let i = 0; i < g.attributes.position.count; i++) { const k = 0.5 + g.attributes.position.getY(i) / h; col.set([c[0] * k, c[1] * k, c[2] * k], i * 3); }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: b.opacity ?? 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: true }));
      m.position.set(b.x, (b.y0 + b.y1) / 2, b.z); m.renderOrder = 4; this.scene.add(m);
      this.emitters.push({ t: 0, type: 'dust', min: [b.x - (b.w || 48) / 2, b.y0, b.z - (b.d || 48) / 2], max: [b.x + (b.w || 48) / 2, b.y1, b.z + (b.d || 48) / 2], rate: 6 });
    }
  }
  updateEmitters(dt) {
    const p = this.player.pos;
    for (const f of this.fires || []) {
      if (Math.abs(f.pos[0] - p[0]) > 1300 || Math.abs(f.pos[2] - p[2]) > 1300) continue;
      f.t += dt * (2 + f.size * 0.08);
      while (f.t > 1) { f.t -= 1; const s = f.size, at = [f.pos[0] + (Math.random() - 0.5) * s * 0.6, f.pos[1] + s * 0.3, f.pos[2] + (Math.random() - 0.5) * s * 0.6];
        this.particles.spawn(at, [(Math.random() - 0.5) * 40, 60 + Math.random() * 90, (Math.random() - 0.5) * 40], [1, 0.55 + Math.random() * 0.3, 0.15], 0.9 + Math.random() * 0.8, -20, 0.6);
        if (f.smoke && Math.random() < 0.6) this.particles.spawn([at[0], f.pos[1] + s * 1.4, at[2]], [(Math.random() - 0.5) * 16 + 12, 50 + Math.random() * 30, (Math.random() - 0.5) * 16], [0.09, 0.085, 0.08], 3.5, -6, 0.2); }
    }
    for (const e of this.emitters) {
      if (Math.abs(e.min[0] - p[0]) > 1400 || Math.abs(e.min[2] - p[2]) > 1400) continue;
      e.t += dt * (e.rate || 5);
      while (e.t > 1) {
        e.t -= 1; const at = [e.min[0] + Math.random() * (e.max[0] - e.min[0]), e.min[1] + Math.random() * (e.max[1] - e.min[1]), e.min[2] + Math.random() * (e.max[2] - e.min[2])];
        if (e.type === 'dust') this.particles.spawn(at, [(Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 6], [0.7, 0.68, 0.6], 4, 0);
        else if (e.type === 'steam') this.particles.spawn(at, [(Math.random() - 0.5) * 10, 40 + Math.random() * 30, (Math.random() - 0.5) * 10], [0.55, 0.55, 0.55], 1.6, -10, 0.8);
        else if (e.type === 'drip') this.particles.spawn([at[0], e.max[1], at[2]], [0, 0, 0], [0.35, 0.45, 0.5], 1.5, 500);
        else if (e.type === 'sparks') this.particles.spawn(at, [(Math.random() - 0.5) * 140, 60 + Math.random() * 80, (Math.random() - 0.5) * 140], [1, 0.8, 0.3], 0.6, 600);
        else if (e.type === 'bubbles') this.particles.spawn(at, [0, 18 + Math.random() * 12, 0], e.color || [1, 0.4, 0.2], 0.8, 0);
      }
    }
  }
  teleportFx(p) { for (let i = 0; i < 40; i++) { const a = Math.random() * Math.PI * 2, r = Math.random() * 20; this.particles.spawn([p[0] + Math.cos(a) * r, p[1] - 20 + Math.random() * 56, p[2] + Math.sin(a) * r], [Math.cos(a) * 30, 40 + Math.random() * 60, Math.sin(a) * 30], [1, 0.75, 0.25], 0.9, -30, 1); } }
  startWave(w) {
    if (w.state !== 'idle') return; w.state = 'active';
    if (w.def.msg) this.message(w.def.msg);
    for (const name of (w.def.lock || [])) for (const m of this.world.movers) if (m.name === name) { m.locked = true; if (m.state !== 'closed') { m.state = 'closing'; this.sfx.play('door'); } }
    for (const name of (w.def.release || [])) for (const m of this.world.movers) if (m.name === name) { m.targeted = false; this.openDoor(m); }
    const sec = v => (v > 20 ? v / 1000 : v); // stagger / delay accept seconds (or legacy ms)
    w.queue = w.members.map((q, i) => ({ q, at: this.time + sec(w.def.stagger ?? 0.35) * i + sec(q.delay || 0) }));
    if (!w.members.length) this.endWave(w);
  }
  endWave(w) {
    w.state = 'done';
    for (const name of (w.def.lock || [])) for (const m of this.world.movers) if (m.name === name) { m.locked = false; }
    for (const name of (w.def.opens || [])) for (const m of this.world.movers) if (m.name === name) { m.targeted = false; this.openDoor(m); }
    if (w.def.lock?.length || w.def.opens?.length || w.def.doneMsg) { this.hud.print(w.def.doneMsg || 'The way is open!'); this.sfx.play('secret'); }
    if (w.def.next) { const nw = this.waves.get(w.def.next); if (nw) { nw.pendingAt = this.time + (w.def.nextDelay ?? 2.5); } }
  }
  updateWaves() {
    if (this.director && this.director.active) return; // nothing else spawns while BCM is around
    for (const w of this.waves.values()) {
      if (w.queue && w.queue.length) { w.queue = w.queue.filter(({ q, at }) => { if (this.time < at) return true; if (q.dormant) { q.activate(); this.teleportFx(q.pos); this.sfx.play('spawn'); } return false; }); }
      if (w.state === 'idle' && w.def.onKey && this.keys.has(w.def.onKey)) this.startWave(w);
      if (w.state === 'idle' && w.pendingAt && this.time >= w.pendingAt) this.startWave(w);
      if (w.state === 'active' && !(w.queue && w.queue.length) && w.members.every(q => !q.alive && !q.dormant)) this.endWave(w);
    }
  }
  riders(m, delta) {
    const lift = (pos) => pos[0] + HULL_MAX[0] > m.brush.min[0] && pos[0] + HULL_MIN[0] < m.brush.max[0] && pos[2] + HULL_MAX[2] > m.brush.min[2] && pos[2] + HULL_MIN[2] < m.brush.max[2] && Math.abs(pos[1] + HULL_MIN[1] - m.brush.max[1]) < 3;
    const out = []; if (lift(this.player.pos)) out.push(this.player.pos); for (const q of this.enemies) if (q.alive && !q.dormant && lift(q.pos)) out.push(q.pos);
    return out;
  }
  updatePlats(dt) {
    for (const m of this.world.movers) {
      if (m.type !== 'plat') continue;
      const ride = this.riders(m, 0); const occupied = ride.includes(this.player.pos) || this.enemies.some(q => q.kind === 'trop' && q.alive && ride.includes(q.pos)); // the player (and Trop, who follows him) call lifts
      if (m.state === 'closed' && occupied) { m.t = (m.t || 0) + dt; if (m.t > 0.35) { m.state = 'opening'; m.t = 0; this.sfx.play('lift'); } } else if (m.state === 'closed') m.t = 0;
      let off = m.offset;
      if (m.state === 'opening') { off = Math.min(m.travel, off + m.speed * dt); if (off >= m.travel) { m.state = 'open'; m.t = 0; this.sfx.play('doorstop'); } }
      else if (m.state === 'open') { if (occupied) m.t = 0; else { m.t += dt; if (m.t > m.wait) { m.state = 'closing'; this.sfx.play('lift'); } } }
      else if (m.state === 'closing') {
        off = Math.max(0, off - m.speed * dt);
        const mn = [m.base.min[0], m.base.min[1] + off, m.base.min[2]], mx = [m.base.max[0], m.base.max[1] + off, m.base.max[2]];
        const under = (pos) => this.overlap(pos, mn, mx);
        if (under(this.player.pos) || this.enemies.some(q => q.alive && under(q.pos))) { off = m.offset; } // blocked: wait, don't bounce back up
        else if (off <= 0) { m.state = 'closed'; m.t = 0; this.sfx.play('doorstop'); }
      }
      if (off !== m.offset) {
        const d = off - m.offset; for (const pos of ride) pos[1] += d;
        m.offset = off; m.brush.min[1] = m.base.min[1] + off; m.brush.max[1] = m.base.max[1] + off; m.group.position.y = m.base.min[1] + off;
      }
    }
  }
  breakMover(m) {
    if (m.broken) return; m.broken = true; m.group.visible = false; this.world.removeBrush(m.brush); this.sfx.play('break');
    const c = [(m.min[0] + m.max[0]) / 2, (m.min[1] + m.max[1]) / 2, (m.min[2] + m.max[2]) / 2];
    for (let i = 0; i < 30; i++) this.particles.spawn([m.min[0] + Math.random() * (m.max[0] - m.min[0]), m.min[1] + Math.random() * (m.max[1] - m.min[1]), m.min[2] + Math.random() * (m.max[2] - m.min[2])], [(Math.random() - 0.5) * 200, Math.random() * 150, (Math.random() - 0.5) * 200], [0.55, 0.38, 0.2], 1.4, 600);
    if (m.secret) { this.secrets++; this.message('You found a secret area!'); this.sfx.play('secret'); }
  }

  dropPickup(type, pos, amount) { const e = { type, pos: pos.slice(), amount, dropped: true }; this.ents.push(e); this.spawnEnt(e); }

  // ---- projectiles ----
  spawnChicken(from, v, owner) {
    const m = makeChicken(); m.position.set(...from); this.scene.add(m);
    this.chickens.push({ p: from.slice(), v: v.slice(), mesh: m, owner, t: 0, spin: [Math.random() * 6 - 3, Math.random() * 4 - 2] });
  }
  updateChickens(dt) {
    const pl = this.player, keep = [];
    for (const c of this.chickens) {
      c.t += dt; c.v[1] -= QOQ.chickenGravity * dt;
      const p1 = [c.p[0] + c.v[0] * dt, c.p[1] + c.v[1] * dt, c.p[2] + c.v[2] * dt];
      let dead = false;
      if (!this.playerDead && segAabb(c.p, p1, [pl.pos[0] - 18, pl.pos[1] - 26, pl.pos[2] - 18], [pl.pos[0] + 18, pl.pos[1] + 34, pl.pos[2] + 18]) >= 0) {
        this.damagePlayer(QOQ.chickenDamage); this.flash = { rgb: [1, 0.55, 0.5], a: 0.4 }; this.featherBurst(c.p, 6, true); this.sfx.play('chickenHit'); dead = true;
      } else {
        const tr = this.world.trace(c.p, p1, [-3, -3, -3], [3, 3, 3], null, true);
        if (tr.fraction < 1) { this.featherBurst(tr.end, 10); this.sfx.play('feathers'); dead = true; }
      }
      if (dead || c.t > 6) { this.scene.remove(c.mesh); continue; }
      c.p = p1; c.mesh.position.set(...p1);
      // face the flight direction and flap
      c.mesh.rotation.set(0, Math.atan2(-c.v[2], c.v[0]), Math.atan2(c.v[1], Math.hypot(c.v[0], c.v[2])) * 0.6 + Math.sin(c.t * 9) * 0.25);
      const w = c.mesh.userData.wings; w[0].rotation.x = Math.sin(c.t * 40) * 0.8; w[1].rotation.x = -Math.sin(c.t * 40) * 0.8;
      const L = this.pointLight(p1); for (const mt of c.mesh.userData.mats) { if (!mt.userData.base) mt.userData.base = mt.color.clone(); mt.color.copy(mt.userData.base).multiply(new THREE.Color(Math.max(0.55, L[0]), Math.max(0.55, L[1]), Math.max(0.55, L[2]))); }
      keep.push(c);
    }
    this.chickens = keep;
  }
  featherBurst(p, n, away) {
    if (away) { const e = this.player.eye(); const d = [p[0] - e[0], p[1] - e[1], p[2] - e[2]]; const l = Math.hypot(...d) || 1; if (l < 60) p = [e[0] + d[0] / l * 60, e[1] + d[1] / l * 60, e[2] + d[2] / l * 60]; }
    for (let i = 0; i < n; i++) this.particles.spawn(p, [(Math.random() - 0.5) * 160, Math.random() * 120, (Math.random() - 0.5) * 160], [1, 1, 1], 1.2 + Math.random(), 120, 2.5); }
  spawnDroplet(from, v) {
    // never start the stream on the far side of a wall right in front of the nozzle
    const eye = this.player.eye(); const tr = this.world.trace(eye, from, [-1, -1, -1], [1, 1, 1], null, true);
    const p = tr.fraction < 1 ? tr.end : from;
    const d = { p: p.slice(), vel: v, v: [0, 0, 0], c: [1, 0.88 + Math.random() * 0.1, 0.12], life: 99, t: 0, grav: 0, drag: 0, age: 0 };
    this.droplets.push(d);
  }
  updateDroplets(dt) {
    const keep = [];
    for (const d of this.droplets) {
      d.age += dt; d.vel[1] -= SOAKER.gravity * dt;
      const p1 = [d.p[0] + d.vel[0] * dt, d.p[1] + d.vel[1] * dt, d.p[2] + d.vel[2] * dt];
      let best = 2, hitE = null;
      for (const e of this.enemies) { if (!e.alive) continue; const t = segAabb(d.p, p1, [e.pos[0] - (e.K.hw || 18), e.pos[1] - 26, e.pos[2] - (e.K.hw || 18)], [e.pos[0] + (e.K.hw || 18), e.pos[1] + e.K.height - 22, e.pos[2] + (e.K.hw || 18)]); if (t >= 0 && t < best) { best = t; hitE = e; } }
      const tr = this.world.trace(d.p, p1, [-1, -1, -1], [1, 1, 1], null, true);
      if (hitE && best <= tr.fraction) {
        const hp = [d.p[0] + (p1[0] - d.p[0]) * best, d.p[1] + (p1[1] - d.p[1]) * best, d.p[2] + (p1[2] - d.p[2]) * best];
        hitE.hurt(SOAKER.damage, true); this.splash(hp, 3); continue;
      }
      let hitB = null, bt = 2;
      for (const b of this.shootables) { if (b.pressed) continue; const t = segAabb(d.p, p1, [b.min[0] - 3, b.min[1] - 3, b.min[2] - 3], [b.max[0] + 3, b.max[1] + 3, b.max[2] + 3]); if (t >= 0 && t < bt) { bt = t; hitB = b; } }
      if (hitB && bt <= tr.fraction + 0.05) { this.pressButton(hitB); this.splash(d.p, 3); continue; }
      if (tr.fraction < 1) {
        const mv = tr.brush && tr.brush.mover; if (mv && mv.type === 'breakable') { mv.health -= SOAKER.damage * 1.5; if (mv.health <= 0) this.breakMover(mv); }
        this.splash(tr.end, 3); if (tr.normal && tr.normal[1] > 0.7 && Math.random() < 0.3) this.addPuddle(tr.end); continue;
      }
      if (d.age > 3) continue;
      d.p = p1; keep.push(d);
    }
    this.droplets = keep; this.dropFx.list = keep; this.dropFx.update(0);
  }
  splash(p, n) {
    for (let i = 0; i < n; i++) this.particles.spawn(p, [(Math.random() - 0.5) * 120, Math.random() * 90, (Math.random() - 0.5) * 120], [1, 0.9, 0.2], 0.35 + Math.random() * 0.2, 500);
    if (this.splashT <= 0) { this.sfx.play('splash'); this.splashT = 0.12; }
  }
  addPuddle(p, color = 0xffe020) {
    if (this.puddles.length > 40) { const o = this.puddles.shift(); this.scene.remove(o.mesh); }
    const m = new THREE.Mesh(new THREE.CircleGeometry(5 + Math.random() * 8, 10), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, fog: true }));
    m.rotation.x = -Math.PI / 2; m.position.set(p[0], p[1] + 0.5, p[2]); this.scene.add(m); this.puddles.push({ mesh: m, t: 0 });
  }
  updatePuddles(dt) { for (const q of this.puddles) { q.t += dt; q.mesh.material.opacity = 0.55 * Math.max(0, 1 - q.t / 14); } const gone = this.puddles.filter(q => q.t > 14); for (const q of gone) this.scene.remove(q.mesh); if (gone.length) this.puddles = this.puddles.filter(q => q.t <= 14); }

  // a free floor spot next to a pickup (same floor height, nothing solid, reachable in a straight line)
  freeSpotNear(pos) {
    const W = this.world, f0 = pos[1];
    for (const [dx, dz] of [[30, 0], [-30, 0], [0, 30], [0, -30], [22, 22], [-22, -22], [22, -22], [-22, 22], [44, 0], [0, 44], [-44, 0], [0, -44]]) {
      const p = [pos[0] + dx, f0, pos[2] + dz];
      const c = W.cell(Math.floor(p[0] / CELL), Math.floor(p[2] / CELL)); if (c.solid || Math.abs(c.f - f0) > 2) continue;
      if (W.testPosition([p[0], f0 + 25, p[2]], [-12, -24, -12], [12, 20, 12])) continue;
      if (W.trace([pos[0], f0 + 20, pos[2]], [p[0], f0 + 20, p[2]], [-8, -8, -8], [8, 8, 8], null, true).fraction < 1) continue;
      return p;
    }
    return null;
  }
  // sausage health kits in every map (+10 health), and the shotgun dropped somewhere random from E1M3 on
  placeExtras(i) {
    const inSecret = p => this.ents.some(s => s.type === 'secret' && p[0] >= s.min[0] && p[0] <= s.max[0] && p[2] >= s.min[2] && p[2] <= s.max[2] && p[1] >= s.min[1] - 8 && p[1] <= s.max[1]);
    const items = this.ents.filter(e => e.pos && ['juice', 'slice', 'health', 'sausages', 'candybag', 'turdbox'].includes(e.type) && !e.dropped);
    let n = 0;
    for (const e of items) {
      if (n++ % 3 !== 1) continue;
      const p = this.freeSpotNear(e.pos); if (p) this.ents.push({ type: 'sausagehp', pos: p, amount: 10 });
    }
    const pool = items.filter(e => !inSecret(e.pos));
    const drop = type => { for (let tries = 0; tries < 20 && pool.length; tries++) { const e = pool[Math.floor(Math.random() * pool.length)]; const p = this.freeSpotNear(e.pos); if (p) { this.ents.push({ type, pos: p }); return; } } };
    const { ep, mi } = episodeOf(i);
    this.arsenal.placeAll(drop, ep, mi, i);
    if (ep === 1) { drop('shotgun'); if (mi >= 2) drop('candygun'); if (mi >= 4) drop('turdgun'); return; } // E2: candy gun lies at the start of E2M2, the turd launcher at the start of E2M4
    if (i >= 2) drop('shotgun');
    if (i >= 3) drop('candygun');
    if (i >= 4) drop('turdgun');
  }
  // don't let CornPop stand on a Qoq's head: slide him off sideways (and give the Qoq a shove the other way)
  slideOffHeads() {
    const p = this.player.pos;
    for (const e of this.enemies) {
      if (!e.alive || e.dormant) continue; const top = e.brush.max[1];
      const dx = p[0] - e.pos[0], dz = p[2] - e.pos[2];
      if (Math.abs(dx) < 32 && Math.abs(dz) < 32 && p[1] - 24 >= top - 2 && p[1] - 24 <= top + 4) {
        const l = Math.hypot(dx, dz) || 1, ux = l > 1 ? dx / l : 1, uz = l > 1 ? dz / l : 0;
        this.player.vel[0] += ux * 180; this.player.vel[2] += uz * 180;
        if (!e.turret) { e.phys.vel[0] -= ux * 60; e.phys.vel[2] -= uz * 60; }
      }
    }
  }
  // ---- weapons ----
  hasWeapon(w) { if (W2[w]) return this.arsenal.has(w); return w === 'soaker' ? this.hasSoaker : w === 'shotgun' ? this.hasShotgun : w === 'candygun' ? this.hasCandy : w === 'turd' ? this.hasTurd : false; }
  weaponAmmo(w) { if (W2[w]) return this.arsenal.ammo(w); return w === 'shotgun' ? (this.sausages >= SHOTGUN.perShot ? this.sausages : 0) : w === 'candygun' ? this.candy : w === 'turd' ? this.turds : this.ammo; }
  weaponObj(w) { if (W2[w]) return this.arsenal.guns[w]; return w === 'shotgun' ? this.shotgun : w === 'candygun' ? this.candygun : w === 'turd' ? this.turdgun : this.soaker; }
  setWeapon(w, force) {
    if (!this.hasWeapon(w)) return;
    if (w === this.weapon && !force) return;
    this.weapon = w; this.weaponObj(w).raise = 1; this.sfx.play('menu'); this.sfx.spray(false); this.sfx.spin(0); this.sfx.sauce(false);
    this.ui.weap && this.ui.weap.classList.toggle('alt', w !== 'soaker');
  }
  cycleWeapon(dir = 1) {
    const order = ['soaker', 'shotgun', 'candygun', 'turd', ...W2_KEYS], N = order.length; let k = order.indexOf(this.weapon);
    for (let n = 0; n < N; n++) { k = (k + dir + N) % N; if (this.hasWeapon(order[k])) { this.setWeapon(order[k]); return; } }
  }
  autoSwitch() { // out of ammo: take the best other weapon that still has some
    for (const w of ['jelly', 'sauce', 'candygun', 'rail', 'shotgun', 'cola', 'soaker', 'turd', 'fondue']) if (w !== this.weapon && this.hasWeapon(w) && this.weaponAmmo(w) > 0) { this.setWeapon(w); return; }
  }
  // ---- death piles: Qoqs burst into chicken feathers, Marvs into a white goo puddle, Ballinkis into pubes + a yellow puddle ----
  deathPile(e) {
    const x = e.pos[0], z = e.pos[2], fy = e.K.fly ? this.world.floorAt(e.pos[0], e.pos[2]) : e.pos[1] - 24, kind = e.K.pile, rnd = (a, b) => a + Math.random() * (b - a);
    const L = this.pointLight([x, fy + 16, z]), lit = c => new THREE.Color(c).multiply(new THREE.Color(Math.max(0.45, L[0]), Math.max(0.45, L[1]), Math.max(0.45, L[2])));
    const grp = new THREE.Group(); grp.position.set(x, fy, z);
    const puddle = (r, color, opacity, y = 0.6) => {
      const shape = new THREE.Shape(); const n = 18;
      for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, rr = r * (0.75 + Math.random() * 0.4); i ? shape.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : shape.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: lit(color), transparent: opacity < 1, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, fog: true }));
      m.rotation.x = -Math.PI / 2; m.position.y = y; grp.add(m); return m;
    };
    const mid = e.pos.slice(); mid[1] = fy + 30;
    if (kind === 'feathers') {
      const white = new THREE.MeshBasicMaterial({ color: lit(0xf4f2ea), side: THREE.DoubleSide, fog: true }), grey = new THREE.MeshBasicMaterial({ color: lit(0xcfcac0), side: THREE.DoubleSide, fog: true }), red = new THREE.MeshBasicMaterial({ color: lit(0xd02a18), side: THREE.DoubleSide, fog: true });
      const geo = new THREE.PlaneGeometry(3.2, 9, 1, 2); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.abs(p.getY(i)) * 0.25);
      for (let i = 0; i < 80; i++) { const r = Math.pow(Math.random(), 0.7) * 34, a = Math.random() * 6.3, h = Math.max(0, 9 - r * 0.32) * Math.random();
        const f = new THREE.Mesh(geo, i % 9 === 0 ? red : i % 3 ? white : grey); f.position.set(Math.cos(a) * r, 0.8 + h, Math.sin(a) * r); f.rotation.set(-Math.PI / 2 + rnd(-0.6, 0.6), rnd(0, 6.3), rnd(-0.5, 0.5), 'YXZ'); grp.add(f); }
      const leg = new THREE.MeshBasicMaterial({ color: lit(0xffa020), fog: true }); for (let i = 0; i < 2; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 4), leg); l.rotation.z = Math.PI / 2; l.position.set(rnd(-6, 6), 1, rnd(-6, 6)); l.rotation.y = rnd(0, 3); grp.add(l); }
      this.featherBurst(mid, 40); for (let i = 0; i < 30; i++) this.particles.spawn(mid, [rnd(-220, 220), rnd(60, 260), rnd(-220, 220)], [1, 1, 0.97], rnd(1.5, 3), 90, 2);
      this.sfx.play('chickenHit'); this.sfx.play('feathers');
    } else if (kind === 'goo') {
      puddle(30, 0xeeece0, 0.95); puddle(18, 0xfffff6, 1, 0.9);
      const gm = new THREE.MeshBasicMaterial({ color: lit(0xf6f4ea), fog: true }), hl = new THREE.MeshBasicMaterial({ color: lit(0xffffff), fog: true });
      for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(rnd(2, 5), 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), gm); s.scale.y = 0.5; const a = rnd(0, 6.3), r = rnd(0, 26); s.position.set(Math.cos(a) * r, 0.5, Math.sin(a) * r); grp.add(s);
        if (i % 3 === 0) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.9, 6, 4), hl); h.position.set(s.position.x - 1, 2, s.position.z - 1); grp.add(h); } }
      for (let i = 0; i < 4; i++) { const t = this.makeTissueBit(lit); t.position.set(rnd(-20, 20), 1.5, rnd(-20, 20)); grp.add(t); }
      this.gooSplat(mid, 40); this.sfx.play('goo'); this.sfx.play('squelch');
    } else if (kind === 'potatoes') { // Beans bursts into a shower of potatoes that bounce and settle on the floor
      for (let i = 0; i < 9; i++) this.addDebris([x + rnd(-8, 8), fy + 18 + rnd(0, 12), z + rnd(-8, 8)], [rnd(-170, 170), rnd(160, 360), rnd(-170, 170)], rnd(0.8, 1.25));
      for (let i = 0; i < 26; i++) this.particles.spawn(mid, [rnd(-200, 200), rnd(60, 240), rnd(-200, 200)], Math.random() < 0.5 ? [0.7, 0.5, 0.25] : [0.9, 0.8, 0.55], rnd(0.5, 1), 500);
      this.sfx.play('beansDeath'); this.sfx.play('thud');
    } else if (kind === 'ecto') { // Frenta: a glowing green ectoplasm puddle and fading wisps
      const m1 = puddle(34, 0x40e050, 0.6); m1.material.blending = THREE.AdditiveBlending; puddle(18, 0x9cff9c, 0.55, 0.9).material.blending = THREE.AdditiveBlending;
      const gm = new THREE.MeshBasicMaterial({ color: 0x70ff80, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false });
      for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(rnd(1.5, 3.5), 8, 5), gm); const a = rnd(0, 6.3), r = rnd(0, 24); s.position.set(Math.cos(a) * r, 1, Math.sin(a) * r); s.scale.y = 0.4; grp.add(s); }
      for (let i = 0; i < 40; i++) this.particles.spawn(mid, [rnd(-160, 160), rnd(40, 200), rnd(-160, 160)], [0.35, 1, 0.45], rnd(0.8, 1.6), -20, 2);
      this.sfx.play('frentaDeath'); this.sfx.play('goo');
    } else if (kind === 'pubes') {
      puddle(32, 0xe8c818, 0.82); puddle(16, 0xffe24a, 0.7, 0.9);
      const pos = []; const add = (x0, y0, z0) => { // one curly hair = a short random-walk squiggle of line segments
        let px = x0, py = y0, pz = z0, a = rnd(0, 6.3), b = rnd(0, 6.3); const n = 6 + (Math.random() * 5 | 0);
        for (let k = 0; k < n; k++) { a += rnd(-1.6, 1.6); b += rnd(-1.2, 1.2); const nx = px + Math.cos(a) * 1.4, nz = pz + Math.sin(a) * 1.4, ny = Math.max(0.7, py + Math.sin(b) * 0.7); pos.push(px, py, pz, nx, ny, nz); px = nx; py = ny; pz = nz; }
      };
      for (let i = 0; i < 160; i++) { const r = Math.pow(Math.random(), 0.8) * 24, a = rnd(0, 6.3); add(Math.cos(a) * r, 0.8 + Math.max(0, 7 - r * 0.3) * Math.random(), Math.sin(a) * r); }
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      grp.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: lit(0x2a1a0c), fog: true })));
      const lg2 = lg.clone(); const q = lg2.attributes.position; for (let i = 0; i < q.count; i++) q.setXYZ(i, q.getX(i) * 0.8 + 0.6, q.getY(i) + 0.4, q.getZ(i) * 0.8 - 0.6);
      grp.add(new THREE.LineSegments(lg2, new THREE.LineBasicMaterial({ color: lit(0x4a2e14), fog: true })));
      for (let i = 0; i < 24; i++) this.particles.spawn(mid, [rnd(-200, 200), rnd(80, 220), rnd(-200, 200)], Math.random() < 0.5 ? [0.95, 0.85, 0.15] : [0.25, 0.15, 0.06], rnd(0.6, 1.2), 500);
      for (let i = 0; i < 18; i++) this.particles.spawn(mid, [rnd(-90, 90), rnd(-10, 40), rnd(-90, 90)], [0.45, 0.75, 0.15], rnd(1, 1.8), -8, 2);
      this.sfx.play('squelch'); this.sfx.play('fart');
    }
    this.scene.add(grp); this.piles.push(grp);
    if (this.piles.length > 45) { const o = this.piles.shift(); this.scene.remove(o); }
    this.input.rumble(0.3, 0.2, 120);
  }
  makeTissueBit(lit) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 0), new THREE.MeshBasicMaterial({ color: lit(0xf0eee2), fog: true })); m.scale.y = 0.6; m.rotation.set(Math.random() * 3, Math.random() * 3, 0); return m; }
  // ---- Ballinki's fart clouds ----
  spawnFart(pos, owner) {
    const grp = new THREE.Group(); grp.position.set(...pos); this.scene.add(grp);
    const puffs = [];
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 7), new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.24 + Math.random() * 0.06, 0.75, 0.32 + Math.random() * 0.12), transparent: true, opacity: 0, depthWrite: false, fog: true }));
      const a = Math.random() * Math.PI * 2, r = Math.random() * 45; m.position.set(Math.cos(a) * r, Math.random() * 40, Math.sin(a) * r); m.userData.s = 22 + Math.random() * 26; m.userData.v = [(Math.random() - 0.5) * 14, 6 + Math.random() * 8, (Math.random() - 0.5) * 14]; grp.add(m); puffs.push(m);
    }
    this.farts.push({ pos: pos.slice(), grp, puffs, t: 0, life: BALLINKI.cloudTime, owner });
    this.sfx.play('fart'); for (let i = 0; i < 14; i++) this.particles.spawn([pos[0], pos[1] + 10, pos[2]], [(Math.random() - 0.5) * 160, Math.random() * 60, (Math.random() - 0.5) * 160], [0.45, 0.75, 0.15], 1 + Math.random(), -10, 2);
  }
  updateFarts(dt) {
    const keep = [], pl = this.player; let inCloud = false;
    for (const f of this.farts) {
      f.t += dt; const k = f.t / f.life; if (k >= 1) { this.scene.remove(f.grp); continue; }
      const grow = Math.min(1, f.t / 0.35), fade = k > 0.65 ? 1 - (k - 0.65) / 0.35 : 1;
      for (const m of f.puffs) { m.scale.setScalar(m.userData.s * (0.4 + 0.6 * grow) * (1 + k * 0.35)); m.position.x += m.userData.v[0] * dt; m.position.y += m.userData.v[1] * dt; m.position.z += m.userData.v[2] * dt; m.material.opacity = 0.42 * fade * grow; }
      if (Math.random() < dt * 10) this.particles.spawn([f.pos[0] + (Math.random() - 0.5) * 120, f.pos[1] + Math.random() * 60, f.pos[2] + (Math.random() - 0.5) * 120], [0, 12, 0], [0.5, 0.8, 0.2], 1.2, -6, 1);
      const d = Math.hypot(pl.pos[0] - f.pos[0], (pl.pos[1] - f.pos[1]) * 0.7, pl.pos[2] - f.pos[2]);
      if (!this.playerDead && d < BALLINKI.cloudRadius * (0.6 + 0.4 * grow) && fade > 0.2) inCloud = true;
      keep.push(f);
    }
    this.farts = keep;
    // nausea: while in a cloud (and a moment after) CornPop retches every so often: green screen, vomit, a little damage, can't shoot
    if (inCloud) { if (this.sickT <= 0) this.hud.print('Ugh! Ballinki\'s fart makes you sick!'); this.sickT = 1.2; }
    this.retchT = Math.max(0, this.retchT - dt); this.retchCd -= dt;
    if (this.sickT > 0) {
      this.sickT -= dt;
      if (this.retchCd <= 0) { this.retchCd = 0.75; this.retchT = 0.5; this.damagePlayer(BALLINKI.sickDps * 0.75, true); this.sfx.play('vomit'); this.flash = { rgb: [0.35, 0.75, 0.1], a: 0.45 }; pl.pitch = Math.max(-1.2, pl.pitch - 0.12); pl.landKick = Math.min(10, (pl.landKick || 0) + 5); this.portrait.hurt = 0.8; }
      if (this.retchT > 0.15) { const e = pl.eye(), fw = [-Math.sin(pl.yaw), -Math.cos(pl.yaw)];
        for (let i = 0; i < 3; i++) this.particles.spawn([e[0] + fw[0] * 12, e[1] - 8, e[2] + fw[1] * 12], [fw[0] * (90 + Math.random() * 60) + (Math.random() - 0.5) * 40, 20 + Math.random() * 40, fw[1] * (90 + Math.random() * 60) + (Math.random() - 0.5) * 40], Math.random() < 0.6 ? [0.6, 0.75, 0.15] : [0.85, 0.75, 0.3], 0.8, 600); }
      if (!this.flash || this.flash.a < 0.12) this.flash = { rgb: [0.3, 0.6, 0.08], a: 0.14 };
    }
  }
  // ---- Marv's dirty tissues ----
  spawnTissue(from, v, owner) {
    const m = makeTissue(); m.position.set(...from); this.scene.add(m);
    this.tissues.push({ p: from.slice(), v: v.slice(), mesh: m, owner, t: 0, spin: [Math.random() * 8 - 4, Math.random() * 8 - 4] });
  }
  updateTissues(dt) {
    const pl = this.player, keep = [];
    for (const c of this.tissues) {
      c.t += dt; c.v[1] -= MARV.tissueGravity * dt;
      const p1 = [c.p[0] + c.v[0] * dt, c.p[1] + c.v[1] * dt, c.p[2] + c.v[2] * dt];
      let dead = false;
      if (!this.playerDead && segAabb(c.p, p1, [pl.pos[0] - 18, pl.pos[1] - 26, pl.pos[2] - 18], [pl.pos[0] + 18, pl.pos[1] + 34, pl.pos[2] + 18]) >= 0) {
        this.damagePlayer(MARV.tissueDamage); this.gooPlayer(); dead = true;
      } else {
        const tr = this.world.trace(c.p, p1, [-3, -3, -3], [3, 3, 3], null, true);
        if (tr.fraction < 1) { this.gooSplat(tr.end, 8); this.sfx.play('tissueMiss'); dead = true; if (tr.normal && tr.normal[1] > 0.7) this.addPuddle(tr.end, 0xf0eee0); }
      }
      if (dead || c.t > 6) { this.scene.remove(c.mesh); continue; }
      c.p = p1; c.mesh.position.set(...p1); c.mesh.rotation.x += c.spin[0] * dt; c.mesh.rotation.z += c.spin[1] * dt;
      if (Math.random() < dt * 12) this.particles.spawn(p1, [(Math.random() - 0.5) * 20, -20, (Math.random() - 0.5) * 20], [0.9, 0.9, 0.82], 0.5, 300);
      const L = this.pointLight(p1); for (const mt of c.mesh.userData.mats) { if (!mt.userData.base) mt.userData.base = mt.color.clone(); mt.color.copy(mt.userData.base).multiply(new THREE.Color(Math.max(0.6, L[0]), Math.max(0.6, L[1]), Math.max(0.6, L[2]))); }
      keep.push(c);
    }
    this.tissues = keep;
  }
  gooSplat(p, n) { for (let i = 0; i < n; i++) this.particles.spawn(p, [(Math.random() - 0.5) * 140, Math.random() * 90, (Math.random() - 0.5) * 140], [0.95, 0.94, 0.86], 0.6 + Math.random() * 0.4, 500); }
  // a tissue hit: white goo splats over the screen and CornPop is slowed for MARV.slowTime seconds
  gooPlayer() {
    const fresh = this.gooT <= 0; this.gooT = MARV.slowTime; this.input.rumble(0.6, 0.3, 300); this.sfx.play('goo'); this.flash = { rgb: [0.95, 0.95, 0.88], a: 0.45 };
    this.gooSplat(this.player.eye(), 6); this.portrait.hurt = 0.6; this.emote('angry');
    const g = this.gooCanvas.getContext('2d'), W = this.gooCanvas.width, H = this.gooCanvas.height;
    if (fresh) g.clearRect(0, 0, W, H);
    const blob = (x, y, r) => { g.beginPath(); for (let a = 0; a <= 16; a++) { const t = a / 16 * Math.PI * 2, rr = r * (0.75 + Math.random() * 0.45); g.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr); } g.fill(); };
    const n = 5 + (Math.random() * 4 | 0);
    for (let i = 0; i < n; i++) {
      const edge = Math.random() < 0.7; let x = Math.random() * W, y = Math.random() * H;
      if (edge) { if (Math.random() < 0.5) x = Math.random() < 0.5 ? Math.random() * 30 : W - Math.random() * 30; else y = Math.random() < 0.5 ? Math.random() * 22 : H - Math.random() * 22; }
      const r = 8 + Math.random() * 16;
      g.fillStyle = 'rgba(160,0,0,0.92)'; blob(x, y, r);                                          // body (r = shade)
      for (let k = 0; k < 4; k++) blob(x + (Math.random() - 0.5) * r * 1.6, y + (Math.random() - 0.5) * r * 1.6, r * (0.25 + Math.random() * 0.3));
      for (let k = 0; k < 3; k++) { const dx = x + (Math.random() - 0.5) * r * 1.4, len = r * (0.8 + Math.random() * 2); g.fillRect(dx - 1.5, y, 3 + Math.random() * 2, len); blob(dx, y + len, 2.5 + Math.random() * 2); } // drips
      g.fillStyle = 'rgba(255,255,0,0.95)'; blob(x - r * 0.3, y - r * 0.35, r * 0.25);               // glossy highlight (g channel)
    }
    this.gooTex.needsUpdate = true; this.blitMat.uniforms.gooSlide.value = 0;
    this.hud.print('Ewww! Marv\'s goo slows you down!');
  }
  updateGoo(dt) {
    const U = this.blitMat.uniforms;
    if (this.gooT > 0) { this.gooT = Math.max(0, this.gooT - dt); U.goo.value = Math.min(1, this.gooT / 0.8); U.gooSlide.value += dt * 0.025; this.player.maxspeed = PM.maxspeed * MARV.slowFactor; }
    else { U.goo.value = 0; if (this.player.maxspeed) this.player.maxspeed = 0; }
  }
  // ---- Beans' potatoes: thrown projectiles, then bouncing debris that stays on the floor ----
  spawnPotato(from, v, owner) { const m = makePotato(1); m.position.set(...from); this.scene.add(m); this.potatoes.push({ p: from.slice(), v: v.slice(), mesh: m, t: 0, spin: [Math.random() * 10 - 5, Math.random() * 10 - 5] }); }
  updatePotatoes(dt) {
    const pl = this.player, keep = [];
    for (const c of this.potatoes) {
      c.t += dt; c.v[1] -= BEANS.potatoGravity * dt;
      const p1 = [c.p[0] + c.v[0] * dt, c.p[1] + c.v[1] * dt, c.p[2] + c.v[2] * dt];
      let dead = false;
      if (!this.playerDead && segAabb(c.p, p1, [pl.pos[0] - 18, pl.pos[1] - 26, pl.pos[2] - 18], [pl.pos[0] + 18, pl.pos[1] + 34, pl.pos[2] + 18]) >= 0) {
        this.damagePlayer(BEANS.potatoDamage); this.sfx.play('potatoHit'); this.flash = { rgb: [0.7, 0.5, 0.25], a: 0.3 }; dead = true;
        this.scene.remove(c.mesh); this.addDebris(c.p, [-c.v[0] * 0.2, 80, -c.v[2] * 0.2], 1);
      } else {
        const tr = this.world.trace(c.p, p1, [-3, -3, -3], [3, 3, 3], null, true);
        if (tr.fraction < 1) { this.sfx.play('thud'); dead = true; this.scene.remove(c.mesh); const n = tr.normal || [0, 1, 0]; const dv = c.v[0] * n[0] + c.v[1] * n[1] + c.v[2] * n[2];
          this.addDebris(tr.end, [(c.v[0] - 2 * dv * n[0]) * 0.35, (c.v[1] - 2 * dv * n[1]) * 0.35, (c.v[2] - 2 * dv * n[2]) * 0.35], 1); }
      }
      if (dead) continue; if (c.t > 6) { this.scene.remove(c.mesh); continue; }
      c.p = p1; c.mesh.position.set(...p1); c.mesh.rotation.x += c.spin[0] * dt; c.mesh.rotation.z += c.spin[1] * dt;
      const L = this.pointLight(p1); for (const mt of c.mesh.userData.mats) { if (!mt.userData.base) mt.userData.base = mt.color.clone(); mt.color.copy(mt.userData.base).multiply(new THREE.Color(Math.max(0.5, L[0]), Math.max(0.5, L[1]), Math.max(0.5, L[2]))); }
      keep.push(c);
    }
    this.potatoes = keep;
  }
  addDebris(p, v, s = 1) {
    const m = makePotato(s); m.position.set(...p); this.scene.add(m);
    const L = this.pointLight(p); for (const mt of m.userData.mats) mt.color.multiply(new THREE.Color(Math.max(0.5, L[0]), Math.max(0.5, L[1]), Math.max(0.5, L[2])));
    this.debris.push({ p: p.slice(), v: v.slice(), mesh: m, r: m.userData.r, rest: false, t: 0, spin: [Math.random() * 12 - 6, Math.random() * 12 - 6] });
    if (this.debris.length > 140) { const o = this.debris.shift(); this.scene.remove(o.mesh); }
  }
  updateDebris(dt) {
    for (const d of this.debris) {
      if (d.rest) continue; d.t += dt; d.v[1] -= 800 * dt;
      const p1 = [d.p[0] + d.v[0] * dt, d.p[1] + d.v[1] * dt, d.p[2] + d.v[2] * dt];
      const tr = this.world.trace(d.p, p1, [-2, -2, -2], [2, 2, 2], null, true);
      if (tr.fraction < 1) {
        const n = tr.normal || [0, 1, 0]; const dv = d.v[0] * n[0] + d.v[1] * n[1] + d.v[2] * n[2];
        for (let a = 0; a < 3; a++) d.v[a] = (d.v[a] - 1.6 * dv * n[a]) * 0.55; d.p = tr.end.slice(); d.p[1] += n[1] > 0.5 ? 0.5 : 0;
        if (n[1] > 0.7 && Math.hypot(d.v[0], d.v[1], d.v[2]) < 40) { d.rest = true; d.p[1] = tr.end[1] + d.r * 0.6; d.mesh.rotation.x = 0; d.mesh.rotation.z = (Math.random() - 0.5) * 0.4; }
        if (d.t > 0.05 && n[1] > 0.7 && Math.random() < 0.3) this.sfx.play('thud');
      } else d.p = p1;
      if (d.t > 5) { d.rest = true; }
      d.mesh.position.set(...d.p); if (!d.rest) { d.mesh.rotation.x += d.spin[0] * dt; d.mesh.rotation.z += d.spin[1] * dt; }
    }
  }
  // a soft radial glow texture (shared by Frenta's aura and fireballs)
  glowTex() {
    if (this._glowTex) return this._glowTex;
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    return (this._glowTex = new THREE.CanvasTexture(c));
  }
  // ---- Frenta's slow fireballs ----
  spawnFireball(from, v, owner) {
    const grp = new THREE.Group(); grp.position.set(...from);
    const core = new THREE.Mesh(new THREE.SphereGeometry(5, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe080 })); grp.add(core);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex(), color: 0xff6a10, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.set(34, 34, 1); grp.add(halo);
    this.scene.add(grp); this.fireballs.push({ p: from.slice(), v: v.slice(), grp, halo, t: 0, owner });
  }
  fireBurst(p, n) { for (let i = 0; i < n; i++) this.particles.spawn(p, [(Math.random() - 0.5) * 220, Math.random() * 160, (Math.random() - 0.5) * 220], Math.random() < 0.5 ? [1, 0.55, 0.1] : [1, 0.9, 0.4], 0.4 + Math.random() * 0.4, 200, 2); }
  updateFireballs(dt) {
    const pl = this.player, keep = [];
    for (const f of this.fireballs) {
      f.t += dt; const p1 = [f.p[0] + f.v[0] * dt, f.p[1] + f.v[1] * dt, f.p[2] + f.v[2] * dt]; let dead = false;
      if (!this.playerDead && segAabb(f.p, p1, [pl.pos[0] - 18, pl.pos[1] - 26, pl.pos[2] - 18], [pl.pos[0] + 18, pl.pos[1] + 34, pl.pos[2] + 18]) >= 0) {
        this.damagePlayer(FRENTA.fireDamage, true); this.fireBurst(f.p, 16); this.sfx.play('fireHit'); dead = true;
      } else { const tr = this.world.trace(f.p, p1, [-3, -3, -3], [3, 3, 3], null, true); if (tr.fraction < 1) { this.fireBurst(tr.end, 12); this.sfx.play('fireHit'); dead = true; } }
      if (dead || f.t > 7) { this.scene.remove(f.grp); continue; }
      f.p = p1; f.grp.position.set(...p1); const s = 30 + Math.sin(f.t * 30) * 6; f.halo.scale.set(s, s, 1);
      if (Math.random() < dt * 40) this.particles.spawn(p1, [(Math.random() - 0.5) * 30, 20 + Math.random() * 20, (Math.random() - 0.5) * 30], [1, 0.45 + Math.random() * 0.3, 0.08], 0.45, -40, 1);
      keep.push(f);
    }
    this.fireballs = keep;
  }
  // ---- turd launcher rockets ----
  spawnTurd(from, v) {
    const eye = this.player.eye(); const tr = this.world.trace(eye, from, [-1, -1, -1], [1, 1, 1], null, true);
    const p = tr.fraction < 1 ? tr.end : from; const m = makeTurd(1); m.position.set(...p); this.scene.add(m);
    this.turdShots.push({ p: p.slice(), v: v.slice(), mesh: m, t: 0 });
  }
  turdBoom(p) {
    const R = TURD.splash; this.sfx.play('turdBoom'); this.input.rumble(0.8, 1, 260);
    for (let i = 0; i < 46; i++) this.particles.spawn(p, [(Math.random() - 0.5) * 420, Math.random() * 300, (Math.random() - 0.5) * 420], Math.random() < 0.6 ? [0.42, 0.24, 0.1] : [0.6, 0.38, 0.16], 0.6 + Math.random() * 0.6, 600);
    for (let i = 0; i < 14; i++) this.particles.spawn(p, [(Math.random() - 0.5) * 80, 20 + Math.random() * 60, (Math.random() - 0.5) * 80], [0.5, 0.42, 0.2], 1.4, -20, 2);
    for (const e of this.enemies) {
      if (!e.alive || e.dormant) continue; const c = e.boss ? e.nearest(p) : [e.pos[0], e.pos[1] + 10, e.pos[2]], d = Math.hypot(c[0] - p[0], c[1] - p[1], c[2] - p[2]);
      if (d > R + 20 || this.world.rayFrac(p, c) < 0.98) continue;
      const k = Math.max(0.25, 1 - d / (R + 20)); e.pooT = TURD.gooTime; e.hurt(TURD.damage * k, false);
      if (e.alive && !e.turret) { const l = d || 1, kb = TURD.knock * k; e.phys.vel[0] += (c[0] - p[0]) / l * kb; e.phys.vel[2] += (c[2] - p[2]) / l * kb; if (e.flyVel) { e.flyVel[0] += (c[0] - p[0]) / l * kb; e.flyVel[2] += (c[2] - p[2]) / l * kb; } else e.phys.vel[1] += 140 * k; }
    }
    const pl = this.player, pc = [pl.pos[0], pl.pos[1], pl.pos[2]], dp = Math.hypot(pc[0] - p[0], pc[1] - p[1], pc[2] - p[2]);
    if (dp < R && this.world.rayFrac(p, pc) > 0.98) { const k = 1 - dp / R, l = dp || 1; this.damagePlayer(TURD.damage * TURD.selfScale * k); pl.vel[0] += (pc[0] - p[0]) / l * 300 * k; pl.vel[1] += 260 * k; pl.vel[2] += (pc[2] - p[2]) / l * 300 * k; this.flash = { rgb: [0.45, 0.28, 0.1], a: 0.4 * k + 0.1 }; }
    for (const m of this.world.movers) if (m.type === 'breakable' && !m.broken) { const c = [(m.min[0] + m.max[0]) / 2, (m.min[1] + m.max[1]) / 2, (m.min[2] + m.max[2]) / 2]; if (Math.hypot(c[0] - p[0], c[1] - p[1], c[2] - p[2]) < R + 40) { m.health -= TURD.damage; if (m.health <= 0) this.breakMover(m); } }
    const fl = this.world.floorAt(p[0], p[2]); if (Math.abs(p[1] - fl) < 50) { this.addPuddle([p[0], fl, p[2]], 0x5a3414); this.addPuddle([p[0] + 14, fl, p[2] - 10], 0x6a4018); }
  }
  updateTurds(dt) {
    const keep = [];
    for (const s of this.turdShots) {
      s.t += dt; s.v[1] -= TURD.gravity * dt;
      const p1 = [s.p[0] + s.v[0] * dt, s.p[1] + s.v[1] * dt, s.p[2] + s.v[2] * dt];
      let hit = false;
      for (const e of this.enemies) { if (!e.alive || e.dormant) continue; if (segAabb(s.p, p1, [e.pos[0] - (e.K.hw || 18), e.pos[1] - 26, e.pos[2] - (e.K.hw || 18)], [e.pos[0] + (e.K.hw || 18), e.pos[1] + e.K.height - 22, e.pos[2] + (e.K.hw || 18)]) >= 0) { hit = true; break; } }
      const tr = this.world.trace(s.p, p1, [-2, -2, -2], [2, 2, 2], null, true);
      if (hit || tr.fraction < 1 || s.t > 4) { this.scene.remove(s.mesh); this.turdBoom(hit ? p1 : tr.fraction < 1 ? tr.end : p1); continue; }
      s.p = p1; s.mesh.position.set(...p1); s.mesh.rotation.x += dt * 9; s.mesh.rotation.z += dt * 5;
      if (Math.random() < dt * 50) this.particles.spawn(p1, [(Math.random() - 0.5) * 20, 10 + Math.random() * 20, (Math.random() - 0.5) * 20], Math.random() < 0.5 ? [0.4, 0.3, 0.18] : [0.55, 0.45, 0.3], 0.7, -15, 1.5);
      keep.push(s);
    }
    this.turdShots = keep;
  }
  // ---- candy corn rounds ----
  spawnCandy(from, v) {
    const eye = this.player.eye(); const tr = this.world.trace(eye, from, [-1, -1, -1], [1, 1, 1], null, true);
    const p = tr.fraction < 1 ? tr.end : from; const m = makeCandyCorn(0.9); m.position.set(...p); this.scene.add(m);
    this.candyShots.push({ p: p.slice(), v: v.slice(), mesh: m, t: 0 });
  }
  candyBurst(p, n) { for (let i = 0; i < n; i++) this.particles.spawn(p, [(Math.random() - 0.5) * 150, Math.random() * 100, (Math.random() - 0.5) * 150], [[1, 0.78, 0.1], [1, 0.48, 0.07], [1, 0.97, 0.88]][i % 3], 0.4 + Math.random() * 0.3, 500); }
  updateCandy(dt) {
    const keep = [];
    for (const s of this.candyShots) {
      s.t += dt; s.v[1] -= CANDYGUN.gravity * dt;
      const p1 = [s.p[0] + s.v[0] * dt, s.p[1] + s.v[1] * dt, s.p[2] + s.v[2] * dt];
      let best = 2, hitE = null;
      for (const e of this.enemies) { if (!e.alive || e.dormant) continue; const t = segAabb(s.p, p1, [e.pos[0] - (e.K.hw || 17), e.pos[1] - 26, e.pos[2] - (e.K.hw || 17)], [e.pos[0] + (e.K.hw || 17), e.pos[1] + e.K.height - 22, e.pos[2] + (e.K.hw || 17)]); if (t >= 0 && t < best) { best = t; hitE = e; } }
      const tr = this.world.trace(s.p, p1, [-1, -1, -1], [1, 1, 1], null, true);
      let gone = false;
      if (hitE && best <= tr.fraction) {
        const hp = [s.p[0] + (p1[0] - s.p[0]) * best, s.p[1] + (p1[1] - s.p[1]) * best, s.p[2] + (p1[2] - s.p[2]) * best];
        hitE.hurt(CANDYGUN.damage, false); const sp = Math.hypot(s.v[0], s.v[2]) || 1;
        if (hitE.alive && !hitE.turret) { hitE.phys.vel[0] += s.v[0] / sp * CANDYGUN.knock; hitE.phys.vel[2] += s.v[2] / sp * CANDYGUN.knock; }
        this.candyBurst(hp, 4); if (Math.random() < 0.5) this.sfx.play('candyHit'); gone = true;
      } else {
        let hitB = null, bt = 2;
        for (const b of this.shootables) { if (b.pressed) continue; const t = segAabb(s.p, p1, [b.min[0] - 3, b.min[1] - 3, b.min[2] - 3], [b.max[0] + 3, b.max[1] + 3, b.max[2] + 3]); if (t >= 0 && t < bt) { bt = t; hitB = b; } }
        if (hitB && bt <= tr.fraction + 0.05) { this.pressButton(hitB); this.candyBurst(s.p, 4); gone = true; }
        else if (tr.fraction < 1) {
          const mv = tr.brush && tr.brush.mover; if (mv && mv.type === 'breakable') { mv.health -= CANDYGUN.damage; if (mv.health <= 0) this.breakMover(mv); }
          this.candyBurst(tr.end, 3); gone = true;
        }
      }
      if (gone || s.t > 2) { this.scene.remove(s.mesh); continue; }
      s.p = p1; s.mesh.position.set(...p1); s.mesh.lookAt(p1[0] + s.v[0], p1[1] + s.v[1], p1[2] + s.v[2]); s.mesh.rotateX(Math.PI / 2);
      keep.push(s);
    }
    this.candyShots = keep;
  }
  // ---- shotgun sausages ----
  spawnSausage(from, v) {
    const eye = this.player.eye(); const tr = this.world.trace(eye, from, [-1, -1, -1], [1, 1, 1], null, true);
    const p = tr.fraction < 1 ? tr.end : from; const m = makeSausage(12, 2.4); m.position.set(...p); this.scene.add(m);
    this.sausageShots.push({ p: p.slice(), v: v.slice(), start: eye.slice(), mesh: m, t: 0 });
  }
  sausageDamage(s, at) { const d = Math.hypot(at[0] - s.start[0], at[1] - s.start[1], at[2] - s.start[2]); const k = Math.max(0, Math.min(1, (d - SHOTGUN.near) / (SHOTGUN.far - SHOTGUN.near))); return SHOTGUN.damageNear + (SHOTGUN.damageFar - SHOTGUN.damageNear) * k; }
  meatBurst(p, n) { for (let i = 0; i < n; i++) this.particles.spawn(p, [(Math.random() - 0.5) * 180, Math.random() * 120, (Math.random() - 0.5) * 180], Math.random() < 0.5 ? [0.75, 0.32, 0.16] : [0.95, 0.6, 0.45], 0.5 + Math.random() * 0.4, 500); }
  updateSausages(dt) {
    const keep = [];
    for (const s of this.sausageShots) {
      s.t += dt; s.v[1] -= SHOTGUN.gravity * dt;
      const p1 = [s.p[0] + s.v[0] * dt, s.p[1] + s.v[1] * dt, s.p[2] + s.v[2] * dt];
      let best = 2, hitE = null;
      for (const e of this.enemies) { if (!e.alive || e.dormant) continue; const top = e.K.height - 22; const t = segAabb(s.p, p1, [e.pos[0] - (e.K.hw || 18), e.pos[1] - 26, e.pos[2] - (e.K.hw || 18)], [e.pos[0] + (e.K.hw || 18), e.pos[1] + top, e.pos[2] + (e.K.hw || 18)]); if (t >= 0 && t < best) { best = t; hitE = e; } }
      const tr = this.world.trace(s.p, p1, [-1, -1, -1], [1, 1, 1], null, true);
      let gone = false;
      if (hitE && best <= tr.fraction) {
        const hp = [s.p[0] + (p1[0] - s.p[0]) * best, s.p[1] + (p1[1] - s.p[1]) * best, s.p[2] + (p1[2] - s.p[2]) * best];
        const dmg = this.sausageDamage(s, hp); hitE.hurt(dmg, false);
        const sp = Math.hypot(s.v[0], s.v[2]) || 1, kb = SHOTGUN.knock * dmg / SHOTGUN.damageNear;
        if (hitE.alive && !hitE.turret) { hitE.phys.vel[0] += s.v[0] / sp * kb; hitE.phys.vel[2] += s.v[2] / sp * kb; }
        this.meatBurst(hp, 8); this.sfx.play('squelch'); gone = true;
      } else {
        let hitB = null, bt = 2;
        for (const b of this.shootables) { if (b.pressed) continue; const t = segAabb(s.p, p1, [b.min[0] - 3, b.min[1] - 3, b.min[2] - 3], [b.max[0] + 3, b.max[1] + 3, b.max[2] + 3]); if (t >= 0 && t < bt) { bt = t; hitB = b; } }
        if (hitB && bt <= tr.fraction + 0.05) { this.pressButton(hitB); this.meatBurst(s.p, 5); gone = true; }
        else if (tr.fraction < 1) {
          const mv = tr.brush && tr.brush.mover; if (mv && mv.type === 'breakable') { mv.health -= this.sausageDamage(s, tr.end) * 0.8; if (mv.health <= 0) this.breakMover(mv); }
          this.meatBurst(tr.end, 6); this.sfx.play('thud'); gone = true;
        }
      }
      if (gone || s.t > 2.5) { this.scene.remove(s.mesh); continue; }
      s.p = p1; s.mesh.position.set(...p1); s.mesh.lookAt(p1[0] + s.v[0], p1[1] + s.v[1], p1[2] + s.v[2]);
      keep.push(s);
    }
    this.sausageShots = keep;
  }

  damagePlayer(n, burn) {
    if (this.playerDead) return;
    this.input.rumble(0.35, Math.min(1, n / 12), 140);
    this.lastHurtT = this.time;
    this.health -= n; this.flash = burn ? { rgb: [0.9, 0.35, 0.05], a: 0.28 } : { rgb: [0.9, 0.1, 0.05], a: 0.32 }; this.sfx.play('pain'); this.player.landKick = Math.min(10, this.player.landKick + 4);
    this.portrait.hurt = 1; if (Math.random() < 0.3) this.emote('angry');
    if (this.health <= 0) this.killPlayer();
  }
  bossDefeated(b) {
    this.hud.centerPrint('BCM IS DONE FOR!', 3); this.sfx.play('secret'); this.bonusFlash([0.9, 0.55, 0.2], 0.4); this.emote('happy');
    const p = b.p, A = b.arena, f = this.world.floorAt(p[0], p[2]);
    this.dropPickup('health', [p[0] - 30, f, p[2]], 25); this.dropPickup('health', [p[0] + 30, f, p[2]], 25);
    const own = this.arsenal.owned(); for (let i = 0; i < 2 && own.length; i++) { const k = own[(Math.random() * own.length) | 0]; this.dropPickup(W2[k].ammoItem, [p[0] + (i ? 20 : -20), f, p[2] + 40], W2[k].box); }
    if (this.hasTurd) this.dropPickup('turdbox', [p[0], f, p[2] - 40], 4); else if (this.hasShotgun) this.dropPickup('sausages', [p[0], f, p[2] - 40], 12);
    if (this.director) this.director.cool = 60;
  }
  killPlayer() {
    this.health = 0; this.playerDead = true; this.deathT = 0; this.sfx.play('die'); this.sfx.spray(false); this.sfx.spin(0); this.sfx.sauce(false);
    this.flash = { rgb: [0.8, 0.05, 0.02], a: 0.6 };
    this.hud.centerPrint(`CORNPOP GOT CHICKENED!\n\n${this.input.isTouch ? 'TAP' : 'PRESS JUMP'} TO TRY AGAIN`, 9999);
    for (const e of this.enemies) if (e.alive && e.awake) { e.state = 'taunt'; e.model.playEmote('taunt'); }
  }

  setupRain(r) {
    this.rain = null; if (!r) return;
    if (!r.min) { const W = this.world; r = { ...r, min: [0, -1024, 0], max: [W.W * CELL, r.top || 1400, W.H * CELL] }; }
    const N = r.density || 700, pos = new Float32Array(N * 6);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x8890b0, transparent: true, opacity: 0.55, fog: true }));
    lines.frustumCulled = false; this.scene.add(lines);
    const drops = []; for (let i = 0; i < N; i++) drops.push([0, 0, 0, 0, 0]);
    this.rain = { r, lines, drops, pos, init: false, wind: r.wind || [0, 0] };
  }
  // ---- lightning storm: random strikes light up everything open to the sky, a bolt in the skyline, thunder a moment later ----
  updateStorm(dt) {
    const S = this.storm; if (!S) return; const U = this.shared;
    S.next -= dt; S.t += dt;
    if (S.next <= 0) {
      const c = S.cfg; S.next = (c.every ? c.every[0] + Math.random() * (c.every[1] - c.every[0]) : 6 + Math.random() * 8); S.t = 0;
      S.power = (c.power || 1) * (0.6 + Math.random() * 0.4);
      const n = 2 + Math.floor(Math.random() * 3); S.pulses = []; let t = 0; for (let k = 0; k < n; k++) { S.pulses.push([t, k === 0 ? 1 : 0.35 + Math.random() * 0.65]); t += 0.06 + Math.random() * 0.12; }
      const pl = this.player; U.boltAz.value = Math.atan2(-Math.cos(pl.yaw), -Math.sin(pl.yaw)) + (Math.random() - 0.5) * 1.8; U.boltSeed.value = Math.random() * 100;
      const delay = 0.25 + Math.random() * 2.4; const loud = Math.max(0.35, 1 - delay / 3) * S.power;
      setTimeout(() => { if (this.storm === S) this.sfx.thunder(loud, delay < 0.7); }, delay * 1000);
      const open = this.world.expCov ? this.world.exposureAt([pl.pos[0], pl.pos[1] + 20, pl.pos[2]]) : 1;
      if (open > 0.3 && delay < 1.2) this.flash = { rgb: [0.85, 0.9, 1], a: 0.16 * S.power };
    }
    let env = 0; for (const [t0, a] of S.pulses) if (S.t >= t0) env = Math.max(env, a * Math.exp(-(S.t - t0) * 11));
    env *= S.power;
    U.lightning.value = env; U.storm.value = env; U.bolt.value = S.t < 0.4 ? env : 0;
    const f = this.baseFog; U.fogColor.value.setRGB(f[0] + env * 0.05, f[1] + env * 0.055, f[2] + env * 0.07); if (this.scene.fog) this.scene.fog.color.copy(U.fogColor.value);
    if (this.bodyAmb) this.bodyAmb.intensity = 0.15 + env * 1.4;
  }
  updateRain(dt) {
    this.updateStorm(dt);
    const R = this.rain; if (!R) return; const p = this.player.pos, r = R.r, W = this.world;
    const inside = p[0] > r.min[0] - 200 && p[0] < r.max[0] + 200 && p[2] > r.min[2] - 200 && p[2] < r.max[2] + 200;
    R.lines.visible = inside;
    const dist = Math.max(0, Math.max(r.min[0] - p[0], p[0] - r.max[0], r.min[2] - p[2], p[2] - r.max[2]));
    // rain loudness: how much open sky is around CornPop (quieter indoors, loud in the street)
    let near = 1; if (W.exposed) { let n = 0, k = 0; const c0 = Math.floor(p[0] / CELL), r0 = Math.floor(p[2] / CELL); for (let dr = -3; dr <= 3; dr += 2) for (let dc = -3; dc <= 3; dc += 2) { const c = c0 + dc, rr = r0 + dr; k++; if (c >= 0 && rr >= 0 && c < W.W && rr < W.H && W.exposed[rr * W.W + c]) n++; } near = 0.25 + 0.75 * n / k; }
    this.sfx.setRain(Math.max(0, 1 - dist / 500) * near * (r.loud || 1));
    if (!inside) return;
    const rnd = (a, b) => a + Math.random() * (b - a), wx = R.wind[0], wz = R.wind[1];
    const open = (x, z) => { if (!W.exposed) return 0; const c = Math.floor(x / CELL), rr = Math.floor(z / CELL); if (c < 0 || rr < 0 || c >= W.W || rr >= W.H || !W.exposed[rr * W.W + c]) return null; const e = W.cells[rr][c]; return e.roof ?? e.f; };
    for (let i = 0; i < R.drops.length; i++) {
      const d = R.drops[i];
      if (!R.init || d[1] < d[4] || Math.abs(d[0] - p[0]) > 520 || Math.abs(d[2] - p[2]) > 520) {
        if (R.init && d[1] < d[4] && d[4] > -1000 && Math.abs(d[0] - p[0]) < 360 && Math.abs(d[2] - p[2]) < 360 && Math.random() < 0.6) { // splash
          for (let k = 0; k < 2; k++) this.particles.spawn([d[0], d[4] + 1, d[2]], [(Math.random() - 0.5) * 50, 40 + Math.random() * 40, (Math.random() - 0.5) * 50], [0.55, 0.6, 0.7], 0.22, 500);
        }
        let ok = false;
        for (let tries = 0; tries < 4 && !ok; tries++) {
          d[0] = Math.min(r.max[0], Math.max(r.min[0], p[0] + rnd(-500, 500))); d[2] = Math.min(r.max[2], Math.max(r.min[2], p[2] + rnd(-500, 500)));
          const f = W.exposed ? open(d[0], d[2]) : r.min[1]; if (f !== null) { d[4] = f; ok = true; }
        }
        if (!ok) { d[4] = -9999; d[1] = -9000; continue; }
        const top = Math.min(r.max[1], p[1] + 500); d[3] = rnd(750, 1000); d[1] = R.init ? top : rnd(d[4], top);
      }
      d[1] -= d[3] * dt; d[0] += wx * dt; d[2] += wz * dt;
      const k = 16 / d[3], o = i * 6; R.pos[o] = d[0]; R.pos[o + 1] = d[1]; R.pos[o + 2] = d[2]; R.pos[o + 3] = d[0] - wx * k + 0.8; R.pos[o + 4] = d[1] + 16; R.pos[o + 5] = d[2] - wz * k + 0.3;
    }
    R.init = true; R.lines.geometry.attributes.position.needsUpdate = true;
  }

  // ---- light styles ----
  styleValue(pattern, t) { const p = STYLE_PATTERNS[pattern] || pattern || 'm'; const ch = p.charCodeAt(Math.floor(t * 10) % p.length) - 97; return ch / 12; }
  updateStyles() {
    const defs = this.level.styles || [];
    for (let i = 0; i < 4; i++) { const d = defs[i]; const v = d ? this.styleValue(d.pattern, this.time) : 0; this.shared.st.value[i].set(...(d ? d.color : [0, 0, 0])).multiplyScalar(v); }
  }
  pointLight(pos) {
    const o = this.world.lightAt(pos, null); const st = this.shared.st.value;
    let r = o[0], g = o[1], b = o[2]; for (let i = 0; i < 4; i++) { r += o[3 + i] * st[i].x; g += o[3 + i] * st[i].y; b += o[3 + i] * st[i].z; }
    return [Math.min(2, r / 128), Math.min(2, g / 128), Math.min(2, b / 128)];
  }

  // ---- gameplay ----
  overlap(p, mn, mx, pad = 0) { return p[0] + HULL_MAX[0] > mn[0] - pad && p[0] + HULL_MIN[0] < mx[0] + pad && p[1] + HULL_MAX[1] > mn[1] - pad && p[1] + HULL_MIN[1] < mx[1] + pad && p[2] + HULL_MAX[2] > mn[2] - pad && p[2] + HULL_MIN[2] < mx[2] + pad; }
  message(msg, center = true) { if (center) this.hud.centerPrint(msg); else this.hud.print(msg); }
  bonusFlash(rgb = [0.85, 0.7, 0.3], a = 0.35) { this.flash = { rgb, a }; }

  openDoor(m) {
    if (m.state === 'opening' || m.state === 'open') return;
    m.state = 'opening'; this.sfx.play('door');
  }
  updateDoors(dt) {
    const p = this.player.pos;
    for (const m of this.world.movers) {
      if (m.type !== 'door') continue;
      const tmin = [m.base.min[0] - 40, m.base.min[1], m.base.min[2] - 40], tmax = [m.base.max[0] + 40, m.base.max[1], m.base.max[2] + 40];
      let inTrig = this.overlap(p, tmin, tmax);
      let enemyIn = !m.key && !m.targeted && !m.locked && this.enemies && this.enemies.some(en => en.alive && en.awake && this.overlap(en.K.fly ? [en.pos[0], Math.min(en.pos[1], m.base.min[1] + 40), en.pos[2]] : en.pos, tmin, tmax)); // flyers open doors too
      if (enemyIn && m.state === 'closed') this.openDoor(m);
      inTrig = inTrig || enemyIn;
      if (m.locked) { if (m.state === 'open' || m.state === 'opening') { m.state = 'closing'; } inTrig = false; enemyIn = false; }
      if (m.state === 'closed' && inTrig && !m.targeted && !m.locked) {
        if (m.key && !this.keys.has(m.key)) {
          if (this.lockMsgT <= 0) { this.message(m.message || `You need the ${m.key.toUpperCase()} keycard`); this.sfx.play('locked'); this.lockMsgT = 2; this.emote('angry'); }
        } else { if (m.key) { this.hud.print(`${m.key.toUpperCase()} door unlocked`); m.key = null; } this.openDoor(m); }
      }
      let off = m.offset;
      if (m.state === 'opening') { off = Math.min(m.travel, off + m.speed * dt); if (off >= m.travel) { m.state = 'open'; m.t = 0; this.sfx.play('doorstop'); } }
      else if (m.state === 'open' && m.wait >= 0) { m.t += dt; if (m.t > m.wait && !inTrig) { m.state = 'closing'; this.sfx.play('door'); } }
      else if (m.state === 'closing') {
        off = Math.max(0, off - m.speed * dt);
        const mn = [m.base.min[0], m.base.min[1] + off * (m.dir || 1), m.base.min[2]], mx = [m.base.max[0], m.base.max[1] + off * (m.dir || 1), m.base.max[2]];
        if (!m.locked && (this.overlap(p, mn, mx) || this.enemies.some(en => en.alive && this.overlap(en.pos, mn, mx)))) { m.state = 'opening'; off = m.offset; }
        else if (off <= 0) { m.state = 'closed'; this.sfx.play('doorstop'); }
      }
      if (off !== m.offset) { m.offset = off; m.brush.min[1] = m.base.min[1] + off * (m.dir || 1); m.brush.max[1] = m.base.max[1] + off * (m.dir || 1); m.group.position.y = m.base.min[1] + off * (m.dir || 1); }
    }
  }
  pressButton(b) {
    if (b.pressed) return; b.pressed = true; this.sfx.play('button');
    if (b.dome) b.dome.material.color.set(0x30ff40);
    if (b.counter) { this.counters = this.counters || {}; const n = (this.counters[b.counter] = (this.counters[b.counter] || 0) + 1); if (n < b.count) { this.hud.print(`${b.count - n} more to go...`); return; } }
    const tg = [].concat(b.target || []);
    for (const m of this.world.movers) if (m.name && tg.includes(m.name)) { if (m.type === 'breakable') this.breakMover(m); else { m.targeted = false; m.locked = false; this.openDoor(m); } }
    if (b.wave) { const w = this.waves.get(b.wave); if (w) this.startWave(w); }
    if (b.msg) this.message(b.msg);
  }
  emote(kind) {
    const map = { happy: 'happy', angry: 'angry', bow: 'bow', funky: 'funky' };
    this.portrait.cp.playEmote(map[kind]); this.body.playEmote(map[kind]);
  }
  updateEnts(dt, cmd) {
    const p = this.player.pos, t = this.time;
    for (const e of this.ents) {
      if (e.dead) continue;
      if (e.item) {
        e.mesh.rotation.y += dt * 1.6; e.mesh.position.y = e.base + Math.sin(t * 2.5 + e.phase) * 2.5;
        const L = this.pointLight([e.pos[0], e.base, e.pos[2]]);
        for (const mt of e.mesh.userData.mats || []) { if (!mt.userData.base) mt.userData.base = mt.color.clone(); mt.color.copy(mt.userData.base).multiply(new THREE.Color(Math.max(0.5, L[0]), Math.max(0.5, L[1]), Math.max(0.5, L[2]))); }
        if (this.overlap(p, [e.pos[0] - 16, e.pos[1], e.pos[2] - 16], [e.pos[0] + 16, e.pos[1] + 40, e.pos[2] + 16])) {
          if (this.arsenal.isItem(e.type)) { if (!this.arsenal.pickup(e)) continue; }
          else if (e.type === 'soaker') {
            const had = this.hasSoaker; this.hasSoaker = true; this.ammo = Math.min(SOAKER.maxAmmo, this.ammo + SOAKER.startAmmo); this.soaker.raise = 1;
            this.message(had ? 'More juice for the Super Soaker!' : 'You got the SUPER SOAKER!\nHold FIRE to spray acid juice'); this.sfx.play('weapon'); this.bonusFlash([1, 0.9, 0.2], 0.4); this.emote('happy');
          } else if (e.type === 'shotgun') {
            const had = this.hasShotgun; this.hasShotgun = true; this.sausages = Math.min(SHOTGUN.maxAmmo, this.sausages + SHOTGUN.pickupAmmo); this.setWeapon('shotgun', true);
            this.message(had ? 'More sausages!' : 'You got the DOUBLE-BARREL SAUSAGE SHOTGUN!\nTwo sausages a shot. Get up close!\nSwitch weapons with 1 / 2 / Q or the WEAPON button'); this.sfx.play('weapon'); this.bonusFlash([0.9, 0.5, 0.25], 0.4); this.emote('funky');
          } else if (e.type === 'candygun') {
            const had = this.hasCandy; this.hasCandy = true; this.candy = Math.min(CANDYGUN.maxAmmo, this.candy + CANDYGUN.pickupAmmo); this.setWeapon('candygun', true);
            this.message(had ? 'More candy corn!' : 'You got the CC-9000 CANDY CORN MACHINE GUN!\nHold FIRE: the barrels spin up, then it sprays candy corn\nWeapon 3 (or Q / the WEAPON button)'); this.sfx.play('weapon'); this.bonusFlash([1, 0.75, 0.2], 0.4); this.emote('funky');
          } else if (e.type === 'turdgun') {
            const had = this.hasTurd; this.hasTurd = true; this.turds = Math.min(TURD.maxAmmo, this.turds + TURD.pickupAmmo); this.setWeapon('turd', true);
            this.message(had ? 'More turds!' : 'You got the TURD LAUNCHER!\nRockets of poo: big splash damage and a coat of brown goo\nWeapon 4 - keep your distance!'); this.sfx.play('weapon'); this.bonusFlash([0.6, 0.4, 0.2], 0.4); this.emote('funky');
          } else if (e.type === 'turdbox') {
            if (this.turds >= TURD.maxAmmo) continue;
            const n = e.amount || TURD.boxAmmo; this.turds = Math.min(TURD.maxAmmo, this.turds + n); this.hud.print(`You got a box of turds (+${n})`); this.sfx.play('ammo'); this.bonusFlash([0.6, 0.4, 0.2], 0.2);
          } else if (e.type === 'candybag') {
            if (this.candy >= CANDYGUN.maxAmmo) continue;
            const n = e.amount || CANDYGUN.bagAmmo; this.candy = Math.min(CANDYGUN.maxAmmo, this.candy + n); this.hud.print(`You got a bag of candy corn (+${n})`); this.sfx.play('ammo'); this.bonusFlash([1, 0.7, 0.2], 0.2);
          } else if (e.type === 'sausages') {
            if (this.sausages >= SHOTGUN.maxAmmo) continue;
            const n = e.amount || SHOTGUN.boxAmmo; this.sausages = Math.min(SHOTGUN.maxAmmo, this.sausages + n); this.hud.print(`You got ${n} sausages`); this.sfx.play('ammo'); this.bonusFlash([0.85, 0.45, 0.25], 0.2);
          } else if (e.type === 'juice') {
            if (!this.hasSoaker || this.ammo >= SOAKER.maxAmmo) continue;
            this.ammo = Math.min(SOAKER.maxAmmo, this.ammo + (e.amount || 50)); this.hud.print(`You got ${e.amount || 50} juice`); this.sfx.play('ammo'); this.bonusFlash([1, 0.9, 0.2], 0.2);
          } else if (e.type === 'sausagehp') {
            if (this.health >= 100) continue;
            this.health = Math.min(100, this.health + (e.amount || 10)); this.hud.print(`You ate a sausage! +${e.amount || 10} health`); this.sfx.play('health'); this.bonusFlash([0.85, 0.4, 0.2], 0.2);
          } else if (e.type === 'health') {
            if (this.health >= 100) continue;
            this.health = Math.min(100, this.health + (e.amount || 25)); this.hud.print(`You ate a pizza! +${e.amount || 25} health`); this.sfx.play('health'); this.bonusFlash([0.9, 0.5, 0.2], 0.25);
          }
          e.dead = true; this.scene.remove(e.mesh);
        }
        continue;
      }
      if (e.type === 'key' || e.type === 'slice') {
        e.mesh.rotation.y += dt * (e.type === 'key' ? 2.2 : 1.8);
        e.mesh.position.y = e.base + Math.sin(t * 2.5 + (e.phase || 0)) * 3;
        if (e.glow) { e.glow.rotation.y = -e.mesh.rotation.y; e.glow.lookAt(this.camera.position); }
        if (e.type === 'slice') { const l = this.pointLight([e.pos[0], e.base, e.pos[2]]); for (const mat of [].concat(e.mesh.material, e.mesh.children[0].material)) mat.color.setRGB(...l); }
        const ip = [e.pos[0], e.base - 10, e.pos[2]];
        if (this.overlap(p, [ip[0] - 16, ip[1] - 16, ip[2] - 16], [ip[0] + 16, ip[1] + 24, ip[2] + 16])) {
          e.dead = true; this.scene.remove(e.mesh);
          if (e.type === 'key') { this.keys.add(e.color); this.message(`You got the ${e.color.toUpperCase()} keycard!`); this.sfx.play('key'); this.bonusFlash(new THREE.Color(KEY_COLORS[e.color][0]).toArray(), 0.35); this.emote('happy'); this.portrait.flash = 1; }
          else { this.slices++; this.health = Math.min(100, this.health + 5); this.hud.print(this.slices === this.slicesTotal ? 'You found every pizza slice!' : 'You got a pizza slice (+5 health)'); this.sfx.play('slice'); this.bonusFlash([0.9, 0.65, 0.2], 0.22); this.portrait.flash = 0.5; if (this.slices === this.slicesTotal) this.emote('funky'); }
        }
      } else if (e.type === 'message' || e.type === 'secret') {
        if (this.overlap(p, e.min, e.max)) {
          e.dead = true;
          if (e.type === 'secret') { this.secrets++; this.message('You found a secret area!'); this.sfx.play('secret'); this.emote('funky'); }
          else { this.message(e.msg, true); this.sfx.play('talk'); }
        }
      } else if (e.type === 'button') {
        if (!e.pressed && (this.overlap(p, e.min, e.max, 14) || (cmd.use && this.useHits(e)))) this.pressButton(e);
      } else if (e.type === 'wave') {
        if (e.min && this.overlap(p, e.min, e.max)) { const w = this.waves.get(e.id); if (w && w.state === 'idle') this.startWave(w); }
      } else if (e.type === 'teleport') {
        if (this.overlap(p, e.min, e.max)) {
          this.teleportFx(p); const pl = this.player; pl.pos = [e.dest[0], e.dest[1] + 24.1, e.dest[2]]; pl.vel = [0, 0, 0]; if (e.angle !== undefined) pl.yaw = e.angle * Math.PI / 180;
          this.teleportFx(pl.pos); this.sfx.play('teleport'); this.flash = { rgb: [1, 0.85, 0.5], a: 0.5 }; this.trail.push(pl.pos.slice());
        }
      } else if (e.type === 'hurt') {
        if (this.overlap(p, e.min, e.max)) { e.acc = (e.acc || 0) + dt * (e.dps || 10); if (e.acc >= 4) { e.acc -= 4; this.damagePlayer(4, true); } } else e.acc = Math.max(0, (e.acc || 0) - dt * 2);
        for (const q of this.enemies) if (q.alive && !q.dormant && this.overlap(q.pos, e.min, e.max)) q.hurt((e.dps || 10) * dt * 0.5, false, true);
      } else if (e.type === 'exit') {
        if (this.overlap(p, e.min, e.max)) { e.dead = true; this.completeLevel(); }
      }
    }
  }
  useHits(e) {
    const eye = this.player.eye(); const c = [(e.min[0] + e.max[0]) / 2, (e.min[1] + e.max[1]) / 2, (e.min[2] + e.max[2]) / 2];
    const d = Math.hypot(c[0] - eye[0], c[1] - eye[1], c[2] - eye[2]); return d < 96;
  }

  completeLevel() {
    this.sfx.play('exit'); this.sfx.spray(false); this.sfx.spin(0); this.sfx.sauce(false);
    this.carry = { health: Math.max(1, Math.ceil(this.health)), ammo: this.ammo, hasSoaker: this.hasSoaker, hasShotgun: this.hasShotgun, sausages: this.sausages, hasCandy: this.hasCandy, candy: this.candy, hasTurd: this.hasTurd, turds: this.turds, inv: this.arsenal.save(), weapon: this.weapon };
    const { ep, mi } = episodeOf(this.levelIndex), E = EPISODES[ep];
    const last = mi + 1 >= E.count, nextIndex = last ? -1 : this.levelIndex + 1;
    if (!last) { const k = ep === 0 ? 'unlocked' : 'unlocked2'; this.progress[k] = Math.max(this.progress[k] || 1, mi + 2); }
    else if (ep === 0) this.progress.e1done = true;
    saveJSON(PROG_KEY, this.progress);
    this.state = 'intermission'; this.intermission = { t: 0, next: nextIndex, ep };
    this.emote('bow');
    const mm = Math.floor(this.time / 60), ss = String(Math.floor(this.time % 60)).padStart(2, '0');
    this.hud.centerPrint(`${last ? 'EPISODE ' + (ep + 1) : this.level.name} COMPLETED\n\nTIME    ${mm}:${ss}\nKILLS   ${this.kills}/${this.killsTotal}\nSLICES  ${this.slices}/${this.slicesTotal}\nSECRETS ${this.secrets}/${this.secretsTotal}\n\n${last ? E.ending : ''}\n\n${this.input.isTouch ? 'TAP' : 'PRESS JUMP'} TO CONTINUE`, 9999, 'left');
  }

  pause(on) {
    if (on && this.state === 'play') { this.state = 'paused'; this.input.enabled = false; document.exitPointerLock?.(); this.sfx.pauseSong(true); this.sfx.spray(false); this.sfx.spin(0); this.sfx.sauce(false); this.onPause && this.onPause(); }
    else if (!on && this.state === 'paused') { this.sfx.unlock(); this.sfx.pauseSong(false); this.state = 'play'; this.input.enabled = true; this.input.clearPressed(); this.clock.getDelta(); this.onResume && this.onResume(); }
  }

  // ---- frame ----
  frame(tms) {
    requestAnimationFrame(t => this.frame(t));
    let dt = Math.min(0.1, this.clock.getDelta());
    if (!this.world || this.state === 'loading') { this.renderer.setClearColor(0x000000); this.renderer.clear(); return; }
    this.shared.time.value += dt;
    this.perf(dt);
    if (this.ctxLost) return;
    if (this.state === 'play') this.safe('tick', () => this.tick(dt));
    else if (this.state === 'intermission') this.safe('intermission', () => this.tickIntermission(dt));
    this.safe('render', () => this.render(dt));
  }

  // dynamic resolution (like modern console engines): drop the render scale a little when frames run long, raise it back when there is headroom
  perf(dt) {
    this.frameAvg += (dt - this.frameAvg) * 0.05; this.dynT += dt;
    if (this.opts.showFps) { this.fpsT = (this.fpsT || 0) + dt; if (this.fpsT > 0.5) { this.fpsT = 0; const el = document.getElementById('fps'); if (el) { el.style.display = 'block'; el.textContent = Math.round(1 / this.frameAvg) + ' FPS  ' + (this.rt ? this.rt.width + 'x' + this.rt.height : ''); } } }
    else if (this.fpsT !== undefined) { this.fpsT = undefined; const el = document.getElementById('fps'); if (el) el.style.display = 'none'; }
    if (this.state !== 'play' || this.gfx().retro || this.opts.dynres === false || this.dynT < 2) return;
    this.dynT = 0;
    if (this.frameAvg > 1 / 50 && this.dynScale > 0.55) { this.dynScale = Math.max(0.55, this.dynScale * 0.88); this.resize(); }
    else if (this.frameAvg < 1 / 58 && this.dynScale < 1) { this.dynScale = Math.min(1, this.dynScale * 1.06); this.resize(); }
  }
  tick(dt) {
    this.time += dt; this.lockMsgT -= dt;
    const cmd = this.input.sample();
    if (this.input.consume('Escape')) { this.pause(true); return; }
    if (this.input.consume('KeyV')) { this.third = !this.third; this.opts.third = this.third; saveJSON(OPTS_KEY, this.opts); }
    const pl = this.player;
    this.splashT -= dt; this.noiseT -= dt;
    if (this.playerDead) { this.tickDead(dt, cmd); return; }
    pl.yaw -= cmd.dyaw * Math.PI / 180; pl.pitch -= cmd.dpitch * Math.PI / 180;
    pl.pitch = Math.max(-80 * Math.PI / 180, Math.min(80 * Math.PI / 180, pl.pitch));
    // fixed-step physics
    // Quake III: the physics runs every frame (in steps of 8 ms or less), straight from the input, no smoothing
    pl.autoHop = !!this.opts.autoHop; let left = dt; while (left > 0) { const s = Math.min(left, 0.008); pl.update(s, cmd); left -= s; }
    for (const ev of pl.events) { if (ev.type === 'jump') this.sfx.play('jump'); if (ev.type === 'land') { this.sfx.play('land'); pl.landKick = Math.min(8, ev.speed / 80); } }
    pl.events.length = 0;
    if (pl.pos[1] < -1500) { const st = this.ents.find(e => e.type === 'start'); pl.spawn(st.pos, st.angle || 0); this.message('Whoa! Back to the start.'); }
    // breadcrumb trail so Qoqs can follow you around corners and through doors
    const last = this.trail[this.trail.length - 1];
    if (pl.onground && (!last || Math.hypot(pl.pos[0] - last[0], pl.pos[1] - last[1], pl.pos[2] - last[2]) > 56)) { this.trail.push(pl.pos.slice()); if (this.trail.length > 200) { this.trail.shift(); for (const e of this.enemies) e.trailIdx--; } }
    for (let a = 0; a < 3; a++) { this.playerBrush.min[a] = pl.pos[a] + HULL_MIN[a]; this.playerBrush.max[a] = pl.pos[a] + pl.hmax[a]; }
    this.safe('doors', () => this.updateDoors(dt)); this.safe('plats', () => this.updatePlats(dt)); this.safe('items', () => this.updateEnts(dt, cmd)); this.safe('boss', () => this.director && this.director.update(dt)); this.safe('trop', () => this.trops && this.trops.update(dt)); this.safe('waves', () => this.updateWaves()); this.updateStyles(); this.safe('rain', () => this.updateRain(dt));
    this.safe('heads', () => this.slideOffHeads());
    this.safe('combat', () => this.updateCombat(dt, cmd)); this.safe('emitters', () => this.updateEmitters(dt)); this.sfx.updateAmbient(this.player.pos);
    this.input.consume('KeyE');
    this.hud.update(dt);
    // portrait looks where you turn/strafe, like the Quake/Doom face
    const turn = Math.max(-1, Math.min(1, cmd.dyaw / 6 + cmd.side * 0.6));
    this.portrait.update(dt, -turn * 0.6, Math.max(-0.4, Math.min(0.4, -pl.pitch * 0.35)));
    this.portrait.cp.drive(pl.speed, pl.onground);
    this.body.drive(pl.speed, pl.onground);
    this.body.update(dt);
    if (this.flash) { this.flash.a -= dt * 0.9; if (this.flash.a <= 0) this.flash = null; }
  }
  updateCombat(dt, cmd) {
    const pl = this.player;
    const I = this.input;
    if (I.consume('Digit1')) this.setWeapon('soaker'); if (I.consume('Digit2')) this.setWeapon('shotgun'); if (I.consume('Digit3')) this.setWeapon('candygun'); if (I.consume('Digit4')) this.setWeapon('turd');
    for (const k of W2_KEYS) if (I.consume('Digit' + W2[k].slot)) this.setWeapon(k);
    if (I.consume('KeyQ') || I.consume('WheelDown')) this.cycleWeapon(1); if (I.consume('WheelUp')) this.cycleWeapon(-1);
    this.aim.position.set(...pl.eye()); this.aim.rotation.set(pl.pitch, pl.yaw, 0, 'YXZ'); this.aim.updateMatrixWorld();
    // update dynamic flashlight
    if (this.flashlight) {
      const eye = pl.eye();
      this.flashlight.position.set(eye[0], eye[1], eye[2]);
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.aim.quaternion);
      this.flashlight.target.position.set(eye[0] + dir.x * 10, eye[1] + dir.y * 10, eye[2] + dir.z * 10);
    }
    if (this.retchT > 0) cmd = { ...cmd, fire: false }; // can't shoot while throwing up
    const w2 = W2[this.weapon] && this.arsenal.has(this.weapon) ? this.weapon : null;
    this.arsenal.update(dt, w2, cmd.fire, this.aim, pl);
    if (w2) { this.sfx.spray(false); this.sfx.spin(0); }
    else if (this.weapon === 'turd' && this.hasTurd) { this.turdgun.update(dt, cmd.fire, this.aim, pl); this.sfx.spray(false); this.sfx.spin(0); }
    else if (this.weapon === 'candygun' && this.hasCandy) { this.candygun.update(dt, cmd.fire, this.aim, pl); this.sfx.spray(false); }
    else if (this.weapon === 'shotgun' && this.hasShotgun) { this.shotgun.update(dt, cmd.fire, this.aim, pl); this.sfx.spray(false); this.sfx.spin(0); }
    else if (this.hasSoaker) { this.soaker.update(dt, cmd.fire, this.aim, pl); this.sfx.spin(0); if (cmd.fire && this.ammo <= 0) this.autoSwitch(); }
    this.updateGoo(dt);
    for (const e of this.enemies) this.safe('enemy ' + (e.kind || ''), () => e.update(dt));
    this.updateTissues(dt); this.updateSausages(dt); this.updateCandy(dt); this.updateFarts(dt); this.updateTurds(dt); this.updateFireballs(dt); this.updatePotatoes(dt); this.updateDebris(dt); this.arsenal.updateWorld(dt);
    this.updateChickens(dt); this.updateDroplets(dt); this.particles.update(dt); this.updatePuddles(dt);
    this.portrait.hurt = Math.max(0, (this.portrait.hurt || 0) - dt * 2.5);
    this.portrait.scene.background.setRGB(0.1 + this.portrait.hurt * 0.55, 0.07, 0.047);
  }
  tickDead(dt, cmd) {
    this.deathT += dt; this.time -= dt;
    this.player.update(dt, { forward: 0, side: 0, jump: false, walk: false });
    this.updatePlats(dt); this.updateStyles(); this.updateRain(dt); this.hud.update(dt);
    for (const e of this.enemies) this.safe('enemy ' + (e.kind || ''), () => e.update(dt));
    this.updateTissues(dt); this.updateSausages(dt); this.updateCandy(dt); this.updateFarts(dt); this.updateTurds(dt); this.updateFireballs(dt); this.updatePotatoes(dt); this.updateDebris(dt); this.arsenal.updateWorld(dt); this.updateGoo(dt); this.sfx.spin(0);
    this.updateChickens(dt); this.updateDroplets(dt); this.particles.update(dt); this.updatePuddles(dt);
    this.portrait.update(dt, 0, 0.3); this.portrait.scene.background.setRGB(0.5, 0.05, 0.03);
    if (this.flash) { this.flash.a = Math.max(0.25, this.flash.a - dt * 0.4); }
    if (this.deathT > 1.2 && (cmd.jump || this.input.consume('KeyE') || this.tapped)) { this.tapped = false; this.hud.center = null; this.flash = null; this.onRestart && this.onRestart(this.levelIndex); }
    this.tapped = false;
  }
  tickIntermission(dt) {
    const I = this.intermission; I.t += dt; this.updateStyles(); this.updateRain(dt); this.hud.update(0);
    this.portrait.update(dt, Math.sin(I.t) * 0.2, 0); this.body.update(dt);
    const cmd = this.input.sample();
    if (I.t > 1.5 && (cmd.jump || this.input.consume('KeyE') || this.input.consume('Enter') || this.tapped)) {
      this.tapped = false; this.hud.center = null;
      if (I.next >= 0) this.onLevelChange && this.onLevelChange(I.next);
      else this.onEpisodeEnd && this.onEpisodeEnd(I.ep);
    }
    this.tapped = false;
  }

  render(dt) {
    const pl = this.player, cam = this.camera, R = this.renderer;
    const eye = pl.eye();
    const showBody = this.third || this.state === 'intermission';
    this.body.root.visible = showBody;
    if (showBody) {
      this.body.root.position.set(pl.pos[0], pl.pos[1] - 24, pl.pos[2]);
      this.body.root.rotation.y = pl.yaw + Math.PI;
      const L = this.pointLight([pl.pos[0], pl.pos[1] + 8, pl.pos[2]]);
      for (const m of this.body.mats) m.emissive.setRGB(L[0] * 0.62, L[1] * 0.62, L[2] * 0.62);
      let yaw = pl.yaw, pitch = this.state === 'intermission' ? 0.12 : pl.pitch * 0.7 - 0.12, dist = this.state === 'intermission' ? 115 : 84;
      if (this.state === 'intermission') yaw = pl.yaw + Math.PI + Math.sin(this.intermission.t * 0.4) * 0.6;
      const piv = [pl.pos[0], pl.pos[1] + (this.state === 'intermission' ? 8 : 26), pl.pos[2]];
      const back = [Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
      const want = [piv[0] + back[0] * dist, piv[1] + back[1] * dist + 6, piv[2] + back[2] * dist];
      const f = this.world.rayFrac(piv, want);
      cam.position.set(piv[0] + (want[0] - piv[0]) * f * 0.95, piv[1] + (want[1] - piv[1]) * f * 0.95, piv[2] + (want[2] - piv[2]) * f * 0.95);
      cam.lookAt(piv[0], piv[1], piv[2]);
    } else {
      const dk = this.playerDead ? Math.min(1, this.deathT * 2.5) : 0;
      cam.position.set(eye[0], eye[1] - dk * 34, eye[2]);
      cam.rotation.set(pl.pitch * (1 - dk), pl.yaw, (pl.roll || 0) + dk * 0.6, 'YXZ');
    }
    this.shared.camPos.value.copy(cam.position);
    // 3D world at low res
    if (this.particles) { const k = this.rt.height / Math.max(1, R.getDrawingBufferSize(this._dbs || (this._dbs = new THREE.Vector2())).y); this.particles.points.material.size = 2.2 * k; this.dropFx.points.material.size = 5 * k; }
    R.setRenderTarget(this.rt); R.render(this.scene, cam);
    if (!showBody && !this.playerDead && this.state !== 'intermission') { if (W2[this.weapon] && this.arsenal.has(this.weapon)) this.arsenal.render(this.weapon, R, cam); else if (this.weapon === 'turd' && this.hasTurd) this.turdgun.render(R, cam); else if (this.weapon === 'candygun' && this.hasCandy) this.candygun.render(R, cam); else if (this.weapon === 'shotgun' && this.hasShotgun) this.shotgun.render(R, cam); else if (this.hasSoaker) this.soaker.render(R, cam); }
    // portrait
    this.portrait.render(R);
    // post: FXAA on the rendered frame, then bloom from its bright parts
    const G = this.gfx(); let src = this.rt;
    const pass = (mat, target, setup) => { this.postQuad.material = mat; setup && setup(mat.uniforms); R.setRenderTarget(target); R.render(this.postScene, this.blitCam); };
    if (G.fxaa) { pass(this.fxaaMat, this.rtAA, u => { u.tex.value = this.rt.texture; u.texel.value.set(1 / this.rt.width, 1 / this.rt.height); }); src = this.rtAA; }
    this.blitMat.uniforms.tex.value = src.texture;
    if (G.bloom) {
      const bw = this.bloomA.width, bh = this.bloomA.height;
      pass(this.brightMat, this.bloomA, u => { u.tex.value = src.texture; u.texel.value.set(1 / src.width, 1 / src.height); });
      pass(this.blurMat, this.bloomB, u => { u.tex.value = this.bloomA.texture; u.dir.value.set(1 / bw, 0); });
      pass(this.blurMat, this.bloomA, u => { u.tex.value = this.bloomB.texture; u.dir.value.set(0, 1 / bh); });
      this.blitMat.uniforms.bloomAmt.value = 0.6;
    } else this.blitMat.uniforms.bloomAmt.value = 0;
    R.setRenderTarget(null);
    { const U = this.blitMat.uniforms; U.ssr.value = this.shared.wetOn.value && this.opts.reflect !== false ? 1 : 0;
      if (U.ssr.value) { cam.updateMatrixWorld(); U.proj.value.copy(cam.projectionMatrix); U.invProj.value.copy(cam.projectionMatrixInverse); U.invView.value.copy(cam.matrixWorld);
        const vm = cam.matrixWorldInverse; U.upV.value.set(0, 1, 0).transformDirection(vm); U.xV.value.set(1, 0, 0).transformDirection(vm); U.zV.value.set(0, 0, 1).transformDirection(vm);
        const fc = this.shared.fogColor.value, L = this.shared.lightning.value; U.reflSky.value.setRGB(fc.r * 1.6 + 0.012 + L * 0.5, fc.g * 1.6 + 0.012 + L * 0.55, fc.b * 1.6 + 0.02 + L * 0.7);
        U.time.value = this.shared.time.value; U.rainAmt.value = this.rain ? 1 : 0.15; } }
    const fl = this.flash; this.blitMat.uniforms.flash.value.set(...(fl ? fl.rgb : [0, 0, 0]), fl ? Math.max(0, fl.a) : 0);
    R.render(this.blitScene, this.blitCam);
    this.hud.set({ boss: this.director && this.director.active ? Math.max(0.01, Math.ceil(this.director.boss.health / this.director.boss.maxHealth * 60) / 60) : 0, health: this.health, owned: this.arsenal.owned(), ammo: W2[this.weapon] ? this.arsenal.ammo(this.weapon) : this.weapon === 'turd' ? this.turds : this.weapon === 'candygun' ? this.candy : this.weapon === 'shotgun' ? this.sausages : this.ammo, weapon: this.hasWeapon(this.weapon) ? this.weapon : null, weapons: (this.hasSoaker ? 1 : 0) + (this.hasShotgun ? 1 : 0) + (this.hasCandy ? 1 : 0) + (this.hasTurd ? 1 : 0) + this.arsenal.owned().length, keys: this.keys, slices: this.slices, slicesTotal: this.slicesTotal, secrets: this.secrets, secretsTotal: this.secretsTotal, crosshair: !showBody && this.state === 'play' && !this.playerDead, visible: true });
    const tw = (this.hasSoaker ? 1 : 0) + (this.hasShotgun ? 1 : 0) + (this.hasCandy ? 1 : 0) + (this.hasTurd ? 1 : 0) + this.arsenal.owned().length > 1; if (tw !== this._tw) { this._tw = tw; document.body.classList.toggle('twoweap', tw); }
    this.hud.render(R, this.portrait.rt.texture);
  }
}
