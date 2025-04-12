const { z } = require('zod');

const habitBody = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  targetPerWeek: z.coerce.number().int().min(1).max(7).optional(),
});

const habitLogBody = z.object({
  day: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Day must be YYYY-MM-DD')
    .optional(),
});

module.exports = { habitBody, habitLogBody };
