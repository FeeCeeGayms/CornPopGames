// Keyboard + mouse (pointer lock), touch twin-stick, and gamepad input.
export class Input {
  constructor(el, ui) {
    this.el = el; this.keys = new Set(); this.lookDX = 0; this.lookDY = 0;
    this.touchMove = { x: 0, y: 0 }; this.touchJump = false; this.touchUse = false; this.pressed = new Set();
    this.sens = 1; this.touchSens = 1; this.invert = false; this.isTouch = false; this.enabled = false;
    addEventListener('keydown', e => { if (!this.enabled && e.code !== 'Escape') return; if (!this.keys.has(e.code)) this.pressed.add(e.code); this.keys.add(e.code); if (['Space', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.code)) e.preventDefault(); });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => { this.keys.clear(); this.mouseFire = false; });
    addEventListener('mousemove', e => { if (document.pointerLockElement === this.el) { this.lookDX += e.movementX; this.lookDY += e.movementY; } });
    el.addEventListener('mousedown', e => { if (e.pointerType === 'touch') return; if (this.enabled && document.pointerLockElement !== el && !this.isTouch) { el.requestPointerLock?.(); return; } if (e.button === 0) this.mouseFire = true; });
    addEventListener('mouseup', e => { if (e.button === 0) this.mouseFire = false; });
    addEventListener('wheel', e => { if (this.enabled && document.pointerLockElement === this.el && Math.abs(e.deltaY) > 2) this.pressed.add(e.deltaY > 0 ? 'WheelDown' : 'WheelUp'); }, { passive: true });
    this.setupTouch(ui);
  }
  setupTouch(ui) {
    const stick = ui.stick, knob = ui.knob; let moveId = null, lookId = null, mx0 = 0, my0 = 0, lx = 0, ly = 0;
    const R = () => Math.min(innerWidth, innerHeight) * 0.13;
    this.el.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'touch' || !this.enabled) return;
      this.isTouch = true; document.body.classList.add('touch');
      if (e.clientX < innerWidth * 0.45 && moveId === null) {
        moveId = e.pointerId; mx0 = e.clientX; my0 = e.clientY;
        stick.style.display = 'block'; stick.style.left = mx0 + 'px'; stick.style.top = my0 + 'px'; knob.style.transform = 'translate(-50%,-50%)';
      } else if (lookId === null) { lookId = e.pointerId; lx = e.clientX; ly = e.clientY; }
      try { this.el.setPointerCapture?.(e.pointerId); } catch (err) { }
    });
    this.el.addEventListener('pointermove', e => {
      if (e.pointerId === moveId) {
        let dx = e.clientX - mx0, dy = e.clientY - my0; const r = R(); const l = Math.hypot(dx, dy);
        if (l > r) { dx *= r / l; dy *= r / l; }
        this.touchMove.x = dx / r; this.touchMove.y = -dy / r;
        knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      } else if (e.pointerId === lookId) {
        this.lookDX += (e.clientX - lx) * 2.2 * this.touchSens / (devicePixelRatio > 2 ? 1.3 : 1); this.lookDY += (e.clientY - ly) * 2.2 * this.touchSens / (devicePixelRatio > 2 ? 1.3 : 1);
        lx = e.clientX; ly = e.clientY;
      }
    });
    const end = e => {
      if (e.pointerId === moveId) { moveId = null; this.touchMove.x = this.touchMove.y = 0; stick.style.display = 'none'; }
      if (e.pointerId === lookId) lookId = null;
    };
    this.el.addEventListener('pointerup', end); this.el.addEventListener('pointercancel', end);
    const btn = (b, on, off) => {
      b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); b.classList.add('down'); on(); });
      const up = e => { b.classList.remove('down'); off && off(); };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
    };
    btn(ui.jump, () => { this.touchJump = true; }, () => { this.touchJump = false; });
    if (ui.duck) btn(ui.duck, () => { this.touchDuck = !this.touchDuck; ui.duck.classList.toggle('on', this.touchDuck); });   // tap to toggle crouch
    // FIRE: hold to spray; drag the button to keep aiming while firing
    let fid = null, fx = 0, fy = 0;
    ui.fire.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); ui.fire.classList.add('down'); this.touchFire = true; fid = e.pointerId; fx = e.clientX; fy = e.clientY; try { ui.fire.setPointerCapture(e.pointerId); } catch (err) { } });
    ui.fire.addEventListener('pointermove', e => { if (e.pointerId !== fid) return; this.lookDX += (e.clientX - fx) * 2.2 * this.touchSens; this.lookDY += (e.clientY - fy) * 2.2 * this.touchSens; fx = e.clientX; fy = e.clientY; });
    const fup = e => { if (e.pointerId !== fid) return; fid = null; ui.fire.classList.remove('down'); this.touchFire = false; };
    ui.fire.addEventListener('pointerup', fup); ui.fire.addEventListener('pointercancel', fup);
    btn(ui.use, () => { this.touchUse = true; this.pressed.add('KeyE'); }, () => { this.touchUse = false; });
    btn(ui.view, () => this.pressed.add('KeyV'));
    btn(ui.menu, () => this.pressed.add('Escape'));
    if (ui.weap) btn(ui.weap, () => this.pressed.add('KeyQ'));
  }
  // returns a usercmd + look deltas (degrees)
  sample() {
    const k = this.keys; let f = 0, s = 0;
    if (k.has('KeyW') || k.has('ArrowUp')) f += 1; if (k.has('KeyS') || k.has('ArrowDown')) f -= 1;
    if (k.has('KeyD')) s += 1; if (k.has('KeyA')) s -= 1;
    let turn = 0; if (k.has('ArrowLeft')) turn -= 1; if (k.has('ArrowRight')) turn += 1;
    f += this.touchMove.y; s += this.touchMove.x;
    let jump = k.has('Space') || this.touchJump, use = false, walk = k.has('ShiftLeft') || k.has('ShiftRight');
    let crouch = k.has('KeyC') || !!this.touchDuck;
    let fire = !!(this.mouseFire || this.touchFire || k.has('ControlLeft') || k.has('ControlRight') || k.has('KeyF'));
    let ldx = this.lookDX * 0.15 * this.sens, ldy = this.lookDY * 0.15 * this.sens; this.lookDX = this.lookDY = 0;
    // gamepad (standard mapping): left stick move/strafe, right stick aim, RT or R3 fire, A jump, X use,
    // LB / D-pad left = previous weapon, RB / Y / D-pad right = next weapon, B / Back = view, LT = walk, Start = pause
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    this.padPrev = this.padPrev || {};
    for (const p of pads) {
      if (!p || !p.connected) continue;
      const B = n => !!(p.buttons[n] && (p.buttons[n].pressed || p.buttons[n].value > 0.35)), A = n => p.axes[n] || 0;
      const radial = (x, y, d) => { const m = Math.hypot(x, y); if (m < d) return [0, 0, 0]; const k = Math.min(1, (m - d) / (1 - d)); return [x / m * k, y / m * k, k]; };
      const [mx, my] = radial(A(0), A(1), 0.18); f -= my; s += mx;
      const [lx, ly, lm] = radial(A(2), A(3), 0.12);
      const curve = Math.pow(lm, 1.6) / (lm || 1); // gentle near the centre for fine aim, fast at full tilt
      ldx += lx * curve * 5.2 * this.sens; ldy += ly * curve * 3.6 * this.sens;
      if (B(0)) jump = true;
      if (B(7) || B(11)) fire = true;
      if (B(6)) walk = true;
      if (B(10)) crouch = true;
      const edge = (n, code) => { const on = B(n); if (on && !this.padPrev[n]) this.pressed.add(code); this.padPrev[n] = on; };
      edge(2, 'KeyE'); edge(1, 'KeyV'); edge(8, 'KeyV'); edge(9, 'Escape');
      edge(3, 'KeyQ'); edge(5, 'KeyQ'); edge(15, 'KeyQ'); edge(4, 'WheelUp'); edge(14, 'WheelUp');
      if (mx || my || lx || ly || p.buttons.some(b => b.pressed)) this.padActive = true;
    }
    if (this.padActive && !this.padShown) { this.padShown = true; document.body.classList.add('pad'); }
    ldx += turn * 2.5;
    if (this.pressed.has('KeyE')) use = true;
    return { forward: Math.max(-1, Math.min(1, f)), side: Math.max(-1, Math.min(1, s)), jump, use, walk, fire, crouch, dyaw: ldx, dpitch: this.invert ? -ldy : ldy };
  }
  consume(code) { const had = this.pressed.has(code); this.pressed.delete(code); return had; }
  clearPressed() { // also remember which pad buttons are already held, so a held START/A doesn't fire again on resume
    this.pressed.clear(); this.padPrev = {};
    for (const p of (navigator.getGamepads ? navigator.getGamepads() : [])) if (p && p.connected) p.buttons.forEach((b, n) => { if (b.pressed) this.padPrev[n] = true; });
  }
  rumble(weak, strong, ms) {
    for (const p of (navigator.getGamepads ? navigator.getGamepads() : [])) { const v = p && p.connected && p.vibrationActuator; if (v && v.playEffect) v.playEffect('dual-rumble', { duration: ms, weakMagnitude: weak, strongMagnitude: strong }).catch(() => { }); }
  }
}
