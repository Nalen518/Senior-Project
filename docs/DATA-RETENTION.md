# MindMeter data retention and deletion

For SRD section 6 (Retention) and NFR-04. The periods marked **proposed** need the team's agreement.

## 1. What is stored

| Data | Where | Why | Kept |
|------|-------|-----|------|
| Random anonymous token | Student's browser (`localStorage`) | Recognise the same browser | Until the student clears site data |
| SHA-256 hash of the token | Supabase `users` | Link check-ins to one browser | Project period |
| Mood, optional note (max 200 characters), date, crisis flag | Supabase `checkins` | Dashboard and trend | Project period |
| Sentiment, score, themes, model name | Supabase `note_analyses`, `analysis_themes` | Themes and help card | Deleted with the check-in |
| Offline check-ins | Student's browser | Send them when back online | Until sent. Items older than 29 days are dropped |
| Request log: request id, method, path, status, time taken | Host logs (Railway) | Debugging | As long as the host keeps logs |
| IP address for the rate limit | Server memory only | Stop floods | Gone when the server restarts |
| Support contacts, crisis phrases, themes | Supabase | App content, not personal data | Project period |

Not collected: name, email, student number, faculty or any other personal detail. The faculty picker stays in the browser.

A note is free text, so a student could type personal details into it. Treat notes as sensitive.

Logs never contain the note, the token or its hash. The hosting providers may record connection details such as IP addresses under their own policies.

## 2. What leaves our system

Only the note text of a non-crisis check-in, sent to OpenRouter without any user id.

- Every request sets `provider.data_collection: "deny"` and `provider.zdr: true`, so it is routed only to providers with zero data retention. If none is available the analysis is marked `failed`.
- OpenRouter states that it does not store prompts or responses unless the account opts in, or content is flagged as illegal material about children. It keeps metadata such as token counts and timing. See [Data collection](https://openrouter.ai/docs/guides/privacy/data-collection) and [Zero data retention](https://openrouter.ai/docs/guides/features/zdr) (read 28 November 2026).
- Account settings to keep: private input and output logging **off**, OpenRouter use of inputs and outputs **off**, and zero data retention only (no safety retention endpoints, which may keep prompts to detect abuse).

## 3. Retention periods

| When | Action |
|------|--------|
| During the project | Keep data. Only invented notes are used in tests, seeds and the demo |
| After the usability test | **Proposed:** delete participants' data within 7 days |
| After final grading | **Proposed:** delete all check-ins and users by 15 January 2027, then delete or pause the Supabase project and remove the OpenRouter key |

Nothing is deleted automatically. A team member runs the steps below.

## 4. How to delete

Run in the Supabase SQL Editor. Deleting a user also deletes their check-ins and analyses (`ON DELETE CASCADE`).

One student, on request. They give the value of `mindmeter_anon_token` from their browser, because that is the only way to know which data is theirs:

```sql
DELETE FROM users
WHERE anon_token_hash = encode(sha256(convert_to('PASTE_TOKEN_HERE', 'UTF8')), 'hex');
```

All student data, keeping the demo account:

```sql
DELETE FROM users WHERE NOT is_demo;
```

Everything personal, including the demo account:

```sql
DELETE FROM users;
```

Check the result:

```sql
SELECT (SELECT count(*) FROM users) AS users,
       (SELECT count(*) FROM checkins) AS checkins,
       (SELECT count(*) FROM note_analyses) AS analyses;
```

Copies in database backups, if the Supabase plan keeps any, expire under Supabase's own schedule.

## 5. Limits
- Students cannot delete their data from the app. `DELETE /api/me` (SRD FR-16) is optional and not built.
- A student who has cleared their browser cannot prove which data was theirs. It is removed with the end-of-project deletion.
