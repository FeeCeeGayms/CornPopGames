// Renders the launcher icon at every Android density: the game logo on a dark rounded tile.
// Usage: node tools/make-icons.mjs android/app/src/main/res
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
const tile = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs><radialGradient id="g" cx="50%" cy="45%" r="65%"><stop offset="0" stop-color="#2c3524"/><stop offset="1" stop-color="#12140f"/></radialGradient></defs>
<rect width="512" height="512" rx="108" fill="url(#g)"/></svg>`);
const logo = await sharp('assets/logo.webp').resize(472, 472, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
const icon = await sharp(tile).composite([{ input: logo, top: 20, left: 20 }]).png().toBuffer();
const out = process.argv[2];
for (const [d, px] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]]) {
  mkdirSync(`${out}/mipmap-${d}`, { recursive: true });
  await sharp(icon).resize(px, px).png().toFile(`${out}/mipmap-${d}/ic_launcher.png`);
}
await sharp(icon).png().toFile(`${out}/../../../../icon-512.png`);
console.log('icons done');
