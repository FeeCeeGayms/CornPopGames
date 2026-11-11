import * as THREE from 'three';
import { buildKart } from './karts/index.js';
import { CHARACTERS } from './characters.js';
import { loadModel } from './assets.js';
import { Driver } from './driver.js';
const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
r.setSize(1200, 800); document.body.appendChild(r.domElement);
const s = new THREE.Scene(); s.background = new THREE.Color(0xaaaaaa);
s.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.5));
const d = new THREE.DirectionalLight(0xffffff, 2); d.position.set(3, 5, 4); s.add(d);
const cam = new THREE.PerspectiveCamera(35, 1.5, 0.1, 100);
const views = { side: [5.5, 1.2, 0], front34: [3.5, 2.2, 4.2], rear34: [-3.2, 2.0, -4.2], top: [0.01, 7, 0], close: [1.9, 1.5, 1.2], closeL: [-1.6, 1.6, 0.6], front: [0, 1.0, 6], back: [0, 1.0, -6] };
const Q = new URLSearchParams(location.search);
const k = buildKart(Q.get('kart') || 'hotdog'); s.add(k.group);
const ch = CHARACTERS.find((c) => c.id === Q.get('char')) || CHARACTERS[0];
if (Q.has('nodriver')) { const v = views[Q.get('v') || 'front34']; cam.position.set(...v); cam.lookAt(0, 0.55, 0); r.render(s, cam); window.READY = true; } else
loadModel(ch.model).then((g) => {
  const dr = new Driver(g, ch); dr.seatIn(k); dr.update(1, +(new URLSearchParams(location.search).get('steer') || 0));
  const v = views[new URLSearchParams(location.search).get('v') || 'front34'];
  cam.position.set(...v); cam.lookAt(0, 0.55, 0); r.render(s, cam); window.READY = true;
}).catch((e) => { document.title = 'ERR ' + e.message; console.error(e); });
