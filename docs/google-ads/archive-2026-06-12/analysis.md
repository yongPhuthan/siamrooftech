# Google Ads Old Account Analysis

## Executive Summary

- **The old account is useful for intent mining, not for conversion benchmarking.** It spent THB34,570.13 for 2,176 clicks at 8.7% CTR and THB15.89 average CPC, but conversion tracking recorded `0.00` conversions. Do not use old CPA or conversion rate for planning.
- **Search demand is real and commercially concentrated.** The strongest visible demand is around retractable awnings, electric/automatic awnings, and price-intent queries. The identified search terms alone account for THB23,511.70 in spend and 1,479 clicks.
- **Mobile is the main battleground.** Mobile phones drove 1,651 clicks and 75.2% of spend. Landing pages and CTAs should be designed around LINE and phone-first mobile behavior.
- **There is meaningful waste risk from retailer/DIY intent.** Queries involving HomePro/Thai Watsadu/DIY/how-to/ready-made language consumed budget without useful conversion evidence. These should be controlled aggressively in the new account.

## What The Old Account Proves

The old account proves there is enough search volume for a focused Search campaign. With one campaign and four broad phrase-match keyword themes, it generated 25,155 impressions and 2,176 clicks over the export period. The account was not a measurement-quality campaign because conversion tracking was broken, so the correct use of this data is keyword discovery, traffic shaping, and landing-page prioritization.

## Demand Themes

| Theme | Evidence | Implication |
| --- | --- | --- |
| Core retractable awning | `กันสาด พับ ได้` alone spent THB5,066.60 for 311 clicks; old keyword `กันสาดพับได้` drove 1,045 clicks. | Keep this as the primary ad group and exact/phrase keyword set. |
| Electric / automatic awning | Electric/automatic cluster: 512 clicks and THB7,988.74 spend. | Create a separate ad group because ad copy and objections differ from manual retractable awnings. |
| Price intent | Price cluster: 350 clicks and THB5,500.57 spend. | Use price-framed copy carefully: quote/onsite estimate, not cheap commodity pricing. |
| Retailer/DIY comparison | Retailer cluster: 117 clicks and THB1,883.03 spend. | Treat as negative or separate low-budget test; do not let it mix with lead-generation traffic. |


## Device And Landing Page Implications

The old traffic was mobile-heavy: mobile phones represented 75.9% of clicks and 75.2% of spend. The new landing page should put LINE and phone CTAs above the fold, keep the quote path short, and avoid forcing a long form as the primary conversion.

The landing-page export shows almost all clicks went to the homepage variant `https://www.siamrooftech.com`, with 2,041 clicks and THB32,320.47 spend. The `/portfolio` URL had very high impressions but weak CTR in the landing-page report, so it should be used as supporting proof from sitelinks rather than the main destination unless redesigned as a portfolio-led landing page.

## Location Implications

Spend was concentrated in Pathum Thani and Bangkok. Pathum Thani alone accounts for 56.7% of account spend by cost in the location export, followed by Bangkok at 27.0%. The new account should start with Bangkok + surrounding provinces, then use lead quality and actual service area constraints to prune.

## Schedule Implications

The old account spent across all days and hours, with Sunday and Saturday showing the highest spend by day. Because conversions were broken, this should not be used to shut off weekdays or nights immediately. Start broad enough to learn, but make sure phone/LINE handling capacity matches the schedule.

The strongest cost-volume hours were 11:00-16:00 and 20:00-21:00. For a conservative launch, use full-day delivery for the first learning period or limit only very low-intent late-night hours if budget is tight.

## Measurement Caveat

Every strategic conclusion here is traffic-quality inference, not verified lead-quality analysis. The new account must use clean GA4/GTM key events (`line_click`, `phone_click`, `quote_request`) and should not import old Google Ads conversions.

## Main Risks If We Rebuild Naively

1. **Repeating broad phrase-match leakage.** The old account captured useful volume but also retailer/DIY intent. Without negatives, the new account will waste budget quickly.
2. **Optimizing to clicks instead of leads.** Old data has no verified conversions; using CTR alone can overvalue curiosity and price-shopping terms.
3. **Sending all traffic to a generic homepage.** Homepage worked as a catch-all, but a dedicated Ads landing page would let us align copy, proof, LINE/phone CTAs, and tracking more tightly.
4. **Over-trusting old ad copy.** The ad export is incomplete; exact creative should be redownloaded if old headline/description preservation becomes important.
