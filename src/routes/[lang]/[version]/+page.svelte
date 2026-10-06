<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import { t } from '$lib/i18n';

  let lang = $derived($page.params.lang);
</script>

<svelte:head><title>Cvolo Docs</title></svelte:head>

<main class="mx-auto max-w-6xl px-6 py-16">
  <div class="mb-10 max-w-3xl">
    <div class="text-sm font-semibold text-violet-600 dark:text-violet-400">Cvolo Docs</div>
    <h1 class="mt-2 text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">{t(lang, 'languageHome.title')}</h1>
    <p class="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">{t(lang, 'languageHome.description')}</p>
  </div>
  <a href={`${base}/${$page.params.lang}/${$page.params.version}/docs/`} class="rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-600">{t(lang, 'languageHome.openDocumentation')}</a>
</main>
