import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const timestamp = (name: string) => integer(name, { mode: 'timestamp' });

export const user = sqliteTable('user', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('user'),
  banned: integer('banned', { mode: 'boolean' }).notNull().default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonated_by'),
}, (table) => [index('session_user_id').on(table.userId)]);

export const account = sqliteTable('account', {
  id: text('id').primaryKey().notNull(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, (table) => [index('account_user_id').on(table.userId)]);

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey().notNull(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
}, (table) => [index('verification_identifier').on(table.identifier)]);

export const authOtpRequests = sqliteTable('auth_otp_requests', {
  emailKey: text('email_key').primaryKey().notNull(),
  retryAt: integer('retry_at').notNull(),
});

export const authRateLimits = sqliteTable('rate_limit', {
  id: text('id').primaryKey().notNull(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: integer('last_request').notNull(),
});

export const contentEntries = sqliteTable('content_entries', {
  id: text('id').primaryKey().notNull(),
  kind: text('kind', { enum: ['page', 'project', 'article'] }).notNull(),
  renderer: text('renderer', { enum: ['code', 'document', 'project'] }).notNull(),
  revision: integer('revision').notNull().default(0),
  sourceCreatedAt: text('source_created_at'),
  importedAt: text('imported_at'),
  deletedAt: text('deleted_at'),
}, (table) => [index('content_entries_kind').on(table.kind, table.deletedAt)]);

export const contentDrafts = sqliteTable('content_drafts', {
  entryId: text('entry_id').primaryKey().notNull().references(() => contentEntries.id),
  schemaVersion: integer('schema_version').notNull(),
  title: text('title').notNull(),
  proposedPath: text('proposed_path'),
  payloadJson: text('payload_json').notNull(),
  contentHash: text('content_hash').notNull(),
  savedAt: text('saved_at'),
});

export const contentRoutes = sqliteTable('content_routes', {
  path: text('path').primaryKey().notNull(),
  entryId: text('entry_id').notNull().references(() => contentEntries.id),
  retiredAt: text('retired_at'),
}, (table) => [uniqueIndex('content_routes_entry_path').on(table.entryId, table.path), index('content_routes_owner').on(table.entryId)]);

export const contentPublications = sqliteTable('content_publications', {
  entryId: text('entry_id').primaryKey().notNull().references(() => contentEntries.id),
  path: text('path').notNull().unique(),
  revision: integer('revision').notNull(),
  schemaVersion: integer('schema_version').notNull(),
  title: text('title').notNull(),
  payloadJson: text('payload_json').notNull(),
  contentHash: text('content_hash').notNull(),
  firstPublishedAt: text('first_published_at'),
  contentModifiedAt: text('content_modified_at'),
}, (table) => [index('content_publications_modified').on(table.contentModifiedAt)]);

export const projectSlugSequences = sqliteTable('project_slug_sequences', {
  base: text('base').primaryKey().notNull(),
  highWaterMark: integer('high_water_mark').notNull(),
});

export const contactSubmissions = sqliteTable('contact_submissions', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status', { enum: ['new', 'contacted', 'completed'] }).notNull().default('new'),
  createdAt: text('created_at').notNull(),
});

export const contactRateLimits = sqliteTable('contact_rate_limits', {
  bucketKey: text('bucket_key').primaryKey().notNull(),
  windowStart: integer('window_start').notNull(),
  count: integer('count').notNull(),
});
