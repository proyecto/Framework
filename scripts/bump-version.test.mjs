import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateNextCalVer } from './bump-version.mjs';

test('calculateNextCalVer starts with YYYY.MM.1 for fresh or legacy versions', () => {
  const fixedDate = new Date('2026-11-13T10:00:00Z');
  const res = calculateNextCalVer('0.1.0', 0, fixedDate);

  assert.equal(res.version, '2026.11.1');
  assert.equal(res.versionCode, 26111301);
});

test('calculateNextCalVer increments release sequence monotonically within the same month', () => {
  const fixedDate = new Date('2026-11-13T14:30:00Z');
  const r1 = calculateNextCalVer('2026.11.1', 26111301, fixedDate);
  assert.equal(r1.version, '2026.11.2');
  assert.equal(r1.versionCode, 26111302);

  const r2 = calculateNextCalVer(r1.version, r1.versionCode, fixedDate);
  assert.equal(r2.version, '2026.11.3');
  assert.equal(r2.versionCode, 26111303);
});

test('calculateNextCalVer resets release to 1 when changing month but keeps versionCode increasing', () => {
  const novemberDate = new Date('2026-11-30T23:59:00Z');
  const prev = calculateNextCalVer('2026.11.4', 26113002, novemberDate);

  const decemberDate = new Date('2026-12-01T08:00:00Z');
  const next = calculateNextCalVer(prev.version, prev.versionCode, decemberDate);

  // CalVer se reinicia en el nuevo mes
  assert.equal(next.version, '2026.12.1');
  // versionCode de Android sigue siendo estrictamente mayor (26120101 > 26113002)
  assert.ok(next.versionCode > prev.versionCode);
  assert.equal(next.versionCode, 26120101);
});

