import assert from 'node:assert/strict';
import test from 'node:test';
import edge from './edge.mjs';
import { createAdsClient } from './google-ads.mjs';
import { bangkokDate, candidatesFor, ipv6RateKey, landingClick, publicIpv6, retentionMs, retryAt } from './policy.mjs';

const landing = 'https://www.siamrooftech.com/lp/google-ads/electric-awning';
const clickId = 'ExampleGoogleClickId12345';
const ip = '2405:1234::88';

test('accepts one Google click ID on the paid landing page', () => {
  assert.equal(landingClick(`${landing}?gclid=${clickId}`), clickId);
  assert.equal(landingClick(`${landing}?gclid=${clickId}&gclid=duplicate`), null);
  assert.equal(landingClick(`${landing}?gbraid=${clickId}`), null);
  assert.equal(landingClick(`${landing}?gclid='%5C%09unsafe`), null);
  assert.equal(landingClick(`${landing.replace('www.siamrooftech.com', 'other.example')}?gclid=${clickId}`), null);
});

test('keeps a single public IPv6 address and skips shared IPv4', () => {
  assert.equal(publicIpv6('2405:1234:0000:0000::0088'), ip);
  assert.equal(ipv6RateKey(ip), ipv6RateKey('2405:1234::99'));
  assert.equal(ipv6RateKey('2405::3:4:5:6:7'), '2405:0:0:3');
  for (const input of ['2405:1234::/64', '192.0.2.15', '::ffff:c000:20f', 'fd00::1', '2001:db8::1']) {
    assert.equal(publicIpv6(input), null, input);
  }
  assert.deepEqual(candidatesFor(ip, ['11', '22'], [{ campaign: '11', address: `${ip}/128` }]), ['22']);
});

test('same-origin beacons enqueue an exact address and plain website visits do not', async () => {
  const enqueued = [];
  const pending = [];
  const env = { RATE_LIMITER: { limit: async ({ key }) => {
    assert.equal(key, '2405:1234:0:0');
    return { success: true };
  } },
    BLOCKER: { add: async (signal) => enqueued.push(signal) } };
  const dispatch = (body, origin = 'https://www.siamrooftech.com') => edge.fetch(new Request(
    'https://www.siamrooftech.com/__ipb', { method: 'POST', body, headers: { Origin: origin, 'CF-Connecting-IP': ip, 'CF-Connecting-IPv6': '2405:9999::99' } },
  ), env, { waitUntil: (job) => pending.push(job) });
  assert.equal((await dispatch(landing)).headers.get('x-ipb'), 'no-click-id');
  assert.equal((await dispatch(`${landing}?gclid=${clickId}`, 'https://other.example')).headers.get('x-ipb'), 'origin-skipped');
  assert.equal((await dispatch(`${landing}?gclid=${clickId}`)).headers.get('x-ipb'), 'queued');
  await Promise.all(pending);
  assert.deepEqual(enqueued, [{ ip, gclid: clickId }]);
});

test('looks up the click by account date and scopes writes to the approved Search campaigns', async () => {
  const calls = [];
  const customer = '1234567890';
  const owned = `customers/${customer}/campaignCriteria/22~73`;
  const client = createAdsClient({ CUSTOMER_ID: customer }, async (url, options) => {
    if (url.includes('oauth2.')) return Response.json({ access_token: 'test', expires_in: 3600 });
    const body = JSON.parse(options.body);
    calls.push(body);
    if (body.query?.includes('FROM click_view')) return Response.json(
      { results: [{ clickView: { gclid: clickId }, campaign: { id: '11' } }] });
    if (body.query?.includes('FROM campaign_criterion')) return Response.json(
      { results: [{ campaign: { id: '11' }, campaignCriterion: { ipBlock: { ipAddress: ip } } }] });
    if (body.query?.includes('FROM campaign')) return Response.json(
      { results: [{ campaign: { id: '11' } }, { campaign: { id: '22' } }, { campaign: { id: '99' } }] });
    return Response.json({ results: [{ resourceName: owned }] });
  });
  const time = Date.parse('2026-11-23T17:10:00Z');
  assert.equal(bangkokDate(time), '2026-11-24');
  assert.equal(await client.verified(clickId, time, ['11', '22']), true);
  assert.match(calls[0].query, /segments.date = '2026-11-24'/);
  assert.equal(await client.verified('DifferentExampleClickId', time, ['22']), false);
  const plan = await client.plan(ip, ['11', '22']);
  assert.deepEqual(plan, ['22']);
  assert.deepEqual(await client.create(ip, plan), [owned]);
  assert.deepEqual(calls.at(-1).operations[0].create, {
    campaign: `customers/${customer}/campaigns/22`, negative: true, ipBlock: { ipAddress: `${ip}/128` },
  });
  await client.remove(owned);
  assert.equal(calls.at(-1).operations, undefined);
});

test('sets a bounded retry window and 30-day exclusion lifetime', () => {
  assert.equal(retryAt(0, 0), 120_000);
  assert.equal(retryAt(7, 0), null);
  assert.equal(retentionMs, 2_592_000_000);
});
