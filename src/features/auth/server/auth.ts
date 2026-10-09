import 'server-only';
import { getCmsRuntimeEnv } from '@/lib/database/runtime';
import { createAuth } from '../auth';

export async function getAuth() {
  return createAuth(await getCmsRuntimeEnv());
}
