export default class Entity {
  constructor({
    position = { x: 0, y: 0 },
    size = { width: 32, height: 32 },
    gravity = 1800,
    maxHealth = 100,
    friction = 0.85,
  } = {}) {
    this.position = { ...position };
    this.velocity = { x: 0, y: 0 };
    this.size = { ...size };
    this.gravity = gravity;
    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.friction = friction;
    this.grounded = false;
    this.animationState = "idle";
    this.invulnerableTimer = 0;
    this.invulnerableDuration = 0.35;
  }

  get bounds() {
    return {
      left: this.position.x,
      right: this.position.x + this.size.width,
      top: this.position.y,
      bottom: this.position.y + this.size.height,
    };
  }

  updateBase(deltaTime) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - deltaTime);
    }
  }

  applyGravity(deltaTime) {
    if (!this.grounded) {
      this.velocity.y += this.gravity * deltaTime;
    }
  }

  applyFriction() {
    if (this.grounded) {
      this.velocity.x *= this.friction;
      if (Math.abs(this.velocity.x) < 0.05) {
        this.velocity.x = 0;
      }
    }
  }

  resolvePlatformCollisions(platforms = []) {
    this.grounded = false;
    for (const platform of platforms) {
      const bounds = this.bounds;
      const overlap = this.#calculateOverlap(bounds, platform);
      if (!overlap) continue;

      if (overlap.width < overlap.height) {
        if (bounds.left < platform.x) {
          this.position.x -= overlap.width;
        } else {
          this.position.x += overlap.width;
        }
        this.velocity.x = 0;
      } else {
        if (bounds.top < platform.y) {
          this.position.y -= overlap.height;
          this.grounded = true;
        } else {
          this.position.y += overlap.height;
        }
        this.velocity.y = 0;
      }
    }
  }

  #calculateOverlap(bounds, platform) {
    const platformBounds = {
      left: platform.x,
      right: platform.x + platform.width,
      top: platform.y,
      bottom: platform.y + platform.height,
    };

    if (
      bounds.right <= platformBounds.left ||
      bounds.left >= platformBounds.right ||
      bounds.bottom <= platformBounds.top ||
      bounds.top >= platformBounds.bottom
    ) {
      return null;
    }

    const width = Math.min(bounds.right, platformBounds.right) -
      Math.max(bounds.left, platformBounds.left);
    const height = Math.min(bounds.bottom, platformBounds.bottom) -
      Math.max(bounds.top, platformBounds.top);

    return { width, height };
  }

  takeDamage(amount) {
    if (this.invulnerableTimer > 0) return false;
    this.health = Math.max(0, this.health - amount);
    this.invulnerableTimer = this.invulnerableDuration;
    if (this.health <= 0) {
      this.animationState = "die";
    }
    return true;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  isDead() {
    return this.health <= 0;
  }
}
