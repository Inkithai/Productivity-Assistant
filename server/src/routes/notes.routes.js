const express = require('express');

const { requireAuth } = require('../middleware/auth.middleware');
const controller = require('../controllers/notes.controller');
const { validate } = require('../middleware/validate.middleware');
const { noteBody, noteListQuery } = require('../validators/note.schema');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.use(requireAuth);

router.get('/', validate({ query: noteListQuery }), asyncHandler(controller.listNotes));
router.post('/', validate({ body: noteBody }), asyncHandler(controller.createNote));
router.get('/:id', asyncHandler(controller.getNote));
router.put('/:id', validate({ body: noteBody.partial() }), asyncHandler(controller.updateNote));
router.delete('/:id', asyncHandler(controller.deleteNote));

module.exports = router;
