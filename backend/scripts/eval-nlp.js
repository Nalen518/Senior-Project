'use strict';

// Checks the OpenRouter model on invented notes (PROJECT-PLAN MM-501).
// Usage: put OPENROUTER_API_KEY and OPENROUTER_MODEL in backend/.env, then `npm run eval:nlp`.
// It runs the same nlpService code as production, sends only the invented notes in data/eval-notes.json
// and writes nothing to a database.

const fs = require('node:fs');
const path = require('node:path');

const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const { createNlpService } = require('../src/services/nlpService');

const THEMES = ['sleep', 'workload', 'exams', 'isolation', 'relationships', 'finance', 'health', 'motivation'];

async function main() {
  const { OPENROUTER_API_KEY: apiKey, OPENROUTER_MODEL: model } = process.env;
  if (!apiKey || !model) throw new Error('Set OPENROUTER_API_KEY and OPENROUTER_MODEL in backend/.env first.');

  const { notes } = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'eval-notes.json'), 'utf8'));
  let outcome;
  const nlp = createNlpService({
    config: { openrouter: { enabled: true, apiKey, model, baseUrl: 'https://openrouter.ai/api/v1', timeoutMs: 15000 } },
    logger: { error() {} },
    models: {
      themes: { listCodes: async () => THEMES },
      noteAnalyses: {
        createPending: async () => 'eval',
        markDone: async (id, result) => { outcome = { ok: true, ...result }; },
        markFailed: async (id, message) => { outcome = { ok: false, message }; },
      },
    },
  });

  const rows = [];
  for (const n of notes) {
    outcome = null;
    const start = Date.now();
    await nlp.analyze('eval', n.text);
    const ms = Date.now() - start;
    const themes = outcome?.ok ? outcome.themeCodes : [];
    const hits = n.expected_themes.filter((t) => themes.includes(t)).length;
    rows.push({
      lang: n.lang,
      ok: Boolean(outcome?.ok),
      sentimentOk: outcome?.sentiment === n.expected_sentiment,
      expected: n.expected_themes.length,
      hits,
      got: themes.length,
      ms,
      detail: outcome?.ok ? `${outcome.sentiment} [${themes.join(', ')}]` : `FAILED ${outcome?.message}`,
    });
  }

  rows.forEach((r, i) => console.log(`${String(i + 1).padStart(2)} ${r.lang} ${r.sentimentOk ? 'ok ' : 'MISS'} ${String(r.ms).padStart(5)} ms  ${r.detail}`));

  const pct = (a, b) => (b === 0 ? 'n/a' : `${Math.round((a / b) * 100)}%`);
  const summarize = (label, list) => {
    const times = list.map((r) => r.ms).sort((a, b) => a - b);
    console.log(
      `| ${label} | ${list.length} | ${list.filter((r) => !r.ok).length} | ${pct(list.filter((r) => r.sentimentOk).length, list.length)} | ` +
      `${pct(list.reduce((s, r) => s + r.hits, 0), list.reduce((s, r) => s + r.expected, 0))} | ` +
      `${pct(list.reduce((s, r) => s + r.hits, 0), list.reduce((s, r) => s + r.got, 0))} | ` +
      `${times[Math.floor(times.length / 2)]} | ${times[times.length - 1]} |`,
    );
  };
  console.log(`\nModel: ${model}\n`);
  console.log('| Notes | Count | Failed | Sentiment correct | Theme recall | Theme precision | Median ms | Max ms |');
  console.log('|-------|-------|--------|-------------------|--------------|-----------------|-----------|--------|');
  summarize('All', rows);
  summarize('English', rows.filter((r) => r.lang === 'en'));
  summarize('Indonesian', rows.filter((r) => r.lang === 'id'));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
