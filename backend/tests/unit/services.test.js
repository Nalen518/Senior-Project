'use strict';

// Service-level tests with in-memory fakes: these pin down the PRD safety rules.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { createCheckinService } = require('../../src/services/checkinService');
const { parseModelReply } = require('../../src/services/nlpService');
const { createInsightService } = require('../../src/services/insightService');

function setup({ crisisResult = false, nlpEnabled = true, applied = true } = {}) {
  const calls = { analyzeLater: [], deleted: [], upserts: [] };
  const service = createCheckinService({
    config: { timeZone: 'Asia/Jakarta' },
    clock: () => new Date('2026-09-28T13:00:00Z'),
    crisis: { check: async () => crisisResult },
    nlp: { enabled: nlpEnabled, analyzeLater: (id, note) => calls.analyzeLater.push({ id, note }) },
    insights: { trend: async () => ({ message: 'Your mood has been fairly steady this week.' }) },
    models: {
      checkins: { upsert: async (row) => (calls.upserts.push(row), { id: 'chk_1', applied }) },
      noteAnalyses: { deleteForCheckin: async (id) => calls.deleted.push(id) },
    },
  });
  return { service, calls };
}

describe('checkinService safety rules', () => {
  test('crisis note: flagged, saved, no insight, and NEVER sent to the LLM', async () => {
    const { service, calls } = setup({ crisisResult: true });
    const res = await service.submit('u1', { mood_value: 1, note_text: 'frasa uji', client_ts: null });
    assert.deepEqual(res, { id: 'chk_1', saved: true, crisis_flag: true });
    assert.equal(calls.upserts[0].crisisFlag, true);
    assert.equal(calls.analyzeLater.length, 0);
  });

  test('normal note: rule-based insight returned, NLP queued in the background', async () => {
    const { service, calls } = setup();
    const res = await service.submit('u1', { mood_value: 3, note_text: 'tugas numpuk', client_ts: null });
    assert.deepEqual(res, { id: 'chk_1', saved: true, insight: 'Your mood has been fairly steady this week.', crisis_flag: false });
    assert.deepEqual(calls.analyzeLater, [{ id: 'chk_1', note: 'tugas numpuk' }]);
  });

  test('NLP switched off: nothing is sent anywhere', async () => {
    const { service, calls } = setup({ nlpEnabled: false });
    await service.submit('u1', { mood_value: 3, note_text: 'tugas numpuk', client_ts: null });
    assert.equal(calls.analyzeLater.length, 0);
  });

  test('check_date is the WIB day of client_ts', async () => {
    const { service, calls } = setup();
    await service.submit('u1', { mood_value: 3, note_text: null, client_ts: new Date('2026-09-27T17:30:00Z') });
    assert.equal(calls.upserts[0].checkDate, '2026-09-28');
  });

  test('sync keeps request order in the response and echoes client_ts as sent', async () => {
    const { service } = setup();
    const entries = [
      { mood_value: 4, note_text: null, client_ts: new Date('2026-09-27T12:00:00Z') },
      { mood_value: 2, note_text: null, client_ts: new Date('2026-09-26T12:00:00Z') },
    ];
    const raw = ['2026-09-27T19:00:00+07:00', '2026-09-26T19:00:00+07:00'];
    const res = await service.sync('u1', entries, raw);
    assert.deepEqual(res.map((r) => r.client_ts), raw);
    assert.ok(res.every((r) => r.saved === true && r.crisis_flag === false));
  });
});

describe('nlpService.parseModelReply', () => {
  const allowed = ['sleep', 'workload'];

  test('accepts clean JSON and drops unknown themes', () => {
    const r = parseModelReply('{"sentiment":"negative","score":0.87,"themes":["sleep","romance","sleep"]}', allowed);
    assert.deepEqual(r, { sentiment: 'negative', score: 0.87, themes: ['sleep'] });
  });

  test('tolerates text around the JSON and clamps the score', () => {
    const r = parseModelReply('Here you go: {"sentiment":"positive","score":1.4,"themes":[]} ', allowed);
    assert.deepEqual(r, { sentiment: 'positive', score: 1, themes: [] });
  });

  test('rejects a reply without a valid sentiment', () => {
    assert.throws(() => parseModelReply('{"sentiment":"sad"}', allowed), /invalid sentiment/);
    assert.throws(() => parseModelReply('I think the student is stressed.', allowed), /no JSON/);
  });
});

describe('insightService themes (FR-13)', () => {
  test('asks for the top 3 themes from the last 14 WIB days and matches resources on them', async () => {
    const calls = {};
    const service = createInsightService({
      config: { timeZone: 'Asia/Jakarta' },
      clock: () => new Date('2026-09-28T13:00:00Z'), // 20:00 WIB on 28 Sep
      models: {
        checkins: { moodsSince: async () => [], hasCrisisSince: async () => false },
        noteAnalyses: {
          recentThemeCodes: async (userId, fromDate, limit) => {
            calls.themes = { userId, fromDate, limit };
            return ['exams', 'sleep'];
          },
          negativeCountSince: async () => 0,
        },
        resources: { match: async (args) => ((calls.match = args), []), bookingOptions: async () => [] },
      },
    });
    const res = await service.getInsight('u1');
    assert.deepEqual(calls.themes, { userId: 'u1', fromDate: '2026-09-15', limit: 3 });
    assert.deepEqual(calls.match, { themeCodes: ['exams', 'sleep'], needsSupport: false });
    assert.deepEqual(res.themes, ['exams', 'sleep']);
  });
});

describe('insightService help card', () => {
  const booking = { id: 'r1', title: 'Ruang Cerita', description: 'D', url: 'https://x', tags: [], faculty: null };
  const make = ({ crisis = false, negative = 0, options = [booking], themes = ['sleep'] } = {}) => {
    const calls = {};
    const service = createInsightService({
      config: { timeZone: 'Asia/Jakarta' },
      clock: () => new Date('2026-09-28T13:00:00Z'),
      models: {
        checkins: {
          moodsSince: async () => [],
          hasCrisisSince: async (userId, from) => ((calls.crisisFrom = from), crisis),
        },
        noteAnalyses: { recentThemeCodes: async () => themes, negativeCountSince: async () => negative },
        resources: { match: async (args) => ((calls.match = args), []), bookingOptions: async () => options },
      },
    });
    return { service, calls };
  };

  test('theme tip, soft booking pointer and every booking option', async () => {
    const res = await make().service.getInsight('u1');
    assert.equal(res.help.suggest_booking, false);
    assert.match(res.help.message, /^Sleep came up/);
    assert.deepEqual(res.help.booking_options, [booking]);
  });

  test('several negative notes make the booking suggestion direct', async () => {
    const res = await make({ negative: 3 }).service.getInsight('u1');
    assert.equal(res.help.suggest_booking, true);
    assert.match(res.help.message, /talk this through with a counsellor/);
  });

  test('recent crisis check-in: reach-out message, support contacts matched, same 14-day window', async () => {
    const { service, calls } = make({ crisis: true });
    const res = await service.getInsight('u1');
    assert.match(res.help.message, /^Please reach out/);
    assert.equal(calls.match.needsSupport, true);
    assert.equal(calls.crisisFrom, '2026-09-15');
  });

  test('no verified booking contacts yet: still a useful message, empty options', async () => {
    const res = await make({ options: [] }).service.getInsight('u1');
    assert.equal(res.help.suggest_booking, false);
    assert.match(res.help.message, /Support page/);
    assert.deepEqual(res.help.booking_options, []);
  });
});
