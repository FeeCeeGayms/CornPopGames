import { Game } from './game.js';
import { LEVELS, EPISODES } from './levels.js';

const $ = (id) => document.getElementById(id);
const screens = ['loading', 'title', 'episodes', 'levels', 'pause', 'options', 'help'];
let stack = [];
function show(name) { for (const s of screens) $(s).classList.toggle('on', s === name); document.body.classList.toggle('playing', !name); }
function push(name) { stack.push(name); show(name); }
function back() { stack.pop(); show(stack[stack.length - 1] || null); if (!stack.length && game.state === 'paused') game.pause(false); }
function setLoad(p, msg) { $('loadbar').style.width = Math.round(p * 100) + '%'; if (msg) $('loadmsg').textContent = msg.toUpperCase(); }

const game = new Game();
// raw mouse like Quake III (no OS acceleration) where the browser allows it
function rawLock() { const c = game.canvas; if (!c.requestPointerLock) return; try { const p = c.requestPointerLock({ unadjustedMovement: true }); if (p && p.catch) p.catch(() => { try { c.requestPointerLock(); } catch (e) { } }); } catch (e) { try { c.requestPointerLock(); } catch (e2) { } } }
window.game = game;

// only one map load at a time: the death screen (and the intermission) asked to restart on every frame the jump button was
// held, and each request started its own load, so a map could be built two or three times over (doubled doors, extra enemies,
// slow frames). Requests that arrive while a load is running are ignored.
let levelBusy = false;
async function startLevel(i, mode = 'select') {
  if (levelBusy) return;
  levelBusy = true; game.state = 'loading';
  try { await startLevel1(i, mode); } finally { levelBusy = false; }
}
async function startLevel1(i, mode) {
  game.prepareCarry(i, mode);
  stack = []; show('loading'); setLoad(0, `Entering ${LEVELS[i].title}`);
  game.sfx.unlock();
  await new Promise(r => setTimeout(r, 30));
  await game.loadLevel(i, p => setLoad(p));
  show(null);
  if (!game.input.isTouch && !matchMedia('(pointer: coarse)').matches) rawLock();
}
function goFullscreen() {
  if (!matchMedia('(pointer: coarse)').matches) return;
  const el = document.documentElement;
  try { const p = el.requestFullscreen?.({ navigationUI: 'hide' }); p && p.then(() => screen.orientation?.lock?.('landscape').catch(() => { })).catch(() => { }); } catch (e) { }
}

game.onPause = () => { stack = ['pause']; syncOptions(); show('pause'); };
game.onResume = () => { stack = []; show(null); if (!game.input.isTouch) rawLock(); };
game.onLevelChange = (i) => startLevel(i, 'next');
game.onRestart = (i) => startLevel(i, 'restart');
game.onEpisodeEnd = (ep) => { game.sfx.stopAmbient(); game.sfx.playSong(null); game.state = 'loading'; stack = ['title']; show('title'); $('titlemsg').textContent = ['EPISODE 1 COMPLETE! NEW YORK NEEDS YOU: START EPISODE 2', 'NEW YORK IS SAVED! THE QOQS RAN BACK HOME: START EPISODE 3', 'CORNPOP CONQUERED THE PIDSER CAVE! THANKS FOR PLAYING'][ep]; buildLevelList(); };

function buildLevelList() {
  const L = $('levellist'); L.innerHTML = '';
  EPISODES.forEach((E, ep) => {
    const h = document.createElement('h4'); h.textContent = E.title; L.appendChild(h);
    for (let k = 0; k < E.count; k++) {
      const i = E.start + k, lv = LEVELS[i]; if (!lv) continue;
      const b = document.createElement('button'); b.textContent = lv.title; b.disabled = k + 1 > (game.progress[['unlocked', 'unlocked2', 'unlocked3'][ep]] || 1);
      b.onclick = () => { game.sfx.unlock(); game.sfx.play('menu'); goFullscreen(); startLevel(i); }; L.appendChild(b);
    }
  });
}

function syncOptions() {
  for (const k of ['sens', 'touchSens', 'fov', 'gamma', 'vol', 'music', 'songVol']) $('o-' + k).value = game.opts[k] ?? 0.7;
  for (const k of ['vol', 'songVol']) $('p-' + k).value = game.opts[k] ?? 0.7;
  for (const k of ['invert', 'res', 'third', 'touchUI', 'retro', 'reflect', 'gfx', 'dynres', 'autoHop', 'showFps']) $('o-' + k).value = String(game.opts[k] ?? true);
}
for (const k of ['sens', 'touchSens', 'fov', 'gamma', 'vol', 'music', 'songVol']) $('o-' + k).addEventListener('input', e => { game.opts[k] = parseFloat(e.target.value); game.saveOpts(); });
// quick music / sound FX sliders on the pause menu (same settings as Options)
for (const k of ['vol', 'songVol']) $('p-' + k).addEventListener('input', e => { game.opts[k] = parseFloat(e.target.value); game.saveOpts(); if (k === 'vol') game.sfx.play('menu'); });
for (const k of ['invert', 'third', 'retro', 'reflect', 'dynres', 'autoHop', 'showFps']) $('o-' + k).addEventListener('change', e => { game.opts[k] = e.target.value === 'true'; game.saveOpts(); });
$('o-gfx').addEventListener('change', e => { game.opts.gfx = e.target.value; game.dynScale = 1; game.saveOpts(); });
$('o-res').addEventListener('change', e => { game.opts.res = parseInt(e.target.value); game.saveOpts(); });
$('o-touchUI').addEventListener('change', e => { game.opts.touchUI = e.target.value; game.saveOpts(); });

document.addEventListener('click', e => {
  const b = e.target.closest('button[data-act]'); if (!b) return;
  game.sfx.unlock(); game.sfx.play('menu');
  const act = b.dataset.act;
  if (act === 'new') push('episodes');
  else if (/^ep[123]$/.test(act)) { goFullscreen(); const E = EPISODES[+act[2] - 1]; startLevel(E.start, 'new'); }
  else if (act === 'levels') { buildLevelList(); push('levels'); }
  else if (act === 'options') { syncOptions(); push('options'); }
  else if (act === 'help') push('help');
  else if (act === 'back') back();
  else if (act === 'resume') { stack = []; game.pause(false); }
  else if (act === 'restart') { startLevel(game.levelIndex, 'restart'); }
  else if (act === 'quit') { game.sfx.stopAmbient(); game.sfx.playSong(null); game.state = 'loading'; stack = ['title']; show('title'); }
});
// tap to continue on intermission
game.canvas.addEventListener('pointerdown', () => { if (game.state === 'intermission' || game.playerDead) game.tapped = true; });
addEventListener('keydown', e => { if (e.code === 'Escape' && stack.length && stack[stack.length - 1] !== 'title' && stack[stack.length - 1] !== 'pause') back(); });
document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && game.state === 'play' && !game.input.isTouch) game.pause(true); });
addEventListener('pointerdown', e => { if (e.pointerType === 'touch') { document.body.classList.add('touch'); document.body.classList.remove('pad'); game.input.isTouch = true; game.input.padActive = game.input.padShown = false; } }, { capture: true });
document.addEventListener('visibilitychange', () => { if (document.hidden && game.state === 'play') game.pause(true); });

// ---- controller menu navigation: D-pad / left stick to move, A to select, left/right to change sliders, B to go back, START to resume
const nav = { prev: {}, focus: null, repT: 0, dir: 0 };
function padMenus() {
  requestAnimationFrame(padMenus);
  const p = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find(x => x && x.connected); if (!p) return;
  const cur = stack[stack.length - 1]; const scr = cur && cur !== 'loading' ? $(cur) : null;
  const B = n => !!(p.buttons[n] && p.buttons[n].pressed), ax = n => p.axes[n] || 0;
  const edge = n => { const on = B(n); const r = on && !nav.prev[n]; nav.prev[n] = on; return r; };
  const btns = [0, 1, 9].map(n => [n, edge(n)]);
  if (!scr || !scr.classList.contains('on')) { if (nav.focus) nav.focus.classList.remove('padfocus'); nav.focus = null; return; }
  document.body.classList.add('pad');
  const items = [...scr.querySelectorAll('button, input[type=range], select')].filter(el => !el.disabled && el.offsetParent !== null);
  if (!items.length) return;
  if (!items.includes(nav.focus)) { if (nav.focus) nav.focus.classList.remove('padfocus'); nav.focus = items[0]; nav.focus.classList.add('padfocus'); }
  // directional input with key-repeat
  const up = B(12) || ax(1) < -0.55, down = B(13) || ax(1) > 0.55, left = B(14) || ax(0) < -0.55, right = B(15) || ax(0) > 0.55;
  const dir = up ? 1 : down ? 2 : left ? 3 : right ? 4 : 0; const now = performance.now();
  let fire = false; if (dir !== nav.dir) { nav.dir = dir; fire = !!dir; nav.repT = now + 450; } else if (dir && now > nav.repT) { fire = true; nav.repT = now + 120; }
  const f = nav.focus;
  if (fire) {
    if (dir === 1 || dir === 2) { const k = (items.indexOf(f) + (dir === 1 ? -1 : 1) + items.length) % items.length; f.classList.remove('padfocus'); nav.focus = items[k]; nav.focus.classList.add('padfocus'); nav.focus.scrollIntoView({ block: 'nearest' }); game.sfx.play('menu'); }
    else if (f.type === 'range') { const st = parseFloat(f.step) || 0.05; f.value = Math.min(parseFloat(f.max), Math.max(parseFloat(f.min), parseFloat(f.value) + (dir === 4 ? st : -st) * 2)); f.dispatchEvent(new Event('input')); }
    else if (f.tagName === 'SELECT') { f.selectedIndex = (f.selectedIndex + (dir === 4 ? 1 : -1) + f.options.length) % f.options.length; f.dispatchEvent(new Event('change')); game.sfx.play('menu'); }
    else if (dir === 3 || dir === 4) { const k = (items.indexOf(f) + (dir === 3 ? -1 : 1) + items.length) % items.length; f.classList.remove('padfocus'); nav.focus = items[k]; nav.focus.classList.add('padfocus'); game.sfx.play('menu'); }
  }
  for (const [n, pressed] of btns) {
    if (!pressed) continue;
    game.sfx.unlock();
    if (n === 0 && nav.focus && nav.focus.tagName === 'BUTTON') nav.focus.click();
    else if (n === 1 || n === 9) { if (cur === 'pause') { stack = []; game.pause(false); } else if (cur !== 'title' && n === 1) { game.sfx.play('menu'); back(); } }
  }
}
requestAnimationFrame(padMenus);
addEventListener('gamepadconnected', () => { document.body.classList.add('pad'); if (game.hud && game.state === 'play') game.hud.print('Controller connected'); });

game.init((p, msg) => setLoad(p, msg)).then(() => {
  stack = ['title']; show('title');
  const q = new URLSearchParams(location.search); if (q.has('level')) startLevel(parseInt(q.get('level')) || 0);
}).catch(err => { console.error(err); $('loadmsg').textContent = 'ERROR: ' + err.message; });
