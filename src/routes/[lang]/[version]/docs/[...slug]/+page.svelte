<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import type { TopicPage } from '$lib/docs/types';

  let { data }: { data: { topic: TopicPage; html: string } } = $props();
  let mobileNav = $state(false);
  let copyReset: number | undefined;

  async function articleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>('[data-copy-code]');
    if (!button) return;
    const frame = button.closest('.code-frame');
    const code = frame?.querySelector('pre code')?.textContent ?? '';
    if (!code) return;
    await navigator.clipboard.writeText(code);
    button.textContent = 'Copied';
    window.clearTimeout(copyReset);
    copyReset = window.setTimeout(() => (button.textContent = 'Copy'), 1200);
  }
</script>

<svelte:head>
  <title>{data.topic.title} · Cvolo</title>
  <meta name="description" content={data.topic.excerpt} />
</svelte:head>

<div class="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_240px]">
  <div class="hidden border-r border-zinc-200 lg:block dark:border-zinc-800">
    <div class="sticky top-[var(--header-h)]"><Sidebar /></div>
  </div>

  <main class="min-w-0 px-5 py-7 sm:px-8 lg:px-12 xl:px-14">
    <div class="mx-auto max-w-4xl">
      <button type="button" onclick={() => (mobileNav = true)} class="mb-5 inline-flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 lg:hidden dark:border-zinc-800 dark:text-zinc-300">
        <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        Contents
      </button>

      <nav class="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400">
        <a href={`${base}/${$page.params.lang}/${$page.params.version}/docs/`} class="hover:text-zinc-700 dark:hover:text-zinc-200">Docs</a>
        {#each data.topic.breadcrumbs as crumb, index}
          <span>/</span>
          {#if index === data.topic.breadcrumbs.length - 1}
            <span class="text-zinc-500 dark:text-zinc-400">{crumb.title}</span>
          {:else}
            <a href={`${base}/${$page.params.lang}/${$page.params.version}/docs/${crumb.slug}/`} class="hover:text-zinc-700 dark:hover:text-zinc-200">{crumb.title}</a>
          {/if}
        {/each}
      </nav>

      <header class="mb-8 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div class="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-violet-600 dark:text-violet-400">
          {data.topic.groupId === 'book' ? ($page.params.lang === 'ru' ? 'Учебник' : 'Book') : data.topic.groupId === 'advanced' ? ($page.params.lang === 'ru' ? 'Продвинутая книга' : 'Advanced') : data.topic.groupId === 'base' ? 'Base SDK' : 'Std / System'}
        </div>
        <h1 class="text-balance break-words text-3xl font-bold leading-tight tracking-[-0.025em] text-zinc-950 sm:text-4xl dark:text-white">{data.topic.title}</h1>
      </header>

      {#if data.html}
        <article class="doc-prose" onclick={articleClick}>{@html data.html}</article>
      {:else}
        <p class="text-sm leading-6 text-zinc-500 dark:text-zinc-400">This heading is a section container. Choose one of the topics below.</p>
      {/if}

      {#if data.topic.children.length}
        <section class="mt-10 border-t border-zinc-200 pt-7 dark:border-zinc-800">
          <h2 class="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Topics in this section</h2>
          <div class="grid gap-2 sm:grid-cols-2">
            {#each data.topic.children as child}
              <a href={`${base}/${$page.params.lang}/${$page.params.version}/docs/${child.slug}/`} class="group flex items-start justify-between gap-3 rounded-lg border border-zinc-200 px-3.5 py-3 text-sm text-zinc-700 hover:border-violet-300 hover:bg-violet-50/40 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-violet-900 dark:hover:bg-violet-950/20">
                <span>{child.title}</span>
                <span class="text-zinc-300 group-hover:text-violet-500 dark:text-zinc-700">→</span>
              </a>
            {/each}
          </div>
        </section>
      {/if}

      <nav class="mt-12 grid gap-3 border-t border-zinc-200 pt-6 sm:grid-cols-2 dark:border-zinc-800">
        {#if data.topic.previous}
          <a href={`${base}/${$page.params.lang}/${$page.params.version}/docs/${data.topic.previous.slug}/`} class={["rounded-lg border border-zinc-200 p-4 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700", !data.topic.next ? "sm:col-span-2" : ""].join(" ")}>
            <div class="text-xs text-zinc-400">← {$page.params.lang === 'ru' ? 'Назад' : 'Previous'}</div>
            <div class="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">{data.topic.previous.title}</div>
          </a>
        {/if}
        {#if data.topic.next}
          <a href={`${base}/${$page.params.lang}/${$page.params.version}/docs/${data.topic.next.slug}/`} class={["rounded-lg border border-zinc-200 p-4 text-right hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700", !data.topic.previous ? "sm:col-span-2" : ""].join(" ")}>
            <div class="text-xs text-zinc-400">{$page.params.lang === 'ru' ? 'Дальше' : 'Next'} →</div>
            <div class="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">{data.topic.next.title}</div>
          </a>
        {/if}
      </nav>
    </div>
  </main>

</div>

{#if mobileNav}
  <div class="fixed inset-0 z-50 bg-zinc-950/30 lg:hidden" role="presentation" onclick={(event) => event.currentTarget === event.target && (mobileNav = false)}>
    <div class="h-full w-[min(88vw,320px)] border-r border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
      <div class="flex h-12 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
        <span class="text-sm font-semibold text-zinc-900 dark:text-white">Contents</span>
        <button type="button" onclick={() => (mobileNav = false)} class="grid size-8 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900" aria-label="Close navigation">×</button>
      </div>
      <Sidebar onNavigate={() => (mobileNav = false)} />
    </div>
  </div>
{/if}
