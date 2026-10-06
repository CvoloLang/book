import { marked } from 'marked';
import path from 'node:path';
import sourceLinksData from '$lib/generated/source-links.json';
import anchorsData from '$lib/generated/anchors.json';
import siteConfigData from '$lib/generated/site-config.json';
import { escapeHtml, highlightCode } from './highlighter.server';

const sourceLinks = sourceLinksData as unknown as Record<string, Record<string, string>>;
const anchors = anchorsData as unknown as Record<string, Record<string, Record<string, string>>>;

type GithubLink = { id: string; url: string };
type GeneratedSiteConfig = { githubLinks?: GithubLink[]; goToDefinitionSource?: string };
const siteConfig = siteConfigData as unknown as GeneratedSiteConfig;


type GoToDefinitionRule = {
  value: string;
  sourcePath: string;
};

type LocalGoToDefinitionDirective = {
  line: number;
  rules: GoToDefinitionRule[];
};

type GoToDefinitionClientRule = {
  value: string;
  path: string;
  rawUrl: string;
  githubUrl: string;
};

function decodeDirectiveValue(value: string) {
  return value
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&#(\d+);/g, (_whole, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_whole, code: string) => String.fromCodePoint(parseInt(code, 16)));
}

function parseDirectiveAttributes(raw: string) {
  const attributes: Record<string, string> = {};
  const pattern = /([A-Za-z][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(raw))) {
    attributes[match[1].toLowerCase()] = decodeDirectiveValue(match[2] ?? match[3] ?? '');
  }
  return attributes;
}

function parseGoToDefinitionExpressions(body: string) {
  const rules: GoToDefinitionRule[] = [];
  const expressionPattern = /<Expression\b((?:"[^"]*"|'[^']*'|[^>])*)\/?\s*>/gi;
  let expression: RegExpExecArray | null;
  while ((expression = expressionPattern.exec(body))) {
    const attributes = parseDirectiveAttributes(expression[1] ?? '');
    const sourcePath = attributes.source?.replaceAll('\\', '/').replace(/^\/+/, '').trim();
    const value = attributes.value?.trim();
    if (!sourcePath || !value || value.includes('\n')) continue;
    rules.push({ value, sourcePath });
  }
  return rules;
}

function mergeGoToDefinitionRules(...groups: GoToDefinitionRule[][]) {
  const merged = new Map<string, GoToDefinitionRule>();
  for (const group of groups) {
    for (const rule of group) merged.set(rule.value, rule);
  }
  return [...merged.values()];
}

function parseProjectGoToDefinitions(source?: string) {
  if (!source?.trim()) return [] as GoToDefinitionRule[];
  const rules: GoToDefinitionRule[] = [];
  const blockPattern = /<GoToDefinition\b[^>]*>([\s\S]*?)<\/GoToDefinition\s*>/gi;
  let match: RegExpExecArray | null;
  while ((match = blockPattern.exec(source))) rules.push(...parseGoToDefinitionExpressions(match[1] ?? ''));
  return mergeGoToDefinitionRules(rules);
}

const projectGoToDefinitions = parseProjectGoToDefinitions(siteConfig.goToDefinitionSource);

function extractGoToDefinitionDirectives(markdown: string) {
  const documentRules: GoToDefinitionRule[] = [];
  const localDirectives: LocalGoToDefinitionDirective[] = [];
  let disableProjectRules = false;
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const output: string[] = [];
  let fence: { char: string; len: number } | undefined;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!fence) fence = { char: marker[0], len: marker.length };
      else if (marker[0] === fence.char && marker.length >= fence.len) fence = undefined;
      output.push(line);
      continue;
    }
    if (fence) {
      output.push(line);
      continue;
    }

    if (/<DisableGlobalGoToDefinition\b[^>]*\/?>/i.test(line)) {
      disableProjectRules = true;
      output.push(line.replace(/<DisableGlobalGoToDefinition\b[^>]*\/?>/gi, ''));
      continue;
    }

    if (!/<GoToDefinition\b/i.test(line)) {
      output.push(line);
      continue;
    }

    const directiveLines = [line];
    const startLine = index;
    while (!/<\/GoToDefinition\s*>/i.test(directiveLines.join('\n')) && index + 1 < lines.length) {
      index += 1;
      directiveLines.push(lines[index]);
    }
    const directive = directiveLines.join('\n');
    const match = directive.match(/<GoToDefinition\b([^>]*)>([\s\S]*?)<\/GoToDefinition\s*>/i);
    if (!match) {
      // Keep malformed markup visible instead of silently deleting content.
      output.push(...directiveLines);
      continue;
    }

    const attributes = parseDirectiveAttributes(match[1] ?? '');
    const rules = parseGoToDefinitionExpressions(match[2] ?? '');
    const global = /^(?:true|1|yes|on)$/i.test(attributes.global ?? 'false');
    if (global) documentRules.push(...rules);
    else localDirectives.push({ line: index, rules });

    // Preserve line numbers so local directives still map to the next fence.
    for (let lineIndex = startLine; lineIndex <= index; lineIndex += 1) output.push('');
  }

  return {
    markdown: output.join('\n'),
    disableProjectRules,
    documentRules: mergeGoToDefinitionRules(documentRules),
    localDirectives
  };
}

function compilerGithubSource() {
  const link = siteConfig.githubLinks?.find((item) => item.id === 'compiler');
  if (!link?.url) return undefined;

  const match = link.url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)(?:\/(?:tree|blob)\/([^/#?]+))?/i);
  if (!match) return undefined;
  return { github: `${match[1]}/${match[2].replace(/\.git$/i, '')}`, ref: match[3] || 'main' };
}

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

    const targetSlug = targetDoc;
    const targetAnchor = fragment ? (contextAnchors[targetDoc]?.[slugify(fragment)] ?? slugify(fragment)) : '';
    const relative = path.posix.relative(`docs/${currentSlug}`, `docs/${targetSlug}`) || '.';
    return `[${label}](${relative}/${targetAnchor ? `#${targetAnchor}` : ''})`;
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
  kind: 'code' | 'files' | 'output';
  lineNumbers: boolean;
  highlightedLines: number[];
  fileSource?: FileTreeSource;
  sourcePath?: string;
  goToDefinitions: GoToDefinitionRule[];
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


function parseLineRanges(value?: string) {
  if (!value?.trim()) return [] as number[];
  const result = new Set<number>();
  for (const part of value.split(/[\s,]+/).filter(Boolean)) {
    const range = part.match(/^(\d+)-(\d+)$/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end < 1) continue;
      for (let line = Math.min(start, end); line <= Math.max(start, end); line += 1) result.add(line);
      continue;
    }
    const line = Number(part);
    if (Number.isInteger(line) && line > 0) result.add(line);
  }
  return [...result].sort((a, b) => a - b);
}

function isCvoloDiffLanguage(language: string) {
  return /^diff-cvolo$/i.test(language.trim());
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

  const bareFlags = normalized
    .split(/\s+/)
    .slice(1)
    .filter((token) => token && !token.includes('='))
    .map((token) => token.toLowerCase());

  const lineNumberSetting = attributes.lines ?? attributes['line-numbers'] ?? attributes.linenumbers;
  const lineNumbers = lineNumberSetting !== undefined
    ? !/^(?:false|0|no|off)$/i.test(lineNumberSetting)
    : bareFlags.some((flag) => /^(?:lines|line-numbers|linenumbers)$/.test(flag));

  const highlightedLines = parseLineRanges(attributes.highlight ?? attributes['highlight-lines'] ?? attributes.mark);

  return {
    language,
    tab: attributes.tab,
    github: normalizeGithubRepository(attributes.github),
    ref: attributes.ref?.trim() || 'main',
    root: attributes.root?.replaceAll('\\', '/').replace(/^\/+|\/+$/g, '') ?? '',
    sourcePath: attributes.source?.replaceAll('\\', '/').replace(/^\/+/, '').trim(),
    lineNumbers,
    highlightedLines
  };
}

function extractCodeBlocks(markdown: string, sharedDefinitions: GoToDefinitionRule[], localDirectives: LocalGoToDefinitionDirective[]) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const output: string[] = [];
  const blocks: CodeBlock[] = [];
  let activeTabGroup: number | undefined;
  let nextTabGroup = 0;
  let localDirectiveIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const opener = lines[i].match(/^\s*(`{3,}|~{3,})\s*(.*?)\s*$/);
    if (!opener) {
      output.push(lines[i]);
      if (lines[i].trim()) activeTabGroup = undefined;
      continue;
    }

    const marker = opener[1];
    const localRules: GoToDefinitionRule[] = [];
    while (localDirectiveIndex < localDirectives.length && localDirectives[localDirectiveIndex].line < i) {
      localRules.push(...localDirectives[localDirectiveIndex].rules);
      localDirectiveIndex += 1;
    }
    const goToDefinitions = mergeGoToDefinitionRules(sharedDefinitions, localRules);
    const { language, tab, github, ref, root, sourcePath, lineNumbers, highlightedLines } = parseFenceInfo(opener[2] ?? '');
    const body: string[] = [];
    i += 1;
    while (i < lines.length) {
      const closer = lines[i].match(/^\s*(`{3,}|~{3,})\s*$/);
      if (closer && closer[1][0] === marker[0] && closer[1].length >= marker.length) break;
      body.push(lines[i]);
      i += 1;
    }

    const id = `cvolo-code-${blocks.length}`;
    const kind = /^(?:files?|filetree|tree)$/i.test(language)
      ? 'files'
      : /^(?:output|stdout|result)$/i.test(language)
        ? 'output'
        : 'code';

    let tabGroup: number | undefined;
    const previousBlock = blocks.at(-1);
    if (kind === 'code' && tab) {
      if (activeTabGroup === undefined) activeTabGroup = nextTabGroup++;
      tabGroup = activeTabGroup;
    } else if (kind === 'output' && activeTabGroup !== undefined && previousBlock?.kind === 'code' && previousBlock.tabGroup === activeTabGroup) {
      // An output fence immediately following a tabbed code block belongs to
      // that tab. Keeping the group active also allows the next tabbed code
      // block to continue the same example: code -> output -> code -> output.
      tabGroup = activeTabGroup;
    } else {
      activeTabGroup = undefined;
    }
    const normalizedCode = normalizeCodeBlock(body.join('\n'));
    blocks.push({
      id,
      language: kind === 'files' ? 'files' : kind === 'output' ? 'output' : language,
      code: normalizedCode,
      tab,
      tabGroup,
      kind,
      lineNumbers: kind === 'code' && lineNumbers,
      highlightedLines: kind === 'code' ? highlightedLines : [],
      fileSource: kind === 'files' && github ? { github, ref, root } : undefined,
      sourcePath: kind === 'code' && sourcePath ? sourcePath : undefined,
      goToDefinitions: kind === 'code' ? goToDefinitions.filter((rule) => normalizedCode.includes(rule.value)) : []
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
  const rootParts = root.replaceAll('\\', '/').split('/').filter(Boolean);
  const pathParts = path.replaceAll('\\', '/').split('/').filter(Boolean);

  // `root` is a hidden repository prefix. Authors often keep the last root
  // directory visible as the tree's top node (for example root="libraries/System"
  // with a visible `System/`). Avoid duplicating that shared boundary when the
  // source path is assembled.
  let overlap = Math.min(rootParts.length, pathParts.length);
  while (overlap > 0) {
    const rootTail = rootParts.slice(rootParts.length - overlap);
    const pathHead = pathParts.slice(0, overlap);
    if (rootTail.every((part, index) => part === pathHead[index])) break;
    overlap -= 1;
  }

  return [...rootParts, ...pathParts.slice(overlap)].join('/');
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


function codeToolbarIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function copyToolbarIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
}

function renderOutputBlock(code: string, contextKey: string) {
  const language = contextKey.split('/')[1] ?? 'en';
  const label = language === 'ru' ? 'Вывод' : 'Output';
  return [
    '<div class="code-output">',
    '<div class="code-output-label">',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m7 9 3 3-3 3M12.5 15h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    `<span>${label}</span>`,
    '</div>',
    `<pre><code>${escapeHtml(code)}</code></pre>`,
    '</div>'
  ].join('');
}

type CvoloDiffLineState = 'added' | 'removed' | undefined;

type CvoloDiffLine = {
  code: string;
  state: CvoloDiffLineState;
};

function cvoloDiffState(marker: string): CvoloDiffLineState {
  if (marker === '++') return 'added';
  if (marker === '--') return 'removed';
  return undefined;
}

function parseCvoloDiffLines(code: string): CvoloDiffLine[] {
  const result: CvoloDiffLine[] = [];
  let pendingState: CvoloDiffLineState;

  // Fumadocs/VitePress-style magic comments. diff-cvolo intentionally accepts
  // only the explicit spaced forms: // [!code ++] and // [!code --]. A marker
  // can live at the end of the changed line or on its own line immediately
  // before it.
  const standaloneMarker = /^\s*\/\/\s*\[!code\s+(\+\+|--)\]\s*$/i;
  const inlineMarker = /^(.*?)\s+\/\/\s*\[!code\s+(\+\+|--)\]\s*$/i;

  for (const rawLine of code.split('\n')) {
    const standalone = rawLine.match(standaloneMarker);
    if (standalone) {
      pendingState = cvoloDiffState(standalone[1]);
      continue;
    }

    const inline = rawLine.match(inlineMarker);
    if (inline) {
      result.push({
        code: inline[1].replace(/[ \t]+$/g, ''),
        state: cvoloDiffState(inline[2])
      });
      pendingState = undefined;
      continue;
    }

    result.push({ code: rawLine, state: pendingState });
    pendingState = undefined;
  }

  return result;
}

function syntaxHighlightSource(block: CodeBlock) {
  if (!isCvoloDiffLanguage(block.language)) return block.code;

  // Magic comments are authoring metadata, not Cvolo source. Remove them before
  // Shiki so the displayed/copied code stays clean while line metadata restores
  // the added/removed treatment afterward.
  return parseCvoloDiffLines(block.code).map((line) => line.code).join('\n');
}

function ensureLineMarkup(block: CodeBlock, highlightedHtml: string) {
  const needsLineMarkup = block.lineNumbers || block.highlightedLines.length > 0 || /^(?:diff|patch)$/i.test(block.language) || isCvoloDiffLanguage(block.language);
  if (!needsLineMarkup || highlightedHtml.includes('class="line"') || !highlightedHtml.includes('plain-code')) {
    return highlightedHtml;
  }

  const lines = syntaxHighlightSource(block)
    .split('\n')
    .map((line) => `<span class="line">${escapeHtml(line)}</span>`)
    .join('\n');
  return highlightedHtml.replace(/<code>[\s\S]*?<\/code>/, `<code>${lines}</code>`);
}

function decorateCodeLines(block: CodeBlock, highlightedHtml: string) {
  let html = ensureLineMarkup(block, highlightedHtml);
  const cvoloDiffLines = isCvoloDiffLanguage(block.language) ? parseCvoloDiffLines(block.code) : undefined;
  const sourceLines = cvoloDiffLines?.map((line) => line.code) ?? block.code.split('\n');
  const highlighted = new Set(block.highlightedLines);
  let lineIndex = 0;

  return html.replace(/<span class="line([^"]*)">/g, (_whole, existing: string) => {
    lineIndex += 1;
    const classes = ['line', ...existing.trim().split(/\s+/).filter(Boolean)];
    if (highlighted.has(lineIndex)) classes.push('code-line-highlighted');

    const sourceLine = sourceLines[lineIndex - 1] ?? '';
    if (cvoloDiffLines) {
      const state = cvoloDiffLines[lineIndex - 1]?.state;
      if (state === 'added') classes.push('code-line-added');
      else if (state === 'removed') classes.push('code-line-removed');
    } else if (/^(?:diff|patch)$/i.test(block.language)) {
      if (sourceLine.startsWith('+') && !sourceLine.startsWith('+++')) classes.push('code-line-added');
      else if (sourceLine.startsWith('-') && !sourceLine.startsWith('---')) classes.push('code-line-removed');
      else if (sourceLine.startsWith('@@')) classes.push('code-line-hunk');
    }

    return `<span class="${classes.join(' ')}">`;
  });
}

function normalizeSourceFilePath(value: string) {
  let filePath = value.trim();
  try { filePath = decodeURIComponent(filePath); } catch { /* keep source path */ }
  filePath = filePath.replaceAll('\\', '/').replace(/^\/+/, '');
  if (!filePath || filePath.split('/').includes('..')) return undefined;
  return filePath;
}

function sourceFileDescriptor(filePathValue: string) {
  const source = compilerGithubSource();
  const filePath = normalizeSourceFilePath(filePathValue);
  if (!source || !filePath) return undefined;

  const encodedPath = encodeUrlPath(filePath);
  const encodedRef = encodeUrlPath(source.ref);
  return {
    path: filePath,
    rawUrl: `https://raw.githubusercontent.com/${source.github}/${encodedRef}/${encodedPath}`,
    githubUrl: `https://github.com/${source.github}/blob/${encodedRef}/${encodedPath}`
  };
}

function sourceFileButton(filePathValue: string, labelHtml: string, className: string, ariaLabel: string) {
  const descriptor = sourceFileDescriptor(filePathValue);
  if (!descriptor) return labelHtml;

  return [
    `<a class="${className}" href="${escapeHtml(descriptor.githubUrl)}" target="_blank" rel="noopener noreferrer" data-source-file data-source-path="${escapeHtml(descriptor.path)}" data-source-raw-url="${escapeHtml(descriptor.rawUrl)}" data-source-github-url="${escapeHtml(descriptor.githubUrl)}" aria-label="${escapeHtml(ariaLabel)}" title="${escapeHtml(ariaLabel)}">`,
    labelHtml,
    '</a>'
  ].join('');
}

function goToDefinitionAttribute(rules: GoToDefinitionRule[]) {
  const clientRules = rules
    .map((rule): GoToDefinitionClientRule | undefined => {
      const descriptor = sourceFileDescriptor(rule.sourcePath);
      if (!descriptor) return undefined;
      return { value: rule.value, ...descriptor };
    })
    .filter((rule): rule is GoToDefinitionClientRule => Boolean(rule));
  if (!clientRules.length) return '';
  return ` data-go-to-definitions="${escapeHtml(JSON.stringify(clientRules))}"`;
}

function renderCodeFrame(block: CodeBlock, highlightedHtml: string, displayLanguage: string, outputHtml = '') {
  const label = escapeHtml(displayLanguage || 'code');
  const sourceButton = block.sourcePath
    ? sourceFileButton(
        block.sourcePath,
        `<span class="code-source-icon">${sourceReferenceIcon()}</span><span>Source</span>`,
        'code-source',
        `Open ${block.sourcePath} source`
      )
    : '';
  return [
    `<div class="code-frame${outputHtml ? ' code-frame-with-output' : ''}${block.lineNumbers ? ' code-line-numbers' : ''}" data-language="${label}"${goToDefinitionAttribute(block.goToDefinitions)}>`,
    '<div class="code-toolbar">',
    `<span class="code-language"><span class="code-toolbar-icon">${codeToolbarIcon()}</span><span>${label}</span></span>`,
    '<span class="code-actions">',
    sourceButton,
    `<button class="code-copy" type="button" data-copy-code aria-label="Copy code"><span class="code-copy-icon">${copyToolbarIcon()}</span><span data-copy-label>Copy</span></button>`,
    '</span>',
    '</div>',
    decorateCodeLines(block, highlightedHtml),
    outputHtml,
    '</div>'
  ].join('');
}

function renderCodeTabs(groupId: number, blocks: CodeBlock[], rendered: Map<string, { html: string; language: string }>) {
  const tabsId = `code-tabs-${groupId}`;
  const sources = blocks.filter((block) => block.kind === 'code');
  const outputFor = new Map<string, CodeBlock>();

  for (let index = 0; index < blocks.length - 1; index += 1) {
    const source = blocks[index];
    const output = blocks[index + 1];
    if (source.kind === 'code' && output.kind === 'output') outputFor.set(source.id, output);
  }

  const buttons = sources.map((block, index) => {
    const label = escapeHtml((block.tab ?? block.language) || `Tab ${index + 1}`);
    return `<button class="code-tab${index === 0 ? ' active' : ''}" type="button" role="tab" id="${tabsId}-tab-${index}" aria-controls="${tabsId}-panel-${index}" aria-selected="${index === 0 ? 'true' : 'false'}" tabindex="${index === 0 ? '0' : '-1'}" data-code-tab-button data-tab-index="${index}">${label}</button>`;
  }).join('');

  const panels = sources.map((block, index) => {
    const item = rendered.get(block.id)!;
    const outputBlock = outputFor.get(block.id);
    const outputHtml = outputBlock ? rendered.get(outputBlock.id)?.html ?? '' : '';
    const lineNumberClass = block.lineNumbers ? ' code-line-numbers' : '';
    const outputClass = outputHtml ? ' code-tab-panel-with-output' : '';
    const panelLanguage = escapeHtml(item.language || block.language || 'code');
    return `<div class="code-tab-panel${lineNumberClass}${outputClass}" data-language="${panelLanguage}" role="tabpanel" id="${tabsId}-panel-${index}" aria-labelledby="${tabsId}-tab-${index}" data-code-tab-panel data-tab-index="${index}"${goToDefinitionAttribute(block.goToDefinitions)}${index === 0 ? '' : ' hidden'}>${decorateCodeLines(block, item.html)}${outputHtml}</div>`;
  }).join('');

  return [
    '<div class="code-tabs" data-code-tabs>',
    '<div class="code-tabs-toolbar">',
    `<div class="code-tab-list" role="tablist" aria-label="Code examples">${buttons}</div>`,
    `<button class="code-copy" type="button" data-copy-code aria-label="Copy code"><span class="code-copy-icon">${copyToolbarIcon()}</span><span data-copy-label>Copy</span></button>`,
    '</div>',
    `<div class="code-tab-panels">${panels}</div>`,
    '</div>'
  ].join('');
}

function sourceReferenceIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function renderSourceReferenceLabel(raw: string) {
  const trimmed = raw.trim();
  const inlineCode = trimmed.match(/^`([^`]*)`$/);
  if (inlineCode) return `<code>${escapeHtml(inlineCode[1])}</code>`;
  return escapeHtml(trimmed);
}

function injectSourceReferences(markdown: string) {
  // Process source references before Marked. Marked intentionally rejects
  // unknown URL protocols in some versions, which made `source:` links look
  // like ordinary inline code without any click behavior. Code fences have
  // already been extracted at this point, so this never touches source code.
  return markdown.replace(
    /\[((?:`[^`]*`|[^\]])+)\]\(source:(?:\/\/)?([^)]+)\)/gi,
    (_whole, rawLabel: string, rawPath: string) => {
      const label = renderSourceReferenceLabel(rawLabel);
      return sourceFileButton(
        rawPath,
        `<span class="source-reference-label">${label}</span><span class="source-reference-icon" aria-hidden="true">${sourceReferenceIcon()}</span>`,
        'source-reference',
        `Open ${rawPath} source`
      );
    }
  );
}

function decorateSourceReferences(html: string) {
  // Backward-compatible fallback for already-rendered source links.
  return html.replace(/<a href="source:(?:\/\/)?([^"]+)">([\s\S]*?)<\/a>/gi, (_whole, rawPath: string, inner: string) =>
    sourceFileButton(
      rawPath,
      `<span class="source-reference-label">${inner}</span><span class="source-reference-icon" aria-hidden="true">${sourceReferenceIcon()}</span>`,
      'source-reference',
      `Open ${rawPath} source`
    )
  );
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

  const directives = extractGoToDefinitionDirectives(markdown);
  const sharedDefinitions = mergeGoToDefinitionRules(
    directives.disableProjectRules ? [] : projectGoToDefinitions,
    directives.documentRules
  );
  const rewritten = rewriteMarkdownLinks(directives.markdown, currentSlug, sourcePath, contextKey);
  const extracted = extractCodeBlocks(rewritten, sharedDefinitions, directives.localDirectives);
  const markdownWithHeadingIds = injectStableHeadingIds(injectSourceReferences(extracted.markdown));
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
    if (block.kind === 'output') {
      rendered.set(block.id, { html: renderOutputBlock(block.code, contextKey), language: 'output' });
      continue;
    }
    const cvoloDiff = isCvoloDiffLanguage(block.language);
    const highlighted = await highlightCode(cvoloDiff ? syntaxHighlightSource(block) : block.code, cvoloDiff ? 'cvolo' : block.language);
    rendered.set(block.id, {
      html: highlighted.html,
      language: cvoloDiff ? 'diff-cvolo' : (highlighted.language || block.language || 'code')
    });
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

  // A ```output fence placed directly after a normal code fence is rendered as
  // one visual example. Raw Markdown stays readable while authors no longer
  // need an extra "Output:" / "Вывод:" paragraph.
  for (let index = 1; index < extracted.blocks.length; index += 1) {
    const output = extracted.blocks[index];
    const source = extracted.blocks[index - 1];
    if (output.kind !== 'output' || source.kind !== 'code') continue;
    if (groupedIds.has(source.id) || groupedIds.has(output.id)) continue;

    const sourcePlaceholder = escapeRegExp(`<div data-code-placeholder="${source.id}"></div>`);
    const outputPlaceholder = escapeRegExp(`<div data-code-placeholder="${output.id}"></div>`);
    const pattern = new RegExp(`${sourcePlaceholder}\\s*${outputPlaceholder}`);
    if (!pattern.test(html)) continue;

    const sourceItem = rendered.get(source.id)!;
    const outputItem = rendered.get(output.id)!;
    html = html.replace(pattern, renderCodeFrame(source, sourceItem.html, sourceItem.language, outputItem.html));
    groupedIds.add(source.id);
    groupedIds.add(output.id);
  }

  for (const block of extracted.blocks) {
    if (groupedIds.has(block.id)) continue;
    const item = rendered.get(block.id)!;
    const replacement = block.kind === 'files' || block.kind === 'output'
      ? item.html
      : renderCodeFrame(block, item.html, item.language);
    html = html.replace(`<div data-code-placeholder="${block.id}"></div>`, replacement);
  }

  html = decorateAdmonitions(html);
  html = decorateSourceReferences(html);
  return decorateTables(html);
}
