const Task = require('../models/task.model');

function buildFilter(req) {
  const filter = { userId: req.user._id };
  const { status, priority, tag } = req.query;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (tag) filter.tags = tag;
  return filter;
}

async function listTasks(req, res) {
  const tasks = await Task.find(buildFilter(req)).sort({ dueDate: 1, createdAt: -1 });
  return res.json({ tasks });
}

async function createTask(req, res) {
  const task = await Task.create({ ...req.body, userId: req.user._id });
  return res.status(201).json({ task });
}

async function getTask(req, res) {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
  if (!task) {
    return res.status(404).json({ error: { message: 'Task not found' } });
  }
  return res.json({ task });
}

async function updateTask(req, res) {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
  if (!task) {
    return res.status(404).json({ error: { message: 'Task not found' } });
  }

  const { status, ...rest } = req.body;
  Object.assign(task, rest);

  if (status && status !== task.status) {
    task.status = status;
    task.completedAt = status === 'done' ? new Date() : null;
  }

  await task.save();
  return res.json({ task });
}

async function deleteTask(req, res) {
  const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!task) {
    return res.status(404).json({ error: { message: 'Task not found' } });
  }
  return res.status(204).send();
}

module.exports = { listTasks, createTask, getTask, updateTask, deleteTask };
