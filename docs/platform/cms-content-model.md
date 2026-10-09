# CMS content model

Updated: 2026-10-06. Runtime owner: `src/lib/database/`, with project and article policies in their feature directories.

## Data ownership

The site uses a single local CMS database binding, `APP_DB`, with Drizzle-defined content schema and reviewed SQL migrations. Login/session records and published CMS content share this local database. The LINE chat-history Worker owns a separate database and is not part of this CMS.

Content entries have stable IDs and a `kind` of `page`, `project`, or `article`. Each entry has one private working draft and an optional public snapshot. `content_routes` reserves canonical paths, including retired paths, so removed URLs are never silently reused. Project slug sequence records retain the highest allocated number. The `published_content` view exposes only active published snapshots.

## Publishing contract

- Admin APIs validate JSON with feature-owned runtime schemas. Database row types do not replace content validation.
- Saving a draft updates the draft and revision only. Public pages, metadata, related links, APIs, and sitemap read validated publication snapshots.
- Publish validates content, checks the expected revision, reserves the canonical route, writes the snapshot, and updates its modification date in one guarded D1 batch.
- Unpublish removes public visibility and keeps the draft and route reservation. Deleted records become tombstones; retired paths return a real 404 and are not redirected.
- Draft and live content remain separate when an editor has unpublished changes. Clients must save before publishing, and stale revisions receive a conflict response.
- Unknown publication dates remain unknown. Import time is not used as public `lastmod`.

## Current collections

| Type | Stored shape | Public renderer |
| --- | --- | --- |
| Page | Code template or a future validated document | Existing page route; no catch-all is installed |
| Project | Existing project contract, media records, dates, and stable slug | `/projects/[slug]` |
| Article | Versioned rich-text document and metadata | `/articles/[slug]`, including native heading outline and TOC |

The public-project baseline is imported from `src/data/projects.ts`. It contains 16 records and 67 image records; the importer preserves IDs, paths, and media URLs and can be rerun safely. No videos are present in that source set. New project records are created as private drafts through the admin API.

## Local setup

1. Install with the pinned Yarn version and copy `.dev.vars.example` to `.dev.vars`.
2. Generate a local `BETTER_AUTH_SECRET` of at least 32 characters and set `BETTER_AUTH_URL=http://localhost:3000`.
3. Apply CMS and cache migrations with `yarn db:migrate:local` and `yarn db:migrate:cache:local`, then import published baseline projects with `yarn db:seed:local`.
4. Configure `ADMIN_ALLOWED_EMAILS` and the native email binding, then register the first administrator through the email OTP form. See `docs/security/admin-access.md`.
5. Run `yarn dev` and open an admin page to register through email OTP. D1/R2 stay local; the explicitly configured email binding sends real verification emails.

`.dev.vars` and Wrangler state are local and ignored by Git. The example file contains placeholders only. The app does not auto-migrate, seed, or create administrator accounts on startup.

## D1 and Drizzle notes

Drizzle owns the CMS schema and provides typed query building over the D1 binding. The authentication library uses its documented native D1 adapter. Keep auth plugin schema and CMS migrations reviewed together in `drizzle/migrations/`. Do not use schema push against an environment. D1 mutations that cross rows use guarded batches; test stale revisions, path conflicts, and failure rollback against local D1.
