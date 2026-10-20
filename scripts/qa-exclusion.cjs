// Local regression/visual checks for Exclusion. No entered names are logged.
const {chromium}=require('/tmp/portfolio-qa/node_modules/playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');const crypto=require('node:crypto');
const out=process.env.EXCLUSION_QA_DIR||'/tmp/portfolio-exclusion-qa';fs.mkdirSync(out,{recursive:true});
const url=process.env.PORTFOLIO_URL||'http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext();const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const sizes=[[1512,900],[1440,900],[1280,800],[1024,768],[820,600],[768,1024],[430,932],[390,844],[375,667],[320,568],[844,390]];
 const count=()=>page.locator('.exclusion-mark:not(.is-leaving)').count();
 const input=page.locator('[data-exclusion-game-input]');
 for(const [width,height]of sizes){
  await page.setViewportSize({width,height});await page.goto(url+'/#exclusion');await page.waitForSelector('.exclusion-experience:not([hidden])');await page.evaluate(()=>document.fonts.ready);
  assert.equal(await count(),0);
  if(width>=768){assert(await input.evaluate(e=>document.activeElement===e),'desktop autofocus');await page.keyboard.type('ab');assert.equal(await count(),2);await input.fill('');}
  const checks=await page.evaluate(()=>{
   const r=s=>document.querySelector(s).getBoundingClientRect().toJSON();
   const visible=s=>{const b=r(s);return b.left>=-1&&b.top>=-1&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1;};
   return {input:visible('.exclusion-authentication'),close:visible('.exclusion-close'),why:visible('.exclusion-why'),heading:r('.exclusion-header'),auth:r('.exclusion-authentication'),overflow:document.querySelector('.exclusion-scroll').scrollWidth>innerWidth,submit:!!document.querySelector('.exclusion-experience [type=submit]')};
  });
  assert(checks.input&&checks.close&&checks.why,'controls visible '+width+'x'+height);assert(!checks.overflow);assert(!checks.submit);assert(checks.heading.bottom<checks.auth.top,'header/input collision '+width+'x'+height);
  for(const length of [4,10,20]){await input.fill('a'.repeat(length));assert.equal(await count(),length);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(260);if([1512,390].includes(width))await page.screenshot({path:out+'/'+width+'-'+length+'.png'});}
  const layers=await page.evaluate(()=>({ink:+getComputedStyle(document.querySelector('.exclusion-ink')).zIndex,input:+getComputedStyle(document.querySelector('.exclusion-authentication')).zIndex,desktop:document.querySelector('.exclusion-experience').dataset.desktop}));
  assert(layers.desktop==='true'?layers.ink>layers.input:layers.ink<layers.input,'desktop overprint / mobile input priority');
  const styles=await page.locator('.exclusion-mark').evaluateAll(nodes=>new Set(nodes.map(n=>getComputedStyle(n).fontFamily)).size);assert(styles>=5,'five distinct font families across seven treatments');
  await input.fill('');assert.equal(await count(),0);if([1512,390].includes(width))await page.screenshot({path:out+'/'+width+'-empty.png'});
  await page.locator('.exclusion-why').click();await page.waitForTimeout(650);
  assert(await page.locator('.exclusion-scroll').evaluate(e=>e.scrollTop)>height-5);
  assert(await input.evaluate(e=>e.readOnly&&document.activeElement!==e),'reading disables input');
  await page.keyboard.type('mustnotenter');assert.equal(await input.inputValue(),'');
  const media=await page.locator('.exclusion-reflection figure img').evaluateAll(ns=>ns.map(n=>{let r=n.getBoundingClientRect();return {w:r.width,h:r.height,nw:n.naturalWidth,nh:n.naturalHeight,right:r.right};}));
  for(const m of media){assert(m.nw>=1836&&m.nh>=1029,'3x editorial source');assert(m.w>0&&m.right<=width+1);assert(Math.abs(m.w/m.h-612/343)<.02);}
  if([1512,390].includes(width))await page.screenshot({path:out+'/'+width+'-reflection-top.png'});
  // Large downward wheel gestures flow naturally and never chain into the homepage.
  await page.locator('.exclusion-snapshot').click();await page.waitForTimeout(650);await page.mouse.move(width/2,height/2);await page.mouse.wheel(0,15000);await page.waitForTimeout(250);
  const state=await page.evaluate(()=>({y:scrollY,top:document.querySelector('.exclusion-scroll').scrollTop,boundary:document.querySelector('.exclusion-reflection').offsetTop,open:document.documentElement.dataset.landingSurfaceState}));
  assert.equal(state.y,0);assert.equal(state.open,'exclusion');assert(state.top>=state.boundary);
  await page.keyboard.press('End');await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>scrollY),0);
  assert(await page.locator('.exclusion-scroll').evaluate(e=>e.scrollTop+e.clientHeight>=e.scrollHeight-2));
  if([1512,390].includes(width))await page.screenshot({path:out+'/'+width+'-reflection-bottom.png'});
  await page.locator('.exclusion-close').click();assert.equal(await page.evaluate(()=>document.documentElement.dataset.landingSurfaceState),'home');assert(await page.locator('[data-trigger=exclusion]').evaluate(e=>document.activeElement===e));
  assert.equal(await page.evaluate(()=>document.querySelector('#site-shell').inert),false);
  console.log('Viewport passed:',width,height);
 }
 await page.setViewportSize({width:1440,height:900});await page.goto(url+'/#exclusion');
 await input.fill('a');assert.equal(await count(),1);await input.press('Backspace');assert.equal(await count(),0);
 await input.fill('A👨‍👩‍👧‍👦e\u0301🇸🇪·中文');assert.equal(await count(),7);
 await input.fill('abcdefghijklmnopqrst');const original=await page.locator('.exclusion-mark').evaluateAll(ns=>ns.map(n=>({text:n.textContent,style:n.getAttribute('style')})));
 await input.fill('abcdefghij');assert.equal(await count(),10);await page.waitForTimeout(230);assert.equal(await page.locator('.is-leaving').count(),0);
 assert.deepEqual(await page.locator('.exclusion-mark').evaluateAll(ns=>ns.map(n=>({text:n.textContent,style:n.getAttribute('style')}))),original.slice(0,10));
 await page.setViewportSize({width:820,height:600});assert.deepEqual(await page.locator('.exclusion-mark').evaluateAll(ns=>ns.map(n=>({text:n.textContent,style:n.getAttribute('style')}))),original.slice(0,10));
 await input.fill('');await input.evaluate(e=>{e.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));e.value='中';e.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true}));});assert.equal(await count(),0);
 await input.evaluate(e=>{e.value='中文';e.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'中文'}));e.dispatchEvent(new InputEvent('input',{bubbles:true}));});assert.equal(await count(),2);
 await input.fill('x'.repeat(10000));assert.equal(await count(),48);await input.fill('');assert.equal(await page.locator('.exclusion-mark').count(),0);
 await context.grantPermissions(['clipboard-read','clipboard-write']);await page.evaluate(()=>navigator.clipboard.writeText('A·👩🏽‍💻'));await input.focus();await input.press('Meta+V');assert.equal(await count(),3);
 await input.evaluate(e=>e.setSelectionRange(0,e.value.length));await input.press('Backspace');assert.equal(await count(),0);
 await page.emulateMedia({reducedMotion:'reduce'});await input.fill('abcdefghijklmnopqrst');assert(await page.locator('.exclusion-mark').evaluateAll(ns=>ns.every(n=>getComputedStyle(n).animationName==='none')));await input.fill('a');await page.waitForTimeout(150);assert.equal(await page.locator('.is-leaving').count(),0);
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.documentElement.dataset.landingSurfaceState),'home');
 await page.locator('[data-trigger=exclusion]').click();await page.goBack();await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>document.documentElement.dataset.landingSurfaceState),'home');await page.goForward();await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>document.documentElement.dataset.landingSurfaceState),'exclusion');
 await page.keyboard.press('Escape');await page.mouse.move(100,200);await page.mouse.wheel(0,500);await page.waitForTimeout(800);assert(await page.evaluate(()=>scrollY)>0,'homepage scroll restored');
 assert.deepEqual(errors,[]);
 const source=fs.readFileSync('web/responsive.shared.js','utf8');const a=source.indexOf('  function initLandingBubbleMotion('),b=source.indexOf('  function initLandingExclusionInline(',a);const baseline={bubbleHash:'482217ea8b1c4f3c0daa74e80a0e531355db20e0e7a7aec5ac25d2f4bf48f42a'};assert.equal(crypto.createHash('sha256').update(source.slice(a,b)).digest('hex'),baseline.bubbleHash,'bubble engine unchanged');
 console.log('PASS: input, Unicode, IME, clipboard, deletion, resize stability, budget, reduced motion, isolated scroll, history, focus, homepage return, bubble source.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
