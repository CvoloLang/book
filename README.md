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

## Markdown UI extensions

The public docs stay readable as plain Markdown. A small renderer extension adds richer presentation without requiring MDX or embedded Svelte components.

### Tabbed code blocks

Adjacent fenced code blocks that declare `tab="..."` are rendered as one tabbed example:

````markdown
```json tab="v1/meta.json"
{
  "title": "1.0.0",
  "root": "version"
}
```

```json tab="v2/meta.json"
{
  "title": "2.0.0",
  "root": "version"
}
```
````

The source remains normal fenced Markdown and is still readable on GitHub. Any fenced language supported by the highlighter can be used with `tab=`.

### File trees

Use a `files` fence around an ordinary ASCII tree:

````markdown
```files github="IgorShaposhnikov/Cvolo" ref="master"
libraries/System/
├── Console.cvl
├── Environment.cvl
├── IO/
├── Math/
├── Collections/
├── Text/
├── Threading/
└── ...
```
````

On GitHub this remains a readable tree; on the documentation site folders are collapsible with a short open/close animation. `tree`, `filetree` and `file` are accepted aliases, but `files` is the preferred spelling.

When a tree declares `github="owner/repo"` (and optionally `ref="branch-or-tag"` and `root="path/prefix"`), file rows become clickable. The site derives the repository path from the ASCII tree and opens an on-demand source modal with syntax highlighting, **Copy** and **View on GitHub** actions. Shiki is loaded lazily only when a source file is opened, and the source itself is fetched only on demand; folders and the Markdown source remain fully static.

## Versions

`main` is currently the development documentation version. Stable releases can later be added to `config/versions.toml` and backed by matching content snapshots under `src/content/<version>/...`.

## Future library documentation

External Toolkit/community library documentation is intentionally not part of the first public deployment. The planned model is a reviewed TOML registry in this repository, while each registered library keeps its own Markdown, languages, versions and compiler-compatibility metadata in the library repository. GitHub Actions can fetch those approved repositories during the static site build.
