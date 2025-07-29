const Task = require('../models/task.model');
const User = require('../models/user.model');
const { buildPagination, paginationMeta } = require('../utils/pagination');

async function listTasks(req, res) {
  const { status, priority, tag, overdue, page, limit } = req.validatedQuery;
  const filter = {
    // own tasks plus tasks other people shared with this account
    $or: [{ userId: req.user._id }, { sharedWith: req.user._id }],
  };

  if (overdue === 'true') {
    filter.dueDate = { $ne: null, $lt: new Date() };
    if (!status) {
      filter.status = { $ne: 'done' };
    }
  }
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
  const task = await Task.findOne(accessFilter(req, req.params.id));
  if (!task) {
    return res.status(404).json({ error: { message: 'Task not found' } });
  }
  return res.json({ task });
}

// completing a repeating task spawns the next occurrence
async function spawnNext(task) {
  const step = task.repeat === 'weekly' ? 7 : 1;
  const dueDate = new Date(task.dueDate || Date.now());
  dueDate.setDate(dueDate.getDate() + step);

  return Task.create({
    userId: task.userId,
    title: task.title,
    description: task.description,
    priority: task.priority,
    tags: task.tags,
    repeat: task.repeat,
    dueDate,
  });
}

async function updateTask(req, res) {
  const task = await Task.findOne(accessFilter(req, req.params.id));
  if (!task) {
    return res.status(404).json({ error: { message: 'Task not found' } });
  }

  const { status, ...rest } = req.body;
  const wasDone = task.status === 'done';
  const willRepeat =
    status === 'done' && !wasDone && task.repeat !== 'none' && task.repeat;
  Object.assign(task, rest);

  if (status && status !== task.status) {
    task.status = status;
    task.completedAt = status === 'done' ? new Date() : null;
  }

  await task.save();
  const spawned = willRepeat ? await spawnNext(task) : null;
  return res.json({ task, spawned: spawned ? spawned.toJSON() : null });
}

function accessFilter(req, id) {
  return {
    _id: id,
    $or: [{ userId: req.user._id }, { sharedWith: req.user._id }],
  };
}

async function shareTask(req, res) {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
  if (!task) {
    return res.status(404).json({ error: { message: 'Task not found' } });
  }

  const collaborator = await User.findOne({ email: req.body.email.toLowerCase() });
  if (!collaborator) {
    return res.status(404).json({ error: { message: 'No account with that email' } });
  }
  if (String(collaborator._id) === String(task.userId)) {
    return res.status(400).json({ error: { message: 'That is already the owner' } });
  }

  const already = task.sharedWith.some(
    (id) => String(id) === String(collaborator._id)
  );
  if (!already) {
    task.sharedWith.push(collaborator._id);
    await task.save();
  }

  return res.json({
    sharedWith: task.sharedWith.map((id) => ({ id: String(id), email: collaborator.email })),
    alreadyShared: already,
  });
}

async function unshareTask(req, res) {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
  if (!task) {
    return res.status(404).json({ error: { message: 'Task not found' } });
  }

  task.sharedWith = task.sharedWith.filter((id) => String(id) !== req.params.userId);
  await task.save();
  return res.status(204).send();
}

async function deleteTask(req, res) {
  const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!task) {
    return res.status(404).json({ error: { message: 'Task not found' } });
  }
  return res.status(204).send();
}

module.exports = {
  listTasks,
  createTask,
  getTask,
  updateTask,
  shareTask,
  unshareTask,
  deleteTask,
};
