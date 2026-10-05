// @ts-nocheck
import { readFile } from 'node:fs/promises';

function stripComment(line) {
  let quoted = false;
  let escaped = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && quoted) { escaped = true; continue; }
    if (ch === '"') quoted = !quoted;
    if (ch === '#' && !quoted) return line.slice(0, i);
  }
  return line;
}

function splitArray(value) {
  const parts = [];
  let start = 0;
  let quoted = false;
  let escaped = false;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && quoted) { escaped = true; continue; }
    if (ch === '"') quoted = !quoted;
    if (ch === ',' && !quoted) { parts.push(value.slice(start, i)); start = i + 1; }
  }
  parts.push(value.slice(start));
  return parts;
}

function scalar(raw) {
  const value = raw.trim();
  if (value.startsWith('"') && value.endsWith('"')) return JSON.parse(value);
  if (value.startsWith('[') && value.endsWith(']')) {
    const body = value.slice(1, -1).trim();
    return body ? splitArray(body).map(scalar) : [];
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^[+-]?\d+$/.test(value)) return Number.parseInt(value, 10);
  if (/^[+-]?\d+\.\d+$/.test(value)) return Number.parseFloat(value);
  throw new Error(`Unsupported TOML value: ${raw}`);
}

export function parseToml(source) {
  const root = {};
  let target = root;

  for (const original of source.replace(/\r\n/g, '\n').split('\n')) {
    const line = stripComment(original).trim();
    if (!line) continue;

    const arrayTable = line.match(/^\[\[([A-Za-z0-9_.-]+)\]\]$/);
    if (arrayTable) {
      const key = arrayTable[1];
      root[key] ??= [];
      if (!Array.isArray(root[key])) throw new Error(`TOML key ${key} is not an array`);
      target = {};
      root[key].push(target);
      continue;
    }

    const table = line.match(/^\[([A-Za-z0-9_.-]+)\]$/);
    if (table) {
      const key = table[1];
      root[key] ??= {};
      target = root[key];
      continue;
    }

    const assignment = line.match(/^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/);
    if (!assignment) throw new Error(`Unsupported TOML syntax: ${original}`);
    target[assignment[1]] = scalar(assignment[2]);
  }
  return root;
}

export async function readToml(file) {
  return parseToml(await readFile(file, 'utf8'));
}
