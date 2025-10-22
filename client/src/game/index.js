import Phaser from 'phaser';
import MainScene from './scenes/MainScene.js';
import { emitLevelComplete, emitPlayerDeath, onLevelComplete, onPlayerDeath } from './events.js';
import { saveProgress } from '../state/saveManager.js';

let gameInstance = null;
let cleanupHandlers = [];

export async function startGame({ mountId, onSession }) {
  if (gameInstance) {
    return gameInstance;
  }

  const config = {
    type: Phaser.AUTO,
    parent: mountId,
    width: 960,
    height: 540,
    pixelArt: true,
    backgroundColor: '#05030a',
    physics: { default: 'arcade', arcade: { debug: false, gravity: { y: 0 } } },
    scene: [MainScene]
  };

  gameInstance = new Phaser.Game(config);

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
