import React, { useState } from 'react';
import LeaderboardPanel from './panels/LeaderboardPanel.jsx';
import ShopPanel from './panels/ShopPanel.jsx';
import SettingsPanel from './panels/SettingsPanel.jsx';

function AuthForm({ onSubmit, title }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ email, password, displayName });
      }}
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <input className="input" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
      {title === 'Register' && (
        <input className="input" placeholder="Display Name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
      )}
      <input className="input" placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      <button type="submit" className="btn-primary">Submit</button>
    </form>
  );
}

export default function MainMenu({ user, onLogin, onRegister, onLogout, onStart, onContinue, onLeaderboard, onShop, screen, stats }) {
  const [view, setView] = useState('main');
  const [error, setError] = useState('');

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
    <section className="bg-slate-900/70 rounded-xl p-6 shadow-xl backdrop-blur border border-slate-700">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-glitch-neon">Glitch</h1>
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
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <button className="btn-primary w-full" onClick={onStart}>Start</button>
            <button className="btn-primary w-full" onClick={onContinue} disabled={!user}>Continue</button>
            <button className="btn-primary w-full" onClick={() => { onLeaderboard(); setView('leaderboard'); }}>Leaderboards</button>
            <button className="btn-primary w-full" onClick={() => { onShop(); setView('shop'); }}>Shop</button>
            <button className="btn-primary w-full" onClick={() => setView('settings')}>Settings</button>
          </div>
          <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
            <h2 className="text-xl font-semibold mb-2">Current Run</h2>
            <p className="text-slate-300">Level: {stats.level}</p>
            <p className="text-slate-300">Gems: {stats.gems}</p>
            <p className="text-slate-500 text-sm mt-2">Progress auto-saves at the end of each level.</p>
          </div>
        </div>
      )}

      {view === 'login' && <AuthForm title="Login" onSubmit={handleLogin} />}
      {view === 'register' && <AuthForm title="Register" onSubmit={handleRegister} />}
      {view === 'leaderboard' && <LeaderboardPanel onBack={() => setView('main')} />}
      {view === 'shop' && <ShopPanel onBack={() => setView('main')} />}
      {view === 'settings' && <SettingsPanel onBack={() => setView('main')} />}

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
