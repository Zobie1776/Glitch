import React, { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../../state/useAuth.js';

const VIEW_OPTIONS = [
  { id: 'seasonal', label: 'Seasonal' },
  { id: 'all-time', label: 'All-Time' }
];

export default function LeaderboardPanel({ onBack }) {
  const [seasonal, setSeasonal] = useState([]);
  const [allTime, setAllTime] = useState([]);
  const [seasonStart, setSeasonStart] = useState(null);
  const [view, setView] = useState('seasonal');

  useEffect(() => {
    apiClient('/leaderboards/seasonal')
      .then((response) => response.json())
      .then((data) => {
        setSeasonStart(data.seasonStart ? new Date(data.seasonStart) : null);
        setSeasonal(data.leaderboard || []);
      });
    apiClient('/leaderboards/all-time')
      .then((response) => response.json())
      .then((data) => setAllTime(data.leaderboard || []));
  }, []);

  const entries = view === 'seasonal' ? seasonal : allTime;
  const title = view === 'seasonal' ? 'Seasonal Champions' : 'Hall of Fame';
  const seasonLabel = useMemo(() => {
    if (!seasonStart) return null;
    return seasonStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }, [seasonStart]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-glitch-neon">{title}</h2>
          {view === 'seasonal' && seasonLabel && (
            <p className="text-xs text-slate-400 uppercase tracking-[0.4em]">Season began {seasonLabel}</p>
          )}
        </div>
        <div className="flex gap-2">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.id}
              className={`px-3 py-1 text-xs uppercase tracking-[0.3em] rounded-full border transition-colors ${view === option.id ? 'border-glitch-neon text-glitch-neon' : 'border-slate-700 text-slate-400 hover:border-glitch-neon/40'}`}
              onClick={() => setView(option.id)}
            >
              {option.label}
            </button>
          ))}
          <button className="btn-secondary" onClick={onBack}>Back</button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5">
        <ul className="divide-y divide-slate-800/60">
          {entries.map((entry, index) => (
            <li key={`${entry.userId}-${index}`} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div className="flex items-center gap-3 text-slate-200">
                <span className="text-glitch-neon text-base">#{index + 1}</span>
                <span className="uppercase tracking-[0.3em] text-xs">{entry.displayName}</span>
              </div>
              <div className="flex items-center gap-4 text-xs uppercase tracking-[0.3em] text-slate-400">
                <span>Level {entry.level}</span>
                <span>Score {entry.score}</span>
                <span className="text-glitch-neon">{entry.gems} Gems</span>
              </div>
            </li>
          ))}
          {entries.length === 0 && (
            <li className="py-6 text-center text-xs text-slate-500 uppercase tracking-[0.4em]">No entries recorded yet. Be the first.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
