#!/usr/bin/env python3
"""Bundle the game into ONE self-contained HTML file that runs offline (double-click to play).

Inlines every script in index.html and embeds assets/ as base64.
Usage:  python3 tools/build-single.py [output path]   (default: dist/MattressMadness.html)
"""
import base64, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'dist', 'MattressMadness.html')

html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()

def inline(m):
    code = open(os.path.join(ROOT, m.group(1)), encoding='utf-8').read()
    return '<script>\n' + code.replace('</script', '<\\/script') + '\n</script>'

html = re.sub(r'<script src="((?:lib|src)/[^"]+)"></script>', inline, html)
assets = os.path.join(ROOT, 'assets')
embed = {f: base64.b64encode(open(os.path.join(assets, f), 'rb').read()).decode()
         for f in sorted(os.listdir(assets)) if not f.startswith('.')}
html = html.replace('<!--EMBED-->', '<script>window.EMBED=' + json.dumps(embed) + ';</script>')

os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
open(out, 'w', encoding='utf-8').write(html)
print(f'Wrote {out} ({len(html) / 1e6:.1f} MB)')
