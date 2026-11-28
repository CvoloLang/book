# Cvolo Visuals

Framework-independent TypeScript engine for declarative technical diagrams.

- `src/model.ts`: state, data expressions and natural-alignment memory calculations.
- `src/render.ts`: layout, SVG generation and portable figure markup.
- `src/client.ts`: browser enhancement for controls, source view and downloads.
- `src/diagram.css`: responsive styles and theme tokens.
- `src/index.ts`: server-safe public API.
- `src/standalone.ts`: entry for the portable HTML bundle.

The package does not depend on Svelte, Book or a Markdown parser. Book owns Markdown extraction and the CLI integration.

```ts
import { renderDiagramSvg, renderDiagramFigure } from './packages/visuals/src/index.ts';

const source = JSON.stringify({ body: { kind: 'node', title: 'Example' } });
const svg = renderDiagramSvg(source, 'light');
const html = renderDiagramFigure(source, 'en', 'example');
```

For interactive figures, include `src/diagram.css` and call `enhanceDiagrams(container)` from `src/client.ts` after mounting. The returned function removes event listeners. Figure IDs must be unique within the document. Use a `.dark` ancestor for dark theme or override the CSS variables.

This is a private source package consumed through local paths, not a published npm distribution. A compiled ESM/declaration build and release workflow can be added when the API stabilizes. No workspace installation or lockfile changes are required.

From the Book root, run `npm run diagrams:test` or `npx tsc -p packages/visuals/tsconfig.json`.
