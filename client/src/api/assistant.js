import { apiFetch } from './client.js';

export function extractTask(text) {
  return apiFetch('/assistant/extract', { method: 'POST', body: { text } });
}
