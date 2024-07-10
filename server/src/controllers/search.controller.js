const { searchEverything } = require('../services/search.service');

async function search(req, res) {
  const { results } = await searchEverything(req.user._id, req.validatedQuery.q, 10);
  return res.json({ results });
}

module.exports = { search };
