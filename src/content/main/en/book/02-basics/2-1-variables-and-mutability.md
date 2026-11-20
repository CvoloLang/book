# 2.1 Variables and mutability

In Cvolo, variables can be **immutable** (`val`) or **mutable** (`var`). Mutability determines whether a variable can be assigned a new value after initialization. In both cases, the compiler can infer the variable's type from its initial value.

```cvolo
val title = "Hello, Cvolo!";
var attempts = 0;
val ratio = 1.5;
var isReady = false;
```

These declarations contain a string, an integer, a floating-point number, and a Boolean value. Their types are not specified explicitly - we'll explore these types in the next article.

## Declaration and initialization

A declaration with type inference consists of the `val` or `var` keyword, a variable name, and an expression that provides its initial value. The statement ends with a semicolon.

```cvolo
val start = 10;
var current = start;
```

The variable `start` is initialized to `10`, while `current` is initialized to the value of `start`. The compiler infers `int` as the type of both variables.

## `val` - Immutable variables

The `val` keyword declares an **immutable variable**. Once initialized, it cannot be assigned a new value. Attempting to reassign it results in a compilation error.

```cvolo tab="Valid code" lines
val points = 2;
val nextPoints = points + 1;
```

```cvolo tab="Invalid code" lines highlight="2"
val points = 2;
points = 3;
```

In the second example, the compiler rejects **line 2**: `points` was declared with `val`, so assigning it a new value is not allowed. You can still use `points` in expressions and initialize other variables from its value.

Immutability does not mean that the initial value must be known at compile time. The restriction applies to changing the variable after initialization.

## `var` - Mutable variables

The `var` keyword declares a **mutable variable**. Its value can be changed while the program runs, provided the assigned value is compatible with the variable's type.

```cvolo
var attempts = 0;
attempts = attempts + 1;

var greeting = "Hello";
greeting = "Hello, Cvolo!";

var isReady = false;
isReady = true;
```

Here, three variables of different types are changed: an integer, a string, and a Boolean. Their types remain the same.

## Type inference

When a variable is declared with `val` or `var`, the compiler infers its type from the initializer expression. Mutability does not affect the variable's type: `var` permits new assignments but does not allow the variable's type to change arbitrarily.

```cvolo tab="Compatible type" lines
var count = 2;
count = 3;
```

```cvolo tab="Incompatible type" lines highlight="2"
var count = 2;
count = "three";
```

In the second example, **line 2** is invalid: `count` has type `int`, but the assigned value is a string. The compiler reports a type mismatch even though `count` was declared with `var`.

Use `val` for variables that should remain immutable, and `var` when their values need to change. The next article introduces Cvolo's built-in types and their characteristics.