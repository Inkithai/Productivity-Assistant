const express = require('express');

const { requireAuth } = require('../middleware/auth.middleware');
const controller = require('../controllers/reminders.controller');
const { validate } = require('../middleware/validate.middleware');
const { reminderBody, snoozeBody } = require('../validators/reminder.schema');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.use(requireAuth);

router.get('/', asyncHandler(controller.listReminders));
router.post('/', validate({ body: reminderBody }), asyncHandler(controller.createReminder));
router.put('/:id', validate({ body: reminderBody.partial() }), asyncHandler(controller.updateReminder));
router.post('/:id/snooze', validate({ body: snoozeBody }), asyncHandler(controller.snoozeReminder));
router.patch('/:id/cancel', asyncHandler(controller.cancelReminder));
router.delete('/:id', asyncHandler(controller.deleteReminder));

module.exports = router;
