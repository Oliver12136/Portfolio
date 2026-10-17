(function(){
  function rect(el){
    if(!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      text: (el.innerText || '').trim(),
      fontSize: cs.fontSize,
      lineHeight: cs.lineHeight,
      fontFamily: cs.fontFamily,
      fontWeight: cs.fontWeight,
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      opacity: cs.opacity,
      transform: cs.transform
    };
  }
  const data = {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    title: rect(document.querySelector('#hero-left-title')),
    titleCopy: rect(document.querySelector('#homepage---left .landing3042-title-copy')),
    studioInline: rect(document.querySelector('#landing3042-studio-inline')),
    studioSurface: rect(document.querySelector('#landing3042-studio-inline .landing3042-studio-surface')),
    studioHeading: rect(document.querySelector('#landing3042-studio-inline-title')),
    subtitle: rect(document.querySelector('#landing3042-studio-inline .gan3042-subtitle')),
    projectTitle: rect(document.querySelector('#landing3042-studio-inline .gan3042-project-title')),
    row1L: rect(document.querySelector('#landing3042-studio-inline .gan3042-project-row:nth-of-type(1) .gan3042-project-link')),
    row1R: rect(document.querySelector('#landing3042-studio-inline .gan3042-project-row:nth-of-type(1) .gan3042-project-more')),
    row2L: rect(document.querySelector('#landing3042-studio-inline .gan3042-project-row:nth-of-type(2) .gan3042-project-link')),
    row2R: rect(document.querySelector('#landing3042-studio-inline .gan3042-project-row:nth-of-type(2) .gan3042-project-more')),
    row3L: rect(document.querySelector('#landing3042-studio-inline .gan3042-project-row:nth-of-type(3) .gan3042-project-link')),
    row3R: rect(document.querySelector('#landing3042-studio-inline .gan3042-project-row:nth-of-type(3) .gan3042-project-more')),
    writing: rect(document.querySelector('#landing3042-studio-inline .gan3042-writing')),
    closeBtn: rect(document.querySelector('#landing3042-studio-close')),
    cta: rect(document.querySelector('#homepage---left .landing3042-practice-cta')),
    ctaCopy: rect(document.querySelector('#homepage---left .landing3042-practice-cta-copy')),
    logoCarousel: rect(document.querySelector('#landing3042-studio-inline .gan3042-logo-carousel')),
    logoSlides: [...document.querySelectorAll('#landing3042-studio-inline .gan3042-logo-slide')].map(rect)
  };
  document.body.innerHTML = '<pre id="out" style="white-space:pre-wrap;font:12px/1.4 monospace">' +
    JSON.stringify(data, null, 2).replace(/[<>&]/g, s => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[s])) +
    '</pre>';
})();
