// The game's songs, written as plain text so they're easy to change.
//
// A song has a tempo (bpm), an overall volume (vol, default 1), the number of steps in a bar (16 = sixteenth
// notes in 4/4, 12 = a 3/4 waltz in sixteenths) and a list of parts. Every
// part loops its own list of bars, so a 1-bar drum beat can play under an
// 8-bar tune.
//
// Instrument parts:  { inst: 'brass', vol: 0.28, bars: ['C5 - E5 G5', ...] }
//   Each bar is a row of tokens split evenly across the bar: 1 token fills
//   the whole bar, 4 tokens are quarter notes, 8 are eighths, 16 sixteenths.
//     C4  F#3  Bb2   a note (C4 is middle C)
//     A3+C4+E4       a chord
//     -              keep holding the note before
//     .              silence
//   Optional: legato (0..1, how much of its length a note is held, default
//   0.9), oct (shift every note by octaves), pan (-1 left .. 1 right).
//
// Drum parts:  { kit: 'kit', vol: 0.32, hits: { kick: 'x...x...x...x...', ... } }
//   One character per step (or fewer: they spread out like the tokens
//   above). x = a hit, X = an accent, o = a soft ghost note, . = nothing.
//   A list of strings plays one per bar. Drum names are in DRUM in sampler.js.
//
// Instruments are the names in tools/make-soundbank.py. To add a song, add it
// here and pick it with audio.setSong('name'); tracks use their id.
import { midi } from './sampler.js';

export const SONGS = {
  // Menus and the garage: bright kart pop in C major.
  title: {
    vol: 1, bpm: 150, steps: 16,
    parts: [
      { inst: 'fingerBass', vol: 0.45, legato: 0.7, bars: [
        'C2 C3 C2 C3 C2 C3 G2 B2', 'A1 A2 A1 A2 A1 A2 E2 G2', 'F1 F2 F1 F2 F1 F2 C2 E2', 'G1 G2 G1 G2 G1 G2 D2 F2'] },
      { inst: 'rhodes', vol: 0.22, legato: 0.6, bars: [
        '. C4+E4+G4 . C4+E4+G4 . C4+E4+G4 . C4+E4+G4', '. C4+E4+A4 . C4+E4+A4 . C4+E4+A4 . C4+E4+A4',
        '. C4+F4+A4 . C4+F4+A4 . C4+F4+A4 . C4+F4+A4', '. D4+G4+B4 . D4+G4+B4 . D4+G4+B4 . D4+G4+B4'] },
      { inst: 'square', vol: 0.99, legato: 0.85, bars: [
        'E5 - D5 C5 - - G4 -', 'A4 - C5 E5 - - D5 C5', 'F5 - E5 D5 - C5 A4 C5', 'D5 - - - B4 - G4 -',
        'E5 - D5 C5 - - G5 -', 'A5 - G5 E5 - - C5 D5', 'F5 - E5 F5 - A5 G5 F5', 'G5 - - - . . D5 B4'] },
      { inst: 'glock', vol: 0.24, legato: 0.5, bars: [
        '.', '.', '.', '.',
        'C6 G5 E6 G5 C6 G5 E6 G5', 'C6 A5 E6 A5 C6 A5 E6 A5', 'C6 A5 F6 A5 C6 A5 F6 A5', 'D6 B5 G6 B5 D6 B5 G6 B5'] },
      { kit: 'kit', vol: 0.3, hits: {
        kick: 'x...x...x...x.x.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.o.', open: '..............x.',
        crash: ['x', '.', '.', '.', 'x', '.', '.', '.'] } },
    ],
  },

  // Pripyat: a dark, driving synth tune in A minor.
  pripyat: {
    vol: 1, bpm: 128, steps: 16,
    parts: [
      { inst: 'synthBass', vol: 0.42, legato: 0.6, bars: [
        'A1 A1 A2 A1 A1 A2 A1 A2', 'A1 A1 A2 A1 A1 A2 A1 A2', 'F1 F1 F2 F1 F1 F2 F1 F2', 'G1 G1 G2 G1 G1 G2 G1 G2',
        'A1 A1 A2 A1 A1 A2 A1 A2', 'A1 A1 A2 A1 A1 A2 A1 A2', 'D2 D2 D3 D2 D2 D3 D2 D3', 'E1 E1 E2 E1 E1 E2 E1 G#1'] },
      { inst: 'pad', vol: 0.2, legato: 1, bars: [
        'A3+C4+E4', 'A3+C4+E4', 'F3+A3+C4', 'G3+B3+D4', 'A3+C4+E4', 'A3+C4+E4', 'D3+F3+A3', 'E3+G#3+B3'] },
      { inst: 'saw', vol: 0.63, legato: 0.5, pan: 0.3, bars: [
        'A4 C5 E5 A5 E5 C5 A4 C5 E5 A5 C6 A5 E5 C5 A4 E4', 'A4 C5 E5 A5 E5 C5 A4 C5 E5 A5 C6 A5 E5 C5 A4 E4',
        'F4 A4 C5 F5 C5 A4 F4 A4 C5 F5 A5 F5 C5 A4 F4 C4', 'G4 B4 D5 G5 D5 B4 G4 B4 D5 G5 B5 G5 D5 B4 G4 D4',
        'A4 C5 E5 A5 E5 C5 A4 C5 E5 A5 C6 A5 E5 C5 A4 E4', 'A4 C5 E5 A5 E5 C5 A4 C5 E5 A5 C6 A5 E5 C5 A4 E4',
        'D4 F4 A4 D5 A4 F4 D4 F4 A4 D5 F5 D5 A4 F4 D4 A3', 'E4 G#4 B4 E5 B4 G#4 E4 G#4 B4 E5 G#5 E5 B4 G#4 E4 B3'] },
      { inst: 'synthBrass', vol: 0.63, legato: 0.9, bars: [
        '.', '.', '.', '.', 'E5 - - - D5 - C5 -', 'B4 - - - C5 - D5 -', 'F5 - - - E5 - D5 -', 'E5 - - - - - . .'] },
      { kit: 'danceKit', vol: 0.23, hits: {
        kick: 'X...x...x...x...', clap: '....x.......x...', hat: '..x...x...x...x.', pedal: 'o.o.o.o.o.o.o.o.',
        crash: ['x', '.', '.', '.', '.', '.', '.', '.'] } },
    ],
  },

  // Sweden: a quick, festive polka in D major.
  sweden: {
    vol: 1, bpm: 132, steps: 16,
    parts: [
      { inst: 'contrabass', vol: 0.54, legato: 0.5, bars: [
        'D2 . A1 . D2 . A1 .', 'A1 . E2 . A1 . E2 .', 'A1 . E2 . A1 . C#2 .', 'D2 . A1 . D2 . F#2 .',
        'D2 . A1 . D2 . A1 .', 'G1 . D2 . G1 . B1 .', 'A1 . E2 . A1 . C#2 .', 'D2 . A1 . D2 . . .'] },
      { inst: 'accordion', vol: 0.28, legato: 0.6, bars: [
        '. D4+F#4+A4 . D4+F#4+A4 . D4+F#4+A4 . D4+F#4+A4', '. C#4+E4+A4 . C#4+E4+A4 . C#4+E4+A4 . C#4+E4+A4',
        '. C#4+E4+G4 . C#4+E4+G4 . C#4+E4+G4 . C#4+E4+G4', '. D4+F#4+A4 . D4+F#4+A4 . D4+F#4+A4 . D4+F#4+A4',
        '. D4+F#4+A4 . D4+F#4+A4 . D4+F#4+A4 . D4+F#4+A4', '. D4+G4+B4 . D4+G4+B4 . D4+G4+B4 . D4+G4+B4',
        '. C#4+E4+G4 . C#4+E4+G4 . C#4+E4+G4 . C#4+E4+G4', '. D4+F#4+A4 . D4+F#4+A4 . D4+F#4+A4 . .'] },
      { inst: 'fiddle', vol: 0.46, legato: 0.8, bars: [
        'F#5 A5 F#5 D5 A4 - D5 F#5', 'E5 G5 E5 C#5 A4 - C#5 E5', 'G5 F#5 E5 D5 C#5 B4 A4 C#5', 'D5 F#5 A5 F#5 D5 - - .',
        'A5 B5 A5 F#5 D5 - F#5 A5', 'B5 - G5 B5 D6 - B5 G5', 'A5 G5 F#5 E5 C#5 E5 A5 C#6', 'D6 - A5 F#5 D5 - . .'] },
      { inst: 'glock', vol: 0.26, legato: 0.5, bars: [
        '.', '.', '.', '.', 'A6 B6 A6 F#6 D6 - F#6 A6', 'B6 - G6 B6 D7 - B6 G6', 'A6 G6 F#6 E6 C#6 E6 A6 C#7', 'D7 - A6 F#6 D6 - . .'] },
      { kit: 'kit', vol: 0.29, hits: {
        kick: 'x.......x.......', snare: '....x.......x...', jingle: 'x.o.x.o.x.o.x.o.',
        crash: ['x', '.', '.', '.', 'x', '.', '.', '.'] } },
    ],
  },

  // San Francisco: a funky groove in E minor.
  sanfrancisco: {
    vol: 1, bpm: 104, steps: 16,
    parts: [
      { inst: 'slapBass', vol: 0.52, legato: 0.5, bars: [
        'E2 . E3 E2 . . G2 A2 . E2 . D3 E3 . B1 D2', 'E2 . E3 E2 . . G2 A2 . E2 . D3 E3 . G2 G#2',
        'A1 . A2 A1 . . C2 C#2 . A1 . G2 A2 . E2 G2', 'A1 . A2 A1 . . C2 C#2 . B1 . B2 B1 . D#2 F#2'] },
      { inst: 'rhodes', vol: 0.26, legato: 0.4, bars: [
        '. . E4+G4+D5 . . . . E4+G4+D5 . . E4+G4+D5 . . . . .', '. . E4+G4+D5 . . . . E4+G4+D5 . . E4+G4+D5 . . . E4+G4+D5 .',
        '. . E4+G4+C#5 . . . . E4+G4+C#5 . . E4+G4+C#5 . . . . .', '. . D#4+F#4+B4 . . . . D#4+F#4+B4 . . D#4+F#4+B4 . . . . .'] },
      { inst: 'sax', vol: 0.61, legato: 0.85, bars: [
        '.', '.', '.', '.',
        'B4 - D5 E5 - G5 E5 D5', 'E5 - - - D5 B4 A4 G4', 'A4 - C#5 E5 - G5 F#5 E5', 'D#5 - - - F#5 - B4 -'] },
      { inst: 'brass', vol: 0.32, legato: 0.6, bars: [
        '.', '.', '.', '. . . . . . . . . . . . E4+G4+B4 . E4+G4+B4 .',
        '.', '.', '.', '. . . . . . . . . . . . D#4+F#4+B4 . D#4+F#4+B4 .'] },
      { kit: 'kit', vol: 0.32, hits: {
        kick: 'x.....x...x.....', snare: '....x..o.o..x...', hat: 'xxxxxxxxxxxxxx.x', open: '..............x.',
        tamb: '....x.......x...', crash: ['x', '.', '.', '.'] } },
    ],
  },

  // Transylvania: a spooky waltz in D minor (3/4, 12 steps a bar).
  transylvania: {
    vol: 1, bpm: 96, steps: 12,
    parts: [
      { inst: 'contrabass', vol: 0.44, legato: 0.6, bars: [
        'D2 . .', 'D2 . .', 'A1 . .', 'A1 . .', 'G1 . .', 'D2 . .', 'A1 . .', 'D2 . .'] },
      { inst: 'harpsichord', vol: 0.29, legato: 0.6, bars: [
        'D4 F4 A4 D5 A4 F4', 'D4 F4 A4 D5 A4 F4', 'C#4 E4 A4 C#5 A4 E4', 'C#4 E4 G4 A4 G4 E4',
        'D4 G4 Bb4 D5 Bb4 G4', 'D4 F4 A4 D5 A4 F4', 'C#4 E4 G4 A4 G4 E4', 'D4 F4 A4 D5 . .'] },
      { inst: 'organ', vol: 0.14, legato: 1, bars: [
        'D3+F3+A3', 'D3+F3+A3', 'C#3+E3+A3', 'C#3+E3+G3', 'D3+G3+Bb3', 'D3+F3+A3', 'C#3+E3+G3', 'D3+F3+A3'] },
      { inst: 'celesta', vol: 0.67, legato: 0.8, bars: [
        'D5 - F5 E5 D5 A4', 'Bb4 - A4 - - .', 'C#5 - E5 D5 C#5 A4', 'E5 - - - - .',
        'G5 - Bb5 A5 G5 D5', 'F5 - E5 D5 - A4', 'C#5 D5 E5 G5 F5 E5', 'D5 - - - - .'] },
      { inst: 'choir', vol: 0.09, legato: 1, bars: ['.', '.', '.', '.', 'D4+G4', 'D4+F4', 'C#4+E4', 'D4+F4'] },
      { inst: 'timpani', vol: 0.31, bars: ['D2 . .', '.', 'A2 . .', '.', 'G2 . .', 'D2 . .', 'A2 . A2', 'D2 . .'] },
      { kit: 'orchKit', vol: 0.43, hits: { triangle: '....o...o...', crash: ['x', '.', '.', '.', '.', '.', '.', '.'] } },
    ],
  },
  // Sydney: sunny surf rock in E major, twangy guitar over a driving beat.
  sydney: {
    vol: 1, bpm: 152, steps: 16,
    parts: [
      { inst: 'fingerBass', vol: 0.44, legato: 0.6, bars: [
        'E2 . E2 B1 E2 . G#2 B2', 'A1 . A1 E2 A2 . C#3 E2', 'B1 . B1 F#2 B2 . D#3 F#2', 'E2 . E2 B1 E2 . G#2 B2',
        'C#2 . C#2 G#1 C#2 . E2 G#2', 'A1 . A1 E2 A2 . C#3 E2', 'B1 . B1 F#2 B2 . A2 F#2', 'B1 B1 B1 B1 D#2 F#2 A2 B2'] },
      { inst: 'organ', vol: 0.25, legato: 0.5, bars: [
        '. E3+G#3+B3 . E3+G#3+B3 . E3+G#3+B3 . E3+G#3+B3', '. E3+A3+C#4 . E3+A3+C#4 . E3+A3+C#4 . E3+A3+C#4',
        '. D#3+F#3+B3 . D#3+F#3+B3 . D#3+F#3+B3 . D#3+F#3+B3', '. E3+G#3+B3 . E3+G#3+B3 . E3+G#3+B3 . E3+G#3+B3',
        '. E3+G#3+C#4 . E3+G#3+C#4 . E3+G#3+C#4 . E3+G#3+C#4', '. E3+A3+C#4 . E3+A3+C#4 . E3+A3+C#4 . E3+A3+C#4',
        '. D#3+F#3+B3 . D#3+F#3+B3 . D#3+F#3+B3 . D#3+F#3+B3', '. D#3+F#3+A3 . D#3+F#3+A3 . D#3+F#3+A3 . D#3+F#3+A3'] },
      { inst: 'guitar', vol: 0.95, legato: 0.55, oct: -1, bars: [ // tremolo-picked surf lead
        'B4 B4 B4 B4 G#4 G#4 B4 B4 E5 E5 E5 E5 D#5 D#5 B4 B4', 'C#5 C#5 C#5 C#5 A4 A4 C#5 C#5 E5 E5 E5 E5 C#5 C#5 A4 A4',
        'D#5 D#5 D#5 D#5 B4 B4 D#5 D#5 F#5 F#5 F#5 F#5 E5 E5 D#5 D#5', 'E5 E5 E5 E5 E5 E5 E5 E5 B4 B4 G#4 G#4 E4 E4 . .',
        'E5 E5 E5 E5 C#5 C#5 E5 E5 G#5 G#5 G#5 G#5 E5 E5 C#5 C#5', 'A5 A5 A5 A5 E5 E5 C#5 C#5 E5 E5 E5 E5 A4 A4 C#5 C#5',
        'B4 B4 C#5 C#5 D#5 D#5 E5 E5 F#5 F#5 F#5 F#5 D#5 D#5 B4 B4', 'F#5 F#5 F#5 F#5 F#5 F#5 F#5 F#5 D#5 D#5 B4 B4 A4 A4 F#4 F#4'] },
      { inst: 'brass', vol: 0.35, legato: 0.5, bars: [
        '.', '.', '.', '. . . . . . . . . . . . E4+G#4+B4 . E4+G#4+B4 .',
        '.', '.', '.', '. . . . . . . . D#4+F#4+B4 . . . D#4+F#4+B4 . D#4+F#4+B4 .'] },
      { kit: 'kit', vol: 0.3, hits: {
        kick: 'x...x...x...x.x.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', tamb: '..x...x...x...x.',
        crash: ['x', '.', '.', '.', 'x', '.', '.', '.'] } },
    ],
  },
};

// Turn the text into a list of notes per bar for each part, once per song.
// Each event is { at: step in the bar, len: steps held, notes: [...] }.
export function compileSong(song) {
  const steps = song.steps || 16, songVol = song.vol ?? 1;
  const parts = song.parts.map((p) => {
    if (p.kit) {
      const bars = [];
      const n = Math.max(...Object.values(p.hits).map((h) => (Array.isArray(h) ? h.length : 1)));
      for (let b = 0; b < n; b++) {
        const ev = [];
        for (const [drum, h] of Object.entries(p.hits)) {
          const pat = Array.isArray(h) ? h[b % h.length] : h;
          const each = steps / pat.length;
          for (let i = 0; i < pat.length; i++) {
            const c = pat[i];
            if (c === 'x' || c === 'X' || c === 'o') ev.push({ at: Math.round(i * each), len: each, notes: [midi(drum)], vel: c === 'X' ? 1 : c === 'o' ? 0.5 : 0.8 });
          }
        }
        bars.push(ev);
      }
      return { inst: p.kit, vol: (p.vol ?? 0.8) * songVol, drums: true, bars };
    }
    const shift = 12 * (p.oct || 0);
    const bars = p.bars.map((bar) => {
      const tok = bar.trim().split(/\s+/);
      const each = steps / tok.length, ev = [];
      for (let i = 0; i < tok.length; i++) {
        const t = tok[i];
        if (t === '-' || t === '.' || t === '') { if (t === '-' && ev.length && ev[ev.length - 1].open) ev[ev.length - 1].len += each; else if (ev.length) ev[ev.length - 1].open = false; continue; }
        if (ev.length) ev[ev.length - 1].open = false;
        ev.push({ at: Math.round(i * each), len: each, notes: t.split('+').map((n) => midi(n) + shift), vel: 0.8, open: true });
      }
      return ev;
    });
    return { inst: p.inst, vol: (p.vol ?? 0.7) * songVol, legato: p.legato ?? 0.9, pan: p.pan ?? null, bars };
  });
  // the whole song repeats after the least common multiple of its parts' lengths
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const loopBars = parts.reduce((m, p) => (m * p.bars.length) / gcd(m, p.bars.length), 1);
  return { bpm: song.bpm, steps, parts, loopBars, loopSeconds: loopBars * steps * 60 / song.bpm / 4 };
}
