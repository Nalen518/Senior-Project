'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validateKeywords, validateResources, FACULTY_CODES } = require('../../scripts/lib/safetyData');
const { containsCrisisKeyword } = require('../../src/logic/crisisCheck');
const { toResource } = require('../../src/models/resources');

describe('toResource (how contacts reach the support screen)', () => {
  const row = { id: 'r1', title: 'T', description: 'D', url: 'https://ugm.id/x', phone: '+62 813-9173-7076', tags: [] };

  test('primary crisis contact with a phone and a website: the phone wins', () => {
    assert.equal(toResource({ ...row, type: 'counselling', is_primary_crisis: true }).url, 'tel:+6281391737076');
  });

  test('crisis contact without a phone: falls back to the website', () => {
    assert.equal(toResource({ ...row, phone: null, type: 'crisis', is_primary_crisis: false }).url, 'https://ugm.id/x');
  });

  test('ordinary resource: the website wins, phone-only becomes tel:', () => {
    assert.equal(toResource({ ...row, type: 'self_help', is_primary_crisis: false }).url, 'https://ugm.id/x');
    assert.equal(toResource({ ...row, url: null, type: 'self_help', is_primary_crisis: false }).url, 'tel:+6281391737076');
  });
});

const THEMES = ['sleep', 'workload', 'isolation'];

describe('validateKeywords', () => {
  test('refuses an unreviewed list', () => {
    const { errors } = validateKeywords({ reviewed_by: '', reviewed_on: '', phrases: ['frasa uji'] });
    assert.equal(errors.length, 2);
    assert.match(errors.join(), /reviewed_by/);
    assert.match(errors.join(), /reviewed_on/);
  });

  test('normalizes and de-duplicates phrases', () => {
    const { phrases, errors } = validateKeywords({ reviewed_by: 'Tim', reviewed_on: '2026-09-28', phrases: ['Frasa  Uji!', 'frasa uji', 'kata-uji'] });
    assert.deepEqual(errors, []);
    assert.deepEqual(phrases, ['frasa uji', 'kata uji']);
  });

  test('refuses empty phrases and an empty list', () => {
    assert.match(validateKeywords({ reviewed_by: 'Tim', reviewed_on: '2026-09-28', phrases: ['ok', '  ', 5] }).errors.join(), /#2.*#3|#2/);
    assert.match(validateKeywords({ reviewed_by: 'Tim', reviewed_on: '2026-09-28', phrases: [] }).errors.join(), /non-empty/);
  });
});

describe('validateResources', () => {
  const ok = { title: 'Kontak', description: 'Desc', phone: '+62 1', url: null, type: 'crisis', tags: ['sleep'], verified_at: '2026-09-28', support_group: 'crisis' };

  test('accepts a verified contact', () => {
    const { resources, errors } = validateResources({ resources: [ok] }, THEMES);
    assert.deepEqual(errors, []);
    assert.equal(resources[0].phone, '+62 1');
  });

  test('refuses a contact without verified_at', () => {
    const { errors } = validateResources({ resources: [{ ...ok, verified_at: '' }] }, THEMES);
    assert.match(errors.join(), /verified_at is missing/);
  });

  test('refuses a contact with no url and no phone, a bad type, or unknown tags', () => {
    const { errors } = validateResources({ resources: [{ ...ok, phone: null, type: 'hotline', tags: ['romance'] }] }, THEMES);
    assert.match(errors.join(), /url or a phone/);
    assert.match(errors.join(), /type must be/);
    assert.match(errors.join(), /unknown tags romance/);
  });

  test('allows at most one primary crisis contact', () => {
    const { errors } = validateResources({ resources: [{ ...ok, is_primary_crisis: true }, { ...ok, is_primary_crisis: true }] }, THEMES);
    assert.match(errors.join(), /at most one/);
  });

  test('every contact in backend/data is verified and valid, with exactly one primary crisis contact', () => {
    const res = validateResources(require('../../data/resources.json'), ['sleep', 'workload', 'exams', 'isolation', 'relationships', 'finance', 'health', 'motivation']);
    assert.deepEqual(res.errors, []);
    assert.equal(res.resources.length, 18);
    assert.equal(res.resources.filter((r) => r.is_primary_crisis).length, 1);
  });
});

describe('faculty codes', () => {
  const ok = { title: 'T', description: 'D', url: 'https://x', type: 'counselling', verified_at: '2026-11-16', tags: [], support_group: 'university' };

  test('a known faculty on a counselling service is kept', () => {
    const { resources, errors } = validateResources({ resources: [{ ...ok, faculty: 'engineering', support_group: 'faculty' }] }, []);
    assert.deepEqual(errors, []);
    assert.equal(resources[0].faculty, 'engineering');
  });

  test('missing faculty means UGM-wide (null)', () => {
    assert.equal(validateResources({ resources: [ok] }, []).resources[0].faculty, null);
  });

  test('unknown faculty, or a faculty on a non-counselling entry, is refused', () => {
    assert.match(validateResources({ resources: [{ ...ok, faculty: 'astrology' }] }, []).errors.join(), /unknown faculty/);
    assert.match(validateResources({ resources: [{ ...ok, type: 'crisis', faculty: 'law' }] }, []).errors.join(), /only counselling/);
  });

  test('backend list matches FacultyCode in shared/contract.ts', () => {
    const ts = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'shared', 'contract.ts'), 'utf8');
    const union = ts.match(/export type FacultyCode =([^;]+);/)[1];
    assert.deepEqual([...union.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort(), [...FACULTY_CODES].sort());
  });

  test('every faculty in data/resources.json is valid', () => {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'resources.json'), 'utf8'));
    for (const r of data.resources) if (r.faculty) assert.ok(FACULTY_CODES.includes(r.faculty), r.faculty);
  });
});

describe('the real crisis keyword list (FR-05)', () => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'crisis-keywords.json'), 'utf8'));
  const { phrases, errors } = validateKeywords(data);

  test('is reviewed, so seed-safety will load it', () => {
    assert.deepEqual(errors, []);
  });

  test('every phrase in the list triggers the crisis check inside a normal sentence', () => {
    for (const p of phrases) assert.equal(containsCrisisKeyword(`Hari ini berat, ${p}.`, phrases), true, p);
  });

  test('English and Indonesian examples are caught', () => {
    for (const note of ['I want to die', 'Sometimes I think about suicide.', 'aku mau bunuh diri', 'Pengen mati aja rasanya!']) {
      assert.equal(containsCrisisKeyword(note, phrases), true, note);
    }
  });

  test('ordinary notes are not flagged', () => {
    for (const note of ['Tugas numpuk, capek banget', 'Exam week, barely slept', 'This deadline is killing me']) {
      assert.equal(containsCrisisKeyword(note, phrases), false, note);
    }
  });
});
