function validate({ body, query, params } = {}) {
  return (req, res, next) => {
    try {
      if (body) {
        req.body = body.parse(req.body ?? {});
      }
      if (query) {
        req.validatedQuery = query.parse(req.query);
      }
      if (params) {
        req.params = params.parse(req.params);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { validate };
