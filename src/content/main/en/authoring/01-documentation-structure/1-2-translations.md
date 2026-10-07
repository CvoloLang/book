# 1.2 Documentation localization

Localization in Cvolo Docs is built around a shared page structure. The English and Russian versions of the same page use the same relative path and slug, while the Markdown content itself is translated: headings, explanations, and, when needed, textual data in examples.

When switching languages, only the `en` ↔ `ru` segment in the URL changes; the rest of the route stays the same.

## Matching file structure

The same page should use the same relative path in both localizations:

```text mark-range="1:17:19|2:17:19"
src/content/main/en/book/01-introduction/1-1-hello-world.md
src/content/main/ru/book/01-introduction/1-1-hello-world.md
```

Only the `en` ↔ `ru` segment differs in this example; everything after it remains identical.

The filename stem `1-1-hello-world` is used as the page slug, but the visible title does not depend on it. The English file can use `# 1.1 Hello World`, while the Russian file can use `# 1.1 Первая программа`.

Do not create separate names such as `1-1-pervaya-programma.md` only for the Russian version. That breaks the direct relationship between localizations and makes language switching harder to maintain.

## Matching chapter.toml structure

The files are not the only thing that must match: page order should match as well.

For example, if the English chapter contains:

```toml
order = 1
pages = [
    "1-1-hello-world",
    "1-2-building-and-running"
]
```

then the Russian `chapter.toml` should use the same filenames without `.md` and in the same order.

Visible page titles come from the H1 headings in the corresponding Markdown files, so `chapter.toml` does not need to be localized.

This keeps the page order the same in the English and Russian versions of the chapter, even when their headings and content are edited independently.

## How this appears in URLs

Matching relative paths produce matching routes after the language segment:

```text
/en/main/docs/book/01-introduction/1-1-hello-world/
/ru/main/docs/book/01-introduction/1-1-hello-world/
```

Only `en` ↔ `ru` changes in these URLs. The `main` version, `book` section, chapter, and page slug remain the same.

## What should be translated

Translate the content readers see: H1/H2/H3 headings, paragraphs, labels, and, when appropriate, textual data in examples.

Cvolo API names, language keywords, real source paths, and technical identifiers should not be translated. For example, `Console.WriteLine`, `Result<T, E>`, and `libraries/Base/Result.cvl` should stay the same, while the explanation of their behavior is written in the language of the page.

## Adding a new page

When adding a localized page, use the same sequence for both languages:

1. Create the Markdown file at the required relative path in one localization.
2. Create the same path in the other localization.
3. Add the same filename without `.md` to both `chapter.toml` files.
4. Write a localized H1 and content for each Markdown file.
5. Run `npm run docs:build` and `npm run docs:verify`.

If the full translation is not ready yet, it is better to leave an explicit translation task than to invent a different path or move the page elsewhere. The documentation structure should remain shared.

## Checking links between pages

Internal links should also follow the shared logical structure of the documentation instead of creating a separate architecture for each language.

The more stable the slugs are, the easier it is to maintain cross-references, the search index, and the language switcher as the documentation grows.

The main localization rule in Cvolo Docs is simple: **translate the content, not the identity of the page**.
