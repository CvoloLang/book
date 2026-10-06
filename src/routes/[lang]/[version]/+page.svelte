<script lang="ts">
  import { page } from '$app/stores';
  import Landing from '$lib/components/Landing.svelte';
  import siteConfig from '$lib/generated/site-config.json';

  let language = $derived($page.params.lang ?? siteConfig.site.defaultLanguage);
  let version = $derived($page.params.version ?? siteConfig.site.defaultVersion);
</script>

<svelte:head>
  <title>{siteConfig.site.title}</title>
  <meta name="description" content="Cvolo documentation: Book, Advanced, Base SDK, and standard library." />
</svelte:head>

<Landing {language} {version} />
