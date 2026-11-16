-- Expand-only. Existing leads/jobs remain legacy and are never replayed.
CREATE TABLE ads_touches (
  click_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  landing_id TEXT NOT NULL,
  landing_path TEXT NOT NULL,
  clicked_at INTEGER NOT NULL,
  received_at INTEGER NOT NULL,
  attribution_json TEXT NOT NULL
);
CREATE INDEX idx_touches_time ON ads_touches(clicked_at, click_id);
CREATE INDEX idx_touches_session ON ads_touches(session_id, clicked_at);

ALTER TABLE leads ADD COLUMN model_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE leads ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE leads ADD COLUMN mutation_token TEXT;
ALTER TABLE leads ADD COLUMN touch_id TEXT REFERENCES ads_touches(click_id);
ALTER TABLE leads ADD COLUMN first_message_at INTEGER;
ALTER TABLE leads ADD COLUMN message_floor_at INTEGER NOT NULL DEFAULT 0;
ALTER TABLE leads ADD COLUMN review_state TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE leads ADD COLUMN review_json TEXT;
CREATE UNIQUE INDEX idx_lead_claimed_touch ON leads(touch_id) WHERE touch_id IS NOT NULL;
CREATE UNIQUE INDEX idx_crm_active_conversation ON leads(conversation_id)
  WHERE model_version = 2 AND status NOT IN ('won', 'lost', 'disqualified');
CREATE INDEX idx_crm_review_queue ON leads(model_version, review_state, first_message_at);

CREATE TABLE crm_matches (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(lead_id),
  at INTEGER NOT NULL,
  actor TEXT NOT NULL,
  selected_click_id TEXT,
  evidence_json TEXT NOT NULL
);
CREATE INDEX idx_crm_matches_lead ON crm_matches(lead_id, at);
CREATE TABLE crm_reviews (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(lead_id),
  revision INTEGER NOT NULL,
  at INTEGER NOT NULL,
  actor TEXT NOT NULL,
  review_json TEXT NOT NULL,
  value REAL,
  UNIQUE(lead_id, revision)
);
CREATE TABLE crm_valuation_versions (
  id TEXT PRIMARY KEY,
  stage TEXT NOT NULL,
  label TEXT NOT NULL,
  probability REAL NOT NULL CHECK(probability BETWEEN 0 AND 1),
  expected_profit REAL NOT NULL CHECK(expected_profit >= 0),
  enabled INTEGER NOT NULL CHECK(enabled IN (0, 1)),
  created_at INTEGER NOT NULL,
  actor TEXT NOT NULL,
  superseded_by TEXT
);
CREATE UNIQUE INDEX idx_valuation_active ON crm_valuation_versions(stage) WHERE enabled = 1;
CREATE TABLE crm_conversion_records (
  lead_id TEXT PRIMARY KEY REFERENCES leads(lead_id),
  transaction_id TEXT NOT NULL UNIQUE,
  event_at INTEGER NOT NULL,
  state TEXT NOT NULL DEFAULT 'active'
);
ALTER TABLE ads_sync_jobs ADD COLUMN review_id TEXT REFERENCES crm_reviews(id);
ALTER TABLE ads_sync_jobs ADD COLUMN payload_snapshot TEXT;
ALTER TABLE ads_sync_jobs ADD COLUMN sequence INTEGER;
ALTER TABLE ads_sync_jobs ADD COLUMN last_dispatch_at INTEGER;
ALTER TABLE ads_sync_jobs ADD COLUMN lease_until INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX idx_ads_review_once ON ads_sync_jobs(review_id) WHERE review_id IS NOT NULL;
CREATE INDEX idx_ads_outbox ON ads_sync_jobs(state, last_dispatch_at, lease_until);
CREATE TABLE crm_retention_runs (
  id TEXT PRIMARY KEY,
  started_at INTEGER NOT NULL,
  cutoff_at INTEGER NOT NULL,
  state TEXT NOT NULL,
  messages_deleted INTEGER NOT NULL DEFAULT 0,
  error TEXT
);

-- Raw redeliveries may arrive today while containing a year-old message.
ALTER TABLE webhook_deliveries ADD COLUMN retention_event_at INTEGER;
UPDATE webhook_deliveries SET retention_event_at = COALESCE(
  (SELECT MIN(CAST(json_extract(value, '$.timestamp') AS INTEGER))
   FROM json_each(CASE WHEN json_valid(raw_body) THEN raw_body ELSE '{}' END, '$.events')),
  received_at
);

-- A simulation is not the initial Google event. Promotion requires a fresh review.
ALTER TABLE ads_sync_jobs ADD COLUMN is_simulation INTEGER NOT NULL DEFAULT 0;
DROP INDEX idx_ads_jobs_one_initial_per_lead;
CREATE UNIQUE INDEX idx_ads_jobs_one_live_initial ON ads_sync_jobs(lead_id)
  WHERE kind = 'initial' AND mode = 'live' AND is_simulation = 0;
