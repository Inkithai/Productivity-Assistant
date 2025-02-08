const { z } = require('zod');

const focusSessionBody = z
  .object({
    taskId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid task id').nullish(),
    startedAt: z.coerce.date(),
    endedAt: z.coerce.date(),
    completed: z.boolean().optional(),
  })
  .refine((data) => data.endedAt > data.startedAt, {
    message: 'Session must end after it starts',
    path: ['endedAt'],
  });

module.exports = { focusSessionBody };
