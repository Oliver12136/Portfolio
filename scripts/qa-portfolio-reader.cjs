const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.PORTFOLIO_BASE_URL || 'http://127.0.0.1:4173';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disk-cache-size=1', '--media-cache-size=1'] });
  const errors = [], missing = [];
  async function page(options) {
    const p = await browser.newPage(options);
    p.on('pageerror', error => errors.push(error.message));
    p.on('response', response => { if (response.status() >= 400 && /portfolio-reader|portfolio-gallery/.test(response.url())) missing.push(response.url()); });
    return p;
  }
  async function open(p, id) {
    await p.goto(base + '/#map-project=' + id, { waitUntil: 'domcontentloaded' });
    await p.locator('.portfolio-reader').waitFor();
    await p.locator('.portfolio-reader').scrollIntoViewIfNeeded();
    await p.waitForFunction(() => {
      const img = document.querySelector('.portfolio-reader-page:not([hidden]) img');
      return img && img.complete && img.naturalWidth > 0;
    });
    await p.locator('.portfolio-reader-stage').focus();
    await p.waitForTimeout(300); // Let the existing sticky-header/scroll transition settle.
    return p.locator('.portfolio-reader');
  }
  async function fitted(p) {
    // Fullscreen styles apply before ResizeObserver updates the fitted sheet.
    await p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const geometry = await p.locator('.portfolio-reader').evaluate(root => {
      const stage = root.querySelector('.portfolio-reader-stage').getBoundingClientRect();
      const image = root.querySelector('.portfolio-reader-page[aria-hidden="false"] img');
      const rect = image.getBoundingClientRect();
      const readerRect = root.getBoundingClientRect();
      const bounds = document.fullscreenElement === root ? new DOMRect(0, 0, innerWidth, innerHeight) : document.querySelector('#map-project-inline-scroll').getBoundingClientRect();
      const previous = root.querySelector('.portfolio-reader-previous').getBoundingClientRect();
      const next = root.querySelector('.portfolio-reader-next').getBoundingClientRect();
      return { stage: stage.toJSON(), image: rect.toJSON(), ratio: image.naturalWidth / image.naturalHeight,
        reader: readerRect.toJSON(), bounds: bounds.toJSON(), previous: previous.toJSON(), next: next.toJSON(),
        arrowWidth: parseFloat(getComputedStyle(root).getPropertyValue('--reader-arrow-width')),
        fit: getComputedStyle(image).objectFit, overflow: document.documentElement.scrollWidth - innerWidth };
    });
    assert.equal(geometry.fit, 'contain');
    assert(geometry.image.left >= geometry.stage.left - 1 && geometry.image.right <= geometry.stage.right + 1);
    assert(geometry.image.top >= geometry.stage.top - 1 && geometry.image.bottom <= geometry.stage.bottom + 1);
    assert(Math.abs(geometry.image.width / geometry.image.height - geometry.ratio) < .005, JSON.stringify(geometry));
    assert(geometry.overflow <= 1);
    assert(geometry.previous.right <= geometry.stage.left + 1 && geometry.next.left >= geometry.stage.right - 1, 'Side arrows cover the image');
    assert(geometry.previous.left >= geometry.bounds.left - 1 && geometry.next.right <= geometry.bounds.right + 1, 'Side arrows escape the page: ' + JSON.stringify(geometry));
    if (geometry.reader.left - geometry.bounds.left >= geometry.arrowWidth + 4 && geometry.bounds.right - geometry.reader.right >= geometry.arrowWidth + 4) {
      assert(Math.abs(geometry.stage.left - geometry.reader.left) < 1 && Math.abs(geometry.stage.right - geometry.reader.right) < 1, 'Image did not expand to the content edges despite sufficient outer margins');
    }
    return geometry;
  }
  async function swipe(p, x1, x2, y) {
    const client = await p.context().newCDPSession(p);
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x1, y, id: 1 }] });
    for (let step = 1; step <= 6; step++) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x1 + (x2 - x1) * step / 6, y, id: 1 }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await client.detach();
  }
  try {
    const desktop = await page({ viewport: { width: 1440, height: 1000 } });
    const initialRequests = [];
    desktop.on('request', req => { if (/portfolio-gallery\/\d+-/.test(req.url())) initialRequests.push(req.url()); });
    let reader = await open(desktop, '3150:21733');
    assert.equal(await reader.locator('.portfolio-reader-page').count(), 6);
    assert(initialRequests.every(src => /\/(1|2)-(display|viewer)\.webp/.test(src)), 'Nonadjacent page fetched at entry: ' + initialRequests);
    const hash = await desktop.evaluate(() => location.hash);
    await reader.locator('[aria-label="Next page"]').click();
    await desktop.waitForFunction(() => document.querySelector('.portfolio-reader').dataset.page === '2');
    await reader.locator('.portfolio-reader-stage').focus();
    await desktop.keyboard.press('ArrowRight');
    assert.equal(await reader.getAttribute('data-page'), '3');
    assert.equal(await desktop.evaluate(() => location.hash), hash, 'Reader keys changed the project');
    await desktop.waitForTimeout(280);
    await fitted(desktop);
    await reader.locator('[aria-label="Zoom in"]').click();
    await reader.locator('[aria-label="Zoom in"]').click();
    await desktop.waitForFunction(() => Number(document.querySelector('.portfolio-reader').dataset.zoom) > 2);
    const stage = await reader.locator('.portfolio-reader-stage').boundingBox();
    const imageBefore = await reader.locator('.portfolio-reader-page[aria-hidden="false"] img').boundingBox();
    await desktop.mouse.move(stage.x + stage.width / 2, stage.y + stage.height / 2);
    await desktop.mouse.down(); await desktop.mouse.move(stage.x + stage.width / 2 + 100, stage.y + stage.height / 2 + 20, { steps: 5 }); await desktop.mouse.up();
    await desktop.waitForTimeout(50);
    const imageAfter = await reader.locator('.portfolio-reader-page[aria-hidden="false"] img').boundingBox();
    assert(imageAfter.x > imageBefore.x + 60, 'Mouse drag did not pan');
    assert.equal(await reader.getAttribute('data-page'), '3');
    await desktop.waitForFunction(() => document.querySelector('.portfolio-reader-page[aria-hidden="false"] img').getAttribute('src').includes('-viewer.webp'));
    for (let i = 0; i < 3; i++) await reader.locator('[aria-label="Zoom in"]').click();
    await desktop.waitForFunction(() => {
      const img = document.querySelector('.portfolio-reader-page[aria-hidden="false"] img');
      return img.getAttribute('src').includes('-detail.webp') && img.complete && img.naturalWidth === 8192;
    });
    await reader.locator('.portfolio-reader-stage').focus();
    await desktop.keyboard.press('ArrowRight');
    assert.equal(await reader.getAttribute('data-page'), '3', 'Zoomed keyboard pan turned a page');
    await desktop.keyboard.press('0');
    await desktop.waitForFunction(() => document.querySelector('.portfolio-reader').dataset.zoom === '1.000');
    await fitted(desktop);
    await desktop.mouse.move(stage.x + stage.width / 2, stage.y + stage.height / 2);
    await desktop.mouse.wheel(700, 0);
    assert.equal(await desktop.evaluate(() => location.hash), hash, 'Reader horizontal wheel changed projects');
    assert.equal(await desktop.locator('.map-project-template-image-viewer').count(), 0);
    assert.equal(await desktop.locator('.map-project-template-secondary').count(), 0, 'Development notice was retained');
    const controls = await reader.evaluate(root => {
      const rect = selector => root.querySelector(selector).getBoundingClientRect().toJSON();
      return { stage: rect('.portfolio-reader-stage'), previous: rect('.portfolio-reader-previous'), next: rect('.portfolio-reader-next'), zoom: rect('.portfolio-reader-zoom-controls') };
    });
    assert(controls.previous.right <= controls.stage.left + 1 && controls.next.left >= controls.stage.right - 1, 'Side arrows cover the publication');
    assert(Math.abs((controls.previous.top + controls.previous.bottom)/2 - (controls.stage.top + controls.stage.bottom)/2) < 1);
    assert(Math.abs((controls.zoom.left + controls.zoom.right)/2 - (controls.stage.left + controls.stage.right)/2) < 1);
    assert.equal(await reader.locator('.portfolio-reader-topic').innerText(), 'Empathy & Game Mechanics');
    const slider = reader.locator('[aria-label="Zoom level"]');
    await slider.focus(); await desktop.keyboard.press('End');
    await desktop.waitForFunction(() => document.querySelector('.portfolio-reader').dataset.zoom === '6.000');
    await desktop.keyboard.press('Home');
    await desktop.waitForFunction(() => document.querySelector('.portfolio-reader').dataset.zoom === '1.000');
    assert.equal(await desktop.evaluate(() => location.hash), hash, 'Slider keys changed projects');
    await desktop.evaluate(() => window.readerImageBeforeFullscreen = document.querySelector('.portfolio-reader-page[aria-hidden="false"] img'));
    await reader.locator('[aria-label="Enter fullscreen"]').click();
    await desktop.waitForFunction(() => document.fullscreenElement === document.querySelector('.portfolio-reader'));
    assert(await desktop.evaluate(() => window.readerImageBeforeFullscreen === document.querySelector('.portfolio-reader-page[aria-hidden="false"] img')), 'Fullscreen created a separate viewer');
    await fitted(desktop);
    const sliderBox = await slider.boundingBox();
    await desktop.mouse.move(sliderBox.x + 4, sliderBox.y + sliderBox.height/2);
    await desktop.mouse.down();
    await desktop.mouse.move(sliderBox.x + sliderBox.width*.65, sliderBox.y + sliderBox.height/2, { steps: 6 });
    await desktop.mouse.up();
    await desktop.waitForFunction(() => Number(document.querySelector('.portfolio-reader').dataset.zoom) > 3);
    const fullscreenStage = await reader.locator('.portfolio-reader-stage').boundingBox();
    const beforePan = await reader.locator('.portfolio-reader-page[aria-hidden="false"] img').boundingBox();
    await desktop.mouse.move(fullscreenStage.x + fullscreenStage.width/2, fullscreenStage.y + fullscreenStage.height/2);
    await desktop.mouse.down();
    await desktop.mouse.move(fullscreenStage.x + fullscreenStage.width/2 + 80, fullscreenStage.y + fullscreenStage.height/2, { steps: 5 });
    await desktop.mouse.up();
    await desktop.waitForTimeout(30);
    const afterPan = await reader.locator('.portfolio-reader-page[aria-hidden="false"] img').boundingBox();
    assert(afterPan.x > beforePan.x + 60, 'Fullscreen drag did not pan the view');
    assert.equal(await reader.getAttribute('data-page'), '3');
    await reader.locator('[aria-label="Fit to screen"]').click();
    await reader.locator('.portfolio-reader-stage').focus();
    await desktop.keyboard.press('Escape');
    await desktop.waitForFunction(() => !document.fullscreenElement);
    assert(await desktop.locator('#map-project-inline-shell').isVisible(), 'Escape from fullscreen closed the project');
    await reader.locator('[aria-label="Next page"]').click();
    await desktop.waitForFunction(() => !!document.querySelector('.portfolio-reader-turn-canvas'));
    assert.equal(await reader.locator('.portfolio-reader-topic').innerText(), 'Prototype & Function Test');
    await desktop.waitForFunction(() => !document.querySelector('.portfolio-reader-turn-canvas'));

    // Every original card stays one reader page, in precisely the original order.
    for (const [id, numbers] of [
      ['3150:21733', [1,2,3,4,5,6]], ['3150:21734', [7,8,9,10,11,12]],
      ['3139:17651', [13,14]], ['3139:21712', [15,16,17,18,19,20]],
      ['3139:21711', [21,22]], ['3139:21710', [25,26]]
    ]) {
      reader = await open(desktop, id);
      assert.deepEqual(await reader.locator('img').evaluateAll(imgs => imgs.map(img => Number(img.dataset.src.match(/\/(\d+)-display/)[1]))), numbers);
      for (const width of [1440, 1080, 768, 390, 320]) {
        await desktop.setViewportSize({ width, height: 1000 });
        await reader.scrollIntoViewIfNeeded();
        await fitted(desktop);
      }
    }
    // No single-image legacy project currently exists: exercise that state with
    // an actual existing Loom Drift image, without adding or rewriting a project.
    await desktop.evaluate(() => {
      const host = document.querySelector('.portfolio-reader'), parent = document.querySelector('#map-project-template-root');
      parent.readerCleanup();
      window.singleReaderDispose = window.PortfolioReader.mount(host, [{ src: './assets/portfolio-gallery/25-display.webp', width: 2560, height: 906, alt: 'Loom Drift existing first composition' }], { title: 'Single-page verification', scrollport: document.querySelector('#map-project-inline-scroll') });
    });
    assert(await reader.locator('[aria-label="Next page"]').isDisabled());
    assert(await reader.locator('[aria-label="Previous page"]').isDisabled());
    assert.equal(await reader.locator('.portfolio-reader-counter').innerText(), '1 / 1');
    await reader.locator('[aria-label="Zoom in"]').click();
    await reader.locator('[aria-label="Fit to screen"]').click();
    await desktop.evaluate(() => window.singleReaderDispose());
    // Also exercise an existing non-wide source, so fitting isn't tied to 2.83:1.
    await desktop.evaluate(async () => {
      const img = new Image();
      img.src = './assets/portfolio-gallery/M2-display.webp';
      await img.decode();
      window.singleReaderDispose = window.PortfolioReader.mount(document.querySelector('.portfolio-reader'), [{ src: img.src, width: img.naturalWidth, height: img.naturalHeight, alt: 'Existing PaperMind research photograph used for aspect ratio verification' }], { title: 'Aspect ratio verification', scrollport: document.querySelector('#map-project-inline-scroll') });
    });
    await desktop.waitForFunction(() => document.querySelector('.portfolio-reader img').naturalWidth > 0);
    await fitted(desktop);
    await desktop.evaluate(() => window.singleReaderDispose());

    for (const [id, root] of [['3139:21713', '#map-project-template-root'], ['3139:21709', '#map-project-detail-veritas-root'], ['3150:21735', '#map-project-opentrace-root'], ['norrtag', '#map-project-norrtag-root']]) {
      await desktop.goto(base + '/#map-project=' + id, { waitUntil: 'domcontentloaded' });
      assert(await desktop.locator(root).isVisible());
      assert.equal(await desktop.locator('.portfolio-reader').count(), 0, id + ' custom page changed');
    }
    await desktop.close();

    // Test the same inline component when element fullscreen or WebGL is unavailable.
    const fallback = await page({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
    await fallback.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) { return type === 'webgl' ? null : getContext.call(this, type, ...args); };
    });
    let fallbackReader = await open(fallback, '3139:21710');
    await fallbackReader.evaluate(root => { root.requestFullscreen = undefined; root.webkitRequestFullscreen = undefined; });
    await fallbackReader.locator('[aria-label="Enter fullscreen"]').tap();
    await fallback.waitForFunction(() => document.querySelector('.portfolio-reader').classList.contains('is-expanded'));
    await fitted(fallback);
    await fallbackReader.locator('[aria-label="Next page"]').tap();
    await fallback.waitForFunction(() => !document.querySelector('.portfolio-reader').classList.contains('is-turning'));
    assert.equal(await fallbackReader.getAttribute('data-page'), '2');
    await fallbackReader.locator('[aria-label="Exit fullscreen"]').tap();
    await fallback.waitForFunction(() => !document.querySelector('.has-expanded-reader'));
    await fallback.close();

    for (const landscape of [false, true]) {
      const touch = await page({ viewport: landscape ? { width: 844, height: 390 } : { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      reader = await open(touch, '3139:21710');
      const rect = await fitted(touch);
      const chrome = await touch.evaluate(() => ({ top: document.querySelector('.map-project-detail-topbar').getBoundingClientRect().bottom, bottom: document.querySelector('#map-project-inline-nav').getBoundingClientRect().top, controls: document.querySelector('.portfolio-reader-controls').getBoundingClientRect().bottom }));
      assert(rect.image.top >= chrome.top - 1, 'Sticky title obscures the publication');
      assert(chrome.controls <= chrome.bottom + 1, 'Project navigation obscures reader controls: ' + JSON.stringify({ landscape, chrome, rect }));
      assert(Math.abs(rect.image.width - Math.min(rect.stage.width, rect.stage.height * rect.ratio)) < 2, 'Wide composition was unnecessarily reduced');
      const box = await reader.locator('.portfolio-reader-stage').boundingBox();
      const x = box.x + box.width / 2, y = box.y + box.height / 2;
      await swipe(touch, x + 50, x - 50, y);
      await touch.waitForFunction(() => document.querySelector('.portfolio-reader').dataset.page === '2');
      await touch.waitForTimeout(280);
      const cdp = await touch.context().newCDPSession(touch);
      const touches = dist => [{ x: x - dist, y, id: 1 }, { x: x + dist, y, id: 2 }];
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touches(35) });
      for (const distance of [40, 50, 65, 80, 100]) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: touches(distance) });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: x + 100, y, id: 2 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 120, y, id: 2 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await cdp.detach();
      await touch.waitForFunction(() => Number(document.querySelector('.portfolio-reader').dataset.zoom) > 2);
      await swipe(touch, x - 50, x + 50, y);
      assert.equal(await reader.getAttribute('data-page'), '2', 'Zoomed touch pan accidentally turned a page');
      assert.equal(await touch.evaluate(() => location.hash), '#map-project=loom-drift');
      await reader.locator('[aria-label="Fit to screen"]').tap();
      await touch.waitForFunction(() => document.querySelector('.portfolio-reader').dataset.zoom === '1.000');
      await fitted(touch);
      await reader.locator('[aria-label="Enter fullscreen"]').tap();
      await touch.waitForFunction(() => document.fullscreenElement === document.querySelector('.portfolio-reader'));
      await fitted(touch);
      await reader.locator('[aria-label="Exit fullscreen"]').tap();
      await touch.waitForFunction(() => !document.fullscreenElement);
      await touch.waitForFunction(() => {
        const root = document.querySelector('.portfolio-reader'), r = root.getBoundingClientRect();
        const top = document.querySelector('.map-project-detail-topbar').getBoundingClientRect().bottom;
        const bottom = document.querySelector('#map-project-inline-nav').getBoundingClientRect().top;
        return r.top >= top - 1 && r.bottom <= bottom + 1;
      });
      await touch.screenshot({ path: '/tmp/portfolio-reader-' + (landscape ? 'landscape' : 'portrait') + '.png' });
      const restored = await reader.locator('.portfolio-reader-stage').boundingBox();
      await swipe(touch, restored.x + restored.width/2 - 50, restored.x + restored.width/2 + 50, restored.y + restored.height/2);
      await touch.waitForFunction(() => document.querySelector('.portfolio-reader').dataset.page === '1');
      assert.equal(await touch.locator('.map-project-template-image-viewer').count(), 0);
      await touch.locator('#map-project-inline-next').tap();
      await touch.waitForFunction(() => !location.hash.includes('loom-drift'));
      await touch.locator('#map-project-inline-close').tap();
      await touch.locator('.work-map-help-button').waitFor({ state: 'visible' });
      await touch.close();
    }

    const reduced = await page({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    reader = await open(reduced, '3139:21710');
    await reader.locator('[aria-label="Next page"]').click();
    assert.equal(await reader.locator('.portfolio-reader-page:not([hidden])').count(), 1);
    assert.equal(await reader.evaluate(root => root.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length), 0);
    await reduced.close();
    assert.deepEqual(errors, []);
    assert.deepEqual(missing, []);
    console.log('PASS: 6 original galleries and image order; adjacent-only startup and existing quality tiers; curved paper turns and fallback; side arrows, page topics, centered slider/Fit; inline mouse/touch pan and zoom; native fullscreen and inline fallback; single-image and non-wide states; unchanged custom roots; portrait/landscape gestures; no zoomed swipe turns or modal; project navigation; reduced motion.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
