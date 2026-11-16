const assert = require('node:assert/strict');
const test = require('node:test');

const SCRIPT_PATH = './siamrooftech-guardrails.js';

function installGoogleAdsMocks({
  budget = 400,
  cpcCeiling = 22,
  strategy = 'TARGET_SPEND',
  landingStatus = 200,
  landingHtml = '<a href="https://lin.ee/pPz1ZqN">LINE</a>',
  landingError = null,
  cost = 0,
  primaryConversions = 0,
  deepConversions = 0,
  searchTerms = [],
  campaignOverrides = {},
} = {}) {
  const pausedCampaignIds = new Set();
  const logs = [];
  const emails = [];

  const defaultsById = {
    '24208286298': {
      name: 'TH_Search_ElectricAwning_Leads_2026Q3',
      budget,
      cpcCeiling,
      finalUrl: 'https://www.siamrooftech.com/lp/google-ads/electric-retractable-awning',
    },
    '24239501001': {
      name: 'TH_Search_RetractableAwning_Leads_2026Q3',
      budget: 200,
      cpcCeiling: 15,
      finalUrl: 'https://www.siamrooftech.com/lp/google-ads/retractable-awning',
    },
  };

  function campaignFor(id) {
    const campaignId = String(id);
    const config = { ...defaultsById[campaignId], ...campaignOverrides[campaignId] };
    if (!config.name) return null;
    return {
      getId: () => campaignId,
      getName: () => config.name,
      getBudget: () => ({ getAmount: () => config.budget }),
      bidding: () => ({
        getStrategyType: () => strategy,
        getCpcBidCeiling: () => config.cpcCeiling,
      }),
      ads: () => ({
        withCondition: () => ({
          get: () => iteratorOf([
            { urls: () => ({ getFinalUrl: () => config.finalUrl }) },
          ]),
        }),
      }),
      pause: () => pausedCampaignIds.add(campaignId),
    };
  }

  global.AdsApp = {
    campaigns: () => ({
      withIds: (ids) => ({
        get: () => iteratorOf(ids.map(campaignFor).filter(Boolean)),
      }),
    }),
    search: (query) => {
      if (query.includes('search_term_view')) {
        return iteratorOf(query.includes('24208286298') ? searchTerms : []);
      }
      if (query.includes('metrics.cost_micros')) {
        const isElectric = query.includes('24208286298');
        return iteratorOf([{ metrics: { costMicros: (isElectric ? cost : 0) * 1_000_000 } }]);
      }
      const isElectric = query.includes('24208286298');
      return iteratorOf([
        {
          metrics: {
            conversions: isElectric ? primaryConversions : 0,
            allConversions: isElectric ? primaryConversions : 0,
          },
          segments: { conversionActionName: 'Siamrooftech (web) line_click' },
        },
        {
          metrics: { conversions: 0, allConversions: isElectric ? deepConversions : 0 },
          segments: { conversionActionName: 'LINE message received' },
        },
      ]);
    },
  };
  global.UrlFetchApp = {
    fetch: () => {
      if (landingError) throw landingError;
      return {
        getResponseCode: () => landingStatus,
        getContentText: () => landingHtml,
      };
    },
  };
  global.Logger = { log: (value) => logs.push(String(value)) };
  global.MailApp = { sendEmail: (message) => emails.push(message) };

  return {
    wasPaused: () => pausedCampaignIds.size > 0,
    wasCampaignPaused: (id) => pausedCampaignIds.has(String(id)),
    logs,
    emails,
  };
}

function iteratorOf(values) {
  let index = 0;
  return {
    hasNext: () => index < values.length,
    next: () => values[index++],
    [Symbol.iterator]: function* iterator() {
      yield* values;
    },
  };
}

function loadScript() {
  delete require.cache[require.resolve(SCRIPT_PATH)];
  return require(SCRIPT_PATH);
}

test('main leaves Electric enabled when its CPC ceiling is ฿30 under the ฿40 guardrail', () => {
  const platform = installGoogleAdsMocks({ cpcCeiling: 30 });
  const { main } = loadScript();

  const result = main();

  assert.equal(platform.wasPaused(), false);
  assert.equal(result.paused, false);
  assert.doesNotMatch(result.alerts.join('\n'), /CPC ceiling/);
});

test('main pauses Electric when its CPC ceiling exceeds ฿40', () => {
  const platform = installGoogleAdsMocks({ cpcCeiling: 41 });
  const { main } = loadScript();

  const result = main();

  assert.equal(platform.wasPaused(), true);
  assert.equal(result.paused, true);
  assert.match(result.alerts.join('\n'), /CPC ceiling.*41.*40/);
});

test('pause notification emails the approved recipient once', () => {
  const platform = installGoogleAdsMocks();
  const { publishResult } = loadScript();

  publishResult(
    {
      paused: true,
      alerts: ['Campaign 24208286298: CPC ceiling 41 exceeds approved maximum 40'],
      searchTermCandidates: [],
    },
    'alerts@example.com',
  );

  assert.equal(platform.emails.length, 1);
  assert.equal(platform.emails[0].to, 'alerts@example.com');
  assert.equal(platform.emails[0].subject, '[Siamrooftech Ads] Campaign paused');
});

test('warning without a pause does not send an email', () => {
  const platform = installGoogleAdsMocks();
  const { publishResult } = loadScript();

  publishResult(
    {
      paused: false,
      alerts: ['Daily budget differs from approved value'],
      searchTermCandidates: [],
    },
    'alerts@example.com',
  );

  assert.equal(platform.emails.length, 0);
});

test('main pauses the campaign when the CPC ceiling is missing', () => {
  const platform = installGoogleAdsMocks({ cpcCeiling: null });
  const { main } = loadScript();

  const result = main();

  assert.equal(platform.wasPaused(), true);
  assert.equal(result.paused, true);
  assert.match(result.alerts.join('\n'), /CPC ceiling is missing/);
});

test('main pauses the campaign when a reachable landing page lacks the canonical LINE link', () => {
  const platform = installGoogleAdsMocks({ landingHtml: '<main>ไม่มีลิงก์ LINE</main>' });
  const { main } = loadScript();

  const result = main();

  assert.equal(platform.wasPaused(), true);
  assert.equal(result.paused, true);
  assert.match(result.alerts.join('\n'), /canonical LINE link is missing/);
});

test('main alerts but does not pause when the landing-page request fails', () => {
  const platform = installGoogleAdsMocks({ landingError: new Error('timeout') });
  const { main } = loadScript();

  const result = main();

  assert.equal(platform.wasPaused(), false);
  assert.equal(result.paused, false);
  assert.match(result.alerts.join('\n'), /fetch failed.*timeout/);
});

test('main alerts without pausing after ฿250 spend and zero primary LINE clicks', () => {
  const platform = installGoogleAdsMocks({ cost: 275, primaryConversions: 0 });
  const { main } = loadScript();

  const result = main();

  assert.equal(platform.wasPaused(), false);
  assert.equal(result.paused, false);
  assert.match(result.alerts.join('\n'), /275.*Siamrooftech \(web\) line_click.*0/);
});

test('main reports LINE messages separately as a deep-conversion diagnostic', () => {
  installGoogleAdsMocks({ cost: 100, primaryConversions: 3, deepConversions: 1 });
  const { main } = loadScript();

  const result = main();

  assert.deepEqual(result.performance, {
    cost: 100,
    primaryConversions: 3,
    deepConversions: 1,
  });
});

test('main reports costly non-converting search terms for human review without adding negatives', () => {
  const platform = installGoogleAdsMocks({
    searchTerms: [
      {
        searchTermView: { searchTerm: 'กันสาด solar cell' },
        metrics: { costMicros: 47_500_000, clicks: 2, conversions: 0 },
      },
      {
        searchTermView: { searchTerm: 'ติดตั้งกันสาดไฟฟ้า' },
        metrics: { costMicros: 40_000_000, clicks: 2, conversions: 1 },
      },
    ],
  });
  const { main } = loadScript();

  const result = main();

  assert.equal(platform.wasPaused(), false);
  assert.deepEqual(result.searchTermCandidates, [
    { searchTerm: 'กันสาด solar cell', cost: 47.5, clicks: 2, conversions: 0 },
  ]);
});

test('main leaves a healthy campaign unchanged', () => {
  const platform = installGoogleAdsMocks({ cost: 100, primaryConversions: 1 });
  const { main } = loadScript();

  const result = main();

  assert.equal(platform.wasPaused(), false);
  assert.deepEqual(result.alerts, []);
  assert.deepEqual(result.searchTermCandidates, []);
});

test('configuration locks line click as primary and LINE message as deep diagnostic', () => {
  installGoogleAdsMocks();
  const { CONFIG } = loadScript();

  assert.equal(CONFIG.primaryConversionActionName, 'Siamrooftech (web) line_click');
  assert.equal(CONFIG.deepConversionActionName, 'LINE message received');
  assert.deepEqual(
    CONFIG.campaigns.map(({ campaignId, expectedDailyBudget, maximumCpcCeiling }) => ({
      campaignId,
      expectedDailyBudget,
      maximumCpcCeiling,
    })),
    [
      { campaignId: '24208286298', expectedDailyBudget: 400, maximumCpcCeiling: 40 },
      { campaignId: '24239501001', expectedDailyBudget: 200, maximumCpcCeiling: 15 },
    ],
  );
});

test('main alerts without pausing when the Electric daily budget differs from ฿400', () => {
  const platform = installGoogleAdsMocks({ budget: 650 });
  const { main } = loadScript();

  const result = main();

  assert.equal(platform.wasPaused(), false);
  assert.match(result.alerts.join('\n'), /Daily budget 650 differs from approved 400/);
});

test('main pauses only Retractable when its CPC ceiling exceeds ฿15', () => {
  const platform = installGoogleAdsMocks({
    campaignOverrides: { '24239501001': { cpcCeiling: 18 } },
  });
  const { main } = loadScript();

  const result = main();

  assert.equal(platform.wasCampaignPaused('24208286298'), false);
  assert.equal(platform.wasCampaignPaused('24239501001'), true);
  assert.match(result.alerts.join('\n'), /24239501001.*CPC ceiling 18 exceeds approved maximum 15/);
});
