// Small HTTP helpers shared by read-api.ts and leads-api.ts.

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}

export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  if (aBytes.length !== bBytes.length) {
    // Still run a comparison of equal length to avoid a length-based timing signal.
    await crypto.subtle.digest('SHA-256', aBytes);
    return false;
  }
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

export async function requireBearer(request: Request, expectedToken: string): Promise<Response | null> {
  const header = request.headers.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token || !(await timingSafeEqual(token, expectedToken))) {
    return errorResponse('Unauthorized', 401);
  }
  return null;
}
