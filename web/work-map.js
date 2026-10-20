/* Explicit map guide, with Figma's desktop tooltip and a mobile dialog. */
(function () {
  function initWorkMap() {
    var canvas = document.querySelector('#homepage---right .practice3042-canvas');
    var viewport = document.querySelector('#homepage---right .mypractice-map-viewport');
    var help = document.querySelector('.work-map-help');
    if (!canvas || !viewport || !help) return;
    var button = help.querySelector('.work-map-help-button');
    var panel = help.querySelector('.work-map-help-panel');
    var close = help.querySelector('.work-map-help-close');
    var mobile = window.matchMedia('(max-width: 767px)');
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var liquid = window.PortfolioGooeyPopover && window.PortfolioGooeyPopover.create(panel, {
      anchor: function () { return button.getBoundingClientRect(); },
      enabled: function () { return !mobile.matches && window.matchMedia('(hover: hover) and (pointer: fine)').matches; }
    });
    var timer, panelMotion, scheduled = false, restoringFocus = false;
    function setOpen(open, restoreFocus, immediate) {
      clearTimeout(timer);
      var wasOpen = button.getAttribute('aria-expanded') === 'true';
      if (open === wasOpen && !immediate) return;
      var current = !panel.hidden && panelMotion ? getComputedStyle(panel) : null;
      var from = current ? { opacity: current.opacity, transform: current.transform } : null;
      if (panelMotion) { panelMotion.cancel(); panelMotion = null; }
      button.setAttribute('aria-expanded', String(open));
      panel.inert = !open;
      panel.setAttribute('aria-hidden', String(!open));
      if (open) panel.hidden = false;
      document.documentElement.classList.toggle('work-guide-open', open && mobile.matches);
      if (open && mobile.matches) {
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        close.focus();
      } else {
        panel.removeAttribute('role');
        panel.removeAttribute('aria-modal');
      }
      if (!open && restoreFocus) { restoringFocus = true; button.focus(); restoringFocus = false; }
      if (liquid) { liquid.setOpen(open, immediate); return; }
      if (immediate || reducedMotion.matches || !panel.animate || (!open && panel.hidden)) {
        panel.hidden = !open;
        return;
      }
      panel.hidden = false;
      var folded = mobile.matches ? 'none' : 'translateY(6px) scale(.975)';
      var motion = panel.animate([
        Object.assign({ transformOrigin: '100% 100%' }, from || { opacity: open ? 0 : 1, transform: open ? folded : 'none' }),
        { opacity: open ? 1 : 0, transform: open ? 'none' : folded, transformOrigin: '100% 100%' }
      ], { duration: open ? 190 : 120, easing: 'cubic-bezier(.2,.8,.2,1)' });
      panelMotion = motion;
      motion.onfinish = function () {
        if (panelMotion !== motion) return;
        panel.hidden = !open;
        panelMotion = null;
        motion.cancel();
      };
    }
    button.addEventListener('click', function (event) { event.stopPropagation(); setOpen(button.getAttribute('aria-expanded') !== 'true'); });
    help.addEventListener('pointerenter', function () { clearTimeout(timer); if (!mobile.matches) setOpen(true); });
    help.addEventListener('pointerleave', function () {
      if (!mobile.matches && !button.matches(':focus-visible')) timer = setTimeout(function () { setOpen(false); }, 50);
    });
    button.addEventListener('focus', function () { if (!mobile.matches && !restoringFocus) setOpen(true); });
    help.addEventListener('focusout', function (event) { if (!mobile.matches && !help.contains(event.relatedTarget)) setOpen(false); });
    close.addEventListener('click', function () { setOpen(false, true); });
    panel.addEventListener('keydown', function (event) {
      if (mobile.matches && event.key === 'Tab') { event.preventDefault(); close.focus(); }
    });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !panel.hidden) setOpen(false, true); });
    mobile.addEventListener('change', function () { setOpen(false, false, true); schedule(); });
    reducedMotion.addEventListener('change', function () { setOpen(button.getAttribute('aria-expanded') === 'true', false, true); });
    function overlaps(a, b) { return a.left < b.right + 10 && a.right > b.left - 10 && a.top < b.bottom + 10 && a.bottom > b.top - 10; }
    function layout() {
      scheduled = false;
      var c = canvas.getBoundingClientRect(), v = viewport.getBoundingClientRect();
      canvas.style.setProperty('--work-map-top', (v.top - c.top) + 'px');
      canvas.style.setProperty('--work-map-middle', (v.top - c.top + v.height / 2) + 'px');
      var active = c.bottom > 60 && c.top < innerHeight - 60 && !document.documentElement.matches('.map-project-open,.project-inline-open');
      help.style.visibility = active ? 'visible' : 'hidden';
      if (!active && !panel.hidden) setOpen(false, false, true);
      var size = mobile.matches ? 34 : 51;
      var right = mobile.matches ? 16 : 64;
      var bottom = mobile.matches ? 16 : 30;
      var bounds = Array.from(viewport.querySelectorAll('.mypractice-map-block')).map(function (el) { return el.getBoundingClientRect(); });
      // Search the right edge upwards; reserve the exact Figma location whenever clear.
      var baseRight = mobile.matches ? innerWidth : c.right;
      var baseBottom = mobile.matches ? innerHeight : c.bottom;
      for (var i = 0; i < 40; i++) {
        var x = baseRight - right - size, y = baseBottom - bottom - size;
        var candidate = { left: x, right: x + size, top: y, bottom: y + size };
        if (!bounds.some(function (b) { return overlaps(candidate, b); })) break;
        bottom += size + 12;
        if (bottom + size > Math.min(v.height, innerHeight) - 24) { bottom = mobile.matches ? 16 : 30; right += size + 12; }
      }
      help.style.right = right + 'px'; help.style.bottom = bottom + 'px';
    }
    function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(layout); } }
    new ResizeObserver(schedule).observe(viewport);
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('hashchange', function () { setOpen(false, false, true); schedule(); });
    new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    document.fonts.ready.then(schedule);
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initWorkMap);
  else initWorkMap();
})();
