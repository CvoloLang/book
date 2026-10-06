<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import PageToc from '$lib/components/PageToc.svelte';
  import { Copy, ExternalLink, Github, X } from '@lucide/svelte';
  import manifestData from '$lib/generated/manifest.json';
  import type { ManifestGroup, TopicPage } from '$lib/docs/types';
  import { t } from '$lib/i18n';

  let { data }: { data: { topic: TopicPage; html: string } } = $props();
  const manifests = manifestData as Record<string, ManifestGroup[]>;
  let mobileNav = $state(false);
  let copyReset: number | undefined;
  let lang = $derived($page.params.lang);
  let sourceOpen = $state(false);
  let sourceLoading = $state(false);
  let sourcePath = $state('');
  let sourceCode = $state('');
  let sourceHtml = $state('');
  let sourceError = $state('');
  let sourceGithubUrl = $state('');
  let sourceRequest = 0;
  const sourceCache = new Map<string, { code: string; html: string }>();


  type GoToDefinitionClientRule = {
    value: string;
    path: string;
    rawUrl: string;
    githubUrl: string;
  };

  type DefinitionMatch = {
    start: number;
    end: number;
    rule: GoToDefinitionClientRule;
  };

  function isIdentifierChar(value: string | undefined) {
    return Boolean(value && /[A-Za-z0-9_]/.test(value));
  }

  function hasDefinitionBoundary(text: string, start: number, end: number, value: string) {
    if (isIdentifierChar(value[0]) && isIdentifierChar(text[start - 1])) return false;
    if (isIdentifierChar(value[value.length - 1]) && isIdentifierChar(text[end])) return false;
    return true;
  }

  function definitionMatches(text: string, rules: GoToDefinitionClientRule[]) {
    const candidates: DefinitionMatch[] = [];
    for (const rule of rules) {
      if (!rule.value || rule.value.includes('\n')) continue;
      let from = 0;
      while (from <= text.length - rule.value.length) {
        const start = text.indexOf(rule.value, from);
        if (start < 0) break;
        const end = start + rule.value.length;
        if (hasDefinitionBoundary(text, start, end, rule.value)) candidates.push({ start, end, rule });
        from = Math.max(end, start + 1);
      }
    }

    // Prefer the most specific expression when rules overlap. For example,
    // `[Result]` wins over a global `Result` rule inside the same attribute.
    candidates.sort((a, b) => (b.end - b.start) - (a.end - a.start) || a.start - b.start);
    const selected: DefinitionMatch[] = [];
    for (const candidate of candidates) {
      if (selected.some((item) => candidate.start < item.end && candidate.end > item.start)) continue;
      selected.push(candidate);
    }
    return selected.sort((a, b) => b.start - a.start);
  }

  function textPoint(root: Node, absoluteOffset: number) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let consumed = 0;
    let node = walker.nextNode();
    while (node) {
      const length = node.textContent?.length ?? 0;
      if (absoluteOffset <= consumed + length) {
        return { node, offset: Math.max(0, absoluteOffset - consumed) };
      }
      consumed += length;
      node = walker.nextNode();
    }
    return undefined;
  }

  function wrapDefinition(code: HTMLElement, match: DefinitionMatch) {
    const start = textPoint(code, match.start);
    const end = textPoint(code, match.end);
    if (!start || !end) return;

    const range = document.createRange();
    try {
      range.setStart(start.node, start.offset);
      range.setEnd(end.node, end.offset);
      if (range.collapsed) return;

      const fragment = range.extractContents();
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-definition-ref';
      button.dataset.sourceFile = '';
      button.dataset.sourcePath = match.rule.path;
      button.dataset.sourceRawUrl = match.rule.rawUrl;
      button.dataset.sourceGithubUrl = match.rule.githubUrl;
      button.title = `Go to definition: ${match.rule.value}`;
      button.setAttribute('aria-label', `Go to definition: ${match.rule.value}`);
      button.append(fragment);
      range.insertNode(button);
    } catch {
      // A malformed/highly unusual highlighted DOM should never break the
      // article. The code remains readable even if this one reference cannot
      // be decorated.
    }
  }

  function decorateGoToDefinitions(article: HTMLElement) {
    for (const scope of article.querySelectorAll<HTMLElement>('[data-go-to-definitions]')) {
      if (scope.dataset.goToDefinitionReady === 'true') continue;
      scope.dataset.goToDefinitionReady = 'true';

      let rules: GoToDefinitionClientRule[] = [];
      try {
        rules = JSON.parse(scope.dataset.goToDefinitions ?? '[]') as GoToDefinitionClientRule[];
      } catch {
        continue;
      }
      if (!rules.length) continue;

      const code = scope.querySelector<HTMLElement>('pre.shiki code, pre.plain-code code');
      if (!code) continue;

      // Decorate each visual source line independently. Using one Range across
      // the whole <code> element can cross Shiki's .line wrappers and move a
      // line-number pseudo-element into the middle of a source line.
      const lines = [...code.querySelectorAll<HTMLElement>(':scope > .line')];
      if (lines.length) {
        for (const line of lines) {
          const text = line.textContent ?? '';
          for (const match of definitionMatches(text, rules)) wrapDefinition(line, match);
        }
      } else {
        const text = code.textContent ?? '';
        for (const match of definitionMatches(text, rules)) wrapDefinition(code, match);
      }
    }
  }

  let groupLabel = $derived.by(() => {
    const groups = manifests[`${$page.params.version}/${$page.params.lang}`] ?? [];
    const group = groups.find((item) => item.id === data.topic.groupId);
    return group?.eyebrow || group?.title || data.topic.breadcrumbs[0]?.title || data.topic.groupId;
  });

  function closeSource() {
    sourceOpen = false;
  }

  function onWindowKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && sourceOpen) closeSource();
  }

  async function openSource(button: HTMLElement) {
    const rawUrl = button.dataset.sourceRawUrl ?? '';
    const githubUrl = button.dataset.sourceGithubUrl ?? '';
    const path = button.dataset.sourcePath ?? '';
    if (!rawUrl) return;

    sourcePath = path;
    sourceGithubUrl = githubUrl;
    sourceError = '';
    sourceOpen = true;

    const cached = sourceCache.get(rawUrl);
    if (cached !== undefined) {
      sourceCode = cached.code;
      sourceHtml = cached.html;
      sourceLoading = false;
      return;
    }

    const request = ++sourceRequest;
    sourceCode = '';
    sourceHtml = '';
    sourceLoading = true;
    try {
      const response = await fetch(rawUrl, { headers: { Accept: 'text/plain' } });
      if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
      const code = await response.text();
      if (request !== sourceRequest) return;
      const { highlightSource } = await import('$lib/docs/highlighter.client');
      const html = await highlightSource(code, path);
      if (request !== sourceRequest) return;
      sourceCache.set(rawUrl, { code, html });
      sourceCode = code;
      sourceHtml = html;
    } catch (error) {
      if (request !== sourceRequest) return;
      sourceError = error instanceof Error ? error.message : 'Could not load the source file.';
    } finally {
      if (request === sourceRequest) sourceLoading = false;
    }
  }

  async function copySource() {
    if (!sourceCode) return;
    await navigator.clipboard.writeText(sourceCode);
  }


  function toggleFileTreeFolder(summary: HTMLElement) {
    const details = summary.closest<HTMLDetailsElement>('details.file-tree-folder');
    const content = details?.querySelector<HTMLElement>(':scope > .file-tree-children');
    if (!details || !content || details.dataset.animating === 'true') return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      details.open = !details.open;
      return;
    }

    details.dataset.animating = 'true';
    const closing = details.open;
    if (!closing) details.open = true;
    details.classList.toggle('is-closing', closing);

    const height = content.scrollHeight;
    const animation = content.animate(
      closing
        ? [{ height: `${height}px`, opacity: 1 }, { height: '0px', opacity: 0 }]
        : [{ height: '0px', opacity: 0 }, { height: `${height}px`, opacity: 1 }],
      { duration: 210, easing: 'cubic-bezier(.2,.8,.2,1)' }
    );

    animation.addEventListener('finish', () => {
      if (closing) details.open = false;
      details.classList.remove('is-closing');
      delete details.dataset.animating;
    }, { once: true });
    animation.addEventListener('cancel', () => {
      details.classList.remove('is-closing');
      delete details.dataset.animating;
    }, { once: true });
  }

  // Marked inserts HTML with {@html}. Attach a native listener to the real
  // article element rather than relying on Svelte's delegated onclick handler.
  // The action is recreated automatically when this article element changes.
  function enhanceArticle(node: HTMLElement, _html: string) {
    let generation = 0;
    const scheduleDecoration = () => {
      const current = ++generation;
      queueMicrotask(() => {
        if (current === generation) decorateGoToDefinitions(node);
      });
    };

    node.addEventListener('click', articleClick);
    scheduleDecoration();
    return {
      update() { scheduleDecoration(); },
      destroy() { node.removeEventListener('click', articleClick); }
    };
  }

  async function articleClick(event: MouseEvent) {
    if (!(event.target instanceof Element)) return;
    const target = event.target;

    const folderSummary = target.closest<HTMLElement>('.file-tree-folder-row');
    if (folderSummary) {
      event.preventDefault();
      toggleFileTreeFolder(folderSummary);
      return;
    }

    const sourceButton = target.closest<HTMLElement>('[data-source-file]');
    if (sourceButton) {
      event.preventDefault();
      await openSource(sourceButton);
      return;
    }

    const tabButton = target.closest<HTMLButtonElement>('[data-code-tab-button]');
    if (tabButton) {
      const tabs = tabButton.closest<HTMLElement>('[data-code-tabs]');
      if (!tabs) return;
      const index = tabButton.dataset.tabIndex;
      for (const button of tabs.querySelectorAll<HTMLButtonElement>('[data-code-tab-button]')) {
        const active = button.dataset.tabIndex === index;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
      }
      for (const panel of tabs.querySelectorAll<HTMLElement>('[data-code-tab-panel]')) {
        panel.hidden = panel.dataset.tabIndex !== index;
      }
      return;
    }

    const button = target.closest<HTMLButtonElement>('[data-copy-code]');
    if (!button) return;
    const container = button.closest<HTMLElement>('.code-frame, [data-code-tabs]');
    const code = container?.matches('[data-code-tabs]')
      ? (container.querySelector<HTMLElement>('[data-code-tab-panel]:not([hidden]) pre code')?.textContent ?? '')
      : (container?.querySelector<HTMLElement>('pre code')?.textContent ?? '');
    if (!code) return;
    await navigator.clipboard.writeText(code);
    const label = button.querySelector<HTMLElement>('[data-copy-label]');
    if (label) label.textContent = t(lang, 'common.copied');
    else button.textContent = t(lang, 'common.copied');
    window.clearTimeout(copyReset);
    copyReset = window.setTimeout(() => {
      const nextLabel = button.querySelector<HTMLElement>('[data-copy-label]');
      if (nextLabel) nextLabel.textContent = t(lang, 'common.copy');
      else button.textContent = t(lang, 'common.copy');
    }, 1200);
  }
</script>

<svelte:window onkeydown={onWindowKeydown} />

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
        {t(lang, 'common.contents')}
      </button>

      <nav class="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400">
        <a href={`${base}/${$page.params.lang}/${$page.params.version}/docs/`} class="hover:text-zinc-700 dark:hover:text-zinc-200">{t(lang, 'common.docs')}</a>
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
          {groupLabel}
        </div>
        <h1 class="text-balance break-words text-3xl font-bold leading-tight tracking-[-0.025em] text-zinc-950 sm:text-4xl dark:text-white">{data.topic.title}</h1>
      </header>

      {#if data.html}
        <article class="doc-prose" use:enhanceArticle={data.html}>{@html data.html}</article>
      {:else}
        <p class="text-sm leading-6 text-zinc-500 dark:text-zinc-400">{t(lang, 'article.sectionContainer')}</p>
      {/if}

      {#if data.topic.children.length}
        <section class="mt-10 border-t border-zinc-200 pt-7 dark:border-zinc-800">
          <h2 class="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t(lang, 'article.topicsInSection')}</h2>
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
            <div class="text-xs text-zinc-400">← {t(lang, 'common.previous')}</div>
            <div class="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">{data.topic.previous.title}</div>
          </a>
        {/if}
        {#if data.topic.next}
          <a href={`${base}/${$page.params.lang}/${$page.params.version}/docs/${data.topic.next.slug}/`} class={["rounded-lg border border-zinc-200 p-4 text-right hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700", !data.topic.previous ? "sm:col-span-2" : ""].join(" ")}>
            <div class="text-xs text-zinc-400">{t(lang, 'common.next')} →</div>
            <div class="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">{data.topic.next.title}</div>
          </a>
        {/if}
      </nav>
    </div>
  </main>

  <div class="hidden px-5 py-8 xl:block">
    {#key $page.url.pathname}
      <PageToc toc={data.topic.toc} />
    {/key}
  </div>
</div>

{#if mobileNav}
  <div class="fixed inset-0 z-50 bg-zinc-950/30 lg:hidden" role="presentation" onclick={(event) => event.currentTarget === event.target && (mobileNav = false)}>
    <div class="h-full w-[min(88vw,320px)] border-r border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
      <div class="flex h-12 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
        <span class="text-sm font-semibold text-zinc-900 dark:text-white">{t(lang, 'common.contents')}</span>
        <button type="button" onclick={() => (mobileNav = false)} class="grid size-8 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900" aria-label={t(lang, 'common.closeNavigation')}>×</button>
      </div>
      <Sidebar onNavigate={() => (mobileNav = false)} />
    </div>
  </div>
{/if}

{#if sourceOpen}
  <div class="source-modal-backdrop" role="presentation" onclick={(event) => event.currentTarget === event.target && closeSource()}>
    <div class="source-modal" role="dialog" aria-modal="true" aria-label={`Source: ${sourcePath}`}>
      <header class="source-modal-header">
        <div class="min-w-0">
          <div class="source-modal-eyebrow"><Github class="size-3.5" /> <span>{$page.params.lang === 'ru' ? 'Исходник GitHub' : 'GitHub source'}</span></div>
          <div class="source-modal-path" title={sourcePath}>{sourcePath}</div>
        </div>
        <div class="source-modal-actions">
          {#if sourceGithubUrl}
            <a class="source-modal-action" href={sourceGithubUrl} target="_blank" rel="noreferrer"><ExternalLink class="size-3.5" /><span>{$page.params.lang === 'ru' ? 'Открыть на GitHub' : 'View on GitHub'}</span></a>
          {/if}
          <button class="source-modal-action" type="button" onclick={copySource} disabled={!sourceCode}><Copy class="size-3.5" /><span>{t(lang, 'common.copy')}</span></button>
          <button class="source-modal-close" type="button" onclick={closeSource} aria-label={$page.params.lang === 'ru' ? 'Закрыть исходник' : 'Close source viewer'}><X class="size-4" /></button>
        </div>
      </header>

      <div class="source-modal-body">
        {#if sourceLoading}
          <div class="source-modal-state">{$page.params.lang === 'ru' ? 'Загрузка исходника с GitHub…' : 'Loading source from GitHub…'}</div>
        {:else if sourceError}
          <div class="source-modal-state source-modal-error">
            <strong>{$page.params.lang === 'ru' ? 'Не удалось загрузить файл.' : 'Could not load this file.'}</strong>
            <span>{sourceError}</span>
            {#if sourceGithubUrl}<a href={sourceGithubUrl} target="_blank" rel="noreferrer">{$page.params.lang === 'ru' ? 'Открыть файл на GitHub ↗' : 'Open it on GitHub ↗'}</a>{/if}
          </div>
        {:else}
          <div class="source-modal-highlight">{@html sourceHtml}</div>
        {/if}
      </div>
    </div>
  </div>
{/if}
