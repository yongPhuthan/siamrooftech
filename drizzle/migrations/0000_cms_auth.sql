CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text DEFAULT 'user' NOT NULL,
	`banned` integer DEFAULT false NOT NULL,
	`ban_reason` text,
	`ban_expires` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`impersonated_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);
CREATE INDEX `session_user_id` ON `session` (`user_id`);
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `account_user_id` ON `account` (`user_id`);
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
CREATE INDEX `verification_identifier` ON `verification` (`identifier`);

CREATE TABLE content_entries (
  id TEXT PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('page', 'project', 'article')),
  renderer TEXT NOT NULL CHECK (renderer IN ('code', 'document', 'project')),
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  source_created_at TEXT,
  imported_at TEXT,
  deleted_at TEXT,
  CHECK ((kind = 'page' AND renderer IN ('code', 'document')) OR (kind = 'article' AND renderer = 'document') OR (kind = 'project' AND renderer = 'project'))
);
CREATE INDEX content_entries_kind ON content_entries(kind, deleted_at);
CREATE TABLE content_drafts (
  entry_id TEXT PRIMARY KEY NOT NULL REFERENCES content_entries(id) ON DELETE RESTRICT,
  schema_version INTEGER NOT NULL CHECK (schema_version >= 1),
  title TEXT NOT NULL,
  proposed_path TEXT,
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  content_hash TEXT NOT NULL,
  saved_at TEXT
);
CREATE TABLE content_routes (
  path TEXT PRIMARY KEY NOT NULL CHECK (substr(path, 1, 1) = '/'),
  entry_id TEXT NOT NULL REFERENCES content_entries(id) ON DELETE RESTRICT,
  retired_at TEXT,
  UNIQUE(entry_id, path)
);
CREATE INDEX content_routes_owner ON content_routes(entry_id);
CREATE TABLE content_publications (
  entry_id TEXT PRIMARY KEY NOT NULL REFERENCES content_entries(id) ON DELETE RESTRICT,
  path TEXT NOT NULL UNIQUE,
  revision INTEGER NOT NULL CHECK (revision >= 0),
  schema_version INTEGER NOT NULL CHECK (schema_version >= 1),
  title TEXT NOT NULL,
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  content_hash TEXT NOT NULL,
  first_published_at TEXT,
  content_modified_at TEXT,
  FOREIGN KEY (entry_id, path) REFERENCES content_routes(entry_id, path) ON DELETE RESTRICT
);
CREATE INDEX content_publications_modified ON content_publications(content_modified_at);
CREATE TABLE project_slug_sequences (
  base TEXT PRIMARY KEY NOT NULL,
  high_water_mark INTEGER NOT NULL CHECK (high_water_mark >= 0)
);
CREATE TABLE contact_submissions (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'completed')),
  created_at TEXT NOT NULL
);
CREATE VIEW published_content AS
SELECT e.id, e.kind, e.renderer, p.path, p.revision, p.schema_version,
       p.title, p.payload_json, p.content_hash, p.first_published_at, p.content_modified_at
FROM content_entries e
JOIN content_publications p ON p.entry_id = e.id
JOIN content_routes r ON r.entry_id = p.entry_id AND r.path = p.path
WHERE e.deleted_at IS NULL AND r.retired_at IS NULL;
