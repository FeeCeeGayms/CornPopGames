// Plays notes from the SoundFont sample bank in assets/sounds.js (built by
// tools/make-soundbank.py). Every instrument is called by name:
//
//   sampler.note('brass', 72, { at: 0.5, dur: 0.3, vel: 0.9 })   // C5 on brass
//   sampler.note('kit', 38)                                        // a snare hit
//
// Notes are MIDI numbers (60 = middle C). Drum kits use General MIDI drum notes.
const DRUM = { kick: 36, kick2: 35, snare: 38, rim: 37, clap: 39, snare2: 40, hat: 42, pedal: 44, open: 46, crash: 49, ride: 51,
  tomLo: 41, tomMid: 45, tomHi: 48, tomHi2: 50, tamb: 54, cowbell: 56, crash2: 57, claves: 75, block: 76, triangle: 81, jingle: 83 };
export { DRUM };

const NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
// 'C4' -> 60, 'F#3' -> 54, 'Bb2' -> 46, or a number as it is.
export function midi(n) {
  if (typeof n === 'number') return n;
  if (DRUM[n] !== undefined) return DRUM[n];
  const m = /^([a-gA-G])([#b]?)(-?\d)$/.exec(n);
  if (!m) throw new Error(`Bad note "${n}"`);
  return 12 * (+m[3] + 1) + NOTE[m[1].toLowerCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}

export class Sampler {
  constructor(ctx, bank = window.CORNKART_SOUNDS) {
    this.ctx = ctx;
    this.bank = bank;
    this.buffers = [];
    this.exclusive = new Map(); // hi-hats: a closed hat chokes the open one
    this.ok = !!bank;
  }

  has(inst) { return !!this.bank?.instruments[inst]; }

  _buffer(i) {
    if (this.buffers[i]) return this.buffers[i];
    const s = this.bank.samples[i];
    const bin = atob(s.data), n = bin.length;
    const buf = this.ctx.createBuffer(1, n, s.rate), d = buf.getChannelData(0);
    for (let k = 0; k < n; k++) { // mu-law back to linear
      const y = bin.charCodeAt(k) / 127.5 - 1;
      d[k] = Math.sign(y) * (Math.pow(256, Math.abs(y)) - 1) / 255 * s.gain;
    }
    return (this.buffers[i] = buf);
  }

  // Decode every sample up front (call once after the audio unlocks) so the
  // first note of each sound doesn't stutter.
  warm() { if (this.ok) this.bank.samples.forEach((_, i) => this._buffer(i)); }

  _zone(inst, note) {
    const zones = this.bank.instruments[inst];
    if (!zones || !zones.length) return null;
    let best = null, bd = Infinity;
    for (const z of zones) {
      const d = note < z.lo ? z.lo - note : note > z.hi ? note - z.hi : 0;
      if (d < bd || (d === bd && Math.abs(z.root - note) < Math.abs(best.root - note))) { bd = d; best = z; }
    }
    return best;
  }

  // Play one note. dur: seconds held (leave out for one-shots and drums, which
  // ring out). slide: a note to glide to over the note's length.
  note(inst, note, { at = 0, dur = null, vel = 0.8, gain = 1, bus = null, pan = null, slide = null, rate = 1 } = {}) {
    if (!this.ok || !this.ctx) return null;
    note = midi(note);
    const z = this._zone(inst, note);
    if (!z) return null;
    const ctx = this.ctx, s = this.bank.samples[z.s], buf = this._buffer(z.s);
    const t = ctx.currentTime + Math.max(0, at);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const pitch = (n) => Math.pow(2, (n - z.root) / 12 + z.cents / 1200) * rate;
    src.playbackRate.setValueAtTime(pitch(note), t);
    if (s.loop) { src.loop = true; src.loopStart = s.loop[0] / s.rate; src.loopEnd = s.loop[1] / s.rate; }
    const g = ctx.createGain();
    const peak = vel * vel * gain * (this.bank.levels?.[inst] ?? 1) * Math.pow(10, -z.att / 20);
    const sus = peak * Math.pow(10, -Math.min(100, z.sus) / 20);
    const a = Math.min(z.a, 0.5);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + a + 0.002);
    const tHold = t + a + Math.min(z.h, 1);
    g.gain.setValueAtTime(peak, tHold);
    // SF2 decay is the time to fall 100 dB; an exponential approach matches its shape
    if (z.sus > 0) g.gain.setTargetAtTime(Math.max(sus, 0.00001), tHold, Math.max(0.01, z.d / 5));
    let end;
    const natural = s.loop ? Infinity : buf.duration / pitch(note);
    if (dur !== null) {
      const off = Math.max(t + a + 0.004, t + Math.min(dur, natural)); // never cut a note before its attack ends
      const r = Math.max(0.04, Math.min(z.r, 1.2));
      g.gain.cancelScheduledValues(off);
      g.gain.setTargetAtTime(0, off, r / 4);
      end = off + r;
    } else end = t + Math.min(natural, 6);
    if (slide !== null) src.playbackRate.exponentialRampToValueAtTime(pitch(midi(slide)), t + (dur ?? 0.3));
    let out = g;
    const p = pan ?? z.pan;
    if (p && ctx.createStereoPanner) { const sp = ctx.createStereoPanner(); sp.pan.value = Math.max(-1, Math.min(1, p)); g.connect(sp); out = sp; }
    src.connect(g);
    out.connect(bus || ctx.destination);
    src.start(t);
    src.stop(end + 0.05);
    if (z.excl) { // choke the previous voice in the same exclusive class
      const key = inst + z.excl, prev = this.exclusive.get(key);
      if (prev && prev.t < t) { prev.g.gain.cancelScheduledValues(t); prev.g.gain.setTargetAtTime(0, t, 0.01); }
      this.exclusive.set(key, { g, t });
    }
    return { src, gain: g, end };
  }

  // Several notes at once: sampler.chord('pad', ['A3', 'C4', 'E4'], opts)
  chord(inst, notes, opts = {}) { for (const n of notes) this.note(inst, n, opts); }
}
