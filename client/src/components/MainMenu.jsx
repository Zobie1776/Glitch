import React, { useMemo, useState } from 'react';
import LeaderboardPanel from './panels/LeaderboardPanel.jsx';
import ShopPanel from './panels/ShopPanel.jsx';
import SettingsPanel from './panels/SettingsPanel.jsx';
import CustomizationPanel from './panels/CustomizationPanel.jsx';

const OAUTH_PROVIDERS = [
  { id: 'google', label: 'Google', accent: 'from-rose-400 to-orange-400' },
  { id: 'apple', label: 'Apple', accent: 'from-slate-200 to-slate-500' },
  { id: 'facebook', label: 'Facebook', accent: 'from-sky-400 to-indigo-500' }
];

function OAuthButtons() {
  return (
    <div className="grid gap-2">
      {OAUTH_PROVIDERS.map((provider) => (
        <button
          key={provider.id}
          type="button"
          onClick={() => { window.location.href = `/api/auth/${provider.id}`; }}
          className={`w-full rounded-md bg-gradient-to-r ${provider.accent} px-3 py-2 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5`}
        >
          Continue with {provider.label}
        </button>
      ))}
    </div>
  );
}

function AuthForm({ onSubmit, title }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({ email, password, displayName });
        }}
      >
        <h3 className="text-lg font-semibold text-glitch-neon">{title}</h3>
        <input className="input" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        {title === 'Register' && (
          <input className="input" placeholder="Display Name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        )}
        <input className="input" placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <button type="submit" className="btn-primary">Submit</button>
      </form>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">or jack in with</p>
        <OAuthButtons />
        <p className="text-[0.65rem] text-slate-500">
          OAuth flows drop you back here with a synced neon session.
        </p>
      </div>
    </div>
  );
}

export default function MainMenu({ user, onLogin, onRegister, onLogout, onStart, onContinue, onLeaderboard, onShop, screen, stats }) {
  const [view, setView] = useState('main');
  const [error, setError] = useState('');

  const sessionSummary = useMemo(() => ({
    level: stats.level ?? 1,
    gems: stats.gems ?? 0,
    ascended: Boolean(stats.ascended)
  }), [stats]);

  const handleLogin = async (payload) => {
    try {
      await onLogin(payload);
      setView('main');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegister = async (payload) => {
    try {
      await onRegister(payload);
      setView('main');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="glass-panel rounded-3xl p-6 md:p-8 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-glitch-neon tracking-[0.4em] uppercase">GLITCH//RIFT</h1>
          <p className="text-xs text-slate-400 uppercase tracking-[0.4em]">Neon roguelite prototype build</p>
        </div>
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-300">Hi, {user.displayName}</span>
            <button onClick={onLogout} className="btn-secondary">Logout</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => { setView('login'); setError(''); }}>Login</button>
            <button className="btn-secondary" onClick={() => { setView('register'); setError(''); }}>Register</button>
          </div>
        )}
      </header>

      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

      {view === 'main' && (
        <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <button className="btn-primary h-16 text-lg" onClick={onStart}>Play</button>
              <button className="btn-primary h-16 text-lg disabled:opacity-40" onClick={onContinue} disabled={!user}>Continue</button>
              <button className="btn-secondary h-16" onClick={() => { onLeaderboard(); setView('leaderboard'); }}>Leaderboards</button>
              <button className="btn-secondary h-16" onClick={() => { onShop(); setView('shop'); }}>Shop</button>
            </div>
            <div className="grid md:grid-cols-3 gap-3 text-xs uppercase tracking-[0.4em] text-slate-300">
              <button className="glass-panel rounded-xl px-4 py-3 text-left" onClick={() => setView('settings')}>
                <p className="text-[0.65rem] text-slate-400">SYSTEM</p>
                <p className="text-glitch-neon text-lg normal-case">Settings</p>
                <p className="mt-1 text-[0.6rem] text-slate-500">Audio sliders, HUD toggles, controller hints.</p>
              </button>
              <button className="glass-panel rounded-xl px-4 py-3 text-left" onClick={() => setView('customize')}>
                <p className="text-[0.65rem] text-slate-400">ARMORY</p>
                <p className="text-glitch-neon text-lg normal-case">Customization</p>
                <p className="mt-1 text-[0.6rem] text-slate-500">Inventory, glitch skills & cosmetics.</p>
              </button>
              <div className="glass-panel rounded-xl px-4 py-3">
                <p className="text-[0.65rem] text-slate-400">RIFT STATUS</p>
                <p className="text-slate-200 text-lg normal-case">Level {sessionSummary.level}</p>
                <p className="text-slate-400 text-[0.65rem]">{sessionSummary.gems} Gems banked</p>
                {sessionSummary.ascended && <p className="text-emerald-400 text-[0.65rem]">Ascension complete</p>}
              </div>
            </div>
          </div>
          <div className="glass-panel rounded-2xl px-5 py-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-100">Run Intel</h2>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>Next Biome: <span className="text-glitch-neon">Industrial Megasprawl</span></li>
              <li>Unlocked glitch skills: <span className="text-glitch-neon">{user?.unlockedGlitchSkills?.length ?? 1}/5</span></li>
              <li>Leaderboard rank: <span className="text-glitch-neon">Chase the top 100</span></li>
            </ul>
            <p className="text-[0.65rem] text-slate-500 uppercase tracking-[0.4em]">Progress auto-saves at the end of each level.</p>
          </div>
        </div>
      )}

      {view === 'login' && <AuthForm title="Login" onSubmit={handleLogin} />}
      {view === 'register' && <AuthForm title="Register" onSubmit={handleRegister} />}
      {view === 'leaderboard' && <LeaderboardPanel onBack={() => setView('main')} />}
      {view === 'shop' && <ShopPanel onBack={() => setView('main')} />}
      {view === 'settings' && <SettingsPanel onBack={() => setView('main')} />}
      {view === 'customize' && <CustomizationPanel onBack={() => setView('main')} />}

      {screen === 'death' && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/40 rounded">
          <h2 className="font-semibold text-red-200">You were derezzed.</h2>
          <p className="text-sm text-red-100">Try again or return to the main menu.</p>
        </div>
      )}
      {screen === 'ascended' && (
        <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/40 rounded">
          <h2 className="font-semibold text-emerald-200">Ascension Complete</h2>
          <p className="text-sm text-emerald-100">
            You shattered the Rift on level 50. Dive back in to chase leaderboard glory.
          </p>
        </div>
      )}
    </section>
  );
}
