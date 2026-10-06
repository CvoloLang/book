<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import type { ManifestGroup } from '$lib/docs/types';
  import manifestData from '$lib/generated/manifest.json';
  import siteConfig from '$lib/generated/site-config.json';
  import { page } from '$app/stores';
  import LocaleSelect from './LocaleSelect.svelte';
  import VersionSelect from './VersionSelect.svelte';
  import GitHubLinks from './GitHubLinks.svelte';

  let { onSearch }: { onSearch: () => void } = $props();
  const manifests = manifestData as Record<string, ManifestGroup[]>;
  let lang = $derived($page.params.lang ?? siteConfig.site.defaultLanguage);
  let version = $derived($page.params.version ?? siteConfig.site.defaultVersion);
  let sections = $derived(manifests[`${version}/${lang}`] ?? []);
  let dark = $state(false);

  onMount(() => {
    const saved = localStorage.getItem('cvolo-docs-theme');
    dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
  });

  function toggleTheme() {
    dark = !dark;
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('cvolo-docs-theme', dark ? 'dark' : 'light');
  }
</script>

<header class="sticky top-0 z-40 h-[var(--header-h)] border-b border-zinc-200/80 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
  <div class="mx-auto flex h-full max-w-[1600px] items-center gap-3 px-4 sm:px-6">
    <a href={`${base}/`} class="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight text-zinc-950 dark:text-white">
      <img src={`${base}/brand/cvolo-logo.png`} alt="Cvolo" class="size-8 rounded-lg object-cover" />
      <span class="hidden sm:inline">Cvolo</span>
      <span class="hidden rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500 md:inline dark:border-zinc-700 dark:text-zinc-400">Docs</span>
    </a>

    <nav class="ml-2 hidden items-center gap-1 text-sm md:flex">
      {#each sections as section}
        <a href={`${base}/${lang}/${version}/docs/${section.id}/`} class="rounded-md px-2.5 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white">{section.title}</a>
      {/each}
    </nav>

    <div class="ml-auto flex items-center gap-1.5">
      <VersionSelect />
      <LocaleSelect />
      <button
        type="button"
        onclick={onSearch}
        class="flex h-9 min-w-9 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 text-sm text-zinc-500 hover:border-zinc-300 hover:text-zinc-800 sm:min-w-52 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
        aria-label="Search documentation"
      >
        <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <span class="hidden sm:inline">Search docs</span>
        <kbd class="ml-auto hidden rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] text-zinc-400 sm:inline dark:border-zinc-700 dark:bg-zinc-950">/</kbd>
      </button>

      <button type="button" onclick={toggleTheme} class="grid size-9 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white" aria-label="Toggle theme">
        {#if dark}
          <svg viewBox="0 0 24 24" class="size-4.5" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></svg>
        {:else}
          <svg viewBox="0 0 24 24" class="size-4.5" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z"/></svg>
        {/if}
      </button>

      <GitHubLinks />
    </div>
  </div>
</header>
