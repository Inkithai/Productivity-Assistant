const User = require('../models/user.model');
const { verifyAuthToken } = require('../utils/tokens');

function extractToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: { message: 'Authentication required' } });
    }

    const payload = verifyAuthToken(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: { message: 'Account no longer exists' } });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: { message: 'Invalid or expired token' } });
  }
}

module.exports = { requireAuth, extractToken };
