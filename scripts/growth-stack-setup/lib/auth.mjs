import { readFileSync } from 'node:fs';
import { GoogleAuth } from 'google-auth-library';

// google-auth-library, not the full googleapis SDK: this is an ops/setup
// tool that runs once outside the deployed app, so it should not add weight
// to the main dependency tree. It only needs JWT auth + fetch, not the
// generated API clients.

let cachedAuth = null;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name}. See scripts/growth-stack-setup/README.md.`);
  }
  return value;
}

export function getAuth(scopes) {
  const keyFile = requireEnv('GOOGLE_SERVICE_ACCOUNT_KEY_FILE');
  // Re-used across calls with different scope sets within one script run,
  // but GoogleAuth itself is cheap to construct, so cache by scope string.
  const cacheKey = scopes.join(' ');
  cachedAuth = cachedAuth || {};
  if (!cachedAuth[cacheKey]) {
    const keyContent = JSON.parse(readFileSync(keyFile, 'utf8'));
    cachedAuth[cacheKey] = new GoogleAuth({ credentials: keyContent, scopes });
  }
  return cachedAuth[cacheKey];
}

export async function authedFetch(url, scopes, options = {}) {
  const auth = getAuth(scopes);
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    const message = body?.error?.message || text || response.statusText;
    const err = new Error(`${options.method || 'GET'} ${url} -> ${response.status}: ${message}`);
    err.status = response.status;
    err.body = body;
    throw err;
  }

  return body;
}
