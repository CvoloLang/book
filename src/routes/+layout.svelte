<script lang="ts">
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  let { children } = $props();
</script>

<svelte:head>
  <meta name="description" content="Cvolo documentation" />
</svelte:head>

<Header onSearch={() => {}} />
{@render children()}
