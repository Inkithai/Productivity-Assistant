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

router.use(requireAuth);

router.post('/extract', validate({ body: extractBody }), asyncHandler(controller.extractTaskSuggestion));

module.exports = router;
