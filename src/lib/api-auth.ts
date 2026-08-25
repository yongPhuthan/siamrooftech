import { NextRequest, NextResponse } from 'next/server';
import { auth as adminAuth } from './firebase-admin';

/**
 * Verifies the Firebase ID token sent in the Authorization header.
 * Returns the decoded token on success, or null if missing/invalid.
 */
export async function verifyAdminRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token || !adminAuth) {
    return null;
  }

  try {
    return await adminAuth.verifyIdToken(token);
  } catch {
    return null;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
