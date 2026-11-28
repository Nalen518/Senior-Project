'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { analyzeDemoNotes } = require('../../scripts/seed-demo');

describe('seed-demo AI labels', () => {
  const entries = [{ id: 'a', note: 'fine day' }, { id: 'b', note: 'risk' }, { id: 'c', note: 'tired' }];
  const crisis = { check: async (note) => note === 'risk' };

  test('labels each note one by one and never sends a crisis note to the model', async () => {
    const calls = [];
    const nlp = { enabled: true, analyze: async (id) => calls.push(id) };
    assert.equal(await analyzeDemoNotes({ entries, nlp, crisis }), 2);
    assert.deepEqual(calls, ['a', 'c']);
  });

  test('does nothing when the AI is switched off', async () => {
    const nlp = { enabled: false, analyze: async () => assert.fail('must not be called') };
    assert.equal(await analyzeDemoNotes({ entries, nlp, crisis }), 0);
  });
});
