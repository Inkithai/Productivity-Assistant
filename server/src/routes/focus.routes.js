const express = require('express');

const { requireAuth } = require('../middleware/auth.middleware');
const controller = require('../controllers/focus.controller');
const { validate } = require('../middleware/validate.middleware');
const { focusSessionBody } = require('../validators/focus.schema');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.use(requireAuth);

router.post('/sessions', validate({ body: focusSessionBody }), asyncHandler(controller.logSession));
router.get('/sessions/summary', asyncHandler(controller.sessionSummary));

module.exports = router;
