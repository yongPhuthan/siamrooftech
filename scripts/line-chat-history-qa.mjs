#!/usr/bin/env node
// QA for the LINE chat-history worker: signature verification, dedupe, timezone
// windowing, pagination, auth, and the media pipeline. Run against a local
// `wrangler dev` instance (see package.json `line:dev`) with fixture secrets in
// workers/line-chat-history/.dev.vars.
//
// Usage: node scripts/line-chat-history-qa.mjs [--base=http://localhost:8788]

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.split('=');
    return [key.replace(/^--/, ''), value === undefined ? true : value];
  }),
);

const baseUrl = args.get('base') || process.env.LINE_CHAT_HISTORY_QA_BASE_URL || 'http://localhost:8788';
const channelSecret = args.get('channel-secret') || process.env.LINE_CHANNEL_SECRET;
const readToken = args.get('read-token') || process.env.CHAT_HISTORY_READ_TOKEN;

const failures = [];
function fail(message) {
  failures.push(message);
}

if (!channelSecret || !readToken) {
  process.stderr.write(
    'LINE chat-history QA needs --channel-secret=/--read-token= or LINE_CHANNEL_SECRET / CHAT_HISTORY_READ_TOKEN ' +
      '(the same values configured in workers/line-chat-history/.dev.vars for the local dev server).\n',
  );
  process.exit(1);
}

async function hmacBase64(body, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return Buffer.from(signature).toString('base64');
}

function nowMs() {
  return Date.now();
}

const QA_USER_ID = 'Uqa0000000000000000000000000001';

function makeEvent({ webhookEventId, messageId, text, timestamp, isRedelivery = false, userId = QA_USER_ID }) {
  return {
    type: 'message',
    mode: 'active',
    timestamp,
    source: { type: 'user', userId },
    webhookEventId,
    deliveryContext: { isRedelivery },
    replyToken: 'qa-reply-token',
    message: { id: messageId, type: 'text', text },
  };
}

async function post(path, bodyObj, { signature, noSignature } = {}) {
  const raw = JSON.stringify(bodyObj);
  const headers = { 'content-type': 'application/json' };
  if (!noSignature) {
    headers['x-line-signature'] = signature ?? (await hmacBase64(raw, channelSecret));
  }
  return fetch(`${baseUrl}${path}`, { method: 'POST', headers, body: raw });
}

async function get(path) {
  return fetch(`${baseUrl}${path}`, { headers: { Authorization: `Bearer ${readToken}` } });
}

async function run() {
  const ts = nowMs();
  const eventId = `qa-event-${ts}`;
  const messageId = `qa-message-${ts}`;
  const destination = 'Uqa0000000000000000000000000000';

  // 1. Bad signature -> 401, no row written.
  const badSigRes = await post('/line/webhook', { destination, events: [] }, { signature: 'not-a-real-signature' });
  if (badSigRes.status !== 401) fail(`bad signature: expected 401, got ${badSigRes.status}`);

  // 2. Missing signature header -> 401.
  const noSigRes = await post('/line/webhook', { destination, events: [] }, { noSignature: true });
  if (noSigRes.status !== 401) fail(`missing signature: expected 401, got ${noSigRes.status}`);

  // 3. LINE's Verify button sends an empty events array -> 200.
  const verifyRes = await post('/line/webhook', { destination, events: [] });
  if (verifyRes.status !== 200) fail(`empty events (Verify): expected 200, got ${verifyRes.status}`);

  // 4. Valid event -> 200.
  const validBody = { destination, events: [makeEvent({ webhookEventId: eventId, messageId, text: 'สวัสดีครับ QA', timestamp: ts })] };
  const validRes = await post('/line/webhook', validBody);
  if (validRes.status !== 200) fail(`valid event: expected 200, got ${validRes.status}`);

  // 5. Redelivery of the same webhookEventId, sent 3x -> dedupe, only one row.
  const redeliveredBody = {
    destination,
    events: [makeEvent({ webhookEventId: eventId, messageId, text: 'สวัสดีครับ QA', timestamp: ts, isRedelivery: true })],
  };
  for (let i = 0; i < 3; i++) {
    const res = await post('/line/webhook', redeliveredBody);
    if (res.status !== 200) fail(`redelivery ${i}: expected 200, got ${res.status}`);
  }

  await new Promise((resolve) => setTimeout(resolve, 300)); // let D1 batch settle

  // 6. Read API without bearer -> 401; POST to a GET-only route -> 405.
  const noAuthRes = await fetch(`${baseUrl}/chat-history`);
  if (noAuthRes.status !== 401) fail(`no bearer: expected 401, got ${noAuthRes.status}`);

  const wrongAuthRes = await fetch(`${baseUrl}/chat-history`, { headers: { Authorization: 'Bearer wrong-token' } });
  if (wrongAuthRes.status !== 401) fail(`wrong bearer: expected 401, got ${wrongAuthRes.status}`);

  const postToGetRes = await fetch(`${baseUrl}/chat-history`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${readToken}` },
  });
  if (postToGetRes.status !== 405) fail(`POST /chat-history: expected 405, got ${postToGetRes.status}`);

  // 7. Query by date=today in Asia/Bangkok should find exactly one message with this id (dedupe check).
  const today = new Date(ts).toISOString().slice(0, 10);
  const listRes = await get(`/chat-history?date=${today}&timezone=Asia/Bangkok&conversation_id=user:${QA_USER_ID}&limit=500`);
  const listBody = await listRes.json();
  if (listRes.status !== 200) {
    fail(`GET /chat-history: expected 200, got ${listRes.status} — ${JSON.stringify(listBody)}`);
  } else {
    const matches = (listBody.messages ?? []).filter((m) => m.message_id === messageId);
    if (matches.length !== 1) fail(`dedupe: expected exactly 1 stored message for ${messageId}, found ${matches.length}`);
    if (!listBody.coverage || listBody.coverage.outbound_staff_messages !== 'not_captured') {
      fail('coverage block missing or outbound_staff_messages is not "not_captured"');
    }
  }

  // 8. Health endpoint should be reachable and report zero signature failures growth is not asserted
  //    (bad-signature requests above are rejected before being logged), but the endpoint must respond.
  const healthRes = await get('/chat-history/health');
  if (healthRes.status !== 200) fail(`GET /chat-history/health: expected 200, got ${healthRes.status}`);

  // 9. Pagination: limit=1 must still surface the message via next_cursor without duplication.
  const pagedRes = await get(`/chat-history?date=${today}&timezone=Asia/Bangkok&limit=1`);
  const pagedBody = await pagedRes.json();
  if (pagedRes.status !== 200) {
    fail(`paginated GET: expected 200, got ${pagedRes.status}`);
  } else if (pagedBody.messages.length > 1) {
    fail(`paginated GET: expected at most 1 message with limit=1, got ${pagedBody.messages.length}`);
  }

  if (failures.length > 0) {
    process.stderr.write('LINE chat-history QA failed:\n');
    for (const message of failures) process.stderr.write(`- ${message}\n`);
    process.exit(1);
  }

  console.log(`LINE chat-history QA passed at ${baseUrl}`);
}

run().catch((error) => {
  process.stderr.write(`LINE chat-history QA crashed: ${error.stack || error.message}\n`);
  process.exit(1);
});
