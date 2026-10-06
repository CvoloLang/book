<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import Header from '$lib/components/Header.svelte';
  import SearchDialog from '$lib/components/SearchDialog.svelte';
  import siteConfig from '$lib/generated/site-config.json';
  import { t } from '$lib/i18n';

  let { children } = $props();
  let searchOpen = $state(false);
  let lang = $derived($page.params.lang ?? siteConfig.site.defaultLanguage);

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
  <meta name="description" content={t(lang, 'layout.metaDescription')} />
</svelte:head>

<svelte:window onkeydown={globalShortcut} />
<Header onSearch={() => (searchOpen = true)} />
<SearchDialog bind:open={searchOpen} />
{@render children()}
