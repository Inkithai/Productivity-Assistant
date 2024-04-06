const express = require('express');

const { requireAuth } = require('../middleware/auth.middleware');
const controller = require('../controllers/users.controller');
const { validate } = require('../middleware/validate.middleware');
const { profileUpdate } = require('../validators/user.schema');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.use(requireAuth);

router.put('/me', validate({ body: profileUpdate }), asyncHandler(controller.updateProfile));

module.exports = router;
