import routes from '../src/lib/generated/routes.json' with { type: 'json' };
import topics from '../src/lib/generated/topics.json' with { type: 'json' };

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

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Verified ${routes.length} routes and ${Object.keys(topics).length} topics.`);
