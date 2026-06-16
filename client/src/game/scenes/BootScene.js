// Creates all placeholder textures via Phaser Graphics — no external assets needed

export default class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  create() {
    this._makeRect('player',           24, 36, 0x00ccbb, 0x00ffee, 0x005544);
    this._makeRect('enemy_chaser',     20, 28, 0xcc3366, 0xff66aa, 0x440011);
    this._makeRect('enemy_attacker',   22, 30, 0x8833cc, 0xb565f0, 0x220044);
    this._makeRect('enemy_fast',       18, 24, 0xaa22ee, 0xee44ff, 0x330044);
    this._makeRect('enemy_heavy',      32, 38, 0x991144, 0xcc2266, 0x330011);
    this._makeRect('enemy_teleporter', 20, 28, 0xcc66bb, 0xff88ee, 0x440033);
    this._makeRect('boss',             48, 56, 0xcc2200, 0xff3300, 0x440000);
    this._makePlatform('platform',     64, 16);
    this._makePortalLocked('portal_locked', 32, 48);
    this._makePortalActive('portal_active', 32, 48);
    this._makeProjectile('projectile_player', 12, 6, 0x00ffee);
    this._makeProjectile('projectile_enemy',  10, 6, 0xff2266);
    this._makePixel('particle', 4, 4, 0xffffff);
    this._makePixel('pickup_gem', 8, 8, 0x00ffee);
    this._makePixel('pickup_xp',  8, 8, 0xaa00ff);

    this.scene.start('PreloadScene');
  }

  _makeRect(key, w, h, bodyColor, glowColor, shadowColor) {
    const rt = this.add.renderTexture(0, 0, w, h);
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Shadow
    g.fillStyle(shadowColor || 0x000000, 1);
    g.fillRect(2, 4, w - 4, h - 4);
    // Body
    g.fillStyle(bodyColor, 1);
    g.fillRect(0, 0, w - 2, h - 3);
    // Top glow line
    g.fillStyle(glowColor, 1);
    g.fillRect(1, 0, w - 4, 2);
    // Side accent
    g.fillStyle(glowColor, 0.4);
    g.fillRect(0, 2, 2, h - 5);
    // "Eyes" — two small bright dots
    if (h > 20) {
      g.fillStyle(glowColor, 1);
      g.fillRect(4, Math.floor(h * 0.3), 3, 3);
      g.fillRect(w - 8, Math.floor(h * 0.3), 3, 3);
    }

    rt.draw(g, 0, 0);
    g.destroy();
    rt.saveTexture(key);
    rt.destroy();
  }

  _makePlatform(key, w, h) {
    const rt = this.add.renderTexture(0, 0, w, h);
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x1a2a3a, 1);
    g.fillRect(0, 0, w, h);
    // Top highlight
    g.fillStyle(0x00ffee, 0.35);
    g.fillRect(0, 0, w, 3);
    // Grid pattern
    g.lineStyle(1, 0x004455, 0.3);
    for (let x = 0; x < w; x += 16) g.lineBetween(x, 0, x, h);
    rt.draw(g, 0, 0);
    g.destroy();
    rt.saveTexture(key);
    rt.destroy();
  }

  _makePortalLocked(key, w, h) {
    const rt = this.add.renderTexture(0, 0, w, h);
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x111122, 1);
    g.fillRoundedRect(2, 2, w - 4, h - 4, 6);
    g.lineStyle(2, 0x334466, 1);
    g.strokeRoundedRect(2, 2, w - 4, h - 4, 6);
    // X mark
    g.lineStyle(2, 0x445577, 1);
    g.lineBetween(8, 12, w - 8, h - 12);
    g.lineBetween(w - 8, 12, 8, h - 12);
    rt.draw(g, 0, 0);
    g.destroy();
    rt.saveTexture(key);
    rt.destroy();
  }

  _makePortalActive(key, w, h) {
    const rt = this.add.renderTexture(0, 0, w, h);
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // Outer glow
    g.fillStyle(0x003344, 1);
    g.fillRoundedRect(0, 0, w, h, 8);
    // Inner portal
    g.fillStyle(0x00ffee, 0.7);
    g.fillRoundedRect(4, 4, w - 8, h - 8, 6);
    // Arrow up
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(w / 2, 8, w / 2 - 8, h - 10, w / 2 + 8, h - 10);
    rt.draw(g, 0, 0);
    g.destroy();
    rt.saveTexture(key);
    rt.destroy();
  }

  _makeProjectile(key, w, h, color) {
    const rt = this.add.renderTexture(0, 0, w, h);
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(color, 1);
    g.fillEllipse(w / 2, h / 2, w, h);
    // Inner bright core
    g.fillStyle(0xffffff, 0.6);
    g.fillEllipse(w / 2, h / 2, Math.floor(w * 0.5), Math.floor(h * 0.5));
    rt.draw(g, 0, 0);
    g.destroy();
    rt.saveTexture(key);
    rt.destroy();
  }

  _makePixel(key, w, h, color) {
    const rt = this.add.renderTexture(0, 0, w, h);
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(color, 1);
    g.fillRect(0, 0, w, h);
    rt.draw(g, 0, 0);
    g.destroy();
    rt.saveTexture(key);
    rt.destroy();
  }
}
