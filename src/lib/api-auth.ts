import { NextResponse } from 'next/server';
import { getAuth } from '@/features/auth/server/auth';

export async function verifyAdminRequest(request: Pick<Request, 'headers' | 'method'>) {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase())) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (!origin || !host) return null;
    try {
      if (new URL(origin).host !== host) return null;
    } catch {
      return null;
    }
  }
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    return session?.user.role === 'admin' ? session.user : null;
  } catch {
    return null;
  }
}

export async function verifyAdminMutationRequest(request: Request) {
  return verifyAdminRequest(request);
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
