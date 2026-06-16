// Full registry of all 65 glitches (50 base + 15 special)
// effect(scene, player): the actual in-game function

function stub(scene) {
  scene.cameras.main.shake(150, 0.008);
}

export const GLITCH_REGISTRY = {

  // ══════════════════════════════════
  // MOVEMENT GLITCHES (15)
  // ══════════════════════════════════

  inputDesync: {
    id: 'inputDesync', name: 'Input Desync', category: 'movement',
    description: 'Burst teleport in facing direction',
    defaultKey: 'Z', starter: true,
    tiers: [
      {
        tier: 1, cooldown: 3, description: 'Teleport 120px forward',
        effect(scene, player) {
          const dir = player.flipX ? -1 : 1;
          player.x += dir * 120;
          scene.cameras.main.flash(120, 255, 255, 255, false);
          scene.cameras.main.shake(100, 0.012);
          spawnGlitchTrail(scene, player, 0x00ffee);
        },
      },
      {
        tier: 2, cooldown: 2.5, description: 'Teleport 160px + afterimage',
        effect(scene, player) {
          const dir = player.flipX ? -1 : 1;
          spawnAfterimage(scene, player, 0x00ffee);
          player.x += dir * 160;
          scene.cameras.main.flash(140, 255, 255, 255, false);
          spawnGlitchTrail(scene, player, 0x00ffee);
        },
      },
      {
        tier: 3, cooldown: 2, description: 'Teleport 200px + ghost clone attack',
        effect(scene, player) {
          const dir = player.flipX ? -1 : 1;
          spawnAfterimage(scene, player, 0x00ffee);
          spawnGhostClone(scene, player);
          player.x += dir * 200;
          scene.cameras.main.flash(180, 255, 255, 255, false);
          scene.cameras.main.shake(120, 0.015);
        },
      },
    ],
  },

  collisionSlip: {
    id: 'collisionSlip', name: 'Collision Slip', category: 'movement',
    description: 'Phase through platforms temporarily',
    defaultKey: 'C', starter: true,
    tiers: [
      {
        tier: 1, cooldown: 5, description: 'Phase for 1.5s',
        effect(scene, player) {
          activatePhase(scene, player, 1500, 0x00eeff);
        },
      },
      {
        tier: 2, cooldown: 4, description: 'Phase for 2.5s',
        effect(scene, player) {
          activatePhase(scene, player, 2500, 0x00eeff);
        },
      },
      {
        tier: 3, cooldown: 3.5, description: 'Phase 3s + projectile immunity',
        effect(scene, player) {
          activatePhase(scene, player, 3000, 0x00ffff);
          player.projectileImmune = true;
          scene.time.delayedCall(3000, () => { player.projectileImmune = false; });
        },
      },
    ],
  },

  blinkStep: {
    id: 'blinkStep', name: 'Blink Step', category: 'movement',
    description: 'Short-range blink in any direction',
    tiers: [
      { tier: 1, cooldown: 4, effect: stub },
      { tier: 2, cooldown: 3, effect: stub },
      { tier: 3, cooldown: 2, effect: stub },
    ],
  },

  airStall: {
    id: 'airStall', name: 'Air Stall', category: 'movement',
    description: 'Freeze mid-air for 0.8s',
    tiers: [
      { tier: 1, cooldown: 6, effect(scene, player) { player.body.setVelocityY(0); player.body.setAllowGravity(false); scene.time.delayedCall(800, () => player.body.setAllowGravity(true)); } },
      { tier: 2, cooldown: 5, effect(scene, player) { player.body.setVelocityY(0); player.body.setAllowGravity(false); scene.time.delayedCall(1200, () => player.body.setAllowGravity(true)); } },
      { tier: 3, cooldown: 4, effect(scene, player) { player.body.setVelocityY(0); player.body.setAllowGravity(false); scene.time.delayedCall(1600, () => player.body.setAllowGravity(true)); } },
    ],
  },

  momentumLock: {
    id: 'momentumLock', name: 'Momentum Lock', category: 'movement',
    description: 'Lock velocity at current speed',
    tiers: [
      { tier: 1, cooldown: 5, effect: stub },
      { tier: 2, cooldown: 4, effect: stub },
      { tier: 3, cooldown: 3, effect: stub },
    ],
  },

  gravityDrift: {
    id: 'gravityDrift', name: 'Gravity Drift', category: 'movement',
    description: 'Reduce gravity for 3s',
    tiers: [
      { tier: 1, cooldown: 7, effect(scene, player) { player.body.setGravityY(-900); scene.time.delayedCall(2000, () => player.body.setGravityY(0)); } },
      { tier: 2, cooldown: 6, effect(scene, player) { player.body.setGravityY(-1000); scene.time.delayedCall(3000, () => player.body.setGravityY(0)); } },
      { tier: 3, cooldown: 5, effect(scene, player) { player.body.setGravityY(-1100); scene.time.delayedCall(4000, () => player.body.setGravityY(0)); scene.cameras.main.shake(100, 0.01); } },
    ],
  },

  dashWarp: {
    id: 'dashWarp', name: 'Dash Warp', category: 'movement',
    description: 'Rapid dash leaving damage trail',
    tiers: [
      { tier: 1, cooldown: 4, effect: stub },
      { tier: 2, cooldown: 3, effect: stub },
      { tier: 3, cooldown: 2.5, effect: stub },
    ],
  },

  wallPhase: {
    id: 'wallPhase', name: 'Wall Phase', category: 'movement',
    description: 'Phase through a single wall',
    tiers: [
      { tier: 1, cooldown: 6, effect: stub },
      { tier: 2, cooldown: 5, effect: stub },
      { tier: 3, cooldown: 4, effect: stub },
    ],
  },

  quantumStep: {
    id: 'quantumStep', name: 'Quantum Step', category: 'movement',
    description: 'Step forward through time by 0.3s',
    tiers: [
      { tier: 1, cooldown: 8, effect: stub },
      { tier: 2, cooldown: 6, effect: stub },
      { tier: 3, cooldown: 5, effect: stub },
    ],
  },

  riftSlide: {
    id: 'riftSlide', name: 'Rift Slide', category: 'movement',
    description: 'Low slide under projectiles',
    tiers: [
      { tier: 1, cooldown: 4, effect: stub },
      { tier: 2, cooldown: 3, effect: stub },
      { tier: 3, cooldown: 2.5, effect: stub },
    ],
  },

  verticalWarp: {
    id: 'verticalWarp', name: 'Vertical Warp', category: 'movement',
    description: 'Warp straight up through platforms',
    tiers: [
      { tier: 1, cooldown: 5, effect: stub },
      { tier: 2, cooldown: 4, effect: stub },
      { tier: 3, cooldown: 3, effect: stub },
    ],
  },

  phaseRun: {
    id: 'phaseRun', name: 'Phase Run', category: 'movement',
    description: 'Run at double speed while phased',
    tiers: [
      { tier: 1, cooldown: 8, effect: stub },
      { tier: 2, cooldown: 6, effect: stub },
      { tier: 3, cooldown: 5, effect: stub },
    ],
  },

  mirrorDash: {
    id: 'mirrorDash', name: 'Mirror Dash', category: 'movement',
    description: 'Dash and swap places with nearest enemy',
    tiers: [
      { tier: 1, cooldown: 7, effect: stub },
      { tier: 2, cooldown: 6, effect: stub },
      { tier: 3, cooldown: 5, effect: stub },
    ],
  },

  echoJump: {
    id: 'echoJump', name: 'Echo Jump', category: 'movement',
    description: 'Launch a burst jump from any state',
    tiers: [
      { tier: 1, cooldown: 5, effect(scene, player) { player.body.setVelocityY(-800); } },
      { tier: 2, cooldown: 4, effect(scene, player) { player.body.setVelocityY(-900); } },
      { tier: 3, cooldown: 3, effect(scene, player) { player.body.setVelocityY(-1000); scene.cameras.main.shake(100, 0.01); } },
    ],
  },

  teleSlip: {
    id: 'teleSlip', name: 'Tele-Slip', category: 'movement',
    description: 'Short backward teleport dodge',
    tiers: [
      { tier: 1, cooldown: 4, effect(scene, player) { const dir = player.flipX ? 1 : -1; player.x += dir * 80; } },
      { tier: 2, cooldown: 3, effect(scene, player) { const dir = player.flipX ? 1 : -1; player.x += dir * 120; } },
      { tier: 3, cooldown: 2.5, effect(scene, player) { const dir = player.flipX ? 1 : -1; player.x += dir * 160; spawnAfterimage(scene, player, 0xff00ff); } },
    ],
  },

  // ══════════════════════════════════
  // COMBAT GLITCHES (15)
  // ══════════════════════════════════

  timeDilation: {
    id: 'timeDilation', name: 'Time Dilation', category: 'combat',
    description: 'Slow all enemies temporarily',
    defaultKey: 'V', starter: true,
    tiers: [
      {
        tier: 1, cooldown: 6, description: 'Slow enemies for 2s',
        effect(scene, player) {
          applyTimeDilation(scene, 0.3, 2000);
        },
      },
      {
        tier: 2, cooldown: 5, description: 'Slow enemies for 3s',
        effect(scene, player) {
          applyTimeDilation(scene, 0.3, 3000);
        },
      },
      {
        tier: 3, cooldown: 4, description: 'Slow + damage pulse',
        effect(scene, player) {
          applyTimeDilation(scene, 0.25, 3000);
          scene.time.addEvent({
            delay: 500, repeat: 5,
            callback() {
              if (scene.enemies) {
                scene.enemies.getChildren().forEach(e => {
                  if (e.active && e.glitchSlowed) e.takeDamage(10);
                });
              }
            },
          });
        },
      },
    ],
  },

  cloneStrike: {
    id: 'cloneStrike', name: 'Clone Strike', category: 'combat',
    description: 'Summon a clone that attacks once',
    tiers: [
      { tier: 1, cooldown: 8, effect: stub },
      { tier: 2, cooldown: 7, effect: stub },
      { tier: 3, cooldown: 6, effect: stub },
    ],
  },

  critBurst: {
    id: 'critBurst', name: 'Crit Burst', category: 'combat',
    description: 'Next 3 attacks deal 3x damage',
    tiers: [
      { tier: 1, cooldown: 8, effect(scene, player) { player.critStacks = 3; player.critMultiplier = 3; } },
      { tier: 2, cooldown: 7, effect(scene, player) { player.critStacks = 4; player.critMultiplier = 3.5; } },
      { tier: 3, cooldown: 6, effect(scene, player) { player.critStacks = 5; player.critMultiplier = 4; } },
    ],
  },

  timeSlice: {
    id: 'timeSlice', name: 'Time Slice', category: 'combat',
    description: 'Forward-dash melee through all enemies in path',
    tiers: [
      { tier: 1, cooldown: 7, effect: stub },
      { tier: 2, cooldown: 6, effect: stub },
      { tier: 3, cooldown: 5, effect: stub },
    ],
  },

  echoHit: {
    id: 'echoHit', name: 'Echo Hit', category: 'combat',
    description: 'Repeat last melee attack 0.3s later',
    tiers: [
      { tier: 1, cooldown: 5, effect: stub },
      { tier: 2, cooldown: 4, effect: stub },
      { tier: 3, cooldown: 3, effect: stub },
    ],
  },

  chainImpact: {
    id: 'chainImpact', name: 'Chain Impact', category: 'combat',
    description: 'Melee hit chains to nearby enemies',
    tiers: [
      { tier: 1, cooldown: 6, effect: stub },
      { tier: 2, cooldown: 5, effect: stub },
      { tier: 3, cooldown: 4, effect: stub },
    ],
  },

  shockwavePulse: {
    id: 'shockwavePulse', name: 'Shockwave Pulse', category: 'combat',
    description: 'Emit AoE shockwave around player',
    tiers: [
      {
        tier: 1, cooldown: 8,
        effect(scene, player) {
          spawnAoePulse(scene, player.x, player.y, 120, 15, 0x00ffee);
        },
      },
      {
        tier: 2, cooldown: 7,
        effect(scene, player) {
          spawnAoePulse(scene, player.x, player.y, 160, 22, 0x00ffee);
        },
      },
      {
        tier: 3, cooldown: 6,
        effect(scene, player) {
          spawnAoePulse(scene, player.x, player.y, 200, 30, 0x00ffff);
          scene.cameras.main.shake(180, 0.02);
        },
      },
    ],
  },

  voidLance: {
    id: 'voidLance', name: 'Void Lance', category: 'combat',
    description: 'Fire a piercing projectile',
    tiers: [
      { tier: 1, cooldown: 5, effect: stub },
      { tier: 2, cooldown: 4, effect: stub },
      { tier: 3, cooldown: 3, effect: stub },
    ],
  },

  glitchBomb: {
    id: 'glitchBomb', name: 'Glitch Bomb', category: 'combat',
    description: 'Throw an explosive corruption charge',
    tiers: [
      { tier: 1, cooldown: 9, effect: stub },
      { tier: 2, cooldown: 8, effect: stub },
      { tier: 3, cooldown: 7, effect: stub },
    ],
  },

  staticField: {
    id: 'staticField', name: 'Static Field', category: 'combat',
    description: 'Surround self in damaging static for 2s',
    tiers: [
      { tier: 1, cooldown: 10, effect: stub },
      { tier: 2, cooldown: 8, effect: stub },
      { tier: 3, cooldown: 7, effect: stub },
    ],
  },

  nullBeam: {
    id: 'nullBeam', name: 'Null Beam', category: 'combat',
    description: 'Charge and fire a high-damage beam',
    tiers: [
      { tier: 1, cooldown: 12, effect: stub },
      { tier: 2, cooldown: 10, effect: stub },
      { tier: 3, cooldown: 8, effect: stub },
    ],
  },

  fragmentRain: {
    id: 'fragmentRain', name: 'Fragment Rain', category: 'combat',
    description: 'Drop shards from above on enemies',
    tiers: [
      { tier: 1, cooldown: 9, effect: stub },
      { tier: 2, cooldown: 8, effect: stub },
      { tier: 3, cooldown: 7, effect: stub },
    ],
  },

  phaseStab: {
    id: 'phaseStab', name: 'Phase Stab', category: 'combat',
    description: 'Teleport onto enemy and deal heavy damage',
    tiers: [
      { tier: 1, cooldown: 7, effect: stub },
      { tier: 2, cooldown: 6, effect: stub },
      { tier: 3, cooldown: 5, effect: stub },
    ],
  },

  overloadPulse: {
    id: 'overloadPulse', name: 'Overload Pulse', category: 'combat',
    description: 'Detonate stored energy in burst',
    tiers: [
      { tier: 1, cooldown: 10, effect: stub },
      { tier: 2, cooldown: 9, effect: stub },
      { tier: 3, cooldown: 8, effect: stub },
    ],
  },

  dataSpike: {
    id: 'dataSpike', name: 'Data Spike', category: 'combat',
    description: 'Instantly strip enemy of 30% HP',
    tiers: [
      { tier: 1, cooldown: 12, effect: stub },
      { tier: 2, cooldown: 10, effect: stub },
      { tier: 3, cooldown: 8, effect: stub },
    ],
  },

  // ══════════════════════════════════
  // UTILITY GLITCHES (10)
  // ══════════════════════════════════

  cooldownReset: {
    id: 'cooldownReset', name: 'Cooldown Reset', category: 'utility',
    description: 'Reset all glitch cooldowns by 50%',
    tiers: [
      { tier: 1, cooldown: 15, effect(scene, player) { if (scene.glitchSystem) scene.glitchSystem.reduceCooldowns(0.5); } },
      { tier: 2, cooldown: 12, effect(scene, player) { if (scene.glitchSystem) scene.glitchSystem.reduceCooldowns(0.7); } },
      { tier: 3, cooldown: 10, effect(scene, player) { if (scene.glitchSystem) scene.glitchSystem.reduceCooldowns(1.0); } },
    ],
  },

  visionPulse: {
    id: 'visionPulse', name: 'Vision Pulse', category: 'utility',
    description: 'Reveal all enemies on screen',
    tiers: [
      { tier: 1, cooldown: 10, effect: stub },
      { tier: 2, cooldown: 8, effect: stub },
      { tier: 3, cooldown: 6, effect: stub },
    ],
  },

  enemyReveal: {
    id: 'enemyReveal', name: 'Enemy Reveal', category: 'utility',
    description: 'Mark all enemies for extra damage',
    tiers: [
      { tier: 1, cooldown: 12, effect: stub },
      { tier: 2, cooldown: 10, effect: stub },
      { tier: 3, cooldown: 8, effect: stub },
    ],
  },

  energySiphon: {
    id: 'energySiphon', name: 'Energy Siphon', category: 'utility',
    description: 'Drain 25 HP from nearest enemy',
    tiers: [
      {
        tier: 1, cooldown: 8,
        effect(scene, player) {
          const nearest = findNearestEnemy(scene, player, 200);
          if (nearest) { nearest.takeDamage(25); player.heal(25); }
        },
      },
      {
        tier: 2, cooldown: 7,
        effect(scene, player) {
          const nearest = findNearestEnemy(scene, player, 280);
          if (nearest) { nearest.takeDamage(35); player.heal(35); }
        },
      },
      {
        tier: 3, cooldown: 6,
        effect(scene, player) {
          const nearest = findNearestEnemy(scene, player, 350);
          if (nearest) { nearest.takeDamage(50); player.heal(50); }
        },
      },
    ],
  },

  barrierField: {
    id: 'barrierField', name: 'Barrier Field', category: 'utility',
    description: 'Absorb the next hit taken',
    tiers: [
      { tier: 1, cooldown: 12, effect(scene, player) { player.shield = 1; } },
      { tier: 2, cooldown: 10, effect(scene, player) { player.shield = 2; } },
      { tier: 3, cooldown: 8, effect(scene, player) { player.shield = 3; } },
    ],
  },

  speedBoost: {
    id: 'speedBoost', name: 'Speed Boost', category: 'utility',
    description: 'Double movement speed for 3s',
    tiers: [
      { tier: 1, cooldown: 8, effect(scene, player) { player.speedMultiplier = 2; scene.time.delayedCall(2000, () => { player.speedMultiplier = 1; }); } },
      { tier: 2, cooldown: 7, effect(scene, player) { player.speedMultiplier = 2.2; scene.time.delayedCall(3000, () => { player.speedMultiplier = 1; }); } },
      { tier: 3, cooldown: 6, effect(scene, player) { player.speedMultiplier = 2.5; scene.time.delayedCall(4000, () => { player.speedMultiplier = 1; }); } },
    ],
  },

  dataCache: {
    id: 'dataCache', name: 'Data Cache', category: 'utility',
    description: 'Store current HP to restore later',
    tiers: [
      { tier: 1, cooldown: 20, effect: stub },
      { tier: 2, cooldown: 16, effect: stub },
      { tier: 3, cooldown: 12, effect: stub },
    ],
  },

  glitchPing: {
    id: 'glitchPing', name: 'Glitch Ping', category: 'utility',
    description: 'Ping the portal location through walls',
    tiers: [
      { tier: 1, cooldown: 6, effect: stub },
      { tier: 2, cooldown: 5, effect: stub },
      { tier: 3, cooldown: 4, effect: stub },
    ],
  },

  systemReboot: {
    id: 'systemReboot', name: 'System Reboot', category: 'utility',
    description: 'Restore 30 HP',
    tiers: [
      { tier: 1, cooldown: 12, effect(scene, player) { player.heal(30); } },
      { tier: 2, cooldown: 10, effect(scene, player) { player.heal(50); } },
      { tier: 3, cooldown: 8, effect(scene, player) { player.heal(75); } },
    ],
  },

  overclock: {
    id: 'overclock', name: 'Overclock', category: 'utility',
    description: 'All attack cooldowns halved for 4s',
    tiers: [
      { tier: 1, cooldown: 14, effect: stub },
      { tier: 2, cooldown: 12, effect: stub },
      { tier: 3, cooldown: 10, effect: stub },
    ],
  },

  // ══════════════════════════════════
  // ENVIRONMENT GLITCHES (5)
  // ══════════════════════════════════

  platformShift: {
    id: 'platformShift', name: 'Platform Shift', category: 'environment',
    description: 'Shift a nearby platform 80px',
    tiers: [
      { tier: 1, cooldown: 10, effect: stub },
      { tier: 2, cooldown: 8, effect: stub },
      { tier: 3, cooldown: 6, effect: stub },
    ],
  },

  terrainBlink: {
    id: 'terrainBlink', name: 'Terrain Blink', category: 'environment',
    description: 'Teleport the floor beneath you',
    tiers: [
      { tier: 1, cooldown: 12, effect: stub },
      { tier: 2, cooldown: 10, effect: stub },
      { tier: 3, cooldown: 8, effect: stub },
    ],
  },

  hazardNullify: {
    id: 'hazardNullify', name: 'Hazard Nullify', category: 'environment',
    description: 'Disable all hazards for 5s',
    tiers: [
      { tier: 1, cooldown: 15, effect: stub },
      { tier: 2, cooldown: 12, effect: stub },
      { tier: 3, cooldown: 10, effect: stub },
    ],
  },

  gravityZone: {
    id: 'gravityZone', name: 'Gravity Zone', category: 'environment',
    description: 'Create a low-gravity zone for 4s',
    tiers: [
      { tier: 1, cooldown: 12, effect: stub },
      { tier: 2, cooldown: 10, effect: stub },
      { tier: 3, cooldown: 8, effect: stub },
    ],
  },

  riftStorm: {
    id: 'riftStorm', name: 'Rift Storm', category: 'environment',
    description: 'Create a storm zone that damages enemies entering it',
    tiers: [
      { tier: 1, cooldown: 14, effect: stub },
      { tier: 2, cooldown: 12, effect: stub },
      { tier: 3, cooldown: 10, effect: stub },
    ],
  },

  // ══════════════════════════════════
  // CHAOS GLITCHES (5)
  // ══════════════════════════════════

  randomTeleport: {
    id: 'randomTeleport', name: 'Random Teleport', category: 'chaos',
    description: 'Teleport to a random screen location',
    tiers: [
      {
        tier: 1, cooldown: 6,
        effect(scene, player) {
          player.x = Phaser.Math.Between(100, scene.scale.width - 100);
          player.y = Phaser.Math.Between(100, scene.scale.height - 200);
          scene.cameras.main.flash(200, 255, 0, 255, false);
        },
      },
      { tier: 2, cooldown: 5, effect(scene, player) { player.x = Phaser.Math.Between(100, scene.scale.width - 100); player.y = Phaser.Math.Between(100, scene.scale.height - 200); scene.cameras.main.flash(200, 255, 0, 255, false); spawnAoePulse(scene, player.x, player.y, 80, 15, 0xff00ff); } },
      { tier: 3, cooldown: 4, effect(scene, player) { player.x = Phaser.Math.Between(100, scene.scale.width - 100); player.y = Phaser.Math.Between(100, scene.scale.height - 200); spawnAoePulse(scene, player.x, player.y, 140, 25, 0xff00ff); scene.cameras.main.flash(250, 255, 0, 255, false); } },
    ],
  },

  enemyInversion: {
    id: 'enemyInversion', name: 'Enemy Inversion', category: 'chaos',
    description: 'Invert enemy movement direction for 3s',
    tiers: [
      { tier: 1, cooldown: 10, effect: stub },
      { tier: 2, cooldown: 8, effect: stub },
      { tier: 3, cooldown: 7, effect: stub },
    ],
  },

  realityFragment: {
    id: 'realityFragment', name: 'Reality Fragment', category: 'chaos',
    description: 'Shatter reality — random effect fires',
    tiers: [
      { tier: 1, cooldown: 8, effect(scene, player) { const effects = [() => applyTimeDilation(scene, 0.3, 1500), () => spawnAoePulse(scene, player.x, player.y, 120, 20, 0xff00ff), () => { player.body.setVelocityY(-800); }]; Phaser.Utils.Array.GetRandom(effects)(); } },
      { tier: 2, cooldown: 7, effect: stub },
      { tier: 3, cooldown: 6, effect: stub },
    ],
  },

  timeMicro: {
    id: 'timeMicro', name: 'Time Micro-Rewind', category: 'chaos',
    description: 'Briefly rewind player 1s back in time',
    tiers: [
      { tier: 1, cooldown: 15, effect: stub },
      { tier: 2, cooldown: 12, effect: stub },
      { tier: 3, cooldown: 10, effect: stub },
    ],
  },

  systemCrash: {
    id: 'systemCrash', name: 'System Crash', category: 'chaos',
    description: 'Crash all enemy AI for 2s',
    tiers: [
      {
        tier: 1, cooldown: 14,
        effect(scene, player) {
          if (!scene.enemies) return;
          scene.enemies.getChildren().forEach(e => { e.aiCrashed = true; });
          scene.time.delayedCall(2000, () => {
            if (scene.enemies) scene.enemies.getChildren().forEach(e => { e.aiCrashed = false; });
          });
          scene.cameras.main.shake(200, 0.025);
        },
      },
      { tier: 2, cooldown: 12, effect: stub },
      { tier: 3, cooldown: 10, effect: stub },
    ],
  },

  // ══════════════════════════════════
  // SPECIAL GLITCHES (15) — boss drops
  // ══════════════════════════════════

  echoStep: {
    id: 'echoStep', name: 'Echo Step', category: 'special', isSpecial: true,
    description: 'Summon 2 mirror clones that attack for 4s',
    tiers: [
      {
        tier: 1, cooldown: 20,
        effect(scene, player) {
          for (let i = 0; i < 2; i++) {
            spawnGhostClone(scene, player);
          }
          scene.cameras.main.flash(200, 0, 255, 238, false);
        },
      },
      { tier: 2, cooldown: 18, effect: stub },
      { tier: 3, cooldown: 15, effect: stub },
    ],
  },

  gravityFlip: {
    id: 'gravityFlip', name: 'Gravity Flip', category: 'special', isSpecial: true,
    description: 'Invert world gravity for all for 3s',
    tiers: [
      {
        tier: 1, cooldown: 25,
        effect(scene, player) {
          scene.physics.world.gravity.y *= -1;
          scene.cameras.main.shake(300, 0.03);
          scene.cameras.main.flash(300, 150, 0, 255, false);
          scene.time.delayedCall(3000, () => {
            scene.physics.world.gravity.y = Math.abs(scene.physics.world.gravity.y);
          });
        },
      },
      { tier: 2, cooldown: 22, effect: stub },
      { tier: 3, cooldown: 18, effect: stub },
    ],
  },

  realityTear: {
    id: 'realityTear', name: 'Reality Tear', category: 'special', isSpecial: true,
    description: 'Create a rift dealing 80 AoE damage',
    tiers: [
      {
        tier: 1, cooldown: 18,
        effect(scene, player) {
          spawnAoePulse(scene, player.x, player.y, 180, 80, 0xff0055);
          scene.cameras.main.flash(400, 255, 0, 85, false);
          scene.cameras.main.shake(300, 0.03);
        },
      },
      { tier: 2, cooldown: 16, effect: stub },
      { tier: 3, cooldown: 14, effect: stub },
    ],
  },

  timeLoop: {
    id: 'timeLoop', name: 'Time Loop', category: 'special', isSpecial: true,
    description: 'Rewind player position 5s back',
    tiers: [
      { tier: 1, cooldown: 30, effect(scene, player) { if (player.positionHistory && player.positionHistory.length > 0) { const old = player.positionHistory[0]; player.setPosition(old.x, old.y); scene.cameras.main.flash(300, 100, 0, 200, false); } } },
      { tier: 2, cooldown: 25, effect: stub },
      { tier: 3, cooldown: 20, effect: stub },
    ],
  },

  glitchMastery: {
    id: 'glitchMastery', name: 'Glitch Mastery', category: 'special', isSpecial: true,
    description: 'All equipped glitches fire at tier 3 for 8s',
    tiers: [
      { tier: 1, cooldown: 60, effect(scene) { if (scene.glitchSystem) scene.glitchSystem.activateMastery(8000); scene.cameras.main.flash(500, 0, 255, 238, false); scene.cameras.main.shake(400, 0.04); } },
      { tier: 2, cooldown: 50, effect: stub },
      { tier: 3, cooldown: 40, effect: stub },
    ],
  },

  blackout: {
    id: 'blackout', name: 'Blackout', category: 'special', isSpecial: true,
    description: 'Screen goes dark — only player visible for 4s',
    tiers: [
      { tier: 1, cooldown: 20, effect: stub },
      { tier: 2, cooldown: 18, effect: stub },
      { tier: 3, cooldown: 15, effect: stub },
    ],
  },

  phaseStorm: {
    id: 'phaseStorm', name: 'Phase Storm', category: 'special', isSpecial: true,
    description: 'Rapid chain of 5 blink-attacks',
    tiers: [
      { tier: 1, cooldown: 22, effect: stub },
      { tier: 2, cooldown: 20, effect: stub },
      { tier: 3, cooldown: 17, effect: stub },
    ],
  },

  fractalDash: {
    id: 'fractalDash', name: 'Fractal Dash', category: 'special', isSpecial: true,
    description: 'Dash that shatters into damaging fragments',
    tiers: [
      { tier: 1, cooldown: 18, effect: stub },
      { tier: 2, cooldown: 16, effect: stub },
      { tier: 3, cooldown: 14, effect: stub },
    ],
  },

  staticStorm: {
    id: 'staticStorm', name: 'Static Storm', category: 'special', isSpecial: true,
    description: 'Call down lightning strikes on all enemies',
    tiers: [
      {
        tier: 1, cooldown: 20,
        effect(scene) {
          if (!scene.enemies) return;
          scene.enemies.getChildren().forEach(e => {
            if (e.active) {
              spawnLightningStrike(scene, e.x, e.y);
              scene.time.delayedCall(150, () => { if (e.active) e.takeDamage(30); });
            }
          });
          scene.cameras.main.shake(400, 0.025);
        },
      },
      { tier: 2, cooldown: 18, effect: stub },
      { tier: 3, cooldown: 15, effect: stub },
    ],
  },

  riftNova: {
    id: 'riftNova', name: 'Rift Nova', category: 'special', isSpecial: true,
    description: 'Explosive rift expands from player',
    tiers: [
      { tier: 1, cooldown: 22, effect(scene, player) { spawnAoePulse(scene, player.x, player.y, 250, 50, 0xff2bff); scene.cameras.main.shake(350, 0.035); } },
      { tier: 2, cooldown: 19, effect: stub },
      { tier: 3, cooldown: 16, effect: stub },
    ],
  },

  voidShield: {
    id: 'voidShield', name: 'Void Shield', category: 'special', isSpecial: true,
    description: 'Absorb all damage for 3s',
    tiers: [
      { tier: 1, cooldown: 25, effect(scene, player) { player.invincible = true; scene.time.delayedCall(3000, () => { player.invincible = false; }); } },
      { tier: 2, cooldown: 22, effect: stub },
      { tier: 3, cooldown: 18, effect: stub },
    ],
  },

  chronoPulse: {
    id: 'chronoPulse', name: 'Chrono Pulse', category: 'special', isSpecial: true,
    description: 'Freeze all enemies for 2s',
    tiers: [
      { tier: 1, cooldown: 20, effect(scene) { applyTimeDilation(scene, 0, 2000); } },
      { tier: 2, cooldown: 18, effect: stub },
      { tier: 3, cooldown: 15, effect: stub },
    ],
  },

  dataOverflow: {
    id: 'dataOverflow', name: 'Data Overflow', category: 'special', isSpecial: true,
    description: 'Overload nearest enemy — instant 60% HP loss',
    tiers: [
      { tier: 1, cooldown: 15, effect(scene, player) { const e = findNearestEnemy(scene, player, 300); if (e) e.takeDamage(e.maxHealth * 0.6); } },
      { tier: 2, cooldown: 13, effect: stub },
      { tier: 3, cooldown: 11, effect: stub },
    ],
  },

  mirrorWorld: {
    id: 'mirrorWorld', name: 'Mirror World', category: 'special', isSpecial: true,
    description: 'Flip the arena horizontally for 5s',
    tiers: [
      { tier: 1, cooldown: 30, effect: stub },
      { tier: 2, cooldown: 25, effect: stub },
      { tier: 3, cooldown: 20, effect: stub },
    ],
  },

  coreCollapse: {
    id: 'coreCollapse', name: 'Core Collapse', category: 'special', isSpecial: true,
    description: 'The final glitch: massive field wipes all enemies',
    tiers: [
      {
        tier: 1, cooldown: 45,
        effect(scene, player) {
          spawnAoePulse(scene, player.x, player.y, 400, 999, 0xff0000);
          scene.cameras.main.flash(600, 255, 0, 0, false);
          scene.cameras.main.shake(600, 0.05);
        },
      },
      { tier: 2, cooldown: 40, effect: stub },
      { tier: 3, cooldown: 35, effect: stub },
    ],
  },
};

// ══════════════════════════════════
// Helper effect functions
// ══════════════════════════════════

function spawnGlitchTrail(scene, player, color) {
  const trail = scene.add.rectangle(player.x, player.y, player.width, player.height, color, 0.5)
    .setDepth(19);
  scene.tweens.add({ targets: trail, alpha: 0, scaleX: 1.5, duration: 300, onComplete: () => trail.destroy() });
}

function spawnAfterimage(scene, player, color) {
  const img = scene.add.rectangle(player.x, player.y, player.width, player.height, color, 0.6)
    .setDepth(19);
  scene.tweens.add({ targets: img, alpha: 0, scaleX: 0.5, scaleY: 0.5, duration: 400, onComplete: () => img.destroy() });
}

function spawnGhostClone(scene, player) {
  const clone = scene.add.rectangle(player.x + (player.flipX ? -40 : 40), player.y, player.width, player.height, 0x00ffee, 0.7)
    .setDepth(19);
  let life = 0;
  const tick = scene.time.addEvent({
    delay: 600, repeat: 6,
    callback() {
      if (!scene.enemies) return;
      scene.enemies.getChildren().forEach(e => {
        if (e.active && Phaser.Math.Distance.Between(clone.x, clone.y, e.x, e.y) < 100) {
          e.takeDamage(12);
        }
      });
      clone.x += (player.flipX ? -1 : 1) * 30;
      life++;
    },
  });
  scene.time.delayedCall(4200, () => { clone.destroy(); tick.destroy(); });
}

function activatePhase(scene, player, duration, color) {
  player.phasing = true;
  player.setAlpha(0.5);
  player.setTint(color);
  if (scene.platformCollider) scene.platformCollider.active = false;
  scene.time.delayedCall(duration, () => {
    player.phasing = false;
    player.setAlpha(1);
    player.clearTint();
    if (scene.platformCollider) scene.platformCollider.active = true;
  });
}

function applyTimeDilation(scene, scale, duration) {
  if (!scene.enemies) return;
  const tintColor = scale === 0 ? 0x8888ff : 0xaaaaff;
  scene.enemies.getChildren().forEach(e => {
    if (e.active) {
      e.glitchSlowed = true;
      e.speedScale = scale;
      e.setTint(tintColor);
    }
  });
  // Noir overlay
  const overlay = scene.add.rectangle(0, 0, scene.scale.width * 2, scene.scale.height * 2, 0x000033, 0.2)
    .setScrollFactor(0).setDepth(45).setOrigin(0);
  scene.time.delayedCall(duration, () => {
    if (scene.enemies) {
      scene.enemies.getChildren().forEach(e => {
        if (e.active) { e.glitchSlowed = false; e.speedScale = 1; e.clearTint(); }
      });
    }
    overlay.destroy();
  });
}

function spawnAoePulse(scene, x, y, radius, damage, color) {
  const circle = scene.add.circle(x, y, 5, color, 0.8).setDepth(49);
  scene.tweens.add({
    targets: circle,
    radius: radius,
    alpha: 0,
    duration: 400,
    ease: 'Sine.easeOut',
    onUpdate() {
      if (scene.enemies) {
        scene.enemies.getChildren().forEach(e => {
          if (e.active && !e._pulsed && Phaser.Math.Distance.Between(x, y, e.x, e.y) <= circle.radius) {
            e._pulsed = true;
            e.takeDamage(damage);
            scene.time.delayedCall(500, () => { e._pulsed = false; });
          }
        });
      }
    },
    onComplete: () => circle.destroy(),
  });
}

function spawnLightningStrike(scene, x, y) {
  const flash = scene.add.rectangle(x, y - 40, 4, 80, 0xffff00, 1).setDepth(49);
  scene.tweens.add({ targets: flash, alpha: 0, duration: 250, onComplete: () => flash.destroy() });
}

function findNearestEnemy(scene, player, maxDist) {
  if (!scene.enemies) return null;
  let nearest = null, minDist = maxDist;
  scene.enemies.getChildren().forEach(e => {
    if (!e.active) return;
    const d = Phaser.Math.Distance.Between(player.x, player.y, e.x, e.y);
    if (d < minDist) { minDist = d; nearest = e; }
  });
  return nearest;
}
