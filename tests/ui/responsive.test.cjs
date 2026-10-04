const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const dependencyRequire = process.env.CODEX_TEST_NODE_MODULES ? createRequire(path.join(process.env.CODEX_TEST_NODE_MODULES,'package.json')) : require;
const { chromium } = dependencyRequire('playwright');
const root = path.resolve(__dirname,'../..');
const fixtureRoot = path.join(root,'tmp/qa/ui');
const sizes = [[320,568],[360,800],[375,667],[390,844],[412,915],[414,896],[430,932],[640,960],[768,1024],[1024,768],[1280,800],[1440,900],[1920,1080]];
const allScreens = ['admin-calendar','patient-calendar','patients','products','catalog','patient-edit','product-edit','clinical-initial','clinical-followup','settings','appointment-admin','patient-appointment','patient-profile','patient-dashboard','admin-dashboard','patient-progress','patient-plan','patient-predictive','patient-history','admin-history','nutrition-plan','menus','appointments','cart','recommendations','admin-posts','patient-posts','post-edit','metrics','audit','db','alexa','payments','admin-predictive'];
const screens = process.env.UI_SCREENS ? process.env.UI_SCREENS.split(',') : allScreens;
const server = http.createServer((req,res)=>{
  const url = new URL(req.url,'http://localhost');
  if(url.pathname.startsWith('/api/db/')){
    const data=require('./data.cjs');
    const payload=url.pathname.endsWith('/stats')?{dbName:'pruebas',dbSizePretty:'2 MB',backupsCount:1,backupsTotalPretty:'1 MB'}:url.pathname.endsWith('/export')?['tabla_ficticia']:url.pathname.endsWith('/backups')?[{filename:'respaldo_ficticio.tar',sizeBytes:1024,createdAt:data.dateString,downloadUrl:'/respaldo_ficticio.tar'}]:[{id:'999999',username:'pruebas',email:data.patient.email,rol:'Paciente',rol_id:'2',verified:true,active:true,created_at:data.dateString,updated_at:data.dateString}];
    res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true,data:payload}));return;
  }
  const base = /\.(png|svg|ico)$/.test(url.pathname) ? path.join(root,'public') : fixtureRoot;
  const filename = path.resolve(base, '.'+(url.pathname==='/'?'/index.html':url.pathname));
  if(!filename.startsWith(base+path.sep)) {res.writeHead(403);res.end();return;}
  fs.readFile(filename,(error,body)=>{
    if(error){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',filename.endsWith('.js')?'application/javascript':filename.endsWith('.css')?'text/css':filename.endsWith('.png')?'image/png':filename.endsWith('.woff2')?'font/woff2':'text/html; charset=utf-8');
    res.end(body);
  });
});

async function inspect(page) {
  return page.evaluate(()=>{
    // Deliberately expose overflow instead of hiding it during validation.
    document.documentElement.style.overflowX='visible';
    document.body.style.overflowX='visible';
    const width=document.documentElement.clientWidth;
    const outside=[...document.querySelectorAll('button,input,select,textarea,a,h1,h2,h3,p')].filter(el=>{
      const rect=el.getBoundingClientRect(),style=getComputedStyle(el);
      if(!rect.width||!rect.height||style.visibility==='hidden'||style.display==='none')return false;
      if(el.closest('.table-viewport,.calendar-scroll,thead'))return false;
      return rect.left < -1 || rect.right > width+1;
    }).slice(0,8).map(el=>({tag:el.tagName,text:(el.textContent||el.getAttribute('aria-label')||'').slice(0,70),className:el.className,rect:{left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right}}));
    const modals=[...document.querySelectorAll('.modal-surface')].map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};});
    return {width,scrollWidth:document.documentElement.scrollWidth,outside,modals,text:document.body.innerText.slice(0,200)};
  });
}

(async()=>{
  await new Promise(resolve=>server.listen(3101,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true, ...(process.env.TEST_BROWSER_CHANNEL ? {channel:process.env.TEST_BROWSER_CHANNEL} : {})});
  const context=await browser.newContext({timezoneId:'America/Mexico_City'});
  await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  const page=await context.newPage();
  let errors=[]; page.on('pageerror',error=>errors.push(error.message));
  const results=[];
  try {
    for(const screen of screens){
      for(const [width,height] of sizes){
        errors=[];
        await page.setViewportSize({width,height});
        await page.goto(`http://127.0.0.1:3101/?screen=${screen}`,{waitUntil:'networkidle'});
        await page.waitForTimeout(80);
        const result=await inspect(page);
        const pass=errors.length===0&&result.scrollWidth<=result.width+1&&result.outside.length===0&&result.modals.every(r=>r.left>=15&&r.right<=width-15&&r.top>=15&&r.bottom<=height-15)&&result.text.length>30;
        results.push({screen,width,height,pass,...result,errors:[...errors]});
        if(!pass)console.log('FAIL',screen,width,JSON.stringify({scroll:result.scrollWidth,outside:result.outside,modals:result.modals,errors}));
        if(width===320||width===1440)await page.screenshot({path:path.join(root,`tmp/qa/${screen}-${width}.png`),fullPage:true});
      }
      console.log('CHECKED',screen);
    }
    // Verify preservation of handlers and keyboard access with simulated records.
    await page.setViewportSize({width:320,height:568});
    await page.goto('http://127.0.0.1:3101/?screen=patients');
    await page.getByRole('button',{name:'Ver detalles'}).click();
    await page.getByRole('dialog').waitFor();
    assert(await page.evaluate(()=>!!document.activeElement.closest('[role="dialog"]')));
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(),0);
    await page.goto('http://127.0.0.1:3101/?screen=products');
    await page.getByTitle('Editar',{exact:true}).click();
    await page.getByRole('dialog').waitFor();
    assert.equal(await page.locator('[role="dialog"] input').first().inputValue(),'Suplemento con nombre largo de prueba');
    await page.getByRole('dialog').getByRole('button',{name:'Actualizar',exact:true}).click();
    await page.waitForFunction(()=>window.__calls.some(call=>call.name==='actualizarProducto'));
    assert.equal(await page.evaluate(()=>window.__calls.find(call=>call.name==='actualizarProducto').args[0].get('id')),'999999');
    await page.goto('http://127.0.0.1:3101/?screen=patient-edit');
    await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();
    await page.waitForFunction(()=>window.__calls.some(call=>call.name==='updatePatient'));
    assert.equal(await page.evaluate(()=>window.__calls.find(call=>call.name==='updatePatient').args[0]),999999);
    await page.goto('http://127.0.0.1:3101/?screen=products');
    await page.getByTitle('Eliminar',{exact:true}).click();
    await page.getByRole('dialog').waitFor();
    assert.equal(await page.evaluate(()=>window.__calls.some(call=>call.name==='eliminarProducto')),false);
    await page.getByRole('dialog').getByRole('button',{name:'Eliminar',exact:true}).click();
    await page.waitForFunction(()=>window.__calls.some(call=>call.name==='eliminarProducto'));
    for(const screen of ['admin-calendar','patient-calendar']){
      await page.goto(`http://127.0.0.1:3101/?screen=${screen}`);
      const before=await page.getByRole('region',{name:'Calendario mensual'}).innerText();
      await page.getByRole('button',{name:'Mes siguiente',exact:true}).click();
      assert.notEqual(await page.getByRole('region',{name:'Calendario mensual'}).innerText(),before);
      await page.getByRole('region',{name:'Calendario mensual'}).evaluate(el=>el.scrollLeft=el.scrollWidth);
      assert.equal((await inspect(page)).scrollWidth,320);
    }
    for(const screen of ['admin-posts','patient-posts']){
      await page.goto(`http://127.0.0.1:3101/?screen=${screen}`);
      await page.getByRole('button',{name:'Ampliar imagen',exact:true}).first().click();
      const dialog=page.getByRole('dialog');await dialog.waitFor();
      const result=await inspect(page);assert.equal(result.outside.length,0);assert.equal(result.scrollWidth,320);
      await dialog.getByRole('button',{name:'Imagen siguiente',exact:true}).click();
      assert((await dialog.locator('img').getAttribute('src')).endsWith('/prowinner.png'));
      await page.keyboard.press('Escape');assert.equal(await dialog.count(),0);
    }
    for(const screen of ['patients','patient-dashboard']){
      await page.goto(`http://127.0.0.1:3101/?screen=${screen}`);
      const toggle=page.getByRole('button',{name:'Abrir menú',exact:true});await toggle.click();
      const menu=page.locator(screen==='patients'?'#dashboard-mobile-menu':'#patient-mobile-menu');
      const bounds=await menu.boundingBox();assert(bounds.x>=16&&bounds.x+bounds.width<=304&&bounds.y+bounds.height<=568);
      await page.getByRole('button',{name:'Cerrar menú',exact:true}).click();assert.equal(await menu.count(),0);
      await toggle.click();
      await menu.getByRole('link').first().focus();await page.keyboard.press('Escape');assert.equal(await menu.count(),0);
      assert.equal(await toggle.evaluate(el=>el===document.activeElement),true);
    }
    const summary={checks:results.length,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length,results};
    fs.writeFileSync(path.join(root,process.env.UI_SCREENS?'tmp/qa/responsive-subset-results.json':'tmp/qa/responsive-results.json'),JSON.stringify(summary,null,2));
    console.log('RESULT',JSON.stringify({checks:summary.checks,passed:summary.passed,failed:summary.failed}));
    if(summary.failed)process.exitCode=1;
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
