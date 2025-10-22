import React from 'react';

export default function HUD({ stats, onExit }) {
  return (
    <div className="fixed inset-x-0 top-0 flex justify-between px-6 py-4 pointer-events-none">
      <div className="pointer-events-auto bg-slate-900/70 border border-slate-700 px-4 py-2 rounded-lg shadow-lg">
        <p className="text-sm text-slate-300">Level {stats.level}</p>
        <p className="text-glitch-neon font-semibold">{stats.gems} gems</p>
      </div>
      <button
        className="pointer-events-auto btn-secondary"
        onClick={onExit}
      >
        Exit
      </button>
    </div>
  );
}
