/**
 * Mints a Google OAuth2 access token from a service account, using the
 * JWT Bearer grant (RFC 7523) signed with crypto.subtle — no Node crypto,
 * so this runs on Workers. No developer token or domain-wide delegation
 * needed; the service account just needs to be added as a user on the
 * target Google Ads account (see workers/line-chat-history/README.md).
 */

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const DATAMANAGER_SCOPE = 'https://www.googleapis.com/auth/datamanager';

function base64UrlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const byte of arr) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToPkcs8(pem: string): ArrayBuffer {
  const normalized = pem.includes('\\n') ? pem.replace(/\\n/g, '\n') : pem;
  const base64 = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function importSigningKey(privateKeyPem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8(privateKeyPem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

async function signJwt(clientEmail: string, privateKeyPem: string, scope: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: clientEmail,
    scope,
    aud: TOKEN_ENDPOINT,
    iat: now,
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  const unsigned = `${base64UrlEncode(encoder.encode(JSON.stringify(header)))}.${base64UrlEncode(
    encoder.encode(JSON.stringify(claimSet)),
  )}`;

  const key = await importSigningKey(privateKeyPem);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(unsigned));

  return `${unsigned}.${base64UrlEncode(signature)}`;
}

/**
 * Exchanges the service account for a short-lived access token scoped to
 * the Data Manager API. Not cached across requests — each queue consumer
 * invocation is a fresh call, which is fine at this volume (one lead sync
 * at a time, max_concurrency: 1 on the ads-sync queue).
 */
export async function getGoogleAccessToken(clientEmail: string, privateKeyPem: string): Promise<string> {
  const assertion = await signJwt(clientEmail, privateKeyPem, DATAMANAGER_SCOPE);

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google token exchange failed (${res.status}): ${body}`);
  }

  const json = await res.json<{ access_token: string }>();
  return json.access_token;
}
