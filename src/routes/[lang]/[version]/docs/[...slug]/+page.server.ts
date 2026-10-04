import { error } from '@sveltejs/kit';
import topicsData from '$lib/generated/topics.json';
import routesData from '$lib/generated/routes.json';
import { renderMarkdown } from '$lib/docs/markdown.server';
import { normalizeDocSlug } from '$lib/docs/slug';
const topics = topicsData as Record<string, any>;
const routes = routesData as Array<{version:string;lang:string;slug:string}>;
export const entries = () => routes.map(({version,lang,slug}) => ({ version, lang, slug }));
export async function load({ params }) {
  const slug = normalizeDocSlug(params.slug);
  const contextKey = `${params.version}/${params.lang}`;
  const topic = topics[`${contextKey}/${slug}`];
  if (!topic) error(404, `Documentation page not found: ${slug || '(empty slug)'}`);
  const { markdown, ...meta } = topic;
  return { topic: meta, html: await renderMarkdown(markdown, slug, meta.sourcePath, contextKey) };
}
