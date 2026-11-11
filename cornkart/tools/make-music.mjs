#!/usr/bin/env node
// Render every song in src/music.js to its own compressed audio file.
//
//     node tools/make-music.mjs            (needs Playwright with Chromium, and ffmpeg)
//
// Each song is played through the game's own sample player in an offline audio
// context, two times round, and the second time round is kept: it starts with the
// tails of the notes ringing over from the end, so it loops without a seam. The
// result is encoded as Opus at 96 kbps (assets/music/<id>.ogg, a few hundred kB a
// song) and wrapped as assets/music/<id>.js, which the game loads with a script tag
// so it works from file:// and inside the Android app too. Rerun it after changing
// a song or the sample bank.
import { build } from 'esbuild';
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const root = resolve(new URL('..', import.meta.url).pathname);
const tmp = mkdtempSync(join(tmpdir(), 'ck-music-'));
const SR = 48000; // Opus's own rate

writeFileSync(join(tmp, 'entry.js'), `
import { Sampler } from ${JSON.stringify(join(root, 'src/sampler.js'))};
import { SONGS, compileSong } from ${JSON.stringify(join(root, 'src/music.js'))};
window.SONG_IDS = Object.keys(SONGS);
window.renderSong = async (id) => {
  const song = compileSong(SONGS[id]), L = song.loopSeconds, n = Math.round(L * ${SR});
  const ctx = new OfflineAudioContext(2, n * 2, ${SR});
  const sp = new Sampler(ctx);
  const stepDur = 60 / song.bpm / 4;
  for (let step = 0; step < song.loopBars * song.steps * 2; step++) {
    const at = step * stepDur, barN = Math.floor(step / song.steps), pos = step % song.steps;
    for (const p of song.parts) for (const e of p.bars[barN % p.bars.length]) {
      if (e.at !== pos) continue;
      for (const note of e.notes) sp.note(p.inst, note, { at, dur: p.drums ? null : e.len * stepDur * p.legato, vel: e.vel * Math.sqrt(p.vol), pan: p.pan });
    }
  }
  const buf = await ctx.startRendering();
  const out = [0, 1].map((c) => buf.getChannelData(c).slice(n, 2 * n));
  let peak = 0;
  for (const ch of out) for (const v of ch) peak = Math.max(peak, Math.abs(v));
  const enc = (f) => { const b = new Uint8Array(f.buffer); let s = ''; for (let i = 0; i < b.length; i += 32768) s += String.fromCharCode(...b.subarray(i, i + 32768)); return btoa(s); };
  return { L, n, peak, left: enc(out[0]), right: enc(out[1]) };
};`);
await build({ entryPoints: [join(tmp, 'entry.js')], bundle: true, outfile: join(tmp, 'bundle.js'), logLevel: 'warning' });
writeFileSync(join(tmp, 'page.html'), `<!doctype html><script src="file://${join(root, 'assets/sounds.js')}"></script><script src="bundle.js"></script>`);

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERR', e.message));
await page.goto('file://' + join(tmp, 'page.html'));
const ids = await page.evaluate(() => window.SONG_IDS);
const songs = {};
for (const id of ids) songs[id] = await page.evaluate((id) => window.renderSong(id), id);
await browser.close();

// One shared scale for every song, so they keep their balance against each other.
// The game undoes it with `gain` on playback.
const scale = 0.89 / Math.max(...Object.values(songs).map((s) => s.peak));
mkdirSync(join(root, 'assets/music'), { recursive: true });
for (const [id, s] of Object.entries(songs)) {
  const L = new Float32Array(Buffer.from(s.left, 'base64').buffer), R = new Float32Array(Buffer.from(s.right, 'base64').buffer);
  const wav = Buffer.alloc(44 + s.n * 4);
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + s.n * 4, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(2, 22); wav.writeUInt32LE(SR, 24); wav.writeUInt32LE(SR * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(s.n * 4, 40);
  for (let i = 0; i < s.n; i++) {
    wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * scale)) * 32767), 44 + i * 4);
    wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * scale)) * 32767), 46 + i * 4);
  }
  const wavPath = join(tmp, id + '.wav'), ogg = join(root, 'assets/music', id + '.ogg');
  writeFileSync(wavPath, wav);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', wavPath, '-c:a', 'libopus', '-b:a', '96k', '-vbr', 'on', '-compression_level', '10', '-application', 'audio', ogg]);
  const data = readFileSync(ogg);
  const meta = { gain: +(1 / scale).toFixed(5), loop: +s.L.toFixed(5), data: data.toString('base64') };
  writeFileSync(join(root, 'assets/music', id + '.js'), `(window.CORNKART_MUSIC = window.CORNKART_MUSIC || {})[${JSON.stringify(id)}] = ${JSON.stringify(meta)};\n`);
  console.log(`${id.padEnd(14)} ${s.L.toFixed(2)} s loop, ${(data.length / 1024).toFixed(0)} kB`);
}
