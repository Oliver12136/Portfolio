/* Shared, dependency-free image/video/gallery presentation. Only the active slide is mounted. */
(function () {
  "use strict";
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function createVeritas(slot) {
    var prefix = "map-project-detail-section-c-conclusion-";
    var figure = el("figure", "project-media " + prefix + "visual");
    figure.dataset.mediaSlot = slot.id;
    figure.dataset.carouselIntervalMs = "2000";
    figure.tabIndex = 0;
    figure.setAttribute("role", "region");
    figure.setAttribute("aria-roledescription", "carousel");
    figure.setAttribute(
      "aria-label",
      slot.caption || slot.items[0].alt || "Service concept media",
    );
    var stage = el("div", "project-media-frame " + prefix + "carousel");
    if (slot.aspectRatio) stage.style.aspectRatio = slot.aspectRatio;
    stage.dataset.brandImageHost = "";
    stage.dataset.brandActiveOnly = "";
    var items = slot.items.slice().sort(function (a, b) {
      return a.order - b.order;
    });
    items.forEach(function (item, index) {
      var pending =
        slot.pending !== false || item.pending !== false || !item.src;
      var slide = el(
        pending || item.layers
          ? "div"
          : item.type === "video"
            ? "video"
            : "img",
        prefix + "carousel-slide",
      );
      if (item.figmaNode) slide.dataset.figmaNode = item.figmaNode;
      slide.classList.toggle("is-active", index === 0);
      slide.setAttribute("aria-hidden", String(index !== 0));
      if (pending) {
        slide.setAttribute("role", "img");
        slide.setAttribute(
          "aria-label",
          "Media pending: " + (item.alt || slot.id),
        );
      } else if (item.layers) {
        slide.setAttribute("role", "img");
        slide.setAttribute("aria-label", item.alt || "");
        var crop = el("div", "project-media-figma-crop");
        item.layers.forEach(function (layer) {
          var image = el("img", "project-media-figma-layer");
          image.dataset.brandLoading = "";
          image.dataset.carouselSrc = layer.src;
          image.alt = "";
          image.loading = "lazy";
          image.decoding = "async";
          image.dataset.figmaNode = layer.figmaNode;
          ["width", "height", "left", "top"].forEach(function (key) {
            image.style[key] = layer[key];
          });
          crop.appendChild(image);
        });
        slide.appendChild(crop);
      } else {
        slide.dataset.carouselSrc = item.src;
        if (item.type !== "video") slide.dataset.brandLoading = "";
        if (item.type === "video") {
          slide.classList.add(prefix + "carousel-slide--video");
          slide.playsInline = true;
          slide.muted = true;
          slide.preload = "none";
          if (item.poster) slide.dataset.carouselPoster = item.poster;
          slide.setAttribute("aria-label", item.alt || "");
        } else {
          slide.alt = item.alt || "";
          slide.loading = "lazy";
          slide.decoding = "async";
        }
      }
      stage.appendChild(slide);
    });
    var footer = el("div", prefix + "carousel-footer");
    var pagination = el("div", prefix + "carousel-pagination");
    pagination.setAttribute("aria-hidden", "true");
    var navigation = el("div", prefix + "carousel-nav");
    navigation.setAttribute("aria-label", "Carousel controls");
    ["prev", "next"].forEach(function (direction) {
      var button = el(
        "button",
        prefix +
          "carousel-nav-btn " +
          prefix +
          "carousel-nav-btn--" +
          direction,
      );
      button.type = "button";
      button.setAttribute(
        "aria-label",
        direction === "prev" ? "Previous media" : "Next media",
      );
      navigation.appendChild(button);
    });
    footer.append(pagination, navigation);
    if (items.length < 2) footer.hidden = true;
    figure.append(stage, footer);
    return figure;
  }
  function create(slot, options) {
    options = options || {};
    if (options.variant === "veritas") return createVeritas(slot);
    var figure = el("figure", "project-media");
    figure.dataset.mediaSlot = slot.id;
    figure.style.setProperty("--media-ratio", slot.aspectRatio || "16 / 9");
    var frame = el("div", "project-media-frame");
    if (options.deferLoad) frame.dataset.brandImageHost = "";
    figure.appendChild(frame);
    var items = (slot.items || []).slice().sort(function (a, b) {
      return a.order - b.order;
    });
    if (!items.length) items = [{ pending: true }];
    var index = 0;
    var caption = el("figcaption", "project-media-caption");
    var controls, status, previous, next;
    function show(nextIndex) {
      var oldVideo = frame.querySelector("video");
      if (oldVideo) oldVideo.pause();
      index = (nextIndex + items.length) % items.length;
      frame.replaceChildren();
      frame.classList.remove("has-media");
      frame.removeAttribute("role");
      frame.removeAttribute("aria-label");
      var item = items[index];
      if (slot.pending !== false || item.pending !== false || !item.src) {
        frame.setAttribute("role", "img");
        frame.setAttribute(
          "aria-label",
          "Media pending: " + (item.alt || slot.caption || slot.id),
        );
      } else {
        var media;
        if (item.type === "video") {
          media = el("video");
          media.controls = true;
          media.playsInline = true;
          media.preload = "none";
          media.setAttribute(
            "aria-label",
            item.alt || slot.caption || "Project demonstration",
          );
          if (item.poster) media.poster = item.poster;
          if (item.captions) {
            var track = el("track");
            track.kind = "captions";
            track.src = item.captions;
            track.srclang = item.language || "en";
            track.label = item.captionsLabel || "English";
            media.appendChild(track);
          }
        } else {
          media = el("img");
          media.alt = item.alt || "";
          media.loading = "lazy";
          media.decoding = "async";
        }
        media.addEventListener("error", function () {
          if (media.parentNode) media.remove();
          frame.classList.remove("has-media");
          frame.setAttribute("role", "img");
          frame.setAttribute(
            "aria-label",
            "Media unavailable: " + (item.alt || slot.caption || slot.id),
          );
        });
        if (options.deferLoad && item.type !== "video") { media.dataset.brandLoading = ""; media.dataset.lazySrc = item.src; }
        else media.src = item.src;
        frame.appendChild(media);
        frame.classList.add("has-media");
        if (item.type !== "video" && options.onEnlarge) {
          var zoom = el("button", "project-media-enlarge");
          zoom.type = "button";
          zoom.setAttribute(
            "aria-label",
            "Enlarge " + (item.alt || slot.caption),
          );
          zoom.addEventListener("click", function (event) {
            event.stopPropagation();
            options.onEnlarge(
              item.viewerSrc || item.src,
              item.alt || "",
              item.src,
            );
          });
          frame.appendChild(zoom);
        }
      }
      caption.textContent = item.caption || slot.caption || "";
      caption.hidden = !caption.textContent || options.preview === true;
      if (status) status.textContent = index + 1 + " / " + items.length;
      if (controls)
        Array.prototype.forEach.call(
          controls.querySelectorAll("[data-page]"),
          function (button, i) {
            button.setAttribute("aria-pressed", String(index === i));
          },
        );
    }
    if (items.length > 1) {
      figure.setAttribute("role", "region");
      figure.setAttribute("aria-roledescription", "carousel");
      figure.setAttribute(
        "aria-label",
        slot.caption || items[0].alt || slot.id,
      );
      figure.tabIndex = 0;
      controls = el("div", "project-media-controls");
      previous = el("button", "", "←");
      previous.type = "button";
      previous.setAttribute("aria-label", "Previous media");
      previous.addEventListener("click", function (event) {
        event.stopPropagation();
        show(index - 1);
      });
      controls.appendChild(previous);
      items.forEach(function (item, i) {
        var page = el("button", "project-media-page");
        page.type = "button";
        page.dataset.page = i;
        page.setAttribute("aria-label", "Show media " + (i + 1));
        page.addEventListener("click", function (event) {
          event.stopPropagation();
          show(i);
        });
        controls.appendChild(page);
      });
      next = el("button", "", "→");
      next.type = "button";
      next.setAttribute("aria-label", "Next media");
      next.addEventListener("click", function (event) {
        event.stopPropagation();
        show(index + 1);
      });
      controls.appendChild(next);
      status = el("span", "project-media-status");
      status.setAttribute("aria-live", "polite");
      status.setAttribute("aria-atomic", "true");
      controls.appendChild(status);
      figure.appendChild(controls);
      figure.addEventListener("keydown", function (event) {
        if (
          event.target.tagName === "VIDEO" ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey
        )
          return;
        if (["ArrowLeft", "ArrowRight", "Home", "End"].indexOf(event.key) < 0)
          return;
        event.preventDefault();
        event.stopPropagation();
        show(
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : index + (event.key === "ArrowLeft" ? -1 : 1),
        );
      });
      var start,
        suppressClick = false;
      frame.addEventListener(
        "click",
        function (event) {
          if (suppressClick) {
            event.preventDefault();
            event.stopImmediatePropagation();
            suppressClick = false;
          }
        },
        true,
      );
      frame.addEventListener("pointerdown", function (event) {
        if (event.target.tagName === "VIDEO") return;
        suppressClick = false;
        start = { x: event.clientX, y: event.clientY };
        event.stopPropagation();
      });
      frame.addEventListener("pointerup", function (event) {
        if (!start) return;
        var dx = event.clientX - start.x,
          dy = event.clientY - start.y;
        start = null;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
          suppressClick = true;
          event.stopPropagation();
          show(index + (dx < 0 ? 1 : -1));
        }
      });
      frame.addEventListener("pointercancel", function () {
        start = null;
      });
    }
    figure.appendChild(caption);
    show(0);
    return figure;
  }
  function hydrateCarousel(slide) {
    [slide].concat(Array.from(slide.querySelectorAll("[data-carousel-src], [data-carousel-poster]"))).forEach(function (media) {
      if (media.dataset.carouselPoster) {
        media.poster = media.dataset.carouselPoster;
        delete media.dataset.carouselPoster;
      }
      if (media.dataset.carouselSrc) {
        media.src = media.dataset.carouselSrc;
        delete media.dataset.carouselSrc;
      }
    });
  }
  window.ProjectMedia = { create: create, hydrateCarousel: hydrateCarousel };
})();
