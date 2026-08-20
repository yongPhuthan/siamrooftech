#!/usr/bin/env node

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.split('=');
    return [key.replace(/^--/, ''), value || true];
  }),
);

const baseUrl = String(
  args.get('base') || process.env.ADS_BROWSER_QA_BASE_URL || 'http://localhost:3000',
);
const chromePath = String(
  args.get('chrome') ||
    process.env.CHROME_PATH ||
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
);
const adsPath =
  '/services/retractable-awning?ad_kw=retractable_awning&ad_audience=home&ad_area=bangkok&ad_intent=quote&utm_source=google_paid&utm_medium=paid&utm_campaign=TH_Search_NonBrand_Core&utm_term=test_keyword&utm_content=test_ad&srt_platform=google&srt_campaignid=111&srt_adgroupid=222&srt_adid=333&srt_keyword=test_keyword&srt_matchtype=e&srt_device=c&srt_network=g&srt_location=1012728';

const failures = [];

function fail(message) {
  failures.push(message);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(predicate, timeoutMs, label) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const value = await predicate();
    if (value) return value;
    await wait(100);
  }

  throw new Error(`Timed out waiting for ${label}`);
}

function launchChrome(userDataDir) {
  const child = spawn(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-sync',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-debugging-port=0',
      `--user-data-dir=${userDataDir}`,
      'about:blank',
    ],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  return child;
}

function waitForWebSocketUrl(child) {
  return new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => {
      reject(new Error(`Chrome did not expose DevTools URL. Output: ${output}`));
    }, 10000);

    const handleData = (data) => {
      output += data.toString();
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);

      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    };

    child.stdout.on('data', handleData);
    child.stderr.on('data', handleData);
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('exit', (code) => {
      if (code !== null && code !== 0) {
        clearTimeout(timeout);
        reject(new Error(`Chrome exited before QA could start. Code: ${code}. Output: ${output}`));
      }
    });
  });
}

function createCdpClient(webSocketUrl) {
  let id = 0;
  const pending = new Map();
  const socket = new WebSocket(webSocketUrl);

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (!message.id) return;

    const callback = pending.get(message.id);
    if (!callback) return;

    pending.delete(message.id);
    if (message.error) {
      callback.reject(new Error(`${message.error.message || 'CDP error'} (${message.method || message.id})`));
      return;
    }

    callback.resolve(message.result);
  });

  const ready = new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  function send(method, params = {}, sessionId) {
    const messageId = (id += 1);
    const payload = { id: messageId, method, params };

    if (sessionId) {
      payload.sessionId = sessionId;
    }

    const response = new Promise((resolve, reject) => {
      pending.set(messageId, { resolve, reject });
    });

    socket.send(JSON.stringify(payload));
    return response;
  }

  return {
    ready,
    send,
    close: () => socket.close(),
  };
}

async function evaluate(client, sessionId, expression) {
  const result = await client.send(
    'Runtime.evaluate',
    {
      expression,
      awaitPromise: true,
      returnByValue: true,
    },
    sessionId,
  );

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
  }

  return result.result.value;
}

async function run() {
  const userDataDir = await mkdtemp(join(tmpdir(), 'siamrooftech-ads-browser-qa-'));
  const child = launchChrome(userDataDir);

  try {
    const webSocketUrl = await waitForWebSocketUrl(child);
    const client = createCdpClient(webSocketUrl);
    await client.ready;

    const { targetId } = await client.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await client.send('Target.attachToTarget', {
      targetId,
      flatten: true,
    });

    await client.send('Runtime.enable', {}, sessionId);
    await client.send('Page.enable', {}, sessionId);
    await client.send(
      'Page.navigate',
      {
        url: new URL(adsPath, baseUrl).toString(),
      },
      sessionId,
    );

    await waitFor(
      () => evaluate(client, sessionId, 'document.readyState === "complete"'),
      15000,
      'page load',
    );

    await waitFor(
      () =>
        evaluate(
          client,
          sessionId,
          `(() => {
            const raw = window.localStorage.getItem('siamrooftech_attribution_v1');
            if (!raw) return false;
            const attribution = JSON.parse(raw);
            return attribution.latest_utm_campaign === 'TH_Search_NonBrand_Core'
              && attribution.latest_srt_campaignid === '111'
              && attribution.latest_ad_kw === 'retractable_awning'
              && attribution.latest_ad_audience === 'home'
              && attribution.latest_ad_area === 'bangkok'
              && attribution.latest_ad_intent === 'quote';
          })()`,
        ),
      10000,
      'attribution localStorage capture',
    );

    const events = await evaluate(
      client,
      sessionId,
      `(() => {
        const click = (selector) => {
          const link = document.querySelector(selector);
          if (!link) throw new Error('Missing link: ' + selector);
          link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        };

        click('a[data-analytics-type="line"][data-analytics-position$="_hero"]');
        click('a[data-analytics-type="phone"][data-analytics-position$="_hero"]');
        click('a[data-analytics-type="line"][data-analytics-position$="_calculator_mock"]');
        click('a[data-analytics-type="phone"][data-analytics-position$="_calculator_mock"]');

        return (window.dataLayer || [])
          .filter((entry) => ['line_click', 'phone_click'].includes(String(entry.event)))
          .map((entry) => ({
            event: entry.event,
            position: entry.position,
            conversion_priority: entry.conversion_priority,
            phone_number: entry.phone_number,
            page_path: entry.page_path,
            attribution_latest_utm_campaign: entry.attribution_latest_utm_campaign,
            attribution_latest_srt_campaignid: entry.attribution_latest_srt_campaignid,
            attribution_latest_srt_adgroupid: entry.attribution_latest_srt_adgroupid,
            attribution_latest_srt_keyword: entry.attribution_latest_srt_keyword,
            attribution_latest_ad_kw: entry.attribution_latest_ad_kw,
            attribution_latest_ad_audience: entry.attribution_latest_ad_audience,
            attribution_latest_ad_area: entry.attribution_latest_ad_area,
            attribution_latest_ad_intent: entry.attribution_latest_ad_intent,
          }));
      })()`,
    );

    const lineEvent = events.find((entry) => entry.event === 'line_click');
    const phoneEvent = events.find((entry) => entry.event === 'phone_click');
    const lineMockEvent = events.find(
      (entry) => entry.event === 'line_click' && String(entry.position).endsWith('_calculator_mock'),
    );
    const phoneMockEvent = events.find(
      (entry) => entry.event === 'phone_click' && String(entry.position).endsWith('_calculator_mock'),
    );

    const expected = {
      conversion_priority: 'primary',
      attribution_latest_utm_campaign: 'TH_Search_NonBrand_Core',
      attribution_latest_srt_campaignid: '111',
      attribution_latest_srt_adgroupid: '222',
      attribution_latest_srt_keyword: 'test_keyword',
      attribution_latest_ad_kw: 'retractable_awning',
      attribution_latest_ad_audience: 'home',
      attribution_latest_ad_area: 'bangkok',
      attribution_latest_ad_intent: 'quote',
    };

    for (const [key, value] of Object.entries(expected)) {
      if (lineEvent?.[key] !== value) {
        fail(`line_click missing ${key}=${value}; got ${lineEvent?.[key] || 'NONE'}`);
      }

      if (phoneEvent?.[key] !== value) {
        fail(`phone_click missing ${key}=${value}; got ${phoneEvent?.[key] || 'NONE'}`);
      }
    }

    if (phoneEvent?.phone_number !== '0984542455') {
      fail(`phone_click phone_number mismatch; got ${phoneEvent?.phone_number || 'NONE'}`);
    }

    if (!lineMockEvent) {
      fail('Missing calculator mock line_click event');
    }

    if (!phoneMockEvent) {
      fail('Missing calculator mock phone_click event');
    }

    client.close();
  } finally {
    child.kill('SIGTERM');
    await rm(userDataDir, { recursive: true, force: true });
  }
}

try {
  await run();
} catch (error) {
  fail(error.message);
}

if (failures.length > 0) {
  console.error('Google Ads browser QA failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Google Ads browser QA passed at ${baseUrl}`);
