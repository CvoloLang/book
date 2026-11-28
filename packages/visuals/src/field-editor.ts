import type { Field } from './model.ts';

export type FieldRow = { name: string; type: string };
export type FieldType = { name: string; size: number; alignment: number; color?: string };
export type FieldControl = {
  kind: 'fields'; id: string; label: string; types: FieldType[];
  maxFields: number; default: FieldRow[];
};

function fail(message: string): never { throw new Error('Diagram: ' + message); }
function record(value: unknown, keys: string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(label + ' must be an object');
  const item = value as Record<string, unknown>;
  if (Object.keys(item).some((key) => !keys.includes(key))) fail(label + ' has an unknown property');
  return item;
}
function identifier(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length > 24 || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(value) || /\s/.test(value)) fail(label + ' must be an identifier of at most 24 characters');
  return value;
}
function integer(value: unknown, min: number, max: number, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) fail(label + ' out of range');
  return value;
}

/** Only the declared type catalog can determine field size and alignment. */
export function parseFieldControl(value: unknown, id: string, label: string): FieldControl {
  const item = record(value, ['kind','id','label','types','maxFields','default'], 'fields control');
  if (!Array.isArray(item.types) || item.types.length < 1 || item.types.length > 8) fail('fields requires 1–8 types');
  const types: FieldType[] = item.types.map((raw) => {
    const type = record(raw, ['name','size','alignment','color'], 'field type');
    const name = identifier(type.name, 'type name');
    const size = integer(type.size,1,64,'type size');
    const alignment = integer(type.alignment,1,64,'type alignment');
    if ((alignment & (alignment - 1)) !== 0 || size % alignment !== 0) fail('type size must be a multiple of its power-of-two alignment');
    const color = type.color;
    if (color !== undefined && (typeof color !== 'string' || !/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})(?![\s\S])/i.test(color))) fail('type color must be a hex color');
    return { name,size,alignment,...(typeof color === 'string' ? {color} : {}) };
  });
  if (new Set(types.map((type) => type.name)).size !== types.length) fail('duplicate type name');
  const maxFields = integer(item.maxFields ?? 8,1,12,'maxFields');
  const control: FieldControl = {kind:'fields',id,label,types,maxFields,default:[]};
  control.default = readFieldRows(control,item.default);
  return control;
}

/** Validate reader-controlled state as rigorously as author-supplied defaults. */
export function readFieldRows(control: FieldControl, value: unknown): FieldRow[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > control.maxFields) fail('invalid field count for ' + control.id);
  const rows = value.map((raw) => {
    const row = record(raw,['name','type'],'field row');
    const name = identifier(row.name,'field name');
    const type = identifier(row.type,'field type');
    if (!control.types.some((entry) => entry.name === type)) fail('unknown field type ' + type);
    return {name,type};
  });
  if (new Set(rows.map((row) => row.name)).size !== rows.length) fail('duplicate field name');
  return rows;
}

export function fieldsForLayout(control: FieldControl, value: unknown): Field[] {
  return readFieldRows(control,value).map((row) => {
    const type = control.types.find((entry) => entry.name === row.type)!;
    return {name:row.name,size:type.size,alignment:type.alignment,tone:'read',
      ...(type.color ? {style:{color:type.color,fillOpacity:.16}} : {})};
  });
}

export function fieldDeclarations(control: FieldControl, value: unknown): string {
  return readFieldRows(control,value).map((row) => '    ' + row.type + ' ' + row.name + ';').join('\n');
}

/** A stable descending-alignment heuristic, not a compiler optimization pass. */
export function orderFields(control: FieldControl, value: unknown): FieldRow[] {
  const rows = readFieldRows(control,value);
  const types = new Map(control.types.map((type) => [type.name,type]));
  return rows.sort((a,b) => {
    const left = types.get(a.type)!, right = types.get(b.type)!;
    return right.alignment-left.alignment || right.size-left.size;
  });
}
