// Keyboard, gamepad and touch input merged into one driving state.
export class Input {
  constructor() {
    this.keys = new Set();
    this.state = { steer: 0, gas: 0, brake: 0, drift: false, driftPressed: false, look: false };
    this.touch = { left: false, right: false, gas: false, brake: false, drift: false };
    this._prevDrift = false;
    this.pressed = new Set();
    addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
  }

  bindTouch(root) {
    for (const el of root.querySelectorAll('[data-touch]')) {
      const k = el.dataset.touch;
      const on = (e) => { e.preventDefault(); this.touch[k] = true; el.classList.add('down'); };
      const off = (e) => { e.preventDefault(); this.touch[k] = false; el.classList.remove('down'); };
      el.addEventListener('pointerdown', on);
      el.addEventListener('pointerup', off);
      el.addEventListener('pointercancel', off);
      el.addEventListener('pointerleave', off);
    }
  }

  // True once per key press (for menus, pause, respawn).
  took(code) {
    if (this.pressed.has(code)) { this.pressed.delete(code); return true; }
    return false;
  }

  poll() {
    const k = this.keys, s = this.state, t = this.touch;
    let steer = 0, gas = 0, brake = 0, drift = false;
    if (k.has('ArrowLeft') || k.has('KeyA') || t.left) steer -= 1;
    if (k.has('ArrowRight') || k.has('KeyD') || t.right) steer += 1;
    if (k.has('ArrowUp') || k.has('KeyW') || t.gas) gas = 1;
    if (k.has('ArrowDown') || k.has('KeyS') || t.brake) brake = 1;
    if (k.has('Space') || k.has('ShiftLeft') || k.has('ShiftRight') || t.drift) drift = true;
    s.look = k.has('KeyC');
    let pads = [];
    try { pads = navigator.getGamepads ? navigator.getGamepads() : []; } catch { /* blocked in some embeds */ }
    for (const p of pads) {
      if (!p) continue;
      const ax = p.axes[0] || 0;
      if (Math.abs(ax) > 0.15) steer = ax;
      if (p.buttons[14]?.pressed) steer = -1;
      if (p.buttons[15]?.pressed) steer = 1;
      gas = Math.max(gas, p.buttons[0]?.pressed ? 1 : 0, p.buttons[7]?.value || 0);
      brake = Math.max(brake, p.buttons[2]?.pressed || p.buttons[1]?.pressed ? 1 : 0, p.buttons[6]?.value || 0);
      if (p.buttons[5]?.pressed || p.buttons[4]?.pressed) drift = true;
      if (p.buttons[3]?.pressed) s.look = true;
      if (p.buttons[9]?.pressed && !this._padStart) this.pressed.add('Escape');
      this._padStart = !!p.buttons[9]?.pressed;
    }
    s.steer = Math.max(-1, Math.min(1, steer));
    s.gas = gas; s.brake = brake;
    s.driftPressed = drift && !this._prevDrift;
    s.drift = drift;
    this._prevDrift = drift;
    return s;
  }
}
