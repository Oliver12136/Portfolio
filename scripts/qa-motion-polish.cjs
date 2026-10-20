/* Motion lifecycle regressions: rapid reversal, cancellation and accessible endpoints. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = 'http://127.0.0.1:4173';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  async function newPage(options) {
    const page = await browser.newPage(options);
    page.on('pageerror', error => errors.push(error.message));
    return page;
  }
  async function settle(locator) {
    await locator.evaluate(element => Promise.all(element.getAnimations().map(motion => motion.finished.catch(() => {}))));
    await locator.evaluate(element => new Promise(resolve => {
      function check() { if (!element.classList.contains('gooey-popover--animating')) resolve(); else requestAnimationFrame(check); }
      check();
    }));
    await locator.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  }
  try {
    const page = await newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    await page.locator('#homepage---right').scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
    const button = page.locator('.work-map-help-button');
    const panel = page.locator('#work-map-help-panel');
    const blocks = () => page.locator('.mypractice-map-block').evaluateAll(elements => elements.map(element => {
      const r = element.getBoundingClientRect(); return [r.x, r.y, r.width, r.height];
    }));
    const originalBlocks = await blocks();
    await button.hover();
    const entrance = await panel.evaluate(element => {
      return { liquid: !!element.querySelector('svg g[filter]'),
        matrix: element.querySelector('feColorMatrix')?.getAttribute('values'),
        textFilter: getComputedStyle(element.querySelector('.work-map-help-copy')).filter };
    });
    assert(entrance.liquid);
    assert(entrance.matrix.endsWith('18 -8.5'));
    assert.equal(entrance.textFilter, 'none');
    await settle(panel);
    const dimensions = await panel.evaluate(e => [e.offsetWidth, e.offsetHeight, getComputedStyle(e).borderRadius]);
    await panel.hover();
    await page.waitForTimeout(100);
    assert.equal(await button.getAttribute('aria-expanded'), 'true', 'Moving from button to capsule closed it');
    await page.mouse.move(1, 1);
    await page.waitForTimeout(75);
    assert.equal(await button.getAttribute('aria-expanded'), 'false');
    assert(await panel.evaluate(e => e.inert), 'Closing capsule remained keyboard-interactive');
    await button.hover();
    await page.waitForTimeout(250);
    assert(await panel.isVisible(), 'Stale exit completion hid the reopened capsule');
    assert.deepEqual(await panel.evaluate(e => [e.offsetWidth, e.offsetHeight, getComputedStyle(e).borderRadius]), dimensions);
    assert.deepEqual(await blocks(), originalBlocks, 'Tooltip shifted project squares');
    await page.mouse.move(1, 1); await panel.waitFor({ state: 'hidden' });
    await button.focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
    assert.equal(await button.getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape'); await panel.waitFor({ state: 'hidden' });
    assert(await button.evaluate(e => e === document.activeElement));

    // A user can reverse a close with browser history/hash navigation without
    // the old completion hiding or clearing the newly selected project.
    await page.locator('[data-node-id="norrtag"] .mypractice-map-block').first().click();
    const shell = page.locator('#map-project-inline-shell');
    await shell.waitFor(); await settle(shell);
    assert(await page.locator('html').evaluate(e => e.classList.contains('map-project-open')));
    await page.locator('#map-project-inline-next').click();
    await page.waitForFunction(() => location.hash !== '#map-project=norrtag');
    await settle(page.locator('.map-project-inline-content'));
    assert.equal(await shell.evaluate(e => getComputedStyle(e).opacity), '1');
    await page.locator('#map-project-inline-close').click();
    await page.waitForFunction(() => document.querySelector('#map-project-inline-shell').inert);
    await page.evaluate(() => location.hash = 'map-project=norrtag');
    await page.waitForTimeout(400);
    assert(await shell.isVisible(), 'Reopened detail hidden by cancelled close');
    assert(!(await shell.evaluate(e => e.inert)));
    assert.equal((await page.locator('#map-project-detail-title').textContent()).toLowerCase(), "everyone's on board");
    assert.equal(await page.locator('.map-project-inline-content').evaluate(e => getComputedStyle(e).opacity), '1');

    const hotspot = page.locator('.norrtag-hotspot').first();
    await hotspot.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300); // Existing header collapse can move the focus target.
    await hotspot.focus();
    const preview = page.locator('#map-project-detail-hotspot-preview');
    await preview.waitFor(); await settle(preview);
    await page.waitForFunction(() => document.querySelector('#map-project-detail-hotspot-preview-img').naturalWidth > 0);
    await hotspot.hover();
    await page.mouse.move(1, 1);
    await page.waitForTimeout(40);
    await hotspot.hover();
    await page.waitForTimeout(250);
    assert(await preview.isVisible(), 'Stale hover exit hid reopened evidence');
    assert((await page.locator('#map-project-detail-hotspot-preview-img').getAttribute('src')).includes('/ep'));
    const writes = await page.evaluate(() => {
      const preview = document.querySelector('#map-project-detail-hotspot-preview');
      const observer = new MutationObserver(records => window.motionPointerWrites += records.length);
      window.motionPointerWrites = 0;
      observer.observe(preview, { attributes: true, attributeFilter: ['style'] });
      for (let i = 0; i < 30; i++) document.dispatchEvent(new PointerEvent('pointermove', { clientX: 200+i, clientY: 300+i }));
      return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
        observer.disconnect(); resolve(window.motionPointerWrites);
      })));
    });
    assert(writes <= 2, `Pointer positioning wrote styles ${writes} times for one frame of input`);
    await page.locator('#map-project-inline-close').click();
    await shell.waitFor({ state: 'hidden' });
    await page.waitForTimeout(150);
    assert(await preview.isHidden());
    assert(!(await page.locator('html').evaluate(e => e.classList.contains('map-project-open'))));

    // Reduced motion also applies when enabled during an active entrance.
    await page.locator('#homepage---right').scrollIntoViewIfNeeded();
    await button.hover(); await page.emulateMedia({ reducedMotion: 'reduce' });
    await settle(panel);
    assert.equal(await panel.evaluate(e => e.getAnimations().length), 0);
    await page.keyboard.press('Escape'); assert(await panel.isHidden());
    await page.mouse.move(1, 1);
    await button.hover();
    assert(await panel.isVisible());
    assert.equal(await panel.evaluate(e => e.getAnimations().length), 0);
    assert.equal(await page.locator('.mypractice-map-block').first().evaluate(e => getComputedStyle(e).transitionDuration), '0s');
    await page.keyboard.press('Escape');
    await page.evaluate(() => location.hash = 'map-project=norrtag'); await shell.waitFor();
    assert.equal(await shell.evaluate(e => e.getAnimations().length), 0);
    await page.locator('#map-project-inline-close').click(); await shell.waitFor({ state: 'hidden' });

    const mobile = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await mobile.goto(base); await mobile.locator('#homepage---right').scrollIntoViewIfNeeded();
    const mobileButton = mobile.locator('.work-map-help-button'), mobilePanel = mobile.locator('#work-map-help-panel');
    await mobileButton.tap(); await settle(mobilePanel);
    assert.equal(await mobilePanel.getAttribute('aria-modal'), 'true');
    assert.deepEqual(await mobilePanel.boundingBox(), { x: 0, y: 0, width: 390, height: 844 });
    await mobile.keyboard.press('Tab');
    assert(await mobile.locator('.work-map-help-close').evaluate(e => e === document.activeElement));
    await mobile.locator('.work-map-help-close').tap(); await mobilePanel.waitFor({ state: 'hidden' });
    assert(await mobileButton.evaluate(e => e === document.activeElement));
    await mobile.evaluate(() => location.hash = 'map-project=norrtag');
    const mobileHotspot = mobile.locator('.norrtag-hotspot').first(); await mobileHotspot.scrollIntoViewIfNeeded(); await mobileHotspot.tap();
    assert(await mobile.locator('.map-project-detail-hotspot-inline-preview').isVisible());
    await mobileHotspot.tap(); assert(await mobile.locator('.map-project-detail-hotspot-inline-preview').isHidden());
    assert.deepEqual(errors, []);
    console.log('PASS: anchored tooltip timing, bridge/re-entry, inert exit, keyboard/Escape, unchanged grid geometry; detail close/reopen cancellation and navigation; evidence-preview cancellation and one-frame pointer batching; live reduced-motion preference; mobile dialog, focus return and tap previews; no JS errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
