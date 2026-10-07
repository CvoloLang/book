# 2.2 Diff and highlighting

There are situations where an article needs to show a small code change immediately or draw the reader's attention to only specific lines and fragments. Cvolo Docs provides several separate mechanisms for this: `diff` and `diff-cvolo` for comparing changes, `highlight` for highlighting whole lines, and `mark` and `mark-range` for highlighting individual fragments within a line.

Diff has two modes. A regular `diff` shows changes in the familiar Git format and does not depend on the source language. `diff-cvolo` is the Cvolo-specific variant: it preserves Cvolo syntax highlighting, while added and removed lines are marked with special comments.

## Regular diff and Cvolo diff

The difference is easiest to see using the same change.

In a regular `diff`, added and removed lines use actual `+` and `-` prefixes:

````markdown
```diff
 public int Sum(int a, int b, int c) {
-    return a + b;
+    return a + b + c;
 }
```

```diff-cvolo
public int Sum(int a, int b, int c) {
    return a + b; // [!code --]
    return a + b + c; // [!code ++]
}
```
````

In `diff-cvolo`, these comments are not part of the displayed code. Cvolo Docs removes them before syntax highlighting and uses them only to style added and removed lines.

```diff Tab="Diff"
 public int Sum(int a, int b, int c) {
-    return a + b;
+    return a + b + c;
 }
```

```diff-cvolo Tab="Diff Cvolo"
public int Sum(int a, int b, int c) {
    return a + b; // [!code --]
    return a + b + c; // [!code ++]
}
```

Use `diff` when you want the familiar comparison view with `+` and `-`. Use `diff-cvolo` when preserving Cvolo syntax highlighting is important.

## Special comments in diff-cvolo

A comment can be placed at the end of the changed line:

```cvolo
oldCall(); // [!code --]
newCall(); // [!code ++]
```

`// [!code --]` marks a line as removed, while `// [!code ++]` marks it as added.

The comment can also be placed on a separate line. In that case, it applies to the next line of code and is not displayed itself:

````markdown
```diff-cvolo
// [!code --]
total = Normalize(total);
// [!code ++]
total = Clamp(total);

var y = y
    + x;
```
````

After processing, the special comment lines disappear:

```diff-cvolo
// [!code --]
total = Normalize(total);
// [!code ++]
total = Clamp(total);

var y = y
    + x;
```

This prevents `diff-cvolo` from conflicting with real `+` and `-` operators. For example, `    + x;` in a multiline expression remains ordinary Cvolo code and is not interpreted as an added line.

When using Copy, the clipboard receives clean Cvolo code without `// [!code ...]`.

## Highlighting whole lines

If an example needs to draw attention to a few specific lines, add `highlight="..."` after the code block language.

The value is a comma-separated list of line numbers and ranges. For example, `highlight="2,4-5"` highlights line 2 and lines 4 through 5. Counting starts at one regardless of whether line numbers are displayed.

For example:

````markdown
```cvolo lines highlight="2,4-5"
var result = Parse(text);
if (result is Ok(value)) {
    Console.WriteLine(value);
} else {
    Console.WriteLine("parse error");
}
```
````

Only the specified lines are highlighted:

```cvolo lines highlight="2,4-5"
var result = Parse(text);
if (result is Ok(value)) {
    Console.WriteLine(value);
} else {
    Console.WriteLine("parse error");
}
```

`highlight` and `lines` are independent: lines can be highlighted without showing line numbers, and line numbers can be shown without highlighting.

The alias `highlight-lines` is also supported for whole-line highlighting, but new articles should prefer `highlight`.

## Highlighting fragments within a line

If you need to highlight a specific word or part of an expression rather than the entire line, use `mark` or `mark-range`.

### Highlighting by text

`mark="..."` highlights every exact match of the specified text. Matching is case-sensitive.

Multiple fragments can be separated with `|`:

````markdown
```cvolo mark="Ok|Err"
public union Result<T, E> {
    T Ok;
    E Err;
}
```
````

Only `Ok` and `Err` are highlighted:

```cvolo mark="Ok|Err"
public union Result<T, E> {
    T Ok;
    E Err;
}
```

`mark` is convenient when the required fragment can be identified unambiguously by its text.

### Highlighting an exact range

If the same sequence of characters appears more than once on a line, or you need to highlight one exact section, use `mark-range`.

The format of one range is:

```text
line:start:end
```

Line numbers start at `1`. The `start` and `end` positions are zero-based, and the `end` position is not included in the highlighted range. Separate multiple ranges with `|`.

For example, the following paths highlight only the `en` and `ru` segments:

````markdown
```text mark-range="1:17:19|2:17:19"
src/content/main/en/book/01-introduction/1-1-hello-world.md
src/content/main/ru/book/01-introduction/1-1-hello-world.md
```
````

Result:

```text mark-range="1:17:19|2:17:19"
src/content/main/en/book/01-introduction/1-1-hello-world.md
src/content/main/ru/book/01-introduction/1-1-hello-world.md
```

Here `mark-range` is useful because it selects the exact position: a plain search for `en` could also match the same character sequence somewhere else on the line.

Use `highlight` for whole lines, `mark` for specific text, and `mark-range` when the exact position of a fragment matters.
