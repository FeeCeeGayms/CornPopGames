// E1M8 — TRICKS AND TOPPINGS. Doom II "Tricks and Traps" style: an octagonal hub with a door on every side, each
// leading to a trap room. The crate field (blue key), the dark pillar room that locks you in (red key), the
// teleporter gallery where only one pad reaches the gold key, and the last hall with the episode's final fight.
import { makeLevel } from '../kit.js';

export default makeLevel({
  name: 'E1M8', title: 'E1M8: TRICKS AND TOPPINGS', ambience: 'cave', ambient: 12, music: 'assets/music/e1m8.mp3',
  fog: { color: [0.045, 0.025, 0.045], density: 0.00035 },
  styles: [{ color: [1, 0.78, 0.5], pattern: 'flicker2' }, { color: [0.4, 1, 0.5], pattern: 'pulse' }, { color: [1, 0.55, 0.2], pattern: 'candle' }, { color: [1, 0.2, 0.1], pattern: 'neon' }],
  // Crypt of Hornt (v0.28): the map is re-skinned as an ancient ruin, lit by fire, under a hellish sky
  lightTint: [1, 0.84, 0.7], retex: {'door': 'cryptdoor', 'door_red': 'cryptdoor_red', 'door_blue': 'cryptdoor_blue', 'door_gold': 'cryptdoor_gold', 'techtan': 'ruindark', 'techgray': 'obsidian', 'techgreen': 'ruinwall2', 'techfloor': 'flagstone', 'ceil': 'vaultceil', 'light': 'runelight', 'lightamber': 'runelight', 'computer': 'runewall', 'support': 'ironrust', 'steeldark': 'vaultceil', 'rustpanel': 'bloodwall', 'metal': 'ironrust', 'concrete': 'flagdark', 'concretedark': 'flagdark', 'diamond': 'flagstone', 'tilebrown': 'flagblood', 'tile': 'flagdark', 'stepside': 'ruindark', 'trim': 'ruintrim', 'grate': 'ironrust', 'crate': 'bloodwall', 'bigbrown': 'bloodwall', 'graystone': 'ruindark', 'mossstone': 'ruinwall2', 'slimewall': 'ruinwall2', 'brickred': 'bloodwall', 'dirt': 'ashground', 'grass': 'deadgrass', 'checker': 'flagdark', 'lift': 'ironrust', 'hazard': 'ironrust', 'monitors': 'runelight', 'drawer': 'ruinwall2', 'jaildark': 'ruindark', 'cabinet': 'ruindark', 'books': 'bonewall', 'carpet': 'flagblood', 'chrome': 'ironrust'},
}, 104, 100, 'techtan', K => {
  const { X, Z, C } = K; const T = s => K.type(s);
  const HUB = { f: 0, c: 256, floor: 'checker', ceil: 'ceil', side: 'stepside', upper: 'techtan' };
  const CORR = { f: 0, c: 144, floor: 'techfloor', ceil: 'ceil', side: 'stepside', upper: 'techtan' };
  const CRATE = { f: 0, c: 224, floor: 'concrete', ceil: 'steeldark', side: 'stepside', upper: 'rustpanel' };
  const DARK = { f: 0, c: 176, floor: 'concretedark', ceil: 'concretedark', side: 'stepside', upper: 'techgray' };
  const TELE = { f: 0, c: 192, floor: 'tile', ceil: 'ceil', side: 'stepside', upper: 'techgreen' };
  const DAIS = { f: 64, c: 192, floor: 'diamond', ceil: 'ceil', side: 'support', upper: 'techgreen' };
  const FIN = { f: 0, c: 320, floor: 'bigbrown', ceil: 'concretedark', side: 'stepside', upper: 'brickred' };
  const PLAT = { f: 96, c: 320, floor: 'diamond', ceil: 'concretedark', side: 'stepside', upper: 'brickred' };

  // ======================= THE HUB (start) =======================
  K.octo(42, 40, 62, 60, HUB, 4, 'techtan');
  K.start(52, 56, 0);
  for (const [c, r] of [[47, 45], [57, 45], [47, 55], [57, 55]]) K.column(C(c), C(r), 40, 0, 256, 'support', 'trim');
  K.brush([X(51), 0, Z(49)], [X(54), 24, Z(52)], { tex: 'techtan', top: 'diamond' }); K.props(pr => pr.pizzaStack(X(52) + 16, 24, Z(50) + 16, 34, 6));
  K.brush([X(51) + 8, 24, Z(49) + 8], [X(54) - 8, 120, Z(52) - 8], { invisible: true, noshadow: true });
  K.light(X(52) + 16, 200, Z(50) + 16, 420, [1, 0.9, 0.75], 3);
  for (const [x, z] of [[X(46), Z(50)], [X(59), Z(50)], [X(52), Z(44)], [X(52), Z(57)]]) K.light(x, 160, z, 260, [1, 0.95, 0.85]);
  K.sign(X(52) + 16, 180, Z(40), 'pz', 'hazard', 64, 32, false);
  K.qoqC(45, 50, -90); K.qoqC(59, 50, 90); K.qoqC(52, 43, 180);
  K.slices([[X(44), Z(45)], [X(60), Z(45)], [X(44), Z(55)], [X(60), Z(55)]]); K.juice(X(48), Z(58)); K.health(X(56), Z(58));
  K.msg([X(50), 0, Z(53)], [X(55), 100, Z(58)], 'Four doors. Every one of them is a trap.');
  // secret: shoot the panel above the north door
  const NICHE = { f: 0, c: 112, floor: 'tilebrown', ceil: 'ceil', side: 'stepside', upper: 'techtan' };
  K.paint(64, 44, 66, 46, T(NICHE)); K.door(63, 44, 63, 46, NICHE, { tex: 'techtan', targeted: true, name: 'hubniche', wait: -1 });
  K.button({ min: [X(52) + 4, 172, Z(40)], max: [X(53) + 28, 196, Z(40) + 4], shoot: true, target: 'hubniche', msg: 'Something clicks on the east wall...' });
  K.decal({ at: [X(53), 184, Z(40)], n: 'pz', w: 26, h: 26, tex: 'button', off: 4.5 });
  K.secret([X(64), 0, Z(44)], [X(67), 100, Z(47)]); K.health(X(65), Z(44) + 8); K.health(X(65), Z(46) + 24); K.item('candybag', X(66), Z(45) + 16, { amount: 50 }); K.light(X(65), 70, Z(45) + 16, 160, [1, 0.6, 0.3], 3);

  // ======================= CRATE FIELD (north, blue key) =======================
  K.door(50, 39, 54, 39, HUB, { top: 128 }); K.paint(50, 35, 54, 38, T(CORR));
  K.room(38, 8, 66, 34, CRATE, 'rustpanel');
  const stacks = [[41, 12, 3], [45, 12, 1], [49, 12, 2], [57, 12, 3], [61, 12, 1], [64, 13, 2], [41, 16, 1], [45, 17, 2], [53, 16, 3], [57, 17, 1], [61, 16, 2],
    [42, 21, 2], [46, 21, 3], [50, 21, 1], [55, 21, 2], [59, 21, 3], [63, 21, 1], [41, 26, 3], [45, 26, 1], [49, 26, 2], [53, 27, 1], [58, 26, 2], [62, 26, 3], [44, 31, 2], [51, 31, 1], [56, 31, 2], [61, 31, 1]];
  for (const [c, r, n] of stacks) K.crates(C(c), C(r), 0, n, 56);
  K.key('blue', X(39) + 16, Z(9) + 16); K.light(X(40), 90, Z(10), 220, [0.4, 0.6, 1]);
  for (const [x, z] of [[X(44), Z(14)], [X(58), Z(14)], [X(44), Z(28)], [X(58), Z(28)], [X(51), Z(21)]]) K.light(x, 200, z, 360, [1, 0.95, 0.85], 1);
  K.qoq(C(41), C(12), 180, { turret: true, y: 168 }); K.qoq(C(53), C(16), 180, { turret: true, y: 168 }); K.qoq(C(62), C(26), 180, { turret: true, y: 168 });
  K.qoqC(48, 15, 180); K.qoqC(60, 19, 180); K.qoqC(39, 23, 90); K.qoqC(52, 29, 180); K.qoqC(65, 30, -90); K.qoqC(56, 10, 180);
  K.slices([[X(39), Z(33)], [X(65), Z(9)], [X(52), Z(24)], [X(44), Z(10)]]); K.juice(X(65), Z(33)); K.juice(X(47), Z(24)); K.health(X(60), Z(9)); K.item('sausages', X(39), Z(18));
  K.wave('bluekey', { onKey: 'blue', msg: 'The crates were hollow!' });
  for (const [c, r] of [[43, 10], [39, 14], [47, 19], [43, 24], [51, 14]]) K.qoqC(c, r, 0, { wave: 'bluekey' });
  // secret: boards in the north-east corner
  K.paint(67, 10, 70, 14, T({ ...CRATE, c: 112, floor: 'tilebrown' })); K.paint(67, 11, 67, 13, T({ ...CRATE, c: 112 }));
  K.breakable([X(67), 0, Z(11)], [X(67) + 12, 112, Z(14)], { tex: 'boards', health: 24, secret: true });
  K.health(X(69), Z(11)); K.juice(X(69), Z(13)); K.item('turdbox', X(68) + 16, Z(12)); K.light(X(69), 60, Z(12), 160, [1, 0.6, 0.3], 3);

  // ======================= DARK PILLARS (east, blue door, red key) =======================
  K.door(63, 48, 63, 52, HUB, { key: 'blue', top: 144, name: 'bluedoor' }); K.paint(64, 48, 67, 52, T(CORR));
  K.room(68, 38, 96, 62, DARK, 'techgray');
  for (const c of [72, 78, 84, 90]) for (const r of [42, 48, 53, 58]) if (!(r === 48 && c === 72)) K.wall(c, r, c + 1, r + 1, 'support');
  K.pool(70, 45, 94, 46, DARK, 'sauce', 8, 5); K.pool(70, 55, 94, 56, DARK, 'sauce', 8, 5);
  K.brush([X(93), 0, Z(49)], [X(96), 24, Z(52)], { tex: 'techgray', top: 'diamond' });
  K.key('red', X(94) + 16, Z(50) + 16, 24); K.light(X(94) + 16, 80, Z(50) + 16, 200, [1, 0.25, 0.15], 2);
  K.light(X(70), 100, Z(50), 160, [0.5, 0.6, 1], 1); K.light(X(82), 140, Z(40), 140, [1, 0.3, 0.2], 2); K.light(X(82), 140, Z(60), 140, [1, 0.3, 0.2], 2);
  K.qoqC(76, 40, -90); K.qoqC(88, 44, -90); K.qoqC(81, 51, -90); K.qoqC(87, 60, -90); K.qoqC(94, 40, 90); K.qoqC(94, 60, 90);
  K.slices([[X(69), Z(39)], [X(69), Z(61)], [X(95), Z(39)], [X(95), Z(61)]]); K.juice(X(76), Z(51)); K.health(X(88), Z(51)); K.item('sausages', X(82), Z(39));
  K.wave('dark', { min: [X(69), 0, Z(47)], max: [X(72), 100, Z(54)], lock: ['bluedoor'], msg: 'The door slams shut behind you! The lights die...', doneMsg: 'The door unlocks.' });
  for (const [c, r] of [[75, 44], [87, 47], [80, 57], [93, 54], [75, 60], [86, 40], [70, 58]]) K.qoqC(c, r, 0, { wave: 'dark' });
  // secret door in the south wall
  const CLO = { f: 0, c: 112, floor: 'tilebrown', ceil: 'concretedark', side: 'stepside', upper: 'techgray' };
  K.paint(79, 64, 83, 67, T(CLO)); K.door(80, 63, 82, 63, CLO, { tex: 'techgray', wait: -1 });
  K.secret([X(79), 0, Z(64)], [X(84), 100, Z(68)]); K.health(X(80), Z(65)); K.health(X(82), Z(65)); K.juice(X(81), Z(66) + 16); K.light(X(81), 60, Z(66), 160, [1, 0.6, 0.3], 3);

  // ======================= TELEPORTER GALLERY (west, red door, gold key) =======================
  K.door(41, 48, 41, 52, HUB, { key: 'red', top: 144 }); K.paint(37, 48, 40, 52, T(CORR));
  K.room(16, 44, 36, 56, TELE, 'techgreen');
  K.room(8, 46, 14, 54, DAIS, 'techgreen'); K.paint(15, 46, 15, 54, T({ ...DAIS }));
  K.brush([X(15) + 30, 64, Z(46)], [X(16), 98, Z(55)], { tex: 'railing', fit: true, noshadow: true });
  // alcoves with pads: north 1 & 2, south 1 & 2
  for (const c of [20, 28]) { K.paint(c, 40, c + 3, 43, T({ ...TELE, c: 128 })); K.paint(c, 57, c + 3, 60, T({ ...TELE, c: 128 })); }
  K.teleporter(21, 41, 22, 42, 34, 50, 90);                              // north 1: back to the doorway (a dud)
  K.teleporter(29, 41, 30, 42, 10, 50, -90, { color: [1, 0.85, 0.3] });    // north 2: onto the dais
  K.teleporter(21, 58, 22, 59, 21, 66, 0, { color: [1, 0.4, 0.3] });       // south 1: the trap pit
  K.teleporter(29, 58, 30, 59, 18, 50, -90);                             // south 2: the far end of the hall (a dud)
  K.key('gold', X(9) + 16, Z(50) + 16, 64); K.light(X(10), 140, Z(50), 260, [1, 0.85, 0.3]);
  K.msg([X(31), 0, Z(45)], [X(36), 100, Z(55)], 'Four pads. Only one goes where you want...');
  for (const c of [20, 28]) { K.light(X(c + 2), 100, Z(42), 160, [0.4, 1, 0.5], 2); K.light(X(c + 2), 100, Z(58), 160, [1, 0.4, 0.3], 2); }
  K.fixture(X(26), Z(50), 192, 256, 'x', 'light', 320);
  K.qoqC(18, 45, 90); K.qoqC(34, 45, -90); K.qoqC(26, 55, 0); K.qoq(X(12), Z(47), 90, { turret: true, y: 64 });
  K.slices([[X(17), Z(55)], [X(35), Z(55)], [X(12), Z(53), 64]]); K.juice(X(17), Z(45)); K.health(X(25), Z(44));
  // the trap pit (south 1 lands here) - a door leads back out
  K.room(18, 63, 26, 70, { ...DARK, c: 128 }, 'techgray'); K.door(20, 62, 22, 62, TELE, { top: 112 });
  K.qoqC(19, 69, 0); K.qoqC(25, 69, 0); K.qoqC(25, 64, 0); K.health(X(19), Z(64)); K.light(X(22), 90, Z(67), 160, [1, 0.3, 0.2], 2);
  // gold key closets burst open
  const GC = { f: 0, c: 128, floor: 'tile', ceil: 'ceil', side: 'stepside', upper: 'techgreen' };
  K.paint(16, 40, 18, 42, T(GC)); K.door(17, 43, 18, 43, GC, { tex: 'techgreen', targeted: true, name: 'gclosets', wait: -1 });
  K.paint(32, 57, 35, 60, T(GC)); K.door(33, 57, 34, 57, GC, { tex: 'techgreen', targeted: true, name: 'gclosets', wait: -1 });
  K.wave('goldkey', { onKey: 'gold', release: ['gclosets'], msg: 'The walls open up!' });
  for (const [c, r] of [[17, 41], [16, 41], [33, 59], [34, 59]]) K.qoqC(c, r, 0, { wave: 'goldkey' });

  // ======================= THE LAST SLICE (south, gold door, exit) =======================
  K.door(50, 61, 54, 61, HUB, { key: 'gold', top: 144 }); K.paint(50, 62, 54, 65, T(CORR));
  K.room(34, 66, 70, 96, FIN, 'brickred');
  K.paint(44, 88, 60, 96, T(PLAT)); K.stairs(48, 82, 56, 87, 'S', 16, 96, { ...FIN, floor: 'stepside' });
  K.door(48, 81, 56, 81, FIN, { tex: 'bars', thin: true, targeted: true, name: 'exitbars', wait: -1, top: 144 });
  K.exit(X(52) + 16, 96, Z(97), 'nz');
  for (const [c, r] of [[38, 70], [66, 70], [38, 84], [66, 84], [44, 76], [60, 76]]) K.column(C(c), C(r), 48, 0, 320, 'brickred', 'trim');
  for (const [x, z] of [[X(42), Z(72)], [X(62), Z(72)], [X(52), Z(80)], [X(42), Z(90)], [X(62), Z(90)]]) K.light(x, 240, z, 480, [1, 0.6, 0.35], 1);
  K.pool(35, 90, 42, 95, FIN, 'sauce', 16, 8); K.pool(62, 90, 69, 95, FIN, 'sauce', 16, 8);
  K.slices([[X(35), Z(67)], [X(69), Z(67)], [X(52), Z(92)]]); K.juice(X(36), Z(78)); K.juice(X(68), Z(78)); K.health(X(44), Z(67)); K.health(X(60), Z(67)); K.item('sausages', X(52), Z(70)); K.item('candybag', X(46), Z(86), { amount: 40 }); K.item('turdbox', X(58), Z(86));
  K.wave('final1', { min: [X(48), 0, Z(66)], max: [X(57), 100, Z(69)], msg: 'THE LAST SLICE! Survive!', stagger: 0.3, next: 'final2', nextDelay: 2 });
  for (const [c, r] of [[36, 72], [68, 72], [40, 80], [64, 80], [52, 76], [36, 86], [68, 86], [46, 72], [58, 72]]) K.qoqC(c, r, 0, { wave: 'final1' });
  K.wave('final2', { msg: 'Here comes the second wave!', stagger: 0.35, opens: ['exitbars'], doneMsg: 'The way to the exit is open!' });
  for (const [c, r] of [[45, 90], [59, 90], [52, 93], [38, 76], [66, 76], [52, 84], [40, 92], [64, 92]]) K.qoqC(c, r, 180, { wave: 'final2', y: undefined });

  K.goal(X(39) + 16, Z(9) + 16, 0); K.goal(X(80), Z(50), 0, { wait: 20 }); K.goal(X(94) + 16, Z(50) + 16, 24); K.goal(X(9) + 16, Z(50) + 16, 64); K.goal(X(52), Z(74), 0, { wait: 40 });

  K.ruins({ seed: 1296, theme: 'hell', big: 26 });
});
