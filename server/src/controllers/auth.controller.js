const User = require('../models/user.model');
const { signAuthToken } = require('../utils/tokens');

async function register(req, res) {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: { message: 'Email is already registered' } });
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash });

  return res.status(201).json({
    user: user.toJSON(),
    token: signAuthToken(user._id),
  });
}

async function me(req, res) {
  return res.json({ user: req.user.toJSON() });
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: { message: 'Invalid email or password' } });
  }

  return res.json({
    user: user.toJSON(),
    token: signAuthToken(user._id),
  });
}

module.exports = { register, login };
