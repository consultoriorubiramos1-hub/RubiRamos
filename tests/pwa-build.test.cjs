const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
function fixture(content){
  const output=path.join(root,'tmp/qa');fs.mkdirSync(output,{recursive:true});
  const dir=fs.mkdtempSync(path.join(output,'offline-build-test-'));
  for(const sub of ['scripts','.next/server/app','.next/static/chunks','.next/static/media','public/icons'])fs.mkdirSync(path.join(dir,sub),{recursive:true});
  fs.copyFileSync(path.join(root,'scripts/build-public-offline.cjs'),path.join(dir,'scripts/build-public-offline.cjs'));
  fs.writeFileSync(path.join(dir,'.next/BUILD_ID'),'public-test-build');
  fs.writeFileSync(path.join(dir,'.next/static/chunks/site.css'),'@font-face{font-family:Public;src:url(../media/public.woff2)}h1{color:green}');
  fs.writeFileSync(path.join(dir,'.next/static/media/public.woff2'),'PUBLIC FONT');
  fs.writeFileSync(path.join(dir,'public/photo.png'),'PUBLIC IMAGE');
  for(const page of ['index','servicios','quienessomos','politicas','terminos']){
    fs.writeFileSync(path.join(dir,'.next/server/app',`${page}.html`),`<html><head><title>Public</title><link rel="stylesheet" href="/_next/static/chunks/site.css"></head><body class="public-body"><header>PRIVATE_SESSION_IN_HEADER</header><main id="main-content"><h1>Public content</h1>${content}</main><script>self.__next_f.push('PRIVATE_SESSION_IN_RSC')</script></body></html>`);
  }
  return{dir,build:()=>execFileSync(process.execPath,[path.join(dir,'scripts/build-public-offline.cjs')],{encoding:'utf8',stdio:'pipe'})};
}
test('Offline documents contain only public main content and local dependencies, excluding root session and RSC',()=>{
  const f=fixture('<img src="/_next/image?url=%2Fphoto.png&amp;w=640&amp;q=75" srcset="private" alt="Public photo"><main>Nested public content</main>');f.build();
  const index=JSON.parse(fs.readFileSync(path.join(f.dir,'public/offline-public/index.json'),'utf8'));
  const html=fs.readFileSync(path.join(f.dir,'public',index.routes['/']),'utf8');
  assert(html.includes('Public content'));assert(html.includes('Nested public content'));assert(html.includes('src="/photo.png"'));
  assert(!html.includes('PRIVATE_SESSION'));assert(!html.includes('self.__next_f'));assert(!html.includes('/_next/image'));assert(!html.includes('srcset='));
  assert(index.assets.includes('/_next/static/media/public.woff2'));assert(index.assets.includes('/photo.png'));
  assert.equal(Object.keys(index.routes).length,5);
  assert.deepEqual([...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(m=>m[1]),['/offline-status.js']);
});
test('Future forms, inline scripts, handlers and private/remote images fail the build instead of being persisted',()=>{
  for(const content of ['<form><input name="secret"></form>','<script>private()</script>','<p onclick="private()">Unsafe</p>','<img src="https://external.test/private.png">','<img src="/api/private.png">']){
    const f=fixture(content);assert.throws(f.build);assert(!fs.existsSync(path.join(f.dir,'public/offline-public/index.json')));
  }
});
