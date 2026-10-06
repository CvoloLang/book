<script lang="ts">
  import { base } from '$app/paths';
  import type { ManifestGroup } from '$lib/docs/types';
  import manifestData from '$lib/generated/manifest.json';
  import siteConfig from '$lib/generated/site-config.json';
  import { t } from '$lib/i18n';

  const language = siteConfig.site.defaultLanguage;
  const version = siteConfig.site.defaultVersion;
  const manifests = manifestData as Record<string, ManifestGroup[]>;
  const sections = (manifests[`${version}/${language}`] ?? []).map((section, index) => ({
    ...section,
    index: index + 1
  }));
</script>

<svelte:head>
  <title>{siteConfig.site.title}</title>
  <meta name="description" content={t(language, 'home.metaDescription')} />
</svelte:head>

<main>
  <section class="border-b border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950">
    <div class="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center sm:py-28">
      <div class="max-w-3xl">
        <div class="mb-4 text-sm font-semibold text-violet-600 dark:text-violet-400">{t(language, 'home.kicker')}</div>
        <h1 class="text-4xl font-bold tracking-[-0.035em] text-zinc-950 sm:text-6xl dark:text-white">{t(language, 'home.title')}</h1>
        <p class="mt-6 max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">{t(language, 'home.description')}</p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a href={`${base}/${language}/${version}/docs/book/`} class="rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-600">{t(language, 'home.startReading')}</a>
        </div>
      </div>
      <div class="mx-auto grid size-64 place-items-center overflow-hidden rounded-3xl border border-zinc-200 bg-[#15151a] shadow-2xl shadow-violet-950/10 dark:border-zinc-800">
        <img src={`${base}/brand/cvolo-logo.png`} alt={t(language, 'home.logoAlt')} class="size-full object-cover" />
      </div>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-6 py-14">
    <div class="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      {#each sections as section}
        <a href={`${base}/${language}/${version}/docs/${section.id}/`} class="group rounded-xl border border-zinc-200 p-5 transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-sm dark:border-zinc-800 dark:hover:border-violet-800">
          <div class="text-xs font-semibold uppercase tracking-[0.12em] text-violet-600 dark:text-violet-400">{String(section.index).padStart(2, '0')} · {section.title}</div>
          <h2 class="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">{section.eyebrow}</h2>
          <p class="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{section.description}</p>
        </a>
      {/each}
    </div>
  </section>
</main>
