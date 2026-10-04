import { marked } from 'marked';
import path from 'node:path';
import sourceLinksData from '$lib/generated/source-links.json';
import anchorsData from '$lib/generated/anchors.json';
import { escapeHtml, highlightCode } from './highlighter.server';

const sourceLinks = sourceLinksData as Record<string, string>;
const anchors = anchorsData as Record<string, Record<string, string>>;

function transliterateCyrillic(value: string) {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's',
    т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '',
    ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
  };
  return [...value].map((char) => map[char.toLowerCase()] ?? char).join('');
}

function looseSourceKey(value: string) {
  return transliterateCyrillic(value)
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function slugify(value: string) {
  return transliterateCyrillic(value)
    .normalize('NFKD')
    .replace(/#U([0-9A-F]{4})/gi, ' u$1 ')
    .replace(/[`*_~]/g, '')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-') || 'topic';
}

function displayTitle(raw: string) {
  return raw
    .replace(/\s+#+\s*$/, '')
    .replace(/^\s*#+\s*/, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .trim();
}

function injectStableHeadingIds(markdown: string) {
  const counts = new Map<string, number>();
  return markdown
    .split('\n')
    .map((line) => {
      const match = line.match(/^(#{2,6})\s+(.+?)\s*$/);
      if (!match) return line;

      const level = match[1].length;
      const title = displayTitle(match[2]);
      const base = slugify(title);
      const count = (counts.get(base) ?? 0) + 1;
      counts.set(base, count);
      const id = count === 1 ? base : `${base}-${count}`;

      // Render the visible title as text. This deliberately avoids treating
      // generic notation such as Option<T> as an HTML tag.
      return `<h${level} id="${id}"><a class="heading-anchor" href="#${id}" aria-label="Link to ${escapeHtml(title)}">#</a>${escapeHtml(title)}</h${level}>`;
    })
    .join('\n');
}

function rewriteMarkdownLinks(markdown: string, currentSlug: string, sourcePath: string, contextKey: string) {
  const contextSourceLinks = (sourceLinks as Record<string, Record<string, string>>)[contextKey] ?? {};
  const contextAnchors = (anchors as Record<string, Record<string, Record<string, string>>>)[contextKey] ?? {};
  const sourceDir = path.posix.dirname(sourcePath.replaceAll('\\', '/'));

  return markdown.replace(/\[([^\]]+)\]\(([^)]+\.md(?:#[^)]*)?)\)/gi, (full, label: string, rawHref: string) => {
    // Split fragment before decoding so an encoded # in a historical filename
    // cannot accidentally become an anchor separator.
    const [rawFilePart, rawFragment] = rawHref.split('#', 2);
    let filePart = rawFilePart;
    let fragment = rawFragment;
    try { filePart = decodeURIComponent(rawFilePart); } catch { /* keep raw path */ }
    try { fragment = rawFragment ? decodeURIComponent(rawFragment) : rawFragment; } catch { /* keep raw fragment */ }

    const slashPath = filePart.replaceAll('\\', '/');
    const resolved = path.posix.normalize(path.posix.join(sourceDir, slashPath)).toLowerCase();
    const normalized = slashPath.toLowerCase();
    const basename = path.posix.basename(normalized);

    const targetDoc = contextSourceLinks[resolved]
      ?? contextSourceLinks[normalized]
      ?? contextSourceLinks[basename]
      ?? contextSourceLinks[`~${looseSourceKey(resolved)}`]
      ?? contextSourceLinks[`~${looseSourceKey(normalized)}`]
      ?? contextSourceLinks[`~${looseSourceKey(basename)}`];

    if (!targetDoc) {
      return `<span class="missing-doc-link" title="Referenced Markdown document is not included in the public documentation">${escapeHtml(label)}</span>`;
    }

    const targetSlug = fragment ? (contextAnchors[targetDoc]?.[slugify(fragment)] ?? targetDoc) : targetDoc;
    const relative = path.posix.relative(`docs/${currentSlug}`, `docs/${targetSlug}`) || '.';
    return `[${label}](${relative}/)`;
  });
}

type CodeBlock = {
  id: string;
  language: string;
  code: string;
};

function normalizeCodeBlock(code: string) {
  const lines = code.replace(/\r\n/g, '\n').split('\n');

  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines.at(-1)?.trim()) lines.pop();

  const nonEmpty = lines.filter((line) => line.trim());
  const commonIndent = nonEmpty.length
    ? Math.min(...nonEmpty.map((line) => line.match(/^[ \t]*/)?.[0].replace(/\t/g, '    ').length ?? 0))
    : 0;

  if (!commonIndent) return lines.join('\n');

  return lines.map((line) => {
    if (!line.trim()) return '';
    let remaining = commonIndent;
    let index = 0;
    while (index < line.length && remaining > 0) {
      if (line[index] === '\t') remaining -= 4;
      else if (line[index] === ' ') remaining -= 1;
      else break;
      index += 1;
    }
    return line.slice(index);
  }).join('\n');
}

function extractCodeBlocks(markdown: string) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const output: string[] = [];
  const blocks: CodeBlock[] = [];

  for (let i = 0; i < lines.length; i++) {
    const opener = lines[i].match(/^\s*(`{3,}|~{3,})\s*([^\s`]*)?.*$/);
    if (!opener) {
      output.push(lines[i]);
      continue;
    }

    const marker = opener[1];
    const language = opener[2] ?? '';
    const body: string[] = [];
    i += 1;
    while (i < lines.length) {
      const closer = lines[i].match(/^\s*(`{3,}|~{3,})\s*$/);
      if (closer && closer[1][0] === marker[0] && closer[1].length >= marker.length) break;
      body.push(lines[i]);
      i += 1;
    }

    const id = `cvolo-code-${blocks.length}`;
    blocks.push({ id, language, code: normalizeCodeBlock(body.join('\n')) });
    output.push(`<div data-code-placeholder="${id}"></div>`);
  }

  return { markdown: output.join('\n'), blocks };
}

function decorateTables(html: string) {
  return html
    .replaceAll('<table>', '<div class="table-scroll"><table>')
    .replaceAll('</table>', '</table></div>');
}

const admonitionLabels: Record<string, string> = {
  NOTE: 'Примечание',
  TIP: 'Совет',
  IMPORTANT: 'Важно',
  WARNING: 'Предупреждение',
  CAUTION: 'Осторожно'
};

function decorateAdmonitions(html: string) {
  return html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (whole, inner: string) => {
    const match = inner.match(/^\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);
    if (!match) return whole;

    const kind = match[1].toUpperCase();
    const content = inner.replace(/^\s*<p>\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, '<p>');
    return [
      `<aside class="admonition admonition-${kind.toLowerCase()}">`,
      `<div class="admonition-title">${admonitionLabels[kind]}</div>`,
      `<div class="admonition-body">${content}</div>`,
      '</aside>'
    ].join('');
  });
}

export async function renderMarkdown(markdown: string, currentSlug: string, sourcePath: string, contextKey: string) {
  if (!markdown.trim()) return '';

  const extracted = extractCodeBlocks(rewriteMarkdownLinks(markdown, currentSlug, sourcePath, contextKey));
  const markdownWithHeadingIds = injectStableHeadingIds(extracted.markdown);
  let html = marked.parse(markdownWithHeadingIds, {
    gfm: true,
    breaks: false
  }) as string;

  for (const block of extracted.blocks) {
    const highlighted = await highlightCode(block.code, block.language);
    const label = escapeHtml(highlighted.language || 'code');
    const replacement = [
      `<div class="code-frame" data-language="${label}">`,
      '<div class="code-toolbar">',
      `<span class="code-language">${label}</span>`,
      '<button class="code-copy" type="button" data-copy-code aria-label="Copy code">Copy</button>',
      '</div>',
      highlighted.html,
      '</div>'
    ].join('');
    html = html.replace(`<div data-code-placeholder="${block.id}"></div>`, replacement);
  }

  html = decorateAdmonitions(html);
  return decorateTables(html);
}
