-- Chat workspace read state and outbound delivery audit.
ALTER TABLE conversations ADD COLUMN read_created_at INTEGER;
ALTER TABLE conversations ADD COLUMN read_message_id TEXT;

ALTER TABLE messages ADD COLUMN provider_message_id TEXT;
ALTER TABLE messages ADD COLUMN client_idempotency_key TEXT;
ALTER TABLE messages ADD COLUMN send_method TEXT;

CREATE UNIQUE INDEX idx_messages_provider_id
  ON messages(provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE UNIQUE INDEX idx_messages_idempotency
  ON messages(client_idempotency_key) WHERE client_idempotency_key IS NOT NULL;

CREATE TABLE line_reply_tokens (
  conversation_id TEXT PRIMARY KEY,
  reply_token      TEXT NOT NULL,
  captured_at      INTEGER NOT NULL,
  consumed_at      INTEGER
);

CREATE TABLE outbound_requests (
  idempotency_key TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  created_at      INTEGER NOT NULL,
  state           TEXT NOT NULL, -- sending|accepted|failed|unknown
  message_id      TEXT,
  error           TEXT,
  updated_at      INTEGER NOT NULL
);

CREATE TABLE outbound_media (
  token            TEXT PRIMARY KEY,
  message_id       TEXT,
  original_r2_key  TEXT NOT NULL,
  preview_r2_key   TEXT NOT NULL,
  original_type    TEXT NOT NULL,
  preview_type     TEXT NOT NULL,
  original_size    INTEGER NOT NULL,
  preview_size     INTEGER NOT NULL,
  created_at       INTEGER NOT NULL
);
CREATE INDEX idx_outbound_media_message ON outbound_media(message_id);

-- HTTP 200 means ingestion accepted, not conversion success. Diagnostics
-- populate these columns asynchronously via the scheduled Worker.
ALTER TABLE ads_sync_jobs ADD COLUMN google_request_id TEXT;
ALTER TABLE ads_sync_jobs ADD COLUMN next_check_at INTEGER;
ALTER TABLE ads_sync_jobs ADD COLUMN first_accepted_at INTEGER;
ALTER TABLE ads_sync_jobs ADD COLUMN last_checked_at INTEGER;
ALTER TABLE ads_sync_jobs ADD COLUMN diagnostics_json TEXT;

CREATE INDEX idx_ads_jobs_diagnostics
  ON ads_sync_jobs(state, next_check_at);

CREATE TABLE ads_sync_attempts (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id            TEXT NOT NULL REFERENCES ads_sync_jobs(job_id),
  lead_id           TEXT NOT NULL REFERENCES leads(lead_id),
  attempted_at      INTEGER NOT NULL,
  kind              TEXT NOT NULL, -- ingest|diagnostics|manual_retry
  outcome           TEXT NOT NULL,
  google_request_id TEXT,
  request_payload   TEXT,
  response_body     TEXT,
  error             TEXT
);
CREATE INDEX idx_ads_attempts_job ON ads_sync_attempts(job_id, attempted_at);
