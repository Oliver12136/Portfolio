const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const touch of [false,true]){
  const page=await browser.newPage({viewport:{width:1440,height:1000},hasTouch:touch,isMobile:touch});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/');await page.evaluate(()=>document.fonts.ready);
  // Record every rendered frame, including opening/closing, history and resizing.
  const startAudit=()=>{window.arrowLeaks=[];window.arrowAudit=true;function sample(){if(!window.arrowAudit)return;const shell=document.querySelector('#map-project-inline-shell');const open=shell && (!shell.hidden||document.documentElement.matches('.map-project-open,.project-inline-open'));if(open){for(const e of document.querySelectorAll('.mypractice-map-axis,.mypractice-map-corner,.landing3042-practice-cta-arrow')){let r=e.getBoundingClientRect(),s=getComputedStyle(e);if(s.visibility!=='hidden'&&s.display!=='none'&&r.width>0&&r.height>0&&r.top<innerHeight&&r.bottom>0&&r.left<innerWidth&&r.right>0)window.arrowLeaks.push({class:e.className,width:innerWidth,hash:location.hash});}}requestAnimationFrame(sample)}sample()};
  await page.addInitScript(startAudit);await page.evaluate(startAudit);
  for(const id of ['norrtag','3139:21709','3139:17651']){
   await page.goto('http://127.0.0.1:4173/#map-project='+id);await page.waitForTimeout(350);
   assert(await page.locator('#map-project-inline-shell').isVisible());
   for(const width of [1440,1080,900,768,767,700,560,390,320]){
    await page.setViewportSize({width,height:950});await page.waitForTimeout(100);
    for(const axis of await page.locator('.mypractice-map-axis').all())assert(await axis.isHidden(),`${touch}/${id}/${width}: axis leak`);
    await page.locator('#map-project-inline-scroll').evaluate(e=>e.scrollTop=e.scrollHeight*.65);
    assert(await page.locator('#map-project-inline-nav').isVisible(),'Project navigation disappeared');
   }
   await page.locator('#map-project-inline-close').click();await page.waitForTimeout(200);
   for(const axis of await page.locator('.mypractice-map-axis').all())assert(await axis.isVisible(),'Axis did not restore on close');
   assert.deepEqual(await page.evaluate(()=>window.arrowLeaks),[],'Arrow leaked in a rendered frame');
  }
  // Sample navigation without reloading, including browser back/forward.
  await page.evaluate(()=>location.hash='map-project=norrtag');await page.waitForTimeout(300);
  await page.evaluate(()=>{window.arrowLeaks=[]});
  await page.locator('#map-project-inline-next').click();await page.waitForTimeout(350);
  await page.goBack();await page.waitForTimeout(300);await page.goForward();await page.waitForTimeout(300);
  // A visible shell must hide the overview even if a page-state class is momentarily absent.
  assert(await page.evaluate(()=>{const root=document.documentElement;root.classList.remove('map-project-open');const hidden=[...document.querySelectorAll('.mypractice-map-axis')].every(e=>getComputedStyle(e).display==='none');root.classList.add('map-project-open');return hidden}));
  assert.deepEqual(await page.evaluate(()=>window.arrowLeaks),[],'Arrow exposed during a rendered frame');
  await page.locator('#map-project-inline-close').click();await page.waitForTimeout(250);
  await page.setViewportSize({width:767,height:950});await page.waitForTimeout(150);
  for(const arrow of await page.locator('.mypractice-map-axis-arrow').all()){
   const s=await arrow.evaluate(e=>({size:parseFloat(getComputedStyle(e).width),bg:getComputedStyle(e).backgroundImage}));
   assert(s.size<35);assert.equal(s.bg,'none');
  }
  assert.deepEqual(errors,[]);await page.close();console.log(`PASS ${touch?'touch':'mouse'}: 3 project layouts × 9 widths, scrolling, navigation, back/forward, close/restore and shell-state guard.`);
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
