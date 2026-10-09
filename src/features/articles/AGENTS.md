# Article authoring, content, and TOC

## Scope

Own the replacement rich-text article document, admin authoring, server rendering,
heading outline, TOC, and publication policy. Follow the
[implementation plan](../../../docs/seo-system/article-editor-toc-plan.md).
The user authorized replacing the old blocks and legacy content flows; retire
their implementations during the planned cutover rather than retaining fallback renderers.

## Inherited Instructions

Read the [root rules](../../../AGENTS.md). Preserve its ownership/reuse, public
rendering, design-system, SEO, and LINE contact requirements. These rules add
article-specific responsibilities and do not authorize deployment or database deletion.

## Local Rules

- Own one versioned document schema and infer TypeScript contracts from its runtime validator. Editor input, API writes, preview, public rendering, and publication use that contract. Do not recreate `ArticleBlock`, `authoringMode`, or a parallel legacy text body.
- Keep editor adapters separate from document policy. Domain modules are pure and browser/server compatible; admin components own editing interactions; server adapters own authentication, persistence, and publication transactions.
- The document owns ordered H2/H3 nodes. The title supplies the only H1. Collect headings once through a pure traversal used by the editor outline, public TOC, and renderer; do not store a second manually maintained TOC or scan the browser DOM.
- Allocate and persist heading IDs on creation. Preserve them after edits, reordering, save/reload, and undo/redo. Duplicated/pasted headings get new IDs. Rendering must never generate random IDs. Reject missing/duplicate IDs at the persistence boundary instead of silently rewriting published anchors.
- Drafts may contain named headings without body content. Never fabricate filler text to make a draft pass. Expose incomplete sections in admin only. H2 groups with substantive H3 descendants do not require a separate introductory paragraph.
- Validate draft saving separately from publication. The server publication policy rejects incomplete leaf sections, invalid hierarchy, unsafe URLs/media, unsupported nodes, and invalid metadata/slug. Editorial suggestions and arbitrary word-count or keyword-density scores are not publication gates.
- Public reads, static params, metadata, related articles, APIs, and sitemap consume only the validated published snapshot. Authenticated admin preview can consume the draft. Saving an unfinished draft must not replace a previously published snapshot.
- Require saving local editor changes before explicit publication. Save, publish and unpublish advance the record revision so stale tabs cannot overwrite newer editorial state. Production drafts and published snapshots share the production CMS; local/staging tests use isolated backends, not an environment field in each article.
- `src/middleware.ts` checks the exact article slug before the root loading boundary can stream. Keep this check scoped to `/articles/{slug}`, return a true 404 with no redirect for missing/unpublished content, and validate against published records only.
- Use the same server-safe content renderer for public pages and authenticated preview; a client preview requests that rendered result through an authenticated server boundary. Never import server persistence or the public renderer into the editor's client bundle.
- Render the public TOC with native fragment links and semantic navigation; desktop sticky layout and mobile `details`/`summary` need no public client component. Respect focus, header offset, and reduced motion. Editor packages must not enter public client bundles.
- Render only allowlisted nodes/marks and URL protocols. Escape text and serialized JSON-LD safely; pasted raw HTML, scripts, event handlers, and arbitrary iframes are not accepted content. Editor filtering does not replace server validation.
- Reuse existing public tokens/primitives and site patterns for public presentation; admin controls retain their existing UI API. Article-specific composition stays here. Use the feature-owned article path helper for stored slugs and the existing canonical-domain owner; never append a site-wide keyword or regenerate a published slug on a title edit.
- Support clear answers, normal headings, lists, comparison tables, figures, real project links, visible sources, and truthful author/reviewer attribution. Do not invent citations, specs, claims, credentials, publication dates, or guarantees of AI citation/ranking.
- Generate Article/BlogPosting and breadcrumbs from the visible published content and shared metadata. Do not automatically add FAQ/HowTo markup, impose fixed answer lengths, or implement `llms.txt` as an AI-ranking requirement.
- Legacy records are not converted or deleted by public reads. Until reauthored into a valid new snapshot, they are unavailable to public listing/detail/metadata/sitemap and marked for reauthoring in admin. External data cleanup is a separate explicit operation.

## Dependencies

- Reuse `zod` for runtime validation, existing admin authentication/fetch helpers,
  existing upload adapters, canonical URL helpers, and the LINE contact contract.
- Use compatible, pinned Tiptap packages for the admin rich-text engine. Use the
  feature-owned server-safe renderer with explicit node mappings for public output
  and authenticated preview; it must not require a DOM, editor instance, or React
  client hook. If adopting Tiptap's static renderer later, keep it behind this
  single render owner and its tests.
- Shared schema, traversal, and policies must not import routes, UI, database adapters,
  browser globals, or client editor modules. Client editor code must not import
  server adapters. Avoid a barrel mixing server and client exports.

## Verification

- Start schema, stable-heading IDs, publication rules, and draft-access regressions
  with behavior tests through their public interfaces. Expected results come from
  authored fixtures, not the implementation's own output.
- Test save/reload of the supplied 4-H2/7-H3 outline with empty bodies, duplicate
  heading labels/IDs, reorder and paste, Thai text, unsafe pasted content, and
  parity between preview, TOC anchors, and server-rendered headings.
- Test every publication entry point, unauthenticated draft requests, incomplete
  drafts after publication, unsupported legacy records, slug uniqueness, and
  cache/sitemap behavior on publish and unpublish.
- Run type-check, lint, build, UI QA, LINE QA when its consumers change, and
  Technical SEO QA at Template level. Confirm initial HTML and behavior with
  JavaScript disabled; verify real 404 status for drafts/unknown URLs.
- Report missing CMS/emulator/browser/GSC access as a limitation. Fixtures are
  evidence of local behavior, not proof of production publication or indexing.

## Zoom In

Ownership: document schema and policies at this feature root, admin editor under
`admin/`, server-safe content/TOC under `public/`, and persistence/application
adapters under `server/`. Add local rules only when a subdirectory needs a more
specific boundary.

## Zoom Out

[Root instructions](../../../AGENTS.md) · [Implementation plan](../../../docs/seo-system/article-editor-toc-plan.md)

## Admin editor workspace

- `admin/ArticleWorkspace.tsx` owns the editor shell, responsive panel visibility,
  drawers, focus mode, and top-level actions layout. `ArticleOutlinePanel.tsx`
  owns outline interactions; `ArticleMetadataSidebar.tsx` owns metadata field
  composition; `ArticleEditor.tsx` owns the single Tiptap instance and toolbar.
  `src/components/admin/ArticleForm.tsx` remains the owner of document/metadata
  state and save, preview, publish, and unpublish commands.
- Keep the writing canvas free of a persistent formatting strip. `ArticleWorkspace`
  owns a toolbar host in its top bar; `ArticleEditor` portals its formatting trigger
  and command popover there while retaining all Tiptap commands and selection logic.
  Do not move or remount the editor to reposition these controls.
- Keep `ArticleEditor` mounted while panels collapse, drawers open, or viewport
  breakpoints change. Do not key it by layout state or move it into conditional
  sidebar render branches; selection, IME composition, undo history, and editor
  scroll position must survive those layout changes.
- The article workspace signals its full-screen mode through
  `AdminWorkspaceContext`; the admin shell hides its navigation only while that
  mode is active. Exiting the editor restores the regular admin layout.
- Keep admin workspace styles local to admin/article components. Use Base UI for
  modal drawers and popovers that need focus management, Escape handling, and
  focus restoration. Preserve keyboard access and visible focus styling.
- On narrow screens, show one responsive drawer at a time. Choosing an outline
  item closes its drawer and then focuses the matching persisted heading ID in
  the editor. Publication issues must link to their owning field or heading.
- Saving remains explicit. A new untouched draft is clean until the author
  changes it; browser-close and back-to-list warnings apply only to actual edits.

## On-page editorial analysis

- `analysis/` owns pure extraction and local on-page rules. It reads the versioned
  document and metadata without importing admin UI, persistence, routes, or
  publication policy; results are derived and are never a publish gate.
- The admin form owns SEO draft settings, debounce/composition timing, dirty state,
  and revision-aware save. The metadata sidebar owns controls and findings; the
  single `ArticleEditor` owns text and image selection targets.
- Persist only the optional `seoSettings` envelope in D1 draft JSON. Older records
  and requests without settings remain valid, and an omitted setting on update
  preserves the stored value. Never copy settings or analysis results into
  published snapshots, public DTOs, HTML, or structured data.
- Count Thai words with `Intl.Segmenter('th', { granularity: 'word' })` and state
  clearly that the count is approximate. If unavailable, report word and phrase
  counts as unavailable while keeping structural checks. Never split on spaces.
- Match normalized exact token sequences within a single text block. Marks may
  divide adjacent text runs, but a match cannot cross paragraphs, headings, or
  table cells. Keep original editor positions for click targets; disable stale
  targets while analysis is pending.
- Do not infer synonyms, correctness, expertise, search rank, indexation, URL
  availability, or AI citation. Never set keyword-density thresholds or block
  publication based on editorial suggestions.

## Workspace theme

- The article workspace owns its light/dark theme toggle and persists the
  preference in browser storage. Keep the scope limited to `/admin/articles`;
  never change the public-site tokens or the shared admin theme.
- Define theme colors as article-workspace tokens and cover the editor canvas,
  outline, metadata, findings, inputs, drawers, and editor popovers. Portalled
  UI must receive the active theme explicitly because it does not inherit the
  workspace DOM attributes.
- Theme changes are presentation-only. Keep the Tiptap instance mounted so
  selection, composition, undo history, and document state survive a toggle.
- Use the shared site-wide typography tokens inside the workspace: Sarabun for
  the document body, controls, and outline; Sukhumvit for the article title and
  H2/H3. Do not add editor-specific font loading or change font assignment based
  only on bold text marks.
