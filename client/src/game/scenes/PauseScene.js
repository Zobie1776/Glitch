import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import SaveSystem from '../systems/SaveSystem.js';

export default class PauseScene extends Phaser.Scene {
  constructor() { super({ key: 'PauseScene' }); }

  init(data) {
    this.gameLevel = data?.level || 1;
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Semi-transparent overlay
    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75).setDepth(0);

    // Panel
    this.add.rectangle(cx, cy, 280, 240, 0x0a0a1a, 0.95).setDepth(1).setStrokeStyle(1, 0x00ffee, 0.4);

    // Title
    this.add.text(cx, cy - 100, 'PAUSED', {
      fontSize: '24px', fill: '#00ffee', fontStyle: 'bold', letterSpacing: 8,
    }).setOrigin(0.5).setDepth(2);

    this.add.rectangle(cx, cy - 78, 200, 1, 0x00ffee, 0.3).setDepth(2);

    const saveSystem = new SaveSystem();

    const buttons = [
      { label: 'RESUME', color: 0x00ffee, action: () => this._resume() },
      { label: 'RESTART LEVEL', color: 0xffaa00, action: () => this._restartLevel() },
      { label: 'SAVE GAME', color: 0x88aaff, action: () => { const gs = this.scene.get('GameScene'); if (gs) saveSystem.saveGame(gs); } },
      { label: 'MAIN MENU', color: 0xff4444, action: () => { this.scene.stop('GameScene'); this.scene.start('MainMenuScene'); } },
    ];

    buttons.forEach((b, i) => {
      const y = cy - 50 + i * 46;
      const btn = this.add.text(cx, y, `[ ${b.label} ]`, {
        fontSize: '15px', fill: `#${b.color.toString(16).padStart(6, '0')}`,
        padding: { x: 12, y: 6 },
      }).setOrigin(0.5).setDepth(2).setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setStyle({ fill: '#ffffff', backgroundColor: '#ffffff11' }));
      btn.on('pointerout', () => btn.setStyle({ fill: `#${b.color.toString(16).padStart(6, '0')}`, backgroundColor: undefined }));
      btn.on('pointerdown', b.action);
    });

    // Controls info
    this.add.text(cx, cy + 104, 'ESC — Resume', {
      fontSize: '9px', fill: '#ffffff33',
    }).setOrigin(0.5).setDepth(2);

    // ESC to resume
    this.input.keyboard.once('keydown-ESC', () => this._resume());
  }

  _resume() {
    this.scene.resume('GameScene');
    this.scene.stop();
  }

  _restartLevel() {
    this.scene.stop('GameScene');
    this.scene.start('GameScene', { level: this.gameLevel });
    this.scene.stop();
  }
}
