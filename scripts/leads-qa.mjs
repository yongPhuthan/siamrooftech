#!/usr/bin/env node
// QA for lead intake, ref-code matching, value/status updates, and the
// Google Ads Data Manager dry-run adapter. Run against a local
// `wrangler dev` instance for workers/line-chat-history (see package.json
// `line:dev`) with fixture secrets in workers/line-chat-history/.dev.vars.
//
// Usage: node scripts/leads-qa.mjs [--base=http://localhost:8788]

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.split('=');
    return [key.replace(/^--/, ''), value === undefined ? true : value];
  }),
);

const baseUrl = args.get('base') || process.env.LEADS_QA_BASE_URL || 'http://localhost:8788';
const channelSecret = args.get('channel-secret') || process.env.LINE_CHANNEL_SECRET;
const readToken = args.get('read-token') || process.env.CHAT_HISTORY_READ_TOKEN;
const writeToken = args.get('write-token') || process.env.CHAT_HISTORY_WRITE_TOKEN;
const intakeToken = args.get('intake-token') || process.env.LEADS_INTAKE_TOKEN;

const failures = [];
function fail(message) {
  failures.push(message);
}

if (!channelSecret || !readToken || !writeToken || !intakeToken) {
  process.stderr.write(
    'leads QA needs channel secret + all three worker tokens ' +
      '(matching workers/line-chat-history/.dev.vars): ' +
      '--channel-secret=/--read-token=/--write-token=/--intake-token= or the equivalent env vars.\n',
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

async function postWebhook(bodyObj) {
  const raw = JSON.stringify(bodyObj);
  const signature = await hmacBase64(raw, channelSecret);
  return fetch(`${baseUrl}/line/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-line-signature': signature },
    body: raw,
  });
}

async function intake(payload) {
  return fetch(`${baseUrl}/internal/leads/intake`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${intakeToken}` },
    body: JSON.stringify(payload),
  });
}

async function get(path, token = readToken) {
  return fetch(`${baseUrl}${path}`, { headers: { Authorization: `Bearer ${token}` } });
}

async function post(path, payload, token = writeToken) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/**
 * Ads-sync jobs are processed by a Cloudflare Queue consumer running
 * asynchronously (max_batch_timeout up to 10s in wrangler.jsonc) — polls
 * instead of a fixed sleep so this doesn't flake under normal queue
 * latency.
 */
async function waitFor(checkFn, { timeoutMs = 12000, intervalMs = 300 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    last = await checkFn();
    if (last) return last;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return last;
}

function makeMessageEvent({ webhookEventId, messageId, text, timestamp, userId }) {
  return {
    type: 'message',
    mode: 'active',
    timestamp,
    source: { type: 'user', userId },
    webhookEventId,
    deliveryContext: { isRedelivery: false },
    replyToken: 'qa-reply-token',
    message: { id: messageId, type: 'text', text },
  };
}

async function run() {
  const ts = Date.now();
  const gclid = `qa-gclid-${ts}`;

  // 1. Intake -> lead row with gclid, ads_state='not_sent' (has a click id).
  const intakeRes = await intake({
    gclid,
    utm_campaign: 'qa-campaign',
  });
  const intakeBody = await intakeRes.json();
  if (intakeRes.status !== 201 || !intakeBody.lead_id || !intakeBody.ref_code) {
    fail(`intake: expected 201 with lead_id/ref_code, got ${intakeRes.status} ${JSON.stringify(intakeBody)}`);
    console.error('leads QA aborted early — intake failed');
    process.exit(1);
  }
  const { lead_id: leadId, ref_code: refCode } = intakeBody;

  // 2. Intake with no auth -> 401.
  const noAuthIntake = await fetch(`${baseUrl}/internal/leads/intake`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ gclid: 'x' }),
  });
  if (noAuthIntake.status !== 401) fail(`intake without token: expected 401, got ${noAuthIntake.status}`);

  // 3. Webhook carrying the ref code -> matches the lead.
  const userId = `Uqaleads${String(ts).slice(-20)}`;
  const conversationId = `user:${userId}`;
  const matchWebhookBody = {
    destination: 'Uqa0000000000000000000000000000',
    events: [
      makeMessageEvent({
        webhookEventId: `qa-leads-event-${ts}`,
        messageId: `qa-leads-message-${ts}`,
        text: `สอบถามข้อมูลกันสาดจากเว็บไซต์ [${refCode}]`,
        timestamp: ts,
        userId,
      }),
    ],
  };
  const webhookRes = await postWebhook(matchWebhookBody);
  if (webhookRes.status !== 200) fail(`webhook with ref code: expected 200, got ${webhookRes.status}`);

  // Matching itself (the D1 batch inside the webhook handler) is synchronous
  // with the webhook response, but poll briefly anyway in case of D1
  // eventual-consistency in the local shadow DB.
  const matchedLead = await waitFor(async () => {
    const body = await (await get(`/leads/${leadId}`)).json();
    return body.match?.conversation_id ? body : null;
  }, { timeoutMs: 3000 });

  if (!matchedLead) fail('lead never showed conversation_id after the ref-code webhook');
  const lead = matchedLead || (await (await get(`/leads/${leadId}`)).json());

  // 4. A persona-free first LINE message is the initial conversion seam.
  if (lead.match?.conversation_id !== conversationId) {
    fail(`lead matching: expected conversation_id=${conversationId}, got ${lead.match?.conversation_id}`);
  }
  if (lead.match?.match_method !== 'ref_code') {
    fail(`lead matching: expected match_method=ref_code, got ${lead.match?.match_method}`);
  }
  if (lead.attribution?.lead_persona !== null || lead.value?.persona_value !== null) {
    fail(`direct LINE lead must not require persona data: ${JSON.stringify({
      lead_persona: lead.attribution?.lead_persona,
      persona_value: lead.value?.persona_value,
    })}`);
  }
  const eventsBeforeRedelivery = lead.events?.length ?? 0;

  // 5. Redelivering the same webhook must not re-match, re-log, or double-enqueue.
  await postWebhook(matchWebhookBody);
  await new Promise((resolve) => setTimeout(resolve, 300));
  const eventsAfterRedelivery = (await (await get(`/leads/${leadId}`)).json()).events?.length ?? 0;
  if (eventsAfterRedelivery !== eventsBeforeRedelivery) {
    fail(
      `redelivered webhook created extra lead_events (before=${eventsBeforeRedelivery}, after=${eventsAfterRedelivery}) — matching must be idempotent`,
    );
  }

  // 6. A lead with no ref code in any message stays unmatched and is listed.
  const unmatchedIntake = await intake({ gclid: `qa-gclid-unmatched-${ts}` });
  const unmatchedBody = await unmatchedIntake.json();
  const unmatchedListRes = await get('/leads/unmatched?limit=500');
  const unmatchedList = await unmatchedListRes.json();
  if (!(unmatchedList.leads || []).some((l) => l.lead_id === unmatchedBody.lead_id)) {
    fail('unmatched lead did not appear in GET /leads/unmatched');
  }

  // 7. Value update -> must reject 0 and negative values (permanent Data Manager retraction risk).
  const zeroValueRes = await post(`/leads/${leadId}/value`, { value: 0 });
  if (zeroValueRes.status !== 400) fail(`value=0: expected 400 (refuse to risk a permanent retraction), got ${zeroValueRes.status}`);

  // 8. Valid restatement -> creates an ads_sync_jobs row with kind=restatement, same transactionId (lead_id).
  const valueRes = await post(`/leads/${leadId}/value`, { value: 45000, field: 'actual_value', status: 'won' });
  if (valueRes.status !== 200) fail(`value update: expected 200, got ${valueRes.status}`);

  async function fetchJobs() {
    return ((await (await get(`/ads-sync/jobs?limit=100`)).json()).jobs || []).filter((j) => j.lead_id === leadId);
  }

  // Both jobs are processed by the ads-sync queue consumer, which runs
  // asynchronously (see waitFor's doc comment above).
  const restatementJob = await waitFor(async () => {
    const jobs = await fetchJobs();
    const job = jobs.find((j) => j.kind === 'restatement');
    return job && job.state !== 'pending' ? job : null;
  });
  if (!restatementJob) {
    fail('no restatement ads_sync_jobs row reached a terminal state after the value update');
  } else {
    if (restatementJob.request_payload?.events?.[0]?.transactionId !== leadId) {
      fail(`restatement transactionId should equal lead_id (${leadId}), got ${restatementJob.request_payload?.events?.[0]?.transactionId}`);
    }
    if (restatementJob.mode === 'dry_run' && restatementJob.state !== 'succeeded') {
      fail(`dry-run restatement job: expected state=succeeded, got ${restatementJob.state}`);
    }
  }

  const initialJob = await waitFor(async () => {
    const jobs = await fetchJobs();
    const job = jobs.find((j) => j.kind === 'initial');
    return job && job.state !== 'pending' ? job : null;
  });
  if (!initialJob) {
    fail('persona-free matched LINE message did not create an initial conversion job');
  } else {
    if (initialJob.conversion_value !== 1) {
      fail(`initial LINE-message conversion value: expected technical placeholder 1 THB, got ${initialJob.conversion_value}`);
    }
    if (initialJob.request_payload?.events?.[0]?.transactionId !== leadId) {
      fail(`initial transactionId should equal lead_id (${leadId}), got ${initialJob.request_payload?.events?.[0]?.transactionId}`);
    }
    if (initialJob.mode === 'dry_run' && initialJob.state !== 'succeeded') {
      fail(`dry-run initial job: expected state=succeeded, got ${initialJob.state}`);
    }
  }

  // 9. Status after the value call should be 'won' (value endpoint accepted an optional status).
  const leadAfterValue = await (await get(`/leads/${leadId}`)).json();
  if (leadAfterValue.status !== 'won') fail(`expected status=won after value update, got ${leadAfterValue.status}`);

  // 10. Manual match on an already-matched lead must be rejected.
  const remanualRes = await post(`/leads/${leadId}/match`, { conversation_id: 'user:someone-else' });
  if (remanualRes.status !== 400) fail(`re-matching an already-matched lead: expected 400, got ${remanualRes.status}`);

  // 11. Manual match works for a genuinely unmatched lead.
  const manualMatchRes = await post(`/leads/${unmatchedBody.lead_id}/match`, {
    conversation_id: 'user:manually-matched-conversation',
  });
  if (manualMatchRes.status !== 200) fail(`manual match: expected 200, got ${manualMatchRes.status}`);
  const manualInitialJob = await waitFor(async () => {
    const jobs = ((await (await get(`/ads-sync/jobs?limit=100`)).json()).jobs || []);
    const job = jobs.find((j) => j.lead_id === unmatchedBody.lead_id && j.kind === 'initial');
    return job && job.state !== 'pending' ? job : null;
  });
  if (!manualInitialJob || manualInitialJob.conversion_value !== 1) {
    fail(`manual persona-free match must create one 1 THB initial conversion job: ${JSON.stringify(manualInitialJob)}`);
  }

  // 12. Auth: no bearer -> 401; wrong write token -> 401; POST /leads (GET-only) -> 405.
  const noAuthList = await fetch(`${baseUrl}/leads`);
  if (noAuthList.status !== 401) fail(`GET /leads no bearer: expected 401, got ${noAuthList.status}`);

  const wrongWriteToken = await post(`/leads/${leadId}/status`, { status: 'contacted' }, 'wrong-token');
  if (wrongWriteToken.status !== 401) fail(`wrong write token: expected 401, got ${wrongWriteToken.status}`);

  // /leads is a GET-only route, so its declared token requirement is the
  // read token even for a POST -- the read token must be used here for the
  // method check itself to be reachable (see leads-api.ts's route table).
  const postToLeadsRes = await fetch(`${baseUrl}/leads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${readToken}` },
  });
  if (postToLeadsRes.status !== 405) fail(`POST /leads: expected 405, got ${postToLeadsRes.status}`);

  // 13. Timezone windowing: today's leads must show up under date=today in Asia/Bangkok.
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(ts));
  const listRes = await get(`/leads?date=${today}&timezone=Asia/Bangkok&limit=500`);
  const listBody = await listRes.json();
  if (!(listBody.leads || []).some((l) => l.lead_id === leadId)) {
    fail(`GET /leads?date=${today}: lead created just now did not appear`);
  }

  // 14. Transcript endpoint returns the matched conversation's messages.
  const transcriptRes = await get(`/leads/${leadId}/transcript`);
  const transcriptBody = await transcriptRes.json();
  if (transcriptRes.status !== 200 || transcriptBody.conversation_id !== conversationId) {
    fail(`GET /leads/${leadId}/transcript: expected conversation_id=${conversationId}, got ${JSON.stringify(transcriptBody).slice(0, 200)}`);
  }
  if (!(transcriptBody.messages || []).some((m) => m.text?.includes(refCode))) {
    fail('transcript did not include the message carrying the ref code');
  }

  if (failures.length > 0) {
    process.stderr.write('Leads QA failed:\n');
    for (const message of failures) process.stderr.write(`- ${message}\n`);
    process.exit(1);
  }

  console.log(`Leads QA passed at ${baseUrl}`);
}

run().catch((error) => {
  process.stderr.write(`Leads QA crashed: ${error.stack || error.message}\n`);
  process.exit(1);
});
