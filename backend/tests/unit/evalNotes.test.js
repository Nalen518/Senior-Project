'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { notes } = require('../../data/eval-notes.json');
const { validateKeywords } = require('../../scripts/lib/safetyData');
const { containsCrisisKeyword } = require('../../src/logic/crisisCheck');

const { phrases } = validateKeywords(require('../../data/crisis-keywords.json'));
const THEMES = ['sleep', 'workload', 'exams', 'isolation', 'relationships', 'finance', 'health', 'motivation'];

describe('MM-501 evaluation notes', () => {
  test('20 notes, 10 English and 10 Indonesian', () => {
    assert.equal(notes.length, 20);
    assert.equal(notes.filter((n) => n.lang === 'en').length, 10);
    assert.equal(notes.filter((n) => n.lang === 'id').length, 10);
  });

  test('every note fits the 200 character limit and uses valid labels', () => {
    for (const n of notes) {
      assert.ok(n.text.length <= 200, n.text);
      assert.ok(['positive', 'neutral', 'negative'].includes(n.expected_sentiment), n.text);
      assert.ok(n.expected_themes.every((t) => THEMES.includes(t)), n.text);
    }
  });

  test('every theme and every sentiment is covered', () => {
    for (const t of THEMES) assert.ok(notes.some((n) => n.expected_themes.includes(t)), t);
    for (const s of ['positive', 'neutral', 'negative']) assert.ok(notes.some((n) => n.expected_sentiment === s), s);
  });

  test('no note is a crisis note, since those never reach the model', () => {
    assert.ok(phrases.length > 0);
    for (const n of notes) assert.equal(containsCrisisKeyword(n.text, phrases), false, n.text);
  });
});
