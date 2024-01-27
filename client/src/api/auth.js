import { apiFetch } from './client.js';

export function login(payload) {
  return apiFetch('/auth/login', { method: 'POST', body: payload });
}

export function register(payload) {
  return apiFetch('/auth/register', { method: 'POST', body: payload });
}

export function fetchMe() {
  return apiFetch('/auth/me');
}
