import { apiFetch } from './client.js';

export function logFocusSession(payload) {
  return apiFetch('/focus/sessions', { method: 'POST', body: payload });
}

export function fetchFocusSummary(days = 7) {
  return apiFetch(`/focus/sessions/summary?days=${days}`);
}
