/**
 * Safe, deterministic diagram state and template expansion.
 * Authors supply data, never executable JavaScript or arbitrary HTML.
 */
import { parseFieldControl, readFieldRows, fieldsForLayout, fieldDeclarations, type FieldControl, type FieldRow } from './field-editor.ts';

export type State = Record<string, string | number | FieldRow[]>;
export type Option = { label: string; value: string | number };
export type ChoiceControl = { kind: 'tabs' | 'select' | 'steps'; id: string; label: string; options: Option[]; default: string | number };
export type RangeControl = { kind: 'slider'; id: string; label: string; min: number; max: number; step: number; default: number };
export type Control = ChoiceControl | RangeControl | FieldControl;
type JsonObject = Record<string, unknown>;

function fail(message: string): never { throw new Error('Diagram: ' + message); }
function object(value: unknown, name: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(name + ' must be an object');
  return value as JsonObject;
}
function text(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 120) fail(name + ' must be a nonempty string (max 120 characters)');
  return value;
}
function finite(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) fail(name + ' must be a finite safe number');
  return value;
}
function root(source: string): JsonObject {
  if (source.length > 64000) fail('source exceeds 64,000 characters');
  let parsed: unknown;
  try { parsed = JSON.parse(source); }
  catch (cause) { fail(cause instanceof Error ? cause.message : 'invalid JSON'); }
  return object(parsed, 'root');
}
function validId(value: unknown): string {
  const id = text(value, 'control id');
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(id) || ['constructor','prototype','__proto__'].includes(id)) fail('invalid control id ' + id);
  return id;
}
function allowed(item: JsonObject, names: string[], location: string) {
  for (const key of Object.keys(item)) if (!names.includes(key)) fail(location + ': unknown property ' + key);
}
function onStep(value: number, min: number, step: number) {
  return Math.abs((value - min) / step - Math.round((value - min) / step)) < 1e-7;
}

function controlsFrom(value: unknown): Control[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 6) fail('controls must be an array of at most 6 controls');
  const ids = new Set<string>();
  return value.map((raw): Control => {
    const item = object(raw, 'control');
    const id = validId(item.id);
    if (ids.has(id)) fail('duplicate control ' + id);
    ids.add(id);
    const label = text(item.label, 'control label');
    if (item.kind === 'fields') return parseFieldControl(item,id,label);
    if (item.kind === 'slider') {
      allowed(item, ['kind','id','label','min','max','step','default'], 'slider');
      const min = finite(item.min, 'min'), max = finite(item.max, 'max'), step = finite(item.step ?? 1, 'step');
      const initial = finite(item.default, 'default');
      if (max <= min || step <= 0 || initial < min || initial > max || !onStep(initial,min,step) ||
        !onStep(max,min,step) || (max-min)/step > 1000000) fail('invalid slider range or default');
      return { kind:'slider', id, label, min, max, step, default:initial };
    }
    if (item.kind !== 'tabs' && item.kind !== 'select' && item.kind !== 'steps') fail('control kind must be tabs, select, steps, slider or fields');
    allowed(item, ['kind','id','label','options','default'], 'choice');
    if (!Array.isArray(item.options) || !item.options.length || item.options.length > 12) fail('choice requires 1–12 options');
    const options = item.options.map((rawOption): Option => {
      const option = object(rawOption, 'option');
      allowed(option, ['label','value'], 'option');
      const value = typeof option.value === 'number' ? finite(option.value,'option value') : text(option.value,'option value');
      return { value, label:text(option.label,'option label') };
    });
    if (new Set(options.map((option) => String(option.value))).size !== options.length) fail('duplicate option value');
    const initial = options.find((option) => option.value === item.default);
    if (!initial) fail('default must match an option value');
    return { kind:item.kind, id, label, options, default:initial.value };
  });
}

export function getControls(source: string): Control[] { return controlsFrom(root(source).controls); }

export function getState(controls: Control[], overrides: State = {}): State {
  const state: State = Object.create(null);
  for (const key of Object.keys(overrides)) if (!controls.some((control) => control.id === key)) fail('unknown control ' + key);
  for (const control of controls) {
    const value = Object.hasOwn(overrides, control.id) ? overrides[control.id] : control.default;
    if (control.kind === 'fields') {
      state[control.id] = readFieldRows(control,value);
      continue;
    }
    if (control.kind === 'slider') {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < control.min || value > control.max || !onStep(value,control.min,control.step)) fail('invalid value for ' + control.id);
    } else if (!control.options.some((option) => option.value === value)) fail('invalid option for ' + control.id);
    state[control.id] = value;
  }
  return state;
}

/** Enumerates finite choices; sliders and editors retain their declared defaults. */
export function getVariants(source: string): State[] {
  const controls = getControls(source);
  let variants: State[] = [getState(controls)];
  for (const control of controls) {
    if (control.kind === 'slider' || control.kind === 'fields') continue;
    if (variants.length * control.options.length > 48) fail('at most 48 finite state combinations');
    variants = variants.flatMap((state) => control.options.map((option) => ({...state,[control.id]:option.value})));
  }
  return variants;
}

export type Field = { name: string; size: number; alignment: number; tone?: string; style?: JsonObject };
export type Segment = { name: string; bytes: number; padding?: boolean; tone?: string; style?: JsonObject };

/** Natural alignment model, independent of a compiler and its ABI. */
export function computeMemoryLayout(fields: Field[]): { size: number; alignment: number; padding: number; segments: Segment[] } {
  if (!fields.length || fields.length > 24) fail('layout requires 1–24 fields');
  let offset = 0, alignment = 1, padding = 0;
  const segments: Segment[] = [];
  function pad(bytes: number) {
    if (!bytes) return;
    segments.push({name:'Padding',bytes,padding:true,tone:'neutral'});
    offset += bytes;
    padding += bytes;
  }
  for (const field of fields) {
    const size = finite(field.size,'field size'), align = finite(field.alignment,'field alignment');
    if (!Number.isInteger(size) || size < 1 || size > 4096 || !Number.isInteger(align) || align < 1 || align > 256 || (align & (align-1)) !== 0) fail('invalid field size or alignment');
    pad((align - offset % align) % align);
    const segment: Segment = {name:text(field.name,'field name'),bytes:size};
    if (field.tone !== undefined) segment.tone = field.tone;
    if (field.style !== undefined) segment.style = field.style;
    segments.push(segment);
    offset += size;
    alignment = Math.max(alignment,align);
  }
  pad((alignment - offset % alignment) % alignment);
  return {size:offset,alignment,padding,segments};
}

function resolveOperation(operator: unknown, values: unknown[]): number {
  const nums = values.map((value) => finite(value,'operand'));
  if (nums.length !== 2) fail('binary operations require two operands');
  const [a,b] = nums;
  switch (operator) {
    case 'add': return finite(a+b,'result');
    case 'sub': return finite(a-b,'result');
    case 'mul': return finite(a*b,'result');
    case 'div': return finite(a/b,'result');
    case 'min': return Math.min(a,b);
    case 'max': return Math.max(a,b);
    default: return fail('unknown arithmetic operation');
  }
}

function formatted(value: unknown, format: unknown): string {
  const n = finite(value,'formatted value');
  const rounded = (number: number) => String(Math.round(number * 100) / 100);
  switch (format) {
    case 'bytes': return rounded(n) + ' B';
    case 'kib': return rounded(n/1024) + ' KiB';
    case 'mib': return rounded(n/1048576) + ' MiB';
    case 'mb': return rounded(n/1000000) + ' MB';
    case 'percent': return rounded(n*100) + '%';
    case 'number': return rounded(n);
    default: return fail('unknown number format');
  }
}

type Context = { state: State; controls: Control[]; data: JsonObject; cache: Map<string, unknown>; active: Set<string> };

function expand(value: unknown, context: Context, depth: number, budget: { remaining: number }): unknown {
  const { state, data, cache, active } = context;
  if (--budget.remaining < 0 || depth > 40) fail('template is too complex');
  const next = (child: unknown) => expand(child,context,depth+1,budget);
  if (Array.isArray(value)) return value.map(next);
  if (!value || typeof value !== 'object') return value;
  const item = object(value,'template');
  const directives = Object.keys(item).filter((key) => key.startsWith('$'));
  if (directives.length) {
    if (directives.length !== 1) fail('one directive per expression');
    switch (directives[0]) {
      case '$var': {
        allowed(item,['$var'],'variable');
        const id = validId(item.$var);
        if (!Object.hasOwn(state,id)) fail('unknown variable ' + id);
        return state[id];
      }
      case '$ref': {
        allowed(item,['$ref'],'data reference');
        const id = validId(item.$ref);
        if (!Object.hasOwn(data,id)) fail('unknown data reference ' + id);
        if (cache.has(id)) return cache.get(id);
        if (active.has(id)) fail('cyclic data reference ' + id);
        active.add(id);
        const result = next(data[id]);
        active.delete(id);
        cache.set(id,result);
        return result;
      }
      case '$switch': {
        allowed(item,['$switch','cases'],'switch');
        const id = validId(item.$switch), cases = object(item.cases,'cases');
        if (!Object.hasOwn(state,id) || !Object.hasOwn(cases,String(state[id]))) fail('missing switch case for ' + id);
        return next(cases[String(state[id])]);
      }
      case '$op':
        allowed(item,['$op','args'],'operation');
        if (!Array.isArray(item.args)) fail('operation requires args');
        return resolveOperation(item.$op,item.args.map(next));
      case '$format':
        allowed(item,['$format','value'],'format');
        return formatted(next(item.value),item.$format);
      case '$concat': {
        allowed(item,['$concat'],'concat');
        if (!Array.isArray(item.$concat)) fail('concat requires an array');
        return item.$concat.map((part) => {
          const resolved = next(part);
          if (typeof resolved !== 'string' && typeof resolved !== 'number') fail('concat requires strings or numbers');
          return String(resolved);
        }).join('');
      }
      case '$fields':
      case '$fieldCode': {
        const directive = directives[0];
        allowed(item,[directive],'field expression');
        const id = validId(item[directive]);
        const control = context.controls.find((entry) => entry.id === id);
        if (!control || control.kind !== 'fields') fail('expected a fields control: ' + id);
        return directive === '$fields' ? fieldsForLayout(control,state[id]) : fieldDeclarations(control,state[id]);
      }
      case '$layout': {
        allowed(item,['$layout','pick'],'layout');
        const raw = next(item.$layout);
        if (!Array.isArray(raw)) fail('layout requires a field array');
        const fields = raw.map((field): Field => {
          const f = object(field,'field');
          allowed(f,['name','size','alignment','tone','style'],'field');
          return {name:text(f.name,'field name'),size:finite(f.size,'field size'),alignment:finite(f.alignment,'field alignment'),
            tone:f.tone === undefined ? undefined : text(f.tone,'field tone'),style:f.style === undefined ? undefined : object(f.style,'field style')};
        });
        const layout = computeMemoryLayout(fields);
        switch (item.pick) {
          case 'size': return layout.size;
          case 'alignment': return layout.alignment;
          case 'padding': return layout.padding;
          case 'segments': return layout.segments;
          default: return fail('layout pick must be size, alignment, padding or segments');
        }
      }
      default: return fail('unknown template directive ' + directives[0]);
    }
  }
  const result = Object.fromEntries(Object.entries(item).map(([key, child]) => [key,next(child)]));
  // Convenience primitives are lowered to the same ordinary layout tree.
  if (result.kind === 'grid') {
    const columns = finite(result.columns,'grid columns');
    if (!Number.isInteger(columns) || columns < 1 || columns > 12 || !Array.isArray(result.children)) fail('invalid grid');
    const rows = [];
    for (let i=0; i<result.children.length; i+=columns) rows.push({kind:'row',gap:result.gap ?? 8,children:result.children.slice(i,i+columns)});
    const {columns: _columns, children: _children, ...rest} = result;
    return {...rest,kind:'column',children:rows};
  }
  if (result.kind === 'table') {
    if (!Array.isArray(result.rows) || !result.rows.length || result.rows.length > 24) fail('table requires 1–24 rows');
    if (!Array.isArray(result.widths) || !result.widths.length || result.widths.length > 8) fail('table requires column widths');
    const widths = result.widths.map((width) => finite(width,'column width'));
    // All rows share measured column widths, including long cell labels.
    for (const row of result.rows) {
      if (!Array.isArray(row) || row.length !== widths.length) fail('table row length differs from widths');
      for (const [i, cell] of row.entries()) {
        if (typeof cell !== 'string' && typeof cell !== 'number') fail('table cells must be strings or numbers');
        widths[i] = Math.max(widths[i], Math.ceil(String(cell).length * 14 * .9 + 30));
      }
    }
    const rows = result.rows.map((row,index) => {
      if (!Array.isArray(row) || row.length !== widths.length) fail('table row length differs from widths');
      return {kind:'row',gap:0,children:row.map((cell,i) => {
        if (typeof cell !== 'string' && typeof cell !== 'number') fail('table cells must be strings or numbers');
        return {kind:'node',title:String(cell),width:widths[i],height:42,style:{fillOpacity:index === 0 ? .06 : 0,strokeOpacity:.3,radius:0,fontSize:14,textAlign:i === widths.length - 1 ? 'end' : 'start'}};
      })};
    });
    const {rows: _rows, widths: _widths, ...rest} = result;
    return {...rest,kind:'column',gap:0,children:rows};
  }
  return result;
}

/** Resolve one state into a plain, validated-by-renderer diagram JSON. */
export function materializeDiagram(source: string, overrides: State = {}): string {
  const input = root(source);
  const {controls, data: rawData, ...diagram} = input;
  const parsedControls = controlsFrom(controls);
  const state = getState(parsedControls,overrides);
  const data = rawData === undefined ? {} : object(rawData,'data');
  if (Object.keys(data).length > 64) fail('at most 64 named data entries');
  for (const key of Object.keys(data)) validId(key);
  const context: Context = {state,controls:parsedControls,data,cache:new Map(),active:new Set()};
  const resolved = expand(diagram,context,0,{remaining:16000});
  // References may share a subtree. Bound serialization too, so a graph of
  // repeated references cannot expand into an unbounded JSON document.
  let remaining = 64000;
  const result = JSON.stringify(resolved,(key,value) => {
    remaining -= key.length + (typeof value === 'string' ? value.length : 8);
    if (remaining < 0) fail('expanded diagram exceeds size limit');
    return value;
  });
  if (result.length > 32000) fail('expanded diagram exceeds 32,000 characters');
  return result;
}
