# Source Inventory

Generated on 2026-06-12 from Google Ads CSV exports in `/Users/yong/Downloads`, with archived copies stored in `source-files/`.

## Files

| Dataset | Original filename | Encoding | Rows | Columns | Status | Notes | Archived copy |
| --- | --- | --- | --- | --- | --- | --- | --- |
| assets | google-ads-old-assets-all-time.csv | utf-8-sig | 7 | 14 | usable |  | [archived CSV](source-files/google-ads-old-assets-all-time.csv) |
| landing_pages | google-ads-old-landing-pages-all-time.csv | utf-8-sig | 6 | 11 | usable |  | [archived CSV](source-files/google-ads-old-landing-pages-all-time.csv) |
| negative_keywords | google-ads-old-negative-keywords.csv | utf-8-sig | 4 | 6 | usable |  | [archived CSV](source-files/google-ads-old-negative-keywords.csv) |
| when_ads_showed | google-ads-old-when-ads-showed-all-time.csv | utf-8-sig | 129 | 12 | usable |  | [archived CSV](source-files/google-ads-old-when-ads-showed-all-time.csv) |
| devices | google-ads-old-devices-all-time.csv | utf-8-sig | 4 | 15 | usable |  | [archived CSV](source-files/google-ads-old-devices-all-time.csv) |
| locations | google-ads-old-locations-all-time.csv | utf-8-sig | 11 | 12 | usable |  | [archived CSV](source-files/google-ads-old-locations-all-time.csv) |
| campaigns | google-ads-old-campaigns-all-time.csv | utf-8-sig | 212 | 2 | partial | Downloaded as chart time-series, not the full table export. | [archived CSV](source-files/google-ads-old-campaigns-all-time.csv) |
| ads | google-ads-old-ads-all-time.csv | utf-8-sig | 212 | 3 | partial | Downloaded as chart time-series, not the full table export. | [archived CSV](source-files/google-ads-old-ads-all-time.csv) |
| keywords | google-ads-old-keywords-all-time.csv | utf-16 | 12 | 17 | usable | UTF-16 tab-delimited export; parsed separately. | [archived CSV](source-files/google-ads-old-keywords-all-time.csv) |
| search_terms | Search terms report.csv | utf-8-sig | 241 | 15 | usable |  | [archived CSV](source-files/Search terms report.csv) |


## Data Quality Notes

- Conversion data is not useful: all exported reports show `0.00` conversions and `0.00%` conversion rate, while the old account also showed inactive/unverified conversion tracking during browser inspection.
- `google-ads-old-ads-all-time.csv` is a chart time-series export (`Date`, `Clicks`, `Impr.`), not the full ad creative table. It is useful for daily trend only.
- `google-ads-old-campaigns-all-time.csv` is a chart time-series export (`Date`, `Clicks`), not the full campaign table. Campaign total/budget context is still visible from other exports and prior UI observation, but this CSV does not preserve campaign settings.
- `google-ads-old-keywords-all-time.csv` is UTF-16 tab-delimited even though the filename ends with `.csv`.
- The strongest source for keyword planning is `Search terms report.csv`, not the old keyword list, because it contains 237 actual user queries.
