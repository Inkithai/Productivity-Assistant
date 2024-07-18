import { apiFetch } from './client.js';

export function searchEverything(query) {
  return apiFetch(`/search?q=${encodeURIComponent(query)}`);
}
