import { apiFetch } from './client.js';

export function fetchSummary() {
  return apiFetch('/analytics/summary');
}

export function fetchTrends() {
  return apiFetch('/analytics/trends');
}
