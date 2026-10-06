const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/sw.js'),'utf8');
const routes=['/','/servicios','/quienessomos','/politicas','/terminos'];
const index=(release='build1')=>({release,routes:Object.fromEntries(routes.map(route=>[route,`/offline-public/${release}/${route==='/'?'index':route.slice(1)}.html`])),assets:[...routes.map(route=>`/offline-public/${release}/${route==='/'?'index':route.slice(1)}.html`),'/_next/static/site.css','/logo_rubi.png','/offline-status.js']});
function worker(){
  const events={},stores=new Map(),network=[],deleted=[];
  const absolute=value=>new URL(typeof value==='string'?value:value.url,'https://example.test').href;
  const open=async name=>{
    if(!stores.has(name))stores.set(name,new Map());const data=stores.get(name);
    return{match:async key=>data.get(absolute(key))?.clone(),put:async(key,response)=>data.set(absolute(key),response.clone()),keys:async()=>[...data.keys()].map(url=>({url})),delete:async key=>data.delete(absolute(key))};
  };
  const publicResponse=(body,headers={})=>{const response=new Response(body,{headers});Object.defineProperty(response,'type',{value:'basic'});return response;};
  const context={URL,Response,Headers,AbortController,setTimeout,clearTimeout,
    self:{location:{origin:'https://example.test'},addEventListener:(name,callback)=>events[name]=callback,clients:{claim:async()=>{}},skipWaiting:()=>{}},
    caches:{open,match:async key=>{for(const name of stores.keys()){const r=await(await open(name)).match(key);if(r)return r;}},keys:async()=>[...stores.keys()],delete:async name=>{deleted.push(name);return stores.delete(name);}},
    fetch:async(request,options)=>{const url=absolute(request);network.push({url,options});return publicResponse(url.endsWith('/index.json')?JSON.stringify(index()):url.endsWith('/offline')?'PUBLIC FALLBACK':url.includes('/offline-public/')?'PUBLIC SNAPSHOT':'PUBLIC ASSET');}
  };
  vm.runInNewContext(source,context);
  function request(url,method='GET',extra={}){let response;events.fetch({request:{url:'https://example.test'+url,method,mode:'cors',headers:new Headers(),...extra},respondWith:value=>response=value});return response;}
  async function event(name,extra={}){let pending;events[name]({...extra,waitUntil:value=>pending=value});await pending;}
  return{context,events,stores,network,deleted,request,event,open,publicResponse};
}
test('APIs, private endpoints, writes, RSC, auth headers and external hosts bypass the worker',async()=>{
  const w=worker();
  for(const url of ['/api/auth/session','/api/mobile/historial','/api/db/export','/admin/patient/historial','/catalog','/login','/_next/image?url=private','/_next/static/chunk.js?token=x'])assert.equal(w.request(url),undefined,url);
  for(const method of ['POST','PUT','PATCH','DELETE'])assert.equal(w.request('/servicios',method),undefined);
  for(const header of ['Authorization','RSC','Next-Action','Next-Router-Prefetch'])assert.equal(w.request('/_next/static/a.js','GET',{headers:new Headers({[header]:'test'})}),undefined);
  assert.equal(w.request('/asset','GET',{url:'https://external.test/logo_rubi.png'}),undefined);
  assert.equal(w.stores.size,0);
});
test('Only approved public assets enter the bounded runtime cache',async()=>{
  const w=worker();
  for(const url of ['/logo_rubi.png','/_next/static/chunks/abc.js'])await w.request(url);
  await w.request('/private-clinical.png');
  const keys=[...w.stores.get('rubi-pwa-v2-runtime').keys()];
  assert.deepEqual(keys,['https://example.test/logo_rubi.png','https://example.test/_next/static/chunks/abc.js']);
});
test('Install pins a complete public release, shell and manifest; all precache requests omit credentials',async()=>{
  const w=worker();await w.event('install');
  const shell=await w.open('rubi-pwa-v2-shell');
  assert(await shell.match('/offline'));assert(await shell.match('/manifest.json'));
  assert(await shell.match('/offline-public/index.json'));assert(!(await shell.match('/')));
  assert(w.network.every(({options})=>options.credentials==='omit'));
  assert(w.stores.get('rubi-pwa-public-build1').size===index().assets.length);
});
test('Live HTML with a session marker is never stored, even on a public URL',async()=>{
  const w=worker();w.context.fetch=async()=>w.publicResponse('PRIVATE_SESSION_MARKER');
  assert.equal(await(await w.request('/','GET',{mode:'navigate'})).text(),'PRIVATE_SESSION_MARKER');
  assert.equal(w.stores.size,0);
});
test('Offline public navigation receives the snapshot; private and query URLs get the clean fallback',async()=>{
  const w=worker();await w.event('install');w.context.fetch=async()=>{throw Error('offline');};
  for(const url of routes)assert.equal(await(await w.request(url,'GET',{mode:'navigate'})).text(),'PUBLIC SNAPSHOT');
  for(const url of ['/admin','/admin/patient/historial','/login','/catalog','/?token=private'])assert.equal(await(await w.request(url,'GET',{mode:'navigate'})).text(),'PUBLIC FALLBACK');
  assert(![...w.stores.values()].some(data=>[...data.keys()].some(url=>/\/admin|\/api|token=/.test(url))));
});
test('Interrupted public refresh keeps the last complete release active',async()=>{
  const w=worker();await w.event('install');
  w.context.fetch=async request=>{const url=typeof request==='string'?request:request.url;if(url.endsWith('/index.json'))return w.publicResponse(JSON.stringify(index('build2')));throw Error('interrupted');};
  await w.event('message',{data:{type:'REFRESH_PUBLIC_CONTENT'}});
  const active=await(await(await w.open('rubi-pwa-v2-shell')).match('/offline-public/index.json')).json();
  assert.equal(active.release,'build1');assert(w.stores.has('rubi-pwa-public-build1'));
});
test('A complete refresh selects the new release and refreshes the manifest without losing the previous release',async()=>{
  const w=worker();await w.event('install');
  for(const release of ['build2','build3']){
    w.context.fetch=async request=>{
      const url=typeof request==='string'?request:request.url;
      return w.publicResponse(url.endsWith('/index.json')?JSON.stringify(index(release)):`PUBLIC ${release}`);
    };
    await w.event('message',{data:{type:'REFRESH_PUBLIC_CONTENT'}});
    const shell=await w.open('rubi-pwa-v2-shell');
    assert.equal((await(await shell.match('/offline-public/index.json')).json()).release,release);
    assert.equal(await(await shell.match('/manifest.json')).text(),`PUBLIC ${release}`);
    assert.equal(await(await w.request('/logo_rubi.png')).text(),`PUBLIC ${release}`);
  }
  assert(w.stores.has('rubi-pwa-public-build2'));assert(w.stores.has('rubi-pwa-public-build3'));assert(!w.stores.has('rubi-pwa-public-build1'));
});
test('Malformed inventory cannot cache API, login, private routes, query or remote assets',async()=>{
  for(const asset of ['/api/auth/session','/api/private.png','/admin/patient/private.png','/login','/admin/patient','https://external.test/a.png','/photo.png?token=private','/../../private.png']){
    const w=worker();const bad=index();bad.assets.push(asset);
    w.context.fetch=async request=>w.publicResponse(typeof request==='string'&&request.endsWith('/index.json')?JSON.stringify(bad):'PUBLIC FALLBACK');
    await w.event('install');assert(!w.stores.has('rubi-pwa-public-build1'));
  }
});
test('Runtime eviction does not delete pinned shell, documents or their CSS',async()=>{
  const w=worker();await w.event('install');
  for(let i=0;i<125;i++)await w.request(`/_next/static/chunks/test${i}.js`);
  assert.equal(w.stores.get('rubi-pwa-v2-runtime').size,120);
  assert(await(await w.open('rubi-pwa-v2-shell')).match('/offline'));
  assert(await(await w.open('rubi-pwa-public-build1')).match('/_next/static/site.css'));
  assert(await(await w.open('rubi-pwa-public-build1')).match('/offline-public/build1/index.html'));
});
test('Private, no-store and redirected responses are not persisted',async()=>{
  for(const policy of [{cacheControl:'private'},{cacheControl:'no-store'},{redirected:true}]){
    const w=worker();w.context.fetch=async()=>{const r=w.publicResponse('asset',{'Cache-Control':policy.cacheControl||''});Object.defineProperty(r,'redirected',{value:!!policy.redirected});return r;};
    await w.request('/_next/static/a.js');assert(!w.stores.has('rubi-pwa-v2-runtime'));
  }
});
test('Activation cleans only owned old shell/runtime caches, keeping complete public releases',async()=>{
  const w=worker();for(const key of ['rubi-pwa-v1-static','rubi-pwa-v1-shell','other-app-cache','rubi-pwa-public-build0'])await w.open(key);
  await w.event('activate');assert.deepEqual(w.deleted,['rubi-pwa-v1-static','rubi-pwa-v1-shell']);
});
test('An update activates only after the explicit update message',async()=>{
  const w=worker();let activated=false;w.context.self.skipWaiting=()=>{activated=true;};
  await w.event('install');assert.equal(activated,false);
  await w.event('message',{data:{type:'OTHER'}});assert.equal(activated,false);
  await w.event('message',{data:{type:'ACTIVATE_UPDATE'}});assert.equal(activated,true);
});
