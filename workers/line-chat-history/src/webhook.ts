import { verifyLineSignature } from './signature';
import { prepareEventStatements, conversationIdFor } from './normalize';
import { extractRefCode, matchLeadByRefCode } from './leads';
import type { Env, LineWebhookBody } from './types';

export async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get('x-line-signature');
  const signatureOk = await verifyLineSignature(rawBody, signatureHeader, env.LINE_CHANNEL_SECRET);

  if (!signatureOk) {
    return new Response('invalid signature', { status: 401 });
  }

  let body: LineWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response('invalid JSON', { status: 400 });
  }

  const receivedAt = Date.now();
  const events = body.events ?? [];

  const deliveryResult = await env.CHAT_DB.prepare(
    `INSERT INTO webhook_deliveries (received_at, destination, signature_ok, event_count, raw_body, status)
     VALUES (?, ?, 1, ?, ?, 'stored') RETURNING id`,
  )
    .bind(receivedAt, body.destination ?? null, events.length, rawBody)
    .first<{ id: number }>();

  const deliveryId = deliveryResult!.id;

  if (events.length > 0) {
    const { statements, queueMessages } = prepareEventStatements(env.CHAT_DB, deliveryId, events, receivedAt);

    if (statements.length > 0) {
      await env.CHAT_DB.batch(statements);
    }

    for (const message of queueMessages) {
      await env.MEDIA_QUEUE.send(message);
    }

    // Lead matching: an inbound text message carrying a ref code (from the
    // LINE prefill link built in AttributionCapture.tsx) binds the lead
    // this LINE conversation. See docs/lead-matching/README.md — matching
    // is exact-ref-only, never inferred, since a wrong automatic match
    // would attach a conversion to the wrong gclid.
    for (const event of events) {
      if (event.type !== 'message') continue;
      const message = (event as any).message;
      if (message?.type !== 'text') continue;

      const refCode = extractRefCode(message.text);
      if (!refCode) continue;

      const conversationId = conversationIdFor(event.source);
      if (!conversationId) continue;

      try {
        await matchLeadByRefCode(env, refCode, conversationId, event.timestamp);
      } catch (error) {
        console.error('lead matching failed', refCode, error);
      }
    }
  }

  // Always 200 within a few ms so LINE does not treat this as a failure and redeliver.
  return new Response('OK', { status: 200 });
}
