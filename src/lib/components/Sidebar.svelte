<script lang="ts">
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import manifestData from '$lib/generated/manifest.json';
  import type { ManifestGroup, NavNode } from '$lib/docs/types';
  import { normalizeDocSlug } from '$lib/docs/slug';
  let { onNavigate }: { onNavigate?: () => void } = $props();
  const manifests = manifestData as Record<string, ManifestGroup[]>;
  const manifest = $derived(manifests[`${$page.params.version}/${$page.params.lang}`] ?? []);
  const activeSlug = $derived(normalizeDocSlug($page.params.slug));
  const activeGroupId = $derived.by(() => $page.params.section ?? activeSlug.split('/')[0] ?? '');
  const visibleGroups = $derived.by(() => { const match=manifest.find((g)=>g.id===activeGroupId); return match?[match]:manifest; });
  function isBranchActive(node: NavNode) { return activeSlug === node.slug || activeSlug.startsWith(`${node.slug}/`); }
</script>
{#snippet nodeLink(node: NavNode, depth: number)}
<li><a href={`${base}/${$page.params.lang}/${$page.params.version}/docs/${node.slug}/`} onclick={() => onNavigate?.()} class={['block rounded-md py-1.5 pr-2 text-[13px] leading-5 transition-colors',depth===0?'font-medium':'',activeSlug===node.slug?'bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300':'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'].join(' ')} style={`padding-left:${0.5+depth*0.75}rem`}>{node.title}</a>{#if node.children.length && isBranchActive(node)}<ul class="mt-0.5 border-l border-zinc-200 dark:border-zinc-800" style={`margin-left:${0.75+depth*0.75}rem`}>{#each node.children as child}{@render nodeLink(child, depth+1)}{/each}</ul>{/if}</li>
{/snippet}
<aside class="sidebar-scrollbar h-[calc(100vh-var(--header-h))] overflow-y-auto px-3 py-5">
<a href={`${base}/${$page.params.lang}/${$page.params.version}/docs/`} onclick={() => onNavigate?.()} class="mb-3 block rounded-lg px-2 py-1.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900">Cvolo Docs</a>
<nav class="mb-5 grid grid-cols-1 gap-1 border-b border-zinc-200 pb-4 dark:border-zinc-800">{#each manifest as group}<a href={`${base}/${$page.params.lang}/${$page.params.version}/docs/${group.id}/`} onclick={() => onNavigate?.()} class={['rounded-md px-2 py-1.5 text-xs font-medium',activeGroupId===group.id?'bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300':'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'].join(' ')}>{group.title}</a>{/each}</nav>
{#each visibleGroups as group}<section class="mb-6"><h2 class="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">{group.title}</h2><ul class="space-y-0.5">{#each group.documents as document}{@render nodeLink(document.nav,0)}{/each}</ul></section>{/each}
</aside>
