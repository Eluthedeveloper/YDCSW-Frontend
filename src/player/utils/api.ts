import { API_BASE, uploadUrl as baseUploadUrl } from '../../lib/apiBase';

export const uploadUrl = baseUploadUrl;

async function request(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// Fetch + parse with auth header; throws a readable error on non-2xx.
async function formRequest(endpoint: string, data: FormData, method: 'POST' | 'PUT' = 'POST') {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: data,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || 'Request failed');
  }
  return json;
}

export const api = {
  login: (data: { username: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  getMe: () => request('/auth/me'),
  updateMe: (data: { username?: string; email?: string; password?: string }) =>
    request('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
  getUsers: () => request('/auth/'),
  createUser: (data: any) => request('/auth/', { method: 'POST', body: JSON.stringify(data) }),
  deleteUser: (id: string) => request(`/auth/${id}`, { method: 'DELETE' }),
  updatePassword: (id: string, password: string) =>
    request(`/auth/${id}/password`, { method: 'PUT', body: JSON.stringify({ password }) }),

  getPrograms: () => request('/programs/'),
  getProgram: (id: string) => request(`/programs/${id}`),
  getComments: (programId: string) => request(`/programs/${programId}/comments`),
  getAllComments: () => request('/programs/comments/all'),
  createProgram: (data: FormData) => formRequest('/programs', data),

  deleteProgram: (id: string) => request(`/programs/${id}`, { method: 'DELETE' }),
  updateProgram: (id: string, data: FormData) =>
    formRequest(`/programs/${id}`, data, 'PUT'),

  getTracks: (programId: string) => request(`/tracks/program/${programId}`),
  createTrack: (data: FormData) => formRequest('/tracks', data),
  deleteTrack: (id: string) => request(`/tracks/${id}`, { method: 'DELETE' }),
  updateTrack: (id: string, data: any) => request(`/tracks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  reorderTracks: (programId: string, trackIds: string[]) =>
    request(`/tracks/reorder/${programId}`, { method: 'PUT', body: JSON.stringify({ trackIds }) }),
  bulkUploadTracks: (data: FormData) => formRequest('/tracks/bulk', data),

  getAnalytics: () => request('/analytics/'),

  getPublicPrograms: () => request('/public/programs'),
  getPublicProgram: (id: string) => request(`/public/programs/${id}`),
  getLatestTracks: () => request('/public/latest-tracks'),
  search: (q: string) => request(`/public/search?q=${encodeURIComponent(q)}`),
  postComment: (programId: string, data: { guest_name: string; content: string }) =>
    request(`/public/programs/${programId}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  toggleLike: (trackId: string, fingerprint: string) =>
    request(`/public/tracks/${trackId}/like`, { method: 'POST', body: JSON.stringify({ fingerprint }) }),
  getLikeCount: (trackId: string) => request(`/public/tracks/${trackId}/likes`),
  checkLiked: (trackId: string, fingerprint: string) => request(`/public/tracks/${trackId}/liked/${fingerprint}`),
  recordListen: (trackId: string, fingerprint: string) =>
    request(`/public/tracks/${trackId}/listen`, { method: 'POST', body: JSON.stringify({ fingerprint }) }),
};