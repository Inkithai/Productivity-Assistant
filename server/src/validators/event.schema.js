const { z } = require('zod');

const EVENT_TYPES = ['meeting', 'deadline', 'personal', 'other'];

const eventFields = z.object({
  title: z.string().trim().min(1, 'Title is required').max(160),
  type: z.enum(EVENT_TYPES).optional(),
  start: z.coerce.date(),
  end: z.coerce.date().nullish(),
  allDay: z.boolean().optional(),
  location: z.string().trim().max(200).optional(),
});

function endAfterStart(data) {
  return !data.end || data.end >= data.start;
}

const eventCreate = eventFields.refine(endAfterStart, {
  message: 'End must be after start',
  path: ['end'],
});

const eventUpdate = eventFields
  .partial()
  .refine(endAfterStart, { message: 'End must be after start', path: ['end'] });

const eventRangeQuery = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

module.exports = { eventCreate, eventUpdate, eventRangeQuery };
