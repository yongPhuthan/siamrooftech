import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import test from 'node:test';
import { getPlatformProxy } from 'wrangler';

test('Better Auth persists a privileged local session and rejects public registration', async () => {
  const proxy = await getPlatformProxy({ configPath: 'wrangler.jsonc', persist: true, remoteBindings: false });
  const env = proxy.env;
  const email = `local-qa-${randomUUID()}@example.invalid`;
  const password = `Qa-${randomBytes(20).toString('base64url')}-9a!`;
  let userId;

  try {
    const { createAuth } = await import('../src/features/auth/auth.ts');
    const { provisionAdminUser } = await import('./admin-users.mjs');
    const auth = createAuth(env);
    const context = await auth.$context;
    const user = await provisionAdminUser({
      findUserByEmail: (value, options) => context.internalAdapter.findUserByEmail(value, options),
      findUserById: (id) => context.internalAdapter.findUserById(id),
      createUser: (data, source) => context.internalAdapter.createUser(data, source),
      createAccount: (data) => context.internalAdapter.createAccount(data),
      updateUser: (id, data) => context.internalAdapter.updateUser(id, data),
      deleteUserSessions: (id) => context.internalAdapter.deleteUserSessions(id),
      findCredentialAccount: (id) => context.internalAdapter.findCredentialAccount(id),
      updatePassword: (id, hash) => context.internalAdapter.updatePassword(id, hash),
      hashPassword: (value) => context.password.hash(value),
    }, { action: 'create', email, name: 'Local QA', password });
    userId = user.id;

    const signin = await auth.handler(new Request('http://localhost:3000/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      body: JSON.stringify({ email, password }),
    }));
    assert.equal(signin.status, 200, 'local credentials sign in');
    const cookies = typeof signin.headers.getSetCookie === 'function'
      ? signin.headers.getSetCookie().map((value) => value.split(';', 1)[0]).join('; ')
      : (signin.headers.get('set-cookie') || '').split(/,(?=\s*[^;=]+=)/).map((value) => value.trim().split(';', 1)[0]).join('; ');
    assert.ok(cookies, 'sign in returns a session cookie');

    const sessionResponse = await auth.handler(new Request('http://localhost:3000/api/auth/get-session', { headers: { cookie: cookies } }));
    assert.equal(sessionResponse.status, 200);
    const session = await sessionResponse.json();
    assert.equal(session.user.role, 'admin', 'session exposes the persisted administrative role');

    const registration = await auth.handler(new Request('http://localhost:3000/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      body: JSON.stringify({ email: `signup-${randomUUID()}@example.invalid`, name: 'Public Signup', password }),
    }));
    assert.notEqual(registration.status, 200, 'public registration stays disabled');
  } finally {
    if (userId) {
      await env.APP_DB.batch([
        env.APP_DB.prepare('DELETE FROM session WHERE user_id=?').bind(userId),
        env.APP_DB.prepare('DELETE FROM account WHERE user_id=?').bind(userId),
        env.APP_DB.prepare('DELETE FROM user WHERE id=?').bind(userId),
      ]);
    }
    await proxy.dispose();
  }
});
