/* Native SVG liquid surfaces: endpoints, sharp content and interrupted lifecycles. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.PORTFOLIO_BASE_URL || 'http://127.0.0.1:4173';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  async function pageFor(width, baseline = false) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, ...(width < 768 ? { isMobile: true, hasTouch: true } : {}) });
    page.on('pageerror', error => errors.push(error.message));
    if (baseline) await page.route('**/*', route => {
      const url = new URL(route.request().url());
      const name = url.pathname === '/' ? 'index.html' : path.basename(url.pathname);
      const file = path.join(process.env.GOOEY_BASELINE_DIR, name);
      if (url.origin === base && fs.existsSync(file) && fs.statSync(file).isFile()) return route.fulfill({ path: file });
      return route.continue();
    });
    await page.goto(base); await page.evaluate(() => document.fonts.ready);
    return page;
  }
  async function settled(locator) {
    await locator.evaluate(element => new Promise(resolve => {
      function tick() {
        const motion = element.getAnimations().some(animation => animation.playState === 'running');
        if (!motion && !element.classList.contains('gooey-popover--animating')) resolve();
        else requestAnimationFrame(tick);
      }
      tick();
    }));
    await locator.page().waitForTimeout(100);
  }
  async function snapshot(page, selectors) {
    return page.evaluate(selectors => selectors.flatMap(selector => Array.from(document.querySelectorAll(selector), element => {
      const box = element.getBoundingClientRect(), css = getComputedStyle(element);
      const result = { selector, text: element.textContent.trim(), box: [box.x, box.y, box.width, box.height].map(x => Math.round(x * 10) / 10) };
      for (const key of ['backgroundColor', 'color', 'borderRadius', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'padding', 'margin', 'boxShadow', 'filter', 'backdropFilter', 'opacity', 'transform']) result[key] = css[key];
      return result;
    })), selectors);
  }
  async function guideState(page, width) {
    await page.locator('#homepage---right').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
    const button = page.locator('.work-map-help-button'), panel = page.locator('#work-map-help-panel');
    if (width < 768) await button.tap(); else await button.hover();
    await settled(panel);
    return snapshot(page, ['.work-map-help-button', '#work-map-help-panel', '.work-map-help-copy p', '.mypractice-map-block']);
  }
  try {
    for (const width of [1440, 1080, 768, 390, 320]) {
      const page = await pageFor(width);
      const state = await guideState(page, width);
      const panel = page.locator('#work-map-help-panel'), button = page.locator('.work-map-help-button');
      assert.equal(await page.locator('.gooey-popover-surface').count(), 0, 'Finished effect kept SVG/filter alive');
      assert.equal(await panel.evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(0, 0, 0)');
      if (process.env.GOOEY_BASELINE_DIR) {
        const before = await pageFor(width, true);
        assert.deepEqual(state, await guideState(before, width), `${width}px: guide/map resting appearance changed`);
        await before.close();
      }
      await page.keyboard.press('Escape'); await panel.waitFor({ state: 'hidden' });
      await button.evaluate(element => element.blur()); // Switch from keyboard-held focus to pointer intent.
      // Freeze a real frame: positive blur, two merging SVG shapes, sharp DOM copy.
      if (width >= 768) {
      await page.evaluate(() => {
        window.realGooeyRAF = requestAnimationFrame;
        window.requestAnimationFrame = callback => {
          if (callback.name === 'drawGooey') { window.drawGooeyFrame = callback; window.gooeyFrameAt = performance.now(); return 900000; }
          return window.realGooeyRAF(callback);
        };
      });
      if (width < 768) await button.tap(); else { await page.mouse.move(1, 1); await button.hover(); }
      await page.evaluate(() => window.drawGooeyFrame(window.gooeyFrameAt + 84));
      const mid = await panel.evaluate(e => {
        const svg = e.querySelector('svg');
        return { progress: Number(e.dataset.gooeyProgress), blur: Number(svg.querySelector('feGaussianBlur').getAttribute('stdDeviation')),
          matrix: svg.querySelector('feColorMatrix').getAttribute('values'), shapes: svg.querySelectorAll('g > circle, g > rect').length,
          copyFilter: getComputedStyle(e.querySelector('.work-map-help-copy')).filter, svgHidden: svg.getAttribute('aria-hidden'),
          overflow: document.documentElement.scrollWidth - innerWidth };
      });
      assert(mid.progress > .5 && mid.progress < .8); assert(mid.blur > 3); assert(mid.matrix.endsWith('18 -8.5'));
      assert.equal(mid.shapes, 2); assert.equal(mid.copyFilter, 'none'); assert.equal(mid.svgHidden, 'true'); assert.equal(mid.overflow, 0);
      if (width === 1440 || width === 390) await page.screenshot({ path: '/tmp/gooey-popover-mid-' + width + '.png' });
      await page.evaluate(() => { window.drawGooeyFrame(window.gooeyFrameAt + 1000); window.requestAnimationFrame = window.realGooeyRAF; });
      } else {
        await button.tap();
        assert.equal(await page.locator('.gooey-popover-surface').count(), 0, 'Mobile guide should not liquefy');
        assert.deepEqual(await panel.boundingBox(), { x: 0, y: 0, width, height: 1000 });
      }
      assert.equal(await page.locator('.gooey-popover-surface').count(), 0);
      if (width >= 768) {
        await page.mouse.move(1, 1); await page.waitForTimeout(85); await button.hover(); await settled(panel);
        assert(await panel.isVisible(), 'Interrupted close hid the reopened guide');
        await panel.hover(); await page.waitForTimeout(80);
        assert.equal(await button.getAttribute('aria-expanded'), 'true');
        await page.mouse.move(1, 1); await panel.waitFor({ state: 'hidden' });
        await button.focus(); assert.equal(await button.getAttribute('aria-expanded'), 'true');
      } else {
        await page.keyboard.press('Tab');
        assert(await page.locator('.work-map-help-close').evaluate(e => e === document.activeElement));
      }
      await page.keyboard.press('Escape'); await panel.waitFor({ state: 'hidden' });
      assert(await button.evaluate(e => e === document.activeElement));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      if (width < 768) await button.tap(); else { await page.mouse.move(1, 1); await button.hover(); }
      assert(await panel.isVisible()); assert.equal(await page.locator('.gooey-popover-surface').count(), 0);
      await page.keyboard.press('Escape'); assert(await panel.isHidden());
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      if (width < 768) await button.tap(); else { await page.mouse.move(1, 1); await button.hover(); }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => !document.querySelector('.gooey-popover-surface'));
      assert.equal(await page.locator('.gooey-popover-surface').count(), 0, 'Live reduced-motion change retained active filter');
      await page.keyboard.press('Escape');
      if (width < 768) {
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        const email = page.locator('.landing3042-email-link');
        await email.scrollIntoViewIfNeeded(); await page.waitForTimeout(150); await email.focus();
        assert.equal(await page.locator('.gooey-popover-surface').count(), 0, 'Mobile text tooltip should not liquefy');
        await email.evaluate(element => element.blur());
      }
      await page.close();
      console.log('PASS', width, 'resting parity, liquid mid-frame, no overflow, lifecycle, focus and reduced motion');
    }
    const page = await pageFor(1440);
    const copy = page.locator('.landing3042-email-link'), preview = page.locator('#external-link-hover-preview');
    await copy.hover(); await settled(preview);
    assert.equal((await preview.textContent()).trim(), 'Copy');
    const copyState = await snapshot(page, ['#external-link-hover-preview', '#external-link-hover-preview-label']);
    if (process.env.GOOEY_BASELINE_DIR) {
      const before = await pageFor(1440, true); await before.locator('.landing3042-email-link').hover(); await settled(before.locator('#external-link-hover-preview'));
      assert.deepEqual(copyState, await snapshot(before, ['#external-link-hover-preview', '#external-link-hover-preview-label'])); await before.close();
    }
    await page.mouse.move(1, 1); await page.waitForTimeout(60); await copy.hover(); await settled(preview);
    assert.equal((await preview.textContent()).trim(), 'Copy');
    await page.mouse.move(1, 1); await preview.waitFor({ state: 'hidden' });
    assert.equal(await page.locator('.gooey-popover-surface').count(), 0);
    // The word is the source surface, not a detached circle in the tooltip.
    await copy.hover();
    const source = await preview.evaluate(element => ({
      circles: element.querySelectorAll('circle').length,
      source: element.querySelector('g > rect')?.getAttribute('width'),
      mask: !!element.querySelector('mask'), progress: Number(element.dataset.gooeyProgress)
    }));
    assert.equal(source.circles, 0); assert(source.mask); assert(Number(source.source) > 100);
    assert(source.progress < .1, 'Tooltip started before the word inverted');
    await settled(preview); await page.mouse.move(1, 1); await page.waitForTimeout(200);
    assert(await preview.isHidden(), 'Text tooltip left a trailing shape');
    assert.equal(await page.locator('.gooey-popover-surface,.is-gooey-source').count(), 0);
    await page.locator('#homepage---right').scrollIntoViewIfNeeded();
    await page.locator('[data-node-id="norrtag"] .mypractice-map-block').first().click();
    await page.locator('#map-project-inline-shell').waitFor();
    assert.equal(await page.locator('.gooey-popover-surface').count(), 0, 'Guide effect leaked into project detail');
    await page.locator('.norrtag-hotspot').first().scrollIntoViewIfNeeded(); await page.locator('.norrtag-hotspot').first().hover();
    assert(await page.locator('#map-project-detail-hotspot-preview').isVisible());
    assert.equal(await page.locator('#map-project-detail-hotspot-preview .gooey-popover-surface').count(), 0, 'Image preview was liquefied');
    await page.close(); assert.deepEqual(errors, []);
    console.log('PASS: copy/external text tooltip parity and reversal; project one-click opening; image previews excluded; no JS errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
