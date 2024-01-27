const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'pa_token';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function apiFetch(path, { method = 'GET', body, signal } = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method,
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data.error?.message || message;
    } catch {
      // non-JSON error body, keep the generic message
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return null;
  return res.json();
}
