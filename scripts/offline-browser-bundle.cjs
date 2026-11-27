// Test-only local bundle: no React UI, no Vite, no network. Never ship as the app.
const fs = require('node:fs');
const path = require('node:path');
const ts = require(process.env.TYPESCRIPT_PATH || 'typescript');
const root = path.resolve(__dirname, '..');
const modules = {};
for (const dir of ['src/engine', 'src/media', 'src/export', 'tests']) {
  for (const file of fs.readdirSync(path.join(root, dir))) {
    if (!file.endsWith('.ts')) continue;
    const id = `${dir}/${file}`;
    modules[id] = ts.transpileModule(fs.readFileSync(path.join(root, id), 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    }).outputText;
  }
}
const entries = Object.entries(modules).map(([id, js]) => `${JSON.stringify(id)}:function(require,module,exports){${js}\n}`).join(',\n');
const bundle = `(()=>{const modules={${entries}},cache={};function load(id){if(cache[id])return cache[id].exports;const m=cache[id]={exports:{}};modules[id]((rel)=>{const parts=id.split('/');parts.pop();for(const p of rel.split('/')){if(p==='..')parts.pop();else if(p!=='.')parts.push(p)}return load(parts.join('/'));},m,m.exports);return m.exports;}load('tests/browser-harness.ts');})()`;
const output = process.argv[2];
if (!output) throw Error('Provide an output JS path.');
fs.writeFileSync(output, bundle);
console.log('Engine test bundle:', output);
