/** Same-origin fetches include the HttpOnly session cookie automatically. */
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!['GET', 'HEAD', 'OPTIONS'].includes((init.method || 'GET').toUpperCase())) {
    headers.set('X-Requested-With', 'XMLHttpRequest');
  }
  return fetch(input, { ...init, headers, credentials: 'same-origin' });
}
