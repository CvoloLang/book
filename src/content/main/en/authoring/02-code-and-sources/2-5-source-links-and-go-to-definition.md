# 2.5 Source links and Go To Definition

Sometimes documentation needs to show more than the public behavior of a type or function. For Base SDK, `System`, compiler-known attributes, and technical sections, it can be useful to give readers a quick path to the actual implementation. Cvolo Docs supports several levels of source navigation: an inline source link, a **Source** button for an entire code block, and manual Go To Definition for individual expressions inside code.

All source links are defined explicitly by the article author. Cvolo Docs does not try to determine automatically which file names such as `Result`, `Type`, or `Console` refer to. This keeps navigation predictable even when the same names appear in different modules.

## Inline source link

If the text mentions a specific file, use a regular Markdown link with the `source:` prefix in its destination:

```markdown
[`Result.cvl`](source:libraries/Base/Result.cvl)
```

In the documentation web interface, this link opens the built-in source viewer:

[`Result.cvl`](source:libraries/Base/Result.cvl)

The link also keeps a GitHub fallback, so it continues to work without client-side JavaScript.

Use an inline source link when the sentence refers specifically to a file or implementation. Avoid turning every term into a link: too many interactive elements make the text harder to read.

The path after `source:` is resolved relative to the compiler repository configured as `compiler` in `config/book.toml`.

## Source for a code block

If the entire example belongs to one source file, add the `source="..."` attribute after the code block language:

````markdown
```cvolo source="libraries/Base/Result.cvl"
public union Result<T, E> {
    T Ok;
    E Err;
}
```
````

A **Source** button appears in the toolbar next to Copy:

```cvolo source="libraries/Base/Result.cvl"
public union Result<T, E> {
    T Ok;
    E Err;
}
```

This works well for fragments where the whole block comes from one file. Readers see the short example in the article and can open the full implementation when needed.

The `source` attribute does not synchronize the contents of the code block with the file on GitHub. It only defines a link to the source file, so keeping the shown fragment up to date remains the responsibility of the article author.

## Manual Go To Definition

Go To Definition solves a different problem: it connects a **specific expression inside a code block** to a source file and lets readers open its definition directly from the example.

In the normal state, the expression remains part of the highlighted code. The interaction appears only on hover, so the example does not turn into a collection of permanently underlined links.

This is useful for expressions such as `[Result]`, `Result`, `Option`, `Console`, and other APIs whose implementation a reader may want to inspect directly from an example.

### Project-wide rules

Shared definitions are configured in `config/go-to-definition.html`:

```html
<GoToDefinition Global="True">
  <Expression Source="libraries/Base/Result.cvl" Value="Result" />
  <Expression Source="libraries/Base/Attributes/ResultAttribute.cvl" Value="[Result]" />
</GoToDefinition>
```

The `<GoToDefinition>` element contains one or more `<Expression>` rules. Each rule maps the value in `Value` to the file specified by `Source`.

Rules from `config/go-to-definition.html` apply to every page in the project. The `Global="True"` attribute can still be kept in this file for consistency, but the file itself already defines project-wide rules.

Do not add every possible language symbol here. Keep the global set small and limited to stable, unambiguous expressions that appear regularly throughout the documentation.

## Rules for one page

If a mapping is needed only in one article, the directive can be written directly in the Markdown file:

```html
<GoToDefinition Global="True">
  <Expression Source="libraries/System/Console.cvl" Value="Console" />
</GoToDefinition>
```

The build system treats it as metadata, so the directive itself is not displayed in the article.

With `Global="True"`, the rules from that directive apply to every code block in the current Markdown file, regardless of where the directive appears. This is useful when the whole page is about one API and the same expression appears in several examples.

## Rule for only the next code block

With `Global="False"`, the rules from the directive apply only to the next fenced code block. Use this for an ambiguous name or a local example where the mapping should not affect the rest of the page.

For example:

~~~markdown
<GoToDefinition Global="False">
  <Expression Source="libraries/Base/Result.cvl" Value="Result" />
</GoToDefinition>

```cvolo
Result<int, ParseError> Parse(string text) {
    // ...
}
```
~~~

The directive itself is not displayed on the page. Before the example, you can immediately tell the reader that `Result` supports navigation to its definition:

Hover over `Result` to open its source definition.

<GoToDefinition Global="False">
  <Expression Source="libraries/Base/Result.cvl" Value="Result" />
</GoToDefinition>

```cvolo
Result<int, ParseError> Parse(string text) {
    // ...
}
```

## How expressions are matched

Matching is case-sensitive: `Result` and `result` are different values.

For expressions that begin or end with an identifier character, identifier boundaries are respected. A rule for `Result` therefore does not accidentally turn the `Result` part of `LoadResult` into a link.

If rules overlap, the more specific expression takes priority. For example, if both `Result` and `[Result]` are defined, the full `[Result]` attribute is selected inside `[Result]`.

For that reason, `Value` should contain the exact fragment the reader should treat as one semantic reference.

## Disabling project-wide rules

If a global rule has the wrong meaning in a particular article, add this directive near the beginning of the Markdown file:

```html
<DisableGlobalGoToDefinition />
```

This disables the rules from `config/go-to-definition.html` for that page. Local `<GoToDefinition>` directives in the same page continue to work.

This is useful in advanced sections where a familiar name refers to an internal compiler type rather than a public SDK symbol.

Choose the simplest navigation level that solves the problem: inline `source:` for a link in prose, `source="..."` for an entire block, and Go To Definition only when navigation from a specific expression genuinely helps readers understand the code.
