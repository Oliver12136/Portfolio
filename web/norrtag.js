(function () {
  "use strict";
  function node(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text) n.textContent = text;
    return n;
  }
  function hotspot(text, assets, className) {
    var span = node("span", "map-project-detail-hotspot norrtag-hotspot " + className, text);
    var sources = assets.map(function (name) { return "./assets/projects/norrtag/" + name + ".webp"; });
    span.tabIndex = 0;
    span.dataset.detailPreviewSrc = sources[0];
    if (sources.length > 1) span.dataset.detailPreviewSlides = sources.join("|");
    span.dataset.detailPreviewAlt = text + " — supporting project image";
    var size = assets[0].indexOf("bp") === 0 ? [1864, 614] : ({ ep1: [817, 825], ep2: [971, 682], ep3: [591, 680] })[assets[0]];
    span.dataset.detailPreviewWidth = size[0];
    span.dataset.detailPreviewHeight = size[1];
    span.dataset.detailPreviewMaxWidth = "52rem";
    span.dataset.detailPreviewMaxHeight = "72vh";
    span.dataset.detailPreviewOffsetX = "18";
    span.dataset.detailPreviewOffsetY = "18";
    return span;
  }
  function clear(root) {
    if (root.norrtagMediaCleanup) {
      root.norrtagMediaCleanup();
      root.norrtagMediaCleanup = null;
    }
    if (root.norrtagLayoutCleanup) {
      root.norrtagLayoutCleanup();
      root.norrtagLayoutCleanup = null;
    }
    if (root.norrtagVideoCleanup) {
      root.norrtagVideoCleanup();
      root.norrtagVideoCleanup = null;
    }
    root
      .querySelectorAll(".map-project-detail-section-c-conclusion-visual")
      .forEach(function (figure) {
        if (figure.carouselCleanup) figure.carouselCleanup();
      });
    root.querySelectorAll("video").forEach(function (v) {
      v.pause();
      v.removeAttribute("src");
      v.load();
    });
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    root.replaceChildren();
  }
  function image(key, className) {
    var asset = window.NorrtagFigmaAssets[key],
      img = node("img", className);
    var replacement = {
      hero: "hero-service",
      poster: "min-vag",
      workshop3: "workshop",
      workshop4: "workshop",
    }[key];
    var replacementIndex = key === "workshop4" ? 1 : 0;
    var configured = replacement && window.NorrtagMedia[replacement];
    var replacementItem = configured && configured.items[replacementIndex];
    img.dataset.lazySrc =
      configured &&
      configured.pending === false &&
      replacementItem &&
      replacementItem.pending === false &&
      replacementItem.src &&
      replacementItem.type !== "video"
        ? replacementItem.src
        : asset.src;
    img.dataset.brandLoading = "";
    img.alt = asset.alt;
    img.dataset.figmaNode = asset.nodeId;
    img.loading = key === "hero" ? "eager" : "lazy";
    img.decoding = "async";
    img.addEventListener("error", function () {
      img.hidden = true;
      if (img.parentElement) img.parentElement.style.background = "#e6e6e6";
    });
    return img;
  }
  function researchMedia(captions) {
    var pair = node("div", "norrtag-research-media norrtag-pair");
    var probe = node("figure");
    var collage = node("div", "norrtag-probe-collage");
    ["poster", "basket", "token"].forEach(function (key) {
      var crop = node("div", "norrtag-crop norrtag-crop-" + key);
      crop.appendChild(image(key));
      crop.dataset.brandImageHost = "";
      collage.appendChild(crop);
    });
    probe.append(
      collage,
      node("figcaption", "", "Contextual cultural probe artifacts & Poster"),
    );
    var phones = node("figure");
    var phoneStage = node("div", "norrtag-phone-stage"),
      phoneRow = node("div", "norrtag-phone-row");
    ["probe-start", "probe-use", "probe-real-life"].forEach(function (id, i) {
      var item = window.NorrtagMedia[id].items[0];
      var phone = node("div", "norrtag-phone");
      var video = node("video", "norrtag-probe-video");
      video.dataset.mediaSlot = id;
      video.dataset.figmaNode =
        window.NorrtagFigmaAssets["phone" + (i + 1)].nodeId;
      video.src = item.src;
      video.dataset.lazyPoster = item.poster;
      video.playsInline = true;
      video.preload = "none";
      video.loop = true;
      video.defaultMuted = true;
      video.muted = true;
      video.volume = 0;
      video.controls = false;
      video.setAttribute("aria-label", item.alt);
      phone.appendChild(video);
      phoneRow.appendChild(phone);
    });
    phoneStage.appendChild(phoneRow);
    phones.append(
      phoneStage,
      node(
        "figcaption",
        "",
        "Website for collecting user stories 1.Onboarding & Consent 2.UI 3.Shake to explore",
      ),
    );
    pair.append(probe, phones);
    if (!captions)
      pair.querySelectorAll("figcaption").forEach(function (caption) {
        caption.remove();
      });
    return pair;
  }
  function workshopMedia() {
    var workshopPair = node("div", "norrtag-workshop-media norrtag-pair");
    var left = node("figure", "norrtag-workshop-crop");
    ["workshop1", "workshop2", "workshop3"].forEach(function (key) {
      left.appendChild(image(key));
    });
    left.dataset.brandImageHost = "";
    var right = node("figure", "norrtag-workshop-crop");
    right.dataset.brandImageHost = "";
    right.appendChild(image("workshop4"));
    workshopPair.append(left, right);
    return workshopPair;
  }
  function render(root, onEnlarge) {
    clear(root);
    root.hidden = false;
    root.setAttribute("aria-hidden", "false");
    var content = window.NorrtagContent,
      design = window.NorrtagComposition;
    function paragraphs(parent, texts) {
      texts.forEach(function (text) {
        parent.appendChild(node("p", "", text));
      });
    }
    function media(id, className) {
      var component = window.ProjectMedia.create(window.NorrtagMedia[id], {
        deferLoad: true,
        onEnlarge: onEnlarge,
      });
      if (className) component.classList.add(className);
      return component;
    }
    function section(className, id) {
      var s = node("section", className);
      if (id) s.dataset.figmaNode = id;
      root.appendChild(s);
      return s;
    }
    function heading(parent, text, level, className) {
      parent.appendChild(node(level || "h3", className, text));
    }
    var opening = section("norrtag-opening norrtag-inner", "5:1335");
    var meta = node("div", "norrtag-metadata"),
      tags = node("div"),
      credits = node("div");
    paragraphs(tags, design.tags);
    paragraphs(credits, design.metadata);
    meta.append(tags, credits);
    opening.appendChild(meta);
    var hero = node("div", "norrtag-hero");
    var heroFigure = node("figure", "norrtag-hero-figure");
    var heroItem = window.NorrtagMedia["hero-service"].items[0];
    var heroVideo = node("video", "norrtag-hero-video");
    heroVideo.src = heroItem.src;
    heroVideo.dataset.lazyPoster = heroItem.poster;
    heroVideo.playsInline = true;
    heroVideo.preload = "none";
    heroVideo.setAttribute("aria-label", "Everyone’s on Board concept video");
    heroFigure.dataset.mediaSlot = "hero-service";
    var play = node("button", "norrtag-hero-play");
    play.type = "button";
    play.setAttribute("aria-label", "Play concept video");
    function syncHeroControls() {
      heroVideo.controls =
        heroFigure.matches(":hover, :focus-within") ||
        window.matchMedia("(hover: none)").matches;
    }
    heroFigure.addEventListener("pointerenter", syncHeroControls);
    heroFigure.addEventListener("pointerleave", function (event) {
      if (event.pointerType === "mouse") heroVideo.controls = false;
    });
    heroFigure.addEventListener("focusin", syncHeroControls);
    heroFigure.addEventListener("focusout", function () {
      requestAnimationFrame(syncHeroControls);
    });
    heroVideo.addEventListener("playing", function () {
      play.hidden = true;
    });
    heroVideo.addEventListener("pause", function () {
      play.hidden = false;
    });
    play.addEventListener("click", function () {
      syncHeroControls();
      heroVideo.play().catch(function () {
        play.hidden = false;
      });
    });
    heroFigure.append(heroVideo, play);
    hero.append(
      heroFigure,
      node("p", "norrtag-introduction", design.introduction),
    );
    opening.appendChild(hero);
    setupVideoLoading(heroVideo);
    requestAnimationFrame(function () { if (root.isConnected && !root.hidden) hydrateDeferredMedia(heroVideo); });

    var research = section("norrtag-research norrtag-blue", "5:2256");
    research.dataset.chromeTone = "norrtag-blue";
    var ri = node("div", "norrtag-inner");
    research.appendChild(ri);
    heading(ri, "Participatory Inquiries", "h3", "norrtag-kicker");
    var researchTitle = node("div", "norrtag-research-title");
    heading(researchTitle, design.researchHeading, "h4");
    researchTitle.appendChild(
      node("p", "norrtag-research-count", design.researchCount),
    );
    ri.appendChild(researchTitle);
    var researchIntro = node("div", "norrtag-research-intro");
    var researchCopy = node("p");
    var researchText = content.sections[0].body.join(" ");
    var phrase = "travel experiences";
    var phraseStart = researchText.lastIndexOf(phrase);
    researchCopy.appendChild(document.createTextNode(researchText.slice(0, phraseStart)));
    researchCopy.appendChild(hotspot(phrase, ["ep1", "ep2", "ep3"], "norrtag-hotspot--yellow"));
    researchCopy.appendChild(document.createTextNode(researchText.slice(phraseStart + phrase.length)));
    researchIntro.appendChild(researchCopy);

    var routeHost = node("span", "norrtag-route-host");
    routeHost.dataset.brandImageHost = "";
    routeHost.appendChild(image("route", "norrtag-route"));
    researchIntro.appendChild(routeHost);
    ri.appendChild(researchIntro);
    var pair = researchMedia(true);
    ri.appendChild(pair);

    var findings = section("norrtag-findings norrtag-blue", "44:1308");
    findings.dataset.chromeTone = "norrtag-blue";
    var findingsInner = node("div", "norrtag-inner");
    findings.appendChild(findingsInner);
    heading(findingsInner, "Core Research Insights");
    var findingsPair = node("div", "norrtag-pair");
    content.sections[2].findings.forEach(function (f, i) {
      var column = node("div");
      column.appendChild(
        node("p", "norrtag-insight-label", "Insight 0" + (i + 1)),
      );
      heading(
        column,
        i === 0 ? "Information without clarity" : "Human Interaction and Care",
        "h4",
      );
      paragraphs(column, [f.body]);
      findingsPair.appendChild(column);
    });
    findingsInner.appendChild(findingsPair);

    var workshop = section("norrtag-workshop norrtag-blue", "44:1306");
    workshop.dataset.chromeTone = "norrtag-blue";
    var wi = node("div", "norrtag-inner");
    workshop.appendChild(wi);
    heading(wi, "Workshops on the train", "h3", "norrtag-kicker");
    heading(wi, design.workshopStatement, "h4", "norrtag-workshop-statement");
    paragraphs(wi, [content.sections[1].body.join(" ")]);
    var workshopPair = workshopMedia();
    wi.appendChild(workshopPair);
    wi.appendChild(
      node(
        "p",
        "norrtag-workshop-caption",
        "Journey mapping and live testing inside active train cars to analyze crew attention limits and passenger spatial needs.",
      ),
    );
    var qualities = node("div", "norrtag-qualities norrtag-pair");
    content.sections[3].qualities.forEach(function (q) {
      var col = node("div");
      heading(col, q[0], "h4");
      paragraphs(col, [q[1]]);
      qualities.appendChild(col);
    });
    wi.appendChild(qualities);

    var service = section("norrtag-service norrtag-inner", "5:1389");
    heading(service, "The Integrated Service Concept");
    service.appendChild(
      node("p", "norrtag-service-intro", design.serviceIntro),
    );
    service.appendChild(media("blueprint", "norrtag-service-blueprint"));
    var rows = node("div", "norrtag-service-rows");
    content.sections[5].layers.forEach(function (layer, i) {
      var row = node("section", "norrtag-layer"),
        copy = node("div", "norrtag-layer-intro");
      copy.appendChild(
        node("p", "norrtag-quality-label", "Quality 0" + (i + 1)),
      );
      var serviceHeading = node("h4");
      serviceHeading.appendChild(hotspot(design.layers[i][0], ["bp" + (i + 1)], "norrtag-hotspot--blue"));
      copy.appendChild(serviceHeading);
      paragraphs(copy, [design.layers[i][1]]);
      var gallerySlot = {
        id: "service-layer-" + i,
        type: "mixed",
        aspectRatio: i === 0 ? "823 / 463" : "16 / 9",
        pending: false,
        caption: "",
        items:
          i === 0
            ? window.NorrtagProactiveSlides.concat(window.NorrtagServiceVideos[0])
            : [window.NorrtagServiceVideos[i]],
      };
      var region = window.ProjectMedia.create(gallerySlot, {
        variant: "veritas",
        onEnlarge: onEnlarge,
      });
      region.classList.add("norrtag-service-media");
      // Navigation appears on focus/hover, leaving Figma's plain media rectangles intact at rest.
      row.append(copy, region);
      rows.appendChild(row);
      window.initPortfolioMediaCarousel(region);
    });
    service.appendChild(rows);

    var prototype = section("norrtag-prototype norrtag-inner", "5:1424");
    heading(prototype, "Real-Time Functional Prototype");
    var prototypeRow = node("div", "norrtag-hero norrtag-prototype-demo");
    var prototypeFigure = node("figure", "norrtag-hero-figure norrtag-prototype-demo-figure");
    prototypeFigure.dataset.mediaSlot = "prototype-demo";
    var prototypeItem = window.NorrtagMedia["prototype-demo"].items[0];
    var prototypeVideo = node("video", "norrtag-hero-video norrtag-prototype-demo-video");
    prototypeVideo.src = prototypeItem.src;
    prototypeVideo.dataset.lazyPoster = prototypeItem.poster;
    prototypeVideo.controls = true;
    prototypeVideo.playsInline = true;
    prototypeVideo.preload = "none";
    prototypeVideo.muted = false;
    prototypeVideo.setAttribute("aria-label", "Full experience with the physical touchpoint and mobile interface");
    var fallback = node("p", "", "Your browser does not support this video. ");
    var download = node("a", "", "Download the demonstration");
    download.href = prototypeItem.src;
    fallback.appendChild(download);
    prototypeVideo.appendChild(fallback);
    prototypeFigure.appendChild(prototypeVideo);
    prototypeRow.append(prototypeFigure, node("p", "norrtag-introduction", content.sections[7].body[0]));
    prototype.appendChild(prototypeRow);

    // Match the route image to the visible text edge, including wrapped tablet/mobile copy.
    var count = researchTitle.querySelector(".norrtag-research-count");
    function alignRouteToText() {
      if (!root.isConnected || root.hidden) return;
      var range = document.createRange();
      range.selectNodeContents(count);
      var textRight = range.getBoundingClientRect().right;
      var inset = Math.max(0, researchIntro.getBoundingClientRect().right - textRight);
      researchIntro.style.paddingInlineEnd = inset + "px";
    }
    var routeObserver = new ResizeObserver(alignRouteToText);
    routeObserver.observe(count);
    routeObserver.observe(researchTitle);
    document.fonts.ready.then(function () { if (root.norrtagLayoutCleanup) alignRouteToText(); });
    root.norrtagLayoutCleanup = function () { routeObserver.disconnect(); };

    root.norrtagMediaCleanup = observeDeferredMedia(root, document.getElementById("map-project-inline-scroll"));
    root.norrtagVideoCleanup = activateProbeVideos(
      root,
      document.getElementById("map-project-inline-scroll"),
    );
  }
  function setupVideoLoading(video) {
    if (!window.PortfolioMediaLoading) return;
    var host = video.closest("[data-brand-image-host]") || video.parentElement;
    host.dataset.brandImageHost = "";
    window.PortfolioMediaLoading.trackVideo(video, host);
  }
  function hydrateDeferredMedia(media) {
    if (media.dataset.lazyPoster) {
      media.dataset.posterSource = media.dataset.lazyPoster;
      var poster = window.NorrtagMediaSources.poster(media, media.dataset.lazyPoster);
      if (media.__brandVideoLoading) media.__brandVideoLoading.setPoster(poster);
      else media.poster = poster;
      delete media.dataset.lazyPoster;
    }
    if (media.dataset.lazySrc) {
      window.NorrtagMediaSources.image(media, media.dataset.lazySrc);
      delete media.dataset.lazySrc;
    }
  }
  function observeDeferredMedia(root, scrollRoot) {
    var videos = Array.from(root.querySelectorAll("video"));
    videos.forEach(setupVideoLoading);
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        hydrateDeferredMedia(entry.target); observer.unobserve(entry.target);
      });
    }, { root: scrollRoot, rootMargin: "320px 0px", threshold: 0 });
    root.querySelectorAll("[data-lazy-src], [data-lazy-poster]").forEach(function (media) { observer.observe(media); });
    var resizeFrame = 0;
    function onResize() {
      if (resizeFrame) return;
      resizeFrame = requestAnimationFrame(function () {
        resizeFrame = 0;
        if (!root.isConnected || root.hidden) return;
        root.querySelectorAll("img[srcset]").forEach(function (img) { window.NorrtagMediaSources.image(img, img.getAttribute("src")); });
        videos.forEach(function (video) {
          if (!video.dataset.posterSource || video.readyState >= 2) return;
          var src = window.NorrtagMediaSources.poster(video, video.dataset.posterSource);
          if (video.getAttribute("poster") !== src && video.__brandVideoLoading) video.__brandVideoLoading.setPoster(src);
        });
      });
    }
    window.addEventListener("resize", onResize);
    return function () {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      videos.forEach(function (video) { if (video.__brandVideoLoading) video.__brandVideoLoading.dispose(); });
    };
  }
  function activateProbeVideos(root, scrollRoot) {
    var states = [];
    function sync(state) {
      if (state.visible && !state.hovered && !document.hidden)
        state.video.play().catch(function () {});
      else state.video.pause();
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var state = states.find(function (s) {
            return s.video === entry.target;
          });
          if (!state) return;
          state.visible =
            entry.isIntersecting && entry.intersectionRatio >= 0.2;
          sync(state);
        });
      },
      {
        root: scrollRoot || null,
        threshold: [0, 0.2],
      },
    );
    root.querySelectorAll(".norrtag-probe-video").forEach(function (video) {
      var state = { video: video, visible: false, hovered: false };
      states.push(state);
      state.enter = function (event) {
        if (event.pointerType !== "mouse") return;
        state.hovered = true;
        sync(state);
      };
      state.leave = function (event) {
        if (event.pointerType !== "mouse") return;
        state.hovered = false;
        sync(state);
      };
      video.addEventListener("pointerenter", state.enter);
      video.addEventListener("pointerleave", state.leave);
      observer.observe(video);
    });
    var onVisibility = function () {
      states.forEach(sync);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return function () {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      states.forEach(function (s) {
        s.video.pause();
        s.video.removeEventListener("pointerenter", s.enter);
        s.video.removeEventListener("pointerleave", s.leave);
      });
    };
  }
  function renderPreview(root, composition) {
    clear(root);
    root.hidden = false;
    root.setAttribute("aria-hidden", "false");
    root.appendChild(
      composition === "research" ? researchMedia(false) : workshopMedia(),
    );
    root.querySelectorAll("img").forEach(function (img) {
      img.loading = "eager";
    });
    root.norrtagMediaCleanup = observeDeferredMedia(root, null);
    root.norrtagVideoCleanup = activateProbeVideos(root, null);
  }
  window.NorrtagPage = {
    render: render,
    clear: clear,
    renderPreview: renderPreview,
  };
})();
