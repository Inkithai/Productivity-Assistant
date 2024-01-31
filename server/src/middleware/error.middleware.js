const config = require('../config/env');

// Keeps the final Express 4-arg signature intact.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        details: Object.values(err.errors).map((e) => e.message),
      },
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: { message: `Invalid value for ${err.path}` } });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ error: { message: `Duplicate value for ${field}` } });
  }

  console.error(err);
  return res.status(500).json({
    error: { message: config.env === 'production' ? 'Internal server error' : err.message },
  });
}

module.exports = { errorHandler };
