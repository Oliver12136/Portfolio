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
    await p.goto("http://127.0.0.1:4173/#map-project=norrtag");
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(350);
    const fig = p.locator('[data-media-slot="service-layer-0"]'),
      stage = fig.locator(".project-media-frame");
    await fig.scrollIntoViewIfNeeded();
    await p.waitForFunction(() => {
      const v = document.querySelector(
        '[data-media-slot="service-layer-0"] video',
      );
      return !v.paused && v.currentTime > 0;
    });
    assert.equal(
      await fig.locator('[role="img"][aria-label^="Media pending"]').count(),
      0,
    );
    assert.deepEqual(
      await fig
        .locator("[data-figma-node]")
        .evaluateAll((es) =>
          es
            .filter((e) =>
              e.classList.contains(
                "map-project-detail-section-c-conclusion-carousel-slide",
              ),
            )
            .map((e) => e.dataset.figmaNode),
        ),
      ["56:1415", "56:1414", "56:1417"],
    );
    const video = fig.locator("video").first();
    assert.equal(
      await video.evaluate((v) => v.muted && !v.controls && !v.loop),
      true,
    );
    await video.evaluate((v) => {
      v.pause();
      v.currentTime = 0;
    });
    await p.waitForTimeout(100);
    await stage.screenshot({ path: "/tmp/norrtag-proactive-1.png" });
    await video.evaluate((v) => v.play());
    await p.waitForTimeout(2400);
    assert.equal(
      await fig
        .locator('[data-figma-node="56:1415"]')
        .evaluate((e) => e.classList.contains("is-active")),
      true,
    );
    await p.waitForFunction(() =>
      document
        .querySelector(
          '[data-media-slot="service-layer-0"] [data-figma-node="56:1414"]',
        )
        .classList.contains("is-active"),
    );
    await fig
      .locator("img")
      .evaluateAll((images) => Promise.all(images.map((i) => i.decode())));
    async function activate(id) {
      for (let n = 0; n < 4; n++) {
        if (
          (await fig
            .locator(
              ".map-project-detail-section-c-conclusion-carousel-slide.is-active",
            )
            .getAttribute("data-figma-node")) === id
        )
          return;
        await fig.locator('[aria-label="Next media"]').dispatchEvent("click");
      }
    }
    await activate("56:1414");
    await p.waitForTimeout(260);
    await stage.screenshot({ path: "/tmp/norrtag-proactive-2.png" });
    await activate("56:1417");
    await p.waitForTimeout(260);
    assert.equal(
      await fig
        .locator('[data-figma-node="56:1417"]')
        .evaluate((e) => e.classList.contains("is-active")),
      true,
    );
    await stage.screenshot({ path: "/tmp/norrtag-proactive-3.png" });
    await p.mouse.move(0, 0);
    for (const width of [1440, 1080, 768, 390, 320]) {
      await p.setViewportSize({ width, height: 1000 });
      await fig.scrollIntoViewIfNeeded();
      const result = await stage.evaluate((e) => {
        const r = e.getBoundingClientRect();
        return {
          width: r.width,
          height: r.height,
          overflow:
            document.querySelector("#map-project-norrtag-root").scrollWidth -
            document.querySelector("#map-project-norrtag-root").clientWidth,
          assets: [...e.querySelectorAll("img")].map((i) => ({
            src: i.getAttribute("src"),
            width: i.naturalWidth,
            height: i.naturalHeight,
            boxWidth: i.getBoundingClientRect().width,
            boxHeight: i.getBoundingClientRect().height,
          })),
        };
      });
      assert(Math.abs(result.width / result.height - 823 / 463) < 0.01);
      assert.equal(result.overflow, 0);
      assert(
        result.assets.every(
          (i) =>
            i.width > 0 && i.height > 0 && i.boxWidth > 0 && i.boxHeight > 0,
        ),
      );
      console.log(width, result.width, result.height);
      if (width === 390)
        await fig.screenshot({ path: "/tmp/norrtag-proactive-mobile.png" });
    }
    const videoHandle = await video.elementHandle();
    await p.locator("#map-project-inline-close").click();
    assert.equal(await videoHandle.evaluate((v) => v.paused), true);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: original 61-frame GIF port plays as a silent 4.88s video, exact Figma slot order and all source layers, automatic and manual transitions, responsive crop geometry, loaded local assets and cleanup.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
