import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { renderDiagramSvg } from '../src/lib/docs/diagrams/render.ts';

// Only top-level fenced diagram blocks are exported. Other fenced examples,
// including four-backtick Markdown examples that contain diagram fences, are
// treated as opaque content.
export function extractDiagrams(markdown) {
  const diagrams = [];
  let fence;
  for (const [index, line] of markdown.replace(/\r\n/g, '\n').split('\n').entries()) {
    if (fence) {
      const close = line.match(/^\s*([`]{3,}|~{3,})\s*$/);
      if (close && close[1][0] === fence.marker[0] && close[1].length >= fence.marker.length) {
        if (fence.diagram) diagrams.push({ line: fence.line, source: fence.body.join('\n') });
        fence = undefined;
      } else if (fence.diagram) fence.body.push(line);
      continue;
    }
    const open = line.match(/^\s*([`]{3,}|~{3,})\s*(.*?)\s*$/);
    if (open) fence = { marker: open[1], diagram: /^diagram(?:\s|$)/i.test(open[2]), line: index + 1, body: [] };
  }
  if (fence?.diagram) throw new Error('Unclosed diagram fence at line ' + fence.line);
  return diagrams;
}

async function main() {
  const [sourceFile, outputDirectory, theme = 'both'] = process.argv.slice(2);
  if (!sourceFile || !outputDirectory || !['light', 'dark', 'both'].includes(theme)) {
    throw new Error('Usage: npm run diagrams:export -- <article.md|diagram.json> <output-directory> [light|dark|both]');
  }
  const input = await readFile(sourceFile, 'utf8');
  const diagrams = path.extname(sourceFile).toLowerCase() === '.json'
    ? [{ line: 1, source: input }] : extractDiagrams(input);
  if (!diagrams.length) throw new Error('No diagram blocks found in ' + sourceFile);
  const stem = path.basename(sourceFile, path.extname(sourceFile));
  const themes = theme === 'both' ? ['light', 'dark'] : [theme];
  // Render everything before writing, to avoid partial exports on malformed input.
  const outputs = [];
  for (const [index, diagram] of diagrams.entries()) {
    for (const variant of themes) {
      try {
        outputs.push({ name: stem + '-' + (index + 1) + '-' + variant + '.svg',
          svg: renderDiagramSvg(diagram.source, variant) });
      } catch (error) {
        throw new Error(sourceFile + ':' + diagram.line + ': ' + error.message, { cause: error });
      }
    }
  }
  await mkdir(outputDirectory, { recursive: true });
  for (const { name, svg } of outputs) {
    const filename = path.join(outputDirectory, name);
    await writeFile(filename, svg + '\n', 'utf8');
    console.log(filename);
  }
}

import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
