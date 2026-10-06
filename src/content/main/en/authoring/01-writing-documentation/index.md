# How to write Cvolo documentation

Cvolo documentation is designed so that authors work with ordinary Markdown files most of the time rather than site components.

A page should remain readable directly on GitHub, while the built site gives Markdown additional capabilities: Cvolo syntax highlighting, combined code + output blocks, tabs, interactive file trees, source browsing, and manual Go To Definition.

This section describes the authoring workflow: how to organize content, how to format examples, and when to use renderer features.

## Where to start

If you are adding a new page, first decide which section and chapter it belongs to.

What comes next depends on the task:

- for a regular article, a Markdown file with `# H1` and an entry in `chapter.toml` is enough;
- for examples with output, use `output`;
- for alternative variants, use `tab`;
- for project structure, use `files`;
- for source links, use `source` and `GoToDefinition`.

Renderer-specific features should be used only when they genuinely help the explanation. They do not replace prose: an example should still be understandable without knowing how the site works internally.

## What is covered next

The following topics are covered in order:

- the structure of sections, chapters, and pages;
- code blocks and program output;
- tabs;
- file trees;
- source links;
- Go To Definition;
- documentation localization;
- comparing code changes;
- highlighting lines and individual code fragments.

After changing documentation content, it is useful to run:

```bash
npm run docs:build
npm run docs:verify
```

The first command rebuilds the documentation index, while the second checks routes and the content structure. During normal local development, `npm run dev` runs these steps automatically before Vite.
