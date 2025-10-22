const API_BASE = window.GLITCH_API_BASE || '/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Request failed');
  }

  return response.json();
}

export const api = {
  login(credentials) {
    return request('/auth/login', { method: 'POST', body: credentials });
  },
  register(credentials) {
    return request('/auth/register', { method: 'POST', body: credentials });
  },
  submitScore(score) {
    const auth = JSON.parse(localStorage.getItem('glitch-auth') || '{}');
    return request('/leaderboard', {
      method: 'POST',
      body: score,
      token: auth.token
    });
  },
  leaderboard() {
    return request('/leaderboard');
  },
  purchase(payload) {
    const auth = JSON.parse(localStorage.getItem('glitch-auth') || '{}');
    return request('/purchase', { method: 'POST', body: payload, token: auth.token });
  }
};
