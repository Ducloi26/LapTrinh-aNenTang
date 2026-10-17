const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '..');

function loadModule(file, mocks = {}, globals = {}, cache = new Map()) {
  file = path.resolve(root, file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const localRequire = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id.endsWith('.wav')) return id;
    if (id.startsWith('.')) return loadModule(path.resolve(path.dirname(file), `${id}.ts`), mocks, globals, cache);
    return require(id);
  };
  vm.runInNewContext(code, { module, exports: module.exports, require: localRequire, process, console, setTimeout, clearTimeout, URL, AbortController, performance, ...globals }, { filename: file });
  return module.exports;
}

module.exports = { loadModule };
