<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import manifestData from '$lib/generated/manifest.json';
  const manifests = manifestData as Record<string, any[]>;
  const manifest = $derived(manifests[`${$page.params.version}/${$page.params.lang}`] ?? []);
</script>
<svelte:head><title>Cvolo Docs</title></svelte:head>
<div class="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
  <div class="hidden border-r border-zinc-200 lg:block dark:border-zinc-800"><div class="sticky top-[var(--header-h)]"><Sidebar /></div></div>
  <main class="min-w-0 px-6 py-10 sm:px-10 lg:px-14"><div class="mx-auto max-w-5xl">
    <div class="mb-10 max-w-3xl">
      <div class="text-sm font-medium text-violet-600 dark:text-violet-400">Cvolo Docs</div>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">{$page.params.lang === 'ru' ? 'Книга, продвинутая часть, Base и Std.' : 'Book, Advanced, Base, and Std.'}</h1>
      <p class="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-400">{$page.params.lang === 'ru' ? 'Учебник объясняет язык последовательно. Продвинутая часть разбирает lowering и стоимость абстракций. Base и Std описывают библиотечные слои.' : 'The Book teaches the language in order. Advanced explains lowering and abstraction cost. Base and Std document the library layers.'}</p>
    </div>
    <div class="grid gap-5 lg:grid-cols-2">{#each manifest as group}<a href={`${base}/${$page.params.lang}/${$page.params.version}/docs/${group.id}/`} class="rounded-xl border border-zinc-200 p-5 transition hover:border-violet-300 hover:shadow-sm dark:border-zinc-800 dark:hover:border-violet-800"><div class="text-xs font-semibold uppercase tracking-[0.12em] text-violet-600 dark:text-violet-400">{group.eyebrow}</div><h2 class="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">{group.title}</h2><p class="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{group.description}</p><div class="mt-4 text-xs text-zinc-400">{group.documents.length} Markdown →</div></a>{/each}</div>
  </div></main>
</div>
