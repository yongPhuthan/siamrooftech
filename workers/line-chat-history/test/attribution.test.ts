import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAdsTouch, postLeadIntake } from '../../../src/features/line-contact/lead-intake';
import { adsTouchSchema } from '../../../src/features/lead-crm/contracts';
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
test('ChatGPT Ads landing has its own landing id and passes the intake contract', () => {
  const touch = buildAdsTouch('/lp/chatgpt-ads/electric-awning', 'utm_source=chatgpt&utm_medium=cpc&utm_campaign=srt-chatgpt', crypto.randomUUID())!;
  assert.equal(touch.landing_id, 'chatgpt-electric-awning');
  assert.equal(touch.attribution.utm_source, 'chatgpt'); assert.equal('gclid' in touch.attribution, false);
  assert.equal(adsTouchSchema.safeParse(touch).success, true);
  assert.equal(adsTouchSchema.safeParse({ ...touch, landing_path: '/lp/google-ads/electric-awning' }).success, false);
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
