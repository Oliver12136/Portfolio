/* Check the map entry against the existing Woodpecker block and slideshow UI. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict"),
  path = require("node:path"),
  os = require("node:os"),
  fs = require("node:fs");
const qaDir =
  process.env.PORTFOLIO_QA_DIR ||
  path.join(os.tmpdir(), "portfolio-norrtag-qa");
fs.mkdirSync(qaDir, { recursive: true });
async function hover(page, id) {
  const block = page
    .locator(`[data-node-id="${id}"] .mypractice-map-block`)
    .first();
  await block.hover();
  await page.waitForFunction(
    () =>
      !document.querySelector("#map-center-hover-preview").hidden &&
      document
        .querySelector("#map-center-hover-preview")
        .classList.contains("map-center-hover-preview--slideshow"),
  );
  await page.waitForTimeout(200);
}
async function previewUI(page) {
  return page.locator("#map-center-hover-preview").evaluate((e) => {
    const pager = e.querySelector(".map-center-hover-preview-pagination-item"),
      s = getComputedStyle(pager);
    return {
      className: e.className,
      customGallery: e.querySelectorAll(".project-media").length,
      arrowButtons: e.querySelectorAll("button").length,
      paginationVisible: !e.querySelector(
        "#map-center-hover-preview-pagination",
      ).hidden,
      pagerStyle: {
        width: s.width,
        height: s.height,
        border: s.border,
        borderRadius: s.borderRadius,
      },
      slides: e.querySelectorAll(".map-center-hover-preview-pagination-item")
        .length,
    };
  });
}
(async () => {
  const b = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--disk-cache-size=1", "--media-cache-size=1"],
  });
  try {
    const p = await b.newPage({ viewport: { width: 1465, height: 838 } });
    let errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("http://127.0.0.1:4173/");
    await p.locator("#homepage---right").scrollIntoViewIfNeeded();
    await p.waitForTimeout(500);
    await p.mouse.move(5, 5);
    const geometry = await p
      .locator('[data-node-id="norrtag"]')
      .evaluate((item) => {
        const s = getComputedStyle(item),
          r = item.getBoundingClientRect(),
          v = document
            .querySelector('[data-node-id="3139:21709"]')
            .getBoundingClientRect(),
          block = item
            .querySelector(".mypractice-map-block")
            .getBoundingClientRect();
        return {
          col: item.style.getPropertyValue("--col").trim(),
          row: item.style.getPropertyValue("--row").trim(),
          cells: [...item.querySelectorAll(".mypractice-map-block")].map(
            (b) => [
              b.style.getPropertyValue("--cx"),
              b.style.getPropertyValue("--cy"),
            ],
          ),
          width: r.width,
          height: r.height,
          cell: block.width,
          relativeToVeritas: {
            x: (r.x - v.x) / block.width,
            y: (r.y - v.y) / block.height,
          },
        };
      });
    assert.equal(geometry.col, "20");
    assert.equal(geometry.row, "12");
    assert.deepEqual(geometry.cells, [
      ["0", "0"],
      ["0", "1"],
      ["1", "1"],
      ["1", "2"],
    ]);
    assert(geometry.relativeToVeritas.x >= 8);
    assert(geometry.relativeToVeritas.y < -1);
    await p.locator('[data-node-id="norrtag"] img').evaluate((i) => i.decode());
    const blockStyles = await p.evaluate(() =>
      ["norrtag", "3139:17651"].map((id) => {
        const e = document.querySelector(
            `[data-node-id="${id}"] .mypractice-map-block`,
          ),
          s = getComputedStyle(e);
        return {
          background: s.backgroundColor,
          opacity: s.opacity,
          border: s.border,
          shadow: s.boxShadow,
          radius: s.borderRadius,
          width: s.width,
          height: s.height,
          pointerEvents: s.pointerEvents,
        };
      }),
    );
    assert.deepEqual(blockStyles[0], blockStyles[1]);
    await hover(p, "3139:17651");
    const existingUI = await previewUI(p);
    await p.mouse.move(5, 5);
    await hover(p, "norrtag");
    const projectUI = await previewUI(p);
    assert.equal(projectUI.className, existingUI.className);
    assert.equal(projectUI.customGallery, 0);
    assert.equal(projectUI.arrowButtons, existingUI.arrowButtons);
    assert.equal(projectUI.paginationVisible, true);
    assert.deepEqual(projectUI.pagerStyle, existingUI.pagerStyle);
    assert.equal(projectUI.slides, 4);
    const current = await p
      .locator("#map-center-hover-preview-slideshow")
      .evaluate((e) =>
        [...e.querySelectorAll("img")]
          .filter((i) => i.classList.contains("is-visible"))
          .map((i) => i.src)
          .join("|"),
      );
    await p.waitForTimeout(1800);
    const later = await p
      .locator("#map-center-hover-preview-slideshow")
      .evaluate((e) =>
        [...e.querySelectorAll("img")]
          .filter((i) => i.classList.contains("is-visible"))
          .map((i) => i.src)
          .join("|"),
      );
    assert.notEqual(later, current);
    await p
      .locator('[data-node-id="norrtag"] .mypractice-map-block')
      .first()
      .click();
    await p.waitForTimeout(300);
    assert(await p.locator("#map-project-norrtag-root").isVisible());
    await p.locator("#map-project-inline-close").click();
    await p.mouse.move(5, 5);
    await p.waitForTimeout(300);
    if (process.env.PORTFOLIO_QA_SCREENSHOTS === "1")
      await p.screenshot({
        path: path.join(qaDir, "map-norrtag-placement.png"),
      });
    for (const width of [1440, 1080, 768, 390, 320]) {
      await p.setViewportSize({ width, height: 1000 });
      await p.waitForTimeout(300);
      const collisions = await p.evaluate(() => {
        const n = document.querySelector('[data-node-id="norrtag"]'),
          hits = [];
        for (const item of document.querySelectorAll(
          ".mypractice-map-overlay-item",
        )) {
          if (item === n) continue;
          for (const a of n.querySelectorAll(".mypractice-map-block"))
            for (const c of item.querySelectorAll(".mypractice-map-block")) {
              const x = a.getBoundingClientRect(),
                y = c.getBoundingClientRect();
              if (
                Math.min(x.right, y.right) - Math.max(x.left, y.left) > 1 &&
                Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 1
              )
                hits.push(item.dataset.projectName);
            }
        }
        return hits;
      });
      // Figma 58:1858 deliberately joins the Norrtåg and BottleU shapes.
      assert.deepEqual(collisions.filter(name => name !== "BottleU"), [], `${width}: unexpected map collision`);
    }
    for (const filter of ["social", "interaction", "service"]) {
      await p.goto("http://127.0.0.1:4173/?work=" + filter);
      await p.waitForTimeout(300);
      assert.equal(
        await p
          .locator('[data-node-id="norrtag"]')
          .getAttribute("data-priority-rank"),
        "1",
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: screenshot-relative position, shared four-cell block styling, shared slideshow/pagination, timed slides, one-click opening, collision checks and category priorities.",
      geometry,
      projectUI,
    );
    await p.close();
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
