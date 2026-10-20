const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--disk-cache-size=1", "--media-cache-size=1"],
  });
  try {
    const page = await browser.newPage({
        viewport: { width: 1465, height: 838 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:4173/");
    await page.evaluate(() => (window.NorrtagMapPreview.baseIntervalMs = 3500));
    await page.locator("#homepage---right").scrollIntoViewIfNeeded();
    await page
      .locator('[data-node-id="norrtag"] .mypractice-map-block')
      .first()
      .hover();
    const preview = page.locator("#map-center-hover-preview");
    await page.waitForFunction(() =>
      [
        ...document.querySelectorAll("#map-center-hover-preview-slideshow img"),
      ].some(
        (i) =>
          i.classList.contains("is-visible") &&
          i.src.endsWith("/main.webp") &&
          i.naturalWidth === 1601,
      ),
    );
    assert.equal(
      await preview.evaluate(
        (e) =>
          getComputedStyle(
            e.querySelector(
              ".map-center-hover-preview-slideshow-img.is-visible",
            ),
          ).objectFit,
      ),
      "contain",
    );
    if (process.env.PORTFOLIO_QA_SCREENSHOTS === "1") await page.screenshot({ path: "/tmp/norrtag-preview-1-main.png" });
    const movie = page.locator("#map-center-hover-preview-slideshow-video");
    await page.waitForFunction(
      () => {
        const v = document.querySelector(
          "#map-center-hover-preview-slideshow-video",
        );
        return (
          v.src.includes("prototype-process.mp4") && !v.paused && v.currentTime > 0
        );
      },
      null,
      { timeout: 15000 },
    );
    if (process.env.PORTFOLIO_QA_SCREENSHOTS === "1") await page.screenshot({ path: "/tmp/norrtag-preview-2-prototype.png" });
    await movie.evaluate((v) => (v.currentTime = v.duration - 0.15));
    const composition = preview.locator(".norrtag-preview-composition");
    await page.waitForFunction(() => {
      const vs = document.querySelectorAll(
        ".norrtag-preview-composition video",
      );
      return (
        vs.length === 3 &&
        [...vs].every((v) => v.videoWidth > 0 && !v.paused && v.currentTime > 0)
      );
    });
    assert.equal(await composition.locator("figcaption").count(), 0);
    assert.equal(await composition.locator(".norrtag-crop img").count(), 3);
    const real = composition.locator('[data-media-slot="probe-real-life"]');
    assert.deepEqual(
      await real.evaluate((v) => ({
        w: v.videoWidth,
        h: v.videoHeight,
        fit: getComputedStyle(v).objectFit,
        muted: v.muted,
        controls: v.controls,
      })),
      { w: 720, h: 1280, fit: "fill", muted: true, controls: false },
    );
    assert.equal(
      await composition.evaluate((e) => getComputedStyle(e).backgroundColor),
      "rgba(0, 0, 0, 0)",
    );
    if (process.env.PORTFOLIO_QA_SCREENSHOTS === "1") await page.screenshot({ path: "/tmp/norrtag-preview-3-research.png" });
    const detached = await real.elementHandle();
    const longestDuration = await composition.locator("video").evaluateAll(videos => Math.max(...videos.map(video => video.duration)));
    const researchStarted = Date.now();
    await page.waitForTimeout(4500);
    assert.equal(await composition.locator("video").count(), 3, "Research must outlast the ordinary image-slide interval");
    await composition
      .locator(".norrtag-workshop-media")
      .waitFor({ state: "visible", timeout: 45000 });
    assert(Date.now() - researchStarted >= (longestDuration - 2) * 1000, "Research must remain until the longest video has played");
    console.log("Longest research video:", longestDuration, "seconds; observed preview:", (Date.now() - researchStarted) / 1000, "seconds");
    assert.equal(
      await composition.locator(".norrtag-workshop-crop").count(),
      2,
    );
    assert.equal(await composition.locator("figcaption").count(), 0);
    assert.equal(await detached.evaluate((v) => v.paused), true);
    if (process.env.PORTFOLIO_QA_SCREENSHOTS === "1") await page.screenshot({ path: "/tmp/norrtag-preview-4-workshop.png" });
    await page.mouse.move(0, 0);
    await page
      .locator('[data-node-id="norrtag"] .mypractice-map-block')
      .first()
      .click();
    const root = page.locator("#map-project-norrtag-root");
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      const v = root.locator('[data-media-slot="probe-real-life"]');
      await v.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => {
        const v = document.querySelector(
          '#map-project-norrtag-root [data-media-slot="probe-real-life"]',
        );
        return v.videoWidth === 720 && v.videoHeight === 1280;
      });
      assert.equal(
        await v.evaluate((v) => getComputedStyle(v).objectFit),
        "fill",
      );
      if (width === 390)
        if (process.env.PORTFOLIO_QA_SCREENSHOTS === "1") await page.screenshot({ path: "/tmp/norrtag-detail-video-mobile.png" });
    }
    // Inspect loaded DOM media on the homepage and the actual detail page. Fill is safe only when the box already matches the intrinsic ratio.
    const stretched = await page.locator("img,video").evaluateAll((es) =>
      es.flatMap((e) => {
        const s = getComputedStyle(e),
          r = e.getBoundingClientRect(),
          w = e.naturalWidth || e.videoWidth,
          h = e.naturalHeight || e.videoHeight;
        if (
          e.dataset.mediaSlot === "probe-real-life" ||
          !w ||
          !h ||
          r.width < 1 ||
          r.height < 1 ||
          s.objectFit !== "fill"
        )
          return [];
        return Math.abs(r.width / r.height / (w / h) - 1) > 0.025
          ? [{ src: e.currentSrc, fit: s.objectFit }]
          : [];
      }),
    );
    assert.deepEqual(stretched, []);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: ordered main image, actual prototype playback, live captionless research composition, two-photo workshop composition, transparent surfaces, video cleanup, portrait source ratio and the requested real-life fill rendering.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
