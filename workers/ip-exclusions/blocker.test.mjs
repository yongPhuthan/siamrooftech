import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import test from 'node:test';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

const customer = '1234567890';
const clickId = 'ExampleGoogleClickId12345';
const ip = '2405:1234::88';
const harness = `
  import Blocker, { ClickLedger as Ledger } from './blocker.mjs';
  export class ClickLedger extends Ledger {
    inspect() {
      return {
        clicks: this.sql.exec('SELECT gclid, ip, next_run FROM clicks').toArray(),
        exclusions: this.sql.exec('SELECT * FROM exclusions ORDER BY resource_name').toArray(),
      };
    }
  }
  export default {
    async fetch(request, env, ctx) {
      if (request.method === 'GET') {
        return Response.json(await env.CLICK_LEDGER.getByName('siamrooftech-search').inspect());
      }
      await new Blocker(ctx, env).add(await request.json());
      return new Response(null, { status: 204 });
    },
  };
`;

const code = await Promise.all(['blocker.mjs', 'policy.mjs', 'google-ads.mjs'].map(async (path) => ({
  type: 'ESModule', path, contents: await readFile(new URL(path, import.meta.url), 'utf8'),
})));

for (const mode of ['audit', 'live']) {
  test(`queue verifies and deduplicates a first click in ${mode} mode`, { timeout: 15_000 }, async () => {
    const queries = [];
    const writes = [];
    const runtime = new Miniflare(convertV4MiniflareOptions({
      compatibilityDate: '2025-09-01',
      modules: [{ type: 'ESModule', path: 'harness.mjs', contents: harness }, ...code],
      durableObjects: { CLICK_LEDGER: { className: 'ClickLedger', useSQLite: true } },
      bindings: { CUSTOMER_ID: customer, IP_EXCLUSIONS_MODE: mode, CAMPAIGN_IDS: '11,22' },
      outboundService: async (request) => {
        if (new URL(request.url).hostname === 'oauth2.googleapis.com') {
          return Response.json({ access_token: 'test', expires_in: 3600 });
        }
        const body = await request.json();
        if (body.query) {
          queries.push(body.query);
          if (body.query.includes('FROM click_view')) {
            return Response.json({ results: [{ clickView: { gclid: clickId }, campaign: { id: '11' } }] });
          }
          if (body.query.includes('FROM campaign_criterion')) return Response.json({});
          if (body.query.includes('FROM campaign')) {
            return Response.json({ results: [{ campaign: { id: '11' } }, { campaign: { id: '22' } }] });
          }
        }
        writes.push(body);
        return Response.json({ results: [11, 22].map((id) => ({
          resourceName: `customers/${customer}/campaignCriteria/${id}~71`,
        })) });
      },
    }));
    try {
      const send = (signal) => runtime.dispatchFetch('http://localhost', {
        method: 'POST', body: JSON.stringify(signal),
      });
      assert.equal((await send('2405:1234::/64')).status, 204);
      assert.equal((await send({ ip, gclid: clickId })).status, 204);
      assert.equal((await send({ ip, gclid: clickId })).status, 204);
      const deadline = Date.now() + 8000;
      async function inspect() {
        return (await runtime.dispatchFetch('http://localhost')).json();
      }
      let snapshot = await inspect();
      while (Date.now() < deadline && snapshot.clicks.some((row) => row.next_run !== null)) {
        await setTimeout(50);
        snapshot = await inspect();
      }
      assert.deepEqual(snapshot.clicks, [{ gclid: null, ip: null, next_run: null }]);
      assert.equal(snapshot.exclusions.length, mode === 'live' ? 2 : 0);
      assert.equal(queries.filter((query) => query.includes('FROM click_view')).length, 1);
      assert.equal(queries.length, 3);
      assert.equal(writes.length, mode === 'live' ? 1 : 0);
      if (mode === 'live') {
        assert.deepEqual(snapshot.exclusions.map((row) => row.resource_name),
          [11, 22].map((id) => `customers/${customer}/campaignCriteria/${id}~71`));
        for (const row of snapshot.exclusions) {
          assert.ok(Math.abs(row.next_run - Date.now() - 30 * 86_400_000) < 10_000);
        }
        assert.deepEqual(writes[0].operations.map(({ create }) => create.ipBlock.ipAddress), [`${ip}/128`, `${ip}/128`]);
      }
    } finally {
      await runtime.dispose();
    }
  });
}
