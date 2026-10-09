import { toNextJsHandler } from 'better-auth/next-js';
import { getAuth } from '@/features/auth/server/auth';

export const runtime = 'nodejs';

async function handlers() {
  return toNextJsHandler(await getAuth());
}

export async function GET(request: Request) {
  return (await handlers()).GET(request);
}

export async function POST(request: Request) {
  return (await handlers()).POST(request);
}
