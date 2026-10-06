import { createHighlighter, type Highlighter } from 'shiki';
import cvoloGrammar from '$lib/grammars/cvolo.tmLanguage.json';
import layoutGrammar from '$lib/grammars/cvolo-layout.tmLanguage.json';
import projectGrammar from '$lib/grammars/cvolo-project.tmLanguage.json';

let highlighterPromise: Promise<Highlighter> | undefined;

function getHighlighter() {
  highlighterPromise ??= createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: [
      { ...cvoloGrammar, name: 'cvolo', aliases: ['cvo', 'cvl'] } as any,
      { ...layoutGrammar, name: 'cvolo-layout', aliases: ['layout'] } as any,
      { ...projectGrammar, name: 'cvolo-project', aliases: ['cvproj'] } as any,
      'json',
      'xml',
      'c',
      'cpp',
      'llvm',
      'markdown',
      'bash',
      'javascript',
      'typescript',
      'toml'
    ]
  });
  return highlighterPromise;
}

function languageForPath(path: string) {
  const lower = path.toLowerCase();
  if (lower.endsWith('.cvl') || lower.endsWith('.cvolo')) return 'cvolo';
  if (lower.endsWith('.layout')) return 'cvolo-layout';
  if (lower.endsWith('.cvproj')) return 'cvolo-project';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.xml')) return 'xml';
  if (lower.endsWith('.c')) return 'c';
  if (lower.endsWith('.cc') || lower.endsWith('.cpp') || lower.endsWith('.cxx') || lower.endsWith('.hpp')) return 'cpp';
  if (lower.endsWith('.ll')) return 'llvm';
  if (lower.endsWith('.md') || lower.endsWith('.mdx')) return 'markdown';
  if (lower.endsWith('.sh') || lower.endsWith('.bash')) return 'bash';
  if (lower.endsWith('.js') || lower.endsWith('.mjs') || lower.endsWith('.cjs')) return 'javascript';
  if (lower.endsWith('.ts') || lower.endsWith('.mts') || lower.endsWith('.cts')) return 'typescript';
  if (lower.endsWith('.toml')) return 'toml';
  return 'cvolo';
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function highlightSource(code: string, path: string) {
  const language = languageForPath(path);
  try {
    const highlighter = await getHighlighter();
    return highlighter.codeToHtml(code, {
      lang: language,
      themes: {
        light: 'github-light',
        dark: 'github-dark'
      },
      defaultColor: 'light'
    });
  } catch {
    return `<pre class="shiki plain-code" tabindex="0"><code>${escapeHtml(code)}</code></pre>`;
  }
}
