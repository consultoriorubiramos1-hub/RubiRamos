const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'../public/sw.js'),'utf8');

function worker() {
  const events = {}, stored = [], deleted = [], network = [];
  const cache = {addAll:async paths=>stored.push(...paths),put:async request=>stored.push(request.url),keys:async()=>[],delete:async()=>{}};
  const context = {
    URL, Response,
    self:{location:{origin:'https://example.test'},addEventListener:(name,callback)=>events[name]=callback,clients:{claim:async()=>{}},skipWaiting:()=>{}},
    caches:{open:async()=>cache,match:async()=>new Response('PUBLIC OFFLINE'),keys:async()=>['rubi-pwa-old-static','other-app-cache'],delete:async key=>deleted.push(key)},
    fetch:async request=>{network.push(request.url);return {ok:true,type:'basic',redirected:false,headers:new Headers(),clone:()=>new Response('public asset')};},
  };
  vm.runInNewContext(source,context);
  function request(url,method='GET',extra={}) {
    let response;
    events.fetch({request:{url:'https://example.test'+url,method,mode:'cors',headers:new Headers(),...extra},respondWith:r=>response=r});
    return response;
  }
  return {events,stored,deleted,network,context,request};
}

test('No API, authentication, clinical, payment or write response is cached',async()=>{
  const w=worker();
  for(const path of ['/api/auth/session','/api/mobile/historial','/api/db/export','/admin/patient/historial','/catalog','/login','/manifest.json','/_next/image?url=private','/_next/static/chunk.js?token=x'])assert.equal(w.request(path),undefined,path);
  for(const method of ['POST','PUT','PATCH','DELETE'])assert.equal(w.request('/api/mobile/citas',method),undefined);
  assert.equal(w.request('/_next/static/chunk.js','GET',{headers:new Headers({Authorization:'Bearer test'})}),undefined);
  for(const header of ['RSC','Next-Action','Next-Router-Prefetch'])assert.equal(w.request('/_next/static/chunk.js','GET',{headers:new Headers({[header]:'1'})}),undefined);
  assert.deepEqual(w.stored,[]);
});

test('Only explicitly public assets and immutable bundles use Cache First',async()=>{
  const w=worker();w.context.caches.match=async()=>undefined;
  for(const path of ['/logo_rubi.png','/icons/icon-512x512.png','/_next/static/chunks/abc123.js'])await w.request(path);
  assert.deepEqual(w.stored,['https://example.test/logo_rubi.png','https://example.test/icons/icon-512x512.png','https://example.test/_next/static/chunks/abc123.js']);
});

test('Install precaches the static offline document; activation deletes only owned old caches',async()=>{
  const w=worker();let pending;
  w.events.install({waitUntil:p=>pending=p});await pending;
  assert(w.stored.includes('/offline'));assert(!w.stored.includes('/'));
  w.events.activate({waitUntil:p=>pending=p});await pending;
  assert.deepEqual(w.deleted,['rubi-pwa-old-static']);
});

test('Offline private navigation receives only the public fallback, with no data persistence',async()=>{
  const w=worker();w.context.fetch=async()=>{throw Error('offline');};
  const response=await w.request('/admin/patient/historial','GET',{mode:'navigate'});
  assert.equal(await response.text(),'PUBLIC OFFLINE');assert.deepEqual(w.stored,[]);
});

test('Private, no-store and redirected asset responses are never persisted',async()=>{
  for(const policy of [{cacheControl:'private'},{cacheControl:'no-store'},{redirected:true}]){
    const w=worker();w.context.caches.match=async()=>undefined;
    w.context.fetch=async()=>({ok:true,type:'basic',redirected:!!policy.redirected,headers:new Headers({'Cache-Control':policy.cacheControl||''}),clone:()=>new Response('asset')});
    await w.request('/_next/static/chunks/abc123.js');assert.deepEqual(w.stored,[]);
  }
});

test('An update activates only after the explicit user update message',async()=>{
  const w=worker();let activated=false,pending;w.context.self.skipWaiting=()=>{activated=true;};
  w.events.install({waitUntil:p=>pending=p});await pending;assert.equal(activated,false);
  w.events.message({data:{type:'OTHER'}});assert.equal(activated,false);
  w.events.message({data:{type:'ACTIVATE_UPDATE'}});assert.equal(activated,true);
});
