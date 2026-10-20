/* Run with the repository preview on :4173. Uses an existing Playwright install. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const base=process.env.PORTFOLIO_BASE_URL || 'http://127.0.0.1:4173';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});
try{for(const mobile of [false,true]){const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile});const requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
await page.goto(base+'/#map-project=norrtag');await page.locator('.norrtag-hero-figure[data-image-loading-state="loaded"]').waitFor();
assert(!requests.some(url=>url.includes('TDMovieOut.6.mov')),'Hidden video downloaded on detail entry');
assert(!requests.some(url=>url.includes('/figma-3139-map/image-')),'Invisible map thumbnail downloaded');
assert(!requests.some(url=>url.includes('mcp.figma.com')),'Capture helper fetched for normal visit');
assert.equal(await page.locator('.map-center-open-traces-measure source[src],.map-center-open-traces-mirror source[src]').count(),0);
await page.screenshot({path:`/tmp/loading-detail-${mobile?'mobile':'desktop'}.png`});await page.locator('#map-project-inline-close').click();await page.locator('#map-project-inline-shell').waitFor({state:'hidden'});
if(!mobile){const items=await page.locator('.mypractice-map-overlay-item').evaluateAll(es=>es.map(e=>({id:e.dataset.nodeId,name:e.dataset.projectName})));const open=items.find(e=>/open.*traces/i.test(e.name));assert(open,'Open Traces item missing');await page.locator(`.mypractice-map-overlay-item[data-node-id="${open.id}"]`).hover({force:true});await page.waitForFunction(()=>{const v=document.querySelector('.map-center-open-traces-mirror video');return v&&v.currentTime>0;});assert.equal(await page.locator('.map-center-open-traces-measure source[src]').count(),0,'Measurement copy fetched video');}
assert.deepEqual(errors,[]);console.log(`PASS ${mobile?'mobile':'desktop'}: no invisible thumbnail/measurement video/capture requests; hero loads; close works${mobile?'':'; Open Traces hover plays original video'}`);await page.close();}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
