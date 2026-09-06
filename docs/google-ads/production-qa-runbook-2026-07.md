# Google Ads Production QA Runbook

Updated: 2026-09-07

## Purpose

Verify the direct LINE contact flow and the actual-message conversion pipeline.
The retired survey modal, `line_survey_start`, and `line_survey_complete` must
never be part of a new visitor journey.

## Automated QA

```bash
yarn seo:qa --base=https://www.siamrooftech.com
yarn ads:qa --base=https://www.siamrooftech.com
yarn ads:browser-qa --base=https://www.siamrooftech.com
yarn leads:qa
```

A blocking failure is any dialog on a LINE click, a missing ref-code, duplicate
events/intakes, survey events, missing attribution, a navigation blocked by an
intake failure, a duplicate webhook conversion, or a canonical/sitemap failure.

## Browser flow

Test paid, UTM-only, and organic visits on every public-page CTA position.

1. Open `https://www.siamrooftech.com/?gclid=qa-live-gclid-<date>&utm_source=google`.
2. Click a LINE CTA once. No dialog may appear.
3. Confirm native anchor navigation targets `line.me/R/oaMessage`, with the
   prefilled text `สอบถามข้อมูลกันสาดจากเว็บไซต์ครับ/ค่ะ [SRT-XXXXXXXX]`.
4. Confirm exactly one `/api/leads/intake` request carries the same ref-code,
   gclid/UTM values, page URL, and CTA position. Persona must be null/absent.
5. Confirm exactly one diagnostic `line_click` fires with `position`,
   `active_section`, `scroll_depth_percent`, and attribution.
6. Confirm no `line_survey_start` or `line_survey_complete` event fires and no
   `srt_paid` cookie is created.
7. Block the intake request and repeat. LINE navigation must still proceed.
8. Repeat on an organic URL and a UTM-only URL. Both must use the same direct
   flow; only their attribution differs.
9. Click a phone CTA and confirm one diagnostic `phone_click` event.

## Real-device LINE QA

Test iOS and Android, both an existing LINE OA friend and a first-time visitor.
The prefilled message and ref-code must survive LINE's interstitial and remain
sendable. After sending, verify that the lead is matched to the conversation.

## Webhook and Data Manager QA

1. Send the ref-coded message once. The first matched inbound message must queue
   one initial conversion even when persona is null.
2. Confirm value is `1 THB` and `transactionId` is the immutable `lead_id`.
3. Replay the webhook. No second conversion may be created.
4. Verify manual matching produces the same one-time initial conversion.
5. Verify queue retry and later estimated/actual value restatements reuse the
   same transaction ID.
6. Keep `ADS_SYNC_MODE=dry_run` until Data Manager authentication and payload
   validation succeed. Only then change it to `live`.

## Google Ads configuration

- `LINE message received`: Offline/Data Manager, Contact, Primary, Count One,
  1 THB initial value, 30-day click-through window.
- `Siamrooftech (web) line_survey_complete`: Secondary, historical only.
- `line_click` and `phone_click`: Secondary/non-bidding diagnostics.
- Keep Maximize Clicks until at least 30 actual matched LINE messages occur in
  a rolling 30-day period. Do not change budget, keywords, or bidding during
  the contact-flow rollout.

## Publish decision

- `PASS`: direct flow, intake, matching, deduplication, conversion configuration,
  and production browser QA all pass.
- `PASS_WITH_EXTERNAL_WIRING`: website/Worker pass, but Data Manager remains in
  dry-run while credentials or conversion-action propagation are pending.
- `BLOCK`: LINE contact is obstructed, ref attribution is lost, webhook matching
  duplicates conversions, or Google Ads is optimizing for a click/survey proxy.

## Rollback triggers

Pause Ads or roll back if LINE navigation becomes blocked, ref-codes disappear,
intake-to-message matching drops unexpectedly, duplicate conversions appear, or
Google Ads starts bidding on `line_click`, `phone_click`, or the retired survey.
