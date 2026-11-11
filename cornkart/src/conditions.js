// Time of day and weather, rolled at random for every race so a track never looks
// quite the same twice. Each track lists the weathers that suit it; the time of day
// shifts its sky, sun and fog towards sunset or night, and the weather then adds
// overcast, fog, rain, snowstorms or lightning on top.
import * as THREE from 'three';
import { SKY } from './graphics.js';

export const TIMES = {
  day: { name: 'Day', weight: 2 },
  sunset: { name: 'Sunset', weight: 1 },
  night: { name: 'Night', weight: 1 },
};

// particles: a falling-particle style (see WEATHER in fx.js). rain: streaks.
// overcast: how far the sky greys out towards the fog. fog: density multiplier.
// tint: a colour cast over sky, fog and ambient light. lightning: seconds between strikes.
export const WEATHERS = {
  ash: { name: 'Falling ash', particles: 'ash' },
  storm: { name: 'Radioactive storm', particles: 'ash', rain: { color: 0x9dff5a, count: 1400, fall: 30, wind: 4, opacity: 0.55 }, overcast: 0.6, fog: 1.5, tint: 0x5f8a2a, tintAmount: 0.35, lightning: [3, 8], lightningColor: 0xd8ffc0, wet: true, call: 'ACID RAIN!' },
  snow: { name: 'Light snow', particles: 'snow' },
  blizzard: { name: 'Snowstorm', particles: 'blizzard', overcast: 0.75, fog: 9, call: 'SNOWSTORM!' },
  frost: { name: 'Clear and frosty', particles: 'clear', fog: 0.6, cover: 0.2 },
  clear: { name: 'Clear', particles: 'clear', fog: 0.7, cover: 0.15 },
  rain: { name: 'Rain', particles: 'clear', rain: { color: 0x9aa8bb, count: 1600, fall: 26, wind: 2, opacity: 0.65 }, overcast: 0.75, fog: 2.2, tint: 0x6f7a86, tintAmount: 0.35, lightning: [9, 20], lightningColor: 0xffffff, wet: true },
  thunder: { name: 'Thunderstorm', particles: 'clear', rain: { color: 0x9aa4b8, count: 1600, fall: 30, wind: 5, opacity: 0.6 }, overcast: 0.8, fog: 2.4, tint: 0x4a4058, tintAmount: 0.3, lightning: [3, 9], lightningColor: 0xe8e4ff, wet: true, call: 'THUNDERSTORM!' },
  fog: { name: 'Fog', particles: 'clear', overcast: 0.85, fog: 7, tint: 0xdfe4e8, tintAmount: 0.3, call: 'THICK FOG!' },
};

const pick = (list, weight, rand) => {
  const total = list.reduce((a, k) => a + weight(k), 0);
  let x = rand() * total;
  for (const k of list) { x -= weight(k); if (x <= 0) return k; }
  return list[list.length - 1];
};

// Roll a time and weather for a track. `force` (test hooks) can pin either one.
export function rollConditions(def, rand = Math.random, force = {}) {
  const weathers = def.weathers || [def.weather || 'ash'];
  const time = TIMES[force.time] ? force.time : pick(Object.keys(TIMES), (k) => def.times?.[k] ?? TIMES[k].weight, rand);
  const weather = weathers.includes(force.weather) ? force.weather : pick(weathers, () => 1, rand);
  return { time, weather, label: `${TIMES[time].name} · ${WEATHERS[weather].name}` };
}

const c1 = new THREE.Color(), c2 = new THREE.Color();
const mix = (a, b, t) => c1.set(a).lerp(c2.set(b), t).getHex();

// Turn a track's own sky, light and fog into this race's: { sky, light, fog, weather }.
export function resolveConditions(def, defaults, cond) {
  const sky = { ...SKY, ...def.sky };
  const light = { ...defaults.light, ...def.light };
  const fog = { color: 0xa3a993, density: 0.0028, ...def.fog };
  const [sx, sy, sz] = light.sunDir, flat = Math.hypot(sx, sz);
  if (cond.time === 'sunset') {
    Object.assign(sky, {
      top: mix(sky.top, 0x33406e, 0.55), horizon: mix(sky.horizon, 0xff9a5e, 0.65), ground: mix(sky.ground, 0x5a4a48, 0.4),
      cloudDark: mix(sky.cloudDark, 0x7a5868, 0.5), cloudLight: mix(sky.cloudLight, 0xffc49a, 0.6), sun: 0xffb070,
    });
    Object.assign(light, {
      sun: 0xffa65a, sunIntensity: light.sunIntensity * 0.8, sunDir: [sx, flat * 0.2, sz],
      hemiSky: mix(light.hemiSky, 0xffb88a, 0.4), hemiIntensity: light.hemiIntensity * 0.8, exposure: light.exposure * 0.97,
      envGround: mix(light.envGround, 0x5a4038, 0.4),
    });
    fog.color = mix(fog.color, 0xc8977f, 0.5);
  } else if (cond.time === 'night') {
    Object.assign(sky, {
      top: 0x050a1c, horizon: mix(sky.horizon, 0x1b2542, 0.85), ground: 0x0e1220,
      cloudDark: 0x121828, cloudLight: 0x3a4562, sun: 0x9ab0e0, sunGlow: 0.5,
    });
    Object.assign(light, { // moonlight, kept bright enough to race by
      sun: 0x8fa6d8, sunIntensity: Math.max(0.5, light.sunIntensity * 0.35), sunDir: [-sx, flat * 0.9, -sz],
      hemiSky: 0x60729e, hemiGround: 0x1c1c26, hemiIntensity: Math.max(0.7, light.hemiIntensity * 0.65),
      env: light.env * 0.4, exposure: light.exposure * 0.95, envGround: 0x1a1c26,
    });
    fog.color = mix(fog.color, 0x0e1426, 0.85);
    Object.assign(light, def.nightLight); // a dark track can brighten its moonlight
  }
  const w = WEATHERS[cond.weather];
  if (w.tint) {
    const t = (w.tintAmount ?? 0.3) * (cond.time === 'night' ? 0.35 : 1); // a pale tint would light up the night
    sky.top = mix(sky.top, w.tint, t * 0.8); sky.horizon = mix(sky.horizon, w.tint, t);
    fog.color = mix(fog.color, w.tint, t); light.hemiSky = mix(light.hemiSky, w.tint, t);
  }
  if (w.overcast) {
    const o = w.overcast;
    for (const k of ['top', 'horizon', 'cloudDark', 'cloudLight']) sky[k] = mix(sky[k], fog.color, o * (k === 'top' ? 0.7 : 0.85));
    sky.cover = 1; sky.sunGlow = (sky.sunGlow ?? 1) * (1 - o);
    light.sunIntensity *= 1 - o * 0.6;
  }
  if (w.cover !== undefined) sky.cover = Math.min(sky.cover, w.cover);
  fog.density *= w.fog ?? 1;
  return { sky, light, fog, weather: w };
}

// Lightning: every few seconds a double flash, then thunder a moment later.
export class Lightning {
  constructor() { this.flash = 0; this.timer = 4; this.queue = []; this.every = null; }
  set(every) { this.every = every; this.timer = every ? every[0] + Math.random() * (every[1] - every[0]) : 0; this.flash = 0; this.queue.length = 0; }
  update(dt, audio) {
    this.flash = Math.max(0, this.flash - dt * 5);
    if (!this.every) return 0;
    this.timer -= dt;
    if (this.timer <= 0) {
      const [a, b] = this.every;
      this.timer = a + Math.random() * (b - a);
      this.queue.push(0, 0.12 + Math.random() * 0.1);
      audio?.play('thunder', 0.4 + Math.random() * 1.2);
    }
    for (let i = this.queue.length - 1; i >= 0; i--) {
      this.queue[i] -= dt;
      if (this.queue[i] <= 0) { this.flash = 1; this.queue.splice(i, 1); }
    }
    return this.flash;
  }
}
