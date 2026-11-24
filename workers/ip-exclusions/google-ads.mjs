import { bangkokDate, candidatesFor } from './policy.mjs';

export class AdsError extends Error {
  constructor(stage, status) {
    super(`${stage}_${status}`);
    this.status = status;
  }
}

export function createAdsClient(env, fetcher = fetch) {
  const customer = env.CUSTOMER_ID;
  let token;
  let tokenExpiresAt = 0;

  async function accessToken() {
    if (token && Date.now() < tokenExpiresAt) return token;
    const response = await fetcher('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: env.GOOGLE_ADS_CLIENT_ID,
        client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
        refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    });
    if (!response.ok) throw new AdsError('oauth', response.status);
    const result = await response.json();
    if (typeof result.access_token !== 'string') throw new Error('oauth_invalid_response');
    token = result.access_token;
    tokenExpiresAt = Date.now() + Math.max(0, Number(result.expires_in) - 60) * 1000;
    return token;
  }

  async function call(path, payload) {
    if (!/^\d{10}$/.test(customer)) throw new Error('invalid_customer_configuration');
    const headers = {
      authorization: `Bearer ${await accessToken()}`,
      'content-type': 'application/json',
    };
    if (env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) headers['login-customer-id'] = env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
    const response = await fetcher(`https://googleads.googleapis.com/v26/customers/${customer}/${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new AdsError(path, response.status);
    return response.json();
  }

  async function search(query) {
    const rows = [];
    let pageToken;
    do {
      const page = await call('googleAds:search', { query, pageToken });
      if (page.results !== undefined && !Array.isArray(page.results)) throw new Error('invalid_search_response');
      rows.push(...(page.results ?? []));
      pageToken = page.nextPageToken;
    } while (pageToken);
    return rows;
  }

  return {
    async verified(gclid, receivedAt, campaigns) {
      const days = new Set([bangkokDate(receivedAt), bangkokDate(receivedAt - 86_400_000)]);
      for (const date of days) {
        const rows = await search(`SELECT click_view.gclid, campaign.id FROM click_view
          WHERE segments.date = '${date}' AND click_view.gclid = '${gclid}'
          AND campaign.id IN (${campaigns.join(',')})`);
        if (rows.some((row) => row.clickView?.gclid === gclid && campaigns.includes(String(row.campaign?.id)))) return true;
      }
      return false;
    },
    async plan(ip, allowed) {
      const campaigns = (await search(`SELECT campaign.id FROM campaign
        WHERE campaign.id IN (${allowed.join(',')}) AND campaign.status = ENABLED
        AND campaign.advertising_channel_type = SEARCH`)).map((row) => String(row.campaign?.id))
        .filter((id) => allowed.includes(id));
      if (!campaigns.length) return [];
      const rows = await search(`SELECT campaign.id, campaign_criterion.ip_block.ip_address
        FROM campaign_criterion WHERE campaign.id IN (${campaigns.join(',')})
        AND campaign_criterion.type = IP_BLOCK AND campaign_criterion.negative = TRUE
        AND campaign_criterion.status != REMOVED`);
      const criteria = rows.flatMap((row) => {
        const address = row.campaignCriterion?.ipBlock?.ipAddress;
        return typeof address === 'string' ? [{ campaign: String(row.campaign?.id), address }] : [];
      });
      return candidatesFor(ip, campaigns, criteria);
    },
    async create(ip, campaigns) {
      const operations = campaigns.map((id) => ({ create: {
        campaign: `customers/${customer}/campaigns/${id}`, negative: true,
        ipBlock: { ipAddress: `${ip}/128` },
      } }));
      const result = await call('campaignCriteria:mutate', { operations, partialFailure: false });
      const names = result.results?.map(({ resourceName }) => resourceName);
      if (names?.length !== campaigns.length || names.some((name, i) =>
        typeof name !== 'string' || !name.startsWith(`customers/${customer}/campaignCriteria/${campaigns[i]}~`) ||
        !/~-?\d+$/.test(name))) throw new Error('invalid_create_response');
      return names;
    },
    async remove(name) {
      if (!new RegExp(`^customers/${customer}/campaignCriteria/\\d+~-?\\d+$`).test(name)) {
        throw new Error('invalid_owned_criterion');
      }
      const rows = await search(`SELECT campaign_criterion.resource_name FROM campaign_criterion
        WHERE campaign_criterion.resource_name = '${name}' AND campaign_criterion.type = IP_BLOCK
        AND campaign_criterion.negative = TRUE AND campaign_criterion.status != REMOVED`);
      if (rows.some((row) => row.campaignCriterion?.resourceName === name)) {
        await call('campaignCriteria:mutate', { operations: [{ remove: name }] });
      }
    },
  };
}
