import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/loaders/GLTFLoader.js";

const HOST_SELECTOR = ".model-viewer3042-host[data-model-src]";
const MAX_DPR = 1.5;
const THUMB_CACHE_KEY_PREFIX = "model-viewer3042-thumb:";

THREE.Cache.enabled = true;

class ModelViewer3042 {
  constructor(host) {
    this.host = host;
    this.modelSrc = host.getAttribute("data-model-src") || "";
    this.modelSources = this.buildModelSources();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.01, 1000);
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.loader = new GLTFLoader();
    this.loader.setCrossOrigin("anonymous");
    this.modelRoot = null;
    this.resizeObserver = null;
    this.rafId = null;
    this.isActive = false;
    this.placeholderEl = null;
    this.placeholderStatusEl = null;
    this.viewConfig = this.readViewConfig();

    this.onAnimate = this.onAnimate.bind(this);
    this.onResize = this.onResize.bind(this);

    this.initRenderer();
    this.initPlaceholder();
    this.initLights();
    this.initControls();
    this.bindInputGuards();
    this.loadModel();
    this.observeResize();
    this.onResize();
    this.setActive(true);
  }

  readNumberAttr(name, fallback = null) {
    const raw = this.host.getAttribute(name);
    if (raw == null || raw === "") return fallback;
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
  }

  readViewConfig() {
    return {
      azimuthDeg: this.readNumberAttr("data-view-azimuth-deg", null),
      polarDeg: this.readNumberAttr("data-view-polar-deg", null),
      distanceScale: this.readNumberAttr("data-view-distance-scale", 1),
      targetX: this.readNumberAttr("data-view-target-x", 0),
      targetY: this.readNumberAttr("data-view-target-y", 0),
      targetZ: this.readNumberAttr("data-view-target-z", 0)
    };
  }

  initRenderer() {
    const canvas = this.renderer.domElement;
    canvas.className = "model-viewer3042-canvas";
    canvas.setAttribute("aria-hidden", "true");

    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));

    if ("outputColorSpace" in this.renderer) {
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else {
      this.renderer.outputEncoding = THREE.sRGBEncoding;
    }

    this.host.appendChild(canvas);
  }

  getThumbCacheKey() {
    return THUMB_CACHE_KEY_PREFIX + this.modelSrc;
  }

  getPosterHint() {
    const explicitPoster = this.host.getAttribute("data-poster-src");
    if (explicitPoster) return explicitPoster;
    try {
      return window.localStorage.getItem(this.getThumbCacheKey()) || "";
    } catch (error) {
      return "";
    }
  }

  buildModelSources() {
    const sources = [];
    const seen = new Set();
    const add = (value) => {
      if (!value) return;
      const src = String(value).trim();
      if (!src || seen.has(src)) return;
      seen.add(src);
      sources.push(src);
    };

    add(this.modelSrc);

    const fallbackAttr = this.host.getAttribute("data-model-src-fallback");
    if (fallbackAttr) {
      fallbackAttr
        .split(",")
        .map((item) => item.trim())
        .forEach(add);
    }

    // Dev fallback: if remote asset fails in localhost due CORS policy mismatch,
    // transparently retry with local ./assets/<file>.glb.
    try {
      const isLocalDev =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (isLocalDev && this.modelSrc) {
        const parsed = new URL(this.modelSrc, window.location.href);
        const filename = parsed.pathname.split("/").pop();
        if (filename && /\.glb$/i.test(filename)) {
          add(`./assets/${filename}`);
        }
      }
    } catch (error) {
      // Ignore malformed source and rely on primary URL.
    }

    return sources;
  }

  withRetryQuery(url, token) {
    try {
      const u = new URL(url, window.location.href);
      u.searchParams.set("_mvretry", token);
      return u.toString();
    } catch (error) {
      return url + (url.includes("?") ? "&" : "?") + "_mvretry=" + encodeURIComponent(token);
    }
  }

  initPlaceholder() {
    const placeholder = document.createElement("div");
    placeholder.className = "model-viewer3042-placeholder";

    const posterHint = this.getPosterHint();
    if (posterHint) {
      const poster = document.createElement("img");
      poster.className = "model-viewer3042-poster";
      poster.alt = "";
      poster.decoding = "async";
      poster.loading = "eager";
      poster.src = posterHint;
      placeholder.appendChild(poster);
    } else {
      const shimmer = document.createElement("div");
      shimmer.className = "model-viewer3042-shimmer";
      placeholder.appendChild(shimmer);
    }

    const status = document.createElement("div");
    status.className = "model-viewer3042-loading";
    status.textContent = "Loading 3D...";
    placeholder.appendChild(status);

    this.placeholderEl = placeholder;
    this.placeholderStatusEl = status;
    this.host.appendChild(placeholder);
  }

  updatePlaceholderProgress(progressEvent) {
    if (!this.placeholderStatusEl) return;
    if (!progressEvent || !progressEvent.total) {
      this.placeholderStatusEl.textContent = "Loading 3D...";
      return;
    }

    const ratio = progressEvent.loaded / progressEvent.total;
    const percent = Math.max(1, Math.min(99, Math.round(ratio * 100)));
    this.placeholderStatusEl.textContent = "Loading 3D... " + percent + "%";
  }

  hidePlaceholder() {
    if (!this.placeholderEl) return;
    const placeholder = this.placeholderEl;
    placeholder.classList.add("is-hidden");
    window.setTimeout(() => {
      if (placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }
    }, 260);
    this.placeholderEl = null;
    this.placeholderStatusEl = null;
  }

  savePosterSnapshot() {
    try {
      const canvas = this.renderer.domElement;
      const snapshot = canvas.toDataURL("image/webp", 0.82);
      if (snapshot && snapshot.length > 1000) {
        window.localStorage.setItem(this.getThumbCacheKey(), snapshot);
      }
    } catch (error) {
      // Ignore snapshot failures (for example if canvas is tainted).
    }
  }

  initLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 1.15);
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(2.2, 3.6, 2.8);

    this.scene.add(ambient);
    this.scene.add(key);
  }

  initControls() {
    this.controls.enableRotate = true;
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.zoomSpeed = 0.9;
    this.controls.panSpeed = 0.9;

    this.controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    this.controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
    this.controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;

    if (this.controls.touches) {
      this.controls.touches.ONE = THREE.TOUCH.ROTATE;
      this.controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
    }
  }

  bindInputGuards() {
    const canvas = this.renderer.domElement;

    // Keep wheel/touch interactions inside the viewer and prevent page-level wheel handlers from firing.
    canvas.addEventListener(
      "wheel",
      (event) => {
        event.stopPropagation();
      },
      { passive: false, capture: true }
    );

    canvas.addEventListener(
      "touchstart",
      (event) => {
        event.stopPropagation();
      },
      { passive: false, capture: true }
    );

    canvas.addEventListener(
      "touchmove",
      (event) => {
        event.stopPropagation();
      },
      { passive: false, capture: true }
    );
  }

  loadModel() {
    if (!this.modelSources.length) {
      this.showError("Missing model source");
      return;
    }
    this.tryLoadModelSource(0, 0);
  }

  tryLoadModelSource(sourceIndex, retryIndex) {
    const maxRetriesPerSource = 2;
    const source = this.modelSources[sourceIndex];
    if (!source) {
      console.error(
        "[ModelViewer3042] All model sources failed.",
        "\nOrigin:",
        window.location.origin,
        "\nSources:",
        this.modelSources
      );
      this.hidePlaceholder();
      this.showError("Model failed to load");
      return;
    }

    const requestUrl =
      retryIndex > 0
        ? this.withRetryQuery(source, `${sourceIndex}-${retryIndex}-${Date.now()}`)
        : source;

    if (this.placeholderStatusEl && (sourceIndex > 0 || retryIndex > 0)) {
      this.placeholderStatusEl.textContent = `Loading 3D... retry ${retryIndex + 1}`;
    }

    this.loader.load(
      requestUrl,
      (gltf) => {
        this.modelRoot = gltf.scene || gltf.scenes?.[0];
        if (!this.modelRoot) {
          this.showError("Model has no scene root");
          return;
        }

        this.scene.add(this.modelRoot);
        this.centerAndFrameModel(this.modelRoot);
        this.updatePlaceholderProgress({ loaded: 1, total: 1 });
        window.requestAnimationFrame(() => {
          this.renderer.render(this.scene, this.camera);
          this.savePosterSnapshot();
          this.hidePlaceholder();
        });
      },
      (progressEvent) => {
        this.updatePlaceholderProgress(progressEvent);
      },
      (error) => {
        const canRetrySameSource = retryIndex < maxRetriesPerSource;
        if (canRetrySameSource) {
          const delay = 260 * (retryIndex + 1);
          window.setTimeout(() => {
            this.tryLoadModelSource(sourceIndex, retryIndex + 1);
          }, delay);
          return;
        }

        const hasNextSource = sourceIndex + 1 < this.modelSources.length;
        if (hasNextSource) {
          window.setTimeout(() => {
            this.tryLoadModelSource(sourceIndex + 1, 0);
          }, 180);
          return;
        }

        console.error(
          "[ModelViewer3042] Failed to load model source:",
          source,
          "\nOrigin:",
          window.location.origin,
          "\nError:",
          error
        );
        this.hidePlaceholder();
        this.showError("Model failed to load");
      }
    );
  }

  centerAndFrameModel(model) {
    const box = new THREE.Box3().setFromObject(model);
    if (box.isEmpty()) {
      this.showError("Model bounds unavailable");
      return;
    }

    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    model.position.sub(center);

    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    const fitHeightDistance = (size.y * 0.5) / Math.tan(fov * 0.5);
    const fitWidthDistance = (size.x * 0.5) / (Math.tan(fov * 0.5) * this.camera.aspect);

    // Tighter initial framing: model appears only slightly smaller than viewport.
    const framingPadding = 1.08;
    const depthOffset = Math.max(size.z * 0.18, 0.02);
    const baseDistance = Math.max(fitHeightDistance, fitWidthDistance) * framingPadding + depthOffset;
    const distanceScale = Math.max(0.35, this.viewConfig.distanceScale || 1);
    const distance = baseDistance * distanceScale;

    const target = new THREE.Vector3(
      this.viewConfig.targetX || 0,
      this.viewConfig.targetY || 0,
      this.viewConfig.targetZ || 0
    );

    const hasCustomAngles =
      Number.isFinite(this.viewConfig.azimuthDeg) &&
      Number.isFinite(this.viewConfig.polarDeg);

    if (hasCustomAngles) {
      const azimuth = THREE.MathUtils.degToRad(this.viewConfig.azimuthDeg);
      const polar = THREE.MathUtils.clamp(
        THREE.MathUtils.degToRad(this.viewConfig.polarDeg),
        0.02,
        Math.PI - 0.02
      );
      const sinPolar = Math.sin(polar);
      const camPos = new THREE.Vector3(
        target.x + distance * sinPolar * Math.sin(azimuth),
        target.y + distance * Math.cos(polar),
        target.z + distance * sinPolar * Math.cos(azimuth)
      );
      this.camera.position.copy(camPos);
    } else {
      this.camera.position.set(target.x, target.y + size.y * 0.025, target.z + distance);
    }

    this.camera.near = Math.max(0.005, distance / 180);
    this.camera.far = Math.max(500, distance * 30);
    this.camera.updateProjectionMatrix();

    this.controls.target.copy(target);
    this.controls.saveState();
    this.controls.update();
  }

  observeResize() {
    this.resizeObserver = new ResizeObserver(this.onResize);
    this.resizeObserver.observe(this.host);

    window.addEventListener("resize", this.onResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", this.onResize);
    }
  }

  onResize() {
    const rect = this.host.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    this.renderer.setSize(width, height, false);
  }

  startRenderLoop() {
    if (this.rafId) return;
    this.rafId = window.requestAnimationFrame(this.onAnimate);
  }

  stopRenderLoop() {
    if (!this.rafId) return;
    window.cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  setActive(active) {
    const nextActive = Boolean(active);
    if (this.isActive === nextActive) return;
    this.isActive = nextActive;
    this.controls.enabled = nextActive;

    if (nextActive) {
      this.onResize();
      this.startRenderLoop();
      return;
    }

    this.stopRenderLoop();
  }

  onAnimate() {
    if (!this.isActive) {
      this.rafId = null;
      return;
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.rafId = window.requestAnimationFrame(this.onAnimate);
  }

  showError(message) {
    if (this.host.querySelector(".model-viewer3042-error")) return;

    const fallback = document.createElement("div");
    fallback.className = "model-viewer3042-error";
    fallback.textContent = message;
    this.host.appendChild(fallback);
  }

  dispose() {
    this.stopRenderLoop();

    this.controls.dispose();
    this.renderer.dispose();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    window.removeEventListener("resize", this.onResize);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener("resize", this.onResize);
    }
  }
}

let viewerInstances = [];
let initialized = false;

function findViewerByHost(host) {
  if (!host) return null;
  for (let i = 0; i < viewerInstances.length; i += 1) {
    if (viewerInstances[i].host === host) return viewerInstances[i];
  }
  return null;
}

function hostIsVisible(host) {
  if (!host || typeof host.getBoundingClientRect !== "function") return false;
  const rect = host.getBoundingClientRect();
  if (!rect.width || !rect.height) return false;
  return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
}

function initHost(host) {
  if (!host || !host.matches || !host.matches(HOST_SELECTOR)) return null;
  const existing = findViewerByHost(host);
  if (existing) return existing;

  const viewer = new ModelViewer3042(host);
  viewerInstances.push(viewer);
  initialized = true;
  return viewer;
}

function initOnce() {
  const hosts = Array.from(document.querySelectorAll(HOST_SELECTOR));
  if (!hosts.length) {
    initialized = true;
    return viewerInstances;
  }

  hosts.forEach((host) => {
    initHost(host);
  });
  initialized = true;
  return viewerInstances;
}

function pauseAll() {
  viewerInstances.forEach((viewer) => viewer.setActive(false));
}

function resumeVisible() {
  viewerInstances.forEach((viewer) => {
    viewer.setActive(hostIsVisible(viewer.host));
  });
}

function setHostActive(host, active) {
  const viewer = findViewerByHost(host);
  if (!viewer) return false;
  viewer.setActive(active);
  return true;
}

function disposeAll() {
  viewerInstances.forEach((viewer) => viewer.dispose());
  viewerInstances = [];
  initialized = false;
}

const modelViewer3042Manager = {
  initHost,
  initOnce,
  pauseAll,
  resumeVisible,
  setHostActive,
  disposeAll,
  get initialized() {
    return initialized;
  }
};

window.modelViewer3042Manager = modelViewer3042Manager;

export { modelViewer3042Manager };
