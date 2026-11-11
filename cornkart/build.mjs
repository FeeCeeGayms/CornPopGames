// Builds game.js (one classic script, three.js included) and index.html.
// Usage: npm install && node build.mjs [outDir]
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const out = process.argv[2] || '.';
mkdirSync(out, { recursive: true });
await build({ entryPoints: ['src/main.js'], bundle: true, format: 'iife', minify: true, target: 'es2020', outfile: `${out}/game.js`, logLevel: 'warning' });
// the logo is inlined so the page works from file://, inside the APK and as one artifact
const logo = `data:image/webp;base64,${readFileSync('assets/logo.webp').toString('base64')}`;
const page = readFileSync('page.html', 'utf8').replaceAll('assets/logo.webp', logo);
writeFileSync(`${out}/index.html`, `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${page.replace(/<div id="game">[\s\S]*$/, '')}</head>\n<body>\n${page.slice(page.indexOf('<div id="game">'))}</body>\n</html>\n`);
writeFileSync(`${out}/artifact.html`, page);
console.log('built', out);
