/* Real persistent browser storage and real UI components; synthetic accounts only. */
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const deps=process.env.CODEX_TEST_NODE_MODULES?createRequire(path.join(process.env.CODEX_TEST_NODE_MODULES,'package.json')):require;
const {chromium}=deps('playwright');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'tmp/qa');
const upstream=new URL(process.env.TEST_ORIGIN||'http://127.0.0.1:3100');
const origin='http://127.0.0.1:3103';
const channel=process.env.TEST_BROWSER_CHANNEL?{channel:process.env.TEST_BROWSER_CHANNEL}:{};
const sizes=[[320,568],[360,800],[375,667],[390,844],[412,915],[414,896],[430,932],[640,960],[768,1024],[1024,768],[1280,800],[1440,900],[1920,1080]];
const marker='PRIVATE_SESSION_SHOULD_NEVER_PERSIST_STAGE2';
const profile=path.join(out,`pwa-profile-${Date.now()}`);
const results={reopenCycles:[],bannerChecks:[],contrastChecks:[],home:{},cacheAudit:{}};
function contrast(foreground,background){
  const luminance=color=>color.match(/[\d.]+/g).slice(0,3).map(Number).map(value=>{const c=value/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((sum,value,i)=>sum+value*[.2126,.7152,.0722][i],0);
  const a=luminance(foreground),b=luminance(background);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}
fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  const base=/\.(png|svg|ico)$/.test(url.pathname)?path.join(root,'public'):path.join(out,'ui');
  const file=path.resolve(base,'.'+(url.pathname==='/'?'/index.html':url.pathname));
  if(!file.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':file.endsWith('.woff2')?'font/woff2':'text/html; charset=utf-8');res.end(data);});
});
// Block the app's network at the server boundary as well as in the browser.
// Chromium can create a new worker network target after offline emulation is set.
let networkAvailable=true;
const networkGate=http.createServer((req,res)=>{
  if(!networkAvailable){res.destroy();return;}
  const request=http.request({hostname:upstream.hostname,port:upstream.port,path:req.url,method:req.method,headers:{...req.headers,host:upstream.host}},response=>{
    res.writeHead(response.statusCode,response.headers);response.pipe(res);
  });
  request.on('error',()=>res.destroy());req.pipe(request);
});
async function audit(page){return page.evaluate(async marker=>{
  const keys=[],violations=[];
  for(const name of await caches.keys()){
    const cache=await caches.open(name);
    for(const request of await cache.keys()){
      const url=new URL(request.url);keys.push({cache:name,path:url.pathname});
      if(/\/api\/|\/admin\/|\/login|\/catalog/.test(url.pathname)||url.search)violations.push(url.pathname);
      const response=await cache.match(request);
      if(/html|json/.test(response.headers.get('content-type')||'')){
        const body=await response.text();
        if(body.includes(marker)||body.includes('self.__next_f.push')||body.includes('Paciente de prueba'))violations.push(url.pathname+':private payload');
      }
    }
  }
  return{keys,violations};
},marker);}
async function geometry(page){return page.evaluate(()=>{
  const banner=document.querySelector('.connection-status');const rect=banner.getBoundingClientRect();
  return{width:innerWidth,scrollWidth:document.documentElement.scrollWidth,bannerHeight:rect.height,bannerWidth:rect.width,mainTop:document.querySelector('main').getBoundingClientRect().top,visible:getComputedStyle(banner).display!=='none',live:banner.getAttribute('aria-live')};
});}

(async()=>{
  let context,browser;
  await new Promise(resolve=>server.listen(3102,'127.0.0.1',resolve));
  await new Promise(resolve=>networkGate.listen(3103,'127.0.0.1',resolve));
  try{
    context=await chromium.launchPersistentContext(profile,{headless:true,...channel,viewport:{width:390,height:844}});
    await context.route('**/api/auth/session',route=>route.fulfill({json:null}));
    await context.route(origin+'/',async route=>{
      if(route.request().resourceType()!=='document')return route.continue();
      const response=await route.fetch();
      await route.fulfill({response,body:(await response.text()).replace('</body>',`<p hidden>${marker}</p></body>`)});
    });
    let page=await context.newPage();await page.goto(origin+'/',{waitUntil:'networkidle'});
    assert((await page.content()).includes(marker));
    await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
    await page.waitForFunction(async()=>!!(await(await caches.open('rubi-pwa-v2-shell')).match('/offline-public/index.json')));
    results.cacheAudit=await audit(page);assert.deepEqual(results.cacheAudit.violations,[]);
    const cdp=await context.newCDPSession(page);await cdp.send('Network.clearBrowserCache');
    await context.close();context=undefined;

    for(let cycle=1;cycle<=2;cycle++){
      // Closing the persistent context closes its entire browser process.
      context=await chromium.launchPersistentContext(profile,{headless:true,...channel,viewport:{width:390,height:844}});
      networkAvailable=false;
      await context.setOffline(true);
      page=await context.newPage();
      await page.goto(origin+'/',{waitUntil:'load'});
      assert.equal(await page.locator('html[data-offline-snapshot]').count(),1);
      assert.equal(await page.locator('h1').innerText(),'Consultorio Nutricional');
      assert(await page.getByText('Estás en modo offline',{exact:true}).isVisible());
      await page.waitForFunction(()=>[...document.images].every(image=>image.complete&&image.naturalWidth>0));
      const styled=await page.locator('h1').evaluate(el=>({font:getComputedStyle(el).fontSize,color:getComputedStyle(el).color}));
      assert.equal(styled.color,'rgb(255, 255, 255)');assert(parseFloat(styled.font)>25);
      for(const [width,height]of [[320,568],[1440,900]]){
        await page.setViewportSize({width,height});const g=await geometry(page);assert(g.scrollWidth<=width+1);assert(g.visible&&g.bannerWidth<=width);await page.screenshot({path:path.join(out,`stage2-offline-home-${width}.png`),fullPage:true});
      }
      await page.getByRole('navigation',{name:'Navegación pública'}).getByRole('link',{name:'Servicios',exact:true}).click();
      await page.waitForURL(origin+'/servicios');
      assert.equal(await page.locator('html[data-offline-snapshot]').count(),1);
      for(const route of ['/quienessomos','/politicas','/terminos']){
        await page.goto(origin+route,{waitUntil:'load'});assert.equal(await page.locator('html[data-offline-snapshot]').count(),1);
      }
      await page.goto(origin+'/admin/patient/historial',{waitUntil:'load'});
      assert.equal(await page.locator('h1').innerText(),'Sin conexión');
      assert(await page.getByText('Estás en modo offline',{exact:true}).isVisible());
      assert.equal((await page.content()).includes(marker),false);
      results.reopenCycles.push({cycle,publicPages:5,privateFallback:true,allImages:true,css:true,httpCacheCleared:cycle===1,networkGateBlocked:true,browserProcessClosed:true});
      results.cacheAudit=await audit(page);assert.deepEqual(results.cacheAudit.violations,[]);
      networkAvailable=true;
      await context.setOffline(false);
      await page.getByText('Conexión restablecida',{exact:true}).waitFor({state:'visible'});
      await page.waitForFunction(()=>document.querySelector('#connection-status').hidden);
      await context.close();context=undefined;
    }

    browser=await chromium.launch({headless:true,...channel});
    context=await browser.newContext({viewport:{width:390,height:844}});
    await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
    page=await context.newPage();
    for(const screen of ['admin-dashboard','patient-dashboard','patient-dashboard-empty']){
      for(const [width,height]of sizes){
        await context.setOffline(false);await page.setViewportSize({width,height});
        await page.goto(`http://127.0.0.1:3102/?screen=${screen}`,{waitUntil:'networkidle'});
        await context.setOffline(true);await page.getByText('Estás en modo offline',{exact:true}).waitFor();
        const g=await geometry(page);assert(g.visible&&g.scrollWidth<=width+1&&g.mainTop>=g.bannerHeight);assert.equal(g.live,'polite');
        if(width>=1024)assert(await page.evaluate(()=>document.querySelector('.workspace-shell').getBoundingClientRect().bottom<=innerHeight+1));
        if(width===1440){
          const colors=await page.locator('.workspace-content a[class~="bg-[#BD7D4A]"], .workspace-content a[class~="bg-[#6B8E7B]"]').evaluateAll(links=>links.map(link=>({text:link.textContent,color:getComputedStyle(link).color,background:getComputedStyle(link).backgroundColor})));
          for(const pair of colors){const ratio=contrast(pair.color,pair.background);assert(ratio>=4.5);results.contrastChecks.push({screen,...pair,ratio});}
        }
        if(width===320||width===1440)await page.screenshot({path:path.join(out,`stage2-${screen}-offline-${width}.png`),fullPage:true});
        results.bannerChecks.push({screen,width,height,...g});
      }
    }
    await context.setOffline(false);await page.goto('http://127.0.0.1:3102/?screen=patient-profile',{waitUntil:'networkidle'});
    const input=page.locator('input:not([type=hidden]):not([disabled])').first();await input.fill('Dato ficticio sin guardar');
    await context.setOffline(true);await page.getByText('Estás en modo offline',{exact:true}).waitFor();
    await context.setOffline(false);await page.getByText('Conexión restablecida',{exact:true}).waitFor();
    await page.waitForFunction(()=>!document.querySelector('.connection-status'));
    assert.equal(await input.inputValue(),'Dato ficticio sin guardar');results.formPreservedOnReconnect=true;
    await page.goto(origin+'/',{waitUntil:'networkidle'});
    results.home.normal=await page.locator('.hero-reveal').evaluateAll(nodes=>nodes.map(el=>({name:getComputedStyle(el).animationName,duration:getComputedStyle(el).animationDuration,delay:getComputedStyle(el).animationDelay,opacity:getComputedStyle(el).opacity})));
    assert(results.home.normal.every(animation=>animation.name==='heroReveal'));
    await page.emulateMedia({reducedMotion:'reduce'});
    results.home.reduced=await page.locator('.hero-reveal').evaluateAll(nodes=>nodes.map(el=>({name:getComputedStyle(el).animationName,opacity:getComputedStyle(el).opacity,transform:getComputedStyle(el).transform})));
    assert(results.home.reduced.every(animation=>animation.name==='none'&&animation.opacity==='1'&&animation.transform==='none'));
    const scripts=await page.locator('script[src]').count();results.home.scriptCount=scripts;
    await context.close();context=undefined;
    const noJs=await browser.newContext({javaScriptEnabled:false});page=await noJs.newPage();await page.goto(origin+'/');assert(await page.locator('h1').isVisible());await noJs.close();results.home.withoutJavaScript=true;
    fs.writeFileSync(path.join(out,'stage2-browser-results.json'),JSON.stringify(results,null,2));
    console.log('RESULT',JSON.stringify({reopenCycles:results.reopenCycles.length,publicOfflinePages:10,bannerChecks:results.bannerChecks.length,privateCacheViolations:results.cacheAudit.violations.length,formPreserved:true,reducedMotion:true}));
  }finally{await context?.close();await browser?.close();await new Promise(resolve=>server.close(resolve));await new Promise(resolve=>networkGate.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
