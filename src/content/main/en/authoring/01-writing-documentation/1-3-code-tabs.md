# 1.3 Code tabs

Some examples are easier to explain by showing several code variants in one place: for example, source syntax and lowering, two versions of an API, or the same idea in different languages. Cvolo Docs combines consecutive fenced blocks with `tab="..."` into a single tabbed component.

The source remains ordinary Markdown, so the examples are easy to read on GitHub and in code review even without the documentation web interface.

## Basic tabs

Add `tab="..."` to the opening fence of each consecutive code block. The `tab` value becomes the tab label.

````markdown
```cvolo tab="Source"
int[5] array = { 1, 2, 3, 4, 5 };

foreach (val item in array) 
{
    Console.WriteLine(item);
}
```

```cvolo tab="Lowered form"
val array = [1, 2, 3, 4, 5];

{
    val int __fe_len0 = 5;
    for (var int __fe_i0 = 0; __fe_i0 < __fe_len0; __fe_i0 = __fe_i0 + 1) {
        val i = x[__fe_i0];
        Console.WriteLine(i);
    }
}
```
````

After rendering, only the selected code block is shown at a time, and the `tab` values are used as the tab labels.

```cvolo tab="Source"
int[5] array = { 1, 2, 3, 4, 5 };

foreach (val item in array) 
{
    Console.WriteLine(item);
}
```

```cvolo tab="Lowered form"
val array = [1, 2, 3, 4, 5];

{
    val int __fe_len0 = 5;
    for (var int __fe_i0 = 0; __fe_i0 < __fe_len0; __fe_i0 = __fe_i0 + 1) {
        val i = x[__fe_i0];
        Console.WriteLine(i);
    }
}
```

Tabs are not specific to Cvolo. Each tab can use its own language and additional attributes such as `lines`, `highlight`, and `source`, as well as Go To Definition rules.

Normal prose ends the current tab group. If several code fences should form one component, keep them consecutive with no text between them.

## Input and output for each tab

Each tab can have its own `input` and `output`. Place them immediately after that tab's code fence, then continue with the next code fence that has `tab="..."`.

For example, the first tab can contain only output, while the second has both input and output:

````markdown
```cvolo tab="Old"
Console.WriteLine("old");
```

```output
old
```

```cvolo tab="New"
val name = Console.ReadLine();
Console.WriteLine(name);
```

```input
Alice
```

```output
Alice
```
````

You do not need to add `tab="..."` to `input` or `output`: these blocks belong to the code fence immediately before them.

In the documentation web interface, this sequence becomes a single tabbed component:

```cvolo tab="Old"
Console.WriteLine("old");
```

```output
old
```

```cvolo tab="New"
val name = Console.ReadLine();
Console.WriteLine(name);
```

```input
Alice
```

```output
Alice
```

When the selected tab changes, its associated input and output panels change together with the code. This keeps the visible `input` and `output` tied to the selected example.

`input` and `output` are optional. A tab can contain:

- code only;
- code with `input`;
- code with `output`;
- code with both `input` and `output`.

```text
code tab
code tab → input
code tab → output
code tab → input → output
```

Use tabs when the blocks are genuine alternatives. If readers need to see several fragments at the same time, or if each fragment needs its own explanation, separate code blocks will usually be clearer.
