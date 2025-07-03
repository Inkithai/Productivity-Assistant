const { z } = require('zod');

const { paginationQuery } = require('./common.schema');

const TASK_STATUSES = ['todo', 'in_progress', 'done'];
const TASK_PRIORITIES = ['low', 'medium', 'high'];

const taskBody = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: z.coerce.date().nullish(),
  repeat: z.enum(['none', 'daily', 'weekly']).default('none'),
  tags: z.array(z.string().trim().min(1)).max(10).optional(),
});

const taskCreate = taskBody;
const taskUpdate = taskBody.partial();

const taskListQuery = paginationQuery.extend({
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  tag: z.string().trim().min(1).optional(),
});

const shareBody = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required'),
});

module.exports = { taskCreate, taskUpdate, taskListQuery, shareBody };
