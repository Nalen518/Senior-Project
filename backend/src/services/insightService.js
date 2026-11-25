"use strict";

const { computeTrend } = require("../logic/trendRules");
const { composeHelp } = require("../logic/helpRules");
const { toLocalDate, addDays } = require("../logic/checkDate");

const THEMES_WINDOW_DAYS = 14; // FR-13: themes from the last 14 days of notes, including today
const MAX_THEMES = 3; // FR-13: show at most the top 3
// FR-17: how long a crisis check-in keeps the help card on the reach-out message. Team decision (Nalen + Arya).
const CRISIS_HELP_DAYS = 14;

function createInsightService({ models, config, clock = () => new Date() }) {
  const today = () => toLocalDate(clock(), config.timeZone);

  // Rule-based trend (Stage 1 AI) over the last two weeks of this user's moods.
  async function trend(userId) {
    const day = today();
    const moods = await models.checkins.moodsSince(userId, addDays(day, -13));
    return computeTrend(moods, day);
  }

  return {
    trend,

    /** GET /api/insights -> { trend, message, themes[], resources[], help } */
    async getInsight(userId) {
      const t = await trend(userId);
      const from = addDays(today(), -(THEMES_WINDOW_DAYS - 1));
      const [themes, negativeNotes, recentCrisis, bookingOptions] =
        await Promise.all([
          models.noteAnalyses.recentThemeCodes(userId, from, MAX_THEMES),
          models.noteAnalyses.negativeCountSince(userId, from),
          models.checkins.hasCrisisSince(
            userId,
            addDays(today(), -(CRISIS_HELP_DAYS - 1)),
          ),
          models.resources.bookingOptions(),
        ]);
      const resources = await models.resources.match({
        themeCodes: themes,
        needsSupport: t.needsSupport || recentCrisis,
      });
      const help = composeHelp({
        needsSupport: t.needsSupport,
        themes,
        negativeNotes,
        recentCrisis,
        hasBooking: bookingOptions.length > 0,
      });
      return {
        trend: t.trend,
        message: t.message,
        has_enough_data: t.hasEnoughData,
        themes,
        resources,
        help: {
          ...help,
          booking_options: bookingOptions,
        },
      };
    },
  };
}

module.exports = {
  createInsightService,
  THEMES_WINDOW_DAYS,
  MAX_THEMES,
  CRISIS_HELP_DAYS,
};
