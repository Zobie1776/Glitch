import { AUDIO_DATA } from '../assets/audioData.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.load.audio('soundtrack', AUDIO_DATA.soundtrack);
    this.load.audio('jump', AUDIO_DATA.jump);
  }

  create() {
    this.generateTextures();

    const soundtrack = this.sound.add('soundtrack', {
      loop: true,
      volume: 0.25
    });
    if (!this.game.globals.music && this.game.globals.settings.soundEnabled) {
      soundtrack.play();
      this.game.globals.music = soundtrack;
    }

    this.scene.start('MenuScene');
  }

  generateTextures() {
    const platform = this.textures.createCanvas('platform', 96, 24);
    const ctx = platform.getContext();
    ctx.fillStyle = '#120c2c';
    ctx.fillRect(0, 0, 96, 24);
    const gradient = ctx.createLinearGradient(0, 0, 96, 0);
    gradient.addColorStop(0, '#2affff');
    gradient.addColorStop(0.5, '#ff00aa');
    gradient.addColorStop(1, '#ffd400');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 4, 96, 16);
    platform.refresh();

    const bg = this.textures.createCanvas('bg', 960, 540);
    const bgCtx = bg.getContext();
    const bgGradient = bgCtx.createLinearGradient(0, 0, 0, 540);
    bgGradient.addColorStop(0, '#060014');
    bgGradient.addColorStop(1, '#11002b');
    bgCtx.fillStyle = bgGradient;
    bgCtx.fillRect(0, 0, 960, 540);
    for (let i = 0; i < 200; i += 1) {
      const x = Math.random() * 960;
      const y = Math.random() * 540;
      const size = Math.random() * 4 + 1;
      bgCtx.fillStyle = Math.random() > 0.5 ? '#33f5ff' : '#ff00aa';
      bgCtx.fillRect(x, y, size, size);
    }
    bg.refresh();

    const player = this.textures.createCanvas('player', 96, 32);
    const pCtx = player.getContext();
    pCtx.fillStyle = '#0c0018';
    pCtx.fillRect(0, 0, 96, 32);
    const colors = ['#33f5ff', '#ff00aa', '#ffd400'];
    colors.forEach((color, index) => {
      pCtx.fillStyle = color;
      pCtx.fillRect(index * 32 + 8, 8, 16, 16);
      pCtx.fillRect(index * 32 + 16, 12, 8, 12);
    });
    player.refresh();
  }
}
