# Everyone’s on Board — media handoff

Most original replacement slots remain pending; the map entry, hero and three research-phone videos are now configured. The Figma correction also includes 12 supplied evidence images as `window.NorrtagFigmaAssets`, used by the main composition. Grey frames are retained wherever the Figma itself has pending media. Pending replacement paths are not requested.

## Adding real files

1. Copy files into the folders below. Exact suggested filenames are documented as `intendedPath` in `web/norrtag.media.js`; change the extension to match the original if needed.
2. Set the containing slot’s `pending` to `false`. For each available item set `pending: false` and `src: "./assets/projects/norrtag/..."`. Keep unavailable items pending. `intendedPath` is documentation, never a runtime request.
3. Use item `type: "image"` or `type: "video"`. Keep stable ascending `order` values. Add/remove items freely in carousel and mixed slots; a one-item gallery has no navigation controls.
4. Supply accurate `alt` and optional external `caption`. Video items accept `poster`, `captions` (WebVTT path), `language`, and `captionsLabel`. Image items can set `viewerSrc` for a high-resolution version.
5. Run local QA again. Static hosting cannot discover arbitrary directory contents. On the second pass Codex should inspect the files, match slots, update the explicit manifest, preserve order, and revalidate.

Images accept browser-supported WebP, PNG, JPEG, AVIF and SVG. Videos accept browser-compatible MP4/WebM; final codecs still require validation. Mixed slots accept any ordered combination. Inactive slides are not mounted or preloaded. Videos use native controls, `playsinline`, `preload="none"`, and no autoplay.

## Media inventory

All folders are relative to **`web/assets/projects/norrtag/`**. The map entry, hero and three phone-video slots are configured; other replacement slots remain **pending**. Proportions are provisional until final evidence arrives. Images and videos use `contain` so interfaces are not cropped.

| Slot ID | Folder | Kind / accepted format | Aspect ratio | Initial items | Requirement |
| --- | --- | --- | --- | ---: | --- |
| `entry` | `cover/` | carousel · images | 16 / 9 | 4 | Required |
| `hero-service` | `cover/` | video · MP4 | 697 / 379 | 1 | Required |
| `hero-prototype` | `cover/` | mixed · images/MP4/WebM | 669.657 / 414 | 1 | Required |
| `research` | `research/interviews/` | carousel · images | 16 / 9 | 3 | Required |
| `min-vag` | `research/min-vag/` | carousel · images | 16 / 9 | 1 | Required |
| `workshop` | `research/workshop/` | carousel · images | 16 / 9 | 3 | Required |
| `finding-information` | `findings/` | image · WebP/PNG/JPEG/AVIF/SVG | 16 / 9 | 1 | Required |
| `finding-human` | `findings/` | image · WebP/PNG/JPEG/AVIF/SVG | 16 / 9 | 1 | Required |
| `puzzling-for-travel` | `concepts/` | image · WebP/PNG/JPEG/AVIF/SVG | 16 / 9 | 1 | Required |
| `peoples-norrtag` | `concepts/` | image · WebP/PNG/JPEG/AVIF/SVG | 16 / 9 | 1 | Required |
| `everyone-on-board` | `concepts/` | image · WebP/PNG/JPEG/AVIF/SVG | 16 / 9 | 1 | Required |
| `trip-planning` | `service/proactive-data/` | mixed · images/MP4/WebM | 9 / 16 | 1 | Required |
| `gathered-trip` | `service/proactive-data/` | mixed · images/MP4/WebM | 9 / 16 | 1 | Required |
| `train-displays` | `service/proactive-data/` | mixed · images/MP4/WebM | 16 / 9 | 1 | Required |
| `on-train-device` | `service/announcements/` | mixed · images/MP4/WebM | 4 / 3 | 1 | Required |
| `app-announcements` | `service/announcements/` | mixed · images/MP4/WebM | 9 / 16 | 1 | Required |
| `trip-chat` | `service/communication/` | mixed · images/MP4/WebM | 9 / 16 | 1 | Required |
| `chat-channel` | `service/communication/` | mixed · images/MP4/WebM | 4 / 3 | 1 | Required |
| `trip-update` | `service/communication/` | mixed · images/MP4/WebM | 9 / 16 | 1 | Required |
| `announcement-demo` | `service/announcements/` | video · MP4/WebM, optional VTT | 16 / 9 | 1 | Optional |
| `blueprint` | `blueprint/` | image · WebP/PNG/JPEG/AVIF/SVG | 16 / 9 | 1 | Required |
| `prototype-demo` | `prototype/demo/` | video · MP4/WebM, optional VTT | 16 / 9 | 1 | Required |
| `physical` | `prototype/physical/` | carousel · images | 4 / 3 | 1 | Required |
| `staff-console` | `prototype/staff-console/` | mixed · images/MP4/WebM | 4 / 3 | 1 | Required |
| `passenger-app` | `prototype/passenger-app/` | mixed · images/MP4/WebM | 9 / 16 | 1 | Required |
| `architecture` | `prototype/architecture/` | image · WebP/PNG/JPEG/AVIF/SVG | 2 / 1 | 1 | Required |

## Ordering and missing evidence

- Entry uses `main.png` → `PROTOTYPE_PROCESS2 2.MP4` → the captionless probe-artifact/three-video composition → the two-photo workshop composition. `NorrtagMapPreview` derives its ordered media from `NorrtagMedia.entry` and keeps the existing slideshow and progress pagination. Compositions have transparent backgrounds. Research videos are live, silent, and cleaned up when their slide leaves.
- Research: train interviews → field/street research → journey mapping. `min-vag` is the separate probe slot alongside that gallery.
- Workshop: participants → train activities → outputs/documentation. Additional images can be appended with increasing `order` values.
- The service proposal includes eight touchpoints. The functioning prototype is the separate staff console, physical touchpoint and passenger app under “Making It Real”.
- Supply the two hero assets, research/probe/workshop evidence, both finding visuals, three original concept-development visuals, all eight service-touchpoint visuals, the original high-resolution blueprint, prototype demo, physical-device gallery, console/app recordings or screenshots, and verified architecture diagram. Announcement demonstration is optional.
- `architecture` deliberately remains pending: supply the original diagram or verified technical relationships before drawing text and lines. No protocols or network topology have been invented.
- `blueprint` supports the existing full-size portfolio viewer, and horizontal exploration on phones. No blueprint data has been redrawn.
- Add WebVTT captions where speech conveys essential information.
- Individual contribution stays `null` in `web/norrtag.content.js`; fill it when responsibilities are confirmed. No personal credits have been invented.

## Supplied Figma evidence

`NorrtagFigmaAssets` in the same manifest records each key's local `src`, source `nodeId`, `alt` text and `pending: false`. These are the existing design's evidence images, not temporary fixtures. Update those paths to replace the corresponding collage/phone evidence while preserving the Figma crop regions. `hero-service`, `min-vag`, and the first two workshop item replacements are also picked up by the corresponding main-composition media once explicitly activated.

| Key | Local path under `web/assets/projects/norrtag/` | Type |
| --- | --- | --- |
| hero | `cover/figma-hero.png` | Image |
| route | `research/interviews/figma-route.png` | Image |
| poster | `research/min-vag/figma-poster.png` | Image |
| basket | `research/min-vag/figma-probe-basket.png` | Image |
| token | `research/min-vag/figma-probe-token.png` | Image |
| phone1 | `research/interviews/figma-phone-1.png` | Image |
| phone2 | `research/interviews/figma-phone-2.png` | Image |
| phone3 | `research/interviews/figma-probe-phone.png` | Image |
| workshop1 | `research/workshop/figma-workshop-layer-1.png` | Image, lower source fill |
| workshop2 | `research/workshop/figma-workshop-layer-2.png` | Image, middle source fill |
| workshop3 | `research/workshop/figma-workshop-left.png` | Image, visible top source fill |
| workshop4 | `research/workshop/figma-workshop-right.png` | Image |

The original slot definitions remain in the manifest as reusable configuration, but Project documentation and Reflection were removed from the rendered page at the owner’s request. Main service rows combine each layer's touchpoint slots into one ordered mixed gallery to retain the Figma media rectangle proportions.

## Configured video slots — current owner revision

| Slot | Local source under `web/assets/projects/norrtag/` | Playback |
| --- | --- | --- |
| `hero-service` | `cover/Concept Video_Everyone's On Board_Group 4.mp4` | Click to start; existing `cover/figma-hero.png` poster; controls appear after click |
| `probe-start` | `research/min-vag/start-playback.mp4` | Left phone; muted viewport playback, loop, hover pause, no controls |
| `probe-use` | `research/min-vag/use-playback.mp4` | Middle phone; muted viewport playback, loop, hover pause, no controls |
| `probe-real-life` | `research/min-vag/reallife-playback.mp4` | Right phone; muted viewport playback, loop, hover pause, no controls |

The playback MP4s are H.264 derivatives with no audio stream. Supplied originals are preserved. `start.MP4` and `use.MP4` were macOS aliases; their resolved actual media was used to build the self-contained playback files. Runtime paths point only to repository files, not alias targets outside the repository.

The real-life playback derivative was regenerated from the original rotation-aware source at 720×1280 with square pixels. It preserves the original portrait ratio; phone videos use `object-fit: contain`. The earlier landscape derivative must not be reused.

Latest interaction revision: the hero reveals its play affordance and native controls on hover/focus (touch reveals controls on interaction). Real-life intentionally uses `object-fit: fill` to fill its rounded frame, as explicitly requested; the other phone videos use cover. Source pixels remain the corrected 720×1280 portrait derivative. Service galleries use the shared Veritas conclusion-carousel controls; pending sources have not been invented.

The blueprint slot is now configured with `blueprint/ServiceBlueprint.png` (3840×2160). It appears full-width directly after the service-introduction paragraph, right-aligned within the content gutters, with click-to-enlarge. Paragraph/image gaps are 16px desktop / 12px mobile; image/next-row gaps are 48px / 32px. Norrtåg detail and map-preview progress fill now use theme blue #2457A9.

## Proactive Data & Route Clarity — supplied Figma slides

The first service carousel now uses `window.NorrtagProactiveSlides`, in the requested order:

1. `56:1415`: original `figma-onboard-display.gif` (61 frames, 4.88s), preserved unchanged. Runtime uses a silent H.264 `figma-onboard-display.mp4` derivative with the same timing, waits for playback to end, then advances.
2. `56:1414`: `figma-station-display.png`, with the source image-fill crop from Figma.
3. `56:1417`: `figma-carriage-base.png` and `figma-carriage-overlay.png`, preserving both source-fill layers, their order and crop transforms.

All files are under `service/proactive-data/`. The viewport is 823:463. Each crop layer records its Figma node and percentage geometry; temporary Figma URLs are absent from runtime sources. This overrides only the first service carousel; the original replacement-slot definitions remain available for future content.

`scripts/qa-norrtag-proactive.cjs` verifies actual animation playback past the ordinary 2s image interval, automatic/manual transitions, exact Figma slot ordering, all source layers loaded locally, five responsive widths, no horizontal overflow and media cleanup. Desktop slide captures and a mobile carousel capture were compared with the supplied design screenshots.
