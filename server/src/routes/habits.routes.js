const express = require('express');

const { requireAuth } = require('../middleware/auth.middleware');
const controller = require('../controllers/habits.controller');
const { validate } = require('../middleware/validate.middleware');
const { habitBody, habitLogBody } = require('../validators/habit.schema');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.use(requireAuth);

router.get('/', asyncHandler(controller.listHabits));
router.post('/', validate({ body: habitBody }), asyncHandler(controller.createHabit));
router.post('/:id/log', validate({ body: habitLogBody }), asyncHandler(controller.logHabit));
router.delete('/:id', asyncHandler(controller.deleteHabit));

module.exports = router;
