export default class CreditsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CreditsScene' });
  }

  create() {
    this.add.image(0, 0, 'bg').setOrigin(0);
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 80, 'NEON ASCENDED', {
        fontSize: '48px',
        fontFamily: 'monospace',
        color: '#ffd400'
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2, 'Thanks for playing!', {
        fontSize: '24px',
        fontFamily: 'monospace',
        color: '#33f5ff'
      })
      .setOrigin(0.5);

    const restartText = this.add
      .text(width / 2, height / 2 + 140, 'Press to Restart', {
        fontSize: '18px',
        fontFamily: 'monospace'
      })
      .setOrigin(0.5);

    this.input.once('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    this.tweens.add({
      targets: restartText,
      alpha: { from: 1, to: 0.5 },
      duration: 700,
      yoyo: true,
      repeat: -1
    });
  }
}
