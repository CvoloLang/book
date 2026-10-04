import { createHighlighter, type Highlighter } from 'shiki';
import cvoloGrammar from '$lib/grammars/cvolo.tmLanguage.json';
import layoutGrammar from '$lib/grammars/cvolo-layout.tmLanguage.json';
import projectGrammar from '$lib/grammars/cvolo-project.tmLanguage.json';

let highlighterPromise: Promise<Highlighter> | undefined;

function getHighlighter() {
  highlighterPromise ??= createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: [
      { ...cvoloGrammar, name: 'cvolo', aliases: ['cvo'] } as any,
      { ...layoutGrammar, name: 'cvolo-layout', aliases: ['layout'] } as any,
      { ...projectGrammar, name: 'cvolo-project', aliases: ['cvolo-project', 'cvproj'] } as any,
      'json',
      'xml',
      'c',
      'llvm',
      'markdown',
      'bash',
      'javascript',
      'typescript'
    ]
  });
  return highlighterPromise;
}

function inferLanguage(code: string, requested?: string) {
  const lang = requested?.trim().toLowerCase() ?? '';

  if (lang === 'cvolo' || lang === 'cvo' || lang === 'csharp' || lang === 'cs') return 'cvolo';
  if (lang === 'cvolo-layout' || lang === 'layout') return 'cvolo-layout';
  if (lang === 'cvolo-project' || lang === 'cvproj') return 'cvolo-project';
  if (lang === 'text' || lang === 'txt' || lang === 'plain') {
    if (/^Target:\s+/m.test(code) || /Offset\s+Size\s+Align\s+Field\s+Type/.test(code)) return 'cvolo-layout';
    return 'text';
  }
  if (lang === 'antlr') return 'text';
  if (['json', 'xml', 'c', 'llvm', 'markdown', 'md', 'bash', 'sh', 'javascript', 'js', 'typescript', 'ts'].includes(lang)) {
    const aliases: Record<string, string> = { md: 'markdown', sh: 'bash', js: 'javascript', ts: 'typescript' };
    return aliases[lang] ?? lang;
  }

  if (/^\s*<\?xml|^\s*<[A-Za-z][^>]*>/m.test(code)) return 'xml';
  if (/^Target:\s+/m.test(code) || /Offset\s+Size\s+Align\s+Field\s+Type/.test(code)) return 'cvolo-layout';
  return 'cvolo';
}

export async function highlightCode(code: string, requestedLanguage?: string) {
  const language = inferLanguage(code, requestedLanguage);
  if (language === 'text') {
    return {
      language: requestedLanguage || 'text',
      html: `<pre class="shiki plain-code" tabindex="0"><code>${escapeHtml(code)}</code></pre>`
    };
  }

  const highlighter = await getHighlighter();
  try {
    return {
      language,
      html: highlighter.codeToHtml(code, {
        lang: language,
        themes: {
          light: 'github-light',
          dark: 'github-dark'
        },
        defaultColor: 'light'
      })
    };
  } catch {
    return {
      language: requestedLanguage || 'text',
      html: `<pre class="shiki plain-code" tabindex="0"><code>${escapeHtml(code)}</code></pre>`
    };
  }
}

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
