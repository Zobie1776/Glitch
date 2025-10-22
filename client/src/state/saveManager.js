import { apiClient, useAuthContext } from './useAuth.js';

let cachedProgress = null;

export async function loadProgress() {
  if (cachedProgress) return cachedProgress;

  const token = localStorage.getItem('authToken');
  if (!token) return null;

  const response = await apiClient('/game/progress', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  cachedProgress = data.progress;
  return cachedProgress;
}

export async function saveProgress(payload) {
  const token = localStorage.getItem('authToken');
  if (!token) return null;

  const response = await apiClient('/game/progress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    const data = await response.json();
    cachedProgress = data.progress;
    return cachedProgress;
  }

  return null;
}

export function useSaveManager() {
  return useAuthContext();
}
