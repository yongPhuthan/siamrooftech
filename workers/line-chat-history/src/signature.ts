function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Verifies the LINE webhook signature: HMAC-SHA256 of the raw body using the
 * channel secret, base64-encoded, compared against the x-line-signature header.
 * Uses crypto.subtle.verify (constant-time) rather than a manual comparison.
 */
export async function verifyLineSignature(
  rawBody: string,
  signatureHeader: string | null,
  channelSecret: string,
): Promise<boolean> {
  if (!signatureHeader) return false;

  let signatureBytes: Uint8Array;
  try {
    signatureBytes = base64ToBytes(signatureHeader);
  } catch {
    return false;
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(channelSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  return crypto.subtle.verify('HMAC', key, signatureBytes, new TextEncoder().encode(rawBody));
}
