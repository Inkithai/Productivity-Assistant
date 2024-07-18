const express = require('express');
const { z } = require('zod');

const { requireAuth } = require('../middleware/auth.middleware');
const controller = require('../controllers/search.controller');
const { validate } = require('../middleware/validate.middleware');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

const searchQuery = z.object({
  q: z.string().trim().min(2, 'Search needs at least 2 characters').max(200),
});

router.use(requireAuth);

router.get('/', validate({ query: searchQuery }), asyncHandler(controller.search));

module.exports = router;
