import { apiFetch } from './client.js';

export function fetchSummary() {
  return apiFetch('/analytics/summary');
}
