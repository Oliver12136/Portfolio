---
version: "alpha"
name: "oghuzhan.work portfolio — approved detail-page contract"
description: "Code-extracted design tokens and strict structural rules for the existing portfolio. The current Veritas case study is the canonical detail-page reference. This document does not authorize a redesign or deployment."
colors:
  primary: "#1B1B1B"
  title: "#161616"
  canvas: "#FFFFFF"
  site-canvas: "#F2F2F2"
  dark-section: "#0D0D0D"
  on-dark: "#F5F5F5"
  metadata: "#979797"
  muted-copy: "#989898"
  muted-chrome: "#DDDCDD"
  veritas-blue: "#467FC6"
  veritas-orange: "#D96C48"
  black: "#000000"
typography:
  detail-title:
    fontFamily: "Atkinson Hyperlegible"
    fontSize: 52.5px
    fontWeight: 400
    lineHeight: 57.75px
    letterSpacing: 0px
  detail-title-collapsed:
    fontFamily: "Atkinson Hyperlegible"
    fontSize: 17.388px
    fontWeight: 400
    lineHeight: 19.996px
    letterSpacing: 0px
  detail-title-mobile:
    fontFamily: "Atkinson Hyperlegible"
    fontSize: 36px
    fontWeight: 400
    lineHeight: 38px
    letterSpacing: 0px
  detail-title-mobile-collapsed:
    fontFamily: "Atkinson Hyperlegible"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 18px
    letterSpacing: 0px
  metadata:
    fontFamily: "Atkinson Hyperlegible"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0px
  lead:
    fontFamily: "Atkinson Hyperlegible"
    fontSize: 20px
    fontWeight: 400
    lineHeight: 30px
    letterSpacing: 0px
  section-statement:
    fontFamily: "Atkinson Hyperlegible"
    fontSize: 32px
    fontWeight: 400
    lineHeight: 48px
    letterSpacing: 0px
  caption:
    fontFamily: "Atkinson Hyperlegible"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 21.6px
    letterSpacing: 0px
  mobile-body:
    fontFamily: "Atkinson Hyperlegible"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 27px
    letterSpacing: 0px
  mobile-metadata:
    fontFamily: "Atkinson Hyperlegible"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 22.5px
    letterSpacing: 0px
rounded:
  square: 0px
  pager: 1px
  hotspot: 2px
spacing:
  micro: 5px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  media-gap: 28px
  mobile-section: 32px
  section: 40px
  header-height-collapsed: 45.359px
  section-wide: 60px
  section-end: 72px
components:
  site-canvas:
    backgroundColor: "{colors.site-canvas}"
    textColor: "{colors.primary}"
  detail-surface:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.primary}"
    rounded: "{rounded.square}"
  detail-header:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.title}"
    typography: "{typography.detail-title}"
    rounded: "{rounded.square}"
    padding: 19px 40px 24px 29px
  detail-header-collapsed:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.title}"
    typography: "{typography.detail-title-collapsed}"
    rounded: "{rounded.square}"
  detail-header-mobile:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.title}"
    typography: "{typography.detail-title-mobile}"
    rounded: "{rounded.square}"
    padding: 18px 72px 20px 20px
  detail-header-mobile-collapsed:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.title}"
    typography: "{typography.detail-title-mobile-collapsed}"
    rounded: "{rounded.square}"
  metadata:
    textColor: "{colors.metadata}"
    typography: "{typography.metadata}"
  lead-copy:
    textColor: "{colors.primary}"
    typography: "{typography.lead}"
  section-statement:
    textColor: "{colors.on-dark}"
    typography: "{typography.section-statement}"
  caption:
    textColor: "{colors.metadata}"
    typography: "{typography.caption}"
  dark-section:
    backgroundColor: "{colors.dark-section}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.square}"
    padding: 60px 0 72px
  muted-chrome:
    backgroundColor: "{colors.muted-chrome}"
    textColor: "{colors.primary}"
    rounded: "{rounded.square}"
  finding-toggle:
    backgroundColor: "{colors.dark-section}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.square}"
  inline-hotspot:
    backgroundColor: "{colors.veritas-blue}"
    rounded: "{rounded.hotspot}"
    padding: 0 4px
  map-city-hover:
    backgroundColor: "{colors.veritas-orange}"
    textColor: "{colors.black}"
    rounded: "{rounded.square}"
  pager:
    backgroundColor: "{colors.veritas-orange}"
    rounded: "{rounded.pager}"
  mobile-copy:
    textColor: "{colors.muted-copy}"
    typography: "{typography.mobile-body}"
  mobile-metadata:
    textColor: "{colors.metadata}"
    typography: "{typography.mobile-metadata}"
---

# Overview

This file is the implementation contract for the checked-out portfolio in this repository. It records the values actually declared in `web/index.html`, `web/responsive.shared.css`, and `web/responsive.shared.js`. The current Veritas case-study implementation is the canonical detail-page reference.

The keywords **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, and **UNVERIFIED** are normative:

- **MUST / REQUIRED**: a change is not acceptable unless the rule is satisfied.
- **MUST NOT**: prohibited without explicit approval from the portfolio owner.
- **SHOULD**: preserve unless project evidence requires a documented exception.
- **UNVERIFIED**: the value or asset cannot be proved from the current code and must not be invented.

Source-of-truth order:

1. The checked-out repository and its current source files.
2. This document as a code-extracted summary and guardrail.
3. Approved project-specific Figma/source media for content only.
4. A generated Stitch/Codex result is a proposal and never overrides items 1–3.

This document does **not** authorize a production deployment. A local preview, Git commit, Git push, or pull request is not deployment approval.

## Non-negotiable visual principles

- The homepage MUST retain its established visual appearance. Do not add subtitles, explanatory copy, badges, labels, onboarding UI, or extra buttons.
- A homepage project item MUST open its internal detail page with one click. Do not insert a confirmation step, teaser modal, or second CTA.
- Rich descriptions and demonstrations belong on detail pages, not on the homepage.
- Detail pages MUST remain editorial, flat, rectangular, and led by typography, media, white space, and full-bleed color fields.
- New case studies MUST reuse the existing detail shell before adding project-specific narrative sections.
- Do not normalize every project into cards or a generic UX case-study template.

# Colors

Use the colors exactly as declared:

| Token | Exact value | Required use | Source |
| --- | ---: | --- | --- |
| `{colors.site-canvas}` | `#F2F2F2` | Homepage/background outside detail content | `web/responsive.shared.css`, homepage rules |
| `{colors.canvas}` | `#FFFFFF` | Default detail surface, sticky header, scroll surface | `.map-project-inline-shell`, `.map-project-inline-scroll`, `.map-project-detail-topbar` |
| `{colors.primary}` | `#1B1B1B` | Standard body and section copy | detail text selectors |
| `{colors.title}` | `#161616` | Expanded/collapsed detail title and close icon | `.map-project-detail-title` and close control |
| `{colors.dark-section}` | `#0D0D0D` | Veritas research/evidence fields and dark chrome state | `.map-project-detail-section-a::before`, `.veritas-detail-section-c::before`, `.is-on-dark` |
| `{colors.on-dark}` | `#F5F5F5` | Copy and icons on dark fields | Veritas dark-section selectors |
| `{colors.metadata}` | `#979797` | Tags, credit, institute, hero captions | `.map-project-detail-meta-*`, `.map-project-detail-caption` |
| `{colors.muted-copy}` | `#989898` | Veritas supporting copy, labels, expanded findings, references | `.veritas-detail-*` supporting text |
| `{colors.muted-chrome}` | `#DDDCDD` | Existing muted chrome state | `.map-project-detail-topbar.is-on-muted`, navigation muted state |
| `{colors.veritas-blue}` | `#467FC6` | Veritas inline hotspots and finding plus marks only | `.veritas-detail-hotspot`, finding icon rules |
| `{colors.veritas-orange}` | `#D96C48` | Veritas map hover and active carousel pager only | map/pager selectors |
| `{colors.black}` | `#000000` | Hover text where explicitly declared | Veritas map hover selector |

Rules:

- Project colors are scoped to project evidence and interactions. `{colors.veritas-blue}` and `{colors.veritas-orange}` MUST NOT become global portfolio accents.
- Do not introduce gradients, glass effects, decorative tint systems, or new semantic colors without explicit approval.
- On dark sections, essential text MUST remain `{colors.on-dark}`. `{colors.muted-copy}` is reserved for supporting copy.

# Typography

## Font loading truth

- The primary family declared by the site is `"Atkinson Hyperlegible"` via `--typo-latin-family` in `web/responsive.shared.css`.
- `"Noto Sans Old Turkic"` is declared via `--typo-uyghur-family`.
- `"Inter"` appears in isolated non-Veritas selectors.
- The only `@font-face` rule verified in the current main stylesheet loads `"Zen Maru Gothic"`, normal style, weight `900`, from a remote WOFF URL.
- No `@font-face`, `<link>`, or bundled font asset that loads Atkinson Hyperlegible, its weights, Noto Sans Old Turkic, or Inter was verified in the current main page. Actual browser-resolved font files are therefore **UNVERIFIED**.
- CSS-requested numeric weights are exact declarations, but the availability of a matching installed/loaded face is **UNVERIFIED**.
- **Atkinson Hyperlegible Bold MUST NOT be introduced as a substitute for any existing role.** Do not add a bold face merely to satisfy a numeric weight or imitate another style.
- Do not recommend or silently introduce an alternative typeface.

## Global declared type tokens

These are exact custom-property values in `web/responsive.shared.css`:

| Role | Size | Weight | Line height | Letter spacing | Color |
| --- | ---: | ---: | ---: | ---: | --- |
| Global H1 token | `4rem` | `400` | `1` | selector-specific | `rgba(0,0,0,.75)` |
| Global H1 mobile token | `3.6rem` | `400` | `1` | selector-specific | `rgba(0,0,0,.75)` |
| Level 1 | `1.55rem` | `600` | `1.25` | `0` in body-copy rule | `rgba(0,0,0,.75)` |
| Level 2 | `1.15rem` | `450` | `1.4` | `0` in body-copy rule | `rgba(0,0,0,.75)` |
| Level 3 | `1rem` | `400` | `1.5` | `0` in body-copy rule | `rgba(0,0,0,.75)` |
| Large body | `2.66rem` | `430` | `1.56` | `0` in body-copy rule | `rgba(0,0,0,.78)` |
| Caption token | `.82rem` | `400` | `1.35` | selector-specific | `rgba(0,0,0,.46)` |
| Button token | `1.4rem` | `540` | `1.15` | selector-specific | inherited |
| Shop token | `1.2rem` | `400` | inherited | selector-specific | inherited |
| Audio token | `1.2rem` | `400` | inherited | selector-specific | inherited |

Do not use the generic H1–H9 fallback rule to replace page-specific selectors. Page-specific rules below are authoritative.

## Detail-page hierarchy

| Semantic role | Desktop | Mobile | Color | Source selector |
| --- | --- | --- | --- | --- |
| Page title (`h2`) | `52.5px / 57.75px`, `400`, `0` tracking | `36px / 38px`, `400`, `0` tracking | `#161616`; `#F5F5F5` over dark | `.map-project-detail-title` |
| Collapsed page title | `17.388px / 19.996px`, `400` | `16px / 18px`, `400` | follows chrome theme | header collapse custom properties |
| Metadata | `16px / 24px`, `400`, `0` tracking | `15px / 22.5px`, `400` | `#979797` | `.map-project-detail-meta-*` |
| Lead | `20px / 1.5`, `400` | `18px / 1.5`, `400` | `#1B1B1B` | `.map-project-detail-lead` |
| Hero caption | `16px / 1.35`, `400` | `15px / 1.35`, `400` | `#979797` | `.map-project-detail-caption` |
| Section A label (`h3`) | `20px / normal`, `400` | `18px / normal`, `400` | `rgba(245,245,245,.6)` | `.map-project-detail-section-a-title` |
| Section A statement | `32px / 1.5`, `400` | `22px / 1.5`, `400` | `#F5F5F5` | `.map-project-detail-section-a-body` |
| Section B scene title | `32px / 1.24`, `400` | responsive current rule; exact final computed value **UNVERIFIED** | `#1B1B1B` | `.map-project-detail-scene-title` |
| Section B question | `20px / normal`, `400` | preserve current responsive rule | `#1B1B1B` | `.map-project-detail-section-b-question` |
| Section C kicker | `20px / normal`, `400` | `18px / normal`, `400` | `#989898` | `.veritas-detail-section-c h3`, kicker selectors |
| Section C title | `32px / 1.5`, `400` | `22px / 1.4`, `400` | `#F5F5F5` | `.veritas-detail-section-c-title` |
| Section C supporting body | `20px / normal`, `400` | `18px / 1.45`, `400` | `#989898` | `.veritas-detail-section-c-body` |
| Finding toggle | `32px / 1.1`, `400` | `24px / 1.1`, `400` | `#F5F5F5` | `.veritas-detail-finding-heading` |
| Expanded finding copy | `20px / normal`, `400`, `-.4px` | `18px / 1.45`, `400`, `-.2px` | `#989898` | `.veritas-detail-finding-panel-rich` |
| Finding labels/list | `20px / 1.2`, `400`, `-.4px` | final phone rule `16px / 1.3`, `400`, `0` | label `#989898`, list `#F5F5F5` | finding label/list selectors |
| Conclusion body | `32px / 1.5`, `400` | `22px / 1.4`, `400` | `#F5F5F5` | `.veritas-detail-conclusion-body` |
| Reference item | `20px / 1.2`, `400`, `-.4px` | final phone rule `16px / 1.3`, `400`, `0` | `#989898`; links `#F5F5F5` | reference selectors |
| Bottom navigation | `17.388px / 19.996px`, `400` | preserve current rule | `#1B1B1B` or `#F5F5F5` | `.map-project-inline-nav-label` |

The title MUST remain regular weight. Hierarchy comes from size, position, contrast, and spacing—not synthetic bolding or a display-font substitution.

## Homepage approved values

These values document the approved homepage, but they are not an invitation to edit it:

| Element | Desktop/tablet (`min-width: 768px`) | Phone (`max-width: 767.98px`) | Source |
| --- | --- | --- | --- |
| Main homepage title | `52.5px / 1.1`, weight `400`, color `#161616` | `clamp(40px, 11.8vw, 58px) / 1.04`, weight `400`, color `#161616` | `#homepage---left .hero3042-title`; later `!important` desktop override is authoritative |
| Existing title copy | `44.2px / 1.2`, top margin `20.344px` | `clamp(19px, 5.65vw, 29px) / 1.2`, top margin `clamp(8px, 2.2vw, 12px)` | `.landing3042-title-copy`; later `!important` desktop override is authoritative |
| “My Practice” title | `52.5px / 1.1`, weight `400`, `0` tracking, color `#161616` | `calc(73.229px * var(--practice-mobile-ui-scale)) / 1.02`, `0` tracking, color `#161616` | `#homepage---right .practice3042-title` |

Homepage layout tokens:

- Default global page gutter: `34px`.
- At `min-width: 1600px`: `clamp(34px, calc(34px + ((100vw - 1600px) * .06)), 72px)`.
- From `1024px` through `1599.98px`: `clamp(20px, calc(20px + ((100vw - 1024px) * .02)), 34px)`.
- From `768px` through `1023.98px`: `clamp(22px, 3.8vw, 36px)`.
- Below `768px`: `clamp(14px, 4vw, 22px)`.
- Desktop column widths: `668px`, `706px`, `673px`; two gaps of `204px`; resulting source content width is `2455px`.
- Homepage canvas is `{colors.site-canvas}`; normal ink is `{colors.primary}`.

No new homepage subtitle, explanatory paragraph, label, badge, button, or title variant may be inferred from this table. Only copy and controls already present in the approved source are allowed.

# Layout

## Required page architecture

The existing detail view is an inline overlay inside the portfolio's “My Practice” experience. It is not a separate marketing page. New detail pages MUST preserve this shell and order:

```text
section#map-project-inline-shell.map-project-inline-shell
└── div#map-project-inline-scroll.map-project-inline-scroll
    └── article.map-project-inline-content.map-project-detail-page[aria-live="polite"]
        ├── div.map-project-detail-topbar (sticky)
        │   ├── header.map-project-detail-header
        │   │   ├── div.map-project-detail-title-group
        │   │   │   ├── h2#map-project-detail-title.map-project-detail-title
        │   │   │   └── optional project-specific evidence badge
        │   │   └── button#map-project-inline-close.map-project-inline-close
        │   └── div.map-project-detail-separator
        ├── section#map-project-detail-veritas-root
        │   ├── section.map-project-detail-stage
        │   │   ├── metadata: tags left; credit/institute right
        │   │   ├── lead paragraph
        │   │   ├── paired hero media with factual captions
        │   │   ├── section A: h3 + body
        │   │   └── section B: h3 + scene body
        │   └── section#map-project-detail-section-c (Veritas research/conclusion)
        ├── section#map-project-template-root (alternate project template)
        └── section#map-project-opentrace-root (Open Traces implementation)
nav#map-project-inline-nav (fixed-height sibling below shell)
├── previous project button
└── next project button
```

Structural rules:

- The detail page title MUST remain an `h2`; the homepage already owns the document-level `h1`.
- Main section headings MUST remain `h3` unless the page hierarchy itself changes with approval.
- Only one project root MUST be visible at a time. Hidden alternate roots MUST retain `hidden`/`aria-hidden` handling.
- The detail content MUST scroll inside `.map-project-inline-scroll`; do not replace it with body scroll.
- The shell MUST remain above the bottom navigation by exactly `45.359px`.
- The close control and previous/next navigation MUST remain reachable for keyboard and pointer users.
- An award badge is allowed only when it is actual project evidence. It MUST NOT become a decorative reusable badge.
- Do not add a breadcrumb, hero CTA, “read more” button, contact banner, testimonial, related-card grid, floating toolbar, or duplicate navigation.

## Shell and title bar

### Desktop

- `.map-project-inline-shell`: `position:absolute; left:0; right:0; top:0; bottom:45.359px; overflow:hidden; background:#FFFFFF`.
- `.map-project-inline-scroll`: `width:100%; height:100%; overflow-y:auto; overflow-x:hidden; background:#FFFFFF`.
- `.map-project-detail-topbar`: `position:sticky; top:0; z-index:18`; transition duration is `160ms`.
- Expanded header minimum height: `100px`.
- Collapsed header minimum height: `45.359px`.
- Expanded header padding: `19px 40px 24px 29px`.
- Expanded header gap: `24px`; title-group gap: `14px`.
- Collapsed left/right padding remains `29px / 40px`; vertical padding is computed to center the `19.996px` title inside `45.359px`.
- Expanded title: `{typography.detail-title}`. Collapsed title: `{typography.detail-title-collapsed}`.
- Close icon size: `41px`; top anchor: `27px`; right anchor: `40px`; its minimum control height follows the collapsed title line height.
- The separator is exactly `1px`.

### Mobile (`max-width: 767px`)

- Header collapse distance: `84px`.
- Expanded title: `{typography.detail-title-mobile}`.
- Collapsed title: `{typography.detail-title-mobile-collapsed}`.
- Expanded header padding: `18px 72px 20px 20px`.
- Title/header gaps resolve to `0`.
- Close icon size: `34px`; top anchor: `18px`; right anchor: `20px`.

### Chrome themes

- Default: background `{colors.canvas}`, title/icon `{colors.title}`.
- Over a dark narrative field: background `{colors.dark-section}`, title/icon `{colors.on-dark}`; image icons use the existing invert behavior.
- Over a muted narrative field: background `{colors.muted-chrome}`.
- Theme transitions MUST be driven by the content currently beneath the sticky chrome. Do not permanently recolor the header for one project.
- The title MUST shrink rather than disappear. The close control MUST remain icon-only, transparent, borderless, and supplied with an accessible label.

## Veritas stage: desktop geometry (`min-width: 1080px`)

The Veritas body uses a centered responsive base:

- Minimum body gutter: `24px`.
- Base content width: `1392px`.
- Actual gutter: `max(24px, (100% - 1392px) / 2)`.
- `.map-project-detail-stage` default grid gap: `28px`; base padding before the Veritas overrides: `24px 36px 0`.
- Desktop stage inline start: `2.3794%` of its container.
- Desktop stage inline end: `2.6438%`.
- Desktop stage width: `calc(100% - 4.7588%)`.

Stage placement values are part of the approved composition and MUST NOT be replaced by a generic grid:

| Element | Required desktop placement |
| --- | --- |
| Tag 1 / Tag 2 / Tag 3 | top `8px / 32px / 56px`, left column |
| Credit / institute | top `8px / 32px`, right column |
| Lead | top `110px`; width `95.2412%` |
| Left hero figure | top `203px`; left `2.381%`; width `43.254%`; height `24.3371cqi` |
| Right hero figure | top `187px`; left `54.525%`; width `44.324%`; height `27.3813cqi` |
| Left caption | `18px` after the left figure |
| Right caption | `-12px` relative to the right figure end; left `56.08%` |
| Section A heading | `77px` after the controlling caption baseline |
| Section B heading | `292px` after the Section A heading reference |
| Stage floor | `1382px` |
| Tail floor | `324px` |

Hero rules:

- Tags, credit, and institute use `{typography.metadata}` and `{colors.metadata}`.
- Lead uses `{typography.lead}` and `{colors.primary}`.
- Hero figures remain flat and square. Default image/video frame backgrounds are white or black as already declared.
- Images use the existing crop rules; videos preserve the current contain/cover rule for their specific slot. Do not apply a global crop.
- Hero captions use `{typography.caption}` and `{colors.metadata}`.
- General media gap is `16px`; mobile media gap is `12px`.
- Media order, aspect ratio, object position, and captions MUST come from the project source. They are evidence, not decoration.

## Section A: dark statement

- Section A is full-bleed dark via the existing pseudo-element, not a rounded card.
- Desktop vertical padding: `60px 0 72px`.
- Section label to body gap: `20px`.
- Section label: `20px`, weight `400`, line-height `normal`, color `#F5F5F5` at `.6` opacity.
- Body statement: `32px / 1.5`, weight `400`, color `{colors.on-dark}`.
- Paragraph-to-paragraph spacing: `32px`.
- At `max-width: 1079px`: vertical padding becomes `40px 0 52px`; statement size is `clamp(24px, 4.1vw, 30px)`.
- At `max-width: 767px`: label is `18px`; statement is `22px / 1.5`; paragraph spacing is `24px`.
- Mobile inline hotspots use minimum height/line-height `28px` and `5px` vertical padding.
- Do not put Section A inside a card, add an eyebrow above its existing label, or add a CTA below it.

## Section B: evidence scenes

- Desktop Section B follows Section A by the current `77px` offset; the Veritas rich-content correction is `-20px`.
- The first question begins `22px` after its heading reference.
- Scene-to-scene gap is `36px`.
- Sticky/pinned scene media uses top inset `120px`.
- Scene title: `32px / 1.24`, weight `400`.
- Question copy: `20px / normal`, weight `400`, color `{colors.primary}`.
- Paired scene media uses two equal columns with `clamp(36px, 6.389%, 91px)` between them.
- Scene media starts `12px` after its immediate text block.
- Standard scene figure ratio is `642 / 361`.
- Existing left videos use `object-fit: contain` and the current top alignment; existing images use `object-fit: cover` and center alignment.
- Responsive layouts MUST preserve evidence order. They may stack columns, but MUST NOT omit a scene or move a conclusion before its evidence.
- Sticky scene behavior, video load mode, and phone scene synchronization are controlled by `web/responsive.shared.js`; do not replace them with an autoplay carousel.

## Section C: Veritas research, findings, and conclusion

Section C is the strongest structural reference for long-form case studies. Its internal order is REQUIRED:

1. Research kicker (`h3`).
2. Research title.
3. Supporting body.
4. Stockholm summary/link and the existing “found” lead-in.
5. Findings accordion.
6. Conclusion kicker and conclusion body.
7. Conclusion visual/carousel.
8. References accordion.
9. Research-paper link.
10. Conclusion brand/logo/title.
11. Umeå/Stockholm map interaction alongside the copy flow.

### Desktop Section C geometry

- Full-bleed background: `{colors.dark-section}`.
- Section top margin from the preceding stage: `60px`.
- Section vertical padding: `60px 0 60px`.
- Inner width: `calc(100% - 2 * var(--veritas-detail-body-gutter))`.
- Inner minimum height: `max(806px, map height)`.
- Inner horizontal padding: `36px`.
- Map width: `clamp(170px, 30vw, 433px)`.
- Copy/map gap: `clamp(16px, 2vw, 28px)`.
- Map flow height multiplier: `.56`.
- Map content ratio: `.72`.
- Map content padding: `clamp(6px, .75vw, 10px)`.
- Intro copy maximum width: `986px`.
- Research title maximum width: `758px`.
- Research title: `32px / 1.5`, weight `400`, color `{colors.on-dark}`.
- Supporting body: `20px / normal`, color `{colors.muted-copy}`, top margin `28px`.
- “Found” lead-in top margin: `60px`; findings begin `20px` later.
- Finding heading/content gap: `12px`.
- Finding plus shell/icon: `24px`; stroke `2px`; vertical offset `3px`.
- Expanded panel top gap: `20px`.
- Collapsed finding-to-finding gap: `58px`; post-expanded gap: `32px`.
- Expanded rich copy maximum width: `951px`.
- Finding media maximum width: `923px`; top margin `38px`.
- Conclusion maximum width: `951px`; conclusion block top margin `60px`; conclusion body top margin `20px`.
- Conclusion brand top margin: `60px`; internal gap: `32px`; maximum width: `1394px`.
- Conclusion logo width: `clamp(220px, 21.52vw, 300px)`.
- Conclusion brand title: `clamp(42px, 5.5vw, 76.915px) / .9`, weight `400`, color `{colors.on-dark}`.

### Finding and reference interactions

- Finding toggles MUST retain `aria-expanded`, `aria-controls`, and a matching hidden panel.
- Finding heading: `32px / 1.1`, weight `400`, color `{colors.on-dark}`.
- Plus mark color: `{colors.veritas-blue}`; do not replace it with a chevron or filled circular icon.
- Expanded finding copy: `20px`, normal line height, `-.4px` tracking, color `{colors.muted-copy}`.
- Finding labels and lists: `20px / 1.2`, `-.4px` tracking; labels use `{colors.muted-copy}`, list values use `{colors.on-dark}`.
- `VS` comparison copy: `20px / 1.34`, `-.1px` tracking.
- Reference rows: `20px / 1.2`, `-.4px` tracking, color `{colors.muted-copy}`; reference links use `{colors.on-dark}`.
- Accordions MUST remain operable by keyboard, pointer, and touch. Hidden content MUST not remain focusable.

### Veritas hotspots, map, and carousel

- Base inline chip: minimum/line height `20px`, padding `0 4px`, horizontal margin `0 1px`, radius `{rounded.hotspot}`.
- Title inline chip: minimum/line height `40px`, padding `6px`; at phone widths the line height is `28px`.
- Chips use `{colors.veritas-blue}` with `{colors.on-dark}`. They are interactive evidence triggers, not decoration.
- City label font size is `map width × .0462`; line height is `map width × .0577`; default color is `rgba(245,245,245,.7)`.
- City hover/active uses `{colors.veritas-orange}` with `{colors.black}`.
- Carousel page marks are `8px` wide, have a `1px solid rgba(245,245,245,.76)` border and `{rounded.pager}`. Active state uses `{colors.veritas-orange}`.
- Hover-only behavior is insufficient. Hotspots and map controls MUST expose equivalent focus/tap/click behavior.

### Section C responsive values

At `max-width: 1079px`:

- Map width: `clamp(150px, 31vw, 324px)`.
- Copy/map gap: `clamp(12px, 1.8vw, 20px)`.
- Map flow height multiplier: `.8`.
- Map content ratio: `.86`.
- Map content padding: `clamp(5px, .7vw, 8px)`.
- Inline gutter: `30px`.
- Section vertical padding: `44px 0 60px`.
- Inner minimum height: `max(420px, map height)`.
- Research title size: `clamp(24px, 4.2vw, 32px)`.
- “Found” lead-in top margin: `48px`.
- Finding plus top offset: `4px`.
- Collapsed finding gap: `42px`; post-expanded gap: `24px`.
- Expanded finding panel left padding: `33px`.

At `max-width: 767px`:

- Map width: `clamp(120px, 34vw, 220px)`.
- Copy/map gap: `clamp(8px, 1.5vw, 14px)`.
- Map flow height multiplier: `.94`.
- Map content ratio: `.96`.
- Map content padding: `clamp(4px, .6vw, 6px)`.
- Section vertical padding: `32px 0 60px`.
- Inner width: `100%`; minimum height: `max(300px, map height)`; inner padding: `20px`.
- Kicker size: `18px`; bottom/related margin: `14px` where declared.
- Research title: `22px / 1.4`.
- Supporting copy: `18px / 1.45`; top margin `20px`.
- “Found” lead-in top margin: `36px`; findings begin `20px` later.
- Finding heading: `24px / 1.1`.
- Finding heading gap: `9px`.
- Plus shell: `24px`; plus icon `18px`; stroke `2px`; vertical offset `4px`.
- Collapsed gap: `30px`; post-expanded gap: `18px`.
- Expanded panel left padding: `27px`.
- Expanded rich copy: `18px / 1.45`, `-.2px` tracking.
- Final phone label/list/reference/VS rule: `16px / 1.3`, `0` tracking.
- Conclusion body: `22px / 1.4`.

## Bottom project navigation

- Position: absolute at the bottom of the project experience; height exactly `45.359px`; `z-index:13`; horizontal flex layout.
- The detail shell MUST end `45.359px` above the viewport bottom so content never sits behind the navigation.
- Buttons: minimum height `45.359px`; minimum width `131.117px`; internal gap `14.879px`; horizontal padding `6.879px`.
- Previous button width: `131.117px`.
- Next button width: `190.313px`.
- Labels: `17.388px / 19.996px`, weight `400`.
- Arrow image: `29px × 15px`; previous/next rotations remain `-90deg / 90deg`.
- Theme follows the current content state: white, dark, or muted; dark labels/icons use `{colors.on-dark}`.
- Navigation is visible only while `map-project-open` is active.
- Do not replace previous/next labels with project cards, thumbnails, or a “back to work” CTA.

# Elevation & Depth

- The approved system is flat. Default elevation is none.
- Structure comes from a `1px` divider, background changes, sticky positioning, media scale, and whitespace.
- Do not add card shadows, glassmorphism, blurred panels, floating chrome, bevels, or decorative overlays.
- A temporary hover/focus media preview may use only the existing separation treatment already implemented for that component. A new shadow value is **UNVERIFIED** and MUST NOT be invented.

# Shapes

- Default radius is `{rounded.square}`.
- `{rounded.hotspot}` is reserved for existing inline narrative hotspots.
- `{rounded.pager}` is reserved for existing minimal carousel pagination.
- Tags, metadata, media, headers, sections, navigation, and whole content blocks MUST remain square.
- Do not add pills, rounded cards, circular close-button backgrounds, or capsule navigation.

# Components

## Project opening behavior

- Clicking a homepage project item MUST call the existing detail-opening path and show the internal shell in one action.
- Opening a project MUST render the correct root, reset the internal scroll position to `0`, reveal the shell/navigation, add `map-project-open`, and synchronize shell height, header collapse/wrap, section scenes, and chrome theme.
- URL/hash navigation MUST continue to resolve to the same project content.
- Do not create a second detail implementation in parallel with `openMapProject()` and `renderMapProjectDetailPage()`.

## Metadata

- Left side: plain vertical `#` tags.
- Right side: credit and institute/collaborator/award lines.
- Preserve source wording, capitalization, participant names, and institutional names.
- Do not turn metadata into pills, skill bars, icon rows, date cards, or technology badges.

## Media

- Use only supplied project images, diagrams, videos, prototype recordings, and approved logos.
- Do not regenerate, stylize, recolor, or AI-upscale evidence without explicit approval.
- Keep aspect ratio and narrative sequence from the source.
- Captions must be factual and quiet; do not write promotional subtitles.
- `alt` text is REQUIRED for informative images. Decorative images MUST use empty `alt`.
- Video controls, loading mode, poster, autoplay, and reduced-motion behavior MUST follow the existing component's code unless a tested accessibility fix requires change.

## Content integrity

- Never invent research findings, quotations, participant counts, client claims, metrics, awards, institutions, implementation status, or outcomes.
- Missing evidence MUST be marked as missing in working documents; it MUST NOT be filled with plausible copy.
- Project-specific story order may differ, but it MUST follow evidence → interpretation → response → validation/conclusion. It MUST NOT become a feature-card sales page.

# Do's and Don'ts

## Do

- Inspect the current Veritas implementation before creating or modifying a detail page.
- Reuse the existing shell, title bar, close control, internal scroll container, and bottom navigation.
- Keep the expanded-to-collapsed header behavior and theme synchronization.
- Preserve exact typography, spacing, colors, media order, and responsive rules where this document marks them REQUIRED.
- Put substantial context, process, research, and demonstrations on detail pages.
- Verify desktop and phone behavior in a real browser at minimum; also inspect the `1080px` transition when changing detail layout.
- Treat supplied Figma/project assets as content evidence, not permission to redesign the portfolio shell.

## Don't

- Do not change the homepage visual, add homepage text, or add homepage buttons.
- Do not add an intermediate click before opening a detail page.
- Do not change the page into a standalone SaaS landing page, dashboard, blog template, or card grid.
- Do not add a second typeface, synthetic bolding, or Atkinson Hyperlegible Bold as a substitute.
- Do not add gradients, global accent colors, rounded containers, large shadows, decorative icons, or motion without an existing source.
- Do not replace long-form evidence with a summary merely to shorten the page.
- Do not make hover the only way to reveal required information.
- Do not modify generated, cached, snapshot, test-result, or deployment-copy directories.
- Do not deploy from a design-generation workflow. Production deployment requires explicit approval in the current conversation.

# Verification contract

Every implementation that claims conformance MUST complete this checklist:

1. Run `git status --short --branch` before editing and preserve unrelated changes.
2. Work on a `codex/<short-task>` branch unless the user explicitly says otherwise.
3. Review the full diff; confirm only intended source files changed.
4. If `web/responsive.shared.js` changed, run `node --check web/responsive.shared.js`.
5. Start local preview from the repository root with `npx --yes http-server web -p 4173 -c-1`.
6. Open `http://127.0.0.1:4173` in a real browser.
7. Verify homepage visual parity and one-click opening before inspecting the detail page.
8. Verify the detail page at a desktop width, at the `1080px` layout boundary, and at a phone width such as `390px`.
9. Verify title collapse, dark/muted chrome transitions, close control, internal scrolling, accordions, hotspots, media, and previous/next navigation.
10. Record anything not directly observed as **UNVERIFIED**.
11. Commit and push before switching between Windows and macOS.
12. Do not run `wrangler deploy` or an equivalent production command without explicit current approval.

# Source map

The following selectors/files are the evidence base for this contract:

- `web/index.html`: detail shell, title bar, semantic heading order, Veritas stage, Sections A/B/C, alternate roots, and bottom navigation (`#map-project-inline-shell` through `#map-project-inline-nav`; currently approximately lines 655–1267).
- `web/responsive.shared.css`: declared font families and global typography tokens (approximately lines 827–872); Veritas/body variables and detail shell (approximately lines 5459 onward); desktop stage geometry (approximately lines 5914 onward); mobile title bar (approximately lines 6815–6838); Veritas Section C desktop rules (approximately line 12036 onward); tablet rules (approximately line 12948 onward); phone rules (approximately line 13208 onward).
- `web/responsive.shared.js`: project content data (Veritas data approximately lines 3310–3331); project root selection/rendering (`renderMapProjectDetailPage`, approximately line 9199); one-click detail opening and state synchronization (`openMapProject`, approximately line 9261).

Line numbers are navigation aids, not substitutes for selector inspection. If source values and this document ever diverge, stop and reconcile them deliberately; do not silently choose whichever is more convenient.
