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

// Runs `fn(client, sessionId)` against a fresh, isolated Chrome profile (own
// cookies/localStorage) and always cleans up, even on failure.
async function withFreshBrowser(fn) {
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

    await fn(client, sessionId);

    client.close();
  } finally {
    child.kill('SIGTERM');
    await rm(userDataDir, { recursive: true, force: true });
  }
}

async function navigateTo(client, sessionId, path) {
  await client.send('Page.navigate', { url: new URL(path, baseUrl).toString() }, sessionId);
  await waitFor(
    () => evaluate(client, sessionId, 'document.readyState === "complete"'),
    15000,
    `page load for ${path}`,
  );
  // Let client-side hydration (middleware cookie is already set by the
  // response; the click listeners are attached by AttributionCapture on
  // mount) settle before interacting.
  await wait(500);
}

function hasCookie(client, sessionId, name) {
  return evaluate(
    client,
    sessionId,
    `document.cookie.split('; ').some((c) => c === '${name}=1')`,
  );
}

function dialogVisible(client, sessionId) {
  return evaluate(client, sessionId, `!!document.querySelector('[role="dialog"]')`);
}

function dataLayerEventNames(client, sessionId) {
  return evaluate(
    client,
    sessionId,
    `(window.dataLayer || []).map((e) => e.event).filter(Boolean)`,
  );
}

function clickLineLink(client, sessionId) {
  return evaluate(
    client,
    sessionId,
    `(() => {
      const link = document.querySelector('a[href*="lin.ee"], a[href*="line.me"]');
      if (!link) throw new Error('No LINE link found on page');
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      return true;
    })()`,
  );
}

// --- Scenario 1: paid session (gclid) -- the full positive flow --------------

async function scenarioPaidSession() {
  await withFreshBrowser(async (client, sessionId) => {
    const gclid = `qa-browser-${Date.now()}`;
    await navigateTo(client, sessionId, `/?gclid=${gclid}`);

    if (!(await hasCookie(client, sessionId, 'srt_paid'))) {
      fail('Paid session: srt_paid cookie was not set after visiting a URL with gclid');
      return;
    }

    // Intercept window.open instead of letting a real tab open, so we can
    // assert on the URL LINE would actually receive.
    await evaluate(
      client,
      sessionId,
      `window.__openedUrls = []; window.open = (url) => { window.__openedUrls.push(url); return null; };`,
    );

    await clickLineLink(client, sessionId);
    await wait(300);

    if (!(await dialogVisible(client, sessionId))) {
      fail('Paid session: clicking a LINE link did not open the survey modal');
      return;
    }

    let events = await dataLayerEventNames(client, sessionId);
    if (!events.includes('line_survey_start')) {
      fail(`Paid session: expected line_survey_start in dataLayer, got: ${events.join(', ')}`);
    }

    const answered = await evaluate(
      client,
      sessionId,
      `(() => {
        const button = document.querySelector('[role="dialog"] button');
        if (!button) return false;
        button.click();
        return true;
      })()`,
    );

    if (!answered) {
      fail('Paid session: no persona option button found in the survey modal');
      return;
    }

    await wait(300);

    const openedUrls = await evaluate(client, sessionId, 'window.__openedUrls');
    if (!openedUrls.some((url) => /lin\.ee|line\.me/.test(url))) {
      fail(`Paid session: answering the survey did not call window.open with a LINE url; got: ${JSON.stringify(openedUrls)}`);
    }

    events = await dataLayerEventNames(client, sessionId);
    if (!events.includes('line_survey_complete')) {
      fail(`Paid session: expected line_survey_complete in dataLayer, got: ${events.join(', ')}`);
    }

    const completeEvent = await evaluate(
      client,
      sessionId,
      `(window.dataLayer || []).find((e) => e.event === 'line_survey_complete')`,
    );

    if (!completeEvent || !['homeowner', 'procurement', 'contractor'].includes(completeEvent.lead_persona)) {
      fail(`Paid session: line_survey_complete missing a valid lead_persona; got: ${completeEvent?.lead_persona}`);
    }
    if (completeEvent && ![0, 1].includes(completeEvent.value)) {
      fail(`Paid session: line_survey_complete has an unexpected value; got: ${completeEvent?.value}`);
    }
    if (completeEvent && completeEvent.attribution_latest_gclid !== gclid) {
      fail(`Paid session: line_survey_complete missing attribution_latest_gclid=${gclid}; got: ${completeEvent?.attribution_latest_gclid}`);
    }

    // Answered once this session -- clicking LINE again must not re-open the
    // modal. The gate no longer intercepts the click at all once a persona is
    // stored, so this becomes a normal anchor navigation (target="_blank"),
    // not a window.open() call -- there is nothing to capture here beyond
    // "no modal appears a second time".
    await clickLineLink(client, sessionId);
    await wait(300);

    if (await dialogVisible(client, sessionId)) {
      fail('Paid session: survey modal re-opened on a second LINE click after already answering this session');
    }
  });
}

// --- Scenario 2: organic session (no params) -- must never see the gate ------

async function scenarioOrganicSession() {
  await withFreshBrowser(async (client, sessionId) => {
    await navigateTo(client, sessionId, '/');

    if (await hasCookie(client, sessionId, 'srt_paid')) {
      fail('Organic session: srt_paid cookie was set with no gclid/gbraid/wbraid in the URL');
    }

    await clickLineLink(client, sessionId);
    await wait(300);

    if (await dialogVisible(client, sessionId)) {
      fail('Organic session: survey modal appeared for a visitor with no ad click ID');
    }
  });
}

// --- Scenario 3: UTM-only session (no gclid) -- must never see the gate ------
// The gate must key on gclid/gbraid/wbraid only. utm_* is copyable into any
// shared link, so gating on it would show the survey to organic visitors too.

async function scenarioUtmOnlySession() {
  await withFreshBrowser(async (client, sessionId) => {
    await navigateTo(client, sessionId, '/?utm_source=google_paid&utm_medium=paid&utm_campaign=qa_browser');

    if (await hasCookie(client, sessionId, 'srt_paid')) {
      fail('UTM-only session: srt_paid cookie was set from utm_* params alone (no gclid)');
    }

    await clickLineLink(client, sessionId);
    await wait(300);

    if (await dialogVisible(client, sessionId)) {
      fail('UTM-only session: survey modal appeared with only utm_* params, no gclid');
    }
  });
}

try {
  await scenarioPaidSession();
  await scenarioOrganicSession();
  await scenarioUtmOnlySession();
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
