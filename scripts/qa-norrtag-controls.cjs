const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--disk-cache-size=1", "--media-cache-size=1"],
  });
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 1000 } }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("http://127.0.0.1:4173");
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(300);
    await p.locator("#homepage---right").scrollIntoViewIfNeeded();
    await p
      .locator('[data-node-id="3139:21709"] .mypractice-map-block')
      .first()
      .click();
    await p.waitForTimeout(350);
    const prefix = ".map-project-detail-section-c-conclusion-carousel-";
    async function styles(root) {
      return root.evaluate((e) => {
        const pre = ".map-project-detail-section-c-conclusion-carousel-";
        const props = (q, keys) => {
          const s = getComputedStyle(e.querySelector(pre + q));
          return Object.fromEntries(keys.map((k) => [k, s[k]]));
        };
        return {
          footer: props("footer", [
            "marginTop",
            "display",
            "gap",
            "alignItems",
            "justifyContent",
          ]),
          nav: props("nav", ["gap", "display"]),
          button: props("nav-btn", [
            "width",
            "height",
            "padding",
            "backgroundColor",
            "borderWidth", "borderStyle",
          ]),
          pager: props("pagination", ["gap", "display"]),
          item: props("pagination-item:not(.is-active)", [
            "width",
            "height",
            "borderRadius",
          ]),
        };
      });
    }
    const reference = await styles(
      p.locator(
        "#map-project-detail-section-c .map-project-detail-section-c-conclusion-visual",
      ),
    );
    await p.locator("#map-project-inline-close").click();
    await p.waitForTimeout(350);
    await p
      .locator('[data-node-id="norrtag"] .mypractice-map-block')
      .first()
      .click();
    await p.waitForTimeout(350);
    const root = p.locator("#map-project-norrtag-root"),
      hero = root.locator(".norrtag-opening .norrtag-hero-figure"),
      v = hero.locator("video"),
      play = hero.locator("button");
    await hero.scrollIntoViewIfNeeded();
    await p.mouse.move(0, 0);
    assert.equal(await v.evaluate((e) => e.controls), false);
    assert.equal(await play.evaluate((e) => getComputedStyle(e).opacity), "0");
    await hero.hover();
    await p.waitForTimeout(160);
    assert.equal(await v.evaluate((e) => e.controls), true);
    assert.equal(await play.evaluate((e) => getComputedStyle(e).opacity), "1");
    await p.screenshot({ path: "/tmp/norrtag-hero-hover.png" });
    await play.click();
    await p.waitForFunction(() => {
      const v = document.querySelector(".norrtag-hero-video");
      return !v.paused && v.currentTime > 0;
    });
    await p.mouse.move(0, 0);
    assert.equal(await v.evaluate((e) => e.controls), false);
    assert.equal(await v.evaluate((e) => e.paused), false);
    await p.screenshot({ path: "/tmp/norrtag-hero-rest.png" });
    for (const width of [1440, 1080, 768, 390, 320]) {
      await p.setViewportSize({ width, height: 1000 });
      await root.locator(".norrtag-phone-stage").scrollIntoViewIfNeeded();
      const layout = await root.evaluate((e) => {
        const r = (s) => e.querySelector(s).getBoundingClientRect();
        const poster = r(".norrtag-crop-poster"),
          video = r(".norrtag-phone video"),
          figs = e.querySelectorAll(".norrtag-research-media > figure");
        return {
          heights: [poster.height, video.height],
          captionGaps: [
            figs[0].querySelector("figcaption").getBoundingClientRect().top -
              poster.bottom,
            figs[1].querySelector("figcaption").getBoundingClientRect().top -
              video.bottom,
          ],
          fill: getComputedStyle(
            e.querySelector('[data-media-slot="probe-real-life"]'),
          ).objectFit,
          overflow: e.scrollWidth - e.clientWidth,
        };
      });
      assert(
        Math.abs(layout.heights[0] - layout.heights[1]) < 1,
        JSON.stringify(layout),
      );
      assert(
        Math.abs(layout.captionGaps[0] - layout.captionGaps[1]) < 1,
        JSON.stringify(layout),
      );
      assert.equal(layout.fill, "fill");
      assert.equal(layout.overflow, 0);
      console.log(width, layout);
      if (width === 390)
        await p.screenshot({ path: "/tmp/norrtag-aligned-phones-mobile.png" });
    }
    await p.setViewportSize({ width: 1440, height: 1000 });
    const carousel = root.locator(".norrtag-service-media").first();
    await carousel.scrollIntoViewIfNeeded();
    assert.deepEqual(await styles(carousel), reference);
    assert.equal(await carousel.locator(".project-media-controls").count(), 0);
    assert.equal(await carousel.locator(prefix + "pagination-item").count(), 4);
    const initial = await carousel
      .locator(prefix + "slide.is-active")
      .getAttribute("aria-label");
    await carousel.locator('[aria-label="Next media"]').click();
    const next = await carousel
      .locator(prefix + "slide.is-active")
      .getAttribute("aria-label");
    assert.notEqual(initial, next);
    await carousel.press("ArrowLeft");
    assert.equal(
      await carousel
        .locator(prefix + "slide.is-active")
        .getAttribute("aria-label"),
      initial,
    );
    await p.waitForFunction(
      ({ selector, initial }) => document.querySelector(selector).getAttribute("aria-label") !== initial,
      { selector: '[data-media-slot="service-layer-0"] .map-project-detail-section-c-conclusion-carousel-slide.is-active', initial },
      { timeout: 10000 },
    );
    await p.screenshot({ path: "/tmp/norrtag-veritas-carousel-desktop.png" });
    await p.locator("#map-project-inline-close").click();
    await p.waitForTimeout(350);
    const touch = await b.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await touch.goto("http://127.0.0.1:4173/#map-project=norrtag");
    await touch.evaluate(() => document.fonts.ready);
    await touch.waitForTimeout(350);
    await touch.locator(".norrtag-opening .norrtag-hero-figure").scrollIntoViewIfNeeded();
    assert.equal(
      await touch.locator(".norrtag-opening .norrtag-hero-video").evaluate((v) => v.controls),
      false,
    );
    await touch.locator(".norrtag-hero-play").tap();
    await touch.waitForFunction(() => {
      const v = document.querySelector(".norrtag-hero-video");
      return !v.paused && v.currentTime > 0 && v.controls;
    });
    await touch.close();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: hover-only hero controls and play, continued playback on leave, equal visible research height and caption gaps at five widths, real-life fill, Veritas footer/control geometry, manual/keyboard/timed slides and cleanup.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
