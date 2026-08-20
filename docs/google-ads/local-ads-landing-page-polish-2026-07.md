# Local Ads Landing Page Polish

Date: 2026-07-25

## Purpose

This local work package prepares Google Ads landing pages before production deployment.

The goal is not to launch paid traffic yet. The goal is to make the local landing-page experience clear enough that a user who clicks an ad can understand the service, see what information is needed, and contact Siamrooftech through LINE or phone without confusion.

## What Changed

- Ads query URLs can show a controlled campaign summary on the service page.
- The summary uses only approved `ad_*` tokens, not raw Google keyword text.
- Ads landing pages now include a customer-facing estimate-prep block.
- The estimate-prep block tells users what to send for a faster estimate:
  - service needed
  - service area
  - customer type
  - approximate width and projection
  - real site photos
- LINE and phone buttons in the estimate-prep block use the same tracking pattern as the hero CTA.
- Customer-facing copy avoids internal terms such as "mock", "DKI", and "campaign token".

## What This Is Not

- This is not the real calculator.
- This is not a price promise.
- This is not a new SEO page factory.
- This is not a production launch approval.
- This is not a replacement for GTM, GA4, or Google Ads conversion setup.

## Local Done Criteria

This phase is ready when these pass locally:

```bash
yarn type-check
yarn build
yarn seo:qa --base=http://localhost:3000
yarn ads:qa --base=http://localhost:3000
yarn ads:browser-qa --base=http://localhost:3000
```

Use another port if the local app is running elsewhere.

## Production Launch Gate

Before spending Google Ads budget, production still needs:

- current build deployed to `https://www.siamrooftech.com`
- service and Ads URLs returning 200
- clean canonicals
- GTM installed on production
- GA4 receiving `line_click` and `phone_click`
- Google Ads conversion import tested
- production `seo:qa`, `ads:qa`, and `ads:browser-qa` passing

## Next Logical Work

After this local phase passes, the next best work is one of:

- improve Ads landing-page copy from real LINE/phone objections
- add more portfolio proof to match P0 ad groups
- build the real conversion calculator only after estimate logic is agreed
- deploy and run the production launch gate when the business is ready to spend
