/**
 * Declarative documentation diagrams. No browser, font measurement API,
 * third-party layout dependency or author-supplied HTML is required.
 * The same layout is used for the embedded figure and standalone SVG.
 */

type Kind = 'row' | 'column' | 'group' | 'node' | 'cells' | 'text' | 'space';
type Tone = 'neutral' | 'owner' | 'read' | 'write' | 'success' | 'error';
type Side = 'top' | 'right' | 'bottom' | 'left';
type Align = 'start' | 'center' | 'end';
type Theme = 'book' | 'light' | 'dark';

type Element = {
  kind: Kind;
  id?: string;
  title?: string;
  code?: string;
  text?: string;
  tone: Tone;
  moved: boolean;
  width?: number;
  height?: number;
  gap: number;
  align: Align;
  children: Element[];
};
type Edge = { from: string; to: string; tone: Tone; fromSide?: Side; toSide?: Side };
type Diagram = { title: string; caption: string; body: Element; edges: Edge[] };
type Point = { x: number; y: number };
type Rect = Point & { w: number; h: number };
type TextLine = { value: string; size: number; mono: boolean; strong: boolean; muted: boolean; strike: boolean };
type Layout = { element: Element; bounds: Rect; lines: TextLine[]; children: Layout[] };
type Palette = Record<Tone | 'foreground' | 'muted' | 'background' | 'frame', string>;

const tones = ['neutral', 'owner', 'read', 'write', 'success', 'error'] as const;
const sides = ['top', 'right', 'bottom', 'left'] as const;
const kinds = ['row', 'column', 'group', 'node', 'cells', 'text', 'space'] as const;
const aligns = ['start', 'center', 'end'] as const;

const light: Palette = {
  foreground: '#27272a', muted: '#52525b', background: '#ffffff', frame: '#d4d4d8',
  neutral: '#71717a', owner: '#7c3aed', read: '#2563eb', write: '#b45309',
  success: '#15803d', error: '#b91c1c'
};
const dark: Palette = {
  foreground: '#e4e4e7', muted: '#a1a1aa', background: '#09090b', frame: '#3f3f46',
  neutral: '#71717a', owner: '#8b5cf6', read: '#60a5fa', write: '#f59e0b',
  success: '#4ade80', error: '#f87171'
};

function fail(message: string): never {
  throw new Error('Diagram: ' + message);
}

function record(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(name + ' must be an object');
  return value as Record<string, unknown>;
}

function keys(object: Record<string, unknown>, allowed: string[], name: string) {
  for (const key of Object.keys(object)) {
    if (!allowed.includes(key)) fail(name + ': unknown property ' + key);
  }
}

function string(value: unknown, name: string, limit = 240): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.length > limit || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) {
    fail(name + ' must be a string of at most ' + limit + ' characters');
  }
  return value;
}

function number(value: unknown, name: string, min: number, max: number): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    fail(name + ' must be a number between ' + min + ' and ' + max);
  }
  return value;
}

function choice<T extends string>(value: unknown, options: readonly T[], name: string): T | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !options.includes(value as T)) fail(name + ': expected ' + options.join(', '));
  return value as T;
}

function identifier(value: unknown, name: string): string | undefined {
  const id = string(value, name, 64);
  if (id !== undefined && !/^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(id)) fail(name + ': invalid identifier');
  return id;
}

function parse(source: string): Diagram {
  if (source.length > 32000) fail('source exceeds 32,000 characters');
  let raw: unknown;
  try { raw = JSON.parse(source); }
  catch (error) { fail(error instanceof Error ? error.message : 'invalid JSON'); }
  const root = record(raw, 'root');
  keys(root, ['title', 'caption', 'body', 'edges'], 'root');
  const ids = new Set<string>();
  let count = 0;

  function element(value: unknown, depth: number): Element {
    if (++count > 60 || depth > 10) fail('maximum 60 elements and 10 nesting levels');
    const item = record(value, 'element');
    keys(item, ['kind', 'id', 'title', 'code', 'text', 'tone', 'moved', 'width', 'height', 'gap', 'align', 'children'], 'element');
    const kind = choice(item.kind, kinds, 'kind');
    if (!kind) fail('element kind is required');
    const id = identifier(item.id, 'id');
    if (id) {
      if (ids.has(id)) fail('duplicate id ' + id);
      ids.add(id);
    }
    if (item.moved !== undefined && typeof item.moved !== 'boolean') fail('moved must be boolean');
    if (item.children !== undefined && !Array.isArray(item.children)) fail('children must be an array');
    const children = (item.children as unknown[] | undefined ?? []).map((child) => element(child, depth + 1));
    const container = ['row', 'column', 'group', 'cells'].includes(kind);
    if (container && !children.length) fail(kind + ' requires children');
    if (!container && children.length) fail(kind + ' cannot contain children');
    if (kind === 'cells' && children.some((child) => child.kind !== 'node')) fail('cells accepts only node children');
    if (kind === 'space' && id) fail('a space cannot have an id');
    return {
      kind, id, children,
      title: string(item.title, 'title'), code: string(item.code, 'code'), text: string(item.text, 'text'),
      tone: choice(item.tone, tones, 'tone') ?? 'neutral',
      moved: item.moved === true,
      width: number(item.width, 'width', 8, 1200), height: number(item.height, 'height', 0, 800),
      gap: number(item.gap, 'gap', 0, 160) ?? (kind === 'cells' ? 0 : 18),
      align: choice(item.align, aligns, 'align') ?? 'center'
    };
  }

  const body = element(root.body, 0);
  if (root.edges !== undefined && !Array.isArray(root.edges)) fail('edges must be an array');
  const rawEdges = root.edges as unknown[] | undefined ?? [];
  if (rawEdges.length > 40) fail('maximum 40 edges');
  const edges = rawEdges.map((value): Edge => {
    const edge = record(value, 'edge');
    keys(edge, ['from', 'to', 'tone', 'fromSide', 'toSide'], 'edge');
    const from = identifier(edge.from, 'from');
    const to = identifier(edge.to, 'to');
    if (!from || !to || !ids.has(from) || !ids.has(to)) fail('edge references an unknown id');
    if (from === to) fail('self-edges are not supported');
    return { from, to, tone: choice(edge.tone, tones, 'edge tone') ?? 'owner',
      fromSide: choice(edge.fromSide, sides, 'fromSide'), toSide: choice(edge.toSide, sides, 'toSide') };
  });
  return { title: string(root.title, 'title') ?? '', caption: string(root.caption, 'caption', 400) ?? '', body, edges };
}

// Deterministic text metrics with deliberately generous glyph widths. This
// keeps server rendering independent of installed fonts; authors may widen
// a block when they need more room for an unusually wide identifier.
function textWidth(value: string, size: number, mono: boolean) {
  return [...value].reduce((width, char) => width + size * (
    mono ? .66 : /[ilI.,:;!| ]/.test(char) ? .39 : /[MW@ЖШЩЮ]/.test(char) ? .90 : .65
  ), 0);
}

function wrap(value: string, maxWidth: number, size: number, mono: boolean): string[] {
  const lines: string[] = [];
  for (const paragraph of value.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? line + ' ' + word : word;
      if (line && textWidth(candidate, size, mono) > maxWidth) {
        lines.push(line);
        line = '';
      }
      if (textWidth(word, size, mono) > maxWidth) {
        for (const char of word) {
          if (line && textWidth(line + char, size, mono) > maxWidth) {
            lines.push(line);
            line = '';
          }
          line += char;
        }
      } else {
        line = line ? line + ' ' + word : word;
      }
    }
    lines.push(line);
  }
  return lines;
}

function textLines(element: Element, width: number): TextLine[] {
  const lines: TextLine[] = [];
  function add(value: string | undefined, size: number, mono: boolean, strong: boolean, muted: boolean, strike = false) {
    if (value === undefined) return;
    for (const part of wrap(value, width, size, mono)) lines.push({ value: part, size, mono, strong, muted, strike });
  }
  add(element.title, 16, false, true, false);
  add(element.code, 16, true, true, element.moved, element.moved);
  add(element.text, 14, false, false, true);
  return lines;
}

function linesHeight(lines: TextLine[]) {
  return lines.reduce((sum, line) => sum + line.size + 6, 0);
}

function shift(layout: Layout, x: number, y: number) {
  layout.bounds.x += x;
  layout.bounds.y += y;
  for (const child of layout.children) shift(child, x, y);
}

function measure(element: Element): Layout {
  const { kind } = element;
  const framed = kind === 'group' || kind === 'node';
  const padding = kind === 'group' ? 18 : kind === 'node' ? 14 : 0;
  const horizontal = kind === 'row' || kind === 'cells';
  const children = element.children.map((child) => measure(child));
  const gap = element.gap;
  if (kind === 'space') return { element, bounds: { x: 0, y: 0, w: element.width ?? 8, h: element.height ?? 24 }, children, lines: [] };

  const childWidth = horizontal
    ? children.reduce((sum, child) => sum + child.bounds.w, 0) + Math.max(0, children.length - 1) * gap
    : Math.max(0, ...children.map((child) => child.bounds.w));
  const childHeight = horizontal
    ? Math.max(0, ...children.map((child) => child.bounds.h))
    : children.reduce((sum, child) => sum + child.bounds.h, 0) + Math.max(0, children.length - 1) * gap;

  const naturalText = Math.max(
    textWidth(element.title ?? '', 16, false),
    textWidth(element.code ?? '', 16, true),
    textWidth(element.text ?? '', 14, false)
  );
  const w = Math.ceil(Math.max(element.width ?? 0, framed ? 94 : 0,
    childWidth + 2 * padding, Math.min(naturalText, 310) + 2 * padding));
  const lines = textLines(element, Math.max(20, w - 2 * padding));
  const header = linesHeight(lines);
  const separation = header && children.length ? 12 : 0;
  const naturalHeight = header + separation + childHeight + 2 * padding;
  const h = Math.ceil(Math.max(element.height ?? 0, framed ? 52 : 0, naturalHeight));
  const roomW = w - 2 * padding;
  const roomH = h - 2 * padding - header - separation;

  // Memory cells share a height. They are laid out edge-to-edge, not as
  // individually rounded boxes, so they read as a contiguous memory block.
  if (kind === 'cells') {
    for (const child of children) child.bounds.h = childHeight;
  }
  let cursor = horizontal ? padding + (roomW - childWidth) / 2 : padding + header + separation + (roomH - childHeight) / 2;
  const alignOffset = (available: number, size: number) => element.align === 'start' ? 0 : element.align === 'end' ? available - size : (available - size) / 2;
  for (const child of children) {
    if (horizontal) {
      shift(child, cursor, padding + header + separation + alignOffset(roomH, child.bounds.h));
      cursor += child.bounds.w + gap;
    } else {
      shift(child, padding + alignOffset(roomW, child.bounds.w), cursor);
      cursor += child.bounds.h + gap;
    }
  }
  return { element, bounds: { x: 0, y: 0, w, h }, children, lines };
}

function collect(layout: Layout, result: Layout[] = []): Layout[] {
  result.push(layout);
  for (const child of layout.children) collect(child, result);
  return result;
}

function contains(outer: Rect, inner: Rect) {
  return outer.x <= inner.x && outer.y <= inner.y && outer.x + outer.w >= inner.x + inner.w && outer.y + outer.h >= inner.y + inner.h;
}

function anchor(rect: Rect, side: Side): Point {
  switch (side) {
    case 'top': return { x: rect.x + rect.w / 2, y: rect.y };
    case 'bottom': return { x: rect.x + rect.w / 2, y: rect.y + rect.h };
    case 'left': return { x: rect.x, y: rect.y + rect.h / 2 };
    case 'right': return { x: rect.x + rect.w, y: rect.y + rect.h / 2 };
  }
}

function outward(point: Point, side: Side, distance = 6): Point {
  return {
    x: point.x + (side === 'right' ? distance : side === 'left' ? -distance : 0),
    y: point.y + (side === 'bottom' ? distance : side === 'top' ? -distance : 0)
  };
}

function automaticSides(from: Rect, to: Rect): [Side, Side] {
  if (from.y + from.h <= to.y) return ['bottom', 'top'];
  if (to.y + to.h <= from.y) return ['top', 'bottom'];
  if (from.x + from.w <= to.x) return ['right', 'left'];
  if (to.x + to.w <= from.x) return ['left', 'right'];
  return ['bottom', 'top'];
}

function same(a: Point, b: Point) { return a.x === b.x && a.y === b.y; }

function simplify(points: Point[]) {
  const result: Point[] = [];
  for (const point of points) {
    if (result.length && same(result[result.length - 1], point)) continue;
    const a = result[result.length - 2], b = result[result.length - 1];
    // Remove collinear intermediate points only when the path does not turn back.
    if (a && b && ((a.x === b.x && b.x === point.x && (b.y - a.y) * (point.y - b.y) >= 0) ||
      (a.y === b.y && b.y === point.y && (b.x - a.x) * (point.x - b.x) >= 0))) result.pop();
    result.push(point);
  }
  return result;
}

function crosses(a: Point, b: Point, rect: Rect) {
  if (a.x === b.x) return a.x > rect.x && a.x < rect.x + rect.w &&
    Math.min(a.y, b.y) < rect.y + rect.h && Math.max(a.y, b.y) > rect.y;
  if (a.y === b.y) return a.y > rect.y && a.y < rect.y + rect.h &&
    Math.min(a.x, b.x) < rect.x + rect.w && Math.max(a.x, b.x) > rect.x;
  return true;
}

function route(edge: Edge, items: Layout[], canvas: Rect): Point[] {
  const source = items.find((item) => item.element.id === edge.from)!;
  const target = items.find((item) => item.element.id === edge.to)!;
  const from = source.bounds;
  const to = target.bounds;
  const automatic = automaticSides(from, to);
  const fromSide = edge.fromSide ?? automatic[0];
  const toSide = edge.toSide ?? automatic[1];
  const start = anchor(from, fromSide);
  const end = anchor(to, toSide);
  // For composite memory regions, align the port with the incoming pointer
  // when possible. This avoids an unnecessary bend and does not imply that
  // the arrow points at any particular member of the composite value.
  if (target.element.kind === 'cells' || target.element.kind === 'group') {
    if (toSide === 'top' || toSide === 'bottom') {
      end.x = Math.max(to.x + 12, Math.min(to.x + to.w - 12, start.x));
    } else {
      end.y = Math.max(to.y + 12, Math.min(to.y + to.h - 12, start.y));
    }
  }
  const a = outward(start, fromSide), b = outward(end, toSide);
  const blockers = items.filter(({ element, bounds }) =>
    (element.kind === 'group' || element.kind === 'node' || element.kind === 'text') &&
    bounds !== from && bounds !== to && !contains(bounds, from) && !contains(bounds, to) &&
    !contains(from, bounds) && !contains(to, bounds))
    .map(({ bounds }) => ({ x: bounds.x - 4, y: bounds.y - 4, w: bounds.w + 8, h: bounds.h + 8 }));
  // Try straight, elbow and corridor paths. Candidate corridors are derived
  // from obstacle boundaries; no pixel-based search or unbounded recursion.
  const xs = [(a.x + b.x) / 2, 10, canvas.w - 10, ...blockers.flatMap((r) => [r.x - 3, r.x + r.w + 3])];
  const ys = [(a.y + b.y) / 2, 10, canvas.h - 10, ...blockers.flatMap((r) => [r.y - 3, r.y + r.h + 3])];
  const candidates: Point[][] = [
    [a, { x: a.x, y: b.y }, b],
    [a, { x: b.x, y: a.y }, b],
    ...xs.map((x) => [a, { x, y: a.y }, { x, y: b.y }, b]),
    ...ys.map((y) => [a, { x: a.x, y }, { x: b.x, y }, b])
  ];
  const obstacles = [...blockers, from, to];
  let best: Point[] | undefined;
  let cost = Infinity;
  for (const middle of candidates) {
    const points = simplify([start, ...middle, end]);
    if (points.some((p) => p.x < 4 || p.y < 4 || p.x > canvas.w - 4 || p.y > canvas.h - 4)) continue;
    if (points.slice(1).some((point, i) => obstacles.some((rect) => crosses(points[i], point, rect)))) continue;
    const length = points.slice(1).reduce((sum, point, i) =>
      sum + Math.abs(point.x - points[i].x) + Math.abs(point.y - points[i].y), 0) + 20 * (points.length - 2);
    if (length < cost) { best = points; cost = length; }
  }
  if (!best) fail('cannot route ' + edge.from + ' → ' + edge.to + '; increase gaps or specify edge sides');
  return best;
}

function escape(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!);
}

function color(theme: Theme, name: keyof Palette) {
  return theme === 'book' ? 'var(--book-diagram-' + name + ',' + light[name] + ')' :
    (theme === 'dark' ? dark : light)[name];
}

function paintText(lines: TextLine[], x: number, y: number, centered: boolean, theme: Theme, tone: Tone = 'neutral') {
  return lines.map((line) => {
    y += line.size;
    const fill = line.strike ? color(theme, 'muted') :
      line.muted ? color(theme, tone === 'error' ? 'error' : 'muted') : color(theme, 'foreground');
    const result = '<text x="' + x + '" y="' + y + '" font-size="' + line.size +
      '" font-weight="' + (line.strong ? '600' : '400') + '" text-anchor="' + (centered ? 'middle' : 'start') +
      '" fill="' + fill + '"' +
      (line.mono ? ' font-family="ui-monospace, SFMono-Regular, Consolas, Liberation Mono, monospace"' : '') +
      (line.strike ? ' text-decoration="line-through"' : '') + '>' + escape(line.value) + '</text>';
    y += 6;
    return result;
  }).join('');
}

function paint(layout: Layout, theme: Theme, cell = false): string {
  const { element, bounds: r, lines, children } = layout;
  const { kind, tone, moved } = element;
  const framed = kind === 'node' || kind === 'group';
  const stroke = color(theme, tone);
  const parts: string[] = [];
  if (framed) {
    parts.push('<rect x="' + r.x + '" y="' + r.y + '" width="' + r.w + '" height="' + r.h +
      '" rx="' + (cell ? 0 : 8) + '" fill="' + stroke + '" fill-opacity="' + (kind === 'group' ? '.035' : '.085') +
      '" stroke="' + stroke + '" stroke-width="1.5"' + (moved ? ' stroke-dasharray="6 4"' : '') + '/>');
  }
  if (lines.length) {
    const left = kind === 'group';
    const y = children.length ? r.y + (left ? 18 : 0) : r.y + (r.h - linesHeight(lines)) / 2;
    parts.push(paintText(lines, left ? r.x + 18 : r.x + r.w / 2, y, !left, theme, moved ? 'error' : tone));
  }
  for (const child of children) parts.push(paint(child, theme, kind === 'cells'));
  return parts.join('');
}

function paintEdge(points: Point[], tone: Tone, theme: Theme) {
  const end = points[points.length - 1], prev = points[points.length - 2];
  const dx = Math.sign(end.x - prev.x), dy = Math.sign(end.y - prev.y);
  const tipLength = Math.min(9, Math.abs(end.x - prev.x) + Math.abs(end.y - prev.y));
  const base = { x: end.x - tipLength * dx, y: end.y - tipLength * dy };
  const stroke = color(theme, tone);
  return '<polyline points="' + [...points.slice(0, -1), base].map((p) => p.x + ',' + p.y).join(' ') +
    '" fill="none" stroke="' + stroke + '" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>' +
    '<polygon points="' + end.x + ',' + end.y + ' ' + (base.x - 4 * dy) + ',' + (base.y + 4 * dx) +
    ' ' + (base.x + 4 * dy) + ',' + (base.y - 4 * dx) + '" fill="' + stroke + '"/>';
}

function build(source: string) {
  const diagram = parse(source);
  const layout = measure(diagram.body);
  const width = Math.max(320, layout.bounds.w + 48);
  const titleLines = wrap(diagram.title, width - 48, 18, false);
  const captionLines = wrap(diagram.caption, width - 48, 13, false);
  const headerHeight = diagram.title ? titleLines.length * 24 + 12 : 0;
  const footerHeight = diagram.caption ? captionLines.length * 19 + 12 : 0;
  const height = layout.bounds.h + 48 + headerHeight + footerHeight;
  if (width > 1800 || height > 2400) fail('diagram exceeds 1800 × 2400 units; split it into smaller figures');
  shift(layout, (width - layout.bounds.w) / 2, 24 + headerHeight);
  const items = collect(layout);
  const edges = diagram.edges.map((edge) => ({ edge, points: route(edge, items, { x: 0, y: 0, w: width, h: height }) }));

  function svg(theme: Theme) {
    const title = diagram.title || 'Diagram';
    const header = diagram.title ? paintText(titleLines.map((value) =>
      ({ value, size: 18, mono: false, strong: true, muted: false, strike: false })), 24, 16, false, theme) : '';
    const footer = diagram.caption ? paintText(captionLines.map((value) =>
      ({ value, size: 13, mono: false, strong: false, muted: true, strike: false })), 24, height - 19 * captionLines.length - 12, false, theme) : '';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' +
      width + ' ' + height + '" role="img" aria-label="' + escape(title) +
      '" font-family="system-ui, sans-serif"><title>' + escape(title) + '</title><desc>' + escape(diagram.caption) + '</desc>' +
      '<rect x="1" y="1" width="' + (width - 2) + '" height="' + (height - 2) +
      '" rx="12" fill="' + color(theme, 'background') + '" stroke="' + color(theme, 'frame') + '"/>' +
      header + paint(layout, theme) + edges.map(({ edge, points }) => paintEdge(points, edge.tone, theme)).join('') +
      footer + '</svg>';
  }
  return { svg, width, height };
}

/** Portable SVG with explicit colors and dimensions; usable as ![](file.svg). */
export function renderDiagramSvg(source: string, theme: 'light' | 'dark' = 'light'): string {
  return build(source).svg(theme);
}

/** Server-rendered article figure and two standalone, downloadable SVGs. */
export function renderDiagramFigure(source: string, contextKey: string, id: string): string {
  const diagram = build(source);
  const ru = contextKey.split('/').at(-1) === 'ru';
  const filename = 'diagram-' + id.replace(/[^a-zA-Z0-9_-]/g, '-');
  function link(theme: 'light' | 'dark', label: string) {
    return '<a download="' + filename + '-' + theme + '.svg" href="data:image/svg+xml;charset=utf-8,' +
      encodeURIComponent(diagram.svg(theme)) + '">' + label + '</a>';
  }
  return '<figure class="book-diagram"><div class="book-diagram-scroll" tabindex="0" aria-label="' +
    (ru ? 'Схема' : 'Diagram') + '">' + diagram.svg('book') + '</div><div class="book-diagram-actions">' +
    link('light', ru ? 'SVG (светлая)' : 'SVG (light)') + link('dark', ru ? 'SVG (тёмная)' : 'SVG (dark)') +
    '</div></figure>';
}
