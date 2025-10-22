export const DEG_TO_RAD = Math.PI / 180;

export function normalizeVector(vector) {
  const magnitude = Math.hypot(vector.x, vector.y);
  if (magnitude === 0) return { x: 0, y: 0 };
  return { x: vector.x / magnitude, y: vector.y / magnitude };
}

export function computeDirection(origin, target) {
  return normalizeVector({
    x: target.position.x - origin.position.x,
    y: target.position.y - origin.position.y,
  });
}

export function hasLineOfSight(origin, target, platforms = []) {
  const steps = 12;
  const direction = computeDirection(origin, target);
  const distance = Math.hypot(
    target.position.x - origin.position.x,
    target.position.y - origin.position.y
  );
  const stepVector = {
    x: (direction.x * distance) / steps,
    y: (direction.y * distance) / steps,
  };

  let probe = { x: origin.position.x, y: origin.position.y };
  for (let i = 0; i < steps; i += 1) {
    probe = { x: probe.x + stepVector.x, y: probe.y + stepVector.y };
    const probeBounds = {
      left: probe.x,
      right: probe.x + origin.size.width,
      top: probe.y,
      bottom: probe.y + origin.size.height,
    };

    for (const platform of platforms) {
      const intersects = !(
        probeBounds.right < platform.x ||
        probeBounds.left > platform.x + platform.width ||
        probeBounds.bottom < platform.y ||
        probeBounds.top > platform.y + platform.height
      );
      if (intersects) {
        return false;
      }
    }
  }

  return true;
}

export function isWithinVisionCone(origin, target, {
  radius,
  angle,
  facingDirection,
} = {}) {
  const dx = target.position.x - origin.position.x;
  const dy = target.position.y - origin.position.y;
  const distance = Math.hypot(dx, dy);
  if (distance > radius) return false;

  const direction = normalizeVector({ x: dx, y: dy });
  const facing = normalizeVector(facingDirection || { x: origin.facing, y: 0 });
  const dot = direction.x * facing.x + direction.y * facing.y;
  const maxAngle = Math.cos((angle / 2) * DEG_TO_RAD);
  return dot >= maxAngle;
}

export function chase(origin, target, speed, deltaTime) {
  const direction = computeDirection(origin, target);
  origin.velocity.x = direction.x * speed;
  origin.velocity.y += direction.y * speed * 0.1 * deltaTime;
  origin.animationState = "move";
  return direction;
}

export function patrol(entity, patrolRange, speed, deltaTime) {
  if (!entity.patrolAnchor) {
    entity.patrolAnchor = entity.position.x;
    entity.patrolDirection = 1;
  }

  const offset = entity.position.x - entity.patrolAnchor;
  if (Math.abs(offset) >= patrolRange / 2) {
    entity.patrolDirection *= -1;
  }

  entity.velocity.x = entity.patrolDirection * speed;
  entity.animationState = "move";
}

export function handlePlatformPhysics(entity, deltaTime, platforms) {
  entity.applyGravity(deltaTime);
  entity.position.x += entity.velocity.x * deltaTime;
  entity.resolvePlatformCollisions(platforms);
  entity.position.y += entity.velocity.y * deltaTime;
  entity.resolvePlatformCollisions(platforms);
  entity.applyFriction();
  entity.updateBase(deltaTime);
}

export function performAttack(entity, target, damage, cooldownTimer) {
  if (cooldownTimer.current > 0) return false;
  cooldownTimer.current = cooldownTimer.max;
  entity.animationState = "attack";
  return target.takeDamage(damage);
}

export function updateCooldown(timer, deltaTime) {
  if (timer.current > 0) {
    timer.current = Math.max(0, timer.current - deltaTime);
  }
}

export function advanceProjectiles(projectiles, deltaTime, platforms, onHit) {
  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    const projectile = projectiles[i];
    projectile.position.x += projectile.velocity.x * deltaTime;
    projectile.position.y += projectile.velocity.y * deltaTime;

    for (const platform of platforms) {
      const intersects = !(
        projectile.position.x + projectile.size.width < platform.x ||
        projectile.position.x > platform.x + platform.width ||
        projectile.position.y + projectile.size.height < platform.y ||
        projectile.position.y > platform.y + platform.height
      );
      if (intersects) {
        projectiles.splice(i, 1);
        break;
      }
    }

    if (projectile.ttl !== undefined) {
      projectile.ttl -= deltaTime;
      if (projectile.ttl <= 0) {
        projectiles.splice(i, 1);
      }
    }

    if (projectiles[i] && onHit) {
      onHit(projectiles[i], i);
    }
  }
}
