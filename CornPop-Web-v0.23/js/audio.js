// Tiny WebAudio synth for Quake-ish SFX and ambience (no sample files needed).
export class Sfx {
  constructor() { this.ctx = null; this.vol = 0.7; this.music = 0.5; this.songVol = 0.7; }
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = this.vol; this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 2; this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.loadSamples();
    if (this.songPending && this.song) { this.songPending = false; this.song.play().catch(() => { this.songPending = true; }); }
  }
  setVolume(v) { this.vol = v; if (this.master) this.master.gain.setValueAtTime(v, this.ctx.currentTime); this.updateSong(); }
  // ---- level music (one track per level, looped). Web-friendly formats: Opus in WebM first, AAC (.mp4) for browsers
  // without Opus (older Safari), the old .mp3 last. Loaded as a blob so it plays from the APK's asset server, from a
  // single-file build and from hosts that won't serve audio directly (fallback: a base64 module next to the file).
  async songSrc(url) {
    this.songCache = this.songCache || {};
    if (this.songCache[url]) return this.songCache[url];
    const { blob, type } = await fetchAudio(url, 1000);
    return (this.songCache[url] = URL.createObjectURL(new Blob([blob], { type })));
  }
  async playSong(url) {
    if (url && url === this.songUrl && (this.song || this.songLoading === url)) { if (this.song) this.pauseSong(false); return; } // already playing / loading this one
    const req = this.songReq = (this.songReq || 0) + 1; // only the newest request may start a song
    if (this.song) { this.song.pause(); this.song.removeAttribute('src'); this.song = null; }
    if (this.songUrl && this.songUrl !== url && this.songCache && this.songCache[this.songUrl]) { URL.revokeObjectURL(this.songCache[this.songUrl]); delete this.songCache[this.songUrl]; } // keep one song in memory
    this.songUrl = url; if (!url) return;
    try {
      this.songLoading = url;
      const src = await this.songSrc(url); if (req !== this.songReq || this.songUrl !== url) return;
      this.songLoading = null;
      if (this.song) { this.song.pause(); this.song.removeAttribute('src'); }
      const el = new Audio(src); el.loop = true; this.song = el;
      // route the music through Web Audio so the Music slider works everywhere (iOS ignores <audio>.volume)
      if (this.ctx) { try { if (!this.songGain) { this.songGain = this.ctx.createGain(); this.songGain.connect(this.ctx.destination); } this.ctx.createMediaElementSource(el).connect(this.songGain); el.routed = true; } catch (e) { el.routed = false; } }
      this.updateSong();
      el.play().catch(() => { this.songPending = true; });
    } catch (e) { console.warn('music failed', e); }
  }
  pauseSong(on) { if (!this.song) return; if (on) this.song.pause(); else this.song.play().catch(() => { this.songPending = true; }); }
  updateSong() {
    const v = Math.max(0, Math.min(1, this.songVol));
    if (this.songGain) this.songGain.gain.setValueAtTime(v, this.ctx.currentTime);
    if (this.song) this.song.volume = this.song.routed ? 1 : v;
  }
  // ---- recorded weapon sounds (assets/sfx/*), decoded once; until they load the synth versions play instead
  async loadSamples() {
    if (this.samplesLoading || !this.ctx) return; this.samplesLoading = true; this.buf = this.buf || {};
    for (const n of ['shotgun', 'hose', 'candygun', 'fart']) {
      for (const fmt of audioFormats()) { // a format the browser claims but can't decode falls through to the next one
        try {
          const { blob } = await fetchAudio('assets/sfx/' + n + '.mp3', 500, [fmt]);
          const ab = await blob.arrayBuffer();
          this.buf[n] = await new Promise((res, rej) => this.ctx.decodeAudioData(ab, res, rej)); // callback form for older WebViews
          break;
        } catch (e) { if (fmt === audioFormats()[audioFormats().length - 1]) console.warn('sfx sample failed', n, e); }
      }
    }
  }
  sample(name, vol = 1, rate = 1, offset = 0) {
    const b = this.buf && this.buf[name]; if (!b || !this.ctx) return null;
    const s = this.ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = rate;
    const g = this.ctx.createGain(); g.gain.value = vol; s.connect(g); g.connect(this.master); s.start(0, offset); return { s, g };
  }
  // candy corn gun: the recorded machine gun loops its steady burst (0.40-1.79 s, 12 shots) while firing; on release the last shot and its echo play out
  mg(on) {
    if (!this.ctx || !this.buf || !this.buf.candygun) return;
    if (on && !this.mgNode) { const n = this.sample('candygun', 0.8); if (!n) return; n.s.loop = true; n.s.loopStart = 0.395; n.s.loopEnd = 1.79; this.mgNode = n; }
    else if (!on && this.mgNode) { const n = this.mgNode, t = this.ctx.currentTime; this.mgNode = null; n.g.gain.setTargetAtTime(0, t, 0.015); n.s.stop(t + 0.12); this.sample('candygun', 0.8, 1, 1.945); }
  }
  env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  tone(type, f0, f1, dur, peak = 0.3, at = 0, dest) {
    if (!this.ctx) return; const t = this.ctx.currentTime + at;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    this.env(g, t, 0.005, peak, dur); o.connect(g); g.connect(dest || this.master); o.start(t); o.stop(t + dur + 0.05);
  }
  noise(dur, freq, q = 1, peak = 0.3, at = 0, type = 'lowpass', f1) {
    if (!this.ctx) return; const t = this.ctx.currentTime + at;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = dur > 0.9; const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = q;
    const g = this.ctx.createGain(); this.env(g, t, 0.01, peak, dur); s.connect(f); f.connect(g); g.connect(this.master); s.start(t, Math.random()); s.stop(t + dur + 0.1);
  }
  play(name, vol = 1) { // vol < 1: route this one sound through a quieter bus (distance falloff for BCM)
    if (!this.ctx) return;
    if (vol === 1) return this.play1(name);
    const m = this.master, g = this.ctx.createGain(); g.gain.value = Math.max(0, vol); g.connect(m); this.master = g;
    try { this.play1(name); } finally { this.master = m; }
  }
  play1(name) {
    if (this.buf) { // recorded weapon sounds
      if (name === 'shotgun' && this.buf.shotgun) { this.sample('shotgun', 0.85, 0.97 + Math.random() * 0.06); return; }
      if (name === 'turdLaunch' && this.buf.fart) { this.sample('fart', 1, 0.9 + Math.random() * 0.2); return; }
      if (name === 'candyShot' && this.buf.candygun) return; // the machine-gun loop covers every shot
    }
    switch (name) {
      case 'door': this.noise(1.1, 300, 2, 0.35, 0, 'lowpass', 120); this.tone('sawtooth', 55, 45, 1.0, 0.08); this.noise(0.25, 900, 3, 0.3, 1.0, 'bandpass'); break;
      case 'doorstop': this.noise(0.25, 700, 3, 0.35, 0, 'bandpass'); this.tone('square', 90, 60, 0.15, 0.1); break;
      case 'key': [523, 659, 784, 1046].forEach((f, i) => this.tone('square', f, 0, 0.18, 0.12, i * 0.07)); this.tone('triangle', 1568, 0, 0.5, 0.1, 0.28); break;
      case 'slice': this.tone('square', 660, 990, 0.08, 0.1); this.tone('square', 990, 0, 0.1, 0.08, 0.06); break;
      case 'locked': this.tone('square', 110, 0, 0.25, 0.18); this.tone('square', 104, 0, 0.25, 0.14, 0.27); break;
      case 'jump': this.noise(0.12, 500, 1, 0.08, 0, 'bandpass', 900); break;
      case 'land': this.noise(0.15, 180, 1, 0.3); break;
      case 'secret': [392, 494, 587, 784, 988].forEach((f, i) => this.tone('triangle', f, 0, 0.6, 0.12, i * 0.09)); break;
      case 'button': this.tone('square', 220, 110, 0.12, 0.2); this.noise(0.1, 2000, 2, 0.2, 0, 'bandpass'); break;
      case 'exit': this.noise(1.6, 200, 1, 0.3, 0, 'bandpass', 3000); this.tone('sine', 110, 880, 1.5, 0.2); break;
      case 'menu': this.tone('square', 440, 0, 0.05, 0.08); break;
      case 'talk': this.tone('square', 330, 0, 0.06, 0.06); break;
      case 'qoqSight': this.tone('sawtooth', 140, 90, 0.18, 0.22); this.tone('sawtooth', 110, 70, 0.22, 0.22, 0.2); this.noise(0.12, 600, 2, 0.12, 0.2, 'bandpass'); break;
      case 'qoqPain': this.tone('sawtooth', 180, 120, 0.15, 0.2); break;
      case 'qoqDeath': this.tone('sawtooth', 160, 50, 0.9, 0.25); this.noise(0.4, 400, 1, 0.15, 0.1); break;
      case 'chickenThrow': this.noise(0.25, 900, 1, 0.15, 0, 'bandpass', 300); this.bawk(0.05); break;
      case 'chickenHit': this.bawk(0); this.bawk(0.12); this.noise(0.2, 2500, 1, 0.2, 0, 'highpass'); break;
      case 'feathers': this.noise(0.3, 3000, 1, 0.12, 0, 'highpass'); this.bawk(0); break;
      case 'splash': this.noise(0.12, 1800, 2, 0.08, 0, 'bandpass', 700); break;
      case 'sizzle': this.noise(0.35, 5000, 1, 0.08, 0, 'highpass'); break;
      case 'empty': this.tone('square', 1200, 0, 0.03, 0.12); this.tone('square', 900, 0, 0.03, 0.1, 0.06); break;
      case 'pain': this.tone('sawtooth', 300, 160, 0.16, 0.25); this.noise(0.1, 800, 1, 0.15); break;
      case 'die': this.tone('sawtooth', 280, 60, 1.1, 0.3); this.noise(0.6, 300, 1, 0.2, 0.2); break;
      case 'weapon': this.tone('square', 220, 0, 0.08, 0.15); this.tone('square', 330, 0, 0.08, 0.15, 0.08); this.tone('square', 440, 0, 0.2, 0.15, 0.16); this.noise(0.3, 1500, 2, 0.12, 0, 'bandpass'); break;
      case 'ammo': this.noise(0.25, 1200, 3, 0.18, 0, 'bandpass', 500); this.tone('square', 520, 0, 0.08, 0.08, 0.1); break;
      case 'teleport': this.noise(0.9, 400, 2, 0.25, 0, 'bandpass', 4000); this.tone('sine', 220, 1760, 0.6, 0.15); break;
      case 'spawn': this.noise(0.6, 3000, 2, 0.2, 0, 'bandpass', 400); this.tone('triangle', 880, 110, 0.5, 0.12); break;
      case 'break': this.noise(0.5, 900, 1, 0.35); this.noise(0.25, 2400, 2, 0.2, 0.05, 'bandpass'); this.tone('square', 120, 60, 0.2, 0.12); break;
      case 'lift': this.noise(1.2, 160, 2, 0.22, 0, 'lowpass'); this.tone('sawtooth', 70, 72, 1.0, 0.06); break;
      case 'marvSight': this.tone('sawtooth', 95, 70, 0.3, 0.24); this.tone('square', 75, 55, 0.3, 0.12, 0.25); this.noise(0.3, 400, 2, 0.12, 0.1, 'bandpass'); break;
      case 'marvPain': this.tone('sawtooth', 120, 80, 0.2, 0.22); this.noise(0.15, 700, 2, 0.1); break;
      case 'marvDeath': this.tone('sawtooth', 110, 35, 1.2, 0.26); this.noise(0.6, 300, 1, 0.18, 0.15); this.tone('square', 60, 40, 0.5, 0.08, 0.5); break;
      case 'sneeze': this.noise(0.12, 2600, 2, 0.12, 0, 'bandpass', 4000); this.noise(0.28, 3200, 1, 0.28, 0.14, 'bandpass', 900); this.tone('sawtooth', 260, 140, 0.18, 0.08, 0.14); break;
      case 'goo': this.noise(0.35, 500, 3, 0.35, 0, 'lowpass', 160); this.noise(0.25, 1400, 4, 0.12, 0.05, 'bandpass', 400); this.tone('sine', 220, 70, 0.3, 0.14); break;
      case 'tissueMiss': this.noise(0.12, 1200, 2, 0.08, 0, 'bandpass', 500); break;
      case 'shotgun': this.noise(0.5, 800, 0.8, 0.7, 0, 'lowpass', 100); this.tone('square', 70, 35, 0.3, 0.4); this.noise(0.1, 4500, 1, 0.3, 0, 'highpass'); this.noise(0.2, 1500, 2.5, 0.15, 0.4, 'bandpass'); this.tone('square', 280, 0, 0.06, 0.1, 0.48); this.tone('square', 200, 0, 0.07, 0.1, 0.6); break;
      case 'turdLaunch': this.noise(0.45, 250, 0.8, 0.5, 0, 'lowpass', 800); this.tone('sine', 80, 40, 0.4, 0.35); this.noise(0.3, 1400, 2.5, 0.15, 0.08, 'bandpass', 400); this.tone('sawtooth', 120, 60, 0.25, 0.1, 0.1); break;
      case 'candyShot': this.noise(0.05, 2000, 2.5, 0.2, 0, 'bandpass', 800); this.tone('square', 600, 300, 0.04, 0.06); this.tone('triangle', 1200, 800, 0.03, 0.03, 0.02); break;
      case 'ballinkiSight': this.tone('square', 520, 820, 0.12, 0.12); this.tone('square', 660, 980, 0.12, 0.1, 0.13); this.tone('square', 560, 900, 0.14, 0.1, 0.26); break;
      case 'ballinkiPain': this.tone('square', 700, 420, 0.15, 0.14); break;
      case 'ballinkiDeath': this.tone('square', 600, 120, 0.7, 0.16); this.noise(0.4, 300, 1, 0.12, 0.2); break;
      case 'fart': { const c = this.ctx; if (!c) break; const t = c.currentTime, o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g2 = c.createGain(), f = c.createBiquadFilter();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.7); lfo.frequency.value = 28; lg.gain.value = 40; lfo.connect(lg); lg.connect(o.frequency);
        f.type = 'lowpass'; f.frequency.value = 500; this.env(g2, t, 0.02, 0.45, 0.75); o.connect(f); f.connect(g2); g2.connect(this.master); o.start(t); lfo.start(t); o.stop(t + 0.85); lfo.stop(t + 0.85);
        this.noise(0.6, 400, 1, 0.12, 0.05); break; }
      case 'vomit': this.noise(0.45, 600, 2, 0.32, 0, 'bandpass', 250); this.tone('sawtooth', 160, 90, 0.35, 0.12); this.noise(0.3, 1500, 1, 0.12, 0.25, 'lowpass'); break;
      case 'frentaSight': this.tone('sine', 300, 900, 0.5, 0.12); this.tone('sine', 310, 880, 0.5, 0.1, 0.05); this.noise(0.5, 2000, 3, 0.06, 0, 'bandpass', 600); break;
      case 'frentaPain': this.tone('sine', 700, 350, 0.25, 0.14); break;
      case 'frentaDeath': this.tone('sine', 800, 80, 1.2, 0.16); this.tone('sine', 820, 90, 1.2, 0.12, 0.03); this.noise(0.8, 1500, 2, 0.1, 0, 'bandpass', 200); break;
      case 'fireSpit': this.noise(0.35, 700, 1, 0.22, 0, 'lowpass', 2500); this.tone('sawtooth', 120, 60, 0.3, 0.1); break;
      case 'fireHit': this.noise(0.5, 1200, 1, 0.3, 0, 'lowpass', 200); this.tone('square', 90, 40, 0.3, 0.12); break;
      case 'turdLaunch': this.noise(0.4, 300, 1, 0.4, 0, 'lowpass', 900); this.tone('sine', 90, 45, 0.35, 0.3); this.noise(0.25, 1600, 3, 0.1, 0.05, 'bandpass', 500); break;
      case 'turdBoom': this.noise(0.9, 600, 1, 0.55, 0, 'lowpass', 90); this.tone('sine', 70, 30, 0.7, 0.4); this.noise(0.5, 900, 4, 0.25, 0.05, 'bandpass', 300); this.tone('sawtooth', 140, 60, 0.4, 0.08, 0.1); break;
      case 'beansSight': this.tone('square', 260, 420, 0.1, 0.16); this.tone('square', 300, 480, 0.12, 0.13, 0.11); break;
      case 'beansPain': this.tone('square', 380, 240, 0.12, 0.16); break;
      case 'beansDeath': this.noise(0.4, 500, 1, 0.3, 0, 'lowpass', 150); this.tone('square', 300, 90, 0.35, 0.14); break;
      case 'potatoThrow': this.noise(0.18, 700, 1, 0.12, 0, 'bandpass', 300); this.tone('square', 240, 330, 0.08, 0.08); break;
      case 'potatoHit': this.noise(0.15, 400, 1, 0.35, 0, 'lowpass', 120); this.tone('sine', 140, 60, 0.15, 0.2); break;
      case 'candyShot': this.noise(0.06, 1800, 2, 0.16, 0, 'bandpass', 700); this.tone('square', 520, 260, 0.05, 0.05); break;
      case 'candyHit': this.noise(0.08, 2600, 3, 0.1, 0, 'bandpass'); this.tone('triangle', 900, 1400, 0.05, 0.04); break;
      case 'squelch': this.noise(0.18, 700, 3, 0.3, 0, 'lowpass', 200); this.tone('sine', 180, 60, 0.15, 0.12); break;
      case 'thud': this.noise(0.1, 400, 1, 0.15); break;
      // ---- the Q3-style snack arsenal ----
      case 'colaLaunch': this.tone('sine', 140, 60, 0.18, 0.4); this.noise(0.2, 600, 1, 0.4, 0, 'lowpass', 200); this.noise(0.35, 3500, 1, 0.12, 0.05, 'highpass'); this.tone('square', 900, 0, 0.03, 0.06, 0.12); break;
      case 'colaBounce': this.tone('triangle', 1300 + Math.random() * 300, 800, 0.08, 0.12); this.tone('square', 2400, 0, 0.02, 0.04); break;
      case 'colaHiss': this.noise(0.5, 5000, 0.8, 0.06, 0, 'highpass', 7000); break;
      case 'colaBoom': this.noise(0.12, 2500, 1, 0.5, 0, 'highpass'); this.noise(1.0, 700, 1, 0.6, 0, 'lowpass', 80); this.tone('sine', 90, 30, 0.7, 0.45); this.noise(1.4, 6000, 0.7, 0.18, 0.08, 'highpass', 2500); [0.15, 0.27, 0.36, 0.5].forEach(a => this.tone('sine', 900 + Math.random() * 900, 1800, 0.05, 0.05, a)); break;
      case 'railFire': this.tone('sawtooth', 1800, 90, 0.45, 0.22); this.tone('sine', 300, 1200, 0.25, 0.12, 0.02); this.noise(0.5, 3000, 2, 0.25, 0, 'bandpass', 400); this.tone('triangle', 220, 440, 0.35, 0.1, 0.25); this.tone('triangle', 440, 220, 0.35, 0.08, 0.5); break;
      // Trop: a trumpet (sawtooth through a brassy band-pass with a little vibrato) and pork chops
      case 'tropToot': [[0, 233, 0.16], [0.17, 311, 0.32]].forEach(([t, f, d]) => { this.tone('sawtooth', f * 0.98, f, d, 0.2, t); this.tone('square', f * 2, f * 2.01, d, 0.05, t); }); this.noise(0.08, 1800, 2, 0.06, 0, 'bandpass', 900); break;
      case 'tropSight': [[0, 349, 0.12], [0.13, 349, 0.12], [0.26, 349, 0.12], [0.39, 466, 0.5]].forEach(([t, f, d]) => { this.tone('sawtooth', f, f, d, 0.2, t); this.tone('square', f * 2, f * 2, d, 0.05, t); }); break;
      case 'tropPain': this.tone('sawtooth', 620, 380, 0.18, 0.18); this.tone('square', 900, 500, 0.12, 0.05); break;
      case 'tropDeath': [[0, 294, 0.3], [0.32, 277, 0.3], [0.64, 262, 0.3], [0.96, 247, 1.1]].forEach(([t, f, d], i) => { this.tone('sawtooth', f, i === 3 ? f * 0.94 : f, d, 0.2, t); this.tone('sine', f / 2, f / 2, d, 0.1, t); }); break; // the sad trombone, on a trumpet
      case 'tropJump': this.tone('sawtooth', 300, 520, 0.1, 0.1); break;
      case 'chopHit': this.noise(0.12, 900, 1.5, 0.35, 0, 'lowpass', 300); this.tone('sine', 160, 90, 0.1, 0.25); break;
      // BCM the boss: a deep froggy roar, heavy steps, meatball rockets
      case 'bcmSight': this.tone('sawtooth', 70, 45, 1.3, 0.32); this.tone('square', 52, 38, 1.2, 0.18, 0.05); this.noise(1.2, 380, 3, 0.3, 0, 'bandpass', 160); this.tone('sawtooth', 140, 90, 0.5, 0.12, 0.6); [0, 0.14, 0.3].forEach(t => this.tone('sine', 95, 60, 0.18, 0.2, 0.9 + t)); break;
      case 'bcmPain': this.tone('sawtooth', 120, 70, 0.4, 0.28); this.noise(0.3, 500, 2, 0.2, 0, 'bandpass', 200); this.tone('sine', 80, 50, 0.3, 0.2, 0.05); break;
      case 'bcmDeath': this.tone('sawtooth', 110, 30, 2.2, 0.32); this.tone('square', 60, 28, 2.0, 0.16, 0.1); this.noise(2.0, 300, 2, 0.28, 0, 'lowpass', 80); [0.4, 0.7, 1.0].forEach(t => this.tone('sine', 150, 70, 0.2, 0.15, t)); break;
      case 'bcmStep': this.tone('sine', 55, 28, 0.35, 0.5); this.noise(0.3, 220, 1, 0.4, 0, 'lowpass', 70); this.noise(0.12, 1200, 2, 0.08, 0.02, 'bandpass'); break;
      case 'meatLaunch': this.noise(0.5, 260, 0.8, 0.45, 0, 'lowpass', 1200); this.tone('sine', 110, 50, 0.35, 0.35); this.noise(0.6, 2200, 1.5, 0.16, 0.05, 'bandpass', 600); this.tone('sawtooth', 200, 90, 0.2, 0.08); break;
      case 'meatBoom': this.noise(0.9, 700, 1, 0.55, 0, 'lowpass', 90); this.tone('sine', 85, 30, 0.6, 0.45); this.noise(0.35, 900, 4, 0.3, 0.02, 'bandpass', 250); this.noise(0.25, 2400, 2, 0.15, 0.08, 'bandpass', 800); break;
      case 'railHit': this.noise(0.2, 900, 2, 0.3, 0, 'lowpass', 200); this.tone('sine', 300, 80, 0.2, 0.15); break;
      case 'jellyShot': this.tone('sine', 380 + Math.random() * 80, 900, 0.07, 0.16); this.tone('square', 160, 320, 0.05, 0.05); this.noise(0.05, 1500, 3, 0.08, 0, 'bandpass', 3000); break;
      case 'jellyHit': this.tone('sine', 520 + Math.random() * 120, 140, 0.16, 0.18); this.noise(0.12, 800, 4, 0.15, 0, 'bandpass', 300); break;
      case 'fondueCharge': this.tone('sawtooth', 60, 240, 0.4, 0.12); this.tone('sine', 120, 480, 0.4, 0.15); this.noise(0.4, 300, 3, 0.12, 0, 'bandpass', 2000); break;
      case 'fondueFire': this.tone('sawtooth', 240, 40, 0.8, 0.3); this.tone('sine', 110, 55, 0.9, 0.4); this.noise(0.8, 1200, 1, 0.35, 0, 'lowpass', 150); this.tone('square', 660, 330, 0.3, 0.06, 0.05); break;
      case 'fondueBoom': this.noise(1.6, 900, 0.8, 0.7, 0, 'lowpass', 60); this.tone('sine', 70, 25, 1.4, 0.55); this.tone('sawtooth', 220, 40, 1.0, 0.18); this.noise(0.8, 3000, 2, 0.2, 0.1, 'bandpass', 400); [0, 0.1, 0.22].forEach(a => this.tone('sine', 300, 120, 0.25, 0.12, 0.3 + a)); break;
      case 'zap': this.tone('sawtooth', 900 + Math.random() * 400, 200, 0.12, 0.08); this.noise(0.1, 4000, 2, 0.08, 0, 'bandpass'); break;
      case 'health': [392, 523, 659].forEach((f, i) => this.tone('triangle', f, 0, 0.15, 0.12, i * 0.06)); break;
    }
  }
  thunder(loud = 1, close = false) { // rolling thunder; a close strike starts with a sharp crack
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime, v = Math.min(1, loud);
    if (close) { this.noise(0.25, 3000, 0.7, 0.5 * v, 0, 'highpass'); this.noise(0.6, 900, 0.8, 0.45 * v, 0.02, 'lowpass', 200); }
    for (let k = 0; k < 4; k++) { const at = 0.05 + k * (0.35 + Math.random() * 0.4), dur = 1.2 + Math.random() * 1.6; this.noise(dur, 160 + Math.random() * 90, 0.9, (0.5 - k * 0.08) * v, at, 'lowpass', 60); }
    const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(48, t); o.frequency.exponentialRampToValueAtTime(30, t + 2.5);
    this.env(g, t, 0.15, 0.3 * v, 2.6); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 3);
  }
  bawk(at) { // a squawky chicken "bawk"
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime + at;
    const o = c.createOscillator(), m = c.createOscillator(), mg = c.createGain(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = 'square'; o.frequency.setValueAtTime(700, t); o.frequency.exponentialRampToValueAtTime(1150, t + 0.05); o.frequency.exponentialRampToValueAtTime(600, t + 0.16);
    m.frequency.value = 55; mg.gain.value = 260; m.connect(mg); mg.connect(o.frequency);
    f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 2; this.env(g, t, 0.01, 0.14, 0.16);
    o.connect(f); f.connect(g); g.connect(this.master); o.start(t); m.start(t); o.stop(t + 0.22); m.stop(t + 0.22);
  }
  // positional ambience: one looping voice per type, loudness from the nearest emitter
  setAmbientEmitters(list) {
    this.emit = list || []; if (!this.ctx) return;
    if (!this.loops) this.loops = {};
    for (const t of new Set(this.emit.map(e => e.type))) if (!this.loops[t]) this.loops[t] = this.makeLoop(t);
    for (const [t, l] of Object.entries(this.loops)) l.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
  }
  makeLoop(type) {
    const c = this.ctx, g = c.createGain(); g.gain.value = 0; g.connect(this.master);
    const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true; const f = c.createBiquadFilter();
    if (type === 'hum') { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 58; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240; const og = c.createGain(); og.gain.value = 0.25; o.connect(lp); lp.connect(og); og.connect(g); o.start(); f.type = 'bandpass'; f.frequency.value = 120; }
    else if (type === 'fire') { f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.6; }
    else if (type === 'wind') { f.type = 'lowpass'; f.frequency.value = 500; const l = c.createOscillator(); l.frequency.value = 0.15; const lg = c.createGain(); lg.gain.value = 300; l.connect(lg); lg.connect(f.frequency); l.start(); }
    else if (type === 'machine') { f.type = 'lowpass'; f.frequency.value = 300; const l = c.createOscillator(); l.type = 'square'; l.frequency.value = 2.2; const lg = c.createGain(); lg.gain.value = 0.5; const am = c.createGain(); am.gain.value = 0.5; l.connect(lg); lg.connect(am.gain); src.connect(f); f.connect(am); am.connect(g); src.start(); l.start(); return { gain: g, vol: 0.5 }; }
    else { f.type = 'highpass'; f.frequency.value = 2000; }
    src.connect(f); f.connect(g); src.start();
    return { gain: g, vol: type === 'hum' ? 0.35 : type === 'fire' ? 0.25 : type === 'wind' ? 0.5 : 0.15 };
  }
  updateAmbient(p) {
    if (!this.ctx || !this.emit) return; if (!this.loops) this.setAmbientEmitters(this.emit);
    const best = {};
    for (const e of this.emit) { const d = Math.hypot(e.pos[0] - p[0], e.pos[1] - p[1], e.pos[2] - p[2]); const v = Math.max(0, 1 - d / (e.radius || 400)); best[e.type] = Math.max(best[e.type] || 0, v * v * (e.vol || 1)); }
    for (const [t, l] of Object.entries(this.loops)) l.gain.gain.setTargetAtTime((best[t] || 0) * l.vol * this.music, this.ctx.currentTime, 0.25);
  }
  spin(v) { // gatling whirr of the candy corn gun, pitch follows barrel speed
    if (!this.ctx) return;
    if (!this.spinNode) {
      const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 60;
      const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
      const g = this.ctx.createGain(); g.gain.value = 0; o.connect(f); f.connect(g); g.connect(this.master); o.start();
      this.spinNode = { g, o };
    }
    if (!v) this.mg(false);
    const t = this.ctx.currentTime; this.spinNode.g.gain.setTargetAtTime(v * 0.05, t, 0.05); this.spinNode.o.frequency.setTargetAtTime(50 + v * 170, t, 0.08);
  }
  sauce(on, v = 1) { // the sauce gun: a glugging, bubbling marinara stream
    if (!this.ctx) return;
    if (!this.sauceNode) {
      const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 3;
      const lfo = c.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 11; const lg = c.createGain(); lg.gain.value = 260; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 70; const og = c.createGain(); og.gain.value = 0.35;
      const lfo2 = c.createOscillator(); lfo2.frequency.value = 7; const lg2 = c.createGain(); lg2.gain.value = 25; lfo2.connect(lg2); lg2.connect(o.frequency); lfo2.start();
      const g = c.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); o.connect(og); og.connect(g); g.connect(this.master); s.start(); o.start();
      this.sauceNode = g;
    }
    this.sauceNode.gain.setTargetAtTime(on ? 0.32 * v : 0, this.ctx.currentTime, on ? 0.02 : 0.06);
  }
  spray(on) { // looping stream while the soaker fires: the recorded watering hose, or a filtered-noise hiss until it loads
    if (!this.ctx) return;
    const hb = this.buf && this.buf.hose;
    if (hb) {
      if (!this.hoseNode) { const n = this.sample('hose', 0); n.s.loop = true; n.s.loopStart = 0.03; n.s.loopEnd = hb.duration - 0.03; this.hoseNode = n.g; }
      this.hoseNode.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, on ? 0.03 : 0.07);
      if (this.sprayNode) this.sprayNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
      return;
    }
    if (!this.sprayNode) {
      const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
      const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1600; f.Q.value = 1.2;
      const f2 = this.ctx.createBiquadFilter(); f2.type = 'highpass'; f2.frequency.value = 600;
      const g = this.ctx.createGain(); g.gain.value = 0; s.connect(f); f.connect(f2); f2.connect(g); g.connect(this.master); s.start();
      this.sprayNode = g;
    }
    this.sprayNode.gain.setTargetAtTime(on ? 0.16 : 0, this.ctx.currentTime, 0.03);
  }
  // ambient: low drone + drips; rain bed whose gain is set per frame
  startAmbient(kind) {
    if (!this.ctx) return; this.stopAmbient();
    const c = this.ctx, out = c.createGain(); out.gain.value = 0; out.connect(this.master); out.gain.linearRampToValueAtTime(this.music * 0.5, c.currentTime + 2);
    const nodes = [out];
    const base = kind === 'street' ? 49 : kind === 'kitchen' ? 41.2 : 36.7;
    for (const det of [0, 0.6, -0.4]) {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = base * (1 + det / 100) * (det < 0 ? 1.5 : 1);
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 180; const g = c.createGain(); g.gain.value = 0.06;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.07 + Math.random() * 0.05; const lg = c.createGain(); lg.gain.value = 60; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
      o.connect(f); f.connect(g); g.connect(out); o.start(); nodes.push(o, lfo);
    }
    const rs = c.createBufferSource(); rs.buffer = this.noiseBuf; rs.loop = true; const rf = c.createBiquadFilter(); rf.type = 'highpass'; rf.frequency.value = 1200;
    const rg = c.createGain(); rg.gain.value = 0; rs.connect(rf); rf.connect(rg); rg.connect(this.master); rs.start(); nodes.push(rs);
    this.rainGain = rg; this.amb = nodes;
    this.dripTimer = setInterval(() => { if (Math.random() < 0.5) this.tone('sine', 1400 + Math.random() * 900, 500, 0.12, 0.04 * this.music); }, 1700);
  }
  setRain(v) { if (this.rainGain) this.rainGain.gain.setTargetAtTime(v * 0.045, this.ctx.currentTime, 0.3); }
  stopAmbient() { if (this.amb) { for (const n of this.amb) { try { n.stop ? n.stop() : n.disconnect(); } catch (e) { } } this.amb = null; } clearInterval(this.dripTimer); if (this.rainGain) { this.rainGain.disconnect(); this.rainGain = null; } }
}

// ---- web audio formats ----
const FORMATS = [['.webm', 'audio/webm', 'audio/webm; codecs="opus"'], ['.mp4', 'audio/mp4', 'audio/mp4; codecs="mp4a.40.2"'], ['.mp3', 'audio/mpeg', 'audio/mpeg']];
let _fmts = null;
export function audioFormats() { // playable formats, best first
  if (_fmts) return _fmts;
  const a = typeof Audio !== 'undefined' ? new Audio() : null;
  _fmts = FORMATS.filter(f => !a || a.canPlayType(f[2]) !== '');
  if (!_fmts.length) _fmts = FORMATS.slice(); // the browser claims nothing: just try them all
  return _fmts;
}
// fetch one audio file by base name (any extension in `url` is ignored), trying each format in turn
async function fetchAudio(url, minSize = 1000, fmts = audioFormats()) {
  const base = url.replace(/\.(mp3|webm|m4a|mp4|ogg)$/i, '');
  for (const [ext, type] of fmts) {
    try { const r = await fetch(base + ext); if (r.ok) { const blob = await r.blob(); if (blob.size >= minSize) return { blob, type }; } } catch (e) { }
    try { const m = await import('../' + base + ext + '.js'); const str = atob(m.default); const u = new Uint8Array(str.length); for (let i = 0; i < str.length; i++) u[i] = str.charCodeAt(i); return { blob: new Blob([u], { type }), type }; } catch (e) { }
  }
  throw new Error('no playable audio for ' + base);
}
