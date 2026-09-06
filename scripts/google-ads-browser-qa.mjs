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
// Development servers may need to compile a route on its first request.
const pageLoadTimeoutMs = Number(args.get('page-load-timeout') || 30000);
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

async function stopChrome(child) {
  if (child.exitCode !== null) return;

  child.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    wait(5000),
  ]);

  if (child.exitCode === null) {
    child.kill('SIGKILL');
  }
}

function waitForWebSocketUrl(child) {
  return new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => {
      reject(new Error(`Chrome did not expose DevTools URL. Output: ${output}`));
    }, 30000);

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
    clearTimeout(callback.timeout);
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

  socket.addEventListener('close', () => {
    for (const callback of pending.values()) {
      clearTimeout(callback.timeout);
      callback.reject(new Error('Chrome DevTools connection closed'));
    }
    pending.clear();
  });

  function send(method, params = {}, sessionId) {
    const messageId = (id += 1);
    const payload = { id: messageId, method, params };

    if (sessionId) {
      payload.sessionId = sessionId;
    }

    const response = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pending.delete(messageId);
        reject(new Error(`Timed out waiting for Chrome DevTools command: ${method}`));
      }, pageLoadTimeoutMs);
      pending.set(messageId, { resolve, reject, timeout });
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
    throw new Error(
      result.exceptionDetails.exception?.description ||
        result.exceptionDetails.text ||
        'Runtime evaluation failed',
    );
  }

  return result.result.value;
}

// Runs `fn(client, sessionId)` against a fresh, isolated Chrome profile (own
// cookies/localStorage) and always cleans up, even on failure.
async function withFreshBrowser(fn, attempt = 0) {
  const userDataDir = await mkdtemp(join(tmpdir(), 'siamrooftech-ads-browser-qa-'));
  const child = launchChrome(userDataDir);
  let client;
  let runError;

  try {
    const webSocketUrl = await waitForWebSocketUrl(child);
    client = createCdpClient(webSocketUrl);
    await client.ready;

    const { targetId } = await client.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await client.send('Target.attachToTarget', {
      targetId,
      flatten: true,
    });

    await client.send('Runtime.enable', {}, sessionId);
    await client.send('Page.enable', {}, sessionId);

    await fn(client, sessionId);
  } catch (error) {
    runError = error;

  } finally {
    client?.close();
    await stopChrome(child);
    await rm(userDataDir, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
  }

  if (runError && attempt < 1 && /Chrome DevTools|Page\.navigate|Runtime\.evaluate/.test(runError.message)) {
    return withFreshBrowser(fn, attempt + 1);
  }
  if (runError) throw runError;
}

async function navigateTo(client, sessionId, path) {
  const targetUrl = new URL(path, baseUrl).toString();
  let navigationError;
  try {
    await client.send('Page.navigate', { url: targetUrl }, sessionId);
  } catch (error) {
    // Chrome can occasionally omit the Page.navigate acknowledgement even
    // though the target committed. Verify the actual document before failing.
    navigationError = error;
  }

  try {
    await waitFor(
      () => evaluate(
        client,
        sessionId,
        `location.href === ${JSON.stringify(targetUrl)} && document.readyState === "complete"`,
      ),
      pageLoadTimeoutMs,
      `page load for ${path}`,
    );
  } catch (error) {
    if (navigationError) {
      throw new Error(`${navigationError.message}; ${error.message}`);
    }
    throw error;
  }
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

function clickLineLink(client, sessionId, selector = 'a[href*="lin.ee"], a[href*="line.me"]') {
  return evaluate(
    client,
    sessionId,
    `(() => {
      const link = document.querySelector(${JSON.stringify(selector)});
      if (!link) throw new Error('No LINE link found on page');
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      return true;
    })()`,
  );
}

function clickPhoneLink(client, sessionId) {
  return evaluate(
    client,
    sessionId,
    `(() => {
      const link = document.querySelector('a[href^="tel:"]');
      if (!link) throw new Error('No phone link found on page');
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      return true;
    })()`,
  );
}

// --- Scenario 1: paid session (gclid) -- the full positive flow --------------

// The nav carries no CTA of its own anymore (see src/app/components/ui/Navigation.tsx),
// so the default conversion point is the landing page's final CTA. Other
// positions reuse the same LineContactButton tracking and lead-intake seam.
async function scenarioPaidSession(position = 'electric_awning_ads_final') {
  await withFreshBrowser(async (client, sessionId) => {
    const gclid = `qa-browser-${Date.now()}`;
    await navigateTo(client, sessionId, `/lp/google-ads/electric-awning?gclid=${gclid}&utm_source=google&utm_medium=cpc&utm_campaign=qa_monochrome`);
    try {
      await waitFor(
        () => evaluate(
          client,
          sessionId,
          `!!document.querySelector('[data-landing-page="google-ads-electric-awning"]')`,
        ),
        pageLoadTimeoutMs,
        'Google Ads landing-page root',
      );
    } catch (error) {
      const pageState = await evaluate(client, sessionId, `({
        href: location.href,
        title: document.title,
        body: document.body?.innerText.slice(0, 500) || '',
      })`);
      throw new Error(`${error.message}: ${JSON.stringify(pageState)}`);
    }

    const funnelOrder = await evaluate(client, sessionId, `Array.from(
      document.querySelectorAll('[data-funnel-section]')
    ).map((element) => element.dataset.funnelSection)`);
    const expectedFunnelOrder = [
      'hero',
      'trust',
      'testimonials',
      'portfolio',
      'risks',
      'installation_quality',
      'backup_system',
      'why_us',
      'site_assessment',
      'process',
      'final',
    ];
    if (JSON.stringify(funnelOrder) !== JSON.stringify(expectedFunnelOrder)) {
      fail(`Landing funnel order mismatch: ${JSON.stringify(funnelOrder)}`);
    }

    const retiredWhyUsCtas = await evaluate(client, sessionId, `document.querySelectorAll(
      '[data-analytics-position^="why_us_mobile_"]'
    ).length`);
    if (retiredWhyUsCtas !== 0) {
      fail(`Landing page must not render legacy WhyUs mobile CTAs; got ${retiredWhyUsCtas}`);
    }

    if (position === 'electric_awning_ads_sticky_mobile') {
      for (const width of [430, 390, 320]) {
        await client.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
        await evaluate(client, sessionId, 'scrollTo(0, 0)');
        await wait(100);
        const mobileTopState = await evaluate(client, sessionId, `(() => {
          const visible = (element) => {
            if (!element) return false;
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight &&
              style.display !== 'none' && style.visibility !== 'hidden';
          };
          const mobileBar = document.querySelector('[data-analytics-position="electric_awning_ads_sticky_mobile"]');
          const mobileRect = mobileBar?.getBoundingClientRect();
          return {
            heroVisible: visible(document.querySelector('[data-analytics-position="electric_awning_ads_hero"]')),
            mobileVisible: visible(mobileBar),
            visibleLineCtas: Array.from(document.querySelectorAll('[data-analytics-type="line"]')).filter(visible).length,
            overflow: document.documentElement.scrollWidth > innerWidth,
            mobileSafelyInside: !visible(mobileBar) || (mobileRect.left >= 20 && mobileRect.right <= document.documentElement.clientWidth - 20 && mobileRect.bottom <= innerHeight - 20),
          };
        })()`);
        if (mobileTopState.overflow || !mobileTopState.mobileVisible || mobileTopState.heroVisible ||
            mobileTopState.visibleLineCtas !== 1 || !mobileTopState.mobileSafelyInside) {
          fail(`Mobile must show only the sticky LINE CTA at the top at ${width}px: ${JSON.stringify(mobileTopState)}`);
        }

        await evaluate(client, sessionId, `document.querySelector('[data-funnel-section="final"]').scrollIntoView({ block: 'center' })`);
        await wait(100);
        const mobileFinalState = await evaluate(client, sessionId, `(() => {
          const visible = (element) => {
            if (!element) return false;
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight &&
              style.display !== 'none' && style.visibility !== 'hidden';
          };
          return {
            stickyVisible: visible(document.querySelector('[data-analytics-position="electric_awning_ads_sticky_mobile"]')),
            finalVisible: visible(document.querySelector('[data-analytics-position="electric_awning_ads_final"]')),
            visibleLineCtas: Array.from(document.querySelectorAll('[data-analytics-type="line"]')).filter(visible).length,
          };
        })()`);
        if (mobileFinalState.stickyVisible || !mobileFinalState.finalVisible || mobileFinalState.visibleLineCtas !== 1) {
          fail(`Mobile final section must replace the sticky LINE CTA at ${width}px: ${JSON.stringify(mobileFinalState)}`);
        }
      }

      for (const width of [768, 1024, 1440]) {
        await client.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
        const desktopStates = [];
        for (const target of ['top', 'after-hero', 'site-assessment', 'final']) {
          await evaluate(client, sessionId, `(() => {
            const hero = document.querySelector('[data-floating-cta-start]');
            if (${JSON.stringify(target)} === 'top') scrollTo(0, 0);
            if (${JSON.stringify(target)} === 'after-hero') scrollTo(0, hero.getBoundingClientRect().bottom + scrollY + 1);
            if (${JSON.stringify(target)} === 'site-assessment') document.querySelector('[data-floating-cta-blocker]').scrollIntoView({ block: 'center' });
            if (${JSON.stringify(target)} === 'final') document.querySelector('[data-funnel-section="final"]').scrollIntoView({ block: 'center' });
          })()`);
          await wait(100);
          desktopStates.push(await evaluate(client, sessionId, `(() => {
            const visible = (element) => {
              if (!element) return false;
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight &&
                style.display !== 'none' && style.visibility !== 'hidden';
            };
            const floating = document.querySelector('[data-analytics-position="electric_awning_ads_sticky_desktop"]');
            const rect = floating?.getBoundingClientRect();
            return {
              target: ${JSON.stringify(target)},
              floatingVisible: visible(floating),
              visibleLineCtas: Array.from(document.querySelectorAll('[data-analytics-type="line"]')).filter(visible).length,
              safelyInside: !visible(floating) || (rect.right <= innerWidth - 32 && rect.bottom <= innerHeight - 32),
            };
          })()`));
        }
        const expectedFloating = [false, true, false, false];
        if (desktopStates.some((state, index) => state.floatingVisible !== expectedFloating[index] ||
            state.visibleLineCtas !== 1 || !state.safelyInside)) {
          fail(`Desktop must expose one context-appropriate LINE CTA at ${width}px: ${JSON.stringify(desktopStates)}`);
        }
      }

      await client.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false }, sessionId);
      await evaluate(client, sessionId, `document.querySelector('[data-funnel-section="portfolio"]').scrollIntoView({ block: 'center' })`);
      await wait(100);
    }

    const appearance = await evaluate(client, sessionId, `(() => {
      const main = document.querySelector('[data-landing-page="google-ads-electric-awning"]');
      const hero = main.querySelector('section');
      const cta = document.querySelector('[data-analytics-type="line"][data-analytics-position="${position}"]');
      // [data-legacy-ui] wraps sections reused verbatim from the homepage
      // (DamageWarningSection, WhyUs2, HowItWorks, FinalCTASection, EndSection).
      // They intentionally keep their original rounded/shadowed look instead of
      // this page's flat ad design system, so the appearance contract below
      // only governs the page's own ad-native sections.
      const isLegacyUi = (el) => !!el.closest('[data-legacy-ui]');
      const surfaces = Array.from(main.querySelectorAll('section, article, figure, a, summary, img'))
        .filter((el) => !isLegacyUi(el));
      return {
        heroBackground: getComputedStyle(hero).backgroundColor,
        ctaBackground: getComputedStyle(cta).backgroundColor,
        ctaRadius: parseFloat(getComputedStyle(cta).borderTopLeftRadius),
        incorrectLineLabels: Array.from(document.querySelectorAll('[data-analytics-type="line"]'))
          .filter(el => el.textContent.trim() !== 'สอบถาม-ประเมินราคาฟรี').length,
        excessiveCorners: surfaces.filter(el => parseFloat(getComputedStyle(el).borderTopLeftRadius) > 4).length,
        shadows: surfaces.filter(el => getComputedStyle(el).boxShadow !== 'none').length,
        approvedNativeCtas: Array.from(main.querySelectorAll('section [data-analytics-type="line"]'))
          .filter((el) => !isLegacyUi(el) && ['electric_awning_ads_hero', 'electric_awning_ads_site_assessment', 'electric_awning_ads_final'].includes(el.dataset.analyticsPosition)).length,
        unapprovedSectionCtas: Array.from(main.querySelectorAll('section [data-analytics-type]'))
          .filter((el) => !isLegacyUi(el) && !['electric_awning_ads_hero', 'electric_awning_ads_site_assessment', 'electric_awning_ads_final'].includes(el.dataset.analyticsPosition)).length,
      };
    })()`);
    if (appearance.heroBackground !== 'rgb(255, 255, 255)' ||
        appearance.ctaBackground !== 'rgb(1, 178, 2)' ||
        appearance.approvedNativeCtas !== 3 || appearance.unapprovedSectionCtas || appearance.incorrectLineLabels || appearance.ctaRadius > 4 || appearance.excessiveCorners || appearance.shadows) {
      fail(`Ads appearance: expected white hero, green LINE CTA with approved label, low radii and no decorative shadows; got ${JSON.stringify(appearance)}`);
    }

    if (!(await hasCookie(client, sessionId, 'srt_paid'))) {
      fail('Paid session: srt_paid cookie was not set after visiting a URL with gclid');
      return;
    }

    // Intercept window.open instead of letting a real tab open, so we can
    // assert on the URL LINE would actually receive.
    const gtmEnabled = await evaluate(
      client,
      sessionId,
      `Array.from(document.scripts).some((script) => script.src.includes('googletagmanager.com'))`,
    );

    await evaluate(
      client,
      sessionId,
      `window.__openedUrls = []; window.open = (url) => { window.__openedUrls.push(url); return null; };`,
    );

    // Capture the browser transport as well as the dataLayer. A correctly
    // shaped dataLayer event is not sufficient if the live GTM container is
    // missing its matching GA4 event tag.
    await evaluate(
      client,
      sessionId,
      `(() => {
        window.__analyticsDispatches = [];
        const capture = (url, body) => {
          const text = typeof body === 'string' ? body : body ? String(body) : '';
          if (String(url).includes('google-analytics.com') || String(url).includes('/g/collect')) {
            window.__analyticsDispatches.push({ url: String(url), body: text });
          }
        };
        const originalFetch = window.fetch.bind(window);
        window.fetch = (input, init) => {
          capture(typeof input === 'string' ? input : input?.url, init?.body);
          return originalFetch(input, init);
        };
        const originalBeacon = navigator.sendBeacon.bind(navigator);
        navigator.sendBeacon = (url, data) => {
          capture(url, data);
          return originalBeacon(url, data);
        };
      })()`,
    );

    await clickPhoneLink(client, sessionId);
    let events = await dataLayerEventNames(client, sessionId);
    if (!events.includes('phone_click')) {
      fail(`Paid session: expected phone_click in dataLayer, got: ${events.join(', ')}`);
    }

    const ctaExists = await evaluate(
      client,
      sessionId,
      `!!document.querySelector('[data-analytics-type="line"][data-analytics-position="${position}"]')`,
    );
    if (!ctaExists) {
      fail(`Paid session: ${position} LINE CTA is missing`);
      return;
    }

    await clickLineLink(
      client,
      sessionId,
      `[data-analytics-type="line"][data-analytics-position="${position}"]`,
    );
    await wait(300);

    if (!(await dialogVisible(client, sessionId))) {
      fail('Paid session: clicking a LINE link did not open the survey modal');
      return;
    }

    const surveyAppearance = await evaluate(client, sessionId, `(() => {
      const panel = document.querySelector('[role="dialog"] > div');
      const button = panel.querySelector('button');
      return {
        panelRadius: parseFloat(getComputedStyle(panel).borderTopLeftRadius),
        buttonRadius: parseFloat(getComputedStyle(button).borderTopLeftRadius),
        shadow: getComputedStyle(panel).boxShadow,
      };
    })()`);
    if (surveyAppearance.panelRadius !== 0 || surveyAppearance.buttonRadius > 4 || surveyAppearance.shadow !== 'none') {
      fail(`Ads survey: expected square panel, low-radius buttons and no decorative shadow; got ${JSON.stringify(surveyAppearance)}`);
    }

    const firstOptionFocused = await evaluate(client, sessionId,
      `document.activeElement === document.querySelector('[role="dialog"] button')`);
    if (!firstOptionFocused) fail('Ads survey: opening should focus the first persona option');
    // Exercise the public keyboard handler deterministically in headless Chrome.
    // Native Shift+Tab is also verified in the interactive browser QA pass.
    await evaluate(client, sessionId, `document.activeElement.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Tab', shiftKey: true, bubbles: true, cancelable: true,
    }))`);
    const focusWrapped = await waitFor(() => evaluate(client, sessionId, `(() => {
      const options = document.querySelectorAll('[role="dialog"] button');
      return document.activeElement === options[options.length - 1];
    })()`), 3000, 'survey keyboard focus wrap');
    if (!focusWrapped) {
      const active = await evaluate(client, sessionId, `document.activeElement?.outerHTML`);
      fail(`Ads survey: Shift+Tab should keep focus inside the dialog; active element: ${active}`);
    }

    events = await dataLayerEventNames(client, sessionId);
    if (!events.includes('line_click')) {
      fail(`Paid session: expected line_click in dataLayer, got: ${events.join(', ')}`);
    }

    if (position === 'electric_awning_ads_sticky_mobile') {
      const lineClickEvent = await evaluate(
        client,
        sessionId,
        `(window.dataLayer || []).find((event) => event.event === 'line_click' && event.position === ${JSON.stringify(position)})`,
      );
      if (lineClickEvent?.active_section !== 'portfolio' ||
          typeof lineClickEvent?.scroll_depth_percent !== 'number' ||
          lineClickEvent.scroll_depth_percent <= 0 || lineClickEvent.scroll_depth_percent >= 100) {
        fail(`Sticky LINE click must include funnel context: ${JSON.stringify(lineClickEvent)}`);
      }
    }
    if (!events.includes('line_survey_start')) {
      fail(`Paid session: expected line_survey_start in dataLayer, got: ${events.join(', ')}`);
    }

    const startEvent = await evaluate(
      client,
      sessionId,
      `(window.dataLayer || []).find((e) => e.event === 'line_survey_start')`,
    );
    if (startEvent?.position !== position) {
      fail(`Paid session: LINE survey position mismatch; got: ${startEvent?.position}`);
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
    if (completeEvent?.attribution_latest_utm_source !== 'google' ||
        completeEvent?.attribution_latest_utm_medium !== 'cpc' ||
        completeEvent?.attribution_latest_utm_campaign !== 'qa_monochrome') {
      fail('Paid session: survey completion must preserve UTM attribution');
    }
    if (completeEvent && completeEvent.position !== position) {
      fail(`Paid session: line_survey_complete position mismatch; got: ${completeEvent.position}`);
    }

    // Keep the page alive briefly so GTM can dispatch queued analytics hits
    // before the isolated browser profile is torn down.
    await wait(2000);

    if (gtmEnabled) {
      const analyticsDispatches = await evaluate(client, sessionId, 'window.__analyticsDispatches || []');
      for (const eventName of ['phone_click', 'line_survey_complete']) {
        if (!analyticsDispatches.some((dispatch) =>
          `${dispatch.url}\n${dispatch.body}`.includes(eventName))) {
          fail(`Paid session: GTM/GA4 did not dispatch ${eventName}; got: ${JSON.stringify(analyticsDispatches)}`);
        }
      }
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

// The monochrome survey is exclusive to this landing page.
async function scenarioHomepageSurveyAppearance() {
  await withFreshBrowser(async (client, sessionId) => {
    await navigateTo(client, sessionId, '/?gclid=qa-home-survey');
    const lineButtons = await evaluate(client, sessionId, `Array.from(document.querySelectorAll('a[href*="lin.ee"]')).map(el => ({
      label: el.textContent.trim(),
      radius: parseFloat(getComputedStyle(el).borderTopLeftRadius),
      background: getComputedStyle(el).backgroundColor,
      nestedButton: !!el.querySelector('button'),
    }))`);
    if (!lineButtons.length || lineButtons.some(button => button.label !== 'สอบถาม-ประเมินราคาฟรี' ||
      button.radius > 4 || button.background !== 'rgb(1, 178, 2)' || button.nestedButton)) {
      fail(`Homepage LINE buttons should share green low-radius styling and the approved label: ${JSON.stringify(lineButtons)}`);
    }
    await clickLineLink(client, sessionId);
    await waitFor(() => dialogVisible(client, sessionId), 3000, 'homepage survey');
    const radius = await evaluate(client, sessionId,
      `parseFloat(getComputedStyle(document.querySelector('[role="dialog"] > div')).borderTopLeftRadius)`);
    if (radius <= 4) fail('Homepage survey: original rounded appearance must be preserved');
    const clicks = await evaluate(client, sessionId,
      `(window.dataLayer || []).filter(e => e.event === 'line_click')`);
    // The nav no longer carries its own LINE CTA, so the first `a[href*="lin.ee"]`
    // in DOM order is WhyUs2's first mobile-card button (its desktop cards
    // dropped their CTAs; see src/app/components/section/WhyUs2.tsx).
    if (clicks.length !== 1 || clicks[0].position !== 'why_us_mobile_safety') {
      fail(`Homepage must track one LINE click with its existing position: ${JSON.stringify(clicks.map(e => e.position))}`);
    }
  });
}

try {
  await scenarioPaidSession();
  await scenarioPaidSession('electric_awning_ads_sticky_mobile');
  if (!args.has('landing-only')) {
    await scenarioOrganicSession();
    await scenarioUtmOnlySession();
    await scenarioHomepageSurveyAppearance();
  }
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
