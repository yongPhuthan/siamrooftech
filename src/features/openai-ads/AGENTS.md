# OpenAI Ads (ChatGPT Ads) measurement

Applies to every file in this directory. Root `AGENTS.md` and
`src/features/line-contact/AGENTS.md` still apply.

## Ownership

- `pixel-config.ts`: pure, browser-safe policy (Pixel ID format, loader
  snippet, custom event names).
- `OpenAIPixel.tsx`: server-rendered loader in the root layout. Renders only in
  production builds with a valid `NEXT_PUBLIC_OPENAI_PIXEL_ID`.
- `measure.ts`: fire-and-forget browser calls (`page_viewed`, standard
  `lead_created` on LINE CTA clicks, custom `phone_click`). Called from
  `AttributionCapture`'s passive click listeners.
- `conversions-api.ts`: server-only Conversions API client
  (`https://bzr.openai.com/v1/events?pid=<PIXEL-ID>`). Not wired to a trigger yet.

## Rules

- The Pixel ID is public (it ships in page HTML) and lives only in the
  production `vars` of `wrangler.jsonc` as `NEXT_PUBLIC_OPENAI_PIXEL_ID`, like
  the GA4 ID. Staging is forced empty in `next.config.mjs`; local builds measure
  only when the env var is set explicitly. Never commit
  `OPENAI_CONVERSIONS_API_KEY` or customer data: the API key is a Worker secret,
  never a `NEXT_PUBLIC_*` value.
- Measurement never blocks LINE: no `preventDefault`, no awaited calls, no
  href changes in a click path. `phone_click` is a diagnostic only.
- Conversion campaigns can only optimize toward a **standard** event, and the
  objective/event cannot change after creation. Owner decision (2026-11-17),
  plan C:
  - **Phase A (now):** Pixel sends `lead_created` (`customer_action`) with a
    unique `event_id` on every LINE CTA click (matched by canonical href). The
    first Conversion campaign optimizes toward it. It is a click signal, not a
    verified lead; judge it against matched LINE messages and qualified Leads.
  - **Phase B (later):** the LINE Worker sends `lead_created` through the
    Conversions API when a LINE message is matched to an ad click (with
    `oppref`), launched as a **new** campaign. Before B goes live, stop the
    Phase A Pixel `lead_created` (or move it to a separate data source) so one
    pixel never counts both a click and a message as a lead.
- Conversions API requests default to `validate_only: true`. Sending live events
  (`{ live: true }`) needs explicit owner approval and a deterministic `id`
  equal to the Pixel `event_id` for the same action. Include the original
  `oppref` when known. Batches are atomic (max 1,000 events).
- Paid ChatGPT ad URLs must carry `utm_source=chatgpt&utm_medium=cpc`; organic
  ChatGPT citations arrive as `utm_source=chatgpt.com`.
- Keep `robots.ts` from disallowing `OAI-AdsBot` on landing pages.
