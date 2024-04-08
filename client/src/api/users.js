import { apiFetch } from './client.js';

export function updateProfile(payload) {
  return apiFetch('/users/me', { method: 'PUT', body: payload });
}

export function changePassword(payload) {
  return apiFetch('/users/me/password', { method: 'PUT', body: payload });
}
