(() => {
  const parseNumber = (value, fallback) => {
    const numberValue = Number.parseFloat(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
  };

  const escapeSlot = (value) => {
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(value);
    }
    return value.replace(/"/g, '\\"');
  };

  const initSlideshow = (element) => {
    if (!element || element.dataset.liteSlideshow === "true") {
      return;
    }

    const items = Array.from(element.querySelectorAll(":scope > media-item"));
    if (items.length <= 1) {
      return;
    }

    const shadow = element.shadowRoot;
    if (!shadow) {
      return;
    }

    element.dataset.liteSlideshow = "true";

    const style = document.createElement("style");
    style.textContent = `
:host([data-lite-slideshow="true"]) .slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--lite-transition, 0.4s) ease;
}

:host([data-lite-slideshow="true"]) .slide.active-slide {
  opacity: 1;
  visibility: visible;
  position: relative;
}

:host([data-lite-slideshow="true"]) .slide-list {
  position: relative;
  transform: translateX(0) !important;
}

:host([data-lite-slideshow="true"]) .slideshow-wrapper {
  overflow: hidden;
}
`;
    shadow.appendChild(style);

    const slides = items
      .map((item) => {
        const slotName = item.getAttribute("slot");
        if (!slotName) {
          return null;
        }
        return shadow.querySelector(`.slide[slot="${escapeSlot(slotName)}"]`);
      })
      .filter(Boolean);

    if (slides.length <= 1) {
      return;
    }

    slides.forEach((slide) => slide.classList.add("adjacent-slide"));

    let currentIndex = 0;

    const setActive = (nextIndex) => {
      currentIndex = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, index) => {
        slide.classList.remove("active-slide", "destination-slide");
        if (index === currentIndex) {
          slide.classList.add("active-slide", "destination-slide");
        }
      });
    };

    setActive(0);

    const autoplayDelay = parseNumber(element.getAttribute("autoplay-delay"), 0);
    const transitionSpeed = parseNumber(
      element.getAttribute("transition-speed"),
      0.4
    );
    element.style.setProperty("--lite-transition", `${transitionSpeed}s`);

    let timerId = null;
    let paused = false;

    const start = () => {
      if (autoplayDelay <= 0) {
        return;
      }
      stop();
      timerId = window.setInterval(() => {
        if (!paused) {
          setActive(currentIndex + 1);
        }
      }, autoplayDelay * 1000);
    };

    const stop = () => {
      if (timerId) {
        window.clearInterval(timerId);
        timerId = null;
      }
    };

    if (element.getAttribute("pause-on-hover") === "true") {
      element.addEventListener("mouseenter", () => {
        paused = true;
      });
      element.addEventListener("mouseleave", () => {
        paused = false;
      });
      element.addEventListener(
        "touchstart",
        () => {
          paused = true;
        },
        { passive: true }
      );
      element.addEventListener(
        "touchend",
        () => {
          paused = false;
        },
        { passive: true }
      );
    }

    const prevButton = shadow.querySelector(".previous-button");
    const nextButton = shadow.querySelector(".next-button");

    if (prevButton) {
      prevButton.addEventListener("click", () => {
        setActive(currentIndex - 1);
        start();
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        setActive(currentIndex + 1);
        start();
      });
    }

    document.addEventListener("visibilitychange", () => {
      paused = document.hidden || paused;
    });

    start();
  };

  const initAllSlideshows = () => {
    document.querySelectorAll("gallery-slideshow").forEach(initSlideshow);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAllSlideshows);
  } else {
    initAllSlideshows();
  }
})();
