// Default to local dev backend. Override in production via VITE_API_URL
// e.g. VITE_API_URL=https://yemisrach.elacodes.com/api
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:7000/api';

export const uploadUrl = (path: string) => `${API_BASE}/uploads/${path}`;