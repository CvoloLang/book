import routes from '../src/lib/generated/routes.json' with { type: 'json' };
import topics from '../src/lib/generated/topics.json' with { type: 'json' };
import { readdir, readFile } from 'node:fs/promises';
import { readToml } from './lib/toml.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentRoot = path.join(root, 'src', 'content');

const failures = [];

for (const route of routes) {
  if (/[^\x00-\x7F]/.test(route.slug)) {
    failures.push(`non-ASCII slug: ${route.version}/${route.lang}/${route.slug}`);
  }
}

for (const [key, topic] of Object.entries(topics)) {
  if (topic.title.includes('\\n') || topic.excerpt?.includes('\\n')) {
    failures.push(`escaped newline leaked into generated topic: ${key}`);
  }
}

const byContext = new Map();
for (const route of routes) {
  const key = `${route.version}/${route.lang}`;
  if (!byContext.has(key)) byContext.set(key, new Set());
  byContext.get(key).add(route.slug);
}

for (const version of new Set(routes.map((r) => r.version))) {
  const en = byContext.get(`${version}/en`) ?? new Set();
  const ru = byContext.get(`${version}/ru`) ?? new Set();
  const sharedDocuments = new Set(
    [...en]
      .map((slug) => slug.split('/').slice(0, 2).join('/'))
      .filter((doc) => [...ru].some((slug) => slug === doc || slug.startsWith(`${doc}/`)))
  );

  for (const doc of sharedDocuments) {
    const enRoutes = [...en].filter((slug) => slug === doc || slug.startsWith(`${doc}/`)).sort();
    const ruRoutes = [...ru].filter((slug) => slug === doc || slug.startsWith(`${doc}/`)).sort();
    const enComparable = enRoutes.filter((slug) => ru.has(slug));
    if (enComparable.length === 0) failures.push(`shared document has no common locale-neutral route: ${version}/${doc}`);
  }
}


async function verifySourceTree() {
  const validVersions = new Set(routes.map((route) => route.version));
  const validLangs = new Set(routes.map((route) => route.lang));

  async function walkDirectory(directory, depth, parts) {
    const entries = await readdir(directory, { withFileTypes: true });
    const markdown = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md'));
    const directories = entries.filter((entry) => entry.isDirectory());

    // version/lang/section are structural roots. Any deeper directory is a
    // navigable chapter/group: index.md owns the localized prose/title while
    // chapter.toml owns navigation metadata such as order and page sequence.
    if (depth >= 4 && (markdown.length || directories.length)) {
      const hasIndex = markdown.some((entry) => entry.name === 'index.md');
      const chapterConfig = entries.find((entry) => entry.isFile() && entry.name === 'chapter.toml');
      if (!hasIndex) failures.push(`documentation directory is missing index.md: ${parts.join('/')}`);
      if (!chapterConfig) {
        failures.push(`documentation directory is missing chapter.toml: ${parts.join('/')}`);
      } else {
        try {
          const meta = await readToml(path.join(directory, 'chapter.toml'));
          if (!Number.isFinite(Number(meta.order))) failures.push(`chapter.toml is missing numeric order: ${parts.join('/')}`);
          if (meta.pages !== undefined && !Array.isArray(meta.pages)) failures.push(`chapter.toml pages must be an array: ${parts.join('/')}`);
          if (Array.isArray(meta.pages)) {
            const available = new Set([
              ...markdown.filter((entry) => entry.name !== 'index.md').map((entry) => entry.name.replace(/\.md$/i, '')),
              ...directories.map((entry) => entry.name)
            ]);
            for (const page of meta.pages) {
              if (!available.has(String(page))) failures.push(`chapter.toml references a missing page: ${parts.join('/')}/${page}`);
            }
          }
        } catch (error) {
          failures.push(`invalid chapter.toml at ${parts.join('/')}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    for (const entry of markdown) {
      if (/[^\x00-\x7F]/.test(entry.name)) {
        failures.push(`localized Markdown filename: ${[...parts, entry.name].join('/')}`);
      }
      const body = await readFile(path.join(directory, entry.name), 'utf8');
      if (!body.trim()) continue;
      if (!/^#\s+\S/m.test(body)) {
        failures.push(`Markdown page is missing an H1 title: ${[...parts, entry.name].join('/')}`);
      }
    }

    for (const entry of directories) {
      if (/[^\x00-\x7F]/.test(entry.name)) {
        failures.push(`localized documentation directory: ${[...parts, entry.name].join('/')}`);
      }
      await walkDirectory(path.join(directory, entry.name), depth + 1, [...parts, entry.name]);
    }
  }

  const versions = await readdir(contentRoot, { withFileTypes: true });
  for (const version of versions.filter((entry) => entry.isDirectory() && validVersions.has(entry.name))) {
    const versionDir = path.join(contentRoot, version.name);
    const langs = await readdir(versionDir, { withFileTypes: true });
    for (const lang of langs.filter((entry) => entry.isDirectory() && validLangs.has(entry.name))) {
      const langDir = path.join(versionDir, lang.name);
      const sections = await readdir(langDir, { withFileTypes: true });
      for (const section of sections.filter((entry) => entry.isDirectory())) {
        await walkDirectory(path.join(langDir, section.name), 3, [version.name, lang.name, section.name]);
      }
    }
  }
}

await verifySourceTree();

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Verified ${routes.length} routes and ${Object.keys(topics).length} topics.`);
