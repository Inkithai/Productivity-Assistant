const { buildSummary } = require('../services/analytics.service');

async function getSummary(req, res) {
  const summary = await buildSummary(req.user._id);
  return res.json({ summary });
}

module.exports = { getSummary };
