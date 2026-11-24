# 🦅 Cvolo Documentation

[![Documentation](https://img.shields.io/badge/Documentation-Read_Online-007ACC?logo=readthedocs)](https://cvololang.github.io/book/)
[![Svelte 5](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte)](https://svelte.dev/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2-FF3E00?logo=svelte)](https://svelte.dev/docs/kit)
[![GitHub Pages](https://img.shields.io/badge/Deployment-GitHub_Pages-222222?logo=github)](https://cvololang.github.io/book/)

**Cvolo Docs** is the official documentation website for the [Cvolo programming language](https://github.com/IgorShaposhnikov/Cvolo). It provides a versioned guide to the language, examples written in Cvolo, and reference material for documentation contributors.

## 🌍 Supported Languages

Select a language to browse its complete localization directory:

| Language | Native name |
| --- | --- |
| [English](src/content/main/en/) | English |
| [Russian](src/content/main/ru/) | Русский |

---

> [!NOTE]
> The `main` documentation version currently describes the language under active development. The compiler and the documentation may evolve together.

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 22.12 or later
- npm

### Run locally

```bash
git clone https://github.com/CvoloLang/book.git
cd book
npm ci
npm run dev
```

### Build and validate

```bash
npm run docs:build
npm run docs:verify
npm run check
npm run build
```

`docs:build` generates the navigation, routes, and search index from the source content. `docs:verify` checks the generated documentation model; `check` runs Svelte and TypeScript checks; `build` produces the static website.

---

## 🗂 Documentation Structure

Documentation content is maintained in Markdown, organized by version, language, and section:

```text
src/content/
└── <version>/
    └── <language>/
        ├── book/
        └── authoring/

config/
├── book.toml
└── versions.toml
```

- **`book/`** contains the language tutorial, organized into numbered chapters.
- **`authoring/`** explains how to write and format documentation.
- **`config/book.toml`** defines site metadata, languages, sections, and header links.
- **`config/versions.toml`** defines the documentation versions available in the version selector.
- **`chapter.toml`** files define page order within individual chapters.

Translated pages share language-neutral filenames. For example, every available translation of `4-4-composition.md` uses the path:

```text
src/content/main/<language>/book/04-types/4-4-composition.md
```

Switching languages preserves the current page whenever a translation exists.

---

## ✍️ Contributing

Contributions, corrections, and translations are welcome.

1. Edit the Markdown source under `src/content/`.
2. Keep available translations in sync when editing a page.
3. Add new pages to the corresponding `chapter.toml` file for each available translation.
4. Run `npm run docs:verify` and `npm run check` before submitting a pull request.

See the **Authoring** section on the [documentation website](https://cvololang.github.io/book/) for examples of code tabs, highlighting, diffs, and other supported formatting.

Do not edit generated files under `src/lib/generated/` or `static/search-index.json` by hand. They are regenerated from the source Markdown and TOML configuration.

---

## 🌐 Deployment

The documentation website is published through GitHub Pages:

**https://cvololang.github.io/book/**

The [Pages workflow](.github/workflows/pages.yml) builds and deploys the static site when changes are pushed to `master`.

For a custom domain, set the repository variable `DOCS_CUSTOM_DOMAIN` to the desired hostname. The workflow will remove the `/book` base path and generate the matching `CNAME`.

---

## 🔗 Related Project

- **[Cvolo Compiler](https://github.com/IgorShaposhnikov/Cvolo)** - source code and development of the programming language.
