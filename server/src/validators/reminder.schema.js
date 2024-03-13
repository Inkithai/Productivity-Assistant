const { z } = require('zod');

const reminderBody = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  message: z.string().trim().max(500).optional(),
  remindAt: z.coerce.date(),
  taskId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid task id').nullish(),
  eventId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid event id').nullish(),
});

const snoozeBody = z.object({
  minutes: z.coerce.number().int().min(1).max(60 * 24),
});

module.exports = { reminderBody, snoozeBody };
