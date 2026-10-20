# Exclusion — local implementation

## Scope and references

- Main portfolio only; no React, deployment, DNS or Cloudflare changes.
- Screen 1: Figma `bZ2KX97AhnBTNLZ3PwfqKO`, `89:2383`.
- Screen 2: same file, `89:2418`.
- `web/exclusion.js` owns the interaction and isolated reading surface.
- `initLandingExclusionInline()` remains the integration entry point and uses the existing `data-landing-surface-state` and bubble pause/resume API. The obsolete submit-based game and legacy conversation fit calculations were replaced inside that entry point, not the bubble engine.
- `web/exclusion.css` scopes its rules to the experience. Existing homepage/map/detail CSS was not edited by this task.

## Artwork

Each committed input change reconciles the number of messages with the number of Unicode grapheme clusters. `Intl.Segmenter` handles modern browsers; the older-browser fallback groups combining marks, emoji modifiers, ZWJ sequences and regional-indicator flags. IME intermediate input is ignored until composition commits. Deletion removes newest messages first. Clearing the field removes everything immediately. A same-length replacement replays the latest rejection without changing its identity/placement or duplicating messages.

Rendering budget: **48 active messages**, regardless of device width. Up to 48 retiring nodes can remain for 190 ms (100 ms with reduced motion), then are removed. New edits clear prior retiring nodes. Pasting beyond 48 graphemes saturates the composition; deletion below 48 resumes one-to-one removal. Segmentation stops at the cap. The field itself is not truncated.

Seven treatments use five distinct font families: terminal, bureaucratic serif, damaged typewriter, condensed institutional text, stamps, sprayed marker and fragmented print. Positions/angles/scales derive from stable ordinal metadata. Resize changes container-relative geometry without randomizing messages. Entrances are short, never looping; reduced motion removes entrance jitter, scaling and displacement. Texture is a deterministic static porous SVG mask.

On desktop (at least 768 px, fine pointer and hover), the pointer-transparent message layer overprints all artwork content, including the input and why navigation. The close control remains operable above the artwork. Touch/mobile layouts retain input and reading-navigation priority. Large desktop treatments are amplified by 48%, with a 270 px cap, while early messages stay small. Messages are real DOM text, in an accessible labelled region with live announcements off. Typed values exist only in the live input and ephemeral reconciliation state. No fetch, analytics, logging, local/session storage or URL serialization is used. Closing clears the input and message state.

## Reading and navigation

The existing Exclusion panel is mounted at the body level to avoid transformed homepage containing blocks. Opening makes background surfaces inert, locks body scroll, and preserves the original scroll position. It contains the viewport-sized artwork followed by naturally scrolling editorial content. Desktop entry immediately focuses the native input. Blank-area clicks and typing keys restore input focus without synthesizing characters, preserving paste and IME behaviour. Leaving the first screen makes the input read-only and removes its focus; the why transition disables it immediately. Returning to the top restores desktop input focus. Mobile never automatically opens its keyboard. Wheel and trackpad scrolling use native continuous browser scrolling, without per-gesture travel caps or downward section snapping. Upward scrolling from inside the editorial page stops at its top, including inertia. A fresh upward gesture at that boundary returns to the artwork. Touch gestures follow the same upward boundary rule. Touch uses native scrolling with overscroll containment. Keyboard scrolling, Tab containment, Escape, hash/history, focus and original body styles are restored on close.

VisualViewport resize/offset events update the reading surface. Below 440 visible pixels, compact styles preserve the input, instructions and navigation when a mobile keyboard reduces available height.

## Original assets and licensing

`web/assets/Exclusion/editorial/` contains actual Figma exports:

- `experience-comic@3x.png` — `96:2531` (original composed comic, not a screenshot of the page).
- `uyghur@3x.png` — `96:2639` (original dictionary-style artwork).
- `privilege-hazard@3x.png` — `89:2457` (the exact visible image crop).
- `beyond-default@3x.png` — `97:2777` (original artwork).
- `close.svg`, `arrow-down.svg`, `arrow-up.svg` — supplied vector assets.

The four illustrations were re-exported from Figma at 3× (1836×1029), approximately 885 KiB combined. New @3x URLs avoid reuse of cached low-resolution exports. They render at the 612:343 design ratio without stretching and use existing branded image loading and lazy loading. The text outside those illustrations is HTML and matches the supplied Figma copy.

New font files are self-hosted WOFF2, approximately 92 KiB combined, with `font-display: swap` and loaded only when used:

- Anton: SIL OFL, https://github.com/google/fonts/tree/main/ofl/anton
- Special Elite: Apache 2.0, https://github.com/google/fonts/tree/main/apache/specialelite
- Permanent Marker: Apache 2.0, https://github.com/google/fonts/tree/main/apache/permanentmarker

Corresponding licenses are included beside the font files. Static UI continues to use Atkinson Hyperlegible.

## Verification

Run the local server from the repository root:

```sh
npx --yes http-server web -p 4173 -c-1
node --check web/responsive.shared.js
node --check web/exclusion.js
node scripts/qa-exclusion.cjs
```

The QA script uses the existing Playwright installation at `/tmp/portfolio-qa/node_modules/playwright` and system Chrome; its output directory defaults to `/tmp/portfolio-exclusion-qa`.

Verified in Chrome via Playwright:

- 1512×900 plus all requested sizes: 1440×900, 1280×800, 1024×768, 820×600, 768×1024, 430×932, 390×844, 375×667, 320×568, and 844×390 landscape.
- Empty, 4-, 10-, 20-character and cleared screenshots reviewed on desktop/mobile.
- One-character entry, deletion, selection replacement, actual clipboard paste, multi-codepoint emoji, flags, combining accents, middle dot, Chinese composition events, 10,000-character paste budget.
- Stable retained message identities/positions across resize, seven styles, font loading, exit cleanup and reduced motion.
- Controls remain operable, 3× image sources and geometry, scroll isolation, wheel boundary, keyboard scrolling, history, Escape and focus restoration.
- Desktop auto-focus/native typing without an initial click, focus recovery, deletion, why-transition and reading isolation, return auto-focus, desktop overprinting and stronger scale.
- Separate touch/mobile-context checks verified no automatic keyboard focus, input click priority above the text and no automatic focus on return.
- A separate CDP touch-swipe check confirmed native touch scrolling and background containment.
- 390×300 focused-input viewport confirmed compact controls. This simulates keyboard-reduced space; no physical iOS/Android keyboard or native OS IME was tested.
- Homepage geometry compared with pre-task source at 1440, 820 and 390 px. The original bubble motion function hash is unchanged.

Production deployment was explicitly authorized and completed on 2026-10-20 after the native-scroll correction. Cloudflare version: `8e99b534-f1e7-4696-bf5b-3289ea714dd9`. Safari-specific rendering and physical mobile keyboard behaviour still need device-level review.
