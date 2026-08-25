-- 1. audit trail ดิบ: เก็บทุก request ที่ LINE ยิงมา
CREATE TABLE webhook_deliveries (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  received_at   INTEGER NOT NULL,   -- ms epoch (server clock)
  destination   TEXT,               -- userId ของ OA
  signature_ok  INTEGER NOT NULL,
  event_count   INTEGER NOT NULL,
  raw_body      TEXT NOT NULL,      -- JSON เต็ม (row limit 2 MB)
  status        TEXT NOT NULL       -- stored | rejected
);

-- 2. event ระดับ LINE — dedupe ที่นี่
CREATE TABLE events (
  webhook_event_id TEXT PRIMARY KEY,          -- ULID จาก LINE
  delivery_id      INTEGER NOT NULL REFERENCES webhook_deliveries(id),
  event_type       TEXT NOT NULL,             -- message|unsend|follow|...
  mode              TEXT,                      -- active|standby
  is_redelivery    INTEGER NOT NULL DEFAULT 0,
  occurred_at      INTEGER NOT NULL,          -- LINE timestamp (ms)
  conversation_id  TEXT NOT NULL,             -- user:<id> | group:<id> | room:<id>
  source_type      TEXT NOT NULL,
  source_user_id   TEXT,
  raw_event        TEXT NOT NULL,
  received_at      INTEGER NOT NULL
);
CREATE INDEX idx_events_occurred      ON events(occurred_at);
CREATE INDEX idx_events_conv_occurred ON events(conversation_id, occurred_at);

-- 3. message ที่ normalize แล้ว — ตัวหลักที่ Read API ใช้
CREATE TABLE messages (
  message_id        TEXT PRIMARY KEY,        -- LINE message id (ขาเข้า) / gen (ขาออก)
  webhook_event_id  TEXT REFERENCES events(webhook_event_id),  -- NULL = ขาออก
  conversation_id   TEXT NOT NULL,
  direction         TEXT NOT NULL,           -- inbound | outbound
  actor             TEXT NOT NULL,           -- user | bot   (ไม่มี staff)
  sender_user_id    TEXT,
  message_type      TEXT NOT NULL,           -- text|image|video|audio|file|location|sticker
  text              TEXT,
  quoted_message_id TEXT,
  payload            TEXT NOT NULL,           -- JSON เฉพาะทางของแต่ละชนิด
  occurred_at       INTEGER NOT NULL,        -- ms epoch UTC
  is_unsent         INTEGER NOT NULL DEFAULT 0,
  unsent_at         INTEGER,
  edited_at         INTEGER,
  media_status      TEXT,                    -- NULL|pending|stored|expired|too_large|failed
  created_at        INTEGER NOT NULL
);
CREATE INDEX idx_messages_occurred ON messages(occurred_at, message_id);
CREATE INDEX idx_messages_conv     ON messages(conversation_id, occurred_at);

-- 4. ไฟล์แนบ
CREATE TABLE attachments (
  message_id       TEXT PRIMARY KEY REFERENCES messages(message_id),
  kind             TEXT NOT NULL,      -- image|video|audio|file
  content_provider TEXT NOT NULL,      -- line|external
  external_url     TEXT,               -- เมื่อ contentProvider.type = external
  r2_key           TEXT,
  preview_r2_key   TEXT,
  content_type     TEXT,
  byte_size        INTEGER,
  file_name        TEXT,
  sha256           TEXT,
  status           TEXT NOT NULL,      -- pending|stored|expired|too_large|skipped|failed
  attempts         INTEGER NOT NULL DEFAULT 0,
  last_error       TEXT,
  fetched_at       INTEGER
);
CREATE INDEX idx_attachments_status ON attachments(status);

-- 5. คู่สนทนา
CREATE TABLE conversations (
  conversation_id    TEXT PRIMARY KEY,
  source_type        TEXT NOT NULL,
  line_user_id       TEXT,
  display_name       TEXT,
  picture_url        TEXT,
  profile_fetched_at INTEGER,
  first_event_at     INTEGER,
  last_event_at      INTEGER,
  message_count      INTEGER NOT NULL DEFAULT 0,
  is_following       INTEGER
);
CREATE INDEX idx_conversations_last ON conversations(last_event_at);
