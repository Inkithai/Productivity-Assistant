const { buildContext } = require('../services/contextBuilder.service');
const { chat, extractTask } = require('../services/aiGateway.service');

async function extractTaskSuggestion(req, res) {
  const suggestion = await extractTask(req.body.text, req.user.timezone || 'UTC');
  return res.json({ suggestion });
}

async function chatWithAssistant(req, res) {
  const context = await buildContext(req.user._id);
  const result = await chat(req.body.message, context, req.body.history || []);
  return res.json(result);
}

module.exports = { extractTaskSuggestion, chatWithAssistant };
