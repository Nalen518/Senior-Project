'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { composeHelp, THEME_TIPS, MESSAGES, NEGATIVE_NOTES_FOR_BOOKING } = require('../../src/logic/helpRules');

const base = { needsSupport: false, themes: [], negativeNotes: 0, recentCrisis: false, hasBooking: true };

describe('composeHelp (AI labels -> pre-written help)', () => {
  test('no labels yet: general line plus a soft booking pointer', () => {
    assert.deepEqual(composeHelp(base), { message: `${MESSAGES.general} ${MESSAGES.bookSoft}`, suggest_booking: false });
  });

  test('uses the tip for the most frequent theme only', () => {
    const { message } = composeHelp({ ...base, themes: ['sleep', 'exams'] });
    assert.equal(message, `${THEME_TIPS.sleep} ${MESSAGES.bookSoft}`);
  });

  test('unknown theme falls back to the general line', () => {
    assert.match(composeHelp({ ...base, themes: ['not_a_theme'] }).message, /^Thank you for checking in/);
  });

  test('low trend makes the booking line direct', () => {
    assert.deepEqual(composeHelp({ ...base, needsSupport: true }), {
      message: `${MESSAGES.general} ${MESSAGES.bookDirect}`,
      suggest_booking: true,
    });
  });

  test('negative notes make it direct only from the threshold up', () => {
    assert.equal(composeHelp({ ...base, negativeNotes: NEGATIVE_NOTES_FOR_BOOKING - 1 }).suggest_booking, false);
    assert.equal(composeHelp({ ...base, negativeNotes: NEGATIVE_NOTES_FOR_BOOKING }).suggest_booking, true);
  });

  test('recent crisis check-in overrides themes with the reach-out line', () => {
    assert.deepEqual(composeHelp({ ...base, themes: ['sleep'], recentCrisis: true }), {
      message: MESSAGES.crisis,
      suggest_booking: true,
    });
  });

  test('no verified booking contacts: points to the Support page and never suggests booking', () => {
    assert.deepEqual(composeHelp({ ...base, needsSupport: true, hasBooking: false }), {
      message: `${MESSAGES.general} ${MESSAGES.noBooking}`,
      suggest_booking: false,
    });
    assert.equal(composeHelp({ ...base, recentCrisis: true, hasBooking: false }).suggest_booking, false);
  });

  test('every sentence follows the copy rules: no em dashes, no semicolons, no diagnosis words', () => {
    const all = [...Object.values(THEME_TIPS), ...Object.values(MESSAGES)];
    for (const s of all) {
      assert.doesNotMatch(s, /[—;]/, s);
      assert.doesNotMatch(s, /\b(depress\w*|anxiety disorder|diagnos\w*|disorder|symptom\w*)\b/i, s);
    }
  });

  test('there is a tip for every theme in the fixed theme list', () => {
    assert.deepEqual(Object.keys(THEME_TIPS).sort(),
      ['exams', 'finance', 'health', 'isolation', 'motivation', 'relationships', 'sleep', 'workload']);
  });
});
