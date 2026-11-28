<script lang="ts">
  import { onMount } from 'svelte';
  import { afterNavigate, goto } from '$app/navigation';
  import { Menu, X, Github, ExternalLink } from '@lucide/svelte';
  import { base } from '$app/paths';
  import type { ManifestGroup } from '$lib/docs/types';
  import manifestData from '$lib/generated/manifest.json';
  import siteConfig from '$lib/generated/site-config.json';
  import { page } from '$app/stores';
  import LocaleSelect from './LocaleSelect.svelte';
  import VersionSelect from './VersionSelect.svelte';
  import GitHubLinks from './GitHubLinks.svelte';
  import { t } from '$lib/i18n';

  let { onSearch }: { onSearch: () => void } = $props();
  const manifests = manifestData as Record<string, ManifestGroup[]>;
  let lang = $derived($page.params.lang ?? siteConfig.site.defaultLanguage);
  let version = $derived($page.params.version ?? siteConfig.site.defaultVersion);
  let sections = $derived(manifests[`${version}/${lang}`] ?? []);
  let dark = $state(false);
  let mobileMenu = $state<HTMLDialogElement>();
  let mobileOpen = $state(false);
  let githubLinks = $derived((siteConfig.githubLinks ?? []).map((link) => {
    const labels = link.labels as Record<string, string>;
    return { ...link, label: labels[lang] ?? labels[siteConfig.site.defaultLanguage] ?? link.id };
  }));

  function openMenu() {
    if (!mobileMenu || mobileMenu.open) return;
    mobileMenu.showModal();
    mobileOpen = true;
  }
  function closeMenu() {
    mobileMenu?.close();
    mobileOpen = false;
  }
  afterNavigate(closeMenu);

  function changeContext(nextLang: string, nextVersion: string) {
    const current = $page.url.pathname;
    const destination = $page.params.lang && $page.params.version
      ? current.replace(`/${lang}/${version}/`, `/${nextLang}/${nextVersion}/`)
      : `${base}/${nextLang}/${nextVersion}/`;
    closeMenu();
    void goto(destination);
  }

  onMount(() => {
    const saved = localStorage.getItem('cvolo-docs-theme');
    dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
    const desktop = window.matchMedia('(min-width: 1024px)');
    const onResize = () => { if (desktop.matches) closeMenu(); };
    desktop.addEventListener('change', onResize);
    return () => desktop.removeEventListener('change', onResize);
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

    <nav class="ml-2 hidden items-center gap-1 text-sm lg:flex">
      {#each sections as section}
        <a href={`${base}/${lang}/${version}/docs/${section.id}/`} class="rounded-md px-2.5 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white">{section.title}</a>
      {/each}
    </nav>

    <div class="ml-auto flex items-center gap-1.5">
      <div class="hidden items-center gap-1.5 lg:flex"><VersionSelect /><LocaleSelect /></div>
      <button
        type="button"
        onclick={onSearch}
        class="flex h-9 min-w-9 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 text-sm text-zinc-500 hover:border-zinc-300 hover:text-zinc-800 xl:min-w-52 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
        aria-label={t(lang, 'common.searchDocs')}
        data-open-search="true"
      >
        <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <span class="hidden xl:inline">{t(lang, 'common.searchDocs')}</span>
        <kbd class="ml-auto hidden rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] text-zinc-400 xl:inline dark:border-zinc-700 dark:bg-zinc-950">/</kbd>
      </button>

      <button type="button" onclick={toggleTheme} class="hidden size-9 place-items-center rounded-lg text-zinc-500 lg:grid hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white" aria-label={t(lang, 'common.toggleTheme')}>
        {#if dark}
          <svg viewBox="0 0 24 24" class="size-4.5" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></svg>
        {:else}
          <svg viewBox="0 0 24 24" class="size-4.5" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z"/></svg>
        {/if}
      </button>

      <div class="hidden lg:block"><GitHubLinks /></div>
      <button type="button" onclick={openMenu} aria-label={lang === 'ru' ? 'Открыть меню' : 'Open menu'} aria-expanded={mobileOpen} aria-controls="mobile-site-menu" class="grid size-10 place-items-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900 lg:hidden"><Menu class="size-5" /></button>
    </div>
  </div>
</header>

<!-- Native modal keeps keyboard focus inside and closes on Escape. -->
<dialog id="mobile-site-menu" bind:this={mobileMenu} onclose={() => (mobileOpen = false)} aria-label={lang === 'ru' ? 'Навигация' : 'Navigation'} class="mobile-site-menu">
  <div class="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
    <span class="font-semibold">Cvolo Docs</span>
    <button type="button" onclick={closeMenu} aria-label={lang === 'ru' ? 'Закрыть меню' : 'Close menu'} class="grid size-10 place-items-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"><X class="size-5" /></button>
  </div>
  <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
    <div class="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">{lang === 'ru' ? 'Документация' : 'Documentation'}</div>
    <nav aria-label={lang === 'ru' ? 'Разделы' : 'Sections'} class="grid gap-1">
      {#each sections as section}
        <a onclick={closeMenu} href={`${base}/${lang}/${version}/docs/${section.id}/`} class="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900">{section.title}</a>
      {/each}
    </nav>
    <div class="mt-5 grid gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <div class="text-xs font-semibold uppercase tracking-wide text-zinc-500">{lang === 'ru' ? 'Настройки' : 'Settings'}</div>
      <label class="grid gap-1 text-sm">
        <span>{lang === 'ru' ? 'Версия документации' : 'Documentation version'}</span>
        <select value={version} onchange={(event) => changeContext(lang, event.currentTarget.value)} class="rounded-lg border border-zinc-200 bg-transparent p-2.5 dark:border-zinc-700 dark:bg-zinc-900">
          {#each siteConfig.versions as item}<option value={item.id}>{item.label}</option>{/each}
        </select>
      </label>
      <label class="grid gap-1 text-sm">
        <span>{lang === 'ru' ? 'Язык' : 'Language'}</span>
        <select value={lang} onchange={(event) => changeContext(event.currentTarget.value, version)} class="rounded-lg border border-zinc-200 bg-transparent p-2.5 dark:border-zinc-700 dark:bg-zinc-900">
          {#each siteConfig.languages as item}<option value={item.id}>{item.label}</option>{/each}
        </select>
      </label>
      <button type="button" onclick={toggleTheme} class="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-3 text-sm dark:border-zinc-700" aria-pressed={dark}>
        {t(lang, 'common.toggleTheme')} <span>{dark ? (lang === 'ru' ? 'Тёмная' : 'Dark') : (lang === 'ru' ? 'Светлая' : 'Light')}</span>
      </button>
    </div>
    {#if githubLinks.length}
      <div class="mt-4 grid gap-1 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <div class="px-3 pb-1 text-xs font-semibold text-zinc-500">GitHub</div>
        {#each githubLinks as link}
          <a href={link.url} target="_blank" rel="noreferrer" onclick={closeMenu} class="flex items-center gap-2 rounded-lg px-3 py-3 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"><Github class="size-4 shrink-0" /><span class="flex-1">{link.label}</span><ExternalLink class="size-4 shrink-0 text-zinc-400" /></a>
        {/each}
      </div>
    {/if}
  </div>
</dialog>

<style>
  .mobile-site-menu {
    position: fixed;
    inset: 0 0 0 auto;
    margin: 0;
    width: min(100%, 360px);
    height: 100dvh;
    max-width: 100%;
    max-height: 100dvh;
    padding: 0;
    border: 0;
    background: white;
    color: #18181b;
  }
  .mobile-site-menu[open] { display: flex; flex-direction: column; }
  :global(.dark) .mobile-site-menu { background: #09090b; color: #f4f4f5; color-scheme: dark; }
  .mobile-site-menu::backdrop { background: rgb(0 0 0 / .5); }
  .mobile-site-menu { overscroll-behavior: contain; }
  .mobile-site-menu > div:last-child { scrollbar-width: thin; }
</style>
