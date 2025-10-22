import Phaser from 'phaser';
import MainScene from './scenes/MainScene.js';
import { emitLevelComplete, emitPlayerDeath, onLevelComplete, onPlayerDeath } from './events.js';
import { saveProgress } from '../state/saveManager.js';

let gameInstance = null;
let cleanupHandlers = [];

export async function startGame({ mountId, onSession, settings }) {
  if (gameInstance) {
    if (settings) {
      gameInstance.registry.set('settings', settings);
      gameInstance.events.emit('settings:changed', settings);
    }
    return gameInstance;
  }

  const config = {
    type: Phaser.AUTO,
    parent: mountId,
    width: 960,
    height: 540,
    pixelArt: true,
    backgroundColor: '#05030a',
    fps: { target: 60, forceSetTimeOut: true },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
        gravity: { y: 1000 },
      },
    },
    scene: [MainScene],
  };

  gameInstance = new Phaser.Game(config);
  if (settings) {
    gameInstance.registry.set('settings', settings);
  }

  cleanupHandlers.push(
    onLevelComplete(async (payload) => {
      await saveProgress(payload);
      onSession(payload);
    })
  );

  cleanupHandlers.push(
    onPlayerDeath((payload) => {
      onSession(payload);
    })
  );

  if (settings) {
    gameInstance.events.emit('settings:changed', settings);
  }

  return gameInstance;
}

export function destroyGame() {
  if (gameInstance) {
    gameInstance.destroy(true);
    gameInstance = null;
  }
  cleanupHandlers.forEach((cleanup) => cleanup());
  cleanupHandlers = [];
}

export { onLevelComplete, onPlayerDeath, emitLevelComplete, emitPlayerDeath };
