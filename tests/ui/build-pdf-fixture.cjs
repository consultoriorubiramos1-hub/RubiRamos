const fs=require('node:fs'), path=require('node:path');
const {webpack}=require('next/dist/compiled/webpack/webpack');
const out=path.resolve(__dirname,'../../tmp/qa/ui');
fs.mkdirSync(out,{recursive:true});
webpack({mode:'development',devtool:false,entry:path.join(__dirname,'pdf-fixture.tsx'),
  output:{path:out,filename:'pdf-fixture.js'},resolve:{extensions:['.tsx','.ts','.js']},
  module:{rules:[{test:/\.tsx?$/,exclude:/node_modules/,use:path.join(__dirname,'compile-loader.cjs')}]},
},(error,stats)=>{
  if(error||stats.hasErrors()){console.error(error||stats.toString({all:false,errors:true}));process.exitCode=1;return;}
  fs.writeFileSync(path.join(out,'pdf.html'),'<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script src="/pdf-fixture.js"></script></body></html>');
  console.log('Fixture PDF con renderer real creada.');
});
