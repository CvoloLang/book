<script lang="ts">
  import { base } from '$app/paths';
</script>

<svelte:head>
  <title>Cvolo Docs</title>
  <meta name="description" content="Documentation for the Cvolo programming language." />
</svelte:head>

<main>
  <section class="border-b border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950">
    <div class="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center sm:py-28">
      <div class="max-w-3xl">
        <div class="mb-4 text-sm font-semibold text-violet-600 dark:text-violet-400">Cvolo Programming Language</div>
        <h1 class="text-4xl font-bold tracking-[-0.035em] text-zinc-950 sm:text-6xl dark:text-white">Systems programming with explicit semantics and predictable native code.</h1>
        <p class="mt-6 max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">Documentation for the Cvolo language, SDK, and standard library.</p>
      </div>
      <div class="mx-auto grid size-64 place-items-center overflow-hidden rounded-3xl border border-zinc-200 bg-[#15151a] dark:border-zinc-800">
        <img src={`${base}/brand/cvolo-logo.png`} alt="Cvolo logo" class="size-full object-cover" />
      </div>
    </div>
  </section>
</main>
