import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { extractDiagrams } from './export-diagrams.mjs';
import { renderDiagramFigure } from '../packages/visuals/src/index.ts';

/** Compose a standalone page from trusted renderer output and bundled runtime. */
export function composeStandaloneHtml(figures, css, script, lang = 'en') {
  const ru = lang === 'ru';
  // No author-provided JavaScript enters this script element.
  const safeScript = script.replace(/<\/script/gi, '<\\/script');
  return '<!doctype html>\n<html lang="' + (ru ? 'ru' : 'en') + '" class="dark"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"><title>Cvolo Visuals</title>' +
    '<style>html{font:16px/1.5 system-ui,sans-serif;color-scheme:light;background:#fff;color:#27272a}' +
    'html.dark{color-scheme:dark;background:#09090b;color:#e4e4e7}body{margin:0;padding:1.2rem}' +
    'main{max-width:1100px;margin:auto}button,input,select{font:inherit}button{cursor:pointer}' +
    '.portable-header{display:flex;align-items:center;justify-content:space-between;gap:1rem}' +
    '.portable-header h1{font-size:1.2rem}.portable-header button{border:1px solid #71717a;border-radius:.4rem;padding:.3rem .6rem;background:transparent;color:inherit}' +
    css + '</style></head><body><main><header class="portable-header"><h1>Cvolo Visuals</h1>' +
    '<button type="button" data-visual-theme aria-pressed="true">' + (ru ? 'Тёмная тема' : 'Dark theme') + '</button></header>' +
    figures.join('\n') + '</main><script>' + safeScript + '</script></body></html>\n';
}

async function bundleClient() {
  // Vite is already a dev dependency of Book; no new runtime dependencies.
  const { build } = await import('vite');
  const entry = fileURLToPath(new URL('../packages/visuals/src/standalone.ts', import.meta.url));
  const result = await build({
    configFile: false,
    logLevel: 'error',
    build: { write: false, minify: false, sourcemap: false,
      lib: { entry, name: 'CvoloVisuals', formats: ['iife'] },
      rollupOptions: { output: { inlineDynamicImports: true } } }
  });
  const outputs = Array.isArray(result) ? result : [result];
  const assets = outputs.flatMap((item) => item.output ?? []);
  if (assets.length !== 1 || assets[0].type !== 'chunk') throw new Error('Expected a single standalone JavaScript bundle');
  return assets[0].code;
}

async function main() {
  const [sourceFile, outputFile, lang = 'en'] = process.argv.slice(2);
  if (!sourceFile || !outputFile || !['ru','en'].includes(lang)) {
    throw new Error('Usage: npm run diagrams:html -- <article.md|diagram.json> <output.html> [ru|en]');
  }
  const input = await readFile(sourceFile, 'utf8');
  const blocks = path.extname(sourceFile).toLowerCase() === '.json'
    ? [{ line:1, source:input }] : extractDiagrams(input);
  if (!blocks.length) throw new Error('No diagram blocks found in ' + sourceFile);
  const figures = blocks.map((block,i) => {
    try { return renderDiagramFigure(block.source,lang,String(i+1)); }
    catch (error) { throw new Error(sourceFile + ':' + block.line + ': ' + error.message, { cause:error }); }
  });
  const css = await readFile(new URL('../packages/visuals/src/diagram.css',import.meta.url),'utf8');
  const script = await bundleClient();
  const page = composeStandaloneHtml(figures,css,script,lang);
  await mkdir(path.dirname(outputFile),{recursive:true});
  await writeFile(outputFile,page,'utf8');
  console.log(outputFile);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(error.message); process.exitCode=1; });
}
