/** Backend API root (no trailing slash). Override with VITE_API_BASE in .env */
export const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/$/, '');
