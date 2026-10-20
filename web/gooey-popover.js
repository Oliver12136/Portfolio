/* Native SVG liquid surfaces. Text stays in the existing DOM above the filter. */
(function () {
  'use strict';
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var active = new Set(), sequence = 0;
  function svgNode(name, attributes) {
    var element = document.createElementNS(SVG_NS, name);
    Object.keys(attributes || {}).forEach(function (key) { element.setAttribute(key, attributes[key]); });
    return element;
  }
  function clamp(value) { return Math.max(0, Math.min(1, value)); }
  function smooth(value) { value = clamp(value); return value * value * (3 - 2 * value); }
  function spring(value) {
    var t = value - 1;
    return 1 + 1.85 * t * t * t + .85 * t * t;
  }
  function create(surface, options) {
    options = options || {};
    var open = !surface.hidden, progress = open ? 1 : 0;
    var frame = 0, layer, blur, blob, seed, sourceHole, geometry, complete;
    var fill = getComputedStyle(surface).backgroundColor;
    var channels = fill.match(/[\d.]+/g);
    var alpha = channels && channels.length > 3 ? Number(channels[3]) : 1;
    if (channels && channels.length >= 3) fill = 'rgb(' + channels.slice(0, 3).join(',') + ')';

    function removeLayer() {
      if (layer) layer.remove();
      layer = blur = blob = seed = sourceHole = null;
      surface.classList.remove('gooey-popover--animating');
      surface.style.removeProperty('--gooey-copy-opacity');
      surface.removeAttribute('data-gooey-progress');
    }
    function finish() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0; progress = open ? 1 : 0;
      removeLayer(); active.delete(controller);
      surface.hidden = !open;
      var callback = complete; complete = null;
      if (callback) callback();
    }
    function measure() {
      var box = surface.getBoundingClientRect();
      var width = surface.offsetWidth, height = surface.offsetHeight;
      var scaleX = box.width / width || 1, scaleY = box.height / height || 1;
      var anchor = options.anchor && options.anchor();
      var rectangular = !!anchor && options.anchorShape === 'rect';
      var radius = anchor ? Math.min(anchor.width / scaleX, anchor.height / scaleY) / 2 : Math.min(16, height / 2);
      var x = anchor ? (anchor.left + anchor.width / 2 - box.left) / scaleX : radius;
      var y = anchor ? (anchor.top + anchor.height / 2 - box.top) / scaleY : height - radius;
      var sourceWidth = rectangular ? anchor.width / scaleX : radius * 2;
      var sourceHeight = rectangular ? anchor.height / scaleY : radius * 2;
      var sourceCorner = rectangular ? (anchor.radius || 0) / scaleX : radius;
      geometry = { width: width, height: height, x: x, y: y, radius: sourceCorner,
        sourceWidth: sourceWidth, sourceHeight: sourceHeight,
        corner: Math.min(parseFloat(getComputedStyle(surface).borderTopLeftRadius) || 0, width / 2, height / 2) };
      var padding = 26;
      var left = Math.min(0, x - sourceWidth / 2) - padding;
      var top = Math.min(0, y - sourceHeight / 2) - padding;
      var right = Math.max(width, x + sourceWidth / 2) + padding;
      var bottom = Math.max(height, y + sourceHeight / 2) + padding;
      left = Math.max(left, -box.left / scaleX); top = Math.max(top, -box.top / scaleY);
      right = Math.min(right, (innerWidth - box.left) / scaleX);
      bottom = Math.min(bottom, (innerHeight - box.top) / scaleY);
      if (!layer) {
        var id = 'portfolio-gooey-' + (++sequence);
        layer = svgNode('svg', { 'class': 'gooey-popover-surface', 'aria-hidden': 'true', focusable: 'false' });
        var defs = svgNode('defs');
        var filter = svgNode('filter', { id: id, filterUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' });
        blur = svgNode('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 6, result: 'soft' });
        filter.appendChild(blur);
        filter.appendChild(svgNode('feColorMatrix', { in: 'soft', type: 'matrix',
          values: '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8.5' }));
        defs.appendChild(filter); layer.appendChild(defs);
        var group = svgNode('g', { filter: 'url(#' + id + ')', fill: fill, opacity: alpha });
        seed = svgNode(rectangular ? 'rect' : 'circle'); blob = svgNode('rect');
        if (rectangular) {
          var mask = svgNode('mask', { id: id + '-source', maskUnits: 'userSpaceOnUse' });
          mask.appendChild(svgNode('rect', { fill: 'white', 'data-gooey-mask-bounds': '' }));
          sourceHole = svgNode('rect', { fill: 'black' });
          mask.appendChild(sourceHole); defs.appendChild(mask);
          group.setAttribute('mask', 'url(#' + id + '-source)');
        }
        group.append(seed, blob); layer.appendChild(group); surface.prepend(layer);
      }
      var layerWidth = right - left, layerHeight = bottom - top;
      layer.setAttribute('viewBox', [left, top, layerWidth, layerHeight].join(' '));
      layer.style.left = left + 'px'; layer.style.top = top + 'px';
      layer.style.width = layerWidth + 'px'; layer.style.height = layerHeight + 'px';
      var filter = layer.querySelector('filter');
      filter.setAttribute('x', left); filter.setAttribute('y', top);
      filter.setAttribute('width', layerWidth); filter.setAttribute('height', layerHeight);
      if (rectangular) {
        [seed, sourceHole].forEach(function (element) {
          element.setAttribute('x', x - sourceWidth / 2); element.setAttribute('y', y - sourceHeight / 2);
          element.setAttribute('width', sourceWidth); element.setAttribute('height', sourceHeight);
          element.setAttribute('rx', sourceCorner);
        });
        var mask = layer.querySelector('mask'), bounds = layer.querySelector('[data-gooey-mask-bounds]');
        [mask, bounds].forEach(function (element) {
          element.setAttribute('x', left); element.setAttribute('y', top);
          element.setAttribute('width', layerWidth); element.setAttribute('height', layerHeight);
        });
      } else {
        seed.setAttribute('cx', x); seed.setAttribute('cy', y); seed.setAttribute('r', radius);
      }
    }
    function paint() {
      var g = geometry, p = Math.max(0, progress), settled = clamp(p);
      var width = Math.max(1, g.sourceWidth + (g.width - g.sourceWidth) * p);
      var height = Math.max(1, g.sourceHeight + (g.height - g.sourceHeight) * p);
      var x = g.x + (g.width / 2 - g.x) * p;
      var y = g.y + (g.height / 2 - g.y) * p;
      blob.setAttribute('x', x - width / 2); blob.setAttribute('y', y - height / 2);
      blob.setAttribute('width', width); blob.setAttribute('height', height);
      var corner = g.corner === 0
        ? Math.min(width, height) / 2 * (1 - smooth((settled - .7) / .3))
        : g.radius + (g.corner - g.radius) * settled;
      blob.setAttribute('rx', corner);
      // Let the liquid neck separate before restoring the exact original surface.
      blur.setAttribute('stdDeviation', (6 * Math.sin(Math.PI * settled)).toFixed(3));
      surface.style.setProperty('--gooey-copy-opacity', smooth((settled - .94) / .06).toFixed(4));
      surface.setAttribute('data-gooey-progress', progress.toFixed(4));
    }
    function setOpen(nextOpen, immediate, callback) {
      if (open === !!nextOpen && !frame && !immediate && surface.hidden === !open) {
        if (callback) callback();
        return;
      }
      if (frame) cancelAnimationFrame(frame);
      frame = 0; complete = callback; open = !!nextOpen;
      surface.inert = !open;
      surface.setAttribute('aria-hidden', String(!open));
      if (immediate || reduced.matches || (options.enabled && !options.enabled()) || (!open && surface.hidden) || Math.abs((open ? 1 : 0) - progress) < .001) { finish(); return; }
      surface.hidden = false;
      measure(); surface.classList.add('gooey-popover--animating');
      active.add(controller); paint();
      var from = progress, target = open ? 1 : 0;
      var duration = Math.max(100, (open ? (options.enterDuration || 420) : (options.exitDuration || 280)) * Math.min(1, Math.abs(target - from)));
      var started = performance.now() + (open && from < .01 ? (options.delay || 0) : 0);
      function drawGooey(now) {
        var time = clamp((now - started) / duration);
        var ease = open ? spring(time) : smooth(time);
        progress = from + (target - from) * ease;
        paint();
        if (time < 1) frame = requestAnimationFrame(drawGooey);
        else finish();
      }
      frame = requestAnimationFrame(drawGooey);
    }
    var controller = { setOpen: setOpen, finish: finish, get isAnimating() { return !!frame; } };
    return controller;
  }
  reduced.addEventListener('change', function () {
    if (reduced.matches) Array.from(active).forEach(function (controller) { controller.finish(); });
  });
  window.addEventListener('resize', function () {
    Array.from(active).forEach(function (controller) { controller.finish(); });
  });
  window.PortfolioGooeyPopover = { create: create };
})();
