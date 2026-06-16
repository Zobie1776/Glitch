import { UI_DEPTH, GAME_WIDTH, GAME_HEIGHT, BASE_GLITCH_SLOTS, SPECIAL_GLITCH_SLOTS } from '../constants.js';

const SLOT_SIZE = 42;
const SLOT_GAP = 4;
const BASE_KEYS = ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Q', 'E', 'R'];

export default class GlitchCooldownUI {
  constructor(scene, glitchSystem) {
    this.scene = scene;
    this.glitchSystem = glitchSystem;
    this.baseSlotUIs = [];
    this.specialSlotUIs = [];
    this._build();
  }

  _build() {
    const sf = 0;
    const d = UI_DEPTH;
    const totalBaseW = BASE_GLITCH_SLOTS * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;
    const startX = (GAME_WIDTH - totalBaseW) / 2;
    const baseY = GAME_HEIGHT - 60;

    // Label
    this.scene.add.text(startX, baseY - 16, 'GLITCHES', { fontSize: '9px', fill: '#00ffee88' })
      .setScrollFactor(sf).setDepth(d);

    // Base slots (10)
    for (let i = 0; i < BASE_GLITCH_SLOTS; i++) {
      const x = startX + i * (SLOT_SIZE + SLOT_GAP);
      const slot = this._buildSlot(x, baseY, sf, d, BASE_KEYS[i] || `${i}`);
      this.baseSlotUIs.push(slot);
    }

    // Special slots (5) — row above
    const totalSpecW = SPECIAL_GLITCH_SLOTS * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;
    const specStartX = startX + totalBaseW - totalSpecW;
    const specY = baseY - SLOT_SIZE - SLOT_GAP - 18;

    this.scene.add.text(specStartX, specY - 14, 'SPECIAL', { fontSize: '9px', fill: '#ff88ee88' })
      .setScrollFactor(sf).setDepth(d);

    for (let i = 0; i < SPECIAL_GLITCH_SLOTS; i++) {
      const x = specStartX + i * (SLOT_SIZE + SLOT_GAP);
      const slot = this._buildSlot(x, specY, sf, d, `F${i + 1}`, true);
      this.specialSlotUIs.push(slot);
    }
  }

  _buildSlot(x, y, sf, d, keyLabel, isSpecial = false) {
    const bg = this.scene.add.rectangle(x, y, SLOT_SIZE, SLOT_SIZE, isSpecial ? 0x220033 : 0x002233, 0.9)
      .setOrigin(0).setScrollFactor(sf).setDepth(d);

    const border = this.scene.add.rectangle(x, y, SLOT_SIZE, SLOT_SIZE, isSpecial ? 0x660066 : 0x004466)
      .setOrigin(0).setScrollFactor(sf).setDepth(d + 1).setFillStyle(null).setStrokeStyle(1, isSpecial ? 0xff88ee : 0x00ffee, 0.5);

    const cdOverlay = this.scene.add.rectangle(x, y, SLOT_SIZE, SLOT_SIZE, 0x000000, 0.6)
      .setOrigin(0).setScrollFactor(sf).setDepth(d + 2).setAlpha(0);

    const nameText = this.scene.add.text(x + SLOT_SIZE / 2, y + SLOT_SIZE / 2 - 6, '—', {
      fontSize: '8px', fill: '#ffffff88', align: 'center', wordWrap: { width: SLOT_SIZE - 4 },
    }).setOrigin(0.5).setScrollFactor(sf).setDepth(d + 3);

    const cdText = this.scene.add.text(x + SLOT_SIZE / 2, y + SLOT_SIZE / 2 + 6, '', {
      fontSize: '10px', fill: '#ff4444', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5).setScrollFactor(sf).setDepth(d + 3);

    const keyText = this.scene.add.text(x + 3, y + 2, keyLabel, {
      fontSize: '8px', fill: '#ffffff55',
    }).setScrollFactor(sf).setDepth(d + 3);

    const tierDot = this.scene.add.circle(x + SLOT_SIZE - 6, y + SLOT_SIZE - 6, 4, 0x00ff88)
      .setScrollFactor(sf).setDepth(d + 3).setAlpha(0);

    return { bg, border, cdOverlay, nameText, cdText, keyText, tierDot };
  }

  update() {
    // Update base slots
    for (let i = 0; i < BASE_GLITCH_SLOTS; i++) {
      const data = this.glitchSystem.getBaseSlotData(i);
      this._updateSlot(this.baseSlotUIs[i], data);
    }
    // Update special slots
    for (let i = 0; i < SPECIAL_GLITCH_SLOTS; i++) {
      const data = this.glitchSystem.getSpecialSlotData(i);
      this._updateSlot(this.specialSlotUIs[i], data, true);
    }
  }

  _updateSlot(slot, data, isSpecial = false) {
    if (!data) {
      slot.nameText.setText('—');
      slot.cdText.setText('');
      slot.cdOverlay.setAlpha(0);
      slot.tierDot.setAlpha(0);
      slot.border.setStrokeStyle(1, isSpecial ? 0xff88ee : 0x00ffee, 0.3);
      return;
    }

    // Name (abbreviated)
    const name = data.name.length > 8 ? data.name.substring(0, 7) + '…' : data.name;
    slot.nameText.setText(name);

    // Cooldown
    if (data.remaining > 0) {
      slot.cdOverlay.setAlpha(0.65);
      slot.cdText.setText(data.remaining.toFixed(1));
      slot.border.setStrokeStyle(1, 0x444444, 0.4);
    } else {
      slot.cdOverlay.setAlpha(0);
      slot.cdText.setText('');
      slot.border.setStrokeStyle(1, isSpecial ? 0xff88ee : 0x00ffee, 0.8);
    }

    // Tier dot
    const tierColors = [0x00ff44, 0xffaa00, 0xff0088];
    slot.tierDot.setAlpha(0.9);
    slot.tierDot.setFillStyle(tierColors[data.tier - 1] || 0x00ff44);
  }

  destroy() {
    [...this.baseSlotUIs, ...this.specialSlotUIs].forEach(slot => {
      Object.values(slot).forEach(obj => { if (obj && obj.destroy) obj.destroy(); });
    });
  }
}
