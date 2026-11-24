import { DurableObject, WorkerEntrypoint } from 'cloudflare:workers';
import { createAdsClient } from './google-ads.mjs';
import { campaignIds, isClickId, publicIpv6, retentionMs, retryAt } from './policy.mjs';

const hour = 60 * 60 * 1000;
const maxPending = 60;
const maxNewPerHour = 60;
const maxJobsPerAlarm = 5;

export default class Blocker extends WorkerEntrypoint {
  async add(signal) {
    const ip = publicIpv6(signal?.ip);
    if (!ip || !isClickId(signal?.gclid)) return;
    if (!['audit', 'live'].includes(this.env.IP_EXCLUSIONS_MODE)) return;
    await this.env.CLICK_LEDGER.getByName('siamrooftech-search').enqueue(ip, signal.gclid, this.env.IP_EXCLUSIONS_MODE);
  }

  async scheduled() {
    await this.env.CLICK_LEDGER.getByName('siamrooftech-search').wake();
  }
}

export class ClickLedger extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.storage = ctx.storage;
    this.sql = this.storage.sql;
    this.ads = createAdsClient(env);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS clicks (
      digest TEXT PRIMARY KEY, gclid TEXT, ip TEXT, received_at INTEGER NOT NULL,
      next_run INTEGER, mode TEXT NOT NULL, attempt INTEGER NOT NULL DEFAULT 0
    )`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS exclusions (
      resource_name TEXT PRIMARY KEY, next_run INTEGER NOT NULL
    )`);
    this.sql.exec('CREATE INDEX IF NOT EXISTS clicks_due ON clicks(next_run) WHERE next_run IS NOT NULL');
    this.sql.exec('CREATE INDEX IF NOT EXISTS clicks_received ON clicks(received_at)');
    this.sql.exec('CREATE INDEX IF NOT EXISTS exclusions_due ON exclusions(next_run)');
  }

  async enqueue(ip, gclid, mode) {
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest(
      'SHA-256', new TextEncoder().encode(gclid),
    )), (byte) => byte.toString(16).padStart(2, '0')).join('');
    const now = Date.now();
    const { recent, pending } = this.sql.exec(`SELECT
      (SELECT count(*) FROM clicks WHERE received_at > ?) AS recent,
      (SELECT count(*) FROM clicks WHERE next_run IS NOT NULL) AS pending`, now - hour).one();
    if (recent >= maxNewPerHour || pending >= maxPending) {
      console.warn('ip_exclusions_queue_at_capacity');
      return;
    }
    this.sql.exec(`INSERT OR IGNORE INTO clicks (digest, gclid, ip, received_at, next_run, mode)
      VALUES (?, ?, ?, ?, ?, ?)`, digest, gclid, ip, now, now, mode);
    await this.wake();
  }

  async wake(replace = false) {
    await this.ctx.blockConcurrencyWhile(async () => {
      const { due } = this.sql.exec(`SELECT min(next_run) AS due FROM (
        SELECT min(next_run) AS next_run FROM clicks
        UNION ALL SELECT min(next_run) FROM exclusions
        UNION ALL SELECT min(received_at) + ? FROM clicks WHERE next_run IS NULL
      )`, 48 * hour).one();
      if (due === null) {
        if (replace) await this.storage.deleteAlarm();
        return;
      }
      const when = Math.max(Date.now() + 1000, due);
      const alarm = await this.storage.getAlarm();
      if (replace || alarm === null || when < alarm) await this.storage.setAlarm(when);
    });
  }

  async alarm() {
    if (this.running) return;
    this.running = true;
    try {
      // Keep a recovery alarm while the object waits on external requests.
      await this.storage.setAlarm(Date.now() + 15 * 60_000);
      const now = Date.now();
      for (const job of this.sql.exec('SELECT * FROM clicks WHERE next_run <= ? ORDER BY next_run LIMIT ?',
        now, maxJobsPerAlarm).toArray()) await this.processClick(job);
      for (const row of this.sql.exec('SELECT * FROM exclusions WHERE next_run <= ? ORDER BY next_run LIMIT ?',
        now, maxJobsPerAlarm).toArray()) await this.expire(row.resource_name);
      this.sql.exec('DELETE FROM clicks WHERE next_run IS NULL AND received_at <= ?', now - 48 * hour);
      await this.wake(true);
    } finally {
      this.running = false;
    }
  }

  finish(digest) {
    this.sql.exec('UPDATE clicks SET gclid = NULL, ip = NULL, next_run = NULL WHERE digest = ?', digest);
  }

  async processClick(job) {
    const now = Date.now();
    const mode = this.env.IP_EXCLUSIONS_MODE;
    if (!['audit', 'live'].includes(mode) || now - job.received_at >= 6 * hour) {
      this.finish(job.digest);
      return;
    }
    try {
      const campaigns = campaignIds(this.env.CAMPAIGN_IDS);
      if (await this.ads.verified(job.gclid, job.received_at, campaigns)) {
        const candidates = await this.ads.plan(job.ip, campaigns);
        const names = job.mode === 'live' && mode === 'live' && candidates.length > 0
          ? await this.ads.create(job.ip, candidates) : [];
        this.storage.transactionSync(() => {
          for (const name of names) this.sql.exec('INSERT OR IGNORE INTO exclusions VALUES (?, ?)',
            name, Date.now() + retentionMs);
          this.finish(job.digest);
        });
        console.info('ip_exclusions_verified', { candidates: candidates.length, created: names.length, mode });
        return;
      }
    } catch {
      console.error('ip_exclusions_click_processing_failed');
    }
    const next = retryAt(job.attempt, now);
    if (next !== null) {
      this.sql.exec('UPDATE clicks SET attempt = attempt + 1, next_run = ? WHERE digest = ?', next, job.digest);
    } else {
      this.finish(job.digest);
      console.warn('ip_exclusions_click_unverified');
    }
  }

  async expire(resource) {
    try {
      await this.ads.remove(resource);
      this.sql.exec('DELETE FROM exclusions WHERE resource_name = ?', resource);
      console.info('ip_exclusions_expired');
    } catch {
      this.sql.exec('UPDATE exclusions SET next_run = ? WHERE resource_name = ?', Date.now() + hour, resource);
      console.error('ip_exclusions_expiry_failed');
    }
  }
}
