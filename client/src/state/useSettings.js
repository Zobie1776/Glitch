import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = Object.freeze({
  music: true,
  sfx: true,
  showDamage: true,
});

function loadInitialSettings() {
  try {
    const raw = localStorage.getItem('glitch.settings');
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    console.warn('Failed to load settings, using defaults', error);
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => loadInitialSettings());

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem('glitch.settings', JSON.stringify(next));
      } catch (error) {
        console.warn('Failed to persist settings', error);
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, updateSettings }), [settings, updateSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
