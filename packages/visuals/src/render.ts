import { getControls, getState, getVariants, materializeDiagram, type State, type Control } from './model.ts';

/**
 * Declarative documentation diagrams. No browser, font measurement API,
 * third-party layout dependency or author-supplied HTML is required.
 * The same layout is used for the embedded figure and standalone SVG.
 */

type Kind = 'row' | 'column' | 'group' | 'node' | 'cells' | 'text' | 'space' | 'memory-layout' | 'bar' | 'divider' | 'metric' | 'ellipse';
type Tone = 'neutral' | 'owner' | 'read' | 'write' | 'success' | 'error';
type Side = 'top' | 'right' | 'bottom' | 'left';
type Align = 'start' | 'center' | 'end';
type Theme = 'book' | 'light' | 'dark';

type Style = {
  color?: string; fill?: string; stroke?: string; textColor?: string;
  fillOpacity?: number; strokeOpacity?: number; strokeWidth?: number;
  radius?: number; fontSize?: number; valueSize?: number; dashed?: boolean; textAlign?: Align;
};
type Segment = { name: string; bytes: number; tone: Tone; style: Style; padding: boolean };
type Element = {
  kind: Kind;
  id?: string;
  title?: string;
  code?: string;
  text?: string;
  tone: Tone;
  style: Style;
  segments: Segment[];
  scale?: number;
  value?: number;
  max?: number;
  moved: boolean;
  width?: number;
  height?: number;
  gap: number;
  align: Align;
  children: Element[];
};
type Edge = { from: string; to: string; tone: Tone; style: Style; label?: string; arrow: boolean; gap: number; fromSide?: Side; toSide?: Side };
type Diagram = { title: string; caption: string; align?: 'left' | 'center' | 'right'; width?: number; style: Style; body: Element; edges: Edge[] };
type Point = { x: number; y: number };
type Rect = Point & { w: number; h: number };
type TextLine = { value: string; size: number; mono: boolean; strong: boolean; muted: boolean; strike: boolean };
type Layout = { element: Element; bounds: Rect; lines: TextLine[]; children: Layout[] };
type Palette = Record<Tone | 'foreground' | 'muted' | 'background' | 'frame', string>;

const tones = ['neutral', 'owner', 'read', 'write', 'success', 'error'] as const;
const sides = ['top', 'right', 'bottom', 'left'] as const;
const kinds = ['row', 'column', 'group', 'node', 'cells', 'text', 'space', 'memory-layout', 'bar', 'divider', 'metric', 'ellipse'] as const;
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

function hex(value: unknown, name: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})(?![\s\S])/i.test(value)) {
    fail(name + ': expected a hex color');
  }
  return value;
}

function parseStyle(value: unknown): Style {
  if (value === undefined) return {};
  const item = record(value, 'style');
  keys(item, ['color', 'fill', 'stroke', 'textColor', 'fillOpacity', 'strokeOpacity', 'strokeWidth', 'radius', 'fontSize', 'valueSize', 'dashed', 'textAlign'], 'style');
  if (item.dashed !== undefined && typeof item.dashed !== 'boolean') fail('style.dashed must be boolean');
  return {
    color: hex(item.color, 'style.color'), fill: hex(item.fill, 'style.fill'),
    stroke: hex(item.stroke, 'style.stroke'), textColor: hex(item.textColor, 'style.textColor'),
    fillOpacity: number(item.fillOpacity, 'style.fillOpacity', 0, 1),
    strokeOpacity: number(item.strokeOpacity, 'style.strokeOpacity', 0, 1),
    strokeWidth: number(item.strokeWidth, 'style.strokeWidth', 0, 8),
    radius: number(item.radius, 'style.radius', 0, 80),
    fontSize: number(item.fontSize, 'style.fontSize', 10, 32),
    valueSize: number(item.valueSize, 'style.valueSize', 10, 40),
    dashed: item.dashed === true, textAlign: choice(item.textAlign, aligns, 'style.textAlign')
  };
}

function parseSegments(value: unknown, kind: Kind): Segment[] {
  if (kind !== 'memory-layout') {
    if (value !== undefined) fail('segments requires memory-layout');
    return [];
  }
  if (!Array.isArray(value) || value.length < 1 || value.length > 64) fail('memory-layout requires 1–64 segments');
  return value.map((entry) => {
    const item = record(entry, 'segment');
    keys(item, ['name', 'bytes', 'tone', 'style', 'padding'], 'segment');
    const bytes = number(item.bytes, 'segment.bytes', 1, 4096);
    if (bytes === undefined || !Number.isInteger(bytes)) fail('segment.bytes must be a positive integer');
    if (item.padding !== undefined && typeof item.padding !== 'boolean') fail('segment.padding must be boolean');
    return { name: string(item.name, 'segment.name', 80) ?? '', bytes,
      tone: choice(item.tone, tones, 'segment.tone') ?? 'neutral',
      style: parseStyle(item.style), padding: item.padding === true };
  });
}

function parse(source: string): Diagram {
  if (source.length > 32000) fail('source exceeds 32,000 characters');
  let raw: unknown;
  try { raw = JSON.parse(source); }
  catch (error) { fail(error instanceof Error ? error.message : 'invalid JSON'); }
  const root = record(raw, 'root');
  keys(root, ['title', 'caption', 'body', 'edges', 'width', 'style', 'align'], 'root');
  const ids = new Set<string>();
  let count = 0;

  function element(value: unknown, depth: number): Element {
    if (++count > 60 || depth > 10) fail('maximum 60 elements and 10 nesting levels');
    const item = record(value, 'element');
    keys(item, ['kind', 'id', 'title', 'code', 'text', 'tone', 'moved', 'width', 'height', 'gap', 'align', 'children', 'style', 'segments', 'scale', 'value', 'max'], 'element');
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
    const container = ['row', 'column', 'group', 'cells', 'ellipse'].includes(kind);
    if (container && !children.length) fail(kind + ' requires children');
    if (!container && children.length) fail(kind + ' cannot contain children');
    if (kind === 'cells' && children.some((child) => child.kind !== 'node')) fail('cells accepts only node children');
    if (kind === 'space' && id) fail('a space cannot have an id');
    const segments = parseSegments(item.segments, kind);
    const plotValue = number(item.value, 'value', 0, Number.MAX_SAFE_INTEGER);
    const max = number(item.max, 'max', 0.000001, Number.MAX_SAFE_INTEGER);
    if (kind === 'bar' && (plotValue === undefined || max === undefined || plotValue > max)) fail('bar requires 0 <= value <= max');
    return {
      kind, id, children, segments, value: plotValue, max, scale: number(item.scale, 'scale', 4, 120),
      title: string(item.title, 'title'), code: string(item.code, 'code'), text: string(item.text, 'text'),
      tone: choice(item.tone, tones, 'tone') ?? 'neutral', style: parseStyle(item.style),
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
    keys(edge, ['from', 'to', 'tone', 'fromSide', 'toSide', 'style', 'label', 'arrow', 'gap'], 'edge');
    if (edge.arrow !== undefined && typeof edge.arrow !== 'boolean') fail('edge.arrow must be boolean');
    const from = identifier(edge.from, 'from');
    const to = identifier(edge.to, 'to');
    if (!from || !to || !ids.has(from) || !ids.has(to)) fail('edge references an unknown id');
    if (from === to) fail('self-edges are not supported');
    return { from, to, tone: choice(edge.tone, tones, 'edge tone') ?? 'owner', style: parseStyle(edge.style), label: string(edge.label, 'edge.label', 80), arrow: edge.arrow !== false, gap: number(edge.gap, 'edge.gap', 0, 24) ?? (edge.arrow === false ? 0 : 5),
      fromSide: choice(edge.fromSide, sides, 'fromSide'), toSide: choice(edge.toSide, sides, 'toSide') };
  });
  return { title: string(root.title, 'title') ?? '', caption: string(root.caption, 'caption', 400) ?? '', align: choice(root.align, ['left', 'center', 'right'], 'root.align'), width: number(root.width, 'width', 320, 1600), style: parseStyle(root.style), body, edges };
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
      line = line ? line + ' ' + word : word;
    }
    lines.push(line);
  }
  return lines;
}

function textLines(element: Element, width: number): TextLine[] {
  const lines: TextLine[] = [];
  function add(value: string | undefined, size: number, mono: boolean, strong: boolean, muted: boolean, strike = false) {
    if (value === undefined) return;
    for (const part of (mono ? value.split('\n') : wrap(value, width, size, mono))) lines.push({ value: part, size, mono, strong, muted, strike });
  }
  add(element.title, element.style.fontSize ?? 16, false, true, false);
  add(element.code, element.style.valueSize ?? (element.kind === 'metric' ? 28 : element.style.fontSize ?? 16), true, true, element.moved, element.moved);
  add(element.text, element.style.fontSize ?? 14, false, false, true);
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

function measure(element: Element, minimumWidth = 0): Layout {
  const { kind } = element;
  const framed = kind === 'group' || kind === 'node' || kind === 'ellipse';
  const padding = kind === 'ellipse' ? 44 : kind === 'group' ? 18 : kind === 'node' ? 14 : 0;
  const horizontal = kind === 'row' || kind === 'cells';
  let children = element.children.map((child) => measure(child));
  // A simple vertical flow of nodes should have one consistent width.
  if (kind === 'column' && children.length > 1 && children.every((child) => child.element.kind === 'node')) {
    const width = Math.max(...children.map((child) => child.bounds.w));
    children = element.children.map((child) => measure(child, width));
  }
  const gap = element.gap;
  if (kind === 'divider') return { element, bounds: { x: 0, y: 0, w: element.width ?? 320, h: element.height ?? 12 }, children, lines: [] };
  if (kind === 'memory-layout' || kind === 'bar') {
    const bytes = element.segments.reduce((sum, segment) => sum + segment.bytes, 0);
    const plotWidth = kind === 'memory-layout' ? bytes * (element.scale ?? Math.min(64, 600 / bytes)) + 24 : 320;
    const w = Math.ceil(Math.max(minimumWidth, element.width ?? 0, plotWidth));
    const lines = textLines(element, w - 24);
    const h = Math.ceil(Math.max(element.height ?? 0, linesHeight(lines) + (kind === 'memory-layout' ? 106 : 38)));
    return { element, bounds: {x: 0, y: 0, w, h}, children, lines };
  }
  if (kind === 'space') return { element, bounds: { x: 0, y: 0, w: element.width ?? 8, h: element.height ?? 24 }, children, lines: [] };

  const childWidth = horizontal
    ? children.reduce((sum, child) => sum + child.bounds.w, 0) + Math.max(0, children.length - 1) * gap
    : Math.max(0, ...children.map((child) => child.bounds.w));
  const childHeight = horizontal
    ? Math.max(0, ...children.map((child) => child.bounds.h))
    : children.reduce((sum, child) => sum + child.bounds.h, 0) + Math.max(0, children.length - 1) * gap;

  const titleSize = element.style.fontSize ?? 16;
  const codeSize = element.style.valueSize ?? (kind === 'metric' ? 28 : titleSize);
  const textSize = element.style.fontSize ?? 14;
  const codeWidth = Math.max(0, ...(element.code ?? '').split('\n').map((line) => textWidth(line, codeSize, true)));
  const naturalText = Math.max(
    textWidth(element.title ?? '', titleSize, false),
    codeWidth,
    textWidth(element.text ?? '', textSize, false)
  );
  const longestWord = Math.max(0, ...[ [element.title, titleSize, false], [element.code, codeSize, true], [element.text, textSize, false] ].flatMap(([value, size, mono]) =>
    String(value ?? '').split(/\s+/).map((word) => textWidth(word, Number(size), Boolean(mono)))));
  const w = Math.ceil(Math.max(minimumWidth, element.width ?? 0, framed && element.width === undefined ? 94 : 0,
    childWidth + 2 * padding, Math.min(naturalText, 310) + 2 * padding + 2, codeWidth + 2 * padding + 2, longestWord + 2 * padding + 2));
  const lines = textLines(element, Math.max(20, w - 2 * padding));
  const header = linesHeight(lines);
  const separation = header && children.length ? 12 : 0;
  const naturalHeight = header + separation + childHeight + 2 * padding;
  const h = Math.ceil(Math.max(element.height ?? 0, framed && element.height === undefined ? 52 : 0, naturalHeight));
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

// Unframed annotations are soft obstacles, unlike actual memory and node
// boundaries. Use the same estimated text metrics as the painter.
function annotationBounds(layout: Layout): Rect[] {
  const { element, bounds, lines } = layout;
  if (element.kind !== 'text' && element.kind !== 'metric') return [];
  let y = bounds.y + (bounds.h - linesHeight(lines)) / 2;
  const align = element.style.textAlign ?? 'center';
  return lines.flatMap((line) => {
    const width = textWidth(line.value, line.size, line.mono);
    const x = align === 'start' ? bounds.x : align === 'end'
      ? bounds.x + bounds.w - width : bounds.x + (bounds.w - width) / 2;
    const rect = { x: x - 4, y: y - 3, w: width + 8, h: line.size + 9 };
    y += line.size + 6;
    return line.value.trim() ? [rect] : [];
  });
}

function edgeAnnotations(edge: Edge, items: Layout[]): Rect[] {
  return items.filter(({ element }) => element.id !== edge.from && element.id !== edge.to)
    .flatMap(annotationBounds);
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
    (element.kind === 'group' || element.kind === 'node' || element.kind === 'ellipse') &&
    bounds !== from && bounds !== to && !contains(bounds, from) && !contains(bounds, to) &&
    !contains(from, bounds) && !contains(to, bounds))
    .map(({ bounds }) => ({ x: bounds.x - 4, y: bounds.y - 4, w: bounds.w + 8, h: bounds.h + 8 }));
  const annotations = edgeAnnotations(edge, items);
  const corridors = [...blockers, ...annotations];
  // Try straight, elbow and corridor paths. Candidate corridors are derived
  // from obstacle boundaries; no pixel-based search or unbounded recursion.
  const xs = [(a.x + b.x) / 2, 10, canvas.w - 10, ...corridors.flatMap((r) => [r.x - 3, r.x + r.w + 3])];
  const ys = [(a.y + b.y) / 2, 10, canvas.h - 10, ...corridors.flatMap((r) => [r.y - 3, r.y + r.h + 3])];
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
    // Prefer clear routes when comparable, but do not create several
    // unnecessary bends just to avoid an unframed text annotation.
    const intersections = annotations.filter((rect) =>
      points.slice(1).some((point, i) => crosses(points[i], point, rect))).length;
    const score = length + intersections * 8;
    if (score < cost) { best = points; cost = score; }
  }
  if (!best) fail('cannot route ' + edge.from + ' → ' + edge.to + '; increase gaps or specify edge sides');
  return insetEdgeEndpoints(best, edge.gap);
}

/** Leave breathing room at both endpoints without rerouting the edge.
 * Cap the inset for short legs so even tightly packed nodes remain connected.
 * A straight path shares its available length between the two insets.
 */
function insetEdgeEndpoints(points: Point[], gap: number): Point[] {
  if (gap === 0 || points.length < 2) return points;
  const inset = (point: Point, neighbor: Point): Point => {
    const length = Math.abs(neighbor.x - point.x) + Math.abs(neighbor.y - point.y);
    const distance = Math.min(gap, length / (points.length === 2 ? 3 : 2));
    return {
      x: point.x + Math.sign(neighbor.x - point.x) * distance,
      y: point.y + Math.sign(neighbor.y - point.y) * distance
    };
  };
  const last = points.length - 1;
  return [inset(points[0], points[1]), ...points.slice(1, last), inset(points[last], points[last - 1])];
}

function escape(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!);
}

function color(theme: Theme, name: keyof Palette) {
  return theme === 'book' ? 'var(--book-diagram-' + name + ',' + light[name] + ')' :
    (theme === 'dark' ? dark : light)[name];
}

function paintText(lines: TextLine[], x: number, y: number, centered: boolean, theme: Theme, tone: Tone = 'neutral', textColor?: string, align?: Align) {
  return lines.map((line) => {
    y += line.size;
    const fill = textColor ?? (line.strike ? color(theme, 'muted') :
      line.muted ? color(theme, tone === 'error' ? 'error' : 'muted') : color(theme, 'foreground'));
    const result = '<text x="' + x + '" y="' + y + '" font-size="' + line.size +
      '" font-weight="' + (line.strong ? '600' : '400') + '" text-anchor="' + (align === 'end' ? 'end' : align === 'start' ? 'start' : centered ? 'middle' : 'start') +
      '" fill="' + fill + '"' +
      (line.mono ? ' font-family="ui-monospace, SFMono-Regular, Consolas, Liberation Mono, monospace" xml:space="preserve"' : '') +
      (line.strike ? ' text-decoration="line-through"' : '') + '>' + escape(line.value) + '</text>';
    y += 6;
    return result;
  }).join('');
}

function paint(layout: Layout, theme: Theme, cell = false): string {
  const { element, bounds: r, lines, children } = layout;
  const { kind, tone, moved } = element;
  const framed = kind === 'node' || kind === 'group' || kind === 'ellipse';
  const style = element.style;
  const accent = style.color ?? color(theme, tone);
  const stroke = style.stroke ?? accent;
  const parts: string[] = [];
  if (kind === 'divider') return '<path d="M' + r.x + ' ' + (r.y+r.h/2) + ' H' + (r.x+r.w) + '" stroke="' + (style.stroke ?? color(theme,'frame')) + '" stroke-width="' + (style.strokeWidth ?? 1) + '"/>';
  if (kind === 'memory-layout' || kind === 'bar') return paintPlot(layout, theme);
  if (kind === 'ellipse') {
    parts.push('<ellipse cx="' + (r.x+r.w/2) + '" cy="' + (r.y+r.h/2) + '" rx="' + r.w/2 + '" ry="' + r.h/2 + '" fill="' + (style.fill ?? accent) + '" fill-opacity="' + (style.fillOpacity ?? .06) + '" stroke="' + stroke + '" stroke-width="' + (style.strokeWidth ?? 1.5) + '"/>');
  } else if (framed) {
    parts.push('<rect x="' + r.x + '" y="' + r.y + '" width="' + r.w + '" height="' + r.h +
      '" rx="' + (style.radius ?? (cell ? 0 : 8)) + '" fill="' + (style.fill ?? accent) + '" fill-opacity="' + (style.fillOpacity ?? (kind === 'group' ? .035 : .085)) +
      '" stroke="' + stroke + '" stroke-opacity="' + (style.strokeOpacity ?? 1) + '" stroke-width="' + (style.strokeWidth ?? 1.5) + '"' + (moved || style.dashed ? ' stroke-dasharray="6 4"' : '') + '/>');
  }
  if (lines.length) {
    const left = kind === 'group' || style.textAlign === 'start';
    const y = children.length ? r.y + (kind === 'ellipse' ? 44 : left ? 18 : 0) : r.y + (r.h - linesHeight(lines)) / 2;
    const inset = kind === 'group' ? 18 : kind === 'node' ? 14 : 0;
    const x = style.textAlign === 'end' ? r.x + r.w - inset : left ? r.x + inset : r.x + r.w / 2;
    parts.push(paintText(lines, x, y, !left, theme, moved ? 'error' : tone, style.textColor, style.textAlign));
  }
  for (const child of children) parts.push(paint(child, theme, kind === 'cells'));
  return parts.join('');
}

// A byte strip is deliberately independent of ordinary node minimum widths.
// A one-byte segment is always exactly half as wide as a two-byte segment.
function paintPlot(layout: Layout, theme: Theme) {
  const { element, bounds: r, lines } = layout;
  const style = element.style;
  const accent = style.color ?? color(theme, element.tone);
  const x = r.x + 12;
  const y = r.y + linesHeight(lines) + 12;
  let result = paintText(lines, x, r.y, false, theme, element.tone, style.textColor);
  if (element.kind === 'bar') {
    const w = r.w - 24;
    result += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="16" rx="5" fill="' + color(theme,'neutral') + '" fill-opacity=".12"/>';
    result += '<rect x="' + x + '" y="' + y + '" width="' + (w * element.value! / element.max!) + '" height="16" rx="5" fill="' + (style.fill ?? accent) + '" fill-opacity="' + (style.fillOpacity ?? 1) + '"/>';
    return result;
  }
  const total = element.segments.reduce((sum, segment) => sum + segment.bytes, 0);
  const scale = element.scale ?? Math.min(64, 600 / total);
  const label = (value: string, cx: number, cy: number, size: number, fill: string, anchor = 'middle') =>
    '<text x="' + cx + '" y="' + cy + '" font-size="' + size + '" text-anchor="' + anchor + '" fill="' + fill + '">' + escape(value) + '</text>';
  let offset = 0;
  for (const segment of element.segments) {
    const sx = x + offset * scale;
    const w = segment.bytes * scale;
    const colorValue = segment.style.color ?? color(theme, segment.tone);
    result += label(String(offset), sx, y + 8, 12, color(theme,'muted'), 'start');
    result += '<rect x="' + sx + '" y="' + (y+18) + '" width="' + w + '" height="54" rx="' + (segment.style.radius ?? 3) +
      '" fill="' + (segment.style.fill ?? colorValue) + '" fill-opacity="' + (segment.style.fillOpacity ?? .16) + '" stroke="' +
      (segment.style.stroke ?? colorValue) + '" stroke-opacity="' + (segment.style.strokeOpacity ?? 1) + '" stroke-width="' + (segment.style.strokeWidth ?? 1.2) +
      '"' + (segment.padding || segment.style.dashed ? ' stroke-dasharray="5 3"' : '') + '/>';
    const name = textWidth(segment.name, 14, false) <= w - 6 ? segment.name :
      textWidth(segment.name, 11, false) <= w - 6 ? segment.name : segment.name.slice(0,1);
    const textColor = segment.style.textColor ?? color(theme,'foreground');
    if (w >= 14) result += label(name, sx+w/2, y+40, textWidth(name,14,false) <= w-6 ? 14 : 11, textColor);
    if (w >= 28) result += label(segment.bytes + ' B', sx+w/2, y+59, 11, textColor);
    offset += segment.bytes;
  }
  result += label(String(total), x+total*scale, y+8, 12, color(theme,'muted'), 'end');
  return result;
}

/** Hide only the parts of a shaft behind text, not the underlying diagram.
 * Geometric clipping avoids opaque backgrounds and document-wide SVG IDs.
 */
function visibleShaft(points: Point[], annotations: Rect[]): Point[][] {
  if (!annotations.some((rect) => points.slice(1).some((p, i) => crosses(points[i], p, rect)))) {
    return [points];
  }
  const result: Point[][] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const vertical = a.x === b.x;
    const start = vertical ? a.y : a.x;
    const end = vertical ? b.y : b.x;
    const length = Math.abs(end - start);
    if (!length) continue;
    const direction = Math.sign(end - start);
    const pointAt = (distance: number): Point => vertical
      ? { x: a.x, y: start + direction * distance }
      : { x: start + direction * distance, y: a.y };
    const hidden = annotations.filter((rect) => crosses(a, b, rect)).map((rect) => {
      const low = vertical ? rect.y : rect.x;
      const high = low + (vertical ? rect.h : rect.w);
      return {
        from: Math.max(0, Math.min((low - start) * direction, (high - start) * direction)),
        to: Math.min(length, Math.max((low - start) * direction, (high - start) * direction))
      };
    }).sort((a, b) => a.from - b.from);
    function append(from: number, to: number) {
      if (to <= from) return;
      const first = pointAt(from), last = pointAt(to);
      const previous = result[result.length - 1];
      if (previous && same(previous[previous.length - 1], first)) previous.push(last);
      else result.push([first, last]);
    }
    let cursor = 0;
    for (const interval of hidden) {
      append(cursor, interval.from);
      cursor = Math.max(cursor, interval.to);
    }
    append(cursor, length);
  }
  return result;
}

function paintEdge(points: Point[], edge: Edge, theme: Theme, annotations: Rect[]) {
  const end = points[points.length - 1], prev = points[points.length - 2];
  const dx = Math.sign(end.x - prev.x), dy = Math.sign(end.y - prev.y);
  const tipLength = edge.arrow ? Math.min(9, Math.abs(end.x - prev.x) + Math.abs(end.y - prev.y)) : 0;
  const base = { x: end.x - tipLength * dx, y: end.y - tipLength * dy };
  const stroke = edge.style.stroke ?? edge.style.color ?? color(theme, edge.tone);
  const opacity = edge.style.strokeOpacity ?? 1;
  const width = edge.style.strokeWidth ?? 1.8;
  const longest = points.slice(1).map((p, i) => ({a: points[i], b: p, length: Math.abs(p.x - points[i].x) + Math.abs(p.y - points[i].y)})).sort((a,b) => b.length - a.length)[0];
  const label = edge.label ? '<text x="' + ((longest.a.x + longest.b.x)/2 + (longest.a.x === longest.b.x ? 8 : 0)) + '" y="' + ((longest.a.y + longest.b.y)/2 - 7) + '" font-size="13" text-anchor="' + (longest.a.x === longest.b.x ? 'start' : 'middle') + '" fill="' + (edge.style.textColor ?? color(theme, 'foreground')) + '">' + escape(edge.label) + '</text>' : '';
  const shaft = visibleShaft([...points.slice(0, -1), base], annotations);
  return shaft.map((part) => '<polyline points="' + part.map((p) => p.x + ',' + p.y).join(' ') +
    '" fill="none" stroke="' + stroke + '" stroke-opacity="' + opacity + '" stroke-width="' + width + '" stroke-linejoin="round" stroke-linecap="round"' + (edge.style.dashed ? ' stroke-dasharray="6 4"' : '') + '/>').join('') +
    (edge.arrow ? '<polygon points="' + end.x + ',' + end.y + ' ' + (base.x - 4 * dy) + ',' + (base.y + 4 * dx) +
    ' ' + (base.x + 4 * dy) + ',' + (base.y - 4 * dx) + '" fill="' + stroke + '" fill-opacity="' + opacity + '"/>' : '') + label;
}

function build(source: string, state: State = {}, embedded = false) {
  const diagram = parse(materializeDiagram(source, state));
  const layout = measure(diagram.body);
  const width = Math.ceil(Math.max(diagram.width ?? 320, layout.bounds.w + 48,
    Math.min(800, textWidth(diagram.title, 18, false) + 52),
    ...diagram.title.split(/\s+/).map((word) => Math.ceil(textWidth(word, 18, false)) + 52),
    ...diagram.caption.split(/\s+/).map((word) => Math.ceil(textWidth(word, 13, false)) + 52)));
  const titleLines = wrap(diagram.title, width - 48, 18, false);
  const captionLines = wrap(diagram.caption, width - 48, 13, false);
  const headerHeight = !embedded && diagram.title ? titleLines.length * 24 + 12 : 0;
  const footerHeight = diagram.caption ? captionLines.length * 19 + 12 : 0;
  const height = layout.bounds.h + 48 + headerHeight + footerHeight;
  if (width > 1800 || height > 2400) fail('diagram exceeds 1800 × 2400 units; split it into smaller figures');
  shift(layout, (width - layout.bounds.w) / 2, 24 + headerHeight);
  const items = collect(layout);
  const edges = diagram.edges.map((edge) => ({ edge, points: route(edge, items, { x: 0, y: 0, w: width, h: height }) }));

  function svg(theme: Theme) {
    const title = diagram.title || 'Diagram';
    const header = !embedded && diagram.title ? paintText(titleLines.map((value) =>
      ({ value, size: 18, mono: false, strong: true, muted: false, strike: false })), 24, 16, false, theme) : '';
    const footer = diagram.caption ? paintText(captionLines.map((value) =>
      ({ value, size: 13, mono: false, strong: false, muted: true, strike: false })), 24, height - 19 * captionLines.length - 12, false, theme) : '';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' +
      width + ' ' + height + '" role="img" aria-label="' + escape(title) +
      '" font-family="system-ui, sans-serif"><title>' + escape(title) + '</title><desc>' + escape(diagram.caption) + '</desc>' +
      '<rect x="1" y="1" width="' + (width - 2) + '" height="' + (height - 2) +
      '" rx="' + (diagram.style.radius ?? 12) + '" fill="' + (diagram.style.fill ?? color(theme, 'background')) + '" fill-opacity="' + (diagram.style.fillOpacity ?? 1) + '" stroke="' + (diagram.style.stroke ?? color(theme, 'frame')) + '" stroke-opacity="' + (diagram.style.strokeOpacity ?? 1) + '"/>' +
      header + paint(layout, theme) + edges.map(({ edge, points }) => paintEdge(points, edge, theme, edgeAnnotations(edge, items))).join('') +
      footer + '</svg>';
  }
  return { svg, width, height, title: diagram.title, align: diagram.align };
}

/** Portable SVG with explicit colors and dimensions; usable as ![](file.svg). */
export function renderDiagramSvg(source: string, theme: Theme = 'light', state: State = {}): string {
  return build(source,state).svg(theme);
}

/** The embedded heading lives in HTML so it stays readable at every width.
 * Portable SVGs retain their own heading and accessible metadata. */
export function renderDiagramView(source: string, state: State = {}) {
  const view = build(source, state, true);
  return { title: view.title, svg: view.svg('book') };
}

/** Server-rendered controls, default SVG and portable downloads. */
function renderControls(controls: Control[], id: string) {
  return controls.map((control) => {
    const name = escape(id + '-' + control.id);
    const label = escape(control.label);
    if (control.kind === 'slider') {
      return '<label class="book-diagram-control"><span>' + label + ' <output data-diagram-output="' + control.id + '">' + control.default + '</output></span>' +
        '<input type="range" name="' + name + '" data-diagram-control="' + control.id + '" min="' + control.min + '" max="' + control.max + '" step="' + control.step + '" value="' + control.default + '"></label>';
    }
    if (control.kind === 'select') {
      return '<label class="book-diagram-control"><span>' + label + '</span><select name="' + name + '" data-diagram-control="' + control.id + '">' +
        control.options.map((option,i) => '<option value="' + i + '"' + (option.value === control.default ? ' selected' : '') + '>' + escape(option.label) + '</option>').join('') + '</select></label>';
    }
    return '<fieldset class="book-diagram-control"><legend>' + label + '</legend><div class="book-diagram-options">' +
      control.options.map((option,i) => '<label><input type="radio" name="' + name + '" data-diagram-control="' + control.id + '" value="' + i + '"' +
        (option.value === control.default ? ' checked' : '') + '><span>' + escape(option.label) + '</span></label>').join('') + '</div></fieldset>';
  }).join('');
}

// The toolbar is HTML, not part of the exported SVG. Keep its actions
// accessible without introducing an additional UI dependency.
function toolbarIcon(name: 'more' | 'download' | 'expand' | 'copy') {
  const content = name === 'more'
    ? '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>'
    : name === 'download'
      ? '<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>'
      : name === 'copy'
        ? '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'
        : '<path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4"/>';
  return '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="' +
    (name === 'more' ? 'currentColor' : 'none') + '" stroke="' +
    (name === 'more' ? 'none' : 'currentColor') + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + content + '</svg>';
}

export function renderDiagramFigure(source: string, locale: 'ru' | 'en', id: string): string {
  const controls = getControls(source);
  const state = getState(controls);
  const diagram = build(source,state);
  // Validate every finite option combination (slider uses its default).
  let preferredWidth = diagram.width;
  for (const variant of getVariants(source)) preferredWidth = Math.max(preferredWidth, build(source,variant).width);
  const ru = locale === 'ru';
  const filename = 'diagram-' + id.replace(/[^a-zA-Z0-9_-]/g, '-');
  function link(theme: 'light' | 'dark', label: string) {
    return '<a data-diagram-export="' + theme + '" download="' + filename + '-' + theme + '.svg" href="data:image/svg+xml;charset=utf-8,' +
      encodeURIComponent(diagram.svg(theme)) + '">' + toolbarIcon('download') + '<span>' + label + '</span></a>';
  }
  const interactive = controls.length ? ' data-diagram-source="' + escape(source) + '"' : '';
  const actionsLabel = ru ? 'Действия со схемой' : 'Diagram actions';
  const fallbackTitle = ru ? 'Схема' : 'Diagram';
  const toolbar = '<div class="book-diagram-toolbar"><div class="book-diagram-heading" data-diagram-title data-fallback-title="' + fallbackTitle + '">' + escape(diagram.title || fallbackTitle) + '</div><details class="book-diagram-menu">' +
    '<summary aria-label="' + actionsLabel + '" title="' + actionsLabel + '">' + toolbarIcon('more') + '</summary>' +
    '<div class="book-diagram-menu-panel">' +
    link('light', ru ? 'Скачать SVG (светлая)' : 'Download SVG (light)') + link('dark', ru ? 'Скачать SVG (тёмная)' : 'Download SVG (dark)') +
    '<button type="button" data-diagram-copy data-copy-success="' + (ru ? 'Код скопирован' : 'Source copied') + '" data-copy-failure="' + (ru ? 'Не удалось скопировать. Выделите код вручную.' : 'Copy failed. Select the source manually.') + '">' + toolbarIcon('copy') + '<span>' + (ru ? 'Копировать Markdown' : 'Copy Markdown') + '</span></button>' +
    '<button type="button" data-diagram-size>' + toolbarIcon('expand') +
    '<span class="book-diagram-show-native">' + (ru ? 'Исходный размер' : 'Original size') + '</span>' +
    '<span class="book-diagram-show-fit">' + (ru ? 'Вписать в ширину' : 'Fit to width') + '</span></button></div></details></div>';
  const sourceTabs = '<div class="book-diagram-view-tabs" role="group" aria-label="' + (ru ? 'Вид схемы' : 'Diagram view') + '">' +
    '<button type="button" data-diagram-view="preview" aria-pressed="true">' + (ru ? 'Просмотр' : 'Preview') + '</button>' +
    '<button type="button" data-diagram-view="source" aria-pressed="false">' + (ru ? 'Исходник' : 'Source') + '</button></div>';
  const markdown = '\x60\x60\x60diagram\n' + source + '\n\x60\x60\x60';
  const sourcePanel = '<div class="book-diagram-source" data-diagram-panel="source" hidden><pre tabindex="0"><code data-diagram-markdown>' + escape(markdown) + '</code></pre></div>';
  return '<figure class="book-diagram' + (controls.length ? ' book-diagram-interactive' : '') + '" style="--book-diagram-width:' + preferredWidth + 'px"' + (diagram.align ? ' data-diagram-align="' + diagram.align + '"' : '') + interactive + '>' + toolbar + sourceTabs + '<div data-diagram-panel="preview">' +
    (controls.length ? '<div class="book-diagram-controls">' + renderControls(controls,filename) + '</div>' : '') +
    '<div class="book-diagram-scroll" role="region" tabindex="0" aria-label="' + (ru ? 'Схема' : 'Diagram') + '">' +
    renderDiagramView(source, state).svg + '</div><div data-diagram-error role="status" hidden></div></div>' + sourcePanel + '<div class="book-diagram-copy-status" data-diagram-copy-status role="status"></div></figure>';
}
