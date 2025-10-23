import { GLITCH_CONFIG } from '../data/glitchConfig.js';
import { emitHudUpdate } from '../events.js';

export default class GlitchManager {
  constructor(scene, config = GLITCH_CONFIG) {
    this.scene = scene;
    this.config = config;
    this.baselineTimer = 0;
    this.activeSkillKey = null;
    this.skills = new Map();
    this.overlay = null;
    this.isControlsInverted = false;
  }

  update(deltaSeconds) {
    this.baselineTimer += deltaSeconds;
    if (this.baselineTimer >= this.config.baseline.interval) {
      this.triggerBaseline();
      this.baselineTimer = 0;
    }

    this.skills.forEach((skill) => {
      skill.remaining = Math.max(0, skill.remaining - deltaSeconds);
    });

    const skill = this.getActiveSkill();
    emitHudUpdate({
      glitchSkill: skill
        ? { name: skill.name, cooldown: skill.cooldown, remaining: skill.remaining }
        : { name: 'None', cooldown: 0, remaining: 0 }
    });
  }

  getActiveSkill() {
    if (!this.activeSkillKey) return null;
    return this.skills.get(this.activeSkillKey) ?? null;
  }

  unlockSkill(key) {
    const skillConfig = this.config.skills[key];
    if (!skillConfig) return null;
    const skill = { ...skillConfig, remaining: 0 };
    this.skills.set(key, skill);
    this.activeSkillKey = key;
    emitHudUpdate({ glitchSkill: { name: skill.name, cooldown: skill.cooldown, remaining: 0 } });
    return skill;
  }

  triggerBaseline() {
    this.scene.cameras.main.shake(this.config.baseline.cameraShake.duration, this.config.baseline.cameraShake.intensity);
    this.scene.sound?.play?.('sfx_glitch');
    this.applyInvertControls();
    this.createOverlay();
  }

  applyInvertControls() {
    this.isControlsInverted = true;
    this.scene.controlsInverted = true;
    this.scene.time.delayedCall(this.config.baseline.invertDuration * 1000, () => {
      this.isControlsInverted = false;
      this.scene.controlsInverted = false;
      this.removeOverlay();
    });
  }

  createOverlay() {
    if (this.overlay) {
      this.overlay.destroy();
    }
    this.overlay = this.scene.add.rectangle(0, 0, this.scene.scale.width, this.scene.scale.height, 0xff2bff, 0.18)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(30);
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: { from: 0.26, to: 0 },
      duration: 620,
      ease: 'Sine.easeOut',
      onComplete: () => this.removeOverlay()
    });
  }

  removeOverlay() {
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
    }
  }

  useActiveSkill() {
    const skill = this.getActiveSkill();
    if (!skill || skill.remaining > 0) return false;
    skill.remaining = skill.cooldown;
    this.scene.handleGlitchSkill(skill);
    emitHudUpdate({ glitchSkill: { name: skill.name, cooldown: skill.cooldown, remaining: skill.remaining } });
    return true;
  }
}
