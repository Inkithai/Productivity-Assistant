const express = require('express');

const { requireAuth } = require('../middleware/auth.middleware');
const controller = require('../controllers/analytics.controller');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.use(requireAuth);

router.get('/summary', asyncHandler(controller.getSummary));

module.exports = router;
