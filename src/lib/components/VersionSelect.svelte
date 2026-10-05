<script lang="ts">
  import { Select } from 'bits-ui';
  import { Check, ChevronDown, GitBranch } from '@lucide/svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import siteConfig from '$lib/generated/site-config.json';

  const items = siteConfig.versions.map((item) => ({
    value: item.id,
    label: item.label,
    description: item.description
  }));

  let value = $derived($page.params.version ?? siteConfig.site.defaultVersion);

  function change(next: string) {
    if (!next || next === value) return;
    const current = $page.url.pathname;
    const lang = $page.params.lang ?? siteConfig.site.defaultLanguage;
    const version = $page.params.version ?? siteConfig.site.defaultVersion;

    if ($page.params.version) {
      goto(current.replace(`/${lang}/${version}/`, `/${lang}/${next}/`));
      return;
    }

    goto(`${base}/${lang}/${next}/`);
  }
</script>

<Select.Root type="single" value={value} onValueChange={(next) => next && change(String(next))} items={items}>
  <Select.Trigger
    aria-label="Documentation version"
    class="group flex h-8 min-w-[86px] items-center gap-2 rounded-md border border-zinc-200/80 bg-white px-2.5 text-[12px] font-medium text-zinc-700 shadow-sm outline-none transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-violet-500/25 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
  >
    <GitBranch class="size-3.5 text-zinc-400" strokeWidth={1.8} />
    <span>{items.find((item) => item.value === value)?.label ?? value}</span>
    <ChevronDown class="ml-auto size-3 text-zinc-400 transition-transform duration-150 group-data-[state=open]:rotate-180" strokeWidth={1.8} />
  </Select.Trigger>

  <Select.Portal>
    <Select.Content
      sideOffset={6}
      class="z-[100] min-w-[190px] rounded-lg border border-zinc-200 bg-white p-1 shadow-xl shadow-black/10 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/35"
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
                    class="flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-zinc-700 outline-none data-[highlighted]:bg-zinc-100 dark:text-zinc-300 dark:data-[highlighted]:bg-zinc-900"
                  >
                    <span class="grid size-4 place-items-center text-violet-600 dark:text-violet-400">
                      {#if item.value === value}<Check class="size-3.5" strokeWidth={2.2} />{/if}
                    </span>
                    <span class="min-w-0">
                      <span class="block text-[12px] font-medium">{item.label}</span>
                      {#if item.description}<span class="block text-[10px] font-normal text-zinc-400">{item.description}</span>{/if}
                    </span>
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
