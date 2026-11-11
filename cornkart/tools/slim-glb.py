#!/usr/bin/env python3
"""Slim a rigged .glb from Meshy or a similar tool so the game can ship it.

    python3 tools/slim-glb.py in.glb out.glb [--size 1024] [--keep Idle_3,Happy_jump_f]

- re-encodes every texture as JPEG at most --size pixels across
- quantises normals (int8), texture coordinates (uint16) and skin weights (uint8)
  with KHR_mesh_quantization, which three.js reads natively
- drops animations not listed in --keep (keeps all when --keep is left out)
- repacks the binary so only data that is still used remains
Needs numpy and Pillow.
"""
import io, json, struct, sys, argparse
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('dst')
ap.add_argument('--size', type=int, default=1024)
ap.add_argument('--quality', type=int, default=85)
ap.add_argument('--keep', default='')
a = ap.parse_args()

raw = open(a.src, 'rb').read()
jlen = struct.unpack_from('<I', raw, 12)[0]
gl = json.loads(raw[20:20 + jlen])
boff = 20 + jlen
blen = struct.unpack_from('<I', raw, boff)[0]
bin_ = raw[boff + 8: boff + 8 + blen]

CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}

def view_bytes(i):
    v = gl['bufferViews'][i]
    return bin_[v.get('byteOffset', 0): v.get('byteOffset', 0) + v['byteLength']]

def read_acc(i):
    acc = gl['accessors'][i]
    v = gl['bufferViews'][acc['bufferView']]
    dt = np.dtype(CT[acc['componentType']])
    n = NC[acc['type']]
    stride = v.get('byteStride', dt.itemsize * n)
    start = v.get('byteOffset', 0) + acc.get('byteOffset', 0)
    if stride == dt.itemsize * n:
        return np.frombuffer(bin_, dt, acc['count'] * n, start).reshape(acc['count'], n).copy()
    out = np.empty((acc['count'], n), dt)
    for k in range(acc['count']):
        out[k] = np.frombuffer(bin_, dt, n, start + k * stride)
    return out

# new buffer: list of (bytes, target) -> bufferViews
chunks, views = [], []
def add_view(data, target=None, stride=None):
    off = sum(len(c) for c in chunks)
    pad = (-off) % 4
    if pad: chunks.append(b'\0' * pad); off += pad
    chunks.append(data)
    v = {'buffer': 0, 'byteOffset': off, 'byteLength': len(data)}
    if target: v['target'] = target
    if stride: v['byteStride'] = stride
    views.append(v)
    return len(views) - 1

new_acc = []
remap = {}
def keep_acc(i, target=None):
    if i in remap: return remap[i]
    acc = dict(gl['accessors'][i])
    arr = read_acc(i)
    acc['bufferView'] = add_view(np.ascontiguousarray(arr).tobytes(), target)
    acc.pop('byteOffset', None)
    new_acc.append(acc); remap[i] = len(new_acc) - 1
    return remap[i]

def quant_acc(i, kind):
    arr = read_acc(i).astype(np.float64)
    acc = {'count': len(arr), 'type': gl['accessors'][i]['type'], 'normalized': True}
    if kind == 'normal':  # int8, padded to 4 bytes per vertex
        q = np.clip(np.round(arr * 127), -127, 127).astype(np.int8)
        q4 = np.zeros((len(q), 4), np.int8); q4[:, :3] = q
        acc['componentType'] = 5120
        acc['bufferView'] = add_view(q4.tobytes(), 34962, 4)
    elif kind == 'uv':
        if arr.min() < 0 or arr.max() > 1:  # out of range: keep float
            return keep_acc(i, 34962)
        q = np.round(arr * 65535).astype(np.uint16)
        acc['componentType'] = 5123
        acc['bufferView'] = add_view(q.tobytes(), 34962)
    elif kind == 'weights':
        q = np.round(arr * 255).astype(np.int32)
        # make every vertex's weights sum to exactly 255
        q[np.arange(len(q)), q.argmax(1)] += 255 - q.sum(1)
        acc['componentType'] = 5121
        acc['bufferView'] = add_view(q.astype(np.uint8).tobytes(), 34962)
    new_acc.append(acc)
    return len(new_acc) - 1

for m in gl['meshes']:
    for p in m['primitives']:
        at = p['attributes']
        for k in list(at):
            if k == 'NORMAL': at[k] = quant_acc(at[k], 'normal')
            elif k.startswith('TEXCOORD'): at[k] = quant_acc(at[k], 'uv')
            elif k.startswith('WEIGHTS'): at[k] = quant_acc(at[k], 'weights')
            else: at[k] = keep_acc(at[k], 34962)
        if 'indices' in p: p['indices'] = keep_acc(p['indices'], 34963)
for s in gl.get('skins', []):
    if 'inverseBindMatrices' in s: s['inverseBindMatrices'] = keep_acc(s['inverseBindMatrices'])

keep = set(filter(None, a.keep.split(',')))
anims = [an for an in gl.get('animations', []) if not keep or an['name'] in keep]
for an in anims:
    for sm in an['samplers']:
        sm['input'] = keep_acc(sm['input']); sm['output'] = keep_acc(sm['output'])
gl['animations'] = anims

for img in gl.get('images', []):
    im = Image.open(io.BytesIO(view_bytes(img['bufferView']))).convert('RGB')
    if max(im.size) > a.size: im.thumbnail((a.size, a.size), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'JPEG', quality=a.quality, optimize=True)
    img['bufferView'] = add_view(buf.getvalue()); img['mimeType'] = 'image/jpeg'

gl['accessors'] = new_acc
gl['bufferViews'] = views
data = b''.join(chunks); data += b'\0' * ((-len(data)) % 4)
gl['buffers'] = [{'byteLength': len(data)}]
for k in ('extensionsUsed', 'extensionsRequired'):
    gl[k] = sorted(set(gl.get(k, [])) | {'KHR_mesh_quantization'})
js = json.dumps(gl, separators=(',', ':')).encode(); js += b' ' * ((-len(js)) % 4)
out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(data))
out += struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(data), 0x004E4942) + data
open(a.dst, 'wb').write(out)
print(f'{a.src}: {len(raw)/1e6:.1f} MB -> {a.dst}: {len(out)/1e6:.1f} MB, {len(anims)} animations')
