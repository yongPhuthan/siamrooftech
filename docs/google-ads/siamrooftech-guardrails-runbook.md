# Siamrooftech Google Ads Guardrails

Source: `scripts/google-ads/siamrooftech-guardrails.js`

## Scope

The script monitors campaign `24208286298`
(`TH_Search_ElectricAwning_Leads_2026Q3`) and applies the approved controls:

- Pause when the Target Spend / Maximize Clicks CPC ceiling is missing or is
  greater than THB 40 for Electric, or THB 15 for Retractable/Manual.
- Pause when a reachable (`HTTP 200`) enabled-ad landing page does not contain
  the canonical LINE contact URL `https://lin.ee/pPz1ZqN`.
- Alert without pausing when a landing page cannot be fetched or returns a
  non-200 response. This avoids a transient network error stopping delivery.
- Alert without pausing when the daily budget differs from THB 500.
- Alert without pausing when today's spend reaches THB 250 while the primary
  `Siamrooftech (web) line_click` conversion count is zero.
- Report `LINE message received` separately through `All conversions` as a
  deep-conversion diagnostic. It is not a pause or bidding signal.
- Report search terms from the last seven days that spent at least THB 22 and
  have zero reported conversions. The script never adds negative keywords.

## Installation

1. Open Google Ads > Tools > Bulk actions > Scripts.
2. Create a new script and paste the complete source file.
3. Set `alertEmail` only to an approved recipient. When configured, the script
   emails only when the guardrail itself pauses a campaign; warnings and healthy
   runs remain silent.
   Never commit the address or any token to the repository.
4. Authorize the script, then use Preview and inspect the JSON log.
5. If Preview matches the live account, run once manually.
6. Schedule hourly for guardrails. Search-term candidates use a rolling
   seven-day window, so reviewing their report once per day is sufficient.

## Safety boundary

Only two deterministic violations can pause a campaign: an absent/excessive CPC
ceiling, or a successfully fetched landing page whose rendered server HTML does
not contain the canonical LINE link. Budget, conversion, network, and search-term
findings are alert/report-only. Electric's approved ceiling is THB 40;
Retractable/Manual remains THB 15.

## Live deployment snapshot — 2026-09-12

- Campaign `24208286298` was paused during the change and QA, then enabled
  again after all gates passed.
- Daily budget remains THB 500, bidding remains Maximize Clicks, and the CPC
  ceiling remains THB 22.
- `Siamrooftech (web) line_click`: Primary, Count One, included in the
  account-default Contacts goal.
- `LINE message received`: Secondary, Count One; reported as the deep signal.
- `Siamrooftech (web) phone_click` and `ขอการเสนอราคา`: Secondary.
- `Siamrooftech (web) line_survey_complete`: removed/archived; its two
  historical conversions remain visible in historical reporting.
- Installed script `12294679` completed a live manual run in five seconds with
  no alerts and no account changes. Its log reported today's cost THB 13.90,
  primary conversions 0, and deep conversions 0 at run time.
- Production browser QA observed the `line_click` GA4 transport, but the Google
  Ads action still showed `Waiting for conversion` immediately afterward. Treat
  this as the import-latency watch gate: if it is still zero after 24 hours,
  pause the campaign and repair the GA4-to-Google Ads connection.

## Live update — 2026-09-16

- Raised the Electric automatic-pause CPC guardrail from THB 22 to THB 40 after
  the live Maximize Clicks ceiling was intentionally set to THB 30.
- Script `12294679` was saved in Google Ads and Preview completed with no account
  changes. The saved source was reopened and verified to contain
  `maximumCpcCeiling: 40`.
- The repository source keeps `alertEmail` empty to avoid storing contact details.
  The live deployment uses the approved recipient configured in Google Ads and
  emails only when the guardrail itself pauses a campaign.

## Local verification

```bash
node --test scripts/google-ads/siamrooftech-guardrails.test.cjs
node --check scripts/google-ads/siamrooftech-guardrails.js
```
