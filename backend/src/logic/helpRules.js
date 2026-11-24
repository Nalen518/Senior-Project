'use strict';

// Stage 3 of the AI pipeline: turns AI labels into a short help message. Deterministic, no LLM.
// GUARDRAILS
//  - The LLM never writes text a student sees. It only returns labels (sentiment, themes) that
//    nlpService has already validated against fixed lists.
//  - Every sentence here is pre-written and approved by the team: calm, non-diagnostic,
//    no em dashes, no semicolons.
//  - The LLM cannot remove the booking pointer. Its labels can only make the wording stronger.
//  - Crisis notes never reach the LLM. A recent crisis check-in overrides everything here.

const NEGATIVE_NOTES_FOR_BOOKING = 3; // negative notes in the window that make the booking line direct

const THEME_TIPS = {
  sleep: 'Sleep came up in your notes. A regular bedtime and less screen time before bed can make a difference.',
  workload: 'Your workload came up in your notes. Breaking tasks into small steps can make them feel lighter.',
  exams: 'Exams came up in your notes. Short breaks between study sessions help you keep going.',
  isolation: 'Feeling alone came up in your notes. A short chat with a friend or classmate can help.',
  relationships: 'Relationships came up in your notes. Talking it through with someone you trust can help.',
  finance: 'Money worries came up in your notes. Writing down what you need this month can make it easier to plan.',
  health: 'Your physical health came up in your notes. Rest, water and a short walk are a good start.',
  motivation: 'Motivation came up in your notes. Starting with one small task is enough for today.',
};

const MESSAGES = {
  general: 'Thank you for checking in. Noticing how you feel is a good first step.',
  bookDirect: 'It might help to talk this through with a counsellor. You can book a session below.',
  bookSoft: 'If you ever want to talk to someone, you can book a session below.',
  noBooking: 'If you ever want to talk to someone, the Support page lists who you can contact.',
  crisis: 'Please reach out to someone today. The contacts on the Support page are there for you.',
};

/**
 * @param {object} input
 * @param {boolean} input.needsSupport   from the rule-based trend (trendRules)
 * @param {string[]} input.themes        top themes from validated LLM labels, most frequent first
 * @param {number} input.negativeNotes   notes labelled negative by the LLM in the window
 * @param {boolean} input.recentCrisis   a crisis-flagged check-in in the window
 * @param {boolean} input.hasBooking     at least one booking contact is available
 * @returns {{ message: string, suggest_booking: boolean }}
 */
function composeHelp({ needsSupport, themes, negativeNotes, recentCrisis, hasBooking }) {
  if (recentCrisis) return { message: MESSAGES.crisis, suggest_booking: hasBooking };

  const tip = THEME_TIPS[themes[0]] || MESSAGES.general;
  const direct = needsSupport || negativeNotes >= NEGATIVE_NOTES_FOR_BOOKING;
  let booking = MESSAGES.noBooking;
  if (hasBooking) booking = direct ? MESSAGES.bookDirect : MESSAGES.bookSoft;
  return { message: `${tip} ${booking}`, suggest_booking: hasBooking && direct };
}

module.exports = { composeHelp, THEME_TIPS, MESSAGES, NEGATIVE_NOTES_FOR_BOOKING };
