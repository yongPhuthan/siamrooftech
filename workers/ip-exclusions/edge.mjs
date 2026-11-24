import { landingClick, publicIpv6 } from './policy.mjs';

const path = '/__ipb';
const origin = 'https://www.siamrooftech.com';

function done(outcome) {
  return new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store', 'X-IPB': outcome, 'X-IPB-Version': 'verified-click-v1' },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.origin !== origin || url.pathname !== path) return new Response(null, { status: 404 });
    if (request.method !== 'POST') return new Response(null, { status: 405 });
    if (request.headers.get('Origin') !== origin) return done('origin-skipped');
    if (Number(request.headers.get('Content-Length')) > 4096) return done('body-skipped');
    const reader = request.body?.getReader();
    if (!reader) return done('no-click-id');
    const decoder = new TextDecoder();
    let size = 0;
    let body = '';
    for (;;) {
      const { value, done: end } = await reader.read();
      if (end) break;
      size += value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        return done('body-skipped');
      }
      body += decoder.decode(value, { stream: true });
    }
    const gclid = landingClick(body + decoder.decode());
    if (!gclid) return done('no-click-id');
    const ip = publicIpv6(request.headers.get('CF-Connecting-IPv6') ||
      request.headers.get('CF-Connecting-IP'));
    if (!ip) return done('not-ipv6');
    const { success } = await env.RATE_LIMITER.limit({ key: ip });
    if (!success) return done('rate-limited');
    ctx.waitUntil(env.BLOCKER.add({ ip, gclid }).catch(() => {
      console.error('ip_exclusions_enqueue_failed');
    }));
    return done('queued');
  },
};
