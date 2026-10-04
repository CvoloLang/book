import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';
import path from 'node:path';
import { buildContent } from './scripts/build-content.mjs';

function markdownDocs(): Plugin {
  let rebuilding = false;
  return {
    name: 'cvolo-markdown-docs',
    async buildStart() {
      await buildContent();
    },
    configureServer(server) {
      const contentRoot = path.resolve('src/content');
      server.watcher.add(contentRoot);
      server.watcher.on('all', async (event, file) => {
        if (!['add', 'change', 'unlink'].includes(event)) return;
        if (!file.endsWith('.md') || !path.resolve(file).startsWith(contentRoot) || rebuilding) return;
        rebuilding = true;
        try {
          await buildContent();
          server.ws.send({ type: 'full-reload' });
        } finally {
          rebuilding = false;
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [markdownDocs(), tailwindcss(), sveltekit()]
});
