import BaseEnemy from './BaseEnemy.js';
import { ENEMY_CONFIGS } from '../../data/enemyConfig.js';

export default class BasicChaser extends BaseEnemy {
  constructor(scene, x, y, overrides = {}) {
    super(scene, x, y, { ...ENEMY_CONFIGS.basicChaser, ...overrides });
  }
}
