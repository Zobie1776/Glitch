import BaseEnemy from './BaseEnemy.js';
import { ENEMY_CONFIGS } from '../../data/enemyConfig.js';

export default class Attacker extends BaseEnemy {
  constructor(scene, x, y, overrides = {}) {
    super(scene, x, y, { ...ENEMY_CONFIGS.attacker, ...overrides });
  }
}
