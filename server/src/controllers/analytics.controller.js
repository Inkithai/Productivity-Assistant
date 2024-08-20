const { buildSummary, buildTrends } = require('../services/analytics.service');

async function getSummary(req, res) {
  const summary = await buildSummary(req.user._id);
  return res.json({ summary });
}

async function getTrends(req, res) {
  const trends = await buildTrends(req.user._id);
  return res.json({ trends });
}

module.exports = { getSummary, getTrends };
