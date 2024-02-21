import { apiFetch } from './client.js';

import { toQuery } from './tasks.js';

export function listNotes(params = {}) {
  return apiFetch(`/notes${toQuery(params)}`);
}

export function createNote(payload) {
  return apiFetch('/notes', { method: 'POST', body: payload });
}

export function getNote(id) {
  return apiFetch(`/notes/${id}`);
}

export function updateNote(id, payload) {
  return apiFetch(`/notes/${id}`, { method: 'PUT', body: payload });
}

export function deleteNote(id) {
  return apiFetch(`/notes/${id}`, { method: 'DELETE' });
}
