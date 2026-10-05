import { marked } from 'marked';
import path from 'node:path';
import sourceLinksData from '$lib/generated/source-links.json';
import anchorsData from '$lib/generated/anchors.json';
import { escapeHtml, highlightCode } from './highlighter.server';

const sourceLinks = sourceLinksData as unknown as Record<string, Record<string, string>>;
const anchors = anchorsData as unknown as Record<string, Record<string, Record<string, string>>>;

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
  const contextSourceLinks = sourceLinks[contextKey] ?? {};
  const contextAnchors = anchors[contextKey] ?? {};
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

type FileTreeSource = {
  github: string;
  ref: string;
  root: string;
};

type CodeBlock = {
  id: string;
  language: string;
  code: string;
  tab?: string;
  tabGroup?: number;
  kind: 'code' | 'files';
  fileSource?: FileTreeSource;
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

function normalizeGithubRepository(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/\.git$/i, '');
  const urlMatch = trimmed.match(/^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)(?:[/?#].*)?$/i);
  const candidate = urlMatch ? `${urlMatch[1]}/${urlMatch[2]}` : trimmed;
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(candidate) ? candidate : undefined;
}

function parseFenceInfo(info: string) {
  const normalized = info.trim();
  const language = normalized.match(/^([^\s{]+)/)?.[1] ?? '';
  const attributes: Record<string, string> = {};
  const attributePattern = /\b([A-Za-z][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+))/g;
  let match: RegExpExecArray | null;
  while ((match = attributePattern.exec(normalized))) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  }

  return {
    language,
    tab: attributes.tab,
    github: normalizeGithubRepository(attributes.github),
    ref: attributes.ref?.trim() || 'main',
    root: attributes.root?.replaceAll('\\', '/').replace(/^\/+|\/+$/g, '') ?? ''
  };
}

function extractCodeBlocks(markdown: string) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const output: string[] = [];
  const blocks: CodeBlock[] = [];
  let activeTabGroup: number | undefined;
  let nextTabGroup = 0;

  for (let i = 0; i < lines.length; i++) {
    const opener = lines[i].match(/^\s*(`{3,}|~{3,})\s*(.*?)\s*$/);
    if (!opener) {
      output.push(lines[i]);
      if (lines[i].trim()) activeTabGroup = undefined;
      continue;
    }

    const marker = opener[1];
    const { language, tab, github, ref, root } = parseFenceInfo(opener[2] ?? '');
    const body: string[] = [];
    i += 1;
    while (i < lines.length) {
      const closer = lines[i].match(/^\s*(`{3,}|~{3,})\s*$/);
      if (closer && closer[1][0] === marker[0] && closer[1].length >= marker.length) break;
      body.push(lines[i]);
      i += 1;
    }

    const id = `cvolo-code-${blocks.length}`;
    let tabGroup: number | undefined;
    if (tab) {
      if (activeTabGroup === undefined) activeTabGroup = nextTabGroup++;
      tabGroup = activeTabGroup;
    } else {
      activeTabGroup = undefined;
    }

    const kind = /^(?:files?|filetree|tree)$/i.test(language) ? 'files' : 'code';
    blocks.push({
      id,
      language: kind === 'files' ? 'files' : language,
      code: normalizeCodeBlock(body.join('\n')),
      tab,
      tabGroup,
      kind,
      fileSource: kind === 'files' && github ? { github, ref, root } : undefined
    });
    output.push(`<div data-code-placeholder="${id}"></div>`);
  }

  return { markdown: output.join('\n'), blocks };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function fileTreeIcon(kind: 'folder' | 'file') {
  if (kind === 'folder') {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.75A1.75 1.75 0 0 1 4.75 5h4.1l1.7 2h8.7A1.75 1.75 0 0 1 21 8.75v8.5A1.75 1.75 0 0 1 19.25 19H4.75A1.75 1.75 0 0 1 3 17.25z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  }
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.75 3.5h6.6L18.5 8.65v11.1a.75.75 0 0 1-.75.75h-11a.75.75 0 0 1-.75-.75V4.25a.75.75 0 0 1 .75-.75Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M13 3.75V9h5.25" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
}

function fileTreeChevron() {
  return '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7.5 5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

type FileTreeNode = {
  name: string;
  depth: number;
  path: string;
  isFolder: boolean;
  isEllipsis: boolean;
  children: FileTreeNode[];
};

function parseFileTree(code: string) {
  const roots: FileTreeNode[] = [];
  const folderStack: FileTreeNode[] = [];

  for (const raw of code.split('\n')) {
    const line = raw.replace(/\t/g, '    ').trimEnd();
    if (!line.trim()) continue;

    const branch = line.search(/[├└]──\s*/);
    let depth = 0;
    let name = line.trim();
    if (branch >= 0) {
      depth = 1 + Math.floor(branch / 4);
      name = line.slice(branch).replace(/^[├└]──\s*/, '').trim();
    } else {
      const leading = line.match(/^\s*/)?.[0].length ?? 0;
      depth = Math.floor(leading / 4);
    }

    const isEllipsis = name === '...' || name === '…';
    const isFolder = !isEllipsis && name.endsWith('/');
    const label = isFolder ? name.slice(0, -1) : name;
    const parent = depth > 0 ? folderStack[depth - 1] : undefined;
    const path = parent ? `${parent.path}/${label}` : label;
    const node: FileTreeNode = { name: label, depth, path, isFolder, isEllipsis, children: [] };

    if (parent) parent.children.push(node);
    else roots.push(node);

    folderStack.length = depth;
    if (isFolder) folderStack[depth] = node;
  }

  return roots;
}

function joinSourcePath(root: string, path: string) {
  return [root, path]
    .filter(Boolean)
    .join('/')
    .replace(/\/{2,}/g, '/')
    .replace(/^\/+|\/+$/g, '');
}

function encodeUrlPath(value: string) {
  return value.split('/').map((part) => encodeURIComponent(part)).join('/');
}

function renderFileTreeNode(node: FileTreeNode, source?: FileTreeSource): string {
  const depthStyle = `--tree-depth:${node.depth}`;

  if (node.isEllipsis) {
    return [
      `<div class="file-tree-row file-tree-ellipsis" role="treeitem" aria-level="${node.depth + 1}" style="${depthStyle}">`,
      '<span class="file-tree-spacer" aria-hidden="true"></span>',
      '<span class="file-tree-ellipsis-icon" aria-hidden="true">•••</span>',
      `<span class="file-tree-name">${escapeHtml(node.name)}</span>`,
      '</div>'
    ].join('');
  }

  if (node.isFolder) {
    const children = node.children.map((child) => renderFileTreeNode(child, source)).join('');
    return [
      `<details class="file-tree-node file-tree-folder${node.depth === 0 ? ' file-tree-root' : ''}" open style="${depthStyle}">`,
      `<summary class="file-tree-row file-tree-folder-row" role="treeitem" aria-level="${node.depth + 1}">`,
      `<span class="file-tree-chevron">${fileTreeChevron()}</span>`,
      `<span class="file-tree-icon">${fileTreeIcon('folder')}</span>`,
      `<span class="file-tree-name">${escapeHtml(node.name)}</span>`,
      '</summary>',
      `<div class="file-tree-children" role="group">${children}</div>`,
      '</details>'
    ].join('');
  }

  const icon = `<span class="file-tree-icon">${fileTreeIcon('file')}</span>`;
  if (!source) {
    return [
      `<div class="file-tree-row file-tree-file" role="treeitem" aria-level="${node.depth + 1}" style="${depthStyle}">`,
      '<span class="file-tree-spacer" aria-hidden="true"></span>',
      icon,
      `<span class="file-tree-name">${escapeHtml(node.name)}</span>`,
      '</div>'
    ].join('');
  }

  const filePath = joinSourcePath(source.root, node.path);
  const encodedPath = encodeUrlPath(filePath);
  const encodedRef = encodeUrlPath(source.ref);
  const rawUrl = `https://raw.githubusercontent.com/${source.github}/${encodedRef}/${encodedPath}`;
  const githubUrl = `https://github.com/${source.github}/blob/${encodedRef}/${encodedPath}`;
  return [
    `<button class="file-tree-row file-tree-file file-tree-source" type="button" role="treeitem" aria-level="${node.depth + 1}" style="${depthStyle}" data-source-file data-source-path="${escapeHtml(filePath)}" data-source-raw-url="${escapeHtml(rawUrl)}" data-source-github-url="${escapeHtml(githubUrl)}">`,
    '<span class="file-tree-spacer" aria-hidden="true"></span>',
    icon,
    `<span class="file-tree-name">${escapeHtml(node.name)}</span>`,
    '<span class="file-tree-open-hint" aria-hidden="true">View source</span>',
    '</button>'
  ].join('');
}

function renderFileTree(code: string, source?: FileTreeSource) {
  const rows = parseFileTree(code).map((node) => renderFileTreeNode(node, source)).join('');
  return `<div class="file-tree" role="tree" aria-label="File structure">${rows}</div>`;
}

function renderCodeFrame(block: CodeBlock, highlightedHtml: string, displayLanguage: string) {
  const label = escapeHtml(displayLanguage || 'code');
  return [
    `<div class="code-frame" data-language="${label}">`,
    '<div class="code-toolbar">',
    `<span class="code-language">${label}</span>`,
    '<button class="code-copy" type="button" data-copy-code aria-label="Copy code">Copy</button>',
    '</div>',
    highlightedHtml,
    '</div>'
  ].join('');
}

function renderCodeTabs(groupId: number, blocks: CodeBlock[], rendered: Map<string, { html: string; language: string }>) {
  const tabsId = `code-tabs-${groupId}`;
  const buttons = blocks.map((block, index) => {
    const label = escapeHtml((block.tab ?? block.language) || `Tab ${index + 1}`);
    return `<button class="code-tab${index === 0 ? ' active' : ''}" type="button" role="tab" id="${tabsId}-tab-${index}" aria-controls="${tabsId}-panel-${index}" aria-selected="${index === 0 ? 'true' : 'false'}" tabindex="${index === 0 ? '0' : '-1'}" data-code-tab-button data-tab-index="${index}">${label}</button>`;
  }).join('');

  const panels = blocks.map((block, index) => {
    const item = rendered.get(block.id)!;
    return `<div class="code-tab-panel" role="tabpanel" id="${tabsId}-panel-${index}" aria-labelledby="${tabsId}-tab-${index}" data-code-tab-panel data-tab-index="${index}"${index === 0 ? '' : ' hidden'}>${item.html}</div>`;
  }).join('');

  return [
    '<div class="code-tabs" data-code-tabs>',
    '<div class="code-tabs-toolbar">',
    `<div class="code-tab-list" role="tablist" aria-label="Code examples">${buttons}</div>`,
    '<button class="code-copy" type="button" data-copy-code aria-label="Copy code">Copy</button>',
    '</div>',
    `<div class="code-tab-panels">${panels}</div>`,
    '</div>'
  ].join('');
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

  const rendered = new Map<string, { html: string; language: string }>();
  for (const block of extracted.blocks) {
    if (block.kind === 'files') {
      rendered.set(block.id, { html: renderFileTree(block.code, block.fileSource), language: 'files' });
      continue;
    }
    const highlighted = await highlightCode(block.code, block.language);
    rendered.set(block.id, { html: highlighted.html, language: highlighted.language || block.language || 'code' });
  }

  const tabGroups = new Map<number, CodeBlock[]>();
  for (const block of extracted.blocks) {
    if (block.tabGroup === undefined) continue;
    const group = tabGroups.get(block.tabGroup) ?? [];
    group.push(block);
    tabGroups.set(block.tabGroup, group);
  }

  const groupedIds = new Set<string>();
  for (const [groupId, blocks] of tabGroups) {
    const placeholders = blocks
      .map((block) => `<div data-code-placeholder="${block.id}"></div>`)
      .map(escapeRegExp)
      .join('\\s*');
    const pattern = new RegExp(placeholders);
    if (pattern.test(html)) {
      html = html.replace(pattern, renderCodeTabs(groupId, blocks, rendered));
      for (const block of blocks) groupedIds.add(block.id);
    }
  }

  for (const block of extracted.blocks) {
    if (groupedIds.has(block.id)) continue;
    const item = rendered.get(block.id)!;
    const replacement = block.kind === 'files'
      ? item.html
      : renderCodeFrame(block, item.html, item.language);
    html = html.replace(`<div data-code-placeholder="${block.id}"></div>`, replacement);
  }

  html = decorateAdmonitions(html);
  return decorateTables(html);
}
