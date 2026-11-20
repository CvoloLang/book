# 2.4 Arithmetic operations

An expression evaluates to a value. For example, `2 + 3` evaluates to `5`. In Cvolo, arithmetic expressions are built from numbers, variables, parentheses, and operators.

## Basic operators

| Operator | Operation | Example |
| --- | --- | --- |
| `+` | Addition | `2 + 3` |
| `-` | Subtraction | `7 - 2` |
| `*` | Multiplication | `4 * 3` |
| `/` | Division | `8 / 2` |
| `%` | Remainder | `8 % 3` |

```cvolo
val width = 4;
val height = 3;
val area = width * height; // 12
val perimeter = (width + height) * 2; // 14
```

The values of `width` and `height` do not change: the result of each expression is stored in a new variable.

## Operator precedence

Multiplication and division take precedence over addition and subtraction. Parentheses let you specify a different evaluation order:

```cvolo
val first = 2 + 3 * 4;   // 14
val second = (2 + 3) * 4; // 20
```

In the first expression, `3 * 4` is evaluated first. In the second, the parentheses require `2 + 3` to be evaluated first.

## Remainder

The `%` operator computes the remainder of division:

```cvolo
val remainder = 8 % 3; // 2
```

For these positive integers, `3` fits into `8` twice, leaving a remainder of `2`.

## Operand types

```cvolo
val a = 2;
val b = 3;
val sum = a + b;
```

Both numbers have type `int`, so the result can also be used as an integer. Do not assume that every combination of `int`, `uint`, and `double` is allowed. When operand types differ, the compiler checks which operations and conversions are available.

Next, we'll compare arithmetic results and use those comparisons in conditions.