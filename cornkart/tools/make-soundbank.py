#!/usr/bin/env python3
"""Build assets/sounds.js, the game's sample bank, from a General MIDI SoundFont.

    python3 tools/make-soundbank.py path/to/bank.sf2

Every instrument the music and sound effects use is listed in BANK below, by
the name the game calls it and its (bank, program) in the SoundFont. Only the
keys in its range are kept, one velocity layer, mono, as 8-bit mu-law, so the
whole bank stays a few megabytes. Each instrument also gets a level that evens
out how loud its notes are, so a part's vol means the same for every sound. To use a new sound, add a line here, rerun
this, and call it by name from src/audio.js or src/music.js.
"""
import base64, json, sys, os
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from sf2lib import SF2

DRUMS = [35, 36, 37, 38, 39, 40, 41, 42, 44, 45, 46, 47, 48, 49, 50, 51, 54, 56, 57, 75, 76, 81, 83]
BANK = {
    # name: (bank, program, lowest key, highest key)
    # basses
    'synthBass': (0, 38, 24, 60), 'fingerBass': (0, 33, 24, 60), 'slapBass': (0, 36, 24, 60), 'contrabass': (0, 43, 24, 60),
    # keys, mallets and bells
    'rhodes': (0, 4, 48, 84), 'harpsichord': (0, 6, 48, 84), 'celesta': (0, 8, 60, 96), 'glock': (0, 9, 60, 100),
    'xylo': (0, 13, 60, 96), 'tubular': (0, 14, 55, 84), 'organ': (0, 19, 36, 84), 'accordion': (0, 21, 48, 84),
    'steelDrum': (0, 114, 55, 90),
    # strings, brass, reeds
    'pizz': (0, 45, 40, 84), 'strings': (0, 48, 40, 84), 'fiddle': (0, 110, 55, 90), 'brass': (0, 61, 40, 84),
    'synthBrass': (0, 62, 40, 84), 'sax': (0, 65, 48, 84), 'flute': (0, 73, 60, 96), 'guitar': (0, 29, 36, 76),
    # synths
    'square': (0, 80, 48, 96), 'saw': (0, 81, 36, 96), 'pad': (0, 89, 36, 84), 'choir': (0, 91, 40, 84),
    'orchHit': (0, 55, 48, 72), 'timpani': (0, 47, 36, 60),
    # sound effects (played at their root note unless pitched)
    'revCymbal': (0, 119, 60, 60), 'taiko': (0, 116, 36, 60), 'synthDrum': (0, 118, 36, 72), 'woodblock': (0, 115, 60, 84),
    'scifi': (0, 103, 48, 84), 'applause': (0, 126, 60, 60), 'thunder': (2, 122, 48, 60), 'bubble': (5, 122, 48, 72),
    'seashore': (0, 122, 60, 60), 'doorCreak': (2, 124, 60, 60), 'growl': (5, 123, 48, 60), 'birds': (0, 123, 60, 72),
    'helicopter': (0, 125, 60, 60), 'windChimes': (5, 124, 60, 60), 'gunshot': (0, 127, 48, 60),
    # drum kits (General MIDI note numbers)
    'kit': (128, 0, DRUMS), 'danceKit': (128, 26, DRUMS), 'orchKit': (128, 48, DRUMS),
}
MAX_ONESHOT = 2.2   # seconds kept of a sample that doesn't loop
TARGET = 22050      # long samples are resampled to this rate

def tc(v, default):  # timecents -> seconds
    return 2 ** ((v if v is not None else default) / 1200)

def resample(x, src, dst):
    if src <= dst: return x, src
    # windowed-sinc low-pass, then linear interpolation
    fc = 0.45 * dst / src
    n = np.arange(-32, 33)
    h = np.sinc(2 * fc * n) * np.hamming(len(n)); h /= h.sum()
    y = np.convolve(x, h, mode='same')
    t = np.arange(0, len(x) - 1, src / dst)
    return np.interp(t, np.arange(len(x)), y).astype(np.float32), dst

def mulaw(x):
    x = np.clip(x, -1, 1)
    y = np.sign(x) * np.log1p(255 * np.abs(x)) / np.log1p(255)
    return np.round((y + 1) * 127.5).astype(np.uint8)

sf = SF2(sys.argv[1])
names = sf.presets()
samples, sample_ix, out, levels = [], {}, {}, {}
for name, spec in BANK.items():
    bank, prog = spec[0], spec[1]
    keys = set(spec[2]) if isinstance(spec[2], list) else set(range(spec[2], spec[3] + 1))
    regions = [g for g in sf.regions(bank, prog) if g['velRange'][0] <= 100 <= g['velRange'][1]]
    zones = []
    for g in regions:
        lo, hi = g['keyRange']
        if not any(lo <= k <= hi for k in keys): continue
        sid = g['sampleID']
        if sf.shdr[sid][9] & 2: continue  # stereo pair: keep the left (or mono) half only
        key = (sid, g.get('startAddrsOffset', 0), g.get('endAddrsOffset', 0), g.get('startloopAddrsOffset', 0), g.get('endloopAddrsOffset', 0), g.get('sampleModes', 0) & 1)
        if key not in sample_ix:
            data, rate, root, cents, loop = sf.sample(sid, g)
            if loop: data = data[:loop[1] + 1]
            else:
                data = data[:int(rate * MAX_ONESHOT)]
                fade = min(len(data), int(rate * 0.05))
                data[len(data) - fade:] *= np.linspace(1, 0, fade)
            if len(data) > 4000 and (not loop or loop[1] - loop[0] > 2000):
                d2, r2 = resample(data, rate, TARGET)
                if loop: loop = (int(loop[0] * r2 / rate), int(loop[1] * r2 / rate))
                data, rate = d2[:loop[1] + 1] if loop else d2, r2
            peak = float(np.abs(data).max()) or 1
            sample_ix[key] = len(samples)
            samples.append({'rate': rate, 'gain': round(peak, 4), 'loop': list(loop) if loop else None,
                            'data': base64.b64encode(mulaw(data / peak).tobytes()).decode()})
            sample_ix[key, 'pitch'] = (root, cents)
        root, cents = sample_ix[key, 'pitch']
        zones.append({
            'lo': max(lo, min(keys)), 'hi': min(hi, max(keys)), 's': sample_ix[key], 'root': root, 'cents': cents,
            'att': round(g.get('initialAttenuation', 0) / 10 * 0.4, 2),  # dB (SF2 attenuation is usually scaled by 0.4)
            'pan': round(g.get('pan', 0) / 500, 2),
            'a': round(tc(g.get('attackVolEnv'), -12000), 4), 'h': round(tc(g.get('holdVolEnv'), -12000), 4),
            'd': round(tc(g.get('decayVolEnv'), -12000), 4), 'sus': round(g.get('sustainVolEnv', 0) / 10, 1),
            'r': round(min(4, tc(g.get('releaseVolEnv'), -12000)), 4),
            'excl': g.get('exclusiveClass', 0),
        })
    out[name] = zones
    # loudness of a typical note, so every instrument can be evened out
    mid = 38 if isinstance(spec[2], list) else (min(keys) + max(keys)) // 2
    z = min(zones, key=lambda z: 0 if z['lo'] <= mid <= z['hi'] else min(abs(z['lo'] - mid), abs(z['hi'] - mid)))
    smp = samples[z['s']]
    x = (np.frombuffer(base64.b64decode(smp['data']), np.uint8) / 127.5 - 1)
    x = np.sign(x) * (256 ** np.abs(x) - 1) / 255 * smp['gain'] * 10 ** (-z['att'] / 20)
    rms = float(np.sqrt(np.mean(x[:int(smp['rate'] * 0.4)] ** 2))) or 1e-4
    levels[name] = round(min(8, 0.1 / rms), 3)
    print(f'{name:12s} {names[(bank, prog)][0]:22s} {len(zones)} zones, level x{levels[name]}')

bank = {'instruments': out, 'levels': levels, 'samples': samples}
js = 'window.CORNKART_SOUNDS = ' + json.dumps(bank, separators=(',', ':')) + ';\n'
os.makedirs('assets', exist_ok=True)
open('assets/sounds.js', 'w').write(js)
secs = sum(len(base64.b64decode(s['data'])) / s['rate'] for s in samples)
print(f'{len(samples)} samples, {secs:.0f} s of audio, assets/sounds.js {len(js) / 1e6:.1f} MB')
