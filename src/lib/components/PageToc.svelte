<script lang="ts">
  import type { TocLink } from '$lib/docs/types';
  import { page } from '$app/stores';
  import { tick } from 'svelte';

  let { toc }: { toc: TocLink[] } = $props();
  const isRu = $derived($page.params.lang === 'ru');

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

    const itemTop = link.offsetTop - navRef.scrollTop;
    const itemBottom = itemTop + link.offsetHeight;

    // Do not chase every heading. Keep a comfortable vertical zone and only
    // move the TOC when the active item leaves it. This is much calmer on pages
    // with many short sections.
    const comfortTop = navRef.clientHeight * 0.18;
    const comfortBottom = navRef.clientHeight * 0.72;

    if (itemTop >= comfortTop && itemBottom <= comfortBottom) return;

    const targetTop =
      itemTop < comfortTop
        ? navRef.clientHeight * 0.22
        : navRef.clientHeight * 0.42;

    const maxScrollTop = Math.max(0, navRef.scrollHeight - navRef.clientHeight);
    const nextScrollTop = Math.min(
      maxScrollTop,
      Math.max(0, link.offsetTop - targetTop)
    );

    if (Math.abs(navRef.scrollTop - nextScrollTop) < 4) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    navRef.scrollTo({
      top: nextScrollTop,
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
  }

  function updateIndicator() {
    if (!navContentRef || !primaryId) {
      indicatorVisible = false;
      return;
    }

    const link = navContentRef.querySelector<HTMLElement>(
      `[data-toc-id="${CSS.escape(primaryId)}"]`
    );

    if (!link) {
      indicatorVisible = false;
      return;
    }

    indicatorTop = link.offsetTop;
    indicatorHeight = Math.max(1, link.offsetHeight);
    indicatorVisible = true;
  }


  function getActivationLine(element: HTMLElement) {
    const styles = getComputedStyle(element);
    const margin = Number.parseFloat(styles.scrollMarginTop);

    if (Number.isFinite(margin) && margin > 0) {
      return margin + 8;
    }

    return headerOffset() + 32;
  }

  $effect(() => {
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

      let frame = 0;

      const update = (forcedId?: string) => {
        frame = 0;

        let primaryIndex = 0;
        const documentBottom = window.scrollY + window.innerHeight;
        const pageBottom = document.documentElement.scrollHeight;
        const nearBottom = documentBottom >= pageBottom - 2;

        if (forcedId) {
          const forcedIndex = entries.findIndex((entry) => entry.item.id === forcedId);
          if (forcedIndex >= 0) primaryIndex = forcedIndex;
        } else if (nearBottom) {
          primaryIndex = entries.length - 1;
        } else {
          for (let index = 0; index < entries.length; index += 1) {
            const entry = entries[index];
            const activationLine = getActivationLine(entry.element);

            if (entry.element.getBoundingClientRect().top <= activationLine) {
              primaryIndex = index;
            } else {
              break;
            }
          }
        }

        const nextActive = [entries[primaryIndex].item.id];
        if (!sameIds(nextActive, activeIds)) activeIds = nextActive;
      };

      const scheduleUpdate = (forcedId?: string) => {
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => update(forcedId));
      };

      const handleHashChange = () => {
        const forcedId = decodeURIComponent(window.location.hash.replace(/^#/, ''));
        scheduleUpdate(forcedId || undefined);
      };

      const handleScroll = () => scheduleUpdate();
      const handleResize = () => scheduleUpdate();
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(document.documentElement);

      scheduleUpdate();
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleResize, { passive: true });
      window.addEventListener('hashchange', handleHashChange);

      cleanup = () => {
        if (frame) cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('hashchange', handleHashChange);
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  });

  $effect(() => {
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
      {isRu ? 'На этой странице' : 'On this page'}
    </h2>
    <nav
      bind:this={navRef}
      class="toc-scroll-clean max-h-[calc(100vh-var(--header-h)-5rem)] overflow-y-auto pr-1"
    >
      <div bind:this={navContentRef} class="relative border-l border-zinc-200 dark:border-zinc-800">
        <span
          aria-hidden="true"
          class="pointer-events-none absolute -left-px top-0 z-10 w-px rounded-full bg-violet-500 transition-[transform,height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={`height:${indicatorHeight}px; transform:translateY(${indicatorTop}px); opacity:${indicatorVisible ? 1 : 0}`}
        ></span>

        {#each toc as item}
          <a
            href={`#${item.id}`}
            data-toc-id={item.id}
            aria-current={primaryId === item.id ? 'location' : undefined}
            class={activeSet.has(item.id)
              ? 'block py-1.5 text-[13px] leading-5 text-violet-600 transition-colors duration-200 dark:text-violet-400'
              : 'block py-1.5 text-[13px] leading-5 text-zinc-500 transition-colors duration-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}
            style={`padding-left:${0.75 + Math.max(0, item.level - 2) * 0.8}rem`}
          >{item.title}</a>
        {/each}
      </div>
    </nav>
  {/if}
</aside>

<style>
  .toc-scroll-clean {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .toc-scroll-clean::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }
</style>
