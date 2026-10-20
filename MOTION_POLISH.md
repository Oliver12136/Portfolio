# Motion polish

Deployed to `https://oghuzhan.work` following the user's explicit deployment
request. Version: `2ce68bbb-7264-4f56-b460-601a5e6be7bb`.
Branch: `codex/motion-polish`.

## Scope and implementation

The checked-out source and DESIGN.md were inspected before editing. Existing
fonts, spacing, dimensions, colours, responsive breakpoints, assets, content,
project positions, category weights and priorities remain unchanged.

- **Map guide:** existing capsule unfolds from the question mark with opacity,
  6px translation and a .975 scale; 190ms entrance, 120ms exit, ease-out. A 50ms
  pointer-leave bridge allows crossing to the capsule. Re-entry reverses from
  the current opacity/transform, cancelling stale completion handlers. Closing
  content becomes inert immediately. Keyboard focus/Escape and the existing
  fullscreen mobile dialog/focus return remain available. Touch dialog uses
  opacity only. Reduced motion skips the animation, including preference
  changes during an active transition. No tooltip geometry or CSS was changed.
- **Map:** existing square opacity, background and outline states now blend
  over 140–160ms. Existing previews and captions fade in/out over 180/120ms;
  media and position cleanup waits until the fade ends and is cancelled by
  re-entry. Opening a project dismisses map previews immediately.
- **Details:** the existing shell/navigation appear over 180ms and dismiss
  over 120ms. Previous/next content gets a 220ms opacity transition. Closing
  can be reversed safely through hash/history navigation. Header, title and
  icon tone transitions share a 180ms ease-out without changing colour values.
  Scroll-driven header dimensions still follow scroll directly; unchanged
  collapse progress no longer causes redundant custom-property writes.
- **Evidence previews:** opacity entrances/exits; cancellation-safe cleanup;
  pointer positioning coalesced to one animation frame without easing/lagging
  its coordinates. Repeated focus/hover on the same target does not restart
  media. Non-branded images fade when loaded; branded images retain the
  existing loading/skeleton/decode pipeline. Mobile inline placement remains.
- **Media:** carousel easing is refined without changing timing/order/media;
  reader buttons transition their existing background/disabled-opacity states
  over 120ms. The reader JavaScript, fold, zoom, pan, Fit wheel routing and
  native fullscreen logic are unchanged. Reduced-motion CSS is scoped to the
  touched interactions; no global transition rule was added.

Libraries.dev was installed as a Codex skill and read as requested. Its React/
WebGL/decorative packages were not added to this vanilla site. No project
packages, new UI, assets, shadows, gradients, blur or decorative effects were
introduced.

## Files in this task

- `web/work-map.js`: capsule motion lifecycle and existing input handling.
- `web/responsive.shared.js`: opacity lifecycle, detail/map/evidence motion,
  one-frame evidence positioning and redundant collapse-write avoidance.
- `web/responsive.shared.css`: scoped transition timing and reduced motion.
- `web/portfolio-reader.css`: existing control-state transitions only.
- `scripts/qa-motion-polish.cjs`: reversal/cancellation, keyboard/touch and
  reduced-motion regressions.
- `scripts/qa-work-map.cjs`: wait for animation endpoints before measuring the
  existing capsule or asserting that its exit has finished.
- `scripts/qa-norrtag-loading.cjs`: wait for the new close transition to finish
  before asserting that the overview arrows have returned.

Other dirty/untracked files predate this task and were preserved.

## Verification and limits

Chrome browser automation at desktop, 1080px boundary, phone and narrow phone
sizes; existing map/arrow/media scripts span 320–1920px. These are browser
input tests, not a claim of physical Mac trackpad or Safari hardware testing.

Passed checks:

- JavaScript syntax and `git diff --check`.
- Computed-style/geometry parity at 1440/1080/390: map, filtered squares, guide,
  detail header and collapsed header/navigation, including typography, colours,
  dimensions and spacing. The captured map screenshots also have zero pixel
  differences at all three widths; mobile guide screenshot is identical.
  Desktop guide snapshots have 48 antialiased edge-pixel differences around
  the capsule in the before/after sequence; its geometry and style endpoints
  are identical. No colour/radius/size compensation was applied to chase a
  browser rasterization difference.
- Tooltip bridge, rapid leave/re-entry, keyboard/Escape, inert closing state,
  mobile fullscreen guide and focus return; 11 widths without help collisions.
- One-click opening; rapid close/reopen; previous/next/history; map arrows
  remain hidden through detail transitions in mouse and touch checks.
- Evidence focus/hover/re-entry, EP/BP sources, mobile tap previews; 30 pointer
  events produce at most two position writes across the sampled frames.
- Live reduced-motion preference changes and immediate reduced-motion states.
- Header expanded/collapsed and light/dark/project-blue endpoints on desktop
  and tablet. Muted styling was exercised as a class-state fixture; the
  OpenTraces sequence that normally activates it is intentionally commented
  out in the current source and was not restored.
- Existing Norrtåg media controls, autoplay/manual/keyboard carousel handling,
  research media/caption geometry, loading behaviour and cleanup checks.
- Center-hinged forward/backward reader turns, Fit native page scrolling,
  zoomed pan containment, ctrl-wheel pinch, Safari-style gesture event path,
  fullscreen and browser/project-navigation isolation.

Existing issues deliberately left outside this visual-preservation change:

1. The full reader suite fails its short-landscape auto-position assertion at
   844×390: controls may settle around y=376 while navigation starts at
   y=344.656. Re-running with the saved pre-task source produces the same
   failure. No positioning/scroll/gesture workaround was added.
2. Touch detail-scroll chrome synchronization is currently registered after
   the fine-hover guard, so mobile header/nav theme changes can be missed.
   Moving these listeners fixes the behavior but changes stationary mobile
   chrome colours compared with the baseline. That additional fix was tested
   and then withdrawn to honour the explicit resting-state preservation rule.

No quantitative FPS or low-end-device performance benchmark was performed.
