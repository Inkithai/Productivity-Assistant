const config = require('../config/env');

class AiServiceError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = 'AiServiceError';
    this.status = status;
  }
}

async function postJson(path, body) {
  let response;
  try {
    response = await fetch(`${config.aiServiceUrl}/api/v1${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-token': config.aiServiceToken,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(config.aiServiceTimeoutMs),
    });
  } catch (err) {
    throw new AiServiceError('AI service is unavailable', 503);
  }

  if (!response.ok) {
    throw new AiServiceError('AI service returned an error', 502);
  }
  return response.json();
}

async function extractTask(text, timezone) {
  const data = await postJson('/tasks/extract', { text, timezone });
  return data.task;
}

async function chat(message, context, history) {
  return postJson('/assistant/chat', { message, context, history });
}

async function summarize(text, maxPoints) {
  return postJson('/notes/summarize', { text, max_points: maxPoints });
}

async function search(query, items, limit) {
  return postJson('/search', { query, items, limit });
}

module.exports = { postJson, extractTask, chat, summarize, search, AiServiceError };
