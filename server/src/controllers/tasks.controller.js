const Task = require('../models/task.model');
const { buildPagination, paginationMeta } = require('../utils/pagination');

async function listTasks(req, res) {
  const { status, priority, tag, page, limit } = req.validatedQuery;
  const filter = { userId: req.user._id };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (tag) filter.tags = tag;

  const { skip, page: safePage, limit: safeLimit } = buildPagination({ page, limit });
  const [tasks, total] = await Promise.all([
    // undated tasks sort last; a plain dueDate sort puts nulls first
    Task.aggregate([
      { $match: filter },
      { $addFields: { dueForSort: { $ifNull: ['$dueDate', new Date('2999-01-01')] } } },
      { $sort: { dueForSort: 1, createdAt: -1 } },
      { $project: { dueForSort: 0 } },
      { $skip: skip },
      { $limit: safeLimit },
    ]),
    Task.countDocuments(filter),
  ]);

  return res.json({ tasks, meta: paginationMeta({ page: safePage, limit: safeLimit, total }) });
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
