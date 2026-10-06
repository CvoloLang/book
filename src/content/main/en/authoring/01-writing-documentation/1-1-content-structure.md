# 1.1 Content structure

Cvolo documentation is built from files and directories. This is intentional: authors do not need to describe the navigation tree manually in Svelte components or maintain a separate list of pages.

If a file is placed in the correct directory and registered in `chapter.toml`, the documentation builder automatically creates its route, breadcrumbs, Previous/Next links, and an entry in the sidebar navigation.

A full article path is easiest to read from left to right:

```text
src/content/<version>/<language>/<section>/<chapter>/<page>.md
```

For example:

```text
src/content/main/en/book/01-introduction/1-1-hello-world.md
```

This path means:

- `main` - documentation version (GitHub branch);
- `en` - language;
- `book` - top-level section;
- `01-introduction` - chapter;
- `1-1-hello-world` - individual page.

Top-level sections such as `book` and `authoring` are defined in `config/book.toml`. Inside each section, the documentation structure is determined by directories, `chapter.toml`, and Markdown files.

## Folder = chapter

Each chapter directory usually contains three kinds of files:

- `chapter.toml` - the order of the chapter and its pages;
- `index.md` - the chapter introduction page;
- other `.md` files - individual pages in the chapter.

For example:

```files
src/content/main/en/book/
└── 01-introduction/
    ├── chapter.toml
    ├── index.md
    └── 1-1-hello-world.md
```

`01-introduction/` is the chapter itself.

It is best to treat the directory name as a stable technical identifier. It is part of the URL and should match across localizations.

The visible chapter title does not come from the folder name. Instead, it is taken from the first `# H1` in `index.md`. This means the technical directory can remain `01-introduction`, while the user sees:

```text tab="English version"
Chapter 1. Getting started
```

```text tab="Russian version"
Глава 1. Начало работы
```

## Why `chapter.toml` is needed

The file system tells the builder which pages exist, but the order of files on disk should not determine the order of chapters or their contents.

That is why each chapter has a `chapter.toml` file. A minimal version looks like this:

```toml
order = 1
pages = ["1-1-hello-world"]
```

- `order` - sets the chapter position relative to other chapters in the current section.
- `pages` - sets the order of Markdown files inside the chapter. File names are specified without the `.md` extension.

If a second page is added later, the list can be extended:

```toml
order = 1
pages = [
    "1-1-hello-world",
    "1-2-building-and-running"
]
```

This keeps the documentation order explicit and predictable instead of depending on how an editor or file system sorts files.

If a page is listed in `pages` but the corresponding file or directory does not exist, `docs:verify` should treat the structure as invalid.

## Why `index.md` is needed

`index.md` is the introduction page of a chapter.

It should explain:

- what the chapter is about;
- what problem it solves;
- what the reader will learn next.

The first `# H1` in `index.md` becomes the visible chapter title.

For example, the directory stays the same:

```text
01-introduction/
```

But localized `index.md` files can start differently.

```text tab="English version"
Chapter 1. Getting started
```

```text tab="Russian version"
Глава 1. Начало работы
```

A good `index.md` usually contains a few paragraphs of context, but does not try to repeat the chapter navigation manually. The list of child pages is generated automatically from the file structure and `chapter.toml`.

## Regular page

Every other `.md` file inside a chapter represents an independent documentation page.

For example:

```text
1-1-hello-world.md
```

The first `# H1` becomes the page title and is used in navigation.

The content can look like this:

```markdown
# 1.1 Hello World

A short introduction to the page.

## First program

Section text.

## What happens

Section text.
```

In the left navigation, this remains a single page:

```text
1.1 Hello World
```

Second-level and deeper headings belong to the structure of the current article and appear in the right-side **On this page** block:

```text
First program
What happens
```

In other words, `##` and `###` do not create new documentation pages.

Do not split a short article into several files just to create subheadings. At the same time, a single page should not become an enormous chapter if the topics are genuinely independent.

## File names and stable URLs

Directory names and Markdown file names are part of the URL, so it is best to treat them as stable identifiers.

An article title can be corrected or translated without changing its slug.

For example, the same logical page in EN and RU should have the same relative path:

```text
src/content/main/en/book/01-introduction/1-1-hello-world.md
src/content/main/ru/book/01-introduction/1-1-hello-world.md
```

Only the language segment changes:

```text mark-range="1:17:19|2:17:19"
src/content/main/en/book/01-introduction/1-1-hello-world.md
src/content/main/ru/book/01-introduction/1-1-hello-world.md
```

Everything after it stays the same:

```text
book/01-introduction/1-1-hello-world.md
```

This allows the language switcher to open the equivalent page in another localization without trying to guess a translated file name.

Practical rule: if a new page exists in both EN and RU, use the same relative path and the same slug in both `chapter.toml` files.

Page content can be translated independently, but the localization structure should not drift apart accidentally.
