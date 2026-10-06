<script lang="ts">
  import type { TocLink } from '$lib/docs/types';
  import { page } from '$app/stores';
  import { tick } from 'svelte';
  import { t } from '$lib/i18n';

  let { toc }: { toc: TocLink[] } = $props();
  let lang = $derived($page.params.lang);

  // Armarium keeps a set of active TOC entries, not one current heading.
  // We do the same: a section is active while its content intersects the
  // readable viewport. Parent sections stay active while a nested subsection
  // is visible, so several entries can be highlighted at the same time.
  let activeIds = $state<string[]>([]);
  let navRef = $state<HTMLElement | null>(null);
  let navContentRef = $state<HTMLElement | null>(null);
  let indicatorTop = $state(0);
  let indicatorHeight = $state(0);
  let indicatorVisible = $state(false);

  const activeSet = $derived(new Set(activeIds));
  const primaryId = $derived(activeIds.at(-1) ?? '');

  function headerOffset() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--header-h');
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 64;
  }

  function sameIds(a: string[], b: string[]) {
    return a.length === b.length && a.every((value, index) => value === b[index]);
  }

  function ensurePrimaryItemVisible() {
    if (!navRef || !primaryId) return;
    const link = navRef.querySelector<HTMLElement>(`[data-toc-id="${CSS.escape(primaryId)}"]`);
    if (!link) return;

    const viewportTop = navRef.scrollTop;
    const viewportBottom = viewportTop + navRef.clientHeight;
    const itemTop = link.offsetTop;
    const itemBottom = itemTop + link.offsetHeight;

    if (itemTop < viewportTop + 8) {
      navRef.scrollTo({ top: Math.max(0, itemTop - 8), behavior: 'smooth' });
    } else if (itemBottom > viewportBottom - 8) {
      navRef.scrollTo({
        top: itemBottom - navRef.clientHeight + 8,
        behavior: 'smooth'
      });
    }
  }

  function updateIndicator() {
    if (!navContentRef || !activeIds.length) {
      indicatorVisible = false;
      return;
    }

    // Armarium can keep several TOC entries active at once. The indicator
    // should represent that whole visible section range, not only the last
    // (primary) item. This also makes adjacent active entries read as one
    // continuous marker while scrolling.
    const links = activeIds
      .map((id) =>
        navContentRef?.querySelector<HTMLElement>(`[data-toc-id="${CSS.escape(id)}"]`) ?? null
      )
      .filter((link): link is HTMLElement => link instanceof HTMLElement);

    if (!links.length) {
      indicatorVisible = false;
      return;
    }

    const first = links[0];
    const last = links[links.length - 1];
    indicatorTop = first.offsetTop;
    indicatorHeight = Math.max(1, last.offsetTop + last.offsetHeight - first.offsetTop);
    indicatorVisible = true;
  }

  $effect(() => {
    // Like Armarium's tocState.reload(), rebuild all DOM references when the
    // rendered article changes rather than keeping state from the old route.
    const pathname = $page.url.pathname;
    const signature = toc.map((item) => `${item.id}:${item.level}`).join('|');
    void pathname;
    void signature;

    let disposed = false;
    let cleanup = () => {};

    tick().then(() => {
      if (disposed) return;

      const entries = toc
        .map((item) => ({ item, element: document.getElementById(item.id) }))
        .filter(
          (entry): entry is { item: TocLink; element: HTMLElement } =>
            entry.element instanceof HTMLElement
        );

      if (!entries.length) {
        activeIds = [];
        return;
      }

      const article = entries[0].element.closest<HTMLElement>('.doc-prose');
      let frame = 0;

      // The current TOC item is the deepest heading that has crossed the
      // reading line below the sticky header. Its parent headings remain
      // active as the hierarchy around that item.
      //
      // This is intentionally position-based rather than overlap-based:
      // short H3 sections should not lose their active state merely because
      // less than an arbitrary amount of their content is visible.
      const update = () => {
        frame = 0;

        const readingLine = headerOffset() + 24;
        const atDocumentEnd =
          window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;

        let primaryIndex = -1;

        for (let index = 0; index < entries.length; index += 1) {
          const top = entries[index].element.getBoundingClientRect().top;
          if (top <= readingLine) primaryIndex = index;
          else break;
        }

        // Before the first heading becomes current, keep the first TOC item
        // selected. At the exact bottom of the article, keep the final item.
        if (primaryIndex < 0) primaryIndex = 0;
        if (atDocumentEnd) primaryIndex = entries.length - 1;

        // Find the nearest parent heading of the current item. The violet
        // indicator is continuous, so every TOC entry covered by that indicator
        // must use the active colour as well. Otherwise we get a violet line
        // spanning several rows while only the first and last rows are violet.
        let rangeStart = primaryIndex;
        const primaryLevel = entries[primaryIndex].item.level;

        for (let index = primaryIndex - 1; index >= 0; index -= 1) {
          if (entries[index].item.level < primaryLevel) {
            rangeStart = index;
            break;
          }
        }

        const nextActive = entries
          .slice(rangeStart, primaryIndex + 1)
          .map((entry) => entry.item.id);

        if (!sameIds(nextActive, activeIds)) activeIds = nextActive;
      };

      const scheduleUpdate = () => {
        if (frame) return;
        frame = requestAnimationFrame(update);
      };

      const handleHashChange = () => {
        // The browser performs the actual anchor navigation. We only schedule
        // a new visibility calculation so activeIds reflects what is on screen.
        scheduleUpdate();
      };

      const resizeObserver = article ? new ResizeObserver(scheduleUpdate) : null;
      if (article && resizeObserver) resizeObserver.observe(article);

      scheduleUpdate();
      window.addEventListener('scroll', scheduleUpdate, { passive: true });
      window.addEventListener('resize', scheduleUpdate, { passive: true });
      window.addEventListener('hashchange', handleHashChange);

      cleanup = () => {
        if (frame) cancelAnimationFrame(frame);
        resizeObserver?.disconnect();
        window.removeEventListener('scroll', scheduleUpdate);
        window.removeEventListener('resize', scheduleUpdate);
        window.removeEventListener('hashchange', handleHashChange);
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  });

  $effect(() => {
    // Touch both values so this reruns whenever the active group changes.
    const signature = activeIds.join('|');
    void signature;

    tick().then(() => {
      updateIndicator();
      ensurePrimaryItemVisible();
    });
  });
</script>

<aside class="sticky top-[calc(var(--header-h)+1.5rem)] text-sm">
  {#if toc.length}
    <h2 class="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
      {t(lang, 'toc.onThisPage')}
    </h2>
    <nav
      bind:this={navRef}
      class="max-h-[calc(100vh-var(--header-h)-5rem)] overflow-y-auto pr-1"
    >
      <div bind:this={navContentRef} class="relative border-l border-zinc-200 dark:border-zinc-800">
        <span
          aria-hidden="true"
          class="pointer-events-none absolute -left-px top-0 z-10 w-px rounded-full bg-violet-500 transition-[transform,height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={`height:${indicatorHeight}px; transform:translateY(${indicatorTop}px); opacity:${indicatorVisible ? 1 : 0}`}
        ></span>

        {#each toc.slice(0, 24) as item}
          <a
            href={`#${item.id}`}
            data-toc-id={item.id}
            aria-current={primaryId === item.id ? 'location' : undefined}
            class={activeSet.has(item.id)
              ? 'block py-1.5 text-[13px] leading-5 text-violet-600 transition-colors duration-200 dark:text-violet-400'
              : 'block py-1.5 text-[13px] leading-5 text-zinc-500 transition-colors duration-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}
            style={`padding-left:${0.75 + Math.max(0, item.level - 3) * 0.75}rem`}
          >{item.title}</a>
        {/each}
      </div>
    </nav>
  {/if}
</aside>
