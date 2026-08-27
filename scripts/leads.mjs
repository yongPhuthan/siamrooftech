#!/usr/bin/env node
// CLI wrapper around the leads Read/Write API, for AI Agent / operator use.
// Mirrors scripts/line-chat-history.mjs: no deps, hand-rolled --key=value parsing.
//
// Usage:
//   node scripts/leads.mjs list --date=2026-08-26 --status=new
//   node scripts/leads.mjs show <lead_id> --with-transcript
//   node scripts/leads.mjs value <lead_id> --value=45000 --status=won --reason="ปิดงานแล้ว"
//   node scripts/leads.mjs match <lead_id> --conversation=user:U4af49...
//   node scripts/leads.mjs unmatched
//   node scripts/leads.mjs ads-jobs --state=pending

const [, , command, maybeId, ...rest] = process.argv;
const hasPositionalId = maybeId && !maybeId.startsWith('--');
const argv = hasPositionalId ? rest : [maybeId, ...rest].filter(Boolean);

const args = new Map(
  argv.map((arg) => {
    const [key, value] = arg.split('=');
    return [key.replace(/^--/, ''), value === undefined ? true : value];
  }),
);

const baseUrl = args.get('base') || process.env.LINE_CHAT_HISTORY_BASE_URL;
const readToken = args.get('read-token') || process.env.CHAT_HISTORY_READ_TOKEN;
const writeToken = args.get('write-token') || process.env.CHAT_HISTORY_WRITE_TOKEN;

function fail(message) {
  process.stderr.write(JSON.stringify({ error: message }) + '\n');
  process.exit(1);
}

if (!baseUrl) fail('missing base URL: pass --base= or set LINE_CHAT_HISTORY_BASE_URL');

async function get(path, token) {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`request failed (${res.status}): ${JSON.stringify(body)}`);
  return body;
}

async function post(path, token, payload) {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`request failed (${res.status}): ${JSON.stringify(body)}`);
  return body;
}

function print(obj) {
  process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
}

async function main() {
  if (!readToken) fail('missing read token: pass --read-token= or set CHAT_HISTORY_READ_TOKEN');

  switch (command) {
    case 'list': {
      const params = new URLSearchParams();
      for (const key of ['date', 'from', 'to', 'timezone', 'status', 'match', 'limit', 'cursor']) {
        if (args.has(key)) params.set(key, String(args.get(key)));
      }
      print(await get(`/leads?${params.toString()}`, readToken));
      return;
    }
    case 'unmatched': {
      const params = new URLSearchParams();
      if (args.has('limit')) params.set('limit', String(args.get('limit')));
      print(await get(`/leads/unmatched?${params.toString()}`, readToken));
      return;
    }
    case 'show': {
      if (!maybeId) fail('usage: leads.mjs show <lead_id> [--with-transcript]');
      const params = new URLSearchParams();
      if (args.has('with-transcript')) params.set('with_transcript', '1');
      if (args.has('timezone')) params.set('timezone', String(args.get('timezone')));
      print(await get(`/leads/${encodeURIComponent(maybeId)}?${params.toString()}`, readToken));
      return;
    }
    case 'transcript': {
      if (!maybeId) fail('usage: leads.mjs transcript <lead_id>');
      const params = new URLSearchParams();
      for (const key of ['timezone', 'limit', 'cursor']) {
        if (args.has(key)) params.set(key, String(args.get(key)));
      }
      print(await get(`/leads/${encodeURIComponent(maybeId)}/transcript?${params.toString()}`, readToken));
      return;
    }
    case 'ads-jobs': {
      const params = new URLSearchParams();
      for (const key of ['state', 'limit']) {
        if (args.has(key)) params.set(key, String(args.get(key)));
      }
      print(await get(`/ads-sync/jobs?${params.toString()}`, readToken));
      return;
    }
    case 'status': {
      if (!writeToken) fail('missing write token: pass --write-token= or set CHAT_HISTORY_WRITE_TOKEN');
      if (!maybeId || !args.has('status')) fail('usage: leads.mjs status <lead_id> --status=won [--reason=...]');
      print(
        await post(`/leads/${encodeURIComponent(maybeId)}/status`, writeToken, {
          status: args.get('status'),
          reason: args.get('reason') || null,
          actor: args.get('actor') || 'agent',
        }),
      );
      return;
    }
    case 'value': {
      if (!writeToken) fail('missing write token: pass --write-token= or set CHAT_HISTORY_WRITE_TOKEN');
      if (!maybeId || !args.has('value')) {
        fail('usage: leads.mjs value <lead_id> --value=45000 [--status=won] [--reason=...]');
      }
      print(
        await post(`/leads/${encodeURIComponent(maybeId)}/value`, writeToken, {
          value: Number(args.get('value')),
          field: args.get('field') || 'actual_value',
          status: args.get('status') || undefined,
          reason: args.get('reason') || null,
          actor: args.get('actor') || 'agent',
        }),
      );
      return;
    }
    case 'match': {
      if (!writeToken) fail('missing write token: pass --write-token= or set CHAT_HISTORY_WRITE_TOKEN');
      if (!maybeId || !args.has('conversation')) {
        fail('usage: leads.mjs match <lead_id> --conversation=user:U4af49...');
      }
      print(
        await post(`/leads/${encodeURIComponent(maybeId)}/match`, writeToken, {
          conversation_id: args.get('conversation'),
          actor: args.get('actor') || 'admin',
        }),
      );
      return;
    }
    default:
      fail(
        `unknown command "${command}". Use one of: list, show, transcript, unmatched, status, value, match, ads-jobs`,
      );
  }
}

main().catch((error) => {
  process.stderr.write(JSON.stringify({ error: error.message }) + '\n');
  process.exit(1);
});
