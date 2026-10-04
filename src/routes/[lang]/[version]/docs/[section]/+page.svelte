<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import type { ManifestGroup } from '$lib/docs/types';

  let { data }: { data: { group: ManifestGroup } } = $props();
</script>

<svelte:head>
  <title>{data.group.title} · Cvolo</title>
</svelte:head>

<div class="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
  <div class="hidden border-r border-zinc-200 lg:block dark:border-zinc-800">
    <div class="sticky top-[var(--header-h)]"><Sidebar /></div>
  </div>

  <main class="min-w-0 px-6 py-10 sm:px-10 lg:px-14">
    <div class="mx-auto max-w-5xl">
      <div class="mb-10 max-w-3xl">
        <div class="text-sm font-medium text-violet-600 dark:text-violet-400">{data.group.eyebrow}</div>
        <h1 class="mt-2 text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">{data.group.title}</h1>
        <p class="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">{data.group.description}</p>
      </div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {#each data.group.documents as document}
          <a href={`${base}/${$page.params.lang}/${$page.params.version}/docs/${document.slug}/`} class="group flex min-h-36 flex-col rounded-lg border border-zinc-200 p-4 transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-sm dark:border-zinc-800 dark:hover:border-violet-800">
            <div class="font-semibold leading-6 text-zinc-900 dark:text-zinc-100">{document.title}</div>
            {#if document.excerpt}
              <p class="mt-2 line-clamp-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{document.excerpt}</p>
            {/if}
            {#if document.nav.children.length}
              <div class="mt-3 flex flex-wrap gap-1.5">
                {#each document.nav.children.slice(0, 5) as child}
                  <span class="rounded-md border border-zinc-200 px-2 py-1 text-[11px] leading-4 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">{child.title}</span>
                {/each}
                {#if document.nav.children.length > 5}
                  <span class="px-1 py-1 text-[11px] text-zinc-400">+{document.nav.children.length - 5}</span>
                {/if}
              </div>
            {/if}
            <span class="mt-auto pt-4 text-xs font-medium text-violet-600 opacity-0 transition group-hover:opacity-100 dark:text-violet-400">{$page.params.lang === 'ru' ? 'Открыть →' : 'Open →'}</span>
          </a>
        {/each}
      </div>
    </div>
  </main>
</div>
