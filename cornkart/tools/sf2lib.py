"""Minimal SoundFont 2 reader: presets -> zones with samples, key ranges and tuning."""
import struct

GEN = {0: 'startAddrsOffset', 1: 'endAddrsOffset', 2: 'startloopAddrsOffset', 3: 'endloopAddrsOffset',
       4: 'startAddrsCoarseOffset', 8: 'initialFilterFc', 12: 'endAddrsCoarseOffset', 17: 'pan',
       33: 'delayVolEnv', 34: 'attackVolEnv', 35: 'holdVolEnv', 36: 'decayVolEnv', 37: 'sustainVolEnv', 38: 'releaseVolEnv',
       41: 'instrument', 43: 'keyRange', 44: 'velRange', 45: 'startloopAddrsCoarseOffset', 48: 'initialAttenuation',
       50: 'endloopAddrsCoarseOffset', 51: 'coarseTune', 52: 'fineTune', 53: 'sampleID', 54: 'sampleModes',
       56: 'scaleTuning', 57: 'exclusiveClass', 58: 'overridingRootKey'}

class SF2:
    def __init__(self, path):
        d = self.d = open(path, 'rb').read()
        self.c = {}
        def chunks(off, end):
            while off < end:
                cid = d[off:off + 4]; sz = struct.unpack_from('<I', d, off + 4)[0]
                yield cid, off + 8, sz
                off += 8 + sz + (sz & 1)
        for cid, o, sz in chunks(12, len(d)):
            typ = d[o:o + 4]
            for c2, o2, s2 in chunks(o + 4, o + sz): self.c[c2.decode()] = (o2, s2)
        rec = lambda name, fmt, size: [struct.unpack_from(fmt, d, self.c[name][0] + i * size) for i in range(self.c[name][1] // size)]
        self.phdr = rec('phdr', '<20sHHHIII', 38); self.pbag = rec('pbag', '<HH', 4); self.pgen = rec('pgen', '<Hh', 4)
        self.inst = rec('inst', '<20sH', 22); self.ibag = rec('ibag', '<HH', 4); self.igen = rec('igen', '<Hh', 4)
        self.shdr = rec('shdr', '<20sIIIIIBbHH', 46)
        self.smpl = self.c['smpl']

    def _zones(self, bags, gens, a, b):
        zones = []
        for z in range(a, b):
            g = {}
            for k in range(bags[z][0], bags[z + 1][0]):
                op, amt = gens[k]
                if op in (43, 44): g[GEN[op]] = (amt & 0xff, (amt >> 8) & 0xff)
                else: g[GEN.get(op, op)] = amt
            zones.append(g)
        return zones

    def presets(self):
        return {(p[2], p[1]): (p[0].split(b'\0')[0].decode('latin1'), i) for i, p in enumerate(self.phdr[:-1])}

    def sample_name(self, i): return self.shdr[i][0].split(b'\0')[0].decode('latin1')

    def regions(self, bank, prog):
        """Flattened regions: each has sample index, key/vel range and merged generators."""
        pi = self.presets()[(bank, prog)][1]
        pz = self._zones(self.pbag, self.pgen, self.phdr[pi][3], self.phdr[pi + 1][3])
        pglob = pz[0] if pz and 'instrument' not in pz[0] else {}
        out = []
        for z in pz:
            if 'instrument' not in z: continue
            ii = z['instrument']
            iz = self._zones(self.ibag, self.igen, self.inst[ii][1], self.inst[ii + 1][1])
            iglob = iz[0] if iz and 'sampleID' not in iz[0] else {}
            for zz in iz:
                if 'sampleID' not in zz: continue
                g = {**iglob, **zz}
                # preset-level generators add to instrument ones
                for k, v in {**pglob, **z}.items():
                    if k in ('instrument', 'keyRange', 'velRange'): continue
                    if isinstance(v, int) and isinstance(g.get(k, 0), int): g[k] = g.get(k, 0) + v
                kr = g.get('keyRange', (0, 127)); pk = z.get('keyRange', pglob.get('keyRange', (0, 127)))
                g['keyRange'] = (max(kr[0], pk[0]), min(kr[1], pk[1]))
                vr = g.get('velRange', (0, 127)); pv = z.get('velRange', (0, 127))
                g['velRange'] = (max(vr[0], pv[0]), min(vr[1], pv[1]))
                if g['keyRange'][0] > g['keyRange'][1]: continue
                out.append(g)
        return out

    def sample(self, i, g):
        """Return (int16 numpy array, rate, root, loop(start,end) or None) with the zone's address offsets applied."""
        import numpy as np
        name, start, end, ls, le, rate, pitch, corr, link, typ = self.shdr[i]
        start += g.get('startAddrsOffset', 0) + 32768 * g.get('startAddrsCoarseOffset', 0)
        end += g.get('endAddrsOffset', 0) + 32768 * g.get('endAddrsCoarseOffset', 0)
        ls += g.get('startloopAddrsOffset', 0) + 32768 * g.get('startloopAddrsCoarseOffset', 0)
        le += g.get('endloopAddrsOffset', 0) + 32768 * g.get('endloopAddrsCoarseOffset', 0)
        o = self.smpl[0]
        data = np.frombuffer(self.d, '<i2', end - start, o + 2 * start).astype(np.float32) / 32768
        loop = (ls - start, le - start) if g.get('sampleModes', 0) & 1 and le > ls else None
        root = g.get('overridingRootKey', -1)
        if root < 0: root = pitch
        cents = corr + g.get('coarseTune', 0) * 100 + g.get('fineTune', 0)
        return data, rate, root, cents, loop
