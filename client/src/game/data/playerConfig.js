export const PLAYER_CONFIG = {
  movement: {
    maxSpeed: 280,
    acceleration: 1400,
    deceleration: 1600,
    airAcceleration: 900,
    airDeceleration: 600,
    friction: 1100,
    coyoteTime: 0.12,
    jumpBuffer: 0.12,
    jumpVelocity: -460,
    doubleJumpVelocity: -420,
    variableJumpCutoff: 0.35,
    dashSpeed: 520,
    dashDuration: 0.22,
    dashCooldown: 1.6,
    dashIFrames: 0.28
  },
  combat: {
    meleeCombo: [
      { damage: 20, range: 64, cooldown: 0.32 },
      { damage: 26, range: 70, cooldown: 0.34 },
      { damage: 36, range: 84, cooldown: 0.56 }
    ],
    meleeResetTime: 0.8,
    hitstop: 0.12,
    rangedCooldown: 0.85
  },
  pickups: {
    gemMagnetRadius: 140,
    healthOrbValue: 35,
    healthDropChance: 0.15
  }
};
