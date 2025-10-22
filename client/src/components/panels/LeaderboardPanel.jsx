import React, { useEffect, useState } from 'react';
import { apiClient } from '../../state/useAuth.js';

export default function LeaderboardPanel({ onBack }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    apiClient('/leaderboards')
      .then((response) => response.json())
      .then((data) => setEntries(data.leaderboard || []));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Top Players</h2>
        <button className="btn-secondary" onClick={onBack}>Back</button>
      </div>
      <ul className="divide-y divide-slate-800">
        {entries.map((entry, index) => (
          <li key={entry.player + index} className="flex justify-between py-2 text-sm">
            <span className="text-slate-200">#{index + 1} {entry.player}</span>
            <span className="text-slate-400">Level {entry.level}</span>
            <span className="text-glitch-neon">{entry.gems} gems</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
