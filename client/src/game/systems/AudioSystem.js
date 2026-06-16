// Audio stub — all methods are no-ops until real audio assets are added
export default class AudioSystem {
  constructor(scene) { this.scene = scene; this.musicKey = null; }
  play(key, config = {}) {}
  playMusic(key, loop = true) { this.musicKey = key; }
  stopMusic() { this.musicKey = null; }
  setVolume(v) {}
  setMusicVolume(v) {}
  setSfxVolume(v) {}
}
