# 2.10 Type Conversions

Every value in Cvolo has a type. Its type determines how the value is stored and which operations are allowed. Sometimes a program needs to use a value of one type where a different type is expected. This is where **type conversions** come in.

For example, an integer can be converted to a floating-point number, or a `double` to a `float`. However, not all conversions preserve the original value: reducing the number of bits or converting to an integer type can cause data loss.

## Implicit Conversion

An **implicit conversion** happens without any special syntax when Cvolo allows a value to be converted from one type to another.

For example, a variable of type `short` can be used to initialize a variable of type `long`:

```cvolo
short quantity = 120;
long total = quantity;
```

Here, `quantity` has type `short`, while `total` has type `long`. A `long` uses more bits and can hold every possible `short` value, so the number `120` is preserved. The compiler performs the conversion when initializing `total`, but the type of `quantity` does not change.

Likewise, a `float` value can be used to initialize a `double`:

```cvolo
float rate = 1.5f;
double preciseRate = rate;
```

### Integer Conversions and Data Loss

In Cvolo, implicit conversions between integer types should preserve the full range of values of the source type. For example, you can convert a `short` to a `long`, but converting in the opposite direction requires an explicit cast.

```cvolo tab="Allowed"
short small = 120;
long large = small;
```

```cvolo tab="Not allowed" lines highlight="2"
int source = 300;
byte result = source; // An explicit cast is required
```

If a conversion can discard part of a number, the programmer must request it explicitly:

```cvolo
int source = 300;
byte result = (byte)source; // 44
```

The number `300` does not fit into an 8-bit `byte`. This explicit conversion keeps the lowest 8 bits, so the result is `44`. How to check for overflow during a conversion is a separate topic and is not presented here as an implemented language feature.

There is an exception for integer literals: if a number is written directly in a declaration and fits into the destination type, no cast is needed.

```cvolo tab="Allowed"
byte small = 200;
```

```cvolo tab="Not allowed" lines highlight="1"
byte small = 300; // The integer literal is too large for byte
```

Therefore, implicit conversions of integer variables must account for the ranges of their types. These ranges are listed in section [2.2 "Built-in types"](2-2-primitive-types.md).

## Explicit Conversion

When a conversion is not performed automatically, or when you want to specify the desired type, you can use an **explicit cast**. In Cvolo, the syntax is `(DesiredType)expression`:

```cvolo
int count = 42;
double asDouble = (double)count;
```

The expression `(double)count` means: take the value of `count` and convert it to `double`. You can store the result in a variable, pass it to a function, or use it in another expression.

A cast has three main parts:

- `(double)` - the type to convert the value to;
- `count` - the original expression;
- `(double)count` - the new expression, whose result has type `double`.

The original variable `count` remains an `int`. The conversion changes the **value produced by the expression**, not the type of an existing variable.

## Converting Between Integers and Floating-Point Numbers

You can explicitly convert an integer to a `float` or `double`:

```cvolo
int items = 12;
double itemsAsDouble = (double)items;
```

Converting in the other direction is also possible, but there is an important distinction: when converting a floating-point number to an integer, **the fractional part is discarded, without rounding**. For example, `8.75` becomes `8`, not `9`.

```cvolo
double positive = 8.75;
double negative = -8.75;

int first = (int)positive; // 8
int second = (int)negative; // -8
```

In both cases, the fractional part is discarded **toward zero**: `8.75` becomes `8`, and `-8.75` becomes `-8`, not `-9`. This differs from rounding to the nearest integer and from rounding down. These examples assume the original values are within the range of the destination integer type. Conversions of values that are too large, or of special floating-point values, are not covered here.

## Converting Between `float` and `double`

A `float` stores a floating-point number with less precision than a `double`. For this reason, converting a `float` to a `double` is allowed implicitly, while converting a `double` to a `float` requires an explicit cast:

```cvolo tab="Allowed"
float original = 1.25f;
double expanded = original;
float reduced = (float)expanded;
```

```cvolo tab="Not allowed" lines highlight="2"
double original = 1.25;
float reduced = original; // An explicit cast is required
```

Converting a `double` to a `float` can lose precision. Even if a number falls within the range of `float`, that type may not be able to represent it with the same precision.

Do not confuse type casting with a floating-point literal suffix. The literals `1.25` and `1.25f` produce values of different types from the start, whereas `(float)1.25` converts a value already written as a `double`. For more about literals, see section [2.3 "Literals"](2-3-literals.md).

## Example: Different Ways to Convert Values

The following program uses three conversions: explicitly narrowing an integer, converting a floating-point number to an integer, and widening a floating-point type.

```cvolo
using System;

int main()
{
    int original = 300;
    byte compact = (byte)original;

    double price = 19.75;
    int wholePrice = (int)price;

    float fraction = 1.25f;
    double expanded = fraction;

    Console.WriteLine(compact);
    Console.WriteLine(wholePrice);
    Console.WriteLine(expanded);

    return 0;
}
```

```output
44
19
1.25
```

In the first case, `300` is converted to an 8-bit `byte`, so the result is `44`. In the second, the fractional part of `19.75` is discarded. In the third, a `float` value is converted to a `double` without an explicit cast.

When converting types, it is important to distinguish two questions: **does the compiler allow the conversion?** and **will the original value be preserved without loss?** These are not always the same thing.