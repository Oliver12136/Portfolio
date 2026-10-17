(function () {
  var MODE = "figma3042";
  var ROOT_SELECTOR = ".home3042";

  function setMode() {
    document.documentElement.setAttribute("data-site-mode", MODE);
  }

  function syncViewportVars() {
    var h = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
    if (!h) return;
    var px = Math.round(h) + "px";
    document.documentElement.style.setProperty("--viewport-height", px);
    document.documentElement.style.setProperty("--min-viewport-height", px);
  }

  var IMAGE_LOADING_SKIP_SELECTOR = [
    ".landing3042-logo",
    ".landing3042-bubble-art",
    ".landing3042-practice-cta-arrow",
    ".mypractice-map-top-tag-asset",
    ".practice3042-open-traces-brand-mark",
    ".map-project-inline-close-icon",
    ".map-project-inline-nav-icon",
    ".map-project-detail-separator img",
    ".map-project-detail-section-c-conclusion-brand-logo",
    "#external-link-hover-preview-icon"
  ].join(", ");

  var IMAGE_LOADING_HOST_SELECTOR = [
    ".project-hover-body",
    ".map-project-detail-figure",
    ".map-project-detail-section-b-scene-figure",
    ".map-project-detail-section-c-finding-panel-figure",
    ".map-project-detail-section-c-finding-panel-media-shell",
    ".map-project-detail-section-c-conclusion-visual",
    ".namecard-back-media-item",
    ".project-minimoves-intro-mark",
    ".project-minimoves-feature-media",
    ".project-minimoves-gallery-row figure",
    ".project-sustainable-poster",
    ".project-sustainable-tile",
    ".project-sustainable-scroll-figure",
    ".project-summerschool-language-board",
    ".project-summerschool-preview",
    ".project-summerschool-row figure",
    ".project-summerschool-row2",
    ".mypractice-map-overlay-thumb-host",
    ".practice3042-open-traces-overlay-host",
    ".map-project-detail-section-c-map"
  ].join(", ");

  function setImageLoadingState(host, state) {
    if (!host) return;
    if (!state) {
      host.removeAttribute("data-image-loading-state");
      return;
    }
    host.setAttribute("data-image-loading-state", state);
  }

  function resolveImageLoadingHost(img) {
    if (!img || !img.closest) return null;

    var explicitHost = img.closest(IMAGE_LOADING_HOST_SELECTOR);
    if (explicitHost) return explicitHost;

    var figure = img.closest("figure");
    if (
      figure &&
      figure.querySelectorAll &&
      figure.querySelectorAll("img").length === 1 &&
      !figure.querySelector("figcaption")
    ) {
      return figure;
    }

    var parent = img.parentElement;
    if (!parent) return null;
    if (parent.children && parent.children.length === 1) return parent;
    return null;
  }

  function ensureImageLoadingHostTracker(host) {
    if (!host) return null;
    if (!host.__brandImageLoadingTracker) {
      host.__brandImageLoadingTracker = {
        images: new Set()
      };
    }
    host.classList.add("brand-image-host");
    return host.__brandImageLoadingTracker;
  }

  function detachImageLoadingFromHost(img) {
    if (!img) return;
    var host = img.__brandImageLoadingHost;
    if (!host || !host.__brandImageLoadingTracker) return;
    host.__brandImageLoadingTracker.images.delete(img);
    img.__brandImageLoadingHost = null;
    syncImageLoadingHostState(host);
  }

  function getTrackedImageStatuses(host) {
    if (!host || !host.__brandImageLoadingTracker) return [];
    return Array.from(host.__brandImageLoadingTracker.images)
      .map(function (trackedImg) {
        return trackedImg.__brandImageLoadingStatus || "idle";
      })
      .filter(function (status) {
        return status !== "idle";
      });
  }

  function syncImageLoadingHostState(host) {
    var statuses = getTrackedImageStatuses(host);
    if (!statuses.length) {
      setImageLoadingState(host, null);
      return;
    }
    if (statuses.some(function (status) { return status === "loading"; })) {
      setImageLoadingState(host, "loading");
      return;
    }
    if (statuses.some(function (status) { return status === "loaded"; })) {
      setImageLoadingState(host, "loaded");
      return;
    }
    setImageLoadingState(host, "error");
  }

  function setTrackedImageStatus(img, status) {
    if (!img) return;
    img.__brandImageLoadingStatus = status;
    syncImageLoadingHostState(img.__brandImageLoadingHost);
  }

  function detachImageLoadingListeners(img) {
    if (!img) return;
    if (img.__brandImageLoadingOnLoad) {
      img.removeEventListener("load", img.__brandImageLoadingOnLoad);
      img.__brandImageLoadingOnLoad = null;
    }
    if (img.__brandImageLoadingOnError) {
      img.removeEventListener("error", img.__brandImageLoadingOnError);
      img.__brandImageLoadingOnError = null;
    }
  }

  function bindImageLoadingState(img, options) {
    if (!img) return;
    var forceResync = !!(options && options.forceResync);
    if (!img.matches || img.matches(IMAGE_LOADING_SKIP_SELECTOR)) return;

    var host = resolveImageLoadingHost(img);
    if (!host) return;

    if (img.__brandImageLoadingBound && !forceResync && img.__brandImageLoadingHost === host) return;

    detachImageLoadingListeners(img);
    detachImageLoadingFromHost(img);

    var tracker = ensureImageLoadingHostTracker(host);
    if (!tracker) return;

    img.__brandImageLoadingBound = true;
    img.__brandImageLoadingHost = host;
    tracker.images.add(img);
    img.classList.add("brand-image-skeleton-image");

    var src = img.currentSrc || img.getAttribute("src") || img.getAttribute("srcset");
    if (!src) {
      setTrackedImageStatus(img, "idle");
      return;
    }

    function markLoaded() {
      setTrackedImageStatus(img, "loaded");
    }

    function markError() {
      setTrackedImageStatus(img, "error");
    }

    if (img.complete) {
      if (img.naturalWidth > 0) {
        markLoaded();
      } else if (src) {
        markError();
      }
      return;
    }

    setTrackedImageStatus(img, "loading");
    img.__brandImageLoadingOnLoad = markLoaded;
    img.__brandImageLoadingOnError = markError;
    img.addEventListener("load", markLoaded, { once: true });
    img.addEventListener("error", markError, { once: true });
  }

  function initBrandedImageLoading() {
    Array.prototype.forEach.call(document.images || [], bindImageLoadingState);

    if (!window.MutationObserver || !document.body || document.body.__brandImageLoadingObserverBound) {
      return;
    }

    var observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        if (record.type === "attributes" && record.target && record.target.tagName === "IMG") {
          bindImageLoadingState(record.target, { forceResync: true });
          return;
        }
        Array.prototype.forEach.call(record.addedNodes || [], function (node) {
          if (!node || node.nodeType !== 1) return;
          if (node.tagName === "IMG") {
            bindImageLoadingState(node);
          }
          if (node.querySelectorAll) {
            Array.prototype.forEach.call(node.querySelectorAll("img"), bindImageLoadingState);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "srcset"]
    });
    document.body.__brandImageLoadingObserverBound = true;
  }

  function scrollToPractice() {
    var target = document.getElementById("homepage---right");
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function bindBottomAreaScroll() {
    var root = document.documentElement;
    var hero = document.getElementById("homepage---left");
    var practice = document.getElementById("homepage---right");
    var practiceCta = hero ? hero.querySelector("[data-trigger='practice']") : null;
    if (!hero || !practice) return;
    if (!practiceCta) return;
    var autoJumpLock = false;
    var armUpSnap = false;
    var isCoarsePointer = !!(
      window.matchMedia &&
      window.matchMedia("(hover: none), (pointer: coarse)").matches
    );

    function getPracticeTopY() {
      return window.scrollY + practice.getBoundingClientRect().top;
    }

    function hasBlockingOverlay() {
      if (root.classList.contains("landing-modal-open")) return true;
      if (root.classList.contains("project-overlay-open")) return true;
      if (root.classList.contains("project-inline-open")) return true;
      if (root.classList.contains("map-project-open")) return true;
      return false;
    }

    function isLandingSurfaceExpanded() {
      var state = root.getAttribute("data-landing-surface-state") || "home";
      return state !== "home";
    }

    function shouldHandleDownJump() {
      if (hasBlockingOverlay()) return false;
      if (isLandingSurfaceExpanded()) return false;
      return window.scrollY < (getPracticeTopY() - 24);
    }

    function isAtPracticeTop() {
      return Math.abs(window.scrollY - getPracticeTopY()) <= 10;
    }

    function scrollToPracticeLocked() {
      if (autoJumpLock) return;
      autoJumpLock = true;
      scrollToPractice();
      window.setTimeout(function () {
        autoJumpLock = false;
      }, 650);
    }

    function scrollToHeroLocked() {
      if (autoJumpLock) return;
      autoJumpLock = true;
      hero.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(function () {
        autoJumpLock = false;
      }, 650);
    }

    practiceCta.addEventListener("click", function () {
      if (hasBlockingOverlay()) return;
      if (window.scrollY >= (getPracticeTopY() - 24)) return;
      scrollToPracticeLocked();
    });

    if (isCoarsePointer) return;

    window.addEventListener(
      "wheel",
      function (event) {
        if (hasBlockingOverlay()) return;
        if (isLandingSurfaceExpanded()) return;
        var interactive = event.target && event.target.closest
          ? event.target.closest("input, textarea, select, iframe, .namecard-back-scroll, [data-modal-panel]")
          : null;
        if (interactive) return;

        if (event.deltaY > 0) {
          armUpSnap = false;
          if (!shouldHandleDownJump()) return;
          event.preventDefault();
          scrollToPracticeLocked();
          return;
        }

        if (event.deltaY < 0) {
          var practiceTop = getPracticeTopY();
          if (window.scrollY > practiceTop + 10) {
            armUpSnap = false;
            return;
          }
          if (!isAtPracticeTop()) {
            armUpSnap = false;
            return;
          }

          if (!armUpSnap) {
            armUpSnap = true;
            return;
          }

          event.preventDefault();
          armUpSnap = false;
          scrollToHeroLocked();
        }
      },
      { passive: false }
    );

    window.addEventListener(
      "scroll",
      function () {
        if (!isAtPracticeTop()) {
          armUpSnap = false;
        }
      },
      { passive: true }
    );
  }

  function initLandingBubbleMotion() {
    var root = document.documentElement;
    var hero = document.getElementById("homepage---left");
    if (!hero) return;

    var stage = hero.querySelector(".landing3042-stage");
    if (!stage) return;
    var header = hero.querySelector(".landing3042-header");
    var practiceCta = hero.querySelector(".landing3042-practice-cta");
    var practiceArrow = practiceCta
      ? practiceCta.querySelector(".landing3042-practice-cta-arrow")
      : null;
    var practiceCopy = practiceCta
      ? practiceCta.querySelector(".landing3042-practice-cta-copy")
      : null;

    var reduceMotionMq = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
    var mobileMq = window.matchMedia
      ? window.matchMedia("(max-width: 767.98px)")
      : null;
    var debugCollidersEnabled = window.__LANDING_BUBBLE_DEBUG__ === true;

    var configs = [
      {
        key: "logo",
        selector: ".landing3042-logo",
        mass: 1.42,
        driftX: 0,
        driftY: 0,
        wobble: 0,
        alwaysActive: true,
        staticBody: true,
        reveal: false,
        allowRotation: false,
        shapeInsetX: 0.16,
        shapeInsetY: 0.14,
        colliders: [
          [0.50, 0.50, 0.40],
          [0.34, 0.34, 0.16],
          [0.66, 0.34, 0.16],
          [0.34, 0.66, 0.16],
          [0.66, 0.66, 0.16]
        ]
      },
      {
        key: "hi",
        selector: ".landing3042-bubble-hi",
        mass: 1.02,
        driftX: -34,
        driftY: -12,
        wobble: 0.70,
        shapeInsetX: 0.08,
        shapeInsetY: 0.12,
        shapeOffsetX: 0.03,
        colliders: [
          [0.17, 0.40, 0.16],
          [0.34, 0.40, 0.22],
          [0.52, 0.40, 0.24],
          [0.70, 0.40, 0.21],
          [0.85, 0.40, 0.16],
          [0.18, 0.63, 0.16],
          [0.36, 0.63, 0.22],
          [0.54, 0.63, 0.24],
          [0.72, 0.63, 0.21],
          [0.87, 0.63, 0.16],
          [0.08, 0.79, 0.10]
        ]
      },
      {
        key: "preferred",
        selector: ".landing3042-bubble-preferred",
        mass: 1.06,
        driftX: -18,
        driftY: -28,
        wobble: 0.66,
        shapeInsetX: 0.06,
        shapeInsetY: 0.12,
        colliders: [
          [0.70, 0.15, 0.10],
          [0.82, 0.15, 0.09],
          [0.10, 0.38, 0.14],
          [0.27, 0.38, 0.20],
          [0.44, 0.38, 0.23],
          [0.61, 0.38, 0.22],
          [0.78, 0.38, 0.19],
          [0.92, 0.38, 0.13],
          [0.10, 0.62, 0.14],
          [0.27, 0.62, 0.20],
          [0.44, 0.62, 0.23],
          [0.61, 0.62, 0.22],
          [0.78, 0.62, 0.19],
          [0.92, 0.62, 0.13]
        ]
      },
      {
        key: "uyghur",
        selector: ".landing3042-bubble-uyghur",
        mass: 1.08,
        driftX: 24,
        driftY: -18,
        wobble: 0.65,
        shapeInsetX: 0.06,
        shapeInsetY: 0.12,
        colliders: [
          [0.78, 0.16, 0.10],
          [0.90, 0.16, 0.09],
          [0.10, 0.38, 0.14],
          [0.27, 0.38, 0.20],
          [0.44, 0.38, 0.23],
          [0.61, 0.38, 0.22],
          [0.78, 0.38, 0.19],
          [0.92, 0.38, 0.13],
          [0.10, 0.62, 0.14],
          [0.27, 0.62, 0.20],
          [0.44, 0.62, 0.23],
          [0.61, 0.62, 0.22],
          [0.78, 0.62, 0.19],
          [0.92, 0.62, 0.13]
        ]
      },
      {
        key: "legally",
        selector: ".landing3042-bubble-legally",
        mass: 1.12,
        driftX: -20,
        driftY: 16,
        wobble: 0.68,
        shapeInsetX: 0.06,
        shapeInsetY: 0.12,
        colliders: [
          [0.32, 0.16, 0.10],
          [0.44, 0.16, 0.09],
          [0.08, 0.38, 0.14],
          [0.23, 0.38, 0.20],
          [0.38, 0.38, 0.23],
          [0.53, 0.38, 0.24],
          [0.68, 0.38, 0.22],
          [0.82, 0.38, 0.18],
          [0.93, 0.38, 0.12],
          [0.08, 0.62, 0.14],
          [0.23, 0.62, 0.20],
          [0.38, 0.62, 0.23],
          [0.53, 0.62, 0.24],
          [0.68, 0.62, 0.22],
          [0.82, 0.62, 0.18],
          [0.93, 0.62, 0.12]
        ]
      },
      {
        key: "studio",
        selector: ".landing3042-bubble-studio",
        mass: 1.18,
        driftX: 28,
        driftY: 12,
        wobble: 0.60,
        shapeInsetX: 0.06,
        shapeInsetY: 0.11,
        colliders: [
          [0.78, 0.16, 0.10],
          [0.90, 0.16, 0.09],
          [0.08, 0.38, 0.14],
          [0.23, 0.38, 0.20],
          [0.38, 0.38, 0.23],
          [0.53, 0.38, 0.24],
          [0.68, 0.38, 0.22],
          [0.82, 0.38, 0.18],
          [0.93, 0.38, 0.12],
          [0.08, 0.62, 0.14],
          [0.23, 0.62, 0.20],
          [0.38, 0.62, 0.23],
          [0.53, 0.62, 0.24],
          [0.68, 0.62, 0.22],
          [0.82, 0.62, 0.18],
          [0.93, 0.62, 0.12]
        ]
      }
    ];

    var bodies = [];
    var bodyByKey = {};
    var stageWidth = 0;
    var stageHeight = 0;
    var arenaLeft = 0;
    var arenaRight = 0;
    var arenaTop = 0;
    var arenaBottom = 0;
    var arenaWidth = 0;
    var arenaHeight = 0;
    var inView = true;
    var manualPause = false;
    var running = false;
    var rafId = 0;
    var resizeRafId = 0;
    var lastFrameMs = 0;
    var revealTimers = [];
    var debugNodes = [];
    var stageStyle = null;
    var currentCompression = 0;
    var DESIGN_STAGE_WIDTH = 1440;
    var MOBILE_BREAKPOINT_WIDTH = 768;

    function prefersReducedMotion() {
      return !!(reduceMotionMq && reduceMotionMq.matches);
    }

    function isMobileLayout() {
      return !!(mobileMq && mobileMq.matches);
    }

    function bindMqChange(mq, handler) {
      if (!mq || typeof handler !== "function") return;
      if (mq.addEventListener) {
        mq.addEventListener("change", handler);
      } else if (mq.addListener) {
        mq.addListener(handler);
      }
    }

    function getStylePx(varName, fallbackPx) {
      if (!stageStyle) {
        stageStyle = window.getComputedStyle(stage);
      }
      var raw = stageStyle.getPropertyValue(varName);
      var n = Number(String(raw || "").replace(/px$/i, "").trim());
      if (!isFinite(n)) return fallbackPx;
      return n;
    }

    function clamp01(value) {
      if (value <= 0) return 0;
      if (value >= 1) return 1;
      return value;
    }

    function computeViewportCompression(widthPx) {
      if (!isFinite(widthPx) || widthPx <= 0) return 0;
      var span = Math.max(1, DESIGN_STAGE_WIDTH - MOBILE_BREAKPOINT_WIDTH);
      return clamp01((DESIGN_STAGE_WIDTH - widthPx) / span);
    }

    function computeCrowdingCompression(actives) {
      if (!actives || !actives.length || arenaWidth <= 0 || arenaHeight <= 0) return 0;
      var totalWidth = 0;
      var totalHeight = 0;
      for (var i = 0; i < actives.length; i++) {
        totalWidth += actives[i].w * 0.9;
        totalHeight += actives[i].h * 0.72;
      }
      var widthPressure = (totalWidth / arenaWidth) - 1.52;
      var heightPressure = (totalHeight / arenaHeight) - 1.30;
      return clamp01(Math.max(widthPressure / 0.65, heightPressure / 0.6, 0));
    }

    function syncArenaBounds(stageRect, compression) {
      stageStyle = window.getComputedStyle(stage);

      var pressure = clamp01(compression || 0);
      var safeInline = getStylePx("--landing-safe-inline", 24);
      var safeTop = getStylePx("--landing-safe-top", 18);
      var safeBottom = getStylePx("--landing-safe-bottom", 26);
      var arenaPadTop = getStylePx("--landing-arena-pad-top", 16);
      var arenaPadBottom = getStylePx("--landing-arena-pad-bottom", 18);

      var safeInlineDynamic = Math.max(6, safeInline * (1 - (pressure * 0.68)));
      var safeTopDynamic = Math.max(6, safeTop * (1 - (pressure * 0.52)));
      var safeBottomDynamic = Math.max(8, safeBottom * (1 - (pressure * 0.56)));
      var arenaPadTopDynamic = Math.max(5, arenaPadTop * (1 - (pressure * 0.46)));
      var arenaPadBottomDynamic = Math.max(6, arenaPadBottom * (1 - (pressure * 0.52)));

      var topLimit = safeTopDynamic + arenaPadTopDynamic;
      if (header) {
        var headerRect = header.getBoundingClientRect();
        if (headerRect.height) {
          topLimit = Math.max(topLimit, (headerRect.bottom - stageRect.top) + arenaPadTopDynamic);
        }
      }

      var bottomLimit = stageRect.height - safeBottomDynamic - arenaPadBottomDynamic;
      if (practiceCta) {
        var ctaRect = practiceCta.getBoundingClientRect();
        if (ctaRect.height) {
          bottomLimit = Math.min(bottomLimit, (ctaRect.top - stageRect.top) - arenaPadBottomDynamic);
        }
      }

      var minArenaHeight = Math.max(120, stageRect.height * 0.2);
      if ((bottomLimit - topLimit) < minArenaHeight) {
        topLimit = Math.max(safeTopDynamic + 8, stageRect.height * 0.28);
        bottomLimit = Math.min(stageRect.height - safeBottomDynamic - 8, stageRect.height * 0.78);
      }

      var nextLeft = Math.max(6, safeInlineDynamic);
      var nextRight = Math.max(nextLeft + 8, stageRect.width - safeInlineDynamic);
      if ((nextRight - nextLeft) < 260) {
        nextLeft = 6;
        nextRight = stageRect.width - 6;
      }

      arenaLeft = nextLeft;
      arenaRight = nextRight;
      arenaTop = Math.max(0, topLimit);
      arenaBottom = Math.min(stageRect.height, bottomLimit);
      if ((arenaBottom - arenaTop) < minArenaHeight) {
        arenaTop = Math.max(0, stageRect.height * 0.30);
        arenaBottom = Math.min(stageRect.height, stageRect.height * 0.80);
      }

      arenaWidth = Math.max(1, arenaRight - arenaLeft);
      arenaHeight = Math.max(1, arenaBottom - arenaTop);
    }

    for (var i = 0; i < configs.length; i++) {
      var cfg = configs[i];
      var el = hero.querySelector(cfg.selector);
      if (!el) continue;
      var body = {
        key: cfg.key,
        el: el,
        mass: cfg.mass || 1,
        driftX: cfg.driftX || 0,
        driftY: cfg.driftY || 0,
        wobble: isFinite(cfg.wobble) ? cfg.wobble : 0.6,
        staticBody: cfg.staticBody === true,
        alwaysActive: cfg.alwaysActive === true,
        revealEnabled: cfg.reveal !== false,
        allowRotation: cfg.allowRotation !== false,
        shapeInsetX: isFinite(cfg.shapeInsetX) ? cfg.shapeInsetX : 0.08,
        shapeInsetY: isFinite(cfg.shapeInsetY) ? cfg.shapeInsetY : 0.1,
        shapeOffsetX: isFinite(cfg.shapeOffsetX) ? cfg.shapeOffsetX : 0,
        shapeOffsetY: isFinite(cfg.shapeOffsetY) ? cfg.shapeOffsetY : 0,
        colliders: cfg.colliders || [[0.5, 0.5, 0.4]],
        anchorX: 0,
        anchorY: 0,
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        vx: 0,
        vy: 0,
        rot: 0,
        active: cfg.alwaysActive === true,
        phase: 0.75 + i * 1.08
      };
      bodies.push(body);
      bodyByKey[body.key] = body;
    }

    if (!bodies.length) return;

    function setBodyTransform(body) {
      var dx = body.x - body.anchorX;
      var dy = body.y - body.anchorY;
      body.el.style.setProperty("--landing-bubble-dx", dx.toFixed(2) + "px");
      body.el.style.setProperty("--landing-bubble-dy", dy.toFixed(2) + "px");
      body.el.style.setProperty("--landing-bubble-rot", body.rot.toFixed(3) + "deg");
      body.el.style.transform =
        "var(--landing-bubble-base-transform) " +
        "translate3d(" + dx.toFixed(2) + "px, " + dy.toFixed(2) + "px, 0) " +
        "rotate(" + body.rot.toFixed(3) + "deg) " +
        "scale(var(--landing-bubble-reveal-scale))";
    }

    function setPracticeTransform(dx, dy, rot) {
      if (!practiceCta) return;
      practiceCta.style.setProperty("--landing-bubble-dx", (dx || 0).toFixed(2) + "px");
      practiceCta.style.setProperty("--landing-bubble-dy", (dy || 0).toFixed(2) + "px");
      practiceCta.style.setProperty("--landing-bubble-rot", (rot || 0).toFixed(3) + "deg");
      practiceCta.style.transform =
        "var(--landing-bubble-base-transform) " +
        "translate3d(" + (dx || 0).toFixed(2) + "px, " + (dy || 0).toFixed(2) + "px, 0) " +
        "rotate(" + (rot || 0).toFixed(3) + "deg) " +
        "scale(var(--landing-bubble-reveal-scale))";
    }

    function resetBodyTransformVars(body) {
      body.el.style.setProperty("--landing-bubble-dx", "0px");
      body.el.style.setProperty("--landing-bubble-dy", "0px");
      body.el.style.setProperty("--landing-bubble-rot", "0deg");
      body.el.style.transform =
        "var(--landing-bubble-base-transform) translate3d(0px, 0px, 0) rotate(0deg) scale(var(--landing-bubble-reveal-scale))";
    }

    function resetBodiesToAnchor() {
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        body.x = body.anchorX;
        body.y = body.anchorY;
        body.vx = 0;
        body.vy = 0;
        body.rot = 0;
        setBodyTransform(body);
      }
    }

    function clampBodyToArena(body) {
      if (stageWidth <= 0 || stageHeight <= 0 || arenaWidth <= 0 || arenaHeight <= 0) return;
      var edgePad = Math.max(0.8, 2.2 - (currentCompression * 1.7));
      var halfW = body.w * 0.5;
      var halfH = body.h * 0.5;
      var minX = arenaLeft + halfW + edgePad;
      var maxX = arenaRight - halfW - edgePad;
      var minY = arenaTop + halfH + edgePad;
      var maxY = arenaBottom - halfH - edgePad;

      if (maxX <= minX) {
        body.x = (arenaLeft + arenaRight) * 0.5;
        body.vx = 0;
      } else if (body.x < minX) {
        body.x = minX;
        body.vx = Math.max(0, body.vx * -0.18);
      } else if (body.x > maxX) {
        body.x = maxX;
        body.vx = Math.min(0, body.vx * -0.18);
      }

      if (maxY <= minY) {
        body.y = (arenaTop + arenaBottom) * 0.5;
        body.vy = 0;
      } else if (body.y < minY) {
        body.y = minY;
        body.vy = Math.max(0, body.vy * -0.18);
      } else if (body.y > maxY) {
        body.y = maxY;
        body.vy = Math.min(0, body.vy * -0.18);
      }
    }

    function ensureDebugNodes() {
      if (!debugCollidersEnabled) return;
      if (debugNodes.length) return;
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        for (var j = 0; j < body.colliders.length; j++) {
          var marker = document.createElement("i");
          marker.className = "landing-bubble-debug-node";
          marker.setAttribute("aria-hidden", "true");
          stage.appendChild(marker);
          debugNodes.push({
            node: marker,
            body: body,
            collider: body.colliders[j]
          });
        }
      }
    }

    function syncDebugNodes() {
      if (!debugCollidersEnabled) return;
      ensureDebugNodes();
      for (var i = 0; i < debugNodes.length; i++) {
        var entry = debugNodes[i];
        var body = entry.body;
        var collider = entry.collider;
        var radius = Math.min(body.w, body.h) * collider[2];
        var x = body.x + ((collider[0] - 0.5) * body.w);
        var y = body.y + ((collider[1] - 0.5) * body.h);
        entry.node.style.width = Math.max(2, radius * 2).toFixed(2) + "px";
        entry.node.style.height = Math.max(2, radius * 2).toFixed(2) + "px";
        entry.node.style.left = (x - radius).toFixed(2) + "px";
        entry.node.style.top = (y - radius).toFixed(2) + "px";
      }
    }

    function captureAnchors(forceSnap) {
      if (!stage.isConnected) return false;

      for (var i = 0; i < bodies.length; i++) {
        resetBodyTransformVars(bodies[i]);
      }
      setPracticeTransform(0, 0, 0);

      var stageRect = stage.getBoundingClientRect();
      if (!stageRect.width || !stageRect.height) return false;

      stageWidth = stageRect.width;
      stageHeight = stageRect.height;
      currentCompression = computeViewportCompression(stageRect.width);
      syncArenaBounds(stageRect, currentCompression);

      for (var j = 0; j < bodies.length; j++) {
        var body = bodies[j];
        var prevOffsetX = body.x - body.anchorX;
        var prevOffsetY = body.y - body.anchorY;
        var rect = body.el.getBoundingClientRect();
        body.w = rect.width;
        body.h = rect.height;
        body.anchorX = (rect.left - stageRect.left) + (rect.width * 0.5);
        body.anchorY = (rect.top - stageRect.top) + (rect.height * 0.5);

        if (forceSnap || !isFinite(prevOffsetX) || !isFinite(prevOffsetY)) {
          body.x = body.anchorX;
          body.y = body.anchorY;
          body.vx = 0;
          body.vy = 0;
        } else {
          body.x = body.anchorX + (prevOffsetX * 0.5);
          body.y = body.anchorY + (prevOffsetY * 0.5);
        }
        clampBodyToArena(body);
        setBodyTransform(body);
      }

      syncDebugNodes();
      return true;
    }

    function activeBodies() {
      var list = [];
      for (var i = 0; i < bodies.length; i++) {
        if (bodies[i].active) list.push(bodies[i]);
      }
      return list;
    }

    function inverseMass(body) {
      if (!body || body.staticBody) return 0;
      return 1 / Math.max(0.0001, body.mass || 1);
    }

    function getVisualBox(body) {
      var insetX = clamp01(body.shapeInsetX || 0);
      var insetY = clamp01(body.shapeInsetY || 0);
      var innerW = Math.max(6, body.w * (1 - (insetX * 2)));
      var innerH = Math.max(6, body.h * (1 - (insetY * 2)));
      var centerX = body.x + ((body.shapeOffsetX || 0) * body.w);
      var centerY = body.y + ((body.shapeOffsetY || 0) * body.h);
      return {
        cx: centerX,
        cy: centerY,
        halfW: innerW * 0.5,
        halfH: innerH * 0.5
      };
    }

    function resolveVisualOverlap(a, b, padding, compression) {
      var pressure = clamp01(compression || 0);
      var boxA = getVisualBox(a);
      var boxB = getVisualBox(b);
      var dx = boxB.cx - boxA.cx;
      var dy = boxB.cy - boxA.cy;
      var targetHalfW = boxA.halfW + boxB.halfW + padding;
      var targetHalfH = boxA.halfH + boxB.halfH + padding;
      var overlapX = targetHalfW - Math.abs(dx);
      var overlapY = targetHalfH - Math.abs(dy);
      if (overlapX <= 0 || overlapY <= 0) return;

      var invMassA = inverseMass(a);
      var invMassB = inverseMass(b);
      var invMassTotal = invMassA + invMassB;
      if (invMassTotal <= 0) return;

      var nearHorizontal = Math.abs(dy) < (targetHalfH * (0.22 + (pressure * 0.26)));
      var separateOnY = nearHorizontal || (overlapY < (overlapX * 0.92));
      var sepX = 0;
      var sepY = 0;
      if (separateOnY) {
        sepY = overlapY;
      } else {
        sepX = overlapX;
      }

      var nx = 0;
      var ny = 0;
      if (sepY > 0) {
        ny = dy >= 0 ? 1 : -1;
      } else {
        nx = dx >= 0 ? 1 : -1;
      }
      if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) {
        ny = (a.key < b.key) ? -1 : 1;
        nx = 0;
      }

      var move = sepX > 0 ? sepX : sepY;
      var moveA = move * (invMassA / invMassTotal);
      var moveB = move * (invMassB / invMassTotal);
      a.x -= nx * moveA;
      a.y -= ny * moveA;
      b.x += nx * moveB;
      b.y += ny * moveB;

      var impulse = move * (0.018 + (pressure * 0.02));
      var yBoost = separateOnY ? (1.35 + (pressure * 0.22)) : 1;
      var xBoost = separateOnY ? 0.75 : 1;
      a.vx -= nx * impulse * xBoost * (invMassA / invMassTotal);
      a.vy -= ny * impulse * yBoost * (invMassA / invMassTotal);
      b.vx += nx * impulse * xBoost * (invMassB / invMassTotal);
      b.vy += ny * impulse * yBoost * (invMassB / invMassTotal);
    }

    function resolvePairCollision(a, b, padding, compression) {
      var pressure = clamp01(compression || 0);
      var invMassA = inverseMass(a);
      var invMassB = inverseMass(b);
      var invMassTotal = invMassA + invMassB;
      if (invMassTotal <= 0) return;

      for (var ai = 0; ai < a.colliders.length; ai++) {
        var cA = a.colliders[ai];
        var aRadiusBase = Math.min(a.w, a.h);
        var aRadius = aRadiusBase * cA[2];
        var ax = a.x + ((cA[0] - 0.5) * a.w);
        var ay = a.y + ((cA[1] - 0.5) * a.h);

        for (var bi = 0; bi < b.colliders.length; bi++) {
          var cB = b.colliders[bi];
          var bRadiusBase = Math.min(b.w, b.h);
          var bRadius = bRadiusBase * cB[2];
          var bx = b.x + ((cB[0] - 0.5) * b.w);
          var by = b.y + ((cB[1] - 0.5) * b.h);

          var dx = bx - ax;
          var dy = by - ay;
          var distSq = (dx * dx) + (dy * dy);
          var minDist = aRadius + bRadius + padding;
          if (distSq >= (minDist * minDist)) continue;

          var dist = Math.sqrt(distSq);
          var nx = 1;
          var ny = 0;
          if (dist > 0.0001) {
            nx = dx / dist;
            ny = dy / dist;
          } else {
            var seed = ((ai + 1) * (bi + 2)) + 0.5;
            nx = Math.cos(seed);
            ny = Math.sin(seed);
          }

          var nearHorizontal = Math.abs(dy) < (minDist * (0.24 + (pressure * 0.16)));
          if (nearHorizontal) {
            var verticalSign = (a.anchorY <= b.anchorY) ? -1 : 1;
            if (Math.abs(a.anchorY - b.anchorY) < 6) {
              verticalSign = (a.key < b.key) ? -1 : 1;
            }
            ny = (ny * 0.24) + (verticalSign * 0.76);
            nx *= 0.64;
            var normalLen = Math.sqrt((nx * nx) + (ny * ny)) || 1;
            nx /= normalLen;
            ny /= normalLen;
          }

          var overlap = minDist - (dist || 0.0001);
          if (overlap <= 0) continue;

          var moveA = overlap * (invMassA / invMassTotal);
          var moveB = overlap * (invMassB / invMassTotal);

          a.x -= nx * moveA;
          a.y -= ny * moveA;
          b.x += nx * moveB;
          b.y += ny * moveB;

          var impulse = overlap * (0.02 + (pressure * 0.018));
          var impulseXScale = nearHorizontal ? 0.72 : 1;
          var impulseYScale = nearHorizontal ? (1.45 + (pressure * 0.25)) : 1;
          a.vx -= nx * impulse * impulseXScale * (invMassA / invMassTotal);
          a.vy -= ny * impulse * impulseYScale * (invMassA / invMassTotal);
          b.vx += nx * impulse * impulseXScale * (invMassB / invMassTotal);
          b.vy += ny * impulse * impulseYScale * (invMassB / invMassTotal);
        }
      }
    }

    function frame(nowMs) {
      if (!running) return;
      if (isMobileLayout() || !inView) {
        stopPhysics(true);
        return;
      }

      if (!lastFrameMs) lastFrameMs = nowMs;
      var dt = (nowMs - lastFrameMs) / 16.667;
      if (!isFinite(dt) || dt <= 0) dt = 1;
      if (dt > 2.2) dt = 2.2;
      lastFrameMs = nowMs;

      var stageRect = stage.getBoundingClientRect();
      if (!stageRect.width || !stageRect.height) {
        rafId = window.requestAnimationFrame(frame);
        return;
      }
      stageWidth = stageRect.width;
      stageHeight = stageRect.height;
      syncArenaBounds(stageRect, 0);

      var actives = activeBodies();
      if (!actives.length) {
        rafId = window.requestAnimationFrame(frame);
        return;
      }

      var viewportCompression = computeViewportCompression(stageWidth);
      var crowdingCompression = computeCrowdingCompression(actives);
      var squeeze = clamp01(Math.max(viewportCompression, crowdingCompression));
      currentCompression = squeeze;
      syncArenaBounds(stageRect, squeeze);

      var basePadding = 14 - (squeeze * 11);
      if (basePadding < 2) basePadding = 2;

      var timeSec = nowMs * 0.001;
      var dampingX = 0.86;
      var dampingY = 0.92;
      var springX = 0.031;
      var springY = 0.015;
      // Keep desktop idle bubble motion live even if reveal transitions are reduced.
      var reduced = false;
      // Desktop bubble breathing/float tuning knobs.
      var bubbleWobbleBase = 2.35;
      var bubbleWobbleSqueezeGain = 2.65;
      var bubbleFloatBase = 2.24;
      var bubbleFloatSqueezeGain = 1.04;
      var groupSpread = squeeze * ((arenaWidth * 0.34) + 84);
      var laneBiasByKey = {
        hi: -26,
        preferred: -58,
        uyghur: -24,
        legally: 30,
        studio: 50,
        logo: 0
      };

      for (var i = 0; i < actives.length; i++) {
        var body = actives[i];
        if (body.staticBody) {
          body.x = body.anchorX;
          body.y = body.anchorY;
          body.vx = 0;
          body.vy = 0;
          continue;
        }

        var wobbleAmp = reduced ? 0 : (bubbleWobbleBase + (squeeze * bubbleWobbleSqueezeGain));
        var wobbleX = reduced ? 0 : Math.sin((timeSec * body.wobble) + body.phase) * wobbleAmp;
        var wobbleY = reduced ? 0 : Math.cos((timeSec * body.wobble * 0.88) + (body.phase * 0.91)) * wobbleAmp * 0.58;
        var floatX = 0;
        var floatY = 0;
        if (!reduced) {
          var breath = Math.sin((timeSec * 0.62) + (body.phase * 0.86));
          var sway = Math.cos((timeSec * 0.46) + (body.phase * 1.18));
          var jitter = Math.sin((timeSec * 1.54) + (body.phase * 2.13));
          var micro = Math.sin((timeSec * 2.42) + (body.phase * 3.27));
          var floatAmp = (bubbleFloatBase + (squeeze * bubbleFloatSqueezeGain)) * (0.92 + ((body.wobble || 0.6) * 0.2));
          floatX = ((sway * 0.94) + (jitter * 0.28) + (micro * 0.12)) * floatAmp;
          floatY = ((breath * 1.92) + (jitter * 0.44) + (micro * 0.18)) * floatAmp;
        }
        var driftWeight = 0.36 + (squeeze * 0.96);
        var laneY = (laneBiasByKey[body.key] || 0) * squeeze;
        var sidePushX = groupSpread * 0.66;
        var targetX = body.anchorX + sidePushX + (body.driftX * driftWeight) + wobbleX + floatX;
        var targetY = body.anchorY + laneY + (body.driftY * driftWeight) + wobbleY + floatY;

        body.vx += (targetX - body.x) * springX * dt;
        body.vy += (targetY - body.y) * springY * dt;
        body.vx *= dampingX;
        body.vy *= dampingY;

        body.x += body.vx * dt;
        body.y += body.vy * dt;
      }

      var solverIterations = 4 + Math.round(squeeze * 3);
      for (var iter = 0; iter < solverIterations; iter++) {
        for (var a = 0; a < actives.length; a++) {
          for (var b = a + 1; b < actives.length; b++) {
            resolvePairCollision(actives[a], actives[b], basePadding, squeeze);
            resolveVisualOverlap(actives[a], actives[b], Math.max(1, basePadding * 0.5), squeeze);
          }
        }
        for (var c = 0; c < actives.length; c++) {
          clampBodyToArena(actives[c]);
        }
      }

      for (var k = 0; k < actives.length; k++) {
        var item = actives[k];
        var nextRot = (item.vx * 0.2) - (item.vy * 0.08);
        if (!item.allowRotation) {
          nextRot = 0;
        }
        if (!isFinite(nextRot)) nextRot = 0;
        if (nextRot > 3.3) nextRot = 3.3;
        if (nextRot < -3.3) nextRot = -3.3;
        item.rot = item.allowRotation ? ((item.rot * 0.68) + (nextRot * 0.32)) : 0;
        setBodyTransform(item);
      }

      setPracticeTransform(0, 0, 0);
      syncDebugNodes();
      rafId = window.requestAnimationFrame(frame);
    }

    function startPhysics() {
      if (running || manualPause || isMobileLayout() || !inView) return;
      running = true;
      lastFrameMs = 0;
      rafId = window.requestAnimationFrame(frame);
    }

    function stopPhysics(resetToAnchor) {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      running = false;
      lastFrameMs = 0;
      if (resetToAnchor) {
        resetBodiesToAnchor();
      }
    }

    function revealByKey(key) {
      if (key === "practice") {
        if (!practiceCta) return;
        practiceCta.classList.add("is-visible", "is-arrow-visible");
        return;
      }
      var item = bodyByKey[key];
      if (!item) return;
      item.el.classList.add("is-visible");
      item.active = true;
    }

    function clearRevealTimers() {
      for (var i = 0; i < revealTimers.length; i++) {
        window.clearTimeout(revealTimers[i]);
      }
      revealTimers = [];
    }

    function playRevealSequence() {
      clearRevealTimers();
      root.classList.remove("landing-bubbles-anim-done");
      root.classList.add("landing-bubbles-anim-ready");

      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        if (body.revealEnabled) {
          body.el.classList.remove("is-visible");
        } else {
          body.el.classList.add("is-visible");
        }
        body.active = body.alwaysActive;
      }
      if (practiceCta) {
        practiceCta.classList.remove("is-visible", "is-arrow-visible", "is-copy-visible");
      }
      if (practiceArrow) {
        practiceArrow.classList.remove("is-visible");
      }
      if (practiceCopy) {
        practiceCopy.classList.remove("is-visible");
      }

      if (prefersReducedMotion()) {
        var quickOrder = ["hi", "preferred", "uyghur", "legally", "studio"];
        for (var r = 0; r < quickOrder.length; r++) {
          revealByKey(quickOrder[r]);
        }
        if (practiceCta) {
          practiceCta.classList.add("is-visible", "is-arrow-visible", "is-copy-visible");
        }
        if (practiceArrow) {
          practiceArrow.classList.add("is-visible");
        }
        if (practiceCopy) {
          practiceCopy.classList.add("is-visible");
        }
        root.classList.remove("landing-bubbles-anim-ready");
        root.classList.add("landing-bubbles-anim-done");
        return;
      }

      var timeline = [
        { at: 70, type: "bubble", key: "hi" },
        { at: 220, type: "bubble", key: "preferred" },
        { at: 650, type: "bubble", key: "uyghur" },
        { at: 820, type: "bubble", key: "legally" },
        { at: 960, type: "bubble", key: "studio" },
        { at: 1400, type: "cta-arrow" },
        { at: 1570, type: "cta-copy" }
      ];

      for (var t = 0; t < timeline.length; t++) {
        (function (entry) {
          var timerId = window.setTimeout(function () {
            if (entry.type === "bubble") {
              revealByKey(entry.key);
              return;
            }
            if (entry.type === "cta-arrow") {
              revealByKey("practice");
              if (practiceArrow) {
                practiceArrow.classList.add("is-visible");
              }
              return;
            }
            if (entry.type === "cta-copy") {
              if (practiceCta) practiceCta.classList.add("is-copy-visible");
              if (practiceCopy) {
                practiceCopy.classList.add("is-visible");
              }
            }
          }, entry.at);
          revealTimers.push(timerId);
        })(timeline[t]);
      }

      var doneTimer = window.setTimeout(function () {
        root.classList.remove("landing-bubbles-anim-ready");
        root.classList.add("landing-bubbles-anim-done");
      }, 2150);
      revealTimers.push(doneTimer);
    }

    function handleResize() {
      if (resizeRafId) {
        window.cancelAnimationFrame(resizeRafId);
      }
      resizeRafId = window.requestAnimationFrame(function () {
        resizeRafId = 0;
        if (!captureAnchors(false)) return;
        if (manualPause) {
          stopPhysics(false);
          return;
        }
        if (isMobileLayout()) {
          stopPhysics(true);
        } else {
          startPhysics();
        }
      });
    }

    window.addEventListener("resize", handleResize, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
    }

    bindMqChange(mobileMq, handleResize);
    bindMqChange(reduceMotionMq, function () {
      if (prefersReducedMotion()) {
        clearRevealTimers();
        for (var i = 0; i < bodies.length; i++) {
          if (bodies[i].revealEnabled) {
            bodies[i].el.classList.add("is-visible");
          }
          bodies[i].active = true;
        }
        if (practiceCta) {
          practiceCta.classList.add("is-visible", "is-arrow-visible", "is-copy-visible");
        }
        if (practiceArrow) {
          practiceArrow.classList.add("is-visible");
        }
        if (practiceCopy) {
          practiceCopy.classList.add("is-visible");
        }
        root.classList.remove("landing-bubbles-anim-ready");
        root.classList.add("landing-bubbles-anim-done");
      }
    });

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          if (!entries || !entries.length) return;
          inView = !!entries[0].isIntersecting;
          if (inView) {
            if (!manualPause) {
              startPhysics();
            }
          } else {
            stopPhysics(false);
          }
        },
        { threshold: 0.08 }
      );
      observer.observe(hero);
    }

    window.requestAnimationFrame(function () {
      if (!captureAnchors(true)) return;
      playRevealSequence();
      if (isMobileLayout()) {
        stopPhysics(true);
      } else {
        startPhysics();
      }
    });

    return {
      pause: function (resetToAnchor) {
        manualPause = true;
        stopPhysics(resetToAnchor !== false);
      },
      resume: function () {
        manualPause = false;
        if (!captureAnchors(false)) return;
        if (isMobileLayout()) {
          stopPhysics(true);
          return;
        }
        if (inView) {
          startPhysics();
        }
      },
      syncLayout: function (resetToAnchor) {
        captureAnchors(!!resetToAnchor);
      }
    };
  }

  function initLandingExclusionInline(bubbleMotionApi) {
    var root = document.documentElement;
    var hero = document.getElementById("homepage---left");
    var canvas = hero ? hero.querySelector(".hero3042-canvas") : null;
    var stage = hero ? hero.querySelector(".landing3042-stage") : null;
    var mediaStack = hero ? hero.querySelector(".landing3042-exclusion-media-stack") : null;
    var sceneMobile = hero ? hero.querySelector(".landing3042-exclusion-scene-mobile") : null;
    var practiceCta = hero ? hero.querySelector(".landing3042-practice-cta") : null;
    var trigger = hero ? hero.querySelector("[data-trigger='exclusion']") : null;
    var panel = document.getElementById("landing3042-exclusion-inline");
    var closeBtn = document.getElementById("landing3042-exclusion-close");
    var bubbles = hero ? hero.querySelector(".landing3042-bubbles") : null;
    var logo = hero ? hero.querySelector(".landing3042-logo") : null;
    var titleCopy = hero ? hero.querySelector(".landing3042-title-copy") : null;
    var lastTrigger = null;
    var desktopMq = window.matchMedia ? window.matchMedia("(min-width: 768px)") : null;
    var exclusionResizeRaf = 0;
    var exclusionResizeObserver = null;

    if (!hero || !trigger || !panel || !closeBtn) return null;
    if (!root.hasAttribute("data-landing-surface-state")) {
      root.setAttribute("data-landing-surface-state", "home");
    }

    function focusNode(node) {
      if (!node || typeof node.focus !== "function") return;
      try {
        node.focus({ preventScroll: true });
      } catch (error) {
        node.focus();
      }
    }

    function isOpen() {
      return root.getAttribute("data-landing-surface-state") === "exclusion";
    }

    function clearResponsiveLayoutState() {
      root.removeAttribute("data-exclusion-layout-mode");
      root.style.removeProperty("--landing-exclusion-fit-scale");
      root.style.removeProperty("--landing-exclusion-cta-scale");
      root.style.removeProperty("--landing-exclusion-cta-bottom");
      root.style.removeProperty("--landing-exclusion-inline-locked-top");
      root.style.removeProperty("--landing-exclusion-inline-locked-bottom");
      root.style.removeProperty("--landing-exclusion-heading-stretch-scale");
      root.style.removeProperty("--landing-exclusion-body-stretch-scale");
      root.style.removeProperty("--landing-exclusion-mobile-locked-top");
      root.style.removeProperty("--landing-exclusion-mobile-locked-bottom");
      root.style.removeProperty("--landing-exclusion-mobile-scale");
      if (mediaStack) {
        mediaStack.style.removeProperty("--landing-exclusion-tablet-media-base-w");
      }
    }

    function syncTabletTopGap() {
      var frameWidth = canvas ? canvas.clientWidth || 0 : 0;
      if (!stage || !titleCopy || frameWidth < 768 || frameWidth > 1020) {
        root.style.removeProperty("--landing-exclusion-inline-locked-top");
        return;
      }

      var stageRect = stage.getBoundingClientRect();
      var titleRect = titleCopy.getBoundingClientRect();
      if (!stageRect || !titleRect) {
        root.style.removeProperty("--landing-exclusion-inline-locked-top");
        return;
      }

      var measuredTop = titleRect.bottom - stageRect.top + 20;
      if (!Number.isFinite(measuredTop) || measuredTop <= 0) {
        root.style.removeProperty("--landing-exclusion-inline-locked-top");
        return;
      }

      root.style.setProperty("--landing-exclusion-inline-locked-top", measuredTop.toFixed(2) + "px");
    }

    function syncTabletMediaFit(frameWidth) {
      if (!mediaStack || frameWidth < 768 || frameWidth > 1020) {
        if (mediaStack) {
          mediaStack.style.removeProperty("--landing-exclusion-tablet-media-base-w");
        }
        return;
      }

      var stackHeight = mediaStack.clientHeight || 0;
      var stackWidth = mediaStack.clientWidth || 0;
      if (!stackHeight || !stackWidth) {
        mediaStack.style.removeProperty("--landing-exclusion-tablet-media-base-w");
        return;
      }

      var stackStyles = window.getComputedStyle(mediaStack);
      var paddingTop = parseFloat(stackStyles.paddingTop) || 0;
      var paddingRight = parseFloat(stackStyles.paddingRight) || 0;
      var paddingBottom = parseFloat(stackStyles.paddingBottom) || 0;
      var paddingLeft = parseFloat(stackStyles.paddingLeft) || 0;
      var gap = parseFloat(stackStyles.rowGap || stackStyles.gap) || 0;
      var usableWidth = Math.max(0, stackWidth - paddingLeft - paddingRight);
      var usableHeight = Math.max(0, stackHeight - paddingTop - paddingBottom - (gap * 5));
      var heightCoefficient = 1.8586501932144356;
      var visualScaleBoost = 1;
      var baseWidth = Math.min(usableWidth, (usableHeight / heightCoefficient) * visualScaleBoost);

      if (!Number.isFinite(baseWidth) || baseWidth <= 0) {
        mediaStack.style.removeProperty("--landing-exclusion-tablet-media-base-w");
        return;
      }

      mediaStack.style.setProperty("--landing-exclusion-tablet-media-base-w", baseWidth.toFixed(2) + "px");
    }

    function syncMobileResponsiveLayoutState(frameWidth) {
      root.removeAttribute("data-exclusion-layout-mode");
      root.style.removeProperty("--landing-exclusion-fit-scale");
      root.style.removeProperty("--landing-exclusion-cta-scale");
      root.style.removeProperty("--landing-exclusion-cta-bottom");
      root.style.removeProperty("--landing-exclusion-inline-locked-top");
      root.style.removeProperty("--landing-exclusion-inline-locked-bottom");
      root.style.removeProperty("--landing-exclusion-heading-stretch-scale");
      root.style.removeProperty("--landing-exclusion-body-stretch-scale");
      if (mediaStack) {
        mediaStack.style.removeProperty("--landing-exclusion-tablet-media-base-w");
      }

      if (!stage || !titleCopy || !practiceCta || !sceneMobile) {
        root.style.removeProperty("--landing-exclusion-mobile-locked-top");
        root.style.removeProperty("--landing-exclusion-mobile-locked-bottom");
        root.style.removeProperty("--landing-exclusion-mobile-scale");
        return;
      }

      var stageRect = stage.getBoundingClientRect();
      var titleRect = titleCopy.getBoundingClientRect();
      var ctaRect = practiceCta.getBoundingClientRect();
      if (!stageRect.width || !stageRect.height || !titleRect.height || !ctaRect.height) {
        root.style.removeProperty("--landing-exclusion-mobile-locked-top");
        root.style.removeProperty("--landing-exclusion-mobile-locked-bottom");
        root.style.removeProperty("--landing-exclusion-mobile-scale");
        return;
      }

      var topGap = 12;
      var bottomGap = 4;
      var topPx = Math.max(0, (titleRect.bottom - stageRect.top) + topGap);
      var bottomPx = Math.max(0, (stageRect.bottom - ctaRect.top) + bottomGap);
      var availableHeight = Math.max(0, stageRect.height - topPx - bottomPx);

      root.style.setProperty("--landing-exclusion-mobile-locked-top", topPx.toFixed(2) + "px");
      root.style.setProperty("--landing-exclusion-mobile-locked-bottom", bottomPx.toFixed(2) + "px");

      var naturalHeight = sceneMobile.scrollHeight || sceneMobile.getBoundingClientRect().height || 0;
      if (!naturalHeight || !availableHeight) {
        root.style.removeProperty("--landing-exclusion-mobile-scale");
        return;
      }

      var fitScale = Math.min(1.08, Math.min(1, availableHeight / naturalHeight) * 1.08);
      root.style.setProperty("--landing-exclusion-mobile-scale", fitScale.toFixed(6));
    }

    function syncResponsiveLayoutState() {
      exclusionResizeRaf = 0;
      if (!hero || !canvas) {
        clearResponsiveLayoutState();
        return;
      }

      // The name-entry view does not use the legacy conversation fit calculations.
      if (panel.querySelector('[data-exclusion-layout="name-entry"]')) {
        clearResponsiveLayoutState();
        return;
      }

      var frameWidth = canvas.clientWidth || hero.clientWidth || 0;
      var frameHeight = canvas.clientHeight || hero.clientHeight || 0;
      if (!frameWidth || !frameHeight) {
        clearResponsiveLayoutState();
        return;
      }

      if (desktopMq && !desktopMq.matches) {
        syncMobileResponsiveLayoutState(frameWidth);
        return;
      }

      var perfectHeight = frameWidth * (771 / 1512);
      var heightRatio = frameHeight / perfectHeight;
      var compactThreshold = 0.84;
      if (frameHeight + 0.5 < perfectHeight * compactThreshold) {
        root.setAttribute("data-exclusion-layout-mode", "compact");
        root.style.setProperty("--landing-exclusion-fit-scale", "1");
        root.style.setProperty("--landing-exclusion-cta-scale", Math.max(0.56, Math.min(0.76, heightRatio * 0.84)).toFixed(6));
        root.style.setProperty("--landing-exclusion-cta-bottom", Math.max(8, Math.min(18, frameHeight * 0.016)).toFixed(2) + "px");
        root.style.removeProperty("--landing-exclusion-inline-locked-top");
        root.style.removeProperty("--landing-exclusion-inline-locked-bottom");
        root.style.setProperty("--landing-exclusion-heading-stretch-scale", "1");
        root.style.setProperty("--landing-exclusion-body-stretch-scale", "1");
        syncTabletMediaFit(frameWidth);
        return;
      }

      if (frameHeight + 0.5 < perfectHeight) {
        var fitScale = Math.max(0.76, Math.min(1, heightRatio));
        var scaleProgress = (1 - heightRatio) / (1 - compactThreshold);
        var inlineBottom = 7.473545 * (1 - Math.max(0, Math.min(1, scaleProgress)));
        root.setAttribute("data-exclusion-layout-mode", "scale");
        root.style.setProperty("--landing-exclusion-fit-scale", fitScale.toFixed(6));
        root.style.setProperty("--landing-exclusion-cta-scale", Math.max(0.74, Math.min(0.94, heightRatio * 0.88)).toFixed(6));
        root.style.removeProperty("--landing-exclusion-cta-bottom");
        root.style.removeProperty("--landing-exclusion-inline-locked-top");
        root.style.setProperty("--landing-exclusion-inline-locked-bottom", inlineBottom.toFixed(6) + "cqw");
        root.style.setProperty("--landing-exclusion-heading-stretch-scale", "1");
        root.style.setProperty("--landing-exclusion-body-stretch-scale", "1");
        syncTabletMediaFit(frameWidth);
        return;
      }

      var widthDeficit = Math.max(0, 1 - (frameWidth / 1366));
      var stretchHeadingScale = Math.min(1.10, 1 + (widthDeficit * 0.24));
      var stretchBodyScale = Math.min(1.34, 1 + (widthDeficit * 1.08));
      root.setAttribute("data-exclusion-layout-mode", "stretch");
      root.style.setProperty("--landing-exclusion-fit-scale", "1");
      root.style.setProperty("--landing-exclusion-cta-scale", "1");
      root.style.removeProperty("--landing-exclusion-cta-bottom");
      root.style.removeProperty("--landing-exclusion-inline-locked-bottom");
      root.style.setProperty("--landing-exclusion-heading-stretch-scale", stretchHeadingScale.toFixed(6));
      root.style.setProperty("--landing-exclusion-body-stretch-scale", stretchBodyScale.toFixed(6));
      syncTabletTopGap();
      syncTabletMediaFit(frameWidth);
    }

    function scheduleResponsiveLayoutSync() {
      if (exclusionResizeRaf) cancelAnimationFrame(exclusionResizeRaf);
      exclusionResizeRaf = requestAnimationFrame(syncResponsiveLayoutState);
    }

    function shouldStartOpen() {
      var searchParams = new URLSearchParams(window.location.search || "");
      var searchValue = searchParams.get("landingSurface") || searchParams.get("landing-surface");
      if (typeof searchValue === "string" && searchValue.toLowerCase() === "exclusion") return true;

      var hash = window.location.hash || "";
      if (!hash) return false;
      return hash.toLowerCase() === "#exclusion";
    }

    function hasExclusionHash() {
      return (window.location.hash || "").toLowerCase() === "#exclusion";
    }

    function writeExclusionHash() {
      if (hasExclusionHash()) return;
      window.location.hash = "exclusion";
    }

    function clearExclusionHash() {
      if (!hasExclusionHash()) return;
      var cleanUrl = window.location.pathname + window.location.search;
      window.history.replaceState(window.history.state, "", cleanUrl);
    }

    function syncFromHash() {
      if (hasExclusionHash()) {
        openExclusion(trigger);
        return;
      }
      if (isOpen()) {
        closeExclusion({ restoreFocus: false, skipHash: true });
      }
    }

    function syncDomState(open) {
      if (open) {
        root.setAttribute("data-landing-surface-state", "exclusion");
      } else if (root.getAttribute("data-landing-surface-state") === "exclusion") {
        root.setAttribute("data-landing-surface-state", "home");
      }
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      panel.setAttribute("aria-hidden", open ? "false" : "true");
      closeBtn.setAttribute("aria-hidden", open ? "false" : "true");
      closeBtn.tabIndex = open ? 0 : -1;
      panel.hidden = !open;
      closeBtn.hidden = !open;
      if (bubbles) bubbles.hidden = open;
      if (logo) logo.hidden = open;
    }

    function openExclusion(triggerEl) {
      if (isOpen()) return;
      if (hero.__landingStudioInlineApi && typeof hero.__landingStudioInlineApi.isOpen === "function" && hero.__landingStudioInlineApi.isOpen()) {
        hero.__landingStudioInlineApi.close({ restoreFocus: false });
      }
      lastTrigger = triggerEl || document.activeElement || trigger;
      syncDomState(true);
      scheduleResponsiveLayoutSync();
      if (bubbleMotionApi && typeof bubbleMotionApi.pause === "function") {
        bubbleMotionApi.pause(true);
      }
      writeExclusionHash();
      window.requestAnimationFrame(function () {
        focusNode(closeBtn);
      });
    }

    function closeExclusion(options) {
      var opts = options || {};
      if (!isOpen()) return;
      syncDomState(false);
      clearResponsiveLayoutState();
      if (opts.skipHash !== true) {
        clearExclusionHash();
      }
      if (bubbleMotionApi && typeof bubbleMotionApi.resume === "function") {
        bubbleMotionApi.resume();
      }
      if (opts.restoreFocus === false) return;
      var target = lastTrigger || trigger;
      lastTrigger = null;
      window.requestAnimationFrame(function () {
        focusNode(target);
      });
    }

    trigger.addEventListener("click", function (event) {
      event.preventDefault();
      if (isOpen()) {
        closeExclusion();
        return;
      }
      openExclusion(trigger);
    });

    closeBtn.addEventListener("click", function (event) {
      event.preventDefault();
      closeExclusion();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      if (!isOpen()) return;
      if (root.classList.contains("project-inline-open")) return;
      if (root.classList.contains("map-project-open")) return;
      closeExclusion();
    });

    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("popstate", syncFromHash);

    window.addEventListener("resize", scheduleResponsiveLayoutSync, { passive: true });

    if (desktopMq && typeof desktopMq.addEventListener === "function") {
      desktopMq.addEventListener("change", scheduleResponsiveLayoutSync);
    } else if (desktopMq && typeof desktopMq.addListener === "function") {
      desktopMq.addListener(scheduleResponsiveLayoutSync);
    }

    if (canvas && typeof ResizeObserver === "function") {
      exclusionResizeObserver = new ResizeObserver(function () {
        scheduleResponsiveLayoutSync();
      });
      exclusionResizeObserver.observe(canvas);
    }

    syncDomState(false);
    if (shouldStartOpen()) {
      openExclusion(trigger);
    }
    var api = {
      isOpen: isOpen,
      open: openExclusion,
      close: closeExclusion
    };
    hero.__landingExclusionInlineApi = api;
    return api;
  }

  function initLandingStudioInline(bubbleMotionApi) {
    var root = document.documentElement;
    var hero = document.getElementById("homepage---left");
    var trigger = hero ? hero.querySelector("[data-trigger='studio']") : null;
    var panel = document.getElementById("landing3042-studio-inline");
    var closeBtn = document.getElementById("landing3042-studio-close");
    var surface = panel ? panel.querySelector(".landing3042-studio-surface") : null;
    var bubbles = hero ? hero.querySelector(".landing3042-bubbles") : null;
    var logo = hero ? hero.querySelector(".landing3042-logo") : null;
    var stage = hero ? hero.querySelector(".landing3042-stage") : null;
    var practiceCta = hero ? hero.querySelector(".landing3042-practice-cta") : null;
    var practiceArrow = practiceCta ? practiceCta.querySelector(".landing3042-practice-cta-arrow") : null;
    var defaultPracticeArrowSrc = practiceArrow ? practiceArrow.getAttribute("src") || "" : "";
    var studioPracticeArrowSrc = "./assets/GanStudio/gan-studio-arrow.svg";
    var lastTrigger = null;
    var studioResizeRaf = 0;
    var studioResizeObserver = null;

    if (!hero || !trigger || !panel || !closeBtn) return null;
    if (!root.hasAttribute("data-landing-surface-state")) {
      root.setAttribute("data-landing-surface-state", "home");
    }

    function focusNode(node) {
      if (!node || typeof node.focus !== "function") return;
      try {
        node.focus({ preventScroll: true });
      } catch (error) {
        node.focus();
      }
    }

    function isOpen() {
      return root.getAttribute("data-landing-surface-state") === "studio";
    }

    function clearResponsiveLayoutState() {
      if (surface) {
        surface.style.removeProperty("--landing-studio-fit-scale");
        surface.style.removeProperty("--landing-studio-fit-top");
      }
    }

    function syncPracticeArrow(open) {
      if (!practiceArrow || !defaultPracticeArrowSrc) return;
      practiceArrow.setAttribute("src", open ? studioPracticeArrowSrc : defaultPracticeArrowSrc);
    }

    function syncResponsiveLayoutState() {
      studioResizeRaf = 0;
      if (!isOpen()) {
        clearResponsiveLayoutState();
        return;
      }
      clearResponsiveLayoutState();
    }

    function scheduleResponsiveLayoutSync() {
      if (studioResizeRaf) cancelAnimationFrame(studioResizeRaf);
      studioResizeRaf = requestAnimationFrame(syncResponsiveLayoutState);
    }

    function shouldStartOpen() {
      var searchParams = new URLSearchParams(window.location.search || "");
      var searchValue = searchParams.get("landingSurface") || searchParams.get("landing-surface");
      if (typeof searchValue === "string" && searchValue.toLowerCase() === "studio") return true;

      var hash = window.location.hash || "";
      if (!hash) return false;
      return hash.toLowerCase() === "#studio";
    }

    function hasStudioHash() {
      return (window.location.hash || "").toLowerCase() === "#studio";
    }

    function writeStudioHash() {
      if (hasStudioHash()) return;
      window.location.hash = "studio";
    }

    function clearStudioHash() {
      if (!hasStudioHash()) return;
      var cleanUrl = window.location.pathname + window.location.search;
      window.history.replaceState(window.history.state, "", cleanUrl);
    }

    function syncFromHash() {
      if (hasStudioHash()) {
        openStudio(trigger);
        return;
      }
      if (isOpen()) {
        closeStudio({ restoreFocus: false });
      }
    }

    function syncDomState(open) {
      if (open) {
        root.setAttribute("data-landing-surface-state", "studio");
      } else if (root.getAttribute("data-landing-surface-state") === "studio") {
        root.setAttribute("data-landing-surface-state", "home");
      }
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      panel.setAttribute("aria-hidden", open ? "false" : "true");
      closeBtn.setAttribute("aria-hidden", open ? "false" : "true");
      closeBtn.tabIndex = open ? 0 : -1;
      panel.hidden = !open;
      closeBtn.hidden = !open;
      if (bubbles) bubbles.hidden = open;
      if (logo) logo.hidden = open;
      syncPracticeArrow(open);
    }

    function openStudio(triggerEl) {
      if (isOpen()) return;
      if (hero.__landingExclusionInlineApi && typeof hero.__landingExclusionInlineApi.isOpen === "function" && hero.__landingExclusionInlineApi.isOpen()) {
        hero.__landingExclusionInlineApi.close({ restoreFocus: false });
      }
      lastTrigger = triggerEl || document.activeElement || trigger;
      syncDomState(true);
      scheduleResponsiveLayoutSync();
      if (bubbleMotionApi && typeof bubbleMotionApi.pause === "function") {
        bubbleMotionApi.pause(true);
      }
      writeStudioHash();
      window.requestAnimationFrame(function () {
        scheduleResponsiveLayoutSync();
        window.setTimeout(scheduleResponsiveLayoutSync, 140);
        window.setTimeout(scheduleResponsiveLayoutSync, 380);
        focusNode(closeBtn);
      });
    }

    function closeStudio(options) {
      var opts = options || {};
      if (!isOpen()) return;
      syncDomState(false);
      clearResponsiveLayoutState();
      if (opts.skipHash !== true) {
        clearStudioHash();
      }
      if (bubbleMotionApi && typeof bubbleMotionApi.resume === "function") {
        bubbleMotionApi.resume();
      }
      if (opts.restoreFocus === false) return;
      var target = lastTrigger || trigger;
      lastTrigger = null;
      window.requestAnimationFrame(function () {
        focusNode(target);
      });
    }

    trigger.addEventListener("click", function (event) {
      event.preventDefault();
      if (isOpen()) {
        closeStudio();
        return;
      }
      openStudio(trigger);
    });

    closeBtn.addEventListener("click", function (event) {
      event.preventDefault();
      closeStudio();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      if (!isOpen()) return;
      if (root.classList.contains("project-inline-open")) return;
      if (root.classList.contains("map-project-open")) return;
      closeStudio();
    });

    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("popstate", syncFromHash);

    window.addEventListener("resize", scheduleResponsiveLayoutSync, { passive: true });

    if (stage && typeof ResizeObserver === "function") {
      studioResizeObserver = new ResizeObserver(function () {
        scheduleResponsiveLayoutSync();
      });
      studioResizeObserver.observe(stage);
    }

    if (surface) {
      Array.prototype.forEach.call(surface.querySelectorAll("img"), function (image) {
        if (image.complete) return;
        image.addEventListener("load", scheduleResponsiveLayoutSync);
        image.addEventListener("error", scheduleResponsiveLayoutSync);
      });
    }

    if (document.fonts && typeof document.fonts.ready === "object" && typeof document.fonts.ready.then === "function") {
      document.fonts.ready.then(function () {
        scheduleResponsiveLayoutSync();
      });
    }

    syncDomState(false);
    if (shouldStartOpen()) {
      openStudio(trigger);
    }
    var api = {
      isOpen: isOpen,
      open: openStudio,
      close: closeStudio
    };
    hero.__landingStudioInlineApi = api;
    return api;
  }

  function initLandingExclusionGame() {
    var hero = document.getElementById("homepage---left");
    var input = hero ? hero.querySelector("[data-exclusion-game-input]") : null;
    var message = hero ? hero.querySelector("[data-exclusion-game-message]") : null;
    var form = hero ? hero.querySelector("[data-exclusion-game-form]") : null;
    var recentMessages = [];
    var turn = 0;

    if (!input || !message) return null;

    var initialMessage = (message.textContent || "").trim() || "Please type your name to start.";
    var messagePools = {
      middleDot: {
        opens: ["Nope.", "Rejected.", "Again?", "Blocked."],
        cores: [
          "\"·\" is on your ID, not in this box.",
          "Middle dot detected. Rights removed.",
          "Legal dot, illegal input. Nice system.",
          "\"·\" broke real-name mode."
        ],
        tails: ["try the wrong name :)", "remove it, fail anyway.", "welcome to compliance.", "identity mismatch unlocked."]
      },
      cjkOnly: {
        opens: ["Oops.", "Sorry?", "Denied.", "Nah."],
        cores: [
          "汉字 spotted. Passport mode only.",
          "Chinese script detected. Latin cosplay required.",
          "Native script entered. Romanize yourself.",
          "This app sees Han and gets nervous."
        ],
        tails: ["ASCII only ^_^", "be more export-ready.", "translation first.", "local enough, still wrong."]
      },
      arabicScript: {
        opens: ["Mm no.", "Rejected.", "Try again.", "Blocked."],
        cores: [
          "Uyghur script? System says ???",
          "Right-to-left detected. Bureaucracy fell over.",
          "Arabic script entered. Form not educated enough.",
          "This script is real. The app isn't."
        ],
        tails: ["please face left-to-right.", "be machine-friendly.", "recognition unavailable.", "compatibility said no."]
      },
      mixedScripts: {
        opens: ["Pick one.", "Too much.", "Confused.", "Rejected."],
        cores: [
          "Two scripts in one name? Brave.",
          "Mixed scripts detected. Form wants one self.",
          "More than one writing system showed up.",
          "Your name is multilingual. The app is not."
        ],
        tails: ["collapse and retry.", "one identity at a time.", "nuance unsupported.", "boxes hate complexity."]
      },
      latinDiacritics: {
        opens: ["Cute.", "Nope.", "Flattened.", "Again?"],
        cores: [
          "Fancy Latin letters detected.",
          "Diacritics found. Accuracy not supported.",
          "Pronunciation showed up. Bad idea.",
          "Marked letters? Too alive for this field."
        ],
        tails: ["ASCII cosplay only.", "try being less correct.", "texture removed.", "plain Latin wins."]
      },
      twoPart: {
        opens: ["Hmm.", "Nope.", "Split failed.", "Rejected."],
        cores: [
          "Two-part name detected.",
          "Surname logic feels uneasy.",
          "This split looks wrong to the boxes.",
          "Family-name parser wants a more local story."
        ],
        tails: ["reorder yourself.", "be more familiar.", "genealogy mismatch.", "structure too foreign."]
      },
      singleToken: {
        opens: ["Where's the surname?", "One word?", "Denied.", "Hmm."],
        cores: [
          "Single-token name detected.",
          "No obvious surname break found.",
          "This form wants two obedient chunks.",
          "One-piece identity detected."
        ],
        tails: ["invent a divider.", "one word is too free.", "boxes need help.", "split yourself for the form."]
      },
      multiPart: {
        opens: ["Too many pieces.", "Overflow.", "No thanks.", "Rejected."],
        cores: [
          "Extra name zones detected.",
          "More than two chunks? Ambitious.",
          "This app budgeted for fewer selves.",
          "Multi-part name entered."
        ],
        tails: ["compress for compliance.", "two boxes only.", "excess personhood removed.", "fold and retry."]
      },
      hyphen: {
        opens: ["Linked? No.", "Rejected.", "Nope.", "Blocked."],
        cores: [
          "Hyphen detected. Continuity denied.",
          "Compound name entered.",
          "A connector appeared. Bad move.",
          "This name bridge scared the form."
        ],
        tails: ["unlink yourself.", "continuity unsupported.", "flatten it.", "too connected."]
      },
      apostrophe: {
        opens: ["Quote issue.", "Denied.", "Nope.", "Again?"],
        cores: [
          "Apostrophe detected.",
          "Name mark found. Clerk upset.",
          "Heritage punctuation entered.",
          "This pause in spelling is not welcome."
        ],
        tails: ["punctuation risk.", "try a duller name.", "history trimmed.", "straighter please."]
      },
      digits: {
        opens: ["Nice try.", "Numbers?", "Rejected.", "Nope."],
        cores: [
          "Digits in a name? The clerk blinked.",
          "Numeric aura detected.",
          "This looks like a tracking code now.",
          "Arithmetic entered the identity field."
        ],
        tails: ["remove the math.", "people > invoices.", "count less.", "serial number energy."]
      },
      emoji: {
        opens: ["Feelings denied.", "Emoji? no.", "Blocked.", "Cute, but no."],
        cores: [
          "Mood markers detected.",
          "This office has no emoji budget.",
          "Expression exceeded policy.",
          "Decorative glyphs entered the registry."
        ],
        tails: ["joy unsupported.", "file emotions elsewhere.", "official face only.", "too alive."]
      },
      otherPunctuation: {
        opens: ["Too spicy.", "Denied.", "Parser mad.", "Nope."],
        cores: [
          "Extra punctuation detected.",
          "This symbol made the backend itchy.",
          "Formatting marks entered the chat.",
          "Your name got too expressive."
        ],
        tails: ["be plainer.", "decor less.", "symbol rights revoked.", "compliance is tired."]
      },
      long: {
        opens: ["Too long.", "Overflow.", "Denied.", "Sigh."],
        cores: [
          "This name is wider than the app's imagination.",
          "Column width lost the fight.",
          "Old software ran out of patience.",
          "Long-name mode triggered."
        ],
        tails: ["shrink for entry.", "try being shorter.", "horizontal bias detected.", "compact yourself."]
      },
      short: {
        opens: ["Too short.", "Suspicious.", "Denied.", "Hmm."],
        cores: [
          "This name feels under-explained.",
          "Brevity triggered paperwork anxiety.",
          "Short input detected.",
          "The system wants more bureaucracy."
        ],
        tails: ["add more officialness.", "be less concise.", "minimalism denied.", "padding required."]
      },
      genericDomestic: {
        opens: ["Looks fine.", "Still no.", "Almost.", "Rejected."],
        cores: [
          "Nothing illegal showed up, yet here we are.",
          "Readable name detected. Confidence still absent.",
          "The form received a plausible human.",
          "This should work. It doesn't."
        ],
        tails: ["be more local.", "familiarity missing.", "compatibility said no.", "the boxes remain unconvinced."]
      }
    };

    function hasNonAscii(value) {
      for (var index = 0; index < value.length; index += 1) {
        if (value.charCodeAt(index) > 127) return true;
      }
      return false;
    }

    function hashString(value) {
      var hash = 2166136261;
      for (var index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    }

    function pushUnique(list, value) {
      if (!value) return;
      if (list.indexOf(value) !== -1) return;
      list.push(value);
    }

    function rememberMessage(value) {
      recentMessages.push(value);
      while (recentMessages.length > 12) {
        recentMessages.shift();
      }
    }

    function randomIndex(length) {
      if (!Number.isFinite(length) || length <= 1) return 0;
      if (window.crypto && typeof window.crypto.getRandomValues === "function") {
        var randomBuffer = new Uint32Array(1);
        window.crypto.getRandomValues(randomBuffer);
        return randomBuffer[0] % length;
      }
      return Math.floor(Math.random() * length);
    }

    function buildTraits(value) {
      var normalized = value.replace(/\s+/g, " ").trim();
      var tokens = normalized ? normalized.split(" ") : [];
      var hasLatin = /[A-Za-z]/.test(value);
      var hasCJK = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/.test(value);
      var hasArabicScript = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(value);
      var hasLatinDiacritics = /[À-ÖØ-öø-ÿĀ-žƏəİıŒœŞşĞğÇçÑñ]/.test(value);
      var hasEmoji = /[\u{1F300}-\u{1FAFF}]/u.test(value);
      var hasHyphen = /[-‐‑‒–—]/.test(value);
      var hasApostrophe = /['’]/.test(value);
      var hasMiddleDot = /[·•・]/.test(value);
      var hasOtherPunctuation = /[.,/#!$%^&*;:{}=_`~"\\()[\]?<>@+]/.test(value);
      var scriptCount = 0;
      if (hasLatin || hasLatinDiacritics) scriptCount += 1;
      if (hasCJK) scriptCount += 1;
      if (hasArabicScript) scriptCount += 1;
      return {
        normalized: normalized,
        tokenCount: tokens.length,
        hasLatin: hasLatin,
        hasCJK: hasCJK,
        hasArabicScript: hasArabicScript,
        hasLatinDiacritics: hasLatinDiacritics,
        hasMiddleDot: hasMiddleDot,
        hasSpaces: /\s/.test(value),
        hasDigits: /\d/.test(value),
        hasNonAscii: hasNonAscii(value),
        hasHyphen: hasHyphen,
        hasApostrophe: hasApostrophe,
        hasEmoji: hasEmoji,
        hasOtherPunctuation: hasOtherPunctuation,
        hasMixedScripts: scriptCount > 1,
        hasUnsupportedScript: hasNonAscii(value) && !hasCJK && !hasArabicScript && !(hasLatin || hasLatinDiacritics),
        isLong: normalized.length >= 12,
        isShort: value.length > 0 && value.length <= 3
      };
    }

    function buildStructuredCandidates(pool, seed, count) {
      var list = [];
      var offset;
      if (!pool) return list;
      for (offset = 0; offset < count; offset += 1) {
        var open = pool.opens[(seed + (offset * 3)) % pool.opens.length];
        var core = pool.cores[(seed + (offset * 5) + 1) % pool.cores.length];
        var tail = pool.tails[(seed + (offset * 7) + 2) % pool.tails.length];
        var composed = open + " " + core + " " + tail;
        if (composed.length > 84) continue;
        pushUnique(list, composed);
      }
      return list;
    }

    function addPoolCandidates(candidates, key, seed, count) {
      var next = buildStructuredCandidates(messagePools[key], seed, count);
      next.forEach(function (item) {
        pushUnique(candidates, item);
      });
    }

    function buildCandidates(value) {
      var seed = hashString(value + "|" + turn);
      var traits = buildTraits(value);
      var candidates = [];
      var priority = [];

      if (traits.hasMiddleDot) priority.push("middleDot");
      if (traits.hasMixedScripts) {
        priority.push("mixedScripts");
      } else {
        if (traits.hasArabicScript) priority.push("arabicScript");
        if (traits.hasCJK && !traits.hasLatin) priority.push("cjkOnly");
      }
      if (traits.hasUnsupportedScript) priority.push("arabicScript");
      if (traits.hasLatinDiacritics) priority.push("latinDiacritics");
      if (traits.hasHyphen) priority.push("hyphen");
      if (traits.hasApostrophe) priority.push("apostrophe");
      if (traits.hasDigits) priority.push("digits");
      if (traits.hasEmoji) priority.push("emoji");
      if (traits.hasOtherPunctuation && !traits.hasMiddleDot && !traits.hasHyphen && !traits.hasApostrophe) {
        priority.push("otherPunctuation");
      }
      if (traits.hasLatin && traits.tokenCount > 2) priority.push("multiPart");
      if (traits.hasLatin && traits.tokenCount === 2 && !traits.hasMixedScripts) priority.push("twoPart");
      if (traits.hasLatin && traits.tokenCount <= 1 && !traits.hasMixedScripts) priority.push("singleToken");
      if (traits.isLong) priority.push("long");
      if (traits.isShort) priority.push("short");
      if (!priority.length) priority.push("genericDomestic");

      priority.forEach(function (key, index) {
        addPoolCandidates(candidates, key, (seed + (index * 17)) >>> 0, 12);
      });

      if (priority.indexOf("genericDomestic") === -1) {
        addPoolCandidates(candidates, "genericDomestic", (seed + 211) >>> 0, 8);
      }

      if (!candidates.length) {
        pushUnique(candidates, "Real-name check failed: this form still prefers a smaller naming world.");
      }

      return {
        seed: seed,
        list: candidates
      };
    }

    function pickMessage(value) {
      var cleaned = value.trim();
      if (!cleaned) return initialMessage;

      turn += 1;
      var generated = buildCandidates(cleaned);
      var candidates = generated.list;
      var available = candidates.filter(function (candidate) {
        return recentMessages.indexOf(candidate) === -1;
      });
      var pool = available.length ? available : candidates;

      if (!pool.length) {
        return initialMessage;
      }

      var choice = pool[randomIndex(pool.length)];
      rememberMessage(choice);
      return choice;
    }

    function renderMessage(nextText) {
      message.textContent = nextText;
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        renderMessage(pickMessage(input.value));
      });
      input.addEventListener("input", function () {
        renderMessage(initialMessage);
      });
    } else {
      input.addEventListener("input", function () {
        renderMessage(pickMessage(input.value));
      });
      input.addEventListener("keydown", function (event) {
        if (event.key !== "Enter") return;
        event.preventDefault();
        renderMessage(pickMessage(input.value));
      });
      input.addEventListener("search", function () {
        renderMessage(pickMessage(input.value));
      });
    }

    return {
      reset: function () {
        input.value = "";
        message.textContent = initialMessage;
        recentMessages = [];
      }
    };
  }

  function initNamecardFlip() {
    var card = document.getElementById("namecard-flip");
    if (!card) return null;
    var interactive = card.getAttribute("data-namecard-interactive") !== "false";

    var backFace = card.querySelector(".namecard-back");
    var backScroll = card.querySelector(".namecard-back-scroll");
    var scrollTrack = card.querySelector(".namecard-scroll-track");
    var scrollPill = card.querySelector(".namecard-scroll-pill");

    var startX = 0;
    var startY = 0;
    var startScrollTop = 0;
    var moved = false;

    function toggleFlip() {
      var nextFlipped = !card.classList.contains("is-flipped");
      card.classList.toggle("is-flipped", nextFlipped);
      card.setAttribute("aria-pressed", String(nextFlipped));
      if (nextFlipped) updatePill();
    }

    function updatePill() {
      if (!backFace || !backScroll || !scrollTrack || !scrollPill) return;

      var maxScroll = backScroll.scrollHeight - backScroll.clientHeight;
      if (maxScroll <= 1) {
        backFace.classList.add("no-scroll");
        backFace.style.setProperty("--namecard-pill-y", "0px");
        return;
      }

      backFace.classList.remove("no-scroll");

      var ratio = backScroll.scrollTop / maxScroll;
      var trackHeight = scrollTrack.clientHeight;
      var pillHeight = scrollPill.clientHeight;
      var travel = Math.max(0, trackHeight - pillHeight);
      backFace.style.setProperty("--namecard-pill-y", (ratio * travel).toFixed(2) + "px");
    }

    card.__namecard3042UpdatePill = updatePill;

    if (!interactive) {
      card.classList.remove("is-flipped");
      card.setAttribute("aria-pressed", "false");
      card.removeAttribute("role");
      card.removeAttribute("tabindex");
      return {
        card: card,
        updatePill: function () {}
      };
    }

    card.addEventListener("pointerdown", function (event) {
      startX = event.clientX;
      startY = event.clientY;
      moved = false;
      startScrollTop = backScroll ? backScroll.scrollTop : 0;
    });

    card.addEventListener("pointermove", function (event) {
      if (Math.abs(event.clientX - startX) > 6 || Math.abs(event.clientY - startY) > 6) {
        moved = true;
      }
    });

    card.addEventListener("pointerup", function () {
      var scrolled = backScroll ? Math.abs(backScroll.scrollTop - startScrollTop) > 2 : false;
      if (moved || scrolled) return;
      toggleFlip();
    });

    if (backScroll) {
      backScroll.addEventListener("scroll", updatePill, { passive: true });
    }

    card.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleFlip();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && card.classList.contains("is-flipped")) {
        card.classList.remove("is-flipped");
        card.setAttribute("aria-pressed", "false");
      }
    });

    updatePill();
    window.addEventListener("resize", updatePill);
    return {
      card: card,
      updatePill: updatePill
    };
  }

  function initLandingModals() {
    var root = document.documentElement;
    var body = document.body;
    var activeModalKey = "";
    var activeTrigger = null;
    var lockedScrollY = 0;
    var modalByKey = {};

    function lockScroll() {
      if (root.classList.contains("landing-modal-open")) return;
      lockedScrollY = window.scrollY || window.pageYOffset || 0;
      root.classList.add("landing-modal-open");
      body.style.position = "fixed";
      body.style.left = "0";
      body.style.right = "0";
      body.style.top = -lockedScrollY + "px";
      body.style.width = "100%";
    }

    function unlockScroll() {
      if (!root.classList.contains("landing-modal-open")) return;
      root.classList.remove("landing-modal-open");
      body.style.position = "";
      body.style.left = "";
      body.style.right = "";
      body.style.top = "";
      body.style.width = "";
      window.scrollTo(0, lockedScrollY);
    }

    function focusInitialTarget(modalKey) {
      var modal = modalByKey[modalKey];
      if (!modal) return;
      var target = modal.querySelector("[data-modal-initial-focus]") ||
        modal.querySelector(".landing3042-modal-close") ||
        modal.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
      if (target && target.focus) {
        target.focus({ preventScroll: true });
      }
    }

    function closeModal(modalKey, options) {
      var opts = options || {};
      var key = modalKey || activeModalKey;
      if (!key) return;
      var modal = modalByKey[key];
      if (!modal) return;

      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      modal.hidden = true;

      if (activeModalKey !== key) return;
      activeModalKey = "";
      unlockScroll();

      if (opts.restoreFocus === false) return;
      if (activeTrigger && typeof activeTrigger.focus === "function") {
        activeTrigger.focus({ preventScroll: true });
      }
      activeTrigger = null;
    }

    function openModal(modalKey, triggerEl) {
      var modal = modalByKey[modalKey];
      if (!modal) return;
      if (activeModalKey && activeModalKey !== modalKey) {
        closeModal(activeModalKey, { restoreFocus: false });
      }

      activeModalKey = modalKey;
      activeTrigger = triggerEl || document.activeElement;
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      modal.classList.add("is-open");
      lockScroll();

      window.requestAnimationFrame(function () {
        focusInitialTarget(modalKey);
      });
    }

    ["studio"].forEach(function (key) {
      var modal = modalByKey[key];
      if (!modal) return;

      modal.addEventListener("click", function (event) {
        if (event.target === modal) {
          closeModal(key);
        }
      });

      Array.prototype.forEach.call(
        modal.querySelectorAll("[data-modal-close]"),
        function (button) {
          button.addEventListener("click", function () {
            closeModal(key);
          });
        }
      );
    });

    Array.prototype.forEach.call(
      document.querySelectorAll("[data-trigger='studio']"),
      function (trigger) {
        trigger.addEventListener("click", function (event) {
          var key = trigger.getAttribute("data-trigger");
          if (!modalByKey[key]) return;
          event.preventDefault();
          openModal(key, trigger);
        });
      }
    );

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !activeModalKey) return;
      if (root.classList.contains("project-inline-open")) return;
      if (root.classList.contains("map-project-open")) return;
      closeModal(activeModalKey);
    });

    return {
      closeActive: function () {
        closeModal(activeModalKey);
      }
    };
  }

  function initProjectInlineProjectView() {
    var targets = Array.prototype.slice.call(
      document.querySelectorAll(
        "[data-studio-project-link][href*='overlay-'], [data-studio-project-more][href*='overlay-']"
      )
    );

    var shell = document.getElementById("project-inline-shell");
    var closeBtn = document.getElementById("project-inline-close");
    var pages = Array.prototype.slice.call(
      document.querySelectorAll(".project-inline-page[data-project-page]")
    );
    var preview = document.getElementById("project-hover-preview");
    var previewImg = document.getElementById("project-hover-preview-img");
    var previewByFile = {
      "overlay-minimovesmatter.html":
        "https://freight.cargo.site/w/400/q/75/i/P2109056708379344572925327284168/minimove.svg",
      "overlay-sustainableWaves.html":
        "./assets/p21.png",
      "overlay-shanghaisummerschool.html":
        "./assets/Frame-90.png"
    };
    var projectByFile = {
      "overlay-minimovesmatter.html": "minimoves",
      "overlay-sustainableWaves.html": "sustainable",
      "overlay-shanghaisummerschool.html": "summerschool"
    };
    if (!shell || !closeBtn || !pages.length) return;

    var pageByProject = {};
    pages.forEach(function (page) {
      var id = page.getAttribute("data-project-page");
      if (!id) return;
      pageByProject[id] = page;
    });

    var projectState = {
      activeProject: null,
      scrollY: 0
    };
    var sustainablePage = pageByProject.sustainable || null;
    var sustainableScrollWindow = sustainablePage
      ? sustainablePage.querySelector(".project-sustainable-scroll-window")
      : null;
    var sustainableLongImage = sustainablePage
      ? sustainablePage.querySelector(".project-sustainable-scroll-figure img")
      : null;

    function clearSustainableInlineLayout() {
      if (!sustainableScrollWindow) return;
      sustainableScrollWindow.scrollTop = 0;
    }

    function syncSustainableLayout(options) {
      if (!sustainablePage || !sustainableScrollWindow) return;
      if (projectState.activeProject !== "sustainable") return;

      if (options && options.resetScrollTop) {
        sustainableScrollWindow.scrollTop = 0;
      }
    }

    if (sustainableLongImage && !sustainableLongImage.complete) {
      sustainableLongImage.addEventListener("load", function () {
        syncSustainableLayout({ resetScrollTop: false });
      });
    }

    function getOverlayFile(href) {
      if (!href) return "";
      try {
        var parsed = new URL(href, window.location.href);
        var path = parsed.pathname || "";
        return path.split("/").pop() || "";
      } catch (error) {
        var clean = String(href).split("?")[0].split("#")[0];
        return clean.split("/").pop() || "";
      }
    }

    function getProjectFromFile(file) {
      return projectByFile[file] || "";
    }

    function isValidProject(projectId) {
      return !!pageByProject[projectId];
    }

    function parseProjectFromHash() {
      var hash = window.location.hash || "";
      if (!hash) return null;
      var clean = hash.charAt(0) === "#" ? hash.slice(1) : hash;
      if (!clean) return null;
      var params = new URLSearchParams(clean);
      var project = params.get("project");
      if (!isValidProject(project)) return null;
      return project;
    }

    function buildProjectHash(projectId) {
      return "#project=" + encodeURIComponent(projectId);
    }

    function syncVisiblePage(projectId) {
      var headerAlignWidthByProject = {
        minimoves: "1214.813px",
        sustainable: "1214.813px",
        summerschool: "1214px"
      };
      pages.forEach(function (page) {
        var isActive = page.getAttribute("data-project-page") === projectId;
        page.hidden = !isActive;
      });
      if (projectId && headerAlignWidthByProject[projectId]) {
        shell.style.setProperty("--project-inline-header-align-w-3042", headerAlignWidthByProject[projectId]);
      } else {
        shell.style.removeProperty("--project-inline-header-align-w-3042");
      }
    }

    function setShellOpen(open) {
      if (open) {
        shell.hidden = false;
        shell.setAttribute("aria-hidden", "false");
      } else {
        shell.setAttribute("aria-hidden", "true");
        shell.hidden = true;
      }
    }

    function hidePreview() {
      if (!preview) return;
      preview.classList.remove("is-visible");
      preview.style.transform = "translate3d(-9999px, -9999px, 0)";
    }

    function placePreview(clientX, clientY) {
      if (!preview) return;
      var offset = 18;
      var x = clientX + offset;
      var y = clientY + offset;
      var rect = preview.getBoundingClientRect();
      var maxX = window.innerWidth - rect.width - 12;
      var maxY = window.innerHeight - rect.height - 12;
      if (x > maxX) x = clientX - rect.width - offset;
      if (y > maxY) y = maxY;
      if (x < 12) x = 12;
      if (y < 12) y = 12;
      preview.style.transform = "translate3d(" + Math.round(x) + "px, " + Math.round(y) + "px, 0)";
    }

    function openProject(projectId) {
      if (!isValidProject(projectId)) return;
      hidePreview();
      if (!projectState.activeProject) {
        projectState.scrollY = window.scrollY || window.pageYOffset || 0;
      }
      projectState.activeProject = projectId;
      setShellOpen(true);
      syncVisiblePage(projectId);
      shell.scrollTop = 0;
      document.documentElement.classList.add("project-inline-open");
      if (projectId === "sustainable") {
        if (sustainableScrollWindow) {
          sustainableScrollWindow.scrollTop = 0;
        }
        window.requestAnimationFrame(function () {
          syncSustainableLayout({ resetScrollTop: true });
          window.requestAnimationFrame(function () {
            syncSustainableLayout({ resetScrollTop: true });
          });
        });
      }
    }

    function closeProject() {
      if (!projectState.activeProject) return;
      projectState.activeProject = null;
      document.documentElement.classList.remove("project-inline-open");
      syncVisiblePage(null);
      setShellOpen(false);
      clearSustainableInlineLayout();
      var restoreY = projectState.scrollY;
      projectState.scrollY = 0;
      window.requestAnimationFrame(function () {
        window.scrollTo(0, restoreY);
      });
    }

    function renderByHash() {
      var projectId = parseProjectFromHash();
      if (projectId) {
        openProject(projectId);
      } else {
        closeProject();
      }
    }

    function clearProjectHash() {
      var cleanUrl = window.location.pathname + window.location.search;
      window.history.replaceState(null, "", cleanUrl);
    }

    function writeStudioHash() {
      if ((window.location.hash || "").toLowerCase() === "#studio") return;
      window.location.hash = "studio";
    }

    function closeFromUi() {
      if (!projectState.activeProject) return;
      if (parseProjectFromHash()) {
        writeStudioHash();
        return;
      }
      clearProjectHash();
      renderByHash();
    }

    closeBtn.addEventListener("click", closeFromUi);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && projectState.activeProject) {
        closeFromUi();
      }
    });
    window.addEventListener("hashchange", renderByHash);
    window.addEventListener("popstate", renderByHash);
    window.addEventListener("resize", function () {
      syncSustainableLayout({ resetScrollTop: false });
    });

    var canHoverPreview =
      !!preview &&
      !!previewImg &&
      window.matchMedia &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    targets.forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (event.defaultPrevented) return;
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        var file = getOverlayFile(link.getAttribute("href"));
        var projectId = getProjectFromFile(file);
        if (!projectId) return;
        event.preventDefault();
        hidePreview();
        var nextHash = buildProjectHash(projectId);
        if (window.location.hash === nextHash) {
          openProject(projectId);
        } else {
          window.location.hash = nextHash;
        }
      });

      if (!canHoverPreview) return;

      link.addEventListener("pointerenter", function (event) {
        if (document.documentElement.classList.contains("project-inline-open")) return;
        if (document.documentElement.classList.contains("landing-modal-open")) return;
        var file = getOverlayFile(link.getAttribute("href"));
        var previewSrc = previewByFile[file];
        if (!previewSrc) return;
        previewImg.src = previewSrc;
        preview.classList.add("is-visible");
        placePreview(event.clientX, event.clientY);
      });

      link.addEventListener("pointermove", function (event) {
        if (!preview.classList.contains("is-visible")) return;
        placePreview(event.clientX, event.clientY);
      });

      link.addEventListener("pointerleave", hidePreview);
      link.addEventListener("blur", hidePreview);
    });

    renderByHash();
  }

  function initMapCenterHoverPreview() {
    var VERITAS_NODE_ID = "3139:21709";
    var MAKKAPAKKA_NODE_ID = "3150:21733";
    var OPENTRACE_NODE_ID = "3150:21735";
    var ENABLED_MAP_PROJECT_DETAIL_NODE_IDS = {};
    var preview = document.getElementById("map-center-hover-preview");
    var previewFrame = preview ? preview.querySelector(".map-center-hover-preview-frame") : null;
    var previewOpenTracesHost = document.getElementById("map-center-hover-preview-open-traces-host");
    var previewSlideshow = document.getElementById("map-center-hover-preview-slideshow");
    var previewSlideshowVideo = document.getElementById("map-center-hover-preview-slideshow-video");
    var previewSlideshowImgA = document.getElementById("map-center-hover-preview-slideshow-img-a");
    var previewSlideshowImgB = document.getElementById("map-center-hover-preview-slideshow-img-b");
    var previewSlideshowImgLegacy = document.getElementById("map-center-hover-preview-slideshow-img");
    var previewSlideshowPagination = document.getElementById("map-center-hover-preview-pagination");
    var previewSlideshowPaginationTrack = document.getElementById("map-center-hover-preview-pagination-track");
    var previewPlaceholder = document.getElementById("map-center-hover-preview-placeholder");
    var caption = document.getElementById("map-hover-caption");
    var captionTitle = document.getElementById("map-hover-caption-title");
    var captionDesc = document.getElementById("map-hover-caption-desc");
    var captionAward = document.getElementById("map-hover-caption-award");
    var captionAwardLogo = document.getElementById("map-hover-caption-award-logo");
    var captionAwardText = document.getElementById("map-hover-caption-award-text");
    var mapProjectShell = document.getElementById("map-project-inline-shell");
    var mapProjectScroll = document.getElementById("map-project-inline-scroll");
    var mapProjectContent = mapProjectShell
      ? mapProjectShell.querySelector(".map-project-inline-content")
      : null;
    var mapProjectCloseBtn = document.getElementById("map-project-inline-close");
    var mapProjectNav = document.getElementById("map-project-inline-nav");
    var mapProjectPrevBtn = document.getElementById("map-project-inline-prev");
    var mapProjectNextBtn = document.getElementById("map-project-inline-next");
    var mapProjectPrevLabel = document.getElementById("map-project-inline-prev-label");
    var mapProjectNextLabel = document.getElementById("map-project-inline-next-label");
    var mapProjectDetailTopbar = mapProjectShell ? mapProjectShell.querySelector(".map-project-detail-topbar") : null;
    var mapProjectDetailHeader = mapProjectShell ? mapProjectShell.querySelector(".map-project-detail-header") : null;
    var mapProjectVeritasRoot = document.getElementById("map-project-detail-veritas-root");
    var mapProjectDetailStage = mapProjectShell ? mapProjectShell.querySelector(".map-project-detail-stage") : null;
    var mapProjectDetailTitleGroup = mapProjectShell ? mapProjectShell.querySelector(".map-project-detail-title-group") : null;
    var mapProjectDetailTitle = document.getElementById("map-project-detail-title");
    var mapProjectDetailTitleBadgeLink = document.getElementById("map-project-detail-title-badge-link");
    var mapProjectDetailTitleBadge = document.getElementById("map-project-detail-title-badge");
    var mapProjectDetailTag1 = document.getElementById("map-project-detail-tag-1");
    var mapProjectDetailTag2 = document.getElementById("map-project-detail-tag-2");
    var mapProjectDetailTag3 = document.getElementById("map-project-detail-tag-3");
    var mapProjectDetailLead = document.getElementById("map-project-detail-lead");
    var mapProjectDetailCredit = document.getElementById("map-project-detail-credit");
    var mapProjectDetailInstitute = document.getElementById("map-project-detail-institute");
    var mapProjectDetailVisualLeft = document.getElementById("map-project-detail-visual-left");
    var mapProjectDetailVisualRightLink = document.getElementById("map-project-detail-visual-right-link");
    var mapProjectDetailVisualRight = document.getElementById("map-project-detail-visual-right");
    var mapProjectDetailCaptionLeft = document.getElementById("map-project-detail-caption-left");
    var mapProjectDetailCaptionRight = document.getElementById("map-project-detail-caption-right");
    var mapProjectDetailSectionA = document.getElementById("map-project-detail-section-a");
    var mapProjectDetailHeadingA = document.getElementById("map-project-detail-heading-a");
    var mapProjectDetailHeadingABody = document.getElementById("map-project-detail-heading-a-body");
    var mapProjectDetailSectionB = document.getElementById("map-project-detail-section-b");
    var mapProjectDetailHeadingB = document.getElementById("map-project-detail-heading-b");
    var mapProjectDetailHeadingBBody = document.getElementById("map-project-detail-heading-b-body");
    var mapProjectDetailSectionC = document.getElementById("map-project-detail-section-c");
    var mapProjectTemplateRoot = document.getElementById("map-project-template-root");
    var mapProjectOpenTraceRoot = document.getElementById("map-project-opentrace-root");
    var practiceTitle = document.getElementById("practice-title");
    var practiceTitleText = document.getElementById("practice-title-text");
    var sourceOpenTracesTemplate = document.getElementById("open-traces-template");
    var sourceOpenTraces = document.querySelector(".practice3042-open-traces");
    var practiceSection = document.getElementById("homepage---right");
    var mapWrap = document.querySelector(".practice3042-grid-wrap");
    var mapViewport = mapWrap ? mapWrap.querySelector(".mypractice-map-viewport") : null;
    var mapScene = mapWrap ? mapWrap.querySelector(".mypractice-map-scene") : null;
    var mapOverlay = mapWrap ? mapWrap.querySelector(".mypractice-map-overlay") : null;
    var topTagsWrap = mapWrap ? mapWrap.querySelector(".mypractice-map-top-tags") : null;
    var topTagSocial = topTagsWrap ? topTagsWrap.querySelector(".mypractice-map-top-tag-asset--social") : null;
    var topTagInteraction = topTagsWrap ? topTagsWrap.querySelector(".mypractice-map-top-tag-asset--interaction") : null;
    var topTagPssd = topTagsWrap ? topTagsWrap.querySelector(".mypractice-map-top-tag-asset--pssd") : null;
    var items = Array.prototype.slice.call(document.querySelectorAll(".mypractice-map-overlay-item"));

    function isMapProjectDetailEnabled(nodeId) {
      return !!(nodeId && ENABLED_MAP_PROJECT_DETAIL_NODE_IDS[nodeId]);
    }
    var previewConfigByNodeId = {
      "3150:21735": {
        mode: "open-traces"
      },
      "3139:17651": {
        mode: "slideshow",
        slides: [
          "./assets/woodpacker/W1.png",
          "./assets/woodpacker/W2.png",
          "./assets/woodpacker/W4.png",
          "./assets/woodpacker/W6.png",
          "./assets/woodpacker/W7.png",
          "./assets/woodpacker/W8.png"
        ]
      },
      "3139:21709": {
        mode: "slideshow",
        slides: [
          "./assets/Veritas/V1.jpeg",
          "./assets/Veritas/V2.jpeg",
          "./assets/Veritas/V3.jpeg",
          "./assets/Veritas/V4.png",
          "./assets/Veritas/V5.png",
          "./assets/Veritas/V6.png"
        ]
      },
      "3139:21713": {
        mode: "slideshow",
        slides: [
          "./assets/MCI/M1.png",
          "./assets/MCI/M2.png",
          "./assets/MCI/M3.png",
          "./assets/MCI/M4.png",
          "./assets/MCI/M5.png"
        ]
      },
      "3139:21712": {
        mode: "slideshow",
        slides: [
          "./assets/SliceWardrobe/S1.png",
          "./assets/SliceWardrobe/S2.png",
          "./assets/SliceWardrobe/S3.png",
          "./assets/SliceWardrobe/S4.png",
          "./assets/SliceWardrobe/S5.png"
        ],
        // Keep SliceWardrobe hover preview height stable across mixed aspect-ratio slides.
        fixedPreviewRatio: 0.79
      },
      "3139:21711": {
        mode: "slideshow",
        slides: [
          "./assets/BD/B1.png",
          "./assets/BD/B2.png",
          "./assets/BD/B3.png",
          "./assets/BD/B4.png"
        ]
      },
      "3139:21710": {
        mode: "slideshow",
        slides: [
          "./assets/LoomDrift/L1.png",
          "./assets/LoomDrift/L2.png",
          "./assets/LoomDrift/L3.png",
          "./assets/LoomDrift/L4.png"
        ]
      },
      "3150:21733": {
        mode: "slideshow",
        slides: [
          "./assets/Makapaka/M1.png",
          "./assets/Makapaka/M2.png",
          "./assets/Makapaka/M3.png",
          "./assets/Makapaka/M4.png",
          "./assets/Makapaka/M5.png",
          "./assets/Makapaka/M6.png",
          "./assets/Makapaka/M7.png"
        ]
      },
      "3150:21734": {
        mode: "slideshow",
        slides: [
          "./assets/Hedong/H0_0.png",
          "./assets/Hedong/H1.png",
          "./assets/Hedong/H2.png",
          "./assets/Hedong/H0_1.png",
          "./assets/Hedong/H0_2.png",
          "./assets/Hedong/H0_3.png",
          "./assets/Hedong/H0_4.png"
        ],
        // Keep Eco-Mailbox hover preview height stable across mixed aspect-ratio slides.
        fixedPreviewRatio: 0.635,
        loopMode: "forward",
        deferPreload: true
      },
      "3139:21718": {
        mode: "slideshow",
        slides: [
          "./assets/EasyFlow/E1.png",
          "./assets/EasyFlow/E2.png",
          "./assets/EasyFlow/E3.png",
          "./assets/EasyFlow/E4.png"
        ]
      },
      "3139:21719": {
        mode: "slideshow",
        slides: [
          { type: "video", src: "https://assets.oghuzhan.work/f1.mp4" },
          { type: "image", src: "./assets/Flexit/F2.png" },
          { type: "image", src: "./assets/Flexit/F3.png" }
        ]
      },
      "3150:21732": {
        mode: "slideshow",
        slides: [
          "./assets/CIY/C1.png",
          "./assets/CIY/C2.png",
          "./assets/CIY/C3.png",
          "./assets/CIY/C4.png",
          "./assets/CIY/C5.png"
        ]
      }
    };
    var captionByNodeId = {
      "3150:21733": {
        title: "MakkaPakka",
        desc: "An inclusive hide-and-seek game designed in response to playground exclusion in integrated education settings."
      },
      "3150:21734": {
        title: "Eco-Mailbox",
        desc: "A participatory community project grounded in ethnographic research and neighbourhood-led regeneration."
      },
      "3139:17651": {
        title: "Woodpecker Project",
        desc: "A community co-design renovation project that transforms residents' stories and needs into small public-space interventions."
      },
      "3139:21712": {
        title: "Slice Wardrobe",
        desc: "An interactive wardrobe system that encourages more intentional clothing use through exhibition and service design."
      },
      "3139:21711": {
        title: "Bottle U 4th",
        desc: "A social innovation festival project combining event design, exhibition strategy, and digital touchpoints for public participation."
      },
      "3139:21710": {
        title: "Loom Drift",
        desc: "A social app that reconnects people through chance encounters and the places where their paths briefly cross."
      },
      "3139:21719": {
        title: "Flexit",
        desc: "A wearable sensing system that gently supports healthier sitting habits through soft, accumulative feedback."
      },
      "3139:21718": {
        title: "EasyFlow",
        desc: "A lightweight floor-cleaning product that reduces physical strain and learning burden for early senior users."
      },
      "3150:21732": {
        title: "CIY – Cool It Yourself",
        desc: "A low-cost DIY cooling garment designed as a wearable intervention for outdoor workers in Southeast Asia."
      },
      "3139:21713": {
        title: "PaperMind",
        desc: "A motion-based cognitive game system that combines mental and physical training to support memory in older adults with MCI."
      },
      "3139:21709": {
        title: "Veritas",
        desc: "A visual investigation workspace that supports exploratory, non-linear sensemaking by positioning AI as an analytical partner rather than an authority."
      },
      "3150:21735": {
        title: "OpenTraces",
        desc: "A speculative collective archive that enables migrants to leave digital traces and build shared memory across movement and displacement.",
        award: 'Winner of Next Gen Design 2026 "Futures Worth Living"',
        awardLogoSrc: "./assets/OpenTrace/next-gen-design-award-logo.png"
      }
    };
    var MAP_PROJECT_ENABLED_NODE_IDS = [
      VERITAS_NODE_ID,
      MAKKAPAKKA_NODE_ID,
      "3150:21734",
      "3139:17651",
      "3139:21712",
      "3139:21711",
      "3139:21710",
      "3139:21713",
      OPENTRACE_NODE_ID
    ];
    MAP_PROJECT_ENABLED_NODE_IDS.forEach(function (nodeId) {
      ENABLED_MAP_PROJECT_DETAIL_NODE_IDS[nodeId] = true;
    });

    var MAP_PROJECT_LAYOUT_VERITAS = "veritas";
    var MAP_PROJECT_LAYOUT_TEMPLATE_MAKAPAKKA = "template_makapakka";
    var MAP_PROJECT_LAYOUT_OPENTRACE = "opentrace";
    var MAP_PROJECT_TEMPLATE_SECONDARY_STATEMENT =
      "I'm still developing this page, but you can check out the projects through my old portfolio pics ⇊";
    var MAP_PROJECT_TEMPLATE_DEFAULT_TAGS = [
      "#Inclusive game",
      "#Disability interaction (DIX)"
    ];
    var MAP_PROJECT_TEMPLATE_DEFAULT_CREDIT_HTML = "Designed by Oğuzhan";
    var MAP_PROJECT_TEMPLATE_DEFAULT_INSTITUTE_HTML =
      'Accepted by <a href="https://link.springer.com/chapter/10.1007/978-3-031-93851-1_19" target="_blank" rel="noopener noreferrer">HCII 2025</a>';
    var MAP_PROJECT_TEMPLATE_R2_GALLERY_BASE = "https://assets.oghuzhan.work";
    var MAP_PROJECT_OPENTRACE_DEFAULT_HERO_KICKER =
      "Enabling immigrants to build a shared sound-layer of experiences, placed on top of our physical world";
    var MAP_PROJECT_OPENTRACE_DEFAULT_SEQUENCE_HEADING =
      "Why focus on the experience of immigration?";
    var MAP_PROJECT_OPENTRACE_DEFAULT_SEQUENCE_STATEMENT_HTML =
      'Immigrants encounter both <span class="map-project-opentrace-highlight map-project-detail-hotspot" tabindex="0" data-detail-preview-src="./assets/OpenTrace/Slide 16_9 - 82.png" data-detail-preview-alt="OpenTraces emotional challenges placeholder image" data-detail-preview-max-width="45rem" data-detail-preview-max-height="72vh" data-detail-preview-offset-x="12" data-detail-preview-offset-y="12">emotional</span> and <span class="map-project-opentrace-highlight map-project-detail-hotspot" tabindex="0" data-detail-preview-src="./assets/OpenTrace/Slide 16_9 - 83.png" data-detail-preview-alt="OpenTraces practical challenges placeholder image" data-detail-preview-max-width="45rem" data-detail-preview-max-height="72vh" data-detail-preview-offset-x="12" data-detail-preview-offset-y="12">practical</span> obstacles when moving to a new country.';
    var MAP_PROJECT_OPENTRACE_SEQUENCE_DEFAULT_FRAME_ALT = "OpenTraces sequence frame";
    var MAP_PROJECT_OPENTRACE_SEQUENCE_WHEEL_STEP_THRESHOLD = 88;
    var MAP_PROJECT_OPENTRACE_SEQUENCE_WHEEL_MAX_STEPS_PER_EVENT = 3;
    var MAP_PROJECT_OPENTRACE_SEQUENCE_WHEEL_LINE_PX = 16;
    var MAP_PROJECT_OPENTRACE_SEQUENCE_TRIGGER_TOP_OFFSET = 78;
    var MAP_PROJECT_OPENTRACE_SEQUENCE_TRIGGER_TOP_TOLERANCE = 24;

    function buildTemplateGalleryCards(projectTitle, imageIndexes) {
      var cards = [];
      var safeIndexes = Array.isArray(imageIndexes) ? imageIndexes : [];
      for (var i = 0; i < safeIndexes.length; i += 1) {
        var imageIndex = parseInt(safeIndexes[i], 10);
        if (!(imageIndex > 0)) continue;
        cards.push({
          src: MAP_PROJECT_TEMPLATE_R2_GALLERY_BASE + "/" + String(imageIndex) + ".png",
          alt: (projectTitle || "Project") + " old portfolio image " + String(i + 1)
        });
      }
      return cards;
    }

    function buildTemplateGalleryRange(start, end) {
      var list = [];
      var safeStart = parseInt(start, 10);
      var safeEnd = parseInt(end, 10);
      if (!(safeStart > 0) || !(safeEnd >= safeStart)) return list;
      for (var i = safeStart; i <= safeEnd; i += 1) {
        list.push(i);
      }
      return list;
    }

    function createTemplateMapProjectPageData(config) {
      var safe = config || {};
      var title = String(safe.pageTitle || safe.title || "");
      var galleryCards = Array.isArray(safe.galleryCards) ? safe.galleryCards.slice(0) : [];
      var hasCustomCreditHtml = Object.prototype.hasOwnProperty.call(safe, "creditHtml");
      var hasCustomInstituteHtml = Object.prototype.hasOwnProperty.call(safe, "instituteHtml");
      var hasCustomSecondaryStatement = Object.prototype.hasOwnProperty.call(safe, "secondaryStatement");
      var tags = Array.isArray(safe.tags) && safe.tags.length
        ? safe.tags.slice(0, 3).map(function (tag) {
            return String(tag || "");
          }).filter(function (tag) {
            return !!tag;
          })
        : MAP_PROJECT_TEMPLATE_DEFAULT_TAGS.slice(0);
      return {
        layoutType: MAP_PROJECT_LAYOUT_TEMPLATE_MAKAPAKKA,
        pageTitle: title,
        tags: tags,
        lead: String(safe.lead || ""),
        secondaryStatement: hasCustomSecondaryStatement
          ? String(safe.secondaryStatement || "")
          : MAP_PROJECT_TEMPLATE_SECONDARY_STATEMENT,
        creditHtml: hasCustomCreditHtml ? String(safe.creditHtml || "") : MAP_PROJECT_TEMPLATE_DEFAULT_CREDIT_HTML,
        instituteHtml: hasCustomInstituteHtml ? String(safe.instituteHtml || "") : MAP_PROJECT_TEMPLATE_DEFAULT_INSTITUTE_HTML,
        institute: "",
        sectionATitle: "",
        sectionABodyHtml: "",
        sectionBTitleHtml: "",
        sectionBBlocks: [],
        visualLeftSrc: "",
        visualLeftType: "image",
        visualLeftAlt: "",
        visualRightSrc: "",
        visualRightType: "image",
        visualRightAlt: "",
        visualRightHref: "",
        visualRightLinkTitle: "",
        visualRightLinkIcon: "",
        captionLeft: "",
        captionRight: "",
        headingA: "",
        headingB: "",
        galleryCards: galleryCards,
        featureVideoSrc: safe.featureVideoSrc ? String(safe.featureVideoSrc) : "",
        featureVideoPosterSrc: safe.featureVideoPosterSrc ? String(safe.featureVideoPosterSrc) : "",
        featureVideoAlt: safe.featureVideoAlt ? String(safe.featureVideoAlt) : ""
      };
    }

    function normalizeOpenTraceSequenceFrames(frameSources) {
      var safeList = Array.isArray(frameSources) ? frameSources : [];
      var dedup = [];
      var seen = {};
      safeList.forEach(function (src) {
        var frameSrc = String(src || "").trim();
        if (!frameSrc || seen[frameSrc]) return;
        seen[frameSrc] = true;
        dedup.push(frameSrc);
      });
      return dedup;
    }

    function createOpenTraceMapProjectPageData(config) {
      var safe = config || {};
      var tags = Array.isArray(safe.tags) && safe.tags.length
        ? safe.tags.slice(0, 3).map(function (tag) {
            return String(tag || "");
          }).filter(function (tag) {
            return !!tag;
          })
        : [];
      var sequenceFrames = normalizeOpenTraceSequenceFrames(safe.sequenceFrames);
      return {
        layoutType: MAP_PROJECT_LAYOUT_OPENTRACE,
        pageTitle: String(safe.pageTitle || safe.title || "OpenTraces"),
        tags: tags,
        titleBadgeHref: safe.titleBadgeHref ? String(safe.titleBadgeHref) : "",
        titleBadgeSrc: safe.titleBadgeSrc ? String(safe.titleBadgeSrc) : "",
        titleBadgeAlt: safe.titleBadgeAlt ? String(safe.titleBadgeAlt) : "",
        creditHtml: String(safe.creditHtml || ""),
        creditSecondaryHtml: safe.creditSecondaryHtml ? String(safe.creditSecondaryHtml) : "",
        lead: String(safe.lead || ""),
        heroKicker: safe.heroKicker
          ? String(safe.heroKicker)
          : MAP_PROJECT_OPENTRACE_DEFAULT_HERO_KICKER,
        heroCredit: String(safe.heroCredit || ""),
        heroYear: String(safe.heroYear || ""),
        sequenceHeading: safe.sequenceHeading
          ? String(safe.sequenceHeading)
          : MAP_PROJECT_OPENTRACE_DEFAULT_SEQUENCE_HEADING,
        sequenceStatementHtml: safe.sequenceStatementHtml
          ? String(safe.sequenceStatementHtml)
          : MAP_PROJECT_OPENTRACE_DEFAULT_SEQUENCE_STATEMENT_HTML,
        sequenceFrames: sequenceFrames,
        sequenceFrameAlt: safe.sequenceFrameAlt
          ? String(safe.sequenceFrameAlt)
          : MAP_PROJECT_OPENTRACE_SEQUENCE_DEFAULT_FRAME_ALT,
        closingText: String(safe.closingText || ""),
        closingTextHtml: safe.closingTextHtml ? String(safe.closingTextHtml) : "",
        closingBodyText: String(safe.closingBodyText || ""),
        featureVideoSrc: safe.featureVideoSrc ? String(safe.featureVideoSrc) : "",
        featureVideoPosterSrc: safe.featureVideoPosterSrc ? String(safe.featureVideoPosterSrc) : "",
        featureVideoAlt: safe.featureVideoAlt ? String(safe.featureVideoAlt) : "OpenTraces concept video"
      };
    }

    var veritasSectionABodyHtml = [
      '<p>Nowadays, people get used to AI tools like ChatGPT. And it looks like <span class="map-project-detail-hotspot" tabindex="0" data-detail-preview-src="./assets/Veritas/1st-this.png" data-detail-preview-alt="Conversational AI interface example" data-detail-preview-max-width="45rem" data-detail-preview-max-height="85vh" data-detail-preview-offset-x="10" data-detail-preview-offset-y="10">this,</span> where interaction happens through conversation and prompting. But what about computer vision?</p>' +
      '<p><span class="map-project-detail-hotspot" tabindex="0" data-detail-preview-src="./assets/Veritas/2-this.png" data-detail-preview-alt="Photo gallery search example" data-detail-preview-offset-x="12" data-detail-preview-offset-y="10" data-detail-preview-content-top-ratio="0.0677">This</span> is our phone&#39;s photo gallery. We type a keyword a keyword into the search bar, and we get a result. It is still a <span class="map-project-detail-hotspot" tabindex="0" data-detail-preview-src="./assets/Veritas/Prompt-based.png" data-detail-preview-alt="Prompt-based interaction example" data-detail-preview-offset-x="12" data-detail-preview-offset-y="10" data-detail-preview-content-left-ratio="0.0435" data-detail-preview-content-right-ratio="0.0411" data-detail-preview-content-top-ratio="0.3069" data-detail-preview-content-bottom-ratio="0.3466">prompt-based</span> interaction of computer vision technology.</p>' +
      '<p>And that is the problem. Prompting by itself is too weak. The system remains a kind of <span class="map-project-detail-hotspot" tabindex="0" data-detail-preview-src="./assets/Veritas/magicbox.png" data-detail-preview-alt="Magic box metaphor illustration" data-detail-preview-max-width="52rem" data-detail-preview-max-height="58rem" data-detail-preview-offset-x="18" data-detail-preview-offset-y="18" data-detail-preview-content-left-ratio="0.0875" data-detail-preview-content-right-ratio="0.1062" data-detail-preview-content-top-ratio="0.2751" data-detail-preview-content-bottom-ratio="0.1249">magic box,</span> and investigators are left guessing what the computer vision model is actually seeing, associating, or paying attention to.</p>'
    ].join("");
    var veritasSectionBTitleHtml =
      'So <span class="map-project-detail-hotspot map-project-detail-hotspot--heading" tabindex="0" data-detail-preview-src="./assets/Veritas/This3.png" data-detail-preview-alt="Veritas proposal overview" data-detail-preview-max-width="20rem" data-detail-preview-max-height="20rem" data-detail-preview-offset-x="12" data-detail-preview-offset-y="10">this</span> is what we come up with!';
    var veritasSectionBBlocks = [
      {
        question: "1.How do we negotiate the relationship between investigators and AI/computer vision?",
        videoQuestion: "1.Communication requires context—and context requires space.",
        leftImageSrc: "./assets/Veritas/i2.png",
        rightImageSrc: "./assets/Veritas/i1.png",
        videoSrc: "https://assets.oghuzhan.work/video-AI.mov"
      },
      {
        question: "2.How can it work for different unique workflows and needs?",
        videoQuestion: "2.Mediation through flexible integration, enabling investigators to shape the workspace around their expertise.",
        leftImageSrc: "./assets/Veritas/i3.png",
        rightImageSrc: "./assets/Veritas/i4.png",
        videoSrc: "https://assets.oghuzhan.work/Video-workflow.mov"
      }
    ];

    var mapProjectPageDataByNodeId = {
      "3139:21709": {
        layoutType: MAP_PROJECT_LAYOUT_VERITAS,
        pageTitle: "Veritas - (a)live workspace",
        tags: [
          "#AI in Law Enforcement",
          "#Non linear Reasoning",
          "#Human AI Agency"
        ],
        lead:
          "Veritas is a visual investigation workspace designed in collaboration with Europol. Based on in-depth research with Swedish police agents working with visual evidence analysis in Stockholm and Umeå, the project explores how AI might better support investigative thinking in complex law-enforcement contexts. It keeps human expertise at the center by framing AI not as an authority or a fixed tool, but as an analytical partner within an evolving investigative process.",
        creditHtml:
          'Designed by Oğuzhan, <a href="https://mynameisfields.pl/alive-workspace.html" target="_blank" rel="noopener noreferrer" data-external-preview-title="(a)live workspace - Pola Kolodziej" data-external-preview-icon="https://mynameisfields.pl/assets/favicon.png" data-external-preview-transparent="true">Pola</a>, <a href="https://markvedberg.com/" target="_blank" rel="noopener noreferrer" data-external-preview-title="Mark Vedberg" data-external-preview-icon="https://framerusercontent.com/images/2pDkPJXZ3gGpDWMq02RFBc49Mzo.png" data-external-preview-transparent="true">Mark</a>, <a href="https://umeauniversity-my.sharepoint.com/personal/yizh0025_ad_umu_se/_layouts/15/onedrive.aspx?id=%2Fpersonal%2Fyizh0025%5Fad%5Fumu%5Fse%2FDocuments%2FYijing%20Zhang%20%2D%20Portfolio&ga=1" target="_blank" rel="noopener noreferrer">Yijing</a>',
        instituteHtml:
          'In collaboration with <a href="https://www.linkedin.com/posts/umea-institute-of-design_umeaevinstituteofdesign-uid-interactiondesign-activity-7443193872245235712-8Aas?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEX50PQBiszqx3v4anGvZ8Y-ozrsnwfpKhM" target="_blank" rel="noopener noreferrer">Europol</a><br>With support from the Swedish Police Authority',
        institute: "",
        visualLeftSrc: "https://assets.oghuzhan.work/FINAL.mp4",
        visualLeftType: "video",
        visualLeftPosterSrc: "./assets/Veritas/veritas-detail-visual-left.png",
        visualLeftAlt: "A short walkthrough of (a)liver workspace",
        visualRightSrc: "./assets/Veritas/veritas-detail-visual-right.png",
        visualRightType: "image",
        visualRightAlt: "Front end UI prototype of (a)live workspace",
        visualRightHref: "https://veritas.ougezihan.workers.dev/",
        visualRightLinkTitle: "veritas.ougezihan.workers.dev",
        visualRightLinkIcon: "./assets/Veritas/veritas-detail-logo.png",
        captionLeft: "A short walkthrough of (a)liver workspace",
        captionRight: "Front end UI prototype of (a)live workspace",
        sectionATitle: "Why not just another chat-box AI search tool?",
        sectionABodyHtml: veritasSectionABodyHtml,
        sectionBTitleHtml: veritasSectionBTitleHtml,
        sectionBBlocks: veritasSectionBBlocks,
        headingA: "Why not just another chat-box AI search tool?",
        headingB: "Investigative work is creative and exploritve"
      },
      "3150:21733": createTemplateMapProjectPageData({
        pageTitle: "MakkaPakka - a game for my blind friends",
        lead: "MakkaPakka is an inclusive hide-and-seek game system designed for blind and sighted children to play together in integrated education settings. Developed in response to playground exclusion observed in school environments, the project explores how accessible interaction can support not only usability, but also shared participation and peer connection. Rather than creating a separate assistive toy, it rethinks play itself as a space for inclusion.",
        galleryCards: buildTemplateGalleryCards("MakkaPakka", buildTemplateGalleryRange(1, 6))
      }),
      "3150:21734": createTemplateMapProjectPageData({
        pageTitle: "Eco-Mailbox",
        lead: "Eco-Mailbox is a participatory community project that reimagines abandoned mailboxes as shared supports for neighbourhood interaction. Grounded in ethnographic research and community-led regeneration, the project began by looking closely at how local relationships, routines, and underused infrastructures shape everyday social life. It proposes a small but meaningful intervention that turns overlooked urban material into a support structure for collective use and interaction.",
        tags: [
          "#ParticipatoryDesign",
          "#UrbanEthnography",
          "#CommunityRegeneration"
        ],
        creditHtml: "Designed by Oğuzhan, Zhenzhen Guo",
        instituteHtml: "gan studio project",
        galleryCards: buildTemplateGalleryCards("Eco-Mailbox", buildTemplateGalleryRange(7, 12))
      }),
      "3139:17651": createTemplateMapProjectPageData({
        pageTitle: "Woodpecker Project",
        lead: "Woodpecker Project is a community co-design renovation project that translates residents' stories and everyday needs into small public-space interventions. Developed through participatory workshops and local engagement, it explores how design can work with existing communities rather than imposing solutions from outside. The project treats spatial change as something negotiated collectively, through process as much as through outcome.",
        tags: [
          "#CommunityCoDesign",
          "#PublicSpace",
          "#NeighbourhoodRegeneration"
        ],
        creditHtml: "Designed by Oğuzhan",
        instituteHtml: "gan studio project",
        galleryCards: buildTemplateGalleryCards("Woodpecker Project", buildTemplateGalleryRange(13, 14))
      }),
      "3139:21712": createTemplateMapProjectPageData({
        pageTitle: "Slice Wardrobe",
        lead: "Slice Wardrobe is an interactive wardrobe system that encourages more intentional clothing use through exhibition and service design. Starting from the problem of overconsumption in everyday fashion practices, the project explores how interaction can support reflection, selection, and reuse rather than constant acquisition. It shifts sustainability from an abstract value into something people can experience through concrete choices and routines.",
        tags: [
          "#SustainableFashion",
          "#InteractiveExhibition",
          "#ServiceDesign"
        ],
        creditHtml: "Designed by Oğuzhan, Zhenzhen Guo",
        instituteHtml: "Open studio project<br>Exhibited at Hedong Community, October 2024",
        galleryCards: buildTemplateGalleryCards("Slice Wardrobe", buildTemplateGalleryRange(15, 20))
      }),
      "3139:21711": createTemplateMapProjectPageData({
        pageTitle: "Bottle U 4th",
        lead: "Bottle U 4th is a social innovation festival project combining event design, exhibition strategy, and digital touchpoints for public participation. Developed in a large public-facing context, the project explores how different forms of interaction can support engagement across visitors, organisers, and partner groups. Rather than treating the festival as a single event, it approaches it as a temporary participation system shaped through multiple designed encounters.",
        tags: [
          "#SocialInnovationFestival",
          "#PublicParticipation",
          "#EngagementDesign"
        ],
        creditHtml: "Designed by Oğuzhan",
        instituteHtml: "Internship project at BottleDream",
        galleryCards: buildTemplateGalleryCards("Bottle U 4th", buildTemplateGalleryRange(21, 22))
      }),
      "3139:21710": createTemplateMapProjectPageData({
        pageTitle: "Loom Drift",
        lead: "Loom Drift is a social app concept designed around chance encounters and the places where people's paths briefly cross. Informed by questions of urban disconnection and the experience of migration, the project explores how digital interaction might help people notice, revisit, and reinterpret fleeting moments of connection in the city. It frames social technology less as a tool for constant communication, and more as a way of making meaning around encounter.",
        tags: [
          "#ChanceEncounter",
          "#UrbanConnection",
          "#LocationBasedUIUX"
        ],
        creditHtml: "Designed by Oğuzhan",
        instituteHtml: "",
        galleryCards: buildTemplateGalleryCards("Loom Drift", buildTemplateGalleryRange(25, 26))
      }),
      "3139:21719": createTemplateMapProjectPageData({
        pageTitle: "Flexit",
        lead: "Flexit is a wearable sensing system designed to support healthier sitting habits through soft and accumulative feedback. Rather than correcting posture through rigid warnings or constant discipline, the project explores how embodied sensing can gently shape awareness and behaviour over time. It treats posture support as an everyday interaction problem, where care is built through subtle feedback rather than control."
      }),
      "3139:21718": createTemplateMapProjectPageData({
        pageTitle: "EasyFlow",
        lead: "EasyFlow is a lightweight floor-cleaning product designed for early senior users, with a focus on reducing physical strain and learning burden in everyday home cleaning. Based on research into ageing, ergonomics, and domestic routines, the project addresses how common household products often become difficult to use as bodily ability changes. It approaches inclusive product design through ease, clarity, and reduced effort in ordinary daily tasks."
      }),
      "3150:21732": createTemplateMapProjectPageData({
        pageTitle: "CIY - Cool It Yourself",
        lead: "CIY - Cool It Yourself is a low-cost, DIY cooling garment designed as a wearable intervention for outdoor workers in Southeast Asia. The project emerged from the question of how thermal discomfort and heat exposure might be addressed through accessible, self-made solutions rather than resource-intensive systems. It frames climate adaptation at the scale of the body, using simple material strategies to support comfort in demanding everyday conditions."
      }),
      "3139:21713": createTemplateMapProjectPageData({
        pageTitle: "PaperMind",
        lead: "PaperMind is a community-based cognitive-motor training system designed for older adults with Mild Cognitive Impairment. Developed through field research in a real intervention setting, the project explores how motion-based games, wearable sensing, and multimodal feedback can support memory training while also reducing therapists' workload in community care. It keeps human care at the center by framing technology not as a replacement, but as a collaborative support system.",
        secondaryStatement: "Snapshots from the field research and prototype exploration ⇊",
        tags: [
          "#MCI",
          "#CognitiveMotorTraining",
          "#HumanMachineCollaboration"
        ],
        creditHtml: "Designed by Oğuzhan",
        instituteHtml: "Graduation thesis project",
        galleryCards: [
          {
            src: "./assets/MCI/M2.png",
            alt: "PaperMind prototype interaction in a community care setting"
          },
          {
            src: "./assets/MCI/M4.png",
            alt: "PaperMind wearable and game setup details"
          },
          {
            src: "./assets/MCI/M5.png",
            alt: "PaperMind training interface and feedback flow"
          },
          {
            src: "./assets/MCI/M1.png",
            alt: "PaperMind session capture with participant and therapist"
          },
          {
            src: "./assets/MCI/M3.png",
            alt: "PaperMind in-context co-creation and testing moments"
          }
        ]
      }),
      "3150:21735": createOpenTraceMapProjectPageData({
        pageTitle: "OpenTraces",
        tags: [
          "#Sound Design",
          "#Decentralized Infrastructure",
          "#Speculative Intervention"
        ],
        titleBadgeHref: "https://nextgendesign.eu/2026/04/20/opentraces/",
        titleBadgeSrc: "./assets/OpenTrace/next-gen-design-award-logo.png",
        titleBadgeAlt: "Next Gen Design 2026 winner logo",
        creditHtml:
          'Designed by Oğuzhan, <a class="map-project-opentrace-inline-link" href="https://markvedberg.com/" target="_blank" rel="noopener noreferrer" data-external-preview-title="Mark Vedberg" data-external-preview-icon="https://framerusercontent.com/images/2pDkPJXZ3gGpDWMq02RFBc49Mzo.png" data-external-preview-transparent="true">Mark</a>, <a class="map-project-opentrace-inline-link" href="https://umeauniversity-my.sharepoint.com/personal/bres0006_ad_umu_se/_layouts/15/onedrive.aspx?id=%2Fpersonal%2Fbres0006%5Fad%5Fumu%5Fse%2FDocuments%2FBrandon%20Escalona%5FPortfolio%202026&ga=1" target="_blank" rel="noopener noreferrer">Brandon</a>, Zipei',
        creditSecondaryHtml:
          '<a class="map-project-opentrace-inline-link" href="https://nextgendesign.eu/2026/04/20/opentraces/" target="_blank" rel="noopener noreferrer" data-external-preview-title="Next Gen Design" data-external-preview-icon="./assets/OpenTrace/next-gen-design-award-logo.png">THE WINNER of NEXT GEN DESIGN 2026 “Futures Worth Living”</a>',
        heroKicker: "Enabling immigrants to build a shared sound-layer of experiences, placed on top of our physical world",
        heroCredit: "Oğuzhan, Mark, Brandon, Zipei",
        heroYear: "2026",
        lead: "OpenTraces is a location-based audio archive that enables migrants to leave, access, and build shared traces of lived experience in the places they move through. Rather than offering top-down guidance on how to adapt to a new environment, the project explores how personal stories, emotions, and everyday knowledge can accumulate into a decentralized layer of support—helping people navigate, understand, and make sense of a new world through one another’s experiences.",
        sequenceHeading: "Why focus on the experience of immigration?",
        sequenceStatementHtml: 'Immigrants encounter both <span class="map-project-opentrace-highlight map-project-detail-hotspot" tabindex="0" data-detail-preview-src="./assets/OpenTrace/Slide 16_9 - 82.png" data-detail-preview-alt="OpenTraces emotional challenges placeholder image" data-detail-preview-max-width="45rem" data-detail-preview-max-height="72vh" data-detail-preview-offset-x="12" data-detail-preview-offset-y="12">emotional</span> and <span class="map-project-opentrace-highlight map-project-detail-hotspot" tabindex="0" data-detail-preview-src="./assets/OpenTrace/Slide 16_9 - 83.png" data-detail-preview-alt="OpenTraces practical challenges placeholder image" data-detail-preview-max-width="45rem" data-detail-preview-max-height="72vh" data-detail-preview-offset-x="12" data-detail-preview-offset-y="12">practical</span> obstacles when moving to a new country.',
        sequenceFrames: [
          "./assets/OpenTrace/Slide 16_9 - 44.png",
          "./assets/OpenTrace/Slide 16_9 - 52.png",
          "./assets/OpenTrace/Slide 16_9 - 56.png",
          "./assets/OpenTrace/Slide 16_9 - 61.png",
          "./assets/OpenTrace/Slide 16_9 - 45.png",
          "./assets/OpenTrace/Slide 16_9 - 57.png",
          "./assets/OpenTrace/Slide 16_9 - 60.png",
          "./assets/OpenTrace/Slide 16_9 - 66.png",
          "./assets/OpenTrace/Slide 16_9 - 72.png"
        ],
        sequenceFrameAlt: "OpenTraces immigration sequence frame",
        closingText: "So this is what we come up with!",
        closingTextHtml: 'So <span class="map-project-opentrace-highlight map-project-opentrace-highlight--muted map-project-detail-hotspot" tabindex="0" data-detail-preview-src="./assets/OpenTrace/Slide 16_9 - 120.png" data-detail-preview-slides="./assets/OpenTrace/Slide 16_9 - 120.png|./assets/OpenTrace/ThisHover1.png|./assets/OpenTrace/ThisHover2.png|./assets/OpenTrace/ThisHover3.png" data-detail-preview-alt="OpenTraces final concept hover sequence" data-detail-preview-max-width="34rem" data-detail-preview-max-height="72vh" data-detail-preview-offset-x="12" data-detail-preview-offset-y="12">this</span> is what we come up with!',
        closingBodyText: "A shared audio layer of place-based migrant experiences that supports people in understanding and navigating a new world through one another’s traces.",
        featureVideoSrc: "https://assets.oghuzhan.work/test%207.mov",
        featureVideoPosterSrc: "./assets/OpenTrace/VideoThumbNail.png",
        featureVideoAlt: "OpenTraces concept video"
      })
    };
    var sourceOpenTracesNode = null;

    if (sourceOpenTracesTemplate && sourceOpenTracesTemplate.content) {
      sourceOpenTracesNode = sourceOpenTracesTemplate.content.firstElementChild;
    }
    if (!sourceOpenTracesNode && sourceOpenTraces) {
      sourceOpenTracesNode = sourceOpenTraces;
    }

    if (!preview || !previewFrame || !previewOpenTracesHost || !previewPlaceholder || !sourceOpenTracesNode || !mapWrap || !items.length || !mapProjectShell || !mapProjectScroll || !mapProjectContent || !mapProjectCloseBtn || !mapProjectNav || !mapProjectPrevBtn || !mapProjectNextBtn || !mapProjectPrevLabel || !mapProjectNextLabel || !mapProjectDetailTopbar || !mapProjectDetailHeader || !mapProjectVeritasRoot || !mapProjectDetailStage || !mapProjectDetailTitleGroup || !mapProjectDetailTitle || !mapProjectDetailTag1 || !mapProjectDetailTag2 || !mapProjectDetailTag3 || !mapProjectDetailLead || !mapProjectDetailCredit || !mapProjectDetailInstitute || !mapProjectDetailVisualLeft || !mapProjectDetailVisualRightLink || !mapProjectDetailVisualRight || !mapProjectDetailCaptionLeft || !mapProjectDetailCaptionRight || !mapProjectDetailSectionA || !mapProjectDetailHeadingA || !mapProjectDetailHeadingABody || !mapProjectDetailSectionB || !mapProjectDetailHeadingB || !mapProjectDetailHeadingBBody || !mapProjectDetailSectionC || !mapProjectTemplateRoot || !mapProjectOpenTraceRoot || !practiceTitle) {
      return;
    }
    var canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    preview.classList.toggle("map-center-hover-preview--cursor", !!canHover);
    caption.classList.toggle("map-hover-caption--cursor", !!canHover);
    var MAP_GRID_RATIO = 1440 / 1024;
    var PRACTICE_LAYOUT_CELL = 66.209;
    var PRACTICE_GRID_CELL = PRACTICE_LAYOUT_CELL * 0.75;
    var PRACTICE_MAP_BREAKPOINT = 768;
    var PRACTICE_BASE_VIEWPORT_WIDTH = 1440 - (34 * 2);
    var PRACTICE_BASE_VIEWPORT_HEIGHT = PRACTICE_BASE_VIEWPORT_WIDTH / MAP_GRID_RATIO;
    var PRACTICE_BASE_VIEW_COLS = Math.max(1, Math.floor(PRACTICE_BASE_VIEWPORT_WIDTH / PRACTICE_LAYOUT_CELL));
    var PRACTICE_BASE_VIEW_ROWS = Math.max(1, Math.floor(PRACTICE_BASE_VIEWPORT_HEIGHT / PRACTICE_LAYOUT_CELL));
    var PRACTICE_MIN_VIEW_COLS = 8;
    var PRACTICE_MIN_VIEW_ROWS = 6;
    var PRACTICE_CENTER_COL = 11;
    var PRACTICE_CENTER_ROW = 9;
    var PRACTICE_MOBILE_COL_MIN = 5;
    var PRACTICE_MOBILE_COL_MAX = 20;
    var PRACTICE_MOBILE_ROW_MIN = 1;
    var PRACTICE_MOBILE_ROW_MAX = 28;
    var PRACTICE_MOBILE_ANCHOR_ROW = 9;
    var PRACTICE_MOBILE_DEFAULT_START_COL = 4;
    var PRACTICE_MOBILE_DEFAULT_START_ROW = 1;
    var PRACTICE_MOBILE_PROFILE_TOUCH = "touch";
    var PRACTICE_MOBILE_PROFILE_HOVER = "hover";
    var PRACTICE_MOBILE_DEBUG_MOUSE_POINTER_ID = -9001;
    var PRACTICE_MOBILE_DEBUG_PARAM = "practice-mobile-debug";
    var PRACTICE_MOBILE_POS_STORAGE_KEY = "practice3042.mobile.positions.v1";
    var PRACTICE_MOBILE_DEBUG_STORAGE_KEY = "practice3042.mobile.debug.enabled";
    var PRACTICE_ONBOARDING_STORAGE_KEY = "practice3042.onboarding.dismissed.v2";
    var PRACTICE_ONBOARDING_ENABLED = false;
    var PRACTICE_ONBOARDING_SHOW_DELAY_MS = 280;
    var PRACTICE_TAG_FILTER_SOCIAL = "social";
    var PRACTICE_TAG_FILTER_INTERACTION = "interaction";
    var PRACTICE_TAG_FILTER_PSSD = "pssd";
    var PRACTICE_PRIORITY_SCOPE_DEFAULT = "default";
    var PRACTICE_ROW_VISUAL_OFFSET = 0;
    var mapProjectDetailHeaderWrapRaf = 0;
    var mapProjectDetailHeaderCollapseRaf = 0;
    var mapProjectDetailHeaderCollapseTrackRaf = 0;
    var mapProjectDetailDesktopMediaRaf = 0;
    var mapProjectDetailSectionBSyncRaf = 0;
    var mapProjectDetailSectionBSceneStates = [];
    var mapProjectDetailSectionBResizeFrozen = false;
    var mapProjectDetailSectionBResizeFreezeScrollTop = 0;
    var mapProjectDetailSectionBLastScrollTop = 0;
    var mapProjectDetailChromeThemeRaf = 0;
    var mapProjectViewportRecoveryRafA = 0;
    var mapProjectViewportRecoveryRafB = 0;
    var mapProjectViewportRecoveryTimeout = 0;
    var PRACTICE_TAG_PROJECT_NAMES = {};
    PRACTICE_TAG_PROJECT_NAMES[PRACTICE_TAG_FILTER_SOCIAL] = [
      "CIY",
      "PaperMind",
      "MakkaPakka",
      "Woodpecker",
      "Eco-Mailbox",
      "LoomDrift",
      "OpenTraces",
      "BottleU"
    ];
    PRACTICE_TAG_PROJECT_NAMES[PRACTICE_TAG_FILTER_INTERACTION] = [
      "Veritas",
      "SliceWardrobe",
      "BottleU",
      "Flexit",
      "LoomDrift",
      "PaperMind",
      "MakkaPakka",
      "OpenTraces"
    ];
    PRACTICE_TAG_PROJECT_NAMES[PRACTICE_TAG_FILTER_PSSD] = [
      "SliceWardrobe",
      "Eco-Mailbox",
      "CIY",
      "LoomDrift",
      "OpenTraces",
      "BottleU"
    ];
    var PRACTICE_PRIORITY_RANK_BY_SCOPE = {};
    PRACTICE_PRIORITY_RANK_BY_SCOPE[PRACTICE_PRIORITY_SCOPE_DEFAULT] = {
      "3150:21735": 1, // OpenTrace
      "3139:21709": 1, // Veritas
      "3150:21733": 1, // MakkaPakka
      "3139:21713": 2, // PaperMind
      "3150:21734": 1, // Eco-Mailbox
      "3139:17651": 2, // Woodpecker
      "3139:21711": 2, // BottleU
      "3139:21712": 3, // SliceWardrobe
      "3139:21710": 3, // LoomDrift
      "3150:21732": 4, // CIY
      "3139:21719": 4, // Flexit
      "3139:21718": 4 // EasyFlow
    };
    PRACTICE_PRIORITY_RANK_BY_SCOPE[PRACTICE_TAG_FILTER_SOCIAL] = {
      "3150:21732": 4, // CIY
      "3139:21713": 3, // PaperMind
      "3150:21733": 2, // MakkaPakka
      "3139:17651": 1, // Woodpecker
      "3150:21734": 1, // Eco-Mailbox
      "3139:21710": 2, // LoomDrift
      "3150:21735": 1, // OpenTrace
      "3139:21711": 2 // BottleU
    };
    PRACTICE_PRIORITY_RANK_BY_SCOPE[PRACTICE_TAG_FILTER_INTERACTION] = {
      "3139:21709": 1, // Veritas
      "3139:21712": 4, // SliceWardrobe
      "3139:21719": 4, // Flexit
      "3139:21710": 4, // LoomDrift
      "3139:21713": 2, // PaperMind
      "3150:21733": 2, // MakkaPakka
      "3150:21735": 1, // OpenTrace
      "3139:21711": 3 // BottleU
    };
    PRACTICE_PRIORITY_RANK_BY_SCOPE[PRACTICE_TAG_FILTER_PSSD] = {
      "3139:21712": 2, // SliceWardrobe
      "3150:21734": 1, // Eco-Mailbox
      "3150:21732": 4, // CIY
      "3139:21710": 1, // LoomDrift
      "3150:21735": 1, // OpenTrace
      "3139:21711": 3 // BottleU
    };
    // Per-project hover preview scale multipliers (1 = original size).
    var PRACTICE_HOVER_PREVIEW_SCALE_BY_NODE_ID = {
      "3139:17651": 1, // Woodpecker
      "3150:21735": 1.5, // OpenTrace
      "3139:21709": 1, // Veritas
      "3139:21710": 1.2, // LoomDrift
      "3139:21711": 1, // BottleU
      "3139:21712": 1.1, // SliceWardrobe
      "3139:21713": 0.8, // PaperMind
      "3150:21733": 1, // MakkaPakka
      "3150:21734": 1.3, // Eco-Mailbox
      "3139:21718": 0.8, // EasyFlow
      "3139:21719": 1.2, // Flexit
      "3150:21732": 1.2 // CIY
    };

    var activeItem = null;
    var activeMode = "";
    var activeConfig = null;
    var cursorPreviewClientX = 0;
    var cursorPreviewClientY = 0;
    var hasCursorPreviewPoint = false;
    var MAP_CENTER_CURSOR_PREVIEW_GAP = 18;
    var MAP_CENTER_CURSOR_PREVIEW_PAD = 16;
    var MAP_CENTER_PREVIEW_FOOTER_RESERVE = 24;
    var MAP_CENTER_CURSOR_PREVIEW_FOOTER_RESERVE = 46;
    var MAP_CENTER_CURSOR_CAPTION_GAP = 16;
    var MAP_CENTER_CURSOR_CAPTION_PAD = 16;
    var slideshowTimerId = 0;
    var slideshowIndex = 0;
    var slideshowRunToken = 0;
    var slideshowLayerIndex = 0;
    var slideshowPreloadedSrc = new Set();
    var slideshowPreloadedVideoSrc = new Set();
    var slideshowProgressRaf = 0;
    var slideRatioBySrc = new Map();
    var slideVideoRatioBySrc = new Map();
    var pendingSlideshowVideoMetadataHandler = null;
    var detailByNodeId = captionByNodeId;
    var practiceOnboardingDismissed = !didPageLoadFromReload() && safeReadLocalStorage(PRACTICE_ONBOARDING_STORAGE_KEY) === "1";
    var practiceOnboardingCard = null;
    var practiceOnboardingLinePrimary = null;
    var practiceOnboardingLineSecondary = null;
    var practiceOnboardingLineTertiary = null;
    var practiceOnboardingShowTimerId = 0;
    var practiceOnboardingHasShown = false;
    var MAP_PROJECT_TEMPLATE_IMAGE_PLACEHOLDER_SRC = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
    var MAP_PROJECT_TEMPLATE_LAZY_MAX_CONCURRENT = 2;
    // Keep startup image pressure low by warming only the first frame unless explicitly opted in.
    var MAP_CENTER_STARTUP_PRELOAD_INDICES = [0];
    var MAP_CENTER_STARTUP_ENABLE_FULL_PRELOAD = false;
    var MAP_CENTER_STARTUP_FULL_PRELOAD_DELAY_MS = 1200;
    // OpenTrace sequence can be large; preload only a short runway ahead.
    var MAP_PROJECT_OPENTRACE_SEQUENCE_PRELOAD_AHEAD = 2;
    var mapProjectTemplateImageViewerState = {
      rootEl: null,
      backdropEl: null,
      viewportEl: null,
      canvasEl: null,
      imageEl: null,
      closeBtnEl: null,
      isOpen: false,
      scale: 1,
      minScale: 1,
      maxScale: 6,
      tx: 0,
      ty: 0,
      baseWidth: 1,
      baseHeight: 1,
      viewportWidth: 0,
      viewportHeight: 0,
      dragPointerId: -1,
      dragStartX: 0,
      dragStartY: 0,
      dragStartTx: 0,
      dragStartTy: 0,
      pointers: {},
      pinchInitialDist: 0,
      pinchInitialScale: 1,
      pinchWorldX: 0,
      pinchWorldY: 0,
      keydownBound: false
    };
    var mapProjectTemplateLazyState = {
      observer: null,
      queue: [],
      active: 0,
      token: 0
    };
    var itemByNodeId = {};
    var nodeIdByProjectName = {};
    var nodeIdByProjectKey = {};
    var nodeIdByMapProjectSlug = {};
    var mapProjectSlugByNodeId = {};
    var projectNameByNodeId = {};
    var practiceItemByProjectKey = {};
    var practiceTagItemsByKey = {};
    var practiceTagFilterState = {
      hoveredKey: "",
      lockedKey: ""
    };
    var practiceGridEntries = [];
    var practiceResponsiveState = {
      desktopActive: false,
      mobileActive: false,
      mobileBaseViewRows: -1,
      mobileBaseGridCell: 0,
      mobileCenterRow: 0,
      viewCols: -1,
      viewRows: -1,
      startCol: 0,
      startRow: 0,
      scaleX: 1,
      scaleY: 1
    };
    var mapDetailState = {
      activeNodeId: null,
      returnScrollY: 0,
      scrollLocked: false,
      entryContext: ""
    };
    var pendingMapProjectEntryContext = "";
    var mapProjectInitialHashHandled = false;
    var mapDetailNavState = {
      orderedNodeIds: [],
      activeIndex: -1,
      navCooldownUntil: 0,
      pendingEntryShift: 0,
      wheelGesture: {
        active: false,
        deltaX: 0,
        committed: false,
        settleTimerId: 0
      },
      drag: {
        active: false,
        pointerId: -1,
        startX: 0,
        currentDeltaX: 0
      }
    };
    var mapProjectOpenTraceSequenceState = {
      enabled: false,
      frameSources: [],
      currentIndex: 0,
      wheelCarry: 0,
      activeStepProgress: 0,
      lockActive: false,
      lockScrollTop: 0,
      overflowYBeforeLock: "",
      overscrollBehaviorYBeforeLock: "",
      lastShellTop: NaN,
      rootEl: null,
      shellEl: null,
      imageEl: null,
      imageEls: [],
      activeImageSlot: 0,
      pendingSwapToken: 0,
      indicatorEls: [],
      prevButtonEl: null,
      nextButtonEl: null,
      preloadImages: []
    };
    var touchLensState = {
      enabled: false,
      pointerId: -1,
      x: NaN,
      y: NaN,
      startX: 0,
      startY: 0,
      moved: false,
      hoverItem: null,
      lensEl: null,
      zoomLayerEl: null,
      zoomSceneEl: null
    };
    var mapCenterNavState = {
      enabled: false,
      crosshairEl: null,
      activeItem: null,
      scale: 1,
      tx: 0,
      ty: 0,
      minScale: 0.75,
      maxScale: 2.4,
      pointers: {},
      dragPointerId: -1,
      dragLastX: 0,
      dragLastY: 0,
      pinchInitialDist: 0,
      pinchInitialScale: 1,
      pinchAnchorViewportX: 0,
      pinchAnchorViewportY: 0,
      pinchAnchorWorldX: 0,
      pinchAnchorWorldY: 0,
      tapPointerId: -1,
      tapStartX: 0,
      tapStartY: 0,
      tapMoved: false
    };
    var mapCenterNavBound = false;
    var mobileDebugState = {
      enabled: false,
      activeProfile: "",
      panelEl: null,
      statusEl: null,
      drag: {
        active: false,
        pointerId: -1,
        item: null,
        offsetX: 0,
        offsetY: 0,
        moved: false
      },
      justDragged: false,
      baseByNodeId: {},
      userByNodeId: {}
    };
    var touchLensPointerMql = window.matchMedia
      ? window.matchMedia("(hover: none), (pointer: coarse)")
      : null;
    var practiceTitleOriginalText = practiceTitleText
      ? (practiceTitleText.textContent || "My Work")
      : (practiceTitle.textContent || "My Work");
    var supportsFineHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    function normalizePracticeProjectName(name) {
      return String(name || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
    }

    function slugifyMapProjectName(name) {
      var normalized = String(name || "").trim();
      if (!normalized) return "";
      normalized = normalized.replace(/([a-z0-9])([A-Z])/g, "$1-$2");
      normalized = normalized.toLowerCase();
      if (typeof normalized.normalize === "function") {
        normalized = normalized.normalize("NFKD");
      }
      normalized = normalized.replace(/[\u0300-\u036f]/g, "");
      normalized = normalized.replace(/&/g, " and ");
      normalized = normalized.replace(/[^a-z0-9]+/g, "-");
      normalized = normalized.replace(/^-+/, "").replace(/-+$/, "");
      return normalized;
    }

    function registerMapProjectSlug(nodeId, name) {
      if (!nodeId || !detailByNodeId[nodeId]) return;
      var slug = slugifyMapProjectName(name);
      if (!slug) return;
      if (!mapProjectSlugByNodeId[nodeId]) {
        mapProjectSlugByNodeId[nodeId] = slug;
      }
      if (!nodeIdByMapProjectSlug[slug]) {
        nodeIdByMapProjectSlug[slug] = nodeId;
      }
    }

    function resolveMapProjectNodeIdFromToken(token) {
      var rawToken = String(token || "").trim();
      if (!rawToken) return "";
      if (detailByNodeId[rawToken]) return rawToken;

      var bySlug = nodeIdByMapProjectSlug[rawToken] || nodeIdByMapProjectSlug[rawToken.toLowerCase()];
      if (bySlug && detailByNodeId[bySlug]) return bySlug;

      var normalizedSlug = slugifyMapProjectName(rawToken);
      if (normalizedSlug) {
        var byNormalizedSlug = nodeIdByMapProjectSlug[normalizedSlug];
        if (byNormalizedSlug && detailByNodeId[byNormalizedSlug]) return byNormalizedSlug;
      }

      var byExactName = nodeIdByProjectName[rawToken];
      if (byExactName && detailByNodeId[byExactName]) return byExactName;

      var normalizedProjectKey = normalizePracticeProjectName(rawToken);
      if (normalizedProjectKey) {
        var byProjectKey = nodeIdByProjectKey[normalizedProjectKey];
        if (byProjectKey && detailByNodeId[byProjectKey]) return byProjectKey;
      }

      return "";
    }

    function getMapProjectHashValue(nodeId) {
      if (!nodeId) return "";
      var cached = mapProjectSlugByNodeId[nodeId];
      if (cached) return cached;
      var detail = detailByNodeId[nodeId];
      registerMapProjectSlug(nodeId, projectNameByNodeId[nodeId] || (detail && detail.title ? detail.title : nodeId));
      return mapProjectSlugByNodeId[nodeId] || nodeId;
    }

    function setPracticePriorityAnchor(item) {
      if (!item) return;
      var firstBlock = item.querySelector(".mypractice-map-block");
      if (!firstBlock || !firstBlock.style) return;
      var rawX = Number(firstBlock.style.getPropertyValue("--cx"));
      var rawY = Number(firstBlock.style.getPropertyValue("--cy"));
      if (isFinite(rawX)) {
        item.style.setProperty("--priority-cell-x", String(Math.round(rawX)));
      }
      if (isFinite(rawY)) {
        item.style.setProperty("--priority-cell-y", String(Math.round(rawY)));
      }
    }

    function recomputePracticePriorityAnchors() {
      items.forEach(function (item) {
        setPracticePriorityAnchor(item);
      });
    }

    function syncPracticePriorityBadges() {
      var activeKey = getCurrentPracticeTagKey();
      var scope = activeKey || PRACTICE_PRIORITY_SCOPE_DEFAULT;
      var rankMap = PRACTICE_PRIORITY_RANK_BY_SCOPE[scope]
        || PRACTICE_PRIORITY_RANK_BY_SCOPE[PRACTICE_PRIORITY_SCOPE_DEFAULT]
        || {};
      items.forEach(function (item) {
        var nodeId = item.getAttribute("data-node-id") || "";
        var rank = Number(rankMap[nodeId]);
        if (isFinite(rank) && rank > 0) {
          item.setAttribute("data-priority-rank", String(Math.round(rank)));
        } else {
          item.removeAttribute("data-priority-rank");
        }
      });
      syncPracticePriorityHitLayers();
    }

    function readPracticeItemPriorityRank(item) {
      if (!item) return Infinity;
      var raw = Number(item.getAttribute("data-priority-rank"));
      if (!isFinite(raw) || raw <= 0) return Infinity;
      return raw;
    }

    function syncPracticePriorityHitLayers() {
      items.forEach(function (item) {
        var rank = readPracticeItemPriorityRank(item);
        var zIndex = rank === Infinity ? 1 : Math.max(1, 1000 - Math.round(rank));
        item.style.setProperty("--practice-hit-z-index", String(zIndex));
      });
    }

    function shouldPreferPracticeHitCandidate(candidateItem, candidateDistSq, currentItem, currentDistSq) {
      if (!candidateItem) return false;
      if (!currentItem) return true;
      var candidateRank = readPracticeItemPriorityRank(candidateItem);
      var currentRank = readPracticeItemPriorityRank(currentItem);
      if (candidateRank !== currentRank) return candidateRank < currentRank;
      if (candidateDistSq !== currentDistSq) return candidateDistSq < currentDistSq;
      var candidateNodeId = candidateItem.getAttribute("data-node-id") || "";
      var currentNodeId = currentItem.getAttribute("data-node-id") || "";
      if (candidateNodeId !== currentNodeId) return candidateNodeId < currentNodeId;
      return false;
    }

    function getPracticeHoverPreviewScale(item) {
      if (!item) return 1;
      var nodeId = item.getAttribute("data-node-id") || "";
      if (!nodeId) return 1;
      var multiplier = Number(PRACTICE_HOVER_PREVIEW_SCALE_BY_NODE_ID[nodeId]);
      if (!isFinite(multiplier) || multiplier <= 0) return 1;
      return multiplier;
    }

    items.forEach(function (item) {
      var nodeId = item.getAttribute("data-node-id") || "";
      if (!nodeId) return;
      item.setAttribute("data-detail-enabled", isMapProjectDetailEnabled(nodeId) ? "true" : "false");
      itemByNodeId[nodeId] = item;
      var projectName = (item.getAttribute("data-project-name") || "").trim();
      var projectKey = normalizePracticeProjectName(projectName);
      if (projectName) {
        projectNameByNodeId[nodeId] = projectName;
        if (!nodeIdByProjectName[projectName]) {
          nodeIdByProjectName[projectName] = nodeId;
        }
        registerMapProjectSlug(nodeId, projectName);
      }
      if (projectKey && !nodeIdByProjectKey[projectKey]) {
        nodeIdByProjectKey[projectKey] = nodeId;
      }
      if (projectKey && !practiceItemByProjectKey[projectKey]) {
        practiceItemByProjectKey[projectKey] = item;
      }
      var practiceEntry = {
        item: item,
        nodeId: nodeId,
        baseCol: readItemCoordWithFallback(item, ["--col-desktop", "--col"]),
        baseRow: readItemCoordWithFallback(item, ["--row-desktop", "--row"]),
        baseMobileCol: readItemCoordWithFallback(item, ["--col-mobile", "--col-desktop", "--col"]),
        baseMobileRow: readItemCoordWithFallback(item, ["--row-mobile", "--row-desktop", "--row"]),
        scaledCol: NaN,
        scaledRow: NaN
      };
      mobileDebugState.baseByNodeId[nodeId] = {
        col: practiceEntry.baseMobileCol,
        row: practiceEntry.baseMobileRow
      };
      practiceGridEntries.push(practiceEntry);
    });
    Object.keys(detailByNodeId).forEach(function (nodeId) {
      var detail = detailByNodeId[nodeId] || {};
      var detailTitle = detail && detail.title ? String(detail.title) : "";
      if (detailTitle && !nodeIdByProjectName[detailTitle]) {
        nodeIdByProjectName[detailTitle] = nodeId;
      }
      var detailKey = normalizePracticeProjectName(detailTitle);
      if (detailKey && !nodeIdByProjectKey[detailKey]) {
        nodeIdByProjectKey[detailKey] = nodeId;
      }
      registerMapProjectSlug(nodeId, projectNameByNodeId[nodeId] || detailTitle || nodeId);
    });
    recomputePracticePriorityAnchors();

    function isPracticeDesktopTagFilterActive() {
      return window.innerWidth >= PRACTICE_MAP_BREAKPOINT;
    }

    function getCurrentPracticeTagKey() {
      if (practiceTagFilterState.hoveredKey) return practiceTagFilterState.hoveredKey;
      return practiceTagFilterState.lockedKey;
    }

    function clearPracticeTagHighlightClasses() {
      items.forEach(function (item) {
        item.classList.remove("is-tag-highlighted");
      });
    }

    function getPracticeTagItems(tagKey) {
      if (!tagKey) return [];
      if (practiceTagItemsByKey[tagKey]) return practiceTagItemsByKey[tagKey];
      var names = PRACTICE_TAG_PROJECT_NAMES[tagKey] || [];
      var resolved = [];
      var seen = {};
      names.forEach(function (name) {
        var item = practiceItemByProjectKey[normalizePracticeProjectName(name)];
        if (!item) return;
        var nodeId = item.getAttribute("data-node-id") || "";
        if (!nodeId || seen[nodeId]) return;
        seen[nodeId] = true;
        resolved.push(item);
      });
      practiceTagItemsByKey[tagKey] = resolved;
      return resolved;
    }

    function syncPracticeTagButtonStates() {
      if (!topTagsWrap) return;
      var tags = [topTagSocial, topTagInteraction, topTagPssd];
      tags.forEach(function (tag) {
        if (!tag) return;
        var key = tag.getAttribute("data-practice-tag-key") || "";
        var hovered = !!key && key === practiceTagFilterState.hoveredKey;
        var active = !!key && key === practiceTagFilterState.lockedKey;
        tag.classList.toggle("is-tag-hovered", hovered);
        tag.classList.toggle("is-tag-active", active);
      });
    }

    function syncPracticeTagFilterVisual() {
      if (!mapWrap) return;
      if (!isPracticeDesktopTagFilterActive()) {
        practiceTagFilterState.hoveredKey = "";
      }
      var activeKey = getCurrentPracticeTagKey();
      mapWrap.classList.toggle("has-tag-filter", !!activeKey);
      clearPracticeTagHighlightClasses();
      if (activeKey) {
        getPracticeTagItems(activeKey).forEach(function (item) {
          item.classList.add("is-tag-highlighted");
        });
      }
      syncPracticeTagButtonStates();
      syncPracticePriorityBadges();
    }

    function bindPracticeTagFilter(tagEl, tagKey) {
      if (!tagEl || !tagKey) return;
      tagEl.setAttribute("data-practice-tag-key", tagKey);

      tagEl.addEventListener("pointerenter", function () {
        if (!isPracticeDesktopTagFilterActive()) return;
        practiceTagFilterState.hoveredKey = tagKey;
        syncPracticeTagFilterVisual();
      });

      tagEl.addEventListener("pointerleave", function () {
        if (!isPracticeDesktopTagFilterActive()) return;
        if (practiceTagFilterState.hoveredKey !== tagKey) return;
        practiceTagFilterState.hoveredKey = "";
        syncPracticeTagFilterVisual();
      });

      tagEl.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (practiceTagFilterState.lockedKey === tagKey) {
          practiceTagFilterState.lockedKey = "";
        } else {
          practiceTagFilterState.lockedKey = tagKey;
        }
        syncPracticeTagFilterVisual();
      });

    }

    bindPracticeTagFilter(topTagSocial, PRACTICE_TAG_FILTER_SOCIAL);
    bindPracticeTagFilter(topTagInteraction, PRACTICE_TAG_FILTER_INTERACTION);
    bindPracticeTagFilter(topTagPssd, PRACTICE_TAG_FILTER_PSSD);
    syncPracticeTagFilterVisual();

    mapDetailNavState.orderedNodeIds = getOrderedMapNodeIdsByX().filter(isMapProjectDetailEnabled);
    var slideshowLayers = [];
    if (previewSlideshowImgA) slideshowLayers.push(previewSlideshowImgA);
    if (previewSlideshowImgB) slideshowLayers.push(previewSlideshowImgB);
    if (!slideshowLayers.length && previewSlideshowImgLegacy) slideshowLayers.push(previewSlideshowImgLegacy);

    var mirrorOpenTraces = sourceOpenTracesNode.cloneNode(true);
    mirrorOpenTraces.classList.add("map-center-open-traces-mirror");
    previewOpenTracesHost.appendChild(mirrorOpenTraces);

    var measureHost = document.createElement("div");
    measureHost.className = "map-center-open-traces-measure-host";
    measureHost.setAttribute("aria-hidden", "true");
    measureHost.style.position = "fixed";
    measureHost.style.left = "-200vw";
    measureHost.style.top = "0";
    measureHost.style.visibility = "hidden";
    measureHost.style.pointerEvents = "none";
    measureHost.style.zIndex = "-1";
    measureHost.style.width = "1024px";

    var measureOpenTraces = sourceOpenTracesNode.cloneNode(true);
    measureOpenTraces.classList.add("map-center-open-traces-measure");
    measureHost.appendChild(measureOpenTraces);
    document.body.appendChild(measureHost);

    var mirrorVideo = mirrorOpenTraces.querySelector(".practice3042-open-traces-video");
    var measureVideo = measureOpenTraces.querySelector(".practice3042-open-traces-video");
    if (mirrorVideo) {
      mirrorVideo.autoplay = false;
      mirrorVideo.removeAttribute("autoplay");
    }
    if (measureVideo) {
      measureVideo.autoplay = false;
      measureVideo.removeAttribute("autoplay");
      measureVideo.pause();
    }

    var mirrorImages = Array.prototype.slice.call(mirrorOpenTraces.querySelectorAll("img"));
    mirrorImages.forEach(function (img) {
      if (typeof img.decode === "function") {
        img.decode().catch(function () {});
      }
    });
    if (mirrorVideo) {
      mirrorVideo.load();
    }

    function getPixelLineHeight(el) {
      if (!el) return 0;
      var style = window.getComputedStyle(el);
      var lineHeight = parseFloat(style.lineHeight);
      if (isFinite(lineHeight) && lineHeight > 0) return lineHeight;
      var fontSize = parseFloat(style.fontSize);
      if (!isFinite(fontSize) || fontSize <= 0) return 0;
      return fontSize * 1.5;
    }

    function applyOpenTracesTypographyState(root, state) {
      if (!root) return;
      var descEl = root.querySelector(".practice3042-open-traces-desc");
      var creditEls = root.querySelectorAll(".practice3042-open-traces-credit, .practice3042-open-traces-year");
      if (descEl) {
        if (state && isFinite(state.descSize) && state.descSize > 0) {
          descEl.style.fontSize = state.descSize.toFixed(2) + "px";
        } else {
          descEl.style.removeProperty("font-size");
        }
      }
      Array.prototype.forEach.call(creditEls, function (el) {
        if (!el) return;
        if (state && isFinite(state.creditSize) && state.creditSize > 0) {
          el.style.fontSize = state.creditSize.toFixed(2) + "px";
        } else {
          el.style.removeProperty("font-size");
        }
      });
    }

    function fitOpenTracesTypography(root) {
      if (!root) return null;
      var descEl = root.querySelector(".practice3042-open-traces-desc");
      var creditEl = root.querySelector(".practice3042-open-traces-credit");
      if (!descEl) return null;

      applyOpenTracesTypographyState(root, null);

      var descStyle = window.getComputedStyle(descEl);
      var descSize = parseFloat(descStyle.fontSize);
      if (!isFinite(descSize) || descSize <= 0) return null;

      var creditSizeBase = creditEl
        ? parseFloat(window.getComputedStyle(creditEl).fontSize)
        : 15;
      if (!isFinite(creditSizeBase) || creditSizeBase <= 0) {
        creditSizeBase = 15;
      }

      var minDescSize = Math.max(10, Math.min(creditSizeBase * 0.82, descSize));
      var lineHeight = getPixelLineHeight(descEl);
      var lineCount = lineHeight > 0
        ? Math.max(1, Math.ceil((descEl.getBoundingClientRect().height / lineHeight) - 0.05))
        : 1;
      var guard = 0;

      while (lineCount > 2 && descSize > minDescSize && guard < 64) {
        descSize = Math.max(minDescSize, descSize - 0.5);
        descEl.style.fontSize = descSize.toFixed(2) + "px";
        lineHeight = getPixelLineHeight(descEl);
        lineCount = lineHeight > 0
          ? Math.max(1, Math.ceil((descEl.getBoundingClientRect().height / lineHeight) - 0.05))
          : 1;
        guard += 1;
      }

      var creditSize = creditSizeBase;
      if (descSize < creditSizeBase) {
        creditSize = Math.max(9, descSize);
      }

      var state = {
        descSize: descSize,
        creditSize: creditSize
      };
      applyOpenTracesTypographyState(root, state);
      return state;
    }

    function syncOpenTracesTypography() {
      var state = fitOpenTracesTypography(measureOpenTraces);
      if (!state) return;
      applyOpenTracesTypographyState(mirrorOpenTraces, state);
    }

    function normalizeSrc(src) {
      if (!src) return "";
      try {
        return new URL(src, window.location.href).toString();
      } catch (error) {
        return String(src);
      }
    }

    function rememberSlideRatio(src, width, height) {
      if (!src || !width || !height) return;
      var ratio = height / width;
      if (!isFinite(ratio) || ratio <= 0) return;
      slideRatioBySrc.set(String(src), ratio);
      slideRatioBySrc.set(normalizeSrc(src), ratio);
    }

    function rememberVideoRatio(src, width, height) {
      if (!src || !width || !height) return;
      var ratio = height / width;
      if (!isFinite(ratio) || ratio <= 0) return;
      slideVideoRatioBySrc.set(String(src), ratio);
      slideVideoRatioBySrc.set(normalizeSrc(src), ratio);
    }

    function normalizeSlideEntry(entry) {
      if (!entry) return null;
      if (typeof entry === "string") {
        return { type: "image", src: entry };
      }
      if (typeof entry === "object" && entry.src) {
        var type = entry.type === "video" ? "video" : "image";
        return { type: type, src: String(entry.src) };
      }
      return null;
    }

    function getSlideEntry(config, index) {
      if (!config || !config.slides || !config.slides.length) return null;
      var safeIndex = ((index % config.slides.length) + config.slides.length) % config.slides.length;
      return normalizeSlideEntry(config.slides[safeIndex]);
    }

    function getCurrentSlideEntry(config) {
      return getSlideEntry(config, slideshowIndex);
    }

    function stopMapCenterSlideshowProgress() {
      if (!slideshowProgressRaf) return;
      window.cancelAnimationFrame(slideshowProgressRaf);
      slideshowProgressRaf = 0;
    }

    function setMapCenterSlideshowProgress(progress) {
      if (!previewSlideshowPaginationTrack) return;
      var activeIndicator = previewSlideshowPaginationTrack.querySelector(".map-center-hover-preview-pagination-item.is-active");
      if (!activeIndicator) return;
      var clamped = Math.max(0, Math.min(1, Number(progress) || 0));
      activeIndicator.style.setProperty("--map-center-hover-preview-slide-progress", clamped.toFixed(4));
    }

    function hideMapCenterSlideshowPagination() {
      stopMapCenterSlideshowProgress();
      if (!previewSlideshowPagination) return;
      previewSlideshowPagination.hidden = true;
      previewSlideshowPagination.setAttribute("aria-hidden", "true");
      if (!previewSlideshowPaginationTrack) return;
      Array.prototype.forEach.call(previewSlideshowPaginationTrack.children, function (item) {
        item.classList.remove("is-active");
        item.style.setProperty("--map-center-hover-preview-slide-progress", "0");
      });
    }

    function syncMapCenterSlideshowPagination(config, activeIndex) {
      if (!previewSlideshowPagination || !previewSlideshowPaginationTrack) return;
      var slideCount = config && config.slides && config.slides.length ? config.slides.length : 0;
      if (activeMode !== "slideshow" || !config || slideCount < 2) {
        hideMapCenterSlideshowPagination();
        return;
      }

      while (previewSlideshowPaginationTrack.children.length > slideCount) {
        previewSlideshowPaginationTrack.removeChild(previewSlideshowPaginationTrack.lastChild);
      }
      while (previewSlideshowPaginationTrack.children.length < slideCount) {
        var indicator = document.createElement("span");
        indicator.className = "map-center-hover-preview-pagination-item";
        indicator.setAttribute("aria-hidden", "true");
        previewSlideshowPaginationTrack.appendChild(indicator);
      }

      previewSlideshowPagination.hidden = false;
      previewSlideshowPagination.setAttribute("aria-hidden", "false");

      Array.prototype.forEach.call(previewSlideshowPaginationTrack.children, function (item, index) {
        var isActive = index === activeIndex;
        item.classList.toggle("is-active", isActive);
        item.style.setProperty("--map-center-hover-preview-slide-progress", isActive ? "0" : "0");
      });
    }

    function startMapCenterTimedSlideshowProgress(config, slideIndex, durationMs) {
      stopMapCenterSlideshowProgress();
      syncMapCenterSlideshowPagination(config, slideIndex);
      var totalMs = Math.max(80, Number(durationMs) || 0);
      if (!(totalMs > 0)) return;
      var startedAt = 0;

      function tick(timestamp) {
        if (activeMode !== "slideshow" || activeConfig !== config || preview.hidden || slideshowIndex !== slideIndex) {
          slideshowProgressRaf = 0;
          return;
        }
        if (!startedAt) startedAt = timestamp;
        var progress = Math.max(0, Math.min(1, (timestamp - startedAt) / totalMs));
        setMapCenterSlideshowProgress(progress);
        if (progress >= 1) {
          slideshowProgressRaf = 0;
          return;
        }
        slideshowProgressRaf = window.requestAnimationFrame(tick);
      }

      slideshowProgressRaf = window.requestAnimationFrame(tick);
    }

    function syncMapCenterVideoSlideshowProgress() {
      if (!previewSlideshowVideo) return;
      if (activeMode !== "slideshow" || !activeConfig || preview.hidden) return;
      if (getCurrentSlideType(activeConfig) !== "video") return;
      syncMapCenterSlideshowPagination(activeConfig, slideshowIndex);
      var duration = previewSlideshowVideo.duration;
      if (!isFinite(duration) || duration <= 0) {
        setMapCenterSlideshowProgress(0);
        return;
      }
      setMapCenterSlideshowProgress(previewSlideshowVideo.currentTime / duration);
    }

    function getStoredSlideRatio(src) {
      if (!src) return null;
      var raw = slideRatioBySrc.get(String(src));
      if (raw && isFinite(raw) && raw > 0) return raw;
      var normalized = slideRatioBySrc.get(normalizeSrc(src));
      if (normalized && isFinite(normalized) && normalized > 0) return normalized;
      return null;
    }

    function getStoredVideoRatio(src) {
      if (!src) return null;
      var raw = slideVideoRatioBySrc.get(String(src));
      if (raw && isFinite(raw) && raw > 0) return raw;
      var normalized = slideVideoRatioBySrc.get(normalizeSrc(src));
      if (normalized && isFinite(normalized) && normalized > 0) return normalized;
      return null;
    }

    function getSlideRatioForEntry(entry) {
      if (!entry || !entry.src) return null;
      if (entry.type === "video") {
        return getStoredVideoRatio(entry.src);
      }
      return getStoredSlideRatio(entry.src);
    }

    function isCrossfadeConfig(config) {
      return slideshowLayers.length > 1;
    }

    function getCrossfadeDurationMs(config) {
      var raw = config && config.transition ? Number(config.transition.durationMs) : NaN;
      if (!isFinite(raw) || raw <= 0) return 160;
      return Math.max(60, raw);
    }

    function getCrossfadeEasing(config) {
      var easing = config && config.transition && config.transition.easing;
      return easing ? String(easing) : "linear";
    }

    function getActiveSlideshowImage() {
      if (!slideshowLayers.length) return null;
      return slideshowLayers[Math.max(0, Math.min(slideshowLayerIndex, slideshowLayers.length - 1))] || null;
    }

    function setLayerVisible(layer, visible) {
      if (!layer) return;
      layer.classList.toggle("is-visible", !!visible);
    }

    function setSlideshowVideoVisible(visible) {
      if (!previewSlideshowVideo) return;
      previewSlideshowVideo.classList.toggle("is-visible", !!visible);
    }

    function resetSlideshowLayers() {
      slideshowLayerIndex = 0;
      slideshowLayers.forEach(function (layer, index) {
        setLayerVisible(layer, index === 0);
      });
      setSlideshowVideoVisible(false);
    }

    function preloadSlideSource(src) {
      if (!src) return Promise.resolve();
      var normalized = normalizeSrc(src);
      if (slideshowPreloadedSrc.has(normalized) || slideshowPreloadedSrc.has(String(src))) {
        return Promise.resolve();
      }

      return new Promise(function (resolve) {
        var preload = new Image();
        preload.decoding = "async";
        preload.addEventListener("load", function () {
          rememberSlideRatio(src, preload.naturalWidth, preload.naturalHeight);
          slideshowPreloadedSrc.add(String(src));
          slideshowPreloadedSrc.add(normalized);
          resolve();
        });
        preload.addEventListener("error", function () {
          resolve();
        });
        preload.src = src;
        if (typeof preload.decode === "function") {
          preload.decode().then(resolve).catch(function () {
            resolve();
          });
        }
      });
    }

    function preloadVideoSource(src) {
      if (!src) return Promise.resolve();
      var normalized = normalizeSrc(src);
      if (slideshowPreloadedVideoSrc.has(normalized) || slideshowPreloadedVideoSrc.has(String(src))) {
        return Promise.resolve();
      }

      return new Promise(function (resolve) {
        var preloadVideo = document.createElement("video");
        preloadVideo.preload = "metadata";
        preloadVideo.muted = true;
        preloadVideo.playsInline = true;
        preloadVideo.addEventListener("loadedmetadata", function () {
          rememberVideoRatio(src, preloadVideo.videoWidth, preloadVideo.videoHeight);
          slideshowPreloadedVideoSrc.add(String(src));
          slideshowPreloadedVideoSrc.add(normalized);
          resolve();
        }, { once: true });
        preloadVideo.addEventListener("error", function () {
          resolve();
        }, { once: true });
        preloadVideo.src = src;
        preloadVideo.load();
      });
    }

    function warmSlideIndices(config, indices) {
      if (!config || !config.slides || !config.slides.length || !indices || !indices.length) return;
      indices.forEach(function (index) {
        var entry = getSlideEntry(config, index);
        if (!entry || !entry.src) return;
        if (entry.type === "video") {
          preloadVideoSource(entry.src).catch(function () {});
          return;
        }
        preloadSlideSource(entry.src).catch(function () {});
      });
    }

    function preloadConfiguredSlides() {
      Object.keys(previewConfigByNodeId).forEach(function (nodeId) {
        var config = previewConfigByNodeId[nodeId];
        if (!config || config.mode !== "slideshow" || !config.slides || !config.slides.length) return;
        warmSlideIndices(config, MAP_CENTER_STARTUP_PRELOAD_INDICES);

        var shouldFullPreload = !config.deferPreload && (
          config.startupPreload === "full" || MAP_CENTER_STARTUP_ENABLE_FULL_PRELOAD
        );
        if (!shouldFullPreload) return;

        function runFullPreload() {
          config.slides.forEach(function (entry) {
            var normalizedEntry = normalizeSlideEntry(entry);
            if (!normalizedEntry || !normalizedEntry.src) return;
            if (normalizedEntry.type === "video") {
              preloadVideoSource(normalizedEntry.src).catch(function () {});
              return;
            }
            preloadSlideSource(normalizedEntry.src).catch(function () {});
          });
        }

        if (typeof window.requestIdleCallback === "function") {
          window.requestIdleCallback(runFullPreload, { timeout: MAP_CENTER_STARTUP_FULL_PRELOAD_DELAY_MS });
        } else {
          window.setTimeout(runFullPreload, MAP_CENTER_STARTUP_FULL_PRELOAD_DELAY_MS);
        }
      });
    }

    function stopMirrorVideo() {
      if (!mirrorVideo) return;
      mirrorVideo.pause();
      mirrorVideo.currentTime = 0;
    }

    function getSlideshowIntervalMs() {
      var defaultMs = 900;
      var minMs = 120;
      var maxMs = 30000;
      var raw = window.getComputedStyle(document.documentElement).getPropertyValue("--map-center-slideshow-interval-ms");
      if (!raw) return defaultMs;
      var parsed = Number(String(raw).replace(/ms$/i, "").trim());
      if (!isFinite(parsed)) return defaultMs;
      return Math.min(maxMs, Math.max(minMs, parsed));
    }

    function getBaseSlideshowDelayMs(config) {
      var raw = config ? Number(config.baseIntervalMs) : NaN;
      if (isFinite(raw) && raw > 0) return raw;
      return getSlideshowIntervalMs();
    }

    function stopSlideshow() {
      hideMapCenterSlideshowPagination();
      if (slideshowTimerId) {
        window.clearTimeout(slideshowTimerId);
        slideshowTimerId = 0;
      }
      slideshowRunToken += 1;
      slideshowIndex = 0;
      resetSlideshowLayers();
      if (previewSlideshowImgA) {
        previewSlideshowImgA.removeAttribute("src");
      }
      if (previewSlideshowImgB) {
        previewSlideshowImgB.removeAttribute("src");
      }
      if (previewSlideshowImgLegacy) {
        previewSlideshowImgLegacy.removeAttribute("src");
      }
      if (previewSlideshowVideo) {
        try {
          if (pendingSlideshowVideoMetadataHandler) {
            previewSlideshowVideo.removeEventListener("loadedmetadata", pendingSlideshowVideoMetadataHandler);
            pendingSlideshowVideoMetadataHandler = null;
          }
          previewSlideshowVideo.pause();
          previewSlideshowVideo.onended = null;
          previewSlideshowVideo.onerror = null;
          previewSlideshowVideo.removeAttribute("src");
          previewSlideshowVideo.currentTime = 0;
          previewSlideshowVideo.load();
        } catch (error) {
          // Keep cleanup resilient; slideshow should not crash on media reset.
        }
      }
    }

    function getTransitionDelayMultiplier(config, fromIndex, toIndex) {
      if (!config || !config.transitionDelayMultiplierByStep) return 1;
      var key = String(fromIndex) + ">" + String(toIndex);
      var value = Number(config.transitionDelayMultiplierByStep[key]);
      if (!isFinite(value) || value <= 0) return 1;
      return value;
    }

    function getEdgePauseMultiplier(config, currentIndex) {
      if (!config || !config.slides || !config.slides.length) return 1;
      var raw = Number(config.edgePauseMultiplier);
      if (!isFinite(raw) || raw <= 0) return 1;
      var lastIndex = config.slides.length - 1;
      if (currentIndex === 0 || currentIndex === lastIndex) return raw;
      return 1;
    }

    function getNextSlideIndex(config, currentIndex) {
      if (!config || !config.slides || !config.slides.length) return 0;
      var loopMode = config.loopMode || "forward";
      if (loopMode !== "forward") {
        return (currentIndex + 1) % config.slides.length;
      }
      return (currentIndex + 1) % config.slides.length;
    }

    function showSlideshowVideo(src, config, runToken) {
      if (!previewSlideshowVideo || !src) return false;
      slideshowLayers.forEach(function (layer) {
        setLayerVisible(layer, false);
      });
      setSlideshowVideoVisible(true);

      var targetSrc = normalizeSrc(src);
      var assignedAttrSrc = previewSlideshowVideo.getAttribute("src") || "";
      var assignedNormalizedSrc = normalizeSrc(assignedAttrSrc);
      var hasAssignedSrc = !!assignedAttrSrc;
      previewSlideshowVideo.loop = false;
      previewSlideshowVideo.muted = true;
      previewSlideshowVideo.pause();

      // Keep handler lifecycle explicit so repeated hovers always rebind correctly.
      previewSlideshowVideo.onended = null;
      previewSlideshowVideo.onerror = null;
      if (pendingSlideshowVideoMetadataHandler) {
        previewSlideshowVideo.removeEventListener("loadedmetadata", pendingSlideshowVideoMetadataHandler);
        pendingSlideshowVideoMetadataHandler = null;
      }

      previewSlideshowVideo.onended = function () {
        if (runToken !== slideshowRunToken) return;
        if (activeMode !== "slideshow" || activeConfig !== config || preview.hidden) return;
        scheduleNextSlide(config);
      };
      previewSlideshowVideo.onerror = function () {
        if (runToken !== slideshowRunToken) return;
        if (activeMode !== "slideshow" || activeConfig !== config || preview.hidden) return;
        scheduleNextSlide(config);
      };

      if (!hasAssignedSrc || assignedNormalizedSrc !== targetSrc) {
        previewSlideshowVideo.src = src;
        previewSlideshowVideo.load();
      }

      var tryPlay = function () {
        if (runToken !== slideshowRunToken) return;
        if (activeMode !== "slideshow" || activeConfig !== config || preview.hidden) return;
        try {
          previewSlideshowVideo.currentTime = 0;
        } catch (error) {
          // Some browsers throw before metadata is ready; playback is retried below.
        }
        previewSlideshowVideo.play().catch(function () {});
      };

      if (previewSlideshowVideo.readyState >= 1) {
        tryPlay();
      } else {
        pendingSlideshowVideoMetadataHandler = function () {
          pendingSlideshowVideoMetadataHandler = null;
          tryPlay();
        };
        previewSlideshowVideo.addEventListener("loadedmetadata", pendingSlideshowVideoMetadataHandler, { once: true });
      }
      return true;
    }

    function showSlideshowImage(src, config) {
      if (!src || !slideshowLayers.length) return false;
      if (previewSlideshowVideo) {
        previewSlideshowVideo.pause();
        previewSlideshowVideo.onended = null;
        previewSlideshowVideo.onerror = null;
      }
      setSlideshowVideoVisible(false);

      var primaryLayer = slideshowLayers[0];
      if (!primaryLayer) return false;

      if (isCrossfadeConfig(config)) {
        var activeLayer = getActiveSlideshowImage() || primaryLayer;
        var incomingLayer = slideshowLayers[slideshowLayerIndex === 0 ? 1 : 0];
        if (incomingLayer && activeLayer) {
          incomingLayer.src = src;
          setLayerVisible(incomingLayer, true);
          setLayerVisible(activeLayer, false);
          slideshowLayerIndex = slideshowLayerIndex === 0 ? 1 : 0;
          return true;
        }
      }

      primaryLayer.src = src;
      setLayerVisible(primaryLayer, true);
      if (slideshowLayers[1]) {
        setLayerVisible(slideshowLayers[1], false);
      }
      slideshowLayerIndex = 0;
      return true;
    }

    function forceRenderSlideshowFirstFrame(config) {
      if (!config || !config.slides || !config.slides.length) return false;
      var entry = getSlideEntry(config, 0);
      if (!entry || !entry.src) return false;
      slideshowRunToken += 1;
      slideshowIndex = 0;

      if (entry.type === "video") {
        return showSlideshowVideo(entry.src, config, slideshowRunToken);
      }
      return showSlideshowImage(entry.src, config);
    }

    function updateSlideshowFrame(config, nextIndex, runToken) {
      if (!config || !config.slides || !config.slides.length) return;
      if (runToken !== slideshowRunToken) return;
      if (activeMode !== "slideshow" || activeConfig !== config || preview.hidden) return;

      var nextEntry = getSlideEntry(config, nextIndex);
      if (!nextEntry || !nextEntry.src) return;

      if (nextEntry.type === "video") {
        showSlideshowVideo(nextEntry.src, config, runToken);
      } else {
        if (!showSlideshowImage(nextEntry.src, config)) return;
      }

      slideshowIndex = nextIndex;
      syncMapCenterSlideshowPagination(config, slideshowIndex);
      if (activeItem && !preview.hidden) {
        syncPreviewSize(activeItem, activeMode, activeConfig);
        positionCursorPreview();
      }

      warmSlideIndices(config, [getNextSlideIndex(config, nextIndex)]);
    }

    function scheduleNextSlide(config) {
      if ((!slideshowLayers.length && !previewSlideshowVideo) || !config || !config.slides || config.slides.length < 2) return;

      var currentIndex = Math.max(0, Math.min(slideshowIndex, config.slides.length - 1));
      var nextIndex = getNextSlideIndex(config, currentIndex);
      var currentEntry = getSlideEntry(config, currentIndex);
      var nextEntry = getSlideEntry(config, nextIndex);
      if (!nextEntry || !nextEntry.src) return;
      var baseDelay = getBaseSlideshowDelayMs(config);
      var multiplier = getTransitionDelayMultiplier(config, currentIndex, nextIndex) * getEdgePauseMultiplier(config, currentIndex);
      var delay = Math.round(baseDelay * multiplier);
      var runToken = slideshowRunToken;
      var isCurrentVideo = !!(currentEntry && currentEntry.type === "video");
      var waitMs = isCurrentVideo ? 0 : Math.max(80, delay);

      if (!isCurrentVideo) {
        startMapCenterTimedSlideshowProgress(config, currentIndex, waitMs);
      } else {
        stopMapCenterSlideshowProgress();
        syncMapCenterSlideshowPagination(config, currentIndex);
        syncMapCenterVideoSlideshowProgress();
      }

      function proceedToNext() {
        if (runToken !== slideshowRunToken) return;
        if (activeMode !== "slideshow" || activeConfig !== config || preview.hidden) return;
        var preloadPromise = nextEntry.type === "video"
          ? preloadVideoSource(nextEntry.src)
          : preloadSlideSource(nextEntry.src);
        preloadPromise.finally(function () {
          updateSlideshowFrame(config, nextIndex, runToken);
          if (runToken !== slideshowRunToken) return;
          if (activeMode !== "slideshow" || activeConfig !== config || preview.hidden) return;
          if (nextEntry.type === "video") return;
          scheduleNextSlide(config);
        });
      }

      if (waitMs === 0) {
        proceedToNext();
        return;
      }

      slideshowTimerId = window.setTimeout(proceedToNext, waitMs);
    }

    function getCurrentSlideSrc(config) {
      var entry = getCurrentSlideEntry(config);
      return entry && entry.src ? entry.src : "";
    }

    function getCurrentSlideType(config) {
      var entry = getCurrentSlideEntry(config);
      return entry ? entry.type : "";
    }

    function rememberRatioFromImage(src, img) {
      if (!img || !src) return;
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        rememberSlideRatio(src, img.naturalWidth, img.naturalHeight);
      }
    }

    function rememberRatioFromVideo(src, videoEl) {
      if (!videoEl || !src) return;
      if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
        rememberVideoRatio(src, videoEl.videoWidth, videoEl.videoHeight);
      }
    }

    function applyCrossfadeVars(config) {
      if (!preview) return;
      preview.style.setProperty("--map-center-crossfade-duration", getCrossfadeDurationMs(config) + "ms");
      preview.style.setProperty("--map-center-crossfade-easing", getCrossfadeEasing(config));
    }

    function getSlideshowActiveRatio(config) {
      if (!config || !config.slides || !config.slides.length) return null;
      var src = getCurrentSlideSrc(config);
      var type = getCurrentSlideType(config);
      if (type === "video") {
        var storedVideo = getStoredVideoRatio(src);
        if (storedVideo) return storedVideo;
        if (previewSlideshowVideo && previewSlideshowVideo.videoWidth > 0 && previewSlideshowVideo.videoHeight > 0) {
          rememberVideoRatio(src, previewSlideshowVideo.videoWidth, previewSlideshowVideo.videoHeight);
          return previewSlideshowVideo.videoHeight / previewSlideshowVideo.videoWidth;
        }
        return null;
      }

      var stored = getStoredSlideRatio(src);
      if (stored) return stored;

      var activeLayer = getActiveSlideshowImage();
      if (activeLayer && activeLayer.naturalWidth > 0 && activeLayer.naturalHeight > 0) {
        rememberSlideRatio(src, activeLayer.naturalWidth, activeLayer.naturalHeight);
        return activeLayer.naturalHeight / activeLayer.naturalWidth;
      }
      return null;
    }

    function getSlideshowAnchorRatio(config) {
      if (!config || !config.slides || !config.slides.length) return null;
      var fixedPreviewRatio = Number(config.fixedPreviewRatio);
      if (isFinite(fixedPreviewRatio) && fixedPreviewRatio > 0) {
        return fixedPreviewRatio;
      }
      var firstEntry = getSlideEntry(config, 0);
      var firstRatio = getSlideRatioForEntry(firstEntry);
      if (firstRatio) return firstRatio;
      return getSlideshowActiveRatio(config);
    }

    function getSlideshowPreviewObjectFit(config) {
      var raw = config && config.previewObjectFit ? String(config.previewObjectFit).trim().toLowerCase() : "";
      if (raw === "contain" || raw === "cover") return raw;
      // Default to cover so mixed aspect-ratio slides keep consistent visible height.
      return "cover";
    }

    function startSlideshow(config) {
      if (!previewSlideshow || (!slideshowLayers.length && !previewSlideshowVideo) || !config || !config.slides || !config.slides.length) return false;
      stopSlideshow();
      slideshowRunToken += 1;
      slideshowIndex = 0;
      resetSlideshowLayers();
      var runToken = slideshowRunToken;
      var firstEntry = getSlideEntry(config, 0);
      if (!firstEntry || !firstEntry.src) return false;
      updateSlideshowFrame(config, 0, runToken);
      warmSlideIndices(config, [0, 1]);
      applyCrossfadeVars(config);
      if (config.slides.length < 2) return true;
      if (firstEntry.type === "video") return true;
      scheduleNextSlide(config);
      return true;
    }

    preloadConfiguredSlides();
    mobileDebugState.activeProfile = resolvePracticeMobileProfile(getActivePracticeMobileProfile());
    var savedPracticeMobilePositions = loadPracticeMobilePositionsFromStorage(mobileDebugState.activeProfile);
    if (savedPracticeMobilePositions) {
      applyPracticeMobilePositionsMap(savedPracticeMobilePositions);
    }
    var practiceMobileDebugRequested = readPracticeMobileDebugParam();
    var debugRequestedFromParam = practiceMobileDebugRequested !== null;
    if (practiceMobileDebugRequested === null) {
      practiceMobileDebugRequested = readStoredPracticeMobileDebugEnabled(mobileDebugState.activeProfile);
    }
    setPracticeMobileDebugEnabled(!!practiceMobileDebugRequested, { persistFlag: debugRequestedFromParam });
    syncPracticeResponsiveLayout(true);
    syncPracticeMobileProfileState(true);
    window.requestAnimationFrame(function () {
      syncPracticeResponsiveLayout(true);
      syncPracticeMobileProfileState(true);
    });
    slideshowLayers.forEach(function (layer) {
      layer.addEventListener("load", function () {
        if (activeMode !== "slideshow" || !activeConfig || !activeConfig.slides || !activeConfig.slides.length) return;
        if (getCurrentSlideType(activeConfig) === "video") return;
        var activeSrc = getCurrentSlideSrc(activeConfig);
        rememberRatioFromImage(activeSrc, layer);
        if (activeItem && !preview.hidden) {
          syncPreviewSize(activeItem, activeMode, activeConfig);
        }
      });
    });
    if (previewSlideshowVideo) {
      previewSlideshowVideo.addEventListener("loadedmetadata", function () {
        if (activeMode !== "slideshow" || !activeConfig || !activeConfig.slides || !activeConfig.slides.length) return;
        if (getCurrentSlideType(activeConfig) !== "video") return;
        var activeSrc = getCurrentSlideSrc(activeConfig);
        rememberRatioFromVideo(activeSrc, previewSlideshowVideo);
        syncMapCenterVideoSlideshowProgress();
        if (activeItem && !preview.hidden) {
          syncPreviewSize(activeItem, activeMode, activeConfig);
        }
      });
      previewSlideshowVideo.addEventListener("timeupdate", syncMapCenterVideoSlideshowProgress);
    }

    function getOpenTracesBox(mapWidth) {
      var measureWidth = Math.max(420, Math.round(mapWidth));
      measureHost.style.width = measureWidth + "px";
      syncOpenTracesTypography();

      var measureRect = measureOpenTraces.getBoundingClientRect();
      if (measureRect.width > 0 && measureRect.height > 0) {
        return {
          width: measureRect.width,
          height: measureRect.height
        };
      }

      var mirrorRect = mirrorOpenTraces.getBoundingClientRect();
      if (mirrorRect.width > 0 && mirrorRect.height > 0) {
        return {
          width: mirrorRect.width,
          height: mirrorRect.height
        };
      }

      return {
        width: measureWidth,
        height: measureWidth * 0.6
      };
    }

    function setMode(mode, config) {
      preview.classList.remove(
        "map-center-hover-preview--open-traces",
        "map-center-hover-preview--slideshow",
        "map-center-hover-preview--placeholder",
        "map-center-hover-preview--slideshow-crossfade"
      );
      preview.style.removeProperty("--map-center-slideshow-object-fit");
      if (mode !== "slideshow") {
        hideMapCenterSlideshowPagination();
      }
      if (mode === "open-traces") {
        preview.classList.add("map-center-hover-preview--open-traces");
      } else if (mode === "slideshow") {
        preview.classList.add("map-center-hover-preview--slideshow");
        preview.style.setProperty("--map-center-slideshow-object-fit", getSlideshowPreviewObjectFit(config));
        if (isCrossfadeConfig(config)) {
          preview.classList.add("map-center-hover-preview--slideshow-crossfade");
        }
      } else {
        preview.classList.add("map-center-hover-preview--placeholder");
      }
    }

    function resolveItemPreviewConfig(item) {
      var nodeId = item.getAttribute("data-node-id") || "";
      return previewConfigByNodeId[nodeId] || { mode: "placeholder" };
    }

    function getMapProjectFromHash() {
      var hash = window.location.hash || "";
      if (!hash) return null;
      var clean = hash.charAt(0) === "#" ? hash.slice(1) : hash;
      if (!clean) return null;
      var params = new URLSearchParams(clean);
      var token = params.get("map-project");
      if (!token) return null;
      var nodeId = resolveMapProjectNodeIdFromToken(token);
      return nodeId || null;
    }

    function hasFigmaCaptureHashParams() {
      var hash = window.location.hash || "";
      if (!hash) return false;
      var clean = hash.charAt(0) === "#" ? hash.slice(1) : hash;
      if (!clean) return false;
      var params = new URLSearchParams(clean);
      return params.has("figmacapture") && params.has("figmaendpoint");
    }

    function isFigmaCaptureActive() {
      return document.documentElement.classList.contains("figma-capture-active");
    }

    function shouldBypassPracticeUnavailableNotice() {
      return isFigmaCaptureActive() || hasFigmaCaptureHashParams();
    }

    function hasMapProjectHash() {
      var hash = window.location.hash || "";
      if (!hash) return false;
      var clean = hash.charAt(0) === "#" ? hash.slice(1) : hash;
      if (!clean) return false;
      return new URLSearchParams(clean).has("map-project");
    }

    function buildMapProjectHash(nodeId) {
      return "#map-project=" + encodeURIComponent(getMapProjectHashValue(nodeId));
    }

    function getPreservedMapProjectHashParams() {
      var hash = window.location.hash || "";
      var clean = hash.charAt(0) === "#" ? hash.slice(1) : hash;
      if (!clean) return "";
      var params = new URLSearchParams(clean);
      var preserved = new URLSearchParams();
      [
        "figmacapture",
        "figmaendpoint",
        "figmadelay",
        "figmaselector"
      ].forEach(function (key) {
        if (!params.has(key)) return;
        preserved.set(key, params.get(key) || "");
      });
      return preserved.toString();
    }

    function buildMapProjectHashWithPreservedParams(nodeId) {
      var base = "map-project=" + encodeURIComponent(getMapProjectHashValue(nodeId));
      var preserved = getPreservedMapProjectHashParams();
      return preserved ? ("#" + base + "&" + preserved) : ("#" + base);
    }

    function syncMapProjectHashToCanonical(nodeId) {
      if (!nodeId) return;
      var hash = window.location.hash || "";
      if (!hash) return;
      var clean = hash.charAt(0) === "#" ? hash.slice(1) : hash;
      if (!clean) return;
      var params = new URLSearchParams(clean);
      if (!params.has("map-project")) return;
      var rawToken = String(params.get("map-project") || "").trim();
      if (!rawToken) return;
      var resolvedNodeId = resolveMapProjectNodeIdFromToken(rawToken);
      if (resolvedNodeId !== nodeId) return;
      var canonicalToken = getMapProjectHashValue(nodeId);
      if (!canonicalToken || rawToken === canonicalToken) return;
      params.set("map-project", canonicalToken);
      var nextHash = "#" + params.toString();
      var nextUrl = window.location.pathname + window.location.search + nextHash;
      window.history.replaceState(window.history.state, "", nextUrl);
    }

    function clearMapProjectHash() {
      var cleanUrl = window.location.pathname + window.location.search;
      window.history.replaceState(null, "", cleanUrl);
    }

    function getDocumentScrollY() {
      return window.scrollY || window.pageYOffset || 0;
    }

    function getPracticeTopY() {
      var currentY = getDocumentScrollY();
      if (!practiceSection) return currentY;
      var practiceTop = currentY + practiceSection.getBoundingClientRect().top;
      return isFinite(practiceTop) ? practiceTop : currentY;
    }

    function syncMapProjectWindowAnchorScroll() {
      if (!document.documentElement.classList.contains("map-project-open")) return;
      if (!practiceSection) return;
      var currentY = getDocumentScrollY();
      var practiceTop = currentY + practiceSection.getBoundingClientRect().top;
      if (!isFinite(practiceTop)) return;
      var targetY = Math.max(0, practiceTop);
      if (Math.abs(targetY - currentY) > 0.5) {
        window.scrollTo(0, targetY);
      }
      if (mapDetailState) {
        mapDetailState.returnScrollY = targetY;
      }
    }

    function setPendingMapProjectEntryContext(context) {
      pendingMapProjectEntryContext = context || "";
    }

    function prepareMapProjectOpenState() {
      var currentY = getDocumentScrollY();
      var practiceTop = getPracticeTopY();
      var context = pendingMapProjectEntryContext || "";
      pendingMapProjectEntryContext = "";

      if (!context) {
        context = currentY >= (practiceTop - 12) ? "map" : "direct";
      }

      if (context === "direct" && isFinite(practiceTop)) {
        window.scrollTo(0, Math.max(0, practiceTop));
        currentY = Math.max(0, practiceTop);
      }

      mapDetailState.entryContext = context;
      mapDetailState.returnScrollY = Math.max(0, currentY);
    }

    function ensureInitialDirectMapProjectHistory(nodeId) {
      if (!nodeId || !hasMapProjectHash()) return;
      var cleanUrl = window.location.pathname + window.location.search;
      var detailHash = buildMapProjectHashWithPreservedParams(nodeId);
      window.history.replaceState({ mapProjectBase: true }, "", cleanUrl);
      window.history.pushState({ mapProjectNodeId: nodeId }, "", detailHash);
    }

    function setMapProjectShellOpen(open) {
      if (open) {
        mapProjectShell.hidden = false;
        mapProjectShell.setAttribute("aria-hidden", "false");
      } else {
        mapProjectShell.hidden = true;
        mapProjectShell.setAttribute("aria-hidden", "true");
      }
    }

    function setMapProjectNavOpen(open) {
      if (open) {
        mapProjectNav.hidden = false;
        mapProjectNav.setAttribute("aria-hidden", "false");
      } else {
        mapProjectNav.hidden = true;
        mapProjectNav.setAttribute("aria-hidden", "true");
      }
    }

    function readItemCoord(item, varName) {
      var optional = readItemCoordOptional(item, varName);
      return optional === null ? 0 : optional;
    }

    function readItemCoordWithFallback(item, varNames) {
      if (!item || !Array.isArray(varNames) || !varNames.length) return 0;
      for (var i = 0; i < varNames.length; i += 1) {
        var value = readItemCoordOptional(item, varNames[i]);
        if (value !== null) return value;
      }
      return 0;
    }

    function readItemCoordOptional(item, varName) {
      if (!item) return null;
      var raw = item.style.getPropertyValue(varName);
      if (raw !== null && raw !== undefined && String(raw).trim() !== "") {
        var parsed = Number(String(raw).trim());
        if (isFinite(parsed)) return parsed;
      }
      var inline = item.getAttribute("style") || "";
      var pattern = new RegExp(varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*:\\s*([0-9.]+)");
      var match = inline.match(pattern);
      if (!match) return null;
      var fallbackParsed = Number(match[1]);
      return isFinite(fallbackParsed) ? fallbackParsed : null;
    }

    function safeReadLocalStorage(key) {
      if (!key || !window.localStorage) return null;
      try {
        return window.localStorage.getItem(key);
      } catch (error) {
        return null;
      }
    }

    function didPageLoadFromReload() {
      if (!window.performance) return false;
      try {
        if (typeof window.performance.getEntriesByType === "function") {
          var entries = window.performance.getEntriesByType("navigation");
          if (entries && entries.length) {
            return entries[0] && entries[0].type === "reload";
          }
        }
        if (window.performance.navigation) {
          return window.performance.navigation.type === 1;
        }
      } catch (error) {
        return false;
      }
      return false;
    }

    function safeWriteLocalStorage(key, value) {
      if (!key || !window.localStorage) return false;
      try {
        window.localStorage.setItem(key, value);
        return true;
      } catch (error) {
        return false;
      }
    }

    function safeRemoveLocalStorage(key) {
      if (!key || !window.localStorage) return false;
      try {
        window.localStorage.removeItem(key);
        return true;
      } catch (error) {
        return false;
      }
    }

    function readPracticeMobileDebugParam() {
      var searchParams = new URLSearchParams(window.location.search || "");
      if (searchParams.has(PRACTICE_MOBILE_DEBUG_PARAM)) {
        var fromSearch = searchParams.get(PRACTICE_MOBILE_DEBUG_PARAM);
        return fromSearch !== "0" && fromSearch !== "false";
      }
      var hash = window.location.hash || "";
      var clean = hash.charAt(0) === "#" ? hash.slice(1) : hash;
      if (!clean) return null;
      var hashParams = new URLSearchParams(clean);
      if (!hashParams.has(PRACTICE_MOBILE_DEBUG_PARAM)) return null;
      var fromHash = hashParams.get(PRACTICE_MOBILE_DEBUG_PARAM);
      return fromHash !== "0" && fromHash !== "false";
    }

    function isPracticeMobileViewport() {
      return window.innerWidth < PRACTICE_MAP_BREAKPOINT;
    }

    function isPracticeCoarsePointer() {
      if (touchLensPointerMql) return !!touchLensPointerMql.matches;
      return !supportsFineHover;
    }

    function getActivePracticeMobileProfile() {
      if (!isPracticeMobileViewport()) return "";
      return isPracticeCoarsePointer()
        ? PRACTICE_MOBILE_PROFILE_TOUCH
        : PRACTICE_MOBILE_PROFILE_HOVER;
    }

    function resolvePracticeMobileProfile(profile) {
      var normalized = String(profile || "").trim().toLowerCase();
      if (normalized === PRACTICE_MOBILE_PROFILE_TOUCH || normalized === PRACTICE_MOBILE_PROFILE_HOVER) {
        return normalized;
      }
      var active = getActivePracticeMobileProfile();
      if (active) return active;
      if (mobileDebugState.activeProfile) return mobileDebugState.activeProfile;
      return PRACTICE_MOBILE_PROFILE_TOUCH;
    }

    function getPracticeMobilePositionsStorageKey(profile) {
      return PRACTICE_MOBILE_POS_STORAGE_KEY + "." + resolvePracticeMobileProfile(profile);
    }

    function getPracticeMobileDebugStorageKey(profile) {
      return PRACTICE_MOBILE_DEBUG_STORAGE_KEY + "." + resolvePracticeMobileProfile(profile);
    }

    function getPracticeMobileProfileLabel(profile) {
      return resolvePracticeMobileProfile(profile) === PRACTICE_MOBILE_PROFILE_TOUCH
        ? "touch-mobile"
        : "hover-mobile";
    }

    function readStoredPracticeMobileDebugEnabled(profile) {
      var key = getPracticeMobileDebugStorageKey(profile);
      var raw = safeReadLocalStorage(key);
      if (raw === null) {
        raw = safeReadLocalStorage(PRACTICE_MOBILE_DEBUG_STORAGE_KEY);
      }
      return raw === "1" || raw === "true";
    }

    function isPracticeMobileDebugActive() {
      return !!mobileDebugState.enabled && isPracticeMobileViewport();
    }

    function clampPracticeMobileCol(value) {
      return Math.max(PRACTICE_MOBILE_COL_MIN, Math.min(PRACTICE_MOBILE_COL_MAX, value));
    }

    function clampPracticeMobileRow(value) {
      return Math.max(PRACTICE_MOBILE_ROW_MIN, Math.min(PRACTICE_MOBILE_ROW_MAX, value));
    }

    function getPracticeMobilePositionForItem(item) {
      var col = Math.round(readItemCoordWithFallback(item, ["--col-mobile", "--col-desktop", "--col"]));
      var row = Math.round(readItemCoordWithFallback(item, ["--row-mobile", "--row-desktop", "--row"]));
      return {
        col: clampPracticeMobileCol(col),
        row: clampPracticeMobileRow(row)
      };
    }

    function setPracticeMobilePosition(item, col, row) {
      if (!item) return null;
      var nodeId = item.getAttribute("data-node-id") || "";
      if (!nodeId) return null;
      var nextCol = clampPracticeMobileCol(Math.round(col));
      var nextRow = clampPracticeMobileRow(Math.round(row));
      item.style.setProperty("--col-mobile", String(nextCol));
      item.style.setProperty("--row-mobile", String(nextRow));
      for (var i = 0; i < practiceGridEntries.length; i += 1) {
        if (practiceGridEntries[i].nodeId !== nodeId) continue;
        practiceGridEntries[i].baseMobileCol = nextCol;
        practiceGridEntries[i].baseMobileRow = nextRow;
        break;
      }
      mobileDebugState.userByNodeId[nodeId] = { col: nextCol, row: nextRow };
      syncPracticeMobileDebugItemLabel(item);
      recomputePracticePriorityAnchors();
      return { col: nextCol, row: nextRow };
    }

    function syncPracticeMobileDebugItemLabel(item) {
      if (!item) return;
      var nodeId = item.getAttribute("data-node-id") || "";
      if (!nodeId) return;
      if (!isPracticeMobileDebugActive()) {
        item.removeAttribute("data-mobile-debug-label");
        return;
      }
      var coords = getPracticeMobilePositionForItem(item);
      var labelName = projectNameByNodeId[nodeId] || getNodeTitle(nodeId) || nodeId;
      item.setAttribute("data-mobile-debug-label", labelName + " c" + coords.col + ",r" + coords.row);
    }

    function syncPracticeMobileDebugLabels() {
      items.forEach(function (item) {
        syncPracticeMobileDebugItemLabel(item);
      });
    }

    function getPracticeMobileGridMetrics() {
      if (!mapWrap || !mapViewport) return null;
      var viewportRect = mapViewport.getBoundingClientRect();
      if (!(viewportRect.width > 0) || !(viewportRect.height > 0)) return null;
      var cssCellRaw = window.getComputedStyle(mapWrap).getPropertyValue("--practice-grid-cell");
      var cssCell = parseFloat(cssCellRaw);
      var gridCell = isFinite(cssCell) && cssCell > 0 ? cssCell : 0;
      if (!(gridCell > 0)) {
        var probeBlock = mapWrap.querySelector(".mypractice-map-block");
        var probeRect = probeBlock ? probeBlock.getBoundingClientRect() : null;
        gridCell = probeRect && probeRect.width > 0 ? probeRect.width : 0;
      }
      if (!(gridCell > 0)) return null;

      var computed = window.getComputedStyle(mapWrap);
      var startCol = parseFloat(computed.getPropertyValue("--practice-view-start-col"));
      var startRow = parseFloat(computed.getPropertyValue("--practice-view-start-row"));
      if (!isFinite(startCol)) startCol = 1;
      if (!isFinite(startRow)) startRow = 1;
      return {
        viewportRect: viewportRect,
        gridCell: gridCell,
        startCol: startCol,
        startRow: startRow
      };
    }

    function resolvePracticeMobileGridPositionFromPointer(clientX, clientY, offsetX, offsetY) {
      var metrics = getPracticeMobileGridMetrics();
      if (!metrics) return null;
      var localLeft = clientX - metrics.viewportRect.left - offsetX;
      var localTop = clientY - metrics.viewportRect.top - offsetY;
      var rawCol = Math.round((localLeft / metrics.gridCell) + metrics.startCol);
      var rawRow = Math.round((localTop / metrics.gridCell) + metrics.startRow);
      return {
        col: clampPracticeMobileCol(rawCol),
        row: clampPracticeMobileRow(rawRow)
      };
    }

    function collectPracticeMobilePositions() {
      var positions = {};
      items.forEach(function (item) {
        var nodeId = item.getAttribute("data-node-id") || "";
        if (!nodeId) return;
        positions[nodeId] = getPracticeMobilePositionForItem(item);
      });
      return positions;
    }

    function persistPracticeMobilePositions(profile) {
      var resolvedProfile = resolvePracticeMobileProfile(profile);
      var payload = {
        version: 1,
        updatedAt: Date.now(),
        positions: collectPracticeMobilePositions()
      };
      var ok = safeWriteLocalStorage(getPracticeMobilePositionsStorageKey(resolvedProfile), JSON.stringify(payload));
      if (ok) {
        updatePracticeMobileDebugStatus("Saved (" + getPracticeMobileProfileLabel(resolvedProfile) + ")");
      } else {
        updatePracticeMobileDebugStatus("Save failed");
      }
      return ok;
    }

    function loadPracticeMobilePositionsFromStorage(profile) {
      var resolvedProfile = resolvePracticeMobileProfile(profile);
      var keys = [getPracticeMobilePositionsStorageKey(resolvedProfile), PRACTICE_MOBILE_POS_STORAGE_KEY];

      for (var i = 0; i < keys.length; i += 1) {
        var raw = safeReadLocalStorage(keys[i]);
        if (!raw) continue;
        try {
          var parsed = JSON.parse(raw);
          var map = parsed && parsed.positions ? parsed.positions : parsed;
          if (!map || typeof map !== "object") continue;
          return map;
        } catch (error) {}
      }
      return null;
    }

    function applyPracticeMobilePositionsMap(positionsMap) {
      if (!positionsMap || typeof positionsMap !== "object") return 0;
      var applied = 0;
      items.forEach(function (item) {
        var nodeId = item.getAttribute("data-node-id") || "";
        if (!nodeId) return;
        var entry = positionsMap[nodeId];
        if (!entry || typeof entry !== "object") return;
        if (!isFinite(Number(entry.col)) || !isFinite(Number(entry.row))) return;
        if (setPracticeMobilePosition(item, Number(entry.col), Number(entry.row))) {
          applied += 1;
        }
      });
      return applied;
    }

    function restorePracticeMobileBasePositions() {
      var applied = 0;
      items.forEach(function (item) {
        var nodeId = item.getAttribute("data-node-id") || "";
        if (!nodeId) return;
        var base = mobileDebugState.baseByNodeId[nodeId];
        if (!base) return;
        if (setPracticeMobilePosition(item, base.col, base.row)) {
          applied += 1;
        }
      });
      return applied;
    }

    function syncPracticeMobileProfileState(force) {
      var profile = getActivePracticeMobileProfile();
      if (!profile) {
        mobileDebugState.activeProfile = "";
        return;
      }
      if (!force && mobileDebugState.activeProfile === profile) return;
      if (mobileDebugState.drag.active) return;

      var savedPositions = loadPracticeMobilePositionsFromStorage(profile);
      if (savedPositions) {
        applyPracticeMobilePositionsMap(savedPositions);
      } else {
        restorePracticeMobileBasePositions();
      }
      mobileDebugState.activeProfile = profile;
      syncPracticeResponsiveLayout(true);
      syncPracticeMobileDebugLabels();

      var debugFromParam = readPracticeMobileDebugParam();
      if (debugFromParam === null) {
        setPracticeMobileDebugEnabled(readStoredPracticeMobileDebugEnabled(profile), {
          persistFlag: false,
          status: "Profile: " + getPracticeMobileProfileLabel(profile)
        });
      }
    }

    function buildPracticeMobilePositionsExportText() {
      var lines = [];
      lines.push("/* Practice mobile positions: " + getPracticeMobileProfileLabel(mobileDebugState.activeProfile) + " */");
      items.forEach(function (item) {
        var nodeId = item.getAttribute("data-node-id") || "";
        if (!nodeId) return;
        var coords = getPracticeMobilePositionForItem(item);
        var name = projectNameByNodeId[nodeId] || getNodeTitle(nodeId) || nodeId;
        lines.push(nodeId + " (" + name + "): --col-mobile: " + coords.col + "; --row-mobile: " + coords.row + ";");
      });
      return lines.join("\n");
    }

    function copyTextToClipboard(text) {
      if (!text) return Promise.resolve(false);
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        return navigator.clipboard.writeText(text).then(function () {
          return true;
        }).catch(function () {
          return false;
        });
      }
      return new Promise(function (resolve) {
        var textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "readonly");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        var ok = false;
        try {
          ok = document.execCommand("copy");
        } catch (error) {
          ok = false;
        }
        document.body.removeChild(textarea);
        resolve(!!ok);
      });
    }

    function updatePracticeMobileDebugStatus(text) {
      if (!mobileDebugState.statusEl) return;
      mobileDebugState.statusEl.textContent = text || "";
    }

    function ensurePracticeMobileDebugPanel() {
      if (mobileDebugState.panelEl || !mapWrap) return;
      var panel = document.createElement("section");
      panel.className = "practice-mobile-debug-panel";
      panel.hidden = true;
      panel.setAttribute("aria-hidden", "true");
      panel.innerHTML =
        '<div class="practice-mobile-debug-title">Mobile Debug</div>' +
        '<div class="practice-mobile-debug-actions">' +
          '<button type="button" data-action="save">Save</button>' +
          '<button type="button" data-action="copy">Copy</button>' +
          '<button type="button" data-action="reset">Reset</button>' +
          '<button type="button" data-action="clear">Clear</button>' +
          '<button type="button" data-action="close">Close</button>' +
        "</div>" +
        '<p class="practice-mobile-debug-status"></p>';
      mapWrap.appendChild(panel);
      mobileDebugState.panelEl = panel;
      mobileDebugState.statusEl = panel.querySelector(".practice-mobile-debug-status");

      panel.addEventListener("click", function (event) {
        var actionBtn = event.target && event.target.closest
          ? event.target.closest("button[data-action]")
          : null;
        if (!actionBtn) return;
        var action = actionBtn.getAttribute("data-action");
        if (!action) return;

        if (action === "save") {
          persistPracticeMobilePositions();
          return;
        }
        if (action === "copy") {
          copyTextToClipboard(buildPracticeMobilePositionsExportText()).then(function (ok) {
            updatePracticeMobileDebugStatus(ok ? "Copied" : "Copy failed");
          });
          return;
        }
        if (action === "reset") {
          restorePracticeMobileBasePositions();
          persistPracticeMobilePositions();
          syncPracticeMobileDebugLabels();
          syncMapCenterNavState();
          syncTouchLensState();
          updatePracticeMobileDebugStatus("Reset to base");
          return;
        }
        if (action === "clear") {
          safeRemoveLocalStorage(getPracticeMobilePositionsStorageKey(mobileDebugState.activeProfile));
          restorePracticeMobileBasePositions();
          syncPracticeMobileDebugLabels();
          syncMapCenterNavState();
          syncTouchLensState();
          updatePracticeMobileDebugStatus("Cleared (" + getPracticeMobileProfileLabel(mobileDebugState.activeProfile) + ")");
          return;
        }
        if (action === "close") {
          setPracticeMobileDebugEnabled(false, { persistFlag: true, status: "Debug off" });
        }
      });
    }

    function syncPracticeMobileDebugPanelVisibility() {
      if (!mobileDebugState.panelEl) return;
      var active = isPracticeMobileDebugActive();
      mobileDebugState.panelEl.hidden = !active;
      mobileDebugState.panelEl.setAttribute("aria-hidden", active ? "false" : "true");
    }

    function setPracticeMobileDebugEnabled(enabled, options) {
      var opts = options || {};
      mobileDebugState.enabled = !!enabled;
      if (!mobileDebugState.enabled) {
        if (mobileDebugState.drag.item) {
          mobileDebugState.drag.item.classList.remove("is-mobile-debug-dragging");
        }
        mobileDebugState.drag.active = false;
        mobileDebugState.drag.pointerId = -1;
        mobileDebugState.drag.item = null;
        window.removeEventListener("mousemove", onPracticeMobileDebugMouseMove, true);
        window.removeEventListener("mouseup", onPracticeMobileDebugMouseUp, true);
      }
      if (opts.persistFlag) {
        safeWriteLocalStorage(
          getPracticeMobileDebugStorageKey(mobileDebugState.activeProfile),
          mobileDebugState.enabled ? "1" : "0"
        );
      }
      if (document.documentElement) {
        document.documentElement.classList.toggle("practice-mobile-debug", isPracticeMobileDebugActive());
      }
      if (mapWrap) {
        mapWrap.classList.toggle("practice-mobile-debug", isPracticeMobileDebugActive());
      }
      ensurePracticeMobileDebugPanel();
      syncPracticeMobileDebugPanelVisibility();
      syncPracticeMobileDebugLabels();
      syncMapCenterNavState();
      syncTouchLensState();
      if (mobileDebugState.enabled) {
        updatePracticeMobileDebugStatus(opts.status || "Drag blocks, then Save");
      } else if (opts.status) {
        updatePracticeMobileDebugStatus(opts.status);
      }
    }

    function syncPracticeMobileDebugMode() {
      syncPracticeMobileProfileState(false);
      if (document.documentElement) {
        document.documentElement.classList.toggle("practice-mobile-debug", isPracticeMobileDebugActive());
      }
      if (mapWrap) {
        mapWrap.classList.toggle("practice-mobile-debug", isPracticeMobileDebugActive());
      }
      syncPracticeMobileDebugPanelVisibility();
      syncPracticeMobileDebugLabels();
      syncMapCenterNavState();
      syncTouchLensState();
    }

    function beginPracticeMobileDebugDrag(item, event) {
      if (!item || !event) return false;
      if (mobileDebugState.drag.active) return false;
      if (!isPracticeMobileDebugActive()) return false;
      if (!mapViewport) return false;
      if (document.documentElement.classList.contains("project-inline-open")) return false;
      if (document.documentElement.classList.contains("map-project-open")) return false;
      if (event.button !== undefined && event.button !== 0) return false;

      var itemRect = item.getBoundingClientRect();
      mobileDebugState.drag.active = true;
      mobileDebugState.drag.pointerId = event.pointerId;
      mobileDebugState.drag.item = item;
      mobileDebugState.drag.offsetX = event.clientX - itemRect.left;
      mobileDebugState.drag.offsetY = event.clientY - itemRect.top;
      mobileDebugState.drag.moved = false;
      mobileDebugState.justDragged = false;
      item.classList.add("is-mobile-debug-dragging");
      if (typeof item.setPointerCapture === "function") {
        try {
          item.setPointerCapture(event.pointerId);
        } catch (error) {}
      }
      event.preventDefault();
      event.stopPropagation();
      return true;
    }

    function updatePracticeMobileDebugDrag(event) {
      if (!mobileDebugState.drag.active) return;
      if (event.pointerId !== mobileDebugState.drag.pointerId) return;
      var item = mobileDebugState.drag.item;
      if (!item) return;
      var nextPos = resolvePracticeMobileGridPositionFromPointer(
        event.clientX,
        event.clientY,
        mobileDebugState.drag.offsetX,
        mobileDebugState.drag.offsetY
      );
      if (!nextPos) return;
      var current = getPracticeMobilePositionForItem(item);
      if (current.col !== nextPos.col || current.row !== nextPos.row) {
        setPracticeMobilePosition(item, nextPos.col, nextPos.row);
        mobileDebugState.drag.moved = true;
        mobileDebugState.justDragged = true;
      }
      event.preventDefault();
      event.stopPropagation();
    }

    function finishPracticeMobileDebugDrag(event) {
      if (!mobileDebugState.drag.active) return;
      if (event.pointerId !== mobileDebugState.drag.pointerId) return;
      var item = mobileDebugState.drag.item;
      if (item) {
        item.classList.remove("is-mobile-debug-dragging");
      }
      mobileDebugState.drag.active = false;
      mobileDebugState.drag.pointerId = -1;
      mobileDebugState.drag.item = null;
      if (mobileDebugState.drag.moved) {
        persistPracticeMobilePositions();
      }
      window.setTimeout(function () {
        mobileDebugState.justDragged = false;
      }, 0);
      event.preventDefault();
      event.stopPropagation();
    }

    function toPracticeMobileMouseLikeEvent(mouseEvent) {
      return {
        pointerId: PRACTICE_MOBILE_DEBUG_MOUSE_POINTER_ID,
        clientX: mouseEvent.clientX,
        clientY: mouseEvent.clientY,
        button: mouseEvent.button,
        preventDefault: function () {
          if (typeof mouseEvent.preventDefault === "function") mouseEvent.preventDefault();
        },
        stopPropagation: function () {
          if (typeof mouseEvent.stopPropagation === "function") mouseEvent.stopPropagation();
        }
      };
    }

    function onPracticeMobileDebugMouseMove(mouseEvent) {
      if (!mobileDebugState.drag.active) return;
      if (mobileDebugState.drag.pointerId !== PRACTICE_MOBILE_DEBUG_MOUSE_POINTER_ID) return;
      updatePracticeMobileDebugDrag(toPracticeMobileMouseLikeEvent(mouseEvent));
    }

    function onPracticeMobileDebugMouseUp(mouseEvent) {
      if (!mobileDebugState.drag.active) return;
      if (mobileDebugState.drag.pointerId !== PRACTICE_MOBILE_DEBUG_MOUSE_POINTER_ID) return;
      finishPracticeMobileDebugDrag(toPracticeMobileMouseLikeEvent(mouseEvent));
      window.removeEventListener("mousemove", onPracticeMobileDebugMouseMove, true);
      window.removeEventListener("mouseup", onPracticeMobileDebugMouseUp, true);
    }

    function clearPracticeResponsiveLayoutVars() {
      mapWrap.style.removeProperty("--practice-grid-cell");
      mapWrap.style.removeProperty("--practice-view-cols");
      mapWrap.style.removeProperty("--practice-view-rows");
      mapWrap.style.removeProperty("--practice-view-start-col");
      mapWrap.style.removeProperty("--practice-view-start-row");
      practiceGridEntries.forEach(function (entry) {
        entry.item.style.removeProperty("--scaled-col");
        entry.item.style.removeProperty("--scaled-row");
        entry.item.style.removeProperty("--scaled-col-mobile");
        entry.item.style.removeProperty("--scaled-row-mobile");
        entry.scaledCol = NaN;
        entry.scaledRow = NaN;
      });
    }

    function syncPracticeResponsiveLayout(force) {
      if (!mapViewport || !practiceGridEntries.length) return;

      var desktopActive = window.innerWidth >= PRACTICE_MAP_BREAKPOINT;
      if (!desktopActive) {
        if (practiceResponsiveState.desktopActive) {
          clearPracticeResponsiveLayoutVars();
        }
        practiceResponsiveState.desktopActive = false;
        practiceResponsiveState.viewCols = -1;
        practiceResponsiveState.viewRows = -1;
        practiceResponsiveState.scaleX = 1;
        practiceResponsiveState.scaleY = 1;
        var viewportRectMobile = mapViewport.getBoundingClientRect();
        var viewportMobileH = viewportRectMobile.height;
        var viewportMobileW = viewportRectMobile.width;
        if (!(viewportMobileW > 0) || !(viewportMobileH > 0)) return;

        var computed = window.getComputedStyle(mapWrap);
        var mobileCellRaw = computed.getPropertyValue("--practice-grid-cell");
        var mobileCell = parseFloat(mobileCellRaw);
        if (!(isFinite(mobileCell) && mobileCell > 0)) {
          var probeBlock = mapWrap.querySelector(".mypractice-map-block");
          var probeRect = probeBlock ? probeBlock.getBoundingClientRect() : null;
          mobileCell = probeRect && probeRect.width > 0 ? probeRect.width : PRACTICE_GRID_CELL;
        }
        if (!(mobileCell > 0)) return;
        if (!(practiceResponsiveState.mobileBaseGridCell > 0)) {
          practiceResponsiveState.mobileBaseGridCell = mobileCell;
        }

        var minBaseCol = Infinity;
        var maxBaseEndCol = -Infinity;
        var minBaseRow = Infinity;
        var maxBaseEndRow = -Infinity;
        practiceGridEntries.forEach(function (entry) {
          var baseCol = entry.baseMobileCol;
          var baseRow = entry.baseMobileRow;
          var baseWSpan = Math.max(1, readItemCoordWithFallback(entry.item, ["--w-span"]));
          var baseSpan = Math.max(1, readItemCoordWithFallback(entry.item, ["--h-span"]));
          minBaseCol = Math.min(minBaseCol, baseCol);
          maxBaseEndCol = Math.max(maxBaseEndCol, baseCol + baseWSpan - 1);
          minBaseRow = Math.min(minBaseRow, baseRow);
          maxBaseEndRow = Math.max(maxBaseEndRow, baseRow + baseSpan - 1);
        });
        if (!(isFinite(minBaseCol) && isFinite(maxBaseEndCol) && isFinite(minBaseRow) && isFinite(maxBaseEndRow))) return;

        var baseContentCols = Math.max(1, maxBaseEndCol - minBaseCol + 1);
        var baseContentRows = Math.max(1, maxBaseEndRow - minBaseRow + 1);
        var fitCellByWidth = viewportMobileW / baseContentCols;
        var fitCellByHeight = viewportMobileH / baseContentRows;
        var baseCell = practiceResponsiveState.mobileBaseGridCell > 0
          ? practiceResponsiveState.mobileBaseGridCell
          : mobileCell;
        var fittedCell = Math.min(baseCell, fitCellByWidth, fitCellByHeight);
        if (isFinite(fittedCell) && fittedCell > 0) {
          mobileCell = fittedCell;
        }
        mapWrap.style.setProperty("--practice-grid-cell", mobileCell.toFixed(3) + "px");

        var mobileViewCols = Math.max(1, Math.floor(viewportMobileW / mobileCell));
        var mobileViewRows = Math.max(1, Math.floor(viewportMobileH / mobileCell));

        practiceGridEntries.forEach(function (entry) {
          entry.item.style.removeProperty("--scaled-col-mobile");
          entry.item.style.removeProperty("--scaled-row-mobile");
        });

        var contentWidthPx = baseContentCols * mobileCell;
        var contentHeightPx = baseContentRows * mobileCell;
        var paddingXPx = Math.max(0, (viewportMobileW - contentWidthPx) * 0.5);
        var paddingYPx = Math.max(0, (viewportMobileH - contentHeightPx) * 0.5);
        var mobileStartCol = minBaseCol - (paddingXPx / mobileCell);
        var mobileStartRow = minBaseRow - (paddingYPx / mobileCell);
        mapWrap.style.setProperty("--practice-view-cols", String(mobileViewCols));
        mapWrap.style.setProperty("--practice-view-rows", String(mobileViewRows));
        mapWrap.style.setProperty("--practice-view-start-col", mobileStartCol.toFixed(4));
        mapWrap.style.setProperty("--practice-view-start-row", mobileStartRow.toFixed(4));
        practiceResponsiveState.mobileCenterRow = Math.round((minBaseRow + maxBaseEndRow) * 0.5);
        recomputePracticePriorityAnchors();

        practiceResponsiveState.mobileActive = true;
        return;
      }
      if (practiceResponsiveState.mobileActive) {
        practiceGridEntries.forEach(function (entry) {
          entry.item.style.removeProperty("--scaled-col-mobile");
          entry.item.style.removeProperty("--scaled-row-mobile");
        });
      }
      practiceResponsiveState.mobileActive = false;

      var viewportRect = mapViewport.getBoundingClientRect();
      var viewportW = viewportRect.width;
      var viewportH = viewportRect.height;
      if (!(viewportW > 0) || !(viewportH > 0)) return;

      var viewCols = Math.max(PRACTICE_MIN_VIEW_COLS, Math.floor(viewportW / PRACTICE_LAYOUT_CELL));
      var viewRows = Math.max(PRACTICE_MIN_VIEW_ROWS, Math.floor(viewportH / PRACTICE_LAYOUT_CELL));
      var scaleX = viewCols / PRACTICE_BASE_VIEW_COLS;
      var scaleY = viewRows / PRACTICE_BASE_VIEW_ROWS;
      var startCol = Math.round(PRACTICE_CENTER_COL - (viewCols / 2));
      var startRow = Math.round(PRACTICE_CENTER_ROW - (viewRows / 2));

      var shouldSyncLayoutVars = !!force ||
        !practiceResponsiveState.desktopActive ||
        practiceResponsiveState.viewCols !== viewCols ||
        practiceResponsiveState.viewRows !== viewRows ||
        practiceResponsiveState.startCol !== startCol ||
        practiceResponsiveState.startRow !== startRow;

      if (shouldSyncLayoutVars) {
        mapWrap.style.setProperty("--practice-grid-cell", PRACTICE_GRID_CELL.toFixed(3) + "px");
        mapWrap.style.setProperty("--practice-view-cols", String(viewCols));
        mapWrap.style.setProperty("--practice-view-rows", String(viewRows));
        mapWrap.style.setProperty("--practice-view-start-col", String(startCol));
        mapWrap.style.setProperty("--practice-view-start-row", String(startRow));
      }

      practiceGridEntries.forEach(function (entry) {
        var scaledCol = PRACTICE_CENTER_COL + Math.round((entry.baseCol - PRACTICE_CENTER_COL) * scaleX);
        var scaledRow = PRACTICE_CENTER_ROW + Math.round((entry.baseRow - PRACTICE_CENTER_ROW) * scaleY);
        if (!force && entry.scaledCol === scaledCol && entry.scaledRow === scaledRow) return;
        entry.scaledCol = scaledCol;
        entry.scaledRow = scaledRow;
        entry.item.style.setProperty("--scaled-col", String(scaledCol));
        entry.item.style.setProperty("--scaled-row", String(scaledRow));
      });

      practiceResponsiveState.desktopActive = true;
      practiceResponsiveState.viewCols = viewCols;
      practiceResponsiveState.viewRows = viewRows;
      practiceResponsiveState.startCol = startCol;
      practiceResponsiveState.startRow = startRow;
      practiceResponsiveState.scaleX = scaleX;
      practiceResponsiveState.scaleY = scaleY;
      recomputePracticePriorityAnchors();
    }

    function getOrderedMapNodeIdsByX() {
      return items
        .map(function (item) {
          return {
            nodeId: item.getAttribute("data-node-id") || "",
            x: readItemCoord(item, "--x"),
            y: readItemCoord(item, "--y")
          };
        })
        .filter(function (entry) {
          return !!entry.nodeId && !!detailByNodeId[entry.nodeId];
        })
        .sort(function (a, b) {
          if (a.x !== b.x) return a.x - b.x;
          if (a.y !== b.y) return a.y - b.y;
          if (a.nodeId < b.nodeId) return -1;
          if (a.nodeId > b.nodeId) return 1;
          return 0;
        })
        .map(function (entry) {
          return entry.nodeId;
        });
    }

    function getNodeTitle(nodeId) {
      var detail = detailByNodeId[nodeId];
      if (detail && detail.title) return detail.title;
      return projectNameByNodeId[nodeId] || "project";
    }

    function syncActiveNavIndex() {
      var list = mapDetailNavState.orderedNodeIds;
      if (!list.length || !mapDetailState.activeNodeId) {
        mapDetailNavState.activeIndex = -1;
        return;
      }
      mapDetailNavState.activeIndex = list.indexOf(mapDetailState.activeNodeId);
    }

    function getNextNodeId(offset) {
      var list = mapDetailNavState.orderedNodeIds;
      if (!list.length) return "";
      var baseIndex = mapDetailNavState.activeIndex;
      if (baseIndex < 0) {
        baseIndex = mapDetailState.activeNodeId ? list.indexOf(mapDetailState.activeNodeId) : 0;
      }
      if (baseIndex < 0) baseIndex = 0;
      var nextIndex = (baseIndex + offset) % list.length;
      if (nextIndex < 0) nextIndex += list.length;
      return list[nextIndex] || "";
    }

    function syncMapProjectNavAvailability() {
      var hasItems = mapDetailNavState.orderedNodeIds.length > 1;
      mapProjectPrevBtn.disabled = !hasItems;
      mapProjectNextBtn.disabled = !hasItems;
      if (!hasItems || !mapDetailState.activeNodeId) {
        mapProjectPrevBtn.setAttribute("aria-label", "Previous project");
        mapProjectNextBtn.setAttribute("aria-label", "Next project");
        mapProjectPrevLabel.textContent = "";
        mapProjectNextLabel.textContent = "";
        return;
      }
      var prevTitle = getNodeTitle(getNextNodeId(-1));
      var nextTitle = getNodeTitle(getNextNodeId(1));
      mapProjectPrevBtn.setAttribute("aria-label", "Previous project: " + prevTitle);
      mapProjectNextBtn.setAttribute("aria-label", "Next project: " + nextTitle);
      mapProjectPrevLabel.textContent = prevTitle;
      mapProjectNextLabel.textContent = nextTitle;
    }

    function lockPageScrollForMapDetail() {
      var root = document.documentElement;
      if (mapDetailState.scrollLocked) return;
      root.classList.add("map-project-open-scroll-locked");
      mapDetailState.scrollLocked = true;
    }

    function unlockPageScrollForMapDetail() {
      var root = document.documentElement;
      var restoreY = mapDetailState.returnScrollY || 0;
      if (mapDetailState.scrollLocked) {
        root.classList.remove("map-project-open-scroll-locked");
        mapDetailState.scrollLocked = false;
      }
      window.requestAnimationFrame(function () {
        window.scrollTo(0, restoreY);
      });
      mapDetailState.entryContext = "";
    }

    function dismissMapProjectDetail() {
      if (hasMapProjectHash()) {
        clearMapProjectHash();
      }
      closeMapProject();
    }

    function clearMapProjectWheelGestureTimer() {
      var wheel = mapDetailNavState.wheelGesture;
      if (!wheel.settleTimerId) return;
      window.clearTimeout(wheel.settleTimerId);
      wheel.settleTimerId = 0;
    }

    function resetMapProjectWheelGesture() {
      clearMapProjectWheelGestureTimer();
      mapDetailNavState.wheelGesture.active = false;
      mapDetailNavState.wheelGesture.deltaX = 0;
      mapDetailNavState.wheelGesture.committed = false;
    }

    function scheduleMapProjectWheelGestureReset(delay) {
      var wheel = mapDetailNavState.wheelGesture;
      clearMapProjectWheelGestureTimer();
      wheel.settleTimerId = window.setTimeout(function () {
        wheel.active = false;
        wheel.deltaX = 0;
        wheel.committed = false;
        wheel.settleTimerId = 0;
      }, delay);
    }

    function setMapProjectContentTranslate(px, animated) {
      if (!mapProjectContent) return;
      if (animated) {
        mapProjectContent.style.transition = "transform 170ms ease";
      } else {
        mapProjectContent.style.transition = "none";
      }
      mapProjectContent.style.transform = "translate3d(" + Math.round(px) + "px, 0, 0)";
    }

    function settleMapProjectContentToOrigin() {
      setMapProjectContentTranslate(0, true);
      window.setTimeout(function () {
        if (mapDetailNavState.wheelGesture.active) return;
        mapProjectContent.style.transition = "";
        mapProjectContent.style.transform = "";
      }, 190);
    }

    function playPendingMapProjectEntryAnimation() {
      var shift = Number(mapDetailNavState.pendingEntryShift);
      if (!isFinite(shift) || shift === 0) {
        mapDetailNavState.pendingEntryShift = 0;
        return;
      }
      mapDetailNavState.pendingEntryShift = 0;
      setMapProjectContentTranslate(shift, false);
      window.requestAnimationFrame(function () {
        setMapProjectContentTranslate(0, true);
        window.setTimeout(function () {
          if (mapDetailNavState.wheelGesture.active) return;
          mapProjectContent.style.transition = "";
          mapProjectContent.style.transform = "";
        }, 190);
      });
    }

    function clearMapProjectHorizontalDrag() {
      var drag = mapDetailNavState.drag;
      drag.active = false;
      drag.pointerId = -1;
      drag.startX = 0;
      drag.currentDeltaX = 0;
      mapProjectContent.classList.remove("is-dragging-horizontal");
      settleMapProjectContentToOrigin();
    }

    function getMapReferenceHeight() {
      var mapRect = mapWrap.getBoundingClientRect();
      if (mapRect.height > 0) return mapRect.height;
      var mapWidth = mapRect.width;
      if (!(mapWidth > 0)) {
        var canvas = mapWrap.parentElement;
        var canvasRect = canvas ? canvas.getBoundingClientRect() : null;
        mapWidth = canvasRect ? canvasRect.width : 0;
      }
      if (!(mapWidth > 0)) return 0;
      return mapWidth / MAP_GRID_RATIO;
    }

    function syncMapProjectShellHeight() {
      var shellHeight = getMapReferenceHeight();
      if (!(shellHeight > 0)) return;
      mapProjectShell.style.setProperty("--map-project-inline-shell-h", Math.round(shellHeight) + "px");
    }

    function clearMapProjectShellHeight() {
      mapProjectShell.style.removeProperty("--map-project-inline-shell-h");
    }

    function setMapProjectDetailText(el, value) {
      if (!el) return;
      if (value) {
        el.hidden = false;
        el.textContent = value;
      } else {
        el.textContent = "";
        el.hidden = true;
      }
    }

    function setMapProjectDetailHtml(el, html) {
      if (!el) return;
      if (html) {
        el.hidden = false;
        el.innerHTML = html;
        Array.prototype.forEach.call(el.querySelectorAll("a[href]"), function (anchor) {
          if (anchor.hasAttribute("data-external-textfx-disabled")) return;
          if (anchor.querySelector("img, video, picture, svg, canvas, iframe")) return;
          anchor.classList.add("external-link-hoverfx");
          anchor.style.setProperty("--external-link-fill", "#111111");
          anchor.style.setProperty("--external-link-hover-fg", "#ffffff");
        });
      } else {
        el.innerHTML = "";
        el.hidden = true;
      }
    }

    function setMapProjectDetailSectionA(title, bodyHtml) {
      if (!mapProjectDetailSectionA || !mapProjectDetailHeadingA || !mapProjectDetailHeadingABody) return;
      var hasBody = !!(bodyHtml && String(bodyHtml).trim());
      var hasTitle = !!(title && String(title).trim());
      mapProjectDetailSectionA.classList.toggle("map-project-detail-section-a--rich", hasBody);
      setMapProjectDetailText(mapProjectDetailHeadingA, hasTitle ? title : "");
      setMapProjectDetailHtml(mapProjectDetailHeadingABody, hasBody ? bodyHtml : "");
      mapProjectDetailSectionA.hidden = !(hasTitle || hasBody);
      scheduleSyncMapProjectDetailChromeTheme();
    }

    function escapeMapProjectDetailHtml(value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function renderMapProjectDetailSectionBBlocks(titleHtml, blocks) {
      if (!Array.isArray(blocks) || !blocks.length) return "";
      return blocks.map(function (block, index) {
        var question = escapeMapProjectDetailHtml(block && block.question ? block.question : "");
        var videoQuestion = escapeMapProjectDetailHtml(block && block.videoQuestion ? block.videoQuestion : "");
        var leftImageSrc = escapeMapProjectDetailHtml(block && block.leftImageSrc ? block.leftImageSrc : "");
        var rightImageSrc = escapeMapProjectDetailHtml(block && block.rightImageSrc ? block.rightImageSrc : "");
        var videoSrc = escapeMapProjectDetailHtml(block && block.videoSrc ? block.videoSrc : "");
        var altBase = "Veritas concept scene " + String(index + 1);
        var sceneTitleHtml = index === 0 && titleHtml ? [
          '<h3 class="map-project-detail-section-b-scene-title">',
          titleHtml,
          "</h3>"
        ].join("") : "";
        return [
          '<section class="map-project-detail-section-b-scene" data-scene-index="' + index + '">',
          '<div class="map-project-detail-section-b-scene-stage">',
          '<div class="map-project-detail-section-b-scene-copy">',
          sceneTitleHtml,
          '<p class="map-project-detail-section-b-scene-question" data-default-question="' + question + '"' +
            (videoQuestion ? ' data-video-question="' + videoQuestion + '"' : "") +
            '>' + question + "</p>",
          "</div>",
          '<div class="map-project-detail-section-b-scene-media-stage">',
          '<div class="map-project-detail-section-b-scene-media">',
          '<figure class="map-project-detail-section-b-scene-figure map-project-detail-section-b-scene-figure-left">',
          '<img src="' + leftImageSrc + '" alt="' + escapeMapProjectDetailHtml(altBase + ' left image') + '" loading="eager" decoding="async" />',
          "</figure>",
          '<figure class="map-project-detail-section-b-scene-figure map-project-detail-section-b-scene-figure-right">',
          '<img src="' + rightImageSrc + '" alt="' + escapeMapProjectDetailHtml(altBase + ' right image') + '" loading="eager" decoding="async" />',
          "</figure>",
          "</div>",
          '<figure class="map-project-detail-section-b-scene-video-shell" aria-hidden="true">',
          '<video class="map-project-detail-section-b-scene-video-el" muted playsinline webkit-playsinline loop data-scene-poster="' + leftImageSrc + '" src="' + videoSrc + '"></video>',
          "</figure>",
          "</div>",
          "</div>",
          "</section>"
        ].join("");
      }).join("");
    }

    function cacheMapProjectDetailSectionBScenes() {
      mapProjectDetailSectionBSceneStates = [];
      if (!mapProjectDetailHeadingBBody) return;
      Array.prototype.forEach.call(
        mapProjectDetailHeadingBBody.querySelectorAll(".map-project-detail-section-b-scene"),
        function (sceneEl) {
          var sceneState = {
            sceneEl: sceneEl,
            sceneIndex: parseInt(sceneEl.getAttribute("data-scene-index"), 10) || 0,
            stageEl: sceneEl.querySelector(".map-project-detail-section-b-scene-stage"),
            copyEl: sceneEl.querySelector(".map-project-detail-section-b-scene-copy"),
            titleEl: sceneEl.querySelector(".map-project-detail-section-b-scene-title"),
            questionEl: sceneEl.querySelector(".map-project-detail-section-b-scene-question"),
            mediaStageEl: sceneEl.querySelector(".map-project-detail-section-b-scene-media-stage"),
            mediaEl: sceneEl.querySelector(".map-project-detail-section-b-scene-media"),
            videoShellEl: sceneEl.querySelector(".map-project-detail-section-b-scene-video-shell"),
            videoEl: sceneEl.querySelector(".map-project-detail-section-b-scene-video-el"),
            videoWarmed: false,
            videoConfigured: false,
            videoFailed: false,
            videoControlsPinned: false,
            videoPlayAttempts: 0,
            videoRetryTimerId: 0,
            videoReadyRetryHandler: null,
            desktopPhase: "before-pin",
            desktopPinStartScrollTop: NaN,
            desktopPinnedInset: NaN,
            desktopPersistentVideoVisible: false,
            desktopReleaseLocked: false,
            desktopReverseUnlockScrollTop: NaN,
            desktopIsPinned: false,
            desktopRuntimeHeight: 0,
            desktopTailDistance: 0,
            mobileVideoActive: false,
            mobileOverlapsViewport: false,
            resizeFrozen: false,
            frozenPhase: "before-pin",
            frozenMorphProgress: 0,
            frozenHasVideoVisual: false,
            frozenRuntimeScrollDistance: 0,
            frozenIsPinned: false
          };
          if (sceneState.videoEl && sceneState.videoShellEl) {
            configureMapProjectDetailSectionBVideo(sceneState);
            bindMapProjectDetailVideoHoverControls(sceneState.videoEl, sceneState.videoShellEl);
          }
          mapProjectDetailSectionBSceneStates.push(sceneState);
        }
      );
    }

    function setMapProjectDetailSectionB(titleHtml, blocks, fallbackTitle) {
      if (!mapProjectDetailSectionB || !mapProjectDetailHeadingB || !mapProjectDetailHeadingBBody) return;
      mapProjectDetailSectionBSceneStates.forEach(resetMapProjectDetailSectionBSceneState);
      var hasBlocks = Array.isArray(blocks) && blocks.length > 0;
      var resolvedTitleHtml = titleHtml && String(titleHtml).trim()
        ? String(titleHtml)
        : (fallbackTitle ? escapeMapProjectDetailHtml(fallbackTitle) : "");
      var hasTitle = !!resolvedTitleHtml;
      mapProjectDetailSectionB.classList.toggle("map-project-detail-section-b--rich", hasBlocks);
      mapProjectDetailHeadingB.hidden = hasBlocks || !hasTitle;
      setMapProjectDetailHtml(mapProjectDetailHeadingB, hasBlocks ? "" : (hasTitle ? resolvedTitleHtml : ""));
      setMapProjectDetailHtml(
        mapProjectDetailHeadingBBody,
        hasBlocks ? renderMapProjectDetailSectionBBlocks(resolvedTitleHtml, blocks) : ""
      );
      mapProjectDetailHeadingBBody.hidden = !hasBlocks;
      mapProjectDetailSectionB.hidden = !(hasBlocks || hasTitle);
      cacheMapProjectDetailSectionBScenes();
      scheduleSyncMapProjectDetailChromeTheme();
    }

    function setMapProjectOpenTraceSequenceScrollLock(active) {
      var state = mapProjectOpenTraceSequenceState;
      var shouldLock = !!active;
      if (!mapProjectScroll) {
        state.lockActive = false;
        state.lockScrollTop = 0;
        state.overflowYBeforeLock = "";
        state.overscrollBehaviorYBeforeLock = "";
        return;
      }

      if (shouldLock) {
        if (!state.lockActive) {
          state.lockActive = true;
          state.lockScrollTop = mapProjectScroll.scrollTop || 0;
          state.overflowYBeforeLock = mapProjectScroll.style.overflowY || "";
          state.overscrollBehaviorYBeforeLock = mapProjectScroll.style.overscrollBehaviorY || "";
          mapProjectScroll.style.overflowY = "hidden";
          mapProjectScroll.style.overscrollBehaviorY = "none";
        }
        if (Math.abs((mapProjectScroll.scrollTop || 0) - state.lockScrollTop) > 0.5) {
          mapProjectScroll.scrollTop = state.lockScrollTop;
        }
        return;
      }

      if (!state.lockActive) return;
      state.lockActive = false;
      if (state.overflowYBeforeLock) {
        mapProjectScroll.style.overflowY = state.overflowYBeforeLock;
      } else {
        mapProjectScroll.style.removeProperty("overflow-y");
      }
      if (state.overscrollBehaviorYBeforeLock) {
        mapProjectScroll.style.overscrollBehaviorY = state.overscrollBehaviorYBeforeLock;
      } else {
        mapProjectScroll.style.removeProperty("overscroll-behavior-y");
      }
      state.lockScrollTop = 0;
      state.overflowYBeforeLock = "";
      state.overscrollBehaviorYBeforeLock = "";
    }

    function clearMapProjectOpenTraceSequenceState() {
      setMapProjectOpenTraceSequenceScrollLock(false);
      mapProjectOpenTraceSequenceState.enabled = false;
      mapProjectOpenTraceSequenceState.frameSources = [];
      mapProjectOpenTraceSequenceState.currentIndex = 0;
      mapProjectOpenTraceSequenceState.wheelCarry = 0;
      mapProjectOpenTraceSequenceState.activeStepProgress = 0;
      mapProjectOpenTraceSequenceState.lockActive = false;
      mapProjectOpenTraceSequenceState.lockScrollTop = 0;
      mapProjectOpenTraceSequenceState.overflowYBeforeLock = "";
      mapProjectOpenTraceSequenceState.overscrollBehaviorYBeforeLock = "";
      mapProjectOpenTraceSequenceState.lastShellTop = NaN;
      mapProjectOpenTraceSequenceState.rootEl = null;
      mapProjectOpenTraceSequenceState.shellEl = null;
      mapProjectOpenTraceSequenceState.imageEl = null;
      mapProjectOpenTraceSequenceState.imageEls = [];
      mapProjectOpenTraceSequenceState.activeImageSlot = 0;
      mapProjectOpenTraceSequenceState.pendingSwapToken = 0;
      mapProjectOpenTraceSequenceState.indicatorEls = [];
      mapProjectOpenTraceSequenceState.prevButtonEl = null;
      mapProjectOpenTraceSequenceState.nextButtonEl = null;
      mapProjectOpenTraceSequenceState.preloadImages = [];
    }

    function preloadMapProjectOpenTraceSequenceFrames(frameSources) {
      if (!Array.isArray(frameSources) || frameSources.length < 2) return [];
      var preloadAhead = Math.max(
        0,
        Math.min(frameSources.length - 1, Number(MAP_PROJECT_OPENTRACE_SEQUENCE_PRELOAD_AHEAD) || 0)
      );
      if (!preloadAhead) return [];
      return frameSources.slice(1, 1 + preloadAhead).map(function (src) {
        var frameSrc = String(src || "").trim();
        if (!frameSrc) return null;
        var img = new window.Image();
        img.decoding = "async";
        img.src = frameSrc;
        if (typeof img.decode === "function") {
          img.decode().catch(function () {});
        }
        return img;
      }).filter(function (img) {
        return !!img;
      });
    }

    function setMapProjectOpenTraceSequenceFrame(frameIndex) {
      var state = mapProjectOpenTraceSequenceState;
      if (!state.enabled || !state.frameSources.length) return false;
      var nextIndex = parseInt(frameIndex, 10);
      if (!isFinite(nextIndex)) return false;
      nextIndex = clampNumber(nextIndex, 0, state.frameSources.length - 1);
      if (nextIndex === state.currentIndex) {
        syncMapProjectOpenTraceSequenceControls();
        return false;
      }
      var nextSrc = state.frameSources[nextIndex];
      if (!nextSrc) return false;
      state.currentIndex = nextIndex;
      syncMapProjectOpenTraceSequenceControls();

      var imageEls = Array.isArray(state.imageEls) ? state.imageEls : [];
      if (!imageEls.length && state.imageEl) {
        imageEls = [state.imageEl];
      }
      if (!imageEls.length) return false;

      if (imageEls.length < 2) {
        imageEls[0].src = nextSrc;
        imageEls[0].setAttribute("data-frame-index", String(nextIndex));
        return true;
      }

      var activeSlot = state.activeImageSlot === 1 ? 1 : 0;
      var nextSlot = activeSlot === 0 ? 1 : 0;
      var activeEl = imageEls[activeSlot];
      var nextEl = imageEls[nextSlot];
      if (!activeEl || !nextEl) {
        imageEls[0].src = nextSrc;
        imageEls[0].setAttribute("data-frame-index", String(nextIndex));
        state.activeImageSlot = 0;
        return true;
      }

      var swapToken = (state.pendingSwapToken || 0) + 1;
      state.pendingSwapToken = swapToken;
      nextEl.src = nextSrc;
      nextEl.setAttribute("data-frame-index", String(nextIndex));

      function commitLayerSwap() {
        if (state.pendingSwapToken !== swapToken) return;
        nextEl.classList.add("is-active");
        activeEl.classList.remove("is-active");
        state.activeImageSlot = nextSlot;
        state.imageEl = nextEl;
      }

      if (nextEl.complete && nextEl.naturalWidth > 0) {
        commitLayerSwap();
        return true;
      }
      if (typeof nextEl.decode === "function") {
        nextEl.decode().catch(function () {}).finally(commitLayerSwap);
        return true;
      }
      function onReady() {
        nextEl.removeEventListener("load", onReady);
        nextEl.removeEventListener("error", onReady);
        commitLayerSwap();
      }
      nextEl.addEventListener("load", onReady);
      nextEl.addEventListener("error", onReady);
      return true;
    }

    function canStepMapProjectOpenTraceSequence(stepDirection) {
      var state = mapProjectOpenTraceSequenceState;
      if (!state.enabled || !state.frameSources.length) return false;
      if (stepDirection > 0) return state.currentIndex < (state.frameSources.length - 1);
      if (stepDirection < 0) return state.currentIndex > 0;
      return false;
    }

    function syncMapProjectOpenTraceSequenceControls() {
      var state = mapProjectOpenTraceSequenceState;
      var currentIndex = state.currentIndex;
      var maxIndex = Math.max(0, state.frameSources.length - 1);
      var activeProgress = clampNumber(Number(state.activeStepProgress) || 0, 0, 1);
      if (Array.isArray(state.indicatorEls) && state.indicatorEls.length) {
        state.indicatorEls.forEach(function (item, itemIndex) {
          if (!item) return;
          var isActive = itemIndex === currentIndex;
          item.classList.toggle("is-active", isActive);
          item.style.setProperty(
            "--map-project-opentrace-sequence-progress",
            isActive ? activeProgress.toFixed(4) : "0"
          );
        });
      }
      if (state.prevButtonEl) {
        var canPrev = currentIndex > 0;
        state.prevButtonEl.disabled = !canPrev;
        state.prevButtonEl.setAttribute("aria-disabled", canPrev ? "false" : "true");
      }
      if (state.nextButtonEl) {
        var canNext = currentIndex < maxIndex;
        state.nextButtonEl.disabled = !canNext;
        state.nextButtonEl.setAttribute("aria-disabled", canNext ? "false" : "true");
      }
    }

    function stepMapProjectOpenTraceSequence(delta) {
      var state = mapProjectOpenTraceSequenceState;
      if (!state.enabled || !state.frameSources.length) return false;
      var numericDelta = parseInt(delta, 10);
      if (!isFinite(numericDelta) || !numericDelta) return false;
      state.wheelCarry = 0;
      state.activeStepProgress = 0;
      return setMapProjectOpenTraceSequenceFrame(state.currentIndex + numericDelta);
    }

    function normalizeMapProjectOpenTraceWheelDeltaY(event) {
      if (!event) return 0;
      var deltaY = Number(event.deltaY);
      if (!isFinite(deltaY) || deltaY === 0) return 0;
      if (event.deltaMode === 1) {
        deltaY *= MAP_PROJECT_OPENTRACE_SEQUENCE_WHEEL_LINE_PX;
      } else if (event.deltaMode === 2) {
        var pageStep = mapProjectScroll
          ? (mapProjectScroll.clientHeight || mapProjectScroll.getBoundingClientRect().height)
          : window.innerHeight;
        if (!(pageStep > 0)) pageStep = window.innerHeight || 1;
        deltaY *= pageStep;
      }
      return deltaY;
    }

    function isMapProjectOpenTraceSequenceCentered() {
      var state = mapProjectOpenTraceSequenceState;
      if (!state.enabled || !state.shellEl || !mapProjectScroll) {
        state.lastShellTop = NaN;
        return false;
      }
      var viewportRect = mapProjectScroll.getBoundingClientRect();
      var shellRect = state.shellEl.getBoundingClientRect();
      var overlap = Math.min(viewportRect.bottom, shellRect.bottom) - Math.max(viewportRect.top, shellRect.top);
      if (!(overlap > 0)) {
        state.lastShellTop = NaN;
        return false;
      }
      var triggerY = viewportRect.top + MAP_PROJECT_OPENTRACE_SEQUENCE_TRIGGER_TOP_OFFSET;
      var topDelta = shellRect.top - triggerY;
      var inBand = Math.abs(topDelta) <= MAP_PROJECT_OPENTRACE_SEQUENCE_TRIGGER_TOP_TOLERANCE;
      var crossedTrigger = false;
      if (isFinite(state.lastShellTop)) {
        var prevDelta = state.lastShellTop - triggerY;
        crossedTrigger = (prevDelta <= 0 && topDelta >= 0) || (prevDelta >= 0 && topDelta <= 0);
      }
      state.lastShellTop = shellRect.top;
      var minVisible = Math.max(80, Math.min(shellRect.height * 0.16, viewportRect.height * 0.24));
      if (overlap < minVisible) return false;
      return inBand || crossedTrigger;
    }

    function handleMapProjectOpenTraceSequenceWheel(event) {
      if (!supportsFineHover) return;
      if (!event || event.defaultPrevented) return;
      if (!document.documentElement.classList.contains("map-project-open")) return;
      if (!mapProjectShell.classList.contains("map-project-shell--opentrace")) return;
      if (mapDetailNavState.drag.active) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      var state = mapProjectOpenTraceSequenceState;
      if (!state.enabled || !state.frameSources || state.frameSources.length < 2) {
        state.lastShellTop = NaN;
        state.activeStepProgress = 0;
        setMapProjectOpenTraceSequenceScrollLock(false);
        return;
      }
      if (!isMapProjectOpenTraceSequenceCentered()) {
        state.wheelCarry = 0;
        state.activeStepProgress = 0;
        syncMapProjectOpenTraceSequenceControls();
        setMapProjectOpenTraceSequenceScrollLock(false);
        return;
      }
      var normalizedDeltaY = normalizeMapProjectOpenTraceWheelDeltaY(event);
      if (!normalizedDeltaY) return;
      if (Math.abs(normalizedDeltaY) <= Math.abs(event.deltaX)) {
        if (state.lockActive) {
          if (event.cancelable) {
            event.preventDefault();
          }
          event.stopPropagation();
          mapProjectScroll.scrollTop = state.lockScrollTop;
        }
        return;
      }

      var direction = normalizedDeltaY > 0 ? 1 : -1;
      if (!direction) return;
      if (!canStepMapProjectOpenTraceSequence(direction)) {
        state.wheelCarry = 0;
        state.activeStepProgress = 0;
        syncMapProjectOpenTraceSequenceControls();
        setMapProjectOpenTraceSequenceScrollLock(false);
        return;
      }

      setMapProjectOpenTraceSequenceScrollLock(true);
      if (event.cancelable) {
        event.preventDefault();
      }
      event.stopPropagation();
      mapProjectScroll.scrollTop = state.lockScrollTop;
      if (state.wheelCarry && ((state.wheelCarry > 0 ? 1 : -1) !== direction)) {
        state.wheelCarry = 0;
        state.activeStepProgress = 0;
      }
      state.wheelCarry += normalizedDeltaY;
      var threshold = MAP_PROJECT_OPENTRACE_SEQUENCE_WHEEL_STEP_THRESHOLD;
      if (Math.abs(state.wheelCarry) < threshold) {
        state.activeStepProgress = Math.max(0, Math.min(1, Math.abs(state.wheelCarry) / threshold));
        syncMapProjectOpenTraceSequenceControls();
        return;
      }
      var stepDirection = state.wheelCarry > 0 ? 1 : -1;
      if (!canStepMapProjectOpenTraceSequence(stepDirection)) {
        state.wheelCarry = 0;
        state.activeStepProgress = 0;
        syncMapProjectOpenTraceSequenceControls();
        return;
      }
      var availableSteps = stepDirection > 0
        ? ((state.frameSources.length - 1) - state.currentIndex)
        : state.currentIndex;
      var requestedSteps = Math.floor(Math.abs(state.wheelCarry) / threshold);
      var stepCount = Math.min(
        Math.max(0, availableSteps),
        MAP_PROJECT_OPENTRACE_SEQUENCE_WHEEL_MAX_STEPS_PER_EVENT,
        Math.max(0, requestedSteps)
      );
      if (!(stepCount > 0)) {
        return;
      }
      setMapProjectOpenTraceSequenceFrame(state.currentIndex + (stepDirection * stepCount));
      state.wheelCarry -= threshold * stepDirection * stepCount;
      state.wheelCarry = clampNumber(state.wheelCarry, -threshold * 1.25, threshold * 1.25);
      state.activeStepProgress = Math.max(0, Math.min(1, Math.abs(state.wheelCarry) / threshold));
      syncMapProjectOpenTraceSequenceControls();
    }

    function clearMapProjectOpenTraceRoot() {
      clearMapProjectOpenTraceSequenceState();
      if (!mapProjectOpenTraceRoot) return;
      mapProjectOpenTraceRoot.innerHTML = "";
      mapProjectOpenTraceRoot.hidden = true;
      mapProjectOpenTraceRoot.setAttribute("aria-hidden", "true");
    }

    function renderMapProjectOpenTraceRoot(pageData, detail) {
      if (!mapProjectOpenTraceRoot) return;
      var tags = Array.isArray(pageData && pageData.tags) ? pageData.tags.slice(0, 3) : [];
      var lead = pageData && pageData.lead
        ? String(pageData.lead)
        : (detail && detail.desc ? String(detail.desc) : "");
      var creditHtml = pageData && pageData.creditHtml ? String(pageData.creditHtml) : "";
      var creditSecondaryHtml = pageData && pageData.creditSecondaryHtml
        ? String(pageData.creditSecondaryHtml)
        : "";
      var sequenceHeading = pageData && pageData.sequenceHeading
        ? String(pageData.sequenceHeading)
        : MAP_PROJECT_OPENTRACE_DEFAULT_SEQUENCE_HEADING;
      var sequenceStatementHtml = pageData && pageData.sequenceStatementHtml
        ? String(pageData.sequenceStatementHtml)
        : MAP_PROJECT_OPENTRACE_DEFAULT_SEQUENCE_STATEMENT_HTML;
      var sequenceFrameAlt = pageData && pageData.sequenceFrameAlt
        ? String(pageData.sequenceFrameAlt)
        : MAP_PROJECT_OPENTRACE_SEQUENCE_DEFAULT_FRAME_ALT;
      var sequenceFrames = normalizeOpenTraceSequenceFrames(pageData && pageData.sequenceFrames);
      var firstSequenceFrame = sequenceFrames.length ? escapeMapProjectDetailHtml(sequenceFrames[0]) : "";
      var hasSequenceControls = sequenceFrames.length > 1;
      var sequencePaginationHtml = hasSequenceControls
        ? sequenceFrames.map(function (_, index) {
          return '<span class="map-project-opentrace-sequence-pagination-item' +
            (index === 0 ? " is-active" : "") +
            '" aria-hidden="true"></span>';
        }).join("")
        : "";
      var closingText = pageData && pageData.closingText
        ? String(pageData.closingText)
        : "";
      var closingTextHtml = pageData && pageData.closingTextHtml
        ? String(pageData.closingTextHtml)
        : "";
      var resolvedClosingTitleHtml = closingTextHtml
        ? closingTextHtml
        : (closingText ? escapeMapProjectDetailHtml(closingText) : "");
      var closingBodyText = pageData && pageData.closingBodyText
        ? String(pageData.closingBodyText)
        : "";
      var featureVideoSrc = pageData && pageData.featureVideoSrc
        ? String(pageData.featureVideoSrc)
        : "";
      var featureVideoPosterSrc = pageData && pageData.featureVideoPosterSrc
        ? String(pageData.featureVideoPosterSrc)
        : "";
      var featureVideoAlt = pageData && pageData.featureVideoAlt
        ? String(pageData.featureVideoAlt)
        : "OpenTraces concept video";

      var tagHtml = tags.map(function (tag) {
        if (!tag) return "";
        return '<p class="map-project-opentrace-tag">' + escapeMapProjectDetailHtml(String(tag)) + "</p>";
      }).join("");

      var featureVideoHtml = "";
      if (featureVideoSrc) {
        var escapedFeatureVideoSrc = escapeMapProjectDetailHtml(featureVideoSrc);
        var escapedFeatureVideoPosterSrc = featureVideoPosterSrc ? escapeMapProjectDetailHtml(featureVideoPosterSrc) : "";
        var escapedFeatureVideoAlt = escapeMapProjectDetailHtml(featureVideoAlt);
        featureVideoHtml = [
          '<figure class="map-project-opentrace-feature-video-shell">',
          '<video class="map-project-opentrace-feature-video" playsinline webkit-playsinline preload="metadata" aria-label="' + escapedFeatureVideoAlt + '"' +
            (escapedFeatureVideoPosterSrc ? (' poster="' + escapedFeatureVideoPosterSrc + '"') : "") +
            ">",
          '<source src="' + escapedFeatureVideoSrc + '" type="video/quicktime" />',
          '<source src="' + escapedFeatureVideoSrc + '" />',
          "</video>",
          "</figure>"
        ].join("");
      }

      mapProjectOpenTraceRoot.innerHTML = [
        '<div class="map-project-opentrace-canvas">',
        '<div class="map-project-opentrace-meta-row">',
        '<div class="map-project-opentrace-meta-left">',
        tagHtml,
        "</div>",
        '<div class="map-project-opentrace-meta-right">',
        creditHtml ? '<p class="map-project-opentrace-credit">' + creditHtml + "</p>" : "",
        creditSecondaryHtml ? '<p class="map-project-opentrace-award">' + creditSecondaryHtml + "</p>" : "",
        "</div>",
        "</div>",
        '<div class="map-project-opentrace-first-block">',
        '<div class="map-project-opentrace-first-block-media">',
        featureVideoHtml,
        "</div>",
        '<div class="map-project-opentrace-first-block-copy">',
        '<p class="map-project-opentrace-lead">' + escapeMapProjectDetailHtml(lead) + "</p>",
        "</div>",
        "</div>",
        /* Temporarily hide all content below the introductory video and copy.
           Keep the sequence and closing components here for later restoration.
        '<section class="map-project-opentrace-sequence-block">',
        '<div class="map-project-opentrace-sequence-inner">',
        '<h3 class="map-project-opentrace-sequence-heading">' + escapeMapProjectDetailHtml(sequenceHeading) + "</h3>",
        '<p class="map-project-opentrace-sequence-statement">' + sequenceStatementHtml + "</p>",
        '<figure class="map-project-opentrace-sequence-media">',
        firstSequenceFrame
          ? [
            '<div class="map-project-opentrace-sequence-image-stack">',
            '<img class="map-project-opentrace-sequence-image map-project-opentrace-sequence-image--a is-active" src="' + firstSequenceFrame + '" alt="' + escapeMapProjectDetailHtml(sequenceFrameAlt) + '" loading="eager" decoding="async" data-frame-index="0" data-layer-index="0" />',
            '<img class="map-project-opentrace-sequence-image map-project-opentrace-sequence-image--b" src="' + firstSequenceFrame + '" alt="" aria-hidden="true" loading="eager" decoding="async" data-frame-index="0" data-layer-index="1" />',
            "</div>"
          ].join("")
          : '<div class="map-project-opentrace-sequence-fallback" aria-hidden="true"></div>',
        "</figure>",
        hasSequenceControls
          ? [
            '<div class="map-project-opentrace-sequence-controls" aria-hidden="false">',
            '<div class="map-project-opentrace-sequence-pagination" aria-hidden="true">',
            sequencePaginationHtml,
            "</div>",
            '<div class="map-project-opentrace-sequence-nav" aria-label="OpenTraces frame controls">',
            '<button type="button" class="map-project-opentrace-sequence-nav-btn map-project-opentrace-sequence-nav-btn--prev" aria-label="Previous frame"></button>',
            '<button type="button" class="map-project-opentrace-sequence-nav-btn map-project-opentrace-sequence-nav-btn--next" aria-label="Next frame"></button>',
            "</div>",
            "</div>"
          ].join("")
          : "",
        "</div>",
        "</section>",
        '<section class="map-project-opentrace-closing">',
        resolvedClosingTitleHtml ? '<p class="map-project-opentrace-closing-title">' + resolvedClosingTitleHtml + "</p>" : "",
        closingBodyText ? '<p class="map-project-opentrace-closing-body">' + escapeMapProjectDetailHtml(closingBodyText) + "</p>" : "",
        '<section class="map-project-opentrace-hero" aria-label="OpenTraces dynamic component">',
        '<div class="map-project-opentrace-hero-host"></div>',
        "</section>",
        "</section>",
        */
        "</div>"
      ].join("");

      var heroHost = mapProjectOpenTraceRoot.querySelector(".map-project-opentrace-hero-host");
      if (heroHost && sourceOpenTracesNode) {
        var heroNode = sourceOpenTracesNode.cloneNode(true);
        heroNode.classList.add("map-project-opentrace-hero-component");
        var heroDescEl = heroNode.querySelector(".practice3042-open-traces-desc");
        var heroCreditEl = heroNode.querySelector(".practice3042-open-traces-credit");
        var heroYearEl = heroNode.querySelector(".practice3042-open-traces-year");
        var heroVideoEl = heroNode.querySelector(".practice3042-open-traces-video");
        if (heroDescEl) {
          heroDescEl.textContent = pageData && pageData.heroKicker
            ? String(pageData.heroKicker)
            : MAP_PROJECT_OPENTRACE_DEFAULT_HERO_KICKER;
        }
        if (heroCreditEl && pageData && pageData.heroCredit) {
          heroCreditEl.textContent = String(pageData.heroCredit);
        }
        if (heroYearEl && pageData && pageData.heroYear) {
          heroYearEl.textContent = String(pageData.heroYear);
        }
        if (heroVideoEl) {
          heroVideoEl.autoplay = true;
          heroVideoEl.loop = true;
          heroVideoEl.muted = true;
          heroVideoEl.defaultMuted = true;
          heroVideoEl.setAttribute("muted", "");
          heroVideoEl.playsInline = true;
          heroVideoEl.setAttribute("playsinline", "");
          heroVideoEl.setAttribute("webkit-playsinline", "");
          heroVideoEl.play().catch(function () {});
        }
        heroHost.appendChild(heroNode);
      }

      clearMapProjectOpenTraceSequenceState();
      var sequenceImageEls = Array.prototype.slice.call(
        mapProjectOpenTraceRoot.querySelectorAll(".map-project-opentrace-sequence-image")
      );
      var sequenceImageEl = sequenceImageEls.length ? sequenceImageEls[0] : null;
      var sequenceShellEl = mapProjectOpenTraceRoot.querySelector(".map-project-opentrace-sequence-media");
      var sequencePrevButtonEl = mapProjectOpenTraceRoot.querySelector(".map-project-opentrace-sequence-nav-btn--prev");
      var sequenceNextButtonEl = mapProjectOpenTraceRoot.querySelector(".map-project-opentrace-sequence-nav-btn--next");
      var sequenceIndicatorEls = Array.prototype.slice.call(
        mapProjectOpenTraceRoot.querySelectorAll(".map-project-opentrace-sequence-pagination-item")
      );
      if (sequenceImageEl && sequenceShellEl && sequenceFrames.length) {
        mapProjectOpenTraceSequenceState.enabled = true;
        mapProjectOpenTraceSequenceState.frameSources = sequenceFrames.slice(0);
        mapProjectOpenTraceSequenceState.currentIndex = 0;
        mapProjectOpenTraceSequenceState.wheelCarry = 0;
        mapProjectOpenTraceSequenceState.activeStepProgress = 0;
        mapProjectOpenTraceSequenceState.lastShellTop = NaN;
        mapProjectOpenTraceSequenceState.rootEl = mapProjectOpenTraceRoot;
        mapProjectOpenTraceSequenceState.shellEl = sequenceShellEl;
        mapProjectOpenTraceSequenceState.imageEl = sequenceImageEl;
        mapProjectOpenTraceSequenceState.imageEls = sequenceImageEls;
        mapProjectOpenTraceSequenceState.activeImageSlot = 0;
        mapProjectOpenTraceSequenceState.pendingSwapToken = 0;
        mapProjectOpenTraceSequenceState.indicatorEls = sequenceIndicatorEls;
        mapProjectOpenTraceSequenceState.prevButtonEl = sequencePrevButtonEl;
        mapProjectOpenTraceSequenceState.nextButtonEl = sequenceNextButtonEl;
        mapProjectOpenTraceSequenceState.preloadImages = preloadMapProjectOpenTraceSequenceFrames(sequenceFrames);
        if (sequenceImageEls.length > 1) {
          sequenceImageEls[0].classList.add("is-active");
          sequenceImageEls[1].classList.remove("is-active");
        }
        syncMapProjectOpenTraceSequenceControls();

        if (sequencePrevButtonEl) {
          sequencePrevButtonEl.addEventListener("click", function (event) {
            event.preventDefault();
            stepMapProjectOpenTraceSequence(-1);
          });
        }
        if (sequenceNextButtonEl) {
          sequenceNextButtonEl.addEventListener("click", function (event) {
            event.preventDefault();
            stepMapProjectOpenTraceSequence(1);
          });
        }
        if (sequenceShellEl) {
          sequenceShellEl.setAttribute("tabindex", "0");
          sequenceShellEl.setAttribute("role", "group");
          sequenceShellEl.setAttribute("aria-label", "OpenTraces sequence frames");
          sequenceShellEl.addEventListener("keydown", function (event) {
            if (!event) return;
            if (event.key === "ArrowRight") {
              event.preventDefault();
              stepMapProjectOpenTraceSequence(1);
            } else if (event.key === "ArrowLeft") {
              event.preventDefault();
              stepMapProjectOpenTraceSequence(-1);
            }
          });
        }
      }

      var openTraceFeatureVideoShellEl = mapProjectOpenTraceRoot.querySelector(".map-project-opentrace-feature-video-shell");
      var openTraceFeatureVideoEl = mapProjectOpenTraceRoot.querySelector(".map-project-opentrace-feature-video");
      if (openTraceFeatureVideoEl && openTraceFeatureVideoShellEl) {
        openTraceFeatureVideoEl.autoplay = false;
        openTraceFeatureVideoEl.loop = false;
        openTraceFeatureVideoEl.muted = false;
        openTraceFeatureVideoEl.defaultMuted = false;
        openTraceFeatureVideoEl.removeAttribute("muted");
        openTraceFeatureVideoEl.playsInline = true;
        openTraceFeatureVideoEl.setAttribute("playsinline", "");
        openTraceFeatureVideoEl.setAttribute("webkit-playsinline", "");
        bindMapProjectDetailVideoHoverControls(
          openTraceFeatureVideoEl,
          openTraceFeatureVideoShellEl,
          {
            keepVisibleUntilPlayed: true,
            forceVisibleWithoutHover: true
          }
        );
      }

      Array.prototype.forEach.call(mapProjectOpenTraceRoot.querySelectorAll("a[href]"), function (anchor) {
        if (anchor.hasAttribute("data-external-textfx-disabled")) return;
        anchor.classList.add("external-link-hoverfx");
        anchor.style.setProperty("--external-link-fill", "#111111");
        anchor.style.setProperty("--external-link-hover-fg", "#ffffff");
      });

      mapProjectOpenTraceRoot.hidden = false;
      mapProjectOpenTraceRoot.setAttribute("aria-hidden", "false");
    }

    function clearMapProjectTemplateRoot() {
      resetMapProjectTemplateGalleryLazyLoader();
      if (!mapProjectTemplateRoot) return;
      mapProjectTemplateRoot.innerHTML = "";
      mapProjectTemplateRoot.hidden = true;
      mapProjectTemplateRoot.setAttribute("aria-hidden", "true");
    }

    function renderMapProjectTemplateRoot(pageData, detail) {
      if (!mapProjectTemplateRoot) return;
      var tags = Array.isArray(pageData && pageData.tags) ? pageData.tags.slice(0, 3) : [];
      var lead = pageData && pageData.lead
        ? String(pageData.lead)
        : (detail && detail.desc ? String(detail.desc) : "");
      var secondary = pageData && pageData.secondaryStatement
        ? String(pageData.secondaryStatement)
        : MAP_PROJECT_TEMPLATE_SECONDARY_STATEMENT;
      var featureVideoSrc = pageData && pageData.featureVideoSrc
        ? String(pageData.featureVideoSrc)
        : "";
      var featureVideoPosterSrc = pageData && pageData.featureVideoPosterSrc
        ? String(pageData.featureVideoPosterSrc)
        : "";
      var featureVideoAlt = pageData && pageData.featureVideoAlt
        ? String(pageData.featureVideoAlt)
        : "Concept video";
      var cards = Array.isArray(pageData && pageData.galleryCards) ? pageData.galleryCards : [];
      var featureVideoHtml = "";
      if (featureVideoSrc) {
        var escapedFeatureVideoSrc = escapeMapProjectDetailHtml(featureVideoSrc);
        var escapedFeatureVideoPosterSrc = featureVideoPosterSrc ? escapeMapProjectDetailHtml(featureVideoPosterSrc) : "";
        var escapedFeatureVideoAlt = escapeMapProjectDetailHtml(featureVideoAlt);
        featureVideoHtml = [
          '<figure class="map-project-template-feature-video-shell">',
          '<video class="map-project-template-feature-video" playsinline webkit-playsinline preload="metadata" aria-label="' + escapedFeatureVideoAlt + '"' +
            (escapedFeatureVideoPosterSrc ? (' poster="' + escapedFeatureVideoPosterSrc + '"') : "") +
            ">",
          '<source src="' + escapedFeatureVideoSrc + '" type="video/quicktime" />',
          '<source src="' + escapedFeatureVideoSrc + '" />',
          "</video>",
          "</figure>"
        ].join("");
      }
      var cardsHtml = cards.map(function (card, cardIndex) {
        var src = escapeMapProjectDetailHtml(card && card.src ? String(card.src) : "");
        if (!src) return "";
        var alt = escapeMapProjectDetailHtml(card && card.alt ? String(card.alt) : "");
        var ariaLabel = alt ? ("Open image: " + alt) : "Open project image";
        var cardOrder = cardIndex + 1;
        return [
          '<figure class="map-project-template-gallery-card" data-card-index="' + String(cardOrder) + '">',
          '<button type="button" class="map-project-template-gallery-zoom-trigger" data-viewer-src="' + src + '" data-viewer-alt="' + alt + '" aria-label="' + escapeMapProjectDetailHtml(ariaLabel) + '">',
          '<img class="map-project-template-gallery-image is-lazy-pending" src="' + MAP_PROJECT_TEMPLATE_IMAGE_PLACEHOLDER_SRC + '" data-src="' + src + '" alt="' + alt + '" loading="lazy" decoding="async" fetchpriority="low" />',
          "</button>",
          "</figure>"
        ].join("");
      }).join("");

      var tagHtml = tags.map(function (tag) {
        if (!tag) return "";
        return '<p class="map-project-template-tag">' + escapeMapProjectDetailHtml(String(tag)) + "</p>";
      }).join("");

      var creditHtml = pageData && pageData.creditHtml ? String(pageData.creditHtml) : "";
      var instituteHtml = pageData && pageData.instituteHtml ? String(pageData.instituteHtml) : "";

      mapProjectTemplateRoot.innerHTML = [
        '<div class="map-project-template-canvas">',
        '<div class="map-project-template-meta-row">',
        '<div class="map-project-template-meta-left">',
        tagHtml,
        "</div>",
        '<div class="map-project-template-meta-right">',
        creditHtml ? '<p class="map-project-template-credit">' + creditHtml + "</p>" : "",
        instituteHtml ? '<p class="map-project-template-institute">' + instituteHtml + "</p>" : "",
        "</div>",
        "</div>",
        '<p class="map-project-template-lead">' + escapeMapProjectDetailHtml(lead) + "</p>",
        '<p class="map-project-template-secondary">' + escapeMapProjectDetailHtml(secondary) + "</p>",
        featureVideoHtml,
        cardsHtml ? '<div class="map-project-template-gallery">' + cardsHtml + "</div>" : "",
        "</div>"
      ].join("");

      Array.prototype.forEach.call(mapProjectTemplateRoot.querySelectorAll("a[href]"), function (anchor) {
        if (anchor.hasAttribute("data-external-textfx-disabled")) return;
        anchor.classList.add("external-link-hoverfx");
        anchor.style.setProperty("--external-link-fill", "#979797");
        anchor.style.setProperty("--external-link-hover-fg", "#ffffff");
      });
      var templateFeatureVideoShellEl = mapProjectTemplateRoot.querySelector(".map-project-template-feature-video-shell");
      var templateFeatureVideoEl = mapProjectTemplateRoot.querySelector(".map-project-template-feature-video");
      if (templateFeatureVideoEl && templateFeatureVideoShellEl) {
        templateFeatureVideoEl.autoplay = false;
        templateFeatureVideoEl.loop = false;
        templateFeatureVideoEl.muted = false;
        templateFeatureVideoEl.defaultMuted = false;
        templateFeatureVideoEl.removeAttribute("muted");
        templateFeatureVideoEl.playsInline = true;
        templateFeatureVideoEl.setAttribute("playsinline", "");
        templateFeatureVideoEl.setAttribute("webkit-playsinline", "");
        bindMapProjectDetailVideoHoverControls(
          templateFeatureVideoEl,
          templateFeatureVideoShellEl,
          {
            keepVisibleUntilPlayed: true,
            forceVisibleWithoutHover: true
          }
        );
      }
      initMapProjectTemplateGalleryLazyLoader();

      mapProjectTemplateRoot.hidden = false;
      mapProjectTemplateRoot.setAttribute("aria-hidden", "false");
    }

    function resetMapProjectTemplateGalleryLazyLoader() {
      var state = mapProjectTemplateLazyState;
      state.token += 1;
      if (state.observer) {
        state.observer.disconnect();
        state.observer = null;
      }
      state.queue = [];
      state.active = 0;
    }

    function flushMapProjectTemplateGalleryLazyQueue() {
      var state = mapProjectTemplateLazyState;
      while (state.active < MAP_PROJECT_TEMPLATE_LAZY_MAX_CONCURRENT && state.queue.length) {
        var task = state.queue.shift();
        if (!task || !task.img) continue;
        var img = task.img;
        var taskToken = task.token;
        var loadState = img.getAttribute("data-load-state");
        if (loadState !== "queued") continue;
        var src = (img.getAttribute("data-src") || "").trim();
        if (!src) {
          img.setAttribute("data-load-state", "done");
          img.classList.remove("is-lazy-pending");
          continue;
        }

        state.active += 1;
        img.setAttribute("data-load-state", "loading");
        var completed = false;
        function handleDone() {
          if (completed) return;
          completed = true;
          img.removeEventListener("load", handleDone);
          img.removeEventListener("error", handleDone);
          img.setAttribute("data-load-state", "done");
          img.classList.remove("is-lazy-pending");
          if (taskToken === state.token) {
            state.active = Math.max(0, state.active - 1);
            flushMapProjectTemplateGalleryLazyQueue();
          }
        }
        img.addEventListener("load", handleDone);
        img.addEventListener("error", handleDone);
        img.src = src;
        if (img.complete && img.naturalWidth > 0) {
          handleDone();
        }
      }
    }

    function queueMapProjectTemplateGalleryImageLoad(img) {
      if (!img) return;
      var state = mapProjectTemplateLazyState;
      var current = img.getAttribute("data-load-state");
      if (current === "queued" || current === "loading" || current === "done") return;
      img.setAttribute("data-load-state", "queued");
      state.queue.push({
        img: img,
        token: state.token
      });
      flushMapProjectTemplateGalleryLazyQueue();
    }

    function initMapProjectTemplateGalleryLazyLoader() {
      resetMapProjectTemplateGalleryLazyLoader();
      if (!mapProjectTemplateRoot) return;
      var images = Array.prototype.slice.call(
        mapProjectTemplateRoot.querySelectorAll(".map-project-template-gallery-image[data-src]")
      );
      if (!images.length) return;

      queueMapProjectTemplateGalleryImageLoad(images[0]);
      if (images.length === 1) return;

      if (typeof window.IntersectionObserver !== "function") {
        images.forEach(function (img, index) {
          if (index === 0) return;
          queueMapProjectTemplateGalleryImageLoad(img);
        });
        return;
      }

      var state = mapProjectTemplateLazyState;
      var observerToken = state.token;
      state.observer = new window.IntersectionObserver(function (entries) {
        if (observerToken !== state.token || !state.observer) return;
        entries.forEach(function (entry) {
          if (!entry || !entry.target) return;
          if (!entry.isIntersecting && entry.intersectionRatio <= 0) return;
          state.observer.unobserve(entry.target);
          queueMapProjectTemplateGalleryImageLoad(entry.target);
        });
      }, {
        root: mapProjectScroll || null,
        rootMargin: "360px 0px",
        threshold: 0.01
      });

      images.forEach(function (img, index) {
        if (index === 0) return;
        state.observer.observe(img);
      });
    }

    function getMapProjectTemplateImageViewerPointerList() {
      return Object.keys(mapProjectTemplateImageViewerState.pointers).map(function (id) {
        var point = mapProjectTemplateImageViewerState.pointers[id];
        return {
          id: Number(id),
          x: point.x,
          y: point.y
        };
      });
    }

    function clearMapProjectTemplateImageViewerPointers() {
      mapProjectTemplateImageViewerState.pointers = {};
      mapProjectTemplateImageViewerState.dragPointerId = -1;
      mapProjectTemplateImageViewerState.pinchInitialDist = 0;
      mapProjectTemplateImageViewerState.pinchInitialScale = mapProjectTemplateImageViewerState.scale;
      mapProjectTemplateImageViewerState.pinchWorldX = 0;
      mapProjectTemplateImageViewerState.pinchWorldY = 0;
      if (mapProjectTemplateImageViewerState.rootEl) {
        mapProjectTemplateImageViewerState.rootEl.classList.remove("is-dragging");
      }
    }

    function syncMapProjectTemplateImageViewerViewportSize() {
      var viewer = mapProjectTemplateImageViewerState;
      if (!viewer.viewportEl) return;
      var rect = viewer.viewportEl.getBoundingClientRect();
      viewer.viewportWidth = rect.width;
      viewer.viewportHeight = rect.height;
    }

    function clampMapProjectTemplateImageViewerPan() {
      var viewer = mapProjectTemplateImageViewerState;
      if (!(viewer.viewportWidth > 0) || !(viewer.viewportHeight > 0)) return;
      var scaledW = viewer.baseWidth * viewer.scale;
      var scaledH = viewer.baseHeight * viewer.scale;
      var maxX = Math.max(0, (scaledW - viewer.viewportWidth) * 0.5);
      var maxY = Math.max(0, (scaledH - viewer.viewportHeight) * 0.5);
      viewer.tx = maxX > 0.5 ? clampNumber(viewer.tx, -maxX, maxX) : 0;
      viewer.ty = maxY > 0.5 ? clampNumber(viewer.ty, -maxY, maxY) : 0;
    }

    function applyMapProjectTemplateImageViewerTransform() {
      var viewer = mapProjectTemplateImageViewerState;
      if (!viewer.canvasEl) return;
      viewer.canvasEl.style.transform =
        "translate(-50%, -50%) translate3d(" + viewer.tx.toFixed(3) + "px, " + viewer.ty.toFixed(3) + "px, 0) scale(" + viewer.scale.toFixed(5) + ")";
      if (viewer.rootEl) {
        viewer.rootEl.classList.toggle("is-zoomed", viewer.scale > (viewer.minScale + 0.001));
      }
    }

    function fitMapProjectTemplateImageViewerImage(resetTransform) {
      var viewer = mapProjectTemplateImageViewerState;
      if (!viewer.imageEl || !viewer.canvasEl) return;
      var naturalW = viewer.imageEl.naturalWidth || 0;
      var naturalH = viewer.imageEl.naturalHeight || 0;
      if (!(naturalW > 0) || !(naturalH > 0)) return;
      syncMapProjectTemplateImageViewerViewportSize();
      if (!(viewer.viewportWidth > 0) || !(viewer.viewportHeight > 0)) return;

      var fitScale = Math.min(viewer.viewportWidth / naturalW, viewer.viewportHeight / naturalH);
      if (!isFinite(fitScale) || fitScale <= 0) fitScale = 1;
      viewer.baseWidth = Math.max(1, naturalW * fitScale);
      viewer.baseHeight = Math.max(1, naturalH * fitScale);
      viewer.canvasEl.style.width = viewer.baseWidth.toFixed(3) + "px";
      viewer.canvasEl.style.height = viewer.baseHeight.toFixed(3) + "px";

      if (resetTransform) {
        viewer.scale = viewer.minScale;
        viewer.tx = 0;
        viewer.ty = 0;
      } else {
        viewer.scale = clampNumber(viewer.scale, viewer.minScale, viewer.maxScale);
      }
      clampMapProjectTemplateImageViewerPan();
      applyMapProjectTemplateImageViewerTransform();
    }

    function zoomMapProjectTemplateImageViewerTo(clientX, clientY, requestedScale) {
      var viewer = mapProjectTemplateImageViewerState;
      if (!viewer.viewportEl || !viewer.isOpen) return;
      syncMapProjectTemplateImageViewerViewportSize();
      if (!(viewer.viewportWidth > 0) || !(viewer.viewportHeight > 0)) return;

      var nextScale = clampNumber(requestedScale, viewer.minScale, viewer.maxScale);
      if (Math.abs(nextScale - viewer.scale) < 0.0001) return;

      var rect = viewer.viewportEl.getBoundingClientRect();
      var localX = clientX - rect.left;
      var localY = clientY - rect.top;
      var offsetX = localX - (viewer.viewportWidth * 0.5);
      var offsetY = localY - (viewer.viewportHeight * 0.5);
      var worldX = (offsetX - viewer.tx) / viewer.scale;
      var worldY = (offsetY - viewer.ty) / viewer.scale;

      viewer.scale = nextScale;
      viewer.tx = offsetX - (worldX * nextScale);
      viewer.ty = offsetY - (worldY * nextScale);
      clampMapProjectTemplateImageViewerPan();
      applyMapProjectTemplateImageViewerTransform();
    }

    function updateMapProjectTemplateImageViewerPinch() {
      var viewer = mapProjectTemplateImageViewerState;
      var pointers = getMapProjectTemplateImageViewerPointerList();
      if (pointers.length < 2 || !viewer.viewportEl || !viewer.isOpen) return;
      var first = pointers[0];
      var second = pointers[1];
      var dx = second.x - first.x;
      var dy = second.y - first.y;
      var distance = Math.sqrt((dx * dx) + (dy * dy));
      if (!(distance > 0)) return;
      var midpointX = (first.x + second.x) * 0.5;
      var midpointY = (first.y + second.y) * 0.5;

      syncMapProjectTemplateImageViewerViewportSize();
      var rect = viewer.viewportEl.getBoundingClientRect();
      var offsetX = (midpointX - rect.left) - (viewer.viewportWidth * 0.5);
      var offsetY = (midpointY - rect.top) - (viewer.viewportHeight * 0.5);

      if (!(viewer.pinchInitialDist > 0)) {
        viewer.pinchInitialDist = distance;
        viewer.pinchInitialScale = viewer.scale;
        viewer.pinchWorldX = (offsetX - viewer.tx) / viewer.scale;
        viewer.pinchWorldY = (offsetY - viewer.ty) / viewer.scale;
        return;
      }

      var nextScale = viewer.pinchInitialScale * (distance / viewer.pinchInitialDist);
      nextScale = clampNumber(nextScale, viewer.minScale, viewer.maxScale);
      viewer.scale = nextScale;
      viewer.tx = offsetX - (viewer.pinchWorldX * nextScale);
      viewer.ty = offsetY - (viewer.pinchWorldY * nextScale);
      clampMapProjectTemplateImageViewerPan();
      applyMapProjectTemplateImageViewerTransform();
    }

    function handleMapProjectTemplateImageViewerWheel(event) {
      var viewer = mapProjectTemplateImageViewerState;
      if (!viewer.isOpen) return;
      event.preventDefault();
      event.stopPropagation();
      if (!isFinite(event.deltaY) || event.deltaY === 0) return;
      var factor = Math.exp(-event.deltaY * 0.0018);
      zoomMapProjectTemplateImageViewerTo(event.clientX, event.clientY, viewer.scale * factor);
    }

    function handleMapProjectTemplateImageViewerDblClick(event) {
      var viewer = mapProjectTemplateImageViewerState;
      if (!viewer.isOpen) return;
      event.preventDefault();
      event.stopPropagation();
      var targetScale = viewer.scale < 1.8 ? 2.2 : viewer.minScale;
      zoomMapProjectTemplateImageViewerTo(event.clientX, event.clientY, targetScale);
    }

    function handleMapProjectTemplateImageViewerPointerDown(event) {
      var viewer = mapProjectTemplateImageViewerState;
      if (!viewer.isOpen || !viewer.viewportEl) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      viewer.pointers[String(event.pointerId)] = {
        x: event.clientX,
        y: event.clientY
      };

      if (typeof viewer.viewportEl.setPointerCapture === "function") {
        try {
          viewer.viewportEl.setPointerCapture(event.pointerId);
        } catch (error) {}
      }

      var pointers = getMapProjectTemplateImageViewerPointerList();
      if (pointers.length >= 2) {
        viewer.dragPointerId = -1;
        viewer.pinchInitialDist = 0;
        if (viewer.rootEl) viewer.rootEl.classList.remove("is-dragging");
        updateMapProjectTemplateImageViewerPinch();
        return;
      }

      viewer.dragPointerId = event.pointerId;
      viewer.dragStartX = event.clientX;
      viewer.dragStartY = event.clientY;
      viewer.dragStartTx = viewer.tx;
      viewer.dragStartTy = viewer.ty;
      if (viewer.rootEl) viewer.rootEl.classList.add("is-dragging");
    }

    function handleMapProjectTemplateImageViewerPointerMove(event) {
      var viewer = mapProjectTemplateImageViewerState;
      if (!viewer.isOpen) return;
      var key = String(event.pointerId);
      if (!viewer.pointers[key]) return;
      event.preventDefault();
      event.stopPropagation();
      viewer.pointers[key].x = event.clientX;
      viewer.pointers[key].y = event.clientY;

      var pointers = getMapProjectTemplateImageViewerPointerList();
      if (pointers.length >= 2) {
        viewer.dragPointerId = -1;
        if (viewer.rootEl) viewer.rootEl.classList.remove("is-dragging");
        updateMapProjectTemplateImageViewerPinch();
        return;
      }

      if (viewer.dragPointerId !== event.pointerId) return;
      viewer.tx = viewer.dragStartTx + (event.clientX - viewer.dragStartX);
      viewer.ty = viewer.dragStartTy + (event.clientY - viewer.dragStartY);
      clampMapProjectTemplateImageViewerPan();
      applyMapProjectTemplateImageViewerTransform();
    }

    function handleMapProjectTemplateImageViewerPointerEnd(event) {
      var viewer = mapProjectTemplateImageViewerState;
      if (!viewer.isOpen) return;
      var key = String(event.pointerId);
      if (!viewer.pointers[key]) return;
      event.preventDefault();
      event.stopPropagation();
      delete viewer.pointers[key];
      if (viewer.viewportEl && typeof viewer.viewportEl.releasePointerCapture === "function") {
        try {
          viewer.viewportEl.releasePointerCapture(event.pointerId);
        } catch (error) {}
      }

      var pointers = getMapProjectTemplateImageViewerPointerList();
      if (pointers.length >= 2) {
        viewer.pinchInitialDist = 0;
        updateMapProjectTemplateImageViewerPinch();
        return;
      }

      viewer.pinchInitialDist = 0;
      if (!pointers.length) {
        viewer.dragPointerId = -1;
        if (viewer.rootEl) viewer.rootEl.classList.remove("is-dragging");
        return;
      }

      var remaining = pointers[0];
      viewer.dragPointerId = remaining.id;
      viewer.dragStartX = remaining.x;
      viewer.dragStartY = remaining.y;
      viewer.dragStartTx = viewer.tx;
      viewer.dragStartTy = viewer.ty;
      if (viewer.rootEl) viewer.rootEl.classList.add("is-dragging");
    }

    function handleMapProjectTemplateImageViewerKeydown(event) {
      var viewer = mapProjectTemplateImageViewerState;
      if (!viewer.isOpen) return;
      var target = event.target;
      var isTypingTarget = target && (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      );
      if (isTypingTarget) return;

      var handled = false;
      if (event.key === "Escape") {
        dismissMapProjectTemplateImageViewer();
        handled = true;
      } else if (event.key === "+" || event.key === "=" || event.key === "NumpadAdd") {
        var plusRect = viewer.viewportEl ? viewer.viewportEl.getBoundingClientRect() : null;
        if (plusRect) {
          zoomMapProjectTemplateImageViewerTo(
            plusRect.left + (plusRect.width * 0.5),
            plusRect.top + (plusRect.height * 0.5),
            viewer.scale * 1.18
          );
          handled = true;
        }
      } else if (event.key === "-" || event.key === "_" || event.key === "NumpadSubtract") {
        var minusRect = viewer.viewportEl ? viewer.viewportEl.getBoundingClientRect() : null;
        if (minusRect) {
          zoomMapProjectTemplateImageViewerTo(
            minusRect.left + (minusRect.width * 0.5),
            minusRect.top + (minusRect.height * 0.5),
            viewer.scale / 1.18
          );
          handled = true;
        }
      } else if (event.key === "0") {
        viewer.scale = viewer.minScale;
        viewer.tx = 0;
        viewer.ty = 0;
        applyMapProjectTemplateImageViewerTransform();
        handled = true;
      } else if (event.key === "ArrowLeft") {
        viewer.tx += 48;
        clampMapProjectTemplateImageViewerPan();
        applyMapProjectTemplateImageViewerTransform();
        handled = true;
      } else if (event.key === "ArrowRight") {
        viewer.tx -= 48;
        clampMapProjectTemplateImageViewerPan();
        applyMapProjectTemplateImageViewerTransform();
        handled = true;
      } else if (event.key === "ArrowUp") {
        viewer.ty += 48;
        clampMapProjectTemplateImageViewerPan();
        applyMapProjectTemplateImageViewerTransform();
        handled = true;
      } else if (event.key === "ArrowDown") {
        viewer.ty -= 48;
        clampMapProjectTemplateImageViewerPan();
        applyMapProjectTemplateImageViewerTransform();
        handled = true;
      }

      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    function ensureMapProjectTemplateImageViewer() {
      var viewer = mapProjectTemplateImageViewerState;
      if (viewer.rootEl && viewer.rootEl.isConnected) return viewer.rootEl;

      var root = document.createElement("div");
      root.className = "map-project-template-image-viewer";
      root.hidden = true;
      root.setAttribute("aria-hidden", "true");
      root.setAttribute("role", "dialog");
      root.setAttribute("aria-modal", "true");
      root.setAttribute("aria-label", "Image viewer");
      root.innerHTML = [
        '<div class="map-project-template-image-viewer-backdrop" data-viewer-close="true"></div>',
        '<button type="button" class="map-project-template-image-viewer-close" aria-label="Close image viewer">&times;</button>',
        '<div class="map-project-template-image-viewer-viewport" aria-live="polite">',
        '<div class="map-project-template-image-viewer-canvas">',
        '<img class="map-project-template-image-viewer-image" alt="" loading="eager" decoding="async" draggable="false" />',
        "</div>",
        "</div>"
      ].join("");
      document.body.appendChild(root);

      viewer.rootEl = root;
      viewer.backdropEl = root.querySelector(".map-project-template-image-viewer-backdrop");
      viewer.viewportEl = root.querySelector(".map-project-template-image-viewer-viewport");
      viewer.canvasEl = root.querySelector(".map-project-template-image-viewer-canvas");
      viewer.imageEl = root.querySelector(".map-project-template-image-viewer-image");
      viewer.closeBtnEl = root.querySelector(".map-project-template-image-viewer-close");

      if (viewer.backdropEl) {
        viewer.backdropEl.addEventListener("click", function () {
          dismissMapProjectTemplateImageViewer();
        });
      }
      if (viewer.closeBtnEl) {
        viewer.closeBtnEl.addEventListener("click", function () {
          dismissMapProjectTemplateImageViewer();
        });
      }
      root.addEventListener("wheel", function (event) {
        if (!viewer.isOpen) return;
        event.preventDefault();
        event.stopPropagation();
      }, { passive: false });

      if (viewer.imageEl) {
        viewer.imageEl.addEventListener("load", function () {
          fitMapProjectTemplateImageViewerImage(true);
        });
        viewer.imageEl.addEventListener("dragstart", function (event) {
          event.preventDefault();
        });
      }

      if (viewer.viewportEl) {
        viewer.viewportEl.addEventListener("wheel", handleMapProjectTemplateImageViewerWheel, { passive: false });
        viewer.viewportEl.addEventListener("dblclick", handleMapProjectTemplateImageViewerDblClick);
        viewer.viewportEl.addEventListener("pointerdown", handleMapProjectTemplateImageViewerPointerDown);
        viewer.viewportEl.addEventListener("pointermove", handleMapProjectTemplateImageViewerPointerMove);
        viewer.viewportEl.addEventListener("pointerup", handleMapProjectTemplateImageViewerPointerEnd);
        viewer.viewportEl.addEventListener("pointercancel", handleMapProjectTemplateImageViewerPointerEnd);
        viewer.viewportEl.addEventListener("lostpointercapture", handleMapProjectTemplateImageViewerPointerEnd);
      }

      if (!viewer.keydownBound) {
        document.addEventListener("keydown", handleMapProjectTemplateImageViewerKeydown, true);
        viewer.keydownBound = true;
      }

      window.addEventListener("resize", function () {
        if (!viewer.isOpen) return;
        fitMapProjectTemplateImageViewerImage(false);
      });

      return viewer.rootEl;
    }

    function dismissMapProjectTemplateImageViewer() {
      var viewer = mapProjectTemplateImageViewerState;
      if (!viewer.rootEl || !viewer.isOpen) return;
      viewer.isOpen = false;
      clearMapProjectTemplateImageViewerPointers();
      viewer.scale = viewer.minScale;
      viewer.tx = 0;
      viewer.ty = 0;
      viewer.rootEl.hidden = true;
      viewer.rootEl.setAttribute("aria-hidden", "true");
      viewer.rootEl.classList.remove("is-open", "is-zoomed");
      document.documentElement.classList.remove("map-project-template-image-viewer-open");
      if (viewer.imageEl) {
        viewer.imageEl.removeAttribute("src");
        viewer.imageEl.alt = "";
      }
    }

    function openMapProjectTemplateImageViewer(src, alt) {
      var imageSrc = String(src || "").trim();
      if (!imageSrc) return;
      var root = ensureMapProjectTemplateImageViewer();
      if (!root) return;
      var viewer = mapProjectTemplateImageViewerState;
      clearMapProjectTemplateImageViewerPointers();
      viewer.isOpen = true;
      viewer.scale = viewer.minScale;
      viewer.tx = 0;
      viewer.ty = 0;
      root.hidden = false;
      root.setAttribute("aria-hidden", "false");
      root.classList.add("is-open");
      document.documentElement.classList.add("map-project-template-image-viewer-open");
      if (viewer.imageEl) {
        viewer.imageEl.alt = alt ? String(alt) : "Project image";
        if (viewer.imageEl.getAttribute("src") !== imageSrc) {
          viewer.imageEl.src = imageSrc;
        } else if (viewer.imageEl.complete && viewer.imageEl.naturalWidth > 0) {
          fitMapProjectTemplateImageViewerImage(true);
        }
      }
      syncMapProjectTemplateImageViewerViewportSize();
      applyMapProjectTemplateImageViewerTransform();
    }

    function bindMapProjectTemplateGalleryZoomTriggers() {
      if (!mapProjectTemplateRoot) return;
      if (mapProjectTemplateRoot.getAttribute("data-gallery-zoom-bound") === "true") return;
      mapProjectTemplateRoot.setAttribute("data-gallery-zoom-bound", "true");
      mapProjectTemplateRoot.addEventListener("click", function (event) {
        var target = event.target;
        if (!target || !target.closest) return;
        var trigger = target.closest(".map-project-template-gallery-zoom-trigger");
        if (!trigger || !mapProjectTemplateRoot.contains(trigger)) return;
        event.preventDefault();
        event.stopPropagation();
        openMapProjectTemplateImageViewer(
          trigger.getAttribute("data-viewer-src") || "",
          trigger.getAttribute("data-viewer-alt") || ""
        );
      });
    }

    function clearMapProjectDetailChromeThemeState() {
      if (mapProjectDetailChromeThemeRaf) {
        window.cancelAnimationFrame(mapProjectDetailChromeThemeRaf);
        mapProjectDetailChromeThemeRaf = 0;
      }
      mapProjectDetailTopbar.classList.remove("is-on-dark");
      mapProjectDetailTopbar.classList.remove("is-on-muted");
      mapProjectNav.classList.remove("is-on-dark");
      mapProjectNav.classList.remove("is-on-muted");
    }

    function isMapProjectChromeSectionVisible(sectionEl) {
      if (!sectionEl || sectionEl.hidden) return false;
      var style = window.getComputedStyle(sectionEl);
      if (!style || style.display === "none" || style.visibility === "hidden") return false;
      var rect = sectionEl.getBoundingClientRect();
      return rect.height > 0.5;
    }

    function getMapProjectChromeToneAtViewportY(viewportY) {
      if (mapProjectShell.classList.contains("map-project-shell--veritas")) {
        var darkSections = [mapProjectDetailSectionA, mapProjectDetailSectionC];
        for (var i = 0; i < darkSections.length; i += 1) {
          var darkSectionEl = darkSections[i];
          if (!isMapProjectChromeSectionVisible(darkSectionEl)) continue;
          var darkRect = darkSectionEl.getBoundingClientRect();
          if (viewportY >= darkRect.top && viewportY <= darkRect.bottom) {
            return "dark";
          }
        }
      }

      if (mapProjectShell.classList.contains("map-project-shell--opentrace") && mapProjectOpenTraceRoot && !mapProjectOpenTraceRoot.hidden) {
        var mutedSectionEl = mapProjectOpenTraceRoot.querySelector(".map-project-opentrace-sequence-block");
        if (isMapProjectChromeSectionVisible(mutedSectionEl)) {
          var mutedRect = mutedSectionEl.getBoundingClientRect();
          if (viewportY >= mutedRect.top && viewportY <= mutedRect.bottom) {
            return "muted";
          }
        }
      }

      return "light";
    }

    function applyMapProjectChromeTone(el, tone) {
      if (!el) return;
      el.classList.toggle("is-on-dark", tone === "dark");
      el.classList.toggle("is-on-muted", tone === "muted");
    }

    function syncMapProjectDetailChromeTheme() {
      mapProjectDetailChromeThemeRaf = 0;
      var isOpen = document.documentElement.classList.contains("map-project-open");
      if (!isOpen || mapProjectShell.hidden) {
        clearMapProjectDetailChromeThemeState();
        return;
      }
      var scrollRect = mapProjectScroll.getBoundingClientRect();
      if (scrollRect.height <= 1) {
        clearMapProjectDetailChromeThemeState();
        return;
      }
      var topbarRect = mapProjectDetailTopbar.getBoundingClientRect();
      var topSampleOffset = topbarRect.height > 1
        ? Math.min(Math.max(1, topbarRect.height * 0.5), Math.max(1, scrollRect.height - 1))
        : 1;
      var topSampleY = scrollRect.top + topSampleOffset;
      var navSampleY = scrollRect.bottom - 1;
      var topTone = getMapProjectChromeToneAtViewportY(topSampleY);
      var navTone = getMapProjectChromeToneAtViewportY(navSampleY);
      applyMapProjectChromeTone(mapProjectDetailTopbar, topTone);
      applyMapProjectChromeTone(mapProjectNav, navTone);
    }

    function scheduleSyncMapProjectDetailChromeTheme() {
      if (mapProjectDetailChromeThemeRaf) {
        window.cancelAnimationFrame(mapProjectDetailChromeThemeRaf);
      }
      mapProjectDetailChromeThemeRaf = window.requestAnimationFrame(syncMapProjectDetailChromeTheme);
    }

    if (mapProjectDetailVisualLeft) {
      bindMapProjectDetailVideoHoverControls(
        mapProjectDetailVisualLeft,
        mapProjectDetailVisualLeft.closest(".map-project-detail-figure") || mapProjectDetailVisualLeft,
        {
          keepVisibleUntilPlayed: true,
          forceVisibleWithoutHover: true
        }
      );
    }

    function setMapProjectDetailVisual(el, src, alt, mediaType, posterSrc) {
      if (!el) return;
      var type = String(mediaType || "").toLowerCase();
      if (el.tagName === "VIDEO") {
        var fallbackPoster = el.getAttribute("data-default-poster") || "";
        var resolvedPoster = posterSrc ? String(posterSrc) : fallbackPoster;
        el.autoplay = false;
        el.muted = false;
        el.playsInline = true;
        el.preload = "none";
        if (alt) {
          el.setAttribute("aria-label", alt);
        } else {
          el.removeAttribute("aria-label");
        }
        if (type === "video" && src) {
          el.hidden = false;
          if (resolvedPoster) {
            el.poster = resolvedPoster;
          } else {
            el.removeAttribute("poster");
          }
          el.src = src;
          if (typeof el.load === "function") el.load();
        } else {
          if (typeof el.pause === "function") el.pause();
          el.removeAttribute("src");
          if (src) {
            el.hidden = false;
            el.poster = src;
          } else {
            el.removeAttribute("poster");
            el.hidden = true;
          }
          if (typeof el.load === "function") el.load();
        }
        return;
      }
      if (src) {
        el.hidden = false;
        el.src = src;
      } else {
        el.removeAttribute("src");
        el.hidden = true;
      }
      el.alt = alt || "";
    }

    function setMapProjectDetailTitleBadge(src, href, alt) {
      if (!mapProjectDetailTitleBadge || !mapProjectDetailTitleBadgeLink) return;
      var cleanSrc = src ? String(src).trim() : "";
      var cleanAlt = alt ? String(alt).trim() : "";
      if (cleanSrc) {
        setMapProjectDetailExternalLink(
          mapProjectDetailTitleBadgeLink,
          href,
          "Next Gen Design",
          cleanSrc
        );
        mapProjectDetailTitleBadgeLink.hidden = false;
        mapProjectDetailTitleBadgeLink.setAttribute("aria-hidden", "false");
        mapProjectDetailTitleBadge.hidden = false;
        mapProjectDetailTitleBadge.src = cleanSrc;
        mapProjectDetailTitleBadge.alt = cleanAlt;
        return;
      }
      setMapProjectDetailExternalLink(mapProjectDetailTitleBadgeLink, "", "", "");
      mapProjectDetailTitleBadgeLink.hidden = true;
      mapProjectDetailTitleBadgeLink.setAttribute("aria-hidden", "true");
      mapProjectDetailTitleBadge.removeAttribute("src");
      mapProjectDetailTitleBadge.alt = "";
      mapProjectDetailTitleBadge.hidden = true;
    }

    function setMapProjectDetailExternalLink(linkEl, href, previewTitle, previewIcon) {
      if (!linkEl) return;
      var cleanHref = href ? String(href).trim() : "";
      if (cleanHref) {
        linkEl.setAttribute("href", cleanHref);
        linkEl.setAttribute("target", "_blank");
        linkEl.setAttribute("rel", "noopener noreferrer");
        linkEl.removeAttribute("aria-disabled");
        linkEl.tabIndex = 0;
        if (previewTitle) {
          linkEl.setAttribute("data-external-preview-title", previewTitle);
        } else {
          linkEl.removeAttribute("data-external-preview-title");
        }
        if (previewIcon) {
          linkEl.setAttribute("data-external-preview-icon", previewIcon);
        } else {
          linkEl.removeAttribute("data-external-preview-icon");
        }
        return;
      }
      linkEl.removeAttribute("href");
      linkEl.removeAttribute("target");
      linkEl.removeAttribute("rel");
      linkEl.removeAttribute("data-external-preview-title");
      linkEl.removeAttribute("data-external-preview-icon");
      linkEl.setAttribute("aria-disabled", "true");
      linkEl.tabIndex = -1;
    }

    function resetMapProjectDetailHeaderWrapState() {
      if (!mapProjectDetailHeader || !mapProjectDetailTitleGroup) return;
      mapProjectDetailHeader.classList.remove("is-title-wrapped");
      mapProjectDetailHeader.style.removeProperty("--map-project-detail-close-runtime-scale");
    }

    function resetMapProjectDetailHeaderCollapseState() {
      if (!mapProjectContent) return;
      mapProjectContent.style.removeProperty("--map-project-detail-header-collapse-progress");
    }

    function getMapProjectDetailActiveScrollTop() {
      if (!mapProjectScroll) return 0;
      var scrollTop = mapProjectScroll.scrollTop;
      if (!isFinite(scrollTop) || scrollTop <= 0) return 0;
      return scrollTop;
    }

    function resetMapProjectDetailDesktopMediaSpacing() {
      if (!mapProjectDetailStage) return;
      mapProjectDetailStage.style.removeProperty("--map-project-detail-desktop-left-figure-top");
      mapProjectDetailStage.style.removeProperty("--map-project-detail-desktop-right-figure-top");
    }

    function clearMapProjectDetailDesktopMediaSpacing() {
      if (mapProjectDetailDesktopMediaRaf) {
        window.cancelAnimationFrame(mapProjectDetailDesktopMediaRaf);
        mapProjectDetailDesktopMediaRaf = 0;
      }
      resetMapProjectDetailDesktopMediaSpacing();
    }

    function resetMapProjectDetailDesktopSectionFlow() {
      if (!mapProjectDetailStage) return;
      mapProjectDetailStage.style.removeProperty("--map-project-detail-section-b-runtime-top");
    }

    function syncMapProjectDetailDesktopSectionFlow() {
      if (!mapProjectDetailStage || !mapProjectDetailSectionA || !mapProjectDetailSectionB) return;
      if (!window.matchMedia("(min-width: 768px)").matches) {
        resetMapProjectDetailDesktopSectionFlow();
        return;
      }
      if (mapProjectDetailSectionA.hidden || mapProjectDetailSectionB.hidden) {
        resetMapProjectDetailDesktopSectionFlow();
        return;
      }
      var sectionAHeight = mapProjectDetailSectionA.offsetHeight;
      var sectionATop = mapProjectDetailSectionA.offsetTop;
      var sectionBStyle = window.getComputedStyle ? window.getComputedStyle(mapProjectDetailSectionB) : null;
      var followingGap = sectionBStyle ? parseFloat(sectionBStyle.getPropertyValue("--map-project-detail-section-b-offset-from-previous")) : NaN;
      var sectionBShiftY = sectionBStyle ? parseFloat(sectionBStyle.getPropertyValue("--map-project-detail-section-b-shift-y")) : NaN;
      if (!isFinite(followingGap)) followingGap = 77;
      if (!isFinite(sectionBShiftY)) sectionBShiftY = 0;
      if (!(sectionAHeight > 0)) {
        resetMapProjectDetailDesktopSectionFlow();
        return;
      }
      mapProjectDetailStage.style.setProperty(
        "--map-project-detail-section-b-runtime-top",
        Math.ceil(sectionATop + sectionAHeight + followingGap + sectionBShiftY) + "px"
      );
    }

    function getMapProjectDetailOffsetTopWithin(node, ancestor) {
      if (!node) return 0;
      var top = 0;
      var current = node;
      while (current && current !== ancestor) {
        top += current.offsetTop || 0;
        current = current.offsetParent;
      }
      if (current === ancestor) return top;
      if (!ancestor || !node.getBoundingClientRect || !ancestor.getBoundingClientRect) return top;
      var ancestorRect = ancestor.getBoundingClientRect();
      var nodeRect = node.getBoundingClientRect();
      return (nodeRect.top - ancestorRect.top) + (ancestor.scrollTop || 0);
    }

    function clearMapProjectDetailSectionBDesktopSceneLock(sceneState, resetVideoState) {
      if (!sceneState) return;
      sceneState.desktopPhase = "before-pin";
      sceneState.desktopPinStartScrollTop = NaN;
      sceneState.desktopPinnedInset = NaN;
      sceneState.desktopReleaseLocked = false;
      sceneState.desktopReverseUnlockScrollTop = NaN;
      sceneState.desktopIsPinned = false;
      sceneState.desktopRuntimeHeight = 0;
      if (resetVideoState !== false) {
        sceneState.desktopPersistentVideoVisible = false;
      }
    }

    function clearMapProjectDetailSectionBResizeFreeze() {
      mapProjectDetailSectionBResizeFrozen = false;
      mapProjectDetailSectionBResizeFreezeScrollTop = 0;
      if (mapProjectDetailSectionB) {
        mapProjectDetailSectionB.classList.remove("is-resize-frozen");
      }
      mapProjectDetailSectionBSceneStates.forEach(function (sceneState) {
        sceneState.resizeFrozen = false;
        sceneState.frozenPhase = "before-pin";
        sceneState.frozenMorphProgress = 0;
        sceneState.frozenHasVideoVisual = false;
        sceneState.frozenRuntimeScrollDistance = 0;
        sceneState.frozenIsPinned = false;
      });
    }

    function freezeMapProjectDetailSectionBResizeState() {
      if (!document.documentElement.classList.contains("map-project-open")) return;
      if (!window.matchMedia("(min-width: 768px)").matches || !mapProjectDetailSectionBSceneStates.length) {
        clearMapProjectDetailSectionBResizeFreeze();
        return;
      }
      mapProjectDetailSectionBResizeFrozen = true;
      mapProjectDetailSectionBResizeFreezeScrollTop = mapProjectScroll ? mapProjectScroll.scrollTop : 0;
      if (mapProjectDetailSectionB) {
        mapProjectDetailSectionB.classList.add("is-resize-frozen");
      }
      mapProjectDetailSectionBSceneStates.forEach(function (sceneState) {
        var sceneStyle = sceneState.sceneEl ? sceneState.sceneEl.style : null;
        var frozenProgress = sceneStyle ? parseFloat(sceneStyle.getPropertyValue("--map-project-detail-scene-progress")) : NaN;
        var frozenRuntimeScrollDistance = sceneStyle ? parseFloat(sceneStyle.getPropertyValue("--map-project-detail-scene-runtime-scroll-distance")) : NaN;
        sceneState.resizeFrozen = true;
        sceneState.frozenPhase = sceneState.desktopPhase || "before-pin";
        sceneState.frozenMorphProgress = isFinite(frozenProgress) ? frozenProgress : 0;
        sceneState.frozenHasVideoVisual = !!sceneState.desktopPersistentVideoVisible ||
          sceneState.sceneEl.getAttribute("data-desktop-visual") === "video";
        sceneState.frozenRuntimeScrollDistance = isFinite(frozenRuntimeScrollDistance) ? frozenRuntimeScrollDistance : 0;
        sceneState.frozenIsPinned = !!sceneState.desktopIsPinned;
      });
    }

    function getMapProjectDetailSectionBDesktopPhase(stickyDistance, motion) {
      var morphStart = motion.holdImagesDistance;
      var morphEnd = morphStart + motion.morphDistance;
      var videoHoldEnd = morphEnd + motion.holdVideoDistance;
      if (!(stickyDistance > 0)) return "before-pin";
      if (stickyDistance < morphStart) return "pinned-images";
      if (stickyDistance < morphEnd) return "morphing";
      if (stickyDistance < videoHoldEnd) return "pinned-video";
      return "released-video";
    }

    function stopMapProjectDetailSectionBVideo(videoEl, resetToStart) {
      if (!videoEl) return;
      try {
        videoEl.pause();
        if (resetToStart !== false) {
          videoEl.currentTime = 0;
        }
      } catch (error) {}
    }

    function warmMapProjectDetailSectionBVideo(sceneState) {
      if (!sceneState || !sceneState.videoEl || sceneState.videoWarmed) return;
      configureMapProjectDetailSectionBVideo(sceneState);
      sceneState.videoWarmed = true;
      try {
        sceneState.videoEl.load();
      } catch (error) {}
    }

    function syncMapProjectDetailSectionBVideoLoadMode(sceneState, isPhone) {
      if (!sceneState || !sceneState.videoEl) return;
      var videoEl = sceneState.videoEl;
      var scenePoster = videoEl.getAttribute("data-scene-poster") || "";
      if (isPhone) {
        videoEl.autoplay = true;
        videoEl.setAttribute("autoplay", "");
        try {
          videoEl.preload = "";
        } catch (error) {}
        videoEl.removeAttribute("preload");
        try {
          videoEl.poster = "";
        } catch (error) {}
        videoEl.removeAttribute("poster");
        return;
      }
      videoEl.autoplay = false;
      videoEl.removeAttribute("autoplay");
      videoEl.preload = "metadata";
      videoEl.setAttribute("preload", "metadata");
      if (scenePoster) {
        try {
          videoEl.poster = scenePoster;
        } catch (error) {}
        videoEl.setAttribute("poster", scenePoster);
      } else {
        try {
          videoEl.poster = "";
        } catch (error) {}
        videoEl.removeAttribute("poster");
      }
    }

    function setMapProjectDetailSectionBVideoFailureState(sceneState, hasFailure) {
      if (!sceneState || !sceneState.sceneEl) return;
      sceneState.videoFailed = !!hasFailure;
      sceneState.sceneEl.classList.toggle("is-video-fallback", !!hasFailure);
    }

    function setMapProjectDetailSectionBVideoPinnedControls(sceneState, pinned) {
      if (!sceneState || !sceneState.videoEl) return;
      sceneState.videoControlsPinned = !!pinned;
      setMapProjectDetailVideoHoverControls(sceneState.videoEl, false, !!pinned);
    }

    function clearMapProjectDetailSectionBVideoPending(sceneState) {
      if (!sceneState || !sceneState.videoEl) return;
      if (sceneState.videoRetryTimerId) {
        window.clearTimeout(sceneState.videoRetryTimerId);
        sceneState.videoRetryTimerId = 0;
      }
      if (sceneState.videoReadyRetryHandler) {
        sceneState.videoEl.removeEventListener("loadedmetadata", sceneState.videoReadyRetryHandler);
        sceneState.videoEl.removeEventListener("canplay", sceneState.videoReadyRetryHandler);
        sceneState.videoReadyRetryHandler = null;
      }
    }

    function shouldRetryMapProjectDetailSectionBVideoPlayback(sceneState, error) {
      if (!sceneState || !sceneState.videoEl) return false;
      var videoEl = sceneState.videoEl;
      if (videoEl.error) return false;
      var errorName = error && error.name ? String(error.name) : "";
      if (errorName === "AbortError") return true;
      if (videoEl.readyState < 2) return true;
      if (videoEl.networkState === 0 || videoEl.networkState === 2) return true;
      return false;
    }

    function hasMapProjectDetailSectionBVideoFatalError(videoEl) {
      if (!videoEl || !videoEl.error || !videoEl.error.code) return false;
      var errorCode = videoEl.error.code;
      return errorCode === 3 || errorCode === 4;
    }

    function scheduleMapProjectDetailSectionBVideoRetry(sceneState) {
      if (!sceneState || !sceneState.videoEl) return;
      clearMapProjectDetailSectionBVideoPending(sceneState);
      sceneState.videoReadyRetryHandler = function () {
        clearMapProjectDetailSectionBVideoPending(sceneState);
        playMapProjectDetailSectionBVideo(sceneState);
      };
      sceneState.videoEl.addEventListener("loadedmetadata", sceneState.videoReadyRetryHandler, { once: true });
      sceneState.videoEl.addEventListener("canplay", sceneState.videoReadyRetryHandler, { once: true });
      sceneState.videoRetryTimerId = window.setTimeout(function () {
        sceneState.videoRetryTimerId = 0;
        if (!sceneState.videoReadyRetryHandler) return;
        var retryHandler = sceneState.videoReadyRetryHandler;
        clearMapProjectDetailSectionBVideoPending(sceneState);
        retryHandler();
      }, 180);
    }

    function logMapProjectDetailSectionBVideoIssue(sceneState, label, error) {
      var videoEl = sceneState && sceneState.videoEl ? sceneState.videoEl : null;
      console.warn(
        "Veritas section-b video " + label,
        {
          sceneIndex: sceneState ? sceneState.sceneIndex : -1,
          errorName: error && error.name ? error.name : "",
          readyState: videoEl ? videoEl.readyState : -1,
          networkState: videoEl ? videoEl.networkState : -1,
          mediaErrorCode: videoEl && videoEl.error ? videoEl.error.code : 0
        }
      );
    }

    function configureMapProjectDetailSectionBVideo(sceneState) {
      if (!sceneState || !sceneState.videoEl || sceneState.videoConfigured) return;
      var videoEl = sceneState.videoEl;
      sceneState.videoConfigured = true;
      videoEl.muted = true;
      videoEl.defaultMuted = true;
      videoEl.loop = true;
      videoEl.playsInline = true;
      videoEl.setAttribute("muted", "");
      videoEl.setAttribute("playsinline", "");
      videoEl.setAttribute("webkit-playsinline", "");
      videoEl.addEventListener("loadeddata", function () {
        sceneState.videoPlayAttempts = 0;
        setMapProjectDetailSectionBVideoFailureState(sceneState, false);
      });
      videoEl.addEventListener("loadedmetadata", function () {
        sceneState.videoPlayAttempts = 0;
        setMapProjectDetailSectionBVideoFailureState(sceneState, false);
      });
      videoEl.addEventListener("canplay", function () {
        sceneState.videoPlayAttempts = 0;
        setMapProjectDetailSectionBVideoFailureState(sceneState, false);
      });
      videoEl.addEventListener("playing", function () {
        sceneState.videoPlayAttempts = 0;
        clearMapProjectDetailSectionBVideoPending(sceneState);
        setMapProjectDetailSectionBVideoPinnedControls(sceneState, false);
        setMapProjectDetailSectionBVideoFailureState(sceneState, false);
      });
      videoEl.addEventListener("error", function () {
        clearMapProjectDetailSectionBVideoPending(sceneState);
        if (hasMapProjectDetailSectionBVideoFatalError(videoEl)) {
          setMapProjectDetailSectionBVideoPinnedControls(sceneState, false);
          setMapProjectDetailSectionBVideoFailureState(sceneState, true);
          logMapProjectDetailSectionBVideoIssue(sceneState, "fatal error event", videoEl.error || null);
          return;
        }
        logMapProjectDetailSectionBVideoIssue(sceneState, "non-fatal error event", videoEl.error || null);
      });
    }

    function playMapProjectDetailSectionBVideo(sceneState) {
      if (!sceneState || !sceneState.videoEl) return;
      if (sceneState.videoFailed) return;
      configureMapProjectDetailSectionBVideo(sceneState);
      warmMapProjectDetailSectionBVideo(sceneState);
      clearMapProjectDetailSectionBVideoPending(sceneState);
      if (sceneState.videoEl.readyState < 1) {
        scheduleMapProjectDetailSectionBVideoRetry(sceneState);
        return;
      }
      if (!sceneState.videoEl.paused) return;
      var playResult = null;
      sceneState.videoPlayAttempts += 1;
      try {
        playResult = sceneState.videoEl.play();
      } catch (error) {
        if (shouldRetryMapProjectDetailSectionBVideoPlayback(sceneState, error) && sceneState.videoPlayAttempts < 4) {
          logMapProjectDetailSectionBVideoIssue(sceneState, "retry scheduled after sync play failure", error);
          scheduleMapProjectDetailSectionBVideoRetry(sceneState);
          return;
        }
        if (!hasMapProjectDetailSectionBVideoFatalError(sceneState.videoEl)) {
          setMapProjectDetailSectionBVideoFailureState(sceneState, false);
          setMapProjectDetailSectionBVideoPinnedControls(sceneState, true);
          logMapProjectDetailSectionBVideoIssue(sceneState, "non-fatal playback failure; controls pinned", error);
          return;
        }
        setMapProjectDetailSectionBVideoPinnedControls(sceneState, false);
        setMapProjectDetailSectionBVideoFailureState(sceneState, true);
        logMapProjectDetailSectionBVideoIssue(sceneState, "playback failed", error);
        return;
      }
      if (playResult && typeof playResult.catch === "function") {
        playResult.catch(function (error) {
          if (shouldRetryMapProjectDetailSectionBVideoPlayback(sceneState, error) && sceneState.videoPlayAttempts < 4) {
            logMapProjectDetailSectionBVideoIssue(sceneState, "retry scheduled after async play failure", error);
            scheduleMapProjectDetailSectionBVideoRetry(sceneState);
            return;
          }
          if (!hasMapProjectDetailSectionBVideoFatalError(sceneState.videoEl)) {
            setMapProjectDetailSectionBVideoFailureState(sceneState, false);
            setMapProjectDetailSectionBVideoPinnedControls(sceneState, true);
            logMapProjectDetailSectionBVideoIssue(sceneState, "non-fatal async playback failure; controls pinned", error);
            return;
          }
          setMapProjectDetailSectionBVideoPinnedControls(sceneState, false);
          setMapProjectDetailSectionBVideoFailureState(sceneState, true);
          logMapProjectDetailSectionBVideoIssue(sceneState, "playback failed", error);
        });
      }
    }

    function setMapProjectDetailVideoHoverControls(videoEl, enabled, forceVisibleWithoutHover) {
      if (!videoEl) return;
      if (forceVisibleWithoutHover) {
        videoEl.controls = true;
        videoEl.setAttribute("controlslist", "nodownload noplaybackrate");
        return;
      }
      if (!canHover) {
        videoEl.controls = false;
        videoEl.removeAttribute("controlslist");
        return;
      }
      if (!enabled && document.fullscreenElement && (document.fullscreenElement === videoEl || document.fullscreenElement.contains(videoEl))) {
        return;
      }
      videoEl.controls = !!enabled;
      if (enabled) {
        videoEl.setAttribute("controlslist", "nodownload noplaybackrate");
      } else {
        videoEl.removeAttribute("controlslist");
      }
    }

    function bindMapProjectDetailVideoHoverControls(videoEl, hoverTarget, options) {
      if (!videoEl || !hoverTarget || hoverTarget.__mapProjectHoverControlsBound) return;
      options = options || {};
      var keepVisibleUntilPlayed = !!options.keepVisibleUntilPlayed;
      var forceVisibleWithoutHover = !!options.forceVisibleWithoutHover;
      var hasPlayed = !keepVisibleUntilPlayed;
      hoverTarget.__mapProjectHoverControlsBound = true;
      setMapProjectDetailVideoHoverControls(videoEl, keepVisibleUntilPlayed, forceVisibleWithoutHover);

      function isControlBarZoneClick(event) {
        if (!forceVisibleWithoutHover) return false;
        if (!event || typeof event.clientY !== "number") return false;
        var rect = videoEl.getBoundingClientRect();
        if (!rect || !(rect.height > 0)) return false;
        var controlBarHeight = Math.max(40, Math.min(72, rect.height * 0.16));
        return event.clientY >= (rect.bottom - controlBarHeight);
      }

      function toggleVideoPlaybackFromUserGesture(event) {
        if (!event) return;
        if (event.__mapProjectVideoToggleHandled) return;
        if (typeof event.button === "number" && event.button !== 0) return;
        if (isControlBarZoneClick(event)) return;

        event.__mapProjectVideoToggleHandled = true;
        if (typeof event.preventDefault === "function") event.preventDefault();
        if (typeof event.stopPropagation === "function") event.stopPropagation();

        if (videoEl.paused || videoEl.ended) {
          var playResult = null;
          try {
            playResult = videoEl.play();
          } catch (error) {
            return;
          }
          if (playResult && typeof playResult.catch === "function") {
            playResult.catch(function () {});
          }
          return;
        }

        try {
          videoEl.pause();
        } catch (error) {}
      }

      hoverTarget.addEventListener("click", toggleVideoPlaybackFromUserGesture, true);
      videoEl.addEventListener("click", toggleVideoPlaybackFromUserGesture, true);

      hoverTarget.addEventListener("mouseenter", function () {
        setMapProjectDetailVideoHoverControls(videoEl, true, forceVisibleWithoutHover);
      });

      hoverTarget.addEventListener("mouseleave", function () {
        if (!hasPlayed && keepVisibleUntilPlayed) return;
        setMapProjectDetailVideoHoverControls(videoEl, false, forceVisibleWithoutHover);
      });

      hoverTarget.addEventListener("focusin", function () {
        setMapProjectDetailVideoHoverControls(videoEl, true, forceVisibleWithoutHover);
      });

      hoverTarget.addEventListener("focusout", function () {
        window.requestAnimationFrame(function () {
          if (hoverTarget.contains(document.activeElement)) return;
          if (!hasPlayed && keepVisibleUntilPlayed) return;
          setMapProjectDetailVideoHoverControls(videoEl, false, forceVisibleWithoutHover);
        });
      });

      if (keepVisibleUntilPlayed) {
        videoEl.addEventListener("play", function () {
          hasPlayed = true;
          if (hoverTarget.matches(":hover") || hoverTarget.contains(document.activeElement)) return;
          setMapProjectDetailVideoHoverControls(videoEl, false, forceVisibleWithoutHover);
        });
      }
    }

    function setMapProjectDetailSectionBSceneQuestionText(sceneState, useVideoQuestion) {
      if (!sceneState || !sceneState.questionEl) return;
      var defaultQuestion = sceneState.questionEl.getAttribute("data-default-question") || sceneState.questionEl.textContent || "";
      var videoQuestion = sceneState.questionEl.getAttribute("data-video-question") || defaultQuestion;
      var nextQuestion = useVideoQuestion ? videoQuestion : defaultQuestion;
      if (sceneState.questionEl.textContent !== nextQuestion) {
        sceneState.questionEl.textContent = nextQuestion;
      }
    }

    function resetMapProjectDetailSectionBSceneState(sceneState) {
      if (!sceneState || !sceneState.sceneEl) return;
      sceneState.sceneEl.classList.remove("is-mobile-video-active", "is-desktop-scene-active", "is-video-interactive", "is-video-fallback");
      sceneState.sceneEl.removeAttribute("data-desktop-phase");
      sceneState.sceneEl.removeAttribute("data-desktop-visual");
      clearMapProjectDetailSectionBDesktopSceneLock(sceneState);
      clearMapProjectDetailSectionBVideoPending(sceneState);
      sceneState.mobileVideoActive = false;
      sceneState.mobileOverlapsViewport = false;
      sceneState.desktopTailDistance = 0;
      sceneState.resizeFrozen = false;
      sceneState.frozenPhase = "before-pin";
      sceneState.frozenMorphProgress = 0;
      sceneState.frozenHasVideoVisual = false;
      sceneState.frozenRuntimeScrollDistance = 0;
      sceneState.frozenIsPinned = false;
      sceneState.videoFailed = false;
      sceneState.videoControlsPinned = false;
      sceneState.videoPlayAttempts = 0;
      setMapProjectDetailSectionBSceneQuestionText(sceneState, false);
      setMapProjectDetailVideoHoverControls(sceneState.videoEl, false, false);
      sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-progress");
      sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-stage-height");
      sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-media-stage-height");
      sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-stable-height");
      sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-flow-offset");
      sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-runtime-scroll-distance");
      sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-tail-distance");
      sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-mobile-stage-height");
      sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-image-opacity");
      sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-image-shift");
      sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-image-left-shift");
      sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-image-right-shift");
      sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-image-left-scale");
      sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-image-right-scale");
      sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-video-opacity");
      sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-video-scale");
      sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-video-width");
      sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-video-height");
      stopMapProjectDetailSectionBVideo(sceneState.videoEl);
    }

    function clearMapProjectDetailSectionBState() {
      if (mapProjectDetailSectionBSyncRaf) {
        window.cancelAnimationFrame(mapProjectDetailSectionBSyncRaf);
        mapProjectDetailSectionBSyncRaf = 0;
      }
      clearMapProjectDetailSectionBResizeFreeze();
      mapProjectDetailSectionBLastScrollTop = 0;
      mapProjectDetailSectionBSceneStates.forEach(resetMapProjectDetailSectionBSceneState);
      mapProjectDetailSectionBSceneStates = [];
      if (mapProjectDetailStage) {
        mapProjectDetailStage.classList.remove("has-rich-section-b");
        mapProjectDetailStage.style.removeProperty("--map-project-detail-section-b-runtime-height");
      }
      resetMapProjectDetailDesktopSectionFlow();
      if (mapProjectDetailSectionB) {
        mapProjectDetailSectionB.style.removeProperty("--map-project-detail-section-b-pin-top");
      }
    }

    function getMapProjectDetailSectionBPinTop(scrollRect) {
      var fixedPinInset = 120;
      if (mapProjectDetailSectionB && window.getComputedStyle) {
        var sectionBStyle = window.getComputedStyle(mapProjectDetailSectionB);
        var cssPinInset = parseFloat(sectionBStyle.getPropertyValue("--map-project-detail-section-b-pin-top-base"));
        if (isFinite(cssPinInset) && cssPinInset > 0) {
          fixedPinInset = cssPinInset;
        }
      }
      return scrollRect.top + fixedPinInset;
    }

    function getMapProjectDetailSectionBDesktopMotionConfig(scrollRect) {
      var viewportHeight = scrollRect && scrollRect.height ? scrollRect.height : window.innerHeight;
      var holdImagesDistance = Math.max(84, Math.min(132, viewportHeight * 0.12));
      var morphDistance = Math.max(192, Math.min(296, viewportHeight * 0.28));
      var holdVideoDistance = 0;
      var releaseDistance = 0;
      return {
        holdImagesDistance: holdImagesDistance,
        morphDistance: morphDistance,
        holdVideoDistance: holdVideoDistance,
        releaseDistance: releaseDistance,
        totalDistance: holdImagesDistance + morphDistance + holdVideoDistance + releaseDistance
      };
    }

    function getMapProjectDetailSectionBVideoRatio(videoEl) {
      if (videoEl && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
        return videoEl.videoHeight / videoEl.videoWidth;
      }
      return 1080 / 1920;
    }

    function getMapProjectDetailSectionBMobileVideoMaxHeight(scrollRect) {
      var rootStyle = window.getComputedStyle ? window.getComputedStyle(document.documentElement) : null;
      var remPx = rootStyle ? parseFloat(rootStyle.fontSize) : 16;
      if (!isFinite(remPx) || remPx <= 0) remPx = 16;
      if (window.matchMedia("(max-width: 767.98px)").matches) {
        return Math.min(scrollRect.height * 0.58, remPx * 30);
      }
      return Math.min(scrollRect.height * 0.6, remPx * 32);
    }

    function getMapProjectDetailSectionBMobileVideoHeight(sceneState, scrollRect) {
      if (!sceneState || !sceneState.mediaStageEl) return 0;
      var stageRect = sceneState.mediaStageEl.getBoundingClientRect();
      if (!stageRect.width || stageRect.width <= 0) return 0;
      var ratio = getMapProjectDetailSectionBVideoRatio(sceneState.videoEl);
      return Math.min(stageRect.width * ratio, getMapProjectDetailSectionBMobileVideoMaxHeight(scrollRect));
    }

    function getMapProjectDetailSectionBMobileEnterThreshold(scrollRect) {
      return Math.max(96, Math.min(148, scrollRect.height * 0.24));
    }

    function getMapProjectDetailSectionBMobileExitThreshold(scrollRect, enterThreshold) {
      return Math.max(enterThreshold + 56, Math.min(228, scrollRect.height * 0.37));
    }

    function getMapProjectDetailSectionBDesktopVideoBox(sceneState, scrollRect, pinTop) {
      var stageWidth = sceneState.stageEl ? sceneState.stageEl.getBoundingClientRect().width : 0;
      var copyHeight = sceneState.copyEl ? sceneState.copyEl.getBoundingClientRect().height : 0;
      var ratio = getMapProjectDetailSectionBVideoRatio(sceneState.videoEl);
      var viewportPadding = 24;
      var mediaTop = copyHeight + 12;
      var availableWidth = Math.max(320, Math.min(stageWidth * 0.9, stageWidth - (viewportPadding * 2)));
      var availableHeight = Math.max(
        240,
        Math.min(
          window.innerHeight - pinTop - mediaTop - viewportPadding,
          scrollRect.height - (pinTop - scrollRect.top) - mediaTop - viewportPadding
        )
      );
      var width = Math.min(availableWidth, availableHeight / ratio);
      var height = width * ratio;
      if (height > availableHeight) {
        var scale = availableHeight / height;
        width *= scale;
        height *= scale;
      }
      return {
        width: Math.round(width),
        height: Math.round(height)
      };
    }

    function syncMapProjectDetailSectionBDesktopScene(sceneState, scrollRect, rawPinInset, motion, scrollDirection) {
      if (!sceneState || !sceneState.sceneEl || !sceneState.stageEl || !sceneState.mediaEl) {
        resetMapProjectDetailSectionBSceneState(sceneState);
        return false;
      }

      var sceneRect = sceneState.sceneEl.getBoundingClientRect();
      var overlapsViewport = sceneRect.bottom > scrollRect.top && sceneRect.top < scrollRect.bottom;
      var preloadBand = 320;
      if (sceneRect.bottom > (scrollRect.top - preloadBand) && sceneRect.top < (scrollRect.bottom + preloadBand)) {
        warmMapProjectDetailSectionBVideo(sceneState);
      }

      var scrollTop = mapProjectScroll ? mapProjectScroll.scrollTop : 0;
      var sceneScrollDistance = motion.totalDistance;
      var morphStart = motion.holdImagesDistance;
      var morphEnd = morphStart + motion.morphDistance;
      var isResizeFrozen = mapProjectDetailSectionBResizeFrozen && sceneState.resizeFrozen;
      var tailDistance = 0;

      if (!isResizeFrozen) {
        var reachedPinBand = sceneRect.top <= (scrollRect.top + rawPinInset + 1);
        if (!isFinite(sceneState.desktopPinStartScrollTop) && reachedPinBand) {
          sceneState.desktopPinStartScrollTop = scrollTop;
          sceneState.desktopPinnedInset = rawPinInset;
        }
        if (
          isFinite(sceneState.desktopPinStartScrollTop) &&
          scrollTop < (sceneState.desktopPinStartScrollTop - 1) &&
          !sceneState.desktopPersistentVideoVisible
        ) {
          clearMapProjectDetailSectionBDesktopSceneLock(sceneState, true);
        }
      }
      var hasPinStart = isFinite(sceneState.desktopPinStartScrollTop);
      var effectivePinStartScrollTop = isFinite(sceneState.desktopPinStartScrollTop)
        ? sceneState.desktopPinStartScrollTop
        : scrollTop;
      var effectivePinInset = isFinite(sceneState.desktopPinnedInset)
        ? sceneState.desktopPinnedInset
        : rawPinInset;
      var absoluteDistance = hasPinStart ? (scrollTop - effectivePinStartScrollTop) : 0;
      var stickyDistance = Math.max(0, Math.min(sceneScrollDistance, absoluteDistance));
      var phase = "before-pin";
      var hasVideoVisual = false;
      var morphProgress = 0;
      var runtimeScrollDistance = 0;
      var isPinned = false;

      if (isResizeFrozen) {
        phase = sceneState.frozenPhase || "before-pin";
        hasVideoVisual = !!sceneState.frozenHasVideoVisual;
        morphProgress = Math.max(0, Math.min(1, sceneState.frozenMorphProgress || 0));
        runtimeScrollDistance = Math.max(0, sceneState.frozenRuntimeScrollDistance || 0);
        isPinned = !!sceneState.frozenIsPinned;
      } else {
        phase = getMapProjectDetailSectionBDesktopPhase(stickyDistance, motion);
        if (stickyDistance >= morphEnd) {
          sceneState.desktopPersistentVideoVisible = true;
        } else if (sceneState.desktopPersistentVideoVisible && scrollDirection >= 0) {
          sceneState.desktopPersistentVideoVisible = true;
        } else {
          sceneState.desktopPersistentVideoVisible = false;
        }
        hasVideoVisual = sceneState.desktopPersistentVideoVisible || absoluteDistance >= morphEnd;
        if (hasVideoVisual && phase === "before-pin") {
          phase = "released-video";
        }
        morphProgress = stickyDistance <= morphStart
          ? 0
          : Math.max(0, Math.min(1, (stickyDistance - morphStart) / motion.morphDistance));
        if (hasVideoVisual) {
          morphProgress = 1;
        }
        var preMorphRunway = Math.max(48, Math.min(96, motion.totalDistance * 0.22));
        if (hasVideoVisual) {
          runtimeScrollDistance = motion.totalDistance;
        } else if (stickyDistance > 0) {
          if (stickyDistance <= morphStart) {
            var preMorphProgress = morphStart > 0 ? (stickyDistance / morphStart) : 1;
            runtimeScrollDistance = preMorphRunway * preMorphProgress;
          } else {
            var postMorphRange = Math.max(1, sceneScrollDistance - morphStart);
            var postMorphProgress = Math.max(0, Math.min(1, (stickyDistance - morphStart) / postMorphRange));
            runtimeScrollDistance = preMorphRunway + ((motion.totalDistance - preMorphRunway) * postMorphProgress);
          }
        }
        isPinned = hasPinStart && absoluteDistance >= 0 && absoluteDistance < sceneScrollDistance;
      }

      sceneState.desktopPersistentVideoVisible = hasVideoVisual;
      sceneState.desktopReleaseLocked = hasVideoVisual;
      sceneState.desktopReverseUnlockScrollTop = hasVideoVisual
        ? (effectivePinStartScrollTop + morphEnd)
        : NaN;
      sceneState.desktopPhase = phase;
      var videoOpacity = morphProgress <= 0
        ? 0
        : Math.max(0, Math.min(1, morphProgress / 0.82));
      if (hasVideoVisual) {
        videoOpacity = 1;
      }
      var imageOpacity = 1 - Math.min(1, videoOpacity * 1.08);
      if (hasVideoVisual) {
        imageOpacity = 0;
      }
      sceneState.desktopIsPinned = isPinned;
      sceneState.desktopTailDistance = tailDistance;

      sceneState.mobileVideoActive = false;
      setMapProjectDetailSectionBSceneQuestionText(
        sceneState,
        hasVideoVisual
      );
      sceneState.sceneEl.classList.remove("is-mobile-video-active");
      sceneState.sceneEl.classList.toggle("is-desktop-scene-active", isPinned);
      if (hasVideoVisual) {
        sceneState.sceneEl.setAttribute("data-desktop-visual", "video");
      } else {
        sceneState.sceneEl.removeAttribute("data-desktop-visual");
      }
      sceneState.sceneEl.classList.toggle(
        "is-video-interactive",
        hasVideoVisual && videoOpacity >= 0.98
      );
      sceneState.sceneEl.setAttribute("data-desktop-phase", phase);
      sceneState.sceneEl.style.setProperty("--map-project-detail-scene-progress", morphProgress.toFixed(4));
      sceneState.sceneEl.style.setProperty("--map-project-detail-scene-image-opacity", imageOpacity.toFixed(4));
      sceneState.sceneEl.style.setProperty("--map-project-detail-scene-image-shift", (morphProgress * 18).toFixed(4) + "%");
      var mediaStageWidth = sceneState.mediaStageEl ? sceneState.mediaStageEl.clientWidth : 0;
      var rightShiftPx = mediaStageWidth > 0 ? ((mediaStageWidth * 0.28) * morphProgress * -1) : 0;
      sceneState.sceneEl.style.setProperty("--map-project-detail-scene-image-left-shift", "0px");
      sceneState.sceneEl.style.setProperty("--map-project-detail-scene-image-right-shift", rightShiftPx.toFixed(2) + "px");
      sceneState.sceneEl.style.setProperty("--map-project-detail-scene-image-left-scale", (1 + (morphProgress * 0.1)).toFixed(4));
      sceneState.sceneEl.style.setProperty("--map-project-detail-scene-image-right-scale", (1 + (morphProgress * 0.08)).toFixed(4));
      sceneState.sceneEl.style.setProperty("--map-project-detail-scene-video-opacity", videoOpacity.toFixed(4));
      sceneState.sceneEl.style.setProperty("--map-project-detail-scene-video-scale", (0.96 + (morphProgress * 0.04)).toFixed(4));
      var videoBox = getMapProjectDetailSectionBDesktopVideoBox(sceneState, scrollRect, scrollRect.top + effectivePinInset);
      var copyHeight = sceneState.copyEl ? sceneState.copyEl.offsetHeight : 0;
      var mediaHeight = sceneState.mediaEl ? sceneState.mediaEl.offsetHeight : 0;
      var expandedMediaHeight = Math.max(mediaHeight, videoBox.height);
      var layoutExpandProgress = hasVideoVisual
        ? 1
        : morphProgress;
      var mediaStageHeight = mediaHeight + ((expandedMediaHeight - mediaHeight) * layoutExpandProgress);
      var stageHeight = copyHeight + 12 + mediaStageHeight;
      var stableStageHeight = copyHeight + 12 + expandedMediaHeight;
      var stableRuntimeHeight = stableStageHeight + motion.totalDistance + tailDistance;
      var visibleFlowHeight = stageHeight + runtimeScrollDistance;
      var flowOffset = Math.max(0, stableRuntimeHeight - visibleFlowHeight);
      var effectiveRuntimeHeight = Math.max(0, stableRuntimeHeight - flowOffset);
      if (!isFinite(stageHeight) || stageHeight <= 0 || !isFinite(stableRuntimeHeight) || stableRuntimeHeight <= 0) {
        resetMapProjectDetailSectionBSceneState(sceneState);
        return false;
      }
      sceneState.sceneEl.style.setProperty("--map-project-detail-scene-stage-height", Math.ceil(stageHeight) + "px");
      sceneState.sceneEl.style.setProperty("--map-project-detail-scene-media-stage-height", Math.ceil(mediaStageHeight) + "px");
      sceneState.sceneEl.style.setProperty("--map-project-detail-scene-stable-height", Math.ceil(stableRuntimeHeight) + "px");
      sceneState.sceneEl.style.setProperty("--map-project-detail-scene-flow-offset", Math.ceil(flowOffset) + "px");
      sceneState.sceneEl.style.setProperty("--map-project-detail-scene-runtime-scroll-distance", Math.ceil(runtimeScrollDistance) + "px");
      sceneState.sceneEl.style.setProperty("--map-project-detail-scene-tail-distance", Math.ceil(tailDistance) + "px");
      sceneState.sceneEl.style.setProperty("--map-project-detail-scene-video-width", videoBox.width + "px");
      sceneState.sceneEl.style.setProperty("--map-project-detail-scene-video-height", videoBox.height + "px");
      sceneState.desktopRuntimeHeight = Math.ceil(effectiveRuntimeHeight);

      if (sceneState.videoEl) {
        var shouldPlayVideo = overlapsViewport && (phase === "morphing" || hasVideoVisual);
        var shouldKeepVideoState = phase === "morphing" || hasVideoVisual;
        if (shouldPlayVideo) {
          warmMapProjectDetailSectionBVideo(sceneState);
          if (sceneState.videoEl.paused) {
            sceneState.videoEl.play().catch(function () {});
          }
        } else if (!shouldKeepVideoState) {
          stopMapProjectDetailSectionBVideo(sceneState.videoEl, true);
        } else {
          stopMapProjectDetailSectionBVideo(sceneState.videoEl, false);
        }
      }
      return isPinned;
    }

    function syncMapProjectDetailSectionBDesktopScenes() {
      if (!mapProjectScroll || !mapProjectDetailSectionB) return;
      var scrollRect = mapProjectScroll.getBoundingClientRect();
      var rawPinTop = getMapProjectDetailSectionBPinTop(scrollRect);
      var rawPinInset = Math.max(24, rawPinTop - scrollRect.top);
      var motion = getMapProjectDetailSectionBDesktopMotionConfig(scrollRect);
      var scrollTop = mapProjectScroll.scrollTop || 0;
      var scrollDirection = scrollTop - mapProjectDetailSectionBLastScrollTop;
      mapProjectDetailSectionBSceneStates.forEach(function (sceneState, index) {
        syncMapProjectDetailSectionBVideoLoadMode(sceneState, false);
        syncMapProjectDetailSectionBDesktopScene(
          sceneState,
          scrollRect,
          rawPinInset,
          motion,
          scrollDirection
        );
      });
      mapProjectDetailSectionB.style.setProperty("--map-project-detail-section-b-pin-top", Math.round(rawPinInset) + "px");

      if (mapProjectDetailStage) {
        var sectionBBodyStyle = window.getComputedStyle ? window.getComputedStyle(mapProjectDetailHeadingBBody || mapProjectDetailSectionB) : null;
        var sceneGap = sectionBBodyStyle ? parseFloat(sectionBBodyStyle.getPropertyValue("gap")) : NaN;
        if (!isFinite(sceneGap)) {
          var sectionBStyle = window.getComputedStyle ? window.getComputedStyle(mapProjectDetailSectionB) : null;
          sceneGap = sectionBStyle ? parseFloat(sectionBStyle.getPropertyValue("--map-project-detail-section-b-scene-gap-desktop")) : 0;
        }
        if (!isFinite(sceneGap)) sceneGap = 0;
        var runtimeHeight = 0;
        mapProjectDetailSectionBSceneStates.forEach(function (sceneState, index) {
          runtimeHeight += Math.max(0, sceneState.desktopRuntimeHeight || 0);
          if (index > 0) {
            runtimeHeight += sceneGap;
          }
        });
        mapProjectDetailStage.style.setProperty(
          "--map-project-detail-section-b-runtime-height",
          Math.max(0, Math.ceil(runtimeHeight)) + "px"
        );
      }
      mapProjectDetailSectionBLastScrollTop = scrollTop;
    }

    function syncMapProjectDetailSectionBMobileScenes() {
      var scrollRect = mapProjectScroll.getBoundingClientRect();
      var viewportCenter = scrollRect.top + (scrollRect.height * 0.5);
      var enterThreshold = getMapProjectDetailSectionBMobileEnterThreshold(scrollRect);
      var exitThreshold = getMapProjectDetailSectionBMobileExitThreshold(scrollRect, enterThreshold);

      mapProjectDetailSectionBSceneStates.forEach(function (sceneState) {
        syncMapProjectDetailSectionBVideoLoadMode(sceneState, false);
        clearMapProjectDetailSectionBDesktopSceneLock(sceneState);
        sceneState.sceneEl.classList.remove("is-desktop-scene-active");
        sceneState.sceneEl.removeAttribute("data-desktop-phase");
        sceneState.sceneEl.removeAttribute("data-desktop-visual");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-progress");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-stage-height");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-stable-height");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-flow-offset");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-runtime-scroll-distance");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-tail-distance");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-image-opacity");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-image-shift");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-image-left-shift");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-image-right-shift");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-image-left-scale");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-image-right-scale");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-video-opacity");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-video-scale");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-mobile-stage-height");
        sceneState.desktopRuntimeHeight = 0;
        if (!sceneState.mediaStageEl) return;
        var stageRect = sceneState.mediaStageEl.getBoundingClientRect();
        var stageCenter = stageRect.top + (stageRect.height * 0.5);
        var distance = Math.abs(stageCenter - viewportCenter);
        var overlapsViewport = stageRect.bottom > scrollRect.top && stageRect.top < scrollRect.bottom;
        sceneState.mobileOverlapsViewport = overlapsViewport;
        var preloadBand = 220;
        var isNearViewport = stageRect.bottom > (scrollRect.top - preloadBand) && stageRect.top < (scrollRect.bottom + preloadBand);
        var mediaHeight = sceneState.mediaEl ? sceneState.mediaEl.getBoundingClientRect().height : 0;
        var videoHeight = getMapProjectDetailSectionBMobileVideoHeight(sceneState, scrollRect);
        var stageHeight = Math.max(mediaHeight, videoHeight);
        if (isFinite(stageHeight) && stageHeight > 0) {
          sceneState.sceneEl.style.setProperty("--map-project-detail-scene-mobile-stage-height", Math.ceil(stageHeight) + "px");
        }
        if (isNearViewport) {
          warmMapProjectDetailSectionBVideo(sceneState);
        }
        if (sceneState.mobileVideoActive) {
          if (stageCenter >= (viewportCenter + exitThreshold)) {
            sceneState.mobileVideoActive = false;
          }
        } else if (overlapsViewport && distance <= enterThreshold) {
          sceneState.mobileVideoActive = true;
        }
      });

      mapProjectDetailSectionBSceneStates.forEach(function (sceneState) {
        var isActive = !!sceneState.mobileVideoActive;
        sceneState.sceneEl.classList.toggle("is-mobile-video-active", isActive);
        sceneState.sceneEl.classList.toggle("is-video-interactive", isActive);
        setMapProjectDetailSectionBSceneQuestionText(sceneState, isActive);
        if (!isActive) {
          clearMapProjectDetailSectionBVideoPending(sceneState);
          setMapProjectDetailVideoHoverControls(sceneState.videoEl, false, sceneState.videoControlsPinned);
          stopMapProjectDetailSectionBVideo(sceneState.videoEl);
          return;
        }
        if (!sceneState.mobileOverlapsViewport) {
          clearMapProjectDetailSectionBVideoPending(sceneState);
          setMapProjectDetailVideoHoverControls(sceneState.videoEl, false, sceneState.videoControlsPinned);
          stopMapProjectDetailSectionBVideo(sceneState.videoEl, false);
          return;
        }
        playMapProjectDetailSectionBVideo(sceneState);
      });
    }

    function syncMapProjectDetailSectionBPhoneScenes() {
      var scrollRect = mapProjectScroll.getBoundingClientRect();
      var preloadBand = 220;

      mapProjectDetailSectionBSceneStates.forEach(function (sceneState) {
        syncMapProjectDetailSectionBVideoLoadMode(sceneState, true);
        sceneState.mobileVideoActive = false;
        sceneState.mobileOverlapsViewport = false;
        clearMapProjectDetailSectionBDesktopSceneLock(sceneState);
        sceneState.sceneEl.classList.remove("is-mobile-video-active", "is-desktop-scene-active");
        sceneState.sceneEl.removeAttribute("data-desktop-phase");
        sceneState.sceneEl.removeAttribute("data-desktop-visual");
        sceneState.sceneEl.classList.add("is-video-interactive");
        setMapProjectDetailSectionBSceneQuestionText(sceneState, false);
        setMapProjectDetailVideoHoverControls(sceneState.videoEl, false, sceneState.videoControlsPinned);
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-progress");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-stage-height");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-stable-height");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-flow-offset");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-runtime-scroll-distance");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-tail-distance");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-image-opacity");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-image-shift");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-image-left-shift");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-image-right-shift");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-image-left-scale");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-image-right-scale");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-video-opacity");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-video-scale");
        sceneState.sceneEl.style.removeProperty("--map-project-detail-scene-mobile-stage-height");
        sceneState.desktopRuntimeHeight = 0;
        if (!sceneState.sceneEl) return;
        var sceneRect = sceneState.sceneEl.getBoundingClientRect();
        var isNearViewport = sceneRect.bottom > (scrollRect.top - preloadBand) && sceneRect.top < (scrollRect.bottom + preloadBand);
        var overlapsViewport = sceneRect.bottom > scrollRect.top && sceneRect.top < scrollRect.bottom;
        if (isNearViewport) {
          warmMapProjectDetailSectionBVideo(sceneState);
        }
        if (!sceneState.videoEl) return;
        if (overlapsViewport) {
          playMapProjectDetailSectionBVideo(sceneState);
          return;
        }
        clearMapProjectDetailSectionBVideoPending(sceneState);
        stopMapProjectDetailSectionBVideo(sceneState.videoEl);
      });
    }

    function syncMapProjectDetailSectionBScenes() {
      mapProjectDetailSectionBSyncRaf = 0;
      syncMapProjectDetailDesktopSectionFlow();
      if (!mapProjectDetailSectionB || mapProjectDetailSectionB.hidden) {
        mapProjectDetailSectionBSceneStates.forEach(resetMapProjectDetailSectionBSceneState);
        return;
      }
      if (mapProjectShell.hidden || !document.documentElement.classList.contains("map-project-open")) {
        mapProjectDetailSectionBSceneStates.forEach(resetMapProjectDetailSectionBSceneState);
        return;
      }
      if (!mapProjectDetailSectionBSceneStates.length) return;
      if (window.matchMedia("(min-width: 768px)").matches) {
        syncMapProjectDetailSectionBDesktopScenes();
        return;
      }
      if (mapProjectDetailSectionBResizeFrozen) {
        clearMapProjectDetailSectionBResizeFreeze();
      }
      syncMapProjectDetailSectionBPhoneScenes();
    }

    function scheduleSyncMapProjectDetailSectionBScenes() {
      if (mapProjectDetailSectionBSyncRaf) {
        window.cancelAnimationFrame(mapProjectDetailSectionBSyncRaf);
      }
      mapProjectDetailSectionBSyncRaf = window.requestAnimationFrame(syncMapProjectDetailSectionBScenes);
    }

    function clearMapProjectDetailHeaderCollapseState() {
      if (mapProjectDetailHeaderCollapseRaf) {
        window.cancelAnimationFrame(mapProjectDetailHeaderCollapseRaf);
        mapProjectDetailHeaderCollapseRaf = 0;
      }
      if (mapProjectDetailHeaderCollapseTrackRaf) {
        window.cancelAnimationFrame(mapProjectDetailHeaderCollapseTrackRaf);
        mapProjectDetailHeaderCollapseTrackRaf = 0;
      }
      resetMapProjectDetailHeaderCollapseState();
    }

    function clearMapProjectDetailHeaderWrapState() {
      if (mapProjectDetailHeaderWrapRaf) {
        window.cancelAnimationFrame(mapProjectDetailHeaderWrapRaf);
        mapProjectDetailHeaderWrapRaf = 0;
      }
      resetMapProjectDetailHeaderWrapState();
    }

    function syncMapProjectDetailHeaderWrapState() {
      mapProjectDetailHeaderWrapRaf = 0;
      resetMapProjectDetailHeaderWrapState();
      if (mapProjectShell.hidden) return;
      if (!document.documentElement.classList.contains("map-project-open")) return;
      if (!mapProjectDetailTitle.textContent || !mapProjectDetailTitle.textContent.trim()) return;

      var titleStyle = window.getComputedStyle(mapProjectDetailTitle);
      var lineHeight = parseFloat(titleStyle.lineHeight);
      var titleHeight = mapProjectDetailTitle.getBoundingClientRect().height;
      if (!isFinite(lineHeight) || lineHeight <= 0 || !isFinite(titleHeight) || titleHeight <= 0) return;

      var isWrapped = titleHeight > (lineHeight * 1.5);
      if (!isWrapped) return;

      var headerStyle = window.getComputedStyle(mapProjectDetailHeader);
      var defaultCloseSize = parseFloat(headerStyle.getPropertyValue("--map-project-detail-close-default-size"));
      var closeScale = defaultCloseSize > 0 ? Math.max(1, titleHeight / lineHeight) : 1;

      mapProjectDetailHeader.style.setProperty("--map-project-detail-close-runtime-scale", closeScale.toFixed(4));
      mapProjectDetailHeader.classList.add("is-title-wrapped");
    }

    function getMapProjectDetailHeaderCollapseDistance() {
      if (!mapProjectContent) return 0;
      var contentStyle = window.getComputedStyle(mapProjectContent);
      var collapseDistance = parseFloat(contentStyle.getPropertyValue("--map-project-detail-header-collapse-distance"));
      if (!isFinite(collapseDistance) || collapseDistance <= 0) {
        collapseDistance = window.matchMedia("(max-width: 767.98px)").matches ? 84 : 120;
      }
      return collapseDistance;
    }

    function syncMapProjectDetailHeaderCollapseState() {
      mapProjectDetailHeaderCollapseRaf = 0;
      if (!mapProjectContent || !mapProjectScroll) return;
      if (mapProjectShell.hidden || !document.documentElement.classList.contains("map-project-open")) {
        resetMapProjectDetailHeaderCollapseState();
        return;
      }

      var collapseDistance = getMapProjectDetailHeaderCollapseDistance();
      var scrollTop = getMapProjectDetailActiveScrollTop();

      var progress = Math.max(0, Math.min(1, scrollTop / collapseDistance));
      mapProjectContent.style.setProperty("--map-project-detail-header-collapse-progress", progress.toFixed(4));
      scheduleSyncMapProjectDetailHeaderWrapState();
    }

    function syncMapProjectDetailDesktopMediaSpacing() {
      mapProjectDetailDesktopMediaRaf = 0;
      if (!mapProjectDetailStage || !mapProjectDetailLead) return;
      if (mapProjectShell.hidden || !document.documentElement.classList.contains("map-project-open")) {
        resetMapProjectDetailDesktopMediaSpacing();
        return;
      }
      if (!window.matchMedia("(min-width: 1080px)").matches) {
        resetMapProjectDetailDesktopMediaSpacing();
        return;
      }

      resetMapProjectDetailDesktopMediaSpacing();

      var stageStyle = window.getComputedStyle(mapProjectDetailStage);
      var leftBaseTop = parseFloat(stageStyle.getPropertyValue("--map-project-detail-desktop-left-figure-top-base"));
      var rightBaseTop = parseFloat(stageStyle.getPropertyValue("--map-project-detail-desktop-right-figure-top-base"));
      var clearance = parseFloat(stageStyle.getPropertyValue("--map-project-detail-desktop-media-clearance"));
      if (!isFinite(leftBaseTop) || !isFinite(rightBaseTop)) return;
      if (!isFinite(clearance)) clearance = 72;

      var stageRect = mapProjectDetailStage.getBoundingClientRect();
      var leadRect = mapProjectDetailLead.getBoundingClientRect();
      if (!isFinite(stageRect.top) || !isFinite(leadRect.bottom)) return;

      var leadBottom = leadRect.bottom - stageRect.top;
      var shift = Math.max(0, (leadBottom + clearance) - rightBaseTop);
      if (!(shift > 0.5)) return;

      mapProjectDetailStage.style.setProperty("--map-project-detail-desktop-left-figure-top", (leftBaseTop + shift).toFixed(2) + "px");
      mapProjectDetailStage.style.setProperty("--map-project-detail-desktop-right-figure-top", (rightBaseTop + shift).toFixed(2) + "px");
    }

    function scheduleSyncMapProjectDetailHeaderCollapseState() {
      if (mapProjectDetailHeaderCollapseRaf) {
        window.cancelAnimationFrame(mapProjectDetailHeaderCollapseRaf);
      }
      mapProjectDetailHeaderCollapseRaf = window.requestAnimationFrame(syncMapProjectDetailHeaderCollapseState);
    }

    function scheduleSyncMapProjectDetailDesktopMediaSpacing() {
      if (mapProjectDetailDesktopMediaRaf) {
        window.cancelAnimationFrame(mapProjectDetailDesktopMediaRaf);
      }
      mapProjectDetailDesktopMediaRaf = window.requestAnimationFrame(syncMapProjectDetailDesktopMediaSpacing);
    }

    function scheduleSyncMapProjectDetailHeaderWrapState() {
      if (mapProjectDetailHeaderWrapRaf) {
        window.cancelAnimationFrame(mapProjectDetailHeaderWrapRaf);
      }
      mapProjectDetailHeaderWrapRaf = window.requestAnimationFrame(syncMapProjectDetailHeaderWrapState);
    }

    function clampMapProjectDetailScrollTop(scrollTop) {
      if (!mapProjectScroll) return 0;
      var nextScrollTop = Number(scrollTop);
      if (!isFinite(nextScrollTop) || nextScrollTop < 0) nextScrollTop = 0;
      var maxScrollTop = Math.max(0, mapProjectScroll.scrollHeight - mapProjectScroll.clientHeight);
      if (!isFinite(maxScrollTop) || maxScrollTop < 0) maxScrollTop = 0;
      return Math.max(0, Math.min(maxScrollTop, nextScrollTop));
    }

    function clearMapProjectViewportRecoveryTasks() {
      if (mapProjectViewportRecoveryRafA) {
        window.cancelAnimationFrame(mapProjectViewportRecoveryRafA);
        mapProjectViewportRecoveryRafA = 0;
      }
      if (mapProjectViewportRecoveryRafB) {
        window.cancelAnimationFrame(mapProjectViewportRecoveryRafB);
        mapProjectViewportRecoveryRafB = 0;
      }
      if (mapProjectViewportRecoveryTimeout) {
        window.clearTimeout(mapProjectViewportRecoveryTimeout);
        mapProjectViewportRecoveryTimeout = 0;
      }
    }

    function scheduleSyncMapProjectDetailViewportState() {
      syncMapProjectShellHeight();
      scheduleSyncMapProjectDetailDesktopMediaSpacing();
      scheduleSyncMapProjectDetailHeaderCollapseState();
      scheduleSyncMapProjectDetailHeaderWrapState();
      scheduleSyncMapProjectDetailSectionBScenes();
      scheduleSyncMapProjectDetailChromeTheme();
    }

    function recoverMapProjectAfterViewportChange(reason) {
      if (!mapProjectScroll) return;
      if (mapProjectShell.hidden || !document.documentElement.classList.contains("map-project-open")) {
        clearMapProjectViewportRecoveryTasks();
        return;
      }

      syncMapProjectWindowAnchorScroll();
      var preservedScrollTop = clampMapProjectDetailScrollTop(mapProjectScroll.scrollTop || 0);

      resetMapProjectWheelGesture();
      clearMapProjectHorizontalDrag();
      clearMapProjectDetailSectionBResizeFreeze();

      clearMapProjectViewportRecoveryTasks();
      scheduleSyncMapProjectDetailViewportState();

      mapProjectViewportRecoveryRafA = window.requestAnimationFrame(function () {
        mapProjectViewportRecoveryRafA = 0;
        if (mapProjectShell.hidden || !document.documentElement.classList.contains("map-project-open")) return;

        syncMapProjectWindowAnchorScroll();
        scheduleSyncMapProjectDetailViewportState();

        mapProjectViewportRecoveryRafB = window.requestAnimationFrame(function () {
          mapProjectViewportRecoveryRafB = 0;
          if (mapProjectShell.hidden || !document.documentElement.classList.contains("map-project-open")) return;

          syncMapProjectWindowAnchorScroll();
          mapProjectScroll.scrollTop = clampMapProjectDetailScrollTop(preservedScrollTop);
          syncMapProjectDetailHeaderCollapseState();
          scheduleSyncMapProjectDetailHeaderWrapState();
          scheduleSyncMapProjectDetailSectionBScenes();
          scheduleSyncMapProjectDetailChromeTheme();

          mapProjectViewportRecoveryTimeout = window.setTimeout(function () {
            mapProjectViewportRecoveryTimeout = 0;
            if (mapProjectShell.hidden || !document.documentElement.classList.contains("map-project-open")) return;

            syncMapProjectWindowAnchorScroll();
            if (mapProjectDetailSectionBResizeFrozen) {
              clearMapProjectDetailSectionBResizeFreeze();
              scheduleSyncMapProjectDetailSectionBScenes();
            }

            var currentScrollTop = clampMapProjectDetailScrollTop(mapProjectScroll.scrollTop || 0);
            var collapseDistance = getMapProjectDetailHeaderCollapseDistance();
            var expectedProgress = collapseDistance > 0
              ? Math.max(0, Math.min(1, currentScrollTop / collapseDistance))
              : 0;
            var currentProgress = mapProjectContent
              ? parseFloat(mapProjectContent.style.getPropertyValue("--map-project-detail-header-collapse-progress"))
              : NaN;

            if (!isFinite(currentProgress) || Math.abs(currentProgress - expectedProgress) > 0.02) {
              syncMapProjectDetailHeaderCollapseState();
            }

            scheduleSyncMapProjectDetailHeaderWrapState();
            scheduleSyncMapProjectDetailSectionBScenes();
            scheduleSyncMapProjectDetailChromeTheme();
          }, 160);
        });
      });
    }

    function startMapProjectDetailHeaderCollapseTracking() {
      if (mapProjectDetailHeaderCollapseTrackRaf) return;

      function tick() {
        mapProjectDetailHeaderCollapseTrackRaf = 0;
        if (mapProjectShell.hidden || !document.documentElement.classList.contains("map-project-open")) return;
        syncMapProjectDetailHeaderCollapseState();
        mapProjectDetailHeaderCollapseTrackRaf = window.requestAnimationFrame(tick);
      }

      mapProjectDetailHeaderCollapseTrackRaf = window.requestAnimationFrame(tick);
    }

    function handleMapProjectDetailScrollSync() {
      if (!document.documentElement.classList.contains("map-project-open")) return;
      if (mapProjectOpenTraceSequenceState.lockActive && mapProjectScroll) {
        if (Math.abs((mapProjectScroll.scrollTop || 0) - mapProjectOpenTraceSequenceState.lockScrollTop) > 0.5) {
          mapProjectScroll.scrollTop = mapProjectOpenTraceSequenceState.lockScrollTop;
        }
      }
      syncMapProjectWindowAnchorScroll();
      if (mapProjectDetailSectionBResizeFrozen && mapProjectScroll) {
        var currentSectionBScrollTop = mapProjectScroll.scrollTop || 0;
        if (Math.abs(currentSectionBScrollTop - mapProjectDetailSectionBResizeFreezeScrollTop) > 1) {
          clearMapProjectDetailSectionBResizeFreeze();
        }
      }
      scheduleSyncMapProjectDetailHeaderCollapseState();
      scheduleSyncMapProjectDetailSectionBScenes();
      scheduleSyncMapProjectDetailChromeTheme();
    }

    function stopMapProjectDetailMedia() {
      function stopVideoEl(videoEl) {
        if (!videoEl || videoEl.tagName !== "VIDEO") return;
        try {
          videoEl.pause();
          videoEl.currentTime = 0;
        } catch (error) {}
      }

      stopVideoEl(mapProjectDetailVisualLeft);
      if (mapProjectTemplateRoot) {
        Array.prototype.forEach.call(mapProjectTemplateRoot.querySelectorAll("video"), stopVideoEl);
      }
      if (mapProjectOpenTraceRoot) {
        Array.prototype.forEach.call(mapProjectOpenTraceRoot.querySelectorAll("video"), stopVideoEl);
      }
    }

    function resolveMapProjectPageData(nodeId, detail) {
      var custom = mapProjectPageDataByNodeId[nodeId] || null;
      if (custom) return custom;
      return {
        layoutType: MAP_PROJECT_LAYOUT_TEMPLATE_MAKAPAKKA,
        pageTitle: detail && detail.title ? detail.title : "",
        tags: MAP_PROJECT_TEMPLATE_DEFAULT_TAGS.slice(0),
        lead: detail && detail.desc ? detail.desc : "",
        secondaryStatement: MAP_PROJECT_TEMPLATE_SECONDARY_STATEMENT,
        creditHtml: MAP_PROJECT_TEMPLATE_DEFAULT_CREDIT_HTML,
        instituteHtml: MAP_PROJECT_TEMPLATE_DEFAULT_INSTITUTE_HTML,
        institute: "",
        sectionATitle: "",
        sectionABodyHtml: "",
        sectionBTitleHtml: "",
        sectionBBlocks: [],
        visualLeftSrc: "",
        visualLeftType: "image",
        visualLeftAlt: "",
        visualRightSrc: "",
        visualRightType: "image",
        visualRightAlt: "",
        visualRightHref: "",
        visualRightLinkTitle: "",
        visualRightLinkIcon: "",
        captionLeft: "",
        captionRight: "",
        headingA: "",
        headingB: "",
        galleryCards: [],
        featureVideoSrc: "",
        featureVideoPosterSrc: "",
        featureVideoAlt: ""
      };
    }

    function setMapProjectVeritasRootVisible(visible) {
      mapProjectVeritasRoot.hidden = !visible;
      mapProjectVeritasRoot.setAttribute("aria-hidden", visible ? "false" : "true");
    }

    function clearMapProjectVeritasLayoutContent() {
      setMapProjectDetailText(mapProjectDetailTag1, "");
      setMapProjectDetailText(mapProjectDetailTag2, "");
      setMapProjectDetailText(mapProjectDetailTag3, "");
      setMapProjectDetailHtml(mapProjectDetailCredit, "");
      setMapProjectDetailText(mapProjectDetailInstitute, "");
      setMapProjectDetailText(mapProjectDetailLead, "");
      setMapProjectDetailVisual(mapProjectDetailVisualLeft, "", "");
      setMapProjectDetailVisual(mapProjectDetailVisualRight, "", "");
      setMapProjectDetailExternalLink(mapProjectDetailVisualRightLink, "", "", "");
      setMapProjectDetailText(mapProjectDetailCaptionLeft, "");
      setMapProjectDetailText(mapProjectDetailCaptionRight, "");
      setMapProjectDetailSectionA("", "");
      setMapProjectDetailSectionB("", [], "");
      mapProjectDetailStage.classList.remove("has-rich-section-b");
      mapProjectDetailSectionC.hidden = true;
    }

    function renderVeritasMapProjectLayout(pageData, detail) {
      var tags = Array.isArray(pageData.tags) ? pageData.tags : [];
      setMapProjectVeritasRootVisible(true);
      clearMapProjectTemplateRoot();
      clearMapProjectOpenTraceRoot();
      mapProjectDetailSectionC.hidden = false;
      setMapProjectDetailText(mapProjectDetailTag1, tags[0] || "");
      setMapProjectDetailText(mapProjectDetailTag2, tags[1] || "");
      setMapProjectDetailText(mapProjectDetailTag3, tags[2] || "");
      setMapProjectDetailHtml(mapProjectDetailCredit, pageData.creditHtml || "");
      if (pageData.instituteHtml) {
        setMapProjectDetailHtml(mapProjectDetailInstitute, pageData.instituteHtml || "");
      } else {
        setMapProjectDetailText(mapProjectDetailInstitute, pageData.institute || "");
      }
      setMapProjectDetailText(mapProjectDetailLead, pageData.lead || (detail && detail.desc ? detail.desc : ""));
      setMapProjectDetailVisual(
        mapProjectDetailVisualLeft,
        pageData.visualLeftSrc || "",
        pageData.visualLeftAlt || "",
        pageData.visualLeftType || "image",
        pageData.visualLeftPosterSrc || ""
      );
      setMapProjectDetailVisual(
        mapProjectDetailVisualRight,
        pageData.visualRightSrc || "",
        pageData.visualRightAlt || "",
        pageData.visualRightType || "image"
      );
      setMapProjectDetailExternalLink(
        mapProjectDetailVisualRightLink,
        pageData.visualRightHref || "",
        pageData.visualRightLinkTitle || "",
        pageData.visualRightLinkIcon || ""
      );
      setMapProjectDetailText(mapProjectDetailCaptionLeft, pageData.captionLeft || "");
      setMapProjectDetailText(mapProjectDetailCaptionRight, pageData.captionRight || "");
      setMapProjectDetailSectionA(
        pageData.sectionATitle || pageData.headingA || "",
        pageData.sectionABodyHtml || ""
      );
      setMapProjectDetailSectionB(
        pageData.sectionBTitleHtml || "",
        pageData.sectionBBlocks || [],
        pageData.headingB || ""
      );
      mapProjectDetailStage.classList.toggle(
        "has-rich-section-b",
        !!(pageData.sectionBBlocks && pageData.sectionBBlocks.length)
      );
      scheduleSyncMapProjectDetailDesktopMediaSpacing();
    }

    function renderTemplateMakapakkaLayout(pageData, detail) {
      setMapProjectVeritasRootVisible(false);
      clearMapProjectVeritasLayoutContent();
      clearMapProjectDetailDesktopMediaSpacing();
      clearMapProjectOpenTraceRoot();
      renderMapProjectTemplateRoot(pageData, detail);
    }

    function renderOpenTraceLayout(pageData, detail) {
      setMapProjectVeritasRootVisible(false);
      clearMapProjectVeritasLayoutContent();
      clearMapProjectDetailDesktopMediaSpacing();
      clearMapProjectTemplateRoot();
      renderMapProjectOpenTraceRoot(pageData, detail);
    }

    function renderMapProjectDetailPage(nodeId, detail, resolvedPageData) {
      var pageData = resolvedPageData || resolveMapProjectPageData(nodeId, detail);
      var layoutType = pageData && pageData.layoutType ? String(pageData.layoutType) : MAP_PROJECT_LAYOUT_TEMPLATE_MAKAPAKKA;
      var isVeritasLayout = layoutType === MAP_PROJECT_LAYOUT_VERITAS;
      var isTemplateMakapakkaLayout = layoutType === MAP_PROJECT_LAYOUT_TEMPLATE_MAKAPAKKA;
      var isOpenTraceLayout = layoutType === MAP_PROJECT_LAYOUT_OPENTRACE;
      var isPaperMindTemplateLayout = isTemplateMakapakkaLayout && nodeId === "3139:21713";
      mapProjectShell.classList.toggle("map-project-shell--veritas", isVeritasLayout);
      mapProjectShell.classList.toggle("map-project-shell--template-makapakka", isTemplateMakapakkaLayout);
      mapProjectShell.classList.toggle("map-project-shell--opentrace", isOpenTraceLayout);
      mapProjectShell.classList.toggle("map-project-shell--template-papermind", isPaperMindTemplateLayout);
      mapProjectDetailTitle.textContent = pageData.pageTitle || (detail && detail.title ? detail.title : "");
      setMapProjectDetailTitleBadge(
        pageData.titleBadgeSrc || "",
        pageData.titleBadgeHref || "",
        pageData.titleBadgeAlt || ""
      );
      if (isVeritasLayout) {
        renderVeritasMapProjectLayout(pageData, detail);
      } else if (isOpenTraceLayout) {
        renderOpenTraceLayout(pageData, detail);
      } else {
        renderTemplateMakapakkaLayout(pageData, detail);
      }
      scheduleSyncMapProjectDetailHeaderCollapseState();
      scheduleSyncMapProjectDetailHeaderWrapState();
      scheduleSyncMapProjectDetailSectionBScenes();
      scheduleSyncMapProjectDetailChromeTheme();
    }

    function clearMapProjectDetailPage() {
      clearMapProjectViewportRecoveryTasks();
      clearMapProjectDetailDesktopMediaSpacing();
      clearMapProjectDetailHeaderCollapseState();
      clearMapProjectDetailHeaderWrapState();
      clearMapProjectDetailSectionBState();
      clearMapProjectDetailChromeThemeState();
      mapProjectShell.classList.remove("map-project-shell--veritas");
      mapProjectShell.classList.remove("map-project-shell--template-makapakka");
      mapProjectShell.classList.remove("map-project-shell--opentrace");
      mapProjectShell.classList.remove("map-project-shell--template-papermind");
      mapProjectDetailTitle.textContent = "";
      setMapProjectDetailTitleBadge("", "", "");
      setMapProjectDetailText(mapProjectDetailTag1, "");
      setMapProjectDetailText(mapProjectDetailTag2, "");
      setMapProjectDetailText(mapProjectDetailTag3, "");
      setMapProjectDetailHtml(mapProjectDetailCredit, "");
      setMapProjectDetailText(mapProjectDetailInstitute, "");
      setMapProjectDetailText(mapProjectDetailLead, "");
      setMapProjectDetailVisual(mapProjectDetailVisualLeft, "", "");
      setMapProjectDetailVisual(mapProjectDetailVisualRight, "", "");
      setMapProjectDetailExternalLink(mapProjectDetailVisualRightLink, "", "", "");
      setMapProjectDetailText(mapProjectDetailCaptionLeft, "");
      setMapProjectDetailText(mapProjectDetailCaptionRight, "");
      setMapProjectDetailSectionA("", "");
      setMapProjectDetailSectionB("", [], "");
      mapProjectDetailSectionC.hidden = false;
      setMapProjectVeritasRootVisible(true);
      clearMapProjectTemplateRoot();
      clearMapProjectOpenTraceRoot();
    }

    function openMapProject(nodeId) {
      if (!nodeId || !detailByNodeId[nodeId] || !isMapProjectDetailEnabled(nodeId)) return;
      if (document.documentElement.classList.contains("project-inline-open")) return;
      dismissMapProjectTemplateImageViewer();
      var isFreshOpen = !document.documentElement.classList.contains("map-project-open");
      if (isFreshOpen) {
        prepareMapProjectOpenState();
      }

      var detail = detailByNodeId[nodeId];
      var pageData = resolveMapProjectPageData(nodeId, detail);
      var layoutType = pageData && pageData.layoutType ? String(pageData.layoutType) : MAP_PROJECT_LAYOUT_TEMPLATE_MAKAPAKKA;
      mapDetailState.activeNodeId = nodeId;

      hidePreview();
      setMapCenterNavHoverItem(null);
      stopMirrorVideo();
      stopSlideshow();

      if (practiceTitleText) {
        practiceTitleText.textContent = detail.title;
      } else {
        practiceTitle.textContent = detail.title;
      }
      renderMapProjectDetailPage(nodeId, detail, pageData);

      clearMapProjectViewportRecoveryTasks();
      syncMapProjectShellHeight();
      if (isFreshOpen) {
        lockPageScrollForMapDetail();
        resetMapProjectDetailHeaderCollapseState();
      }
      resetMapProjectWheelGesture();
      clearMapProjectHorizontalDrag();
      mapProjectScroll.scrollTop = 0;
      setMapProjectNavOpen(true);
      setMapProjectShellOpen(true);
      document.documentElement.classList.add("map-project-open");
      syncMapProjectWindowAnchorScroll();
      if (layoutType === MAP_PROJECT_LAYOUT_VERITAS) {
        scheduleSyncMapProjectDetailDesktopMediaSpacing();
      } else {
        clearMapProjectDetailDesktopMediaSpacing();
      }
      scheduleSyncMapProjectDetailHeaderCollapseState();
      startMapProjectDetailHeaderCollapseTracking();
      scheduleSyncMapProjectDetailHeaderWrapState();
      scheduleSyncMapProjectDetailSectionBScenes();
      scheduleSyncMapProjectDetailChromeTheme();
      syncActiveNavIndex();
      syncMapProjectNavAvailability();
      playPendingMapProjectEntryAnimation();
    }

    function closeMapProject() {
      if (!mapDetailState.activeNodeId && !document.documentElement.classList.contains("map-project-open")) return;
      clearMapProjectViewportRecoveryTasks();
      mapDetailState.activeNodeId = null;
      mapDetailNavState.activeIndex = -1;
      resetMapProjectWheelGesture();
      mapDetailNavState.pendingEntryShift = 0;
      mapDetailNavState.navCooldownUntil = 0;
      clearMapProjectHorizontalDrag();
      document.documentElement.classList.remove("map-project-open");
      setMapProjectShellOpen(false);
      setMapProjectNavOpen(false);
      if (practiceTitleText) {
        practiceTitleText.textContent = practiceTitleOriginalText;
      } else {
        practiceTitle.textContent = practiceTitleOriginalText;
      }
      dismissMapProjectTemplateImageViewer();
      stopMapProjectDetailMedia();
      clearMapProjectDetailPage();
      mapProjectScroll.scrollTop = 0;
      clearMapProjectShellHeight();
      unlockPageScrollForMapDetail();
      window.requestAnimationFrame(function () {
        syncPracticeResponsiveLayout(false);
        syncMapCenterNavState();
        syncTouchLensState();
      });
    }

    function navigateMapProject(offset, source, entryShift) {
      if (!document.documentElement.classList.contains("map-project-open")) return;
      if (!mapDetailState.activeNodeId) return;
      if (mapDetailNavState.orderedNodeIds.length < 2) return;
      var nextNodeId = getNextNodeId(offset);
      if (!nextNodeId || nextNodeId === mapDetailState.activeNodeId) return;
      var numericShift = Number(entryShift);
      mapDetailNavState.pendingEntryShift = (isFinite(numericShift) && numericShift !== 0) ? numericShift : 0;
      var nextHash = buildMapProjectHash(nextNodeId);
      if (window.location.hash === nextHash) {
        openMapProject(nextNodeId);
      } else {
        window.location.hash = nextHash;
      }
      resetMapProjectWheelGesture();
      mapDetailNavState.navCooldownUntil = Date.now() + 440;
    }

    function bindMapProjectHorizontalInteractions() {
      mapProjectPrevBtn.addEventListener("click", function () {
        navigateMapProject(-1, "button-prev");
      });
      mapProjectNextBtn.addEventListener("click", function () {
        navigateMapProject(1, "button-next");
      });

      if (!supportsFineHover) return;

      mapProjectShell.addEventListener("wheel", function (event) {
        if (!document.documentElement.classList.contains("map-project-open")) return;
        if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
        if (mapDetailNavState.drag.active) return;
        event.preventDefault();
        if (Date.now() < mapDetailNavState.navCooldownUntil) return;
        if (Math.abs(event.deltaX) < 2) return;

        var wheel = mapDetailNavState.wheelGesture;
        if (wheel.committed) {
          scheduleMapProjectWheelGestureReset(180);
          return;
        }
        wheel.active = true;
        var width = mapProjectShell.getBoundingClientRect().width || 0;
        var maxShift = Math.max(90, width * 0.26);
        // Keep switch threshold reachable within the current drag clamp.
        var threshold = Math.min(
          Math.max(120, width * 0.18),
          Math.max(72, maxShift * 0.82)
        );
        var nextDelta = wheel.deltaX - (event.deltaX * 0.85);
        wheel.deltaX = Math.max(-maxShift, Math.min(maxShift, nextDelta));
        scheduleMapProjectWheelGestureReset(140);

        if (Math.abs(wheel.deltaX) < threshold) return;

        var direction = wheel.deltaX > 0 ? -1 : 1;
        wheel.active = false;
        wheel.deltaX = 0;
        wheel.committed = true;
        scheduleMapProjectWheelGestureReset(180);
        navigateMapProject(direction, "wheel", 0);
      }, { passive: false });

      mapProjectScroll.addEventListener("wheel", handleMapProjectOpenTraceSequenceWheel, { passive: false });

      mapProjectShell.addEventListener("mousedown", function (event) {
        if (!document.documentElement.classList.contains("map-project-open")) return;
        if (event.button === 1) {
          event.preventDefault();
        }
      });

      mapProjectShell.addEventListener("auxclick", function (event) {
        if (!document.documentElement.classList.contains("map-project-open")) return;
        if (event.button === 1) {
          event.preventDefault();
        }
      });

      mapProjectShell.addEventListener("pointerdown", function (event) {
        if (!document.documentElement.classList.contains("map-project-open")) return;
        if (Date.now() < mapDetailNavState.navCooldownUntil) return;
        if (event.pointerType && event.pointerType !== "mouse") return;
        if (event.button !== 1) return;
        var interactive = event.target && event.target.closest
          ? event.target.closest("button, a, input, textarea, select, [role='button']")
          : null;
        if (interactive) return;

        event.preventDefault();
        resetMapProjectWheelGesture();

        var drag = mapDetailNavState.drag;
        drag.active = true;
        drag.pointerId = event.pointerId;
        drag.startX = event.clientX;
        drag.currentDeltaX = 0;
        mapProjectContent.classList.add("is-dragging-horizontal");
        if (typeof mapProjectShell.setPointerCapture === "function") {
          try {
            mapProjectShell.setPointerCapture(event.pointerId);
          } catch (error) {}
        }
      });

      mapProjectShell.addEventListener("pointermove", function (event) {
        var drag = mapDetailNavState.drag;
        if (!drag.active || event.pointerId !== drag.pointerId) return;
        event.preventDefault();
        var width = mapProjectShell.getBoundingClientRect().width || 0;
        var maxShift = Math.max(96, width * 0.28);
        var delta = event.clientX - drag.startX;
        drag.currentDeltaX = Math.max(-maxShift, Math.min(maxShift, delta));
        setMapProjectContentTranslate(drag.currentDeltaX, false);
      });

      function finishPointerDrag(event) {
        var drag = mapDetailNavState.drag;
        if (!drag.active || event.pointerId !== drag.pointerId) return;
        var delta = drag.currentDeltaX;
        var width = mapProjectShell.getBoundingClientRect().width || 0;
        var threshold = Math.max(180, width * 0.24);
        var direction = 0;
        if (Math.abs(delta) >= threshold) {
          direction = delta > 0 ? -1 : 1;
        }

        drag.active = false;
        drag.pointerId = -1;
        drag.startX = 0;
        drag.currentDeltaX = 0;
        mapProjectContent.classList.remove("is-dragging-horizontal");

        if (!direction) {
          settleMapProjectContentToOrigin();
          return;
        }

        var entryShift = direction > 0 ? Math.min(width * 0.18, 120) : -Math.min(width * 0.18, 120);
        navigateMapProject(direction, "mouse-drag", entryShift);
      }

      mapProjectShell.addEventListener("pointerup", finishPointerDrag);
      mapProjectShell.addEventListener("pointercancel", finishPointerDrag);
      mapProjectShell.addEventListener("lostpointercapture", finishPointerDrag);

      mapProjectScroll.addEventListener("scroll", handleMapProjectDetailScrollSync, { passive: true });
      mapProjectScroll.addEventListener("touchmove", handleMapProjectDetailScrollSync, { passive: true });
    }

    function renderMapProjectByHash() {
      var isInitialHashRender = !mapProjectInitialHashHandled;
      mapProjectInitialHashHandled = true;
      if (document.documentElement.classList.contains("project-inline-open")) {
        hidePracticeOnboarding();
        closeMapProject();
        return;
      }
      var nodeId = getMapProjectFromHash();
      if (nodeId) {
        hidePracticeOnboarding();
        if (!isMapProjectDetailEnabled(nodeId)) {
          closeMapProject();
          clearMapProjectHash();
          return;
        }
        syncMapProjectHashToCanonical(nodeId);
        if (isInitialHashRender && !document.documentElement.classList.contains("map-project-open")) {
          setPendingMapProjectEntryContext("direct");
          ensureInitialDirectMapProjectHistory(nodeId);
        }
        openMapProject(nodeId);
        return;
      }
      closeMapProject();
      if (hasMapProjectHash()) {
        clearMapProjectHash();
      }
      schedulePracticeOnboarding();
    }

    function showCaption(nodeId) {
      if (!caption || !captionTitle || !captionDesc) return;
      var copy = captionByNodeId[nodeId];
      if (!copy) {
        hideCaption();
        return;
      }
      captionTitle.textContent = copy.title;
      captionDesc.textContent = copy.desc || "";
      if (captionAward && captionAwardLogo && captionAwardText) {
        var hasAward = !!(copy.award || copy.awardLogoSrc);
        captionAward.hidden = !hasAward;
        captionAward.setAttribute("aria-hidden", hasAward ? "false" : "true");
        captionAwardText.textContent = copy.award || "";
        if (copy.awardLogoSrc) {
          captionAwardLogo.hidden = false;
          captionAwardLogo.src = String(copy.awardLogoSrc);
        } else {
          captionAwardLogo.hidden = true;
          captionAwardLogo.removeAttribute("src");
        }
      }
      caption.hidden = false;
      caption.setAttribute("aria-hidden", "false");
    }

    function hideCaption() {
      if (!caption) return;
      caption.hidden = true;
      caption.setAttribute("aria-hidden", "true");
      if (captionTitle) captionTitle.textContent = "";
      if (captionDesc) captionDesc.textContent = "";
      if (captionAward) {
        captionAward.hidden = true;
        captionAward.setAttribute("aria-hidden", "true");
      }
      if (captionAwardLogo) {
        captionAwardLogo.hidden = true;
        captionAwardLogo.removeAttribute("src");
      }
      if (captionAwardText) captionAwardText.textContent = "";
      caption.style.removeProperty("--map-hover-caption-cursor-x");
      caption.style.removeProperty("--map-hover-caption-cursor-y");
      caption.style.removeProperty("--map-hover-caption-cursor-w");
      caption.removeAttribute("data-cursor-placement");
      if (captionAwardText) {
        captionAwardText.style.removeProperty("--map-hover-caption-award-text-scale");
      }
    }

    function getCaptionReservedHeight() {
      if (!caption || caption.hidden) return 0;
      if (canHover && caption.classList.contains("map-hover-caption--cursor")) return 0;
      var rect = caption.getBoundingClientRect();
      if (!rect.height) return 0;

      var safeGapRaw = window.getComputedStyle(caption).getPropertyValue("--map-hover-caption-safe-gap");
      var safeGap = Number(String(safeGapRaw).replace(/px$/i, "").trim());
      if (!isFinite(safeGap) || safeGap < 0) safeGap = 18;

      var viewportBottomGap = Math.max(0, window.innerHeight - rect.bottom);
      return Math.ceil(rect.height + viewportBottomGap + safeGap);
    }

    function getMapCenterPreviewFooterReserve(mode, config) {
      var slideCount = mode === "slideshow" && config && config.slides && config.slides.length
        ? config.slides.length
        : 0;
      if (slideCount < 2) return 0;
      if (canHover && hasCursorPreviewPoint && !isMapCenterNavActive()) {
        return MAP_CENTER_CURSOR_PREVIEW_FOOTER_RESERVE;
      }
      return MAP_CENTER_PREVIEW_FOOTER_RESERVE;
    }

    function setCursorPreviewPoint(clientX, clientY) {
      if (!canHover) return false;
      var x = Number(clientX);
      var y = Number(clientY);
      if (!isFinite(x) || !isFinite(y)) return false;
      cursorPreviewClientX = x;
      cursorPreviewClientY = y;
      hasCursorPreviewPoint = true;
      return true;
    }

    function clearCursorPreviewPoint() {
      hasCursorPreviewPoint = false;
      preview.style.removeProperty("--map-center-preview-cursor-x");
      preview.style.removeProperty("--map-center-preview-cursor-y");
    }

    function getCursorPreviewSideMaxWidth(viewportPad) {
      if (!canHover || !hasCursorPreviewPoint || isMapCenterNavActive()) return Infinity;
      var pad = Math.max(0, Number(viewportPad) || 0);
      var gap = MAP_CENTER_CURSOR_PREVIEW_GAP;
      var leftRoom = cursorPreviewClientX - pad - gap;
      var rightRoom = window.innerWidth - cursorPreviewClientX - pad - gap;
      var bestSideRoom = Math.max(leftRoom, rightRoom);
      if (!isFinite(bestSideRoom) || bestSideRoom <= 0) return Infinity;
      return Math.max(220, bestSideRoom);
    }

    function positionCursorPreview() {
      if (!canHover || !hasCursorPreviewPoint || isMapCenterNavActive() || preview.hidden) return;
      var rect = previewFrame.getBoundingClientRect();
      var width = rect.width || previewFrame.offsetWidth || 0;
      var height = rect.height || previewFrame.offsetHeight || 0;
      if (!(width > 0) || !(height > 0)) return;

      var pad = MAP_CENTER_CURSOR_PREVIEW_PAD;
      var gap = MAP_CENTER_CURSOR_PREVIEW_GAP;
      var viewportRight = Math.max(pad, window.innerWidth - pad);
      var viewportBottom = Math.max(pad, window.innerHeight - pad);
      var bottomReserve = getCaptionReservedHeight() + getMapCenterPreviewFooterReserve(activeMode, activeConfig);
      if (bottomReserve > 0) {
        viewportBottom = Math.max(pad, window.innerHeight - bottomReserve);
      }

      var rightRoom = viewportRight - cursorPreviewClientX - gap;
      var leftRoom = cursorPreviewClientX - pad - gap;
      var placeRight = rightRoom >= width || rightRoom >= leftRoom;
      var nextX = placeRight
        ? cursorPreviewClientX + gap
        : cursorPreviewClientX - gap - width;
      var maxX = viewportRight - width;
      if (maxX < pad) maxX = Math.max(pad, window.innerWidth - pad - width);
      nextX = clampNumber(nextX, pad, Math.max(pad, maxX));

      var belowRoom = viewportBottom - cursorPreviewClientY - gap;
      var aboveRoom = cursorPreviewClientY - pad - gap;
      var placeBelow = belowRoom >= height || belowRoom >= aboveRoom;
      var nextY = placeBelow
        ? cursorPreviewClientY + gap
        : cursorPreviewClientY - gap - height;
      var maxY = viewportBottom - height;
      if (maxY < pad) maxY = Math.max(pad, window.innerHeight - pad - height);
      nextY = clampNumber(nextY, pad, Math.max(pad, maxY));

      preview.style.setProperty("--map-center-preview-cursor-x", Math.round(nextX) + "px");
      preview.style.setProperty("--map-center-preview-cursor-y", Math.round(nextY) + "px");
      positionCursorCaption();
    }

    function getCursorCaptionPrimarySide(previewRect) {
      if (!previewRect || !(previewRect.width > 0)) {
        return cursorPreviewClientX < window.innerWidth * 0.5 ? "right" : "left";
      }
      var previewCenterX = previewRect.left + (previewRect.width * 0.5);
      return previewCenterX < cursorPreviewClientX ? "right" : "left";
    }

    function getCursorCaptionSideRoom(side, pad, gap) {
      if (side === "left") {
        return cursorPreviewClientX - pad - gap;
      }
      return window.innerWidth - cursorPreviewClientX - pad - gap;
    }

    function syncCursorCaptionWidth(previewRect) {
      if (!canHover || !caption || !hasCursorPreviewPoint) return;
      var pad = MAP_CENTER_CURSOR_CAPTION_PAD;
      var gap = MAP_CENTER_CURSOR_CAPTION_GAP;
      var primarySide = getCursorCaptionPrimarySide(previewRect);
      var primaryRoom = getCursorCaptionSideRoom(primarySide, pad, gap);
      var secondaryRoom = getCursorCaptionSideRoom(primarySide === "left" ? "right" : "left", pad, gap);
      var viewportRoom = Math.max(0, window.innerWidth - (pad * 2));
      var preferredRoom = primaryRoom >= 178 ? primaryRoom : Math.max(primaryRoom, secondaryRoom, viewportRoom);
      var targetWidth = Math.min(352, Math.max(178, preferredRoom));
      targetWidth = Math.min(targetWidth, viewportRoom);
      if (!isFinite(targetWidth) || targetWidth <= 0) return;
      caption.style.setProperty("--map-hover-caption-cursor-w", Math.round(targetWidth) + "px");
    }

    function getRectOverlapArea(rectA, rectB) {
      if (!rectA || !rectB) return 0;
      var width = Math.max(0, Math.min(rectA.right, rectB.right) - Math.max(rectA.left, rectB.left));
      var height = Math.max(0, Math.min(rectA.bottom, rectB.bottom) - Math.max(rectA.top, rectB.top));
      return width * height;
    }

    function syncCaptionAwardTextFit() {
      if (!canHover || !caption || !captionAward || !captionAwardText) return;
      captionAwardText.style.setProperty("--map-hover-caption-award-text-scale", "1");
      if (caption.hidden || captionAward.hidden || !caption.classList.contains("map-hover-caption--cursor")) return;
      var naturalWidth = captionAwardText.scrollWidth || captionAwardText.offsetWidth || 0;
      if (!(naturalWidth > 0)) return;
      var awardStyle = window.getComputedStyle(captionAward);
      var paddingLeft = parseFloat(awardStyle.paddingLeft) || 0;
      var paddingRight = parseFloat(awardStyle.paddingRight) || 0;
      var targetWidth = Math.max(1, captionAward.clientWidth - paddingLeft - paddingRight);
      var scale = Math.min(1, targetWidth / naturalWidth);
      scale = Math.max(0.58, scale);
      captionAwardText.style.setProperty("--map-hover-caption-award-text-scale", scale.toFixed(4));
    }

    function positionCursorCaption() {
      if (!canHover || !caption || !hasCursorPreviewPoint || isMapCenterNavActive() || caption.hidden) return;
      var previewRect = !preview.hidden && previewFrame
        ? previewFrame.getBoundingClientRect()
        : null;
      if (previewRect && (!(previewRect.width > 0) || !(previewRect.height > 0))) {
        previewRect = null;
      }

      syncCursorCaptionWidth(previewRect);
      syncCaptionAwardTextFit();

      var captionRect = caption.getBoundingClientRect();
      var captionWidth = captionRect.width || caption.offsetWidth || 0;
      var captionHeight = captionRect.height || caption.offsetHeight || 0;
      if (!(captionWidth > 0) || !(captionHeight > 0)) return;

      var pad = MAP_CENTER_CURSOR_CAPTION_PAD;
      var gap = MAP_CENTER_CURSOR_CAPTION_GAP;
      var maxX = Math.max(pad, window.innerWidth - pad - captionWidth);
      var maxY = Math.max(pad, window.innerHeight - pad - captionHeight);
      var primarySide = getCursorCaptionPrimarySide(previewRect);
      var secondarySide = primarySide === "left" ? "right" : "left";
      var candidates = [];

      function addCandidate(x, y, priority, label) {
        var clampedX = clampNumber(x, pad, maxX);
        var clampedY = clampNumber(y, pad, maxY);
        var candidateRect = {
          left: clampedX,
          top: clampedY,
          right: clampedX + captionWidth,
          bottom: clampedY + captionHeight
        };
        var moved = Math.abs(clampedX - x) + Math.abs(clampedY - y);
        var centerX = clampedX + (captionWidth * 0.5);
        var centerY = clampedY + (captionHeight * 0.5);
        var distance = Math.sqrt(
          Math.pow(centerX - cursorPreviewClientX, 2) +
          Math.pow(centerY - cursorPreviewClientY, 2)
        );
        var overlap = previewRect ? getRectOverlapArea(candidateRect, previewRect) : 0;
        var score = distance + (moved * 1.8) + priority;
        if (overlap > 0) {
          score += 2800 + (overlap / 14);
        }
        candidates.push({
          x: clampedX,
          y: clampedY,
          score: score,
          label: label
        });
      }

      function addSideCandidates(side, priorityOffset) {
        var x = side === "left"
          ? cursorPreviewClientX - gap - captionWidth
          : cursorPreviewClientX + gap;
        var middleY = cursorPreviewClientY - (captionHeight * 0.5);
        addCandidate(x, middleY, priorityOffset, side + "-middle");
        addCandidate(x, cursorPreviewClientY + gap, priorityOffset + 34, side + "-below");
        addCandidate(x, cursorPreviewClientY - gap - captionHeight, priorityOffset + 38, side + "-above");
        if (previewRect) {
          addCandidate(
            x,
            previewRect.top + (previewRect.height * 0.5) - (captionHeight * 0.5),
            priorityOffset + 58,
            side + "-image-middle"
          );
        }
      }

      addSideCandidates(primarySide, 0);
      addSideCandidates(secondarySide, 120);
      addCandidate(
        cursorPreviewClientX - (captionWidth * 0.5),
        cursorPreviewClientY - gap - captionHeight,
        180,
        "center-above"
      );
      addCandidate(
        cursorPreviewClientX - (captionWidth * 0.5),
        cursorPreviewClientY + gap,
        184,
        "center-below"
      );

      if (!candidates.length) return;
      candidates.sort(function (a, b) {
        return a.score - b.score;
      });
      var best = candidates[0];
      caption.style.setProperty("--map-hover-caption-cursor-x", Math.round(best.x) + "px");
      caption.style.setProperty("--map-hover-caption-cursor-y", Math.round(best.y) + "px");
      caption.setAttribute("data-cursor-placement", best.label);
    }

    function syncMapCenterPreviewVerticalOffset(previewHeight, bottomReservedHeight, viewportPad) {
      if (!preview) return;
      var height = Number(previewHeight) || 0;
      var reserve = Math.max(0, Number(bottomReservedHeight) || 0);
      var pad = Math.max(0, Number(viewportPad) || 0);
      var centeredTopGap = Math.max(0, (window.innerHeight - height) * 0.5);
      var maxShift = Math.max(0, centeredTopGap - pad);
      var shift = reserve > 0 ? Math.min(maxShift, reserve * 0.5) : 0;
      preview.style.setProperty("--map-center-preview-shift-y", Math.round(shift) + "px");
    }

    function syncPreviewSize(item, mode, config) {
      var itemRect = item.getBoundingClientRect();
      var mapRect = mapWrap.getBoundingClientRect();
      if (!itemRect.width || !itemRect.height || !mapRect.width) return;

      var scaleBoost = 1.5;
      var perProjectScale = getPracticeHoverPreviewScale(item);
      var openTracesBox = mode === "open-traces" ? getOpenTracesBox(mapRect.width) : null;
      var slideshowRatio = mode === "slideshow" ? getSlideshowAnchorRatio(config) : null;
      var slideshowActiveRatio = mode === "slideshow" ? getSlideshowActiveRatio(config) : null;
      var ratio = mode === "open-traces"
        ? openTracesBox.height / openTracesBox.width
        : (slideshowRatio || (itemRect.height / itemRect.width));
      if (!ratio || ratio <= 0) ratio = itemRect.height / itemRect.width;
      var viewportPad = 24;
      var maxWidth = Math.max(220, Math.min(mapRect.width, window.innerWidth - (viewportPad * 2)));
      if (canHover && hasCursorPreviewPoint && !isMapCenterNavActive()) {
        maxWidth = Math.min(maxWidth, getCursorPreviewSideMaxWidth(viewportPad));
      }
      var targetWidth = Math.min(Math.max(420, itemRect.width * 3), maxWidth);
      targetWidth = Math.min(targetWidth * scaleBoost * perProjectScale, maxWidth);
      var targetHeight = targetWidth * ratio;
      var defaultMaxHeight = window.innerHeight * 0.82;
      var captionReservedHeight = getCaptionReservedHeight();
      var previewFooterReserve = getMapCenterPreviewFooterReserve(mode, config);
      var bottomReservedHeight = captionReservedHeight + previewFooterReserve;
      var maxHeight = defaultMaxHeight;
      if (bottomReservedHeight > 0) {
        maxHeight = Math.min(defaultMaxHeight, window.innerHeight - bottomReservedHeight - viewportPad);
      }
      maxHeight = Math.min(maxHeight, window.innerHeight - (viewportPad * 2));
      if (!isFinite(maxHeight) || maxHeight <= 120) {
        maxHeight = defaultMaxHeight;
      }

      if (mode === "slideshow") {
        var activeRatio = slideshowActiveRatio || ratio;
        if (!activeRatio || activeRatio <= 0) activeRatio = ratio;
        var uniformHeight = targetHeight;
        var uniformWidth = uniformHeight / activeRatio;
        if (isFinite(uniformWidth) && uniformWidth > 0) {
          targetWidth = uniformWidth;
        }
        targetHeight = uniformHeight;
      }

      if (targetHeight > maxHeight) {
        var scaleByHeight = maxHeight / targetHeight;
        targetHeight *= scaleByHeight;
        targetWidth *= scaleByHeight;
      }
      if (targetWidth > maxWidth) {
        var scaleByWidth = maxWidth / targetWidth;
        targetWidth *= scaleByWidth;
        targetHeight *= scaleByWidth;
      }

      if (mode === "open-traces" && openTracesBox && openTracesBox.width > 0 && openTracesBox.height > 0) {
        var contentScale = Math.min(targetWidth / openTracesBox.width, targetHeight / openTracesBox.height);
        var finalWidth = openTracesBox.width * contentScale;
        var finalHeight = openTracesBox.height * contentScale;

        previewFrame.style.setProperty("--map-center-preview-w", Math.round(finalWidth) + "px");
        previewFrame.style.setProperty("--map-center-preview-h", Math.round(finalHeight) + "px");
        previewFrame.style.setProperty("--map-center-open-traces-base-w", openTracesBox.width + "px");
        previewFrame.style.setProperty("--map-center-open-traces-base-h", openTracesBox.height + "px");
        previewFrame.style.setProperty("--map-center-open-traces-scale", contentScale.toFixed(6));
      } else {
        previewFrame.style.setProperty("--map-center-preview-w", Math.round(targetWidth) + "px");
        previewFrame.style.setProperty("--map-center-preview-h", Math.round(targetHeight) + "px");
      }
      syncMapCenterPreviewVerticalOffset(targetHeight, bottomReservedHeight, viewportPad);
    }

    function showForItem(item, options) {
      var opts = options || {};
      var force = !!opts.force;
      if (!canHover && !force) return;
      if (document.documentElement.classList.contains("project-inline-open")) return;
      if (document.documentElement.classList.contains("map-project-open")) return;
      if (canHover && !force) {
        setCursorPreviewPoint(opts.clientX, opts.clientY);
      }

      var config = resolveItemPreviewConfig(item);
      var nodeId = item.getAttribute("data-node-id") || "";
      var detailEnabled = isMapProjectDetailEnabled(nodeId);
      if (!force) {
        dismissPracticeOnboarding({ persist: true });
      }
      activeItem = item;
      activeMode = config.mode || "placeholder";
      activeConfig = config;
      if (activeMode === "slideshow" && (!previewSlideshow || (!slideshowLayers.length && !previewSlideshowVideo) || !config.slides || !config.slides.length)) {
        activeMode = "placeholder";
      }
      showCaption(nodeId);
      syncPreviewSize(item, activeMode, activeConfig);
      setMode(activeMode, activeConfig);
      preview.hidden = false;
      preview.setAttribute("aria-hidden", "false");
      preview.setAttribute("data-detail-enabled", detailEnabled ? "true" : "false");
      if (canHover && !force) {
        positionCursorPreview();
        window.requestAnimationFrame(positionCursorPreview);
      }

      if (activeMode === "open-traces" && mirrorVideo) {
        stopSlideshow();
        mirrorVideo.currentTime = 0;
        mirrorVideo.play().catch(function () {});
      } else if (activeMode === "slideshow") {
        stopMirrorVideo();
        if (!startSlideshow(config)) {
          if (!forceRenderSlideshowFirstFrame(config)) {
            activeMode = "placeholder";
            setMode(activeMode, activeConfig);
          }
        }
      } else {
        stopMirrorVideo();
        stopSlideshow();
      }
    }

    function hidePreview() {
      activeItem = null;
      activeMode = "";
      activeConfig = null;
      preview.style.setProperty("--map-center-preview-shift-y", "0px");
      clearCursorPreviewPoint();
      preview.hidden = true;
      preview.setAttribute("aria-hidden", "true");
      preview.removeAttribute("data-detail-enabled");
      preview.classList.remove(
        "map-center-hover-preview--open-traces",
        "map-center-hover-preview--slideshow",
        "map-center-hover-preview--placeholder",
        "map-center-hover-preview--slideshow-crossfade"
      );
      hideCaption();
      stopMirrorVideo();
      stopSlideshow();
    }

    function getPracticeOnboardingRecommendedItem() {
      return itemByNodeId[VERITAS_NODE_ID] || null;
    }

    function setPracticeOnboardingHighlight(active) {
      var item = getPracticeOnboardingRecommendedItem();
      if (!item) return;
      item.classList.toggle("is-practice-onboarding-focus", !!active);
    }

    function clearPracticeOnboardingTimer() {
      if (!practiceOnboardingShowTimerId) return;
      window.clearTimeout(practiceOnboardingShowTimerId);
      practiceOnboardingShowTimerId = 0;
    }

    function getPracticeOnboardingCopy() {
      if (shouldEnableMapCenterNav()) {
        return {
          primary: "Drag the map under the glass square.",
          secondary: "Center a project block to preview.",
          tertiary: "Tap the preview to open. Try Veritas. <3"
        };
      }
      return {
        primary: "Hover for a quick preview.",
        secondary: "Click to open the project page.",
        tertiary: "Recommend starting with Veritas. <3"
      };
    }

    function updatePracticeOnboardingCopy() {
      if (!practiceOnboardingLinePrimary || !practiceOnboardingLineSecondary || !practiceOnboardingLineTertiary) return;
      var copy = getPracticeOnboardingCopy();
      practiceOnboardingLinePrimary.textContent = copy.primary;
      practiceOnboardingLineSecondary.textContent = copy.secondary;
      practiceOnboardingLineTertiary.textContent = copy.tertiary;
    }

    function ensurePracticeOnboardingCard() {
      if (practiceOnboardingCard && practiceOnboardingCard.isConnected) {
        updatePracticeOnboardingCopy();
        return practiceOnboardingCard;
      }
      if (!document.body) return null;

      var card = document.createElement("aside");
      var closeBtn = document.createElement("button");
      var panel = document.createElement("div");
      var primary = document.createElement("p");
      var secondary = document.createElement("p");
      var tertiary = document.createElement("p");
      var closeIcon = document.createElement("img");

      card.className = "practice-onboarding-card";
      card.hidden = true;
      card.setAttribute("aria-hidden", "true");
      card.setAttribute("aria-label", "My Work interaction guide");

      closeBtn.className = "practice-onboarding-card-close";
      closeBtn.type = "button";
      closeBtn.setAttribute("aria-label", "Dismiss My Work guide");
      closeIcon.className = "practice-onboarding-card-close-icon";
      closeIcon.src = "./assets/MyPractice/onboarding-close.svg";
      closeIcon.alt = "";
      closeIcon.decoding = "async";
      closeBtn.appendChild(closeIcon);

      panel.className = "practice-onboarding-card-panel";
      primary.className = "practice-onboarding-card-line";
      secondary.className = "practice-onboarding-card-line";
      tertiary.className = "practice-onboarding-card-line";

      closeBtn.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        dismissPracticeOnboarding({ persist: true });
      });

      card.addEventListener("click", function (event) {
        event.stopPropagation();
      });

      card.appendChild(closeBtn);
      panel.appendChild(primary);
      panel.appendChild(secondary);
      panel.appendChild(tertiary);
      card.appendChild(panel);
      document.body.appendChild(card);

      practiceOnboardingCard = card;
      practiceOnboardingLinePrimary = primary;
      practiceOnboardingLineSecondary = secondary;
      practiceOnboardingLineTertiary = tertiary;
      updatePracticeOnboardingCopy();
      return practiceOnboardingCard;
    }

    function isPracticeOnboardingEligible() {
      if (!PRACTICE_ONBOARDING_ENABLED) return false;
      if (practiceOnboardingDismissed) return false;
      if (shouldBypassPracticeUnavailableNotice()) return false;
      if (!practiceSection || !mapWrap) return false;
      if (document.documentElement.classList.contains("project-inline-open")) return false;
      if (document.documentElement.classList.contains("map-project-open")) return false;
      if (hasMapProjectHash()) return false;
      return true;
    }

    function isPracticeOnboardingInView() {
      if (!practiceSection) return false;
      var rect = practiceSection.getBoundingClientRect();
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      if (!(viewportHeight > 0)) return false;
      return rect.top <= viewportHeight * 0.8 && rect.bottom >= viewportHeight * 0.2;
    }

    function hidePracticeOnboarding() {
      clearPracticeOnboardingTimer();
      setPracticeOnboardingHighlight(false);
      if (!practiceOnboardingCard) return;
      practiceOnboardingCard.hidden = true;
      practiceOnboardingCard.setAttribute("aria-hidden", "true");
      practiceOnboardingCard.classList.remove("is-visible");
    }

    function dismissPracticeOnboarding(options) {
      var opts = options || {};
      hidePracticeOnboarding();
      practiceOnboardingHasShown = true;
      if (opts.persist === false) return;
      practiceOnboardingDismissed = true;
      safeWriteLocalStorage(PRACTICE_ONBOARDING_STORAGE_KEY, "1");
    }

    function showPracticeOnboarding() {
      clearPracticeOnboardingTimer();
      if (!isPracticeOnboardingEligible()) return false;
      if (!isPracticeOnboardingInView()) return false;
      var card = ensurePracticeOnboardingCard();
      if (!card) return false;
      updatePracticeOnboardingCopy();
      card.hidden = false;
      card.setAttribute("aria-hidden", "false");
      card.classList.add("is-visible");
      practiceOnboardingHasShown = true;
      setPracticeOnboardingHighlight(true);
      return true;
    }

    function schedulePracticeOnboarding() {
      if (!isPracticeOnboardingEligible()) {
        hidePracticeOnboarding();
        return false;
      }
      if (!isPracticeOnboardingInView()) {
        clearPracticeOnboardingTimer();
        return false;
      }
      if (practiceOnboardingCard && !practiceOnboardingCard.hidden) {
        updatePracticeOnboardingCopy();
        return true;
      }
      if (practiceOnboardingShowTimerId) return true;
      practiceOnboardingShowTimerId = window.setTimeout(function () {
        practiceOnboardingShowTimerId = 0;
        showPracticeOnboarding();
      }, PRACTICE_ONBOARDING_SHOW_DELAY_MS);
      return true;
    }

    function openMapProjectFromNode(nodeId) {
      if (!nodeId || !detailByNodeId[nodeId]) return false;
      if (!isMapProjectDetailEnabled(nodeId)) {
        return false;
      }
      dismissPracticeOnboarding({ persist: true });
      hidePreview();
      setPendingMapProjectEntryContext("map");
      var nextHash = buildMapProjectHash(nodeId);
      if (window.location.hash === nextHash) {
        openMapProject(nodeId);
      } else {
        window.location.hash = nextHash;
      }
      return true;
    }

    function clampNumber(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function countMapCenterNavPointers() {
      return Object.keys(mapCenterNavState.pointers).length;
    }

    function getMapCenterNavPointerList() {
      return Object.keys(mapCenterNavState.pointers).map(function (id) {
        return mapCenterNavState.pointers[id];
      });
    }

    function clearMapCenterNavPointers() {
      mapCenterNavState.pointers = {};
      mapCenterNavState.dragPointerId = -1;
      mapCenterNavState.pinchInitialDist = 0;
      mapCenterNavState.pinchInitialScale = mapCenterNavState.scale;
      mapCenterNavState.tapPointerId = -1;
      mapCenterNavState.tapMoved = false;
    }

    function shouldEnableMapCenterNav() {
      if (!mapWrap || !mapViewport || !mapScene || !mapOverlay || !items.length) return false;
      if (window.innerWidth >= PRACTICE_MAP_BREAKPOINT) return false;
      if (isPracticeMobileDebugActive()) return false;
      if (touchLensPointerMql) return !!touchLensPointerMql.matches;
      return !supportsFineHover;
    }

    function isMapCenterNavActive() {
      return !!mapCenterNavState.enabled;
    }

    function ensureMapCenterCrosshair() {
      if (mapCenterNavState.crosshairEl) return;
      var crosshair = document.createElement("div");
      crosshair.className = "mypractice-map-center-crosshair";
      crosshair.setAttribute("aria-hidden", "true");
      mapViewport.appendChild(crosshair);
      mapCenterNavState.crosshairEl = crosshair;
    }

    function readPracticeGridCellPx() {
      if (!mapWrap) return 0;
      var computed = window.getComputedStyle(mapWrap);
      var cssCell = parseFloat(computed.getPropertyValue("--practice-grid-cell"));
      if (isFinite(cssCell) && cssCell > 0) return cssCell;
      var probeBlock = mapWrap.querySelector(".mypractice-map-block");
      var probeRect = probeBlock ? probeBlock.getBoundingClientRect() : null;
      if (probeRect && probeRect.width > 0) return probeRect.width;
      return 0;
    }

    function readPracticeViewStartValue(varName, fallback) {
      if (!mapWrap) return fallback;
      var raw = window.getComputedStyle(mapWrap).getPropertyValue(varName);
      var parsed = parseFloat(raw);
      if (isFinite(parsed)) return parsed;
      return fallback;
    }

    function readPracticeItemCellOffset(item, startCol, startRow, cell) {
      var col = readItemCoordWithFallback(item, ["--scaled-col-mobile", "--col-mobile", "--scaled-col", "--col-desktop", "--col"]);
      var row = readItemCoordWithFallback(item, ["--scaled-row-mobile", "--row-mobile", "--scaled-row", "--row-desktop", "--row"]);
      var visualRowOffset = PRACTICE_ROW_VISUAL_OFFSET;
      var left = (col - startCol) * cell;
      var top = ((row + visualRowOffset) - startRow) * cell;
      return { left: left, top: top };
    }

    function getPracticeItemsWorldBounds(expandRows) {
      if (!items.length) return null;
      var cell = readPracticeGridCellPx();
      if (!(cell > 0)) return null;
      var startCol = readPracticeViewStartValue("--practice-view-start-col", 1);
      var startRow = readPracticeViewStartValue("--practice-view-start-row", 1);
      var minX = Infinity;
      var minY = Infinity;
      var maxX = -Infinity;
      var maxY = -Infinity;
      var hasBounds = false;

      items.forEach(function (item) {
        var offset = readPracticeItemCellOffset(item, startCol, startRow, cell);
        var blocks = item.querySelectorAll(".mypractice-map-block");
        if (blocks && blocks.length) {
          Array.prototype.forEach.call(blocks, function (block) {
            var cx = readItemCoord(block, "--cx");
            var cy = readItemCoord(block, "--cy");
            var blockLeft = offset.left + (cx * cell);
            var blockTop = offset.top + (cy * cell);
            var blockRight = blockLeft + cell;
            var blockBottom = blockTop + cell;
            minX = Math.min(minX, blockLeft);
            minY = Math.min(minY, blockTop);
            maxX = Math.max(maxX, blockRight);
            maxY = Math.max(maxY, blockBottom);
            hasBounds = true;
          });
          return;
        }
        var wSpan = Math.max(1, readItemCoordWithFallback(item, ["--w-span"]));
        var hSpan = Math.max(1, readItemCoordWithFallback(item, ["--h-span"]));
        minX = Math.min(minX, offset.left);
        minY = Math.min(minY, offset.top);
        maxX = Math.max(maxX, offset.left + (wSpan * cell));
        maxY = Math.max(maxY, offset.top + (hSpan * cell));
        hasBounds = true;
      });

      if (!hasBounds) return null;
      var expand = Math.max(0, Number(expandRows) || 0) * cell;
      return {
        minX: minX - expand,
        minY: minY - expand,
        maxX: maxX + expand,
        maxY: maxY + expand
      };
    }

    function getMapCenterNavTranslateBounds(scale) {
      if (!mapViewport) return null;
      var viewportRect = mapViewport.getBoundingClientRect();
      if (!(viewportRect.width > 0) || !(viewportRect.height > 0)) return null;
      var worldBounds = getPracticeItemsWorldBounds(5);
      if (!worldBounds) return null;
      var centerX = viewportRect.width * 0.5;
      var centerY = viewportRect.height * 0.5;
      return {
        minTx: centerX - (scale * worldBounds.maxX),
        maxTx: centerX - (scale * worldBounds.minX),
        minTy: centerY - (scale * worldBounds.maxY),
        maxTy: centerY - (scale * worldBounds.minY)
      };
    }

    function clampMapCenterNavTransform(tx, ty, scale) {
      var safeScale = Number(scale);
      if (!isFinite(safeScale) || safeScale <= 0) safeScale = 1;
      safeScale = clampNumber(safeScale, mapCenterNavState.minScale, mapCenterNavState.maxScale);
      var bounds = getMapCenterNavTranslateBounds(safeScale);
      if (!bounds) {
        return {
          scale: safeScale,
          tx: Number(tx) || 0,
          ty: Number(ty) || 0
        };
      }
      return {
        scale: safeScale,
        tx: clampNumber(Number(tx) || 0, bounds.minTx, bounds.maxTx),
        ty: clampNumber(Number(ty) || 0, bounds.minTy, bounds.maxTy)
      };
    }

    function setMapCenterNavHoverItem(nextItem) {
      if (mapCenterNavState.activeItem === nextItem) return;
      mapCenterNavState.activeItem = nextItem || null;
      setTouchLensHoverItem(mapCenterNavState.activeItem);
      if (!mapCenterNavState.activeItem) {
        hidePreview();
        return;
      }
      showForItem(mapCenterNavState.activeItem, { force: true });
    }

    function applyMapCenterNavTransform(options) {
      if (!mapScene) return;
      var opts = options || {};
      var clamped = clampMapCenterNavTransform(mapCenterNavState.tx, mapCenterNavState.ty, mapCenterNavState.scale);
      mapCenterNavState.tx = clamped.tx;
      mapCenterNavState.ty = clamped.ty;
      mapCenterNavState.scale = clamped.scale;
      mapScene.style.transformOrigin = "0 0";
      mapScene.style.transform =
        "translate3d(" +
        mapCenterNavState.tx.toFixed(2) +
        "px, " +
        mapCenterNavState.ty.toFixed(2) +
        "px, 0) scale(" +
        mapCenterNavState.scale.toFixed(4) +
        ")";
      if (opts.skipHoverSync) return;
      syncMapCenterNavHover();
    }

    function isPointInsideRect(x, y, rect) {
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }

    function findMapCenterNavItemAtViewportCenter() {
      if (!mapViewport) return null;
      var viewportRect = mapViewport.getBoundingClientRect();
      if (!(viewportRect.width > 0) || !(viewportRect.height > 0)) return null;
      var centerX = viewportRect.left + (viewportRect.width * 0.5);
      var centerY = viewportRect.top + (viewportRect.height * 0.5);

      var matchedItem = null;
      var matchedDistance = Infinity;
      items.forEach(function (item) {
        var blocks = item.querySelectorAll(".mypractice-map-block");
        if (!blocks || !blocks.length) return;
        for (var i = 0; i < blocks.length; i += 1) {
          var rect = blocks[i].getBoundingClientRect();
          if (!(rect.width > 0) || !(rect.height > 0)) continue;
          if (!isPointInsideRect(centerX, centerY, rect)) continue;
          var dx = centerX - (rect.left + (rect.width * 0.5));
          var dy = centerY - (rect.top + (rect.height * 0.5));
          var dist = (dx * dx) + (dy * dy);
          if (shouldPreferPracticeHitCandidate(item, dist, matchedItem, matchedDistance)) {
            matchedDistance = dist;
            matchedItem = item;
          }
        }
      });

      if (matchedItem) return matchedItem;
      return null;
    }

    function syncMapCenterNavHover() {
      if (!isMapCenterNavActive()) {
        setMapCenterNavHoverItem(null);
        return;
      }
      if (
        document.documentElement.classList.contains("project-inline-open") ||
        document.documentElement.classList.contains("map-project-open")
      ) {
        setMapCenterNavHoverItem(null);
        return;
      }
      var item = findMapCenterNavItemAtViewportCenter();
      setMapCenterNavHoverItem(item);
      if (item && activeMode && !preview.hidden) {
        syncPreviewSize(item, activeMode, activeConfig);
      }
    }

    function isMapCenterNavTapOnPreview(clientX, clientY) {
      if (!preview || preview.hidden) return false;
      var previewRect = preview.getBoundingClientRect();
      if (previewRect.width > 0 && previewRect.height > 0) {
        return isPointInsideRect(clientX, clientY, previewRect);
      }
      var viewportRect = mapViewport.getBoundingClientRect();
      var cx = viewportRect.left + (viewportRect.width * 0.5);
      var cy = viewportRect.top + (viewportRect.height * 0.5);
      var dx = clientX - cx;
      var dy = clientY - cy;
      return ((dx * dx) + (dy * dy)) <= (56 * 56);
    }

    function startMapCenterNavDragFromPointer(pointer) {
      if (!pointer) {
        mapCenterNavState.dragPointerId = -1;
        return;
      }
      mapCenterNavState.dragPointerId = pointer.id;
      mapCenterNavState.dragLastX = pointer.x;
      mapCenterNavState.dragLastY = pointer.y;
    }

    function updateMapCenterNavPinchFromPointers() {
      var list = getMapCenterNavPointerList();
      if (list.length < 2) return;
      var p0 = list[0];
      var p1 = list[1];
      var dx = p1.x - p0.x;
      var dy = p1.y - p0.y;
      var distance = Math.sqrt((dx * dx) + (dy * dy));
      if (!(distance > 0)) return;

      var midpointX = (p0.x + p1.x) * 0.5;
      var midpointY = (p0.y + p1.y) * 0.5;
      if (!(mapCenterNavState.pinchInitialDist > 0)) {
        mapCenterNavState.pinchInitialDist = distance;
        mapCenterNavState.pinchInitialScale = mapCenterNavState.scale;
        mapCenterNavState.pinchAnchorViewportX = midpointX;
        mapCenterNavState.pinchAnchorViewportY = midpointY;
        mapCenterNavState.pinchAnchorWorldX = (midpointX - mapCenterNavState.tx) / mapCenterNavState.scale;
        mapCenterNavState.pinchAnchorWorldY = (midpointY - mapCenterNavState.ty) / mapCenterNavState.scale;
        return;
      }

      var nextScale = mapCenterNavState.pinchInitialScale * (distance / mapCenterNavState.pinchInitialDist);
      nextScale = clampNumber(nextScale, mapCenterNavState.minScale, mapCenterNavState.maxScale);
      mapCenterNavState.scale = nextScale;
      mapCenterNavState.tx = midpointX - (mapCenterNavState.pinchAnchorWorldX * nextScale);
      mapCenterNavState.ty = midpointY - (mapCenterNavState.pinchAnchorWorldY * nextScale);
      applyMapCenterNavTransform();
    }

    function onMapCenterNavPointerDown(event) {
      if (!isMapCenterNavActive()) return;
      if (document.documentElement.classList.contains("project-inline-open")) return;
      if (document.documentElement.classList.contains("map-project-open")) return;
      if (event.button !== undefined && event.button !== 0) return;
      if (!mapViewport) return;

      dismissPracticeOnboarding({ persist: true });
      event.preventDefault();
      var pointer = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY
      };
      mapCenterNavState.pointers[String(pointer.id)] = pointer;
      mapCenterNavState.tapPointerId = pointer.id;
      mapCenterNavState.tapStartX = pointer.x;
      mapCenterNavState.tapStartY = pointer.y;
      mapCenterNavState.tapMoved = false;

      var captureHost = event.currentTarget && typeof event.currentTarget.setPointerCapture === "function"
        ? event.currentTarget
        : mapViewport;
      if (captureHost && typeof captureHost.setPointerCapture === "function") {
        try {
          captureHost.setPointerCapture(event.pointerId);
        } catch (error) {}
      }

      var pointerCount = countMapCenterNavPointers();
      if (pointerCount === 1) {
        startMapCenterNavDragFromPointer(pointer);
        mapCenterNavState.pinchInitialDist = 0;
      } else if (pointerCount >= 2) {
        mapCenterNavState.tapPointerId = -1;
        mapCenterNavState.tapMoved = true;
        mapCenterNavState.dragPointerId = -1;
        mapCenterNavState.pinchInitialDist = 0;
        updateMapCenterNavPinchFromPointers();
      }
    }

    function onMapCenterNavPointerMove(event) {
      if (!isMapCenterNavActive()) return;
      var key = String(event.pointerId);
      var tracked = mapCenterNavState.pointers[key];
      if (!tracked) return;
      event.preventDefault();
      tracked.x = event.clientX;
      tracked.y = event.clientY;

      if (!mapCenterNavState.tapMoved && mapCenterNavState.tapPointerId === event.pointerId) {
        var movedX = tracked.x - mapCenterNavState.tapStartX;
        var movedY = tracked.y - mapCenterNavState.tapStartY;
        if (Math.abs(movedX) > 8 || Math.abs(movedY) > 8) {
          mapCenterNavState.tapMoved = true;
        }
      }

      var pointerCount = countMapCenterNavPointers();
      if (pointerCount >= 2) {
        mapCenterNavState.tapPointerId = -1;
        mapCenterNavState.tapMoved = true;
        mapCenterNavState.dragPointerId = -1;
        updateMapCenterNavPinchFromPointers();
        return;
      }
      if (pointerCount !== 1) return;
      if (mapCenterNavState.dragPointerId !== event.pointerId) return;

      var dx = tracked.x - mapCenterNavState.dragLastX;
      var dy = tracked.y - mapCenterNavState.dragLastY;
      mapCenterNavState.dragLastX = tracked.x;
      mapCenterNavState.dragLastY = tracked.y;
      mapCenterNavState.tx += dx;
      mapCenterNavState.ty += dy;
      applyMapCenterNavTransform();
    }

    function onMapCenterNavPointerEnd(event) {
      if (!isMapCenterNavActive()) return;
      var key = String(event.pointerId);
      if (!mapCenterNavState.pointers[key]) return;
      event.preventDefault();
      var releaseX = mapCenterNavState.pointers[key].x;
      var releaseY = mapCenterNavState.pointers[key].y;
      delete mapCenterNavState.pointers[key];

      var tappedPreview = (
        mapCenterNavState.tapPointerId === event.pointerId &&
        !mapCenterNavState.tapMoved &&
        isMapCenterNavTapOnPreview(releaseX, releaseY)
      );

      if (countMapCenterNavPointers() >= 2) {
        mapCenterNavState.pinchInitialDist = 0;
        updateMapCenterNavPinchFromPointers();
      } else if (countMapCenterNavPointers() === 1) {
        var remaining = getMapCenterNavPointerList()[0];
        startMapCenterNavDragFromPointer(remaining);
        mapCenterNavState.pinchInitialDist = 0;
      } else {
        mapCenterNavState.dragPointerId = -1;
        mapCenterNavState.pinchInitialDist = 0;
      }

      if (mapCenterNavState.tapPointerId === event.pointerId) {
        mapCenterNavState.tapPointerId = -1;
        mapCenterNavState.tapMoved = false;
      }

      if (event.type === "pointerup" && tappedPreview && mapCenterNavState.activeItem) {
        var nodeId = mapCenterNavState.activeItem.getAttribute("data-node-id") || "";
        openMapProjectFromNode(nodeId);
      }
    }

    function bindMapCenterNavInteractions() {
      if (mapCenterNavBound || !mapViewport) return;
      mapCenterNavBound = true;
      mapViewport.addEventListener("pointerdown", onMapCenterNavPointerDown);
      mapViewport.addEventListener("pointermove", onMapCenterNavPointerMove);
      mapViewport.addEventListener("pointerup", onMapCenterNavPointerEnd);
      mapViewport.addEventListener("pointercancel", onMapCenterNavPointerEnd);
      mapViewport.addEventListener("lostpointercapture", onMapCenterNavPointerEnd);
      if (preview) {
        preview.addEventListener("pointerdown", onMapCenterNavPointerDown);
        preview.addEventListener("pointermove", onMapCenterNavPointerMove);
        preview.addEventListener("pointerup", onMapCenterNavPointerEnd);
        preview.addEventListener("pointercancel", onMapCenterNavPointerEnd);
        preview.addEventListener("lostpointercapture", onMapCenterNavPointerEnd);
      }
    }

    function resetMapCenterNavTransform() {
      mapCenterNavState.scale = 1;
      mapCenterNavState.tx = 0;
      mapCenterNavState.ty = 0;
      clearMapCenterNavPointers();
      if (mapScene) {
        mapScene.style.removeProperty("transform");
        mapScene.style.removeProperty("transform-origin");
      }
    }

    function syncMapCenterNavState() {
      var shouldEnable = shouldEnableMapCenterNav();
      if (!shouldEnable) {
        mapCenterNavState.enabled = false;
        clearMapCenterNavPointers();
        setMapCenterNavHoverItem(null);
        if (mapWrap) mapWrap.classList.remove("has-map-center-nav");
        if (preview) preview.classList.remove("map-center-hover-preview--center-nav");
        if (mapCenterNavState.crosshairEl) {
          mapCenterNavState.crosshairEl.hidden = true;
        }
        resetMapCenterNavTransform();
        return;
      }

      bindMapCenterNavInteractions();
      ensureMapCenterCrosshair();
      mapCenterNavState.enabled = true;
      if (mapWrap) mapWrap.classList.add("has-map-center-nav");
      if (preview) preview.classList.add("map-center-hover-preview--center-nav");
      if (mapCenterNavState.crosshairEl) {
        mapCenterNavState.crosshairEl.hidden = false;
      }
      applyMapCenterNavTransform();
    }

    function shouldEnableTouchLens() {
      if (!mapWrap || !mapViewport || !mapScene || !mapOverlay || !items.length) return false;
      if (isMapCenterNavActive()) return false;
      if (isPracticeMobileDebugActive()) return false;
      if (touchLensPointerMql) return !!touchLensPointerMql.matches;
      return !supportsFineHover;
    }

    function setTouchLensHoverItem(nextItem) {
      if (touchLensState.hoverItem === nextItem) return;
      if (touchLensState.hoverItem) {
        touchLensState.hoverItem.classList.remove("is-touch-hovered");
      }
      touchLensState.hoverItem = nextItem || null;
      if (!mapOverlay) return;
      if (touchLensState.hoverItem) {
        touchLensState.hoverItem.classList.add("is-touch-hovered");
        mapOverlay.classList.add("is-touch-scanning");
      } else {
        mapOverlay.classList.remove("is-touch-scanning");
      }
    }

    function getTouchLensRadiusPx() {
      if (!touchLensState.lensEl) return 0;
      var lensRect = touchLensState.lensEl.getBoundingClientRect();
      if (!(lensRect.width > 0)) return 0;
      return lensRect.width * 0.44;
    }

    function getTouchLensZoomScale() {
      if (!touchLensState.lensEl) return 1.15;
      var raw = window.getComputedStyle(touchLensState.lensEl).getPropertyValue("--practice-touch-lens-zoom-scale");
      var value = parseFloat(raw);
      if (!isFinite(value) || value <= 1) return 1.15;
      return value;
    }

    function circleIntersectsRect(cx, cy, radius, rect) {
      var nearestX = clampNumber(cx, rect.left, rect.right);
      var nearestY = clampNumber(cy, rect.top, rect.bottom);
      var dx = cx - nearestX;
      var dy = cy - nearestY;
      return (dx * dx + dy * dy) <= (radius * radius);
    }

    function syncTouchLensHover() {
      if (!touchLensState.enabled || !touchLensState.lensEl) {
        setTouchLensHoverItem(null);
        return;
      }
      if (
        document.documentElement.classList.contains("project-inline-open") ||
        document.documentElement.classList.contains("map-project-open")
      ) {
        setTouchLensHoverItem(null);
        return;
      }
      var viewportRect = mapViewport.getBoundingClientRect();
      if (!(viewportRect.width > 0) || !(viewportRect.height > 0)) {
        setTouchLensHoverItem(null);
        return;
      }

      var centerX = viewportRect.left + touchLensState.x;
      var centerY = viewportRect.top + touchLensState.y;
      var radius = getTouchLensRadiusPx();
      if (!(radius > 0)) {
        setTouchLensHoverItem(null);
        return;
      }

      var bestItem = null;
      var bestDistSq = Infinity;
      items.forEach(function (item) {
        var blocks = item.querySelectorAll(".mypractice-map-block");
        if (!blocks || !blocks.length) return;
        for (var i = 0; i < blocks.length; i += 1) {
          var rect = blocks[i].getBoundingClientRect();
          if (!(rect.width > 0) || !(rect.height > 0)) continue;
          if (!circleIntersectsRect(centerX, centerY, radius, rect)) continue;
          var nearestX = clampNumber(centerX, rect.left, rect.right);
          var nearestY = clampNumber(centerY, rect.top, rect.bottom);
          var dx = centerX - nearestX;
          var dy = centerY - nearestY;
          var distSq = (dx * dx) + (dy * dy);
          if (shouldPreferPracticeHitCandidate(item, distSq, bestItem, bestDistSq)) {
            bestDistSq = distSq;
            bestItem = item;
          }
        }
      });

      setTouchLensHoverItem(bestItem);
    }

    function applyTouchLensPosition(nextX, nextY) {
      if (!touchLensState.lensEl) return;
      var viewportRect = mapViewport.getBoundingClientRect();
      if (!(viewportRect.width > 0) || !(viewportRect.height > 0)) return;
      var clampedX = clampNumber(nextX, 0, viewportRect.width);
      var clampedY = clampNumber(nextY, 0, viewportRect.height);
      touchLensState.x = clampedX;
      touchLensState.y = clampedY;
      touchLensState.lensEl.style.setProperty("--practice-touch-lens-x", clampedX.toFixed(2) + "px");
      touchLensState.lensEl.style.setProperty("--practice-touch-lens-y", clampedY.toFixed(2) + "px");
      syncTouchLensZoom();
      syncTouchLensHover();
    }

    function syncTouchLensZoom() {
      if (!touchLensState.lensEl || !touchLensState.zoomSceneEl) return;
      var viewportRect = mapViewport.getBoundingClientRect();
      if (!(viewportRect.width > 0) || !(viewportRect.height > 0)) return;
      var lensRect = touchLensState.lensEl.getBoundingClientRect();
      if (!(lensRect.width > 0) || !(lensRect.height > 0)) return;
      var radiusX = lensRect.width * 0.5;
      var radiusY = lensRect.height * 0.5;
      var zoomScale = getTouchLensZoomScale();

      touchLensState.zoomSceneEl.style.width = viewportRect.width.toFixed(2) + "px";
      touchLensState.zoomSceneEl.style.height = viewportRect.height.toFixed(2) + "px";
      var offsetX = radiusX - (touchLensState.x * zoomScale);
      var offsetY = radiusY - (touchLensState.y * zoomScale);
      touchLensState.zoomSceneEl.style.transform =
        "translate3d(" + offsetX.toFixed(2) + "px, " + offsetY.toFixed(2) + "px, 0) scale(" + zoomScale.toFixed(4) + ")";
    }

    function setTouchLensPositionFromClient(clientX, clientY) {
      var viewportRect = mapViewport.getBoundingClientRect();
      if (!(viewportRect.width > 0) || !(viewportRect.height > 0)) return;
      applyTouchLensPosition(clientX - viewportRect.left, clientY - viewportRect.top);
    }

    function ensureTouchLens() {
      if (touchLensState.lensEl) return;
      var lens = document.createElement("div");
      lens.className = "mypractice-touch-lens";
      lens.setAttribute("aria-hidden", "true");

      var zoomLayer = document.createElement("div");
      zoomLayer.className = "mypractice-touch-lens-zoom";
      var zoomScene = mapScene.cloneNode(true);
      zoomScene.classList.add("mypractice-touch-lens-zoom-scene");
      zoomLayer.appendChild(zoomScene);
      lens.appendChild(zoomLayer);

      mapViewport.appendChild(lens);
      touchLensState.lensEl = lens;
      touchLensState.zoomLayerEl = zoomLayer;
      touchLensState.zoomSceneEl = zoomScene;

      lens.addEventListener("pointerdown", function (event) {
        if (!touchLensState.enabled) return;
        if (document.documentElement.classList.contains("project-inline-open")) return;
        if (document.documentElement.classList.contains("map-project-open")) return;
        dismissPracticeOnboarding({ persist: true });
        event.preventDefault();
        touchLensState.pointerId = event.pointerId;
        touchLensState.startX = event.clientX;
        touchLensState.startY = event.clientY;
        touchLensState.moved = false;
        lens.classList.add("is-dragging");
        if (typeof lens.setPointerCapture === "function") {
          try {
            lens.setPointerCapture(event.pointerId);
          } catch (error) {}
        }
        setTouchLensPositionFromClient(event.clientX, event.clientY);
      });

      lens.addEventListener("pointermove", function (event) {
        if (event.pointerId !== touchLensState.pointerId) return;
        event.preventDefault();
        if (!touchLensState.moved) {
          var deltaX = event.clientX - touchLensState.startX;
          var deltaY = event.clientY - touchLensState.startY;
          if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
            touchLensState.moved = true;
          }
        }
        setTouchLensPositionFromClient(event.clientX, event.clientY);
      });

      function finishTouchLensPointer(event) {
        if (event.pointerId !== touchLensState.pointerId) return;
        event.preventDefault();
        touchLensState.pointerId = -1;
        lens.classList.remove("is-dragging");
        if (event.type === "pointerup" && !touchLensState.moved && touchLensState.hoverItem) {
          var targetNodeId = touchLensState.hoverItem.getAttribute("data-node-id") || "";
          openMapProjectFromNode(targetNodeId);
        }
      }

      lens.addEventListener("pointerup", finishTouchLensPointer);
      lens.addEventListener("pointercancel", finishTouchLensPointer);
      lens.addEventListener("lostpointercapture", finishTouchLensPointer);
    }

    function syncTouchLensState() {
      var shouldEnable = shouldEnableTouchLens();
      if (!shouldEnable) {
        touchLensState.enabled = false;
        touchLensState.pointerId = -1;
        touchLensState.moved = false;
        mapWrap.classList.remove("has-touch-lens");
        setTouchLensHoverItem(null);
        if (touchLensState.lensEl) {
          touchLensState.lensEl.hidden = true;
          touchLensState.lensEl.classList.remove("is-dragging");
        }
        return;
      }

      ensureTouchLens();
      touchLensState.enabled = true;
      mapWrap.classList.add("has-touch-lens");
      touchLensState.lensEl.hidden = false;
      syncTouchLensZoom();

      if (!isFinite(touchLensState.x) || !isFinite(touchLensState.y)) {
        var viewportRect = mapViewport.getBoundingClientRect();
        applyTouchLensPosition(viewportRect.width * 0.5, viewportRect.height * 0.58);
        return;
      }
      applyTouchLensPosition(touchLensState.x, touchLensState.y);
    }

    bindMapProjectTemplateGalleryZoomTriggers();

    items.forEach(function (item) {
      item.setAttribute("draggable", "false");
      item.addEventListener("pointerdown", function (event) {
        beginPracticeMobileDebugDrag(item, event);
      });
      item.addEventListener("pointermove", function (event) {
        updatePracticeMobileDebugDrag(event);
      });
      item.addEventListener("pointerup", function (event) {
        finishPracticeMobileDebugDrag(event);
      });
      item.addEventListener("pointercancel", function (event) {
        finishPracticeMobileDebugDrag(event);
      });
      item.addEventListener("lostpointercapture", function (event) {
        finishPracticeMobileDebugDrag(event);
      });
      item.addEventListener("mousedown", function (event) {
        var synthetic = toPracticeMobileMouseLikeEvent(event);
        if (!beginPracticeMobileDebugDrag(item, synthetic)) return;
        window.addEventListener("mousemove", onPracticeMobileDebugMouseMove, true);
        window.addEventListener("mouseup", onPracticeMobileDebugMouseUp, true);
      });

      if (canHover) {
        item.addEventListener("pointerenter", function (event) {
          showForItem(item, {
            clientX: event.clientX,
            clientY: event.clientY
          });
        });
        item.addEventListener("pointermove", function (event) {
          if (activeItem !== item || preview.hidden) return;
          if (!setCursorPreviewPoint(event.clientX, event.clientY)) return;
          positionCursorPreview();
        });
        item.addEventListener("pointerleave", hidePreview);
      }

      item.addEventListener("click", function (event) {
        if (event.defaultPrevented) return;
        if (isMapCenterNavActive()) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        if (isPracticeMobileDebugActive() || mobileDebugState.justDragged) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        if (document.documentElement.classList.contains("project-inline-open")) return;
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        var nodeId = item.getAttribute("data-node-id") || "";
        if (!nodeId || !detailByNodeId[nodeId]) return;
        event.preventDefault();
        event.stopPropagation();
        openMapProjectFromNode(nodeId);
      });
    });

    if (canHover) {
      mapWrap.addEventListener("pointerleave", hidePreview);
    }
    mapWrap.addEventListener("dragstart", function (event) {
      if (!isPracticeMobileDebugActive()) return;
      event.preventDefault();
    });
    window.addEventListener("scroll", function () {
      if (isMapCenterNavActive()) {
        syncMapCenterNavHover();
        schedulePracticeOnboarding();
        return;
      }
      hidePreview();
      if (touchLensState.enabled) {
        syncTouchLensHover();
      }
      schedulePracticeOnboarding();
    }, { passive: true });
    window.addEventListener("scroll", handleMapProjectDetailScrollSync, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("scroll", handleMapProjectDetailScrollSync, { passive: true });
    }
    window.addEventListener("resize", function () {
      syncPracticeResponsiveLayout(false);
      syncPracticeTagFilterVisual();
      syncPracticeMobileDebugMode();
      updatePracticeOnboardingCopy();
      if (document.documentElement.classList.contains("map-project-open")) {
        recoverMapProjectAfterViewportChange("window-resize");
      }
      if (activeItem && !preview.hidden) {
        syncPreviewSize(activeItem, activeMode, activeConfig);
        positionCursorPreview();
      }
      if (isMapCenterNavActive()) {
        syncMapCenterNavHover();
      } else if (touchLensState.enabled) {
        syncTouchLensHover();
      }
      schedulePracticeOnboarding();
    });
    document.addEventListener("fullscreenchange", function () {
      recoverMapProjectAfterViewportChange("fullscreenchange");
    });
    document.addEventListener("webkitfullscreenchange", function () {
      recoverMapProjectAfterViewportChange("webkitfullscreenchange");
    });

    bindMapProjectHorizontalInteractions();

    if (touchLensPointerMql) {
      var handleTouchLensPointerChange = function () {
        syncPracticeMobileDebugMode();
      };
      if (typeof touchLensPointerMql.addEventListener === "function") {
        touchLensPointerMql.addEventListener("change", handleTouchLensPointerChange);
      } else if (typeof touchLensPointerMql.addListener === "function") {
        touchLensPointerMql.addListener(handleTouchLensPointerChange);
      }
    }

    mapProjectCloseBtn.addEventListener("click", function () {
      dismissMapProjectDetail();
    });

    document.addEventListener("keydown", function (event) {
      if (!mapDetailState.activeNodeId) return;
      var target = event.target;
      var isTypingTarget = target && (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      );
      if (isTypingTarget) return;

      if (event.key === "Escape") {
        dismissMapProjectDetail();
        return;
      }

      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigateMapProject(-1, "keyboard-left");
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        navigateMapProject(1, "keyboard-right");
      }
    });

    window.addEventListener("hashchange", renderMapProjectByHash);
    window.addEventListener("popstate", renderMapProjectByHash);
    syncPracticeMobileDebugMode();
    renderMapProjectByHash();
    window.requestAnimationFrame(schedulePracticeOnboarding);
  }

  function initExternalLinkHoverPreview() {
    var preview = document.getElementById("external-link-hover-preview");
    var previewIcon = document.getElementById("external-link-hover-preview-icon");
    var previewLabel = document.getElementById("external-link-hover-preview-label");
    if (!preview || !previewIcon || !previewLabel) return;

    var canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var EXTERNAL_TEXT_CLASS = "external-link-hoverfx";
    var activeTargetEl = null;
    var iconLoadToken = 0;
    var isVisible = false;
    var CURSOR_OFFSET_X = 16;
    var CURSOR_OFFSET_Y = 18;
    var VIEWPORT_PADDING = 12;

    function parseExternalUrl(rawHref) {
      if (!rawHref) return null;
      var href = String(rawHref).trim();
      if (!href || href.charAt(0) === "#") return null;
      if (/^(javascript|mailto|tel):/i.test(href)) return null;
      var url = null;
      try {
        url = new URL(href, window.location.href);
      } catch (error) {
        return null;
      }
      if (!/^https?:$/i.test(url.protocol)) return null;
      if (url.origin === window.location.origin) return null;
      return url;
    }

    function getExternalAnchor(target) {
      if (!target || typeof target.closest !== "function") return null;
      var anchor = target.closest("a[href]");
      if (!anchor) return null;
      if (anchor.hasAttribute("data-external-preview-disabled")) return null;
      var url = parseExternalUrl(anchor.getAttribute("href"));
      if (!url) return null;
      return { anchor: anchor, url: url };
    }

    function getCopyButton(target) {
      if (!target || typeof target.closest !== "function") return null;
      var button = target.closest("[data-copy-to-clipboard]");
      if (!button) return null;
      var copyText = (button.getAttribute("data-copy-to-clipboard") || "").trim();
      if (!copyText) return null;
      return { button: button, copyText: copyText };
    }

    function getPreviewTarget(target) {
      var copy = getCopyButton(target);
      if (copy) {
        return {
          element: copy.button,
          copyText: copy.copyText,
          label: (copy.button.getAttribute("data-copy-preview-title") || "Copy").trim() || "Copy",
          textOnly: true
        };
      }
      var external = getExternalAnchor(target);
      if (!external) return null;
      return {
        element: external.anchor,
        icon: (external.anchor.getAttribute("data-external-preview-icon") || "").trim(),
        transparentIcon: external.anchor.getAttribute("data-external-preview-transparent") === "true",
        url: external.url
      };
    }

    function resetIcon() {
      iconLoadToken += 1;
      previewIcon.removeAttribute("src");
      previewIcon.style.removeProperty("background");
    }

    function makeFallbackIconDataUrl(url) {
      var svg =
        "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>" +
        "<rect x='0' y='0' width='64' height='64' rx='14' fill='#252525'/>" +
        "<path d='M22 22h20v20H22z' fill='none' stroke='#ffffff' stroke-width='3.5' stroke-linejoin='round'/>" +
        "<path d='M31 33l11-11' fill='none' stroke='#ffffff' stroke-width='3.5' stroke-linecap='round'/>" +
        "<path d='M33 20h11v11' fill='none' stroke='#ffffff' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'/></svg>";
      return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
    }

    function buildIconCandidates(anchor, url) {
      var origin = url && url.origin ? url.origin.replace(/\/$/, "") : "";
      var hostname = url && url.hostname ? url.hostname.replace(/^www\./i, "") : "";
      var custom = anchor && anchor.getAttribute("data-external-preview-icon");
      var candidates = [];
      if (custom && custom.trim()) {
        candidates.push(custom.trim());
      }
      if (origin) {
        candidates.push("https://www.google.com/s2/favicons?sz=64&domain_url=" + encodeURIComponent(origin));
        candidates.push("https://www.google.com/s2/favicons?sz=64&domain=" + encodeURIComponent(hostname || origin));
      }
      if (hostname) {
        candidates.push("https://icons.duckduckgo.com/ip3/" + encodeURIComponent(hostname) + ".ico");
      }
      if (origin) {
        candidates.push(origin + "/favicon.ico");
        candidates.push(origin + "/apple-touch-icon.png");
        candidates.push(origin + "/favicon-32x32.png");
        candidates.push(origin + "/favicon-16x16.png");
      }

      var unique = [];
      var seen = {};
      candidates.forEach(function (entry) {
        if (!entry || seen[entry]) return;
        seen[entry] = true;
        unique.push(entry);
      });
      return unique;
    }

    function loadIconForTarget(target) {
      if (!target) return;
      resetIcon();
      if (target.transparentIcon) {
        previewIcon.style.setProperty("background", "transparent");
      }
      var token = iconLoadToken;
      var candidates = buildIconCandidates(target.element, target.url);
      if (target.icon) candidates.unshift(target.icon);
      var index = 0;
      var fallbackIcon = makeFallbackIconDataUrl(target.url);

      function loadNextCandidate() {
        if (token !== iconLoadToken) return;
        if (index >= candidates.length) {
          previewIcon.src = fallbackIcon;
          return;
        }
        previewIcon.src = candidates[index];
      }

      previewIcon.onerror = function () {
        if (token !== iconLoadToken) return;
        index += 1;
        loadNextCandidate();
      };
      previewIcon.onload = function () {
        if (token !== iconLoadToken) return;
      };
      loadNextCandidate();
    }

    function parseRgb(value) {
      if (!value) return null;
      var match = String(value).match(/rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/i);
      if (!match) return null;
      return {
        r: Math.max(0, Math.min(255, Number(match[1]))),
        g: Math.max(0, Math.min(255, Number(match[2]))),
        b: Math.max(0, Math.min(255, Number(match[3])))
      };
    }

    function toLinear(channel) {
      var c = channel / 255;
      if (c <= 0.03928) return c / 12.92;
      return Math.pow((c + 0.055) / 1.055, 2.4);
    }

    function getLuminance(rgb) {
      return (0.2126 * toLinear(rgb.r)) + (0.7152 * toLinear(rgb.g)) + (0.0722 * toLinear(rgb.b));
    }

    function ensureExternalTextStyle(anchor) {
      if (!anchor || !anchor.classList) return;
      if (anchor.classList.contains(EXTERNAL_TEXT_CLASS)) return;
      if (anchor.hasAttribute("data-external-textfx-disabled")) return;
      if (anchor.querySelector("img, video, picture, svg, canvas, iframe")) return;
      var text = (anchor.textContent || "").replace(/\s+/g, " ").trim();
      if (!text) return;

      anchor.classList.add(EXTERNAL_TEXT_CLASS);
      var color = window.getComputedStyle(anchor).color || "";
      var rgb = parseRgb(color);
      if (!rgb) return;

      var lum = getLuminance(rgb);
      if (lum >= 0.65) {
        anchor.style.setProperty("--external-link-fill", "rgba(248, 248, 248, 0.98)");
        anchor.style.setProperty("--external-link-hover-fg", "#111111");
      } else {
        anchor.style.setProperty("--external-link-fill", "#111111");
        anchor.style.setProperty("--external-link-hover-fg", "#ffffff");
      }
    }

    function getPreviewLabel(anchor, url) {
      var customLabel = anchor.getAttribute("data-external-preview-title");
      if (customLabel && customLabel.trim()) return customLabel.trim();
      return url.hostname.replace(/^www\./i, "");
    }

    function copyHoverPreviewTextToClipboard(text) {
      if (!text) return Promise.reject(new Error("Missing copy text"));
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        return navigator.clipboard.writeText(text);
      }

      return new Promise(function (resolve, reject) {
        var textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        document.body.appendChild(textarea);
        textarea.select();
        try {
          var success = document.execCommand("copy");
          document.body.removeChild(textarea);
          if (success) {
            resolve();
          } else {
            reject(new Error("Copy command failed"));
          }
        } catch (error) {
          document.body.removeChild(textarea);
          reject(error);
        }
      });
    }

    function positionPreview(clientX, clientY) {
      if (!isVisible) return;
      var rect = preview.getBoundingClientRect();
      var nextX = clientX + CURSOR_OFFSET_X;
      var nextY = clientY + CURSOR_OFFSET_Y;

      if (nextX + rect.width + VIEWPORT_PADDING > window.innerWidth) {
        nextX = clientX - rect.width - CURSOR_OFFSET_X;
      }
      if (nextY + rect.height + VIEWPORT_PADDING > window.innerHeight) {
        nextY = window.innerHeight - rect.height - VIEWPORT_PADDING;
      }
      if (nextX < VIEWPORT_PADDING) nextX = VIEWPORT_PADDING;
      if (nextY < VIEWPORT_PADDING) nextY = VIEWPORT_PADDING;

      preview.style.transform = "translate3d(" + Math.round(nextX) + "px, " + Math.round(nextY) + "px, 0)";
    }

    function showPreview(target, clientX, clientY) {
      if (!target || !target.element) return;
      activeTargetEl = target.element;
      ensureExternalTextStyle(target.element);
      preview.classList.toggle("external-link-hover-preview--text-only", !!target.textOnly);
      previewLabel.textContent = target.textOnly ? target.label : getPreviewLabel(target.element, target.url);
      preview.hidden = false;
      preview.setAttribute("aria-hidden", "false");
      isVisible = true;
      if (target.textOnly) {
        resetIcon();
      } else {
        loadIconForTarget(target);
      }
      positionPreview(clientX, clientY);
    }

    function hidePreview() {
      activeTargetEl = null;
      isVisible = false;
      preview.hidden = true;
      preview.setAttribute("aria-hidden", "true");
      preview.style.transform = "translate3d(-9999px, -9999px, 0)";
      previewLabel.textContent = "";
      preview.classList.remove("external-link-hover-preview--text-only");
      resetIcon();
    }

    document.addEventListener("click", function (event) {
      var copy = getCopyButton(event.target);
      if (!copy) return;
      event.preventDefault();
      copyHoverPreviewTextToClipboard(copy.copyText).catch(function (error) {
        console.warn("Copy to clipboard failed", error);
      });
    }, true);

    document.addEventListener("focusin", function (event) {
      var target = getPreviewTarget(event.target);
      if (!target) return;
      var rect = target.element.getBoundingClientRect();
      showPreview(target, rect.right, rect.top + Math.min(24, rect.height));
    }, true);

    document.addEventListener("focusout", function (event) {
      if (!activeTargetEl) return;
      if (event.target !== activeTargetEl) return;
      hidePreview();
    }, true);

    window.addEventListener("blur", hidePreview);
    window.addEventListener("scroll", hidePreview, true);

    if (!canHover) return;

    document.addEventListener("pointerover", function (event) {
      var target = getPreviewTarget(event.target);
      if (!target) return;
      var prevTarget = getPreviewTarget(event.relatedTarget);
      if (prevTarget && prevTarget.element === target.element) return;
      showPreview(target, event.clientX, event.clientY);
    }, true);

    document.addEventListener("pointermove", function (event) {
      if (!activeTargetEl) return;
      positionPreview(event.clientX, event.clientY);
    }, true);

    document.addEventListener("pointerout", function (event) {
      if (!activeTargetEl) return;
      var fromTarget = getPreviewTarget(event.target);
      if (!fromTarget || fromTarget.element !== activeTargetEl) return;
      var nextTarget = getPreviewTarget(event.relatedTarget);
      if (nextTarget && nextTarget.element === activeTargetEl) return;
      hidePreview();
    }, true);
  }

  function initMapProjectDetailHotspotPreview() {
    var preview = document.getElementById("map-project-detail-hotspot-preview");
    var previewImg = document.getElementById("map-project-detail-hotspot-preview-img");
    var previewVideo = document.getElementById("map-project-detail-hotspot-preview-video");
    var previewProgress = document.getElementById("map-project-detail-hotspot-preview-progress");
    var previewProgressTrack = document.getElementById("map-project-detail-hotspot-preview-pagination-track");
    var detailRoot = document.querySelector(".map-project-detail-page");
    if (!preview || !previewImg || !previewVideo || !previewProgress || !previewProgressTrack || !detailRoot) return;

    var canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    function readLengthAttr(target, attrName, fallbackValue) {
      if (!target) return fallbackValue;
      var raw = (target.getAttribute(attrName) || "").trim();
      return raw || fallbackValue;
    }

    function readNumberAttr(target, attrName, fallbackValue) {
      if (!target) return fallbackValue;
      var raw = parseFloat(target.getAttribute(attrName));
      return isFinite(raw) ? raw : fallbackValue;
    }

    function applyPreviewConfig(target) {
      activeOffsetX = readNumberAttr(target, "data-detail-preview-offset-x", 18);
      activeOffsetY = readNumberAttr(target, "data-detail-preview-offset-y", 18);
      activeContentLeftRatio = Math.max(0, readNumberAttr(target, "data-detail-preview-content-left-ratio", 0));
      activeContentRightRatio = Math.max(0, readNumberAttr(target, "data-detail-preview-content-right-ratio", 0));
      activeContentTopRatio = Math.max(0, readNumberAttr(target, "data-detail-preview-content-top-ratio", 0));
      activeContentBottomRatio = Math.max(0, readNumberAttr(target, "data-detail-preview-content-bottom-ratio", 0));
      var maxWidth = readLengthAttr(target, "data-detail-preview-max-width", "34rem");
      var maxHeight = readLengthAttr(target, "data-detail-preview-max-height", "72vh");
      previewImg.style.setProperty("--map-project-detail-hotspot-preview-max-width", maxWidth);
      previewImg.style.setProperty("--map-project-detail-hotspot-preview-max-height", maxHeight);
      previewVideo.style.setProperty("--map-project-detail-hotspot-preview-max-width", maxWidth);
      previewVideo.style.setProperty("--map-project-detail-hotspot-preview-max-height", maxHeight);
    }

    function parsePreviewSlidesSources(target) {
      if (!target) return [];
      var raw = (target.getAttribute("data-detail-preview-slides") || "").trim();
      if (!raw) return [];
      var seen = {};
      return raw.split(/[\n|,]+/).map(function (entry) {
        return String(entry || "").trim();
      }).filter(function (entry) {
        if (!entry || seen[entry]) return false;
        seen[entry] = true;
        return true;
      });
    }

    function getHotspotTarget(target) {
      if (!target || typeof target.closest !== "function") return null;
      var hotspot = target.closest("[data-detail-preview-src], [data-detail-preview-video-src], [data-detail-preview-slides]");
      if (!hotspot) return null;
      if (!detailRoot.contains(hotspot)) return null;
      var src = (hotspot.getAttribute("data-detail-preview-src") || "").trim();
      var videoSrc = (hotspot.getAttribute("data-detail-preview-video-src") || "").trim();
      var slideshowSources = parsePreviewSlidesSources(hotspot);
      if (!src && !videoSrc && !slideshowSources.length) return null;
      return hotspot;
    }

    previewVideo.hidden = true;
    previewProgress.hidden = true;

    if (!canHover) {
      var inlinePreview = null;
      var inlinePreviewImg = null;
      var activeInlineTarget = null;
      var inlinePreviewSyncTarget = null;

      function ensureInlineHotspotChip(target) {
        if (!target) return null;
        var existingChip = target.querySelector(".map-project-detail-hotspot-chip");
        if (existingChip) return existingChip;
        var chip = document.createElement("span");
        chip.className = "map-project-detail-hotspot-chip";
        if (target.classList.contains("map-project-detail-hotspot--heading")) {
          chip.classList.add("map-project-detail-hotspot-chip--heading");
        }
        while (target.firstChild) {
          chip.appendChild(target.firstChild);
        }
        target.appendChild(chip);
        target.classList.add("map-project-detail-hotspot--inline-shell");
        return chip;
      }

      function ensureInlinePreview() {
        if (inlinePreview && inlinePreviewImg) return;
        inlinePreview = document.createElement("span");
        inlinePreview.className = "map-project-detail-hotspot-inline-preview";
        inlinePreview.hidden = true;
        inlinePreview.setAttribute("aria-hidden", "true");

        inlinePreviewImg = document.createElement("img");
        inlinePreviewImg.className = "map-project-detail-hotspot-inline-preview-img";
        inlinePreviewImg.alt = "";

        inlinePreview.appendChild(inlinePreviewImg);

        inlinePreviewImg.addEventListener("load", function () {
          if (!inlinePreviewSyncTarget) return;
          syncInlinePreviewReserve(inlinePreviewSyncTarget);
        });
      }

      function clearInlineActiveState() {
        Array.prototype.forEach.call(
          detailRoot.querySelectorAll(".map-project-detail-hotspot.is-inline-active"),
          function (hotspot) {
            hotspot.classList.remove("is-inline-active");
            hotspot.removeAttribute("aria-expanded");
          }
        );
      }

      function resetInlinePreviewConfig() {
        if (!inlinePreviewImg) return;
        inlinePreviewImg.style.removeProperty("--map-project-detail-hotspot-inline-preview-max-width");
        inlinePreviewImg.style.removeProperty("--map-project-detail-hotspot-inline-preview-max-height");
      }

      function clearInlinePreviewReserve(target) {
        if (!target || !target.style) return;
        target.style.removeProperty("--map-project-detail-hotspot-inline-preview-reserve");
      }

      function syncInlinePreviewReserve(target) {
        if (!target || !inlinePreview || !inlinePreviewImg || inlinePreview.hidden) return;
        inlinePreviewSyncTarget = target;
      }

      function hideInlinePreview() {
        if (activeInlineTarget) {
          clearInlinePreviewReserve(activeInlineTarget);
        }
        activeInlineTarget = null;
        inlinePreviewSyncTarget = null;
        clearInlineActiveState();
        if (!inlinePreview || !inlinePreviewImg) return;
        inlinePreview.hidden = true;
        inlinePreview.setAttribute("aria-hidden", "true");
        if (inlinePreview.parentNode) {
          inlinePreview.parentNode.removeChild(inlinePreview);
        }
        inlinePreviewImg.removeAttribute("src");
        inlinePreviewImg.alt = "";
        resetInlinePreviewConfig();
      }

      function showInlinePreview(target) {
        var src = (target.getAttribute("data-detail-preview-src") || "").trim();
        if (!target || !src) return;

        ensureInlineHotspotChip(target);
        ensureInlinePreview();
        if (activeInlineTarget && activeInlineTarget !== target) {
          clearInlinePreviewReserve(activeInlineTarget);
        }
        clearInlineActiveState();
        activeInlineTarget = target;
        inlinePreviewSyncTarget = target;
        target.classList.add("is-inline-active");
        target.setAttribute("aria-expanded", "true");

        inlinePreviewImg.style.setProperty(
          "--map-project-detail-hotspot-inline-preview-max-width",
          readLengthAttr(target, "data-detail-preview-max-width", "100%")
        );
        inlinePreviewImg.style.setProperty(
          "--map-project-detail-hotspot-inline-preview-max-height",
          readLengthAttr(target, "data-detail-preview-max-height", "28rem")
        );
        inlinePreviewImg.src = src;
        inlinePreviewImg.alt = (target.getAttribute("data-detail-preview-alt") || target.textContent || "").trim();
        inlinePreview.hidden = false;
        inlinePreview.setAttribute("aria-hidden", "false");

        if (inlinePreview.parentNode !== target.parentNode || inlinePreview.previousSibling !== target) {
          target.insertAdjacentElement("afterend", inlinePreview);
        }
        syncInlinePreviewReserve(target);
      }

      preview.hidden = true;
      preview.setAttribute("aria-hidden", "true");

      document.addEventListener("click", function (event) {
        var target = getHotspotTarget(event.target);
        if (!target) return;
        event.preventDefault();
        event.stopPropagation();
        if (activeInlineTarget === target && inlinePreview && !inlinePreview.hidden) {
          hideInlinePreview();
          return;
        }
        showInlinePreview(target);
      }, true);

      window.addEventListener("blur", hideInlinePreview);
      window.addEventListener("hashchange", hideInlinePreview);
      window.addEventListener("resize", function () {
        if (!activeInlineTarget) return;
        syncInlinePreviewReserve(activeInlineTarget);
      });
      return;
    }

    var activeTargetEl = null;
    var isVisible = false;
    var lastClientX = 0;
    var lastClientY = 0;
    var activeOffsetX = 18;
    var activeOffsetY = 18;
    var activeContentLeftRatio = 0;
    var activeContentRightRatio = 0;
    var activeContentTopRatio = 0;
    var activeContentBottomRatio = 0;
    var activeMediaMode = "image";
    var previewProgressItems = [];
    var previewProgressActiveIndex = 0;
    var previewProgressRaf = 0;
    var previewSlideshowTimerId = 0;
    var previewSlideshowRunToken = 0;
    var previewSlideshowSlideStartedAt = 0;
    var previewSlideshowIntervalMs = 1400;
    var VIEWPORT_PADDING = 12;

    function syncPreviewProgressPagination(count, activeIndex) {
      var safeCount = Math.max(0, parseInt(count, 10) || 0);
      while (previewProgressTrack.children.length > safeCount) {
        previewProgressTrack.removeChild(previewProgressTrack.lastChild);
      }
      while (previewProgressTrack.children.length < safeCount) {
        var indicator = document.createElement("span");
        indicator.className = "map-center-hover-preview-pagination-item";
        indicator.setAttribute("aria-hidden", "true");
        previewProgressTrack.appendChild(indicator);
      }
      previewProgressItems = Array.prototype.slice.call(previewProgressTrack.children);
      if (!previewProgressItems.length) {
        previewProgressActiveIndex = 0;
        return;
      }
      previewProgressActiveIndex = Math.max(
        0,
        Math.min(previewProgressItems.length - 1, parseInt(activeIndex, 10) || 0)
      );
      previewProgressItems.forEach(function (item, index) {
        item.classList.toggle("is-active", index === previewProgressActiveIndex);
        item.style.setProperty("--map-center-hover-preview-slide-progress", "0");
      });
    }

    function setPreviewProgressActiveIndex(index) {
      if (!previewProgressItems.length) return;
      previewProgressActiveIndex = Math.max(
        0,
        Math.min(previewProgressItems.length - 1, parseInt(index, 10) || 0)
      );
      previewProgressItems.forEach(function (item, itemIndex) {
        item.classList.toggle("is-active", itemIndex === previewProgressActiveIndex);
        item.style.setProperty("--map-center-hover-preview-slide-progress", "0");
      });
    }

    function setPreviewProgress(value) {
      if (!previewProgressItems.length) return;
      var clamped = Math.max(0, Math.min(1, Number(value) || 0));
      var activeItem = previewProgressItems[previewProgressActiveIndex];
      previewProgressItems.forEach(function (item, itemIndex) {
        if (itemIndex !== previewProgressActiveIndex) {
          item.style.setProperty("--map-center-hover-preview-slide-progress", "0");
        }
      });
      if (!activeItem) return;
      activeItem.style.setProperty("--map-center-hover-preview-slide-progress", clamped.toFixed(4));
    }

    function stopPreviewProgress() {
      if (previewProgressRaf) {
        window.cancelAnimationFrame(previewProgressRaf);
        previewProgressRaf = 0;
      }
      setPreviewProgress(0);
    }

    function tickPreviewProgress(timestamp) {
      previewProgressRaf = 0;
      if (!isVisible) return;

      if (activeMediaMode === "video" && !previewVideo.hidden) {
        var duration = previewVideo.duration;
        if (isFinite(duration) && duration > 0) {
          setPreviewProgress(previewVideo.currentTime / duration);
        }
        previewProgressRaf = window.requestAnimationFrame(tickPreviewProgress);
        return;
      }

      if (activeMediaMode === "slideshow" && previewSlideshowIntervalMs > 0) {
        if (!previewSlideshowSlideStartedAt) {
          previewSlideshowSlideStartedAt = timestamp;
        }
        var elapsed = Math.max(0, timestamp - previewSlideshowSlideStartedAt);
        setPreviewProgress(elapsed / previewSlideshowIntervalMs);
        previewProgressRaf = window.requestAnimationFrame(tickPreviewProgress);
        return;
      }

      setPreviewProgress(0);
    }

    function startPreviewProgress() {
      stopPreviewProgress();
      previewProgressRaf = window.requestAnimationFrame(tickPreviewProgress);
    }

    function stopPreviewVideoPlayback() {
      try {
        previewVideo.pause();
      } catch (error) {}
      previewVideo.removeAttribute("src");
      if (typeof previewVideo.load === "function") {
        try {
          previewVideo.load();
        } catch (error) {}
      }
      previewVideo.hidden = true;
    }

    function stopPreviewSlideshow() {
      previewSlideshowRunToken += 1;
      if (previewSlideshowTimerId) {
        window.clearTimeout(previewSlideshowTimerId);
        previewSlideshowTimerId = 0;
      }
      previewSlideshowSlideStartedAt = 0;
    }

    function startPreviewImageSlideshow(target, sources) {
      var safeSources = Array.isArray(sources) ? sources : [];
      if (!target || safeSources.length < 2) return false;
      stopPreviewSlideshow();

      var runToken = previewSlideshowRunToken;
      var baseAlt = (target.getAttribute("data-detail-preview-alt") || target.textContent || "").trim();
      var intervalMs = readNumberAttr(target, "data-detail-preview-interval-ms", 1400);
      previewSlideshowIntervalMs = Math.max(450, Math.min(20000, intervalMs));
      var activeIndex = 0;

      function applySlide(index) {
        if (!isVisible || activeMediaMode !== "slideshow" || runToken !== previewSlideshowRunToken) return;
        var src = safeSources[index];
        if (!src) return;
        setPreviewProgressActiveIndex(index);
        previewImg.src = src;
        previewImg.alt = baseAlt;
        previewSlideshowSlideStartedAt = 0;
        startPreviewProgress();
      }

      function queueNext() {
        if (!isVisible || activeMediaMode !== "slideshow" || runToken !== previewSlideshowRunToken) return;
        if (previewSlideshowTimerId) {
          window.clearTimeout(previewSlideshowTimerId);
        }
        previewSlideshowTimerId = window.setTimeout(function () {
          if (!isVisible || activeMediaMode !== "slideshow" || runToken !== previewSlideshowRunToken) return;
          activeIndex = (activeIndex + 1) % safeSources.length;
          applySlide(activeIndex);
          queueNext();
        }, previewSlideshowIntervalMs);
      }

      applySlide(activeIndex);
      queueNext();
      return true;
    }

    function positionPreview(clientX, clientY) {
      if (!isVisible) return;
      var rect = preview.getBoundingClientRect();
      var leftInset = rect.width * activeContentLeftRatio;
      var rightInset = rect.width * activeContentRightRatio;
      var topInset = rect.height * activeContentTopRatio;
      var bottomInset = rect.height * activeContentBottomRatio;
      var nextX = clientX + activeOffsetX - leftInset;
      var nextY = clientY + activeOffsetY - topInset;

      if (nextX + rect.width + VIEWPORT_PADDING > window.innerWidth) {
        nextX = clientX - activeOffsetX - (rect.width - rightInset);
      }
      if (nextY + rect.height + VIEWPORT_PADDING > window.innerHeight) {
        nextY = clientY - activeOffsetY - (rect.height - bottomInset);
      }
      if (nextX < VIEWPORT_PADDING) nextX = VIEWPORT_PADDING;
      if (nextY < VIEWPORT_PADDING) nextY = VIEWPORT_PADDING;
      if (nextX + rect.width + VIEWPORT_PADDING > window.innerWidth) {
        nextX = window.innerWidth - rect.width - VIEWPORT_PADDING;
      }
      if (nextY + rect.height + VIEWPORT_PADDING > window.innerHeight) {
        nextY = window.innerHeight - rect.height - VIEWPORT_PADDING;
      }

      preview.style.transform = "translate3d(" + Math.round(nextX) + "px, " + Math.round(nextY) + "px, 0)";
    }

    function showPreview(target, clientX, clientY) {
      if (!target) return;
      var src = (target.getAttribute("data-detail-preview-src") || "").trim();
      var videoSrc = (target.getAttribute("data-detail-preview-video-src") || "").trim();
      var slideshowSources = parsePreviewSlidesSources(target);
      if (!src && slideshowSources.length) {
        src = slideshowSources[0];
      }
      if (!src && !videoSrc && !slideshowSources.length) return;
      activeTargetEl = target;
      isVisible = true;
      lastClientX = clientX;
      lastClientY = clientY;
      applyPreviewConfig(target);
      stopPreviewSlideshow();
      if (videoSrc) {
        activeMediaMode = "video";
        previewImg.removeAttribute("src");
        previewImg.alt = "";
        previewImg.hidden = true;
        previewVideo.hidden = false;
        previewProgress.hidden = false;
        syncPreviewProgressPagination(1, 0);
        previewVideo.src = videoSrc;
        previewVideo.currentTime = 0;
        var playPromise = previewVideo.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {});
        }
        startPreviewProgress();
      } else {
        stopPreviewVideoPlayback();
        previewImg.hidden = false;
        if (slideshowSources.length > 1) {
          activeMediaMode = "slideshow";
          previewProgress.hidden = false;
          syncPreviewProgressPagination(slideshowSources.length, 0);
          startPreviewImageSlideshow(target, slideshowSources);
        } else {
          activeMediaMode = "image";
          stopPreviewProgress();
          previewProgress.hidden = true;
          syncPreviewProgressPagination(0, 0);
          previewImg.src = src;
          previewImg.alt = (target.getAttribute("data-detail-preview-alt") || target.textContent || "").trim();
        }
      }
      preview.hidden = false;
      preview.setAttribute("aria-hidden", "false");
      positionPreview(clientX, clientY);
      window.requestAnimationFrame(function () {
        if (!isVisible) return;
        positionPreview(lastClientX, lastClientY);
      });
    }

    function hidePreview() {
      activeTargetEl = null;
      isVisible = false;
      stopPreviewSlideshow();
      preview.hidden = true;
      preview.setAttribute("aria-hidden", "true");
      preview.style.transform = "translate3d(-9999px, -9999px, 0)";
      previewImg.removeAttribute("src");
      previewImg.alt = "";
      previewImg.style.removeProperty("--map-project-detail-hotspot-preview-max-width");
      previewImg.style.removeProperty("--map-project-detail-hotspot-preview-max-height");
      previewImg.hidden = false;
      previewVideo.style.removeProperty("--map-project-detail-hotspot-preview-max-width");
      previewVideo.style.removeProperty("--map-project-detail-hotspot-preview-max-height");
      stopPreviewVideoPlayback();
      stopPreviewProgress();
      previewProgress.hidden = true;
      syncPreviewProgressPagination(0, 0);
      activeMediaMode = "image";
      activeOffsetX = 18;
      activeOffsetY = 18;
      activeContentLeftRatio = 0;
      activeContentRightRatio = 0;
      activeContentTopRatio = 0;
      activeContentBottomRatio = 0;
    }

    previewImg.addEventListener("load", function () {
      if (!isVisible) return;
      positionPreview(lastClientX, lastClientY);
    });
    previewVideo.addEventListener("loadedmetadata", function () {
      if (!isVisible || activeMediaMode !== "video") return;
      positionPreview(lastClientX, lastClientY);
    });
    previewVideo.addEventListener("play", function () {
      if (!isVisible || activeMediaMode !== "video") return;
      startPreviewProgress();
    });

    document.addEventListener("focusin", function (event) {
      var target = getHotspotTarget(event.target);
      if (!target) return;
      var rect = target.getBoundingClientRect();
      showPreview(target, rect.right, rect.top + Math.min(24, rect.height));
    }, true);

    document.addEventListener("focusout", function (event) {
      if (!activeTargetEl) return;
      if (event.target !== activeTargetEl) return;
      hidePreview();
    }, true);

    window.addEventListener("blur", hidePreview);
    window.addEventListener("hashchange", hidePreview);
    window.addEventListener("scroll", hidePreview, true);

    document.addEventListener("pointerover", function (event) {
      var target = getHotspotTarget(event.target);
      if (!target) return;
      var prevTarget = getHotspotTarget(event.relatedTarget);
      if (prevTarget && prevTarget === target) return;
      showPreview(target, event.clientX, event.clientY);
    }, true);

    document.addEventListener("pointermove", function (event) {
      if (!activeTargetEl) return;
      lastClientX = event.clientX;
      lastClientY = event.clientY;
      positionPreview(event.clientX, event.clientY);
    }, true);

    document.addEventListener("pointerout", function (event) {
      if (!activeTargetEl) return;
      var fromTarget = getHotspotTarget(event.target);
      if (!fromTarget || fromTarget !== activeTargetEl) return;
      var nextTarget = getHotspotTarget(event.relatedTarget);
      if (nextTarget && nextTarget === activeTargetEl) return;
      hidePreview();
    }, true);
  }

  function initMapProjectDetailSectionCFindingsAccordion() {
    var accordionRoots = Array.prototype.slice.call(
      document.querySelectorAll(
        "#map-project-detail-section-c .map-project-detail-section-c-findings, #map-project-detail-section-c .map-project-detail-section-c-references-accordion"
      )
    );
    if (!accordionRoots.length) return;

    function syncItemState(item, expanded) {
      if (!item) return;
      var button = item.querySelector(".map-project-detail-section-c-finding-toggle");
      if (!button) return;
      var panelId = button.getAttribute("aria-controls");
      var panel = panelId ? document.getElementById(panelId) : null;

      item.classList.toggle("is-expanded", expanded);
      button.setAttribute("aria-expanded", expanded ? "true" : "false");
      if (panel) {
        panel.hidden = !expanded;
        if (!expanded) {
          Array.prototype.forEach.call(panel.querySelectorAll("video"), function (videoEl) {
            try {
              videoEl.pause();
            } catch (error) {}
          });
        }
      }
    }

    accordionRoots.forEach(function (root) {
      if (!root) return;
      var items = Array.prototype.slice.call(
        root.querySelectorAll(".map-project-detail-section-c-finding-item")
      );
      if (!items.length) return;

      items.forEach(function (item) {
        var button = item.querySelector(".map-project-detail-section-c-finding-toggle");
        if (!button) return;
        var panelId = button.getAttribute("aria-controls");
        var panel = panelId ? document.getElementById(panelId) : null;
        var expanded = item.classList.contains("is-expanded") || button.getAttribute("aria-expanded") === "true";
        if (panel && panel.hasAttribute("hidden")) expanded = false;
        syncItemState(item, expanded);

        button.addEventListener("click", function () {
          var nextExpanded = !item.classList.contains("is-expanded");
          syncItemState(item, nextExpanded);
        });
      });
    });
  }

  function initMapProjectDetailSectionCConclusionCarousel() {
    var carouselRoot = document.querySelector(
      "#map-project-detail-section-c .map-project-detail-section-c-conclusion-visual"
    );
    if (!carouselRoot) return;

    var stage = carouselRoot.querySelector(".map-project-detail-section-c-conclusion-carousel");
    if (!stage) return;

    var slides = Array.prototype.slice.call(
      stage.querySelectorAll(".map-project-detail-section-c-conclusion-carousel-slide")
    );
    if (!slides.length) return;

    var pagination = carouselRoot.querySelector(".map-project-detail-section-c-conclusion-carousel-pagination");
    var prevButton = carouselRoot.querySelector(".map-project-detail-section-c-conclusion-carousel-nav-btn--prev");
    var nextButton = carouselRoot.querySelector(".map-project-detail-section-c-conclusion-carousel-nav-btn--next");
    var indicators = [];
    var intervalMs = parseInt(carouselRoot.getAttribute("data-carousel-interval-ms") || "", 10);
    if (!isFinite(intervalMs) || intervalMs < 400) intervalMs = 2000;

    var activeIndex = 0;
    var timerId = 0;
    var progressRaf = 0;

    function stopSlideVideo(slide) {
      if (!slide || slide.tagName !== "VIDEO") return;
      try {
        slide.pause();
      } catch (error) {}
      try {
        slide.currentTime = 0;
      } catch (error) {}
    }

    function playSlideVideo(slide) {
      if (!slide || slide.tagName !== "VIDEO") return;
      slide.muted = true;
      slide.loop = false;
      try {
        slide.currentTime = 0;
      } catch (error) {}
      var playPromise = slide.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {});
      }
    }

    function clearVideoEndedListeners() {
      slides.forEach(function (slide) {
        if (!slide || slide.tagName !== "VIDEO") return;
        var handler = slide.__sectionCConclusionEndedHandler;
        if (!handler) return;
        slide.removeEventListener("ended", handler);
        slide.__sectionCConclusionEndedHandler = null;
      });
    }

    function stopProgress() {
      if (!progressRaf) return;
      window.cancelAnimationFrame(progressRaf);
      progressRaf = 0;
    }

    function setProgress(progress) {
      var clamped = Math.max(0, Math.min(1, Number(progress) || 0));
      var activeIndicator = pagination
        ? pagination.querySelector(".map-project-detail-section-c-conclusion-carousel-pagination-item.is-active")
        : null;
      if (!activeIndicator) return;
      activeIndicator.style.setProperty("--map-center-hover-preview-slide-progress", clamped.toFixed(4));
    }

    function syncIndicators(index) {
      indicators.forEach(function (item, itemIndex) {
        var isActive = itemIndex === index;
        item.classList.toggle("is-active", isActive);
        item.style.setProperty("--map-center-hover-preview-slide-progress", isActive ? "0" : "0");
      });
    }

    function setActiveSlide(nextIndex) {
      var count = slides.length;
      if (!count) return;
      clearVideoEndedListeners();
      stopProgress();
      activeIndex = ((nextIndex % count) + count) % count;

      slides.forEach(function (slide, index) {
        var isActive = index === activeIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");
        if (isActive) {
          playSlideVideo(slide);
        } else {
          stopSlideVideo(slide);
        }
      });

      syncIndicators(activeIndex);
    }

    function clearAutoAdvanceState() {
      if (timerId) {
        window.clearTimeout(timerId);
        timerId = 0;
      }
      clearVideoEndedListeners();
      stopProgress();
    }

    function startTimedProgress(slideIndex, durationMs) {
      stopProgress();
      var totalMs = Math.max(80, Number(durationMs) || 0);
      if (!(totalMs > 0)) {
        setProgress(0);
        return;
      }
      var startedAt = 0;

      function tick(timestamp) {
        if (slideIndex !== activeIndex) {
          progressRaf = 0;
          return;
        }
        if (!startedAt) startedAt = timestamp;
        var progress = Math.max(0, Math.min(1, (timestamp - startedAt) / totalMs));
        setProgress(progress);
        if (progress >= 1) {
          progressRaf = 0;
          return;
        }
        progressRaf = window.requestAnimationFrame(tick);
      }

      progressRaf = window.requestAnimationFrame(tick);
    }

    function startVideoProgress(videoSlide, slideIndex) {
      stopProgress();

      function tick() {
        if (slideIndex !== activeIndex || slides[activeIndex] !== videoSlide) {
          progressRaf = 0;
          return;
        }
        var duration = videoSlide.duration;
        if (isFinite(duration) && duration > 0) {
          setProgress(videoSlide.currentTime / duration);
        } else {
          setProgress(0);
        }
        progressRaf = window.requestAnimationFrame(tick);
      }

      progressRaf = window.requestAnimationFrame(tick);
    }

    function queueNextTick() {
      clearAutoAdvanceState();
      if (slides.length < 2) return;
      var currentIndex = activeIndex;
      var currentSlide = slides[currentIndex];

      if (currentSlide && currentSlide.tagName === "VIDEO") {
        startVideoProgress(currentSlide, currentIndex);
        var onEnded = function () {
          currentSlide.__sectionCConclusionEndedHandler = null;
          if (currentIndex !== activeIndex) return;
          setProgress(1);
          setActiveSlide(activeIndex + 1);
          queueNextTick();
        };
        currentSlide.__sectionCConclusionEndedHandler = onEnded;
        currentSlide.addEventListener("ended", onEnded, { once: true });
        return;
      }

      startTimedProgress(currentIndex, intervalMs);
      timerId = window.setTimeout(function () {
        if (currentIndex !== activeIndex) return;
        setActiveSlide(activeIndex + 1);
        queueNextTick();
      }, intervalMs);
    }

    function stepBy(delta) {
      setActiveSlide(activeIndex + delta);
      queueNextTick();
    }

    if (pagination) {
      pagination.innerHTML = "";
      slides.forEach(function (_, index) {
        var indicator = document.createElement("span");
        indicator.className = "map-project-detail-section-c-conclusion-carousel-pagination-item";
        if (index === 0) indicator.classList.add("is-active");
        indicator.setAttribute("aria-hidden", "true");
        pagination.appendChild(indicator);
        indicators.push(indicator);
      });
    }

    carouselRoot.addEventListener("click", function () {
      if (typeof carouselRoot.focus === "function") {
        try {
          carouselRoot.focus({ preventScroll: true });
        } catch (error) {
          carouselRoot.focus();
        }
      }
    });

    carouselRoot.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        stepBy(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepBy(-1);
      }
    });

    if (prevButton) {
      prevButton.addEventListener("click", function (event) {
        event.preventDefault();
        stepBy(-1);
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", function (event) {
        event.preventDefault();
        stepBy(1);
      });
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        clearAutoAdvanceState();
        slides.forEach(function (slide) {
          stopSlideVideo(slide);
        });
        return;
      }
      setActiveSlide(activeIndex);
      queueNextTick();
    });

    setActiveSlide(0);
    queueNextTick();
  }

  function init() {
    initBrandedImageLoading();
    if (!document.querySelector(ROOT_SELECTOR)) return;

    setMode();
    document.documentElement.setAttribute("data-bubble-motion-build", "20260309-9");
    syncViewportVars();
    var bubbleMotionApi = initLandingBubbleMotion();
    bindBottomAreaScroll();
    initNamecardFlip();
    initLandingExclusionInline(bubbleMotionApi);
    initLandingStudioInline(bubbleMotionApi);
    initLandingExclusionGame();
    initLandingModals();
    initProjectInlineProjectView();
    initMapCenterHoverPreview();
    initExternalLinkHoverPreview();
    initMapProjectDetailHotspotPreview();
    initMapProjectDetailSectionCFindingsAccordion();
    initMapProjectDetailSectionCConclusionCarousel();

    window.addEventListener("resize", syncViewportVars);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", syncViewportVars);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
