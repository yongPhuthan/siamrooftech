# Google Ads Production QA Evidence

Date: 2026-07-25

Environment:

```text
https://www.siamrooftech.com
```

## Decision

```text
BLOCK
```

Production is not ready for a Google Ads pilot.

Reason: the live domain does not currently expose the required `/services/...` landing pages and Ads query URLs. Production appears behind the local repository state or deployed from an older build.

## Commands Run

```bash
yarn seo:qa --base=https://www.siamrooftech.com
yarn ads:qa --base=https://www.siamrooftech.com
yarn ads:browser-qa --base=https://www.siamrooftech.com
```

## Results

| Check | Result | Blocking |
| --- | --- | --- |
| Production SEO QA | FAIL | Yes |
| Production Ads QA | FAIL | Yes |
| Production browser dataLayer QA | FAIL | Yes |

## Key Failures

### SEO QA

Observed failures:

- Homepage has 6 H1 elements instead of 1.
- `/contact` canonical points to `https://www.siamrooftech.com` instead of `/contact`.
- `/articles` canonical points to `https://www.siamrooftech.com` instead of `/articles`.
- Required service pages return 404:
  - `/services/retractable-awning`
  - `/services/electric-retractable-awning`
  - `/services/retractable-awning/bangkok`
  - `/services/retractable-awning/nonthaburi`
  - `/services/retractable-awning/pathum-thani`
- Sitemap is missing service URLs and some core URLs.
- Thai legacy redirects return 404 instead of 308.

### Ads QA

Observed failures:

- Ads query URL for `/services/retractable-awning?...` returns 404.
- Ads query URL for `/services/retractable-awning/bangkok?...` returns 404.
- Invalid token safety URL also returns 404 instead of rendering the safe fallback page.

### Browser dataLayer QA

Observed failure:

- Browser QA timed out waiting for `siamrooftech_attribution_v1` in localStorage.
- Because the Ads landing page does not load, the browser cannot prove `line_click` and `phone_click` dataLayer events on production.

## Required Fix Before Pilot

Deploy the current repository state, or the approved build containing:

- `/services/retractable-awning`
- `/services/electric-retractable-awning`
- `/services/retractable-awning/bangkok`
- `/services/retractable-awning/nonthaburi`
- `/services/retractable-awning/pathum-thani`
- middleware rewrite for `/services/...?...ad_*...`
- Ads attribution capture
- server-rendered CTA dataLayer tracking
- SEO and Ads QA scripts

Then rerun:

```bash
yarn seo:qa --base=https://www.siamrooftech.com
yarn ads:qa --base=https://www.siamrooftech.com
yarn ads:browser-qa --base=https://www.siamrooftech.com
yarn ads:readiness
```

## Launch Rule

Do not launch or spend on Google Ads until production QA passes and GTM/GA4/Google Ads external wiring is verified.
