import type { Env } from './types';

/** Bounded, repeatable purge. Delete R2 first so failure preserves retry keys. */
export async function purgeChatHistory(env: Env, now = Date.now()): Promise<void> {
  const cutoff = now - 365 * 86400_000;
  const id = crypto.randomUUID();
  await env.CHAT_DB.prepare(`INSERT INTO crm_retention_runs (id, started_at, cutoff_at, state) VALUES (?, ?, ?, 'running')`)
    .bind(id, now, cutoff).run();
  let count = 0;
  try {
    const rows = await env.CHAT_DB.prepare(`SELECT m.message_id, a.r2_key, a.preview_r2_key FROM messages m
      LEFT JOIN attachments a ON a.message_id = m.message_id WHERE m.occurred_at < ? ORDER BY m.occurred_at LIMIT 100`)
      .bind(cutoff).all<{ message_id: string; r2_key: string | null; preview_r2_key: string | null }>();
    for (const row of rows.results) {
      const media = await env.CHAT_DB.prepare('SELECT token, original_r2_key, preview_r2_key FROM outbound_media WHERE message_id = ?')
        .bind(row.message_id).all<{ token: string; original_r2_key: string; preview_r2_key: string }>();
      const keys = new Set([row.r2_key, row.preview_r2_key, ...media.results.flatMap((item) => [item.original_r2_key, item.preview_r2_key])].filter((key): key is string => Boolean(key)));
      for (const key of keys) await env.CHAT_MEDIA.delete(key);
      await env.CHAT_DB.batch([
        env.CHAT_DB.prepare('DELETE FROM attachments WHERE message_id = ?').bind(row.message_id),
        env.CHAT_DB.prepare('DELETE FROM outbound_media WHERE message_id = ?').bind(row.message_id),
        env.CHAT_DB.prepare('DELETE FROM messages WHERE message_id = ? AND occurred_at < ?').bind(row.message_id, cutoff),
      ]);
      count++;
    }
    const orphans = await env.CHAT_DB.prepare('SELECT token, original_r2_key, preview_r2_key FROM outbound_media WHERE created_at < ? LIMIT 100')
      .bind(cutoff).all<{ token: string; original_r2_key: string; preview_r2_key: string }>();
    for (const media of orphans.results) {
      await env.CHAT_MEDIA.delete(media.original_r2_key);
      await env.CHAT_MEDIA.delete(media.preview_r2_key);
      await env.CHAT_DB.prepare('DELETE FROM outbound_media WHERE token = ?').bind(media.token).run();
    }
    // Redact entire mixed deliveries too: they may contain old, redelivered chat text.
    await env.CHAT_DB.batch([
      env.CHAT_DB.prepare(`UPDATE webhook_deliveries SET raw_body = '{}' WHERE COALESCE(retention_event_at, received_at) < ? OR id IN
        (SELECT delivery_id FROM events WHERE occurred_at < ?)` ).bind(cutoff, cutoff),
      env.CHAT_DB.prepare(`UPDATE events SET raw_event = '{}' WHERE occurred_at < ?`).bind(cutoff),
      env.CHAT_DB.prepare('DELETE FROM line_reply_tokens WHERE captured_at < ?').bind(cutoff),
      env.CHAT_DB.prepare(`UPDATE crm_retention_runs SET state = 'succeeded', messages_deleted = ? WHERE id = ?`).bind(count, id),
    ]);
  } catch (error) {
    await env.CHAT_DB.prepare(`UPDATE crm_retention_runs SET state = 'failed', messages_deleted = ?, error = 'purge incomplete; will retry' WHERE id = ?`)
      .bind(count, id).run();
    throw error;
  }
}
