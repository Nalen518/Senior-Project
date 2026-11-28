'use strict';

// Creates the demo account with 4 weeks of mood history so the demo never opens on an empty chart.
// Usage: set DEMO_ANON_TOKEN in .env, then `npm run db:seed-demo`.
// In the browser, put the same token in localStorage for the demo.
// No AI results are faked: when OPENROUTER_API_KEY and OPENROUTER_MODEL are set, the demo notes are labelled
// by the real model (after the crisis check), so the demo dashboard has themes. Without them, no themes.

const fs = require('node:fs');
const path = require('node:path');

const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const { loadConfig } = require('../src/config/env');
const { createPool } = require('../src/db/pool');
const { hashToken, TOKEN_PATTERN } = require('../src/middleware/anonUser');
const { toLocalDate, addDays } = require('../src/logic/checkDate');
const { createModels } = require('../src/models');
const { createCrisisService } = require('../src/services/crisisService');
const { createNlpService } = require('../src/services/nlpService');

// 28 days, oldest first: a normal fortnight, an exam-week dip, then recovery.
const MOODS = [4, 4, 3, 4, 5, 4, 3, 4, 3, 4, 4, 3, 4, 4, 3, 2, 2, 1, 2, 3, 3, 3, 4, 3, 4, 4, 5, 4];
const NOTES = {
  15: 'Exam week is starting and the assignments are piling up.',
  16: 'Barely slept, stayed up studying.',
  17: 'So tired, it feels like I am doing everything alone.',
  19: 'One exam done, a bit relieved.',
  26: 'Evening walk with a friend, feeling better.',
};

// One note at a time. The crisis check runs first: a crisis note is never sent to the model.
async function analyzeDemoNotes({ entries, nlp, crisis }) {
  if (!nlp.enabled) return 0;
  let sent = 0;
  for (const { id, note } of entries) {
    if (!note || (await crisis.check(note))) continue;
    await nlp.analyze(id, note);
    sent += 1;
  }
  return sent;
}

async function main() {
  const token = process.env.DEMO_ANON_TOKEN;
  if (!token || !TOKEN_PATTERN.test(token)) {
    throw new Error('Set DEMO_ANON_TOKEN (16-128 chars: letters, digits, _ or -) in .env first.');
  }

  const config = loadConfig();
  const pool = createPool(config);
  const entries = [];
  const client = await pool.connect(); // one connection, so BEGIN/COMMIT cover every query
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO users (anon_token_hash, is_demo) VALUES ($1, true)
       ON CONFLICT (anon_token_hash) DO UPDATE SET is_demo = true RETURNING id`,
      [hashToken(token)],
    );
    const userId = rows[0].id;
    await client.query('DELETE FROM checkins WHERE user_id = $1', [userId]);

    const today = toLocalDate(new Date());
    for (let i = 0; i < MOODS.length; i += 1) {
      const day = addDays(today, i - (MOODS.length - 1));
      const tappedAt = i === MOODS.length - 1 ? new Date().toISOString() : `${day}T20:00:00+07:00`;
      const inserted = await client.query(
        `INSERT INTO checkins (user_id, mood_value, note_text, check_date, client_ts, created_at)
         VALUES ($1, $2, $3, $4, $5, $5) RETURNING id`,
        [userId, MOODS[i], NOTES[i] ?? null, day, tappedAt],
      );
      if (NOTES[i]) entries.push({ id: inserted.rows[0].id, note: NOTES[i] });
    }
    await client.query('COMMIT');
    console.log(`Demo account ready with ${MOODS.length} days of check-ins.`);

    const models = createModels(pool);
    const nlp = createNlpService({ config, models });
    const sent = await analyzeDemoNotes({ entries, nlp, crisis: createCrisisService({ models }) });
    const { rows: done } = await client.query(
      `SELECT count(*)::int AS n FROM note_analyses a JOIN checkins c ON c.id = a.checkin_id
        WHERE c.user_id = $1 AND a.status = 'done'`,
      [userId],
    );
    console.log(nlp.enabled ? `AI labelled ${done[0].n} of ${sent} demo notes.` : 'AI is off: no themes for the demo.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  });
}

module.exports = { analyzeDemoNotes };
