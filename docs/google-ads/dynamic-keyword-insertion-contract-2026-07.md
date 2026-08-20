# Dynamic Keyword Insertion Contract

Date: 2026-07-24

## Decision

Siamrooftech can support dynamic keyword insertion for Google Ads, but only through approved tokens.

Do not render raw search terms, raw `{keyword}`, or arbitrary URL text into public copy.

Approved pattern:

```text
/services/retractable-awning?ad_kw=retractable_awning&ad_audience=home&ad_area=bangkok
```

Rejected pattern:

```text
/lp/google-ads/กันสาดพับเก็บได้ราคาถูกมากที่สุด
/services/retractable-awning?keyword=กันสาดพับเก็บได้ราคาถูกมากที่สุดในไทย
```

## What Dynamic Keyword Insertion Means Here

Google Ads keyword insertion in ad text uses syntax such as:

```text
{KeyWord:กันสาดพับเก็บได้}
```

Landing page dynamic insertion is different. The landing page reads controlled URL parameters and swaps a limited set of approved text fragments, such as the hero headline, eyebrow, CTA context, or proof heading.

This contract covers landing page dynamic insertion only.

## Goals

- Improve message match between ad group and landing page.
- Keep the same SEO-safe service URL architecture.
- Avoid thin duplicate landing pages.
- Preserve clean canonical URLs.
- Keep every dynamic phrase reviewed and brand-safe.
- Make Ads reporting segmentable by service, audience, area, and token.

## Non-Goals

- No raw keyword rendering.
- No auto-created pages per keyword.
- No dynamic schema claims that are not visible on the page.
- No indexable query-parameter variants.
- No automatic copy generation from `srt_keyword` or `{keyword}`.

## Query Parameter Contract

Dynamic content parameters:

| Parameter | Purpose | Example | Source |
| --- | --- | --- | --- |
| `ad_kw` | Approved service keyword bucket | `retractable_awning` | Final URL or final URL suffix |
| `ad_audience` | Approved customer segment | `home` | Final URL or final URL suffix |
| `ad_area` | Approved service area | `bangkok` | Final URL or final URL suffix |
| `ad_intent` | Approved conversion intent | `quote` | Optional |

Tracking parameters remain separate:

| Parameter family | Purpose |
| --- | --- |
| `utm_*` | Analytics source/campaign reporting |
| `srt_*` | Siamrooftech internal Ads diagnostics |
| `gclid`, `gbraid`, `wbraid` | Google auto-tagging / click identifiers |
| `gad_source`, `gad_campaignid` | Google click/campaign diagnostics |

Do not use `srt_keyword` as rendered page copy. It is an attribution field only.

## Approved Tokens

### `ad_kw`

| Token | Label | Allowed pages |
| --- | --- | --- |
| `retractable_awning` | กันสาดพับเก็บได้ | `/services/retractable-awning`, local retractable pages |
| `electric_awning` | กันสาดพับไฟฟ้า | `/services/electric-retractable-awning` |
| `manual_awning` | กันสาดพับระบบมือหมุน | `/services/retractable-awning` |

### `ad_audience`

| Token | Label | Use case |
| --- | --- | --- |
| `home` | บ้านพักอาศัย | Residential lead intent |
| `restaurant` | ร้านอาหาร | Business outdoor seating intent |
| `cafe` | คาเฟ่ | Cafe storefront / seating intent |
| `office` | บริษัทและสำนักงาน | Office/commercial building intent |

### `ad_area`

| Token | Label | Canonical service page |
| --- | --- | --- |
| `bangkok` | กรุงเทพ | `/services/retractable-awning/bangkok` |
| `nonthaburi` | นนทบุรี | `/services/retractable-awning/nonthaburi` |
| `pathum_thani` | ปทุมธานี | `/services/retractable-awning/pathum-thani` |
| `nakhon_pathom` | นครปฐม | Future local page only when approved |
| `samut_prakan` | สมุทรปราการ | Future local page only when approved |
| `ayutthaya` | อยุธยา | Future local page only when approved |
| `samut_sakhon` | สมุทรสาคร | Future local page only when approved |

### `ad_intent`

| Token | Label | Allowed effect |
| --- | --- | --- |
| `quote` | ประเมินราคา | CTA and supporting copy can mention quote/estimate |
| `consult` | ปรึกษาหน้างาน | CTA and supporting copy can mention consultation |
| `compare` | เปรียบเทียบระบบ | Supporting copy can mention manual/electric comparison |

## Rendering Rules

The page may personalize:

- hero eyebrow
- hero headline
- hero supporting paragraph
- CTA supporting context
- proof section intro
- FAQ ordering or one approved dynamic FAQ

The page must not personalize:

- canonical URL
- sitemap URL
- JSON-LD URL fields
- `meta.title` and `meta.description` for query-parameter variants
- hidden text
- claims about price, warranty, delivery speed, or performance unless already approved as static copy

## Copy Composition

The renderer must compose copy only from approved tokens.

Example:

```text
ad_kw=retractable_awning
ad_audience=home
ad_area=bangkok
```

Can render:

```text
ติดตั้งกันสาดพับเก็บได้สำหรับบ้านพักอาศัยในกรุงเทพ
```

If a token is missing or invalid, use the default static service page copy.

If token combinations conflict, ignore the conflicting token.

Examples:

| URL token combination | Result |
| --- | --- |
| `/services/retractable-awning?ad_kw=electric_awning` | Ignore `ad_kw`; the page is not the electric service page |
| `/services/electric-retractable-awning?ad_kw=retractable_awning` | Ignore `ad_kw`; page controls service identity |
| `/services/retractable-awning/bangkok?ad_area=nonthaburi` | Ignore `ad_area`; path area wins |
| `/services/retractable-awning?ad_audience=unknown` | Ignore invalid audience token |

## Path Strategy

Default public Final URL:

```text
/services/[service]?ad_kw=...&ad_audience=...&ad_area=...
```

Implementation:

- Clean `/services/...` pages stay SSG/ISR for SEO.
- Middleware rewrites approved Ads query variants to `/lp/google-ads/...` internally.
- Browser-visible URL remains `/services/...?...`.
- Canonical, JSON-LD URLs, sitemap URLs, and organic internal links remain clean `/services/...` URLs.

Use existing local pages when the location intent already has a canonical page:

```text
/services/retractable-awning/bangkok?ad_audience=home
/services/retractable-awning/nonthaburi?ad_audience=restaurant
/services/retractable-awning/pathum-thani?ad_audience=home
```

Create separately promoted Ads LP paths only after paid data proves a need:

```text
/lp/google-ads/retractable-awning-home
/lp/google-ads/retractable-awning-restaurant
/lp/google-ads/electric-retractable-awning-home
```

Do not create keyword-in-path pages for every search term.

## Canonical And Indexing

For service page query variants:

```text
Visitor URL:
/services/retractable-awning?ad_kw=retractable_awning&ad_audience=home&ad_area=bangkok

Canonical:
/services/retractable-awning
```

For local page query variants:

```text
Visitor URL:
/services/retractable-awning/bangkok?ad_audience=home

Canonical:
/services/retractable-awning/bangkok
```

Rules:

- Query variants are not included in sitemap.
- Query variants do not get distinct canonical URLs.
- Dynamic content must remain crawlable and useful if query parameters are absent.
- Do not block query variants in `robots.txt`; Google AdsBot may crawl them.

## Campaign URL Examples

Core service:

```text
https://www.siamrooftech.com/services/retractable-awning?ad_kw=retractable_awning&ad_intent=quote&utm_source=google_paid&utm_medium=paid&utm_campaign=TH_Search_NonBrand_Core&utm_term={keyword}&utm_content={creative}&srt_platform=google&srt_campaignid={campaignid}&srt_adgroupid={adgroupid}&srt_adid={creative}&srt_keyword={keyword}&srt_matchtype={matchtype}&srt_device={device}&srt_network={network}&srt_location={loc_physical_ms}
```

Bangkok home:

```text
https://www.siamrooftech.com/services/retractable-awning/bangkok?ad_kw=retractable_awning&ad_audience=home&ad_area=bangkok&ad_intent=quote&utm_source=google_paid&utm_medium=paid&utm_campaign=TH_Search_Local_Bangkok&utm_term={keyword}&utm_content={creative}&srt_platform=google&srt_campaignid={campaignid}&srt_adgroupid={adgroupid}&srt_adid={creative}&srt_keyword={keyword}&srt_matchtype={matchtype}&srt_device={device}&srt_network={network}&srt_location={loc_physical_ms}
```

Electric awning:

```text
https://www.siamrooftech.com/services/electric-retractable-awning?ad_kw=electric_awning&ad_audience=home&ad_intent=consult&utm_source=google_paid&utm_medium=paid&utm_campaign=TH_Search_Electric&utm_term={keyword}&utm_content={creative}&srt_platform=google&srt_campaignid={campaignid}&srt_adgroupid={adgroupid}&srt_adid={creative}&srt_keyword={keyword}&srt_matchtype={matchtype}&srt_device={device}&srt_network={network}&srt_location={loc_physical_ms}
```

## Measurement Rules

Every tracked lead event should include:

- `page_path`
- `page_location`
- `attribution_latest_utm_campaign`
- `attribution_latest_utm_term`
- `attribution_latest_srt_campaignid`
- `attribution_latest_srt_adgroupid`
- `attribution_latest_srt_keyword`
- `attribution_latest_srt_matchtype`
- `attribution_latest_srt_device`
- `attribution_latest_srt_location`
- `ad_kw`
- `ad_audience`
- `ad_area`
- `ad_intent`

Dynamic token reporting answers:

- Which approved service token converted?
- Which audience token converted?
- Which area token converted?
- Which keyword/ad group drove low-quality clicks?
- Which token combination deserves a dedicated `/lp/google-ads/...` page?

## QA Contract

Required checks before enabling Ads traffic:

- Valid token URL returns `200`.
- Invalid token URL still returns `200` and falls back safely.
- Canonical remains clean without query parameters.
- No query variant appears in sitemap.
- No raw `srt_keyword` or raw `{keyword}` value is rendered into the page.
- `localStorage.siamrooftech_attribution_v1` stores `ad_*`, `srt_*`, `utm_*`, `gclid`, `gbraid`, and `wbraid`.
- LINE click and phone click include attribution and dynamic token context.
- Mobile headline does not overflow when all valid token combinations are used.

Example invalid-token QA URL:

```text
http://localhost:3000/services/retractable-awning?ad_kw=cheap_unknown_keyword&srt_keyword=กันสาดพับเก็บได้ราคาถูกที่สุด
```

Expected:

- Page renders default service copy or approved fallback copy.
- Raw `cheap_unknown_keyword` is not visible.
- Raw `กันสาดพับเก็บได้ราคาถูกที่สุด` from `srt_keyword` is not visible.

## Implementation Change Requests

P0:

- Add an approved dynamic token map in `src/lib/google-ads-dynamic-content.ts`.
- Extend `src/lib/gtm.ts` to capture `ad_*`, `srt_*`, `gad_source`, and `gad_campaignid`.
- Add server/client helper that resolves dynamic copy from the current page path and approved tokens.
- Update service landing pages to accept safe dynamic copy overrides without changing canonical metadata.
- Add Ads QA checks for valid token, invalid token, canonical, and raw keyword non-rendering.

P1:

- Track `ad_*` values on `line_click` and `phone_click`.
- Add a small approved dynamic FAQ or CTA support line per audience token.
- Add reporting examples to the Google Ads launch plan.

P2:

- Build dedicated `/lp/google-ads/...` pages only when dynamic service pages show useful traffic but weak conversion.
- Add offline lead quality loop later, after CRM or lead review workflow exists.

## Final Position

Dynamic keyword insertion is allowed only as controlled dynamic copy insertion.

The system should personalize by approved intent tokens, not by arbitrary keyword text.
