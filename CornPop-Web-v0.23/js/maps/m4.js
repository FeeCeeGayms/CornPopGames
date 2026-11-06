// E1M4 — ORDER HEADQUARTERS. Through the red pipe into the Command Room (image 4), up the Stair Hall's
// three staircases (image 5), into the guard dorm, the briefing theatre (gold key) and the Order's vault.
import { makeLevel } from '../kit.js';

export default makeLevel({
  name: 'E1M4', title: 'E1M4: ORDER HEADQUARTERS', ambience: 'kitchen', music: 'assets/music/e1m4.mp3', ambient: 18,
  fog: { color: [0.035, 0.028, 0.025], density: 0.00035 },
  styles: [{ color: [1, 0.5, 0.15], pattern: 'candle' }, { color: [1, 0.15, 0.08], pattern: 'pulse' }, { color: [1, 1, 0.95], pattern: 'fluoro' }, { color: [0.4, 0.6, 1], pattern: 'gentle' }],
}, 112, 104, 'concretedark', K => {
  const { X, Z, C } = K; const T = s => K.type(s);
  const PIPE = { f: 16, c: 192, floor: 'grate', ceil: 'rust', side: 'rust', upper: 'rust' };
  const CMD = { f: 0, c: 224, floor: 'tile', ceil: 'ceil', side: 'stepside', upper: 'concretedark' };
  const MEZ = { f: 96, c: 224, floor: 'diamond', ceil: 'ceil', side: 'stepside' };
  const ARM = { f: 0, c: 160, floor: 'diamond', ceil: 'steeldark', side: 'trim', upper: 'steeldark' };
  const HALL = { f: 0, c: 320, floor: 'tilebrown', ceil: 'ceil', side: 'stepside', upper: 'concretedark' };
  const BALC = { f: 160, c: 320, floor: 'diamond', ceil: 'ceil', side: 'stepside' };
  const DORM = { f: 160, c: 272, floor: 'tilebrown', ceil: 'ceil', side: 'trim', upper: 'concretedark' };
  const TUN = { f: 34, c: 176, floor: 'grate', ceil: 'rust', side: 'rust', upper: 'rust' };
  const TSTEP = { f: 17, c: 176, floor: 'grate', ceil: 'rust', side: 'stepside', upper: 'rust' };
  const THEA = { f: 34, c: 288, floor: 'carpet', ceil: 'ceil', side: 'stepside', upper: 'concretedark' };
  const VAULT = { f: 0, c: 224, floor: 'diamond', ceil: 'steeldark', side: 'trim', upper: 'steel' };

  // ---------------- the red pipe (start, image 4 foreground) ----------------
  K.room(50, 86, 55, 100, PIPE, 'rust');
  K.start(52, 98, 0);
  K.props(pr => { pr.pipeInterior(X(53), 96, Z(93) + 16, 96, 480, 'z', 'rust'); pr.ring(X(53), 96, Z(86) - 4, 96, 124, 16, 'z', 0, Math.PI * 2, 'rust', 32); });
  K.brush([X(50), 16, Z(86)], [X(53) - 37, 192, Z(101)], { invisible: true, noshadow: true }); K.brush([X(53) + 37, 16, Z(86)], [X(56), 192, Z(101)], { invisible: true, noshadow: true });
  K.lamp(X(53), 176, Z(92), 220); K.lamp(X(53), 176, Z(98), 200);
  K.slices([[X(53), Z(94)]]); K.juice(X(53), Z(90));
  K.item('turdgun', X(53), Z(96)); K.item('turdbox', X(52) + 8, Z(92), { amount: 4 });
  K.msg([X(50), 16, Z(93)], [X(56), 120, Z(99)], 'A TURD LAUNCHER! Poo rockets: huge splash damage. Don\'t fire it at your feet!');

  // ---------------- COMMAND ROOM (image 4) ----------------
  K.room(36, 58, 71, 85, CMD, 'concretedark');
  K.paint(36, 58, 44, 70, T(MEZ)); K.stairs(38, 71, 42, 76, 'N', 16, 96, { ...CMD, side: 'stepside' });
  K.brush([X(45) - 2, 96, Z(58)], [X(45), 130, Z(71)], { tex: 'railing', fit: true, noshadow: true });
  K.brush([X(36), 96, Z(71) - 2], [X(38), 130, Z(71)], { tex: 'railing', fit: true, noshadow: true }); K.brush([X(43), 96, Z(71) - 2], [X(45), 130, Z(71)], { tex: 'railing', fit: true, noshadow: true });
  K.brush([X(46), 24, Z(58)], [X(51), 130, Z(58) + 18], { tex: 'metal', pz: 'suits' }); K.props(pr => { for (let x = X(46) + 12; x < X(51); x += 26) pr.helmet(x, 130, Z(58) + 10); });
  K.decal({ at: [X(48) + 16, 150, Z(58)], n: 'pz', w: 30, h: 30, tex: 'sign_p' });
  K.decal({ at: [X(62), 150, Z(58)], n: 'pz', w: 130, h: 84, tex: 'neonorder', fullbright: true }); K.light(X(62), 140, Z(62), 340, [1, 0.6, 0.25]);
  K.desk(X(57), Z(58), X(67), Z(60) + 12, 'pz'); K.props(pr => pr.stool(X(62), Z(63), 0));
  K.wall(60, 70, 61, 71, 'brick'); K.decal({ at: [X(61), 80, Z(72)], n: 'pz', w: 56, h: 56, tex: 'emblem_slice', off: 0.8 });
  K.couch(X(66), Z(73), X(71), Z(81), 'e'); K.barrel(X(48), Z(62)); K.barrel(X(50), Z(62) + 6, 11, 28);
  K.brush([X(67), 0, Z(60)], [X(71), 4, Z(68)], { tex: 'metal' });
  for (const y of [40, 80, 120]) { K.brush([X(67), y, Z(60)], [X(71), y + 3, Z(68)], { tex: 'metal', solid: false }); for (const z of [Z(61), Z(63) + 16, Z(66)]) K.pizzaBoxes(X(69), z, y + 3, 2); }
  K.brush([X(52) - 60, 0, Z(76) - 48], [X(52) + 60, 36, Z(76) + 48], { tex: 'concrete' }); K.props(pr => pr.pizza(X(52), 36, Z(76), 48));
  K.brush([X(37), 0, Z(80)], [X(41), 36, Z(83)], { tex: 'rustpanel', top: 'wood' }); K.brush([X(38), 36, Z(81)], [X(39), 46, Z(82)], { tex: 'cabinet' });
  K.brush([X(67), 0, Z(82)], [X(69), 28, Z(84)], { tex: 'crate' });
  K.button({ min: [X(67) + 8, 28, Z(82) + 8], max: [X(69) - 8, 44, Z(84) - 8], target: 'armory', msg: 'The armory shutter rolls open!' });
  K.skylight(X(52), Z(66), 224, 0, 96, 96); K.skylight(X(58), Z(80), 224, 0, 96, 96);
  K.lamp(X(37), 150, Z(64), 200); K.lamp(X(44), 200, Z(60), 200); K.fixture(X(62), Z(70), 224, 96, 'x', 'light', 320, [1, 1, 1], 3);
  K.key('red', X(38), Z(60), 96);
  K.qoqC(48, 66, 180); K.qoqC(56, 72, 180); K.qoqC(64, 76, 180); K.qoqC(46, 80, 0); K.qoqC(62, 64, 180);
  K.qoq(X(42), Z(64), 180, { turret: true, y: 96 });
  K.slices([[X(52), Z(74), 36], [X(68), Z(77), 26], [X(40), Z(66), 96], [X(58), Z(84)]]); K.juice(X(70), Z(84)); K.health(X(37), Z(84));
  K.wave('redkey', { onKey: 'red', msg: 'The Order sends guards for its keycard!' });
  for (const [c, r] of [[50, 84], [56, 84], [68, 70], [46, 76]]) K.qoqC(c, r, 0, { wave: 'redkey' });
  K.ambient(X(62), 60, Z(60), 'hum', 500, 0.7);
  // pipe-side secret: boards in the west wall near the pipe mouth
  K.paint(32, 80, 35, 84, T({ ...CMD, c: 120 })); K.breakable([X(35), 0, Z(80)], [X(36), 120, Z(85)], { tex: 'boards', health: 20, secret: true });
  K.health(X(33), Z(81)); K.juice(X(33), Z(83)); K.slice(X(34), Z(82));

  // ---------------- ARMORY (button) ----------------
  K.room(73, 62, 90, 80, ARM, 'steeldark');
  K.door(72, 69, 72, 72, CMD, { targeted: true, name: 'armory', wait: -1, top: 120, tex: 'door_red' });
  for (const r of [63, 79]) K.brush([X(75), 0, r === 63 ? Z(62) : Z(80) - 18], [X(88), 130, r === 63 ? Z(62) + 18 : Z(80)], { tex: 'metal', [r === 63 ? 'pz' : 'nz']: 'suits' });
  K.sign(X(81) + 16, 140, Z(62) + 18, 'pz', 'sign_armory', 160, 36);
  for (const [c, r] of [[76, 68], [80, 68], [84, 68], [76, 74], [80, 74], [84, 74]]) K.juice(C(c), C(r));
  K.health(X(88), Z(66)); K.health(X(88), Z(76)); K.crates(X(88), Z(71), 0, 2, 40);
  K.fixture(X(81), Z(71), 160, 200, 'x', 'light', 360);
  K.qoqC(86, 64, -90); K.qoqC(86, 78, -90); K.qoqC(78, 71, -90);
  K.button({ min: [X(90) + 26, 70, Z(70)], max: [X(91), 90, Z(72)], shoot: true, target: 'locker', msg: 'A locker pops open!' });
  K.door(91, 74, 91, 76, ARM, { targeted: true, name: 'locker', wait: -1, tex: 'steeldark', top: 104 }); K.paint(92, 73, 94, 77, T({ ...ARM, c: 104 }));
  K.secret([X(92), 0, Z(73)], [X(95), 100, Z(78)]); K.health(X(93), Z(74)); K.juice(X(93), Z(76)); K.slice(X(94), Z(75));

  // ---------------- STAIR HALL (image 5) ----------------
  K.room(30, 22, 80, 56, HALL, 'concretedark');
  K.door(52, 57, 55, 57, CMD, { key: 'red', top: 128 });
  K.paint(30, 22, 80, 27, T(BALC));
  for (const c0 of [36, 53, 70]) {
    K.stairs(c0, 28, c0 + 3, 37, 'N', 16, 160, { ...HALL, side: 'stepside', floor: 'concrete' });
    K.props(pr => { for (let i = 0; i < 9; i++) { const z = Z(37 - i) + 16, f = 16 + i * 16; pr.calzone(X(c0) + 10, f, z); pr.calzone(X(c0 + 4) - 10, f, z); } });
  }
  for (const [a, b] of [[30, 36], [40, 53], [57, 70], [74, 81]]) K.brush([X(a), 160, Z(28) - 2], [X(b), 194, Z(28)], { tex: 'railing', fit: true, noshadow: true });
  K.key('blue', X(78), Z(24), 160); K.brush([X(76), 160, Z(22)], [X(80), 200, Z(23)], { tex: 'metal', pz: 'monitors', fit: ['pz'] });
  K.brush([X(56) - 70, 0, Z(44) - 50], [X(56) + 70, 40, Z(44) + 50], { tex: 'concrete' }); K.props(pr => pr.pizza(X(56), 40, Z(44), 56));
  K.brush([X(34), 0, Z(48)], [X(38), 30, Z(50)], { tex: 'concrete' }); K.brush([X(35), 30, Z(48) + 12], [X(37), 44, Z(50) - 12], { tex: 'metal', pz: 'button' });
  K.barrel(X(76), Z(52), 14, 34);
  K.decal({ at: [X(81), 90, Z(48)], n: 'nx', w: 70, h: 90, tex: 'bulletin' });
  K.props(pr => pr.ring(X(81), 64, Z(39) + 16, 56, 72, 12, 'x', 0, Math.PI * 2, 'metal', 28));
  K.decal({ at: [X(81), 64, Z(44)], n: 'nx', w: 40, h: 60, tex: 'vaultdoor', off: 0.8 });
  K.door(81, 37, 81, 41, HALL, { key: 'gold', tex: 'door_gold', top: 112, name: 'golddoor' });
  K.skylight(X(56), Z(44), 320, 0, 128, 128, 460);
  K.lamp(X(31), 150, Z(40), 220); K.lamp(X(80), 150, Z(30) + 8, 220); K.lamp(X(31), 220, Z(24), 200);
  for (const c0 of [36, 53, 70]) K.light(X(c0 + 2), 300, Z(32), 320, [1, 0.8, 0.55]);
  K.light(X(45), 120, Z(48), 300, [1, 0.75, 0.45]); K.light(X(68), 120, Z(48), 300, [1, 0.75, 0.45]);
  K.qoqC(46, 46, 180); K.qoqC(66, 46, 180); K.qoqC(56, 52, 180); K.qoqC(40, 40, 90); K.qoqC(74, 40, -90);
  for (const c of [33, 48, 64, 79]) K.qoq(C(c), C(23), 180, { turret: c === 33 || c === 79 ? false : true, y: 160 });
  K.slices([[X(37) + 16, Z(32)], [X(54) + 16, Z(30)], [X(71) + 16, Z(34)], [X(56), Z(43), 40], [X(40), Z(25), 160]]);
  K.juice(X(31), Z(55)); K.juice(X(79), Z(55)); K.health(X(31), Z(24), 160); K.juice(X(66), Z(24), 160);
  K.ambient(X(56), 100, Z(40), 'drip', 800, 1);

  // ---------------- GUARD DORM (off the balcony) ----------------
  K.room(42, 4, 70, 20, DORM, 'brickdark');
  K.door(54, 21, 57, 21, BALC, { top: 112 });
  for (const c of [44, 49, 54, 59, 64]) { K.bed(C(c), Z(6) + 48, 'z'); K.bed(C(c), Z(18) - 48, 'z'); }
  K.poster(X(42), 220, Z(8), 'px', 'pot_glorious', 50, 82); K.poster(X(71), 220, Z(10), 'nx', 'pot_fuel', 50, 82); K.poster(X(42), 220, Z(16), 'px', 'pot_soil', 50, 100);
  K.sign(X(56), 230, Z(4), 'pz', 'neon_potato', 96, 72); K.light(X(56), 220, Z(8), 260, [1, 0.6, 0.3]);
  K.lavaLamp(X(46), Z(12), 160); K.lavaLamp(X(66), Z(12), 160); K.potatoes([[X(50), Z(12)], [X(52), Z(13)], [X(61), Z(11)]], 160);
  K.fixture(X(50), Z(12), 272, 120, 'x', 'light', 280); K.fixture(X(62), Z(12), 272, 120, 'x', 'light', 280, [1, 1, 1], 3);
  K.wave('dorm', { min: [X(48), 160, Z(9)], max: [X(64), 260, Z(15)], msg: 'The guards wake up!' });
  for (const [c, r] of [[44, 9], [69, 9], [44, 16], [69, 16], [56, 6]]) K.qoqC(c, r, 180, { wave: 'dorm', y: 160 });
  K.slices([[X(47), Z(12), 160], [X(65), Z(12), 160]]); K.juice(X(43), Z(5), 160); K.health(X(69), Z(5), 160);
  K.door(41, 10, 41, 12, DORM, { tex: 'brickdark', wait: -1, top: 104 }); K.paint(38, 9, 40, 13, T({ ...DORM, c: 264 }));
  K.secret([X(38), 160, Z(9)], [X(41), 260, Z(14)]); K.health(X(39), Z(10), 160); K.juice(X(39), Z(12), 160);

  // ---------------- RED TUNNEL & BRIEFING THEATRE (gold key) ----------------
  K.paint(19, 37, 27, 41, T(TUN)); K.paint(28, 37, 28, 41, T(TSTEP)); K.paint(29, 37, 29, 41, T(HALL));
  K.props(pr => { pr.pipeInterior(X(23) + 16, 96, Z(39) + 16, 80, 320, 'x', 'rust'); pr.ring(X(30) - 2, 96, Z(39) + 16, 80, 104, 14, 'x', 0, Math.PI * 2, 'rust', 28); });
  K.brush([X(19), 34, Z(37)], [X(29), 176, Z(39) + 16 - 34], { invisible: true, noshadow: true }); K.brush([X(19), 34, Z(39) + 16 + 34], [X(29), 176, Z(42)], { invisible: true, noshadow: true });
  K.lamp(X(24), 165, Z(39) + 16, 220, [1, 0.3, 0.15]);
  K.door(18, 37, 18, 41, TUN, { key: 'blue', top: 120, name: 'tblue' });
  K.room(2, 22, 17, 58, THEA, 'brickdark');
  K.stairs(7, 22, 13, 58, 'W', 18, -78, { ...THEA, side: 'stepside', floor: 'carpet', c: 288 });
  K.paint(2, 22, 6, 58, T({ ...THEA, f: -80, floor: 'diamond' }));
  for (let c = 8; c <= 13; c++) for (const [r0, r1] of [[24, 36], [43, 56]]) K.brush([X(c) + 4, 18 - (13 - c) * 16, Z(r0)], [X(c) + 14, 18 - (13 - c) * 16 + 18, Z(r1)], { tex: 'leather', solid: false, noshadow: true });
  K.brush([X(2), -40, Z(30)], [X(2) + 6, 200, Z(50)], { tex: 'metal' }); K.decal({ at: [X(2) + 6, 90, Z(40)], n: 'px', w: 560, h: 260, tex: 'tv', fullbright: true });
  K.light(X(8), 60, Z(40), 420, [0.9, 0.6, 0.4]); K.light(X(14), 220, Z(28), 280, [1, 0.8, 0.5]); K.light(X(14), 220, Z(52), 280, [1, 0.8, 0.5]);
  K.brush([X(4), -80, Z(38)], [X(5), -40, Z(41)], { tex: 'wood', top: 'wood' }); K.key('gold', X(4) + 16, Z(43), -80);
  K.wave('gold', { onKey: 'gold', lock: ['theatredoor', 'tblue'], msg: 'The briefing becomes an ambush!', doneMsg: 'The theatre doors unlock.' });
  for (const [c, r] of [[15, 24], [15, 56], [10, 30], [10, 50], [4, 26], [4, 54]]) K.qoqC(c, r, 90, { wave: 'gold' });
  K.qoqC(14, 40, 90); K.qoqC(10, 34, 90); K.qoqC(10, 46, 90);
  K.slices([[X(4), Z(30)], [X(4), Z(50)], [X(15), Z(40)]]); K.juice(X(16), Z(24)); K.juice(X(16), Z(56)); K.health(X(3), Z(40));
  K.door(18, 46, 18, 48, THEA, { name: 'theatredoor', top: 112, tex: 'door' }); K.paint(19, 44, 28, 49, T(THEA)); K.paint(29, 46, 29, 48, T(HALL));
  // secret projection booth up high, reached by teleporter from behind the screen
  K.tele([X(2) + 8, -80, Z(56)], [X(4), 20, Z(58)], [X(15), 160, Z(26)], 90);
  K.paint(14, 24, 16, 28, T({ ...THEA, f: 160, floor: 'diamond' }));
  K.secret([X(14), 160, Z(24)], [X(17), 260, Z(29)]); K.health(X(15), Z(25), 160); K.juice(X(16), Z(27), 160);

  // ---------------- THE ORDER'S VAULT ----------------
  K.room(82, 30, 108, 48, VAULT, 'steel');
  for (const [c, r] of [[86, 33], [86, 45], [104, 33], [104, 45]]) K.column(C(c), C(r), 28, 0, 224, 'jailmetal');
  for (const c of [90, 94, 98]) { K.pizzaBoxes(C(c), C(32), 0, 6); K.pizzaBoxes(C(c), C(46), 0, 6); }
  K.skylight(X(95), Z(39), 224, 0, 128, 96, 380);
  K.wave('vault', { min: [X(86), 0, Z(34)], max: [X(100), 120, Z(44)], lock: ['golddoor'], msg: 'The vault seals behind you!', doneMsg: 'The vault opens.' });
  for (const [c, r] of [[84, 31], [84, 47], [106, 31], [106, 47], [95, 31], [95, 47], [100, 39]]) K.qoqC(c, r, -90, { wave: 'vault' });
  K.juice(X(84), Z(39)); K.health(X(106), Z(39)); K.slices([[X(92), Z(39)], [X(98), Z(39)]]);
  K.exit(X(109), 0, Z(39), 'nx');

  K.goal(X(38), Z(60), 96); K.goal(X(78), Z(24), 160); K.goal(X(4) + 16, Z(43), -80, { wait: 10 }); K.goal(X(93), Z(39), 0, { wait: 12 });
});
