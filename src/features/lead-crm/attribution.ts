// Browser-safe metadata; importing this module must not load runtime validators.
export const LANDING_REGISTRY = {
  'electric-awning': '/lp/google-ads/electric-awning',
  'retractable-awning': '/lp/google-ads/retractable-awning',
  'chatgpt-electric-awning': '/lp/chatgpt-ads/electric-awning',
} as const;
export type LandingId = keyof typeof LANDING_REGISTRY;
export const ATTRIBUTION_KEYS = [
  'gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign',
  'utm_term', 'utm_content', 'srt_campaignid', 'srt_adgroupid', 'srt_adid',
  'srt_keyword', 'srt_matchtype', 'srt_device', 'srt_network', 'srt_location',
  'ad_kw', 'ad_audience', 'ad_area', 'ad_intent',
] as const;
