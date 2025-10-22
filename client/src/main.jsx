import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { startGame, destroyGame, onLevelComplete, onPlayerDeath } from './game/index.js';
import MainMenu from './components/MainMenu.jsx';
import HUD from './components/HUD.jsx';
import { AuthProvider, useAuth } from './state/useAuth.js';
import { SettingsProvider, useSettings } from './state/useSettings.js';
import './styles/tailwind.css';

function AppShell() {
  const { user, login, register, logout, loadSession } = useAuth();
  const { settings } = useSettings();
  const [screen, setScreen] = useState('menu');
  const [sessionStats, setSessionStats] = useState({ level: 1, gems: 0, ascended: false });

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    const cleanupComplete = onLevelComplete((payload) => {
      setSessionStats({ level: payload.level, gems: payload.gems, ascended: payload.ascended ?? false });
      if (payload.ascended) {
        setScreen('ascended');
      } else {
        setScreen('menu');
      }
    });
    const cleanupDeath = onPlayerDeath(() => {
      setScreen('death');
    });
    return () => {
      cleanupComplete();
      cleanupDeath();
    };
  }, []);

  useEffect(() => {
    if (screen === 'game') {
      startGame({ mountId: 'game-root', onSession: setSessionStats, settings });
    }
  }, [screen, settings]);

  const handleStart = async () => {
    await startGame({ mountId: 'game-root', onSession: setSessionStats, settings });
    setScreen('game');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <MainMenu
        user={user}
        onLogin={login}
        onRegister={register}
        onLogout={logout}
        onStart={handleStart}
        onContinue={handleStart}
        onLeaderboard={() => setScreen('leaderboard')}
        onShop={() => setScreen('shop')}
        screen={screen}
        stats={sessionStats}
      />
      {screen === 'game' && <HUD stats={sessionStats} onExit={() => { destroyGame(); setScreen('menu'); }} />}
    </div>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </SettingsProvider>
  );
}

const root = createRoot(document.getElementById('ui-root'));
root.render(<App />);
