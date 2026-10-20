# Everyone’s on Board — current implementation

Work remains on `codex/norrtag`. The initial clean working tree was checked and `git fetch origin` completed before implementation. The docs-only remote design-contract branch was merged without replacing the current website code. No production deployment or DNS change has been made.

The current owner instructions take precedence over the earlier task brief and visual revision: project composition follows the supplied Figma; system-level content insets, header and close control follow Veritas exactly. The Reflection section, the entire Project documentation section, and the three Service touchpoints disclosures have been removed from the rendered page.

## Shared system UI

The existing shell, internal scroll surface, collapsing title, original close image/control, previous/next navigation and one-click project entry remain in use. Norrtåg no longer overrides the system header padding, title font or close glyph. Its body uses the canonical Veritas stage gutters and breakpoints, while blue narrative backgrounds remain full bleed.

Reference: https://www.figma.com/design/bZ2KX97AhnBTNLZ3PwfqKO/WEB?node-id=5-2259&m=dev

The research, research findings and workshop form a continuous #2457A9 field. Findings headings/body are white; Insight 01 and Insight 02 use #F4BC41. The service rows and three-column prototype composition retain their Figma visual structure.

## Actual video behavior

- Hero: displays `cover/figma-hero.png` as its poster, with no autoplay or initial control UI. Clicking its transparent play hit area starts `cover/Concept Video_Everyone's On Board_Group 4.mp4` and exposes native playback controls.
- Phones, left to right: start, use, real life. They play only while at least 20% visible inside the existing detail scroll container. They loop, are completely silent, use playsinline, and show no native video controls. Mouse entry pauses that video; mouse exit resumes it if still visible. Touch input is not treated as hover.
- Leaving the viewport pauses the phone videos. Hiding the document also pauses them. Closing or navigating away pauses media, disconnects the visibility observer and removes listeners.

The supplied start/use files in the repository are macOS aliases. They resolved to `/Applications/start.MP4` and `/Applications/use.MP4`. Their actual video content was converted into self-contained H.264 playback files under the project directory. `reallife.MOV` was also converted to H.264. These three playback files have no audio streams. The originals and aliases were preserved; the website never needs to access `/Applications`.

## Files

- `web/index.html`: existing extension entry, root and script/style references.
- `web/responsive.shared.js`: existing project registration, classifications and shell/chrome integration.
- `web/norrtag.content.js`: project copy and Figma composition data.
- `web/norrtag.media.js`: explicit replacement-slot manifest, supplied Figma evidence and actual video paths.
- `web/norrtag.js`: scoped renderer plus click/viewport/hover media lifecycle.
- `web/norrtag.css`: scoped composition, Veritas-equivalent body gutters, and media styling.
- `web/project-media.js`: shared configurable image/video/mixed gallery component.
- `scripts/qa-norrtag.cjs`: responsive/system-UI comparisons and actual desktop/touch video tests.
- `NORRTAG_MEDIA.md`: file and slot instructions.

The imported Figma images and regular project-scoped font remain unchanged. The regular font and OFL license came from https://github.com/googlefonts/atkinson-hyperlegible. Existing homepage and other project font resolution remain unchanged.

## Verification

Serve from the repository root with `npx --yes http-server web -p 4173 -c-1`. Run against installed Chrome with Playwright installed as a QA-only tool:

```sh
npm install --prefix /tmp/portfolio-norrtag-tools playwright
PLAYWRIGHT_MODULE=/tmp/portfolio-norrtag-tools/node_modules/playwright node scripts/qa-norrtag.cjs
```

The QA script compares Norrtåg to the actual Veritas page at 1440, 1280, 1080, 768, 390 and 320px: left/right body gutters, header padding, close control dimensions/insets, original icon visibility and absence of the custom close pseudo-element. It also verifies the blue findings/white copy/yellow labels, removed DOM sections, no horizontal overflow, title collapse, actual hero playback, three silent ordered videos, viewport pause/resume, mouse hover pause, touch playback, close and previous/next navigation. Screenshots go to the OS temporary folder under `portfolio-norrtag-qa/`.

Actual checks use Chrome with desktop and touch-device emulation. Safari, Firefox and physical devices are not claimed as tested. JavaScript syntax checks and `git diff --check` are also run.

## Map entry revision

The entry now uses four shared map cells in the supplied 2×3 staircase shape, at desktop column 20 / row 12, aligned with Veritas and eight cells to its right at the reference viewport. Mobile uses column 20 / row 23. Narrow desktop scaling keeps the new entry outside the existing Veritas footprint. Other project positions are unchanged.

Hover uses the existing map slideshow, crossfade, progress pagination and dismissal behavior. Its current order is the supplied main image, prototype-process video, captionless research collage with three live videos, and the two-photo workshop composition. Shared builders render both detail and preview compositions; no background panel is added. The separate ProjectMedia hover UI and grey thumbnail-container fill have been removed. One-click detail opening and category priorities remain unchanged.

`scripts/qa-norrtag-map.cjs` compares actual block styles and preview controls to Woodpecker, checks reference placement, timed slides, one-click opening, overlap at 1440/1080/768/390/320px, and all three category priorities in Chrome. Set `PORTFOLIO_QA_SCREENSHOTS=1` to save a desktop screenshot.

## Media proportion correction

The real-life original has a -90° display rotation. The playback derivative was regenerated with automatic source rotation and proportional scaling to 720×1280, square pixels, silent H.264. Phone videos now use contain. A low-specificity shared image/video contain default prevents unconstrained elements from using fill; three explicit fill crop rules now use cover while retaining crop boxes. Existing explicit cover/contain choices remain authoritative.

`scripts/qa-norrtag-composed-preview.cjs` checks the exact four-slide sequence, actual video playback and slide transition, captionless transparent compositions, paused detached videos, portrait metadata, responsive detail rendering and loaded DOM media proportions.

## Spacing review

Removed the fixed 202px insights row height and stacked section margins. Measured at 1440/1080/768px, research → insights and insights → workshop now have 64px content gaps (previously 120px and 130–160px), and workshop → service has 96px (previously 120px). At 390/320px these gaps are 48/48/72px; service → prototype is 48px. Insight label → title is 8px. The unused fixed prototype-introduction height was removed. Chrome measurements reported no horizontal overflow at all five widths, and desktop/mobile screenshots were reviewed.

## Hero and research alignment / Veritas carousel correction

The hero now shows the central play button and native controls on hover or keyboard focus, hides controls on pointer exit, and keeps playback running. Touch exposes controls on interaction. The research phone columns no longer have extra top padding or borders: their video rectangles and the poster crop now share the same height and caption gap at 1440/1080/768/390/320px. Real-life video uses explicit `object-fit: fill` per the latest owner request; other phone videos use cover.

Service rows now build the actual Veritas conclusion-carousel DOM variant through ProjectMedia and initialize the shared Veritas controller. The shared CSS defines media ratio, progress pagination, footer spacing, chevrons and button dimensions for both projects. Norrtåg uses dark footer controls against its white page and yellow progress. Galleries auto-advance only in view and release timers, video events and observers on detail cleanup. Pending service slots remain pending.

`scripts/qa-norrtag-controls.cjs` checks hover/rest video controls, actual playback, five-width research geometry and caption alignment, real-life fill, Veritas footer/control dimensions, manual/keyboard/timed slides, and touch playback.
