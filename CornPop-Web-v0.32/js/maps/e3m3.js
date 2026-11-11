// E3M3 (the original v0.24 E1M3, now part of Episode 3: The Pidser Cave) — THE PIZZA VAULTS. The Pedestal Hall (image 3) with a climb to the overseer's office (blue key),
// the Sauce Moat Hall with its pizza tower (red key), and a vast Cold Storage rack maze before the exit.
import { makeLevel } from '../kit.js';

export default makeLevel({
  name: 'E3M3', title: 'E3M3: THE PIZZA VAULTS', ambience: 'cave', music: 'assets/music/e1m3.mp3', ambient: 40,
  fog: { color: [0.025, 0.03, 0.04], density: 0.00035 },
  styles: [{ color: [1, 0.5, 0.15], pattern: 'candle' }, { color: [0.35, 0.6, 1], pattern: 'gentle' }, { color: [1, 1, 0.95], pattern: 'fluoro' }, { color: [1, 0.2, 0.08], pattern: 'pulse' }],
  // the Pidser Cave bunker (v0.29): riveted plates, warm lamps, floors polished enough to mirror them
  lightTint: [1, 0.9, 0.74], gloss: 1, retex: {'concrete': 'bunkerplate', 'concretedark': 'bunkerdark', 'steel': 'bunkerbig', 'steeldark': 'bunkerceil', 'ceil': 'bunkerceil', 'trim': 'bunkertrim', 'stepside': 'bunkertrim', 'diamond': 'bunkerfloor', 'tile': 'bunkerfloor', 'tilebrown': 'bunkerfloor2', 'rustpanel': 'bunkerrust', 'jailfloor': 'bunkerfloor', 'jaildark': 'bunkerdark', 'jailmetal': 'bunkerplate', 'brickdark': 'bunkerplate'},
}, 112, 104, 'concretedark', K => {
  const { X, Z, C } = K; const T = s => K.type(s);
  const DOCK = { f: 0, c: 224, floor: 'grate', ceil: 'steeldark', side: 'trim', upper: 'rustpanel' };
  const HALLA = { f: 0, c: 288, floor: 'tile', ceil: 'ceil', side: 'concrete', upper: 'concretedark' };
  const OFFICE = { f: 160, c: 288, floor: 'diamond', ceil: 'ceil', side: 'stepside' };
  const BLUEBAY = { f: 0, c: 160, floor: 'grate', ceil: 'steeldark', side: 'trim', upper: 'rustpanel' };
  const HALLB = { f: 0, c: 320, floor: 'concrete', ceil: 'ceil', side: 'stepside', upper: 'concretedark' };
  const ISLAND = { f: 48, c: 320, floor: 'diamond', ceil: 'ceil', side: 'stepside' };
  const COLD = { f: 0, c: 224, floor: 'tile', ceil: 'jaildark', side: 'trim', upper: 'steel' };
  const EXITR = { f: 0, c: 192, floor: 'diamond', ceil: 'ceil', side: 'trim', upper: 'steel' };

  // ---------------- freight dock (start) ----------------
  K.room(4, 88, 18, 100, DOCK, 'rustpanel');
  K.start(11, 97, 0);
  K.item('candygun', X(11) + 16, Z(94)); K.item('candybag', X(13), Z(99), { amount: 50 });
  K.msg([X(8), 0, Z(92)], [X(15), 100, Z(97)], 'A CANDY CORN MACHINE GUN! Hold FIRE to spin up the barrels.');
  K.door(9, 87, 13, 87, DOCK, { top: 128 });
  K.lift([X(5), 0, Z(95)], [X(9), 8, Z(100)], 0); // the freight lift you arrived on (decor)
  K.crates(X(16), Z(90), 0, 2, 40); K.crates(X(16), Z(98), 0, 1, 40); K.pizzaBoxes(X(16), Z(98), 40, 3);
  K.fixture(X(11), Z(94), 224, 140, 'x', 'light', 360); K.lamp(X(5), 150, Z(90), 200);
  K.sign(X(11) + 16, 150, Z(88), 'pz', 'sign_vaults', 200, 40);
  K.qoqC(14, 89, 180); K.slices([[X(6), Z(90)], [X(17), Z(94)]]); K.juice(X(12), Z(99));
  K.paint(1, 92, 3, 95, T({ ...DOCK, c: 112 }));
  K.breakable([X(3) + 20, 0, Z(92)], [X(4), 112, Z(96)], { tex: 'boards', health: 20, secret: true });
  K.health(X(2), Z(93)); K.juice(X(2), Z(95)); K.light(X(2), 60, Z(94), 150, [1, 0.6, 0.3], 1);

  // ---------------- PEDESTAL HALL (image 3) ----------------
  K.room(4, 50, 46, 86, HALLA, 'concretedark');
  for (const r of [56, 64, 72, 80]) K.brush([X(4), 250, Z(r)], [X(47), 266, Z(r) + 16], { tex: 'metal' }); // ceiling beams
  for (const c of [12, 24, 36]) K.brush([X(c), 266, Z(50)], [X(c) + 16, 288, Z(87)], { tex: 'metal' });
  // the overseer's office: a raised corner block reached by climbing the pizza pedestals
  K.paint(38, 50, 46, 58, T(OFFICE));
  [[71, 32], [68, 64], [65, 96], [62, 128], [59, 160]].forEach(([r, y], i) => { K.brush([X(40), 0, Z(r)], [X(44), y, Z(r + 3)], { tex: 'concrete', top: 'diamond' }); if (i < 4) K.props(pr => pr.pizza(X(42), y, Z(r) + 48, 34)); });
  K.brush([X(38), 160, Z(50)], [X(38) + 2, 194, Z(59)], { tex: 'railing', fit: true, noshadow: true });
  K.brush([X(38), 160, Z(59) - 2], [X(40), 194, Z(59)], { tex: 'railing', fit: true, noshadow: true }); K.brush([X(44), 160, Z(59) - 2], [X(47), 194, Z(59)], { tex: 'railing', fit: true, noshadow: true });
  K.desk(X(41), Z(51), X(46), Z(53), 'pz'); K.key('blue', X(44), Z(55), 160);
  K.lamp(X(42), 240, Z(55), 220); K.slices([[X(40), Z(56), 160]]); K.juice(X(45), Z(57), 160);
  K.msg([X(36), 0, Z(70)], [X(46), 100, Z(78)], 'The blue keycard is up in the office...\nClimb the pizza pedestals!');
  // pedestals and tables with giant pizzas
  for (const [c, r, w, h] of [[10, 58, 4, 40], [20, 62, 5, 48], [12, 74, 4, 44], [28, 56, 4, 36], [30, 76, 6, 40]]) { K.brush([X(c), 0, Z(r)], [X(c + w), h, Z(r + w - 1)], { tex: 'concrete', top: 'metal' }); K.props(pr => pr.pizza(X(c) + w * 16, h, Z(r) + (w - 1) * 16, w * 12)); }
  K.props(pr => { pr.pizzaStack(X(23), 48, Z(64), 20, 4); pr.pizzaStack(X(33), 40, Z(78), 22, 3); });
  for (const [x, z] of [[X(16), Z(66)], [X(28), Z(70)]]) for (const [a, b, c2, d] of [[-70, -40, 70, -36], [-70, 36, 70, 40], [-70, -40, -66, 40], [66, -40, 70, 40]]) K.brush([x + a, 226, z + b], [x + c2, 232, z + d], { tex: 'light', noshadow: true, solid: false, fit: true });
  K.light(X(16), 200, Z(66), 420, [1, 0.95, 0.85]); K.light(X(28), 200, Z(70), 420, [1, 0.95, 0.85]);
  K.light(X(10), 220, Z(82), 320, [1, 0.8, 0.55]); K.light(X(38), 220, Z(84), 320, [1, 0.8, 0.55]); K.light(X(26), 230, Z(54), 320, [1, 0.8, 0.55]);
  // TV with the globe in a west wall alcove + lanterns
  K.brush([X(4), 0, Z(68)], [X(4) + 40, 32, Z(72)], { tex: 'metal' }); K.decal({ at: [X(4), 74, Z(70)], n: 'px', w: 100, h: 56, tex: 'globe', fullbright: true }); K.light(X(6), 74, Z(70), 220, [0.35, 0.6, 1]);
  K.lantern(X(4), 110, Z(64), 'px'); K.lantern(X(4), 110, Z(76), 'px');
  K.qoqC(14, 62, 180); K.qoqC(24, 70, 180); K.qoqC(32, 64, 90); K.qoqC(10, 80, 0); K.qoqC(36, 82, 0); K.qoqC(22, 54, 180); K.qoqC(44, 66, 90); K.qoqC(18, 84, 0);
  K.qoq(X(39) + 16, Z(52), 180, { turret: true, y: 160 }); K.qoq(X(45), Z(57) + 16, 180, { turret: true, y: 160 });
  K.slices([[X(12), Z(58), 40], [X(22), Z(64), 48], [X(30), Z(58), 36], [X(8), Z(70)], [X(42), Z(84)]]);
  K.juice(X(6), Z(52)); K.juice(X(44), Z(86)); K.health(X(6), Z(86)); K.health(X(30), Z(84));
  K.ambient(X(24), 100, Z(68), 'hum', 800, 0.6);
  // secret: shoot the panel above the TV to open a closet behind it
  K.door(3, 77, 3, 79, HALLA, { tex: 'concretedark', targeted: true, name: 'tvsecret', wait: -1, top: 104 }); K.paint(1, 76, 2, 80, T({ ...HALLA, c: 104 }));
  K.button({ min: [X(4), 150, Z(70) - 12], max: [X(4) + 4, 174, Z(70) + 12], shoot: true, target: 'tvsecret', msg: 'Something clicks behind the wall...' });
  K.decal({ at: [X(4), 162, Z(70)], n: 'px', w: 26, h: 26, tex: 'button', off: 4.5 });
  K.secret([X(1), 0, Z(76)], [X(4), 100, Z(81)]); K.health(X(1) + 16, Z(77)); K.juice(X(2), Z(79)); K.slice(X(1) + 16, Z(80));

  // ---------------- blue corridor ----------------
  K.paint(47, 66, 52, 70, T(BLUEBAY)); K.door(53, 66, 53, 70, BLUEBAY, { top: 120 });
  for (const c of [48, 51]) K.light(X(c), 120, Z(68), 260, [1, 1, 1], 2);
  K.qoqC(50, 67, 90); K.slice(X(50), Z(69));

  // ---------------- SAUCE MOAT HALL (red key) ----------------
  K.room(54, 50, 106, 86, HALLB, 'concretedark');
  K.paint(70, 60, 90, 76, T(ISLAND));
  K.pool(67, 57, 78, 59, HALLB); K.pool(82, 57, 93, 59, HALLB); K.pool(67, 77, 78, 79, HALLB); K.pool(82, 77, 93, 79, HALLB);
  K.pool(67, 60, 69, 76, HALLB); K.pool(91, 60, 93, 76, HALLB);
  K.stairs(79, 77, 81, 79, 'N', 16, 48, { ...HALLB, side: 'stepside' }); K.stairs(79, 57, 81, 59, 'S', 16, 48, { ...HALLB, side: 'stepside' });
  // the pizza tower
  K.brush([X(76), 48, Z(64)], [X(84), 80, Z(72)], { tex: 'concrete', top: 'diamond' });
  K.brush([X(78), 80, Z(66)], [X(82), 112, Z(70)], { tex: 'concrete', top: 'diamond' });
  K.brush([X(79), 112, Z(67)], [X(81), 128, Z(69)], { tex: 'concrete', top: 'metal' });
  K.stairBrush(X(79), Z(72), X(81), Z(76), 48, 80, 'N'); K.stairBrush(X(79), Z(70), X(81), Z(72), 80, 112, 'N');
  K.props(pr => { pr.pizza(X(77) + 8, 80, Z(65) + 8, 18); pr.pizza(X(83) - 8, 80, Z(71) - 8, 18); pr.pizzaStack(X(78) + 8, 112, Z(69) + 8, 12, 2); });
  K.key('red', X(80), Z(68), 128);
  for (const [c, r] of [[72, 62], [88, 62], [72, 74], [88, 74]]) K.column(C(c), C(r), 28, 48, 320, 'concrete');
  for (const [c, r] of [[62, 56], [98, 56], [62, 80], [98, 80]]) K.pizzaTable(C(c), C(r), 52);
  K.catwalk(X(56), Z(50), X(105), Z(53), 176, { rails: 's', tex: 'grate', supports: [[X(64), Z(53) - 4], [X(80), Z(53) - 4], [X(96), Z(53) - 4]] });
  for (const c of [60, 80, 100]) K.qoq(C(c), Z(51) + 16, 180, { turret: true, y: 176 });
  for (const [x, z] of [[X(62), Z(68)], [X(98), Z(68)], [X(80), Z(56)], [X(80), Z(82)]]) K.fixture(x, z, 320, 160, 'x', 'light', 420);
  K.light(X(80), 200, Z(68), 360, [1, 0.8, 0.5]);
  K.qoqC(60, 62, 90); K.qoqC(60, 76, 90); K.qoqC(100, 62, -90); K.qoqC(100, 76, -90); K.qoqC(74, 64, 180); K.qoqC(86, 72, 0); K.qoqC(80, 84, 0); K.qoqC(80, 54, 180);
  K.wave('redkey', { onKey: 'red', msg: 'The tower alarm blares! Qoqs pour in!' });
  for (const [c, r] of [[58, 54], [102, 54], [58, 84], [102, 84], [64, 68], [96, 68]]) K.qoqC(c, r, 0, { wave: 'redkey' });
  K.slices([[X(76), Z(62)], [X(84), Z(74)], [X(56), Z(68)], [X(104), Z(68)], [X(80), Z(66), 80]]);
  K.juice(X(56), Z(56)); K.juice(X(104), Z(84)); K.juice(X(80), Z(85)); K.health(X(104), Z(56)); K.health(X(56), Z(84));
  K.ambient(X(80), 40, Z(68), 'fire', 600, 0.6);
  K.paint(78, 45, 82, 48, T({ f: 0, c: 160, floor: 'tile', ceil: 'jaildark', upper: 'steel' }));
  K.door(78, 49, 82, 49, HALLB, { key: 'red', name: 'reddoor', top: 128 });

  // ---------------- COLD STORAGE ----------------
  K.room(20, 8, 100, 44, COLD, 'steel');
  for (const r of [14, 22, 30, 38]) for (const [c0, c1] of [[24, 42], [48, 66], [72, 90]]) {
    K.brush([X(c0), 0, Z(r)], [X(c1), 120, Z(r) + 48], { tex: 'cabinet', top: 'metal', pz: 'books', nz: 'books' });
    for (let c = c0 + 1; c < c1; c += 3) K.pizzaBoxes(C(c), Z(r) + 24, 120, 2 + ((c + r) % 3));
  }
  for (const [c, r] of [[46, 10], [70, 10], [94, 26], [46, 42], [94, 42]]) K.props((pr, ctx) => { ctx.brush([X(c), 0, Z(r)], [X(c) + 64, 96, Z(r) + 48], { tex: 'chrome', top: 'metal' }); ctx.decal({ at: [X(c) + 32, 70, Z(r) + 48], n: 'pz', w: 40, h: 12, tex: 'glowblue', fullbright: true, off: 0.6 }); });
  for (let c = 28; c <= 96; c += 16) for (const r of [12, 26, 41]) K.fixture(X(c), Z(r), 224, 120, 'x', 'lightblue', 300, [0.6, 0.8, 1]);
  K.sign(X(80), 150, Z(45), 'nz', 'sign_cold', 200, 40);
  K.emitter([X(20), 0, Z(8)], [X(100), 200, Z(44)], 'dust', 14);
  K.ambient(X(60), 100, Z(26), 'hum', 1400, 0.8);
  K.qoqC(30, 20, 90); K.qoqC(60, 28, -90); K.qoqC(84, 12, 180); K.qoqC(36, 36, 0); K.qoqC(76, 36, 0); K.qoqC(56, 12, 180);
  K.wave('freezer', { min: [X(44), 0, Z(26)], max: [X(70), 120, Z(30)], lock: ['reddoor', 'shortcut'], msg: 'The freezer doors lock! Qoqs in the aisles!', doneMsg: 'The doors thaw open.' });
  for (const [c, r] of [[22, 12], [98, 12], [22, 42], [98, 42], [60, 20], [60, 36], [45, 28]]) K.qoqC(c, r, 0, { wave: 'freezer' });
  K.slices([[X(45), Z(20)], [X(69), Z(34)], [X(93), Z(20)], [X(22), Z(28)], [X(98), Z(36)]]);
  K.juice(X(22), Z(10)); K.juice(X(70), Z(43)); K.juice(X(98), Z(28)); K.health(X(46), Z(43)); K.health(X(22), Z(43)); K.juice(X(60), Z(9));
  // shortcut back to the Pedestal Hall
  K.paint(24, 45, 28, 48, T(COLD)); K.door(24, 49, 28, 49, HALLA, { targeted: true, name: 'shortcut', top: 128 });
  K.button({ min: [X(28), 40, Z(47)], max: [X(28) + 8, 60, Z(48)], target: 'shortcut', msg: 'Shortcut to the Pedestal Hall opened.' });
  // secret teleporter tucked behind the north-east racks, to the moat hall gantry
  K.tele([X(97), 0, Z(9)], [X(100), 100, Z(12)], [X(84), 176, Z(51) + 16], 180);
  K.light(X(98), 50, Z(10), 200, [1, 0.6, 0.2], 1); K.props(pr => pr.ring(X(98) + 16, 1, Z(10) + 16, 26, 36, 4, 'z', 0, Math.PI * 2, 'chrome', 20));
  K.secret([X(82), 176, Z(50)], [X(88), 260, Z(53)]); K.health(X(86), Z(51) + 16, 176); K.juice(X(88), Z(51) + 16, 176);

  // ---------------- exit chamber (blue door) ----------------
  K.room(4, 20, 18, 32, EXITR, 'steel');
  K.door(19, 24, 19, 28, COLD, { key: 'blue', top: 120 });
  K.qoqC(8, 22, 90); K.qoqC(8, 30, 90);
  K.light(X(11), 140, Z(26), 340, [1, 0.8, 0.5]); K.slices([[X(14), Z(22)], [X(14), Z(30)]]);
  K.exit(X(4), 0, Z(26), 'px');

  K.goal(X(44), Z(55), 160); K.goal(X(80), Z(68), 128); K.goal(X(57), Z(28), 0, { wait: 12 });

  K.ruins({'seed': 3123, 'mode': 'bunker', 'theme': 'bunker', 'big': 30, 'lights': 30});
});
