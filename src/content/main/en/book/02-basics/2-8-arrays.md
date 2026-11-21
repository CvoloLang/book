# 2.8 Arrays

An array stores multiple values of the same type in a specific order. These values are called **array elements**. They are stored contiguously in memory, and an individual element can be accessed using its **index** - its position within the array.

For example, instead of declaring three separate variables for product prices, we can create one array and retrieve a price by its position. Indexes start at `0`: the first element has index `0`, the second has index `1`, and the third has index `2`.

## Creating an Array

In Cvolo, a fixed-size array type is written as `Type[Size]`. The size specifies how many elements the array contains and must be known at compile time.

```cvolo
var int[3] prices = { 120, 80, 160 };
```

In this declaration:

- `int` - the type of each element;
- `[3]` - the number of elements;
- `{ 120, 80, 160 }` - the initial values in element order.

The `prices` array contains three elements:

| Index | `0` | `1` | `2` |
| --- | --- | --- | --- |
| Value | `120` | `80` | `160` |

The number of elements is fixed when the array is created: you cannot add a fourth element or resize the array. The size is also part of the array's type, so `int[3]` and `int[4]` are different types.

## Accessing Elements

To read an element, write its index in square brackets after the array name:

```cvolo
val firstPrice = prices[0];  // 120
val lastPrice = prices[2];   // 160
```

An index can be more than a number written directly in the code: it can also be an expression that produces an integer value. This lets a program select an element at runtime.

## Array Mutability

Like an ordinary variable, an array can be mutable or immutable. **An array is immutable by default unless it is declared with `var`.** This also applies to its elements:

- `var` - element values can be changed by index;
- `val`, or a declaration without `var` - elements can be read, but their values cannot be changed.

```cvolo tab="Mutable array" lines highlight="2"
var int[3] prices = { 120, 80, 160 };
prices[1] = 90; // Allowed: the second element is now 90
```

```cvolo tab="Immutable array" lines highlight="2"
int[3] prices = { 120, 80, 160 };
prices[1] = 90; // Not allowed: var was not specified
```

The declarations `int[3] prices = { 120, 80, 160 };` and `val int[3] prices = { 120, 80, 160 };` are **equivalent**: both declare an immutable variable of type `int[3]`. When the type is specified explicitly, `val` can be omitted. As with other variables, an array's type and mutability are independent properties - this rule is explained in section [2.2 "Built-in types"](2-2-primitive-types.md). The array's size remains fixed regardless of its mutability. For more on variable mutability, see section [2.1 "Variables and Mutability"](2-1-variables-and-mutability.md).

## Example: Product Prices

This program stores the prices of three products. It then updates the second product's price and calculates the total using the array elements.

```cvolo
using System;

int main()
{
    var int[3] prices = { 120, 80, 160 };

    Console.WriteLine(prices[0]); // First product: 120
    Console.WriteLine(prices[2]); // Third product: 160

    val selectedIndex = 1;
    prices[selectedIndex] = 90;  // Update the second product's price
    Console.WriteLine(prices[1]);

    val total = prices[0] + prices[1] + prices[2];
    Console.WriteLine(total);

    return 0;
}
```

```output
120
160
90
370
```

The `selectedIndex` variable stores an element's index, not its value: `1` selects the second product, whose price becomes `90` after the assignment. The array's size does not change.

## Other Ways to Initialize Arrays

The compiler can infer the element type and array size from the values inside the braces, so they do not always have to be specified explicitly:

```cvolo
var numbers = { 10, 20, 30 }; // int[3]
```

When you need an array of a particular size, you can initialize it with zeros using empty braces, or fill every element with the same value:

```cvolo
var int[4] counters = {}; // { 0, 0, 0, 0 }
var int[4] levels(7);    // { 7, 7, 7, 7 }
```

With an empty initializer `{}`, the type and size must be specified explicitly because the compiler cannot infer them from elements that are not present. When listing values in `{ ... }`, the number of elements must match the declared size.

## Array Bounds

An array with three elements has valid indexes `0`, `1`, and `2`. Index `3` does not refer to a fourth element because there is no such element.

Cvolo checks array bounds when accessing elements. If an index is outside the valid range, the program terminates with a runtime error. This prevents reading or writing memory outside the array.

## Arrays and Slices

In Cvolo, `int[3]` and `int[]` mean different things:

- `int[3]` - an array of three elements whose size is known at compile time;
- `int[]` - a **slice**, used to work with a sequence of elements whose length may be determined at runtime.

A slice is a view into an existing region of memory, not an array whose number of elements can be changed. We will cover slices in more detail later.