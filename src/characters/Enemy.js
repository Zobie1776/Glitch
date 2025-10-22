import Entity from "./Entity.js";
import {
  chase,
  advanceProjectiles,
  handlePlatformPhysics,
  hasLineOfSight,
  isWithinVisionCone,
  patrol,
  performAttack,
  updateCooldown,
} from "./sharedAI.js";

export const EnemyState = Object.freeze({
  PATROL: "patrol",
  CHASE: "chase",
  ATTACK: "attack",
});

export default class Enemy extends Entity {
  constructor({
    speed = 140,
    patrolRange = 180,
    attackDamage = 12,
    attackCooldown = 1.4,
    attackRange = 48,
    projectileAttack = null,
    visionRadius = 260,
    visionAngle = 90,
    lootTable = { gems: [2, 5], xp: [12, 24] },
    ...rest
  } = {}) {
    super(rest);
    this.speed = speed;
    this.patrolRange = patrolRange;
    this.attackDamage = attackDamage;
    this.attackRange = attackRange;
    this.visionRadius = visionRadius;
    this.visionAngle = visionAngle;
    this.projectileAttack = projectileAttack;
    this.lootTable = lootTable;

    this.state = EnemyState.PATROL;
    this.facing = 1;

    this.attackCooldown = { max: attackCooldown, current: 0 };
    this.projectiles = [];
    this.deathHandled = false;
  }

  update(deltaTime, world = {}) {
    const { player, platforms = [], onProjectileHit } = world;
    if (!player) return;

    if (this.isDead()) {
      this._handleDeath(world);
      return;
    }

    updateCooldown(this.attackCooldown, deltaTime);

    switch (this.state) {
      case EnemyState.PATROL:
        this._updatePatrol(deltaTime, player, platforms);
        break;
      case EnemyState.CHASE:
        this._updateChase(deltaTime, player, platforms);
        break;
      case EnemyState.ATTACK:
        this._updateAttack(deltaTime, player);
        break;
      default:
        break;
    }

    handlePlatformPhysics(this, deltaTime, platforms);

    advanceProjectiles(this.projectiles, deltaTime, platforms, (projectile, index) => {
      if (player && this._projectileHitsTarget(projectile, player)) {
        player.takeDamage(projectile.damage ?? this.attackDamage / 2);
        if (typeof onProjectileHit === "function") {
          onProjectileHit({ owner: this, projectile, index, target: player, hit: true });
        }
        this.projectiles.splice(index, 1);
        return;
      }
      if (typeof onProjectileHit === "function") {
        onProjectileHit({ owner: this, projectile, index, hit: false });
      }
    });
  }

  _updatePatrol(deltaTime, player, platforms) {
    patrol(this, this.patrolRange, this.speed, deltaTime);
    this.facing = this.patrolDirection;

    if (this._canSeePlayer(player, platforms)) {
      this.state = EnemyState.CHASE;
    }
  }

  _updateChase(deltaTime, player, platforms) {
    const distance = this._distanceTo(player);
    if (distance <= this.attackRange && this.attackCooldown.current === 0) {
      this.state = EnemyState.ATTACK;
      return;
    }

    if (!this._canSeePlayer(player, platforms)) {
      this.state = EnemyState.PATROL;
      return;
    }

    const direction = chase(this, player, this.speed, deltaTime);
    this.facing = Math.sign(direction.x || this.facing || 1);
  }

  _updateAttack(deltaTime, player) {
    const distance = this._distanceTo(player);
    if (distance > this.attackRange * 1.2) {
      this.state = EnemyState.CHASE;
      return;
    }

    const attacked = performAttack(this, player, this.attackDamage, this.attackCooldown);
    if (!attacked && this.projectileAttack) {
      this._fireProjectile(player);
    }
    this.state = EnemyState.CHASE;
  }

  _fireProjectile(player) {
    if (!this.projectileAttack) return;
    const { speed, size = { width: 8, height: 8 }, damage = 6, ttl = 2.5 } =
      this.projectileAttack;
    const direction = {
      x: Math.sign(player.position.x - this.position.x) || this.facing || 1,
      y: (player.position.y - this.position.y) * 0.25,
    };
    const magnitude = Math.hypot(direction.x, direction.y);
    const normalized = magnitude === 0 ? { x: 1, y: 0 } : { x: direction.x / magnitude, y: direction.y / magnitude };

    this.projectiles.push({
      position: {
        x: this.position.x + this.size.width / 2,
        y: this.position.y + this.size.height / 2,
      },
      velocity: {
        x: normalized.x * speed,
        y: normalized.y * speed,
      },
      size,
      damage,
      ttl,
    });
    this.animationState = "attack";
  }

  _canSeePlayer(player, platforms) {
    const inCone = isWithinVisionCone(this, player, {
      radius: this.visionRadius,
      angle: this.visionAngle,
      facingDirection: { x: this.facing, y: 0 },
    });
    return inCone && hasLineOfSight(this, player, platforms);
  }

  _distanceTo(target) {
    const dx = target.position.x - this.position.x;
    const dy = target.position.y - this.position.y;
    return Math.hypot(dx, dy);
  }

  _handleDeath(world) {
    if (this.deathHandled) return;
    this.deathHandled = true;
    this.animationState = "die";

    const { spawnLoot, player } = world;
    if (!spawnLoot || !player) return;

    const gemAmount = this._randomInRange(...this.lootTable.gems);
    const xpAmount = this._randomInRange(...this.lootTable.xp);

    spawnLoot({
      type: "gem",
      amount: gemAmount,
      position: { ...this.position },
    });
    spawnLoot({
      type: "xp",
      amount: xpAmount,
      position: { ...this.position },
    });

    player.collectGem(gemAmount);
    player.gainXP(xpAmount);
  }

  _randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  _projectileHitsTarget(projectile, target) {
    return !(
      projectile.position.x + (projectile.size?.width ?? 0) < target.bounds.left ||
      projectile.position.x > target.bounds.right ||
      projectile.position.y + (projectile.size?.height ?? 0) < target.bounds.top ||
      projectile.position.y > target.bounds.bottom
    );
  }
}
