#!/usr/bin/env node
// CLI wrapper around the LINE chat-history Read API, for AI Agent / operator use.
// Mirrors the shape of scripts/seo-qa.mjs: no deps, hand-rolled --key=value argv parsing.
//
// Usage:
//   node scripts/line-chat-history.mjs --date=2026-08-25
//   node scripts/line-chat-history.mjs --from=2026-08-01 --to=2026-08-25 --all --ndjson
//   node scripts/line-chat-history.mjs --conversations

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.split('=');
    return [key.replace(/^--/, ''), value === undefined ? true : value];
  }),
);

const baseUrl = args.get('base') || process.env.LINE_CHAT_HISTORY_BASE_URL;
const token = args.get('token') || process.env.LINE_CHAT_HISTORY_READ_TOKEN;

if (!baseUrl || !token) {
  process.stderr.write(
    JSON.stringify({
      error:
        'missing base URL or token: pass --base=/--token= or set LINE_CHAT_HISTORY_BASE_URL / LINE_CHAT_HISTORY_READ_TOKEN',
    }) + '\n',
  );
  process.exit(1);
}

const isConversations = args.has('conversations');
const fetchAll = args.has('all');
const ndjson = args.has('ndjson');

function buildQuery(cursor) {
  const params = new URLSearchParams();
  for (const key of ['date', 'from', 'to', 'timezone', 'conversation_id', 'direction', 'limit', 'include']) {
    if (args.has(key)) params.set(key, String(args.get(key)));
  }
  if (cursor) params.set('cursor', cursor);
  return params;
}

async function fetchPage(cursor) {
  const path = isConversations ? '/chat-history/conversations' : '/chat-history';
  const url = `${baseUrl.replace(/\/$/, '')}${path}?${buildQuery(cursor).toString()}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`request failed (${res.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

async function main() {
  const itemsKey = isConversations ? 'conversations' : 'messages';

  if (!fetchAll) {
    const page = await fetchPage();
    process.stdout.write(JSON.stringify(page, null, 2) + '\n');
    return;
  }

  let cursor;
  const allItems = [];
  let lastPage = null;
  do {
    const page = await fetchPage(cursor);
    lastPage = page;
    const items = page[itemsKey] ?? [];
    if (ndjson) {
      for (const item of items) process.stdout.write(JSON.stringify(item) + '\n');
    } else {
      allItems.push(...items);
    }
    cursor = page.pagination?.next_cursor ?? null;
  } while (cursor);

  if (!ndjson) {
    process.stdout.write(JSON.stringify({ ...lastPage, [itemsKey]: allItems, pagination: { has_more: false, next_cursor: null } }, null, 2) + '\n');
  }
}

main().catch((error) => {
  process.stderr.write(JSON.stringify({ error: error.message }) + '\n');
  process.exit(1);
});
