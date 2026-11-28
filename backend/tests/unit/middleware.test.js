'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { rateLimit } = require('../../src/middleware/rateLimit');
const { requestLog } = require('../../src/middleware/requestLog');
const { errorHandler } = require('../../src/middleware/errorHandler');

const mockRes = () => ({
  headers: {},
  setHeader(k, v) { this.headers[k] = v; },
  status(code) { this.code = code; return this; },
  json(body) { this.body = body; return this; },
});

describe('rateLimit (NFR-03)', () => {
  const run = (mw, req) => {
    const res = mockRes();
    let passed = false;
    mw(req, res, () => { passed = true; });
    return { passed, res };
  };

  test('lets 60 requests through, then answers 429 in the standard error shape with Retry-After', () => {
    let now = 1000;
    const mw = rateLimit({ limit: 60, windowMs: 60_000, clock: () => now });
    for (let i = 0; i < 60; i += 1) assert.equal(run(mw, { ip: '1.1.1.1' }).passed, true);
    const { passed, res } = run(mw, { ip: '1.1.1.1' });
    assert.equal(passed, false);
    assert.equal(res.code, 429);
    assert.equal(res.body.error.code, 'RATE_LIMITED');
    assert.equal(res.headers['Retry-After'], 60);
  });

  test('counts per IP and recovers when the window ends', () => {
    let now = 1000;
    const mw = rateLimit({ limit: 2, windowMs: 60_000, clock: () => now });
    run(mw, { ip: 'a' });
    run(mw, { ip: 'a' });
    assert.equal(run(mw, { ip: 'a' }).passed, false);
    assert.equal(run(mw, { ip: 'b' }).passed, true);
    now += 60_001;
    assert.equal(run(mw, { ip: 'a' }).passed, true);
  });

  test('skipped requests are never counted or blocked', () => {
    const mw = rateLimit({ limit: 1, windowMs: 60_000, skip: (req) => req.path === '/resources' });
    for (let i = 0; i < 5; i += 1) assert.equal(run(mw, { ip: 'a', path: '/resources' }).passed, true);
    assert.equal(run(mw, { ip: 'a', path: '/checkins' }).passed, true);
  });
});

describe('requestLog (NFR-04, NFR-09)', () => {
  test('logs id, method, path, status and latency, and never the note, token or query string', async () => {
    const lines = [];
    const app = express();
    app.use(requestLog({ info: (line) => lines.push(line) }));
    app.use(express.json());
    app.post('/api/checkins', (req, res) => res.status(201).json({ ok: true }));
    const server = app.listen(0);
    try {
      const res = await fetch(`http://127.0.0.1:${server.address().port}/api/checkins?token=SECRET_QUERY`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Anon-Token': 'SECRET_TOKEN_0001' },
        body: JSON.stringify({ mood_value: 2, note_text: 'SECRET_NOTE_TEXT' }),
      });
      assert.equal(res.status, 201);
      await new Promise((r) => setTimeout(r, 20));

      assert.equal(lines.length, 1);
      const entry = JSON.parse(lines[0]);
      assert.deepEqual(Object.keys(entry).sort(), ['ms', 'method', 'path', 'request_id', 'status'].sort());
      assert.equal(entry.method, 'POST');
      assert.equal(entry.path, '/api/checkins');
      assert.equal(entry.status, 201);
      assert.equal(res.headers.get('x-request-id'), entry.request_id);
      for (const secret of ['SECRET_NOTE_TEXT', 'SECRET_TOKEN_0001', 'SECRET_QUERY']) {
        assert.equal(lines.join().includes(secret), false, `${secret} must not be logged`);
      }
    } finally {
      server.close();
    }
  });
});

describe('errorHandler logging (NFR-04)', () => {
  test('a database error is logged without its row values', () => {
    const lines = [];
    const err = Object.assign(new Error('new row violates check constraint'), {
      code: '23514',
      detail: 'Failing row contains (SECRET_NOTE_TEXT).',
    });
    const res = mockRes();
    errorHandler({ error: (...args) => lines.push(args.join(' ')) })(err, { method: 'POST', path: '/checkins' }, res, () => {});
    assert.equal(res.code, 500);
    assert.match(lines.join(), /23514/);
    assert.equal(lines.join().includes('SECRET_NOTE_TEXT'), false);
  });
});
