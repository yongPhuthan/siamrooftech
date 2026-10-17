import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/index';
import type { AdsSyncJobRow, Env, LeadRow } from '../src/types';

const lead: LeadRow = {
  lead_id: 'lead-qualified-line-message',
  ref_code: 'SRT-TEST',
  created_at: Date.UTC(2026, 8, 11, 9, 0, 0),
  gclid: 'test-gclid',
  gbraid: null,
  wbraid: null,
  lead_persona: 'homeowner',
  lead_quality_score: 80,
  utm_source: 'google',
  utm_medium: 'cpc',
  utm_campaign: null,
  utm_term: null,
  utm_content: null,
  srt_campaignid: null,
  srt_adgroupid: null,
  srt_keyword: null,
  srt_matchtype: null,
  srt_device: null,
  landing_page: null,
  attribution_raw: null,
  conversation_id: 'user:test-line-user',
  matched_at: Date.UTC(2026, 8, 11, 9, 1, 0),
  match_method: 'manual',
  status: 'qualified',
  status_updated_at: null,
  persona_value: null,
  estimated_value: null,
  actual_value: null,
  currency: 'THB',
  ads_state: 'not_sent',
  ads_last_value: null,
  ads_last_sent_at: null,
  ads_last_error: null,
  notes: null,
};

const job: AdsSyncJobRow = {
  job_id: 'job-qualified-line-message',
  lead_id: lead.lead_id,
  created_at: lead.created_at,
  kind: 'initial',
  conversion_value: 1,
  currency: 'THB',
  // A job may have been queued while the previous deployment was live. The
  // current environment must still prevent it from being sent during cutover.
  mode: 'live',
  state: 'pending',
  attempts: 0,
  request_payload: null,
  response_body: null,
  error: null,
  completed_at: null,
};

test('line-ads-sync forces a previously live job to dry-run during cutover', async () => {
  let persistedPayload = '';
  let acknowledged = false;

  const env = {
    ADS_SYNC_MODE: 'dry_run',
    ADS_CUSTOMER_ID: '1234567890',
    ADS_LOGIN_CUSTOMER_ID: '0987654321',
    ADS_CONVERSION_ACTION_ID: '1111111111',
    CHAT_DB: {
      prepare(sql: string) {
        return {
          bind(...values: unknown[]) {
            return {
              first: async () => (sql.includes('FROM ads_sync_jobs') ? job : sql.includes('FROM leads') ? lead : null),
              run: async () => {
                if (sql.includes('SET request_payload')) persistedPayload = String(values[0]);
                return {};
              },
            };
          },
        };
      },
      batch: async () => [],
    },
  } as unknown as Env;

  const queueBatch = {
    queue: 'line-ads-sync',
    messages: [
      {
        body: { jobId: job.job_id },
        attempts: 1,
        ack: () => {
          acknowledged = true;
        },
        retry: () => assert.fail('dry-run job should not retry'),
      },
    ],
  } as unknown as MessageBatch<{ jobId: string }>;

  await worker.queue(queueBatch, env);

  const payload = JSON.parse(persistedPayload);
  assert.equal(payload.events[0].eventSource, 'MESSAGE');
  assert.equal(payload.events[0].adIdentifiers.gclid, 'test-gclid');
  assert.equal(payload.destinations[0].operatingAccount.accountId, '1234567890');
  assert.equal(payload.destinations[0].loginAccount.accountId, '0987654321');
  assert.equal(acknowledged, true);
});
