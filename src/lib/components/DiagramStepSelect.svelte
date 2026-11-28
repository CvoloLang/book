<script lang="ts">
  import { Select } from 'bits-ui';
  import { Check, ChevronDown } from '@lucide/svelte';

  let { select }: { select: HTMLSelectElement } = $props();
  const items = Array.from(select.options, (option) => ({ value: option.value, label: option.text }));
  let value = $state(select.value);

  $effect(() => {
    const sync = () => { value = select.value; };
    select.addEventListener('input', sync);
    return () => select.removeEventListener('input', sync);
  });

  function change(next: string) {
    if (!next || !items.some((item) => item.value === next)) return;
    value = next;
    select.value = next;
    select.dispatchEvent(new Event('input', { bubbles: true }));
  }
</script>

<Select.Root type="single" {value} {items} onValueChange={change}>
  <Select.Trigger aria-label={select.getAttribute('aria-label') ?? 'Step'}
    class="group flex min-h-10 w-full min-w-0 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-left text-sm text-zinc-700 outline-none hover:border-zinc-400 focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
    <span class="min-w-0 flex-1 truncate">{items.find((item) => item.value === value)?.label ?? ''}</span>
    <ChevronDown class="size-4 shrink-0 text-zinc-400 group-data-[state=open]:rotate-180" />
  </Select.Trigger>
  <Select.Portal>
    <Select.Content sideOffset={6} class="z-[100] min-w-[160px] max-w-[calc(100vw-2rem)] rounded-lg border border-zinc-200 bg-white p-1 shadow-xl outline-none dark:border-zinc-700 dark:bg-zinc-950">
      {#snippet child({ wrapperProps, props, open })}
        {#if open}
          <div {...wrapperProps}><div {...props}>
            <Select.Viewport class="flex flex-col gap-0.5">
              {#each items as item}
                <Select.Item value={item.value} label={item.label} class="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 outline-none data-[highlighted]:bg-zinc-100 dark:text-zinc-200 dark:data-[highlighted]:bg-zinc-900">
                  <span class="grid size-4 shrink-0 place-items-center text-violet-600 dark:text-violet-400">{#if item.value === value}<Check class="size-4" />{/if}</span>
                  <span>{item.label}</span>
                </Select.Item>
              {/each}
            </Select.Viewport>
          </div></div>
        {/if}
      {/snippet}
    </Select.Content>
  </Select.Portal>
</Select.Root>
