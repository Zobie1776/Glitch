import Entity from "./Entity.js";
import {
  advanceProjectiles,
  handlePlatformPhysics,
  normalizeVector,
  updateCooldown,
} from "./sharedAI.js";

export default class Player extends Entity {
  constructor({
    moveSpeed = 260,
    jumpForce = 620,
    doubleJumpForce = 540,
    projectileSpeed = 540,
    autoSaveInterval = 5,
    ...rest
  } = {}) {
    super(rest);
    this.moveSpeed = moveSpeed;
    this.jumpForce = jumpForce;
    this.doubleJumpForce = doubleJumpForce;
    this.projectileSpeed = projectileSpeed;

    this.inputState = {
      left: false,
      right: false,
      jump: false,
      attackMelee: false,
      attackRanged: false,
      glitchSkill: null,
    };

    this.availableJumps = 2;
    this.jumpQueued = false;
    this.facing = 1;

    this.meleeCooldown = { max: 0.6, current: 0 };
    this.rangedCooldown = { max: 0.8, current: 0 };
    this.glitchSkills = new Map();
    this.glitchCooldowns = new Map();
    this.projectiles = [];

    this.xp = 0;
    this.level = 1;
    this.gems = 0;
    this.saveAdapter = null;
    this.autoSaveInterval = autoSaveInterval;
    this.autoSaveTimer = 0;

    this.damage = {
      melee: 22,
      projectile: 14,
    };

    this.attackCallbacks = {
      melee: () => {},
      projectile: () => {},
      glitch: () => {},
    };
  }

  setSaveAdapter(adapter) {
    this.saveAdapter = adapter;
  }

  registerGlitchSkill(name, { cooldown, execute }) {
    this.glitchSkills.set(name, execute);
    this.glitchCooldowns.set(name, { max: cooldown, current: 0 });
  }

  onAttack(type, callback) {
    if (this.attackCallbacks[type]) {
      this.attackCallbacks[type] = callback;
    }
  }

  queueInput(input = {}) {
    Object.assign(this.inputState, input);
    if (input.jump) {
      this.jumpQueued = true;
    }
  }

  update(deltaTime, world = {}) {
    const { platforms = [], enemies = [], pickups = [], onProjectileHit } = world;

    this.#updateMovement(deltaTime);
    this.#updateJumps();
    this.#handleAttacks(deltaTime, enemies, world);
    this.#updateGlitchCooldowns(deltaTime);

    handlePlatformPhysics(this, deltaTime, platforms);

    advanceProjectiles(this.projectiles, deltaTime, platforms, (projectile, index) => {
      if (!onProjectileHit) return;
      onProjectileHit({ projectile, index, owner: this, hit: false });
    });
    this.#checkProjectileCollisions(enemies, onProjectileHit);

    this.#collectPickups(pickups);
    this.#autoSave(deltaTime);
    this.#resetInput();
  }

  #updateMovement(deltaTime) {
    const { left, right } = this.inputState;
    let direction = 0;
    if (left) direction -= 1;
    if (right) direction += 1;

    this.velocity.x = direction * this.moveSpeed;
    if (direction !== 0) {
      this.facing = direction;
      if (this.animationState !== "attack") {
        this.animationState = "move";
      }
    } else if (this.animationState !== "attack") {
      this.animationState = "idle";
    }
  }

  #updateJumps() {
    if (this.grounded) {
      this.availableJumps = 2;
    }

    if (this.jumpQueued) {
      if (this.grounded) {
        this.velocity.y = -this.jumpForce;
        this.availableJumps -= 1;
        this.grounded = false;
      } else if (this.availableJumps > 0) {
        this.velocity.y = -this.doubleJumpForce;
        this.availableJumps -= 1;
      }
      this.animationState = "jump";
      this.jumpQueued = false;
    }
  }

  #handleAttacks(deltaTime, enemies, world) {
    updateCooldown(this.meleeCooldown, deltaTime);
    updateCooldown(this.rangedCooldown, deltaTime);

    if (this.inputState.attackMelee && this.meleeCooldown.current === 0) {
      this.animationState = "attack";
      this.meleeCooldown.current = this.meleeCooldown.max;
      for (const enemy of enemies) {
        if (this.#isWithinMeleeRange(enemy)) {
          enemy.takeDamage(this.damage.melee);
        }
      }
      this.attackCallbacks.melee();
    }

    if (this.inputState.attackRanged && this.rangedCooldown.current === 0) {
      this.animationState = "attack";
      this.rangedCooldown.current = this.rangedCooldown.max;
      const direction = normalizeVector({ x: this.facing || 1, y: 0 });
      this.projectiles.push({
        position: {
          x: this.position.x + this.size.width / 2,
          y: this.position.y + this.size.height / 2,
        },
        velocity: {
          x: direction.x * this.projectileSpeed,
          y: direction.y * this.projectileSpeed,
        },
        size: { width: 10, height: 6 },
        damage: this.damage.projectile,
        ttl: 2.2,
      });
      this.attackCallbacks.projectile();
    }

    const skill = this.inputState.glitchSkill;
    if (skill && this.glitchSkills.has(skill)) {
      const cooldown = this.glitchCooldowns.get(skill);
      if (cooldown.current === 0) {
        cooldown.current = cooldown.max;
        const execute = this.glitchSkills.get(skill);
        execute({
          player: this,
          world,
        });
        this.attackCallbacks.glitch(skill);
      }
    }
  }

  #updateGlitchCooldowns(deltaTime) {
    for (const cooldown of this.glitchCooldowns.values()) {
      updateCooldown(cooldown, deltaTime);
    }
  }

  #collectPickups(pickups) {
    if (!pickups) return;
    for (let i = pickups.length - 1; i >= 0; i -= 1) {
      const pickup = pickups[i];
      const intersects = !(
        this.bounds.right < pickup.x ||
        this.bounds.left > pickup.x + pickup.width ||
        this.bounds.bottom < pickup.y ||
        this.bounds.top > pickup.y + pickup.height
      );
      if (intersects) {
        if (pickup.type === "gem") {
          this.collectGem(pickup.amount ?? 1);
        } else if (pickup.type === "xp") {
          this.gainXP(pickup.amount ?? 5);
        }
        pickups.splice(i, 1);
      }
    }
  }

  #autoSave(deltaTime) {
    if (!this.saveAdapter) return;
    this.autoSaveTimer += deltaTime;
    if (this.autoSaveTimer >= this.autoSaveInterval) {
      this.autoSaveTimer = 0;
      this.autoSave();
    }
  }

  #resetInput() {
    this.inputState.attackMelee = false;
    this.inputState.attackRanged = false;
    this.inputState.glitchSkill = null;
    this.inputState.jump = false;
  }

  #checkProjectileCollisions(enemies, onProjectileHit) {
    if (!enemies) return;
    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.projectiles[i];
      for (const enemy of enemies) {
        if (enemy.isDead()) continue;
        if (this.#projectileHits(projectile, enemy)) {
          enemy.takeDamage(projectile.damage ?? this.damage.projectile);
          if (typeof onProjectileHit === "function") {
            onProjectileHit({ projectile, index: i, owner: this, target: enemy, hit: true });
          }
          this.projectiles.splice(i, 1);
          break;
        }
      }
    }
  }

  #projectileHits(projectile, enemy) {
    const enemyBounds = enemy.bounds;
    const projectileBounds = {
      left: projectile.position.x,
      right: projectile.position.x + (projectile.size?.width ?? 0),
      top: projectile.position.y,
      bottom: projectile.position.y + (projectile.size?.height ?? 0),
    };
    return !(
      projectileBounds.right < enemyBounds.left ||
      projectileBounds.left > enemyBounds.right ||
      projectileBounds.bottom < enemyBounds.top ||
      projectileBounds.top > enemyBounds.bottom
    );
  }

  #isWithinMeleeRange(target) {
    const range = this.size.width * 0.9;
    const dy = Math.abs(
      target.position.y + target.size.height / 2 - (this.position.y + this.size.height / 2)
    );
    const dx = target.position.x + target.size.width / 2 - (this.position.x + this.size.width / 2);
    const sameFacing = Math.sign(dx) === (this.facing || 1);
    return Math.abs(dx) <= range && dy <= this.size.height * 0.8 && sameFacing;
  }

  gainXP(amount) {
    this.xp += amount;
    const xpForNextLevel = 100 + (this.level - 1) * 60;
    if (this.xp >= xpForNextLevel) {
      this.xp -= xpForNextLevel;
      this.level += 1;
      this.maxHealth += 5;
      this.health = this.maxHealth;
    }
    this.autoSaveTimer = this.autoSaveInterval;
  }

  collectGem(amount) {
    this.gems += amount;
    this.autoSaveTimer = this.autoSaveInterval;
  }

  autoSave() {
    if (!this.saveAdapter) return;
    this.saveAdapter.save({
      position: this.position,
      health: this.health,
      maxHealth: this.maxHealth,
      xp: this.xp,
      level: this.level,
      gems: this.gems,
    });
  }
}
