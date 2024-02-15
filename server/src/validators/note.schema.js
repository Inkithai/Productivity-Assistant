const { z } = require('zod');

const NOTE_CATEGORIES = ['general', 'meeting', 'idea', 'study', 'project'];

const noteBody = z.object({
  title: z.string().trim().min(1, 'Title is required').max(160),
  content: z.string().max(20000).optional(),
  category: z.enum(NOTE_CATEGORIES).optional(),
  tags: z.array(z.string().trim().min(1)).max(10).optional(),
  pinned: z.boolean().optional(),
});

const noteListQuery = z.object({
  category: z.enum(NOTE_CATEGORIES).optional(),
  pinned: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

module.exports = { noteBody, noteListQuery };
