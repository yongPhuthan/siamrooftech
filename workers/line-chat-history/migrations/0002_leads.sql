CREATE TABLE leads (
  lead_id            TEXT PRIMARY KEY,        -- ULID; also used as the Data Manager transactionId
  ref_code           TEXT NOT NULL UNIQUE,    -- SRT-XXXXXXXX embedded in the LINE prefill message
  created_at         INTEGER NOT NULL,
  -- attribution snapshot captured at click time
  gclid              TEXT,
  gbraid             TEXT,
  wbraid             TEXT,
  lead_persona       TEXT,                    -- homeowner|procurement|contractor
  lead_quality_score INTEGER,
  utm_source         TEXT,
  utm_medium         TEXT,
  utm_campaign       TEXT,
  utm_term           TEXT,
  utm_content        TEXT,
  srt_campaignid     TEXT,
  srt_adgroupid      TEXT,
  srt_keyword        TEXT,
  srt_matchtype      TEXT,
  srt_device         TEXT,
  landing_page       TEXT,
  attribution_raw    TEXT,                    -- full JSON snapshot for audit
  -- matching to a LINE conversation
  conversation_id    TEXT,
  matched_at         INTEGER,
  match_method       TEXT,                    -- ref_code|manual
  -- pipeline
  status             TEXT NOT NULL DEFAULT 'new',  -- new|contacted|qualified|quoted|won|lost|disqualified
  status_updated_at  INTEGER,
  -- value, two layers
  persona_value      REAL,                    -- initial THB value from persona; never 0 (see ads_sync.ts)
  estimated_value    REAL,
  actual_value       REAL,
  currency           TEXT NOT NULL DEFAULT 'THB',
  -- Google Ads / Data Manager sync state
  ads_state          TEXT NOT NULL DEFAULT 'not_sent', -- not_sent|sent|restated|failed|skipped
  ads_last_value     REAL,
  ads_last_sent_at   INTEGER,
  ads_last_error     TEXT,
  notes              TEXT
);
CREATE INDEX idx_leads_created      ON leads(created_at, lead_id);
CREATE INDEX idx_leads_status       ON leads(status, created_at);
CREATE INDEX idx_leads_conversation ON leads(conversation_id);
CREATE INDEX idx_leads_unmatched    ON leads(created_at) WHERE conversation_id IS NULL;

CREATE TABLE lead_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id    TEXT NOT NULL REFERENCES leads(lead_id),
  at         INTEGER NOT NULL,
  actor      TEXT NOT NULL,                   -- agent|admin:<uid>|system
  kind       TEXT NOT NULL,                   -- match|status_change|value_change|ads_sync
  from_value TEXT,
  to_value   TEXT,
  reason     TEXT,
  payload    TEXT
);
CREATE INDEX idx_lead_events_lead ON lead_events(lead_id, at);

CREATE TABLE ads_sync_jobs (
  job_id           TEXT PRIMARY KEY,
  lead_id          TEXT NOT NULL REFERENCES leads(lead_id),
  created_at       INTEGER NOT NULL,
  kind             TEXT NOT NULL,             -- initial|restatement
  conversion_value REAL NOT NULL,
  currency         TEXT NOT NULL,
  mode             TEXT NOT NULL,             -- dry_run|live
  state            TEXT NOT NULL,             -- pending|succeeded|failed
  attempts         INTEGER NOT NULL DEFAULT 0,
  request_payload  TEXT,                      -- exact JSON sent (or that would be sent)
  response_body    TEXT,
  error            TEXT,
  completed_at     INTEGER
);
CREATE INDEX idx_ads_jobs_state ON ads_sync_jobs(state, created_at);
CREATE INDEX idx_ads_jobs_lead  ON ads_sync_jobs(lead_id, created_at);
