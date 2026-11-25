// E1M4 — THE OVEN FOCUS. Doom II "The Focus" style: an all-indoor brick fortress. A long bridge hall over a
// boiling-sauce pit with galleries on both sides, a cross-shaped junction with three doors, the dough library
// (blue key), the oven kitchens behind the blue door (red key) and the great furnace exit behind the red door.
import { makeLevel } from '../kit.js';

export default makeLevel({
  name: 'E1M4', title: 'E1M4: THE OVEN FOCUS', ambience: 'cave', ambient: 16, music: 'assets/music/e1m4.mp3',
  fog: { color: [0.06, 0.02, 0.015], density: 0.0004 },
  styles: [{ color: [1, 0.78, 0.5], pattern: 'flicker2' }, { color: [1, 0.3, 0.1], pattern: 'pulse' }, { color: [1, 0.55, 0.2], pattern: 'candle' }, { color: [1, 0.2, 0.1], pattern: 'neon' }],
  // Crypt of Hornt (v0.28): the map is re-skinned as an ancient ruin, lit by fire, under a hellish sky
  lightTint: [1, 0.84, 0.7], retex: {'door': 'cryptdoor', 'door_red': 'cryptdoor_red', 'door_blue': 'cryptdoor_blue', 'door_gold': 'cryptdoor_gold', 'techtan': 'ruinwall', 'techgray': 'ruindark', 'techgreen': 'ruinwall2', 'techfloor': 'flagstone', 'ceil': 'vaultceil', 'light': 'runelight', 'lightamber': 'runelight', 'computer': 'runewall', 'support': 'ironrust', 'steeldark': 'vaultceil', 'rustpanel': 'bloodwall', 'metal': 'ironrust', 'concrete': 'flagdark', 'concretedark': 'flagdark', 'diamond': 'flagstone', 'tilebrown': 'flagblood', 'tile': 'flagdark', 'stepside': 'ruindark', 'trim': 'ruintrim', 'grate': 'ironrust', 'crate': 'ruinwall2', 'bigbrown': 'bloodwall', 'graystone': 'ruindark', 'mossstone': 'ruinwall2', 'slimewall': 'ruinwall2', 'brickred': 'bloodwall', 'dirt': 'ashground', 'grass': 'deadgrass', 'checker': 'flagdark', 'lift': 'ironrust', 'hazard': 'ironrust', 'monitors': 'runelight', 'drawer': 'ruinwall2', 'jaildark': 'ruindark', 'cabinet': 'ruindark', 'books': 'bonewall', 'carpet': 'flagblood', 'chrome': 'ironrust'},
}, 104, 80, 'bigbrown', K => {
  const { X, Z, C } = K; const T = s => K.type(s);
  const ENTRY = { f: 0, c: 144, floor: 'tilebrown', ceil: 'ceil', side: 'stepside', upper: 'bigbrown' };
  const BH = { f: 0, c: 256, floor: 'bigbrown', ceil: 'concretedark', side: 'stepside', upper: 'bigbrown' };
  const GAL = { f: 48, c: 256, floor: 'diamond', ceil: 'concretedark', side: 'bigbrown', upper: 'bigbrown' };
  const JUNC = { f: 0, c: 192, floor: 'checker', ceil: 'ceil', side: 'stepside', upper: 'brickred' };
  const LIB = { f: 0, c: 192, floor: 'carpet', ceil: 'ceil', side: 'stepside', upper: 'wood' };
  const MEZZ = { f: 64, c: 192, floor: 'wood', ceil: 'ceil', side: 'wood', upper: 'wood' };
  const KIT = { f: 0, c: 192, floor: 'tile', ceil: 'steeldark', side: 'stepside', upper: 'brickred' };
  const FURN = { f: 0, c: 288, floor: 'burnt', ceil: 'concretedark', side: 'stepside', upper: 'brickred' };

  // ======================= FURNACE ENTRY (start) =======================
  K.room(4, 34, 15, 45, ENTRY, 'brickred');
  K.start(6, 39, -90);
  K.item('turdgun', X(10), Z(39) + 16); K.item('turdbox', X(5), Z(44)); K.item('turdbox', X(5), Z(35));
  K.msg([X(6), 0, Z(36)], [X(14), 100, Z(43)], 'The TURD LAUNCHER! Lob stinky bombs over cover.');
  K.lantern(X(4), 60, Z(37), 'px'); K.lantern(X(4), 60, Z(42), 'px'); K.lantern(X(16), 60, Z(35), 'nx'); K.lantern(X(16), 60, Z(44), 'nx');
  K.health(X(14), Z(35)); K.juice(X(14), Z(44)); K.slice(X(10), Z(44));
  K.door(16, 38, 17, 41, ENTRY, { top: 128 });

  // ======================= THE BRIDGE HALL =======================
  K.room(18, 30, 56, 49, BH, 'bigbrown');
  K.paint(18, 30, 56, 32, T(GAL)); K.paint(18, 47, 56, 49, T(GAL));
  K.stairs(18, 33, 19, 35, 'N', 0, 32, { ...BH, floor: 'stepside' }); K.stairs(18, 44, 19, 46, 'S', 0, 32, { ...BH, floor: 'stepside' });
  K.stairs(55, 33, 56, 35, 'N', 0, 32, { ...BH, floor: 'stepside' }); K.stairs(55, 44, 56, 46, 'S', 0, 32, { ...BH, floor: 'stepside' });
  // the pit of boiling sauce on both sides of the bridge (rows 33-37 & 42-46), a lift to climb out
  K.pool(20, 33, 54, 37, { ...BH, f: -112, side: 'burnt' }, 'sauce', 16, 10); K.pool(20, 42, 54, 46, { ...BH, f: -112, side: 'burnt' }, 'sauce', 16, 10);
  K.liftCells(20, 45, 21, 46, -128, 0);
  K.brush([X(22), -128, Z(42)], [X(22) + 8, 0, Z(47)], { tex: 'support' });
  K.msg([X(20), -128, Z(42)], [X(23), -60, Z(47)], 'Hop on the lift to get out!');
  // railings: bridge edges and gallery edges
  K.brush([X(20), 0, Z(38)], [X(55), 34, Z(38) + 2], { tex: 'railing', fit: true, noshadow: true }); K.brush([X(20), 0, Z(42) - 2], [X(55), 34, Z(42)], { tex: 'railing', fit: true, noshadow: true });
  K.brush([X(20), 48, Z(33) - 2], [X(55), 82, Z(33)], { tex: 'railing', fit: true, noshadow: true }); K.brush([X(20), 48, Z(47)], [X(55), 82, Z(47) + 2], { tex: 'railing', fit: true, noshadow: true });
  for (const c of [27, 37, 47]) { K.brush([X(c), -128, Z(37) - 12], [X(c) + 24, 0, Z(38)], { tex: 'support' }); K.brush([X(c), -128, Z(42)], [X(c) + 24, 0, Z(42) + 12], { tex: 'support' }); }
  for (const c of [24, 34, 44, 52]) { K.lantern(X(c), 110, Z(30), 'pz'); K.lantern(X(c), 110, Z(50), 'nz'); }
  for (const c of [24, 33, 42, 51]) K.light(X(c), 150, Z(40), 440, [1, 0.65, 0.35], 1);
  K.ambient(X(37), -100, Z(40), 'fire', 1200, 0.7);
  K.qoq(X(28), Z(31), 180, { turret: true, y: 48 }); K.qoq(X(46), Z(31), 180, { turret: true, y: 48 }); K.qoq(X(36), Z(48) + 16, 0, { turret: true, y: 48 });
  K.qoqC(30, 39, -90); K.qoqC(44, 40, -90); K.qoqC(52, 31, 180); K.qoqC(22, 48, 0); K.qoqC(53, 48, 0);
  K.slices([[X(24), Z(31), 48], [X(50), Z(48), 48], [X(37), Z(40)], [X(30), Z(35)], [X(44), Z(44)]]); K.juice(X(19), Z(40)); K.juice(X(56), Z(40)); K.health(X(40), Z(31), 48); K.item('turdbox', X(30), Z(48), 48);
  // secret: a switch in the north gallery wall opens a closet
  const CLO = { f: 48, c: 144, floor: 'tilebrown', ceil: 'concretedark', side: 'stepside', upper: 'bigbrown' };
  K.paint(35, 25, 39, 28, T(CLO)); K.door(36, 29, 38, 29, CLO, { tex: 'bigbrown', targeted: true, name: 'galsecret', wait: -1 });
  K.switch(X(42), 100, Z(30), 'pz', 'galsecret', 'A hidden door rumbles open...');
  K.secret([X(35), 48, Z(25)], [X(40), 140, Z(29)]); K.health(X(36), Z(26), 48); K.health(X(38), Z(26), 48); K.juice(X(37), Z(27), 48); K.light(X(37), 110, Z(26), 160, [1, 0.6, 0.3], 1);

  // ======================= THE JUNCTION =======================
  K.door(57, 38, 57, 41, BH, { top: 144 });
  K.room(58, 33, 72, 46, JUNC, 'brickred');
  K.paint(62, 24, 68, 32, T(JUNC)); K.paint(62, 47, 68, 55, T(JUNC)); K.paint(73, 37, 76, 42, T(JUNC));
  for (const [c, r] of [[60, 35], [70, 35], [60, 44], [70, 44]]) K.column(C(c), C(r), 32, 0, 192, 'brickred', 'trim');
  K.props(pr => pr.pizzaStack(C(65), 0, C(39) + 16, 30, 5)); K.brush([X(64), 0, Z(39)], [X(67), 40, Z(41)], { invisible: true, noshadow: true });
  K.fixture(X(65) + 16, Z(36), 192, 160, 'x', 'light', 320, [1, 0.9, 0.75], 3); K.fixture(X(65) + 16, Z(43), 192, 160, 'x', 'light', 320, [1, 0.9, 0.75], 3);
  K.light(X(65), 120, Z(28), 260, [1, 0.8, 0.6]); K.light(X(65), 120, Z(51), 260, [1, 0.8, 0.6]); K.light(X(75), 120, Z(40), 220, [1, 0.3, 0.2]);
  K.qoqC(59, 34, -90); K.qoqC(71, 45, 90); K.qoqC(65, 26, 180); K.qoqC(65, 53, 0);
  K.slices([[X(59), Z(45)], [X(71), Z(34)]]); K.juice(X(62), Z(24) + 16); K.health(X(68), Z(55));
  K.sign(X(65) + 16, 150, Z(24), 'pz', 'sign_library', 128, 32); K.sign(X(65) + 16, 150, Z(56), 'nz', 'sign_kitchen', 128, 32);

  // ======================= THE DOUGH LIBRARY (blue key) =======================
  K.door(62, 23, 68, 23, JUNC, { top: 160 });
  K.room(56, 4, 80, 22, LIB, 'wood');
  K.paint(56, 4, 80, 7, T(MEZZ));
  K.stairs(56, 8, 59, 11, 'N', 16, 48, { ...LIB, floor: 'wood', side: 'wood' });
  K.brush([X(60), 64, Z(8) - 2], [X(81), 98, Z(8)], { tex: 'railing', fit: true, noshadow: true });
  for (const r of [10, 14, 18]) for (const [c0, c1] of [[61, 67], [70, 77]]) K.bookshelf(X(c0), Z(r), X(c1), Z(r) + 24, 112, 'pz');
  K.key('blue', X(79), Z(5) + 16, 64); K.light(X(78), 140, Z(6), 260, [0.4, 0.6, 1]);
  for (const c of [62, 72]) for (const r of [12, 16, 20]) K.light(X(c) + 32, 150, Z(r), 220, [1, 0.8, 0.55], 1);
  K.lamp(X(64), 160, Z(5), 200); K.lamp(X(74), 160, Z(5), 200);
  K.qoq(X(66), Z(5), 180, { turret: true, y: 64 }); K.qoq(X(76), Z(6), 180, { turret: true, y: 64 });
  K.qoqC(58, 20, 0); K.qoqC(79, 20, 0); K.qoqC(68, 12, 90); K.qoqC(75, 16, -90); K.qoqC(64, 20, 180);
  K.slices([[X(57), Z(5), 64], [X(68), Z(16)], [X(79), Z(12)]]); K.juice(X(57), Z(21)); K.juice(X(79), Z(21)); K.health(X(70), Z(5), 64);
  K.wave('bluekey', { onKey: 'blue', msg: 'The shelves were hiding Qoqs!' });
  for (const [c, r] of [[59, 16], [78, 16], [68, 20], [68, 9]]) K.qoqC(c, r, 0, { wave: 'bluekey' });
  // secret: boards in the west wall
  K.paint(51, 11, 54, 15, T({ ...LIB, c: 112, floor: 'tilebrown' })); K.paint(55, 12, 55, 14, T({ ...LIB, c: 112 }));
  K.breakable([X(55), 0, Z(12)], [X(56), 112, Z(15)], { tex: 'boards', health: 24, secret: true });
  K.health(X(52), Z(12)); K.item('turdbox', X(53), Z(14)); K.slice(X(52), Z(14) + 16); K.light(X(52), 70, Z(13), 160, [1, 0.6, 0.3], 1);

  // ======================= THE OVEN KITCHENS (blue door, red key) =======================
  K.door(62, 56, 68, 56, JUNC, { key: 'blue', top: 160 });
  K.room(56, 57, 80, 76, KIT, 'brickred');
  for (const [c0, r0] of [[57, 58], [57, 70], [76, 58], [76, 70]]) K.props((pr, ctx) => { ctx.brush([X(c0), 0, Z(r0)], [X(c0 + 4), 112, Z(r0 + 5)], { tex: 'brickred', top: 'metal' }); ctx.ent({ type: 'fire', pos: [X(c0 + 2), 8, Z(r0 + 2) + 16], size: 40 }); ctx.light(X(c0 + 2), 50, Z(r0 + 2) + 16, 260, [1, 0.5, 0.2], 2); });
  K.pool(62, 61, 74, 62, KIT, 'sauce', 8, 5); K.pool(62, 71, 74, 72, KIT, 'sauce', 8, 5);
  K.counter(X(64), Z(65), X(72), Z(68), 48, 'drawer', 'pz', 'metal');
  K.key('red', X(68), Z(64), 0); K.light(X(68), 110, Z(64), 240, [1, 0.3, 0.2]);
  K.props(pr => { pr.pizza(X(65) + 8, 48, Z(66) + 16, 18); pr.pizza(X(71) - 8, 48, Z(66) + 16, 18); });
  K.fixture(X(68), Z(60), 192, 160, 'x', 'light', 320); K.fixture(X(68), Z(74), 192, 160, 'x', 'light', 320);
  K.qoqC(60, 64, 90); K.qoqC(76, 66, -90); K.qoqC(68, 74, 0); K.qoqC(64, 58, 180); K.qoqC(73, 58, 180); K.qoqC(61, 75, 0);
  K.slices([[X(60), Z(60)], [X(76), Z(75)], [X(68), Z(70)]]); K.juice(X(79), Z(64)); K.juice(X(57), Z(66)); K.health(X(68), Z(69) + 16); K.item('sausages', X(57), Z(75));
  K.ambient(X(68), 40, Z(66), 'fire', 900, 0.8);
  K.wave('redkey', { onKey: 'red', msg: 'The oven doors swing open!' });
  for (const [c, r] of [[59, 61], [77, 61], [59, 73], [77, 73], [68, 59]]) K.qoqC(c, r, 0, { wave: 'redkey' });

  // ======================= THE GREAT FURNACE (red door, exit) =======================
  K.door(77, 37, 77, 42, JUNC, { key: 'red', top: 160 });
  K.room(78, 30, 100, 49, FURN, 'brickred');
  K.paint(94, 36, 100, 43, T({ ...FURN, f: 48, floor: 'diamond', side: 'stepside' })); K.stairs(90, 36, 93, 43, 'E', 12, 48, { ...FURN, floor: 'stepside' });
  K.pool(80, 31, 92, 33, FURN, 'sauce', 16, 10); K.pool(80, 46, 92, 48, FURN, 'sauce', 16, 10);
  for (const [c, r] of [[83, 35], [89, 35], [83, 44], [89, 44]]) K.column(C(c), C(r), 40, 0, 288, 'brickred', 'trim');
  K.exit(X(101), 48, Z(40), 'nx');
  for (const [c, r] of [[84, 32], [90, 32], [84, 47], [90, 47]]) K.ent({ type: 'fire', pos: [C(c), -8, C(r)], size: 56 });
  K.light(X(86), 160, Z(40), 500, [1, 0.55, 0.3], 1); K.light(X(97), 150, Z(40), 300, [1, 0.6, 0.4]);
  K.wave('furnace', { min: [X(78), 0, Z(36)], max: [X(82), 120, Z(44)], msg: 'The furnace roars!' });
  for (const [c, r] of [[96, 33], [96, 46], [86, 38], [86, 42], [92, 34], [92, 45]]) K.qoqC(c, r, 90, { wave: 'furnace' });
  K.slices([[X(80), Z(35)], [X(80), Z(44)]]); K.health(X(99), Z(37), 48); K.juice(X(99), Z(42), 48);

  K.goal(X(79), Z(5) + 16, 64); K.goal(X(68), Z(64), 0);

  K.ruins({ seed: 1148, theme: 'blood', big: 24 });
});
