// Express 4 does not forward rejected promises from handlers to the error
// middleware, so async controllers are wrapped here.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { asyncHandler };
