/* Browser checks for the revised My Work map and its explicit guide. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1512, height: 771 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('http://127.0.0.1:4173/');
    await page.locator('#homepage---right').scrollIntoViewIfNeeded();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(350);
    const button = page.locator('.work-map-help-button');
    const panel = page.locator('#work-map-help-panel');
    assert(await panel.isHidden());
    await button.hover();
    assert(await panel.isVisible());
    await panel.evaluate(e => Promise.all(e.getAnimations().map(animation => animation.finished.catch(() => {}))));
    await panel.evaluate(e => new Promise(resolve => {
      function check() { if (!e.classList.contains('gooey-popover--animating')) resolve(); else requestAnimationFrame(check); }
      check();
    }));
    const tooltip = await panel.evaluate(e => {
      const r = e.getBoundingClientRect(), s = getComputedStyle(e);
      return { x: r.x, y: r.y, w: r.width, h: r.height, radius: s.borderRadius, background: s.backgroundColor };
    });
    assert(Math.abs(tooltip.x - 952) < 1);
    assert(Math.abs(tooltip.y - 572) < 1);
    assert(Math.abs(tooltip.h - 115) < 1);
    assert.equal(tooltip.radius, '100px');
    assert.equal(tooltip.background, 'rgb(0, 0, 0)');
    await panel.hover();
    assert(await panel.isVisible());
    await page.mouse.move(1, 1);
    await panel.waitFor({ state: 'hidden' });
    assert(await panel.isHidden());
    await button.focus();
    assert(await panel.isVisible());
    await page.keyboard.press('Escape');
    await panel.waitFor({ state: 'hidden' });
    assert(await panel.isHidden());
    for (const width of [1920, 1512, 1440, 1280, 1080, 900, 768, 767, 560, 390, 320]) {
      await page.setViewportSize({ width, height: width === 1512 ? 771 : 850 });
      await page.locator('#homepage---right').scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
      const state = await button.evaluate(e => {
        const r = e.getBoundingClientRect();
        const intersect = b => r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top;
        const blocks = [...document.querySelectorAll('.mypractice-map-block')];
        const label = getComputedStyle(document.querySelector('.mypractice-map-axis-label'));
        return { collisions: blocks.filter(b => intersect(b.getBoundingClientRect())).length,
          overflow: document.documentElement.scrollWidth > innerWidth,
          visible: r.top >= 0 && r.bottom <= innerHeight,
          opacity: label.opacity, font: label.fontSize };
      });
      assert.equal(state.collisions, 0, `Help overlaps a project at ${width}px`);
      assert.equal(state.overflow, false, `Overflow at ${width}px`);
      assert.equal(state.visible, true, `Help outside viewport at ${width}px`);
      assert.equal(state.opacity, '0.5');
      for (const arrow of await page.locator('.mypractice-map-axis-arrow').all()) {
        const style = await arrow.evaluate(e => { const s = getComputedStyle(e); return { width: parseFloat(s.width), background: s.backgroundImage }; });
        assert(style.width < 35, `Oversized arrow at ${width}px`);
        assert.equal(style.background, 'none');
      }
      if (width >= 768) assert.equal(state.font, '26.572px');
      else {
        await button.click();
        assert.equal(await panel.getAttribute('role'), 'dialog');
        const box = await panel.boundingBox();
        assert.deepEqual(box, { x: 0, y: 0, width, height: 850 });
        await page.keyboard.press('Tab');
        assert(await page.locator('.work-map-help-close').evaluate(e => e === document.activeElement));
        await page.locator('.work-map-help-close').click();
        await panel.waitFor({ state: 'hidden' });
        assert(await panel.isHidden());
        await button.click();
        await page.keyboard.press('Escape');
        await panel.waitFor({ state: 'hidden' });
        assert(await panel.isHidden());
      }
    }
    // A project still opens its internal detail page with one click.
    await page.setViewportSize({ width: 1512, height: 771 });
    await page.locator('#homepage---right').scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
    await page.locator('[data-node-id="norrtag"] .mypractice-map-block').first().click();
    await page.waitForTimeout(400);
    assert(await page.locator('html').evaluate(e => e.classList.contains('map-project-open')));
    assert.equal(await page.locator('.work-map-help').evaluate(e => getComputedStyle(e).visibility), 'hidden');
    assert.deepEqual(errors, []);
    console.log('PASS: Figma tooltip geometry; keyboard/hover; 11 widths without help collisions; fullscreen mobile guide; one-click project opening.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
