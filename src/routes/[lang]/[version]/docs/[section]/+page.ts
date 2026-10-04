import { error } from '@sveltejs/kit';
import manifestData from '$lib/generated/manifest.json';
const manifests = manifestData as Record<string, any[]>;
export function entries() {
  const output=[];
  for (const [key,groups] of Object.entries(manifests)) { const [version,lang]=key.split('/'); for (const group of groups) output.push({version,lang,section:group.id}); }
  return output;
}
export function load({ params }) {
  const manifest = manifests[`${params.version}/${params.lang}`] ?? [];
  const group = manifest.find((item:any)=>item.id===params.section);
  if(!group) error(404,'Documentation section not found');
  return { group };
}
