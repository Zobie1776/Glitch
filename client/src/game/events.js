const levelCompleteListeners = new Set();
const deathListeners = new Set();
const hudListeners = new Set();

export function emitLevelComplete(payload) {
  levelCompleteListeners.forEach((listener) => listener(payload));
}

export function emitPlayerDeath(payload) {
  deathListeners.forEach((listener) => listener(payload));
}

export function onLevelComplete(listener) {
  levelCompleteListeners.add(listener);
  return () => levelCompleteListeners.delete(listener);
}

export function onPlayerDeath(listener) {
  deathListeners.add(listener);
  return () => deathListeners.delete(listener);
}

export function emitHudUpdate(payload) {
  hudListeners.forEach((listener) => listener(payload));
}

export function onHudUpdate(listener) {
  hudListeners.add(listener);
  return () => hudListeners.delete(listener);
}
