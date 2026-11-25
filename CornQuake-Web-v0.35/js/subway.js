// Subway stations for the New York maps (v0.33). At the end of a map's build this looks for a building big enough to hide a
// station under, with a clear stretch of sidewalk in front of it, and digs one in: a doorway in the facade under green globe
// lamps, a long tiled staircase down the side of the hall, the platform with its columns, benches, mosaics and flickering
// tubes, and a track pit with a parked train, the third rail and a tunnel mouth at each end. Rats live down there.
// Nothing outside the building changes, so the street route of the map is untouched; the station is an extra place to explore.
const S = 32;
const NAMES = { E2M1: 'mos_hornt', E2M2: 'mos_qoq', E2M3: 'mos_pidser', E2M4: 'mos_canal', E2M5: 'mos_park', E2M6: 'mos_wall', E2M7: 'mos_bridge', E2M8: 'mos_empire' };
const NI = 13, NJ = 9;            // footprint in cells: along the facade, into the building

export function autoSubway(K, N, buildings, avoid) {
  if (K.meta.subway === false) return null;
  const X = c => c * S, cellCh = (c, r) => K.rawCell(c, r), spec = (c, r) => K.spec(c, r);
  // candidate placements: every building, every side, both hands, slid along the facade
  const tries = [];
  for (const B of buildings) for (const side of ['s', 'n', 'e', 'w']) {
    const horiz = side === 's' || side === 'n', len = horiz ? B.c1 - B.c0 + 1 : B.r1 - B.r0 + 1, dep = horiz ? B.r1 - B.r0 + 1 : B.c1 - B.c0 + 1;
    if (len < NI + 2 || dep < NJ + 1 || B.h < 190) continue;
    for (const hand of [1, -1]) for (let off = 1; off + NI + 1 <= len; off++) tries.push({ B, side, hand, off, score: Math.abs(off + NI / 2 - len / 2) * 0.05 + (dep - NJ) * 0.01 + (side === 's' ? 0 : side === 'e' ? 0.002 : 0.004) });
  }
  tries.sort((a, b) => a.score - b.score);
  for (const t of tries) {
    const { B, side, hand, off } = t;
    // local frame: i runs along the facade (from the doorway end), j runs into the building; (0,0) is the doorway's first cell
    let U, V, o;
    if (side === 's') { V = [0, -1]; U = [hand, 0]; o = [hand > 0 ? B.c0 + off : B.c0 + off + NI - 1, B.r1]; }
    else if (side === 'n') { V = [0, 1]; U = [hand, 0]; o = [hand > 0 ? B.c0 + off : B.c0 + off + NI - 1, B.r0]; }
    else if (side === 'e') { V = [-1, 0]; U = [0, hand]; o = [B.c1, hand > 0 ? B.r0 + off : B.r0 + off + NI - 1]; }
    else { V = [1, 0]; U = [0, hand]; o = [B.c0, hand > 0 ? B.r0 + off : B.r0 + off + NI - 1]; }
    const at = (i, j) => [o[0] + U[0] * i + V[0] * j, o[1] + U[1] * i + V[1] * j];
    // everything we dig, and a one-cell collar round it, must still be untouched building
    const bch = cellCh(...at(0, 0)); let ok = !!bch && !K.isSolid(...at(0, 0)) && spec(...at(0, 0)).f === B.h;
    for (let j = 0; j <= NJ && ok; j++) for (let i = -1; i <= NI && ok; i++) { const [c, r] = at(i, j); if (c < 1 || r < 1 || c >= K.w - 1 || r >= K.h - 1 || cellCh(c, r) !== bch) ok = false; }
    if (!ok) continue;
    // the pavement in front of the doorway: open sky, level, two cells deep, nothing standing on it
    let sf = null; for (const i of [-1, 0, 1, 2]) for (const j of [-1, -2]) { const [c, r] = at(i, j), e = K.isSolid(c, r) ? null : spec(c, r); if (!e || !e.sky || e.f > 40 || e.f < -8) { ok = false; break; } if (j === -1 && (i === 0 || i === 1)) { if (sf === null) sf = e.f; else if (e.f !== sf) ok = false; } }
    if (!ok || sf === null) continue;
    const dw = [(X(at(0, 0)[0]) + X(at(1, 0)[0])) / 2 + 16, (X(at(0, 0)[1]) + X(at(1, 0)[1])) / 2 + 16];          // the middle of the doorway (cell centres)
    if (avoid.some(p => Math.hypot(p[0] - dw[0], p[1] - dw[1]) < 104)) continue;
    return dig(K, N, B, { U, V, at, sf, side });
  }
  return null;
}

function dig(K, N, B, F) {
  const { U, V, at, sf } = F, pf = sf - 160, pit = pf - 48, top = pf + 132, facade = K.spec(...at(0, 0));
  const roof = { roof: B.h, roofSky: N.SKY, roofTex: facade.floor || 'roof' };
  const T = s => K.type({ ...s, ...roof });
  const paint = (i, j, ch) => { const [c, r] = at(i, j); K.paint(c, r, c, r, ch); };
  // collar: the building cells round the station show tile (or tunnel wall beside the track pit) on their inner faces
  const ring = []; for (let j = 0; j <= NJ; j++) for (let i = -1; i <= NI; i++) if (i < 0 || i >= NI || j === NJ || (j === 0 && i > 1)) ring.push([i, j]);
  const keep = K.rawCell(...at(-1, NJ)); const collarCh = {};
  for (const [i, j] of ring) { const inner = j >= 7 ? 'sub_tunnel' : 'subwaytile'; const [c, r] = at(i, j); if (K.rawCell(c, r) !== keep) continue; collarCh[inner] = collarCh[inner] || K.type({ f: facade.f, c: facade.c, floor: facade.floor, ceil: facade.ceil, side: facade.side, upper: facade.upper, sky: true, inner }); K.paint(c, r, c, r, collarCh[inner]); }
  // doorway and upper landing
  const door = T({ f: sf, c: sf + 116, floor: 'tile', ceil: 'concretedark', side: 'subwaytile', upper: facade.upper || facade.side });
  const land = T({ f: sf, c: sf + 132, floor: 'tile', ceil: 'concretedark', side: 'subwaytile', upper: 'subwaytile' });
  for (const i of [0, 1]) { paint(i, 0, door); paint(i, 1, land); paint(i, 2, land); }
  // the staircase: ten flights of 16 along the hall
  for (let i = 2; i <= 11; i++) { const f = sf - 16 * (i - 1), ch = T({ f, c: Math.max(top, f + 132), floor: 'concretedark', ceil: 'concretedark', side: 'subwaytile', upper: 'subwaytile' }); paint(i, 1, ch); paint(i, 2, ch); }
  const hall = T({ f: pf, c: top, floor: 'tile', ceil: 'concretedark', side: 'concretedark', upper: 'subwaytile' });
  paint(12, 1, hall); paint(12, 2, hall);
  for (let j = 3; j <= 6; j++) for (let i = 0; i < NI; i++) paint(i, j, hall);
  const trench = T({ f: pit, c: top, floor: 'concretedark', ceil: 'concretedark', side: 'sub_tunnel', upper: 'sub_tunnel' });
  for (let j = 7; j <= 8; j++) for (let i = 0; i < NI; i++) paint(i, j, trench);

  // ---- world-space helpers for the dressing (local a along the facade, b into the building, in units from the doorway corner) ----
  const [oc, or] = at(0, 0), ox = oc * S + (U[0] < 0 || V[0] < 0 ? S : 0), oz = or * S + (U[1] < 0 || V[1] < 0 ? S : 0);
  const P = (a, b) => [ox + U[0] * a + V[0] * b, oz + U[1] * a + V[1] * b];
  const nm = v => (v[0] > 0 ? 'px' : v[0] < 0 ? 'nx' : v[1] > 0 ? 'pz' : 'nz'), neg = v => [-v[0], -v[1]];
  const alongX = U[0] !== 0, name = NAMES[K.meta.name] || 'mos_hornt';
  const boxAt = (ctx, a0, b0, a1, b1, y0, y1, o) => { const p = P(a0, b0), q = P(a1, b1); return ctx.brush([Math.min(p[0], q[0]), y0, Math.min(p[1], q[1])], [Math.max(p[0], q[0]), y1, Math.max(p[1], q[1])], o); };
  const pbox = (ctx, a, b, y, la, h, lb, tex, o = {}) => { const p = P(a, b); ctx.props.box(p[0], y, p[1], alongX ? la : lb, h, alongX ? lb : la, tex, o); };
  const decal = (ctx, a, b, y, n, w, h, tex, fb = false) => { const p = P(a, b); ctx.decal({ at: [p[0], y, p[1]], n, w, h, tex, fullbright: fb, off: 0.8 }); };
  K.post(ctx => {
    const W = NI * S; (ctx.W.extraLog || (ctx.W.extraLog = [])).push({ kind: 'subway-door', x: P(32, -90)[0], z: P(32, -90)[1], y: sf, dist: 120, pitch: 0.12, U, V, sf, pf, land: P(32, 56) }, { kind: 'subway-hall', x: P(W * 0.5, 150)[0], z: P(W * 0.5, 150)[1], y: pf, dist: 150 }, { kind: 'subway-train', x: P(W * 0.3, 250)[0], z: P(W * 0.3, 250)[1], y: pf, dist: 130 });
    // street entrance: sign over the door, a green globe lamp each side, a strip light inside
    decal(ctx, 32, 0, sf + 136, nm(neg(V)), 150, 38, 'sub_entrance', true);
    for (const a of [-12, 76]) { const p = P(a, -9); ctx.props.cylinder(p[0], sf, p[1], 2.2, 78, 'metalgreen', { segs: 8 }); ctx.props.sphere(p[0], sf + 84, p[1], 8, 'greenlight', { fullbright: true, segs: 12, rings: 8 }); ctx.props.cylinder(p[0], sf, p[1], 4.5, 8, 'metalgreen', { segs: 8 }); ctx.light(p[0] - V[0] * 14, sf + 84, p[1] - V[1] * 14, 170, [0.35, 1, 0.45]); }
    { const p = P(32, 16); ctx.light(p[0], sf + 96, p[1], 190, [0.8, 0.76, 0.62]); const q = P(32, 60); ctx.light(q[0], sf + 100, q[1], 200, [0.62, 0.74, 0.66]); const r2 = P(7 * S, 48); ctx.light(r2[0], sf - 20, r2[1], 200, [0.6, 0.72, 0.64]); }
    // handrail down the open side of the stairs, and one along the landing
    for (let i = 2; i <= 11; i++) { const y = sf - 16 * (i - 1); pbox(ctx, i * S + 16, 3 * S - 3, y, 2.5, 34, 2.5, 'metal'); pbox(ctx, i * S + 16, 3 * S - 3, y + 34, 34, 3, 3, 'chrome'); }
    boxAt(ctx, 0, 3 * S - 5, 2 * S, 3 * S - 1, sf, sf + 36, { tex: 'railing', fit: true, noshadow: true });
    // the hall: tubes down the ceiling (one of them dying), steel columns along the platform edge, the yellow line
    for (let k = 0; k < 4; k++) { const p = P(48 + k * 104, 5 * S); ctx.brush(alongX ? [p[0] - 34, top - 5, p[1] - 5] : [p[0] - 5, top - 5, p[1] - 34], alongX ? [p[0] + 34, top, p[1] + 5] : [p[0] + 5, top, p[1] + 34], { tex: 'light', noshadow: true, solid: false, fit: true }); ctx.light(p[0], top - 22, p[1], 215, [0.6, 0.74, 0.66], k === 2 ? 2 : 0); }
    for (let k = 0; k < 3; k++) { const p = P(80 + k * 128, 8 * S); ctx.light(p[0], pf + 30, p[1], 170, [0.3, 0.38, 0.62]); }
    for (let k = 0; k < 5; k++) { const p = P(40 + k * 84, 7 * S - 14); ctx.props.box(p[0], pf, p[1], 9, top - pf, 9, 'steelbeam'); ctx.props.box(p[0], pf, p[1], 14, 5, 14, 'metal'); ctx.props.box(p[0], top - 5, p[1], 14, 5, 14, 'metal'); ctx.brush([p[0] - 5, pf, p[1] - 5], [p[0] + 5, top, p[1] + 5], { invisible: true }); }
    for (let a = 16; a < W; a += 64) { const p = P(a + 16, 7 * S - 8); ctx.decal({ at: [p[0], pf, p[1]], n: 'up', w: alongX ? 64 : 14, h: alongX ? 14 : 64, tex: 'hazard', off: 0.35 }); }
    // mosaic name tablets, the map, the service sign, advertising
    const back = nm(neg(V)), front = nm(V), endA = nm(U), endB = nm(neg(U));
    for (const a of [104, 312]) decal(ctx, a, NJ * S, pf + 84, back, 150, 28, name);
    decal(ctx, W - 16, 3 * S, pf + 70, endB, 60, 60, 'sub_map'); decal(ctx, 0, 5 * S, pf + 76, endA, 100, 50, 'sub_ad_rats'); decal(ctx, W, 5 * S + 8, pf + 76, endB, 100, 50, 'sub_ad_marv');
    decal(ctx, 0, 3.6 * S, pf + 70, endA, 40, 55, 'want_marv'); for (const a of [200, 250]) decal(ctx, a, 3 * S, pf + 40, front, 96, 48, a === 200 ? 'bb_cola' : 'tag_qoq');
    { const p = P(W * 0.5, 5 * S); ctx.props.box(p[0], top - 30, p[1], alongX ? 118 : 4, 22, alongX ? 4 : 118, 'sub_sign', { fit: true, fullbright: true }); for (const d of [-50, 50]) { const q = P(W * 0.5 + d, 5 * S); ctx.props.box(q[0], top - 9, q[1], 1.5, 9, 1.5, 'metal'); } }
    // benches, a bin, litter
    for (const a of [150, 300]) { const p = P(a, 3 * S + 12); ctx.props.box(p[0], pf + 15, p[1], alongX ? 66 : 16, 3, alongX ? 16 : 66, 'boards'); ctx.props.box(p[0] - V[0] * 7, pf + 18, p[1] - V[1] * 7, alongX ? 66 : 3, 16, alongX ? 3 : 66, 'boards'); for (const d of [-28, 28]) { const q = P(a + d, 3 * S + 12); ctx.props.box(q[0], pf, q[1], 3, 15, 14, 'metal'); } ctx.brush([p[0] - (alongX ? 33 : 9), pf, p[1] - (alongX ? 9 : 33)], [p[0] + (alongX ? 33 : 9), pf + 18, p[1] + (alongX ? 9 : 33)], { invisible: true, noshadow: true }); }
    { const p = P(230, 3 * S + 12); ctx.props.cylinder(p[0], pf, p[1], 10, 30, 'metalgreen', { segs: 10, rTop: 11 }); ctx.brush([p[0] - 10, pf, p[1] - 10], [p[0] + 10, pf + 30, p[1] + 10], { invisible: true, noshadow: true }); }
    // the track pit: sleepers, running rails, the covered third rail, and a tunnel mouth at each end
    for (let a = 10; a < W; a += 26) pbox(ctx, a, 8 * S, pit, 9, 3, 54, 'boards');
    for (const b of [8 * S - 19, 8 * S + 19]) { const p0 = P(0, b), p1 = P(W, b); ctx.props.pipe(p0[0], pit + 5, p0[1], p1[0], pit + 5, p1[1], 1.7, 'steel'); }
    { const p0 = P(0, 9 * S - 6), p1 = P(W, 9 * S - 6); ctx.props.pipe(p0[0], pit + 9, p0[1], p1[0], pit + 9, p1[1], 2, 'rust'); pbox(ctx, W / 2, 9 * S - 6, pit + 12, W, 2.5, 9, 'thirdrail'); }
    decal(ctx, 0, 8 * S, pit + 64, endA, 62, 128, 'sub_portal'); decal(ctx, W, 8 * S, pit + 64, endB, 62, 128, 'sub_portal');
    // the train, stopped part-way out of the tunnel with its lights on
    const t0 = 24, t1 = 24 + 222; boxAt(ctx, t0, 7 * S + 5, t1, 9 * S - 13, pit + 14, pit + 122, { tex: 'sub_train', top: 'metal', align: 'local' });
    { const p = P(t1, 8 * S - 4); ctx.decal({ at: [p[0], pit + 68, p[1]], n: endA, w: 46, h: 108, tex: 'sub_front', fullbright: false, off: 0.5 }); for (const d of [-13, 13]) { const q = P(t1 + 30, 8 * S - 4 + d); ctx.light(q[0], pit + 40, q[1], 130, [1, 0.9, 0.6]); } }
    for (const a of [t0 + 30, t0 + 110, t0 + 190]) for (const b of [7 * S + 14, 9 * S - 22]) { const p = P(a, b); ctx.props.cylinder(p[0], pit + 4, p[1], 9, 5, 'tire', { segs: 10, rz: Math.PI / 2, ry: alongX ? Math.PI / 2 : 0 }); }
    // what the detour is worth, and who lives down here
    const item = (type, a, b, y, amount) => { const p = P(a, b); ctx.ent({ type, pos: [p[0], y, p[1]], amount }); };
    item('health', W - 30, 4 * S, pf, 25); item('sausages', W - 60, 6 * S, pf, 8); item('juice', 60, 6 * S, pf, 50); for (const a of [120, 180, 240]) item('slice', a, 5 * S, pf);
    item('health', t1 + 110, 8 * S, pit, 25); item('slice', t1 + 70, 8 * S, pit); item('slice', t1 + 140, 8 * S, pit);
    { const p = P(t1 + 60, 7 * S), q = P(W, 9 * S); ctx.ent({ type: 'secret', min: [Math.min(p[0], q[0]), pit, Math.min(p[1], q[1])], max: [Math.max(p[0], q[0]), pit + 90, Math.max(p[1], q[1])] }); }
    { const p = P(0, 0), q = P(64, 3 * S); ctx.ent({ type: 'message', min: [Math.min(p[0], q[0]), sf, Math.min(p[1], q[1])], max: [Math.max(p[0], q[0]), sf + 100, Math.max(p[1], q[1])], msg: 'The subway. Something is squeaking down there.' }); }
    let s = (B.c0 * 31 + B.r0 * 17) % 233; const rnd = () => (s = (s * 73 + 41) % 997) / 997;
    for (let k = 0; k < 8; k++) { const onTrack = k >= 5, p = P(onTrack ? t1 + 30 + rnd() * (W - t1 - 50) : 40 + rnd() * (W - 80), onTrack ? 8 * S + (rnd() - 0.5) * 30 : 3 * S + 30 + rnd() * 80); ctx.ent({ type: 'rat', pos: [p[0], onTrack ? pit : pf, p[1]], angle: rnd() * 360 }); }
    for (let k = 0; k < 3; k++) { const p = P(12 * S + 6 + rnd() * 20, S + 8 + rnd() * 48); ctx.ent({ type: 'rat', pos: [p[0], pf, p[1]], angle: rnd() * 360 }); }
  });
  return { at, sf, pf };
}
