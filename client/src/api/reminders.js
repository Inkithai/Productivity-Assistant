import { apiFetch, toQuery } from './client.js';

export function listReminders(params = {}) {
  return apiFetch(`/reminders${toQuery(params)}`);
}

export function createReminder(payload) {
  return apiFetch('/reminders', { method: 'POST', body: payload });
}

export function snoozeReminder(id, minutes) {
  return apiFetch(`/reminders/${id}/snooze`, { method: 'POST', body: { minutes } });
}

export function cancelReminder(id) {
  return apiFetch(`/reminders/${id}/cancel`, { method: 'PATCH' });
}
