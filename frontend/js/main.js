import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import UIScene from './scenes/UIScene.js';
import GameScene from './scenes/GameScene.js';
import CreditsScene from './scenes/CreditsScene.js';
import { api } from './services/api.js';

function setupAuthOverlay(game) {
  const overlay = document.getElementById('ui-overlay');
  const form = document.getElementById('auth-form');
  const buttons = Array.from(form.querySelectorAll('button'));

  const stored = localStorage.getItem('glitch-auth');
  if (stored) {
    const auth = JSON.parse(stored);
    game.registry.set('auth', auth);
    overlay.classList.add('hidden');
  } else {
    overlay.classList.remove('hidden');
  }

  buttons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const credentials = Object.fromEntries(formData.entries());
      const mode = event.currentTarget.dataset.mode;
      (mode === 'register' ? api.register(credentials) : api.login(credentials))
        .then((auth) => {
          localStorage.setItem('glitch-auth', JSON.stringify(auth));
          game.registry.set('auth', auth);
          overlay.classList.add('hidden');
        })
        .catch((error) => {
          alert(`Authentication failed: ${error.message}`);
        });
    });
  });
}

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 960,
  height: 540,
  backgroundColor: '#05020f',
  pixelArt: true,
  roundPixels: true,
  disableContextMenu: true,
  fps: { target: 60, forceSetTimeOut: true },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 680 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540
  },
  scene: [BootScene, MenuScene, UIScene, GameScene, CreditsScene]
};

const game = new Phaser.Game(config);

game.globals = {
  settings: {
    soundEnabled: true
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setupAuthOverlay(game);
});
