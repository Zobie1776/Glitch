import React, { useMemo, useState } from 'react';

const DEFAULT_GEAR = [
  { slot: 'Helm', rarity: 'Rare', name: 'Axiom Visor', stats: { DEF: '+12', Crit: '+4%' } },
  { slot: 'Body', rarity: 'Epic', name: 'Nova Carapace', stats: { HP: '+180', DEF: '+6' } },
  { slot: 'Gloves', rarity: 'Uncommon', name: 'Pulse Weavers', stats: { ATK: '+16', AttackSPD: '+5%' } },
  { slot: 'Leggings', rarity: 'Rare', name: 'Grav Cyclers', stats: { MoveSPD: '+8%', Cooldown: '+6%' } },
  { slot: 'Accessory', rarity: 'Legendary', name: 'Rift Catalyst', stats: { Crit: '+12%', Glitch: '+1 charge' } }
];

const SKINS = [
  { id: 'default-rift-runner', name: 'Default Runner', price: 0 },
  { id: 'skin_cyber_ronin', name: 'Cyber Ronin', price: 1200 },
  { id: 'skin_void_drifter', name: 'Void Drifter', price: 1500 }
];

const LOADOUT_GLYPHS = ['⚡', '✦', '☄', '⟳', '⧖'];

export default function CustomizationPanel({ onBack }) {
  const [selectedSkin, setSelectedSkin] = useState('skin_cyber_ronin');
  const [hoveredItem, setHoveredItem] = useState(DEFAULT_GEAR[0]);

  const summary = useMemo(() => {
    return DEFAULT_GEAR.reduce(
      (acc, gear) => {
        Object.entries(gear.stats).forEach(([key, value]) => {
          acc[key] = acc[key] ? `${acc[key]} / ${value}` : value;
        });
        return acc;
      },
      {}
    );
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold uppercase tracking-[0.4em] text-glitch-neon">Loadout & Style</h2>
        <button className="btn-secondary" onClick={onBack}>Back</button>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.4fr,1fr]">
        <section className="glass-panel rounded-2xl p-5 space-y-4">
          <header className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Gear Slots</h3>
              <p className="text-xs text-slate-400 uppercase tracking-widest">Tap a slot to preview stats</p>
            </div>
            <span className="text-xs text-slate-400">Total Power: <strong className="text-glitch-neon">1245</strong></span>
          </header>
          <ul className="grid gap-3 sm:grid-cols-2">
            {DEFAULT_GEAR.map((gear, index) => (
              <li
                key={gear.slot}
                className={`rounded-xl border border-slate-800/70 bg-slate-950/50 p-4 cursor-pointer transition-transform hover:-translate-y-1 ${hoveredItem.slot === gear.slot ? 'shadow-glitch-neon/40 shadow-lg border-glitch-neon/50' : ''}`}
                onMouseEnter={() => setHoveredItem(gear)}
              >
                <p className="text-xs text-slate-400 uppercase tracking-widest">{gear.slot}</p>
                <p className="text-glitch-neon text-lg">{gear.name}</p>
                <p className="text-[0.65rem] text-slate-400">{gear.rarity}</p>
                <div className="mt-2 text-xs text-slate-200 space-y-1">
                  {Object.entries(gear.stats).map(([key, value]) => (
                    <p key={key}>{key}: <span className="text-glitch-neon/90">{value}</span></p>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <aside className="glass-panel rounded-2xl p-5 space-y-4">
          <h3 className="text-lg font-semibold">Stat Summary</h3>
          <ul className="grid grid-cols-2 gap-3 text-xs text-slate-300 uppercase tracking-widest">
            {Object.entries(summary).map(([key, value], index) => (
              <li key={key} className="rounded-lg border border-slate-800/70 bg-slate-900/60 px-3 py-3 flex items-center gap-3">
                <span className="text-glitch-neon text-base">{LOADOUT_GLYPHS[index % LOADOUT_GLYPHS.length]}</span>
                <div>
                  <p>{key}</p>
                  <p className="text-glitch-cyan/80 text-[0.65rem]">{value}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-800/60 pt-4 space-y-2">
            <p className="text-xs text-slate-400 uppercase tracking-[0.4em]">Active Skin</p>
            <div className="flex gap-2">
              {SKINS.map((skin) => (
                <button
                  key={skin.id}
                  onClick={() => setSelectedSkin(skin.id)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${selectedSkin === skin.id ? 'border-glitch-neon/70 text-glitch-neon' : 'border-slate-700/60 text-slate-300 hover:border-glitch-neon/40'}`}
                >
                  {skin.name}
                  {skin.price > 0 && (
                    <span className="block text-[0.65rem] text-slate-500">{skin.price} gems</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <section className="glass-panel rounded-2xl p-5 space-y-3">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Glitch Skill Loadout</h3>
            <p className="text-xs text-slate-400 uppercase tracking-[0.4em]">Unlocked 3 / 5</p>
          </div>
          <button className="btn-secondary text-xs uppercase tracking-[0.4em]">Manage Slots</button>
        </header>
        <ul className="grid gap-3 sm:grid-cols-3">
          {[
            { name: 'Echo Warp', desc: 'Afterimage blades trail you for 4s', readyIn: 'Ready' },
            { name: 'Phase Break', desc: 'World slows to 40% for 2s', readyIn: '12s' },
            { name: 'Static Storm', desc: 'Radial stun pulses', readyIn: '28s' }
          ].map((skill) => (
            <li key={skill.name} className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4">
              <h4 className="font-semibold text-glitch-neon">{skill.name}</h4>
              <p className="text-[0.7rem] text-slate-300">{skill.desc}</p>
              <p className="mt-2 text-[0.65rem] text-slate-500">Cooldown: {skill.readyIn}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
