/* Protect the original bubble implementation while checking the new links. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const base = process.env.PORTFOLIO_BASE_URL || 'http://127.0.0.1:4173';
const source = fs.readFileSync('web/responsive.shared.js','utf8');
const start = source.indexOf('  function initLandingBubbleMotion()');
const end = source.indexOf('  function initLandingExclusionInline',start);
assert.equal(crypto.createHash('sha256').update(source.slice(start,end)).digest('hex'),'482217ea8b1c4f3c0daa74e80a0e531355db20e0e7a7aec5ac25d2f4bf48f42a','Original bubble interaction was changed');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const errors=[];
 try {
  const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(2300);
  for(const [width,height]of[[1440,900],[1100,800],[1099,800],[1024,768],[900,900],[820,800],[768,600],[767,600],[600,700],[560,700],[559,700],[390,844],[320,568],[1440,900]]) {
   await page.setViewportSize({width,height});await page.waitForTimeout(250);
   const state=await page.evaluate(()=>{
    const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height}};
    const get=s=>box(document.querySelector(s));
    const header=document.querySelector('.landing3042-header'),walker=document.createTreeWalker(header,NodeFilter.SHOW_TEXT),textRects=[];let text;
    while((text=walker.nextNode()))if(text.textContent.trim()){const range=document.createRange();range.selectNodeContents(text);for(const r of range.getClientRects())textRects.push({x:r.x,y:r.y,right:r.right,bottom:r.bottom});}
    const link=document.querySelector('.landing3042-archive-link');
    return {writing:get('.landing3042-writing-link'),email:get('[data-copy-to-clipboard]'),header:get('.landing3042-header'),contacts:get('.landing3042-contact-links'),archive:box(link),hero:get('#homepage---left'),textRects,imgCount:link.querySelectorAll('img').length,childCount:link.children.length,loaded:link.querySelector('img').naturalWidth,dimensions:['.landing3042-logo','.landing3042-bubble-hi','.landing3042-bubble-preferred','.landing3042-bubble-legally','.landing3042-bubble-uyghur','.landing3042-archive-link'].map(s=>{const c=getComputedStyle(document.querySelector(s));return[parseFloat(c.width),parseFloat(c.height)];})};
   });
   const label=`${width}x${height}`;
   assert(state.hero.h<=height+1,`${label}: page height increased`);
   assert.equal(state.imgCount,1);assert.equal(state.childCount,1,'Prototype bubble must use the original single-image structure');assert.equal(state.loaded,2069);
   const inside=(r,name)=>assert(r.x>=-2&&r.right<=width+2&&r.y>=-2&&r.bottom<=height+2,`${label}: ${name} outside viewport`);
   inside(state.archive,'prototype bubble');inside(state.writing,'Writing');inside(state.email,'email');
   const intersects=(a,b)=>Math.min(a.right,b.right)-Math.max(a.x,b.x)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>1;
   for(const r of state.textRects){assert(!intersects(r,state.writing),`${label}: Writing overlaps introduction`);assert(!intersects(r,state.email),`${label}: email overlaps introduction`);}
   assert(!intersects(state.writing,state.email));
   if(width>=1100)assert(Math.abs(state.writing.y-state.email.y)<2);
   else if(width>=560){assert(state.writing.bottom+6<=state.email.y);assert(Math.abs(state.writing.right-state.email.right)<2);}
   else {assert(Math.abs(state.writing.x-state.header.x)<2);assert(Math.abs(state.email.x-state.header.x)<2);assert(state.contacts.y>=state.header.bottom+10);}
   if(width>=768){const expected=[[411,411],[202,106],[325,123],[388,123],[315,123],[458,137]];state.dimensions.forEach((d,i)=>assert(Math.abs(d[0]-expected[i][0])<1&&Math.abs(d[1]-expected[i][1])<1,`${label}: bubble dimensions changed`));}
   console.log(`PASS ${label}: original fixed-size bubbles, original image structure, contact layout and new-link bounds`);
  }
  for(const selector of ['.landing3042-archive-link','.landing3042-writing-link']) {
   const link=page.locator(selector);await link.hover({force:true});await page.waitForTimeout(800);assert.equal(await page.locator('#external-link-hover-preview').getAttribute('aria-hidden'),'false');await page.waitForFunction(()=>document.querySelector('#external-link-hover-preview-icon').naturalWidth>0);
   const event=page.waitForEvent('popup');await link.click({force:true});const popup=await event;await popup.waitForLoadState('domcontentloaded');assert(popup.url().startsWith(await link.getAttribute('href')));await popup.close();
  }
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(base);await mobile.evaluate(()=>document.fonts.ready);await mobile.locator('[data-trigger="exclusion"]').tap();assert.equal(await mobile.locator('html').getAttribute('data-landing-surface-state'),'exclusion');await mobile.locator('#landing3042-exclusion-close').tap();assert.equal(await mobile.locator('html').getAttribute('data-landing-surface-state'),'home');await mobile.close();
  assert.deepEqual(errors,[]);console.log('PASS original interaction source, reused previews/navigation, touch Exclusion and no JS errors');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
