// Wraps a .glb driver model as assets/<key>.js so the game can load it from
// file:// with no web server.  Usage: node tools/glb-to-js.mjs model.glb key
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const [src, key] = process.argv.slice(2);
if (!src || !key) { console.error('usage: node tools/glb-to-js.mjs <model.glb> <key>'); process.exit(1); }
const b64 = readFileSync(src).toString('base64');
mkdirSync('assets', { recursive: true });
writeFileSync(`assets/${key}.js`, `window.CORNKART_ASSETS = window.CORNKART_ASSETS || {};\nwindow.CORNKART_ASSETS[${JSON.stringify(key)}] = "${b64}";\n`);
console.log(`wrote assets/${key}.js (${(b64.length / 1e6).toFixed(1)} MB). Add <script src="assets/${key}.js"></script> to page.html.`);
