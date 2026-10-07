#!/usr/bin/env node
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getPlatformProxy } from 'wrangler';

const actions = new Set(['create', 'grant', 'revoke', 'inspect', 'reset-password']);

export function validateAdminInput({ action, email, name = '', password = '' }) {
  if (!actions.has(action)) throw new Error('Choose create, grant, revoke, inspect, or reset-password.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Provide a valid --email.');
  if (action === 'create' && !name.trim()) throw new Error('Provide --name when creating an administrator.');
  if (['create', 'reset-password'].includes(action) && password.length < 12) throw new Error('Use a password of at least 12 characters.');
  return { action, email: email.trim().toLowerCase(), name: name.trim(), password };
}

export async function provisionAdminUser(internal, input) {
  const { action, email, name, password } = validateAdminInput(input);
  const existing = await internal.findUserByEmail(email, { includeAccounts: true });
  if (action === 'create') {
    if (existing) throw new Error('An account with this email already exists.');
    const user = await internal.createUser({ email, name, emailVerified: false, role: 'admin', banned: true }, { method: 'admin' });
    try {
      const hashedPassword = await internal.hashPassword(password);
      await internal.createAccount({ accountId: user.id, providerId: 'credential', userId: user.id, password: hashedPassword });
      await internal.updateUser(user.id, { banned: false });
      return await internal.findUserById(user.id);
    } catch (error) {
      // Keep failed first-admin provisioning locked out for a safe retry.
      throw error;
    }
  }
  if (!existing) throw new Error('No account with this email exists.');
  const user = existing.user;
  if (action === 'inspect') return user;
  if (action === 'grant') {
    const updated = await internal.updateUser(user.id, { role: 'admin', banned: false });
    await internal.deleteUserSessions(user.id);
    return updated;
  }
  if (action === 'revoke') {
    const updated = await internal.updateUser(user.id, { role: 'user' });
    await internal.deleteUserSessions(user.id);
    return updated;
  }
  if (action === 'reset-password') {
    const hash = await internal.hashPassword(password);
    if (await internal.findCredentialAccount(user.id)) await internal.updatePassword(user.id, hash);
    else await internal.createAccount({ accountId: user.id, providerId: 'credential', userId: user.id, password: hash });
    await internal.deleteUserSessions(user.id);
    return user;
  }
  throw new Error('Unsupported operation.');
}

function hiddenPassword(label) {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) throw new Error('An interactive terminal is required for password entry.');
  return new Promise((resolvePassword, reject) => {
    let value = '';
    process.stdout.write(label);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    const cleanup = () => {
      process.stdin.off('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
    };
    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === '\u0003' || character === '\u0004') { cleanup(); reject(new Error('Cancelled.')); return; }
        if (character === '\r' || character === '\n') { cleanup(); resolvePassword(value); return; }
        if (character === '\u007f' || character === '\b') value = value.slice(0, -1);
        else if (character >= ' ') value += character;
      }
    };
    process.stdin.on('data', onData);
  });
}

function parseArgs(argv) {
  const [action, ...rest] = argv;
  let apply = false;
  let email = '';
  let name = '';
  while (rest.length) {
    const flag = rest.shift();
    if (flag === '--apply') apply = true;
    else if (flag === '--email' && rest[0] && !rest[0].startsWith('--')) email = rest.shift();
    else if (flag === '--name' && rest[0] && !rest[0].startsWith('--')) name = rest.shift();
    else throw new Error('Unknown or incomplete option. Run the command with --help.');
  }
  return { action, email: email.toLowerCase(), name, apply };
}

async function main() {
  if (process.argv.includes('--help') || process.argv.length < 3) {
    console.log('Usage: yarn admin:user:<action> --email user@example.com [--name "Admin Name"] [--apply]\nActions: create, grant, revoke, inspect, reset-password. Local D1 only; mutations default to dry-run. Passwords are entered without echo and never accepted as arguments or environment variables.');
    return;
  }
  const args = parseArgs(process.argv.slice(2));
  if (!actions.has(args.action)) throw new Error('Unknown action. Run the command with --help.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email)) throw new Error('Provide a valid --email.');
  if (args.action === 'create' && !args.name.trim()) throw new Error('Provide --name when creating an administrator.');
  if (args.action !== 'inspect' && !args.apply) {
    console.log(`${args.action}: ${args.email} | target: local D1 | dry run only; add --apply to execute.`);
    return;
  }

  let password = '';
  if (['create', 'reset-password'].includes(args.action)) {
    password = await hiddenPassword('Password (minimum 12 characters): ');
    if (password !== await hiddenPassword('Repeat password: ')) throw new Error('Passwords do not match.');
  }
  validateAdminInput({ ...args, password });

  const proxy = await getPlatformProxy({ configPath: 'wrangler.jsonc', persist: true, remoteBindings: false });
  try {
    const env = proxy.env;
    if (!env.APP_DB || !env.BETTER_AUTH_SECRET) throw new Error('Local D1 or BETTER_AUTH_SECRET is missing. Run the local setup steps first.');
    const { createAuth } = await import('../src/features/auth/auth.ts');
    const auth = createAuth(env);
    const context = await auth.$context;
    const result = await provisionAdminUser({
      findUserByEmail: (value, options) => context.internalAdapter.findUserByEmail(value, options),
      findUserById: (id) => context.internalAdapter.findUserById(id),
      createUser: (data, source) => context.internalAdapter.createUser(data, source),
      createAccount: (data) => context.internalAdapter.createAccount(data),
      updateUser: (id, data) => context.internalAdapter.updateUser(id, data),
      deleteUserSessions: (id) => context.internalAdapter.deleteUserSessions(id),
      findCredentialAccount: (id) => context.internalAdapter.findCredentialAccount(id),
      updatePassword: (id, hash) => context.internalAdapter.updatePassword(id, hash),
      hashPassword: (value) => context.password.hash(value),
    }, { ...args, password });
    console.log(JSON.stringify({ id: result?.id, email: result?.email, name: result?.name, role: result?.role, banned: result?.banned }));
  } finally {
    await proxy.dispose();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Account operation failed.');
    process.exitCode = 1;
  });
}
