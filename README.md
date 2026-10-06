# Cvolo Docs

Official documentation site for the Cvolo programming language.

Built with Svelte 5, SvelteKit, Tailwind CSS 4, Bits UI and Shiki. The production site is prerendered as static files and can be deployed to GitHub Pages.

## Start locally

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run docs:build
npm run docs:verify
npm run check
npm run build
```

## Content model

Human-maintained documentation lives in:

```text
src/content/<version>/<language>/<section>/
```

Current public section:

- **Book** — the minimal public Hello World page

Translated pages use language-neutral filenames and routes. For example:

```text
/en/main/docs/book/01-introduction/hello-world/
/ru/main/docs/book/01-introduction/hello-world/
```

Changing the locale therefore changes only the locale segment when the translation exists.

## TOML configuration

Site structure is configured by hand in TOML:

```text
config/
├── book.toml
└── versions.toml
```

`book.toml` owns site metadata, supported languages, top-level documentation sections and the GitHub links shown in the header menu. `versions.toml` owns the documentation versions shown in the version selector.

Do not edit generated JSON by hand. `npm run docs:build` derives navigation, routes, search data and UI configuration from TOML plus Markdown:

```text
src/lib/generated/*.json
static/search-index.json
```

These generated files are intentionally ignored by Git and are recreated before development/build commands run.

GitHub destinations are configured without touching Svelte code. Add or edit `[[github_links]]` entries in `config/book.toml`:

```toml
[[github_links]]
id = "compiler"
url = "https://github.com/IgorShaposhnikov/Cvolo/tree/master"
label_en = "Cvolo compiler"
label_ru = "Компилятор Cvolo"
description = "IgorShaposhnikov/Cvolo"
```

## Code blocks

Fenced Markdown code blocks are normalized before highlighting: surrounding blank lines are removed and common Markdown indentation is dedented while internal Cvolo indentation is preserved. Cvolo highlighting uses the bundled TextMate grammar through Shiki.

## Versions

`main` is currently the development documentation version. Stable releases can later be added to `config/versions.toml` and backed by matching content snapshots under `src/content/<version>/...`.

## Deployment

This repository is the documentation site only. On GitHub Pages it deploys as a project site at:

```text
https://cvololang.github.io/book/
```

The landing/website should live in a separate `CvoloLang/cvololang.github.io` repository, which GitHub Pages serves at:

```text
https://cvololang.github.io/
```

When a custom domain is available, point the landing site at the apex domain and this docs site at a docs subdomain, for example:

```text
https://cvololang.org/
https://docs.cvololang.org/
```

To deploy this repository at a custom docs domain, set the repository variable `DOCS_CUSTOM_DOMAIN` to the desired hostname, for example `docs.cvololang.org`. The Pages workflow will build without the `/book` base path and write the matching `CNAME` file into the static output.

## Full development docs

The broader in-progress documentation set is preserved on the `dev` branch. `master` is intentionally kept small for the first public GitHub Pages deployment.

## Future library documentation

External Toolkit/community library documentation is intentionally not part of the first public deployment. The planned model is a reviewed TOML registry in this repository, while each registered library keeps its own Markdown, languages, versions and compiler-compatibility metadata in the library repository. GitHub Actions can fetch those approved repositories during the static site build.
