const express = require('express');

const { requireAuth } = require('../middleware/auth.middleware');
const controller = require('../controllers/events.controller');
const { validate } = require('../middleware/validate.middleware');
const { eventBody, eventRangeQuery } = require('../validators/event.schema');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.use(requireAuth);

router.get('/', validate({ query: eventRangeQuery }), asyncHandler(controller.listEvents));
router.post('/', validate({ body: eventBody }), asyncHandler(controller.createEvent));
router.put('/:id', validate({ body: eventBody.partial() }), asyncHandler(controller.updateEvent));
router.delete('/:id', asyncHandler(controller.deleteEvent));

module.exports = router;
