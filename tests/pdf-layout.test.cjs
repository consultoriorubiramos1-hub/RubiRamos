const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const { pathToFileURL } = require('node:url');
const { createRequire } = require('node:module');
const data = require('./ui/data.cjs');
const root = path.resolve(__dirname,'..');
const out = path.join(root,'tmp/qa/pdf');
fs.mkdirSync(out,{recursive:true});
Module._extensions['.tsx'] = (module,filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{
  compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true},
}).outputText,filename);

(async()=>{
  const renderer = await import('@react-pdf/renderer');
  const deps = process.env.CODEX_TEST_NODE_MODULES ? createRequire(path.join(process.env.CODEX_TEST_NODE_MODULES,'package.json')) : require;
  const { createCanvas, DOMMatrix, ImageData, Path2D } = deps('@napi-rs/canvas');
  globalThis.DOMMatrix = DOMMatrix; globalThis.ImageData=ImageData; globalThis.Path2D=Path2D;
  const pdfjs = await import(pathToFileURL(deps.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href);
  const components = [
    ['admin', require('../src/components/medical-history/AdminMedicalHistoryPDF.tsx').default],
    ['patient', require('../src/components/patient-medical-history/MedicalHistoryPDF.tsx').default],
  ];
  const repeated='Texto ficticio suficientemente largo para comprobar saltos de página y separación de contenido. '.repeat(100);
  const cases = {
    minimal: {patient:data.patient,initialEvaluation:null,followUpEvaluations:[],nutritionPlan:null,generalRecommendations:[]},
    normal: {patient:data.patient,initialEvaluation:data.evaluation,followUpEvaluations:[data.evaluation],nutritionPlan:data.plan,generalRecommendations:[{id:1,is_active:true,display_order:1,type:'text',title:'Recomendación ficticia',content:'Consejo ficticio para revisar el diseño.'}]},
    stress: {patient:data.patient,initialEvaluation:{...data.evaluation,personal_history:{current_diseases:repeated}},followUpEvaluations:Array.from({length:60},(_,i)=>({...data.evaluation,id:i,nutritional_diagnosis:{diagnosis:'Diagnóstico ficticio número '+i}})),nutritionPlan:{...data.plan,menus:{...data.plan.menus,MENU_1:{...data.plan.menus.MENU_1,meals:{...data.plan.menus.MENU_1.meals,DESAYUNO:{description:repeated}}}}},generalRecommendations:[{id:1,is_active:true,display_order:1,type:'text',title:'Recomendación ficticia larga',content:repeated}]},
  };
  const results=[];
  for(const [role,Component] of components)for(const [scenario,props] of Object.entries(cases)){
    const buffer=await renderer.renderToBuffer(React.createElement(Component,props));
    fs.writeFileSync(path.join(out,`${role}-${scenario}.pdf`),buffer);
    const standardFonts = path.join(path.dirname(deps.resolve('pdfjs-dist/package.json')),'standard_fonts').replaceAll('\\','/') + '/';
    const doc=await pdfjs.getDocument({data:new Uint8Array(buffer),useSystemFonts:false,standardFontDataUrl:standardFonts}).promise;
    const violations=[];
    let content='';
    for(let number=1;number<=doc.numPages;number++){
      const page=await doc.getPage(number);const viewport=page.getViewport({scale:1});
      assert(Math.abs(viewport.width-595.28)<1,'A4 width');assert(Math.abs(viewport.height-841.89)<1,'A4 height');
      const text=await page.getTextContent();content+=text.items.map(x=>x.str).join(' ');
      for(const item of text.items){if(!item.str?.trim())continue;const x=item.transform[4],y=item.transform[5];if(x<38||x+item.width>viewport.width-38||y<28||y>viewport.height-28)violations.push({page:number,text:item.str.slice(0,80),x,y,width:item.width});}
      if(scenario==='normal'||(scenario==='stress'&&[1,2,doc.numPages].includes(number))){const canvas=createCanvas(Math.ceil(viewport.width*1.5),Math.ceil(viewport.height*1.5));await page.render({canvasContext:canvas.getContext('2d'),viewport:page.getViewport({scale:1.5})}).promise;fs.writeFileSync(path.join(out,`${role}-${scenario}-${number}.png`),canvas.toBuffer('image/png'));}
    }
    assert(content.includes('Paciente de prueba'),'Patient identity retained');
    if(scenario!=='minimal')assert(content.includes('Alimentos ficticios')&&content.includes('Recomendación ficticia'),'Plan and recommendations retained');
    const result={role,scenario,pages:doc.numPages,violations};results.push(result);console.log(JSON.stringify(result));
    await doc.destroy();
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
  assert(results.every(x=>x.violations.length===0),'No text may extend beyond document margins');
})().catch(error=>{console.error(error);process.exitCode=1;});
