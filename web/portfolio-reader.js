(function () {
  "use strict";

  // A center-hinged half-sheet. This canvas exists only during a turn;
  // reading and zooming always use the original DOM image and its existing tiers.
  function createPageCurl(stage) {
    var canvas = document.createElement("canvas");
    canvas.className = "portfolio-reader-turn-canvas";
    canvas.setAttribute("aria-hidden", "true");
    var gl;
    try { gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false }); }
    catch (error) { return null; }
    if (!gl) return null;
    var vertexSource = [
      "attribute vec2 aPoint;",
      "uniform vec2 uStage; uniform vec4 uPage; uniform float uProgress; uniform float uDirection;",
      "varying vec2 vUV; varying vec2 vBackUV; varying float vAngle; varying float vCurve;",
      "void main() {",
      " float t = uProgress; float eased = t*t*(3.0-2.0*t);",
      " float hinge = 3.14159265 * eased;",
      " float curl = min(1.1 * sin(3.14159265*t), 3.14159265-hinge);",
      " float twist = 0.16 * sin(3.14159265*t) * (aPoint.y-0.5);",
      " float angle = hinge + twist; float bend = max(0.0001, curl);",
      " float endAngle = angle + bend*aPoint.x;",
      " float arcX = (sin(endAngle)-sin(angle))/bend;",
      " float arcZ = (cos(endAngle)-cos(angle))/bend;",
      " float z = arcZ*uPage.z;",
      " float perspective = 1.0/(1.0-z/(uPage.z*2.8));",
      " float spine = uPage.x;",
      " float x = spine + uDirection*arcX*uPage.z*perspective;",
      " float y = uPage.y + uPage.w*0.5 + (aPoint.y-0.5)*uPage.w*perspective;",
      " gl_Position = vec4(x/uStage.x*2.0-1.0, 1.0-y/uStage.y*2.0, clamp(-z/(uPage.z*3.0),-0.9,0.9), 1.0);",
      " vUV = vec2(0.5+uDirection*0.5*aPoint.x, 1.0-aPoint.y);",
      " vBackUV = vec2(0.5-uDirection*0.5*aPoint.x, 1.0-aPoint.y);",
      " vAngle = endAngle; vCurve = curl;",
      "}"
    ].join("\n");
    var fragmentSource = [
      "precision mediump float; uniform sampler2D uTexture; uniform sampler2D uBackTexture;",
      "uniform float uHasBack; uniform vec2 uBackScale;",
      "varying vec2 vUV; varying vec2 vBackUV; varying float vAngle; varying float vCurve;",
      "void main() {",
      " vec4 print = texture2D(uTexture, vUV);",
      " float normal = cos(vAngle);",
      " float light = 0.75 + 0.25*abs(normal);",
      " float crease = 1.0-0.14*pow(1.0-abs(normal),3.0)*min(vCurve,1.0);",
      " vec2 backUV = (vBackUV-0.5)*uBackScale+0.5;",
      " vec4 back = texture2D(uBackTexture,clamp(backUV,0.0,1.0));",
      " if (backUV.x<0.0 || backUV.x>1.0 || backUV.y<0.0 || backUV.y>1.0) back=vec4(1.0);",
      " vec3 reverse = uHasBack>0.5 ? back.rgb : mix(vec3(0.985,0.982,0.972),print.rgb,0.045);",
      " vec3 paper = normal>=0.0 ? print.rgb : reverse;",
      " float sheen = 0.045*pow(max(0.0,sin(vAngle)),10.0);",
      " gl_FragColor = vec4(paper*light*crease+sheen, print.a);",
      "}"
    ].join("\n");
    function shader(type, source) {
      var result = gl.createShader(type);
      gl.shaderSource(result, source); gl.compileShader(result);
      if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) { gl.deleteShader(result); return null; }
      return result;
    }
    var vertex = shader(gl.VERTEX_SHADER, vertexSource), fragment = shader(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertex || !fragment) return null;
    var program = gl.createProgram();
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    var points = [], columns = 64, rows = 12;
    for (var y = 0; y < rows; y += 1) {
      for (var x = 0; x < columns; x += 1) {
        var x0 = x / columns, x1 = (x + 1) / columns, y0 = y / rows, y1 = (y + 1) / rows;
        points.push(x0,y0, x1,y0, x0,y1, x0,y1, x1,y0, x1,y1);
      }
    }
    var buffer = gl.createBuffer(), texture = gl.createTexture(), backTexture = gl.createTexture();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
    gl.useProgram(program);
    var attribute = gl.getAttribLocation(program, "aPoint");
    gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
    [texture, backTexture].forEach(function (item, unit) {
      gl.activeTexture(gl.TEXTURE0+unit);
      gl.bindTexture(gl.TEXTURE_2D, item);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    });
    gl.uniform1i(gl.getUniformLocation(program, "uTexture"), 0);
    gl.uniform1i(gl.getUniformLocation(program, "uBackTexture"), 1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    var uniformStage = gl.getUniformLocation(program, "uStage"), uniformPage = gl.getUniformLocation(program, "uPage");
    var uniformProgress = gl.getUniformLocation(program, "uProgress"), uniformDirection = gl.getUniformLocation(program, "uDirection");
    var uniformHasBack = gl.getUniformLocation(program, "uHasBack"), uniformBackScale = gl.getUniformLocation(program, "uBackScale");
    var raf = 0, active = false;
    function cancel() {
      active = false;
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
      canvas.remove();
    }
    return {
      turn: function (img, nextImg, direction, box, done) {
        cancel();
        if (!img.complete || !img.naturalWidth || gl.isContextLost()) return null;
        try {
          var hasBack = nextImg.complete && nextImg.naturalWidth > 0;
          [img, hasBack ? nextImg : img].forEach(function (source, unit) {
            var input = source, maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE);
            if (source.naturalWidth > maxTexture || source.naturalHeight > maxTexture) {
              input = document.createElement("canvas");
              var factor = Math.min(maxTexture / source.naturalWidth, maxTexture / source.naturalHeight);
              input.width = Math.floor(source.naturalWidth * factor); input.height = Math.floor(source.naturalHeight * factor);
              input.getContext("2d").drawImage(source, 0, 0, input.width, input.height);
            }
            gl.activeTexture(gl.TEXTURE0+unit);
            gl.bindTexture(gl.TEXTURE_2D, unit ? backTexture : texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, input);
          });
          gl.uniform1f(uniformHasBack, hasBack ? 1 : 0);
          gl.uniform2f(uniformBackScale, box.pageWidth/box.targetWidth, box.pageHeight/box.targetHeight);
        } catch (error) { return null; }
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(box.width * dpr); canvas.height = Math.round(box.height * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uniformStage, box.width, box.height);
        gl.uniform4f(uniformPage, box.width/2, (box.height-box.pageHeight)/2, box.pageWidth/2, box.pageHeight);
        gl.uniform1f(uniformDirection, direction);
        stage.appendChild(canvas);
        canvas.dataset.hinge = "center";
        canvas.dataset.direction = direction > 0 ? "right-to-left" : "left-to-right";
        active = true;
        var start = performance.now(), duration = 720;
        function draw(now) {
          if (!active) return;
          var progress = Math.min(1, (now-start)/duration);
          canvas.dataset.progress = progress.toFixed(3);
          canvas.style.filter = "drop-shadow(" + (direction*14) + "px 4px " + (10+14*Math.sin(progress*Math.PI)) + "px rgba(0,0,0," + (0.22*Math.sin(progress*Math.PI)) + "))";
          gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          gl.uniform1f(uniformProgress, progress);
          gl.drawArrays(gl.TRIANGLES, 0, points.length/2);
          if (progress < 1) raf = window.requestAnimationFrame(draw);
          else { cancel(); done(); }
        }
        draw(start);
        return { cancel: cancel };
      },
      dispose: function () {
        cancel(); gl.deleteTexture(texture); gl.deleteTexture(backTexture); gl.deleteBuffer(buffer); gl.deleteProgram(program);
        var lose = gl.getExtension("WEBGL_lose_context");
        if (lose) lose.loseContext();
      }
    };
  }

  function createCenterFoldFallback(stage, oldImg, nextImg, direction, box, done) {
    var leaf = document.createElement("div");
    leaf.className = "portfolio-reader-turn-fallback";
    leaf.setAttribute("aria-hidden", "true");
    leaf.style.left = (direction > 0 ? box.width/2 : (box.width-box.pageWidth)/2) + "px";
    leaf.style.top = (box.height-box.pageHeight)/2 + "px";
    leaf.style.width = box.pageWidth/2 + "px";
    leaf.style.height = box.pageHeight + "px";
    leaf.style.transformOrigin = direction > 0 ? "left center" : "right center";
    [oldImg, nextImg].forEach(function (image, side) {
      var face = document.createElement("div");
      face.className = "portfolio-reader-turn-face";
      if (image.complete && image.naturalWidth) face.style.backgroundImage = "url(" + JSON.stringify(image.currentSrc || image.src) + ")";
      face.style.backgroundSize = (side ? box.targetWidth : box.pageWidth) + "px " + (side ? box.targetHeight : box.pageHeight) + "px";
      face.style.backgroundPosition = (direction > 0) !== !!side ? "right center" : "left center";
      if (side) face.style.transform = "rotateY(180deg)";
      leaf.appendChild(face);
    });
    stage.appendChild(leaf);
    var animation = leaf.animate([
      { transform: "perspective(1800px) rotateY(0deg)" },
      { transform: "perspective(1800px) rotateY(" + (-direction*180) + "deg)" }
    ], { duration: 720, easing: "cubic-bezier(.3,.1,.2,1)", fill: "both" });
    animation.onfinish = done;
    return { cancel: function () { animation.cancel(); leaf.remove(); } };
  }

  // Only the legacy gallery renderer mounts this reader. Sources and their
  // display → viewer → detail tiers come from the existing gallery cards.
  function mount(root, cards, options) {
    options = options || {};
    var disposed = false, index = 0, scale = 1, tx = 0, ty = 0;
    var frame = 0, animations = [], listeners = [], pointers = new Map(), curlRenderer = null;
    var gesture = null, pinch = null, pages = [];
    var fullscreenWasActive = false, scrollBeforeFullscreen = 0;
    var safariGestureActive = false, safariGestureScale = 1;
    var width = 0, height = 0, baseWidth = 0, baseHeight = 0;
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var clamp = function (value, min, max) { return Math.max(min, Math.min(max, value)); };
    function node(tag, className) {
      var element = document.createElement(tag);
      element.className = className;
      return element;
    }
    function on(element, name, fn, config) {
      element.addEventListener(name, fn, config);
      listeners.push(function () { element.removeEventListener(name, fn, config); });
    }
    root.setAttribute("role", "region");
    root.setAttribute("aria-label", (options.title || "Portfolio") + " image reader");
    var stage = node("div", "portfolio-reader-stage");
    var viewport = node("div", "portfolio-reader-viewport");
    viewport.appendChild(stage);
    stage.tabIndex = 0;
    stage.setAttribute("role", "group");
    stage.setAttribute("aria-label", "Publication canvas. Use arrow keys to turn pages, plus or minus to zoom, and 0 to fit.");
    var controls = node("div", "portfolio-reader-controls");
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", "Publication controls");
    function button(label, text, action, className) {
      var element = node("button", "portfolio-reader-button " + (className || ""));
      element.type = "button";
      element.textContent = text;
      element.setAttribute("aria-label", label);
      element.title = label;
      on(element, "click", action);
      return element;
    }
    var previous = button("Previous page", "", function () { turn(-1); }, "portfolio-reader-previous");
    var next = button("Next page", "", function () { turn(1); }, "portfolio-reader-next");
    var counter = node("span", "portfolio-reader-counter");
    counter.setAttribute("role", "status");
    counter.setAttribute("aria-live", "polite");
    counter.setAttribute("aria-atomic", "true");
    var topic = node("span", "portfolio-reader-topic");
    var pagination = node("div", "portfolio-reader-pagination");
    pagination.append(counter, topic);
    viewport.append(previous, next);
    var zoomOut = button("Zoom out", "−", function () { zoomAtCenter(scale / 1.5); });
    var zoomIn = button("Zoom in", "+", function () { zoomAtCenter(scale * 1.5); });
    var zoomLabel = node("span", "portfolio-reader-zoom-label");
    var fitButton = button("Fit to screen", "Fit", fit);
    var slider = node("input", "portfolio-reader-zoom-slider");
    slider.type = "range";
    slider.min = "100"; slider.max = "600"; slider.step = "1"; slider.value = "100";
    slider.setAttribute("aria-label", "Zoom level");
    on(slider, "input", function () { zoomAtCenter(Number(slider.value) / 100); });
    var zoomControls = node("div", "portfolio-reader-zoom-controls");
    zoomControls.append(zoomOut, slider, zoomIn, zoomLabel, fitButton);
    var fullscreenButton = button("Enter fullscreen", "", toggleFullscreen, "portfolio-reader-fullscreen");
    fullscreenButton.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true"><path class="portfolio-reader-fullscreen-enter" d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><path class="portfolio-reader-fullscreen-exit" d="M3 8h5V3m8 0v5h5M8 21v-5H3m18 0h-5v5"/></svg>';
    fullscreenButton.setAttribute("aria-pressed", "false");
    controls.append(pagination, zoomControls, fullscreenButton);
    root.replaceChildren(viewport, controls);
    var shell = root.closest("#map-project-inline-shell");
    function isFullscreen() { return document.fullscreenElement === root || document.webkitFullscreenElement === root || root.classList.contains("is-expanded"); }
    function syncFullscreen() {
      var active = isFullscreen();
      var exited = fullscreenWasActive && !active;
      fullscreenWasActive = active;
      fullscreenButton.setAttribute("aria-label", active ? "Exit fullscreen" : "Enter fullscreen");
      fullscreenButton.title = active ? "Exit fullscreen" : "Enter fullscreen";
      fullscreenButton.setAttribute("aria-pressed", String(active));
      settle(); layout();
      if (exited && options.scrollport) {
        options.scrollport.scrollTop = scrollBeforeFullscreen;
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            if (disposed || isFullscreen()) return;
            layout(); options.scrollport.scrollTop = scrollBeforeFullscreen; reveal();
          });
        });
      }
    }
    function expandInline() {
      root.classList.toggle("is-expanded");
      if (shell) shell.classList.toggle("has-expanded-reader", root.classList.contains("is-expanded"));
      syncFullscreen();
    }
    function toggleFullscreen() {
      if (document.fullscreenElement === root) { document.exitFullscreen().catch(function () {}); return; }
      if (document.webkitFullscreenElement === root) { document.webkitExitFullscreen(); return; }
      if (root.classList.contains("is-expanded")) { expandInline(); return; }
      scrollBeforeFullscreen = options.scrollport ? options.scrollport.scrollTop : 0;
      var request = root.requestFullscreen || root.webkitRequestFullscreen;
      if (!request) { expandInline(); return; }
      try {
        var result = request.call(root);
        if (result && result.catch) result.catch(function () { if (!disposed) expandInline(); });
      } catch (error) { expandInline(); }
    }
    on(document, "fullscreenchange", syncFullscreen);
    on(document, "webkitfullscreenchange", syncFullscreen);

    cards.filter(function (card) { return !!card.src; }).forEach(function (card, pageIndex) {
      var figure = node("figure", "portfolio-reader-page");
      figure.hidden = pageIndex !== 0;
      figure.setAttribute("aria-hidden", pageIndex === 0 ? "false" : "true");
      figure.setAttribute("aria-label", "Page " + (pageIndex + 1));
      var sheet = node("div", "portfolio-reader-sheet");
      sheet.setAttribute("data-brand-image-host", "");
      var img = node("img", "portfolio-reader-image is-lazy-pending");
      img.alt = card.alt || (options.title || "Portfolio") + " — page " + (pageIndex + 1);
      img.draggable = false;
      img.decoding = "async";
      // The existing bounded lazy-load queue still owns the display sources.
      img.dataset.src = card.displaySrc || card.src;
      img.dataset.lazySrc = img.dataset.src;
      img.loading = "eager"; // No src is assigned until this page enters the runway.
      img.fetchPriority = pageIndex === 0 ? "high" : "low";
      if (card.width && card.height) { img.width = card.width; img.height = card.height; }
      sheet.appendChild(img);
      figure.appendChild(sheet);
      stage.appendChild(figure);
      var page = { card: card, figure: figure, sheet: sheet, img: img, ratio: card.width / card.height || 1, loaded: false, tier: 0, pending: null, failed: {} };
      pages.push(page);
      on(img, "load", function () {
        if (disposed || !img.naturalWidth) return;
        page.loaded = true;
        page.ratio = img.naturalWidth / img.naturalHeight;
        img.classList.remove("is-lazy-pending");
        if (pageIndex === index) { layout(); upgrade(); }
      });
      on(img, "error", function () {
        // Preserve the original source as a fallback; no replacement asset is generated.
        if (img.getAttribute("src") !== card.src) img.src = card.src;
      });
    });
    if (!pages.length) { root.hidden = true; return function () {}; }

    function loadPage(pageIndex) {
      var page = pages[pageIndex];
      if (!page || page.img.hasAttribute("src")) return;
      if (options.loadImage) options.loadImage(page.img);
      else page.img.src = page.img.dataset.src;
    }
    function runway() {
      loadPage(index);
      loadPage(index + 1);
      loadPage(index - 1);
    }

    function upgrade() {
      var page = pages[index];
      if (!page || !page.loaded || page.pending || disposed) return;
      var sources = [page.card.displaySrc || page.card.src, page.card.viewerSrc || page.card.src, page.card.detailSrc];
      var nextTier = page.tier + 1, src = sources[nextTier];
      var requestedPixels = baseWidth * scale * Math.min(window.devicePixelRatio || 1, 3);
      if (!src || src === page.img.getAttribute("src") || page.failed[src] || requestedPixels <= page.img.naturalWidth * 0.9) return;
      var image = new Image();
      page.pending = image;
      image.decoding = "async";
      image.fetchPriority = "high";
      image.onload = function () {
        var ready = image.decode ? image.decode().catch(function () {}) : Promise.resolve();
        ready.then(function () {
          if (disposed || page.pending !== image) return;
          page.pending = null;
          if (pages[index] !== page) return;
          page.tier = nextTier;
          page.img.src = src;
        });
      };
      image.onerror = function () { page.failed[src] = true; page.pending = null; };
      image.src = src;
    }

    function transform() {
      frame = 0;
      if (disposed) return;
      var maxX = Math.max(0, (baseWidth * scale - width) / 2);
      var maxY = Math.max(0, (baseHeight * scale - height) / 2);
      tx = clamp(tx, -maxX, maxX);
      ty = clamp(ty, -maxY, maxY);
      pages[index].sheet.style.transform = "translate3d(" + tx + "px," + ty + "px,0) scale(" + scale + ")";
      root.classList.toggle("is-zoomed", scale > 1.001);
      root.dataset.page = String(index + 1);
      root.dataset.zoom = scale.toFixed(3);
      zoomLabel.textContent = Math.round(scale * 100) + "%";
      slider.value = String(Math.round(scale * 100));
      slider.setAttribute("aria-valuetext", Math.round(scale * 100) + " percent");
      zoomOut.disabled = scale <= 1.001;
      zoomIn.disabled = scale >= 6;
      if ((zoomOut.disabled && document.activeElement === zoomOut) || (zoomIn.disabled && document.activeElement === zoomIn)) stage.focus({ preventScroll: true });
    }
    function scheduleTransform() {
      if (!frame) frame = window.requestAnimationFrame(transform);
    }
    function layout() {
      if (disposed) return;
      // Use the outer page margins for arrows before reducing the image width.
      var expanded = isFullscreen();
      var readerRect = root.getBoundingClientRect();
      var bounds = options.scrollport ? options.scrollport.getBoundingClientRect() : { left: 0, right: window.innerWidth };
      var arrowWidth = parseFloat(window.getComputedStyle(root).getPropertyValue("--reader-arrow-width")) || 44;
      var outset = expanded ? 0 : Math.max(0, Math.min(arrowWidth, readerRect.left - bounds.left - 4, bounds.right - readerRect.right - 4));
      root.style.setProperty("--reader-arrow-outset", outset + "px");
      // Reserve the whole project's tallest source, so page turns don't move
      // the controls. Fit the active image independently inside that canvas.
      var minRatio = Math.min.apply(null, pages.map(function (page) { return page.ratio; }));
      stage.style.aspectRatio = String(minRatio);
      var scrollHeight = options.scrollport ? options.scrollport.clientHeight : window.innerHeight;
      var topbar = root.closest(".map-project-inline-content");
      topbar = topbar && topbar.querySelector(".map-project-detail-topbar");
      var headerHeight = topbar ? topbar.getBoundingClientRect().height : 0;
      root.style.scrollMarginTop = headerHeight + "px";
      var controlsGap = parseFloat(window.getComputedStyle(controls).marginTop) || 0;
      stage.style.maxHeight = Math.max(80, scrollHeight - headerHeight - controls.offsetHeight - controlsGap) + "px";
      if (expanded) {
        stage.style.maxHeight = "none";
        viewport.style.height = "";
      } else {
        viewport.style.height = Math.max(80, Math.min(stage.clientWidth / minRatio, scrollHeight - headerHeight - controls.offsetHeight - controlsGap)) + "px";
      }
      width = stage.clientWidth;
      height = stage.clientHeight;
      var ratio = pages[index].ratio;
      baseWidth = Math.min(width, height * ratio);
      baseHeight = baseWidth / ratio;
      pages[index].sheet.style.width = baseWidth + "px";
      pages[index].sheet.style.height = baseHeight + "px";
      transform();
      upgrade();
    }
    function fit() {
      scale = 1; tx = 0; ty = 0;
      transform();
      reveal();
    }
    function reveal() {
      if (!options.scrollport || disposed || isFullscreen()) return;
      var topbar = options.scrollport.querySelector(".map-project-detail-topbar");
      var top = topbar ? topbar.getBoundingClientRect().bottom : options.scrollport.getBoundingClientRect().top;
      var rect = root.getBoundingClientRect();
      var bottom = options.scrollport.getBoundingClientRect().bottom;
      if (rect.top < top - 1 || rect.bottom > bottom + 1) options.scrollport.scrollTop += rect.top - top;
    }
    function zoomAt(x, y, nextScale) {
      if (root.classList.contains("is-turning")) settle();
      var rect = stage.getBoundingClientRect();
      var ox = x - rect.left - width / 2, oy = y - rect.top - height / 2;
      nextScale = clamp(nextScale, 1, 6);
      tx = ox - (ox - tx) * nextScale / scale;
      ty = oy - (oy - ty) * nextScale / scale;
      scale = nextScale;
      scheduleTransform();
      upgrade();
    }
    function zoomAtCenter(nextScale) {
      var rect = stage.getBoundingClientRect();
      zoomAt(rect.left + width / 2, rect.top + height / 2, nextScale);
    }
    function settle() {
      animations.forEach(function (animation) { animation.cancel(); });
      animations = [];
      root.classList.remove("is-turning");
      pages.forEach(function (page, pageIndex) {
        page.figure.hidden = pageIndex !== index;
        page.figure.style.zIndex = "";
        page.figure.style.transformOrigin = "";
        page.figure.style.clipPath = "";
      });
    }
    function turn(direction) {
      var nextIndex = clamp(index + direction, 0, pages.length - 1);
      if (nextIndex === index || disposed) return;
      direction = direction > 0 ? 1 : -1;
      settle();
      var oldPage = pages[index];
      var oldWidth = baseWidth, oldHeight = baseHeight;
      index = nextIndex;
      var newPage = pages[index];
      oldPage.figure.setAttribute("aria-hidden", "true");
      newPage.figure.hidden = false;
      newPage.figure.setAttribute("aria-hidden", "false");
      scale = 1; tx = 0; ty = 0;
      runway();
      layout();
      syncPagination();
      reveal();
      if (!reducedMotion.matches && oldPage.loaded) {
        if (!curlRenderer) curlRenderer = createPageCurl(stage);
        // One original image is still one reader page. Only the moving half is
        // rendered separately while the other half stays below the turning leaf.
        oldPage.figure.hidden = false;
        oldPage.figure.style.zIndex = "2";
        oldPage.figure.style.clipPath = direction > 0 ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)";
        oldPage.sheet.style.transform = "none";
        root.classList.add("is-turning");
        var box = { width: width, height: height, pageWidth: oldWidth, pageHeight: oldHeight, targetWidth: baseWidth, targetHeight: baseHeight };
        var curl = curlRenderer && curlRenderer.turn(oldPage.img, newPage.img, direction, box, settle);
        if (curl) animations = [curl];
        else if (oldPage.figure.animate) {
          animations = [createCenterFoldFallback(stage, oldPage.img, newPage.img, direction, box, settle)];
        } else settle();
      } else settle();
    }
    function syncPagination() {
      previous.disabled = index === 0;
      next.disabled = index === pages.length - 1;
      if ((previous.disabled && document.activeElement === previous) || (next.disabled && document.activeElement === next)) stage.focus({ preventScroll: true });
      counter.textContent = (index + 1) + " / " + pages.length;
      counter.setAttribute("aria-label", "Page " + (index + 1) + " of " + pages.length);
      topic.textContent = pages[index].card.topic || pages[index].card.alt || options.title || "Portfolio";
      topic.title = topic.textContent;
    }

    on(root, "keydown", function (event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      var key = event.key;
      if (event.target === slider && key !== "Escape") { event.stopPropagation(); return; }
      if (key === "Escape" && isFullscreen()) {
        event.preventDefault(); event.stopPropagation(); toggleFullscreen(); return;
      }
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "0", "Home", "End"].indexOf(key) === -1 && !(key === "Escape" && scale > 1)) return;
      event.preventDefault(); event.stopPropagation();
      if (key === "+" || key === "=") zoomAtCenter(scale * 1.5);
      else if (key === "-") zoomAtCenter(scale / 1.5);
      else if (key === "0" || key === "Escape") fit();
      else if (key === "Home") turn(-pages.length);
      else if (key === "End") turn(pages.length);
      else if (scale > 1) {
        if (key === "ArrowLeft") tx += width * 0.15;
        if (key === "ArrowRight") tx -= width * 0.15;
        if (key === "ArrowUp") ty += height * 0.15;
        if (key === "ArrowDown") ty -= height * 0.15;
        scheduleTransform();
      } else if (key === "ArrowLeft" || key === "ArrowRight") turn(key === "ArrowRight" ? 1 : -1);
    });
    // At Fit, ordinary trackpad scrolling belongs to the detail page. Keep it
    // out of project navigation; capture only pinch and zoomed reader panning.
    on(root, "wheel", function (event) {
      event.stopPropagation();
      if (!event.ctrlKey && scale <= 1.001) return;
      event.preventDefault();
      var unit = event.deltaMode === 1 ? 16 : (event.deltaMode === 2 ? height : 1);
      if (event.ctrlKey) {
        if (!safariGestureActive) zoomAt(event.clientX, event.clientY, scale * Math.exp(-event.deltaY * unit * 0.01));
      } else {
        if (root.classList.contains("is-turning")) settle();
        tx -= event.deltaX * unit; ty -= event.deltaY * unit; scheduleTransform();
      }
    }, { passive: false });
    // Safari on macOS also exposes trackpad pinches as cumulative GestureEvents.
    function stopGesture(event) { event.preventDefault(); event.stopPropagation(); }
    on(root, "gesturestart", function (event) {
      stopGesture(event); safariGestureActive = true; safariGestureScale = scale;
      settle();
    }, { passive: false });
    on(root, "gesturechange", function (event) {
      stopGesture(event);
      if (!safariGestureActive || pointers.size >= 2) return;
      var rect = stage.getBoundingClientRect();
      var x = event.clientX >= rect.left && event.clientX <= rect.right ? event.clientX : rect.left + width/2;
      var y = event.clientY >= rect.top && event.clientY <= rect.bottom ? event.clientY : rect.top + height/2;
      zoomAt(x, y, safariGestureScale * (event.scale || 1));
    }, { passive: false });
    on(root, "gestureend", function (event) {
      stopGesture(event); safariGestureActive = false;
    }, { passive: false });
    on(stage, "dblclick", function (event) {
      event.preventDefault();
      if (scale > 1) fit(); else zoomAt(event.clientX, event.clientY, 2);
    });
    function beginPinch() {
      var points = Array.from(pointers.values()), a = points[0], b = points[1];
      var rect = stage.getBoundingClientRect();
      pinch = { distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), scale: scale,
        worldX: ((a.x + b.x) / 2 - rect.left - width / 2 - tx) / scale,
        worldY: ((a.y + b.y) / 2 - rect.top - height / 2 - ty) / scale };
      if (gesture) gesture.swipe = false;
    }
    on(stage, "pointerdown", function (event) {
      event.stopPropagation();
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      stage.focus({ preventScroll: true });
      settle();
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      stage.setPointerCapture(event.pointerId);
      if (pointers.size === 1) {
        gesture = { x: event.clientX, y: event.clientY, tx: tx, ty: ty, swipe: scale <= 1.001, type: event.pointerType };
      } else beginPinch();
      root.classList.add("is-dragging");
    });
    on(stage, "pointermove", function (event) {
      if (!pointers.has(event.pointerId)) return;
      event.preventDefault(); event.stopPropagation();
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size >= 2 && pinch) {
        var points = Array.from(pointers.values()), a = points[0], b = points[1];
        var rect = stage.getBoundingClientRect();
        scale = clamp(pinch.scale * Math.hypot(a.x - b.x, a.y - b.y) / pinch.distance, 1, 6);
        tx = (a.x + b.x) / 2 - rect.left - width / 2 - pinch.worldX * scale;
        ty = (a.y + b.y) / 2 - rect.top - height / 2 - pinch.worldY * scale;
        upgrade();
      } else if (gesture && !gesture.swipe) {
        tx = gesture.tx + event.clientX - gesture.x;
        ty = gesture.ty + event.clientY - gesture.y;
      }
      scheduleTransform();
    });
    function endPointer(event) {
      if (!pointers.has(event.pointerId)) return;
      event.stopPropagation();
      pointers.delete(event.pointerId);
      if (pointers.size) {
        var point = Array.from(pointers.values())[0];
        gesture = { x: point.x, y: point.y, tx: tx, ty: ty, swipe: false };
        pinch = null;
        return;
      }
      if (gesture && gesture.swipe && scale <= 1.001 && event.type === "pointerup") {
        var dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
        if (Math.abs(dx) > Math.max(40, width * 0.07) && Math.abs(dx) > Math.abs(dy) * 1.4) turn(dx < 0 ? 1 : -1);
        // Vertical gestures still let visitors leave the reader in its scrollport.
        else if (gesture.type !== "mouse" && options.scrollport && Math.abs(dy) > Math.abs(dx)) options.scrollport.scrollTop -= dy;
      }
      gesture = null; pinch = null;
      root.classList.remove("is-dragging");
    }
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (name) { on(stage, name, endPointer); });
    on(stage, "dragstart", function (event) { event.preventDefault(); });
    on(root, "focusin", function (event) { if (event.target === stage) reveal(); });
    var resize = new ResizeObserver(function () {
      if (Math.abs(stage.clientWidth-width)>0.5 || Math.abs(stage.clientHeight-height)>0.5) settle();
      layout();
    });
    resize.observe(root);
    resize.observe(controls);
    if (options.scrollport) resize.observe(options.scrollport);
    var header = root.closest(".map-project-inline-content");
    if (header) resize.observe(header.querySelector(".map-project-detail-topbar"));
    on(window, "resize", layout);
    syncPagination();
    runway();
    layout();
    return function dispose() {
      disposed = true;
      if (document.fullscreenElement === root) document.exitFullscreen().catch(function () {});
      if (document.webkitFullscreenElement === root) document.webkitExitFullscreen();
      if (shell) shell.classList.remove("has-expanded-reader");
      root.classList.remove("is-expanded");
      resize.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      settle();
      if (curlRenderer) curlRenderer.dispose();
      listeners.forEach(function (remove) { remove(); });
      pointers.clear();
      pages.forEach(function (page) {
        if (page.pending) { page.pending.onload = null; page.pending.onerror = null; page.pending.removeAttribute("src"); }
      });
    };
  }
  window.PortfolioReader = { mount: mount };
})();
