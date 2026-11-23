'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig } = require('../../src/config/env');

const base = { DATABASE_URL: 'postgres://x' };

describe('loadConfig database and proxy settings', () => {
  test('SSL is on by default and can be switched off for a local database', () => {
    assert.equal(loadConfig(base).dbSsl, true);
    assert.equal(loadConfig({ ...base, DB_SSL: 'false' }).dbSsl, false);
  });

  test('DB_SSL_CA turns \\n into real line breaks (Supabase CA certificate on one line)', () => {
    const cfg = loadConfig({ ...base, DB_SSL_CA: '-----BEGIN CERTIFICATE-----\\nABC\\n-----END CERTIFICATE-----' });
    assert.equal(cfg.dbSslCa, '-----BEGIN CERTIFICATE-----\nABC\n-----END CERTIFICATE-----');
    assert.equal(loadConfig(base).dbSslCa, undefined);
  });

  test('TRUST_PROXY and the rate limit have safe defaults', () => {
    assert.equal(loadConfig(base).trustProxy, false);
    assert.equal(loadConfig({ ...base, TRUST_PROXY: '1' }).trustProxy, 1);
    assert.deepEqual(loadConfig(base).rateLimit, { limit: 60, windowMs: 60000 });
    assert.equal(loadConfig({ ...base, RATE_LIMIT_PER_MIN: '120' }).rateLimit.limit, 120);
  });
});
