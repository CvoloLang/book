<script lang="ts">
  import { Popover } from 'bits-ui';
  import { ChevronDown, ExternalLink, Github } from '@lucide/svelte';
  import { page } from '$app/stores';
  import siteConfig from '$lib/generated/site-config.json';

  let open = $state(false);
  let lang = $derived($page.params.lang ?? siteConfig.site.defaultLanguage);
  let links = $derived((siteConfig.githubLinks ?? []).map((link) => {
    const labels = link.labels as Record<string, string>;
    return {
      ...link,
      label: labels[lang] ?? labels[siteConfig.site.defaultLanguage] ?? link.id
    };
  }));
</script>

{#if links.length > 0}
  <Popover.Root bind:open>
    <Popover.Trigger
      aria-label="GitHub links"
      title="GitHub"
      class="group flex h-9 items-center gap-1 rounded-lg px-2 text-zinc-500 outline-none transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-violet-500/25 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
    >
      <Github class="size-4.5" strokeWidth={1.9} />
      <ChevronDown class="size-3 text-zinc-400 transition-transform duration-150 group-data-[state=open]:rotate-180" strokeWidth={1.8} />
    </Popover.Trigger>

    <Popover.Portal>
      <Popover.Content
        side="bottom"
        align="end"
        sideOffset={7}
        class="z-[100] w-[286px] rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl shadow-black/10 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/35"
      >
        <div class="px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
          GitHub
        </div>

        <div class="flex flex-col gap-0.5">
          {#each links as link}
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              onclick={() => (open = false)}
              class="group/link flex items-center gap-3 rounded-lg px-2.5 py-2.5 outline-none transition hover:bg-zinc-100 focus-visible:bg-zinc-100 dark:hover:bg-zinc-900 dark:focus-visible:bg-zinc-900"
            >
              <span class="grid size-8 shrink-0 place-items-center rounded-md border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                <Github class="size-4" strokeWidth={1.8} />
              </span>

              <span class="min-w-0 flex-1">
                <span class="block truncate text-[12px] font-medium text-zinc-800 dark:text-zinc-100">{link.label}</span>
                {#if link.description}
                  <span class="mt-0.5 block truncate text-[10px] text-zinc-400">{link.description}</span>
                {/if}
              </span>

              <ExternalLink class="size-3.5 shrink-0 text-zinc-400 opacity-70 transition group-hover/link:opacity-100" strokeWidth={1.8} />
            </a>
          {/each}
        </div>
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
{/if}
