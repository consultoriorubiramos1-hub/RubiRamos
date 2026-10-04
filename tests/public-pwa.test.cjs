const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const deps=process.env.CODEX_TEST_NODE_MODULES?createRequire(path.join(process.env.CODEX_TEST_NODE_MODULES,'package.json')):require;
const {chromium}=deps('playwright');
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:3100';
const out=path.resolve(__dirname,'../tmp/qa');
const sizes=[[320,568],[360,800],[375,667],[390,844],[412,915],[414,896],[430,932],[640,960],[768,1024],[1024,768],[1280,800],[1440,900],[1920,1080]];
const routes=process.env.PUBLIC_ROUTES?process.env.PUBLIC_ROUTES.split(','):['/','/servicios','/quienessomos','/citas','/login','/login/recuperacion','/login/verificacion','/login/recuperacion/reestablecer','/politicas','/terminos','/historial','/calendar','/bad-request','/offline','/ruta-inexistente'];

(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.TEST_BROWSER_CHANNEL?{channel:process.env.TEST_BROWSER_CHANNEL}:{})});
  const context=await browser.newContext({timezoneId:'America/Mexico_City'});
  const page=await context.newPage();const results=[];
  try{
    for(const route of routes){
      for(const [width,height]of sizes){
        await page.setViewportSize({width,height});
        await page.goto(origin+route,{waitUntil:'networkidle'});
        const result=await page.evaluate(()=>{
          document.documentElement.style.overflowX='visible';document.body.style.overflowX='visible';
          const width=document.documentElement.clientWidth;
          const outside=[...document.querySelectorAll('a,button,input,select,textarea,h1,h2,h3,p')].filter(el=>{
            const r=el.getBoundingClientRect();if(!r.width||!r.height||getComputedStyle(el).display==='none')return false;
            return r.left < -1||r.right>width+1;
          }).slice(0,8).map(el=>({text:(el.textContent||'').slice(0,70),className:el.className,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right}));
          return{width,scrollWidth:document.documentElement.scrollWidth,outside};
        });
        const pass=result.scrollWidth<=width+1&&result.outside.length===0;results.push({route,width,height,pass,...result});
        if(!pass)console.log('FAIL',route,width,JSON.stringify(result));
        if(width===320||width===1440)await page.screenshot({path:path.join(out,`public-${route.replaceAll('/','-')||'home'}-${width}.png`),fullPage:true});
      }
      console.log('CHECKED',route);
    }
    await page.setViewportSize({width:320,height:568});await page.goto(origin+'/');
    await page.getByRole('button',{name:'Abrir menú',exact:true}).click();
    assert(await page.getByRole('link',{name:'Iniciar Sesión',exact:true}).isVisible());
    await page.getByRole('button',{name:'Cerrar menú',exact:true}).click();assert.equal(await page.locator('#public-mobile-menu').count(),0);
    await page.getByRole('button',{name:'Abrir menú',exact:true}).click();
    await page.keyboard.press('Escape');assert.equal(await page.locator('#public-mobile-menu').count(),0);
    assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'),'#6B8E7B');
    const manifest=await (await context.request.get(origin+'/manifest.json')).json();assert.equal(manifest.theme_color,'#6B8E7B');assert.equal(manifest.display,'standalone');
    const swHeaders=(await context.request.get(origin+'/sw.js')).headers();assert(swHeaders['cache-control'].includes('no-store'));
    await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
    await page.reload({waitUntil:'networkidle'});
    const cacheKeys=await page.evaluate(async()=>{
      const urls=[];for(const key of await caches.keys()){const cache=await caches.open(key);for(const request of await cache.keys())urls.push(request.url);}return urls;
    });
    assert(cacheKeys.some(url=>url.endsWith('/offline')));
    assert(cacheKeys.every(url=>!/\/api\/|\/admin\/|\/login|\/catalog/.test(url)));
    await context.setOffline(true);
    await page.goto(origin+'/admin/patient/historial',{waitUntil:'load'});
    assert.equal(await page.locator('h1').innerText(),'Sin conexión');
    assert.equal(await page.locator('main').innerText().then(text=>text.includes('Paciente de prueba')),false);
    await context.setOffline(false);
    await page.getByRole('link',{name:'Reintentar',exact:true}).click();await page.waitForURL(origin+'/');
    const summary={checks:results.length,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length,pwa:'passed',cacheKeys,results};
    fs.writeFileSync(path.join(out,process.env.PUBLIC_ROUTES?'public-pwa-subset-results.json':'public-pwa-results.json'),JSON.stringify(summary,null,2));
    console.log('RESULT',JSON.stringify({checks:summary.checks,passed:summary.passed,failed:summary.failed,pwa:summary.pwa}));
    if(summary.failed)process.exitCode=1;
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
