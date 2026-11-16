import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Env } from '../src/types';

/** Real SQLite constraints, transactions and queries, exposed through D1's API. */
export function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  const migrations = fileURLToPath(new URL('../migrations/', import.meta.url));
  for (const file of readdirSync(migrations).filter((name) => name.endsWith('.sql')).sort()) sqlite.exec(readFileSync(`${migrations}/${file}`, 'utf8'));
  const queued: Array<{ jobId: string }> = [];
  const deleted: string[] = [];
  const statement = (sql: string, values: unknown[] = []) => ({
    bind: (...args: unknown[]) => statement(sql, args),
    execute: () => {
      const result = sqlite.prepare(sql).run(...values as any[]);
      return { success: true, meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } };
    },
    run: async () => statement(sql, values).execute(),
    first: async (column?: string) => {
      const row = sqlite.prepare(sql).get(...values as any[]);
      return column ? row?.[column] ?? null : row ?? null;
    },
    all: async () => ({ results: sqlite.prepare(sql).all(...values as any[]), success: true }),
  });
  const db = {
    prepare: statement,
    batch: async (statements: Array<ReturnType<typeof statement>>) => {
      sqlite.exec('BEGIN');
      try { const result = statements.map((item) => item.execute()); sqlite.exec('COMMIT'); return result; }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  const env = { CHAT_DB: db, CHAT_MEDIA: { delete: async (key: string) => { deleted.push(key); } },
    ADS_QUEUE: { send: async (item: { jobId: string }) => { queued.push(item); } },
    MEDIA_QUEUE: { send: async () => {} },
    ADS_SYNC_MODE: 'dry_run', CRM_ADS_LIVE_ENABLED: 'false',
    ADS_CUSTOMER_ID: 'fixture-customer', ADS_LOGIN_CUSTOMER_ID: 'fixture-manager', ADS_CONVERSION_ACTION_ID: 'fixture-action',
    CHAT_HISTORY_READ_TOKEN: 'fixture-read', CHAT_HISTORY_WRITE_TOKEN: 'fixture-write', LEADS_INTAKE_TOKEN: 'fixture-intake',
    LINE_CHANNEL_SECRET: 'fixture-channel', LINE_CHANNEL_ACCESS_TOKEN: 'fixture-line',
  } as unknown as Env;
  return { env, sqlite, queued, deleted, close: () => sqlite.close() };
}
