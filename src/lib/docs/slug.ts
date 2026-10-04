/**
 * Normalizes a documentation catch-all route parameter.
 *
 * SvelteKit static deployments use trailingSlash='always' so GitHub Pages
 * produces directory/index.html routes. Depending on navigation mode/version,
 * a rest parameter may arrive with a leading/trailing slash. Documentation
 * slugs are stored without either, so always normalize before lookup.
 */
export function normalizeDocSlug(value: string | null | undefined): string {
  if (!value) return '';

  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // Keep the original value if it is not valid percent-encoded input.
  }

  return decoded
    .replaceAll('\\', '/')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/{2,}/g, '/');
}
