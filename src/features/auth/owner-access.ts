import { z } from 'zod';

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Configuration errors fail closed; browser input cannot choose administrative access. */
export function allowedAdminEmails(value?: string): string[] {
  const emails = (value ?? '').split(',').map(normalizeAdminEmail).filter(Boolean);
  if (!emails.length || emails.some((email) => !z.string().email().safeParse(email).success)) return [];
  return [...new Set(emails)];
}

export function isAllowedAdminEmail(email: string, configuredEmails?: string): boolean {
  return allowedAdminEmails(configuredEmails).includes(normalizeAdminEmail(email));
}
