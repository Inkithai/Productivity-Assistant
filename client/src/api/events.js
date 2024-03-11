import { apiFetch } from './client.js';

import { toQuery } from './tasks.js';

export function listEvents(params = {}) {
  return apiFetch(`/events${toQuery(params)}`);
}

export function createEvent(payload) {
  return apiFetch('/events', { method: 'POST', body: payload });
}

export function updateEvent(id, payload) {
  return apiFetch(`/events/${id}`, { method: 'PUT', body: payload });
}

export function deleteEvent(id) {
  return apiFetch(`/events/${id}`, { method: 'DELETE' });
}
