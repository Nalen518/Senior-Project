'use strict';

// Reads configuration from environment variables in one place.
// Everything else in the backend receives this object instead of reading process.env directly.

function list(value) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function loadConfig(env = process.env) {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  }

  const config = {
    nodeEnv: env.NODE_ENV || 'development',
    port: Number(env.PORT) || 3000,
    databaseUrl: env.DATABASE_URL,
    dbSsl: env.DB_SSL !== 'false', // hosted databases require SSL, so it is on unless explicitly disabled
    // Supabase signs its certificate with its own CA. Paste the CA certificate here, with line breaks written as \n.
    dbSslCa: (env.DB_SSL_CA || '').replace(/\\n/g, '\n') || undefined,
    corsOrigins: list(env.CORS_ORIGIN),
    timeZone: 'Asia/Jakarta', // check_date is always the WIB calendar day
    // NFR-03. Behind a proxy (Railway) set TRUST_PROXY=1 so the limit counts real client IPs, not the proxy.
    trustProxy: Number(env.TRUST_PROXY) || false,
    rateLimit: { limit: Number(env.RATE_LIMIT_PER_MIN) || 60, windowMs: 60_000 },
    openrouter: {
      apiKey: env.OPENROUTER_API_KEY || '',
      model: env.OPENROUTER_MODEL || '',
      baseUrl: 'https://openrouter.ai/api/v1',
      timeoutMs: 15000,
    },
  };

  config.openrouter.enabled = Boolean(config.openrouter.apiKey && config.openrouter.model);

  if (config.nodeEnv === 'production' && config.corsOrigins.length === 0) {
    throw new Error('CORS_ORIGIN must be set in production.');
  }

  return config;
}

module.exports = { loadConfig };
