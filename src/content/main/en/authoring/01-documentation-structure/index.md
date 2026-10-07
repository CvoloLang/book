# Documentation structure

Cvolo documentation is designed so that authors work with ordinary Markdown files most of the time rather than site components.

A page should remain readable directly on GitHub, while the built site uses the content tree and locale folders to build routes, navigation, and translations.

This chapter covers the documentation structure: where pages live, how chapters list their pages, and how localized files mirror each other.

## Where to start

If you are adding a new page, first decide which section and chapter it belongs to.

What comes next depends on the task:

- for a regular article, a Markdown file with `# H1` and an entry in `chapter.toml` is enough;
- for a translated article, keep the same chapter and page slug in each locale;
- for renderer-specific code features, use the next chapter, "Code and sources".

Renderer-specific features should be used only when they genuinely help the explanation. They do not replace prose: an example should still be understandable without knowing how the site works internally.

## What is covered next

The following topics are covered in this chapter:

- the structure of sections, chapters, and pages;
- documentation localization.

After changing documentation content, it is useful to run:

```bash
npm run docs:build
npm run docs:verify
```

The first command rebuilds the documentation index, while the second checks routes and the content structure. During normal local development, `npm run dev` runs these steps automatically before Vite.
