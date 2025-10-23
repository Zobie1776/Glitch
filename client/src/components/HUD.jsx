import React, { useEffect, useState } from 'react';
import { onHudUpdate } from '../game/events.js';

export default function HUD({ stats, onExit }) {
  const [hudState, setHudState] = useState({
    health: 150,
    maxHealth: 150,
    gems: stats.gems ?? 0,
    meleeCooldown: 0,
    meleeRemaining: 0,
    rangedCooldown: 0,
    rangedRemaining: 0,
    glitchSkill: { name: 'Glitch Burst', cooldown: 20, remaining: 0 },
    dashCooldown: 6,
    dashRemaining: 0,
    weapon: 'Mono Blade',
    score: 0,
    timer: 0,
  });

  useEffect(() => {
    const cleanup = onHudUpdate((payload) => {
      setHudState((prev) => ({
        ...prev,
        ...payload,
        glitchSkill: { ...prev.glitchSkill, ...(payload.glitchSkill || {}) }
      }));
    });
    return cleanup;
  }, []);

  useEffect(() => {
    setHudState((prev) => ({ ...prev, gems: stats.gems ?? prev.gems }));
  }, [stats.gems]);

  const healthPercent = Math.max(0, Math.min(1, hudState.health / (hudState.maxHealth || 1)));
  const glitchCooldownProgress = hudState.glitchSkill.cooldown
    ? 1 - Math.min(1, (hudState.glitchSkill.remaining ?? 0) / hudState.glitchSkill.cooldown)
    : 1;

  return (
    <div className="hud-shell">
      <div className="hud-card space-y-3 w-full max-w-xl">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1">
            <p className="text-[0.6rem] text-slate-400 uppercase tracking-[0.4em]">Vitality</p>
            <div className="hud-bar mt-1">
              <div className="hud-bar__fill" style={{ width: `${healthPercent * 100}%` }} />
            </div>
            <p className="text-[0.65rem] text-slate-300 mt-1">{Math.round(hudState.health)}/{hudState.maxHealth} HP</p>
          </div>
          <div className="text-right">
            <p className="text-[0.6rem] text-slate-400 uppercase tracking-[0.4em]">Loadout</p>
            <p className="text-sm text-slate-200">{hudState.weapon}</p>
            <p className="text-[0.65rem] text-glitch-neon">{hudState.gems} Gems</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-[0.6rem] uppercase tracking-[0.4em] text-slate-300">
          <div>
            <p className="text-slate-400">Melee</p>
            <p>{hudState.meleeRemaining ? `${hudState.meleeRemaining.toFixed(1)}s` : 'Ready'}</p>
          </div>
          <div>
            <p className="text-slate-400">Ranged</p>
            <p>{hudState.rangedRemaining ? `${hudState.rangedRemaining.toFixed(1)}s` : 'Ready'}</p>
          </div>
          <div>
            <p className="text-slate-400">Dash</p>
            <p>{hudState.dashRemaining ? `${hudState.dashRemaining.toFixed(1)}s` : 'Primed'}</p>
          </div>
        </div>
      </div>
      <div className="flex items-start gap-4 pointer-events-auto">
        <div className="cooldown-ring" style={{ '--progress': glitchCooldownProgress }} data-ready={glitchCooldownProgress >= 0.99}>
          <span className="cooldown-ring__label">{hudState.glitchSkill.remaining ? `${hudState.glitchSkill.remaining.toFixed(0)}s` : 'GO'}</span>
        </div>
        <div className="glass-panel rounded-xl px-4 py-3 text-xs uppercase tracking-[0.4em] text-slate-200">
          <p>Score {Math.round(hudState.score)}</p>
          <p className="text-[0.6rem] text-slate-400">Timer {hudState.timer.toFixed(1)}s</p>
          <button
            className="btn-secondary mt-2 w-full"
            onClick={onExit}
          >
            Exit Run
          </button>
        </div>
      </div>
    </div>
  );
}
