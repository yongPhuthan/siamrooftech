import { verifyAdminRequest } from '@/lib/api-auth';

/** The identity a valid projects agent token resolves to; it carries no admin role. */
export const PROJECTS_AGENT = { id: 'projects-agent', role: 'projects-agent' } as const;

/** Shorter configured values are treated as unset so a placeholder never opens the API. */
const MIN_TOKEN_LENGTH = 32;

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
}

/** Compares fixed-length digests so the comparison time does not reveal the configured token. */
async function sameSecret(supplied: string, configured: string): Promise<boolean> {
  const [a, b] = await Promise.all([digest(supplied), digest(configured)]);
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

/**
 * Accepts `Authorization: Bearer <PROJECTS_AGENT_TOKEN>` from the owner's local agent. A bearer header is never
 * attached by a browser on its own, so the same-origin check that guards cookie sessions does not apply to it.
 */
export async function verifyProjectsAgentToken(request: Pick<Request, 'headers'>) {
  const configured = process.env.PROJECTS_AGENT_TOKEN;
  if (!configured || configured.length < MIN_TOKEN_LENGTH) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(request.headers.get('authorization') ?? '');
  if (!match) return null;
  return (await sameSecret(match[1], configured)) ? PROJECTS_AGENT : null;
}

/**
 * Authorizes project drafting, publishing and image upload for an admin session or the projects agent token.
 * A request that presents a bearer token is judged by the token alone. Other admin APIs keep `verifyAdminRequest`.
 */
export async function verifyProjectEditorRequest(request: Pick<Request, 'headers' | 'method'>) {
  if (request.headers.has('authorization')) return verifyProjectsAgentToken(request);
  return verifyAdminRequest(request);
}
