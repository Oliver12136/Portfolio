/* Exclusion is a local, fictional artwork: never persist or transmit input.
 * Rendering budget: 48 committed graphemes = 48 active messages, all devices.
 * At most 48 retiring nodes for 180ms. Huge pastes stop segmentation at 48.
 * Ordinal-driven metadata is stable across edits/resize; same-length replacements
 * retain the composition. Reduced motion preserves density, without jitter.
 */
(function () {
  'use strict';
  var BUDGET = 48;
  var catalogue = [
    ['Please enter your legal name.', 'terminal', 17, 24, 29, -2, '#777'],
    ['Your name does not match your ID.', 'serif', 27, 75, 37, 3, '#303030'],
    ['Please use a supported name.', 'typewriter', 22, 24, 70, -4, '#303030'],
    ['Try again.', 'terminal', 19, 80, 77, 0, '#777'],
    ['INVALID CHARACTER', 'stamp', 51, 60, 27, -8, '#8f1421'],
    ['Please enter your REAL name.', 'serif', 42, 37, 81, 4, '#111'],
    ['Verification failed.', 'typewriter', 31, 15, 45, -5, '#111'],
    ['IDENTITY NOT RECOGNIZED', 'condensed', 86, 60, 67, -3, '#111'],
    ['Special characters are not permitted.', 'terminal', 20, 72, 19, 0, '#777'],
    ['ACCESS DENIED', 'stamp', 89, 38, 39, -12, '#8f1421'],
    ['Remove the unsupported character.', 'typewriter', 29, 25, 91, 2, '#303030'],
    ["ARE YOU SURE THAT’S YOUR NAME?", 'spray', 61, 67, 85, 8, '#111'],
    ['YOUR NAME IS NOT SUPPORTED', 'condensed', 126, 50, 16, 2, '#111'],
    ['Use exactly the name on your ID.', 'terminal', 22, 30, 63, -1, '#777'],
    ['YOUR LEGAL NAME IS INVALID', 'fragment', 91, 57, 76, -7, '#c62828'],
    ['NAME NOT FOUND', 'stamp', 78, 70, 45, 13, '#111'],
    ['Be yourself. Use a different name.', 'serif', 53, 32, 57, -3, '#8f1421'],
    ['TRY AGAIN', 'spray', 144, 30, 28, -9, '#111'],
    ['THIS NAME CANNOT BE PROCESSED', 'condensed', 97, 50, 94, 1, '#303030'],
    ['INVALID IDENTITY', 'fragment', 157, 56, 61, 6, '#8f1421'],
    ['Your ID is valid. Your name is not.', 'typewriter', 39, 52, 9, 0, '#111'],
    ['PLEASE CORRECT YOUR IDENTITY', 'stamp', 64, 47, 48, -5, '#c62828'],
    ['Keep your legal name. Remove part of it.', 'serif', 39, 74, 33, 9, '#303030'],
    ['NO MATCH', 'spray', 130, 60, 83, -11, '#111']
  ];
  function init(bubbleMotionApi) {
    var root = document.documentElement;
    var panel = document.getElementById('landing3042-exclusion-inline');
    var hero = document.getElementById('homepage---left');
    var trigger = document.querySelector('[data-trigger="exclusion"]');
    if (!panel || !hero || !trigger) return null;
    if (hero.__landingExclusionInlineApi) return hero.__landingExclusionInlineApi;
    // Escape transformed homepage containing blocks; reuse the surface state.
    document.body.appendChild(panel);
    var scroll = panel.querySelector('.exclusion-scroll');
    var canvas = panel.querySelector('.exclusion-canvas');
    var ink = panel.querySelector('.exclusion-ink');
    var input = panel.querySelector('[data-exclusion-game-input]');
    var closeButton = panel.querySelector('.exclusion-close');
    var why = panel.querySelector('.exclusion-why');
    var snapshot = panel.querySelector('.exclusion-snapshot');
    var reflection = panel.querySelector('.exclusion-reflection');
    var reduce = matchMedia('(prefers-reduced-motion: reduce)');
    var desktop = matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)');
    var acceptingInput = false, readingRequested = false;
    var segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, {granularity:'grapheme'}) : null;
    var marks = [], exits = new Map(), composing = false, open = false, previousInput = ''; 
    var lastTrigger = trigger, returnY = 0, inertElements = [], bodyStyle = null;
    var wheelTime = 0, wheelDirection = 0, returnGuard = false, touchStartY = 0, touchStartAtBoundary = false;
    var viewportRaf = 0;
    function focus(node) { if (node) node.focus({preventScroll:true}); }
    function hashOpen() { return location.hash.toLowerCase() === '#exclusion'; }
    function count(value) {
      var n = 0;
      if (segmenter) {
        for (var part of segmenter.segment(value)) { if (++n >= BUDGET) break; }
        return n;
      }
      // Older engines: combine marks, emoji modifiers, flags and ZWJ sequences.
      var join = false, regional = 0;
      for (var ch of value) {
        if (/\p{Mark}|[\uFE0E\uFE0F\u{1F3FB}-\u{1F3FF}]/u.test(ch)) continue;
        if (ch === '\u200d') { join = true; continue; }
        if (join) { join = false; continue; }
        if (/[\u{1F1E6}-\u{1F1FF}]/u.test(ch)) { if (++regional % 2 === 0) continue; } else regional = 0;
        if (++n >= BUDGET) break;
      }
      return n;
    }
    function clearExits() { exits.forEach(function(t, node){clearTimeout(t);node.remove();}); exits.clear(); }
    function reset() { clearExits(); marks.length = 0; ink.replaceChildren();input.value='';previousInput='';composing=false;canvas.dataset.messageCount='0'; }
    function createMark(index) {
      var item = catalogue[index % catalogue.length];
      var cycle = Math.floor(index / catalogue.length);
      var n = document.createElement('p');
      n.className = 'exclusion-mark exclusion-mark--' + item[1];
      n.dataset.messageIndex = index;
      n.textContent = item[0];
      n.style.setProperty('--ink-x', (cycle ? 10 + ((item[3] + index * 17) % 80) : item[3]) + '%');
      n.style.setProperty('--ink-y', (cycle ? 8 + ((item[4] + index * 13) % 85) : item[4]) + '%');
      n.style.setProperty('--ink-size', (item[2] / 15.12).toFixed(3) + 'cqw');
      n.style.setProperty('--ink-angle', (item[5] + cycle * 3) + 'deg');
      n.style.setProperty('--ink-color', item[6]);
      n.style.setProperty('--ink-opacity', index < 4 ? '.76' : '.93');
      n.style.zIndex = index % 5;
      return n;
    }
    function reconcile() {
      if (composing || !open || !isInputScreen()) return;
      if (input.value === previousInput) return;
      var length = count(input.value);
      previousInput = input.value;
      clearExits();
      // A replacement of equal length still gets an immediate response, while
      // retaining all established text/positions and the exact message count.
      if (length && length === marks.length) {
        var refreshed = createMark(length - 1);
        marks[length - 1].replaceWith(refreshed);
        marks[length - 1] = refreshed;
      }
      if (!length) { marks.length=0;ink.replaceChildren();canvas.dataset.messageCount='0';return; }
      while (marks.length > length) {
        var n = marks.pop();
        n.classList.add('is-leaving'); n.setAttribute('aria-hidden','true');
        (function(node){exits.set(node,setTimeout(function(){node.remove();exits.delete(node);},reduce.matches?100:190));})(n);
      }
      var fragment = document.createDocumentFragment();
      while (marks.length < length) {
        var next = createMark(marks.length);marks.push(next);fragment.appendChild(next);
      }
      ink.appendChild(fragment);
      canvas.dataset.messageCount = String(length);
    }
    input.addEventListener('compositionstart',function(){composing=true;});
    input.addEventListener('compositionend',function(){composing=false;reconcile();});
    input.addEventListener('input',function(e){if (!e.isComposing) reconcile();});
    input.addEventListener('keydown',function(e){if(e.key==='Enter')e.preventDefault();});
    function isInputScreen() {
      // The reading screen, including the transition towards it, never types.
      return open && !readingRequested && scroll.scrollTop <= 1;
    }
    function syncInputState(forceFocus) {
      var active = isInputScreen();
      var wasActive = acceptingInput;
      acceptingInput = active;
      panel.dataset.desktop = String(desktop.matches);
      input.readOnly = !active;
      input.tabIndex = active ? 0 : -1;
      if (!active && document.activeElement === input) input.blur();
      if (desktop.matches && active && (forceFocus || !wasActive)) focus(input);
    }
    scroll.addEventListener('scroll', function () {
      // Stop an upward gesture at the reading-page top, including its inertia.
      // A fresh gesture beginning here releases the guard.
      if (returnGuard && scroll.scrollTop < reflection.offsetTop) {
        scroll.scrollTop = reflection.offsetTop;
      }
      if (scroll.scrollTop <= 1) readingRequested = false;
      syncInputState(false);
    }, {passive:true});
    desktop.addEventListener('change', function () { syncInputState(true); });
    // Keep native input, selection, paste and IME behaviour after a blank-area
    // click; never synthesize letters or capture browser/OS shortcuts.
    canvas.addEventListener('pointerdown', function (event) {
      if (!desktop.matches || !isInputScreen()) return;
      if (event.target.closest('button, a, input, textarea, select, [contenteditable]')) return;
      event.preventDefault();
      focus(input);
    });
    function viewport() {
      viewportRaf=0;if(!open)return;
      var vv=window.visualViewport;
      var height=vv?vv.height:window.innerHeight;
      panel.dataset.compact=height<440?'true':'false';
      panel.style.height=height+'px';panel.style.top=(vv?vv.offsetTop:0)+'px';
      panel.style.setProperty('--exclusion-viewport-height',height+'px');
    }
    function queueViewport(){if(!viewportRaf)viewportRaf=requestAnimationFrame(viewport);}
    function moveTo(top) {
      returnGuard = false;wheelTime = 0;wheelDirection = 0;
      if (top > 0) readingRequested = true;
      syncInputState(false);
      input.blur();
      scroll.scrollTo({top:top,behavior:reduce.matches?'instant':'smooth'});
      focus(scroll);
    }
    why.addEventListener('click',function(){moveTo(reflection.offsetTop);});
    snapshot.addEventListener('click',function(){moveTo(0);});
    // Let the browser handle continuous wheel/trackpad scrolling. Only an
    // upward gesture arriving from within the editorial page has a boundary.
    // There is no travel budget, delta scaling or downward section snapping.
    scroll.addEventListener('wheel', function (event) {
      if (!open || event.ctrlKey || event.metaKey || !event.deltaY) return;
      var now = performance.now();
      var boundary = reflection.offsetTop;
      if (event.deltaY > 0) {
        returnGuard = false;
      } else if (scroll.scrollTop <= boundary + 1) {
        event.preventDefault();
        if (!returnGuard) {
          returnGuard = true;
          moveTo(0);
          returnGuard = true;
        }
      }
      wheelTime = now;wheelDirection = Math.sign(event.deltaY);
      if (event.deltaY < 0 && returnGuard && scroll.scrollTop <= boundary + 1) {
        event.preventDefault();
      }
    }, {passive:false});
    scroll.addEventListener('touchstart', function (event) {
      if (event.touches.length !== 1) return;
      touchStartY = event.touches[0].clientY;
      touchStartAtBoundary = scroll.scrollTop <= reflection.offsetTop + 1;
      if (!touchStartAtBoundary) returnGuard = true;
    }, {passive:true});
    scroll.addEventListener('touchmove', function (event) {
      if (event.touches.length !== 1) return;
      var movement = event.touches[0].clientY - touchStartY;
      if (movement < 0 && !touchStartAtBoundary) returnGuard = true;
      if (movement > 0 && scroll.scrollTop <= reflection.offsetTop + 1) {
        if (!returnGuard) {
          event.preventDefault();
          returnGuard = true;
          moveTo(0);
          returnGuard = true;
        }
      }
    }, {passive:false});
    scroll.addEventListener('touchend', function () {
      if (touchStartAtBoundary && scroll.scrollTop <= reflection.offsetTop + 1) returnGuard = true;
      touchStartAtBoundary = false;
    }, {passive:true});
    function openExclusion(source) {
      if(open)return;open=true;lastTrigger=source||document.activeElement||trigger;
      returnY=window.scrollY;
      bodyStyle={position:document.body.style.position,top:document.body.style.top,width:document.body.style.width};
      document.body.style.position='fixed';document.body.style.top=-returnY+'px';document.body.style.width='100%';
      root.setAttribute('data-landing-surface-state','exclusion');
      panel.hidden=false;panel.setAttribute('aria-hidden','false');trigger.setAttribute('aria-expanded','true');
      inertElements=Array.from(document.body.children).filter(function(el){return el!==panel&&el.tagName!=='SCRIPT'&&el.tagName!=='LINK'&&!el.inert;});
      inertElements.forEach(function(el){el.inert=true;});
      if(bubbleMotionApi)bubbleMotionApi.pause(true);
      viewport();returnGuard=false;scroll.scrollTop=0;wheelTime=0;
      acceptingInput=false;readingRequested=false;
      if(!hashOpen()) location.hash='exclusion';
      focus(scroll);
      syncInputState(true);
    }
    function closeExclusion(options) {
      if(!open)return;open=false;var opts=options||{};
      acceptingInput=false;input.blur();reset();panel.hidden=true;panel.setAttribute('aria-hidden','true');
      root.setAttribute('data-landing-surface-state','home');trigger.setAttribute('aria-expanded','false');
      inertElements.forEach(function(el){el.inert=false;});inertElements=[];
      Object.keys(bodyStyle).forEach(function(key){document.body.style[key]=bodyStyle[key];});
      window.scrollTo({top:returnY,behavior:'instant'});
      if(!opts.skipHash&&hashOpen())history.replaceState(history.state,'',location.pathname+location.search);
      if(bubbleMotionApi)bubbleMotionApi.resume();
      if(opts.restoreFocus!==false)focus(lastTrigger);
    }
    trigger.addEventListener('click',function(e){e.preventDefault();openExclusion(trigger);});
    closeButton.addEventListener('click',function(){closeExclusion();});
    document.addEventListener('keydown',function(e){
      if(!open)return;
      if(e.key==='Escape'&&!composing&&!e.isComposing){e.preventDefault();closeExclusion();return;}
      if(e.key==='Tab'){
        var list=Array.from(panel.querySelectorAll('button,input,[tabindex="0"]')).filter(function(n){return !n.disabled && n.tabIndex >= 0;});
        if(list.indexOf(document.activeElement)===-1){e.preventDefault();focus(e.shiftKey?list[list.length-1]:list[0]);}
        else if(e.shiftKey&&document.activeElement===list[0]){e.preventDefault();focus(list[list.length-1]);}
        else if(!e.shiftKey&&document.activeElement===list[list.length-1]){e.preventDefault();focus(list[0]);}
      }
      // Restore typing focus for a printable/IME/deletion/paste key when the
      // desktop artwork is active. Native browser editing handles the key.
      if (desktop.matches && isInputScreen() && e.key !== 'Tab' &&
          !e.altKey && (!e.ctrlKey && !e.metaKey || e.key.toLowerCase() === 'v') &&
          (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete' ||
           e.key === 'Process' || e.keyCode === 229)) {
        var target = document.activeElement;
        if (target !== input && !target.matches('textarea,select,[contenteditable="true"]') &&
            !(e.key === ' ' && target.tagName === 'BUTTON')) focus(input);
      }
      if(document.activeElement===input && e.key!=='PageDown' && e.key!=='PageUp')return;
      if(['PageDown','PageUp','Home','End','ArrowDown','ArrowUp',' '].indexOf(e.key)<0)return;
      if(e.key===' '&&document.activeElement.tagName==='BUTTON')return;
      e.preventDefault();
      returnGuard=false;wheelTime=0;wheelDirection=0;
      var amount=(e.key==='PageDown'||e.key===' ')?scroll.clientHeight:e.key==='PageUp'?-scroll.clientHeight:e.key==='ArrowDown'?60:e.key==='ArrowUp'?-60:0;
      var top=e.key==='Home'?0:e.key==='End'?scroll.scrollHeight:scroll.scrollTop+amount;
      if(scroll.scrollTop>reflection.offsetTop+1&&amount<0)top=Math.max(top,reflection.offsetTop);
      scroll.scrollTo({top:top,behavior:'instant'});
    });
    function fromHash(){if(hashOpen())openExclusion(trigger);else if(open)closeExclusion({skipHash:true});}
    window.addEventListener('hashchange',fromHash);window.addEventListener('popstate',fromHash);
    window.addEventListener('resize',queueViewport,{passive:true});
    if(window.visualViewport){visualViewport.addEventListener('resize',queueViewport,{passive:true});visualViewport.addEventListener('scroll',queueViewport,{passive:true});}
    var api={isOpen:function(){return open;},open:openExclusion,close:closeExclusion};
    hero.__landingExclusionInlineApi=api;
    if(hashOpen()||new URLSearchParams(location.search).get('landingSurface')==='exclusion')openExclusion(trigger);
    return api;
  }
  window.PortfolioExclusion={init:init};
})();
