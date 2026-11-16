import { verifyLineSignature } from './signature';
import { prepareEventStatements, conversationIdFor } from './normalize';
import { ensureOpportunity } from './crm';
import type { Env, LineWebhookBody } from './types';
import { z } from 'zod';

const eventSchema = z.object({
  type: z.string().min(1).max(64), timestamp: z.number().int().positive(),
  webhookEventId: z.string().min(1).max(200),
  deliveryContext: z.object({ isRedelivery: z.boolean() }),
  source: z.object({ type: z.enum(['user', 'group', 'room']), userId: z.string().max(200).optional(),
    groupId: z.string().max(200).optional(), roomId: z.string().max(200).optional() }).optional(),
  message: z.object({ id: z.string().min(1).max(200), type: z.string().min(1).max(64), text: z.string().max(20000).optional() }).passthrough().optional(),
}).passthrough().refine((event) => event.type !== 'message' || Boolean(event.message), 'message required');
const webhookSchema = z.object({ destination: z.string().max(200).optional(), events: z.array(eventSchema).max(1000) });

export async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get('x-line-signature');
  const signatureOk = await verifyLineSignature(rawBody, signatureHeader, env.LINE_CHANNEL_SECRET);

  if (!signatureOk) {
    return new Response('invalid signature', { status: 401 });
  }

  let body: LineWebhookBody;
  try {
    const parsed = webhookSchema.safeParse(JSON.parse(rawBody));
    if (!parsed.success) return new Response('invalid webhook', { status: 400 });
    body = parsed.data as LineWebhookBody;
  } catch {
    return new Response('invalid JSON', { status: 400 });
  }

  const receivedAt = Date.now();
  const events = body.events ?? [];

  const deliveryResult = await env.CHAT_DB.prepare(
    `INSERT INTO webhook_deliveries (received_at, destination, signature_ok, event_count, raw_body, status, retention_event_at)
     VALUES (?, ?, 1, ?, ?, 'stored', ?) RETURNING id`,
  )
    .bind(receivedAt, body.destination ?? null, events.length, rawBody, events.length ? Math.min(...events.map((event) => event.timestamp)) : receivedAt)
    .first<{ id: number }>();

  const deliveryId = deliveryResult!.id;

  if (events.length > 0) {
    const { statements, queueMessages } = prepareEventStatements(env.CHAT_DB, deliveryId, events, receivedAt);

    if (statements.length > 0) {
      await env.CHAT_DB.batch(statements);
    }



    // Reconcile persisted events, including delayed/replayed follow/message events.
    const conversations = new Set(events.map((event) => conversationIdFor(event.source)).filter((id): id is string => Boolean(id)));
    for (const conversationId of conversations) await ensureOpportunity(env, conversationId);
    for (const message of queueMessages) {
      await env.MEDIA_QUEUE.send(message);
    }

  }

  // Acknowledge persisted events; failures propagate so LINE can redeliver.
  return new Response('OK', { status: 200 });
}
