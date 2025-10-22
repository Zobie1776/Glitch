export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.add.image(0, 0, 'bg').setOrigin(0);
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 80, 'GLITCH//RIFT', {
        fontSize: '48px',
        fontFamily: 'monospace',
        color: '#33f5ff'
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2, 'The Neon Ascension', {
        fontSize: '24px',
        fontFamily: 'monospace',
        color: '#ff00aa'
      })
      .setOrigin(0.5);

    const startText = this.add
      .text(width / 2, height / 2 + 120, 'Tap / Press to Jack In', {
        fontSize: '20px',
        fontFamily: 'monospace',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: { from: 1, to: 0.4 },
      yoyo: true,
      repeat: -1,
      duration: 800
    });

    this.input.once('pointerdown', () => this.scene.start('UIScene'));
  }
}
