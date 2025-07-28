import { apiFetch, ApiError, getToken } from './client.js';

export async function exportData() {
  const res = await fetch(`${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/api/users/export`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    throw new ApiError('Could not export your data', res.status);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'productivity-data.json';
  link.click();
  URL.revokeObjectURL(url);
}

export function updateProfile(payload) {
  return apiFetch('/users/me', { method: 'PUT', body: payload });
}

export function changePassword(payload) {
  return apiFetch('/users/me/password', { method: 'PUT', body: payload });
}
