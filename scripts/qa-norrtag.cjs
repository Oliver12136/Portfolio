/* Run against npx --yes http-server web -p 4173 -c-1. Playwright is QA-only. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os");
const qaDir =
  process.env.PORTFOLIO_QA_DIR ||
  path.join(os.tmpdir(), "portfolio-norrtag-qa");
fs.mkdirSync(qaDir, { recursive: true });
const url = "http://127.0.0.1:4173/";
async function load(page, slug) {
  await page.goto(url + "#map-project=" + slug);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}
async function systemMetrics(page, veritas) {
  return page.evaluate((veritas) => {
    const box = (selector) => {
      const e = document.querySelector(selector),
        r = e.getBoundingClientRect(),
        s = getComputedStyle(e);
      return {
        x: r.x,
        right: innerWidth - r.right,
        width: r.width,
        height: r.height,
        y: r.y,
        padding: s.padding,
        opacity: s.opacity,
      };
    };
    return {
      content: box(veritas ? "#map-project-detail-tag-1" : ".norrtag-metadata"),
      contentRight:
        veritas && innerWidth < 768
          ? innerWidth -
            document
              .querySelector(".map-project-detail-stage")
              .getBoundingClientRect().right +
            parseFloat(
              getComputedStyle(
                document.querySelector(".map-project-detail-stage"),
              ).paddingRight,
            )
          : innerWidth -
            document
              .querySelector(
                veritas ? "#map-project-detail-institute" : ".norrtag-metadata",
              )
              .getBoundingClientRect().right,
      header: box(".map-project-detail-header"),
      close: box("#map-project-inline-close"),
      icon: box("#map-project-inline-close .map-project-inline-close-icon"),
      pseudo: getComputedStyle(
        document.querySelector("#map-project-inline-close"),
        "::after",
      ).content,
    };
  }, veritas);
}
async function checkResponsive(browser) {
  const p = await browser.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  for (const w of [1440, 1280, 1080, 768, 390, 320]) {
    await p.setViewportSize({ width: w, height: 1000 });
    await load(p, "veritas");
    const reference = await systemMetrics(p, true);
    await load(p, "norrtag");
    const current = await systemMetrics(p, false);
    assert(
      Math.abs(current.content.x - reference.content.x) < 1,
      `${w}: left gutter differs: ${current.content.x} / ${reference.content.x}`,
    );
    assert(
      Math.abs(current.contentRight - reference.contentRight) < 1,
      `${w}: right gutter differs: ${current.contentRight} / ${reference.contentRight}`,
    );
    assert.equal(current.header.padding, reference.header.padding);
    assert.equal(current.close.right, reference.close.right);
    assert.equal(current.close.width, reference.close.width);
    assert.equal(current.icon.opacity, reference.icon.opacity);
    assert.equal(current.pseudo, "none");
    assert.equal(
      await p
        .locator(
          ".norrtag-touchpoint-details,.norrtag-reflection,.norrtag-documentation",
        )
        .count(),
      0,
    );
    assert.equal(
      await p
        .locator("#map-project-inline-scroll")
        .evaluate((e) => e.scrollWidth > e.clientWidth),
      false,
    );
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    const colors = await p
      .locator(".norrtag-findings")
      .evaluate((e) => ({
        background: getComputedStyle(e, "::before").backgroundColor,
        heading: getComputedStyle(e.querySelector("h3")).color,
        body: getComputedStyle(
          e.querySelector(".norrtag-pair p:not(.norrtag-insight-label)"),
        ).color,
        labels: [...e.querySelectorAll(".norrtag-insight-label")].map(
          (n) => getComputedStyle(n).color,
        ),
      }));
    assert.equal(colors.background, "rgb(36, 87, 169)");
    assert.equal(colors.heading, "rgb(255, 255, 255)");
    assert.equal(colors.body, "rgb(255, 255, 255)");
    assert.deepEqual(colors.labels, ["rgb(244, 188, 65)", "rgb(244, 188, 65)"]);
    await p
      .locator("#map-project-inline-scroll")
      .evaluate((e) => (e.scrollTop = 600));
    await p.waitForTimeout(250);
    assert.equal(
      await p
        .locator("#map-project-detail-title")
        .evaluate((e) => getComputedStyle(e).fontSize),
      w < 768 ? "16px" : "17.388px",
    );
    if (w === 1440 || w === 390) {
      await p
        .locator("#map-project-inline-scroll")
        .evaluate((e) => (e.scrollTop = 0));
      await p.waitForTimeout(200);
      await p.screenshot({ path: path.join(qaDir, `revised-${w}.png`) });
      await p.locator(".norrtag-findings").scrollIntoViewIfNeeded();
      await p.waitForTimeout(200);
      await p.screenshot({
        path: path.join(qaDir, `revised-findings-${w}.png`),
      });
    }
    console.log(
      w,
      "Veritas gutters/header/close match; blue findings, removals, collapse and overflow pass",
      current.content.x,
      current.contentRight,
    );
  }
  assert.deepEqual(errors, []);
  await p.close();
}
async function checkPlayback(browser, mobile = false) {
  const context = await browser.newContext({
    viewport: { width: mobile ? 390 : 1440, height: 1000 },
    hasTouch: mobile,
    isMobile: mobile,
  });
  const p = await context.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await load(p, "norrtag");
  const hero = p.locator(".norrtag-opening .norrtag-hero-video");
  assert(
    await hero.evaluate(
      (v) => v.paused && !v.controls && v.preload === "none" && !!v.poster,
    ),
  );
  const phones = p.locator(".norrtag-probe-video");
  assert.deepEqual(
    await phones.evaluateAll((vs) => vs.map((v) => v.dataset.mediaSlot)),
    ["probe-start", "probe-use", "probe-real-life"],
  );
  assert(
    await phones.evaluateAll((vs) =>
      vs.every(
        (v) =>
          v.paused &&
          v.muted &&
          v.defaultMuted &&
          v.volume === 0 &&
          !v.controls &&
          v.playsInline,
      ),
    ),
  );
  if (mobile) await p.locator(".norrtag-hero-play").tap();
  else await p.locator(".norrtag-hero-play").click();
  await hero.evaluate(
    (v) =>
      new Promise((resolve, reject) => {
        if (!v.paused && v.readyState >= 2) return resolve();
        v.addEventListener("playing", resolve, { once: true });
        setTimeout(
          () => reject(new Error("Concept video did not play")),
          10000,
        );
      }),
  );
  assert(await hero.evaluate((v) => !v.paused && v.controls));
  await hero.evaluate((v) => v.pause());
  await p.locator(".norrtag-phone-stage").scrollIntoViewIfNeeded();
  await p.waitForFunction(
    () =>
      [...document.querySelectorAll(".norrtag-probe-video")].every(
        (v) => !v.paused && v.currentTime > 0 && v.readyState >= 2,
      ),
    {},
    { timeout: 15000 },
  );
  if (!mobile) {
    await phones.first().hover();
    assert(await phones.first().evaluate((v) => v.paused));
    const time = await phones.first().evaluate((v) => v.currentTime);
    await p.waitForTimeout(350);
    assert.equal(await phones.first().evaluate((v) => v.currentTime), time);
    assert(await phones.nth(1).evaluate((v) => !v.paused));
    await p.mouse.move(5, 5);
    await p.waitForFunction(
      () => !document.querySelector(".norrtag-probe-video").paused,
    );
  }
  await p
    .locator("#map-project-inline-scroll")
    .evaluate((e) => (e.scrollTop = 0));
  await p.waitForFunction(() =>
    [...document.querySelectorAll(".norrtag-probe-video")].every(
      (v) => v.paused,
    ),
  );
  await p.locator(".norrtag-phone-stage").scrollIntoViewIfNeeded();
  await p.waitForFunction(() =>
    [...document.querySelectorAll(".norrtag-probe-video")].every(
      (v) => !v.paused,
    ),
  );
  await p.evaluate(
    () =>
      (window.qaOldVideos = [
        ...document.querySelectorAll("#map-project-norrtag-root video"),
      ]),
  );
  await p.locator("#map-project-inline-next").click();
  assert(await p.evaluate(() => window.qaOldVideos.every((v) => v.paused)));
  await p.waitForTimeout(300);
  await p.locator("#map-project-inline-prev").click();
  await p.waitForTimeout(300);
  assert(await p.locator("#map-project-norrtag-root").isVisible());
  await p.locator("#map-project-inline-close").click();
  assert(!(await p.locator("#map-project-inline-shell").isVisible()));
  assert.deepEqual(errors, []);
  console.log(
    mobile ? "Phone" : "Desktop",
    "actual concept video + 3 muted viewport videos, hover, scroll pause/resume, cleanup and navigation pass",
  );
  await context.close();
}
(async () => {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--disk-cache-size=1", "--media-cache-size=1"],
  });
  try {
    await checkResponsive(browser);
    await checkPlayback(browser);
    await checkPlayback(browser, true);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
