import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import SaveSystem from '../systems/SaveSystem.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MainMenuScene' }); }

  create() {
    this.saveSystem = new SaveSystem();
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Background
    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x05030a);
    this._drawGrid();

    // Title with glitch effect
    this.titleText = this.add.text(cx, cy - 140, 'GLITCH//RIFT', {
      fontSize: '48px', fill: '#00ffee', fontStyle: 'bold', letterSpacing: 10,
    }).setOrigin(0.5);

    this.add.text(cx, cy - 100, 'SURVIVE THE COLLAPSE', {
      fontSize: '13px', fill: '#ffffff55', letterSpacing: 5,
    }).setOrigin(0.5);

    // Decorative divider
    this.add.rectangle(cx, cy - 80, 300, 1, 0x00ffee, 0.3);

    // Buttons
    const hasSave = this.saveSystem.hasSave();
    const saveData = hasSave ? this.saveSystem.load() : null;

    const buttons = [];

    if (hasSave) {
      const continueBtn = this._makeButton(cx, cy - 20, `CONTINUE (LEVEL ${saveData?.level || 1})`, 0x00ffee);
      continueBtn.on('pointerdown', () => {
        this.scene.start('GameScene', { level: saveData?.level || 1, fromSave: true });
      });
      buttons.push(continueBtn);
    }

    const newBtn = this._makeButton(cx, hasSave ? cy + 30 : cy - 20, hasSave ? 'NEW GAME' : 'PLAY', 0x00ffee);
    newBtn.on('pointerdown', () => {
      if (hasSave) this.saveSystem.clearSave();
      this.scene.start('GameScene', { level: 1 });
    });
    buttons.push(newBtn);

    const settingsBtn = this._makeButton(cx, hasSave ? cy + 80 : cy + 30, 'SETTINGS', 0x888888);
    settingsBtn.on('pointerdown', () => this._showSettings());
    buttons.push(settingsBtn);

    // Version
    this.add.text(GAME_WIDTH - 8, GAME_HEIGHT - 8, 'v0.1.0 PROTOTYPE', {
      fontSize: '9px', fill: '#ffffff33',
    }).setOrigin(1, 1);

    // Subtitle story
    this.add.text(cx, GAME_HEIGHT - 30, '"The Rift is collapsing. Weaponize the glitch."', {
      fontSize: '10px', fill: '#ffffff44', fontStyle: 'italic',
    }).setOrigin(0.5);

    // Glitch animation on title
    this._startTitleGlitch();

    // Scanlines
    this._addScanlines();
  }

  _makeButton(x, y, label, color) {
    const btn = this.add.text(x, y, `[ ${label} ]`, {
      fontSize: '18px', fill: `#${color.toString(16).padStart(6, '0')}`,
      backgroundColor: '#00000000', padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      btn.setStyle({ fill: '#ffffff', backgroundColor: '#00ffee22' });
      this.cameras.main.shake(50, 0.003);
    });
    btn.on('pointerout', () => {
      btn.setStyle({ fill: `#${color.toString(16).padStart(6, '0')}`, backgroundColor: '#00000000' });
    });
    return btn;
  }

  _drawGrid() {
    const g = this.add.graphics().setAlpha(0.06);
    g.lineStyle(1, 0x00ffee, 1);
    for (let x = 0; x < GAME_WIDTH; x += 60) g.lineBetween(x, 0, x, GAME_HEIGHT);
    for (let y = 0; y < GAME_HEIGHT; y += 60) g.lineBetween(0, y, GAME_WIDTH, y);
  }

  _addScanlines() {
    const g = this.add.graphics().setAlpha(0.04).setDepth(200);
    g.fillStyle(0x000000, 1);
    for (let y = 0; y < GAME_HEIGHT; y += 4) g.fillRect(0, y, GAME_WIDTH, 2);
  }

  _startTitleGlitch() {
    const original = 'GLITCH//RIFT';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef0123456789@#$%';
    this.time.addEvent({
      delay: 2800, repeat: -1,
      callback: () => {
        // Brief scramble
        let scrambles = 0;
        const scramble = this.time.addEvent({
          delay: 60, repeat: 5,
          callback: () => {
            const arr = original.split('');
            const idx = Phaser.Math.Between(0, arr.length - 1);
            arr[idx] = Phaser.Utils.Array.GetRandom(chars.split(''));
            this.titleText.setText(arr.join(''));
          },
        });
        this.time.delayedCall(420, () => this.titleText.setText(original));
      },
    });
  }

  _showSettings() {
    // Simple settings overlay
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85).setDepth(150).setInteractive();
    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 340, 220, 0x0a0a1a, 1).setDepth(151).setStrokeStyle(1, 0x00ffee, 0.5);
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 90, 'SETTINGS', { fontSize: '16px', fill: '#00ffee', fontStyle: 'bold' }).setOrigin(0.5).setDepth(152);
    const info = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'Controls:\n← / → or A/D — Move\nSPACE — Jump (Double Jump)\nSHIFT — Melee Attack\nZ — Glitch Slot 1\nC — Glitch Slot 2\nV — Glitch Slot 3\nESC — Pause', {
      fontSize: '11px', fill: '#ffffff', align: 'center', lineSpacing: 4,
    }).setOrigin(0.5).setDepth(152);
    const closeBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 90, '[ CLOSE ]', { fontSize: '14px', fill: '#ff4444' })
      .setOrigin(0.5).setDepth(152).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      [overlay, panel, title, info, closeBtn].forEach(o => o.destroy());
    });
    overlay.on('pointerdown', () => {
      [overlay, panel, title, info, closeBtn].forEach(o => o.destroy());
    });
  }
}
