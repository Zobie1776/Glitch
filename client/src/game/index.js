import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import GameScene from './scenes/GameScene.js';
import BossIntroScene from './scenes/BossIntroScene.js';
import ArenaScene from './scenes/ArenaScene.js';
import LevelCompleteScene from './scenes/LevelCompleteScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import PauseScene from './scenes/PauseScene.js';
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY } from './constants.js';

let gameInstance = null;

export function startGame(mountId) {
  if (gameInstance) {
    gameInstance.destroy(true);
    gameInstance = null;
  }

  gameInstance = new Phaser.Game({
    type: Phaser.AUTO,
    parent: mountId,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    pixelArt: true,
    backgroundColor: '#05030a',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: GRAVITY },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [
      BootScene,
      PreloadScene,
      MainMenuScene,
      GameScene,
      BossIntroScene,
      ArenaScene,
      LevelCompleteScene,
      GameOverScene,
      PauseScene,
    ],
  });

  return gameInstance;
}

export function destroyGame() {
  if (gameInstance) {
    gameInstance.destroy(true);
    gameInstance = null;
  }
}
