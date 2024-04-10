const User = require('../models/user.model');

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  const matches = await req.user.comparePassword(currentPassword);
  if (!matches) {
    return res.status(400).json({ error: { message: 'Current password is incorrect' } });
  }

  req.user.passwordHash = await User.hashPassword(newPassword);
  await req.user.save();

  return res.json({ updated: true });
}

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

module.exports = { updateProfile, changePassword };
