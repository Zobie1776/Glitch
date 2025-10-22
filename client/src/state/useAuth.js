import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const API_BASE = '/api';
const AuthContext = createContext(null);

export function apiClient(path, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options
  });
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('authUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));

  const setSession = useCallback((sessionToken, sessionUser) => {
    if (sessionToken) {
      localStorage.setItem('authToken', sessionToken);
      setToken(sessionToken);
    }
    if (sessionUser) {
      localStorage.setItem('authUser', JSON.stringify(sessionUser));
    }
    setUser(sessionUser || null);
  }, []);

  const loadSession = useCallback(() => {
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const response = await apiClient('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    setSession(data.token, data.user);
    return data.user;
  }, [setSession]);

  const register = useCallback(async ({ email, password, displayName }) => {
    const response = await apiClient('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName })
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    const data = await response.json();
    setSession(data.token, data.user);
    return data.user;
  }, [setSession]);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, login, register, logout, loadSession }),
    [user, token, login, register, logout, loadSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function useAuthContext() {
  return useContext(AuthContext) || {};
}
