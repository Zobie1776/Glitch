import React from 'react';
import { useSettings } from '../../state/useSettings.js';

export default function SettingsPanel({ onBack }) {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Settings</h2>
        <button className="btn-secondary" onClick={onBack}>Back</button>
      </div>
      <div className="space-y-4 text-sm text-slate-300">
        <label className="flex items-center justify-between gap-4">
          <span>Music</span>
          <input
            type="checkbox"
            className="toggle"
            checked={settings.music}
            onChange={(event) => updateSettings({ music: event.target.checked })}
          />
        </label>
        <label className="flex items-center justify-between gap-4">
          <span>SFX</span>
          <input
            type="checkbox"
            className="toggle"
            checked={settings.sfx}
            onChange={(event) => updateSettings({ sfx: event.target.checked })}
          />
        </label>
        <label className="flex items-center justify-between gap-4">
          <span>Music Volume</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.musicVolume}
            onChange={(event) => updateSettings({ musicVolume: Number(event.target.value) })}
          />
        </label>
        <label className="flex items-center justify-between gap-4">
          <span>SFX Volume</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.sfxVolume}
            onChange={(event) => updateSettings({ sfxVolume: Number(event.target.value) })}
          />
        </label>
        <label className="flex items-center justify-between gap-4">
          <span>Show damage numbers</span>
          <input
            type="checkbox"
            className="toggle"
            checked={settings.showDamage}
            onChange={(event) => updateSettings({ showDamage: event.target.checked })}
          />
        </label>
        <label className="flex items-center justify-between gap-4">
          <span>Controller hints</span>
          <input
            type="checkbox"
            className="toggle"
            checked={settings.controllerHints}
            onChange={(event) => updateSettings({ controllerHints: event.target.checked })}
          />
        </label>
      </div>
      <p className="text-xs text-slate-500">
        Settings are saved locally and applied immediately inside the Rift.
      </p>
    </div>
  );
}
