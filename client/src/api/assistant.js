import { apiFetch } from './client.js';

export function extractTask(text) {
  return apiFetch('/assistant/extract', { method: 'POST', body: { text } });
}

export function chatWithAssistant(message, history = []) {
  return apiFetch('/assistant/chat', { method: 'POST', body: { message, history } });
}
