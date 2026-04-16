const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('codeboard_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getProfile: () => request('/auth/me'),
  updateProfile: (body) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),

  // Analytics
  getDashboard: () => request('/analytics/dashboard'),
  getGitHub: () => request('/analytics/github'),
  getLeetCode: () => request('/analytics/leetcode'),
  getGitHubHistory: (limit = 30) => request(`/analytics/github/history?limit=${limit}`),
  getLeetCodeHistory: (limit = 30) => request(`/analytics/leetcode/history?limit=${limit}`),
  getActivity: (limit = 50) => request(`/analytics/activity?limit=${limit}`),

  // Health
  health: () => request('/health'),
};
