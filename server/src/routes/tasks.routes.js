const express = require('express');

const { requireAuth } = require('../middleware/auth.middleware');
const controller = require('../controllers/tasks.controller');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.use(requireAuth);

router.get('/', asyncHandler(controller.listTasks));
router.post('/', asyncHandler(controller.createTask));
router.get('/:id', asyncHandler(controller.getTask));
router.put('/:id', asyncHandler(controller.updateTask));
router.delete('/:id', asyncHandler(controller.deleteTask));

module.exports = router;
