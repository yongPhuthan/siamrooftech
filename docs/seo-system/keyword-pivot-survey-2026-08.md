# Keyword Pivot Survey: กันสาดไฟฟ้า vs กันสาดพับเก็บได้ vs กันสาดมอเตอร์

**Date:** 2026-08-29
**Status:** Survey complete. Recommendation pending owner decision and Keyword Planner confirmation.
**Question asked:** Should SEO, Google Ads, and landing-page messaging pivot the primary keyword from `กันสาดพับเก็บได้` to `กันสาดมอเตอร์` or `กันสาดไฟฟ้า`, and which of these is more competitive in organic search?

## Verdict

| Keyword | Organic competition | Demand | Intent match | Role |
|---|---|---|---|---|
| `กันสาดพับเก็บได้` / `กันสาดพับได้` | **Highest** — national retailers own page 1 | Highest | **Mixed** (retail product buyers + service buyers) | Demote to supporting |
| `กันสาดไฟฟ้า` | **Medium** — specialist installers only | Medium, understated in our data | **Strong** (custom install only) | **Promote to primary** |
| `กันสาดอัตโนมัติ` | Medium — same SERP set as above | Medium | Strong | **Co-primary** |
| `กันสาดมอเตอร์` | Lowest — but SERP is parts/marketplace | **Near zero** | **Wrong** (component buyers) | In-body term only, no target page |

Pivot to `กันสาดไฟฟ้า` + `กันสาดอัตโนมัติ` as the primary pair. Do **not** pivot to `กันสาดมอเตอร์`.

## Evidence 1: First-party Google Ads search terms

Source: `docs/google-ads/archive-2026-06-12/source-files/Search terms report.csv` (all-time export, 237 identified search-term rows). Account totals for the same period: 2,176 clicks / 25,155 impressions / THB34,570.13 / 0 conversions.

Search terms were grouped by substring after removing Google's word-segmentation spaces. Groups overlap where a query contains more than one signal, so the exclusive splits are listed as well.

| Group | Terms | Clicks | Impr. | Cost | Avg. CPC | CTR |
|---|---|---|---|---|---|---|
| Fold — `พับ` / `ม้วน` / `ยืดหด` (all) | 147 | 967 | 12,228 | THB15,445 | THB15.97 | 7.9% |
| Electric — `ไฟฟ้า` (all) | 42 | 419 | 3,613 | THB6,483 | THB15.47 | 11.6% |
| Auto — `อัตโนมัติ` / `ออโต้` | 21 | 104 | 1,029 | THB1,690 | THB16.25 | 10.1% |
| **Motor — `มอเตอร์`** | **1** | **4** | **17** | **THB62** | THB15.52 | 23.5% |
| Fold excluding electric/auto | 125 | 858 | 11,063 | THB13,667 | THB15.93 | **7.8%** |
| Electric excluding fold | 31 | 361 | 2,961 | THB5,578 | THB15.45 | **12.2%** |

Three findings:

1. **`กันสาดมอเตอร์` has effectively no demand.** One query in the entire account history — `กันสาด ระบบ มอเตอร์`, 4 clicks / 17 impressions / THB62.08. That is 0.07% of account impressions. It cannot carry a head keyword.

2. **Electric demand is understated here, not overstated.** Per `docs/google-ads/archive-2026-06-12/raw-data-digest.md`, the old account bid on only four keywords: `กันสาดพับได้` (12,801 impr), `กันสาดอัตโนมัติ` (6,745), `กันสาดผ้าใบพับได้` (3,474), `ติดตั้งกันสาดพับได้` (852). **`กันสาดไฟฟ้า` was never a keyword.** All 3,613 electric impressions arrived through close variants of other keywords. The fold-vs-electric impression ratio therefore measures our own bidding, not the market.

3. **Equal cost, better engagement.** Avg. CPC is effectively identical (THB15.45 electric vs THB15.93 fold), so paid competition is comparable. CTR is 1.6x higher on electric (12.2% vs 7.8%) on ads that were not even written for electric intent.

## Evidence 2: Organic SERP composition

Checked 2026-08-29 by live search. Method limitation is recorded under Limitations.

### `กันสาดพับเก็บได้ / กันสาดพับได้` — hardest

Page 1 is dominated by high-authority national retail plus a DIY kit brand:

- HomePro — product page and HomeGuru article
- ไทวัสดุ (Thai Watsadu) — GIANT KINGKONG 4x3m product page
- SCG HOME — installation service listing
- ShadeKit — semi-DIY prefabricated kits
- Specialist fabricators (Sard Song Sang, Magic Canvas) further down

Two problems compound. First, we cannot out-rank HomePro, ไทวัสดุ, and SCG on a head term in any realistic horizon. Second, the intent is split: a large share of this traffic wants a ready-made unit at roughly THB6,500 from a big-box store, not a custom on-site installation. The search terms report confirms the leakage directly — `กันสาด พับ ได้ โฮม โปร` (35 clicks, THB582.72) and `กันสาด ไฟฟ้า ไท วัสดุ` (33 clicks, THB483.68) both appear in the top-cost list, and `retailer_comparison` is 8.0% of classified cost in `docs/google-ads/local-analysis-2026-06-12/keyword-launch-map.md`.

### `กันสาดไฟฟ้า / กันสาดอัตโนมัติ` — beatable

Page 1 contains **no big-box retailer**. It is entirely specialist manufacturers and installers of comparable or smaller size:

- sardsongsanggroup.com
- ssscanvasgroup.com
- sun-battle.com
- fortune-shading.com
- sharppointasia.com
- thaweewat.com
- bcpower999.com
- siamroofproject.com

These sites are thin on structured proof: no systematic project portfolio, no location-level pages, little schema. That is exactly where our existing portfolio proof system (`src/lib/project-proof.ts`, `src/lib/service-project-matching.ts`) is already stronger. The two keywords also share most of page 1, so one canonical page can target both.

### `กันสาดมอเตอร์` — easy but wrong

Page 1 is component and marketplace content: Lazada motor listings, Alibaba supplier pages, YouTube, Facebook, plus off-topic English results indicating a thin Thai corpus. This is a **parts-buyer SERP**. Ranking first would deliver traffic looking for a THB3,000 motor to retrofit an existing awning, not a customer for a full installation. The 23.5% CTR on our single motor query is a 17-impression sample and should not be read as intent quality.

## Recommended keyword roles

| Keyword | New role | Notes |
|---|---|---|
| `กันสาดไฟฟ้า` | **Primary** | Head term for SEO, Ads, and landing-page H1 |
| `กันสาดอัตโนมัติ` | **Co-primary** | Same SERP set; one page serves both |
| `กันสาดไฟฟ้าราคา`, `ราคากันสาดไฟฟ้า` | Primary price intent | Already our highest-CTR terms: 17.74% and 16.91% |
| `กันสาดพับเก็บได้`, `กันสาดพับได้` | **Supporting** | Still the category name and the largest volume block. Keep for topical coverage, internal links, and body copy. Remove from primary H1/title position. |
| `กันสาดพับไฟฟ้า`, `กันสาดพับได้ไฟฟ้า` | Bridge terms | Connect the old and new positioning; already present in search terms |
| `กันสาดมอเตอร์`, `ระบบมอเตอร์` | **In-body only** | Use inside electric page copy. No dedicated page. |

## Page architecture impact

The pivot is a promotion of an existing page, not new architecture. Per `docs/seo-system/content-cluster-plan.md`, `/services/electric-retractable-awning` already exists with primary keyword `กันสาดพับไฟฟ้า`, and `docs/google-ads/url-landing-page-concept-2026-07.md` already maps the `Electric - กันสาดไฟฟ้า` ad group to it.

Required changes:

1. Update the canonical page map in `content-cluster-plan.md` so `/services/electric-retractable-awning` carries primary keyword `กันสาดไฟฟ้า` (from `กันสาดพับไฟฟ้า`).
2. Rewrite title, H1, and meta description on that page to lead with `กันสาดไฟฟ้า` / `กันสาดอัตโนมัติ`.
3. Re-point Ads traffic. Note the current live setup is homepage-only with a survey gate (see `docs/google-ads/dynamic-keyword-insertion-contract-2026-07.md` and commit 7c474b9); this pivot should be sequenced against that, not applied on top of it blindly.
4. Keep `/services/retractable-awning` as the category hub. Do not redirect it — it holds the largest volume block and the internal-link graph.
5. Add the electric page to the local service-area pattern only after the head term shows movement.

This stays inside the README stop condition: no new page type is created, and the trigger clause "search data shows a distinct intent that cannot be served by existing pages" is not being invoked — existing pages are being re-prioritised.

## Limitations

State these before treating any number here as a budget decision.

- **No keyword-difficulty tooling.** The project has no Ahrefs, Semrush, Moz, or Google Ads API credentials. There is no KD score, no third-party monthly search volume, and no backlink profile for the competitors listed. Competition is assessed qualitatively from SERP composition.
- **SERP checks were run through a US-geo search endpoint.** Real page 1 from a Thai IP will differ in ordering and in the local pack. The retail-vs-specialist split is a robust signal; exact positions are not.
- **Impression volumes reflect our own bidding**, not market demand. See Evidence 1, finding 2.
- **Zero conversions were recorded in the source period**, so no term in this document is validated against lead quality or revenue. CTR is the best proxy available and it is a weak one.

## Next steps to close the gaps

1. Pull `กันสาดไฟฟ้า`, `กันสาดอัตโนมัติ`, `กันสาดมอเตอร์`, `กันสาดพับเก็บได้` through **Google Keyword Planner** (Thailand, Thai) for monthly volume, competition index, and top-of-page bid range. This is the missing number.
2. Pull **Search Console** query data for the current site to find where we already rank on each term. A term we sit at position 12 on is a different investment than one we do not rank for at all.
3. Re-run this survey after both, and replace the qualitative competition column with real figures.

## Appendix: reproducing the aggregation

```bash
cd docs/google-ads/archive-2026-06-12/source-files/
python3 - <<'EOF'
import csv
with open('Search terms report.csv', encoding='utf-8-sig') as f:
    lines = f.read().split('\n')
hi = [i for i, l in enumerate(lines) if l.startswith('Search term,')][0]
data = [x for x in csv.DictReader(lines[hi:]) if x.get('Search term')]
norm = lambda s: s.replace(' ', '')
I = lambda x: int(x['Impr.'].replace(',', ''))
groups = {
    'motor':    lambda t: 'มอเตอร์' in t,
    'electric': lambda t: 'ไฟฟ้า' in t,
    'auto':     lambda t: 'อัตโนมัติ' in t or 'ออโต้' in t,
    'fold':     lambda t: 'พับ' in t or 'ม้วนเก็บ' in t or 'ยืดหด' in t,
}
for g, fn in groups.items():
    sel = [x for x in data if fn(norm(x['Search term']))]
    c = sum(int(x['Clicks']) for x in sel)
    i = sum(I(x) for x in sel)
    cost = sum(float(x['Cost']) for x in sel)
    print(f"{g:10}{len(sel):5}{c:7}{i:7}{cost:10.0f}{cost/c:8.2f}{100*c/i:7.1f}%")
EOF
```
