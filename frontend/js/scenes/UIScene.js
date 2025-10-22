import { api } from '../services/api.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    this.scene.launch('GameScene');
    this.scene.bringToTop();

    const muteKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    muteKey.on('down', () => this.toggleSound());

    this.createHUD();
  }

  createHUD() {
    const width = this.scale.width;

    const hudBackground = this.add.graphics();
    hudBackground.fillStyle(0x040015, 0.6);
    hudBackground.fillRect(0, 0, width, 48);

    this.levelText = this.add
      .text(16, 12, 'LEVEL 1', { fontSize: '20px', fontFamily: 'monospace', color: '#33f5ff' })
      .setShadow(1, 1, '#000', 2);

    this.gemText = this.add
      .text(200, 12, 'GEMS 0', { fontSize: '20px', fontFamily: 'monospace', color: '#ffd400' })
      .setShadow(1, 1, '#000', 2);

    this.soundToggle = this.add
      .text(width - 24, 12, this.game.globals.settings.soundEnabled ? '🔊' : '🔈', {
        fontSize: '20px'
      })
      .setInteractive({ useHandCursor: true })
      .setOrigin(1, 0)
      .on('pointerdown', () => this.toggleSound());

    this.registry.events.on('changedata', this.updateFromRegistry, this);
  }

  toggleSound() {
    const enabled = !this.game.globals.settings.soundEnabled;
    this.game.globals.settings.soundEnabled = enabled;
    this.sound.mute = !enabled;

    if (this.game.globals.music) {
      if (enabled && !this.game.globals.music.isPlaying) {
        this.game.globals.music.play();
      }
      if (!enabled && this.game.globals.music.isPlaying) {
        this.game.globals.music.stop();
      }
    }

    this.soundToggle.setText(enabled ? '🔊' : '🔈');
  }

  updateFromRegistry(parent, key, value) {
    if (key === 'level') {
      this.levelText.setText(`LEVEL ${value}`);
    }
    if (key === 'gems') {
      this.gemText.setText(`GEMS ${value}`);
    }
    if (key === 'playerState' && value === 'levelComplete') {
      this.submitScore();
    }
  }

  async submitScore() {
    const player = this.registry.get('player');
    const auth = this.registry.get('auth');
    if (!player || !auth) return;

    try {
      await api.submitScore({
        username: auth.user.username,
        score: player.score,
        level: this.registry.get('level')
      });
    } catch (error) {
      console.error('Failed to submit score', error);
    }
  }
}
