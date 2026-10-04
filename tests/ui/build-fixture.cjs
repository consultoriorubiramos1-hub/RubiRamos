const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { webpack } = require('next/dist/compiled/webpack/webpack');
const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'tmp/qa/ui');
fs.mkdirSync(out, {recursive:true});
const mocks = path.join(out, 'mocks');
fs.mkdirSync(mocks, {recursive:true});
const mock = new webpack.NormalModuleReplacementPlugin(/^@\/lib\/(?!utils|definitions)/, resource => {
  const source = path.join(root, 'src', resource.request.slice(2) + '.ts');
  const ast = ts.createSourceFile(source, fs.readFileSync(source,'utf8'), 99, true);
  const names = [];
  for (const node of ast.statements) {
    if (!node.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword)) continue;
    if (ts.isFunctionDeclaration(node) && node.name) names.push(node.name.text);
    if (ts.isVariableStatement(node)) for(const declaration of node.declarationList.declarations) names.push(declaration.name.getText(ast));
  }
  const filename = path.join(mocks, path.basename(source).replace('.ts','.cjs'));
  fs.writeFileSync(filename, `const action=require(${JSON.stringify(path.join(__dirname,'backend-stub.cjs'))});\n` + names.map(n=>`exports.${n}=(...args)=>action(${JSON.stringify(n)},...args);`).join('\n'));
  resource.request = filename;
});
webpack({ mode:'development', devtool:false, context:root, entry:path.join(__dirname,'fixture.tsx'),
  output:{path:out,filename:'fixture.js',publicPath:'/'},
  resolve:{extensions:['.tsx','.ts','.js','.cjs'],alias:{'@':path.join(root,'src'),
    'next/link$':path.join(__dirname,'next-stub.tsx'), 'next/image$':path.join(__dirname,'next-stub.tsx'),
    'next/navigation$':path.join(__dirname,'next-stub.tsx'), 'next-auth/react$':path.join(__dirname,'next-stub.tsx'),
    '@react-pdf/renderer$':path.join(__dirname,'pdf-stub.tsx')}},
  module:{rules:[{test:/\.tsx?$/,exclude:/node_modules/,use:path.join(__dirname,'compile-loader.cjs')}]},
  plugins:[mock],
},async (error, stats) => {
  if(error || stats.hasErrors()) {console.error(error || stats.toString({all:false,errors:true})); process.exitCode=1; return;}
  const { compile } = require('@tailwindcss/node');
  const { Scanner } = require('@tailwindcss/oxide');
  const css = await compile(fs.readFileSync(path.join(root,'src/app/globals.css'),'utf8'),{base:path.join(root,'src/app'), onDependency:()=>{}});
  const scanner = new Scanner({sources:[{base:root,pattern:'src/**/*.tsx',negated:false}]});
  fs.writeFileSync(path.join(out,'styles.css'),css.build(scanner.scan()));
  fs.copyFileSync(path.join(root,'node_modules/next/dist/next-devtools/server/font/geist-latin.woff2'),path.join(out,'geist.woff2'));
  fs.writeFileSync(path.join(out,'index.html'),'<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"><style>@font-face{font-family:Geist;src:url(/geist.woff2)}:root{--font-geist-sans:Geist,system-ui,sans-serif;--font-geist-mono:monospace}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>');
  console.log('Fixture UI creada con componentes reales y backend simulado.');
});
