# 2.3 Literals

A literal is a value written directly in source code. For example, in `val count = 3;`, the number `3` is a literal. The compiler can determine its type from the way the literal is written.

## Integer literals

When inferring a type, an ordinary decimal integer literal without a suffix has type `int`:

```cvolo
val x = 0;
val count = 25;
val temperature = -4;
```

The language specification defines suffixes for other integer types:

| Literal | Inferred type |
| --- | --- |
| `42` | `int` |
| `42U` | `uint` |
| `42L` | `long` |
| `42UL` | `ulong` |

```cvolo
val size = 42U;
val distance = 1000L;
val capacity = 1000UL;
```

Suffix letters can also be lowercase. For an unsigned `long`, both `UL` and `LU` combinations are supported.

## Floating-point literals

Floating-point literals in Cvolo can have type `float` or `double`. If no suffix is specified, the compiler selects `double`.

| Literal | Type |
| --- | --- |
| `2.5` | `double` |
| `2.5f` | `float` |
| `2.5F` | `float` |
| `2.5d` | `double` |

```cvolo
val price = 2.5;          // double
val opacity = 0.75f;     // float
var position = 1.25f;    // float
position = 2.50f;
```

The `f` suffix is especially important when working with functions that accept `float`, such as those in graphics APIs. The literal `0.75` has type `double`, while `0.75f` has type `float`.

Not every decimal fraction can be represented exactly in binary floating-point format. This applies to both `float` and `double`, although `double` provides greater precision.

## Boolean and string literals

The `bool` type has two literals: `true` and `false`. A string literal is enclosed in double quotes.

```cvolo
val ready = true;
val finished = false;
val text = "Hello, Cvolo!";
```

The number `1` is not a substitute for `true`. The compiler checks value types.

## Character literals

A character literal is enclosed in single quotes and has type `char`:

```cvolo
char initial = 'C';
char newline = '\n';
```

In Cvolo, `char` occupies 8 bits. Escape sequences are used for special characters, such as `\n` for a newline. Unlike `string`, a character literal represents a single byte.

## Literals and variable names

Compare the following declarations:

```cvolo
val a = 2;
val b = a;
```

`2` is a literal, while `a` is the name of a previously declared variable. The value on the right side of `=` can be an expression, not just a literal. We'll examine how expressions are evaluated next.

Special string forms, alternate numeral systems, and additional escaping rules are intentionally not covered here: their current syntax still needs to be verified against the compiler implementation.