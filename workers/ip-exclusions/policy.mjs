const clickIdPattern = /^[0-9A-Za-z_-]{16,256}$/;
const retentionMs = 30 * 24 * 60 * 60 * 1000;
const retryMinutes = [2, 5, 15, 30, 60, 120, 120];

export { retentionMs };

export function landingClick(raw) {
  try {
    const url = new URL(raw);
    if (url.origin !== 'https://www.siamrooftech.com' ||
        url.pathname.replace(/\/$/, '') !== '/lp/google-ads/electric-awning') return null;
    const ids = url.searchParams.getAll('gclid');
    return ids.length === 1 && clickIdPattern.test(ids[0]) ? ids[0] : null;
  } catch {
    return null;
  }
}

export function publicIpv6(raw) {
  if (typeof raw !== 'string' || !/^[a-f\d:]+$/i.test(raw)) return null;
  try {
    const host = new URL(`https://[${raw}]`).hostname.slice(1, -1);
    if (!/^[23][\da-f]{3}:/i.test(host) || host.startsWith('2001:db8:') ||
        host.startsWith('3fff:') || host.startsWith('2002:')) return null;
    return host;
  } catch {
    return null;
  }
}

export function isClickId(value) {
  return typeof value === 'string' && clickIdPattern.test(value);
}

export function campaignIds(raw) {
  const ids = [...new Set(String(raw ?? '').split(',').map((id) => id.trim()))];
  if (!ids.length || ids.some((id) => !/^[1-9]\d{0,18}$/.test(id))) {
    throw new Error('invalid_campaign_configuration');
  }
  return ids;
}

export function retryAt(attempt, now) {
  return attempt < retryMinutes.length ? now + retryMinutes[attempt] * 60_000 : null;
}

export function bangkokDate(now) {
  return new Date(now + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function candidatesFor(ip, campaigns, criteria) {
  return campaigns.filter((campaign) => {
    const existing = criteria.filter((criterion) => criterion.campaign === campaign);
    return existing.length < 450 && !existing.some((criterion) =>
      publicIpv6(criterion.address.replace(/\/128$/, '')) === ip);
  });
}
