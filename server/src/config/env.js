require('dotenv').config();

function env(key, fallback) {
  const value = process.env[key];
  return value === undefined || value === '' ? fallback : value;
}

module.exports = {
  env: env('NODE_ENV', 'development'),
  port: Number(env('PORT', 4000)),
  mongoUri: env('MONGODB_URI', 'mongodb://127.0.0.1:27017/productivity-assistant'),
  jwtSecret: env('JWT_SECRET', 'dev-secret-change-me'),
  jwtExpiresIn: env('JWT_EXPIRES_IN', '7d'),
  clientOrigin: env('CLIENT_ORIGIN', 'http://localhost:5173'),
  aiServiceUrl: env('AI_SERVICE_URL', 'http://localhost:8000'),
  aiServiceToken: env('AI_SERVICE_TOKEN', 'dev-service-token'),
  aiServiceTimeoutMs: Number(env('AI_SERVICE_TIMEOUT_MS', 25000)),
};
