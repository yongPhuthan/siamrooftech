CREATE TABLE auth_otp_requests (
  email_key TEXT PRIMARY KEY NOT NULL,
  retry_at INTEGER NOT NULL
);
CREATE TABLE rate_limit (
  id TEXT PRIMARY KEY NOT NULL,
  key TEXT NOT NULL UNIQUE,
  count INTEGER NOT NULL,
  last_request INTEGER NOT NULL
);
