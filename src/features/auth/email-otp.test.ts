import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { getPlatformProxy } from 'wrangler';
import { createAuth } from './auth';
import type { EmailMessageBuilder } from '../../../cloudflare-runtime';

describe('owner email OTP registration and access', () => {
  let proxy: Awaited<ReturnType<typeof getPlatformProxy>>;
  const deliveries: EmailMessageBuilder[] = [];
  const clientIPs = new WeakMap<ReturnType<typeof createAuth>, string>();
  let clientSequence = 0;
  const origin = 'http://localhost:3002';
  const mail = { send: vi.fn(async (message: EmailMessageBuilder) => {
    deliveries.push(message);
    return { messageId: 'local-test-delivery' };
  }) } as unknown as SendEmail;

  beforeAll(async () => {
    proxy = await getPlatformProxy<{ APP_DB: D1Database }>({ configPath: 'wrangler.jsonc', persist: false, remoteBindings: false });
    const db = (proxy.env as { APP_DB: D1Database }).APP_DB;
    for (const file of ['0000_cms_auth.sql', '0002_auth_otp.sql']) {
      const sql = readFileSync(`drizzle/migrations/${file}`, 'utf8');
      await db.batch(sql.split(';').map((part) => part.trim()).filter(Boolean).map((part) => db.prepare(part)));
    }
  }, 30000);

  afterAll(async () => { vi.useRealTimers(); await proxy?.dispose(); });

  function authFor(email: string, emailBinding: SendEmail = mail) {
    const auth = createAuth({
      APP_DB: (proxy.env as { APP_DB: D1Database }).APP_DB,
      BETTER_AUTH_SECRET: 'test-only-secret-at-least-32-characters-long',
      BETTER_AUTH_URL: origin,
      ADMIN_ALLOWED_EMAILS: email,
      AUTH_EMAIL_FROM: 'noreply@siamrooftech.com',
      AUTH_EMAIL_DELIVERY: 'live',
      AUTH_EMAIL: emailBinding,
    });
    clientIPs.set(auth, `192.0.2.${++clientSequence}`);
    return auth;
  }

  function call(auth: ReturnType<typeof createAuth>, path: string, body?: unknown, cookie?: string) {
    return auth.handler(new Request(`${origin}/api/auth${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'content-type': 'application/json', origin, host: 'localhost:3002', 'cf-connecting-ip': clientIPs.get(auth) ?? '192.0.2.200', ...(cookie ? { cookie } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }));
  }

  function latestCode() {
    const code = deliveries.at(-1)?.text?.match(/\b\d{6}\b/)?.[0];
    if (!code) throw new Error('The email must contain a six-digit verification code.');
    return code;
  }

  it('registers the approved owner only after OTP verification and issues a verified admin session', async () => {
    const email = 'owner-registration@example.invalid';
    const auth = authFor(email);
    const sent = await call(auth, '/email-otp/send-verification-otp', { email, type: 'sign-in' });
    expect(sent.status).toBe(200);
    expect((await (await call(auth, '/get-session')).json())).toBeNull();
    const signedIn = await call(auth, '/sign-in/email-otp', { email, otp: latestCode(), name: 'Owner' });
    expect(signedIn.status).toBe(200);
    const setCookies = signedIn.headers.getSetCookie();
    expect(setCookies.join(';')).toContain('HttpOnly');
    const cookie = setCookies.map((value) => value.split(';')[0]).join('; ');
    const session = await (await call(auth, '/get-session', undefined, cookie)).json();
    expect(session.user).toMatchObject({ email, emailVerified: true, role: 'admin' });
    const replay = await call(auth, '/sign-in/email-otp', { email, otp: latestCode() });
    expect(replay.status).toBe(400);
  });

  it('rejects other mailboxes and browser-supplied roles without sending a code', async () => {
    const auth = authFor('approved@example.invalid');
    const before = deliveries.length;
    expect((await call(auth, '/email-otp/send-verification-otp', { email: 'stranger@example.invalid', type: 'sign-in' })).status).toBe(403);
    expect((await call(auth, '/sign-in/email-otp', { email: 'stranger@example.invalid', otp: '123456', role: 'admin' })).status).toBe(403);
    expect(deliveries.length).toBe(before);
    expect((await (await call(auth, '/get-session')).json())).toBeNull();
    expect((await call(auth, '/sign-up/email', { email: 'approved@example.invalid', password: 'A-valid-but-unverified-password', name: 'Owner' })).status).toBe(400);
  });

  it('keeps the current code valid when an early resend is rejected across auth instances', async () => {
    const email = 'cooldown@example.invalid';
    const first = authFor(email);
    expect((await call(first, '/email-otp/send-verification-otp', { email, type: 'sign-in' })).status).toBe(200);
    const code = latestCode();
    const retry = await call(authFor(email), '/email-otp/send-verification-otp', { email, type: 'sign-in' });
    expect(retry.status).toBe(429);
    expect(retry.headers.get('retry-after')).toBe('60');
    expect((await call(first, '/sign-in/email-otp', { email, otp: code })).status).toBe(200);
  });

  it('rejects incorrect codes and invalidates the code after five failed attempts', async () => {
    const email = 'attempts@example.invalid';
    const auth = authFor(email);
    expect((await call(auth, '/email-otp/send-verification-otp', { email, type: 'sign-in' })).status).toBe(200);
    const code = latestCode();
    const wrongCode = code === '111111' ? '222222' : '111111';
    for (let attempt = 0; attempt < 5; attempt++) {
      const wrong = await call(auth, '/sign-in/email-otp', { email, otp: wrongCode });
      expect(wrong.status).toBe(400);
      expect(wrong.headers.get('set-cookie')).toBeNull();
    }
    expect((await call(auth, '/sign-in/email-otp', { email, otp: code })).status).toBe(403);
    expect((await (await call(auth, '/get-session')).json())).toBeNull();
  });

  it('rejects an expired code without creating a session', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      const email = 'expired@example.invalid';
      const auth = authFor(email);
      expect((await call(auth, '/email-otp/send-verification-otp', { email, type: 'sign-in' })).status).toBe(200);
      const code = latestCode();
      vi.setSystemTime(Date.now() + 301_000);
      const expired = await call(auth, '/sign-in/email-otp', { email, otp: code });
      expect(expired.status).toBe(400);
      expect((await expired.json()).code).toBe('OTP_EXPIRED');
      expect(expired.headers.get('set-cookie')).toBeNull();
    } finally { vi.useRealTimers(); }
  });

  it('fails closed when owner configuration or email delivery is unavailable', async () => {
    const unconfigured = authFor('');
    expect((await call(unconfigured, '/email-otp/send-verification-otp', { email: 'owner@example.invalid', type: 'sign-in' })).status).toBe(503);
    const unavailable = { send: async () => { throw new Error('Provider unavailable'); } } as unknown as SendEmail;
    const auth = authFor('delivery-failure@example.invalid', unavailable);
    const response = await call(auth, '/email-otp/send-verification-otp', { email: 'delivery-failure@example.invalid', type: 'sign-in' });
    expect(response.status).toBe(503);
    expect((await response.json()).code).toBe('OTP_DELIVERY_UNAVAILABLE');
  });

  it('rejects a cross-origin OTP request without sending mail', async () => {
    const email = 'csrf@example.invalid';
    const auth = authFor(email);
    const before = deliveries.length;
    const response = await auth.handler(new Request(`${origin}/api/auth/email-otp/send-verification-otp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://untrusted.example', host: 'localhost:3002', 'cf-connecting-ip': '192.0.2.245' },
      body: JSON.stringify({ email, type: 'sign-in' }),
    }));
    expect(response.status).toBe(403);
    expect(deliveries.length).toBe(before);
  });

  it('uses cookies compatible with the actual localhost origin in a production Worker preview', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    try {
      const email = 'preview-cookie@example.invalid';
      const auth = authFor(email);
      expect((await call(auth, '/email-otp/send-verification-otp', { email, type: 'sign-in' })).status).toBe(200);
      const response = await call(auth, '/sign-in/email-otp', { email, otp: latestCode() });
      expect(response.status).toBe(200);
      expect(/; Secure/i.test(response.headers.getSetCookie().join(';'))).toBe(false);
    } finally { vi.unstubAllEnvs(); }
  });
});
