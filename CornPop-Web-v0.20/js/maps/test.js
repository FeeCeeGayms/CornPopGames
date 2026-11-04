import { makeLevel } from '../kit.js';

export default makeLevel({ name: 'TEST', title: 'FEATURE TEST', ambience: 'cave', ambient: 14, fog: { color: [0.03, 0.03, 0.035], density: 0.0004 },
  styles: [{ color: [1, 0.5, 0.15], pattern: 'candle' }] }, 40, 40, 'jailmetal', K => {
  const hall = { f: 0, c: 320, floor: 'jailfloor', ceil: 'jaildark', side: 'stepside' };
  K.room(2, 2, 37, 30, hall, 'jailmetal');
  K.start(20, 28, 0);
  K.item('soaker', K.C(20), K.C(26));
  K.cellBlock({ x0: K.X(4), zWall: K.Z(2), dir: 1, count: 6, y0: 0, numbers: ['cell101', 'cell102', 'cell103', 'cell102', 'cell101', 'cell103'], broken: [2, 8], open: [4],
    loot: (tier, i, cx, cz, yb) => { if (tier === 1 && i === 0) K.juice(cx, cz, yb); } });
  K.stairBrush(K.X(33), K.Z(7), K.X(36), K.Z(13), 0, 136, 'N');
  K.catwalk(K.X(33), K.Z(6), K.X(36), K.Z(7), 136, {});
  K.pool(8, 18, 16, 22, hall, 'sauce', 24, 10);
  K.lift([K.X(24), 0, K.Z(18)], [K.X(27), 16, K.Z(21)], 120);
  K.catwalk(K.X(27), K.Z(17), K.X(32), K.Z(22), 136, { rails: 'nse' });
  K.breakable([K.X(30), 0, K.Z(25)], [K.X(34), 96, K.Z(26)], { tex: 'boards', health: 20 });
  K.button({ min: [K.X(36) - 8, 40, K.Z(15)], max: [K.X(36), 60, K.Z(16)], shoot: true, target: 'cb_128_0_1', msg: 'Cell opened!' });
  K.wave('w1', { min: [K.X(18), 0, K.Z(12)], max: [K.X(24), 100, K.Z(16)], msg: 'AMBUSH!', lock: [] });
  K.qoq(K.C(10), K.C(14), 180, { wave: 'w1' }); K.qoq(K.C(30), K.C(14), 180, { wave: 'w1' });
  K.qoq(K.C(29), K.C(19), 180, { turret: true, y: 136 });
  K.skylight(K.C(20), K.C(14), 320, 0, 128, 128);
  K.sign(K.C(20), 240, K.Z(31), 'nz', 'neon_hornt', 128, 96);
  K.lantern(K.X(2), 120, K.C(20), 'px');
  K.tele([K.X(3), 0, K.Z(27)], [K.X(4), 100, K.Z(30)], [K.C(20), 0, K.C(24)], 0);
  K.exit(K.C(20), 0, K.Z(31), 'nz');
  K.ambient(K.C(20), 100, K.C(10), 'hum', 500);
  K.goal(K.C(20), K.C(26)); K.goal(K.C(30), K.C(19), 136); K.goal(K.C(34), K.Z(6) + 16, 136); K.goal(K.C(20), K.C(14));
});
