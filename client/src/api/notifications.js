import { apiFetch } from './client.js';

export function listNotifications(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
  ).toString();
  return apiFetch(`/notifications${query ? `?${query}` : ''}`);
}

export function markNotificationRead(id) {
  return apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
}

export function markAllNotificationsRead() {
  return apiFetch('/notifications/read-all', { method: 'PATCH' });
}
