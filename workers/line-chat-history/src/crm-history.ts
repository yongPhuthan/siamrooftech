import { bangkokRange } from '../../../src/features/lead-crm/contracts';
import { CrmError } from './crm';
import type { Env } from './types';
import { jsonResponse } from './http';
import { utcMsToLocalIso } from './timezone';

export const CHAT_COVERAGE = 'ข้อความลูกค้าที่ webhook ได้รับ; คำตอบจากพนักงานใน LINE OA Manager ไม่ถูกส่งเข้า webhook';
interface HistoryRow { message_id: string; conversation_id: string; display_name: string | null;
  direction: string; message_type: string; text: string | null; occurred_at: number; is_unsent: number; has_media: number }
export function historyRange(url: URL, now = Date.now()) {
  const days = Number(url.searchParams.get('days') ?? '7');
  if (![1, 3, 7, 30, 45].includes(days)) throw new CrmError('invalid day preset');
  const range = bangkokRange(days, now);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const date = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new CrmError('วันที่ต้องเป็น YYYY-MM-DD');
    const at = Date.parse(`${value}T00:00:00+07:00`);
    if (!Number.isFinite(at) || new Date(at + 7 * 3600_000).toISOString().slice(0, 10) !== value) throw new CrmError('วันที่ไม่ถูกต้อง');
    return at;
  };
  if (from) range.from = date(from);
  if (to) range.to = Math.min(date(to) + 86400_000, now + 1);
  range.from = Math.max(range.from, now - 365 * 86400_000);
  if (range.from >= range.to) throw new CrmError('ช่วงวันที่ไม่ถูกต้อง');
  return range;
}
export async function historyPage(env: Env, url: URL, fixedRange = historyRange(url)) {
  const q = (url.searchParams.get('q') ?? '').trim();
  if (q.length > 200) throw new CrmError('คำค้นยาวเกินไป');
  const conditions = ['m.occurred_at >= ?', 'm.occurred_at < ?'];
  const binds: Array<string | number> = [fixedRange.from, fixedRange.to];
  const conversationId = url.searchParams.get('conversation_id');
  if (conversationId) { conditions.push('m.conversation_id = ?'); binds.push(conversationId); }
  if (q) { conditions.push("m.is_unsent = 0 AND instr(COALESCE(m.text, ''), ?) > 0"); binds.push(q); }
  const raw = url.searchParams.get('cursor');
  if (raw) {
    let cursor: { at: number; id: string };
    try { cursor = JSON.parse(atob(raw)); } catch { throw new CrmError('invalid cursor'); }
    if (!Number.isSafeInteger(cursor.at) || typeof cursor.id !== 'string' || cursor.id.length > 200) throw new CrmError('invalid cursor');
    conditions.push('(m.occurred_at > ? OR (m.occurred_at = ? AND m.message_id > ?))');
    binds.push(cursor.at, cursor.at, cursor.id);
  }
  const rows = await env.CHAT_DB.prepare(`SELECT m.message_id, m.conversation_id, c.display_name, m.direction,
    m.message_type, CASE WHEN m.is_unsent = 1 THEN NULL ELSE m.text END AS text, m.occurred_at, m.is_unsent, EXISTS (SELECT 1 FROM attachments a WHERE a.message_id = m.message_id AND a.status = 'stored') AS has_media
    FROM messages m LEFT JOIN conversations c ON c.conversation_id = m.conversation_id
    WHERE ${conditions.join(' AND ')} ORDER BY m.occurred_at, m.message_id LIMIT 201`).bind(...binds).all<HistoryRow>();
  const messages = rows.results.slice(0, 200);
  const last = messages[messages.length - 1];
  return { coverage: CHAT_COVERAGE, range: fixedRange, messages,
    next_cursor: rows.results.length > 200 && last ? btoa(JSON.stringify({ at: last.occurred_at, id: last.message_id })) : null };
}
export async function handleHistory(env: Env, url: URL): Promise<Response> {
  if (url.pathname === '/crm/messages') return jsonResponse(await historyPage(env, url));
  const format = url.searchParams.get('format') ?? 'txt';
  if (!['txt', 'jsonl'].includes(format)) throw new CrmError('format must be txt or jsonl');
  const range = historyRange(url);
  const encoder = new TextEncoder();
  let cursor: string | null = null;
  let started = false;
  let done = false;
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (done) return;
      try {
        const pageUrl = new URL(url);
        if (cursor) pageUrl.searchParams.set('cursor', cursor);
        else pageUrl.searchParams.delete('cursor');
        const page = await historyPage(env, pageUrl, range);
        let chunk = '';
        if (!started) {
          chunk = format === 'jsonl' ? `${JSON.stringify({ type: 'coverage', note: CHAT_COVERAGE, timezone: 'Asia/Bangkok', range })}\n`
            : `${CHAT_COVERAGE}\nTimezone: Asia/Bangkok\n\n`;
          started = true;
        }
        for (const row of page.messages) {
          chunk += format === 'jsonl' ? `${JSON.stringify(row)}\n`
            : `[${utcMsToLocalIso(row.occurred_at, 'Asia/Bangkok')}] ${row.display_name ?? row.conversation_id} (${row.direction})\n${row.is_unsent ? '[ข้อความถูกยกเลิก]' : row.text ?? `[${row.message_type}]`}\n\n`;
        }
        controller.enqueue(encoder.encode(chunk));
        cursor = page.next_cursor;
        if (!cursor) { done = true; controller.close(); }
      } catch (error) { done = true; controller.error(error); }
    },
    cancel() { done = true; },
  });
  return new Response(stream, { headers: { 'content-type': format === 'txt' ? 'text/plain; charset=utf-8' : 'application/x-ndjson; charset=utf-8',
    'content-disposition': `attachment; filename="line-history.${format}"`, 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff' } });
}
