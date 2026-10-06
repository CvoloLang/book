# 1.2 Code blocks, program input, and output

Code examples are a central part of technical documentation. In Cvolo Docs they remain ordinary fenced Markdown blocks, while the site adds syntax highlighting, a language label, Copy, optional line numbers, and dedicated styling for program input and output.

Use the `cvolo` language id for Cvolo code. It tells the renderer to use the Cvolo highlighting grammar. If you use `text`, the content remains monospaced text without language-specific highlighting.

## Basic Cvolo block

A standard fence is enough for a small example:

````markdown
```cvolo
val x = 5;
Console.WriteLine(x);
```
````

On the site it is rendered as:

```cvolo
val x = 5;
Console.WriteLine(x);
```

Cvolo highlighting, the language label, and Copy are added automatically. Authors do not need to add labels such as `Code:` or implement copy UI manually.

The example should not replace the explanation. Use the surrounding prose to say what the code demonstrates and which part deserves attention.

For non-Cvolo examples, use the actual language when possible, such as `toml`, `json`, `html`, `text`, or `markdown`.

## Line numbers

Line numbers are disabled by default. For short examples they usually add visual noise, so enable them only when the article refers to specific lines or a longer example genuinely benefits from positional references.

Add `lines` immediately after the language id in the opening fence:

````markdown
```cvolo lines
var counter = 0;
Console.WriteLine(counter);

counter = counter + 1;
Console.WriteLine(counter);
```
````

The site renders the same code with line numbers:

```cvolo lines
var counter = 0;
Console.WriteLine(counter);

counter = counter + 1;
Console.WriteLine(counter);
```

The numbers are presentation only and do not become part of the source code. Copy also copies the code without line numbers.

The forms `lines=true`, `line-numbers=true`, and `linenumbers=true` are supported aliases, but new articles should normally use the short `lines` form.

Use `lines=false` when line numbers need to be disabled explicitly, for example in generated Markdown.

## Program input and output

For examples with console interaction, a code block can be followed by separate input and output sections. They are written as ordinary adjacent fenced blocks, and the renderer combines them with the code into a single visual example.

Use:

- `input` for data the program receives through standard input;
- `output` for data the program writes to the terminal.

Both blocks are optional. If the program does not read anything, `output` is enough. If only the supplied data matters, `input` can be used on its own.

### Output only

If a program only prints a result, place `output` immediately after the code block:

````markdown
```cvolo
Console.WriteLine("Hello, Cvolo!");
```

```output
Hello, Cvolo!
```
````

On the site, both fences are rendered as one example:

```cvolo
Console.WriteLine("Hello, Cvolo!");
```

```output
Hello, Cvolo!
```

The `output` block belongs to the code block immediately before it. Do not place normal text or another Markdown block between them.

### Input and output together

If a program first receives data from the user and then prints a result, place `input` before `output`.

For example, this program reads a name from standard input and immediately writes it back:

````markdown
```cvolo
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

On the site, all three fences become one example:

```cvolo
val name = Console.ReadLine();
Console.WriteLine(name);
```

```input
Alice
```

```output
Alice
```

This makes the three parts of one run immediately visible: which code is executed, which data is supplied to the program, and which result it prints.

The block order follows program execution:

```text
code → input → output
```

If `input` or `output` is not needed, simply omit that block.

Both of these forms are valid:

```text
code → output
code → input
```

### Rules for input and output blocks

The `input` and `output` blocks must directly follow the code block and each other. Do not insert explanatory prose between them, otherwise the renderer will no longer treat them as parts of the same example.

Place explanations before the complete group or after it.

Put only data actually supplied through standard input in `input`. Put only observable program output in `output`. Do not mix in author comments, shell prompts, or explanatory text.

`stdin` is also supported as an alias for `input`. `stdout` and `result` are supported as aliases for `output`. New documentation should prefer the short `input` and `output` forms.
