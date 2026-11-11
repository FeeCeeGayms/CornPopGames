// Loads driver models. Models ship as base64 inside assets/*.js so the game
// runs straight from the folder (file://) with no web server.
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const cache = new Map();

function base64ToArrayBuffer(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

export function loadModel(key) {
  if (cache.has(key)) return cache.get(key);
  const p = new Promise((resolve, reject) => {
    const src = (window.CORNKART_ASSETS || {})[key];
    if (!src) return reject(new Error(`Model "${key}" not found. Is assets/${key}.js included in index.html?`));
    const loader = new GLTFLoader();
    if (src.startsWith('http') || src.endsWith('.glb')) loader.load(src, resolve, undefined, reject);
    else loader.parse(base64ToArrayBuffer(src), '', resolve, reject);
  });
  cache.set(key, p);
  return p;
}
