import Enemy, { EnemyState } from "./Enemy.js";

export default class Boss extends Enemy {
  constructor({
    name = "Cipher Sovereign",
    phases = [],
    glitchSkillDrop = { id: "riftNova", cooldown: 12 },
    introCinematic = null,
    ...enemyOptions
  } = {}) {
    const resolvedPhases = phases.length ? phases : Boss.createDefaultPhases(enemyOptions);
    const initialPhase = resolvedPhases[0] ?? {};
    super({
      ...enemyOptions,
      attackDamage: initialPhase.attackDamage ?? enemyOptions.attackDamage,
      attackCooldown: initialPhase.attackCooldown ?? enemyOptions.attackCooldown,
      attackRange: initialPhase.attackRange ?? enemyOptions.attackRange,
      projectileAttack: initialPhase.projectileAttack ?? enemyOptions.projectileAttack,
    });

    this.name = name;
    this.phases = [...resolvedPhases].sort((a, b) => (b.threshold ?? 0) - (a.threshold ?? 0));
    this.currentPhaseIndex = 0;
    this.glitchSkillDrop = glitchSkillDrop;
    this.introCinematic = introCinematic;
    this.introPlayed = false;
    this.phaseTimer = 0;
    this.patternState = {};
    this.glitchDropTriggered = false;
    this.#applyPhaseStats();
  }

  static createDefaultPhases(baseOptions = {}) {
    const projectile = baseOptions.projectileAttack || {
      speed: 420,
      damage: 14,
      size: { width: 12, height: 12 },
    };

    return [
      {
        name: "Phase 1",
        threshold: 1,
        attackDamage: baseOptions.attackDamage ?? 18,
        attackCooldown: baseOptions.attackCooldown ?? 1.2,
        attackRange: baseOptions.attackRange ?? 64,
        projectileAttack: projectile,
        pattern: ({ boss, world, deltaTime }) => {
          boss.phaseTimer += deltaTime;
          if (boss.phaseTimer >= 2.4 && world.player) {
            boss.phaseTimer = 0;
            boss._fireProjectile(world.player);
          }
        },
      },
      {
        name: "Phase 2",
        threshold: 0.5,
        attackDamage: (baseOptions.attackDamage ?? 18) + 8,
        attackCooldown: Math.max(0.6, (baseOptions.attackCooldown ?? 1.2) * 0.6),
        attackRange: (baseOptions.attackRange ?? 64) + 24,
        projectileAttack: {
          ...projectile,
          damage: (projectile.damage ?? 14) + 10,
          speed: (projectile.speed ?? 420) + 100,
        },
        pattern: ({ boss, world, deltaTime }) => {
          boss.phaseTimer += deltaTime;
          if (boss.phaseTimer >= 1.2 && world.player) {
            boss.phaseTimer = 0;
            for (let i = -1; i <= 1; i += 1) {
              const horizontal = Math.sign(world.player.position.x - boss.position.x) || 1;
              const speed = boss.projectileAttack.speed || 560;
              boss.projectiles.push({
                position: {
                  x: boss.position.x + boss.size.width / 2,
                  y: boss.position.y + boss.size.height / 2,
                },
                velocity: {
                  x: speed * (horizontal + i * 0.35),
                  y: speed * (i * 0.18),
                },
                size: boss.projectileAttack.size || { width: 12, height: 12 },
                damage: boss.projectileAttack.damage ?? 20,
                ttl: boss.projectileAttack.ttl ?? 3,
              });
            }
            boss.animationState = "attack";
          }
        },
      },
    ];
  }

  update(deltaTime, world = {}) {
    if (!this.introPlayed) {
      this.#playIntro(world);
    }

    this.#updatePhase();
    super.update(deltaTime, world);
    this.#executePattern(deltaTime, world);

    if (this.isDead()) {
      this.#triggerGlitchDrop(world);
    }
  }

  _updatePatrol(deltaTime, player, platforms) {
    super._updatePatrol(deltaTime, player, platforms);
    if (this.state === EnemyState.PATROL && this._canSeePlayer(player, platforms)) {
      this.state = EnemyState.CHASE;
    }
  }

  _updateAttack(deltaTime, player) {
    const activePhase = this.phases[this.currentPhaseIndex];
    if (activePhase && activePhase.onPreAttack) {
      activePhase.onPreAttack({ boss: this, player, deltaTime });
    }
    super._updateAttack(deltaTime, player);
    if (activePhase && activePhase.onPostAttack) {
      activePhase.onPostAttack({ boss: this, player, deltaTime });
    }
  }

  _handleDeath(world) {
    if (this.deathHandled) return;
    super._handleDeath(world);
    this.#triggerGlitchDrop(world);
  }

  #playIntro(world) {
    this.introPlayed = true;
    if (world && typeof world.showBossIntro === "function") {
      world.showBossIntro({ name: this.name, boss: this });
    } else if (typeof this.introCinematic === "function") {
      this.introCinematic({ boss: this, world });
    } else if (world && world.events && typeof world.events.emit === "function") {
      world.events.emit("boss:intro", { name: this.name, boss: this });
    }
  }

  #updatePhase() {
    const healthRatio = this.health / this.maxHealth;
    let nextPhaseIndex = this.currentPhaseIndex;

    for (let i = 0; i < this.phases.length; i += 1) {
      const phase = this.phases[i];
      const threshold = phase.threshold ?? 0;
      if (healthRatio <= threshold && i !== this.currentPhaseIndex) {
        nextPhaseIndex = i;
      }
    }

    if (nextPhaseIndex !== this.currentPhaseIndex) {
      this.currentPhaseIndex = nextPhaseIndex;
      this.phaseTimer = 0;
      this.#applyPhaseStats();
      const phase = this.phases[this.currentPhaseIndex];
      if (phase && phase.onEnter) {
        phase.onEnter({ boss: this });
      }
    }
  }

  #applyPhaseStats() {
    const phase = this.phases[this.currentPhaseIndex];
    if (!phase) return;
    if (phase.attackDamage !== undefined) this.attackDamage = phase.attackDamage;
    if (phase.attackCooldown !== undefined) {
      this.attackCooldown.max = phase.attackCooldown;
      this.attackCooldown.current = Math.min(this.attackCooldown.current, this.attackCooldown.max);
    }
    if (phase.attackRange !== undefined) this.attackRange = phase.attackRange;
    if (phase.projectileAttack) this.projectileAttack = phase.projectileAttack;
  }

  #executePattern(deltaTime, world) {
    if (this.isDead()) return;
    const phase = this.phases[this.currentPhaseIndex];
    if (!phase || !phase.pattern) return;
    phase.pattern({ boss: this, world, deltaTime, state: this.patternState });
  }

  #triggerGlitchDrop(world) {
    if (this.glitchDropTriggered) return;
    this.glitchDropTriggered = true;

    if (world && typeof world.spawnLoot === "function") {
      world.spawnLoot({
        type: "glitch-skill",
        data: this.glitchSkillDrop,
        position: { ...this.position },
      });
    }

    if (world && world.player && typeof world.player.registerGlitchSkill === "function") {
      const { id, cooldown, execute } = this.glitchSkillDrop;
      world.player.registerGlitchSkill(id, {
        cooldown: cooldown ?? 10,
        execute:
          execute || ((context) => context.player.heal(Math.round(context.player.maxHealth * 0.2))),
      });
    }
  }
}
