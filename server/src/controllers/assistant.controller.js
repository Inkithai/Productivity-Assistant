const Task = require('../models/task.model');
const { buildContext } = require('../services/contextBuilder.service');
const { chat, extractTask, planDay } = require('../services/aiGateway.service');

async function extractTaskSuggestion(req, res) {
  const suggestion = await extractTask(req.body.text, req.user.timezone || 'UTC');
  return res.json({ suggestion });
}

async function chatWithAssistant(req, res) {
  const context = await buildContext(req.user._id);
  const result = await chat(req.body.message, context, req.body.history || []);
  return res.json(result);
}

async function planMyDay(req, res) {
  const tasks = await Task.find({ userId: req.user._id, status: { $ne: 'done' } })
    .select('title priority status dueDate createdAt')
    .limit(50);

  const plan = await planDay(
    tasks.map((task) => ({
      id: String(task._id),
      title: task.title,
      priority: task.priority,
      status: task.status,
      due_date: task.dueDate ? task.dueDate.toISOString() : null,
      created_at: task.createdAt ? task.createdAt.toISOString() : null,
    })),
    req.body.start_hour
  );

  return res.json({ plan });
}

module.exports = { extractTaskSuggestion, chatWithAssistant, planMyDay };
