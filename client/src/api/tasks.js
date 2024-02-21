import { apiFetch } from './client.js';

function toQuery(params) {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== ''
  );
  const query = new URLSearchParams(entries).toString();
  return query ? `?${query}` : '';
}

export function listTasks(params = {}) {
  return apiFetch(`/tasks${toQuery(params)}`);
}

export function createTask(payload) {
  return apiFetch('/tasks', { method: 'POST', body: payload });
}

export function updateTask(id, payload) {
  return apiFetch(`/tasks/${id}`, { method: 'PUT', body: payload });
}

export function deleteTask(id) {
  return apiFetch(`/tasks/${id}`, { method: 'DELETE' });
}
