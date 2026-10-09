import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getCmsRuntimeEnv } from '@/lib/database/runtime';

export const ContactSubmissionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(8).max(32),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  subject: z.string().trim().min(1).max(120),
  message: z.string().trim().min(5).max(5000),
});

export async function createContactSubmission(input: unknown, clientAddress: string | null) {
  const parsed = ContactSubmissionSchema.safeParse(input);
  if (!parsed.success) throw new Error('INVALID_CONTACT');
  const { APP_DB } = await getCmsRuntimeEnv();
  const now = Date.now();
  const windowStart = Math.floor(now / 600_000) * 600_000;
  const address = clientAddress || 'unknown';
  const key = createHash('sha256').update(`${windowStart}:${address}`).digest('hex');
  const result = await APP_DB.prepare('INSERT INTO contact_rate_limits (bucket_key, window_start, count) VALUES (?, ?, 1) ON CONFLICT(bucket_key) DO UPDATE SET count=count+1 RETURNING count').bind(key, windowStart).first<{ count: number }>();
  if (!result || result.count > 5) throw new Error('CONTACT_RATE_LIMITED');
  const submission = { id: randomUUID(), ...parsed.data, email: parsed.data.email || null, status: 'new', createdAt: new Date(now).toISOString() };
  await APP_DB.prepare('INSERT INTO contact_submissions (id,name,phone,email,subject,message,status,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(submission.id, submission.name, submission.phone, submission.email, submission.subject, submission.message, submission.status, submission.createdAt).run();
  return { id: submission.id };
}
