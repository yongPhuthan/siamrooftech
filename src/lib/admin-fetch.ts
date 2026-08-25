import { auth } from './firebase';

/**
 * fetch() wrapper for admin mutations - attaches the current user's
 * Firebase ID token so protected API routes can verify the caller.
 */
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = await auth.currentUser?.getIdToken();

  if (!token) {
    throw new Error('ไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);

  return fetch(input, { ...init, headers });
}
