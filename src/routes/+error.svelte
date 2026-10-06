<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import { ArrowLeft, BookOpen, ExternalLink, FileQuestion, Github, Search } from '@lucide/svelte';
  import siteConfig from '$lib/generated/site-config.json';
  import { t } from '$lib/i18n';

  type GitHubLink = {
    id: string;
    url: string;
    description: string;
    labels: Record<string, string>;
  };

  let lang = $derived($page.params.lang ?? siteConfig.site.defaultLanguage);
  let version = $derived($page.params.version ?? siteConfig.site.defaultVersion);
  let isNotFound = $derived($page.status === 404);
  let githubLinks = siteConfig.githubLinks as GitHubLink[];
  let documentationRepo = githubLinks.find((link) => link.id === 'documentation');
  let compilerRepo = githubLinks.find((link) => link.id === 'compiler');
  let requestedPath = $derived($page.url.pathname + $page.url.hash);

  function openSearch() {
    document.querySelector<HTMLButtonElement>('[data-open-search]')?.click();
  }

  function goBack() {
    if (history.length > 1) history.back();
    else location.href = `${base}/${lang}/${version}/docs/book/`;
  }
</script>

<svelte:head>
  <title>{t(lang, isNotFound ? 'error.pageNotFoundTitle' : 'error.genericTitle')} · Cvolo</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="min-h-[calc(100dvh-var(--header-h))] bg-white dark:bg-zinc-950">
  <div class="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
    <div class="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
      <section>
        <div class="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-violet-700 dark:border-violet-900/70 dark:bg-violet-950/40 dark:text-violet-300">
          <FileQuestion class="size-3.5" strokeWidth={2} />
          <span>{$page.status} · {t(lang, 'common.documentation')}</span>
        </div>

        <h1 class="max-w-3xl text-balance text-4xl font-bold tracking-[-0.035em] text-zinc-950 sm:text-5xl dark:text-white">
          {t(lang, isNotFound ? 'error.notFoundHeading' : 'error.genericHeading')}
        </h1>

        <p class="mt-5 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg dark:text-zinc-400">
          {t(lang, isNotFound ? 'error.notFoundDescription' : 'error.genericDescription')}
        </p>

        <div class="mt-6 max-w-2xl overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div class="border-b border-zinc-200 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
            {t(lang, 'error.requestedPath')}
          </div>
          <code class="block overflow-x-auto px-4 py-3 font-mono text-sm text-zinc-700 dark:text-zinc-300">{requestedPath}</code>
        </div>

        <div class="mt-7 flex flex-wrap gap-3">
          <a
            href={`${base}/${lang}/${version}/docs/book/`}
            class="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
          >
            <BookOpen class="size-4" />
            {t(lang, 'error.openBook')}
          </a>
          <button
            type="button"
            onclick={goBack}
            class="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
          >
            <ArrowLeft class="size-4" />
            {t(lang, 'error.goBack')}
          </button>
          <button
            type="button"
            onclick={openSearch}
            class="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
          >
            <Search class="size-4" />
            {t(lang, 'common.searchDocs')}
            <kbd class="ml-1 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">/</kbd>
          </button>
        </div>
      </section>

      {#if documentationRepo}
        <aside class="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div class="border-b border-zinc-200 p-5 dark:border-zinc-800">
            <div class="flex size-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
              <Github class="size-4.5" />
            </div>
            <h2 class="mt-4 text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
              {t(lang, 'error.helpTitle')}
            </h2>
            <p class="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {t(lang, isNotFound ? 'error.helpNotFound' : 'error.helpGeneric')}
            </p>
          </div>

          <div class="p-3">
            <a
              href={documentationRepo.url}
              target="_blank"
              rel="noreferrer"
              class="group flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-white dark:hover:bg-zinc-950"
            >
              <div class="min-w-0 flex-1">
                <div class="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {t(lang, 'error.documentationRepository')}
                </div>
                <div class="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-500">{documentationRepo.description}</div>
              </div>
              <ExternalLink class="size-4 shrink-0 text-zinc-400 transition group-hover:text-violet-500" />
            </a>

            {#if compilerRepo}
              <a
                href={compilerRepo.url}
                target="_blank"
                rel="noreferrer"
                class="group flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-white dark:hover:bg-zinc-950"
              >
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {t(lang, 'error.compilerSource')}
                  </div>
                  <div class="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-500">{compilerRepo.description}</div>
                </div>
                <ExternalLink class="size-4 shrink-0 text-zinc-400 transition group-hover:text-violet-500" />
              </a>
            {/if}
          </div>
        </aside>
      {/if}
    </div>

    <div class="mt-14 border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
      {t(lang, 'error.footer')}
    </div>
  </div>
</main>
