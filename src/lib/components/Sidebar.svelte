<script lang="ts">
  import { page } from '$app/stores';
  import { afterNavigate } from '$app/navigation';
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

  let expanded = $state<string[]>([]);
  let storageKey = '';

  function isExpanded(node: NavNode) {
    return expanded.includes(node.slug) || (!storageKey && isBranchActive(node));
  }

  function activeBranches(node: NavNode): string[] {
    if (!node.children.length) return [];
    return [...(isBranchActive(node) ? [node.slug] : []), ...node.children.flatMap(activeBranches)];
  }

  function toggleBranch(slug: string) {
    expanded = expanded.includes(slug) ? expanded.filter((item) => item !== slug) : [...expanded, slug];
    sessionStorage.setItem(storageKey, JSON.stringify(expanded));
  }

  afterNavigate(() => {
    const key = `cvolo-docs-expanded:${$page.params.lang}:${$page.params.version}`;
    if (storageKey !== key) {
      try {
        const stored = JSON.parse(sessionStorage.getItem(key) ?? '[]');
        expanded = Array.isArray(stored) ? stored.filter((item: unknown): item is string => typeof item === 'string') : [];
      } catch {
        expanded = [];
      }
      storageKey = key;
    }

    expanded = [...new Set([...expanded, ...manifest.flatMap((group) => group.documents.flatMap((document) => activeBranches(document.nav)))])];
    sessionStorage.setItem(storageKey, JSON.stringify(expanded));
  });
</script>
{#snippet nodeLink(node: NavNode, depth: number)}
<li>
  <div class="flex items-center">
    {#if node.children.length}
      <button type="button" onclick={() => toggleBranch(node.slug)} aria-expanded={isExpanded(node)} aria-label={`${node.title}: ${isExpanded(node) ? ($page.params.lang === 'ru' ? 'Свернуть' : 'Collapse') : ($page.params.lang === 'ru' ? 'Развернуть' : 'Expand')}`} class="grid size-7 shrink-0 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900" style={`margin-left:${depth*0.75}rem`}>
        <svg viewBox="0 0 24 24" class={['size-3.5 transition-transform', isExpanded(node) ? 'rotate-90' : ''].join(' ')} fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6" /></svg>
      </button>
    {/if}
    <a href={`${base}/${$page.params.lang}/${$page.params.version}/docs/${node.slug}/`} onclick={() => onNavigate?.()} class={['min-w-0 flex-1 rounded-md py-1.5 pr-2 text-[13px] leading-5 transition-colors',depth===0?'font-medium':'',activeSlug===node.slug?'bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300':'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'].join(' ')} style={`padding-left:${node.children.length ? 0.25 : 0.5+depth*0.75}rem`}>{node.title}</a>
  </div>
  {#if node.children.length && isExpanded(node)}
    <ul class="mt-0.5 border-l border-zinc-200 dark:border-zinc-800" style={`margin-left:${0.75+depth*0.75}rem`}>
      {#each node.children as child}
        {@render nodeLink(child, depth+1)}
      {/each}
    </ul>
  {/if}
</li>
{/snippet}
<aside class="sidebar-scrollbar h-[calc(100vh-var(--header-h))] overflow-y-auto px-3 py-5">
<a href={`${base}/${$page.params.lang}/${$page.params.version}/docs/`} onclick={() => onNavigate?.()} class="mb-3 block rounded-lg px-2 py-1.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900">Cvolo Docs</a>
<nav class="mb-5 grid grid-cols-1 gap-1 border-b border-zinc-200 pb-4 dark:border-zinc-800">{#each manifest as group}<a href={`${base}/${$page.params.lang}/${$page.params.version}/docs/${group.id}/`} onclick={() => onNavigate?.()} class={['rounded-md px-2 py-1.5 text-xs font-medium',activeGroupId===group.id?'bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300':'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'].join(' ')}>{group.title}</a>{/each}</nav>
{#each visibleGroups as group}<section class="mb-6"><h2 class="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">{group.title}</h2><ul class="space-y-0.5">{#each group.documents as document}{@render nodeLink(document.nav,0)}{/each}</ul></section>{/each}
</aside>
