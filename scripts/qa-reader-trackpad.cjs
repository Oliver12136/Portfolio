const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.PORTFOLIO_BASE_URL || 'http://127.0.0.1:4173';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disk-cache-size=1', '--media-cache-size=1'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/#map-project=loom-drift', { waitUntil: 'domcontentloaded' });
    const reader = page.locator('.portfolio-reader'), stage = reader.locator('.portfolio-reader-stage');
    await reader.scrollIntoViewIfNeeded(); await stage.focus();
    await page.waitForFunction(() => [...document.querySelectorAll('.portfolio-reader img')].every(img => img.complete && img.naturalWidth));
    const spacing = await reader.evaluate(element => {
      const article = getComputedStyle(element.closest('.map-project-inline-content'));
      const project = getComputedStyle(element.closest('#map-project-template-root'));
      return { minHeight: article.minHeight, articlePadding: article.paddingBottom, projectPadding: project.paddingBottom };
    });
    assert.deepEqual(spacing, { minHeight: '0px', articlePadding: '0px', projectPadding: '24px' }, 'Extra fixed-height floor or stacked bottom padding remains');
    await page.evaluate(() => {
      window.readerWheelLeaks = 0;
      for (const name of ['wheel', 'gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(name, () => window.readerWheelLeaks++);
    });
    const client = await page.context().newCDPSession(page);
    async function wheel(dx, dy, ctrl = false) {
      const box = await stage.boundingBox();
      const dpr = await page.evaluate(() => devicePixelRatio);
      await client.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: box.x + box.width/2, y: box.y + box.height/2, deltaX: dx*dpr, deltaY: dy*dpr, modifiers: ctrl ? 2 : 0 });
      await page.waitForTimeout(35);
    }
    async function outer() {
      return page.evaluate(() => ({ scroll: document.querySelector('#map-project-inline-scroll').scrollTop, windowY: scrollY,
        hash: location.hash, viewportScale: visualViewport.scale, dpr: devicePixelRatio, width: innerWidth }));
    }
    await page.setViewportSize({ width: 1080, height: 650 });
    await reader.scrollIntoViewIfNeeded();
    await page.locator('#map-project-inline-scroll').evaluate(element => element.scrollTop = 50);
    await page.waitForTimeout(150);
    const fitBefore = await outer();
    await wheel(0, 120); await page.waitForTimeout(150);
    const fitAfter = await outer();
    assert(fitAfter.scroll > fitBefore.scroll, 'Fitted reader blocked normal detail-page scrolling');
    assert.deepEqual({ ...fitAfter, scroll: fitBefore.scroll }, fitBefore, 'Fit scrolling changed browser zoom or project');
    await wheel(0, -80); await page.waitForTimeout(150);
    assert((await outer()).scroll < fitAfter.scroll, 'Fitted reader blocked upward scrolling');
    await wheel(400, 0);
    assert.equal((await outer()).hash, fitBefore.hash, 'Fit horizontal wheel changed projects');
    assert.equal(await reader.getAttribute('data-zoom'), '1.000');
    assert.equal(await reader.getAttribute('data-page'), '1');
    await page.setViewportSize({ width: 1440, height: 900 });
    await reader.scrollIntoViewIfNeeded(); await stage.focus();
    await page.waitForTimeout(150);
    const baseline = await outer();
    for (let i = 0; i < 3; i++) await wheel(0, -35, true);
    assert(Number(await reader.getAttribute('data-zoom')) > 2.8, 'Native ctrl+wheel pinch did not zoom the reader');
    assert.deepEqual(await outer(), baseline, 'Pinch zoomed the browser or scrolled the outer page');
    const before = await reader.locator('.portfolio-reader-page[aria-hidden="false"] img').boundingBox();
    await wheel(48, 32);
    const after = await reader.locator('.portfolio-reader-page[aria-hidden="false"] img').boundingBox();
    assert(Math.abs((before.x-after.x)-48) < 2 && Math.abs((before.y-after.y)-32) < 2, 'Two-axis trackpad pan did not move the image');
    await wheel(10000, 10000); await wheel(10000, 10000);
    assert.deepEqual(await outer(), baseline, 'Pan limits leaked wheel scrolling to the outer page');
    assert.equal(await reader.getAttribute('data-page'), '1', 'Trackpad pan accidentally turned a page');
    await reader.locator('[aria-label="Fit to screen"]').click();
    await page.waitForFunction(() => document.querySelector('.portfolio-reader').dataset.zoom === '1.000');

    // Safari GestureEvent path, including cumulative scale and duplicate-wheel suppression.
    const gestureResults = await stage.evaluate(element => {
      function gesture(name, scale) {
        const event = new Event(name, { bubbles: true, cancelable: true });
        Object.defineProperty(event, 'scale', { value: scale });
        element.dispatchEvent(event);
        return event.defaultPrevented;
      }
      return [gesture('gesturestart', 1), gesture('gesturechange', 1.8), gesture('gesturechange', 2.4)];
    });
    assert.deepEqual(gestureResults, [true, true, true]);
    await page.waitForFunction(() => document.querySelector('.portfolio-reader').dataset.zoom === '2.400');
    await wheel(0, -100, true);
    assert.equal(await reader.getAttribute('data-zoom'), '2.400', 'Safari pinch was applied twice');
    await stage.evaluate(element => element.dispatchEvent(new Event('gestureend', { bubbles: true, cancelable: true })));
    assert.equal(await page.evaluate(() => window.readerWheelLeaks), 0, 'Reader gestures escaped to document');
    await reader.locator('[aria-label="Fit to screen"]').click();
    await stage.focus();
    await reader.locator('[aria-label="Enter fullscreen"]').click();
    await page.waitForFunction(() => document.fullscreenElement === document.querySelector('.portfolio-reader'));
    const fullBaseline = await outer();
    await wheel(0, -50, true); await wheel(45, 30);
    assert(Number(await reader.getAttribute('data-zoom')) > 1.6);
    assert.deepEqual(await outer(), fullBaseline, 'Fullscreen trackpad gesture zoomed/scrolled the browser');
    await reader.locator('[aria-label="Fit to screen"]').click();
    await reader.locator('[aria-label="Exit fullscreen"]').click();
    await page.waitForFunction(() => !document.fullscreenElement);

    // Freeze actual rendered frames to inspect the center hinge and both directions.
    await page.evaluate(() => {
      window.nativeReaderRAF = requestAnimationFrame;
      window.requestAnimationFrame = callback => {
        if (callback.name === 'draw') { window.readerCurlFrame = callback; if (!window.readerCurlStart) window.readerCurlStart = performance.now(); return 0; }
        return window.nativeReaderRAF(callback);
      };
    });
    await reader.locator('[aria-label="Next page"]').click();
    const canvas = reader.locator('.portfolio-reader-turn-canvas');
    await canvas.waitFor();
    assert.equal(await canvas.getAttribute('data-hinge'), 'center');
    assert.equal(await canvas.getAttribute('data-direction'), 'right-to-left');
    const clips = await reader.locator('.portfolio-reader-page[aria-hidden="true"]:not([hidden])').evaluateAll(elements => elements.map(element => element.style.clipPath));
    assert.deepEqual(clips, ['inset(0px 50% 0px 0px)']);
    await page.evaluate(() => window.readerCurlFrame(window.readerCurlStart+350));
    await stage.screenshot({ path: '/tmp/reader-center-forward.png' });
    await page.evaluate(() => window.readerCurlFrame(window.readerCurlStart+1000));
    assert.equal(await reader.locator('.portfolio-reader-page:not([hidden])').count(), 1);
    await page.evaluate(() => { window.readerCurlStart = 0; });
    await reader.locator('[aria-label="Previous page"]').click();
    await canvas.waitFor();
    assert.equal(await canvas.getAttribute('data-direction'), 'left-to-right');
    await page.evaluate(() => window.readerCurlFrame(window.readerCurlStart+350));
    await stage.screenshot({ path: '/tmp/reader-center-backward.png' });
    await page.evaluate(() => { window.readerCurlFrame(window.readerCurlStart+1000); window.requestAnimationFrame = window.nativeReaderRAF; });

    // Outside the reader, normal detail-page scrolling is still available.
    await page.setViewportSize({ width: 1080, height: 650 });
    await page.locator('.map-project-template-lead').scrollIntoViewIfNeeded();
    await page.locator('.map-project-template-lead').hover();
    await page.locator('#map-project-inline-scroll').evaluate(element => element.scrollTop = 50);
    const outsideBefore = await page.locator('#map-project-inline-scroll').evaluate(element => element.scrollTop);
    await page.mouse.move(40, 130); await page.mouse.wheel(0, 150); await page.waitForTimeout(150);
    const outsideAfter = await page.locator('#map-project-inline-scroll').evaluate(element => element.scrollTop);
    assert(outsideAfter > outsideBefore, 'Wheel capture escaped the reader and blocked normal page scrolling');
    assert.deepEqual(errors, []);
    console.log('PASS: Fit allows normal detail-page scrolling in both directions; horizontal wheel preserves project; center-hinged rendering; native ctrl+wheel pinch; zoomed two-axis pan and boundary isolation; Safari gestures; fullscreen; outside-reader scrolling; browser zoom unchanged.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
