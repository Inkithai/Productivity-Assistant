const { rateLimit } = require('express-rate-limit');

function createAuthLimiter({ windowMs = 15 * 60 * 1000, max = 20 } = {}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { message: 'Too many attempts, please try again later' } },
  });
}

module.exports = { createAuthLimiter };
