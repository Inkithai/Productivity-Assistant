const User = require('../models/user.model');

async function updateProfile(req, res) {
  const user = req.user;
  if (req.body.name !== undefined) {
    user.name = req.body.name;
  }
  if (req.body.timezone !== undefined) {
    user.timezone = req.body.timezone;
  }
  await user.save();
  return res.json({ user: user.toJSON() });
}

module.exports = { updateProfile };
