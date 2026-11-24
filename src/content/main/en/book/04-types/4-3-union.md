# 4.3 Unions

Unions (`union`) let you create types whose instances can contain **one of several variants of data**. Unlike a structure, which has all its declared fields at the same time, a union has only one active variant at any given moment.

Imagine a program that works with a table. One cell might contain a number, another might contain text, and a third might be empty. We need a type for the **contents of a cell** that can hold any of these values while keeping track of which kind of value it currently contains. A `union` is a good fit for this.

## Declaring a Union

To declare a union, use the `union` keyword. Follow it with the new type's name and list its variants inside curly braces:

```cvolo
union CellValue
{
    int Number;
    string Text;
    void Empty;
}
```

`CellValue` is the name of the declared type. It has three variants:

- `Number` - stores an integer of type `int`;
- `Text` - stores a value of type `string`;
- `Empty` - represents an empty cell and carries no data.

Each variant is declared **in the format `Type Name;`**, like a structure field. However, there is an important difference: all fields of a `struct` exist simultaneously, whereas a `union` instance contains the data of only its active variant.

For a variant that does not need to carry a value, use the type `void`. In this example, that variant is `Empty`. **Its name is not a special keyword**, and a variant without data is optional: a union may consist entirely of variants that carry data.

## Creating a Union Instance

Let's create a `CellValue` instance containing a number:

```cvolo tab="Inferred type"
var cell = CellValue
{
    Number = 42
};
```

```cvolo tab="Explicit type"
var CellValue cell = CellValue
{
    Number = 42
};
```

In both cases, `cell` has type `CellValue`, and its active variant is `Number`. The expression `Number = 42` sets that variant's contents. The `var` modifier allows the variable to be assigned a new value later.

To store a different kind of data, choose a different variant:

```cvolo
CellValue text = CellValue
{
    Text = "Hello"
};

CellValue empty = CellValue
{
    Empty = void
};
```

In `Empty = void`, the expression `void` indicates that the selected variant carries no data.

> **Important:** When creating a `union` instance using curly braces, you must specify **exactly one variant**. You cannot select several variants at once or leave all of them unspecified.

As with structure initialization, you can use `:` instead of `=`:

```cvolo
CellValue cell = CellValue
{
    Number: 42
};
```

> **Recommendation:** Both forms are valid, but we prefer `=` inside curly braces for consistency.

## Checking the Active Variant

To process a cell's contents, we first need to determine which variant is active. The `switch` construct is particularly well suited to this:

```cvolo
using System;

void PrintCell(CellValue cell)
{
    switch (cell)
    {
        case Number number:
            Console.WriteLine(number);

        case Text text:
            Console.WriteLine(text);

        case Empty:
            Console.WriteLine("The cell is empty");
    }
}
```

In this example:

- `case Number number:` selects the `Number` variant and makes its value available as `number`, of type `int`;
- `case Text text:` selects the `Text` variant and provides its string value as `text`;
- `case Empty:` handles the variant without data, so no additional variable is needed.

Thus, `switch` checks the active variant and makes its contents available. As with `enum`, there is **no automatic fallthrough to the next `case`** after the selected branch executes, so `break` is unnecessary.

### Do You Have to Check Every Variant?

**No, working with a union does not mean you must handle all its variants every time.** For example, if you are only interested in cells containing numbers, you can use `if` with an `is` pattern:

```cvolo
if (cell is Number number)
{
    Console.WriteLine(number);
}
```

The block executes only when `Number` is the active variant. Within the block, `number` contains its value. Other variants simply do not match the condition.

However, a **`switch` without a fallback branch** has an additional rule: the compiler requires every variant of the union to be covered. If you want to handle only some variants, you can add `default`:

```cvolo
switch (cell)
{
    case Number number:
        Console.WriteLine(number);

    default:
        Console.WriteLine("The cell does not contain a number");
}
```

We'll use `default` for all remaining variants throughout these examples because it makes the purpose of the fallback branch immediately clear.

For more about `switch`, see [Section 3.4, "The `switch` Statement"](../03-control-flow/3-4-switch.md).

## Accessing Variant Data Directly

In Cvolo, you can also access a variant's contents using a dot, as you would access a structure field:

```cvolo
CellValue cell = CellValue
{
    Number = 42
};

int number = cell.Number;
```

Here we know that `Number` is active because that is the variant used to create the instance.

However, **direct access using a dot does not check the active variant**. The compiler only checks whether `Number` is declared in `CellValue`. As a result, even the following code may pass type checking:

```cvolo
CellValue cell = CellValue
{
    Text = "Hello"
};

int number = cell.Number; // Do not expect a valid number.
```

This instance has the active variant `Text`, not `Number`. Reading `cell.Number` does not switch variants: the program attempts to interpret the current variant's data as an `int`. The result may be meaningless, and reading an inactive variant of a more complex type may even cause the program to fail.

> **Important:** Access variant data directly only when you **know for certain** which variant is active. If a value might contain different variants, first check it using `is` or handle it with `switch`. That way, the data is extracted from the matching variant, and other cases cannot enter that branch.

## Differences Between Structures, Enumerations, and Unions

We've now seen three ways to describe user-defined types:

| Construct | What an instance contains |
| --- | --- |
| `struct` | All declared fields at the same time. |
| `enum` | One named variant associated with an integer code. |
| `union` | One active variant, which may contain data of a particular type or no data at all. |

For example, a point's coordinates fit naturally into a `struct`. Task states (`Pending`, `Running`, `Completed`) suit an `enum`. The contents of a table cell, which might be a number, text, or empty, suit a `union`.

Union variants can contain not only built-in types (`int`, `string`, and others) but also user-defined structures and enumerations. This lets you combine different ways of organizing data.

## What's Next

We've explored structures, enums, and unions. In the next article, [4.4, "Type Composition"](4-4-composition.md), we'll see how to use these types together.

Later, we'll return to `union` through `Option<T>` and `Result<T, E>` from the language's `Base` foundation. These types represent the presence or absence of a value and a successful result or an error, respectively.
