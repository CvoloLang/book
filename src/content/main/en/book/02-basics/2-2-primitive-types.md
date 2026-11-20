# 2.2 Built-in types

Every value in Cvolo has a type. The type determines what data a variable can hold and which operations can be performed on it. The compiler checks types regardless of whether a variable is declared with `val` or `var`.

Cvolo provides the following built-in types and special language constructs:

| Category | Types |
| --- | --- |
| Signed integers | `sbyte`, `short`, `int`, `long`, `nint` |
| Unsigned integers | `byte`, `ushort`, `uint`, `ulong`, `nuint` |
| Floating-point numbers | `float`, `double` |
| Boolean values | `bool` |
| Characters and strings | `char`, `string` |
| Special constructs | `void`, `null` |

`void` and `null` serve special purposes. Unlike `int`, `bool`, or `string`, they are not used to store ordinary values.

## Type inference

If a declaration does not specify a type, the compiler infers it from the initializer expression:

```cvolo
val count = 2;                 // int
var ratio = 1.5;               // double
val enabled = true;            // bool
val greeting = "Hello, Cvolo!"; // string
```

Type inference takes place at compile time. `var` allows a variable's value to change, but it does not make the variable dynamically typed.

## Explicit type declarations

You can specify the type directly in a declaration:

```cvolo
int count = 2;
var int attempts = 3;
```

Both variables have type `int`. `count` is immutable by default, while `attempts` is declared mutable with `var`. **Type** and **mutability** are independent properties of a declaration.

| Declaration | How the type is determined | Mutability |
| --- | --- | --- |
| `val x = 2;` | Inferred from the expression | Immutable |
| `var x = 2;` | Inferred from the expression | Mutable |
| `int x = 2;` | Explicitly specified | Immutable |
| `var int x = 2;` | Explicitly specified | Mutable |

## Integer types

Integer types differ in bit width and the range of values they can represent. The following table is ordered by increasing maximum value. Both endpoints of each range are inclusive.

| Type | Bit width | Value range |
| --- | --- | --- |
| `sbyte` | 8 bits | -128 to 127 |
| `byte` | 8 bits | 0 to 255 |
| `short` | 16 bits | -32,768 to 32,767 |
| `ushort` | 16 bits | 0 to 65,535 |
| `int` | 32 bits | -2,147,483,648 to 2,147,483,647 |
| `uint` | 32 bits | 0 to 4,294,967,295 |
| `long` | 64 bits | -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807 |
| `ulong` | 64 bits | 0 to 18,446,744,073,709,551,615 |

```cvolo
int temperature = -10;
uint items = 12U;
long distance = 100000L;
```

The `U` and `L` suffixes let you explicitly select `uint` or `long`. Their syntax is covered in the next article.

## Floating-point types

Cvolo provides two types for representing floating-point numbers:

| Type | Size | Precision |
| --- | --- | --- |
| `float` | 32 bits | Single precision |
| `double` | 64 bits | Double precision |

```cvolo
float red = 0.25f;
float green = 0.50f;
float blue = 0.75f;

val opacity = 1.0f;     // float
val temperature = 22.5; // double
```

The `f` suffix specifies a `float` literal. Without the suffix, a floating-point literal has type `double`. The distinction matters, for example, when passing values to graphics APIs: many OpenGL functions accept 32-bit floating-point numbers.

## Boolean values, characters, and strings

| Type | Purpose |
| --- | --- |
| `bool` | A Boolean value: `true` or `false` |
| `char` | A single 8-bit character (byte) |
| `string` | Text encoded in UTF-8 |

```cvolo
val success = true;
char initial = 'C';
val message = "Hello, Cvolo!";
```

A `char` represents a single byte, not an arbitrary Unicode character. A sequence of characters should be stored in a `string`. Character and string literal syntax is covered in the next article.

## Type compatibility

Once a variable is declared, its type is fixed. Mutability permits assigning another **compatible value**, but does not allow the variable's type to change arbitrarily:

```cvolo tab="Valid"
var points = 2;
points = 3;
```

```cvolo tab="Incompatible type" lines highlight="2"
var points = 2;
points = "three"; // ERROR: string is incompatible with int
```

## Native-sized integers

The `nint` (signed) and `nuint` (unsigned) types differ from `int` and `uint` because their size depends on the **target architecture** for which the program is compiled.

Their bit width determines their range of representable values:

| Type | Target architecture | Bit width | Value range |
| --- | --- | --- | --- |
| `nint` | x86 | 32 bits | -2,147,483,648 to 2,147,483,647 |
| `nuint` | x86 | 32 bits | 0 to 4,294,967,295 |
| `nint` | x64 | 64 bits | -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807 |
| `nuint` | x64 | 64 bits | 0 to 18,446,744,073,709,551,615 |

For comparison, here are the sizes of `int` and the native-sized integer types:

| Target architecture | `int` | `nint` | `nuint` |
| --- | --- | --- | --- |
| x86 (32-bit) | 4 bytes | 4 bytes | 4 bytes |
| x64 (64-bit) | 4 bytes | 8 bytes | 8 bytes |

You can obtain a type's size using `sizeof<T>()`:

```cvolo
nuint integerSize = sizeof<int>();      // 4 bytes on x86 and x64
nuint nativeSize = sizeof<nint>();      // 4 bytes on x86, 8 bytes on x64
nuint unsignedSize = sizeof<nuint>();   // 4 bytes on x86, 8 bytes on x64
```

All three expressions return a value of type `nuint`. The size depends on the **compiled program's target architecture**, not simply on the bitness of the installed operating system. For example, a 32-bit program running on a 64-bit system uses 32-bit `nint` and `nuint` values.

## `void` and `null`

`void` and `null` serve different purposes:

- **`void`** specifies that a function does not return a value. In low-level code, it also appears in the pointer type `void*`.
- **`null`** is a special literal representing a null pointer. It can be assigned to a raw pointer in an `unsafe` context, but not to arbitrary variables.

For example, the two forms can be used together inside an `unsafe` block:

```cvolo
unsafe
{
    void* address = null;
}
```

Pointer types and `unsafe` code are covered in a separate section. `null` is not a general-purpose type for declaring variables.