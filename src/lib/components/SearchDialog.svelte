<script lang="ts">
  import { tick } from 'svelte';
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import siteConfig from '$lib/generated/site-config.json';
  import { t } from '$lib/i18n';

  type SearchItem = {
    version: string;
    lang: string;
    slug: string;
    title: string;
    breadcrumbs: string[];
    excerpt: string;
    text: string;
  };

  let { open = $bindable(false) }: { open: boolean } = $props();
  let query = $state('');
  let input = $state<HTMLInputElement>();
  let items = $state<SearchItem[]>([]);
  let loading = $state(false);
  let loadFailed = $state(false);
  let lang = $derived($page.params.lang ?? siteConfig.site.defaultLanguage);

  async function loadIndex() {
    if (loading || items.length) return;
    loading = true;
    loadFailed = false;
    try {
      const response = await fetch(`${base}/search-index.json`);
      if (!response.ok) throw new Error(`Search index request failed: ${response.status}`);
      items = await response.json();
    } catch {
      loadFailed = true;
    } finally {
      loading = false;
    }
  }

  const results = $derived.by(() => {
    const q = query.trim().toLowerCase();
    const scoped = items.filter((item) =>
      item.version === ($page.params.version ?? siteConfig.site.defaultVersion) &&
      item.lang === ($page.params.lang ?? siteConfig.site.defaultLanguage)
    );
    if (!q) return scoped.slice(0, 10);
    const terms = q.split(/\s+/).filter(Boolean);
    return scoped
      .map((item) => {
        const title = item.title.toLowerCase();
        const haystack = `${item.breadcrumbs.join(' ')} ${item.text}`.toLowerCase();
        let score = title.includes(q) ? 100 : 0;
        for (const term of terms) {
          if (title.includes(term)) score += 20;
          if (haystack.includes(term)) score += 3;
        }
        return { item, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 14)
      .map((entry) => entry.item);
  });

  $effect(() => {
    if (open) {
      void loadIndex();
      tick().then(() => input?.focus());
    } else {
      query = '';
    }
  });

  function close() {
    open = false;
  }

  function onKeydown(event: KeyboardEvent) {
    if (open && event.key === 'Escape') close();
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <div class="fixed inset-0 z-50 bg-zinc-950/35 p-3 pt-[10vh] backdrop-blur-sm" role="presentation" onclick={(event) => event.currentTarget === event.target && close()}>
    <div class="mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
      <div class="flex items-center gap-3 border-b border-zinc-200 px-4 dark:border-zinc-800">
        <svg viewBox="0 0 24 24" class="size-5 shrink-0 text-zinc-400" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input bind:this={input} bind:value={query} placeholder={t(lang, 'search.placeholder')} class="h-14 min-w-0 flex-1 bg-transparent text-base text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100" />
        <button type="button" onclick={close} class="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-500 dark:border-zinc-700">Esc</button>
      </div>

      <div class="max-h-[65vh] overflow-y-auto p-2">
        {#if loading}
          <div class="px-4 py-10 text-center text-sm text-zinc-500">{t(lang, 'search.loading')}</div>
        {:else if loadFailed}
          <div class="px-4 py-10 text-center text-sm text-zinc-500">{t(lang, 'search.loadFailed')}</div>
        {:else if results.length}
          {#each results as result}
            <a href={`${base}/${result.lang}/${result.version}/docs/${result.slug}/`} onclick={close} class="block rounded-lg px-3 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-900">
              <div class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{result.title}</div>
              <div class="mt-0.5 truncate text-xs text-zinc-400">{result.breadcrumbs.join(' / ')}</div>
              {#if result.excerpt}
                <div class="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{result.excerpt}</div>
              {/if}
            </a>
          {/each}
        {:else}
          <div class="px-4 py-10 text-center text-sm text-zinc-500">{t(lang, 'search.noResults', { query })}</div>
        {/if}
      </div>
    </div>
  </div>
{/if}
