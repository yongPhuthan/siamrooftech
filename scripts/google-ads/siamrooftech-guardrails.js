/**
 * Siamrooftech Google Ads guardrails.
 *
 * Paste this file into Google Ads > Tools > Scripts. Keep alertEmail empty
 * until the intended recipient has been approved. Run Preview before enabling
 * a schedule.
 */
const CONFIG = Object.freeze({
  campaigns: Object.freeze([
    Object.freeze({
      campaignId: '24208286298',
      campaignName: 'TH_Search_ElectricAwning_Leads_2026Q3',
      expectedDailyBudget: 400,
      maximumCpcCeiling: 40,
    }),
    Object.freeze({
      campaignId: '24239501001',
      campaignName: 'TH_Search_RetractableAwning_Leads_2026Q3',
      expectedDailyBudget: 200,
      maximumCpcCeiling: 15,
    }),
  ]),
  spendAlertWithoutPrimaryConversion: 250,
  searchTermReviewMinimumCost: 22,
  primaryConversionActionName: 'Siamrooftech (web) line_click',
  deepConversionActionName: 'LINE message received',
  canonicalLineUrl: 'https://lin.ee/pPz1ZqN',
  alertEmail: '',
});

function main() {
  const alerts = [];
  let paused = false;
  const campaignResults = [];
  const performance = { cost: 0, primaryConversions: 0, deepConversions: 0 };
  const searchTermCandidates = [];

  CONFIG.campaigns.forEach((campaignConfig) => {
    const campaignIterator = AdsApp.campaigns()
      .withIds([Number(campaignConfig.campaignId)])
      .get();
    if (!campaignIterator.hasNext()) {
      alerts.push(`Campaign ${campaignConfig.campaignId} was not found`);
      return;
    }

    const result = inspectCampaign(campaignIterator.next(), campaignConfig);
    paused = paused || result.paused;
    alerts.push(...result.alerts);
    performance.cost += result.performance.cost;
    performance.primaryConversions += result.performance.primaryConversions;
    performance.deepConversions += result.performance.deepConversions;
    searchTermCandidates.push(...result.searchTermCandidates);
    campaignResults.push(result);
  });

  return publishResult({
    paused,
    alerts,
    performance,
    searchTermCandidates,
    campaigns: campaignResults,
  });
}

function inspectCampaign(campaign, campaignConfig) {
  const alerts = [];
  let paused = false;
  const alert = (message) => alerts.push(`Campaign ${campaignConfig.campaignId}: ${message}`);
  const bidding = campaign.bidding();
  const cpcCeiling = bidding.getCpcBidCeiling();
  const dailyBudget = campaign.getBudget().getAmount();

  if (dailyBudget !== campaignConfig.expectedDailyBudget) {
    alert(
      `Daily budget ${dailyBudget} differs from approved ${campaignConfig.expectedDailyBudget}`,
    );
  }

  if (cpcCeiling === null) {
    alert('CPC ceiling is missing');
    campaign.pause();
    paused = true;
  } else if (cpcCeiling > campaignConfig.maximumCpcCeiling) {
    alert(
      `CPC ceiling ${cpcCeiling} exceeds approved maximum ${campaignConfig.maximumCpcCeiling}`,
    );
    campaign.pause();
    paused = true;
  }

  const checkedUrls = {};
  const adIterator = campaign.ads().withCondition('ad_group_ad.status = ENABLED').get();
  while (adIterator.hasNext()) {
    const finalUrl = adIterator.next().urls().getFinalUrl();
    if (!finalUrl || checkedUrls[finalUrl]) continue;
    checkedUrls[finalUrl] = true;

    try {
      const response = UrlFetchApp.fetch(finalUrl, {
        followRedirects: true,
        muteHttpExceptions: true,
      });
      const status = response.getResponseCode();
      if (status === 200 && response.getContentText().indexOf(CONFIG.canonicalLineUrl) === -1) {
        alert(`Landing page ${finalUrl}: canonical LINE link is missing`);
        if (!paused) campaign.pause();
        paused = true;
      } else if (status !== 200) {
        alert(`Landing page ${finalUrl}: HTTP ${status}`);
      }
    } catch (error) {
      alert(`Landing page ${finalUrl}: fetch failed (${String(error)})`);
    }
  }

  const performance = readTodayPerformance(campaignConfig.campaignId);
  if (
    performance.cost >= CONFIG.spendAlertWithoutPrimaryConversion &&
    performance.primaryConversions === 0
  ) {
    alert(
      `Today cost ${performance.cost} reached the alert threshold; ` +
        `${CONFIG.primaryConversionActionName} conversions = 0`,
    );
  }

  const searchTermCandidates = readSearchTermCandidates(campaignConfig.campaignId);
  return {
    campaignId: campaignConfig.campaignId,
    campaignName: campaignConfig.campaignName,
    paused,
    alerts,
    performance,
    searchTermCandidates,
  };
}

function readTodayPerformance(campaignId) {
  let costMicros = 0;
  const costRows = AdsApp.search(
    `SELECT metrics.cost_micros FROM campaign ` +
      `WHERE campaign.id = ${campaignId} AND segments.date DURING TODAY`,
  );
  while (costRows.hasNext()) {
    costMicros += Number(costRows.next().metrics.costMicros || 0);
  }

  let primaryConversions = 0;
  let deepConversions = 0;
  const conversionRows = AdsApp.search(
    `SELECT segments.conversion_action_name, metrics.conversions, metrics.all_conversions ` +
      `FROM campaign ` +
      `WHERE campaign.id = ${campaignId} AND segments.date DURING TODAY`,
  );
  while (conversionRows.hasNext()) {
    const row = conversionRows.next();
    if (row.segments.conversionActionName === CONFIG.primaryConversionActionName) {
      primaryConversions += Number(row.metrics.conversions || 0);
    }
    if (row.segments.conversionActionName === CONFIG.deepConversionActionName) {
      deepConversions += Number(row.metrics.allConversions || 0);
    }
  }

  return { cost: costMicros / 1000000, primaryConversions, deepConversions };
}

function readSearchTermCandidates(campaignId) {
  const candidates = [];
  const rows = AdsApp.search(
    `SELECT search_term_view.search_term, metrics.cost_micros, metrics.clicks, metrics.conversions ` +
      `FROM search_term_view WHERE campaign.id = ${campaignId} ` +
      `AND segments.date DURING LAST_7_DAYS ORDER BY metrics.cost_micros DESC LIMIT 100`,
  );

  while (rows.hasNext()) {
    const row = rows.next();
    const cost = Number(row.metrics.costMicros || 0) / 1000000;
    const conversions = Number(row.metrics.conversions || 0);
    if (cost < CONFIG.searchTermReviewMinimumCost || conversions > 0) continue;

    candidates.push({
      searchTerm: row.searchTermView.searchTerm,
      cost,
      clicks: Number(row.metrics.clicks || 0),
      conversions,
    });
  }

  return candidates;
}

function publishResult(result, alertEmail = CONFIG.alertEmail) {
  Logger.log(JSON.stringify(result));

  if (result.paused && alertEmail) {
    const searchTermLines = result.searchTermCandidates.map(
      (item) =>
        `Search term review: ${item.searchTerm} | cost ${item.cost} | ` +
        `clicks ${item.clicks} | conversions ${item.conversions}`,
    );
    MailApp.sendEmail({
      to: alertEmail,
      subject: '[Siamrooftech Ads] Campaign paused',
      body: result.alerts.concat(searchTermLines).join('\n'),
    });
  }

  return result;
}

if (typeof module !== 'undefined') {
  module.exports = { CONFIG, main, publishResult };
}
