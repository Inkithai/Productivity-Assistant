const jwt = require('jsonwebtoken');
const config = require('../config/env');

function signAuthToken(userId) {
  return jwt.sign({ sub: userId.toString() }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function verifyAuthToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = { signAuthToken, verifyAuthToken };
