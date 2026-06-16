import { UI_DEPTH, GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export default class HUD {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    const d = UI_DEPTH;
    const sf = 0; // fixed to camera

    // ── Health Bar ──
    this.hpBg = scene.add.rectangle(12, GAME_HEIGHT - 20, 160, 14, 0x220000).setOrigin(0, 0.5).setScrollFactor(sf).setDepth(d);
    this.hpBar = scene.add.rectangle(12, GAME_HEIGHT - 20, 160, 14, 0xff2244).setOrigin(0, 0.5).setScrollFactor(sf).setDepth(d + 1);
    this.hpLabel = scene.add.text(12, GAME_HEIGHT - 34, 'HP', { fontSize: '10px', fill: '#ff2244' })
      .setScrollFactor(sf).setDepth(d + 1);
    this.hpText = scene.add.text(178, GAME_HEIGHT - 26, '100/100', { fontSize: '10px', fill: '#ffaaaa' })
      .setScrollFactor(sf).setDepth(d + 1).setOrigin(0, 0.5);

    // ── Level / XP ──
    this.levelText = scene.add.text(12, 10, 'LVL 1', { fontSize: '13px', fill: '#00ffee', fontStyle: 'bold' })
      .setScrollFactor(sf).setDepth(d);
    this.xpBg = scene.add.rectangle(12, 28, 120, 7, 0x002233).setOrigin(0, 0.5).setScrollFactor(sf).setDepth(d);
    this.xpBar = scene.add.rectangle(12, 28, 0, 7, 0xaa00ff).setOrigin(0, 0.5).setScrollFactor(sf).setDepth(d + 1);
    this.xpLabel = scene.add.text(138, 24, 'XP', { fontSize: '9px', fill: '#aa00ff' }).setScrollFactor(sf).setDepth(d + 1);

    // ── Gems ──
    this.gemIcon = scene.add.polygon(GAME_WIDTH - 24, 18, [8, 0, 14, 8, 8, 14, 2, 8], 0x00ffee)
      .setScrollFactor(sf).setDepth(d);
    this.gemText = scene.add.text(GAME_WIDTH - 40, 10, '0', { fontSize: '13px', fill: '#00ffee', fontStyle: 'bold' })
      .setScrollFactor(sf).setDepth(d).setOrigin(1, 0);

    // ── Level Indicator ──
    this.levelIndicator = scene.add.text(GAME_WIDTH / 2, 10, 'LEVEL 1', {
      fontSize: '12px', fill: '#ffffff88',
    }).setScrollFactor(sf).setDepth(d).setOrigin(0.5, 0);

    // ── Shield indicator ──
    this.shieldText = scene.add.text(200, GAME_HEIGHT - 26, '', { fontSize: '11px', fill: '#00ccff' })
      .setScrollFactor(sf).setDepth(d + 1).setOrigin(0, 0.5);

    // ── Glitch mastery indicator ──
    this.masteryText = scene.add.text(GAME_WIDTH / 2, 28, '', {
      fontSize: '11px', fill: '#00ffee', backgroundColor: '#00000066', padding: { x: 4, y: 2 },
    }).setScrollFactor(sf).setDepth(d + 2).setOrigin(0.5, 0).setAlpha(0);
  }

  update() {
    const p = this.player;
    const hpRatio = p.health / p.maxHealth;

    // Health bar
    this.hpBar.setDisplaySize(Math.round(160 * hpRatio), 14);
    this.hpBar.setFillStyle(hpRatio > 0.5 ? 0xff2244 : hpRatio > 0.25 ? 0xff8800 : 0xff0000);
    this.hpText.setText(`${p.health}/${p.maxHealth}`);

    // XP bar
    const { XP_BASE, XP_SCALE } = this._getXpConstants();
    const xpNeeded = XP_BASE + (p.level - 1) * XP_SCALE;
    const xpRatio = Math.min(p.xp / xpNeeded, 1);
    this.xpBar.setDisplaySize(Math.round(120 * xpRatio), 7);
    this.levelText.setText(`LVL ${p.level}`);

    // Gems
    this.gemText.setText(`${p.gems}`);

    // Level
    this.levelIndicator.setText(`LEVEL ${this.scene.currentLevel || 1}`);

    // Shield
    this.shieldText.setText(p.shield > 0 ? `SHIELD ×${p.shield}` : '');

    // Glitch mastery
    if (this.scene.glitchSystem?.masteryActive) {
      this.masteryText.setText('⚡ GLITCH MASTERY ACTIVE ⚡');
      this.masteryText.setAlpha(0.9 + Math.sin(Date.now() / 200) * 0.1);
    } else {
      this.masteryText.setAlpha(0);
    }
  }

  _getXpConstants() {
    return { XP_BASE: 100, XP_SCALE: 60 };
  }

  setLevel(level) {
    this.levelIndicator.setText(`LEVEL ${level}`);
  }

  destroy() {
    [this.hpBg, this.hpBar, this.hpLabel, this.hpText,
     this.levelText, this.xpBg, this.xpBar, this.xpLabel,
     this.gemIcon, this.gemText, this.levelIndicator,
     this.shieldText, this.masteryText].forEach(o => { if (o) o.destroy(); });
  }
}
