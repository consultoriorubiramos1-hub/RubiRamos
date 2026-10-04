const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');
const {createRequire}=require('node:module'),{pathToFileURL}=require('node:url');
const deps=process.env.CODEX_TEST_NODE_MODULES?createRequire(path.join(process.env.CODEX_TEST_NODE_MODULES,'package.json')):require;
const {chromium}=deps('playwright');
const root=path.resolve(__dirname,'../tmp/qa/ui'),out=path.resolve(__dirname,'../tmp/qa/pdf');
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(error,body)=>{if(error){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');res.end(body);});
});
(async()=>{
  const canvas=deps('@napi-rs/canvas');Object.assign(globalThis,{DOMMatrix:canvas.DOMMatrix,ImageData:canvas.ImageData,Path2D:canvas.Path2D});
  const pdfjs=await import(pathToFileURL(deps.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href);
  await new Promise(resolve=>server.listen(3102,'127.0.0.1',resolve));fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,...(process.env.TEST_BROWSER_CHANNEL?{channel:process.env.TEST_BROWSER_CHANNEL}:{})});
  const context=await browser.newContext({acceptDownloads:true});
  await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  const page=await context.newPage(),layouts={};
  try{
    for(const width of [320,1440]){
      await page.setViewportSize({width,height:900});await page.goto('http://127.0.0.1:3102/pdf.html');
      for(const [role,label] of [['admin','Descargar administrador'],['patient','Descargar paciente']]){
        const link=page.getByRole('link',{name:label,exact:true});await page.waitForFunction(label=>[...document.querySelectorAll('a')].some(a=>a.textContent===label&&a.href.startsWith('blob:')),label);
        const downloading=page.waitForEvent('download');await link.click();const download=await downloading;
        const filename=path.join(out,`browser-${role}-${width}.pdf`);await download.saveAs(filename);
        const doc=await pdfjs.getDocument({data:new Uint8Array(fs.readFileSync(filename)),useSystemFonts:false,standardFontDataUrl:path.join(path.dirname(deps.resolve('pdfjs-dist/package.json')),'standard_fonts').replaceAll('\\','/')+'/'}).promise;
        const layout=[];for(let n=1;n<=doc.numPages;n++){const p=await doc.getPage(n);assert(Math.abs(p.view[2]-595.28)<1);assert(Math.abs(p.view[3]-841.89)<1);const text=await p.getTextContent();layout.push(text.items.map(x=>({text:x.str,x:Math.round(x.transform[4]*100)/100,y:Math.round(x.transform[5]*100)/100})));}
        if(width===320)layouts[role]=layout;else assert.deepEqual(layout,layouts[role],`Layout ${role} must be independent of viewport`);
        console.log(JSON.stringify({role,width,pages:doc.numPages,download:'passed'}));await doc.destroy();
      }
    }
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
