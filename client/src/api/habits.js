import { apiFetch } from './client.js';

export function listHabits() {
  return apiFetch('/habits');
}

export function createHabit(payload) {
  return apiFetch('/habits', { method: 'POST', body: payload });
}

export function logHabit(id) {
  return apiFetch(`/habits/${id}/log`, { method: 'POST', body: {} });
}

export function deleteHabit(id) {
  return apiFetch(`/habits/${id}`, { method: 'DELETE' });
}
