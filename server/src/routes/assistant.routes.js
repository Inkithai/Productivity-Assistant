const express = require('express');
const { z } = require('zod');

const { requireAuth } = require('../middleware/auth.middleware');
const controller = require('../controllers/assistant.controller');
const { validate } = require('../middleware/validate.middleware');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

const extractBody = z.object({
  text: z.string().trim().min(3, 'Give me a bit more to work with').max(500),
});

const chatBody = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(2000) }))
    .max(20)
    .optional(),
});

router.use(requireAuth);

router.post('/extract', validate({ body: extractBody }), asyncHandler(controller.extractTaskSuggestion));
router.post('/chat', validate({ body: chatBody }), asyncHandler(controller.chatWithAssistant));

const planBody = z.object({
  start_hour: z.coerce.number().int().min(0).max(23).optional(),
});

router.post('/plan', validate({ body: planBody }), asyncHandler(controller.planMyDay));

module.exports = router;
