import { GAME_WIDTH, GAME_HEIGHT, UI_DEPTH } from '../constants.js';

// Touch button zones are in game-space coordinates (0–960, 0–540).
// Phaser's scale manager translates pointer.x/y to game space automatically.

const BTN_ALPHA = 0.42;
const BTN_ALPHA_PRESSED = 0.78;

export default class MobileControls {
  constructor(scene) {
    this.scene = scene;
    this.enabled = scene.sys.game.device.input.touch;

    // Held-state flags
    this.left = false;
    this.right = false;

    // One-shot flags (cleared after getInput() reads them)
    this._jumpJust = false;
    this._attackJust = false;

    // Map pointerId → button key
    this._activePointers = new Map();
    this._visuals = [];

    if (!this.enabled) return;

    // Allow up to 5 simultaneous touches (left + jump + right + attack + glitch)
    scene.input.addPointer(4);

    this._defineButtons();
    this._buildVisuals();
    this._setupPointers();
  }

  _defineButtons() {
    // LEFT cluster: x 0–240, sits left of the GlitchCooldownUI (which starts ~x=250)
    // RIGHT cluster: x 720–960, sits right of the GlitchCooldownUI (ends ~x=710)

    const B = GAME_HEIGHT; // 540

    this.buttons = [
      // ── Movement ──────────────────────────────────────────────
      {
        key: 'left',
        x: 8,   y: B - 52, w: 72, h: 46,
        label: '◄', labelSize: '18px', color: 0x001a2a,
      },
      {
        key: 'jump',
        x: 84,  y: B - 95, w: 72, h: 88,
        label: '▲\nJUMP', labelSize: '12px', color: 0x001a2a,
      },
      {
        key: 'right',
        x: 160, y: B - 52, w: 72, h: 46,
        label: '►', labelSize: '18px', color: 0x001a2a,
      },

      // ── Glitch slots ──────────────────────────────────────────
      {
        key: 'g0',
        x: 722, y: B - 90, w: 74, h: 40,
        label: 'Z\nGLITCH 1', labelSize: '9px', color: 0x000e1a,
      },
      {
        key: 'g1',
        x: 800, y: B - 90, w: 74, h: 40,
        label: 'C\nGLITCH 2', labelSize: '9px', color: 0x000e1a,
      },
      {
        key: 'g2',
        x: 878, y: B - 90, w: 74, h: 40,
        label: 'V\nGLITCH 3', labelSize: '9px', color: 0x000e1a,
      },

      // ── Attack ────────────────────────────────────────────────
      {
        key: 'attack',
        x: 722, y: B - 46, w: 230, h: 42,
        label: '⚔  ATTACK', labelSize: '13px', color: 0x1a0022,
      },
    ];
  }

  _buildVisuals() {
    const d = UI_DEPTH - 2; // just under HUD
    const sf = 0;

    for (const btn of this.buttons) {
      const cx = btn.x + btn.w / 2;
      const cy = btn.y + btn.h / 2;

      const bg = this.scene.add.rectangle(cx, cy, btn.w, btn.h, btn.color, BTN_ALPHA)
        .setScrollFactor(sf).setDepth(d)
        .setStrokeStyle(1, btn.key === 'attack' ? 0xff00cc : 0x00ffee, 0.55);

      const lbl = this.scene.add.text(cx, cy, btn.label, {
        fontSize: btn.labelSize || '12px',
        fill: btn.key === 'attack' ? '#ff88ee' : '#00ffee',
        align: 'center',
        lineSpacing: 2,
      }).setOrigin(0.5).setScrollFactor(sf).setDepth(d + 1).setAlpha(0.85);

      btn._bg = bg;
      btn._lbl = lbl;
      this._visuals.push(bg, lbl);
    }
  }

  _setupPointers() {
    this.scene.input.on('pointerdown',     this._onDown,   this);
    this.scene.input.on('pointermove',     this._onMove,   this);
    this.scene.input.on('pointerup',       this._onUp,     this);
    this.scene.input.on('pointerupoutside', this._onUp,    this);
  }

  _onDown(pointer) {
    const key = this._hit(pointer.x, pointer.y);
    if (!key) return;
    this._activePointers.set(pointer.id, key);
    this._press(key);
  }

  _onMove(pointer) {
    if (!pointer.isDown) return;
    const prev = this._activePointers.get(pointer.id);
    const next = this._hit(pointer.x, pointer.y);
    if (next === prev) return;
    if (prev) this._release(prev);
    if (next) {
      this._activePointers.set(pointer.id, next);
      this._press(next);
    } else {
      this._activePointers.delete(pointer.id);
    }
  }

  _onUp(pointer) {
    const key = this._activePointers.get(pointer.id);
    if (!key) return;
    this._release(key);
    this._activePointers.delete(pointer.id);
  }

  _hit(px, py) {
    for (const btn of this.buttons) {
      if (px >= btn.x && px <= btn.x + btn.w &&
          py >= btn.y && py <= btn.y + btn.h) {
        return btn.key;
      }
    }
    return null;
  }

  _press(key) {
    switch (key) {
      case 'left':   this.left = true;        break;
      case 'right':  this.right = true;       break;
      case 'jump':   this._jumpJust = true;   break;
      case 'attack': this._attackJust = true; break;
      case 'g0': this.scene.glitchSystem?.activateSlot(0); break;
      case 'g1': this.scene.glitchSystem?.activateSlot(1); break;
      case 'g2': this.scene.glitchSystem?.activateSlot(2); break;
    }
    const btn = this.buttons.find(b => b.key === key);
    if (btn?._bg) {
      btn._bg.setAlpha(BTN_ALPHA_PRESSED);
      btn._bg.setStrokeStyle(2, 0xffffff, 0.9);
    }
  }

  _release(key) {
    if (key === 'left')  this.left  = false;
    if (key === 'right') this.right = false;
    const btn = this.buttons.find(b => b.key === key);
    if (btn?._bg) {
      btn._bg.setAlpha(BTN_ALPHA);
      btn._bg.setStrokeStyle(1, btn.key === 'attack' ? 0xff00cc : 0x00ffee, 0.55);
    }
  }

  // Called every frame by the scene — merges with keyboard input
  getInput() {
    const jump   = this._jumpJust;
    const attack = this._attackJust;
    this._jumpJust   = false;
    this._attackJust = false;
    return {
      left:             this.left,
      right:            this.right,
      jumpJustPressed:  jump,
      attackJustPressed: attack,
    };
  }

  // Update cooldown tints on glitch buttons each frame
  updateGlitchState(glitchSystem) {
    if (!glitchSystem) return;
    const glitchKeys = ['g0', 'g1', 'g2'];
    glitchKeys.forEach((key, i) => {
      const data = glitchSystem.getBaseSlotData(i);
      const btn  = this.buttons.find(b => b.key === key);
      if (!btn) return;
      if (data && data.remaining > 0) {
        btn._bg?.setAlpha(0.25);
        btn._lbl?.setText(`${data.name.substring(0, 6)}\n${data.remaining.toFixed(1)}s`);
        btn._lbl?.setStyle({ fill: '#888888' });
      } else {
        btn._bg?.setAlpha(BTN_ALPHA);
        btn._lbl?.setText(
          key === 'g0' ? 'Z\nGLITCH 1' :
          key === 'g1' ? 'C\nGLITCH 2' : 'V\nGLITCH 3'
        );
        btn._lbl?.setStyle({ fill: '#00ffee' });
      }
    });
  }

  destroy() {
    if (!this.enabled) return;
    this.scene.input.off('pointerdown',      this._onDown, this);
    this.scene.input.off('pointermove',      this._onMove, this);
    this.scene.input.off('pointerup',        this._onUp,   this);
    this.scene.input.off('pointerupoutside', this._onUp,   this);
    this._visuals.forEach(v => v?.destroy());
  }
}
