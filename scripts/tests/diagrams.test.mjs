import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderDiagramSvg, renderDiagramFigure } from '../../src/lib/docs/diagrams/render.ts';
import { extractDiagrams } from '../export-diagrams.mjs';

const example = {
  title: 'Transfer', caption: 'No duplicate resource',
  body: { kind: 'column', gap: 28, children: [
    { kind: 'node', id: 'a', code: 'first', moved: true, text: 'Moved' },
    { kind: 'node', id: 'b', title: 'Resource', tone: 'owner' }
  ] },
  edges: [{ from: 'a', to: 'b' }]
};
const source = JSON.stringify(example);

test('standalone SVG has fixed theme, dimensions, accessible title and an arrow', () => {
  const svg = renderDiagramSvg(source);
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, /viewBox="0 0 \d+ \d+"/);
  assert.match(svg, /<title>Transfer<\/title>/);
  assert.match(svg, /stroke-dasharray="6 4"/);
  assert.match(svg, /text-decoration="line-through"/);
  assert.match(svg, /<polygon/);
  assert.ok(!svg.includes('var(--'));
  assert.notEqual(svg, renderDiagramSvg(source, 'dark'));
  assert.equal(svg, renderDiagramSvg(source));
});

test('embedded figure uses theme variables and exports both standalone SVG variants', () => {
  const figure = renderDiagramFigure(source, 'main/ru', 'sample');
  assert.match(figure, /var\(--book-diagram-owner/);
  assert.match(figure, /SVG \(светлая\)/);
  const links = [...figure.matchAll(/href="data:image\/svg\+xml;charset=utf-8,([^"]+)"/g)];
  assert.equal(links.length, 2);
  assert.equal(decodeURIComponent(links[0][1]), renderDiagramSvg(source, 'light'));
  assert.equal(decodeURIComponent(links[1][1]), renderDiagramSvg(source, 'dark'));
});

test('author-supplied text is escaped and schema rejects injection or invalid edges', () => {
  const dangerous = JSON.stringify({ body: { kind: 'node', title: '<script>&"' } });
  assert.match(renderDiagramSvg(dangerous), /&lt;script&gt;&amp;&quot;/);
  assert.ok(!renderDiagramSvg(dangerous).includes('<script>'));
  assert.throws(() => renderDiagramSvg('not JSON'), /Diagram:/);
  assert.throws(() => renderDiagramSvg(JSON.stringify({ body: { kind: 'node', onload: 'alert(1)' } })), /unknown property/);
  assert.throws(() => renderDiagramSvg(JSON.stringify({ ...example, edges: [{ from: 'a', to: 'missing' }] })), /unknown id/);
  assert.throws(() => renderDiagramSvg(JSON.stringify({ body: { kind: 'row', children: [
    { kind: 'node', id: 'x' }, { kind: 'node', id: 'x' }
  ] } })), /duplicate id/);
});

test('export extracts only actual diagram fences, not examples inside other fences', () => {
  const tick = String.fromCharCode(96);
  const fence = tick.repeat(3);
  const outer = tick.repeat(4);
  const markdown = [outer + 'markdown', fence + 'diagram', source, fence, outer,
    '~~~diagram', source, '~~~', fence + 'diagram', source, fence].join('\n');
  assert.deepEqual(extractDiagrams(markdown).map((item) => item.source), [source, source]);
  assert.throws(() => extractDiagrams(fence + 'diagram\n' + source), /Unclosed/);
});

for (const lang of ['ru', 'en']) {
  test('all authoring examples render in both themes (' + lang + ')', async () => {
    const filename = new URL('../../src/content/main/' + lang + '/authoring/02-code-and-sources/2-6-diagrams.md', import.meta.url);
    const blocks = extractDiagrams(await readFile(filename, 'utf8'));
    assert.equal(blocks.length, 4);
    for (const block of blocks) {
      for (const theme of ['light', 'dark']) {
        assert.match(renderDiagramSvg(block.source, theme), /<\/svg>$/);
      }
    }
  });
}

 test('short labels are not split across lines', () => {
  const svg = renderDiagramSvg(JSON.stringify({title:'Жизненный цикл экземпляра',body:{kind:'column',children:[{kind:'node',title:'Конструктор'},{kind:'node',title:'Экземпляр'},{kind:'node',title:'Деструктор'}]}}));
  assert.match(svg, />Деструктор<\/text>/);
  assert.match(svg, />Жизненный цикл экземпляра<\/text>/);
});

test('hex colors, opacity and edge styles are validated and exported', () => {
 const svg = renderDiagramSvg(JSON.stringify({body:{kind:'node',title:'Custom',style:{fill:'#12345680',stroke:'#abc',fillOpacity:0.4,radius:12}}}));
 assert.match(svg,/fill="#12345680" fill-opacity="0.4"/);
 assert.throws(()=>renderDiagramSvg(JSON.stringify({body:{kind:'node',style:{fill:'url(javascript:alert(1))'}}})),/hex color/);
});

test('memory strip preserves byte proportions and padding', () => {
 const svg=renderDiagramSvg(JSON.stringify({body:{kind:'memory-layout',scale:32,segments:[{name:'K',bytes:1},{name:'Padding',bytes:3,padding:true},{name:'Value',bytes:4}]}}));
 assert.match(svg,/width="32" height="54"/); assert.match(svg,/width="96" height="54"/); assert.match(svg,/width="128" height="54"/); assert.match(svg,/stroke-dasharray="5 3"/);
});

test('interactive controls resolve safe numeric expressions and export selected state', () => {
  const source = JSON.stringify({controls:[{kind:'slider',id:'count',label:'Count',min:1,max:100,default:10}],
    body:{kind:'bar',title:{$format:'bytes',value:{$op:'mul',args:[{$var:'count'},4]}},value:{$var:'count'},max:100}});
  assert.match(renderDiagramSvg(source,'light',{count:20}),/>80 B<\/text>/);
  assert.match(renderDiagramFigure(source,'main/en','interactive'),/type="range"/);
  assert.throws(()=>renderDiagramSvg(source,'light',{count:101}),/invalid value/);
});

test('natural alignment inserts internal and trailing padding', async () => {
  const { computeMemoryLayout } = await import('../../src/lib/docs/diagrams/model.ts');
  const fields = [{name:'Kind',size:1,alignment:1},{name:'Value',size:4,alignment:4},{name:'Flags',size:1,alignment:1}];
  const before = computeMemoryLayout(fields);
  const after = computeMemoryLayout([fields[1],fields[0],fields[2]]);
  assert.deepEqual([before.size,before.alignment,before.padding],[12,4,6]);
  assert.deepEqual([after.size,after.alignment,after.padding],[8,4,2]);
  assert.deepEqual(before.segments.map(s=>s.bytes),[1,3,4,1,3]);
  assert.throws(()=>computeMemoryLayout([{name:'Bad',size:4,alignment:3}]),/alignment/);
});

test('named data expressions can be reused and cycles are rejected', async () => {
  const { materializeDiagram } = await import('../../src/lib/docs/diagrams/model.ts');
  const source = JSON.stringify({data:{n:4,total:{$op:'mul',args:[{$ref:'n'},2]}},body:{kind:'node',code:{$format:'bytes',value:{$ref:'total'}}}});
  assert.equal(JSON.parse(materializeDiagram(source)).body.code,'8 B');
  assert.throws(()=>materializeDiagram(JSON.stringify({data:{a:{$ref:'b'},b:{$ref:'a'}},body:{$ref:'a'}})),/cyclic/);
});

for (const lang of ['ru','en']) {
  test('visual gallery renders finite states and slider endpoints (' + lang + ')', async () => {
    const { getVariants, getControls } = await import('../../src/lib/docs/diagrams/model.ts');
    const filename = new URL('../../src/content/main/' + lang + '/authoring/02-code-and-sources/2-7-interactive-diagrams.md',import.meta.url);
    const blocks = extractDiagrams(await readFile(filename,'utf8'));
    assert.equal(blocks.length,9);
    for (const block of blocks) {
      for (const state of getVariants(block.source)) {
        const states = [state, ...getControls(block.source).filter(c=>c.kind==='slider').flatMap(c=>[
          {...state,[c.id]:c.min},{...state,[c.id]:c.max}])];
        for (const variant of states) for (const theme of ['light','dark']) {
          assert.match(renderDiagramSvg(block.source,theme,variant),/<\/svg>$/);
        }
      }
      assert.match(renderDiagramFigure(block.source,'main/'+lang,'gallery'),/<figure/);
    }
  });
}

test('standalone page contains controls, inline SVG, and an isolated runtime', async () => {
  const { composeStandaloneHtml } = await import('../export-diagram-html.mjs');
  const diagram = JSON.stringify({controls:[{kind:'tabs',id:'x',label:'State',options:[{label:'A',value:'a'},{label:'B',value:'b'}],default:'a'}],
    body:{kind:'node',title:{$var:'x'}}});
  const page = composeStandaloneHtml([renderDiagramFigure(diagram,'standalone/en','1')],'.book-diagram{}','/* </script> */','en');
  assert.match(page,/<!doctype html>/);
  assert.match(page,/data-diagram-source=/);
  assert.match(page,/type="radio"/);
  assert.match(page,/<svg /);
  assert.ok(!page.includes('src="http'));
  assert.equal((page.match(/<\/script>/gi) ?? []).length,1);
});

test('monospace text preserves indentation and table column alignment', () => {
  const svg = renderDiagramSvg(JSON.stringify({body:{kind:'node',code:'int X;\n    int Y;'}}));
  assert.match(svg,/xml:space="preserve"/);
  assert.match(svg,/>    int Y;<\/text>/);
  const table = renderDiagramSvg(JSON.stringify({body:{kind:'table',widths:[70,70],rows:[['Field','Size'],['A long field name',4],['X',8]]}}));
  assert.match(table,/text-anchor="end"/);
  assert.match(table,/text-anchor="start"/);
});
