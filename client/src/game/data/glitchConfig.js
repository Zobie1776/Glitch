export const GLITCH_CONFIG = {
  baseline: {
    interval: 32,
    invertDuration: 1.1,
    cameraShake: { duration: 160, intensity: 0.012 },
    shaderIntensity: 0.65
  },
  skills: {
    echoWarp: {
      key: 'echoWarp',
      name: 'Echo Warp',
      cooldown: 22,
      duration: 4,
      trailInterval: 0.16,
      damage: 30
    },
    phaseBreak: {
      key: 'phaseBreak',
      name: 'Phase Break',
      cooldown: 28,
      worldSlow: 0.4,
      duration: 2.4
    },
    fractalDash: {
      key: 'fractalDash',
      name: 'Fractal Dash',
      cooldown: 16,
      distance: 220,
      aoeRadius: 120,
      aoeDamage: 45
    },
    staticStorm: {
      key: 'staticStorm',
      name: 'Static Storm',
      cooldown: 30,
      pulses: 4,
      pulseInterval: 0.45,
      radius: 280,
      damage: 24,
      stunDuration: 1.1
    },
    realityShift: {
      key: 'realityShift',
      name: 'Reality Shift',
      cooldown: 34,
      duration: 3,
      gravityScale: -1
    }
  }
};
