# 2.4 File trees

When an article explains repository structure or where libraries live, a regular `text` block technically works, but it does not communicate hierarchy very well. For these examples, use a fenced block with the `files` identifier: Cvolo Docs renders it as an interactive tree with file and folder icons, and directories can be expanded and collapsed.

The source remains ordinary readable Markdown. A folder is marked with a trailing `/`, while nesting is expressed with the familiar `├──` / `└──` branches and indentation.

## Basic tree

Put `files` after the opening backticks:

````markdown
```files
libraries/System/
├── Console.cvl
├── Environment.cvl
├── IO/
├── Math/
└── Threading/
```
````

In the documentation web interface, the block is rendered as an interactive tree:

```files
libraries/System/
├── Console.cvl
├── Environment.cvl
├── IO/
├── Math/
└── Threading/
```

Use a file tree when the hierarchy itself matters to the explanation. If you only need to mention a single path, inline code such as `libraries/System/Console.cvl` is simpler.

The aliases `file`, `filetree`, and `tree` are also supported, but new documentation should consistently use `files`.

## Tree with source links

Files in the tree can be linked to real files on GitHub and opened in the built-in source viewer. Add `github` to the opening fence, and if you need a specific branch, tag, or commit, add `ref`.

For example:

````markdown
```files github="IgorShaposhnikov/Cvolo" ref="master"
libraries/
├── Base/
│   ├── Option.cvl
│   └── Result.cvl
└── System/
    └── Console.cvl
```
````

In the documentation web interface, folders still expand and collapse, while files become links to their sources:

```files github="IgorShaposhnikov/Cvolo" ref="master"
libraries/
├── Base/
│   ├── Option.cvl
│   └── Result.cvl
└── System/
    └── Console.cvl
```

The attribute `github` uses the `owner/repository` form.

The attribute `ref` can point to more than a branch: it can also reference a tag or a specific commit. For example, `ref="master"` uses the `master` branch, while `ref="v0.5.0"` can point to a release tag.

If `ref` is omitted, `main` is used by default, so for the Cvolo repository with its `master` branch it is better to specify it explicitly.

## The root parameter

Sometimes an article needs to show only a small part of a larger directory while preserving the full source path when a file is opened. Use `root` for that.

For example, you can show only the contents of `System/`:

````markdown
```files github="IgorShaposhnikov/Cvolo" ref="master" root="libraries/System"
System/
├── Console.cvl
└── Environment.cvl
```
````

In the documentation web interface, readers see the compact tree:

```files github="IgorShaposhnikov/Cvolo" ref="master" root="libraries/System"
System/
├── Console.cvl
└── Environment.cvl
```

The file links still resolve to the real paths `libraries/System/Console.cvl` and `libraries/System/Environment.cvl`.

The attribute `root` does not add visible lines to the tree. It only prefixes the path used when opening a file.
