# 3.4 The `switch` Statement

In [section 3.1](3-1-if-and-else.md), we learned how `if` and `else` let us execute code depending on a Boolean condition. Sometimes, however, we need to select an action based on **which variant a value represents**, rather than on an individual condition. Cvolo provides the `switch` statement for this purpose.

## Supported Types

In the current version of Cvolo, `switch` works with **enumerations (`enum`)** and **unions (`union`)**. These types can represent a value as one of a predefined set of variants.

Unlike some other languages, **ordinary numeric types such as `int` cannot currently be used directly in a `switch`**. The following code does not compile:

```cvolo
using System;

int main()
{
    int number = 2;

    switch (number)
    {
        default:
            Console.WriteLine("Other");
    }

    return 0;
}
```

To select an action based on a numeric value, use `if`, `else if`, and `else`, as described in [section 3.1](3-1-if-and-else.md).

## How `switch` Works

A `switch` selects the matching `case` branch based on an enumeration or union variant. The `default` branch (or `case _`) handles the remaining variants. In Cvolo, execution **does not automatically fall through to the next `case`**, so there is no need to add `break;` at the end of each branch.

We'll explore complete `switch` examples, exhaustive variant checks, and accessing union payloads in the articles about **enumerations** and **unions**, after introducing user-defined types.
