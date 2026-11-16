# Reviewed LINE CRM and offline conversion

Implementation: local code and tests, **not a production activation record**.
Budget context: THB 8,000/month, no measured current lead volume. No bidding or
campaign settings are changed by this implementation.

## Ownership and flow

The standalone LINE Worker owns D1 CRM data, R2 attachments, media processing,
and the Ads outbox. Next.js owns authenticated same-origin admin proxies.

`registered Ads LP → Ads touch → native LINE link → inbound message → opportunity
→ timestamp match → admin review → approved outbox → Data Manager diagnostics`

A click creates only an `ads_touches` row, never a lead/conversion. The first
inbound direct-user message creates one pending opportunity. Follow events and
subsequent messages do not create conversions. Closed work is reused until an
admin explicitly starts a separate opportunity; that new work waits for a new
message after its creation. Legacy records remain read-only and are not replayed.

## Attribution contract

The shared registry and runtime schemas live in
`src/features/lead-crm/contracts.ts`. Initially only the existing
`/lp/google-ads/electric-awning` and `/lp/google-ads/retractable-awning` paths
record CRM touches. Other public routes retain their analytics but do not enter
the CRM click intake. URLs/dynamic content tokens are not a user identifier.

The browser snapshots only current-page parameters, never the old global
analytics localStorage. The page session expires after 30 minutes. Next.js
stamps click receipt before forwarding; the token-protected Worker accepts this
server timestamp only within 30 seconds and separately stores Worker receipt.
Requests without that header use Worker receipt. Native navigation never waits
for intake, analytics, authentication or a survey. LINE URL is unchanged.

Each click has an idempotent UUID. Runtime validation rejects unregistered
landing paths and unexpected fields. GCLID/GBRAID/WBRAID, UTM, campaign/ad-group/
ad IDs, keyword, match type, device, network, location and approved `ad_*` tokens
are preserved when present. No identifier means no click-attributed upload.
Keyword is not a person's search term; exact ad-click time/CPC are unavailable.

## Matching policy

Only clicks before the first message qualify. Nearest within 10 minutes may be
automatically attached as a **timestamp inference**. Candidates from 10–30 minutes
require admin selection. If no direct candidate exists, a persisted follow event
can supply an anchor: click precedes follow by at most 30 minutes, and follow
precedes first message. Follow evidence always requires review. No historical
friend-add timestamp is invented.

Ties, already-claimed clicks and truncated candidate sets never auto-attach.
The UI exposes candidates and evidence; one touch can belong to one opportunity.
Review uses revisions and rechecks automatic timing evidence. A late intake or
follow can reconcile pending work. Approved conversion attribution is locked;
IDs/destinations/time are preserved for subsequent adjustments.

## Review and value

`/admin/leads`: queues, review, search, history/export, formula versions/cohorts.
`/admin/chat`: the same review panel in the customer drawer, with an explicit
new-opportunity action. No CLI is needed for this workflow.

The UI presents four main stages: Lead, Qualified Lead, Site Visit Completed
(ดูหน้างานแล้ว), and Converted Lead. The completed visit is a distinct stage;
an old booked assessment never implies a completed visit.
Quoted/assessment remain optional progress under Qualified Lead, preserving their
stored stages and formula assignments. Lost/disqualified are separate end-of-work
outcomes. No historical stages are rewritten when opening the screen.

The form separates estimated profit before sale from actual sales results.
Probability inputs display percentages (30 means 30%); the API stores 0–1.
Converted Lead requires `sales_amount` and `actual_profit`, with profit no greater
than sales. Actual profit may be negative. Sales is stored in the validated review
JSON, atomically with its audit history; no new table or migration is needed.
Legacy won records remain readable without invented sales; the next edit must
supply sales and profit. Cohort sales totals include only recorded sales amounts.
Google Conversion Value uses actual profit (floored at zero), never sales revenue.
Before sale it uses the shared status probability × the individual job
estimated profit. There is no per-lead probability or manual EV override.

“บันทึกข้อมูลลูกค้า” saves customer status/financial inputs in CRM without
creating an upload. A separate Google Ads section previews the Conversion Value.
“ใช้มูลค่านี้กับ Google Ads” opens confirmation, and “บันทึกและยืนยันมูลค่า”
saves the inputs and queues the selected value. A mode notice explains dry-run;
test/live mode is never hidden in a button's action label.

Confirmation wakes the Queue immediately after the transaction commits. A Queue
failure leaves the approved job in D1 for scheduled recovery. While processing,
the panel refreshes status without resetting unsaved fields. Google acceptance,
processing and success remain distinct. The mode comes from authenticated
`/crm/health`, using the same two server gates as job creation. A client control
cannot activate live delivery.

Gate: service/problem, supported area/scope, and next-step intent, each
pass/fail/unknown. Qualified, quoted, assessment, site_visit_completed and won require all three passes.
Pending is never automatically converted to lost/zero after seven days.

The owner-approved initial probabilities are Lead 10%, Qualified Lead 25%,
Site Visit Completed 75%, and Converted Lead 100%. They do not decay with time.
`EV = shared status probability × expected profit before advertising costs`.
Admin can revise a status probability centrally, with reason/actor/history.
Quoted and booked assessment share Qualified probability; Converted always uses
100% and actual profit. Legacy formula profit defaults never overwrite a job's
estimated profit. Unknown estimated profit leaves the value unset.
The Worker resolves probability independently of browser inputs and rejects
stale setting versions. The settings guard is checked atomically with the review
and outbox. Existing saved values and queue snapshots do not change until an
explicit review; no settings change automatically sends anything to Google.
No persona scores or THB 1/20 placeholders are seeded.
Won uses actual profit; financial outcome, estimate, input probabilities, formula
version, reason, actor and revision are retained separately. Changing a formula
never bulk-revalues historical leads. Cohorts expose won/lost/disqualified/open,
age and recorded actual profit rather than treating open deals as losses.

Saving a review does not upload unless approve + confirmed match + a value are
provided. Unmatched/no-click-ID work stays in CRM. Zero before an initial upload
is held. Zero after an initial upload requires explicit final confirmation;
confirmed Google retraction is terminal and reopening CRM cannot restore it.

## Delivery semantics

Review, immutable snapshot, audit and outbox commit in one D1 transaction. A
scheduled dispatcher retries undispatched pending work; queue delivery is only a
wakeup. Jobs claim leases and wait for earlier revisions to succeed. Retries
reuse the transaction ID and snapshot. Google acceptance is not success:
request ID, processing, diagnostics success/partial/failure remain distinct.
A failed job with a Google request ID retries diagnostics, not blind ingestion.

`CRM_ADS_LIVE_ENABLED=false` is committed for every target, independently of any
old `ADS_SYNC_MODE` secret. Dry-run makes no Google request and is visibly marked
as simulation. It does not establish the initial live event. Later activation
requires a fresh admin review against configured real destinations, not replaying
simulation jobs. This repository policy intentionally blocks live activation;
changing it requires a separate reviewed change and controlled ingestion test.

## History, export and retention

Messages can be searched by Thai substring, globally or per conversation, using
cursor pagination. Presets 1/3/7/30/45 count Bangkok calendar days including today.
Custom dates are inclusive calendar dates. TXT/JSONL exports stream all pages;
unsent text is redacted. Inbound attachments use authenticated media reads;
untrusted document MIME types download as attachments with nosniff.

Coverage: only webhook-observed customer messages and locally logged outbound
messages exist here. Staff replies in LINE OA Manager are not captured. There is
no backfill of conversations before webhook capture began.

365-day retention applies to message bodies, files, and raw copies, including
late redeliveries. Reads exclude expired data while bounded purge batches delete
R2 first, then message records, and redact raw events/deliveries. Purge runs record
success/failure without message text. Deal/value outcomes remain separate from
transcripts. A file deletion failure preserves its keys for a subsequent retry.

## APIs

- `POST /internal/leads/intake`: strict AdsTouch, intake bearer, optional trusted
  `x-crm-click-at` from Next.js.
- `GET /crm/leads`: q, queue, cursor; ordered by latest conversation activity.
- `GET /crm/leads/:id`: review, matching evidence, touch, job and value history.
- `POST /crm/leads/:id/review|match|retry`: revision-checked admin mutation.
- `GET /crm/conversations/:id` and
  `POST /crm/conversations/:id/opportunities`: explicitly create separate work.
- `GET|POST /crm/valuations`: immutable versions; replacing an enabled version
  requires its `supersedes_id`, preventing stale concurrent activation.
- `GET /crm/summary`: outcomes by first-message cohort, with open work separate.
- `GET /crm/messages|export`: days/from/to, conversation_id, q; messages support
  cursor and export supports `format=txt|jsonl`.

Admin browsers use `/api/admin/crm/*`. Better Auth verifies the owner session and
same-origin writes. The proxy derives the actor from that session and ignores
browser actor headers; Worker reads/writes require separate server tokens.

## Validation and release

`yarn test:crm` runs against real in-memory SQLite migrations. `yarn leads:qa`
exercises actual local workerd with fixture-only credentials and rejects remote
hosts. `yarn line:qa` checks webhook signatures, replay and read API behavior.
See `workers/line-chat-history/README.md` and
`docs/platform/ci-cd-release-policy.md` for isolated local setup and CI releases.
Local success establishes neither production activation nor Google attribution.

## Local test OA

An explicitly approved test OA can be selected with
`LOCAL_LINE_CONTACT_URL=https://lin.ee/<test-link> yarn cf:build`.
The override is compiled only for `CMS_BUILD_ENV=local`; staging/production
ignore it and retain the verified production link. Both server-rendered anchors
and click capture use the same destination. Run local browser checks with the
same `LOCAL_LINE_CONTACT_URL`; the QA script refuses this override on remote
hosts. The default build continues to use the production link.

Keep test channel secret/access token in ignored local secret files, never in
build variables. The local Worker must use those credentials, with emulator
D1/R2 and Google live sync disabled. A temporary HTTPS tunnel may expose a local
gateway that forwards only `POST /line/webhook`; do not expose the CRM routes.
Configure only the test channel's webhook URL, then Verify and enable webhook
in LINE Developers. Quick Tunnel URLs change when restarted. No production
webhook or OA settings need to change for this test.
