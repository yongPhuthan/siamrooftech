-- Enforce webhook/manual-match idempotency at the database boundary. D1
-- serializes writes, and this partial unique index prevents two concurrent
-- deliveries from creating more than one initial conversion for a lead while
-- still allowing later value restatements.
CREATE UNIQUE INDEX idx_ads_jobs_one_initial_per_lead
  ON ads_sync_jobs(lead_id)
  WHERE kind = 'initial';
