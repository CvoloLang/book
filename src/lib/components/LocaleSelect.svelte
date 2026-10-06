<script lang="ts">
  import { Select } from 'bits-ui';
  import { Check, ChevronDown, Languages } from '@lucide/svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import siteConfig from '$lib/generated/site-config.json';

  const items = siteConfig.languages.map((item) => ({
    value: item.id,
    label: item.label,
    short: item.short
  }));

  let value = $derived($page.params.lang ?? siteConfig.site.defaultLanguage);
  let selected = $derived(items.find((item) => item.value === value) ?? items[0]);

  function change(next: string) {
    if (!next || next === value) return;
    const current = $page.url.pathname;
    const version = $page.params.version ?? siteConfig.site.defaultVersion;
    const lang = $page.params.lang;

    if (lang) {
      goto(current.replace(`/${lang}/${version}/`, `/${next}/${version}/`));
      return;
    }

    goto(`${base}/${next}/${version}/`);
  }
</script>

<Select.Root type="single" value={value} onValueChange={(next) => next && change(String(next))} items={items}>
  <Select.Trigger
    aria-label="Language"
    class="group flex h-8 min-w-[72px] items-center gap-2 rounded-md border border-zinc-200/80 bg-white px-2.5 text-[12px] font-medium text-zinc-700 shadow-sm outline-none transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-violet-500/25 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
  >
    <Languages class="size-3.5 text-zinc-400" strokeWidth={1.8} />
    <span>{selected.short}</span>
    <ChevronDown class="ml-auto size-3 text-zinc-400 transition-transform duration-150 group-data-[state=open]:rotate-180" strokeWidth={1.8} />
  </Select.Trigger>

  <Select.Portal>
    <Select.Content
      sideOffset={6}
      class="z-[100] min-w-[156px] rounded-lg border border-zinc-200 bg-white p-1 shadow-xl shadow-black/10 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/35"
    >
      {#snippet child({ wrapperProps, props, open })}
        {#if open}
          <div {...wrapperProps}>
            <div {...props}>
              <Select.Viewport class="flex flex-col gap-0.5">
                {#each items as item}
                  <Select.Item
                    value={item.value}
                    label={item.label}
                    class="group/item flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] font-medium text-zinc-700 outline-none transition data-[highlighted]:bg-zinc-100 data-[selected]:text-violet-700 dark:text-zinc-300 dark:data-[highlighted]:bg-zinc-900 dark:data-[selected]:text-violet-300"
                  >
                    <span class="grid size-4 place-items-center text-violet-600 dark:text-violet-400">
                      {#if item.value === value}<Check class="size-3.5" strokeWidth={2.2} />{/if}
                    </span>
                    <span>{item.label}</span>
                    <span class="ml-auto text-[10px] text-zinc-400">{item.short}</span>
                  </Select.Item>
                {/each}
              </Select.Viewport>
            </div>
          </div>
        {/if}
      {/snippet}
    </Select.Content>
  </Select.Portal>
</Select.Root>
