const { AiServiceError, extractTask } = require('../services/aiGateway.service');

async function extractTaskSuggestion(req, res) {
  const suggestion = await extractTask(req.body.text, req.user.timezone || 'UTC');
  return res.json({ suggestion });
}

module.exports = { extractTaskSuggestion };
