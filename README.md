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

Current public sections are:

- **Book** — chapter-by-chapter tutorial
- **Advanced** — lowering, compiler model and detailed semantics
- **Base** — the always-available SDK layer
- **Std / System** — hosted standard-library documentation

Translated pages use language-neutral filenames and routes. For example:

```text
/en/main/docs/book/01-introduction/1-1-hello-world/
/ru/main/docs/book/01-introduction/1-1-hello-world/
```

Changing the locale therefore changes only the locale segment when the translation exists.

## TOML configuration

Site structure is configured by hand in TOML:

```text
config/
├── book.toml
└── versions.toml
```

`book.toml` owns site metadata, supported languages and the top-level documentation sections. `versions.toml` owns the documentation versions shown in the version selector.

Do not edit generated JSON by hand. `npm run docs:build` derives navigation, routes, search data and UI configuration from TOML plus Markdown:

```text
src/lib/generated/*.json
static/search-index.json
```

These generated files are intentionally ignored by Git and are recreated before development/build commands run.

## Code blocks

Fenced Markdown code blocks are normalized before highlighting: surrounding blank lines are removed and common Markdown indentation is dedented while internal Cvolo indentation is preserved. Cvolo highlighting uses the bundled TextMate grammar through Shiki.

## Versions

`main` is currently the development documentation version. Stable releases can later be added to `config/versions.toml` and backed by matching content snapshots under `src/content/<version>/...`.

## Future library documentation

External Toolkit/community library documentation is intentionally not part of the first public deployment. The planned model is a reviewed TOML registry in this repository, while each registered library keeps its own Markdown, languages, versions and compiler-compatibility metadata in the library repository. GitHub Actions can fetch those approved repositories during the static site build.
