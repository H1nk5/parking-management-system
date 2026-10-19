const crypto = require('crypto');

const DEFAULT_CORS_ORIGINS = [
  'http://127.0.0.1:5173',
  'http://localhost:5173'
];

let developmentSecret;

function getJwtSecret(env = process.env) {
  const configured = String(env.JWT_SECRET || '').trim();
  if (configured) {
    if (Buffer.byteLength(configured, 'utf8') < 32) {
      throw new Error('JWT_SECRET must contain at least 32 bytes');
    }
    return configured;
  }
  if (env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required when NODE_ENV=production');
  }
  if (!developmentSecret) {
    developmentSecret = crypto.randomBytes(32).toString('hex');
    console.warn('[security] JWT_SECRET is unset; using an ephemeral development secret');
  }
  return developmentSecret;
}

function getCorsOrigins(env = process.env) {
  const configured = String(env.CORS_ORIGIN || '').trim();
  const origins = configured
    ? configured.split(',').map(value => value.trim()).filter(Boolean)
    : DEFAULT_CORS_ORIGINS;
  return [...new Set(origins)];
}

module.exports = { DEFAULT_CORS_ORIGINS, getJwtSecret, getCorsOrigins };
