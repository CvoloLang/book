import manifestData from '$lib/generated/manifest.json';

const manifests = manifestData as Record<string, unknown>;

export function entries() {
	return Object.keys(manifests).map((key) => {
		const [version, lang] = key.split('/');
		return { lang, version };
	});
}
