import React from 'react';

export default function SettingsPanel({ onBack }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Settings</h2>
        <button className="btn-secondary" onClick={onBack}>Back</button>
      </div>
      <div className="space-y-3 text-sm text-slate-300">
        <label className="flex items-center justify-between">
          <span>Music</span>
          <input type="checkbox" defaultChecked className="toggle" />
        </label>
        <label className="flex items-center justify-between">
          <span>SFX</span>
          <input type="checkbox" defaultChecked className="toggle" />
        </label>
        <label className="flex items-center justify-between">
          <span>Show damage numbers</span>
          <input type="checkbox" defaultChecked className="toggle" />
        </label>
      </div>
    </div>
  );
}
