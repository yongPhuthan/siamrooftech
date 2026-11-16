import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAdsTouch, postLeadIntake } from '../../../src/features/line-contact/lead-intake';
test('CRM capture is page-scoped and ignores stale global analytics storage', () => {
  const session = crypto.randomUUID();
  assert.equal(buildAdsTouch('/', 'gclid=old-paid', session), null);
  assert.equal(buildAdsTouch('/services/retractable-awning', 'gclid=old-paid', session), null);
  const fresh = buildAdsTouch('/lp/google-ads/electric-awning', 'gclid=new-paid&utm_campaign=fresh&srt_adgroupid=large-string-id&email=ignored', session)!;
  assert.equal(fresh.attribution.gclid, 'new-paid'); assert.equal(fresh.attribution.utm_campaign, 'fresh');
  assert.equal('email' in fresh.attribution, false); assert.equal('ref_code' in fresh, false);
  const direct = buildAdsTouch('/lp/google-ads/electric-awning', '', session)!;
  assert.deepEqual(direct.attribution, {});
});
test('intake is fire-and-forget even when transport throws or rejects', async (t) => {
  const payload = buildAdsTouch('/lp/google-ads/electric-awning', '', crypto.randomUUID())!;
  t.mock.method(globalThis, 'fetch', () => { throw new Error('fixture'); });
  assert.doesNotThrow(() => postLeadIntake(payload));
  t.mock.restoreAll();
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('fixture'); });
  assert.equal(postLeadIntake(payload), undefined);
  await new Promise((resolve) => setImmediate(resolve));
});
