import { UI_DEPTH, GAME_WIDTH } from '../constants.js';

export default class BossHealthBar {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    const d = UI_DEPTH + 5;
    const sf = 0;
    const cx = GAME_WIDTH / 2;

    this.bg = scene.add.rectangle(cx, 22, 400, 14, 0x220000, 0.9)
      .setScrollFactor(sf).setDepth(d).setAlpha(0);
    this.bar = scene.add.rectangle(cx - 200, 22, 400, 14, 0xff3300, 1)
      .setOrigin(0, 0.5).setScrollFactor(sf).setDepth(d + 1).setAlpha(0);
    this.nameText = scene.add.text(cx, 8, '', {
      fontSize: '13px', fill: '#ff3300', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5, 0).setScrollFactor(sf).setDepth(d + 2).setAlpha(0);
    this.phaseText = scene.add.text(cx, 38, '', {
      fontSize: '10px', fill: '#ffaa00', align: 'center',
    }).setOrigin(0.5, 0).setScrollFactor(sf).setDepth(d + 2).setAlpha(0);

    // Phase pips (up to 4)
    this.pips = [];
    for (let i = 0; i < 4; i++) {
      const pip = scene.add.circle(cx - 24 + i * 16, 48, 4, 0x333333)
        .setScrollFactor(sf).setDepth(d + 2).setAlpha(0);
      this.pips.push(pip);
    }

    scene.events.on('boss:spawned', this.show, this);
    scene.events.on('boss:healthUpdate', this.updateHealth, this);
    scene.events.on('boss:phaseChange', this.onPhaseChange, this);
    scene.events.on('boss:defeated', this.hide, this);
  }

  show({ name, maxHealth }) {
    this.visible = true;
    this.maxHealth = maxHealth;
    this.nameText.setText(name);
    [this.bg, this.bar, this.nameText, this.phaseText].forEach(o => {
      this.scene.tweens.add({ targets: o, alpha: 1, duration: 500 });
    });
    this.pips.forEach(p => this.scene.tweens.add({ targets: p, alpha: 1, duration: 500 }));
  }

  updateHealth({ health, maxHealth, phase, totalPhases }) {
    if (!this.visible) return;
    const ratio = Math.max(0, health / maxHealth);
    this.bar.setDisplaySize(Math.round(400 * ratio), 14);
    const color = ratio > 0.5 ? 0xff3300 : ratio > 0.25 ? 0xff8800 : 0xff0000;
    this.bar.setFillStyle(color);

    // Update pips
    for (let i = 0; i < this.pips.length; i++) {
      this.pips[i].setFillStyle(i < totalPhases ? (i < phase ? 0xff3300 : 0x333333) : 0x000000);
    }
  }

  onPhaseChange({ phase, name }) {
    this.phaseText.setText(name || `PHASE ${phase}`);
    this.scene.tweens.add({
      targets: this.phaseText,
      scaleX: 1.3, scaleY: 1.3, alpha: { from: 1, to: 0.6 },
      duration: 300, yoyo: true,
    });
  }

  hide() {
    this.visible = false;
    [this.bg, this.bar, this.nameText, this.phaseText, ...this.pips].forEach(o => {
      this.scene.tweens.add({ targets: o, alpha: 0, duration: 800 });
    });
  }

  destroy() {
    this.scene.events.off('boss:spawned', this.show, this);
    this.scene.events.off('boss:healthUpdate', this.updateHealth, this);
    this.scene.events.off('boss:phaseChange', this.onPhaseChange, this);
    this.scene.events.off('boss:defeated', this.hide, this);
    [this.bg, this.bar, this.nameText, this.phaseText, ...this.pips].forEach(o => o.destroy());
  }
}
