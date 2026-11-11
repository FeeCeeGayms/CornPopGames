// Game sound, on three separate channels into the master volume:
// - music: each song is a pre-rendered Opus file (assets/music/<id>.js, made by
//   tools/make-music.mjs from the songs in music.js), looped seamlessly. If a file
//   can't be decoded, the song is played live from the sample bank instead.
// - effects: instruments from the SoundFont sample bank (sampler.js), falling back
//   to synth sounds if the bank didn't load. The Geiger clicks are synthesised.
// - engine: the kart engine is synthesised on its own channel, so nothing played
//   from the sound font can ever cut into it.
import { Sampler } from './sampler.js';
import { SONGS, compileSong } from './music.js';

// Loudness trim for each sample effect, measured so they sit together (and
// with the engine) at a sensible level. Raise or lower one to taste.
const SFX_GAIN = { beep: 1.6, go: 1.15, boost: 2.1, pickup: 0.54, hop: 2, land: 0.23, bump: 0.42, spin: 2, splash: 0.69, drift1: 1.23, drift2: 1.07,
  turbo: 1.58, lap: 1.76, finish: 1, barrel: 0.87, crate: 1.36, secret: 0.5, thunder: 3, vampire: 0.58 };

export class Audio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicOn = true;
    this.songId = 'title';
    this.song = null;
  }

  // ctx: pass an OfflineAudioContext to render sound in tests.
  unlock(ctx = null) {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!ctx && !AC) return;
    ctx = this.ctx = ctx || new AC();
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.6;
    this.master.connect(ctx.destination);
    this.sfx = ctx.createGain(); this.sfx.gain.value = 0.9; this.sfx.connect(this.master);
    this.musicBus = ctx.createGain(); this.musicBus.gain.value = 0.55; this.musicBus.connect(this.master);
    this.engineBus = ctx.createGain(); this.engineBus.gain.value = 0.9; this.engineBus.connect(this.master);
    // noise buffer
    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // engine
    this.eng1 = ctx.createOscillator(); this.eng1.type = 'sawtooth';
    this.eng2 = ctx.createOscillator(); this.eng2.type = 'square';
    this.engFilter = ctx.createBiquadFilter(); this.engFilter.type = 'lowpass'; this.engFilter.frequency.value = 500;
    this.engGain = ctx.createGain(); this.engGain.gain.value = 0;
    this.eng1.connect(this.engFilter); this.eng2.connect(this.engFilter);
    this.engFilter.connect(this.engGain); this.engGain.connect(this.engineBus);
    this.eng1.start(); this.eng2.start();
    this.nextNote = ctx.currentTime + 0.1;
    this.step = 0;
    this.geigerAcc = 0;
    this.sampler = new Sampler(ctx);
    if (!this.sampler.ok) this.sampler = null;
    else this.sampler.warm();
    this.buffers = {}; // decoded songs
    this.setSong(this.songId, true);
  }

  // Play a sample on the effects bus; false when there's no sample bank.
  _s(inst, note, opts = {}) {
    if (!this.sampler) return false;
    this.sampler.note(inst, note, { bus: this.sfx, ...opts });
    return true;
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.6;
  }

  engine(speed, maxSpeed, gas, boosting, active) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const r = Math.min(1.4, Math.abs(speed) / maxSpeed);
    const f = 45 + r * 110 + (boosting ? 30 : 0);
    this.eng1.frequency.setTargetAtTime(f, t, 0.05);
    this.eng2.frequency.setTargetAtTime(f * 0.5 + 3, t, 0.05);
    this.engFilter.frequency.setTargetAtTime(350 + r * 900 + gas * 300, t, 0.08);
    this.engGain.gain.setTargetAtTime(active ? 0.05 + gas * 0.05 + r * 0.04 : 0, t, 0.1);
  }

  _noise(dur, { freq = 1000, q = 1, type = 'bandpass', gain = 0.5, sweep = null, at = 0 } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + at;
    const src = this.ctx.createBufferSource(); src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfx);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  }

  // A cartoon spring: a twangy tone that shoots up in pitch and wobbles as it dies away.
  _boing(base, { gain = 0.25, dur = 0.5, at = 0 } = {}) {
    const ctx = this.ctx, t = ctx.currentTime + at;
    const o = ctx.createOscillator(), o2 = ctx.createOscillator();
    o.type = 'triangle'; o2.type = 'square';
    for (const [osc, k] of [[o, 1], [o2, 0.5]]) {
      osc.frequency.setValueAtTime(base * 0.55 * k, t);
      osc.frequency.exponentialRampToValueAtTime(base * 1.7 * k, t + dur * 0.22);
      osc.frequency.exponentialRampToValueAtTime(base * 1.35 * k, t + dur);
    }
    const lfo = ctx.createOscillator(), depth = ctx.createGain(), depth2 = ctx.createGain();
    lfo.frequency.setValueAtTime(26, t); lfo.frequency.linearRampToValueAtTime(14, t + dur);
    depth.gain.setValueAtTime(base * 0.28, t); depth.gain.exponentialRampToValueAtTime(base * 0.01, t + dur);
    depth2.gain.setValueAtTime(base * 0.14, t); depth2.gain.exponentialRampToValueAtTime(base * 0.005, t + dur);
    lfo.connect(depth); depth.connect(o.frequency); lfo.connect(depth2); depth2.connect(o2.frequency);
    const mix = ctx.createGain(); mix.gain.value = 1;
    const sq = ctx.createGain(); sq.gain.value = 0.18;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800; f.Q.value = 3;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(mix); o2.connect(sq); sq.connect(mix); mix.connect(f); f.connect(g); g.connect(this.sfx);
    for (const n of [o, o2, lfo]) { n.start(t); n.stop(t + dur + 0.05); }
  }

  _tone(freq, dur, { type = 'sine', gain = 0.3, slide = null, at = 0, bus = null } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + at;
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(bus || this.sfx);
    o.start(t); o.stop(t + dur + 0.05);
  }

  play(name, arg) {
    if (!this.ctx) return;
    // boosts go boing: a pad, a pickup, a mini-turbo
    if (name === 'boost') return this._boing(150, { gain: 0.21, dur: 0.55 });
    if (name === 'pickup') return this._boing(240, { gain: 0.22, dur: 0.4 });
    if (name === 'turbo') return this._boing(200, { gain: 0.22, dur: 0.35 });
    if (this.sampler && this._sample(name, arg)) return;
    this._synth(name, arg);
  }

  // Effects from the sample bank. Each line is instrument, note, options.
  _sample(name, arg) {
    const g = SFX_GAIN[name] ?? 1;
    const s = (inst, note, o = {}) => this._s(inst, note, { ...o, gain: (o.gain ?? 1) * g });
    switch (name) {
      case 'beep': s('xylo', 'A5', { vel: 0.9 }); s('square', 'A5', { dur: 0.18, vel: 0.5 }); return true;
      case 'go': s('xylo', 'A6', { vel: 0.9 }); s('square', 'A6', { dur: 0.45, vel: 0.5 }); s('orchHit', 'A4', { vel: 0.8 }); s('kit', 'crash', { vel: 0.7 }); return true;
      case 'hop': s('woodblock', 'A5', { vel: 0.7 }); return true;
      case 'land': s('kit', 'kick', { vel: 0.9 }); s('kit', 'tomLo', { vel: 0.4 }); return true;
      case 'bump': { const v = Math.min(1, 0.4 + (arg || 8) / 20); s('taiko', 'C3', { vel: v }); s('kit', 'kick', { vel: v * 0.8 }); return true; }
      case 'spin': s('square', 'E6', { dur: 0.7, slide: 'C4', vel: 0.55 }); s('kit', 'tamb', { vel: 0.6 }); return true;
      case 'splash': s('bubble', 60, { vel: 0.9 }); s('seashore', 60, { vel: 0.9, dur: 1.2 }); return true;
      case 'drift1': s('glock', 'E6', { vel: 0.5 }); return true;
      case 'drift2': s('glock', 'B6', { vel: 0.6 }); return true;
      case 'lap': ['C5', 'E5', 'G5'].forEach((n, i) => s('brass', n, { at: i * 0.1, dur: 0.09, vel: 0.85 }));
        s('brass', 'C6', { at: 0.3, dur: 0.4, vel: 0.9 }); s('kit', 'crash', { at: 0.3, vel: 0.6 }); return true;
      case 'finish': ['G4', 'C5', 'E5', 'G5', 'E5'].forEach((n, i) => s('brass', n, { at: i * 0.13, dur: 0.11, vel: 0.85 }));
        ['C5', 'E5', 'G5', 'C6'].forEach((n) => s('brass', n, { at: 0.65, dur: 1.1, vel: 0.85 }));
        s('orchHit', 'C5', { at: 0.65, vel: 0.8 }); s('timpani', 'C3', { at: 0.65, vel: 0.9 }); s('kit', 'crash', { at: 0.65, vel: 0.8 });
        s('applause', 60, { at: 0.9, vel: 0.7 }); return true;
      case 'barrel': s('taiko', 'G2', { vel: 0.9 }); s('kit', 'crash2', { vel: 0.5 }); s('woodblock', 'C5', { vel: 0.6, at: 0.02 }); return true;
      case 'crate': s('woodblock', 'E5', { vel: 0.8 }); s('woodblock', 'B4', { vel: 0.7, at: 0.05 }); s('kit', 'clap', { vel: 0.7 }); s('kit', 'tomMid', { vel: 0.5 }); return true;
      case 'secret': ['G5', 'C6', 'E6', 'G6', 'C7'].forEach((n, i) => s('celesta', n, { at: i * 0.07, vel: 0.85 })); s('windChimes', 60, { vel: 0.6, at: 0.2 }); return true;
      case 'thunder': s('thunder', 50, { at: arg || 0, vel: 1 });
        this._noise(3.2, { freq: 200, sweep: 40, type: 'lowpass', gain: 0.5, at: (arg || 0) + 0.1 }); return true;
      case 'vampire': // bat squeaks, then a low organ "bwah-ha-ha" over a growl
        [2600, 3100, 2400].forEach((f, i) => this._tone(f, 0.07, { type: 'square', slide: f * 1.4, gain: 0.04, at: i * 0.05 }));
        s('growl', 'C4', { vel: 0.8, at: 0.2 });
        ['G3+Bb3+Db4', 'F#3+A3+C4', 'F3+Ab3+B3'].forEach((c, i) => c.split('+').forEach((n) => s('organ', n, { at: 0.25 + i * 0.24, dur: 0.2, vel: 0.7 })));
        return true;
    }
    return false; // 'click' and anything new stays synthesised
  }

  // The synth versions, used for the Geiger click and whenever the bank is missing.
  _synth(name, arg) {
    switch (name) {
      case 'beep': this._tone(440, 0.25, { type: 'square', gain: 0.15 }); break;
      case 'go': this._tone(880, 0.6, { type: 'square', gain: 0.15 }); break;
      case 'boost': this._noise(0.7, { freq: 400, sweep: 3000, q: 2, gain: 0.5 }); this._tone(200, 0.5, { type: 'sawtooth', slide: 600, gain: 0.08 }); break;
      case 'pickup': [660, 880, 1320].forEach((f, i) => this._tone(f, 0.18, { gain: 0.18, at: i * 0.06 })); break;
      case 'hop': this._tone(300, 0.12, { type: 'triangle', slide: 500, gain: 0.12 }); break;
      case 'land': this._noise(0.2, { freq: 200, type: 'lowpass', gain: 0.5 }); break;
      case 'bump': this._noise(0.25, { freq: 150, type: 'lowpass', gain: Math.min(0.8, (arg || 8) / 15) }); this._tone(90, 0.2, { type: 'square', gain: 0.1 }); break;
      case 'spin': this._tone(700, 0.8, { type: 'triangle', slide: 120, gain: 0.15 }); break;
      case 'splash': this._noise(1.0, { freq: 800, sweep: 120, type: 'lowpass', gain: 0.7 }); this._tone(220, 0.9, { type: 'sine', slide: 60, gain: 0.2 }); break;
      case 'drift1': this._tone(1200, 0.12, { type: 'square', gain: 0.06 }); break;
      case 'drift2': this._tone(1600, 0.15, { type: 'square', gain: 0.07 }); break;
      case 'turbo': this._noise(0.4, { freq: 1500, sweep: 400, q: 3, gain: 0.4 }); break;
      case 'lap': [523, 659, 784, 1046].forEach((f, i) => this._tone(f, 0.2, { type: 'square', gain: 0.1, at: i * 0.1 })); break;
      case 'finish': [523, 659, 784, 1046, 784, 1046].forEach((f, i) => this._tone(f, 0.3, { type: 'square', gain: 0.12, at: i * 0.15 })); break;
      case 'barrel': this._tone(160, 0.4, { type: 'square', slide: 60, gain: 0.2 }); this._noise(0.3, { freq: 600, gain: 0.4 }); break;
      case 'crate': this._noise(0.35, { freq: 900, q: 1.5, gain: 0.6 }); this._tone(140, 0.2, { type: 'square', slide: 70, gain: 0.12 }); break;
      case 'secret': [392, 523, 659, 784, 1046].forEach((f, i) => this._tone(f, 0.25, { type: 'triangle', gain: 0.14, at: i * 0.07 })); break;
      case 'thunder': // a crack, then a long rumble; arg delays it like distance
        this._noise(0.35, { freq: 1400, sweep: 300, q: 0.8, gain: 0.35, at: arg || 0 });
        this._noise(3.2, { freq: 260, sweep: 45, type: 'lowpass', gain: 0.9, at: (arg || 0) + 0.08 });
        break;
      case 'vampire': // bat squeaks, then a low "bwah-ha-ha"
        [2600, 3100, 2400].forEach((f, i) => this._tone(f, 0.07, { type: 'square', slide: f * 1.4, gain: 0.05, at: i * 0.05 }));
        [196, 185, 175].forEach((f, i) => this._tone(f, 0.22, { type: 'sawtooth', slide: f * 0.8, gain: 0.12, at: 0.25 + i * 0.24 }));
        break;
      case 'click': this._noise(0.012, { freq: 3000, q: 0.7, type: 'highpass', gain: 0.35 }); break;
    }
  }

  // Pick the song to play: 'title' for menus, a track id in a race. Songs
  // that don't exist leave the current one playing.
  setSong(id, force = false) {
    if (!SONGS[id] || (id === this.songId && this.started && !force)) return;
    this.songId = id;
    if (!this.ctx) return;
    this.started = true;
    this._stopSong();
    if (this.musicOn) this._startSong(id);
  }

  _startSong(id) {
    const ctx = this.ctx, token = (this.token = {});
    const live = () => { // no file: play it note by note from the sample bank
      if (this.token !== token) return;
      this.song = compileSong(SONGS[id]);
      this.step = 0;
      this.nextNote = ctx.currentTime + 0.1;
    };
    if (typeof document === 'undefined' || this.liveMusic) return live();
    this._loadSong(id).then((m) => {
      if (this.token !== token) return; // the song changed while it loaded
      const src = ctx.createBufferSource(), g = ctx.createGain();
      src.buffer = m.buffer; src.loop = true; src.loopStart = 0; src.loopEnd = Math.min(m.loop, m.buffer.duration);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(m.gain, ctx.currentTime + 0.3);
      src.connect(g); g.connect(this.musicBus);
      src.start();
      this.playing = { src, g };
    }).catch(live);
  }

  // Fetch (by script tag, so it works from file:// and in the Android app) and decode a song once.
  _loadSong(id) {
    return (this.buffers[id] ??= new Promise((ok, fail) => {
      const have = () => window.CORNKART_MUSIC?.[id];
      const decode = () => {
        const m = have();
        if (!m) return fail(new Error('no music ' + id));
        const bin = atob(m.data), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        this.ctx.decodeAudioData(bytes.buffer, (buffer) => ok({ buffer, gain: m.gain, loop: m.loop }), fail);
      };
      if (have()) return decode();
      const tag = document.createElement('script');
      tag.src = `assets/music/${id}.js`;
      tag.onload = decode; tag.onerror = () => fail(new Error('no music ' + id));
      document.head.appendChild(tag);
    })).catch((e) => { delete this.buffers[id]; throw e; });
  }

  _stopSong() {
    this.token = null;
    this.song = null;
    if (this.playing) {
      const { src, g } = this.playing, t = this.ctx.currentTime;
      g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 0.4);
      src.stop(t + 0.45);
      this.playing = null;
    }
  }

  // Geiger counter: rate rises with radiation level 0..1.
  geiger(dt, level) {
    if (!this.ctx) return;
    this.geigerAcc += dt * (0.4 + level * 40);
    while (this.geigerAcc > 1) {
      this.geigerAcc -= Math.random() * 2;
      this.play('click');
    }
  }

  // The step sequencer: call it every frame and it books the notes due in the
  // next moment. ahead: how far to book, in seconds (tests book a whole song).
  music(ahead = 0.25) {
    if (!this.ctx || !this.musicOn || !this.song) return; // only when a song has no file
    const ctx = this.ctx, song = this.song, sp = this.sampler;
    const stepDur = 60 / song.bpm / 4;
    // book far enough ahead to cover a slow frame, so a stutter doesn't drop notes
    const gap = ctx.currentTime - (this.lastMusic ?? ctx.currentTime);
    this.lastMusic = ctx.currentTime;
    ahead = Math.max(ahead, Math.min(1.5, gap * 2));
    if (this.nextNote < ctx.currentTime - 0.5) this.nextNote = ctx.currentTime + 0.05; // after a pause, skip ahead instead of rushing
    while (this.nextNote < ctx.currentTime + ahead) {
      const at = this.nextNote - ctx.currentTime;
      const barN = Math.floor(this.step / song.steps), pos = this.step % song.steps;
      for (const p of song.parts) {
        const bar = p.bars[barN % p.bars.length];
        for (const e of bar) {
          if (e.at !== pos) continue;
          if (sp) {
            const dur = p.drums ? null : e.len * stepDur * p.legato;
            for (const n of e.notes) sp.note(p.inst, n, { at, dur, vel: e.vel * Math.sqrt(p.vol), bus: this.musicBus, pan: p.pan });
          } else if (!p.drums) { // no sample bank: a plain synth voice
            for (const n of e.notes) this._tone(440 * Math.pow(2, (n - 69) / 12), e.len * stepDur, { type: 'triangle', gain: 0.08 * p.vol, at, bus: this.musicBus });
          }
        }
      }
      this.nextNote += stepDur;
      this.step++;
    }
  }

  toggleMusic() {
    this.musicOn = !this.musicOn;
    if (this.ctx) { this._stopSong(); if (this.musicOn) this._startSong(this.songId); }
    return this.musicOn;
  }
}
