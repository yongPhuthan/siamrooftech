import test from 'node:test';
import assert from 'node:assert/strict';
import { provisionAdminUser, validateAdminInput } from './admin-users.mjs';

function fakeInternal(existing = null) {
  const calls = [];
  const user = existing || { id: 'user-1', email: 'owner@example.test', name: 'Owner', role: 'user', banned: false };
  const users = new Map([[user.id, { ...user }]]);
  return {
    calls,
    findUserByEmail: async (...args) => { calls.push(['findUserByEmail', ...args]); return existing ? { user: users.get(user.id), accounts: [] } : null; },
    findUserById: async (id) => users.get(id) || null,
    createUser: async (data, source) => { calls.push(['createUser', data, source]); const created = { ...data, id: 'new-user' }; users.set(created.id, created); return created; },
    createAccount: async (data) => { calls.push(['createAccount', data]); return data; },
    updateUser: async (id, data) => { calls.push(['updateUser', id, data]); const updated = { ...users.get(id), ...data, id }; users.set(id, updated); return updated; },
    deleteUserSessions: async (id) => { calls.push(['deleteUserSessions', id]); },
    findCredentialAccount: async (id) => { calls.push(['findCredentialAccount', id]); return { id: 'credential' }; },
    updatePassword: async (id, hash) => { calls.push(['updatePassword', id, hash]); },
    hashPassword: async (password) => { calls.push(['hashPassword', password]); return `hashed:${password}`; },
  };
}

test('requires a local action, valid email, name for creation and strong password', () => {
  assert.throws(() => validateAdminInput({ action: 'create', email: 'nope', name: 'Owner', password: 'longenoughpassword' }), /valid --email/);
  assert.throws(() => validateAdminInput({ action: 'create', email: 'owner@example.test', password: 'longenoughpassword' }), /--name/);
  assert.throws(() => validateAdminInput({ action: 'reset-password', email: 'owner@example.test', password: 'short' }), /12 characters/);
  assert.throws(() => validateAdminInput({ action: 'delete', email: 'owner@example.test' }), /Choose/);
});

test('creates a locked administrator, links a hashed password, then enables login', async () => {
  const adapter = fakeInternal();
  const result = await provisionAdminUser(adapter, { action: 'create', email: 'OWNER@example.test', name: 'Owner', password: 'correct horse battery' });
  assert.equal(result.role, 'admin');
  assert.deepEqual(adapter.calls.find(([name]) => name === 'createUser')[1], { email: 'owner@example.test', name: 'Owner', emailVerified: false, role: 'admin', banned: true });
  assert.equal(adapter.calls.find(([name]) => name === 'createAccount')[1].password, 'hashed:correct horse battery');
  assert.deepEqual(adapter.calls.find(([name]) => name === 'updateUser')[2], { banned: false });
});

test('a failed credential write leaves the new account disabled', async () => {
  const adapter = fakeInternal();
  adapter.createAccount = async () => { throw new Error('storage unavailable'); };
  await assert.rejects(provisionAdminUser(adapter, { action: 'create', email: 'owner@example.test', name: 'Owner', password: 'correct horse battery' }), /storage unavailable/);
  assert.equal(adapter.calls.some(([name]) => name === 'updateUser'), false);
});

test('grant and revoke persist role changes and revoke all existing sessions', async () => {
  const adapter = fakeInternal({ id: 'user-1', email: 'owner@example.test', name: 'Owner', role: 'user', banned: false });
  await provisionAdminUser(adapter, { action: 'grant', email: 'owner@example.test' });
  await provisionAdminUser(adapter, { action: 'revoke', email: 'owner@example.test' });
  assert.deepEqual(adapter.calls.filter(([name]) => name === 'updateUser').map((call) => call[2]), [{ role: 'admin', banned: false }, { role: 'user' }]);
  assert.equal(adapter.calls.filter(([name]) => name === 'deleteUserSessions').length, 2);
});

test('password reset stores only a hash and removes active sessions', async () => {
  const adapter = fakeInternal({ id: 'user-1', email: 'owner@example.test', name: 'Owner', role: 'admin', banned: false });
  await provisionAdminUser(adapter, { action: 'reset-password', email: 'owner@example.test', password: 'another correct horse' });
  assert.deepEqual(adapter.calls.find(([name]) => name === 'updatePassword'), ['updatePassword', 'user-1', 'hashed:another correct horse']);
  assert.deepEqual(adapter.calls.find(([name]) => name === 'deleteUserSessions'), ['deleteUserSessions', 'user-1']);
});
