const express = require('express');

const { requireAuth } = require('../middleware/auth.middleware');
const controller = require('../controllers/tasks.controller');
const { asyncHandler } = require('../utils/asyncHandler');
const { validate } = require('../middleware/validate.middleware');
const { taskCreate, taskUpdate, taskListQuery, shareBody } = require('../validators/task.schema');

const router = express.Router();

router.use(requireAuth);

router.get('/', validate({ query: taskListQuery }), asyncHandler(controller.listTasks));
router.post('/', validate({ body: taskCreate }), asyncHandler(controller.createTask));
router.get('/:id', asyncHandler(controller.getTask));
router.put('/:id', validate({ body: taskUpdate }), asyncHandler(controller.updateTask));
router.post('/:id/share', validate({ body: shareBody }), asyncHandler(controller.shareTask));
router.delete('/:id/share/:userId', asyncHandler(controller.unshareTask));
router.delete('/:id', asyncHandler(controller.deleteTask));

module.exports = router;
