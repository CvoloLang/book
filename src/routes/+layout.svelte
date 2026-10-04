<script lang="ts">
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  import SearchDialog from '$lib/components/SearchDialog.svelte';

  let { children } = $props();
  let searchOpen = $state(false);

  function globalShortcut(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
    if (!typing && (event.key === '/' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k'))) {
      event.preventDefault();
      searchOpen = true;
    }
  }
</script>

<svelte:head>
  <meta name="description" content="Cvolo: tutorial, language documentation and formal specification" />
</svelte:head>

<svelte:window onkeydown={globalShortcut} />
<Header onSearch={() => (searchOpen = true)} />
<SearchDialog bind:open={searchOpen} />
{@render children()}
