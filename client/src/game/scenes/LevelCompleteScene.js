import { GAME_WIDTH, GAME_HEIGHT, STORY_BEATS } from '../constants.js';

export default class LevelCompleteScene extends Phaser.Scene {
  constructor() { super({ key: 'LevelCompleteScene' }); }

  init(data) {
    this.level = data.level || 1;
    this.nextLevel = data.nextLevel || 2;
    this.gems = data.gems || 0;
    this.passThrough = data;
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x030815);

    // Grid
    const g = this.add.graphics().setAlpha(0.07);
    g.lineStyle(1, 0x00ffee, 1);
    for (let x = 0; x < GAME_WIDTH; x += 60) g.lineBetween(x, 0, x, GAME_HEIGHT);
    for (let y = 0; y < GAME_HEIGHT; y += 60) g.lineBetween(0, y, GAME_WIDTH, y);

    // Header
    this.add.text(cx, 60, `LEVEL ${this.level} COMPLETE`, {
      fontSize: '30px', fill: '#00ffee', fontStyle: 'bold', letterSpacing: 6,
    }).setOrigin(0.5);

    this.add.rectangle(cx, 90, 400, 1, 0x00ffee, 0.3);

    // Story beat
    const story = STORY_BEATS[this.level] || '';
    if (story) {
      this.add.text(cx, cy - 60, `"${story}"`, {
        fontSize: '13px', fill: '#ffffff99', fontStyle: 'italic',
        align: 'center', wordWrap: { width: 560 },
      }).setOrigin(0.5);
    }

    // Stats
    this.add.text(cx, cy + 20, `GEMS COLLECTED: ${this.gems}`, {
      fontSize: '14px', fill: '#00ffee88',
    }).setOrigin(0.5);

    // Glitch unlocked (if applicable)
    const phase = Math.ceil(this.nextLevel / 10);
    const phaseNames = ['', 'NEON CANOPY', 'STEELWORKS', 'ARCADE WARD', 'CHROMATIC CITY', 'GILDED EXPANSE'];
    const nextBiome = this.level % 10 === 0 ? phaseNames[Math.ceil(this.nextLevel / 10)] : null;
    if (nextBiome) {
      this.add.text(cx, cy + 60, `ENTERING: ${nextBiome}`, {
        fontSize: '13px', fill: '#ffaa00',
      }).setOrigin(0.5);
    }

    // Next level prompt
    const nextText = this.add.text(cx, GAME_HEIGHT - 55, `NEXT: LEVEL ${this.nextLevel}`, {
      fontSize: '16px', fill: '#ffffff66',
    }).setOrigin(0.5);

    const continueText = this.add.text(cx, GAME_HEIGHT - 30, 'PRESS ANY KEY TO CONTINUE', {
      fontSize: '11px', fill: '#00ffee44', letterSpacing: 3,
    }).setOrigin(0.5);

    // Blink continue text
    this.tweens.add({ targets: continueText, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    // Auto-advance after 3s or key press
    const advance = () => {
      if (this._advanced) return;
      this._advanced = true;
      this.cameras.main.flash(300, 0, 255, 238, false);
      this.time.delayedCall(200, () => {
        this.scene.start('GameScene', {
          level: this.nextLevel,
          glitches: this.passThrough.glitches,
          playerData: this.passThrough.playerData,
        });
      });
    };

    this.input.keyboard.once('keydown', advance);
    this.input.once('pointerdown', advance);
    this.time.delayedCall(4000, advance);
  }
}
