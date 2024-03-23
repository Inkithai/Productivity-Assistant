const express = require('express');

const { requireAuth } = require('../middleware/auth.middleware');
const controller = require('../controllers/events.controller');
const { validate } = require('../middleware/validate.middleware');
const { eventCreate, eventUpdate, eventRangeQuery } = require('../validators/event.schema');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.use(requireAuth);

router.get('/', validate({ query: eventRangeQuery }), asyncHandler(controller.listEvents));
router.post('/', validate({ body: eventCreate }), asyncHandler(controller.createEvent));
router.put('/:id', validate({ body: eventUpdate }), asyncHandler(controller.updateEvent));
router.delete('/:id', asyncHandler(controller.deleteEvent));

module.exports = router;
